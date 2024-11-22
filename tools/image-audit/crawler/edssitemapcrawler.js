// eslint-disable-next-line import/no-relative-packages
import { createOptimizedPicture } from '../../../scripts/aem.js';
import { AEM_EDS_HOSTS } from '../identity/imageidentity/urlidentity.js';
import CrawlerUtil from './util/crawlerutil.js';
import ImageAudutUtil from '../util/imageauditutil.js';
import AbstractCrawler from './abstractcrawler.js';
import CrawlerImageValues from './crawlerimagevalues.js';
import CrawlerRegistry from './crawlerregistry.js';

class EDSSitemapCrawler extends AbstractCrawler {
  #duplicateFilter;

  #stopped = false;

  constructor() {
    super();
    this.#duplicateFilter = new Set();
  }

  // eslint-disable-next-line class-methods-use-this
  #getEDSOptimizedImageUrl(src, origin, defaultWidth) {
    const originalUrl = new URL(src, origin);
    const aemSite = AEM_EDS_HOSTS.find((h) => originalUrl.host.endsWith(h));
    if (!aemSite) {
      return src;
    }

    // Use the width from the query parameter if available, otherwise use the provided defaultWidth
    const width = originalUrl.searchParams.has('width')
      ? originalUrl.searchParams.get('width')
      : defaultWidth;

    const pictureElement = createOptimizedPicture(
      originalUrl,
      'Optimized Image',
      false,
      [
        { media: `(min-width: ${width}px)`, width: `${width}` },
        { width: `${width}` },
      ],
    );

