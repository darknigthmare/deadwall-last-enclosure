'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {pose}=require('./helpers/navigation130.cjs');
let g,C;
test.before(()=>{({g}=bootDocument134());C=globalThis.DeadwallCore;});
const copy=value=>JSON.parse(JSON.stringify(value));
function snapshot(){const data=g.serialize();delete data.timestamp;return data;}
function step(seconds){for(let left=seconds;left>1e-7;left-=.04)g.survivalPack.step(Math.min(.04,left));}
function openPoint(origin,z,inside,{blockedLine=false,min=1.8,max=8}={}){
 const w=g.frontier.world();
 for(let r=min;r<=max;r+=.3)for(let a=0;a<Math.PI*2;a+=.12){const p={x:origin.x+Math.cos(a)*r,y:origin.y+Math.sin(a)*r};
  if(!w.blocked(p.x,p.y,C.FrontierTacticsRules.enemyRadius,z,inside)&&w.line(origin,p,z,inside,null,.015)!==blockedLine)return p;
 }
 throw Error('A physical point on the required side of the wall must exist.');
}
// The fall is produced by the existing damage/death/succession controllers.
// Only the saved reanimation roll/countdown is shortened to select that existing
// outcome; position fixtures use real free floor geometry and restoreSave.
function fallen({waiting=false}={}){
 g.startNew('standard','903145');g.campaignIntro132.skip();g.phaseTime=999;
 const w=g.frontier.world(),poi=w.pois.find(p=>p.levels.includes(1)),stair=w.plan(poi,1).stairs[0],point=DeadwallFrontierGeometry.global(poi,stair.x+stair.w/2,stair.y+stair.h/2);
 assert.equal(w.blocked(point.x,point.y,C.FrontierTacticsRules.enemyRadius,1,poi.id),false);
 pose(g,point,{z:1,inside:poi.id});g.player.invulnerable=0;g.frontier.damage(1000);assert.equal(g.succession133.select('porter'),true);
 Object.assign(g.player,{x:g.core().x+80,y:g.core().y});assert.equal(g.friendlyPositionClear(g.player,g.player.x,g.player.y),true);
 assert.equal(g.workerCanWorkAt(g.player,g.core(),125),true);assert.equal(g.loadout.transfer('depot','sac','medicine',2).amount,2);
 const save=g.serialize(),r=save.succession133.remains.at(-1);r.body.phase='waiting';r.body.roll=0;r.body.left=waiting ? .15 : .01;g.restoreSave(save);
 if(!waiting)g.succession133.step(.1);
 const near=openPoint(point,1,poi.id,{max:2.4});pose(g,near,{z:1,inside:poi.id});g.player.invulnerable=0;g.frontier.damage(30);
 return {poi,point,near,id:r.id};
}
test('1.45 survie : un commandant réanimé accessible bloque la préparation sans toucher au sac, au dépôt ou à la sauvegarde',()=>{
 const {point,poi}=fallen(),contact=g.succession133.contacts()[0],before=snapshot();
 assert.equal(contact.hp,65);assert.equal(contact.poi,poi.id);assert.equal(g.frontier.visibleEnemy(contact),true);
 assert.ok(Math.hypot(contact.x-g.frontier.position().x,contact.y-g.frontier.position().y)<C.SurvivalPackRules.safeRadius);
 assert.equal(g.fieldSupplies.preview('heal').ok,false);
 assert.equal(g.survivalPack.preview('dressing').ok,false);assert.equal(g.survivalPack.begin('dressing').ok,false);
 assert.match(g.survivalPack.overview().summary,/Sécurisez les abords/);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(snapshot(),before);
 assert.equal(g.succession133.hit(point.x,point.y,100,1,poi.id,contact.id),true);
 assert.equal(g.succession133.contacts().length,0);assert.equal(g.survivalPack.preview('dressing').ok,true);
});
test('1.45 survie : une réanimation réelle pendant la pose annule le travail sans dépense ni soin',()=>{
 fallen({waiting:true});assert.equal(g.succession133.contacts().length,0);const bag=copy(g.player.carry),stock=copy(g.resources),health=g.player.health;
 assert.equal(g.survivalPack.begin('dressing').ok,true);step(.1);assert.ok(g.survivalPack.overview().task.progress>0);
 g.succession133.step(.1);g.succession133.step(.1);assert.equal(g.succession133.contacts().length,1);assert.equal(g.player.health,health);
 step(.04);assert.equal(g.survivalPack.busy(),false);assert.match(g.survivalPack.overview().summary,/Sécurisez les abords/);
 assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);assert.equal(g.player.health,health);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});
 assert.equal(DeadwallSave.validate(g.serialize()).version,20);g.restoreSave(g.serialize());assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,bag);
});
test('1.45 survie : un contact derrière une vraie cloison ou sur un autre étage ne bloque pas un pansement',()=>{
 const {point,poi}=fallen(),behind=openPoint(point,1,poi.id,{blockedLine:true,min:2,max:9});pose(g,behind,{z:1,inside:poi.id});
 const contact=g.succession133.contacts()[0];assert.equal(g.frontier.visibleEnemy(contact),false);assert.ok(Math.hypot(contact.x-behind.x,contact.y-behind.y)<C.SurvivalPackRules.safeRadius);
 assert.equal(g.fieldSupplies.preview('heal').ok,true);assert.equal(g.survivalPack.preview('dressing').ok,true);
 const ground=openPoint(point,0,null,{min:1.8,max:5});pose(g,ground,{z:0,inside:poi.id});assert.equal(g.frontier.position().z,0);
 assert.equal(g.survivalPack.preview('dressing').ok,true);assert.equal(g.succession133.contacts()[0].z,1);
});
test('1.45 survie : neutraliser la menace permet le soin payé, conservé au chargement sans nouveau coût',()=>{
 const {point,poi}=fallen(),contact=g.succession133.contacts()[0];assert.equal(g.succession133.hit(point.x,point.y,100,1,poi.id,contact.id),true);
 const bag=copy(g.player.carry),stock=copy(g.resources),health=g.player.health;assert.equal(g.survivalPack.begin('dressing').ok,true);step(C.SurvivalPackRules.dressing.seconds);
 assert.equal(g.player.carry.medicine,bag.medicine-C.SurvivalPackRules.dressing.cost.medicine);assert.equal(g.player.health,health);assert.deepEqual(g.resources,stock);
 const paid=copy(g.survivalPack.snapshot());assert.equal(paid.dressing.remaining,C.SurvivalPackRules.dressing.heal);const save=g.serialize();assert.equal(DeadwallSave.validate(save).version,20);g.restoreSave(save);
 assert.deepEqual(g.survivalPack.snapshot(),paid);assert.equal(g.succession133.contacts().length,0);assert.equal(g.survivalPack.busy(),false);
 step(C.SurvivalPackRules.dressing.duration);assert.ok(Math.abs(g.player.health-health-C.SurvivalPackRules.dressing.heal)<1e-6);assert.equal(g.player.carry.medicine,0);assert.deepEqual(g.resources,stock);assert.equal(g.save(false),true);
});
test('1.45 survie : un groupe régional migré sans contacts matérialisés annule la pose dès son premier tick, sans dépense',()=>{
 g.startNew('standard','903145');g.campaignIntro132.skip();g.phaseTime=999;Object.assign(g.player,{x:g.core().x+80,y:g.core().y});
 assert.equal(g.loadout.transfer('depot','sac','medicine',2).amount,2);g.player.invulnerable=0;g.damagePlayer(30);
 const w=g.frontier.world(),road=w.roads.find(r=>{const p={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2};return!w.blocked(p.x,p.y,.4,0,null)&&!w.blocked(p.x+3,p.y,.4,0,null);});assert.ok(road);
 const point={x:(road.a.x+road.b.x)/2,y:(road.a.y+road.b.y)/2},save=g.serialize();
 Object.assign(save.frontier,{active:true,anchor:{x:g.player.x,y:g.player.y},...point,z:0,inside:null});
 // Existing migration accepts a group whose individual saved contacts have not
 // yet been streamed. Its normal update must establish the physical danger.
 save.worldEvolution.groups=[{id:'W0000',kind:'resting',count:80,lost:0,wound:0,x:point.x+3,y:point.y,a:0,seen:false,contacts:{}}];save.worldEvolution.serial=1;
 g.restoreSave(save);const bag=copy(g.player.carry),stock=copy(g.resources),health=g.player.health;
 assert.equal(g.worldEvolution.groupMembers().length,0);assert.equal(g.survivalPack.begin('dressing').ok,true);g.update(.04);
 assert.equal(g.worldEvolution.groupMembers().length,80);assert.equal(g.survivalPack.busy(),false);assert.match(g.survivalPack.overview().summary,/Sécurisez les abords/);
 assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stock);assert.equal(g.player.health,health);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});
 assert.equal(g.survivalPack.preview('dressing').ok,false);assert.equal(DeadwallSave.validate(g.serialize()).version,20);
});
