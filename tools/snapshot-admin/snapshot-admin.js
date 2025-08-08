/* eslint-disable no-alert */
import {
  fetchSnapshots,
  fetchManifest,
  saveManifest,
  setOrgSite,
  deleteSnapshot,
} from './utils.js';

// DOM Elements
const sitePathForm = document.getElementById('site-path-form');
const sitePathInput = document.getElementById('site-path');
const snapshotsContainer = document.getElementById('snapshots-container');
const snapshotsList = document.getElementById('snapshots-list');
const createSnapshotForm = document.getElementById('create-snapshot-form');
const newSnapshotNameInput = document.getElementById('new-snapshot-name');
const logTable = document.querySelector('table tbody');

let currentOrg = '';
let currentSite = '';
let snapshots = [];

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

/**
 * Parse site path into org and site
 */
function parseSitePath(sitePath) {
  const parts = sitePath.split('/');
  if (parts.length !== 2) {
    throw new Error('Site path must be in format "org/site"');
  }
  return { org: parts[0], site: parts[1] };
}

/**
 * Create snapshot card HTML
 */
function createSnapshotCard(snapshot) {
  const { name } = snapshot;
  return `
    <div class="snapshot-card" data-snapshot="${name}">
      <div class="snapshot-header">
        <h3>${name}</h3>
        <div class="snapshot-actions">
          <button class="button small edit-snapshot" data-action="edit" data-snapshot="${name}">Edit</button>
          <button class="button small outline delete-snapshot" data-action="delete" data-snapshot="${name}">Delete</button>
        </div>
      </div>
      <div class="snapshot-details" id="details-${name}" style="display: none;">
        <div class="snapshot-edit-form">
          <div class="form-field">
            <label>Title</label>
            <input type="text" id="title-${name}" placeholder="Snapshot title">
          </div>
          <div class="form-field">
            <label>Description</label>
            <textarea id="description-${name}" placeholder="Snapshot description"></textarea>
          </div>
          <div class="form-field">
            <label>Password (for reviews)</label>
            <input type="password" id="password-${name}" placeholder="Review password">
          </div>
          <div class="form-field">
            <label>URLs (one per line)</label>
            <textarea id="urls-${name}" rows="10" placeholder="Enter URLs, one per line"></textarea>
          </div>
          <div class="snapshot-actions">
            <button class="button" data-action="save" data-snapshot="${name}">Save</button>
            <button class="button outline" data-action="cancel" data-snapshot="${name}">Cancel</button>
            <button class="button" data-action="lock" data-snapshot="${name}">Lock</button>
            <button class="button" data-action="unlock" data-snapshot="${name}">Unlock</button>
          </div>
          <div class="review-actions">
            <h4>Review Actions</h4>
            <button class="button" data-action="request-review" data-snapshot="${name}">Request Review</button>
            <button class="button" data-action="approve-review" data-snapshot="${name}">Approve Review</button>
            <button class="button" data-action="reject-review" data-snapshot="${name}">Reject Review</button>
            <a class="button" href="https://${name}--main--${currentSite}--${currentOrg}.aem.reviews/" target="_blank">Open Review</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Parse snapshot URL to extract org, site, and snapshot name
 * @param {string} snapshotUrl - URL like https://main--demo--org.aem.page/.snapshots/name/.manifest.json
 * @returns {Object|null} - {org, site, snapshotName} or null if invalid
 */
function parseSnapshotUrl(snapshotUrl) {
  try {
    const { hostname, pathname } = new URL(snapshotUrl);

    // Parse hostname pattern: main--{site}--{org}.aem.page
    const hostParts = hostname.split('--');
    if (hostParts.length !== 3 || !hostname.endsWith('.aem.page')) {
      return null;
    }

    const [, site, orgWithDomain] = hostParts;
    const org = orgWithDomain.replace('.aem.page', '');

    // Parse path pattern: /.snapshots/{snapshotName}/.manifest.json
    const pathMatch = pathname.match(/^\/\.snapshots\/([^/]+)\/\.manifest\.json$/);
    if (!pathMatch) {
      return null;
    }

    const snapshotName = pathMatch[1];

    return { org, site, snapshotName };
  } catch (error) {
    return null;
  }
}

/**
 * Display snapshots in the UI
 */
function displaySnapshots() {
  if (snapshots.length === 0) {
    snapshotsList.innerHTML = '<p>No snapshots found for this site.</p>';
    return;
  }

  // Check if we have a snapshot parameter to filter by
  const params = new URLSearchParams(window.location.search);
  const snapshotParam = params.get('snapshot');

  let snapshotsToDisplay = snapshots;

  if (snapshotParam) {
    // Parse the snapshot URL to get the snapshot name
    const parsed = parseSnapshotUrl(snapshotParam);
    if (parsed) {
      const { snapshotName } = parsed;
      // Filter to show only the specified snapshot
      snapshotsToDisplay = snapshots.filter((snapshot) => snapshot.name === snapshotName);

      if (snapshotsToDisplay.length === 0) {
        snapshotsList.innerHTML = `<p>Snapshot "${snapshotName}" not found for this site.</p>`;
        return;
      }
    }
  }

  snapshotsList.innerHTML = snapshotsToDisplay.map(createSnapshotCard).join('');
}

/**
 * Load snapshots for the current org/site
 */
async function loadSnapshots() {
  try {
    setOrgSite(currentOrg, currentSite);
    const result = await fetchSnapshots();

    if (result.error) {
      logResponse([400, 'GET', 'snapshots', result.error]);
      // eslint-disable-next-line no-alert
      alert(`Error loading snapshots: ${result.error}`);
      return;
    }

    snapshots = result.snapshots || [];
    displaySnapshots();
    snapshotsContainer.setAttribute('aria-hidden', 'false');
    logResponse([200, 'GET', 'snapshots', `${snapshots.length} snapshots loaded`]);
  } catch (error) {
    logResponse([500, 'GET', 'snapshots', error.message]);
  }
}

/**
 * Load snapshot details for editing
 */
async function loadSnapshotDetails(snapshotName) {
  try {
    const manifest = await fetchManifest(snapshotName);

    if (manifest.error) {
      logResponse([400, 'GET', `snapshot/${snapshotName}`, manifest.error]);
      return;
    }

    // Populate form fields
    const titleInput = document.getElementById(`title-${snapshotName}`);
    const descInput = document.getElementById(`description-${snapshotName}`);
    const passwordInput = document.getElementById(`password-${snapshotName}`);
    const urlsTextarea = document.getElementById(`urls-${snapshotName}`);

    if (titleInput) titleInput.value = manifest.title || '';
    if (descInput) descInput.value = manifest.description || '';
    if (passwordInput) passwordInput.value = manifest.metadata?.reviewPassword || '';

    if (urlsTextarea && manifest.resources) {
      const urlList = manifest.resources.map((resource) => `https://main--${currentSite}--${currentOrg}.aem.page${resource.path}`);
      urlsTextarea.value = urlList.join('\n');
    }

    logResponse([200, 'GET', `snapshot/${snapshotName}`, 'Details loaded']);
  } catch (error) {
    logResponse([500, 'GET', `snapshot/${snapshotName}`, error.message]);
  }
}

