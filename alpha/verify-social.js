(() => {
  'use strict';
  const API = 'https://fb-ad-manager-api.onrender.com';
  const nonce = new URLSearchParams(location.search).get('nonce') || '';
  const out = document.querySelector('.wrap');
  const errors = { CODE_REQUIRED: '請輸入授權碼。', CODE_NOT_FOUND: '找不到此授權碼。', DISABLED: '授權已停用。', EXPIRED: '授權已到期。', DEVICE_MISMATCH: '授權已綁定其他瀏覽器或裝置。', DEVICE_REQUIRED: '缺少裝置識別。', PRODUCT_NOT_ALLOWED: '此授權碼尚未包含社群面板權限。', INVALID_PRODUCT: '授權產品不符。', AMBIGUOUS_AUTHORIZATION: '授權紀錄重複，需由管理員確認。', RATE_LIMITED: '嘗試次數過多，請五分鐘後再試。', VERIFY_SERVICE_ERROR: '授權服務處理失敗。', INVALID_RESPONSE: '授權服務回傳格式不符。', NETWORK_OR_STORAGE_ERROR: '網路或瀏覽器儲存權限異常。' };
  const showFailure = reason => { const safe = /^[A-Z_]{1,60}$/.test(reason || '') ? reason : 'UNKNOWN_ERROR'; out.textContent = '授權未通過：' + (errors[safe] || '驗證失敗，請提供下方錯誤代碼。') + ' [' + safe + ']'; };
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
    if (e.data.product !== 'SOCIAL_PANEL') { reply({ ok: false, reason: 'INVALID_PRODUCT' }); showFailure('INVALID_PRODUCT'); return; }
    const code = String(e.data.code || '').trim();
    if (!code) { reply({ ok: false, reason: 'CODE_REQUIRED' }); showFailure('CODE_REQUIRED'); return; }
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
      if (ok) { out.textContent = '驗證成功，正在回到面板…'; setTimeout(() => window.close(), 700); }
      else showFailure(data.reason || 'INVALID_RESPONSE');
    } catch { reply({ ok: false, reason: 'NETWORK_OR_STORAGE_ERROR' }); showFailure('NETWORK_OR_STORAGE_ERROR'); }
  });
})();
