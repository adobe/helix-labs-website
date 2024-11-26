/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
class AbstractSort {
  #sortedClusters = null; // Cached sorted list

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

  sort(clusterManager, page, max, ascending = false) {
    // Step 1: Populate and cache sortedClusters on first call
    if (!this.#sortedClusters) {
      this.#sortedClusters = this.buildSortedClusters(clusterManager);
    }

    // Step 2: Sort the cached list as needed
    const sortedList = [...this.#sortedClusters]; // Clone cached list
    if (ascending) {
      sortedList.reverse(); // Reverse for ascending order
    }

    // Step 3: Paginate the results
    const startIndex = (page - 1) * max;
    return sortedList.slice(startIndex, startIndex + max);
  }
}

export default AbstractSort;
