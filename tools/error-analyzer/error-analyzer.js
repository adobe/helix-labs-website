/* eslint-disable import/no-unresolved */
import * as echarts from 'echarts';
/* eslint-enable import/no-unresolved */
import DataLoader from '../../scripts/loader.js';

const dataLoader = new DataLoader();
let activeUrlFilter = null;
let cachedData = null;
let cachedChunks = null;
let cachedDateRange = null;
dataLoader.apiEndpoint = 'https://bundles.aem.page';

let chartInstance = null;

function initChart() {
  const chartDom = document.getElementById('error-chart');
  if (!chartDom) return null;

  if (!chartInstance) {
    chartInstance = echarts.init(chartDom);
  }

  return chartInstance;
}

function updateChart(chunks, dateRange, urlFilter = null) {
  const chart = initChart();
  if (!chart) return;

  // First pass: collect all time periods from all data (to preserve x-axis)
  const allTimePeriods = new Map();

  chunks.forEach((chunk) => {
    chunk.rumBundles.forEach((bundle) => {
      const hasError = bundle.events.some((event) => event.checkpoint === 'error');
      if (!hasError) return;

      const date = new Date(bundle.timeSlot);
      let timeKey;

      // Format time key based on date range
      if (dateRange === 'week') {
        // By hour for last week
        timeKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      } else if (dateRange === 'year') {
        // By week for last year - use start of week as label
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek);
        timeKey = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
      } else {
        // By day for last month
        timeKey = `${date.getMonth() + 1}/${date.getDate()}`;
      }

      if (!allTimePeriods.has(timeKey)) {
        allTimePeriods.set(timeKey, {
          errorCount: 0,
          sortDate: date.getTime(), // Store timestamp for sorting
        });
      }
    });
  });

  // Second pass: count errors (with filter applied if active)
  chunks.forEach((chunk) => {
    chunk.rumBundles.forEach((bundle) => {
      const hasError = bundle.events.some((event) => event.checkpoint === 'error');
      if (!hasError) return;

      // Apply URL filter if active
      if (urlFilter && bundle.url !== urlFilter) return;

      const date = new Date(bundle.timeSlot);
      let timeKey;

      // Format time key based on date range (same logic as above)
      if (dateRange === 'week') {
        timeKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      } else if (dateRange === 'year') {
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek);
        timeKey = `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()}`;
      } else {
        timeKey = `${date.getMonth() + 1}/${date.getDate()}`;
      }

      const data = allTimePeriods.get(timeKey);
      if (data) {
        bundle.events.forEach((event) => {
          if (event.checkpoint === 'error') {
            data.errorCount += bundle.weight || 1;
          }
        });
      }
    });
  });

  // Convert to arrays for chart and sort by actual date, not string
  const sortedEntries = Array.from(allTimePeriods.entries())
    .sort((a, b) => a[1].sortDate - b[1].sortDate);

  const categories = sortedEntries.map((entry) => entry[0]);
  const errorCounts = sortedEntries.map((entry) => entry[1].errorCount);

  // Calculate label interval based on date range
  let labelInterval = 'auto';
  if (dateRange === 'week') {
    // For week view (hourly data), show labels every 6 hours
    labelInterval = 5; // Show every 6th label (0-indexed)
  } else if (dateRange === 'month' && categories.length > 15) {
    // For month view, show every other day if more than 15 days
    labelInterval = 1;
  }

  const option = {
    grid: {
      left: '60',
      right: '20',
      bottom: '80',
      top: '40',
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 45,
        interval: labelInterval,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Error Count',
      axisLabel: {
        formatter(value) {
          if (value < 1000) {
            return value.toString();
          }
          if (value < 1000000) {
            return `${(value / 1000).toFixed(1)}K`;
          }
          if (value < 1000000000) {
            return `${(value / 1000000).toFixed(1)}M`;
          }
          return `${(value / 1000000000).toFixed(1)}B`;
        },
      },
    },
    series: [
      {
        name: 'Errors',
        type: 'bar',
        data: errorCounts,
        itemStyle: {
          color: '#5470c6',
        },
      },
    ],
  };

  chart.setOption(option);
}

function updateUrlParams(params) {
  const url = new URL(window.location.href);
  url.search = '';
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.set(key, params[key]);
    }
  });
  window.history.replaceState({}, document.title, url.href);
}

function getDomainConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const domainKey = params.get('domainKey');
  const domain = params.get('domain');
  const dateRange = params.get('dateRange');
  const urlFilter = params.get('urlFilter');
  return {
    domain, domainKey, dateRange, urlFilter,
  };
}

