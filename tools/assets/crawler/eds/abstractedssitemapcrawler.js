// eslint-disable-next-line import/no-relative-packages
import { AEM_EDS_HOSTS } from '../../identity/imageidentity/urlidentity.js';
import CrawlerUtil from '../util/crawlerutil.js';
import ImageAudutUtil from '../../util/imageauditutil.js';
import AbstractCrawler from '../abstractcrawler.js';
import CrawlerImageValues from '../crawlerimagevalues.js';
import PromisePool from '../../util/promisepool.js';
import UrlResourceHandler from '../../util/urlresourcehandler.js';

// TODO: Make this dynamic? These are the max dimensions for the card and image compares.
const MAX_DETAIL_DIMENSION = 1024;
const MAX_MEDIUM_DIMENSION = 800;
const MAX_CARD_DIMENSION = 256;
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
  #getAdjustedEDSOptimizedImageUrl(src, origin, width, height, maxLongestEdge) {
    let adjustedWidth = width;
    let adjustedHeight = height;

    if (adjustedWidth < MIN_DIMENSION || adjustedHeight < MIN_DIMENSION) {
      const scalingFactor = MIN_DIMENSION / Math.min(adjustedWidth, adjustedHeight);
      adjustedWidth = Math.round(adjustedWidth * scalingFactor);
      adjustedHeight = Math.round(adjustedHeight * scalingFactor);
    }

    if (adjustedWidth > maxLongestEdge || adjustedHeight > maxLongestEdge) {
      const scalingFactor = maxLongestEdge / Math.max(adjustedWidth, adjustedHeight);
      adjustedWidth = Math.round(adjustedWidth * scalingFactor);
      adjustedHeight = Math.round(adjustedHeight * scalingFactor);
    }

    const url = this.#getEDSOptimizedImageUrl(src, origin, adjustedWidth);
    if (!CrawlerUtil.isUrlValid(url)) {
      return null;
    }

    return {
      href: url.href,
      width: adjustedWidth,
      height: adjustedHeight,
    };
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

    return originalUrl;
  }

  stop() {
    this.#stopped = true;
  }

  static isAemSite(url) {
    const { hostname } = new URL(url);
    return hostname.includes('github.com') || AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
  }

  async walkSitemapFromUrl(sitemap, hlxHostname) {
    const req = await UrlResourceHandler.fetch(sitemap);
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

    try {
      // Fetch and parse the page using DOMParser (no live DOM insertion)
      // This counts on url.plain, which only works for EDS sites.
      const doc = await CrawlerUtil.fetchPageDocument(url.plain);
      if (!doc) {
        return [];
      }

      // Query images directly from the DOMParser document
      // Reading getAttribute('src') is safe - it won't trigger resource loads
      // since the document is not inserted into the live DOM
      const seenMap = new Map();
      const images = doc.querySelectorAll('img[src]');
      const { origin } = new URL(url.href);

      const imgData = [...images].map((img) => {
        let width = img.getAttribute('width') || 0;
        let height = img.getAttribute('height') || 0;
        const invalidDimensions = width === 0 || height === 0;
        if (!width) width = MIN_DIMENSION;
        if (!height) height = MIN_DIMENSION;

        const aspectRatio = parseFloat((width / height).toFixed(1)) || '';

        // Read src directly - safe because doc is from DOMParser, not live DOM
        const src = img.getAttribute('src')?.split('?')[0];
        if (!src) return null;

        const originalUrl = new URL(src, origin);

        if (!CrawlerUtil.isUrlValid(originalUrl)) {
          return null;
        }

        const original = { href: originalUrl.href, height, width };
        const detail = this
          .#getAdjustedEDSOptimizedImageUrl(src, origin, width, height, MAX_DETAIL_DIMENSION);
        const medium = this
          .#getAdjustedEDSOptimizedImageUrl(src, origin, width, height, MAX_MEDIUM_DIMENSION);
        const card = this
          .#getAdjustedEDSOptimizedImageUrl(src, origin, width, height, MAX_CARD_DIMENSION);

        const imageOptions = {};
        imageOptions.original = original;
        imageOptions.detail = detail || original;
        imageOptions.medium = medium || original;
        imageOptions.card = card || original;

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
          imageOptions,
          alt,
          width,
          height,
          invalidDimensions,
          aspectRatio,
          instance,
          fileType,
        });
      }).filter((item) => item !== null);

      return imgData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`unable to fetch ${url.href}:`, error);
      return [];
    }
  }

  async fetchBatch(batch, maxBatchSize, pageCounterIncrement) {
    const results = [];
    const promisePool = new PromisePool(Infinity, 'Sitemap crawler fetchBatch pool');

    for (let i = 0; !this.#stopped && i < maxBatchSize; i += 1) {
      promisePool.run(async () => {
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
      });
    }

    await promisePool.allSettled();
    return results;
  }
}

export default AbstractEDSSitemapCrawler;
