/* eslint-disable class-methods-use-this */
import AbstractSort from '../abstractsort.js';
import UrlAndPageIdentity from '../../identity/imageidentity/urlandpageidentity.js';
import PerformanceUtil from '../../reports/util/performanceutil.js';
import SortRegistry from '../sortregistry.js';

class Performance extends AbstractSort {
  static get key() {
    return 'performance';
  }

  static get description() {
    return 'Asset Performance';
  }

  // eslint-disable-next-line no-unused-vars
  static isActive(formData, identifiers) {
    // TODO: Collecting rum information should come from identityValues, not from window.
    return window.collectingRum;
  }

  buildSortedClusters(clusterManager) {
    return clusterManager
      .getAllWithIdentity(UrlAndPageIdentity.type)
      .map((cluster) => {
        const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
        const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
        const visits = cluster.getAll(UrlAndPageIdentity.type, 'visits').reduce((acc, curr) => acc + curr, 0);
        const bounces = cluster.getAll(UrlAndPageIdentity.type, 'bounces').reduce((acc, curr) => acc + curr, 0);

        const performanceScore = `${PerformanceUtil.getPerformanceScore(conversions, pageViews, visits, bounces, true)}`;

        return { cluster, performanceScore };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .map(({ cluster }) => cluster);
  }

  // must be implemented by classes that extend AbstractRumSort
  // get rumProperty()
}

export default Performance;

SortRegistry.registerSort(Performance);
