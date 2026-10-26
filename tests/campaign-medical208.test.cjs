'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js');
const Ops=require('../src/context-operations160.js');
const {boot127}=require('./helpers/expansions127.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
function checkpoint(g){const data=copy(g.serialize());delete data.timestamp;return data;}
function step(g,seconds){for(let elapsed=0;elapsed<seconds-1e-8;elapsed+=.1)g.contextOperations160.step(Math.min(.1,seconds-elapsed));}

// Prepared controller fixtures use actual G11 furniture, its authored access,
// the real collision readers and a finite carried bag. This does not measure
// organic travel, campaign duration or a human playthrough.
function fixture(){
 const g=boot127().game;require('../src/world-pack131.js').install(g);Ops.install(g);
 g.startNew('standard','17117','classic','classic',true);
 const world=g.frontier.world(),site=world.pois.find(p=>p.campaign205?.typology==='EXT-MONDE-T047');assert.ok(site);
 const support=world.detailAt(site,0).interior.find(o=>o.kind==='medical');assert.ok(support?.access);
 const point=G.global(site,support.access.x+support.access.w/2,support.access.y+support.access.h/2),raw=g.serialize();
 assert.equal(world.blocked(point.x,point.y,C.CampaignServices208Rules.actorRadius,0,site.id),false);
 Object.assign(raw.frontier,{active:true,...point,z:0,inside:site.id,anchor:{x:g.player.x,y:g.player.y}});
 raw.frontier.seen=[site.id];raw.player.carry=C.makeBag();raw.player.carry.medicine=4;raw.player.health=g.player.maxHealth-45;
 for(const p of world.nearPOI(point.x,point.y,200))for(let i=0;i<world.threatCount(p);i++)raw.frontier.enemies[p.id+':e'+i]=0;
 raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
 assert.equal(g.restoreSave(raw),true);g.input.keys.clear();g.input.pressed.clear();
 const key='medical208-'+support.id.split(':')[2],fullKey=Ops.operationKey(site.id,key);
 const quote=g.contextOperations160.preview(site.id,key);assert.equal(quote.ok,true,quote.reason);
 return{g,site,support,point,key,fullKey,quote};
}

test('208 actual T047 medical furniture exposes the existing paid repeatable care and a pure work presentation',()=>{
 const {g,site,support,key,fullKey,quote}=fixture(),rule=C.ContextRules160.operations.medicalCare;
 assert.equal(quote.kind,'medicalCare');assert.equal(quote.seconds,rule.seconds);assert.deepEqual(quote.cost,rule.cost);assert.equal(quote.heal,rule.heal);assert.equal(quote.repeat,true);
 const before=checkpoint(g),random=Math.random;let action;
 Math.random=()=>assert.fail('A care preview or presentation consumed random state');
 try{
  action=g.contextOperations160.actions().find(a=>a.id===fullKey);assert.ok(action);assert.equal(action.disabled,false,action.reason);
  assert.ok(g.contextOperations160.overview().rows.some(row=>row.id===site.id));
  assert.equal(g.contextOperations160.presentation(fullKey),null);assert.deepEqual(checkpoint(g),before);
 }finally{Math.random=random;}
 assert.equal(action.run().ok,true);assert.equal(g.contextOperations160.activity().elapsed,0);step(g,.3);
 const view=g.contextOperations160.activity();assert.equal(view.fullKey,fullKey);assert.equal(view.kind,'medicalCare');assert.equal(view.siteId,site.id);
 assert.equal(view.supportId,support.id);assert.equal(view.action,'medicalCare');assert.equal(view.supportKind,'medical');
 assert.equal(Object.isFrozen(view),true);assert.equal(Object.isFrozen(view.anchor),true);assert.equal(Object.isFrozen(view.workTarget),true);
 assert.deepEqual(view.anchor,quote.anchor);assert.deepEqual(view.workTarget,quote.workTarget);assert.ok(view.elapsed>0&&view.progress>0);
 assert.deepEqual(g.player.carry,before.player.carry);assert.equal(g.player.health,before.player.health);
 step(g,rule.seconds-.3);assert.equal(g.player.health,before.player.health+rule.heal);assert.equal(g.player.carry.medicine,3);
 assert.deepEqual(g.resources,before.resources);assert.deepEqual(g.contextOperations160.snapshot(),{version:1,completed:[]});
 assert.equal(g.contextOperations160.presentation(fullKey),null);step(g,rule.seconds*2);assert.equal(g.player.carry.medicine,3,'An ended task cannot pay again');
 for(let i=0;i<2;i++){assert.equal(g.contextOperations160.begin(site.id,key).ok,true);step(g,rule.seconds);}
 assert.equal(g.player.health,g.player.maxHealth);assert.equal(g.player.carry.medicine,1);assert.match(g.contextOperations160.preview(site.id,key).reason,/Aucun soin/);
 assert.equal(g.contextOperations160.isComplete(fullKey),false,'Repeatable care never becomes a saved completed access');
});

test('208 medical furniture refuses wrong families, forged support identities, distance, floor, blocked movement, missing medicine and demolition without mutation',()=>{
 const {g,site,key,quote}=fixture(),saved=checkpoint(g),original=g.frontier,world=original.world();
 const foreign=world.pois.find(p=>p.campaign205?.typology==='EXT-MONDE-T045'),object=world.detailAt(foreign,0).interior[0];assert.ok(object);
 for(const [id,name]of [[foreign.id,'medical208-'+object.id.split(':')[2]],[site.id,'medical208-999999'],[site.id,'medical208-044'],[site.id,'medical208--1'],[site.id,'medical208-__proto__']]){
  assert.equal(g.contextOperations160.begin(id,name).ok,false,id+'/'+name);assert.deepEqual(checkpoint(g),saved);
 }
 for(const changes of [{x:original.position().x+50},{z:1,inside:site.id}]){
  g.frontier=Object.freeze({...original,position:()=>({...original.position(),...changes})});
  try{assert.equal(g.contextOperations160.begin(site.id,key).ok,false);assert.deepEqual(checkpoint(g),saved);}finally{g.frontier=original;}
 }
 // Water is optically transparent. Inject only the movement reader's veto,
 // keeping the real seeded furniture and optical geometry, to prove that a
 // clear view cannot replace a traversable approach or remain valid mid-job.
 assert.equal(world.line(original.position(),quote.anchor,0,site.id,null,.05),true);let movementChecks=0;
 const blockedWorld={...world,movementLine:()=>{movementChecks++;return false;}},blockedFrontier=Object.freeze({...original,world:()=>blockedWorld});
 g.frontier=blockedFrontier;
 try{assert.equal(g.contextOperations160.begin(site.id,key).ok,false);assert.ok(movementChecks>0);assert.deepEqual(checkpoint(g),saved);}finally{g.frontier=original;}
 assert.equal(g.contextOperations160.begin(site.id,key).ok,true);step(g,.2);g.frontier=blockedFrontier;
 try{g.contextOperations160.step(.1);assert.equal(g.contextOperations160.busy(),false);assert.deepEqual(checkpoint(g),saved);}finally{g.frontier=original;}
 const missing=copy(saved);missing.player.carry.medicine=0;assert.equal(g.restoreSave(missing),true);
 assert.match(g.contextOperations160.preview(site.id,key).reason,/Dans le sac/);assert.deepEqual(g.resources,saved.resources);
 const destroyed=copy(saved);destroyed.worldEvolution.structures[site.id]=0;assert.equal(g.restoreSave(destroyed),true);
 assert.equal(g.worldEvolution.structureDestroyed(site.id),true);const before=checkpoint(g);
 assert.equal(g.contextOperations160.begin(site.id,key).ok,false);assert.deepEqual(checkpoint(g),before);
});

test('208 medical work revalidates movement, damage, reload, shots, bag identity, useful health, resources and its live support before the sole debit',()=>{
 const {g,site,key}=fixture(),saved=checkpoint(g);
 for(const interrupt of ['movement','damage','reload','shots','source','healthy','medicine','destroyed']){
  assert.equal(g.restoreSave(copy(saved)),true);const before={...g.player.carry};
  assert.equal(g.contextOperations160.begin(site.id,key).ok,true);step(g,.2);
  if(interrupt==='movement'){g.input.keys.add('KeyD');g.updatePlayer(.1);g.input.keys.clear();}
  if(interrupt==='damage')g.player.health--;
  if(interrupt==='reload')g.player.reload=1;
  if(interrupt==='shots')g.stats.shots++;
  if(interrupt==='source')g.player.carry=copy(g.player.carry);
  if(interrupt==='healthy')g.player.health=g.player.maxHealth;
  if(interrupt==='medicine')g.player.carry.medicine=0;
  const evolution=g.worldEvolution;
  if(interrupt==='destroyed')g.worldEvolution={...evolution,structureDestroyed:id=>id===site.id||evolution.structureDestroyed(id)};
  try{
   g.contextOperations160.step(.1);assert.equal(g.contextOperations160.busy(),false,interrupt);
   assert.equal(g.player.carry.medicine,interrupt==='medicine'?0:before.medicine,interrupt);
   assert.deepEqual(g.resources,saved.resources,interrupt);assert.deepEqual(g.contextOperations160.snapshot().completed,[],interrupt);
  }finally{g.worldEvolution=evolution;}
 }
});

test('208 medical work refuses actual visible hostile contacts and cancels partial care without payment',()=>{
 const {g,site,point,key}=fixture(),before={...g.player.carry};
 assert.equal(g.contextOperations160.begin(site.id,key).ok,true);step(g,.2);
 const original=g.frontier,hostile={id:'qa-medical-danger208',x:point.x+.3,y:point.y,z:0,hp:10,dead:false,inside:site.id};
 assert.equal(original.world().line(point,hostile,0,site.id,null,.05),true);
 g.frontier=Object.freeze({...original,contacts:()=>[hostile]});
 try{
  assert.match(g.contextOperations160.preview(site.id,key,{working:true}).reason,/Sécurisez/);g.contextOperations160.step(.1);
  assert.equal(g.contextOperations160.busy(),false);assert.deepEqual(g.player.carry,before);assert.equal(g.contextOperations160.begin(site.id,key).ok,false);
 }finally{g.frontier=original;}
});

test('208 medical Save/Menu/Continue cancels unfinished work, preserves paid useful healing and rejects forged completion records atomically',()=>{
 const {g,site,key,fullKey}=fixture(),before={...g.player.carry};
 assert.equal(g.contextOperations160.begin(site.id,key).ok,true);step(g,.4);const view=g.contextOperations160.presentation(fullKey);
 g.paused=true;step(g,20);assert.deepEqual(g.contextOperations160.presentation(fullKey),view);
 const evolution=g.worldEvolution;g.worldEvolution={...evolution,structureDestroyed:id=>id===site.id||evolution.structureDestroyed(id)};
 try{assert.equal(g.contextOperations160.presentation(fullKey),null);assert.equal(g.contextOperations160.activity(),null);assert.equal(g.contextOperations160.busy(),true,'A read does not mutate the paused job');assert.deepEqual(g.player.carry,before);}finally{g.worldEvolution=evolution;}
 assert.deepEqual(g.contextOperations160.presentation(fullKey),view);g.paused=false;
 g.activeOverlay=g.ui.commandModal;step(g,20);assert.deepEqual(g.contextOperations160.presentation(fullKey),view);g.activeOverlay=null;
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.contextOperations160.busy(),false);assert.equal(g.load(),true);
 assert.equal(g.contextOperations160.busy(),false);assert.deepEqual(g.player.carry,before);assert.deepEqual(g.contextOperations160.snapshot().completed,[]);
 assert.equal(g.contextOperations160.begin(site.id,key).ok,true);step(g,C.ContextRules160.operations.medicalCare.seconds);
 const paid=checkpoint(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),paid);
 const bad=copy(paid);bad.expansions127.modules.context160.completed.push(fullKey);const world=g.world;
 assert.throws(()=>g.restoreSave(bad),/invalide/);assert.equal(g.world,world);assert.deepEqual(checkpoint(g),paid);
});
