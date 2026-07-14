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
  const findButton=(names,scope=document)=>[...scope.querySelectorAll('button,[role="button"],a')].filter(el=>!root.contains(el)&&visible(el)).find(el=>names.some(name=>label(el)===name||semantics(el).split(' ').includes(name)));
  async function waitFor(fn,ms=10000,interval=250){const end=Date.now()+ms;while(Date.now()<end){const result=fn();if(result)return result;await sleep(interval)}return null}
  async function openComposer(platform){
    const existing=findFileInput()||findEditor(platform);if(existing)return true;
    const names=platform==='instagram'?['建立','新增貼文','Create','New post']:['建立','新增串文','開始新串文','New thread','Create'];
    let opener=findButton(names);
    if(!opener)opener=candidates().find(el=>platform==='instagram'?/建立|新增貼文|建立新貼文|Create|New post/i.test(semantics(el)):/建立|新增串文|開始新串文|New thread|Create/i.test(semantics(el)));
    if(!opener&&platform==='instagram'){const icon=[...document.querySelectorAll('svg[aria-label]')].find(svg=>/建立|新增貼文|New post|Create/i.test(svg.getAttribute('aria-label')||''));opener=icon?.closest('button,[role="button"],a')||null}
    if(!opener&&platform==='threads'){const icon=[...document.querySelectorAll('svg[aria-label]')].find(svg=>/建立|新增|New thread|Create/i.test(svg.getAttribute('aria-label')||''));opener=icon?.closest('button,[role="button"],a')||null}
    if(!opener)return false;
    button.textContent='步驟 1/6：開啟建立';say('已找到左側「建立」，正在開啟貼文選單…');opener.click();note('open-composer',semantics(opener));await sleep(700);
    if(platform==='instagram'){
      button.textContent='步驟 2/6：等待貼文';say('已點擊「建立」，正在等待第二層「貼文」…');
      const post=await waitFor(()=>findButton(['貼文','Post']),7000);
      if(!post)return false;
      post.click();note('instagram-post-menu',semantics(post));button.textContent='步驟 3/6：等待選檔';say('已點擊「貼文」，正在等待 Instagram 選檔視窗…');await sleep(700);
    }
    return true;
  }
  function findFileInput(){return [...document.querySelectorAll('input[type="file"]')].find(el=>!root.contains(el)&&(/image|video/.test(el.accept||'')||!el.accept))||null}
  function findEditor(platform){const fields=[...document.querySelectorAll('textarea,[contenteditable="true"]')].filter(el=>!root.contains(el)&&visible(el));const preferred=fields.find(el=>{const hint=clean(el.getAttribute('aria-label')||el.getAttribute('placeholder'));return platform==='instagram'?/caption|說明|撰寫/i.test(hint):/thread|串文|有什麼新鮮事|開始/i.test(hint)});return preferred||fields[0]||null}
  function setEditor(editor,text){editor.focus();if(editor.matches('textarea,input')){const proto=editor.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;setter?setter.call(editor,text):editor.value=text}else{editor.textContent=text}editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));editor.dispatchEvent(new Event('change',{bubbles:true}))}
  function setFile(input,file){const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
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
    const platform=/instagram\.com/i.test(location.hostname)?'instagram':/threads\.net/i.test(location.hostname)?'threads':'';report.platform=platform;report.steps=[];report.error='';
    if(!platform){say('目前不是 Threads 或 Instagram 頁面。','bad');return}
    button.disabled=true;say('正在尋找 '+(platform==='instagram'?'Instagram':'Threads')+' 原生發文視窗…');
    try{
      if(!await openComposer(platform))throw new Error(platform==='instagram'?'找不到左側「建立」，或第二層「貼文」按鈕':'找不到建立串文按鈕');
      if(platform==='threads'){
        const editor=await waitFor(()=>findEditor(platform),8000);if(!editor)throw new Error('找不到 Threads 文字輸入區');setEditor(editor,draft.text);note('write-text','threads');
        const fileInput=await waitFor(findFileInput,8000);if(!fileInput)throw new Error('找不到 Threads 媒體選擇欄位');setFile(fileInput,draft.file);note('write-media',draft.media.kind);
      }else{
        const fileInput=await waitFor(findFileInput,10000);if(!fileInput)throw new Error('已開啟 Instagram 貼文視窗，但找不到媒體選擇欄位');setFile(fileInput,draft.file);note('write-media',draft.media.kind);button.textContent='步驟 4/6：處理媒體';
        const mediaWait=draft.media.kind==='video'?75000:30000;
        await dismissInstagramReelNotice();
        await clickInstagramNext('裁切',mediaWait);
        await clickInstagramNext('編輯',mediaWait);
        button.textContent='步驟 6/6：填入文字';const editor=await waitFor(()=>findEditor(platform),mediaWait);if(!editor)throw new Error('媒體已放入，但找不到 Instagram 說明文字欄位');setEditor(editor,draft.text);note('write-text','instagram');
      }
      readyToShare=true;writtenDraft=draft;say('已把媒體與文字放入原生發文視窗；請人工確認並保持此視窗開啟，時間到會按「分享」。','ok');button.textContent='已寫入，等待預定時間';
    }catch(error){report.error=String(error.message||error);note('failed',report.error);say('寫入測試停止：'+report.error+'。草稿仍保留，可回報此訊息修正。','bad');button.textContent='重試寫入平台（不送出）';button.disabled=false}
  }
  function instagramShareScope(){
    const titles=['建立新貼文','新 Reel','Create new post','New reel'];
    const headings=[...document.querySelectorAll('h1,h2,h3,[role="heading"],div,span')].filter(el=>!root.contains(el)&&visible(el)&&titles.includes(clean(el.textContent)));
    for(const heading of headings){let scope=heading;for(let depth=0;scope&&depth<10;depth++,scope=scope.parentElement){const rect=scope.getBoundingClientRect?.(),share=findButton(['分享','Share'],scope);if(rect&&rect.width>400&&rect.height>250&&share&&!share.disabled&&share.getAttribute('aria-disabled')!=='true')return scope}}
    return null;
  }
  async function shareWhenDue(event){
    const draft=event.detail?.draft||root.__singleDraft;
    if(!readyToShare||!draft||writtenDraft!==draft){say('時間已到，但原生貼文尚未完成寫入；已停止，沒有送出。','bad');return}
    if(!/instagram\.com/i.test(location.hostname)){say('時間已到，但目前尚未完成 Threads 的自動分享流程；已停止。','bad');return}
    button.disabled=true;button.textContent='時間到：正在分享';
    const scope=await waitFor(instagramShareScope,15000,400),share=scope&&findButton(['分享','Share'],scope);
    if(!share){say('時間已到，但找不到前景發文視窗的「分享」；已停止，請人工確認。','bad');button.textContent='找不到分享，請人工處理';return}
    share.focus?.();share.click();note('scheduled-share','instagram');readyToShare=false;writtenDraft=null;button.textContent='已送出分享指令';say('預定時間已到，已點擊 Instagram 原生「分享」。','ok');
  }
  button.textContent='寫入平台（不送出）';button.disabled=!root.__singleDraft;button.onclick=writeDraft;
  root.addEventListener('33:draft-ready',()=>{readyToShare=false;writtenDraft=null;button.disabled=false;button.textContent='寫入平台（不送出）'});root.addEventListener('33:draft-cancelled',()=>{readyToShare=false;writtenDraft=null;button.disabled=true;button.textContent='寫入平台（不送出）'});root.addEventListener('33:schedule-due',shareWhenDue);
})();
