import { div } from '../../../scripts/dom-helpers.js';

const GITHUB_REGEX = /https:\/\/github.com\/([^/]+)\/([^/]+)/;
const SITE_REGEX = /https:\/\/.*--(.*)--(.*?)\.[^/]+(\/?.*)/;

const OPTIONS = {
  method: 'POST',
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
  redirect: 'follow',
  referrerPolicy: 'no-referrer',
};

function parseUrl(url) {
  let match = url.match(GITHUB_REGEX);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      path: '/*',
    };
  }
  match = url.match(SITE_REGEX);
  if (match) {
    return {
      repo: match[1],
      owner: match[2],
      path: match[3] || '/*',
    };
  }
  return {};
}

function showLoading() {
  document.querySelector('.page-status-results .loading').setAttribute('aria-hidden', 'false');
}

async function populateResults(url) {
  const resp = await fetch(`${url}/details`, { mode: 'cors' });
  if (!resp.ok) {
    /* eslint-disable no-console */
    console.log('Unable to fetch job details.');
    return;
  }
  const data = await resp.json();
  const { resources } = data.data;
  const results = document.querySelector('.page-status-results .results');
  resources.forEach((resource) => {
    const {
      path,
      previewLastModified,
      publishLastModified,
    } = resource;
    results.append(div({ class: 'path' }, path), div(previewLastModified || ''), div(publishLastModified || ''));
  });
  document.querySelector('.page-status-results .loading').setAttribute('aria-hidden', 'true');
  results.setAttribute('aria-hidden', 'false');
}

async function checkJob(url) {
  const resp = await fetch(url, { mode: 'cors' });
  if (!resp.ok) {
    /* eslint-disable no-console */
    console.log('Unable to check status of job, terminating checks.');
    return;
  }
  const status = await resp.json();
  if (status.state !== 'completed' && status.state !== 'stopped') {
    setTimeout(() => checkJob(url), 2000);
    return;
  }
  populateResults(url);
}

async function startJob(owner, repo, path) {
  showLoading();
  if (path.endsWith('/')) {
    /* eslint-disable no-param-reassign */
    path = `${path}*`;
  }

  const opts = {
    body: JSON.stringify({ paths: [path] }),
    ...OPTIONS,
  };
  const resp = await fetch(`https://admin.hlx.page/status/${owner}/${repo}/main/*`, opts);
  if (!resp.ok) {
    /* eslint-disable no-console */
    console.log('Error starting job.', resp.status, resp.statusText);
    return;
  }
  const data = await resp.json();
  if (data.job.state !== 'created') {
    /* eslint-disable no-console */
    console.log(`Error starting job, check at: ${data.links.self}`);
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set('job', data.job.name);
  url.searchParams.set('owner', owner);
  url.searchParams.set('repo', repo);
  url.searchParams.set('path', path);
  window.history.pushState({}, '', url);
  setTimeout(() => checkJob(data.links.self), 2000);
}

function submit(e) {
  e.preventDefault();
  const btn = document.querySelector('form button[type="submit"]');
  if (btn.getAttribute('disabled')) return;

  btn.setAttribute('disabled', 'true');
  const url = document.querySelector('form input[type="url"]').value;
  const { owner, repo, path } = parseUrl(url);
  if (!owner || !repo) {
    /* eslint-disable no-console */
    console.error('Invalid URL'); // TODO: Show error message?
    btn.removeAttribute('disabled');
    return;
  }
  startJob(owner, repo, path);
}

function resetForm() {
  document.querySelector('.page-status-results .loading').setAttribute('aria-hidden', 'true');
  document.querySelector('form button[type="submit"]').removeAttribute('disabled');
  const results = document.querySelector('.page-status-results .results');
  results.setAttribute('aria-hidden', 'true');
  results.replaceChildren();

  const url = new URL(window.location.href);
  url.search = '';
  window.history.pushState({}, '', url);
}

function init() {
  const form = document.querySelector('form');
  form.addEventListener('submit', submit);
  const reset = document.querySelector('button#form-reset');
  reset.addEventListener('click', resetForm);

  const params = new URLSearchParams(window.location.search);
  const job = params.get('job');
  const owner = params.get('owner');
  const repo = params.get('repo');
  const path = params.get('path');
  if (job && owner && repo && path) {
    showLoading();
    document.querySelector('form button[type="submit"]').setAttribute('disabled', 'disabled');
    document.querySelector('form input[type="url"]').value = `https://main--${repo}--${owner}.aem.page${path || ''}`;
    checkJob(`https://admin.hlx.page/job/${owner}/${repo}/main/status/${job}`);
  }
}

init();
