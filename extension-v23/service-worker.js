'use strict';

const JOB_PREFIX = 'marketplace-job:';
const JOB_INDEX = 'marketplace-job-index';
const ALARM_PREFIX = 'marketplace-publish:';
const CREATE_URL = 'https://www.facebook.com/marketplace/create/item';

const jobKey = id => JOB_PREFIX + id;
const alarmName = id => ALARM_PREFIX + id;

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

async function schedule(job) {
  const when = new Date(job.scheduledAt).getTime();
  if (!Number.isFinite(when) || when <= Date.now()) throw new Error('上架時間必須晚於現在。');
  await chrome.alarms.create(alarmName(job.id), {when});
}

async function saveJob(input) {
  const now = new Date().toISOString();
  const old = input.id ? await getJob(input.id) : null;
  const job = {
    ...old,
    ...input,
    id: input.id || crypto.randomUUID(),
    status: 'scheduled',
    createdAt: old?.createdAt || now,
    updatedAt: now,
    lastError: '',
    listingUrl: old?.listingUrl || ''
  };
  await putJob(job);
  await schedule(job);
  return job;
}

async function updateJob(id, patch) {
  const job = await getJob(id);
  if (!job) throw new Error('找不到排程案件。');
  return putJob({...job, ...patch, updatedAt: new Date().toISOString()});
}

async function removeJob(id) {
  await chrome.alarms.clear(alarmName(id));
  const current = await chrome.storage.local.get(JOB_INDEX);
  const ids = (current[JOB_INDEX] || []).filter(value => value !== id);
  await chrome.storage.local.remove(jobKey(id));
  await chrome.storage.local.set({[JOB_INDEX]: ids});
}

async function notify(title, message) {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon-128.png',
    title,
    message
  }).catch(() => {});
}

async function sendWhenReady(tabId, message, attempts = 0) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (attempts >= 20) throw error;
    await new Promise(resolve => setTimeout(resolve, 500));
    return sendWhenReady(tabId, message, attempts + 1);
  }
}

async function runJob(id) {
  const job = await getJob(id);
  if (!job || !['scheduled', 'failed', 'pending'].includes(job.status)) return;
  await updateJob(id, {status: 'running', startedAt: new Date().toISOString(), lastError: ''});
  try {
    const tab = await chrome.tabs.create({url: `${CREATE_URL}?works_job=${encodeURIComponent(id)}`, active: true});
    const onUpdated = async (tabId, info) => {
      if (tabId !== tab.id || info.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      try {
        await sendWhenReady(tabId, {type: 'RUN_MARKETPLACE_JOB', job: await getJob(id)});
      } catch (error) {
        await updateJob(id, {status: 'failed', lastError: '無法啟動 Facebook 自動上架：' + error.message});
        await notify('Marketplace 上架失敗', job.title);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  } catch (error) {
    await updateJob(id, {status: 'failed', lastError: error.message});
    await notify('Marketplace 上架失敗', job.title);
  }
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
  if (alarm.name.startsWith(ALARM_PREFIX)) runJob(alarm.name.slice(ALARM_PREFIX.length));
});

async function restoreSchedules() {
  for (const job of await listJobs()) {
    if (job.status !== 'scheduled') continue;
    const when = new Date(job.scheduledAt).getTime();
    if (when > Date.now()) await chrome.alarms.create(alarmName(job.id), {when});
    else await updateJob(job.id, {status: 'pending', lastError: '排程時間已過，等待你重新執行。'});
  }
}

chrome.runtime.onStartup.addListener(restoreSchedules);
chrome.runtime.onInstalled.addListener(restoreSchedules);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === 'SAVE_MARKETPLACE_JOB') sendResponse({ok: true, job: await saveJob(message.job)});
    else if (message.type === 'LIST_MARKETPLACE_JOBS') sendResponse({ok: true, jobs: await listJobs()});
    else if (message.type === 'DELETE_MARKETPLACE_JOB') { await removeJob(message.id); sendResponse({ok: true}); }
    else if (message.type === 'RUN_MARKETPLACE_JOB_NOW') { await runJob(message.id); sendResponse({ok: true}); }
    else if (message.type === 'MARKETPLACE_JOB_RESULT') {
      const status = message.ok ? (message.published ? 'published' : 'ready_review') : 'failed';
      const job = await updateJob(message.id, {
        status,
        listingUrl: message.listingUrl || '',
        lastError: message.error || '',
        finishedAt: new Date().toISOString()
      });
      await notify(message.ok ? 'Marketplace 上架完成' : 'Marketplace 上架失敗', job.title);
      sendResponse({ok: true});
    }
  })().catch(error => sendResponse({ok: false, error: error.message}));
  return true;
});
