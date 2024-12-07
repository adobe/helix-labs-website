// eslint-disable-next-line import/no-relative-packages
import { AEM_EDS_HOSTS } from '../../identity/imageidentity/urlidentity.js';
import CrawlerUtil from '../util/crawlerutil.js';
import ImageAudutUtil from '../../util/imageauditutil.js';
import AbstractCrawler from '../abstractcrawler.js';
import CrawlerImageValues from '../crawlerimagevalues.js';

// TODO: Make this dynamic? These are the max dimensions for the card and image compares.
const MAX_DIMENSION = 256;
const MIN_DIMENSION = 32;

class AbstractEDSSitemapCrawler extends AbstractCrawler {
  #duplicateFilter;

  #stopped = false;

  // TODO: make these come from the sitemap form
  #skip = 0;

  #end = 99999;

  constructor() {
    super();
    this.#duplicateFilter = new Set();
  }

  static #getAemSitemapFor(aemSite, hostname) {
    const [ref, repo, owner] = hostname.replace(`.${aemSite}`, '').split('--');
    return `https://${ref}--${repo}--${owner}.${aemSite.split('.')[0]}.live/sitemap.xml`;
  }

  static #getAemSitemapUrlForGithub(pathname) {
    const pathSplit = pathname.split('/');
    if (pathSplit.length < 2) {
      return null;
    }
    const owner = pathSplit[0];
    const repo = pathSplit[1];
    const ref = pathSplit.length > 3 && pathSplit[2] === 'tree' ? pathSplit[3] : 'main';
    return `https://${ref}--${repo}--${owner}.hlx.live/sitemap.xml`;
  }

  static getSitemapUrl(formData) {
    const { hostname, pathname } = new URL(formData['site-url']);
    const aemSite = AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
    // construct sitemap URL for an AEM site
    if (aemSite) {
      return AbstractEDSSitemapCrawler.#getAemSitemapFor(aemSite, hostname);
    }
    // construct a sitemap URL for a GitHub repository
    if (hostname.includes('github.com')) {
      return AbstractEDSSitemapCrawler.#getAemSitemapUrlForGithub(pathname);
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  #getEDSOptimizedImageUrl(src, origin, width) {
    const originalUrl = new URL(src, origin);
    if (!CrawlerUtil.isUrlValid(originalUrl)) {
      return null;
    }
    const aemSite = AEM_EDS_HOSTS.find((h) => originalUrl.host.endsWith(h));
    if (!aemSite) {
      return src;
    }

    originalUrl.searchParams.set('width', width);
    originalUrl.searchParams.set('format', 'webply');
    originalUrl.searchParams.set('optimize', 'medium');

    return originalUrl.href;

    /*
    // Use the width from the query parameter if available, otherwise use the provided defaultWidth
    const width = originalUrl.searchParams.has('width')
      ? originalUrl.searchParams.get('width')
      : defaultWidth;
    const pictureElement = createOptimizedPicture(
      originalUrl,
      'Optimized Image',
      true,
      [
        { media: `(min-width: ${width}px)`, width: `${width}` },
        { width: `${width}` },
      ],
    );
    // Extract the URL of the best-matched <source> for this device from pictureElement
    const rv = `.${pictureElement.querySelector('source').getAttribute('srcset')}`;
    pictureElement.outerHTML = '';
    return rv;
    */
  }

  stop() {
    this.#stopped = true;
  }

  static isAemSite(url) {
    const { hostname } = new URL(url);
    return hostname.includes('github.com') || AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
  }

  async walkSitemapFromUrl(sitemap, hlxHostname) {
    const req = await fetch(sitemap);
    if (req.ok) {
      const text = await req.text();
      return this.walkSitemap(text, hlxHostname);
    }
    return [];
  }

  async walkSitemap(sitemapText, hlxHostname) {
    const xml = new DOMParser().parseFromString(sitemapText, 'text/xml');
    // check for nested sitemaps and recursively fetch them
    if (xml.querySelector('sitemap')) {
      const sitemaps = [...xml.querySelectorAll('sitemap loc')];
      const allUrls = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const loc of sitemaps) {
        if (window.stopProcessing) {
          return CrawlerUtil.cleanseUrls(allUrls);
        }
        const url = new URL(loc.textContent.trim());
        // We dont replace the hostname on nested sitemaps.
        // eslint-disable-next-line no-await-in-loop
        const nestedUrls = await this.walkSitemapFromUrl(url, hlxHostname);
        allUrls.push(...nestedUrls);
      }
      return CrawlerUtil.cleanseUrls(allUrls);
    }
    if (xml.querySelector('url')) {
      const urls = [...xml.querySelectorAll('url loc')].map((loc) => {
        const url = new URL(loc.textContent.trim());
        url.hostname = hlxHostname;

        const plain = `${url.href.endsWith('/') ? `${url.href}index` : url.href}.plain.html`;
        return { href: url.href, plain };
      });
      return CrawlerUtil.cleanseUrls(urls);
    }
    return [];
  }

  async #fetchImageDataFromPage(url) {
    this.#end -= 1;
    if (this.#skip > 0) {
      this.#skip -= 1;
      return [];
    }
    if (this.#end <= 0) {
      return [];
    }

    const html = document.createElement('div');

    try {
      // this counts on url.plain, which wont work for non eds sites.
      // console.log('Crawling page: ', url.plain);
      const rawHtml = await CrawlerUtil.fetchPageHtml(url.plain);
      if (!rawHtml) {
        return [];
      }
      // everything from here to the end needs to be synchronous or the document will load.
      // TODO: innerhtml here isn't great. Because it's using plain.html it's somewhat manageable.
      html.innerHTML = rawHtml;
      if (html) {
        const seenMap = new Map();
        const images = html.querySelectorAll('img[src]');
        const imgData = [...images].map((img) => {
          let width = img.getAttribute('width') || img.naturalWidth;
          let height = img.getAttribute('height') || img.naturalHeight;
          const invalidDimensions = width === 0 || height === 0;
          if (!width) width = MIN_DIMENSION;
          if (!height) height = MIN_DIMENSION;

          const aspectRatio = parseFloat((width / height).toFixed(1)) || '';

          let cardWidth = width;
          let cardHeight = height;

          if (cardWidth < MIN_DIMENSION || cardHeight < MIN_DIMENSION) {
            const scalingFactor = MIN_DIMENSION / Math.min(cardWidth, cardHeight);
            cardWidth = Math.round(cardWidth * scalingFactor);
            cardHeight = Math.round(cardHeight * scalingFactor);
          }

          if (cardWidth > MAX_DIMENSION || cardHeight > MAX_DIMENSION) {
            const scalingFactor = MAX_DIMENSION / Math.max(cardWidth, cardHeight);
            cardWidth = Math.round(cardWidth * scalingFactor);
            cardHeight = Math.round(cardHeight * scalingFactor);
          }

          const { origin } = new URL(url.href);
          const src = img.getAttribute('src').split('?')[0];
          const originalUrl = new URL(src, origin);

          if (!CrawlerUtil.isUrlValid(originalUrl)) {
            return null;
          }

          const detailSrc = this.#getEDSOptimizedImageUrl(src, origin, width);
          const cardSrc = this.#getEDSOptimizedImageUrl(src, origin, cardWidth);

          if (!CrawlerUtil.isUrlValid(new URL(cardSrc, origin))) {
            return null;
          }

          let instance = 1;
          if (seenMap.has(src)) {
            instance = seenMap.get(src) + 1;
          }
          seenMap.set(src, instance);

          const alt = img.getAttribute('alt') || '';
          const fileType = ImageAudutUtil.getFileType(src);

          return new CrawlerImageValues({
            site: url.href,
            origin,
            src,
            cardSrc,
            detailSrc,
            alt,
            width,
            height,
            cardWidth,
            cardHeight,
            invalidDimensions,
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

export default AbstractEDSSitemapCrawler;
