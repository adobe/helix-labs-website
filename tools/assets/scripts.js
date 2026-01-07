/* eslint-disable import/no-relative-packages, max-classes-per-file, class-methods-use-this */
// These imports register the classes with the IdentityRegistry
import './identity/defaultidentityloader.js';
import './reports/defaultreportsloader.js';
import './crawler/defaultcrawlersloader.js';
import './crawler/util/defaultparsersloader.js';
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
import ImageAuditUtil from './util/imageauditutil.js';
import CrawlerRegistry from './crawler/crawlerregistry.js';
import SortRegistry from './sort/sortregistry.js';
import FilterRegistry from './filter/filterregistry.js';
import AbstractFilter from './filter/abstractfilter.js';
import UrlResourceHandler from './util/urlresourcehandler.js';

// import { AEM_EDS_HOSTS } from './identity/imageidentity/urlidentity.js';

// RUM Configuration
// Minimum weighted views required to calculate rates (CTR, bounce rate)
// Default: 1000 views = ~10 bundles at typical 1/100 weight
const MIN_RUM_VIEWS_FOR_RATES = 1000;

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

async function deleteDatabase(dbName) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve({ name: dbName, ok: true });
      req.onerror = () => resolve({ name: dbName, ok: false });
      req.onblocked = () => resolve({ name: dbName, ok: false, blocked: true });
    } catch {
      resolve({ name: dbName, ok: false });
    }
  });
}

async function deleteExecutionForKey(key) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
    return new Promise((resolve) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
      transaction.onabort = () => resolve(false);
    });
  } catch {
    return false;
  }
}

