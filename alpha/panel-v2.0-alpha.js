(()=>{'use strict';const PANEL_ID='fb-ad-manager-alpha-v20';if(document.getElementById(PANEL_ID))return;const ORIGIN='https://dw5000tw-33.github.io',API='https://fb-ad-manager-api.onrender.com',root=document.createElement('section');root.id=PANEL_ID;root.innerHTML=`<style>#fb-ad-manager-alpha-v20{position:fixed;right:18px;top:76px;width:min(390px,calc(100vw - 28px));z-index:2147483647;color:#eaf2ff;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}#fb-ad-manager-alpha-v20 *{box-sizing:border-box}#fb-ad-manager-alpha-v20 .box{background:linear-gradient(150deg,#101d39,#0b1223);border:1px solid #2c4a7c;border-radius:18px;box-shadow:0 22px 60px rgba(0,0,0,.42);overflow:hidden}#fb-ad-manager-alpha-v20 header{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:linear-gradient(90deg,#1d4ed8,#0e7490);cursor:grab;user-select:none;touch-action:none}#fb-ad-manager-alpha-v20 header:active{cursor:grabbing}#fb-ad-manager-alpha-v20 h1{font-size:17px;margin:0}#fb-ad-manager-alpha-v20 .tag{font-size:11px;color:#bae6fd;background:#0c4a6e;padding:4px 7px;border-radius:999px}#fb-ad-manager-alpha-v20 button{font:inherit;cursor:pointer;border:0;border-radius:10px}#fb-ad-manager-alpha-v20 .close{background:transparent;color:#fff;font-size:22px}#fb-ad-manager-alpha-v20 main{padding:16px 18px 18px}#fb-ad-manager-alpha-v20 p{margin:0;color:#b9c8e3;font-size:13px;line-height:1.55}#fb-ad-manager-alpha-v20 .verify{margin:14px 0 16px;padding:13px;background:#101f38;border:1px solid #31517e;border-radius:13px}#fb-ad-manager-alpha-v20 label{display:block;font-size:13px;font-weight:700;margin-bottom:8px}#fb-ad-manager-alpha-v20 .row{display:flex;gap:8px}#fb-ad-manager-alpha-v20 input{min-width:0;flex:1;padding:11px;border:1px solid #4a6695;border-radius:9px;background:#08101f;color:#fff;font-size:15px}#fb-ad-manager-alpha-v20 .primary{padding:0 13px;background:#38bdf8;color:#06203a;font-weight:800}#fb-ad-manager-alpha-v20 .status{margin-top:9px;font-size:12px;color:#9fb4d2;min-height:18px}#fb-ad-manager-alpha-v20 .ok{color:#86efac}#fb-ad-manager-alpha-v20 .bad{color:#fca5a5}#fb-ad-manager-alpha-v20 .cards{display:grid;grid-template-columns:1fr 1fr;gap:9px}#fb-ad-manager-alpha-v20 .card{min-height:88px;padding:12px;border:1px solid #263d64;border-radius:12px;background:#0c172b;opacity:.62}#fb-ad-manager-alpha-v20 .card.action{cursor:pointer}#fb-ad-manager-alpha-v20 .groups,#fb-ad-manager-alpha-v20 .marketplace{margin-top:12px;padding:12px;border:1px solid #31517e;border-radius:12px;background:#091527}#fb-ad-manager-alpha-v20 .marketplace input[type="date"],#fb-ad-manager-alpha-v20 .marketplace .date-field{flex:none;width:148px;padding:9px;font-size:14px}#fb-ad-manager-alpha-v20 .calendar{margin-top:8px;padding:9px;border:1px solid #4a6695;border-radius:10px;background:#0b1730;color:#eaf2ff}#fb-ad-manager-alpha-v20 .calendar-head{display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:800}#fb-ad-manager-alpha-v20 .calendar-head button{padding:4px 8px;background:#164e63;color:#e0f2fe}#fb-ad-manager-alpha-v20 .calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:7px}#fb-ad-manager-alpha-v20 .calendar-grid span{font-size:10px;text-align:center;color:#93a9ca;padding:3px 0}#fb-ad-manager-alpha-v20 .calendar-grid button{height:27px;padding:0;background:#122442;color:#eaf2ff;font-size:11px}.calendar-grid button.today{outline:1px solid #38bdf8}.calendar-grid button.selected{background:#2563eb;font-weight:800}#fb-ad-manager-alpha-v20 .groups[hidden],#fb-ad-manager-alpha-v20 .marketplace[hidden]{display:none}#fb-ad-manager-alpha-v20 .group-list{margin-top:10px;max-height:220px;overflow:auto;border-top:1px solid #20395e}#fb-ad-manager-alpha-v20 .group-row{display:flex;align-items:center;gap:9px;padding:12px 2px;border-bottom:1px solid #1c3153;font-size:15px}#fb-ad-manager-alpha-v20 .group-nav{display:flex;gap:7px;align-items:center;margin-top:10px;font-size:12px}#fb-ad-manager-alpha-v20 .group-nav button{padding:6px 8px;background:#164e63;color:#e0f2fe;font-size:12px}#fb-ad-manager-alpha-v20 .group-row span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#fb-ad-manager-alpha-v20 .group-row input{width:auto;min-width:auto;flex:none;padding:0}#fb-ad-manager-alpha-v20 .group-row button{padding:4px 6px;background:#3f1d2e;color:#fecdd3;font-size:11px}.fb-ad-alpha-close-dialog{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#020617cc;z-index:2}.fb-ad-alpha-close-dialog .dialog{max-width:300px;padding:18px;border:1px solid #4a6695;border-radius:14px;background:#0f1d35;color:#eaf2ff}.fb-ad-alpha-close-dialog .dialog button{margin:10px 6px 0 0;padding:8px 10px;background:#1d4ed8;color:#fff}#fb-ad-manager-alpha-v20 .card.action:hover{border-color:#38bdf8}#fb-ad-manager-alpha-v20 .tracker{margin-top:12px;padding:12px;border:1px solid #31517e;border-radius:12px;background:#091527}#fb-ad-manager-alpha-v20 .tracker[hidden]{display:none}#fb-ad-manager-alpha-v20 textarea{width:100%;min-height:62px;resize:vertical;padding:9px;border:1px solid #4a6695;border-radius:9px;background:#08101f;color:#fff;font:13px system-ui}#fb-ad-manager-alpha-v20 .tracker label{margin-top:9px}#fb-ad-manager-alpha-v20 .secondary{margin-top:9px;padding:9px 12px;background:#1d4ed8;color:#eff6ff;font-weight:700}#fb-ad-manager-alpha-v20 .results{margin-top:10px;max-height:205px;overflow:auto}#fb-ad-manager-alpha-v20 .result{padding:9px 0;border-top:1px solid #20395e;font-size:12px;color:#c9d8ef}#fb-ad-manager-alpha-v20 .result button{margin:7px 7px 0 0;padding:6px 8px;background:#164e63;color:#e0f2fe;font-size:12px}#fb-ad-manager-alpha-v20 .card b{font-size:13px;display:block;margin-bottom:6px}#fb-ad-manager-alpha-v20 .card span{font-size:12px;color:#a8b8d4}#fb-ad-manager-alpha-v20 footer{padding-top:13px;color:#8295b4;font-size:11px}</style><div class="box"><header><div><h1>33 Facebook 廣告管理助手</h1><span class="tag">v2.0-alpha · 測試面板</span></div><button class="close" aria-label="關閉">×</button></header><main><p>驗證社群授權後使用整理功能；預設僅預覽，請先核對候選與日期。</p><div class="verify"><label for="fb-ad-alpha-code">通行碼</label><div class="row"><input id="fb-ad-alpha-code" type="password" autocomplete="one-time-code" placeholder="輸入 LINE 取得的通行碼"><button class="primary" id="fb-ad-alpha-verify">驗證</button></div><div class="status" id="fb-ad-alpha-status">尚未驗證</div></div><div class="cards"><div class="card action" id="fb-ad-alpha-groups-card"><b>社團整理</b><span>建立本機社團清單</span></div><div class="card action" id="fb-ad-alpha-marketplace-card"><b>Marketplace</b><span>整理自己的商品</span></div><div class="card"><b>社團巡覽</b><span>功能規劃中</span></div><div class="card action" id="fb-ad-alpha-track-card"><b>追蹤標記</b><span>目前頁面關鍵字掃描</span></div></div><div class="marketplace" id="fb-ad-alpha-marketplace" hidden><p>請先在 Facebook「你的商品」把排序改成<strong>由舊到新</strong>。刪除只處理你的 Marketplace 商品。</p><label for="fb-ad-alpha-marketplace-keyword">商品關鍵字（多詞可用空白、逗號或換行）</label><input id="fb-ad-alpha-marketplace-keyword" type="text" placeholder="留白＝不以關鍵字篩選；例如：三房 租"><label for="fb-ad-alpha-marketplace-date">刪除在此日期（含）以前上架的商品</label><div class="row"><input id="fb-ad-alpha-marketplace-date" class="date-field" type="text" readonly placeholder="點選日期" aria-label="刪除截止日期"><button class="secondary" id="fb-ad-alpha-marketplace-today">重置</button></div><label for="fb-ad-alpha-marketplace-limit">刪除上限（逐筆處理）</label><input id="fb-ad-alpha-marketplace-limit" type="number" min="1" max="100" value="5"><button class="secondary" id="fb-ad-alpha-marketplace-delete">開始刪除</button><div class="status" id="fb-ad-alpha-marketplace-status">請填入關鍵字或截止日期後開始刪除。</div><div class="results" id="fb-ad-alpha-marketplace-results"></div></div><div class="groups" id="fb-ad-alpha-groups" hidden><p>請先開啟 Facebook「你的社團」頁面，再掃描目前可見社團；勾選後只在本次面板中保留。</p><input id="fb-ad-alpha-group-file" type="file" accept="application/json" hidden><button class="secondary" id="fb-ad-alpha-group-auto">自動掃描全部清單</button><button class="secondary" id="fb-ad-alpha-group-stop" hidden>停止收集</button><button class="secondary" id="fb-ad-alpha-group-all">全選</button><button class="secondary" id="fb-ad-alpha-group-none">全取消</button><button class="secondary" id="fb-ad-alpha-group-load">載入清單</button><button class="secondary" id="fb-ad-alpha-group-save">下載清單</button><div class="status" id="fb-ad-alpha-group-status">尚未建立社團清單。</div><div class="group-list" id="fb-ad-alpha-group-list"></div></div><div class="tracker" id="fb-ad-alpha-tracker" hidden><label for="fb-ad-alpha-keyword">搜尋關鍵字</label><input id="fb-ad-alpha-keyword" type="text" placeholder="例如：加油打氣"><label for="fb-ad-alpha-message">要複製的留言內容（自行填寫）</label><textarea id="fb-ad-alpha-message" placeholder="預設空白；不會自動留言"></textarea><label for="fb-ad-alpha-rounds">最多滑動次數（0＝只掃目前頁面）</label><input id="fb-ad-alpha-rounds" type="number" min="0" max="50" value="5"><label><input id="fb-ad-alpha-expand" type="checkbox" style="width:auto;min-width:auto;flex:none;padding:0;margin-right:7px">掃描前展開明確的「顯示更多／留言」（測試功能）</label><button class="secondary" id="fb-ad-alpha-scan">開始掃描並滑動</button><button class="secondary" id="fb-ad-alpha-stop" hidden>停止掃描</button><button class="secondary" id="fb-ad-alpha-diagnose">找不到？取得診斷資料</button><div class="status" id="fb-ad-alpha-track-status">只掃描中央動態牆；不會送出留言。</div><div class="results" id="fb-ad-alpha-results"></div></div><footer>API：<span id="fb-ad-alpha-api">檢查中…</span></footer></main></div>`;document.documentElement.appendChild(root);const $=s=>root.querySelector(s),status=$('#fb-ad-alpha-status'),input=$('#fb-ad-alpha-code'),btn=$('#fb-ad-alpha-verify');const closePanel=()=>{marketplaceStopRequested=true;stopRequested=true;groupCollectRunning=false;
  root.dispatchEvent(new Event('alpha:stop'));
  if(!groupList.length){root.dispatchEvent(new Event('alpha:dispose'));root.remove();return}
  const dialog=document.createElement('div');dialog.className='fb-ad-alpha-close-dialog';dialog.innerHTML='<div class="dialog"><b>要保存本次社團清單嗎？</b><p>下載清單檔後，下次載入即可不用重新掃 Facebook 社團。</p><button data-action="save">下載清單並關閉</button><button data-action="discard">不儲存</button><button data-action="cancel">取消</button></div>';
  dialog.addEventListener('click',event=>{const action=event.target?.dataset?.action;if(!action)return;if(action==='save')downloadGroups();if(action!=='cancel'){root.dispatchEvent(new Event('alpha:dispose'));root.remove()}else dialog.remove()});root.appendChild(dialog);
};
$('.close').onclick=closePanel;
  const header=$('header');let drag=null;
  header.addEventListener('pointerdown',event=>{
    if(event.target.closest('button'))return;
    const rect=root.getBoundingClientRect();
    drag={pointerId:event.pointerId,x:event.clientX-rect.left,y:event.clientY-rect.top};
    root.style.left=rect.left+'px';root.style.top=rect.top+'px';root.style.right='auto';
    header.setPointerCapture?.(event.pointerId);
  });
  header.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    const maxX=Math.max(0,window.innerWidth-root.offsetWidth),maxY=Math.max(0,window.innerHeight-root.offsetHeight);
    root.style.left=Math.min(maxX,Math.max(0,event.clientX-drag.x))+'px';
    root.style.top=Math.min(maxY,Math.max(0,event.clientY-drag.y))+'px';
  });
  const endDrag=event=>{if(drag&&event.pointerId===drag.pointerId)drag=null};
  header.addEventListener('pointerup',endDrag);header.addEventListener('pointercancel',endDrag);fetch(API+'/api/version').then(r=>r.json()).then(d=>$('#fb-ad-alpha-api').textContent=d.version||'已連線').catch(()=>$('#fb-ad-alpha-api').textContent='暫時無法連線');const setStatus=(text,kind='')=>{status.textContent=text;status.className='status '+kind};const begin=()=>{const code=input.value.trim();if(!code){setStatus('請先輸入通行碼。','bad');input.focus();return}const nonce=crypto.getRandomValues(new Uint32Array(3)).join('-')+'-'+Date.now(),w=window.open(ORIGIN+'/fbauto/alpha/verify-loader.html?nonce='+encodeURIComponent(nonce),'fb-ad-alpha-verify','width=440,height=260');if(!w){setStatus('請允許彈出式視窗後再試。','bad');return}btn.disabled=true;setStatus('正在送出安全驗證…');const timer=setTimeout(()=>finish({ok:false,reason:'TIMEOUT'}),45000),onMessage=e=>{if(e.origin!==ORIGIN||e.source!==w||!e.data||e.data.nonce!==nonce)return;if(e.data.type==='FB_AD_ALPHA_VERIFY_READY')w.postMessage({type:'FB_AD_ALPHA_VERIFY_CODE',nonce,code,product:'SOCIAL_PANEL'},ORIGIN);if(e.data.type==='FB_AD_ALPHA_VERIFY_RESULT')finish(e.data)},finish=data=>{clearTimeout(timer);window.removeEventListener('message',onMessage);btn.disabled=false;input.value='';if(data.ok){verified=true;root.dataset.socialVerified='1';setStatus('✓ 通行碼驗證成功，alpha 功能入口已解鎖。','ok');root.querySelectorAll('.card').forEach(x=>x.style.opacity='1')}else{verified=false;root.dataset.socialVerified='0';marketplaceStopRequested=true;const words={DEVICE_REQUIRED:'需要裝置資訊。',DEVICE_MISMATCH:'此產品已綁定其他裝置。',PRODUCT_NOT_ALLOWED:'此碼不屬於社群面板。',EXPIRED:'授權已到期。',DISABLED:'授權已停用。',CODE_REQUIRED:'請輸入通行碼。',CODE_NOT_FOUND:'找不到此通行碼。',NETWORK_ERROR:'驗證服務暫時無法連線。',TIMEOUT:'驗證逾時，請再試一次。'};setStatus(words[data.reason]||'驗證未通過，請確認通行碼。','bad')}};window.addEventListener('message',onMessage)};btn.onclick=begin;input.addEventListener('keydown',e=>{if(e.key==='Enter')begin()});
