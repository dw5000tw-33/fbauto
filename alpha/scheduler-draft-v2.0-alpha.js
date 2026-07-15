(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler'),panel=root?.querySelector('#p-schedule');
  if(!root||!panel||root.dataset.singleDraft==='1')return;
  root.dataset.singleDraft='1';
  const draft=root.querySelector('#s-draft'),preview=root.querySelector('#s-preview'),time=root.querySelector('#s-time'),check=root.querySelector('#s-check'),start=root.querySelector('#s-start'),cancel=root.querySelector('#s-cancel'),send=root.querySelector('#s-now'),status=root.querySelector('#s-status');
  if(!draft||!preview||!time||!check||!start||!cancel||!send||!status)return;
  const style=document.createElement('style');
  style.textContent=`
#fb-ad-alpha-local-scheduler .draft-file{margin-top:10px;padding:10px;border:1px solid #5a4d4f;border-radius:8px;background:#111113}
#fb-ad-alpha-local-scheduler .draft-file input[type=file]{padding:7px;font-size:11px}
#fb-ad-alpha-local-scheduler .draft-file input[type=file]::file-selector-button{margin-right:8px;border:1px solid #e24b5e;border-radius:6px;padding:6px 9px;background:#b61f34;color:#fff;cursor:pointer}
#fb-ad-alpha-local-scheduler .draft-media{display:flex;gap:10px;align-items:center;margin-top:9px}
#fb-ad-alpha-local-scheduler .draft-media img,#fb-ad-alpha-local-scheduler .draft-media video{width:92px;height:92px;object-fit:cover;border:1px solid #e24b5e;border-radius:7px;background:#08080a}
#fb-ad-alpha-local-scheduler .draft-media .meta{min-width:0;color:#ddd2ce;font-size:10px;line-height:1.45;word-break:break-all}
#fb-ad-alpha-local-scheduler .topic-options{margin-top:10px;padding:10px;border:1px solid #5a4d4f;border-radius:8px;background:#111113}
#fb-ad-alpha-local-scheduler .topic-options .topic-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
#fb-ad-alpha-local-scheduler .topic-options .topic-manual[hidden]{display:none}
#fb-ad-alpha-local-scheduler .topic-options .check-row{display:flex;align-items:flex-start;gap:8px;margin-top:9px;color:#eee7e2;font-size:11px;line-height:1.4}
#fb-ad-alpha-local-scheduler .topic-options .check-row input{width:auto;margin-top:2px}
#fb-ad-alpha-local-scheduler .topic-options .topic-hint{margin-top:7px;color:#b9aaa7;font-size:10px;line-height:1.45}
#fb-ad-alpha-local-scheduler .schedule-locked{opacity:.58;pointer-events:none;filter:grayscale(.25)}
#fb-ad-alpha-local-scheduler #s-check,#fb-ad-alpha-local-scheduler #s-now{display:none!important}
`;
  root.append(style);
  const holder=document.createElement('div');holder.className='draft-file';
  holder.innerHTML='<label for="s-image">預選照片或影片（第一版限一個檔案）</label><input id="s-image" type="file" accept="image/*,video/*"><div class="draft-media" hidden><div class="media-preview"></div><div class="meta"></div></div><div class="verify-note">媒體只暫存在目前分頁的記憶體；關閉或重新整理後需要重新選取。</div>';
  preview.before(holder);preview.hidden=true;
  const image=holder.querySelector('#s-image'),media=holder.querySelector('.draft-media'),mediaPreview=holder.querySelector('.media-preview'),meta=holder.querySelector('.meta');
  const topicBox=document.createElement('div');topicBox.className='topic-options';topicBox.innerHTML='<label style="margin-top:0">Threads 社群／主題</label><div class="topic-row"><select class="topic-mode"><option value="recent">最近使用（預設）</option><option value="manual">手動指定</option><option value="none">不加主題</option></select><input class="topic-manual" placeholder="輸入主題名稱" hidden></div><div class="topic-hint"></div><label class="check-row"><input class="ai-label" type="checkbox" checked><span>內容包含 AI 生成或修改，發佈前新增 AI 標籤</span></label>';holder.after(topicBox);
  const topicMode=topicBox.querySelector('.topic-mode'),topicManual=topicBox.querySelector('.topic-manual'),topicHint=topicBox.querySelector('.topic-hint'),aiLabel=topicBox.querySelector('.ai-label');
  const topicHints={recent:'從 Threads 原生清單選用帳號過去使用過的社群／主題。',manual:'輸入主題名稱；將採用 Threads 原生候選，或建立可用的新主題。',none:'不加入社群／主題，交由 Threads 一般推薦系統分發（最快）。'};
  const syncTopic=()=>{topicManual.hidden=topicMode.value!=='manual';topicHint.textContent=topicHints[topicMode.value]||''};
  topicBox.hidden=root.querySelector('#s-platform')?.value!=='threads';root.querySelector('#s-platform')?.addEventListener('change',e=>topicBox.hidden=e.target.value!=='threads');topicMode.onchange=syncTopic;syncTopic();
  draft.style.minHeight='42px';draft.style.height='42px';draft.style.overflowY='hidden';const growDraft=()=>{draft.style.height='42px';draft.style.height=Math.min(150,Math.max(42,draft.scrollHeight))+'px';draft.style.overflowY=draft.scrollHeight>150?'auto':'hidden'};draft.addEventListener('input',growDraft);growDraft();
  let file=null,objectUrl='',timer=null,scheduledAt=0,snapshot=null;
  const say=(text,kind='')=>{status.textContent=text;status.className='status '+kind};
  const clearUrl=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=''};
  const formatBytes=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';
  const readForm=()=>({text:draft.value.trim(),timeValue:time.value,timeMs:new Date(time.value).getTime(),file});
  const formControls=[time,root.querySelector('#s-platform'),draft,image,topicMode,topicManual,aiLabel].filter(Boolean);
  const lockForm=locked=>{formControls.forEach(control=>control.disabled=locked);[time,root.querySelector('#s-platform'),draft,holder,topicBox].filter(Boolean).forEach(el=>el.classList.toggle('schedule-locked',locked))};
  const validate=form=>{if(!form.text){say('請先輸入發文文字。','bad');draft.focus();return false}if(!form.file){say('請先由面板選取一張照片或一支影片。','bad');image.focus();return false}if(!Number.isFinite(form.timeMs)||form.timeMs<=Date.now()){say('請選擇晚於現在的預定時間。','bad');time.focus();return false}return true};
  image.onchange=()=>{clearUrl();mediaPreview.innerHTML='';file=image.files?.[0]||null;if(!file){media.hidden=true;return}const isImage=file.type.startsWith('image/'),isVideo=file.type.startsWith('video/');if(!isImage&&!isVideo){file=null;image.value='';media.hidden=true;say('目前只支援圖片或影片。','bad');return}objectUrl=URL.createObjectURL(file);const view=document.createElement(isVideo?'video':'img');view.src=objectUrl;if(isVideo){view.controls=true;view.muted=true;view.preload='metadata'}else view.alt='預選照片預覽';mediaPreview.append(view);meta.textContent=file.name+'｜'+formatBytes(file.size)+'｜'+(file.type||(isVideo?'影片':'圖片'));media.hidden=false;say((isVideo?'影片':'照片')+'已由使用者選取並暫存在目前分頁。','ok')};
  check.hidden=true;start.textContent='建立單筆預排';send.hidden=true;send.disabled=true;
  const stopTimer=()=>{if(timer)clearTimeout(timer);timer=null;scheduledAt=0;cancel.disabled=true;start.disabled=false;lockForm(false)};
  const tick=()=>{const remain=scheduledAt-Date.now();if(remain<=0){timer=null;cancel.disabled=true;start.disabled=false;say('預排時間已到，正在執行原生分享…','ok');root.dispatchEvent(new CustomEvent('33:schedule-due',{detail:{draft:snapshot}}));return}const sec=Math.ceil(remain/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;say('單筆預排已建立，倒數 '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'；內容已鎖定，請保持原生發文視窗開啟。','ok');timer=setTimeout(tick,Math.min(1000,remain))};
  start.onclick=()=>{const form=readForm();if(!validate(form))return;if(root.querySelector('#s-platform')?.value==='threads'&&topicMode.value==='manual'&&!topicManual.value.trim()){say('請輸入要手動指定的 Threads 主題名稱。','bad');topicManual.focus();return}stopTimer();snapshot={schema:'33-single-post-draft-v2',platform:root.querySelector('#s-platform')?.value||'',text:form.text,scheduledAt:new Date(form.timeMs).toISOString(),media:{name:form.file.name,type:form.file.type,size:form.file.size,kind:form.file.type.startsWith('video/')?'video':'image'},topic:{mode:topicMode.value,value:topicManual.value.trim(),aiLabel:aiLabel.checked},file:form.file};root.__singleDraft=snapshot;scheduledAt=form.timeMs;cancel.disabled=false;start.disabled=true;lockForm(true);root.dispatchEvent(new CustomEvent('33:draft-ready'));tick()};
  cancel.onclick=()=>{stopTimer();snapshot=null;root.__singleDraft=null;root.dispatchEvent(new CustomEvent('33:draft-cancelled'));say('已取消單筆預排；內容已解除鎖定，可以修改後重新建立。')};
  root.addEventListener('33:share-complete',()=>{stopTimer();snapshot=null;root.__singleDraft=null;draft.value='';draft.dispatchEvent(new Event('input',{bubbles:true}));clearUrl();file=null;image.value='';media.hidden=true;mediaPreview.innerHTML='';meta.textContent='';send.disabled=true});
  window.addEventListener('beforeunload',clearUrl,{once:true});
})();
