// eslint-disable-next-line import/no-relative-packages
import CrawlerRegistry from '../crawlerregistry.js';
import AbstractEDSSitemapCrawler from './abstractedssitemapcrawler.js';

class SitemapCrawler extends AbstractEDSSitemapCrawler {
  /*
  static #extractUrlType(url) {
    const { hostname, pathname } = new URL(url);
    const aemSite = super.isAemSite(url);
    if (aemSite && pathname.endsWith('.xml')) return 'sitemap';
    // if (aemSite && pathname.includes('robots.txt')) return 'robots';
    if (aemSite || hostname.includes('github')) return 'write sitemap';
    return null;
  } */

  /**
   * Attempts to find a sitemap URL within a robots.txt file.
   * @param {string} url - URL of the robots.txt file.
   * @returns {Promise<string|null>} Sitemap URL.
   */
  // async function findSitemapUrl(url) {
  //   const req = await UrlResourceHandler.fetch(url);
  //   if (req.ok) {
  //     const text = await req.text();
  //     const lines = text.split('\n');
  //     const sitemapLine = lines.find((line) => line.startsWith('Sitemap'));
  //     return sitemapLine ? sitemapLine.split(' ')[1] : null;
  //   }
  //   return null;
  // }

  static accept(sitemapFormData) {
    if (sitemapFormData['sitemap-option'] === 'none') {
      return this.getSitemapUrl(sitemapFormData) != null;
    }
    return false;
  }

  /**
   * Fetches URLs from a sitemap.
   * @param {string} sitemap - URL of the sitemap to fetch.
   * @returns {Promise<Object[]>} - Promise that resolves to an array of URL objects.
   */
  async fetchSitemap(sitemapFormData) {
    const sitemap = SitemapCrawler.getSitemapUrl(sitemapFormData);
    const urlObj = new URL(sitemap);
    return this.walkSitemapFromUrl(sitemap, urlObj.hostname);
  }
}

export default SitemapCrawler;

CrawlerRegistry.registerCrawler(SitemapCrawler);
