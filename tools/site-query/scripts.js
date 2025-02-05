import { decorateIcons } from '../../scripts/aem.js';
import { initConfigField, updateConfig } from '../../utils/config/config.js';

function getFormData(form) {
  const data = {};
  [...form.elements].forEach((field) => {
    const { name, type } = field;
    const value = !field.value && field.dataset.defaultValue
      ? field.dataset.defaultValue : field.value;
    if (name && type && value) {
      switch (type) {
        // parse number and range as floats
        case 'number':
        case 'range':
          data[name] = parseFloat(value, 10);
          break;
        // convert date and datetime-local to date objects
        case 'date':
        case 'datetime-local':
          data[name] = new Date(value);
          break;
        // store checked checkbox values in array
        case 'checkbox':
          if (field.checked) {
            if (data[name]) data[name].push(value);
            else data[name] = [value];
          }
          break;
        // only store checked radio
        case 'radio':
          if (field.checked) data[name] = value;
          break;
        // convert url to url object
        case 'url':
          data[name] = new URL(value);
          break;
        // store file filelist objects
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

function disableForm(form) {
  [...form.elements].forEach((el) => {
    el.disabled = true;
  });
}

function enableForm(form) {
  [...form.elements].forEach((el) => {
    el.disabled = false;
  });
}

function clearResults(table) {
  const tbody = table.querySelector('tbody.results');
  tbody.replaceChildren();

  const caption = table.querySelector('caption');
  caption.setAttribute('aria-hidden', true);
}

function updateTableError(table, status, org, site) {
  const { title, msg } = (() => {
    switch (status) {
      case 401:
        return {
          title: '401 Unauthorized Error',
          msg: `Unable to display results. <a target="_blank" href="https://main--${site}--${org}.aem.page">Sign in to the ${site} project sidekick</a> to view the results.`,
        };
      default:
        return {
          title: 'Error',
          msg: 'Unable to display results',
        };
    }
  })();

  const errorRow = document.createElement('tr');
  errorRow.className = 'error';
  errorRow.innerHTML = `
    <td colspan="3">
      <div>
        <span class="icon icon-notice"></span>
        <div>
          <p><strong>${title}</strong></p>
          <p>${msg}</p>
        </div>
      </div>
    </td>
  `;

  const tbody = table.querySelector('tbody.results');
  tbody.append(errorRow);

  decorateIcons(tbody);
}

function displayResult(url, matches, org, site) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="edit-link"><a href="#">Edit</a></td>
    <td><a href="${url.href}" target="_blank">${url.href}</a></td>
    <td>${matches}</td>
  `;

  tr.querySelector('.edit-link a').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const statusRes = await fetch(`https://admin.hlx.page/status/${org}/${site}/main${url.pathname}?editUrl=auto`);
      const status = await statusRes.json();
      const editUrl = status.edit && status.edit.url;
      if (editUrl) {
        window.open(editUrl);
      } else {
        throw new Error('admin did not return an edit url');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('failed to open edit link', err);
    }
  });

  return tr;
}

async function* fetchSitemap(sitemapPath, liveHost) {
  const res = await fetch(`https://${liveHost}${sitemapPath}`);
  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const sitemapLocs = doc.querySelectorAll('sitemap > loc');
  for (let i = 0; i < sitemapLocs.length; i += 1) {
    const loc = sitemapLocs[i];
    const liveUrl = new URL(loc.textContent);
    const resucrsiveResults = fetchSitemap(liveUrl.pathname, liveHost);
    // eslint-disable-next-line no-restricted-syntax, no-await-in-loop
    for await (const url of resucrsiveResults) {
      yield url;
    }
  }

  const urlLocs = doc.querySelectorAll('url > loc');
  for (let i = 0; i < urlLocs.length; i += 1) {
    const loc = urlLocs[i];
    const url = new URL(loc.textContent);
    url.host = liveHost;
    yield url;
  }
}

/**
 * query the page for matches
 *
 * @param {URL} url the url to query
 * @param {string} query the query string
 * @param {string} queryType the query type
 * @param {string} path the path filter
 */
async function queryPage(url, query, queryType, path) {
  if (!url.pathname.startsWith(path)) return 0;

  const res = await fetch(url);
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (queryType === 'selector') {
    const elements = doc.querySelectorAll(query);
    return elements.length;
  }

  const body = doc.querySelector('body');
  const text = body.textContent;
  const matches = text.match(new RegExp(query, 'gi'));
  return matches ? matches.length : 0;
}

/**
 * Fetches the live and preview host URLs for org/site.
 * @param {string} org - Organization name.
 * @param {string} site - Site name within org.
 * @returns {Promise<>} Object with `live` and `preview` hostnames.
 */
async function fetchHosts(org, site) {
  let status;
  try {
    const url = `https://admin.hlx.page/status/${org}/${site}/main`;
    const res = await fetch(url);
    status = res.status;
    const json = await res.json();
    return {
      status,
      live: new URL(json.live.url).host,
      preview: new URL(json.preview.url).host,
    };
  } catch (error) {
    return {
      status,
      live: null,
      preview: null,
    };
  }
}

async function init(doc) {
  initConfigField();

  const form = doc.querySelector('#search-form');
  const table = doc.querySelector('.table table');
  const tbody = table.querySelector('tbody.results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const {
      org, site, query, sitemap, queryType, path,
    } = getFormData(form);

    try {
      clearResults(table);
      disableForm(form);

      // fetch host config
      const { status, live } = await fetchHosts(org, site);
      if (!live || status !== 200) {
        updateTableError(table, status, org, site);
        return;
      }

      updateConfig();

      const sitemapUrls = fetchSitemap(sitemap, live);

      let found = 0;
      let searched = 0;

      const caption = table.querySelector('caption');
      caption.setAttribute('aria-hidden', false);
      caption.querySelector('.term').textContent = query;
      caption.querySelector('.results-found').textContent = found;
      caption.querySelector('.results-of').textContent = searched;

      // eslint-disable-next-line no-restricted-syntax
      for await (const sitemapUrl of sitemapUrls) {
        searched += 1;
        const matches = await queryPage(sitemapUrl, query, queryType, path);
        if (matches > 0) {
          found += 1;
          const tr = displayResult(sitemapUrl, matches, org, site);
          tbody.append(tr);
        }

        caption.querySelector('.results-found').textContent = found;
        caption.querySelector('.results-of').textContent = searched;
      }
    } catch (err) {
      updateTableError(table, 500, org, site);
    } finally {
      enableForm(form);
    }
  });

  form.addEventListener('reset', () => {
    clearResults(table);
  });
}

init(document);
