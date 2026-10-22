(() => {
  'use strict';
  const API = 'https://fb-ad-manager-api.onrender.com';
  const nonce = new URLSearchParams(location.search).get('nonce') || '';
  const out = document.querySelector('.wrap');
  const allowed = origin => {
    try { const u = new URL(origin); return u.protocol === 'https:' && /(^|\.)(facebook\.com|threads\.net|threads\.com|instagram\.com)$/.test(u.hostname); } catch { return false; }
  };
  if (!window.opener || !nonce) { out.textContent = '請由社群面板開啟驗證頁。'; return; }
  let done = false;
  window.opener.postMessage({ type: 'FB_AD_ALPHA_VERIFY_READY', nonce }, '*');
  window.addEventListener('message', async e => {
    if (done || e.source !== window.opener || !allowed(e.origin) || e.data?.nonce !== nonce || e.data.type !== 'FB_AD_ALPHA_VERIFY_CODE') return;
    done = true;
    const reply = data => window.opener.postMessage({ type: 'FB_AD_ALPHA_VERIFY_RESULT', nonce, ...data }, e.origin);
    if (e.data.product !== 'SOCIAL_PANEL') { reply({ ok: false, reason: 'INVALID_PRODUCT' }); return; }
    const code = String(e.data.code || '').trim();
    if (!code) { reply({ ok: false, reason: 'CODE_REQUIRED' }); return; }
    try {
      // Shared Pages origin gives Facebook, Threads and IG one social device identity.
      let deviceId = localStorage.getItem('33works:SOCIAL_PANEL:deviceId');
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem('33works:SOCIAL_PANEL:deviceId', deviceId); }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      let r;
      try {
        r = await fetch(API + '/api/verify', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, product: 'SOCIAL_PANEL', deviceId, deviceName: '33 Works 社群瀏覽器', clientVersion: '2.0-alpha-handoff' }) });
      } finally { clearTimeout(timer); }
      const data = await r.json();
      const ok = r.ok && data.ok === true && !!data.user;
      reply({ ok, reason: data.reason || (ok ? null : 'INVALID_RESPONSE'), user: ok ? data.user : null });
      out.textContent = ok ? '驗證成功，正在回到面板…' : '授權未通過，請核對產品、裝置與期限。';
      setTimeout(() => window.close(), 700);
    } catch { reply({ ok: false, reason: 'NETWORK_OR_STORAGE_ERROR' }); out.textContent = '無法完成驗證，請確認網路及瀏覽器儲存權限。'; }
  });
})();