let verified=false;
const marketplaceCard=$('#fb-ad-alpha-marketplace-card'),marketplacePanel=$('#fb-ad-alpha-marketplace'),marketplaceDate=$('#fb-ad-alpha-marketplace-date'),marketplaceToday=$('#fb-ad-alpha-marketplace-today'),marketplaceKeyword=$('#fb-ad-alpha-marketplace-keyword'),marketplaceLimit=$('#fb-ad-alpha-marketplace-limit'),marketplaceDelete=$('#fb-ad-alpha-marketplace-delete'),marketplaceStatus=$('#fb-ad-alpha-marketplace-status'),marketplaceResults=$('#fb-ad-alpha-marketplace-results');let marketplaceItems=[],marketplaceAutoRunning=false;
let marketplaceStopRequested=false;const marketplaceSeen=new Set();
const marketCheck=()=>{if(marketplaceStopRequested||!root.isConnected||!verified)throw new Error('已停止')};
const marketWait=async ms=>{for(let n=ms;n>0;n-=100){marketCheck();await new Promise(r=>setTimeout(r,Math.min(100,n)))}marketCheck()};
const marketClick=el=>{marketCheck();el.click()};
const marketOptions=document.createElement('div');marketOptions.innerHTML='<label for="mp-scrolls">最多捲動次數</label><input id="mp-scrolls" type="number" min="0" max="50" value="3"><label for="mp-min">延遲下限（ms）</label><input id="mp-min" type="number" min="200" value="1000"><label for="mp-max">延遲上限（ms）</label><input id="mp-max" type="number" min="200" value="2000"><label><input id="mp-dry" type="checkbox" checked style="width:auto;flex:none">僅預覽（不刪除）</label><button id="mp-stop" class="secondary">停止</button>';
marketplaceDelete.before(marketOptions);marketOptions.querySelector('#mp-stop').onclick=()=>{marketplaceStopRequested=true;setMarketplaceStatus('已要求停止，不再點擊後續按鈕。')};

