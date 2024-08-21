import ImportService from './importservice.js';

const form = document.querySelector('.form');
const resultsContainer = document.querySelector('div#results');

const fields = Object.freeze({
  apiKey: document.querySelector('input#apiKey-input'),
  urls: document.querySelector('textarea#url-input'),
  importScript: document.querySelector('input#import-script'),
  startButton: document.querySelector('button#start-button'),
  scriptButton: document.querySelector('button#script-button'),
  clearButton: document.querySelector('a#clear-button'),
});

function clearResults(element) {
  element.textContent = '';
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
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function createJobTable(job) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  Object.entries(job).forEach(([key, value]) => {
    const tr = document.createElement('tr');
    let formattedValue = value;
    if (key === 'startTime' || key === 'endTime') {
      formattedValue = formatDate(value);
    } else if (key === 'duration') {
      formattedValue = formatDuration(value);
    } else if (key === 'options') {
      formattedValue = Object.entries(value)
        .filter(([, optionValue]) => optionValue)
        .map(([optionKey]) => optionKey)
        .join(', ');
    } else if (key === 'baseURL') {
      formattedValue = `<a href="${value}" target="_blank">${value}</a>`;
    } else if (key === 'downloadUrl') {
      formattedValue = `<a class="button accent" href="${value}" download>Download</a>`;
    }
    tr.innerHTML = `<td>${key}</td><td>${formattedValue}</td>`;
    tbody.append(tr);
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

function getImportScript(input) {
  return new Promise((resolve, reject) => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        resolve(base64Content);
      };
      reader.onerror = (e) => {
        reject(e);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('No file selected'));
    }
  });
}

(() => {
  const service = new ImportService({ poll: true });

  fields.apiKey.value = service.apiKey;
  service.init();

  service.addListener(({ job }) => {
    // Update job results
    clearResults(resultsContainer);
    // build new results
    resultsContainer.append(createJobTable(job));
    resultsContainer.closest('.job-details').classList.remove('hidden');
  });

  fields.apiKey.addEventListener('blur', () => {
    service.setApiKey(fields.apiKey.value);
    service.init();
  });

  fields.startButton.addEventListener('click', async () => {
    clearResults(resultsContainer);
    const msg = document.createElement('h5');
    msg.textContent = 'Starting job...';
    resultsContainer.append(msg);
    resultsContainer.closest('.job-details').classList.remove('hidden');

    const urlsArray = fields.urls.value.split('\n').reverse().filter((u) => u.trim() !== '');
    const options = buildOptions(form);
    const importScript = await getImportScript(fields.importScript);
    await service.startJob({ urls: urlsArray, options, importScript });
  });

  fields.clearButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default link behavior
    ImportService.clearHistory();
    clearResults(resultsContainer);
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
