'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');
const copy=value=>JSON.parse(JSON.stringify(value)),radius=C.FrontierTacticsRules.enemyRadius;
const river={x:24320.262053914917,y:4425.339943550575,a:-1.5803756587963813};
const record=p=>({x:p.x,y:p.y,z:0,a:0,mode:'idle',ttl:0,gx:p.x,gy:p.y,cool:0});
function prepare(p,{kind='frenzied',historical=false,contacts}={}){
 const{game:g}=bootGame();g.startNew('standard','17117');const raw=copy(g.serialize());
 // Prepared offscreen encounter: no D17 workers or active contacts consume
 // unrelated AI draws. The geometry and the real update remain unmodified.
 raw.units=[];
 Object.assign(raw.frontier,{generation:historical?4:8,ecologyVersion:historical?0:1,hydrologyVersion:historical?0:1,
  active:true,anchor:{x:raw.player.x,y:raw.player.y},x:historical?4162:18101,y:historical?4096:8427});
 if(!historical)raw.frontier.landscape189='balanced';
 Object.assign(raw.worldEvolution,{serial:1,nextHorde:999,groups:[{id:'W0000',kind,count:5,lost:1,wound:3,fallen:[4],injuries:{3:3},contacts:contacts||{0:record(p)},...p,seen:false}]});
 assert.equal(g.restoreSave(raw),true);return{g,w:g.frontier.world()};
}
function checkpoint(g){const raw=copy(g.serialize());delete raw.timestamp;return raw;}
function expectRefusal(g,w,p,blockedPoint){
 assert.equal(w.blocked(p.x,p.y,radius,0,null),false,'the complete starting footprint is legal');
 assert.equal(w.blocked(blockedPoint.x,blockedPoint.y,radius,0,null),true,'the attempted endpoint is physically blocked');
 assert.equal(w.movementLine(p,blockedPoint,0,null,null,radius),false);
 const before=g.worldEvolution.snapshot(),rng=g.random.state;
 g.update(.1);const after=g.worldEvolution.snapshot(),h=after.groups[0];
 assert.deepEqual({x:h.x,y:h.y},{x:p.x,y:p.y},'refusal keeps the centre at its existing legal position');
 assert.deepEqual(h.contacts,before.groups[0].contacts,'refusal cannot translate or remove saved contacts');
 assert.deepEqual(h.fallen,[4]);assert.deepEqual(h.injuries,{'3':3});assert.equal(h.lost,1);assert.equal(h.count,5);assert.equal(h.id,'W0000');
 assert.equal(after.serial,before.serial);assert.equal(after.nextHorde,before.nextHorde);assert.deepEqual(after.structures,before.structures);
 assert.equal(g.random.state,rng,'the refused migration consumes no random draw');
 const saved=checkpoint(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 assert.deepEqual(checkpoint(g),saved,'real Continue preserves the refusal, possessions, losses and RNG');
}
test('193 offscreen wild horde refuses the real H165 river bank with its full contact radius',()=>{
 const{g,w}=prepare(river),blockedPoint={x:24320.134502393907,y:4425.235274503157};
 assert.equal(w.hydrology.sample(river.x,river.y).nearestBodyId,'H165:river:0');
 assert.equal(w.hydrology.sample(blockedPoint.x,blockedPoint.y).water,false,'the centre is still dry: its collision disc already overlaps the water');
 expectRefusal(g,w,river,blockedPoint);
});
for(const fixture of [
 {kind:'pond',id:'H165:pond:6:0',start:{x:8126.961979062347,y:576.0140139722457,a:-Math.PI},next:{x:8126.844912686548,y:575.897736443646}},
 {kind:'pool',id:'H165:pool:6:0',start:{x:7650.275433056306,y:575.5110541200211,a:-2.705260340591211},next:{x:7650.194685157061,y:575.3671625748647}}
])test('193 offscreen wild horde respects a real seeded '+fixture.kind+' bank and keeps its saved encounter',()=>{
 const{g,w}=prepare(fixture.start),feature=w.hydrology.features.find(q=>q.id===fixture.id);
 assert.equal(feature.kind,fixture.kind);assert.equal(w.hydrology.blockedCircle(fixture.next.x,fixture.next.y,radius),true);
 expectRefusal(g,w,fixture.start,fixture.next);
});
test('193 wild horde traverses a real road bridge at native speed while its width remains enforced',()=>{
 const{g,w}=prepare({x:17197.996042190585,y:8177.822248127318,a:-2.6535998946181523},{kind:'migrating'});
 const bridge=w.hydrology.crossings.find(q=>q.id==='H165:crossing:r29:0');assert.ok(bridge);
 const start={x:bridge.x-Math.cos(bridge.a)*(bridge.length/2+.5),y:bridge.y-Math.sin(bridge.a)*(bridge.length/2+.5),a:bridge.a};
 const raw=copy(g.serialize());Object.assign(raw.worldEvolution.groups[0],start,{contacts:{0:record(start)}});assert.equal(g.restoreSave(raw),true);
 const water=g.frontier.world().hydrology;assert.equal(water.sample(start.x,start.y).water,false);
 const outside={x:bridge.x-Math.sin(bridge.a)*bridge.width/2,y:bridge.y+Math.cos(bridge.a)*bridge.width/2};
 assert.equal(water.blockedCircle(outside.x,outside.y,radius),true,'no widened or disabled bridge collision');
 let previous=start,wet=0;const ticks=Math.ceil((bridge.length+1)/(.1*C.WorldEvolution.RULES.behaviours.migrating.speed))+2;
 for(let i=0;i<ticks;i++){
  g.update(.1);const h=g.worldEvolution.snapshot().groups[0],distance=Math.hypot(h.x-previous.x,h.y-previous.y);
  assert.ok(Math.abs(distance-.072)<1e-9,'every successful update keeps the historical movement amount');
  assert.equal(g.frontier.world().blocked(h.x,h.y,radius,0,null),false);assert.equal(g.frontier.world().movementLine(previous,h,0,null,null,radius),true);
  if(water.sample(h.x,h.y).water)wet++;previous=h;
 }
 assert.ok(wet>0,'the actual route traversed surface water over the deck');assert.equal(water.sample(previous.x,previous.y).water,false);
 assert.ok((previous.x-bridge.x)*Math.cos(bridge.a)+(previous.y-bridge.y)*Math.sin(bridge.a)>bridge.length/2,'the horde reached the opposite bank');
 assert.deepEqual(previous.fallen,[4]);assert.deepEqual(previous.injuries,{'3':3});assert.equal(previous.count,5);
});
test('193 centre and saved-contact translation sweep the real parked-car corner between two legal endpoints',()=>{
 const start={x:1287.5136086873536,y:13492.479540436841,a:-3.225956121187308},next={x:1287.3697749202236,y:13492.398689664222};
 const{g,w}=prepare(start),car=w.pois.find(p=>p.id==='P0000').parking.find(p=>p.id==='P0000:car:0');assert.ok(car);
 assert.equal(w.blocked(start.x,start.y,radius,0,null),false);assert.equal(w.blocked(next.x,next.y,radius,0,null),false);
 assert.equal(w.movementLine(start,next,0,null,null,radius),false,'endpoint-only clearance misses the real body corner');
 const contacts=g.worldEvolution.snapshot().groups[0].contacts,rng=g.random.state;g.update(.1);
 let h=g.worldEvolution.snapshot().groups[0];assert.equal(h.x,start.x);assert.equal(h.y,start.y);assert.deepEqual(h.contacts,contacts);assert.equal(g.random.state,rng);
 const dx=next.x-start.x,dy=next.y-start.y,road=w.nearestRoad(start).road;let centre=null;
 for(const offset of [[2,0],[-2,0],[0,2],[0,-2],[4,4],[-4,-4]]){
  const p={x:start.x+offset[0],y:start.y+offset[1]};
  if(w.nearestRoad(p).road!==road||w.blocked(p.x,p.y,radius,0,null)||!w.movementLine(p,{x:p.x+dx,y:p.y+dy},0,null,null,radius))continue;
  centre=p;break;
 }
 assert.ok(centre,'the same real road offers an unobstructed nearby centre');
 const raw=copy(g.serialize());raw.worldEvolution.clock=0;
 Object.assign(raw.worldEvolution.groups[0],centre,{a:start.a,contacts:{0:record(start),1:{...record(centre),mode:'pursuit'},2:{...record(centre),mode:'investigate'}}});
 assert.equal(g.restoreSave(raw),true);const before=g.worldEvolution.snapshot().groups[0];g.update(.1);h=g.worldEvolution.snapshot().groups[0];
 assert.ok(Math.abs(h.x-centre.x-dx)<1e-9);assert.ok(Math.abs(h.y-centre.y-dy)<1e-9);
 assert.deepEqual(h.contacts,before.contacts,'a blocked saved contact stays in place; pursuit and investigation retain their existing owner');
 assert.equal(h.count,5);assert.deepEqual(h.fallen,[4]);assert.deepEqual(h.injuries,{'3':3});
});
test('193 historical no-water horde migration retains exact seeded coordinates, contacts and RNG',()=>{
 const{g,w}=prepare({x:5000,y:5000,a:.7},{historical:true}),rng=g.random.state;assert.equal(w.hydrologyVersion,0);
 for(let i=0;i<3;i++)g.update(.1);const h=g.worldEvolution.snapshot().groups[0];
 // Recorded from the previous unmodified controller on this same fixture.
 assert.deepEqual({x:h.x,y:h.y,a:h.a},{x:5000.181994777905,y:5000.456531706407,a:1.321929127853358});
 assert.deepEqual(h.contacts[0],{...record(h),a:0});assert.equal(g.random.state,rng);assert.deepEqual(h.fallen,[4]);assert.deepEqual(h.injuries,{'3':3});
});
