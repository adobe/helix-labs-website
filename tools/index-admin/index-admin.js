import { initConfigField, updateConfig } from '../../utils/config/config.js';
import { toClassName } from '../../scripts/aem.js';

const adminForm = document.getElementById('admin-form');
const site = document.getElementById('site');
const org = document.getElementById('org');
const logTable = document.getElementById('console');
const addIndexButton = document.getElementById('add-index');

let loadedIndices;
let YAML;

function logResponse(cols) {
  const hidden = logTable.closest('[aria-hidden]');
  if (hidden) hidden.removeAttribute('aria-hidden');
  const row = document.createElement('tr');

  // Get current time in hh:mm:ss format
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Add each column to the row
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

function displayIndexDetails(indexName, indexDef, newIndex = false) {
  document.body.append(document.querySelector('#index-details-dialog-template').content.cloneNode(true));
  const indexDetails = document.querySelector('dialog.index-details');

  indexDetails.querySelector('#index-name').value = indexName;
  if (!newIndex) {
    indexDetails.querySelector('#index-name').readOnly = true;
  }
  indexDetails.querySelector('#index-target').value = indexDef.target;
  indexDetails.querySelector('#index-include').value = indexDef?.include?.join('\n') || '';
  indexDetails.querySelector('#index-exclude').value = indexDef?.exclude?.join('\n') || '';

  const propertiesContainer = indexDetails.querySelector('.properties-container');
  Object.entries(indexDef.properties).forEach(([propName, propInfo]) => {
    propertiesContainer.append(document.querySelector('#index-property-row-template').content.cloneNode(true));
    const property = propertiesContainer.lastElementChild;

    const idSuffix = toClassName(propName);
    property.dataset.idSuffix = idSuffix;
    const nameField = property.querySelector('#index-property-name');
    const selectField = property.querySelector('#index-property-select');
    const selectFirstField = property.querySelector('#index-property-select-first');
    const valueField = property.querySelector('#index-property-value');

    nameField.id = `index-property-name-${idSuffix}`;
    selectField.id = `index-property-select-${idSuffix}`;
    selectFirstField.id = `index-property-select-first-${idSuffix}`;
    valueField.id = `index-property-value-${idSuffix}`;

    nameField.value = propName;
    selectField.value = propInfo.select || '';
    selectFirstField.value = propInfo.selectFirst || '';
    valueField.value = propInfo.value;

    const nameFieldLabel = property.querySelector('label[for="index-property-name"]');
    const selectFieldLabel = property.querySelector('label[for="index-property-select"]');
    const selectFirstFieldLabel = property.querySelector('label[for="index-property-select-first"]');
    const valueFieldLabel = property.querySelector('label[for="index-property-value"]');

    nameFieldLabel.htmlFor = `index-property-name-${idSuffix}`;
    selectFieldLabel.htmlFor = `index-property-select-${idSuffix}`;
    selectFirstFieldLabel.htmlFor = `index-property-select-first-${idSuffix}`;
    valueFieldLabel.htmlFor = `index-property-value-${idSuffix}`;

    property.querySelector('.remove-property-btn').addEventListener('click', () => {
      property.remove();
    });
  });

  indexDetails.showModal();

  // Add event listeners for add/remove property buttons
  const addPropertyBtn = indexDetails.querySelector('.add-property-btn');
  addPropertyBtn.addEventListener('click', () => {
    propertiesContainer.append(document.querySelector('#index-property-row-template').content.cloneNode(true));
    const property = propertiesContainer.lastElementChild;
    const idSuffix = Math.random().toString(36).substring(2, 12);
    property.dataset.idSuffix = idSuffix;

    const nameField = property.querySelector('#index-property-name');
    const selectField = property.querySelector('#index-property-select');
    const selectFirstField = property.querySelector('#index-property-select-first');
    const valueField = property.querySelector('#index-property-value');

    nameField.id = `index-property-name-${idSuffix}`;
    selectField.id = `index-property-select-${idSuffix}`;
    selectFirstField.id = `index-property-select-first-${idSuffix}`;
    valueField.id = `index-property-value-${idSuffix}`;

    const nameFieldLabel = property.querySelector('label[for="index-property-name"]');
    const selectFieldLabel = property.querySelector('label[for="index-property-select"]');
    const selectFirstFieldLabel = property.querySelector('label[for="index-property-select-first"]');
    const valueFieldLabel = property.querySelector('label[for="index-property-value"]');

    nameFieldLabel.htmlFor = `index-property-name-${idSuffix}`;
    selectFieldLabel.htmlFor = `index-property-select-${idSuffix}`;
    selectFirstFieldLabel.htmlFor = `index-property-select-first-${idSuffix}`;
    valueFieldLabel.htmlFor = `index-property-value-${idSuffix}`;

    property.querySelector('.remove-property-btn').addEventListener('click', () => {
      property.remove();
    });
  });

  const cancel = indexDetails.querySelector('#cancel-index');
  indexDetails.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // validate properties
    const properties = {};
    indexDetails.querySelectorAll('.index-property').forEach((property) => {
      const { idSuffix } = property.dataset;
      const name = property.querySelector(`#index-property-name-${idSuffix}`).value.trim();
      const select = property.querySelector(`#index-property-select-${idSuffix}`).value.trim();
      const selectFirst = property.querySelector(`#index-property-select-first-${idSuffix}`).value.trim();
      const value = property.querySelector(`#index-property-value-${idSuffix}`).value.trim();

      properties[name] = { value };
      if (select) {
        properties[name].select = select;
      }
      if (selectFirst) {
        properties[name].selectFirst = selectFirst;
      }
    });

    loadedIndices.indices[indexDetails.querySelector('#index-name').value.trim()] = {
      target: indexDetails.querySelector('#index-target').value.trim(),
      include: indexDetails.querySelector('#index-include').value.split('\n').map((line) => line.trim()),
      properties,
    };

    if (indexDetails.querySelector('#index-exclude').value) {
      loadedIndices.indices[indexDetails.querySelector('#index-name').value.trim()].exclude = indexDetails.querySelector('#index-exclude').value.split('\n').map((line) => line.trim());
    }

    const yamlText = YAML.stringify(loadedIndices);
    const resp = await fetch(`https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/query.yaml`, {
      method: 'POST',
      headers: {
        'content-type': 'text/yaml',
      },
      body: yamlText,
    });

    logResponse([resp.status, 'POST', `https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/query.yaml`, resp.headers.get('x-error') || '']);

    if (resp.ok) {
      indexDetails.close();
      indexDetails.remove();

      const indexesList = document.getElementById('indexes-list');
      indexesList.innerHTML = '';
      adminForm.dispatchEvent(new Event('submit'));
    } else {
      // eslint-disable-next-line no-alert
      alert('Failed to save index, check console for details');
    }
  });

  cancel.addEventListener('click', (e) => {
    e.preventDefault();
    indexDetails.close();
    indexDetails.remove();
  });

  // close on click ouside modal
  indexDetails.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = indexDetails.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      indexDetails.close();
      indexDetails.remove();
    }
  });
}

