'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');
const {serviceFixture208,stepSupport208:step,checkpoint208:checkpoint,copy}=require('./helpers/campaign-services208.cjs');
const start=f=>f.g.survivalPack.beginAtSupport(f.support.action,f.site.id,f.support.supportId,f.support.action==='service'?f.lanternId:undefined);

for(const action of ['meal','restSheltered','service'])test('208 actual '+action+' support pays the finite bag once through its existing survival effect owner',()=>{
 const f=serviceFixture208(action),{g,quote,before}=f,rule=C.SurvivalPackRules[action];
 const expected={...rule.cost};if(action==='meal')expected.fuel=1;
 assert.deepEqual(quote.cost,expected);assert.equal(quote.seconds,rule.seconds);assert.equal(g.survivalPack.presentationSupport(),null);
 const button=g.survivalPack.actions().find(a=>a.id==='support208-'+action+'-'+f.site.id+'-'+f.support.supportId.split(':').at(-1));assert.ok(button);assert.equal(button.disabled,false,button.reason);
 assert.equal(button.run().ok,true);assert.equal(g.survivalPack.presentationSupport(),null);step(g,rule.seconds-.1);assert.deepEqual(g.player.carry,before.player.carry);
 const view=g.survivalPack.presentationSupport();assert.ok(view?.elapsed>0);assert.equal(view.siteId,f.site.id);assert.equal(view.supportId,f.support.supportId);assert.equal(view.action,action);assert.equal(view.fullKey,f.site.id+':208:'+f.support.supportId.split(':').at(-1)+':'+action);
 step(g,.1);for(const k of C.RESOURCE_KEYS)assert.ok(Math.abs(g.player.carry[k]-before.player.carry[k]+(expected[k]||0))<1e-7,k);
 assert.deepEqual(g.resources,before.resources);assert.deepEqual(g.survivalPack.snapshot().camps,[]);assert.equal(g.survivalPack.busy(),false);assert.equal(g.survivalPack.presentationSupport(),null);
 if(action==='meal')assert.deepEqual(g.survivalPack.snapshot().meal,{left:rule.duration,budget:rule.budget});
 if(action==='restSheltered')assert.equal(g.player.health,before.player.health+rule.heal);
 if(action==='service')assert.equal(g.nightGear.snapshot().devices[0].left,Math.min(C.NightGearRules.types.lantern.duration,100+rule.amount));
 const paid={...g.player.carry};step(g,rule.seconds*2);assert.deepEqual(g.player.carry,paid,'An ended service cannot charge again');
});

test('208 partial and completed services preserve existing save owners and cancel transient work on Save/Menu/Continue',()=>{
 const f=serviceFixture208('meal'),{g}=f,before={...g.player.carry};assert.equal(start(f).ok,true);step(g,.3);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.equal(g.survivalPack.busy(),false);assert.equal(g.survivalPack.presentationSupport(),null);assert.deepEqual(g.player.carry,before);assert.deepEqual(g.survivalPack.snapshot().meal,{left:0,budget:0});
 assert.equal(start(f).ok,true);step(g,C.SurvivalPackRules.meal.seconds);const paid=checkpoint(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),paid);
 assert.equal(g.survivalPack.beginAtSupport('meal',f.site.id,f.support.supportId).ok,false);assert.deepEqual(g.survivalPack.snapshot().camps,[]);
});

