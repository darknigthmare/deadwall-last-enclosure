'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function start(){g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.invulnerable=0;}
function advanceUntil(done,limit=1000){for(let i=0;i<limit&&!done();i++)g.update(.04);assert.equal(done(),true,'La simulation termine l’action engagée.');}
function reloadButton(){const b=doc.body.querySelectorAll('button').find(b=>b.dataset.gameCommand==='reload');assert.ok(b&&doc.body.contains(b),'Commande tactile du HTML livré.');b.click();}
function generator(){
 const core=g.core();
 for(let r=4;r<22;r+=2)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){
  const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.generator,gx,gy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'generator',gx,gy,0,1);b.health=350;g.world.add(b);g.refreshMetrics(true);
  const p=g.fieldcraft.service(g.player,b);assert.ok(p,'Groupe préparé avec accès extérieur réel.');Object.assign(g.player,p);return b;
 }
 throw Error('Aucun emplacement physique de groupe disponible.');
}
function take(key,amount){const q=g.loadout.transfer('depot','sac',key,amount);assert.ok(q.ok,q.reason);assert.equal(q.amount,amount);}
function solveGenerator(){
 for(let i=0;i<12&&g.interventions134.busy();i++){
  const s=g.interventions134.view().session;assert.ok(g.interventions134.act('adjust',s.target).ok);assert.ok(g.interventions134.act('confirm').ok);
 }
 assert.equal(g.interventions134.busy(),false);
}
function finishWork(){for(let i=0;i<1000&&g.arsenal134.busy();i++)g.arsenal134.step(.04);assert.equal(g.arsenal134.busy(),false);}
function craft(id){const before={...g.resources},q=g.arsenal134.preview('craft',id);assert.ok(q.ok,q.reason);assert.ok(g.arsenal134.begin('craft',id).ok);finishWork();for(const[k,v]of Object.entries(q.cost))assert.equal(g.resources[k],before[k]-v);const i=g.arsenal134.snapshot().locker.find(i=>i.id===id);assert.ok(i);assert.equal(i.rounds,0);assert.ok(g.arsenal134.transfer(i.uid,'carried').ok);assert.ok(g.arsenal134.equip(i.uid).ok);return i;}

test('138 : le bouton de recharge respecte une intervention payée et reste utilisable après son terme',()=>{
 start();g.shootPlayer();assert.equal(g.player.magazine.pistol,11);take('scrap',6);take('ammo',1);const b=generator();
 assert.ok(g.interventions134.begin('local:'+b.id).ok);assert.equal(g.player.carry.scrap,0);
 const rounds=g.player.magazine.pistol,ammo=g.player.carry.ammo,state=g.arsenal134.snapshot();
 reloadButton();assert.equal(g.player.reload,0,'Le bouton tactile ne lance pas une recharge pendant le mini-jeu.');
 assert.equal(g.interventions134.busy(),true,'Le refus préserve la tentative déjà payée.');assert.equal(g.player.magazine.pistol,rounds);assert.equal(g.player.carry.ammo,ammo);assert.deepEqual(g.arsenal134.snapshot(),state);
 solveGenerator();assert.equal(b.health,550);reloadButton();assert.ok(g.player.reload>0,'Recharge autorisée après les mains libérées.');
 const saved=g.serialize();assert.equal(g.restoreSave(saved),true);advanceUntil(()=>g.player.reload===0);
 assert.equal(g.player.magazine.pistol,12);assert.equal(g.player.carry.ammo,0);assert.equal(g.player.carry.scrap,0);assert.equal(g.world.buildings.get(b.id).health,550);assert.equal(g.save(false),true);
});

