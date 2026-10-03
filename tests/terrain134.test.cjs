'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const X=require('../src/exploration-125.js');
const {boot131}=require('./helpers/expansions131.cjs');
const legacy=require('./fixtures/terrain133-legacy132.json');

function worldPoint(o,x,y){const c=Math.cos(o.angle),s=Math.sin(o.angle);return{x:o.x+x*c-y*s,y:o.y+x*s+y*c};}
function query(box,point,r=1){return X.querySpatialIndexCircle(X.createSpatialIndex([box]),point.x,point.y,r).length>0;}

test('134: corrected vehicle solid follows the painted rotation, including diagonal empty corners',()=>{
 for(const angle of[0,.23,.78,Math.PI/2,2.6,Math.PI]){
  const box=X.orientedSolid134(100,100,60,22,angle),o=box.oriented;
  for(const [x,y]of[[0,0],[28,0],[-28,0],[0,9]])assert.equal(query(box,worldPoint(o,x,y)),true);
  for(const [x,y]of[[0,14],[0,-14],[33,0],[-33,0]])assert.equal(query(box,worldPoint(o,x,y)),false);
  if(angle===.78){const empty={x:box.x+1,y:box.y+1};assert.equal(query(box,empty,.2),false);assert.equal(X.querySpatialIndexRect(X.createSpatialIndex([box]),{...empty,w:.2,h:.2}).length,0);}
 }
});

test('134: all generated wreck and prop colliders use their painted dimensions without mutating historical plans',()=>{
 const immutable=JSON.stringify(legacy.plan),boxes=X.physicalSolids134(legacy.plan);assert.equal(JSON.stringify(legacy.plan),immutable);
 for(const w of legacy.plan.wrecks){const box=boxes.find(b=>b.wreck===w.id);assert.equal(box.oriented.angle,w.angle);assert.equal(query(box,w),true);const p=worldPoint(box.oriented,0,w.size*.48*.84/2+3);assert.equal(query(box,p),false);}
 for(let seed=0;seed<48;seed++)for(const revision of[1,2,3]){const plan=X.createFeaturePlan(seed,4096,revision);for(const box of X.physicalSolids134(plan).filter(b=>b.oriented)){assert.ok(box.w>0&&box.h>0);assert.equal(query(box,box.oriented),true);}}
});

test('134: genuine broken windows keep a clear 60-unit opening with solid jambs on 256 stations',()=>{
 for(let seed=0;seed<64;seed++){const plan=X.createFeaturePlan(seed,4096,3),index=X.createSpatialIndex(X.physicalSolids134(plan));
  for(const station of plan.stations){assert.equal(station.windows.length,1);const w=station.windows[0];assert.equal(w.broken,true);assert.equal(w.horizontal,false);
   for(let dx=-18;dx<=18;dx+=3)assert.equal(X.querySpatialIndexCircle(index,w.x+dx,w.y,10).length,0,`${seed}/${station.id} cross sill ${dx}`);
   for(const sign of[-1,1])assert.ok(X.querySpatialIndexCircle(index,w.x,w.y+sign*(w.width/2+12),5).length,'jamb remains solid');
  }
 }
 for(const rev of[1,2])assert.equal(X.createFeaturePlan(17117,4096,rev).stations.some(s=>s.windows),false,'legacy wall layout preserved');
});

test('134: actors actually cross a broken station window then save/reload at the same place',()=>{
 const{g}=boot131(),p=g.player,s=g.exploration125.plan.stations[0],w=s.windows[0];
 Object.assign(p,{x:w.x+24,y:w.y});assert.ok(g.friendlyPositionClear(p,p.x,p.y));
 for(let i=0;i<12;i++)g.moveFriendly(p,-4,0);assert.ok(p.x<w.x-16);assert.ok(g.friendlyPositionClear(p,p.x,p.y));
 const before={x:p.x,y:p.y},nodes=g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount]);g.restoreSave(g.serialize());assert.equal(g.player.x,before.x);assert.equal(g.player.y,before.y);assert.deepEqual(g.world.nodes.map(n=>[n.id,n.x,n.y,n.amount]),nodes);
});

