'use strict';

const PANEL_ID = 'works-marketplace-scheduler-v23';
const MAX_PHOTOS = 10;
let folderPhotos = [];
let editingJobId = '';
let groupProfiles = [];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const visible = element => Boolean(element && element.getClientRects().length);

function send(message) {
  return chrome.runtime.sendMessage(message);
}

function statusText(status) {
  return ({
    scheduled: '已排程', running: '執行中', published: '已發布', ready_review: '已填入，等待確認',
    failed: '失敗', pending: '待補發', queued: '排隊中', cancelled: '已取消'
  })[status] || status;
}

function dateTimeInputValue(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function quickTime(panel, minutes = 0, days = 0) {
  const date = new Date(Date.now() + minutes * 60000 + days * 86400000);
  if (!days) date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);
  const [day, clock] = dateTimeInputValue(date).split('T');
  panel.querySelector('[data-date]').value = day;
  panel.querySelector('[data-clock]').value = clock;
}

function timing(job) {
  return job.speedMode === 'slow'
    ? {page: 90000, photo: 180000, groups: 120000, pause: 1800}
    : {page: 45000, photo: 60000, groups: 60000, pause: 800};
}

async function progress(job, step) {
  await send({type: 'MARKETPLACE_JOB_PROGRESS', id: job.id, step}).catch(() => {});
  const panel = document.getElementById(PANEL_ID);
  if (panel) panel.querySelector('[data-status]').textContent = step;
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

function buildPanel() {
  if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);
  const panel = document.createElement('aside');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <header><b>33 Marketplace 自動上架助手</b><span>v2.4</span><button data-close aria-label="關閉">×</button></header>
    <div class="works-body">
      <div class="works-status" data-status>建立案件後設定時間；到點由擴充功能自動上架。</div>
      <label>選擇案件資料夾<input data-folder type="file" webkitdirectory multiple></label>
      <small data-folder-summary>尚未選擇資料夾</small>
      <div class="works-photo-preview" data-photo-preview></div>
      <label>商品標題<input data-title maxlength="200"></label>
      <label>售價（完整元）<input data-price inputmode="numeric" placeholder="例如 15980000"></label>
      <label>Marketplace 文案<textarea data-description rows="9"></textarea></label>
      <div class="works-grid">
        <label>類別<input data-category value="其他商品"></label>
        <label>狀況<input data-condition value="二手 - 良好"></label>
        <label>存貨狀況<input data-stock value="列為有存貨"></label>
        <label>地點<input data-location value="台中市"></label>
      </div>
      <details class="works-groups" open>
        <summary>社團刊登設定</summary>
        <label>社團組合<select data-group-profile><option value="">只刊登 Marketplace</option></select></label>
        <small data-group-summary>尚未建立固定社團名單。</small>
        <label>新組合名稱<input data-profile-name placeholder="例如：台中買賣固定社團"></label>
        <label class="works-check"><input data-require-all type="checkbox" checked> 固定社團全部勾選成功才允許發布</label>
        <div class="works-actions"><button type="button" data-capture-groups class="secondary">讀取目前已勾選社團</button><button type="button" data-delete-profile class="danger">刪除組合</button></div>
      </details>
      <div class="works-grid">
        <label>上架日期（台灣時間）<input data-date type="date"></label>
        <label>上架時間<input data-clock type="time" step="300"></label>
      </div>
      <div class="works-quick-time"><button type="button" data-after="5">5 分鐘後</button><button type="button" data-after="10">10 分鐘後</button><button type="button" data-after="30">30 分鐘後</button><button type="button" data-tomorrow>明天同時間</button></div>
      <div class="works-grid">
        <label>電腦速度<select data-speed><option value="normal">一般</option><option value="slow">慢速電腦</option></select></label>
        <label>案件間隔（分鐘）<input data-delay type="number" min="1" max="30" value="5"></label>
      </div>
      <label class="works-check"><input data-auto type="checkbox"> 到時間允許助手直接按下「發布」</label>
      <div class="works-actions"><button data-save>儲存排程</button><button data-reset class="secondary">清除表單</button><button data-refresh class="secondary">重新整理</button></div>
      <section><h3>排程案件</h3><div data-jobs></div></section>
    </div>`;
  document.body.append(panel);
  panel.querySelector('[data-close]').onclick = () => { clearInterval(panel._jobsTimer); panel.remove(); };
  panel.querySelector('[data-folder]').onchange = event => loadFolder(event.target.files, panel);
  panel.querySelector('[data-save]').onclick = () => saveFromPanel(panel);
  panel.querySelector('[data-reset]').onclick = () => resetForm(panel);
  panel.querySelector('[data-refresh]').onclick = () => renderJobs(panel);
  panel.querySelectorAll('[data-after]').forEach(button => button.onclick = () => quickTime(panel, Number(button.dataset.after)));
  panel.querySelector('[data-tomorrow]').onclick = () => quickTime(panel, 0, 1);
  panel.querySelector('[data-capture-groups]').onclick = () => captureGroupProfile(panel);
  panel.querySelector('[data-delete-profile]').onclick = () => deleteSelectedProfile(panel);
  panel.querySelector('[data-group-profile]').onchange = () => renderSelectedProfile(panel);
  quickTime(panel, 10);
  loadGroupProfiles(panel);
  renderJobs(panel);
  panel._jobsTimer = setInterval(() => { if (panel.isConnected) renderJobs(panel); else clearInterval(panel._jobsTimer); }, 5000);
  return panel;
}

async function loadFolder(fileList, panel) {
  const files = [...fileList];
  const textFile = files.find(file => /\.(txt|md)$/i.test(file.name));
  const images = files.filter(file => /^image\//.test(file.type)).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant', {numeric: true})).slice(0, MAX_PHOTOS);
  const videos = files.filter(file => /^video\//.test(file.type));
  folderPhotos = await Promise.all(images.map(async file => ({name: file.name, dataUrl: await fileToDataUrl(file)})));
  if (textFile) {
    const text = await textFile.text();
    panel.querySelector('[data-description]').value = text;
    panel.querySelector('[data-title]').value = firstLine(text).slice(0, 200);
    panel.querySelector('[data-price]').value = inferPrice(text);
  }
  panel.querySelector('[data-folder-summary]').textContent = `文稿 ${textFile ? 1 : 0} 份、照片 ${images.length} 張、影片 ${videos.length} 支（Marketplace 此頁只使用照片）`;
  renderPhotoPreview(panel);
}

function renderPhotoPreview(panel) {
  const box = panel.querySelector('[data-photo-preview]');
  box.replaceChildren();
  folderPhotos.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'works-photo-item';
    item.innerHTML = `<img alt=""><span></span><div><button type="button" data-left>←</button><button type="button" data-right>→</button><button type="button" data-remove>移除</button></div>`;
    item.querySelector('img').src = photo.dataUrl;
    item.querySelector('img').alt = photo.name;
    item.querySelector('span').textContent = `${index === 0 ? '封面｜' : ''}${index + 1}. ${photo.name}`;
    item.querySelector('[data-left]').disabled = index === 0;
    item.querySelector('[data-right]').disabled = index === folderPhotos.length - 1;
    item.querySelector('[data-left]').onclick = () => { [folderPhotos[index - 1], folderPhotos[index]] = [folderPhotos[index], folderPhotos[index - 1]]; renderPhotoPreview(panel); };
    item.querySelector('[data-right]').onclick = () => { [folderPhotos[index + 1], folderPhotos[index]] = [folderPhotos[index], folderPhotos[index + 1]]; renderPhotoPreview(panel); };
    item.querySelector('[data-remove]').onclick = () => { folderPhotos.splice(index, 1); renderPhotoPreview(panel); panel.querySelector('[data-folder-summary]').textContent = `目前保留照片 ${folderPhotos.length} 張`; };
    box.append(item);
  });
}

function resetForm(panel) {
  editingJobId = '';
  folderPhotos = [];
  panel.querySelectorAll('input[data-title],input[data-price],textarea[data-description],input[data-profile-name]').forEach(element => { element.value = ''; });
  panel.querySelector('[data-folder]').value = '';
  panel.querySelector('[data-folder-summary]').textContent = '尚未選擇資料夾';
  panel.querySelector('[data-auto]').checked = false;
  panel.querySelector('[data-save]').textContent = '儲存排程';
  panel.querySelector('[data-status]').textContent = '可以建立下一個案件。';
  quickTime(panel, 10);
  renderPhotoPreview(panel);
}

async function loadGroupProfiles(panel, selectedId = '') {
  const result = await send({type: 'LIST_GROUP_PROFILES'});
  groupProfiles = result.profiles || [];
  const select = panel.querySelector('[data-group-profile]');
  const previous = selectedId || select.value;
  select.replaceChildren(new Option('只刊登 Marketplace', ''));
  groupProfiles.forEach(profile => select.add(new Option(`${profile.name}（${profile.groups.length} 個）`, profile.id)));
  if ([...select.options].some(option => option.value === previous)) select.value = previous;
  else if (groupProfiles.length === 1) select.value = groupProfiles[0].id;
  renderSelectedProfile(panel);
}

function selectedProfile(panel) {
  return groupProfiles.find(profile => profile.id === panel.querySelector('[data-group-profile]').value) || null;
}

function renderSelectedProfile(panel) {
  const profile = selectedProfile(panel);
  panel.querySelector('[data-group-summary]').textContent = profile
    ? `已選 ${profile.groups.length}/20 個：${profile.groups.join('、')}`
    : '只刊登 Marketplace；若要固定社團，請在 Facebook 社團選擇頁先勾選後讀取。';
  if (profile) {
    panel.querySelector('[data-profile-name]').value = profile.name;
    panel.querySelector('[data-require-all]').checked = profile.requireAll !== false;
  }
}

function isChecked(element) {
  return element.checked === true || element.getAttribute('aria-checked') === 'true';
}

function checkboxName(checkbox) {
  const labelledBy = checkbox.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.innerText || '').join(' ').trim();
    if (label) return clean(label).replace(/\s+(?:[\d,.萬]+ 位成員|公開|私密).*$/, '');
  }
  let node = checkbox;
  for (let depth = 0; node && depth < 7; depth++, node = node.parentElement) {
    const boxes = node.querySelectorAll?.('input[type="checkbox"],[role="checkbox"]') || [];
    const lines = String(node.innerText || '').split(/\n+/).map(clean).filter(Boolean);
    if (boxes.length === 1 && lines.length) {
      const name = lines.find(line => !/^(Marketplace|公開上架|在社團上架|最多可以在|公開|私密)$/i.test(line) && !/位成員/.test(line));
      if (name && name.length <= 120) return name;
    }
  }
  return clean(checkbox.getAttribute('aria-label'));
}

function pageGroupCheckboxes() {
  return [...document.querySelectorAll('input[type="checkbox"],[role="checkbox"]')]
    .filter(element => visible(element) && !element.closest(`#${PANEL_ID}`))
    .map(element => ({element, name: checkboxName(element)}))
    .filter(item => item.name && !/^Marketplace$/i.test(item.name));
}

