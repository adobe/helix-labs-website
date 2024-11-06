import AbstractIdentityHashProvider from './abstractidentityhashprovider.js';
import UrlIdentity from '../imageidentity/urlidentity.js';
import IdentityRegistry from '../identityregistry.js';

class UrlHashProvider extends AbstractIdentityHashProvider {
  static async hashIdentityValues(identityValues) {
    const {
      clusterManager,
      originatingClusterId,
      entryValues,
    } = identityValues;

    const { identityId, durability } = await UrlIdentity.getUrlIdentityID(
      clusterManager,
      entryValues.href,
      originatingClusterId,
      UrlIdentity.type,
      [],
    );

    if (durability) {
      return identityId;
    }
    return null;
  }

  static get providerPriority() {
    return 100;
  }
}

export default UrlHashProvider;

IdentityRegistry.register(UrlHashProvider);
