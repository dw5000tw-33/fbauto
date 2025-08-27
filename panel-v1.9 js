javascript:(()=>{/* == 刪文助手 v1.9（驗證偵測＆UI精簡，含 hash 回傳） =================
- 左：檢核碼認證｜右：狀態（紅=未驗證/綠=已驗證）
- 支援從 URL 的 search 或 hash 讀取 verified/state（FB 不會吃掉 hash）
- 成功/失敗/過期回頁後會清除網址參數
============================================================================= */
const BASE='https://verify-web.onrender.com';
const VERIFY_PAGE = BASE + '/web/verify';
const VERIFY_STATUS = BASE + '/api/verify/status';
const CORE_URL = BASE + '/api/core';
const PANEL_ID='fb_del_flagship_panel_v19';

// 清理舊面板
(['fb_del_flagship_panel_v14','fb_del_flagship_panel_v15','fb_del_flagship_panel_v16','fb_del_flagship_panel_v16m0','fb_del_flagship_panel_v18',PANEL_ID]).forEach(id=>{const el=document.getElementById(id);if(el)try{el.remove();}catch{}});

// CSS
const css=`
#${PANEL_ID}{position:fixed;right:14px;top:68px;z-index:2147483000;width:320px;background:#0B1220;color:#E5E7EB;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.35);font:14px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans TC","Helvetica Neue",Arial;border:1px solid #192233;user-select:none}
#${PANEL_ID} .hdr{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #182133;cursor:move}
#${PANEL_ID} .ttl{font-weight:700;font-size:16px}
#${PANEL_ID} .min{margin-left:auto;background:#0b1220;border:1px solid #243041;color:#9ca3af;border-radius:8px;padding:4px 8px;cursor:pointer;user-select:none}
#${PANEL_ID} .box{padding:10px 12px 12px}
#${PANEL_ID} .topRow{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center}
#${PANEL_ID} .btnPrimary{height:40px;border:none;border-radius:10px;background:#2563eb;color:#fff;cursor:pointer;font-weight:700}
#${PANEL_ID} .statusBox{height:40px;display:flex;align-items:center;justify-content:center;padding:0 10px;border:1px solid #243041;border-radius:10px;background:#0b1220}
#${PANEL_ID} .s-ok{color:#10b981;font-weight:700}
#${PANEL_ID} .s-bad{color:#ef4444;font-weight:700}
#${PANEL_ID} label{display:block;margin:8px 0 4px;color:#9fb0c3;font-size:12px}
#${PANEL_ID} input,#${PANEL_ID} select{width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid #374151;background:#111827;color:#E5E7EB;outline:none}
#${PANEL_ID} .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#${PANEL_ID} .btns{display:grid;grid-template-columns:1fr 1fr 100px;gap:10px;margin:12px 0 8px}
#${PANEL_ID} .btn{border:none;border-radius:10px;padding:10px;cursor:pointer;font-weight:700}
#${PANEL_ID} .green{background:#10b981;color:#062a22}
#${PANEL_ID} .yellow{background:#f59e0b;color:#1f2937}
#${PANEL_ID} .dark{background:#1f2937;color:#cbd5e1}
#${PANEL_ID} .log{height:110px;overflow:auto;background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:8px 10px;margin:8px 0 12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:pre-wrap}
#${PANEL_ID} .hint{font-size:12px;color:#9fb0c3;margin-top:6px}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

// UI
const wrap=document.createElement('div');wrap.id=PANEL_ID;wrap.innerHTML=`
  <div class="hdr" id="dragHdr"><div class="ttl">刪文助手 v1.9</div><button class="min" id="minBtn">最小化</button></div>
  <div class="box" id="bodyBox">
    <div class="topRow">
      <button class="btnPrimary" id="verifyBtn">檢核碼認證</button>
      <div class="statusBox"><span id="verifyStateTxt" class="s-bad">未驗證</span></div>
    </div>
    <div class="hint" id="hintTxt">就緒：按下檢核碼認證鈕完成驗證</div>

    <label>模式</label>
    <select id="mode"><option value="group">社團貼文</option><option value="shop">商城貼文</option></select>
    <label id="nameLabel">你的名字</label>
    <input id="name" placeholder="與貼文顯示一致的名稱">
    <div class="row"><div><label>每輪上限</label><input id="limit" type="number" min="1" value="10"></div><div><label>捲動次數</label><input id="scrolls" type="number" min="1" value="3"></div></div>
    <div class="row"><div><label>延遲(ms)・min</label><input id="dmin" type="number" min="200" value="1000"></div><div><label>延遲(ms)・max</label><input id="dmax" type="number" min="300" value="2000"></div></div>
    <label>僅刪除此日期以前</label><input id="cutoff" type="date" placeholder="年 / 月 / 日">
    <div class="btns"><button class="btn green" id="start">開始</button><button class="btn yellow" id="stop">停止</button><button class="btn dark" id="close">關閉</button></div>
    <div class="log" id="log"></div>
    <details id="devBox" style="display:none;"><summary>DEV：手動貼核心（主機不可用）</summary>
      <textarea id="devCore" placeholder="// 貼上 real-core.js 內容…"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn dark" id="devInject">注入並開始</button></div>
    </details>
  </div>`;
document.body.appendChild(wrap);

// helpers
const $=s=>wrap.querySelector(s);
const logBox=$('#log');
const log=(...a)=>{logBox.textContent+=a.join(' ')+'\n';logBox.scrollTop=logBox.scrollHeight;};

// 驗證狀態
let verify={state:'',verified:false,pollTimer:0};
try{const saved=localStorage.getItem('FBDEL_STATE'); if(saved) verify.state=saved;}catch{}
function saveState(){try{localStorage.setItem('FBDEL_STATE',verify.state||'');}catch{}}
function setVerifyUI(ok){const el=$('#verifyStateTxt');el.textContent=ok?'已驗證':'未驗證';el.className=ok?'s-ok':'s-bad';}
async function pollVerifyOnce(){
  if(!verify.state) return false;
  try{
    const r = await fetch(`${VERIFY_STATUS}?state=${encodeURIComponent(verify.state)}&t=${Date.now()}`, {cache:'no-store'});
    const j = await r.json();
    const ok = !!(j && j.verified);
    verify.verified = ok; setVerifyUI(ok);
    if(ok){ clearInterval(verify.pollTimer); verify.pollTimer=0; log('✅ 檢核碼已驗證'); }
    return ok;
  }catch{ return false; }
}
function startPolling(ms=1200){ if(verify.pollTimer) clearInterval(verify.pollTimer); verify.pollTimer=setInterval(pollVerifyOnce, ms); }

// 回頁偵測（同時讀 query 與 hash），IIFE 立即執行！別改成函式宣告
(function initFromUrl(){
  const getFrom = sp => ({ v: sp.get('verified'), st: sp.get('state'), reason: sp.get('reason') });

  const q1 = getFrom(new URLSearchParams(location.search));
  const h1 = getFrom(new URLSearchParams((location.hash || '').replace(/^#/, '')));
  const v = (h1.v ?? q1.v);            // '1'|'0'|null
  const st = (h1.st ?? q1.st) || '';   // state
  const reason = (h1.reason ?? q1.reason);

  if (st) { verify.state = st; saveState(); }

  if (v === '1') {
    verify.verified = true; setVerifyUI(true);
  } else if (v === '0') {
    verify.verified = false; setVerifyUI(false);
    try{ localStorage.removeItem('FBDEL_STATE'); }catch{}
    verify.state='';
    if (reason==='expired') log('⏳ 驗證碼已過期，請重新按「檢核碼認證」取得新的驗證票');
    else log('❌ 驗證未通過（reason='+(reason||'unknown')+'）');
  }

  // 清掉網址上的 query 與 hash（讓畫面回乾淨）
  if (v === '1' || v === '0') {
    try{ history.replaceState(null,'',location.origin+location.pathname); }catch{}
  }

  // 有 state 但尚未成功 → 開始輪詢
  if (verify.state && !verify.verified) { startPolling(1000); pollVerifyOnce(); }
})();

// 檢核碼認證：back 帶完整目前 URL（含 query/hash）→ verify 頁再用 hash 回傳結果
$('#verifyBtn').onclick=()=>{
  if(!verify.state){
    verify.state=(crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
    saveState();
  }
  const back = location.href;
  const url  = `${VERIFY_PAGE}?state=${encodeURIComponent(verify.state)}&back=${encodeURIComponent(back)}`;
  window.open(url,'_blank','noopener');
  setVerifyUI(false);
  log('🔐 已開啟核實頁，完成後回來本頁會自動偵測');
};

// 其他 UI
$('#minBtn').onclick=()=>{const b=$('#bodyBox');const hide=b.style.display!=='none';b.style.display=hide?'none':'block';$('#minBtn').textContent=hide?'展開':'最小化';};
$('#close').onclick=()=>{wrap.remove();};
let abortFlag=false;$('#stop').onclick=()=>{abortFlag=true;log('🟠 已要求停止');};
function updateModeUI(){const m=$('#mode').value;if(m==='shop'){$('#nameLabel').textContent='商品關鍵字（逗號/空白/換行）';$('#name').placeholder='例：潭子 好市多 三房';}else{$('#nameLabel').textContent='你的名字';$('#name').placeholder='與貼文顯示一致的名稱';}}
$('#mode').addEventListener('change',updateModeUI);updateModeUI();

// core 注入/執行
function injectCoreCode(code){return new Promise((res,rej)=>{try{const blob=new Blob([code],{type:'text/javascript'});const u=URL.createObjectURL(blob);const s=document.createElement('script');s.src=u;s.onload=()=>{URL.revokeObjectURL(u);const coreFn=window.FB_DELETE_CORE||(window.FBDelCore&&typeof window.FBDelCore.start==='function'?(opts)=>window.FBDelCore.start(opts):null);if(!coreFn)return rej(new Error('核心格式不正確'));res(coreFn);};s.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Blob 腳本載入失敗'));};document.head.appendChild(s);}catch(e){rej(e);}});}
async function fetchCoreAfterVerified(){const r=await fetch(CORE_URL,{cache:'no-store',mode:'cors',credentials:'omit'});if(!r.ok)throw new Error('核心伺服器連線失敗：HTTP '+r.status);const data=await r.json();if(!data||!data.code)throw new Error('伺服器未回核心程式');return await injectCoreCode(data.code);}
async function runCore(coreFn){const mode=$('#mode').value;const raw=$('#name').value.trim();const cutoff=$('#cutoff').value?new Date($('#cutoff').value+'T23:59:59'):null;if(!raw){alert(mode==='shop'?'請先輸入商品關鍵字':'請先輸入你的名字');return;}const opts={mode,myName:(mode==='group')?raw:undefined,shopKeywords:(mode==='shop')?raw.split(/[\s,，]+/).map(s=>s.trim()).filter(Boolean):undefined,maxDelete:Math.max(1,+$('#limit').value||10),maxScrollRounds:Math.max(1,+$('#scrolls').value||3),delayMin:Math.max(200,+$('#dmin').value||1000),delayMax:Math.max(+$('#dmax').value||2000,+$('#dmin').value||1000),cutoff,onLog:msg=>log(msg),shouldAbort:()=>abortFlag,logMode:'simple',consoleEcho:false};log('開始');try{await coreFn(opts);}catch(e){log('⛔ 跳過：執行錯誤（',e.message,'）');}}
$('#start').onclick=async()=>{abortFlag=false;try{if(!verify.verified){alert('請先完成「檢核碼認證」再按開始');$('#verifyBtn').focus();return;}const core=await fetchCoreAfterVerified();await runCore(core);}catch(e){log('⛔ 跳過：取核心/執行失敗（',e.message,'）');}};
$('#devInject').onclick=async()=>{const code=$('#devCore').value;if(!code||!code.trim()){alert('請先貼上 core 內容');return;}try{const core=await injectCoreCode(code);await runCore(core);}catch(e){log('⛔ 跳過：DEV 注入失敗（',e.message,'）');}};

log('面板 v1.9 就緒：左鍵做驗證 → 右框看狀態（紅/綠）→ 按開始');
})();
