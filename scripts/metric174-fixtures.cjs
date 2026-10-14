'use strict';
/* Test setup only. Declared completed garage, historical knowledge, finite stock
 * and a physically tested parking pose. Purchase and migration use real owners. */
function prepareMetricVehicle174(g,type='bus'){
 if(!g||!g.core)g=globalThis.DEADWALL;
 const C=globalThis.DeadwallCore,core=g.core();
 const put=name=>{const d=C.BUILDINGS[name];for(let r=7;r<35;r++)for(let y=core.gy-r;y<=core.gy+r;y++)for(let x=core.gx-r;x<=core.gx+r;x++){
  if(Math.max(Math.abs(x-core.gx),Math.abs(y-core.gy))!==r||!g.world.placement(d,x,y).valid)continue;
  const b=new(core.constructor)(g.nextId++,name,x,y,0,1);g.world.add(b);return;
 }throw Error('No legal completed-infrastructure fixture '+name);};
 if(![...g.world.buildings.values()].some(b=>b.type==='expeditionGarage'&&b.completed))put('expeditionGarage');
 g.refreshMetrics(true);
 const saved=g.serialize();saved.urban.peakScore=1850;delete saved.urban.progression151;
 if(g.restoreSave(saved)!==true)throw Error('Knowledge fixture refused');
 for(const k of ['wood','scrap','food'])g.resources[k]=500;
 const service=g.fieldcraft.service(g.player,g.core());if(!service)throw Error('Depot has no free service point');
 Object.assign(g.player,{x:service.x,y:service.y,navigation:null});g.input.keys.clear();g.input.pressed.clear();g.player.reload=0;
 if(!g.worldEvolution.selectVehicle(type))throw Error('Profile selection refused');
 const before={...g.resources},profile=C.WorldEvolution.RULES.vehicles[type],bought=g.expeditions.buildCar();if(!bought.ok)throw Error(bought.reason);
 for(const k of C.RESOURCE_KEYS)if(g.resources[k]!==before[k]-(profile.cost[k]||0))throw Error('Vehicle cost mismatch '+k);
 const v=g.expeditions.car(),rr=Math.hypot(profile.w,profile.h)*32/2,old={x:v.x,y:v.y};let found=null;
 // Choose a saved clear pose without translating any structure or removing props.
 for(let radius=rr+65;radius<=C.Expeditions.RULES.homeRange+rr&&!found;radius+=8)for(let i=0;i<72&&!found;i++){
  const q={x:g.core().x+Math.cos(i*Math.PI/36)*radius,y:g.core().y+Math.sin(i*Math.PI/36)*radius};
  if(!g.expeditions.carClear(q.x,q.y,profile,true))continue;
  if([g.player,...g.units,...g.zombies].some(u=>!u.dead&&u.health>0&&!u.regionAbsent&&Math.hypot(u.x-q.x,u.y-q.y)<rr+(u.radius||0)))continue;
  found=q;
 }
 if(!found)throw Error('No physically clear metric parking fixture for '+type);
 Object.assign(v,found);const ready=g.expeditions.metricScaleStatus174();if(!ready.ok)throw Error(ready.reason);
 if(g.save(false)!==true)throw Error('Fixture save refused');
 return {type,profile:{w:profile.w,h:profile.h},radius:rr,oldParking:old,parking:found,service,prepared:['completed garage','historical age knowledge','finite material stock','clear saved parking position'],purchase:'native paid controller'};
}
module.exports={prepareMetricVehicle174};
