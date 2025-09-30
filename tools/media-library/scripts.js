/* eslint-disable no-await-in-loop */
/* eslint-disable no-alert */
/* eslint-disable no-console */
import { ensureLogin } from '../../blocks/profile/profile.js';
import { initConfigField, updateConfig } from '../../utils/config/config.js';

function setupStorageManager(mediaLibrary, siteKey) {
  if (mediaLibrary.storageManager) {
    mediaLibrary.storageManager.siteKey = siteKey;
    mediaLibrary.storageManager.dbName = siteKey ? `media_${mediaLibrary.storageManager.normalizeSiteKey(siteKey)}` : 'MediaLibrary';
  }
}

function setButtonVisibility(loadButton, clearButton, show) {
  const display = show ? 'inline-block' : 'none';
  loadButton.style.display = display;
  clearButton.style.display = display;
}

async function initializeMediaLibraryWithRetry(mediaLibrary, storageType) {
  try {
    await mediaLibrary.initialize();

    if (mediaLibrary.storageManager && mediaLibrary.storageManager.type === 'none') {
      if (mediaLibrary.storageManager.clearAllSites) {
        await mediaLibrary.storageManager.clearAllSites();
      }
      mediaLibrary.storage = storageType;
      await mediaLibrary.initialize();
    }
  } catch (error) {
    console.error('Failed to initialize media library:', error);
    alert(`Failed to initialize media library: ${error.message}`);
    throw error;
  }
}

async function updateButtonVisibility() {
  const storageOption = document.getElementById('storage-option');
  const loadButton = document.getElementById('load-media');
  const clearButton = document.getElementById('clear-data');

  if (storageOption.value !== 'indexeddb') {
    setButtonVisibility(loadButton, clearButton, false);
    return;
  }

  try {
    const tempMediaLibrary = document.getElementById('media-library');

    if (!tempMediaLibrary?.storageManager) {
      setButtonVisibility(loadButton, clearButton, false);
      return;
    }

    const org = document.getElementById('org').value;
    const site = document.getElementById('site').value;
    const mode = document.getElementById('mode').value;

    if (!org || !site || !mode) {
      setButtonVisibility(loadButton, clearButton, false);
      return;
    }

    const siteKey = `${org}/${site}/${mode}`;
    setupStorageManager(tempMediaLibrary, siteKey);

    const existingData = await tempMediaLibrary.storageManager.load();
    const hasData = existingData && existingData.length > 0;

    setButtonVisibility(loadButton, clearButton, hasData);
  } catch (error) {
    setButtonVisibility(loadButton, clearButton, false);
  }
}

