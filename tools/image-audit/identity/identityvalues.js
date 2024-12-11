import IdentityRegistry from './identityregistry.js';

class IdentityValues {
  #selectedIdentifiers;

  #originatingClusterId;

  #canvas;

  #ctx;

  #submissionValues;

  #clusterManager;

  #identityHash;

  #identityCache;

  #site;

  #alt;

  #width;

  #height;

  #aspectRatio;

  #instance;

  #fileType;

  #domainKey;

  #replacementDomain;

  #invalidDimensions;

  #imageOptions;

  constructor(
    {
      originatingClusterId,
      clusterManager,
      selectedIdentifiers,
      submissionValues,
      identityCache,
      imageOptions,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      fileType,
      domainKey,
      replacementDomain,
      invalidDimensions,
    },
  ) {
    this.#originatingClusterId = originatingClusterId;
    this.#clusterManager = clusterManager;
    this.#selectedIdentifiers = selectedIdentifiers;
    this.#submissionValues = submissionValues;
    this.#identityCache = identityCache;
    this.#identityHash = null;
    this.#imageOptions = imageOptions;
    this.#site = site;
    this.#alt = alt;
    this.#width = width;
    this.#height = height;
    this.#aspectRatio = aspectRatio;
    this.#instance = instance;
    this.#fileType = fileType;
    this.#domainKey = domainKey;
    this.#replacementDomain = replacementDomain;
    this.#invalidDimensions = invalidDimensions;
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

  get imageOptions() {
    return this.#imageOptions;
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

  get fileType() {
    return this.#fileType;
  }

  get domainKey() {
    return this.#domainKey;
  }

  get replacementDomain() {
    return this.#replacementDomain;
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

  get identityHash() {
    return this.#identityHash;
  }

  /**
   * Retrieves a value from the identity cache or calls a
   * function if the cache is not available.
   *
   * @param {string} identity - The identity key to retrieve the value for.
   * @param {string} key - The specific key within the identity to retrieve the value for.
   * @param {Function} callthroughFunction - The async function to call if the value is not in
   * the cache.
   * @param {number} [version=1] - The version of the identity cache to use (default is 1).
   * @returns {Promise<*>} - A promise that resolves to the retrieved value.
   */
  async get(identity, key, callthroughFunction, version = 1) {
    if (!this.#identityCache || !this.#identityHash) {
      // can't retrieve from hash, passthrough.
      return callthroughFunction();
    }
    return this.#identityCache.get(this, identity, key, callthroughFunction, version);
  }
}

export default IdentityValues;