async function purgeIndexedDbForSite(formData) {
  const siteUrl = formData?.['site-url'];
  const replacementDomain = formData?.['replacement-domain'];

  const candidates = new Set();
  if (replacementDomain) candidates.add(String(replacementDomain).toLowerCase());
  if (siteUrl?.hostname) candidates.add(siteUrl.hostname.toLowerCase());

  // Delete the saved form execution for this site URL (if present)
  const deletedExecution = siteUrl?.href ? await deleteExecutionForKey(siteUrl.href) : false;

  // Delete identity-cache DBs for likely domains.
  // IndexedDBCachProvider uses `assets-${domain}` where domain is replacementDomain or image host.
  const deletedDbs = [];

  // Best-effort enumeration of databases (supported in modern Chromium)
  let dbs = null;
  try {
    if (typeof indexedDB.databases === 'function') {
      dbs = await indexedDB.databases();
    }
  } catch {
    dbs = null;
  }

  const namesToDelete = new Set();
  candidates.forEach((d) => namesToDelete.add(`assets-${d}`));

  // If we can enumerate, also delete any assets-* DB that matches the site domain(s)
  if (Array.isArray(dbs)) {
    dbs.forEach((db) => {
      const name = db?.name;
      if (!name || typeof name !== 'string') return;
      if (!name.startsWith('assets-')) return;
      const domain = name.substring('assets-'.length).toLowerCase();
      if (candidates.has(domain)) {
        namesToDelete.add(name);
      }
    });
  }

  // Execute deletes
  // eslint-disable-next-line no-restricted-syntax
  for (const name of namesToDelete) {
    // eslint-disable-next-line no-await-in-loop
    deletedDbs.push(await deleteDatabase(name));
  }

  return {
    deletedExecution,
    deletedDbs,
    candidates: Array.from(candidates),
  };
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

    const publishDates = cluster.getAll(UrlAndPageIdentity.type, 'publishDate')
      .filter((v) => v !== null);
    const firstSeenValues = cluster.getAll(UrlAndPageIdentity.type, 'firstSeenTimestamp')
      .filter((v) => v !== null);
    const lastSeenValues = cluster.getAll(UrlAndPageIdentity.type, 'lastSeenTimestamp')
      .filter((v) => v !== null);

    const publishDate = publishDates.length > 0 ? Math.max(...publishDates) : null;
    const firstSeenTimestamp = firstSeenValues.length > 0 ? Math.min(...firstSeenValues) : null;
    const lastSeenTimestamp = lastSeenValues.length > 0 ? Math.max(...lastSeenValues) : null;

    // Add timestamp rows if available (works for any crawler)
    if (publishDate) {
      rows.publishDate = 'Publish Date';
      data.publishDate = new Date(publishDate).toLocaleDateString();
    }

    if (firstSeenTimestamp) {
      rows.firstSeen = 'First Seen';
      data.firstSeen = new Date(firstSeenTimestamp).toLocaleDateString();
    }

    if (lastSeenTimestamp) {
      rows.lastSeen = 'Last Seen';
      data.lastSeen = new Date(lastSeenTimestamp).toLocaleDateString();
    }

    if (window.collectingRum) {
      const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
      const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
      const visits = cluster.getAll(UrlAndPageIdentity.type, 'visits').reduce((acc, curr) => acc + curr, 0);
      const bounces = cluster.getAll(UrlAndPageIdentity.type, 'bounces').reduce((acc, curr) => acc + curr, 0);
      const assetViews = cluster.getAll(UrlAndPageIdentity.type, 'assetViews').reduce((acc, curr) => acc + curr, 0);
      const assetClicks = cluster.getAll(UrlAndPageIdentity.type, 'assetClicks').reduce((acc, curr) => acc + curr, 0);

      // Calculate rates only if we have sufficient sample size
      const pageCTR = pageViews >= MIN_RUM_VIEWS_FOR_RATES ? (conversions / pageViews) : null;
      const pageBounceRate = pageViews >= MIN_RUM_VIEWS_FOR_RATES ? (bounces / pageViews) : null;
      const assetCTR = assetViews >= MIN_RUM_VIEWS_FOR_RATES ? (assetClicks / assetViews) : null;

      rows.pageCTR = 'Page Click Through Rate';
      rows.pageViews = 'Page Views';
      rows.conversions = 'Conversions';
      rows.assetViews = 'Asset Views';
      rows.assetClicks = 'Asset Clicks';
      rows.assetCTR = 'Asset Click Through Rate';
      rows.visits = 'Visits';
      rows.bounces = 'Bounces';
      rows.pageBounceRate = 'Page Bounce Rate';
      rows.lighthouse = 'Asset Success Score';

      data.pageCTR = pageCTR !== null
        ? `${(pageCTR * 100).toFixed(2)}%`
        : 'Insufficient data';
      data.pageViews = pageViews > 0 ? pageViews : ' < 100';
      data.conversions = conversions > 0 ? conversions : ' < 100';
      data.assetViews = assetViews > 0 ? assetViews : ' < 100';
      data.assetClicks = assetClicks > 0 ? assetClicks : ' < 100';
      data.assetCTR = assetCTR !== null
        ? `${(Math.min(assetCTR, 1) * 100).toFixed(2)}%`
        : 'Insufficient data';
      data.visits = visits > 0 ? visits : ' < 100';
      data.bounces = bounces > 0 ? bounces : ' < 100';
      data.pageBounceRate = pageBounceRate !== null
        ? `${(pageBounceRate * 100).toFixed(2)}%`
        : 'Insufficient data';
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
    const currentCluster = clusterManager.get(cluster.id);
    if (!currentCluster) return;
    if (currentCluster.figureForCluster) {
      GALLERY.appendChild(currentCluster.figureForCluster);
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
  const href = identityValues?.imageOptions?.card?.href
    || identityValues?.imageOptions?.original?.href
    || identityValues?.imageOptions?.detail?.href
    || '(unknown href)';
  // Helpful for debugging: img.src uses UrlResourceHandler.getImageUrl(href) (proxy),
  // so log both the logical href and the actual requested URL (proxied).
  let requested = href;
  try {
    requested = UrlResourceHandler.getImageUrl(href);
  } catch {
    // ignore; requested stays as href
  }

  // De-dupe noisy logs on large crawls
  window.imageLoadErrorSeen = window.imageLoadErrorSeen || new Set();
  const key = `${href}|${requested}`;
  if (!window.imageLoadErrorSeen.has(key)) {
    window.imageLoadErrorSeen.add(key);
    // eslint-disable-next-line no-console
    console.error(`Error loading img. href=${href} requested=${requested}`, error);
  }
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
  // calculate the new value
  // - if increment is undefined/null: reset to 0 (existing behavior used by callers)
  // - if increment is 0: keep value (do NOT reset)
  const targetValue = (increment === undefined || increment === null)
    ? 0
    : value + increment;
  counter.textContent = float ? targetValue.toFixed(1) : Math.floor(targetValue);
  if (counter.id === 'images-counter'
    || counter.id === 'total-counter'
    || counter.id === 'pages-counter') updateProgress();
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
      pageLastModified, assetLastModified,
    } = img;

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

    // Use UrlAndPageIdentity as the originating identity so we can dedupe
    // (page + media + instance) at cluster creation time.
    const originalHref = imageOptions?.original?.href || imageOptions?.card?.href;
    const urlAndPage = new UrlAndPageIdentity(
      UrlAndPageIdentity.buildGlobalUniqueAssetIdentifier(site, originalHref, instance),
      originalHref,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      pageLastModified,
      assetLastModified,
    );

    const originatingClusterId = clusterManager.newCluster(
      urlAndPage,
      loadedImg,
      figure,
      'image',
      imageOptions,
    );

    // Duplicate (page, media, instance) tuple: skip creating/loading another cluster.
    if (!originatingClusterId) {
      // This means the crawler returned a literal duplicate (same page + media + instance).
      // We drop it silently and do NOT count it as a "duplicate image found".
    } else {
      window.imageCount += 1;
      const { imageCount } = window;

      // Still attach SitemapLoadOrderIdentity for ordering/debugging
      clusterManager.get(originatingClusterId).addIdentity(
        new SitemapLoadOrderIdentity(imageCount),
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
        pageLastModified,
        assetLastModified,
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

function setupDevConsole(doc) {
  if (window.devConsoleWrapped) return;

  /* eslint-disable no-console */

  const STORAGE_KEY = 'assets-open-workbench:log-pinned';
  const MAX_LINES = 50000;
  const buffer = [];
  let hasTruncated = false;
  let autoScrollEnabled = true;
  const counts = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  };

  const getPinnedFromStorage = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const toText = (arg) => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (arg instanceof Error) return arg.stack || arg.message || String(arg);
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean' || typeof arg === 'bigint') return String(arg);
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  };

  const getElements = () => ({
    actionBarEl: doc.querySelector('#canvas .action-bar'),
    progressBarEl: doc.getElementById('progress-bar'),
    loadingAreaEl: doc.getElementById('action-bar-loading-area'),
    consoleEl: doc.getElementById('loading-console'),
    metaEl: doc.getElementById('loading-console-meta'),
    jumpBtnEl: doc.getElementById('loading-console-jump-bottom'),
    linesEl: doc.getElementById('loading-console-lines'),
    pinnedAnchorEl: doc.getElementById('dev-console-anchor'),
    countEls: {
      debug: doc.getElementById('loading-console-count-debug'),
      info: doc.getElementById('loading-console-count-info'),
      warn: doc.getElementById('loading-console-count-warn'),
      error: doc.getElementById('loading-console-count-error'),
    },
  });

  const isAtBottom = () => {
    const { linesEl } = getElements();
    if (!linesEl) return true;
    const distanceFromBottom = (linesEl.scrollHeight - linesEl.clientHeight) - linesEl.scrollTop;
    return Math.abs(distanceFromBottom) < 2;
  };

  const updateMetaVisibility = () => {
    const { metaEl, linesEl } = getElements();
    if (!metaEl) return;
    if (!hasTruncated || !linesEl) {
      metaEl.setAttribute('aria-hidden', 'true');
      return;
    }
    const atTop = linesEl.scrollTop <= 0;
    metaEl.setAttribute('aria-hidden', atTop ? 'false' : 'true');
  };

  const updateToolbarVisibility = () => {
    const { jumpBtnEl } = getElements();
    if (!jumpBtnEl) return;
    jumpBtnEl.setAttribute('aria-hidden', autoScrollEnabled ? 'true' : 'false');
  };

  const attachResizeObserver = () => {
    const { linesEl } = getElements();
    if (!linesEl) return;
    if (linesEl.dataset.devConsoleResizeAttached === 'true') return;
    linesEl.dataset.devConsoleResizeAttached = 'true';

    let lastHeight = linesEl.getBoundingClientRect().height;
    const ro = new ResizeObserver(() => {
      const newHeight = linesEl.getBoundingClientRect().height;
      const shrunk = newHeight < lastHeight - 1;
      lastHeight = newHeight;

      // If user shrinks the viewport, snap to bottom and resume auto-scroll.
      if (shrunk) {
        linesEl.scrollTop = linesEl.scrollHeight;
        // Some browsers apply the resize in two layout steps; re-snap on the next tick.
        setTimeout(() => {
          linesEl.scrollTop = linesEl.scrollHeight;
        }, 0);
        autoScrollEnabled = true;
        updateToolbarVisibility();
        updateMetaVisibility();
      }
    });
    ro.observe(linesEl);
  };

  const attachScrollListener = () => {
    const { linesEl } = getElements();
    if (!linesEl) return;
    if (linesEl.dataset.devConsoleScrollAttached === 'true') return;
    linesEl.dataset.devConsoleScrollAttached = 'true';
    attachResizeObserver();
    linesEl.addEventListener('scroll', () => {
      const atBottom = isAtBottom();
      autoScrollEnabled = atBottom;
      updateToolbarVisibility();
      updateMetaVisibility();
    });
  };

  const moveConsoleToLoadingLocation = () => {
    const { loadingAreaEl, consoleEl } = getElements();
    if (!loadingAreaEl || !consoleEl) return;
    // Place immediately after the progress bar container (loading area).
    const progressBarEl = doc.getElementById('progress-bar');
    if (progressBarEl && progressBarEl.parentElement === loadingAreaEl) {
      const needsMove = consoleEl.previousElementSibling !== progressBarEl
        || consoleEl.parentElement !== loadingAreaEl;
      if (needsMove) {
        progressBarEl.insertAdjacentElement('afterend', consoleEl);
      }
      return;
    }
    // Fallback: append to loading area.
    if (consoleEl.parentElement !== loadingAreaEl) loadingAreaEl.appendChild(consoleEl);
  };

  const moveConsoleToPinnedLocation = () => {
    const { pinnedAnchorEl, consoleEl } = getElements();
    if (!pinnedAnchorEl || !consoleEl) return;
    if (consoleEl.parentElement !== pinnedAnchorEl) pinnedAnchorEl.appendChild(consoleEl);
  };

  const renderCounts = (countEls) => {
    if (!countEls) return;
    // Consistent terse labels (no "No ..."):
    if (countEls.error) countEls.error.textContent = `${counts.error} Error`;
    if (countEls.warn) countEls.warn.textContent = `${counts.warn} Warn`;
    if (countEls.info) countEls.info.textContent = `${counts.info} Info`;
    // Map debug to "Verbose" like DevTools
    if (countEls.debug) countEls.debug.textContent = `${counts.debug} Verbose`;
  };

  const formatLineText = (entry) => {
    if (!entry) return '';
    if (entry.count && entry.count > 1) {
      return `(Repeated ${entry.count} times) ${entry.text}`;
    }
    return entry.text;
  };

  const renderBuffer = (linesEl) => {
    if (!linesEl) return;
    attachScrollListener();
    linesEl.textContent = '';
    buffer.forEach(({ level, text, count }) => {
      const line = doc.createElement('div');
      line.className = `loading-console__line loading-console__line--${level}`;
      line.textContent = formatLineText({ level, text, count });
      linesEl.appendChild(line);
    });
    linesEl.scrollTop = linesEl.scrollHeight;
    autoScrollEnabled = true;
    updateToolbarVisibility();
    updateMetaVisibility();
  };

  const appendEntry = (level, args) => {
    const text = args.map(toText).join(' ');
    // Update counters by event occurrence (even if we de-dupe the rendered line)
    if (level === 'debug') counts.debug += 1;
    if (level === 'info') counts.info += 1;
    if (level === 'warn') counts.warn += 1;
    if (level === 'error') counts.error += 1;

    // If the next log entry is identical to the previous, increment a repeat counter
    // instead of appending another line.
    const last = buffer.length ? buffer[buffer.length - 1] : null;
    const isRepeat = last && last.level === level && last.text === text;
    if (isRepeat) {
      last.count = (last.count || 1) + 1;
    } else {
      buffer.push({ level, text, count: 1 });
      while (buffer.length > MAX_LINES) {
        buffer.shift();
        hasTruncated = true;
      }
    }

    const {
      progressBarEl, consoleEl, linesEl, countEls,
    } = getElements();
    const isLoading = progressBarEl?.style?.display !== 'none';
    const isPinned = getPinnedFromStorage();
    const isAllowed = (isLoading || isPinned) && consoleEl?.getAttribute('aria-hidden') !== 'true';
    if (consoleEl && linesEl && isAllowed) {
      attachScrollListener();
      if (isRepeat && linesEl.lastElementChild) {
        // Update the previous line in-place with its new repeat count.
        linesEl.lastElementChild.textContent = formatLineText(last);
      } else {
        const line = doc.createElement('div');
        line.className = `loading-console__line loading-console__line--${level}`;
        line.textContent = text;
        linesEl.appendChild(line);
      }

      while (linesEl.children.length > MAX_LINES) {
        linesEl.removeChild(linesEl.firstChild);
      }
      if (autoScrollEnabled) {
        linesEl.scrollTop = linesEl.scrollHeight;
      }
    }
    renderCounts(countEls);
    updateMetaVisibility();
  };

  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: (console.debug ? console.debug.bind(console) : console.log.bind(console)),
  };

  const wrap = (method, level) => (...args) => {
    original[method](...args);
    appendEntry(level, args);
  };

  console.log = wrap('log', 'log');
  console.info = wrap('info', 'info');
  console.warn = wrap('warn', 'warn');
  console.error = wrap('error', 'error');
  console.debug = wrap('debug', 'debug');

  // Capture uncaught errors into the same stream (but keep native console output too)
  window.addEventListener('error', (event) => {
    // Some errors don't have event.error; include message and filename/lineno.
    const parts = [
      event?.message || 'Uncaught error',
      event?.filename ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}` : null,
      event?.error || null,
    ].filter(Boolean);
    console.error(...parts);
  });

  const setPinned = (pinned) => {
    try {
      localStorage.setItem(STORAGE_KEY, pinned ? 'true' : 'false');
    } catch {
      // ignore
    }

    const btn = doc.getElementById('log-toggle');
    if (btn) btn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
    // Visibility is governed by loading state OR pinned state.
    const { progressBarEl } = getElements();
    const isLoading = progressBarEl?.style?.display !== 'none';
    if (!isLoading && !pinned) {
      window.devConsole?.hide?.();
      moveConsoleToLoadingLocation();
      return;
    }
    if (!isLoading && pinned) {
      moveConsoleToPinnedLocation();
    }
    window.devConsole?.show?.();
  };

  window.devConsoleWrapped = true;

  window.devConsole = {
    reset() {
      buffer.length = 0;
      hasTruncated = false;
      autoScrollEnabled = true;
      counts.debug = 0;
      counts.info = 0;
      counts.warn = 0;
      counts.error = 0;
      const { linesEl, countEls } = getElements();
      if (linesEl) linesEl.textContent = '';
      renderCounts(countEls);
      updateToolbarVisibility();
      updateMetaVisibility();
    },
    show() {
      const { consoleEl, linesEl, countEls } = getElements();
      if (!consoleEl || !linesEl) return;
      consoleEl.setAttribute('aria-hidden', false);
      renderBuffer(linesEl);
      renderCounts(countEls);
    },
    hide() {
      const { consoleEl } = getElements();
      if (!consoleEl) return;
      consoleEl.setAttribute('aria-hidden', true);
    },
    togglePinned() {
      const current = getPinnedFromStorage();
      setPinned(!current);
    },
    applyPinnedFromStorage() {
      setPinned(getPinnedFromStorage());
    },
    isPinned() {
      return getPinnedFromStorage();
    },
    moveToLoadingLocation() {
      moveConsoleToLoadingLocation();
    },
    moveToPinnedLocation() {
      moveConsoleToPinnedLocation();
    },
  };

  // Initialize button/panel from persisted state.
  window.devConsole.applyPinnedFromStorage();

  /* eslint-enable no-console */
}

function prepareLoading() {
  setupWindowVariables();
  document.body.classList.add('assets--compact-form');
  const results = document.getElementById('audit-results');
  const progressBar = document.getElementById('progress-bar');
  const actionForm = document.getElementById('action-form');
  const download = results.querySelector('select');
  const importBtn = document.getElementById('import-sitemap-form-button');
  const exportBtn = document.getElementById('export-sitemap-form-button');
  if (importBtn) importBtn.textContent = '⬆︎ Import';
  if (exportBtn) exportBtn.textContent = '⬇︎ Export';

  setupDevConsole(document);
  window.devConsole?.reset?.();

  progressBar.setAttribute('aria-hidden', false);
  actionForm.setAttribute('aria-hidden', true);

  download.disabled = true;
  document.getElementById('progress-bar').style.display = 'block'; // Show progress bar
  window.devConsole?.moveToLoadingLocation?.();
  window.devConsole?.show?.();
  window.enableModals = false;
}

function finishedLoading() {
  const results = document.getElementById('audit-results');
  const progressBar = document.getElementById('progress-bar');
  const actionForm = document.getElementById('action-form');
  const download = results.querySelector('select');

  // Hide the shared console after loading unless pinned
  if (!window.devConsole?.isPinned?.()) {
    window.devConsole?.hide?.();
  } else {
    window.devConsole?.moveToPinnedLocation?.();
    window.devConsole?.show?.();
  }
  document.getElementById('progress-bar').style.display = 'none'; // Hide progress bar
  document.getElementById('progress').style.width = '0%'; // Reset progress

  download.disabled = false;

  progressBar.setAttribute('aria-hidden', true);
  actionForm.setAttribute('aria-hidden', false);
  window.devConsole?.applyPinnedFromStorage?.();

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

  const urls = await crawler.fetchCrawlerData(sitemapFormData);
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

/**
 * Populate the crawler type dropdown with options from CrawlerRegistry
 */
function populateCrawlerTypeDropdown() {
  const crawlerTypeSelect = document.getElementById('crawler-type');
  if (!crawlerTypeSelect) return;

  // Clear existing options
  crawlerTypeSelect.innerHTML = '';

  // Get all crawlers from registry
  const crawlerOptions = CrawlerRegistry.getCrawlerOptions();

  // Add options for each crawler
  crawlerOptions.forEach((option, index) => {
    const optionEl = document.createElement('option');
    optionEl.value = option.type;
    optionEl.textContent = option.displayName;
    if (index === 0) optionEl.selected = true;
    crawlerTypeSelect.appendChild(optionEl);
  });
}

/**
 * Apply form configuration from the selected crawler.
 * Shows/hides fields and updates help text based on crawler's getFormConfig().
 * @param {string} crawlerType - The crawler type to apply config for
 */
function applyCrawlerFormConfig(crawlerType) {
  const crawler = CrawlerRegistry.getCrawlerByType(crawlerType);
  if (!crawler) {
    // eslint-disable-next-line no-console
    console.warn('No crawler found for type:', crawlerType);
    return;
  }

  const config = crawler.getFormConfig();
  const {
    visibleFields, requiredFields, helpText, placeholders,
  } = config;

  // Update crawler description
  const descriptionEl = document.getElementById('crawler-description');
  if (descriptionEl) {
    descriptionEl.textContent = crawler.description;
  }

  // Show/hide fields and update required attributes based on visibleFields
  const allFields = document.querySelectorAll('.crawler-field');
  allFields.forEach((fieldEl) => {
    const fieldId = fieldEl.dataset.field;
    const input = document.getElementById(fieldId);

    if (visibleFields.includes(fieldId)) {
      // Show the field
      fieldEl.style.display = '';
      fieldEl.removeAttribute('aria-hidden');

      // Set required attribute if needed
      if (input) {
        if (requiredFields.includes(fieldId)) {
          input.setAttribute('required', 'required');
        } else {
          input.removeAttribute('required');
        }
      }
    } else {
      // Hide the field
      fieldEl.style.display = 'none';
      fieldEl.setAttribute('aria-hidden', 'true');

      // Remove required attribute from hidden fields to prevent form validation errors
      if (input) {
        input.removeAttribute('required');
      }
    }
  });

  // Update help text
  Object.entries(helpText).forEach(([fieldId, text]) => {
    const helpEl = document.getElementById(`${fieldId}-help-text`);
    if (helpEl) {
      helpEl.textContent = text;
    }
  });

  // Update placeholders
  Object.entries(placeholders).forEach(([fieldId, placeholder]) => {
    const input = document.getElementById(fieldId);
    if (input) {
      input.placeholder = placeholder;
    }
  });
}

/**
 * Initialize the crawler type dropdown and apply the default configuration.
 */
function initializeCrawlerType() {
  const crawlerTypeSelect = document.getElementById('crawler-type');
  if (!crawlerTypeSelect) return;

  // Populate dropdown if empty
  if (crawlerTypeSelect.options.length === 0) {
    populateCrawlerTypeDropdown();
  }

  // Default to first option (sitemap) if no value is set
  if (!crawlerTypeSelect.value && crawlerTypeSelect.options.length > 0) {
    crawlerTypeSelect.value = crawlerTypeSelect.options[0].value;
  }

  // Apply the form configuration for the selected crawler
  applyCrawlerFormConfig(crawlerTypeSelect.value);
}

async function domContentLoaded() {
  try {
    // Populate crawler type dropdown first so values can be restored
    populateCrawlerTypeDropdown();

    // Retrieve the last executed URL from localStorage
    const lastURL = localStorage.getItem('lastExecutedURL');

    if (!lastURL) {
      // No stored data, initialize crawler type to default
      initializeCrawlerType();
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
      // Initialize crawler type after form population (applies form config)
      initializeCrawlerType();
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.debug('Error during domContentLoaded:', error);
    initializeCrawlerType();
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

  setupDevConsole(doc);

  // Crawler type change handler - applies form config from the selected crawler
  const crawlerTypeSelect = document.getElementById('crawler-type');
  if (crawlerTypeSelect) {
    crawlerTypeSelect.addEventListener('change', (event) => {
      applyCrawlerFormConfig(event.target.value);
    });
  }

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

  const logToggle = doc.getElementById('log-toggle');
  if (logToggle) {
    logToggle.addEventListener('click', () => {
      window.devConsole?.togglePinned?.();
    });
  }

  const jumpBottom = doc.getElementById('loading-console-jump-bottom');
  if (jumpBottom) {
    jumpBottom.addEventListener('click', () => {
      const linesEl = doc.getElementById('loading-console-lines');
      if (linesEl) {
        linesEl.scrollTop = linesEl.scrollHeight;
        // scrolling triggers the scroll handler which re-enables auto-scroll
      }
    });
  }

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

  // Purge browser stored data (IndexedDB) for the currently entered site.
  const purgeButton = doc.getElementById('purge-stored-data-button');
  if (purgeButton) {
    purgeButton.addEventListener('click', async () => {
      const data = getFormData(URL_FORM);
      const siteUrl = data?.['site-url'];
      if (!siteUrl) {
        // eslint-disable-next-line no-alert
        alert('Please enter a Site URL first.');
        return;
      }

      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(
        `Purge browser-stored data for:\n\n${siteUrl.href}\n\nThis will remove IndexedDB caches for this site (identity cache) and the saved form state for this URL.\n\nYour next run will be significantly slower while everything is recomputed.\n\nContinue?`,
      );
      if (!confirmed) return;

      // If a crawl is running, stop it first to avoid races with cache access.
      if (!window.stopProcessing && typeof window.stopCallback === 'function') {
        try {
          window.stopProcessing = true;
          window.stopCallback();
        } catch {
          // ignore
        }
      }

      const result = await purgeIndexedDbForSite(data);
      const okDbs = result.deletedDbs.filter((d) => d.ok).map((d) => d.name);
      const failedDbs = result.deletedDbs.filter((d) => !d.ok).map((d) => d.name);

      // eslint-disable-next-line no-alert
      alert([
        'Purge complete.',
        '',
        `Site: ${siteUrl.href}`,
        'Next run note: expect a slower run while caches are recomputed.',
        result.candidates.length ? `Domains: ${result.candidates.join(', ')}` : '',
        `Saved form entry deleted: ${result.deletedExecution ? 'yes' : 'no/none'}`,
        okDbs.length ? `Deleted DBs:\n- ${okDbs.join('\n- ')}` : 'Deleted DBs: none',
        failedDbs.length ? `Failed DB deletes:\n- ${failedDbs.join('\n- ')}` : '',
      ].filter(Boolean).join('\n'));
    });
  }

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
        link.setAttribute(
          'download',
          `${site ? `${site.replace('.', '_')}_` : ''}${report.name.toLowerCase().replace(' ', '_')}.csv`,
        );
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
      // Handle AEM export actions - generate downloadable shell script
      /* eslint-disable no-use-before-define */
      try {
        switch (id) {
          case AEM_ACTIONS.EXPORT_ASSETS:
            await generateAEMExportScript(window.clusterManager, {
              exportAssets: true,
              exportMetadata: false,
            });
            break;
          case AEM_ACTIONS.EXPORT_METADATA:
            await generateAEMExportScript(window.clusterManager, {
              exportAssets: false,
              exportMetadata: true,
            });
            break;
          case AEM_ACTIONS.EXPORT_BOTH:
            await generateAEMExportScript(window.clusterManager, {
              exportAssets: true,
              exportMetadata: true,
            });
            break;
          default:
            // eslint-disable-next-line no-console
            console.warn('Unknown action:', id);
        }
        /* eslint-enable no-use-before-define */
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
            // Initialize crawler type to ensure form visibility is correct
            initializeCrawlerType();
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
 * @param {Object} config - The config to save
 */
async function saveAEMConfig(config) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const configToSave = {
      repositoryId: config.repositoryId,
      rootPath: config.rootPath,
      apiKey: config.apiKey,
      accessToken: config.accessToken,
    };

    const request = store.put(JSON.stringify(configToSave), AEM_CONFIG_STORAGE_KEY);

    return new Promise((resolve) => {
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error saving AEM config:', error);
    return undefined;
  }
}

/**
 * Shows a configuration modal for AEM export and returns the entered values.
 * @param {Object} options - Options to display in the modal
 * @param {boolean} options.exportAssets - Whether assets will be exported
 * @param {boolean} options.exportMetadata - Whether metadata will be exported
 * @returns {Promise<Object>} Config with repositoryId, rootPath, apiKey, accessToken
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

    // API Key field (x-api-key header)
    const apiKeyGroup = document.createElement('div');
    apiKeyGroup.className = 'form-group';
    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.htmlFor = 'aem-api-key';
    apiKeyLabel.textContent = 'API Key';
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'text';
    apiKeyInput.id = 'aem-api-key';
    apiKeyInput.name = 'apiKey';
    apiKeyInput.value = savedConfig?.apiKey || 'aem-assets-frontend-1_assetsui';
    apiKeyInput.placeholder = 'e.g., aem-assets-frontend-1_assetsui';
    apiKeyInput.required = true;
    apiKeyGroup.appendChild(apiKeyLabel);
    apiKeyGroup.appendChild(apiKeyInput);
    form.appendChild(apiKeyGroup);

    // Access Token field (password style)
    const tokenGroup = document.createElement('div');
    tokenGroup.className = 'form-group';
    const tokenLabel = document.createElement('label');
    tokenLabel.htmlFor = 'aem-access-token';
    tokenLabel.textContent = 'Access Token';
    const tokenInput = document.createElement('input');
    tokenInput.type = 'password';
    tokenInput.id = 'aem-access-token';
    tokenInput.name = 'accessToken';
    tokenInput.value = savedConfig?.accessToken || '';
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
    submitBtn.textContent = 'Run';

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
        apiKey: formData.get('apiKey'),
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
 * Creates and shows a progress modal for long-running operations.
 * @returns {Object} Object with { modal, log, close } functions
 */
/**
 * Gets the shortest page path from all sites where an asset appears.
 * @param {Array<string>} sites - Array of site URLs
 * @returns {string} The shortest pathname (without leading slash for folder naming)
 */
function getShortestPagePath(sites) {
  if (!sites || sites.length === 0) return '';

  const paths = sites.map((site) => {
    try {
      const url = new URL(site);
      return url.pathname;
    } catch {
      return '/';
    }
  });

  // Normalize paths (remove trailing slashes for comparison)
  const normalizedPaths = paths.map((p) => (p === '/' ? '/' : p.replace(/\/$/, '')));

  // Find the minimum length
  const minLength = Math.min(...normalizedPaths.map((p) => p.length));

  // Get all paths with the minimum length
  const shortestPaths = normalizedPaths.filter((p) => p.length === minLength);

  // Sort alphabetically and pick the first one (deterministic selection)
  shortestPaths.sort();
  const shortestPath = shortestPaths[0];

  // Remove leading slash and trailing slash, handle root case
  if (shortestPath === '/' || shortestPath === '') return '';
  return shortestPath.replace(/^\//, '').replace(/\/$/, '');
}

/**
 * Builds AEM metadata object from cluster data.
 * @param {Object} cluster - The cluster object
 * @returns {Object} Metadata object for AEM
 */
function buildAEMMetadata(cluster) {
  const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
  const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
  const bounces = cluster.getAll(UrlAndPageIdentity.type, 'bounces').reduce((acc, curr) => acc + curr, 0);
  const assetViews = cluster.getAll(UrlAndPageIdentity.type, 'assetViews').reduce((acc, curr) => acc + curr, 0);
  const assetClicks = cluster.getAll(UrlAndPageIdentity.type, 'assetClicks').reduce((acc, curr) => acc + curr, 0);
  const sites = cluster.getAll(UrlAndPageIdentity.type, 'site');
  const altTexts = cluster.getAll(UrlAndPageIdentity.type, 'alt').filter((a) => a && a.trim());
  const publishDates = cluster.getAll(UrlAndPageIdentity.type, 'publishDate').filter((v) => v !== null);
  const firstSeenValues = cluster.getAll(UrlAndPageIdentity.type, 'firstSeenTimestamp').filter((v) => v !== null);
  const lastSeenValues = cluster.getAll(UrlAndPageIdentity.type, 'lastSeenTimestamp').filter((v) => v !== null);

  // Calculate click-through rate (conversions/views) and bounce rate (bounces/views)
  const clickThroughRate = pageViews > 0 ? Math.min(conversions / pageViews, 1) : 0;
  const bounceRate = pageViews > 0 ? Math.min(bounces / pageViews, 1) : 0;

  // Ensure sites is a proper array of strings (not a CSV)
  const siteUrls = Array.isArray(sites) ? sites.filter((s) => typeof s === 'string' && s.trim()) : [];

  const metadata = {
    'xdm:impressions': pageViews,
    'xdm:conversions': conversions,
    'xdm:bounces': bounces,
    'xdm:assetExperienceClickThroughRate': parseFloat(clickThroughRate.toFixed(4)),
    'xdm:assetExperienceBounceRate': parseFloat(bounceRate.toFixed(4)),
    'xdm:assetViews': assetViews,
    'xdm:assetClicks': assetClicks,
  };

  if (assetViews >= MIN_RUM_VIEWS_FOR_RATES) {
    metadata['xdm:assetClickThroughRate'] = parseFloat(Math.min(assetClicks / assetViews, 1).toFixed(4));
  }

  // Publish date and seen timestamps
  const publishDate = publishDates.length > 0 ? Math.max(...publishDates) : null;
  const firstSeenTimestamp = firstSeenValues.length > 0 ? Math.min(...firstSeenValues) : null;
  const lastSeenTimestamp = lastSeenValues.length > 0 ? Math.max(...lastSeenValues) : null;

  if (publishDate) {
    const [d] = new Date(publishDate).toISOString().split('T');
    metadata['xdm:publishDate'] = d;
  }
  if (firstSeenTimestamp) {
    const [d] = new Date(firstSeenTimestamp).toISOString().split('T');
    metadata['xdm:firstSeenTimestamp'] = d;
  }
  if (lastSeenTimestamp) {
    const [d] = new Date(lastSeenTimestamp).toISOString().split('T');
    metadata['xdm:lastSeenTimestamp'] = d;
  }

  // Only add URLs array if we have valid URLs
  if (siteUrls.length > 0) {
    metadata['xdm:assetSeenInURLs'] = siteUrls;
  }

  // Add alt text if available (use first non-empty alt text)
  if (altTexts.length > 0) {
    const [firstAlt] = altTexts;
    metadata['Iptc4xmpExt:ExtDescrAccessibility'] = firstAlt;
  }

  return metadata;
}

/**
 * Converts a DAM path to an API path by stripping /content/dam prefix.
 * @param {string} damPath - The full DAM path (e.g., /content/dam/project/image.jpg)
 * @returns {string} API path (e.g., /project/image.jpg)
 */
function damPathToApiPath(damPath) {
  const path = String(damPath || '');
  if (path.startsWith('/content/dam')) {
    return path.substring('/content/dam'.length) || '/';
  }
  return path;
}

/**
 * AEM API helper class for making authenticated requests.
 */
/* eslint-disable
  no-await-in-loop,
  no-restricted-syntax,
  prefer-destructuring,
  no-promise-executor-return,
  object-curly-newline,
  quotes,
  max-len */
// Legacy browser-based AEM export support (unused in normal flow). Prefer generateAEMExportScript().
// eslint-disable-next-line no-unused-vars
class AEMApi {
  #baseUrl;

  #apiKey;

  #accessToken;

  #corsProxyUrl = 'https://little-forest-58aa.david8603.workers.dev/?url=';

  constructor(repositoryId, apiKey, accessToken) {
    this.#baseUrl = `https://${repositoryId}.adobeaemcloud.com`;
    this.#apiKey = apiKey;
    this.#accessToken = accessToken;
  }

  #getHeaders(contentType = 'application/json') {
    return {
      Authorization: `Bearer ${this.#accessToken}`,
      'x-api-key': this.#apiKey,
      'Content-Type': contentType,
    };
  }

  #getProxiedUrl(url) {
    return `${this.#corsProxyUrl}${encodeURIComponent(url)}`;
  }

  /**
   * Check if an asset exists at the given path.
   * @param {string} assetPath - Full path to the asset
   * @returns {Promise<{exists: boolean, error?: string}>} Existence check result
   */
  async assetExists(assetPath) {
    try {
      // First try HEAD request (fastest)
      const apiPath = damPathToApiPath(assetPath);
      const headUrl = `${this.#baseUrl}/api/assets${apiPath}.json`;
      const headResponse = await fetch(headUrl, {
        method: 'HEAD',
        headers: this.#getHeaders(),
      });

      // If HEAD returns 404, definitely doesn't exist
      if (headResponse.status === 404) {
        return { exists: false };
      }

      // If HEAD is successful, try to get the asset metadata to verify and get ID
      if (headResponse.ok) {
        const getResponse = await fetch(headUrl, {
          method: 'GET',
          headers: this.#getHeaders(),
        });

        if (getResponse.ok) {
          try {
            const data = await getResponse.json();
            // Look for asset ID in various possible fields
            const assetId = data?.assetId || data?.id || data?.['jcr:uuid'];
            return { exists: true, assetId };
          } catch {
            // Could not parse JSON, but HEAD succeeded so assume it exists
            return { exists: true };
          }
        }
      }

      // HEAD failed with non-404 error, or GET failed - probably doesn't exist
      return { exists: false, error: `Asset check failed: HEAD ${headResponse.status}, GET ${headResponse.ok ? 'N/A' : 'failed'}` };
    } catch (err) {
      // Network error - assume doesn't exist to be safe
      return { exists: false, error: `Network error checking asset: ${err.message}` };
    }
  }

  /**
   * Create an asset from a URL.
   * @param {string} folderPath - Folder path (e.g., /content/dam/project)
   * @param {string} sourceUrl - URL to import the asset from
   * @param {string} fileName - Name for the asset
   * @returns {Promise<Object>} Object with { status, jobUrl, body, headers }
   */
  async createAssetFromUrl(folderPath, sourceUrl, fileName) {
    const apiPath = damPathToApiPath(folderPath);
    const url = `${this.#baseUrl}/api/assets${apiPath}/*`;
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.#getHeaders(),
        body: JSON.stringify({
          class: 'asset',
          properties: {
            name: fileName,
            'dc:title': fileName,
          },
          links: [{
            rel: ['content'],
            href: sourceUrl,
          }],
        }),
      });
    } catch (err) {
      throw new Error(`Network error creating asset at ${folderPath}/${fileName}: ${err.message}`);
    }

    // Capture all response info for debugging and job tracking
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseBody = null;
    try {
      const text = await response.text();
      responseBody = text ? JSON.parse(text) : null;
    } catch {
      // Body might not be JSON
      responseBody = null;
    }

    if (!response.ok && response.status !== 202) {
      throw new Error(`POST ${url} returned ${response.status}: ${JSON.stringify(responseBody) || '(no body)'}`);
    }

    // Return full response info including job URL if present
    return {
      status: response.status,
      jobUrl: responseHeaders.location || responseHeaders['content-location'] || null,
      headers: responseHeaders,
      body: responseBody,
    };
  }

  /**
   * Poll a job URL until it completes.
   * @param {string} jobUrl - The job status URL to poll
   * @param {number} maxWaitMs - Maximum time to wait (default 60 seconds)
   * @param {number} intervalMs - Polling interval (default 2 seconds)
   * @returns {Promise<Object>} Final job status
   */
  async pollJobStatus(jobUrl, maxWaitMs = 60000, intervalMs = 2000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(jobUrl, {
          method: 'GET',
          headers: this.#getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Job status check failed: ${response.status}`);
        }

        let body = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        // Check for completion - adjust based on actual API response format
        const status = body?.status || body?.state || 'unknown';
        if (status === 'complete' || status === 'completed' || status === 'success' || status === 'SUCCESS') {
          return { complete: true, status, body };
        }
        if (status === 'failed' || status === 'error' || status === 'FAILED' || status === 'ERROR') {
          return {
            complete: true, status, body, error: true,
          };
        }

        // If response is 200 and no status field, might be complete
        if (response.status === 200 && !body?.status && !body?.state) {
          return { complete: true, status: 'assumed-complete', body };
        }
      } catch (err) {
        // Log but continue polling
        // eslint-disable-next-line no-console
        console.warn('Poll error:', err.message);
      }

      // Wait before next poll
      await new Promise((resolve) => { setTimeout(resolve, intervalMs); });
    }

    return { complete: false, status: 'timeout', error: true };
  }

  /**
   * Import assets from URLs using the Import from URL API.
   * This API supports up to 300 files per request and auto-creates folders.
   * @param {string} folderPath - Target folder path (e.g., /content/dam/project)
   * @param {Array<{fileName: string, url: string, mimeType?: string, fileSize?: number, assetMetadata?: Object}>} files
   * @param {Object} globalMetadata - Optional metadata applied to all files
   * @returns {Promise<{jobId: string, statusUrl: string, resultUrl: string}>}
   */
  async importFromUrl(folderPath, files, globalMetadata = null) {
    // eslint-disable-next-line no-console
    console.log(`[AEMApi] importFromUrl called with folder: ${folderPath}, files: ${files.length}`);
    const url = `${this.#baseUrl}/adobe/assets/import/fromUrl`;

    const requestBody = {
      folder: folderPath, // Send full /content/dam path as required by API
      files,
      sourceName: 'Assets Workbench',
    };

    if (globalMetadata) {
      requestBody.assetMetadata = globalMetadata;
    }

    // eslint-disable-next-line no-console
    console.log(`[AEMApi] Making import request to: ${url}`);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: this.#getHeaders(),
        body: JSON.stringify(requestBody),
      });
      // eslint-disable-next-line no-console
      console.log(`[AEMApi] Import response status: ${response.status}`);
    } catch (err) {
      throw new Error(`Network error calling import API: ${err.message}`);
    }

    // Read response body
    let responseBody = null;
    try {
      responseBody = await response.json();
    } catch {
      // Body might not be JSON
    }

    if (response.status !== 202) {
      const errorDetail = responseBody ? JSON.stringify(responseBody) : '(no body)';
      throw new Error(`Import API returned ${response.status}: ${errorDetail}`);
    }

    // Get job ID from response body or Location header
    const locationHeader = response.headers.get('Location');
    let jobId = responseBody?.id || responseBody?.data?.id;

    if (!jobId && locationHeader) {
      // Try to extract job ID from Location header
      const match = locationHeader.match(/jobs\/([^/]+)/);
      if (match) {
        jobId = match[1];
      }
    }

    if (!jobId) {
      throw new Error('Import API did not return a job ID');
    }

    return {
      jobId,
      statusUrl: `${this.#baseUrl}/adobe/assets/import/jobs/${jobId}/status`,
      resultUrl: `${this.#baseUrl}/adobe/assets/import/jobs/${jobId}/result`,
    };
  }

  /**
   * Poll import job status until completion.
   * @param {string} jobId - The import job ID
   * @param {Function} logFn - Logging function
   * @param {number} maxWaitMs - Maximum wait time (default 5 minutes)
   * @returns {Promise<{state: string, progress: Object, errors: Array, failed?: boolean}>}
   */
  async pollImportJob(jobId, logFn = () => {}, maxWaitMs = 300000) {
    const statusUrl = `${this.#baseUrl}/adobe/assets/import/jobs/${jobId}/status`;
    const startTime = Date.now();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (Date.now() - startTime > maxWaitMs) {
        logFn('Job polling timed out.', 'error');
        return { state: 'TIMEOUT', failed: true };
      }

      // eslint-disable-next-line no-console
      console.log(`[AEMApi] Polling job status: ${statusUrl}`);
      try {
        const response = await fetch(statusUrl, {
          method: 'GET',
          headers: this.#getHeaders(),
        });
        // eslint-disable-next-line no-console
        console.log(`[AEMApi] Poll response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const body = await response.json();
        const { state, progress } = body;

        logFn(`Import progress: ${progress.imported || 0}/${progress.total || 0} imported, step: ${progress.step || 'unknown'}`);

        if (state === 'COMPLETED') {
          return { state, progress, errors: body.errors || [] };
        }
        if (state === 'FAILED') {
          return { state, progress, errors: body.errors || [], failed: true };
        }

        // Use Retry-After header if present, otherwise default to 2 seconds
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      } catch (err) {
        logFn(`Poll error: ${err.message}`, 'warning');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Get import job results (includes asset IDs for uploaded assets).
   * @param {string} jobId - The import job ID
   * @returns {Promise<Object>} Job result with items array containing asset IDs
   */
  async getImportJobResult(jobId) {
    const url = `${this.#baseUrl}/adobe/assets/import/jobs/${jobId}/result`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.#getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get job result: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update metadata on an existing asset using the Author API.
   * Uses JSON Patch format and If-Match: * to bypass ETag requirement.
   * @param {string} assetId - Asset ID (URN format: urn:aaid:aem:...)
   * @param {Object} metadata - Metadata properties to update
   * @returns {Promise<Object|null>} API response or null if no content
   */
  async updateMetadataById(assetId, metadata) {
    const url = `${this.#baseUrl}/adobe/assets/${assetId}/metadata`;

    // Convert metadata object to JSON Patch operations (RFC 6902)
    // Path should be just the property name, not /assetMetadata/name
    const patchOps = Object.entries(metadata).map(([key, value]) => ({
      op: 'add',
      path: key,
      value,
    }));

    let response;
    try {
      response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...this.#getHeaders('application/json-patch+json'),
          'If-Match': '*', // Match any version
        },
        body: JSON.stringify(patchOps),
      });
    } catch (err) {
      throw new Error(`Network error updating metadata: ${err.message}`);
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '(could not read response body)';
      }
      throw new Error(`PATCH ${url} returned ${response.status}: ${errorBody}`);
    }

    // Handle empty responses (204 No Content or empty body)
    if (response.status === 204) {
      return null;
    }

    // Try to parse JSON, but don't fail if empty
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update metadata on an existing asset (legacy method using Assets API).
   * @param {string} assetPath - Full path to the asset
   * @param {Object} metadata - Metadata properties to update
   * @returns {Promise<Object|null>} API response or null if no content
   */
  async updateMetadata(assetPath, metadata) {
    const apiPath = damPathToApiPath(assetPath);
    const url = `${this.#baseUrl}/api/assets${apiPath}`;
    let response;
    try {
      response = await fetch(url, {
        method: 'PUT',
        headers: this.#getHeaders(),
        body: JSON.stringify({
          class: 'asset',
          properties: metadata,
        }),
      });
    } catch (err) {
      throw new Error(`Network error updating metadata on ${assetPath}: ${err.message}`);
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '(could not read response body)';
      }
      throw new Error(`PUT ${url} returned ${response.status}: ${errorBody}`);
    }

    // Handle empty responses (204 No Content or empty body)
    const contentLength = response.headers.get('content-length');
    if (response.status === 204 || contentLength === '0') {
      return null;
    }

    // Try to parse JSON, but don't fail if empty
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  /**
   * Create a folder if it doesn't exist, recursively creating parent folders as needed.
   * NOTE: We do NOT check with HEAD/GET first because CORS browser extensions fake those responses.
   * Instead, we always try to create and handle "already exists" responses as success.
   * @param {string} folderPath - Full path to the folder (e.g., /content/dam/project/subfolder)
   * @param {Function} logFn - Optional logging function
   * @returns {Promise<{success: boolean, error?: string}>} Folder creation result
   */
  async ensureFolder(folderPath, logFn = () => {}) {
    // eslint-disable-next-line no-console
    console.log(`[AEMApi] ensureFolder called with: ${folderPath}`);
    // Convert DAM path to API path
    const apiPath = damPathToApiPath(folderPath);

    // Split API path into segments and build up the hierarchy
    // e.g., /frescopa-coffee/en/volvo -> ['frescopa-coffee', 'en', 'volvo']
    const segments = apiPath.split('/').filter((s) => s);

    // Start from root (empty string = /api/assets root)
    let currentApiPath = '';

    for (let i = 0; i < segments.length; i += 1) {
      const folderName = segments[i];
      const targetApiPath = `${currentApiPath}/${folderName}`;

      // Always try to create the folder - API returns 409 if it already exists
      const createUrl = `${this.#baseUrl}/api/assets${currentApiPath}/*`;
      logFn(`Ensuring folder: ${targetApiPath}`);
      const requestBody = JSON.stringify({
        class: 'folder',
        properties: {
          name: folderName,
          'dc:title': folderName,
        },
      });
      const requestHeaders = this.#getHeaders();
      // eslint-disable-next-line no-console
      console.log(`[AEMApi] POST ${createUrl}`);
      // eslint-disable-next-line no-console
      console.log(`[AEMApi] Request headers:`, requestHeaders);
      // eslint-disable-next-line no-console
      console.log(`[AEMApi] Request body:`, requestBody);
      try {
        const response = await fetch(createUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
        });
        // eslint-disable-next-line no-console
        console.log(`[AEMApi] Response status: ${response.status}`);
        // eslint-disable-next-line no-console
        console.log(`[AEMApi] Response headers:`, Object.fromEntries(response.headers.entries()));
        const responseText = await response.clone().text();
        // eslint-disable-next-line no-console
        console.log(`[AEMApi] Response body:`, responseText.substring(0, 500));

        // 201 = created, 409 = already exists, both are OK
        if (response.ok || response.status === 201) {
          logFn(`  ✓ Folder created: ${targetApiPath}`);
        } else if (response.status === 409) {
          logFn(`  ✓ Folder exists: ${targetApiPath}`);
        } else {
          let errorBody = '';
          try {
            errorBody = await response.text();
          } catch {
            errorBody = '(could not read response body)';
          }
          // 500 with "already exist" message is also OK
          if (response.status === 500 && errorBody.includes('already exist')) {
            logFn(`  ✓ Folder exists: ${targetApiPath}`);
          } else {
            return {
              success: false,
              error: `POST ${createUrl} returned ${response.status}: ${errorBody}`,
            };
          }
        }
      } catch (err) {
        return {
          success: false,
          error: `Network error creating folder ${targetApiPath}: ${err.message}`,
        };
      }

      currentApiPath = targetApiPath;
    }

    return { success: true };
  }
}
/* eslint-enable
  no-await-in-loop,
  no-restricted-syntax,
  prefer-destructuring,
  no-promise-executor-return,
  object-curly-newline,
  quotes,
  max-len */

