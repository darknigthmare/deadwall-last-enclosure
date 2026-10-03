'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),R=C.Arsenal134Rules,D=R.catalog;
const newIds=['assemblyHammer','wreckingBar','singleShot'];
const clone=value=>JSON.parse(JSON.stringify(value));
// Completed buildings and achieved city scores are explicit model fixtures.
// Paid assembly, withdrawal, barricade work and shooting use the real controllers.
function fresh(){const {g}=boot131();require('../src/succession133.js').install(g);require('../src/arsenal134.js').install(g);require('../src/barricades134.js').install(g);g.startNew('standard','17117');g.units=[];g.world.nodes.forEach(n=>n.depleted=true);g.phaseTime=999;standAt(g,g.player,g.core());return g;}
function structure(g,type,x,y,progress=1){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,progress);g.world.add(b);g.refreshMetrics(true);return b;}
function workshop(g){const b=structure(g,'workshop',72,72);for(let i=0;i<5;i++)structure(g,'warehouse',86,60+i*5);assert.ok(g.tier.id>=2);standAt(g,g.player,b);assert.equal(b.powered,true);return b;}
function work(g,seconds){for(let left=seconds;left>1e-8;left-=R.maxStep)g.arsenal134.step(Math.min(left,R.maxStep));}
function craft(g,id){const q=g.arsenal134.preview('craft',id);assert.equal(q.ok,true,q.reason);assert.equal(g.arsenal134.begin('craft',id).ok,true);work(g,q.seconds);return g.arsenal134.snapshot().locker.at(-1);}
function obtain(g,id){const i=craft(g,id);standAt(g,g.player,g.core());assert.equal(g.arsenal134.transfer(i.uid,'carried').ok,true);return i;}
function economic(g){return{resources:clone(g.resources),bag:clone(g.player.carry),armory:g.arsenal134.snapshot(),random:g.random.state};}
function item(g,uid){const s=g.arsenal134.snapshot();return [...s.carried,...s.locker].find(i=>i.uid===uid);}

test('148 atelier : trois recettes et contreparties sans changer les armes et outils historiques',()=>{
 assert.equal(Object.keys(D).length,40);assert.equal(D.singleShot.magazine,1);assert.equal(D.singleShot.ammoPerReload,1);assert.ok(D.singleShot.damage<D.hunting.damage);assert.ok(D.singleShot.range<D.hunting.range);assert.ok(D.singleShot.fireRate<D.hunting.fireRate);assert.ok(D.singleShot.kg<D.hunting.kg);
 assert.deepEqual(D.assemblyHammer.cost,{wood:4,scrap:12});assert.deepEqual(D.wreckingBar.cost,{wood:3,scrap:18});assert.deepEqual(D.singleShot.cost,{wood:6,scrap:18});
 assert.equal(D.assemblyHammer.requires,'workshop');assert.equal(D.wreckingBar.requires,'workshop');assert.ok(D.assemblyHammer.kg>D.hammer.kg);assert.ok(D.wreckingBar.kg>D.crowbar.kg);assert.ok(D.assemblyHammer.damage<D.hammer.damage);assert.ok(D.wreckingBar.fireRate<D.crowbar.fireRate);
 assert.deepEqual(R.toolBonuses.barricade,{id:'hammer',factor:1.25});assert.deepEqual(R.toolBonuses.dismantle,{id:'crowbar',factor:1.2});assert.equal(R.toolWear,.12);assert.deepEqual(Object.keys(C.WEAPONS),['pistol','rifle','shotgun']);
});

test('148 atelier : accès réel à l’atelier, coûts de fin et objet prêt unique au râtelier',()=>{
 const g=fresh(),b=workshop(g),before=economic(g);assert.equal(g.arsenal134.view().atHome,false);const q=g.arsenal134.preview('craft','assemblyHammer');assert.equal(q.ok,true);assert.equal(q.seconds,7);assert.deepEqual(q.station,{id:b.id,name:b.def.name});
 for(let i=0;i<15;i++)g.arsenal134.preview('craft','assemblyHammer');assert.deepEqual(economic(g),before);
 assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,true);assert.doesNotThrow(()=>structuredClone(g.arsenal134.view().task));assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);work(g,6.9);assert.deepEqual(g.resources,before.resources);assert.equal(g.arsenal134.snapshot().locker.length,0);
 work(g,.1);const ready=g.arsenal134.snapshot().locker[0];assert.equal(ready.id,'assemblyHammer');assert.equal(ready.rounds,0);assert.equal(g.resources.wood,before.resources.wood-4);assert.equal(g.resources.scrap,before.resources.scrap-12);assert.equal(g.resources.ammo,before.resources.ammo);work(g,30);assert.equal(g.arsenal134.snapshot().locker.length,1);
 assert.equal(g.arsenal134.transfer(ready.uid,'carried').ok,false,'le râtelier reste au dépôt');standAt(g,g.player,g.core());const paid={...g.resources};assert.equal(g.arsenal134.transfer(ready.uid,'carried').ok,true);assert.equal(g.arsenal134.transfer(ready.uid,'carried').ok,false);assert.deepEqual(g.resources,paid);assert.equal(g.arsenal134.equip(ready.uid).ok,true);
});

