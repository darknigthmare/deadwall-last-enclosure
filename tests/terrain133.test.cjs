'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../src/exploration-125.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const {boot131}=require('./helpers/expansions131.cjs');
const seeds=[0,1,42,73,17117,84329,998877,4294967295];
function roadEnds(r,size=4096){return r.axis==='h'?[{x:0,y:r.y},{x:size,y:r.y}]:r.axis==='v'?[{x:r.x,y:0},{x:r.x,y:size}]:[{x:r.x1,y:r.y1},{x:r.x2,y:r.y2}];}
function cuts(road,box,pad=0){const[a,b]=roadEnds(road);return G.segmentRect(a,b,{x:box.x-road.width/2-pad,y:box.y-road.width/2-pad,w:box.w+road.width+pad*2,h:box.h+road.width+pad*2});}
function nodes(g){return g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount]);}
function allRoads(p){return [...p.roads,...p.settlements.flatMap(s=>[s.street,s.connector].filter(Boolean))];}

test('terrain133: seed changes actual road spacing, parcels and access, beyond four rotations',()=>{
 const signatures=new Set();for(let seed=0;seed<128;seed++){
  const p=E.createFeaturePlan(seed,4096,3);assert.deepEqual(E.createFeaturePlan(seed,4096,3),p);
  signatures.add(JSON.stringify(p.roads.filter(r=>r.className==='collector').map(r=>[r.x,r.y])));
  assert.equal(p.stations.length,4);assert.equal(p.settlements.length,3);assert.ok(p.backyards.length>=4&&p.backyards.length<=8);
  assert.ok(p.roads.every(r=>!E.roadContains(r,2048,2048,65)),'depot not on any carriageway');
  for(const b of p.solids.filter(b=>['house','station-wall','station-furniture','settlement-building','palisade'].includes(b.kind)))for(const r of p.roads.filter(r=>r.className!=='access'))assert.equal(cuts(r,b),false,`${seed}/${b.kind}/${r.id}`);
 }
 assert.equal(signatures.size,128);
});

test('terrain133: each hamlet is linked at its real street endpoint and no house occupies that street',()=>{
 for(const seed of seeds){const p=E.createFeaturePlan(seed,4096,3);for(const s of p.settlements){
  assert.equal(s.buildings.length,6);assert.ok([s.street.x1,s.street.x2].includes(s.connector.x1));assert.equal(s.street.y1,s.connector.y1);
  assert.ok(p.roads.some(r=>E.roadContains(r,s.connector.x2,s.connector.y2,-1)));
  for(const b of s.buildings)assert.equal(cuts({...s.street,axis:'line'},{x:b.x-b.w/2,y:b.y-b.h/2,w:b.w,h:b.h}),false);
 }}
});

test('terrain133: benches have the same physical and painted footprint; ambient props add no loot',()=>{
 const p=E.createFeaturePlan(17117,4096,3);assert.equal(p.decor.length,70);assert.ok(new Set(p.decor.map(d=>d.kind)).size>=8);
 for(const prop of p.decor){assert.equal(prop.amount,undefined);if(prop.kind==='bench'){assert.equal(prop.angle,0);assert.ok(p.solids.some(s=>s.prop===prop.id&&s.kind==='terrain-prop'));assert.ok(p.buildExclusions.some(s=>s.prop===prop.id));}}
});

test('terrain133: reduced new-campaign density keeps finite starter resources and clears every canopy from roads',()=>{
 const {g}=boot131();const p=g.exploration125.plan,natural=g.world.nodes.filter(n=>!n.sceneryKind&&!n.__exploration125Loot),alive=natural.filter(n=>!n.depleted);
 assert.equal(g.exploration125.layoutRevision,3);assert.ok(alive.length/natural.length<.75&&alive.length/natural.length>.45);
 assert.ok(alive.filter(n=>Math.hypot(n.x-2048,n.y-2048)<850).length<=10);
 for(const type of ['wood','scrap','stone','food','fuel']){const nearby=alive.filter(n=>n.type===type&&Math.hypot(n.x-2048,n.y-2048)<850);assert.ok(nearby.length>=2,type);assert.ok(nearby.reduce((sum,n)=>sum+n.amount,0)>45,type+' usable reserves');}
 for(const n of alive)for(const r of allRoads(p))assert.equal(E.roadContains(r,n.x,n.y,n.radius*1.8),false,n.type+'/'+n.id);
 for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++)assert.ok(Math.hypot(alive[i].x-alive[j].x,alive[i].y-alive[j].y)>=69.99);
});

test('terrain133: harvest and automatic save/reload preserve coordinates and every remaining quantity',()=>{
 const{g}=boot131();const initial=nodes(g),save=g.serialize();assert.equal(save.exploration125.layoutRevision,3);g.load();assert.deepEqual(nodes(g),initial);
 const source=g.world.nodes.find(n=>n.type==='wood'&&!n.depleted);source.harvest(11);const after=nodes(g),state=g.serialize();g.restoreSave(state);assert.deepEqual(nodes(g),after);g.exploration125.syncPlan();assert.deepEqual(nodes(g),after);
 g.startNew('standard','84329');g.restoreSave(state);assert.deepEqual(nodes(g),after);
});

