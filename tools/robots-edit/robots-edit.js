import { initConfigField } from '../../utils/config/config.js';

const adminForm = document.getElementById('admin-form');
const bodyForm = document.getElementById('body-form');
const body = document.getElementById('body');
const logTable = document.querySelector('table tbody');
const site = document.getElementById('site');
const org = document.getElementById('org');

function logResponse(cols) {
  const hidden = logTable.closest('[aria-hidden]');
  if (hidden) hidden.removeAttribute('aria-hidden');
  const row = document.createElement('tr');

  // Get current time in hh:mm:ss format
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Add each column to the row
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

async function init() {
  await initConfigField();

  bodyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      alert('Please select an organization and site first');
      return;
    }

    const robotsUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/robots.txt`;
    const resp = await fetch(robotsUrl, {
      method: 'POST',
      body: body.value,
      headers: {
        'content-type': 'text/plain',
      },
    });

    resp.text().then(() => {
      logResponse([resp.status, 'POST', robotsUrl, resp.headers.get('x-error') || '']);
    });
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      // eslint-disable-next-line no-alert
      alert('Please select an organization and site first');
      return;
    }

    const robotsUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/robots.txt`;
    const resp = await fetch(robotsUrl);
    const text = await resp.text();
    body.value = text;
    logResponse([resp.status, 'GET', robotsUrl, resp.headers.get('x-error') || '']);
  });
}

init();
