/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';
import { Identity, IdentityCluster, IdentityProcessor } from './identity.js';

const permittedProtocols = ['http', 'https', 'data'];
/* url and sitemap utility */
const AEM_EDS_HOSTS = ['hlx.page', 'hlx.live', 'aem.page', 'aem.live'];
const CORS_ANONYMOUS = true;

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
    colorSpan.style.backgroundImage = "url('/icons/question.svg')";
  } else if (color === 'Transparency') {
    colorSpan.classList.add('alpha');
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
  window.identityProcessor.getAllClusters().values().forEach((cluster) => {
    const upii = cluster.getFirstIdentityOf('url-page-img-identity');
    const ci = cluster.getSingletonOf('color-identity');

    entries.push({
      Site: upii.identityData.site,
      'Image Source': new URL(upii.identityData.src, upii.identityData.origin).href,
      'Alt Text': upii.identityData.alt,
      'Top Colors': (window.identityProcessor.sortColorNamesIntoArray(
        ci.identityData.topColors,
      )).map((color) => color.replace(/([a-z])([A-Z])/g, '$1 $2')).join(', '),
    });
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
    return window.identityProcessor.sortColorNamesIntoArray(new Set(value)).map((color) => getColorSpan(color, false).outerHTML).join(' ');
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
    const { identityProcessor } = window;
    const cluster = identityProcessor.getCluster(clusterId);

    const site = cluster.getAll('url-page-img-identity', 'site');
    const alt = cluster.getAll('url-page-img-identity', 'alt');
    // todo: this should be done as multiple entries of width, height, src. This is a quick fix.
    const identity = cluster.getFirstIdentityOf('url-page-img-identity');
    if (identity === null) {
      return;
    }

    const colorIdentity = cluster.getSingletonOf('color-identity');

    const data = {
      fileType: identityProcessor.getCluster(clusterId).elementForCluster.src.split('.').pop(),
      count: site.length,
      site,
      alt,
      width: identity.identityData.width,
      height: identity.identityData.height,
      topColors: colorIdentity.identityData.topColors,
      aspectRatio: identity.identityData.aspectRatio,
      src: identityProcessor.getCluster(clusterId).elementForCluster.src,
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

function changeFilters() {
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
  action.addEventListener('change', () => changeFilters());
}

function addColorsToFilterList(sortedColorNames) {
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container

  sortedColorNames.forEach((color) => {
    // Create a list item (li) for each color
    const listItem = document.createElement('li');
    listItem.className = 'color-list-item'; // Corrected class name for styling

    // Create a label for the color checkbox
    const label = document.createElement('label');
    label.className = 'color-label'; // Corrected class name for styling

    // Create a checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'filter';
    checkbox.value = `color-${color}`;
    checkbox.id = `filter-color-${color}`;
    checkbox.className = 'color-checkbox'; // Corrected class name for styling
    checkbox.style.display = 'none'; // Hide the default checkbox

    // Create a square for the color representation
    const colorSpan = getColorSpan(color, true);

    // Add a click event to toggle the checkbox and change border on click
    label.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked; // Toggle the checkbox state
      if (checkbox.checked) colorSpan.classList.add('selected');
      else colorSpan.classList.remove('selected');
    });
    addFilterAction(checkbox, document);

    // Append the hidden checkbox and color square to the label
    label.appendChild(checkbox);
    label.appendChild(colorSpan);

    // Append the label to the list item
    listItem.appendChild(label);

    // Append the list item to the main color palette container
    colorPaletteContainer.appendChild(listItem);
  });
}

/**
 * Utility to updates the dataset attributes of a given figure element with provided data.
 * Should be called after any update to the sorting or filtering attributes.
 *
 * @param {HTMLElement} figure - The figure element to update.
 */
function updateFigureData(clusterId) {
  const { identityProcessor } = window;
  const cluster = identityProcessor.getCluster(clusterId);
  const figure = cluster.figureForCluster;
  if (!figure || !figure.dataset) return;

  const colorIdentity = cluster.getSingletonOf('color-identity');

  if (colorIdentity && colorIdentity.identityData.topColors.length > 0) {
    figure.dataset.topColors = colorIdentity.identityData.topColors.join(',');
  }

  const altText = cluster.getAll('url-page-img-identity', 'alt');
  const sites = cluster.getAll('url-page-img-identity', 'site');

  figure.dataset.alt = validateAlt(altText, sites.length);
  figure.dataset.count = sites.length;

  // TODO: Different copies can have different aspect ratios.
  const identity = cluster.getFirstIdentityOf('url-page-img-identity');
  if (identity && identity.identityData.aspectRatio) {
    const aspect = identity.identityData.aspectRatio;
    figure.dataset.aspect = aspect;
  }
}

async function executePreflightFunctions(clusterId, values) {
  const { identityProcessor } = window;

  await Promise.allSettled([
    identityProcessor.identifyImgUrl(clusterId, values),
    identityProcessor.identityImgUrlAndSiteUrl(clusterId, values),
  ]);
}

async function executePostFlightDomFunctions(clusterId, values) {
  const { identityProcessor } = window;
  await Promise.allSettled([
    identityProcessor.identifyColors(clusterId, values),
    // identityProcessor.identifyText(clusterId, values),
  ]);
}

async function executePostFlightCanvasFunctions(clusterId, values) {
  const { identityProcessor } = window;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { elementForCluster } = identityProcessor.getCluster(clusterId);

  canvas.width = values.width;
  canvas.height = values.height;

  ctx.drawImage(elementForCluster, 0, 0, canvas.width, canvas.height);

  await Promise.allSettled([
    identityProcessor.identityImgSha(clusterId, canvas, ctx),
    identityProcessor.detectAlphaChannel(clusterId, canvas, ctx),
    identityProcessor.identifyByPerceptualImage(clusterId, canvas, ctx),
  ]);
}

async function imageOnLoad(clusterId, values) {
  await Promise.allSettled([
    executePostFlightDomFunctions(clusterId, values),
    executePostFlightCanvasFunctions(clusterId, values),
  ]);
}

async function imageOnError(clusterId, values, href, error) {
  window.identityProcessor.identifyUnknownColorOnError(clusterId);
  updateFigureData(clusterId);
  // eslint-disable-next-line no-console
  console.error(`Error loading img file at ${href}`, error);
  // TODO: Show broken file image?
}

function trackPromise(promise) {
  let isFulfilled = false;
  const trackedPromise = promise.then(
    (result) => {
      isFulfilled = true;
      return result; // Preserve the resolved value
    },
    (error) => {
      isFulfilled = true;
      console.error('Promise rejected:', error);
    },
  );

  // Attach the isFulfilled property
  trackedPromise.isFulfilled = () => isFulfilled;

  return trackedPromise;
}

function updateProgress() {
  const pagesCounter = parseInt(document.getElementById('pages-counter').innerText, 10) || 0;
  const totalCounter = parseInt(document.getElementById('total-counter').innerText, 10) || 1; // Avoid division by zero

  // Calculate the percentage of completion
  const percentage = (pagesCounter / (totalCounter * 1.1)) * 100;

  // Update the progress bar width
  document.getElementById('progress').style.width = `${percentage}%`;
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
  if (counter.id === 'images-counter' || counter.id === 'total-counter') updateProgress();
}

/**
 * Displays an cluster in the gallery.
 */
function displayImage(clusterId) {
  const { identityProcessor } = window;
  const cluster = identityProcessor.getCluster(clusterId);
  if (cluster.id !== clusterId || cluster.figureForCluster.parentElement !== null) {
    // This cluster was re-clustered and displayed or it's already displayed.
    updateCounter(document.getElementById('duplicate-images-counter'), 1);
    return;
  }
  const gallery = document.getElementById('image-gallery');
  // append the figure to the gallery if needed
  gallery.append(cluster.figureForCluster);
  updateCounter(document.getElementById('images-counter'), 1);
  changeFilters();
}

async function loadImages(individualBatch, concurrency) {
  // use a map to track unique images by their src attribute
  const promises = []; // Array to hold promises
  const batchEntries = [];

  individualBatch.filter((img) => isUrlValid(img.origin));

  for (let i = 0; i < individualBatch.length; i += 1) {
    const img = individualBatch[i];
    if (promises.length >= concurrency) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.race(promises);
      // Remove the completed promises
      promises.splice(0, promises.findIndex((p) => p.isFulfilled()) + 1);
    }

    const {
      src, origin, site, alt, width, height, aspectRatio, instance, fileType,
    } = img;

    window.imageCount += 1;
    const { imageCount } = window;
    const { href } = new URL(src, origin);
    const { identityProcessor } = window;
    const loadedImg = new Image(width, height);
    if (CORS_ANONYMOUS) loadedImg.crossOrigin = 'Anonymous';
    const figure = document.createElement('figure');
    figure.append(loadedImg);

    // build info button
    const info = document.createElement('button');
    info.setAttribute('aria-label', 'More information');
    info.setAttribute('type', 'button');
    info.innerHTML = '<span class="icon icon-info"></span>';
    figure.append(info);

    const originatingIdentity = new Identity(`slo:${imageCount}`, 'sitemap-img-load-order', false, false);
    const clusterId = identityProcessor.addCluster(new IdentityCluster(identityProcessor, originatingIdentity, loadedImg, figure, 'image'));

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

    batchEntries.push(clusterId);

    // preflight checks are lightweight and must be done to prevent other
    // heavywieght operations from running on meaningless items.
    // eslint-disable-next-line no-await-in-loop
    await executePreflightFunctions(clusterId, values);
    if (identityProcessor.getCluster(clusterId).id === clusterId) {
      // This cluster was NOT re-clustered. Run more expensive functions.
      const promise = trackPromise(new Promise((resolve) => {
        loadedImg.onload = async () => {
          await imageOnLoad(clusterId, values)
            .then(() => {
              displayImage(clusterId);
              updateFigureData(clusterId);
            });
          resolve(true);
        };
        loadedImg.onerror = async (error) => {
          await imageOnError(clusterId, values, href, error);
          resolve(true);
        };
      }));

      // dont start loading the image until here.
      loadedImg.src = href;

      promises.push(promise);
    } else {
      updateFigureData(identityProcessor.getCluster(clusterId).id);
      updateCounter(document.getElementById('duplicate-images-counter'), 1);
    }
  }

  await Promise.allSettled(promises);
  return batchEntries;
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
        // eslint-disable-next-line no-await-in-loop
        const imgData = await fetchImageDataFromPage(url);
        results.push(...imgData);
        updateCounter(counter, 1);
      }
    })());
  }

  await Promise.allSettled(tasks); // wait for all concurrent tasks to complete
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
  await loadImages(batchData, concurrency);
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
  const duplicatesCounter = document.getElementById('duplicate-images-counter');
  updateCounter(duplicatesCounter);
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
      batchPromises.splice(0, batchPromises.findIndex((p) => p.isFulfilled()) + 1);
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

    batchPromises.push(trackPromise(promise));
  }

  // Wait for all batches to finish processing
  await Promise.allSettled(batchPromises);

  // After all batches are done
  data.length = 0;
  console.log('All batches are done');
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
  window.imageCount = 0;
  window.identityProcessor = new IdentityProcessor(AEM_EDS_HOSTS, addColorsToFilterList);
}

