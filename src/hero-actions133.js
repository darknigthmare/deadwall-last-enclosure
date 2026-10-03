/* Presentation only: gestures follow successful field transactions, never key presses. */
(function(root){
 'use strict';
 const finite=n=>Number.isFinite(n)?n:0;
 function resourceAction(type,scenery=false){return scenery?'pry':type==='wood'?'chop':type==='stone'?'pick':['scrap','fuel'].includes(type)?'pry':'handle';}
 function install(g){
  if(g.heroActions133)return g.heroActions133;
  let action=null,serial=0,insidePlayer=false,insideUpdate=false,interactionStep=0;
  const wrap=(name,fn)=>{const old=g[name];if(typeof old==='function')g[name]=function(...args){return fn(old.bind(this),...args);};};
  const running=()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay&&g.player&&!g.player.dead&&g.player.health>0;
  const armed=()=>g.input?.mouseDown||g.input?.touchFire||g.player?.reload>0||g.player?.meleeCooldown>0;
  function position(){const f=g.frontier?.position?.(),regional=!!f?.active,p=g.player||{};return{world:g.world,player:p,regional,x:regional?f.x*32:p.x,y:regional?f.y*32:p.y,z:regional?f.z:0,inside:regional?f.inside:null,driving:regional?!!f.car?.driving:!!g.expeditions?.driving?.()};}
  const same=(a,b)=>a&&b&&a.world===b.world&&a.player===b.player&&a.regional===b.regional&&a.z===b.z&&a.inside===b.inside&&Math.hypot(a.x-b.x,a.y-b.y)<.12;
  function reset(){action=null;serial++;}
  function record(kind,dt,{x,y}={},oneShot=false){
   const p=position();if(!running()||armed()||p.driving||!Number.isFinite(dt)||dt<=0){reset();return;}
   const continuous=action?.kind===kind&&same(action.position,p)&&action.oneShot===oneShot;
   action={kind,elapsed:(continuous?action.elapsed:0)+Math.min(dt,.1),position:p,oneShot,
    facing:Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x-p.x,y-p.y)>.1?Math.atan2(y-p.y,x-p.x):finite(g.player.facing)};
   serial++;
  }
  function pose(){
   if(!action)return null;const p=position();
   if(g.state!=='playing'||g.gameOver||g.player.dead||g.player.health<=0||p.driving||armed()||!same(action.position,p)){reset();return null;}
   const posture=p.regional?g.worldEvolution?.posture?.().key:g.player.posture;
   // The action sheets contain planted feet. A prone/crouching character retains
   // the matching native posture instead of snapping upright to swing a tool.
   if(posture&&posture!=='stand')return null;
   return{kind:action.kind,elapsed:action.elapsed,facing:action.facing,oneShot:action.oneShot};
  }
  function bag(){return{...g.player?.carry};}
  function gained(before){return Object.keys(before).filter(k=>finite(g.player.carry[k])>finite(before[k])+1e-9).sort((a,b)=>(g.player.carry[b]-before[b])-(g.player.carry[a]-before[a]))[0]||null;}
  function localTarget(){const a=g.fieldcraft?.context?.().action;return a&&Number.isFinite(a.x)&&Number.isFinite(a.y)?a:null;}
  function localHarvest(before,dt){
   const resource=gained(before),target=localTarget(),node=target?g.world.nodes.find(n=>Math.abs(n.x-target.x)<.01&&Math.abs(n.y-target.y)<.01):null;
   if(resource)record(resourceAction(resource,!!node?.sceneryKind),dt,target||{});else reset();
  }
  function idleStep(dt){if(!action)return;if(action.oneShot&&Number.isFinite(dt)&&dt>0&&running()){action.elapsed+=Math.min(.1,dt);if(action.elapsed>=.72)reset();}else if(!action.oneShot)reset();}
  wrap('updateInteraction',(old,dt)=>{
   if(!running()||!Number.isFinite(dt)||dt<=0)return old(dt);
   const before=bag(),gathered=finite(g.stats?.gathered),deposited=finite(g.depositedResources),stamp=serial;
   const sites=g.input?.keys?.has('KeyE')?[...g.world.buildings.values()].filter(b=>!b.dead&&!b.completed&&Math.hypot(b.x-g.player.x,b.y-g.player.y)<200).map(b=>[b,b.progress]):[];
   const previousStep=interactionStep;interactionStep=dt;let result;try{result=old(dt);}finally{interactionStep=previousStep;}
   if(!g.frontier?.active()){
    const built=sites.find(([b,progress])=>!b.dead&&b.progress>progress+1e-9);
    if(finite(g.stats?.gathered)>gathered+1e-9)localHarvest(before,dt);
    else if(built)record('build',dt,built[0]);
    else if(finite(g.depositedResources)>deposited+1e-9)record('handle',dt,{},true);
    else if(serial===stamp&&!insidePlayer&&!insideUpdate)idleStep(dt);
   }
   return result;
  });
  wrap('clearCorpsesWithWorker',(old,unit,wall,dt)=>{
   const before=finite(wall?.corpseLoad),result=old(unit,wall,dt);
   if(unit===g.player&&finite(wall?.corpseLoad)<before-1e-9&&result>0)record('dig',interactionStep||Math.min(finite(dt),.1)*(root.DeadwallCore?.WORKER_RULES?.cleanupPerSecond||.9)/(root.DeadwallCore?.LINECARE_RULES?.shovelPerSecond||1.2),g.workerCleanupPoint(unit,wall));
   return result;
  });
  wrap('updatePlayer',(old,dt)=>{
   const p=position(),before=bag(),gathered=finite(g.stats?.gathered),stamp=serial;
   insidePlayer=true;let result;try{result=old(dt);}finally{insidePlayer=false;}
   if(!running()||!Number.isFinite(dt)||dt<=0)return result;
   const after=position();if(!same(p,after)||after.driving||armed()){reset();return result;}
   if(after.regional&&finite(g.stats?.gathered)>gathered+1e-9){
    const resource=gained(before);
    // Read the expensive detail view only after a real successful regional
    // transaction; idle frames use the lightweight position() accessor.
    const f=resource?g.frontier.overview():null,t=f?.focus;
    if(resource)record(resourceAction(resource,!!t?.poi),dt,t?{x:t.x*32,y:t.y*32}:{});
   }else if(serial===stamp&&!insideUpdate)idleStep(dt);
   return result;
  });
  wrap('update',(old,dt)=>{
   const stamp=serial,active=running(),p=position(),taskBefore=g.worldOps131?.busy?.()?g.worldOps131.activity?.():null,careBefore=g.survivalPack?.busy?.()?g.survivalPack.activity?.():null;
   insideUpdate=true;let result;try{result=old(dt);}finally{insideUpdate=false;}
   if(!active||!running()||!Number.isFinite(dt)||dt<=0)return result;
   if(!same(p,position())||armed()){reset();return result;}
   const taskAfter=g.worldOps131?.busy?.()?g.worldOps131.activity?.():null,careAfter=g.survivalPack?.busy?.()?g.survivalPack.activity?.():null;
   if(taskBefore?.kind==='reserve'&&(taskAfter?.kind==='reserve'&&taskAfter.progress>taskBefore.progress+1e-9))record('open',dt);
   else if(['dressing','dressingLight'].includes(careBefore?.kind)&&careAfter?.kind===careBefore.kind&&careAfter.progress>careBefore.progress+1e-9)record('dressing',dt);
   else if(serial===stamp)idleStep(dt);
   return result;
  });
  for(const name of ['startNew','restoreSave','returnToMenu'])wrap(name,(old,...a)=>{const r=old(...a);if(r!==false)reset();return r;});
  g.heroActions133=Object.freeze({pose,reset});return g.heroActions133;
 }
 const api=Object.freeze({install,resourceAction});root.DeadwallHeroActions133=api;if(typeof module==='object'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this);
