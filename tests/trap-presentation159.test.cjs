'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs'),{legacyAge}=require('./helpers/legacy-city.cjs');
const C=require('../src/core.js'),Defense=require('../src/defense-pack131.js'),Loadout=require('../src/loadout129.js'),R=C.FortificationPackRules;
const copy=v=>JSON.parse(JSON.stringify(v));
// Supports, historical knowledge and cleared prop fixtures are explicit. Every
// fitting is paid through its native API, and pulses observe real engine events.
function fresh(){const{game:g}=boot127();Defense.install(g);Loadout.install(g);g.startNew('standard','17117');g.units=[];g.world.nodes.forEach(n=>{n.depleted=true;n.amount=0;});legacyAge(g,1850);for(const key of C.RESOURCE_KEYS)g.resources[key]=300;return g;}
function add(g,type='spikes',gx=72,gy=72,progress=1){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,0,progress);g.world.add(b);g.refreshMetrics(true);g.selectBuilding(b);standAt(g,g.player,b);return b;}
function work(g,seconds){for(let left=seconds;left>1e-8;left-=R.maxStep)g.fortificationPack.step(Math.min(left,R.maxStep));}
function battle(g,seconds){for(let left=seconds;left>1e-8;left-=.04){g.updateZombies(Math.min(left,.04));g.rebuildBuckets();}}
function install(g,kind){const recipe=R.mechanisms[kind];standAt(g,g.player,g.core());for(const[key,n]of Object.entries(recipe.cost)){const r=g.loadout.transfer('depot','sac',key,n);assert.equal(r.ok,true,r.reason);assert.equal(r.amount,n);}if(recipe.requires)add(g,recipe.requires,82,72);const b=add(g);assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,true);work(g,recipe.seconds);standAt(g,g.player,g.core());return b;}
function contactSpot(g,z,b){return[[b.right+z.radius+.5,b.y],[b.left-z.radius-.5,b.y],[b.x,b.bottom+z.radius+.5],[b.x,b.top-z.radius-.5]].find(([x,y])=>{const d=g.flow.direction(x,y,z.bias,g.elapsed),point={x:Math.max(b.left,Math.min(b.right,x)),y:Math.max(b.top,Math.min(b.bottom,y))};return g.world.at(x+d.x*(z.radius+13),y+d.y*(z.radius+13))===b&&g.hostilePositionClear(z,x,y)&&g.hostileLineClear({x,y},point,false,b);});}
function enemy(g,b,atContact=false){assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1),point=atContact?contactSpot(g,z,b):[b.right+z.radius+R.mechanismContactReach-1,b.y];assert.ok(point,'Le contact doit aborder une face physiquement libre');Object.assign(z,{x:point[0],y:point[1]});g.rebuildBuckets();return z;}
function stable(g){const raw=copy(g.serialize());delete raw.timestamp;return raw;}
const visual=(g,b)=>g.fortificationPack.presentation(b)?.mechanism;
function moveAway(g,z,b){z.x=b.x+600;z.y=b.y;g.rebuildBuckets();}

for(const kind of Object.keys(R.mechanisms))test('159 '+kind+' : phases suivent un impact payé et les vraies horloges',()=>{
 const g=fresh(),b=install(g,kind),recipe=R.mechanisms[kind],stocks={...g.resources},carry={...g.player.carry};
 assert.equal(visual(g,b).phase,'armed');assert.equal(visual(g,b).motion,0);assert.equal(visual(g,b).charges,recipe.charges);
 battle(g,.12);assert.equal(visual(g,b).phase,'armed','Aucun mouvement sans contact');
 const z=enemy(g,b),hp=z.health;g.updateZombies(.04);assert.equal(hp-z.health,recipe.damage);assert.equal(visual(g,b).phase,'trigger');assert.equal(visual(g,b).charges,recipe.charges-1);
 moveAway(g,z,b);battle(g,recipe.cooldown*.3);assert.equal(visual(g,b).phase,'action');assert.equal(visual(g,b).motion,1);
 battle(g,recipe.cooldown*.4);assert.equal(visual(g,b).phase,recipe.holdSeconds?'held':'return');
 if(recipe.holdSeconds){assert.equal(visual(g,b).motion,1);battle(g,recipe.holdSeconds-.04-recipe.cooldown*.7-.1);assert.equal(visual(g,b).phase,'return');assert.ok(visual(g,b).motion>0&&visual(g,b).motion<1);}
 battle(g,Math.max(recipe.cooldown,recipe.holdSeconds)+.1);assert.equal(visual(g,b).phase,'armed');assert.equal(visual(g,b).motion,0);assert.equal(visual(g,b).charges,recipe.charges-1);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.player.carry,carry);
});

