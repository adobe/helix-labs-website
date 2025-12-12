/**
 * Registry for HTML crawlers / page fetch strategies.
 *
 * Crawlers are matched by regex (against url.href) and selected by ascending priority.
 * Lower priority number = higher precedence.
 */
class HtmlCrawlerRegistry {
  static #crawlers = [];

  /**
   * Register a HTML crawler class.
   * @param {Object} crawler - crawler class
   */
  static registerCrawler(crawler) {
    this.#crawlers.push(crawler);
    this.#crawlers.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  /**
   * Get best matching crawler for a page URL.
   * @param {string|URL} url - page URL to match
   * @returns {Object|null} crawler class or null
   */
  static getCrawler(url) {
    const urlObj = url instanceof URL ? url : new URL(url);
    return this.#crawlers.find((crawler) => crawler.matches(urlObj)) || null;
  }
}

export default HtmlCrawlerRegistry;


