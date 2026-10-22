(() => {
  'use strict';
  const root=document.getElementById('fb-ad-manager-alpha-v20');
  if(!root||root.dataset.patrolBuild)return;root.dataset.patrolBuild='2.1-alpha';
  const $=s=>root.querySelector(s),tracker=$('#fb-ad-alpha-tracker'),header=$('header');
  let epoch=0,busy=false,disposed=false,queue=[],index=-1,awaitingSend=false,itinerary=null;
  const handled=new Set(),hearted=new Set(),clean=v=>String(v||'').replace(/\s+/g,' ').trim(),storageKey='33works:alpha:patrol:v1';
  const style=document.createElement('style');style.textContent=`
#fb-ad-manager-alpha-v20{max-height:var(--alpha-height,calc(100dvh - 90px))}
#fb-ad-manager-alpha-v20 .box{display:flex;flex-direction:column;max-height:inherit}
#fb-ad-manager-alpha-v20 header{flex:none}
#fb-ad-manager-alpha-v20 main{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
#fb-ad-manager-alpha-v20.minimized main,#fb-ad-manager-alpha-v20.minimized .tag{display:none}
#fb-ad-manager-alpha-v20 .header-actions{display:flex;align-items:center;gap:4px}
#fb-ad-manager-alpha-v20 .minimize{background:transparent;color:white;font-size:22px}
#fb-ad-manager-alpha-v20 .feature-menu{display:none;background:#13558f;color:white;padding:9px;width:100%;margin:9px 0}
#fb-ad-manager-alpha-v20.feature-open .cards{display:none}
#fb-ad-manager-alpha-v20.feature-open .feature-menu{display:block}
#fb-ad-manager-alpha-v20[data-social-verified="1"].feature-open .verify label,#fb-ad-manager-alpha-v20[data-social-verified="1"].feature-open .verify .row{display:none}
#fb-ad-manager-alpha-v20[data-social-verified="1"].feature-open .verify{padding:8px;margin:8px 0}
#fb-ad-manager-alpha-v20[data-social-verified="1"].feature-open .verify .status{margin:0}
#fb-ad-manager-alpha-v20 .tracker .row{flex-wrap:wrap}
#fb-ad-manager-alpha-v20 .tracker button{padding:8px;background:#13558f;color:white}
#fb-ad-manager-alpha-v20 .hint{font-size:12px;line-height:1.6;margin:10px 0;color:#cbd9e9}
#fb-ad-manager-alpha-v20 .current{outline:2px solid #59c1ff;border-radius:8px}
#fb-ad-manager-alpha-v20 button:disabled{opacity:.45;cursor:not-allowed}`;root.append(style);
  $('.tag').textContent='v2.1-alpha · 社團巡禮';
  const actions=document.createElement('div');actions.className='header-actions';const close=$('.close'),mini=document.createElement('button');
  mini.className='minimize';mini.textContent='−';mini.setAttribute('aria-label','最小化');close.replaceWith(actions);actions.append(mini,close);
  const fit=()=>{if(disposed||!root.isConnected)return;const r=root.getBoundingClientRect(),h=window.visualViewport?.height||innerHeight,w=window.visualViewport?.width||innerWidth,top=Math.max(8,Math.min(Math.max(8,h-100),r.top));root.style.top=top+'px';root.style.setProperty('--alpha-height',Math.max(80,h-top-12)+'px');if(root.style.left)root.style.left=Math.max(8,Math.min(w-Math.min(r.width,w-16)-8,r.left))+'px';};
  mini.onclick=()=>{const small=root.classList.toggle('minimized');mini.textContent=small?'□':'−';mini.setAttribute('aria-label',small?'還原':'最小化');fit();};
  const menu=document.createElement('button');menu.className='feature-menu';menu.textContent='⌃ 顯示功能選單';$('.cards').before(menu);
  const panels=()=>[...root.querySelectorAll('.groups,.marketplace,.tracker')];
  menu.onclick=()=>{panels().forEach(p=>p.hidden=true);root.classList.remove('feature-open');stopWork();fit();};
  const cardHandler=e=>{const card=e.target.closest('.card');if(!card||root.dataset.socialVerified!=='1')return;const target=card.id==='fb-ad-alpha-track-card'||card.id==='fb-ad-alpha-patrol-card'?tracker:card.id==='fb-ad-alpha-marketplace-card'?$('#fb-ad-alpha-marketplace'):card.id==='fb-ad-alpha-groups-card'?$('#fb-ad-alpha-groups'):$('#gc-panel');if(target&&!target.hidden){panels().forEach(p=>{if(p!==target)p.hidden=true;});root.classList.add('feature-open');fit();}};
  $('.cards').addEventListener('click',cardHandler);
  const patrolCard=[...$('.cards').children].find(c=>c.textContent.includes('社團巡覽'));
  patrolCard.id='fb-ad-alpha-patrol-card';patrolCard.classList.add('action');patrolCard.innerHTML='<b>社團巡禮</b><span>選社團、逐則確認互動</span>';
  patrolCard.onclick=()=>{if(authorized()){tracker.hidden=false;renderPatrol();}};
  tracker.innerHTML=`<label for="fb-ad-alpha-keyword">搜尋關鍵字</label><input id="fb-ad-alpha-keyword" placeholder="多組以逗號或換行分隔">
<label for="fb-ad-alpha-message">預備留言</label><textarea id="fb-ad-alpha-message" placeholder="只填入原生框，由你手動送出"></textarea>
<div class="row"><button id="alpha-patrol-start">使用勾選社團建立巡禮</button><button id="alpha-patrol-current">開啟本團</button><button id="alpha-patrol-next">完成本團，下一團</button></div>
<div id="alpha-patrol-progress" class="hint"></div>
<label for="fb-ad-alpha-rounds">最多滑動次數</label><input id="fb-ad-alpha-rounds" type="number" min="0" max="50" value="5">
<label for="fb-ad-alpha-limit">候選上限</label><input id="fb-ad-alpha-limit" type="number" min="1" max="20" value="20">
<div class="hint">逐則選愛心、填入留言或略過。E填留言、S完成、D/F切換、X略過。跨頁後重新點Alpha書籤並驗證即可恢復巡禮；待貼文載入後再掃描。不會自動送出留言。</div>
<div class="row"><button id="fb-ad-alpha-scan">掃描本頁／本團</button><button id="fb-ad-alpha-stop" disabled>停止</button></div>
<div id="fb-ad-alpha-track-status" class="status">等待社團與關鍵字。</div><div id="fb-ad-alpha-results" class="results"></div>`;
  const keyword=$('#fb-ad-alpha-keyword'),message=$('#fb-ad-alpha-message'),scan=$('#fb-ad-alpha-scan'),stop=$('#fb-ad-alpha-stop'),status=$('#fb-ad-alpha-track-status'),results=$('#fb-ad-alpha-results');
  const say=(text,kind='')=>{status.textContent=text;status.className='status '+kind;};
  function authorized(){if(root.dataset.socialVerified==='1')return true;say('請先完成通行碼驗證。','bad');return false;}
  function groupId(url){try{const u=new URL(url,location.href);return u.protocol==='https:'&&/(^|\.)facebook\.com$/.test(u.hostname)?u.pathname.match(/^\/groups\/([^/?#]+)/)?.[1]||null:null;}catch{return null;}}
  function persist(){if(!itinerary)return;itinerary.keyword=keyword.value;itinerary.message=message.value;itinerary.handled=[...handled].slice(-1000);try{localStorage.setItem(storageKey,JSON.stringify(itinerary));}catch{throw Error('進度儲存失敗，請勿離開本頁。');}}
  function renderPatrol(){const g=itinerary?.groups[itinerary.index];$('#alpha-patrol-progress').textContent=!itinerary?'先在社團整理勾選社團。':g?`第 ${itinerary.index+1}/${itinerary.groups.length} 團：${g.name}；${groupId(location.href)===groupId(g.url)?'確認貼文載入後再掃描。':'請開啟本團。'}`:'巡禮已完成。';$('#alpha-patrol-current').disabled=!g;$('#alpha-patrol-next').disabled=!g;}
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.schema===1&&Array.isArray(saved.groups)&&saved.groups.length<=500&&saved.groups.every(g=>g&&groupId(g.url))&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=saved.groups.length){itinerary=saved;keyword.value=String(saved.keyword||'');message.value=String(saved.message||'');if(Array.isArray(saved.handled))saved.handled.forEach(k=>handled.add(String(k)));}}catch{}
  const visible=el=>!!el?.isConnected&&!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
  const check=token=>{if(disposed||!root.isConnected||token!==epoch||root.dataset.socialVerified!=='1')throw Error('已停止');};
  const pause=async(ms,token)=>{check(token);for(let n=ms;n>0;n-=50){await new Promise(r=>setTimeout(r,Math.min(50,n)));check(token);}};
  function stopWork(){epoch++;say('已停止，不再執行後續動作。');}
  root.addEventListener('alpha:stop',stopWork);
  const keyOf=el=>{const a=[...el.querySelectorAll('a[href]')].find(a=>/\/(posts|permalink)\//.test(a.href));return(groupId(location.href)||'feed')+'|'+(a?a.href.split('?')[0]:clean(el.innerText||el.textContent).slice(0,240));};
  async function findPosts(words,cap,token){
    const scope=document.querySelector('[role="main"]');if(!scope)return[];
    const nodes=[...scope.querySelectorAll('article,[role="article"],[data-pagelet^="FeedUnit_"]')].slice(0,300),found=[],seen=new Set();
    for(let n=0;n<nodes.length&&found.length<cap;n++){check(token);const el=nodes[n];if(root.contains(el)||!visible(el)||el.parentElement?.closest('article,[role="article"],[data-pagelet^="FeedUnit_"]'))continue;const text=clean(el.innerText||el.textContent),matched=words.filter(w=>text.includes(w)),key=keyOf(el);if(matched.length&&!seen.has(key)&&!handled.has(key)){seen.add(key);found.push({el,text,key,matched,group:groupId(location.href)});}if(n%20===19)await pause(1,token);}return found;
  }
  const label=el=>clean(el.getAttribute('aria-label')||el.getAttribute('title')||el.innerText||el.textContent),editorSelector='textarea,input[type="text"],[contenteditable="true"],[role="textbox"]';
  function focus(next){if(busy||!queue.length)return;index=Math.max(0,Math.min(queue.length-1,next));[...results.children].forEach((r,n)=>r.classList.toggle('current',n===index));queue[index].el.scrollIntoView({block:'center'});say(`第 ${index+1}/${queue.length} 則，請選擇動作。`);}
  function advance(){if(busy||!queue[index])return;handled.add(queue[index].key);try{persist();}catch(e){say(e.message,'bad');return;}awaitingSend=false;if(index===queue.length-1){index=queue.length;say('本輪候選已完成，可繼續掃描或下一團。','ok');}else focus(index+1);}
  async function execute(type){
    if(busy||!authorized()||!queue[index])return;const item=queue[index],token=epoch;
    if(!item.el.isConnected||item.group!==groupId(location.href)){say('貼文已變動，請重新掃描。','bad');return;}
    if(type==='comment'&&!message.value.trim()){say('請先輸入預備留言。','bad');return;}
    busy=true;stop.disabled=false;
    try{check(token);item.el.scrollIntoView({block:'center'});await pause(100,token);const buttons=[...item.el.querySelectorAll('button,[role="button"]')].filter(visible);
      if(type==='heart'){
        const hearts=buttons.filter(el=>/^(愛心|大心|Love|移除愛心|收回愛心|Remove Love)$/i.test(label(el)));
        if(hearts.length!==1)throw Error('無法唯一辨識原生愛心，請手動開啟反應選單並選愛心；不以讚代替。');
        const heart=hearts[0];if(!hearted.has(item.key)&&heart.getAttribute('aria-pressed')!=='true'&&!/^(移除|收回|Remove)/i.test(label(heart))){check(token);heart.click();hearted.add(item.key);}say('已選取原生愛心，請核對Facebook顯示。','ok');
      }else{
        let editors=[...item.el.querySelectorAll(editorSelector)].filter(visible);
        if(!editors.length){const comments=buttons.filter(el=>/^(留言|回覆|Comment|Reply)(\s.*)?$/i.test(label(el)));if(comments.length!==1)throw Error('請先手動點開本則留言框。');check(token);comments[0].click();for(let n=0;n<20&&!editors.length;n++){await pause(100,token);editors=[...item.el.querySelectorAll(editorSelector)].filter(visible);}}
        if(editors.length!==1)throw Error('無法唯一確認本則留言框，未填入其他位置。');
        const editor=editors[0],editable=editor.getAttribute('contenteditable')==='true'||editor.isContentEditable,existing=editable?editor.textContent:editor.value;
        if(clean(existing)&&clean(existing)!==clean(message.value))throw Error('已有不同草稿，請先自行確認，未覆蓋。');
        check(token);editor.focus();if(editable){editor.textContent=message.value.trim();editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:message.value.trim()}));}else{const proto=editor.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(editor,message.value.trim());editor.dispatchEvent(new Event('input',{bubbles:true}));}
        awaitingSend=true;say('已填入本則原生留言框；請手動送出後按「完成本則」。','ok');
      }
    }catch(e){say(e.message,'bad');}finally{busy=false;stop.disabled=true;}
  }
  function render(items){queue=items;index=-1;results.replaceChildren();items.forEach((item,n)=>{const row=document.createElement('div');row.className='result';const text=document.createElement('strong');text.textContent=`${n+1}. ${item.text.slice(0,160)}`;row.append(text);for(const [title,action]of[['定位',()=>focus(n)],['愛心',()=>{focus(n);return execute('heart');}],['填入留言',()=>{focus(n);return execute('comment');}],['完成本則',()=>{focus(n);advance();}],['略過',()=>{focus(n);advance();}]]){const b=document.createElement('button');b.textContent=title;b.onclick=()=>{if(!busy&&authorized())return action();};row.append(b);}results.append(row);});if(items.length)focus(0);else say('未找到符合的貼文，可繼續掃描或下一團。');}
  scan.onclick=async()=>{
    if(busy||!authorized())return;const group=itinerary?.groups[itinerary.index];if(itinerary&&(!group||groupId(group.url)!==groupId(location.href))){say('請先開啟巡禮的目標社團。','bad');return;}if(awaitingSend){say('請先處理原生框內的留言，再完成或略過本則。','bad');return;}
    const words=[...new Set(keyword.value.split(/[，,\n;；]+/).map(s=>s.trim()).filter(Boolean))].slice(0,12);if(!words.length){say('請輸入關鍵字。','bad');return;}
    const token=++epoch,path=location.pathname,all=new Map(),cap=Math.min(20,Math.max(1,parseInt($('#fb-ad-alpha-limit').value,10)||20)),max=Math.min(50,Math.max(0,parseInt($('#fb-ad-alpha-rounds').value,10)||0));busy=true;scan.disabled=true;stop.disabled=false;
    try{persist();for(let round=0;round<=max&&all.size<cap;round++){check(token);if(location.pathname!==path)throw Error('頁面變動，已停止。');for(const item of await findPosts(words,cap,token))if(all.size<cap)all.set(item.key,item);say(`第 ${round+1} 輪，找到 ${all.size}/${cap} 則。`);if(round<max&&all.size<cap){window.scrollBy(0,Math.max(400,innerHeight*.75));await pause(1100,token);}}check(token);busy=false;render([...all.values()]);}catch(e){say(e.message,'bad');}finally{busy=false;scan.disabled=false;stop.disabled=true;}
  };
  stop.onclick=stopWork;
  function navigate(){if(busy||!authorized())return;const group=itinerary?.groups[itinerary.index];if(!group)return;try{persist();if(groupId(location.href)===groupId(group.url)){say('已在本團，請待貼文載入後掃描。');return;}root.dispatchEvent(new Event('alpha:stop'));location.assign(group.url);}catch(e){say(e.message,'bad');}}
  $('#alpha-patrol-start').onclick=()=>{if(busy||!authorized())return;const groups=root.alphaGroups?.selected().filter(g=>groupId(g.url))||[];if(!groups.length){say('請先在社團整理勾選清單。','bad');return;}if(itinerary&&!confirm('新巡禮會取代既有進度，確定？'))return;itinerary={schema:1,groups,index:0,handled:[]};handled.clear();queue=[];index=-1;results.replaceChildren();try{persist();renderPatrol();say('已建立巡禮，按開啟本團開始。');}catch(e){say(e.message,'bad');}};
  $('#alpha-patrol-current').onclick=navigate;
  $('#alpha-patrol-next').onclick=()=>{if(busy||!authorized()||!itinerary||itinerary.index>=itinerary.groups.length)return;if(awaitingSend){say('請先送出或清除留言，再完成本則。','bad');return;}if(!confirm('本團已完成，前往下一團？'))return;itinerary.index++;queue=[];index=-1;results.replaceChildren();try{persist();renderPatrol();navigate();}catch(e){say(e.message,'bad');}};
  const onKey=e=>{if(disposed||tracker.hidden||busy||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,textarea,[contenteditable="true"],[role="textbox"],button')||!queue[index])return;const k=e.key.toLowerCase();if(!'esdfx'.includes(k)||!authorized())return;e.preventDefault();if(k==='e')execute('comment');else if(k==='s'||k==='x')advance();else focus(index+(k==='d'?-1:1));};document.addEventListener('keydown',onKey);
  window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);header.addEventListener('pointerup',fit);
  const authObserver=new MutationObserver(()=>{if(root.dataset.socialVerified!=='1')stopWork();});authObserver.observe(root,{attributes:true,attributeFilter:['data-social-verified']});
  root.addEventListener('alpha:dispose',()=>{stopWork();disposed=true;authObserver.disconnect();document.removeEventListener('keydown',onKey);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit);});
  renderPatrol();fit();
})();
