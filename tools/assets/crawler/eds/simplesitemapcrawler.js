// eslint-disable-next-line import/no-relative-packages
import CrawlerRegistry from '../crawlerregistry.js';
import AbstractEDSSitemapCrawler from './abstractedssitemapcrawler.js';
import UrlResourceHandler from '../../util/urlresourcehandler.js';

/**
 * Simple Sitemap Crawler - discovers pages from sitemap.xml or robots.txt
 */
class SimpleSitemapCrawler extends AbstractEDSSitemapCrawler {
  static get type() {
    return 'sitemap';
  }

  static get displayName() {
    return 'Sitemap Crawler';
  }

  static get description() {
    return 'Discovers pages from the site\'s sitemap.xml or robots.txt';
  }

  static getFormConfig() {
    return {
      visibleFields: [
        'site-url',
        'replacement-domain',
        'domain-key',
        'identity-selectors',
      ],
      requiredFields: ['site-url'],
      helpText: {
        'site-url': 'EDS site URL. Sitemap will be discovered from robots.txt or /sitemap.xml',
      },
      placeholders: {
        'site-url': 'https://main--repo--org.aem.live',
      },
    };
  }

  /**
   * Discovers sitemap URLs from robots.txt at the given origin.
   * @param {string} origin - The origin URL (e.g., https://example.com)
   * @returns {Promise<string[]>} Array of sitemap URLs found
   */
  static async discoverSitemapsFromRobots(origin) {
    const robotsUrl = `${origin}/robots.txt`;
    const sitemaps = [];

    try {
      // eslint-disable-next-line no-console
      console.info(`Fetching robots.txt: ${robotsUrl}`);
      const resp = await UrlResourceHandler.fetch(robotsUrl);
      if (resp.ok) {
        const text = await resp.text();
        const lines = text.split('\n');

        // Find all Sitemap: directives (case-insensitive)
        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith('sitemap:')) {
            // Extract URL after "Sitemap:" - handle both space and colon separators
            const sitemapUrl = trimmed.slice(8).trim();
            if (sitemapUrl) {
              sitemaps.push(sitemapUrl);
            }
          }
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug('Could not fetch robots.txt:', error.message);
    }

    // Fallback to /sitemap.xml if no sitemaps found in robots.txt
    if (sitemaps.length === 0) {
      // eslint-disable-next-line no-console
      console.info(`No sitemaps in robots.txt; falling back to ${origin}/sitemap.xml`);
      sitemaps.push(`${origin}/sitemap.xml`);
    }

    return sitemaps;
  }

  /**
   * Check if the URL is just an origin (no meaningful path)
   */
  static isOriginOnly(url) {
    const { pathname } = new URL(url);
    return pathname === '/' || pathname === '';
  }

  static accept(sitemapFormData) {
    // Accept if crawler-type matches OR legacy sitemap-option is 'none'
    if (sitemapFormData['crawler-type'] === this.type) {
      return true;
    }
    // Legacy support: accept if sitemap-option is 'none' and we can handle it
    if (sitemapFormData['sitemap-option'] === 'none') {
      const siteUrl = sitemapFormData['site-url'];
      return this.getSitemapUrl(sitemapFormData) != null || this.isOriginOnly(siteUrl);
    }
    return false;
  }

  /**
   * Fetches URLs from sitemaps.
   * If a direct sitemap URL is derivable, use it.
   * Otherwise, discover sitemaps from robots.txt.
   * @returns {Promise<Object[]>} - Promise that resolves to an array of URL objects.
   */
  async fetchCrawlerData(formData) {
    const siteUrl = formData['site-url'];
    const derivedSitemap = SimpleSitemapCrawler.getSitemapUrl(formData);

    let sitemapUrls;

    if (derivedSitemap) {
      // Use the derived sitemap (AEM/GitHub pattern)
      sitemapUrls = [derivedSitemap];
    } else {
      // Discover sitemaps from robots.txt
      const { origin } = new URL(siteUrl);
      // eslint-disable-next-line no-console
      console.info(`Discovering sitemaps from ${origin}/robots.txt...`);
      sitemapUrls = await SimpleSitemapCrawler.discoverSitemapsFromRobots(origin);
      // eslint-disable-next-line no-console
      console.info(`Found ${sitemapUrls.length} sitemap(s):`, sitemapUrls);
    }

    // Walk all discovered sitemaps and combine results
    const allUrls = [];
    const urlObj = new URL(siteUrl);

    // eslint-disable-next-line no-restricted-syntax
    for (const sitemapUrl of sitemapUrls) {
      if (window.stopProcessing) break;
      try {
        // eslint-disable-next-line no-await-in-loop
        const urls = await this.walkSitemapFromUrl(sitemapUrl, urlObj.hostname);
        allUrls.push(...urls);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to fetch sitemap ${sitemapUrl}:`, error.message);
      }
    }

    return allUrls;
  }
}

export default SimpleSitemapCrawler;

CrawlerRegistry.registerCrawler(SimpleSitemapCrawler);
