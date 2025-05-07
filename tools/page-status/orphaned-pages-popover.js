const ORPHANED_PAGES_LIST = document.getElementById('orphaned-pages-list');
const SPINNER = document.getElementById('spinner');
const STATUS = document.getElementById('orphaned-pages-status');
const HIDE_DRAFTS = document.getElementById('hide-drafts'); 
const params = new URLSearchParams(window.location.search);
const ORG = params.get('owner');
const SITE = params.get('repo');
let JOB_DETAILS = null;

async function fetchJobUrl() {
  try {
    const options = {
      body: JSON.stringify({
        paths: ['/*'],
        select: ['edit', 'preview', 'live'],
      }),
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    };
    const res = await fetch(
      `https://admin.hlx.page/status/${ORG}/${SITE}/main/*`,
      options,
    );
    if (!res.ok) throw res;
    const json = await res.json();
    if (!json.job || json.job.state !== 'created') {
      const error = new Error();
      error.status = 'Job';
      throw error;
    }
    // update url param with job
    return json.links ? json.links.self : null;
  } catch (error) {
    console.error('Error fetching job URL', error);
    return null;
  }
}

function displayJobDetails() {
  const details = JOB_DETAILS.data.resources;
  STATUS.innerHTML = `Phase: ${JOB_DETAILS.data.phase}`;
  if (details && details.length > 0) {
    STATUS.innerHTML = `Scanned ${details.length} pages...`;
    const orphanedPages = details.filter(
      (detail) => {
        let keep = false;
        const exclude = ['/sitemap.xml', '/helix-env.json', '/sitemap.json'];
        if (detail.publishLastModified
          && !detail.sourceLastModified
          && !detail.publishConfigRedirectLocation
        ) keep = true;
        if (exclude.includes(detail.path)) keep = false;
        return keep;
      },
    );
    orphanedPages.forEach((detail) => {
      ORPHANED_PAGES_LIST.innerHTML += `<li class="${detail.path.startsWith('/drafts') ? 'draft' : ''}">${detail.path}</li>`;
    });
    if (orphanedPages.length === 0) {
      if (JOB_DETAILS.state === 'stopped') {
        SPINNER.ariaHidden = 'true';
        ORPHANED_PAGES_LIST.innerHTML = '<li>No orphaned pages found</li>';
      }
    } else {
      SPINNER.ariaHidden = 'true';
    }
  }
}

function pollJob(detailsURL) {
  setTimeout(async () => {
    const res = await fetch(detailsURL);
    const json = await res.json();
    console.log('Job', json);
    JOB_DETAILS = json;
    displayJobDetails();
    if (JOB_DETAILS.state !== 'stopped') {
      pollJob(detailsURL);
    }
  }, 1000);
}

function init() {
  console.log('init', ORG, SITE);
  HIDE_DRAFTS.addEventListener('change', () => {
    if (HIDE_DRAFTS.checked) {
      ORPHANED_PAGES_LIST.classList.add('hide-drafts');
    } else {
      ORPHANED_PAGES_LIST.classList.remove('hide-drafts');
    }
  });
  const runReportButton = document.getElementById('run-report');
  runReportButton.addEventListener('click', async () => {
    const jobUrl = await fetchJobUrl();
    if (jobUrl) {
      const resp = await fetch(jobUrl);
      const job = await resp.json();
      const detailsURL = job.links.details;
      pollJob(detailsURL);
      SPINNER.ariaHidden = 'false';
    }
  });
}

init();