function formatRelativeDate(dateInput) {
  const date = new Date(dateInput);

  // Handle invalid dates
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  // Convert both dates to UTC midnight for consistent day comparison
  const now = new Date();
  const dateUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const diffMs = nowUTC - dateUTC;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Handle future dates (shouldn't happen, but just in case)
  if (diffDays < 0) {
    return 'Today';
  }

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 14) {
    return 'Last week';
  }
  if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} weeks ago`;
  }
  if (diffDays < 60) {
    return 'Last month';
  }
  if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} months ago`;
  }
  if (diffDays < 730) {
    return 'Last year';
  }
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} years ago`;
}

function formatNumber(num) {
  if (num < 1000) {
    return num.toString();
  }
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  return `${(num / 1000000000).toFixed(1)}B`;
}

function formatUrls(urlsObject, activeFilter = null) {
  // Convert object to array and sort by occurrence count (descending)
  const urlEntries = Object.entries(urlsObject).sort((a, b) => b[1] - a[1]);

  if (urlEntries.length === 0) {
    return '-';
  }

  // If there's an active filter, prioritize showing that URL
  let displayUrl;
  let displayCount;
  let remainingUrls;

  if (activeFilter && activeFilter in urlsObject) {
    // Show the filtered URL first
    displayUrl = activeFilter;
    displayCount = urlsObject[activeFilter];
    // All other URLs go in the tooltip
    remainingUrls = urlEntries
      .filter(([url]) => url !== activeFilter)
      .map(([url, count]) => `${url} (${formatNumber(count)})`)
      .join('\n');
  } else {
    // Show the most common URL
    const [topUrl, topCount] = urlEntries[0];
    displayUrl = topUrl;
    displayCount = topCount;
    // Remaining URLs go in the tooltip
    remainingUrls = urlEntries
      .slice(1)
      .map(([url, count]) => `${url} (${formatNumber(count)})`)
      .join('\n');
  }

  let result = `<span class="url-filter-link" data-url="${displayUrl.replace(/"/g, '&quot;')}">${displayUrl}</span> (${formatNumber(displayCount)})`;

  const remainingCount = urlEntries.length - 1;
  if (remainingCount > 0) {
    result += `<br><small class="more-urls" data-urls="${remainingUrls.replace(/"/g, '&quot;')}">${remainingCount} more URL${remainingCount === 1 ? '' : 's'}</small>`;
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

const setUrlFilter = (url) => {
  activeUrlFilter = url;
  // Update URL parameters
  const config = getDomainConfigFromUrl();
  updateUrlParams({
    domain: config.domain,
    domainKey: config.domainKey,
    dateRange: config.dateRange,
    urlFilter: url,
  });
  renderFilteredData(); // eslint-disable-line no-use-before-define
};

const clearUrlFilter = () => {
  activeUrlFilter = null;
  // Remove urlFilter from URL
  const url = new URL(window.location.href);
  url.searchParams.delete('urlFilter');
  window.history.replaceState({}, document.title, url.href);
  renderFilteredData(); // eslint-disable-line no-use-before-define
};

function attachUrlFilterHandlers() {
  const urlLinks = document.querySelectorAll('.url-filter-link');
  urlLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = link.getAttribute('data-url');
      setUrlFilter(url);
    });
  });
}

function updateFilterIndicator() {
  const container = document.querySelector('.error-list-container');
  let indicator = container.querySelector('.filter-indicator');

  if (activeUrlFilter) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'filter-indicator';
      // Insert after loading indicator but before errors header
      const loadingIndicator = container.querySelector('#loading-indicator');
      if (loadingIndicator && loadingIndicator.nextSibling) {
        container.insertBefore(indicator, loadingIndicator.nextSibling);
      } else {
        container.appendChild(indicator);
      }
    }
    indicator.innerHTML = `
      <span>Filtered by URL: <a href="${activeUrlFilter}" target="_blank" rel="noopener noreferrer"><strong>${activeUrlFilter}</strong></a></span>
      <button class="clear-filter">Clear Filter</button>
    `;
    indicator.querySelector('.clear-filter').addEventListener('click', clearUrlFilter);
  } else if (indicator) {
    indicator.remove();
  }
}

