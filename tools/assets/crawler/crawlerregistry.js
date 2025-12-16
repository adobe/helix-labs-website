class CrawlerRegistry {
  static #crawlers = [];

  /**
   * Get a crawler instance that accepts the given form data
   * @param {Object} sitemapFormData - Form data to match against crawlers
   * @returns {AbstractCrawler} Instance of the matched crawler
   */
  static getCrawlerInstance(sitemapFormData) {
    const matchedCrawler = this.#crawlers.find((crawler) => crawler.accept(sitemapFormData));
    // eslint-disable-next-line new-cap
    if (!matchedCrawler) {
      throw new Error('No crawler found for', sitemapFormData);
    }
    // eslint-disable-next-line new-cap
    return new matchedCrawler();
  }

  /**
   * Get a crawler class by its type identifier
   * @param {string} type - The crawler type (e.g., 'sitemap', 'rum-media')
   * @returns {AbstractCrawler|null} The crawler class or null if not found
   */
  static getCrawlerByType(type) {
    return this.#crawlers.find((crawler) => crawler.type === type) || null;
  }

  /**
   * Get all registered crawlers
   * @returns {Array<AbstractCrawler>} Array of all registered crawler classes
   */
  static getAllCrawlers() {
    return [...this.#crawlers];
  }

  /**
   * Get crawler options for building a dropdown
   * @returns {Array<{type: string, displayName: string, description: string}>}
   */
  static getCrawlerOptions() {
    return this.#crawlers.map((crawler) => ({
      type: crawler.type,
      displayName: crawler.displayName,
      description: crawler.description,
    }));
  }

  /**
   * Register a crawler class
   * @param {AbstractCrawler} crawler - The crawler class to register
   */
  static registerCrawler(crawler) {
    this.#crawlers.push(crawler);
  }
}

export default CrawlerRegistry;
