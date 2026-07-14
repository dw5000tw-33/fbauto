(()=>{
  'use strict';
  const root=document.getElementById('fb-ad-alpha-local-scheduler'),panel=root?.querySelector('#p-schedule'),native=root?.querySelector('#s-time');
  if(!root||!panel||!native||root.dataset.timeFirst==='1')return;
  root.dataset.timeFirst='1';
  const oldLabel=panel.querySelector('label[for="s-time"]');
  if(oldLabel)oldLabel.hidden=true;native.hidden=true;
  const style=document.createElement('style');style.textContent=`
#fb-ad-alpha-local-scheduler .time-first{margin:9px 0 12px;padding:10px;border:1px solid #8f3943;border-radius:9px;background:#181416}
#fb-ad-alpha-local-scheduler .time-first>label{margin-top:0}
#fb-ad-alpha-local-scheduler .time-display{width:100%;text-align:left;background:#0a0a0c!important;border-color:#e24b5e!important;color:#fff!important}
#fb-ad-alpha-local-scheduler .time-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:7px}
#fb-ad-alpha-local-scheduler .time-quick button{padding:7px 5px;font-size:10px}
#fb-ad-alpha-local-scheduler .time-picker{margin-top:8px;padding:9px;border:1px solid #655557;border-radius:8px;background:#0d0d0f}
#fb-ad-alpha-local-scheduler .time-picker[hidden]{display:none}
#fb-ad-alpha-local-scheduler .calendar-head{display:flex;align-items:center;justify-content:space-between;gap:7px}
#fb-ad-alpha-local-scheduler .calendar-head strong{flex:1;text-align:center;color:#fff;font-size:12px}
#fb-ad-alpha-local-scheduler .calendar-head button{padding:5px 8px}
#fb-ad-alpha-local-scheduler .calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:7px}
#fb-ad-alpha-local-scheduler .calendar-grid span{padding:3px 0;text-align:center;color:#aaa;font-size:9px}
#fb-ad-alpha-local-scheduler .calendar-grid button{height:27px;padding:0;background:#202023;font-size:10px}
#fb-ad-alpha-local-scheduler .calendar-grid button.selected{background:#b61f34!important;border-color:#e24b5e!important;color:#fff}
#fb-ad-alpha-local-scheduler .calendar-grid button.today{outline:1px solid #fff}
#fb-ad-alpha-local-scheduler .clock-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:9px}
#fb-ad-alpha-local-scheduler .time-hint{margin-top:7px;color:#ffb8be;font-size:10px;line-height:1.4}
`;root.append(style);
  const box=document.createElement('div');box.className='time-first';
  box.innerHTML='<label>① 先決定預定時間</label><button class="time-display" type="button"></button><div class="time-quick"><button type="button" data-min="30">30 分鐘後</button><button type="button" data-min="60">1 小時後</button><button type="button" data-min="120">2 小時後</button></div><div class="time-picker" hidden><div class="calendar-head"><button type="button" data-nav="-1">‹</button><strong></strong><button type="button" data-nav="1">›</button></div><div class="calendar-grid"></div><div class="clock-row"><select class="ampm"><option value="AM">上午</option><option value="PM">下午</option></select><select class="hour"></select><select class="minute"></select></div><div class="time-hint">預排時間至少為現在 30 分鐘後。排程期間請保持電腦、瀏覽器與目標分頁開啟。</div></div>';
  const phase=panel.querySelector('.phase');phase.after(box);
  const display=box.querySelector('.time-display'),picker=box.querySelector('.time-picker'),grid=box.querySelector('.calendar-grid'),monthTitle=box.querySelector('.calendar-head strong'),ampm=box.querySelector('.ampm'),hour=box.querySelector('.hour'),minute=box.querySelector('.minute');
  for(let h=1;h<=12;h++)hour.add(new Option(h+' 點',String(h)));for(let m=0;m<60;m+=5)minute.add(new Option(String(m).padStart(2,'0')+' 分',String(m)));
  const round5=date=>{const d=new Date(date);d.setSeconds(0,0);d.setMinutes(Math.ceil(d.getMinutes()/5)*5);return d};
  const minDate=()=>round5(Date.now()+30*60*1000),format=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  let selected=minDate(),viewMonth=new Date(selected.getFullYear(),selected.getMonth(),1);
  const setControls=()=>{const h24=selected.getHours();ampm.value=h24>=12?'PM':'AM';hour.value=String(h24%12||12);minute.value=String(Math.floor(selected.getMinutes()/5)*5)};
  const sync=()=>{native.value=format(selected);display.textContent=selected.toLocaleString('zh-TW',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:true});setControls();draw()};
  const applyClock=()=>{let h=Number(hour.value)%12;if(ampm.value==='PM')h+=12;selected.setHours(h,Number(minute.value),0,0);if(selected<minDate())selected=minDate();sync()};
  function draw(){grid.innerHTML='';['日','一','二','三','四','五','六'].forEach(x=>{const s=document.createElement('span');s.textContent=x;grid.append(s)});const y=viewMonth.getFullYear(),m=viewMonth.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),today=new Date();monthTitle.textContent=y+' 年 '+(m+1)+' 月';for(let i=0;i<first;i++)grid.append(document.createElement('span'));for(let day=1;day<=days;day++){const d=new Date(y,m,day),b=document.createElement('button');b.type='button';b.textContent=day;if(d.toDateString()===today.toDateString())b.classList.add('today');if(d.toDateString()===selected.toDateString())b.classList.add('selected');b.onclick=()=>{selected.setFullYear(y,m,day);if(selected<minDate())selected=minDate();sync()};grid.append(b)}}
  display.onclick=()=>picker.hidden=!picker.hidden;box.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{viewMonth=new Date(viewMonth.getFullYear(),viewMonth.getMonth()+Number(b.dataset.nav),1);draw()});box.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{selected=round5(Date.now()+Number(b.dataset.min)*60000);viewMonth=new Date(selected.getFullYear(),selected.getMonth(),1);sync()});ampm.onchange=hour.onchange=minute.onchange=applyClock;sync();
})();
