'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.DEADWALL_QA_ROOT||path.resolve(__dirname,'..');
const {bootDocument134}=require(path.join(root,'scripts/qa-startup134.cjs'));
let env,C;
test.before(()=>{env=bootDocument134();C=globalThis.DeadwallCore;});
function start(){const {g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;g.player.carry=C.makeBag({wood:24,scrap:12,medicine:4,food:6,fuel:8,ammo:20});return env;}
function button(doc,id){const b=doc.getElementById(id);assert.ok(doc.body.contains(b),'Commande réellement montée : '+id);return b;}
function click(doc,id){const b=button(doc,id);assert.equal(b.disabled,false,id+' disponible');b.click();}
function panel(g){assert.equal(g.expansionUI.open('survival'),true);}
function finish(g,seconds){for(let i=0;i<Math.round(seconds/.04);i++)g.survivalPack.step(.04);}
function towerAtDepot(g,needsCamp=false){
 const core=g.core();
 for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){
  if(!g.world.placement(C.BUILDINGS.watchtower,core.gx+dx,core.gy+dy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'watchtower',core.gx+dx,core.gy+dy,0,1);g.world.add(b);
  const p=g.fieldcraft.service(g.player,b);
  if(p){Object.assign(g.player,p);if(g.loadout.atHome()){
   let clear=!needsCamp;
   for(let i=0;needsCamp&&i<48&&!clear;i++){g.player.facing=i*Math.PI/24;clear=g.survivalPack.preview('camp').ok;}
   if(clear){g.refreshMetrics(true);assert.equal(g.fieldcraft.control(b),true);assert.equal(g.fieldcraft.control(),true);return b;}
  }}
  g.world.remove(b);
 }
 throw Error('Aucun mirador préparé avec un vrai accès commun au dépôt'+(needsCamp?' et au bivouac':''));
}
function installCamp(g,doc){panel(g);click(doc,'expansionAction-survival-camp');assert.equal(g.activeOverlay,null);const before={...g.player.carry};finish(g,C.SurvivalPackRules.camp.seconds);assert.equal(g.survivalPack.busy(),false);assert.equal(g.survivalPack.snapshot().camps.length,1);assert.equal(g.player.carry.wood,before.wood-12);assert.equal(g.player.carry.scrap,before.scrap-6);}
function reload(g,doc){g.player.magazine.pistol=0;const b=doc.body.querySelectorAll('button').find(b=>b.dataset.gameCommand==='reload');assert.ok(b&&doc.body.contains(b),'Commande réelle de rechargement');b.click();assert.ok(g.player.reload>0);}
function releaseReload(g){for(let i=0;i<100&&g.player.reload>0;i++)g.updatePlayer(.04);assert.equal(g.player.reload,0);}

test('140 HTML : le pansement refuse le vrai poste manuel et le bouton préparé avant sa prise, puis paie seulement à la pose',()=>{
 const {g,doc}=start(),tower=towerAtDepot(g);g.player.health=50;panel(g);const id='expansionAction-survival-dressing';assert.equal(button(doc,id).disabled,false);assert.equal(g.fieldcraft.control(tower),true);
 const before=g.survivalPack.snapshot(),bag={...g.player.carry};button(doc,id).click();assert.equal(g.survivalPack.busy(),false,'Une commande ancienne ne prépare pas de pansement derrière le mirador');assert.deepEqual(g.survivalPack.snapshot(),before);assert.deepEqual(g.player.carry,bag);assert.equal(g.player.health,50);assert.equal(g.fieldcraft.context().mounted,tower.id);assert.equal(button(doc,id).disabled,true);assert.equal(g.survivalPack.begin('dressing').ok,false);
 assert.equal(g.fieldcraft.control(),true);g.expansionUI.refresh(true);click(doc,id);finish(g,4.96);assert.equal(g.survivalPack.busy(),true);assert.deepEqual(g.player.carry,bag);assert.equal(g.player.health,50);finish(g,.04);assert.equal(g.survivalPack.busy(),false);assert.equal(g.player.carry.medicine,bag.medicine-2);assert.equal(g.survivalPack.snapshot().dressing.remaining,18);
 assert.equal(g.fieldcraft.control(tower),true);finish(g,5);assert.ok(Math.abs(g.player.health-53)<1e-6,'Le soin déjà posé reste progressif pendant le contrôle du poste');assert.equal(g.player.carry.medicine,bag.medicine-2);const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.survivalPack.snapshot(),saved.expansions127.modules.survival);assert.equal(g.player.carry.medicine,bag.medicine-2);
});

