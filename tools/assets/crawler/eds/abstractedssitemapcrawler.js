// eslint-disable-next-line import/no-relative-packages
import { AEM_EDS_HOSTS } from '../../identity/imageidentity/urlidentity.js';
import CrawlerUtil from '../util/crawlerutil.js';
import CrawlerPageParser from '../util/crawlerpageparser.js';
import AbstractCrawler from '../abstractcrawler.js';
import PromisePool from '../../util/promisepool.js';
import UrlResourceHandler from '../../util/urlresourcehandler.js';

// TODO: Make this dynamic? These are the max dimensions for the card and image compares.
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

    const { origin } = new URL(url.href);

    return CrawlerPageParser.parsePageForImages({
      pageUrl: url.href,
      plainUrl: url.plain,
      origin,
      getOptimizedImageUrl: (src, orig, width, height, maxDimension) => this
        .#getAdjustedEDSOptimizedImageUrl(src, orig, width, height, maxDimension),
    });
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