function renderFilteredData() {
  if (!cachedData || !cachedChunks || !cachedDateRange) {
    return;
  }

  const errorList = document.getElementById('error-list');
  errorList.replaceChildren();

  // Filter data if a URL filter is active
  let filteredData = cachedData;
  if (activeUrlFilter) {
    // eslint-disable-next-line no-console
    console.log('renderFilteredData: Filtering by URL:', activeUrlFilter);
    filteredData = cachedData.filter((item) => activeUrlFilter in item.urls);
    // eslint-disable-next-line no-console
    console.log('renderFilteredData: Filtered from', cachedData.length, 'to', filteredData.length, 'items');
  } else {
    // eslint-disable-next-line no-console
    console.log('renderFilteredData: No active filter, showing all', cachedData.length, 'items');
  }

  // Update chart with filtered data
  updateChart(cachedChunks, cachedDateRange, activeUrlFilter);

  // Show the chart container
  const errorGraphContainer = document.querySelector('.error-graph-container');
  if (errorGraphContainer) {
    errorGraphContainer.classList.add('visible');
  }

  // Update filter indicator
  updateFilterIndicator();

  // Render error items
  filteredData.forEach((item) => {
    const li = document.createElement('li');
    li.classList.add('error-item');
    li.innerHTML = `
      <code class="error-source">${item.source}</code>
      <code class="error-target">${item.target}</code>
      <div class="error-urls">${formatUrls(item.urls, activeUrlFilter)}</div>
      <div class="error-last-seen">${item.timestamp ? formatRelativeDate(item.timestamp) : '-'}</div>
      <div class="error-count">${formatNumber(item.weight)}</div>
    `;
    errorList.append(li);
  });

  // Re-attach click handlers to URL filter links
  attachUrlFilterHandlers();

  // Scroll to top when a filter is applied
  if (activeUrlFilter) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function refreshResults({ domain, domainKey }) {
  if (!domain || !domainKey) {
    return;
  }

  setLoading(true);

  try {
    const formData = {
      domain,
      domainKey,
      dateRange: document.getElementById('date-range').value,
    };

    // Include urlFilter in URL params if it exists
    if (activeUrlFilter) {
      formData.urlFilter = activeUrlFilter;
    }

    updateUrlParams(formData);

    const errorList = document.getElementById('error-list');
    errorList.replaceChildren();

    dataLoader.domainKey = domainKey;
    dataLoader.domain = domain;
    let chunks;
    switch (formData.dateRange) {
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

    const data = [];
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

            const groupInto = data.find((item) => (
              item.source.toLowerCase() === event.source.toLowerCase()
              && item.target.toLowerCase() === event.target.toLowerCase()
            ));

            if (groupInto) {
              groupInto.urls[bundle.url] = (groupInto.urls[bundle.url] || 0) + (bundle.weight || 1);
              groupInto.weight += bundle.weight || 1;
              groupInto.userAgent.add(bundle.userAgent);

              const ts = new Date(bundle.timeSlot || event.time);
              if (ts > groupInto.timestamp) {
                groupInto.timestamp = ts;
              }
            } else {
              data.push({
                source: event.source,
                target: event.target,
                urls: { [bundle.url]: bundle.weight || 1 },
                timestamp: new Date(bundle.timeSlot || event.time),
                weight: bundle.weight || 1,
                userAgent: new Set([bundle.userAgent]),
              });
            }
          }
        });
      });
    });

    data.sort((a, b) => b.weight - a.weight);

    // Cache data for filtering
    cachedData = data;
    cachedChunks = chunks;
    cachedDateRange = formData.dateRange;

    // Sync activeUrlFilter with URL params
    const { urlFilter } = getDomainConfigFromUrl();
    activeUrlFilter = urlFilter || null;

    // Debug: Log if filter is active
    if (activeUrlFilter) {
      // eslint-disable-next-line no-console
      console.log('Active URL filter:', activeUrlFilter);
      // Check if this URL exists in any of the error data
      const hasMatchingUrl = data.some((item) => activeUrlFilter in item.urls);
      // eslint-disable-next-line no-console
      console.log('Filter matches data:', hasMatchingUrl);
      if (!hasMatchingUrl) {
        const allUrls = data.flatMap((item) => Object.keys(item.urls));
        const availableUrls = [...new Set(allUrls)].slice(0, 10);
        // eslint-disable-next-line no-console
        console.warn('URL filter does not match any URLs. Available:', availableUrls);
      }
    }

    // Render the data
    renderFilteredData();
  } finally {
    setLoading(false);
  }
}

function updateDomain(domain, domainKey) {
  document.querySelector('.domain-name').textContent = domain;
  const favicon = document.querySelector('.favicon img');
  favicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  favicon.alt = `favicon for ${domain}`;

  refreshResults({ domain, domainKey });
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

  const modal = document.getElementById('domain-modal');
  document.getElementById('domain-trigger').addEventListener('click', () => {
    modal.showModal();
  });

  modal.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = e.target.domain.value;
    const domainKey = e.target.domainKey.value;
    updateDomain(domain, domainKey);
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
  } = getDomainConfigFromUrl();

  // Set date range from URL if present
  if (dateRange) {
    const dateRangeSelect = document.getElementById('date-range');
    if (dateRangeSelect && ['week', 'month', 'year'].includes(dateRange)) {
      dateRangeSelect.value = dateRange;
    }
  }

  // Set URL filter from URL if present
  if (urlFilter) {
    // eslint-disable-next-line no-console
    console.log('Init: Setting URL filter from URL params:', urlFilter);
    activeUrlFilter = urlFilter;
  } else {
    // eslint-disable-next-line no-console
    console.log('Init: No URL filter in URL params');
  }

  if (domain && domainKey) {
    updateDomain(domain, domainKey);
  }

  document.getElementById('date-range').addEventListener('change', () => {
    refreshResults(getDomainConfigFromUrl());
  });

  // Handle window resize for chart
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
}

init();
