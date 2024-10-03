/* eslint-disable class-methods-use-this */
import ColorThief from '../../node_modules/colorthief/dist/color-thief.modern.mjs';
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';

// this should come from some standard library really.
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
  { name: 'Unknown', rgb: [-255, -255, -255], hsl: [-255, -255, -255] },
];

const numberOfTopColors = 10; // used for selecting top colors
const numberOfTopRawColors = 20; // used for selecting top colors
const saturationThreshold = 10; // used for sorting colors
const colorThief = new ColorThief();
const usedColors = new Set();
const permittedProtocols = ['http', 'https', 'data'];

function sortColorNameSetIntoArray(colorSet) {
  const filteredColorNames = cssColors.filter((color) => colorSet.has(color.name));
  filteredColorNames.sort((a, b) => {
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

function getColorSpan(color) {
  const colorSpan = document.createElement('span');
  if (color === 'Unknown') {
    // Center the question mark for the "Unknown" case
    colorSpan.style.display = 'flex';
    colorSpan.style.justifyContent = 'center'; // Center horizontally
    colorSpan.style.alignItems = 'center'; // Center vertically
    colorSpan.textContent = '?'; // Display question mark
    colorSpan.style.fontSize = '14px'; // Adjust font size for the '?'
    colorSpan.style.lineHeight = '20px'; // Make the line height match the box size
    colorSpan.style.color = '#555'; // Text color for the '?'
    colorSpan.style.backgroundColor = 'transparent'; // No background color
    colorSpan.style.padding = '0'; // Ensure no padding interferes
    colorSpan.style.boxSizing = 'border-box'; // Include borders in the element's total size
  } else {
    colorSpan.style.backgroundColor = color; // Set background color if not "Unknown"
  }
  colorSpan.style.display = 'inline-block';
  colorSpan.style.width = '20px'; // Smaller width
  colorSpan.style.height = '20px'; // Smaller height
  colorSpan.style.borderRadius = '3px'; // Square shape with slight rounding
  colorSpan.style.border = '1px solid #ccc'; // Border for visibility
  colorSpan.style.cursor = 'pointer';
  return colorSpan;
}

/* reporting utilities */
/**
 * Generates sorted array of audit report rows.
 * @returns {Object[]} Sorted array of report rows.
 */
function writeReportRows() {
  const unique = window.audit;
  const entries = [];
  unique.forEach((image) => {
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

/* modal utilities */
/**
 * Generates a unique ID for a modal based on the image source URL.
 * @param {string} src - Source URL of the image.
 * @returns {string} Generated or extracted modal ID.
 */
function getModalId(src) {
  if (src.includes('_')) return src.split('_')[1].split('.')[0];
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
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
      const alt = this.data.alt[i];
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
    return sortColorNameSetIntoArray(new Set(value)).map((color) => getColorSpan(color).outerHTML).join(' ');
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
  const { src } = figure.querySelector(':scope > img[data-src]').dataset;
  const id = getModalId(src);
  // check if a modal with this ID already exists
  let modal = document.getElementById(id);
  if (!modal) {
    // build new modal
    const [newModal, body] = buildModal();
    newModal.id = id;
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
    // format data for display
    const data = window.audit.find((img) => src.includes(img.src.slice(2)));
    if (!data) return;
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

function parameterizeColors(loadedImg, values) {
  if (loadedImg == null || values == null) {
    values.topColors = ['Unknown'];
    usedColors.add('Unknown');
    return;
  }
  const colors = numberOfTopColors > 1
    ? colorThief.getPalette(loadedImg, numberOfTopColors)
    : [colorThief.getColor(loadedImg)];

  if (colors == null || colors.length === 0) {
    values.topColors = ['Unknown'];
    usedColors.add('Unknown');
    return;
  }

  const rawColors = numberOfTopRawColors > 1
    ? colorThief.getPalette(loadedImg, numberOfTopRawColors)
    : [colorThief.getColor(loadedImg)];

  const roundedColors = [...new Set(colors.map(findNearestColor))];
  // Add each rounded color to the usedColors Set
  roundedColors.forEach((color) => usedColors.add(color));
  values.topColors = roundedColors;
  values.topColorsRaw = rawColors;
}

/**
 * Filters out duplicate images and compiles unique image data.
 * @param {Object[]} data - Array of image data objects.
 * @returns {Object[]} Array of unique image data objects.
 */
async function findAndLoadUniqueImages(data, individualBatch) {
  // use a map to track unique images by their src attribute
  const unique = new Map();
  const promises = []; // Array to hold promises

  data.forEach((img) => {
    const {
      src, origin, site, alt, width, height, aspectRatio, fileType,
    } = img;
    // if the image src is not already in the map, init a new entry
    if (!unique.has(src)) {
      const { href } = new URL(src, origin);
      const loadedImg = new Image(width, height);
      loadedImg.crossOrigin = 'Anonymous';
      loadedImg.src = href; // start loading the image

      const values = {
        src,
        origin,
        count: 0,
        site: [],
        alt: [],
        width,
        height,
        aspectRatio,
        fileType,
        topColors: [],
      };

      const promise = new Promise((resolve, reject) => {
        loadedImg.onload = () => {
          try {
            parameterizeColors(loadedImg, values);
            // More image processing here
            resolve();
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Error loading file ${href}`, error);
          } finally {
            resolve();
          }
        };
        loadedImg.onerror = (error) => reject(error);
      });

      promises.push(promise);

      unique.set(src, values);
    }
    // update the existing entry with additional image data
    const entry = unique.get(src);
    entry.count += 1;
    entry.site.push(site);
    entry.alt.push(alt);
  });
  try {
    await Promise.all(promises);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error loading files ${individualBatch}`, { individualBatch, error });
  }

  return [...unique.values()];
}

/**
 * Displays a collection of images in the gallery.
 * @param {Object[]} images - Array of image data objects to be displayed.
 */
function displayImages(images) {
  const gallery = document.getElementById('image-gallery');
  images.forEach((data) => {
    // create a new figure to hold the image and its metadata
    const figure = document.createElement('figure');
    figure.dataset.alt = validateAlt(data.alt, data.count);
    figure.dataset.aspect = data.aspectRatio;
    figure.dataset.count = data.count;
    figure.dataset.topColors = data.topColors;

    // build image
    const { href } = new URL(data.src, data.origin);
    const img = document.createElement('img');
    img.dataset.src = href;
    img.width = data.width;
    img.height = data.height;
    img.loading = 'lazy';
    figure.append(img);
    // load the image when it comes into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.timeoutId = setTimeout(() => {
            img.src = img.dataset.src;
            observer.disconnect();
          }, 500); // delay image loading
        } else {
          // cancel loading delay if image is scrolled out of view
          clearTimeout(entry.target.timeoutId);
        }
      });
    }, { threshold: 0 });
    observer.observe(figure);
    // build info button
    const info = document.createElement('button');
    info.setAttribute('aria-label', 'More information');
    info.setAttribute('type', 'button');
    info.innerHTML = '<span class="icon icon-info"></span>';
    figure.append(info);
    // check if image already exists in the gallery
    const existingImg = gallery.querySelector(`figure img[src="${href}"], figure [data-src="${href}"]`);
    if (existingImg) {
      const existingFigure = existingImg.parentElement;
      const existingCount = parseInt(existingFigure.dataset.count, 10);
      if (existingCount !== data.count) {
        // if count has changed, replace existing figure with the new one
        gallery.replaceChild(figure, existingFigure);
      }
    } else gallery.append(figure);
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
      const images = html.querySelectorAll('img[src]');
      const imgData = [...images].map((img) => {
        const src = img.getAttribute('src').split('?')[0];
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

function addFilterAction(action, document) {
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
      const aspect = parseFloat(figure.dataset.aspect, 10);

      // eslint-disable-next-line no-nested-ternary
      const shape = aspect === 1 ? 'square'
        // eslint-disable-next-line no-nested-ternary
        : aspect < 1 ? 'portrait'
          : aspect > 1.7 ? 'widescreen' : 'landscape';

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

// Function to add colors as checkbox-style palettes in a compact grid
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

  const totalColors = usedColors.size;
  const maxColumns = 10; // Maximum colors per row
  let numRows = Math.ceil(totalColors / maxColumns); // Calculate the number of rows

  // If there are 10 colors or less, set rows to 2 and adjust columns accordingly
  if (totalColors <= maxColumns) {
    numRows = 2;
  }

  const sortedColorNames = sortColorNameSetIntoArray(usedColors);

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
    const colorSpan = getColorSpan(color);

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
 * Fetches and display image data in batches.
 * @param {Object[]} urls - Array of URL objects.
 * @param {number} [batchSize = 50] - Number of URLs to fetch per batch.
 * @param {number} [delay = 2000] - Delay (in milliseconds) between each batch.
 * @param {number} [concurrency = 5] - Number of concurrent fetches within each batch.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchAndDisplayBatches(urls, batchSize = 50, delay = 2000, concurrency = 5) {
  window.audit = [];
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
    const batch = urls.slice(i, i + batchSize);

    // Process each batch and handle the delay between batches asynchronously
    const promise = (async () => {
      const batchData = await fetchBatch(batch, concurrency, pagesCounter);
      data.push(...batchData);

      // Display images as they are fetched
      main.dataset.canvas = true;
      results.removeAttribute('aria-hidden');
      const uniqueBatchData = await findAndLoadUniqueImages(data, batchData);
      window.audit = uniqueBatchData;
      updateCounter(imagesCounter, uniqueBatchData.length);
      displayImages(uniqueBatchData);
      decorateIcons(gallery);

      // Wait for the delay before resolving the promise
      await new Promise((resolve) => { setTimeout(resolve, delay); });
    })();

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

/* url and sitemap utility */
const AEM_HOSTS = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'];

/**
 * Determines the type of a URL based on its hostname and pathname.
 * @param {string} url - URL to evaluate.
 * @returns {string|boolean} Type of URL.
 */
function extractUrlType(url) {
  const { hostname, pathname } = new URL(url);
  const aemSite = AEM_HOSTS.find((h) => hostname.endsWith(h));
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
  const aemSite = AEM_HOSTS.find((h) => hostname.endsWith(h));
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

function cleanseUrls(urls) {
  return urls.filter((url) => {
    if (permittedProtocols.includes(url.href.split('://')[0].toLowerCase())) {
      return true;
    }
    return false;
  });
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
async function processForm(sitemap) {
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container
  usedColors.clear();

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

registerListeners(document);
