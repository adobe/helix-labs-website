// eslint-disable-next-line import/no-unresolved
import DataLoader from '@adobe/rum-loader';
import AbstractCrawler from '../abstractcrawler.js';
import CrawlerRegistry from '../crawlerregistry.js';
import CrawlerImageValues from '../crawlerimagevalues.js';
import CrawlerUtil from '../util/crawlerutil.js';
import ImageAuditUtil from '../../util/imageauditutil.js';
import PromisePool from '../../util/promisepool.js';

const MIN_DIMENSION = 32;
const MAX_CARD_DIMENSION = 256;
const MAX_MEDIUM_DIMENSION = 800;
const MAX_DETAIL_DIMENSION = 1024;

/**
 * RUM Media Crawler - fetches images from RUM viewmedia events
 * instead of crawling sitemaps.
 */
class RumMediaCrawler extends AbstractCrawler {
  #stopped = false;

  #duplicateFilter = new Set();

  #mediaData = new Map(); // mediaUrl -> { pages: Set, totalWeight: number }

  #siteOrigin = null;

  static get type() {
    return 'rum-media';
  }

  static get displayName() {
    return 'RUM Media Crawler';
  }

  static get description() {
    return 'Discovers images from RUM viewmedia events (requires RUM credentials)';
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
   * Fetches 25 months of RUM data and extracts viewmedia events.
   * Returns an array of unique media URLs with their page contexts.
   */
  async fetchSitemap(sitemapFormData) {
    const domain = sitemapFormData['replacement-domain'];
    const domainKey = sitemapFormData['domain-key'];
    const siteUrl = sitemapFormData['site-url'];

    // Store the site origin for domain resolution
    this.#siteOrigin = new URL(siteUrl).origin;

    const loader = new DataLoader();
    loader.apiEndpoint = 'https://bundles.aem.page';
    loader.domain = domain;
    loader.domainKey = domainKey;

    // eslint-disable-next-line no-console
    console.log(`RUM Media Crawler: Fetching 25 months of data for ${domain}...`);

    // Fetch 25 months of data
    const chunks = await loader.fetchPrevious12Months(null);

    // Also fetch the previous 13 months to get 25 total
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - 13);
    const olderChunks = await loader.fetchPrevious12Months(endDate);

    const allChunks = [...chunks, ...olderChunks];

    // Process bundles to extract viewmedia events
    // Only process bundles from the production domain
    allChunks.forEach((chunk) => {
      const bundles = chunk.rumBundles || [];
      bundles.forEach((bundle) => {
        if (this.#stopped) return;

        // Filter bundles to only include those from the production domain
        let bundleHostname;
        try {
          bundleHostname = new URL(bundle.url).hostname;
        } catch {
          return; // Skip invalid bundle URLs
        }

        if (bundleHostname !== domain) {
          return; // Skip bundles from other domains (preview, staging, other branches)
        }

        const viewmediaEvents = (bundle.events || [])
          .filter((evt) => evt.checkpoint === 'viewmedia' && evt.target);

        viewmediaEvents.forEach((evt) => {
          const mediaUrl = evt.target;

          // Skip invalid or malformed URLs
          // Check for angle brackets (both raw and URL-encoded)
          if (!mediaUrl
            || mediaUrl.includes('<')
            || mediaUrl.includes('>')
            || mediaUrl.includes('%3C')
            || mediaUrl.includes('%3E')
            || mediaUrl.includes('%3c')
            || mediaUrl.includes('%3e')
            || mediaUrl.startsWith('about:')
            || mediaUrl.startsWith('data:')
            || mediaUrl.startsWith('blob:')) {
            return;
          }

          // Validate URL
          let parsedUrl;
          try {
            parsedUrl = new URL(mediaUrl, bundle.url);
          } catch {
            return;
          }

          // Skip external domains (keep only images from same origin or CDN)
          const bundleOrigin = new URL(bundle.url).hostname;
          const mediaHostname = parsedUrl.hostname;
          const isInternalMedia = mediaHostname === bundleOrigin
            || mediaHostname.endsWith('.hlx.live')
            || mediaHostname.endsWith('.hlx.page')
            || mediaHostname.endsWith('.aem.live')
            || mediaHostname.endsWith('.aem.page')
            || mediaHostname.endsWith('.adobeaemcloud.com');

          if (!isInternalMedia) {
            return;
          }

          if (!this.#mediaData.has(mediaUrl)) {
            this.#mediaData.set(mediaUrl, {
              pages: new Set(),
              totalWeight: 0,
              source: evt.source, // CSS selector
            });
          }

          const data = this.#mediaData.get(mediaUrl);
          data.pages.add(bundle.url);
          data.totalWeight += bundle.weight || 1;
        });
      });
    });

    // eslint-disable-next-line no-console
    console.log(`RUM Media Crawler: Found ${this.#mediaData.size} unique media URLs`);

    // Convert to array format expected by fetchBatch
    // Each entry needs href and plain (for fetching page content)
    const mediaUrls = [];
    this.#mediaData.forEach((data, mediaUrl) => {
      // Pick the first page as the representative page for fetching metadata
      const pageUrl = [...data.pages][0];
      const pageOrigin = new URL(pageUrl).origin;

