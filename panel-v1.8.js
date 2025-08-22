/* == 多功能刪文助手 v1.8（書籤版：桌機/手機） =======================
   - 社團（作者名比對）／商城（關鍵字+日期）
   - 透過 popup → loader-panel.html → postMessage 注入核心
   - 檢核碼可留空（真的帶空字串）
   - loader 失敗時自動開「DEV 模式：手動貼上核心」備援
   - 日誌精簡：開始／商城掃描…／🗑️ 已刪除／⛔ 跳過：原因／🟠 已要求停止
==================================================================== */
(()=>{

  const PANEL_ID = 'fb_del_flagship_panel_v18';
  const LOADER_URL_BASE = 'https://dw5000tw-33.github.io/fbauto/loader-panel.html';
  const ALLOWED_ORIGIN  = 'https://dw5000tw-33.github.io';

  // 先移除舊面板
  (['fb_del_flagship_panel_v14','fb_del_flagship_panel_v15','fb_del_flagship_panel_v16','fb_del_flagship_panel_v16m0',PANEL_ID])
    .forEach(id=>{ const el=document.getElementById(id); if(el) try{el.remove();}catch{} });

  // ===== style =====
  const css=`
  #${PANEL_ID}{position:fixed;right:14px;top:68px;z-index:2147483000;width:320px;background:#0B1220;color:#E5E7EB;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.35);font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans TC","Helvetica Neue",Arial;border:1px solid #192233;user-select:none}
  #${PANEL_ID} .hdr{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #182133;cursor:move}
  #${PANEL_ID} .ttl{font-weight:700;font-size:16px}
  #${PANEL_ID} .min{margin-left:auto;background:#0b1220;border:1px solid #243041;color:#9ca3af;border-radius:8px;padding:4px 8px;cursor:pointer;user-select:none}
  #${PANEL_ID} .box{padding:10px 12px 12px}
  #${PANEL_ID} label{display:block;margin:8px 0 4px;color:#9fb0c3;font-size:12px}
  #${PANEL_ID} input,#${PANEL_ID} select, #${PANEL_ID} textarea{width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid #374151;background:#111827;color:#E5E7EB;outline:none;user-select:text}
  #${PANEL_ID} textarea{height:140px;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
  #${PANEL_ID} .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #${PANEL_ID} input[type="date"]{background:#fff;color:#111827;border:1px solid #374151;border-radius:10px;padding:8px}
  #${PANEL_ID} input[type="date"]::-webkit-calendar-picker-indicator{filter:none;opacity:.85}
  #${PANEL_ID} .lineRow{display:grid;grid-template-columns:1fr 100px;gap:10px;margin-top:10px;align-items:center}
  #${PANEL_ID} .lineTag{height:40px;display:flex;align-items:center;padding:0 10px;background:#0b1220;border:1px solid #243041;color:#9cc1ff;border-radius:10px}
  #${PANEL_ID} .lineBtn{height:40px;border:none;border-radius:10px;background:#2563eb;color:#fff;cursor:pointer;font-weight:700}
  #${PANEL_ID} .hint{font-size:12px;color:#9fb0c3;margin-top:6px}
  #${PANEL_ID} .now{margin-top:6px;color:#60a5fa;font-size:12px}
  #${PANEL_ID} .btns{display:grid;grid-template-columns:1fr 1fr 100px;gap:10px;margin:12px 0 8px}
  #${PANEL_ID} .btn{border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700}
  #${PANEL_ID} .green{background:#10b981;color:#062a22}
  #${PANEL_ID} .yellow{background:#f59e0b;color:#1f2937}
  #${PANEL_ID} .dark{background:#1f2937;color:#cbd5e1}
  #${PANEL_ID} .log{height:110px;overflow:auto;background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:8px 10px;margin:8px 0 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre-wrap}
  #${PANEL_ID} details{margin-top:8px}
  #${PANEL_ID} summary{cursor:pointer;color:#9cc1ff}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // ===== DOM =====
  const wrap=document.createElement('div'); wrap.id=PANEL_ID;
  wrap.innerHTML=`
    <div class="hdr" id="dragHdr">
      <div class="ttl">刪文助手 v1.8</div>
      <button class="min" id="minBtn">最小化</button>
    </div>
    <div class="box" id="bodyBox">

      <label>檢核碼（可留空；目前測試用）</label>
      <input id="passcode" placeholder="可留空；目前測試用">

      <label>模式</label>
      <select id="mode">
        <option value="group">社團貼文</option>
        <option value="shop">商城貼文</option>
      </select>

      <label id="nameLabel">你的名字</label>
      <input id="name" placeholder="與貼文顯示一致的名稱">

      <div class="row">
        <div><label>每輪上限</label><input id="limit" type="number" min="1" value="10"></div>
        <div><label>捲動次數</label><input id="scrolls" type="number" min="1" value="3"></div>
      </div>

      <div class="row">
        <div><label>延遲(ms)・min</label><input id="dmin" type="number" min="200" value="1000"></div>
        <div><label>延遲(ms)・max</label><input id="dmax" type="number" min="300" value="2000"></div>
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

      <!-- DEV 備援：Render 未部屬時使用 -->
      <details id="devBox" style="display:none;">
        <summary>DEV 模式：手動貼上核心（Render 未部署時）</summary>
        <div class="hint">請將 <b>real-core.js</b> 全文貼在下面，再按「注入並開始」。只在本機執行，不會上傳。</div>
        <textarea id="devCore" placeholder="// 貼上 real-core.js 內容…"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn dark" id="devInject">注入並開始</button>
        </div>
      </details>
    </div>
  `;
  document.body.appendChild(wrap);

  // ===== helpers =====
  const $=s=>wrap.querySelector(s);
  const logBox=$('#log');
  const log=(...a)=>{ logBox.textContent+=a.join(' ')+'\n'; logBox.scrollTop=logBox.scrollHeight; };

  const pad=n=>String(n).padStart(2,'0');
  function tick(){ const d=new Date(); $('#nowTime').textContent=`現在時間：${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
  tick(); const clock=setInterval(tick,1000);

  // 最小化 / 關閉 / 開 LINE
  $('#minBtn').onclick=()=>{ const b=$('#bodyBox'); const hide=b.style.display!=='none'; b.style.display=hide?'none':'block'; $('#minBtn').textContent=hide?'展開':'最小化'; };
  $('#close').onclick=()=>{ try{clearInterval(clock);}catch{} wrap.remove(); };
  $('#openLine').onclick=()=>window.open('https://line.me/R/ti/p/@307momvl','_blank');

  // 可拖曳（桌機/手機）
  (function enableDrag(){
    const hdr=$('#dragHdr'); let sx=0,sy=0,ox=0,oy=0,dragging=false;
    hdr.addEventListener('pointerdown',e=>{ if(e.target.closest('button'))return; dragging=true; hdr.setPointerCapture(e.pointerId); sx=e.clientX; sy=e.clientY; const r=wrap.getBoundingClientRect(); ox=r.left; oy=r.top; e.preventDefault(); });
    hdr.addEventListener('pointermove',e=>{ if(!dragging)return; const dx=e.clientX-sx, dy=e.clientY-sy; wrap.style.left=Math.max(0,ox+dx)+'px'; wrap.style.top=Math.max(0,oy+dy)+'px'; wrap.style.right='auto'; wrap.style.bottom='auto'; wrap.style.position='fixed'; });
    const end=()=>{ dragging=false; }; hdr.addEventListener('pointerup',end); hdr.addEventListener('pointercancel',end);
  })();

  // 預填名字（社團）
  try{
    const guess=Array.from(document.querySelectorAll('a[aria-label$="的動態時報"], a[aria-label*="profile"], a[role="link"] span.html-span'))
      .map(e=>e.textContent?.trim()).find(s=>s && s.length<=50);
    if(guess) $('#name').value=guess;
  }catch{}

  // 停止旗標
  let abortFlag=false;
  $('#stop').onclick=()=>{ abortFlag=true; log('🟠 已要求停止'); };

  // 模式切換：名字/關鍵字提示
  function updateModeUI(){
    const m=$('#mode').value;
    if(m==='shop'){ $('#nameLabel').textContent='商品關鍵字（可多個：逗號 / 空白 / 換行 分隔）'; $('#name').placeholder='例：潭子 好市多 三房'; }
    else { $('#nameLabel').textContent='你的名字'; $('#name').placeholder='與貼文顯示一致的名稱'; }
  }
  $('#mode').addEventListener('change',updateModeUI); updateModeUI();

  // ---- 共用：把 core 字串注入成可呼叫的函式 ----
  function injectCoreCode(code){
    return new Promise((res,rej)=>{
      try{
        const blob=new Blob([code],{type:'text/javascript'});
        const u=URL.createObjectURL(blob);
        const s=document.createElement('script'); s.src=u;
        s.onload=()=>{ URL.revokeObjectURL(u);
          const coreFn = window.FB_DELETE_CORE || (window.FBDelCore && typeof window.FBDelCore.start==='function' ? (opts)=>window.FBDelCore.start(opts) : null);
          if(!coreFn) return rej(new Error('核心格式不正確'));
          res(coreFn);
        };
        s.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('Blob 腳本載入失敗')); };
        document.head.appendChild(s);
      }catch(e){ rej(e); }
    });
  }

  // ---- 共用：組參數並執行核心 ----
  async function runCore(coreFn){
    const mode=$('#mode').value;
    const raw=$('#name').value.trim();
    const cutoff=$('#cutoff').value ? new Date($('#cutoff').value+'T23:59:59') : null;
    if(!raw){ alert(mode==='shop'?'請先輸入商品關鍵字':'請先輸入你的名字'); return; }

    const opts={
      mode,
      myName:(mode==='group')?raw:undefined,
      shopKeywords:(mode==='shop')?raw.split(/[\s,，]+/).map(s=>s.trim()).filter(Boolean):undefined,
      maxDelete:Math.max(1, +$('#limit').value || 10),
      maxScrollRounds:Math.max(1, +$('#scrolls').value || 3),
      delayMin:Math.max(200, +$('#dmin').value || 1000),
      delayMax:Math.max(+$('#dmax').value || 2000, +$('#dmin').value || 1000),
      cutoff,
      onLog: msg=>log(msg),   // 精簡訊息由核心輸出
      shouldAbort: ()=>abortFlag,
      logMode:'simple',
      consoleEcho:false
    };

    log('開始');
    try{ await coreFn(opts); }catch(e){ log('⛔ 跳過：執行錯誤（',e.message,')'); }
  }

  // === 用 popup 載核心（user gesture 觸發 → 手機也能開） ===
  async function loadCoreViaPopup(passcode){
    return new Promise((resolve, reject)=>{
      const codeForLoader=(passcode && passcode.trim())?passcode.trim():'';
      const url=LOADER_URL_BASE+'?c='+encodeURIComponent(codeForLoader);
      const w=window.open(url,'_blank','width=520,height=420');
      if(!w){ reject(new Error('無法開啟載入視窗（瀏覽器封鎖彈窗）')); return; }
      const timer=setTimeout(()=>{ window.removeEventListener('message',onMsg); try{w.close();}catch{} reject(new Error('載入逾時')); },20000);

      function onMsg(ev){
        if(ev.origin !== ALLOWED_ORIGIN){
          try{ console.log('[panel] ignored message from', ev.origin, 'expected', ALLOWED_ORIGIN);}catch{}
          return;
        }
        const data=ev.data||{};
        if(data.type==='FB_CORE_CODE'){ clearTimeout(timer); window.removeEventListener('message',onMsg); try{w.close();}catch{} injectCoreCode(data.code).then(resolve).catch(reject); }
        else if(data.type==='FB_CORE_ERROR'){ clearTimeout(timer); window.removeEventListener('message',onMsg); try{w.close();}catch{} reject(new Error(data.message||'Loader 回報錯誤')); }
      }
      window.addEventListener('message',onMsg);
    });
  }

  // 🔘 開始（預設：loader；失敗：顯示 DEV 備援）
  $('#start').onclick=async()=>{
    abortFlag=false;
    const passcode=$('#passcode').value.trim();

    // 先嘗試 loader
    try{
      const core = await loadCoreViaPopup(passcode);
      await runCore(core);
      return;
    }catch(e){
      log('⛔ 跳過：核心未載入（', e.message, '）');
      // 自動展開 DEV 備援
      const box = $('#devBox');
      box.style.display='block';
      try{ box.open = true; }catch{}
      $('#devCore').focus();
    }
  };

  // DEV：手動貼上核心 → 注入並開始
  $('#devInject').onclick = async ()=>{
    const code = $('#devCore').value;
    if(!code || !code.trim()){ alert('請先貼上 core 內容'); return; }
    try{
      const core = await injectCoreCode(code);
      await runCore(core);
    }catch(e){
      log('⛔ 跳過：DEV 注入失敗（', e.message, '）');
    }
  };

  log('書籤面板就緒：在 facebook.com 點書籤 → 面板出現 → 設定 → 開始');
})();
