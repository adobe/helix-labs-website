/* eslint-disable class-methods-use-this */
import { buildModal } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/aem.js';

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

/**
 * Filters out duplicate images and compiles unique image data.
 * @param {Object[]} data - Array of image data objects.
 * @returns {Object[]} Array of unique image data objects.
 */
function findUniqueImages(data) {
  // use a map to track unique images by their src attribute
  const unique = new Map();
  data.forEach((img) => {
    const {
      src, origin, site, alt, width, height, aspectRatio, fileType,
    } = img;
    // if the image src is not already in the map, init a new entry
    if (!unique.has(src)) {
      unique.set(src, {
        src,
        origin,
        count: 0,
        site: [],
        alt: [],
        width,
        height,
        aspectRatio,
        fileType,
      });
    }
    // update the existing entry with additional image data
    const entry = unique.get(src);
    entry.count += 1;
    entry.site.push(site);
    entry.alt.push(alt);
  });
  // convert the map values to an array
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

  // reset counters
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

  // initialize concurrent tasks
  for (let i = 0; i < urls.length; i += batchSize) {
    // get the next batch of URLs
    const batch = urls.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    const batchData = await fetchBatch(batch, concurrency, pagesCounter);
    data.push(...batchData);

    // display images as they are fetched
    main.dataset.canvas = true;
    results.removeAttribute('aria-hidden');

    const uniqueBatchData = findUniqueImages(data);
    window.audit = uniqueBatchData;
    updateCounter(imagesCounter, uniqueBatchData.length);
    displayImages(uniqueBatchData);
    decorateIcons(gallery);

    if (i + batchSize < urls.length) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { // wait before continuing to the next batch
        setTimeout(resolve, delay);
      });
    }

    batchData.length = 0;
  }
  data.length = 0;

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
      return allUrls;
    }
    if (xml.querySelector('url')) {
      const urls = [...xml.querySelectorAll('url loc')].map((loc) => {
        const { href, origin } = new URL(loc.textContent.trim());
        const originSwapped = href.replace(origin, new URL(sitemap).origin);
        const plain = `${originSwapped.endsWith('/') ? `${originSwapped}index` : originSwapped}.plain.html`;
        return { href: originSwapped, plain };
      });
      return urls;
    }
  }
  return [];
}

/* setup */
async function processForm(sitemap) {
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

  FILTER_ACTIONS.forEach((action) => {
    action.addEventListener('change', () => {
      const checked = [...FILTER_ACTIONS].filter((a) => a.checked).map((a) => a.value);
      const figures = [...GALLERY.querySelectorAll('figure')];

      figures.forEach((figure) => {
        const hasAlt = figure.dataset.alt === 'true';
        const aspect = parseFloat(figure.dataset.aspect, 10);
        // eslint-disable-next-line no-nested-ternary
        const shape = aspect === 1 ? 'square'
          // eslint-disable-next-line no-nested-ternary
          : aspect < 1 ? 'portrait'
            : aspect > 1.7 ? 'widescreen' : 'landscape';

        let hide = true; // hide figures by default

        // check images against filter critera
        if (checked.includes('missing-alt') && !checked.some((f) => f !== 'missing-alt')) { // only 'missing-alt' is selected
          // only show figures without alt text
          hide = hasAlt;
        } else if (checked.includes('missing-alt') && checked.some((f) => f !== 'missing-alt')) { // 'missing-alt' is selected along with shape(s)
          // show figures without alt text that match any selected shape(s)
          hide = !(checked.includes(shape) && !hasAlt);
        } else if (!checked.includes('missing-alt') && checked.includes(shape)) { // only shapes are selected
          // show figures that match the selected shape(s)
          hide = false;
        } else if (checked.length === 0) { // no filters are selected
          // show all figures
          hide = false;
        }
        figure.setAttribute('aria-hidden', hide);
      });
    });
  });
}

registerListeners(document);
