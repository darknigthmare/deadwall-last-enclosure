'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {legacyAge}=require('./helpers/legacy-city.cjs');

const frame=g=>g.loop(g.lastFrame+40);
const training=g=>g.companionsPack.snapshot().training;

function prepared(){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132.skip();
 const C=globalThis.DeadwallCore;
 // Historical city/skills and supplies are model fixtures; the purchase,
 // natural dawn, incumbent work and save/load use the shipped controllers.
 g.units=[];g.world.nodes.forEach(n=>n.depleted=true);
 g.wave=61;g.stats.wavesSurvived=60;
 assert.equal(legacyAge(g,C.CITY_TIERS[4].requiredScore).id,4);g.population=10;
 for(const key of C.RESOURCE_KEYS)g.resources[key]=300;
 assert.equal(g.worldEvolution.assignCompanion('samir'),true);
 Object.assign(g.player,g.fieldcraft.service(g.player,g.core()));
 const state=g.companionsPack.snapshot();state.trained=['samir','samir:escort','samir:support'];g.companionsPack.restore(state);
 const before={...g.resources},cost=C.CompanionPackRules.exercises.triage.cost;
 assert.equal(g.companionsPack.train('samir','triage').ok,true);
 for(const[key,n]of Object.entries(cost))assert.equal(before[key]-g.resources[key],n);
 for(let i=0;i<25;i++)frame(g);
 assert.ok(training(g).left<90&&training(g).left>88.9);
 g.phase='aftermath';g.phaseTime=.02;
 return{g,C};
}

function repairBesideDepot(g,C){
 const core=g.core();assert.equal(g.world.placement(C.BUILDINGS.generator,57,57,0).valid,true);
 const b=new core.constructor(g.nextId++,'generator',57,57,0,1);b.health=350;g.world.add(b);
 let point;
 for(let i=0;i<48&&!point;i++){
  const p={...g.player,x:b.x+Math.cos(i*Math.PI/24)*90,y:b.y+Math.sin(i*Math.PI/24)*90};
  if(g.friendlyPositionClear(p,p.x,p.y)&&g.workerCanWorkAt(p,core,C.CompanionPackRules.homeReach)&&g.workerCanWorkAt(p,b,C.InterventionRules134.localReach))point=p;
 }
 assert.ok(point,'A real exterior position reaches both the depot and generator.');Object.assign(g.player,{x:point.x,y:point.y});
 g.player.carry.scrap=24;
 assert.equal(g.interventions134.begin('local:'+b.id).ok,true);
 assert.equal(g.player.carry.scrap,24-C.InterventionRules134.localRepair.cost.scrap);
 return b;
}

function solveRepair(g){
 while(g.interventions134.busy()){
  const s=g.interventions134.view().session;
  assert.equal(g.interventions134.act('adjust',s.target-s.dial).ok,true);
  assert.equal(g.interventions134.act('confirm').ok,true);
 }
}

test('151 training: natural dawn preserves the paid intervention and resumes training after it finishes',()=>{
 const {g,C}=prepared(),b=repairBesideDepot(g,C),paid=training(g);
 frame(g);assert.equal(g.phase,'calm');assert.equal(g.wave,62);
 for(let i=0;i<6;i++){
  assert.equal(g.companionsPack.busy(),false);
  assert.equal(g.expansions.busy('companions'),true);
  assert.equal(g.arsenal134.preview('craft','plank').ok,false);
  assert.equal(g.companionsPack.fill('samir').ok,false);
  assert.equal(g.companionsPack.train('samir','triage').ok,false);
  frame(g);
 }
 assert.equal(g.interventions134.busy(),true);assert.deepEqual(training(g),paid);
 assert.equal(b.health,350);assert.equal(g.player.carry.scrap,18);
 solveRepair(g);assert.equal(b.health,350+C.InterventionRules134.localRepair.health);
 assert.equal(g.player.carry.scrap,18);assert.deepEqual(training(g),paid);
 assert.equal(g.companionsPack.busy(),true);assert.equal(g.arsenal134.preview('craft','plank').ok,false);
 const stocks={...g.resources};frame(g);
 assert.ok(Math.abs(training(g).left-(paid.left-.04))<1e-8);
 assert.equal(g.resources.scrap,stocks.scrap);assert.equal(g.resources.medicine,stocks.medicine);
 assert.ok(stocks.food-g.resources.food<1,'Only ordinary simulation upkeep may consume food.');
});

