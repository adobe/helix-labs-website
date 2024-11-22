class ColorUtility {
  static #saturationThreshold = 10;

  static TRANSPARENCY_NAME = 'Transparency';

  static UNKNOWN_NAME = 'Unknown';

  // this should come from some standard library.
  // If you revisit it, the color-name library didn't have the names formatted well.
  static cssColors = [
    { name: 'AliceBlue', rgb: [240, 248, 255], hsl: [208, 100, 97] },
    { name: 'AntiqueWhite', rgb: [250, 235, 215], hsl: [34, 78, 91] },
    { name: 'Aqua', rgb: [0, 255, 255], hsl: [180, 100, 50] },
    { name: 'Aquamarine', rgb: [127, 255, 212], hsl: [160, 100, 75] },
    { name: 'Azure', rgb: [240, 255, 255], hsl: [180, 100, 97] },
    { name: 'Beige', rgb: [245, 245, 220], hsl: [60, 56, 91] },
    { name: 'Bisque', rgb: [255, 228, 196], hsl: [33, 100, 88] },
    { name: 'BlanchedAlmond', rgb: [255, 235, 205], hsl: [36, 100, 90] },
    { name: 'BlueViolet', rgb: [138, 43, 226], hsl: [271, 76, 53] },
    { name: 'Brown', rgb: [165, 42, 42], hsl: [0, 59, 41] },
    { name: 'Burlywood', rgb: [222, 184, 135], hsl: [34, 57, 70] },
    { name: 'CadetBlue', rgb: [95, 158, 160], hsl: [182, 25, 50] },
    { name: 'Chartreuse', rgb: [127, 255, 0], hsl: [90, 100, 50] },
    { name: 'Chocolate', rgb: [210, 105, 30], hsl: [25, 75, 47] },
    { name: 'Coral', rgb: [255, 127, 80], hsl: [16, 100, 66] },
    { name: 'CornflowerBlue', rgb: [100, 149, 237], hsl: [219, 79, 66] },
    { name: 'Cornsilk', rgb: [255, 248, 220], hsl: [48, 100, 93] },
    { name: 'Crimson', rgb: [220, 20, 60], hsl: [348, 83, 47] },
    { name: 'DarkBlue', rgb: [0, 0, 139], hsl: [240, 100, 27] },
    { name: 'DarkCyan', rgb: [0, 139, 139], hsl: [180, 100, 27] },
    { name: 'DarkGoldenRod', rgb: [184, 134, 11], hsl: [43, 89, 38] },
    { name: 'DarkGray', rgb: [169, 169, 169], hsl: [0, 0, 66] },
    { name: 'DarkGreen', rgb: [0, 100, 0], hsl: [120, 100, 20] },
    { name: 'DarkKhaki', rgb: [189, 183, 107], hsl: [56, 38, 58] },
    { name: 'DarkMagenta', rgb: [139, 0, 139], hsl: [300, 100, 27] },
    { name: 'DarkOliveGreen', rgb: [85, 107, 47], hsl: [82, 39, 30] },
    { name: 'DarkOrange', rgb: [255, 140, 0], hsl: [33, 100, 50] },
    { name: 'DarkOrchid', rgb: [153, 50, 204], hsl: [280, 61, 50] },
    { name: 'DarkRed', rgb: [139, 0, 0], hsl: [0, 100, 27] },
    { name: 'DarkSalmon', rgb: [233, 150, 122], hsl: [15, 72, 70] },
    { name: 'DarkSeaGreen', rgb: [143, 188, 143], hsl: [120, 25, 65] },
    { name: 'DarkSlateBlue', rgb: [72, 61, 139], hsl: [248, 39, 39] },
    { name: 'DarkSlateGray', rgb: [47, 79, 79], hsl: [180, 25, 25] },
    { name: 'DarkTurquoise', rgb: [0, 206, 209], hsl: [181, 100, 41] },
    { name: 'DarkViolet', rgb: [148, 0, 211], hsl: [282, 100, 41] },
    { name: 'DeepPink', rgb: [255, 20, 147], hsl: [328, 100, 54] },
    { name: 'DeepSkyBlue', rgb: [0, 191, 255], hsl: [195, 100, 50] },
    { name: 'DimGray', rgb: [105, 105, 105], hsl: [0, 0, 41] },
    { name: 'DodgerBlue', rgb: [30, 144, 255], hsl: [210, 100, 56] },
    { name: 'FireBrick', rgb: [178, 34, 34], hsl: [0, 68, 42] },
    { name: 'FloralWhite', rgb: [255, 250, 240], hsl: [40, 100, 97] },
    { name: 'ForestGreen', rgb: [34, 139, 34], hsl: [120, 61, 34] },
    { name: 'Fuchsia', rgb: [255, 0, 255], hsl: [300, 100, 50] },
    { name: 'Gainsboro', rgb: [220, 220, 220], hsl: [0, 0, 86] },
    { name: 'GhostWhite', rgb: [248, 248, 255], hsl: [240, 100, 99] },
    { name: 'Gold', rgb: [255, 215, 0], hsl: [51, 100, 50] },
    { name: 'GoldenRod', rgb: [218, 165, 32], hsl: [43, 74, 49] },
    { name: 'Gray', rgb: [128, 128, 128], hsl: [0, 0, 50] },
    { name: 'GreenYellow', rgb: [173, 255, 47], hsl: [83, 100, 59] },
    { name: 'HoneyDew', rgb: [240, 255, 240], hsl: [120, 100, 97] },
    { name: 'HotPink', rgb: [255, 105, 180], hsl: [330, 100, 71] },
    { name: 'IndianRed', rgb: [205, 92, 92], hsl: [0, 53, 58] },
    { name: 'Indigo', rgb: [75, 0, 130], hsl: [275, 100, 25] },
    { name: 'Ivory', rgb: [255, 255, 240], hsl: [60, 100, 97] },
    { name: 'Khaki', rgb: [240, 230, 140], hsl: [54, 77, 75] },
    { name: 'Lavender', rgb: [230, 230, 250], hsl: [240, 67, 94] },
    { name: 'LavenderBlush', rgb: [255, 240, 245], hsl: [340, 100, 97] },
    { name: 'LawnGreen', rgb: [124, 252, 0], hsl: [90, 100, 49] },
    { name: 'LemonChiffon', rgb: [255, 250, 205], hsl: [54, 100, 90] },
    { name: 'LightBlue', rgb: [173, 216, 230], hsl: [195, 53, 79] },
    { name: 'LightCoral', rgb: [240, 128, 128], hsl: [0, 78, 72] },
    { name: 'LightCyan', rgb: [224, 255, 255], hsl: [180, 100, 94] },
    { name: 'LightGoldenRodYellow', rgb: [250, 250, 210], hsl: [60, 80, 90] },
    { name: 'LightGreen', rgb: [144, 238, 144], hsl: [120, 73, 75] },
    { name: 'LightGrey', rgb: [211, 211, 211], hsl: [0, 0, 83] },
    { name: 'LightPink', rgb: [255, 182, 193], hsl: [351, 100, 86] },
    { name: 'LightSalmon', rgb: [255, 160, 122], hsl: [17, 100, 74] },
    { name: 'LightSeaGreen', rgb: [32, 178, 170], hsl: [177, 70, 41] },
    { name: 'LightSkyBlue', rgb: [135, 206, 250], hsl: [203, 92, 75] },
    { name: 'LightSlateGray', rgb: [119, 136, 153], hsl: [210, 14, 53] },
    { name: 'LightSteelBlue', rgb: [176, 196, 222], hsl: [214, 41, 78] },
    { name: 'LightYellow', rgb: [255, 255, 224], hsl: [60, 100, 94] },
    { name: 'LimeGreen', rgb: [50, 205, 50], hsl: [120, 61, 50] },
    { name: 'Linen', rgb: [250, 240, 230], hsl: [30, 67, 94] },
    { name: 'Magenta', rgb: [255, 0, 255], hsl: [300, 100, 50] },
    // next two are "special" colors that we use to indicate different states
    { name: ColorUtility.TRANSPARENCY_NAME, rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
    { name: ColorUtility.UNKNOWN_NAME, rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
  ];

  static sortedColorNames = ColorUtility
    .sortColorNamesIntoArray(new Set(ColorUtility.cssColors.map((color) => color.name)));

  /**
   * Sorts a set of color names into an array based on specific criteria.
   *
   * The sorting criteria are as follows:
   * 1. Colors named 'Transparency' are pushed to the top.
   * 2. Colors named 'Unknown' are pushed to the end.
   * 3. Colors with low saturation are pushed to the end sorted by lightness.
   * 4. Colors with high saturation are sorted by hue, and if hues are equal, by lightness.
   *
   * @param {Set<string>} colorSet - A set of color names to be sorted.
   * @returns {string[]} - An array of sorted color names.
   */
  // eslint-disable-next-line class-methods-use-this
  static sortColorNamesIntoArray(colorSet) {
    if (Array.isArray(colorSet)) {
      return ColorUtility.sortColorNamesIntoArray(new Set(colorSet));
    }
    const filteredColorNames = ColorUtility.cssColors.filter((color) => colorSet.has(color.name));
    filteredColorNames.sort((a, b) => {
      if (a.name === ColorUtility.TRANSPARENCY_NAME) return -1;
      if (b.name === ColorUtility.TRANSPARENCY_NAME) return 1;
      if (a.name === ColorUtility.UNKNOWN_NAME) return 1;
      if (b.name === ColorUtility.UNKNOWN_NAME) return -1;

      // Check saturation first
      const aIsLowSaturation = a.hsl[1] < ColorUtility.#saturationThreshold;
      const bIsLowSaturation = b.hsl[1] < ColorUtility.#saturationThreshold;

      if (aIsLowSaturation && bIsLowSaturation) return a.hsl[2] - b.hsl[2];
      if (aIsLowSaturation) return 1;
      if (bIsLowSaturation) return -1;

      // Both are high saturation, sort by hue then by lightness
      const hueDiff = a.hsl[0] - b.hsl[0];
      if (hueDiff !== 0) return hueDiff; // Sort by hue
      return a.hsl[2] - b.hsl[2];
    });

    const sortedColorNames = filteredColorNames.map((color) => color.name);
    return sortedColorNames;
  }
}

export default ColorUtility;
