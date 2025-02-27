/* eslint-disable no-unused-vars */
class AbstractIdentityHashProvider {
  static async hashIdentityValues(identityValues) {
    throw new Error('Abstract method');
  }

  static get providerPriority() {
    return 0;
  }
}

export default AbstractIdentityHashProvider;
