import { initConfigField, updateConfig } from '../../utils/config/config.js';
import { ensureLogin } from '../../blocks/profile/profile.js';

const adminForm = document.getElementById('admin-form');
const site = document.getElementById('site');
const org = document.getElementById('org');
const logTable = document.getElementById('console');
const addSitemapButton = document.getElementById('add-sitemap');

let loadedSitemaps;
let YAML;

function logResponse(cols) {
  const hidden = logTable.closest('[aria-hidden]');
  if (hidden) hidden.removeAttribute('aria-hidden');
  const row = document.createElement('tr');

  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const statusCode = cols[0];
  [...cols, time].forEach((col, i) => {
    const cell = document.createElement('td');
    if (!i) {
      const code = `<span class="status-light http${Math.floor(col / 100) % 10}">${col}</span>`;
      cell.innerHTML = code;
    } else cell.textContent = col;
    row.append(cell);
  });
  logTable.querySelector('tbody').prepend(row);
  if (statusCode > 399) {
    row.scrollIntoView({ behavior: 'smooth' });
  }
}

function displaySitemapDetails(sitemapName, sitemapDef, newSitemap = false) {
  document.body.append(document.querySelector('#sitemap-details-dialog-template').content.cloneNode(true));
  const sitemapDetails = document.querySelector('dialog.sitemap-details');

  sitemapDetails.querySelector('#sitemap-name').value = sitemapName;
  if (!newSitemap) {
    sitemapDetails.querySelector('#sitemap-name').readOnly = true;
  }
  sitemapDetails.querySelector('#sitemap-source').value = sitemapDef.source || '';
  sitemapDetails.querySelector('#sitemap-destination').value = sitemapDef.destination || '';
  sitemapDetails.querySelector('#sitemap-origin').value = sitemapDef.origin || '';
  sitemapDetails.querySelector('#sitemap-lastmod').value = sitemapDef.lastmod || '';
  sitemapDetails.querySelector('#sitemap-extension').value = sitemapDef.extension || '';

  sitemapDetails.showModal();

  const cancel = sitemapDetails.querySelector('#cancel-sitemap');
  sitemapDetails.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = sitemapDetails.querySelector('#sitemap-name').value.trim();
    const source = sitemapDetails.querySelector('#sitemap-source').value.trim();
    const destination = sitemapDetails.querySelector('#sitemap-destination').value.trim();
    const origin = sitemapDetails.querySelector('#sitemap-origin').value.trim();
    const lastmod = sitemapDetails.querySelector('#sitemap-lastmod').value.trim();
    const extension = sitemapDetails.querySelector('#sitemap-extension').value.trim();

    loadedSitemaps.sitemaps[name] = {
      source,
      destination,
    };

    if (origin) loadedSitemaps.sitemaps[name].origin = origin;
    if (lastmod) loadedSitemaps.sitemaps[name].lastmod = lastmod;
    if (extension) loadedSitemaps.sitemaps[name].extension = extension;

    const yamlText = YAML.stringify(loadedSitemaps);
    const resp = await fetch(`https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/sitemap.yaml`, {
      method: 'POST',
      headers: {
        'content-type': 'text/yaml',
      },
      body: yamlText,
    });

    logResponse([resp.status, 'POST', `https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/sitemap.yaml`, resp.headers.get('x-error') || '']);

    if (resp.ok) {
      sitemapDetails.close();
      sitemapDetails.remove();

      const sitemapsList = document.getElementById('sitemaps-list');
      sitemapsList.innerHTML = '';
      adminForm.dispatchEvent(new Event('submit'));
    } else {
      // eslint-disable-next-line no-alert
      alert('Failed to save sitemap, check console for details');
    }
  });

  cancel.addEventListener('click', (e) => {
    e.preventDefault();
    sitemapDetails.close();
    sitemapDetails.remove();
  });

  sitemapDetails.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = sitemapDetails.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      sitemapDetails.close();
      sitemapDetails.remove();
    }
  });
}

