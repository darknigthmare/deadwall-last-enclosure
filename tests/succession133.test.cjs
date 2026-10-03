'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs'),{pose,trace}=require('./helpers/navigation130.cjs');
function fresh(seed='17117'){const {g}=boot131({seed});require('../src/succession133.js').install(g);return g;}
function kill(g){g.player.invulnerable=0;g.damagePlayer(1000);return g.succession133.remains().at(-1);}
function clone(o){return JSON.parse(JSON.stringify(o));}
function riseNext(g,domain='local'){const data=g.serialize(),r=data.succession133.remains.at(-1);r.body.phase='waiting';r.body.roll=0;r.body.left=.01;g.restoreSave(data);g.succession133.step(.1);return g.succession133.remains().at(-1);}
function upstairs(g){const w=g.frontier.world(),poi=w.pois.find(p=>p.levels.includes(1));const stair=w.plan(poi,1).stairs[0],p=DeadwallFrontierGeometry.global(poi,stair.x+stair.w/2,stair.y+stair.h/2);pose(g,p,{z:1,inside:poi.id});return{...p,z:1,inside:poi.id};}

test('1.33 mort définitive : contenu déplacé une seule fois et aucune réanimation automatique',()=>{
 const g=fresh(),stock={...g.resources},point={x:g.player.x,y:g.player.y};g.player.carry.wood=12;g.player.carry.ammo=3;const magazines={...g.player.magazine};
 const r=kill(g);assert.equal(g.succession133.pending(),true);assert.equal(g.paused,true);assert.equal(g.canIssueCommand(),false);assert.deepEqual(r.magazine,magazines);assert.equal(r.bag.wood,12);assert.equal(r.bag.ammo,3);assert.equal(r.point.x,point.x);assert.equal(r.point.y,point.y);assert.equal(DeadwallCore.bagTotal(g.player.carry),0);assert.equal(Object.values(g.player.magazine).reduce((a,b)=>a+b),0);
 for(let i=0;i<100;i++)g.updatePlayer(1);assert.equal(g.player.dead,true);assert.equal(g.succession133.remains().length,1);assert.deepEqual(g.resources,stock);assert.equal(g.save(false),true);
});
test('1.33 relève : profil réel, campagne intacte, aucune arme ni munition gratuite',()=>{
 const g=fresh();g.wave=7;const core=g.core(),workers=g.units.map(u=>u.id),stock={...g.resources};kill(g);
 assert.equal(g.succession133.select('inconnu'),false);assert.equal(g.succession133.select('scout'),true);assert.equal(g.player.health,90);assert.equal(g.player.maxHealth,90);assert.equal(g.player.carryCapacity,32);assert.equal(g.wave,7);assert.equal(g.core(),core);assert.deepEqual(g.units.map(u=>u.id),workers);assert.deepEqual(g.resources,stock);
 assert.equal(g.succession133.ownsWeapon('pistol'),false);assert.equal(g.succession133.meleeDamage(),18);g.updateUI();assert.equal(g.ui.weaponName.textContent,'Mains libres');assert.equal(g.loadout.equipment().weapons.find(w=>w.id==='pistol').available,false);g.startReload();g.finishReload();assert.equal(g.player.reload,0);assert.equal(g.player.magazine.pistol,0);assert.equal(g.succession133.select('porter'),false);
 const save=g.serialize();g.restoreSave(save);assert.equal(g.player.maxHealth,90);assert.equal(g.player.carryCapacity,32);assert.equal(g.player.magazine.pistol,0);
});
test('1.33 réquisition au dépôt : arme vide payée, palier et stock exigés',()=>{
 const g=fresh();kill(g);g.succession133.select('porter');const scrap=g.resources.scrap,ammo=g.resources.ammo;
 assert.equal(g.succession133.requisition('rifle'),false);assert.equal(g.succession133.requisition('pistol'),true);assert.equal(g.resources.scrap,scrap-8);assert.equal(g.resources.ammo,ammo);assert.equal(g.player.magazine.pistol,0);assert.equal(g.succession133.requisition('pistol'),false);
 g.startReload();assert.ok(g.player.reload>0);g.player.reload=0;g.finishReload();assert.equal(g.player.magazine.pistol,12);assert.ok(g.resources.ammo<ammo);
});
test('1.33 récupération partielle : reliquat persistant et armes déjà possédées conservées',()=>{
 const g=fresh();g.player.carry.wood=36;const r=kill(g);g.succession133.select('scout');assert.equal(g.succession133.requisition('pistol'),true);Object.assign(g.player,{x:r.point.x,y:r.point.y});
 assert.equal(g.succession133.loot(r.id),true);assert.equal(g.player.carry.wood,32);const left=g.succession133.remains()[0];assert.equal(left.bag.wood,4);assert.deepEqual(left.weapons,['pistol']);assert.equal(g.player.magazine.pistol,12);assert.equal(g.succession133.loot(r.id),false);g.player.carry.wood=0;assert.equal(g.succession133.loot(r.id),true);assert.equal(g.player.carry.wood,4);assert.equal(g.succession133.remains()[0].bag.wood,0);assert.equal(g.succession133.remains().length,1);
});
test('1.33 préparations personnelles : protection, outils, réserve et entretien restent dans le sac',()=>{
 const g=fresh(),gear={version:1,armor:15,reserve:22,tools:12,care:{pistol:4,rifle:2,shotgun:0}};g.expansions.get('player131').restore(gear);g.player.health=0;g.player.dead=true;g.succession133.captureDeath();assert.deepEqual(g.succession133.remains()[0].gear,gear);assert.equal(g.playerOps131.snapshot().reserve,0);
 const r=g.succession133.remains()[0];g.succession133.select('porter');Object.assign(g.player,{x:r.point.x,y:r.point.y});assert.equal(g.succession133.loot(r.id),true);assert.deepEqual(g.playerOps131.snapshot(),gear);assert.equal(g.succession133.remains()[0].gear.reserve,0);
});
test('1.33 mort régionale en étage : localisation capturée avant évacuation et étage imposé au sac',()=>{
 const g=fresh(),p=upstairs(g);g.player.carry.food=8;g.player.invulnerable=0;g.frontier.damage(1000);const r=g.succession133.remains()[0];assert.deepEqual(r.point,{domain:'region',...p,angle:0});assert.equal(g.frontier.active(),false);assert.equal(g.lastSaveStatus.ok,true);assert.equal(g.succession133.select('builder'),true);assert.equal(g.succession133.loot(r.id),false);
 pose(g,p,{z:0,inside:null});assert.equal(g.succession133.loot(r.id),false);pose(g,p,{z:1,inside:p.inside});assert.equal(g.succession133.nearestRemains()?.id,r.id);
});
test('1.33 sauvegarde invalidée avant mutation : étage absent, stock négatif et doublon',()=>{
 const g=fresh();kill(g);const good=g.serialize(),before=g.world,carried=clone(g.succession133.snapshot());
 for(const mutate of [d=>d.succession133.remains[0].bag.wood=-1,d=>d.succession133.remains.push(clone(d.succession133.remains[0])),d=>{d.succession133.remains[0].point.z=1;},d=>{d.player.carry.wood=1;}]){const bad=clone(good);mutate(bad);assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,before);assert.deepEqual(g.succession133.snapshot(),carried);}
 g.restoreSave(good);assert.equal(g.succession133.pending(),true);assert.equal(g.player.dead,true);assert.equal(g.paused,true);
});
test('1.33 migration de sauvegarde ancienne : décès enregistré une fois, inventaire intégral conservé',()=>{
 const g=fresh(),old=g.serialize();delete old.succession133;old.player.health=0;old.player.dead=true;old.player.carry.stone=9;g.restoreSave(old);assert.equal(g.succession133.pending(),true);assert.equal(g.succession133.remains()[0].bag.stone,9);assert.equal(g.succession133.remains()[0].magazine.pistol,12);assert.equal(g.save(false),true);
});
test('1.33 réanimation locale : zombie réel, conservation au chargement et neutralisation unique',()=>{
 const g=fresh();g.player.carry.food=7;kill(g);g.succession133.select('porter');const r=riseNext(g);assert.equal(r.body.phase,'risen');const z=g.zombies.find(z=>z.id===r.body.zombieId);assert.ok(z);assert.equal(z.x,r.point.x);assert.equal(z.y,r.point.y);const save=g.serialize();g.restoreSave(save);assert.equal(g.succession133.remains()[0].body.zombieId,z.id);assert.equal(g.zombies.filter(q=>q.id===z.id).length,1);const loaded=g.zombies.find(q=>q.id===z.id);loaded.health=0;g.killZombie(loaded,false);g.succession133.step(.1);assert.equal(g.succession133.remains()[0].body.phase,'neutralized');assert.equal(g.succession133.remains()[0].bag.food,7);g.restoreSave(g.serialize());g.succession133.step(.1);assert.equal(g.succession133.remains()[0].body.phase,'neutralized');
});
test('1.33 réanimation régionale : contacts d’étage et neutralisation conservent le sac',()=>{
 const g=fresh(),p=upstairs(g);g.player.carry.wood=5;g.player.invulnerable=0;g.frontier.damage(1000);g.succession133.select('porter');riseNext(g,'region');const r=g.succession133.remains()[0];assert.equal(r.body.phase,'risen');assert.equal(g.succession133.hit(p.x,p.y,100,0,null),false);assert.equal(g.succession133.hit(p.x,p.y,100,1,p.inside),true);assert.equal(g.succession133.contacts().length,0);assert.equal(g.succession133.remains()[0].body.phase,'neutralized');assert.equal(g.succession133.remains()[0].bag.wood,5);assert.equal(g.succession133.hit(p.x,p.y,100,1,p.inside),false);assert.equal(g.save(false),true);
});
test('1.33 temps et profondeur : pause gèle le risque, sac et dépouille entrent dans les files réelles',()=>{
 const g=fresh();kill(g);const before=g.succession133.snapshot();g.succession133.step(30);assert.deepEqual(g.succession133.snapshot(),before);const r=g.succession133.remains()[0],view={l:0,r:4096,t:0,b:4096};const entries=g.succession133.depthEntries('local',null,view);assert.equal(entries.length,2);assert.ok(g.depthEntries(view).some(e=>e.entity?.__fallenDraw));const c=trace();entries.forEach(e=>e.draw(c));assert.ok(c.calls.some(v=>v[0]==='fillRect'));g.succession133.select('scout');g.startNew('standard','18');assert.equal(g.succession133.remains().length,0);assert.equal(g.succession133.pending(),false);assert.equal(g.player.health,100);assert.equal(g.player.carryCapacity,36);assert.equal(g.succession133.ownsWeapon('pistol'),true);
});

