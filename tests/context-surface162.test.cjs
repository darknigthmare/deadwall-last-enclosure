'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const models=new Map();
function fixture(seed){
 if(!models.has(seed)){
  const world=W.create(seed,10,{detailVersion:10}),p=world.contextSites160().find(p=>p.programme160==='DW-0262');assert.ok(p,'The real roundabout is installed for seed '+seed);
  const plan=world.plan(p,0),ring=plan.terrain160.find(o=>o.shape==='annulus'),island=plan.terrain160.find(o=>o.shape==='ellipse');
  assert.ok(ring&&island);models.set(seed,{world,p,plan,ring,island});
 }
 return models.get(seed);
}
function probe(f,x,y,margin=0){const q=G.global(f.p,x,y);return{point:q,terrain:f.world.terrainAt160(q.x,q.y),drive:f.world.drivewayAt(q.x,q.y,margin)};}

test('162 real roundabout surfaces distinguish the road, its island and unpainted bounding corners on three seeds',()=>{
 for(const seed of [0,42,17117]){
  const f=fixture(seed),{ring:r,island:i}=f,cx=r.x+r.w/2,cy=r.y+r.h/2;
  const bank=probe(f,cx-i.w*.22,cy);assert.equal(bank.terrain?.kind,'bank');assert.equal(bank.drive,null,'An impassable vehicle island never receives the road surface');
  assert.equal(f.world.vehicleClear(bank.point.x,bank.point.y,f.p.a,1,.5),false);
  const outside=probe(f,r.x+.1,r.y+.1);assert.equal(outside.terrain,null,'The rectangular bounding corner is outside the painted ellipse');assert.equal(outside.drive,null);
  const road=probe(f,i.x+.1,i.y+.1);assert.equal(road.terrain?.id,r.id,'An island bounding corner outside its ellipse remains annular road');assert.equal(road.drive?.context160,f.p.id);
 }
});

test('162 curved road margins measure distance from the actual inner and outer boundaries',()=>{
 const f=fixture(42),r=f.ring,cx=r.x+r.w/2,cy=r.y+r.h/2;
 // This interior point is 20 cm from the right-hand inner ellipse boundary,
 // away from the north/south pedestrian path and the tangential road arms.
 const x=cx+r.innerRx-.2,y=cy;
 assert.equal(probe(f,x,y,0).drive,null);assert.equal(probe(f,x,y,.1).drive,null);assert.equal(probe(f,x,y,.3).drive?.context160,f.p.id);
 const outsideX=cx+r.w/2+.2;
 assert.equal(probe(f,outsideX,y,0).drive,null);assert.equal(probe(f,outsideX,y,.1).drive,null);assert.equal(probe(f,outsideX,y,.3).drive?.context160,f.p.id);
 assert.equal(probe(f,cx-r.innerRx/2,cy,.1).drive,null,'A small shoulder allowance does not fill the island');
});

test('162 surface queries preserve generated sites, plans, seed state and independent return values',()=>{
 const f=fixture(42),before=hash([f.world.pois,f.world.roads,f.plan]),r=f.ring,i=f.island;
 for(let n=0;n<10;n++){const q=probe(f,i.x+.1,i.y+.1,.1);assert.ok(q.drive);q.drive.a.x=-1;q.drive.b.y=-1;q.terrain.kind='modified-return-only';}
 assert.equal(hash([f.world.pois,f.world.roads,f.plan]),before);
 assert.equal(probe(f,i.x+.1,i.y+.1).terrain.id,r.id);
 for(const [x,y,z]of [[NaN,1,0],[1,Infinity,0],[1,1,1]])assert.equal(f.world.terrainAt160(x,y,z),null);
});