async function generateSitemap(destination) {
  const sitemapUrl = `https://admin.hlx.page/sitemap/${org.value}/${site.value}/main${destination}`;
  const resp = await fetch(sitemapUrl, { method: 'POST' });
  logResponse([resp.status, 'POST', sitemapUrl, resp.headers.get('x-error') || '']);

  if (resp.ok) {
    const result = await resp.json();
    logResponse([200, 'INFO', `Generated sitemap(s): ${result.paths?.join(', ') || destination}`, '']);
  } else if (resp.status === 204) {
    logResponse([204, 'WARN', 'Path is not a destination for any configured sitemap', '']);
  }
}

async function removeSitemap(name) {
  // eslint-disable-next-line no-alert, no-restricted-globals
  if (!confirm(`Remove sitemap configuration "${name}"?`)) {
    return;
  }

  delete loadedSitemaps.sitemaps[name];

  const yamlText = YAML.stringify(loadedSitemaps);
  const resp = await fetch(`https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/sitemap.yaml`, {
    method: 'POST',
    headers: {
      'content-type': 'text/yaml',
    },
    body: yamlText,
  });

  logResponse([resp.status, 'POST', `https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/sitemap.yaml`, resp.headers.get('x-error') || '']);

  if (resp.ok) {
    const sitemapsList = document.getElementById('sitemaps-list');
    sitemapsList.innerHTML = '';
    adminForm.dispatchEvent(new Event('submit'));
  } else {
    // eslint-disable-next-line no-alert
    alert('Failed to remove sitemap, check console for details');
  }
}

function populateSitemaps(sitemaps) {
  const sitemapsList = document.getElementById('sitemaps-list');
  sitemapsList.innerHTML = '';

  Object.entries(sitemaps).forEach(([name, sitemapDef]) => {
    sitemapsList.append(document.querySelector('#sitemap-card-template').content.cloneNode(true));

    const sitemapItem = sitemapsList.lastElementChild;
    sitemapItem.querySelector('.sitemap-name').textContent = name;
    sitemapItem.querySelector('.sitemap-attribute-value-source').textContent = sitemapDef.source || 'n/a';
    sitemapItem.querySelector('.sitemap-attribute-value-destination').textContent = sitemapDef.destination || 'n/a';
    sitemapItem.querySelector('.sitemap-attribute-value-origin').textContent = sitemapDef.origin || 'n/a';

    sitemapItem.querySelector('.edit-sitemap-btn').addEventListener('click', (e) => {
      e.preventDefault();
      displaySitemapDetails(name, sitemapDef);
    });

    sitemapItem.querySelector('.generate-sitemap-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = e.target;
      btn.disabled = true;
      btn.textContent = 'Generating...';
      await generateSitemap(sitemapDef.destination);
      btn.disabled = false;
      btn.textContent = 'Generate';
    });

    sitemapItem.querySelector('.remove-sitemap-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = e.target;
      btn.disabled = true;
      await removeSitemap(name);
      btn.disabled = false;
    });
  });
}

async function init() {
  await initConfigField();

  addSitemapButton.addEventListener('click', () => {
    displaySitemapDetails('', {
      source: '/query-index.json',
      destination: '/sitemap.xml',
      lastmod: 'YYYY-MM-DD',
    }, true);
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      // eslint-disable-next-line no-alert
      alert('Please select an organization and site first');
      return;
    }

    const sitemapUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/sitemap.yaml`;
    const resp = await fetch(sitemapUrl);
    logResponse([resp.status, 'GET', sitemapUrl, resp.headers.get('x-error') || '']);

    if (resp.ok) {
      updateConfig();
      // eslint-disable-next-line import/no-unresolved
      YAML = YAML || await import('https://unpkg.com/yaml@2.8.1/browser/index.js');

      const yamlText = await resp.text();
      loadedSitemaps = YAML.parse(yamlText);

      populateSitemaps(loadedSitemaps.sitemaps || {});
      addSitemapButton.disabled = false;
    } else if (resp.status === 404) {
      updateConfig();
      // eslint-disable-next-line import/no-unresolved
      YAML = YAML || await import('https://unpkg.com/yaml@2.8.1/browser/index.js');

      loadedSitemaps = { version: 1, sitemaps: {} };
      populateSitemaps({});
      addSitemapButton.disabled = false;
    } else if (resp.status === 401) {
      ensureLogin(org.value, site.value);
    }
  });
}

init();
