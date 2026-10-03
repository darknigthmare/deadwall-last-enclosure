(function(root,factory){
 'use strict';const api=factory(root);root.DeadwallActorPresentation=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.document&&root.DEADWALL)api.install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
 const pose=value=>['crouch','prone'].includes(value)?value:'stand';
 // Presentation angles only. Neither aim, hit direction nor movement is modified.
 const JOINTS=Object.freeze({maxTwist:Math.PI*65/180,pivotThreshold:Math.PI*50/180,hipsRate:Math.PI*2,stride:60});
 const angle=value=>Math.atan2(Math.sin(value),Math.cos(value));
 const approach=(from,to,max)=>angle(from+Math.max(-max,Math.min(max,angle(to-from))));
 function standingStep(previous,{facing=0,vx=0,vy=0,moving=false,distance=0},dt){
  const aim=angle(finite(facing)),prior=previous||{hips:aim,shoulders:aim,phase:0,backward:false,pivoting:false};
  const step=Number.isFinite(dt)&&dt>0?Math.min(dt,.1):0;
  if(!step)return {...prior};
  const travel=Math.atan2(vy,vx),separation=Math.abs(angle(travel-aim));
  // Hysteresis avoids a forward/backward flip when crossing a perfect strafe.
  const backward=moving&&(prior.backward?separation>Math.PI*85/180:separation>Math.PI*100/180);
  const support=angle(travel+(backward?Math.PI:0));
  const pivoting=!moving&&(prior.pivoting?Math.abs(angle(aim-prior.hips))>Math.PI*5/180:Math.abs(angle(aim-prior.hips))>JOINTS.pivotThreshold);
  const desired=moving?angle(aim+Math.max(-JOINTS.maxTwist,Math.min(JOINTS.maxTwist,angle(support-aim)))):pivoting?aim:prior.hips;
  const turning=approach(prior.hips,desired,JOINTS.hipsRate*step);
  // The weapon must follow the real shot direction. A sudden mouse turn can
  // exceed the hip's normal turn rate: catch up only to the edge of the twist
  // cone, then finish the pivot progressively. Never draw sideways bullets.
  const hips=angle(aim+Math.max(-JOINTS.maxTwist,Math.min(JOINTS.maxTwist,angle(turning-aim))));
  const shoulders=aim;
  const phase=angle(prior.phase+(moving?Math.max(0,finite(distance))/JOINTS.stride*Math.PI*2*(backward?-1:1):pivoting?step*5:0));
  return {hips,shoulders,phase,backward,pivoting};
 }
 function install(g){
  if(g.actorPresentation)return g.actorPresentation;
  const homeProxy={},regionProxy={};let observed=null,workSerial=0,work=false,joints=null;
  const wrap=(name,fn)=>{const old=g[name];if(typeof old!=='function')return;g[name]=function(...args){return fn(old.bind(this),...args);};};
  function sample(view){
   const regional=Boolean(g.frontier?.active()),p=g.player||{};
   const f=regional?(view||g.frontier.position?.()||g.frontier.snapshot()):null,scale=regional?32:1;
   return {regional,z:regional?finite(f.z):0,x:finite(regional?f.x:p.x)*scale,y:finite(regional?f.y:p.y)*scale,
    facing:finite(regional?f.a:p.facing),world:g.world,actor:p,dead:Boolean(p.dead||p.health<=0),
    driving:regional?Boolean(f.car?.driving):Boolean(g.expeditions?.driving()),
    posture:pose(regional?g.worldEvolution?.posture()?.key:p.posture),stamina:finite(p.stamina),view:f};
  }
  function sameScene(a,b){return a&&b&&a.world===b.world&&a.actor===b.actor&&a.regional===b.regional&&a.z===b.z&&a.dead===b.dead&&a.driving===b.driving;}
  function running(s){return g.state==='playing'&&!g.paused&&!g.gameOver&&!s.dead&&!s.driving;}
  function reset(){observed=null;joints=null;work=false;workSerial++;}
  function recordStationary(s){joints=standingStep(null,s,.04);observed={...s,moving:false,sprinting:false,speed:0,vx:0,vy:0,work:false,reset:true};return observed;}
  function walkingSpeed(s){
   if(s.regional)return (root.DeadwallCore?.Frontier?.RULES?.walk||3.5)*32*(g.worldEvolution?.surface(s.view)?.speed||1);
   return 136*(g.exploration125?.currentSurface?.multiplier||1)*(g.infrastructure?.speed(s.x,s.y)||1);
  }
  function player(view){
   const s=sample(view),p=g.player||{};
   // Rendering is read-only for the simulation. Unobserved jumps are teleports, not steps.
   if(!sameScene(observed,s)||Math.hypot(s.x-observed.x,s.y-observed.y)>.001)recordStationary(s);
   if(!running(s)){observed.moving=false;observed.sprinting=false;observed.work=false;observed.speed=0;observed.vx=observed.vy=0;}
   const equipment=g.arsenal134?.visualEquipment?.(),hasEquipmentService=typeof g.arsenal134?.visualEquipment==='function';
   const proxy=s.regional?regionProxy:homeProxy,action=g.heroActions133?.pose?.()||null;
   const working=g.heroActions133?Boolean(action):observed.work&&running(s);
   Object.assign(proxy,{id:p.id||0,x:s.x,y:s.y,facing:s.facing,health:finite(p.health),maxHealth:finite(p.maxHealth,100),
    dead:s.dead,invulnerable:finite(p.invulnerable),visualUnarmed:hasEquipmentService?!equipment:Boolean(g.succession133&&!g.succession133.ownsWeapon(p.weapon)),visualEquipmentId:equipment?.id||null,visualEquipmentCategory:equipment?.category||null,visualEquipmentRate:equipment?.fireRate||0,weapon:p.weapon,reload:finite(p.reload),reloadTotal:finite(p.reloadTotal),
    shootCooldown:finite(p.shootCooldown),visualRecoil:finite(p.shootCooldown)>Math.max(0,1/(equipment?.fireRate||root.DeadwallCore?.WEAPONS?.[p.weapon]?.fireRate||3.2)-.08),meleeCooldown:s.regional&&!equipment?0:finite(p.meleeCooldown),stamina:s.stamina,
    vx:observed.vx,vy:observed.vy,visualPosture:s.posture,visualAction:working?'work':'',visualAction133:action,
    visualMoving:observed.moving&&running(s),visualSpeed:observed.speed,visualMotionReset:observed.reset,
    sprinting:observed.sprinting&&running(s),
    visualArticulated:s.posture==='stand'&&!s.dead&&!s.driving&&finite(p.reload)<=0&&finite(p.meleeCooldown)<=0&&!working,
    visualLowerFacing:joints?.hips??s.facing,visualUpperFacing:joints?.shoulders??s.facing,
    visualStride:joints?.phase||0,visualBackpedal:Boolean(joints?.backward),visualPivoting:Boolean(joints?.pivoting&&running(s))});
   return proxy;
  }
  function connect(){
   if(!g.art||g.art.presentation?.deadwallActorPresentation)return;
   const previous=g.art.presentation;
   const resolve=function(entity,kind){
    if(kind==='player'&&entity===g.player)return player();
    if(entity===homeProxy||entity===regionProxy)return entity;
    return typeof previous==='function'?previous.call(this,entity,kind)||entity:entity;
   };
   resolve.deadwallActorPresentation=true;g.art.presentation=resolve;
  }
  wrap('updateInteraction',(old,dt)=>{
   const before=finite(g.stats?.gathered),sites=[];
   if(g.input?.keys?.has('KeyE')&&!g.frontier?.active())for(const b of g.world?.buildings?.values()||[])if(!b.dead&&!b.completed)sites.push([b,b.progress]);
   const result=old(dt),s=sample();
   work=running(s)&&Number.isFinite(dt)&&dt>0&&(finite(g.stats?.gathered)>before+1e-9||sites.some(([b,progress])=>!b.dead&&b.progress>progress+1e-9));
   workSerial++;
   if(!sameScene(observed,s)||Math.hypot(s.x-observed.x,s.y-observed.y)>.001)recordStationary(s);
   observed.work=work;return result;
  });
  wrap('updatePlayer',(old,dt)=>{
   const before=sample(),gathered=finite(g.stats?.gathered),serial=workSerial,shift=Boolean(g.input?.keys?.has('ShiftLeft'));
   // Local updatePlayer calls updateInteraction, which also records work poses.
   // Keep the prior gait before that nested callback: otherwise every local
   // movement restarts at frame one while the regional gait keeps advancing.
   const priorJoints=sameScene(observed,before)&&Math.hypot(observed.x-before.x,observed.y-before.y)<.001?joints:null;
   const result=old(dt),after=sample(),dx=after.x-before.x,dy=after.y-before.y,distance=Math.hypot(dx,dy);
   const continuous=sameScene(before,after)&&Number.isFinite(dt)&&dt>0&&distance<=Math.max(3,500*dt);
   if(!continuous||!running(after)){recordStationary(after);return result;}
   const speed=distance/dt,moving=distance>.01;
   joints=standingStep(priorJoints,{facing:after.facing,vx:dx/dt,vy:dy/dt,moving,distance},dt);
   observed={...after,moving,speed:moving?speed:0,vx:moving?dx/dt:0,vy:moving?dy/dt:0,reset:false,
    sprinting:moving&&after.posture==='stand'&&shift&&after.stamina<before.stamina&&speed>walkingSpeed(after)*1.06,
    work:finite(g.stats?.gathered)>gathered+1e-9||workSerial!==serial&&work};
   return result;
  });
  for(const name of ['startNew','restoreSave','returnToMenu'])wrap(name,(old,...args)=>{const result=old(...args);reset();connect();return result;});
  wrap('render',(old,...args)=>{connect();return old(...args);});
  g.actorPresentation=Object.freeze({player,reset});connect();return g.actorPresentation;
 }
 return Object.freeze({install,JOINTS,standingStep});
});