async function fetchSitemap(sitemapURL) {
  const fetchUrl = `https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(sitemapURL)}`;

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
  const limit = 512;
  let offset = 0;
  let more = true;
  const urls = [];

  do {
    let res;
    try {
      res = await fetch(`https://little-forest-58aa.david8603.workers.dev/?url=${encodeURIComponent(indexUrl)}?offset=${offset}&limit=${limit}`);
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

export async function initializeMediaLibrary() {
  await customElements.whenDefined('media-library');

  const mediaLibrary = document.getElementById('media-library');
  if (mediaLibrary) {
    mediaLibrary.corsProxy = 'https://little-forest-58aa.david8603.workers.dev/';
  }
}

async function discoverAEMContent(org, site, mode, customUrl = null) {
  try {
    let sitemapUrl;

    if (mode === 'custom' && customUrl) {
      sitemapUrl = customUrl;
    } else {
      const baseUrl = `https://main--${site}--${org}.aem.live`;
      if (mode === 'queryindex') {
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

export async function startScan() {
  const mediaLibrary = document.getElementById('media-library');
  const orgInput = document.getElementById('org');
  const siteInput = document.getElementById('site');
  const modeInput = document.getElementById('mode');
  const sitemapInput = document.getElementById('sitemap-url');

  try {
    const org = orgInput.value.trim();
    const site = siteInput.value.trim();
    const mode = modeInput.value || 'sitemap';
    const customUrl = sitemapInput.value.trim();

    if (!org || !site) {
      alert('Please fill in Organization and Site fields');
      return;
    }

    if (mode === 'custom' && !customUrl) {
      alert('Please enter a custom sitemap URL');
      return;
    }

    if (!await ensureLogin(org, site)) {
      window.addEventListener('profile-update', ({ detail: loginInfo }) => {
        if (loginInfo.includes(org)) {
          document.getElementById('start-new-scan').click();
        }
      }, { once: true });
      return;
    }

    const siteKey = `${org}/${site}/${mode}`;
    mediaLibrary.mode = mode;

    const storageOptionForScan = document.getElementById('storage-option');
    const storageType = storageOptionForScan ? storageOptionForScan.value : 'indexeddb';

    mediaLibrary.siteKey = siteKey;
    mediaLibrary.setAttribute('site-key', siteKey);

    mediaLibrary.setAttribute('data-site-key', siteKey);

    if (mediaLibrary.storage !== storageType) {
      mediaLibrary.storage = storageType;
      mediaLibrary.setAttribute('storage', storageType);
    }

    setupStorageManager(mediaLibrary, siteKey);

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    try {
      await initializeMediaLibraryWithRetry(mediaLibrary, storageType);
    } catch (error) {
      return;
    }

    setupStorageManager(mediaLibrary, siteKey);

    if (mediaLibrary.storageManager) {
      try {
        await mediaLibrary.initialize();
      } catch (error) {
        // Continue with existing storage manager
      }
    }

    const pageList = await discoverAEMContent(org, site, mode, customUrl);

    if (!pageList || pageList.length === 0) {
      alert('No pages found to scan');
      return;
    }

    const storageOptionElement = document.getElementById('storage-option');
    const shouldSaveMedia = storageOptionElement ? storageOptionElement.value !== 'none' : true;
    const mediaData = await mediaLibrary.loadFromPageList(
      pageList,
      null,
      `${org}/${site}/${mode}`,
      shouldSaveMedia,
      null,
      pageList,
      [],
    );

    if (shouldSaveMedia && mediaData.length > 0) {
      try {
        if (mediaLibrary.storageManager) {
          await mediaLibrary.storageManager.save(mediaData);
        } else {
          alert('Storage manager not available. Data will not be saved.');
        }
      } catch (error) {
        console.error('Error saving to storage:', error);
        alert(`Failed to save data to storage: ${error.message}`);
      }
    }

    const sitePath = `${org}/${site}/${mode}`;
    localStorage.setItem('media-library-site-path', sitePath);

    updateConfig();

    await updateButtonVisibility();
  } catch (error) {
    console.error('Media library scan error:', error);
    alert(`Scan failed: ${error.message || 'Unknown error. Please try again.'}`);
  }
}

export async function loadPreviousScan() {
  const mediaLibrary = document.getElementById('media-library');
  const orgInput = document.getElementById('org');
  const siteInput = document.getElementById('site');
  const modeInput = document.getElementById('mode');

  try {
    const org = orgInput.value.trim();
    const site = siteInput.value.trim();
    const mode = modeInput.value || 'sitemap';

    if (!org || !site) {
      alert('Please enter organization and site');
      return;
    }

    const siteKey = `${org}/${site}/${mode}`;
    mediaLibrary.mode = mode;

    const storageOptionForLoad = document.getElementById('storage-option');
    const storageType = storageOptionForLoad ? storageOptionForLoad.value : 'indexeddb';
    mediaLibrary.storage = storageType;
    mediaLibrary.siteKey = siteKey;
    mediaLibrary.setAttribute('site-key', siteKey);

    try {
      await mediaLibrary.initialize();
    } catch (error) {
      console.error('Failed to initialize media library for loading:', error);
      alert(`Failed to initialize media library: ${error.message}`);
      return;
    }

    setupStorageManager(mediaLibrary, siteKey);

    if (!mediaLibrary.storageManager) {
      console.error('Storage manager not available for loading');
      alert('Storage manager not available. Cannot load previous scan data.');
      return;
    }

    try {
      const existingData = await mediaLibrary.storageManager.load();
      if (existingData && existingData.length > 0) {
        await mediaLibrary.loadMediaData(existingData, siteKey, false, null);
      } else {
        alert('No previous scan data found');
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
      alert(`Failed to load previous scan data: ${error.message}`);
    }
  } catch (error) {
    console.error('Error loading previous scan:', error);
    alert(`Error loading previous scan: ${error.message}`);
  }
}

async function clearIndexedDBData() {
  const mediaLibrary = document.getElementById('media-library');
  if (mediaLibrary && mediaLibrary.storageManager) {
    try {
      await mediaLibrary.storageManager.clearAllSites();

      await updateButtonVisibility();

      alert('Previous scan data has been cleared.');
    } catch (error) {
      console.error('Error clearing IndexedDB data:', error);
      alert('Error clearing data. Please try again.');
    }
  }
}

export async function initializeEventListeners() {
  const startScanButton = document.getElementById('start-new-scan');
  const loadPreviousButton = document.getElementById('load-media');
  const clearDataButton = document.getElementById('clear-data');
  const storageOption = document.getElementById('storage-option');
  const form = document.getElementById('media-config-form');
  const orgInput = document.getElementById('org');
  const siteInput = document.getElementById('site');
  const modeInput = document.getElementById('mode');
  const sitemapInput = document.getElementById('sitemap-url');
  const sitemapField = document.getElementById('sitemap-field');

  startScanButton.addEventListener('click', startScan);
  loadPreviousButton.addEventListener('click', loadPreviousScan);
  clearDataButton.addEventListener('click', clearIndexedDBData);

  storageOption.addEventListener('change', updateButtonVisibility);

  orgInput.addEventListener('input', updateButtonVisibility);
  siteInput.addEventListener('input', updateButtonVisibility);
  sitemapInput.addEventListener('input', updateButtonVisibility);

  modeInput.addEventListener('change', () => {
    if (modeInput.value === 'custom') {
      sitemapField.style.display = 'block';
      sitemapInput.required = true;
    } else {
      sitemapField.style.display = 'none';
      sitemapInput.required = false;
      sitemapInput.value = '';
    }
    updateButtonVisibility();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateConfig();
  });

  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const sitemapParam = params.get('sitemap-url');

  if (modeParam && modeInput) {
    modeInput.value = modeParam;
    modeInput.dispatchEvent(new Event('change'));
  }

  if (sitemapParam && sitemapInput) {
    sitemapInput.value = sitemapParam;
  }

  await updateButtonVisibility();
}

export async function initialize() {
  try {
    await initializeMediaLibrary();

    await initConfigField();

    await initializeEventListeners();

    setTimeout(async () => {
      await updateButtonVisibility();
    }, 1000);
  } catch (error) {
    alert('Error initializing media library. Please refresh the page.');
  }
}
