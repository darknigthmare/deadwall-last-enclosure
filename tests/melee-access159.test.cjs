'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),T=require('../src/tactics.js');
const R=C.Arsenal134Rules,D=R.catalog,EPS=.12;

// Prepared physical encounters, not progression stories. Every campaign uses
// native fresh generation and finite Standard funds. Structures are paid and
// built through the existing player owner; HP, radii, range, cooldowns, AI and
// attack events are never assigned. Positions only arrange a reproducible fight.
function fresh({arsenal=false}={}){
 const {g}=boot131({generation:8,seed:'17117'});
 assert.ok(g.frontier.snapshot().generation>=8);
 if(arsenal){require('../src/succession133.js').install(g);require('../src/arsenal134.js').install(g);}
 for(const unit of g.units)standAt(g,unit,g.core());
 return g;
}
function paidBuilding(g,type,start={gx:46,gy:46}){
 const def=C.BUILDINGS[type],stock={...g.resources};let site;
 for(let gy=start.gy;gy<start.gy+12&&!site;gy++)for(let gx=start.gx;gx<start.gx+12&&!site;gx++)
  if(g.world.placement(def,gx,gy,0).valid)site={gx,gy};
 assert.ok(site,'Native placement finds ordinary ground');
 assert.equal(g.placeOne(type,site.gx,site.gy),true);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(def.cost[key]||0),'Actual construction payment '+key);
 const building=[...g.world.buildings.values()].find(b=>b.type===type&&b.gx===site.gx&&b.gy===site.gy);
 assert.ok(building);standAt(g,g.player,building);g.input.keys.add('KeyE');
 try{for(let i=0;i<400&&!building.completed;i++)g.updateInteraction(.1);}finally{g.input.keys.delete('KeyE');}
 assert.equal(building.completed,true,'Actual interaction finishes the funded foundation');
 assert.equal(building.health,def.health);assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);
 g.flow.rebuild(g.world,g.core());return building;
}
function nativeEnemy(g,kind){
 assert.equal(g.spawnZombie(kind),true);const z=g.zombies.at(-1),def=C.ENEMIES[kind];
 assert.equal(z.radius,def.radius);assert.equal(z.health,z.maxHealth);
 assert.equal(z.maxHealth,def.health*g.difficulty.enemyHealth*C.enemyHealthScale(g.wave));return z;
}
function placeActor(g,actor,point,hostile=false){
 Object.assign(actor,{x:point.x,y:point.y});
 assert.equal((hostile?g.hostilePositionClear:g.friendlyPositionClear).call(g,actor,actor.x,actor.y),true,'Native collision accepts the actual radius');
}
function corner(g,b,actor,z,reach){
 // The installed fieldcraft owner uses 0.90 of the unchanged allied radius.
 // Enemy collision uses its unchanged full circle. This is the same clearance
 // accepted by movement and by the actual deploy owner, not a radius override.
 const up=actor.radius*.9+EPS,right=z.radius+EPS,offset=Math.sqrt(up*right)+EPS;
 const p={x:b.right-offset,y:b.top-up},e={x:b.right+right,y:b.top+offset};
 placeActor(g,actor,p);placeActor(g,z,e,true);
 assert.ok(Math.hypot(e.x-p.x,e.y-p.y)<reach,'Occluded contact is really within the unchanged reach');
 assert.ok(Math.hypot(e.x-p.x,e.y-p.y)>actor.radius+z.radius,'Bodies are distinct');
 assert.equal(T.blocksEnclosure(b),false,'The obstruction is an ordinary opaque house');
 assert.equal(g.hostileLineClear(actor,z,true),true,'Historic enclosure-only ray misses the house');
 assert.equal(g.hostileLineClear(actor,z,false),false,'Full physical ray intersects the house corner');
 return {p,e};
}
function sameFace(g,b,actor,z,reach){
 const separation=actor.radius+z.radius+EPS;
 assert.ok(separation<reach);const p={x:b.right-35,y:b.top-Math.max(actor.radius,z.radius)-EPS};
 placeActor(g,actor,p);placeActor(g,z,{x:p.x+separation,y:p.y},true);
 assert.equal(g.hostileLineClear(actor,z,false),true);g.rebuildBuckets();
}
function retire(g,z){placeActor(g,z,{x:C.WORLD_SIZE-80,y:C.WORLD_SIZE-80},true);g.rebuildBuckets();}
function captures(g){const calls=[],original=g.recordActorAction159.bind(g);
 g.recordActorAction159=(actor,action,seconds,options)=>{calls.push({id:actor.id,action,seconds,options});return original(actor,action,seconds,options);};return calls;
}
function advancePlayer(g,seconds){for(let left=seconds;left>1e-8;left-=.05)g.updatePlayer(Math.min(.05,left));}
function paidItem(g,id){
 standAt(g,g.player,g.core());const quote=g.arsenal134.preview('craft',id),stock={...g.resources};
 assert.equal(quote.ok,true,quote.reason);assert.equal(g.arsenal134.begin('craft',id).ok,true);
 for(let left=quote.seconds+.11;left>0;left-=.1)g.arsenal134.step(Math.min(.1,left));
 const item=g.arsenal134.snapshot().locker.find(i=>i.id===id);assert.ok(item,'Timed paid recipe creates the real equipment');
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],stock[key]-(quote.cost[key]||0),'Actual crafting payment '+key);
 assert.equal(item.rounds,0);assert.equal(item.condition,100);
 assert.equal(g.arsenal134.transfer(item.uid,'carried').ok,true);return item;
}

