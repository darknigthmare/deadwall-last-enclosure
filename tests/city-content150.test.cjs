'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');
const H=require('./helpers/city-content150.cjs');
const ids=Object.keys(C.CityContent150.BUILDINGS);
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,actual+' / '+expected);

test('cité150 : vingt choix distribués sur les huit âges avancés, valeurs et dépendances valides',()=>{
 assert.equal(ids.length,20);assert.equal(Object.keys(C.Urban.BUILDINGS).length,26);
 assert.deepEqual(C.CITY_TIERS.map(t=>ids.filter(id=>C.BUILDINGS[id].unlockTier===t.id).length),[0,0,0,2,2,2,2,3,3,3,3]);
 for(const id of ids){const d=C.BUILDINGS[id];assert.equal(C.CityContent150.BUILDINGS[id],d);assert.ok(Object.isFrozen(d));
  assert.ok(d.health>0&&d.buildTime>0&&d.score>0&&d.description&&d.family150);assert.equal(d.size.length,2);
  for(const [key,n]of Object.entries(d.cost)){assert.ok(C.RESOURCE_KEYS.includes(key));assert.ok(Number.isFinite(n)&&n>0);}
  const seen=new Set([id]);let dependency=d.requires;while(dependency){assert.ok(!seen.has(dependency));seen.add(dependency);const next=C.BUILDINGS[dependency];assert.ok(next);assert.ok(next.unlockTier<=d.unlockTier);dependency=next.requires;}
 }
 assert.equal(C.BUILDINGS.woodWall.upgradeTo,'steelWall');assert.equal(C.BUILDINGS.steelWall.upgradeTo,'concreteWall');assert.equal(C.BUILDINGS.gate.upgradeTo,'armoredGate');
});

for(const id of ids)test('cité150 '+id+' : chantier payé, capacités après travaux, Continue exacte et perte réelle',()=>{
 const {g,C}=H.fresh();H.advanced(g,id);const b=H.build(g,id),before=H.continueExactly(g),saved=before.buildings.find(v=>v.id===b.id);
 assert.equal(saved.type,id);assert.equal(saved.progress,1);assert.equal(before.version,C.SAVE_VERSION);
 const restored=g.world.buildings.get(b.id),storage=g.storage,housing=g.housing,score=g.cityScore,knowledge=g.tier.id;
 g.destroyBuilding(restored);assert.equal(g.storage,storage-(restored.def.storage||0));assert.equal(g.housing,housing-(restored.def.housing||0));assert.equal(g.cityScore,score-restored.def.score);assert.equal(g.tier.id,knowledge);
 assert.equal(g.world.buildings.has(b.id),false);H.continueExactly(g);
});

test('cité150 : âge insuffisant, prérequis perdu et manque de stocks ne prélèvent rien',()=>{
 for(const id of ids){const {g,C}=H.fresh(),d=C.BUILDINGS[id];g.urban.attain(C.CITY_TIERS[d.unlockTier-1].requiredScore);g.refreshMetrics(true);
  let before=H.stable(g),p=H.freeCell(g,id);assert.equal(g.placeOne(id,p.gx,p.gy),false);assert.deepEqual(H.stable(g),before);
  g.urban.attain(C.CITY_TIERS[d.unlockTier].requiredScore);g.refreshMetrics(true);before=H.stable(g);assert.equal(g.placeOne(id,p.gx,p.gy),false);assert.deepEqual(H.stable(g),before);
  H.advanced(g,id);p=H.freeCell(g,id);for(const key of C.RESOURCE_KEYS)g.resources[key]=0;before=H.stable(g);assert.equal(g.placeOne(id,p.gx,p.gy),false);assert.deepEqual(H.stable(g),before);
  for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(3000,g.storage);const prerequisite=[...g.world.buildings.values()].find(b=>b.type===d.requires);g.destroyBuilding(prerequisite);before=H.stable(g);assert.equal(g.placeOne(id,p.gx,p.gy),false);assert.deepEqual(H.stable(g),before);
 }
});

