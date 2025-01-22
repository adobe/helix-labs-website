import { initConfigField, updateConfig } from '../../utils/config/config.js';
import loadingMessages from './loading-messages.js';

const FORM = document.getElementById('status-form');
const TABLE = document.querySelector('table');
const CAPTION = TABLE.querySelector('caption');
const RESULTS = TABLE.querySelector('.results');
const ERROR = TABLE.querySelector('.error');
const FILTER = document.getElementById('status-filter');
const DOWNLOADCSV = document.getElementById('download-csv');
const ORG = document.getElementById('org');
const TOGGLE_ALL = document.getElementById('toggle-all');
let intervalId;
const oneSecondFunction = () => loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

// utility functions
/**
 * Creates debounced version of provided function.
 * @param {Function} func - Function to debounce.
 * @param {number} wait - Time to delay function execution (in ms).
 * @returns {Function} New function that will debounce original function when invoked.
 */
function debounce(func, wait) {
  let timeout;
  // eslint-disable-next-line func-names
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Validates and normalizes path string.
 * @param {string} path - Path to validate and normalize.
 * @returns {string} Validated and normalized path.
 */
function validatePath(path) {
  if (!path) return '/*';
  let str = path;
  // isolate path from non-path segments
  if (str.includes('://')) {
    [str] = path.split('://');
  }
  if (str.includes('/')) {
    str = str.substring(str.indexOf('/'));
  } else {
    str = '/';
  }
  // ensure path starts with "/"
  str = str.startsWith('/') ? str : `/${str}`;
  // add "*" if path ends with "/"
  if (str.endsWith('/')) {
    str += '*';
  }
  return str;
}

// url params
/**
 * Updates URL query params with job name.
 * @param {string} job - Job name.
 */
function updateJobParam(job) {
  const url = new URL(window.location.href);
  url.searchParams.set('job', encodeURIComponent(job));
  window.history.replaceState({}, document.title, url.href);
}

/**
 * Removes the job param from URL.
 */
function removeJobParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete('job');
  window.history.replaceState({}, '', url);
}

// date management
/**
 * Pads a number with a leading 0 if necessary, returning a two-character string.
 * @param {number} number - Number.
 * @returns {string} Padded number.
 */
function pad(number) {
  return number.toString().padStart(2, '0');
}

/**
 * Converts Date string to a formatted UTC date and time string.
 * @param {string} d - Date string.
 * @returns {string} UTC date and time in "MM/DD/YYYY HH:MM UTC" format.
 */
