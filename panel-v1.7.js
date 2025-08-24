/* == 多功能刪文助手 panel-v1.7（Fallback / Mobile 友善 / 無核心） ==
   - 先直連 Render 取核心；失敗（多半 CSP）自動改用 popup 取 code
   - 支援「社團(group)」與「商城(shop)」兩模式
   - 面板可拖曳、記住位置；雙擊標題回右上角
   - 正式上線要強制檢核碼：把 passcode 改成必填＆後端驗證 /api/verify
--------------------------------------------------------------------- */
(() => {
  const PANEL_ID   = 'fb_del_flagship_panel_v17_fallback';
  const API_BASE   = 'https://verify-web.onrender.com'; // 你的 Render 服務
  const TITLE_TXT  = '刪文助手 v1.7（fallback）';
  const LINE_LINK  = 'https://line.me/R/ti/p/@307momvl';

  // 你自己的 Loader（會 postMessage 把 code 傳回來）
  const LOADER_URL_BASE = 'https://dw5000tw-33.github.io/fbauto/loader-panel.html';
  const ALLOWED_ORIGIN  = 'https://dw5000tw-33.github.io';

  // —— 先移除舊面板（避免重複）——
  ['fb_del_flagship_panel_v14','fb_del_flagship_panel_v15','fb_del_flagship_panel_v16','fb_del_flagship_panel_v16m0',PANEL_ID]
    .forEach(id => { const el = document.getElementById(id); if (el) try{ el.remove(); }catch{} });

  // —— 樣式 —— 
  const css = `
  #${PANEL_ID}{position:fixed;right:14px;top:68px;z-index:2147483000;
    width:320px;background:#0B1220;color:#E5E7EB;border-radius:14px;
    box-shadow:0 10px 40px rgba(0,0,0,.35);
    font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans TC","Helvetica Neue",Arial;
    border:1px solid #192233}
  #${PANEL_ID} .hdr{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #182133;cursor:move;user-select:none}
  #${PANEL_ID}.dragging{opacity:.98}
  #${PANEL_ID} .ttl{font-weight:700;font-size:16px}
  #${PANEL_ID} .min{margin-left:auto;background:#0b1220;border:1px solid #243041;color:#9ca3af;border-radius:8px;padding:4px 8px;cursor:pointer}
  #${PANEL_ID} .box{padding:10px 12px 12px}
  #${PANEL_ID} label{display:block;margin:8px 0 4px;color:#9fb0c3;font-size:12px}
  #${PANEL_ID} input,#${PANEL_ID} select{
    width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid #374151;background:#111827;color:#E5E7EB;outline:none}
  #${PANEL_ID} .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #${PANEL_ID} input[type="date"]{background:#fff;color:#111827;border:1px solid #374151;border-radius:10px;padding:8px}
  #${PANEL_ID} input[type="date"]::-webkit-calendar-picker-indicator{filter:none;opacity:.85}
  #${PANEL_ID} .lineRow{display:grid;grid-template-columns:1fr 100px;gap:10px;margin-top:10px;align-items:center}
  #${PANEL_ID} .lineTag{height:40px;display:flex;align-items:center;padding:0 10px;
    background:#0b1220;border:1px solid #243041;color:#9cc1ff;border-radius:10px}
  #${PANEL_ID} .lineBtn{height:40px;border:none;border-radius:10px;background:#2563eb;color:#fff;cursor:pointer;font-weight:700}
  #${PANEL_ID} .now{margin-top:6px;color:#60a5fa;font-size:12px}
  #${PANEL_ID} .btns{display:grid;grid-template-columns:1fr 1fr 100px;gap:10px;margin:12px 0 8px}
  #${PANEL_ID} .btn{border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700}
  #${PANEL_ID} .green{background:#10b981;color:#062a22}
  #${PANEL_ID} .yellow{background:#f59e0b;color:#1f2937}
  #${PANEL_ID} .dark{background:#1f2937;color:#cbd5e1}
  #${PANEL_ID} .log{height:120px;overflow:auto;background:#0b1220;border:1px solid #1f2937;border-radius:10px;
    padding:8px 10px;margin:8px 0 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre-wrap}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // —— 面板 DOM —— 
  const wrap = document.createElement('div'); wrap.id = PANEL_ID;
  wrap.innerHTML = `
    <div class="hdr">
      <div class="ttl">${TITLE_TXT}</div>
      <button class="min" id="minBtn">最小化</button>
    </div>
    <div class="box" id="bodyBox">
      <label>檢核碼（M0 可留空；正式版請到官方 LINE 輸入「臉書刪文」取得）</label>
      <input id="passcode" placeholder="短碼或留空（本回退版）">

      <label id="nameLabel">你的名字</label>
      <input id="name" placeholder="與貼文顯示一致的名稱">

      <label>模式</label>
      <select id="mode">
        <option value="group">社團貼文</option>
        <option value="shop">商城貼文（新）</option>
        <option value="page" disabled>粉專貼文（建構中）</option>
      </select>

      <div class="row">
        <div>
          <label>每輪上限</label>
          <input id="limit" type="number" min="1" value="10">
        </div>
        <div>
          <label>捲動次數</label>
          <input id="scrolls" type="number" min="1" value="3">
        </div>
      </div>

      <div class="row">
        <div>
          <label>延遲(ms)・min</label>
          <input id="dmin" type="number" min="200" value="1000">
        </div>
        <div>
          <label>延遲(ms)・max</label>
          <input id="dmax" type="number" min="300" value="2000">
        </div>
      </div>

      <label>僅刪除此日期以前</label>
      <input id="cutoff" type="date" placeholder="年 / 月 / 日">

      <div class="now" id="nowTime"></div>

      <div class="lineRow">
        <div class="lineTag">官方 LINE：@307momvl</div>
        <button class="lineBtn" id="openLine">開啟</button>
      </div>

      <div class="btns">
        <button class="btn green" id="start">開始</button>
        <button class="btn yellow" id="stop">停止</button>
        <button class="btn dark" id="close">關閉</button>
      </div>

      <div class="log" id="log"></div>
    </div>
  `;
  document.body.appendChild(wrap);

  // —— helpers —— 
  const $ = s => wrap.querySelector(s);
  const logBox = $('#log');
  const log = (...a)=>{ logBox.textContent += a.join(' ')+'\n'; logBox.scrollTop=logBox.scrollHeight; console.log('[PANEL]', ...a); };
  const pad = n => String(n).padStart(2,'0');

  // 時鐘
  function tick(){
    const d=new Date();
    $('#nowTime').textContent=`現在時間：${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tick(); const clock = setInterval(tick,1000);

  // 控制
  $('#minBtn').onclick = () => {
    const b=$('#bodyBox'); const hide=b.style.display!=='none';
    b.style.display = hide ? 'none' : 'block';
    $('#minBtn').textContent = hide ? '展開' : '最小化';
  };
  $('#close').onclick = () => { try{clearInterval(clock);}catch{} wrap.remove(); };
  $('#openLine').onclick = () => window.open(LINE_LINK, '_blank');

  // 預填名字（可刪）
  try{
    const guess=Array.from(document.querySelectorAll('a[aria-label$="的動態時報"], a[aria-label*="profile"], a[role="link"] span.html-span'))
      .map(e=>e.textContent?.trim()).find(s=>s && s.length<=50);
    if (guess) $('#name').value=guess;
  }catch{}

  // 停止旗標
  let abortFlag = false;
  $('#stop').onclick = ()=>{ abortFlag = true; log('🟠 已要求停止'); };

  // —— 面板可拖曳 + 記住位置（localStorage）——
  (function makeDraggable(){
    const POS_KEY = PANEL_ID + ':pos';
    const header  = wrap.querySelector('.hdr');
    let dragging=false, offX=0, offY=0;

    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
    function place(x,y){ wrap.style.left=x+'px'; wrap.style.top=y+'px'; wrap.style.right='auto'; }
    function save(){ localStorage.setItem(POS_KEY, JSON.stringify({ x: wrap.offsetLeft, y: wrap.offsetTop })); }
    function load(){
      try{ const p=JSON.parse(localStorage.getItem(POS_KEY));
        if (p && typeof p.x==='number' && typeof p.y==='number'){ place(p.x,p.y); return true; }
      }catch{} return false;
    }
    function snapTopRight(){
      const r = wrap.getBoundingClientRect();
      const x = window.innerWidth - r.width - 14, y = 68;
      place(clamp(x,8,window.innerWidth-r.width-8), clamp(y,8,window.innerHeight-r.height-8)); save();
    }
    if (!load()){
      const r = wrap.getBoundingClientRect();
      place(Math.max(8,Math.min(window.innerWidth-r.width-8,r.left)),
            Math.max(8,Math.min(window.innerHeight-r.height-8,r.top)));
    }

    function onMove(e){
      if (!dragging) return;
      const x = clamp(e.clientX-offX, 8, window.innerWidth - wrap.offsetWidth - 8);
      const y = clamp(e.clientY-offY,  8, window.innerHeight - wrap.offsetHeight - 8);
      place(x,y);
    }
    function onUp(){
      if (!dragging) return;
      dragging=false; wrap.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      save();
    }

    header.addEventListener('mousedown', (e)=>{
      if (e.target && (e.target.id==='minBtn' || e.target.closest?.('#minBtn'))) return;
      dragging=true; wrap.classList.add('dragging');
      offX = e.clientX - wrap.offsetLeft; offY = e.clientY - wrap.offsetTop;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });

    function onTMove(ev){
      if (!dragging) return;
      const t=ev.touches[0];
      const x = clamp(t.clientX-offX, 8, window.innerWidth - wrap.offsetWidth - 8);
      const y = clamp(t.clientY-offY,  8, window.innerHeight - wrap.offsetHeight - 8);
      place(x,y); ev.preventDefault();
    }
    function onTEnd(){
      dragging=false; wrap.classList.remove('dragging');
      window.removeEventListener('touchmove', onTMove, { passive:false });
      window.removeEventListener('touchend', onTEnd);
      save();
    }
    header.addEventListener('touchstart', (ev)=>{
      if (ev.target && (ev.target.id==='minBtn' || ev.target.closest?.('#minBtn'))) return;
      const t=ev.touches[0];
      dragging=true; wrap.classList.add('dragging');
      offX = t.clientX - wrap.offsetLeft; offY = t.clientY - wrap.offsetTop;
      window.addEventListener('touchmove', onTMove, { passive:false });
      window.addEventListener('touchend', onTEnd);
      ev.preventDefault();
    }, { passive:false });

    header.addEventListener('dblclick', snapTopRight);
    window.addEventListener('resize', ()=>{
      const x = clamp(wrap.offsetLeft, 8, window.innerWidth - wrap.offsetWidth - 8);
      const y = clamp(wrap.offsetTop,  8, window.innerHeight - wrap.offsetHeight - 8);
      place(x,y); save();
    });
  })();

  // ====== 通用：把核心字串注入頁面 ======
  async function injectCoreCode(code) {
    return new Promise((res, rej) => {
      try {
        const blob = new Blob([code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => {
          URL.revokeObjectURL(url);
          const coreFn =
            window.FB_DELETE_CORE ||
            (window.FBDelCore && typeof window.FBDelCore.start === 'function'
              ? (opts)=>window.FBDelCore.start(opts)
              : null);
          if (!coreFn) return rej(new Error('核心格式不正確（沒找到 FB_DELETE_CORE）'));
          res(coreFn);
        };
        s.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Blob 腳本載入失敗（可能 CSP）')); };
        document.head.appendChild(s);
      } catch (e) { rej(e); }
    });
  }

  // ====== 方案A：直連（Render）======
  async function loadCoreDirect(passcode, logFn) {
    const ac = new AbortController();
    const tid = setTimeout(()=>ac.abort(), 15000);
    const json = async (u)=>{
      const r = await fetch(u, { signal: ac.signal, credentials:'omit' });
      const t = await r.text(); let j=null; try{ j=JSON.parse(t); }catch{}
      if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText} — ${t.slice(0,200)}`);
      if (!j || typeof j!=='object') throw new Error(`非 JSON 回應：${t.slice(0,200)}`);
      return j;
    };
    try{
      let data;
      if (passcode) {
        data = await json(`${API_BASE}/api/verify?code=${encodeURIComponent(passcode)}`);
      } else {
        data = await json(`${API_BASE}/api/core`);
      }
      if (!data.code) throw new Error('回應內無 code');
      if (data.license) window.__FB_LICENSE__ = data.license;
      clearTimeout(tid);
      return await injectCoreCode(data.code);
    } catch (err) {
      clearTimeout(tid);
      if (logFn) try{ logFn('ℹ️ 直連失敗：' + (err?.message||String(err))); }catch{}
      throw err;
    }
  }

  // ====== 方案B：popup（繞過 CSP）======
  async function loadCoreViaPopup(passcode) {
    return new Promise((resolve, reject) => {
      const url = LOADER_URL_BASE + '?c=' + encodeURIComponent(passcode || '');
      const w = window.open(url, '_blank', 'width=480,height=260');
      if (!w) { reject(new Error('無法開啟載入視窗（瀏覽器封鎖彈窗）')); return; }

      const timeout = setTimeout(() => {
        window.removeEventListener('message', onMsg);
        try { w.close(); } catch {}
        reject(new Error('載入逾時（popup）'));
      }, 15000);

      async function onMsg(ev) {
        if (ev.origin !== ALLOWED_ORIGIN) return;
        const data = ev.data || {};
        if (data.type === 'FB_CORE_CODE') {
          clearTimeout(timeout);
          window.removeEventListener('message', onMsg);
          try { w.close(); } catch {}
          try {
            const coreFn = await injectCoreCode(data.code);
            if (data.license) window.__FB_LICENSE__ = data.license;
            resolve(coreFn);
          } catch (err) { reject(err); }
        } else if (data.type === 'FB_CORE_ERROR') {
          clearTimeout(timeout);
          window.removeEventListener('message', onMsg);
          try { w.close(); } catch {}
          reject(new Error(data.message || 'Loader 回報錯誤'));
        }
      }
      window.addEventListener('message', onMsg);
    });
  }

  // ====== 聰明載入：先直連，失敗就 popup ======
  async function loadCoreSmart(passcode, logFn) {
    try { return await loadCoreDirect(passcode, logFn); }
    catch (e) {
      try { logFn && logFn('🔁 fallback：改用 popup 取核心（繞過 CSP）'); } catch {}
      return await loadCoreViaPopup(passcode);
    }
  }

  // —— 模式切換：動態調整提示 —— 
  function updateModeUI(){
    const m = $('#mode').value;
    if (m === 'shop'){
      $('#nameLabel').textContent = '商品關鍵字（可多個：逗號 / 空白 / 換行 分隔）';
      $('#name').placeholder = '例：潭子 好市多 三房';
    } else {
      $('#nameLabel').textContent = '你的名字';
      $('#name').placeholder = '與貼文顯示一致的名稱';
    }
  }
  $('#mode').addEventListener('change', updateModeUI);
  updateModeUI();

  // —— 開始 —— 
  $('#start').onclick = async () => {
    abortFlag=false;

    const passcode = ($('#passcode')?.value||'').trim(); // 回退版可留空；正式版請改成必填
    const mode = $('#mode').value;
    const raw  = ($('#name')?.value||'').trim();

    const shopKeywords = (mode==='shop')
      ? raw.split(/[\s,，]+/).map(s=>s.trim()).filter(Boolean)
      : undefined;

    try {
      log('🚀 讀取核心…');
      const core = await loadCoreSmart(passcode, m=>log(m));
      log('✅ 核心載入完成');

      const opts = {
        mode,
        // 兼容舊核心：group 填 name / myName；shop 填一個保留字元
        name:   (mode==='group') ? raw : '_',
        myName: (mode==='group') ? raw : '_',
        shopKeywords,
        maxDelete: Math.max(1, +$('#limit').value || 10),
        maxScrollRounds: Math.max(1, +$('#scrolls').value || 3),
        delayMin: Math.max(200, +$('#dmin').value || 1000),
        delayMax: Math.max(+$('#dmax').value || 2000, +$('#dmin').value || 1000),
        cutoff: $('#cutoff').value ? new Date($('#cutoff').value + 'T23:59:59') : null,
        onLog: msg => log(msg),
        shouldAbort: () => abortFlag
      };

      await core(opts);
    } catch (e) {
      log('❌ 讀取或執行核心失敗：' + (e?.message || String(e)));
    }
  };

  log('🧰 回退版面板就緒：先直連，失敗自動 popup；核心在伺服器端，檔案本身不含核心。');
})();
