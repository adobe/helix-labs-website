import { initConfigField } from '../../utils/config/config.js';

const adminForm = document.getElementById('admin-form');
const headersForm = document.getElementById('headers-form');
const headersList = document.getElementById('headers-list');
const addHeaderBtn = document.getElementById('add-header');
const logTable = document.querySelector('table tbody');
const site = document.getElementById('site');
const org = document.getElementById('org');

let originalHeaders;

function logResponse(cols) {
  const hidden = logTable.closest('[aria-hidden]');
  if (hidden) hidden.removeAttribute('aria-hidden');
  const row = document.createElement('tr');

  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  [...cols, time].forEach((col, i) => {
    const cell = document.createElement('td');
    if (!i) {
      const code = `<span class="status-light http${Math.floor(col / 100) % 10}">${col}</span>`;
      cell.innerHTML = code;
    } else cell.textContent = col;
    row.append(cell);
  });
  logTable.prepend(row);
}

function createHeaderItem(header = '', value = '') {
  console.log(header, value);
  const div = document.createElement('div');
  div.className = 'header-item';

  const headerInput = document.createElement('input');
  headerInput.type = 'text';
  headerInput.placeholder = 'Header name';
  headerInput.value = header;
  headerInput.required = true;
  headerInput.classList.add('header-key');
  const valueInput = header === 'content-security-policy'
    ? document.createElement('textarea')
    : document.createElement('input');
  valueInput.placeholder = 'Header value';
  valueInput.value = value;
  valueInput.required = true;
  valueInput.classList.add('header-value');

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-header';
  removeBtn.textContent = '\u00D7';
  removeBtn.onclick = () => div.remove();

  div.append(headerInput, valueInput, removeBtn);
  return div;
}

function getHeadersData() {
  const headers = [];
  headersList.querySelectorAll('.header-item').forEach((item) => {
    const header = item.querySelector('.header-key').value.trim();
    const value = item.querySelector('.header-value').value.trim();
    if (header && value) {
      headers.push({
        key: header,
        value,
      });
    }
  });
  return headers;
}

async function init() {
  await initConfigField();

  addHeaderBtn.addEventListener('click', () => {
    headersList.append(createHeaderItem());
  });

  headersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      // eslint-disable-next-line no-alert
      alert('Please select an organization and site first');
      return;
    }

    const headersUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/headers.json`;
    const headers = getHeadersData();
    const patchedHeaders = JSON.parse(JSON.stringify(originalHeaders));
    patchedHeaders['/**'] = headers;

    const resp = await fetch(headersUrl, {
      method: 'POST',
      body: JSON.stringify(patchedHeaders),
      headers: {
        'content-type': 'application/json',
      },
    });

    resp.text().then(() => {
      logResponse([resp.status, 'POST', headersUrl, resp.headers.get('x-error') || '']);
    });
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      // eslint-disable-next-line no-alert
      alert('Please select an organization and site first');
      return;
    }

    const headersUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/headers.json`;
    const resp = await fetch(headersUrl);
    // Clear existing headers
    headersList.innerHTML = '';
    if (resp.status === 200) {
      originalHeaders = (await resp.json());

      const headers = originalHeaders['/**'];
      console.log(headers);

      // Add each header
      headers.forEach(({ key, value }) => {
        console.log(key, value);
        headersList.append(createHeaderItem(key, value));
      });
    } else if (resp.status === 404) {
      originalHeaders = {};
    }

    logResponse([resp.status, 'GET', headersUrl, resp.headers.get('x-error') || '']);
  });
}

init();
