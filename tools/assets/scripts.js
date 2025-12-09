/* eslint-disable import/no-relative-packages, max-classes-per-file, class-methods-use-this */
// These imports register the classes with the IdentityRegistry
import './identity/defaultidentityloader.js';
import './reports/defaultreportsloader.js';
import './crawler/defaultcrawlersloader.js';
import './sort/defaultsortsloader.js';
import './filter/defaultfilterloader.js';

import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';

import ClusterManager from './identity/clustermanager.js';
import IdentityRegistry from './identity/identityregistry.js';
import IdentityValues from './identity/identityvalues.js';
import SitemapLoadOrderIdentity from './identity/sitemaploadorderidentity.js';
import ColorIdentity from './identity/imageidentity/coloridentity.js';
import UrlAndPageIdentity from './identity/imageidentity/urlandpageidentity.js';
import PromisePool from './util/promisepool.js';
import ReportRegistry from './reports/reportregistry.js';
import LighthouseIdentity from './identity/imageidentity/lighthouseidentity.js';
import NamingUtil from './reports/util/namingutil.js';
import PerformanceUtil from './reports/util/performanceutil.js';
import ImageAuditUtil from './util/imageauditutil.js';
import CrawlerRegistry from './crawler/crawlerregistry.js';
import SortRegistry from './sort/sortregistry.js';
import FilterRegistry from './filter/filterregistry.js';
import AbstractFilter from './filter/abstractfilter.js';
import UrlResourceHandler from './util/urlresourcehandler.js';

// import { AEM_EDS_HOSTS } from './identity/imageidentity/urlidentity.js';

/* url and sitemap utility */
const CORS_ANONYMOUS = true;

const PAGE_SIZE = 1000;

