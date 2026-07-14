(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler');
  if(!root||root.dataset.verifyLock==='1')return;
  root.dataset.verifyLock='1';
  const style=document.createElement('style');
  style.textContent=`
#fb-ad-alpha-local-scheduler{color:#fff!important}
#fb-ad-alpha-local-scheduler .shell{border-color:#8f1829!important;background:#121214!important}
#fb-ad-alpha-local-scheduler header{position:relative;background:linear-gradient(115deg,#b3122b 0 58%,#171719 58% 72%,#851021 72% 100%)!important;border-bottom-color:#e54a5d!important}
#fb-ad-alpha-local-scheduler header h1{position:relative;z-index:1;color:#fff!important;text-shadow:0 1px 2px #000!important}
#fb-ad-alpha-local-scheduler header .tag{position:relative;z-index:1;color:#fff!important}
#fb-ad-alpha-local-scheduler header .close{position:relative;z-index:1;color:#fff!important}
#fb-ad-alpha-local-scheduler main{background:linear-gradient(180deg,#1d1d20,#101012)!important}
#fb-ad-alpha-local-scheduler p,#fb-ad-alpha-local-scheduler label{color:#f3efed!important}
#fb-ad-alpha-local-scheduler .verify{margin:13px 0;padding:11px;border:1px solid #474143;border-radius:9px;background:#0e0e10}
#fb-ad-alpha-local-scheduler .verify label{margin-top:0}
#fb-ad-alpha-local-scheduler .verify .row input{flex:1.7}
#fb-ad-alpha-local-scheduler .verify-note{margin-top:7px;color:#8f8885;font-size:10px}
#fb-ad-alpha-local-scheduler .card{background:#242427!important;border-color:#6c5558!important;color:#fff!important}
#fb-ad-alpha-local-scheduler .card span{color:#ddd4d0!important}
#fb-ad-alpha-local-scheduler .card.active{background:#2b2426!important;border-color:#e23f52!important;box-shadow:inset 4px 0 #e23f52!important}
#fb-ad-alpha-local-scheduler .card:disabled{filter:grayscale(1);background:#202023!important;border-color:#414143!important;color:#777!important;opacity:.58}
#fb-ad-alpha-local-scheduler .card:disabled span{color:#666!important}
#fb-ad-alpha-local-scheduler .panel{background:#171719!important;border-color:#5a4d4f!important}
#fb-ad-alpha-local-scheduler input,#fb-ad-alpha-local-scheduler textarea,#fb-ad-alpha-local-scheduler select{background:#0a0a0c!important;border-color:#776467!important;color:#fff!important}
#fb-ad-alpha-local-scheduler input::placeholder,#fb-ad-alpha-local-scheduler textarea::placeholder{color:#aaa!important}
#fb-ad-alpha-local-scheduler button.primary{background:#b61f34!important;border-color:#e24b5e!important;color:#fff!important}
#fb-ad-alpha-local-scheduler .phase{background:#b61f34!important;border-color:#e24b5e!important;color:#fff!important}
#fb-ad-alpha-local-scheduler .manual{background:#292326!important;border-left-color:#e23f52!important;color:#eee5e1!important}
#fb-ad-alpha-local-scheduler #t-message{height:40px;min-height:40px;max-height:84px;overflow:hidden;resize:none}
#fb-ad-alpha-local-scheduler .status{color:#ddd2ce!important}
`;
  root.append(style);
  const cards=root.querySelector('.cards'),track=root.querySelector('#m-track'),schedule=root.querySelector('#m-schedule'),trackPanel=root.querySelector('#p-track'),schedulePanel=root.querySelector('#p-schedule');
  if(!cards||!track||!schedule)return;
  track.disabled=true;schedule.disabled=true;track.classList.remove('active');schedule.classList.remove('active');
  if(trackPanel)trackPanel.hidden=true;if(schedulePanel)schedulePanel.hidden=true;
  const verify=document.createElement('div');verify.className='verify';
  verify.innerHTML='<label for="m-code">使用通行碼</label><div class="row"><input id="m-code" type="password" autocomplete="one-time-code" placeholder="輸入官方 LINE 取得的通行碼"><button class="primary" id="m-verify">解鎖面板</button></div><div class="status" id="m-verify-status">尚未驗證；功能目前為灰階鎖定。</div><div class="verify-note">通行碼由 33 廣告管理助手官方 LINE 提供。</div>';
  cards.before(verify);
  const message=root.querySelector('#t-message'),messageLabel=root.querySelector('label[for="t-message"]');
  if(messageLabel)messageLabel.textContent='預備留言（選填）';
  if(message){message.placeholder='選填；定位後可自行按愛心，或需要時再複製留言';message.addEventListener('input',()=>{message.style.height='40px';message.style.height=Math.min(84,Math.max(40,message.scrollHeight))+'px'})}
  const input=verify.querySelector('#m-code'),button=verify.querySelector('#m-verify'),status=verify.querySelector('#m-verify-status'),ORIGIN='https://dw5000tw-33.github.io';
  const say=(text,kind='')=>{status.textContent=text;status.className='status '+kind};
  const unlock=()=>{track.disabled=false;schedule.disabled=false;track.classList.add('active');if(trackPanel)trackPanel.hidden=false;say('✓ 通行碼驗證成功，功能已解鎖。','ok')};
  const begin=()=>{
    const code=input.value.trim();if(!code){say('請先輸入通行碼。','bad');input.focus();return}
    const nonce=crypto.getRandomValues(new Uint32Array(3)).join('-')+'-'+Date.now(),w=window.open(ORIGIN+'/fbauto/alpha/verify-loader.html?nonce='+encodeURIComponent(nonce),'fb-ad-alpha-verify','width=440,height=260');
    if(!w){say('請允許彈出式視窗後再試。','bad');return}
    button.disabled=true;say('正在驗證通行碼…');
    const timer=setTimeout(()=>finish({ok:false,reason:'TIMEOUT'}),45000);
    const onMessage=e=>{if(e.origin!==ORIGIN||e.source!==w||!e.data||e.data.nonce!==nonce)return;if(e.data.type==='FB_AD_ALPHA_VERIFY_READY')w.postMessage({type:'FB_AD_ALPHA_VERIFY_CODE',nonce,code},ORIGIN);if(e.data.type==='FB_AD_ALPHA_VERIFY_RESULT')finish(e.data)};
    const finish=data=>{clearTimeout(timer);window.removeEventListener('message',onMessage);button.disabled=false;input.value='';if(data.ok)unlock();else{const words={CODE_REQUIRED:'請輸入通行碼。',CODE_NOT_FOUND:'找不到此通行碼。',NETWORK_ERROR:'驗證服務暫時無法連線。',TIMEOUT:'驗證逾時，請再試一次。'};say(words[data.reason]||'驗證未通過，請確認通行碼。','bad')}};
    window.addEventListener('message',onMessage);
  };
  button.onclick=begin;input.onkeydown=e=>{if(e.key==='Enter')begin()};
})();
