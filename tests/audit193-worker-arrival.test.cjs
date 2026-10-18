'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');
// Unedited native v20 save after normal desktop play: standard, seed17117,
// balanced landscape, elapsed391.5664, first wave survived, then Save/Menu/Continue.
// All three workers stopped just outside node156's work range. Provenance SHA256:
// e851923a143cc50f518e14cd0d478b9a7b7211266a35cadc10734829de109355.
// These native scenarios restore that checkpoint; they do not claim natural play.
const checkpoint=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/worker-arrival193-v20.json'),'utf8'));
const copy=value=>JSON.parse(JSON.stringify(value));
function restore(prepare=()=>{}){
 const raw=checkpoint();prepare(raw);const {game:g}=bootGame();
 assert.equal(g.restoreSave(raw),true);g.togglePause(false);g.releaseInputs();
 const node=g.world.nodes.find(n=>n.id===156),workers=g.units.filter(u=>u.kind==='worker');
 assert.equal(node.type,'scrap');assert.equal(node.amount,32.50585864935142);
 return{g,node,workers};
}
function material(g){
 return Object.fromEntries(C.RESOURCE_KEYS.map(type=>[type,(g.resources[type]||0)+(g.player.carry[type]||0)+g.units.reduce((sum,u)=>sum+(u.carryType===type?u.carry:0),0)+g.world.nodes.reduce((sum,n)=>sum+(n.type===type?n.amount:0),0)]));
}
function conserved(g,before){for(const [type,total]of Object.entries(material(g)))assert.ok(Math.abs(total-before[type])<1e-7,'Finite '+type+' is conserved across nodes, worker bags and depot');}
function step(g,workers,node,dt=.05){
 const before=workers.map(u=>({x:u.x,y:u.y,carry:u.carry,can:g.workerCanWorkAt(u,node,node.radius+12),boost:g.infrastructure.speed(u.x,u.y)}));
 g.elapsed+=dt;g.updateUnits(dt);
 for(let i=0;i<workers.length;i++){
  const u=workers[i],b=before[i];
  assert.ok(Math.hypot(u.x-b.x,u.y-b.y)<=u.speed*dt*b.boost+1e-7,'Movement keeps the real speed and road bonus budget');
  assert.ok(g.friendlyPositionClear(u,u.x,u.y),'Every resulting worker footprint is physically free');
  if(u.carry>b.carry+1e-8)assert.equal(b.can,true,'Harvest starts only after physically reaching the work range');
 }
}
function finishRealCollection(g,node,workers){
 const before={material:material(g),stocks:copy(g.resources),bag:copy(g.player.carry),coords:g.world.nodes.map(n=>[n.id,n.x,n.y]),amount:node.amount,deposited:g.depositedResources,positions:workers.map(u=>({x:u.x,y:u.y}))};
 let moved=false,reached=false,gathered=false;
 for(let i=0;i<400&&g.depositedResources<=before.deposited+1e-8;i++){
  step(g,workers,node);conserved(g,before.material);
  moved ||=workers.some((u,j)=>Math.hypot(u.x-before.positions[j].x,u.y-before.positions[j].y)>1e-7);
  reached ||=workers.some(u=>g.workerCanWorkAt(u,node,node.radius+12));
  gathered ||=node.amount<before.amount-1e-8;
  assert.deepEqual(g.player.carry,before.bag,'Workers do not deliver cargo to the commander');
  assert.deepEqual(g.world.nodes.map(n=>[n.id,n.x,n.y]),before.coords,'No physical resource is relocated');
 }
 assert.ok(moved,'The final short approach physically advances');assert.ok(reached,'The real resource work range is reached');
 assert.ok(gathered,'The finite node supplies real cargo');assert.ok(g.depositedResources>before.deposited,'Cargo is physically carried back and deposited');
 assert.ok(g.resources.scrap>before.stocks.scrap);assert.ok(node.amount<before.amount);
 for(const key of C.RESOURCE_KEYS.filter(key=>key!=='scrap'))assert.equal(g.resources[key],before.stocks[key]);
}

test('193 saved workers complete their final approach, collect finite scrap and deposit it',()=>{
 const {g,node,workers}=restore();assert.equal(workers.length,3);
 for(const u of workers){
  const p=g.fieldcraft.service(u,node);
  assert.ok(p);assert.ok(Math.hypot(u.x-p.x,u.y-p.y)<2);
  assert.equal(g.workerCanWorkAt(u,node,node.radius+12),false,'The saved position is genuinely outside work range');
  assert.ok(g.friendlyPositionClear(u,p.x,p.y));
  assert.ok(g.workerCanWorkAt({...u,...p},node,node.radius+12),'The existing service point really permits work');
 }
 finishRealCollection(g,node,workers);
});

test('193 a closed physical access rejects the job without harvesting through the gate',()=>{
 const {g,node,workers}=restore(),u=workers[0],Building=g.core().constructor;
 // Explicit reduced fixture: retain the real target and one worker, then build
 // a closed, collision-owned ring around D-17. No resource or cargo is granted.
 g.world.nodes=[node];g.units=[u];u.x=C.world(68);u.y=C.world(64);
 const add=(type,x,y,rotation=0)=>{assert.equal(g.world.placement(C.BUILDINGS[type],x,y,rotation).valid,true);const b=new Building(g.nextId++,type,x,y,rotation,1);g.world.add(b);return b;};
 for(let x=58;x<=70;x++){add('woodWall',x,58);add('woodWall',x,70);}
 for(let y=59;y<70;y++){add('woodWall',58,y);if(![64,65].includes(y))add('woodWall',70,y);}
 const gate=add('gate',70,64,1);assert.equal(g.setGateMode('closed',gate),true);
 assert.ok(g.friendlyPositionClear(u,u.x,u.y));assert.equal(g.setWorkerOrder('harvest'),true);
 const before={material:material(g),amount:node.amount,stocks:copy(g.resources),bag:copy(g.player.carry),deposited:g.depositedResources};
 step(g,[u],node);assert.equal(u.navigation?.cells,null,'The real pathfinder refuses the closed route');
 assert.ok(u.blockedJobs?.has('gather:'+node.id),'The unreachable job uses the existing retry memory');
 for(let i=0;i<19;i++){step(g,[u],node);conserved(g,before.material);}
 assert.equal(node.amount,before.amount);assert.equal(u.carry,0);assert.deepEqual(g.resources,before.stocks);
 assert.deepEqual(g.player.carry,before.bag);assert.equal(g.depositedResources,before.deposited);
 assert.equal(g.workerCanWorkAt(u,node,node.radius+12),false);
});

test('193 a real saved road bonus keeps the last approach physical and permits finite delivery',()=>{
 // Prepared inherited completed road, validated by the normal save owner.
 // This tests the real strongest pedestrian bonus, not construction unlocks.
 const {g,node,workers}=restore(raw=>raw.infrastructure.roads.push({x:75,y:67,progress:1,surface:'logistics'}));
 for(const u of workers){assert.equal(g.infrastructure.speed(u.x,u.y),C.Infrastructure.SURFACES.logistics.friendlySpeed);assert.equal(g.workerCanWorkAt(u,node,node.radius+12),false);}
 finishRealCollection(g,node,workers);
});
