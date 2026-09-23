import {calories,duration} from './calculator.js';
import {setupSearch} from './search.js';
const data=JSON.parse(document.getElementById('page-data').textContent);
const {activities,foods,locale:l}=data;
setupSearch(l);
const $=id=>document.getElementById(id);
const activity=$('activity');
if(activity){
 const format=new Intl.NumberFormat(l.lang,{maximumFractionDigits:0});
 const n=x=>format.format(x);
 const fields=['weight','minutes','target'].map($).filter(Boolean);
 const name=a=>l.activities[a.id].name;
 const aLink=a=>`/${l.lang}/${a.slug}/`;
 function update(){
  const kg=Number($('weight').value),minutes=Number($('minutes').value),target=Number($('target')?.value??500);
  const valid=fields.every(f=>f.value!==''&&f.validity.valid)&&kg>0;
  $('error').hidden=valid;
  fields.forEach(f=>f.setAttribute('aria-invalid',String(!f.validity.valid||f.value==='')));
  const a=activities.find(x=>x.id===activity.value);
  const result=valid?calories(a.met,kg,minutes):null;
  $('result').textContent=valid?n(result):'—';
  $('result-context').textContent=valid?`${name(a)} · ${n(kg)} kg · ${n(minutes)} ${l.min}`:'—';
  $('detail-link').href=aLink(a);
  document.querySelectorAll('[data-minutes]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)===minutes)));
  document.querySelectorAll('[data-weight-context]').forEach(e=>e.textContent=valid?`${n(kg)} kg`:'—');
  document.querySelectorAll('[data-time-context]').forEach(e=>e.textContent=valid?`${n(minutes)} ${l.min}`:'—');
  document.querySelectorAll('[data-context]').forEach(e=>e.textContent=valid?`${n(kg)} kg · ${n(minutes)} ${l.min}`:'—');
  for(const [id,values,fn,unit] of [['time-table',[10,20,30,45,60,90,120],x=>calories(a.met,kg,x),l.min],['weight-table',[40,50,60,70,80,90,100],x=>calories(a.met,x,minutes),'kg']]){
   if($(id))$(id).replaceChildren(...values.map(x=>{const row=document.createElement('tr');for(const s of [`${x} ${unit}`,valid?n(fn(x)):'—']){const td=document.createElement('td');td.textContent=s;row.append(td)}return row}));
  }
  document.querySelectorAll('[data-food]').forEach(e=>e.textContent=valid?(result/foods.find(f=>f.id===e.dataset.food).kcal).toLocaleString(l.lang,{minimumFractionDigits:1,maximumFractionDigits:1}):'—');
  if($('comparison')){
   const items=[a,...activities.filter(x=>x.id!==a.id).slice(0,5)];
   const max=Math.max(...items.map(x=>x.met));
   $('comparison').replaceChildren(...items.map(x=>{
    const row=document.createElement('div');row.className='bar-row';
    const link=document.createElement('a');link.href=aLink(x);link.textContent=name(x);
    const track=document.createElement('div');track.className='bar-track';const bar=document.createElement('div');bar.style.width=valid&&minutes>0?`${x.met/max*100}%`:'0%';track.append(bar);
    const value=document.createElement('b');value.textContent=valid?`${n(calories(x.met,kg,minutes))} kcal`:'—';row.append(link,track,value);return row;
   }));
  }
  if($('reverse-results'))$('reverse-results').replaceChildren(...activities.map(x=>{const item=document.createElement('a');item.href=aLink(x);const label=document.createElement('span');label.textContent=name(x);const value=document.createElement('b');value.textContent=valid?`${n(Math.ceil(duration(x.met,kg,target)))} ${l.min}`:'—';item.append(label,value);return item}));
 }
 fields.forEach(f=>f.addEventListener('input',update));activity.addEventListener('change',update);
 document.querySelectorAll('[data-minutes]').forEach(b=>b.addEventListener('click',()=>{$('minutes').value=b.dataset.minutes;update()}));
 $('fat')?.addEventListener('click',()=>{$('target').value=7700;update()});
 update();
}