for(const from of ['sterilizationLab150','electricCannery150'])test('cité150 évolution '+from+' : retirer explicitement le régulateur, conserver la cassette et Continue',()=>{
 const {g,C,doc}=H.fresh();H.advanced(g,from);const b=H.build(g,from),to=b.def.upgradeTo,R=C.FortificationPackRules;
 if(C.BUILDINGS[to].requires)H.prepare(g,C.BUILDINGS[to].requires);H.standAt(g,g.player,b);g.selectBuilding(b);
 for(const kind of ['regulator','repair']){
  const stock={...g.resources};assert.equal(g.fortificationPack.equip(kind,b.id).ok,true);
  for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(R[kind+'Cost'][key]||0));
 }
 H.continueExactly(g);let support=g.world.buildings.get(b.id);H.standAt(g,g.player,support);g.selectBuilding(support);
 const before=H.stable(g),quote=g.structureActionStatus('upgrade',support);
 assert.equal(quote.ok,false);assert.match(quote.reason,/Retirez le régulateur via Fortifications/);
 assert.deepEqual(H.stable(g),before);assert.equal(g.upgradeSelected(),false);assert.deepEqual(H.stable(g),before);
 g.updateSelectionUI();assert.equal(g.ui.upgradeSelected.disabled,true);assert.match(doc.getElementById('selectionUpgradeQuote').textContent,/Retirez le régulateur via Fortifications/);
 const attached=g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);assert.equal(attached.regulator,true);assert.equal(attached.repair,R.repairCapacity);
 H.continueExactly(g);support=g.world.buildings.get(b.id);H.standAt(g,g.player,support);g.selectBuilding(support);
 const removalStock={...g.resources};assert.equal(g.fortificationPack.toggleRegulator(b.id).ok,true);assert.deepEqual(g.resources,removalStock);
 const remaining=g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);assert.equal(remaining.regulator,false);assert.equal(remaining.repair,R.repairCapacity);
 H.continueExactly(g);support=g.world.buildings.get(b.id);H.standAt(g,g.player,support);g.selectBuilding(support);
 const evolutionStock={...g.resources},allowed=g.structureActionStatus('upgrade',support);assert.equal(allowed.ok,true);
 assert.deepEqual(allowed.cost,C.scaledCost(C.BUILDINGS[to].cost,C.MAINTENANCE_RULES.upgradeFactor));assert.equal(g.upgradeSelected(),true);assert.equal(support.type,to);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],evolutionStock[key]-(allowed.cost[key]||0));
 const kept=g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);assert.equal(kept.regulator,false);assert.equal(kept.repair,R.repairCapacity);
 H.continueExactly(g);assert.equal(g.world.buildings.get(b.id).type,to);assert.equal(g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id).repair,R.repairCapacity);
});

for(const [from,to]of Object.entries(C.CityContent150.UPGRADES))test('cité150 évolution '+from+' : même emprise, paiement exact, ratio et Continue conservés',()=>{
 const {g,C}=H.fresh();H.advanced(g,from);
 // The historical recovery bench is an already earned legacy support fixture.
 // Its new upgrade still goes through the real payment and occupation changes.
 const b=from==='recoveryBench'?H.prepare(g,from):H.build(g,from),target=C.BUILDINGS[to];if(target.requires)H.prepare(g,target.requires);
 for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(3000,g.storage);
 b.health=b.maxHealth*.61;g.selectBuilding(b);const cells=g.world.cells(b),position={gx:b.gx,gy:b.gy,rotation:b.rotation},stock={...g.resources},storage=g.storage,housing=g.housing;
 assert.deepEqual(b.def.size,target.size);const quote=g.structureActionStatus('upgrade',b);assert.equal(quote.ok,true);
 for(const [key,n]of Object.entries(target.cost))assert.equal(quote.cost[key],Math.ceil(n*C.MAINTENANCE_RULES.upgradeFactor));
 assert.equal(g.upgradeSelected(),true);assert.equal(b.type,to);assert.equal(b.progress,1,'Historical upgrade is immediate, not a new foundation');
 close(b.health/b.maxHealth,.61);assert.deepEqual(g.world.cells(b),cells);assert.deepEqual({gx:b.gx,gy:b.gy,rotation:b.rotation},position);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(quote.cost[key]||0));
 assert.equal(g.storage,storage-(C.BUILDINGS[from].storage||0)+(target.storage||0));assert.equal(g.housing,housing-(C.BUILDINGS[from].housing||0)+(target.housing||0));
 if(from==='sterilizationLab150'){assert.equal(b.def.production,undefined);assert.ok(b.def.medicalRadius>0);}
 H.continueExactly(g);
});

