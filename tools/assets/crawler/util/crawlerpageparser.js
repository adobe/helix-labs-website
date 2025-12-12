import CrawlerUtil from './crawlerutil.js';
import CrawlerImageValues from '../crawlerimagevalues.js';
import ImageAuditUtil from '../../util/imageauditutil.js';

const MIN_DIMENSION = 32;
const MAX_DETAIL_DIMENSION = 1200;
const MAX_MEDIUM_DIMENSION = 750;
const MAX_CARD_DIMENSION = 400;

const AEM_EDS_HOSTS = ['.aem.live', '.hlx.live', '.aem.page', '.hlx.page'];

/**
 * Shared utility for parsing HTML pages and extracting image data.
 * Used by both sitemap and RUM crawlers to ensure consistency.
 */
class CrawlerPageParser {
  /**
   * Parse a page and extract all image data.
   * @param {Object} options - Configuration options
   * @param {string} options.pageUrl - The page URL (for site field)
   * @param {string} options.plainUrl - The .plain.html URL to fetch
   * @param {string} options.origin - The origin for resolving relative URLs
   * @param {Function} options.getOptimizedImageUrl - Function to get optimized image URLs
   * @returns {Promise<CrawlerImageValues[]>} Array of image data
   */
  static async parsePageForImages({
    pageUrl,
    plainUrl,
    origin,
    getOptimizedImageUrl,
  }) {
    try {
      // Fetch and parse the page using DOMParser (no live DOM insertion)
      const pageResult = await CrawlerUtil.fetchPageDocument(plainUrl, { includeMetadata: true });
      if (!pageResult || !pageResult.doc) {
        return [];
      }

      const { doc } = pageResult;
      const pageLastModified = pageResult.lastModified ? pageResult.lastModified.getTime() : null;

      // Query images directly from the DOMParser document
      // Reading getAttribute('src') is safe - it won't trigger resource loads
      // since the document is not inserted into the live DOM
      const seenMap = new Map();
      const images = doc.querySelectorAll('img[src]');

      // Process images and fetch asset Last-Modified in parallel
      const imgDataPromises = [...images].map(async (img) => {
        let width = parseInt(img.getAttribute('width'), 10) || 0;
        let height = parseInt(img.getAttribute('height'), 10) || 0;
        const invalidDimensions = width === 0 || height === 0;
        if (!width) width = MIN_DIMENSION;
        if (!height) height = MIN_DIMENSION;

        const aspectRatio = parseFloat((width / height).toFixed(1)) || '';

        // Read src directly - safe because doc is from DOMParser, not live DOM
        const src = img.getAttribute('src')?.split('?')[0];
        if (!src) return null;

        const originalUrl = new URL(src, origin);

        if (!CrawlerUtil.isUrlValid(originalUrl)) {
          return null;
        }

        const original = { href: originalUrl.href, height, width };

        // Use provided function to get optimized URLs
        const detail = getOptimizedImageUrl
          ? getOptimizedImageUrl(src, origin, width, height, MAX_DETAIL_DIMENSION)
          : null;
        const medium = getOptimizedImageUrl
          ? getOptimizedImageUrl(src, origin, width, height, MAX_MEDIUM_DIMENSION)
          : null;
        const card = getOptimizedImageUrl
          ? getOptimizedImageUrl(src, origin, width, height, MAX_CARD_DIMENSION)
          : null;

        const imageOptions = {
          original,
          detail: detail || original,
          medium: medium || original,
          card: card || original,
        };

        let instance = 1;
        if (seenMap.has(src)) {
          instance = seenMap.get(src) + 1;
        }
        seenMap.set(src, instance);

        const alt = img.getAttribute('alt') || '';
        const fileType = ImageAuditUtil.getFileType(src);

        // Fetch asset's Last-Modified header using shared utility
        const assetLastModified = await CrawlerUtil.fetchAssetLastModified(originalUrl.href);

        return new CrawlerImageValues({
          site: pageUrl,
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
          firstSeenTimestamp: null,
          lastSeenTimestamp: null,
        });
      });

      const imgData = (await Promise.all(imgDataPromises)).filter((item) => item !== null);
      return imgData;
    } catch (error) {
      console.error(`CrawlerPageParser: unable to fetch ${plainUrl}:`, error);
      return [];
    }
  }

  /**
   * Get adjusted optimized image URL for EDS sites.
   * @param {string} src - The source path
   * @param {string} origin - The origin URL
   * @param {number} width - Original width
   * @param {number} height - Original height
   * @param {number} maxLongestEdge - Maximum dimension
   * @returns {Object|null} Object with href, width, height or null
   */
  static getAdjustedEDSOptimizedImageUrl(src, origin, width, height, maxLongestEdge) {
    let adjustedWidth = width;
    let adjustedHeight = height;

    if (adjustedWidth === 0 || adjustedHeight === 0) {
      adjustedWidth = MIN_DIMENSION;
      adjustedHeight = MIN_DIMENSION;
    }

    if (adjustedWidth > maxLongestEdge || adjustedHeight > maxLongestEdge) {
      const scalingFactor = maxLongestEdge / Math.max(adjustedWidth, adjustedHeight);
      adjustedWidth = Math.round(adjustedWidth * scalingFactor);
      adjustedHeight = Math.round(adjustedHeight * scalingFactor);
    }

    const url = this.getEDSOptimizedImageUrl(src, origin, adjustedWidth);
    if (!CrawlerUtil.isUrlValid(url)) {
      return null;
    }

    return {
      href: url.href,
      width: adjustedWidth,
      height: adjustedHeight,
    };
  }

  /**
   * Get EDS optimized image URL with query parameters.
   * @param {string} src - The source path
   * @param {string} origin - The origin URL
   * @param {number} width - Desired width
   * @returns {URL|string} Optimized URL or original src
   */
  static getEDSOptimizedImageUrl(src, origin, width) {
    const originalUrl = new URL(src, origin);
    if (!CrawlerUtil.isUrlValid(originalUrl)) {
      return null;
    }
    const aemSite = AEM_EDS_HOSTS.find((h) => originalUrl.host.endsWith(h));
    if (!aemSite) {
      return src;
    }

    originalUrl.searchParams.set('width', width);
    originalUrl.searchParams.set('format', 'webply');
    originalUrl.searchParams.set('optimize', 'medium');

    return originalUrl;
  }

  static get MAX_DETAIL_DIMENSION() {
    return MAX_DETAIL_DIMENSION;
  }

  static get MAX_MEDIUM_DIMENSION() {
    return MAX_MEDIUM_DIMENSION;
  }

  static get MAX_CARD_DIMENSION() {
    return MAX_CARD_DIMENSION;
  }

  static get MIN_DIMENSION() {
    return MIN_DIMENSION;
  }
}

export default CrawlerPageParser;

