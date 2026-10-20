'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const C=require('../src/core.js'),City=require('../src/city-catalogue150.js'),H=require('./helpers/city-content150.cjs');
const expected={
 returnService201:{tier:1,count:4,cost:{wood:117,scrap:147,stone:40,fuel:8,food:10}},
 craftCourt201:{tier:2,count:4,cost:{wood:110,scrap:260,stone:65,fuel:28}},
 staggeredLines201:{tier:3,count:31,cost:{wood:192,scrap:368,stone:439,medicine:12}},
 powerCourt201:{tier:5,count:5,cost:{wood:187,scrap:837,stone:540,fuel:78}},
 medicalRecovery201:{tier:9,count:5,cost:{wood:395,scrap:1050,stone:735,medicine:63,fuel:20}},
 siegeSupply201:{tier:10,count:5,cost:{wood:595,scrap:2560,stone:1955,ammo:160,fuel:55}}
};
const ids=Object.keys(expected),legacy=['courtyard','airlock','camp','returnRelay','foodCourt','materialsCourt','entryBastion','observationRelay','careCourt','spikedApproach','maintenanceRedoubt','forwardCare150','electricFoodCourt150','watchedBastion150','continuitySector150'];
const clone=x=>JSON.parse(JSON.stringify(x)),plan=id=>C.Dayworks.PLANS.find(p=>p.id===id);
function dimensions(item){const d=C.BUILDINGS[item.type];return item.rotation%2?[d.size[1],d.size[0]]:d.size;}
function occupied(items){const cells=new Set();for(const i of items){const[w,h]=dimensions(i);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const key=(i.gx+x)+':'+(i.gy+y);assert.ok(!cells.has(key),'overlapping foundations at '+key);cells.add(key);}}return cells;}

test('201 programmes retain all fifteen historical plan definitions and footprints verbatim',()=>{
 assert.deepEqual(C.Dayworks.PLANS.filter(p=>!ids.includes(p.id)).map(p=>p.id),legacy);
 const historical=legacy.map(id=>({plan:plan(id),footprint:C.Dayworks.footprint(id,0,0)}));
 assert.equal(createHash('sha256').update(JSON.stringify(historical)).digest('hex'),'a818a4c64057489c398ea5cc93141e760afc866bacd716a5eefde64bd82f08b6');
 assert.equal(new Set(C.Dayworks.PLANS.map(p=>p.id)).size,C.Dayworks.PLANS.length);
});

