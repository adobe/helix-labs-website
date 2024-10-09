/* eslint-disable class-methods-use-this */
// eslint-disable-next-line import/extensions, import/no-relative-packages
import ColorThief from '../../node_modules/colorthief/dist/color-thief.modern.mjs';
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';
import { cssColors } from './cssColors.js';

const colorThief = new ColorThief();
const AEM_HOSTS = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'];
const CORS_ANONYMOUS = true;
const NUMBER_OF_TOP_COLORS = 5; // used for selecting top colors
// const NUMBER_OF_RAW_COLORS = 20; // used for selecting top colors - currently not enabled.

/* image processing and display */
/**
 * Build a swatch element with the specified color and class.
 * @param {string} color - CSS color name.
 * @param {string} shortName - CSS class or background color value to apply.
 * @returns {HTMLSpanElement} Swatch element.
 */
function buildSwatch(color, shortName) {
  const swatch = document.createElement('span');
  swatch.className = 'swatch';
  if (color === 'Unknown' || color === 'Transparent') {
    swatch.classList.add(shortName);
  } else {
    swatch.style.backgroundColor = shortName;
  }
  return swatch;
}

/**
 * Detects if an image element contains a substantial alpha channel (transparent pixels).
 * @param {HTMLImageElement} image - The image element to check for an alpha channel.
 * @param {function(boolean): void} cb - Callback function indicating if the image has an alpha.
 */
async function detectAlphaChannel(image, cb) {
  const extension = image.src.split('.').pop().toLowerCase();
  const alphaFormats = ['png', 'webp', 'gif', 'tiff'];
  if (!alphaFormats.includes(extension)) {
    cb(false);
    return;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);

  // Get the pixel data from the canvas
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let alphaPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      alphaPixels += 1;
      // only detecting alpha if 1% of pixels have alpha. This trims small alpha borders.
      if (alphaPixels >= data.length * 0.01) {
        cb(true);
        return;
      }
    }
  }

  cb(false); // No alpha channel
}

/**
 * Calculates the Euclidean distance between two colors.
 * @param {Array<number>} color1 - Array representing the RGB values of the first color.
 * @param {Array<number>} color2 - Array representing the RGB values of the second color.
 * @returns {number} - The Euclidean distance between the two colors.
 */
function colorDistance(color1, color2) {
  return Math.sqrt(
    (color1[0] - color2[0]) ** 2
    + (color1[1] - color2[1]) ** 2
    + (color1[2] - color2[2]) ** 2,
  );
}

/**
 * Finds the nearest standard CSS color to the provided color based on color distance.
 * @param {Array<number>} color - Array representing the RGB values of the color to compare.
 * @returns {string} - Name of the nearest standard CSS color.
 */
function findNearestColor(color) {
  return cssColors.reduce((nearestColor, standardColor) => {
    const distance = colorDistance(color, standardColor.rgb);
    return distance < colorDistance(color, nearestColor.rgb) ? standardColor : nearestColor;
  }).name;
}

/**
 * Sorts a set of color names into an array based on specific criteria:
 * 1. Colors named 'Transparent' are pushed to the top.
 * 2. Colors named 'Unknown' are pushed to the end.
 * 3. Colors with low saturation are pushed to the end, then sorted by lightness.
 * 4. Colors with high saturation are sorted by hue, and if hues are equal, by lightness.
 * @param {Set<string>} colorSet - A set of color names to be sorted.
 * @returns {string[]} - An array of sorted color names.
 */
function sortColors(colorSet) {
  const filteredColorNames = cssColors.filter((color) => colorSet.has(color.name));
  filteredColorNames.sort((a, b) => {
    // 1. Colors named 'Transparent' are pushed to the top.
    if (a.name === 'Transparent') return -1;
    if (b.name === 'Transparent') return 1;

    // 2. Colors named 'Unknown' are pushed to the end.
    if (a.name === 'Unknown') return 1;
    if (b.name === 'Unknown') return -1;

    // 3. Colors with low saturation are pushed to the end...
    const saturationThreshold = 10;
    const aIsLowSaturation = a.hsl[1] < saturationThreshold;
    const bIsLowSaturation = b.hsl[1] < saturationThreshold;
    // ...then sorted by lightness
    if (aIsLowSaturation && bIsLowSaturation) return a.hsl[2] - b.hsl[2];
    if (aIsLowSaturation) return 1;
    if (bIsLowSaturation) return -1;

    // 4. Colors with high saturation are sorted by hue...
    const hueDiff = a.hsl[0] - b.hsl[0];
    if (hueDiff !== 0) return hueDiff; // sort by hue
    // ...if hues are equal, sort by lightness
    return a.hsl[2] - b.hsl[2];
  });

  const sortedColorNames = filteredColorNames.map((color) => color.name);
  return sortedColorNames;
}

/**
 * Applies strict filtering to figures based on the selected filters.
 * @param {HTMLElement} action - Form element that triggers the filter action.
 * @param {Document} doc - Document object.
 */
