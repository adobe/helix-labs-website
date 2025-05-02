export default function login(org, site) {
  window.chrome.runtime.sendMessage(
    'dfeojcdljkdfebmdcmilekahpcjkafdp',
    { action: 'login', org, site },
  );
}