test('134: opaque vehicle width permits walking beside sprite but prevents crossing its body',()=>{
 const{g}=boot131();let verified=0;
 for(const n of g.world.nodes.filter(n=>!n.depleted&&!n.sceneryKind&&n.type==='scrap'&&Math.abs(n.variant)%4===1)){
  const box=g.fieldcraft.rect(n),reserve=g.fieldcraft.reserveRect(n);assert.ok(box.r-box.l<(reserve.r-reserve.l)*.55);
  const candidate={x:box.r+g.player.radius+2,y:n.y};if(!g.friendlyPositionClear(g.player,candidate.x,candidate.y))continue;
  assert.ok(candidate.x<reserve.r+g.player.radius*.9,'point would hit the obsolete square collider');
  assert.equal(g.friendlyPositionClear(g.player,n.x,n.y),false);Object.assign(g.player,candidate);g.moveFriendly(g.player,-80,0);assert.ok(g.player.x>=box.r+g.player.radius*.85);verified++;break;
 }
 assert.equal(verified,1,'test a real accessible sedan');
});

test('134: roofs stay upright and facades terminate at the original ground footprint in all four old orientations',()=>{
 const turns=new Set();for(let seed=0;seed<48;seed++){
  const p=X.createFeaturePlan(seed,4096,2);turns.add(p.layoutTurns);
  for(const b of[...p.backyards.map(y=>y.house),...p.settlements.flatMap(s=>s.buildings)]){
   const q=X.buildingProjection134(b);assert.equal(q.b,b.y+b.h/2);assert.equal(q.l,b.x-b.w/2);assert.equal(q.roofTop+q.height,q.t);assert.equal(q.roofBottom+q.height,q.b);assert.ok(q.height>0&&q.height<b.h/2);
  }
 }assert.equal(turns.size,4);
});

test('134 cross-review: generated wall interrupts sight and barricade work around a nearby corner',()=>{
 const{g}=boot131();require('../src/barricades134.js').install(g);g.paused=false;g.activeOverlay=null;g.player.carry={wood:20,scrap:15};
 const s=g.exploration125.plan.stations[0],w=s.windows[0],from={x:w.x-28,y:s.y+s.h/2+24},to={x:w.x-8,y:w.y+25};
 const obstruction=g.exploration125.firstObstruction(from,to,0,true);assert.ok(obstruction);assert.equal(obstruction.box.kind,'station-wall');assert.ok(obstruction.fraction>0&&obstruction.fraction<1);
 assert.equal(g.hostileLineClear(from,to,false),false);assert.equal(g.hasLineOfSight(from,to),false);
 Object.assign(g.player,from);const result=g.barricades134.begin('build','local:'+s.id+':window:'+w.id,'planks');assert.equal(result.ok,false,'nearby, but the intact south wall prevents reaching the window from outside that corner');
 const across=[{x:w.x-25,y:w.y},{x:w.x+25,y:w.y}];assert.equal(g.exploration125.firstObstruction(...across,0,true),null,'the real window itself remains clear');
});

test('134: static segment picks nearest obstruction and preserves diagonal empty space',()=>{
 const p=X.createFeaturePlan(17117,4096,3),w=p.wrecks.find(w=>w.angle===Math.PI/2),a={x:w.x-100,y:w.y},b={x:w.x+100,y:w.y};
 const hit=X.firstObstruction134(p,a,b);assert.equal(hit.box.wreck,w.id);assert.ok(Math.abs(hit.x-(w.x-w.size*.48*.84/2))<1e-6);
 assert.equal(X.firstObstruction134(p,a,b,0,true),null,'low car prop does not act as an opaque tall wall');
});