test('cité150 évolutions : refus au palier bas, sans prérequis, chantier inachevé ou fonds insuffisants',()=>{
 const {g,C}=H.fresh();H.advanced(g,'casemate150');const b=H.build(g,'casemate150');g.selectBuilding(b);
 let before=H.stable(g);assert.equal(g.upgradeSelected(),false,'Workshop absent');assert.deepEqual(H.stable(g),before);
 H.prepare(g,'workshop');b.progress=.5;g.refreshMetrics(true);before=H.stable(g);assert.equal(g.upgradeSelected(),false);assert.deepEqual(H.stable(g),before);
 b.progress=1;g.refreshMetrics(true);for(const key of C.RESOURCE_KEYS)g.resources[key]=0;before=H.stable(g);assert.equal(g.upgradeSelected(),false);assert.deepEqual(H.stable(g),before);
 const early=H.fresh();H.prepare(early.g,'barracks');early.g.urban.attain(48);early.g.resources.stone=75;early.g.refreshMetrics(true);const old=H.build(early.g,'casemate150');early.g.selectBuilding(old);before=H.stable(early.g);assert.equal(early.g.upgradeSelected(),false,'Mégaville I not reached');assert.deepEqual(H.stable(early.g),before);
});

test('cité150 industrie : intrants, puissance, saturation et filières sans carburant appliqués',()=>{
 for(const id of ['sterilizationLab150','biofuelYard150','electricCannery150','electricGreenhouse150','dualRecovery150','continuityArsenal150']){
  const {g,C}=H.fresh();H.advanced(g,id);H.prepare(g,'megaPower');const b=H.build(g,id);g.population=0;
  for(const other of g.world.buildings.values())if(other.id!==b.id&&other.def.production&&other.def.powerUse)g.powerGrid.setCircuit(other.id,'off');
  g.refreshMetrics(true);g.population=0;assert.equal(b.powered,true);
  const generatorFuel=[...g.world.buildings.values()].filter(v=>v.completed&&!v.dead&&!v.siegeOffline&&!v.territoryOffline&&(v.type==='generator'||v.def.generatorFuel)).reduce((n,v)=>n+(v.def.generatorFuel||.018),0);
  const background={};for(const other of g.world.buildings.values())if(other.id!==b.id&&other.completed&&!other.dead&&!other.def.powerUse)for(const [key,n]of Object.entries(other.def.production||{}))background[key]=(background[key]||0)+n;
  const stock={...g.resources};g.economyTick(.1);
  for(const [key,n]of Object.entries(b.def.production))close(g.resources[key],stock[key]+(n+(background[key]||0))*.1-(key==='fuel'?generatorFuel*.1:0));
  for(const [key,n]of Object.entries(b.def.consumes||{}))close(g.resources[key],stock[key]-n*.1-(key==='fuel'?generatorFuel*.1:0));
  if(!Object.hasOwn(b.def.consumes||{},'fuel')&&!Object.hasOwn(b.def.production,'fuel'))close(g.resources.fuel,stock.fuel-generatorFuel*.1);
  const output=Object.keys(b.def.production)[0];g.resources[output]=g.storage;const saturated={...g.resources};g.economyTick(.1);close(g.resources[output],g.storage);
  for(const key of Object.keys(b.def.production))if(key!==output)close(g.resources[key],saturated[key]+(background[key]||0)*.1);
  // Running generators create genuine fuel space before the factory works.
  // Replace only that consumed fraction; other full outputs stop the whole cycle.
  const saturationFraction=output==='fuel'?Math.min(1,generatorFuel/b.def.production.fuel):0;
  for(const [key,n]of Object.entries(b.def.consumes||{}))close(g.resources[key],saturated[key]-n*.1*saturationFraction-(key==='fuel'?generatorFuel*.1:0)+(background[key]||0)*.1);
  g.resources[output]=0;assert.equal(g.powerGrid.setCircuit(b.id,'off'),true);g.population=0;const off=g.resources[output];g.economyTick(.1);close(g.resources[output],off+(background[output]||0)*.1);
 }
});

test('cité150 soins : portée, médicament, circuit et aucune résurrection',()=>{
 for(const id of ['aidStation150','triageStation150','medicalComplex150','equippedShelter150']){
  const {g}=H.fresh();H.advanced(g,id);H.prepare(g,'megaPower');const b=H.build(g,id);
  for(const other of g.world.buildings.values())if(other.id!==b.id&&other.def.powerUse&&(other.type==='clinic'||other.def.medicalRadius))g.powerGrid.setCircuit(other.id,'off');
  g.refreshMetrics(true);H.standAt(g,g.player,b);g.player.health=50;
  let medicine=g.resources.medicine;g.updateBuildings(.1);close(g.player.health,50+b.def.healRate*.1);close(g.resources.medicine,medicine-b.def.healRate*.1*b.def.medicinePerHealth);
  g.resources.medicine=0;let health=g.player.health;g.updateBuildings(.1);assert.equal(g.player.health,health);
  g.resources.medicine=20;assert.equal(g.powerGrid.setCircuit(b.id,'off'),true);g.updateBuildings(.1);assert.equal(g.player.health,health);assert.equal(g.powerGrid.setCircuit(b.id,'on'),true);
  g.player.x=3900;g.player.y=3900;g.updateBuildings(.1);assert.equal(g.player.health,health);
  g.player.dead=true;g.updateBuildings(.1);assert.equal(g.player.dead,true);assert.equal(g.player.health,health);
 }
});

