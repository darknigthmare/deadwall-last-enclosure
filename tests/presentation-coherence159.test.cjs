'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/city-content150.cjs');

test('159 activity follows actual production, inputs and output space without changing saved state',()=>{
 const {g}=H.fresh();g.population=0;
 const b=H.prepare(g,'ammoFactory');H.prepare(g,'generator');g.refreshMetrics(true);
 g.resources.ammo=0;g.resources.scrap=100;g.resources.fuel=100;
 const before=g.resources.ammo;g.economyTick(.25);assert.ok(g.resources.ammo>before);
 assert.deepEqual(g.productionPresentation159(b),{active:true,smoke:true});
 const saved=H.stable(g),rng=g.random.state;
 for(let i=0;i<10;i++)assert.equal(g.productionPresentation159(b).active,true);
 assert.deepEqual(H.stable(g),saved);assert.equal(g.random.state,rng);
 g.resources.scrap=0;g.economyTick(.25);assert.deepEqual(g.productionPresentation159(b),{active:false,smoke:false});
 g.resources.scrap=100;g.resources.ammo=g.storage;g.economyTick(.25);assert.equal(g.productionPresentation159(b).active,false);
 g.resources.ammo=0;g.economyTick(.25);assert.equal(g.productionPresentation159(b).active,true);
 g.elapsed+=.26;assert.equal(g.productionPresentation159(b).active,false);
 g.economyTick(.25);assert.equal(g.productionPresentation159(b).active,true);
 g.restoreSave(g.serialize());assert.equal(g.productionPresentation159(g.world.buildings.get(b.id)).active,false);
});

test('159 vegetation produces without smoke and a genuinely suspended site has no activity',()=>{
 const {g}=H.fresh();g.population=0;const b=H.prepare(g,'farm');g.resources.food=0;
 g.economyTick(.25);assert.deepEqual(g.productionPresentation159(b),{active:true,smoke:false});
 b.dayOffline=true;g.economyTick(.25);assert.deepEqual(g.productionPresentation159(b),{active:false,smoke:false});
 b.dayOffline=false;b.territoryOffline=true;g.economyTick(.25);assert.equal(g.productionPresentation159(b).active,false);
});

test('159 action identities stay bounded, pure, paused and separate from inherited cooldowns',()=>{
 const {g}=H.fresh(),u=g.units[0],saved=H.stable(g),rng=g.random.state;
 assert.equal(g.actorActionPresentation159(u),null);
 assert.equal(g.recordActorAction159(u,'build',1.2,{continuous:true}),true);
 const pose=g.actorActionPresentation159(u);assert.equal(pose.action,'build');assert.equal(pose.progress,0);
 for(let i=0;i<12;i++)assert.deepEqual(g.actorActionPresentation159(u),pose);
 assert.deepEqual(H.stable(g),saved);assert.equal(g.random.state,rng);
 g.elapsed+=.12;g.recordActorAction159(u,'build',1.2,{continuous:true});assert.ok(g.actorActionPresentation159(u).progress>0);
 g.elapsed+=.26;assert.equal(g.actorActionPresentation159(u),null);
 const local={id:4},regional={id:4,visualActionOwner159:'region:4'};
 g.recordActorAction159(local,'shoot',.24);g.recordActorAction159(regional,'attack',1);
 assert.equal(g.actorActionPresentation159(local).action,'shoot');assert.equal(g.actorActionPresentation159(regional).action,'attack');
 for(let i=0;i<2200;i++)g.recordActorAction159({id:'bounded:'+i},'attack',1);
 assert.equal(g.actorActivity159.events.size,2048);
 g.restoreSave(g.serialize());assert.equal(g.actorActionPresentation159(g.units[0]),null);
});

