'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs'),C=require('../src/core.js');
function fresh(scenario='classic'){const e=boot127(),g=e.game;require('../src/departure130.js').install(g);g.startNew('standard','17117',scenario);return{...e,g};}
function add(g,type='watchtower',gx=72,gy=72,progress=1){const b=new(g.core().constructor)(g.nextId++,type,gx,gy,0,progress);g.world.add(b);g.refreshMetrics(true);return b;}
function edge(g,side,inset=20,lateral=2048){Object.assign(g.player,side==='east'?{x:C.WORLD_SIZE-inset,y:lateral}:side==='west'?{x:inset,y:lateral}:side==='south'?{x:lateral,y:C.WORLD_SIZE-inset}:{x:lateral,y:inset});}
function announcement(g){return box(g).children.find(n=>n.getAttribute('role')==='status');}
function box(g){return g.ui.hud.children.find(n=>n.id==='departureWarning130');}
test('départ 1.30 : début sans poste ni fusilier, avertissement sans certificat de sûreté',()=>{
 const{g}=fresh(),q=g.departure130.assess();assert.equal(q.noFire,true);assert.equal(q.armedSoldiers,0);assert.equal(q.armedPosts,0);assert.match(q.advice,/bastion peut tomber/);assert.match(q.clock,/Crépuscule dans/);assert.equal(q.tone,'danger');
});
test('départ 1.30 : un fusilier armé reste une couverture limitée, escortes et morts exclus',()=>{
 const{g}=fresh('rearguard'),q=g.departure130.assess();assert.equal(q.armedSoldiers,1);assert.equal(q.noFire,false);assert.match(q.detail,/couverture reste à vérifier/);assert.match(q.advice,/peut tomber/);
 const soldier=g.units.find(u=>u.kind==='soldier');g.citadel={...g.citadel,isEscort:id=>id===soldier.id};assert.equal(g.departure130.assess().armedSoldiers,0);g.citadel={...g.citadel,isEscort:()=>false};soldier.health=0;assert.equal(g.departure130.assess().armedSoldiers,0);
});
test('départ 1.30 : chantier, panne, déconnexion et munitions protégées n’annoncent pas de tir disponible',()=>{
 const{g}=fresh(),b=add(g);assert.equal(g.departure130.assess().armedPosts,1);
 b.progress=.5;assert.equal(g.departure130.assess().unfinished,1);b.progress=1;
 for(const flag of ['siegeOffline','territoryOffline','gridOffline','dayOffline']){b[flag]=true;assert.equal(g.departure130.assess().armedPosts,0,flag);b[flag]=false;}
 b.powered=false;assert.equal(g.departure130.assess().armedPosts,0);b.powered=true;
 assert.equal(g.citadel.configure('reserve',180),true);assert.equal(g.departure130.assess().armedPosts,0);assert.match(g.departure130.assess().detail,/réserve protégée/);
 g.resources.ammo=0;assert.match(g.departure130.assess().detail,/Munitions communes épuisées/);
});
test('départ 1.30 : un caisson réellement chargé permet un tir autonome malgré la réserve commune vide',()=>{
 const{g}=fresh(),b=add(g);g.resources.wood=g.resources.scrap=100;const{standAt}=require('./helpers/physical-fixtures.cjs');standAt(g,g.player,b);assert.equal(g.fortificationPack.equip('ammo',b.id).ok,true);g.resources.ammo=0;
 const q=g.departure130.assess();assert.equal(q.armedPosts,1);assert.equal(q.localPosts,1);assert.match(q.detail,/ne se rechargent pas seuls/);
 const s=g.fortificationPack.snapshot();s.fittings[0].ammo=0;g.expansions.get('fortification').restore(s);assert.equal(g.departure130.assess().armedPosts,0);
});
test('départ 1.30 : intégrité critique et nuit noire sont signalées sans inventer une couverture lumineuse',()=>{
 const{g}=fresh();add(g);g.core().health=g.core().maxHealth*.2;g.wave=C.Urban.RULES.blackoutFirst;const q=g.departure130.assess();assert.match(q.detail,/Centre gravement endommagé/);assert.match(q.detail,/Nuit noire annoncée/);assert.equal(q.tone,'danger');
});
test('départ 1.30 : aperçu de défense ne consomme rien et ne change ni les ordres ni la sauvegarde',()=>{
 const{g}=fresh();add(g);const before=g.serialize();for(let i=0;i<4;i++)g.departure130.assess();const after=g.serialize();delete before.timestamp;delete after.timestamp;assert.deepEqual(after,before);
});
for(const[side,key]of [['east','ArrowRight'],['west','ArrowLeft'],['north','ArrowUp'],['south','ArrowDown']]){
 test('départ 1.30 : préavis puis franchissement par flèche côté '+side,()=>{
  const{g}=fresh();edge(g,side,400);g.input.keys.add(key);g.departure130.approach();assert.equal(g.frontier.active(),false);assert.equal(g.departure130.status().visible,true);assert.equal(box(g).classList.contains('hidden'),false);
  edge(g,side);g.world.nodes.forEach(n=>n.depleted=true);g.update(.04);assert.equal(g.frontier.active(),true);assert.equal(g.departure130.status().visible,true);
 });
 test('départ 1.30 : action explicite au côté '+side+' prévient sans bloquer',()=>{
  const{g}=fresh();edge(g,side,20,1200);assert.equal(g.departure130.status().visible,false);assert.equal(g.frontier.enter(),true);assert.equal(g.departure130.status().visible,true);assert.equal(g.player.regionAbsent,true);
 });
}
test('départ 1.30 : un déplacement vers le nord près d’un coin déclenche aussi le préavis',()=>{
 const{g}=fresh();g.player.x=300;g.player.y=300;g.input.keys.add('ArrowUp');g.departure130.approach();assert.equal(g.departure130.status().visible,true);
});
test('départ 1.30 : pas de spam au bord, réarmement seulement après retour à l’intérieur',()=>{
 const{g}=fresh();edge(g,'east',400);g.input.keys.add('KeyD');g.departure130.approach();const initial=g.departure130.status(),message=announcement(g).textContent;for(let i=0;i<20;i++){g.elapsed+=.04;g.departure130.approach();}assert.equal(g.departure130.status().until,initial.until);assert.equal(announcement(g).textContent,message);edge(g,'east');g.frontier.enter();assert.equal(announcement(g).textContent,message);
 g.input.keys.add('KeyA');for(let i=0;i<80&&g.frontier.active();i++)g.update(.04);g.input.keys.clear();assert.equal(g.frontier.active(),false);edge(g,'east',400);g.input.keys.add('KeyD');g.departure130.approach();assert.equal(announcement(g).textContent,message);g.player.x=g.player.y=2048;g.departure130.approach();assert.equal(g.departure130.status().visible,false);edge(g,'east',400);g.input.keys.add('KeyD');g.departure130.approach();assert.equal(g.departure130.status().visible,true);
});
test('départ 1.30 : pause et modale ne déclenchent rien et préservent le préavis restant',()=>{
 const{g}=fresh();edge(g,'east',400);g.input.keys.add('KeyD');g.paused=true;g.departure130.approach();assert.equal(g.departure130.status().visible,false);g.paused=false;g.activeOverlay=g.ui.commandModal;g.departure130.approach();assert.equal(g.departure130.status().visible,false);g.activeOverlay=null;g.departure130.approach();const until=g.departure130.status().until;g.paused=true;for(let i=0;i<10;i++)g.departure130.approach();assert.equal(g.departure130.status().until,until);g.activeOverlay=g.ui.commandModal;g.departure130.refresh();assert.equal(box(g).classList.contains('hidden'),true);g.activeOverlay=null;g.departure130.refresh();assert.equal(box(g).classList.contains('hidden'),false);
});
test('départ 1.30 : reprise hors D-17 réaffiche le risque et un nouveau monde réinitialise le préavis',()=>{
 const{g}=fresh();edge(g,'east');g.frontier.enter();const raw=g.serialize();assert.equal(Object.hasOwn(raw,'departure130'),false);g.restoreSave(raw);g.departure130.approach();assert.equal(g.departure130.status().visible,true);assert.equal(g.frontier.active(),true);g.startNew('standard','42');g.departure130.approach();assert.equal(g.departure130.status().visible,false);assert.equal(g.departure130.status().episode,false);
});
test('départ 1.30 : alerte et assaut hors D-17 produisent chacun un rappel, sécurisation bien nommée',()=>{
 const{g}=fresh();edge(g,'east');g.frontier.enter();g.departure130.approach();g.phase='warning';g.phaseTime=5;g.departure130.approach();assert.match(announcement(g).textContent,/Assaut dans/);assert.match(g.departure130.status().notice.clock,/Assaut dans/);const message=announcement(g).textContent;g.phaseTime=4;g.departure130.approach();assert.equal(announcement(g).textContent,message);g.phase='assault';g.departure130.approach();assert.match(g.departure130.status().notice.advice,/bastion est attaqué/);g.phase='aftermath';assert.equal(g.departure130.assess().clock,'Sécurisation en cours');
});
test('départ 1.30 : toute défense manuelle est libérée avant la sortie explicite',()=>{
 const{g}=fresh(),b=add(g,'watchtower',125,61);g.fieldcraft.setup();edge(g,'east',20,2048);assert.equal(g.fieldcraft.control(b),true);assert.equal(g.fieldcraft.context().mounted,b.id);assert.equal(g.frontier.enter(),true);assert.equal(g.fieldcraft.context().mounted,null);
});
test('départ 1.30 : véhicule et son coffre traversent avec préavis sans dépense ou téléportation',()=>{
 const{g}=fresh();for(const[type,x]of [['expeditionOffice',72],['expeditionGarage',77]])add(g,type,x,65);g.fieldcraft.setup();require('./helpers/physical-fixtures.cjs').standAt(g,g.player,g.core());g.resources.wood=g.resources.scrap=300;assert.equal(g.expeditions.buildCar().ok,true);const v=g.expeditions.car();edge(g,'east',38);v.x=g.player.x;v.y=g.player.y;v.fuel=24;v.cargo.food=7;v.driving=true;g.player.radius=C.Expeditions.RULES.carRadius;assert.equal(g.frontier.enter(),true);assert.equal(g.departure130.status().visible,true);assert.equal(g.frontier.position().car.driving,true);assert.equal(v.fuel,24);assert.equal(v.cargo.food,7);
});
test('départ 1.30 : la vraie nuit et les tirs autonomes continuent pendant l’absence',()=>{
 const{g}=fresh(),b=add(g);edge(g,'east');g.frontier.enter();g.phaseTime=.02;g.update(.04);assert.equal(g.phase,'warning');const remaining=g.phaseTime;g.update(.04);assert.ok(g.phaseTime<remaining);g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=b.x+100;z.y=b.y;g.rebuildBuckets();const ammo=g.resources.ammo;g.updateBuildings(.04);assert.ok(g.resources.ammo<ammo);assert.ok(g.projectiles.length>0);assert.equal(g.frontier.active(),true);
});
test('départ 1.30 : le centre peut réellement tomber lorsque le commandant est en région',()=>{
 const{g}=fresh(),core=g.core();edge(g,'east');g.frontier.enter();g.units=[];core.health=1;g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=core.right+z.radius-1;z.y=core.y;z.attackCooldown=0;g.rebuildBuckets();for(let i=0;i<20&&!g.gameOver;i++)g.update(.04);assert.equal(core.dead,true);assert.equal(g.gameOver,true);
});

test('départ 1.30 : une seule bannière complète et accessible, sans toast ni annonce répétée du compte à rebours',()=>{
 const{g}=fresh();edge(g,'east',400);g.input.keys.add('KeyD');const count=g.notifications.length;g.departure130.approach();const live=announcement(g),message=live.textContent,initialClock=box(g).children[1].textContent;assert.equal(g.notifications.length,count);assert.equal(live.getAttribute('aria-live'),'polite');assert.match(message,/bastion peut tomber/);assert.match(message,/Aucun poste ni fusilier/);assert.match(message,/Crépuscule dans/);g.elapsed+=2;g.phaseTime-=2;g.departure130.refresh();assert.equal(live.textContent,message);assert.notEqual(box(g).children[1].textContent,initialClock);
});
test('départ 1.30 : sans HUD, le message de secours explique encore le risque',()=>{
 const{game:g}=boot127();require('../src/departure130.js').install(g,null);g.startNew('standard','17117');edge(g,'east',400);g.input.keys.add('KeyD');const count=g.notifications.length;g.departure130.approach();assert.equal(g.notifications.length,count+1);assert.match(g.notifications.at(-1).text,/bastion peut tomber/);
});
