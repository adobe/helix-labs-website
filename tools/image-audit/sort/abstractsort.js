/* eslint-disable class-methods-use-this */

import FilterRegistry from '../filter/filterregistry.js';

/* eslint-disable no-unused-vars */
class AbstractSort {
  #sortedClusters = null; // Cached sorted list

  #filteredClusters = null;

  #previousFilters = null; // used to detemine the filteredClusters are still valid

  static get key() {
    throw new Error(`${this.name} must implement the 'key' getter.`);
  }

  static get description() {
    throw new Error(`${this.name} must implement the 'description' getter.`);
  }

  static isActive(formData, identifiers) {
    throw new Error('Method isActive() must be implemented');
  }

  buildSortedClusters(clusterManager) {
    throw new Error('Method buildSortedClusters() must be implemented');
  }

  #arraysHaveSameElements(arr1, arr2) {
    if (arr1.length !== arr2.length) return false; // Quick length check
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    // Check that every element in set1 exists in set2 and vice versa
    return [...set1].every((value) => set2.has(value));
  }

  sort(clusterManager, filters, page, max, ascending = false) {
    if (!this.#previousFilters || !this.#arraysHaveSameElements(this.#previousFilters, filters)) {
      this.#filteredClusters = null;
      this.#previousFilters = filters;
    }

    if (!this.#sortedClusters) {
      this.#sortedClusters = this.buildSortedClusters(clusterManager);
    }

    if (!this.#filteredClusters) {
      if (!filters || filters.length === 0) {
        this.#filteredClusters = this.#sortedClusters;
      } else {
        this.#filteredClusters = this.#sortedClusters
          .filter((cluster) => FilterRegistry.include(cluster, filters));
      }
    }

    const sortedList = [...this.#filteredClusters]; // Clone cached list
    if (ascending) {
      sortedList.reverse(); // Reverse for ascending order
    }

    // Step 3: Paginate the results
    const startIndex = (page - 1) * max;
    return sortedList.slice(startIndex, startIndex + max);
  }
}

export default AbstractSort;
