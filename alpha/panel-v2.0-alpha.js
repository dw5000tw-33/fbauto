(()=>{'use strict';const PANEL_ID='fb-ad-manager-alpha-v20';if(document.getElementById(PANEL_ID))return;const ORIGIN='https://dw5000tw-33.github.io',API='https://fb-ad-manager-api.onrender.com',root=document.createElement('section');root.id=PANEL_ID;root.innerHTML=`<style>#fb-ad-manager-alpha-v20{position:fixed;right:18px;top:76px;width:min(390px,calc(100vw - 28px));z-index:2147483647;color:#eaf2ff;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}#fb-ad-manager-alpha-v20 *{box-sizing:border-box}#fb-ad-manager-alpha-v20 .box{background:linear-gradient(150deg,#101d39,#0b1223);border:1px solid #2c4a7c;border-radius:18px;box-shadow:0 22px 60px rgba(0,0,0,.42);overflow:hidden}#fb-ad-manager-alpha-v20 header{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:linear-gradient(90deg,#1d4ed8,#0e7490);cursor:grab;user-select:none;touch-action:none}#fb-ad-manager-alpha-v20 header:active{cursor:grabbing}#fb-ad-manager-alpha-v20 h1{font-size:17px;margin:0}#fb-ad-manager-alpha-v20 .tag{font-size:11px;color:#bae6fd;background:#0c4a6e;padding:4px 7px;border-radius:999px}#fb-ad-manager-alpha-v20 button{font:inherit;cursor:pointer;border:0;border-radius:10px}#fb-ad-manager-alpha-v20 .close{background:transparent;color:#fff;font-size:22px}#fb-ad-manager-alpha-v20 main{padding:16px 18px 18px}#fb-ad-manager-alpha-v20 p{margin:0;color:#b9c8e3;font-size:13px;line-height:1.55}#fb-ad-manager-alpha-v20 .verify{margin:14px 0 16px;padding:13px;background:#101f38;border:1px solid #31517e;border-radius:13px}#fb-ad-manager-alpha-v20 label{display:block;font-size:13px;font-weight:700;margin-bottom:8px}#fb-ad-manager-alpha-v20 .row{display:flex;gap:8px}#fb-ad-manager-alpha-v20 input{min-width:0;flex:1;padding:11px;border:1px solid #4a6695;border-radius:9px;background:#08101f;color:#fff;font-size:15px}#fb-ad-manager-alpha-v20 .primary{padding:0 13px;background:#38bdf8;color:#06203a;font-weight:800}#fb-ad-manager-alpha-v20 .status{margin-top:9px;font-size:12px;color:#9fb4d2;min-height:18px}#fb-ad-manager-alpha-v20 .ok{color:#86efac}#fb-ad-manager-alpha-v20 .bad{color:#fca5a5}#fb-ad-manager-alpha-v20 .cards{display:grid;grid-template-columns:1fr 1fr;gap:9px}#fb-ad-manager-alpha-v20 .card{min-height:88px;padding:12px;border:1px solid #263d64;border-radius:12px;background:#0c172b;opacity:.62}#fb-ad-manager-alpha-v20 .card.action{cursor:pointer}#fb-ad-manager-alpha-v20 .card.action:hover{border-color:#38bdf8}#fb-ad-manager-alpha-v20 .tracker{margin-top:12px;padding:12px;border:1px solid #31517e;border-radius:12px;background:#091527}#fb-ad-manager-alpha-v20 .tracker[hidden]{display:none}#fb-ad-manager-alpha-v20 textarea{width:100%;min-height:62px;resize:vertical;padding:9px;border:1px solid #4a6695;border-radius:9px;background:#08101f;color:#fff;font:13px system-ui}#fb-ad-manager-alpha-v20 .tracker label{margin-top:9px}#fb-ad-manager-alpha-v20 .secondary{margin-top:9px;padding:9px 12px;background:#1d4ed8;color:#eff6ff;font-weight:700}#fb-ad-manager-alpha-v20 .results{margin-top:10px;max-height:205px;overflow:auto}#fb-ad-manager-alpha-v20 .result{padding:9px 0;border-top:1px solid #20395e;font-size:12px;color:#c9d8ef}#fb-ad-manager-alpha-v20 .result button{margin:7px 7px 0 0;padding:6px 8px;background:#164e63;color:#e0f2fe;font-size:12px}#fb-ad-manager-alpha-v20 .card b{font-size:13px;display:block;margin-bottom:6px}#fb-ad-manager-alpha-v20 .card span{font-size:12px;color:#a8b8d4}#fb-ad-manager-alpha-v20 footer{padding-top:13px;color:#8295b4;font-size:11px}</style><div class="box"><header><div><h1>33 Facebook 廣告管理助手</h1><span class="tag">v2.0-alpha · 測試面板</span></div><button class="close" aria-label="關閉">×</button></header><main><p>第一階段只驗證通行碼與建立功能入口；尚未執行任何 Facebook 自動操作。</p><div class="verify"><label for="fb-ad-alpha-code">通行碼</label><div class="row"><input id="fb-ad-alpha-code" type="password" autocomplete="one-time-code" placeholder="輸入 LINE 取得的通行碼"><button class="primary" id="fb-ad-alpha-verify">驗證</button></div><div class="status" id="fb-ad-alpha-status">尚未驗證</div></div><div class="cards"><div class="card"><b>社團整理</b><span>功能規劃中</span></div><div class="card"><b>Marketplace</b><span>功能規劃中</span></div><div class="card"><b>社團巡覽</b><span>功能規劃中</span></div><div class="card action" id="fb-ad-alpha-track-card"><b>追蹤標記</b><span>目前頁面關鍵字掃描</span></div></div><div class="tracker" id="fb-ad-alpha-tracker" hidden><label for="fb-ad-alpha-keyword">搜尋關鍵字</label><input id="fb-ad-alpha-keyword" type="text" placeholder="例如：加油打氣"><label for="fb-ad-alpha-message">要複製的留言內容（自行填寫）</label><textarea id="fb-ad-alpha-message" placeholder="預設空白；不會自動留言"></textarea><label for="fb-ad-alpha-rounds">最多滑動次數（0＝只掃目前頁面）</label><input id="fb-ad-alpha-rounds" type="number" min="0" max="50" value="5"><label><input id="fb-ad-alpha-expand" type="checkbox" style="width:auto;min-width:auto;flex:none;padding:0;margin-right:7px">掃描前展開明確的「顯示更多／留言」（測試功能）</label><button class="secondary" id="fb-ad-alpha-scan">開始掃描並滑動</button><button class="secondary" id="fb-ad-alpha-stop" hidden>停止掃描</button><button class="secondary" id="fb-ad-alpha-diagnose">找不到？取得診斷資料</button><div class="status" id="fb-ad-alpha-track-status">只掃描中央動態牆；不會送出留言。</div><div class="results" id="fb-ad-alpha-results"></div></div><footer>API：<span id="fb-ad-alpha-api">檢查中…</span></footer></main></div>`;document.documentElement.appendChild(root);const $=s=>root.querySelector(s),status=$('#fb-ad-alpha-status'),input=$('#fb-ad-alpha-code'),btn=$('#fb-ad-alpha-verify');$('.close').onclick=()=>root.remove();
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
  header.addEventListener('pointerup',endDrag);header.addEventListener('pointercancel',endDrag);fetch(API+'/api/version').then(r=>r.json()).then(d=>$('#fb-ad-alpha-api').textContent=d.version||'已連線').catch(()=>$('#fb-ad-alpha-api').textContent='暫時無法連線');const setStatus=(text,kind='')=>{status.textContent=text;status.className='status '+kind};const begin=()=>{const code=input.value.trim();if(!code){setStatus('請先輸入通行碼。','bad');input.focus();return}const nonce=crypto.getRandomValues(new Uint32Array(3)).join('-')+'-'+Date.now(),w=window.open(ORIGIN+'/fbauto/alpha/verify-loader.html?nonce='+encodeURIComponent(nonce),'fb-ad-alpha-verify','width=440,height=260');if(!w){setStatus('請允許彈出式視窗後再試。','bad');return}btn.disabled=true;setStatus('正在送出安全驗證…');const timer=setTimeout(()=>finish({ok:false,reason:'TIMEOUT'}),45000),onMessage=e=>{if(e.origin!==ORIGIN||e.source!==w||!e.data||e.data.nonce!==nonce)return;if(e.data.type==='FB_AD_ALPHA_VERIFY_READY')w.postMessage({type:'FB_AD_ALPHA_VERIFY_CODE',nonce,code},ORIGIN);if(e.data.type==='FB_AD_ALPHA_VERIFY_RESULT')finish(e.data)},finish=data=>{clearTimeout(timer);window.removeEventListener('message',onMessage);btn.disabled=false;input.value='';if(data.ok){verified=true;setStatus('✓ 通行碼驗證成功，alpha 功能入口已解鎖。','ok');root.querySelectorAll('.card').forEach(x=>x.style.opacity='1')}else{const words={CODE_REQUIRED:'請輸入通行碼。',CODE_NOT_FOUND:'找不到此通行碼。',NETWORK_ERROR:'驗證服務暫時無法連線。',TIMEOUT:'驗證逾時，請再試一次。'};setStatus(words[data.reason]||'驗證未通過，請確認通行碼。','bad')}};window.addEventListener('message',onMessage)};btn.onclick=begin;input.addEventListener('keydown',e=>{if(e.key==='Enter')begin()});
let verified=false;
const trackCard=$('#fb-ad-alpha-track-card'),tracker=$('#fb-ad-alpha-tracker'),keyword=$('#fb-ad-alpha-keyword'),message=$('#fb-ad-alpha-message'),rounds=$('#fb-ad-alpha-rounds'),expand=$('#fb-ad-alpha-expand'),scanBtn=$('#fb-ad-alpha-scan'),stopBtn=$('#fb-ad-alpha-stop'),diagnoseBtn=$('#fb-ad-alpha-diagnose'),trackStatus=$('#fb-ad-alpha-track-status'),results=$('#fb-ad-alpha-results');
const setTrack=(text,kind='')=>{trackStatus.textContent=text;trackStatus.className='status '+kind};
trackCard.onclick=()=>{if(!verified){setStatus('請先完成通行碼驗證，再使用追蹤標記。','bad');return}tracker.hidden=!tracker.hidden;if(!tracker.hidden)keyword.focus()};
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
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const waitForPageToSettle=async()=>{let last=window.scrollY,stable=0;for(let tick=0;tick<32;tick++){await sleep(250);const now=window.scrollY;stable=Math.abs(now-last)<2?stable+1:0;last=now;if(stable>=3)break}await sleep(700)};
let stopRequested=false;
const handled=new Set();
const parseTerms=value=>[...new Set(value.split(/[，,\n;；]+/).map(x=>x.trim()).filter(Boolean))].slice(0,12);
const visible=el=>{const box=el.getBoundingClientRect();return box.width>0&&box.height>0&&getComputedStyle(el).visibility!=='hidden'};
const inFeed=el=>{if(el.closest?.('nav,aside,[role="navigation"],[role="complementary"]'))return false;return Boolean(el.closest?.('[role="main"]'))};
const closestPost=node=>{let cur=node;while(cur&&cur!==document.body){if(cur.matches?.('article,[role="article"],[data-pagelet^="FeedUnit_"]')||cur.hasAttribute?.('aria-posinset'))return cur;cur=cur.parentElement}return node};
const keyOf=text=>String(text||'').replace(/\s+/g,' ').trim().slice(0,240);
const expandVisible=async()=>{
 if(!expand.checked)return;
 const names=['顯示更多','更多留言','查看先前留言','顯示更多留言','顯示更多回覆'];
 let clicks=0;
 for(const el of document.querySelectorAll('[role="button"],button')){
   if(clicks>=12||root.contains(el)||!visible(el)||!inFeed(el))continue;
   const label=String(el.getAttribute('aria-label')||el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
   if(!names.some(name=>label===name||label.startsWith(name)))continue;
   try{el.click();clicks++}catch{}
 }
 if(clicks)await sleep(650);
};
const findMatches=terms=>{
 const seen=new Set(),found=[];
 const add=(el,text)=>{const clean=String(text||'').replace(/\s+/g,' ').trim(),key=keyOf(clean),matched=terms.filter(term=>clean.includes(term));if(!matched.length||seen.has(key)||handled.has(key))return;seen.add(key);found.push({el,text:clean,key,matched})};
 for(const el of document.querySelectorAll('article,[role="article"],[data-pagelet^="FeedUnit_"]'))if(!root.contains(el)&&visible(el)&&inFeed(el))add(el,el.innerText);
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())&&found.length<50){const raw=String(node.nodeValue||'').replace(/\s+/g,' ').trim(),holder=node.parentElement;if(!holder||root.contains(holder)||!visible(holder)||!inFeed(holder))continue;const el=closestPost(holder);add(el,el.innerText||raw)}
 return found;
};
const goNext=async item=>{
 handled.add(item.key);
 item.el.scrollIntoView({behavior:'auto',block:'start'});
 window.scrollBy(0,Math.max(360,Math.floor(window.innerHeight*.6)));
 await waitForPageToSettle();
 runScan(true);
};
const renderMatches=(matches,terms)=>{
 results.innerHTML='';
 if(!matches.length){setTrack('掃描完成，沒有找到：'+terms.join('、'),'bad');return}
 setTrack('找到 '+matches.length+' 則候選。完成留言或略過後，按「下一則」才會繼續。','ok');
 matches.forEach((item,index)=>{
   const row=document.createElement('div');row.className='result';
   const preview=item.text.length>150?item.text.slice(0,150)+'…':item.text;
   const title=document.createElement('div');title.textContent=(index+1)+'. 命中：'+item.matched.join('／')+'｜'+preview;
   const locate=document.createElement('button');locate.textContent='定位貼文';locate.onclick=()=>{item.el.scrollIntoView({behavior:'smooth',block:'center'});item.el.style.outline='3px solid #38bdf8';setTimeout(()=>item.el.style.outline='',3500)};
   const copy=document.createElement('button');copy.textContent='複製留言';copy.onclick=async()=>{const text=message.value.trim();if(!text){setTrack('請先自行填入要複製的留言內容。','bad');message.focus();return}const ok=await copyText(text);setTrack(ok?'留言已複製；請自行貼上、送出後再按下一則。':'無法自動複製，請手動複製文字。',ok?'ok':'bad')};
   const nextBtn=document.createElement('button');nextBtn.textContent='已處理／略過，下一則';nextBtn.onclick=()=>goNext(item);
   row.append(title,locate,copy,nextBtn);results.appendChild(row);
 });
};
const runScan=async resumed=>{
 const terms=parseTerms(keyword.value);
 if(!terms.length){setTrack('請輸入至少一個關鍵字；可用逗號分隔。','bad');keyword.focus();return}
 const max=Math.min(50,Math.max(0,Number.parseInt(rounds.value,10)||0)),all=new Map();stopRequested=false;scanBtn.disabled=true;stopBtn.hidden=false;results.innerHTML='';
 for(let round=0;round<=max;round++){
   await expandVisible();
   const foundNow=findMatches(terms);foundNow.forEach(item=>all.set(item.key,item));
   setTrack('第 '+(round+1)+' 輪已搜尋：目前找到 '+all.size+' 則。','');
   if(foundNow.length){const first=foundNow[0];first.el.scrollIntoView({behavior:'auto',block:'center'});first.el.style.outline='3px solid #38bdf8';setTimeout(()=>first.el.style.outline='',3500);break}
   if(stopRequested||round===max)break;
   window.scrollBy(0,Math.max(500,Math.floor(window.innerHeight*.82)));await waitForPageToSettle();
 }
 scanBtn.disabled=false;stopBtn.hidden=true;renderMatches([...all.values()],terms);
};
scanBtn.onclick=()=>runScan(false);
stopBtn.onclick=()=>{stopRequested=true;setTrack('收到停止指令，將在本輪搜尋後結束。','')};
})();