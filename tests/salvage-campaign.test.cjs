'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');
// Directed route on a fixed seed, but no injected stock, completed building, survey,
// health, worker, kill or teleport. Ordinary movement keys and paid actions only.
test('cycle de récupération depuis zéro : chantiers payés, marche, relevé et retour',t=>{
 const{game:g}=bootGame();g.startNew('standard','17117');const originalUnits=g.units.map(u=>u.id),costs=[];
 const step=()=>{assert.equal(g.gameOver,false);g.update(.04);g.input.pressed.clear();};
 function moveTo(target,range=38){
  if(target.def){target=g.fieldcraft.service(g.player,target);assert.ok(target);range=9;}
  let steps=0,route=null,index=0,version=-1;
  while(!g.workerCanWorkAt(g.player,target,range)&&steps++<5000){
   const destination=g.fieldcraft.service(g.player,target);assert.ok(destination,'accès extérieur');
   if(!route||version!==g.world.navigationVersion||index>=route.length){
    const result=require('../src/recon.js').routeBetween(g,g.player,{...destination,reach:range});assert.ok(result.ok,result.reason);route=result.path;index=1;version=g.world.navigationVersion;
   }
   while(index<route.length&&Math.hypot(route[index].x-g.player.x,route[index].y-g.player.y)<.4)index++;
   const p=route[index]||destination;g.input.keys.clear();const dx=p.x-g.player.x,dy=p.y-g.player.y;
   if(dx>.1)g.input.keys.add('KeyD');if(dx< -.1)g.input.keys.add('KeyA');if(dy>.1)g.input.keys.add('KeyS');if(dy< -.1)g.input.keys.add('KeyW');const axes=[Math.abs(dx),Math.abs(dy)].filter(v=>v>.1);const dt=Math.min(.04,Math.min(...axes)*(axes.length===2?Math.SQRT2:1)/136);assert.equal(g.gameOver,false);g.update(dt);g.input.pressed.clear();
  }
  g.input.keys.clear();assert.ok(steps<5000,JSON.stringify({target,position:[g.player.x,g.player.y],range,index,last:route?.at(-1),frame:g.elapsed}));
 }

 function build(type){const def=C.BUILDINGS[type];let p=null;for(let y=59;y<74&&!p;y++)for(let x=60;x<76;x++)if(g.world.placement(def,x,y,0).valid){p={x,y};break;}assert.ok(p);assert.ok(g.tier.id>=def.unlockTier);const stock={...g.resources};assert.equal(g.placeOne(type,p.x,p.y),true);for(const[k,n]of Object.entries(def.cost))assert.equal(g.resources[k],stock[k]-n);costs.push({type,cost:def.cost});const b=[...g.world.buildings.values()].find(b=>b.type===type);assert.equal(b.completed,false);moveTo(b,35);g.input.keys.add('KeyE');let frames=0;while(!b.completed&&frames++<1400)step();g.input.keys.clear();assert.ok(b.completed,JSON.stringify({type:b.type,cell:[b.gx,b.gy],progress:b.progress,player:[g.player.x,g.player.y],interaction:g.interactionText,workerOrder:g.workerOrder,units:g.units.map(u=>({x:u.x,y:u.y,state:u.state,target:u.targetBuilding})),elapsed:g.elapsed,blocked:b.completionBlocked}));}
 build('house');build('planningOffice');build('warehouse');
 const source=g.dayworks.snapshot().sites.find(s=>s.id==='housing-2');assert.equal(source.survey,0);moveTo(source,34);assert.ok(g.dayworks.snapshot().sites.find(s=>s.id===source.id).seen);g.dayworks.focusSite(source.id);g.input.keys.add('KeyE');let frames=0;while(g.dayworks.snapshot().sites.find(s=>s.id===source.id).survey<6&&frames++<200)step();g.input.keys.clear();g.dayworks.setTool('none');assert.equal(g.dayworks.snapshot().sites.find(s=>s.id===source.id).survey,6);assert.equal(g.dayworks.snapshot().sites.find(s=>s.id===source.id).remaining,32);
 const food=g.resources.food,order=g.salvage.assign(source.id);assert.ok(order.ok,order.reason);assert.equal(g.resources.food,food-4);assert.deepEqual(g.units.map(u=>u.id),originalUnits);
 let saved=false,activeFrames=0;while(g.salvage.snapshot().stats.returned<1&&activeFrames++<4000){step();const u=g.units.find(u=>u.id===order.id);if(!saved&&u.carry>1&&g.salvage.snapshot().crews[0]?.prepared){const carry=u.carry,left=g.dayworks.snapshot().sites.find(s=>s.id===source.id).remaining;assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.units.find(u=>u.id===order.id).carry,carry);assert.equal(g.dayworks.snapshot().sites.find(s=>s.id===source.id).remaining,left);saved=true;}}
 assert.equal(g.salvage.snapshot().stats.returned,1);assert.equal(g.salvage.snapshot().stats.lost,0);assert.ok(saved);assert.ok(Math.abs(g.dayworks.snapshot().sites.find(s=>s.id===source.id).remaining-22)<1e-6);assert.equal(g.units.find(u=>u.id===order.id).carry,0);assert.ok(g.core().health>0);assert.ok(g.save(false));
 t.diagnostic(JSON.stringify({kind:'directed-unassisted-salvage-cycle',seed:17117,simulatedSeconds:g.elapsed,phase:g.phase,paidBuildings:costs,dispatchFood:4,worker:order.id,returned:g.salvage.snapshot().stats.returned,siteRemaining:g.dayworks.snapshot().sites.find(s=>s.id===source.id).remaining,coreHealth:g.core().health,allOriginalWorkers:g.units.map(u=>u.id)}));
});
