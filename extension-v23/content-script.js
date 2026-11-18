'use strict';

const PANEL_ID = 'works-marketplace-scheduler-v23';
const MAX_PHOTOS = 10;
let folderPhotos = [];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const visible = element => Boolean(element && element.getClientRects().length);

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function statusText(status) {
  return ({
    scheduled: '已排程', running: '執行中', published: '已發布', ready_review: '已填入，等待確認',
    failed: '失敗', pending: '待補發'
  })[status] || status;
}

function localDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-TW', {timeZone: 'Asia/Taipei', hour12: false});
}

function firstLine(text) {
  return String(text || '').split(/\r?\n/).map(line => line.trim()).find(Boolean) || '';
}

function inferPrice(text) {
  const match = String(text || '').match(/(?:開價|售價|價格)?\s*([\d,]+(?:\.\d+)?)\s*萬/);
  if (!match) return '';
  return String(Math.round(Number(match[1].replace(/,/g, '')) * 10000));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl, name) {
  const [head, body] = dataUrl.split(',');
  const type = head.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(body);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new File([bytes], name, {type});
}

function buildPanel() {
  if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
  const panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <header><b>33 Marketplace 自動上架助手</b><span>v2.3</span><button data-close aria-label="關閉">×</button></header>
    <div class="works-body">
      <div class="works-status" data-status>建立案件後設定時間；到點由擴充功能自動上架。</div>
      <label>選擇案件資料夾<input data-folder type="file" webkitdirectory multiple></label>
      <small data-folder-summary>尚未選擇資料夾</small>
      <label>商品標題<input data-title maxlength="200"></label>
      <label>售價（完整元）<input data-price inputmode="numeric" placeholder="例如 15980000"></label>
      <label>Marketplace 文案<textarea data-description rows="9"></textarea></label>
      <div class="works-grid">
        <label>類別<input data-category value="其他商品"></label>
        <label>狀況<input data-condition value="二手 - 良好"></label>
        <label>存貨狀況<input data-stock value="列為有存貨"></label>
        <label>地點<input data-location value="台中市"></label>
      </div>
      <label>上架時間（台灣時間）<input data-time type="datetime-local"></label>
      <label class="works-check"><input data-auto type="checkbox"> 到時間允許助手直接按下「發布」</label>
      <div class="works-actions"><button data-save>儲存排程</button><button data-refresh class="secondary">重新整理</button></div>
      <section><h3>排程案件</h3><div data-jobs></div></section>
    </div>`;
  document.body.append(panel);
  panel.querySelector('[data-close]').onclick = () => panel.remove();
  panel.querySelector('[data-folder]').onchange = event => loadFolder(event.target.files, panel);
  panel.querySelector('[data-save]').onclick = () => saveFromPanel(panel);
  panel.querySelector('[data-refresh]').onclick = () => renderJobs(panel);
  renderJobs(panel);
  return panel;
}

async function loadFolder(fileList, panel) {
  const files = [...fileList];
  const textFile = files.find(file => /\.(txt|md)$/i.test(file.name));
  const images = files.filter(file => /^image\//.test(file.type)).slice(0, MAX_PHOTOS);
  const videos = files.filter(file => /^video\//.test(file.type));
  folderPhotos = await Promise.all(images.map(async file => ({name: file.name, dataUrl: await fileToDataUrl(file)})));
  if (textFile) {
    const text = await textFile.text();
    panel.querySelector('[data-description]').value = text;
    panel.querySelector('[data-title]').value = firstLine(text).slice(0, 200);
    panel.querySelector('[data-price]').value = inferPrice(text);
  }
  panel.querySelector('[data-folder-summary]').textContent = `文稿 ${textFile ? 1 : 0} 份、照片 ${images.length} 張、影片 ${videos.length} 支（Marketplace 此頁只使用照片）`;
}

async function saveFromPanel(panel) {
  const value = selector => panel.querySelector(selector).value.trim();
  const job = {
    title: value('[data-title]'), price: value('[data-price]').replace(/[^\d]/g, ''),
    description: panel.querySelector('[data-description]').value.trim(), photos: folderPhotos,
    category: value('[data-category]') || '其他商品', condition: value('[data-condition]') || '二手 - 良好',
    stock: value('[data-stock]') || '列為有存貨', location: value('[data-location]') || '台中市',
    scheduledAt: panel.querySelector('[data-time]').value, autoPublish: panel.querySelector('[data-auto]').checked
  };
  if (!job.title || !job.price || !job.description || !job.scheduledAt) {
    panel.querySelector('[data-status]').textContent = '請填寫標題、價格、文案與上架時間。';
    return;
  }
  if (!job.photos.length) {
    panel.querySelector('[data-status]').textContent = '請先選擇包含照片的案件資料夾。';
    return;
  }
  const result = await send({type: 'SAVE_MARKETPLACE_JOB', job});
  panel.querySelector('[data-status]').textContent = result.ok ? '排程已儲存。' : result.error;
  if (result.ok) { folderPhotos = []; await renderJobs(panel); }
}

async function renderJobs(panel = document.getElementById(PANEL_ID)) {
  if (!panel) return;
  const result = await send({type: 'LIST_MARKETPLACE_JOBS'});
  const box = panel.querySelector('[data-jobs]');
  box.replaceChildren();
  for (const job of result.jobs || []) {
    const card = document.createElement('article');
    card.innerHTML = `<b></b><p></p><p></p><p class="works-error"></p><div class="works-actions"><button data-run class="secondary">立即執行</button><button data-delete class="danger">刪除</button></div>`;
    card.querySelector('b').textContent = job.title;
    card.querySelectorAll('p')[0].textContent = `${localDateTime(job.scheduledAt)}｜${statusText(job.status)}`;
    card.querySelectorAll('p')[1].textContent = `NT$${Number(job.price).toLocaleString('en-US')}｜照片 ${job.photos?.length || 0} 張｜${job.autoPublish ? '自動發布' : '停在確認頁'}`;
    card.querySelector('.works-error').textContent = job.lastError || job.listingUrl || '';
    card.querySelector('[data-run]').onclick = () => send({type: 'RUN_MARKETPLACE_JOB_NOW', id: job.id});
    card.querySelector('[data-delete]').onclick = async () => { if (confirm(`刪除排程「${job.title}」？`)) { await send({type: 'DELETE_MARKETPLACE_JOB', id: job.id}); renderJobs(panel); } };
    box.append(card);
  }
}

function fieldLabel(element) {
  const direct = clean(element.getAttribute('aria-label') || element.getAttribute('placeholder'));
  if (direct) return direct;
  let node = element.parentElement;
  for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
    const label = clean(node.innerText);
    if (label && label.length < 80) return label;
  }
  return '';
}

function nativeSetter(element, value) {
  const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
  element.dispatchEvent(new Event('input', {bubbles: true}));
  element.dispatchEvent(new Event('change', {bubbles: true}));
}

function findField(labels, required = true) {
  const scope = document.querySelector('[role="main"]') || document;
  const fields = [...scope.querySelectorAll('input,textarea')].filter(element => visible(element) && element.type !== 'file');
  const matches = fields.filter(element => labels.some(label => fieldLabel(element) === label));
  if (matches.length === 1) return matches[0];
  if (required) throw new Error(`無法唯一辨識欄位：${labels[0]}`);
  return null;
}

async function waitFor(test, timeout = 15000, interval = 250) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = test();
    if (value) return value;
    await sleep(interval);
  }
  throw new Error('等待 Facebook 畫面逾時。');
}

async function ensureMoreDetails() {
  const toggle = [...document.querySelectorAll('button,[role="button"]')].find(element => visible(element) && /更多詳情|More details/i.test(clean(element.innerText || element.getAttribute('aria-label'))));
  if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
    toggle.click();
    await sleep(600);
  }
}

async function selectCombo(label, option) {
  const combos = [...document.querySelectorAll('[role="combobox"]')].filter(visible);
  const combo = combos.find(element => clean(element.innerText).startsWith(label));
  if (!combo) throw new Error(`找不到「${label}」選單。`);
  if (clean(combo.innerText).includes(option)) return;
  combo.click();
  const choice = await waitFor(() => [...document.querySelectorAll('[role="option"]')].find(element => visible(element) && clean(element.innerText) === option));
  choice.click();
  await sleep(300);
}

async function uploadPhotos(job) {
  const scope = document.querySelector('[role="main"]') || document;
  const inputs = [...scope.querySelectorAll('input[type="file"]')].filter(element => String(element.accept || '').toLowerCase().includes('image'));
  const input = inputs.find(element => element.multiple) || inputs[0] || [...scope.querySelectorAll('input[type="file"]')].find(element => element.multiple);
  if (!input) throw new Error('找不到照片上傳欄。');
  const transfer = new DataTransfer();
  for (const photo of job.photos.slice(0, MAX_PHOTOS)) transfer.items.add(dataUrlToFile(photo.dataUrl, photo.name));
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', {bubbles: true}));
  await sleep(1200);
}

function clickButton(names) {
  const candidates = [...document.querySelectorAll('button,[role="button"]')].filter(visible);
  const button = candidates.find(element => names.includes(clean(element.innerText || element.getAttribute('aria-label'))));
  if (!button) throw new Error(`找不到按鈕：${names[0]}`);
  if (button.getAttribute('aria-disabled') === 'true' || button.disabled) throw new Error(`按鈕尚未可用：${names[0]}`);
  button.click();
}

function readyButton(names) {
  return [...document.querySelectorAll('button,[role="button"]')].find(element => {
    const name = clean(element.innerText || element.getAttribute('aria-label'));
    return visible(element) && names.includes(name) && element.getAttribute('aria-disabled') !== 'true' && !element.disabled;
  });
}

async function runMarketplaceJob(job) {
  try {
    await waitFor(() => location.pathname.startsWith('/marketplace/create/item'));
    await waitFor(() => [...document.querySelectorAll('input')].some(element => fieldLabel(element) === '標題'));
    await ensureMoreDetails();
    nativeSetter(findField(['標題', 'Title']), job.title);
    nativeSetter(findField(['價格', 'Price']), String(job.price));
    nativeSetter(findField(['說明', '描述', '商品說明', 'Description']), job.description);
    await selectCombo('類別', job.category || '其他商品');
    await selectCombo('狀況', job.condition || '二手 - 良好');
    await selectCombo('存貨狀況', job.stock || '列為有存貨');
    const locationField = findField(['地點', 'Location'], false);
    if (locationField && clean(locationField.value) !== clean(job.location)) nativeSetter(locationField, job.location);
    for (const label of ['發佈後推廣商品資訊', '對朋友隱藏']) {
      const checkbox = document.querySelector(`input[aria-label="${label}"]`);
      if (checkbox?.getAttribute('aria-checked') === 'true') checkbox.click();
    }
    await uploadPhotos(job);
    if (!job.autoPublish) {
      await send({type: 'MARKETPLACE_JOB_RESULT', id: job.id, ok: true, published: false});
      buildPanel().querySelector('[data-status]').textContent = '案件已填入，依設定停在確認頁。';
      return;
    }
    await waitFor(() => readyButton(['繼續', 'Continue']), 30000);
    clickButton(['繼續', 'Continue']);
    await sleep(1200);
    await waitFor(() => [...document.querySelectorAll('button,[role="button"]')].some(element => visible(element) && ['發佈', '發布', 'Publish'].includes(clean(element.innerText))), 20000);
    clickButton(['發佈', '發布', 'Publish']);
    await waitFor(() => /\/marketplace\/item\//.test(location.pathname) || /listing/.test(location.pathname), 30000);
    await send({type: 'MARKETPLACE_JOB_RESULT', id: job.id, ok: true, published: true, listingUrl: location.href});
  } catch (error) {
    await send({type: 'MARKETPLACE_JOB_RESULT', id: job.id, ok: false, error: error.message, listingUrl: location.href});
    const panel = buildPanel();
    panel.querySelector('[data-status]').textContent = '自動上架停止：' + error.message;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_SCHEDULER_PANEL') {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove(); else buildPanel();
    sendResponse({ok: true});
  } else if (message.type === 'RUN_MARKETPLACE_JOB') {
    runMarketplaceJob(message.job);
    sendResponse({ok: true});
  }
});
