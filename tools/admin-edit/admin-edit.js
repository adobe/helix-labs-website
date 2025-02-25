import { loadScript } from '../../scripts/aem.js';
import { initConfigField, updateConfig } from '../../utils/config/config.js';

const adminForm = document.getElementById('admin-form');
const adminURL = document.getElementById('admin-url');
const bodyForm = document.getElementById('body-form');
const bodyWrapper = document.querySelector('.body-wrapper');
const body = document.getElementById('body');
const previewWrapper = document.getElementById('preview-wrapper');
const preview = document.getElementById('preview');
const reqMethod = document.getElementById('method');
const methodDropdown = document.querySelector('.picker-field ul');
const methodOptions = methodDropdown.querySelectorAll('li');
const logTable = document.querySelector('table tbody');
const site = document.getElementById('site');
const org = document.getElementById('org');

// load Prism.js libraries (and remove event listeners to prevent reloading)
async function loadPrism() {
  adminForm.removeEventListener('submit', loadPrism);
  body.removeEventListener('focus', loadPrism);
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js');
  await loadScript('../admin-edit/line-highlight.js');

  /**
   * Tracks the mouse position to check if hovering over a `.line-highlight` element.
   * @param {MouseEvent} e - Mousemove event
   */
  bodyWrapper.addEventListener('mousemove', (e) => {
    const highlight = bodyWrapper.querySelector('.line-highlight');
    if (highlight) {
      // get mouse position relative to .body-wrapper
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // check if mouse is inside highlight
      const highlightRect = highlight.getBoundingClientRect();
      const highlightX = highlightRect.left - rect.left;
      const highlightY = highlightRect.top - rect.top;
      const highlightWidth = highlightRect.width;
      const highlightHeight = highlightRect.height;

      // check if mouse is within bounding box of highlight
      if (
        x >= highlightX
        && x <= highlightX + highlightWidth
        && y >= highlightY
        && y <= highlightY + highlightHeight
      ) {
        highlight.classList.remove('error-hover');
      } else {
        highlight.classList.add('error-hover');
      }
    }
  });
}

/**
 * Validates a JSON string and updates error information.
 * @param {string} code - JSON string to validate
 */
function validateJSON(code) {
  try {
    // json IS valid
    // eslint-disable-next-line no-unused-vars
    const json = JSON.parse(code);
    previewWrapper.removeAttribute('data-line');
    previewWrapper.removeAttribute('data-error');
  } catch (error) {
    // json is INVALID
    const { message } = error;
    // extract line of error (if it exists)
    const match = message.match(/line (\d+)/);
    if (match) {
      let line = parseInt(match[1], 10);
      const prevLineErrors = ['after property value', 'after array element'];
      if (prevLineErrors.some((err) => message.includes(err)) && line > 1) {
        // subtract 1 from line number if error is suspected on previous line
        line -= 1;
      }
      previewWrapper.dataset.line = line;

      // find the first matching split substring in the message
      const splits = [' after JSON', ' in JSON', ' ('];
      const foundSplit = splits.find((split) => message.includes(split));
      const splitMessage = foundSplit ? message.split(foundSplit)[0].trim() : message;

      previewWrapper.dataset.error = splitMessage;
    }
  }
}

/**
 * "Creating an Editable Textarea That Supports Syntax Highlighted Code" by Oliver Geer
 * Published on CSS-Tricks: https://css-tricks.com/creating-an-editable-textarea-that-supports-syntax-highlighted-code/
 */

/**
 * Formats, sanitizes, and syntax-highlights text in code element.
 * @param {HTMLElement} code - Code element to update
 * @param {string} text - Text content to insert into code element
 */
function formatCode(code, text) {
  // check if last character in text is newline
  if (text[text.length - 1] === '\n') {
    // add space to avoid formatting/code rendering issues with trailing newlines
    // eslint-disable-next-line no-param-reassign
    text += ' ';
  }

  // sanitize text to prevent HTML injection
  code.innerHTML = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  validateJSON(code.textContent);

  // eslint-disable-next-line no-undef
  Prism.highlightElement(code);
}

/**
 * Insert two-space "tab" at current cursor position.
 * @param {HTMLElement} input - Input element where tab will be inserted
 * @param {HTMLElement} wrapper - Element where updated/formatted code will be displayed
 */
function addTab(input, wrapper) {
  const code = input.value;
  // split input before/after current cursor position
  const beforeTab = code.slice(0, input.selectionStart);
  const afterTab = code.slice(input.selectionEnd, input.value.length);
  const cursorPosition = input.selectionStart + 2;
  // insert "tab" at current cursor position
  input.value = `${beforeTab}  ${afterTab}`;
  // move cursor after inserted "tab"
  input.selectionStart = cursorPosition;
  input.selectionEnd = cursorPosition;

  formatCode(wrapper, input.value);
}