const DB_NAME = 'ImageAuditExecutions';
const STORE_NAME = 'Executions';
const MAX_BATCH_SIZE = 100;

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveFormData(url, formData) {
  try {
    const db = await openDB(); // Open DB
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const value = JSON.stringify(formData);
    const key = url instanceof URL ? url.href : url;

    const request = store.put(value, key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // Save the URL of the most recent form data in localStorage
        localStorage.setItem('lastExecutedURL', key);
        resolve();
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error opening DB or saving form data:', error);
    return Promise.resolve();
  }
}

function isHidden(element) {
  // Check if the element or any of its ancestors have aria-hidden="true"
  if (element.closest('[aria-hidden="true"]')) {
    return true;
  }

  // Check if the element is hidden using CSS
  const style = getComputedStyle(element);
  return style.display === 'none' || style.visibility === 'hidden';
}

function populateFormFromData(data) {
  Object.keys(data).forEach((key) => {
    const inputs = document.querySelectorAll(`[name="${key}"]`);

    if (inputs.length) {
      inputs.forEach((input) => {
        // Skip hidden fields or fields in containers with aria-hidden="true"
        if (isHidden(input)) return;

        if (input.type === 'file') {
          // Skip file inputs since their value cannot be set programmatically
          return;
        }

        if (input.type === 'radio') {
          // Handle radio buttons: uncheck if not the selected value
          input.checked = input.value === data[key];
          input.dispatchEvent(new Event('change')); // Trigger the change event
        } else if (input.type === 'checkbox') {
          // Handle checkboxes: uncheck if not in the data array
          if (Array.isArray(data[key])) {
            input.checked = data[key].includes(input.value);
          } else {
            input.checked = data[key] === input.value;
          }
          input.dispatchEvent(new Event('change')); // Trigger the change event
        } else {
          // Handle other input types
          input.value = data[key] || ''; // Set to empty string if no value
          input.dispatchEvent(new Event('change')); // Trigger the change event
        }
      });
    }
  });

  // Uncheck or reset inputs not included in the data
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach((input) => {
    const { name, type } = input;

    // Skip inputs without a name, files, hidden fields, or those already processed
    if (!name || type === 'file' || Object.prototype.hasOwnProperty.call(data, name) || isHidden(input)) {
      return;
    }

    if (type === 'radio' || type === 'checkbox') {
      input.checked = false; // Uncheck unhandled radio or checkbox inputs
      input.dispatchEvent(new Event('change')); // Trigger the change event
    } else {
      input.value = ''; // Clear unhandled input fields
      input.dispatchEvent(new Event('change')); // Trigger the change event
    }
  });

  // Explicitly trigger change events for specific options
  document.querySelectorAll('input[name="sitemap-option"]:checked').forEach((option) => {
    if (!isHidden(option)) {
      option.dispatchEvent(new Event('change'));
    }
  });
}

async function populateFormFromUrl(url) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    let key = url;
    if (key instanceof URL) key = key.href;

    const request = store.get(key);

    request.onsuccess = (e) => {
      const data = e.target.result;
      if (data) {
        // If a match is found, populate the form fields with the corresponding data
        const parsedData = JSON.parse(data);
        populateFormFromData(parsedData);
      } else {
        // eslint-disable-next-line no-console
        console.debug('No matching data found for:', url);
      }
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error during populateFormFromUrl:', error);
  }
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

function getShapeForRatio(ratio) {
  if (ratio === 1) return 'Square';
  if (ratio < 1) return 'Portrait';
  if (ratio > 1.7) return 'Widescreen';
  return 'Landscape';
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

    // Count occurrences of each site
    const counts = value.reduce((acc, site) => {
      acc[site] = (acc[site] || 0) + 1;
      return acc;
    }, {});

    // Render unique sites only
    const sites = Object.keys(counts).map((site, i) => {
      let alt = null;
      if (this.data.alt.length <= i) {
        alt = this.data.alt[i]; // this is not technically correct. They arent 1:1
      }
      const usageText = counts[site] > 1 ? ` (Usages: ${counts[site]})` : '';
      const a = `<a href="${new URL(site, this.data.origin).href}" target="_blank">${new URL(site).pathname}</a>${usageText}`;

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
    return ar(value, getShapeForRatio(value));
  }

  imageOptions(value) {
    return `<img src="${value.detail.href}" />`;
  }

  topColors(value) {
    if (!value) return '-';
    return value.map((color) => getColorSpan(color, false).outerHTML).join(' ');
  }

  lighthouse(scores) {
    let html = '';

    // Assuming 'scores.total' contains the overall Lighthouse score
    const roundedOverallTotal = Math.round(scores.total);

    // Add the Lighthouse score at the top
    html += `<div><strong>Success Score: ${roundedOverallTotal}</strong></div><br/>`;

    // Iterate over each category in scores (excluding the 'total' property)
    Object.keys(scores).forEach((category) => {
      if (category !== 'total' && Object.prototype.hasOwnProperty.call(scores, category)) {
        const categoryData = scores[category];

        // Convert the category name to a pretty name and round the total score
        const categoryName = NamingUtil.formatPropertyNameForUI(category);
        const roundedTotal = Math.round(categoryData.total);

        // Add the category name and total score
        html += `<div><strong>${categoryName} - Total: ${roundedTotal}</strong></div>`;

        // If there are sub-scores, break them down
        Object.keys(categoryData).forEach((subscore) => {
          if (subscore !== 'total' && Object.prototype.hasOwnProperty.call(categoryData, subscore)) {
            const subscoreName = NamingUtil.formatPropertyNameForUI(subscore);
            const roundedScore = Math.round(categoryData[subscore]);
            html += `<div style="margin-left: 20px;">${subscoreName}: ${roundedScore}</div>`;
          }
        });
      }
    });

    // Return the generated HTML
    return html;
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
      aspectRatio: 'Aspect ratio',
      imageOptions: 'Preview',
      alt: 'Alt Text',
    };

    const { clusterManager } = window;
    const cluster = clusterManager.get(clusterId);

    const site = cluster.getAll(UrlAndPageIdentity.type, 'site');
    const alt = cluster.getAll(UrlAndPageIdentity.type, 'alt');
    // todo: this should be done as multiple entries of width, height, src.
    const identity = cluster.getFirstIdentityOf(UrlAndPageIdentity.type);
    if (identity === null) {
      return;
    }

    // Get the full imageOptions object from the cluster
    const clusterImageOptions = clusterManager.get(clusterId).imageOptions;

    const data = {
      fileType: ImageAuditUtil.getFileType(clusterManager.get(clusterId).elementForCluster.src),
      count: site.length,
      site,
      alt,
      width: identity.width,
      height: identity.height,
      aspectRatio: identity.aspectRatio,
      imageOptions: clusterImageOptions, // Pass the full object
    };

    const colorIdentity = cluster.getSingletonOf(ColorIdentity.type);
    if (colorIdentity) {
      rows.topColors = 'Top Colors';
      data.topColors = colorIdentity.topColorsSorted;
    }

    const lighthouse = cluster.getSingletonOf(LighthouseIdentity.type);

    if (window.collectingRum) {
      const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
      const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
      const visits = cluster.getAll(UrlAndPageIdentity.type, 'visits').reduce((acc, curr) => acc + curr, 0);
      const bounces = cluster.getAll(UrlAndPageIdentity.type, 'bounces').reduce((acc, curr) => acc + curr, 0);

      rows.performanceScore = 'Asset Performance';
      rows.pageViews = 'Page Views';
      rows.conversions = 'Conversions';
      rows.visits = 'Visits';
      rows.bounces = 'Bounces';
      rows.lighthouse = 'Asset Success Score';
      data.performanceScore = PerformanceUtil.getPerformanceScore(conversions, pageViews, visits, bounces, true);
      data.pageViews = pageViews > 0 ? pageViews : ' < 100';
      data.conversions = conversions > 0 ? conversions : ' < 100';
      data.visits = visits > 0 ? visits : ' < 100';
      data.bounces = bounces > 0 ? bounces : ' < 100';
    }
    data.lighthouse = lighthouse.scores;

    const textIdentity = cluster.getSingletonOf('text-identity');
    if (textIdentity) {
      rows.text = 'OCR Text';
      data.text = textIdentity.identityText;
    }

    /* work in progress
    const similarClusters = cluster.getAllIdentitiesOf('similar-perceptual-identity');
    if (similarClusters.length > 0) {
      rows.similar = 'Similar Images';
      // Assuming 'clusters' is an array containing your clusters
      const urlMap = new Map();

      // Step 1: Extract data and store in a Map
      similarClusters.forEach((cluster) => {
        const imgElement = cluster.figureForCluster;
        if (imgElement) {
          const { src } = imgElement;
          const { width } = imgElement;
          const { height } = imgElement;

          // Step 2: Store the src as the key and width/height as the value in the map
          urlMap.set(src, { width, height });
        }
      });

      // Step 3: Iterate over the Map to generate the HTML string
      let htmlString = '';

      urlMap.forEach((value, src) => {
        htmlString += `<img src="${src}" width="${value.width}" height="${value.height}" />\n`;
      });

      data.similar = htmlString;
    }
    */

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

function sortImages(doc, targetSort, targetFilter, targetPagination) {
  if ((targetSort && targetFilter && targetPagination)
      || (!targetSort && !targetFilter && !targetPagination)) {
    throw new Error('Exactly one of targetSort, targetFilter, or targetPagination must be provided.');
  }

  const sortTriggered = targetSort !== null;
  let target = targetSort;
  if (target) window.lastTarget = target;
  else target = window.lastTarget;

  const CANVAS = doc.getElementById('canvas');
  const GALLERY = CANVAS.querySelector('.gallery');
  const ACTION_BAR = CANVAS.querySelector('.action-bar');
  const SORT_ACTIONS = ACTION_BAR.querySelectorAll('input[name="sort"]');
  const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');
  const checkedFilters = [...FILTER_ACTIONS].filter((a) => a.checked).map((a) => a.value);

  const sortKey = target.value;

  let ascending = false;

  if (target.dataset.order === undefined
    || target.dataset.order === null
    || target.dataset.order === '') {
    // not previously set, set to descending.
    ascending = false;
  } else if (target.dataset.order === 'ascending') {
    // eslint-disable-next-line no-unneeded-ternary
    ascending = sortTriggered ? false : true; // if a click on sort triggered it, flip the order
  } else if (target.dataset.order === 'descending') {
    // eslint-disable-next-line no-unneeded-ternary
    ascending = sortTriggered ? true : false; // if a click on sort triggered it, flip the order
  }
  target.dataset.order = ascending ? 'ascending' : 'descending';

  const { sortRegistry } = window;
  // Get the sort instance from the SortRegistry
  const sorter = sortRegistry.getSortInstance(sortKey);

  const { clusterManager } = window;

  let pageValue = 1;
  if (targetPagination) {
    pageValue = parseInt(targetPagination.value, 10);
  }

  // Perform sorting using the sort class
  const {
    clusters,
    pageCount,
  } = sorter.sort(clusterManager, checkedFilters, pageValue, PAGE_SIZE, ascending);

  // Clear the gallery and append sorted figures
  GALLERY.innerHTML = ''; // Clear current gallery content
  clusters.forEach((cluster) => {
    if (cluster.figureForCluster) {
      GALLERY.appendChild(cluster.figureForCluster);
    }
  });

  if (sortTriggered) {
    // Remove existing arrows from all sort options
    SORT_ACTIONS.forEach((action) => {
      const label = action.nextElementSibling;
      label.innerHTML = label.innerHTML.replace(/[\u25B2\u25BC]/g, ''); // Remove arrows
    });

    const arrow = ascending ? ' \u25B2' : ' \u25BC'; // Up arrow or down arrow
    target.nextElementSibling.innerHTML += arrow; // Append arrow to the label
  }

  const pagination = doc.getElementById('pagination-div');
  // Update the pagination
  if (pageCount > 1) {
    const slider = doc.getElementById('pagination-slider');
    slider.max = pageCount;
    slider.value = pageValue;
    const paginationCounter = doc.getElementById('pagination-counter');
    paginationCounter.textContent = pageCount;
    const currentPage = doc.getElementById('current-page');
    currentPage.textContent = pageValue;
    pagination.setAttribute('aria-hidden', 'false');
    pagination.style.display = '';
  } else {
    pagination.setAttribute('aria-hidden', 'true');
    pagination.style.display = 'none';
  }
}

function changeFilters(triggerElement) {
  const CANVAS = document.getElementById('canvas');
  const ACTION_BAR = CANVAS.querySelector('.action-bar');
  const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');

  const checkedPreFilter = [...FILTER_ACTIONS].filter((a) => a.checked).map((a) => a.value);
  const filter = FilterRegistry.get(triggerElement.value);
  const uncheckSet = new Set(filter.changeCheckedFiltersOnCheck(checkedPreFilter));
  // Uncheck all checkboxes in the uncheckSet
  FILTER_ACTIONS.forEach((input) => {
    if (uncheckSet.has(input.value)) {
      input.checked = false;
    }
  });

  sortImages(document, null, triggerElement);
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
  action.addEventListener('change', (event) => changeFilters(event.target));
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
    addFilterAction(checkbox);

    // Append the hidden checkbox and color square to the label
    label.appendChild(checkbox);
    label.appendChild(colorSpan);

    // Append the label to the list item
    listItem.appendChild(label);

    // Append the list item to the main color palette container
    colorPaletteContainer.appendChild(listItem);
  });
}

async function executePreflightFunctions(identityValues, identityState) {
  await IdentityRegistry.identityRegistry
    .identifyPreflight(identityValues, identityState);
}

async function imageOnLoad(imgElement, identityValues, identityState) {
  await IdentityRegistry.identityRegistry
    .identifyPostflight(identityValues, identityState);

  const { clusterManager } = window;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { elementForCluster } = clusterManager.get(identityValues.originatingClusterId);

  canvas.width = imgElement.width;
  canvas.height = imgElement.height;

  ctx.drawImage(elementForCluster, 0, 0, canvas.width, canvas.height);

  identityValues.canvas = canvas;
  identityValues.ctx = ctx;

  await IdentityRegistry.identityRegistry
    .identifyPostflightWithCanvas(identityValues, identityState);
}

async function imageOnError(identityValues, identityState, error) {
  await IdentityRegistry.identityRegistry
    .identifyPostError(identityValues, identityState);

  // eslint-disable-next-line no-console
  console.error(`Error loading img file at ${identityValues.href}`, error);
  // TODO: Show broken file image?
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
  const { clusterManager } = window;
  const cluster = clusterManager.get(clusterId);
  if (cluster.id !== clusterId || cluster.figureForCluster.parentElement !== null) {
    // This cluster was re-clustered and displayed or it's already displayed.
    updateCounter(document.getElementById('duplicate-images-counter'), 1);
    return;
  }
  const gallery = document.getElementById('image-gallery');
  // append the figure to the gallery if needed
  if (gallery.children.length < PAGE_SIZE) {
    gallery.append(cluster.figureForCluster);
  }
  updateCounter(document.getElementById('images-counter'), 1);
}

async function loadImage(
  identityValues,
  identityState,
  clusterManager,
  originatingClusterId,
  loadedImg,
  href,
) {
  // preflight checks are lightweight and must be done to prevent other
  // heavywieght operations from running on meaningless items.
  await executePreflightFunctions(identityValues, identityState);

  if (clusterManager.get(originatingClusterId).id === originatingClusterId) {
    let onLoadError = null;
    let success = false;
    // This cluster was NOT re-clustered. Load the image.
    await UrlResourceHandler.run(async () => {
      const imageLoaded = new Promise((resolve) => {
        loadedImg.onload = () => {
          success = true;
          resolve(true);
        };
        // eslint-disable-next-line no-unused-vars
        loadedImg.onerror = (error) => {
          onLoadError = error;
          success = false;
          resolve(true);
        };
      });

      // dont start loading the image until here.
      // Use proxy URL if proxy mode is enabled
      loadedImg.src = UrlResourceHandler.getImageUrl(href);
      return imageLoaded;
    });

    // run more expensive functions.
    if (success) {
      return imageOnLoad(loadedImg, identityValues, identityState)
        .then(() => {
          displayImage(originatingClusterId);
        });
    }
    return imageOnError(identityValues, identityState, onLoadError);
  }

  updateCounter(document.getElementById('duplicate-images-counter'), 1);
  return Promise.resolve(true);
}

async function loadImages(
  individualBatch,
  selectedIdentifiers,
  domainKey,
  replacementDomain,
  submissionValues,
) {
  const { clusterManager, identityState } = window;

  const loadingImagesPool = new PromisePool(10, 'loadImages pool');

  // use a map to track unique images by their src attribute
  const batchEntries = [];

  for (let i = 0; !window.stopProcessing && i < individualBatch.length; i += 1) {
    const img = individualBatch[i];

    const {
      site, alt, aspectRatio, instance, fileType, width, height, imageOptions, invalidDimensions,
    } = img;

    window.imageCount += 1;
    const { imageCount } = window;
    const loadedImg = new Image(imageOptions.card.width, imageOptions.card.height);
    const { identityCache } = window;
    if (CORS_ANONYMOUS) loadedImg.crossOrigin = 'Anonymous';
    const figure = document.createElement('figure');
    figure.append(loadedImg);

    // build info button
    const info = document.createElement('button');
    info.setAttribute('aria-label', 'More information');
    info.setAttribute('type', 'button');
    info.innerHTML = '<span class="icon icon-info"></span>';
    figure.append(info);

    const originatingClusterId = clusterManager.newCluster(
      new SitemapLoadOrderIdentity(imageCount),
      loadedImg,
      figure,
      'image',
      imageOptions,
    );

    const identityValues = new IdentityValues({
      originatingClusterId,
      clusterManager,
      selectedIdentifiers,
      submissionValues,
      identityCache,
      imageOptions,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      fileType,
      domainKey,
      replacementDomain,
      invalidDimensions,
    });

    batchEntries.push(originatingClusterId);

    loadingImagesPool.run(async () => {
      await identityValues.initializeIdentityHash();
      await loadImage(
        identityValues,
        identityState,
        clusterManager,
        originatingClusterId,
        loadedImg,
        imageOptions.card.href,
      );
    });
  }

  await loadingImagesPool.allSettled();

  // similarity computed per batch -- maybe should be done once at the very end instead.
  await clusterManager.detectSimilarity(batchEntries, identityState);

  // colors updated per batch
  if (identityState[ColorIdentity.type]?.usedColors) {
    addColorsToFilterList(identityState[ColorIdentity.type].usedColorsSorted);
  }

  return batchEntries;
}

async function handleBatch(
  crawler,
  batch,
  pagesCounter,
  data,
  gallery,
  identifiers,
  domainKey,
  replacementDomain,
  submissionValues,
) {
  try {
    let pageCount = 0;
    const batchData = await crawler
      .fetchBatch(batch, MAX_BATCH_SIZE, () => { pageCount += 1; });

    data.push(...batchData);

    await loadImages(
      batchData,
      identifiers,
      domainKey,
      replacementDomain,
      submissionValues,
    );
    updateCounter(pagesCounter, pageCount);
    decorateIcons(gallery);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching batch:', error);
  }
}

/**
 * Fetches and display image data in batches.
 * @param {Object[]} urls - Array of URL objects.
 * @param {number} - Number of URLs to fetch per batch.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchAndDisplayBatches(
  crawler,
  urls,
  identifiers,
  domainKey,
  replacementDomain,
  submissionValues,
  batchSize = MAX_BATCH_SIZE,
) {
  const promisePool = new PromisePool(10, 'fetchAndDisplayBatches pool');
  const data = [];
  const main = document.querySelector('main');
  main.dataset.canvas = true;
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
  const timer = setInterval(() => {
    const now = Date.now();
    const timeSinceLastRun = Math.round((now - window.lastExecutionTime) / 1000);
    if (timeSinceLastRun > 0) {
      updateCounter(elapsed, timeSinceLastRun, false);
      window.lastExecutionTime = now;
    }
  }, 1000);

  // Show the results section
  const results = document.getElementById('audit-results');
  results.removeAttribute('aria-hidden');

  for (let i = 0; !window.stopProcessing && i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    // Process each batch and handle the delay between batches asynchronously
    promisePool.run(async () => handleBatch(
      crawler,
      batch,
      pagesCounter,
      data,
      gallery,
      identifiers,
      domainKey,
      replacementDomain,
      submissionValues,
    ));
  }

  await promisePool.allSettled();

  // After all batches are done
  data.length = 0;
  // eslint-disable-next-line no-console
  console.debug('Batches complete.');

  clearInterval(timer);

  return data;
}

function addSortAction(doc, action) {
  action.addEventListener('click', (e) => {
    const { target } = e;
    sortImages(doc, target, null);
  });
}

function addSortActionsToActionBar(sitemapFormData, identifiers) {
  const sortsList = document.getElementById('sorts');

  // Clear existing list items
  sortsList.innerHTML = '';

  // Generate and append new list items
  SortRegistry.getSorts(sitemapFormData, identifiers).forEach((sort) => {
    const existingElement = document.getElementById(`sort-${sort.key}`);
    if (existingElement) {
      addSortAction(document, existingElement);
    } else {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      const span = document.createElement('span');

      // Configure the input element
      input.type = 'radio';
      input.name = 'sort';
      input.value = sort.key;
      input.id = `sort-${sort.key}`;
      input.setAttribute('data-order', '-1'); // Default order

      addSortAction(document, input);

      // Configure the span element
      span.textContent = sort.description;

      // Assemble the elements
      label.appendChild(input);
      label.appendChild(span);
      li.appendChild(label);
      sortsList.appendChild(li);
    }
  });
}

function addFilterActionsToActionBar(sitemapFormData, identifiers) {
  const filterList = document.getElementById('filters');

  // Clear existing list items
  filterList.innerHTML = '';

  // Generate and append new list items
  FilterRegistry.getFilters(sitemapFormData, identifiers).forEach((filter) => {
    // wildcards manage their own listeners and elements.
    if (!filter.key.endsWith(AbstractFilter.WILDCARD)) {
      const existingElement = document.getElementById(`filter-${filter.key}`);
      if (existingElement) {
        addFilterAction(existingElement);
      } else {
        const li = document.createElement('li');
        const label = document.createElement('label');
        const input = document.createElement('input');
        const span = document.createElement('span');

        // Configure the input element
        input.type = 'checkbox';
        input.name = 'filter';
        input.value = filter.key;
        input.id = `filter-${filter.key}`;

        addFilterAction(input);

        // Configure the span element
        span.textContent = filter.description;

        // Assemble the elements
        label.appendChild(input);
        label.appendChild(span);
        li.appendChild(label);
        filterList.appendChild(li);
      }
    }
  });
}

/* setup */

function setupWindowVariables() {
  window.enableModals = false;
  window.lastTarget = null;
  window.imageCount = 0;
  window.clusterManager = new ClusterManager();
  window.identityState = {};
  window.duplicateFilter = new Set();
  window.lastExecutionTime = Date.now();
  window.identityCache = IdentityRegistry.identityRegistry.identityCache;
  window.stopProcessing = false;
  window.sortRegistry = new SortRegistry();
  UrlResourceHandler.initialize();
}

function prepareLoading() {
  setupWindowVariables();
  const results = document.getElementById('audit-results');
  const progressBar = document.getElementById('progress-bar');
  const actionForm = document.getElementById('action-form');
  const download = results.querySelector('select');

  progressBar.setAttribute('aria-hidden', false);
  actionForm.setAttribute('aria-hidden', true);

  download.disabled = true;
  document.getElementById('progress-bar').style.display = 'block'; // Show progress bar
  window.enableModals = false;
}

function finishedLoading() {
  const results = document.getElementById('audit-results');
  const progressBar = document.getElementById('progress-bar');
  const actionForm = document.getElementById('action-form');
  const download = results.querySelector('select');

  document.getElementById('progress-bar').style.display = 'none'; // Hide progress bar
  document.getElementById('progress').style.width = '0%'; // Reset progress

  download.disabled = false;

  progressBar.setAttribute('aria-hidden', true);
  actionForm.setAttribute('aria-hidden', false);

  if (window.collectingRum) {
    sortImages(document, document.getElementById('sort-performance'), null);
  } else {
    sortImages(document, document.getElementById('sort-count'), null);
  }

  window.enableModals = true;

  const stopButton = document.getElementById('stop-button');
  stopButton.classList.remove('stop-pulsing');
  window.stopProcessing = false;
  window.stopCallback = undefined;
}

async function processForm(
  sitemapFormData,
  identifiers,
  domainKey,
  replacementDomain,
  submissionValues,
) {
  prepareLoading();
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container

  document.querySelectorAll('dialog').forEach((dialog) => { dialog.remove(); });

  const crawler = CrawlerRegistry.getCrawlerInstance(sitemapFormData);

  window.stopCallback = () => crawler.stop();

  const urls = await crawler.fetchSitemap(sitemapFormData);
  await fetchAndDisplayBatches(
    crawler,
    urls,
    identifiers,
    domainKey,
    replacementDomain,
    submissionValues,
  );

  addSortActionsToActionBar(sitemapFormData, identifiers);
  addFilterActionsToActionBar(sitemapFormData, identifiers);

  finishedLoading();
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

function populateSiteUrlDropdown(urls) {
  const datalist = document.getElementById('site-url-history');
  datalist.innerHTML = ''; // Clear existing options

  // Add each URL as an option in the datalist
  urls.forEach((url) => {
    const option = document.createElement('option');
    option.value = url;
    datalist.appendChild(option);
  });
}

async function handleSiteUrlChange(event) {
  const enteredUrl = event.target.value; // The URL entered by the user
  await populateFormFromUrl(enteredUrl); // Use the new shared function to populate the form
}

async function handleSiteUrlFocus() {
  // Placeholder for any focus-related logic. You can still use `populateSiteUrlDropdown` if needed.
  // In this case, we'll just populate the dropdown with previously entered URLs
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const urls = []; // Array to store previous URLs

    // Open a cursor to iterate through all records in the store
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        urls.push(cursor.key); // Collect URLs from the DB
        cursor.continue(); // Continue iterating
      } else {
        // Populate the dropdown with the URLs once the cursor finishes
        populateSiteUrlDropdown(urls);
      }
    };

    cursorRequest.onerror = (event) => {
      // eslint-disable-next-line no-console
      console.warn('Error fetching site URLs:', event.target.error);
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error during site-url focus handler:', error);
  }
}

