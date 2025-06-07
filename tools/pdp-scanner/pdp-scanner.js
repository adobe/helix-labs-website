const scannerForm = document.getElementById('scanner-form');
const resultsTable = document.querySelector('#results tbody');

async function corsFetch(url, cache = false) {
  const cacheParam = cache ? 'cache=hard&' : '';
  const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?${cacheParam}url=${encodeURIComponent(url)}`);
  return resp;
}

function logResult(result) {
  const checkSame = (prop) => {
    if (result.prod[prop] === result.new[prop]) {
      return { same: true, value: result.prod[prop] };
    }
    return { same: false, value: `${result.prod[prop]} / ${result.new[prop]}` };
  };
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${result.prod.url.split('/').pop()} [<a href="${result.prod.url}" target="_blank">prod</a> | <a href="${result.new.url}" target="_blank">new</a>]</td>
    <td class="${checkSame('status').same ? 'pass' : 'fail'}">${checkSame('status').value}</td>
    <td class="${checkSame('price').same ? 'pass' : 'fail'}">${checkSame('price').value}</td>
    <td class="${checkSame('numVariants').same ? 'pass' : 'fail'}">${checkSame('numVariants').value}</td>
  `;
  resultsTable.appendChild(row);
}

function extractData(prodDoc, newDoc, JSONLDData, config, result) {
  config.forEach((item) => {
    switch (item.Field.toLowerCase()) {
      case 'price': {
        const prodElem = prodDoc.querySelector(item.QuerySelector);
        result.prod.price = prodElem ? prodElem.textContent.replace(/[^0-9.]/g, '') : '';
        result.new.price = JSONLDData.offers[0].price;
        break;
      }
      case 'number of variants': {
        result.prod.numVariants = prodDoc.querySelectorAll('[data-color]').length;
        result.new.numVariants = JSONLDData.offers.length;
        break;
      }
      default:
    }
  });
}

async function scanPDP(row, config) {
  const prodUrl = row.Prod;
  const newUrl = row.New;

  const prodResponse = await corsFetch(prodUrl, true);
  const prodHtml = await prodResponse.text();

  const newResponse = await corsFetch(newUrl);
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
  return result;
}

function updateUrl(configUrl) {
  const url = new URL(window.location.href);
  url.searchParams.set('config', configUrl);
  window.history.pushState({}, '', url);
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
