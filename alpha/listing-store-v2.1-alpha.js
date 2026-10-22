/* Cases and publications have separate identities. Images stay in IndexedDB as Blobs. */
((global)=>{
  'use strict';
  const normalize=v=>String(v||'').normalize('NFKC').replace(/\s+/g,'').replace(/臺/g,'台').toLowerCase();
  function district(address){return String(address||'').match(/^(?:[\u4e00-\u9fff]{2,3}[縣市])([^縣市區鄉鎮]+[區鄉鎮市])/)?.[1]||'';}
  function duplicate(a,b){
    if(a.code&&b.code)return normalize(a.code)===normalize(b.code);
    // Require a complete address and a floor, or address already containing its floor.
    const address=normalize(a.address),other=normalize(b.address);
    if(!address||address!==other)return false;
    const floor=normalize(a.floor),otherFloor=normalize(b.floor);
    return floor&&otherFloor?floor===otherFloor:/\d+(樓|f)/i.test(address);
  }
  function validateCase(value){
    const item={...value,title:String(value.title||'').trim(),code:String(value.code||'').trim(),address:String(value.address||'').trim(),district:district(value.address),price:value.price===''||value.price==null?null:Number(value.price)};
    if(!item.title)throw Error('請輸入案件標題。');
    if(item.price!==null&&(!Number.isFinite(item.price)||item.price<0))throw Error('價格必須為非負數。');
    delete item.dedupeKey;
    if(item.code)item.dedupeKey='code:'+normalize(item.code);
    else if(item.address&&(item.floor||/\d+(樓|f)/i.test(item.address)))item.dedupeKey='address:'+normalize(item.address)+'|'+normalize(item.floor);
    return item;
  }
  function publication(caseId,channel,target,version,id){
    if(!['marketplace','group'].includes(channel))throw Error('未知刊登通路');
    if(channel==='group'&&!/^https:\/\/(www\.)?facebook\.com\/groups\/[^/?#]+\/?$/.test(target.url||''))throw Error('社團網址不正確');
    return{id,kind:'publication',caseId,channel,targetName:channel==='marketplace'?'Marketplace':target.name,targetUrl:channel==='marketplace'?'https://www.facebook.com/marketplace/create/item':target.url,version,status:'草稿',createdAt:new Date().toISOString(),scheduledAt:'',publishedAt:'',url:'',error:''};
  }
  function stale(item,record){return item.version!==record.version;}
  function open(){
    return new Promise((resolve,reject)=>{
      if(!global.indexedDB){reject(Error('瀏覽器不支援IndexedDB，無法安全保存案件。'));return;}
      const req=global.indexedDB.open('33works-alpha-listings',2);
      req.onupgradeneeded=()=>{const store=req.result.objectStoreNames.contains('records')?req.transaction.objectStore('records'):req.result.createObjectStore('records',{keyPath:'id'});if(!store.indexNames.contains('case-dedupe'))store.createIndex('case-dedupe','dedupeKey',{unique:true});};
      req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('資料庫升級被其他分頁阻擋，請關閉舊Alpha分頁。'));
      req.onsuccess=()=>{
        const db=req.result;db.onversionchange=()=>db.close();
        const batch=operations=>new Promise((res,rej)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');try{operations.forEach(op=>op.delete?store.delete(op.delete):store.put(op.put));}catch(error){tx.abort();rej(error);return;}tx.oncomplete=()=>res();tx.onerror=tx.onabort=()=>rej(tx.error||Error('儲存失敗'));});
        resolve({all:()=>new Promise((res,rej)=>{const req=db.transaction('records').objectStore('records').getAll();req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);}),batch,close:()=>db.close()});
      };
    });
  }
  const api={normalize,district,duplicate,validateCase,publication,stale,open};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else global.WorksAlphaListings=api;
})(typeof window!=='undefined'?window:globalThis);
