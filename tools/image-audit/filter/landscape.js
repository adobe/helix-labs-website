import AbstractFilter from './abstractfilter.js';
import FilterRegistry from './filterregistry.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';
import AspectUtil from './util/aspectutil.js';

class Landscape extends AbstractFilter {
  static isActive(sitemapFormData, identifiers) {
    return identifiers.has(UrlAndPageIdentity.type);
  }

  static get key() {
    return AspectUtil.LANDSCAPE_KEY;
  }

  static get description() {
    return 'Landscape aspect ratio';
  }

  // eslint-disable-next-line no-unused-vars
  static include(cluster, filterKeys) {
    const ratios = cluster.getAll(UrlAndPageIdentity.type, 'aspectRatio');

    const result = ratios.filter((ratio) => ratio <= 1.7 && ratio > 1);
    return result.length !== 0;
  }

  static changeCheckedFiltersOnCheck(checkedFilters) {
    return AspectUtil.changeCheckedFiltersOnCheck(checkedFilters, Landscape.key);
  }
}

FilterRegistry.register(Landscape);

export default Landscape;
