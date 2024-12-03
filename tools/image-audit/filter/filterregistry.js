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

  static register(filter) {
    if (filter.key.endsWith(AbstractFilter.WILDCARD)) {
      this.#wildcardFilters.push(filter);
    }
    this.#filterMap.set(filter.key, filter);
  }

  static get(filterKey) {
    if (!filterKey) return undefined;
    if (this.#filterMap.has(filterKey)) {
      return this.#filterMap.get(filterKey);
    }

    if (!this.#wildcardFilterMap.has(filterKey)) {
      // try to find it in the wildcard filters
      const matchedWildcardFilter = this.#wildcardFilters.find((wildcardFilter) => {
        const wildcardPrefix = wildcardFilter.key.slice(0, -1); // Remove '*' character
        return filterKey.startsWith(wildcardPrefix);
      });

      if (matchedWildcardFilter) {
        this.#wildcardFilterMap.set(filterKey, matchedWildcardFilter);
      } else {
        this.#wildcardFilterMap.set(filterKey, false); // cache the empty hit.
      }
    }

    if (this.#wildcardFilterMap.has(filterKey)) {
      const filterClazz = this.#wildcardFilterMap.get(filterKey); // can be false (above)
      if (filterClazz) {
        return filterClazz;
      }
    }

    return undefined;
  }

  static include(cluster, checkedFilters) {
    if (checkedFilters.length === 0) return true;

    // regroup the checked filters for wildcards
    const filterKeyToFilterKeys = new Map();

    for (let i = 0; i < checkedFilters.length; i += 1) {
      const filterKey = checkedFilters[i];
      const filter = this.get(filterKey);
      if (filter) {
        if (!filterKeyToFilterKeys.has(filter.key)) {
          filterKeyToFilterKeys.set(filter.key, []);
        }
        filterKeyToFilterKeys.get(filter.key).push(filterKey);
      } else {
        // eslint-disable-next-line no-console
        console.error(`Filter not found: ${filterKey}`);
      }
    }

    let foundAnyTrue = false;

    // If no matching filter returns false,
    // and at least one filter returns true, return true

    // avoiding use of generator-runtime.
    const entries = Array.from(filterKeyToFilterKeys.entries());
    for (let i = 0; i < entries.length; i += 1) {
      const [filterKey, filterKeys] = entries[i];
      const filter = this.get(filterKey);
      if (filter.include(cluster, filterKeys)) {
        foundAnyTrue = true;
      } else {
        return false;
      }
    }

    return foundAnyTrue;
  }
}

export default FilterRegistry;
