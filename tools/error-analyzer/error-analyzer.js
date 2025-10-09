import DataLoader from '../../scripts/loader.js';
import { updateChart } from './chart.js';
import { formatRelativeDate, formatNumber } from './utils.js';

const dataLoader = new DataLoader();
dataLoader.apiEndpoint = 'https://bundles.aem.page';

const state = {
  domain: null,
  domainKey: null,
  dateRange: null,
  urlFilter: null,
};

const data = {
  cached: [],
  filtered: [],
};

function updateState() {
  // update ui elements and url params from the state object
  const url = new URL(window.location.href);
  url.search = '';
  Object.entries(state).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  window.history.replaceState({}, document.title, url.href);

  // update ui elements from the state object
  if (state.domain) {
    document.querySelector('.domain-name').textContent = state.domain;
    const favicon = document.querySelector('.favicon img');
    favicon.src = `https://www.google.com/s2/favicons?domain=${state.domain}&sz=64`;
    favicon.alt = `favicon for ${state.domain}`;
  }

  const explorerTrigger = document.querySelector('.explorer-trigger');
  if (state.domain && state.domainKey) {
    const explorerUrl = new URL(explorerTrigger.href);
    explorerUrl.search = '';
    explorerUrl.searchParams.set('domain', state.domain);
    explorerUrl.searchParams.set('domainkey', state.domainKey);
    explorerUrl.searchParams.set('view', state.dateRange || 'month');
    if (state.urlFilter) {
      explorerUrl.searchParams.set('url', state.urlFilter);
    }
    explorerUrl.searchParams.set('checkpoint', 'error');
    explorerTrigger.href = explorerUrl.href;
    explorerTrigger.style.display = 'block';
  } else {
    explorerTrigger.style.display = 'none';
  }

  if (state.dateRange) {
    document.getElementById('date-range').value = state.dateRange;
  }

  const filterIndicator = document.querySelector('.filter-indicator');
  const filterLink = filterIndicator.querySelector('a');
  if (state.urlFilter) {
    filterLink.href = state.urlFilter;
    filterLink.textContent = state.urlFilter;
    filterIndicator.classList.add('active');
  } else {
    filterLink.href = '';
    filterLink.textContent = '';
    filterIndicator.classList.remove('active');
  }
}

function getStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const domainKey = params.get('domainKey');
  const domain = params.get('domain');
  const dateRange = params.get('dateRange');
  const urlFilter = params.get('urlFilter');
  return {
    domain, domainKey, dateRange, urlFilter,
  };
}

function formatUrls(urlsObject, activeFilter = null) {
  // Convert object to array and sort by occurrence count (descending)
  const urlEntries = Object.entries(urlsObject).sort((a, b) => b[1] - a[1]);

  if (urlEntries.length === 0) {
    return '-';
  }

  // If there's an active filter, prioritize showing that URL first
  let displayEntries;
  if (activeFilter && activeFilter in urlsObject) {
    // Put filtered URL first, then others
    const filtered = [activeFilter, urlsObject[activeFilter]];
    const others = urlEntries.filter(([url]) => url !== activeFilter);
    displayEntries = [filtered, ...others];
  } else {
    displayEntries = urlEntries;
  }

  // Show up to 3 URLs
  const urlsToShow = displayEntries.slice(0, 3);
  const remainingCount = displayEntries.length - urlsToShow.length;

  let result = '<ul class="url-list">';
  urlsToShow.forEach(([url, count]) => {
    result += `<li><span class="url-filter-link" data-url="${url.replace(/"/g, '&quot;')}">${url}</span> <span class="url-count">(${formatNumber(count)})</span></li>`;
  });
  result += '</ul>';

  if (remainingCount > 0) {
    result += `<small class="more-urls">${remainingCount} more URL${remainingCount === 1 ? '' : 's'}</small>`;
  }

  return result;
}

function setLoading(isLoading) {
  const errorListContainer = document.querySelector('.error-list-container');
  const errorGraphContainer = document.querySelector('.error-graph-container');
  const dateRange = document.getElementById('date-range');

  if (errorListContainer) {
    if (isLoading) {
      errorListContainer.classList.add('loading');
    } else {
      errorListContainer.classList.remove('loading');
    }
  }

  if (errorGraphContainer) {
    if (isLoading) {
      errorGraphContainer.classList.remove('visible');
    }
  }

  if (dateRange) {
    dateRange.disabled = isLoading;
  }
}

