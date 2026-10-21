'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const rows=g=>g.world.nodes.map(n=>[n.id,n.type,n.sceneryKind||null,n.siteId||null,n.x,n.y,n.amount,n.maxAmount,n.metric202||0,n.body202||null]);

test('202 forty native starts conserve all 48 finite scenery deposits and five Continue cycles preserve partial harvests', {timeout:480000},async t=>{
 const {g}=bootDocument134();await new Promise(resolve=>setTimeout(resolve,0));
 const seeds=[];let state=0x202169ab;
 for(let i=0;i<32;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;seeds.push({seed:state,blank:false});}
 // These eight random draws reproduce the blank-input cases from the failed
 // read-only audit. Native map preview owns the draw before an empty start.
 for(const seed of [1694999245,77072925,215130068,661664028,4108388061,1435878011,4046759385,3189737365])seeds.push({seed,blank:true});
 const continueCases=new Set([0,8,9,32,39]);let continued=0;
 for(const [index,input]of seeds.entries()){
  t.diagnostic(`BEFORE_START ${index} seed=${input.seed} blank=${input.blank}`);
  if(input.blank)g.previewMapSeed135=input.seed;
  assert.notEqual(g.startNew('standard',input.blank?'':String(input.seed),'classic','balanced',true),false);
  g.campaignIntro132.skip();assert.equal(g.world.seed,input.seed);assert.equal(g.world.cityGeometry202,1);assert.equal(g.exploration125.layoutRevision,4);assert.equal(g.lastSaveStatus.ok,true,'the completed transaction persisted its final layout');
  for(const actor of [g.player,...g.units])assert.equal(g.friendlyPositionClear(actor,actor.x,actor.y),true,`seed ${input.seed}: initial actor ${actor.id} is trapped after packing`);
  const raw=new g.world.constructor(input.seed,1),source=raw.nodes.filter(n=>n.sceneryKind),scenery=g.world.nodes.filter(n=>n.sceneryKind);
  assert.equal(source.length,48);assert.equal(scenery.length,48);
  assert.deepEqual(scenery.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.maxAmount]),source.map(n=>[n.id,n.type,n.sceneryKind,n.siteId,n.amount]),`seed ${input.seed}: no lost identities, tags or nominal stock`);
  for(const n of scenery){assert.equal(n.amount,n.maxAmount,`seed ${input.seed}: deposit ${n.id}/${n.sceneryKind} was destroyed during initialization`);assert.equal(n.depleted,false);}
  for(const n of scenery){const size=globalThis.DeadwallCore.CityGeometry202.sceneryMetres[n.sceneryKind];if(size){assert.equal(n.metric202,1);assert.deepEqual([n.body202.w,n.body202.h],size.map(m=>m*32));}}
  if(!continueCases.has(index))continue;
  const partial=scenery.find(n=>n.sceneryKind==='warehouseShell')||scenery[0],empty=scenery.find(n=>n!==partial&&n.sceneryKind==='tent')||scenery.find(n=>n!==partial);
  const taken=Math.max(1,Math.floor(partial.amount*.37));assert.equal(partial.harvest(taken),taken);empty.harvest(empty.amount);assert.equal(empty.amount,0);assert.equal(empty.depleted,true);
  const natural=g.world.nodes.find(n=>!n.sceneryKind&&!n.__exploration125Loot&&!n.depleted&&n.amount>10);natural.harvest(7);
  const loot=g.world.nodes.find(n=>n.__exploration125Loot&&n.amount>1);loot.harvest(1);
  const before=rows(g),runId=g.runId,expectedPartial=partial.amount,emptyId=empty.id,partialId=partial.id;
  assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);g.campaignIntro132.skip();assert.equal(g.runId,runId);assert.deepEqual(rows(g),before,`seed ${input.seed}: real Continue changed finite stock or coordinates`);
  g.exploration125.syncPlan();assert.deepEqual(rows(g),before,'a later plan refresh cannot repack or replenish a harvest');
  assert.equal(g.world.nodes.find(n=>n.id===partialId).amount,expectedPartial);assert.equal(g.world.nodes.find(n=>n.id===emptyId).amount,0);continued++;
 }
 assert.equal(continued,5);
});