test('148 atelier : palier, atelier absent/inachevé/hors tension et mur réel refusent sans paiement',()=>{
 const g=fresh(),before=economic(g);assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);assert.deepEqual(economic(g),before);
 const b=workshop(g);for(const [field,value]of [['progress',.5],['powered',false],['siegeOffline',true],['gridOffline',true]]){const old=b[field];b[field]=value;const s=economic(g);assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false,field);assert.deepEqual(economic(g),s);b[field]=old;}
 g.tier=C.CITY_TIERS[1];assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);g.refreshMetrics(true);
 for(let y=71;y<=76;y++)structure(g,'steelWall',71,y);g.player.x=b.left-55;g.player.y=b.y;const blocked=economic(g);assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);assert.deepEqual(economic(g),blocked);
});

test('148 atelier : disparition, remplacement et panne du support capturé interrompent avant débit',()=>{
 for(const mode of ['destroy','replacement','power','fire','move','ingredients']){
  const g=fresh(),b=workshop(g);assert.equal(g.arsenal134.begin('craft','wreckingBar').ok,true);work(g,7.9);
  if(mode==='destroy')g.destroyBuilding(b);
  if(mode==='replacement'){g.world.remove(b);g.world.add(new(b.constructor)(b.id,b.type,b.gx,b.gy,0,1));structure(g,'workshop',76,72);}
  if(mode==='power')b.powered=false;
  if(mode==='fire')b.siegeOffline=true;
  if(mode==='move')g.player.y+=4;
  if(mode==='ingredients')g.resources.scrap=0;
  const stock={...g.resources};g.arsenal134.step(.1);assert.equal(g.arsenal134.busy(),false,mode);assert.deepEqual(g.resources,stock,mode);assert.equal(g.arsenal134.snapshot().locker.length,0,mode);
 }
});

test('148 atelier : recharge, seau réel, tir tactile et autre préparation interdisent le travail simultané',()=>{
 const g=fresh();workshop(g);const stock={...g.resources};g.player.reload=1;assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);g.player.reload=0;
 assert.equal(g.siege.toggleTool(),true);assert.equal(g.arsenal134.preview('craft','assemblyHammer').ok,false);assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);g.siege.toggleTool();
 assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,true);work(g,1);g.siege.toggleTool();g.arsenal134.step(.1);assert.equal(g.arsenal134.busy(),false);assert.deepEqual(g.resources,stock);g.siege.toggleTool();
 assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,true);g.input.touchFire=true;g.arsenal134.step(.1);assert.equal(g.arsenal134.busy(),false);g.input.touchFire=false;assert.deepEqual(g.resources,stock);
 assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,true);assert.equal(g.survivalPack.begin('dressing').ok,false);assert.equal(g.startReload(),false);g.arsenal134.cancel();assert.deepEqual(g.resources,stock);
});

test('148 atelier : menace locale réelle et poste contrôlé refusent sans ressource perdue',()=>{
 const g=fresh(),b=workshop(g),tower=structure(g,'watchtower',76,72);standAt(g,g.player,tower);assert.equal(g.fieldcraft.control(tower),true);const stock={...g.resources};assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);g.fieldcraft.control();standAt(g,g.player,b);
 g.spawnZombie('walker');const z=g.zombies.at(-1);z.x=g.player.x+30;z.y=g.player.y;g.rebuildBuckets();assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,false);z.dead=true;g.rebuildBuckets();assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,true);z.dead=false;g.rebuildBuckets();g.arsenal134.step(.1);assert.equal(g.arsenal134.busy(),false);assert.deepEqual(g.resources,stock);
});

