'use strict';

const JOB_PREFIX = 'marketplace-job:';
const JOB_INDEX = 'marketplace-job-index';
const GROUP_PROFILES_KEY = 'marketplace-group-profiles';
const ACTIVE_JOB_KEY = 'marketplace-active-job';
const ALARM_PREFIX = 'marketplace-publish:';
const WATCHDOG_PREFIX = 'marketplace-watchdog:';
const QUEUE_ALARM = 'marketplace-queue-next';
const DELETE_RULE_PREFIX = 'marketplace-delete-rule:';
const DELETE_RULE_INDEX = 'marketplace-delete-rule-index';
const DELETE_ALARM_PREFIX = 'marketplace-keyword-delete:';
const DELETE_QUEUE_ALARM = 'marketplace-delete-queue-next';
const ACTIVE_DELETE_RULE_KEY = 'marketplace-active-delete-rule';
const CREATE_URL = 'https://www.facebook.com/marketplace/create/item';
const SELLING_URL = 'https://www.facebook.com/marketplace/you/selling';
const MAX_ACTIVE_JOBS = 10;

const jobKey = id => JOB_PREFIX + id;
const alarmName = id => ALARM_PREFIX + id;
const watchdogName = id => WATCHDOG_PREFIX + id;
const deleteRuleKey = id => DELETE_RULE_PREFIX + id;
const deleteAlarmName = id => DELETE_ALARM_PREFIX + id;
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

async function getDeleteRule(id) {
  return (await chrome.storage.local.get(deleteRuleKey(id)))[deleteRuleKey(id)] || null;
}

async function putDeleteRule(rule) {
  const current = await chrome.storage.local.get(DELETE_RULE_INDEX);
  const ids = Array.isArray(current[DELETE_RULE_INDEX]) ? current[DELETE_RULE_INDEX] : [];
  if (!ids.includes(rule.id)) ids.unshift(rule.id);
  await chrome.storage.local.set({[deleteRuleKey(rule.id)]: rule, [DELETE_RULE_INDEX]: ids});
  return rule;
}

async function listDeleteRules() {
  const current = await chrome.storage.local.get(DELETE_RULE_INDEX);
  const ids = Array.isArray(current[DELETE_RULE_INDEX]) ? current[DELETE_RULE_INDEX] : [];
  const stored = await chrome.storage.local.get(ids.map(deleteRuleKey));
  return ids.map(id => stored[deleteRuleKey(id)]).filter(Boolean);
}

async function updateDeleteRule(id, patch) {
  const rule = await getDeleteRule(id);
  if (!rule) throw new Error('找不到刪除排程。');
  return putDeleteRule({...rule, ...patch, updatedAt: nowIso()});
}

async function saveDeleteRule(input) {
  const old = input.id ? await getDeleteRule(input.id) : null;
  const keywords = [...new Set((input.keywords || []).map(value => String(value).trim()).filter(Boolean))].slice(0, 20);
  if (!input.name?.trim()) throw new Error('請輸入刪除排程名稱。');
  if (!keywords.length) throw new Error('請至少輸入一個刪除關鍵字。');
  const scheduledAt = new Date(input.scheduledAt).getTime();
  if (!Number.isFinite(scheduledAt) || scheduledAt <= Date.now()) throw new Error('刪除時間必須晚於現在。');
  const rule = {
    ...old, ...input,
    id: input.id || crypto.randomUUID(), name: input.name.trim(), keywords,
    matchMode: ['exact', 'all', 'any'].includes(input.matchMode) ? input.matchMode : 'exact',
    status: 'scheduled', currentStep: '等待刪除排程', lastError: '', candidates: [],
    autoDelete: input.autoDelete === true, backgroundMode: input.backgroundMode !== false,
    speedMode: input.speedMode === 'slow' ? 'slow' : 'normal',
    queueDelayMinutes: Math.min(30, Math.max(1, Number(input.queueDelayMinutes) || 3)),
    createdAt: old?.createdAt || nowIso(), updatedAt: nowIso()
  };
  await chrome.alarms.clear(deleteAlarmName(rule.id));
  await putDeleteRule(rule);
  await chrome.alarms.create(deleteAlarmName(rule.id), {when: scheduledAt});
  return rule;
}