for(const role of ['commander','worker','soldier','medic','engineer'])test('159 native enemy contact: ordinary house blocks attacks and false victim poses on living '+role,()=>{
 const g=fresh(),b=paidBuilding(g,'house');standAt(g,g.player,g.core());
 // Non-worker roles use the existing protected-survivor constructor/API. This
 // declared roster fixture grants no weapons, training, recruitment or funds.
 const actor=role==='commander'?g.player:role==='worker'?g.units.find(u=>u.kind==='worker'):g.createProtectedSurvivor(role,g.player.x,g.player.y);
 assert.ok(actor);assert.equal(actor.dead,false);assert.equal(actor.health,actor.maxHealth);
 if(role!=='commander')assert.equal(actor.maxHealth,C.SURVIVORS[role].health);
 const calls=captures(g),kinds=role==='worker'?['walker','runner','crawler','stalker','shielded']:['runner','crawler'];
 for(const kind of kinds){const z=nativeEnemy(g,kind);corner(g,b,actor,z,34);g.rebuildBuckets();
  g.visibility.invalidate();assert.equal(g.visibility.canSeeLocal(z),false,'Known observer LOS agrees with contact occlusion');
  const hp=actor.health,houseHP=b.health;g.updateZombies(.001);
  assert.equal(actor.health,hp,'No damage through the opaque house');assert.equal(b.health,houseHP,'This prepared flow faces away from the house');
  assert.equal(calls.some(c=>c.id===z.id&&c.action==='attack'),false);assert.equal(g.actorActionPresentation159(z),null);
  sameFace(g,b,actor,z,34);g.visibility.invalidate();assert.equal(g.visibility.canSeeLocal(z),true);
  g.updateZombies(.001);assert.equal(actor.health,hp-C.ENEMIES[kind].damage*g.difficulty.enemyDamage,'Accessible target receives normal catalog damage');
  const hit=calls.find(c=>c.id===z.id&&c.action==='attack');assert.ok(hit);
  assert.equal(hit.seconds,1/C.ENEMIES[kind].attackRate);assert.equal(g.actorActionPresentation159(z).action,'attack');
  assert.ok(Math.abs(hit.options.facing-Math.atan2(actor.y-z.y,actor.x-z.x))<1e-9);
  retire(g,z);
 }
 assert.ok(actor.health>0,'Fixture remains a living target with its original health cap');
});

