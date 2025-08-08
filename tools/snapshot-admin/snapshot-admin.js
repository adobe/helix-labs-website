/* eslint-disable no-alert */
import {
  fetchSnapshots,
  fetchManifest,
  saveManifest,
  setOrgSite,
  deleteSnapshot,
  reviewSnapshot,
} from './utils.js';
import { initConfigField } from '../../utils/config/config.js';

// DOM Elements
const sitePathForm = document.getElementById('site-path-form');
const orgInput = document.getElementById('org');
const siteInput = document.getElementById('site');
const snapshotsContainer = document.getElementById('snapshots-container');
const snapshotsList = document.getElementById('snapshots-list');
const createSnapshotForm = document.getElementById('create-snapshot-form');
const newSnapshotNameInput = document.getElementById('new-snapshot-name');
const logTable = document.querySelector('table tbody');

// Modal Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalClose = document.querySelector('.modal-close');
const modalOk = document.querySelector('.modal-ok');
const modalOverlay = document.querySelector('.modal-overlay');

let currentOrg = '';
let currentSite = '';
let snapshots = [];

/**
 * Shows a modal dialog
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {boolean} isConfirm - Whether this is a confirmation dialog
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
 */
function showModal(title, message, isConfirm = false) {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.removeAttribute('aria-hidden');

    // Update button text for confirmation dialogs
    if (isConfirm) {
      modalOk.textContent = 'OK';
      // Add Cancel button for confirmations
      if (!document.querySelector('.modal-cancel')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'button outline modal-cancel';
        cancelBtn.textContent = 'Cancel';
        modalOk.parentNode.insertBefore(cancelBtn, modalOk);
      }
    } else {
      modalOk.textContent = 'OK';
      // Remove Cancel button for regular dialogs
      const cancelBtn = document.querySelector('.modal-cancel');
      if (cancelBtn) {
        cancelBtn.remove();
      }
    }

    const closeModal = (confirmed = false) => {
      modal.setAttribute('aria-hidden', 'true');
      modalClose.removeEventListener('click', closeModal);
      modalOk.removeEventListener('click', closeModal);
      modalOverlay.removeEventListener('click', closeModal);
      const cancelBtn = document.querySelector('.modal-cancel');
      if (cancelBtn) {
        cancelBtn.removeEventListener('click', closeModal);
      }
      resolve(confirmed);
    };

    const handleOk = () => closeModal(true);
    const handleCancel = () => closeModal(false);

    modalClose.addEventListener('click', handleCancel);
    modalOk.addEventListener('click', handleOk);
    modalOverlay.addEventListener('click', handleCancel);

    const cancelBtn = document.querySelector('.modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', handleCancel);
    }

    // Focus the OK button for accessibility
    modalOk.focus();
  });
}

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
        <form class="snapshot-edit-form" id="form-${name}">
          <div class="form-field">
            <label for="title-${name}">Title</label>
            <input type="text" id="title-${name}" name="title" placeholder="Snapshot title" autocomplete="on">
          </div>
          <div class="form-field">
            <label for="description-${name}">Description</label>
            <textarea id="description-${name}" name="description" placeholder="Snapshot description" autocomplete="on"></textarea>
          </div>
          <div class="form-field">
            <label for="password-${name}">Password (for reviews)</label>
            <input type="password" id="password-${name}" name="password" placeholder="Review password" autocomplete="current-password">
          </div>
          <div class="form-field">
            <label for="urls-${name}">URLs (one per line)</label>
            <textarea id="urls-${name}" name="urls" rows="10" placeholder="Enter URLs, one per line" autocomplete="on"></textarea>
          </div>
          <div class="snapshot-actions">
            <button type="submit" class="button" data-action="save" data-snapshot="${name}">Save</button>
            <button type="button" class="button outline" data-action="cancel" data-snapshot="${name}">Cancel</button>
            <button type="button" class="button" data-action="lock" data-snapshot="${name}">Lock</button>
            <button type="button" class="button" data-action="unlock" data-snapshot="${name}">Unlock</button>
          </div>
          <div class="review-actions">
            <h4>Review Actions</h4>
            <button type="button" class="button" data-action="request-review" data-snapshot="${name}">Request Review</button>
            <button type="button" class="button" data-action="approve-review" data-snapshot="${name}">Approve Review</button>
            <button type="button" class="button" data-action="reject-review" data-snapshot="${name}">Reject Review</button>
            <a class="button" href="https://${name}--main--${currentSite}--${currentOrg}.aem.reviews/" target="_blank">Open Review</a>
          </div>
        </form>
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
      await showModal('Error', `Error loading snapshots: ${result.error}`);
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
      await showModal('Error', `Error loading snapshot details: ${manifest.error}`);
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
      await showModal('Error', `Error saving snapshot: ${result.error}`);
      return;
    }

    logResponse([200, 'POST', `snapshot/${snapshotName}`, 'Saved successfully']);
    await showModal('Success', 'Snapshot saved successfully!');
  } catch (error) {
    logResponse([500, 'POST', `snapshot/${snapshotName}`, error.message]);
    await showModal('Error', `Error saving snapshot: ${error.message}`);
  }
}

