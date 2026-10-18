'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {C,S,boot,build,clone}=require('./helpers/vertical177.cjs');

// Paid native supports/generators, cleared resources without loot and declared
// advanced contacts. The save owner validates every elevated contact.
function scene(type='rampart48',north=false){
 const g=boot();for(const n of g.world.nodes)n.harvest(n.amount);
 const support=build(g,type),candidates=[];
 if(!north)candidates.push({gx:support.gx+support.w,gy:support.gy});
 else{
  for(let dx=0;dx<=support.w-2;dx++)for(const side of[0,2])candidates.push({gx:support.gx+dx,gy:side===0?support.gy-4:support.gy+support.h+2,side,lane:dx+1});
  for(let dy=0;dy<=support.h-2;dy++)for(const side of[1,3])candidates.push({gx:side===1?support.gx+support.w+2:support.gx-4,gy:support.gy+dy,side,lane:dy+1});
 }
 const site=candidates.find(p=>g.world.placement(C.BUILDINGS.generator,p.gx,p.gy,0).valid&&g.placeOne('generator',p.gx,p.gy));assert.ok(site,'a real unobstructed generator placement exists');
 const generator=g.world.atCell(site.gx,site.gy);generator.progress=1;generator.health=generator.maxHealth;g.refreshMetrics(true);
 return{g,support,generator,climbSide:site.side,climbLane:site.lane};
}
function contact(f,stage='roof'){
 const {g,support:b}=f;assert.ok(g.spawnZombie('runner'));const id=g.zombies.at(-1).id,raw=clone(g.serialize()),z=raw.zombies.find(z=>z.id===id);
 const c={id,site:b.id,level:0,bridge:null,stair:null,side:f.climbSide??0,lane:f.climbLane??1,start:1,progress:stage==='roof'?1:.04,stage,fallHeight:0};
 if(stage==='roof'){z.x=b.right-14;z.y=f.generator.y;}
 else{const p=S.climbPoint(b,c);z.x=p.x*C.TILE;z.y=p.y*C.TILE;}
 raw.expansions127.modules.vertical175.climbers.push(c);assert.ok(g.restoreSave(raw));
 f.generator=g.world.buildings.get(f.generator.id);f.support=g.world.buildings.get(b.id);g.rebuildBuckets();return g.zombies.find(z=>z.id===id);
}
test('193 a ground generator blast cannot damage a native roof contact forty-eight metres above it',()=>{
 const f=scene(),z=contact(f),before=z.health;assert.equal(f.g.vertical175.enemyPose(z).z,48);
 assert.ok(Math.hypot(z.x-f.generator.x,z.y-f.generator.y)<f.generator.def.explosive);
 f.g.destroyBuilding(f.generator);assert.equal(z.health,before);
});
test('193 generator destruction still damages a genuinely nearby ground contact',()=>{
 const f=scene(),g=f.g;assert.ok(g.spawnZombie('runner'));const z=g.zombies.at(-1);
 z.x=f.generator.right+z.radius+2;z.y=f.generator.y;assert.ok(g.hostilePositionClear(z,z.x,z.y));g.rebuildBuckets();
 const before=z.health;assert.equal(g.vertical175.enemyPose(z).z,0);g.destroyBuilding(f.generator);assert.ok(z.health<before);
});
test('193 an exposed low climber inside the actual three-dimensional blast radius remains vulnerable',()=>{
 const f=scene('rampart12',true),z=contact(f,'climb'),before=z.health,pose=f.g.vertical175.enemyPose(z);
 assert.ok(pose.z>0&&pose.z<1);assert.ok(f.g.hostilePositionClear(z,z.x,z.y),'the native contact stands outside both ground footprints');
 const distance=Math.hypot(z.x-f.generator.x,z.y-f.generator.y,pose.z*C.TILE);assert.ok(distance<f.generator.def.explosive);
 f.g.destroyBuilding(f.generator);assert.ok(z.health<before,'height filtering must not make every elevated contact immune');
});
