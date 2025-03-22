window.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `<div class="container">
        <div class="login-card">
            <div class="avatar">
              <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_1424_5970" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="24" y="24" width="112" height="112">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M114.843 123.843C105.28 131.453 93.1709 136 80 136C66.8809 136 54.8155 131.489 45.2704 123.933C45.5744 123.615 45.8307 123.241 46.0223 122.817C51.8962 109.835 64.9956 100.748 80.0004 100.748C94.8783 100.748 107.885 109.692 113.831 122.5C114.077 123.032 114.426 123.484 114.843 123.843ZM120.747 118.415C113.408 103.306 97.8643 92.748 80.0004 92.748C62.1368 92.748 46.5914 103.296 39.2521 118.414C29.796 108.387 24 94.8703 24 80C24 49.0721 49.0721 24 80 24C110.928 24 136 49.0721 136 80C136 94.871 130.203 108.388 120.747 118.415ZM63.4873 62.8361C63.4873 52.7333 71.1151 44.9824 79.9997 44.9824C88.8843 44.9824 96.512 52.7333 96.512 62.8361C96.512 72.9389 88.8843 80.6898 79.9997 80.6898C71.1151 80.6898 63.4873 72.9389 63.4873 62.8361ZM79.9997 36.9824C66.227 36.9824 55.4873 48.8 55.4873 62.8361C55.4873 76.8723 66.227 88.6898 79.9997 88.6898C93.7724 88.6898 104.512 76.8723 104.512 62.8361C104.512 48.8 93.7724 36.9824 79.9997 36.9824Z" fill="#DBDBDB"></path>
                </mask>
                <g mask="url(#mask0_1424_5970)">
                  <g clip-path="url(#clip0_1424_5970)">
                    <rect width="160" height="160" rx="10" fill="#B7E7FC"></rect>
                    <path d="M14.2737 -2.86353C33.6374 -2.86353 51.498 4.65307 64.7143 16.7793C91.1486 41.0733 112.206 41.0941 136.571 16.8416C148.75 4.65308 165.991 -2.88429 185.376 -2.88428C224.126 -2.86352 256.796 27.1614 258.376 64.2253C259.957 101.289 229.846 131.293 191.097 131.293C171.668 131.293 153.784 123.735 140.565 111.547C114.156 87.3358 93.122 87.3565 68.7594 111.651C56.5781 123.798 39.3575 131.293 19.9939 131.293C-18.7334 131.293 -51.4035 101.268 -52.9829 64.2253C-54.5623 27.1821 -24.4535 -2.86354 14.2737 -2.86353Z" fill="url(#paint0_linear_1424_5970)"></path>
                    <circle cx="68.75" cy="68.75" r="68.75" transform="matrix(1 0 0.000165089 1 49.9973 -28.1548)" fill="url(#paint1_radial_1424_5970)"></circle>
                    <circle cx="60" cy="60" r="60" transform="matrix(1 0 0.000165089 1 -38.9968 -3.58496)" fill="url(#paint2_radial_1424_5970)"></circle>
                    <path d="M158.999 46.2254C145.765 38.5055 128.997 38.4582 115.713 46.1034L-17.1452 122.572C-30.157 130.062 -30.1788 147.739 -17.1847 155.257L114.796 231.618C128.06 239.29 144.827 239.281 158.08 231.59L289.788 155.158C302.714 147.657 302.737 130.078 289.828 122.548L158.999 46.2254Z" fill="url(#paint3_linear_1424_5970)"></path>
                    <circle cx="72.5" cy="72.5" r="72.5" transform="matrix(1 0 0.000165089 1 -33.5001 63.4023)" fill="url(#paint4_radial_1424_5970)"></circle>
                  </g>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_1424_5970" x1="-55.8443" y1="58.2691" x2="145.674" y2="9.45066" gradientUnits="userSpaceOnUse">
                    <stop offset="0.4" stop-color="#EB1000"></stop>
                    <stop offset="1" stop-color="#EB1000" stop-opacity="0"></stop>
                  </linearGradient>
                  <radialGradient id="paint1_radial_1424_5970" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(68.75 68.75) rotate(90) scale(68.75)">
                    <stop offset="0.166667" stop-color="#B7E7FC"></stop>
                    <stop offset="1" stop-color="#B7E7FC" stop-opacity="0"></stop>
                  </radialGradient>
                  <radialGradient id="paint2_radial_1424_5970" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(60)">
                    <stop offset="0.166667" stop-color="#EB1000"></stop>
                    <stop offset="1" stop-color="#EB1000" stop-opacity="0"></stop>
                  </radialGradient>
                  <linearGradient id="paint3_linear_1424_5970" x1="114.5" y1="149.402" x2="57.9869" y2="63.3668" gradientUnits="userSpaceOnUse">
                    <stop offset="0.0598452" stop-color="#7155FA"></stop>
                    <stop offset="0.982131" stop-color="#7155FA" stop-opacity="0"></stop>
                  </linearGradient>
                  <radialGradient id="paint4_radial_1424_5970" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(72.5 72.5) rotate(90) scale(72.5)">
                    <stop offset="0.166667" stop-color="#FF67CC"></stop>
                    <stop offset="1" stop-color="#FF67CC" stop-opacity="0"></stop>
                  </radialGradient>
                  <clipPath id="clip0_1424_5970">
                    <rect width="160" height="160" rx="10" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h1>This site is protected</h1>
            <p>Please enter password to continue.</p>
            <p>
                <form>
                    <input id="review-password" type="password">
                    <button class="sign-in-button" type="submit">Sign in</button>
                </form>
             </p>
        </div>
    </div>`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = window.location.pathname !== '/tools/snapshot-admin/401-test.html' ? 'https://labs.aem.live/tools/snapshot-admin/401-styles.css' : '/tools/snapshot-admin/401-styles.css';
  document.head.append(link);
  const sha256 = async (message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hash;
  };

  document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('review-password').value;
    if (pw.length < 50) {
      const hash = await sha256(pw);
      document.cookie = `reviewPassword=${hash}`;
    }
    window.location.reload();
  });
});
