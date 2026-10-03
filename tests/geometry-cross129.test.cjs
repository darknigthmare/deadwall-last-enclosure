'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
test('1.29 geometry cross-review: rotated parking vehicle keeps its full radius and exact ignored ID',()=>{
 const w=W.create(129731,4),p=w.pois.find(p=>p.type==='house'),car={...p.parking[0],a:.947};p.parking=[car];p.outdoor=[];const pl=w.plan(p,0);pl.walls=[];pl.objects=[];
 for(const radius of[.015,.32,2.5]){const a=G.global(car,-2-radius,car.h/2),b=G.global(car,car.w+2+radius,car.h/2);assert.equal(w.line(a,b,0,null,null,radius),false);assert.equal(w.line(a,b,0,null,car.id,radius),true);assert.equal(w.line(a,b,0,null,car.id+'-wrong',radius),false);}
});
test('1.29 geometry cross-review: tree and rock collision discs across a chunk seam are never skipped',()=>{
 const w=W.create(17117,4),chunk=w.chunk(16,15),tree={id:'qa-seam-tree',x:4096,y:4095,r:.25},rock={id:'qa-seam-rock',x:4104,y:4095,r:.8};chunk.trees.push(tree);chunk.rocks.push(rock);
 for(const t of[tree,rock])for(const radius of[0,.05,.32,2.5]){
  const sum=t.r+radius,a={x:t.x-sum-1,y:t.y+sum-.002},b={x:t.x+sum+1,y:a.y};
  assert.equal(w.blocked(t.x,a.y,radius),true);assert.equal(w.line(a,b,0,null,null,radius),false);assert.equal(w.line(a,b,0,null,t.id,radius),true);
  const above={x:a.x,y:t.y+sum+.002},bAbove={x:b.x,y:above.y};assert.equal(w.line(above,bAbove,0,null,null,radius),true);
 }
});
test('1.29 geometry cross-review: ignored IDs never remove walls or cross floors, including basement',()=>{
 const w=W.create(731,4),p=w.pois.find(p=>p.type==='bunker');p.parking=[];p.outdoor=[];
 for(const z of[-1,0]){const pl=w.plan(p,z);pl.walls=[{id:'same-id',x:6,y:0,w:.1,h:p.h}];pl.objects=[];const a=G.global(p,3,p.h/2),b=G.global(p,10,p.h/2);assert.equal(w.line(a,b,z,z?p.id:null,'same-id',.32),false);}
 const a=G.global(p,3,3),b=G.global(p,4,3);assert.equal(w.line(a,b,-1,p.id,null,.32),true);assert.equal(w.line(a,b,-1,'missing-building',null,.32),false);assert.equal(w.line(a,b,9,p.id,null,.32),false);
 assert.equal(w.line(a,G.global(p,p.w+.01,3),-1,p.id,null,0),false);
});
test('1.29 geometry cross-review: 144 vehicle-radius and upper-floor rays cannot cross sampled physical colliders',()=>{
 const w=W.create(17117,4),random=G.rng(129731);let tested=0,blocked=0,clear=0;
 for(const p of w.pois.filter(p=>p.levels.length>1).slice(0,12))for(const z of[0,p.levels.find(z=>z!==0)])for(let i=0;i<6;i++){
  const radius=[.015,.32,2.5][i%3],a=G.global(p,radius+random()*Math.max(.1,p.w-2*radius),radius+random()*Math.max(.1,p.h-2*radius)),b=G.global(p,radius+random()*Math.max(.1,p.w-2*radius),radius+random()*Math.max(.1,p.h-2*radius)),result=w.line(a,b,z,z?p.id:null,null,radius),n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.02));
  let hit=false;for(let k=0;k<=n;k++)if(w.blocked(a.x+(b.x-a.x)*k/n,a.y+(b.y-a.y)*k/n,radius,z,z?p.id:null)){hit=true;break;}
  if(hit){blocked++;assert.equal(result,false,p.id+':'+z+':'+radius);}else if(result)clear++;tested++;
 }
 assert.equal(tested,144);assert.ok(blocked>100);assert.ok(clear>0);
});
