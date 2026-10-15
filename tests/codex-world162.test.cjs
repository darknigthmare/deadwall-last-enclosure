'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const seeds=[42,17117,17118,135135,271828],nativeTypes=new Set(G.PRESETS.map(p=>p.id));
test('162: real G8 parcel transforms keep anchored colliders, service fronts, previous geometry and finite source stocks',()=>{
 const result={seeds:seeds.length,sites:0,floors:0,anchored:0,newlyBlockedFronts:[],baselineBlockedFronts:0,types:new Set(),sides:new Set(),programmeSites:0};
 for(const seed of seeds){
  const baseline=W.create(seed,8,{detailVersion:2}),world=W.create(seed,8,{detailVersion:3});
  assert.equal(hash(world.pois),hash(baseline.pois));assert.equal(hash(world.roads),hash(baseline.roads));
  const selected=new Map();for(const p of world.pois)if(nativeTypes.has(p.type)&&!selected.has(p.type))selected.set(p.type,p);
  const programmes=world.pois.filter(p=>p.generation===8);
  // Bound normal CI to all 62 native families plus 16 spread programme sites.
  // Programme IDs are not independent native architecture families.
  const sites=[...new Set([...selected.values(),...Array.from({length:16},(_,i)=>programmes[Math.floor(i*programmes.length/16)]).filter(Boolean)])];
  for(const p of sites){result.sites++;result.types.add(p.type);if(p.generation===8)result.programmeSites++;
   const old=baseline.pois.find(q=>q.id===p.id);
   for(const z of p.levels){result.floors++;
    const prior=baseline.detailAt(old,z),current=world.detailAt(p,z),plan=world.plan(p,z);
    assert.equal(hash(plan),hash(baseline.plan(old,z)),seed+' '+p.id+' source plan/stock changed');
    assert.deepEqual(current.outdoor,prior.outdoor);assert.deepEqual(current.interior.filter(o=>!o.anchored160),prior.interior);
    const before=hash(current);
    for(const o of current.interior.filter(o=>o.anchored160)){
     result.anchored++;result.sides.add(o.support160.side);assert.equal(o.resource,undefined);assert.equal(o.amount,undefined);
     const centre=G.global(p,o.x+o.w/2,o.y+o.h/2),local=G.local(p,centre.x,centre.y);
     assert.ok(Math.abs(local.x-o.x-o.w/2)<1e-8&&Math.abs(local.y-o.y-o.h/2)<1e-8,'Parcel rotation round trip');
     assert.ok(world.blocked(centre.x,centre.y,.05,z,p.id),'Real world must collide with visible furniture');
     const a=G.global(p,o.x-.1,o.y+o.h/2),b=G.global(p,o.x+o.w+.1,o.y+o.h/2);
     assert.equal(world.line(a,b,z,p.id,null,.05),false,'Real swept ray cannot cross anchored collider');
     const f=o.front160,front=G.global(p,f.x+f.w/2,f.y+f.h/2);
     if(baseline.blocked(front.x,front.y,.32,z,p.id))result.baselineBlockedFronts++;
     else if(world.blocked(front.x,front.y,.32,z,p.id))result.newlyBlockedFronts.push({seed,poi:p.id,type:p.type,z,id:o.id});
    }
    assert.equal(hash(current),before,'Collision queries must not mutate details');
   }
  }
  const first=world.pois[0],original=hash(world.detailAt(first,0)),originalPlan=hash(world.plan(first,0));
  for(const p of world.pois.slice(1,82))for(const z of p.levels)world.detailAt(p,z);
  assert.equal(hash(world.detailAt(first,0)),original,'Cache eviction must not reroll furniture');
  assert.equal(hash(world.plan(first,0)),originalPlan,'Cache eviction must not replenish source amounts');
  console.log('SEED162 '+JSON.stringify({seed,sites:sites.length,floors:result.floors,anchored:result.anchored}));
 }
 assert.ok(result.sites>100&&result.floors>150&&result.anchored>100&&result.programmeSites>0);
 assert.equal(result.sides.size,4);assert.deepEqual(result.newlyBlockedFronts,[]);
 console.log('WORLD162 '+JSON.stringify({...result,types:[...result.types].sort(),sides:[...result.sides].sort()}));
});
