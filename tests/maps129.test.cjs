'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');
const X=require('../src/exploration-125.js'),P=require('../src/atlas-projection.js');
function fresh(seed='17117'){const env=boot127();env.game.startNew('standard',seed);return env.game;}
function saved(g){const d=g.serialize();delete d.timestamp;return JSON.stringify(d);}
function traceContext(){const calls=[];const c=new Proxy({calls,measureText:t=>({width:String(t).length*7}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get(t,k){if(k in t)return t[k];return(...a)=>calls.push([k,...a]);},set(t,k,v){calls.push(['set',k,v]);t[k]=v;return true;}});return c;}
function rotate(p,t,size=4096){return t===1?{x:size-p.y,y:p.x}:t===2?{x:size-p.x,y:size-p.y}:t===3?{x:p.y,y:size-p.x}:{x:p.x,y:p.y};}
const entire={left:0,top:0,right:4096,bottom:4096};

test('1.29 map: new campaigns persist the current layout and restore the same physical plan',()=>{
 const g=fresh('991'),plan=JSON.stringify(g.exploration125.plan),d=g.serialize();assert.equal(d.exploration125.layoutRevision,3);
 g.restoreSave(d);assert.equal(JSON.stringify(g.exploration125.plan),plan);assert.equal(g.exploration125.plan.seed,991);
 assert.equal(P.model(g).features,g.exploration125.plan);assert.equal(P.model(g).seed,991);
});

test('1.29 map: saves without layout revision retain their historical G4 roads and stations',()=>{
 const g=fresh('991'),d=g.serialize();delete d.exploration125.layoutRevision;g.restoreSave(d);
 assert.equal(g.exploration125.layoutRevision,1);assert.deepEqual(g.exploration125.plan,X.createFeaturePlan(991,4096,1));
 const old=g.serialize();g.restoreSave(old);assert.deepEqual(g.exploration125.plan,X.createFeaturePlan(991,4096,1));
});

test('1.29 map: invalid layout revision is rejected before world replacement',()=>{
 const g=fresh(),before=saved(g),d=g.serialize();d.exploration125.layoutRevision=7;
 assert.throws(()=>g.restoreSave(d));assert.equal(saved(g),before);
});

test('1.29 map: four seeded orientations rotate every solid, loot point and doorway together',()=>{
 const turns=new Set();
 for(let seed=0;seed<48;seed++){
  const legacy=X.createFeaturePlan(seed,4096,1),plan=X.createFeaturePlan(seed,4096,2),t=plan.layoutTurns;turns.add(t);
  assert.deepEqual(X.createFeaturePlan(seed,4096,2),plan);
  for(let i=0;i<legacy.solids.length;i++){
   const a=legacy.solids[i],b=plan.solids[i],center=rotate({x:a.x+a.w/2,y:a.y+a.h/2},t);
   assert.ok(Math.abs(b.x+b.w/2-center.x)<1e-8);assert.ok(Math.abs(b.y+b.h/2-center.y)<1e-8);
   assert.ok(Math.abs(a.w*a.h-b.w*b.h)<1e-6);
  }
  for(let i=0;i<plan.stationLoot.length;i++){const p=rotate(legacy.stationLoot[i],t);assert.equal(plan.stationLoot[i].x,p.x);assert.equal(plan.stationLoot[i].y,p.y);}
  for(let i=0;i<plan.stations.length;i++){const p=rotate(legacy.stations[i].door,t);assert.equal(plan.stations[i].door.x,p.x);assert.equal(plan.stations[i].door.y,p.y);}
 }
 assert.equal(turns.size,4);
});

test('1.29 map: rotated gas stations retain a physical path between their door and all supplies',()=>{
 function reachable(plan,station,target){
  const numeric=Number(station.id.split('-')[1]);
  const solids=plan.solids.filter(box=>['station-wall','station-furniture'].includes(box.kind)&&(box.station===numeric||box.station===station.id));
  const step=10,radius=9,left=station.x-station.w/2+radius,top=station.y-station.h/2+radius,right=station.x+station.w/2-radius,bottom=station.y+station.h/2-radius;
  const clear=(x,y)=>x>=left&&x<=right&&y>=top&&y<=bottom&&!solids.some(box=>X.circleIntersectsRect(x,y,radius,box));
  let start={x:station.door.x,y:station.door.y};if(station.facing==='north')start.y+=22;else if(station.facing==='south')start.y-=22;else if(station.facing==='west')start.x+=22;else start.x-=22;
  const queue=[start],seen=new Set(['0:0']);let head=0;
  while(head<queue.length){const p=queue[head++];if(Math.hypot(p.x-target.x,p.y-target.y)<20)return true;for(const [dx,dy]of[[step,0],[-step,0],[0,step],[0,-step]]){const x=p.x+dx,y=p.y+dy,key=Math.round((x-start.x)/step)+':'+Math.round((y-start.y)/step);if(!seen.has(key)&&clear(x,y)){seen.add(key);queue.push({x,y});}}}return false;
 }
 for(let seed=0;seed<48;seed++){const plan=X.createFeaturePlan(seed*9973,4096,2);for(const station of plan.stations)for(const loot of plan.stationLoot.filter(n=>n.stationId===station.id))assert.ok(reachable(plan,station,loot),seed+'/'+station.id+'/'+loot.type);}
});

test('1.29 map: D-17 seen from the region uses the exact local depth queue including G4 props and zombies',()=>{
 const g=fresh(),A=require('../src/atlas-render.js');g.spawnZombie('walker');g.zombies.at(-1).x=1000;g.zombies.at(-1).y=1000;
 const local=g.depthEntries(entire).filter(e=>e.kind!==4).map(e=>[e.kind,e.id,e.depth]);
 g.player.x=4055;g.player.y=2048;assert.equal(g.frontier.enter(),true);
 const projected=g.depthEntries({...entire,homeProjection:true}).filter(e=>e.kind!==4).map(e=>[e.kind,e.id,e.depth]);
 assert.deepEqual(projected,local);assert.ok(projected.some(e=>e[0]===1&&e[1]===-125));assert.ok(projected.some(e=>e[0]===3));
 const seen=[],ctx=traceContext(),before=saved(g);
 for(const [name,kind]of[['drawNode',0],['drawBuilding',1],['drawUnit',2],['drawZombie',3]])g[name]=(c,e)=>seen.push([kind,e.id]);
 g.drawPlayer=()=>assert.fail('Le personnage absent ne doit pas apparaître en double dans D-17.');
 A.drawHome(ctx,g,{world:true,scale:26});assert.deepEqual(seen,projected.filter(e=>e[0]<=3).map(e=>e.slice(0,2)));assert.equal(saved(g),before);
});

test('1.29 map: local and projected G4 ground painters produce identical draws without switching simulation domains',()=>{
 const g=fresh(),ctx=traceContext();g.drawGround(ctx,entire);const local=JSON.stringify(ctx.calls);
 g.player.x=4055;g.player.y=2048;g.frontier.enter();const remote=traceContext();g.drawGround(remote,{...entire,homeProjection:true});
 assert.equal(JSON.stringify(remote.calls),local);assert.equal(g.frontier.active(),true);
});

test('1.29 map: local camps and cargo stay in projected depth and really paint after departure',()=>{
 const g=fresh(),d=g.serialize();
 d.expansions127.modules.survival.camps=[{id:1,domain:'local',x:2100,y:2300,z:0,inside:null,left:500,cover:0}];d.expansions127.modules.survival.serial=2;
 d.expansions127.modules.exploration.caches=[{id:1,x:2200,y:2300,stock:globalThis.DeadwallCore.makeBag()}];d.expansions127.modules.exploration.serial=2;
 g.restoreSave(d);g.player.x=4055;g.player.y=2048;g.frontier.enter();const entries=g.depthEntries({...entire,homeProjection:true});
 const camp=entries.find(e=>e.entity.__survivalCamp),cache=entries.find(e=>e.entity.__explorationPack);assert.ok(camp&&cache);
 const c=traceContext();g.drawBuilding(c,camp.entity);assert.ok(c.calls.some(e=>e[0]==='fillRect'));
});

test('1.29 map: cartography reads the current seed and harvested resources rather than stale cached plan',()=>{
 const g=fresh('0'),first=traceContext();g.exploration125.drawMap(first,1/32,1/32);assert.equal(g.exploration125.plan.seed,0);
 const n=g.world.nodes.find(n=>!n.depleted),mark=['fillRect',n.x/32-Math.max(.6,n.radius/32)/2,n.y/32-Math.max(.6,n.radius/32)/2,Math.max(.6,n.radius/32),Math.max(.6,n.radius/32)];
 assert.ok(first.calls.some(x=>JSON.stringify(x)===JSON.stringify(mark)));n.depleted=true;n.amount=0;const after=traceContext();g.exploration125.drawMap(after,1/32,1/32);assert.ok(!after.calls.some(x=>JSON.stringify(x)===JSON.stringify(mark)));
 const state=g.serialize();g.startNew('standard','77');const second=traceContext();g.exploration125.drawMap(second,1/32,1/32);assert.notDeepEqual(second.calls,after.calls);g.restoreSave(state);const restored=traceContext();g.exploration125.drawMap(restored,1/32,1/32);assert.deepEqual(restored.calls,after.calls);
});

test('1.29 map: schematic atlas delegates D-17 geography to the same current cartography',()=>{
 const g=fresh(),A=require('../src/atlas-render.js'),original=g.exploration125.drawMap;let n=0;
 g.exploration125.drawMap=(...a)=>{n++;return original(...a);};A.drawHome(traceContext(),g,{scale:1,resources:true});assert.equal(n,1);
 const ctx=traceContext();g.exploration125.renderMap(ctx,640,480);assert.ok(ctx.calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('CARTE 17117')));
});