async function removeDeleteRule(id) {
  await chrome.alarms.clear(deleteAlarmName(id));
  if ((await chrome.storage.local.get(ACTIVE_DELETE_RULE_KEY))[ACTIVE_DELETE_RULE_KEY] === id) {
    await chrome.storage.local.remove(ACTIVE_DELETE_RULE_KEY);
  }
  const current = await chrome.storage.local.get(DELETE_RULE_INDEX);
  const ids = (current[DELETE_RULE_INDEX] || []).filter(value => value !== id);
  await chrome.storage.local.remove(deleteRuleKey(id));
  await chrome.storage.local.set({[DELETE_RULE_INDEX]: ids});
}

async function releaseDeleteQueue(id, delayMinutes = 3) {
  if ((await chrome.storage.local.get(ACTIVE_DELETE_RULE_KEY))[ACTIVE_DELETE_RULE_KEY] === id) {
    await chrome.storage.local.remove(ACTIVE_DELETE_RULE_KEY);
  }
  if ((await listDeleteRules()).some(rule => rule.status === 'queued')) {
    await chrome.alarms.create(DELETE_QUEUE_ALARM, {when: Date.now() + Math.max(1, Number(delayMinutes) || 3) * 60000});
  }
}

async function launchDeleteRule(id, force = false, approvedItemIds = null) {
  const rule = await getDeleteRule(id);
  if (!rule || (!approvedItemIds && !['scheduled', 'failed', 'pending', 'queued', 'awaiting_confirmation', 'completed', 'partial'].includes(rule.status))) return;
  const activeId = (await chrome.storage.local.get(ACTIVE_DELETE_RULE_KEY))[ACTIVE_DELETE_RULE_KEY] || '';
  if (activeId && activeId !== id) {
    await updateDeleteRule(id, {status: 'queued', currentStep: '等待前一個刪除排程完成'});
    return;
  }
  if (!force && rule.status === 'scheduled' && new Date(rule.scheduledAt).getTime() > Date.now()) return;
  await chrome.storage.local.set({[ACTIVE_DELETE_RULE_KEY]: id});
  const running = await updateDeleteRule(id, {
    status: approvedItemIds ? 'deleting' : 'scanning',
    currentStep: approvedItemIds ? `正在刪除已確認的 ${approvedItemIds.length} 筆商品` : '正在掃描「你的商品」',
    lastError: '', executionTabId: null
  });
  try {
    const tab = await chrome.tabs.create({url: `${SELLING_URL}?works_keyword_delete=${encodeURIComponent(id)}`, active: running.backgroundMode === false});
    await updateDeleteRule(id, {executionTabId: tab.id});
    const onRemoved = async tabId => {
      if (tabId !== tab.id) return;
      chrome.tabs.onRemoved.removeListener(onRemoved);
      const current = await getDeleteRule(id);
      if (current && ['scanning', 'deleting'].includes(current.status)) {
        await updateDeleteRule(id, {status: 'failed', currentStep: '刪除流程中斷', lastError: 'Facebook 刪除分頁在完成前被關閉。'});
        await releaseDeleteQueue(id, current.queueDelayMinutes);
      }
    };
    chrome.tabs.onRemoved.addListener(onRemoved);
    const onUpdated = async (tabId, info) => {
      if (tabId !== tab.id || info.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(onUpdated);
      try {
        await sendWhenReady(tabId, {type: 'RUN_KEYWORD_DELETE_RULE', rule: await getDeleteRule(id), approvedItemIds});
      } catch (error) {
        await updateDeleteRule(id, {status: 'failed', currentStep: '無法啟動刪除流程', lastError: error.message});
        await releaseDeleteQueue(id, rule.queueDelayMinutes);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  } catch (error) {
    await updateDeleteRule(id, {status: 'failed', currentStep: '無法開啟 Facebook 商品頁', lastError: error.message});
    await releaseDeleteQueue(id, rule.queueDelayMinutes);
  }
}

async function runNextDeleteRule() {
  const activeId = (await chrome.storage.local.get(ACTIVE_DELETE_RULE_KEY))[ACTIVE_DELETE_RULE_KEY] || '';
  if (activeId) {
    const active = await getDeleteRule(activeId);
    if (active && ['scanning', 'deleting'].includes(active.status)) return;
    await chrome.storage.local.remove(ACTIVE_DELETE_RULE_KEY);
  }
  const queued = (await listDeleteRules()).filter(rule => rule.status === 'queued')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  if (queued[0]) await launchDeleteRule(queued[0].id, true);
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
    speedMode: input.speedMode === 'slow' ? 'slow' : 'normal',
    backgroundMode: input.backgroundMode !== false
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
  await chrome.alarms.clear(watchdogName(id));
  if (await getActiveJobId() === id) await chrome.storage.local.remove(ACTIVE_JOB_KEY);
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
  if (!job || ['submitted', 'published', 'submitted_review', 'ready_review', 'cancelled'].includes(job.status)) return;
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
  await updateJob(id, {status: 'running', currentStep: job.backgroundMode === false ? '正在前景開啟 Marketplace' : '正在背景開啟 Marketplace', startedAt: nowIso(), lastError: '', executionTabId: null});
  try {
    const tab = await chrome.tabs.create({url: `${CREATE_URL}?works_job=${encodeURIComponent(id)}`, active: job.backgroundMode === false});
    await updateJob(id, {executionTabId: tab.id});
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
  await chrome.alarms.clear(watchdogName(id));
  const job = await updateJob(id, {status: 'failed', currentStep: '執行失敗', lastError: error, finishedAt: nowIso()});
  await releaseQueue(id, job.queueDelayMinutes);
  await notify('Marketplace 上架失敗', job.title);
}

async function releaseQueue(id, delayMinutes = 5) {
  await chrome.alarms.clear(watchdogName(id));
  if (await getActiveJobId() === id) await chrome.storage.local.remove(ACTIVE_JOB_KEY);
  if ((await listJobs()).some(job => job.status === 'queued')) {
    await chrome.alarms.create(QUEUE_ALARM, {when: Date.now() + Math.max(1, Number(delayMinutes) || 5) * 60000});
  }
}

async function runNextQueued() {
  const activeId = await getActiveJobId();
  if (activeId) {
    const active = await getJob(activeId);
    if (active && ['running', 'publishing', 'ready_review'].includes(active.status)) return;
    await chrome.storage.local.remove(ACTIVE_JOB_KEY);
  }
  const queued = (await listJobs()).filter(job => job.status === 'queued')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  if (queued[0]) await launchJob(queued[0].id, true);
}

async function focusMarketplaceJob(id) {
  const job = await getJob(id);
  if (!job?.executionTabId) throw new Error('找不到這筆案件原本的 Facebook 分頁。');
  const tab = await chrome.tabs.get(job.executionTabId).catch(() => null);
  if (!tab) throw new Error('原本的 Facebook 確認頁已被關閉。');
  await chrome.tabs.update(tab.id, {active: true});
  if (tab.windowId) await chrome.windows.update(tab.windowId, {focused: true}).catch(() => {});
  return {tabId: tab.id};
}

async function continueMarketplaceJob(id) {
  const job = await getJob(id);
  if (job?.status !== 'ready_review') throw new Error('這筆案件目前不是等待人工確認狀態。');
  if (!job.executionTabId) throw new Error('找不到原本的 Facebook 確認頁。');
  const tab = await chrome.tabs.get(job.executionTabId).catch(() => null);
  if (!tab) throw new Error('原本的 Facebook 確認頁已被關閉，請停止此案件後重新排程。');
  await sendWhenReady(tab.id, {type: 'CONTINUE_MARKETPLACE_JOB', job});
  return {tabId: tab.id};
}

async function stopMarketplaceJob(id) {
  const job = await getJob(id);
  if (!job) throw new Error('找不到排程案件。');
  if (!['running', 'publishing', 'queued', 'ready_review'].includes(job.status)) throw new Error('這筆案件目前不需要停止。');
  await chrome.alarms.clear(alarmName(id));
  await chrome.alarms.clear(watchdogName(id));
  const stopped = await updateJob(id, {status: 'failed', currentStep: '已人工停止並釋放隊列', lastError: '助手已停止；Facebook 上已存在的商品不會被刪除。', finishedAt: nowIso()});
  await releaseQueue(id, 1);
  if (job.executionTabId) await chrome.tabs.remove(job.executionTabId).catch(() => {});
  return stopped;
}

async function publishWatchdog(id) {
  const job = await getJob(id);
  if (!job || job.status !== 'publishing') return;
  await updateJob(id, {
    status: 'needs_attention', currentStep: '無法自動確認 Facebook 最終結果',
    lastError: '已停止等待並釋放後續隊列。請到「你的商品」人工確認是否成功，勿直接重發。', finishedAt: nowIso()
  });
  await releaseQueue(id, job.queueDelayMinutes);
  await notify('Marketplace 結果待確認', job.title);
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
  if (job?.status !== 'published') throw new Error('這筆案件尚未確認發布成功，不能作為刪除目標。');
  if (!job?.listingUrl) throw new Error('這筆案件還沒有成功上架的網址。');
  const url = new URL(job.listingUrl);
  if (url.origin !== 'https://www.facebook.com' || !url.pathname.startsWith('/marketplace/')) {
    throw new Error('刊登網址格式不正確，已停止開啟。');
  }
  const tab = await chrome.tabs.create({url: url.href, active: true});
  return {tabId: tab.id, url: url.href};
}

function marketplaceItemId(url) {
  const value = String(url || '');
  try {
    const parsed = new URL(value);
    return parsed.pathname.match(/\/marketplace\/item\/(\d+)/)?.[1] || parsed.searchParams.get('target_id') || '';
  } catch { return ''; }
}

async function deletePublishedListing(id) {
  const job = await getJob(id);
  if (job?.status !== 'published') throw new Error('只有確認發布成功的案件可以刪除。');
  const itemId = marketplaceItemId(job.listingUrl);
  if (!itemId) throw new Error('這筆刊登沒有可核對的 Marketplace ID，已停止刪除。');
  await updateJob(id, {status: 'deleting', currentStep: `準備刪除刊登 ID ${itemId}`, lastError: ''});
  const tab = await chrome.tabs.create({url: `${SELLING_URL}?works_delete_job=${encodeURIComponent(id)}`, active: true});
  const onRemoved = async tabId => {
    if (tabId !== tab.id) return;
    chrome.tabs.onRemoved.removeListener(onRemoved);
    const current = await getJob(id);
    if (current?.status === 'deleting') {
      await updateJob(id, {status: 'published', currentStep: '刪除中斷，商品仍視為已發布', lastError: '刪除分頁在確認完成前被關閉。'});
    }
  };
  chrome.tabs.onRemoved.addListener(onRemoved);
  const onUpdated = async (tabId, info) => {
    if (tabId !== tab.id || info.status !== 'complete') return;
    chrome.tabs.onUpdated.removeListener(onUpdated);
    try { await sendWhenReady(tabId, {type: 'RUN_MARKETPLACE_DELETE', job: await getJob(id), itemId}); }
    catch (error) { await updateJob(id, {status: 'published', currentStep: '刪除失敗', lastError: error.message}); }
  };
  chrome.tabs.onUpdated.addListener(onUpdated);
  return {itemId, tabId: tab.id};
}

async function importGroupProfiles(input) {
  if (!Array.isArray(input)) throw new Error('備份檔沒有有效的社團組合。');
  const profiles = await listGroupProfiles();
  const byName = new Map(profiles.map(profile => [profile.name, profile]));
  let imported = 0;
  let selectedId = '';
  let groupCount = 0;
  for (const item of input) {
    const name = String(item?.name || '').trim();
    const groups = [...new Set((Array.isArray(item?.groups) ? item.groups : []).map(value => String(value).trim()).filter(Boolean))].slice(0, 20);
    if (!name || !groups.length) continue;
    const old = byName.get(name);
    const profile = {
      id: old?.id || crypto.randomUUID(), name, groups,
      requireAll: item.requireAll !== false, updatedAt: nowIso()
    };
    byName.set(name, profile);
    if (!selectedId) selectedId = profile.id;
    groupCount += groups.length;
    imported++;
  }
  if (!imported) throw new Error('備份檔中找不到可匯入的社團組合。');
  const merged = [...byName.values()];
  await chrome.storage.local.set({[GROUP_PROFILES_KEY]: merged});
  return {imported, groupCount, selectedId, profiles: merged};
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
  else if (alarm.name === DELETE_QUEUE_ALARM) runNextDeleteRule();
  else if (alarm.name.startsWith(DELETE_ALARM_PREFIX)) launchDeleteRule(alarm.name.slice(DELETE_ALARM_PREFIX.length));
  else if (alarm.name.startsWith(WATCHDOG_PREFIX)) publishWatchdog(alarm.name.slice(WATCHDOG_PREFIX.length));
  else if (alarm.name.startsWith(ALARM_PREFIX)) launchJob(alarm.name.slice(ALARM_PREFIX.length));
});

async function restoreSchedules(resumeQueued = false) {
  await chrome.storage.local.remove(ACTIVE_JOB_KEY);
  await chrome.storage.local.remove(ACTIVE_DELETE_RULE_KEY);
  for (const job of await listJobs()) {
    if (['running', 'publishing'].includes(job.status)) await updateJob(job.id, {status: 'needs_attention', currentStep: '更新後需人工確認前次結果', lastError: '前次流程中斷；請先確認 Facebook 是否已有商品，再決定是否重試。'});
    if (!resumeQueued && job.status === 'queued') await updateJob(job.id, {status: 'pending', currentStep: '版本更新後暫停，等待人工重新執行', lastError: '為避免重複刊登，舊排隊案件不會在更新後自動恢復。'});
    if (job.status !== 'scheduled') continue;
    const when = new Date(job.scheduledAt).getTime();
    if (when > Date.now()) await chrome.alarms.create(alarmName(job.id), {when});
    else await updateJob(job.id, {status: 'pending', currentStep: '排程時間已過', lastError: '排程時間已過，等待你重新執行。'});
  }
  if (resumeQueued && (await listJobs()).some(job => job.status === 'queued')) {
    await chrome.alarms.create(QUEUE_ALARM, {when: Date.now() + 60000});
  }
  for (const rule of await listDeleteRules()) {
    if (['scanning', 'deleting'].includes(rule.status)) {
      await updateDeleteRule(rule.id, {status: 'pending', currentStep: '上次刪除流程中斷，等待人工重新執行', lastError: '為避免重複操作，更新或重新啟動後不會自行續刪。'});
      continue;
    }
    if (!resumeQueued && rule.status === 'queued') {
      await updateDeleteRule(rule.id, {status: 'pending', currentStep: '版本更新後暫停，等待人工重新執行'});
      continue;
    }
    if (rule.status !== 'scheduled') continue;
    const when = new Date(rule.scheduledAt).getTime();
    if (when > Date.now()) await chrome.alarms.create(deleteAlarmName(rule.id), {when});
    else await updateDeleteRule(rule.id, {status: 'pending', currentStep: '刪除排程時間已過，等待人工重新執行'});
  }
  if (resumeQueued && (await listDeleteRules()).some(rule => rule.status === 'queued')) {
    await chrome.alarms.create(DELETE_QUEUE_ALARM, {when: Date.now() + 60000});
  }
}

chrome.runtime.onStartup.addListener(() => restoreSchedules(true));
chrome.runtime.onInstalled.addListener(() => restoreSchedules(false));

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
    else if (message.type === 'SAVE_DELETE_RULE') sendResponse({ok: true, rule: await saveDeleteRule(message.rule)});
    else if (message.type === 'LIST_DELETE_RULES') sendResponse({ok: true, rules: await listDeleteRules()});
    else if (message.type === 'GET_DELETE_RULE') {
      const rule = await getDeleteRule(message.id);
      if (!rule) throw new Error('找不到刪除排程。');
      sendResponse({ok: true, rule});
    }
    else if (message.type === 'RUN_DELETE_RULE_NOW') { await launchDeleteRule(message.id, true); sendResponse({ok: true}); }
    else if (message.type === 'CONFIRM_DELETE_RULE') {
      const rule = await getDeleteRule(message.id);
      if (!rule || rule.status !== 'awaiting_confirmation') throw new Error('這筆刪除排程目前沒有等待確認的商品。');
      const ids = (rule.candidates || []).map(item => item.itemId).filter(Boolean);
      if (!ids.length) throw new Error('沒有可刪除的 Marketplace 商品 ID。');
      await launchDeleteRule(rule.id, true, ids);
      sendResponse({ok: true});
    }
    else if (message.type === 'CANCEL_DELETE_RULE') {
      const rule = await getDeleteRule(message.id);
      if (!rule) throw new Error('找不到刪除排程。');
      await chrome.alarms.clear(deleteAlarmName(rule.id));
      await updateDeleteRule(rule.id, {status: 'cancelled', currentStep: '已取消刪除排程'});
      await releaseDeleteQueue(rule.id, 1);
      sendResponse({ok: true});
    }
    else if (message.type === 'DELETE_DELETE_RULE') { await removeDeleteRule(message.id); sendResponse({ok: true}); }
    else if (message.type === 'FOCUS_MARKETPLACE_JOB') sendResponse({ok: true, result: await focusMarketplaceJob(message.id)});
    else if (message.type === 'CONTINUE_MARKETPLACE_JOB') sendResponse({ok: true, result: await continueMarketplaceJob(message.id)});
    else if (message.type === 'STOP_MARKETPLACE_JOB') sendResponse({ok: true, job: await stopMarketplaceJob(message.id)});
    else if (message.type === 'MARKETPLACE_JOB_MARK_SUBMITTED') {
      const current = await getJob(message.id);
      if (!current || !['ready_review', 'needs_attention', 'submitted_review'].includes(current.status)) throw new Error('這筆案件目前不能標記為已送出。');
      const job = await updateJob(current.id, {status: 'submitted', currentStep: '已人工確認送出 Facebook', lastError: '', finishedAt: nowIso()});
      await releaseQueue(job.id, job.queueDelayMinutes);
      sendResponse({ok: true, job});
    }
    else if (message.type === 'MARKETPLACE_JOB_NOT_PUBLISHED') {
      const current = await getJob(message.id);
      if (current?.status !== 'needs_attention') throw new Error('只有結果待確認的案件可以標記為未上架。');
      const job = await updateJob(message.id, {status: 'failed', currentStep: '已人工確認未上架，可重新執行', lastError: '', listingUrl: ''});
      sendResponse({ok: true, job});
    }
    else if (message.type === 'MARKETPLACE_JOB_RECONCILE') {
      const current = await getJob(message.id);
      if (!current || !['needs_attention', 'submitted_review'].includes(current.status)) throw new Error('這筆案件目前不需要重新同步。');
      if (!message.published && !message.submitted) throw new Error('目前頁面沒有明確的刊登結果。');
      const status = message.published ? 'published' : 'submitted_review';
      const job = await updateJob(message.id, {
        status,
        currentStep: message.published ? '已從 Facebook 頁面確認上架成功' : '已從 Facebook 頁面確認仍在審閱',
        listingUrl: message.listingUrl || current.listingUrl || '', lastError: '', finishedAt: nowIso()
      });
      await releaseQueue(job.id, job.queueDelayMinutes);
      sendResponse({ok: true, job});
    }
    else if (message.type === 'MARKETPLACE_JOB_CONFIRM_STATUS') {
      const current = await getJob(message.id);
      if (!current || !['needs_attention', 'submitted_review'].includes(current.status)) throw new Error('這筆案件目前不需要人工確認狀態。');
      if (!['published', 'submitted_review'].includes(message.status)) throw new Error('不支援的人工確認狀態。');
      const job = await updateJob(message.id, {
        status: message.status,
        currentStep: message.status === 'published' ? '已人工確認上架成功' : '已人工確認 Facebook 審閱中',
        listingUrl: message.listingUrl || current.listingUrl || '', lastError: '', finishedAt: nowIso()
      });
      await releaseQueue(job.id, job.queueDelayMinutes);
      sendResponse({ok: true, job});
    }
    else if (message.type === 'GET_CURRENT_TAB_MARKETPLACE_JOB') {
      const tabId = sender.tab?.id;
      const job = (await listJobs()).find(item => item.executionTabId === tabId) || null;
      sendResponse({ok: true, job});
    }
    else if (message.type === 'OPEN_MARKETPLACE_LISTING') sendResponse({ok: true, result: await openMarketplaceListing(message.id)});
    else if (message.type === 'DELETE_PUBLISHED_MARKETPLACE_LISTING') sendResponse({ok: true, result: await deletePublishedListing(message.id)});
    else if (message.type === 'MARKETPLACE_JOB_PROGRESS') { await updateJob(message.id, {currentStep: message.step || ''}); sendResponse({ok: true}); }
    else if (message.type === 'MARKETPLACE_PUBLISH_CLICKED') {
      const current = await getJob(message.id);
      if (!current || !['running', 'ready_review'].includes(current.status)) throw new Error('案件狀態已改變，停止重複按下發布。');
      const activeId = await getActiveJobId();
      if (activeId && activeId !== current.id) throw new Error('另一筆案件正在執行，請先等待或停止該案件。');
      await chrome.storage.local.set({[ACTIVE_JOB_KEY]: current.id});
      const job = await updateJob(message.id, {status: 'submitted', currentStep: '已送出 Facebook，等待平台處理', publishClickedAt: nowIso(), finishedAt: nowIso(), lastError: ''});
      await releaseQueue(job.id, job.queueDelayMinutes);
      await notify('Marketplace 已送出 Facebook', job.title);
      sendResponse({ok: true});
    }
    else if (message.type === 'MARKETPLACE_JOB_UNCERTAIN') {
      const current = await getJob(message.id);
      if (current?.status === 'publishing') {
        const job = await updateJob(message.id, {status: 'needs_attention', currentStep: '發布後結果無法精確確認', listingUrl: message.url || '', lastError: '請到「你的商品」確認是否成功；已釋放後續隊列，請勿直接重發。', finishedAt: nowIso()});
        await releaseQueue(job.id, job.queueDelayMinutes);
        await notify('Marketplace 結果待確認', job.title);
      }
      sendResponse({ok: true});
    }
    else if (message.type === 'MARKETPLACE_DELETE_PROGRESS') { await updateJob(message.id, {currentStep: message.step || ''}); sendResponse({ok: true}); }
    else if (message.type === 'KEYWORD_DELETE_PROGRESS') {
      await updateDeleteRule(message.id, {currentStep: message.step || ''});
      sendResponse({ok: true});
    }
    else if (message.type === 'KEYWORD_DELETE_PREVIEW_RESULT') {
      const rule = await getDeleteRule(message.id);
      if (!rule) throw new Error('找不到刪除排程。');
      const candidates = Array.isArray(message.candidates) ? message.candidates.slice(0, 100) : [];
      const updated = await updateDeleteRule(rule.id, candidates.length ? {
        status: 'awaiting_confirmation', currentStep: `找到 ${candidates.length} 筆符合商品，等待確認刪除`, candidates, lastError: ''
      } : {
        status: 'completed', currentStep: '掃描完成，沒有符合商品', candidates: [], lastError: ''
      });
      await releaseDeleteQueue(rule.id, rule.queueDelayMinutes);
      await notify(candidates.length ? 'Marketplace 刪除清單待確認' : 'Marketplace 沒有符合商品', rule.name);
      sendResponse({ok: true, rule: updated});
    }
    else if (message.type === 'KEYWORD_DELETE_RESULT') {
      const rule = await getDeleteRule(message.id);
      if (!rule) throw new Error('找不到刪除排程。');
      const deleted = Array.isArray(message.deleted) ? message.deleted : [];
      const failed = Array.isArray(message.failed) ? message.failed : [];
      const status = failed.length ? (deleted.length ? 'partial' : 'failed') : 'completed';
      const updated = await updateDeleteRule(rule.id, {
        status,
        currentStep: `刪除完成 ${deleted.length} 筆${failed.length ? `，失敗 ${failed.length} 筆` : ''}`,
        deleted, failed, finishedAt: nowIso(), lastError: failed.map(item => `${item.title || item.itemId}：${item.error}`).join('｜')
      });
      await releaseDeleteQueue(rule.id, rule.queueDelayMinutes);
      await notify(status === 'completed' ? 'Marketplace 關鍵字刪除完成' : 'Marketplace 關鍵字刪除需確認', rule.name);
      sendResponse({ok: true, rule: updated});
    }
    else if (message.type === 'MARKETPLACE_DELETE_RESULT') {
      const job = await updateJob(message.id, message.ok ? {
        status: 'deleted', currentStep: 'Facebook 商品已刪除', deletedAt: nowIso(), deletedItemId: message.itemId || '', lastError: ''
      } : {
        status: 'published', currentStep: '刪除失敗，商品仍視為已發布', lastError: message.error || '刪除流程未完成。'
      });
      await notify(message.ok ? 'Marketplace 商品已刪除' : 'Marketplace 刪除失敗', job.title);
      sendResponse({ok: true});
    }
    else if (message.type === 'LIST_GROUP_PROFILES') sendResponse({ok: true, profiles: await listGroupProfiles()});
    else if (message.type === 'SAVE_GROUP_PROFILE') sendResponse({ok: true, profile: await saveGroupProfile(message.profile)});
    else if (message.type === 'DELETE_GROUP_PROFILE') { await deleteGroupProfile(message.id); sendResponse({ok: true}); }
    else if (message.type === 'IMPORT_GROUP_PROFILES') sendResponse({ok: true, result: await importGroupProfiles(message.profiles)});
    else if (message.type === 'MARKETPLACE_JOB_RESULT') {
      const current = await getJob(message.id);
      if (!current) throw new Error('找不到排程案件。');
      if (['submitted', 'published', 'submitted_review', 'failed', 'needs_attention', 'cancelled', 'deleted'].includes(current.status)) {
        sendResponse({ok: true, ignored: true});
        return;
      }
      const status = message.ok ? (message.published ? 'published' : (message.submitted ? 'submitted_review' : 'ready_review')) : 'failed';
      const job = await updateJob(message.id, {
        status,
        currentStep: message.ok ? (message.published ? '發布成功' : (message.submitted ? '已送出，等待 Facebook 審閱' : (message.warning ? '部分欄位需人工確認' : '等待人工確認'))) : '執行失敗',
        listingUrl: message.listingUrl || '', lastError: message.warning || message.error || '', finishedAt: nowIso()
      });
      if (status !== 'ready_review') await releaseQueue(job.id, job.queueDelayMinutes);
      await notify(message.ok ? (message.published ? 'Marketplace 上架完成' : (message.submitted ? 'Marketplace 已送出審閱' : (message.warning ? 'Marketplace 需要人工補選欄位' : 'Marketplace 已填妥'))) : 'Marketplace 上架失敗', job.title);
      sendResponse({ok: true});
    }
  })().catch(error => sendResponse({ok: false, error: error.message}));
  return true;
});