for(const[id,spec]of Object.entries(expected)){
 test('201 '+id+' pays exact native foundations, keeps its real age/prerequisites and leaves service routes open',()=>{
  const p=plan(id),items=C.Dayworks.footprint(id,0,0),cells=occupied(items),sum={},seen=new Set(['-1:-1']),queue=[[-1,-1]];
  assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.layout));assert.equal(items.length,spec.count);assert.ok(items.length<=C.Dayworks.RULES.maxPlanCells);
  for(const item of items){const d=C.BUILDINGS[item.type],[w,h]=dimensions(item);assert.ok(d&&item.rotation>=0&&item.rotation<=3);
   assert.ok(item.gx>=0&&item.gy>=0&&item.gx+w<=p.w&&item.gy+h<=p.h);
   for(const[k,n]of Object.entries(d.cost))sum[k]=(sum[k]||0)+n;
  }
  assert.deepEqual(sum,spec.cost);assert.equal(Math.max(...items.map(i=>C.BUILDINGS[i.type].unlockTier)),spec.tier);
  const quote=C.Dayworks.quote(items,C.BUILDINGS,()=>({valid:true}),spec.tier,()=>true);assert.equal(quote.ok,true);assert.deepEqual(quote.cost,spec.cost);
  assert.equal(C.Dayworks.quote(items,C.BUILDINGS,()=>({valid:true}),spec.tier-1,()=>true).ok,false);
  for(const required of new Set(items.map(i=>C.BUILDINGS[i.type].requires).filter(Boolean)))assert.equal(C.Dayworks.quote(items,C.BUILDINGS,()=>({valid:true}),spec.tier,type=>type!==required).ok,false);
  // Treat both gates as solid too: service access must survive locked gates,
  // using the deliberately open sides, rather than relying on free passage.
  for(let n=0;n<queue.length;n++){const[x,y]=queue[n];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+':'+ny;if(nx< -1||ny< -1||nx>p.w||ny>p.h||cells.has(key)||seen.has(key))continue;seen.add(key);queue.push([nx,ny]);}}
  for(let y=-1;y<=p.h;y++)for(let x=-1;x<=p.w;x++)if(!cells.has(x+':'+y))assert.ok(seen.has(x+':'+y),'isolated service cell '+x+':'+y);
  for(const i of items){const[w,h]=dimensions(i),edges=[];for(let x=0;x<w;x++)edges.push([i.gx+x,i.gy-1],[i.gx+x,i.gy+h]);for(let y=0;y<h;y++)edges.push([i.gx-1,i.gy+y],[i.gx+w,i.gy+y]);assert.ok(edges.some(([x,y])=>seen.has(x+':'+y)),i.type+' has an exterior approach');}
  const choice=City.create(C).items.find(i=>i.kind==='plan'&&i.id===id);assert.ok(choice);assert.equal(choice.tier,spec.tier);assert.deepEqual(choice.cost,spec.cost);assert.ok(choice.conditions.some(c=>c.kind==='building'&&c.id==='planningOffice'));
 });

 test('201 '+id+' uses native preview, one paid funding, unfinished supports and exact Continue',()=>{
  // Advanced fixture grants prior knowledge, storage, prerequisites and funds.
  // Only the new ensemble uses the real preview/payment transaction below.
  const {g}=H.fresh();H.advanced(g);H.prepare(g,'planningOffice');const items=C.Dayworks.footprint(id,0,0);
  for(const i of items)if(C.BUILDINGS[i.type].requires)H.prepare(g,C.BUILDINGS[i.type].requires);
  g.refreshMetrics(true);for(const k of C.RESOURCE_KEYS)g.resources[k]=Math.min(5000,g.storage);
  const at=H.planPosition(g,id),before=H.stable(g),stock={...g.resources},oldIds=new Set(g.world.buildings.keys()),capacities={storage:g.storage,housing:g.housing,score:g.cityScore,power:g.powerGenerated},health=g.player.health,units=g.units.length;
  assert.equal(g.dayworks.beginPlan(id),true);assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);assert.deepEqual(H.stable(g),before);
  assert.equal(g.dayworks.commitPlan(),true);const jobs=[...g.world.buildings.values()].filter(b=>!oldIds.has(b.id)),newIds=jobs.map(b=>b.id);
  assert.equal(jobs.length,spec.count);assert.ok(jobs.every(b=>b.progress===0&&!b.completed));
  for(const k of C.RESOURCE_KEYS)assert.equal(g.resources[k],stock[k]-(spec.cost[k]||0));
  assert.deepEqual({storage:g.storage,housing:g.housing,score:g.cityScore,power:g.powerGenerated},capacities);assert.equal(g.player.health,health);assert.equal(g.units.length,units);
  for(const b of jobs)if(b.def.battery)assert.equal(g.powerGrid.charge(b.id),0);
  assert.equal(g.dayworks.commitPlan(),false);H.continueExactly(g);assert.equal(g.dayworks.snapshot().stats.plans,1);
  assert.ok(newIds.every(bid=>g.world.buildings.has(bid)&&!g.world.buildings.get(bid).completed));
  // Separate completed-geometry fixture, not a claimed naturally built city.
  // Validate actual body/collision/path owners with the proposed layout intact.
  const built=newIds.map(bid=>g.world.buildings.get(bid));for(const b of built){b.progress=1;b.health=b.maxHealth;}g.world.navigationVersion++;g.refreshMetrics(true);
  for(const b of built)if(b.def.gate)assert.equal(g.setGateMode('closed',b),true,'native gate closure');
  const probes=[];for(let x=at.x-1;x<=at.x+plan(id).w;x++)probes.push({x,y:at.y-1},{x,y:at.y+plan(id).h});
  const clear=q=>g.friendlyPositionClear(g.player,q.x*C.TILE+C.TILE/2,q.y*C.TILE+C.TILE/2),start=probes.find(clear);assert.ok(start,'free exterior approach');
  for(const b of built){const goals=[];for(let x=b.gx;x<b.gx+b.w;x++)goals.push({x,y:b.gy-1},{x,y:b.gy+b.h});for(let y=b.gy;y<b.gy+b.h;y++)goals.push({x:b.gx-1,y},{x:b.gx+b.w,y});
   const goal=goals.find(clear);assert.ok(goal,b.type+' exterior body position');const path=C.findFriendlyPath(start,goal,(x,y)=>!clear({x,y}));assert.ok(path,b.type+' real native path');
   for(const q of path)assert.ok(clear(q));const point={x:goal.x*C.TILE+C.TILE/2,y:goal.y*C.TILE+C.TILE/2,radius:g.player.radius};assert.ok(g.workerCanWorkAt(point,b),b.type+' reachable work face');
  }
 });
}

test('201 native funding revalidates resources and rolls back a mid-ensemble failure atomically',()=>{
 const {g}=H.fresh();H.advanced(g);H.prepare(g,'planningOffice');for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(5000,g.storage);
 const id='returnService201',at=H.planPosition(g,id);assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);g.resources.scrap=0;let before=clone(H.stable(g));assert.equal(g.dayworks.commitPlan(),false);assert.deepEqual(H.stable(g),before);
 for(const key of C.RESOURCE_KEYS)g.resources[key]=Math.min(5000,g.storage);assert.equal(g.dayworks.anchorPlan(id,at.x,at.y).ok,true);before=clone(H.stable(g));const original=g.placeOne;let calls=0;
 g.placeOne=function(...args){if(++calls===3)return false;return original.apply(this,args);};try{assert.equal(g.dayworks.commitPlan(),false);}finally{g.placeOne=original;}
 assert.equal(calls,3);assert.deepEqual(H.stable(g),before);
});
