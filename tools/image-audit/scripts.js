/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';

// eslint-disable-next-line import/no-relative-packages
// import pixelmatch from '../../node_modules/pixelmatch/index.js';
// eslint-disable-next-line import/no-relative-packages
// import ImageHash from '../../node_modules/imagehash-web/dist/imagehash-web.min.js';

// eslint-disable-next-line import/no-unresolved, import/order
import pixelmatch from 'https://cdnjs.cloudflare.com/ajax/libs/pixelmatch/6.0.0/index.min.js';
// import ImageHash from 'https://cdn.jsdelivr.net/npm/imagehash-web@3.0.1/dist/imagehash-web.min.js';

// this should come from some standard library.
// If you revisit it, the color-name library didn't have the names formatted well.
const cssColors = [
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
  { name: 'Transparency', rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
  { name: 'Unknown', rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
];

const numberOfTopColors = 10; // used for selecting top colors
// const numberOfTopRawColors = 20; // used for selecting top colors - currently not enabled.
const saturationThreshold = 10; // used for sorting colors
// eslint-disable-next-line no-undef
const colorThief = new ColorThief();
const permittedProtocols = ['http', 'https', 'data'];
/* url and sitemap utility */
const AEM_EDS_HOSTS = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'];
const ALPHA_ALLOWED_FORMATS = ['png', 'webp', 'gif', 'tiff'];
const CORS_ANONYMOUS = true;

// trims sha and alpha detection to this many pixels.
const maxPixelsToEval = 250000; // 500x500 pixels
// Matching threshold for two images, ranges from 0 to 1.
// Smaller values make the comparison more sensitive.
const imageMatchingThreshold = 0.1;

// Percentage of pixels can be different between two images ot be identified the same
// 0.01 - 1% different pixels
const differentPixelPercent = 0.01;

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
function sortColorNameSetIntoArray(colorSet) {
  const filteredColorNames = cssColors.filter((color) => colorSet.has(color.name));
  filteredColorNames.sort((a, b) => {
    if (a.name === 'Transparency') {
      // push to the top
      return -1;
    }
    if (b.name === 'Transparency') {
      // push to the top
      return 1;
    }

    if (a.name === 'Unknown') {
      // push to the end
      return 1;
    }
    if (b.name === 'Unknown') {
      // push to the end
      return -1;
    }

    // Check saturation first
    const aIsLowSaturation = a.hsl[1] < saturationThreshold;
    const bIsLowSaturation = b.hsl[1] < saturationThreshold;

    if (aIsLowSaturation && bIsLowSaturation) {
      // Both are low saturation, sort by lightness
      return a.hsl[2] - b.hsl[2];
    }
    if (aIsLowSaturation) {
      // a is low saturation, push it to the end
      return 1;
    }
    if (bIsLowSaturation) {
      // b is low saturation, push it to the end
      return -1;
    }

    // Both are high saturation, sort by hue then by lightness
    const hueDiff = a.hsl[0] - b.hsl[0];
    if (hueDiff !== 0) {
      return hueDiff; // Sort by hue
    }
    return a.hsl[2] - b.hsl[2];
  });

  const sortedColorNames = filteredColorNames.map((color) => color.name);
  return sortedColorNames;
}

/**
 * Creates a span element representing a color with optional clickability.
 *
 * @param {string} color - The color to be represented from the ccsColors list.
 * @param {boolean} clickable - Determines if the formatting is for a clickable color.
 * @returns {HTMLSpanElement} The span element representing the color.
 */
function getColorSpan(color, clickable) {
  const colorSpan = document.createElement('span');

  // Add title for hover text
  colorSpan.title = color.replace(/([a-z])([A-Z])/g, '$1 $2'); // Set hover text

  colorSpan.classList.add('color-span');

  if (color === 'Unknown') {
    colorSpan.classList.add('unknown');
    colorSpan.textContent = '?'; // Display question mark
  } else if (color === 'Transparency') {
    colorSpan.classList.add('color-span', 'alpha');
  } else {
    colorSpan.style.backgroundColor = color; // Set background color if not "Unknown"
  }

  if (!clickable) {
    colorSpan.style.cursor = 'default'; // Set cursor to pointer for colors
  }

  return colorSpan;
}

/* reporting utilities */
/**
 * Generates sorted array of audit report rows.
 * @returns {Object[]} Sorted array of report rows.
 */
function writeReportRows() {
  const entries = [];
  // todo: Should probably test each entry for duplication here.
  window.entryIdentityValues.values().forEach((image) => {
    if (image && image.site) {
      image.site.forEach((site, i) => {
        entries.push({
          Site: site,
          'Image Source': new URL(image.src, image.origin).href,
          'Alt Text': image.alt[i],
          'Top Colors': sortColorNameSetIntoArray(new Set(image.topColors)).map((color) => color.replace(/([a-z])([A-Z])/g, '$1 $2')).join(', '),
        });
      });
    }
  });
  // sort the entries array alphabetically by the 'Site' property
  const sorted = entries.sort((a, b) => a.Site.localeCompare(b.Site));
  return sorted;
}

/**
 * Converts report rows into a CSV Blob.
 * @param {Object[]} rows - Array of report rows to be converted.
 * @returns {Blob|null} Blob representing the CSV data.
 */
function generateCSV(rows) {
  if (rows.length === 0) return null;
  // write the CSV column headers using the keys from the first row object
  const headers = `${Object.keys(rows[0]).join(',')}\n`;
  // convert the rows into a single string separated by newlines
  const csv = headers + rows.map((row) => Object.values(row).map((value) => {
    const escape = (`${value}`).replace(/"/g, '""'); // escape quotes
    return `"${escape}"`;
  }).join(',')).join('\n');
  // create a Blob from the CSV string
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  return blob;
}

class Identity {
  constructor(id, type, strong) {
    if (id instanceof Promise) {
      throw new Error('Identity constructor does not support promises');
    }
    this.id = id;
    this.type = type;
    this.strong = strong;
    this.identityData = {};
  }
}

class IdentityCluster {
  constructor(originatingIdentity, elementForCluster, figureForCluster, type) {
    this.identities = new Map();
    this.identities.set(originatingIdentity.id, originatingIdentity);
    this.relatedClusters = new Set();
    this.figureForCluster = figureForCluster;
    this.type = type;
    window.clusterCount += 1;
    this.id = `c:${window.clusterCount}`;
    this.elementForCluster = elementForCluster;
    this.clusterData = {};
    if (type === 'image') {
      this.clusterData.topColors = [];
    }
    elementForCluster.dataset.src = this.id;
    this.replacedBy = null;
    this.addIdentity(originatingIdentity);
  }

  // Method to add a single identity to the identities set
  addIdentity(identity) {
    if (this.replacedBy) {
      this.replacedBy.addIdentity(identity);
      return;
    }

    identity.cluster = this;
    this.identities.set(identity.id, identity);
    if (identity.strong) {
      window.strongIdentityToClusterMap.set(identity.id, this);
    }
  }

  getAllIdentitiesOf(type) {
    return Array.from(this.identities.values())
      .filter((identity) => identity && identity.type === type) || [];
  }

  getFirstIdentityOf(type) {
    return Array.from(this.identities.values())
      .find((identity) => identity && identity.type === type) || null;
  }

  relateCluster(cluster) {
    if (this.replacedBy) {
      this.replacedBy.relateCluster(cluster);
      return;
    }

    this.relatedClusters.add(cluster);
    cluster.relatedClusters.add(this);
  }

  // Method to recluster (merge) if types match, always makes this cluster THE cluster.
  mergeCluster(otherCluster) {
    if (otherCluster === this) {
      return;
    }
    if (this.type === otherCluster.type) {
      // Merge identities from the other cluster into this one
      otherCluster.identities.forEach((value) => {
        this.addIdentity(value); // Merge the key-value pairs
      });

      // Merge related clusters from the other cluster into this one
      otherCluster.relatedClusters.forEach((cluster) => {
        // break relationship
        otherCluster.relatedClusters.remove(cluster);
        cluster.relatedClusters.remove(otherCluster);
        // attach cluster to this cluster
        this.relateCluster(cluster);
      });

      this.mergeClusterData(otherCluster);
      // Clear the other cluster
      otherCluster.destruct();
      otherCluster.replacedBy = this;
      otherCluster.identities = this.identities;
      otherCluster.relatedClusters = this.relatedClusters;
      otherCluster.figureForCluster = this.figureForCluster;
      otherCluster.elementForCluster = this.elementForCluster;
      otherCluster.clusterData = this.clusterData;
      // keeps a reference from the old cluster to the new cluster
      window.clusterMap.set(otherCluster.id, this);
      // otherCluster.id = this.id;
    }
  }

  mergeClusterData(otherCluster) {
    const source = otherCluster.clusterData;

    // Iterate over own properties of the source object
    Object.entries(source).forEach(([key, sourceValue]) => {
      const targetValue = this.clusterData[key];

      // If the value is an array, merge them without adding duplicates
      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        const sourceSet = new Set(sourceValue); // Create a Set from the source array
        sourceSet.forEach((item) => {
          if (!targetValue.includes(item)) {
            targetValue.push(item);
          }
        });
        this.clusterData[key] = targetValue;
      } else if (targetValue instanceof Set && sourceValue instanceof Set) {
        // Merge sets
        sourceValue.forEach((val) => targetValue.add(val));
        this.clusterData[key] = targetValue;
      } else if (targetValue instanceof Map && sourceValue instanceof Map) {
        // Merge maps
        sourceValue.forEach((val, mapKey) => {
          if (!targetValue.has(mapKey)) targetValue.set(mapKey, val);
        });
        this.clusterData[key] = targetValue;
      } else if (targetValue !== undefined) {
        // Prefer the target value in case of conflict
        this.clusterData[key] = targetValue;
      } else {
        this.clusterData[key] = sourceValue;
      }
    });
  }

  getAll(identityType, propertyKey) {
    const values = [];
    this.getAllIdentitiesOf(identityType).forEach((identity) => {
      const propertyValue = identity.identityData[propertyKey];

      if (Array.isArray(propertyValue)) {
        values.push(...propertyValue);
      } else if (propertyValue instanceof Set) {
        values.push(...Array.from(propertyValue));
      } else if (propertyValue) {
        values.push(propertyValue);
      }
    });
    return values;
  }

  destruct() {
    if (this.replacedBy) {
      return;
    }

    this.identities.forEach((identity) => {
      window.strongIdentityToClusterMap.delete(identity.id);
    });

    this.identities.clear();
    this.relatedClusters.clear();
    this.figureForCluster?.parentElement?.removeChild(this.figureForCluster);
    this.figureForCluster.removeChild(this.elementForCluster);
    this.figureForCluster = null;
    this.elementForCluster = null;
    this.clusterData = {};

    window.clusterMap.delete(this.id);
  }
}

class RewrittenData {
  constructor(data) {
    this.data = data;
  }

  fileType(value) {
    if (!value) return 'Unknown file type';
    return `${value.toUpperCase()} image`;
  }

  site(value) {
    if (!value) return '-';
    const sites = value.map((site, i) => {
      let alt = null;
      if (this.data.alt.length <= i) {
        alt = this.data.alt[i]; // this is not technically correct. They arent 1:1
      }
      const a = `<a href="${new URL(site, this.data.origin).href}" target="_blank">${new URL(site).pathname}</a>`;
      return alt ? `<p>${a} (${alt})</p>` : `<p>${a}</p>`;
    });
    return sites.join(' ');
  }

  dimensions() {
    const { width, height } = this.data;
    if (!width && !height) return '-';
    return `${width || '-'} × ${height || '-'}`;
  }

  aspectRatio(value) {
    if (!value) return '-';
    const ar = (v, symbol) => `<i class="symbol symbol-${symbol.toLowerCase()}"></i> ${symbol} (${v})`;
    if (value === 1) return ar(value, 'Square');
    if (value < 1) return ar(value, 'Portrait');
    if (value > 1.7) return ar(value, 'Widescreen');
    return ar(value, 'Landscape');
  }

  src(value) {
    return `<img src="${new URL(value, this.data.origin).href}" />`;
  }

  topColors(value) {
    if (!value) return '-';
    return sortColorNameSetIntoArray(new Set(value)).map((color) => getColorSpan(color, false).outerHTML).join(' ');
  }

  // rewrite data based on key
  rewrite(keys) {
    keys.forEach((key) => {
      if (this[key]) {
        this.data[key] = this[key](this.data[key]);
      }
    });
  }
}

/**
 * Displays (and creates) a modal with image information.
 * @param {HTMLElement} figure - Figure element representing the image.
 */
function displayModal(figure) {
  const clusterId = figure.querySelector(':scope > img[data-src]').dataset.src;
  // check if a modal with this ID already exists
  const modalId = `m:${clusterId}`;
  let modal = document.getElementById(modalId);

  if (!modal) {
    // build new modal
    const [newModal, body] = buildModal();
    newModal.id = modalId;
    modal = newModal;
    // define and populate modal content
    const table = document.createElement('table');

    table.innerHTML = '<tbody></tbody>';
    const rows = {
      fileType: 'Kind',
      count: 'Appearances',
      site: 'Where',
      dimensions: 'Dimensions',
      topColors: 'Top Colors',
      aspectRatio: 'Aspect ratio',
      src: 'Preview',
    };

    const site = window.clusterMap.get(clusterId).getAll('url-page-img-identity', 'site');
    const alt = window.clusterMap.get(clusterId).getAll('url-page-img-identity', 'alt');
    // todo: this should be done as multiple entries of width, height, src. This is a quick fix.
    const identity = window.clusterMap.get(clusterId).getFirstIdentityOf('url-page-img-identity');

    const data = {
      fileType: window.clusterMap.get(clusterId).elementForCluster.src.split('.').pop(),
      count: site.count,
      site,
      alt,
      width: identity.identityData.width,
      height: identity.identityData.width,
      topColors: window.clusterMap.get(clusterId).clusterData.topColors,
      aspectRatio: identity.identityData.aspectRatio,
      src: window.clusterMap.get(clusterId).elementForCluster.src,
    };
    const formattedData = new RewrittenData(data);
    formattedData.rewrite(Object.keys(rows));

    Object.keys(rows).forEach((key) => {
      if (formattedData.data[key]) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${rows[key]}</td><td>${formattedData.data[key]}</td>`;
        table.querySelector('tbody').append(tr);
      }
    });
    body.append(table);
    document.body.append(modal);
  }
  modal.showModal();
}

/* image processing and display */
/**
 * Validates that every image in an array has alt text.
 * @param {string[]} alt - Array of alt text strings associated with the image.
 * @param {number} count - Expected number of alt text entries (equal to the number of appearances).
 * @returns {boolean} `true` if the alt text is valid, `false` otherwise.
 */
function validateAlt(alt, count) {
  if (alt.length === 0 || alt.length !== count) return false;
  if (alt.some((item) => item === '')) return false;
  return true;
}

// Function to calculate the Euclidean distance between two colors
function colorDistance(color1, color2) {
  return Math.sqrt(
    (color1[0] - color2[0]) ** 2
    + (color1[1] - color2[1]) ** 2
    + (color1[2] - color2[2]) ** 2,
  );
}

// Function to find the nearest standard color
function findNearestColor(color) {
  return cssColors.reduce((nearestColor, standardColor) => {
    const distance = colorDistance(color, standardColor.rgb);
    return distance < colorDistance(color, nearestColor.rgb) ? standardColor : nearestColor;
  }).name;
}

/**
 * Checks if a given URL is valid based on its protocol.
 *
 * @param {string|URL|Object} url - The URL to validate. It can be a string,
 * an instance of URL, or an object with `href`, `origin`, or `src` properties.
 * @returns {boolean} - Returns `true` if the URL is valid, otherwise `false`.
 */
function isUrlValid(url) {
  let protocol = '';
  if (url instanceof URL) {
    protocol = url.protocol.replace(':', '').toLowerCase();
  } else if (typeof url === 'string') {
    try {
      const newUrl = new URL(url);
      return isUrlValid(newUrl);
    } catch (error) {
      return false;
    }
  } else if (typeof url?.href === 'string') {
    return isUrlValid(url.href);
  } else if (typeof url?.origin === 'string' && typeof url?.src === 'string') {
    try {
      const newUrl = new URL(url.src, url.origin);
      return isUrlValid(newUrl);
    } catch (error) {
      return false;
    }
  } else if (typeof url?.origin === 'string') {
    return isUrlValid(url.origin);
  } else {
    return false;
  }

  return permittedProtocols.includes(protocol);
}

/**
 * Filters and returns an array of valid URLs.
 *
 * @param {string[]} urls - An array of URLs to be validated.
 * @returns {string[]} An array containing only the valid URLs.
 */
function cleanseUrls(urls) {
  return urls.filter((url) => isUrlValid(url));
}

function aspectRatoToShape(aspect) {
  // eslint-disable-next-line no-nested-ternary
  if (aspect === 1) return 'square';
  // eslint-disable-next-line no-nested-ternary
  if (aspect < 1) return 'portrait';

  if (aspect > 1.7) return 'widescreen';

  // between 1 and 1.7
  return 'landscape';
}

/**
 * Adds an event listener to the specified action element that filters images in a gallery
 * based on user selected criteria.
 *
 * @param {HTMLElement} action - The HTML element that is receiving the event listener.
 *
 * The function filters images in the gallery based on the following criteria:
 * - Shape: Filters images by their aspect ratio (square, portrait, landscape, widescreen).
 * - Color: Filters images by their top colors.
 * - Missing Alt Text: Filters images that are missing alt text.
 *
 * The function updates the `aria-hidden` attribute of each figure element
 * in the gallery to show or hide it based on the selected filters.
 */
function addFilterAction(action) {
  action.addEventListener('change', () => {
    const CANVAS = document.getElementById('canvas');
    const GALLERY = CANVAS.querySelector('.gallery');
    const ACTION_BAR = CANVAS.querySelector('.action-bar');
    const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');

    const checked = [...FILTER_ACTIONS].filter((a) => a.checked).map((a) => a.value);
    const figures = [...GALLERY.querySelectorAll('figure')];

    const checkColors = checked.filter((c) => c.startsWith('color-'));
    const checkShapes = checked.filter((c) => c.startsWith('shape-'));

    figures.forEach((figure) => {
      const { shape } = figure.dataset;
      let hide = true; // hide figures by default

      // check images against filter critera
      if (checked.length === 0) { // no filters are selected
        // show all figures
        hide = false;
      } else {
        let hiddenChanged = false;

        if (checked.includes('missing-alt')) {
          // only show figures without alt text
          hide = figure.dataset.alt === 'true';
          hiddenChanged = true;
        }

        // shapes are subtractive against missing alt.
        if (checkShapes.length > 0) {
          // only one shape.
          if (checkShapes.includes(`shape-${shape}`)) {
            if (!hiddenChanged) {
              hide = false;
              hiddenChanged = true;
            }
          } else {
            hide = true;
            hiddenChanged = true;
          }
        }

        // colors are subtractive against other matches.
        if (checkColors.length > 0) {
          let foundAnyColor = false;
          if (figure.dataset.topColors != null && figure.dataset.topColors !== '') {
            figure.dataset.topColors.split(',').forEach((color) => {
              if (checked.includes(`color-${color}`)) {
                foundAnyColor = true;
              }
            });
          }

          if (!foundAnyColor) {
            hide = true;
            hiddenChanged = true;
          } else if (!hiddenChanged) {
            hide = false;
            hiddenChanged = true;
          }
        } else if (!hiddenChanged) {
          hide = false;
        }
      }

      figure.setAttribute('aria-hidden', hide);
    });
  });
}

/**
 * Function to add colors as checkbox-style palettes in a compact grid
 */
function addColorsToFilterList() {
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container

  // Create and append the "Top Color Filter" text
  const topColorText = document.createElement('div');
  topColorText.textContent = 'Top Color Filter:';
  topColorText.style.marginBottom = '4px'; // Space between text and colors
  topColorText.style.fontWeight = 'normal'; // Non-bold text
  topColorText.style.textAlign = 'left'; // Left align the text
  colorPaletteContainer.appendChild(topColorText); // Append text to the main container

  // Create a container for the grid
  const gridContainer = document.createElement('div');

  const totalColors = window.usedColors.size;
  const maxColumns = 10; // Maximum colors per row
  let numRows = Math.ceil(totalColors / maxColumns); // Calculate the number of rows

  // If there are 10 colors or less, set rows to 2 and adjust columns accordingly
  if (totalColors <= maxColumns) {
    numRows = 2;
  }

  const sortedColorNames = sortColorNameSetIntoArray(window.usedColors);

  sortedColorNames.forEach((color) => {
    // Create a label for the color checkbox
    const label = document.createElement('label');
    label.style.display = 'inline-block';
    label.style.margin = '1px'; // Reduce spacing around each item

    // Create a checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'filter';
    checkbox.value = `color-${color}`;
    checkbox.id = `filter-color-${color}`;
    checkbox.style.display = 'none'; // Hide the default checkbox

    // Create a square for the color representation
    const colorSpan = getColorSpan(color, true);

    // Add a click event to toggle the checkbox and change border on click
    label.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked; // Toggle the checkbox state
      if (checkbox.checked) {
        colorSpan.style.border = '2px solid black'; // Show a black border if checked
      } else {
        colorSpan.style.border = '1px solid #ccc'; // Reset border if unchecked
      }
    });
    addFilterAction(checkbox, document);

    // Append the hidden checkbox and color square to the label
    label.appendChild(checkbox);
    label.appendChild(colorSpan);

    // Append the label (which contains the checkbox and color square) to the grid container
    gridContainer.appendChild(label);
  });

  // Update the CSS grid layout dynamically based on the number of colors
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = `repeat(${Math.min(maxColumns, Math.ceil(totalColors / numRows))}, 1fr)`; // Adjust number of columns to form a square grid
  gridContainer.style.gap = '1px'; // Minimal gap between items

  // Append the grid container to the main color palette container
  colorPaletteContainer.appendChild(gridContainer);
}

/**
 * Utility to blindly add colors to the used color list.
 * @param {string} color - The color to be added to the used colors list.
 */
function addUsedColor(color) {
  if (!window.usedColors.has(color)) {
    window.usedColors.add(color);
    addColorsToFilterList();
  }
}

async function detectAlphaChannel(clusterId, canvas, ctx) {
  if (window.clusterMap.get(clusterId).clusterData.alphaDetectionComplete) {
    return;
  }
  window.clusterMap.get(clusterId).clusterData.alphaDetectionComplete = true;

  const ext = window.clusterMap.get(clusterId).elementForCluster.src.split('.').pop().toLowerCase();
  if (!ALPHA_ALLOWED_FORMATS.includes(ext)) {
    return;
  }

  // Get the pixel data from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let alphaPixelsCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      if (i % 1000 === 0) { // yield every 1000 pixels
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => { setTimeout(resolve, 0); });
      }
      alphaPixelsCount += 1;
      // only detecting alpha if 1% of pixels have alpha. This trims small alpha borders.
      if (alphaPixelsCount >= Math.min(data.length, maxPixelsToEval) * 0.01) {
        window.clusterMap.get(clusterId).clusterData.topColors.push('Transparency');
        addUsedColor('Transparency');
        return;
      }
      if (i >= maxPixelsToEval) {
        return;
      }
    }
  }
}

async function parameterizeColors(clusterId) {
  // colors are for the entire cluster.
  const cluster = window.clusterMap.get(clusterId);
  if (cluster.clusterData.colorsDetected) {
    return;
  }
  cluster.clusterData.colorsDetected = true;

  const { elementForCluster } = cluster;
  try {
    if (elementForCluster === null) {
      cluster.clusterData.topColors.push('Unknown');
      addUsedColor('Unknown');
      return;
    }
    const colors = numberOfTopColors > 1
      ? colorThief.getPalette(elementForCluster, numberOfTopColors)
      : [colorThief.getColor(elementForCluster)];

    if (colors === null || colors.length === 0) {
      cluster.clusterData.topColors.push('Unknown');
      addUsedColor('Unknown');
      return;
    }

    // RGB Values. Disabled for now.
    // const rawColors = numberOfTopRawColors > 1
    //  ? colorThief.getPalette(elementForCluster, numberOfTopRawColors)
    //  : [colorThief.getColor(elementForCluster)];

    const roundedColors = [...new Set(colors.map(findNearestColor))];
    // Add each rounded color to the usedColors Set
    if (roundedColors.length === 0) {
      cluster.clusterData.topColors.push('Unknown');
      addUsedColor('Unknown');
      return;
    }

    roundedColors.forEach((color) => {
      cluster.clusterData.topColors.push(color);
      addUsedColor(color);
    });
  } catch (error) {
    cluster.clusterData.topColors.push('Unknown');
    addUsedColor('Unknown');
  }
}

/**
 * Utility to updates the dataset attributes of a given figure element with provided data.
 * Should be called after any update to the sorting or filtering attributes.
 *
 * @param {HTMLElement} figure - The figure element to update.
 */
function updateFigureData(clusterId) {
  const cluster = window.clusterMap.get(clusterId);
  const figure = cluster.figureForCluster;
  if (figure === null) return;

  if (cluster.clusterData.topColors.length > 0) {
    figure.dataset.topColors = cluster.clusterData.topColors.join(',');
  }

  const altText = window.clusterMap.get(clusterId).getAll('url-page-img-identity', 'alt');
  const sites = window.clusterMap.get(clusterId).getAll('url-page-img-identity', 'site');

  figure.dataset.alt = validateAlt(altText, sites.length);
  figure.dataset.count = sites.length;

  // TODO: Different copies can have different aspect ratios.
  const identity = window.clusterMap.get(clusterId).getFirstIdentityOf('url-page-img-identity');
  if (identity && identity.identityData.aspectRatio) {
    const shape = aspectRatoToShape(identity.identityData.aspectRatio);
    figure.dataset.shape = shape;
  }
}

function identifyAndMergeClusters(clusterId, identityId, type, strong) {
  const currentCluster = window.clusterMap.get(clusterId);
  if (currentCluster.identities.has(identityId)) {
    return;
  }

  if (strong) {
    const existingCluster = window.strongIdentityToClusterMap.get(identityId);
    if (existingCluster) {
      if (existingCluster === currentCluster) {
        return;
      }

      // eslint-disable-next-line no-console
      console.log(`Merging ${currentCluster.id} into ${existingCluster.id} because of identity ${identityId}`);
      existingCluster.mergeCluster(currentCluster);
      return;
    }
  }

  const identity = new Identity(identityId, type, strong);
  currentCluster.addIdentity(identity);
}

async function createHash(value) {
  let smallerValue = null;
  if (typeof value === 'string') {
    smallerValue = value;
  } else {
    smallerValue = value.slice(0, Math.min(value.byteLength, maxPixelsToEval * 4));
  }

  // crypto only available on https.
  if (crypto?.subtle?.digest) {
    let hashBuffer = null;
    const encoder = new TextEncoder();
    if (typeof value === 'string') {
      hashBuffer = await crypto.subtle.digest('SHA-1', new Uint8Array(encoder.encode(smallerValue)));
    } else {
      hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(encoder.encode(Uint8Array(smallerValue))));
    }

    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
    const rv = hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('');
    // if (typeof value === 'string') {
    // eslint-disable-next-line max-len
    //   console.log(`Hashed ${value} to b16: ${hashArray.map((byte) => byte.toString(36).padStart(2, '0')).join('')} b36: ${rv}`);
    // }
    return rv;
  }

  let hash = null;
  if (typeof value === 'string') {
    // eslint-disable-next-line no-undef
    hash = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(smallerValue));
  } else {
    // eslint-disable-next-line no-undef
    hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(smallerValue));
  }

  // eslint-disable-next-line no-undef
  const hexHash = hash.toString(CryptoJS.enc.Hex); // Convert to hexadecimal format
  // eslint-disable-next-line no-undef
  const rv = BigInt(`0x${hexHash}`).toString(36);
  // if (typeof value === 'string') {
  //  console.log(`Hashed ${value} to b16: ${hexHash} b36: ${rv}`);
  // }
  return rv;
}

async function identityImgSha(clusterId, canvas, ctx) {
  // Get image data (raw pixels) directly from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const hash = `sii:${await createHash(imageData.data.buffer)}`;
  identifyAndMergeClusters(clusterId, hash, 'sha-img-identity', true);
  return hash;
}

async function identifyUrlInternal(clusterId, type, additionalTokensToSum = []) {
  const cluster = window.clusterMap.get(clusterId);
  const url = new URL(cluster.elementForCluster.src); // Get the image URL
  const { loadedImg } = cluster;

  const identificationParts = additionalTokensToSum.slice();

  // is loadedImg definitely a helix image? If so it can't be changed and we dont need the etag.

  if (AEM_EDS_HOSTS.find((h) => url.hostname.toLowerCase().endsWith(h))) {
    // no need to include the host. The path contains an immutable reference.
    // eslint-disable-next-line prefer-destructuring
    identificationParts.push(':eds:');
    identificationParts.push(url.href.split('://')[1]);
  } else {
    try {
      // TODO: Lets cache these fields so we limit the amount of time they could change during.

      // Fetch the image to get the ETag from headers (if available)
      const response = await fetch(url, { method: 'HEAD' }); // HEAD request to only fetch headers
      const etag = response.headers.get('ETag'); // Get the ETag if available
      const lastModified = response.headers.get('Last-Modified'); // Get the Last-Modified if available
      const contentLength = response.headers.get('Content-Length'); // Get the Content-Length if available
      const digest = response.headers.get('Digest'); // Get the Content-Length if available

      // there's a chance this changes during our processing,
      // but since we can't get the etag of the image we just loaded,
      // hope the cache gets it and roll with the risk.
      if (etag) {
        // high fidelity identifier
        identificationParts.push('et');
        identificationParts.push(etag);
      } else if (digest) {
        identificationParts.push('dg');
        identificationParts.push(digest);
      } else {
        // try to join what we do know. Lower fidelity identifier
        identificationParts.push(url.href); // Start with the URL or other primary identifier
        identificationParts.push('wt');

        // Check each field and add it to the array if it exists
        if (lastModified) {
          identificationParts.push(lastModified);
        }
        if (contentLength) {
          identificationParts.push(contentLength);
        }
        if (!lastModified && !contentLength) {
          // use what we've got
          if (loadedImg.width) {
            identificationParts.push(loadedImg.width);
          }
          if (loadedImg.height) {
            identificationParts.push(loadedImg.height);
          }
        }
      }
    } catch (error) {
      identificationParts.clear();
      identificationParts.push(...additionalTokensToSum);
      identificationParts.push('er');
      identificationParts.push(url.href); // Start with the URL or other primary identifier
      // use what we've got
      if (loadedImg.width) {
        identificationParts.push(loadedImg.width);
      }
      if (loadedImg.height) {
        identificationParts.push(loadedImg.height);
      }
    }
  }
  const hash = `${type.split('-').map((chunk) => chunk.charAt(0)).join('')}:${await createHash(identificationParts.join('::'))}`;
  identifyAndMergeClusters(clusterId, hash, type, true);
  return hash;
}

async function identifyImgUrl(clusterId, values) {
  const identityId = await identifyUrlInternal(clusterId, 'url-img-identity');
  const identity = window.clusterMap.get(clusterId).identities.get(identityId);
  identity.identityData.src = values.href;
}

async function identityImgUrlAndSiteUrl(clusterId, values) {
  const url = new URL(values.site);
  const additionalTokensToSum = [values.site];
  additionalTokensToSum.push(values.instance);

  try {
    // TODO: Lets cache these fields so we limit the amount of time they could change during.

    // Fetch the image to get the ETag from headers (if available)
    const response = await fetch(url, { method: 'HEAD' }); // HEAD request to only fetch headers
    const etag = response.headers.get('ETag'); // Get the ETag if available
    const lastModified = response.headers.get('Last-Modified'); // Get the Last-Modified if available
    const contentLength = response.headers.get('Content-Length'); // Get the Content-Length if available
    const digest = response.headers.get('Digest'); // Get the Content-Length if available

    // there's a chance this changes during our processing,
    // but since we can't get the etag of the image we just loaded,
    // hope the cache gets it and roll with the risk.
    if (etag) {
      additionalTokensToSum.push('et');
      additionalTokensToSum.push(etag);
    } else if (digest) {
      additionalTokensToSum.push('dg');
      additionalTokensToSum.push(digest);
    } else {
      // Check each field and add it to the array if it exists
      if (lastModified) {
        additionalTokensToSum.push('lm');
        additionalTokensToSum.push(lastModified);
      }
      if (contentLength) {
        additionalTokensToSum.push('cl');
        additionalTokensToSum.push(contentLength);
      }
    }
  } catch (error) {
    additionalTokensToSum.clear();
    additionalTokensToSum.push('er');
    additionalTokensToSum.push(values.site); // Start with the URL or other primary identifier
  }

  const identityId = await identifyUrlInternal(clusterId, 'url-page-img-identity', additionalTokensToSum);
  const identity = window.clusterMap.get(clusterId).identities.get(identityId);
  identity.identityData.site = values.site;
  identity.identityData.src = values.href;
  identity.identityData.alt = values.alt;
  identity.identityData.width = values.width;
  identity.identityData.height = values.height;
  identity.identityData.aspectRatio = values.aspectRatio;
  identity.identityData.instance = values.instance;
}

const hammingDistanceThreshold = 20;

async function identifyByPerceptualImage(clusterId, canvas, ctx) {
  // eslint-disable-next-line no-undef

  // getting the element and holding it here in case re-clustering switches it --
  // it is atomic with the hash.
  const { elementForCluster } = window.clusterMap.get(clusterId);
  const { src } = elementForCluster;

  let hash = null;
  let identityId = null;
  if (window.perceptualHashMap.has(src)) {
    hash = window.perceptualHashMap.get(src).hash;
    identityId = window.perceptualHashMap.get(src).identityId;
  } else {
    // eslint-disable-next-line no-undef
    hash = await phash(elementForCluster, 8);
    identityId = `ph:${hash.toBase64()}`;
    window.perceptualHashMap.set(src, { hash, identityId, clusterId });
  }

  identifyAndMergeClusters(clusterId, identityId, 'phash-identity', false);
  const identity = window.clusterMap.get(clusterId).identities.get(identityId);
  identity.identityData.phash = hash;

  // Find matching clusterIds within the Hamming distance threshold
  const matchingClusterIds = [];

  // TODO: Isn't there a better map type for this?
  window.perceptualHashMap.forEach((otherClusterId, otherHash) => {
    if (
      otherClusterId === clusterId
      || window.clusterMap.get(clusterId).elementForCluster.src
      === window.clusterMap.get(otherClusterId).elementForCluster.src
    ) {
      // no need to merge already duplicate things which will be merged anyway.
      return;
    }
    if (window.clusterMap.get(otherClusterId).id !== otherClusterId) {
      // cleanup from reclustering. No need to test this one.
      window.perceptualHashMap.delete(otherHash);
      return;
    }
    const distance = hash.hammingDistance(otherHash);
    if (distance <= hammingDistanceThreshold) {
      matchingClusterIds.push(otherClusterId);
    }
  });

  if (matchingClusterIds.length > 0) {
    const promises = matchingClusterIds.map(async (otherClusterId) => {
      // Create a new canvas and context for the other cluster's image
      const otherCanvas = document.createElement('canvas');
      const otherCtx = otherCanvas.getContext('2d');
      otherCanvas.width = canvas.width; // Ensure it's the same width
      otherCanvas.height = canvas.height; // Ensure it's the same height

      // Draw the other cluster's image onto the new canvas
      otherCtx.drawImage(
        window.clusterMap.get(otherClusterId).elementForCluster,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Get the pixel data for both images
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const otherImgData = otherCtx.getImageData(0, 0, otherCanvas.width, otherCanvas.height).data;

      // Create an output array for pixelmatch results
      const output = new Uint8Array(canvas.width * canvas.height * 4); // RGBA

      const numberDiffPixels = pixelmatch(
        imgData,
        otherImgData,
        output,
        canvas.width,
        canvas.height,
        {
          threshold: imageMatchingThreshold, // Similarity threshold
          includeAA: true,
        },
      );

      // If the images match within the specified threshold, merge clusters
      if (numberDiffPixels <= (imgData.length * differentPixelPercent)) {
        if (window.clusterMap.get(clusterId) !== window.clusterMap.get(otherClusterId)) {
          // eslint-disable-next-line no-console
          console.log(`Merging cluster ${clusterId} into cluster ${otherClusterId} because of perceptual similarity with ${numberDiffPixels} different pixels`);
          window.clusterMap.get(otherClusterId).mergeCluster(window.clusterMap.get(clusterId));
        }
      }
    });

    // Wait for all comparisons to finish
    await Promise.all(promises);
  }
}

async function loadDomOnlyImageFunctions(clusterId, values) {
  identifyImgUrl(clusterId, values).then(() => { updateFigureData(clusterId); });
  identityImgUrlAndSiteUrl(clusterId, values).then(() => { updateFigureData(clusterId); });
  parameterizeColors(clusterId).then(() => { updateFigureData(clusterId); });
}

async function loadCanvasRenderedImageFunctions(clusterId, values) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { elementForCluster } = window.clusterMap.get(clusterId);

  canvas.width = values.width;
  canvas.height = values.height;

  ctx.drawImage(elementForCluster, 0, 0, canvas.width, canvas.height);

  requestAnimationFrame(async () => {
    identityImgSha(clusterId, canvas, ctx).then(() => { updateFigureData(clusterId); });
  });

  requestAnimationFrame(() => {
    detectAlphaChannel(clusterId, canvas, ctx).then(() => { updateFigureData(clusterId); });
  });

  requestAnimationFrame(() => {
    identifyByPerceptualImage(clusterId, canvas, ctx).then(() => { updateFigureData(clusterId); });
  });
}

async function imageOnLoad(clusterId, values) {
  loadDomOnlyImageFunctions(clusterId, values);
  loadCanvasRenderedImageFunctions(clusterId, values);
}

async function imageOnError(clusterId, values, href, error) {
  await loadDomOnlyImageFunctions(clusterId, values);
  window.clusterMap.get(clusterId).clusterData.topColors.push('Unknown');
  addUsedColor('Unknown');
  updateFigureData(clusterId);
  // eslint-disable-next-line no-console
  console.error(`Error loading img file at ${href}`, error);
  // TODO: Show broken file image?
}

async function loadImages(individualBatch, concurrency) {
  // use a map to track unique images by their src attribute
  const promises = []; // Array to hold promises
  const batchEntries = [];

  individualBatch.filter((img) => isUrlValid(img.origin));

  individualBatch.forEach(async (img) => {
    if (promises.length >= concurrency) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(promises);
      // Remove the completed promises
      promises.splice(0, promises.findIndex((p) => p.isFulfilled) + 1);
    }

    const {
      src, origin, site, alt, width, height, aspectRatio, instance, fileType,
    } = img;

    window.imageCount += 1;
    const { imageCount } = window;
    const { href } = new URL(src, origin);
    const loadedImg = new Image(width, height);
    if (CORS_ANONYMOUS) loadedImg.crossOrigin = 'Anonymous';
    loadedImg.src = href; // start loading the image
    const figure = document.createElement('figure');
    figure.append(loadedImg);

    // build info button
    const info = document.createElement('button');
    info.setAttribute('aria-label', 'More information');
    info.setAttribute('type', 'button');
    info.innerHTML = '<span class="icon icon-info"></span>';
    figure.append(info);

    const identity = new Identity(`slo:${imageCount}`, 'sitemap-img-load-order', false);
    const originalCluster = new IdentityCluster(identity, loadedImg, figure, 'image'); // dont use directly
    window.clusterMap.set(originalCluster.id, originalCluster);

    const clusterId = originalCluster.id;

    const values = {
      href,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      fileType,
    };

    const promise = new Promise((resolve) => {
      loadedImg.onload = async () => {
        imageOnLoad(clusterId, values);
        resolve();
      };
      loadedImg.onerror = async (error) => {
        imageOnError(clusterId, values, href, error);
        resolve();
      };
    });

    promises.push(promise);
    batchEntries.push(clusterId);
    updateFigureData(clusterId);
  });

  await Promise.all(promises);
  return batchEntries;
}

/**
 * Displays a collection of images in the gallery.
 * @param {Object[]} images - Array of image data objects to be displayed.
 */
function displayImages(clusterIdList) {
  const gallery = document.getElementById('image-gallery');
  clusterIdList.forEach((clusterId) => {
    // append the figure to the gallery if needed
    const cluster = window.clusterMap.get(clusterId);
    if (cluster.figureForCluster.parentElement === null) {
      gallery.append(cluster.figureForCluster);
    }
  });
}

/**
 * Updates the numeric content of an HTML element by a specified increment.
 * @param {HTMLElement} counter - Counter whose text content will be updated.
 * @param {number} increment - Amount to increment the current value by.
 * @param {boolean} [float=false] - Check if counter will be updated by a float or an integer.
 */
function updateCounter(counter, increment, float = false) {
  const value = parseFloat(counter.textContent, 10);
  // calculate the new value (or reset to 0 if no increment is provided)
  const targetValue = increment ? value + increment : 0;
  counter.textContent = float ? targetValue.toFixed(1) : Math.floor(targetValue);
}

/* fetching data */
/**
 * Fetches the HTML content of a page.
 * @param {string} url - URL of the page to fetch.
 * @returns {Promise<HTMLElement|null>} - Promise that resolves to HTML (or `null` if fetch fails).
 */
async function fetchPage(url) {
  const req = await fetch(url, { redirect: 'manual' });
  if (req.ok) {
    const temp = document.createElement('div');
    temp.innerHTML = await req.text();
    return temp;
  }
  return null;
}

/**
 * Fetches image data from a page URL.
 * @param {Object} url - URL object.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchImageDataFromPage(url) {
  try {
    const html = await fetchPage(url.plain);
    if (html) {
      const seenMap = new Map();
      const images = html.querySelectorAll('img[src]');
      const imgData = [...images].map((img) => {
        const src = img.getAttribute('src').split('?')[0];

        let instance = 1;
        if (seenMap.has(src)) {
          instance = seenMap.get(src) + 1;
        }
        seenMap.set(src, instance);

        const alt = img.getAttribute('alt') || '';
        const width = img.getAttribute('width') || img.naturalWidth;
        const height = img.getAttribute('height') || img.naturalHeight;
        const aspectRatio = parseFloat((width / height).toFixed(1)) || '';
        const fileType = src.split('.').pop();
        return {
          site: url.href,
          origin: new URL(url.href).origin,
          src,
          alt,
          width,
          height,
          aspectRatio,
          instance,
          fileType,
        };
      });
      html.innerHTML = '';
      return imgData;
    }
    return [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`unable to fetch ${url.href}:`, error);
    return [];
  }
}

/**
 * Fetches data from a batch of URLs.
 * @param {Object[]} batch - Array of URL objects to process in the current batch.
 * @param {number} concurrency - Number of concurrent fetches within the batch.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchBatch(batch, concurrency, counter) {
  const results = [];
  const tasks = [];

  for (let i = 0; i < concurrency; i += 1) {
    tasks.push((async () => {
      while (batch.length > 0) {
        // get the next URL from the batch
        const url = batch.shift();
        updateCounter(counter, 1);
        // eslint-disable-next-line no-await-in-loop
        const imgData = await fetchImageDataFromPage(url);
        results.push(...imgData);
      }
    })());
  }

  await Promise.all(tasks); // wait for all concurrent tasks to complete
  return results;
}

async function handleBatch(
  batch,
  concurrency,
  pagesCounter,
  data,
  main,
  results,
  imagesCounter,
  gallery,
) {
  const batchData = await fetchBatch(batch, concurrency, pagesCounter);
  data.push(...batchData);

  // Display images as they are fetched
  main.dataset.canvas = true;
  results.removeAttribute('aria-hidden');
  const batchEntries = await loadImages(batchData, concurrency);
  updateCounter(imagesCounter);
  displayImages(batchEntries);
  decorateIcons(gallery);
}

/**
 * Fetches and display image data in batches.
 * @param {Object[]} urls - Array of URL objects.
 * @param {number} [batchSize = 50] - Number of URLs to fetch per batch.
 * @param {number} [concurrency = 5] - Number of concurrent fetches within each batch.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchAndDisplayBatches(urls, batchSize = 50, concurrency = 5) {
  const data = [];
  const main = document.querySelector('main');
  const results = document.getElementById('audit-results');
  const download = results.querySelector('button');
  download.disabled = true;
  const gallery = document.getElementById('image-gallery');
  gallery.innerHTML = '';

  // Reset counters
  const imagesCounter = document.getElementById('images-counter');
  updateCounter(imagesCounter);
  const pagesCounter = document.getElementById('pages-counter');
  updateCounter(pagesCounter);
  const totalCounter = document.getElementById('total-counter');
  updateCounter(totalCounter);
  updateCounter(totalCounter, urls.length);
  const elapsed = document.getElementById('elapsed');
  updateCounter(elapsed);
  const timer = setInterval(() => updateCounter(elapsed, 0.1, true), 100);

  // Collect promises for all batches
  const batchPromises = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    if (batchPromises.length >= concurrency) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(batchPromises);
      // Remove the completed promises
      batchPromises.splice(0, batchPromises.findIndex((p) => p.isFulfilled) + 1);
    }
    const batch = urls.slice(i, i + batchSize);

    // Process each batch and handle the delay between batches asynchronously
    const promise = handleBatch(
      batch,
      concurrency,
      pagesCounter,
      data,
      main,
      results,
      imagesCounter,
      gallery,
    );

    batchPromises.push(promise);
  }

  // Wait for all batches to finish processing
  await Promise.all(batchPromises);

  // After all batches are done
  data.length = 0;
  addColorsToFilterList();
  download.disabled = false;
  clearInterval(timer);

  return data;
}

/**
 * Determines the type of a URL based on its hostname and pathname.
 * @param {string} url - URL to evaluate.
 * @returns {string|boolean} Type of URL.
 */
function extractUrlType(url) {
  const { hostname, pathname } = new URL(url);
  const aemSite = AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
  if (pathname.endsWith('.xml')) return 'sitemap';
  if (pathname.includes('robots.txt')) return 'robots';
  if (aemSite || hostname.includes('github')) return 'write sitemap';
  return null;
}

/**
 * Constructs a sitemap URL.
 * @param {string} url - URL to use for constructing the sitemap.
 * @returns {string|null} Sitemap URL.
 */
function writeSitemapUrl(url) {
  const { hostname, pathname } = new URL(url);
  const aemSite = AEM_EDS_HOSTS.find((h) => hostname.endsWith(h));
  // construct sitemap URL for an AEM site
  if (aemSite) {
    const [ref, repo, owner] = hostname.replace(`.${aemSite}`, '').split('--');
    return `https://${ref}--${repo}--${owner}.${aemSite.split('.')[0]}.live/sitemap.xml`;
  }
  // construct a sitemap URL for a GitHub repository
  if (hostname.includes('github')) {
    const [owner, repo] = pathname.split('/').filter((p) => p);
    return `https://main--${repo}--${owner}.hlx.live/sitemap.xml`;
  }
  return null;
}

/**
 * Attempts to find a sitemap URL within a robots.txt file.
 * @param {string} url - URL of the robots.txt file.
 * @returns {Promise<string|null>} Sitemap URL.
 */
// async function findSitemapUrl(url) {
//   const req = await fetch(url);
//   if (req.ok) {
//     const text = await req.text();
//     const lines = text.split('\n');
//     const sitemapLine = lines.find((line) => line.startsWith('Sitemap'));
//     return sitemapLine ? sitemapLine.split(' ')[1] : null;
//   }
//   return null;
// }

/**
 * Fetches URLs from a sitemap.
 * @param {string} sitemap - URL of the sitemap to fetch.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of URL objects.
 */
async function fetchSitemap(sitemap) {
  const req = await fetch(sitemap);
  if (req.ok) {
    const text = await req.text();
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    // check for nested sitemaps and recursively fetch them
    if (xml.querySelector('sitemap')) {
      const sitemaps = [...xml.querySelectorAll('sitemap loc')];
      const allUrls = [];
      // eslint-disable-next-line no-restricted-syntax
      for (const loc of sitemaps) {
        const { href, origin } = new URL(loc.textContent.trim());
        const originSwapped = href.replace(origin, sitemap.origin);
        // eslint-disable-next-line no-await-in-loop
        const nestedUrls = await fetchSitemap(originSwapped);
        allUrls.push(...nestedUrls);
      }
      return cleanseUrls(allUrls);
    }
    if (xml.querySelector('url')) {
      const urls = [...xml.querySelectorAll('url loc')].map((loc) => {
        const { href, origin } = new URL(loc.textContent.trim());
        const originSwapped = href.replace(origin, new URL(sitemap).origin);
        const plain = `${originSwapped.endsWith('/') ? `${originSwapped}index` : originSwapped}.plain.html`;
        return { href: originSwapped, plain };
      });
      return cleanseUrls(urls);
    }
  }
  return [];
}

/* setup */

function setupWindowVariables() {
  // could be computed every asset change, or on each block of changes, but this is more efficient.
  window.usedColors = new Set();

  // this map exists so that when interacting with an image element,
  // we can resolve the cluster it belongs to.
  // string key is the id of the cluster, which gets used in the element as data-src.
  // value is the cluster object.
  window.clusterMap = new Map();

  // string identity id
  // value is the cluster object.
  window.strongIdentityToClusterMap = new Map();
  window.imageCount = 0;
  window.clusterCount = 0;
  window.perceptualHashMap = new Map();
}

async function processForm(sitemap) {
  setupWindowVariables();
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container

  const urls = await fetchSitemap(sitemap);
  // await fetchAndDisplayBatches(urls.slice(8000, 8100));
  await fetchAndDisplayBatches(urls);
}

function getFormData(form) {
  const data = {};
  [...form.elements].forEach((field) => {
    const { name, type, value } = field;
    if (name && type && value) {
      switch (type) {
        case 'number':
        case 'range':
          data[name] = parseFloat(value, 10);
          break;
        case 'date':
        case 'datetime-local':
          data[name] = new Date(value);
          break;
        case 'checkbox':
          if (field.checked) {
            if (data[name]) data[name].push(value);
            else data[name] = [value];
          }
          break;
        case 'radio':
          if (field.checked) data[name] = value;
          break;
        case 'url':
          data[name] = new URL(value);
          break;
        case 'file':
          data[name] = field.files;
          break;
        default:
          data[name] = value;
      }
    }
  });
  return data;
}

function registerListeners(doc) {
  const URL_FORM = doc.getElementById('site-form');
  const CANVAS = doc.getElementById('canvas');
  const GALLERY = CANVAS.querySelector('.gallery');
  const DOWNLOAD = doc.getElementById('download-report');
  const ACTION_BAR = CANVAS.querySelector('.action-bar');
  const SORT_ACTIONS = ACTION_BAR.querySelectorAll('input[name="sort"]');
  const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');

  // handle form submission
  URL_FORM.addEventListener('submit', async (e) => {
    e.preventDefault();
    // clear all sorting and filters
    // eslint-disable-next-line no-return-assign
    [...SORT_ACTIONS, ...FILTER_ACTIONS].forEach((action) => action.checked = false);
    const data = getFormData(e.srcElement);
    const url = data['site-url'];
    const urlType = extractUrlType(url);
    if (urlType.includes('sitemap')) {
      // fetch sitemap
      const sitemap = urlType === 'sitemap' ? url : writeSitemapUrl(url);
      processForm(sitemap);
    }
  });

  // handle gallery clicks to display modals
  GALLERY.addEventListener('click', (e) => {
    const figure = e.target.closest('figure');

    if (figure) displayModal(figure);
  });

  // handle csv report download
  DOWNLOAD.addEventListener('click', () => {
    const rows = writeReportRows();
    if (rows[0]) {
      const site = new URL(rows[0].Site).hostname.split('.')[0];
      const csv = generateCSV(rows);
      const link = document.createElement('a');
      const url = URL.createObjectURL(csv);
      // insert link to enable download
      link.setAttribute('href', url);
      link.setAttribute('download', `${site}_image_audit_report.csv`);
      link.style.display = 'none';
      DOWNLOAD.insertAdjacentElement('afterend', link);
      link.click();
      link.remove();
    }
  });

  SORT_ACTIONS.forEach((action) => {
    action.addEventListener('click', (e) => {
      const { target } = e;
      const type = target.value;
      // get the current sort order (1 for ascending, -1 for descending)
      const sortOrder = parseInt(target.dataset.order, 10);
      const figures = [...GALLERY.querySelectorAll('figure')];
      // sort figures based on selected type and order
      const sorted = figures.sort((a, b) => {
        const aVal = parseFloat(a.dataset[type], 10);
        const bVal = parseFloat(b.dataset[type], 10);
        return sortOrder > 0 ? aVal - bVal : bVal - aVal;
      });
      GALLERY.append(...sorted);
      // toggle the sort order for the next click
      target.dataset.order = sortOrder * -1;
    });
  });

  FILTER_ACTIONS.forEach((action) => addFilterAction(action, doc));
}

setupWindowVariables();
registerListeners(document);
