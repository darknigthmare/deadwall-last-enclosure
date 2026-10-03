'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
function fresh(){const {game:g}=boot127();g.startNew('standard','17117');g.units=[];g.phaseTime=9999;g.resources.wood=g.resources.scrap=g.resources.ammo=300;g.world.nodes.forEach(n=>n.depleted=true);return g;}
function tower(g){const b=new(g.core().constructor)(g.nextId++,'watchtower',72,72,0,1);g.world.add(b);g.refreshMetrics(true);standAt(g,g.player,b);const paid={...g.resources};assert.ok(g.fortificationPack.equip('ammo',b.id).ok);for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],paid[k]-(C.FortificationPackRules.ammoCost[k]||0));g.resources.ammo=0;g.dayClock=.5;g.zombies.push({id:g.nextId++,kind:'walker',x:b.x+120,y:b.y,health:60,maxHealth:60,dead:false,radius:10,vx:0,vy:0,think:0,attackCooldown:0,speedFactor:1,facing:0});g.rebuildBuckets();return b;}
const ammo=(g,b)=>g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id)?.ammo||0;
test('1.28 persistence QA: local caisson never overrides manual turret control',()=>{
 const g=fresh(),b=tower(g);assert.ok(g.fieldcraft.control(b));
 g.updateBuildings(.04);assert.equal(g.fieldcraft.context().mounted,b.id);assert.equal(g.projectiles.length,0);assert.equal(ammo(g,b),24);
 g.input.mouseDown=true;g.input.mouseWorldX=b.x+120;g.input.mouseWorldY=b.y;g.updatePlayer(.04);g.updateBuildings(.04);assert.equal(g.projectiles.length,0);assert.equal(ammo(g,b),24);
 g.input.mouseDown=false;assert.ok(g.fieldcraft.control(b));g.updateBuildings(.04);assert.equal(g.projectiles.length,1);assert.equal(ammo(g,b),23);
});
test('1.28 persistence QA: paid ammunition can be recovered for explicit manual fire without duplication',()=>{
 const g=fresh(),b=tower(g);assert.ok(g.fieldcraft.control(b));assert.equal(g.fortificationPack.recoverAmmo(b.id).ok,false);assert.equal(ammo(g,b),24);assert.equal(g.resources.ammo,0);
 assert.ok(g.fieldcraft.control());assert.equal(g.fieldcraft.context().mounted,null);assert.ok(g.fortificationPack.recoverAmmo(b.id).ok);assert.equal(ammo(g,b),0);assert.equal(g.resources.ammo,24);assert.equal(g.fortificationPack.recoverAmmo(b.id).ok,false);assert.equal(g.resources.ammo,24);
 assert.ok(g.fieldcraft.control(b));assert.equal(g.fieldcraft.context().mounted,b.id);
 g.input.mouseDown=true;g.input.mouseWorldX=b.x+120;g.input.mouseWorldY=b.y;g.updatePlayer(.04);g.updateBuildings(.04);assert.equal(g.projectiles.length,1);assert.equal(g.resources.ammo,23);
 g.releaseInputs();const stocks={...g.resources},fittings=g.fortificationPack.snapshot();g.restoreSave(g.serialize());const restored=g.world.buildings.get(b.id);assert.equal(ammo(g,restored),0);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.fortificationPack.snapshot(),fittings);assert.equal(g.fieldcraft.context().mounted,null);assert.equal(g.fortificationPack.recoverAmmo(restored.id).ok,false);assert.deepEqual(g.resources,stocks);
});
test('1.28 persistence QA: revive in same update interrupts manual maintenance before any repair',()=>{
 const g=fresh(),core=g.core();standAt(g,g.player,core);assert.ok(g.fortificationPack.equip('repair',core.id).ok);core.health-=100;assert.ok(g.fortificationPack.startRepair(core.id).ok);const health=core.health;
 g.player.dead=true;g.player.health=0;g.player.downTimer=0;g.update(.04);assert.equal(g.player.dead,false);assert.equal(g.fortificationPack.busy(),false);assert.equal(core.health,health);assert.equal(g.fortificationPack.snapshot().fittings[0].repair,200);
});
test('1.28 persistence QA: local defence pauses and resumes while remaining autonomous from commander',()=>{
 const g=fresh(),b=tower(g);g.paused=true;g.updateBuildings(.04);assert.equal(ammo(g,b),24);g.paused=false;g.activeOverlay={};g.updateBuildings(.04);assert.equal(ammo(g,b),24);g.activeOverlay=null;g.player.dead=true;g.player.health=0;g.updateBuildings(.04);assert.equal(ammo(g,b),23);
 const saved=g.serialize();g.restoreSave(saved);g.rebuildBuckets();const restored=g.world.buildings.get(b.id);g.dayClock=.5;restored.fireCooldown=0;g.updateBuildings(.04);assert.equal(ammo(g,restored),22);assert.equal(g.resources.ammo,0);
});
test('1.28 persistence QA: companion positions cannot name an upper floor at remote coordinates',()=>{
 const g=fresh(),p=g.frontier.world().pois.find(p=>p.levels.includes(1)),raw=JSON.parse(JSON.stringify(g.serialize())),world=g.world,modules=g.expansions.snapshot(),resources={...g.resources};
 raw.expansions127.modules.companions.positions.samir={x:4096,y:4096,z:1,inside:p.id,a:0};raw.resources.wood=1;
 assert.throws(()=>g.restoreSave(raw),/Équipe de terrain/);assert.equal(g.world,world);assert.deepEqual(g.resources,resources);assert.deepEqual(g.expansions.snapshot(),modules);
});
test('1.28 persistence QA: upper-floor rally anchors obey the rotated building footprint',()=>{
 const g=fresh(),p=g.frontier.world().pois.find(p=>p.levels.includes(1)),raw=JSON.parse(JSON.stringify(g.serialize())),world=g.world;
 Object.assign(raw.expansions127.modules.companions,{order:'rally',anchor:{...G.global(p,p.w+10,p.h/2),z:1,inside:p.id,a:0}});
 assert.throws(()=>g.restoreSave(raw),/Équipe de terrain/);assert.equal(g.world,world);
});
test('1.28 persistence QA: valid upper-floor points roundtrip and retain paid support reserves',()=>{
 const g=fresh(),p=g.frontier.world().pois.find(p=>p.levels.includes(1)),raw=JSON.parse(JSON.stringify(g.serialize())),stair=g.frontier.world().plan(p,1).stairs[0],point={...G.global(p,stair.x+stair.w/2,stair.y+stair.h/2),z:1,inside:p.id,a:0};
 const state=raw.expansions127.modules.companions;state.positions.samir=point;state.order='rally';state.anchor=point;state.reserves.samir={...C.CompanionPackRules.reserve};
 g.restoreSave(raw);assert.deepEqual(g.companionsPack.snapshot(),state);const again=g.serialize();g.restoreSave(again);assert.deepEqual(g.companionsPack.snapshot(),state);assert.deepEqual(g.resources,raw.resources);
});
