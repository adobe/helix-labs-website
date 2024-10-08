/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/extensions, import/no-relative-packages
import ColorThief from '../../node_modules/colorthief/dist/color-thief.modern.mjs';
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';
import { cssColors } from './cssColors.js';

const numberOfTopColors = 10; // used for selecting top colors
// const numberOfTopRawColors = 20; // used for selecting top colors - currently not enabled.
const saturationThreshold = 10; // used for sorting colors
const colorThief = new ColorThief();
const permittedProtocols = ['http', 'https', 'data'];
/* url and sitemap utility */
const AEM_HOSTS = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'];
const ALPHA_ALLOWED_FORMATS = ['png', 'webp', 'gif', 'tiff'];
const CORS_ANONYMOUS = true;

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
  window.unique.values().forEach((image) => {
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
  let modalId = '';
  const match = src.match(/_(.*?)\./);
  if (match && match[1] && match[1].length > 0) {
    // eslint-disable-next-line prefer-destructuring
    modalId = match[1];
  } else {
    // TODO: URL and etag.
    modalId = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }
  return modalId;
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
    const data = window.unique.get(src);
    if (!data) return; // shouldn't happen.

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

/**
 * Detects if an image element detects a substantial alpha channel.
 *
 * @param {HTMLImageElement} imgElement - The image element to check for an alpha channel.
 * @param {function(boolean): void} callback - A callback function that is called with a
 *                                             boolean value indicating whether the image
 *                                             has an alpha channel.
 */
async function detectAlphaChannel(imgElement, callback) {
  const ext = imgElement.src.split('.').pop().toLowerCase();
  if (!ALPHA_ALLOWED_FORMATS.includes(ext)) {
    callback(false);
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  ctx.drawImage(imgElement, 0, 0);

  // Get the pixel data from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let alphaPixelsCount = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      alphaPixelsCount += 1;
      // only detecting alpha if 1% of pixels have alpha. This trims small alpha borders.
      if (alphaPixelsCount >= data.length * 0.01) {
        callback(true);
        return;
      }
    }
  }

  callback(false); // No alpha channel
}

/**
 * Analyzes the colors in a loaded image and updates the provided values object with the top colors.
 * If the image or values are null, or if an error occurs, it sets the top colors to 'Unknown'.
 *
 * @param {HTMLImageElement} loadedImg - The image element to analyze.
 * @param {Object} values - The object to update with the top colors.
 * @param {Array} values.topColors - The array to store the top colors.
 */
function parameterizeColors(loadedImg, values) {
  try {
    if (loadedImg == null || values == null) {
      values.topColors = ['Unknown'];
      addUsedColor('Unknown');
      return;
    }
    const colors = numberOfTopColors > 1
      ? colorThief.getPalette(loadedImg, numberOfTopColors)
      : [colorThief.getColor(loadedImg)];

    if (colors == null || colors.length === 0) {
      values.topColors = ['Unknown'];
      addUsedColor('Unknown');
      return;
    }

    // RGB Values. Disabled for now.
    // const rawColors = numberOfTopRawColors > 1
    //  ? colorThief.getPalette(loadedImg, numberOfTopRawColors)
    //  : [colorThief.getColor(loadedImg)];

    const roundedColors = [...new Set(colors.map(findNearestColor))];
    // Add each rounded color to the usedColors Set
    roundedColors.forEach((color) => addUsedColor(color));
    values.topColors = roundedColors;
    // values.topColorsRaw = rawColors;
  } catch (error) {
    values.topColors = ['Unknown'];
    addUsedColor('Unknown');
  }
}

/**
 * Utility to updates the dataset attributes of a given figure element with provided data.
 * Should be called after any update to the sorting or filtering attributes.
 *
 * @param {HTMLElement} figure - The figure element to update.
 * @param {Object} data - The data object containing information to update the figure with.
 * @param {Array<string>} [data.topColors] - An array of top colors to set in the dataset.
 * @param {string} data.alt - The alt text to validate and set in the dataset.
 * @param {number} data.count - The count to set in the dataset.
 * @param {string} data.aspectRatio - The aspect ratio to set in the dataset.
 */
function updateFigureData(figure, data) {
  if (figure == null) return;

  if ((data.topColors != null && data.topColors.length > 0)) {
    figure.dataset.topColors = data.topColors.join(',');
  }

  figure.dataset.alt = validateAlt(data.alt, data.count);
  figure.dataset.aspect = data.aspectRatio;
  figure.dataset.count = data.count;
}

/**
 * Finds and loads unique images from a batch of images with a specified concurrency limit.
 *
 * @param {Array} individualBatch - An array of image objects to process.
 * @param {number} concurrency - The maximum number of concurrent image loads.
 * @returns {Promise<Array>} A promise that resolves to an array of unique image values.
 *
 * @typedef {Object} ImageObject
 * @property {string} src - The source URL of the image.
 * @property {string} origin - The origin URL of the image.
 * @property {string} site - The site where the image is used.
 * @property {string} alt - The alt text of the image.
 * @property {number} width - The width of the image.
 * @property {number} height - The height of the image.
 * @property {number} aspectRatio - The aspect ratio of the image.
 * @property {string} fileType - The file type of the image.
 *
 * @typedef {Object} ImageValues
 * @property {string} src - The source URL of the image.
 * @property {string} origin - The origin URL of the image.
 * @property {number} count - The count of how many times the image is used.
 * @property {Array<string>} site - An array of sites where the image is used.
 * @property {Array<string>} alt - An array of alt texts for the image.
 * @property {number} width - The width of the image.
 * @property {number} height - The height of the image.
 * @property {number} aspectRatio - The aspect ratio of the image.
 * @property {string} fileType - The file type of the image.
 * @property {Array<string>} topColors - An array of top colors in the image.
 * @property {HTMLImageElement} loadedImg - The loaded image element.
 */
async function findAndLoadUniqueImages(individualBatch, concurrency) {
  // use a map to track unique images by their src attribute
  const promises = []; // Array to hold promises
  const batchUnique = new Map();

  individualBatch.filter((img) => isUrlValid(img.origin));

  individualBatch.forEach(async (img) => {
    const {
      src, origin, site, alt, width, height, aspectRatio, fileType,
    } = img;
    // if the image src is not already in the map, init a new entry
    if (!window.unique.has(src)) {
      if (promises.length >= concurrency) {
        // eslint-disable-next-line no-await-in-loop
        await Promise.race(promises);
        // Remove the completed promises
        promises.splice(0, promises.findIndex((p) => p.isFulfilled) + 1);
      }

      const { href } = new URL(src, origin);
      // TODO: Should this just get put into the DOM instead of the lazy load one?
      const loadedImg = new Image(width, height);
      if (CORS_ANONYMOUS) loadedImg.crossOrigin = 'Anonymous';
      loadedImg.src = href; // start loading the image
      loadedImg.dataset.src = src;

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
        loadedImg,
      };

      values.loadedImg = loadedImg;

      const promise = new Promise((resolve) => {
        loadedImg.onload = () => {
          parameterizeColors(loadedImg, values);
          updateFigureData(loadedImg.parentElement, values);
          detectAlphaChannel(loadedImg, (hasAlpha) => {
            if (hasAlpha) {
              values.topColors.push('Transparency');
              addUsedColor('Transparency');
              updateFigureData(loadedImg.parentElement, values);
            }
          });
          resolve();
        };
        loadedImg.onerror = (error) => {
          values.topColors = ['Unknown'];
          addUsedColor('Unknown');
          updateFigureData(loadedImg.parentElement, values);
          // eslint-disable-next-line no-console
          console.error(`Error loading img file at ${href}`, error);
          // TODO: Show broken file image?
          resolve();
        };
      });

      promises.push(promise);
      window.unique.set(src, values);
      batchUnique.set(src, values);
    }
    // update the existing entry with additional image data
    const entry = window.unique.get(src);
    entry.count += 1;
    entry.site.push(site);
    entry.alt.push(alt);
    updateFigureData(entry.loadedImg.parentElement, entry);
  });

  await Promise.all(promises);
  return Array.from(batchUnique.values());
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
    updateFigureData(figure, data);

    figure.append(data.loadedImg);

    // build info button
    const info = document.createElement('button');
    info.setAttribute('aria-label', 'More information');
    info.setAttribute('type', 'button');
    info.innerHTML = '<span class="icon icon-info"></span>';
    figure.append(info);
    gallery.append(figure);
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

function clearPalette(palette) {
  palette.innerHTML = '';
  window.usedColors.clear();
  window.unique.clear();
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
  const uniqueBatchData = await findAndLoadUniqueImages(batchData, concurrency);
  updateCounter(imagesCounter, uniqueBatchData.length);
  displayImages(uniqueBatchData);
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

  // reset palette
  const palette = document.getElementById('color-pallette');
  clearPalette(palette);

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
  const urls = await fetchSitemap(sitemap);
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

function setupWindowVariables() {
  window.usedColors = new Set();
  // key is the data-src, value is the data object about the value
  window.unique = new Map();
}

setupWindowVariables();
registerListeners(document);
