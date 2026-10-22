(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-manager-alpha-v20'),model=window.WorksAlphaListings;
  if(!root||!model||root.dataset.listingCenter)return;root.dataset.listingCenter='2.1';
  const panel=root.querySelector('#fb-ad-alpha-marketplace'),card=root.querySelector('#fb-ad-alpha-marketplace-card');
  let repo=null,records=[],editId=null,detailId=null,disposed=false,working=false,photoDraft=[],photoDirty=false,page=0;
  const selected=new Set(),urls=new Set(),$=s=>panel.querySelector(s),uid=()=>crypto.randomUUID(),now=()=>new Date().toISOString();
  const css=document.createElement('style');css.textContent=`
#fb-ad-manager-alpha-v20.listing-wide{width:min(1000px,calc(100vw - 28px));max-width:calc(100vw - 28px)}
#fb-ad-manager-alpha-v20.listing-wide.minimized{width:min(330px,calc(100vw - 28px))}
#fb-ad-manager-alpha-v20 .listing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px}
#fb-ad-manager-alpha-v20 .listing-card{border:1px solid #345579;border-radius:12px;padding:12px;background:#172238;min-width:0}
#fb-ad-manager-alpha-v20 .listing-card img{width:100%;height:140px;object-fit:cover;border-radius:8px}
#fb-ad-manager-alpha-v20 .listing-card p{margin:5px 0;overflow-wrap:anywhere}
#fb-ad-manager-alpha-v20 .listing-card .row{flex-wrap:wrap}
#fb-ad-manager-alpha-v20 .listing-card input[type=checkbox]{width:auto;flex:none}
#fb-ad-manager-alpha-v20 .listing-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:12px 0}
#fb-ad-manager-alpha-v20 .listing-form label{margin:0}
#fb-ad-manager-alpha-v20 .listing-form input,#fb-ad-manager-alpha-v20 select{width:100%;min-width:0;padding:8px;background:#07111f;color:white;border:1px solid #527da9;border-radius:6px}
#fb-ad-manager-alpha-v20 .listing-record{margin-top:10px;border-top:1px solid #345579;padding:10px 0;font-size:12px;overflow-wrap:anywhere}
#fb-ad-manager-alpha-v20 .listing-record .row{flex-wrap:wrap}
#fb-ad-manager-alpha-v20 .marketplace>.row{flex-wrap:wrap}
#fb-ad-manager-alpha-v20 #lc-search{flex:2 1 180px;width:auto}
#fb-ad-manager-alpha-v20 #lc-filter{flex:1 1 170px;width:auto}
#fb-ad-manager-alpha-v20 .photo-draft{display:flex;gap:6px;flex-wrap:wrap}
#fb-ad-manager-alpha-v20 .photo-draft img{height:70px;width:90px;object-fit:cover}
#fb-ad-manager-alpha-v20 .listing-error{color:#ffaaa9}
#fb-ad-manager-alpha-v20 .marketplace [hidden]{display:none!important}
`;root.append(css);
  card.innerHTML='<b>物件刊登中心</b><span>案件、照片、Marketplace與社團紀錄</span>';
  panel.innerHTML=`<div class="row"><button id="lc-new" class="secondary">＋建立案件</button><button id="lc-export" class="secondary">匯出備份</button><button id="lc-import" class="secondary">還原備份</button><input id="lc-import-file" type="file" accept="application/json" hidden><button id="lc-delete" class="secondary">刪除已勾選案件</button></div>
<p class="hint">一案建檔一次。刊登與社團貼文各自記錄；原生發布、儲存及刪除最後由你確認。資料存在本瀏覽器，跨裝置請匯出備份。</p>
<div class="row"><input id="lc-search" placeholder="搜尋編號、標題、地址"><select id="lc-filter"><option value="">所有案件狀態</option><option>有效</option><option>暫停</option><option>已成交</option></select></div>
<div id="lc-status" class="status">開啟資料庫中…</div>
<section id="lc-editor" hidden><h3>案件資料</h3><form id="lc-form"><div class="listing-form">
${[['code','委託編號'],['title','標題'],['price','價格'],['address','完整地址'],['district','行政區（依地址）'],['community','社區'],['floor','樓層'],['area','總建坪'],['layout','格局'],['parking','車位'],['agent','承辦人'],['phone','電話']].map(([key,title])=>`<label>${title}<input name="${key}" ${key==='district'?'readonly':''} ${key==='price'?'type="number" min="0" step="any"':''} ${key==='title'?'required':''}></label>`).join('')}
<label>交易類型<select name="transaction"><option>出售</option><option>出租</option></select></label><label>價格單位<select name="unit"><option>萬元</option><option>元/月</option><option>元</option></select></label><label>案件狀態<select name="state"><option>有效</option><option>暫停</option><option>已成交</option></select></label></div>
<label>刊登文案<textarea name="description"></textarea></label><label>加入照片（最多20張、每張10MB）<input id="lc-photos" type="file" accept="image/*" multiple></label><p>第一張為封面；可往前移動調整順序。</p><div id="lc-photo-draft" class="photo-draft"></div>
<button class="secondary" type="submit">儲存案件</button><button id="lc-cancel" type="button" class="secondary">取消</button></form></section>
<div id="lc-grid" class="listing-grid"></div><div class="row"><button id="lc-prev" class="secondary">上一頁</button><span id="lc-page"></span><button id="lc-next" class="secondary">下一頁</button></div><section id="lc-detail" hidden></section>`;
  const say=(s,error=false)=>{$('#lc-status').textContent=s;$('#lc-status').classList.toggle('listing-error',error);};
  const authorized=()=>{if(root.dataset.socialVerified==='1')return true;say('請先完成通行碼驗證。',true);return false;};
  const log=(caseId,action,detail)=>({id:uid(),kind:'log',caseId,action,detail,at:now()});
  const cases=()=>records.filter(r=>r.kind==='case'),publications=id=>records.filter(r=>r.kind==='publication'&&r.caseId===id),photos=id=>records.filter(r=>r.kind==='photo'&&r.caseId===id).sort((a,b)=>a.order-b.order);
  const objectUrl=blob=>{const url=URL.createObjectURL(blob);urls.add(url);return url;};
  const revoke=()=>{urls.forEach(url=>URL.revokeObjectURL(url));urls.clear();};
  async function reload(){records=await repo.all();if(!disposed)render();}
  async function mutate(work){if(working||disposed||!authorized())return;if(!repo){say('資料庫尚未就緒，請稍後再試。',true);return;}working=true;try{await work();await reload();}catch(e){say(e.name==='ConstraintError'?'案件識別碼已存在，未重複建檔。':e.message,true);}finally{working=false;}}
  const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=text;b.onclick=()=>{if(authorized())return fn();};return b;};
  const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
  function render(){
    revoke();const grid=$('#lc-grid');grid.replaceChildren();const search=model.normalize($('#lc-search').value),state=$('#lc-filter').value;
    const filtered=cases().filter(c=>(!state||c.state===state)&&(!search||model.normalize(c.code+c.title+c.address).includes(search)));
    const pages=Math.max(1,Math.ceil(filtered.length/30));page=Math.min(page,pages-1);$('#lc-page').textContent=`${page+1}/${pages}頁，共${filtered.length}筆`;$('#lc-prev').disabled=page===0;$('#lc-next').disabled=page>=pages-1;
    for(const item of filtered.slice(page*30,page*30+30)){
      const box=document.createElement('article');box.className='listing-card';const check=document.createElement('input');check.type='checkbox';check.checked=selected.has(item.id);check.setAttribute('aria-label','選取 '+item.title);check.onchange=()=>check.checked?selected.add(item.id):selected.delete(item.id);box.append(check);
      const media=photos(item.id);if(media.length){const img=document.createElement('img');img.src=objectUrl(media[0].blob);img.alt=item.title;box.append(img);}else box.append(text('p','尚無照片'));
      const pubs=publications(item.id),market=pubs.filter(p=>p.channel==='marketplace'),groups=pubs.filter(p=>p.channel==='group');
      box.append(text('h3',item.title),text('p',`${item.code||'未填編號'}｜${item.price??'未填價格'} ${item.unit}`),text('p',`案件：${item.state}｜照片${media.length}張`),text('p',`Marketplace：${market.map(p=>p.status).join('、')||'未建紀錄'}`),text('p',`社團：已發布${groups.filter(p=>p.status==='已發布（人工確認）').length}／共${groups.length}，失敗${groups.filter(p=>p.status==='失敗').length}`));
      const dates=pubs.filter(p=>p.publishedAt).map(p=>p.publishedAt).sort();box.append(text('p','最近刊登：'+(dates.length?new Date(dates.at(-1)).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'尚無確認紀錄')));
      const row=document.createElement('div');row.className='row';row.append(button('編輯',()=>edit(item.id)),button('刊登／修改／下架',()=>showDetail(item.id)));box.append(row);grid.append(box);
    }
    if(detailId)showDetail(detailId);if(!$('#lc-editor').hidden)renderDraftPhotos();
  }
  function renderDraftPhotos(){const box=$('#lc-photo-draft');box.replaceChildren();photoDraft.forEach((photo,index)=>{const holder=document.createElement('div'),img=document.createElement('img');img.src=objectUrl(photo.blob);img.alt=photo.name||'照片';holder.append(img,button('往前',()=>{if(index>0){[photoDraft[index-1],photoDraft[index]]=[photoDraft[index],photoDraft[index-1]];photoDirty=true;renderDraftPhotos();}}),button('移除照片',()=>{photoDraft.splice(index,1);photoDirty=true;renderDraftPhotos();}));box.append(holder);});}
  function edit(id=null){if(!repo||!authorized())return;editId=id;const form=$('#lc-form');form.reset();const item=cases().find(c=>c.id===id);if(item)for(const [k,v]of Object.entries(item)){const field=form.elements.namedItem(k);if(field)field.value=v??'';}photoDraft=item?photos(id).map(p=>({...p})):[];photoDirty=false;$('#lc-editor').hidden=false;renderDraftPhotos();}
  $('#lc-new').onclick=()=>edit();$('#lc-cancel').onclick=()=>{$('#lc-editor').hidden=true;photoDraft=[];};
  $('#lc-form').elements.namedItem('address').oninput=e=>{$('#lc-form').elements.namedItem('district').value=model.district(e.target.value);};
  $('#lc-photos').onchange=async e=>{try{const files=[...e.target.files];if(files.length+photoDraft.length>20)throw Error('每案最多20張照片。');for(const file of files){if(!/^image\//.test(file.type)||file.size>10*1024*1024)throw Error('請選擇每張10MB以下的圖片。');}for(const file of files)photoDraft.push({id:uid(),kind:'photo',blob:file,name:file.name});photoDirty=true;renderDraftPhotos();}catch(error){say(error.message,true);}finally{e.target.value='';}};
  $('#lc-form').onsubmit=e=>{e.preventDefault();return mutate(async()=>{
    const values=Object.fromEntries(new FormData(e.currentTarget)),existing=cases().find(c=>c.id===editId),item=model.validateCase({...values,id:existing?.id||uid(),kind:'case',version:(existing?.version||0)+1,createdAt:existing?.createdAt||now(),updatedAt:now()});
    if(cases().some(c=>c.id!==item.id&&model.duplicate(c,item)))throw Error('委託編號或地址／樓層與既有案件重複，請編輯原案件。');
    const ops=[{put:item},{put:log(item.id,existing?'修改案件':'建立案件',`版本${item.version}`)}];
    if(photoDirty||!existing){photos(item.id).forEach(p=>ops.push({delete:p.id}));photoDraft.forEach((p,order)=>ops.push({put:{...p,caseId:item.id,order}}));}
    await repo.batch(ops);$('#lc-editor').hidden=true;say('案件已儲存；既有刊登的舊版本會顯示待同步。');
  });};
  async function addPublications(item,channel){return mutate(async()=>{const targets=channel==='marketplace'?[{}]:root.alphaGroups?.selected()||[];if(!targets.length)throw Error('請先在社團整理勾選目標社團。');const ops=[];for(const target of targets){const candidate=model.publication(item.id,channel,target,item.version,uid());if(publications(item.id).some(p=>p.channel===channel&&p.targetUrl===candidate.targetUrl&&p.status!=='已刪除（人工確認）'))continue;ops.push({put:candidate});}if(!ops.length)throw Error('目標已有刊登紀錄，請使用原紀錄修改。');ops.push({put:log(item.id,'建立刊登紀錄',channel)});await repo.batch(ops);say('已建立獨立通路紀錄，尚未發布。');});}
  const safeFacebook=url=>{try{const u=new URL(url);return u.protocol==='https:'&&/(^|\.)facebook\.com$/.test(u.hostname)?u.href:null;}catch{return null;}};
  async function openNative(item,p){if(!authorized())return;const url=safeFacebook(p.url||p.targetUrl);if(!url){say('沒有可確認的Facebook網址。',true);return;}try{await repo.batch([{put:log(item.id,'開啟原生頁面',url)}]);window.open(url,'_blank','noopener,noreferrer');say('已開啟原生頁面。跨頁後重開Alpha，選同一案件準備填入；發布／儲存由你手動確認。');}catch(e){say(e.message,true);}}
  function showDetail(id){detailId=id;const item=cases().find(c=>c.id===id),box=$('#lc-detail');box.replaceChildren();if(!item){box.hidden=true;detailId=null;return;}box.hidden=false;box.append(text('h3',item.title+'｜刊登管理'),text('p','Marketplace刊登與社團發文各自保存網址及結果。按過按鈕不代表成功。'));
    const row=document.createElement('div');row.className='row';row.append(button('建立Marketplace紀錄',()=>addPublications(item,'marketplace')),button('加入勾選社團',()=>addPublications(item,'group')),button('準備填入本頁原生表單',()=>prepareNative(item)),button('下載本案照片',()=>downloadPhotos(item)));box.append(row);
    for(const p of publications(id)){
      const line=document.createElement('div');line.className='listing-record';line.append(text('strong',`${p.channel==='marketplace'?'Marketplace':'社團發文'}｜${p.targetName}`),text('p',`狀態：${p.status}${model.stale(item,p)?'｜案件已改版，待同步':''}；刊登：${p.publishedAt?new Date(p.publishedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'未確認'}`));
      const link=document.createElement('input');link.placeholder='原生刊登／貼文網址';link.value=p.url;
      const status=document.createElement('select');['草稿','待你送出','待審核','已發布（人工確認）','失敗','結果待確認','已下架（人工確認）','已刪除（人工確認）'].forEach(v=>status.add(new Option(v,v)));status.value=p.status;
      const date=document.createElement('input');date.type='datetime-local';date.value=p.scheduledAt||'';date.setAttribute('aria-label','本機提醒時間（台灣時間）');
      const error=document.createElement('input');error.placeholder='失敗原因或備註';error.value=p.error||'';
      const published=document.createElement('input');published.type='datetime-local';published.value=p.publishedLocal||'';published.setAttribute('aria-label','實際刊登時間（台灣時間）');
      line.append(link,status,text('p','預定提醒時間（台灣時間；需開著本頁）'),date,text('p','實際刊登時間（台灣時間；不確定請留白）'),published,error);
      const deleteCheck=document.createElement('input');deleteCheck.type='checkbox';deleteCheck.setAttribute('aria-label','選取刪除 '+item.title+'／'+p.targetName);const deleteLabel=document.createElement('label');deleteLabel.append(deleteCheck,document.createTextNode('逐筆勾選：準備在Facebook刪除此刊登'));line.append(deleteLabel);
      const controls=document.createElement('div');controls.className='row';controls.append(button('開啟原生刊登／修改／下架',()=>openNative(item,p)),button('儲存紀錄',()=>mutate(async()=>{
        if(link.value&&!safeFacebook(link.value))throw Error('請填寫https的Facebook網址。');
        if(status.value.includes('人工確認')&&!link.value)throw Error('人工確認結果前請保留原生刊登網址。');
        if(status.value.includes('人工確認')&&!confirm(`確認「${item.title}」在「${p.targetName}」的原生狀態為「${status.value}」？`))return;
        const updated={...p,url:link.value,status:status.value,error:error.value,scheduledAt:date.value,publishedLocal:published.value,publishedAt:published.value?new Date(published.value+':00+08:00').toISOString():'',updatedAt:now()};
        if(status.value==='已發布（人工確認）')updated.version=item.version;
        await repo.batch([{put:updated},{put:log(item.id,'更新刊登紀錄',p.targetName+'：'+status.value)}]);say('刊登結果已保存；來源為人工確認。');
      })),button('前往原生刪除（手動最後確認）',()=>{if(!deleteCheck.checked){say('請先逐筆勾選這則刊登的刪除欄位。',true);return;}if(!p.url){say('請先補上這則刊登的網址。',true);return;}if(confirm(`僅開啟「${item.title}／${p.targetName}」，由你在Facebook逐筆確認刪除。是否繼續？`))openNative(item,p);}));line.append(controls);box.append(line);
    }
    const history=records.filter(r=>r.kind==='log'&&r.caseId===id).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,20);const details=document.createElement('details');details.append(text('summary','最近操作紀錄'));history.forEach(l=>details.append(text('p',new Date(l.at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+'｜'+l.action+'｜'+l.detail)));box.append(details);
  }
  async function prepareNative(item){if(!authorized())return;try{
    const onMarket=/^\/marketplace\/(create|edit)/.test(location.pathname),onGroup=/^\/groups\//.test(location.pathname);if(!onMarket&&!onGroup)throw Error('請先到Marketplace建立／編輯頁，或手動開啟目標社團的發文框。');
    const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(el=>!root.contains(el)&&el.getClientRects().length),scope=dialogs.length===1?dialogs[0]:onMarket?document.querySelector('[role="main"]'):null;
    if(!scope)throw Error('原生表單無法唯一確認，請手動填入。');
    const fields=[...scope.querySelectorAll('input,textarea,[contenteditable="true"]')].filter(el=>!root.contains(el)&&el.getClientRects().length),plans=[];
    if(onMarket)for(const [labels,value]of [[['標題','Title'],item.title],[['價格','Price'],item.unit==='萬元'&&item.price!==null?String(item.price*10000):String(item.price??'')],[['說明','描述','Description'],item.description]]){const matches=fields.filter(el=>labels.includes(el.getAttribute('aria-label')||el.getAttribute('placeholder')));if(matches.length!==1)throw Error('標題、價格或說明欄位無法唯一辨識，尚未填入。');plans.push([matches[0],value]);}
    else{const editors=fields.filter(el=>el.getAttribute('contenteditable')==='true'&&el.getAttribute('role')==='textbox');if(editors.length!==1)throw Error('請先手動開啟唯一的社團發文框。');plans.push([editors[0],[item.title,`${item.price??''}${item.unit}`,item.description].filter(Boolean).join('\n')]);}
    for(const [el,value]of plans){const old=el.getAttribute('contenteditable')==='true'?el.textContent:el.value;if(cleanText(old)&&cleanText(old)!==cleanText(value))throw Error('原生框已有不同草稿，未覆蓋。');}
    for(const [el,value]of plans){el.focus();if(el.getAttribute('contenteditable')==='true'){el.textContent=value;el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));}else{Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}}
    say('已準備文字；照片請下載後加入原生上傳框。請核對價格單位與全部欄位，再由你手動發布／儲存。');
  }catch(e){say(e.message,true);}}
  const cleanText=v=>String(v||'').trim();
  function download(name,blob){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function downloadPhotos(item){for(const p of photos(item.id))download(`${item.code||item.id}-${p.order+1}-${p.name||'photo'}`,p.blob);say('已要求下載本案照片；瀏覽器可能需要允許多檔下載。');}
  $('#lc-delete').onclick=()=>mutate(async()=>{const chosen=cases().filter(c=>selected.has(c.id));if(!chosen.length)throw Error('請先逐筆勾選案件。');if(!confirm('永久刪除本機案件與照片（不刪Facebook刊登）：\n'+chosen.map(c=>(c.code||'未填編號')+'｜'+c.title).join('\n')+'\n此操作無法復原。確定刪除這'+chosen.length+'筆？'))return;const ids=new Set(chosen.map(c=>c.id));await repo.batch(records.filter(r=>ids.has(r.id)||ids.has(r.caseId)).map(r=>({delete:r.id})));selected.clear();say('勾選的本機案件已永久刪除，Facebook刊登未變更。');});
  $('#lc-export').onclick=()=>mutate(async()=>{const data=[];for(const r of records){if(r.kind==='photo'){const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(r.blob);});const {blob,...rest}=r;data.push({...rest,dataUrl});}else data.push(r);}download('33works-alpha-listings-'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify({schema:1,records:data})],{type:'application/json'}));say('已匯出含照片的本機備份。');});
  $('#lc-import').onclick=()=>{if(authorized())$('#lc-import-file').click();};
  $('#lc-import-file').onchange=e=>{const file=e.target.files[0];if(!file)return;return mutate(async()=>{
    if(file.size>200*1024*1024)throw Error('備份檔超過200MB。');
    if(records.length)throw Error('還原只允許空資料庫，避免覆蓋既有案件；請先保留現有備份。');
    const data=JSON.parse(await file.text());if(data.schema!==1||!Array.isArray(data.records)||data.records.length>20000)throw Error('備份格式不符。');
    const imported=[],ids=new Set();for(const raw of data.records){if(!raw||typeof raw.id!=='string'||ids.has(raw.id)||!['case','publication','photo','log'].includes(raw.kind))throw Error('備份包含無效或重複識別碼。');ids.add(raw.id);let r={...raw};if(r.kind==='case')r=model.validateCase(r);if(r.kind==='photo'){if(!/^data:image\/[a-z0-9.+-]+;base64,/i.test(r.dataUrl||''))throw Error('備份圖片格式不符。');const mime=r.dataUrl.slice(5,r.dataUrl.indexOf(';')),binary=atob(r.dataUrl.split(',')[1]);if(binary.length>10*1024*1024)throw Error('備份圖片過大。');r.blob=new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))],{type:mime});delete r.dataUrl;}imported.push(r);}
    const caseIds=new Set(imported.filter(r=>r.kind==='case').map(r=>r.id));if(imported.some(r=>r.kind!=='case'&&!caseIds.has(r.caseId)))throw Error('備份含有無對應案件的紀錄。');
    const importedCases=imported.filter(r=>r.kind==='case');if(importedCases.some((c,i)=>importedCases.slice(0,i).some(other=>model.duplicate(c,other))))throw Error('備份含有重複案件，未還原。');
    if(!confirm(`還原${caseIds.size}筆案件及其照片／刊登紀錄到本機？不會發布到Facebook。`))return;
    await repo.batch(imported.map(put=>({put})));say('本機備份已還原，沒有發布或修改Facebook內容。');
  }).finally(()=>{e.target.value='';});};
  $('#lc-prev').onclick=()=>{if(page>0){page--;render();}};$('#lc-next').onclick=()=>{page++;render();};
  $('#lc-search').oninput=()=>{page=0;render();};$('#lc-filter').onchange=()=>{page=0;render();};
  card.onclick=()=>{if(!authorized())return;panel.hidden=!panel.hidden;root.classList.toggle('listing-wide',!panel.hidden);if(!panel.hidden)render();};
  const wideObserver=new MutationObserver(()=>root.classList.toggle('listing-wide',!panel.hidden));wideObserver.observe(panel,{attributes:true,attributeFilter:['hidden']});
  const reminder=setInterval(()=>{if(disposed||panel.hidden)return;const due=records.filter(r=>r.kind==='publication'&&r.scheduledAt&&!r.remindedAt&&new Date(r.scheduledAt+':00+08:00')<=new Date());if(due.length)say(`有${due.length}筆刊登到提醒時間，請開啟案件核對後手動發布。瀏覽器關閉期間不會自動執行。`);},30000);
  root.addEventListener('alpha:dispose',()=>{disposed=true;clearInterval(reminder);wideObserver.disconnect();revoke();repo?.close();});
  model.open().then(async db=>{if(disposed){db.close();return;}repo=db;await reload();say(`已載入${cases().length}筆案件。`);}).catch(e=>say(e.message,true));
})();
