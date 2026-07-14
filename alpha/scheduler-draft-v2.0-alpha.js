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
#fb-ad-alpha-local-scheduler .draft-summary{margin-top:10px;padding:10px;border:1px solid #8f3943;border-radius:8px;background:#1d181a}
#fb-ad-alpha-local-scheduler .draft-summary b{display:block;margin-bottom:6px;color:#fff}
#fb-ad-alpha-local-scheduler .draft-summary .text{max-height:76px;overflow:auto;color:#eee5e1;white-space:pre-wrap;font-size:11px}
#fb-ad-alpha-local-scheduler .draft-summary .when{margin-top:7px;color:#ffb8be;font-size:10px}
`;
  root.append(style);
  const holder=document.createElement('div');holder.className='draft-file';
  holder.innerHTML='<label for="s-image">預選照片或影片（第一版限一個檔案）</label><input id="s-image" type="file" accept="image/*,video/*"><div class="draft-media" hidden><div class="media-preview"></div><div class="meta"></div></div><div class="verify-note">媒體只暫存在目前分頁的記憶體；關閉或重新整理後需要重新選取。</div>';
  preview.before(holder);preview.hidden=true;
  const image=holder.querySelector('#s-image'),media=holder.querySelector('.draft-media'),mediaPreview=holder.querySelector('.media-preview'),meta=holder.querySelector('.meta');
  const summary=document.createElement('div');summary.className='draft-summary';summary.hidden=true;summary.innerHTML='<b>單筆預排草稿</b><div class="text"></div><div class="when"></div>';holder.after(summary);
  let file=null,objectUrl='',timer=null,scheduledAt=0,snapshot=null;
  const say=(text,kind='')=>{status.textContent=text;status.className='status '+kind};
  const clearUrl=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=''};
  const formatBytes=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB';
  const readForm=()=>({text:draft.value.trim(),timeValue:time.value,timeMs:new Date(time.value).getTime(),file});
  const render=form=>{const kind=form.file.type.startsWith('video/')?'影片':'照片';summary.hidden=false;summary.querySelector('.text').textContent=form.text;summary.querySelector('.when').textContent='預定時間：'+new Date(form.timeMs).toLocaleString('zh-TW')+'｜'+kind+'：'+form.file.name};
  const validate=form=>{if(!form.text){say('請先輸入發文文字。','bad');draft.focus();return false}if(!form.file){say('請先由面板選取一張照片或一支影片。','bad');image.focus();return false}if(!Number.isFinite(form.timeMs)||form.timeMs<=Date.now()){say('請選擇晚於現在的預定時間。','bad');time.focus();return false}return true};
  image.onchange=()=>{clearUrl();mediaPreview.innerHTML='';file=image.files?.[0]||null;if(!file){media.hidden=true;return}const isImage=file.type.startsWith('image/'),isVideo=file.type.startsWith('video/');if(!isImage&&!isVideo){file=null;image.value='';media.hidden=true;say('目前只支援圖片或影片。','bad');return}objectUrl=URL.createObjectURL(file);const view=document.createElement(isVideo?'video':'img');view.src=objectUrl;if(isVideo){view.controls=true;view.muted=true;view.preload='metadata'}else view.alt='預選照片預覽';mediaPreview.append(view);meta.textContent=file.name+'｜'+formatBytes(file.size)+'｜'+(file.type||(isVideo?'影片':'圖片'));media.hidden=false;say((isVideo?'影片':'照片')+'已由使用者選取並暫存在目前分頁。','ok')};
  check.textContent='建立草稿預覽';start.textContent='建立單筆預排';send.textContent='下一階段：寫入平台';send.disabled=true;
  check.onclick=()=>{const form=readForm();if(!validate(form))return;render(form);say('時間、文字與媒體已組成一則完整預覽。','ok')};
  const stopTimer=()=>{if(timer)clearTimeout(timer);timer=null;scheduledAt=0;cancel.disabled=true;start.disabled=false};
  const tick=()=>{const remain=scheduledAt-Date.now();if(remain<=0){timer=null;cancel.disabled=true;start.disabled=false;say('預排時間已到，正在執行原生分享…','ok');root.dispatchEvent(new CustomEvent('33:schedule-due',{detail:{draft:snapshot}}));return}const sec=Math.ceil(remain/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;say('單筆草稿已建立，倒數 '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'；請保持原生發文視窗開啟。','ok');timer=setTimeout(tick,Math.min(1000,remain))};
  start.onclick=()=>{const form=readForm();if(!validate(form))return;stopTimer();snapshot={schema:'33-single-post-draft-v2',platform:root.querySelector('#s-platform')?.value||'',text:form.text,scheduledAt:new Date(form.timeMs).toISOString(),media:{name:form.file.name,type:form.file.type,size:form.file.size,kind:form.file.type.startsWith('video/')?'video':'image'},file:form.file};root.__singleDraft=snapshot;root.dispatchEvent(new CustomEvent('33:draft-ready'));render(form);scheduledAt=form.timeMs;cancel.disabled=false;start.disabled=true;tick()};
  cancel.onclick=()=>{stopTimer();snapshot=null;root.__singleDraft=null;root.dispatchEvent(new CustomEvent('33:draft-cancelled'));summary.hidden=true;say('已取消單筆預排；文字與媒體仍保留在面板中。')};
  window.addEventListener('beforeunload',clearUrl,{once:true});
})();
