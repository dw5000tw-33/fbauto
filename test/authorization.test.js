const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const source = name => fs.readFileSync('alpha/' + name, 'utf8');
function browser(url) {
  const dom = new JSDOM('<body><main role="main"></main></body>', { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.fetch = async () => ({ json: async () => ({ version: 'fixture' }) });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  return dom;
}
test('shared verification page sends SOCIAL_PANEL and stable device, parses API user', async () => {
  const dom = browser('https://dw5000tw-33.github.io/fbauto/alpha/verify-loader.html?nonce=fixture');
  const w = dom.window; w.document.body.innerHTML = '<div class="wrap"></div>';
  const messages = [], requests = []; const opener = { postMessage: x => messages.push(x) }; w.opener = opener;
  w.fetch = async (url, init) => { requests.push(JSON.parse(init.body)); return { ok: true, json: async () => ({ ok: true, user: { name: 'fixture' } }) }; };
  w.eval(source('verify-social.js'));
  const send = (origin, sourceWindow) => w.dispatchEvent(new w.MessageEvent('message', { origin, source: sourceWindow, data: { type: 'FB_AD_ALPHA_VERIFY_CODE', nonce: 'fixture', code: 'MOCK123', product: 'SOCIAL_PANEL' } }));
  send('https://evil.example', opener); send('https://www.facebook.com', {});
  assert.equal(requests.length, 0);
  send('https://www.facebook.com', opener); await new Promise(r => setImmediate(r));
  assert.equal(requests[0].product, 'SOCIAL_PANEL'); assert.ok(requests[0].deviceId); assert.ok(requests[0].deviceName);
  assert.equal(requests[0].deviceId, w.localStorage.getItem('33works:SOCIAL_PANEL:deviceId'));
  assert.equal(messages.at(-1).user.name, 'fixture'); assert.equal(messages.at(-1).ok, true);
  dom.window.close();
});
test('Facebook Alpha sends product, unlocks only on matching popup result, and relocks on failure', () => {
  const dom = browser('https://www.facebook.com/groups/fixture'); const w = dom.window;
  let popupUrl; const sent = []; const popup = { postMessage: x => sent.push(x) }; w.open = url => { popupUrl = url; return popup; };
  w.eval(source('panel-v2.0-alpha.js'));
  const root = w.document.getElementById('fb-ad-manager-alpha-v20');
  const verify = result => {
    root.querySelector('#fb-ad-alpha-code').value = 'MOCK123'; root.querySelector('#fb-ad-alpha-verify').click();
    const nonce = new URL(popupUrl).searchParams.get('nonce');
    for (const data of [{ type: 'FB_AD_ALPHA_VERIFY_READY', nonce }, { type: 'FB_AD_ALPHA_VERIFY_RESULT', nonce, ...result }]) w.dispatchEvent(new w.MessageEvent('message', { origin: 'https://dw5000tw-33.github.io', source: popup, data }));
  };
  verify({ ok: true, user: { name: 'fixture' } }); assert.equal(sent[0].product, 'SOCIAL_PANEL'); assert.equal(root.dataset.socialVerified, '1');
  verify({ ok: false, reason: 'PRODUCT_NOT_ALLOWED' }); assert.equal(root.dataset.socialVerified, '0');
  dom.window.close();
});
test('Threads and Instagram use shared authorization; IG schedule entry unlocks, Threads native policy preserved', () => {
  for (const platform of ['threads.net', 'www.instagram.com']) {
    const dom = browser('https://' + platform + '/'); const w = dom.window;
    let popupUrl; const sent = []; const popup = { postMessage: x => sent.push(x) }; w.open = url => { popupUrl = url; return popup; };
    w.eval(source('scheduler-panel-v2.0-alpha.js')); w.eval(source('scheduler-lock-v2.0-alpha.js'));
    const root = w.document.getElementById('fb-ad-alpha-local-scheduler');
    assert.equal(root.querySelector('#m-schedule').disabled, true);
    root.querySelector('#m-code').value = 'MOCK123'; root.querySelector('#m-verify').click();
    const nonce = new URL(popupUrl).searchParams.get('nonce');
    for (const data of [{ type: 'FB_AD_ALPHA_VERIFY_READY', nonce }, { type: 'FB_AD_ALPHA_VERIFY_RESULT', nonce, ok: true, user: { name: 'fixture' } }]) w.dispatchEvent(new w.MessageEvent('message', { origin: 'https://dw5000tw-33.github.io', source: popup, data }));
    assert.equal(sent[0].product, 'SOCIAL_PANEL'); assert.equal(root.dataset.socialVerified, '1');
    assert.equal(root.querySelector('#m-schedule').disabled, platform === 'threads.net');
    dom.window.close();
  }
});