test('159 dernière charge : le mouvement finit avant épuisé, sans réarmement gratuit',()=>{
 const g=fresh(),b=install(g,'blades'),recipe=R.mechanisms.blades;
 for(let i=0;i<recipe.charges;i++){const z=enemy(g,b);g.updateZombies(.04);moveAway(g,z,b);if(i<recipe.charges-1)battle(g,recipe.cooldown+.04);}
 assert.equal(visual(g,b).charges,0);assert.equal(visual(g,b).phase,'trigger');battle(g,recipe.cooldown*.7);assert.equal(visual(g,b).phase,'return');battle(g,recipe.cooldown);assert.equal(visual(g,b).phase,'exhausted');assert.equal(visual(g,b).motion,0);
 const z=enemy(g,b),hp=z.health;g.updateZombies(.04);assert.equal(z.health,hp);assert.equal(visual(g,b).phase,'exhausted');
});

test('159 pause et reprise : phase, cooldown, entrave et réserves exacts sans rejouer le déclenchement',()=>{
 const g=fresh(),b=install(g,'clamp'),z=enemy(g,b);g.updateZombies(.04);moveAway(g,z,b);battle(g,.7);
 const before=copy(g.fortificationPack.presentation(b)),raw=copy(g.serialize()),resources={...g.resources};
 for(const overlay of [null,g.ui.commandModal]){g.paused=true;g.activeOverlay=overlay;for(let i=0;i<8;i++)g.loop(g.lastFrame+40);assert.deepEqual(g.fortificationPack.presentation(b),before);}
 g.paused=false;g.activeOverlay=null;g.restoreSave(raw);const restored=g.world.buildings.get(b.id);assert.deepEqual(g.fortificationPack.presentation(restored),before);assert.deepEqual(g.resources,resources);assert.equal(g.fortificationPack.presentation(b),null,'Un ancien objet support ne partage pas le nouveau propriétaire');
 battle(g,.04);assert.notDeepEqual(g.fortificationPack.presentation(restored),before);assert.equal(visual(g,restored).charges,R.mechanisms.clamp.charges-1);
});

test('159 lecteurs et peintres : aucun RNG, mutation, réconciliation ou état exposé en écriture',()=>{
 const g=fresh(),b=install(g,'ankle'),z=enemy(g,b);g.updateZombies(.04);const before=stable(g),view=copy(g.fortificationPack.presentation(b)),rng=g.random.state;
 const old159=globalThis.DeadwallTrapArt159,old158=globalThis.DeadwallWorldVariants158,calls=[];
 globalThis.DeadwallWorldVariants158={drawMechanism(){calls.push('fallback158');return true;}};
 globalThis.DeadwallTrapArt159={drawSpikes(ctx,art,owner,options){calls.push(['spikes',owner.id,options.reducedMotion]);return true;},drawMechanism(ctx,art,owner,m,options){calls.push(['mechanism',owner.id,m.kind,copy(options.presentation)]);return true;}};
 try{
  for(let i=0;i<12;i++){const p=g.fortificationPack.presentation(b.id);p.mechanism.charges=999;p.mechanism.phase='fake';g.drawBuilding(g.ctx,b);}
  assert.deepEqual(g.fortificationPack.presentation(b),view);assert.deepEqual(stable(g),before);assert.equal(g.random.state,rng);assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='mechanism'&&c[2]==='ankle'));assert.equal(calls.includes('fallback158'),false);
  globalThis.DeadwallTrapArt159.drawMechanism=()=>false;g.drawBuilding(g.ctx,b);assert.equal(calls.includes('fallback158'),true);assert.deepEqual(stable(g),before);
 }finally{globalThis.DeadwallTrapArt159=old159;globalThis.DeadwallWorldVariants158=old158;}
});