test('159 spikes never hurt an enemy when the real contact validator rejects an obstructed approach',()=>{
 const {g,C}=H.fresh();g.units=[];g.player.dead=true;
 g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});const b=H.prepare(g,'spikes');
 assert.equal(g.world.placement(C.BUILDINGS.woodWall,b.gx,b.gy-1,0).valid,true);
 const wall=new(b.constructor)(g.nextId++,'woodWall',b.gx,b.gy-1,0,1);g.world.add(wall);
 assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1);
 Object.assign(z,{x:b.left-15,y:b.top-15,lastX:b.left-15,lastY:b.top-15,attackCooldown:1});
 assert.equal(g.hostilePositionClear(z,z.x,z.y),true,'Enemy stands outside both real supports');
 const corner={x:b.left,y:b.top};assert.ok(Math.hypot(z.x-corner.x,z.y-corner.y)<z.radius+C.ENEMY_RULES.structureReach);
 assert.equal(g.hostileLineClear(z,corner,false,b),false,'Adjacent wall corner blocks the actual approach');
 g.flow.direction=()=>({x:Math.SQRT1_2,y:Math.SQRT1_2});g.daylight=()=>1;g.random.chance=()=>false;g.rebuildBuckets();
 const hp=z.health,buildingHp=b.health;g.updateZombies(.04);assert.equal(z.health,hp);assert.equal(b.health,buildingHp);assert.equal(g.actorActionPresentation159(z),null);
 // A second face is physically clear without bypassing the native validator.
 Object.assign(z,{x:b.left-20,y:b.y,lastX:b.left-20,lastY:b.y,attackCooldown:1});
 g.flow.direction=()=>({x:1,y:0});const target={x:b.left,y:b.y};assert.ok(g.hostileLineClear(z,target,false,b));
 g.updateZombies(.04);assert.ok(Math.abs(hp-z.health-C.BUILDINGS.spikes.trapDamage*.04)<1e-7);
 assert.ok(b.health<buildingHp);assert.equal(g.actorActionPresentation159(z),null,'Continuous spike contact is not a separate zombie attack');
});

test('159 worker action follows physical construction progress and stays absent on travel or blocked access',()=>{
 const {g,C}=H.fresh(),u=g.units.find(v=>v.kind==='worker');assert.ok(u);
 g.units=[u];g.zombies=[];g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});
 const cell=H.freeCell(g,'house');assert.equal(g.placeOne('house',cell.gx,cell.gy),true);const b=g.world.atCell(cell.gx,cell.gy);
 Object.assign(u,{state:'build',targetBuilding:b.id,think:100,carry:0});g.workerOrder='build';g.rebuildBuckets();
 assert.equal(g.workerCanWorkAt(u,b,62),false);const initial=b.progress;g.updateUnits(.1);
 assert.equal(b.progress,initial);assert.equal(g.actorActionPresentation159(u),null,'Travelling to a job does not perform work');
 H.standAt(g,u,b);g.rebuildBuckets();assert.equal(g.workerCanWorkAt(u,b,62),true);g.updateUnits(.1);
 assert.ok(b.progress>initial);assert.equal(g.actorActionPresentation159(u).action,'build');
 g.elapsed+=.26;assert.equal(g.actorActionPresentation159(u),null);
 const obstruction=new(b.constructor)(g.nextId++,'woodWall',b.gx-1,b.gy,0,1);assert.equal(g.world.placement(C.BUILDINGS.woodWall,obstruction.gx,obstruction.gy,0).valid,true);g.world.add(obstruction);
 // Near enough numerically, but behind the completed wall; no collision bypass.
 u.x=obstruction.left-u.radius-2;u.y=obstruction.y;u.navigation=null;u.think=100;
 assert.equal(g.friendlyPositionClear(u,u.x,u.y),true);assert.equal(g.workerCanWorkAt(u,b,62),false);
 const progress=b.progress;g.updateUnits(.1);assert.equal(b.progress,progress);assert.equal(g.actorActionPresentation159(u),null);
});

