window.addEventListener('DOMContentLoaded', () => {
  document.body.innerHTML = `<div class="container">
        <div class="login-card">
            <div class="avatar">
                <svg viewBox="0 0 100 100" width="80" height="80">
                    <circle cx="50" cy="35" r="25" fill="url(#gradient)" />
                    <path d="M50 65 Q50 95 100 95 L0 95 Q50 95 50 65" fill="url(#gradient)" />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#FF6B6B" />
                            <stop offset="100%" style="stop-color:#9B6BFF" />
                        </linearGradient>
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
  link.href = 'https://labs.aem.live/tools/snapshot-admin/401-styles.css';
  document.head.append(link);
  const sha256 = async (message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
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
