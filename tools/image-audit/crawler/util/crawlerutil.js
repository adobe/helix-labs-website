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

  /**
     * Removes JavaScript-related attributes from an element.
     * @param {HTMLElement} element - The element to clean.
     * @private
     */
  static #removeJsAttributes(element) {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });
  }

  /**
     * Renames the `src` attribute to `crawledsrc` for an element.
     * @param {HTMLElement} element - The element to modify.
     * @private
     */
  static #renameSrcToCrawledSrc(element) {
    const src = element.getAttribute('src');
    if (src) {
      element.setAttribute('crawledsrc', src);
      element.removeAttribute('src');
    }
  }

  static #requestPool = new PromisePool(MAX_SIMULTANEOUS_REQUESTS, 'Crawler request pool');

  static async fetchPageHtml(url) {
    try {
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

      // Create a container to store the filtered elements
      const container = document.createElement('div');

      // Process <picture> elements
      const pictureElements = doc.querySelectorAll('picture');
      pictureElements.forEach((picture) => {
        const clonedPicture = picture.cloneNode(true);

        // Process children of the <picture> element
        Array.from(clonedPicture.children).forEach((child) => {
          if (child.tagName === 'IMG' || child.tagName === 'PICTURE') {
            this.#removeJsAttributes(child); // Remove JavaScript attributes

            if (child.tagName === 'IMG') {
              this.#renameSrcToCrawledSrc(child); // Rename `src` to `crawledsrc`
            }
          } else {
            clonedPicture.removeChild(child); // Remove unwanted elements
          }
        });

        this.#removeJsAttributes(clonedPicture); // Remove JS attributes from <picture> itself
        container.appendChild(clonedPicture);
      });

      // Process standalone <img> elements
      const imgElements = doc.querySelectorAll('img:not(picture img)');
      imgElements.forEach((img) => {
        const clonedImg = img.cloneNode(true);
        this.#renameSrcToCrawledSrc(clonedImg); // Rename `src` to `crawledsrc`
        this.#removeJsAttributes(clonedImg); // Remove JavaScript attributes
        container.appendChild(clonedImg);
      });

      // Return the container's inner HTML as a string
      return container.innerHTML;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching page at ${url}:`, error);
      return null;
    }
  }
}

export default CrawlerUtil;
