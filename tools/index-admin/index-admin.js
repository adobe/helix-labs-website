import { initConfigField, updateConfig } from '../../utils/config/config.js';
import { toClassName } from '../../scripts/aem.js';

const adminForm = document.getElementById('admin-form');
const site = document.getElementById('site');
const org = document.getElementById('org');
const logTable = document.getElementById('console');
const addIndexButton = document.getElementById('add-index');

let loadedIndices;

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
  const indexDetails = document.createElement('dialog');
  indexDetails.classList.add('index-details');
  indexDetails.innerHTML = `
  <div class="index-details-content">
    <div class="index-details-header">
      <h3>${newIndex ? 'Add Index' : 'Edit Index'}</h3>
    </div>
    <div class="index-details-body">
      <form>
        <div class="form-field">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" value="${indexName}" required ${!newIndex ? 'readonly' : ''} />
        </div>
        <div class="form-field">
          <label for="target">Target</label>
          <input type="text" id="target" name="target" value="${indexDef.target}" required />
        </div>
        <div class="form-field">
          <label for="include">Include</label>
          <textarea id="include" name="include" required>${indexDef?.include?.join('\n') || ''}</textarea>
        </div>
        <div class="form-field">
          <label for="exclude">Exclude</label>
          <textarea id="exclude" name="exclude" required>${indexDef?.exclude?.join('\n') || ''}</textarea>
        </div>
        <div class="index-properties">
          <div class="properties-header-section">
            <h4>Properties</h4>
            <button type="button" class="button outline add-property-btn">Add Property</button>
          </div>
          <div class="properties-container">
            <div class="properties-header">
              <div class="header-cell">Name</div>
              <div class="header-cell">Select</div>
              <div class="header-cell">Select First</div>
              <div class="header-cell">Value</div>
              <div class="header-cell"></div>
            </div>
          </div>
        </div>
        <div class="button-area">
          <p class="button-wrapper">
            <button type="submit" id="save" class="button">Save</button>
          </p>
          <p class="button-wrapper">
            <button type="button" id="cancel" class="button outline">Cancel</button>
          </p>
        </div>
      </form>
    </div>
  </div>
  `;

  const propertiesContainer = indexDetails.querySelector('.properties-container');
  Object.entries(indexDef.properties).forEach(([propName, propInfo]) => {
    const property = document.createElement('div');
    property.classList.add('index-property');
    const propId = toClassName(propName);

    const propNameField = document.createElement('div');
    propNameField.classList.add('form-field');
    propNameField.innerHTML = `
    <label for="${propId}-name">Property Name</label>
    <input type="text" id="${propId}-name" name="${propId}-name"/>
    `;
    propNameField.querySelector('input').value = propName;
    property.append(propNameField);

    const propSelectField = document.createElement('div');
    propSelectField.classList.add('form-field');
    propSelectField.innerHTML = `
    <label for="${propId}-select">Property Type</label>
    <input type="text" id="${propId}-select" name="${propId}-select"/>
    `;
    propSelectField.querySelector('input').value = propInfo.select || '';
    property.append(propSelectField);

    const propSelectFirstField = document.createElement('div');
    propSelectFirstField.classList.add('form-field');
    propSelectFirstField.innerHTML = `
    <label for="${propId}-select">Property Select</label>
    <input type="text" id="${propId}-select-first" name="${propId}-select-first"/>
    `;
    propSelectFirstField.querySelector('input').value = propInfo.selectFirst || '';
    property.append(propSelectFirstField);

    const propValueField = document.createElement('div');
    propValueField.classList.add('form-field');
    propValueField.innerHTML = `
    <label for="${propId}-value">Property Value</label>
    <input type="text" id="${propId}-value" name="${propId}-value"/>
    `;
    propValueField.querySelector('input').value = propInfo.value;
    property.append(propValueField);

    const removeButtonField = document.createElement('div');
    removeButtonField.classList.add('form-field', 'remove-field');
    removeButtonField.innerHTML = `
    <button type="button" class="remove-property-btn" title="Remove Property">×</button>
    `;
    property.append(removeButtonField);

    propertiesContainer.append(property);
  });

  document.body.append(indexDetails);
  indexDetails.showModal();

  // Add event listeners for add/remove property buttons
  const addPropertyBtn = indexDetails.querySelector('.add-property-btn');
  addPropertyBtn.addEventListener('click', () => {
    const newProperty = document.createElement('div');
    newProperty.classList.add('index-property');
    const propId = `new-property-${Date.now()}`;

    newProperty.innerHTML = `
      <div class="form-field">
        <label for="${propId}-name">Property Name</label>
        <input type="text" id="${propId}-name" name="${propId}-name" value=""/>
      </div>
      <div class="form-field">
        <label for="${propId}-select">Property Type</label>
        <select id="${propId}-select" name="${propId}-select">
          <option value="select">Select</option>
          <option value="selectFirst">Select First</option>
        </select>
      </div>
      <div class="form-field">
        <label for="${propId}-select">Property Select</label>
        <input type="text" id="${propId}-select" name="${propId}-select" value=""/>
      </div>
      <div class="form-field">
        <label for="${propId}-value">Property Value</label>
        <input type="text" id="${propId}-value" name="${propId}-value" value=""/>
      </div>
      <div class="form-field remove-field">
        <button type="button" class="remove-property-btn" title="Remove Property">×</button>
      </div>
    `;

    // Add remove event listener to the new button
    newProperty.querySelector('.remove-property-btn').addEventListener('click', () => {
      newProperty.remove();
    });

    propertiesContainer.append(newProperty);
  });

  // Add event listeners to existing remove buttons
  indexDetails.querySelectorAll('.remove-property-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.index-property').remove();
    });
  });

  const save = indexDetails.querySelector('#save');
  const cancel = indexDetails.querySelector('#cancel');
  save.addEventListener('click', (e) => {
    e.preventDefault();

    // validate properties

    loadedIndices.indices[indexDetails.querySelector('#name').value.trim()] = {
      target: indexDetails.querySelector('#target').value.trim(),
      include: indexDetails.querySelector('#include').value.split('\n').map((line) => line.trim()),
      exclude: indexDetails.querySelector('#exclude').value.split('\n').map((line) => line.trim()),
    };

    // todo call api to save

    indexDetails.close();
    indexDetails.remove();
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
    const indexItem = document.createElement('li');
    indexItem.classList.add('index-card');

    indexItem.innerHTML = `
    <p class="index-name">${name}</p>
    <div class="index-attributes">
      <div class="index-attribute"><span class="index-attribute-name">Target:</span> <div class="index-attribute-value">${indexDef.target}</div></div>
      <div class="index-attribute"><span class="index-attribute-name">Include:</span> <div class="index-attribute-value">${indexDef?.include?.join('<br>') || 'n/a'}</div></div>
      <div class="index-attribute"><span class="index-attribute-name">Exclude:</span> <div class="index-attribute-value">${indexDef?.exclude?.join('<br>') || 'n/a'}</div></div>
    </div>
     <button class="button outline">Edit</button>`;

    indexItem.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      displayIndexDetails(name, indexDef);
    });

    indexesList.append(indexItem);
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
        title: {},
        date: {},
        description: {},
        image: {},
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
      const YAML = await import('https://unpkg.com/yaml@2.8.1/browser/index.js');

      const yamlText = await resp.text();
      loadedIndices = YAML.parse(yamlText);

      populateIndexes(loadedIndices.indices);
      addIndexButton.disabled = false;
    }
  });
}

init();
