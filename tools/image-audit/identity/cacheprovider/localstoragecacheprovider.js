import IdentityRegistry from '../identityregistry.js';
import AbstractCacheProvider from './abstractcacheprovider.js';

class LocalStorageCacheProvider extends AbstractCacheProvider {
  // Private method to generate the cache key
  // eslint-disable-next-line class-methods-use-this
  #getCacheKey(identityHash, identity, key, version) {
    const { type } = identity;

    return [type, key, version, identityHash].join(':');
  }

  // Retrieve from cache
  async get(identityValues, identity, key, callthroughFunction, version = 1) {
    if (!this.isAsync(callthroughFunction)) {
      // eslint-disable-next-line no-console
      console.warn('Callthrough function is not async');
    }

    const { identityHash } = identityValues;
    if (!identityHash || !identity || !key || !identity.type) {
      return Promise.resolve(callthroughFunction());
    }
    const cacheKey = this.#getCacheKey(identityHash, identity, key, version);
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData !== undefined && cachedData !== null) {
      const parsedData = JSON.parse(cachedData);
      return parsedData;
    }

    // If not in localStorage, call through to the original function
    const result = await Promise.resolve(callthroughFunction());
    if (result !== undefined) this.#set(cacheKey, result);

    return result;
  }

  // Store identity in cache
  // eslint-disable-next-line consistent-return, class-methods-use-this
  #set(cacheKey, value) {
    try {
      // Store in localStorage
      localStorage.setItem(cacheKey, JSON.stringify(value));
    } catch (e) {
      try {
        // eslint-disable-next-line no-console
        console.warn('Your localStorage is having an issue (probably full), clearing and trying again', e);
        // If localStorage is full, clear it and try again
        localStorage.clear();
        localStorage.setItem(cacheKey, JSON.stringify(value));
      } catch (e2) {
        // If it still fails, dont complain about it.
        return false;
      }
    }
  }

  // Define provider priority
  static get providerPriority() {
    return 100;
  }
}

export default LocalStorageCacheProvider;

// Register with IdentityRegistry
IdentityRegistry.register(LocalStorageCacheProvider);
