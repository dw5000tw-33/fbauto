(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler'),button=root?.querySelector('#s-now'),status=root?.querySelector('#s-status');
  if(!root||!button||!status||root.dataset.platformWriter==='1')return;
  root.dataset.platformWriter='1';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),visible=el=>{const r=el?.getBoundingClientRect?.();return !!r&&r.width>1&&r.height>1&&getComputedStyle(el).visibility!=='hidden'},clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const say=(text,kind='')=>{status.textContent=text;status.className='status '+kind};
  const report={platform:'',steps:[],error:''};root.__writerReport=report;
  let readyToShare=false,writtenDraft=null;
  const note=(step,detail='')=>report.steps.push({time:new Date().toISOString(),step,detail});
  const candidates=()=>[...document.querySelectorAll('button,[role="button"],a')].filter(el=>!root.contains(el)&&visible(el));
  const label=el=>clean(el.getAttribute('aria-label')||el.innerText||el.textContent);
  const semantics=el=>clean([
    el.getAttribute('aria-label'),el.getAttribute('title'),el.innerText,el.textContent,
    ...[...el.querySelectorAll('[aria-label],[title],svg title')].flatMap(node=>[node.getAttribute?.('aria-label'),node.getAttribute?.('title'),node.textContent])
  ].filter(Boolean).join(' '));
  const findButton=(names,scope=document)=>[...scope.querySelectorAll('button,[role="button"],[role="menuitem"],a')].filter(el=>!root.contains(el)&&visible(el)).find(el=>names.some(name=>label(el)===name||semantics(el).split(' ').includes(name)));
  async function waitFor(fn,ms=10000,interval=250){const end=Date.now()+ms;while(Date.now()<end){const result=fn();if(result)return result;await sleep(interval)}return null}
  function activate(el){if(!el)return;const init={bubbles:true,cancelable:true,view:window,button:0,buttons:1};try{el.dispatchEvent(new PointerEvent('pointerdown',init));el.dispatchEvent(new MouseEvent('mousedown',init));el.dispatchEvent(new PointerEvent('pointerup',{...init,buttons:0}));el.dispatchEvent(new MouseEvent('mouseup',{...init,buttons:0}));el.dispatchEvent(new MouseEvent('click',{...init,buttons:0}))}catch(_){el.click?.()}}
  function threadsComposerScope(){
    const titles=['新串文','New thread'];
    const headings=[...document.querySelectorAll('h1,h2,h3,[role="heading"],div,span')].filter(el=>!root.contains(el)&&visible(el)&&titles.includes(clean(el.textContent)));
    for(const heading of headings){let scope=heading;for(let depth=0;scope&&depth<10;depth++,scope=scope.parentElement){const rect=scope.getBoundingClientRect?.();if(rect&&rect.width>320&&rect.height>180&&findEditor('threads',scope))return scope}}
    return [...document.querySelectorAll('[role="dialog"]')].filter(el=>!root.contains(el)&&visible(el)).find(el=>titles.some(name=>clean(el.textContent).includes(name))&&findEditor('threads',el))||null;
  }
  async function openComposer(platform){
    const existing=platform==='threads'?threadsComposerScope():(findFileInput()||findEditor(platform));if(existing)return true;
    const names=platform==='instagram'?['建立','新增貼文','Create','New post']:['建立','新增串文','開始新串文','New thread','Create'];
    let opener=findButton(names);
    if(!opener)opener=candidates().find(el=>platform==='instagram'?/建立|新增貼文|建立新貼文|Create|New post/i.test(semantics(el)):/建立|新增串文|開始新串文|New thread|Create/i.test(semantics(el)));
    if(!opener&&platform==='instagram'){const icon=[...document.querySelectorAll('svg[aria-label]')].find(svg=>/建立|新增貼文|New post|Create/i.test(svg.getAttribute('aria-label')||''));opener=icon?.closest('button,[role="button"],a')||null}
    if(!opener&&platform==='threads'){const icon=[...document.querySelectorAll('svg[aria-label]')].find(svg=>/建立|新增|New thread|Create/i.test(svg.getAttribute('aria-label')||''));opener=icon?.closest('button,[role="button"],a')||null}
    if(!opener&&platform==='threads'){
      const stacked=document.elementsFromPoint?.(Math.max(1,innerWidth-58),Math.max(1,innerHeight-58))||[];
      const point=stacked.find(el=>!root.contains(el)&&el!==document.documentElement&&el!==document.body);
      opener=point?.closest?.('button,[role="button"],a')||point||null;
      if(opener)note('threads-create-fallback','bottom-right-hit-test');
    }
    if(!opener&&platform==='threads'){
      const prompt=[...document.querySelectorAll('div,span,p')].find(el=>!root.contains(el)&&visible(el)&&/^(有什麼新鮮事？?|What's new\??)$/i.test(clean(el.textContent)));
      opener=prompt?.closest('button,[role="button"],a')||prompt||null;
    }
    if(!opener&&platform==='threads'){
      const controls=candidates().filter(el=>{const r=el.getBoundingClientRect();const cy=r.top+r.height/2;return r.left<90&&r.right<120&&r.width>15&&r.height>15&&r.height<110&&cy>innerHeight*.2&&cy<innerHeight*.8}).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
      if(controls.length>=3){opener=controls[Math.floor(controls.length/2)];note('threads-create-fallback','left-rail-median '+controls.length+' controls')}
    }
    if(!opener&&platform==='threads'){
      const stacked=document.elementsFromPoint?.(30,Math.round(innerHeight*.52))||[];
      const point=stacked.find(el=>!root.contains(el));
      opener=point?.closest?.('button,[role="button"],a')||point||null;
      if(opener)note('threads-create-fallback','left-center-hit-test '+Math.round(innerHeight*.52));
    }
    if(!opener&&platform==='threads'){
      const rail=candidates().filter(el=>{const r=el.getBoundingClientRect();return r.left<90&&r.width<100&&r.height<100&&!!el.querySelector('svg')});
      opener=rail.sort((a,b)=>Math.abs((a.getBoundingClientRect().top+a.getBoundingClientRect().height/2)-innerHeight*.52)-Math.abs((b.getBoundingClientRect().top+b.getBoundingClientRect().height/2)-innerHeight*.52))[0]||null;
      if(opener)note('threads-create-fallback','left-rail-position');
    }
    if(!opener)return false;
    button.textContent=platform==='threads'?'正在開啟 Threads 新串文':'步驟 1/6：開啟建立';say(platform==='threads'?'已找到 Threads 發文入口，正在開啟「新串文」…':'已找到左側「建立」，正在開啟貼文選單…');platform==='threads'?activate(opener):opener.click();note('open-composer',semantics(opener));await sleep(700);
    if(platform==='instagram'){
      button.textContent='步驟 2/6：等待貼文';say('已點擊「建立」，正在等待第二層「貼文」…');
      const post=await waitFor(()=>findButton(['貼文','Post']),7000);
      if(!post)return false;
      post.click();note('instagram-post-menu',semantics(post));button.textContent='步驟 3/6：等待選檔';say('已點擊「貼文」，正在等待 Instagram 選檔視窗…');await sleep(700);
    }
    return true;
  }
  function findFileInput(scope=document){return [...scope.querySelectorAll('input[type="file"]')].find(el=>!root.contains(el)&&(/image|video/.test(el.accept||'')||!el.accept))||null}
  function findEditor(platform,scope=document){const fields=[...scope.querySelectorAll('textarea,[contenteditable="true"]')].filter(el=>!root.contains(el)&&visible(el));const preferred=fields.find(el=>{const hint=clean(el.getAttribute('aria-label')||el.getAttribute('placeholder'));return platform==='instagram'?/caption|說明|撰寫/i.test(hint):/thread|串文|有什麼新鮮事|開始/i.test(hint)});return preferred||fields[0]||null}
  function setEditor(editor,text){editor.focus();if(editor.matches('textarea,input')){const proto=editor.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;setter?setter.call(editor,text):editor.value=text}else{const selection=getSelection(),range=document.createRange();range.selectNodeContents(editor);selection.removeAllRanges();selection.addRange(range);if(!document.execCommand('insertText',false,text))editor.textContent=text}editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));editor.dispatchEvent(new Event('change',{bubbles:true}))}
  function setFile(input,file){const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
  async function applyThreadsTopic(scope,topic={}){
    const mode=topic.mode||'none';if(mode==='none'){note('threads-topic','none');return}
    button.textContent='Threads 4/5：設定社群／主題';
    const text=[...scope.querySelectorAll('div,span,p')].find(el=>!root.contains(el)&&visible(el)&&/^(社群或主題|Community or topic)$/i.test(clean(el.textContent)));
    const trigger=text?.closest('button,[role="button"],a')||text;
    if(!trigger){if(mode==='auto'){note('threads-topic','no platform suggestion');return}throw new Error('找不到 Threads「社群或主題」入口')}
    const triggerRect=trigger.getBoundingClientRect(),topicHost=trigger.parentElement;activate(trigger);note('threads-topic-menu','opened');await sleep(450);
    const popup=await waitFor(()=>{const direct=[...document.querySelectorAll('[role="menu"],[role="listbox"]')].find(el=>!root.contains(el)&&visible(el));if(direct)return direct;const boxes=[...document.querySelectorAll('div')].filter(el=>!root.contains(el)&&visible(el)&&/最新|Latest/i.test(clean(el.textContent))).filter(el=>{const r=el.getBoundingClientRect();return r.width>160&&r.width<430&&r.height>80&&r.height<430&&Math.abs(r.left-triggerRect.left)<520&&Math.abs(r.top-triggerRect.top)<420}).sort((a,b)=>{const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return ar.width*ar.height-br.width*br.height});return boxes[0]||null},5000,250);
    if(!popup){if(mode==='auto'){note('threads-topic','suggestion popup absent');return}throw new Error('已開啟主題入口，但找不到 Threads 主題清單')}
    let items=[...popup.querySelectorAll('button,[role="button"],[role="menuitem"],[role="option"],a')].filter(el=>visible(el)).filter(el=>{const value=clean(el.textContent);return value&&!/^(最新|Latest)$/i.test(value)});
    if(!items.length)items=[...popup.querySelectorAll('div')].filter(el=>visible(el)&&/最新貼文|recent posts?/i.test(clean(el.textContent))).filter(el=>{const r=el.getBoundingClientRect();return r.height>28&&r.height<100}).sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top).filter((el,index,list)=>index===0||Math.abs(el.getBoundingClientRect().top-list[index-1].getBoundingClientRect().top)>4);
    let choice=null;
    if(mode==='manual'){const wanted=clean(topic.value);choice=items.find(el=>clean(el.textContent)===wanted)||items.find(el=>clean(el.textContent).startsWith(wanted));if(!choice){const available=items.map(el=>clean(String(el.innerText||el.textContent).split('\n')[0])).filter(Boolean).slice(0,6);throw new Error('Threads 主題清單中找不到「'+wanted+'」；目前可選：'+(available.join('、')||'無'))}}
    else choice=items[0]||null;
    if(!choice){if(mode==='auto'){note('threads-topic','no suggestion item');return}throw new Error('Threads 主題清單沒有可選項目')}
    const chosen=clean(choice.textContent),topicName=clean(String(choice.innerText||choice.textContent).split('\n')[0]);activate(choice);note('threads-topic',mode+': '+chosen);
    const applied=await waitFor(()=>{const value=clean(topicHost?.innerText||'');return value.includes(mode==='manual'?clean(topic.value):topicName)&&!/社群或主題/.test(value)},5000,250);
    if(!applied)throw new Error('已點選 Threads 主題「'+(mode==='manual'?clean(topic.value):topicName)+'」，但原生新串文沒有套用');
  }
  async function addThreadsAiLabel(scope){
    button.textContent='Threads 5/5：新增 AI 標籤';
    const box=scope.getBoundingClientRect(),topButtons=[...scope.querySelectorAll('button,[role="button"]')].filter(el=>!root.contains(el)&&visible(el)).filter(el=>{const r=el.getBoundingClientRect();return r.top<box.top+90&&r.left>box.right-140}).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right);
    const more=topButtons.find(el=>/更多|選項|more|options|⋯|\.\.\./i.test(semantics(el)))||topButtons[0];
    if(!more)throw new Error('找不到 Threads 新串文右上角「⋯」選單');
    const enabled=()=>findButton(['移除 AI 標籤','Remove AI label'])||[...document.querySelectorAll('[role="menuitem"],[role="option"]')].find(el=>!root.contains(el)&&visible(el)&&/AI 標籤|AI label/i.test(semantics(el))&&(el.getAttribute('aria-checked')==='true'||el.getAttribute('aria-selected')==='true'));
    for(let attempt=1;attempt<=2;attempt++){
      activate(more);note('threads-more-menu','attempt '+attempt);await sleep(350);
      if(enabled()){activate(more);note('threads-ai-label','already enabled');return}
      const ai=await waitFor(()=>findButton(['新增 AI 標籤','Add AI label']),3500,250);
      if(!ai)continue;
      activate(ai);note('threads-ai-label','click attempt '+attempt);await waitFor(()=>!visible(ai),2500,200);
      activate(more);await sleep(350);
      if(enabled()){activate(more);note('threads-ai-label','verified');return}
      activate(more);await sleep(250);
    }
    throw new Error('已點擊「新增 AI 標籤」，但 Threads 沒有顯示已啟用狀態');
  }
  async function dismissInstagramReelNotice(){
    const dialog=await waitFor(()=>[...document.querySelectorAll('[role="dialog"]')].find(el=>!root.contains(el)&&visible(el)&&/Reel/i.test(clean(el.textContent))),3500);
    if(!dialog)return false;
    const confirm=findButton(['確定','OK'],dialog);
    if(!confirm)return false;
    confirm.click();note('instagram-reel-notice','confirmed');await sleep(700);return true;
  }
  function instagramStageScope(stage){
    const names=stage==='裁切'?['裁切','Crop']:['編輯','Edit'];
    const headings=[...document.querySelectorAll('h1,h2,h3,[role="heading"],div,span')].filter(el=>!root.contains(el)&&visible(el)&&names.includes(clean(el.textContent)));
    for(const heading of headings){
      let scope=heading;
      for(let depth=0;scope&&depth<10;depth++,scope=scope.parentElement){
        const rect=scope.getBoundingClientRect?.();
        if(rect&&rect.width>400&&rect.height>250&&findButton(['下一步','Next'],scope))return scope;
      }
    }
    return [...document.querySelectorAll('[role="dialog"]')].filter(el=>!root.contains(el)&&visible(el)).find(el=>names.some(name=>clean(el.textContent).includes(name))&&findButton(['下一步','Next'],el))||null;
  }
  async function clickInstagramNext(step,waitMs=30000){
    const findNext=()=>{
      const reelDialog=[...document.querySelectorAll('[role="dialog"]')].find(el=>!root.contains(el)&&visible(el)&&/Reel/i.test(clean(el.textContent)));
      const confirm=reelDialog&&findButton(['確定','OK'],reelDialog);
      if(confirm){confirm.click();note('instagram-reel-notice','confirmed-during-'+step);return null}
      const stage=instagramStageScope(step);
      return stage&&findButton(['下一步','Next'],stage);
    };
    const next=await waitFor(findNext,waitMs,350);
    if(!next)throw new Error('媒體已放入，但找不到 Instagram「'+step+'」畫面的下一步');
    const screenChanged=()=>{
      const page=clean(String(document.body.innerText||'').replace(root.innerText||'',''));
      if(step==='裁切')return /(^|\s)編輯(\s|$)|(^|\s)Edit(\s|$)/i.test(page);
      return /新 Reel|New reel/i.test(page)||!!findEditor('instagram');
    };
    for(let attempt=1;attempt<=3;attempt++){
      button.textContent='步驟 '+(step==='裁切'?'5/6：裁切下一步':'5/6：編輯下一步');
      next.scrollIntoView?.({block:'center',inline:'center'});next.focus?.();next.click();note('instagram-next',step+' foreground attempt '+attempt);
      if(await waitFor(screenChanged,step==='裁切'?12000:18000,400))return true;
    }
    throw new Error('已找到「'+step+'」的下一步，但 Instagram 畫面沒有切換');
  }
  async function writeDraft(){
    const draft=root.__singleDraft;if(!draft){say('請先建立一則單筆預排草稿。','bad');return}
    const platform=/instagram\.com$/i.test(location.hostname)?'instagram':/threads\.(com|net)$/i.test(location.hostname)?'threads':'';report.platform=platform;report.steps=[];report.error='';
    if(!platform){say('目前不是 Threads 或 Instagram 頁面。','bad');return}
    button.disabled=true;say('正在尋找 '+(platform==='instagram'?'Instagram':'Threads')+' 原生發文視窗…');
    try{
      if(!await openComposer(platform))throw new Error(platform==='instagram'?'找不到左側「建立」，或第二層「貼文」按鈕':'找不到建立串文按鈕');
      if(platform==='threads'){
        button.textContent='Threads 1/5：等待新串文';const scope=await waitFor(threadsComposerScope,10000);if(!scope)throw new Error('已點擊建立，但找不到前景「新串文」視窗');
        button.textContent='Threads 2/5：填入文字';const editor=findEditor(platform,scope);if(!editor)throw new Error('找不到 Threads 新串文文字輸入區');setEditor(editor,draft.text);note('write-text','threads');
        button.textContent='Threads 3/5：放入媒體';const fileInput=await waitFor(()=>findFileInput(scope)||findFileInput(),10000);if(!fileInput)throw new Error('找不到 Threads 新串文媒體欄位');setFile(fileInput,draft.file);note('write-media',draft.media.kind);await sleep(draft.media.kind==='video'?2500:1200);await applyThreadsTopic(scope,draft.topic);if(draft.topic?.aiLabel!==false)await addThreadsAiLabel(scope);else note('threads-ai-label','disabled by user');
      }else{
        const fileInput=await waitFor(findFileInput,10000);if(!fileInput)throw new Error('已開啟 Instagram 貼文視窗，但找不到媒體選擇欄位');setFile(fileInput,draft.file);note('write-media',draft.media.kind);button.textContent='步驟 4/6：處理媒體';
        const mediaWait=draft.media.kind==='video'?75000:30000;
        await dismissInstagramReelNotice();
        await clickInstagramNext('裁切',mediaWait);
        await clickInstagramNext('編輯',mediaWait);
        button.textContent='步驟 6/6：填入文字';const editor=await waitFor(()=>findEditor(platform),mediaWait);if(!editor)throw new Error('媒體已放入，但找不到 Instagram 說明文字欄位');setEditor(editor,draft.text);note('write-text','instagram');
      }
      readyToShare=true;writtenDraft=draft;say('已完整寫入原生發文視窗；可立即測試發佈，或保持視窗開啟等待預定時間。','ok');button.disabled=false;button.textContent='立即完整測試發佈';button.onclick=()=>{if(confirm('將立即點擊平台原生發佈按鈕，確定執行完整測試？'))shareWhenDue({detail:{draft:root.__singleDraft}})};
    }catch(error){report.error=String(error.message||error);note('failed',report.error);say('寫入測試停止：'+report.error+'。草稿仍保留，可回報此訊息修正。','bad');button.textContent='重試寫入平台（不送出）';button.disabled=false}
  }
  function instagramShareScope(){
    const titles=['建立新貼文','新 Reel','Create new post','New reel'];
    const headings=[...document.querySelectorAll('h1,h2,h3,[role="heading"],div,span')].filter(el=>!root.contains(el)&&visible(el)&&titles.includes(clean(el.textContent)));
    for(const heading of headings){let scope=heading;for(let depth=0;scope&&depth<10;depth++,scope=scope.parentElement){const rect=scope.getBoundingClientRect?.(),share=findButton(['分享','Share'],scope);if(rect&&rect.width>400&&rect.height>250&&share&&!share.disabled&&share.getAttribute('aria-disabled')!=='true')return scope}}
    return null;
  }
  function threadsShareScope(){
    const scope=threadsComposerScope();if(!scope)return null;
    const publish=findButton(['發佈','發布','Post'],scope);
    return publish&&!publish.disabled&&publish.getAttribute('aria-disabled')!=='true'?scope:null;
  }
  async function shareWhenDue(event){
    const draft=event.detail?.draft||root.__singleDraft;
    if(!readyToShare||!draft||writtenDraft!==draft){say('時間已到，但原生貼文尚未完成寫入；已停止，沒有送出。','bad');return}
    const platform=/instagram\.com$/i.test(location.hostname)?'instagram':/threads\.(com|net)$/i.test(location.hostname)?'threads':'';
    if(!platform){say('時間已到，但目前不是 Instagram 或 Threads 頁面；已停止。','bad');return}
    button.disabled=true;button.textContent='時間到：正在分享';
    const scope=await waitFor(platform==='instagram'?instagramShareScope:threadsShareScope,15000,400),share=scope&&findButton(platform==='instagram'?['分享','Share']:['發佈','發布','Post'],scope);
    if(!share){say('時間已到，但找不到前景發文視窗的「'+(platform==='instagram'?'分享':'發佈')+'」；已停止，請人工確認。','bad');button.textContent='找不到送出按鈕，請人工處理';return}
    share.focus?.();share.click();note('scheduled-share',platform);readyToShare=false;writtenDraft=null;root.dispatchEvent(new CustomEvent('33:share-complete',{detail:{platform}}));button.textContent='已送出發佈指令';say('預定時間已到，已點擊 '+(platform==='instagram'?'Instagram「分享」':'Threads「發佈」')+'；面板草稿已清空。','ok');
  }
  button.textContent='寫入平台（不送出）';button.disabled=!root.__singleDraft;button.onclick=writeDraft;
  root.addEventListener('33:draft-ready',()=>{readyToShare=false;writtenDraft=null;button.disabled=false;button.textContent='正在自動寫入平台';button.onclick=writeDraft;setTimeout(()=>{if(root.isConnected&&root.__singleDraft)writeDraft()},50)});root.addEventListener('33:draft-cancelled',()=>{readyToShare=false;writtenDraft=null;button.disabled=true;button.textContent='寫入平台（不送出）';button.onclick=writeDraft});root.addEventListener('33:schedule-due',shareWhenDue);
})();
