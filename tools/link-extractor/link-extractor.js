const urlInput = document.getElementById('url');
const extractLinksButton = document.getElementById('extract-links');
const linksContainer = document.getElementById('links');
const hideHeaderAndFooter = document.getElementById('hide-header-and-footer');

hideHeaderAndFooter.addEventListener('change', () => {
  document.body.classList.toggle('hide-header-and-footer', hideHeaderAndFooter.checked);
});

async function corsFetch(url, status = false) {
  const statusParam = status ? 'status=reveal&' : '';
  const resp = await fetch(`https://little-forest-58aa.david8603.workers.dev/?${statusParam}url=${encodeURIComponent(url)}`);
  return resp;
}

function wrapIntoLink(href, baseUrl) {
  const linkElement = document.createElement('a');
  linkElement.href = new URL(href, baseUrl).href;
  linkElement.textContent = linkElement.href;
  return linkElement;
}

async function fillRedirectTarget(link, elem) {
  const resp = await corsFetch(link, true);
  // eslint-disable-next-line no-await-in-loop
  const data = await resp.json();
  if (data.location) elem.appendChild(wrapIntoLink(data.location, link));
  elem.classList.remove('pending');
}

async function displayLinks(text, url) {
  const dom = new DOMParser().parseFromString(text, 'text/html');
  const links = dom.querySelectorAll('a');
  linksContainer.innerHTML = '';
  const linksToDisplay = [...links];
  for (let i = 0; i < linksToDisplay.length; i += 1) {
    const link = linksToDisplay[i];
    const tr = document.createElement('tr');

    const tdPath = document.createElement('td');
    const path = [];
    let elem = link;
    while (elem.parentElement) {
      path.unshift(elem.parentElement.tagName.toLowerCase());
      elem = elem.parentElement;
    }
    const hideTags = ['body', 'html', 'div'];
    tdPath.textContent = path.filter((p) => !hideTags.includes(p)).join(' > ');
    tr.appendChild(tdPath);

    if (path.includes('header')) {
      tr.classList.add('header');
    }
    if (path.includes('footer')) {
      tr.classList.add('footer');
    }

    const tdText = document.createElement('td');
    tdText.textContent = link.textContent;
    tr.appendChild(tdText);

    const td = document.createElement('td');
    const linkElement = wrapIntoLink(link.getAttribute('href'), url);
    td.appendChild(linkElement);
    tr.appendChild(td);
    const td2 = document.createElement('td');
    // eslint-disable-next-line no-await-in-loop
    fillRedirectTarget(linkElement.href, td2);
    td2.classList.add('pending');
    tr.appendChild(td2);
    linksContainer.appendChild(tr);
  }
}

extractLinksButton.addEventListener('click', async () => {
  const url = urlInput.value;
  const resp = await corsFetch(url);
  const data = await resp.text();
  console.log(data);
  displayLinks(data, url);
});