test('148 atelier : pause puis Continue annulent seulement l’inachevé et gardent les achats prêts',()=>{
 const g=fresh(),b=workshop(g),stock={...g.resources};assert.equal(g.arsenal134.begin('craft','assemblyHammer').ok,true);work(g,2);const progress=g.arsenal134.view().task.progress;
 g.paused=true;work(g,20);assert.equal(g.arsenal134.view().task.progress,progress);g.paused=false;assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.arsenal134.busy(),false);assert.equal(g.arsenal134.snapshot().locker.length,0);assert.deepEqual(g.resources,stock);
 standAt(g,g.player,g.world.buildings.get(b.id));const i=craft(g,'assemblyHammer'),paid={...g.resources};for(let n=0;n<3;n++){assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.arsenal134.snapshot().locker.filter(v=>v.uid===i.uid).length,1);assert.deepEqual(g.resources,paid);}
 standAt(g,g.player,g.core());assert.equal(g.arsenal134.transfer(i.uid,'carried').ok,true);assert.equal(g.arsenal134.equip(i.uid).ok,true);assert.deepEqual(g.resources,paid);assert.equal(g.serialize().version,20);
 g.startNew('standard','42');assert.ok([...g.arsenal134.snapshot().carried,...g.arsenal134.snapshot().locker].every(i=>!newIds.includes(i.id)));assert.equal(g.arsenal134.busy(),false);
});

test('148 atelier : arme monocoup assemblée vide, recharge payée et tir réel avec cadence/usure',()=>{
 const g=fresh();workshop(g);standAt(g,g.player,g.core());const ammo=g.resources.ammo,i=obtain(g,'singleShot');assert.equal(i.rounds,0);assert.equal(g.resources.ammo,ammo);assert.equal(g.arsenal134.equip(i.uid).ok,true);assert.equal(g.player.magazine.rifle,0);
 g.startReload();assert.equal(g.player.reload,1.9);g.player.reload=0;g.finishReload();assert.equal(g.resources.ammo,ammo-1);assert.equal(g.player.magazine.rifle,1);g.player.shootCooldown=0;const count=g.projectiles.length;g.shootPlayer();assert.equal(g.projectiles.length,count+1);assert.equal(g.projectiles.at(-1).damage,68);assert.equal(g.player.magazine.rifle,0);assert.equal(item(g,i.uid).condition,100-.35);g.shootPlayer();assert.equal(g.projectiles.length,count+1);assert.equal(g.resources.ammo,ammo-1);
 const saved=g.serialize();g.restoreSave(saved);assert.equal(item(g,i.uid).rounds,0);assert.equal(g.arsenal134.weaponSpec().id,'singleShot');assert.equal(g.resources.ammo,ammo-1);
});

test('148 atelier : poids conserve l’objet déjà payé au râtelier quand le harnais est plein',()=>{
 const g=fresh();workshop(g);for(let n=0;n<5;n++)structure(g,'warehouse',96,60+n*5);assert.ok(g.tier.id>=3);const i=craft(g,'wreckingBar');standAt(g,g.player,g.core());g.resources.scrap=300;const large=obtain(g,'heavyNest');assert.equal(item(g,large.uid).id,'heavyNest');assert.equal(g.arsenal134.view().weight+3.7>R.carryKg,true);const stock={...g.resources};assert.equal(g.arsenal134.transfer(i.uid,'carried').ok,false);assert.equal(item(g,i.uid).id,'wreckingBar');assert.deepEqual(g.resources,stock);assert.equal(g.arsenal134.transfer(large.uid,'locker').ok,true);assert.equal(g.arsenal134.transfer(i.uid,'carried').ok,true);assert.deepEqual(g.resources,stock);
});

