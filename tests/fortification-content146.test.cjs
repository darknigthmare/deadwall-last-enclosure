'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),Kit=require('../src/expansion-kit.js'),Pack=require('../src/fortification-pack.js'),Survival=require('../src/survival-pack.js');
const copy=value=>JSON.parse(JSON.stringify(value));
function fresh(){const {game:g}=bootGame();Kit.install(g);Pack.install(g);Survival.install(g);g.startNew('standard','17117');g.world.nodes.forEach(n=>n.depleted=true);g.units=[];g.resources.wood=g.resources.scrap=g.resources.stone=g.resources.ammo=300;return g;}
// Completed structures and attained tiers are declared test fixtures, not a played campaign.
function structure(g,type,x=72,y=72){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);g.selectBuilding(b);standAt(g,g.player,b);return b;}
const fit=(g,b)=>g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);
function infected(g,b){const z={id:g.nextId++,kind:'walker',x:b.x+120,y:b.y,health:60,maxHealth:60,dead:false,radius:10,vx:0,vy:0,think:0,attackCooldown:0,speedFactor:1,facing:0};g.zombies.push(z);g.rebuildBuckets();return z;}
function unchangedRefusal(g,kind,b){const resources={...g.resources},before=g.fortificationPack.snapshot(),r=g.fortificationPack.equip(kind,b.id);assert.equal(r.ok,false);assert.deepEqual(g.resources,resources);assert.deepEqual(g.fortificationPack.snapshot(),before);return r;}

test('146 défenses : caisson compact payé, réservé une seule fois et non interchangeable gratuitement',()=>{
 const g=fresh(),b=structure(g,'watchtower');g.tier=C.CITY_TIERS[1];const before={...g.resources},a=g.fortificationPack.actions().find(a=>a.id==='ammoCompact');
 assert.equal(a.disabled,false);assert.match(a.label,/12/);assert.equal(a.run().ok,true);
 for(const [key,n]of Object.entries(C.FortificationPackRules.variants.ammoCompact.cost))assert.equal(before[key]-g.resources[key],n);
 assert.equal(fit(g,b).ammo,12);unchangedRefusal(g,'ammoCompact',b);unchangedRefusal(g,'ammo',b);unchangedRefusal(g,['ammoCompact'],b);
});

test('146 défenses : les douze cartouches produisent douze tirs réels puis sont épuisées',()=>{
 const g=fresh(),b=structure(g,'watchtower');g.tier=C.CITY_TIERS[1];assert.equal(g.fortificationPack.equip('ammoCompact',b.id).ok,true);g.resources.ammo=0;g.dayClock=.5;infected(g,b);
 for(let i=0;i<12;i++){b.fireCooldown=0;g.updateBuildings(.04);assert.equal(g.projectiles.length,i+1);g.updateBuildings(.04);assert.equal(g.projectiles.length,i+1,'aucun second tir avant cadence');}
 b.fireCooldown=0;g.updateBuildings(.04);assert.equal(g.projectiles.length,12);assert.equal(fit(g,b),undefined);assert.equal(g.resources.ammo,0);
});

test('146 défenses : filet large exige palier, atelier terminé et accès réel avant paiement',()=>{
 const g=fresh(),wall=structure(g,'woodWall');g.tier=C.CITY_TIERS[1];assert.match(unchangedRefusal(g,'netWide',wall).reason,/Palier/);
 g.tier=C.CITY_TIERS[2];assert.match(unchangedRefusal(g,'netWide',wall).reason,/terminé requis/);
 const workshop=structure(g,'workshop',82,72);workshop.progress=.5;g.selectBuilding(wall);standAt(g,g.player,wall);g.tier=C.CITY_TIERS[2];unchangedRefusal(g,'netWide',wall);
 workshop.progress=1;g.player.x=100;g.player.y=100;unchangedRefusal(g,'netWide',wall);standAt(g,g.player,wall);
 const before={...g.resources};assert.equal(g.fortificationPack.equip('netWide',wall.id).ok,true);assert.equal(fit(g,wall).net,24);
 for(const[key,n]of Object.entries(C.FortificationPackRules.variants.netWide.cost))assert.equal(before[key]-g.resources[key],n);
 const stock={...g.resources};g.destroyBuilding(wall);assert.equal(fit(g,wall),undefined);assert.deepEqual(g.resources,stock,'aucun remboursement du matériel perdu');
});

