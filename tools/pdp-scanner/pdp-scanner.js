const scannerForm = document.getElementById('scanner-form');
const resultsTable = document.querySelector('#results tbody');
const reloadButton = document.querySelector('#reload-selected');

async function corsFetch(url, cache = false, reload = false) {
  const cacheParam = cache ? 'cache=hard&' : '';
  const reloadParam = reload ? 'reload=true&' : '';
  const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?${cacheParam}${reloadParam}url=${encodeURIComponent(url)}`);
  return resp;
}

function logResult(result) {
  const checkSame = (prop) => {
    if (result.prod[prop] === undefined && result.new[prop] === undefined) {
      return { same: true, value: '' };
    }
    if (result.prod[prop] === result.new[prop]) {
      return { same: true, value: result.prod[prop] };
    }
    return { same: false, value: `${result.prod[prop]} / ${result.new[prop]}` };
  };
  const urls = {
    Prod: result.prod.url,
    New: result.new.url,
  };
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="checkbox" data-urls="${encodeURIComponent(JSON.stringify(urls))}">${result.prod.url.split('/').pop()} [<a href="${result.prod.url}" target="_blank">prod</a> | <a href="${result.new.url}" target="_blank">new</a>]</td>
    <td class="${checkSame('status').same ? 'pass' : 'fail'}">${checkSame('status').value}</td>
    <td class="${checkSame('sku').same ? 'pass' : 'fail'}">${checkSame('sku').value}</td>
    <td class="${checkSame('productId').same ? 'pass' : 'fail'}">${checkSame('productId').value}</td>
    <td class="${checkSame('price').same ? 'pass' : 'fail'}">${checkSame('price').value}</td>
    <td class="${checkSame('numVariants').same ? 'pass' : 'fail'}">${checkSame('numVariants').value}</td>
    <td class="${checkSame('availability').same ? 'pass' : 'fail'}">${checkSame('availability').value}</td>
    <td class="${checkSame('retired').same ? 'pass' : 'fail'}">${checkSame('retired').value}</td>
  `;
  resultsTable.appendChild(row);
}

function extractData(prodDoc, newDoc, JSONLDData, config, result) {
  config.forEach((item) => {
    switch (item.Field) {
      case 'price': {
        const prodElem = prodDoc.querySelector(item.QuerySelector);
        result.prod.price = prodElem ? prodElem.textContent.replace(/[^0-9.]/g, '') : '';
        result.new.price = JSONLDData.offers[0].price;
        break;
      }
      case 'number of variants': {
        result.prod.numVariants = prodDoc.querySelectorAll(item.QuerySelector).length || 1;
        result.new.numVariants = JSONLDData.offers.length;
        break;
      }
      case 'availability': {
        result.prod.availability = prodDoc.querySelector(item.QuerySelector).textContent.split('/').pop();
        result.new.availability = JSONLDData.offers[0].availability.split('/').pop();
        break;
      }
      case 'sku': {
        result.prod.sku = prodDoc.querySelector(item.QuerySelector).textContent;
        result.new.sku = JSONLDData.sku;
        break;
      }
      case 'productId': {
        const prodElem = prodDoc.querySelector(item.QuerySelector);
        result.prod.productId = prodElem ? prodElem.textContent : undefined;
        result.new.productId = result.prod.productId;
        break;
      }
      default:
        if (item.AuxRequest) {
          result.prod[item.Field] = '';
        } else if (item.QuerySelector) {
          if (item.QuerySelector) {
            result.prod[item.Field] = prodDoc.querySelector(item.QuerySelector).textContent;
          } else {
            result.prod[item.Field] = '';
          }
        }
        result.new[item.Field] = JSONLDData.custom[item.Field];
    }
  });
}

async function processAuxRequests(config, result) {
  const patchVars = (template) => template.replace(/\${(\w+)}/g, (match, p1) => result.prod[p1]);

  const auxRequests = config.filter((item) => item.AuxRequest);
  for (let i = 0; i < auxRequests.length; i += 1) {
    const auxRequest = auxRequests[i];
    const finalURL = patchVars(auxRequest.AuxRequest);
    if (!finalURL.includes('undefined')) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const resp = await corsFetch(finalURL, true);
        // eslint-disable-next-line no-await-in-loop
        const respData = await resp.json();
        const path = auxRequest.QuerySelector.split('.');
        let value = respData;
        for (let j = 0; j < path.length; j += 1) {
          value = value[path[j]];
        }
        result.prod[auxRequest.Field] = value;
      } catch (e) {
        console.error(e);
      }
    }
  }
}

function mapResultValues(result, config) {
  config.filter((item) => item.ValueMap).forEach((item) => {
    const rows = item.ValueMap.split(',');
    const map = {};
    rows.forEach((row) => {
      const [key, value] = row.split('=').map((i) => i.trim());
      map[key] = value;
    });
    if (map[result.prod[item.Field]]) {
      result.prod[item.Field] = map[result.prod[item.Field]];
    }
  });
}

async function scanPDP(row, config, reload = false) {
  const prodUrl = row.Prod;
  const newUrl = row.New;

  const prodResponse = await corsFetch(prodUrl, true, reload, true);
  const prodHtml = await prodResponse.text();

  const newResponse = await corsFetch(newUrl, false);
  const newHtml = await newResponse.text();
  const result = {
    prod: {
      status: prodResponse.status,
    },
    new: {
      status: newResponse.status,
    },
  };

  if (prodResponse.status !== 200 || newResponse.status !== 200) {
    return result;
  }

  const prodDoc = new DOMParser().parseFromString(prodHtml, 'text/html');
  const newDoc = new DOMParser().parseFromString(newHtml, 'text/html');

  const JSONLD = newDoc.querySelector('script[type="application/ld+json"]');
  const JSONLDData = JSON.parse(JSONLD.textContent);

  extractData(prodDoc, newDoc, JSONLDData, config, result);
  await processAuxRequests(config, result);
  mapResultValues(result, config);
  return result;
}

function updateUrl(configUrl) {
  const url = new URL(window.location.href);
  url.searchParams.set('config', configUrl);
  window.history.pushState({}, '', url);
}

function reloadSelected(config) {
  const selectedRows = resultsTable.querySelectorAll('input[type="checkbox"]:checked');
  selectedRows.forEach(async (row) => {
    const urls = JSON.parse(decodeURIComponent(row.dataset.urls));
    const result = await scanPDP(urls, config, true);
    logResult(result);
  });
}

function init() {
  const urlInput = document.getElementById('url');

  // Populate from URL parameter if present
  const currentUrl = new URL(window.location.href);
  const initialConfigUrl = currentUrl.searchParams.get('config');
  if (initialConfigUrl) {
    urlInput.value = initialConfigUrl;
  }

  scannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('url').value.trim();
    updateUrl(url);

    // Clear previous results
    resultsTable.innerHTML = '';

    const response = await corsFetch(`${url}?sheet=urls&sheet=config`);
    const json = await response.json();
    const urls = json.urls.data;
    const config = json.config.data;

    reloadButton.addEventListener('click', () => reloadSelected(config));
    reloadButton.disabled = false;
    for (let i = 0; i < urls.length; i += 1) {
      const row = urls[i];
      // eslint-disable-next-line no-await-in-loop
      const result = await scanPDP(row, config);
      result.prod.url = row.Prod;
      result.new.url = row.New;
      logResult(result);
    }
  });
}

init();
