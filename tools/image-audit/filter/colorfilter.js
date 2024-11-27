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

  static include(cluster, key) {
    const colorIdentity = cluster.getSingletonOf(ColorIdentity.type);
    if (!colorIdentity) return false;

    const selectedColor = key.slice(ColorFilter.key.length - 1);
    if (colorIdentity.hasTopColor(selectedColor)) {
      return true;
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