test('148 atelier : outils tenus accélèrent leurs vrais travaux, sans rendement ni bonus au simple portage',()=>{
 const g=fresh(),b=workshop(g),hammer=obtain(g,'assemblyHammer');standAt(g,g.player,b);const bar=obtain(g,'wreckingBar');
 assert.equal(g.arsenal134.toolFactor('barricade'),1);assert.equal(g.arsenal134.equip(hammer.uid).ok,true);assert.equal(g.arsenal134.toolFactor('barricade'),1.45);assert.equal(g.arsenal134.toolFactor('wood'),1);assert.equal(g.arsenal134.toolFactor('dismantle'),1);
 const B=require('../src/barricades134.js'),t=B.localTargets(g.exploration125.plan).find(t=>t.kind==='door');g.player.x=t.x-Math.sin(t.angle)*32;g.player.y=t.y+Math.cos(t.angle)*32;g.player.carry.wood=20;g.player.carry.scrap=10;
 const bag={...g.player.carry};assert.equal(g.barricades134.begin('build',t.id,'planks').ok,true);assert.equal(g.barricades134.job.seconds,5/1.45);for(let n=0;n<30&&g.barricades134.busy();n++)g.barricades134.step(.25);assert.equal(g.barricades134.busy(),false);assert.equal(g.player.carry.wood,bag.wood-6);assert.equal(g.player.carry.scrap,bag.scrap-1);assert.ok(Math.abs(item(g,hammer.uid).condition-(100-5/1.45*.18))<1e-7);
 assert.equal(g.arsenal134.equip(bar.uid).ok,true);assert.equal(g.arsenal134.toolFactor('dismantle'),1.5);assert.equal(g.arsenal134.toolFactor('scrap'),1);const before={...g.player.carry};assert.equal(g.barricades134.begin('dismantle',t.id).ok,true);assert.equal(g.barricades134.job.seconds,3/1.5);for(let n=0;n<15&&g.barricades134.busy();n++)g.barricades134.step(.25);assert.equal(g.barricades134.snapshot().records.length,0);assert.equal(g.player.carry.wood-before.wood,Math.floor(6*C.BarricadeRules134.refundFactor));assert.equal(g.player.carry.scrap-before.scrap,Math.floor(C.BarricadeRules134.refundFactor));assert.ok(Math.abs(item(g,bar.uid).condition-(100-2*.22))<1e-7);assert.equal(g.barricades134.begin('dismantle',t.id).ok,false);
});

test('148 atelier : IDs hérités du prototype ou tableau et chargeur impossible sont refusés atomiquement',()=>{
 const g=fresh(),before=economic(g),world=g.world;
 for(const id of ['constructor','__proto__','toString',['assemblyHammer']]){const raw=g.serialize(),a=raw.expansions127.modules.arsenal134;a.locker.push({uid:a.next++,id,condition:100,rounds:0});assert.throws(()=>g.restoreSave(raw),/armurerie/);assert.equal(g.world,world);assert.deepEqual(economic(g),before);}
 const raw=g.serialize(),a=raw.expansions127.modules.arsenal134;a.locker.push({uid:a.next++,id:'singleShot',condition:100,rounds:2});assert.throws(()=>g.restoreSave(raw),/armurerie/);assert.equal(g.world,world);assert.deepEqual(economic(g),before);
});

test('148 atelier : l’absence ancienne du registre ne donne aucun nouveau matériel ou munition',()=>{
 const g=fresh(),raw=g.serialize(),stock={...g.resources},magazine={...g.player.magazine};delete raw.expansions127.modules.arsenal134;g.restoreSave(raw);const a=g.arsenal134.snapshot();assert.ok([...a.carried,...a.locker].every(i=>!newIds.includes(i.id)));assert.deepEqual(g.resources,stock);for(const [id,n]of Object.entries(magazine))assert.equal(a.carried.find(i=>i.id===id).rounds,n);assert.equal(a.version,1);
});

test('148 postes : affût payé consomme ses cartouches locales contre le vrai bouclier, frontal puis dos',()=>{
 const g=fresh();workshop(g);standAt(g,g.player,g.core());g.resources.scrap=100;const i=obtain(g,'tripod');
 Object.assign(g.player,{x:2700,y:1800,facing:0});const deployed=g.arsenal134.deploy(i.uid);assert.equal(deployed.ok,true,deployed.reason);g.player.carry.ammo=2;assert.equal(g.arsenal134.servicePost(i.uid,'ammo').ok,true);assert.equal(g.player.carry.ammo,0);
 assert.equal(g.spawnZombie('shielded'),true);const z=g.zombies.at(-1);Object.assign(z,{x:2820,y:1800,facing:Math.PI});g.rebuildBuckets();assert.equal(g.nightwatch.visible(z),true);const stock={...g.resources},health=z.health;
 g.arsenal134.step(.1);assert.ok(Math.abs(health-z.health-D.tripod.damage*C.ENEMY_RULES.shield.damageMultiplier)<1e-7);assert.equal(g.arsenal134.snapshot().posts[0].item.rounds,1);assert.deepEqual(g.resources,stock);
 z.facing=0;for(let n=0;n<4;n++)g.arsenal134.step(.1);assert.ok(Math.abs(health-z.health-D.tripod.damage*(1+C.ENEMY_RULES.shield.damageMultiplier))<1e-7);assert.equal(g.arsenal134.snapshot().posts[0].item.rounds,0);const after=z.health;for(let n=0;n<10;n++)g.arsenal134.step(.1);assert.equal(z.health,after);assert.deepEqual(g.resources,stock);
 const saved=g.arsenal134.snapshot();g.restoreSave(g.serialize());assert.deepEqual(g.arsenal134.snapshot(),saved);assert.equal(g.zombies[0].facing,0);
});
