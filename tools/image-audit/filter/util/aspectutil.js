class AspectUtil {
  static get SQUARE_KEY() { return 'shape-square'; }

  static get WIDESCREEN_KEY() { return 'shape-widescreen'; }

  static get LANDSCAPE_KEY() { return 'shape-landscape'; }

  static get PORTRAIT_KEY() { return 'shape-portrait'; }

  static #keys = new Set([
    AspectUtil.SQUARE_KEY,
    AspectUtil.WIDESCREEN_KEY,
    AspectUtil.LANDSCAPE_KEY,
    AspectUtil.PORTRAIT_KEY,
  ]);

  static changeCheckedFiltersOnCheck(checkedFilters, currentFilter) {
    const rv = [];
    checkedFilters.forEach((filter) => {
      if (filter !== currentFilter) { // dont uncheck the current filter
        if (AspectUtil.#keys.has(filter)) {
          rv.push(filter);
        }
      }
    });
    return rv;
  }
}

export default AspectUtil;