const trackCard=$('#fb-ad-alpha-track-card'),tracker=$('#fb-ad-alpha-tracker'),keyword=$('#fb-ad-alpha-keyword'),message=$('#fb-ad-alpha-message'),rounds=$('#fb-ad-alpha-rounds'),expand=$('#fb-ad-alpha-expand'),scanBtn=$('#fb-ad-alpha-scan'),stopBtn=$('#fb-ad-alpha-stop'),diagnoseBtn=$('#fb-ad-alpha-diagnose'),trackStatus=$('#fb-ad-alpha-track-status'),results=$('#fb-ad-alpha-results'),groupsCard=$('#fb-ad-alpha-groups-card'),groupsPanel=$('#fb-ad-alpha-groups'),groupFile=$('#fb-ad-alpha-group-file'),groupScan=$('#fb-ad-alpha-group-scan'),groupAuto=$('#fb-ad-alpha-group-auto'),groupStop=$('#fb-ad-alpha-group-stop'),groupAll=$('#fb-ad-alpha-group-all'),groupNone=$('#fb-ad-alpha-group-none'),groupLoad=$('#fb-ad-alpha-group-load'),groupSave=$('#fb-ad-alpha-group-save'),groupStatus=$('#fb-ad-alpha-group-status'),groupListEl=$('#fb-ad-alpha-group-list');let groupList=[],groupPage=0;
const setTrack=(text,kind='')=>{trackStatus.textContent=text;trackStatus.className='status '+kind};
const setMarketplaceStatus=(text,kind='')=>{marketplaceStatus.textContent=text;marketplaceStatus.className='status '+kind};
const marketplaceListingFromButton=button=>{
  let node=button.parentElement,best=null;
  for(let i=0;node&&node!==document.body&&i<12;i++,node=node.parentElement){
    if(root.contains(node)||!visible(node))continue;
    const text=String(node.innerText||'').replace(/\s+/g,' ').trim();
    if(text.includes('立即推廣')&&text.length<800&&node.querySelector('img'))best=node;
  }
  return best;
};
const parseListingDate=text=>{
  const match=String(text||'').match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*上架/);if(!match)return null;
  const now=new Date(),date=new Date(now.getFullYear(),Number(match[1])-1,Number(match[2]));
  // Facebook 只顯示月／日；若日期落在未來，視為上一年。
  if(date>now)date.setFullYear(now.getFullYear()-1);if(date.getMonth()!==Number(match[1])-1||date.getDate()!==Number(match[2]))return null;return date;
};
const renderMarketplace=()=>{
  marketplaceResults.innerHTML='';
  if(!marketplaceItems.length)return;
  marketplaceItems.forEach((item,index)=>{
    const row=document.createElement('div');row.className='result';
    const title=document.createElement('div');title.textContent=(index+1)+'. '+item.title+(item.dateText?'｜刊登：'+item.dateText:'｜刊登日期未辨識')+(item.eligible?'｜到期候選':'');
    const locate=document.createElement('button');locate.textContent='定位商品';locate.onclick=()=>{item.card.scrollIntoView({behavior:'smooth',block:'center'});item.card.style.outline='3px solid #38bdf8';setTimeout(()=>item.card.style.outline='',3500)};
    row.append(title,locate);marketplaceResults.appendChild(row);
  });
};
const discoverMarketplaceItems=()=>{
  const cards=new Map(),scope=document.querySelector('[role="main"]')||document.body;
  // Start from listing links instead of measuring every nested div on long feeds.
  const listingRoots=new Set();
  for(const link of scope.querySelectorAll('a[href*="/marketplace/item/"]')){
    let el=link;for(let depth=0;el&&el!==scope&&depth<7;depth++,el=el.parentElement){
      if(root.contains(el))break;
      const text=String(el.textContent||'');
      if(text.includes('立即推廣')&&text.length<900){listingRoots.add(el);break}
    }
    if(listingRoots.size>=150)break;
  }
  if(!listingRoots.size)for(const el of [...scope.querySelectorAll('section,article,[role="article"]')].slice(0,150))listingRoots.add(el);
  const candidates=[...listingRoots].filter(el=>{
    if(root.contains(el)||!visible(el))return false;
    const text=String(el.innerText||'').replace(/\s+/g,' ').trim();
    return text.includes('立即推廣')&&(text.includes('Marketplace 上架')||/NT\$\s*[\d,]+/.test(text))&&text.length>=20&&text.length<700;
  }).sort((a,b)=>String(a.innerText||'').length-String(b.innerText||'').length);
  for(const card of candidates){
    if([...cards.values()].some(item=>card.contains(item.card)))continue;
    const text=String(card.innerText||'').replace(/\s+/g,' ').trim(),key=text.slice(0,260);
    if(!cards.has(key))cards.set(key,{card,text});
  }
  return [...cards.values()].map(({card,text})=>{
    const date=parseListingDate(text),dateText=(text.match(/\d{1,2}\s*\/\s*\d{1,2}\s*上架/)||[])[0]||'';
    const title=(text.match(/^(.+?)\s*NT\$\s*[\d,]+/)||[])[1]||text.slice(0,80);
    return {card,text,title,date,dateText,eligible:false,key:title+'|'+dateText};
  });
};
const scanMarketplace=()=>{
  marketplaceItems=discoverMarketplaceItems();renderMarketplace();
  return marketplaceItems;
};
const applyMarketplaceFilters=()=>{
  const terms=parseTerms(marketplaceKeyword.value),dateValue=getMarketplaceDate(),hasDate=Boolean(dateValue);
  // 日期未選時，以今日為截止日；關鍵字留白則代表不以關鍵字限縮。
  const effectiveDate=hasDate?dateValue:formatDateValue(new Date()),cutoff=new Date(effectiveDate+'T23:59:59');
  marketplaceItems.forEach(item=>{
    const keywordMatches=!terms.length||terms.some(term=>item.text.includes(term));
    const dateMatches=Boolean(item.date&&item.date<=cutoff);
    item.eligible=Boolean(keywordMatches&&dateMatches);
  });
  return {terms,hasDate,effectiveDate,count:marketplaceItems.filter(item=>item.eligible).length};
};
const mergeMarketplaceItems=found=>{
  const known=new Map(marketplaceItems.map(item=>[item.key,item]));let added=0;
  for(const item of found){if(known.has(item.key)){known.get(item.key).card=item.card}else{marketplaceItems.push(item);known.set(item.key,item);added++}}
  return added;
};
let marketplaceCalendarMonth=null;
const formatDateValue=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
const setMarketplaceDate=value=>{marketplaceDate.value=value;marketplaceDate.dataset.selectedDate=value};
const getMarketplaceDate=()=>marketplaceDate.dataset.selectedDate||marketplaceDate.value||'';
const openMarketplaceCalendar=()=>{
  const existing=root.querySelector('.calendar');if(existing){existing.remove();return}
  const selectedValue=getMarketplaceDate(),selected=/^\d{4}-\d{2}-\d{2}$/.test(selectedValue)?new Date(selectedValue+'T12:00:00'):new Date();
  if(!marketplaceCalendarMonth)marketplaceCalendarMonth=new Date(selected.getFullYear(),selected.getMonth(),1);
  const draw=()=>{
    root.querySelector('.calendar')?.remove();
    const box=document.createElement('div');box.className='calendar';
    const names=['日','一','二','三','四','五','六'],year=marketplaceCalendarMonth.getFullYear(),month=marketplaceCalendarMonth.getMonth();
    const title=document.createElement('div');title.className='calendar-head';
    const prev=document.createElement('button');prev.textContent='‹';prev.onclick=()=>{marketplaceCalendarMonth=new Date(year,month-1,1);draw()};
    const text=document.createElement('span');text.textContent=year+' 年 '+(month+1)+' 月';
    const next=document.createElement('button');next.textContent='›';next.onclick=()=>{marketplaceCalendarMonth=new Date(year,month+1,1);draw()};
    title.append(prev,text,next);box.appendChild(title);
    const grid=document.createElement('div');grid.className='calendar-grid';
    names.forEach(name=>{const h=document.createElement('span');h.textContent=name;grid.appendChild(h)});
    const start=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate(),today=formatDateValue(new Date());
    for(let n=0;n<start;n++){const empty=document.createElement('span');grid.appendChild(empty)}
    for(let day=1;day<=days;day++){const d=new Date(year,month,day),value=formatDateValue(d),button=document.createElement('button');button.textContent=String(day);if(value===today)button.classList.add('today');if(value===getMarketplaceDate())button.classList.add('selected');button.onclick=()=>{setMarketplaceDate(value);marketplaceCalendarMonth=new Date(d.getFullYear(),d.getMonth(),1);box.remove();marketplaceDate.focus()};grid.appendChild(button)}
    box.appendChild(grid);marketplaceDate.closest('.marketplace').insertBefore(box,marketplaceStatus);
  };
  draw();
};
marketplaceDate.onclick=openMarketplaceCalendar;
marketplaceToday.onclick=()=>{marketplaceDate.value='';delete marketplaceDate.dataset.selectedDate;marketplaceCalendarMonth=null;root.querySelector('.calendar')?.remove();marketplaceDate.focus()};
const waitForVisibleText=async(text,ms=5000,scopeSelector='[role="dialog"]')=>{
  const end=Date.now()+ms;while(Date.now()<end){marketCheck();const scopes=[...document.querySelectorAll(scopeSelector)].filter(visible);const found=scopes.length===1?[...scopes[0].querySelectorAll('button,[role="button"],[role="menuitem"],[role="radio"],label')].find(el=>!root.contains(el)&&visible(el)&&String(el.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim()===text):null;if(found)return found;await marketWait(180)}return null;
};
const deleteMarketplaceItem=async item=>{
  item.card.scrollIntoView({behavior:'auto',block:'center'});await marketWait(350);
  const more=[...item.card.querySelectorAll('button,[role="button"]')].find(el=>{const label=String(el.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();return label==='⋯'||label==='...'||/更多/.test(label)});
  if(!more)throw new Error('找不到商品的更多選單');
  marketClick(more);const menuDelete=await waitForVisibleText('刪除商品',5000,'[role="menu"]');if(!menuDelete)throw new Error('找不到「刪除商品」選項');
  marketClick(menuDelete);const confirmDelete=await waitForVisibleText('刪除');if(!confirmDelete)throw new Error('找不到刪除確認按鈕');
  marketClick(confirmDelete);const skip=await waitForVisibleText('不便回答');if(!skip)throw new Error('找不到「不便回答」選項');
  marketClick(skip);const continueBtn=await waitForVisibleText('繼續');if(!continueBtn)throw new Error('找不到「繼續」按鈕');
  marketClick(continueBtn);await marketWait(900);
};
const findNextMarketplaceCandidate=async()=>{
  for(let attempt=0;attempt<=Math.min(50,Math.max(0,Number(marketOptions.querySelector('#mp-scrolls').value)||0));attempt++){marketCheck();
    scanMarketplace();const rules=applyMarketplaceFilters();const next=marketplaceItems.find(item=>item.eligible&&!marketplaceSeen.has(item.key));
    if(next)return {item:next,rules};
    if(attempt>=Math.min(50,Math.max(0,Number(marketOptions.querySelector('#mp-scrolls').value)||0)))break;
    const before=window.scrollY;window.scrollBy(0,Math.max(420,Math.floor(window.innerHeight*.78)));await marketWait(900);
    if(window.scrollY<=before+2)break;
  }
  return null;
};
marketplaceDelete.onclick=async()=>{
  if(!verified||marketplaceAutoRunning)return;
  if(!/^\/marketplace\/you\/selling(?:\/|$)/.test(location.pathname)){setMarketplaceStatus('請先開啟 Marketplace「你的商品」頁面。','bad');return;}
  const dryRun=marketOptions.querySelector('#mp-dry').checked;
  const limit=Math.min(100,Math.max(1,Number.parseInt(marketplaceLimit.value,10)||5));
  const dateText=getMarketplaceDate()||formatDateValue(new Date()),terms=parseTerms(marketplaceKeyword.value);
  const ruleText=(terms.length?'關鍵字：'+terms.join('、')+'；':'')+'截止：'+dateText+(getMarketplaceDate()?'':'（未選日期，預設今天）');
  if(!dryRun&&!window.confirm('將逐筆刪除符合條件的商品，最多 '+limit+' 筆。\n'+ruleText+'\n依設定的操作延遲逐筆處理。是否開始？'))return;
  marketplaceStopRequested=false;marketplaceSeen.clear();marketplaceAutoRunning=true;marketplaceDelete.disabled=true;let done=0;try{
  while(done<limit){marketCheck();
    const found=await findNextMarketplaceCandidate();
    if(!found){setMarketplaceStatus('找不到下一筆符合條件的商品，已停止。共刪除 '+done+' 筆。',done?'ok':'');break}
    setMarketplaceStatus((dryRun?'正在預覽第 ':'正在刪除第 ')+(done+1)+' / '+limit+' 筆：'+found.item.title,'');
    try{if(!dryRun)await deleteMarketplaceItem(found.item);marketplaceSeen.add(found.item.key);done++;if(dryRun){marketplaceResults.textContent+=String(done)+". "+found.item.title+"（預覽）\n"}}catch(error){setMarketplaceStatus('刪除流程已停止：'+(error.message||error)+'。目前已完成 '+done+' 筆。','bad');break}
    if(done<limit){const min=Math.max(200,Number(marketOptions.querySelector('#mp-min').value)||1000),max=Math.max(min,Number(marketOptions.querySelector('#mp-max').value)||2000),waitMs=min+Math.floor(Math.random()*(max-min+1));setMarketplaceStatus((dryRun?'已預覽 ':'已刪除 ')+done+' 筆，等待 '+(waitMs/1000).toFixed(1)+' 秒後繼續。','');await marketWait(waitMs)}
  }
  }catch(error){setMarketplaceStatus('流程已停止：'+error.message)}finally{marketplaceAutoRunning=false;marketplaceDelete.disabled=false;}
  if(done>=limit)setMarketplaceStatus((dryRun?'預覽完成，未刪除：':'已達刪除上限 ')+limit+' 筆。','ok');
  marketplaceItems=[];
};
marketplaceCard.onclick=()=>{if(!verified){setStatus('請先完成通行碼驗證，再使用 Marketplace。','bad');return}marketplacePanel.hidden=!marketplacePanel.hidden;if(!marketplacePanel.hidden)marketplaceKeyword.focus()};
trackCard.onclick=()=>{if(!verified){setStatus('請先完成通行碼驗證，再使用追蹤標記。','bad');return}tracker.hidden=!tracker.hidden;if(!tracker.hidden)tracker.querySelector('input')?.focus()};
const copyText=async text=>{try{await navigator.clipboard.writeText(text);return true}catch{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok}};
diagnoseBtn.onclick=async()=>{
 const word=keyword.value.trim().replace(/[，,。！？!?]+$/g,'');
 if(!word){setTrack('先輸入要診斷的關鍵字。','bad');keyword.focus();return}
 const pick=el=>({tag:el.tagName,role:el.getAttribute('role')||'',dir:el.getAttribute('dir')||'',pagelet:el.getAttribute('data-pagelet')||'',aria:el.getAttribute('aria-label')||'',className:String(el.className||'').slice(0,160),text:String(el.innerText||'').replace(/\s+/g,' ').trim().slice(0,160)});
 const isVisible=el=>{const box=el.getBoundingClientRect();return box.width>0&&box.height>0&&getComputedStyle(el).visibility!=='hidden'};const all=[...document.querySelectorAll('[role="main"] [dir="auto"],[role="feed"] [dir="auto"],article,[role="article"],[data-pagelet^="FeedUnit_"]')].filter(el=>!root.contains(el)&&isVisible(el));
 const hits=all.filter(el=>String(el.innerText||'').includes(word)).slice(0,12).map(pick);
 const report={keyword:word,location:location.href,checked:all.length,hits};
 const text=JSON.stringify(report,null,2);
 const ok=await copyText(text);
 results.innerHTML='';const row=document.createElement('div');row.className='result';row.textContent='診斷結果：檢查 '+all.length+' 個可見元素，命中 '+hits.length+' 個。'+(ok?' 已複製到剪貼簿，請直接貼回這個聊天室。':' 請手動複製下方內容。');const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.fontSize='10px';pre.textContent=text;results.append(row,pre);setTrack('診斷僅在本頁執行，不會傳送到伺服器。','ok');
};
const setGroupStatus=(text,kind='')=>{groupStatus.textContent=text;groupStatus.className='status '+kind};
const selectedGroups=()=>groupList.filter(group=>group.enabled).length;
const groupStorageKey='33works:alpha:groups:v2';
try{const saved=JSON.parse(localStorage.getItem(groupStorageKey)||'[]');if(Array.isArray(saved))groupList=saved.filter(g=>g&&/^https:\/\/www\.facebook\.com\/groups\/[^/?#]+\/$/.test(g.url)).map(g=>({name:String(g.name||g.url),url:g.url,enabled:g.enabled===true}))}catch{}
root.alphaGroups={selected:()=>groupList.filter(g=>g.enabled).map(g=>({...g}))};
root.addEventListener('alpha:stop',()=>{marketplaceStopRequested=true;stopRequested=true;groupCollectRunning=false});
const persistGroups=()=>{try{localStorage.setItem(groupStorageKey,JSON.stringify(groupList))}catch{setGroupStatus('瀏覽器儲存不可用，請下載清單備份。','bad')}};
const renderGroups=()=>{
  persistGroups();
  groupListEl.innerHTML='';
  if(!groupList.length){groupListEl.textContent='尚未掃描或載入社團。';return}
  const perPage=3,totalPages=Math.max(1,Math.ceil(groupList.length/perPage));groupPage=Math.min(groupPage,totalPages-1);
  const startAt=groupPage*perPage;
  groupList.slice(startAt,startAt+perPage).forEach((group,offset)=>{
    const index=startAt+offset,row=document.createElement('div');row.className='group-row';
    const check=document.createElement('input');check.type='checkbox';check.checked=Boolean(group.enabled);check.onchange=()=>{group.enabled=check.checked;persistGroups();setGroupStatus('已選 '+selectedGroups()+' 個社團。','ok')};
    const name=document.createElement('span');name.textContent=group.name||group.url;name.title=group.url;
    const remove=document.createElement('button');remove.textContent='移除';remove.onclick=()=>{groupList.splice(index,1);if(startAt>=groupList.length&&groupPage>0)groupPage--;renderGroups();setGroupStatus('已移除社團。','')};
    row.append(check,name,remove);groupListEl.appendChild(row);
  });
  const nav=document.createElement('div');nav.className='group-nav';
  const prev=document.createElement('button');prev.textContent='上一批';prev.disabled=groupPage===0;prev.onclick=()=>{groupPage--;renderGroups()};
  const page=document.createElement('span');page.textContent='第 '+(groupPage+1)+' / '+totalPages+' 批（每批 3 個）';
  const nextBtn=document.createElement('button');nextBtn.textContent='下一批';nextBtn.disabled=groupPage>=totalPages-1;nextBtn.onclick=()=>{groupPage++;renderGroups()};
  nav.append(prev,page,nextBtn);groupListEl.appendChild(nav);
  setGroupStatus('共 '+groupList.length+' 個社團；已選 '+selectedGroups()+' 個。','ok');
};
const downloadGroups=()=>{
  const payload={schema:'fb-ad-manager-groups-v1',createdAt:new Date().toISOString(),groups:groupList.map(({name,url,enabled})=>({name,url,enabled:Boolean(enabled)}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fb-ad-manager-groups-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
};
groupsCard.onclick=()=>{if(!verified){setStatus('請先完成通行碼驗證，再使用社團整理。','bad');return}groupsPanel.hidden=!groupsPanel.hidden;if(!groupsPanel.hidden)renderGroups()};
const groupAnchorInfo=anchor=>{
  if(root.contains(anchor)||!visible(anchor))return null;
  const rect=anchor.getBoundingClientRect();
  // Facebook 的「加入的社團」固定在左欄；排除中間動態牆與右側面板的同名連結。
  if(rect.left>Math.min(window.innerWidth*.42,360))return null;
  let url='';try{const parsed=new URL(anchor.href);const match=parsed.pathname.match(/^\/groups\/([^/?#]+)/);if(!match||['feed','discover','joins','create','your-groups'].includes(match[1]))return null;url='https://www.facebook.com/groups/'+match[1]+'/'}catch{return null}
  const name=String(anchor.innerText||anchor.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();
  return name.length>=2?{name,url,rect}:null;
};
const collectVisibleGroups=()=>{
  const found=new Map();
  for(const anchor of document.querySelectorAll('a[href*="/groups/"]')){
    const info=groupAnchorInfo(anchor);if(info)found.set(info.url,{name:info.name,url:info.url,enabled:false});
  }
  const oldByUrl=new Map(groupList.map(group=>[group.url,group]));let added=0;
  for(const group of found.values())if(!oldByUrl.has(group.url)){groupList.push(group);oldByUrl.set(group.url,group);added++}
  return {visible:found.size,added};
};
const findGroupScroller=()=>{
  const scores=new Map();
  for(const anchor of document.querySelectorAll('a[href*="/groups/"]')){
    if(!groupAnchorInfo(anchor))continue;
    let el=anchor.parentElement,depth=0;
    while(el&&el!==document.body&&depth++<14){
      const rect=el.getBoundingClientRect();
      // 深色版 Facebook 有時把 overflow 設成 hidden；只要內容高度確實超出就列入候選。
      const scrollable=el.scrollHeight>el.clientHeight+40&&rect.left<Math.min(window.innerWidth*.42,360)&&rect.width>100;
      if(scrollable){const style=getComputedStyle(el);const bonus=/(auto|scroll)/.test(style.overflowY)?20:0;scores.set(el,(scores.get(el)||0)+1+bonus)}
      el=el.parentElement;
    }
  }
  return [...scores.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
};
let groupCollectRunning=false;
if(groupScan)groupScan.onclick=()=>{
  const result=collectVisibleGroups();groupPage=0;renderGroups();
  setGroupStatus(result.visible?'掃描到 '+result.visible+' 個可見社團；新加入 '+result.added+' 個。':'沒有掃描到社團。請先前往 Facebook「社團」頁面再試。',result.visible?'ok':'bad');
};
groupAuto.onclick=async()=>{
  const scroller=findGroupScroller();
  if(!scroller){setGroupStatus('找不到左側可滑動的社團清單。請先開啟 Facebook「社團」頁面，並讓左側「加入的社團」清單至少顯示一列。','bad');return}
  groupCollectRunning=true;groupAuto.disabled=true;groupStop.hidden=false;let stagnant=0,round=0,stoppedAtBottom=false;
  while(groupCollectRunning&&round<200){
    const result=collectVisibleGroups();round++;
    if(result.added){stagnant=0;renderGroups()}else stagnant++;
    const before=scroller.scrollTop,max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    setGroupStatus('自動收集第 '+round+' 輪：共 '+groupList.length+' 個，新加入 '+result.added+' 個。','');
    if(before>=max-3||stagnant>=5){stoppedAtBottom=true;break}
    scroller.scrollTop=Math.min(max,before+Math.max(240,Math.floor(scroller.clientHeight*.72)));
    await sleep(1100);
    // 若 Facebook 尚未完成渲染，不計入「沒有新增」；避免副機較慢時過早結束。
    if(scroller.scrollTop<=before+2){await sleep(900);if(scroller.scrollTop<=before+2){stoppedAtBottom=true;break}}
  }
  groupCollectRunning=false;groupAuto.disabled=false;groupStop.hidden=true;groupPage=0;renderGroups();
  setGroupStatus((groupCollectRunning?'已停止收集':'自動收集完成')+'：共 '+groupList.length+' 個社團'+(stoppedAtBottom?'（已到左側清單底部）':'')+'。請分批確認、勾選後再下載清單。','ok');
};
groupStop.onclick=()=>{groupCollectRunning=false;setGroupStatus('已要求停止收集，將在本輪後結束。','')};
groupAll.onclick=()=>{groupList.forEach(group=>group.enabled=true);renderGroups();setGroupStatus('已全選 '+selectedGroups()+' 個社團；請逐批確認後可取消不需要的社團。','ok')};
groupNone.onclick=()=>{groupList.forEach(group=>group.enabled=false);renderGroups();setGroupStatus('已取消全部選取。','')};
groupLoad.onclick=()=>groupFile.click();
groupFile.onchange=async()=>{
  const file=groupFile.files?.[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(!Array.isArray(data.groups))throw new Error();groupList=data.groups.filter(g=>g&&typeof g.url==='string').map(g=>({name:String(g.name||g.url),url:g.url,enabled:Boolean(g.enabled)}));groupPage=0;renderGroups();setGroupStatus('已載入 '+groupList.length+' 個本機社團。','ok')}catch{setGroupStatus('清單檔格式不正確，無法載入。','bad')}finally{groupFile.value=''}
};
groupSave.onclick=()=>{if(!groupList.length){setGroupStatus('尚無社團可下載。','bad');return}downloadGroups();setGroupStatus('已下載本機清單檔。','ok')};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const visible=el=>{const box=el.getBoundingClientRect();return box.width>0&&box.height>0&&getComputedStyle(el).visibility!=='hidden'};
const waitForPageToSettle=async()=>{let last=window.scrollY,stable=0;for(let tick=0;tick<32;tick++){await sleep(250);const now=window.scrollY;stable=Math.abs(now-last)<2?stable+1:0;last=now;if(stable>=3)break}await sleep(700)};
let stopRequested=false;
const parseTerms=value=>[...new Set(value.split(/[，,\n;；]+/).map(x=>x.trim()).filter(Boolean))].slice(0,12);
// Interactive tracking is owned by facebook-patrol-v2.1-alpha.js.
})();
