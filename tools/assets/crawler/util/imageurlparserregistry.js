/**
 * Registry for image URL parsers.
 *
 * Parsers are matched by regex (against url.href) and selected by ascending priority.
 * Lower priority number = higher precedence.
 */
class ImageUrlParserRegistry {
  static #parsers = [];

  /**
   * Register an image URL parser class.
   * @param {Object} parser - Parser class
   */
  static registerParser(parser) {
    this.#parsers.push(parser);
    this.#parsers.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  /**
   * Get the best matching parser for a URL.
   * @param {string|URL} url - URL to match
   * @returns {Object|null} Parser class or null
   */
  static getParser(url) {
    const urlObj = url instanceof URL ? url : new URL(url);
    return this.#parsers.find((parser) => parser.matches(urlObj)) || null;
  }

  /**
   * Convenience: return an optimized URL object for the given image URL, if a parser supports it.
   * Signature matches historical usage in crawlers:
   * (src, origin, width, height, maxLongestEdge) => { href, width, height } | null
   * @param {string} src - image src (absolute URL string preferred)
   * @param {string} origin - base origin for relative resolution
   * @param {number} width - intrinsic or best-known width
   * @param {number} height - intrinsic or best-known height
   * @param {number} maxLongestEdge - desired max dimension
   * @returns {{href:string,width:number,height:number}|null}
   */
  static getOptimizedImageUrl(src, origin, width, height, maxLongestEdge) {
    const resolved = new URL(src, origin);
    const originUrl = new URL(origin);
    const parser = this.getParser(resolved);
    if (!parser || typeof parser.getOptimizedImageUrl !== 'function') {
      return null;
    }
    return parser.getOptimizedImageUrl(resolved, originUrl, width, height, maxLongestEdge);
  }

  /**
   * Ask the best-matching parser for a durable identity part (if any).
   * @param {string|URL} url
   * @returns {string|null}
   */
  static getDurableIdentityPart(url) {
    const urlObj = url instanceof URL ? url : new URL(url);
    const parser = this.getParser(urlObj);
    if (!parser || typeof parser.getDurableIdentityPart !== 'function') {
      return null;
    }
    return parser.getDurableIdentityPart(urlObj);
  }
}

export default ImageUrlParserRegistry;


