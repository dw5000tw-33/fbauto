(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler'),button=root?.querySelector('#s-now'),status=root?.querySelector('#s-status');
  if(!root||!button||!status||root.dataset.platformWriter==='1')return;
  root.dataset.platformWriter='1';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),visible=el=>{const r=el?.getBoundingClientRect?.();return !!r&&r.width>1&&r.height>1&&getComputedStyle(el).visibility!=='hidden'},clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const say=(text,kind='')=>{status.textContent=text;status.className='status '+kind};
  const report={platform:'',steps:[],error:''};root.__writerReport=report;
  const note=(step,detail='')=>report.steps.push({time:new Date().toISOString(),step,detail});
  const candidates=()=>[...document.querySelectorAll('button,[role="button"],a')].filter(el=>!root.contains(el)&&visible(el));
  const label=el=>clean(el.getAttribute('aria-label')||el.innerText||el.textContent);
  const findButton=names=>candidates().find(el=>names.some(name=>label(el)===name||label(el).startsWith(name)));
  async function waitFor(fn,ms=10000,interval=250){const end=Date.now()+ms;while(Date.now()<end){const result=fn();if(result)return result;await sleep(interval)}return null}
  async function openComposer(platform){
    const existing=findFileInput()||findEditor(platform);if(existing)return true;
    const names=platform==='instagram'?['建立','新增貼文','Create','New post']:['建立','新增串文','開始新串文','New thread','Create'];
    let opener=findButton(names);
    if(!opener&&platform==='instagram'){const icon=[...document.querySelectorAll('svg[aria-label]')].find(svg=>/建立|新增貼文|New post|Create/i.test(svg.getAttribute('aria-label')||''));opener=icon?.closest('button,[role="button"],a')||null}
    if(!opener&&platform==='threads'){const icon=[...document.querySelectorAll('svg[aria-label]')].find(svg=>/建立|新增|New thread|Create/i.test(svg.getAttribute('aria-label')||''));opener=icon?.closest('button,[role="button"],a')||null}
    if(!opener)return false;opener.click();note('open-composer',label(opener));await sleep(900);return true;
  }
  function findFileInput(){return [...document.querySelectorAll('input[type="file"]')].find(el=>!root.contains(el)&&(/image|video/.test(el.accept||'')||!el.accept))||null}
  function findEditor(platform){const fields=[...document.querySelectorAll('textarea,[contenteditable="true"]')].filter(el=>!root.contains(el)&&visible(el));const preferred=fields.find(el=>{const hint=clean(el.getAttribute('aria-label')||el.getAttribute('placeholder'));return platform==='instagram'?/caption|說明|撰寫/i.test(hint):/thread|串文|有什麼新鮮事|開始/i.test(hint)});return preferred||fields[0]||null}
  function setEditor(editor,text){editor.focus();if(editor.matches('textarea,input')){const proto=editor.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;setter?setter.call(editor,text):editor.value=text}else{editor.textContent=text}editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));editor.dispatchEvent(new Event('change',{bubbles:true}))}
  function setFile(input,file){const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
  async function clickInstagramNext(){for(let round=0;round<2;round++){const next=await waitFor(()=>findButton(['下一步','Next']),7000);if(!next)break;next.click();note('instagram-next',String(round+1));await sleep(1100)}}
  async function writeDraft(){
    const draft=root.__singleDraft;if(!draft){say('請先建立一則單筆預排草稿。','bad');return}
    const platform=/instagram\.com/i.test(location.hostname)?'instagram':/threads\.net/i.test(location.hostname)?'threads':'';report.platform=platform;report.steps=[];report.error='';
    if(!platform){say('目前不是 Threads 或 Instagram 頁面。','bad');return}
    button.disabled=true;say('正在尋找 '+(platform==='instagram'?'Instagram':'Threads')+' 原生發文視窗…');
    try{
      if(!await openComposer(platform))throw new Error('找不到建立貼文／串文按鈕');
      if(platform==='threads'){
        const editor=await waitFor(()=>findEditor(platform),8000);if(!editor)throw new Error('找不到 Threads 文字輸入區');setEditor(editor,draft.text);note('write-text','threads');
        const fileInput=await waitFor(findFileInput,8000);if(!fileInput)throw new Error('找不到 Threads 媒體選擇欄位');setFile(fileInput,draft.file);note('write-media',draft.media.kind);
      }else{
        const fileInput=await waitFor(findFileInput,8000);if(!fileInput)throw new Error('找不到 Instagram 媒體選擇欄位');setFile(fileInput,draft.file);note('write-media',draft.media.kind);await sleep(1800);await clickInstagramNext();
        const editor=await waitFor(()=>findEditor(platform),12000);if(!editor)throw new Error('媒體已放入，但找不到 Instagram 說明文字欄位');setEditor(editor,draft.text);note('write-text','instagram');
      }
      say('已把媒體與文字放入原生發文視窗；目前不會按「分享／發佈」，請人工確認。','ok');button.textContent='已寫入，等待人工確認';
    }catch(error){report.error=String(error.message||error);note('failed',report.error);say('寫入測試停止：'+report.error+'。草稿仍保留，可回報此訊息修正。','bad');button.disabled=false}
  }
  button.textContent='寫入平台（不送出）';button.disabled=!root.__singleDraft;button.onclick=writeDraft;
  root.addEventListener('33:draft-ready',()=>{button.disabled=false;button.textContent='寫入平台（不送出）'});root.addEventListener('33:draft-cancelled',()=>{button.disabled=true;button.textContent='寫入平台（不送出）'});
})();
