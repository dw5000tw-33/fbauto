const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const read = name => fs.readFileSync('alpha/' + name, 'utf8');
function fixture(url, content = '') {
  const dom = new JSDOM('<body><main role="main">' + content + '</main></body>', { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.fetch = async () => ({ json: async () => ({ version: 'fixture' }) });
  w.HTMLElement.prototype.getBoundingClientRect = () => ({ width: 200, height: 100, left: 0, top: 0, right: 200, bottom: 100 });
  w.HTMLElement.prototype.getClientRects = () => [{ width: 200, height: 100 }];
  w.HTMLElement.prototype.scrollIntoView = () => {};
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(v) { this.textContent = v; } });
  const originalTimer = w.setTimeout.bind(w); w.setTimeout = (f, ms, ...args) => originalTimer(f, ms <= 2000 ? 0 : ms, ...args);
  w.scrollBy = () => {}; w.confirm = () => { throw Error('dry-run must not ask destructive confirmation'); };
  let popupUrl; const popup = { postMessage() {} }; w.open = url => { popupUrl = url; return popup; };
  w.eval(read('panel-v2.0-alpha.js'));
  const root = w.document.getElementById('fb-ad-manager-alpha-v20');
  root.querySelector('#fb-ad-alpha-code').value = 'MOCK123'; root.querySelector('#fb-ad-alpha-verify').click();
  const nonce = new URL(popupUrl).searchParams.get('nonce');
  w.dispatchEvent(new w.MessageEvent('message', { origin: 'https://dw5000tw-33.github.io', source: popup, data: { type: 'FB_AD_ALPHA_VERIFY_RESULT', nonce, ok: true, user: { name: 'fixture' } } }));
  return { dom, w, root };
}
test('Marketplace actual panel defaults to dry-run, honors limit and never clicks page controls', async () => {
  const { dom, root, w } = fixture('https://www.facebook.com/marketplace/you/selling', '<section><span>測試商品 NT$ 100 Marketplace 上架 1/1 上架 立即推廣</span><button id="real-delete">更多</button></section>');
  let clicks = 0; w.document.querySelector('#real-delete').onclick = () => clicks++;
  root.querySelector('#fb-ad-alpha-marketplace-limit').value = '1';
  assert.equal(root.querySelector('#mp-dry').checked, true);
  await root.querySelector('#fb-ad-alpha-marketplace-delete').onclick();
  assert.equal(clicks, 0); assert.match(root.querySelector('#fb-ad-alpha-marketplace-results').textContent, /預覽/);
  assert.match(root.querySelector('#fb-ad-alpha-marketplace-status').textContent, /未刪除/);
  dom.window.close();
});
test('Marketplace stop during scroll delay exits without pressing delete controls', async () => {
  const { dom, root, w } = fixture('https://www.facebook.com/marketplace/you/selling');
  let scrolls = 0; w.scrollBy = () => { scrolls++; root.querySelector('#mp-stop').click(); };
  await root.querySelector('#fb-ad-alpha-marketplace-delete').onclick();
  assert.equal(scrolls, 1); assert.match(root.querySelector('#fb-ad-alpha-marketplace-status').textContent, /已停止/);
  assert.equal(root.querySelector('#fb-ad-alpha-marketplace-delete').disabled, false);
  dom.window.close();
});
test('Group panel previews only exact author and known date within cutoff, keeps ambiguous posts', async () => {
  const post = (id, author, time) => `<article role="article"><h3><a>${author}</a></h3><a href="/groups/fixture/posts/${id}/">貼文</a>${time ? `<time datetime="${time}"></time>` : ''}<button>更多</button></article>`;
  const { dom, root, w } = fixture('https://www.facebook.com/groups/fixture', post('1', 'Fixture User', '2020-01-01') + post('2', 'Other User', '2020-01-01') + post('3', 'Fixture User', '') + post('4', 'Fixture User', '2099-01-01'));
  w.eval(read('cleanup-runner.js')); w.eval(read('group-cleanup-v2.0-alpha.js'));
  root.querySelector('#gc-name').value = 'Fixture User'; root.querySelector('#gc-date').value = '2026-10-22'; root.querySelector('#gc-scrolls').value = '0';
  await root.querySelector('#gc-start').onclick();
  const log = root.querySelector('#gc-log').textContent;
  assert.match(log, /1 筆預覽候選/); assert.doesNotMatch(log, /預覽候選 2/);
  assert.equal(w.document.querySelectorAll('article').length, 4);
  dom.window.close();
});
