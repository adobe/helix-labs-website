// eslint-disable-next-line import/no-unresolved
import DataLoader from '@adobe/rum-loader';
import AbstractCrawler from '../abstractcrawler.js';
import CrawlerRegistry from '../crawlerregistry.js';
import CrawlerImageValues from '../crawlerimagevalues.js';
import CrawlerUtil from '../util/crawlerutil.js';
import CrawlerPageParser from '../util/crawlerpageparser.js';
import HtmlCrawlerRegistry from '../util/htmlcrawlerregistry.js';
import ImageUrlParserRegistry from '../util/imageurlparserregistry.js';
import ImageAuditUtil from '../../util/imageauditutil.js';
import PromisePool from '../../util/promisepool.js';
import UrlResourceHandler from '../../util/urlresourcehandler.js';

const MIN_DIMENSION = 32;
const MAX_CARD_DIMENSION = 256;
const MAX_MEDIUM_DIMENSION = 800;
const MAX_DETAIL_DIMENSION = 1024;

/**
 * RUM Media Crawler - discovers images from RUM viewmedia events,
 * then crawls the pages to get full metadata.
 * Uses media events to drive discovery.
 */
class RumMediaCrawler extends AbstractCrawler {
  #stopped = false;

  #duplicateFilter = new Set();

  #handledPages = new Set(); // Rapid lookup for pages already crawled

  #imagesToCrawl = []; // List of images to process

  #siteOrigin = null;

  #domain = null;

  #rumData = null; // Store RUM data for quick lookup

  #failedUrls = new Set(); // Track URLs that don't exist (404, errors)

