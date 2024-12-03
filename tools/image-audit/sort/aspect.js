import AbstractSort from './abstractsort.js';
import SortRegistry from './sortregistry.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';

class Aspect extends AbstractSort {
  static isActive(formData, identifiers) {
    return identifiers.has(UrlAndPageIdentity.type);
  }

  static get key() {
    return 'aspect';
  }

  static get description() {
    return 'Aspect Ratio';
  }

  // eslint-disable-next-line class-methods-use-this
  buildSortedClusters(clusterManager) {
    return clusterManager
      .getAllWithIdentity(UrlAndPageIdentity.type)
      .map((cluster) => {
        // TODO: Different copies can have different aspect ratios.
        // This presumes they're all the same.
        const identity = cluster.getFirstIdentityOf(UrlAndPageIdentity.type);
        return { cluster, aspectRatio: identity.aspectRatio };
      })
      .sort((a, b) => b.aspectRatio - a.aspectRatio)
      .map(({ cluster }) => cluster);
  }
}

export default Aspect;

SortRegistry.registerSort(Aspect);