test('208 source, movement, damage, combat, resources and live physical changes interrupt before any payment',()=>{
 const f=serviceFixture208('meal'),{g}=f,saved=checkpoint(g);
 for(const interruption of ['movement','damage','reload','shots','source','fuel','destroyed','movement-reader','world']){
  assert.equal(g.restoreSave(copy(saved)),true);g.input.keys.clear();g.input.pressed.clear();const before={...g.player.carry};assert.equal(start(f).ok,true);step(g,.2);
  const frontier=g.frontier,evolution=g.worldEvolution,world=g.world;
  if(interruption==='movement'){g.input.keys.add('KeyD');g.updatePlayer(.1);g.input.keys.clear();}
  if(interruption==='damage')g.player.health--;if(interruption==='reload')g.player.reload=1;if(interruption==='shots')g.stats.shots++;
  if(interruption==='source')g.player.carry=copy(g.player.carry);if(interruption==='fuel')g.player.carry.fuel=0;
  if(interruption==='destroyed')g.worldEvolution={...evolution,structureDestroyed:id=>id===f.site.id||evolution.structureDestroyed(id)};
  if(interruption==='movement-reader'){const blocked={...frontier.world(),movementLine:()=>false};g.frontier=Object.freeze({...frontier,world:()=>blocked});}
  if(interruption==='world')g.world={};
  try{assert.doesNotThrow(()=>step(g,.1));assert.equal(g.survivalPack.busy(),false,interruption);assert.equal(g.survivalPack.presentationSupport(),null);for(const k of C.RESOURCE_KEYS)assert.equal(g.player.carry[k],interruption==='fuel'&&k==='fuel'?0:before[k],interruption+'/'+k);assert.deepEqual(g.resources,saved.resources);}
  finally{g.frontier=frontier;g.worldEvolution=evolution;g.world=world;}
 }
});

test('208 visible danger and the loss of real shelter refuse or cancel paid rest',()=>{
 const f=serviceFixture208('restSheltered'),{g}=f,before={...g.player.carry},frontier=g.frontier;
 const enemy={id:'qa-support-danger208',hp:10,z:0,x:f.support.anchor.x+.1,y:f.support.anchor.y,poi:f.site.id};assert.equal(frontier.visibleEnemy(enemy),true);
 g.frontier=Object.freeze({...frontier,contacts:()=>[enemy]});try{assert.match(g.survivalPack.previewAtSupport('restSheltered',f.site.id,f.support.supportId).reason,/Sécurisez/);assert.equal(start(f).ok,false);}finally{g.frontier=frontier;}
 assert.equal(start(f).ok,true);step(g,.2);const uncovered={...frontier.world(),coveredAt205:()=>false};g.frontier=Object.freeze({...frontier,world:()=>uncovered});
 try{step(g,.1);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.player.health,f.before.player.health);}finally{g.frontier=frontier;}
});

test('208 support presentation is read-only, phase-frozen during pause and absent after cancellation',()=>{
 const f=serviceFixture208('meal'),{g}=f;assert.equal(start(f).ok,true);step(g,.3);const view=g.survivalPack.presentationSupport(),before=checkpoint(g),frontier=g.frontier,night=g.nightGear,random=Math.random;
 assert.equal(Object.isFrozen(view),true);assert.equal(Object.isFrozen(view.anchor),true);assert.equal(Object.isFrozen(view.workTarget),true);
 g.frontier=Object.freeze({...frontier,world:()=>assert.fail('Painter read generated the world'),snapshot:()=>assert.fail('Painter read normalized the region')});g.nightGear={...night,snapshot:()=>assert.fail('Painter read lighting inventory')};Math.random=()=>assert.fail('Painter read consumed RNG');
 try{for(let i=0;i<10;i++)assert.deepEqual(g.survivalPack.presentationSupport(),view);}finally{g.frontier=frontier;g.nightGear=night;Math.random=random;}
 assert.deepEqual(checkpoint(g),before);g.paused=true;step(g,20);assert.deepEqual(g.survivalPack.presentationSupport(),view);
 const evolution=g.worldEvolution;g.worldEvolution={...evolution,structureDestroyed:id=>id===f.site.id||evolution.structureDestroyed(id)};
 try{assert.equal(g.survivalPack.presentationSupport(),null);assert.equal(g.survivalPack.busy(),true,'Pure presentation does not cancel or mutate paused work');assert.deepEqual(g.player.carry,before.player.carry);}finally{g.worldEvolution=evolution;}
 assert.deepEqual(g.survivalPack.presentationSupport(),view);g.paused=false;g.activeOverlay=g.ui.commandModal;step(g,20);assert.deepEqual(g.survivalPack.presentationSupport(),view);g.activeOverlay=null;
 assert.equal(g.survivalPack.cancel(),true);assert.equal(g.survivalPack.presentationSupport(),null);assert.deepEqual(g.player.carry,before.player.carry);
});

