import CrawlerUtil from '../crawlerutil.js';
import ImageUrlParserRegistry from '../imageurlparserregistry.js';
import { AEM_EDS_HOSTS } from '../eds/edshosts.js';

const MIN_DIMENSION = 32;

/**
 * Image URL parser for EDS-optimized images:
 * - Matches AEM/HLX hostnames
 * - Produces optimized URLs via ?width=...&format=webply&optimize=medium
 */
class EdsImageUrlParser {
  static get priority() {
    return 10;
  }

  static get match() {
    // Match any URL whose hostname ends with a known EDS host.
    return new RegExp(`(${AEM_EDS_HOSTS.map((h) => h.replaceAll('.', '\\.')).join('|')})$`);
  }

  static matches(url) {
    try {
      return this.match.test(url.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Return a durable identity part for URLs that this parser considers immutable.
   * This lets generic identities avoid embedding EDS knowledge.
   * @param {URL} url
   * @returns {string|null}
   */
  static getDurableIdentityPart(url) {
    if (!this.matches(url)) return null;
    if (!url.pathname.startsWith('/media_')) return null;
    // Mediabus assets are immutable by pathname; ignore hostname/query.
    return url.pathname.toLowerCase();
  }

  /**
   * Returns an optimized URL (and adjusted width/height) for EDS images.
   * @param {URL} url - resolved image URL
   * @param {URL} originUrl - page origin URL (used to ensure same-host optimization)
   * @param {number} width - best-known width
   * @param {number} height - best-known height
   * @param {number} maxLongestEdge - target max dimension
   * @returns {{href: string, width: number, height: number}|null}
   */
  static getOptimizedImageUrl(url, originUrl, width, height, maxLongestEdge) {
    if (!this.matches(url)) {
      return null;
    }

    // Mediabus EDS optimization should only be applied when the image is served from the
    // same host as the page (EDS sites serve media from the site host).
    if (!originUrl || url.hostname !== originUrl.hostname) {
      return null;
    }

    // Mediabus convention: media assets are typically served as /media_<hash>...
    // Keep this strict so we don't mutate non-mediabus images.
    if (!url.pathname.startsWith('/media_')) {
      return null;
    }

    let adjustedWidth = width || MIN_DIMENSION;
    let adjustedHeight = height || MIN_DIMENSION;

    if (adjustedWidth < MIN_DIMENSION || adjustedHeight < MIN_DIMENSION) {
      const scalingFactor = MIN_DIMENSION / Math.min(adjustedWidth, adjustedHeight);
      adjustedWidth = Math.round(adjustedWidth * scalingFactor);
      adjustedHeight = Math.round(adjustedHeight * scalingFactor);
    }

    if (adjustedWidth > maxLongestEdge || adjustedHeight > maxLongestEdge) {
      const scalingFactor = maxLongestEdge / Math.max(adjustedWidth, adjustedHeight);
      adjustedWidth = Math.round(adjustedWidth * scalingFactor);
      adjustedHeight = Math.round(adjustedHeight * scalingFactor);
    }

    const optimized = new URL(url.href);
    optimized.searchParams.set('width', adjustedWidth);
    optimized.searchParams.set('format', 'webply');
    optimized.searchParams.set('optimize', 'medium');

    if (!CrawlerUtil.isUrlValid(optimized)) {
      return null;
    }

    return { href: optimized.href, width: adjustedWidth, height: adjustedHeight };
  }
}

ImageUrlParserRegistry.registerParser(EdsImageUrlParser);

export default EdsImageUrlParser;


