// eslint-disable-next-line import/no-relative-packages
import CrawlerRegistry from '../crawlerregistry.js';
import AbstractEDSSitemapCrawler from './abstractedssitemapcrawler.js';

/**
 * URL Sitemap Crawler - uses a sitemap from an external URL
 */
class UrlSitemapCrawler extends AbstractEDSSitemapCrawler {
  static get type() {
    return 'sitemap-url';
  }

  static get displayName() {
    return 'Sitemap from URL';
  }

  static get description() {
    return 'Provide a URL to an external sitemap';
  }

  static getFormConfig() {
    return {
      visibleFields: [
        'site-url',
        'embedded-sitemap-url',
        'replacement-domain',
        'domain-key',
        'identity-selectors',
      ],
      requiredFields: ['site-url', 'embedded-sitemap-url'],
      helpText: {
        'site-url': 'EDS site URL to use as the base for crawling pages',
        'embedded-sitemap-url': 'URL to an external sitemap.xml file',
      },
      placeholders: {
        'site-url': 'https://main--repo--org.aem.live',
        'embedded-sitemap-url': 'https://example.com/sitemap.xml',
      },
    };
  }

  static accept(sitemapFormData) {
    // Accept if crawler-type matches
    if (sitemapFormData['crawler-type'] === this.type) {
      return true;
    }
    // Legacy support
    if (sitemapFormData['sitemap-option'] === 'url' && sitemapFormData['embedded-sitemap-url']) {
      return this.getSitemapUrl(sitemapFormData) != null;
    }
    return false;
  }

  async fetchSitemap(sitemapFormData) {
    const siteUrl = sitemapFormData['site-url'];
    const { hostname } = new URL(siteUrl);
    const sitemap = sitemapFormData['embedded-sitemap-url'];

    return this.walkSitemapFromUrl(sitemap, hostname);
  }
}

export default UrlSitemapCrawler;

CrawlerRegistry.registerCrawler(UrlSitemapCrawler);
