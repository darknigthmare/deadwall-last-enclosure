'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function start(){const e=bootDocument134();e.g.startNew('standard','17117');e.g.campaignIntro132.skip();return e;}
function button(doc,id){const b=doc.getElementById(id);assert.ok(doc.body.contains(b),id+' réellement monté');return b;}
function click(doc,id){const b=button(doc,id);assert.equal(b.disabled,false,id+' disponible');b.click();}
function sharedGeneratorPost(g){const C=globalThis.DeadwallCore,core=g.core();
 for(let gx=core.gx-8;gx<core.gx+8;gx++)for(let gy=core.gy-8;gy<core.gy+8;gy++){
  if(!g.world.placement(C.BUILDINGS.generator,gx,gy,0).valid)continue;const generator=new(core.constructor)(g.nextId++,'generator',gx,gy,0,1);generator.health=350;g.world.add(generator);g.refreshMetrics(true);
  for(let tx=gx-5;tx<gx+6;tx++)for(let ty=gy-5;ty<gy+6;ty++){
   if(!g.world.placement(C.BUILDINGS.watchtower,tx,ty,0).valid)continue;const tower=new(core.constructor)(g.nextId++,'watchtower',tx,ty,0,1);g.world.add(tower);g.refreshMetrics(true);
   for(let y=Math.min(generator.y,tower.y)-80;y<=Math.max(generator.y,tower.y)+80;y+=8)for(let x=Math.min(generator.x,tower.x)-80;x<=Math.max(generator.x,tower.x)+80;x+=8){
    if(!g.friendlyPositionClear(g.player,x,y))continue;Object.assign(g.player,{x,y});if(g.workerCanWorkAt(g.player,generator,C.InterventionRules134.localReach)&&g.fieldcraft.control(tower)){assert.equal(g.fieldcraft.control(),true);return{generator,tower};}
   }
   g.world.remove(tower);
  }
  g.world.remove(generator);
 }
 throw Error('Aucun accès physique commun au groupe et au mirador');
}
function sharedOpeningPost(g){const C=globalThis.DeadwallCore,B=globalThis.DeadwallBarricades134;
 for(const opening of B.localTargets(g.exploration125.plan))for(const side of[1,-1]){
  const point={x:opening.x-Math.sin(opening.angle)*32*side,y:opening.y+Math.cos(opening.angle)*32*side};if(!g.friendlyPositionClear(g.player,point.x,point.y))continue;Object.assign(g.player,point);if(!g.barricades134.eligibility('build',opening.id,'planks').ok)continue;
  const cx=Math.floor(opening.x/C.TILE),cy=Math.floor(opening.y/C.TILE);
  for(let tx=cx-5;tx<cx+6;tx++)for(let ty=cy-5;ty<cy+6;ty++){
   if(!g.world.placement(C.BUILDINGS.watchtower,tx,ty,0).valid)continue;const tower=new(g.core().constructor)(g.nextId++,'watchtower',tx,ty,0,1);g.world.add(tower);g.refreshMetrics(true);
   if(!B.hitLine(opening,point,tower,.04)&&g.barricades134.eligibility('build',opening.id,'planks').ok&&g.fieldcraft.control(tower)){assert.equal(g.fieldcraft.control(),true);return{opening,tower};}g.world.remove(tower);
  }
 }
 throw Error('Aucun accès physique commun à une ouverture et au mirador');
}
function solveGenerator(g,doc){let steps=0;while(g.interventions134.busy()&&steps++<8){const s=g.interventions134.view().session;for(let i=0;i<s.target;i++)click(doc,'interventions134Right');click(doc,'interventions134Confirm');}assert.equal(g.interventions134.busy(),false);}

