// == FB 刪文核心（無UI） ============================================
// 匯出：
//   1) window.FBDelCore { start(opts), stop(), isRunning(), version }
//   2) window.FB_DELETE_CORE(opts)  <-- for UI 直接呼叫
// opts (核心版): { name, limit, scrolls, dmin, dmax, cutoff, mode, onLog, shouldAbort? }
//
// 作者：你我組隊打怪
// ==================================================================
(function (global) {
  'use strict';

  const VERSION = '1.0.1';
  let ABORT = false;
  let running = false;
  const noop = () => {};
  const logPrefix = '🧠[FBDelCore]';

  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const rand  = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const delay = (ms)=>new Promise(r=>setTimeout(r,ms));
  const visible = el => !!el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
  const text = el => (el?.textContent || '').trim();
  const norm = s => (s||'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,'').toLowerCase();

  function logFn(fn, ...args){
    try { fn?.(args.join(' ')); } catch(_) {}
    try { console.log(logPrefix, ...args); } catch(_) {}
  }

  function findCardRoot(el){
    let a = el;
    for (let i=0; i<14 && a; i++){
      if (a.querySelector && a.querySelector('h2, h3')) return a;
      a = a.parentElement;
    }
    return el;
  }

  const bad = /查看更多|留言|分享|分鐘|小時|天|週|年|追蹤|加入|贊助|廣告|相片|影片/i;
  const uniq = arr => Array.from(new Set(arr.filter(Boolean).map(s=>s.trim())));
  function pickBest(cands){
    const arr = uniq(cands).filter(s => s && !bad.test(s) && s.length <= 80);
    arr.sort((a,b)=>a.length-b.length);
    return arr[0] || '';
  }

  function getAuthor(card){
    const cands = [];
    card.querySelectorAll('h2, h3').forEach(h => {
      h.querySelectorAll('a[aria-label]').forEach(a => cands.push(a.getAttribute('aria-label')));
      const el = h.querySelector('span.html-span, a[role="link"] b span, a[role="link"] span, a[role="link"]');
      if (el) cands.push(el.textContent || el.getAttribute?.('aria-label'));
      cands.push(h.textContent);
    });
    card.querySelectorAll('a[href*="/user/"], a[href^="/profile.php"], a[href*="/people/"]').forEach(a => {
      cands.push(a.getAttribute('aria-label') || a.textContent);
      const s = a.querySelector('b span, span'); if (s) cands.push(s.textContent);
    });
    const ids = (card.getAttribute('aria-labelledby')||'').split(/\s+/).filter(Boolean);
    ids.forEach(id => { const el = document.getElementById(id); if (el) cands.push(el.getAttribute?.('aria-label') || el.textContent); });
    return pickBest(cands);
  }

  function isMine(author, my){
    const a = norm(author);
    return !!author && (a===my || a.includes(my) || my.includes(a) || a==='你');
  }

  function parseWhen(card){
    const t = $$('span[dir="auto"], a[role="link"] span', card).map(text).find(s=>/分|小時|天|週|年|·/.test(s)) || '';
    const now = new Date();
    const m = t.match(/(\d+)\s*(分|小時|天|週|年)/);
    if (m){
      const n = +m[1];
      const unit = m[2];
      const d = new Date(now);
      if (unit==='分') d.setMinutes(d.getMinutes() - n);
      else if (unit==='小時') d.setHours(d.getHours() - n);
      else if (unit==='天') d.setDate(d.getDate() - n);
      else if (unit==='週') d.setDate(d.getDate() - n*7);
      else if (unit==='年') d.setFullYear(d.getFullYear() - n);
      return d;
    }
    return null;
  }

// 小工具：輪詢直到條件為真或超時
async function waitFor(testFn, { timeout = 5000, interval = 120 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try {
      const v = testFn();
      if (v) return v;
    } catch (_) {}
    await delay(interval);
  }
  return null;
}

function visibleDialog(){
  const cands = [
    ...$$('div[role="dialog"]'),
    ...$$('div[aria-modal="true"]'),
    ...$$('div[aria-label*="刪除"]'),
    ...$$('div[aria-label*="Delete"]')
  ];
  const vis = cands.filter(d => visible(d) && d.getAttribute('aria-hidden') !== 'true');
  return vis.length ? vis[vis.length - 1] : null; // 取最上層
}


function isMarketplaceSurveyDialog(dlg){
  if (!dlg) return false;
  const txt = (dlg.textContent || '').trim();
  // 常見文案：這項商品是否已售出？（或 EN 版本）
  return /是否已售出|已售出|sold/i.test(txt);
}

async function handleMarketplaceSurvey(rdelay, onLog){
  // 等待第二顆問卷對話框出現
  const dlg = await waitFor(() => {
    const d = visibleDialog();
    return isMarketplaceSurveyDialog(d) ? d : null;
  }, { timeout: 5000, interval: 150 });

  if (!dlg) return false;

  // 優先選「不便回答」；找不到就退而選「否，未售出」
  const pickLabel = $$('label, span', dlg).find(el =>
    /(不便回答|不方便回答|Prefer not|No,.*sold|否[,，]?\s*未售出|No\b.*sold)/i.test((el.textContent||'').trim())
  ) || $$('label, span', dlg)[0];

  if (pickLabel) {
    // 點 label 或其內的 input[type=radio]
    const input = pickLabel.querySelector('input[type="radio"]') || pickLabel.closest('label')?.querySelector('input[type="radio"]');
    if (input) { input.click(); }
    else { pickLabel.click(); }
    await rdelay();
    logFn(onLog, 'ℹ️ 已選擇問卷選項（不便回答/未售出）');
  }

  // 找「繼續 / Continue / 下一步」按鈕
  let go = $$('button, div[role="button"]', dlg).find(el =>
    /(繼續|下一步|Continue|Next)/i.test((el.textContent||'').trim()) &&
    !/(取消|Cancel)/i.test((el.textContent||'').trim())
  );

  if (!go) {
    // 全頁反向找一次
    const all = $$('button, div[role="button"]').filter(visible);
    go = [...all].reverse().find(el => /(繼續|下一步|Continue|Next)/i.test((el.textContent||'').trim()));
  }

  if (go) {
    try { go.scrollIntoView({behavior:'instant', block:'center'}); } catch {}
    await rdelay(); go.click(); await rdelay();
    // 等對話框關閉；若還在就嘗試點「關閉」
    const closed = await waitFor(() => !visibleDialog(), { timeout: 4000, interval: 150 });
    if (!closed) {
      const closeBtn = $$('div[role="button"],button', dlg)
        .find(el => /(關閉|Close|×|✕)/i.test((el.getAttribute('aria-label')||'') + (el.textContent||'')));
      if (closeBtn) { closeBtn.click(); await rdelay(); }
    }
    logFn(onLog, '✅ 問卷已處理並關閉');
    return true;
  }

  logFn(onLog, '⚠️ 找不到「繼續」按鈕');
  return false;
}

  
  async function clickConfirmDelete(rdelay){
    const box = visibleDialog() || document;
    const btn = $$('button, div[role="button"]', box)
      .find(el => /^(刪除|Delete|確定|確認)$/i.test(text(el)));
    if (btn){ btn.click(); await rdelay(); return true; }
    const all = $$('button, div[role="button"]').filter(visible);
    const alt = [...all].reverse().find(el => /^(刪除|Delete|確定|確認)$/i.test(text(el)));
    if (alt){ alt.click(); await rdelay(); return true; }
    return false;
  }

  async function deleteCard(card, rdelay, onLog){
    const menuBtn = card.querySelector('div[aria-label="可對此貼文採取的動作"][role="button"]');
    if (!menuBtn) { logFn(onLog, '⚠️ 找不到三點選單'); return false; }

    menuBtn.scrollIntoView({behavior:'instant', block:'center'});
    await rdelay(); menuBtn.click(); await rdelay();

    const delItem = $$('span, div[role="menuitem"], div[role="button"]')
      .find(el => /刪除貼文|Delete post|刪除商品|Delete item/i.test(text(el)));
    if (!delItem){ logFn(onLog, '⚠️ 找不到「刪除貼文/刪除商品」選項'); return false; }
    delItem.click(); await rdelay();

    const ok = await clickConfirmDelete(rdelay);
    if (!ok){ logFn(onLog, '⚠️ 找不到對話框內的「刪除/確定」按鈕'); return false; }

　　// ⬇️ 這一行是重點：若 FB 跳出「是否已售出？」問卷，就自動選擇並「繼續」
　　await handleMarketplaceSurvey(rdelay, onLog);

    await delay(400);
    return true;
  }

  async function scanOnce(ctx){
    const { maxToDelete, rdelay, onLog, my, cutoffDate, shouldAbort } = ctx;
    const main = document.querySelector('[role="main"]') || document.body;

    const menuBtns = $$('div[aria-label="可對此貼文採取的動作"][role="button"]').filter(btn => main.contains(btn));
    const cards = Array.from(new Set(menuBtns.map(findCardRoot)));
    let count = 0;

    for (const card of cards){
      if (ABORT || shouldAbort?.() || count >= maxToDelete) break;

      const author = getAuthor(card);
      const mine = isMine(author, my);

      let passTime = true;
      if (cutoffDate){
        const when = parseWhen(card);
        if (when) passTime = when <= cutoffDate;
      }

      if (mine && passTime){
        const ok = await deleteCard(card, rdelay, onLog);
        if (ok){ count++; logFn(onLog, `🗑️ 已刪除：${author}（本輪 ${count}/${maxToDelete}）`); }
      }
      await delay(200);
    }
    return count;
  }

  async function main(opts){
    const {
      name,
      limit=10,
      scrolls=5,
      dmin=900,
      dmax=1600,
      cutoff=null,
      mode='group',
      onLog=noop,
      shouldAbort
    } = opts || {};

    if (!name || !name.trim()) throw new Error('請提供 opts.name（你的名稱）');

    const my = norm(name.trim());
    const rdelay = ()=>delay(rand(Math.max(200,dmin|0), Math.max(300,dmax|0)));
    const cutoffDate = cutoff ? new Date(typeof cutoff==='string' ? `${cutoff}T23:59:59` : cutoff) : null;

    logFn(onLog, `🚀 開始：模式=${mode} 上限=${limit} 捲動=${scrolls} 延遲=${dmin}-${dmax}ms 截止=${cutoffDate?cutoffDate.toISOString().slice(0,10):'（無）'}`);

    let total = 0, sc = 0, round = 1;

    while (!ABORT && !(shouldAbort?.()) && total < limit){
      logFn(onLog, `🔎 第 ${round} 輪掃描…`);
      const n = await scanOnce({ maxToDelete: (limit - total), rdelay, onLog, my, cutoffDate, shouldAbort });
      total += n;
      if (total >= limit) break;
      if (n > 0){ sc = 0; round++; continue; }

      if (sc >= scrolls){
        logFn(onLog, '✅ 沒有更多可刪（或需手動載入更多）');
        break;
      }
      window.scrollBy({ top: 800, left: 0, behavior: 'instant' });
      sc++; round++; await rdelay();
    }

    logFn(onLog, `🟢 結束：共刪除 ${total} 則`);
    return total;
  }

  function start(opts){
    if (running) throw new Error('核心已在執行中');
    ABORT = false;
    running = true;
    Promise.resolve().then(()=>main(opts)).finally(()=>{ running=false; });
    return { stop };
  }

  function stop(){ ABORT = true; }
  function isRunning(){ return running; }

  // 原本的物件 API
  global.FBDelCore = { start, stop, isRunning, version: VERSION };

  // 供 UI 直接呼叫的函式（自動映射參數）
  global.FB_DELETE_CORE = async function (uiOpt = {}) {
    const mapped = {
      name:   uiOpt.myName ?? uiOpt.name,
      limit:  uiOpt.maxDelete ?? uiOpt.limit,
      scrolls: uiOpt.maxScrollRounds ?? uiOpt.scrolls,
      dmin:   uiOpt.delayMin ?? uiOpt.dmin,
      dmax:   uiOpt.delayMax ?? uiOpt.dmax,
      cutoff: uiOpt.cutoff ?? null,
      mode:   uiOpt.mode ?? 'group',
      onLog:  uiOpt.onLog ?? noop,
      shouldAbort: uiOpt.shouldAbort
    };
    return await main(mapped);
  };

})(window);


