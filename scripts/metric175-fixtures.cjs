'use strict';
/* Explicit prepared parking fixture. No existing terrain, stock or actor removed.
 * Native source owners must accept the vehicle before any test walls are added. */
function prepareMetricCorridor175(g){
 if(!g?.core)g=globalThis.DEADWALL;
 const C=globalThis.DeadwallCore,M=globalThis.DeadwallMetric174,car=g.expeditions.car();
 if(!car||car.metric174!==1||g.worldEvolution.vehicleProfile().w!==10.4)throw Error('Calibrated, purchased bus required');
 car.angle=0;const gy=Math.floor(car.y/32),xx=Math.floor(car.x/32),rows=[];
 // Round the lower wall outwards: floor(y/32)+3 can leave only 2.2 units
 // beyond the future boarding foot at the end of a tile. Keep both rows whole.
 for(const y of [gy-4,Math.ceil(car.y/32)+3])for(let x=xx-5;x<=xx+5;x++){
  if(!g.world.placement(C.BUILDINGS.woodWall,x,y).valid)continue;
  if([g.player,...g.units,...g.zombies].some(u=>!u.dead&&M.bodyCircle({x:x*32+16,y:y*32+16,w:32,h:32,a:0},u,(u.radius||12)+1)))continue;
  const b=new(g.core().constructor)(g.nextId++,'woodWall',x,y,0,1);g.world.add(b);rows.push(b.id);
 }
 g.refreshMetrics(true);
 if(rows.length<12||!g.expeditions.carClear(car.x,car.y))throw Error('Prepared corridor is not valid');
 const body=g.expeditions.vehicleBody175(),foot={x:car.x,y:car.y+body.h/2+21};
 if(!g.friendlyPositionClear(g.player,foot.x,foot.y))throw Error('Prepared side boarding point is obstructed');
 Object.assign(g.player,{...foot,navigation:null});
 // Finite fuel fixture is explicitly supplied to the bag, then transferred by
 // the real owner. This is not a claim of natural campaign resource acquisition.
 g.player.carry.fuel=3;const before=car.fuel,bag=g.player.carry.fuel;
 const paid=g.expeditions.refuel();if(!paid.ok||car.fuel-before!==bag-g.player.carry.fuel)throw Error('Native refuel transfer failed');
 return {walls:rows,body,foot,fixture:['completed corridor walls on free cells','side boarding point','3 fuel in carried bag'],refuel:'native inventory transfer'};
}
module.exports={prepareMetricCorridor175};