test('159 native commander shove: opaque house rejects the hit and a visible contact keeps damage, cooldown and displacement',()=>{
 const g=fresh(),b=paidBuilding(g,'house'),z=nativeEnemy(g,'runner');corner(g,b,g.player,z,55);g.rebuildBuckets();
 g.player.facing=Math.atan2(z.y-g.player.y,z.x-g.player.x);const hp=z.health,stock={...g.resources};
 g.melee();assert.equal(z.health,hp);assert.equal(g.player.meleeCooldown,.65);assert.equal(z.stagger,0);
 advancePlayer(g,.66);sameFace(g,b,g.player,z,55);g.player.facing=Math.atan2(z.y-g.player.y,z.x-g.player.x);
 const before={x:z.x,y:z.y};g.melee();assert.equal(z.health,hp-36);assert.equal(z.stagger,.35);assert.equal(g.player.meleeCooldown,.65);
 assert.ok(Math.hypot(z.x-before.x,z.y-before.y)>0);assert.equal(g.hostilePositionClear(z,z.x,z.y),true);assert.deepEqual(g.resources,stock);
});

test('159 paid held knife: true in-range house corner is blocked while stamina, wear and ordinary useful damage remain finite',()=>{
 const g=fresh({arsenal:true}),b=paidBuilding(g,'house'),item=paidItem(g,'knife');assert.equal(g.arsenal134.equip(item.uid).ok,true);
 const z=nativeEnemy(g,'crawler'),def=D.knife;corner(g,b,g.player,z,def.range*C.TILE);g.rebuildBuckets();
 g.player.facing=Math.atan2(z.y-g.player.y,z.x-g.player.x);const hp=z.health,stamina=g.player.stamina;
 g.melee();assert.equal(z.health,hp);assert.equal(g.player.stamina,stamina-def.stamina);
 assert.equal(g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid).condition,100-def.wear);assert.equal(g.player.meleeCooldown,1/def.fireRate);
 advancePlayer(g,1/def.fireRate+.01);sameFace(g,b,g.player,z,def.range*C.TILE);g.player.facing=Math.atan2(z.y-g.player.y,z.x-g.player.x);
 const available=g.player.stamina;g.melee();assert.equal(z.health,hp-def.damage);assert.equal(g.player.stamina,available-def.stamina);
 assert.equal(g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid).condition,100-2*def.wear);assert.equal(z.stagger,R.meleeStagger);
 assert.equal(g.arsenal134.weaponSpec().range,def.range*C.TILE);
});

test('159 native soldier melee: paid ammunition reserve blocks shooting, house blocks true-range contact, clear face permits the catalog strike',()=>{
 const g=fresh(),b=paidBuilding(g,'house');standAt(g,g.player,g.core());
 const soldier=g.createProtectedSurvivor('soldier',g.player.x,g.player.y),z=nativeEnemy(g,'crawler');assert.ok(soldier);
 assert.equal(g.citadel.configure('reserve',g.resources.ammo),true,'Use the actual commandant reserve; never zero or restore ammo');
 assert.equal(g.citadel.canFire(1),false);corner(g,b,soldier,z,C.SQUAD_RULES.meleeRange);g.rebuildBuckets();
 const hp=z.health,ammo=g.resources.ammo,calls=captures(g);g.updateUnits(.001);
 assert.equal(z.health,hp);assert.equal(soldier.fireCooldown,0);assert.equal(calls.some(c=>c.id===soldier.id&&c.action==='melee'),false);
 sameFace(g,b,soldier,z,C.SQUAD_RULES.meleeRange);g.updateUnits(.001);
 assert.equal(z.health,hp-C.SQUAD_RULES.meleeDamage);assert.equal(soldier.fireCooldown,C.SQUAD_RULES.meleeCooldown);
 assert.ok(calls.some(c=>c.id===soldier.id&&c.action==='melee'));assert.equal(g.resources.ammo,ammo);
});

