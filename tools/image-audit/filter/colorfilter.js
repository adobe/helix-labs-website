import ColorIdentity from '../identity/imageidentity/coloridentity.js';
import AbstractFilter from './abstractfilter.js';
import FilterRegistry from './filterregistry.js';

class ColorFilter extends AbstractFilter {
  static isActive(sitemapFormData, identifiers) {
    return identifiers.has(ColorIdentity.type);
  }

  static get key() {
    return `color-${AbstractFilter.WILDCARD}`;
  }

  static get description() {
    return 'Color Filter';
  }

  static include(cluster, filterKeys) {
    const colorIdentity = cluster.getSingletonOf(ColorIdentity.type);
    if (!colorIdentity) return false;

    for (let i = 0; i < filterKeys.length; i += 1) {
      const filterKey = filterKeys[i];
      const selectedColor = filterKey.slice(ColorFilter.key.length - 1);
      if (colorIdentity.hasTopColor(selectedColor)) {
        return true;
      }
    }

    return false;
  }

  // eslint-disable-next-line no-unused-vars
  static changeCheckedFiltersOnCheck(checkedFilters) {
    return [];
  }
}

FilterRegistry.register(ColorFilter);

export default ColorFilter;
