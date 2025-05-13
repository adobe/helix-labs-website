import { messageSidekick, NO_SIDEKICK } from '../../utils/sidekick.js';

/* eslint-disable no-alert */
const projectsElem = document.querySelector('div#projects');

function externalLink(url, text, iconOnly = false) {
  return `<a target="_blank" href="${url}" title="${text || ''}">
    ${iconOnly ? '<span class="project-admin-oinw"></span>' : text}</a>`;
}

function collapseDropdowns(e) {
  const { target } = e;
  const { nextElementSibling: next } = target;
  const hasMenu = next && next.tagName.toLowerCase() === 'ul' && next.classList.contains('menu');

  if (target.closest('ul') || hasMenu) {
    // ignore click on picker icon or inside dropdown
    return;
  }
  const dropdowns = document.querySelectorAll('ul.menu');
  dropdowns.forEach((dropdown) => {
    if (!dropdown.hidden) {
      dropdown.hidden = true;
      const button = dropdown.previousElementSibling;
      button.setAttribute('aria-expanded', false);
    }
  });
  document.removeEventListener('click', collapseDropdowns);
}

function displayProjectForm(elem, config) {
  const { org, site, project } = config;
  const name = `${org}--${site}`;
  elem.innerHTML = `<form id=${name}>
      <fieldset>
        <div class="form-field url-field">
          <label for="${name}-project">Project name</label>
          <input value="${project || ''}" name="project" id="${name}-project" type="text"/>
          <div class="field-help-text">
            <p>
              The optional name for this project.
            </p>
          </div>
        </div>
        <p class="button-wrapper">
          <button id="${name}-save" class="button">Save</button>
          <button id="${name}-remove" class="button outline">Remove</button>
          <button id="${name}-cancel" class="button outline">Cancel</button>
        </p>
      </fieldset>
    </form>`;

  const fs = elem.querySelector('fieldset');
  const save = elem.querySelector(`#${name}-save`);
  save.addEventListener('click', async (e) => {
    fs.disabled = 'disabled';
    save.innerHTML += ' <i class="symbol symbol-loading"></i>';
    e.preventDefault();
    const success = await messageSidekick({
      action: 'updateSite',
      config: {
        org,
        site,
        project: elem.querySelector(`input[id="${name}-project"]`).value,
      },
    });
    if (success) {
      // eslint-disable-next-line no-use-before-define
      init();
    } else {
      // todo: error handling
    }
  });

  const remove = elem.querySelector(`#${name}-remove`);
  remove.addEventListener('click', async (e) => {
    e.preventDefault();
    fs.disabled = 'disabled';
    remove.innerHTML += ' <i class="symbol symbol-loading"></i>';
    const success = await messageSidekick({
      action: 'removeSite',
      config,
    });
    if (success) {
      // eslint-disable-next-line no-use-before-define
      init();
    } else {
      // todo: error handling
    }
  });

  const cancel = elem.querySelector(`#${name}-cancel`);
  cancel.addEventListener('click', (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-use-before-define
    elem.replaceWith(displayProject(config));
  });

  // focus and select first text field
  const input = elem.querySelector('input[type="text"]');
  input.focus();
  input.select();

  // cancel edit on escape
  const escHandler = ({ key }) => {
    if (key === 'Escape') {
      cancel.click();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function displayProject(config, editMode = false) {
  const {
    org, site, project, mountpoints, previewHost, host,
  } = config;
  const name = project || site;
  const previewUrl = `https://${previewHost || `main--${site}--${org}.aem.page`}/`;

  const li = document.createElement('li');
  li.innerHTML = `<div class="projects-project-title">
      <h4>${name} ${externalLink(previewUrl, 'Preview', true)}</h4>
      <button class="button outline" aria-hidden="${editMode}" title="Edit">Edit</button>
    </div>
    <div class="projects-project-details" aria-hidden="${editMode}">
      ${Array.isArray(mountpoints) && mountpoints.length >= 1 ? `<div>
        <div>Content:</div><div>${externalLink(mountpoints[0], new URL(mountpoints[0]).host)}</div>
      </div>` : ''}
      <div>
        <div>Preview:</div><div>${externalLink(previewUrl, new URL(previewUrl).host)}</div>
      </div>
      ${host ? `<div><div>Production: </div><div>${externalLink(host, host)}</div></div>` : ''}
    </div>`;

  const details = li.querySelector('.projects-project-details');
  const edit = li.querySelector('.projects-project-title > button');

  edit.addEventListener('click', async () => {
    displayProjectForm(li, config);
    edit.ariaHidden = true;
    details.ariaHidden = false;
  });

  return li;
}

function displayProjects(projects, authInfo) {
  let message;
  if (projects === NO_SIDEKICK) {
    message = `No sidekick found. Make sure the ${externalLink('https://chromewebstore.google.com/detail/aem-sidekick/igkmdomcgoebiipaifhmpfjhbjccggml?authuser=0&hl=en', 'AEM Sidekick')} extension is installed and enabled.`;
  } else if (!projects || projects.length === 0) {
    message = `No projects found. See the ${externalLink('https://www.aem.live/docs/sidekick#adding-your-project', 'sidekick documentation')} to find out how to add projects to your sidekick.`;
  } else {
    message = 'Manage the projects in your sidekick.';
  }
  projectsElem.ariaHidden = false;
  projectsElem.innerHTML = `<div class="default-content-wrapper"><p>${message}</p></div>`;

  if (projects === NO_SIDEKICK) {
    return;
  }

  const buttonBar = document.createElement('div');
  buttonBar.classList.add('projects-list-button-bar');
  // const addNew = document.createElement('button');
  // addNew.className = 'button';
  // addNew.textContent = 'Add new project ...';
  // addNew.addEventListener('click', () => {
  //   // todo: add new project
  // });
  // div.append(addNew);
  projectsElem.append(buttonBar);

  // sort projects by org
  const projectsByOrg = {};
  projects.forEach((project) => {
    const { org } = project;
    if (!projectsByOrg[org]) {
      projectsByOrg[org] = [];
    }
    projectsByOrg[org].push(project);
  });

  const sortedOrgs = Object.keys(projectsByOrg).sort((a, b) => a.localeCompare(b));
  sortedOrgs.forEach((org) => {
    const orgContainer = document.createElement('div');
    orgContainer.classList.add('projects-org');

    const titleBar = document.createElement('div');
    titleBar.classList.add('projects-title-bar');
    titleBar.innerHTML = `<h3>${org}</h3>`;

    // login options
    const loginOptions = document.createElement('div');
    loginOptions.classList.add('form-field', 'picker-field');
    loginOptions.innerHTML = `
      <input type="button" class="button outline" id="login-button-${org}" title="Sign in"
        value="${authInfo.includes(org) ? 'Signed in' : 'Sign in'}"
        ${authInfo.includes(org) ? 'disabled' : ''}>
      <i id="login-button-icon-${org}" class="symbol symbol-chevron" title="Sign in options"
        ${authInfo.includes(org) ? 'aria-hidden="true"' : ''}></i>
      <ul class="menu" id="login-options-${org}" role="listbox" aria-labelledby="login-button-${org}" hidden>
        <li role="option" aria-selected="false" data-value="default">Default IDP</li>
        <li role="option" aria-selected="false" data-value="microsoft">Microsoft</li>
        <li role="option" aria-selected="false" data-value="google">Google</li>
        <li role="option" aria-selected="false" data-value="adobe">Adobe</li>
      </ul>
    `;

    titleBar.append(loginOptions);
    orgContainer.append(titleBar);

    // enable login dropdown
    const loginPicker = orgContainer.querySelector(`input#login-button-${org}`);
    const loginPickerIcon = orgContainer.querySelector(`i#login-button-icon-${org}`);
    const loginDropdown = orgContainer.querySelector(`ul#login-options-${org}`);
    const loginIdps = loginDropdown.querySelectorAll('[role="option"]');
    loginPicker.addEventListener('click', () => {
      loginDropdown.querySelector('li').click();
    });
    loginPickerIcon?.addEventListener('click', (e) => {
      const { target } = e;
      const expanded = target.getAttribute('aria-expanded') === 'true';
      target.setAttribute('aria-expanded', !expanded);
      loginDropdown.hidden = expanded;
      setTimeout(() => document.addEventListener('click', collapseDropdowns), 200);
    });
    // trigger login on dropdown click
    loginDropdown.addEventListener('click', async (e) => {
      const option = e.target.closest('[role="option"]');
      if (option) {
        loginPicker.setAttribute('aria-expanded', false);
        loginDropdown.hidden = true;
        loginIdps.forEach((o) => o.setAttribute('aria-selected', o === option));
        const { value: idp } = option.dataset;
        loginPickerIcon.classList.replace('symbol-chevron', 'symbol-loading');
        const defaultIdp = idp === 'default';
        await messageSidekick({
          action: 'login',
          org,
          site: projectsByOrg[org][0].site, // use first site in org
          idp: defaultIdp ? null : idp,
          // selectAccount,
        });
        setTimeout(() => {
          // eslint-disable-next-line no-use-before-define
          init();
        }, 1000);
      }
    });

    // list sites for org
    const sitesList = document.createElement('ol');
    sitesList.classList.add('projects-list');
    sitesList.id = `projects-list-${org}`;
    projectsByOrg[org]
      .sort((a, b) => a.site.localeCompare(b.site))
      .forEach((project) => {
        sitesList.append(displayProject(project));
      });

    orgContainer.append(sitesList);
    projectsElem.append(orgContainer);
  });
}

async function init() {
  const authInfo = await messageSidekick({ action: 'getAuthInfo' }) || [];
  const projects = await messageSidekick({ action: 'getSites' }) || [];
  displayProjects(projects, authInfo);

  // recheck authInfo every 10s and update login buttons
  setInterval(async () => {
    const updatedAuthInfo = await messageSidekick({ action: 'getAuthInfo' }) || [];
    document.querySelectorAll('input[id^="login-button-"]').forEach((loginPicker) => {
      const org = loginPicker.id.replace('login-button-', '');
      if (updatedAuthInfo.includes(org)) {
        loginPicker.value = 'Signed in';
        loginPicker.disabled = true;
        loginPicker.nextElementSibling.ariaHidden = true;
      } else {
        loginPicker.value = 'Sign in';
        loginPicker.disabled = false;
        loginPicker.nextElementSibling.ariaHidden = false;
      }
    });
  }, 10000);
}

init();
