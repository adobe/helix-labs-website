import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';

const createResults = async (block) => {
  const section = block.closest('.section');
  if (section.querySelector('.results-wrapper')) {
    section.querySelector('.results-wrapper').remove();
  }

  const v = block.querySelector('.analyze-box').value;
  const a = document.createElement('a');
  a.textContent = v;
  a.href = v;
  const results = buildBlock('results', a);
  results.dataset.forceUpdate = block.querySelector('.force-update').value === 'on';
  const wrapper = document.createElement('div');
  wrapper.style.display = 'none';
  wrapper.append(results);
  section.append(wrapper);
  decorateBlock(results);
  await loadBlock(results);
  wrapper.style.display = null;
};

/**
 * decorate the block
 * @param {Element} block the block element
 */
export default function decorate(block) {
  block.innerHTML = `
    <form id="analyze-url-form">
      <div class="field-wrapper analyze-box-wrapper">
          <label for="analyze-box">URL</label>
          <input id="analyze-box" class="analyze-box" type="url" required placeholder="Enter site root URL"></input>
        <div class="input-error">
          <p>Please enter a valid URL</p>
        </div>
      </div>
      <div class="field-wrapper submit-wrapper">
        <button type="submit">Analyze</button>
      </div>
      <div class="field-wrapper force-wrapper">
        <label for="force-cbox">Force Update?</label>
        <input id="force-cbox" class="force-update" type="checkbox" ></input>
      </div>
      <div></div>
      <div class="sitemap-cbox-wrapper">
      <label for="sitemap-cbox">Custom Sitemap URL?</label>
      <input id="sitemap-cbox" class="custim-sitemap" type="checkbox" ></input>
    </div>
    <div></div>
    <div class="field-wrapper  sitemap-box-wrapper">
      <input id="sitemap-box" class="sitemap-box" type="url" placeholder="enter sitemap url if not mentioned in robots.txt"></input>
    </div> 
    </form>
  `;
  const form = block.querySelector('form');
  const analyzeBox = form.querySelector('#analyze-box');
  const sitemapCBox = form.querySelector('#sitemap-cbox');
  const sitemapBox = form.querySelector('#sitemap-box');
  const sitemapBoxWrapper = form.querySelector('.sitemap-box-wrapper');
  // check query parameters for powerScoreUrl
  const urlParams = new URLSearchParams(window.location.search);
  const powerScoreUrl = urlParams.get('powerScoreUrl');
  const sitemapUrl = urlParams.get('sitemapUrl');

  if (powerScoreUrl) {
    analyzeBox.value = powerScoreUrl;
  } else {
    const lastUrl = sessionStorage.getItem('powerScoreUrl');
    if (lastUrl) {
      analyzeBox.value = lastUrl;
    }
  }

  if (sitemapUrl) {
    sitemapCBox.checked = true;
    sitemapBox.value = sitemapUrl;
    sitemapBoxWrapper.classList.add('visible');
    sessionStorage.setItem('sitemapUrl', sitemapUrl);
  } else {
    const lastSitemapUrl = sessionStorage.getItem('sitemapUrl');
    if (lastSitemapUrl) {
      sitemapBox.value = lastSitemapUrl;
      sitemapCBox.checked = true;
      sitemapBoxWrapper.classList.add('visible');
    }
  }

  sitemapCBox.addEventListener('change', () => {
    sitemapBoxWrapper.classList.toggle('visible');
  });

  const boxBlur = () => {
    if (
      analyzeBox.value
      && !(
        analyzeBox.value.startsWith('http://')
        || analyzeBox.value.startsWith('https://')
      )
    ) {
      analyzeBox.value = `https://${analyzeBox.value}`;
    }
    analyzeBox.classList.add('visited');
  };
  analyzeBox.addEventListener('blur', boxBlur);
  analyzeBox.addEventListener('keyup', (e) => {
    if (e.code === 'Enter') {
      boxBlur();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.checkValidity()) {
      if (sitemapCBox.checked) {
        sessionStorage.setItem('sitemapUrl', sitemapBox.value);
      } else {
        sessionStorage.removeItem('sitemapUrl');
      }
      createResults(block);
    }
  });
  block.scrollIntoView();

  // start if query parameter
  if (powerScoreUrl) {
    setTimeout(async () => {
      if (form.checkValidity()) {
        createResults(block);
      }
    }, 500);
  }
}