/**
 * Delete a snapshot
 */
async function deleteSnapshotAction(snapshotName) {
  const confirmed = await showModal('Confirm Delete', `Are you sure you want to delete the snapshot "${snapshotName}"?`, true);
  if (!confirmed) return;

  try {
    const result = await deleteSnapshot(snapshotName);

    if (result.error) {
      logResponse([400, 'DELETE', `snapshot/${snapshotName}`, result.error]);
      await showModal('Error', `Error deleting snapshot: ${result.error}`);
      return;
    }

    logResponse([200, 'DELETE', `snapshot/${snapshotName}`, 'Deleted successfully']);

    // Reload snapshots list
    await loadSnapshots();
  } catch (error) {
    logResponse([500, 'DELETE', `snapshot/${snapshotName}`, error.message]);
    await showModal('Error', `Error deleting snapshot: ${error.message}`);
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
      await showModal('Error', `Error creating snapshot: ${result.error}`);
      return;
    }

    logResponse([200, 'POST', `snapshot/${snapshotName}`, 'Created successfully']);

    // Reload snapshots list
    await loadSnapshots();

    // Clear form
    newSnapshotNameInput.value = '';
  } catch (error) {
    logResponse([500, 'POST', `snapshot/${snapshotName}`, error.message]);
    await showModal('Error', `Error creating snapshot: ${error.message}`);
  }
}

/**
 * Handle review actions (lock, unlock, request-review, approve-review, reject-review)
 * @param {string} snapshotName - Name of the snapshot
 * @param {string} action - The action to perform
 */
async function handleReviewAction(snapshotName, action) {
  try {
    // Handle lock/unlock actions by updating the manifest
    if (action === 'lock' || action === 'unlock') {
      const isLocked = action === 'lock';

      logResponse([200, 'POST', `snapshot/${snapshotName}/manifest`, `Setting locked to: ${isLocked}`]);

      // Get current manifest to preserve existing data
      const currentManifest = await fetchManifest(snapshotName);
      if (currentManifest.error) {
        logResponse([400, 'GET', `snapshot/${snapshotName}/manifest`, currentManifest.error]);
        await showModal('Error', `Error loading manifest: ${currentManifest.error}`);
        return;
      }

      // Update manifest with locked state
      const updatedManifest = {
        ...currentManifest,
        locked: isLocked,
      };

      const result = await saveManifest(snapshotName, updatedManifest);

      if (result.error) {
        logResponse([400, 'POST', `snapshot/${snapshotName}/manifest`, result.error]);
        await showModal('Error', `Error ${action}: ${result.error}`);
        return;
      }

      logResponse([200, 'POST', `snapshot/${snapshotName}/manifest`, `${action} successful`]);
      await showModal('Success', `${action} successful!`);

      // Reload snapshot details to reflect the new state
      await loadSnapshotDetails(snapshotName);
      return;
    }

    // Handle review state actions
    let reviewState;

    // Map actions to review states
    switch (action) {
      case 'request-review':
        reviewState = 'request';
        break;
      case 'approve-review':
        reviewState = 'approve';
        break;
      case 'reject-review':
        reviewState = 'reject';
        break;
      default:
        await showModal('Error', `Unknown action: ${action}`);
        return;
    }

    logResponse([200, 'POST', `snapshot/${snapshotName}/review`, `Setting review state to: ${reviewState}`]);

    const result = await reviewSnapshot(snapshotName, reviewState);

    if (result.error) {
      logResponse([400, 'POST', `snapshot/${snapshotName}/review`, result.error]);
      await showModal('Error', `Error ${action}: ${result.error}`);
      return;
    }

    logResponse([200, 'POST', `snapshot/${snapshotName}/review`, `${action} successful`]);
    await showModal('Success', `${action} successful!`);

    // Reload snapshot details to reflect the new state
    await loadSnapshotDetails(snapshotName);
  } catch (error) {
    logResponse([500, 'POST', `snapshot/${snapshotName}/manifest`, error.message]);
    await showModal('Error', `Error ${action}: ${error.message}`);
  }
}

