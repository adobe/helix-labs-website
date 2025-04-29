import { messageSidekick } from '../../utils/config/config.js';

/* eslint-disable no-alert */
const projectsElem = document.querySelector('div#sites');

async function saveProject() {
  // todo
  // logResponse([resp.status, 'POST', adminURL, resp.headers.get('x-error') || '']);
  // // eslint-disable-next-line no-use-before-define
  // displaySitesForOrg(org.value);
}

async function removeProject() {
  // todo
  // logResponse([resp.status, 'DELETE', adminURL, resp.headers.get('x-error') || '']);
  // // eslint-disable-next-line no-use-before-define
  // displaySitesForOrg(org.value);
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
          <button id="${name}-remove" class="button outline">Remove ...</button>
          <button id="${name}-cancel" class="button outline">Cancel</button>
        </p>
      </fieldset>
    </form>`;
  const fs = elem.querySelector('fieldset');
  const save = elem.querySelector(`#${name}-save`);
  save.addEventListener('click', (e) => {
    fs.disabled = 'disabled';
    save.innerHTML += ' <i class="symbol symbol-loading"></i>';
    e.preventDefault();
    saveProject({
      project: elem.querySelector(`input[id="${name}-project"]`).value,
    });
  });
  const remove = elem.querySelector(`#${name}-remove`);
  remove.addEventListener('click', (e) => {
    e.preventDefault();
    fs.disabled = 'disabled';
    remove.innerHTML += ' <i class="symbol symbol-loading"></i>';
    removeProject({ org, site });
  });
  const cancel = elem.querySelector(`#${name}-cancel`);
  cancel.addEventListener('click', (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-use-before-define
    elem.replaceWith(drawProject(config));
  });
}

function drawProject(config, editMode = false) {
  const { org, site, project } = config;
  const name = project || `${org}/${site}`;
  const li = document.createElement('li');
  li.innerHTML = `<div class="sites-site-name">${name} <a target="_blank" href="https://main--${site}--${org}.aem.page/"><span class="site-admin-oinw"></span></a></div>`;
  const buttons = document.createElement('div');
  buttons.className = 'sites-site-edit';
  const edit = document.createElement('button');
  edit.className = 'button';
  edit.textContent = 'Edit';
  edit.ariaHidden = editMode;
  buttons.append(edit);
  const cancel = document.createElement('button');
  cancel.className = 'button outline';
  cancel.textContent = 'Cancel';
  cancel.ariaHidden = !editMode;
  buttons.append(cancel);
  li.append(buttons);
  const details = document.createElement('div');
  details.className = 'sites-site-details';
  details.ariaHidden = !editMode;

  li.append(details);

  edit.addEventListener('click', async () => {
    displayProjectForm(li, config);
    cancel.ariaHidden = false;
    edit.ariaHidden = true;
    details.ariaHidden = false;
    // logResponse([resp.status, 'GET', adminURL, resp.headers.get('x-error') || '']);
  });

  cancel.addEventListener('click', async () => {
    cancel.ariaHidden = true;
    edit.ariaHidden = false;
    details.innerText = '';
    details.ariaHidden = true;
  });

  return li;
}

function displayProjects(projects) {
  projectsElem.ariaHidden = false;
  projectsElem.textContent = '';
  const div = document.createElement('div');
  div.classList.add('sites-list-button-bar');
  // const addNew = document.createElement('button');
  // addNew.className = 'button';
  // addNew.textContent = 'Add new project ...';
  // addNew.addEventListener('click', () => {
  //   // eslint-disable-next-line no-use-before-define
  //   addProject();
  // });
  // div.append(addNew);
  projectsElem.append(div);
  const div2 = document.createElement('div');
  const sitesList = document.createElement('ol');
  sitesList.id = 'sites-list';
  projects.forEach((project) => {
    sitesList.append(drawProject(project));
  });
  div2.append(sitesList);
  projectsElem.append(div2);
}

async function init() {
  const projects = await messageSidekick('getSites') || [];
  displayProjects(projects);
}

init();
