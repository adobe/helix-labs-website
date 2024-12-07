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

  static async fetchPageHtml(url) {
    try {
      const req = await fetch(url);
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

      return req.text();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching page at ${url}:`, error);
      return null;
    }
  }
}

export default CrawlerUtil;
