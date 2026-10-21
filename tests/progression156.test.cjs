'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const C=require('../src/core.js'),Catalogue=require('../src/city-catalogue150.js');
let env;
test.before(()=>{env=bootDocument134();});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} / ${b}`);
function fresh(){
 const g=env.g;g.startNew('standard','17117');g.campaignIntro132.skip();const Unit=g.units[0].constructor;g.units=[];g.phaseTime=999;
 const core=g.core(),clinic=new(core.constructor)(g.nextId++,'clinic',core.gx+5,core.gy,0,1);
 // A completed, legal old clinic is explicit setup. The armory still charges
 // its normal work; this fixture is not a financed campaign or duration proof.
 assert.equal(g.world.placement(clinic.def,clinic.gx,clinic.gy).valid,true);g.world.add(clinic);g.refreshMetrics(true);
 Object.assign(g.player,{x:core.right+16,y:clinic.y,health:80,invulnerable:0});
 assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);
 assert.equal(g.workerCanWorkAt(g.player,core,C.Arsenal134Rules.homeReach),true);
 assert.equal(g.workerCanWorkAt(g.player,clinic,130),true);assert.ok(Math.hypot(g.player.x-clinic.x,g.player.y-clinic.y)<130);
 assert.equal(clinic.powered,true);return{g,clinic,Unit};
}
function work(g,seconds){for(let left=seconds;left>1e-8;left-=.1)g.arsenal134.step(Math.min(.1,left));}
function survivalWork(g,seconds){for(let left=seconds;left>1e-8;left-=.1)g.survivalPack.step(Math.min(.1,left));}
function craft(g,id='pipe'){
 const q=g.arsenal134.preview('craft',id),before={...g.resources};assert.equal(q.ok,true,q.reason);
 assert.equal(g.arsenal134.begin('craft',id).ok,true);work(g,q.seconds);assert.equal(g.arsenal134.busy(),false);
 for(const key of C.RESOURCE_KEYS)near(g.resources[key],before[key]-(q.cost[key]||0));
 const item=g.arsenal134.snapshot().locker.at(-1);assert.equal(item.id,id);assert.equal(item.rounds,0);return item;
}

test('156 armurerie : un impact suivi d’un soin réel ne reprend pas l’assemblage et ne paie aucun matériau',()=>{
 const {g}=fresh(),q=g.arsenal134.preview('craft','pipe'),stock={...g.resources},items=g.arsenal134.snapshot();
 assert.equal(g.arsenal134.begin('craft','pipe').ok,true);work(g,.5);g.damagePlayer(.1);
 g.updateBuildings(.1);assert.ok(g.player.health>=80,'The existing powered clinic conceals the small hit by healing it');
 assert.equal(g.arsenal134.busy(),false,'Damage must end the unfinished work before the following heal');
 work(g,q.seconds);assert.equal(g.resources.scrap,stock.scrap);assert.equal(g.resources.wood,stock.wood);
 assert.deepEqual(g.arsenal134.snapshot(),items);assert.match(g.arsenal134.overview().summary,/Blessure reçue/);
 const after={...g.resources};assert.equal(g.save(false),true);assert.equal(g.load(),true);
 assert.equal(g.arsenal134.busy(),false);assert.deepEqual(g.arsenal134.snapshot(),items);assert.deepEqual(g.resources,after);
});

test('156 armurerie : la réparation interrompue garde état et chargeur après soin et Continue',()=>{
 const {g}=fresh(),item=craft(g),raw=g.serialize();
 // The previous wear is an explicit saved setup; acquisition above was paid.
 raw.expansions127.modules.arsenal134.locker.find(i=>i.uid===item.uid).condition=43;g.restoreSave(raw);
 const worn=g.arsenal134.snapshot(),before={...g.resources};g.player.invulnerable=0;
 assert.equal(g.arsenal134.begin('repair','pipe',item.uid).ok,true);work(g,.5);g.damagePlayer(.1);g.updateBuildings(.1);
 assert.equal(g.arsenal134.busy(),false);work(g,5);assert.deepEqual(g.arsenal134.snapshot(),worn);
 assert.equal(g.resources.scrap,before.scrap);assert.equal(g.resources.ammo,before.ammo);
 const saved={...g.resources};assert.equal(g.save(false),true);assert.equal(g.load(),true);
 assert.deepEqual(g.arsenal134.snapshot(),worn);assert.deepEqual(g.resources,saved);
});

test('156 armurerie : invulnérabilité et impact nul conservent un travail légitime payé une seule fois',()=>{
 const {g}=fresh(),q=g.arsenal134.preview('craft','pipe'),before={...g.resources};
 assert.equal(g.arsenal134.begin('craft','pipe').ok,true);work(g,.5);const progress=g.arsenal134.view().task.progress;
 g.player.invulnerable=1;g.damagePlayer(8);assert.equal(g.arsenal134.busy(),true);assert.equal(g.player.health,80);
 g.player.invulnerable=0;g.damagePlayer(0);assert.equal(g.arsenal134.busy(),true);assert.equal(g.arsenal134.view().task.progress,progress);
 work(g,q.seconds);assert.equal(g.arsenal134.busy(),false);for(const key of C.RESOURCE_KEYS)near(g.resources[key],before[key]-(q.cost[key]||0));
 assert.equal(g.arsenal134.snapshot().locker.length,1);work(g,10);assert.equal(g.arsenal134.snapshot().locker.length,1);
});

test('156 clinique : médicaments absents, panne ou support hors service arrêtent le soin sans dépenses',()=>{
 const {g,clinic}=fresh();g.resources.medicine=0;g.updateBuildings(.1);assert.equal(g.player.health,80);
 g.resources.medicine=2;
 for(const flag of ['siegeOffline','territoryOffline','dayOffline','gridOffline']){
  clinic[flag]=true;const before={...g.resources};g.updateBuildings(.1);assert.equal(g.player.health,80,flag);assert.deepEqual(g.resources,before,flag);clinic[flag]=false;
 }
 clinic.powered=false;const stock={...g.resources};g.updateBuildings(.1);assert.equal(g.player.health,80);assert.deepEqual(g.resources,stock);
});

test('156 clinique : paiement proportionnel au soin utile, stock limité et aucun soin aux morts',()=>{
 const {g,clinic}=fresh(),cost=C.NPC_RULES.clinicMedicinePerHealth,rate=C.NPC_RULES.clinicPlayerHealPerSecond;
 g.resources.medicine=cost*.04;g.updateBuildings(.1);near(g.player.health,80.04);near(g.resources.medicine,0);
 g.player.health=g.player.maxHealth-.02;g.resources.medicine=1;g.updateBuildings(.1);near(g.player.health,g.player.maxHealth);near(g.resources.medicine,1-.02*cost);
 const remaining=g.resources.medicine;g.updateBuildings(.1);near(g.resources.medicine,remaining);
 for(const dead of [true,false]){g.player.dead=dead;g.player.health=0;g.updateBuildings(.1);assert.equal(g.player.health,0);near(g.resources.medicine,remaining);}
 g.player.dead=false;g.player.health=80;g.resources.medicine=1;g.updateBuildings(.1);near(g.player.health,80+rate*.1);near(g.resources.medicine,1-rate*.1*cost);
 assert.equal(clinic.powered,true);
});

test('156 clinique : les unités gardent leur débit, les médicaments partagés paient chaque PV et un mort reste au sol',()=>{
 const {g,Unit}=fresh(),unit=new Unit(g.nextId++,'worker',g.player.x,g.player.y),r=C.NPC_RULES;
 unit.health=30;g.units=[unit];g.resources.medicine=1;g.updateBuildings(.1);
 near(unit.health,30+r.clinicUnitHealPerSecond*.1);near(g.player.health,80+r.clinicPlayerHealPerSecond*.1);
 near(g.resources.medicine,1-(r.clinicUnitHealPerSecond+r.clinicPlayerHealPerSecond)*.1*r.clinicMedicinePerHealth);
 g.player.health=100;unit.health=30;g.resources.medicine=r.clinicMedicinePerHealth*.03;g.updateBuildings(.1);
 near(unit.health,30.03);near(g.resources.medicine,0);
 g.resources.medicine=1;unit.health=0;unit.dead=true;g.updateBuildings(.1);assert.equal(unit.health,0);near(g.resources.medicine,1);
});

test('156 soins D17 : une position locale sauvegardée ne soigne pas le commandant physiquement parti en région',()=>{
 const {g,clinic}=fresh(),core=g.core(),hospital=new(core.constructor)(g.nextId++,'hospital',core.gx+4,core.gy+4,0,1);
 // The prepared hospital stays west of the protected road; its native placement is checked below.
 // Prepared old hospital and a prepared real regional pose isolate presence;
 // they do not claim construction, travel, earned age or a human playthrough.
 assert.equal(g.world.placement(hospital.def,hospital.gx,hospital.gy).valid,true);g.world.add(hospital);g.refreshMetrics(true);
 g.player.y=clinic.bottom+16;
 assert.equal(hospital.powered,true);assert.equal(g.workerCanWorkAt(g.player,hospital,hospital.def.medicalRadius),true);
 assert.ok(Math.hypot(g.player.x-hospital.x,g.player.y-hospital.y)<=hospital.def.medicalRadius);
 clinic.powered=false;const atHome=g.player.health;g.updateBuildings(.1);assert.ok(g.player.health>atHome,'The real hospital heals the same accessible pose while the commandant is physically present');clinic.powered=true;
 const raw=g.serialize(),road=g.frontier.world().roads.find(r=>!g.frontier.world().blocked((r.a.x+r.b.x)/2,(r.a.y+r.b.y)/2,.4,0,null));assert.ok(road);
 Object.assign(raw.frontier,{active:true,anchor:{x:g.player.x,y:g.player.y},x:(road.a.x+road.b.x)/2,y:(road.a.y+road.b.y)/2,z:0,inside:null});
 g.restoreSave(raw);assert.equal(g.frontier.active(),true);assert.equal(g.player.regionAbsent,true);
 const health=g.player.health,stock={...g.resources};g.updateBuildings(.1);assert.equal(g.player.health,health);assert.deepEqual(g.resources,stock);
 const continued=g.serialize();g.restoreSave(continued);assert.equal(g.player.regionAbsent,true);g.updateBuildings(.1);assert.equal(g.player.health,health);assert.deepEqual(g.resources,stock);
 assert.ok(g.world.buildings.get(clinic.id));
});

test('156 catalogue : la clinique et l’atelier décrivent leurs conditions matérielles réelles sans modifier les prix',()=>{
 const rows=Catalogue.create(C).items,clinic=rows.find(d=>d.kind==='building'&&d.id==='clinic'),recipe=rows.find(d=>d.kind==='recipe'&&d.id==='assemblyHammer');
 assert.deepEqual(clinic.cost,C.BUILDINGS.clinic.cost);assert.match(clinic.tradeoffs.join(' '),/médicament/);
 assert.match(recipe.tradeoffs.join(' '),/alimenté/);assert.match(recipe.tradeoffs.join(' '),/accessible/);
 assert.deepEqual(recipe.cost,C.Arsenal134Rules.catalog.assemblyHammer.cost);
 assert.equal(C.Balance151.TIER_REQUIREMENTS[10].waves,60);assert.equal(C.Balance151.TIER_REQUIREMENTS[10].population,190);
});

test('156 bivouac : le devis refuse une halte trop courte, puis une relève réalisable paie et soigne une seule fois',()=>{
 const {g}=fresh(),r=C.SurvivalPackRules;
 for(const [key,n]of Object.entries(r.camp.cost))assert.equal(g.loadout.transfer('depot','sac',key,n).amount,n);
 assert.equal(g.loadout.transfer('depot','sac','food',r.rest.cost.food).amount,r.rest.cost.food);
 let quote;
 for(let y=2250;y<3000&&!quote?.ok;y+=40)for(let x=2250;x<3000&&!quote?.ok;x+=40){Object.assign(g.player,{x,y,facing:0});if(g.friendlyPositionClear(g.player,x,y))quote=g.survivalPack.preview('camp');}
 assert.equal(quote.ok,true,quote.reason);const bag={...g.player.carry};assert.equal(g.survivalPack.begin('camp').ok,true);survivalWork(g,r.camp.seconds);
 assert.equal(g.survivalPack.snapshot().camps.length,1);for(const key of C.RESOURCE_KEYS)near(g.player.carry[key],bag[key]-(r.camp.cost[key]||0));
 // Only the remaining lifetime is prepared; the support, original payment and
 // subsequent rest use the real controller, geometry, finite bag and work.
 const short=g.serialize();short.expansions127.modules.survival.camps[0].left=r.rest.seconds-1;g.restoreSave(short);
 const before={...g.player.carry},health=g.player.health;
 assert.equal(g.survivalPack.preview('rest').ok,false);assert.equal(g.survivalPack.begin('rest').ok,false);assert.match(g.survivalPack.overview().summary,/expire/);
 assert.deepEqual(g.player.carry,before);assert.equal(g.player.health,health);assert.equal(g.survivalPack.busy(),false);
 const feasible=g.serialize();feasible.expansions127.modules.survival.camps[0].left=r.rest.seconds+.5;g.restoreSave(feasible);
 assert.equal(g.survivalPack.begin('rest').ok,true);survivalWork(g,r.rest.seconds);assert.equal(g.survivalPack.busy(),false);
 near(g.player.health,health+r.rest.heal);near(g.player.carry.food,before.food-r.rest.cost.food);survivalWork(g,1);
 near(g.player.health,health+r.rest.heal);near(g.player.carry.food,before.food-r.rest.cost.food);
 const saved=g.survivalPack.snapshot();assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.survivalPack.snapshot(),saved);
});
