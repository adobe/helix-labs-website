import AbstractSort from './abstractsort.js';
import SortRegistry from './sortregistry.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';

class Appearances extends AbstractSort {
  static isActive(formData, identifiers) {
    return identifiers.has(UrlAndPageIdentity.type);
  }

  static get key() {
    return 'count';
  }

  static get description() {
    return 'Appearances';
  }

  // eslint-disable-next-line class-methods-use-this
  buildSortedClusters(clusterManager) {
    return clusterManager
      .getAllWithIdentity(UrlAndPageIdentity.type)
      .map((cluster) => {
        const sites = cluster.getAll(UrlAndPageIdentity.type, 'site');
        return { cluster, count: sites.length }; // Store cluster and count
      })
      .sort((a, b) => b.count - a.count) // Default: descending order
      .map(({ cluster }) => cluster); // Cache only cluster objects
  }
}

export default Appearances;

SortRegistry.registerSort(Appearances);
