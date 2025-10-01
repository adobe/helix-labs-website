/* eslint-disable no-await-in-loop */
/* eslint-disable no-alert */
/* eslint-disable no-console */
import { ensureLogin } from '../../blocks/profile/profile.js';
import { initConfigField, updateConfig } from '../../utils/config/config.js';

const CONFIG = {
  CORS_PROXY_URL: 'https://little-forest-58aa.david8603.workers.dev/',
  QUERY_LIMIT: 512,
  DEFAULT_STORAGE: 'indexeddb',
  DEFAULT_MODE: 'sitemap',
  AEM_BASE_URL: 'https://main--{site}--{org}.aem.live',
  MEDIA_LIBRARY_READY_EVENT: 'media-library-ready',
  STORAGE_TYPES: {
    INDEXED_DB: 'indexeddb',
    NONE: 'none',
  },
  MODES: {
    SITEMAP: 'sitemap',
    QUERY_INDEX: 'queryindex',
    CUSTOM: 'custom',
  },
};

const SELECTORS = {
  MEDIA_LIBRARY: '#media-library',
  ORG_INPUT: '#org',
  SITE_INPUT: '#site',
  MODE_INPUT: '#mode',
  SITEMAP_INPUT: '#sitemap-url',
  STORAGE_OPTION: '#storage-option',
  START_SCAN_BUTTON: '#start-new-scan',
  LOAD_BUTTON: '#load-media',
  CLEAR_BUTTON: '#clear-data',
  SITEMAP_FIELD: '#sitemap-field',
  MEDIA_CONFIG_FORM: '#media-config-form',
};

const domCache = {
  mediaLibrary: null,
  orgInput: null,
  siteInput: null,
  modeInput: null,
  sitemapInput: null,
  storageOption: null,
  startScanButton: null,
  loadButton: null,
  clearButton: null,
  sitemapField: null,
  form: null,

  init() {
    this.mediaLibrary = document.querySelector(SELECTORS.MEDIA_LIBRARY);
    this.orgInput = document.querySelector(SELECTORS.ORG_INPUT);
    this.siteInput = document.querySelector(SELECTORS.SITE_INPUT);
    this.modeInput = document.querySelector(SELECTORS.MODE_INPUT);
    this.sitemapInput = document.querySelector(SELECTORS.SITEMAP_INPUT);
    this.storageOption = document.querySelector(SELECTORS.STORAGE_OPTION);
    this.startScanButton = document.querySelector(SELECTORS.START_SCAN_BUTTON);
    this.loadButton = document.querySelector(SELECTORS.LOAD_BUTTON);
    this.clearButton = document.querySelector(SELECTORS.CLEAR_BUTTON);
    this.sitemapField = document.querySelector(SELECTORS.SITEMAP_FIELD);
    this.form = document.querySelector(SELECTORS.MEDIA_CONFIG_FORM);
  },
};

function getFormData() {
  return {
    org: domCache.orgInput?.value?.trim() || '',
    site: domCache.siteInput?.value?.trim() || '',
    mode: domCache.modeInput?.value || CONFIG.DEFAULT_MODE,
    customUrl: domCache.sitemapInput?.value?.trim() || '',
  };
}

function validateRequiredFields(data) {
  if (!data.org || !data.site) {
    throw new Error('Please fill in Organization and Site fields');
  }

  if (data.mode === CONFIG.MODES.CUSTOM && !data.customUrl) {
    throw new Error('Please enter a custom sitemap URL');
  }
}

function createSiteKey(org, site, mode) {
  return `${org}/${site}/${mode}`;
}

function getStorageType() {
  return domCache.storageOption?.value || CONFIG.DEFAULT_STORAGE;
}

function handleError(error) {
  const message = error.message || 'Unknown error occurred';
  alert(`Error: ${message}`);
}

function setupStorageManager(mediaLibrary, siteKey) {
  if (mediaLibrary.storageManager) {
    mediaLibrary.storageManager.siteKey = siteKey;
    mediaLibrary.storageManager.dbName = siteKey ? `media_${mediaLibrary.storageManager.normalizeSiteKey(siteKey)}` : 'MediaLibrary';
  }
}

function updateButtonsVisibility(show) {
  const display = show ? 'inline-block' : 'none';
  domCache.loadButton.style.display = display;
  domCache.clearButton.style.display = display;
}

