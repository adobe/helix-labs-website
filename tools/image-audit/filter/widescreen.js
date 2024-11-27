import AbstractFilter from './abstractfilter.js';
import FilterRegistry from './filterregistry.js';
import UrlAndPageIdentity from '../identity/imageidentity/urlandpageidentity.js';
import AspectUtil from './util/aspectutil.js';

class Widescreen extends AbstractFilter {
  static isActive(sitemapFormData, identifiers) {
    return identifiers.has(UrlAndPageIdentity.type);
  }

  static get key() {
    return AspectUtil.WIDESCREEN_KEY;
  }

  static get description() {
    return 'Widescreen aspect ratio';
  }

  // eslint-disable-next-line no-unused-vars
  static include(cluster, keySelection) {
    const ratios = cluster.getAll(UrlAndPageIdentity.type, 'aspectRatio');

    const result = ratios.filter((ratio) => ratio > 1.7);
    return result.length !== 0;
  }

  static changeCheckedFiltersOnCheck(checkedFilters) {
    return AspectUtil.changeCheckedFiltersOnCheck(checkedFilters, Widescreen.key);
  }
}

FilterRegistry.register(Widescreen);

export default Widescreen;
