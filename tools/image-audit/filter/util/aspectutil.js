class AspectUtil {
  static get SQUARE_KEY() { return 'shape-square'; }

  static get WIDESCREEN_KEY() { return 'shape-widescreen'; }

  static get LANDSCAPE_KEY() { return 'shape-landscape'; }

  static get PORTRAIT_KEY() { return 'shape-portrait'; }

  static changeCheckedFiltersOnCheck(checkedFilters, currentFilter) {
    return !checkedFilters.filter((filter) => filter === currentFilter
    || (filter !== AspectUtil.PORTRAIT_KEY
      && filter !== AspectUtil.SQUARE_KEY
      && filter !== AspectUtil.LANDSCAPE_KEY
      && filter !== AspectUtil.WIDESCREEN_KEY));
  }
}

export default AspectUtil;
