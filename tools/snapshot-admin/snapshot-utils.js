export async function addToSnapshot(owner, repo, snapshot, paths) {
  const adminURL = `https://admin.hlx.page/snapshot/${owner}/${repo}/main/${snapshot}`;
  const url = `${adminURL}/*`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      paths,
    }),
  });
  return resp;
}

export async function deleteFromSnapshot(owner, repo, snapshot, path) {
  const adminURL = `https://admin.hlx.page/snapshot/${owner}/${repo}/main/${snapshot}`;
  const url = `${adminURL}${path}`;
  const resp = await fetch(url, { method: 'DELETE' });
  return resp;
}

export async function fetchSnapshotManifest(owner, repo, snapshot) {
  const adminURL = `https://admin.hlx.page/snapshot/${owner}/${repo}/main/${snapshot}`;
  const resp = await fetch(adminURL);
  if (resp.status === 200) {
    const { manifest } = await resp.json();
    return manifest;
  }
  return null;
}

export async function fetchStatus(owner, repo, snapshot, path) {
  const status = {};
  const adminSnapshotURL = `https://admin.hlx.page/status/${owner}/${repo}/main/.snapshots/${snapshot}${path}`;
  const respSnapshot = await fetch(adminSnapshotURL);
  if (respSnapshot.status === 200) {
    status.snapshot = await respSnapshot.json();
  }
  const adminPageURL = `https://admin.hlx.page/status/${owner}/${repo}/main${path}`;
  const resp = await fetch(adminPageURL);
  if (resp.status === 200) {
    status.preview = await resp.json();
  }
  return status;
}

export async function updateReviewStatus(owner, repo, snapshot, status) {
  const adminURL = `https://admin.hlx.page/snapshot/${owner}/${repo}/main/${snapshot}`;
  const resp = await fetch(`${adminURL}?review=${status}`, {
    method: 'POST',
  });
  return resp;
}

/**
 * Gets the authentication token from browser cookie or sidekick
 * @returns {Promise<string|null>} The authentication token or null if not found
 */
async function getAuthToken() {
  // First try cookies
  const cookies = document.cookie.split(';');
  if (cookies.length > 0 && cookies[0] !== '') {
    const authCookie = cookies.find((cookie) => {
      const [name] = cookie.trim().split('=');
      return name === 'auth_token';
    });
    if (authCookie) {
      return authCookie.trim().split('=')[1];
    }
  }
  return null;
}

export async function updateScheduledPublish(org, site, snapshotId, scheduledPublish) {
  const adminURL = 'https://helix-snapshot-scheduler-ci.adobeaem.workers.dev/schedule';
  const body = {
    org,
    site,
    snapshotId,
    scheduledPublish,
  };

  const headers = {
    'content-type': 'application/json',
  };

  // Get authentication token from cookies
  const authToken = await getAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const resp = await fetch(`${adminURL}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return resp;
}
