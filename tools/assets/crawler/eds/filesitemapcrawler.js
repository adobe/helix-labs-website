// eslint-disable-next-line import/no-relative-packages
import CrawlerRegistry from '../crawlerregistry.js';
import AbstractEDSSitemapCrawler from './abstractedssitemapcrawler.js';

/**
 * File Sitemap Crawler - uses an uploaded sitemap XML file
 */
class FileSitemapCrawler extends AbstractEDSSitemapCrawler {
  static get type() {
    return 'sitemap-file';
  }

  static get displayName() {
    return 'Sitemap from File';
  }

  static get description() {
    return 'Upload a sitemap XML file to crawl';
  }

  static getFormConfig() {
    return {
      visibleFields: [
        'site-url',
        'embedded-sitemap-file',
        'replacement-domain',
        'domain-key',
        'identity-selectors',
      ],
      requiredFields: ['site-url', 'embedded-sitemap-file'],
      helpText: {
        'site-url': 'EDS site URL to use as the base for crawling pages',
        'embedded-sitemap-file': 'Upload a sitemap.xml file',
      },
      placeholders: {
        'site-url': 'https://main--repo--org.aem.live',
      },
    };
  }

  static accept(sitemapFormData) {
    // Accept if crawler-type matches
    if (sitemapFormData['crawler-type'] === this.type) {
      return true;
    }
    // Legacy support
    if (sitemapFormData['sitemap-option'] === 'file' && sitemapFormData['embedded-sitemap-file']) {
      return this.getSitemapUrl(sitemapFormData) != null;
    }
    return false;
  }

  async fetchCrawlerData(formData) {
    const siteUrl = formData['site-url'];
    const { hostname } = new URL(siteUrl);
    const file = formData['embedded-sitemap-file'][0];

    if (!file) {
      throw new Error('No file provided in form data');
    }

    // eslint-disable-next-line no-console
    console.info(`Parsing sitemap file: ${file.name || '(unknown filename)'}`);
    const text = await this.readFileAsText(file);
    if (!text) {
      return [];
    }
    return this.walkSitemap(text, hostname);
  }

  // eslint-disable-next-line class-methods-use-this
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // Resolve with the file content
      reader.onerror = (error) => reject(error); // Reject on error
      reader.readAsText(file); // Start reading the file
    });
  }
}

export default FileSitemapCrawler;

CrawlerRegistry.registerCrawler(FileSitemapCrawler);
