import ImportService from './importservice.js';

const form = document.querySelector('.form');
const apiKeyInput = document.querySelector('input#apiKey-input');
const urlInput = document.querySelector('textarea#url-input');
const startButton = document.querySelector('button#start-button');
const clearButton = document.querySelector('a#clear-button');
const resultsContainer = document.querySelector('div#results');

function clearResults(element)  {
  const heading = element.querySelector('.heading');

  let sibling = heading.nextElementSibling;
  while (sibling) {
    const nextSibling = sibling.nextElementSibling;
    sibling.remove();
    sibling = nextSibling;
  }
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDuration(durationMs) {
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function createJobList(job) {
  const ul = document.createElement('ul');

  Object.entries(job).forEach(([key, value]) => {
    const li = document.createElement('li');
    if (key === 'startTime' || key === 'endTime') {
      value = formatDate(value);
    } else if (key === 'duration') {
      value = formatDuration(value);
    } else if (key === 'options') {
      value = Object.keys(value).join(', ');
    } else if (key === 'baseURL' || key === 'downloadUrl') {
      value = `<a href="${value}" target="_blank">${value}</a>`;
    }
    li.innerHTML = `<span>${key}</span><span>${value}</span>`;
    ul.appendChild(li);
  });

  return ul;
}

function buildOptions(element) {
  const checkboxes = element.querySelectorAll('input[type="checkbox"]');
  const values = {};

  checkboxes.forEach((checkbox) => {
    values[checkbox.name] = checkbox.checked;
  });

  return values;
}

(() => {
  const service = new ImportService({ poll: true});

  apiKeyInput.value = service.apiKey;
  service.init()

  service.addListener(({job}) => {
    // Update job results
    clearResults(resultsContainer);
    // build new results
    resultsContainer.append(createJobList(job));
    resultsContainer.classList.remove('hidden');
  })

  apiKeyInput.addEventListener('blur', () => {
    service.setApiKey(apiKeyInput.value);
    service.init();
  });

  startButton.addEventListener('click', async () => {
    const urlsArray = urlInput.value.split('\n').reverse().filter((u) => u.trim() !== '');
    const options = buildOptions(form);
    await service.startJob(urlsArray, options);
  });

  clearButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the default link behavior
    service.clearHistory();
    clearResults(resultsContainer);
  });

})();
