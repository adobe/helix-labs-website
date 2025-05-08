import { initConfigField } from '../../utils/config/config.js';

const adminForm = document.getElementById('admin-form');
const cdnForm = document.getElementById('cdn-form');
const cdnFields = document.getElementById('cdn-fields');
const cdnType = document.getElementById('cdn-type');
const logTable = document.querySelector('table tbody');
const site = document.getElementById('site');
const org = document.getElementById('org');

let originalConfig;

const CDN_FIELDS = {
  fastly: [
    {
      name: 'host', type: 'text', required: true, label: 'Production Host',
    },
    {
      name: 'route', type: 'text', required: false, label: 'Routes (comma-separated)',
    },
    {
      name: 'serviceId', type: 'text', required: true, label: 'Service ID',
    },
    {
      name: 'authToken', type: 'password', required: true, label: 'Auth Token',
    },
  ],
  cloudflare: [
    {
      name: 'host', type: 'text', required: true, label: 'Production Host',
    },
    {
      name: 'route', type: 'text', required: false, label: 'Routes (comma-separated)',
    },
    {
      name: 'plan', type: 'text', required: true, label: 'Plan',
    },
    {
      name: 'zoneId', type: 'text', required: true, label: 'Zone ID',
    },
    {
      name: 'apiToken', type: 'password', required: true, label: 'API Token',
    },
  ],
  akamai: [
    {
      name: 'host', type: 'text', required: true, label: 'Production Host',
    },
    {
      name: 'route', type: 'text', required: false, label: 'Routes (comma-separated)',
    },
    {
      name: 'endpoint', type: 'text', required: true, label: 'Endpoint',
    },
    {
      name: 'clientSecret', type: 'password', required: true, label: 'Client Secret',
    },
    {
      name: 'clientToken', type: 'password', required: true, label: 'Client Token',
    },
    {
      name: 'accessToken', type: 'password', required: true, label: 'Access Token',
    },
  ],
  managed: [
    {
      name: 'host', type: 'text', required: true, label: 'Production Host',
    },
    {
      name: 'route', type: 'text', required: false, label: 'Routes (comma-separated)',
    },
  ],
  cloudfront: [
    {
      name: 'host', type: 'text', required: true, label: 'Production Host',
    },
    {
      name: 'route', type: 'text', required: false, label: 'Routes (comma-separated)',
    },
    {
      name: 'distributionId', type: 'text', required: true, label: 'Distribution ID',
    },
    {
      name: 'accessKeyId', type: 'text', required: true, label: 'Access Key ID',
    },
    {
      name: 'secretAccessKey', type: 'password', required: true, label: 'Secret Access Key',
    },
  ],
};

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

function createField(field) {
  const div = document.createElement('div');
  div.className = 'form-field';

  const label = document.createElement('label');
  label.htmlFor = field.name;
  label.textContent = field.label;

  const input = document.createElement('input');
  input.type = field.type;
  input.id = field.name;
  input.name = field.name;
  input.required = field.required;

  div.append(label, input);
  return div;
}

function updateFields() {
  cdnFields.innerHTML = '';
  const type = cdnType.value;
  if (type && CDN_FIELDS[type]) {
    CDN_FIELDS[type].forEach((field) => {
      cdnFields.append(createField(field));
    });
  }
}

function getFormData() {
  const formData = new FormData(cdnForm);
  const data = {
    type: formData.get('cdn-type'),
  };

  CDN_FIELDS[data.type].forEach((field) => {
    const value = formData.get(field.name);
    if (field.name === 'route' && value) {
      data[field.name] = value.split(',').map((r) => r.trim());
    } else {
      data[field.name] = value;
    }
  });

  return data;
}

async function init() {
  await initConfigField();

  cdnType.addEventListener('change', updateFields);

  cdnForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      alert('Please select an organization and site first');
      return;
    }

    const cdnUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/cdn.json`;
    const cdnConfig = getFormData();

    const resp = await fetch(cdnUrl, {
      method: 'POST',
      body: JSON.stringify(cdnConfig),
      headers: {
        'content-type': 'application/json',
      },
    });

    resp.text().then(() => {
      logResponse([resp.status, 'POST', cdnUrl, resp.headers.get('x-error') || '']);
    });
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!org.value || !site.value) {
      alert('Please select an organization and site first');
      return;
    }

    const cdnUrl = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/cdn.json`;
    const resp = await fetch(cdnUrl);
    const buttonBar = document.querySelector('.button-bar');

    if (resp.status === 200) {
      originalConfig = (await resp.json()).prod;
      cdnType.value = originalConfig.type;
      updateFields();

      // Populate fields with existing values
      CDN_FIELDS[originalConfig.type].forEach((field) => {
        const input = document.getElementById(field.name);
        if (input) {
          if (field.name === 'route' && Array.isArray(originalConfig[field.name])) {
            input.value = originalConfig[field.name].join(', ');
          } else {
            input.value = originalConfig[field.name] || '';
          }
        }
      });

      buttonBar.setAttribute('aria-hidden', 'false');
    } else if (resp.status === 404) {
      originalConfig = {};
      buttonBar.setAttribute('aria-hidden', 'false');
    }

    logResponse([resp.status, 'GET', cdnUrl, resp.headers.get('x-error') || '']);
  });
}

init();
