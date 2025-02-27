import AbstractFilter from './abstractfilter.js';
import FilterRegistry from './filterregistry.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';
import AspectUtil from './util/aspectutil.js';

class Square extends AbstractFilter {
  static isActive(sitemapFormData, identifiers) {
    return identifiers.has(UrlAndPageIdentity.type);
  }

  static get key() {
    return AspectUtil.SQUARE_KEY;
  }

  static get description() {
    return 'Square aspect ratio';
  }

  // eslint-disable-next-line no-unused-vars
  static include(cluster, filterKeys) {
    const ratios = cluster.getAll(UrlAndPageIdentity.type, 'aspectRatio');

    const result = ratios.filter((ratio) => ratio === 1);
    return result.length !== 0;
  }

  static changeCheckedFiltersOnCheck(checkedFilters) {
    return AspectUtil.changeCheckedFiltersOnCheck(checkedFilters, Square.key);
  }
}

FilterRegistry.register(Square);

export default Square;
