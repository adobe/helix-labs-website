import AbstractFilter from './abstractfilter.js';

class FilterRegistry {
  static #filterMap = new Map();

  static #wildcardFilters = [];

  static #wildcardFilterMap = new Map(); // lazy loaded.

  static getFilters(sitemapFormData, identifiers) {
    const activeFilters = new Set();

    // Iterate over map values
    this.#filterMap.forEach((value) => {
      if (value.isActive(sitemapFormData, identifiers)) {
        activeFilters.add(value);
      }
    });

    // Sort the list alphabetically by description
    return Array.from(activeFilters).sort((a, b) => {
      const descA = a.description;
      const descB = b.description;
      return descA.localeCompare(descB);
    });
  }

  static get(filterKey) {
    return this.#filterMap.get(filterKey);
  }

  static register(filter) {
    if (filter.key.endsWith(AbstractFilter.WILDCARD)) {
      this.#wildcardFilters.push(filter);
    }
    this.#filterMap.set(filter.key, filter);
  }

  static include(cluster, checkedFilters) {
    if (checkedFilters.length === 0) return true;

    // If no matching filter returns false,
    // and at least one filter returns true, return true

    let foundAnyTrue = false;
    for (let i = 0; i < checkedFilters.length; i += 1) {
      const filter = checkedFilters[i];
      if (this.#filterMap.has(filter)) {
        if (this.#filterMap.get(filter).include(cluster, filter)) {
          foundAnyTrue = true;
        } else {
          return false;
        }
      } else if (!this.#wildcardFilterMap.has(filter)) {
        // try to find it in the wildcard filters
        const matchedWildcardFilter = this.#wildcardFilters.find((wildcardFilter) => {
          const wildcardPrefix = wildcardFilter.key.slice(0, -1); // Remove '*' character
          return filter.startsWith(wildcardPrefix);
        });

        if (matchedWildcardFilter) {
          this.#wildcardFilterMap.set(filter, matchedWildcardFilter);
        } else {
          this.#wildcardFilterMap.set(filter, false); // cache the empty hit.
        }
      }

      if (this.#wildcardFilterMap.has(filter)) {
        const filterObj = this.#wildcardFilterMap.get(filter);
        if (filterObj) { // test that it's not false
          if (filterObj.include(cluster, filter)) {
            foundAnyTrue = true;
          } else {
            return false;
          }
        }
      }
    }
    return foundAnyTrue;
  }
}

export default FilterRegistry;
