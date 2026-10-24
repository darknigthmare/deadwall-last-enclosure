'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
function fresh(){const env=bootDocument134();return{...env,C:globalThis.DeadwallCore};}
function writes(C){
 const storage=globalThis.localStorage,original=storage.setItem,events=[];
 storage.setItem=function(key,value){if(key===C.SAVE_KEY||key===C.SAVE_BACKUP_KEY)events.push({key,value:String(value)});return original.call(this,key,value);};
 return{events,primary:()=>events.filter(e=>e.key===C.SAVE_KEY),restore(){storage.setItem=original;}};
}
function assertCurrent(g,data){
 assert.equal(data.cityGeometry202,1);assert.equal(data.exploration125.layoutRevision,4);assert.equal(data.exploration125.generation,4);assert.equal(data.frontier.generation,11);assert.equal(data.frontier.detailVersion,13);assert.equal(g.exploration125.plan.layoutRevision,4);assert.equal(g.world.cityGeometry202,1);
 for(const owner of g.expansions.entries())assert.ok(Object.hasOwn(data.expansions127.modules,owner.id),owner.id+' is present in the only campaign write');
 const solid=g.exploration125.plan.stations[0].solids[0],x=solid.x+solid.w/2,y=solid.y+solid.h/2;assert.equal(g.friendlyPositionClear(g.player,x,y),false,'the restored R4 wall really blocks movement');
}

test('202 native start writes once after all G11, detail and metric local owners, then resumes with active collisions',()=>{
 const{g,C}=fresh(),capture=writes(C);try{
  assert.notEqual(g.startNew('standard','17117','classic','balanced',true),false);assert.equal(capture.primary().length,1);const stored=globalThis.DeadwallSave.parse(capture.primary()[0].value);assertCurrent(g,stored);
  assert.equal(stored.fieldcraft.nodes.length,g.world.nodes.length);assert.deepEqual(stored.fieldcraft.nodes,g.serialize().fieldcraft.nodes);assert.deepEqual(stored.nodes,g.serialize().nodes);const id=stored.runId;
  g.campaignIntro132.skip();g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.runId,id);assertCurrent(g,g.serialize());
 }finally{capture.restore();}
});

test('202 later start wrappers remain inside the transaction and every intermediate save honestly returns false',()=>{
 const{g,C}=fresh(),beforeDescriptor=Object.getOwnPropertyDescriptor(g,'startNew'),save=g.save;assert.equal(globalThis.DeadwallCampaignStart202.install(g),false);assert.equal(g.save,save);
 const start=g.startNew,pending=[];g.startNew=function(...args){assert.equal(globalThis.DeadwallCampaignStart202.isStarting(g),true);const result=start(...args);if(result!==false){g.player.carry.wood=1;assert.equal(globalThis.DeadwallCampaignStart202.isStarting(g),true);pending.push(g.save(false));}return result;};
 const descriptor=Object.getOwnPropertyDescriptor(g,'startNew');assert.equal(descriptor.configurable,beforeDescriptor.configurable);assert.equal(descriptor.enumerable,beforeDescriptor.enumerable);assert.equal(typeof descriptor.get,'function');assert.equal(typeof descriptor.set,'function');
 const capture=writes(C);try{assert.notEqual(g.startNew('standard','17117','classic','balanced',true),false);assert.equal(globalThis.DeadwallCampaignStart202.isStarting(g),false);assert.deepEqual(pending,[false]);assert.equal(capture.primary().length,1);const stored=globalThis.DeadwallSave.parse(capture.primary()[0].value);assert.equal(stored.player.carry.wood,1);assertCurrent(g,stored);}finally{capture.restore();}
});

test('202 initializer exceptions preserve the old blobs and reject later autosaves of the failed world until restore',()=>{
 const{g,C}=fresh();g.startNew('standard','17117','classic','balanced',true);g.campaignIntro132.skip();g.player.carry.scrap=3;assert.equal(g.save(false),true);
 const storage=globalThis.localStorage,primary=storage.getItem(C.SAVE_KEY),backup=storage.getItem(C.SAVE_BACKUP_KEY),old=JSON.parse(primary),update=g.updateUI,capture=writes(C);
 try{
  g.updateUI=()=>{throw Error('202 declared initialization fault');};assert.throws(()=>g.startNew('standard','1337','classic','balanced',true),/declared initialization fault/);g.updateUI=update;
  assert.equal(capture.events.length,0);assert.equal(storage.getItem(C.SAVE_KEY),primary);assert.equal(storage.getItem(C.SAVE_BACKUP_KEY),backup);assert.equal(g.save(false),false);assert.equal(g.save(true),false);assert.equal(capture.events.length,0);assert.equal(g.lastSaveStatus.code,'campaign-start-failed');
  assert.equal(g.restoreSave(old),true);assert.equal(g.runId,old.runId);assert.equal(g.player.carry.scrap,3);assertCurrent(g,g.serialize());assert.equal(g.save(false),true);assert.equal(capture.primary().length,1);
 }finally{g.updateUI=update;capture.restore();}
});

test('202 refused setup never writes or blocks the current valid campaign',()=>{
 const{g,C}=fresh();g.startNew('standard','17117','classic','balanced',true);g.campaignIntro132.skip();const world=g.world,id=g.runId,blob=localStorage.getItem(C.SAVE_KEY),capture=writes(C);
 try{
  assert.equal(g.startNew('standard','invalid seed','classic','balanced',true),false);assert.equal(g.startNew('standard','1337','classic','balanced','yes'),false);assert.equal(g.world,world);assert.equal(g.runId,id);assert.equal(capture.events.length,0);assert.equal(localStorage.getItem(C.SAVE_KEY),blob);assert.equal(g.save(false),true);assert.equal(capture.primary().length,1);
 }finally{capture.restore();}
});

test('202 quota failure affects only the final complete write and a later save can recover normally',()=>{
 const{g,C}=fresh();g.startNew('standard','17117');g.campaignIntro132.skip();const storage=globalThis.localStorage,primary=storage.getItem(C.SAVE_KEY),write=storage.setItem,error=console.error,attempts=[];
 try{
  console.error=()=>{};storage.setItem=function(key,value){if(key===C.SAVE_KEY){attempts.push(JSON.parse(value));throw Error('202 declared quota fault');}return write.call(this,key,value);};
  assert.notEqual(g.startNew('standard','17117','classic','balanced',true),false);assert.equal(attempts.length,1);assertCurrent(g,attempts[0]);assert.equal(storage.getItem(C.SAVE_KEY),primary);assert.equal(g.lastSaveStatus.ok,false);assert.equal(g.lastSaveStatus.code,'storage-unavailable');
  storage.setItem=write;assert.equal(g.save(false),true);const recovered=globalThis.DeadwallSave.parse(storage.getItem(C.SAVE_KEY));assertCurrent(g,recovered);assert.equal(g.load(),true);assertCurrent(g,g.serialize());
 }finally{storage.setItem=write;console.error=error;}
});
