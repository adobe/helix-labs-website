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

// RUM "viewmedia" can include videos and other media. This crawler currently only supports images.
const ALLOWED_IMAGE_FILE_TYPES = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'tif', 'tiff', 'bmp',
]);

/**
 * RUM Media Crawler - discovers images from RUM viewmedia events,
 * then crawls the pages to get full metadata.
 * Uses media events to drive discovery.
 */
class RumMediaCrawler extends AbstractCrawler {
  #stopped = false;

  #handledPages = new Set(); // Rapid lookup for pages already crawled

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
   * Returns the list of unique pages to be processed in batches.
   *
   * IMPORTANT: The UI's counters treat the returned list as "pages to crawl"
   * (total-counter = list length, pages-counter increments once per handled page).
   * So for the RUM crawler we must return pages (not raw media events), and keep
   * the media-event details in-memory (this.#rumData) for gap-filling.
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

    // Build RUM data structure for quick lookup: productionPageUrl -> Set<internalMediaUrl>
    const pageToMediaMap = new Map();

    const normalizePageUrl = (rawUrl) => {
      try {
        const u = new URL(rawUrl);
        // Hash never impacts EDS HTML; strip it.
        u.hash = '';

        // Keep query params unless they are purely tracking (prevents duplicate crawling/ids).
        const params = new URLSearchParams(u.search);
        const keys = [...params.keys()];
        const isTrackingKey = (k) => /^utm_/i.test(k) || ['gclid', 'fbclid', 'msclkid'].includes(k.toLowerCase());
        const allTracking = keys.length > 0 && keys.every(isTrackingKey);
        if (allTracking) u.search = '';

        return u.href;
      } catch {
        return null;
      }
    };

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

        const pageUrl = normalizePageUrl(bundle.url);
        if (!pageUrl) return;

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

          // Only keep image media types (viewmedia can include videos, etc.)
          const mediaType = ImageAuditUtil.getFileType(parsedUrl.pathname);
          if (!ALLOWED_IMAGE_FILE_TYPES.has(mediaType)) {
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

        });
      });
    });

    this.#rumData = pageToMediaMap;

    // eslint-disable-next-line no-console
    console.log(`RUM Media Crawler: Found viewmedia events across ${pageToMediaMap.size} pages`);

    // Return unique pages to crawl; media details stay in this.#rumData
    return [...pageToMediaMap.keys()];
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
   * Process a batch of pages.
   * For each page:
   * - crawl the page (if not already handled) and add all images from HTML with correct instances
   * - then add any RUM media for that page that wasn't found in the current HTML
   */
  async fetchBatch(batch, maxBatchSize, pageCounterIncrement) {
    const results = [];
    const promisePool = new PromisePool(Infinity, 'RUM Media crawler fetchBatch pool');

    const getDurableAssetKey = (url) => {
      try {
        const u = new URL(url);
        return ImageUrlParserRegistry.getDurableIdentityPart(u) || u.pathname;
      } catch {
        return null;
      }
    };

    const enqueue = (imgData) => {
      if (imgData) results.push(imgData);
    };

    const ensureLoadableImage = async (imgData) => {
      if (!imgData?.imageOptions?.original?.href) return null;
      const cardHref = imgData?.imageOptions?.card?.href;
      const originalHref = imgData.imageOptions.original.href;

      // Prefer the URL we will load (card). If it fails but original works, fall back to original.
      if (cardHref && cardHref !== originalHref) {
        // eslint-disable-next-line no-await-in-loop
        const cardOk = await this.#validateImageExists(cardHref);
        if (cardOk) return imgData;
      }

      // eslint-disable-next-line no-await-in-loop
      const originalOk = await this.#validateImageExists(originalHref);
      if (!originalOk) {
        return null;
      }

      // Original exists; make sure the card URL we will load is also safe.
      // This avoids repeated imageOnError spam when an optimization variant is unsupported.
      const original = imgData.imageOptions.original;
      return new CrawlerImageValues({
        site: imgData.site,
        origin: imgData.origin,
        src: imgData.src,
        imageOptions: {
          original,
          detail: imgData.imageOptions.detail || original,
          medium: imgData.imageOptions.medium || original,
          card: original,
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
    };

    for (let i = 0; !this.#stopped && i < maxBatchSize; i += 1) {
      promisePool.run(async () => {
        while (batch.length > 0 && !this.#stopped) {
          const pageUrl = batch.shift(); // production URL (as returned by fetchCrawlerData)
          if (!pageUrl) continue;

          // Step 1 & 2: Check if page already handled
          if (this.#handledPages.has(pageUrl)) {
            continue;
          }

          this.#handledPages.add(pageUrl);
          // Count this page as "handled" immediately, even if the crawl later fails.
          // This prevents the UI counter from staying at 0 due to downstream errors.
          try {
            if (typeof pageCounterIncrement === 'function') pageCounterIncrement();
          } catch {
            // ignore counter errors
          }
          // Track which assets we saw in the HTML so we don't add them again from RUM.
          // Use durable asset key (not pathname) because the same mediabus asset can appear
          // under different paths (e.g., /media_... vs /blog/media_...).
          const seenAssetKeys = new Set();
          const loadableAssetKeyCache = new Map(); // durableKey -> boolean

          // Step 2: Crawl the page for all images (with correct instance counts)
          // eslint-disable-next-line no-await-in-loop
          const pageImages = await this.#fetchImageDataFromPage(pageUrl);
          const skipPageFetchForRumOnly = pageImages.length === 0;

          // Validate/enqueue HTML images:
          // - only count an asset as "seen in HTML" if at least one loadable URL exists
          // - keep real multiple usages via instance (1..N)
          // - avoid duplicate outputs via enqueue gate
          // eslint-disable-next-line no-restricted-syntax
          for (const imgData of pageImages) {
            const key = getDurableAssetKey(imgData?.imageOptions?.original?.href || imgData?.src);
            if (!key) continue;

            if (!loadableAssetKeyCache.has(key)) {
              // eslint-disable-next-line no-await-in-loop
              const loadable = await ensureLoadableImage(imgData);
              loadableAssetKeyCache.set(key, !!loadable);
              if (loadable) {
                seenAssetKeys.add(key);
                enqueue(loadable);
              }
            } else if (loadableAssetKeyCache.get(key)) {
              // We already proved this asset is loadable; enqueue this instance too.
              // eslint-disable-next-line no-await-in-loop
              const loadable = await ensureLoadableImage(imgData);
              if (loadable) {
                seenAssetKeys.add(key);
                enqueue(loadable);
              }
            }
          }

          // Step 3: Get other media from RUM for this page that weren't in the HTML
          const otherMediaOnPage = this.#rumData.get(pageUrl) || new Set();
          const rumMediaPromises = [];
          
          otherMediaOnPage.forEach((mediaUrl) => {
            try {
              const mediaType = ImageAuditUtil.getFileType(new URL(mediaUrl).pathname);
              if (!ALLOWED_IMAGE_FILE_TYPES.has(mediaType)) return;

              const mediaKey = getDurableAssetKey(mediaUrl);
              if (!mediaKey) return;
              
              if (!seenAssetKeys.has(mediaKey) && !this.#failedUrls.has(mediaUrl)) {
                seenAssetKeys.add(mediaKey);
                
                // This image had viewmedia events but isn't in the current HTML
                // Add it as a single instance
                const promise = this.#validateImageExists(mediaUrl).then((exists) => {
                  if (exists) {
                    return this.#fetchImageMetadata({
                      href: mediaUrl,
                      pageUrl,
                      skipPageFetch: skipPageFetchForRumOnly,
                    });
                  }
                  return null;
                }).then((imgData) => {
                  // Validate before enqueueing to avoid repeated load errors (and keep 404s out).
                  return ensureLoadableImage(imgData).then((loadable) => {
                    if (loadable) {
                      const key = getDurableAssetKey(loadable?.imageOptions?.original?.href || loadable?.src);
                      if (key) seenAssetKeys.add(key);
                      enqueue(loadable);
                    }
                  });
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
      // Fetch by pathname, but keep the query string on the "site" field so query-distinct pages
      // remain distinct in reporting/identity keys.
      const prodUrl = new URL(productionPageUrl);
      const fetchableBaseUrl = `${this.#siteOrigin}${prodUrl.pathname}`;
      const siteUrl = `${this.#siteOrigin}${prodUrl.pathname}${prodUrl.search || ''}`;

      const htmlCrawler = HtmlCrawlerRegistry.getCrawler(fetchableBaseUrl);
      const plainUrl = htmlCrawler ? htmlCrawler.getPlainUrl(fetchableBaseUrl)
        : `${fetchableBaseUrl.endsWith('/') ? `${fetchableBaseUrl}index` : fetchableBaseUrl}.plain.html`;
      const { origin } = new URL(fetchableBaseUrl);

      return CrawlerPageParser.parsePageForImages({
        pageUrl: siteUrl,
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
      const { href, pageUrl, skipPageFetch = false } = imageItem;
      const fileType = ImageAuditUtil.getFileType(href);
      if (!ALLOWED_IMAGE_FILE_TYPES.has(fileType)) {
        return null;
      }

      // Map production page URL to fetchable URL (fetch by pathname), but preserve query for reporting
      const prodUrl = new URL(pageUrl);
      const fetchableBaseUrl = `${this.#siteOrigin}${prodUrl.pathname}`;
      const siteUrl = `${this.#siteOrigin}${prodUrl.pathname}${prodUrl.search || ''}`;
      const htmlCrawler = HtmlCrawlerRegistry.getCrawler(fetchableBaseUrl);
      const plainUrl = htmlCrawler ? htmlCrawler.getPlainUrl(fetchableBaseUrl)
        : `${fetchableBaseUrl.endsWith('/') ? `${fetchableBaseUrl}index` : fetchableBaseUrl}.plain.html`;

      // Fetch the page to get metadata (optional). For missing/404 pages, we can still generate
      // optimized image variants using EDS knowledge and default dimensions.
      let pageResult = null;
      let pageLastModified = null;
      if (!skipPageFetch) {
        pageResult = await CrawlerUtil.fetchPageDocument(plainUrl, { includeMetadata: true });
        pageLastModified = pageResult?.lastModified ? pageResult.lastModified.getTime() : null;
      }

      let alt = '';
      let width = MIN_DIMENSION;
      let height = MIN_DIMENSION;
      let instance = 1;
      // Default to the internal URL for consistency with proxy/security expectations
      let src = this.#transformToInternalUrl(href) || href;
      const origin = new URL(fetchableBaseUrl).origin;

      if (pageResult?.doc) {
        // Find this specific image in the page
        const images = pageResult.doc.querySelectorAll('img[src]');
        const seenMap = new Map();

        // eslint-disable-next-line no-restricted-syntax
        for (const img of images) {
          const imgSrc = img.getAttribute('src');
          if (!imgSrc) continue;

          try {
            const imgUrl = new URL(imgSrc, fetchableBaseUrl);
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

      // Fetch asset Last-Modified
      const assetLastModified = await CrawlerUtil.fetchAssetLastModified(originalUrl.href);

      return new CrawlerImageValues({
        site: siteUrl,
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