test('159 filet : absorption réelle seulement, réserve finie, dernier geste puis disparition',()=>{
 const g=fresh(),b=add(g,'woodWall');assert.equal(g.fortificationPack.equip('net',b.id).ok,true);assert.equal(g.fortificationPack.presentation(b).net.phase,'armed');
 const distant=enemy(g,b);distant.x=b.x+200;g.rebuildBuckets();g.killZombie(distant,false);assert.equal(g.fortificationPack.presentation(b).net.phase,'armed');assert.equal(g.fortificationPack.presentation(b).net.remaining,R.netCapacity);
 let last;for(let i=0;i<R.netCapacity;i++){const z=enemy(g,b);z.x=b.right+z.radius+1;last=z;g.rebuildBuckets();g.killZombie(z,false);}
 assert.equal(b.corpseLoad,0);assert.equal(g.fortificationPack.presentation(b).net.remaining,0);assert.equal(g.fortificationPack.presentation(b).net.phase,'action');const before=copy(g.fortificationPack.presentation(b));g.killZombie(last,false);assert.deepEqual(g.fortificationPack.presentation(b),before,'Un cadavre ne déclenche pas une nouvelle prise');
 assert.equal(g.fortificationPack.snapshot().fittings.some(f=>f.id===b.id),false,'Le budget historique épuisé est supprimé');battle(g,.4);assert.equal(g.fortificationPack.presentation(b).net.phase,'return');battle(g,.3);assert.equal(g.fortificationPack.presentation(b).net,null);
 const raw=copy(g.serialize());g.restoreSave(raw);assert.equal(g.fortificationPack.presentation(g.world.buildings.get(b.id)).net,null);
});

test('159 filet : modale et pause figent le geste transitoire, chargement garde le stock sans rejouer',()=>{
 const g=fresh(),b=add(g,'woodWall');g.fortificationPack.equip('net',b.id);const z=enemy(g,b);z.x=b.right+z.radius+1;g.killZombie(z,false);battle(g,.1);const p=copy(g.fortificationPack.presentation(b)),raw=copy(g.serialize());
 g.paused=true;for(let i=0;i<6;i++)g.loop(g.lastFrame+40);assert.deepEqual(g.fortificationPack.presentation(b),p);g.paused=false;g.activeOverlay=g.ui.commandModal;g.updateZombies(.1);assert.deepEqual(g.fortificationPack.presentation(b),p);g.activeOverlay=null;
 g.restoreSave(raw);const loaded=g.world.buildings.get(b.id);assert.equal(g.fortificationPack.presentation(loaded).net.phase,'armed');assert.equal(g.fortificationPack.presentation(loaded).net.remaining,R.netCapacity-1);assert.equal(g.fortificationPack.presentation(b),null);
});

test('159 filet remplacé : nouveau paiement et position armée, aucun ancien geste transmis',()=>{
 const g=fresh(),b=add(g,'woodWall');assert.equal(g.fortificationPack.equip('net',b.id).ok,true);for(let i=0;i<R.netCapacity;i++){const z=enemy(g,b);z.x=b.right+z.radius+1;g.killZombie(z,false);}assert.equal(g.fortificationPack.presentation(b).net.remaining,0);assert.equal(g.fortificationPack.presentation(b).net.phase,'action');
 const stock={...g.resources};standAt(g,g.player,b);assert.equal(g.fortificationPack.equip('net',b.id).ok,true);assert.equal(g.fortificationPack.presentation(b).net.phase,'armed');assert.equal(g.fortificationPack.presentation(b).net.remaining,R.netCapacity);for(const[key,n]of Object.entries(R.netCost))assert.equal(g.resources[key],stock[key]-n);
});

