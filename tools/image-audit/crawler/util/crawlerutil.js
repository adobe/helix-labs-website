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
    let protocol = '';
    if (url instanceof URL) {
      if (url.hostname === 'localhost') {
        return false;
      }
      protocol = url.protocol.replace(':', '').toLowerCase();
    } else if (typeof url === 'string') {
      try {
        const newUrl = new URL(url);
        return this.isUrlValid(newUrl);
      } catch (error) {
        return false;
      }
    } else if (typeof url?.href === 'string') {
      return this.isUrlValid(url.href);
    } else if (typeof url?.origin === 'string' && typeof url?.src === 'string') {
      try {
        const newUrl = new URL(url.src, url.origin);
        return this.isUrlValid(newUrl);
      } catch (error) {
        return false;
      }
    } else if (typeof url?.origin === 'string') {
      return this.isUrlValid(url.origin);
    } else {
      return false;
    }

    return this.#permittedProtocols.includes(protocol);
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
    const req = await fetch(url);
    if (req.ok) {
      return req.text();
    }
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch page at ${url} with http status ${req.status}`);

    return null;
  }
}

export default CrawlerUtil;