/**
 * Save snapshot changes
 */
async function saveSnapshot(snapshotName) {
  try {
    const titleInput = document.getElementById(`title-${snapshotName}`);
    const descInput = document.getElementById(`description-${snapshotName}`);
    const passwordInput = document.getElementById(`password-${snapshotName}`);

    const manifest = {
      title: titleInput.value,
      description: descInput.value,
      metadata: {
        reviewPassword: passwordInput.value,
      },
    };

    // Save manifest
    const result = await saveManifest(snapshotName, manifest);

    if (result.error) {
      logResponse([400, 'POST', `snapshot/${snapshotName}`, result.error]);
      // eslint-disable-next-line no-alert
      alert(`Error saving snapshot: ${result.error}`);
      return;
    }

    logResponse([200, 'POST', `snapshot/${snapshotName}`, 'Saved successfully']);
    // eslint-disable-next-line no-alert
    alert('Snapshot saved successfully!');
  } catch (error) {
    logResponse([500, 'POST', `snapshot/${snapshotName}`, error.message]);
  }
}

/**
 * Delete a snapshot
 */
async function deleteSnapshotAction(snapshotName) {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm(`Are you sure you want to delete the snapshot "${snapshotName}"?`);
  if (!confirmed) return;

  try {
    const result = await deleteSnapshot(snapshotName);

    if (result.error) {
      logResponse([400, 'DELETE', `snapshot/${snapshotName}`, result.error]);
      // eslint-disable-next-line no-alert
      alert(`Error deleting snapshot: ${result.error}`);
      return;
    }

    logResponse([200, 'DELETE', `snapshot/${snapshotName}`, 'Deleted successfully']);

    // Reload snapshots list
    await loadSnapshots();
  } catch (error) {
    logResponse([500, 'DELETE', `snapshot/${snapshotName}`, error.message]);
  }
}

/**
 * Create a new snapshot
 */