function groupScrollContainer() {
  const checkbox = pageGroupCheckboxes()[0]?.element;
  if (!checkbox) return null;
  let node = checkbox?.parentElement;
  while (node && node !== document.body) {
    if (node.scrollHeight > node.clientHeight + 80 && node.clientHeight > 200) return node;
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

async function scanSelectedGroups(timeout = 45000) {
  if (!/在更多地方上架|List in more places/i.test(document.body.innerText)) throw new Error('請先進入 Facebook「在更多地方上架」頁面。');
  const selected = new Set();
  const scroller = groupScrollContainer();
  if (!scroller) throw new Error('找不到 Facebook 社團清單，請確認頁面已載入完成。');
  const original = scroller.scrollTop;
  scroller.scrollTop = 0;
  const end = Date.now() + timeout;
  let previous = -1;
  while (Date.now() < end) {
    for (const item of pageGroupCheckboxes()) if (isChecked(item.element)) selected.add(item.name);
    if (scroller.scrollTop === previous || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) break;
    previous = scroller.scrollTop;
    scroller.scrollTop = Math.min(scroller.scrollTop + Math.max(180, scroller.clientHeight * .75), scroller.scrollHeight);
    await sleep(500);
  }
  scroller.scrollTop = original;
  return [...selected].slice(0, 20);
}

async function captureGroupProfile(panel) {
  try {
    panel.querySelector('[data-status]').textContent = '正在讀取已勾選的社團…';
    const groups = await scanSelectedGroups();
    const current = selectedProfile(panel);
    const name = panel.querySelector('[data-profile-name]').value.trim() || current?.name;
    const result = await send({type: 'SAVE_GROUP_PROFILE', profile: {
      id: current?.id, name, groups, requireAll: panel.querySelector('[data-require-all]').checked
    }});
    if (!result.ok) throw new Error(result.error);
    await loadGroupProfiles(panel, result.profile.id);
    panel.querySelector('[data-status]').textContent = `已儲存「${result.profile.name}」，共 ${result.profile.groups.length} 個社團。`;
  } catch (error) { panel.querySelector('[data-status]').textContent = '社團名單未儲存：' + error.message; }
}

async function deleteSelectedProfile(panel) {
  const profile = selectedProfile(panel);
  if (!profile) { panel.querySelector('[data-status]').textContent = '目前沒有選擇社團組合。'; return; }
  if (!confirm(`刪除社團組合「${profile.name}」？`)) return;
  await send({type: 'DELETE_GROUP_PROFILE', id: profile.id});
  await loadGroupProfiles(panel);
  panel.querySelector('[data-status]').textContent = '社團組合已刪除。';
}

async function saveFromPanel(panel) {
  const value = selector => panel.querySelector(selector).value.trim();
  const profile = selectedProfile(panel);
  const scheduleDate = panel.querySelector('[data-date]').value;
  const scheduleClock = panel.querySelector('[data-clock]').value;
  const job = {
    id: editingJobId || undefined,
    title: value('[data-title]'), price: value('[data-price]').replace(/[^\d]/g, ''),
    description: panel.querySelector('[data-description]').value.trim(), photos: folderPhotos,
    category: value('[data-category]') || '其他商品', condition: value('[data-condition]') || '二手 - 良好',
    stock: value('[data-stock]') || '列為有存貨', location: value('[data-location]') || '台中市',
    scheduledAt: `${scheduleDate}T${scheduleClock}`, autoPublish: panel.querySelector('[data-auto]').checked,
    speedMode: panel.querySelector('[data-speed]').value,
    queueDelayMinutes: Number(panel.querySelector('[data-delay]').value) || 5,
    groupProfile: profile ? {id: profile.id, name: profile.name, groups: [...profile.groups], requireAll: profile.requireAll !== false} : null
  };
  if (!job.title || !job.price || !job.description || !scheduleDate || !scheduleClock) {
    panel.querySelector('[data-status]').textContent = '請填寫標題、價格、文案與上架時間。';
    return;
  }
  if (!job.photos.length) {
    panel.querySelector('[data-status]').textContent = '請先選擇包含照片的案件資料夾。';
    return;
  }
  if (new Date(job.scheduledAt).getTime() <= Date.now()) {
    panel.querySelector('[data-status]').textContent = '上架時間必須晚於現在。';
    return;
  }
  if (job.autoPublish && !job.groupProfile) {
    const proceed = confirm('目前沒有選擇固定社團組合，將只發布到 Marketplace。確定儲存嗎？');
    if (!proceed) return;
  }
  const result = await send({type: 'SAVE_MARKETPLACE_JOB', job});
  const wasEditing = Boolean(editingJobId);
  if (result.ok) {
    resetForm(panel);
    panel.querySelector('[data-status]').textContent = wasEditing ? '排程修改完成。' : '排程已儲存。';
    await renderJobs(panel);
  } else panel.querySelector('[data-status]').textContent = result.error;
}

async function renderJobs(panel = document.getElementById(PANEL_ID)) {
  if (!panel) return;
  const result = await send({type: 'LIST_MARKETPLACE_JOBS'});
  const box = panel.querySelector('[data-jobs]');
  box.replaceChildren();
  for (const job of result.jobs || []) {
    const card = document.createElement('article');
    card.innerHTML = `<b></b><p></p><p></p><p data-step></p><p class="works-error"></p><div class="works-actions"><button data-edit>修改</button><button data-run class="secondary">立即執行</button><button data-cancel class="secondary">取消</button><button data-delete class="danger">刪除</button></div>`;
    card.querySelector('b').textContent = job.title;
    card.querySelectorAll('p')[0].textContent = `${localDateTime(job.scheduledAt)}｜${statusText(job.status)}`;
    card.querySelectorAll('p')[1].textContent = `NT$${Number(job.price).toLocaleString('en-US')}｜照片 ${job.photos?.length || 0} 張｜${job.groupProfile?.name || '只刊登 Marketplace'}｜${job.autoPublish ? '自動發布' : '停在確認頁'}`;
    card.querySelector('[data-step]').textContent = `${job.currentStep || ''}${job.speedMode === 'slow' ? '｜慢速模式' : ''}｜案件間隔 ${job.queueDelayMinutes || 5} 分鐘`;
    card.querySelector('.works-error').textContent = job.lastError || job.listingUrl || '';
    card.querySelector('[data-edit]').disabled = job.status === 'running';
    card.querySelector('[data-run]').disabled = job.status === 'running';
    card.querySelector('[data-edit]').onclick = () => editJob(panel, job);
    card.querySelector('[data-run]').onclick = async () => { const response = await send({type: 'RUN_MARKETPLACE_JOB_NOW', id: job.id}); panel.querySelector('[data-status]').textContent = response.ok ? '案件已送入執行佇列。' : response.error; await renderJobs(panel); };
    card.querySelector('[data-cancel]').disabled = ['running', 'published', 'ready_review', 'cancelled'].includes(job.status);
    card.querySelector('[data-cancel]').onclick = async () => { const response = await send({type: 'CANCEL_MARKETPLACE_JOB', id: job.id}); panel.querySelector('[data-status]').textContent = response.ok ? '排程已取消。' : response.error; await renderJobs(panel); };
    card.querySelector('[data-delete]').onclick = async () => { if (confirm(`刪除排程「${job.title}」？`)) { await send({type: 'DELETE_MARKETPLACE_JOB', id: job.id}); renderJobs(panel); } };
    card.querySelector('[data-delete]').disabled = job.status === 'running';
    box.append(card);
  }
}

async function editJob(panel, job) {
  editingJobId = job.id;
  folderPhotos = (job.photos || []).map(photo => ({...photo}));
  const set = (selector, value) => { panel.querySelector(selector).value = value ?? ''; };
  set('[data-title]', job.title); set('[data-price]', job.price); set('[data-description]', job.description);
  set('[data-category]', job.category); set('[data-condition]', job.condition); set('[data-stock]', job.stock); set('[data-location]', job.location);
  const [jobDate, jobClock] = dateTimeInputValue(new Date(job.scheduledAt)).split('T');
  set('[data-date]', jobDate); set('[data-clock]', jobClock); set('[data-speed]', job.speedMode || 'normal'); set('[data-delay]', job.queueDelayMinutes || 5);
  panel.querySelector('[data-auto]').checked = Boolean(job.autoPublish);
  if (job.groupProfile?.id) await loadGroupProfiles(panel, job.groupProfile.id);
  panel.querySelector('[data-folder-summary]').textContent = `已載入排程照片 ${folderPhotos.length} 張；若不需更換，不必重新選擇資料夾。`;
  panel.querySelector('[data-save]').textContent = '儲存修改';
  panel.querySelector('[data-status]').textContent = `正在修改「${job.title}」。`;
  renderPhotoPreview(panel);
  panel.querySelector('.works-body').scrollTop = 0;
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
  const choice = await waitFor(() => {
    const roleChoice = [...document.querySelectorAll('[role="option"],[role="menuitem"],[role="radio"]')]
      .find(element => visible(element) && clean(element.innerText) === option);
    if (roleChoice) return roleChoice;
    const textChoice = [...document.querySelectorAll('div,span')].find(element => {
      if (!visible(element) || clean(element.innerText) !== option) return false;
      return ![...element.children].some(child => clean(child.innerText) === option);
    });
    return textChoice?.closest('[role="option"],[role="menuitem"],[role="radio"],[role="button"]') || textChoice;
  }, 10000);
  choice.click();
  await waitFor(() => clean(combo.innerText).includes(option), 5000);
}

async function uploadPhotos(job, limits = timing(job)) {
  const requestId = crypto.randomUUID();
  const result = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { window.removeEventListener('message', receive); reject(new Error('Facebook 照片上傳回應逾時。')); }, Math.min(limits.photo, 30000));
    function receive(event) {
      if (event.source !== window || event.data?.source !== '33works-marketplace-page' || event.data.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      event.data.ok ? resolve(event.data) : reject(new Error(event.data.error || '照片上傳失敗。'));
    }
    window.addEventListener('message', receive);
    window.postMessage({source: '33works-marketplace-extension', type: 'UPLOAD_PHOTOS', requestId, photos: job.photos.slice(0, MAX_PHOTOS)}, '*');
  });
  if (result.assigned !== job.photos.length) throw new Error(`照片只交付 ${result.assigned}/${job.photos.length} 張。`);
  await waitFor(() => {
    const match = document.body.innerText.match(/相片\s*·\s*(\d+)\s*[／/]\s*10/);
    return match && Number(match[1]) >= job.photos.length;
  }, limits.photo);
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

async function selectConfiguredGroups(job, limits) {
  const profile = job.groupProfile;
  if (!profile?.groups?.length) return {selected: [], missing: []};
  await waitFor(() => /在更多地方上架|List in more places/i.test(document.body.innerText), limits.page);
  const desired = new Map(profile.groups.map(name => [clean(name), name]));
  const found = new Set();
  const scroller = await waitFor(() => groupScrollContainer(), limits.page);
  scroller.scrollTop = 0;
  const end = Date.now() + limits.groups;
  let previous = -1;
  while (Date.now() < end) {
    for (const item of pageGroupCheckboxes()) {
      const key = clean(item.name);
      if (!desired.has(key)) continue;
      found.add(key);
      if (!isChecked(item.element)) {
        item.element.click();
        await sleep(limits.pause);
        if (!isChecked(item.element)) throw new Error(`社團無法勾選：${desired.get(key)}`);
      }
    }
    if (found.size === desired.size) break;
    if (scroller.scrollTop === previous || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) break;
    previous = scroller.scrollTop;
    scroller.scrollTop = Math.min(scroller.scrollTop + Math.max(180, scroller.clientHeight * .72), scroller.scrollHeight);
    await sleep(limits.pause);
  }
  scroller.scrollTop = 0;
  const missing = [...desired].filter(([key]) => !found.has(key)).map(([, name]) => name);
  if (missing.length && profile.requireAll !== false) throw new Error(`必要社團未找到：${missing.join('、')}`);
  return {selected: [...found].map(key => desired.get(key)), missing};
}

async function runMarketplaceJob(job) {
  try {
    const limits = timing(job);
    await progress(job, '等待 Marketplace 頁面載入');
    await waitFor(() => location.pathname.startsWith('/marketplace/create/item'), limits.page);
    await waitFor(() => [...document.querySelectorAll('input')].some(element => fieldLabel(element) === '標題'), limits.page);
    await progress(job, '正在填寫商品資料');
    await ensureMoreDetails();
    nativeSetter(findField(['標題', 'Title']), job.title);
    nativeSetter(findField(['價格', 'Price']), String(job.price));
    nativeSetter(findField(['說明', '描述', '商品說明', 'Description']), job.description);
    const stageErrors = [];
    await progress(job, `正在上傳 ${job.photos.length} 張照片`);
    try { await uploadPhotos(job, limits); } catch (error) { stageErrors.push('照片：' + error.message); }
    await progress(job, '正在設定類別、狀況、庫存與地點');
    try { await selectCombo('類別', job.category || '其他商品'); } catch (error) { stageErrors.push('類別：' + error.message); }
    try { await selectCombo('狀況', job.condition || '二手 - 良好'); } catch (error) { stageErrors.push('狀況：' + error.message); }
    try { await selectCombo('存貨狀況', job.stock || '列為有存貨'); } catch (error) { stageErrors.push('存貨：' + error.message); }
    const locationField = findField(['地點', 'Location'], false);
    if (locationField && clean(locationField.value) !== clean(job.location)) nativeSetter(locationField, job.location);
    for (const label of ['發佈後推廣商品資訊', '對朋友隱藏']) {
      const checkbox = document.querySelector(`input[aria-label="${label}"]`);
      if (checkbox?.getAttribute('aria-checked') === 'true') checkbox.click();
    }
    if (stageErrors.length) throw new Error('部分欄位未完成｜' + stageErrors.join('｜'));
    if (!job.groupProfile?.groups?.length && !job.autoPublish) {
      await send({type: 'MARKETPLACE_JOB_RESULT', id: job.id, ok: true, published: false});
      buildPanel().querySelector('[data-status]').textContent = '案件已填入，依設定停在確認頁。';
      return;
    }
    await progress(job, '商品資料完成，準備進入社團選擇');
    await waitFor(() => readyButton(['繼續', 'Continue']), limits.page);
    clickButton(['繼續', 'Continue']);
    await sleep(limits.pause);
    if (job.groupProfile?.groups?.length) {
      await progress(job, `正在選擇「${job.groupProfile.name}」社團`);
      const groupResult = await selectConfiguredGroups(job, limits);
      if (groupResult.missing.length) await progress(job, `已選 ${groupResult.selected.length} 個，另有 ${groupResult.missing.length} 個社團未找到`);
      else await progress(job, `社團已全部選好（${groupResult.selected.length} 個）`);
    }
    await waitFor(() => readyButton(['發佈', '發布', 'Publish']), limits.page);
    if (!job.autoPublish) {
      await send({type: 'MARKETPLACE_JOB_RESULT', id: job.id, ok: true, published: false, listingUrl: location.href});
      buildPanel().querySelector('[data-status]').textContent = '商品與固定社團已選好，停在發布前確認頁。';
      return;
    }
    await progress(job, '正在按下發布');
    clickButton(['發佈', '發布', 'Publish']);
    await waitFor(() => /\/marketplace\/item\//.test(location.pathname) || /listing/.test(location.pathname), limits.page);
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
    if (panel) { clearInterval(panel._jobsTimer); panel.remove(); } else buildPanel();
    sendResponse({ok: true});
  } else if (message.type === 'RUN_MARKETPLACE_JOB') {
    runMarketplaceJob(message.job);
    sendResponse({ok: true});
  }
});
