'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fixture(){const env=bootDocument134(),{g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();return env;}

test('UI 1.37 : Échap ferme l’armurerie et conserve une pause préalable',()=>{
 const {g}=fixture();
 for(const wasPaused of [false,true]){
  g.togglePause(wasPaused);assert.equal(g.arsenalUI134.open(),true);const elapsed=g.elapsed;
  g.onEscape();assert.equal(g.arsenalUI134.isOpen(),false);assert.equal(g.paused,wasPaused);
  assert.equal(g.activeOverlay,wasPaused?g.ui.pauseMenu:null);assert.equal(g.elapsed,elapsed);
 }
});

test('UI 1.37 : une reprise valide quitte l’ancienne armurerie sans retenir le focus',()=>{
 const {g,doc}=fixture(),saved=g.serialize();g.arsenalUI134.open();
 assert.equal(g.restoreSave(saved),true);assert.equal(g.arsenalUI134.isOpen(),false);
 assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(doc.activeElement,g.canvas);
 assert.equal(g.arsenalUI134.element.inert,true);assert.equal(g.ui.hud.inert,false);
 assert.deepEqual(g.arsenal134.snapshot(),saved.expansions127.modules.arsenal134);
});

test('UI 1.37 : une nouvelle campagne libère la modale précédente et montre son introduction',()=>{
 const {g,doc}=fixture();g.arsenalUI134.open();g.startNew('standard','42');
 assert.equal(g.arsenalUI134.isOpen(),false);assert.equal(g.campaignIntro132.isOpen(),true);
 assert.equal(g.activeOverlay,g.campaignIntro132.element);assert.equal(g.paused,true);
 assert.ok(g.activeOverlay.contains(doc.activeElement));g.campaignIntro132.skip();
 assert.equal(g.activeOverlay,null);assert.equal(g.ui.hud.inert,false);assert.equal(g.paused,false);
});

test('UI 1.37 : départ et reprise refusés conservent l’armurerie et sa campagne',()=>{
 const {g,doc}=fixture();g.arsenalUI134.open();const world=g.world,focus=doc.activeElement,before=g.serialize();
 assert.equal(g.startNew('standard','invalid-seed'),false);assert.equal(g.world,world);
 const bad=JSON.parse(JSON.stringify(before));bad.player.health=-1;assert.throws(()=>g.restoreSave(bad));
 assert.equal(g.arsenalUI134.isOpen(),true);assert.equal(g.activeOverlay,g.arsenalUI134.element);
 assert.equal(g.paused,true);assert.equal(doc.activeElement,focus);const after=g.serialize();after.timestamp=before.timestamp;assert.deepEqual(after,before);
});

test('UI 1.37 : l’armurerie quitte le placement avant de lancer un assemblage payé',()=>{
 const {g,doc}=fixture();g.selectBuild('woodWall');assert.equal(g.selectedBuild,'woodWall');
 g.arsenalUI134.open();assert.equal(g.selectedBuild,null);assert.equal(g.rallyPlacement,false);
 const click=action=>{const b=[...g.arsenalUI134.element.querySelectorAll('button')].find(b=>b.dataset.action===action);assert.ok(b);assert.equal(b.disabled,false);b.click();};
 click('tab:catalog');const wood=g.resources.wood,scrap=g.resources.scrap;click('craft:plank');
 assert.equal(g.arsenalUI134.isOpen(),false);assert.equal(g.arsenal134.busy(),true);assert.equal(g.paused,false);
 while(g.arsenal134.busy())g.arsenal134.step(.1);
 const cost=globalThis.DeadwallCore.Arsenal134Rules.catalog.plank.cost;
 assert.equal(g.resources.wood,wood-(cost.wood||0));assert.equal(g.resources.scrap,scrap-(cost.scrap||0));
 assert.ok(g.arsenal134.snapshot().locker.some(i=>i.id==='plank'));assert.ok(doc.body.contains(doc.activeElement));
});