test('208 portable toolbox maintenance shares real lamp authorization and never grants a regional arsenal',()=>{
 const f=serviceFixture208('service',{typology:'EXT-MONDE-T045',supportKind:'toolbox'}),{g}=f;assert.equal(f.support.supportKind,'toolbox');
 assert.equal(g.nightGear.serviceLantern(1,C.SurvivalPackRules.service.amount),false);assert.equal(start(f).ok,true);
 assert.equal(g.survivalPack.beginAtSupport('meal',f.site.id,f.support.supportId).ok,false);assert.equal(g.contextOperations160.begin(f.site.id,'medical208-'+f.support.supportId.split(':').at(-1)).ok,false);
 assert.equal(g.nightGear.serviceLantern(1,C.SurvivalPackRules.service.amount),false);step(g,C.SurvivalPackRules.service.seconds);assert.equal(g.nightGear.snapshot().devices[0].left,340);
 assert.equal(g.survivalPack.beginAtSupport('craft',f.site.id,f.support.supportId).ok,false);assert.deepEqual(g.resources,f.before.resources);
});

test('208 a placed lantern needs its own physical approach and a newly blocked approach cancels maintenance without payment',()=>{
 const f=serviceFixture208('service'),{g}=f,pose=g.frontier.position(),world=g.frontier.world();let point;
 for(const distance of [1,1.6,2.4])for(let i=0;i<8&&!point;i++){
  const q={x:pose.x+Math.cos(i*Math.PI/4)*distance,y:pose.y+Math.sin(i*Math.PI/4)*distance};
  if(!world.blocked(q.x,q.y,C.CampaignServices208Rules.actorRadius,0,pose.inside)&&world.line(pose,q,0,pose.inside,null,.05)&&world.movementLine(pose,q,0,pose.inside,null,C.CampaignServices208Rules.actorRadius))point=q;
 }
 assert.ok(point,'An actual free placement near the real workshop');
 const raw=g.serialize();Object.assign(raw.nightGear.devices[0],{location:'placed',domain:'region',...point,z:0,inside:pose.inside,angle:0});assert.equal(g.restoreSave(raw),true);
 const frontier=g.frontier,current=frontier.world(),lamp=g.nightGear.snapshot().devices[0],before={...g.player.carry};assert.equal(g.survivalPack.previewAtSupport('service',f.site.id,f.support.supportId,1).ok,true);
 // This is an explicit movement-reader veto toward the device only, while
 // its real seeded support and optical readers are preserved. It does not
 // assert that a natural pool happens to cross this workshop's lamp route.
 let deviceMovementChecks=0;
 const blocked={...current,movementLine:(a,b,...args)=>{if(Math.hypot(b.x-lamp.x,b.y-lamp.y)<1e-8){deviceMovementChecks++;return false;}return current.movementLine(a,b,...args);}};
 g.frontier=Object.freeze({...frontier,world:()=>blocked});
 try{assert.match(g.survivalPack.previewAtSupport('service',f.site.id,f.support.supportId,1).reason,/passage praticable/);assert.ok(deviceMovementChecks>0);assert.equal(start(f).ok,false);assert.deepEqual(g.player.carry,before);}finally{g.frontier=frontier;}
 assert.equal(start(f).ok,true);step(g,.3);g.frontier=Object.freeze({...frontier,world:()=>blocked});
 try{step(g,.1);assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.nightGear.snapshot().devices[0].left,100);}finally{g.frontier=frontier;}
});
