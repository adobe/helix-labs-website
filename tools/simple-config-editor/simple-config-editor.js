// Removed config.js import since we're not using datalist functionality

let currentConfig = {};
let configPath = '';

const org = document.getElementById('org');
const site = document.getElementById('site');
const configEditor = document.getElementById('config-editor');
const configTbody = document.getElementById('config-tbody');
const logTbody = document.getElementById('log-tbody');

// Utility functions

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return String(text);
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return String(input);
  }
  // Remove script tags and event handlers
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

/**
 * Validates property key format to prevent injection
 * @param {string} key - Property key to validate
 * @returns {boolean} - Whether key is valid
 */
function isValidPropertyKey(key) {
  if (typeof key !== 'string' || key.length === 0) {
    return false;
  }
  // Only allow alphanumeric characters, dots, underscores, and hyphens
  const validKeyPattern = /^[a-zA-Z0-9._-]+$/;
  return validKeyPattern.test(key);
}

/**
 * Logs a message to the console table
 * @param {string} status - Status type (success, error, info, warning)
 * @param {string} action - Action performed
 * @param {string} message - Log message
 */
function logMessage(status, action, message) {
  const row = document.createElement('tr');
  const time = new Date().toLocaleTimeString();

  // Escape all user input to prevent XSS
  const escapedStatus = escapeHtml(status);
  const escapedAction = escapeHtml(action);
  const escapedMessage = escapeHtml(message);

  row.innerHTML = `
    <td>${escapeHtml(time)}</td>
    <td class="log-status ${escapedStatus}">${escapedStatus.toUpperCase()}</td>
    <td>${escapedAction}</td>
    <td>${escapedMessage}</td>
  `;

  logTbody.prepend(row);

  // Keep only last 50 log entries
  while (logTbody.children.length > 50) {
    logTbody.removeChild(logTbody.lastChild);
  }
}

/**
 * Gets a nested value from an object using a path
 * @param {Object} obj - The object to get the value from
 * @param {string} path - The path to the property
 * @param {string} key - The final key
 * @returns {*} - The value
 */
function getNestedValue(obj, path, key) {
  if (!path) return obj[key];

  const pathParts = path.split('.');
  let current = obj;

  pathParts.forEach((part) => {
    current = current[part];
  });

  return current[key];
}

/**
 * Sets a nested value in an object using a path
 * @param {Object} obj - The object to set the value in
 * @param {string} path - The path to the property
 * @param {string} key - The final key
 * @param {*} value - The value to set
 */
function setNestedValue(obj, path, key, value) {
  if (!path) {
    obj[key] = value;
    return;
  }

  const pathParts = path.split('.');
  let current = obj;

  pathParts.forEach((part) => {
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  });

  current[key] = value;
}

/**
 * Removes a nested value from an object using a path
 * @param {Object} obj - The object to remove the value from
 * @param {string} path - The path to the property
 * @param {string} key - The final key
 */
function removeNestedValue(obj, path, key) {
  if (!path) {
    delete obj[key];
    return;
  }

  const pathParts = path.split('.');
  let current = obj;

  pathParts.forEach((part) => {
    current = current[part];
  });

  delete current[key];
}

/**
 * Creates nested object structure if it doesn't exist
 * @param {Object} obj - The object to create structure in
 * @param {string} path - The path to create (e.g., "cdn.provider")
 */
function createNestedStructure(obj, path) {
  if (!path) return;

  const pathParts = path.split('.');
  let current = obj;

  pathParts.forEach((part) => {
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  });
}

/**
 * Determines the type of a value for display purposes
 * @param {*} value - The value to check
 * @returns {string} - The type string
 */
function getValueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

/**
 * Formats a value for display in the table
 * @param {*} value - The value to format
 * @returns {string} - Formatted value string
 */
