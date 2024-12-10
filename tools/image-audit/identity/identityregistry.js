import AbstractIdentity from './abstractidentity.js';
import AbstractIdentityHashProvider from './cacheprovider/abstractidentityhashprovider.js';
import AbstractCacheProvider from './cacheprovider/abstractcacheprovider.js';
import PromisePool from '../util/promisepool.js';

class IdentityRegistry {
  static #identityRegistry = new IdentityRegistry();

  static get identityRegistry() {
    return this.#identityRegistry;
  }

  #registeredIdentityClasses;

  #identifyPreflightSet;

  #identifyPostflightSet;

  #identifyPostflightWithCanvasSet;

  #identifyPostErrorSet;

  #types;

  #identityHashProvider;

  #identityCache;

  constructor() {
    this.#identifyPreflightSet = new Set();
    this.#identifyPostflightSet = new Set();
    this.#identifyPostflightWithCanvasSet = new Set();
    this.#identifyPostErrorSet = new Set();
    this.#registeredIdentityClasses = new Set();
    this.#identityHashProvider = null;
    this.#types = [];
  }

  static get registeredIdentityClasses() {
    return Array.from(this.identityRegistry.#registeredIdentityClasses);
  }

  static register(registeredClass) {
    const identityRegistry = IdentityRegistry.#identityRegistry;

    if (Object.prototype.isPrototypeOf
      .call(AbstractIdentity.prototype, registeredClass.prototype)) {
      // Identity classes
      if (registeredClass.identifyPreflight) {
        identityRegistry.#identifyPreflightSet.add(registeredClass);
      }
      if (registeredClass.identifyPostflight) {
        identityRegistry.#identifyPostflightSet.add(registeredClass);
      }
      if (registeredClass.identifyPostflightWithCanvas) {
        identityRegistry.#identifyPostflightWithCanvasSet.add(registeredClass);
      }
      if (registeredClass.identifyPostError) {
        identityRegistry.#identifyPostErrorSet.add(registeredClass);
      }
      if (registeredClass.type) {
        identityRegistry.#types.push(registeredClass.type);
      }
      identityRegistry.#registeredIdentityClasses.add(registeredClass);
    } else if (Object.prototype.isPrototypeOf
      .call(AbstractIdentityHashProvider.prototype, registeredClass.prototype)) {
      // Hash classes
      if (!identityRegistry.#identityHashProvider) {
        identityRegistry.#identityHashProvider = registeredClass;
      } else if (identityRegistry.#identityHashProvider.providerPriority
        > registeredClass.providerPriority) {
        identityRegistry.#identityHashProvider = registeredClass;
      }
    } else if (Object.prototype.isPrototypeOf
      .call(AbstractCacheProvider.prototype, registeredClass.prototype)) {
      // Cache classes
      if (!identityRegistry.#identityCache) {
        // eslint-disable-next-line new-cap
        identityRegistry.#identityCache = new registeredClass();
      } else if (identityRegistry.#identityCache.providerPriority
        > registeredClass.providerPriority) {
        // eslint-disable-next-line new-cap
        identityRegistry.#identityCache = new registeredClass();
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async #runIdentifications(set, methodName, identityValues, identityState) {
    const promisePool = new PromisePool(Infinity, `IdentityRegistry identification pool for ${identityValues.originatingClusterId}`);
    const selectedIdentifiers = Array.from(set)
      .filter((clazz) => identityValues.selectedIdentifiers.has(clazz.type));

    // cut down the identityState to just a piece for the identity itself.
    selectedIdentifiers.forEach((clazz) => {
      if (!identityState[clazz.type]) {
        identityState[clazz.type] = {};
      }

      promisePool.run(async () => clazz[methodName](identityValues, identityState[clazz.type]));
    });
    return promisePool.allSettled();
  }

  async identifyPreflight(identityValues, identityState) {
    return this.#runIdentifications(this.#identifyPreflightSet, 'identifyPreflight', identityValues, identityState);
  }

  async identifyPostflight(identityValues, identityState) {
    return this.#runIdentifications(this.#identifyPostflightSet, 'identifyPostflight', identityValues, identityState);
  }

  async identifyPostflightWithCanvas(identityValues, identityState) {
    return this.#runIdentifications(this.#identifyPostflightWithCanvasSet, 'identifyPostflightWithCanvas', identityValues, identityState);
  }

  async identifyPostError(identityValues, identityState) {
    return this.#runIdentifications(this.#identifyPostErrorSet, 'identifyPostError', identityValues, identityState);
  }

  get types() {
    return this.#types;
  }

  get identityCache() {
    return this.#identityCache;
  }

  get identityHashProvider() {
    return this.#identityHashProvider;
  }
}

export default IdentityRegistry;
