'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

function fixture(){
 const env=bootDocument134(),{g,doc}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.setBuildCollapsed(true);g.updateUI();
 // The common simulated DOM permits focus on disabled buttons. Model the
 // native rule for this regression without pretending to render browser CSS.
 const proto=Object.getPrototypeOf(doc.body),focus=proto.focus;
 proto.focus=function(...args){if(this.disabled)return;return focus.apply(this,args);};
 return env;
}
function generator(g,damaged=true){
 const C=globalThis.DeadwallCore,core=g.core();
 for(let r=4;r<22;r+=2)for(const[dx,dy]of[[r,0],[-r,0],[0,r],[0,-r]]){
  const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.generator,gx,gy,0).valid)continue;
  const b=new(core.constructor)(g.nextId++,'generator',gx,gy,0,1);if(damaged)b.health=200;g.world.add(b);g.refreshMetrics(true);
  Object.assign(g.player,g.fieldcraft.service(g.player,b));g.player.carry.scrap=24;return b;
 }
 throw Error('No physical approach for the prepared generator');
}
function openFromHud(g,doc){
 const tools=g.hud135.regions().tools;tools.open=true;tools.dispatch('toggle');
 const launch=doc.getElementById('interventions134Button');launch.focus();launch.click();
 assert.equal(g.interventionsUI134.isOpen(),true);assert.equal(g.paused,false);return launch;
}

test('UI 1.39 : un établi sans action disponible focalise Fermer au lieu d’un bouton désactivé',()=>{
 const {g,doc}=fixture(),b=generator(g,false),before=g.serialize();openFromHud(g,doc);
 const action=doc.getElementById('interventions134Action-work-local:'+b.id);assert.equal(action.disabled,true);
 assert.ok(doc.activeElement===doc.getElementById('interventions134Close'),'Fermer est le contrôle utilisable qui reprend le focus');
 assert.equal(g.interventions134.busy(),false);assert.deepEqual(g.resources,before.resources);assert.deepEqual(g.player.carry,before.player.carry);
 g.onEscape();assert.equal(g.interventionsUI134.isOpen(),false);assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);
});

test('UI 1.39 : une menace qui désactive l’action focalisée rend le clavier à Fermer',()=>{
 const {g,doc}=fixture(),b=generator(g),before={...g.player.carry};openFromHud(g,doc);
 const id='interventions134Action-work-local:'+b.id,action=doc.getElementById(id);assert.equal(action.disabled,false);action.focus();
 g.spawnZombie('walker');const z=g.zombies.at(-1);Object.assign(z,{x:g.player.x+80,y:g.player.y,dead:false});g.rebuildBuckets();
 assert.equal(g.interventions134.preview('local:'+b.id).ok,false);g.interventionsUI134.refresh(true);
 const updated=doc.getElementById(id);assert.notEqual(updated,action);assert.equal(updated.disabled,true);
 assert.ok(doc.activeElement===doc.getElementById('interventions134Close'),'Fermer est le contrôle utilisable qui reprend le focus');assert.ok(doc.body.contains(doc.activeElement));
 assert.equal(g.interventions134.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(b.health,200);
});

test('UI 1.39 : une action encore utilisable et les commandes du mini-jeu conservent leur focus',()=>{
 const {g,doc}=fixture(),b=generator(g);openFromHud(g,doc);const id='interventions134Action-work-local:'+b.id;
 assert.equal(doc.activeElement,doc.getElementById(id));const action=doc.activeElement;action.click();
 assert.equal(g.interventions134.busy(),true);assert.equal(g.player.carry.scrap,18);
 const right=doc.getElementById('interventions134Right');right.focus();const dial=g.interventions134.view().session.dial;right.click();
 assert.equal(g.interventions134.view().session.dial,(dial+1)%g.interventions134.view().session.notches);
 assert.equal(doc.activeElement,doc.getElementById('interventions134Right'));assert.ok(doc.body.contains(doc.activeElement));
 g.onEscape();assert.equal(g.interventions134.busy(),false);assert.equal(g.player.carry.scrap,18);assert.equal(g.paused,false);
});
