(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-manager-alpha-v20');
  if(!root||root.dataset.seriesStyle==='1')return;
  root.dataset.seriesStyle='1';root.classList.add('series-locked');
  const style=document.createElement('style');
  style.textContent=`
#fb-ad-manager-alpha-v20{color:#fff!important}
#fb-ad-manager-alpha-v20 .box{border-color:#146fd1!important;background:#111a2c!important;box-shadow:0 24px 70px #000b,0 0 0 1px #051020 inset!important}
#fb-ad-manager-alpha-v20 header{position:relative;background:linear-gradient(115deg,#0878df 0 58%,#101722 58% 72%,#0758a8 72% 100%)!important;border-bottom:1px solid #60b7ff!important}
#fb-ad-manager-alpha-v20 header h1{position:relative;z-index:1;color:#fff!important;text-shadow:0 1px 2px #001d3d!important}
#fb-ad-manager-alpha-v20 header .tag,#fb-ad-manager-alpha-v20 header .close{position:relative;z-index:1;color:#fff!important}
#fb-ad-manager-alpha-v20 main{background:linear-gradient(180deg,#16233a,#0b1322)!important}
#fb-ad-manager-alpha-v20 p,#fb-ad-manager-alpha-v20 label{color:#eff7ff!important}
#fb-ad-manager-alpha-v20 .verify{border-color:#315d8f!important;background:#0b1729!important}
#fb-ad-manager-alpha-v20 input,#fb-ad-manager-alpha-v20 textarea,#fb-ad-manager-alpha-v20 select{border-color:#527da9!important;background:#07111f!important;color:#fff!important}
#fb-ad-manager-alpha-v20 input::placeholder,#fb-ad-manager-alpha-v20 textarea::placeholder{color:#9bb0c8!important}
#fb-ad-manager-alpha-v20 .primary{background:#1598ed!important;color:#fff!important;border:1px solid #6dc9ff!important}
#fb-ad-manager-alpha-v20 .secondary{background:#1264ad!important;color:#fff!important;border:1px solid #398bd0!important}
#fb-ad-manager-alpha-v20 .cards{gap:9px!important}
#fb-ad-manager-alpha-v20 .card{background:#172238!important;border-color:#345579!important;color:#fff!important;opacity:1!important}
#fb-ad-manager-alpha-v20 .card b{color:#fff!important}
#fb-ad-manager-alpha-v20 .card span{color:#cbd9e9!important}
#fb-ad-manager-alpha-v20.series-locked .card{filter:grayscale(1);background:#242a34!important;border-color:#4d5661!important;color:#858b93!important;opacity:.58!important}
#fb-ad-manager-alpha-v20.series-locked .card span{color:#777f89!important}
#fb-ad-manager-alpha-v20 .card.series-active{background:#172a46!important;border-color:#54b8ff!important;box-shadow:inset 4px 0 #35a9ff!important}
#fb-ad-manager-alpha-v20 .groups,#fb-ad-manager-alpha-v20 .marketplace,#fb-ad-manager-alpha-v20 .tracker{background:#0e192a!important;border-color:#315d8f!important}
#fb-ad-manager-alpha-v20 .result{border-top-color:#29496c!important;color:#e3effc!important}
#fb-ad-manager-alpha-v20 .result button,#fb-ad-manager-alpha-v20 .group-nav button{background:#13558f!important;color:#fff!important;border:1px solid #2e7fbd!important}
#fb-ad-manager-alpha-v20 .status{color:#c2d2e5!important}
#fb-ad-manager-alpha-v20 .ok{color:#8ee7ad!important}
#fb-ad-manager-alpha-v20 .bad{color:#ffaaa9!important}
#fb-ad-manager-alpha-v20 footer{color:#9db2ca!important}
`;
  root.append(style);
  const status=root.querySelector('#fb-ad-alpha-status'),cards=[...root.querySelectorAll('.card')];
  const sync=()=>{const unlocked=/驗證成功|已解鎖/.test(status?.textContent||'');root.classList.toggle('series-locked',!unlocked)};
  if(status)new MutationObserver(sync).observe(status,{childList:true,subtree:true,characterData:true});sync();
  const pairs=[['#fb-ad-alpha-groups-card','#fb-ad-alpha-groups'],['#fb-ad-alpha-marketplace-card','#fb-ad-alpha-marketplace'],['#fb-ad-alpha-track-card','#fb-ad-alpha-tracker']];
  pairs.forEach(([cardSelector,panelSelector])=>{const card=root.querySelector(cardSelector),panel=root.querySelector(panelSelector);if(!card)return;card.addEventListener('click',()=>{setTimeout(()=>{cards.forEach(x=>x.classList.remove('series-active'));if(!root.classList.contains('series-locked')&&panel&&!panel.hidden)card.classList.add('series-active')},0)})});
})();
