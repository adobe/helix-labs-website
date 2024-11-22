// eslint-disable-next-line import/no-relative-packages
import CrawlerRegistry from './crawlerregistry.js';
import AbstractEDSSitemapCrawler from './abstractedssitemapcrawler.js';

class FileEDSSitemapCrawler extends AbstractEDSSitemapCrawler {
  static accept(sitemapFormData) {
    if (sitemapFormData['sitemap-option'] === 'file' && sitemapFormData['embedded-sitemap-file']) {
      return this.getSitemapUrl(sitemapFormData) != null;
    }
    return false;
  }

  async fetchSitemap(sitemapFormData) {
    const { hostname } = new URL(FileEDSSitemapCrawler.getSitemapUrl(sitemapFormData));
    const file = sitemapFormData['embedded-sitemap-file'][0];

    if (!file) {
      throw new Error('No file provided in form data');
    }

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

export default FileEDSSitemapCrawler;

CrawlerRegistry.registerCrawler(FileEDSSitemapCrawler);
