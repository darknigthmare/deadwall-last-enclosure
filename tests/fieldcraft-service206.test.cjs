'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const {g}=bootDocument134();
const seeds=[1872799123,3299873656,3259169729,967313470,665874342,1947648717,540044935,1014856725,2863399202,155410013,720803020,22261440];
const playerWithoutNavCell=new Set(['967313470:427','967313470:463','1947648717:436']);
const rows=()=>g.world.nodes.map(n=>[n.id,n.type,n.sceneryKind||null,n.x,n.y,n.amount,n.maxAmount,n.depleted,n.metric202||0,n.body202||null]);
const protectedState=()=>JSON.stringify({rng:g.random.state,elapsed:g.elapsed,resources:g.resources,player:g.player,units:g.units,nodes:rows()});
function start(seed){assert.notEqual(g.startNew('standard',String(seed),'classic','balanced',true),false);g.campaignIntro132.skip();assert.equal(g.frontier.position().generation,11);g.releaseInputs();}
function assertApproach(actor,node,p){
 assert.ok(p,'a legal native service point exists for '+node.id);
 assert.equal(g.friendlyPositionClear(actor,p.x,p.y),true);
 assert.equal(g.workerCanWorkAt({...actor,...p},node,node.radius+12),true,'the actual work gesture clears all neighbours');
 const cell={x:Math.floor(p.x/32)*32+16,y:Math.floor(p.y/32)*32+16};
 assert.equal(g.friendlyPositionClear(actor,cell.x,cell.y),true,'the target navigation cell fits the same actor');
 const count=Math.max(1,Math.ceil(Math.hypot(p.x-cell.x,p.y-cell.y)));
 for(let i=0;i<=count;i++)assert.equal(g.friendlyPositionClear(actor,cell.x+(p.x-cell.x)*i/count,cell.y+(p.y-cell.y)*i/count),true,`seed${g.world.seed}/node${node.id}/radius${actor.radius}: the final cell-to-point approach remains physically clear`);
}

test('206 a free but unusable first face is skipped without mutating a finite resource or actor',()=>{
 start(1872799123);const node=g.world.nodes.find(n=>n.id===468),old={x:3120,y:1904},before=protectedState();
 assert.equal(node.sceneryKind,'rubble');assert.equal(node.amount,35);assert.deepEqual(node.body202,{w:96,h:80});
 assert.equal(g.friendlyPositionClear(g.player,old.x,old.y),true,'the old point itself was free');
 assert.equal(g.workerCanWorkAt({...g.player,...old},node,node.radius+12),false,'its work segment really hits the neighbouring food node');
 const offered=g.fieldcraft.service(g.player,node);assertApproach(g.player,node,offered);assert.notDeepEqual(offered,old);
 assert.deepEqual(g.fieldcraft.service(g.player,node),offered,'candidate order is deterministic');
 assert.equal(protectedState(),before,'read-only planning preserves RNG, time, all quantities, actor poses and geometry');
});

test('206 all twelve counterexample seeds offer usable worker points and keep genuine larger-actor navigation refusals',()=>{
 for(const seed of seeds){
  start(seed);const before=protectedState(),worker=g.units.find(u=>u.kind==='worker'),scenery=g.world.nodes.filter(n=>n.sceneryKind);assert.equal(scenery.length,48);
  for(const node of scenery){
   assertApproach(worker,node,g.fieldcraft.service(worker,node));
   const playerPoint=g.fieldcraft.service(g.player,node);
   if(playerWithoutNavCell.has(seed+':'+node.id)){
    assert.equal(playerPoint,null,'a smaller worker fitting a cell does not make that cell fit the commander');
    assert.ok(worker.radius<g.player.radius);
   }else assertApproach(g.player,node,playerPoint);
  }
  assert.equal(protectedState(),before,'service queries do not change the seed, resource or simulation owners');
 }
});

