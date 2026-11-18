'use strict';

const JOB_PREFIX = 'marketplace-job:';
const JOB_INDEX = 'marketplace-job-index';
const GROUP_PROFILES_KEY = 'marketplace-group-profiles';
const ACTIVE_JOB_KEY = 'marketplace-active-job';
const ALARM_PREFIX = 'marketplace-publish:';
const QUEUE_ALARM = 'marketplace-queue-next';
const CREATE_URL = 'https://www.facebook.com/marketplace/create/item';
const MAX_ACTIVE_JOBS = 10;

const jobKey = id => JOB_PREFIX + id;
const alarmName = id => ALARM_PREFIX + id;
const nowIso = () => new Date().toISOString();

async function getJob(id) {
  return (await chrome.storage.local.get(jobKey(id)))[jobKey(id)] || null;
}

async function putJob(job) {
  const current = await chrome.storage.local.get(JOB_INDEX);
  const ids = Array.isArray(current[JOB_INDEX]) ? current[JOB_INDEX] : [];
  if (!ids.includes(job.id)) ids.unshift(job.id);
  await chrome.storage.local.set({[jobKey(job.id)]: job, [JOB_INDEX]: ids});
  return job;
}

async function listJobs() {
  const current = await chrome.storage.local.get(JOB_INDEX);
  const ids = Array.isArray(current[JOB_INDEX]) ? current[JOB_INDEX] : [];
  const stored = await chrome.storage.local.get(ids.map(jobKey));
  return ids.map(id => stored[jobKey(id)]).filter(Boolean);
}

function jobSummary(job) {
  const {photos, ...summary} = job;
  return {...summary, photoCount: Array.isArray(photos) ? photos.length : 0};
}

async function schedule(job) {
  const when = new Date(job.scheduledAt).getTime();
  if (!Number.isFinite(when) || when <= Date.now()) throw new Error('上架時間必須晚於現在。');
  await chrome.alarms.create(alarmName(job.id), {when});
}

async function saveJob(input) {
  const old = input.id ? await getJob(input.id) : null;
  if (!old) {
    const count = (await listJobs()).filter(job => ['scheduled', 'queued', 'running'].includes(job.status)).length;
    if (count >= MAX_ACTIVE_JOBS) throw new Error(`目前最多可同時保留 ${MAX_ACTIVE_JOBS} 個等待或執行中的案件。`);
  }
  const job = {
    ...old, ...input,
    id: input.id || crypto.randomUUID(),
    status: 'scheduled', currentStep: '等待排程',
    createdAt: old?.createdAt || nowIso(), updatedAt: nowIso(),
    lastError: '', listingUrl: old?.listingUrl || '',
    queueDelayMinutes: Math.min(30, Math.max(1, Number(input.queueDelayMinutes) || 5)),
    speedMode: input.speedMode === 'slow' ? 'slow' : 'normal'
  };
  await chrome.alarms.clear(alarmName(job.id));
  await putJob(job);
  await schedule(job);
  return job;
}

async function updateJob(id, patch) {
  const job = await getJob(id);
  if (!job) throw new Error('找不到排程案件。');
  return putJob({...job, ...patch, updatedAt: nowIso()});
}

async function cancelJob(id) {
  const job = await getJob(id);
  if (!job) throw new Error('找不到排程案件。');
  await chrome.alarms.clear(alarmName(id));
  if (await getActiveJobId() === id) throw new Error('案件正在執行，請先關閉正在上架的 Facebook 分頁。');
  return updateJob(id, {status: 'cancelled', currentStep: '已取消'});
}

async function removeJob(id) {
  await chrome.alarms.clear(alarmName(id));
  const current = await chrome.storage.local.get(JOB_INDEX);
  const ids = (current[JOB_INDEX] || []).filter(value => value !== id);
  await chrome.storage.local.remove(jobKey(id));
  await chrome.storage.local.set({[JOB_INDEX]: ids});
}

async function notify(title, message) {
  await chrome.notifications.create({type: 'basic', iconUrl: 'icon-128.png', title, message}).catch(() => {});
}

async function sendWhenReady(tabId, message, attempts = 0) {
  try { await chrome.tabs.sendMessage(tabId, message); }
  catch (error) {
    if (attempts >= 60) throw error;
    await new Promise(resolve => setTimeout(resolve, 500));
    return sendWhenReady(tabId, message, attempts + 1);
  }
}

async function getActiveJobId() {
  return (await chrome.storage.local.get(ACTIVE_JOB_KEY))[ACTIVE_JOB_KEY] || '';
}

async function queueJob(id) {
  const job = await getJob(id);
  if (!job || ['published', 'ready_review', 'cancelled'].includes(job.status)) return;
  await chrome.alarms.clear(alarmName(id));
  await updateJob(id, {status: 'queued', currentStep: '等待前一案件完成'});
}

