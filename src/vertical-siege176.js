/* Native enemies keep their IDs, health, loot and wave budget; only their supported altitude is owned here. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalCitadel175,Q=C.VerticalSiege176,T=C.VerticalRouting180;
 const N=root.DeadwallVerticalNetwork179||(typeof require==='function'?require('./vertical-network179.js'):null);
 const S=root.DeadwallVertical175State||(typeof require==='function'?require('./vertical-citadel175-state.js'):null);
 const live=e=>e&&!e.dead&&e.health>0;
 function create(g,h){
  let piles=[],claims=new Map(),clock=0;
  const plans=new Map(),patrols=new Map(),visited=new Map();
  const records=()=>h.state().climbers;
  const record=e=>e&&records().find(c=>c.id===e.id);
  const active=()=>g.state==='playing'&&!g.gameOver&&!g.paused&&!g.activeOverlay&&!g.frontier?.active();
  function enemyPose(e){
   const c=record(e),b=c&&h.building(c.site);if(!c||!b)return{z:0,site:null,level:-1,stage:'ground',bridge:null};
   let z=floorZ(b,c.level);
   if(c.stage==='climb'||c.stage==='fall')z=S.climbPoint(b,c).z;
   else if(c.stage==='stairs')z=floorZ(b,c.stair.from)+(c.stair.to-c.stair.from)*R.deckRise*c.stair.progress;
   return{z,site:c.site,level:c.level,stage:c.stage,bridge:c.bridge};
  }
  function approach(b,z){const q=S.bounds(b),x=z.x/R.tile,y=z.y/R.tile;
   const options=[{side:0,lane:x-q.x,start:q.y-y,span:q.w},{side:1,lane:y-q.y,start:x-q.x-q.w,span:q.h},{side:2,lane:x-q.x,start:y-q.y-q.h,span:q.w},{side:3,lane:y-q.y,start:q.x-x,span:q.h}];
   return options.filter(p=>p.start>=0&&p.start<=Q.apron&&p.lane>=Q.margin&&p.lane<=p.span-Q.margin).sort((a,b)=>a.start-b.start||a.side-b.side)[0]||null;
  }
  function prepare(dt){if(!active()||!Number.isFinite(dt)||dt<=0)return;clock-=Math.min(dt,R.step);if(clock>0)return;clock=Q.scanSeconds;
   const walls=h.state().sites.map(s=>h.building(s.id)).filter(b=>live(b)&&b.completed&&R.bases[b.type]?.wall&&!(b.def.gate&&b.gateMode==='open'));
   const lifted=new Set(records().map(c=>c.id)),map=new Map();piles=[];claims=new Map();
   for(const b of walls)for(let side=0;side<4;side++){const p={site:b.id,side,living:0,load:Math.max(0,b.corpseLoad||0)*Q.corpseFaceShare,height:0};map.set(b.id+':'+side,p);piles.push(p);}
   for(const z of g.zombies){if(!live(z)||lifted.has(z.id))continue;let best=null;
    for(const b of walls){const a=approach(b,z);if(!a||best&&a.start>=best.a.start)continue;
     const q=S.bounds(b),point={x:C.clamp(z.x,q.x*R.tile,(q.x+q.w)*R.tile),y:C.clamp(z.y,q.y*R.tile,(q.y+q.h)*R.tile)};
     if(!h.groundLine(z,point,false,b))continue;best={b,a};
    }
    if(best){const p=map.get(best.b.id+':'+best.a.side);p.living++;p.load+=(C.ENEMIES[z.kind]?.corpseLoad||1)*Q.livingWeight;claims.set(z.id,best);}
   }
   for(const p of piles)p.height=Math.min(R.bases[h.building(p.site).type].height,p.load/Q.loadPerMetre);
  }
  function pile(id,side){return piles.find(p=>p.site===id&&p.side===side);}
  function forget(id){h.state().climbers=records().filter(c=>c.id!==id);claims.delete(id);plans.delete(id);patrols.delete(id);visited.delete(id);clock=0;}
  function removeSupport(id){const ids=records().filter(c=>c.site===id).map(c=>c.id);h.state().climbers=records().filter(c=>c.site!==id);
   for(const n of ids){plans.delete(n);patrols.delete(n);visited.delete(n);const z=g.zombies.find(e=>e.id===n);if(live(z))g.killZombie(z,false);}clock=0;
  }
  function canStand(b,x,y,r){const surface=h.surfaceAt(x,y,R.bases[b.type].height);return surface?.b.id===b.id&&h.clearAt(x,y,R.bases[b.type].height,r);}
  function line(from,to,ignoredModule=null){const a=S.lookAt(from,to),direction=S.direction(a.yaw,a.pitch),distance=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);
   return h.geometry().every(b=>b.module===ignoredModule||S.rayBox(from,direction,b,Math.max(0,distance-.03))===null);
  }
  const address=c=>c.site+':'+c.level;
  const siteRecord=id=>h.state().sites.find(s=>s.id===id);
  const floorZ=(b,level)=>R.bases[b.type].height+level*R.deckRise;
  const completeFloor=(id,level)=>{const b=h.building(id),s=siteRecord(id);return live(b)&&b.completed&&s?.decks[level]?.progress===1;};
  const inBox=(q,x,y,r=0)=>x-r>=q.x-1e-7&&x+r<=q.x+q.w+1e-7&&y-r>=q.y-1e-7&&y+r<=q.y+q.h+1e-7;
  function linkShape(id){const l=h.state().network.links.find(l=>l.id===id&&l.progress===1&&l.health>0);return l&&N.shape(l,g.world.buildings,h.state().sites);}
  function location(c){
   const b=h.building(c.site);if(!b)return null;
   const floors=[{b,level:c.level}],bridge=c.bridge===null?null:linkShape(c.bridge);
   if(bridge){const other=[bridge.link.a,bridge.link.b].find(p=>p.site!==c.site);if(other&&completeFloor(other.site,other.level))floors.push({b:h.building(other.site),level:other.level});}
   const z=floorZ(b,c.level),boxes=[];
   for(const f of floors)for(const m of siteRecord(f.b.id)?.decks[f.level]?.modules||[])boxes.push({...S.moduleBox(f.b,m,z)});
   return{floors,bridge,z,boxes};
  }
  function walkClear(context,x,y,r){
   if(!context||![x,y,r].every(Number.isFinite))return false;
   for(const [dx,dy]of [[-r,-r],[r,-r],[-r,r],[r,r],[0,0]]){
    if(!context.floors.some(f=>completeFloor(f.b.id,f.level)&&inBox(S.bounds(f.b),x+dx,y+dy))&&!(context.bridge&&inBox(context.bridge,x+dx,y+dy)))return false;
   }
   return context.boxes.every(q=>x+r<=q.x||x-r>=q.x+q.w||y+r<=q.y||y-r>=q.y+q.h);
  }
  function segmentClear(context,a,b,r,budget){
   if(budget&&++budget.checks>T.maxLocalChecks)return false;
   const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/T.segmentStep));
   for(let i=0;i<=steps;i++)if(!walkClear(context,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,r))return false;
   return true;
  }
  // Small visibility graph around actual module footprints; no collision bypass or random teleport.
  function localPath(context,start,goals,r){
   const budget={checks:0};goals=goals.filter(p=>walkClear(context,p.x,p.y,r));if(!goals.length)return null;
   const pts=[start,...goals],goalCount=goals.length,margin=r+.025;
   for(const q of context.boxes)for(const [x,y]of [[q.x-margin,q.y-margin],[q.x+q.w+margin,q.y-margin],[q.x-margin,q.y+q.h+margin],[q.x+q.w+margin,q.y+q.h+margin]]){
    if(pts.length<T.maxLocalVertices&&walkClear(context,x,y,r))pts.push({x,y});
   }
   const distances=new Array(pts.length).fill(Infinity),prev=new Array(pts.length).fill(-1),seen=new Set(),edgeCache=new Map();distances[0]=0;
   while(seen.size<pts.length&&budget.checks<=T.maxLocalChecks){
    let u=-1;for(let i=0;i<pts.length;i++)if(!seen.has(i)&&(u<0||distances[i]<distances[u]))u=i;
    if(u<0||!Number.isFinite(distances[u]))break;
    if(u>0&&u<=goalCount){const out=[];for(let k=u;k>0;k=prev[k])out.unshift(pts[k]);return out;}
    seen.add(u);
    for(let v=0;v<pts.length;v++)if(!seen.has(v)){
     const k=Math.min(u,v)+':'+Math.max(u,v);if(!edgeCache.has(k))edgeCache.set(k,segmentClear(context,pts[u],pts[v],r,budget));
     const d=distances[u]+Math.hypot(pts[u].x-pts[v].x,pts[u].y-pts[v].y);
     if(edgeCache.get(k)&&d<distances[v]){distances[v]=d;prev[v]=u;}
    }
   }
   return null;
  }
  function walk(z,c,goals,stamp,dt,speed=Q.roofSpeed,accept=null){
   const context=location(c),r=z.radius*T.bodyRadiusFactor/R.tile,start={x:z.x/R.tile,y:z.y/R.tile};
   let plan=plans.get(z.id);
   if(!plan||plan.stamp!==stamp||plan.remaining<=0){plan={stamp,remaining:T.replanSeconds,points:localPath(context,start,goals,r)};plans.set(z.id,plan);}
   plan.remaining-=dt;if(!plan.points?.length)return false;
   let distance=speed*dt*(z.stagger>0?.35:1);
   while(distance>1e-7&&plan.points.length){
    const goal=plan.points[0],a={x:z.x/R.tile,y:z.y/R.tile},dx=goal.x-a.x,dy=goal.y-a.y,d=Math.hypot(dx,dy);
    if(d<T.arrivalMetres){plan.points.shift();continue;}
    const amount=Math.min(distance,d,T.segmentStep),next={x:a.x+dx/d*amount,y:a.y+dy/d*amount};
    if(accept&&!accept(next))return false;
    if(!segmentClear(context,a,next,r)){plans.delete(z.id);return false;}
    z.x=next.x*R.tile;z.y=next.y*R.tile;z.facing=Math.atan2(dy,dx);distance-=amount;
   }
   z.lastX=z.x;z.lastY=z.y;z.stuck=0;return true;
  }
  function floorBody(z,c){const b=h.building(c.site);return completeFloor(c.site,c.level)&&inBox(S.bounds(b),z.x/R.tile,z.y/R.tile,z.radius*T.bodyRadiusFactor/R.tile);}
  function groundFall(z,c){
   const height=enemyPose(z).z;forget(z.id);
   let landing=null;
   if(g.hostilePositionClear(z,z.x,z.y))landing={x:z.x,y:z.y};
   for(let r=T.landingStepMetres;!landing&&r<=T.landingSearchMetres;r+=T.landingStepMetres)for(let i=0;i<8;i++){
    const x=z.x+Math.cos(i*Math.PI/4)*r*R.tile,y=z.y+Math.sin(i*Math.PI/4)*r*R.tile;
    if(g.hostilePositionClear(z,x,y)){landing={x,y};break;}
   }
   if(!landing){g.killZombie(z,false);return;}
   Object.assign(z,landing);z.lastX=z.x;z.lastY=z.y;z.health-=height*Q.fallDamagePerMetre;
   if(z.health<=0)g.killZombie(z,false);else z.stagger=Math.max(z.stagger,1);
  }
  function reconcile(){
   for(const c of [...records()]){
    const z=g.zombies.find(z=>z.id===c.id);if(!live(z)){forget(c.id);continue;}
    if(c.bridge!==null&&!linkShape(c.bridge)){
     if(floorBody(z,c)){c.bridge=null;plans.delete(z.id);}else groundFall(z,c);
    }else if(c.stage==='stairs'&&(!completeFloor(c.site,c.stair.from)||!completeFloor(c.site,c.stair.to))){
     if(completeFloor(c.site,c.level)){c.stage='roof';c.stair=null;plans.delete(z.id);}else groundFall(z,c);
    }
   }
  }
  const bridgeOccupied=id=>records().some(c=>c.bridge===id&&live(g.zombies.find(z=>z.id===c.id)));
  const occupiesDeck=(id,level)=>records().some(c=>c.site===id&&(c.level===level||c.stair?.to===level));
  function stairStep(z,c,dt){
   if(!completeFloor(c.site,c.stair.from)||!completeFloor(c.site,c.stair.to)){reconcile();return;}
   const b=h.building(c.site),toContext=location({...c,level:c.stair.to,bridge:null}),r=z.radius*T.bodyRadiusFactor/R.tile;
   if(!walkClear(toContext,b.x/R.tile,b.y/R.tile,r)){c.stage='roof';c.stair=null;plans.delete(z.id);return;}
   c.stair.progress=Math.min(1,c.stair.progress+T.stairSpeed*dt/R.deckRise*(z.stagger>0?.35:1));
   if(c.stair.progress===1){c.level=c.stair.to;c.stage='roof';c.stair=null;plans.delete(z.id);}
  }
  function patrolEdge(z,c){
   const graph=h.navigationGraph(),start=address(c);if(!graph.nodes.has(start))return null;
   let known=visited.get(z.id);if(!known){known=new Set();visited.set(z.id,known);}known.add(start);
   const queue=[start],prev=new Map([[start,null]]);let goal=null;
   for(let i=0;i<queue.length&&queue.length<T.routeMemoryNodes;i++){
    const k=queue[i];if(k!==start&&!known.has(k)){goal=k;break;}
    for(const edge of graph.edges.get(k)||[]){const to=address(edge.to);if(!prev.has(to)){prev.set(to,{from:k,edge});queue.push(to);}}
   }
   if(goal===null){if(known.size>1)known.clear();return null;}
   let step=prev.get(goal);while(step&&step.from!==start)step=prev.get(step.from);return step?.edge||null;
  }
  function followEdge(z,c,edge,dt){
   const b=h.building(c.site);
   if(edge.kind==='stairs'){
    const goal={x:b.x/R.tile,y:b.y/R.tile};walk(z,c,[goal],'stairs:'+address(edge.to),dt);
    if(Math.hypot(z.x/R.tile-goal.x,z.y/R.tile-goal.y)<=T.arrivalMetres){
     // The centre was reached through collision-checked motion, not assigned from another position.
     c.stage='stairs';c.stair={from:c.level,to:edge.to.level,progress:0};plans.delete(z.id);
    }
    return;
   }
   const q=linkShape(edge.id);if(!q)return;const index=address(q.link.a)===address(c)?0:1,goal=q.ports[index];
   walk(z,c,[goal],'entry:'+edge.id,dt);
   if(Math.hypot(z.x/R.tile-goal.x,z.y/R.tile-goal.y)<=T.arrivalMetres){c.bridge=edge.id;plans.delete(z.id);}
  }
  function crossBridge(z,c,dt){
   const q=linkShape(c.bridge);if(!q){reconcile();return;}
   const source=address(q.link.a)===address(c)?0:1,destination=source? q.link.a:q.link.b,goal=q.ports[1-source];
   walk(z,c,[goal],'bridge:'+c.bridge,dt);
   if(Math.hypot(z.x/R.tile-goal.x,z.y/R.tile-goal.y)<=T.arrivalMetres){
    c.site=destination.site;c.level=destination.level;c.bridge=null;c.side=0;c.lane=Q.margin;c.start=0;plans.delete(z.id);
   }
  }
  function localTarget(z,c){
   const origin={x:z.x/R.tile,y:z.y/R.tile,z:enemyPose(z).z+T.bodyHeight},p=h.pose();
   const day=g.nightwatch?.isBlackout?.()?0:C.clamp(g.daylight?.()??1,0,1),range=Math.max(T.nightAwarenessMetres,T.dayAwarenessMetres*day);
   if(live(g.player)&&p.site===c.site&&p.level===c.level&&!p.travel&&Math.hypot(g.player.x/R.tile-origin.x,g.player.y/R.tile-origin.y)<=range&&line(origin,{x:g.player.x/R.tile,y:g.player.y/R.tile,z:p.z+T.bodyHeight})){
    return{x:g.player.x/R.tile,y:g.player.y/R.tile,kind:'player',goals:[{x:g.player.x/R.tile,y:g.player.y/R.tile}]};
   }
   const ally=(h.alliesAt?.(c.site,c.level)||[]).filter(live).filter(u=>Math.hypot(u.x/R.tile-origin.x,u.y/R.tile-origin.y)<=range&&line(origin,{x:u.x/R.tile,y:u.y/R.tile,z:origin.z})).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y)||a.id-b.id)[0];
   if(ally)return{x:ally.x/R.tile,y:ally.y/R.tile,kind:'unit',id:ally.id,goals:[{x:ally.x/R.tile,y:ally.y/R.tile}]};
   let target=null,best=Infinity;const b=h.building(c.site),s=siteRecord(c.site),r=z.radius*T.bodyRadiusFactor/R.tile;
   for(const m of s.decks[c.level].modules){
    const q=S.moduleBox(b,m,floorZ(b,c.level)),x=C.clamp(origin.x,q.x,q.x+q.w),y=C.clamp(origin.y,q.y,q.y+q.h),d=Math.hypot(x-origin.x,y-origin.y);
    if(d>=best||d>range||!line(origin,{x,y,z:origin.z},m.id))continue;
    const reach=Q.meleeReach*.65+r;
    target={x,y,kind:'module',id:m.id,goals:[{x:C.clamp(origin.x,q.x-reach,q.x+q.w+reach),y:C.clamp(origin.y,q.y-reach,q.y+q.h+reach)},
     {x:q.x-reach,y:q.y+q.h/2},{x:q.x+q.w+reach,y:q.y+q.h/2},{x:q.x+q.w/2,y:q.y-reach},{x:q.x+q.w/2,y:q.y+q.h+reach}]};best=d;
   }
   return target;
  }
  function roof(z,c,b,dt){
   if(c.bridge!==null){crossBridge(z,c,dt);return;}
   const target=localTarget(z,c);
   if(!target){let plan=patrols.get(z.id);if(!plan||plan.remaining<=0){plan={edge:patrolEdge(z,c),remaining:T.replanSeconds,at:address(c)};patrols.set(z.id,plan);}
    plan.remaining-=dt;if(plan.at!==address(c)){patrols.delete(z.id);return;}if(plan.edge)followEdge(z,c,plan.edge,dt);return;
   }
   const dx=target.x-z.x/R.tile,dy=target.y-z.y/R.tile,d=Math.hypot(dx,dy),def=C.ENEMIES[z.kind];z.facing=Math.atan2(dy,dx);
   if(d<=Q.meleeReach+z.radius/R.tile){
    if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;const amount=def.damage*g.difficulty.enemyDamage;
     if(target.kind==='player')g.damagePlayer(amount);else if(target.kind==='unit')g.damageUnit(g.units.find(u=>u.id===target.id),amount);else h.damageModule(target.id,amount*(def.structureDamage||1));
     g.recordActorAction159?.(z,'attack',z.attackCooldown,{facing:z.facing});
    }
    return;
   }
   walk(z,c,target.goals,target.kind+':'+(target.id??'')+':'+Math.round(target.x*2)+':'+Math.round(target.y*2),dt);
  }
  function update(z,dt){let c=record(z);if(!active()||!Number.isFinite(dt)||dt<=0)return !!c;dt=Math.min(dt,R.step);
   if(!c){if(!['runner','crawler'].includes(z.kind)||records().length>=Q.maxClimbers)return false;const claim=claims.get(z.id);if(!claim)return false;
    const {b,a}=claim,p=pile(b.id,a.side);if(!live(b)||!b.completed||!p||p.height+Q.reach<R.bases[b.type].height)return false;
    const current=approach(b,z);if(!current||current.side!==a.side)return false;
    c={id:z.id,site:b.id,side:current.side,lane:current.lane,start:current.start,progress:0,stage:'climb',fallHeight:0,level:0,bridge:null,stair:null};const end=S.climbPoint(b,{...c,progress:1});
    if(!canStand(b,end.x*R.tile,end.y*R.tile,z.radius*.78))return false;records().push(c);h.notice('La horde atteint le chemin de ronde !');
   }
   const b=h.building(c.site);if(!live(b)){forget(z.id);g.killZombie(z,false);return true;}
   if(c.stage==='stairs'){stairStep(z,c,dt);return true;}
   if(c.stage==='roof'){roof(z,c,b,dt);return true;}
   const height=R.bases[b.type].height,pressure=pile(b.id,c.side);
   if(c.stage==='climb'&&((b.def.gate&&b.gateMode==='open')||!pressure||pressure.height+Q.reach<S.climbPoint(b,c).z)){c.fallHeight=S.climbPoint(b,c).z;c.stage='fall';}
   if(c.stage==='fall'){c.progress=Math.max(0,c.progress-Q.fallSpeed*dt/height);}
   else c.progress=Math.min(1,c.progress+Q.climbSpeed*dt/height*(z.stagger>0?.35:1));
   const p=S.climbPoint(b,c);z.x=p.x*R.tile;z.y=p.y*R.tile;z.lastX=z.x;z.lastY=z.y;z.stuck=0;
   if(c.stage==='fall'&&c.progress===0){forget(z.id);z.health-=c.fallHeight*Q.fallDamagePerMetre;if(z.health<=0)g.killZombie(z,false);else z.stagger=Math.max(z.stagger,1);return true;}
   if(c.progress===1){if(canStand(b,z.x,z.y,z.radius*.78))c.stage='roof';else{c.fallHeight=height;c.stage='fall';}}
   return true;
  }
  function reset(){piles=[];claims.clear();plans.clear();patrols.clear();visited.clear();clock=0;}
  function canMelee(a,b){const az=a===g.player?h.pose().z:(h.unitPose?.(a)?.z||enemyPose(a).z),bz=b===g.player?h.pose().z:(h.unitPose?.(b)?.z||enemyPose(b).z);if(Math.abs(az-bz)>Q.meleeReach)return false;
   return line({x:a.x/R.tile,y:a.y/R.tile,z:az+.8},{x:b.x/R.tile,y:b.y/R.tile,z:bz+.8});
  }
  const navigation=Object.freeze({walk,line,walkable:(c,x,y,r)=>walkClear(location(c),x,y,r),forget:id=>plans.delete(id)});
  return Object.freeze({navigation,reconcile,bridgeOccupied,occupiesDeck,prepare,update,enemyPose,forget,removeSupport,reset,canMelee,pressure:()=>piles.map(p=>({...p}))});
 }
 const api={create};root.DeadwallVerticalSiege176=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
