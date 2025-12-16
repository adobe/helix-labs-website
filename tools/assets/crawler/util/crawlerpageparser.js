import CrawlerUtil from './crawlerutil.js';
import CrawlerImageValues from '../crawlerimagevalues.js';
import ImageAuditUtil from '../../util/imageauditutil.js';

const MIN_DIMENSION = 32;
const DEFAULT_OPTIMIZATION_DIMENSION = 2048;
const MAX_DETAIL_DIMENSION = 1200;
const MAX_MEDIUM_DIMENSION = 750;
const MAX_CARD_DIMENSION = 400;

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
        const rawWidth = parseInt(img.getAttribute('width'), 10) || 0;
        const rawHeight = parseInt(img.getAttribute('height'), 10) || 0;
        const invalidDimensions = rawWidth === 0 || rawHeight === 0;

        // For storage/display, keep a small placeholder if the author did not specify dimensions.
        const displayWidth = rawWidth || MIN_DIMENSION;
        const displayHeight = rawHeight || MIN_DIMENSION;

        // For image optimization, avoid producing tiny optimized URLs when dimensions are unknown.
        const optWidth = rawWidth || DEFAULT_OPTIMIZATION_DIMENSION;
        const optHeight = rawHeight || DEFAULT_OPTIMIZATION_DIMENSION;

        const aspectRatio = parseFloat((displayWidth / displayHeight).toFixed(1)) || '';

        // Read src directly - safe because doc is from DOMParser, not live DOM
        const rawSrc = img.getAttribute('src');
        if (!rawSrc) return null;

        let resolvedUrl;
        try {
          resolvedUrl = new URL(rawSrc, origin);
        } catch {
          return null;
        }

        if (!CrawlerUtil.isUrlValid(resolvedUrl)) {
          return null;
        }

        // The HTML crawler/parser should not perform domain transformations.
        // It simply resolves the URL relative to the origin it was fetched from.
        const original = { href: resolvedUrl.href, height: displayHeight, width: displayWidth };

        // Use provided function to get optimized URLs (prefer opt dims when intrinsic dims are missing)
        const src = resolvedUrl.href;
        const detailOpt = getOptimizedImageUrl
          ? getOptimizedImageUrl(src, origin, optWidth, optHeight, MAX_DETAIL_DIMENSION)
          : null;
        const mediumOpt = getOptimizedImageUrl
          ? getOptimizedImageUrl(src, origin, optWidth, optHeight, MAX_MEDIUM_DIMENSION)
          : null;
        const cardOpt = getOptimizedImageUrl
          ? getOptimizedImageUrl(src, origin, optWidth, optHeight, MAX_CARD_DIMENSION)
          : null;

        const imageOptions = {
          original,
          detail: detailOpt || original,
          medium: mediumOpt || original,
          card: cardOpt || original,
        };

        let instance = 1;
        // Instance counting should be relative to the served content (path-based), not domain.
        const instanceKey = resolvedUrl.pathname;
        if (seenMap.has(instanceKey)) {
          instance = seenMap.get(instanceKey) + 1;
        }
        seenMap.set(instanceKey, instance);

        const alt = img.getAttribute('alt') || '';
        const fileType = ImageAuditUtil.getFileType(resolvedUrl.pathname);

        // Fetch asset's Last-Modified header using shared utility
        const assetLastModified = await CrawlerUtil.fetchAssetLastModified(resolvedUrl.href);

        return new CrawlerImageValues({
          site: pageUrl,
          origin,
          src: resolvedUrl.href,
          imageOptions,
          alt,
          width: displayWidth,
          height: displayHeight,
          invalidDimensions,
          aspectRatio,
          instance,
          fileType,
          pageLastModified,
          assetLastModified: assetLastModified ? assetLastModified.getTime() : null,
        });
      });

      const imgData = (await Promise.all(imgDataPromises)).filter((item) => item !== null);
      return imgData;
    } catch (error) {
      console.error(`CrawlerPageParser: unable to fetch ${plainUrl}:`, error);
      return [];
    }
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


