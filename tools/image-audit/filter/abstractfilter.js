/* eslint-disable no-unused-vars */
class AbstractFilter {
  static get WILDCARD() {
    return '*';
  }

  static isActive(sitemapFormData, identifiers) {
    throw new Error('Method isActive() must be implemented');
  }

  static get key() {
    throw new Error('Not implemented');
  }

  static get description() {
    throw new Error('Not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  static include(cluster, keySelection) {
    throw new Error('Not implemented');
  }

  static changeCheckedFiltersOnCheck(checkedFilters) {
    return [];
  }
}

export default AbstractFilter;
