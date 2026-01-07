import PromisePool from '../../util/promisepool.js';
import UrlResourceHandler from '../../util/urlresourcehandler.js';

const MAX_SIMULTANEOUS_REQUESTS = 5;

class CrawlerUtil {
  static #permittedProtocols = ['http', 'https', 'data'];

  /**
  * Checks if a given URL is valid based on its protocol.
  *
  * @param {string|URL|Object} url - The URL to validate. It can be a string,
  * an instance of URL, or an object with `href`, `origin`, or `src` properties.
  * @returns {boolean} - Returns `true` if the URL is valid, otherwise `false`.
  */
  static isUrlValid(url) {
    if (!url) return false;
    if (url instanceof URL) {
      // Allow same-origin URLs (including localhost if running locally)
      const currentOrigin = window.location.origin;
      if (url.origin === currentOrigin) {
        return true;
      }
      
      // Reject localhost/empty hostname for cross-origin requests
      if (url.hostname === 'localhost' || url.hostname === '') {
        return false;
      }
      
      const protocol = url.protocol.replace(':', '').toLowerCase();
      return this.#permittedProtocols.includes(protocol);
    }
    if (typeof url === 'string') {
      try {
        const newUrl = new URL(url);
        return this.isUrlValid(newUrl);
      } catch (error) {
        return false;
      }
    }
    if (typeof url?.href === 'string' && typeof url?.plain === 'string') {
      return this.isUrlValid(url.href) && this.isUrlValid(url.plain);
    }
    if (typeof url?.href === 'string') {
      return this.isUrlValid(url.href);
    }
    if (typeof url?.origin === 'string' && typeof url?.src === 'string') {
      try {
        const newUrl = new URL(url.src, url.origin);
        return this.isUrlValid(newUrl);
      } catch (error) {
        return false;
      }
    }
    if (typeof url?.origin === 'string') {
      return this.isUrlValid(url.origin);
    }
    return false;
  }

  /**
   * Filters and returns an array of valid URLs.
   *
   * @param {string[]} urls - An array of URLs to be validated.
   * @returns {string[]} An array containing only the valid URLs.
   */
  static cleanseUrls(urls) {
    return urls.filter((url) => this.isUrlValid(url));
  }

  static #requestPool = new PromisePool(MAX_SIMULTANEOUS_REQUESTS, 'Crawler request pool');

  /**
   * Fetches page HTML and returns a DOMParser document.
   * The returned document is safe to query - reading attributes won't trigger resource loads
   * since it's not inserted into the live DOM.
   *
   * @param {string} url - The URL to fetch
   * @param {Object} options - Optional configuration
   * @param {boolean} options.includeMetadata - If true, returns {doc, lastModified}
   * @returns {Promise<Document|{doc: Document, lastModified: Date}|null>}
   */
  static async fetchPageDocument(url, options = {}) {
    try {
      // eslint-disable-next-line no-console
      console.debug(`Fetching HTML page: ${url}`);
      const req = await this.#requestPool.run(async () => UrlResourceHandler.fetch(url));
      if (!req.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to fetch page at ${url} with HTTP status ${req.status}`);
        return null;
      }

      const contentType = req.headers.get('Content-Type');
      if (!contentType || !contentType.includes('text/html')) {
        // eslint-disable-next-line no-console
        console.warn(`Fetched content is not HTML. Content-Type: ${contentType}`);
        return null;
      }

      const html = await req.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      if (options.includeMetadata) {
        const lastModifiedHeader = req.headers.get('Last-Modified');
        const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : null;
        return { doc, lastModified };
      }

      return doc;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching page at ${url}:`, error);
      return null;
    }
  }

  /**
   * Fetches the Last-Modified header for an asset URL.
   * @param {string} assetUrl - The asset URL to check
   * @returns {Promise<Date|null>} The Last-Modified date or null
   */
  static async fetchAssetLastModified(assetUrl) {
    try {
      const req = await this.#requestPool.run(
        async () => UrlResourceHandler.fetch(assetUrl, { method: 'HEAD' }),
      );
      if (!req.ok) {
        return null;
      }
      const lastModifiedHeader = req.headers.get('Last-Modified');
      return lastModifiedHeader ? new Date(lastModifiedHeader) : null;
    } catch (error) {
      return null;
    }
  }
}

export default CrawlerUtil;