function formatValueForDisplay(value) {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/**
 * Creates an input element for editing a value
 * @param {*} value - The current value
 * @returns {HTMLElement} - The input element
 */
function createValueInput(value) {
  const valueType = getValueType(value);

  if (valueType === 'array') {
    const arrayValue = Array.isArray(value) ? value.join(', ') : '';
    if (arrayValue.length > 50) {
      const textarea = document.createElement('textarea');
      textarea.className = 'config-value-textarea';
      textarea.value = arrayValue;
      textarea.placeholder = 'Enter comma-separated values...';
      return textarea;
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'config-value-input';
    input.value = arrayValue;
    input.placeholder = 'Enter comma-separated values...';
    return input;
  }
  if (valueType === 'object') {
    const textarea = document.createElement('textarea');
    textarea.className = 'config-value-textarea';
    textarea.value = JSON.stringify(value, null, 2);
    textarea.placeholder = 'Enter JSON...';
    return textarea;
  }
  const stringValue = value === null ? '' : String(value);
  if (stringValue.length > 50) {
    const textarea = document.createElement('textarea');
    textarea.className = 'config-value-textarea';
    textarea.value = stringValue;
    return textarea;
  }
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'config-value-input';
  input.value = stringValue;
  return input;
}

/**
 * Parses a value from the input element
 * @param {HTMLElement} input - The input element
 * @param {string} originalType - The original value type
 * @returns {*} - The parsed value
 */
function parseValueFromInput(input, originalType) {
  const value = sanitizeInput(input.value.trim());

  if (originalType === 'array') {
    if (value === '') return [];
    return value.split(',').map((item) => item.trim()).filter((item) => item !== '');
  }
  if (originalType === 'object') {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
  }
  if (originalType === 'number') {
    const num = Number(value);
    if (Number.isNaN(num)) throw new Error('Invalid number');
    return num;
  }
  if (originalType === 'boolean') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    throw new Error('Invalid boolean (use true or false)');
  }
  if (originalType === 'null') {
    if (value === '' || value.toLowerCase() === 'null') return null;
    throw new Error('Invalid null value');
  }

  return value;
}

/**
 * Creates a table row for a config property
 * @param {string} key - The property key
 * @param {*} value - The property value
 * @param {string} path - The full path to the property
 * @returns {HTMLElement} - The table row element
 */
function createConfigRow(key, value, path = '') {
  const row = document.createElement('tr');
  const valueType = getValueType(value);
  const fullPath = path ? `${path}.${key}` : key;

  // Escape all user input to prevent XSS
  const escapedKey = escapeHtml(key);
  const escapedPath = escapeHtml(path);
  const escapedFullPath = escapeHtml(fullPath);
  const escapedValue = escapeHtml(formatValueForDisplay(value));

  row.innerHTML = `
    <td class="config-key-cell">
      ${escapedFullPath}
    </td>
    <td class="config-value-cell">
      <div class="config-value-display ${escapeHtml(valueType)}">${escapedValue}</div>
    </td>
    <td class="config-actions-cell">
      <button class="button outline edit-property" data-key="${escapedKey}" data-path="${escapedPath}">Edit</button>
      <button class="button outline remove-property" data-key="${escapedKey}" data-path="${escapedPath}">Remove</button>
    </td>
  `;

  return row;
}

/**
 * Flattens a nested object into key-value pairs with paths, filtering for specific prefixes
 * @param {Object} obj - The object to flatten
 * @param {string} prefix - The current path prefix
 * @returns {Array} - Array of {key, value, path} objects
 */
function flattenObject(obj, prefix = '') {
  const result = [];
  const allowedPrefixes = ['cdn', 'access', 'metadata'];

  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Check if this key or any parent key starts with allowed prefixes
    const keyParts = fullKey.split('.');
    const hasAllowedPrefix = keyParts.some((part) => allowedPrefixes.some(
      (allowedPrefix) => part.startsWith(allowedPrefix),
    ));

    if (!hasAllowedPrefix) {
      return; // Skip this key if it doesn't match our criteria
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      result.push(...flattenObject(value, path));
    } else {
      result.push({ key, value, path: prefix });
    }
  });

  return result;
}

/**
 * Populates the config table with the current configuration
 */
