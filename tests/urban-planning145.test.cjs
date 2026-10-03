'use strict';
const {legacyAge}=require('./helpers/legacy-city.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const C=require('../src/core.js');
const stable=g=>{const d=g.serialize();delete d.timestamp;return JSON.stringify(d);};
function fresh(ui=false){const env=ui?bootDocument134():bootGame(),g=env.g||env.game;g.startNew('standard','17117');g.campaignIntro132?.skip();g.units=[];return{...env,g};}
function paid(g,type='house'){
 const core=g.core();
 for(let r=6;r<=30;r++)for(const [dx,dy]of [[r,0],[-r,0],[0,r],[0,-r]]){
  const gx=core.gx+dx,gy=core.gy+dy;
  if(!g.world.placement(C.BUILDINGS[type],gx,gy,0).valid)continue;
  assert.equal(g.placeOne(type,gx,gy),true);return g.world.atCell(gx,gy);
 }
 throw Error('No ordinary build placement for '+type);
}
function finish(g,b){standAt(g,g.player,b);g.input.keys.add('KeyE');for(let i=0;i<1200&&!b.completed;i++)g.updateInteraction(.1);g.input.keys.clear();assert.equal(b.completed,true);g.refreshMetrics(true);}
test('urban planning: a paid foundation projects full score only after physical completion, with no stock or housing award',()=>{
 const{g}=fresh(),before={...g.resources},housing=g.housing,b=paid(g),start=g.cityScore;
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before[key]-(C.BUILDINGS.house.cost[key]||0));
 const frozen=stable(g),v=g.urban.planning();assert.equal(v.pendingScore,4);assert.equal(v.currentScore,start);assert.equal(v.potentialScore,start+4);assert.equal(v.age.id,0);assert.equal(v.potentialAge.id,1);assert.equal(g.housing,housing);assert.equal(stable(g),frozen);
 b.work(b.def.buildTime/2);g.refreshMetrics(true);assert.equal(g.urban.planning().pendingScore,4);assert.equal(g.cityScore,start);
 finish(g,b);const done=g.urban.planning();assert.equal(done.pending.length,0);assert.equal(done.currentScore,start+4);assert.equal(done.age.id,1);assert.equal(g.housing,housing+8);
});
test('urban planning: retained knowledge after destruction does not understate points needed to reach a new age',()=>{
 const{g}=fresh(),b=paid(g);finish(g,b);
 // Explicit previously reached age fixture: knowledge persists, buildings and stocks do not.
 legacyAge(g,48);g.refreshMetrics(true);g.destroyBuilding(b);g.refreshMetrics(true);
 const before=stable(g),v=g.urban.planning();assert.equal(v.age.id,3);assert.equal(v.peakScore,48);assert.equal(v.currentScore,8);assert.equal(v.next.requiredScore,85);assert.equal(v.remaining,77);assert.equal(v.remainingAfterPending,77);assert.equal(v.pendingScore,0);assert.equal(stable(g),before);
});
test('urban planning: a suspended foundation remains conditional, and a physically occupied foundation earns no age',()=>{
 const{g}=fresh(),b=paid(g);assert.equal(g.citadel.suspend(b.id,true),true);const s=g.urban.planning();assert.equal(s.pendingScore,4);assert.equal(s.age.id,0);assert.equal(g.citadel.overview().jobs.find(j=>j.id===b.id).paused,true);
 assert.equal(g.citadel.suspend(b.id,false),true);g.player.x=b.x;g.player.y=b.y;b.work(b.def.buildTime);assert.equal(g.completeBuilding(b),false);g.refreshMetrics(true);assert.equal(g.cityScore,8);assert.equal(g.urban.planning().pendingScore,4);assert.equal(g.urban.planning().age.id,0);
 standAt(g,g.player,b);b.work(1);assert.equal(g.completeBuilding(b),true);g.refreshMetrics(true);assert.equal(g.urban.planning().age.id,1);
});
test('urban planning: upcoming models show real costs and completed prerequisites, without exposing upgrade-only or future build actions',()=>{
 const{g}=fresh(),v=g.urban.planning(),search=v.nextModels.find(d=>d.id==='searchlight');assert.ok(search);assert.equal(search.requirementMet,false);assert.equal(search.requirementName,C.BUILDINGS.generator.name);assert.deepEqual(search.cost,C.BUILDINGS.searchlight.cost);assert.ok(v.nextModels.every(d=>C.BUILDINGS[d.id].unlockTier===1));
 legacyAge(g,10);g.refreshMetrics(true);const b=paid(g);assert.equal(g.urban.planning().nextModels.find(d=>d.id==='rowHomes').requirementMet,false);finish(g,b);assert.equal(g.urban.planning().nextModels.find(d=>d.id==='rowHomes').requirementMet,true);
 g.resources.wood=7;g.resources.scrap=0;const row=g.urban.planning().nextModels.find(d=>d.id==='rowHomes');assert.equal(row.missing.wood,113);assert.equal(row.missing.scrap,60);row.cost.wood=999;assert.equal(C.BUILDINGS.rowHomes.cost.wood,120);
 legacyAge(g,48);g.refreshMetrics(true);assert.ok(!g.urban.planning().currentModels.some(d=>d.id==='armoredGate'));
});
test('urban planning: save and Continue restore the actual foundation forecast, while a new campaign clears it',()=>{
 const{g}=fresh(),b=paid(g);b.work(3);g.refreshMetrics(true);const v=g.urban.planning();assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.urban.planning(),v);g.startNew('standard','903145');assert.equal(g.urban.planning().pending.length,0);assert.equal(g.urban.planning().peakScore,8);
});
test('urban planning: the final age keeps the existing construction loop without a fabricated next threshold',()=>{
 const{g}=fresh();legacyAge(g,1850);g.refreshMetrics(true);const before=stable(g),v=g.urban.planning();assert.equal(v.age.id,10);assert.equal(v.next,null);assert.equal(v.nextModels.length,0);assert.equal(v.remaining,0);assert.ok(v.currentModels.some(d=>d.id==='megaReserve'));assert.equal(stable(g),before);
});
test('urban planning UI: actual dossier shows a conditional forecast, upcoming costs and changing prerequisites',()=>{
 const{g,doc}=fresh(true);g.coordinationUI.open();g.urbanUI.refresh(true);assert.match(doc.getElementById('urbanRemaining').textContent,/2.0 points/);assert.match(doc.getElementById('urbanPotential').textContent,/Aucun chantier/);assert.ok(doc.getElementById('urbanNextModels').children.some(c=>c.dataset.model==='searchlight'));
 const b=paid(g);g.urbanUI.refresh(true);assert.match(doc.getElementById('urbanPotential').textContent,/1 chantier.*4.0 points/);assert.match(doc.getElementById('urbanPotential').textContent,/potentiel couvre/);assert.equal(doc.getElementById('urbanPendingJobs').children.length,1);assert.equal(g.tier.id,0);
 g.showCommand(false);finish(g,b);g.coordinationUI.open();g.urbanUI.refresh(true);assert.match(doc.getElementById('urbanNextTitle').textContent,/AVANT-POSTE/);const row=doc.getElementById('urbanNextModels').children.find(c=>c.dataset.model==='rowHomes');assert.ok(row.children.some(n=>/Dortoir renforcé terminé/.test(n.textContent)));
 const before=stable(g);doc.getElementById('urbanManageJobs').click();assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(doc.getElementById('coordinationPanel').classList.contains('hidden'),true);assert.equal(doc.getElementById('citadel-view-works').classList.contains('hidden'),false);assert.equal(doc.getElementById('citadel-sub-works').getAttribute('aria-selected'),'true');assert.equal(doc.activeElement.id,'citadel-sub-works');assert.equal(stable(g),before);
});
test('urban planning UI: hidden dossier does not scan construction models or buildings for its torch HUD',()=>{
 const{g}=fresh(true),urban=g.urban;let scans=0;g.urban=Object.freeze({...urban,overview:()=>{scans++;return urban.overview();},planning:()=>{scans++;return urban.planning();}});
 for(let i=0;i<12;i++)g.urbanUI.refresh(true);assert.equal(scans,0);g.coordinationUI.open();g.urbanUI.refresh(true);assert.ok(scans>0);
 g.showCommand(false);scans=0;for(let i=0;i<12;i++)g.urbanUI.refresh(true);assert.equal(scans,0,'a hidden command ancestor stops planning too');
 g.coordinationUI.open();g.showCommand(true,'workers');scans=0;for(let i=0;i<12;i++)g.urbanUI.refresh(true);assert.equal(scans,0,'a hidden field tab stops planning too');
});