function toUTCDate(d) {
  const date = new Date(d);
  const dd = pad(date.getUTCDate());
  const mm = pad(date.getUTCMonth() + 1);
  const yyyy = date.getUTCFullYear();
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${mm}/${dd}/${yyyy} ${hours}:${minutes}`;
}

// loading button management
/**
 * Displays loading spinner in button.
 * @param {HTMLButtonElement} button - Button element.
 */
function showLoadingButton(button) {
  button.disabled = true;
  // preserves original size of the button
  const { width, height } = button.getBoundingClientRect();
  button.style.minWidth = `${width}px`;
  button.style.minHeight = `${height}px`;
  // stores original button text content
  button.dataset.label = button.textContent;
  button.innerHTML = '<i class="symbol symbol-loading"></i>';
}

/**
 * Resets button from loading state back to original appearance and content.
 * @param {HTMLButtonElement} button - Button element.
 */
function resetLoadingButton(button) {
  button.textContent = button.dataset.label;
  button.removeAttribute('style');
  button.disabled = false;
}

// form management
/**
 * Returns FormData object from given form element.
 * @param {HTMLFormElement} form - Form element.
 * @returns {FormData} Form data object.
 */
function getFormData(form) {
  return new FormData(form);
}

/**
 * Disables all form elements within specified form.
 * @param {HTMLFormElement} form - Form element.
 * @param {HTMLFormElement} button - Form's submit button.
 */
function disableForm(form, button) {
  showLoadingButton(button);
  [...form.elements].forEach((el) => {
    el.disabled = true;
  });
  DOWNLOADCSV.classList.remove('outline');
  DOWNLOADCSV.classList.add('disabled');
}

/**
 * Enables all form elements within specified form.
 * @param {HTMLFormElement} form - Form element.
 * @param {HTMLFormElement} button - Form's submit button.
 */
function enableForm(form, button) {
  resetLoadingButton(button);
  [...form.elements].forEach((el) => {
    el.disabled = false;
  });
  DOWNLOADCSV.classList.add('outline');
  DOWNLOADCSV.classList.remove('disabled');
}

// table management
/**
 * Updates table caption with provided timestamp.
 * @param {string} time - Timestamp.
 */
function updateTableCaption(time) {
  const asOf = CAPTION.querySelector('.as-of');
  asOf.textContent = toUTCDate(time);
  CAPTION.setAttribute('aria-hidden', false);
}

/**
 * Updates visibility of specific table sections based on display state.
 * @param {string} show - Class name of table section to display.
 */
function updateTableDisplay(show) {
  // loop through tbodies and hide based on the show param
  if (show === 'loading') {
    const div = TABLE.querySelector('.loading > tr > td > div');
    const p = document.createElement('p');
    div.appendChild(p);
    intervalId = setInterval(() => { p.innerHTML = oneSecondFunction(); }, 5000);
  } else if (intervalId) {
    clearInterval(intervalId);
  }
  TABLE.querySelectorAll('tbody').forEach((tbody) => {
    tbody.setAttribute('aria-hidden', show !== tbody.className);
  });

  FILTER.value = '';
  // disable filter if not showing results
  FILTER.disabled = show !== 'results';
}

/**
 * Clears all content within a specified table body.
 * @param {HTMLElement} table - Table body element.
 */
function clearTable(table) {
  CAPTION.setAttribute('aria-hidden', true);
  table.innerHTML = '';
  updateTableDisplay('no-results');
}

/**
 * Updates table to display error message based on HTTP error code.
 * @param {number} status - HTTP error status code.
 * @param {string} preview - Hostname for preview environment.
 * @param {string} site - Site name within org.
 */
function updateTableError(status, preview, site) {
  const messages = {
    400: 'The request for page status could not be processed.',
    401: `<a href="https://${preview}" target="_blank">Sign in to the ${site} project sidekick</a> 
      to view the status.`,
    403: 'Insufficient permissions to view page status.',
    404: 'Page status could not be found.',
    Project: `${site} project not found.`,
    Job: 'Unable to create page status job.',
    Resource: `No page status information found for ${site}`,
  };

  const text = messages[status] || 'Unable to display page status.';
  const title = ERROR.querySelector('strong');
  const message = ERROR.querySelector('p:last-of-type');
  title.textContent = `${status} Error`;
  message.innerHTML = text;
  CAPTION.setAttribute('aria-hidden', true);
  updateTableDisplay('error');
}

/**
 * Creates anchor element with the specified text and url.
 * @param {string} text - Text to display inside anchor tag.
 * @param {string} url - Base URL for anchor's `href`.
 * @param {string} path - Path to append to base URL.
 * @returns {HTMLAnchorElement} Anchor element.
 */
function buildLink(text, url, path) {
  const a = document.createElement('a');
  a.href = `https://${url}${path}`;
  a.target = '_blank';
  a.textContent = toUTCDate(text);
  return a;
}

/**
 * Builds sequence element based on validity and sequence of edit, preview, and publish dates.
 * @param {string} edit - Edit date.
 * @param {string} preview - Preview date.
 * @param {string} publish - Publish date.
 * @returns {HTMLSpanElement} Status light element indicating status and sequence.
 */