      // Resolve media URL to absolute
      let absoluteMediaUrl;
      try {
        absoluteMediaUrl = new URL(mediaUrl, pageOrigin).href;
      } catch {
        return;
      }

      // Map production domain to site origin for fetching
      const productionPathname = new URL(pageUrl).pathname;
      const fetchablePageUrl = `${this.#siteOrigin}${productionPathname}`;
      const plainUrl = `${fetchablePageUrl.endsWith('/') ? `${fetchablePageUrl}index` : fetchablePageUrl}.plain.html`;

      mediaUrls.push({
        href: absoluteMediaUrl,
        plain: plainUrl,
        pageUrl,
        allPages: [...data.pages],
        totalWeight: data.totalWeight,
        cssSelector: data.source,
      });
    });

    return mediaUrls;
  }

  /**
   * Process a batch of media URLs - fetch page content to get alt text, dimensions
   */
  async fetchBatch(batch, maxBatchSize, pageCounterIncrement) {
    const results = [];
    const promisePool = new PromisePool(Infinity, 'RUM Media crawler fetchBatch pool');

    for (let i = 0; !this.#stopped && i < maxBatchSize; i += 1) {
      promisePool.run(async () => {
        while (batch.length > 0 && !this.#stopped) {
          const mediaItem = batch.shift();

          if (!this.#duplicateFilter.has(mediaItem.href)) {
            this.#duplicateFilter.add(mediaItem.href);

            // eslint-disable-next-line no-await-in-loop
            const imgData = await this.#fetchImageMetadata(mediaItem);
            if (imgData) {
              results.push(imgData);
              pageCounterIncrement();
            }
          }
        }
      });
    }

    await promisePool.allSettled();
    return results;
  }

  /**
   * Fetch metadata for a single image from its page context
   */
  async #fetchImageMetadata(mediaItem) {
    try {
      // Fetch the page to get alt text
      const doc = await CrawlerUtil.fetchPageDocument(mediaItem.plain);

      let alt = '';
      let width = MIN_DIMENSION;
      let height = MIN_DIMENSION;

      if (doc) {
        // Try to find the image in the page using various methods
        const mediaUrl = new URL(mediaItem.href);
        const mediaPath = mediaUrl.pathname;

        // Find image by src attribute (partial match on pathname)
        const images = doc.querySelectorAll('img[src]');
        // eslint-disable-next-line no-restricted-syntax
        for (const img of images) {
          const imgSrc = img.getAttribute('src') || '';
          if (imgSrc.includes(mediaPath) || mediaItem.href.includes(imgSrc)) {
            alt = img.getAttribute('alt') || '';
            width = parseInt(img.getAttribute('width'), 10) || MIN_DIMENSION;
            height = parseInt(img.getAttribute('height'), 10) || MIN_DIMENSION;
            break;
          }
        }
      }

      const invalidDimensions = width === MIN_DIMENSION || height === MIN_DIMENSION;
      const aspectRatio = parseFloat((width / height).toFixed(1)) || 1;

      const original = { href: mediaItem.href, width, height };

      // Create optimized image URLs if possible
      const detailUrl = this.#getOptimizedUrl(mediaItem.href, width, height, MAX_DETAIL_DIMENSION);
      const mediumUrl = this.#getOptimizedUrl(mediaItem.href, width, height, MAX_MEDIUM_DIMENSION);
      const cardUrl = this.#getOptimizedUrl(mediaItem.href, width, height, MAX_CARD_DIMENSION);
      const imageOptions = {
        original,
        detail: detailUrl || original,
        medium: mediumUrl || original,
        card: cardUrl || original,
      };

      const fileType = ImageAuditUtil.getFileType(mediaItem.href);

      // Use the first page as the representative site
      const site = mediaItem.pageUrl;
      const { origin } = new URL(mediaItem.href);

      return new CrawlerImageValues({
        site,
        origin,
        src: mediaItem.href,
        imageOptions,
        alt,
        width,
        height,
        invalidDimensions,
        aspectRatio,
        instance: 1,
        fileType,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`RUM Media Crawler: Error fetching metadata for ${mediaItem.href}:`, error);
      return null;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  #getOptimizedUrl(src, width, height, maxDimension) {
    try {
      const url = new URL(src);

      // Only optimize for EDS-like URLs
      if (!url.hostname.includes('.aem.') && !url.hostname.includes('.hlx.')) {
        return null;
      }

      let adjustedWidth = width;
      let adjustedHeight = height;

      if (adjustedWidth > maxDimension || adjustedHeight > maxDimension) {
        const scalingFactor = maxDimension / Math.max(adjustedWidth, adjustedHeight);
        adjustedWidth = Math.round(adjustedWidth * scalingFactor);
        adjustedHeight = Math.round(adjustedHeight * scalingFactor);
      }

      url.searchParams.set('width', adjustedWidth);
      url.searchParams.set('format', 'webply');
      url.searchParams.set('optimize', 'medium');

      return {
        href: url.href,
        width: adjustedWidth,
        height: adjustedHeight,
      };
    } catch {
      return null;
    }
  }
}

export default RumMediaCrawler;

CrawlerRegistry.registerCrawler(RumMediaCrawler);
