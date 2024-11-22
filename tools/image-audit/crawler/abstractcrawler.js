/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
class AbstractCrawler {
  async fetchSitemap(sitemapFormData) {
    throw new Error('abstract class');
  }

  async fetchBatch(batch, maxBatchSize, counter, updateCounterFunction) {
    throw new Error('abstract class');
  }

  stop() {
  }

  static accept(sitemapFormData) {
    return false;
  }
}

export default AbstractCrawler;
