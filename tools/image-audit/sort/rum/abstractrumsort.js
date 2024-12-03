/* eslint-disable class-methods-use-this */
import AbstractSort from '../abstractsort.js';
import UrlAndPageIdentity from '../../identity/imageidentity/urlandpageidentity.js';

class AbstractRumSort extends AbstractSort {
  // eslint-disable-next-line no-unused-vars
  static isActive(formData, identifiers) {
    // TODO: Collecting rum information should come from identityValues, not from window.
    return window.collectingRum;
  }

  buildSortedClusters(clusterManager) {
    return clusterManager
      .getAllWithIdentity(UrlAndPageIdentity.type)
      .map((cluster) => {
        const rumScore = cluster
          .getAll(UrlAndPageIdentity.type, this.rumProperty)
          .reduce((acc, curr) => acc + curr, 0);

        return { cluster, rumScore };
      })
      .sort((a, b) => b.rumScore - a.rumScore)
      .map(({ cluster }) => cluster);
  }

  // must be implemented by classes that extend AbstractRumSort
  // get rumProperty()
}

export default AbstractRumSort;
