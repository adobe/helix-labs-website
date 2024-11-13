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
    ETag: 'etag',
    'Cache Keys': ['edge-cache-tag', 'cache-tag', 'surrogate-key'],
  },
  Live: {
    Stack: ['via'],
    'Effective Cache Control': ['cdn-cache-control', 'edge-control', 'surrogate-control', 'cache-control'],
    'Content Length': 'content-length',
    'Last Modified': 'last-modified',
    ETag: 'etag',
    'Cache Keys': ['surrogate-key', 'cache-tag', 'x-surogate-key'],
  },
  Preview: {
    Stack: ['via'],
    'Content Length': 'content-length',
    'Last Modified': 'last-modified',
    ETag: 'etag',
    'Cache Keys': ['surrogate-key', 'cache-tag', 'x-surogate-key'],
  },
};

const purge = (liveHost, keys, tags) => fetch(`${API}/purge`, {
  method: 'POST',
  body: JSON.stringify({ liveHost, keys, tags }),
  headers: {
    'content-type': 'application/json',
  },
});

const fetchDetails = (url) => fetch(`${API}?url=${encodeURIComponent(url)}`);

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
    headers,
    status,
    url,
    pops,
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
      const vk = valKeys.shift();
      val = headers[vk];
      // FIXME: this is a hack to handle the effective cache control
      if (key === 'Effective Cache Control' && val) {
        val = `${vk}: ${val}`;
      }
      // FIXME: this is a hack to infer the stack based on the via header
      if (key === 'Stack') {
        val = val?.toLowerCase().includes('varnish') ? 'fastly' : 'cloudflare';
      }
    }
    if (key === 'Cache Keys' && val) {
      // split keys into pills
      val = val
        .split(/[,\s+]/)
        .filter((k) => k.length)
        .sort((a, b) => a.length - b.length)
        .map((k) => `<span class="pill">${k}</span>`)
        .join(' ');
      valCls = 'list';
    }
    if ((key === 'Content Length' && !contentLengthMatches && env !== 'Preview')
      || (key === 'Last Modified' && !lastModMatches && env !== 'Preview')
    ) {
      valCls = 'bad';
    }
    return val ? /* html */`
      <div class="row">
        <span class="key">${key}</span>
        <span class="val ${valCls}">${val}</span>
      </div>` : '';
  }).join('\n')}
    ${pops ? popsTemplate(pops, 'fastly') : ''}
    </div>
  `;

/**
 * @param {HTMLDivElement} container
 * @param {any} data
 */
const renderPurgeSection = (container, data) => {
  let inferredDotLiveHost = '';
  try {
    inferredDotLiveHost = new URL(data.live.url).hostname;
  } catch { /* noop */ }

  container.insertAdjacentHTML('beforeend', /* html */`
    <div class="purge">
      <h2>Purge</h2>
      <div class="form purge-form">
        <div class="field">
          <label for="purge-host-input">.live Host</label>
          <input id="purge-url-input" type="text" placeholder="https://ref--repo--owner.aem.live" pattern="[^.]+.[^.]+" value="${inferredDotLiveHost}"/>
        </div>
        <div class="field">
          <label for="purge-keys-input">Cache Keys</label>
          <textarea id="purge-keys-input" placeholder="comma and/or space delimited list"></textarea>
        </div>
        <div class="field">
          <label for="purge-paths-input">Paths</label>
          <textarea id="purge-paths-input" placeholder="comma and/or space delimited list"></textarea>
        </div>
        <button class="button" id="purge-button">Purge</button>
      </div>
    </div>
  `);

  const purgeBtn = container.querySelector('#purge-button');
  const purgeHostInput = container.querySelector('#purge-host-input');
  const purgeKeysInput = container.querySelector('#purge-keys-input');
  const purgePathsInput = container.querySelector('#purge-paths-input');

  purgeBtn.addEventListener('click', async () => {
    // split keys and paths
    let dotLiveHost;
    try {
      dotLiveHost = new URL(purgeHostInput.value);
    } catch {
      [dotLiveHost] = purgeHostInput.value.split('/');
    }
    if (!dotLiveHost) {
      purgeHostInput.setCustomValidity('Invalid .live Host');
      purgeHostInput.reportValidity();
      return;
    }

    const keys = [...new Set(purgeKeysInput.value
      .split(/[,\s]+/)
      .filter((k) => k.length))];
    const paths = [...new Set(purgePathsInput.value
      .split(/[,\s]+/)
      .filter((p) => p.length))];

    // purge
    const response = await purge(dotLiveHost, keys, paths);
    if (!response.ok) {
      // TODO: show error in modal
      return;
    }

    const json = await response.json();
    console.log(json);

    // TODO: show response data in modal
  });
};

const renderDetails = (data) => {
  // console.log(data);

  const {
    x_push_invalidation: pushInval = 'disabled',
    x_byo_cdn_type: byoCdnType = 'unknown',
    x_forwarded_host: forwardedHost = '',
  } = data.probe.req.headers;
  const configuredCdnType = data.config?.type;
  const configuredCdnHost = data.config?.host;
  const pushInvalPill = pushInval === 'enabled'
    ? '<span class="pill badge good">enabled</span>'
    : '<span class="pill badge bad">disabled</span>';
  const actualCdn = data.cdn.actualCDNType;
  const cdnMatchClass = actualCdn === byoCdnType ? 'good' : 'bad';

  // TODO: render status information if available (similar to POP?)

  // reset
  resultsContainer.innerHTML = '';

  // add settings section
  resultsContainer.insertAdjacentHTML('beforeend', /* html */`
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
      ${configuredCdnType ? `<div class="row">
        <span class="key">Configured CDN Type</span>
        <span class="val"><span class="pill badge ${actualCdn === configuredCdnType || (configuredCdnType === 'managed' && actualCdn === 'fastly') ? 'good' : 'bad'}">${configuredCdnType}</span></span>
      </div>` : ''}
      ${configuredCdnHost ? `<div class="row">
        <span class="key">Configured CDN Host</span>
        <span class="val">${configuredCdnHost}</span>
      </div>` : ''}
      <div class="row">
        <span class="key">Forwarded Host</span>
        <span class="val">${forwardedHost}</span>
      </div>
      <div class="row">
        <span class="key">Random Probe ID</span>
        <span class="val">${data.probe.randomId}</span>
      </div>
    </div>
  `);

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

  // add purge section
  renderPurgeSection(resultsContainer, data);
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
        count = count > 2 ? 0 : count + 1;
        resultsContainer.innerHTML = `<div class="spinner">Searching logs${'.'.repeat(count)}</div>`;
      }, 250);
      const response = await fetchDetails(url);
      clearInterval(interval);

      if (!response.ok) {
        resultsContainer.innerHTML = `<p class="error">Failed to fetch details: ${await response.text()}</p>`;
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