function buildSequenceStatus(edit, preview, publish) {
  // check if a date is valid
  const date = (d) => !Number.isNaN(d.getTime());
  const editDate = new Date(edit);
  const previewDate = new Date(preview);
  const publishDate = new Date(publish);
  const inSequence = (editDate <= previewDate && previewDate <= publishDate);
  const span = document.createElement('span');
  span.className = 'status-light';
  let status;
  if (!date(editDate)) {
    status = 'No source';
    span.classList.add('negative');
  } else if (date(editDate) && !date(previewDate) && !date(publishDate)) {
    status = 'Not previewed';
    span.classList.add('positive');
  } else if (
    date(editDate)
    && date(previewDate)
    && !date(publishDate)
    && editDate <= previewDate
  ) {
    status = 'Not published';
    span.classList.add('positive');
  } else {
    status = inSequence ? 'Current' : 'Pending Changes';
    span.classList.add('positive');
  }
  span.textContent = status;
  return span;
}

/**
 * Builds row (`<tr>`) element with resource path, status, and modification timestamps.
 * @param {Object} resource - Resource object containing metadata.
 * @param {string} live - Base URL for live links.
 * @param {string} preview - Base URL for preview links.
 * @param {string} resource.path - The resource's path.
 * @returns {HTMLTableRowElement|null} `<tr>` element for resource, or `null` if no `path`.
 */
function buildResource(resource, live, preview, site) {
  const {
    path,
    sourceLastModified,
    previewLastModified,
    publishLastModified,
  } = resource;

  console.log(resource);
  const ignore = ['/helix-env.json', '/sitemap.json'];
  if (path && !ignore.includes(path)) {
    const row = document.createElement('tr');
    const status = buildSequenceStatus(
      sourceLastModified,
      previewLastModified,
      publishLastModified,
    );
    const cols = [
      site,
      path,
      status,
      sourceLastModified ? toUTCDate(sourceLastModified) : '-',
      previewLastModified ? buildLink(previewLastModified, preview, path) : '-',
      publishLastModified ? buildLink(publishLastModified, live, path) : '-',
    ];
    cols.forEach((col) => {
      const cell = document.createElement('td');
      if (typeof col === 'string') cell.textContent = col;
      else cell.append(col);
      row.append(cell);
    });
    return row;
  }
  return null;
}

/**
 * Displays list of resources by building and appending table rows.
 * @param {Object[]} resources - Array of resource objects.
 * @param {string} live - Base URL for live links.
 * @param {string} preview - Base URL for preview links.
 */
function displayResources(resources, live, preview, site) {
  resources.forEach((resource) => {
    const row = buildResource(resource, live, preview, site);
    if (row) RESULTS.append(row);
  });
}

// data fetching
/**
 * Fetches the live and preview host URLs for org/site.
 * @param {string} org - Organization name.
 * @param {string} site - Site name within org.
 * @returns {Promise<>} Object with `live` and `preview` hostnames.
 */
async function fetchHosts(org, site) {
  try {
    const url = `https://admin.hlx.page/status/${org}/${site}/main`;
    const res = await fetch(url);
    if (!res.ok) throw res;
    const json = await res.json();
    return {
      live: new URL(json.live.url).host,
      preview: new URL(json.preview.url).host,
    };
  } catch (error) {
    return {
      live: null,
      preview: null,
    };
  }
}

/**
 * Validates the live and preview host config for org/site.
 * @param {string} org - Organization name.
 * @param {string} site - Site name within org.
 * @returns {Promise<>} Object with `live` and `preview` hostnames.
 */
async function validateHosts(org, site) {
  const { live, preview } = await fetchHosts(org, site);
  if (!live || !preview) {
    throw new Error(`Invalid project configuration for ${org}/${site}`);
  }
  return { live, preview };
}

/**
 * Fetches job URL for page status admin operation.
 * @param {string} org - Organization name.
 * @param {string} site - Site name within org.
 * @param {string} path - Path to validate and include in request payload.
 * @returns {Promise<string|null>} Job URL if job is successfully created, or `null` if error.
 */