test('menu preview rejects invalid seed, then prepares only the next random campaign without pinning the input',()=>{
 const env=require('./helpers/browser.cjs').bootGame(),g=env.game,doc=document,proto=Object.getPrototypeOf(doc.body);
 proto.append=function(...nodes){nodes.forEach(n=>this.appendChild(n));};proto.insertBefore=function(n,s){const i=this.children.indexOf(s);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;};
 const row=doc.createElement('div');doc.body.appendChild(row);const query=doc.querySelector.bind(doc),get=doc.getElementById.bind(doc);
 doc.querySelector=s=>s==='#mainMenu .seed-controls'?row:query(s);doc.getElementById=id=>id==='deadwall125-menu-map'?row.children.find(n=>n.id===id)||null:get(id);
 X.install(g,doc);const input=doc.getElementById('mapSeed'),button=doc.getElementById('deadwall125-menu-map');assert.ok(button);
 let validity='',reported=0;input.setCustomValidity=v=>{validity=v;};input.reportValidity=()=>{reported++;};
 input.value='invalid';const before=saved(g),world=g.world;button.click();assert.ok(validity);assert.equal(reported,1);assert.equal(g.exploration125.overlayOpen(),false);assert.equal(g.world,world);assert.equal(saved(g),before);
 input.value='';const fresh=g.freshMapSeed.bind(g);g.freshMapSeed=()=>991;button.click();assert.equal(validity,'');assert.equal(input.value,'');assert.equal(g.previewMapSeed135,991);assert.equal(g.exploration125.overlayOpen(),true);
 g.startNew('standard',input.value);assert.equal(g.world.seed,991);assert.deepEqual(g.exploration125.plan,X.createFeaturePlan(991,4096,3));
 assert.equal(g.previewMapSeed135,null);g.freshMapSeed=fresh;g.startNew('standard',input.value);assert.notEqual(g.world.seed,991);
});