function showOverlay() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'block'; // Show the overlay
  overlay.classList.add('active');
  document.getElementById('progress-bar').style.display = 'block'; // Show progress bar
}

function hideOverlay() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none'; // Hide the overlay
  overlay.classList.remove('active');
  document.getElementById('progress-bar').style.display = 'none'; // Hide progress bar
  document.getElementById('progress').style.width = '0%'; // Reset progress
}

async function processForm(sitemap) {
  setupWindowVariables();
  showOverlay();
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container

  document.querySelectorAll('dialog').forEach((dialog) => { dialog.remove(); });

  const urls = await fetchSitemap(sitemap);
  // await fetchAndDisplayBatches(urls.slice(8000, 8100));
  await fetchAndDisplayBatches(urls);
  hideOverlay();
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

function overrideCreateCanvas(doc) {
  document.originalCreateElement = doc.createElement;
  document.createElement = function createElement(tagName, options) {
    if (tagName === 'canvas') {
      const canvas = document.originalCreateElement(tagName, options);
      canvas.originalGetContext = canvas.getContext;
      canvas.getContext = function getContext(contextId, contextAttributes) {
        if (contextId === '2d' && !contextAttributes?.willReadFrequently) {
          if (!contextAttributes) {
            return canvas.originalGetContext(contextId, { willReadFrequently: true });
          }
          contextAttributes.willReadFrequently = true;
        }
        return canvas.originalGetContext(contextId, contextAttributes);
      };
      return canvas;
    }
    return document.originalCreateElement(tagName, options);
  };
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

overrideCreateCanvas(document);