test('151 training: an incumbent assembly completes once at dawn before the exercise resumes',()=>{
 const {g,C}=prepared(),paid=training(g),quote=g.arsenal134.preview('craft','plank');
 assert.equal(quote.ok,true,quote.reason);assert.equal(g.arsenal134.begin('craft','plank').ok,true);
 frame(g);assert.equal(g.phase,'calm');assert.equal(g.companionsPack.busy(),false);
 const stocks={...g.resources},locker=g.arsenal134.snapshot().locker.length;
 assert.equal(g.arsenal134.begin('craft','plank').ok,false);
 assert.equal(g.companionsPack.fill('samir').ok,false);
 let ticks=0;
 while(g.arsenal134.busy()&&ticks++<300){frame(g);assert.deepEqual(training(g),paid);}
 assert.ok(ticks<300);assert.equal(g.arsenal134.snapshot().locker.length,locker+1);
 for(const[key,n]of Object.entries(C.Arsenal134Rules.catalog.plank.cost))assert.equal(stocks[key]-g.resources[key],n);
 assert.equal(g.companionsPack.busy(),true);frame(g);
 assert.ok(Math.abs(training(g).left-(paid.left-.04))<1e-8);
 assert.equal(g.arsenal134.snapshot().locker.length,locker+1);
});

test('151 training: Continue preserves paid remaining time and an interrupted intervention has no refund',()=>{
 const {g,C}=prepared();repairBesideDepot(g,C);frame(g);
 const paid=training(g),stocks={...g.resources},bag={...g.player.carry};
 assert.equal(g.interventions134.busy(),true);assert.equal(g.save(false),true);assert.equal(g.load(),true);
 assert.deepEqual(training(g),paid);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.player.carry,bag);
 assert.equal(g.interventions134.busy(),false,'Interactive intervention attempts remain transient on Continue.');
 assert.equal(g.companionsPack.busy(),true);frame(g);
 assert.ok(Math.abs(training(g).left-(paid.left-.04))<1e-8);
 assert.equal(g.resources.scrap,stocks.scrap);assert.equal(g.resources.medicine,stocks.medicine);assert.deepEqual(g.player.carry,bag);
 const beforeCancel={...g.resources};assert.equal(g.companionsPack.cancelTraining().ok,true);
 assert.equal(training(g),null);assert.deepEqual(g.resources,beforeCancel);assert.equal(g.player.carry.scrap,18);
});

test('151 training: the known city age rejects future exercises despite a high saved peak score',()=>{
 const {g,C}=prepared(),paid=training(g),world=g.world,stocks={...g.resources},bag={...g.player.carry};
 const valid=g.serialize();
 for(const mode of ['pending','acquired']){
  const raw=JSON.parse(JSON.stringify(valid)),team=raw.expansions127.modules.companions;
  raw.urban.peakScore=C.CITY_TIERS.at(-1).requiredScore;
  raw.urban.progression151={version:1,age:C.CompanionPackRules.exercises.triage.tier-1};
  assert.equal(C.cityTier(raw.urban.peakScore).id,C.CITY_TIERS.length-1);
  assert.equal(C.Urban.normalize(raw.urban).progression151.age,3,'The city marker itself is coherent.');
  assert.equal(C.Urban.knownTier(raw.urban).id,3);
  if(mode==='acquired'){team.training=null;team.trained.push('samir:triage');}
  assert.throws(()=>g.restoreSave(raw),/Équipe/,mode);
  assert.equal(g.world,world);assert.deepEqual(training(g),paid);
  assert.deepEqual(g.resources,stocks);assert.deepEqual(g.player.carry,bag);
  const historical=JSON.parse(JSON.stringify(raw));delete historical.urban.progression151;
  assert.deepEqual(globalThis.DeadwallSave.validate(historical).expansions127.modules.companions,team,'Historical knowledge without a marker keeps its valid paid state.');
 }
});
