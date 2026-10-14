'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{prepareMetricVehicle174}=require('../scripts/metric174-fixtures.cjs');
const {g}=bootDocument134(),C=globalThis.DeadwallCore;
const snapshot=()=>{const data=g.serialize();delete data.timestamp;return data;};
function campaign(type='bus'){g.startNew('standard','17117');g.campaignIntro132.skip();return prepareMetricVehicle174(g,type);}
test('174 every paid vehicle can opt in without moving its pose, changing fuel, cargo or campaign fields',()=>{
 for(const type of Object.keys(C.WorldEvolution.RULES.vehicles)){
  const fixture=campaign(type),before=snapshot();assert.equal(Object.hasOwn(before.expeditions.vehicle,'metric174'),false);
  const action=g.worldOps131.actions().find(a=>a.id==='metricVehicle174');assert.ok(action&&!action.disabled,action?.reason);
  const result=action.run();assert.ok(result.ok,result.reason);const after=snapshot();assert.equal(after.expeditions.vehicle.metric174,1);delete after.expeditions.vehicle.metric174;assert.deepEqual(after,before,type);
  assert.equal(g.expeditions.entity().radius,fixture.radius);assert.equal(g.expeditions.activateMetricScale174().ok,false);
  const saved=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),saved);
  const v=g.expeditions.car(),angle=Math.atan2(g.player.y-v.y,g.player.x-v.x);
  // Physically free boarding pose outside the body, rather than standing in it.
  const step=fixture.radius+g.player.radius+8;let boarding=false;
  for(let i=0;i<36;i++){const a=angle+i*Math.PI/18,q={x:v.x+Math.cos(a)*step,y:v.y+Math.sin(a)*step};if(!g.friendlyPositionClear(g.player,q.x,q.y))continue;Object.assign(g.player,q);if(g.expeditions.board().ok){boarding=true;break;}}
  assert.ok(boarding,type);assert.equal(g.player.radius,fixture.radius);
  const driving=snapshot();assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(snapshot(),driving);assert.equal(g.player.radius,fixture.radius);
  assert.equal(g.expeditions.board().ok,true,type+' disembark');assert.notEqual(g.player.radius,fixture.radius);
 }
});
test('174 occupied hands, overlapping actors and refused restoration do not change saved data',()=>{
 campaign();let before=snapshot();const restore=g.restoreSave;g.restoreSave=()=>false;
 try{assert.equal(g.expeditions.activateMetricScale174().ok,false);assert.deepEqual(snapshot(),before);}finally{g.restoreSave=restore;}
 g.player.reload=1;before=snapshot();assert.equal(g.expeditions.activateMetricScale174().ok,false);assert.deepEqual(snapshot(),before);g.player.reload=0;
 const v=g.expeditions.car();Object.assign(g.player,{x:v.x,y:v.y});before=snapshot();assert.equal(g.expeditions.activateMetricScale174().ok,false);assert.deepEqual(snapshot(),before);
});
test('174 metric migration preserves a placed local light even when old compact vehicle did not touch it',()=>{
 const fixture=campaign(),data=g.serialize(),v=data.expeditions.vehicle;
 const x=v.x+fixture.radius*.7,y=v.y;
 data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:60,on:false,used:true,domain:'local',x,y,z:0,inside:null,angle:0}]};
 assert.equal(g.restoreSave(data),true);const before=snapshot(),result=g.expeditions.activateMetricScale174();assert.equal(result.ok,false);assert.deepEqual(snapshot(),before);
});
test('174 replacing a destroyed calibrated vehicle does not silently inherit its scale flag',()=>{
 campaign('bus');assert.ok(g.expeditions.activateMetricScale174().ok);g.expeditions.damage(10000);
 assert.equal(g.expeditions.car().health,0);assert.ok(g.worldEvolution.selectVehicle('compact'));
 const r=g.expeditions.buildCar();assert.ok(r.ok,r.reason);assert.equal(Object.hasOwn(g.expeditions.car(),'metric174'),false);
 assert.equal(g.expeditions.entity().radius,Math.max(12,Number((4.05*22/4.6).toFixed(6))));
});