test('138 : pause et modale ne lancent aucune recharge ; la fenêtre de recharge active est conservée',()=>{
 start();g.shootPlayer();const rounds=g.player.magazine.pistol,ammo=g.resources.ammo;
 g.togglePause(true);g.startReload();assert.equal(g.player.reload,0);g.togglePause(false);
 assert.ok(g.arsenalUI134.open());g.startReload();assert.equal(g.player.reload,0);g.arsenalUI134.close();
 reloadButton();assert.ok(g.player.reload>0);const total=g.player.reloadTotal;
 advanceUntil(()=>1-g.player.reload/total>=.54);assert.ok(1-g.player.reload/total<.60);
 reloadButton();assert.equal(g.player.reload,.04,'La seconde pression dans la fenêtre parfaite fonctionne encore.');
 assert.equal(g.player.magazine.pistol,rounds);assert.equal(g.resources.ammo,ammo);
 advanceUntil(()=>g.player.reload===0);assert.equal(g.player.magazine.pistol,12);assert.equal(g.resources.ammo,ammo-1);
});

test('138 : arme à deux coups, entretien et reprise gardent cartouches, coût et cadence entre D-17 et la région',()=>{
 start();const item=craft('doubleBarrel'),d=C.Arsenal134Rules.catalog.doubleBarrel,stock=g.resources.ammo;
 reloadButton();advanceUntil(()=>g.player.reload===0);assert.equal(g.player.magazine.shotgun,2);assert.equal(g.resources.ammo,stock-2*d.ammoPerReload);
 advanceUntil(()=>g.player.shootCooldown===0);g.shootPlayer();assert.equal(g.player.magazine.shotgun,1);assert.equal(g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid).condition,100-d.wear);
 const shots=g.stats.shots;g.shootPlayer();assert.equal(g.stats.shots,shots,'Un second appel immédiat ne contourne pas la cadence.');
 const scrap=g.resources.scrap,q=g.arsenal134.preview('repair',item.id);assert.ok(q.ok,q.reason);assert.ok(g.arsenal134.begin('repair',item.id,item.uid).ok);finishWork();
 assert.equal(g.resources.scrap,scrap-q.cost.scrap);assert.deepEqual(g.arsenal134.snapshot().carried.find(i=>i.uid===item.uid),{...item,condition:100,rounds:1});
 const pistol=g.arsenal134.snapshot().carried.find(i=>i.id==='pistol');assert.ok(g.arsenal134.equip(pistol.uid).ok);assert.equal(g.player.magazine.pistol,12);assert.ok(g.arsenal134.equip(item.uid).ok);assert.equal(g.player.magazine.shotgun,1);
 take('ammo',3);assert.ok(g.friendlyPositionClear(g.player,4058,2048));Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);
 const region=g.frontier.position();assert.equal(g.frontier.world().blocked(region.x,region.y,C.Frontier.RULES.footRadius,0,null),false,'Arrivée régionale accessible.');
 const depot=g.resources.ammo;reloadButton();assert.ok(g.player.reload>0);assert.equal(g.arsenal134.equip(pistol.uid).ok,false);assert.equal(g.restoreSave(g.serialize()),true);
 advanceUntil(()=>g.player.reload===0);assert.equal(g.player.magazine.shotgun,2);assert.equal(g.player.carry.ammo,1);assert.equal(g.resources.ammo,depot,'Aucun prélèvement distant au dépôt.');
 advanceUntil(()=>g.player.shootCooldown===0);assert.equal(g.frontier.shoot(),true);assert.equal(g.frontier.shoot(),false);advanceUntil(()=>g.player.shootCooldown===0);assert.equal(g.frontier.shoot(),true);
 reloadButton();assert.equal(g.player.reload,0,'Une unité restante ne forme pas une cartouche coûtant deux unités.');assert.equal(g.player.magazine.shotgun,0);
 const final=g.arsenal134.snapshot();assert.ok(Math.abs(final.carried.find(i=>i.uid===item.uid).condition-(100-2*d.wear))<1e-7);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(g.arsenal134.snapshot(),final);assert.equal(g.player.carry.ammo,1);assert.equal(g.resources.ammo,depot);
});