function populateConfigTable() {
  configTbody.innerHTML = '';

  if (Object.keys(currentConfig).length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="3" style="text-align: center; padding: var(--spacing-l); color: var(--gray-500);">
        ${escapeHtml('No configuration properties found')}
      </td>
    `;
    configTbody.appendChild(row);
    return;
  }

  const flattened = flattenObject(currentConfig);

  flattened.forEach(({ key, value, path }) => {
    const row = createConfigRow(key, value, path);
    configTbody.appendChild(row);
  });

  // Add event listeners for edit and remove buttons
  configTbody.querySelectorAll('.edit-property').forEach((button) => {
    button.addEventListener('click', (e) => {
      const { key } = e.target.dataset;
      const { path } = e.target.dataset;
      // eslint-disable-next-line no-use-before-define
      editProperty(key, path);
    });
  });

  configTbody.querySelectorAll('.remove-property').forEach((button) => {
    button.addEventListener('click', (e) => {
      const { key } = e.target.dataset;
      const { path } = e.target.dataset;
      // eslint-disable-next-line no-use-before-define
      removeProperty(key, path);
    });
  });
}

/**
 * Edits a property value inline
 * @param {string} key - The property key
 * @param {string} path - The property path
 */
function editProperty(key, path) {
  const row = Array.from(configTbody.children).find((r) => r.querySelector(`[data-key="${key}"][data-path="${path}"]`));

  if (!row) return;

  const valueCell = row.querySelector('.config-value-cell');
  const currentValue = getNestedValue(currentConfig, path, key);
  const valueType = getValueType(currentValue);

  const input = createValueInput(currentValue);
  const saveButton = document.createElement('button');
  saveButton.className = 'button';
  saveButton.textContent = 'Save';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'button outline';
  cancelButton.textContent = 'Cancel';

  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = 'var(--spacing-xs)';
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);

  valueCell.innerHTML = '';
  valueCell.appendChild(input);
  valueCell.appendChild(buttonContainer);

  input.focus();

  const saveHandler = async () => {
    try {
      const newValue = parseValueFromInput(input, valueType);

      // Fetch current config from server to get latest state
      const adminURL = `https://admin.hlx.page${configPath}`;
      const response = await fetch(adminURL);

      if (!response.ok) {
        throw new Error(`Failed to fetch current config: HTTP ${response.status}`);
      }

      const serverConfig = await response.json();

      // Patch only the edited value
      setNestedValue(serverConfig, path, key, newValue);

      // POST the patched config back
      const saveResponse = await fetch(adminURL, {
        method: 'POST',
        body: JSON.stringify(serverConfig),
        headers: {
          'content-type': 'application/json',
        },
      });

      if (!saveResponse.ok) {
        throw new Error(`Failed to save config: HTTP ${saveResponse.status}`);
      }

      // Update local config with the patched value
      setNestedValue(currentConfig, path, key, newValue);
      populateConfigTable();

      const fullKey = path ? `${path}.${key}` : key;
      const action = currentValue === '' ? 'ADD' : 'EDIT';
      logMessage('success', action, `${action === 'ADD' ? 'Added' : 'Updated'} property: ${fullKey}`);
    } catch (error) {
      logMessage('error', 'EDIT', `Failed to update property: ${error.message}`);
    }
  };

  const cancelHandler = () => {
    // If this was a new property being added (empty value), remove it from local config
    if (currentValue === '') {
      removeNestedValue(currentConfig, path, key);
      logMessage('info', 'CANCEL', `Cancelled adding property: ${path ? `${path}.${key}` : key}`);
    } else {
      logMessage('info', 'CANCEL', `Cancelled editing property: ${path ? `${path}.${key}` : key}`);
    }
    populateConfigTable();
  };

  saveButton.addEventListener('click', saveHandler);
  cancelButton.addEventListener('click', cancelHandler);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveHandler();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelHandler();
    }
  });
}

/**
 * Removes a property from the configuration
 * @param {string} key - The property key
 * @param {string} path - The property path
 */