async function fetchJobUrl(org, site, path) {
  console.log('fetching job url for site:', org, site, path);
  try {
    const options = {
      body: JSON.stringify({
        paths: [validatePath(path)],
        select: ['edit', 'preview', 'live'],
      }),
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    };
    const res = await fetch(
      `https://admin.hlx.page/status/${org}/${site}/main/*`,
      options,
    );
    if (!res.ok) throw res;
    const json = await res.json();
    if (!json.job || json.job.state !== 'created') {
      const error = new Error();
      error.status = 'Job';
      throw error;
    }
    // update url param with job
    // if (json.job.name) updateJobParam(json.job.name);
    return json.links ? json.links.self : null;
  } catch (error) {
    updateTableError(error.status, null, `${org}/${site}${path}`);
    return null;
  }
}

/**
 * Polls job URL then fetches additional details and returns job resources.
 * @param {string} url - Job URL.
 * @param {number} [retry=2000] - Delay (in ms) between polling attempts.
 * @returns {Promise<Object[]>} Array of resources.
 */
async function runJob(url, retry = 2000) {
  try {
    const jobRes = await fetch(url, { mode: 'cors' });
    if (!jobRes.ok) throw jobRes;
    const { state } = await jobRes.json();
    if (state !== 'completed' && state !== 'stopped') {
      await new Promise((resolve) => { setTimeout(resolve, retry); }); // wait before repolling
      return runJob(url, retry); // poll again
    }
    const detailsRes = await fetch(`${url}/details`, { mode: 'cors' });
    if (!detailsRes.ok) throw detailsRes;
    const { data, createTime } = await detailsRes.json();
    // update table caption with create time
    if (createTime) updateTableCaption(createTime);
    return data ? data.resources : [];
  } catch (error) {
    updateTableError(error.status);
    return [];
  }
}

/**
 * Executes status job.
 * @param {string} jobUrl - Job URL.
 * @param {string} live - Base URL for live resources.
 * @param {string} preview - Base URL for preview resources.
 * @returns {Promise<>} Promise that resolves once job has run and results are displayed.
 */
async function runAndDisplayJob(jobUrl, live, preview, site) {
  const paths = await runJob(jobUrl);
  if (!paths || paths.length === 0) {
    throw new Error('No page status data found.');
  }
  displayResources(paths, live, preview, site);
  updateTableDisplay('results');
}

/**
 * Prepares form and table for status job.
 * @param {HTMLFormElement} form - Form element to be disabled.
 * @param {HTMLButtonElement} button - Submit button on form.
 */
function setupJob(form, button) {
  disableForm(form, button);
}

function downloadCSVFile(csvData) {
  // Create a Blob from the CSV data
  const csvBlob = new Blob([csvData], { type: 'text/csv' });

  // Create a temporary link element
  const tempLink = document.createElement('a');
  tempLink.href = URL.createObjectURL(csvBlob);
  tempLink.download = 'page-status.csv';

  // Append the link to the document, trigger the download, and remove the link
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}

async function addSitesToSiteList(org) {
  const resp = await fetch(`https://admin.hlx.page/config/${org}/sites.json`);
  const json = await resp.json();
  const siteList = document.getElementById('site-list-checkboxes');
  siteList.innerHTML = '';
  json.sites.forEach((site) => {
    const label = document.createElement('label');
    label.textContent = site.name;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = site.name;
    checkbox.name = 'site';
    checkbox.id = `site-${site.name}`;
    label.prepend(checkbox);
    siteList.append(label);
  });
}