  /**
   * Normalize a CrawlerImageValues object so that URLs are safe to fetch:
   * - restrict to trusted domains
   * - convert production-domain URLs to internal site URLs
   * @param {CrawlerImageValues} imgData
   * @returns {CrawlerImageValues|null}
   */
  #normalizeParsedPageImage(imgData) {
    try {
      const originalHref = imgData?.imageOptions?.original?.href || imgData?.src;
      if (!originalHref) return null;

      // SECURITY: Only process trusted domains
      if (!this.#isTrustedDomain(originalHref)) return null;

      const internalOriginalHref = this.#transformToInternalUrl(originalHref);
      if (!internalOriginalHref) return null;

      const internalOriginalUrl = new URL(internalOriginalHref);

      const internalizeOption = (opt) => {
        if (!opt?.href) return null;
        if (!this.#isTrustedDomain(opt.href)) return null;
        const internalHref = this.#transformToInternalUrl(opt.href);
        return internalHref ? { ...opt, href: internalHref } : null;
      };

      const original = internalizeOption(imgData.imageOptions.original) || {
        href: internalOriginalUrl.href,
        width: imgData.width,
        height: imgData.height,
      };

      const detail = internalizeOption(imgData.imageOptions.detail) || original;
      const medium = internalizeOption(imgData.imageOptions.medium) || original;
      const card = internalizeOption(imgData.imageOptions.card) || original;

      return new CrawlerImageValues({
        site: imgData.site,
        origin: imgData.origin,
        // src should match the URL we will actually fetch/identify
        src: internalOriginalUrl.href,
        imageOptions: {
          original,
          detail,
          medium,
          card,
        },
        alt: imgData.alt,
        width: imgData.width,
        height: imgData.height,
        invalidDimensions: imgData.invalidDimensions,
        aspectRatio: imgData.aspectRatio,
        instance: imgData.instance,
        fileType: imgData.fileType,
        pageLastModified: imgData.pageLastModified,
        assetLastModified: imgData.assetLastModified,
      });
    } catch {
      return null;
    }
  }

  /**
   * Check if a URL is from a trusted domain (production or internal).
   * @param {string} url - The URL to check
   * @returns {boolean} true if trusted
   */
  #isTrustedDomain(url) {
    try {
      const hostname = new URL(url).hostname;
      const siteHostname = new URL(this.#siteOrigin).hostname;
      
      return hostname === this.#domain || hostname === siteHostname;
    } catch {
      return false;
    }
  }

  /**
   * Transform a production domain URL to internal site URL for fetching.
   * @param {string} url - The URL to transform
   * @returns {string|null} The transformed URL or null if invalid
   */
  #transformToInternalUrl(url) {
    try {
      const parsed = new URL(url);
      
      // If it's already on the internal site domain, use as-is
      if (parsed.hostname === new URL(this.#siteOrigin).hostname) {
        return url;
      }
      
      // If it's on the production domain, transform to internal domain
      if (parsed.hostname === this.#domain) {
        return `${this.#siteOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      
      // Not a trusted domain
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Transform an internal site URL to production domain URL for consistency.
   * @param {string} url - The URL to transform
   * @returns {string} The transformed URL
   */
  #transformToProductionUrl(url) {
    try {
      const parsed = new URL(url);
      
      // If it's on the internal site domain, transform to production
      if (parsed.hostname === new URL(this.#siteOrigin).hostname) {
        return `https://${this.#domain}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      
      // Already on production domain or other, return as-is
      return url;
    } catch {
      return url;
    }
  }

  static get type() {
    return 'rum-media';
  }

  static get displayName() {
    return 'RUM Media Crawler';
  }

  static get description() {
    return 'Discovers pages from RUM, then fills gaps with viewmedia events (requires RUM credentials)';
  }

  static getFormConfig() {
    return {
      visibleFields: [
        'site-url',
        'replacement-domain',
        'domain-key',
        'identity-selectors',
      ],
      requiredFields: ['site-url', 'replacement-domain', 'domain-key'],
      helpText: {
        'site-url': 'Origin URL for fetching page content. Paths will be trimmed.',
        'replacement-domain': 'RUM production domain (e.g., example.com)',
        'domain-key': 'RUM domain key for API access',
      },
      placeholders: {
        'site-url': 'https://main--repo--org.aem.live',
        'replacement-domain': 'example.com',
      },
    };
  }

  stop() {
    this.#stopped = true;
  }

  /**
   * Accept when crawler-type is 'rum-media' and RUM credentials are provided
   */
  static accept(sitemapFormData) {
    return sitemapFormData['crawler-type'] === this.type
      && sitemapFormData['replacement-domain']
      && sitemapFormData['domain-key'];
  }

  /**
   * Fetches 25 months of RUM data and collects viewmedia events.
   * Returns the list of media events to be processed in batches.
   */
  async fetchCrawlerData(formData) {
    const domain = formData['replacement-domain'];
    const domainKey = formData['domain-key'];
    const siteUrl = formData['site-url'];

    // Store for later use
    this.#siteOrigin = new URL(siteUrl).origin;
    this.#domain = domain;

    const loader = new DataLoader();
    loader.apiEndpoint = 'https://bundles.aem.page';
    loader.domain = domain;
    loader.domainKey = domainKey;

    // eslint-disable-next-line no-console
    console.log(`RUM Media Crawler: Fetching 25 months of data for ${domain}...`);

    // Fetch 25 months of data
    const chunks = await loader.fetchPrevious12Months(null);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 13);
    const olderChunks = await loader.fetchPrevious12Months(endDate);
    const allChunks = [...chunks, ...olderChunks];

    // Build RUM data structure for quick lookup: pageUrl -> [mediaUrls]
    const pageToMediaMap = new Map();
    const mediaEvents = [];

    allChunks.forEach((chunk) => {
      const bundles = chunk.rumBundles || [];
      bundles.forEach((bundle) => {
        if (this.#stopped) return;

        // Filter to only production domain
        let bundleHostname;
        try {
          bundleHostname = new URL(bundle.url).hostname;
        } catch {
          return;
        }

        if (bundleHostname !== domain) {
          return;
        }

        const pageUrl = bundle.url;

        // Collect viewmedia events
        const viewmediaEvents = (bundle.events || [])
          .filter((evt) => evt.checkpoint === 'viewmedia' && evt.target);

        viewmediaEvents.forEach((evt) => {
          const mediaUrl = evt.target;

          // Skip invalid URLs
          if (!mediaUrl
            || mediaUrl.includes('<')
            || mediaUrl.includes('>')
            || mediaUrl.startsWith('about:')
            || mediaUrl.startsWith('data:')
            || mediaUrl.startsWith('blob:')) {
            return;
          }

          // Validate and normalize URL
          let parsedUrl;
          try {
            parsedUrl = new URL(mediaUrl, pageUrl);
          } catch {
            return;
          }

          // SECURITY: Only process trusted domains
          if (!this.#isTrustedDomain(parsedUrl.href)) {
            return;
          }

          // Transform production domain to internal domain for consistency
          const normalizedUrl = this.#transformToInternalUrl(parsedUrl.href) || parsedUrl.href;

          // Store for quick lookup
          if (!pageToMediaMap.has(pageUrl)) {
            pageToMediaMap.set(pageUrl, new Set());
          }
          pageToMediaMap.get(pageUrl).add(normalizedUrl);

          // Store event for processing
          mediaEvents.push({
            mediaUrl: normalizedUrl,
            pageUrl,
            source: evt.source,
          });
        });
      });
    });

    this.#rumData = pageToMediaMap;

    // eslint-disable-next-line no-console
    console.log(`RUM Media Crawler: Found ${mediaEvents.length} viewmedia events across ${pageToMediaMap.size} pages`);

    // Return media events - actual crawling happens in fetchBatch
    return mediaEvents;
  }

  /**
   * Crawl a single page and extract all image URLs
   */
  async #crawlPageForImages(productionPageUrl) {
    const images = [];

    try {
      // Map production URL to fetchable URL
      const productionPathname = new URL(productionPageUrl).pathname;
      const fetchablePageUrl = `${this.#siteOrigin}${productionPathname}`;
      const plainUrl = `${fetchablePageUrl.endsWith('/') ? `${fetchablePageUrl}index` : fetchablePageUrl}.plain.html`;

      const pageResult = await CrawlerUtil.fetchPageDocument(plainUrl, { includeMetadata: true });
      if (!pageResult || !pageResult.doc) {
        return images;
      }

      const { doc } = pageResult;
      const { origin } = new URL(fetchablePageUrl);

      const imgElements = doc.querySelectorAll('img[src]');
      
      imgElements.forEach((img) => {
        const src = img.getAttribute('src');
        if (!src) return;

        try {
          const originalUrl = new URL(src, origin);
          
          // SECURITY: Only process images from trusted domains
          if (!this.#isTrustedDomain(originalUrl.href)) {
            return;
          }

          const internalUrl = this.#transformToInternalUrl(originalUrl.href);
          if (!internalUrl) {
            return;
          }
          
          const urlToUse = new URL(internalUrl);
          if (CrawlerUtil.isUrlValid(urlToUse)) {
            images.push({
              href: urlToUse.href,
              pageUrl: productionPageUrl,
              discoveredVia: 'page-crawl',
            });
          }
        } catch {
          // Skip invalid URLs
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`RUM Media Crawler: Failed to crawl page ${productionPageUrl}:`, error.message);
    }

    return images;
  }

  /**
   * Validate that an image URL exists with a HEAD request.
   * Transforms production URLs to internal URLs before checking.
   * @param {string} url - The image URL to validate
   * @returns {Promise<boolean>} true if the image exists, false otherwise
   */
  async #validateImageExists(url) {
    // Check cache first
    if (this.#failedUrls.has(url)) {
      return false;
    }

    // Transform to internal URL for fetching
    const internalUrl = this.#transformToInternalUrl(url);
    if (!internalUrl) {
      this.#failedUrls.add(url);
      return false;
    }

    try {
      const response = await UrlResourceHandler.fetch(internalUrl, { method: 'HEAD' });
      const exists = response.ok;
      
      if (!exists) {
        this.#failedUrls.add(url);
      }
      
      return exists;
    } catch (error) {
      // Network error or other issue
      this.#failedUrls.add(url);
      return false;
    }
  }

  /**
   * Returns viewmedia events that should be checked after page crawling.
   * No longer needed with inverted approach.
   */
  getViewmediaEvents() {
    return null;
  }

  /**
   * Process a batch of media events.
   * For each event: crawl page if needed, add all images from page with correct instance counts.
   * Then add any RUM media that wasn't found in the page.
   */
  async fetchBatch(batch, maxBatchSize, pageCounterIncrement) {
    const results = [];
    const promisePool = new PromisePool(Infinity, 'RUM Media crawler fetchBatch pool');

    for (let i = 0; !this.#stopped && i < maxBatchSize; i += 1) {
      promisePool.run(async () => {
        while (batch.length > 0 && !this.#stopped) {
          const event = batch.shift();
          const { pageUrl } = event;

          // Step 1 & 2: Check if page already handled
          if (this.#handledPages.has(pageUrl)) {
            continue;
          }

          this.#handledPages.add(pageUrl);
          const seenImagePaths = new Set(); // Track images found on this page

          // Step 2: Crawl the page for all images (with correct instance counts)
          // eslint-disable-next-line no-await-in-loop
          const pageImages = await this.#fetchImageDataFromPage(pageUrl);
          
          // Track which images we found in the page
          pageImages.forEach((imgData) => {
            try {
              const imgPathname = new URL(imgData.imageOptions.original.href).pathname;
              seenImagePaths.add(imgPathname);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.debug(`Invalid image src: ${imgData?.imageOptions?.original?.href || imgData?.src}`);
            }
          });
          
          results.push(...pageImages);

          // Increment page counter for this page
          pageCounterIncrement();

          // Step 3: Get other media from RUM for this page that weren't in the HTML
          const otherMediaOnPage = this.#rumData.get(pageUrl) || new Set();
          const rumMediaPromises = [];
          
          otherMediaOnPage.forEach((mediaUrl) => {
            try {
              const mediaPathname = new URL(mediaUrl).pathname;
              
              if (!seenImagePaths.has(mediaPathname) && !this.#failedUrls.has(mediaUrl)) {
                seenImagePaths.add(mediaPathname);
                
                // This image had viewmedia events but isn't in the current HTML
                // Add it as a single instance
                const promise = this.#validateImageExists(mediaUrl).then((exists) => {
                  if (exists) {
                    return this.#fetchImageMetadata({
                      href: mediaUrl,
                      pageUrl,
                    });
                  }
                  return null;
                }).then((imgData) => {
                  if (imgData) {
                    results.push(imgData);
                  }
                }).catch((error) => {
                  // eslint-disable-next-line no-console
                  console.warn(`Error fetching ${mediaUrl}:`, error);
                });
                
                rumMediaPromises.push(promise);
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.debug(`Invalid media URL from RUM: ${mediaUrl}`);
            }
          });
          
          // Wait for all RUM media to be processed before continuing
          // eslint-disable-next-line no-await-in-loop
          await Promise.allSettled(rumMediaPromises);
        }
      });
    }

