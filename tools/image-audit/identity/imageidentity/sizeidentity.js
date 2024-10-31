/* eslint-disable class-methods-use-this */
import AbstractIdentity from '../abstractidentity.js';
import IdentityRegistry from '../identityregistry.js';
import Hash from '../util/hash.js';

class SizeIdentity extends AbstractIdentity {
  #id;

  #src;

  #size;

  constructor(id, href, size) {
    super();
    this.#id = id;
    this.#src = href;
    this.#size = size;
  }

  static async getSizeId(href) {
    return `size:${await Hash.createHash(href)}`;
  }

  static get maxBytes() {
    return 100000;
  }

  static get type() {
    return 'size-identity';
  }

  static get uiSelectorProperties() {
    return {
      identity: SizeIdentity.type,
      display: 'Size',
      checked: true,
      hidden: true,
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

  get tooBigForWeb() {
    return this.#size >= this.maxBytes;
  }

  get size() {
    return this.#size;
  }

  // eslint-disable-next-line no-unused-vars
  static async identifyPreflight(identityValues, identityState) {
    const {
      originatingClusterId,
      clusterManager,
      elementForCluster,
    } = identityValues;

    const { href } = identityValues.entryValues;

    const size = await SizeIdentity.#getSize(elementForCluster, identityValues.entryValues);
    const id = await SizeIdentity.getSizeId(href);
    const identity = new SizeIdentity(id, href, size);
    clusterManager.get(originatingClusterId).addIdentity(identity);
  }

  static async #getSize(elementForCluster, entryValues) {
    const { href, height, width } = entryValues;
    const url = new URL(href);
    try {
      // Fetch the image to get the ETag from headers (if available)
      const headResponse = await fetch(url, { method: 'HEAD' }); // HEAD request to only fetch headers
      const contentLength = headResponse.headers.get('Content-Length'); // Get the Content-Length if available
      if (contentLength) {
        return contentLength;
      }

      const response = await fetch(url);
      if (!response.body) throw new Error('ReadableStream not supported');

      let totalBytes = 0;
      const reader = response.body.getReader();

      while (totalBytes < this.maxBytes) {
        // eslint-disable-next-line no-await-in-loop
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.length;
      }
      if (totalBytes >= this.maxBytes) return this.maxBytes;
      return totalBytes;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Unable to fetch image directly to calculate size. Will use fallback', error);
      return width * height * 4; // a "best guess" based on the image dimensions
    }
  }
}

export default SizeIdentity;

IdentityRegistry.register(SizeIdentity);
