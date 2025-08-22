/* == 多功能刪文助手 panel0-v1.7（Mobile 無彈窗版 / M0 檢核碼可留空） ==
   - 以 fetch 向 Render 取核心，不開新視窗（iPhone 友善）
   - 支援「社團(group)」與「商城(shop)」兩模式
   - 面板可拖曳，記住位置；雙擊標題回右上角
   - 之後要強制檢核碼：把 start() 裡的檢核碼必填註解打開 + 後端上 /api/verify
--------------------------------------------------------------------- */
(() => {
  const PANEL_ID   = 'fb_del_flagship_panel_v17_mobile';
  const API_BASE   = 'https://fb-core-relay.onrender.com'; // ← 你的 Render 服務
  const TITLE_TXT  = '刪文助手 v1.7 (mobile)';
  const LINE_LINK  = 'https://line.me/R/ti/p/@307momvl';

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
      <input id="passcode" placeholder="短碼或留空（本測試版）">

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

  // ✅ 桌機：點到最小化按鈕就「不要」進入拖曳
  header.addEventListener('mousedown', (e)=>{
    if (e.target && (e.target.id==='minBtn' || e.target.closest && e.target.closest('#minBtn'))) {
      return; // 讓按鈕自己處理 click
    }
    dragging=true; wrap.classList.add('dragging');
    offX = e.clientX - wrap.offsetLeft; offY = e.clientY - wrap.offsetTop;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });

  // ✅ 手機：同理，若是點到最小化按鈕就不要攔截（避免吃掉 click）
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
    // ⬇️ 重點：如果觸控起點在最小化按鈕上，直接放行，不要 preventDefault
    if (ev.target && (ev.target.id==='minBtn' || (ev.target.closest && ev.target.closest('#minBtn')))) {
      return; // 讓按鈕 click 正常發生
    }
    const t=ev.touches[0];
    dragging=true; wrap.classList.add('dragging');
    offX = t.clientX - wrap.offsetLeft; offY = t.clientY - wrap.offsetTop;
    window.addEventListener('touchmove', onTMove, { passive:false });
    window.addEventListener('touchend', onTEnd);
    ev.preventDefault(); // 只有真的在拖曳時才阻止預設，避免吃掉 click
  }, { passive:false });

  header.addEventListener('dblclick', snapTopRight);
  window.addEventListener('resize', ()=>{
    const x = clamp(wrap.offsetLeft, 8, window.innerWidth - wrap.offsetWidth - 8);
    const y = clamp(wrap.offsetTop,  8, window.innerHeight - wrap.offsetHeight - 8);
    place(x,y); save();
  });
})();

  // —— 行動友善：直接 fetch 取核心 → Blob 注入 —— 
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
          if (!coreFn) return rej(new Error('核心格式不正確'));
          res(coreFn);
        };
        s.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Blob 腳本載入失敗')); };
        document.head.appendChild(s);
      } catch (e) { rej(e); }
    });
  }

  async function loadCoreDirect(passcode) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 15000);
    async function getJSON(url){
      const r = await fetch(url, { signal: ac.signal, credentials: 'omit' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }
    try {
      if (passcode) {
        // 正式版可改成 verify；M0 先不強制
        const data = await getJSON(`${API_BASE}/api/verify?code=${encodeURIComponent(passcode)}`);
        if (!data.code) throw new Error(data.error || 'verify 無 code');
        if (data.license) window.__FB_LICENSE__ = data.license;
        clearTimeout(timer);
        return await injectCoreCode(data.code);
      }
      const d2 = await getJSON(`${API_BASE}/api/core`);
      if (!d2.code) throw new Error(d2.error || 'core 無 code');
      clearTimeout(timer);
      return await injectCoreCode(d2.code);
    } catch (err) {
      clearTimeout(timer);
      // 備援再打 /api/core
      const d3 = await fetch(`${API_BASE}/api/core`).then(r=>r.json()).catch(()=>null);
      if (!d3 || !d3.code) throw new Error('載入核心失敗：' + (err.message||err));
      return await injectCoreCode(d3.code);
    }
  }

  // —— 模式切換：動態調整「名字/關鍵字」提示 —— 
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
    abortFlag = false;
    const passcode = $('#passcode').value.trim();              // M0 可留空
    const raw      = $('#name').value.trim();
    const mode     = $('#mode').value;

    // 若要強制檢核碼：打開下面 3 行
    // if (!passcode){
    //   alert('請先到官方 LINE（@307momvl）輸入「臉書刪文」取得檢核碼'); return;
    // }

    if (!raw){
      alert(mode==='shop' ? '請輸入商品關鍵字' : '請先輸入你的名字'); 
      return;
    }

    log('🚀 讀取核心…');
    let core;
    try {
      core = await loadCoreDirect(passcode);
      log('✅ 核心載入完成');
    } catch (e) {
      log('❌ 讀取核心失敗：' + e.message);
      return;
    }

    try {
      const limit   = Math.max(1, +$('#limit').value || 10);
      const scrolls = Math.max(1, +$('#scrolls').value || 3);
      const dmin    = Math.max(200, +$('#dmin').value || 1000);
      const dmax    = Math.max(+$('#dmax').value || 2000, dmin);
      const cutoff  = $('#cutoff').value ? new Date($('#cutoff').value + 'T23:59:59') : null;

      if (mode === 'shop') {
        const shopKeywords = raw.split(/[\s,，]+/).map(s=>s.trim()).filter(Boolean);
        // 為相容舊核心，仍填一個 name；新核心會直接忽略
        await core({
          mode,
          name: '_',                 // 兼容：避免部分版本要求 name
          myName: '_',               // 保險
          shopKeywords,
          maxDelete: limit,
          maxScrollRounds: scrolls,
          delayMin: dmin,
          delayMax: dmax,
          cutoff,
          onLog: msg => log(msg),
          shouldAbort: () => abortFlag
        });
      } else {
        await core({
          mode,
          name: raw,
          myName: raw,
          maxDelete: limit,
          maxScrollRounds: scrolls,
          delayMin: dmin,
          delayMax: dmax,
          cutoff,
          onLog: msg => log(msg),
          shouldAbort: () => abortFlag
        });
      }
    } catch (e) {
      log('❌ 執行錯誤：' + e.message);
    }
  };

  log('🧰 面板就緒：M0 版可略過檢核碼；iPhone 也能用（不開新視窗）。');

})();
