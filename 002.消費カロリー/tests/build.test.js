import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {activities,categories,locales} from '../scripts/validate-data.js';
const read=p=>readFileSync('dist'+p+'index.html','utf8');
const paths=locales.flatMap(l=>[`/${l.lang}/`,...activities.map(a=>`/${l.lang}/${a.slug}/`),...categories.map(c=>`/${l.lang}/category/${c.id}/`),`/${l.lang}/calculator/burn-500-calories/`]);
test('every generated page has complete metadata, data and working internal links',()=>{
 for(const path of paths){
  const html=read(path);assert.ok(!html.includes('{{'));
  assert.match(html,/<title>[^<]+<\/title>/);assert.match(html,/<meta name="description" content="[^"]+"/);assert.match(html,/<link rel="canonical"/);
  for(const l of locales)assert.ok(html.includes(`hreflang="${l.lang}"`));
  for(const [,url] of html.matchAll(/(?:href|src)="(\/[^"#]*)(?:#[^"]*)?"/g)){assert.ok(existsSync('dist'+url+(url.endsWith('/')?'index.html':'')),`${path} broken link ${url}`)}
  const payload=JSON.parse(html.match(/<script id="page-data" type="application\/json">(.*?)<\/script>/s)[1]);assert.equal(payload.activities.length,activities.length);
 }
});
test('sitemap covers every content page exactly once',()=>{
 const xml=readFileSync('dist/sitemap.xml','utf8');const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>new URL(x[1]).pathname);assert.equal(new Set(urls).size,paths.length);assert.deepEqual(urls.sort(),paths.sort());
});
