import { ensureLogin } from '../../blocks/profile/profile.js';

const ROLES = ['admin', 'author', 'publish', 'develop', 'basic_author', 'basic_publish', 'config', 'config_admin'];

function createRolesCheckboxGroup(id, legendText, selectedRoles = []) {
  const checkboxes = ROLES.map((role) => {
    const checked = selectedRoles.includes(role) ? 'checked' : '';
    return `<label><input type="checkbox" name="role" value="${role}" ${checked}>${role}</label>`;
  }).join('');

  return `<fieldset id="${id}" class="roles-checkbox-group">
    <legend>${legendText}</legend>
    ${checkboxes}
  </fieldset>
  <div class="field-help-text">
    <p>See <a href="https://www.aem.live/docs/authentication-setup-authoring#admin-roles" target="_blank">https://www.aem.live/docs/authentication-setup-authoring#admin-roles</a> to learn more about roles and permissions.</p>
  </div>`;
}

const addUserRolesContainer = document.getElementById('add-user-roles-container');
if (addUserRolesContainer) {
  addUserRolesContainer.innerHTML = createRolesCheckboxGroup('add-user-roles', 'Roles');
}

const adminForm = document.getElementById('admin-form');
const site = document.getElementById('site');
const org = document.getElementById('org');
const logTable = document.querySelector('table tbody');
const users = document.getElementById('users');
const addUserButton = document.getElementById('add-user');
const accessConfig = { type: 'org', users: [], originalSiteAccess: {} };
const addUserDetails = document.getElementById('add-user-details');
const addUserForm = document.getElementById('add-user-form');
const addUserEmail = document.getElementById('add-user-email');
const addUserRoles = document.getElementById('add-user-roles');
const addUserSave = document.getElementById('add-user-save');
const addUserCancel = document.getElementById('add-user-cancel');

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

function isValidRoles(rolesContainer) {
  const checkboxes = rolesContainer.querySelectorAll('input[type="checkbox"]:checked');
  if (!checkboxes || checkboxes.length === 0) {
    return false;
  }

  const userRoles = [...checkboxes].map((cb) => cb.value);
  return userRoles.every((role) => ROLES.includes(role));
}

async function getOrgConfig() {
  const adminURL = `https://admin.hlx.page/config/${org.value}.json`;
  const resp = await fetch(adminURL);
  logResponse([resp.status, 'GET', adminURL, resp.headers.get('x-error') || '']);
  if (resp.status === 200) {
    const json = await resp.json();
    return json;
  }
  return null;
}

function displayAddUserDetails() {
  addUserDetails.removeAttribute('aria-hidden');
  addUserDetails.querySelector('input[name="add-user-email"]').focus();
}

