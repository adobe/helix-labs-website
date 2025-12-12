/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
import { DataChunks } from '@adobe/rum-distiller';
// eslint-disable-next-line import/no-unresolved
import DataLoader from '@adobe/rum-loader';
import AbstractIdentity from '../abstractidentity.js';
import UrlIdentity from './urlidentity.js';
import IdentityRegistry from '../identityregistry.js';
import Hash from '../util/hash.js';
import UrlResourceHandler from '../../util/urlresourcehandler.js';
import ImageUrlParserRegistry from '../../crawler/util/imageurlparserregistry.js';

const BUNDLER_ENDPOINT = 'https://rum.fastly-aem.page';
// const BUNDLER_ENDPOINT = 'http://localhost:3000';
const API_ENDPOINT = BUNDLER_ENDPOINT;

class UrlAndPageIdentity extends AbstractIdentity {
  #src;

  #site;

  #alt;

  #width;

  #height;

  #aspectRatio;

  #instance;

  #rumData;

  #pageLastModified;

  #assetLastModified;

  #firstSeenTimestamp;

  #lastSeenTimestamp;

  #assetViews;

  #assetClicks;

  constructor(
    identityId,
    src,
    site,
    alt,
    width,
    height,
    aspectRatio,
    instance,
    pageLastModified,
    assetLastModified,
  ) {
    super(identityId);
    this.#src = src;
    this.#site = site;
    this.#alt = alt;
    this.#width = width;
    this.#height = height;
    this.#aspectRatio = aspectRatio;
    this.#instance = instance;
    this.#pageLastModified = pageLastModified;
    this.#assetLastModified = assetLastModified;
    this.#firstSeenTimestamp = null;
    this.#lastSeenTimestamp = null;
    this.#assetViews = 0;
    this.#assetClicks = 0;
  }

  get pageViews() {
    return this.#rumData ? this.#rumData.pageViews : 0;
  }

  get conversions() {
    return this.#rumData ? this.#rumData.conversions : 0;
  }

  get visits() {
    return this.#rumData ? this.#rumData.visits : 0;
  }

  get bounces() {
    return this.#rumData ? this.#rumData.bounces : 0;
  }

  get pageLastModified() {
    return this.#pageLastModified;
  }

  get assetLastModified() {
    return this.#assetLastModified;
  }

  get firstSeenTimestamp() {
    return this.#firstSeenTimestamp;
  }

  get lastSeenTimestamp() {
    return this.#lastSeenTimestamp;
  }

  get assetViews() {
    return this.#assetViews;
  }

  get assetClicks() {
    return this.#assetClicks;
  }

  get assetClickThroughRate() {
    if (!this.#assetViews) return 0;
    return Math.min(this.#assetClicks / this.#assetViews, 1);
  }

  /**
   * Returns the publish date using the fallback chain:
   * 1. Page Last-Modified (most recent if multiple pages)
   * 2. Asset's own Last-Modified
   * 3. Falls back to null if neither available
   */
  get publishDate() {
    // Priority 1: Page Last-Modified (most authoritative)
    if (this.#pageLastModified) {
      return this.#pageLastModified;
    }
    // Priority 2: Asset's own Last-Modified
    if (this.#assetLastModified) {
      return this.#assetLastModified;
    }
    // No date information available
    return null;
  }

  static get type() {
    return 'url-page-img-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: UrlAndPageIdentity.type,
      display: 'URL and Page',
      checked: true,
      hidden: true, // currently other functionality doesn't work without this
    };
  }

  get src() {
    return this.#src;
  }

  get site() {
    return this.#site;
  }

  get alt() {
    return this.#alt;
  }

  get width() {
    return this.#width;
  }

  get height() {
    return this.#height;
  }

  get aspectRatio() {
    return this.#aspectRatio;
  }

  get instance() {
    return this.#instance;
  }

  static async identifyPreflight(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      pageLastModified,
      assetLastModified,
    } = identityValues;

    const { href } = identityValues.imageOptions.original;

    const url = new URL(site);
    const additionalTokensToSum = [site];
    additionalTokensToSum.push(instance);

    // cache for the identity is based on the image itself,
    // but in this case we need to also include the site and instance.
    const hashKey = `identityId:${await Hash.createHash(additionalTokensToSum.join((':')))}`;

    const identityId = await identityValues
      .get(UrlAndPageIdentity, hashKey, async () => UrlAndPageIdentity
        .#getIdentityID(
          url,
          additionalTokensToSum,
          site,
          clusterManager,
          href,
          originatingClusterId,
        ));