async function removeProperty(key, path) {
  // eslint-disable-next-line no-alert
  if (!window.confirm(`Are you sure you want to remove the property "${path ? `${path}.${key}` : key}"?`)) {
    return;
  }

  try {
    // Fetch current config from server to get latest state
    const adminURL = `https://admin.hlx.page${configPath}`;
    const response = await fetch(adminURL);

    if (!response.ok) {
      throw new Error(`Failed to fetch current config: HTTP ${response.status}`);
    }

    const serverConfig = await response.json();

    // Remove the property from server config
    removeNestedValue(serverConfig, path, key);

    // POST the updated config back
    const saveResponse = await fetch(adminURL, {
      method: 'POST',
      body: JSON.stringify(serverConfig),
      headers: {
        'content-type': 'application/json',
      },
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save config: HTTP ${saveResponse.status}`);
    }

    // Update local config by removing the property
    removeNestedValue(currentConfig, path, key);
    populateConfigTable();
    logMessage('success', 'REMOVE', `Removed property: ${path ? `${path}.${key}` : key}`);
  } catch (error) {
    logMessage('error', 'REMOVE', `Failed to remove property: ${error.message}`);
  }
}

/**
 * Adds a new property to the configuration
 */
function addProperty() {
  const allowedPrefixes = ['cdn', 'access', 'metadata'];
  // eslint-disable-next-line no-alert
  const key = prompt(`Enter property key (must start with: ${allowedPrefixes.join(', ')}):`);
  if (!key) return;

  // Sanitize the input
  const sanitizedKey = sanitizeInput(key);

  // Validate the key format
  if (!isValidPropertyKey(sanitizedKey)) {
    logMessage('error', 'ADD', 'Property key contains invalid characters. Only alphanumeric characters, dots, underscores, and hyphens are allowed.');
    return;
  }

  // Check if the key starts with an allowed prefix
  const hasAllowedPrefix = allowedPrefixes.some((prefix) => sanitizedKey.startsWith(prefix));
  if (!hasAllowedPrefix) {
    logMessage('error', 'ADD', `Property key must start with one of: ${allowedPrefixes.join(', ')}`);
    return;
  }

  // Handle nested object creation if key contains dots
  if (sanitizedKey.includes('.')) {
    const keyParts = sanitizedKey.split('.');
    const finalKey = keyParts.pop();
    const path = keyParts.join('.');

    // Create nested structure if it doesn't exist
    createNestedStructure(currentConfig, path);

    // Add the property to the nested location
    setNestedValue(currentConfig, path, finalKey, '');

    // Refresh the table to show the new property
    populateConfigTable();

    // Immediately enter edit mode for the new property
    setTimeout(() => {
      editProperty(finalKey, path);
    }, 100);

    logMessage('info', 'ADD', `Added nested property to table: ${sanitizedKey}`);
  } else {
    // Add the property to local config with empty value
    currentConfig[sanitizedKey] = '';

    // Refresh the table to show the new property
    populateConfigTable();

    // Immediately enter edit mode for the new property
    setTimeout(() => {
      editProperty(sanitizedKey, '');
    }, 100);

    logMessage('info', 'ADD', `Added property to table: ${sanitizedKey}`);
  }
}

/**
 * Loads the configuration for the selected org/site
 */
async function loadConfig() {
  if (!org.value || !site.value) {
    logMessage('error', 'LOAD', 'Please select both organization and site');
    return;
  }

  try {
    configPath = `/config/${org.value}/sites/${site.value}.json`;
    const adminURL = `https://admin.hlx.page${configPath}`;

    logMessage('info', 'LOAD', `Loading config from: ${configPath}`);

    const response = await fetch(adminURL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const config = await response.json();
    currentConfig = { ...config };

    configEditor.removeAttribute('aria-hidden');
    populateConfigTable();

    logMessage('success', 'LOAD', 'Configuration loaded successfully');
  } catch (error) {
    logMessage('error', 'LOAD', `Failed to load configuration: ${error.message}`);
  }
}

/**
 * Updates URL parameters based on org/site values
 */
function updateURLParams() {
  const url = new URL(window.location.href);

  if (org.value) {
    url.searchParams.set('org', org.value);
  } else {
    url.searchParams.delete('org');
  }

  if (site.value) {
    url.searchParams.set('site', site.value);
  } else {
    url.searchParams.delete('site');
  }

  window.history.replaceState({}, document.title, url.href);
}

/**
 * Loads org/site values from URL parameters
 */
function loadFromURLParams() {
  const urlParams = new URLSearchParams(window.location.search);

  const orgParam = urlParams.get('org');
  const siteParam = urlParams.get('site');

  if (orgParam) {
    org.value = orgParam;
    site.disabled = false;
  }

  if (siteParam) {
    site.value = siteParam;
  }
}

/**
 * Initializes the config editor
 */
function init() {
  // Load values from URL parameters first
  loadFromURLParams();

  // Enable site field when org has value
  org.addEventListener('input', () => {
    site.disabled = !org.value;
    updateURLParams();
  });

  // Update URL when site changes
  site.addEventListener('input', () => {
    updateURLParams();
  });

  // Load config when form is submitted
  document.getElementById('config-selection-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loadConfig();
  });

  // Add property button
  document.getElementById('add-property').addEventListener('click', addProperty);

  // Auto-load config if both org and site are set from URL params
  if (org.value && site.value) {
    logMessage('info', 'AUTO-LOAD', 'Auto-loading configuration from URL parameters');
    loadConfig();
  }

  logMessage('info', 'INIT', 'Config Editor initialized');
}

init();
