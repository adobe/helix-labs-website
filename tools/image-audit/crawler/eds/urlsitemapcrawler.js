// eslint-disable-next-line import/no-relative-packages
import CrawlerRegistry from '../crawlerregistry.js';
import AbstractEDSSitemapCrawler from './abstractedssitemapcrawler.js';

class UrlSitemapCrawler extends AbstractEDSSitemapCrawler {
  static accept(sitemapFormData) {
    if (sitemapFormData['sitemap-option'] === 'url' && sitemapFormData['embedded-sitemap-url']) {
      return this.getSitemapUrl(sitemapFormData) != null;
    }
    return false;
  }

  async fetchSitemap(sitemapFormData) {
    const { hostname } = new URL(UrlSitemapCrawler.getSitemapUrl(sitemapFormData));
    const sitemap = sitemapFormData['embedded-sitemap-url'];

    return this.walkSitemapFromUrl(sitemap, hostname);
  }
}

export default UrlSitemapCrawler;

CrawlerRegistry.registerCrawler(UrlSitemapCrawler);
