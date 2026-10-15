'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),H=require('../src/hydrology165.js'),Geo=require('../src/geography135.js');
const seeds=[0,17117,84329],worlds=new Map();
const world=seed=>{if(!worlds.has(seed))worlds.set(seed,H.create({seed,size:C.GeographyRules135.size,home:Geo.home(seed,9)}));return worlds.get(seed);};
const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};

test('hydrology165 validates seed, geographic context and finite queries',()=>{
 for(const seed of [-1,NaN,1.1,4294967296])assert.throws(()=>H.create({seed,size:24576,home:{x:12000,y:12000}}));
 assert.throws(()=>H.create({seed:0,size:24576}));const w=world(0);assert.throws(()=>w.sample(NaN,0));assert.throws(()=>w.blockedCircle(0,0,-1));assert.throws(()=>w.featuresIn({x:0,y:0,w:-1,h:1}));assert.throws(()=>w.withRoads([{a:{x:0,y:0},b:{x:1,y:1},width:0}]));
});
test('hydrology165 is independent of Math.random and deterministic after interleaved worlds',()=>{
 const original=Math.random;Math.random=()=>{throw Error('RNG global interdit');};try{const a=H.create({seed:17117,size:24576,home:Geo.home(17117,9)});H.create({seed:84329,size:24576,home:Geo.home(84329,9)});const b=H.create({seed:17117,size:24576,home:Geo.home(17117,9)});assert.deepEqual(a.features,b.features);assert.deepEqual(a.sample(9000,11000),b.sample(9000,11000));}finally{Math.random=original;}
});
for(const seed of seeds){
 test(`hydrology165 ${seed}: all seven actual water kinds and bounded immutable geometry`,()=>{
  const w=world(seed),s=w.stats();assert.deepEqual(Object.keys(s.kinds).filter(k=>s.kinds[k]>0).sort(),Object.keys(C.Hydrology165Rules.kinds).sort());assert.ok(s.features<=C.Hydrology165Rules.spatial.maxFeatures);assert.ok(s.segments<6000);assert.ok(s.bins<10000);assert.ok(Object.isFrozen(w.features));assert.ok(w.features.every(f=>Object.isFrozen(f.points)&&f.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=w.size&&p.y<=w.size)));assert.doesNotThrow(()=>JSON.stringify(w.features));
 });
 test(`hydrology165 ${seed}: sea and ocean touch the actual geographic edge`,()=>{
  const w=world(seed),v=w.size*.43,u=w.coast.inlandAt(v),sea=w.coast.toWorld(u-30,v),ocean=w.coast.toWorld(10,v),land=w.coast.toWorld(u+50,v);assert.equal(w.sample(sea.x,sea.y).kind,'sea');assert.equal(w.sample(ocean.x,ocean.y).kind,'ocean');assert.equal(w.sample(land.x,land.y).water,false);assert.equal(w.sample(land.x,land.y).salinity,'salt');assert.equal(w.sample(land.x,land.y).nearestKind,'sea');assert.ok(w.coast.containsLand(land.x,land.y));assert.ok(!w.coast.containsLand(sea.x,sea.y));assert.equal(w.features.find(f=>f.kind==='sea').outletId,'H165:ocean');assert.equal(w.features.find(f=>f.kind==='ocean').outletId,'outside-region');
 });
 test(`hydrology165 ${seed}: every current flows downhill to a connected receiving water`,()=>{
  const w=world(seed),by=new Map(w.features.map(f=>[f.id,f]));for(const f of w.features.filter(f=>f.flowing)){assert.ok(by.has(f.outletId));for(let i=1;i<f.points.length;i++){assert.ok(f.points[i].level<=f.points[i-1].level+1e-8,`${f.id} surface must descend`);assert.ok(w.coast.toLocal(f.points[i].x,f.points[i].y).u<w.coast.toLocal(f.points[i-1].x,f.points[i-1].y).u,`${f.id} must flow toward coast without reversing`);}const end=f.points.at(-1),target=by.get(f.outletId);if(f.kind==='river')assert.equal(w.sample(end.x,end.y).salinity,'salt');else assert.ok(Math.min(...target.points.slice(1).map((p,i)=>distance(end,target.points[i],p)))<1e-7);const p=f.points[Math.floor(f.points.length/2)],sample=w.sample(p.x,p.y);assert.ok(sample.water);assert.equal(sample.opaque,false);if(sample.kind===f.kind)assert.ok(Math.abs(Math.hypot(sample.flow.x,sample.flow.y)-1)<1e-8);}
 });
 test(`hydrology165 ${seed}: D17 and the inner approaches remain dry`,()=>{
  const w=world(seed),h=Geo.home(seed,9),radius=C.Hydrology165Rules.protection.homeRadius;for(let a=0;a<Math.PI*2;a+=Math.PI/24){const x=h.x+Math.cos(a)*(radius-1),y=h.y+Math.sin(a)*(radius-1);assert.equal(w.blockedCircle(x,y,.32),false);}for(const f of w.features.filter(f=>f.flowing))for(let i=1;i<f.points.length;i++)assert.ok(distance(h,f.points[i-1],f.points[i])>=radius+f.width/2);assert.equal(w.intersects({x:h.minX,y:h.minY,w:128,h:128}),false);
 });
 test(`hydrology165 ${seed}: lake outlet and wet isolated basin semantics are explicit`,()=>{
  const w=world(seed);for(const f of w.features.filter(f=>['lake','pond','pool'].includes(f.kind))){assert.ok(f.shape==='polygon');assert.ok(w.sample(f.ellipse.cx,f.ellipse.cy).water);if(f.kind==='lake'){assert.ok(f.connected&&f.inletId===f.outletId);assert.ok(w.features.some(r=>r.id===f.outletId&&r.kind==='river'));assert.ok(f.points.every(p=>p.level===f.level));}else{assert.equal(f.outletId,null);assert.equal(f.closedBasin,true);assert.ok(f.moisture>=C.Hydrology165Rules.basins[f.kind].moisture);}}
 });
 test(`hydrology165 ${seed}: spatial culling and water-distance continuity agree`,()=>{
  const w=world(seed),f=w.features.find(f=>f.kind==='pool'),p=f.ellipse;assert.ok(w.featuresIn({x:p.cx-1,y:p.cy-1,w:2,h:2}).some(q=>q.id===f.id));assert.ok(w.intersects({x:p.cx-.1,y:p.cy-.1,w:.2,h:.2}));const q={x:p.cx+p.rx+12,y:p.cy};assert.ok(w.sample(q.x,q.y).distanceToWater>0);const eps=.00001,a=w.sample(q.x-eps,q.y),b=w.sample(q.x+eps,q.y);assert.ok(Math.abs(a.distanceToWater-b.distanceToWater)<=eps*2.01);assert.equal(w.sample(p.cx,p.cy).movementBlocked,true);assert.equal(w.lineBlocked({x:p.cx-p.rx-5,y:p.cy},{x:p.cx+p.rx+5,y:p.cy},.32),true);
 });
}
test('hydrology165 contours a settlement rather than erasing a river segment',()=>{
 const base=world(0),river=base.features.find(f=>f.kind==='river'),p=river.points[70],settlement={id:'town-test',x:p.x,y:p.y,radius:300},w=H.create({seed:0,size:24576,home:Geo.home(0,9),settlements:[settlement]});assert.equal(w.intersects({x:p.x-150,y:p.y-150,w:300,h:300}),false);assert.equal(w.stats().kinds.river,base.stats().kinds.river);for(const f of w.features.filter(f=>f.flowing))for(let i=1;i<f.points.length;i++)assert.ok(distance(p,f.points[i-1],f.points[i])>=335+f.width/2);
});
test('hydrology165 real road crossing preserves visible water and enforces deck width',()=>{
 const base=world(0),river=base.features.find(f=>f.kind==='river'),a=river.points[80],b=river.points[81],x=(a.x+b.x)/2,y=(a.y+b.y)/2,angle=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2,road={id:'real-road',a:{x:x-Math.cos(angle)*30,y:y-Math.sin(angle)*30},b:{x:x+Math.cos(angle)*30,y:y+Math.sin(angle)*30},width:6},w=base.withRoads([road]);assert.equal(base.crossings.length,0);assert.equal(w.crossings.length,1);const c=w.crossings[0];assert.equal(c.waterId,river.id);assert.equal(w.sample(x,y).water,true);assert.equal(w.sample(x,y).opaque,false);assert.equal(w.sample(x,y).movementBlocked,false);assert.equal(w.blockedCircle(x,y,.32),false);assert.equal(w.lineBlocked(road.a,road.b,.32),false);assert.equal(w.blockedCircle(x+Math.sin(angle)*4,y-Math.cos(angle)*4,.32),true);assert.equal(w.blockedCircle(x,y,3),true);assert.ok(w.intersects({x:x-.1,y:y-.1,w:.2,h:.2}));assert.strictEqual(w.features,base.features);
});
test('hydrology165 clips coastal asphalt on land and never bridges sea or ocean',()=>{
 const w=world(84329),v=9000,a=w.coast.toWorld(0,v),b=w.coast.toWorld(2000,v),road={id:'coast-road',a,b,width:7},result=w.clipRoad(road,4);assert.equal(result.length,1);assert.ok(result[0].coastalTerminus165);assert.ok(w.coast.containsLand(result[0].b.x,result[0].b.y));const start=w.coast.toLocal(result[0].a.x,result[0].a.y);assert.ok(Math.abs(start.u-w.coast.inlandAt(start.v)-4)<1e-6);assert.equal(w.withRoads([road]).crossings.length,0);assert.equal(w.clipRoad({id:'ocean-road',a:w.coast.toWorld(10,v),b:w.coast.toWorld(10,v+100),width:7}).length,0);
});
test('hydrology165 optional basins preserve existing road corridors',()=>{
 const base=world(17117),f=base.features.find(f=>f.kind==='lake'),p=f.ellipse,road={id:'basin-road',a:{x:p.cx-500,y:p.cy},b:{x:p.cx+500,y:p.cy},width:7},w=H.create({seed:17117,size:24576,home:Geo.home(17117,9),roads:[road]});assert.ok(!w.features.some(q=>q.id===f.id));assert.ok(w.features.some(q=>q.id===f.outletId));
});
test('hydrology165 crossing geometry covers a road parallel to a wet river bank',()=>{
 const base=world(0),river=base.features.find(f=>f.kind==='river'),a=river.points[70],b=river.points[71],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),offset=river.width/4,at=t=>({x:a.x+dx*t-dy/length*offset,y:a.y+dy*t+dx/length*offset}),road={id:'parallel-road',a:at(.2),b:at(.8),width:6},w=base.withRoads([road]);assert.equal(w.crossings.length,1);assert.equal(w.sample(road.a.x,road.a.y).water,true);assert.equal(w.sample(road.b.x,road.b.y).water,true);assert.equal(w.lineBlocked(road.a,road.b,.32),false);assert.ok(w.crossings[0].length<=C.Hydrology165Rules.crossings.maxSpan);
});
test('hydrology165 bridge decks cover a real road node in the water',()=>{
 const base=world(0),river=base.features.find(f=>f.kind==='river'),a=river.points[80],b=river.points[81],x=(a.x+b.x)/2,y=(a.y+b.y)/2,angle=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2,node={x,y},roads=[{id:'node-west',a:{x:x-Math.cos(angle)*30,y:y-Math.sin(angle)*30},b:node,width:6},{id:'node-east',a:node,b:{x:x+Math.cos(angle)*30,y:y+Math.sin(angle)*30},width:6}],w=base.withRoads(roads);assert.equal(w.crossings.length,2);assert.equal(w.blockedCircle(node.x,node.y,.32),false);for(const road of roads)assert.equal(w.lineBlocked(road.a,road.b,.32),false);assert.ok(w.crossings.every(c=>c.length>4));
});
for(const seed of [3,7,23,4294967295])test(`hydrology165 ${seed}: tributaries match the receiver after lake flattening`,()=>{
 const w=H.create({seed,size:24576,home:Geo.home(seed,9)});let lakeJunctions=0;for(const stream of w.features.filter(f=>f.kind==='stream')){const receiver=w.features.find(f=>f.id===stream.outletId),end=stream.points.at(-1),join=receiver.points.find(p=>p.x===end.x&&p.y===end.y);assert.ok(join);assert.equal(end.level,join.level);for(let i=1;i<stream.points.length;i++)assert.ok(stream.points[i].level<=stream.points[i-1].level);if(w.features.some(f=>f.kind==='lake'&&f.outletId===receiver.id&&f.level===join.level))lakeJunctions++;}assert.ok(lakeJunctions>0);
});
