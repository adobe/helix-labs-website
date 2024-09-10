import { sampleRUM } from '../../scripts/aem.js';

const API = 'https://helix-cache-debug.adobeaem.workers.dev/';
/** @type {HTMLInputElement} */
const input = document.querySelector('input#url-input');
/** @type {HTMLButtonElement} */
const button = document.querySelector('button#search-button');
/** @type {HTMLDivElement} */
const resultsContainer = document.querySelector('div#results');

const ENV_HEADERS = {
  CDN: {
    'Content Length': 'content-length',
    'Last Modified': 'last-modified',
    'Cache Keys': ['surrogate-key', 'edge-cache-tag', 'cache-tag'],
  },
  Live: {
    'Effective Cache Control': ['cdn-cache-control', 's-maxage', 'surrogate-control', 'cache-control'],
    'Content Length': 'content-length',
    'Last Modified': 'last-modified',
    'Cache Keys': ['surrogate-key', 'cache-tag'],
  },
  Preview: {
    'Last Modified': 'last-modified',
    'Cache Keys': ['surrogate-key', 'cache-tag'],
  },
};

const fetchDetails = (url) => fetch(`${API}?url=${encodeURIComponent(url)}`);

/**
 * Infer CDN type from headers.
 * Worker runs on CF so that is the fallback type. Everything "looks like" CF.
 * @param {any} data
 * @returns
 */
const inferCDNType = (data) => {
  const {
    cdn: { headers: cdnResHeaders },
    probe: { req: { headers: probeReqHeaders } },
  } = data;
  if (cdnResHeaders['x-amz-cf-id']) {
    return 'cloudfront';
  }
  if ((probeReqHeaders.via ?? '').includes('akamai')) {
    return 'akamai';
  }
  if (cdnResHeaders['fastly-debug-ttl'] || cdnResHeaders['fastly-debug-digest'] || cdnResHeaders['fastly-debug-path']) {
    return 'fastly';
  }
  return 'cloudflare';
};

/**
 * @param {import('./types.js').POP[]} pops
 * @param {'fastly'|'cloudflare'} type
 */
const popsTemplate = (pops, type) => {
  import('./pops-map.js');
  return /* html */`\
    <details>
      <summary>POP Details</summary>
      <div class="pops">
        <pops-map data-cdn-type="${type}" data-pops="${encodeURIComponent(JSON.stringify(pops))}"></pop-map>
      </div>
    </details>
  `;
};

const tileTemplate = (
  env,
  {
    headers, status, url, pops,
  },
  {
    contentLengthMatches,
    lastModMatches,
  },
) => /* html */`
    <div class="tile">
      <h2>${env}</h2>
      <div class="row">
        <span class="key">URL</span>
        <span class="val"><a href="${url}">${url}</a> (${status})</span>
      </div>
      ${
  Object.entries(ENV_HEADERS[env]).map(([key, valKeys]) => {
    // eslint-disable-next-line no-param-reassign
    valKeys = typeof valKeys === 'string' ? [valKeys] : [...valKeys];

    let valCls = '';
    let val = '';
    while (!val && valKeys.length) {
      val = headers[valKeys.shift()];
    }
    if (key === 'Cache Keys' && val) {
      // split keys into pills
      val = val
        .split(/[,\s+]/)
        .sort((a, b) => a.length - b.length)
        .map((k) => `<span class="pill">${k}</span>`).join(' ');
      valCls = 'list';
    }
    if ((key === 'Content Length' && !contentLengthMatches && env !== 'Preview')
      || (key === 'Last Modified' && !lastModMatches && env !== 'Preview')
    ) {
      valCls = 'bad';
    }
    return /* html */`
      <div class="row">
        <span class="key">${key}</span>
        <span class="val ${valCls}">${val}</span>
      </div>`;
  }).join('\n')}
    ${pops ? popsTemplate(pops, 'fastly') : ''}
    </div>
  `;

const renderDetails = (data) => {
  // console.log(data);

  const {
    x_push_invalidation: pushInval = 'disabled',
    x_byo_cdn_type: byoCdnType = 'unknown',
    x_forwarded_host: forwardedHost = '',
  } = data.probe.req.headers;
  const pushInvalPill = pushInval === 'enabled'
    ? '<span class="pill badge good">enabled</span>'
    : '<span class="pill badge bad">disabled</span>';
  const actualCdn = inferCDNType(data);
  const cdnMatchClass = actualCdn === byoCdnType ? 'good' : 'bad';

  // add settings section
  resultsContainer.innerHTML = /* html */`
    <div class="settings">
      <h2>Settings</h2>
      <div class="row">
        <span class="key">Push Invalidation</span>
        <span class="val">${pushInvalPill}</span>
      </div>
      <div class="row">
        <span class="key">BYOCDN Type</span>
        <span class="val"><span class="pill badge ${cdnMatchClass}">${byoCdnType}</span></span>
      </div>
      <div class="row">
        <span class="key">Actual CDN Type</span>
        <span class="val"><span class="pill badge ${cdnMatchClass}">${actualCdn}</span></span>
      </div>
      <div class="row">
        <span class="key">Forwarded Host</span>
        <span class="val">${forwardedHost}</span>
      </div>
    </div>
  `;

  const opts = {
    contentLengthMatches: true,
    lastModMatches: true,
  };
  if (data.cdn.headers['content-length'] !== data.live.headers['content-length']) {
    opts.contentLengthMatches = false;
  }
  if (data.cdn.headers['last-modified'] !== data.live.headers['last-modified']) {
    opts.lastModMatches = false;
  }

  // append env tiles
  ['CDN', 'Live', 'Preview'].forEach((env) => {
    const tile = tileTemplate(env, data[env.toLowerCase()], opts);
    resultsContainer.insertAdjacentHTML('beforeend', tile);
  });
};

(async () => {
  const loc = new URL(window.location.href);
  if (loc.searchParams.has('url')) {
    input.value = loc.searchParams.get('url');
    setTimeout(() => button.click());
  }

  button.addEventListener('click', async () => {
    let url;
    try {
      url = new URL(input.value);
    } catch {
      try {
        url = new URL(`https://${input.value}`);
      } catch {
        input.setCustomValidity('Invalid URL');
        input.reportValidity();
        return;
      }
    }

    try {
      loc.searchParams.set('url', url.toString());
      window.history.replaceState({}, '', loc);
      button.disabled = true;

      let count = 0;
      const interval = setInterval(() => {
        // eslint-disable-next-line no-plusplus
        if (++count > 3) count = 0;
        resultsContainer.innerHTML = `<div class="spinner">Loading${'.'.repeat(count)}</div>`;
      }, 250);
      const response = await fetchDetails(url);
      clearInterval(interval);

      if (!response.ok) {
        resultsContainer.innerHTML = '<p class="error">Failed to fetch details</p>';
        return;
      }
      const data = await response.json();
      renderDetails(data);
    } finally {
      button.disabled = false;
    }
  });
  sampleRUM.enhance();
})();
