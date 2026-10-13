'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

test('159 guide heartbeat reads only its visible command dossier and reopens with the current notebook',async t=>{
 const {g,doc}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 let presentationTime=1000;
 const reads={context:0,discoveries:0,world:0,position:0,previousUI:0},actions=globalThis.DeadwallCodexActions159,frontier=g.frontier;
 t.after(()=>{g.frontier=frontier;});

 // Keep the shipped HTML, controllers and source intact. Isolate the guide's
 // updateUI wrapper from unrelated HUD readers, then count its real owners.
 doc.getElementById('field-world-codex').remove();
 for(const button of doc.getElementById('commandPanel-field').querySelector('.field-nav').querySelectorAll('button'))if(button.dataset.fieldView==='world-codex')button.remove();
 delete g.worldCodex;g.updateUI=()=>{reads.previousUI++;return 'previous-ui';};
 const observedActions=Object.freeze({...actions,choiceContext(game){reads.context++;return actions.choiceContext(game);}});
 g.frontier=Object.freeze({...frontier,
  discoveries(){reads.discoveries++;return frontier.discoveries();},
  world(){reads.world++;return frontier.world();},
  position(){reads.position++;return frontier.position();}
 });
 const source=fs.readFileSync(path.join(__dirname,'../src/world-codex.js'),'utf8');
 // Control this dossier's presentation clock without replacing the Node test
 // runner's performance object or changing elapsed simulation time.
 const guideRoot=new Proxy(globalThis,{get(target,key){return key==='performance'?{now:()=>presentationTime}:key==='DeadwallCodexActions159'?observedActions:Reflect.get(target,key);}});
 new Function('module','require','exports','globalThis',source)(undefined,undefined,undefined,guideRoot);
 const section=doc.getElementById('field-world-codex');assert.ok(section);assert.ok(g.worldCodex);
 const reset=()=>{for(const key of Object.keys(reads))reads[key]=0;};
 const counters=()=>({...reads});
 const stable=()=>{const saved=g.serialize();delete saved.timestamp;return structuredClone(saved);};
 const heartbeat=()=>{presentationTime+=500;return g.updateUI();};

 await t.test('closing the native command hides an ancestor and stops every guide reader',()=>{
  g.worldCodex.open();assert.equal(section.closest('.hidden'),null);g.showCommand(false);
  assert.equal(section.classList.contains('hidden'),false,'The section retains its selected state while its parent closes');
  assert.equal(section.closest('.hidden'),g.ui.commandModal);const saved=stable(),rng=g.random.state,elapsed=g.elapsed;reset();
  for(let i=0;i<4;i++)assert.equal(heartbeat(),'previous-ui');
  assert.deepEqual(counters(),{context:0,discoveries:0,world:0,position:0,previousUI:4});
  assert.deepEqual(stable(),saved);assert.equal(g.random.state,rng);assert.equal(g.elapsed,elapsed);
 });

 await t.test('another native command tab keeps the selected guide asleep',()=>{
  g.worldCodex.open();doc.getElementById('commandTab-research').click();
  assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(section.classList.contains('hidden'),false);
  assert.equal(section.closest('.hidden'),doc.getElementById('commandPanel-field'));
  const saved=stable(),rng=g.random.state;reset();heartbeat();
  assert.deepEqual(counters(),{context:0,discoveries:0,world:0,position:0,previousUI:1});assert.deepEqual(stable(),saved);assert.equal(g.random.state,rng);
 });

 await t.test('an unavailable command overlay blocks polling even if the dossier has no hidden ancestor',()=>{
  g.worldCodex.open();assert.equal(section.closest('.hidden'),null);const overlay=g.activeOverlay,saved=stable(),rng=g.random.state;
  try{g.activeOverlay=null;reset();heartbeat();assert.deepEqual(counters(),{context:0,discoveries:0,world:0,position:0,previousUI:1});}
  finally{g.activeOverlay=overlay;}
  assert.deepEqual(stable(),saved);assert.equal(g.random.state,rng);
 });

 await t.test('explicit refresh and reopen still read current known places without spending or advancing simulation',()=>{
  const region=frontier.world(),place=region.pois.find(p=>p.programme3000);assert.ok(place);
  // Declared notebook fixture through its native discovery owner. This does
  // not claim an organically scouted campaign or grant supplies.
  frontier.revealSites([place.id]);g.worldCodex.open();
  const use=doc.getElementById('worldCodexAvailability159'),search=doc.getElementById('worldCodexSearch');use.value='known';search.value=place.programme3000;use.dispatch('change');
  assert.equal(doc.getElementById('worldCodexResults').querySelectorAll('article').length,1);g.showCommand(false);
  const saved=stable(),rng=g.random.state,elapsed=g.elapsed;reset();
  assert.equal(g.worldCodex.updateLive(true),true);assert.equal(reads.context,1);assert.ok(reads.discoveries>0);assert.ok(reads.world>0);
  reset();g.worldCodex.open();assert.equal(section.closest('.hidden'),null);assert.equal(g.activeOverlay,g.ui.commandModal);
  const card=doc.getElementById('worldCodexResults').querySelectorAll('article')[0];assert.equal(card.dataset.codexId,'programme-'+place.programme3000);
  assert.ok(card.querySelectorAll('button').some(button=>button.dataset.codexPlace159===place.id));assert.ok(reads.context>0);assert.ok(reads.world>0);
  reset();assert.equal(heartbeat(),'previous-ui');assert.equal(reads.context,1);assert.ok(reads.discoveries>0);assert.equal(reads.previousUI,1);
  assert.deepEqual(stable(),saved);assert.equal(g.random.state,rng);assert.equal(g.elapsed,elapsed);
 });
});