/**
 * Synchronizes scroll position of target element with scroll position of another element.
 * @param {HTMLElement} target - Target element to which the scroll position will be synced
 * @param {HTMLElement} el - Element whose scroll position will be used to update the target element
 */
function syncScroll(target, el) {
  target.scrollTop = el.scrollTop;
  target.scrollLeft = el.scrollLeft;
}

/**
 * Logs the response information to the log table.
 * @param {Array} cols - Array containing response information
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

function updateAdminUrl() {
  const url = new URL(adminURL.value);
  const orgVal = org.value;
  const siteVal = site.value;

  url.pathname = url.pathname.split('/').reduce((acc, part, i) => {
    const resolvedPart = (() => {
      if (orgVal && i === 2) {
        return part.endsWith('.json') ? `${orgVal}.json` : orgVal;
      }

      if (acc.startsWith('/config/') && acc.endsWith('/sites') && siteVal && i === 4) {
        return part.endsWith('.json') ? `${siteVal}.json` : siteVal;
      }

      if (!acc.startsWith('/config/') && siteVal && i === 3) {
        return siteVal;
      }

      return part;
    })();
    return `${acc}/${resolvedPart}`;
  });
  adminURL.value = url.toString();
}

function updateConfigFields() {
  const url = new URL(adminURL.value);

  const pathParts = url.pathname.split('/');
  pathParts.forEach((part, i) => {
    if (i === 2) {
      org.value = part.endsWith('.json') ? part.slice(0, -5) : part;
    }

    if (i === 4 && pathParts[1] === 'config' && pathParts[3] === 'sites') {
      site.value = part.endsWith('.json') ? part.slice(0, -5) : part;
    }

    if (i === 3 && pathParts[1] !== 'config') {
      site.value = part;
    }
  });

  updateConfig();
}

async function init() {
  adminURL.value = localStorage.getItem('admin-url') || 'https://admin.hlx.page/status/adobe/aem-boilerplate/main/';
  await initConfigField();
  site.addEventListener('input', updateAdminUrl, { once: true });
  site.addEventListener('change', updateAdminUrl);
  org.addEventListener('change', updateAdminUrl);

  /**
   * Handles body form submission.
   * @param {Event} e - Submit event
   */
  bodyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    localStorage.setItem('admin-url', adminURL.value);
    updateConfigFields();

    const headers = {};
    if (body.value) {
      headers['content-type'] = adminURL.value.endsWith('.yaml') ? 'text/yaml' : 'application/json';
    }

    const resp = await fetch(adminURL.value, {
      method: reqMethod.value,
      body: body.value,
      headers,
    });

    resp.text().then(() => {
      logResponse([resp.status, reqMethod.value, adminURL.value, resp.headers.get('x-error') || '']);
    });
  });

  // loads Prism.js libraries when #body focus event is fired for the first time
  body.addEventListener('focus', loadPrism, { once: true });

  /**
   * Formats code in preview element and synchronizes scroll positions.
   * @param {InputEvent} e - Input event
   */
  body.addEventListener('input', (e) => {
    const { value } = e.target;
    formatCode(preview, value);
    syncScroll(previewWrapper, body);
  });

  // synchronizes scroll positions between body and preview wrapper
  body.addEventListener('scroll', () => {
    syncScroll(previewWrapper, body);
  });

  /**
   * Replaces default "Tab" behavior to instead insert a two-space "tab" at current cursor position.
   * @param {KeyboardEvent} e - Keyboard event
   */
  body.addEventListener('keydown', (e) => {
    const { key } = e;
    if (key === 'Tab') {
      e.preventDefault();
      addTab(e.target, preview);
    }
  });

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

  // loads the Prism.js libraries when #admin-form submit event is fired for the first time
  adminForm.addEventListener('submit', loadPrism, { once: true });

  /**
   * Handles admin form submission.
   * @param {Event} e - Submit event
   */
  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    localStorage.setItem('admin-url', adminURL.value);
    updateConfigFields();

    const resp = await fetch(adminURL.value);
    const text = await resp.text();
    body.value = text;
    formatCode(preview, text);
    logResponse([resp.status, 'GET', adminURL.value, resp.headers.get('x-error') || '']);
  });

  // handles admin form reset, clearing the body field
  adminForm.addEventListener('reset', () => {
    body.value = '';
    formatCode(preview, '');
  });
}

init();
