(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler');
  if(!root||root.dataset.layoutV20)return;root.dataset.layoutV20='1';
  const cards=root.querySelector('.cards'),main=root.querySelector('main');if(!cards||!main)return;
  const style=document.createElement('style');style.textContent=`
#fb-ad-alpha-local-scheduler .shell{display:flex!important;flex-direction:column!important}#fb-ad-alpha-local-scheduler main{min-height:0!important;flex:1 1 auto!important;overflow-y:auto!important}#fb-ad-alpha-local-scheduler .feature-menu{display:none;width:100%;margin:9px 0 2px;padding:8px 10px;background:#35252a;border:1px solid #875159;border-radius:7px;color:#f7dfda;font:700 12px system-ui;cursor:pointer}#fb-ad-alpha-local-scheduler.compact .cards{display:none}#fb-ad-alpha-local-scheduler.compact .feature-menu{display:block}
`;root.append(style);
  const menu=document.createElement('button');menu.type='button';menu.className='feature-menu';cards.after(menu);
  const setCompact=compact=>{root.classList.toggle('compact',compact);menu.textContent=compact?'⌃ 顯示功能選單（需要切換功能時點此）':'⌄ 收起功能選單'};
  menu.onclick=()=>setCompact(!root.classList.contains('compact'));
  cards.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>setCompact(true)));
  setCompact(true);
})();