test('159 paid spike frame: opaque house blocks the real acquired contact and animation; accessible attack and retaliatory damage retain ordinary costs',()=>{
 const g=fresh({arsenal:true}),b=paidBuilding(g,'house'),item=paidItem(g,'spikeFrame'),z=nativeEnemy(g,'armored'),def=D.spikeFrame;
 const probe={radius:R.postRadius},pose=corner(g,b,probe,z,def.range*C.TILE).p;
 placeActor(g,g.player,{x:pose.x,y:pose.y-R.deployDistance});g.player.facing=Math.PI/2;
 assert.equal(g.arsenal134.deploy(item.uid).ok,true);let p=g.arsenal134.snapshot().posts.find(p=>p.item.uid===item.uid);assert.ok(p);
 assert.ok(Math.hypot(p.x-pose.x,p.y-pose.y)<1e-8);assert.equal(g.hostileLineClear(p,z,true),true);assert.equal(g.hostileLineClear(p,z,false),false);
 g.rebuildBuckets();const hp=z.health,stock={...g.resources};g.arsenal134.step(.1);p=g.arsenal134.snapshot().posts.find(p=>p.item.uid===item.uid);
 assert.equal(z.health,hp);assert.equal(p.health,def.health);assert.equal(p.item.condition,100);assert.equal(p.cooldown,0);assert.equal(g.arsenal134.postPresentation(item.uid),null);
 placeActor(g,z,{x:p.x+R.postRadius+z.radius+EPS,y:p.y},true);assert.equal(g.hostileLineClear(p,z,false),true);g.rebuildBuckets();
 g.arsenal134.step(.1);p=g.arsenal134.snapshot().posts.find(p=>p.item.uid===item.uid);
 assert.equal(z.health,hp-def.damage);assert.equal(p.item.condition,100-def.wear);assert.equal(p.item.rounds,0);assert.equal(p.cooldown,1/def.fireRate);
 assert.equal(p.health,def.health-(z.def?.damage||8)*.1*.5,'Existing post retaliation formula stays unchanged');
 assert.equal(g.arsenal134.postPresentation(item.uid).kind,'contact');assert.deepEqual(g.resources,stock);
});

test('159 physical rays: ranged enclosure-only policy remains explicit and a genuinely opened paid gate restores the full line',()=>{
 const g=fresh(),b=paidBuilding(g,'house'),z=nativeEnemy(g,'runner');corner(g,b,g.player,z,34);
 assert.equal(g.hostileLineClear(g.player,z),true,'Default historic ranged policy remains enclosure-only');
 assert.equal(g.hostileLineClear(g.player,z,false),false,'Only melee opts into the opaque building policy');
 const rounds=g.player.magazine.pistol,stock=g.resources.ammo,shots=g.stats.shots;
 g.player.facing=Math.atan2(z.y-g.player.y,z.x-g.player.x);g.shootPlayer();
 assert.equal(g.player.magazine.pistol,rounds-1);assert.equal(g.stats.shots,shots+1);assert.equal(g.projectiles.length,1);
 assert.equal(g.resources.ammo,stock,'Native ranged shot consumes its loaded round, not a free depot round');
 const gate=paidBuilding(g,'gate',{gx:53,gy:54}),from={x:gate.x,y:gate.top-25},to={x:gate.x,y:gate.bottom+25};
 assert.equal(g.hostileLineClear(from,to,true),false);assert.equal(g.hostileLineClear(from,to,false),false);
 assert.equal(g.setGateMode('open',gate),true);assert.equal(T.openGate(gate),true);
 assert.equal(g.hostileLineClear(from,to,true),true);assert.equal(g.hostileLineClear(from,to,false),true);
 assert.equal(g.setGateMode('closed',gate),true);assert.equal(g.hostileLineClear(from,to,false),false);
});
