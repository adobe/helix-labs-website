/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons, createOptimizedPicture } from '../../scripts/aem.js';
import ClusterManager from './identity/clustermanager.js';
import IdentityRegistry from './identity/identityregistry.js';
import IdentityValues from './identity/identityvalues.js';
import SitemapLoadOrderIdentity from './identity/sitemaploadorderidentity.js';
import ColorIdentity from './identity/imageidentity/coloridentity.js';
import UrlAndPageIdentity from './identity/imageidentity/urlandpageidentity.js';
import PromisePool from './promisepool.js';
import './identity/defaultidentityloader.js';
import './reports/defaultreportsloader.js';
import ReportRegistry from './reports/reportregistry.js';
import PerformanceUtil from './reports/util/performanceutil.js';
import Lighthouse from './identity/imageidentity/lighthouse.js';
import NamingUtil from './reports/util/namingutil.js';

import { AEM_EDS_HOSTS } from './identity/imageidentity/urlidentity.js';

// These imports register the classes with the IdentityRegistry
// import './imageidentity/urlidentity.js'; not needed due to above import

const permittedProtocols = ['http', 'https', 'data'];
/* url and sitemap utility */
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
    return ar(value, getShapeForRatio(value));
  }

  src(value) {
    return `<img src="${new URL(value, this.data.origin).href}" />`;
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

function getFileType(src) {
  const fileType = src.split('.')
    .pop().split('?')
    .shift()
    .toLowerCase();
  return fileType;
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
      src: 'Preview',
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

    const data = {
      fileType: getFileType(clusterManager.get(clusterId).elementForCluster.src),
      count: site.length,
      site,
      alt,
      width: identity.width,
      height: identity.height,
      aspectRatio: identity.aspectRatio,
      src: clusterManager.get(clusterId).elementForCluster.src,
    };

    const colorIdentity = cluster.getSingletonOf(ColorIdentity.type);
    if (colorIdentity) {
      rows.topColors = 'Top Colors';
      data.topColors = colorIdentity.topColorsSorted;
    }

    const lighthouse = cluster.getSingletonOf(Lighthouse.type);

    if (window.collectingRum) {
      const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
      const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
      const visits = cluster.getAll(UrlAndPageIdentity.type, 'visits').reduce((acc, curr) => acc + curr, 0);
      const bounces = cluster.getAll(UrlAndPageIdentity.type, 'bounces').reduce((acc, curr) => acc + curr, 0);

      rows.performanceScore = 'Performance Score';
      rows.pageViews = 'Page Views';
      rows.conversions = 'Conversions';
      rows.visits = 'Visits';
      rows.bounces = 'Bounces';
      rows.lighthouse = 'Asset Success Score';
      data.performanceScore = `${PerformanceUtil.getPerformanceScore(conversions, pageViews, visits, true)}`;
      data.pageViews = pageViews > 0 ? pageViews : ' < 100';
      data.conversions = conversions > 0 ? conversions : ' < 100';
      data.visits = visits > 0 ? visits : ' < 100';
      data.bounces = bounces > 0 ? bounces : ' < 100';
      data.lighthouse = lighthouse.scores;
    }

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
  if (!url) return false;
  let protocol = '';
  if (url instanceof URL) {
    if (url.hostname === 'localhost') {
      return false;
    }
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
  const { clusterManager } = window;
  const cluster = clusterManager.get(clusterId);
  const figure = cluster.figureForCluster;
  if (!figure || !figure.dataset) return;

  const colorIdentity = cluster.getSingletonOf(ColorIdentity.type);

  if (colorIdentity && colorIdentity.topColors.length > 0) {
    figure.dataset.topColors = colorIdentity.topColors.join(',');
    figure.dataset.colorIndex = colorIdentity.colorIndex;
  }

  const altText = cluster.getAll(UrlAndPageIdentity.type, 'alt');
  const sites = cluster.getAll(UrlAndPageIdentity.type, 'site');

  figure.dataset.alt = validateAlt(altText, sites.length);
  figure.dataset.count = sites.length;

  // TODO: Different copies can have different aspect ratios.
  const identity = cluster.getFirstIdentityOf(UrlAndPageIdentity.type);
  if (identity && identity.aspectRatio) {
    const aspect = identity.aspectRatio;
    figure.dataset.aspect = aspect;
    figure.dataset.shape = getShapeForRatio(aspect);
  }

  if (window.collectingRum) {
    const pageViews = cluster.getAll(UrlAndPageIdentity.type, 'pageViews').reduce((acc, curr) => acc + curr, 0);
    const conversions = cluster.getAll(UrlAndPageIdentity.type, 'conversions').reduce((acc, curr) => acc + curr, 0);
    const visits = cluster.getAll(UrlAndPageIdentity.type, 'visits').reduce((acc, curr) => acc + curr, 0);

    const performanceScore = PerformanceUtil
      .getPerformanceScore(conversions, pageViews, visits, false);
    figure.dataset.performance = performanceScore * 1000000000 + pageViews;
    figure.dataset.views = pageViews;
    figure.dataset.visits = visits;
    figure.dataset.clicks = conversions;
  }
}

async function executePreflightFunctions(identityValues, identityState) {
  await IdentityRegistry.identityRegistry
    .identifyPreflight(identityValues, identityState);
}

async function imageOnLoad(identityValues, identityState) {
  await IdentityRegistry.identityRegistry
    .identifyPostflight(identityValues, identityState);

  const { clusterManager } = window;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { elementForCluster } = clusterManager.get(identityValues.originatingClusterId);

  canvas.width = identityValues.entryValues.width;
  canvas.height = identityValues.entryValues.height;

  ctx.drawImage(elementForCluster, 0, 0, canvas.width, canvas.height);

  identityValues.canvas = canvas;
  identityValues.ctx = ctx;

  await IdentityRegistry.identityRegistry
    .identifyPostflightWithCanvas(identityValues, identityState);
}

async function imageOnError(identityValues, identityState, error) {
  await IdentityRegistry.identityRegistry
    .identifyPostError(identityValues, identityState);

  updateFigureData(identityValues.originatingClusterId);
  // eslint-disable-next-line no-console
  console.error(`Error loading img file at ${identityValues.entryValues.href}`, error);
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
  gallery.append(cluster.figureForCluster);
  updateCounter(document.getElementById('images-counter'), 1);
  changeFilters();
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
  // eslint-disable-next-line no-await-in-loop
  await executePreflightFunctions(identityValues, identityState);
  if (clusterManager.get(originatingClusterId).id === originatingClusterId) {
    // This cluster was NOT re-clustered. Run more expensive functions.
    const imageLoaded = new Promise((resolve) => {
      loadedImg.onload = async () => {
        await imageOnLoad(identityValues, identityState)
          .then(() => {
            displayImage(originatingClusterId);
            updateFigureData(originatingClusterId);
            resolve(true);
            return true;
          });
      };
      // eslint-disable-next-line no-unused-vars
      loadedImg.onerror = async (error) => {
        await imageOnError(identityValues, identityState, error);
        resolve(true);
      };
    });

    // dont start loading the image until here.
    loadedImg.src = href;
    return imageLoaded;
  } // else
  updateFigureData(clusterManager.get(originatingClusterId).id);
  updateCounter(document.getElementById('duplicate-images-counter'), 1);
  return Promise.resolve(true);
}

async function loadImages(
  individualBatch,
  concurrency,
  selectedIdentifiers,
  domainKey,
  replacementDomain,
  submissionValues,
) {
  const { clusterManager, identityState } = window;

  // use a map to track unique images by their src attribute
  const promisePool = new PromisePool(concurrency, 'Load Images', false);
  const batchEntries = [];

  const filteredBatch = individualBatch.filter((img) => img && isUrlValid(img.origin));

  for (let i = 0; i < filteredBatch.length; i += 1) {
    const img = filteredBatch[i];

    const {
      src, origin, site, alt, width, height, aspectRatio, instance, fileType,
    } = img;

    window.imageCount += 1;
    const { imageCount } = window;
    const { href } = new URL(src, origin);
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

    const originatingClusterId = clusterManager.newCluster(
      new SitemapLoadOrderIdentity(imageCount),
      loadedImg,
      figure,
      'image',
    );

    const entryValues = {
      href,
      site,
      alt,
      width,
      height,
      aspectRatio,
      instance,
      fileType,
      domainKey,
      replacementDomain,
    };

    const identityValues = new IdentityValues(
      originatingClusterId,
      clusterManager,
      window.identityCache,
      selectedIdentifiers,
      submissionValues,
      entryValues,
    );

    batchEntries.push(originatingClusterId);

    promisePool.run(async () => {
      await identityValues.initializeIdentityHash();
      return loadImage(
        identityValues,
        identityState,
        clusterManager,
        originatingClusterId,
        loadedImg,
        href,
      );
    });
  }

  await promisePool.allSettled();

  // similarity computed per batch
  await clusterManager.detectSimilarity(batchEntries, identityState, concurrency);

  // colors updated per batch
  if (identityState[ColorIdentity.type].usedColors) {
    addColorsToFilterList(identityState[ColorIdentity.type].usedColorsSorted);
  }

  return batchEntries;
}

async function fetchPageHtml(url) {
  const req = await fetch(url, { redirect: 'manual' });
  if (req.ok) {
    return req.text();
  }
  return null;
}

function getOptimizedImageUrl(src, origin, defaultWidth) {
  const originalUrl = new URL(src, origin);
  const aemSite = AEM_EDS_HOSTS.find((h) => originalUrl.host.endsWith(h));
  if (!aemSite) {
    return src;
  }

  // Use the width from the query parameter if available, otherwise use the provided defaultWidth
  const width = originalUrl.searchParams.has('width')
    ? originalUrl.searchParams.get('width')
    : defaultWidth;

  const pictureElement = createOptimizedPicture(
    originalUrl,
    'Optimized Image',
    false,
    [
      { media: `(min-width: ${width}px)`, width: `${width}` },
      { width: `${width}` },
    ],
  );

  // Extract the URL of the best-matched <source> for this device from pictureElement
  return `.${pictureElement.querySelector('source').getAttribute('srcset')}`;
}

/**
 * Fetches image data from a page URL.
 * @param {Object} url - URL object.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchImageDataFromPage(url) {
  const html = document.createElement('div');

  try {
    // this counts on url.plain, which wont work for non eds sites.
    const rawHtml = await fetchPageHtml(url.plain);
    // everything from here to the end needs to be synchronous or the document will load.
    // TODO: innerhtml here isn't great.
    html.innerHTML = rawHtml;
    if (html) {
      const seenMap = new Map();
      const images = html.querySelectorAll('img[src]');
      const imgData = [...images].map((img) => {
        const width = img.getAttribute('width') || img.naturalWidth;
        const { origin } = new URL(url.href);
        const imgSrc = img.getAttribute('src');
        const originalUrl = new URL(imgSrc, origin);

        if (!isUrlValid(originalUrl)) {
          return null;
        }

        const src = getOptimizedImageUrl(imgSrc, origin, width);

        let instance = 1;
        if (seenMap.has(src)) {
          instance = seenMap.get(src) + 1;
        }
        seenMap.set(src, instance);

        const alt = img.getAttribute('alt') || '';
        const height = img.getAttribute('height') || img.naturalHeight;
        const aspectRatio = parseFloat((width / height).toFixed(1)) || '';
        const fileType = getFileType(imgSrc);

        return {
          site: url.href,
          origin,
          src,
          alt,
          width,
          height,
          aspectRatio,
          instance,
          fileType,
        };
      });
      return imgData;
    }
    return [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`unable to fetch ${url.href}:`, error);
    return [];
  } finally {
    html.innerHTML = '';
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
        if (!window.duplicateFilter.has(url.plain)) {
          // eslint-disable-next-line no-await-in-loop
          const imgData = await fetchImageDataFromPage(url);
          if (imgData) {
            results.push(...imgData);
            updateCounter(counter, 1);
          }
          window.duplicateFilter.add(url.plain);
        } else {
          // eslint-disable-next-line no-console
          console.debug('Duplicate URL found:', url.plain);
        }
      }
    })());
  }

  const promiseResults = await Promise.allSettled(tasks);
  promiseResults
    .filter((result) => result.status === 'rejected')
    // eslint-disable-next-line no-console
    .forEach((error) => console.error('Error processing batch', error));

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
  identifiers,
  domainKey,
  replacementDomain,
  submissionValues,
) {
  try {
    const batchData = await fetchBatch(batch, concurrency, pagesCounter);
    data.push(...batchData);

    // Display images as they are fetched
    main.dataset.canvas = true;
    results.removeAttribute('aria-hidden');
    await loadImages(
      batchData,
      concurrency,
      identifiers,
      domainKey,
      replacementDomain,
      submissionValues,
    );
    decorateIcons(gallery);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching batch:', error);
  }
}

function sortImages(doc, target) {
  const CANVAS = doc.getElementById('canvas');
  const GALLERY = CANVAS.querySelector('.gallery');
  const ACTION_BAR = CANVAS.querySelector('.action-bar');
  const SORT_ACTIONS = ACTION_BAR.querySelectorAll('input[name="sort"]');

  const type = target.value;
  const sortOrder = parseInt(target.dataset.order, 10);
  const figures = [...GALLERY.querySelectorAll('figure')];

  // Sort figures based on selected type and order
  const sorted = figures.sort((a, b) => {
    if (typeof a.dataset[type] !== 'string' || typeof b.dataset[type] !== 'string') {
      return 0;
    }

    if (a.dataset[type].includes('.') || b.dataset[type].includes('.')) {
      const aVal = parseFloat(a.dataset[type]);
      const bVal = parseFloat(b.dataset[type]);
      return sortOrder > 0 ? aVal - bVal : bVal - aVal;
    }
    const aVal = parseInt(a.dataset[type], 10);
    const bVal = parseInt(b.dataset[type], 10);
    return sortOrder > 0 ? aVal - bVal : bVal - aVal;
  });

  // Append sorted figures to the gallery
  GALLERY.append(...sorted);

  // Toggle the sort order for the next click
  target.dataset.order = sortOrder * -1;

  // Remove existing arrows from all sort options
  SORT_ACTIONS.forEach((action) => {
    const label = action.nextElementSibling;
    label.innerHTML = label.innerHTML.replace(/[\u25B2\u25BC]/g, ''); // Remove arrows
  });

  // Add the arrow to the selected sort option
  const arrow = sortOrder > 0 ? ' \u25B2' : ' \u25BC'; // Up arrow or down arrow
  target.nextElementSibling.innerHTML += arrow; // Append arrow to the label
}

/**
 * Fetches and display image data in batches.
 * @param {Object[]} urls - Array of URL objects.
 * @param {number} [batchSize = 50] - Number of URLs to fetch per batch.
 * @param {number} [concurrency = 5] - Number of concurrent fetches within each batch.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of image data objects.
 */
async function fetchAndDisplayBatches(
  urls,
  identifiers,
  domainKey,
  replacementDomain,
  submissionValues,
  batchSize = 50,
  concurrency = 5,
) {
  const data = [];
  const main = document.querySelector('main');
  const results = document.getElementById('audit-results');
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

  // Collect promises for all batches
  const promisePool = new PromisePool(concurrency, 'Handle Batches', false);
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    // Process each batch and handle the delay between batches asynchronously
    promisePool.run(async () => handleBatch(
      batch,
      concurrency, // this means each concurrent batch also gets concurrent tasks = 25.
      pagesCounter,
      data,
      main,
      results,
      imagesCounter,
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

  if (window.collectingRum) {
    sortImages(document, document.getElementById('sort-performance'));
  } else {
    sortImages(document, document.getElementById('sort-count'));
  }

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
  // TODO: AEM Classic urls too.
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
        const siteMapUrl = new URL(sitemap);
        const swap = siteMapUrl.origin;
        let originSwapped = null;
        if (!siteMapUrl.host.startsWith('localhost')) {
          originSwapped = href.replace(origin, swap);
        } else {
          originSwapped = href;
        }
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
  window.enableModals = false;
  window.imageCount = 0;
  window.clusterManager = new ClusterManager();
  window.identityState = {};
  window.duplicateFilter = new Set();
  window.lastExecutionTime = Date.now();
  window.identityCache = IdentityRegistry.identityRegistry.identityCache;
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
  window.enableModals = true;
}

async function processForm(sitemap, identifiers, domainKey, replacementDomain, submissionValues) {
  prepareLoading();
  const colorPaletteContainer = document.getElementById('color-pallette');
  colorPaletteContainer.innerHTML = ''; // Clear the container

  document.querySelectorAll('dialog').forEach((dialog) => { dialog.remove(); });

  const urls = await fetchSitemap(sitemap);
  // await fetchAndDisplayBatches(urls.slice(8000, 8100));
  await fetchAndDisplayBatches(urls, identifiers, domainKey, replacementDomain, submissionValues);
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

function registerListeners(doc) {
  const URL_FORM = doc.getElementById('site-form');
  const CANVAS = doc.getElementById('canvas');
  const GALLERY = CANVAS.querySelector('.gallery');
  const DOWNLOAD = doc.getElementById('download-report');
  const ACTION_BAR = CANVAS.querySelector('.action-bar');
  const SORT_ACTIONS = ACTION_BAR.querySelectorAll('input[name="sort"]');
  const FILTER_ACTIONS = ACTION_BAR.querySelectorAll('input[name="filter"]');
  // Function to populate the dropdown with reports

  window.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      const savedData = JSON.parse(localStorage.getItem('sitemapForm'));
      if (savedData) {
        Object.keys(savedData).forEach((key) => {
          const input = document.querySelector(`[name="${key}"]`);
          if (input) {
            input.value = savedData[key];
          }
        });
      }
    });
  });

  // handle form submission
  URL_FORM.addEventListener('submit', async (e) => {
    e.preventDefault();
    // clear all sorting and filters
    // eslint-disable-next-line no-return-assign
    [...SORT_ACTIONS, ...FILTER_ACTIONS].forEach((action) => action.checked = false);
    const data = getFormData(e.srcElement);
    const url = data['site-url'];
    const urlType = extractUrlType(url);

    const sitemapForm = doc.getElementById('identity-selectors');
    const identificationActions = sitemapForm.querySelectorAll('input[type="checkbox"]');

    const rumDiv = doc.getElementById('collecting-rum');
    const domainKey = data['domain-key'];
    if (domainKey) {
      window.collectingRum = true;
      rumDiv.setAttribute('aria-hidden', false);
      rumDiv.setAttribute('class', 'form-field radio-field');
    } else {
      window.collectingRum = false;
      doc.getElementById('collecting-rum').setAttribute('aria-hidden', true);
      rumDiv.removeAttribute('class');
    }

    const replacementDomain = data['replacement-domain'];
    const identifiers = new Set([...identificationActions]
      .filter((a) => a.checked)
      .map((a) => a.value));

    if (identifiers.has(ColorIdentity.type)) {
      doc.getElementById('color-sort').removeAttribute('aria-hidden');
      doc.getElementById('color-pallette-container').removeAttribute('aria-hidden');
    } else {
      doc.getElementById('color-sort').setAttribute('aria-hidden', true);
      doc.getElementById('color-pallette-container').setAttribute('aria-hidden', true);
    }

    if (urlType?.includes('sitemap')) {
      // fetch sitemap
      localStorage.setItem('sitemapForm', JSON.stringify(data));
      const sitemap = urlType === 'sitemap' ? url : writeSitemapUrl(url);
      processForm(sitemap, identifiers, domainKey, replacementDomain, data);
    }
  });

  // handle gallery clicks to display modals
  GALLERY.addEventListener('click', (e) => {
    const figure = e.target.closest('figure');

    if (figure && window.enableModals) displayModal(figure);
  });

  // handle csv report download
  DOWNLOAD.addEventListener('change', async () => {
    const selectedReport = DOWNLOAD.value;
    if (!selectedReport) return;

    // eslint-disable-next-line new-cap
    const report = ReportRegistry.getReport(selectedReport);
    if (!report) return;

    // Start the pulse animation before running the report
    DOWNLOAD.classList.add('download-pulse');

    // Generate the report asynchronously
    const reportData = await report.generateReport(window.clusterManager);

    if (reportData.size > 0) {
      // Get site from the sitemap.
      const csv = reportData.blob;
      const link = document.createElement('a');
      const data = getFormData(URL_FORM);
      const site = data['site-url']?.hostname;
      const url = URL.createObjectURL(csv);

      // Insert the link to enable the download
      link.setAttribute('href', url);
      link.setAttribute('download', `${site ? `${site.replace('.', '_')}_` : ''}${report.name.toLowerCase().replace(' ', '_')}.csv`);
      link.style.display = 'none';
      DOWNLOAD.insertAdjacentElement('afterend', link);

      // Trigger the download and remove pulse class once download starts
      setTimeout(() => {
        link.click(); // Start the download
        link.remove(); // Clean up the link after download starts
        DOWNLOAD.classList.remove('download-pulse'); // Stop the pulsing effect
        DOWNLOAD.value = ''; // Reset the dropdown value
      }, 2000); // Wait for 2 seconds before starting the download (pulse duration)
    }
  });

  SORT_ACTIONS.forEach((action) => {
    action.addEventListener('click', (e) => {
      const { target } = e;
      sortImages(doc, target);
    });
  });

  FILTER_ACTIONS.forEach((action) => addFilterAction(action, doc));
}

function addReportsToDropdown(doc) {
  const dropdown = doc.getElementById('download-report');

  // Clear any existing options
  dropdown.innerHTML = '';

  // Add the default placeholder option
  const defaultOption = doc.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select a report to download';
  dropdown.appendChild(defaultOption);

  // Get the reports (assuming ReportRegistry.getReports() returns an array of report classes)
  const reports = ReportRegistry.getReports();

  // Add the report options
  reports.forEach((report) => {
    const option = doc.createElement('option');
    option.value = report.id;
    option.textContent = report.uiName;
    dropdown.appendChild(option);
  });
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
addReportsToDropdown(document);

window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', event.reason);
  // Custom error handling here
});