async function domContentLoaded() {
  try {
    // Retrieve the last executed URL from localStorage
    const lastURL = localStorage.getItem('lastExecutedURL');

    if (!lastURL) {
      return;
    }

    const db = await openDB(); // Open DB
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    // Get the form data associated with the last URL
    const request = store.get(lastURL);

    request.onsuccess = (event) => {
      const data = event.target.result;
      if (data) {
        const parsedData = JSON.parse(data); // Parse the stringified form data
        populateFormFromData(parsedData); // Populate the form with the retrieved data
      }
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug('Error during domContentLoaded:', error);
  }
}

function registerListeners(doc) {
  const URL_FORM = doc.getElementById('site-form');
  const CANVAS = doc.getElementById('canvas');
  const GALLERY = CANVAS.querySelector('.gallery');
  const ACTION_SELECT = doc.getElementById('action-select');
  const ACTION_BAR = CANVAS.querySelector('.action-bar');
  const SORT_ACTIONS = ACTION_BAR.querySelectorAll('input[name="sort"]');
  const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');
  // Function to populate the dropdown with reports

  document.querySelectorAll('input[name="sitemap-option"]').forEach((option) => {
    option.addEventListener('change', (event) => {
      const fileInputContainer = document.getElementById('file-input-container');
      const urlInputContainer = document.getElementById('url-input-container');
      const fileInput = document.getElementById('embedded-sitemap-file');
      const urlInput = document.getElementById('embedded-sitemap-url');

      if (event.target.value === 'file') {
        fileInputContainer.setAttribute('aria-hidden', 'false');
        urlInputContainer.setAttribute('aria-hidden', 'true');
        fileInput.setAttribute('required', 'required');
        urlInput.removeAttribute('required');
      } else if (event.target.value === 'url') {
        fileInputContainer.setAttribute('aria-hidden', 'true');
        urlInputContainer.setAttribute('aria-hidden', 'false');
        urlInput.setAttribute('required', 'required');
        fileInput.removeAttribute('required');
      } else {
        // "None" selected: hide both fields and remove requirements
        fileInputContainer.setAttribute('aria-hidden', 'true');
        urlInputContainer.setAttribute('aria-hidden', 'true');
        fileInput.removeAttribute('required');
        urlInput.removeAttribute('required');
      }
    });
  });

  const siteUrlInput = document.querySelector('[name="site-url"]');
  if (siteUrlInput) {
    siteUrlInput.addEventListener('input', handleSiteUrlChange);
    siteUrlInput.addEventListener('focus', handleSiteUrlFocus);
  }

  doc.getElementById('embedded-sitemap-file').addEventListener('change', (event) => {
    const fileInput = event.target;
    const label = document.getElementById('embedded-sitemap-file-label');

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];

      label.textContent = `File: ${file.name}`;
    } else {
      label.textContent = 'Click to select sitemap';
    }
  });

  window.addEventListener('DOMContentLoaded', () => domContentLoaded());

  const stopButton = doc.getElementById('stop-button');
  stopButton.addEventListener('click', () => {
    stopButton.classList.add('stop-pulsing');
    window.stopProcessing = true;
    window.stopCallback();
  });

  doc.getElementById('decrease-slider').addEventListener('click', () => {
    const slider = doc.getElementById('pagination-slider');
    const value = parseInt(slider.value, 10) - 1;
    if (value < 1) return;
    slider.value = value;
    slider.dispatchEvent(new Event('change'));
  });

  doc.getElementById('increase-slider').addEventListener('click', () => {
    const slider = doc.getElementById('pagination-slider');
    const value = parseInt(slider.value, 10) + 1;
    const max = parseInt(slider.max, 10);
    if (value > max) return;
    slider.value = value;
    slider.dispatchEvent(new Event('change'));
  });

  doc.getElementById('pagination-slider').addEventListener('change', (e) => {
    sortImages(doc, null, null, e.target);
  });

  // handle form submission
  URL_FORM.addEventListener('submit', async (e) => {
    e.preventDefault();
    // clear all sorting and filters
    // eslint-disable-next-line no-return-assign
    [...SORT_ACTIONS, ...FILTER_ACTIONS].forEach((action) => action.checked = false);
    const data = getFormData(e.srcElement);

    const sitemapForm = doc.getElementById('identity-selectors');
    const identificationActions = sitemapForm.querySelectorAll('input[type="checkbox"]');

    const domainKey = data['domain-key'];
    if (domainKey) {
      window.collectingRum = true;
    } else {
      window.collectingRum = false;
    }

    const replacementDomain = data['replacement-domain'];
    const identifiers = new Set([...identificationActions]
      .filter((a) => a.checked)
      .map((a) => a.value));

    if (identifiers.has(ColorIdentity.type)) {
      doc.getElementById('color-pallette-container').removeAttribute('aria-hidden');
    } else {
      doc.getElementById('color-pallette-container').setAttribute('aria-hidden', true);
    }

    if (data['site-url']) {
      try {
        // Save form data into IndexedDB
        await saveFormData(data['site-url'], data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Error saving form data to IndexedDB:', err);
      }
      processForm(data, identifiers, domainKey, replacementDomain, data);
    }
  });

  // handle gallery clicks to display modals
  GALLERY.addEventListener('click', (e) => {
    const figure = e.target.closest('figure');

    if (figure && window.enableModals) displayModal(figure);
  });

  // handle action selection (reports and AEM exports)
  ACTION_SELECT.addEventListener('change', async () => {
    const selectedValue = ACTION_SELECT.value;
    if (!selectedValue) return;

    const [type, id] = selectedValue.split(':');

    // Start the pulse animation
    ACTION_SELECT.classList.add('download-pulse');

    if (type === 'report') {
      // Handle report export
      const report = ReportRegistry.getReport(id);
      if (!report) {
        ACTION_SELECT.classList.remove('download-pulse');
        ACTION_SELECT.value = '';
        return;
      }

      const reportData = await report.generateReport(window.clusterManager);

      if (reportData.size > 0) {
        const csv = reportData.blob;
        const link = document.createElement('a');
        const data = getFormData(URL_FORM);
        const site = data['site-url']?.hostname;
        const url = URL.createObjectURL(csv);

        link.setAttribute('href', url);
        link.setAttribute('download', `${site ? `${site.replace('.', '_')}_` : ''}${report.name.toLowerCase().replace(' ', '_')}.csv`);
        link.style.display = 'none';
        ACTION_SELECT.insertAdjacentElement('afterend', link);

        setTimeout(() => {
          link.click();
          link.remove();
          ACTION_SELECT.classList.remove('download-pulse');
          ACTION_SELECT.value = '';
        }, 2000);
      } else {
        ACTION_SELECT.classList.remove('download-pulse');
        ACTION_SELECT.value = '';
      }
    } else if (type === 'action') {
      // Handle AEM export actions
      try {
        switch (id) {
          case AEM_ACTIONS.EXPORT_ASSETS:
            await exportToAEM(window.clusterManager, { exportAssets: true, exportMetadata: false });
            break;
          case AEM_ACTIONS.EXPORT_METADATA:
            await exportToAEM(window.clusterManager, { exportAssets: false, exportMetadata: true });
            break;
          case AEM_ACTIONS.EXPORT_BOTH:
            await exportToAEM(window.clusterManager, { exportAssets: true, exportMetadata: true });
            break;
          default:
            // eslint-disable-next-line no-console
            console.warn('Unknown action:', id);
        }
      } finally {
        ACTION_SELECT.classList.remove('download-pulse');
        ACTION_SELECT.value = '';
      }
    }
  });

  doc
    .getElementById('import-sitemap-form-button')
    .addEventListener('click', () => {
      const fileInput = document.getElementById('import-sitemap-form-file');
      fileInput.value = '';
      document.getElementById('import-sitemap-form-file').click();
    });

  doc
    .getElementById('import-sitemap-form-file')
    .addEventListener('change', (event) => {
      const file = event.target.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            // Assuming .smf is JSON formatted
            const jsonData = JSON.parse(e.target.result);

            // Populate form fields with imported data
            populateFormFromData(jsonData);
            const formData = getFormData(URL_FORM);
            saveFormData(formData['site-url'], formData);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('Error parsing imported .smf file:', error);
          }
        };

        reader.onerror = () => {
          // eslint-disable-next-line no-console
          console.warn('Error reading the file.');
        };

        reader.readAsText(file);
      }
    });

  doc
    .getElementById('export-sitemap-form-button')
    .addEventListener('click', () => {
    // Replace with your method to gather form data
      const formData = getFormData(URL_FORM);
      const json = JSON.stringify(formData);

      const jsonBlob = new Blob([json], {
        type: 'application/json',
      });
      const downloadUrl = URL.createObjectURL(jsonBlob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      const name = formData['site-url']?.hostname?.replace(/\./g, '-') || 'sitemap-form';
      a.download = `${name}.smf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

  const domainKeyInput = doc.getElementById('domain-key');

  domainKeyInput.addEventListener('focus', () => {
    domainKeyInput.type = 'text';
  });

  domainKeyInput.addEventListener('blur', () => {
    domainKeyInput.type = 'password';
  });
}

// AEM Export Actions
const AEM_ACTIONS = {
  EXPORT_ASSETS: 'export-assets-to-aem',
  EXPORT_METADATA: 'export-metadata-to-aem',
  EXPORT_BOTH: 'export-assets-and-metadata-to-aem',
};

// Storage key for AEM config
const AEM_CONFIG_STORAGE_KEY = 'aem-export-config';

/**
 * Loads saved AEM config from IndexedDB.
 * @returns {Promise<Object|null>} The saved config or null if not found
 */
async function loadAEMConfig() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(AEM_CONFIG_STORAGE_KEY);

    return new Promise((resolve) => {
      request.onsuccess = (e) => {
        const data = e.target.result;
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error loading AEM config:', error);
    return null;
  }
}

/**
 * Saves AEM config to IndexedDB.
 * @param {Object} config - The config to save (without accessToken for security)
 */
async function saveAEMConfig(config) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Don't save the access token for security
    const configToSave = {
      repositoryId: config.repositoryId,
      rootPath: config.rootPath,
    };

    const request = store.put(JSON.stringify(configToSave), AEM_CONFIG_STORAGE_KEY);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error saving AEM config:', error);
  }
}

/**
 * Shows a configuration modal for AEM export and returns the entered values.
 * @param {Object} options - Options to display in the modal
 * @param {boolean} options.exportAssets - Whether assets will be exported
 * @param {boolean} options.exportMetadata - Whether metadata will be exported
 * @returns {Promise<Object>} Resolves with { repositoryId, rootPath, accessToken } or rejects if cancelled
 */
async function showAEMConfigModal({ exportAssets, exportMetadata }) {
  // Load previously saved config
  const savedConfig = await loadAEMConfig();

  return new Promise((resolve, reject) => {
    const modalId = 'aem-config-modal';
    let modal = document.getElementById(modalId);

    // Remove existing modal if present
    if (modal) {
      modal.remove();
    }

    // Build new modal
    const [newModal, body] = buildModal();
    newModal.id = modalId;
    newModal.classList.add('aem-config-modal');
    modal = newModal;

    // Build the form content
    const form = document.createElement('form');
    form.className = 'aem-config-form';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Export to AEM';
    form.appendChild(title);

    // Description
    const desc = document.createElement('p');
    desc.className = 'aem-config-desc';
    const exportItems = [];
    if (exportAssets) exportItems.push('assets');
    if (exportMetadata) exportItems.push('metadata');
    desc.textContent = `Configure the AEM target to export ${exportItems.join(' and ')}.`;
    form.appendChild(desc);

    // Repository ID field - use saved value if available
    const repoGroup = document.createElement('div');
    repoGroup.className = 'form-group';
    const repoLabel = document.createElement('label');
    repoLabel.htmlFor = 'aem-repository-id';
    repoLabel.textContent = 'AEMaaCS Repository ID';
    const repoInput = document.createElement('input');
    repoInput.type = 'text';
    repoInput.id = 'aem-repository-id';
    repoInput.name = 'repositoryId';
    repoInput.value = savedConfig?.repositoryId || '';
    repoInput.placeholder = 'e.g., author-p12345-e67890';
    repoInput.required = true;
    repoGroup.appendChild(repoLabel);
    repoGroup.appendChild(repoInput);
    form.appendChild(repoGroup);

    // Root Path field - use saved value, or prepopulate with RUM domain if no saved value
    const rumDomain = document.getElementById('replacement-domain')?.value?.trim();
    const defaultRootPath = rumDomain ? `/content/dam/${rumDomain}` : '';

    const pathGroup = document.createElement('div');
    pathGroup.className = 'form-group';
    const pathLabel = document.createElement('label');
    pathLabel.htmlFor = 'aem-root-path';
    pathLabel.textContent = 'Root Path';
    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.id = 'aem-root-path';
    pathInput.name = 'rootPath';
    pathInput.value = savedConfig?.rootPath || defaultRootPath;
    pathInput.placeholder = 'e.g., /content/dam/my-project';
    pathInput.required = true;
    pathGroup.appendChild(pathLabel);
    pathGroup.appendChild(pathInput);
    form.appendChild(pathGroup);

    // Access Token field (password style) - never pre-filled for security
    const tokenGroup = document.createElement('div');
    tokenGroup.className = 'form-group';
    const tokenLabel = document.createElement('label');
    tokenLabel.htmlFor = 'aem-access-token';
    tokenLabel.textContent = 'AEM Access Token';
    const tokenInput = document.createElement('input');
    tokenInput.type = 'password';
    tokenInput.id = 'aem-access-token';
    tokenInput.name = 'accessToken';
    tokenInput.placeholder = 'Enter your access token';
    tokenInput.required = true;
    tokenGroup.appendChild(tokenLabel);
    tokenGroup.appendChild(tokenInput);
    form.appendChild(tokenGroup);

    // Buttons container
    const buttons = document.createElement('div');
    buttons.className = 'form-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'button secondary';
    cancelBtn.textContent = 'Cancel';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'button primary';
    submitBtn.textContent = 'Export';

    buttons.appendChild(cancelBtn);
    buttons.appendChild(submitBtn);
    form.appendChild(buttons);

    body.appendChild(form);

    // Handle cancel
    const handleCancel = () => {
      modal.close();
      modal.remove();
      reject(new Error('Export cancelled by user'));
    };

    cancelBtn.addEventListener('click', handleCancel);

    // Override the modal's close behavior
    modal.addEventListener('close', () => {
      reject(new Error('Export cancelled by user'));
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const config = {
        repositoryId: formData.get('repositoryId'),
        rootPath: formData.get('rootPath'),
        accessToken: formData.get('accessToken'),
      };

      // Save config for next time (without access token)
      await saveAEMConfig(config);

      modal.close();
      modal.remove();
      resolve(config);
    });

    document.body.appendChild(modal);
    modal.showModal();

    // Focus on the first empty required field
    if (!repoInput.value) {
      repoInput.focus();
    } else if (!pathInput.value) {
      pathInput.focus();
    } else {
      tokenInput.focus();
    }
  });
}

/**
 * Exports assets and/or metadata to AEM.
 * @param {ClusterManager} clusterManager - The cluster manager instance
 * @param {Object} options - Export options
 * @param {boolean} options.exportAssets - Whether to export assets
 * @param {boolean} options.exportMetadata - Whether to export metadata
 */
async function exportToAEM(clusterManager, { exportAssets = true, exportMetadata = true } = {}) {
  try {
    // Show config modal and get user input
    const config = await showAEMConfigModal({ exportAssets, exportMetadata });

    // eslint-disable-next-line no-console
    console.log('Export to AEM:', { exportAssets, exportMetadata, config });
    // eslint-disable-next-line no-console
    console.log('Clusters to export:', clusterManager.getAllClusters().length);

    // TODO: Implement actual AEM export functionality using config
    // eslint-disable-next-line no-alert
    alert(`Export to AEM\n\nRepository: ${config.repositoryId}\nRoot Path: ${config.rootPath}\nExport Assets: ${exportAssets}\nExport Metadata: ${exportMetadata}\nTotal clusters: ${clusterManager.getAllClusters().length}`);
  } catch (error) {
    // User cancelled - silently ignore
    // eslint-disable-next-line no-console
    console.log('Export cancelled:', error.message);
  }
}

function addActionsToDropdown(doc) {
  const dropdown = doc.getElementById('action-select');

  // Clear any existing options
  dropdown.innerHTML = '';

  // Add the default placeholder option
  const defaultOption = doc.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select an action to perform';
  dropdown.appendChild(defaultOption);

  // Group 1: Export Reports
  const reportsGroup = doc.createElement('optgroup');
  reportsGroup.label = 'Export Report';

  const reports = ReportRegistry.getReports();
  reports.forEach((report) => {
    const option = doc.createElement('option');
    option.value = `report:${report.id}`;
    option.textContent = report.uiName;
    reportsGroup.appendChild(option);
  });
  dropdown.appendChild(reportsGroup);

  // Group 2: Actions
  const actionsGroup = doc.createElement('optgroup');
  actionsGroup.label = 'Actions';

  const actions = [
    { id: AEM_ACTIONS.EXPORT_ASSETS, name: 'Export Assets to AEM' },
    { id: AEM_ACTIONS.EXPORT_METADATA, name: 'Export Metadata to AEM' },
    { id: AEM_ACTIONS.EXPORT_BOTH, name: 'Export Assets and Metadata to AEM' },
  ];

  actions.forEach((action) => {
    const option = doc.createElement('option');
    option.value = `action:${action.id}`;
    option.textContent = action.name;
    actionsGroup.appendChild(option);
  });
  dropdown.appendChild(actionsGroup);
}

function addIdentitySelectorsToForm(doc) {
  const identitySelectors = document.getElementById('identity-selectors');

  IdentityRegistry.registeredIdentityClasses.forEach((clazz) => {
    const {
      identity,
      display,
      checked,
      hidden,
    } = clazz.uiSelectorProperties;

    // Create a list item
    const li = doc.createElement('li');
    if (hidden) li.setAttribute('aria-hidden', true);

    // Create a label element
    const label = doc.createElement('label');
    label.setAttribute('for', `identity-${identity}`);
    label.textContent = display;

    // Create the checkbox input
    const checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `identity-${identity}`;
    checkbox.name = `identity-${identity}`;
    checkbox.value = identity;
    checkbox.checked = checked;

    // Append the checkbox and label to the list item
    li.appendChild(checkbox);
    li.appendChild(label);

    // Append the list item to the identitySelectors element
    identitySelectors.appendChild(li);
  });
}

setupWindowVariables();
registerListeners(document);
overrideCreateCanvas(document);
addIdentitySelectorsToForm(document);
addActionsToDropdown(document);

window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', event.reason);
  // Custom error handling here
});