test('159 Hérisson nu : vibration sur contact physique réussi, retour et supports retirés invalidés',()=>{
 const g=fresh(),b=add(g);standAt(g,g.player,g.core());const before=copy(g.fortificationPack.presentation(b));assert.equal(before.spikes.phase,'idle');battle(g,.12);assert.deepEqual(g.fortificationPack.presentation(b),before);
 const far=enemy(g,b);far.x=b.x+500;g.rebuildBuckets();assert.equal(g.damageZombieBuilding(far,b,1),false);assert.equal(g.fortificationPack.presentation(b).spikes.phase,'idle');
 const z=enemy(g,b,true),hp=z.health;g.updateZombies(.04);assert.ok(z.health<hp,'Les pointes blessent par leur collision native');assert.equal(g.fortificationPack.presentation(b).spikes.phase,'action');moveAway(g,z,b);battle(g,.12);assert.equal(g.fortificationPack.presentation(b).spikes.phase,'return');battle(g,.2);assert.equal(g.fortificationPack.presentation(b).spikes.phase,'idle');
 enemy(g,b,true);g.updateZombies(.04);g.world.remove(b);assert.equal(g.fortificationPack.presentation(b),null);const replacement=new(b.constructor)(b.id,b.type,b.gx,b.gy,0,1);g.world.add(replacement);assert.equal(g.fortificationPack.presentation(replacement).spikes.phase,'idle');g.destroyBuilding(replacement);assert.equal(g.fortificationPack.presentation(b.id),null);
});

test('159 supports nombreux : éviction bornée des seuls mouvements, aucun dommage effacé',()=>{
 const g=fresh();standAt(g,g.player,g.core());assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1),supports=[];
 for(let cell=0;supports.length<R.maxFittings+1;cell++){
  assert.ok(cell<400,'La fixture doit proposer 129 supports accessibles');const gx=20+cell%33*3,gy=20+Math.floor(cell/33)*3;if(!g.world.placement(C.BUILDINGS.spikes,gx,gy,0).valid)continue;const b=new(g.core().constructor)(g.nextId++,'spikes',gx,gy,0,1);g.world.add(b);
  const spot=contactSpot(g,z,b);if(!spot){g.world.remove(b);continue;}supports.push(b);
  Object.assign(z,{x:spot[0],y:spot[1],health:z.maxHealth,stagger:0,attackCooldown:1});g.rebuildBuckets();const hp=z.health;g.updateZombies(.001);assert.ok(z.health<hp);assert.equal(g.fortificationPack.presentation(b).spikes.phase,'action');
 }
 assert.equal(g.fortificationPack.presentation(supports[0]).spikes.phase,'idle','Le plus ancien effet seul est évincé');assert.equal(g.fortificationPack.presentation(supports.at(-1)).spikes.phase,'action');assert.equal(g.world.buildings.has(supports[0].id),true);
});

function engineer(g,b){const point=g.fieldcraft.service(g.player,b),u=g.createProtectedSurvivor('engineer',point.x,point.y);assert.ok(u);return u;}
function preparationAdvance(g,seconds){for(let left=seconds;left>1e-8;left-=.1)g.defense131.step(Math.min(left,.1));}

