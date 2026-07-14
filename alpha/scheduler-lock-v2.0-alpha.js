(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler');
  if(!root||root.dataset.verifyLock==='1')return;
  root.dataset.verifyLock='1';
  const style=document.createElement('style');
  style.textContent=`
#fb-ad-alpha-local-scheduler header{background:linear-gradient(110deg,#202023,#2d292b 72%,#482126)!important;border-bottom-color:#62343a!important}
#fb-ad-alpha-local-scheduler .verify{margin:13px 0;padding:11px;border:1px solid #474143;border-radius:9px;background:#0e0e10}
#fb-ad-alpha-local-scheduler .verify label{margin-top:0}
#fb-ad-alpha-local-scheduler .verify .row input{flex:1.7}
#fb-ad-alpha-local-scheduler .verify-note{margin-top:7px;color:#8f8885;font-size:10px}
#fb-ad-alpha-local-scheduler .card.active{background:#282326!important;border-color:#a6474e!important;box-shadow:inset 3px 0 #bd545b!important}
#fb-ad-alpha-local-scheduler .card:disabled{filter:grayscale(1);background:#202023!important;border-color:#414143!important;color:#777!important;opacity:.58}
#fb-ad-alpha-local-scheduler .card:disabled span{color:#666!important}
#fb-ad-alpha-local-scheduler .phase{background:#24191b!important;color:#d0aaa8!important}
`;
  root.append(style);
  const cards=root.querySelector('.cards'),track=root.querySelector('#m-track'),schedule=root.querySelector('#m-schedule'),trackPanel=root.querySelector('#p-track'),schedulePanel=root.querySelector('#p-schedule');
  if(!cards||!track||!schedule)return;
  track.disabled=true;schedule.disabled=true;track.classList.remove('active');schedule.classList.remove('active');
  if(trackPanel)trackPanel.hidden=true;if(schedulePanel)schedulePanel.hidden=true;
  const verify=document.createElement('div');verify.className='verify';
  verify.innerHTML='<label for="m-code">使用通行碼</label><div class="row"><input id="m-code" type="password" autocomplete="one-time-code" placeholder="輸入官方 LINE 取得的通行碼"><button class="primary" id="m-verify">解鎖面板</button></div><div class="status" id="m-verify-status">尚未驗證；功能目前為灰階鎖定。</div><div class="verify-note">通行碼由 33 廣告管理助手官方 LINE 提供。</div>';
  cards.before(verify);
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
