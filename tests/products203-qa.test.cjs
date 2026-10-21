'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
test('203 browser preparation builds, pays, takes and equips a real knife; repeated preparation never duplicates it',async()=>{
 const {prepareProductsTool203}=await import('../scripts/products203-fixtures.mjs');
 const {g}=bootDocument134();g.startNew('standard','17117','classic','balanced',true);g.campaignIntro132.skip();g.paused=false;g.activeOverlay=null;
 assert.equal(g.arsenal134.snapshot().carried.some(i=>i.id==='knife'),false);
 const before={...g.resources},carry={...g.player.carry},report=prepareProductsTool203();assert.equal(report.crafted,true);
 const price=DeadwallCore.Arsenal134Rules.catalog.knife.cost;
 for(const key of DeadwallCore.RESOURCE_KEYS)assert.equal(g.resources[key],before[key]-(price[key]||0));
 assert.deepEqual(g.player.carry,carry);const after=g.arsenal134.snapshot();assert.equal(after.equipped,report.uid);assert.equal(after.carried.find(i=>i.uid===report.uid).id,'knife');
 const balances={...g.resources},again=prepareProductsTool203();assert.equal(again.crafted,false);assert.equal(again.uid,report.uid);assert.deepEqual(g.resources,balances);
 assert.equal(g.arsenal134.snapshot().carried.filter(i=>i.id==='knife').length,1);
});
test('203 browser fixture keeps native payment, failure diagnostics, current player URL and all three formats',()=>{
 const s=fs.readFileSync('scripts/browser-products203.mjs','utf8');
 assert.match(s,/page\.evaluate\(prepareProductsTool203\)/);assert.match(s,/profile\.refusedAction/);
 assert.match(s,/button\.isEnabled\(\)/);assert.match(s,/location\.search===''/);
 for(const width of [1366,390,844])assert.ok(s.includes('width:'+width));
 assert.match(s,/saveReloadContinue/);
});

test('203 focused workflow selects real husbandry regressions and no empty test-file glob',()=>{
 const workflow=fs.readFileSync('.github/workflows/products203.yml','utf8'),files=fs.readdirSync('tests');
 assert.ok(workflow.includes('tests/audit191-*.test.cjs'));
 const line=workflow.split('\n').find(line=>line.includes('node --test '));assert.ok(line);
 for(const match of line.matchAll(/tests\/([^ ]+\.test\.cjs)/g)){
  const chunks=match[1].split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const expression=new RegExp('^'+chunks.join('.*')+'$');
  assert.ok(files.some(file=>expression.test(file)),'No test files matched '+match[0]);
 }
});
