import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siteConfig} from '../scripts/site-config.js';
test('local builds are not indexed',()=>assert.deepEqual(siteConfig({}),{origin:'http://localhost:4173',indexable:false}));
test('Pages production requires a correct HTTPS origin',()=>{
  assert.throws(()=>siteConfig({CF_PAGES:'1',CF_PAGES_BRANCH:'main'}),/SITE_URL/);
  assert.throws(()=>siteConfig({CF_PAGES:'1',CF_PAGES_BRANCH:'main',SITE_URL:'http://example.com'}),/HTTPS/);
  assert.throws(()=>siteConfig({SITE_URL:'https://example.com/subdirectory'}),/origin/);
  assert.deepEqual(siteConfig({CF_PAGES:'1',CF_PAGES_BRANCH:'main',SITE_URL:'https://example.com/'}),{origin:'https://example.com',indexable:true});
});
test('Pages previews remain noindex even with the production URL set',()=>{
  assert.equal(siteConfig({CF_PAGES:'1',CF_PAGES_BRANCH:'feature/example',SITE_URL:'https://example.com'}).indexable,false);
  assert.deepEqual(siteConfig({CF_PAGES:'1',CF_PAGES_BRANCH:'feature/example',CF_PAGES_URL:'https://abc.example.pages.dev'}),{origin:'https://abc.example.pages.dev',indexable:false});
});
