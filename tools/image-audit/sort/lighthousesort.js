import AbstractSort from './abstractsort.js';
import SortRegistry from './sortregistry.js';
import LighthouseIdentity from '../identity/imageidentity/lighthouseidentity.js';

class LighthouseSort extends AbstractSort {
  #sortedClusters = null; // Cached sorted list

  // eslint-disable-next-line no-unused-vars
  static isActive(formData, identifiers) {
    return true;
  }

  static get key() {
    return 'lighthouse';
  }

  static get description() {
    return 'Asset Success Score';
  }

  // eslint-disable-next-line class-methods-use-this
  buildSortedClusters(clusterManager) {
    return clusterManager
      .getAllWithIdentity(LighthouseIdentity.type)
      .map((cluster) => {
        const identity = cluster.getSingletonOf(LighthouseIdentity.type);
        const lighthouse = identity ? Math.round(identity.scores.total) : 0;

        return { cluster, lighthouse }; // Store cluster and count
      })
      .sort((a, b) => b.lighthouse - a.lighthouse) // Default: descending order
      .map(({ cluster }) => cluster); // Cache only cluster objects
  }
}

export default LighthouseSort;

SortRegistry.registerSort(LighthouseSort);
