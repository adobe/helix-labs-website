/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

/**
 * Abstract base class for all crawlers.
 * Subclasses must implement the required methods and provide UI metadata.
 */
class AbstractCrawler {
  /**
   * Unique type identifier for this crawler (used in form data)
   * @returns {string}
   */
  static get type() {
    return 'abstract';
  }

  /**
   * Display name shown in the crawler type dropdown
   * @returns {string}
   */
  static get displayName() {
    return 'Abstract Crawler';
  }

  /**
   * Description shown as help text when this crawler is selected
   * @returns {string}
   */
  static get description() {
    return 'Base crawler interface';
  }

  /**
   * Returns form field configuration for this crawler.
   * Controls which fields are visible/required when this crawler is selected.
   * @returns {Object} Form configuration
   */
  static getFormConfig() {
    return {
      // Field IDs to show (all others will be hidden)
      visibleFields: ['site-url'],
      // Field IDs that are required
      requiredFields: ['site-url'],
      // Help text overrides by field ID
      helpText: {},
      // Placeholder overrides by field ID
      placeholders: {},
    };
  }

  /**
   * Determines if this crawler should handle the given form data.
   * @param {Object} sitemapFormData - Form data from the crawler form
   * @returns {boolean} True if this crawler should be used
   */
  static accept(sitemapFormData) {
    return sitemapFormData['crawler-type'] === this.type;
  }

  /**
   * Fetches the initial data needed by this crawler (pages, media URLs, etc.)
   * This could be sitemap URLs, RUM events, or any other data source.
   * @param {Object} formData - Form data from the crawler form
   * @returns {Promise<Array>} Array of items to process
   */
  async fetchCrawlerData(formData) {
    throw new Error('abstract class');
  }

  /**
   * Processes a batch of items and returns image data.
   * @param {Array} batch - Items to process
   * @param {number} maxBatchSize - Maximum concurrent processing
   * @param {Function} pageCounterIncrement - Callback to increment page counter
   * @returns {Promise<Array>} Array of CrawlerImageValues
   */
  async fetchBatch(batch, maxBatchSize, pageCounterIncrement) {
    throw new Error('abstract class');
  }

  /**
   * Stops the crawler processing.
   */
  stop() {
  }
}

export default AbstractCrawler;
