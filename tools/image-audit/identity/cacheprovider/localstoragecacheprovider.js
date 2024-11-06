import IdentityRegistry from '../identityregistry.js';
import AbstractCacheProvider from './abstractcacheprovider.js';

class LocalStorageCacheProvider extends AbstractCacheProvider {
  #cache;

  constructor() {
    super();
    this.#cache = new Map(); // Use Map for in-memory cache
  }

  // Private method to generate the cache key
  // eslint-disable-next-line class-methods-use-this
  #getCacheKey(identityHash, identity, key, version) {
    const { type } = identity;

    return [type, version, identityHash, key].join(':');
  }

  // Retrieve from cache
  async get(identityHash, identity, key, callthroughFunction, version = 1) {
    if (!identityHash || !identity || !key || !identity.type) {
      return null;
    }
    const cacheKey = this.#getCacheKey(identityHash, identity, key, version);
    return this.#get(cacheKey, callthroughFunction);
  }

  async #get(cacheKey, callthroughFunction) {
    // Check in-memory cache (Map) first
    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey);
    }

    // If not in memory, check localStorage
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      this.#cache.set(cacheKey, parsedData); // Store in memory cache
      return parsedData;
    }

    if (!callthroughFunction) return null;
    // If not in localStorage, call through to the original function
    const result = await callthroughFunction();
    if (result !== undefined) this.#set(cacheKey, result);

    return result;
  }

  // Store identity in cache
  // eslint-disable-next-line consistent-return
  #set(cacheKey, value) {
    // Update in-memory cache (Map)
    this.#cache.set(cacheKey, value);

    // Store in localStorage
    localStorage.setItem(cacheKey, JSON.stringify(value));
  }

  // Define provider priority
  static get providerPriority() {
    return 100;
  }
}

export default LocalStorageCacheProvider;

// Register with IdentityRegistry
IdentityRegistry.register(LocalStorageCacheProvider);
