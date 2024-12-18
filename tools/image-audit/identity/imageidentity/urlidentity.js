/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import Hash from '../util/hash.js';

const AEM_EDS_HOSTS = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'];

class UrlIdentity extends AbstractIdentity {
  #src;

  constructor(identityId, src) {
    super(identityId);
    this.#src = src;
  }

  static get type() {
    return 'url-img-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: UrlIdentity.type,
      display: 'URL',
      checked: true,
      hidden: false,
    };
  }

  get strong() {
    return true;
  }

  get src() {
    return this.#src;
  }

  // eslint-disable-next-line no-unused-vars
  static async identifyPreflight(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
      href,
    } = identityValues;

    const { identityId, durability } = await identityValues
      .get(UrlIdentity, 'identityId', async () => UrlIdentity.getUrlIdentityID(
        clusterManager,
        href,
        originatingClusterId,
        UrlIdentity.type,
        [],
      ));

    const identity = new UrlIdentity(identityId, href, durability);
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static async getUrlIdentityID(
    clusterManager,
    href,
    clusterId,
    type,
    additionalTokensToSum = [],
  ) {
    let durability = false;
    const url = new URL(href);
    const cluster = clusterManager.get(clusterId);
    const { elementForCluster } = cluster;

    const identificationParts = additionalTokensToSum.slice();

    // is loadedImg definitely a helix image? If so it can't be changed and we dont need the etag.

    if (AEM_EDS_HOSTS.find((h) => url.hostname.toLowerCase().endsWith(h))) {
      // no need to include the host. The path contains an immutable reference.
      // eslint-disable-next-line prefer-destructuring
      identificationParts.push(':eds:');
      identificationParts.push(href.split('://')[1].split('?')[0].toLowerCase());

      durability = true;
    } else {
      try {
        // Fetch the image to get the ETag from headers (if available)
        const response = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
        const etag = response.headers.get('ETag'); // Get the ETag if available
        const lastModified = response.headers.get('Last-Modified'); // Get the Last-Modified if available
        const contentLength = response.headers.get('Content-Length'); // Get the Content-Length if available
        const digest = response.headers.get('Digest'); // Get the Content-Length if available

        // there's a chance this changes during our processing,
        // but since we can't get the etag of the image we just loaded,
        // hope the cache gets it and roll with the risk.
        if (etag) {
          // high fidelity identifier
          identificationParts.push('et');
          identificationParts.push(etag);
          durability = true;
        } else if (digest) {
          identificationParts.push('dg');
          identificationParts.push(digest);
          durability = true;
        } else {
          // try to join what we do know. Lower fidelity identifier
          identificationParts.push(href); // Start with the URL or other primary identifier
          identificationParts.push('wt');

          if (lastModified && contentLength) {
            durability = true;
            // close enough.
          }

          // Check each field and add it to the array if it exists
          if (lastModified) {
            identificationParts.push(lastModified);
          }
          if (contentLength) {
            identificationParts.push(contentLength);
          }
          if (!lastModified && !contentLength) {
            durability = false;
            // use what we've got
            if (elementForCluster.width) {
              identificationParts.push(elementForCluster.width);
            }
            if (elementForCluster.height) {
              identificationParts.push(elementForCluster.height);
            }
          }
        }
      } catch (error) {
        durability = false; // reset
        identificationParts.length = 0;
        identificationParts.push(...additionalTokensToSum);
        identificationParts.push('er');
        identificationParts.push(href); // Start with the URL or other primary identifier
        // use what we've got
        if (elementForCluster.width) {
          identificationParts.push(elementForCluster.width);
        }
        if (elementForCluster.height) {
          identificationParts.push(elementForCluster.height);
        }
      }
    }
    const identityId = `${type.split('-').map((chunk) => chunk.charAt(0)).join('')}:${await Hash.createHash(identificationParts.join('::'))}`;
    return {
      identityId,
      durability,
    };
  }
}

export default UrlIdentity;
export { AEM_EDS_HOSTS };

IdentityRegistry.register(UrlIdentity);