async function launchJob(id, force = false) {
  const job = await getJob(id);
  if (!job || !['scheduled', 'failed', 'pending', 'queued'].includes(job.status)) return;
  const activeId = await getActiveJobId();
  if (activeId && activeId !== id) { await queueJob(id); return; }
  if (!force && job.status === 'scheduled' && new Date(job.scheduledAt).getTime() > Date.now()) return;
  await chrome.storage.local.set({[ACTIVE_JOB_KEY]: id});
  await updateJob(id, {status: 'running', currentStep: '正在開啟 Marketplace', startedAt: nowIso(), lastError: ''});
  try {
    const tab = await chrome.tabs.create({url: `${CREATE_URL}?works_job=${encodeURIComponent(id)}`, active: true});
    const onRemoved = async tabId => {
      if (tabId !== tab.id) return;
      chrome.tabs.onRemoved.removeListener(onRemoved);
      if (await getActiveJobId() === id) await finishFailedJob(id, '上架分頁在完成前被關閉。');
    };
    chrome.tabs.onRemoved.addListener(onRemoved);
    const onUpdated = async (tabId, info) => {
      if (tabId !== tab.id || info.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      try { await sendWhenReady(tabId, {type: 'RUN_MARKETPLACE_JOB', job: await getJob(id)}); }
      catch (error) { await finishFailedJob(id, '無法啟動 Facebook 自動上架：' + error.message); }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  } catch (error) { await finishFailedJob(id, error.message); }
}

async function finishFailedJob(id, error) {
  const job = await updateJob(id, {status: 'failed', currentStep: '執行失敗', lastError: error, finishedAt: nowIso()});
  await releaseQueue(id, job.queueDelayMinutes);
  await notify('Marketplace 上架失敗', job.title);
}

async function releaseQueue(id, delayMinutes = 5) {
  if (await getActiveJobId() === id) await chrome.storage.local.remove(ACTIVE_JOB_KEY);
  if ((await listJobs()).some(job => job.status === 'queued')) {
    await chrome.alarms.create(QUEUE_ALARM, {when: Date.now() + Math.max(1, Number(delayMinutes) || 5) * 60000});
  }
}

async function runNextQueued() {
  if (await getActiveJobId()) return;
  const queued = (await listJobs()).filter(job => job.status === 'queued')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  if (queued[0]) await launchJob(queued[0].id, true);
}

async function listGroupProfiles() {
  const value = (await chrome.storage.local.get(GROUP_PROFILES_KEY))[GROUP_PROFILES_KEY];
  return Array.isArray(value) ? value : [];
}

async function saveGroupProfile(input) {
  const groups = [...new Set((input.groups || []).map(value => String(value).trim()).filter(Boolean))].slice(0, 20);
  if (!input.name?.trim()) throw new Error('請輸入社團組合名稱。');
  if (!groups.length) throw new Error('目前沒有讀取到已勾選的社團。');
  const profiles = await listGroupProfiles();
  const id = input.id || crypto.randomUUID();
  const profile = {id, name: input.name.trim(), groups, requireAll: input.requireAll !== false, updatedAt: nowIso()};
  const index = profiles.findIndex(item => item.id === id);
  if (index >= 0) profiles[index] = profile; else profiles.push(profile);
  await chrome.storage.local.set({[GROUP_PROFILES_KEY]: profiles});
  return profile;
}

async function deleteGroupProfile(id) {
  await chrome.storage.local.set({[GROUP_PROFILES_KEY]: (await listGroupProfiles()).filter(item => item.id !== id)});
}

async function openMarketplaceListing(id) {
  const job = await getJob(id);
  if (!job?.listingUrl) throw new Error('這筆案件還沒有成功上架的網址。');
  const url = new URL(job.listingUrl);
  if (url.origin !== 'https://www.facebook.com' || !url.pathname.startsWith('/marketplace/')) {
    throw new Error('刊登網址格式不正確，已停止開啟。');
  }
  const tab = await chrome.tabs.create({url: url.href, active: true});
  return {tabId: tab.id, url: url.href};
}

async function importGroupProfiles(input) {
  if (!Array.isArray(input)) throw new Error('備份檔沒有有效的社團組合。');
  const profiles = await listGroupProfiles();
  const byName = new Map(profiles.map(profile => [profile.name, profile]));
  let imported = 0;
  for (const item of input) {
    const name = String(item?.name || '').trim();
    const groups = [...new Set((Array.isArray(item?.groups) ? item.groups : []).map(value => String(value).trim()).filter(Boolean))].slice(0, 20);
    if (!name || !groups.length) continue;
    const old = byName.get(name);
    byName.set(name, {
      id: old?.id || crypto.randomUUID(), name, groups,
      requireAll: item.requireAll !== false, updatedAt: nowIso()
    });
    imported++;
  }
  if (!imported) throw new Error('備份檔中找不到可匯入的社團組合。');
  const merged = [...byName.values()];
  await chrome.storage.local.set({[GROUP_PROFILES_KEY]: merged});
  return {imported, profiles: merged};
}

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id || !tab.url?.startsWith('https://www.facebook.com/')) {
    const created = await chrome.tabs.create({url: 'https://www.facebook.com/marketplace/', active: true});
    await sendWhenReady(created.id, {type: 'TOGGLE_SCHEDULER_PANEL'}).catch(() => {});
    return;
  }
  await chrome.tabs.sendMessage(tab.id, {type: 'TOGGLE_SCHEDULER_PANEL'}).catch(() => {});
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === QUEUE_ALARM) runNextQueued();
  else if (alarm.name.startsWith(ALARM_PREFIX)) launchJob(alarm.name.slice(ALARM_PREFIX.length));
});

