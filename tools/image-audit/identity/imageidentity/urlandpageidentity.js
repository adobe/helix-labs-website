/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/no-unresolved
import { DataChunks } from '@adobe/rum-distiller';
// eslint-disable-next-line import/no-unresolved
import DataLoader from 'https://www.aem.live/tools/rum/loader.js';
import AbstractIdentity from '../abstractidentity.js';
import UrlIdentity from './urlidentity.js';
import IdentityRegistry from '../identityregistry.js';

const BUNDLER_ENDPOINT = 'https://rum.fastly-aem.page';
// const BUNDLER_ENDPOINT = 'http://localhost:3000';
const API_ENDPOINT = BUNDLER_ENDPOINT;

// eslint-disable-next-line import/no-unresolved

// eslint-disable-next-line import/no-unresolved

const exactTextMatchThresholdPercent = 0.1;

class UrlAndPageIdentity extends AbstractIdentity {
  #id;

  #src;

  #site;

  #alt;

  #width;

  #height;

  #aspectRatio;

  #instance;

  #rumData;

  constructor(identityId, src, site, alt, width, height, aspectRatio, instance) {
    super();
    this.#id = identityId;
    this.#src = src;
    this.#site = site;
    this.#alt = alt;
    this.#width = width;
    this.#height = height;
    this.#aspectRatio = aspectRatio;
    this.#instance = instance;
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

  get id() {
    return this.#id;
  }

  get strong() {
    return false;
  }

  get signleton() {
    return false;
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

  static get similarityCollaborator() {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  static async identifyPreflight(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
    } = identityValues;

    const {
      href,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
    } = identityValues.entryValues;

    const url = new URL(site);
    const additionalTokensToSum = [site];
    additionalTokensToSum.push(instance);

    const identityId = await identityValues
      .get(UrlAndPageIdentity, 'identityId', () => UrlAndPageIdentity
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
    );

    if (identityValues.entryValues.domainKey) {
      await identity.#obtainRum(identityValues.entryValues, identityState);
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
      const response = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
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
  async #obtainRum(values, identityState) {
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
        loader.domain = values.replacementDomain;
        loader.domainKey = values.domainKey;
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
            identityState.rumLoadingPromise = loader.fetchPrevious12Months(null);
            identityState.rumLoadedData = await identityState.rumLoadingPromise;
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

      const siteURL = new URL(values.site);
      siteURL.hostname = values.replacementDomain;

      dataChunks.addFacet('url', (bundle) => {
        const url = new URL(bundle.url);
        return url.href;
      });

      dataChunks.addFacet('filter', (bundle) => {
        const matching = bundle.url.toLowerCase() === siteURL.href.toLowerCase();
        return matching;
      });

      dataChunks.load(rumLoadedData);

      dataChunks.filter = { url: [siteURL.href] };

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

  getMergeWeight(otherIdenty) {
    const {
      exactMatch,
      wordDifferencePercentage,
      bothSidesHadWords,
    } = this.compareWords(() => this.alt, () => otherIdenty.alt);

    const rv = otherIdenty.width === this.width && otherIdenty.height === this.height ? 5 : 0;

    if (!bothSidesHadWords) return rv;
    if (exactMatch) return 10 + rv;
    if (wordDifferencePercentage <= exactTextMatchThresholdPercent / 2) return 5 + rv;
    if (wordDifferencePercentage <= exactTextMatchThresholdPercent) return 3 + rv;
    if (wordDifferencePercentage <= exactTextMatchThresholdPercent * 2) return 1 + rv;
    return 0;
  }
}

IdentityRegistry.register(UrlAndPageIdentity);

export default UrlAndPageIdentity;