test('146 défenses : filet large absorbe vingt-quatre corps, sans augmenter les PV ni supprimer les corps',()=>{
 const g=fresh(),wall=structure(g,'woodWall');structure(g,'workshop',82,72);g.selectBuilding(wall);standAt(g,g.player,wall);g.tier=C.CITY_TIERS[2];assert.equal(g.fortificationPack.equip('netWide',wall.id).ok,true);const hp=wall.health,max=wall.maxHealth;
 for(let i=0;i<26;i++){const z=infected(g,wall);z.x=wall.x+12;z.y=wall.y;g.killZombie(z,false);}
 assert.equal(wall.corpseLoad,2);assert.equal(g.corpses.length,26);assert.equal(wall.health,hp);assert.equal(wall.maxHealth,max);assert.equal(fit(g,wall),undefined);
});

test('146 défenses : rechargement, poste, pause, décès et activité concurrente refusent sans dépense',()=>{
 for(const mode of ['reload','mounted','pause','dead','busy']){
  const g=fresh(),b=structure(g,'watchtower');g.tier=C.CITY_TIERS[1];
  if(mode==='reload')g.player.reload=1;
  if(mode==='mounted')assert.equal(g.fieldcraft.control(b),true);
  if(mode==='pause')g.togglePause(true);
  if(mode==='dead'){g.player.health=0;g.player.dead=true;}
  if(mode==='busy'){g.player.health=60;g.player.carry.medicine=2;assert.equal(g.survivalPack.begin('dressing').ok,true);}
  const action=g.fortificationPack.actions().find(a=>a.id==='ammoCompact');assert.equal(action.disabled,true,mode);unchangedRefusal(g,'ammoCompact',b);
 }
});

test('146 défenses : récupération partielle conserve le reliquat exact et refuse pendant recharge',()=>{
 const g=fresh(),b=structure(g,'watchtower');g.tier=C.CITY_TIERS[1];assert.equal(g.fortificationPack.equip('ammoCompact',b.id).ok,true);g.resources.ammo=g.storage-3.5;
 assert.equal(g.fortificationPack.recoverAmmo(b.id).ok,true);assert.equal(g.resources.ammo,g.storage);assert.equal(fit(g,b).ammo,8.5);
 g.resources.ammo-=2;g.player.reload=1;const stock=g.resources.ammo;assert.equal(g.fortificationPack.recoverAmmo(b.id).ok,false);assert.equal(g.resources.ammo,stock);assert.equal(fit(g,b).ammo,8.5);
});

test('146 défenses : ancienne réserve reste douze, nouvelle réserve vingt-quatre survit en version20',()=>{
 const g=fresh(),wall=structure(g,'woodWall');assert.equal(g.fortificationPack.equip('net',wall.id).ok,true);const legacy=g.serialize(),old=copy(legacy.expansions127.modules.fortification);
 g.restoreSave(legacy);assert.deepEqual(g.fortificationPack.snapshot(),old);assert.equal(fit(g,g.world.buildings.get(wall.id)).net,12);
 structure(g,'workshop',82,72);const large=structure(g,'woodWall',76,72);g.tier=C.CITY_TIERS[2];assert.equal(g.fortificationPack.equip('netWide',large.id).ok,true);assert.equal(fit(g,large).net,24);assert.equal(g.serialize().version,20);
 const before=g.world,resources={...g.resources},invalid=g.serialize();invalid.expansions127.modules.fortification.fittings.find(f=>f.id===large.id).net=25;assert.throws(()=>g.restoreSave(invalid),/Fortifications/);assert.equal(g.world,before);assert.deepEqual(g.resources,resources);
 assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(fit(g,g.world.buildings.get(large.id)).net,24);assert.equal(fit(g,g.world.buildings.get(wall.id)).net,12);g.startNew('standard','42');assert.deepEqual(g.fortificationPack.snapshot(),Pack.initial());
});

test('146 défenses : absence du registre reste vide et ne crédite aucune variante',()=>{
 const g=fresh(),before={...g.resources},raw=g.serialize();delete raw.expansions127;g.restoreSave(raw);assert.deepEqual(g.fortificationPack.snapshot(),Pack.initial());assert.deepEqual(g.resources,before);assert.deepEqual(Pack.normalize(undefined),Pack.initial());
});
