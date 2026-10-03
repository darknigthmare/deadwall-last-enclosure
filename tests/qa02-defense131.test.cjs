'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js');

function fresh(){const {g}=boot131();g.phaseTime=999;g.units=[];return g;}
function post(g,b){return g.defense131.snapshot().posts.find(p=>p.id===b.id);}
function ticks(g,seconds,method='updateUnits'){for(let i=0;i<Math.ceil(seconds/.04);i++)g[method](.04);}
function add(g,type,gx,gy,progress=1){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,0,progress);g.world.add(b);g.refreshMetrics(true);g.selectBuilding(b);standAt(g,g.player,b);return b;}
function person(g,kind,b){const point=g.fieldcraft.service(g.player,b),u=g.createProtectedSurvivor(kind,point.x,point.y);assert.ok(u);return u;}
function prepare(g,b,kind){g.selectBuilding(b);standAt(g,g.player,b);const result=g.defense131[kind](b.id);assert.ok(result.ok,result.reason);}
function priority(g,b,value){g.selectBuilding(b);while(b.priority!==value)g.cyclePriority();}
function enemy(g,x,y){const z={id:g.nextId++,kind:'walker',x,y,health:60,maxHealth:60,dead:false,radius:10,vx:0,vy:0,think:0,attackCooldown:0,speedFactor:1,facing:0};g.zombies.push(z);g.rebuildBuckets();return z;}
function money(g){for(const k of C.RESOURCE_KEYS)g.resources[k]=300;}

test('QA02 — chantier payé, suspension, consigne et réfection autonomes après une vraie sortie G5',()=>{
 const g=fresh(),start={...g.resources};
 assert.equal(g.placeOne('gate',68,64),true);const gate=[...g.world.buildings.values()].find(b=>b.type==='gate');
 assert.equal(g.placeOne('gate',68,64),false);assert.equal(g.resources.wood,start.wood-C.BUILDINGS.gate.cost.wood);
 prepare(g,gate,'equipWorksite');const worker=person(g,'worker',gate);assert.equal(g.setWorkerOrder('build'),true);
 ticks(g,1);assert.ok(gate.progress>0);assert.ok(post(g,gate).work<8);
 assert.equal(g.citadel.suspend(gate.id,true),true);const progress=gate.progress,budget=post(g,gate).work;
 ticks(g,1);assert.equal(gate.progress,progress);assert.equal(post(g,gate).work,budget);
 assert.equal(g.citadel.suspend(gate.id,false),true);ticks(g,10);assert.equal(gate.completed,true);assert.equal(post(g,gate),undefined);
 prepare(g,gate,'configureGate');prepare(g,gate,'startMaintenance');gate.health=gate.maxHealth*.5;
 const engineer=person(g,'engineer',gate),hp=gate.health;
 assert.equal(g.resources.scrap,start.scrap-C.BUILDINGS.gate.cost.scrap-C.Defense131Rules.workCost.scrap-C.Defense131Rules.gateCost.scrap-C.Defense131Rules.maintenanceCost.scrap);
 const paid=g.resources.scrap;g.player.x=2048;g.player.y=20;assert.equal(g.frontier.enter('north'),true);
 g.phaseTime=.04;ticks(g,2.2,'update');assert.equal(g.frontier.active(),true);assert.equal(g.phase,'warning');assert.equal(gate.gateMode,'closed');assert.ok(gate.health>hp);assert.ok(engineer.health>0);assert.ok(worker.health>0);assert.equal(g.resources.scrap,paid);
 const warning=g.departure130.assess();assert.equal(warning.noFire,true);assert.match(warning.advice,/tomber/);
 const saved=g.serialize(),reserved=post(g,gate).maintenance;g.restoreSave(saved);assert.deepEqual(post(g,g.world.buildings.get(gate.id)).maintenance,reserved);assert.equal(g.frontier.active(),true);
});

test('QA02 — réfection réservée conserve priorité haute, puis proximité, face aux réparations communes',()=>{
 const g=fresh();money(g);const low=add(g,'woodWall',68,68),high=add(g,'woodWall',70,68);
 low.health=low.maxHealth*.2;high.health=high.maxHealth*.6;priority(g,low,1);priority(g,high,3);
 prepare(g,low,'startMaintenance');prepare(g,high,'startMaintenance');const u=person(g,'engineer',high);
 assert.equal(g.findEngineerTarget(u),high);g.updateUnits(.04);assert.equal(u.targetBuilding,high.id);
 // A common-stock urgent repair must not disappear behind a prepaid low-priority box.
 prepare(g,high,'recoverMaintenance');u.think=0;assert.equal(g.findEngineerTarget(u),high);g.updateUnits(.04);assert.equal(u.targetBuilding,high.id);
 prepare(g,high,'startMaintenance');priority(g,low,2);priority(g,high,2);low.health=high.health=low.maxHealth*.5;
 standAt(g,u,high);assert.ok(Math.hypot(u.x-high.x,u.y-high.y)<Math.hypot(u.x-low.x,u.y-low.y));assert.equal(g.findEngineerTarget(u),high);
});