function renderFilteredData() {
  if (!data.filtered || data.filtered.length === 0) {
    return;
  }

  const errorList = document.getElementById('error-list');
  errorList.replaceChildren();

  // Render error items
  data.filtered.forEach((item) => {
    const li = document.createElement('li');
    li.classList.add('error-item');
    li.innerHTML = `
      <code class="error-source">${item.source}</code>
      <code class="error-target">${item.target}</code>
      <div class="error-urls">${formatUrls(item.urls, state.urlFilter)}</div>
      <div class="error-last-seen">${item.timestamp ? formatRelativeDate(item.timestamp) : '-'}</div>
      <div class="error-count">${formatNumber(item.weight)}</div>
    `;
    errorList.append(li);
  });

  updateChart(data.filtered, state.dateRange);
  errorList.querySelectorAll('.url-filter-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      state.urlFilter = link.getAttribute('data-url');
      updateState();
      // eslint-disable-next-line no-use-before-define
      refreshResults(false);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
}

async function refreshResults(refreshCached = true) {
  const {
    domain, domainKey, dateRange, urlFilter,
  } = state;
  if (!domain || !domainKey) {
    return;
  }

  setLoading(true);

  try {
    const errorList = document.getElementById('error-list');
    errorList.replaceChildren();

    if (refreshCached) {
      data.cached = [];
      dataLoader.domainKey = domainKey;
      dataLoader.domain = domain;
      let chunks;
      switch (dateRange) {
        case 'week':
          chunks = await dataLoader.fetchLastWeek();
          break;
        case 'year':
          chunks = await dataLoader.fetchPrevious12Months();
          break;
        case 'month':
        default:
          chunks = await dataLoader.fetchPrevious31Days();
          break;
      }

      chunks.forEach((chunk) => {
        chunk.rumBundles.forEach((bundle) => {
          bundle.events.forEach((event) => {
            if (event.checkpoint === 'error') {
              if (!event.target) {
                event.target = '-';
              } else if (typeof event.target !== 'string') {
                event.target = event.target.toString();
              }
              if (!event.source) {
                event.source = '-';
              } else if (typeof event.source !== 'string') {
                event.source = event.source.toString();
              }

              const groupInto = data.cached.find((item) => (
                item.source.toLowerCase() === event.source.toLowerCase()
                && item.target.toLowerCase() === event.target.toLowerCase()
              ));

              if (groupInto) {
                groupInto.urls[bundle.url] = (groupInto.urls[bundle.url] || 0)
                  + (bundle.weight || 1);
                groupInto.weight += bundle.weight || 1;

                const ts = new Date(bundle.timeSlot || event.time);
                if (ts > groupInto.timestamp) {
                  groupInto.timestamp = ts;
                }

                // Track all time slots for chart data
                groupInto.timeSlots.push({
                  time: ts,
                  weight: bundle.weight || 1,
                  url: bundle.url,
                });
              } else {
                const ts = new Date(bundle.timeSlot || event.time);
                data.cached.push({
                  source: event.source,
                  target: event.target,
                  urls: { [bundle.url]: bundle.weight || 1 },
                  timestamp: ts,
                  weight: bundle.weight || 1,
                  timeSlots: [{
                    time: ts,
                    weight: bundle.weight || 1,
                    url: bundle.url,
                  }],
                });
              }
            }
          });
        });
      });

      data.cached.sort((a, b) => b.weight - a.weight);
    }

    data.filtered = data.cached.filter((item) => (urlFilter ? urlFilter in item.urls : true));

    renderFilteredData();
  } finally {
    setLoading(false);
  }
}

async function init() {
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-text">Loading error data...</div>
  `;
  document.querySelector('.error-list-container').prepend(loadingIndicator);

  const errorsHeader = document.createElement('div');
  errorsHeader.classList.add('errors-header');
  errorsHeader.innerHTML = `
    <div class="error-source">Source</div>
    <div class="error-target">Target</div>
    <div class="error-urls">URLs</div>
    <div class="error-last-seen">Last Seen</div>
    <div class="error-count">Estimated Occurrences</div>
  `;
  document.getElementById('error-list').before(errorsHeader);

  const filterIndicator = document.createElement('div');
  filterIndicator.classList.add('filter-indicator');
  filterIndicator.innerHTML = `
    <span>Filtered by URL: <a href="${state.urlFilter}" target="_blank" rel="noopener noreferrer"><strong>${state.urlFilter}</strong></a></span>
    <button class="clear-filter">Clear Filter</button>
  `;
  filterIndicator.querySelector('.clear-filter').addEventListener('click', () => {
    state.urlFilter = null;
    updateState();
    refreshResults(false);
  });
  document.getElementById('error-list').before(filterIndicator);

  const modal = document.getElementById('domain-modal');
  document.getElementById('domain-trigger').addEventListener('click', () => {
    modal.showModal();
  });

  modal.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = e.target.domain.value;
    const domainKey = e.target.domainKey.value;

    state.domain = domain;
    state.domainKey = domainKey;
    state.urlFilter = null;
    updateState();
    refreshResults();

    modal.close();
  });

  modal.querySelector('#modal-cancel').addEventListener('click', () => {
    modal.close();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.close();
    }
  });

  const {
    domain, domainKey, dateRange, urlFilter,
  } = getStateFromURL();

  state.domain = domain;
  state.domainKey = domainKey;
  state.dateRange = dateRange;
  state.urlFilter = urlFilter;
  updateState();

  if (domain && domainKey) {
    refreshResults();
  }

  document.getElementById('date-range').addEventListener('change', () => {
    state.dateRange = document.getElementById('date-range').value;
    updateState();
    refreshResults();
  });
}

init();
