'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const H = require('./helpers/husbandry191.cjs');
const C = require('../src/core.js');
const stable = g => { const { timestamp, ...data } = g.serialize(); return structuredClone(data); };
function fresh() {
  const { g } = bootDocument134();
  g.startNew('standard', '17117', 'classic', 'balanced', true); g.campaignIntro132.skip();
  return g;
}

test('203 browser preparation: one paid equipped knife enables native processing; the original firearm still refuses it', async () => {
  const { preparePaidKnife191 } = await import('../scripts/browser-husbandry-fixture191.mjs');
  const g = fresh(), before = stable(g), original = g.arsenal134.snapshot();
  assert.equal(original.carried.some(item => C.WildlifeHarvest190Rules.knives.includes(item.id)), false, 'normal new-game inventory has no processing knife');
  const preparation = preparePaidKnife191(), arsenal = g.arsenal134.snapshot(), knife = arsenal.carried.find(item => item.uid === preparation.item.uid);
  assert.ok(knife); assert.equal(knife.id, 'knife'); assert.equal(knife.condition, 100); assert.equal(arsenal.equipped, knife.uid);
  assert.equal(arsenal.carried.length, original.carried.length + 1); assert.deepEqual(arsenal.locker, original.locker);
  assert.deepEqual(arsenal.carried.filter(item => item.uid !== knife.uid), original.carried);
  assert.equal(arsenal.next, original.next + 1); assert.equal(g.random.state, before.randomState); assert.equal(g.runId, before.runId);
  for (const key of C.RESOURCE_KEYS) assert.equal(g.resources[key], before.resources[key] - (C.Arsenal134Rules.catalog.knife.cost[key] || 0));
  assert.deepEqual(g.serialize().nodes, before.nodes); assert.deepEqual(g.serialize().buildings, before.buildings);

  // The shared seeded helper finds a real dry animal; it does not prepare gear.
  const q = H.candidate(g), saved = g.serialize();
  saved.player.carry = { ...saved.player.carry, wood: 15, scrap: 10, food: 6, fuel: 2, medicine: 0 };
  Object.assign(saved.frontier, { active: true, ...q.point, z: 0, inside: null, a: 0, quiet: true, anchor: { x: saved.player.x, y: saved.player.y } });
  assert.equal(g.restoreSave(saved), true); g.paused = false; g.activeOverlay = null; g.dayClock = .4; g.update(.01);
  assert.equal(g.husbandry191.begin('build').ok, true); H.finish(g);
  const pen = g.husbandry191.view().pens[0];
  assert.equal(g.husbandry191.begin('capture', pen.id, q.a.id).ok, true); H.finish(g);
  const animal = g.husbandry191.view().animals[0]; assert.equal(animal.source, q.a.id);
  assert.equal(g.arsenal134.equip(original.equipped).ok, true);
  const withoutKnife = stable(g), refused = g.husbandry191.quote('slaughter', pen.id, animal.id);
  assert.equal(refused.ok, false); assert.equal(refused.reason, 'Équipez un couteau ou une machette en état.');
  assert.deepEqual(stable(g), withoutKnife);
  assert.equal(g.arsenal134.equip(knife.uid).ok, true);
  const quote = g.husbandry191.quote('slaughter', pen.id, animal.id); assert.equal(quote.ok, true, quote.reason);
  assert.equal(g.husbandry191.begin('slaughter', pen.id, animal.id).ok, true); H.finish(g);
  const produced = g.husbandry191.view();
  assert.equal(produced.animals[0].status, 'processed');
  assert.equal(produced.pens[0].meat, C.Husbandry191Rules.captive[animal.species].meat);
  assert.equal(produced.pens[0].hides, C.Husbandry191Rules.captive[animal.species].hides);
  assert.equal(g.arsenal134.snapshot().equipped, knife.uid);
});

test('203 browser preparation: insufficient depot stock or absent physical access never grants a knife or changes RNG', async () => {
  const { preparePaidKnife191 } = await import('../scripts/browser-husbandry-fixture191.mjs');
  const g = fresh(), base = g.serialize();
  for (const mode of ['materials', 'access']) {
    assert.equal(g.restoreSave(structuredClone(base)), true); g.paused = false; g.activeOverlay = null;
    if (mode === 'materials') g.resources.scrap = C.Arsenal134Rules.catalog.knife.cost.scrap - 1;
    else { g.player.x = 100; g.player.y = 100; }
    const before = stable(g);
    assert.throws(() => preparePaidKnife191(), mode === 'materials' ? /Matériaux insuffisants/ : /Rejoignez le dépôt/);
    assert.deepEqual(stable(g), before, mode + ' refuses before allocating or charging');
  }
});

const fs=require('node:fs');
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
