import {
  fetchSnapshotManifest,
  addToSnapshot,
  deleteFromSnapshot,
  fetchStatus,
  updateReviewStatus,
} from './snapshot-utils.js';

const params = new URLSearchParams(window.location.search);
const referrer = new URL(params.get('referrer'));
const OWNER = params.get('owner');
const REPO = params.get('repo');
const SNAPSHOT = 'default';
const PATHNAME = referrer.pathname;

const ADD = document.getElementById('add-page');
const REMOVE = document.getElementById('remove-page');
const UPDATE = document.getElementById('update');
const PAGE_STATUS = document.getElementById('page-status');
const REVIEWS_LINK = document.getElementById('go-to-review');
const ADMIN_LINK = document.getElementById('go-to-admin');
const SPINNER = document.getElementById('spinner');
const REVIEW_STATUS_WRAPPER = document.getElementById('review-status-wrapper');
const REVIEW_STATUS = document.getElementById('review-status');
const REVIEW_REQUEST = document.getElementById('request');
const REVIEW_REJECT = document.getElementById('reject');
const REVIEW_APPROVE = document.getElementById('approve');
const PAGE_STATUS_WRAPPER = document.getElementById('page-status-wrapper');

async function init() {
  const state = referrer.hostname.includes('reviews') ? 'review' : 'page';

  REVIEWS_LINK.href = `https://${SNAPSHOT}--main--${REPO}--${OWNER}.aem.reviews${PATHNAME}`;
  ADMIN_LINK.href = `/tools/snapshot-admin/index.html?snapshot=https://main--${REPO}--${OWNER}.aem.page/.snapshots/${SNAPSHOT}/.manifest.json`;

  if (state === 'page') {
    PAGE_STATUS_WRAPPER.setAttribute('aria-hidden', 'false');
    REVIEW_STATUS_WRAPPER.setAttribute('aria-hidden', 'true');
  } else if (state === 'review') {
    PAGE_STATUS_WRAPPER.setAttribute('aria-hidden', 'true');
    REVIEW_STATUS_WRAPPER.setAttribute('aria-hidden', 'false');
  }

  const status = await fetchStatus(OWNER, REPO, SNAPSHOT, PATHNAME);
  const manifest = await fetchSnapshotManifest(OWNER, REPO, SNAPSHOT);
  SPINNER.setAttribute('aria-hidden', 'true');
  const { locked } = manifest;

  if (state === 'page') {
    const previewDate = status.preview.preview.lastModified;
    if (locked) {
      ADD.disabled = true;
      REMOVE.disabled = true;
      UPDATE.disabled = true;
      PAGE_STATUS.textContent = 'Snapshot is locked';
    } else if (status.snapshot) {
      const snapshotDate = status.snapshot.preview.lastModified;
      if (!snapshotDate) {
        ADD.disabled = false;
        REMOVE.disabled = true;
        UPDATE.disabled = true;
        PAGE_STATUS.textContent = 'Page is not in snapshot';
      } else if (new Date(previewDate) > new Date(snapshotDate)) {
        ADD.disabled = true;
        REMOVE.disabled = false;
        UPDATE.disabled = false;
        PAGE_STATUS.textContent = 'Page is in snapshot, pending changes';
      } else {
        ADD.disabled = true;
        REMOVE.disabled = false;
        UPDATE.disabled = true;
        PAGE_STATUS.textContent = 'Page is snapshot';
      }
    }
  } else if (state === 'review') {
    if (manifest.review === 'requested') {
      REVIEW_STATUS.textContent = 'Review requested';
      REVIEW_REQUEST.disabled = true;
      REVIEW_REJECT.disabled = false;
      REVIEW_APPROVE.disabled = false;
    } else if (manifest.resources.length > 0) {
      REVIEW_STATUS.textContent = 'Review not requested';
      REVIEW_REQUEST.disabled = false;
      REVIEW_REJECT.disabled = true;
      REVIEW_APPROVE.disabled = true;
    } else {
      REVIEW_STATUS.textContent = 'No pages to review';
      REVIEW_REQUEST.disabled = true;
      REVIEW_REJECT.disabled = true;
      REVIEW_APPROVE.disabled = true;
    }
  }
}

ADD.addEventListener('click', async () => {
  SPINNER.setAttribute('aria-hidden', 'false');
  await addToSnapshot(OWNER, REPO, SNAPSHOT, [PATHNAME]);
  init();
});

REMOVE.addEventListener('click', async () => {
  SPINNER.setAttribute('aria-hidden', 'false');
  await deleteFromSnapshot(OWNER, REPO, SNAPSHOT, PATHNAME);
  init();
});

UPDATE.addEventListener('click', async () => {
  SPINNER.setAttribute('aria-hidden', 'false');
  await addToSnapshot(OWNER, REPO, SNAPSHOT, [PATHNAME]);
  init();
});

REVIEW_REQUEST.addEventListener('click', async () => {
  SPINNER.setAttribute('aria-hidden', 'false');
  await updateReviewStatus(OWNER, REPO, SNAPSHOT, 'request');
  init();
});

REVIEW_REJECT.addEventListener('click', async () => {
  SPINNER.setAttribute('aria-hidden', 'false');
  await updateReviewStatus(OWNER, REPO, SNAPSHOT, 'reject');
  init();
});

REVIEW_APPROVE.addEventListener('click', async () => {
  SPINNER.setAttribute('aria-hidden', 'false');
  await updateReviewStatus(OWNER, REPO, SNAPSHOT, 'approve');
  init();
});

init();