test('159 soldier action distinguishes a paid projectile from a real melee hit and from cooldown waiting',()=>{
 const {g,C}=H.fresh();H.prepare(g,'barracks');g.resources.food=80;g.resources.scrap=80;g.resources.ammo=C.SURVIVORS.soldier.cost.ammo+3;
 assert.equal(g.recruit('soldier'),true);const u=g.units.at(-1);g.units=[u];g.zombies=[];g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});
 assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1),core=g.core();
 const point=g.fieldcraft.service(u,core);assert.ok(point);Object.assign(u,{x:point.x,y:point.y,fireCooldown:0});
 Object.assign(z,{x:u.x+100,y:u.y,health:C.ENEMIES.walker.health});assert.equal(g.hostileLineClear(u,z),true);g.daylight=()=>1;g.rebuildBuckets();
 const ammo=g.resources.ammo,projectiles=g.projectiles.length;g.updateUnits(.04);
 assert.equal(g.resources.ammo,ammo-1);assert.equal(g.projectiles.length,projectiles+1);assert.equal(g.actorActionPresentation159(u).action,'shoot');
 g.elapsed+=C.SQUAD_RULES.fireCooldown+.01;u.fireCooldown=1;const spent=g.resources.ammo,shotCount=g.projectiles.length;g.updateUnits(.04);
 assert.equal(g.resources.ammo,spent);assert.equal(g.projectiles.length,shotCount);assert.equal(g.actorActionPresentation159(u),null,'Cooldown waiting creates no new shooting event');
 g.resources.ammo=0;u.fireCooldown=0;Object.assign(z,{x:u.x+20,y:u.y});g.rebuildBuckets();const hp=z.health;g.updateUnits(.04);
 assert.equal(z.health,hp-C.SQUAD_RULES.meleeDamage);assert.equal(g.resources.ammo,0);assert.equal(g.projectiles.length,shotCount);assert.equal(g.actorActionPresentation159(u).action,'melee');
});

test('159 zombie attack starts only after actual survivor or structure damage and respects invulnerability and walls',()=>{
 const {g,C}=H.fresh();g.units=[];g.zombies=[];g.world.nodes.forEach(n=>{n.amount=0;n.depleted=true;});assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1),core=g.core();
 H.standAt(g,g.player,core);Object.assign(z,{x:g.player.x+20,y:g.player.y,attackCooldown:0});assert.equal(g.hostileLineClear(z,g.player),true);g.daylight=()=>1;g.rebuildBuckets();
 g.player.invulnerable=1;const health=g.player.health;g.updateZombies(.04);assert.equal(g.player.health,health);assert.equal(g.actorActionPresentation159(z),null);
 g.player.invulnerable=0;z.attackCooldown=0;g.updateZombies(.04);assert.ok(g.player.health<health);assert.equal(g.actorActionPresentation159(z).action,'attack');
 g.elapsed+=1/C.ENEMIES.walker.attackRate+.01;g.player.dead=true;const b=H.prepare(g,'woodWall');Object.assign(z,{x:b.left-20,y:b.y,attackCooldown:0});
 assert.equal(g.hostilePositionClear(z,z.x,z.y),true);assert.ok(g.hostileLineClear(z,{x:b.left,y:b.y},false,b));g.flow.direction=()=>({x:1,y:0});g.rebuildBuckets();const buildingHp=b.health;g.updateZombies(.04);
 assert.ok(b.health<buildingHp);assert.equal(g.actorActionPresentation159(z).action,'attack');
 g.elapsed+=1/C.ENEMIES.walker.attackRate+.01;const above=new(b.constructor)(g.nextId++,'woodWall',b.gx,b.gy-1,0,1);assert.equal(g.world.placement(C.BUILDINGS.woodWall,above.gx,above.gy,0).valid,true);g.world.add(above);
 Object.assign(z,{x:b.left-15,y:b.top-15,attackCooldown:0});g.flow.direction=()=>({x:Math.SQRT1_2,y:Math.SQRT1_2});assert.equal(g.hostileLineClear(z,{x:b.left,y:b.top},false,b),false);g.rebuildBuckets();const blockedHp=b.health;g.updateZombies(.04);
 assert.equal(b.health,blockedHp);assert.equal(g.actorActionPresentation159(z),null,'Rejected physical damage creates no attack cycle');
});