function init() {
  initConfigField();

  TOGGLE_ALL.addEventListener('change', () => {
    const sites = document.querySelectorAll('input[name="site"][type="checkbox"]');
    sites.forEach((site) => {
      site.checked = TOGGLE_ALL.checked;
    });
  });

  ORG.addEventListener('change', () => {
    addSitesToSiteList(ORG.value);
  });

  FORM.addEventListener('reset', () => {
    clearTable(RESULTS);
  });

  FORM.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { target, submitter } = e;
    const checked = FORM.querySelectorAll('input[name="site"]:checked');
    const sites = [...checked].map((c) => c.value);

    while (sites.length > 0) {
      const site = sites.shift();
      try {
        // initial setup
        const formData = getFormData(target);
        setupJob(target, submitter);
        const org = formData.get('org');
        const path = formData.get('path');
        // fetch host config
        // eslint-disable-next-line no-await-in-loop
        const { live, preview } = await validateHosts(org, site);
        updateConfig();
        // fetch page status and display results
        // eslint-disable-next-line no-await-in-loop
        const jobUrl = await fetchJobUrl(org, site, path);
        if (!jobUrl) throw new Error('Failed to create page status job.');
        // eslint-disable-next-line no-await-in-loop
        await runAndDisplayJob(jobUrl, live, preview, site);
      } catch (error) {
        console.error('error running job for site:', site, error);
        updateTableError('Job');
        removeJobParam();
      } finally {
        enableForm(target, submitter);
      }
    }
  });

  DOWNLOADCSV.addEventListener('click', () => {
    let csvData = [];
    // Get the header data
    const headers = [];
    const headerCols = TABLE.querySelector('thead').querySelectorAll('tr > th');
    for (let i = 0; i < headerCols.length; i += 1) {
      headers.push(headerCols[i].textContent);
    }
    csvData.push(headers.join(','));
    // Get each row data
    const rows = RESULTS.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i += 1) {
      // Get each column data
      const cols = rows[i].querySelectorAll('td,th');

      // Stores each csv row data
      const csvrow = [];
      for (let j = 0; j < cols.length; j += 1) {
        // Get the text data of each cell of
        // a row and push it to csvrow

        if (cols[j].querySelector('a')) {
          // eslint-disable-next-line prefer-destructuring
          const textContent = cols[j].querySelector('a').textContent;
          const date = new Date(textContent);
          csvrow.push(date.toString());
        } else {
          // eslint-disable-next-line prefer-destructuring
          const textContent = cols[j].textContent;
          if (textContent.includes(':')) {
            const date = new Date(textContent);
            csvrow.push(date.toString());
          } else csvrow.push(cols[j].textContent);
        }
      }

      // Combine each column value with comma
      csvData.push(csvrow.join(','));
    }
    // Combine each row data with new line character
    csvData = csvData.join('\n');
    downloadCSVFile(csvData);
  });

  // enable table results filtering
  const filterTable = debounce((e) => {
    const filter = e.target.value.toLowerCase();
    [...RESULTS.children].forEach((row) => {
      const cells = [...row.children];
      const match = cells.find((c) => {
        const text = c.textContent.toLowerCase();
        return text.includes(filter);
      });
      row.setAttribute('aria-hidden', !match);
    });
  }, 300);
  FILTER.addEventListener('input', filterTable);

  FILTER.closest('form').addEventListener('submit', (e) => e.preventDefault());
}

/**
 * Executes status job based on params from search query string.
 * @param {string} search - URL search string.
 * @returns {Promise<>} Promise that resolves when job execution is complete.
 */
async function runFromParams(search) {
  const params = new URLSearchParams(search);
  if (params && params.size > 0) {
    const org = params.get('org');
    const site = params.get('site');
    const job = params.get('job');
    if (org && site && job) {
      try {
        // initial setup
        setupJob(FORM, FORM.querySelector('button'));
        // fetch host config
        const { live, preview } = await validateHosts(org, site);
        updateConfig();
        // fetch page status and display results
        const jobUrl = `https://admin.hlx.page/job/${org}/${site}/main/status/${job}`;
        await runAndDisplayJob(jobUrl, live, preview, site);
        updateJobParam(job);
      } catch (error) {
        updateTableError('Job');
        removeJobParam();
      } finally {
        enableForm(FORM, FORM.querySelector('button'));
      }
    } else {
      removeJobParam();
    }
  }
}

init();
runFromParams(window.location.search);
