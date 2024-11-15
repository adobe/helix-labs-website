/* eslint-disable no-console */
/* eslint-disable class-methods-use-this */
import IdentityRegistry from '../identityregistry.js';
import AbstractCacheProvider from './abstractcacheprovider.js';

const IDENTITY_CACHE = 'identity-cache';

class IndexedDBCachProvider extends AbstractCacheProvider {
  // Initialize the IndexedDB for a specific domain
  async #openDB(identityValues) {
    const domain = identityValues.entryValues.replacementDomain?.toLowerCase()
      || new URL(identityValues.entryValues.href).hostname.toLowerCase();

    const dbName = `image-audit-${domain}`;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDENTITY_CACHE)) {
          db.createObjectStore(IDENTITY_CACHE);
        }
      };

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Retrieve from cache asynchronously
  async get(identityValues, identity, key, callthroughFunction, version = 1) {
    if (callthroughFunction && !this.isAsync(callthroughFunction)) {
      console.warn('Callthrough function is not async');
    }

    const { identityHash } = identityValues;
    if (!identityHash || !identity || !key || !identity.type) {
      return Promise.resolve(callthroughFunction());
    }

    // Initialize DB for the current domain
    const db = await this.#openDB(identityValues);
    const cacheKey = this.#getCacheKey(identityHash, identity, key, version);
    const cachedData = await this.#getFromDB(db, cacheKey);
    if (cachedData !== undefined) return cachedData;

    const result = await Promise.resolve(callthroughFunction());
    if (result !== undefined) await this.#setInDB(db, cacheKey, result);

    return result;
  }

  // Get data from IndexedDB asynchronously
  async #getFromDB(db, cacheKey) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IDENTITY_CACHE], 'readonly');
      const store = transaction.objectStore(IDENTITY_CACHE);
      const request = store.get(cacheKey);

      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Store data in IndexedDB
  async #setInDB(db, cacheKey, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IDENTITY_CACHE], 'readwrite');
      const store = transaction.objectStore(IDENTITY_CACHE);
      const request = store.put(value, cacheKey);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  #getCacheKey(identityHash, identity, key, version) {
    const { type } = identity;
    return [type, key, version, identityHash].join(':');
  }

  // Define provider priority
  static get providerPriority() {
    return 100;
  }
}

export default IndexedDBCachProvider;

// Register with IdentityRegistry
IdentityRegistry.register(IndexedDBCachProvider);
