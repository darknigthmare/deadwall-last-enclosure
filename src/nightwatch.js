/* A true black mask with light openings. Automatic guns cannot acquire unlit targets. */
(function(root){
 'use strict';const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore,R=C.Urban.RULES;
 const live=b=>b&&!b.dead&&b.health>0,angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 function scheduled(wave){return Number.isInteger(wave)&&wave>=R.blackoutFirst&&(wave-R.blackoutFirst)%R.blackoutEvery===0;}
 function install(g){if(g.nightwatch)return g.nightwatch;let mask=null,polygons=new Map(),revision='',staticSources=[],scenePlan=null,sceneWalls=[];
  function sceneDistance(from,to){
   const plan=g.exploration125?.generation===4?g.exploration125.plan:null;
   if(plan!==scenePlan){scenePlan=plan;sceneWalls=(plan?.solids||[]).filter(b=>['station-wall','house','settlement-building','palisade','yard-prop'].includes(b.kind));polygons.clear();}
   const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);let nearest=1;
   for(const b of sceneWalls){if(Math.max(from.x,to.x)<b.x||Math.min(from.x,to.x)>b.x+b.w||Math.max(from.y,to.y)<b.y||Math.min(from.y,to.y)>b.y+b.h)continue;let enter=0,exit=1;for(const [start,delta,lo,hi] of [[from.x,dx,b.x,b.x+b.w],[from.y,dy,b.y,b.y+b.h]]){if(Math.abs(delta)<1e-8){if(start<lo||start>hi){enter=2;break;}}else{const a=(lo-start)/delta,c=(hi-start)/delta;enter=Math.max(enter,Math.min(a,c));exit=Math.min(exit,Math.max(a,c));}}if(enter<=exit&&exit>=0&&enter>=0)nearest=Math.min(nearest,enter);}
   return length*nearest;
  }
  const state=()=>g.urban.lightingState();
  function isBlackout(){return g.state==='playing'&&!g.gameOver&&['assault','aftermath'].includes(g.phase)&&scheduled(g.wave)&&state().skipNightWave!==g.wave;}
  function forecast(){return scheduled(g.wave)&&state().skipNightWave!==g.wave;}
  function invalidate(){revision='';}
  function sources(limit=true){const key=[g.elapsed,g.world.navigationVersion,g.phase,g.resources.fuel>0].join(':');
   if(key!==revision){revision=key;staticSources=[];for(const b of g.world.buildings.values()){
    if(!live(b)||!b.completed||!b.powered||b.siegeOffline||b.territoryOffline||!b.def.light)continue;
    if(isBlackout()&&b.type!=='core'&&!b.def.powerUse&&!b.def.powerGen)continue;
    if((b.type==='generator'||b.def.generatorFuel)&&g.resources.fuel<=0)continue;
    staticSources.push({id:b.id,x:b.x,y:b.y,r:b.def.light,angle:(b.rotation||0)*Math.PI/2,half:b.def.beamHalfAngle||Math.PI});
   }
   for(const f of g.siege?.snapshot().fires||[]){const b=g.world.buildings.get(f.id);if(live(b))staticSources.push({id:b.id,x:b.x,y:b.y,r:110,half:Math.PI,angle:0,fire:true});}
   if(polygons.size>200)polygons.clear();}
   const list=staticSources.slice();const car=g.expeditions?.entity();if(car?.driving&&car.fuel>0)list.unshift({id:'exp-headlights',x:car.x,y:car.y,r:260,angle:car.angle,half:.55});if(live(g.player)&&!g.player.regionAbsent&&!isBlackout())list.push({id:'ambient-player',x:g.player.x,y:g.player.y,r:145,angle:0,half:Math.PI});if(live(g.player)&&!g.player.regionAbsent&&state().flashlight)list.unshift({id:'player',x:g.player.x,y:g.player.y,r:R.flashRange,angle:g.player.facing,half:R.flashHalfAngle});
   for(const e of g.essentials?.lights('local')||[])list.push({id:'kit-'+e.id,x:e.x,y:e.y,r:e.r,angle:0,half:Math.PI});
   for(const e of g.nightGear?.lights('local')||[])list.push({...e,angle:e.angle||0,half:Math.PI});
   return limit?list.sort((a,b)=>Math.hypot(a.x-g.camera.x,a.y-g.camera.y)-Math.hypot(b.x-g.camera.x,b.y-g.camera.y)).slice(0,R.maxLights):list;
  }
  function clear(from,to){const dist=Math.hypot(to.x-from.x,to.y-from.y);if(sceneDistance(from,to)<dist-.01)return false;const n=Math.max(1,Math.ceil(dist/R.lightStep));for(let i=1;i<n;i++){const b=g.world.at(from.x+(to.x-from.x)*i/n,from.y+(to.y-from.y)*i/n);if(live(b)&&b.completed&&b.id!==from.id&&!(b.def.gate&&b.gateMode==='open'))return false;}return true;}
  function lit(point,ls=sources(false)){for(const l of ls){const dx=point.x-l.x,dy=point.y-l.y;if(dx*dx+dy*dy>(l.r*R.detectThreshold)**2)continue;if(l.half<Math.PI&&Math.abs(angleDiff(Math.atan2(dy,dx),l.angle))>l.half*.94)continue;if(clear(l,point))return true;}return false;}
  function visible(point){return !isBlackout()||lit(point);}
  function target(x,y,range){if(!isBlackout())return g.nearestZombie(x,y,range);const ls=sources(false);let best=range*range,result=null;for(const z of g.nearbyZombies(x,y,range)){const d=(x-z.x)**2+(y-z.y)**2;if(live(z)&&d<best&&lit(z,ls)){result=z;best=d;}}return result;}
  function polygon(l){const mobile=l.id==='player'||l.id==='exp-headlights'||String(l.id).startsWith('gear-'),key=[l.id,g.world.navigationVersion,mobile?Math.round(l.x/3):l.x,mobile?Math.round(l.y/3):l.y,Math.round(l.angle*100),l.r].join(':');if(polygons.has(key))return polygons.get(key);
   const p=l.half<Math.PI?[{x:l.x,y:l.y}]:[],n=l.half<Math.PI?32:R.lightRays;for(let i=0;i<=n;i++){const a=l.angle-l.half+2*l.half*i/n;let r=l.r;for(let k=R.lightStep;k<=l.r;k+=R.lightStep){const x=l.x+Math.cos(a)*k,y=l.y+Math.sin(a)*k,b=g.world.at(x,y);if(live(b)&&b.completed&&b.id!==l.id&&!(b.def.gate&&b.gateMode==='open')){r=k;break;}}r=Math.min(r,sceneDistance(l,{x:l.x+Math.cos(a)*r,y:l.y+Math.sin(a)*r}));p.push({x:l.x+Math.cos(a)*r,y:l.y+Math.sin(a)*r});}if(polygons.size>200)polygons.clear();polygons.set(key,p);return p;
  }
  const normal=g.drawNight.bind(g);
  function draw(ctx){const blackout=isBlackout(),opacity=g.fieldcraft?g.fieldcraft.opacity(blackout?1:Math.max(0,Math.min(1,1-g.daylight()))*.72):(blackout?1:Math.max(0,Math.min(1,1-g.daylight()))*.72);if(opacity<=.02)return;if(!mask)mask=document.createElement('canvas');if(mask.width!==g.width||mask.height!==g.height){mask.width=g.width;mask.height=g.height;}const m=mask.getContext('2d');m.setTransform(1,0,0,1,0,0);m.globalCompositeOperation='source-over';m.globalAlpha=1;m.clearRect(0,0,mask.width,mask.height);m.fillStyle='rgba(0,0,0,'+opacity+')';m.fillRect(0,0,mask.width,mask.height);
   const zoom=g.camera.zoom,sx=x=>(x-g.camera.x)*zoom+g.width/2+(g.frameShake?.x||0),sy=y=>(y-g.camera.y)*zoom+g.height/2+(g.frameShake?.y||0);
   const lights=sources();
   for(const l of lights){const x=sx(l.x),y=sy(l.y),r=l.r*zoom;if(x+r<0||y+r<0||x-r>g.width||y-r>g.height)continue;const p=polygon(l);m.save();m.beginPath();p.forEach((v,i)=>i?m.lineTo(sx(v.x),sy(v.y)):m.moveTo(sx(v.x),sy(v.y)));m.closePath();m.clip();m.globalCompositeOperation='destination-out';const grad=m.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.55,'rgba(0,0,0,.98)');grad.addColorStop(.76,'rgba(0,0,0,.8)');grad.addColorStop(1,'rgba(0,0,0,0)');m.fillStyle=grad;m.fillRect(x-r,y-r,r*2,r*2);m.restore();}
   ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.drawImage(mask,0,0,g.width,g.height);ctx.restore();
   for(const l of lights){if(!l.color)continue;const x=sx(l.x),y=sy(l.y),r=l.r*zoom;if(x+r<0||y+r<0||x-r>g.width||y-r>g.height)continue;ctx.save();ctx.beginPath();polygon(l).forEach((v,i)=>i?ctx.lineTo(sx(v.x),sy(v.y)):ctx.moveTo(sx(v.x),sy(v.y)));ctx.closePath();ctx.clip();ctx.globalCompositeOperation='screen';ctx.globalAlpha=opacity*.17;const tint=ctx.createRadialGradient(x,y,0,x,y,r);tint.addColorStop(0,l.color);tint.addColorStop(.45,l.color+'b0');tint.addColorStop(1,l.color+'00');ctx.fillStyle=tint;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
  }
  g.drawNight=draw;
  const arrows=g.drawThreatArrows.bind(g);g.drawThreatArrows=(...args)=>{if(!isBlackout())return arrows(...args);};
  const metrics=g.refreshMetrics.bind(g);g.refreshMetrics=(...args)=>{const r=metrics(...args);invalidate();return r;};
  const director=g.updateDirector.bind(g);g.updateDirector=(...args)=>{const phase=g.phase,wave=g.wave,r=director(...args);if(phase!==g.phase||wave!==g.wave){invalidate();g.refreshMetrics(true);if(g.phase==='warning'&&forecast())g.notify('Nuit noire annoncée : alimentez les projecteurs. L commande la lampe personnelle.','danger');}return r;};
  for(const n of ['startNew','restoreSave']){const old=g[n].bind(g);g[n]=(...args)=>{const r=old(...args);invalidate();polygons.clear();return r;};}
  const api={isBlackout,forecast,sources,lit,visible,target,invalidate,draw,mask:()=>mask};g.nightwatch=Object.freeze(api);return g.nightwatch;
 }
 const api={scheduled,install};root.DeadwallNightwatch=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