function setMediaLibraryAttributes(mediaLibrary, siteKey, storageType) {
  mediaLibrary.siteKey = siteKey;
  mediaLibrary.setAttribute('site-key', siteKey);
  mediaLibrary.setAttribute('data-site-key', siteKey);

  if (mediaLibrary.storage !== storageType) {
    mediaLibrary.storage = storageType;
    mediaLibrary.setAttribute('storage', storageType);
  }
}

async function initializeMediaLibrary(mediaLibrary, storageType) {
  try {
    await mediaLibrary.initialize();

    if (mediaLibrary.storageManager
        && mediaLibrary.storageManager.type === CONFIG.STORAGE_TYPES.NONE) {
      if (mediaLibrary.storageManager.clearAllSites) {
        await mediaLibrary.storageManager.clearAllSites();
      }
      mediaLibrary.storage = storageType;
      await mediaLibrary.initialize();
    }
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function updateButtonVisibility() {
  if (domCache.storageOption.value !== CONFIG.STORAGE_TYPES.INDEXED_DB) {
    updateButtonsVisibility(false);
    return;
  }

  try {
    if (!domCache.mediaLibrary?.storageManager) {
      updateButtonsVisibility(false);
      return;
    }

    const formData = getFormData();
    if (!formData.org || !formData.site || !formData.mode) {
      updateButtonsVisibility(false);
      return;
    }

    const siteKey = createSiteKey(formData.org, formData.site, formData.mode);
    setupStorageManager(domCache.mediaLibrary, siteKey);

    const normalizedSiteKey = domCache.mediaLibrary.storageManager.normalizeSiteKey(siteKey);
    const dbName = `media_${normalizedSiteKey}`;

    try {
      const databases = await indexedDB.databases();
      const dbExists = databases.some((db) => db.name === dbName);

      if (dbExists) {
        const existingData = await domCache.mediaLibrary.storageManager.load();
        const hasData = existingData && existingData.length > 0;
        updateButtonsVisibility(hasData);
      } else {
        updateButtonsVisibility(false);
      }
    } catch (error) {
      updateButtonsVisibility(false);
    }
  } catch (error) {
    updateButtonsVisibility(false);
  }
}

async function fetchSitemap(sitemapURL) {
  const fetchUrl = `${CONFIG.CORS_PROXY_URL}?url=${encodeURIComponent(sitemapURL)}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Not found: ${sitemapURL}`);
    throw new Error('Failed on initial fetch of sitemap.', res.status);
  }

  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const urls = [];

  const sitemapLocs = doc.querySelectorAll('sitemap > loc');
  const sitemapPromises = Array.from(sitemapLocs).map(async (loc) => {
    const liveUrl = new URL(loc.textContent);
    return fetchSitemap(liveUrl);
  });
  const sitemapResults = await Promise.all(sitemapPromises);
  sitemapResults.forEach((result) => {
    urls.push(...result);
  });

  const urlLocs = doc.querySelectorAll('url > loc');
  for (let i = 0; i < urlLocs.length; i += 1) {
    const loc = urlLocs[i];
    const url = new URL(loc.textContent);
    urls.push(url);
  }

  return urls;
}

async function fetchQueryIndex(indexUrl) {
  const limit = CONFIG.QUERY_LIMIT;
  let offset = 0;
  let more = true;
  const urls = [];

  do {
    let res;
    try {
      res = await fetch(`${CONFIG.CORS_PROXY_URL}?url=${encodeURIComponent(indexUrl)}?offset=${offset}&limit=${limit}`);
    } catch (err) {
      throw new Error('Failed on initial fetch of index.', err);
    }

    if (!res.ok) {
      throw new Error(`Not found: ${indexUrl}`);
    }
    const json = await res.json();
    offset += limit;
    more = json.data.length > 0;
    const newUrls = json.data.map((item) => {
      const path = item.path || item.Path;
      return new URL(path, indexUrl);
    });
    urls.push(...newUrls);
  } while (more);

  return urls;
}

async function waitForMediaLibraryReady(mediaLibrary) {
  return new Promise((resolve) => {
    if (mediaLibrary.ready) {
      resolve();
      return;
    }

    const handleReady = () => {
      mediaLibrary.removeEventListener(CONFIG.MEDIA_LIBRARY_READY_EVENT, handleReady);
      resolve();
    };

    mediaLibrary.addEventListener(CONFIG.MEDIA_LIBRARY_READY_EVENT, handleReady);
  });
}