test('140 HTML : révision refusée sous contrôle manuel, même pour un bouton préparé avant la prise du poste',()=>{
 const {g,doc}=start(),C=globalThis.DeadwallCore,{generator,tower}=sharedGeneratorPost(g),id='local:'+generator.id;g.player.carry=C.makeBag({scrap:18});
 click(doc,'interventions134Button');const actionId='interventions134Action-work-'+id;assert.equal(button(doc,actionId).disabled,false);assert.equal(g.interventions134.preview(id).ok,true);
 assert.equal(g.fieldcraft.control(tower),true);assert.equal(g.fieldcraft.context().mounted,tower.id);const before=g.interventions134.snapshot(),bag={...g.player.carry};
 button(doc,actionId).click();assert.equal(g.interventions134.busy(),false,'Une ancienne commande ne prend pas les mains de l’opérateur');assert.deepEqual(g.interventions134.snapshot(),before);assert.deepEqual(g.player.carry,bag);assert.equal(generator.health,350);assert.equal(g.fieldcraft.context().mounted,tower.id,'Le refus ne rend pas le poste à la place du joueur');assert.equal(button(doc,actionId).disabled,true);assert.equal(g.interventions134.begin(id).ok,false);
 assert.equal(g.fieldcraft.control(),true);g.interventionsUI134.refresh(true);click(doc,actionId);assert.equal(g.player.carry.scrap,12);solveGenerator(g,doc);assert.equal(generator.health,550);assert.equal(g.interventions134.snapshot().attempts[id],1);assert.equal(g.player.carry.scrap,12);const saved=g.serialize();g.restoreSave(saved);assert.equal(g.world.buildings.get(generator.id).health,550);assert.equal(g.player.carry.scrap,12);
});

test('140 HTML : panneau d’ouvertures refuse pose/réparation/démontage sous contrôle manuel sans débit, puis reprend après libération',()=>{
 const {g,doc}=start(),C=globalThis.DeadwallCore;g.player.carry=C.makeBag({wood:12,scrap:4});const {opening,tower}=sharedOpeningPost(g);assert.equal(g.barricades134.select(opening.id),true);assert.equal(g.fieldcraft.control(tower),true);assert.equal(g.expansionUI.open('barricades134'),true);
 const pose='expansionAction-barricades134-build-planks',before={...g.player.carry};assert.equal(button(doc,pose).disabled,true,'Le panneau reconnaît que les mains servent le mirador');button(doc,pose).click();assert.equal(g.barricades134.busy(),false);assert.equal(g.barricades134.begin('build',opening.id,'planks').ok,false);assert.deepEqual(g.player.carry,before);assert.equal(g.fieldcraft.context().mounted,tower.id);
 assert.equal(g.fieldcraft.control(),true);g.expansionUI.refresh(true);click(doc,pose);assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);assert.equal(g.barricades134.busy(),true);for(let i=0;i<24&&g.barricades134.busy();i++)g.barricades134.step(.25);assert.equal(g.barricades134.busy(),false);assert.equal(g.player.carry.wood,6);assert.equal(g.player.carry.scrap,3);assert.equal(g.barricades134.snapshot().records[0].hp,120);
 g.barricades134.damage(opening.id,20);assert.equal(g.fieldcraft.control(tower),true);assert.equal(g.expansionUI.open('barricades134'),true);assert.equal(button(doc,'expansionAction-barricades134-repair').disabled,true);assert.equal(button(doc,'expansionAction-barricades134-dismantle').disabled,true);const state=g.barricades134.snapshot(),carry={...g.player.carry};assert.equal(g.barricades134.begin('repair',opening.id).ok,false);assert.equal(g.barricades134.begin('dismantle',opening.id).ok,false);assert.deepEqual(g.barricades134.snapshot(),state);assert.deepEqual(g.player.carry,carry);
 assert.equal(g.fieldcraft.control(),true);g.expansionUI.refresh(true);click(doc,'expansionAction-barricades134-repair');for(let i=0;i<24&&g.barricades134.busy();i++)g.barricades134.step(.25);assert.equal(g.barricades134.snapshot().records[0].hp,120);assert.equal(g.player.carry.wood,4);assert.equal(g.player.carry.scrap,2);const saved=g.serialize();g.restoreSave(saved);assert.deepEqual(g.barricades134.snapshot(),saved.expansions127.modules.barricades134);assert.equal(g.player.carry.wood,4);assert.equal(g.player.carry.scrap,2);
});