    const identity = new UrlAndPageIdentity(
      identityId,
      href,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      pageLastModified,
      assetLastModified,
    );

    if (identityValues.domainKey) {
      await identity.#obtainRum(identityValues, identityState);
    }

    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static async #getIdentityID(
    url,
    additionalTokensToSum,
    site,
    clusterManager,
    href,
    originatingClusterId,
  ) {
    try {
      const response = await UrlResourceHandler.fetch(url, { method: 'HEAD', cache: 'force-cache' });
      const etag = response.headers.get('ETag'); // Get the ETag if available
      const lastModified = response.headers.get('Last-Modified'); // Get the Last-Modified if available
      const contentLength = response.headers.get('Content-Length'); // Get the Content-Length if available
      const digest = response.headers.get('Digest'); // Get the Content-Length if available

      // there's a chance this changes during our processing,
      // but since we can't get the etag of the image we just loaded,
      // hope the cache gets it and roll with the risk.
      if (etag) {
        additionalTokensToSum.push('et');
        additionalTokensToSum.push(etag);
      } else if (digest) {
        additionalTokensToSum.push('dg');
        additionalTokensToSum.push(digest);
      } else {
        // Check each field and add it to the array if it exists
        if (lastModified) {
          additionalTokensToSum.push('lm');
          additionalTokensToSum.push(lastModified);
        }
        if (contentLength) {
          additionalTokensToSum.push('cl');
          additionalTokensToSum.push(contentLength);
        }
      }
    } catch (error) {
      additionalTokensToSum.length = 0;
      additionalTokensToSum.push('er');
      additionalTokensToSum.push(site); // Start with the URL or other primary identifier
    }

    const { identityId } = await UrlIdentity.getUrlIdentityID(
      clusterManager,
      href,
      originatingClusterId,
      UrlAndPageIdentity.type,
      additionalTokensToSum,
    );
    return identityId;
  }

  // eslint-disable-next-line class-methods-use-this
  async #obtainRum(identityValues, identityState) {
    try {
      // TODO: Rum data should really be on a page cluster, not an image cluster.
      // const siteURL = new URL(values.site);
      const dataChunks = new DataChunks();

      if (!identityState.rumLoadedData) {
        if (identityState.rumLoadedError) {
          return;
        }
        // TODO: Selectable range
        const loader = new DataLoader();
        loader.apiEndpoint = API_ENDPOINT;
        loader.domain = identityValues.replacementDomain;
        loader.domainKey = identityValues.domainKey;
        if (identityState.rumLoadingPromise) {
          try {
            await identityState.rumLoadingPromise;
          } catch (error) {
            this.#rumData = {
              pageViews: 0,
              conversions: 0,
              visits: 0,
              bounces: 0,
            };
            return;
          }
        } else {
          try {
            // Fetch 25 months of data (full RUM retention)
            identityState.rumLoadingPromise = (async () => {
              const chunks = await loader.fetchPrevious12Months(null);
              const endDate = new Date();
              endDate.setMonth(endDate.getMonth() - 13);
              const olderChunks = await loader.fetchPrevious12Months(endDate);
              identityState.rumLoadedData = [...chunks, ...olderChunks];
              return identityState.rumLoadedData;
            })();
            await identityState.rumLoadingPromise;
            identityState.rumLoadingPromise = null;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error loading rum data:', error);
            // fill it with a stub so we dont slam RUM with requests.
            identityState.rumLoadedError = true;
            this.#rumData = {
              pageViews: 0,
              conversions: 0,
              visits: 0,
              bounces: 0,
            };
            return;
          }
        }
      }
      const { rumLoadedData } = identityState;

      const conversionSpec = { checkpoint: ['click'] };

      // set up metrics for dataChunks
      dataChunks.addSeries('pageViews', (bundle) => bundle.weight);
      dataChunks.addSeries('visits', (bundle) => (bundle.visit ? bundle.weight : 0));
      // a bounce is a visit without a click
      dataChunks.addSeries('bounces', (bundle) => (bundle.visit && !bundle.events.find(({ checkpoint }) => checkpoint === 'click')
        ? bundle.weight
        : 0));
      dataChunks.addSeries('conversions', (bundle) => (dataChunks.hasConversion(bundle, conversionSpec)
        ? bundle.weight
        : 0));
      dataChunks.addFacet('checkpoint', (bundle) => Array.from(bundle.events.reduce((acc, evt) => {
        acc.add(evt.checkpoint);
        return acc;
      }, new Set())), 'every');

      const siteURL = new URL(identityValues.site);
      // RUM usually reports the public hostname (replacementDomain), but can occasionally
      // contain the internal hostname. Treat both as the same site for filtering/matching.
      const internalPageUrl = new URL(siteURL.href);
      const publicPageUrl = new URL(siteURL.href);
      publicPageUrl.hostname = identityValues.replacementDomain;

      dataChunks.addFacet('url', (bundle) => {
        const url = new URL(bundle.url);
        return url.href;
      });

      const acceptedPageUrls = new Set([internalPageUrl.href.toLowerCase(), publicPageUrl.href.toLowerCase()]);
      dataChunks.addFacet('filter', (bundle) => acceptedPageUrls.has(String(bundle.url).toLowerCase()));

      dataChunks.load(rumLoadedData);

      dataChunks.filter = { url: [publicPageUrl.href, internalPageUrl.href] };

      const pageViews = dataChunks.totals?.pageViews?.sum ?? 0;
      const conversions = dataChunks.totals?.conversions?.sum ?? 0;
      const visits = dataChunks.totals?.visits?.sum ?? 0;
      const bounces = dataChunks.totals?.bounces?.sum ?? 0;

      this.#rumData = {
        pageViews,
        conversions,
        visits,
        bounces,
        // dataChunks,
      };

      // ---- Seen timestamps (requires raw bundle access) ----
      // We derive "first/last seen" from bundle.timeSlot (coarse but consistent with RUM retention).
      // For assets, prefer bundles that contain a matching viewmedia target (by pathname).
      // Cache per page+asset-path to avoid rescans across identities.
      if (!identityState.rumSeenIndex) {
        identityState.rumSeenIndex = {
          pageRange: new Map(), // pageUrlLower -> { first:number|null, last:number|null }
          pageAssetRange: new Map(), // pageUrlLower -> Map<assetPath, { first:number|null, last:number|null }>
        };
      }
      if (!identityState.rumAssetMetricIndex) {
        identityState.rumAssetMetricIndex = {
          pageAssetMetrics: new Map(), // pageUrlLower -> Map<assetKey, { views:number, clicks:number }>
        };
      }

      // Cache by internal page URL (stable for the crawl), but accept both internal+public when scanning bundles.
      const pageKey = internalPageUrl.href.toLowerCase();
      const assetUrl = new URL(this.#src);
      const assetKey = ImageUrlParserRegistry.getDurableIdentityPart(assetUrl) || assetUrl.pathname;

      const cachedPage = identityState.rumSeenIndex.pageRange.get(pageKey);
      const cachedAssetMap = identityState.rumSeenIndex.pageAssetRange.get(pageKey);
      const cachedAsset = cachedAssetMap ? cachedAssetMap.get(assetKey) : null;
      const cachedMetricMap = identityState.rumAssetMetricIndex.pageAssetMetrics.get(pageKey);
      const cachedMetrics = cachedMetricMap ? cachedMetricMap.get(assetKey) : null;

      if (cachedPage && cachedAsset && cachedMetrics) {
        this.#firstSeenTimestamp = cachedAsset.first;
        this.#lastSeenTimestamp = cachedAsset.last;
        this.#assetViews = cachedMetrics.views;
        this.#assetClicks = Math.min(cachedMetrics.clicks, this.conversions);
        // If we somehow didn't see the asset but did see the page, keep asset nulls (per spec),
        // but callers can still use publishDate/pageLastModified.
      } else {
        let pageFirst = cachedPage?.first ?? null;
        let pageLast = cachedPage?.last ?? null;

        let assetFirst = cachedAsset?.first ?? null;
        let assetLast = cachedAsset?.last ?? null;

        let assetViews = cachedMetrics?.views ?? 0;
        let assetClicks = cachedMetrics?.clicks ?? 0;

        // Scan raw bundles only for this page, and only for the one assetPath we care about.
        // rumLoadedData is an array of chunks: { date, rumBundles }
        for (const chunk of rumLoadedData) {
          const bundles = chunk?.rumBundles || [];
          for (const bundle of bundles) {
            if (!bundle?.url || !acceptedPageUrls.has(String(bundle.url).toLowerCase())) continue;
            if (!bundle?.timeSlot) continue;

            const ts = new Date(bundle.timeSlot).getTime();
            if (!Number.isFinite(ts)) continue;

            // Page seen range
            if (pageFirst === null || ts < pageFirst) pageFirst = ts;
            if (pageLast === null || ts > pageLast) pageLast = ts;

            // Asset seen range (viewmedia target pathname match)
            const events = bundle?.events || [];
            const weight = Number(bundle.weight) || 0;
            let bundleSawAsset = false;
            let bundleClickedAsset = false;
            const lastViewmediaBySource = new Map();
            let lastViewmediaAny = null;

            // eslint-disable-next-line no-restricted-syntax
            for (const evt of events) {
              if (!evt?.checkpoint) continue;

              if (evt.checkpoint === 'viewmedia' && evt.target) {
                let targetUrl;
                try {
                  targetUrl = new URL(evt.target, bundle.url);
                } catch {
                  continue;
                }
                const targetKey = ImageUrlParserRegistry.getDurableIdentityPart(targetUrl) || targetUrl.pathname;
                if (targetKey !== assetKey) continue;

                // Seen timestamps
                if (assetFirst === null || ts < assetFirst) assetFirst = ts;
                if (assetLast === null || ts > assetLast) assetLast = ts;

                bundleSawAsset = true;

                // Correlate clicks by source identifier and event order.
                const sourceKey = evt.source || '__nosrc__';
                lastViewmediaBySource.set(sourceKey, assetKey);
                lastViewmediaAny = { assetKey, sourceKey };
              }

              if (evt.checkpoint === 'click') {
                const sourceKey = evt.source || '__nosrc__';
                const matchedBySource = lastViewmediaBySource.get(sourceKey) === assetKey;
                const matchedByProximity = lastViewmediaAny?.assetKey === assetKey;
                if (matchedBySource || matchedByProximity) {
                  bundleClickedAsset = true;
                }
              }
            }

            // Metrics are estimated by summing bundle.weight once per bundle per asset
            if (bundleSawAsset) {
              assetViews += weight;
            }
            if (bundleClickedAsset) {
              assetClicks += weight;
            }
          }
        }

        identityState.rumSeenIndex.pageRange.set(pageKey, { first: pageFirst, last: pageLast });
        if (!identityState.rumSeenIndex.pageAssetRange.has(pageKey)) {
          identityState.rumSeenIndex.pageAssetRange.set(pageKey, new Map());
        }
        identityState.rumSeenIndex.pageAssetRange.get(pageKey).set(assetKey, { first: assetFirst, last: assetLast });

        if (!identityState.rumAssetMetricIndex.pageAssetMetrics.has(pageKey)) {
          identityState.rumAssetMetricIndex.pageAssetMetrics.set(pageKey, new Map());
        }
        identityState.rumAssetMetricIndex.pageAssetMetrics.get(pageKey).set(assetKey, { views: assetViews, clicks: assetClicks });

        this.#firstSeenTimestamp = assetFirst;
        this.#lastSeenTimestamp = assetLast;
        this.#assetViews = assetViews;
        this.#assetClicks = Math.min(assetClicks, this.conversions);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing rum:', error);
      this.#rumData = {
        pageViews: 0,
        conversions: 0,
        visits: 0,
        bounces: 0,
      };
      identityState.rumLoadedError = true;
    }
  }

  // UrlAndPageIdentity should never merge - each URL+page+instance is unique
  // If this is called, it's a bug in the clustering logic
  // eslint-disable-next-line no-unused-vars
  mergeOther(otherIdentity) {
    throw new Error('BUG: mergeOther called on UrlAndPageIdentity - this should never merge');
  }
}

IdentityRegistry.register(UrlAndPageIdentity);

export default UrlAndPageIdentity;
