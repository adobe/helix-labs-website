import ImportService from './importservice.js';

const form = document.querySelector('.form');
const resultsContainer = document.querySelector('div#results');
const jobList = document.querySelector('span.job-list');

const fields = Object.freeze({
  apiKey: document.querySelector('input#apiKey-input'),
  urls: document.querySelector('textarea#url-input'),
  headers: document.querySelector('textarea#headers-input'),
  importScript: document.querySelector('input#import-script'),
  timeout: document.querySelector('input#timeout-input'),
  startButton: document.querySelector('button#start-button'),
  scriptButton: document.querySelector('button#script-button'),
  clearButton: document.querySelector('a#clear-button'),
});

function clearResults() {
  resultsContainer.textContent = '';
}

function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDuration(durationMs) {
  if (!durationMs) {
    return 'N/A';
  }
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  if (days === 0 && hours === 0) {
    return `${minutes}m ${seconds}s`;
  }
  if (days === 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function createJobTable(job) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  // Ensure a 'duration' value exists for all jobs, including RUNNING.
  if (!job.duration) {
    job.duration = Date.now() - (new Date(job.startTime).getTime());
  }

  Object.entries(job)
    .filter(([key]) => key !== 'downloadUrl')
    .forEach(([key, value]) => {
      let formattedValue = value;
      if (key === 'id') {
        const deepLink = new URL(window.location);
        deepLink.searchParams.set('jobid', value);
        formattedValue = `<a href="${deepLink.toString()}">${value}</a>`;
      } else if (key === 'startTime' || key === 'endTime') {
        formattedValue = formatDate(value);
      } else if (key === 'duration') {
        formattedValue = formatDuration(value);
      } else if (key === 'status' && value === 'RUNNING') {
        formattedValue += '<div class="spinner"></div>';
      } else if (key === 'options') {
        formattedValue = Object.entries(value)
          .filter(([, optionValue]) => optionValue)
          .map(([optionKey]) => optionKey)
          .join(', ');
      } else if (key === 'baseURL') {
        formattedValue = `<a href="${value}" target="_blank">${value}</a>`;
      } else if (key === 'downloadUrl') {
        formattedValue = `<a class="button accent" href="${value}" download>Download</a>`;
      } else if (value === null) {
        formattedValue = 'An error occurred while retrieving status or starting job.';
      } else if (typeof value === 'object') {
        formattedValue = Object.values(value).map((v) => `<p>${v}</p>`).join('');
      }
      if (formattedValue) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${key}</td><td>${formattedValue}</td>`;
        tbody.append(tr);
      }
    });

  table.append(tbody);
  return table;
}

function buildOptions(element) {
  const checkboxes = element.querySelectorAll('input[type="checkbox"]');
  const values = {};

  checkboxes.forEach((checkbox) => {
    values[checkbox.name] = checkbox.checked;
  });

  return values;
}

function addJobsList(jobs) {
  if (jobs.length === 0) {
    return;
  }

  const dropdown = document.createElement('select');
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select a job';
  defaultOption.value = '';
  dropdown.appendChild(defaultOption);

  jobs.reverse().forEach((job) => {
    const option = document.createElement('option');
    option.textContent = formatDate(job.endTime || job.startTime);
    option.value = job.id;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener('change', (event) => {
    const selectedJobId = event.target.value;
    if (selectedJobId) {
      const url = new URL(window.location);
      url.searchParams.set('jobid', selectedJobId);
      window.location.href = url.toString();
    }
  });

  jobList.appendChild(dropdown);
}

(() => {
  const service = new ImportService({ poll: true });

  const urlParams = new URLSearchParams(window.location.search);
  const searchJob = { id: urlParams.get('jobid') };

  let envOverride = urlParams.get('env');
  if (envOverride && envOverride !== 'PROD') {
    service.setEnvironment(envOverride);
  } else {
    envOverride = undefined;
  }
  service.setJob(searchJob);
  fields.apiKey.value = service.apiKey;
  service.init();

  addJobsList(ImportService.getJobs());

  service.addListener(({ job }) => {
    // Update job results
    clearResults();
    // build new results
    resultsContainer.append(createJobTable({ ...job, env: envOverride }));
    if (job.downloadUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.className = 'button accent';
      downloadLink.href = job.downloadUrl;
      downloadLink.textContent = 'Download';
      downloadLink.download = 'import_results.zip';
      resultsContainer.append(downloadLink);
    }
    resultsContainer.closest('.job-details').classList.remove('hidden');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    return false;
  });

  fields.apiKey.addEventListener('blur', () => {
    service.setApiKey(fields.apiKey.value);
    service.init();
  });

  fields.headers.addEventListener('keyup', () => {
    fields.headers.classList.remove('invalid');
  });

  fields.startButton.addEventListener('click', async () => {
    clearResults();
    const msg = document.createElement('h5');
    msg.textContent = 'Starting job...';
    resultsContainer.append(msg);
    resultsContainer.closest('.job-details').classList.remove('hidden');

    const urlsArray = fields.urls.value.split('\n').reverse().filter((u) => u.trim() !== '');
    let customHeaders = '';
    if (fields.headers.value.trim() !== '') {
      try {
        // Validate that headers are in valid JSON format.
        JSON.parse(fields.headers.value.trim());
        customHeaders = fields.headers.value.trim();
      } catch (e) {
        /* eslint-disable no-console */
        console.warn('Invalid headers JSON', e);
        fields.headers.classList.add('invalid');
        return;
      }
    }
    const options = {
      ...buildOptions(form),
      pageLoadTimeout: parseInt(fields.timeout.value || '100', 10),
    };
    const importScript = fields.importScript.files[0] ?? undefined;
    const newJob = await service.startJob({
      urls: urlsArray, options, customHeaders, importScript,
    });

    // If job was created successfully, set the environment with its info.
    if (newJob.id) {
      const url = new URL(window.location);
      url.searchParams.set('jobid', newJob.id);
      window.history.pushState({}, '', url);
      resultsContainer.closest('.job-details')
        .scrollIntoView({ behavior: 'smooth' });
    }
  });

  fields.clearButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default link behavior
    ImportService.clearHistory();
    clearResults();
    jobList.textContent = '';
  });

  fields.scriptButton.addEventListener('click', () => {
    fields.importScript.click();
  });

  fields.importScript.addEventListener('change', (event) => {
    const scriptName = fields.importScript.parentElement?.querySelector(':scope > input ~ span');
    const file = event.target.files[0];
    // Convert bytes to KB and round to 2 decimal places
    const fileSizeInKB = (file.size / 1024).toFixed(2);
    if (scriptName) {
      scriptName.textContent = `${file.name} (${fileSizeInKB} KB)`;
    }
  });
})();
