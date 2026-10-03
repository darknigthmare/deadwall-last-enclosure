'use strict';
const assert=require('node:assert/strict');
const {boot127}=require('./expansions127.cjs');
const P=require('../../src/actor-presentation.js');
const angles=Array.from({length:8},(_,i)=>i*Math.PI/4);
const names=['E','SE','S','SO','O','NO','N','NE'];
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const gap=(a,b)=>Math.abs(wrap(a-b));
function setup(regional=false){
 const {game:g}=boot127();g.startNew('standard','17117');g.phaseTime=9999;
 g.world.nodes=[];Object.assign(g.player,{x:1000,y:1000});
 let base=null;
 if(regional){
  Object.assign(g.player,{x:4068,y:2048});assert.equal(g.frontier.enter(),true);
  const w=g.frontier.world();let point;
  for(const road of w.roads){const q={x:(road.a.x+road.b.x)/2,y:(road.a.y+road.b.y)/2};
   if(Math.hypot(q.x-4096,q.y-4096)>600&&!w.nearPOI(q.x,q.y,40).length&&
    [-4,0,4].every(dx=>[-4,0,4].every(dy=>!w.blocked(q.x+dx,q.y+dy,.5)))){point=q;break;}
  }
  assert.ok(point,'la fixture utilise une route réellement dégagée');
  base=g.serialize();Object.assign(base.frontier,{x:point.x,y:point.y,z:0,inside:null,tracks:{}});
 }
 return {g,regional,base};
}
function measureCase(scene,aimIndex,travelIndex,{ticks=12,sprint=false}={}){
 const {g,regional,base}=scene,aim=angles[aimIndex],travel=angles[travelIndex];
 if(regional)g.restoreSave(base);else {Object.assign(g.player,{x:1000,y:1000,posture:'stand',reload:0,meleeCooldown:0});g.actorPresentation.reset();}
 g.paused=false;g.input.keys.clear();g.input.mouseDown=false;g.input.touchFire=false;
 function pointAim(){if(regional){g.input.mouseX=g.width/2+Math.cos(aim)*300;g.input.mouseY=g.height/2+Math.sin(aim)*300;}
  else {g.input.mouseWorldX=g.player.x+Math.cos(aim)*1000;g.input.mouseWorldY=g.player.y+Math.sin(aim)*1000;}}
 pointAim();g.updatePlayer(.04);
 const start={...g.actorPresentation.player()};
 const dx=Math.cos(travel),dy=Math.sin(travel);
 if(dx>.1)g.input.keys.add('KeyD');else if(dx<-.1)g.input.keys.add('KeyA');
 if(dy>.1)g.input.keys.add('KeyS');else if(dy<-.1)g.input.keys.add('KeyW');
 if(sprint)g.input.keys.add('ShiftLeft');
 const samples=[];
 for(let i=0;i<ticks;i++){pointAim();g.updatePlayer(.04);samples.push({...g.actorPresentation.player()});}
 const end=samples.at(-1),distance=Math.hypot(end.x-start.x,end.y-start.y),actualTravel=Math.atan2(end.y-start.y,end.x-start.x);
 assert.ok(distance>10,'le cycle vient d’un déplacement réellement effectué');
 assert.ok(gap(actualTravel,travel)<.02,'la scène de QA laisse le mouvement demandé libre');
 for(const sample of samples){assert.equal(sample.visualArticulated,true);assert.equal(sample.visualMoving,true);
  assert.ok(gap(sample.visualUpperFacing,sample.facing)<1e-9,'arme alignée sur le tir à chaque tick');
  assert.ok(gap(sample.visualUpperFacing,sample.visualLowerFacing)<=P.JOINTS.maxTwist+1e-9);}
 return {entity:{...end,x:0,y:0},samples,distance,actualTravel,aim,travel,domain:regional?'region':'d17'};
}
module.exports={setup,measureCase,angles,names,gap};
