/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
class AbstractCacheProvider {
  async get(identityValues, identity, key, callthroughFunction, version = 1) {
    throw new Error('Abstract method');
  }

  /** lower is a higher priority and will override a lower priority */
  static get providerPriority() {
    return 999999999;
  }

  isAsync(fn) {
    return fn && fn.constructor.name === 'AsyncFunction';
  }
}

export default AbstractCacheProvider;
