import { initConfigField, updateConfig } from '../../utils/config/config.js';
import { buildModal } from '../../scripts/scripts.js';

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

  table.querySelectorAll('tbody').forEach((tbody) => {
    if (tbody.classList.contains('error')) {
      tbody.setAttribute('aria-hidden', 'false');
      tbody.querySelector('.error-title').textContent = title;
      tbody.querySelector('.error-msg').innerHTML = msg;
    } else {
      tbody.setAttribute('aria-hidden', 'true');
    }
  });
}

function displayResult(url, matches, org, site) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><a href="${url.href}" target="_blank">${url.href}</a> (<a class="edit-link" href="#">Edit</a>)</td>
    <td>${matches}</td>
  `;

  const editLink = tr.querySelector('a.edit-link');
  editLink.addEventListener('click', async (e) => {
    e.preventDefault();

    if (editLink.classList.contains('disabled')) return;

    if (editLink.getAttribute('href') !== '#') {
      window.open(editLink.href);
      return;
    }

    try {
      const statusRes = await fetch(`https://admin.hlx.page/status/${org}/${site}/main${url.pathname}?editUrl=auto`);
      const status = await statusRes.json();
      const editUrl = status.edit && status.edit.url;
      if (editUrl) {
        editLink.href = editUrl;
        window.open(editUrl);
      } else {
        throw new Error('admin did not return an edit url');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('failed to open edit link', err);
      editLink.textContent = 'Error opening edit link';
      editLink.classList.add('disabled');
    }
  });

  return tr;
}

async function* fetchQueryIndex(queryIndexPath, liveHost) {
  const limit = 512;
  let offset = 0;
  let more = true;

  do {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(`https://${liveHost}${queryIndexPath}?offset=${offset}&limit=${limit}`);
    // eslint-disable-next-line no-await-in-loop
    const json = await res.json();
    offset += limit;
    more = json.data.length > 0;
    for (let i = 0; i < json.data.length; i += 1) {
      const item = json.data[i];
      const url = new URL(item.path, `https://${liveHost}`);
      url.host = liveHost;
      yield url;
    }
  } while (more);
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
    const url = new URL(loc.textContent, `https://${liveHost}`);
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
 */
async function queryPage(url, query, queryType) {
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

async function processUrl(sitemapUrl, query, queryType, org, site) {
  const matches = await queryPage(sitemapUrl, query, queryType);
  if (matches > 0) {
    return displayResult(sitemapUrl, matches, org, site);
  }

  return null;
}

function updateCaption(caption, found, searched) {
  caption.querySelector('.results-found').textContent = found;
  caption.querySelector('.results-of').textContent = searched;
}

function initHelp(doc) {
  const helpButton = doc.getElementById('help-button');
  const [newModal, body] = buildModal();
  newModal.id = 'help-modal';
  body.innerHTML = `
    <h2>Site Query Help</h2>
    <p>Search all of your site's content to find block usages and more.</p>
    <p>Enter the organization and site to search, then enter a query to search for. The query is executed against
      the undecorated page HTML, which means anything added during decoration will not be matched.</p>
    <p>Pages are discovered by using a query index or sitemap. By default, it tries to use <code>/sitemap-index.xml</code></p>
    <div class="note">
      <p class="note-title">Cross-Origin Access</p>
      <p>This tool requires cross-origin (CORS) access to work. Either use a CORS allow plugin or add a header
        <code>Access-Control-Allow-Origin: https://labs.aem.live</code> in your site config.</p>
    </div>
  `;
  doc.body.append(newModal);
  helpButton.addEventListener('click', () => {
    newModal.showModal();
  });
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
  doc.querySelector('.site-query').dataset.status = 'loading';
  initConfigField();

  const form = doc.querySelector('#search-form');
  const table = doc.querySelector('.table table');
  const results = table.querySelector('tbody.results');
  const error = table.querySelector('tbody.error');
  const noResults = table.querySelector('tbody.no-results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    results.setAttribute('aria-hidden', 'false');
    error.setAttribute('aria-hidden', 'true');
    noResults.setAttribute('aria-hidden', 'true');

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

      const sitemapUrls = sitemap.endsWith('.json') ? fetchQueryIndex(sitemap, live) : fetchSitemap(sitemap, live);

      let searched = 0;

      const caption = table.querySelector('caption');
      caption.setAttribute('aria-hidden', false);
      caption.querySelector('.term').textContent = query;
      caption.querySelector('.results-found').textContent = 0;
      caption.querySelector('.results-of').textContent = 0;

      // eslint-disable-next-line no-restricted-syntax
      for await (const sitemapUrl of sitemapUrls) {
        if (sitemapUrl.pathname.startsWith(path)) {
          searched += 1;
          processUrl(sitemapUrl, query, queryType, org, site).then((tr) => {
            if (tr) {
              results.append(tr);
            }
          });
        }
        updateCaption(caption, results.children.length, searched);
      }
      updateCaption(caption, results.children.length, searched);

      if (results.children.length === 0) {
        noResults.setAttribute('aria-hidden', 'false');
        results.setAttribute('aria-hidden', 'true');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      updateTableError(table, 500, org, site);
    } finally {
      enableForm(form);
    }
  });

  form.addEventListener('reset', () => {
    clearResults(table);
  });

  initHelp(doc);

  doc.querySelector('.site-query').dataset.status = 'loaded';
}

init(document);
