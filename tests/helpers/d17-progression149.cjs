'use strict';
const assert=require('node:assert/strict');
const C=require('../../src/core.js');
const {bootDocument134}=require('../../scripts/qa-startup134.cjs');
const {standAt}=require('./physical-fixtures.cjs');
const {legacyAge}=require('./legacy-city.cjs');

// This is a transaction/transition scenario, not a human campaign timing run.
// After Avant-poste, a finite prepared material reserve supplies
// the normal 36-unit bag. Every delivery, price and construction remains real.
// Exterior actor placements omit travel. Waves, harvesting and economy do not
// advance here. Camp remains native; later earned-score thresholds explicitly
// import historical knowledge. This does not exercise the 1.51 campaign gates.
function auditD17Progression(){
 const {g}=bootDocument134();g.startNew('standard','17117');g.campaignIntro132?.skip();
 assert.equal(g.frontier.snapshot().generation,7,'The shipped HTML starts the current G7 campaign');
 const initial={...g.resources},reserve=C.makeBag({wood:30000,scrap:60000,stone:60000,food:500,fuel:2000,ammo:1000,medicine:200});
 const supplied=C.makeBag(),nativeHarvested=C.makeBag(),paid=C.makeBag(),constructions=[],transitions=[],normalizedFields=[],legacyKnowledgeImports=[];
 let activeConstructionSeconds=0,deliveries=0,saveReloads=0;
 const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-7,`${label}: ${actual} / ${expected}`);
 function fund(cost){
  for(const [key,n]of Object.entries(cost)){
   assert.ok(n<=g.storage,`The current storage can finance ${key}: ${n}`);
   while(g.resources[key]<n-1e-7){
    if(g.tier.id<2){
     const node=g.world.nodes.find(node=>!node.depleted&&node.type===key);assert.ok(node,'Native finite source for '+key);
     standAt(g,g.player,node);g.input.keys.add('KeyE');
     const before=g.player.carry[key];
     for(let tick=0;tick<200&&g.player.carry[key]<Math.min(g.player.carryCapacity,n-g.resources[key])&&!node.depleted;tick++)g.updateInteraction(.25);
     g.input.keys.clear();assert.ok(g.player.carry[key]>before,'Native harvest progresses');nativeHarvested[key]+=g.player.carry[key]-before;
     standAt(g,g.player,g.core());g.input.keys.add('KeyE');g.updateInteraction(.25);g.input.keys.clear();deliveries++;
     assert.equal(C.bagTotal(g.player.carry),0);continue;
    }
    const amount=Math.min(n-g.resources[key],g.player.carryCapacity,reserve[key]);
    assert.ok(amount>0,`Finite reserve exhausted for ${key}`);
    assert.equal(C.bagTotal(g.player.carry),0);
    reserve[key]-=amount;supplied[key]+=amount;g.player.carry[key]=amount;
    standAt(g,g.player,g.core());const before=g.resources[key];
    g.input.keys.add('KeyE');g.updateInteraction(.25);g.input.keys.clear();deliveries++;
    close(g.resources[key],before+amount,`Physical ${key} delivery`);
    assert.equal(C.bagTotal(g.player.carry),0);
   }
  }
 }
 function placement(type){
  const def=C.BUILDINGS[type],core=g.core();
  for(let r=6;r<62;r++)for(let dy=-r;dy<=r;dy++)for(const dx of Math.abs(dy)===r?Array.from({length:2*r+1},(_,i)=>i-r):[-r,r]){
   const x=core.gx+dx,y=core.gy+dy;
   if(g.world.placement(def,x,y,0).valid)return{x,y};
  }
  throw Error(`No lawful placement for ${type}`);
 }
 function continueExactly(label){
  const before=g.serialize();delete before.timestamp;
  assert.equal(g.save(false),true,label+' save');g.returnToMenu();assert.equal(g.load(),true,label+' Continue');
  const after=g.serialize();delete after.timestamp;
  // The historical loader materializes the unannounced default wave plan.
  // Warning preparation replaces it with the actual signature-dependent plan.
  if(before.wavePlan===null){assert.equal(before.phase,'calm');assert.deepEqual(after.wavePlan,C.wavePlan(before.wave,g.difficulty,0));before.wavePlan=after.wavePlan;normalizedFields.push('null calm wavePlan → deferred default');}
  assert.deepEqual(after,before,label+' preserves all remaining fields');saveReloads++;
 }
 function build(type){
  const def=C.BUILDINGS[type];assert.ok(def.unlockTier<=g.tier.id,type+' is available');
  if(def.requires)assert.equal(g.world.has(def.requires),true,type+' has a finished prerequisite');
  fund(def.cost);const cell=placement(type),stock={...g.resources},score=g.cityScore,age=g.tier.id,housing=g.housing,storage=g.storage;
  assert.equal(g.placeOne(type,cell.x,cell.y),true);let b=g.world.atCell(cell.x,cell.y);
  assert.ok(b&&b.type===type);assert.equal(b.progress,0);assert.equal(g.cityScore,score);assert.equal(g.tier.id,age);
  assert.equal(g.housing,housing);assert.equal(g.storage,storage);
  for(const key of C.RESOURCE_KEYS){close(g.resources[key],stock[key]-(def.cost[key]||0),type+' paid '+key);paid[key]+=def.cost[key]||0;}
  standAt(g,g.player,b);g.input.keys.add('KeyE');let seconds=0;
  for(let tick=0;tick<1200&&!b.completed;tick++){g.updateInteraction(.25);seconds+=.25;}
  g.input.keys.clear();assert.equal(b.completed,true,type+' must physically finish');g.refreshMetrics(true);
  close(g.cityScore,score+def.score,type+' actual score');close(g.housing,housing+(def.housing||0),type+' housing');close(g.storage,storage+(def.storage||0),type+' storage');
  if(C.cityTier(g.cityScore).id>g.tier.id){legacyKnowledgeImports.push({type,score:g.cityScore,age:C.cityTier(g.cityScore).id});legacyAge(g,g.cityScore);}
  activeConstructionSeconds+=seconds;
  const row={type,id:b.id,fromAge:age,toAge:g.tier.id,cost:{...def.cost},scoreBefore:score,scoreAfter:g.cityScore,activeConstructionSeconds:seconds};constructions.push(row);
  if(g.tier.id!==age){assert.equal(g.tier.id,age+1,'The scenario visits every age in order');transitions.push({...row,name:g.tier.name,threshold:g.tier.requiredScore,cumulativeConstructionSeconds:activeConstructionSeconds});continueExactly(g.tier.name);b=g.world.buildings.get(b.id);}
  return b;
 }
 assert.equal(g.cityScore,8);assert.equal(g.tier.id,0);
 for(const type of ['house','warehouse','barracks'])build(type);
 assert.equal(g.tier.id,2);assert.deepEqual(supplied,C.makeBag());
 for(const type of ['farm','generator','lumber','scrapyard','quarry','refinery','workshop','clinic','apartment','centralStore','hospital','marketHall','logisticsCenter','powerPlant','recyclingPlant','ammoFactory','rationPlant','residentialTower','cementWorks','cityArsenal'])build(type);
 while(g.tier.id<7)build('cementWorks');
 for(const type of ['logisticsHub','housingComplex','regionalHospital'])build(type);
 while(g.tier.id<8)build('housingComplex');
 for(const type of ['megaHousing','fuelWorks','districtSearchlight'])build(type);
 while(g.tier.id<9)build('megaHousing');
 for(const type of ['megaTower','agroComplex'])build(type);
 while(g.tier.id<10)build('agroComplex');
 build('megaPower');build('megaReserve');
 assert.deepEqual(transitions.map(t=>t.toAge),C.CITY_TIERS.slice(1).map(t=>t.id));
 const final=g.urban.planning();assert.equal(final.age.id,10);assert.equal(final.next,null);assert.equal(final.remaining,0);assert.equal(final.nextModels.length,0);
 assert.equal(g.world.has('megaReserve'),true);assert.equal(g.world.has('megaPower'),true);
 assert.ok(g.world.buildings.get(constructions.at(-1).id).completed);
 for(const key of C.RESOURCE_KEYS)close(g.resources[key],initial[key]+nativeHarvested[key]+supplied[key]-paid[key],'Finite material balance '+key);
 const recruitProof=[];
 for(const kind of ['worker','soldier','medic','engineer']){
  const def=C.SURVIVORS[kind];fund(def.cost);const before={...g.resources},population=g.population;
  assert.equal(g.recruit(kind),true);assert.equal(g.population,population+1);assert.equal(g.units.at(-1).kind,kind);
  assert.ok(g.friendlyPositionClear(g.units.at(-1),g.units.at(-1).x,g.units.at(-1).y));
  for(const key of C.RESOURCE_KEYS){close(g.resources[key],before[key]-(def.cost[key]||0),kind+' paid '+key);paid[key]+=def.cost[key]||0;}
  recruitProof.push({kind,cost:{...def.cost}});
 }
 // Construction spends the reserve; actual running machinery needs a separate,
 // finite physical delivery of combustible and feedstock after those prices.
 fund({fuel:20,scrap:20,wood:5});g.refreshMetrics(true);
 const powerBefore={generated:g.powerGenerated,used:g.powerUsed};
 for(const b of g.world.buildings.values())if(b.completed&&b.def.urbanKind==='housing'&&b.def.powerUse)assert.equal(g.powerGrid.setCircuit(b.id,'off'),true);
 g.refreshMetrics(true);assert.ok(g.powerGenerated>=g.powerUsed,'Housing circuits can be shed through actual paid-city commands');
 for(const b of g.world.buildings.values())if(b.completed&&b.def.production)assert.equal(b.powered,true,b.type+' industry must actually be supplied');
 const powerAfterHousingShedding={generated:g.powerGenerated,used:g.powerUsed};
 // Raffinerie urbaine consumes .6 wood/s, more than one .48 wood/s scierie.
 // Shed it through the actual circuit command to isolate the latter's output.
 const fuelWorks=[...g.world.buildings.values()].find(b=>b.type==='fuelWorks');assert.equal(g.powerGrid.setCircuit(fuelWorks.id,'off'),true);
 const beforeFuel=g.resources.fuel,beforeProduction={...g.resources};g.population=1+g.units.filter(u=>!u.dead).length;
 g.powerGrid.step(.25,true);g.economyTick(.25);assert.ok(g.resources.fuel<beforeFuel,'Actual active industry/generation consumes fuel');
 assert.ok(g.resources.wood>beforeProduction.wood,'Completed scierie has real output');assert.ok(g.resources.stone>beforeProduction.stone,'Completed quarries have real output');assert.ok(g.resources.ammo>beforeProduction.ammo,'Completed arsenal has real output');
 continueExactly('MÉGAVILLE III final');
 const beforeLoss={score:g.cityScore,storage:g.storage,housing:g.housing},knowledge=g.tier.id,capacity=g.storage,megaReserve=[...g.world.buildings.values()].find(b=>b.type==='megaReserve'),scoreBeforeLoss=g.cityScore;
 g.destroyBuilding(megaReserve);assert.equal(g.tier.id,knowledge);assert.equal(g.cityScore,scoreBeforeLoss-C.BUILDINGS.megaReserve.score);assert.equal(g.storage,capacity-C.BUILDINGS.megaReserve.storage);
 continueExactly('MÉGAVILLE III after loss');
 const report={version:1,scenario:'D17 finite materials / real transactions / historical eleven-age knowledge',knowledgeMode:'historical-earned-score-legacy-knowledge-fixture',legacyKnowledgeImports,runtime:'Full shipped HTML script order under a simulated DOM',regionalGeneration:g.frontier.snapshot().generation,limits:['Exterior positions are fixture placements; travel is omitted.','Camp is native; later historical knowledge is explicitly imported only after physical construction earns its score. This does not validate 1.51 campaign gates.','After Avant-poste, a finite scenario reserve supplies the bag; harvesting and material waiting are omitted.','Director and enemy combat do not run.','Construction action seconds are isolated active work, not campaign duration.','DOM simulation does not verify CSS layout, image decoding, physical devices or browser frame rate.'],initialNativeResources:initial,nativeHarvested,supplied,remainingReserve:reserve,paid,deliveries,saveReloads,normalizedFields,constructions,transitions,recruits:recruitProof,activeConstructionSeconds,powerBeforeHousingShedding:powerBefore,powerAfterHousingShedding,beforeLoss,finalAge:g.tier.id,finalName:g.tier.name,finalScore:g.cityScore,finalStorage:g.storage,finalHousing:g.housing,saveVersion:g.serialize().version,pass:true};
 g.startNew('standard','903145');assert.equal(g.tier.id,0);assert.equal(g.cityScore,8);assert.equal(g.urban.snapshot().peakScore,8);
 return report;
}
module.exports={auditD17Progression};
