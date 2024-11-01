class IdentityRegistry {
  static #identityRegistry = new IdentityRegistry();

  static get identityRegistry() {
    return this.#identityRegistry;
  }

  #registeredClasses;

  #identifyPreflightSet;

  #identifyPostflightSet;

  #identifyPostflightWithCanvasSet;

  #identifyPostErrorSet;

  #types;

  constructor() {
    this.#identifyPreflightSet = new Set();
    this.#identifyPostflightSet = new Set();
    this.#identifyPostflightWithCanvasSet = new Set();
    this.#identifyPostErrorSet = new Set();
    this.#registeredClasses = new Set();
    this.#types = [];
  }

  static get registeredClasses() {
    return Array.from(this.identityRegistry.#registeredClasses);
  }

  static register(registeredClass) {
    const identityRegistry = IdentityRegistry.#identityRegistry;

    if (identityRegistry.#registeredClasses.has(registeredClass)) {
      return;
    }
    identityRegistry.#registeredClasses.add(registeredClass);
    if (registeredClass.identifyPreflight) {
      identityRegistry.#identifyPreflightSet.add(registeredClass);
    }
    if (registeredClass.identifyPostflight) {
      identityRegistry.#identifyPostflightSet.add(registeredClass);
    }
    // eslint-disable-next-line max-len
    if (registeredClass.identifyPostflightWithCanvas) {
      identityRegistry.#identifyPostflightWithCanvasSet.add(registeredClass);
    }
    if (registeredClass.identifyPostError) {
      identityRegistry.#identifyPostErrorSet.add(registeredClass);
    }
    identityRegistry.#types.push(registeredClass.type);
  }

  // eslint-disable-next-line class-methods-use-this
  async #runIdentifications(set, methodName, identityValues, identityState) {
    const promises = [];
    const selectedIdentifiers = Array.from(set)
      .filter((clazz) => identityValues.selectedIdentifiers.has(clazz.type));

    // cut down the identityState to just a piece for the identity itself.
    selectedIdentifiers.forEach((clazz) => {
      if (!identityState[clazz.type]) {
        identityState[clazz.type] = {};
      }
      promises.push(clazz[methodName](identityValues, identityState[clazz.type]));
    });

    const results = await Promise.allSettled(promises);
    results
      .filter((result) => result.status === 'rejected')
      // eslint-disable-next-line no-console
      .forEach((error) => console.error('Error handling identification', error));
  }

  async identifyPreflight(identityValues, identityState) {
    await this.#runIdentifications(this.#identifyPreflightSet, 'identifyPreflight', identityValues, identityState);
  }

  async identifyPostflight(identityValues, identityState) {
    await this.#runIdentifications(this.#identifyPostflightSet, 'identifyPostflight', identityValues, identityState);
  }

  async identifyPostflightWithCanvas(identityValues, identityState) {
    await this.#runIdentifications(this.#identifyPostflightWithCanvasSet, 'identifyPostflightWithCanvas', identityValues, identityState);
  }

  async identifyPostError(identityValues, identityState) {
    await this.#runIdentifications(this.#identifyPostErrorSet, 'identifyPostError', identityValues, identityState);
  }

  get types() {
    return this.#types;
  }
}

export default IdentityRegistry;