async function createSnapshot(snapshotName) {
  try {
    const manifest = {
      title: snapshotName,
      description: '',
      resources: [],
    };

    const result = await saveManifest(snapshotName, manifest);

    if (result.error) {
      logResponse([400, 'POST', `snapshot/${snapshotName}`, result.error]);
      // eslint-disable-next-line no-alert
      alert(`Error creating snapshot: ${result.error}`);
      return;
    }

    logResponse([200, 'POST', `snapshot/${snapshotName}`, 'Created successfully']);

    // Reload snapshots list
    await loadSnapshots();

    // Clear form
    newSnapshotNameInput.value = '';
  } catch (error) {
    logResponse([500, 'POST', `snapshot/${snapshotName}`, error.message]);
  }
}

// Event Listeners

/**
 * Handle site path form submission
 */
sitePathForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const { org, site } = parseSitePath(sitePathInput.value);
    currentOrg = org;
    currentSite = site;

    localStorage.setItem('snapshot-admin-site-path', sitePathInput.value);

    await loadSnapshots();

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('sitePath', sitePathInput.value);
    // eslint-disable-next-line no-restricted-globals
    window.history.pushState({}, '', url);
  } catch (error) {
    // eslint-disable-next-line no-alert
    alert(`Invalid site path: ${error.message}`);
  }
});

/**
 * Handle create snapshot form submission
 */
createSnapshotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const snapshotName = newSnapshotNameInput.value.trim();

  if (!snapshotName) {
    // eslint-disable-next-line no-alert
    alert('Please enter a snapshot name');
    return;
  }

  await createSnapshot(snapshotName);
});

/**
 * Handle clicks on snapshot actions using event delegation
 */
snapshotsList.addEventListener('click', async (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const { action, snapshot: snapshotName } = target.dataset;

  switch (action) {
    case 'edit': {
      const details = document.getElementById(`details-${snapshotName}`);
      if (details.style.display === 'none') {
        await loadSnapshotDetails(snapshotName);
        details.style.display = 'block';
        target.textContent = 'Hide';
      } else {
        details.style.display = 'none';
        target.textContent = 'Edit';
      }
      break;
    }

    case 'save':
      await saveSnapshot(snapshotName);
      break;

    case 'cancel': {
      document.getElementById(`details-${snapshotName}`).style.display = 'none';
      const editBtn = document.querySelector(`[data-action="edit"][data-snapshot="${snapshotName}"]`);
      if (editBtn) editBtn.textContent = 'Edit';
      break;
    }

    case 'delete':
      await deleteSnapshotAction(snapshotName);
      break;

    case 'lock':
    case 'unlock':
    case 'request-review':
    case 'approve-review':
    case 'reject-review':
      // These would integrate with the review system
      // eslint-disable-next-line no-alert
      alert(`${action} functionality would be implemented here`);
      break;
    default:
      break;
  }
});

/**
 * Auto-expand a specific snapshot after loading
 * @param {string} targetSnapshotName - Name of snapshot to expand
 */
async function autoExpandSnapshot(targetSnapshotName) {
  const targetCard = document.querySelector(`[data-snapshot="${targetSnapshotName}"]`);
  if (targetCard) {
    const editButton = targetCard.querySelector('[data-action="edit"]');
    if (editButton) {
      editButton.click();
      // Scroll to the snapshot card
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Initialize from URL parameters or localStorage
const params = new URLSearchParams(window.location.search);
const snapshotParam = params.get('snapshot');
const sitePath = params.get('sitePath') || localStorage.getItem('snapshot-admin-site-path');

// Check if we have a snapshot URL parameter
if (snapshotParam) {
  const parsed = parseSnapshotUrl(snapshotParam);
  if (parsed) {
    const { org, site, snapshotName } = parsed;
    const autoSitePath = `${org}/${site}`;

    // Set the site path input
    sitePathInput.value = autoSitePath;
    currentOrg = org;
    currentSite = site;

    // Load snapshots and auto-expand the target snapshot
    await loadSnapshots();
    await autoExpandSnapshot(snapshotName);

    // Update localStorage and URL
    localStorage.setItem('snapshot-admin-site-path', autoSitePath);
    const url = new URL(window.location);
    url.searchParams.set('sitePath', autoSitePath);
    // eslint-disable-next-line no-restricted-globals
    window.history.replaceState({}, '', url);
  } else {
    // Invalid snapshot URL format
    // eslint-disable-next-line no-alert
    alert('Invalid snapshot URL format. Please check the URL and try again.');
  }
} else if (sitePath) {
  // Fallback to sitePath parameter or localStorage
  sitePathInput.value = sitePath;
  try {
    const { org, site } = parseSitePath(sitePath);
    currentOrg = org;
    currentSite = site;
    await loadSnapshots();
  } catch (error) {
    // eslint-disable-next-line no-alert
    console.error(`Invalid site path: ${error.message}`);
  }
}
