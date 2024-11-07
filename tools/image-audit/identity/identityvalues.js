import IdentityRegistry from './identityregistry.js';

class IdentityValues {
  #selectedIdentifiers;

  #originatingClusterId;

  #canvas;

  #ctx;

  #submissionValues;

  #entryValues;

  #clusterManager;

  #identityHash;

  #identityCache;

  constructor(
    originatingClusterId,
    clusterManager,
    identityCache,
    selectedIdentifiers,
    submissionValues,
    entryValues,
  ) {
    this.#originatingClusterId = originatingClusterId;
    this.#clusterManager = clusterManager;
    this.#selectedIdentifiers = selectedIdentifiers;
    this.#submissionValues = submissionValues;
    this.#entryValues = entryValues;
    this.#identityCache = identityCache;
    this.#identityHash = null;
  }

  async initializeIdentityHash() {
    if (
      this.#identityCache
      && IdentityRegistry.identityRegistry.identityHashProvider
      && !this.#identityHash) {
      this.#identityHash = await IdentityRegistry.identityRegistry
        .identityHashProvider.hashIdentityValues(this);
    }
  }

  get selectedIdentifiers() {
    return this.#selectedIdentifiers;
  }

  get originatingClusterId() {
    return this.#originatingClusterId;
  }

  get clusterManager() {
    return this.#clusterManager;
  }

  get entryValues() {
    return this.#entryValues;
  }

  get canvas() {
    if (!this.#canvas) {
      throw new Error('Canvas not set');
    }

    return this.#canvas;
  }

  set canvas(canvas) {
    if (this.#canvas) {
      throw new Error('Canvas already set');
    }
    this.#canvas = canvas;
  }

  get ctx() {
    if (!this.#ctx) {
      throw new Error('ctx not set');
    }
    return this.#ctx;
  }

  set ctx(ctx) {
    if (this.#ctx) {
      throw new Error('ctx already set');
    }
    this.#ctx = ctx;
  }

  get submissionValues() {
    return this.#submissionValues;
  }

  async get(identity, key, callthroughFunction, version = 1) {
    if (!this.#identityCache || !this.#identityHash) {
      // can't retrieve from hash, passthrough.
      const rv = Promise.resolve(await callthroughFunction());
      return rv;
    }
    return this.#identityCache.get(this.#identityHash, identity, key, callthroughFunction, version);
  }

  getSync(identity, key, callthroughFunction, version = 1) {
    if (!this.#identityCache || !this.#identityHash) {
      // can't retrieve from hash, passthrough.
      const rv = callthroughFunction();
      return rv;
    }
    return this.#identityCache.get(this.#identityHash, identity, key, callthroughFunction, version);
  }
}

export default IdentityValues;