    // Extract the URL of the best-matched <source> for this device from pictureElement
    return `.${pictureElement.querySelector('source').getAttribute('srcset')}`;
  }

  stop() {
    this.#stopped = true;
  }

  // eslint-disable-next-line class-methods-use-this
  static #extractUrlType(url) {
    const { hostname, pathname } = new URL(url);
    const aemSite = AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
    if (aemSite && pathname.endsWith('.xml')) return 'sitemap';
    // if (aemSite && pathname.includes('robots.txt')) return 'robots';
    if (aemSite || hostname.includes('github')) return 'write sitemap';
    return null;
  }

  /**
   * Attempts to find a sitemap URL within a robots.txt file.
   * @param {string} url - URL of the robots.txt file.
   * @returns {Promise<string|null>} Sitemap URL.
   */
  // async function findSitemapUrl(url) {
  //   const req = await fetch(url);
  //   if (req.ok) {
  //     const text = await req.text();
  //     const lines = text.split('\n');
  //     const sitemapLine = lines.find((line) => line.startsWith('Sitemap'));
  //     return sitemapLine ? sitemapLine.split(' ')[1] : null;
  //   }
  //   return null;
  // }

  /**
   * Constructs a sitemap URL.
   * @param {string} url - URL to use for constructing the sitemap.
   * @returns {string|null} Sitemap URL.
   */
  // eslint-disable-next-line class-methods-use-this
  #writeSitemapUrl(url) {
    const { hostname, pathname } = new URL(url);
    const aemSite = AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
    // construct sitemap URL for an AEM site
    if (aemSite) {
      const [ref, repo, owner] = hostname.replace(`.${aemSite}`, '').split('--');
      return `https://${ref}--${repo}--${owner}.${aemSite.split('.')[0]}.live/sitemap.xml`;
    }
    // construct a sitemap URL for a GitHub repository
    if (hostname.includes('github')) {
      const [owner, repo] = pathname.split('/').filter((p) => p);
      return `https://main--${repo}--${owner}.hlx.live/sitemap.xml`;
    }
    return null;
  }

  static accept(sitemapFormData) {
    const url = sitemapFormData['site-url'];
    const urlType = this.#extractUrlType(url);
    return urlType?.includes('sitemap'); // TODO: Robots?
  }

  /**
   * Fetches URLs from a sitemap.
   * @param {string} sitemap - URL of the sitemap to fetch.
   * @returns {Promise<Object[]>} - Promise that resolves to an array of URL objects.
   */
  async fetchSitemap(sitemapFormData) {
    const url = sitemapFormData['site-url'];
    const urlType = EDSSitemapCrawler.#extractUrlType(url);
    const sitemap = urlType === 'sitemap' ? url : this.#writeSitemapUrl(url);
    return this.#fetchSitemapFromUrl(sitemap);
  }

  async #fetchSitemapFromUrl(sitemap) {
    const req = await fetch(sitemap);
    if (req.ok) {
      const text = await req.text();
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      // check for nested sitemaps and recursively fetch them
      if (xml.querySelector('sitemap')) {
        const sitemaps = [...xml.querySelectorAll('sitemap loc')];
        const allUrls = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const loc of sitemaps) {
          if (window.stopProcessing) {
            return CrawlerUtil.cleanseUrls(allUrls);
          }
          const { href, origin } = new URL(loc.textContent.trim());
          const originSwapped = href.replace(origin, sitemap.origin);
          // eslint-disable-next-line no-await-in-loop
          const nestedUrls = await this.fetchSitemap(originSwapped);
          allUrls.push(...nestedUrls);
        }
        return CrawlerUtil.cleanseUrls(allUrls);
      }
      if (xml.querySelector('url')) {
        const urls = [...xml.querySelectorAll('url loc')].map((loc) => {
          const { href, origin } = new URL(loc.textContent.trim());
          const siteMapUrl = new URL(sitemap);
          const swap = siteMapUrl.origin;
          let originSwapped = null;
          if (!siteMapUrl.host.startsWith('localhost')) {
            originSwapped = href.replace(origin, swap);
          } else {
            originSwapped = href;
          }
          const plain = `${originSwapped.endsWith('/') ? `${originSwapped}index` : originSwapped}.plain.html`;
          return { href: originSwapped, plain };
        });
        return CrawlerUtil.cleanseUrls(urls);
      }
    }
    return [];
  }

  async #fetchImageDataFromPage(url) {
    const html = document.createElement('div');

    try {
    // this counts on url.plain, which wont work for non eds sites.
      const rawHtml = await CrawlerUtil.fetchPageHtml(url.plain);
      // everything from here to the end needs to be synchronous or the document will load.
      // TODO: innerhtml here isn't great. Because it's using plain.html it's somewhat manageable.
      html.innerHTML = rawHtml;
      if (html) {
        const seenMap = new Map();
        const images = html.querySelectorAll('img[src]');
        const imgData = [...images].map((img) => {
          const width = img.getAttribute('width') || img.naturalWidth;
          const { origin } = new URL(url.href);
          const imgSrc = img.getAttribute('src');
          const originalUrl = new URL(imgSrc, origin);

          if (!CrawlerUtil.isUrlValid(originalUrl)) {
            return null;
          }

          const src = this.#getEDSOptimizedImageUrl(imgSrc, origin, width);

          if (!CrawlerUtil.isUrlValid(new URL(src, origin))) {
            return null;
          }

          let instance = 1;
          if (seenMap.has(src)) {
            instance = seenMap.get(src) + 1;
          }
          seenMap.set(src, instance);

          const alt = img.getAttribute('alt') || '';
          const height = img.getAttribute('height') || img.naturalHeight;
          const aspectRatio = parseFloat((width / height).toFixed(1)) || '';
          const fileType = ImageAudutUtil.getFileType(imgSrc);

          return new CrawlerImageValues({
            site: url.href,
            origin,
            src,
            alt,
            width,
            height,
            aspectRatio,
            instance,
            fileType,
          });
        }).filter((item) => item !== null);
        return imgData;
      }
      return [];
    } catch (error) {
    // eslint-disable-next-line no-console
      console.error(`unable to fetch ${url.href}:`, error);
      return [];
    } finally {
      html.innerHTML = '';
    }
  }

  async fetchBatch(batch, maxBatchSize, pageCounterIncrement) {
    const results = [];
    const tasks = [];

    for (let i = 0; !this.#stopped && i < maxBatchSize; i += 1) {
      tasks.push((async () => {
        while (batch.length > 0 && !this.#stopped) {
        // get the next URL from the batch
          const url = batch.shift();
          if (!this.#duplicateFilter.has(url.plain)) {
            this.#duplicateFilter.add(url.plain);
            // TODO: fetch in loop or async promises in a promisepool?
            // eslint-disable-next-line no-await-in-loop
            const imgData = await this.#fetchImageDataFromPage(url);
            if (imgData) {
              results.push(...imgData);
              pageCounterIncrement();
            }
          } else {
          // eslint-disable-next-line no-console
            console.debug('Duplicate URL found:', url.plain);
          }
        }
      })());
    }

    const promiseResults = await Promise.allSettled(tasks);
    promiseResults
      .filter((result) => result.status === 'rejected')
    // eslint-disable-next-line no-console
      .forEach((error) => console.error('Error processing batch', error));

    return results;
  }
}

export default EDSSitemapCrawler;

CrawlerRegistry.registerCrawler(EDSSitemapCrawler);