async function restoreSchedules() {
  await chrome.storage.local.remove(ACTIVE_JOB_KEY);
  for (const job of await listJobs()) {
    if (job.status === 'running') await updateJob(job.id, {status: 'pending', currentStep: '瀏覽器中斷，等待重新執行', lastError: '上次執行期間瀏覽器被關閉。'});
    if (job.status !== 'scheduled') continue;
    const when = new Date(job.scheduledAt).getTime();
    if (when > Date.now()) await chrome.alarms.create(alarmName(job.id), {when});
    else await updateJob(job.id, {status: 'pending', currentStep: '排程時間已過', lastError: '排程時間已過，等待你重新執行。'});
  }
  if ((await listJobs()).some(job => job.status === 'queued')) {
    await chrome.alarms.create(QUEUE_ALARM, {when: Date.now() + 60000});
  }
}

chrome.runtime.onStartup.addListener(restoreSchedules);
chrome.runtime.onInstalled.addListener(restoreSchedules);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === 'SAVE_MARKETPLACE_JOB') sendResponse({ok: true, job: await saveJob(message.job)});
    else if (message.type === 'LIST_MARKETPLACE_JOBS') sendResponse({ok: true, jobs: (await listJobs()).map(jobSummary)});
    else if (message.type === 'GET_MARKETPLACE_JOB') {
      const job = await getJob(message.id);
      if (!job) throw new Error('找不到排程案件。');
      sendResponse({ok: true, job});
    }
    else if (message.type === 'CANCEL_MARKETPLACE_JOB') sendResponse({ok: true, job: await cancelJob(message.id)});
    else if (message.type === 'DELETE_MARKETPLACE_JOB') { await removeJob(message.id); sendResponse({ok: true}); }
    else if (message.type === 'RUN_MARKETPLACE_JOB_NOW') { await launchJob(message.id, true); sendResponse({ok: true}); }
    else if (message.type === 'OPEN_MARKETPLACE_LISTING') sendResponse({ok: true, result: await openMarketplaceListing(message.id)});
    else if (message.type === 'MARKETPLACE_JOB_PROGRESS') { await updateJob(message.id, {currentStep: message.step || ''}); sendResponse({ok: true}); }
    else if (message.type === 'LIST_GROUP_PROFILES') sendResponse({ok: true, profiles: await listGroupProfiles()});
    else if (message.type === 'SAVE_GROUP_PROFILE') sendResponse({ok: true, profile: await saveGroupProfile(message.profile)});
    else if (message.type === 'DELETE_GROUP_PROFILE') { await deleteGroupProfile(message.id); sendResponse({ok: true}); }
    else if (message.type === 'IMPORT_GROUP_PROFILES') sendResponse({ok: true, result: await importGroupProfiles(message.profiles)});
    else if (message.type === 'MARKETPLACE_JOB_RESULT') {
      const status = message.ok ? (message.published ? 'published' : 'ready_review') : 'failed';
      const job = await updateJob(message.id, {
        status,
        currentStep: message.ok ? (message.published ? '發布成功' : '等待人工確認') : '執行失敗',
        listingUrl: message.listingUrl || '', lastError: message.error || '', finishedAt: nowIso()
      });
      await releaseQueue(job.id, job.queueDelayMinutes);
      await notify(message.ok ? (message.published ? 'Marketplace 上架完成' : 'Marketplace 已填妥') : 'Marketplace 上架失敗', job.title);
      sendResponse({ok: true});
    }
  })().catch(error => sendResponse({ok: false, error: error.message}));
  return true;
});