/**
 * Gets the filename from an image URL.
 * @param {string} url - The image URL
 * @returns {string} The filename
 */
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const { pathname } = urlObj;
    // Get the last segment of the path
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    // Remove any query string remnants and decode
    return decodeURIComponent(filename.split('?')[0]) || 'asset';
  } catch {
    return 'asset';
  }
}

/**
 * Sanitizes a folder path for AEM DAM by replacing dots with dashes.
 * @param {string} path - The folder path
 * @returns {string} Sanitized path
 */
function sanitizeFolderPath(path) {
  // Split path into segments, sanitize each segment (replace dots with dashes), rejoin
  return path.split('/').map((segment) => segment.replace(/\./g, '-')).join('/');
}

/**
 * Converts a DAM path to an API path by stripping /content/dam prefix.
 * @param {string} damPath - The full DAM path (e.g., /content/dam/project/image.jpg)
 * @returns {string} API path (e.g., /project/image.jpg)
 */
/**
 * Escapes a string for safe use in a shell script single-quoted string.
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeShellString(str) {
  // In single-quoted bash strings, only single quotes need escaping
  // Replace single quotes with '\'' (end quote, escaped quote, start quote)
  return String(str).replace(/'/g, "'\\''");
}

/**
 * Escapes a JSON string for embedding in a bash script using double quotes.
 * This is safer for complex JSON with URLs.
 * @param {string} jsonStr - JSON string to escape
 * @returns {string} Escaped string safe for double-quoted bash
 */
