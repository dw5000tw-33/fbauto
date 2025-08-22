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

  function visibleDialog(){
    const ds = $$('div[role="dialog"]');
    return ds.reverse().find(d => visible(d) && d.getAttribute('aria-hidden')!=='true') || null;
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