function addFilterAction(action, doc) {
  action.addEventListener('change', () => {
    const CANVAS = doc.getElementById('canvas');
    const GALLERY = CANVAS.querySelector('.gallery');
    const ACTION_BAR = CANVAS.querySelector('.action-bar');
    const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');

    // identify active filters
    const checkedFilters = [...FILTER_ACTIONS].filter((f) => f.checked).map((f) => f.value);
    const shapeFilters = checkedFilters.filter((f) => f.startsWith('shape-'));
    const colorFilters = checkedFilters.filter((f) => f.startsWith('color-'));
    const showMissingAlt = checkedFilters.includes('missing-alt');

    const figures = [...GALLERY.querySelectorAll('figure')];

    figures.forEach((figure) => {
      const hasAltText = figure.dataset.alt === 'true';
      const topColors = figure.dataset.topColors
        ? figure.dataset.topColors.split(',').map((c) => c.split(' ').join('').toLowerCase()) : [];
      const aspect = parseFloat(figure.dataset.aspect, 10);
      // eslint-disable-next-line no-nested-ternary
      const shape = aspect === 1 ? 'square'
        // eslint-disable-next-line no-nested-ternary
        : aspect < 1 ? 'portrait'
          : aspect > 1.7 ? 'widescreen' : 'landscape';

      let hide = false; // show figures by default

      // check images against filter criteria
      if (checkedFilters.length > 0) {
        // hide figures with alt text when "missing-alt" is selected
        if (showMissingAlt && hasAltText) hide = true;
        // hide figures that don't match the selected shape(s)
        if (shapeFilters.length > 0 && !shapeFilters.includes(`shape-${shape}`)) hide = true;
        // hide figures that don't match the selected color(s)
        if (colorFilters.length > 0 && !topColors.some((color) => colorFilters.includes(`color-${color}`))) hide = true;
      }

      figure.setAttribute('aria-hidden', hide);
    });
  });
}

/**
 * Adds colors to the filter list.
 */
function addColorsToFilterList() {
  const palette = document.getElementById('palette');
  palette.innerHTML = '';

  const sortedColorNames = sortColors(window.usedColors);

  // create a checkbox and swatch for each color
  sortedColorNames.forEach((color) => {
    const shortName = color.split(' ').join('').toLowerCase();

    const li = document.createElement('li');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'filter';
    checkbox.title = color;
    checkbox.value = `color-${shortName}`;
    checkbox.id = `filter-color-${shortName}`;
    const swatch = buildSwatch(color, shortName);
    label.append(checkbox, swatch);
    li.append(label);

    addFilterAction(checkbox, document);
    palette.append(li);
  });
}

/**
 * Adds a color to the global used colors list if it hasn't been added already.
 * @param {string} color - The color to be added to the used colors list.
 */
function addUsedColor(color) {
  if (!window.usedColors.has(color)) {
    window.usedColors.add(color);
    addColorsToFilterList();
  }
}

/**
 * Analyzes the colors in a loaded image and updates the provided values object with the top colors.
 * @param {HTMLImageElement} loadedImg - The image element to analyze.
 * @param {Object} values - The object to update with the top colors.
 * @param {Array<string>} values.topColors - The array to store the top colors.
 */
function parameterizeColors(loadedImg, values) {
  const setUnknownColors = () => {
    values.topColors = ['Unknown'];
    addUsedColor('Unknown');
  };

  if (!loadedImg || !values) {
    setUnknownColors();
    return;
  }

  try {
    const colors = NUMBER_OF_TOP_COLORS > 1
      ? colorThief.getPalette(loadedImg, NUMBER_OF_TOP_COLORS)
      : [colorThief.getColor(loadedImg)];

    if (!colors || colors.length === 0) {
      setUnknownColors();
      return;
    }

    // RGB Values. Disabled for now.
    // const rawColors = NUMBER_OF_RAW_COLORS > 1
    //  ? colorThief.getPalette(loadedImg, NUMBER_OF_RAW_COLORS)
    //  : [colorThief.getColor(loadedImg)];
    // values.topColorsRaw = rawColors;

    const roundedColors = [...new Set(colors.map(findNearestColor))];
    // Add each rounded color to the usedColors Set
    roundedColors.forEach((color) => addUsedColor(color));
    values.topColors = roundedColors;
  } catch (error) {
    setUnknownColors();
  }
}

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
  if (!figure) return;

  if (data.topColors && data.topColors.length > 0) {
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
              values.topColors.push('Transparent');
              addUsedColor('Transparent');
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

/**
 * Clears the palette element and resets related global data structures.
 * @param {HTMLElement} palette - Palette element.
 */
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
  const palette = document.getElementById('palette');
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

/* url and sitemap utility */
/**
 * Checks if a given URL is valid based on its protocol.
 * @param {string} url - URL to validate.
 * @returns {boolean} - Returns `true` if the URL has a valid protocol, otherwise `false`.
 */
function isUrlValid(url) {
  try {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol.replace(':', '').toLowerCase();
    return ['http', 'https', 'data'].includes(protocol);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('invalid url:', url);
  }
  return false;
}

/**
 * Filters an array of URLs, returning only the valid ones.
 * @param {Array<Object>} urls - Array of objects.
 * @returns {Array<Object>} - Array of objects where the `href` property is a valid URL.
 */
function cleanseUrls(urls) {
  return urls.filter((url) => isUrlValid(url.href));
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
          'Top Colors': sortColors(new Set(image.topColors)).join(', '),
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
  const match = src.match(/_(.*?)\./);
  if (match && match[1] && match[1].length > 0) {
    return match[1];
  }
  // TODO: URL and etag.
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
    const colors = sortColors(new Set(value)).map((color) => {
      const swatch = buildSwatch(color, color.split(' ').join('').toLowerCase());
      return `<nobr>${swatch.outerHTML} ${color}</nobr>`;
    });
    return colors.join(', ');
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