test('terrain133: explicit revision 2 and unmarked historic save preserve old geometry and stock',()=>{
 const{g}=boot131();for(const revision of [1,2]){g.exploration125.layoutRevision=revision;g.exploration125.syncPlan();const save=g.serialize(),quantities=save.nodes;if(revision===1)delete save.exploration125.layoutRevision;g.restoreSave(save);assert.equal(g.exploration125.layoutRevision,revision);assert.deepEqual(g.exploration125.plan,E.createFeaturePlan(g.world.seed,4096,revision));assert.deepEqual(g.serialize().nodes,quantities);}
});

test('terrain133: invalid future revision is refused before replacing world and quantities',()=>{
 const{g}=boot131(),world=g.world,before=nodes(g),save=g.serialize();save.exploration125.layoutRevision=4;assert.throws(()=>g.restoreSave(save));assert.equal(g.world,world);assert.deepEqual(nodes(g),before);
});

test('terrain133: regional driveway corridors reject tree canopies and preserve cleared harvest IDs',()=>{
 for(const seed of [17117,84329]){const w=W.create(seed,5);let count=0;for(const p of w.pois.filter(p=>Math.hypot(p.x-4096,p.y-4096)<1300)){
  const d=p.drive,pad=8,boxes=w.around((d.a.x+d.b.x)/2,(d.a.y+d.b.y)/2,Math.hypot(d.a.x-d.b.x,d.a.y-d.b.y)/2+pad);
  for(const c of boxes){for(const t of c.trees)assert.ok(G.nearest(t,d.a,d.b).d>=d.width/2+t.canopy+.8-1e-8,p.id+'/'+t.id);count+=(c.cleared||[]).length;}
 }assert.ok(count>0);assert.ok(w.cacheSize()<=25);const c=w.chunk(17,16);assert.ok((c.cleared||[]).some(t=>t.kind==='tree'));for(const t of c.cleared||[])assert.ok(t.amount>0&&t.id);}
});

test('terrain133: service point honors current D17 collision wrappers for seed 17118',()=>{
 const{g}=boot131({seed:'17118'}),node=g.world.nodes.find(n=>!n.depleted&&n.type==='wood'),point=g.fieldcraft.service(g.player,node);
 assert.ok(point,'harvest needs an actual service position');
 assert.ok(g.friendlyPositionClear(g.player,point.x,point.y));
 assert.ok(g.friendlyPositionClear(g.player,Math.floor(point.x/32)*32+16,Math.floor(point.y/32)*32+16));
 const wall=g.exploration125.plan.solids.find(b=>b.kind==='settlement-building'),target={x:wall.x+wall.w/2,y:wall.y+wall.h/2};
 assert.equal(g.friendlyPositionClear(g.player,target.x,target.y),false);
 const alternate=g.fieldcraft.service(g.player,target);assert.notEqual(alternate,target,'a nonphysical target inside a new solid is not a valid service position');
 if(alternate)assert.ok(g.friendlyPositionClear(g.player,alternate.x,alternate.y));
});

test('terrain133: real movement stops at new houses and benches instead of crossing their public collider',()=>{
 const{g}=boot131({seed:'17118'}),p=g.player;
 for(const kind of ['settlement-building','terrain-prop']){
  let checked=false;
  for(const box of g.exploration125.plan.solids.filter(b=>b.kind===kind)){
   const start={x:box.x-40,y:box.y+box.h/2};if(!g.friendlyPositionClear(p,start.x,start.y))continue;
   Object.assign(p,start);g.moveFriendly(p,box.w/2+60,0);
   assert.ok(g.friendlyPositionClear(p,p.x,p.y),kind+' movement must finish outside the obstacle');
   assert.ok(p.x<box.x,kind+' cannot cross its left wall');checked=true;break;
  }
  assert.ok(checked,'need a clear physical approach to '+kind);
 }
});

test('terrain133: work rays cannot collect or build through a generated palisade',()=>{
 const{g}=boot131({seed:'17118'}),p=g.player;let checked=false;
 for(const box of g.exploration125.plan.solids.filter(b=>b.kind==='palisade'&&b.w<20&&b.h>60)){
  const start={x:box.x-24,y:box.y+box.h*.6},target={x:box.x+box.w+24,y:start.y};
  if(!g.friendlyPositionClear(p,start.x,start.y)||!g.friendlyPositionClear(p,target.x,target.y))continue;
  Object.assign(p,start);assert.equal(g.workerCanWorkAt(p,target,100),false,'the wall interrupts a short work ray');
  const onSameSide={x:start.x-10,y:start.y};if(g.friendlyPositionClear(p,onSameSide.x,onSameSide.y))assert.equal(g.workerCanWorkAt(p,onSameSide,100),true);
  checked=true;break;
 }
 assert.ok(checked,'need a fence with both exterior approaches clear');
});