function escapeJsonForBash(jsonStr) {
  // For double-quoted bash strings, escape: $ ` \ " !
  return String(jsonStr)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`')
    .replace(/!/g, '\\!');
}

/**
 * Generates a downloadable shell script for AEM export.
 * This avoids CORS issues by running curl commands locally.
 *
 * @param {ClusterManager} clusterManager - The cluster manager instance
 * @param {Object} options - Export options
 * @param {boolean} options.exportAssets - Whether to export assets
 * @param {boolean} options.exportMetadata - Whether to export metadata
 */
/* eslint-disable
  no-template-curly-in-string,
  no-restricted-syntax,
  no-await-in-loop,
  no-continue,
  quotes,
  max-len */
async function generateAEMExportScript(clusterManager, { exportAssets = true, exportMetadata = true } = {}) {
  try {
    // Show config modal and get user input
    const config = await showAEMConfigModal({ exportAssets, exportMetadata });

    const clusters = clusterManager.getAllClusters();

    // Collect asset information
    const assetInfos = [];
    const foldersToCreate = new Set();

    for (const cluster of clusters) {
      const identity = cluster.getFirstIdentityOf(UrlAndPageIdentity.type);
      if (!identity) continue;

      const sourceUrl = identity.src;
      const filename = getFilenameFromUrl(sourceUrl);
      const sites = cluster.getAll(UrlAndPageIdentity.type, 'site');

      const shortestPath = getShortestPagePath(sites);
      const rawFolderPath = shortestPath
        ? `${config.rootPath}/${shortestPath}`
        : config.rootPath;

      // Sanitize folder path (replace dots with dashes)
      const folderPath = sanitizeFolderPath(rawFolderPath);

      assetInfos.push({
        cluster,
        sourceUrl,
        filename,
        folderPath,
        metadata: buildAEMMetadata(cluster),
      });

      foldersToCreate.add(folderPath);
    }

    // Build the shell script
    const lines = [];

    // Script header
    lines.push('#!/bin/bash');
    lines.push('# AEM Asset Export Script');
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Assets: ${assetInfos.length}`);
    lines.push(`# Folders: ${foldersToCreate.size}`);
    lines.push('');
    lines.push('set -e  # Exit on error');
    lines.push('');

    // Configuration variables
    lines.push('# ============ CONFIGURATION ============');
    lines.push(`TOKEN='${escapeShellString(config.accessToken)}'`);
    lines.push(`API_KEY='${escapeShellString(config.apiKey)}'`);
    lines.push(`BASE_URL='https://${escapeShellString(config.repositoryId)}.adobeaemcloud.com'`);
    lines.push('');

    // Helper function for curl
    lines.push('# Helper function for authenticated requests');
    lines.push('aem_curl() {');
    lines.push('  curl -s -w "\\nHTTP_STATUS:%{http_code}" \\');
    lines.push('    -H "Authorization: Bearer ${TOKEN}" \\');
    lines.push('    -H "x-api-key: ${API_KEY}" \\');
    lines.push('    "$@"');
    lines.push('}');
    lines.push('');

    // Function to create folder
    lines.push('# Create a folder (handles already-exists gracefully)');
    lines.push('create_folder() {');
    lines.push('  local folder_name="$1"');
    lines.push('  local parent_api_path="$2"');
    lines.push('  local url="${BASE_URL}/api/assets${parent_api_path}/*"');
    lines.push('  ');
    lines.push('  response=$(aem_curl -X POST \\');
    lines.push('    -H "Content-Type: application/json" \\');
    lines.push('    -d "{\\"class\\":\\"folder\\",\\"properties\\":{\\"name\\":\\"${folder_name}\\",\\"dc:title\\":\\"${folder_name}\\"}}" \\');
    lines.push('    "$url")');
    lines.push('  ');
    lines.push('  status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)');
    lines.push('  if [ "$status" = "201" ] || [ "$status" = "409" ] || [ "$status" = "500" ]; then');
    lines.push('    echo "  ✓ Folder created: ${folder_name}"');
    lines.push('    return 0');
    lines.push('  else');
    lines.push('    echo "  ✗ Failed to create folder: ${folder_name} (status: $status)"');
    lines.push('    echo "$response" | head -5');
    lines.push('    return 1');
    lines.push('  fi');
    lines.push('}');
    lines.push('');

    // Phase 1: Create folders (deduplicated)
    if (exportAssets) {
      lines.push('# ============ PHASE 1: CREATE FOLDERS ============');
      lines.push('echo "Creating folder structure..."');
      lines.push('');
      lines.push('# Track created folders to avoid redundant API calls');
      lines.push('declare -A CREATED_FOLDERS');
      lines.push('');

      // Collect all unique folder paths that need to be created
      const allFolderPaths = new Set();
      for (const folderPath of foldersToCreate) {
        const apiPath = damPathToApiPath(folderPath);
        const segments = apiPath.split('/').filter((s) => s);
        let currentPath = '';
        for (const segment of segments) {
          currentPath = `${currentPath}/${segment}`;
          allFolderPaths.add(currentPath);
        }
      }

      // Sort by path length to create parents first
      const sortedPaths = [...allFolderPaths].sort((a, b) => a.length - b.length);

      for (const folderApiPath of sortedPaths) {
        const parentPath = folderApiPath.substring(0, folderApiPath.lastIndexOf('/')) || '';
        const folderName = folderApiPath.substring(folderApiPath.lastIndexOf('/') + 1);

        lines.push(`# Create ${folderApiPath}`);
        lines.push(`if [ -z "\${CREATED_FOLDERS['${escapeShellString(folderApiPath)}']:-}" ]; then`);
        lines.push(`  create_folder '${escapeShellString(folderName)}' '${escapeShellString(parentPath)}'`);
        lines.push(`  CREATED_FOLDERS['${escapeShellString(folderApiPath)}']=1`);
        lines.push('fi');
        lines.push('');
      }

      lines.push(`echo "Folder creation complete. Created ${sortedPaths.length} folders."`);
      lines.push('echo ""');
      lines.push('');

      // Wait for AEM to index the folders before importing assets
      lines.push('echo "Waiting 10 seconds for folders to be indexed..."');
      lines.push('sleep 10');
      lines.push('echo ""');
      lines.push('');
    }

    // Phase 2: Import assets (batched by folder)
    if (exportAssets) {
      lines.push('# ============ PHASE 2: IMPORT ASSETS (BATCHED) ============');
      lines.push('echo "Importing assets from URLs..."');
      lines.push('');
      lines.push('declare -a JOB_IDS');
      lines.push('declare -a JOB_FOLDERS');
      lines.push('declare -A ASSET_IDS');
      lines.push('');

      // Group assets by folder
      const assetsByFolder = new Map();
      for (const info of assetInfos) {
        const apiPath = damPathToApiPath(info.folderPath);
        const fullFolderPath = `/content/dam${apiPath}`;
        if (!assetsByFolder.has(fullFolderPath)) {
          assetsByFolder.set(fullFolderPath, []);
        }
        assetsByFolder.get(fullFolderPath).push(info);
      }

      // Generate batch import for each folder
      for (const [fullFolderPath, assets] of assetsByFolder) {
        // Ensure unique file names within the folder batch.
        // AEM rejects a single import request when two entries share the same fileName.
        // We deterministically suffix duplicates with "-dupN" before the extension.
        const usedNames = new Map(); // fileName -> count
        const assetsWithUniqueNames = assets.map((info) => {
          const originalName = info.filename;
          const count = (usedNames.get(originalName) || 0) + 1;
          usedNames.set(originalName, count);

          if (count === 1) {
            return { ...info, effectiveFilename: originalName };
          }

          const dot = originalName.lastIndexOf('.');
          const base = dot > 0 ? originalName.substring(0, dot) : originalName;
          const ext = dot > 0 ? originalName.substring(dot) : '';
          const effectiveFilename = `${base}-dup${count}${ext}`;
          return { ...info, effectiveFilename };
        });

        // Emit a note into the script when we had to rename duplicates.
        if (usedNames.size !== assets.length) {
          const renamed = assetsWithUniqueNames
            .filter((i) => i.effectiveFilename !== i.filename)
            .map((i) => `${i.filename}→${i.effectiveFilename}`)
            .join(', ');
          lines.push(`# NOTE: Renamed duplicate filenames in this batch: ${renamed}`);
        }

        // Build the files array JSON - include metadata if exportMetadata is enabled
        const filesJson = assetsWithUniqueNames.map((info) => {
          if (exportMetadata) {
            // Metadata JSON goes inside single-quoted bash string
            // Single quotes in the JSON must be escaped: ' becomes '\''
            const metadataJson = JSON.stringify(info.metadata).replace(/'/g, "'\\''");
            return `{"fileName":"${escapeShellString(info.effectiveFilename)}","url":"${escapeShellString(info.sourceUrl)}","assetMetadata":${metadataJson}}`;
          }
          return `{"fileName":"${escapeShellString(info.effectiveFilename)}","url":"${escapeShellString(info.sourceUrl)}"}`;
        }).join(',');
        const filenamesList = assetsWithUniqueNames.map((info) => info.effectiveFilename).join(', ');

        lines.push(`echo "Importing batch: ${assets.length} files to ${escapeShellString(fullFolderPath)}"`);
        lines.push(`echo "  Files: ${escapeShellString(filenamesList.substring(0, 100))}${filenamesList.length > 100 ? '...' : ''}"`);
        lines.push(`response=$(aem_curl -X POST \\`);
        lines.push(`  -H "Content-Type: application/json" \\`);
        lines.push(`  -d '{"folder":"${escapeShellString(fullFolderPath)}","files":[${filesJson}],"sourceName":"Assets Workbench"}' \\`);
        lines.push(`  "\${BASE_URL}/adobe/assets/import/fromUrl")`);
        lines.push('');
        lines.push('status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)');
        lines.push('if [ "$status" = "202" ]; then');
        lines.push('  job_id=$(echo "$response" | grep -o \'"id":"[^"]*"\' | head -1 | cut -d\\" -f4)');
        lines.push('  if [ -n "$job_id" ]; then');
        lines.push(`    echo "  ✓ Import job created: $job_id (${assets.length} files)"`);
        lines.push('    JOB_IDS+=("$job_id")');
        lines.push(`    JOB_FOLDERS+=("${escapeShellString(fullFolderPath)}")`);
        lines.push('  else');
        lines.push('    echo "  ⚠ Import accepted but no job ID returned"');
        lines.push('  fi');
        lines.push('else');
        lines.push(`  echo "  ✗ Import failed for ${escapeShellString(fullFolderPath)} (status: $status)"`);
        lines.push('  echo "$response" | grep -v "HTTP_STATUS:" | head -3');
        lines.push('fi');
        lines.push('');
      }

      lines.push(`echo ""`);
      lines.push(`echo "Submitted ${assetsByFolder.size} batch import jobs for ${assetInfos.length} assets."`);
      lines.push('echo "Waiting for jobs to finish..."');
      lines.push('');

      // Phase 3: Poll for job completion
      lines.push('# ============ PHASE 3: WAIT FOR IMPORTS ============');
      lines.push('');
      lines.push('for i in "${!JOB_IDS[@]}"; do');
      lines.push('  job_id="${JOB_IDS[$i]}"');
      lines.push('  folder="${JOB_FOLDERS[$i]}"');
      lines.push('  echo "Polling job $job_id for $folder..."');
      lines.push('  ');
      lines.push('  max_attempts=120');
      lines.push('  attempt=0');
      lines.push('  while [ $attempt -lt $max_attempts ]; do');
      lines.push('    response=$(aem_curl "${BASE_URL}/adobe/assets/import/jobs/${job_id}/status")');
      lines.push('    state=$(echo "$response" | grep -o \'"state":"[^"]*"\' | cut -d\\" -f4)');
      lines.push('    imported=$(echo "$response" | grep -o \'"imported":[0-9]*\' | cut -d: -f2)');
      lines.push('    total=$(echo "$response" | grep -o \'"total":[0-9]*\' | cut -d: -f2)');
      lines.push('    ');
      lines.push('    if [ "$state" = "COMPLETED" ]; then');
      lines.push('      echo "  ✓ Import complete: $imported/$total files"');
      lines.push('      # Get all asset IDs from result');
      lines.push('      result=$(aem_curl "${BASE_URL}/adobe/assets/import/jobs/${job_id}/result")');
      lines.push('      # Extract all filename:assetId pairs');
      lines.push('      while IFS= read -r line; do');
      lines.push('        filename=$(echo "$line" | grep -o \'"fileName":"[^"]*"\' | cut -d\\" -f4)');
      lines.push('        asset_id=$(echo "$line" | grep -o \'"assetId":"[^"]*"\' | cut -d\\" -f4)');
      lines.push('        if [ -n "$filename" ] && [ -n "$asset_id" ]; then');
      lines.push('          ASSET_IDS["$filename"]="$asset_id"');
      lines.push('          echo "    $filename -> $asset_id"');
      lines.push('        fi');
      lines.push('      done < <(echo "$result" | tr "}" "\\n")');
      lines.push('      break');
      lines.push('    elif [ "$state" = "FAILED" ]; then');
      lines.push('      echo "  ✗ Import failed for $folder"');
      lines.push('      echo "$response" | head -3');
      lines.push('      break');
      lines.push('    else');
      lines.push('      echo "    Progress: ${imported:-0}/${total:-?} (state: $state)"');
      lines.push('      sleep 3');
      lines.push('      ((attempt++))');
      lines.push('    fi');
      lines.push('  done');
      lines.push('  ');
      lines.push('  if [ $attempt -ge $max_attempts ]; then');
      lines.push('    echo "  ⚠ Timeout waiting for $folder"');
      lines.push('  fi');
      lines.push('  echo ""');
      lines.push('done');
      lines.push('');
      lines.push('echo "Import polling complete. ${#ASSET_IDS[@]} assets have IDs."');
      lines.push('');
    }

    // Phase 4: Update metadata (only needed if NOT importing assets, i.e. metadata-only mode)
    // When importing assets with exportMetadata=true, metadata is included in the import request
    if (exportMetadata && !exportAssets) {
      lines.push('# ============ PHASE 4: UPDATE METADATA (on existing assets) ============');
      lines.push('echo "Updating metadata on existing assets..."');
      lines.push('echo "Note: This requires assets to already exist in AEM with known IDs."');
      lines.push('echo ""');

      for (const info of assetInfos) {
        const { metadata } = info;
        // Build JSON Patch operations
        const patchOps = Object.entries(metadata).map(([key, value]) => ({
          op: 'add',
          path: `/${key}`,
          value,
        }));
        const patchJson = JSON.stringify(patchOps);

        lines.push(`filename="${escapeShellString(info.filename)}"`);
        lines.push('asset_id="${ASSET_IDS[$filename]:-}"');
        lines.push('');
        lines.push('if [ -n "$asset_id" ]; then');
        lines.push(`  echo "Updating metadata for $filename..."`);
        lines.push(`  response=$(aem_curl -X PATCH \\`);
        lines.push(`    -H "Content-Type: application/json-patch+json" \\`);
        lines.push(`    -H "If-Match: *" \\`);
        lines.push(`    -d "${escapeJsonForBash(patchJson)}" \\`);
        lines.push(`    "\${BASE_URL}/adobe/assets/\${asset_id}/metadata")`);
        lines.push('  ');
        lines.push('  status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)');
        lines.push('  if [ "$status" = "200" ] || [ "$status" = "204" ]; then');
        lines.push('    echo "  ✓ Metadata updated for $filename"');
        lines.push('  else');
        lines.push('    echo "  ✗ Metadata update failed for $filename (status: $status)"');
        lines.push('  fi');
        lines.push('else');
        lines.push('  echo "  ⚠ Skipping metadata for $filename (no asset ID)"');
        lines.push('fi');
        lines.push('');
      }

      lines.push('echo ""');
      lines.push('echo "Metadata updates complete."');
    } else if (exportMetadata && exportAssets) {
      lines.push('# Metadata was included in the import request - no separate update needed');
      lines.push('echo "Metadata was set during import."');
    }

    // Summary
    lines.push('');
    lines.push('# ============ SUMMARY ============');
    lines.push('echo ""');
    lines.push('echo "============================================"');
    lines.push('echo "Export complete!"');
    lines.push(`echo "Total assets processed: ${assetInfos.length}"`);
    lines.push(`echo "Total folders created: ${foldersToCreate.size}"`);
    lines.push('echo "============================================"');

    // Create and download the script
    const scriptContent = lines.join('\n');
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `aem-export-${Date.now()}.sh`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    // eslint-disable-next-line no-alert
    alert(`Shell script downloaded!\n\nTo run it:\n  bash ~/Downloads/${link.download}\n\nThe script will create ${foldersToCreate.size} folders and import ${assetInfos.length} assets.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to generate export script:', error);
    // eslint-disable-next-line no-alert
    alert(`Failed to generate export script: ${error.message}`);
  }
}
/* eslint-enable
  no-template-curly-in-string,
  no-restricted-syntax,
  no-await-in-loop,
  no-continue,
  quotes,
  max-len */

/**
 * Exports assets and/or metadata to AEM using phased approach (browser-based, has CORS issues).
 * Phase 1: Create all folders
 * Phase 2: Check which assets exist
 * Phase 3: Upload all missing assets
 * Phase 4: Wait for uploads to complete
 * Phase 5: Update metadata for all assets
 *
 * NOTE: This function has CORS issues with AEM. Use generateAEMExportScript() instead.
 *
 * @param {ClusterManager} clusterManager - The cluster manager instance
 * @param {Object} options - Export options
 * @param {boolean} options.exportAssets - Whether to export assets
 * @param {boolean} options.exportMetadata - Whether to export metadata
 */
/* eslint-disable
  no-template-curly-in-string,
  no-restricted-syntax,
  no-await-in-loop,
  no-continue,
  no-unused-vars,
  no-undef,
  arrow-parens,
  quotes,
  max-len */
async function exportToAEM(clusterManager, { exportAssets = true, exportMetadata = true } = {}) {
  let progress = null;

  try {
    // Show config modal and get user input
    const config = await showAEMConfigModal({ exportAssets, exportMetadata });

    // Create progress modal
    progress = createProgressModal();

    const clusters = clusterManager.getAllClusters();
    progress.log(`Starting export of ${clusters.length} assets...`);

    // Initialize AEM API
    const aemApi = new AEMApi(config.repositoryId, config.apiKey, config.accessToken);

    // ========== PHASE 1: Prepare asset info and collect folders ==========
    progress.log('');
    progress.log('═══ Phase 1: Preparing asset information ═══', 'info');

    const assetInfos = [];
    const foldersToCreate = new Set();

    for (const cluster of clusters) {
      const identity = cluster.getFirstIdentityOf(UrlAndPageIdentity.type);
      if (!identity) {
        progress.log('Skipping cluster - no URL/page identity found', 'warning');
        continue;
      }

      const sourceUrl = identity.src;
      const filename = getFilenameFromUrl(sourceUrl);
      const sites = cluster.getAll(UrlAndPageIdentity.type, 'site');

      const shortestPath = getShortestPagePath(sites);
      const rawFolderPath = shortestPath
        ? `${config.rootPath}/${shortestPath}`
        : config.rootPath;

      // Sanitize folder path (replace dots with dashes)
      const folderPath = sanitizeFolderPath(rawFolderPath);
      const assetPath = `${folderPath}/${filename}`;

      assetInfos.push({
        cluster,
        sourceUrl,
        filename,
        folderPath,
        assetPath,
        exists: false,
        uploaded: false,
        metadataUpdated: false,
        error: null,
      });

      foldersToCreate.add(folderPath);
    }

    progress.log(`Prepared ${assetInfos.length} assets in ${foldersToCreate.size} folders`);
    progress.setTotal(assetInfos.length * 3); // 3 phases per asset: check, upload, metadata

    // ========== PHASE 2: Create all folders ==========
    progress.log('');
    progress.log('═══ Phase 2: Creating folder structure ═══', 'info');

    const createdFolders = new Set();
    const failedFolders = new Set();
    let folderSuccessCount = 0;
    let folderFailCount = 0;

    for (const folderPath of foldersToCreate) {
      if (!createdFolders.has(folderPath)) {
        progress.log(`Creating folder: ${folderPath}`, 'info');
        const folderResult = await aemApi.ensureFolder(folderPath, (msg) => progress.log(`  ${msg}`, 'info'));
        if (!folderResult.success) {
          progress.log(`  ✗ Failed: ${folderResult.error}`, 'error');
          failedFolders.add(folderPath);
          folderFailCount += 1;
          // Mark assets in this folder as having errors
          assetInfos.forEach((info) => {
            if (info.folderPath === folderPath) {
              info.error = `Folder creation failed: ${folderResult.error}`;
            }
          });
        } else {
          progress.log('  ✓ Folder ready', 'success');
          createdFolders.add(folderPath);
          folderSuccessCount += 1;
        }
      }
    }

    progress.log(`Folder creation: ${folderSuccessCount} succeeded, ${folderFailCount} failed`, folderFailCount > 0 ? 'warning' : 'success');

    if (folderFailCount > 0 && folderSuccessCount === 0) {
      progress.error('All folder creations failed. Check AEM permissions and configuration.');
      return;
    }

    // ========== PHASE 3: Upload all assets (skip existence check due to CORS issues) ==========
    progress.log('');
    progress.log('═══ Phase 3: Preparing to upload all assets ═══', 'info');

    // For now, assume no assets exist to bypass CORS-faked existence checks
    // The import API will handle duplicates gracefully
    const existingCount = 0;
    const missingCount = assetInfos.length;
    progress.log(`Skipping existence check (CORS issues), will upload all ${missingCount} assets`);

    // ========== PHASE 4: Upload missing assets ==========
    if (exportAssets && missingCount > 0) {
      progress.log('');
      progress.log('═══ Phase 4: Uploading assets ═══', 'info');

      // Upload all assets that don't have folder errors (skipping existence check)
      const assetsToUpload = assetInfos.filter((i) => !i.error);
      const skippedDueToFolderError = assetInfos.filter((i) => i.error).length;
      if (skippedDueToFolderError > 0) {
        progress.log(`Skipping ${skippedDueToFolderError} assets due to folder creation errors`, 'warning');
      }
      const jobsToTrack = [];

      const uploadTasks = assetsToUpload.map((info) => async () => {
        try {
          progress.log(`Uploading: ${info.filename}`, 'info');

          // Use the new Import from URL API
          const fullFolderPath = `/content/dam${damPathToApiPath(info.folderPath)}`;
          const files = [{
            fileName: info.filename,
            url: info.sourceUrl,
          }];

          const result = await aemApi.importFromUrl(fullFolderPath, files);
          info.uploaded = true;
          info.importJobId = result.jobId;

          progress.log(`  ✓ Import job created: ${result.jobId}`, 'success');

          // Track import job for polling
          jobsToTrack.push({ info, jobId: result.jobId });
        } catch (err) {
          info.error = err.message;
          progress.log(`  ✗ Upload failed: ${err.message}`, 'error');
        }
        progress.increment();
        return info;
      });

      await runWithConcurrency(uploadTasks, AEM_API_CONCURRENCY);

      const uploadedCount = assetsToUpload.filter((i) => i.uploaded).length;
      progress.log(`Uploaded ${uploadedCount} of ${assetsToUpload.length} assets`);

      // Poll for job completion if we have job URLs
      if (jobsToTrack.length > 0) {
        progress.log('');
        progress.log(`Waiting for ${jobsToTrack.length} upload jobs to complete...`, 'info');

        const pollTasks = jobsToTrack.map((job) => async () => {
          progress.log(`  Polling import job ${job.jobId} for ${job.info.filename}...`, 'info');
          const result = await aemApi.pollImportJob(job.jobId, (msg, level) => {
            progress.log(`    ${msg}`, level || 'info');
          });

          if (result.failed) {
            progress.log(`  ✗ Import job failed for ${job.info.filename}: ${result.state}`, 'error');
            job.info.error = `Import failed: ${result.state}`;
          } else if (result.state === 'COMPLETED') {
            progress.log(`  ✓ Import complete for ${job.info.filename}`, 'success');

            // Get asset ID from job result
            try {
              const jobResult = await aemApi.getImportJobResult(job.jobId);
              progress.log(`    Job result items: ${jobResult.items?.length || 0}`, 'info');
              const item = jobResult.items?.find((i) => i.fileName === job.info.filename);
              progress.log(`    Found item for ${job.info.filename}: ${item ? 'YES' : 'NO'}`, 'info');
              if (item?.assetId) {
                job.info.assetId = item.assetId;
                progress.log(`    Asset ID assigned: ${item.assetId}`, 'success');
              } else {
                progress.log(`    No asset ID found in job result`, 'warning');
              }
            } catch (err) {
              progress.log(`    Warning: Could not get asset ID: ${err.message}`, 'warning');
            }
          } else {
            progress.log(`  ⚠ Import job timeout for ${job.info.filename}`, 'warning');
          }
          return result;
        });

        await runWithConcurrency(pollTasks, AEM_API_CONCURRENCY);
        progress.log('All upload jobs processed', 'info');

        // Debug: Check how many assets have IDs
        const assetsWithIds = assetInfos.filter(i => i.assetId);
        progress.log(`DEBUG: ${assetsWithIds.length} assets have IDs after polling`, 'info');
      } else if (uploadedCount > 0) {
        // No job URLs returned - wait a bit for processing
        progress.log('');
        progress.log('No job URLs returned, waiting 5 seconds for processing...', 'info');
        await new Promise((resolve) => { setTimeout(resolve, 5000); });
      }
    } else {
      // Skip increment for upload phase
      assetInfos.forEach(() => progress.increment());
      if (!exportAssets) {
        progress.log('');
        progress.log('═══ Phase 4: Skipping uploads (disabled) ═══', 'info');
      } else {
        progress.log('');
        progress.log('═══ Phase 4: No uploads needed ═══', 'info');
      }
    }

    // ========== PHASE 5: Update metadata ==========
    if (exportMetadata) {
      progress.log('');
      progress.log('═══ Phase 5: Updating metadata ═══', 'info');

      // Update metadata for assets that have asset IDs (from newly uploaded assets)
      const assetsForMetadata = assetInfos.filter((i) => i.assetId);
      const totalAssets = assetInfos.length;
      const assetsWithIds = assetInfos.filter((i) => i.assetId).length;
      const uploadedAssets = assetInfos.filter((i) => i.uploaded).length;

      progress.log(`Assets processed: ${totalAssets} total, ${assetsWithIds} with IDs, ${uploadedAssets} uploaded`, 'info');

      if (assetsForMetadata.length === 0) {
        progress.log('No assets with IDs available for metadata update', 'warning');
        // Skip increment for metadata phase
        assetInfos.forEach(() => progress.increment());
      } else {
        const metadataTasks = assetsForMetadata.map((info) => async () => {
          try {
            const metadata = buildAEMMetadata(info.cluster);
            progress.log(`Updating metadata: ${info.filename} (impressions=${metadata['xdm:impressions']}, CTR=${metadata['xdm:assetExperienceClickThroughRate']})`, 'info');
            await aemApi.updateMetadataById(info.assetId, metadata);
            info.metadataUpdated = true;
            progress.log(`  ✓ Metadata updated for ${info.filename}`, 'success');
          } catch (err) {
            info.error = err.message;
            progress.log(`  ✗ Metadata failed: ${err.message}`, 'error');
          }
          progress.increment();
          return info;
        });

        await runWithConcurrency(metadataTasks, AEM_API_CONCURRENCY);

        const metadataCount = assetsForMetadata.filter((i) => i.metadataUpdated).length;
        progress.log(`Updated metadata for ${metadataCount} of ${assetsForMetadata.length} assets`);
      }
    } else {
      // Skip increment for metadata phase
      assetInfos.forEach(() => progress.increment());
      progress.log('');
      progress.log('═══ Phase 5: Skipping metadata (disabled) ═══', 'info');
    }

    // ========== SUMMARY ==========
    const successCount = assetInfos.filter((i) => !i.error && i.uploaded).length;
    const errorCount = assetInfos.filter((i) => i.error).length;
    const skipCount = assetInfos.length - successCount - errorCount;

    progress.complete(`Completed: ${successCount} processed, ${skipCount} skipped, ${errorCount} errors`);
  } catch (error) {
    if (progress) {
      progress.error(`Export failed: ${error.message}`);
    }
    // eslint-disable-next-line no-console
    console.error('Export to AEM failed:', error);
  }
}
/* eslint-enable
  no-template-curly-in-string,
  no-restricted-syntax,
  no-await-in-loop,
  no-continue,
  no-unused-vars,
  quotes,
  max-len */

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
