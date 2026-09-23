import {readFileSync,readdirSync} from 'node:fs';
export const read = p => JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8').replace(/^\uFEFF/,''));
export const activities=read('data/activities.json'), categories=read('data/categories.json'), foods=read('data/foods.json');
export const locales=readdirSync(new URL('../locales/',import.meta.url)).filter(f=>f.endsWith('.json')).map(f=>read('locales/'+f));
export function validate(){
 const unique=(arr,key)=>{if(new Set(arr.map(x=>x[key])).size!==arr.length)throw Error('Duplicate '+key)};
 unique(activities,'id');unique(activities,'slug');unique(locales,'lang');
 for(const a of activities) if(!/^[a-z0-9-]+$/.test(a.slug)||!Number.isFinite(a.met)||a.met<=0||!/^\d{5}$/.test(a.source_code)||!categories.some(c=>c.id===a.category)||!a.source_url.startsWith('https://pacompendium.com/'))throw Error('Invalid activity '+a.id);
 for(const f of foods)if(!Number.isFinite(f.kcal)||f.kcal<=0)throw Error('Invalid food');
 for(const l of locales){
  if(!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(l.lang))throw Error('Invalid locale');
  for(const [k,v] of Object.entries(locales[0]))if(typeof v==='string'&&typeof l[k]!=='string')throw Error('Missing translation '+l.lang+':'+k);
  for(const a of activities)if(!l.activities[a.id]?.name||!l.activities[a.id]?.description)throw Error('Missing activity translation '+a.id);
  for(const c of categories)if(!l.categories[c.id])throw Error('Missing category '+c.id);
  for(const f of foods)if(!l.foods[f.id])throw Error('Missing food '+f.id);
 }
 return `${activities.length} activities, ${locales.length} locales validated`;
}
console.log(validate());