test('206 native worker motion reaches the corrected face, harvests finite stone and continues with the same saved cargo',()=>{
 start(1872799123);const node=g.world.nodes.find(n=>n.id===468),worker=g.units.find(u=>u.kind==='worker'),raw=g.serialize();
 const initial={rng:g.random.state,elapsed:g.elapsed,resources:{...g.resources},nodes:rows()};
 // Explicit prepared job and initial pose skip the long journey only. The
 // resource, its blockers, the worker radius/speed and initial stocks are native.
 const savedWorker=raw.units.find(u=>u.id===worker.id);
 Object.assign(savedWorker,{x:3120,y:1904,state:'gather',targetNode:node.id,targetBuilding:-1,targetUnit:-1});
 assert.equal(g.restoreSave(raw),true);g.togglePause(false);g.releaseInputs();
 assert.equal(g.random.state,initial.rng);assert.equal(g.elapsed,initial.elapsed);assert.deepEqual(g.resources,initial.resources);assert.deepEqual(rows(),initial.nodes);
 const live=g.units.find(u=>u.id===worker.id),target=g.world.nodes.find(n=>n.id===node.id),origin={x:live.x,y:live.y},originalAmount=target.amount;
 assert.equal(g.friendlyPositionClear(live,live.x,live.y),true);assert.equal(g.workerCanWorkAt(live,target,target.radius+12),false);
 const stoneTotal=()=>g.resources.stone+g.player.carry.stone+g.units.reduce((n,u)=>n+(u.carryType==='stone'?u.carry:0),0)+g.world.nodes.reduce((n,r)=>n+(r.type==='stone'?r.amount:0),0);
 const conserved=stoneTotal(),positions=g.world.nodes.map(n=>[n.id,n.x,n.y]);let moved=false,reached=false;
 // Declared deterministic simulation steps use the complete production update;
 // neither clock nor harvesting output is assigned by this fixture.
 for(let i=0;i<100&&target.amount===originalAmount;i++){
  const before={x:live.x,y:live.y,carry:live.carry,canWork:g.workerCanWorkAt(live,target,target.radius+12),speed:live.speed*g.infrastructure.speed(live.x,live.y)};
  g.update(.04);moved ||=Math.hypot(live.x-origin.x,live.y-origin.y)>.001;reached ||=g.workerCanWorkAt(live,target,target.radius+12);
  assert.ok(Math.hypot(live.x-before.x,live.y-before.y)<=before.speed*.04+1e-7,'the approach respects the actual worker speed');
  assert.equal(g.friendlyPositionClear(live,live.x,live.y),true);
  if(live.carry>before.carry)assert.equal(before.canWork,true,'collection starts only after reaching the actual work face');
  assert.ok(Math.abs(stoneTotal()-conserved)<1e-7,'finite stone moves to cargo rather than appearing for free');
 }
 assert.ok(moved&&reached);assert.ok(target.amount<originalAmount);assert.equal(live.carryType,'stone');assert.ok(Math.abs(live.carry+target.amount-originalAmount)<1e-7);
 assert.deepEqual(g.world.nodes.map(n=>[n.id,n.x,n.y]),positions,'nothing is relocated to permit collection');
 const checkpoint={nodes:rows(),cargo:live.carry,type:live.carryType,x:live.x,y:live.y,resources:{...g.resources},rng:g.random.state,runId:g.runId};
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);
 const resumed=g.units.find(u=>u.id===worker.id);assert.deepEqual(rows(),checkpoint.nodes);assert.deepEqual(g.resources,checkpoint.resources);assert.equal(g.random.state,checkpoint.rng);assert.equal(g.runId,checkpoint.runId);
 assert.deepEqual({cargo:resumed.carry,type:resumed.carryType,x:resumed.x,y:resumed.y},{cargo:checkpoint.cargo,type:checkpoint.type,x:checkpoint.x,y:checkpoint.y});
});

test('206 hypothetical service checks keep the original actor identity for collision owners',()=>{
 start(1872799123);const node=g.world.nodes.find(n=>n.id===468),original=g.friendlyPositionClear,actor=g.player,before=protectedState();let checks=0;
 // Collision owners use identity, notably the commander driving a metric
 // vehicle. A hypothetical position must not replace that actor with a clone.
 g.friendlyPositionClear=(u,x,y)=>{assert.equal(u,actor);checks++;return original(u,x,y);};
 try{assert.ok(g.fieldcraft.service(actor,node));assert.ok(checks>0);}finally{g.friendlyPositionClear=original;}
 assert.equal(protectedState(),before);
});
