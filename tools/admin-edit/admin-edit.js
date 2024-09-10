const adminForm = document.getElementById('admin-form');
const adminURL = document.getElementById('admin-url');
const bodyForm = document.getElementById('body-form');
const body = document.getElementById('body');
const reqMethod = document.getElementById('method');
const methodDropdown = document.querySelector('.picker-field ul');
const methodOptions = methodDropdown.querySelectorAll('li');
const logTable = document.querySelector('table tbody');

/**
 * Logs the response information to the log table.
 * @param {Array} cols - Array containing response information.
 */
function logResponse(cols) {
  const hidden = logTable.closest('[aria-hidden]');
  if (hidden) hidden.removeAttribute('aria-hidden');
  const row = document.createElement('tr');
  // get the current time in hh:mm:ss format
  const now = new Date();
  const pad = (num) => num.toString().padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  // add each column (including time) to the row
  [...cols, time].forEach((col, i) => {
    const cell = document.createElement('td');
    if (!i) { // decorate status code
      const code = `<span class="status-light http${Math.floor(col / 100) % 10}">${col}</span>`;
      cell.innerHTML = code;
    } else cell.textContent = col;
    row.append(cell);
  });
  logTable.prepend(row);
}

// toggles the request method dropdown
reqMethod.addEventListener('click', () => {
  const expanded = reqMethod.getAttribute('aria-expanded') === 'true';
  reqMethod.setAttribute('aria-expanded', !expanded);
  methodDropdown.hidden = expanded;
});

// handles the selection of a method option from the dropdown
methodOptions.forEach((option) => {
  option.addEventListener('click', () => {
    reqMethod.value = option.textContent;
    reqMethod.setAttribute('aria-expanded', false);
    methodDropdown.hidden = true;
    methodOptions.forEach((o) => o.setAttribute('aria-selected', o === option));
  });
});

/**
 * Handles body form submission.
 * @param {Event} e - Submit event.
 */
bodyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  localStorage.setItem('admin-url', adminURL.value);
  const resp = await fetch(adminURL.value, {
    method: reqMethod.value,
    body: body.value,
    headers: {
      'content-type': adminURL.value.endsWith('.yaml') ? 'text/yaml' : 'application/json',
    },
  });
  resp.text().then(() => {
    logResponse([resp.status, reqMethod.value, adminURL.value, resp.headers.get('x-error') || '']);
  });
});

/**
 * Handles admin form submission.
 * @param {Event} e - Submit event.
 */
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  localStorage.setItem('admin-url', adminURL.value);
  const resp = await fetch(adminURL.value);
  body.value = await resp.text();
  logResponse([resp.status, 'GET', adminURL.value, resp.headers.get('x-error') || '']);
});

// handles admin form reset, clearing the body field
adminForm.addEventListener('reset', () => {
  body.value = '';
});

adminURL.value = localStorage.getItem('admin-url') || 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/';