export async function setupMediaLibrary() {
  await customElements.whenDefined('media-library');

  if (domCache.mediaLibrary) {
    domCache.mediaLibrary.corsProxy = CONFIG.CORS_PROXY_URL;
  }
}

async function discoverAEMContent(org, site, mode, customUrl = null) {
  try {
    let sitemapUrl;

    if (mode === CONFIG.MODES.CUSTOM && customUrl) {
      sitemapUrl = customUrl;
    } else {
      const baseUrl = CONFIG.AEM_BASE_URL.replace('{site}', site).replace('{org}', org);
      if (mode === CONFIG.MODES.QUERY_INDEX) {
        sitemapUrl = `${baseUrl}/query-index.json`;
      } else {
        sitemapUrl = `${baseUrl}/sitemap.xml`;
      }
    }

    if (sitemapUrl.endsWith('.json')) {
      const fetchedUrls = await fetchQueryIndex(sitemapUrl);
      return fetchedUrls.map((url) => ({
        loc: url.href,
        lastmod: new Date().toISOString(),
      }));
    }
    const fetchedUrls = await fetchSitemap(sitemapUrl);
    return fetchedUrls.map((url) => ({
      loc: url.href,
      lastmod: new Date().toISOString(),
    }));
  } catch (error) {
    throw new Error(`Failed to fetch ${mode}: ${error.message}`);
  }
}

async function validateAndPrepareScan() {
  const formData = getFormData();
  validateRequiredFields(formData);

  if (!await ensureLogin(formData.org, formData.site)) {
    window.addEventListener('profile-update', ({ detail: loginInfo }) => {
      if (loginInfo.includes(formData.org)) {
        domCache.startScanButton.click();
      }
    }, { once: true });
    return null;
  }

  return formData;
}

async function configureMediaLibrary(formData) {
  const siteKey = createSiteKey(formData.org, formData.site, formData.mode);
  const storageType = getStorageType();

  domCache.mediaLibrary.mode = formData.mode;
  setMediaLibraryAttributes(domCache.mediaLibrary, siteKey, storageType);

  setupStorageManager(domCache.mediaLibrary, siteKey);
  await waitForMediaLibraryReady(domCache.mediaLibrary);
  await initializeMediaLibrary(domCache.mediaLibrary, storageType);

  return { siteKey, storageType };
}

async function performScan(formData) {
  const pageList = await discoverAEMContent(
    formData.org,
    formData.site,
    formData.mode,
    formData.customUrl,
  );

  if (!pageList || pageList.length === 0) {
    throw new Error('No pages found to scan');
  }

  const shouldSaveMedia = domCache.storageOption?.value
    !== CONFIG.STORAGE_TYPES.NONE;
  const mediaData = await domCache.mediaLibrary.loadFromPageList(
    pageList,
    null,
    createSiteKey(formData.org, formData.site, formData.mode),
    shouldSaveMedia,
    null,
    pageList,
    [],
  );

  return { mediaData, shouldSaveMedia };
}

async function saveResults(mediaData, shouldSaveMedia, siteKey) {
  if (shouldSaveMedia && mediaData.length > 0) {
    try {
      if (domCache.mediaLibrary.storageManager) {
        await domCache.mediaLibrary.storageManager.save(mediaData);
      } else {
        throw new Error('Storage manager not available. Data will not be saved.');
      }
    } catch (error) {
      handleError(error);
    }
  }

  localStorage.setItem('media-library-site-path', siteKey);
  updateConfig();
  await updateButtonVisibility();
}

export async function startScan() {
  try {
    const formData = await validateAndPrepareScan();
    if (!formData) return;

    const { siteKey } = await configureMediaLibrary(formData);
    const { mediaData, shouldSaveMedia } = await performScan(formData);
    await saveResults(mediaData, shouldSaveMedia, siteKey);
  } catch (error) {
    handleError(error);
  }
}

