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
   * Parse a srcset attribute value into candidate URLs with optional descriptors.
   * @param {string} srcset
   * @returns {{url:string,width:number|null,density:number|null}[]}
   */
  static parseSrcset(srcset) {
    if (!srcset || typeof srcset !== 'string') return [];
    return srcset
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [url, descriptor] = part.split(/\s+/, 2);
        if (!url) return null;
        const d = (descriptor || '').trim().toLowerCase();
        if (!d) return { url, width: null, density: null };
        if (d.endsWith('w')) {
          const w = parseInt(d.slice(0, -1), 10);
          return { url, width: Number.isFinite(w) ? w : null, density: null };
        }
        if (d.endsWith('x')) {
          const x = parseFloat(d.slice(0, -1));
          return { url, width: null, density: Number.isFinite(x) ? x : null };
        }
        return { url, width: null, density: null };
      })
      .filter((c) => c !== null);
  }

  /**
   * Return all resolved candidate image URLs for an <img>, preferring srcset/picture sources.
   * The first entry is the "best" (largest) candidate.
   *
   * NOTE: We intentionally return a single canonical URL for crawling (caller picks [0]),
   * to avoid crawling every srcset candidate.
   *
   * @param {Element} img
   * @param {string} baseUrl
   * @returns {URL[]}
   */
  static getResolvedImageCandidates(img, baseUrl) {
    const candidates = [];

    const pushFromSrcset = (srcset) => {
      this.parseSrcset(srcset).forEach((c) => candidates.push(c));
    };

    const pushFromSrc = (src) => {
      if (!src) return;
      candidates.push({ url: src, width: null, density: null });
    };

    // Prefer <picture><source srcset> when present
    const picture = img?.closest ? img.closest('picture') : null;
    if (picture) {
      [...picture.querySelectorAll('source')].forEach((source) => {
        const ss = source.getAttribute('srcset') || source.getAttribute('data-srcset');
        if (ss) pushFromSrcset(ss);
      });
    }

    // Then consider <img srcset> (or lazy equivalents)
    const imgSrcset = img?.getAttribute?.('srcset') || img?.getAttribute?.('data-srcset');
    if (imgSrcset) pushFromSrcset(imgSrcset);

    // Finally fall back to src or common lazy-load attrs
    const imgSrc = img?.getAttribute?.('src')
      || img?.getAttribute?.('data-src')
      || img?.getAttribute?.('data-lazy-src')
      || img?.getAttribute?.('data-original')
      || img?.getAttribute?.('data-src-url');
    if (imgSrc) pushFromSrc(imgSrc);

    // Sort best-first: widest srcset first, else highest density, else keep insertion order.
    const sorted = candidates
      .map((c, idx) => ({ ...c, idx }))
      .sort((a, b) => {
        const aw = a.width ?? -1;
        const bw = b.width ?? -1;
        if (aw !== bw) return bw - aw;
        const ax = a.density ?? -1;
        const bx = b.density ?? -1;
        if (ax !== bx) return bx - ax;
        return a.idx - b.idx;
      });

    const urls = [];
    const seen = new Set();
    sorted.forEach(({ url }) => {
      try {
        const resolved = new URL(url, baseUrl);
        const key = resolved.href;
        if (!seen.has(key)) {
          seen.add(key);
          urls.push(resolved);
        }
      } catch {
        // ignore invalid
      }
    });
    return urls;
  }

  /**
   * Parse a page and extract all image data.
   * @param {Object} options - Configuration options
   * @param {string} options.pageUrl - The page URL (for site field)
   * @param {string} [options.htmlUrl] - The HTML URL to fetch (full HTML or `.plain.html`)
   * @param {string} [options.plainUrl] - Back-compat: `.plain.html` URL to fetch
   * @param {string} options.origin - The origin for resolving relative URLs
   * @param {Function} options.getOptimizedImageUrl - Function to get optimized image URLs
   * @returns {Promise<CrawlerImageValues[]>} Array of image data
   */
  static async parsePageForImages({
    pageUrl,
    htmlUrl,
    plainUrl,
    origin,
    getOptimizedImageUrl,
  }) {
    try {
      const fetchUrl = htmlUrl || plainUrl;
      if (!fetchUrl) return [];
      const baseUrlForResolution = fetchUrl;

      // Fetch and parse the page using DOMParser (no live DOM insertion)
      const pageResult = await CrawlerUtil.fetchPageDocument(fetchUrl, { includeMetadata: true });
      if (!pageResult || !pageResult.doc) {
        return [];
      }

      const { doc } = pageResult;
      const pageLastModified = pageResult.lastModified ? pageResult.lastModified.getTime() : null;

      // Query images directly from the DOMParser document
      // Reading getAttribute('src') is safe - it won't trigger resource loads
      // since the document is not inserted into the live DOM
      const seenMap = new Map();
      const images = doc.querySelectorAll('img');

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

        const resolvedUrl = this.getResolvedImageCandidates(img, baseUrlForResolution)[0];
        if (!resolvedUrl) return null;

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
      // eslint-disable-next-line no-console
      console.error(`CrawlerPageParser: unable to fetch ${htmlUrl || plainUrl}:`, error);
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