test('140 HTML : le panneau ouvert depuis le poste ne peut finir ni payer un pansement pendant les cinq secondes de simulation',()=>{
 const {g,doc}=start(),tower=towerAtDepot(g);g.player.health=50;assert.equal(g.fieldcraft.control(tower),true);panel(g);const id='expansionAction-survival-dressing',enabled=!button(doc,id).disabled,bag={...g.player.carry};button(doc,id).click();g.expansionUI.close();finish(g,5);assert.deepEqual(g.player.carry,bag,'Aucun pansement ne doit être payé pendant le contrôle manuel');assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});assert.equal(g.survivalPack.busy(),false);assert.equal(enabled,false);assert.equal(g.player.health,50);assert.equal(g.fieldcraft.context().mounted,tower.id);
});

test('140 HTML : une vraie recharge refuse immédiatement la préparation sans tâche fugitive, puis le même pansement devient disponible',()=>{
 const {g,doc}=start();towerAtDepot(g);g.player.health=50;reload(g,doc);panel(g);const id='expansionAction-survival-dressing',bag={...g.player.carry};assert.equal(button(doc,id).disabled,true);button(doc,id).click();assert.equal(g.survivalPack.begin('dressing').ok,false);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});g.expansionUI.close();releaseReload(g);panel(g);click(doc,id);const paid={...g.player.carry};finish(g,5);assert.equal(g.player.carry.medicine,paid.medicine-2);assert.equal(g.survivalPack.snapshot().dressing.remaining,18);
});

test('140 HTML : démonter la vraie halte attend la libération du poste et la fin de recharge sans déplacer ni rembourser le camp',()=>{
 const {g,doc}=start(),tower=towerAtDepot(g,true);installCamp(g,doc);panel(g);const id='expansionAction-survival-dismantle';assert.equal(button(doc,id).disabled,false);const camp=g.survivalPack.snapshot(),bag={...g.player.carry};assert.equal(g.fieldcraft.control(tower),true);button(doc,id).click();assert.deepEqual(g.survivalPack.snapshot(),camp);assert.deepEqual(g.player.carry,bag);assert.equal(g.fieldcraft.context().mounted,tower.id);assert.equal(button(doc,id).disabled,true);assert.equal(g.survivalPack.dismantle().ok,false);
 assert.equal(g.fieldcraft.control(),true);g.expansionUI.close();reload(g,doc);panel(g);assert.equal(button(doc,id).disabled,true);button(doc,id).click();assert.equal(g.survivalPack.dismantle().ok,false);assert.deepEqual(g.survivalPack.snapshot(),camp);assert.deepEqual(g.player.carry,bag);g.expansionUI.close();releaseReload(g);panel(g);const afterReload={...g.player.carry};click(doc,id);assert.equal(g.survivalPack.snapshot().camps.length,0);assert.deepEqual(g.player.carry,afterReload);assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.equal(g.survivalPack.snapshot().camps.length,0);assert.deepEqual(g.player.carry,afterReload);
});

test('140 HTML : l’entretien itinérant garde son autorisation privée et son paiement final unique malgré le garde de manipulation nocturne',()=>{
 const {g,doc}=start();towerAtDepot(g,true);installCamp(g,doc);g.resources.wood=g.resources.scrap=g.resources.fuel=400;assert.ok(g.nightGear.craft('lantern').ok);for(let i=0;i<100&&g.nightGear.busy();i++)g.nightGear.step(.04);const id=g.nightGear.snapshot().devices[0].id;assert.ok(g.nightGear.transfer(id,'equip').ok);assert.ok(g.nightGear.ignite(id).ok);g.nightGear.step(.1);assert.ok(g.nightGear.ignite(id).ok);const left=g.nightGear.snapshot().devices[0].left,bag={...g.player.carry};assert.ok(left<360);assert.equal(g.nightGear.serviceLantern(id,240),false);
 panel(g);click(doc,'expansionAction-survival-service');finish(g,7.96);assert.equal(g.survivalPack.busy(),true);assert.deepEqual(g.player.carry,bag);assert.equal(g.nightGear.snapshot().devices[0].left,left);assert.equal(g.nightGear.serviceLantern(id,240),false);finish(g,.04);assert.equal(g.survivalPack.busy(),false);assert.equal(g.nightGear.snapshot().devices[0].left,360);assert.equal(g.player.carry.fuel,bag.fuel-4);assert.equal(g.player.carry.scrap,bag.scrap-2);assert.equal(g.survivalPack.authorizeService(id,240),false);assert.equal(g.nightGear.serviceLantern(id,240),false);const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.survivalPack.snapshot(),saved.expansions127.modules.survival);assert.deepEqual(g.nightGear.snapshot(),saved.nightGear);assert.deepEqual(g.player.carry,saved.player.carry);
});