test('1.33 ceinture partagée et éclairage : kits au sac, lampe posée à la mort, aucune duplication',()=>{
 const g=fresh(),data=g.serialize(),target=g.essentials.targets().find(t=>t.family==='aid');data.essentials.jobs[target.id]={stage:'delivered'};data.frontier.seen.push(target.poi);data.essentials.belt.aid=2;
 const type=DeadwallCore.NightGearRules.types.torch;data.nightGear={version:1,serial:2,devices:[{id:1,kind:'torch',location:'belt',left:type.duration,on:false,used:false}]};g.restoreSave(data);const r=kill(g);assert.equal(r.kits.aid,2);assert.equal(g.essentials.snapshot().belt.aid,0);const light=g.nightGear.snapshot().devices[0];assert.equal(light.location,'placed');assert.equal(light.x,r.point.x);assert.equal(light.y,r.point.y);assert.equal(g.lastSaveStatus.ok,true);
 g.succession133.select('porter');Object.assign(g.player,{x:r.point.x,y:r.point.y});assert.equal(g.succession133.loot(r.id),true);assert.equal(g.essentials.snapshot().belt.aid,2);assert.equal(g.succession133.remains()[0].kits.aid,0);assert.equal(g.nightGear.snapshot().devices[0].location,'placed');assert.equal(g.save(false),true);
});
test('1.33 décès avec seau et effets personnels : nettoyage immédiat malgré la pause de relève',()=>{
 const g=fresh(),data=g.serialize();data.siege.playerWater=5;data.expansions127.modules.survival.meal={left:20,budget:5};data.expansions127.modules.survival.dressing={left:15,remaining:5};g.restoreSave(data);kill(g);assert.equal(g.paused,true);assert.equal(g.siege.snapshot().playerWater,0);assert.equal(g.survivalPack.snapshot().meal.left,0);assert.equal(g.survivalPack.snapshot().dressing.left,0);assert.equal(g.save(false),true);g.succession133.select('scout');assert.equal(g.siege.snapshot().playerWater,0);
});
test('1.33 le relevé lointain ou hors étage ne produit aucune alerte omnisciente',()=>{
 const g=fresh(),p=upstairs(g);g.player.invulnerable=0;g.frontier.damage(1000);g.succession133.select('scout');const messages=[],notify=g.notify;g.notify=t=>messages.push(t);riseNext(g,'region');g.notify=notify;assert.equal(g.succession133.remains()[0].body.phase,'risen');assert.equal(messages.some(t=>t.includes('s’est relevée')),false);
});
