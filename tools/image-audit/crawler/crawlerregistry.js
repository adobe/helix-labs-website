class CrawlerRegistry {
  static #crawlers = [];

  static getCrawlerInstance(sitemapFormData) {
    const matchedCrawler = this.#crawlers.find((crawler) => crawler.accept(sitemapFormData));
    // eslint-disable-next-line new-cap
    if (!matchedCrawler) {
      throw new Error('No crawler found for', sitemapFormData);
    }
    // eslint-disable-next-line new-cap
    return new matchedCrawler();
  }

  static registerCrawler(crawler) {
    this.#crawlers.push(crawler);
  }
}

export default CrawlerRegistry;
