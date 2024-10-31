class IdentityValues {
  #selectedIdentifiers;

  #originatingClusterId;

  #canvas;

  #ctx;

  #submissionValues;

  #entryValues;

  #clusterManager;

  constructor(
    originatingClusterId,
    clusterManager,
    selectedIdentifiers,
    submissionValues,
    entryValues,
  ) {
    this.#originatingClusterId = originatingClusterId;
    this.#clusterManager = clusterManager;
    this.#selectedIdentifiers = selectedIdentifiers;
    this.#submissionValues = submissionValues;
    this.#entryValues = entryValues;
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
}

export default IdentityValues;
