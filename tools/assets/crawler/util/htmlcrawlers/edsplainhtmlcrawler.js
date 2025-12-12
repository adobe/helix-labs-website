import HtmlCrawlerRegistry from '../htmlcrawlerregistry.js';
import { AEM_EDS_HOSTS } from '../eds/edshosts.js';

/**
 * HTML crawler strategy for EDS sites using `.plain.html`.
 */
class EdsPlainHtmlCrawler {
  static get priority() {
    return 10;
  }

  static get match() {
    return new RegExp(`(${AEM_EDS_HOSTS.map((h) => h.replaceAll('.', '\\.')).join('|')})$`);
  }

  static matches(url) {
    try {
      return this.match.test(url.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Convert a page URL to its `.plain.html` URL.
   * @param {string|URL} pageUrl - page URL
   * @returns {string}
   */
  static getPlainUrl(pageUrl) {
    const url = pageUrl instanceof URL ? pageUrl : new URL(pageUrl);
    const href = url.href;
    return `${href.endsWith('/') ? `${href}index` : href}.plain.html`;
  }
}

HtmlCrawlerRegistry.registerCrawler(EdsPlainHtmlCrawler);

export default EdsPlainHtmlCrawler;