// Event Listeners

/**
 * Handle site path form submission
 */
sitePathForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const org = orgInput.value.trim();
    const site = siteInput.value.trim();

    if (!org || !site) {
      await showModal('Missing Information', 'Please enter both organization and site');
      return;
    }

    currentOrg = org;
    currentSite = site;

    const sitePath = `${org}/${site}`;
    localStorage.setItem('snapshot-admin-site-path', sitePath);

    await loadSnapshots();

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('org', org);
    url.searchParams.set('site', site);
    // eslint-disable-next-line no-restricted-globals
    window.history.pushState({}, '', url);
  } catch (error) {
    await showModal('Error', `Error loading snapshots: ${error.message}`);
  }
});

/**
 * Handle create snapshot form submission
 */
createSnapshotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const snapshotName = newSnapshotNameInput.value.trim();

  if (!snapshotName) {
    await showModal('Missing Information', 'Please enter a snapshot name');
    return;
  }

  await createSnapshot(snapshotName);
});

/**
 * Handle snapshot edit form submissions using event delegation
 */
snapshotsList.addEventListener('submit', async (e) => {
  if (e.target.classList.contains('snapshot-edit-form')) {
    e.preventDefault();
    const snapshotName = e.target.id.replace('form-', '');
    await saveSnapshot(snapshotName);
  }
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
      await handleReviewAction(snapshotName, action);
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
const orgParam = params.get('org');
const siteParam = params.get('site');
const sitePath = params.get('sitePath') || localStorage.getItem('snapshot-admin-site-path');

// Initialize config fields
try {
  await initConfigField();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Failed to initialize config fields:', error);
  // Continue loading the page even if config initialization fails
}

// Check if we have a snapshot URL parameter
if (snapshotParam) {
  const parsed = parseSnapshotUrl(snapshotParam);
  if (parsed) {
    const { org, site, snapshotName } = parsed;

    // Set the org and site inputs (extracted from snapshot URL)
    orgInput.value = org;
    siteInput.value = site;
    currentOrg = org;
    currentSite = site;

    // Load snapshots and auto-expand the target snapshot
    await loadSnapshots();
    await autoExpandSnapshot(snapshotName);

    // Update localStorage and URL
    const autoSitePath = `${org}/${site}`;
    localStorage.setItem('snapshot-admin-site-path', autoSitePath);
    const url = new URL(window.location);
    url.searchParams.set('org', org);
    url.searchParams.set('site', site);
    // eslint-disable-next-line no-restricted-globals
    window.history.replaceState({}, '', url);
  } else {
    // Invalid snapshot URL format
    await showModal('Error', 'Invalid snapshot URL format. Please check the URL and try again.');
  }
} else if (orgParam && siteParam) {
  // Use org and site parameters
  orgInput.value = orgParam;
  siteInput.value = siteParam;
  currentOrg = orgParam;
  currentSite = siteParam;
  await loadSnapshots();
} else if (sitePath) {
  // Fallback to sitePath parameter or localStorage
  try {
    const { org, site } = parseSitePath(sitePath);
    orgInput.value = org;
    siteInput.value = site;
    currentOrg = org;
    currentSite = site;
    await loadSnapshots();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Invalid site path: ${error.message}`);
    await showModal('Error', `Invalid site path: ${error.message}`);
  }
}