function populateIndexes(indexes) {
  const indexesList = document.getElementById('indexes-list');
  indexesList.innerHTML = '';

  Object.entries(indexes).forEach(([name, indexDef]) => {
    indexesList.append(document.querySelector('#index-card-template').content.cloneNode(true));

    const indexItem = indexesList.lastElementChild;
    indexItem.querySelector('.index-name').textContent = name;
    indexItem.querySelector('.index-attribute-value-target').textContent = indexDef.target;
    indexItem.querySelector('.index-attribute-value-include').innerHTML = indexDef?.include?.join('<br>') || 'n/a';
    indexItem.querySelector('.index-attribute-value-exclude').innerHTML = indexDef?.exclude?.join('<br>') || 'n/a';

    indexItem.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      displayIndexDetails(name, indexDef);
    });
  });
}

async function init() {
  await initConfigField();

  addIndexButton.addEventListener('click', () => {
    displayIndexDetails('', {
      target: '/query-index.json',
      include: ['/**'],
      exclude: [
        '**/fragments/**',
        '**/drafts/**',
        '**/*.json',
      ],
      properties: {
        title: {
          selectFirst: 'meta[property="og:title"]',
          value: 'attribute(el, "content")',
        },
        date: {
          selectFirst: 'meta[name="publication-date"]',
          value: 'attribute(el, "content")',
        },
        description: {
          selectFirst: 'meta[property="og:description"]',
          value: 'attribute(el, "content")',
        },
        image: {
          selectFirst: 'meta[property="og:image"]',
          value: 'attribute(el, "content")',
        },
      },
    }, true);
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      // eslint-disable-next-line no-alert
      alert('Please select an organization and site first');
      return;
    }

    const indexUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/content/query.yaml`;
    const resp = await fetch(indexUrl);
    logResponse([resp.status, 'GET', indexUrl, resp.headers.get('x-error') || '']);

    if (resp.ok) {
      updateConfig();
      // eslint-disable-next-line import/no-unresolved
      YAML = YAML || await import('https://unpkg.com/yaml@2.8.1/browser/index.js');

      const yamlText = await resp.text();
      loadedIndices = YAML.parse(yamlText);

      populateIndexes(loadedIndices.indices);
      addIndexButton.disabled = false;
    }
  });
}

init();
