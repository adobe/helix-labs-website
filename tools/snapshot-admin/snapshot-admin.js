/* eslint-disable no-alert */
const adminForm = document.getElementById('snapshot-admin-form');
const editForm = document.getElementById('snapshot-edit-form');
const snapshotURL = document.getElementById('snapshot-url');
const snapshotResources = document.getElementById('snapshot-resources');
const logTable = document.querySelector('table tbody');
const snapshotElem = document.getElementById('snapshot');
const snapshotStatus = document.getElementById('snapshot-status');
const snapshotSave = document.getElementById('snapshot-save');
const snapshotReview = document.getElementById('snapshot-review');
const snapshotLock = document.getElementById('snapshot-lock');
const snapshotUnlock = document.getElementById('snapshot-unlock');
const snapshotPublish = document.getElementById('snapshot-publish');

let manifest = {};
let adminURL = '';

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

function getCurrentResources() {
  const currentResources = snapshotResources.value.split('\n').map((e) => e.trim()).filter((e) => e);
  return currentResources;
}

function calculateDiff() {
  const currentResources = getCurrentResources();
  const resources = manifest.resources.map((e) => e.path);
  const newItems = currentResources.filter((e) => !resources.includes(e));
  const deletedItems = resources.filter((e) => !currentResources.includes(e));
  return ({
    currentResources,
    resources,
    newItems,
    deletedItems,
  });
}

function updateStatus() {
  const { newItems, deletedItems, currentResources } = calculateDiff();
  snapshotStatus.innerHTML = `${currentResources.length} total, ${newItems.length} new, ${deletedItems.length} deleted`;
  return (newItems.length + deletedItems.length);
}

async function updateSnapshot(update) {
  const resp = await fetch(adminURL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(update),
  });
  logResponse([resp.status, 'POST', `${adminURL}`, resp.headers.get('x-error') || '']);
}

async function lockSnapshot() {
  await updateSnapshot({ locked: true });
}

async function unlockSnapshot() {
  await updateSnapshot({ locked: false });
}

async function publishSnapshot() {
  const resp = await fetch(`${adminURL}?publish=true`, {
    method: 'POST',
  });
  logResponse([resp.status, 'POST', `${adminURL}`, resp.headers.get('x-error') || '']);
}

async function addToSnapshot(path) {
  const url = `${adminURL}${path}`;
  const resp = await fetch(url, { method: 'POST' });
  logResponse([resp.status, 'POST', `${url}`, resp.headers.get('x-error') || '']);
}

async function deleteFromSnapshot(path) {
  const url = `${adminURL}${path}`;
  const resp = await fetch(url, { method: 'DELETE' });
  logResponse([resp.status, 'DELETE', `${url}`, resp.headers.get('x-error') || '']);
}

async function saveSnapshot() {
  const fieldset = editForm.querySelector('fieldset');
  fieldset.disabled = true;
  const { newItems, deletedItems } = calculateDiff();
  for (let i = 0; i < newItems.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await addToSnapshot(newItems[i]);
  }
  for (let i = 0; i < deletedItems.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await deleteFromSnapshot(deletedItems[i]);
  }
  fieldset.disabled = false;
}

function displaySnapshot() {
  snapshotResources.value = manifest.resources.map((e) => e.path).join('\r\n');
  snapshotElem.ariaHidden = false;
  updateStatus();
  snapshotLock.disabled = manifest.locked;
  snapshotUnlock.disabled = !manifest.locked;
}

async function fetchSnapshotManifest(urlString) {
  const url = new URL(urlString);
  const hostname = url.hostname.split('.')[0];
  const [branch, repo, owner] = hostname.split('--');
  const [, , snapshotId] = url.pathname.split('/');
  adminURL = `https://admin.hlx.page/snapshot/${owner}/${repo}/${branch}/${snapshotId}`;
  snapshotReview.href = `https://${snapshotId}--${branch}--${repo}--${owner}.aem.reviews/`;
  const resp = await fetch(adminURL);
  if (resp.status === 200) {
    manifest = (await resp.json()).manifest;
    displaySnapshot();
  }
  logResponse([resp.status, 'GET', adminURL, resp.headers.get('x-error') || '']);
}

/**
 * Handles site admin form submission.
 * @param {Event} e - Submit event.
 */
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  localStorage.setItem('snapshot', snapshotURL.value);
  fetchSnapshotManifest(snapshotURL.value);
});

snapshotURL.value = localStorage.getItem('snapshot') || 'https://main--aem-boilerplate--adobe/.snapshots/default/.manifest.json';
if (snapshotURL.value) fetchSnapshotManifest(snapshotURL.value);

snapshotResources.addEventListener('input', () => {
  const changes = updateStatus();
  snapshotSave.disabled = !changes;
});

snapshotSave.addEventListener('click', async (e) => {
  e.preventDefault();
  await saveSnapshot();
  fetchSnapshotManifest(snapshotURL.value);
});

snapshotLock.addEventListener('click', async (e) => {
  e.preventDefault();
  await lockSnapshot();
  fetchSnapshotManifest(snapshotURL.value);
});

snapshotUnlock.addEventListener('click', async (e) => {
  e.preventDefault();
  await unlockSnapshot();
  fetchSnapshotManifest(snapshotURL.value);
});

snapshotPublish.addEventListener('click', async (e) => {
  e.preventDefault();
  await publishSnapshot();
  fetchSnapshotManifest(snapshotURL.value);
});
