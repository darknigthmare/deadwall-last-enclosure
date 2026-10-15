'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../src/frontage174.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const road=(id,y,width=6,z=0)=>({id,a:{x:-100,y},b:{x:100,y},width,z});
const parcel=()=>({id:'P0001',road:'far',x:0,y:40,w:12,h:10,a:0,parking:[],outdoor:[],drive:{a:{x:0,y:0},b:{x:0,y:30},width:4}});
test('174 frontage connects the first carriageway, not one beyond an intervening public road',()=>{
 const p=parcel(),roads=[road('far',0),road('near',12)],before=JSON.stringify([p,roads]),r=F.resolve(p,roads);
 assert.ok(r.ok);assert.equal(r.roadId,'near');assert.deepEqual(r.connection.a,{x:0,y:12});assert.equal(r.surface.a.y,15);assert.deepEqual(r.surface.b,p.drive.b);assert.equal(r.surface.lineCap,'butt');assert.ok(r.corrected);assert.equal(r.removedLength,12);
 assert.equal(JSON.stringify([p,roads]),before);assert.ok(Object.isFrozen(r.surface.a));
});
test('174 frontage full-width corridor rejects parallel and oblique clipping, including endpoint capsules',()=>{
 const p=parcel(),base=road('far',0),parallel={id:'side',a:{x:3,y:12},b:{x:3,y:40},width:4,z:0};
 assert.equal(F.resolve(p,[base,parallel]).reason,'foreign-road-corridor');
 const oblique={id:'oblique',a:{x:6,y:10},b:{x:2.8,y:22},width:3,z:0};
 assert.equal(F.resolve(p,[base,oblique]).reason,'foreign-road-corridor');
 assert.ok(F.capsuleHitsBox({id:'end',a:{x:5,y:15},b:{x:2.3,y:15},width:3},{x:0,y:15,w:2,h:2,a:0}));
 assert.ok(!F.capsuleHitsBox({id:'clear',a:{x:5,y:15},b:{x:4,y:15},width:3},{x:0,y:15,w:2,h:2,a:0}));
});
test('174 no invented junction across a level, controlled road, shallow join or missing source',()=>{
 const p=parcel();assert.equal(F.resolve(p,[road('overhead',12,6,1),road('far',0)]).roadId,'far');
 assert.equal(F.resolve(p,[{...road('near',12),roadClass:'motorway'},road('far',0)]).reason,'controlled-access-road');
 assert.equal(F.resolve(p,[]).ok,false);assert.equal(F.resolve({...p,drive:{...p.drive,a:p.drive.b}},[road('far',0)]).ok,false);
 assert.equal(F.resolve(p,[{id:'shallow',a:{x:-1,y:-10},b:{x:1,y:10},width:2}]).reason,'shallow-join');
 assert.equal(F.valid({...road('bad',0),z:NaN}),false);assert.equal(F.resolve(p,[road('far',0)],{clearance:NaN}).ok,false);
});
test('174 oblique surface stops on the near edge and split collinear roads remain one carriageway',()=>{
 const p=parcel(),r={id:'diagonal',a:{x:-100,y:-100},b:{x:100,y:100},width:6};const out=F.resolve(p,[r]);assert.ok(out.ok);
 assert.ok(Math.abs(G.nearest(out.surface.a,r.a,r.b).d-3)<1e-8);
 const a={id:'a',a:{x:-100,y:0},b:{x:0,y:0},width:6},b={id:'b',a:{x:0,y:0},b:{x:100,y:0},width:6};
 assert.ok(F.resolve(p,[a,b]).ok);assert.equal(F.resolve(p,[a,b]).connection.a.y,0);
});
test('174 grouped parcels preserve parked vehicles, fences and neighbours rather than forcing an entrance',()=>{
 const p=parcel(),out=F.resolve(p,[road('far',0)]);assert.equal(F.groupConflicts(out,p).length,0);
 p.parking.push({id:'bus',x:1,y:15,w:10.4,h:2.55,a:.6});assert.equal(F.groupConflicts(out,p)[0].reason,'parked-vehicle');p.parking=[];
 const q=G.local(p,0,15);p.outdoor.push({id:'gate',kind:'fence',x:q.x-2,y:q.y-.2,w:4,h:.4});assert.equal(F.groupConflicts(out,p)[0].reason,'outdoor-object');p.outdoor=[];
 assert.equal(F.groupConflicts(out,p,[{id:'P0002',reserve:{l:-1,r:1,t:12,b:16}}])[0].reason,'foreign-parcel-reserve');
});
test('174 actual G10 lookup, guidance and surface use one derived frontage, never mutate the source',()=>{
 const w=W.create(17117,10),snapshot=JSON.stringify([w.pois,w.roads]);let changed=0,rejected=0;
 for(const p of w.pois){const r=w.frontageFor(p);if(!r.ok){rejected++;assert.equal(w.driveFor(p),null);assert.equal(w.connectionFor(p),null);continue;}
  assert.equal(w.driveFor(p),r.surface);assert.equal(w.connectionFor(p),r.connection);assert.equal(w.connectionFor({id:p.id,drive:p.drive}),r.connection);
  if(r.corrected){changed++;assert.ok(r.removedLength>0);const d=r.surface,x=(d.a.x+d.b.x)/2,y=(d.a.y+d.b.y)/2;assert.ok(w.drivewayAt(x,y));}
 }
 assert.ok(changed>0);assert.equal(JSON.stringify([w.pois,w.roads]),snapshot);console.log('FRONTAGE174 '+JSON.stringify({sites:w.pois.length,changed,rejected}));
});