async function updateSiteAccess() {
  const toAccess = () => {
    const access = accessConfig.originalSiteAccess;
    access.admin.role = {};
    accessConfig.users.forEach((user) => {
      user.roles.forEach((role) => {
        if (!access.admin.role[role]) {
          access.admin.role[role] = [user.email];
        } else {
          access.admin.role[role].push(user.email);
        }
      });
    });
    return access;
  };
  const access = toAccess();
  const adminURL = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/access.json`;
  const resp = await fetch(adminURL, {
    method: 'POST',
    body: JSON.stringify(access),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  logResponse([resp.status, 'POST', adminURL, resp.headers.get('x-error') || '']);
}

async function addUserToSite(user) {
  accessConfig.users.push(user);
  await updateSiteAccess();
}

async function updateOrgUserRoles(user) {
  const adminURL = `https://admin.hlx.page/config/${org.value}/users/${user.id}.json`;
  const resp = await fetch(adminURL, {
    method: 'POST',
    body: JSON.stringify(user),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  logResponse([resp.status, 'POST', adminURL, resp.headers.get('x-error') || '']);
}

async function deleteUserFromSite(user) {
  accessConfig.users = accessConfig.users.filter((u) => u.email !== user.email);
  await updateSiteAccess();
}

async function deleteUserFromOrg(user) {
  const adminURL = `https://admin.hlx.page/config/${org.value}/users/${user.id}.json`;
  const resp = await fetch(adminURL, {
    method: 'DELETE',
  });
  logResponse([resp.status, 'DELETE', adminURL, resp.headers.get('x-error') || '']);
}

async function addUserToOrg(user) {
  const adminURL = `https://admin.hlx.page/config/${org.value}/users.json`;
  const resp = await fetch(adminURL, {
    method: 'POST',
    body: JSON.stringify(user),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  logResponse([resp.status, 'POST', adminURL, resp.headers.get('x-error') || '']);
}

async function updateSiteUserRoles(user) {
  accessConfig.users.find((u) => u.email === user.email).roles = user.roles;
  await updateSiteAccess();
}

function displayUserDetails(elem, user) {
  const email = user.email.replace('@', '-at-');
  const rolesGroup = createRolesCheckboxGroup(`${email}-roles`, `${user.email} roles`, user.roles);

  elem.innerHTML = `<form id=${email}>
        <fieldset>
        <div class="form-field roles-field">
          ${rolesGroup}
        </div>
        <p class="button-wrapper">
          <button type="submit" id="${email}-save" class="button">Save</button>
          <button id="${email}-delete" class="button outline">Delete ...</button>
        </p>
        </fieldset>
    </form>`;
  const fs = elem.querySelector('fieldset');

  const rolesContainer = document.getElementById(`${email}-roles`);
  rolesContainer.addEventListener('change', () => {
    // eslint-disable-next-line no-use-before-define
    save.disabled = !isValidRoles(rolesContainer);
  });

  const save = document.getElementById(`${email}-save`);
  save.addEventListener('click', async (e) => {
    fs.disabled = 'disabled';
    save.innerHTML += ' <i class="symbol symbol-loading"></i>';
    e.preventDefault();
    const checkboxes = rolesContainer.querySelectorAll('input[type="checkbox"]:checked');
    user.roles = [...checkboxes].map((cb) => cb.value);
    if (accessConfig.type === 'site') {
      await updateSiteUserRoles(user);
    } else {
      await updateOrgUserRoles(user);
    }
    adminForm.dispatchEvent(new Event('submit'));
  });

  const remove = document.getElementById(`${email}-delete`);
  remove.addEventListener('click', async (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    const emailCheck = prompt(`For safety enter email address of the user you are about to delete (${user.email})`);

    if (user.email === emailCheck) {
      fs.disabled = 'disabled';
      remove.innerHTML += ' <i class="symbol symbol-loading"></i>';
      if (accessConfig.type === 'site') {
        await deleteUserFromSite(user);
      } else {
        await deleteUserFromOrg(user);
      }
      adminForm.dispatchEvent(new Event('submit'));
    }
  });
}

async function getSiteAccessConfig() {
  addUserDetails.setAttribute('aria-hidden', 'true');
  const adminURL = `https://admin.hlx.page/config/${org.value}/sites/${site.value}/access.json`;
  const resp = await fetch(adminURL);
  logResponse([resp.status, 'GET', adminURL, resp.headers.get('x-error') || '']);
  if (resp.status === 200) {
    const json = await resp.json();
    return json;
  }
  if (resp.status === 404) {
    return { admin: { role: {} } };
  }

  return null;
}

const createUserItem = (user) => {
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.classList.add('user-name');
  span.textContent = `${user.email} (${user.roles.join(', ')})`;
  li.append(span);
  const buttonContainer = document.createElement('span');
  buttonContainer.classList.add('button-wrapper');
  const editButton = document.createElement('button');
  editButton.classList.add('button');
  editButton.textContent = 'Edit';
  buttonContainer.append(editButton);
  li.append(buttonContainer);
  const userDetails = document.createElement('div');
  userDetails.classList.add('user-details');
  li.append(userDetails);
  editButton.addEventListener('click', () => {
    displayUserDetails(userDetails, user);
  });
  return li;
};

function isValidNewUser(email, rolesContainer) {
  if (!email.checkValidity()) {
    return false;
  }
  if (accessConfig.users.find((user) => user.email === email.value)) {
    return false;
  }
  const checkboxes = rolesContainer.querySelectorAll('input[type="checkbox"]:checked');
  if (!checkboxes || checkboxes.length === 0) {
    return false;
  }

  const userRoles = [...checkboxes].map((cb) => cb.value);
  return userRoles.every((role) => ROLES.includes(role));
}

/**
 * Handles admin form submission.
 * @param {Event} e - Submit event
 */
adminForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!await ensureLogin(org.value, site.value)) {
    // not logged in yet, listen for profile-update event
    window.addEventListener('profile-update', ({ detail: loginInfo }) => {
      // check if user is logged in now
      if (loginInfo.includes(org.value)) {
        // logged in, restart action (e.g. resubmit form)
        e.target.querySelector('button[type="submit"]').click();
      }
    }, { once: true });
    // abort action
    return;
  }
  users.textContent = '';
  window.history.pushState(null, '', `?org=${org.value}&site=${site.value}`);
  if (site.value) {
    accessConfig.type = 'site';

    const configUsers = [];
    const config = await getSiteAccessConfig();
    accessConfig.originalSiteAccess = config;
    const roles = Object.keys(config.admin.role);
    roles.forEach((role) => {
      const emails = config.admin.role[role];
      emails.forEach((email) => {
        const user = configUsers.find((u) => u.email === email);
        if (user) user.roles.push(role);
        else configUsers.push({ email, roles: [role] });
      });
    });
    accessConfig.users = configUsers;
    const sortedUsers = configUsers.sort((a, b) => a.email.localeCompare(b.email));
    sortedUsers.forEach((user) => {
      const li = createUserItem(user);
      users.append(li);
    });
  } else {
    accessConfig.type = 'org';
    const config = await getOrgConfig();
    const sortedUsers = config.users.sort((a, b) => a.email.localeCompare(b.email));
    sortedUsers.forEach((user) => {
      const li = createUserItem(user);
      users.append(li);
    });
    accessConfig.users = config.users;
  }
});

addUserButton.addEventListener('click', () => {
  displayAddUserDetails();
});

addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addUserSave.disabled = true;
  addUserSave.innerHTML += ' <i class="symbol symbol-loading"></i>';
  const checkboxes = addUserRoles.querySelectorAll('input[type="checkbox"]:checked');
  const user = {
    email: addUserEmail.value,
    roles: [...checkboxes].map((cb) => cb.value),
  };
  if (accessConfig.type === 'site') {
    await addUserToSite(user);
  } else {
    await addUserToOrg(user);
  }
  adminForm.dispatchEvent(new Event('submit'));
  addUserDetails.setAttribute('aria-hidden', 'true');
  addUserSave.innerHTML = addUserSave.innerHTML.replace(' <i class="symbol symbol-loading"></i>', '');
  addUserSave.disabled = false;
});

addUserCancel.addEventListener('click', () => {
  addUserDetails.setAttribute('aria-hidden', 'true');
});

addUserEmail.addEventListener('input', () => {
  addUserSave.disabled = !isValidNewUser(addUserEmail, addUserRoles);
});

addUserRoles.addEventListener('change', (e) => {
  if (e.target.type === 'checkbox') {
    addUserSave.disabled = !isValidNewUser(addUserEmail, addUserRoles);
  }
});

const params = new URLSearchParams(window.location.search);
const orgParam = params.get('org');
const siteParam = params.get('site');
if (orgParam) {
  org.value = orgParam;
}
if (siteParam) {
  site.value = siteParam;
}

if (org.value) {
  adminForm.dispatchEvent(new Event('submit'));
}
