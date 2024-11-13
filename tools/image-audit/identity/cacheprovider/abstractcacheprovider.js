/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
class AbstractCacheProvider {
  async get(identityHash, identity, key, callthroughFunction, version = 1) {
    throw new Error('Abstract method');
  }

  static get providerPriority() {
    return 0;
  }
}

export default AbstractCacheProvider;