    await promisePool.allSettled();
    return results;
  }

  /**
   * Fetch all images from a page (similar to sitemap crawler)
   */
  async #fetchImageDataFromPage(productionPageUrl) {
    try {
      // Map production URL to fetchable URL
      const productionPathname = new URL(productionPageUrl).pathname;
      const fetchablePageUrl = `${this.#siteOrigin}${productionPathname}`;
      const htmlCrawler = HtmlCrawlerRegistry.getCrawler(fetchablePageUrl);
      const plainUrl = htmlCrawler ? htmlCrawler.getPlainUrl(fetchablePageUrl)
        : `${fetchablePageUrl.endsWith('/') ? `${fetchablePageUrl}index` : fetchablePageUrl}.plain.html`;
      const { origin } = new URL(fetchablePageUrl);

      return CrawlerPageParser.parsePageForImages({
        pageUrl: fetchablePageUrl,
        plainUrl,
        origin,
        getOptimizedImageUrl: (src, orig, width, height, maxDimension) => ImageUrlParserRegistry
          .getOptimizedImageUrl(src, orig, width, height, maxDimension),
      }).then((imgs) => imgs
        .map((img) => this.#normalizeParsedPageImage(img))
        .filter((img) => img !== null));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`RUM Media Crawler: Error fetching page ${productionPageUrl}:`, error);
      return [];
    }
  }

  /**
   * Fetch full metadata for a single image from RUM viewmedia event
   */
  async #fetchImageMetadata(imageItem) {
    try {
      const { href, pageUrl } = imageItem;

      // Map production page URL to fetchable URL
      const productionPathname = new URL(pageUrl).pathname;
      const fetchablePageUrl = `${this.#siteOrigin}${productionPathname}`;
      const htmlCrawler = HtmlCrawlerRegistry.getCrawler(fetchablePageUrl);
      const plainUrl = htmlCrawler ? htmlCrawler.getPlainUrl(fetchablePageUrl)
        : `${fetchablePageUrl.endsWith('/') ? `${fetchablePageUrl}index` : fetchablePageUrl}.plain.html`;

      // Fetch the page to get metadata
      const pageResult = await CrawlerUtil.fetchPageDocument(plainUrl, { includeMetadata: true });
      const pageLastModified = pageResult?.lastModified ? pageResult.lastModified.getTime() : null;

      let alt = '';
      let width = MIN_DIMENSION;
      let height = MIN_DIMENSION;
      let instance = 1;
      // Default to the internal URL for consistency with proxy/security expectations
      let src = this.#transformToInternalUrl(href) || href;
      const origin = new URL(fetchablePageUrl).origin;

      if (pageResult?.doc) {
        // Find this specific image in the page
        const images = pageResult.doc.querySelectorAll('img[src]');
        const seenMap = new Map();

        // eslint-disable-next-line no-restricted-syntax
        for (const img of images) {
          const imgSrc = img.getAttribute('src');
          if (!imgSrc) continue;

          try {
            const imgUrl = new URL(imgSrc, fetchablePageUrl);
            const imgHref = this.#transformToInternalUrl(imgUrl.href) || imgUrl.href;

            // Track instances
            const srcKey = `${imgUrl.hostname}${imgUrl.pathname}`;
            if (seenMap.has(srcKey)) {
              seenMap.set(srcKey, seenMap.get(srcKey) + 1);
            } else {
              seenMap.set(srcKey, 1);
            }

            // Check if this is our image (compare normalized URLs)
            const hrefToCompare = this.#transformToInternalUrl(href) || href;
            if (imgHref.split('#')[0] === hrefToCompare.split('#')[0]) {
              alt = img.getAttribute('alt') || '';
              width = parseInt(img.getAttribute('width'), 10) || MIN_DIMENSION;
              height = parseInt(img.getAttribute('height'), 10) || MIN_DIMENSION;
              instance = seenMap.get(srcKey);
              src = imgHref; // Use the normalized URL we will actually fetch
              break;
            }
          } catch {
            // Skip invalid URLs
          }
        }
      }

      const invalidDimensions = width === MIN_DIMENSION || height === MIN_DIMENSION;
      const aspectRatio = parseFloat((width / height).toFixed(1)) || '';
      
      // For optimization, use reasonable defaults when dimensions are unknown
      const optWidth = (width === MIN_DIMENSION) ? 2048 : width;
      const optHeight = (height === MIN_DIMENSION) ? 2048 : height;

      // Create originalUrl from src and origin (like sitemap crawler)
      const originalUrl = new URL(src, origin);
      const original = { href: originalUrl.href, height, width };

      // Create optimized image URLs using optWidth/optHeight
      const detail = ImageUrlParserRegistry.getOptimizedImageUrl(
        src, origin, optWidth, optHeight, MAX_DETAIL_DIMENSION,
      );
      const medium = ImageUrlParserRegistry.getOptimizedImageUrl(
        src, origin, optWidth, optHeight, MAX_MEDIUM_DIMENSION,
      );
      const card = ImageUrlParserRegistry.getOptimizedImageUrl(
        src, origin, optWidth, optHeight, MAX_CARD_DIMENSION,
      );

      const imageOptions = {
        original,
        detail: detail || original,
        medium: medium || original,
        card: card || original,
      };

      const fileType = ImageAuditUtil.getFileType(src);

      // Fetch asset Last-Modified
      const assetLastModified = await CrawlerUtil.fetchAssetLastModified(originalUrl.href);

      return new CrawlerImageValues({
        site: fetchablePageUrl,
        origin,
        src,
        imageOptions,
        alt,
        width,
        height,
        invalidDimensions,
        aspectRatio,
        instance,
        fileType,
        pageLastModified,
        assetLastModified: assetLastModified ? assetLastModified.getTime() : null,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`RUM Media Crawler: Error fetching metadata for ${imageItem.href}:`, error);
      return null;
    }
  }

  // Optimization is handled via ImageUrlParserRegistry
}

export default RumMediaCrawler;

CrawlerRegistry.registerCrawler(RumMediaCrawler);
