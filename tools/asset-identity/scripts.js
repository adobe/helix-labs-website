import { getImageFingerprint } from '../../utils/identity.js';

function disableForm() {
  const viewbox = document.querySelector('.viewbox');
  if (viewbox) {
    viewbox.classList.remove('hover');
    viewbox.dataset.status = 'preview';
  }
  const label = document.querySelector('label[for="upload"]');
  if (label) {
    label.setAttribute('aria-hidden', true);
  }
  const upload = document.querySelector('input[name="upload"]');
  if (upload) {
    upload.disabled = true;
  }
}

async function initUpload() {
  // get input element with name "upload"
  const upload = document.querySelector('input[name="upload"]');
  const viewbox = document.querySelector('.viewbox');
  upload.addEventListener('change', () => {
    const file = upload.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', async (e) => {
        // show image
        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('preview');
        imgWrapper.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
        viewbox.appendChild(imgWrapper);
        disableForm();

        const img = imgWrapper.querySelector('img');
        try {
          const fingerprint = await getImageFingerprint(img, file.name);
          console.debug('Fingerprint:', fingerprint);
        } catch (error) {
          console.error('Error getting fingerprint:', error);
        }
      });
      reader.readAsDataURL(file);
    }
  });
}

async function init() {
  initUpload();

  // await initIdentity();
  // load test image for debugging
  // const fingerprint = await getImageFingerprint('/tools/asset-identity/samples/earth.png');
  // console.debug('Fingerprint:', fingerprint);
}

init();