test('159 réfection : animation sur réparation physique et vraie caisse, pause et sauvegarde exactes',()=>{
 const g=fresh(),b=add(g,'woodWall');b.health=b.maxHealth*.4;const u=engineer(g,b);assert.equal(g.defense131.startMaintenance(b.id).ok,true);assert.equal(g.defense131.presentation(b).maintenance.active,false);const stock={...g.resources};
 u.x=100;u.y=100;assert.equal(g.repairWithEngineer(u,b,.1),0);assert.equal(g.defense131.presentation(b).maintenance.active,false);standAt(g,u,b);assert.ok(g.repairWithEngineer(u,b,.1)>0);assert.equal(g.defense131.presentation(b).maintenance.active,true);preparationAdvance(g,.15);assert.ok(g.defense131.presentation(b).maintenance.motion>0);
 const p=copy(g.defense131.presentation(b)),raw=copy(g.serialize()),remaining={...p.maintenance.remaining};p.maintenance.remaining.scrap=999;assert.deepEqual(g.defense131.presentation(b).maintenance.remaining,remaining);g.paused=true;preparationAdvance(g,1);assert.deepEqual(g.defense131.presentation(b).maintenance.remaining,remaining);assert.equal(g.defense131.presentation(b).maintenance.active,true);g.paused=false;g.activeOverlay=g.ui.commandModal;preparationAdvance(g,1);assert.equal(g.defense131.presentation(b).maintenance.active,true);g.activeOverlay=null;
 g.restoreSave(raw);const loaded=g.world.buildings.get(b.id);assert.equal(g.defense131.presentation(loaded).maintenance.active,false);assert.deepEqual(g.defense131.presentation(loaded).maintenance.remaining,remaining);assert.deepEqual(g.resources,stock);assert.equal(g.defense131.presentation(b),null);
});

test('159 outillage : gestes uniquement sur ouvrier et budget effectivement consommé',()=>{
 const g=fresh(),b=add(g,'warehouse',72,72,.1),point=g.fieldcraft.service(g.player,b),u=g.createProtectedSurvivor('worker',point.x,point.y);assert.ok(u);assert.equal(g.defense131.equipWorksite(b.id).ok,true);
 const paid=g.defense131.presentation(b).work.remaining;assert.equal(g.defense131.presentation(b).work.active,false);b.work(.1);assert.equal(g.defense131.presentation(b).work.remaining,paid);assert.equal(g.defense131.presentation(b).work.active,false);
 u.state='build';u.targetBuilding=b.id;u.think=10;g.updateUnits(.04);assert.equal(g.defense131.presentation(b).work.active,true);assert.ok(g.defense131.presentation(b).work.remaining<paid);g.setWorkerOrder('retreat');preparationAdvance(g,.7);assert.equal(g.defense131.presentation(b).work.active,false);
 const before=stable(g),rng=g.random.state;for(let i=0;i<12;i++){g.defense131.presentation(b);g.drawBuilding(g.ctx,b);}assert.deepEqual(stable(g),before);assert.equal(g.random.state,rng);g.world.remove(b);assert.equal(g.defense131.presentation(b),null);
});

test('159 industrie régulée : activité issue de la vraie production, attente et pause cohérentes',()=>{
 const g=fresh(),b=add(g,'ammoFactory');assert.equal(g.fortificationPack.equip('regulator',b.id).ok,true);assert.equal(g.productionPresentation159(b).active,false);const ammo=g.resources.ammo,scrap=g.resources.scrap;
 g.economyTick(.1);assert.ok(g.resources.ammo>ammo);assert.ok(g.resources.scrap<scrap);assert.equal(g.productionPresentation159(b).active,true);assert.equal(g.productionPresentation159(b).smoke,true);const marker=g.productionActivity159.get(b);assert.equal(marker.at,g.elapsed);assert.ok(marker.seconds>0);const before=stable(g),rng=g.random.state;
 for(let i=0;i<12;i++)g.productionPresentation159(b);assert.deepEqual(stable(g),before);assert.equal(g.random.state,rng);g.paused=true;for(let i=0;i<6;i++)g.loop(g.lastFrame+40);assert.deepEqual(g.productionActivity159.get(b),marker);assert.deepEqual(g.resources,before.resources);g.paused=false;
 g.resources.scrap=R.inputReserve;g.economyTick(.1);assert.equal(g.productionPresentation159(b).active,false,'Le seuil préservé ne donne aucune activité sans intrants disponibles');assert.equal(g.productionActivity159.has(b),false);
 g.resources.scrap=R.inputReserve+1;g.resources.ammo=g.storage;g.economyTick(.1);assert.equal(g.productionPresentation159(b).active,false,'Le dépôt saturé arrête aussi le visuel');g.resources.ammo=ammo;b.gridOffline=true;g.economyTick(.1);assert.equal(g.productionPresentation159(b).active,false,'Un support hors réseau ne gagne aucun effet');
});