export async function loadPreviousScan() {
  try {
    const formData = getFormData();
    if (!formData.org || !formData.site) {
      throw new Error('Please enter organization and site');
    }

    const siteKey = createSiteKey(formData.org, formData.site, formData.mode);
    const storageType = getStorageType();

    domCache.mediaLibrary.mode = formData.mode;
    setMediaLibraryAttributes(domCache.mediaLibrary, siteKey, storageType);

    try {
      await domCache.mediaLibrary.initialize();
    } catch (error) {
      handleError(error);
      return;
    }

    setupStorageManager(domCache.mediaLibrary, siteKey);

    if (!domCache.mediaLibrary.storageManager) {
      throw new Error('Storage manager not available. Cannot load previous scan data.');
    }

    try {
      const existingData = await domCache.mediaLibrary.storageManager.load();
      if (existingData && existingData.length > 0) {
        await domCache.mediaLibrary.loadMediaData(existingData, siteKey, false, null);
      } else {
        handleError(new Error('No previous scan data found'));
      }
    } catch (error) {
      handleError(error);
    }
  } catch (error) {
    handleError(error);
  }
}

async function clearIndexedDBData() {
  const formData = getFormData();
  if (!formData) {
    alert('Please fill in organization, site, and mode before clearing data.');
    return;
  }

  const currentSiteKey = createSiteKey(formData.org, formData.site, formData.mode);

  if (!domCache.mediaLibrary) {
    return;
  }

  if (!domCache.mediaLibrary.storageManager) {
    return;
  }

  setupStorageManager(domCache.mediaLibrary, currentSiteKey);

  try {
    await domCache.mediaLibrary.clearData();

    if (domCache.mediaLibrary.storageManager.type === CONFIG.STORAGE_TYPES.INDEXED_DB) {
      await domCache.mediaLibrary.storageManager.deleteSite(currentSiteKey);
    }

    await updateButtonVisibility();
    alert(`Previous scan data has been cleared successfully for ${formData.org}/${formData.site} (${formData.mode}).`);
  } catch (error) {
    const isBlockedError = error.message.includes('Database deletion blocked')
      || error.message.includes('blocked')
      || error.name === 'TransactionInactiveError';

    if (isBlockedError) {
      console.error('Database deletion blocked:', error);
      alert('Unable to clear data right now. Please wait 10-15 seconds and try again, or refresh the page.');
    } else {
      handleError(error);
    }
  }
}

function handleModeChange(modeInput) {
  if (modeInput.value === CONFIG.MODES.CUSTOM) {
    domCache.sitemapField.style.display = 'block';
    domCache.sitemapInput.required = true;
  } else {
    domCache.sitemapField.style.display = 'none';
    domCache.sitemapInput.required = false;
    domCache.sitemapInput.value = '';
  }
  updateButtonVisibility();
}

function setupEventDelegation() {
  document.addEventListener('click', (event) => {
    const { target } = event;

    if (target.matches(SELECTORS.START_SCAN_BUTTON)) {
      startScan();
    } else if (target.matches(SELECTORS.LOAD_BUTTON)) {
      loadPreviousScan();
    } else if (target.matches(SELECTORS.CLEAR_BUTTON)) {
      clearIndexedDBData();
    }
  });

  document.addEventListener('change', (event) => {
    const { target } = event;

    if (target.matches(SELECTORS.STORAGE_OPTION)
        || target.matches(SELECTORS.ORG_INPUT)
        || target.matches(SELECTORS.SITE_INPUT)
        || target.matches(SELECTORS.SITEMAP_INPUT)) {
      updateButtonVisibility();
    } else if (target.matches(SELECTORS.MODE_INPUT)) {
      handleModeChange(target);
    }
  });

  document.addEventListener('submit', (event) => {
    if (event.target.matches(SELECTORS.MEDIA_CONFIG_FORM)) {
      event.preventDefault();
      updateConfig();
    }
  });
}

export async function initializeEventListeners() {
  setupEventDelegation();

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const sitemapParam = params.get('sitemap-url');

  if (modeParam && domCache.modeInput) {
    domCache.modeInput.value = modeParam;
    domCache.modeInput.dispatchEvent(new Event('change'));
  }

  if (sitemapParam && domCache.sitemapInput) {
    domCache.sitemapInput.value = sitemapParam;
  }

  await updateButtonVisibility();
}

export async function initialize() {
  try {
    domCache.init();
    await setupMediaLibrary();
    await initConfigField();
    await initializeEventListeners();
    await updateButtonVisibility();
  } catch (error) {
    handleError(error);
  }
}