test('cité150 défense autonome : deux cartouches par tir, pas de tirs sans réserve',()=>{
 const {g,C}=H.fresh();H.advanced(g,'twinGun150');const b=H.build(g,'twinGun150');g.resources.fuel=0;g.refreshMetrics(true);assert.equal(b.powered,true);
 g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=b.x+150;z.y=b.y;g.rebuildBuckets();const stock=g.resources.ammo;b.fireCooldown=0;g.updateBuildings(.1);
 assert.equal(g.resources.ammo,stock-C.BUILDINGS.twinGun150.ammoPerShot);assert.equal(g.projectiles.length,1);
 g.resources.ammo=1;b.fireCooldown=0;g.updateBuildings(.1);assert.equal(g.resources.ammo,1);assert.equal(g.projectiles.length,1);
});

test('cité150 énergie : parc de jour, accumulateur vide et charge réellement produite',()=>{
 const {g,C}=H.fresh();H.advanced(g,'solarPark150');const solar=H.build(g,'solarPark150'),calm=g.powerGenerated;
 g.phase='warning';g.refreshMetrics(true);assert.equal(g.powerGenerated,calm-C.BUILDINGS.solarPark150.powerGen);
 g.phase='calm';H.prepare(g,'powerPlant');for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(3000,g.storage);const battery=H.build(g,'frontBattery150');
 assert.equal(g.powerGrid.charge(battery.id),0);g.powerGrid.step(.1);assert.ok(g.powerGrid.charge(battery.id)>0);assert.ok(g.powerGrid.charge(battery.id)<=C.BUILDINGS.frontBattery150.battery.chargeRate*.1);
 H.continueExactly(g);assert.ok(g.powerGrid.charge(battery.id)>0);assert.equal(solar.dead,false);
});

for(const p of C.CityContent150.PLANS)test('cité150 plan '+p.id+' : passages, devis intégral, fondations payées et reprise',()=>{
 const items=C.Dayworks.footprint(p.id,0,0),cells=new Set(),expected={};
 for(const item of items){const d=C.BUILDINGS[item.type];for(const [key,n]of Object.entries(d.cost))expected[key]=(expected[key]||0)+n;
  for(let y=0;y<d.size[1];y++)for(let x=0;x<d.size[0];x++){const gx=item.gx+x,gy=item.gy+y,key=gx+':'+gy;assert.ok(gx>=0&&gy>=0&&gx<p.w&&gy<p.h);assert.ok(!cells.has(key));cells.add(key);}
 }
 for(let y=0;y<p.h;y++)for(const x of [6,7])assert.ok(!cells.has(x+':'+y),'Continuous middle passage');
 assert.deepEqual(C.Dayworks.quote(items,C.BUILDINGS,()=>({valid:true}),10,()=>true).cost,expected);
 const {g,C:runtimeC}=H.fresh();H.advanced(g);H.prepare(g,'planningOffice');for(const item of items)if(runtimeC.BUILDINGS[item.type].requires)H.prepare(g,runtimeC.BUILDINGS[item.type].requires);
 for(const key of runtimeC.RESOURCE_KEYS)g.resources[key]=Math.min(5000,g.storage);g.refreshMetrics(true);const position=H.planPosition(g,p.id),before=H.stable(g),stock={...g.resources},score=g.cityScore,count=g.world.buildings.size;
 assert.equal(g.dayworks.anchorPlan(p.id,position.x,position.y).ok,true);assert.deepEqual(H.stable(g),before);assert.equal(g.dayworks.commitPlan(),true);
 assert.equal(g.world.buildings.size,count+items.length);assert.equal(g.cityScore,score);
 for(const key of runtimeC.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(expected[key]||0));
 assert.equal([...g.world.buildings.values()].filter(b=>!b.completed).length,items.length);assert.equal(g.dayworks.commitPlan(),false);H.continueExactly(g);
});