test('QA02 — outillage ne détourne ni récolte ni livraison, priorité de chantier et repli gardés',()=>{
 const g=fresh();money(g);const low=add(g,'warehouse',68,68,.1),high=add(g,'warehouse',72,68,.1),u=person(g,'worker',low);
 prepare(g,low,'equipWorksite');priority(g,low,1);assert.equal(g.citadel.prioritize(high.id),true);
 assert.equal(g.setWorkerOrder('harvest'),true);g.updateUnits(.04);assert.equal(u.state,'gather');assert.equal(post(g,low).work,8);
 u.carry=3;u.carryType='wood';assert.equal(g.setWorkerOrder('build'),true);g.updateUnits(.04);assert.equal(u.state,'return');assert.equal(post(g,low).work,8);
 u.carry=0;u.carryType=null;u.state='idle';u.think=0;g.updateUnits(.04);assert.equal(u.targetBuilding,high.id);assert.equal(post(g,low).work,8);
 assert.equal(g.citadel.suspend(high.id,true),true);u.state='idle';u.think=0;standAt(g,u,low);g.updateUnits(.04);assert.equal(u.targetBuilding,low.id);assert.ok(post(g,low).work<8);
 assert.equal(g.setWorkerOrder('retreat'),true);const budget=post(g,low).work;ticks(g,1);assert.equal(post(g,low).work,budget);assert.equal(u.state,'flee');
});

test('QA02 — cassettes manuelles complètent les derniers 10 %, sans vider la caisse ingénieur',()=>{
 const g=fresh();money(g);const b=add(g,'woodWall',68,68),u=person(g,'engineer',b);prepare(g,b,'startMaintenance');
 assert.ok(g.fortificationPack.equip('repair',b.id).ok);b.health=b.maxHealth*.89;ticks(g,1);assert.equal(b.health,b.maxHealth*.9);
 const reserve=post(g,b).maintenance,common={...g.resources};assert.ok(g.fortificationPack.startRepair(b.id).ok);
 for(let i=0;i<125;i++){g.fortificationPack.step(.04);g.updateUnits(.04);}assert.equal(b.health,b.maxHealth);assert.deepEqual(post(g,b).maintenance,reserve);assert.deepEqual(g.resources,common);assert.equal(u.supportActive,false);
 b.health=b.maxHealth*.89;u.think=0;ticks(g,4);assert.ok(b.health>b.maxHealth*.89);assert.ok(post(g,b).maintenance.scrap<reserve.scrap);
});

test('QA02 — secteur 90° et réserve du commandant gouvernent aussi les cartouches locales',()=>{
 const g=fresh();money(g);const b=add(g,'watchtower',80,80);assert.ok(g.defense131.setArc(b.id,0).ok);assert.ok(g.fortificationPack.equip('ammo',b.id).ok);
 const ammo=g.resources.ammo=100;assert.equal(g.citadel.configure('reserve',ammo),true);const outside=enemy(g,b.x-90,b.y);
 g.updateBuildings(.04);assert.equal(g.projectiles.length,0);assert.equal(g.departure130.assess().localPosts,1);
 const boundary=enemy(g,b.x+100,b.y+100);assert.equal(g.nightwatch.target(b.x,b.y,b.def.range),boundary);g.updateBuildings(.04);
 assert.equal(g.resources.ammo,ammo);assert.equal(g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id).ammo,23);
 boundary.dead=true;g.rebuildBuckets();const beyond=enemy(g,b.x+100,b.y+100.01);assert.equal(g.nightwatch.target(b.x,b.y,b.def.range),null);
 // User changes the coverage on site; an already bought marking is reoriented freely.
 outside.dead=true;beyond.dead=true;g.rebuildBuckets();const stock={...g.resources};assert.ok(g.defense131.setArc(b.id,2).ok);assert.deepEqual(g.resources,stock);
 const west=enemy(g,b.x-100,b.y);g.phase='assault';g.wave=4;assert.equal(g.nightwatch.isBlackout(),true);assert.equal(g.nightwatch.target(b.x,b.y,b.def.range),null);
 g.phase='calm';assert.equal(g.nightwatch.target(b.x,b.y,b.def.range),west);b.fireCooldown=0;g.updateBuildings(.04);assert.equal(g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id).ammo,22);
});

test('QA02 — une porte automatique fermée rend le passage allié réellement impraticable',()=>{
 const g=fresh();money(g);const gate=add(g,'gate',68,68);prepare(g,gate,'configureGate');
 const T=require('../src/tactics.js'),before=g.world.navigationVersion;assert.equal(T.blocksFriendly(gate),false);
 g.phase='warning';for(let i=0;i<51;i++)g.defense131.step(.04);assert.equal(T.blocksFriendly(gate),true);assert.ok(g.world.navigationVersion>before);assert.ok(g.world.solidForFriendly(gate.x,gate.y));
 assert.equal(g.setGateMode('open',gate),true);for(let i=0;i<75;i++)g.defense131.step(.04);assert.equal(T.blocksFriendly(gate),false);
 g.phase='assault';for(let i=0;i<51;i++)g.defense131.step(.04);assert.equal(T.blocksFriendly(gate),true);
 g.phase='calm';for(let i=0;i<51;i++)g.defense131.step(.04);assert.equal(T.blocksFriendly(gate),false);assert.ok(!g.world.solidForFriendly(gate.x,gate.y));
});

test('QA02 — caisse inaccessible sans soin distant, reprise physique après ouverture d’une brèche',()=>{
 const g=fresh();money(g);const wall=add(g,'woodWall',70,70);prepare(g,wall,'startMaintenance');wall.health=wall.maxHealth*.5;
 const u=person(g,'engineer',g.core());
 const surround=[[69,70],[71,70],[70,69],[70,71]].map(([x,y])=>add(g,'woodWall',x,y));
 const hp=wall.health,budget=post(g,wall).maintenance;assert.equal(g.engineerTargetValid(u,wall),false);ticks(g,2);assert.equal(wall.health,hp);assert.deepEqual(post(g,wall).maintenance,budget);
 g.destroyBuilding(surround[0]);u.think=0;assert.equal(g.engineerTargetValid(u,wall),true);const origin={x:u.x,y:u.y};ticks(g,10);
 assert.ok(Math.hypot(u.x-origin.x,u.y-origin.y)>32);assert.ok(wall.health>hp);assert.ok(post(g,wall).maintenance.scrap<budget.scrap);
});
