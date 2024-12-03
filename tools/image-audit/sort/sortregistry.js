class SortRegistry {
  static #sortMap = new Map();

  static getSorts(formData, identifiers) {
    const activeSorts = [];

    // Iterate over map values
    this.#sortMap.forEach((value) => {
      if (value.isActive(formData, identifiers)) {
        activeSorts.push(value);
      }
    });

    // Sort the list alphabetically by description
    return activeSorts.sort((a, b) => {
      const descA = a.description;
      const descB = b.description;
      return descA.localeCompare(descB);
    });
  }

  static registerSort(sort) {
    this.#sortMap.set(sort.key, sort);
  }

  #sortInstances;

  constructor() {
    this.#sortInstances = new Map();
  }

  getSortInstance(sortKey) {
    if (!SortRegistry.#sortMap.get(sortKey)) {
      return null;
    }

    if (!this.#sortInstances.has(sortKey)) {
      const clazz = SortRegistry.#sortMap.get(sortKey);
      // eslint-disable-next-line new-cap
      this.#sortInstances.set(sortKey, new clazz());
    }

    return this.#sortInstances.get(sortKey);
  }
}

export default SortRegistry;
