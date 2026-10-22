(() => {
  'use strict';
  const root = document.getElementById('fb-ad-manager-alpha-v20');
  if (!root || !window.WorksCleanup || root.querySelector('#gc-panel')) return;
  root.querySelector('main').style.maxHeight = 'calc(100vh - 190px)'; root.querySelector('main').style.overflowY = 'auto';
  const card = document.createElement('button'); card.className = 'card action'; card.style.color = 'inherit'; card.textContent = '社團自有貼文整理'; root.querySelector('.cards').append(card);
  const panel = document.createElement('section'); panel.id = 'gc-panel'; panel.className = 'groups'; panel.hidden = true;
  panel.innerHTML = `<p>只處理目前社團中作者名稱完全相符的貼文。無法確認作者、日期或貼文連結時略過。</p>
    <label for="gc-name">你的完整顯示名稱</label><input id="gc-name">
    <label for="gc-date">截止日期（含當日）</label><input id="gc-date" type="date">
    <label for="gc-limit">每輪上限</label><input id="gc-limit" type="number" min="1" max="100" value="10">
    <label for="gc-scrolls">捲動次數</label><input id="gc-scrolls" type="number" min="0" max="50" value="3">
    <label for="gc-min">操作延遲下限（ms）</label><input id="gc-min" type="number" min="200" value="1000">
    <label for="gc-max">操作延遲上限（ms）</label><input id="gc-max" type="number" min="200" value="2000">
    <label><input id="gc-dry" type="checkbox" checked style="width:auto;flex:none">僅預覽（不刪除）</label>
    <button id="gc-start" class="secondary">開始</button><button id="gc-stop" class="secondary">停止</button><pre id="gc-log" style="max-height:150px;overflow:auto;white-space:pre-wrap"></pre>`;
  root.querySelector('main').append(panel);
  const $ = s => panel.querySelector(s), log = s => { $('#gc-log').textContent += s + '\n'; };
  const visible = el => !!el && !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  const exact = (scope, selector, words) => [...scope.querySelectorAll(selector)].filter(visible).find(el => words.includes((el.innerText || el.getAttribute('aria-label') || '').trim()));
  const runner = window.WorksCleanup.createRunner({
    wait: ms => new Promise(r => setTimeout(r, ms)), log,
    scroll: async () => window.scrollBy(0, Math.max(400, innerHeight * .8)),
    scan: async () => [...document.querySelectorAll('[role="main"] [role="article"], [role="main"] article')].filter(el => !root.contains(el) && visible(el)).map(el => {
      const author = el.querySelector('h2 a, h3 a')?.textContent?.trim() || '';
      const link = [...el.querySelectorAll('a[href]')].find(a => /\/groups\/[^/]+\/(posts|permalink)\//.test(a.href));
      const time = el.querySelector('time[datetime], abbr[data-utime]');
      const date = time?.getAttribute('datetime') ? new Date(time.getAttribute('datetime')) : time?.dataset.utime ? new Date(Number(time.dataset.utime) * 1000) : null;
      return { el, id: link?.href?.split('?')[0], author, date, title: author + '｜' + (date && !isNaN(date) ? date.toLocaleDateString() : '日期不明') };
    }),
    deleteItem: async (item, check, pause) => {
      const click = el => { check(); if (!el) throw new Error('介面不符，已停止；未嘗試替代按鈕'); el.click(); };
      item.el.scrollIntoView({ block: 'center' }); await pause(350);
      click(exact(item.el, 'button,[role="button"]', ['更多', '更多選項', '貼文動作', 'Actions for this post', 'More', '⋯', '...']));
      await pause(400);
      const menu = [...document.querySelectorAll('[role="menu"]')].filter(visible);
      if (menu.length !== 1) throw new Error('無法確認目前貼文選單，已停止');
      click(exact(menu[0], '[role="menuitem"],button,[role="button"]', ['刪除貼文', 'Delete post'])); await pause(400);
      const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(visible);
      if (dialogs.length !== 1) throw new Error('無法確認刪除對話框，已停止');
      click(exact(dialogs[0], 'button,[role="button"]', ['刪除', 'Delete'])); await pause(500);
    }
  });
  card.onclick = () => { if (root.dataset.socialVerified !== '1') { log('請先完成 SOCIAL_PANEL 授權。'); return; } panel.hidden = !panel.hidden; };
  $('#gc-stop').onclick = () => { runner.stop(); log('已要求停止，不再點擊後續按鈕。'); };
  $('#gc-start').onclick = async () => {
    if (root.dataset.socialVerified !== '1' || runner.isRunning()) return;
    if (!/^\/groups\/[^/]+/.test(location.pathname)) { log('請先開啟要整理的 Facebook 社團頁。'); return; }
    const author = $('#gc-name').value.trim(), rawDate = $('#gc-date').value;
    if (!author || !rawDate) { log('請填寫完整名稱與截止日期。'); return; }
    const cutoff = new Date(rawDate + 'T23:59:59.999'), dryRun = $('#gc-dry').checked;
    if (!dryRun && !confirm('將刪除本社團中名稱及日期完全符合的自有貼文。確定開始？')) return;
    $('#gc-start').disabled = true; $('#gc-log').textContent = '';
    try {
      const result = await runner.run({ dryRun, limit: $('#gc-limit').value, scrolls: $('#gc-scrolls').value, delayMin: $('#gc-min').value, delayMax: $('#gc-max').value,
        matches: item => item.author === author && item.date && !isNaN(item.date) && item.date <= cutoff });
      log(`${result.stopped ? '已停止' : '已結束'}：${result.count} 筆${dryRun ? '預覽候選；沒有刪除' : ''}`);
    } catch (error) { log('已停止：' + error.message); } finally { $('#gc-start').disabled = false; }
  };
  const observer = new MutationObserver(() => { if (!root.isConnected || root.dataset.socialVerified !== '1') runner.stop(); if (!root.isConnected) observer.disconnect(); });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-social-verified'] });
})();
