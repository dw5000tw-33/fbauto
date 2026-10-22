/* == 多功能刪文助手 v1.8（藍白希臘風｜窄版｜保留進度回報） ======================
   - 模式：group（社團） / shop（商城）
   - 檢核碼縮小＋右側放 LINE 官方鈕
   - 下方進度回報（log）保留，但換成白底深灰
   - 流程：popup → loader-panel.html → postMessage → 注入核心（沿用 v1.8）
   - DEV 區塊預設隱藏；輸入 DEV 才顯示
============================================================================= */
(()=>{
  const PANEL_ID = 'fb_del_flagship_panel_v18_greek';
  const LOADER_URL_BASE = 'https://dw5000tw-33.github.io/fbauto/loader-panel.html';
  const ALLOWED_ORIGIN  = 'https://dw5000tw-33.github.io';
  const CORE_API_BASE   = 'https://verify-web.onrender.com/api/core?c=';

  // 先移除舊面板
  ([
    'fb_del_flagship_panel_v14',
    'fb_del_flagship_panel_v15',
    'fb_del_flagship_panel_v16',
    'fb_del_flagship_panel_v16m0',
    'fb_del_flagship_panel_v18',
    'fb_del_flagship_panel_v188',
    PANEL_ID
  ]).forEach(id=>{
    const el=document.getElementById(id);
    if(el) try{el.remove();}catch{}
  });

  // ====== Style：藍白希臘風（窄版） ======
  const css=`
  :root{
    --blue:#1f3b8b; --ivory:#f8f9fc; --card:#fff;
    --ink:#1f2937; --muted:#6b7280; --stroke:#dbe2f0;
    --shadow:0 10px 28px rgba(31,59,139,.12);
    --radius:14px; --h:36px; --pad:8px 10px;
    --btn-start:#d9c7a3; --btn-start-t:#503a0a; /* 米金 */
    --btn-stop:#e5e2d9; --btn-stop-t:#4b5563;   /* 大地灰 */
    --btn-close:#0b0b0b; --btn-close-t:#fff;    /* 黑 */
  }
  #${PANEL_ID}{
    position:fixed; right:14px; top:68px; z-index:2147483000; width:300px;
    background:var(--ivory); color:var(--ink); border-radius:var(--radius);
    border:1px solid var(--stroke); box-shadow:var(--shadow);
    font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans TC","Helvetica Neue",Arial;
    user-select:none
  }
  /* 抬頭列 */
  #${PANEL_ID} .hdr{
    display:flex; align-items:center; gap:8px; padding:10px 12px;
    background:var(--blue); color:#fff; border-radius:var(--radius) var(--radius) 0 0; cursor:move
  }
  #${PANEL_ID} .ttl{font-weight:800; font-size:16px}
  #${PANEL_ID} .min{
    margin-left:auto; background:#ffffff22; border:1px solid #ffffff55; color:#fff;
    border-radius:10px; padding:6px 10px; cursor:pointer
  }
  #${PANEL_ID} .min:hover{background:#ffffff33}
  #${PANEL_ID} .box{padding:10px; background:var(--ivory); border-radius:0 0 var(--radius) var(--radius)}
  #${PANEL_ID} label{display:block; margin:6px 0 4px; color:var(--muted); font-size:12px}

  /* 控件 */
  #${PANEL_ID} input,#${PANEL_ID} select,#${PANEL_ID} textarea{
    width:100%; box-sizing:border-box; min-height:var(--h); padding:var(--pad);
    border-radius:12px; border:1px solid var(--stroke); background:var(--card); color:var(--ink);
    outline:none; transition:box-shadow .2s, border-color .2s
  }
  #${PANEL_ID} input:focus,#${PANEL_ID} select:focus,#${PANEL_ID} textarea:focus{
    border-color:#cfd8f2; box-shadow:0 0 0 3px rgba(61,96,194,.14)
  }
  #${PANEL_ID} .row{display:grid; grid-template-columns:1fr 1fr; gap:8px}

  /* 檢核碼 + LINE 同列（檢核碼較窄） */
  #${PANEL_ID} .topRow{
    display:grid; grid-template-columns: 1fr 120px; gap:8px; align-items:end
  }
  #${PANEL_ID} .pinWrap input{min-height:32px; padding:6px 8px}
  #${PANEL_ID} .lineBtn{
    display:inline-flex; align-items:center; justify-content:center; gap:6px; height:36px; width:100%;
    border:none; border-radius:12px; background:#fff; color:var(--blue); font-weight:800; cursor:pointer; border:1px solid var(--stroke)
  }
  #${PANEL_ID} .lineBtn:hover{background:#f3f6ff}
  #${PANEL_ID} .lineBtn svg{width:16px; height:16px}

  /* 三鍵 */
  #${PANEL_ID} .btns{display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin:10px 0 8px}
  #${PANEL_ID} .btn{border:none; border-radius:12px; padding:10px 6px; font-weight:900; letter-spacing:.2px; cursor:pointer; transition:transform .04s,filter .2s}
  #${PANEL_ID} .btn:active{transform:translateY(1px)}
  #${PANEL_ID} .start{background:var(--btn-start); color:var(--btn-start-t)}
  #${PANEL_ID} .stop{background:var(--btn-stop); color:var(--btn-stop-t)}
  #${PANEL_ID} .close{background:var(--btn-close); color:var(--btn-close-t)}
  #${PANEL_ID} .start:hover{filter:brightness(1.03)} #${PANEL_ID} .stop:hover{filter:brightness(1.02)} #${PANEL_ID} .close:hover{filter:brightness(1.05)}

  /* 回報區（白底深灰） */
  #${PANEL_ID} .log{
    height:120px; overflow:auto; background:#fff; border:1px solid var(--stroke);
    border-radius:12px; padding:8px 10px; margin:8px 0 12px;
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; white-space:pre-wrap; color:#374151
  }

  /* 時間/提示 */
  #${PANEL_ID} .now{margin-top:6px; color:#3d60c2; font-size:12px}
  #${PANEL_ID} .ready{margin-top:4px; color:#6b7280; font-size:12px}

  /* DEV 區塊 */
  #${PANEL_ID} details{margin-top:8px}
  #${PANEL_ID} summary{cursor:pointer; color:#3d60c2}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // ====== DOM ======
  const wrap=document.createElement('div'); wrap.id=PANEL_ID;
  wrap.innerHTML=`
    <div class="hdr" id="dragHdr">
      <div class="ttl">刪文助手 v1.8</div>
      <button class="min" id="minBtn">最小化</button>
    </div>
    <div class="box" id="bodyBox">

      <div class="topRow">
        <div class="pinWrap">
          <label>檢核碼（可留空；測試）</label>
          <input id="passcode" placeholder="可留空">
        </div>
        <div>
          <label style="visibility:hidden">LINE</label>
          <button class="lineBtn" id="openLine" title="加入 LINE 官方">
            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M24 6C13.5 6 5 13.2 5 22c0 6 3.8 11.2 9.6 13.9-.1.9-.9 5.8-.9 6.2 0 0-.1.2.1.3.1.1.2 0 .2 0 .3-.1 6.1-4 7-4.6.9.1 1.8.2 2.8.2 10.5 0 19-7.2 19-16S34.5 6 24 6Z"/>
            </svg>
            LINE官方
          </button>
        </div>
      </div>

      <label>模式</label>
      <select id="mode">
        <option value="group">社團刪文</option>
        <option value="shop">商城刪文</option>
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

      <div class="btns">
        <button class="btn start" id="start">開始</button>
        <button class="btn stop" id="stop">停止</button>
        <button class="btn close" id="close">關閉</button>
      </div>

      <div class="log" id="log"></div>
      <div class="ready">DEV 備援不主動提供</div>

      <!-- DEV 備援：預設隱藏；只有 DEBUG 才顯示 -->
      <details id="devBox" style="display:none;">
        <summary>DEV 模式：手動貼上核心（Render 未部署時）</summary>
        <div class="hint" style="font-size:12px;color:#6b7280;margin:6px 0">請將 <b>real-core.js</b> 全文貼在下面，再按「注入並開始」。只在本機執行，不會上傳。</div>
        <textarea id="devCore" placeholder="// 貼上 real-core.js 內容…"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn close" id="devInject">注入並開始</button>
        </div>
      </details>

    </div>
  `;
  document.body.appendChild(wrap);

  // ====== helpers ======
  const $=s=>wrap.querySelector(s);
  const logBox=$('#log');
  const log=(...a)=>{ logBox.textContent+=a.join(' ')+'\n'; logBox.scrollTop=logBox.scrollHeight; };

  const pad=n=>String(n).padStart(2,'0');
  function tick(){
    const d=new Date();
    $('#nowTime').textContent=`現在時間：${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  tick(); const clock=setInterval(tick,1000);

  // DEBUG（隱藏 DEV）
  let DEBUG=false;
  function setDebug(on){
    DEBUG=!!on;
    try{ localStorage.setItem('FBDEL_DEBUG', DEBUG?'1':'0'); }catch{}
    const box=$('#devBox');
    if(box) box.style.display = DEBUG ? 'block' : 'none';
    if(DEBUG) log('🔧 DEBUG = ON'); else log('🔧 DEBUG = OFF');
  }
  try{ if(localStorage.getItem('FBDEL_DEBUG')==='1') setDebug(true); }catch{}

  // 最小化 / 關閉 / LINE
  $('#minBtn').onclick=()=>{
    const b=$('#bodyBox');
    const hide=b.style.display!=='none';
    b.style.display=hide?'none':'block';
    $('#minBtn').textContent=hide?'展開':'最小化';
  };
  $('#close').onclick=()=>{ try{clearInterval(clock);}catch{} wrap.remove(); };
  $('#openLine').onclick=()=>{
    try{ window.location.href='line://ti/p/@791gqyyp'; }
    catch{ window.open('https://line.me/R/ti/p/@791gqyyp','_blank'); }
  };

  // 可拖曳（桌機/手機）
  (function enableDrag(){
    const hdr=$('#dragHdr'); let sx=0,sy=0,ox=0,oy=0,dragging=false;
    hdr.addEventListener('pointerdown',e=>{
      if(e.target.closest('button')) return;
      dragging=true; hdr.setPointerCapture(e.pointerId);
      sx=e.clientX; sy=e.clientY; const r=wrap.getBoundingClientRect(); ox=r.left; oy=r.top; e.preventDefault();
    });
    hdr.addEventListener('pointermove',e=>{
      if(!dragging) return;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      wrap.style.left=Math.max(0,ox+dx)+'px';
      wrap.style.top=Math.max(0,oy+dy)+'px';
      wrap.style.right='auto'; wrap.style.bottom='auto'; wrap.style.position='fixed';
    });
    const end=()=>{ dragging=false; };
    hdr.addEventListener('pointerup',end); hdr.addEventListener('pointercancel',end);
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
    if(m==='shop'){
      $('#nameLabel').textContent='商品關鍵字（多個用逗號 / 空白 / 換行）';
      $('#name').placeholder='例：潭子 好市多 三房';
    }else{
      $('#nameLabel').textContent='你的名字';
      $('#name').placeholder='與貼文顯示一致的名稱';
    }
  }
  $('#mode').addEventListener('change',updateModeUI); updateModeUI();

  // ---- 注入核心 ----
  function injectCoreCode(code){
    return new Promise((res,rej)=>{
      try{
        const blob=new Blob([code],{type:'text/javascript'});
        const u=URL.createObjectURL(blob);
        const s=document.createElement('script');
        s.src=u;
        s.onload=()=>{
          URL.revokeObjectURL(u);
          const coreFn =
            window.FB_DELETE_CORE ||
            (window.FBDelCore && typeof window.FBDelCore.start==='function'
              ? (opts)=>window.FBDelCore.start(opts) : null);
          if(!coreFn) return rej(new Error('核心格式不正確'));
          res(coreFn);
        };
        s.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('Blob 腳本載入失敗')); };
        document.head.appendChild(s);
      }catch(e){ rej(e); }
    });
  }

  async function fetchCoreDirect(passcode){
    const c=(passcode&&passcode.trim())?passcode.trim():'M0-DUMMY';
    const url=CORE_API_BASE+encodeURIComponent(c);
    const r=await fetch(url,{cache:'no-store',mode:'cors',credentials:'omit'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const data=await r.json();
    if(!data||!data.code) throw new Error(data.message||'no code');
    return await injectCoreCode(data.code);
  }

  // ---- 執行核心 ----
  async function runCore(coreFn){
    const mode=$('#mode').value;
    const raw=$('#name').value.trim();
    const cutoff=$('#cutoff').value ? new Date($('#cutoff').value+'T23:59:59') : null;
    if(!raw){ alert(mode==='shop'?'請先輸入商品關鍵字':'請先輸入你的名字'); return; }

    const opts={
      mode,
      myName:(mode==='group')?raw:undefined,
      shopKeywords:(mode==='shop')?raw.split(/[\s,，]+/).map(s=>s.trim()).filter(Boolean):undefined,
      maxDelete:Math.max(1,+$('#limit').value||10),
      maxScrollRounds:Math.max(1,+$('#scrolls').value||3),
      delayMin:Math.max(200,+$('#dmin').value||1000),
      delayMax:Math.max(+$('#dmax').value||2000, +$('#dmin').value||1000),
      cutoff,
      onLog: (msg)=>log(msg),
      shouldAbort: ()=>abortFlag,
      logMode:'simple',
      consoleEcho:false
    };

    log('🚀 開始');
    try{
      await coreFn(opts);
      log('🟢 完成');
    }catch(e){
      log('⛔ 跳過：執行錯誤（',e.message,'）');
    }
  }

  // ---- 用 popup / iframe 載入核心；最後直取後援 ----
  async function loadCoreViaPopup(passcode){
    const codeForLoader=(passcode&&passcode.trim())?passcode.trim():'M0-DUMMY';
    const url=LOADER_URL_BASE+'?c='+encodeURIComponent(codeForLoader);
    const ORIGIN=ALLOWED_ORIGIN;
    const POPUP_TIMEOUT=45000, IFRAME_TIMEOUT=45000;

    return new Promise((resolve,reject)=>{
      let done=false, w=null, ifr=null, timers=[];
      const cleanup=()=>{
        window.removeEventListener('message',onMsg);
        timers.forEach(t=>clearTimeout(t));
        try{ w&&w.close(); }catch{}
        if(ifr&&ifr.parentNode) try{ ifr.parentNode.removeChild(ifr);}catch{}
      };
      function onMsg(ev){
        // 允許你的 GitHub Pages 網域（含子路徑）
        const okOrigin =
          ev.origin === ORIGIN ||
          /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(new URL(ev.origin).host);
        if(!okOrigin) return;
        const data=ev.data||{};
        if(data.type==='FB_CORE_CODE'){
          done=true; cleanup();
          injectCoreCode(data.code).then(resolve).catch(reject);
        }else if(data.type==='FB_CORE_ERROR'){
          done=true; cleanup(); reject(new Error(data.message||'Loader 回報錯誤'));
        }
      }
      window.addEventListener('message',onMsg);

      // 1) 先試 popup
      w=window.open(url,'_blank','width=520,height=420');
      if(!w){
        timers.push(setTimeout(spawnIframe,0));
      }else{
        timers.push(setTimeout(()=>{ if(!done) spawnIframe(); }, POPUP_TIMEOUT));
      }

      // 2) 後援 iframe
      function spawnIframe(){
        if(done) return;
        ifr=document.createElement('iframe'); ifr.src=url; ifr.style.cssText='display:none;width:0;height:0;border:0';
        document.documentElement.appendChild(ifr);
        timers.push(setTimeout(async()=>{
          if(done) return;
          cleanup();
          try{
            const coreFn=await fetchCoreDirect(passcode);
            done=true; resolve(coreFn);
          }catch(e){
            reject(new Error('載入逾時'));
          }
        }, IFRAME_TIMEOUT));
      }
    });
  }

  // 🔘 Start（先 loader；失敗→若 DEBUG 再顯示 DEV 區塊）
  $('#start').onclick=async()=>{
    abortFlag=false;
    const passcode=$('#passcode').value.trim();

    if(/^dev$/i.test(passcode)){ setDebug(true); log('🔧 已開啟 DEV 模式'); }

    try{
      const core=await loadCoreViaPopup(passcode);
      await runCore(core);
      return;
    }catch(e){
      log('⛔ 核心未載入（', e.message, '）');
      if(DEBUG){
        const box=$('#devBox'); box.style.display='block';
        try{ box.open=true; }catch{}
        $('#devCore').focus();
        log('🔧 已顯示 DEV 備援區塊');
      }else{
        log('ℹ️ 提示：需要 DEV 備援？請在檢核碼輸入 DEV 再按開始');
      }
    }
  };

  // DEV：手動貼核心 → 注入並開始
  $('#devInject').onclick=async()=>{
    const code=$('#devCore').value;
    if(!code||!code.trim()){ alert('請先貼上 core 內容'); return; }
    try{
      const core=await injectCoreCode(code);
      await runCore(core);
    }catch(e){
      log('⛔ DEV 注入失敗（', e.message, '）');
    }
  };

  // 初始 UI 調整
  updateModeUI();
  log('面板就緒：社團/商城模式 · 進度回報啟用');
})();
