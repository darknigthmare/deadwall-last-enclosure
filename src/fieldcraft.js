/* 1.14: consistent physical footprints and contextual field controls. */
(function(root){
'use strict';
const C=root.DeadwallCore,T=root.DeadwallTactics;
const rules=C.Fieldcraft.RULES;
function reserveRect(e){if(e.def)return{l:e.left,t:e.top,r:e.right,b:e.bottom};const size=(e.renderSize||e.radius*(e.type==='wood'?3.5:2.65)||48)*1.06;return{l:e.x-size/2,t:e.y-size/2,r:e.x+size/2,b:e.y+size/2};}
// Opaque vehicle proportions measured from the shipped, matte-decoded atlases.
// Stable metadata keeps collision independent of image load timing. Packing keeps
// the former reserve, so correcting an oversized collider never relocates a save.
const vehicleImageSize134=Object.freeze({sedan:[136,284],pickup:[150,302],van:[150,303],truck:[158,314],ambulance:[257,232],bus:[276,232],utilityTruck:[286,236],tanker:[261,233]});
function rect(e){
 const fallback=reserveRect(e);if(e.def)return fallback;
 const variant=Math.abs(e.variant||0)%4,key=e.sceneryKind||(e.type==='scrap'?['scrap','sedan','van','truck'][variant]:e.type==='fuel'&&variant%2?'pickup':null),image=vehicleImageSize134[key];
 if(!image)return fallback;
 const size=e.renderSize||e.radius*2.65,scale=size/Math.max(...image),w=image[0]*scale,h=image[1]*scale;
 return{l:e.x-w/2,t:e.y-h/2,r:e.x+w/2,b:e.y+h/2};
}
function overlap(a,b,gap=0){return a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap;}
function collides(e,x,y,r=0){const b=rect(e),dx=x-Math.max(b.l,Math.min(b.r,x)),dy=y-Math.max(b.t,Math.min(b.b,y));return dx*dx+dy*dy<r*r-1e-6||x>b.l&&x<b.r&&y>b.t&&y<b.b;}
function distance(p,e){const b=rect(e);return Math.hypot(p.x-Math.max(b.l,Math.min(b.r,p.x)),p.y-Math.max(b.t,Math.min(b.b,p.y)));}
const live=e=>e&&!e.dead&&(e.health===undefined||e.health>0);
const physical=e=>Boolean(e?.def||e?.fixture||e?.maxAmount!==undefined);
function attach(g){
 if(g.fieldcraft)return g.fieldcraft;
 let world=null,solids=[],spatialIndex=new Map(),moving=null,quote=null,mounted=null,attempt=false,outcome='',opacity=null,action=null,indexWorld=null,indexNodes=null,indexVersion=-1,feedbackUntil=0;
 const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
 function objects(){return g.world.nodes.filter(n=>!n.depleted).concat(C.Expeditions.SITES.map(s=>({id:'exp:'+s.id,x:s.x,y:s.y,renderSize:86,fixture:true})));}
 function index(){indexWorld=g.world;indexNodes=g.world.nodes;indexVersion=g.world.navigationVersion;solids=objects();spatialIndex=new Map();for(const e of solids){const b=rect(e);for(let y=Math.floor(b.t/128);y<=Math.floor(b.b/128);y++)for(let x=Math.floor(b.l/128);x<=Math.floor(b.r/128);x++){const k=x+':'+y;if(!spatialIndex.has(k))spatialIndex.set(k,[]);spatialIndex.get(k).push(e);}}}
 function props(x,y,r=0){if(indexWorld!==g.world||indexNodes!==g.world.nodes||indexVersion!==g.world.navigationVersion)index();const found=new Set();for(let yy=Math.floor((y-r)/128);yy<=Math.floor((y+r)/128);yy++)for(let xx=Math.floor((x-r)/128);xx<=Math.floor((x+r)/128);xx++)for(const p of spatialIndex.get(xx+':'+yy)||[])if(!p.depleted)found.add(p);return found;}
 function blocked(x,y,r=0,ignore=null){
  for(let yy=Math.floor((y-r)/32);yy<=Math.floor((y+r)/32);yy++)for(let xx=Math.floor((x-r)/32);xx<=Math.floor((x+r)/32);xx++){const b=g.world.atCell(xx,yy);if(b!==ignore&&T.blocksFriendly(b)&&collides(b,x,y,r))return b;}
  for(const p of props(x,y,r))if(p!==ignore&&collides(p,x,y,r))return p;
  return null;
 }
 function positionFree(u,x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>u.radius+3&&y>u.radius+3&&x<C.WORLD_SIZE-u.radius-3&&y<C.WORLD_SIZE-u.radius-3&&!blocked(x,y,u.radius*.9);}
 function segment(u,a,b){const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/7));for(let i=0;i<=n;i++)if(!g.friendlyPositionClear(u,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;}
 function service(u,e){
  if(!e)return null;
  if(!physical(e)){if(g.friendlyPositionClear(u,e.x,e.y))return e;e=blocked(e.x,e.y,u.radius)||e;}
  const b=rect(e),r=u.radius+(e.def?14:4),x=Math.max(b.l+8,Math.min(b.r-8,u.x)),y=Math.max(b.t+8,Math.min(b.b-8,u.y));
  const points=[{x:b.l-r,y},{x:b.r+r,y},{x,y:b.t-r},{x,y:b.b+r}];
  for(let x=b.l+16;x<b.r;x+=32)points.push({x,y:b.t-r},{x,y:b.b+r});
  for(let y=b.t+16;y<b.b;y+=32)points.push({x:b.l-r,y},{x:b.r+r,y});
  const left=Math.floor((b.l-r-16)/32)*32+16,right=Math.ceil((b.r+r-16)/32)*32+16,top=Math.floor((b.t-r-16)/32)*32+16,bottom=Math.ceil((b.b+r-16)/32)*32+16;for(let yy=Math.floor(b.t/32)*32+16;yy<b.b;yy+=32)points.push({x:left,y:yy},{x:right,y:yy});for(let xx=Math.floor(b.l/32)*32+16;xx<b.r;xx+=32)points.push({x:xx,y:top},{x:xx,y:bottom});
  const reach=e.maxAmount!==undefined?e.radius+12:Math.max(36,u.radius+15);return points.filter(p=>distance(p,e)<=reach&&g.friendlyPositionClear(u,p.x,p.y)&&g.friendlyPositionClear(u,Math.floor(p.x/32)*32+16,Math.floor(p.y/32)*32+16)).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0]||null;
 }
 function workAt(u,e,r){if(!e||!u)return false;if(!physical(e))return Math.hypot(u.x-e.x,u.y-e.y)<=r&&segment(u,u,e);if(distance(u,e)>r||!g.friendlyPositionClear(u,u.x,u.y))return false;const b=rect(e),p={x:Math.max(b.l,Math.min(b.r,u.x)),y:Math.max(b.t,Math.min(b.b,u.y))},d=Math.hypot(u.x-p.x,u.y-p.y);return d===0?Boolean(e.def&&!e.completed):segment(u,u,{x:p.x+(u.x-p.x)/d*(u.radius+1),y:p.y+(u.y-p.y)/d*(u.radius+1)});}
 function pack(){
  const placed=[...g.world.buildings.values()].filter(live).map(reserveRect);
  for(const p of C.Expeditions.SITES)placed.push(reserveRect({...p,renderSize:90}));
  for(const p of g.dayworks.snapshot().sites)placed.push(reserveRect({...p,renderSize:50}));
  for(const p of g.world.sites||[])placed.push(reserveRect({...p,renderSize:96}));
  const bins=new Map(),keys=b=>{const a=[];for(let y=Math.floor(b.t/128);y<=Math.floor(b.b/128);y++)for(let x=Math.floor(b.l/128);x<=Math.floor(b.r/128);x++)a.push(x+':'+y);return a;};
  const insert=b=>{for(const k of keys(b)){if(!bins.has(k))bins.set(k,[]);bins.get(k).push(b);}};placed.forEach(insert);
  const fits=(n,x,y)=>{const b=reserveRect({...n,x,y});if(b.l<38||b.t<38||b.r>4058||b.b>4058||b.l<2100&&b.r>1996||b.t<2100&&b.b>1996||Math.hypot(x-2048,y-2048)<270)return false;for(const k of keys(b))for(const a of bins.get(k)||[])if(overlap(a,b,3))return false;return true;};
  for(const n of g.world.nodes){if(n.depleted)continue;if(!fits(n,n.x,n.y)){const ox=n.x,oy=n.y;let found=false;for(let r=18;r<=2400&&!found;r+=18){const count=Math.max(12,Math.ceil(r/9));for(let i=0;i<count;i++){const a=i/count*Math.PI*2+(n.id%13)*.11,x=Math.round((ox+Math.cos(a)*r)*100)/100,y=Math.round((oy+Math.sin(a)*r)*100)/100;if(fits(n,x,y)){n.x=x;n.y=y;found=true;break;}}}if(!found)throw Error('Décor sans emplacement libre : '+n.id);}insert(reserveRect(n));}
 }
 function recoverActor(u){if(!live(u)||positionFree(u,u.x,u.y))return;const obstruction=blocked(u.x,u.y,u.radius);let candidates=obstruction?[service(u,obstruction)].filter(Boolean):[];for(let r=16;r<700;r+=16){for(let i=0;i<24;i++)candidates.push({x:u.x+Math.cos(i*Math.PI/12)*r,y:u.y+Math.sin(i*Math.PI/12)*r});const p=candidates.find(p=>{if(!positionFree(u,p.x,p.y))return false;const count=Math.max(1,Math.ceil(Math.hypot(p.x-u.x,p.y-u.y)/6));for(let i=1;i<=count;i++)if(blocked(u.x+(p.x-u.x)*i/count,u.y+(p.y-u.y)*i/count,u.radius*.9,obstruction))return false;return true;});if(p){u.x=p.x;u.y=p.y;u.navigation=null;return;}candidates=[];}}
 function setup(coords=[],preserveLayout=false){
  world=g.world;
  if(coords.length){const map=new Map(coords.map(p=>[p[0],p]));for(const n of world.nodes){const p=map.get(n.id);if(p){n.x=p[1];n.y=p[2];}}}
  // A current save owns its physical positions. A lawful construction may sit
  // outside a vehicle's collider but inside its older packing reserve.
  // Repacking on Continue would move that saved vehicle without player action.
  if(!preserveLayout)pack();index();
  if(!world._fieldcraft){world._fieldcraft=true;world.solidForFriendly=(x,y)=>blocked(x,y);const cost=world.movementCost.bind(world);world.movementCost=(x,y)=>[...props(x*32+16,y*32+16,12)].some(p=>collides(p,x*32+16,y*32+16,12))?Infinity:cost(x,y);const place=world.placement.bind(world);world.placement=(def,x,y,rotation=0,ignore=0)=>{const q=place(def,x,y,rotation,ignore);if(!q.valid)return q;const a={l:x*32,t:y*32,r:(x+def.size[rotation%2?1:0])*32,b:(y+def.size[rotation%2?0:1])*32};for(const p of objects())if(overlap(a,rect(p)))return{valid:false,reason:'Décor ou station dans l’emprise.'};return q;};}
  for(const u of [g.player,...g.units])recoverActor(u);
  const v=g.expeditions.car();if(v&&v.health>0){const p={x:v.x,y:v.y,radius:g.expeditions.entity()?.radius||C.Expeditions.RULES.carRadius,health:1};recoverActor(p);v.x=p.x;v.y=p.y;if(v.driving){g.player.x=v.x;g.player.y=v.y;}}
  for(const truck of g.territories?.truckEntities()||[]){const probe={x:truck.x,y:truck.y,radius:C.Territories.RULES.truckRadius,health:1};recoverActor(probe);truck.x=probe.x;truck.y=probe.y;}
  for(const z of g.zombies)if(live(z)&&[...props(z.x,z.y,z.radius)].some(p=>collides(p,z.x,z.y,z.radius*.7)))recoverActor(z);
  world.navigationVersion++;world.flowDirty=true;
 }
 g.friendlyPositionClear=positionFree;g.workerCanWorkAt=workAt;
 const originalMove=g.moveUnitToward.bind(g);g.moveUnitToward=(u,t,dt,speed=u.speed)=>{
 const p=service(u,t);if(!p){u.navigation={goalX:Math.floor(t.x/32),goalY:Math.floor(t.y/32),version:g.world.navigationVersion,cells:null,next:0,direct:false,retryAt:g.elapsed+2};return false;}
 const result=originalMove(u,p,dt,speed);if(u.navigation){u.navigation.requestX=Math.floor(t.x/32);u.navigation.requestY=Math.floor(t.y/32);}return result;};
 g.moveFriendly=(u,dx,dy)=>{if(!Number.isFinite(dx)||!Number.isFinite(dy))return;const b=g.infrastructure.speed(u.x,u.y);dx*=b;dy*=b;const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));for(let i=0;i<n;i++){if(g.friendlyPositionClear(u,u.x+dx/n,u.y))u.x+=dx/n;if(g.friendlyPositionClear(u,u.x,u.y+dy/n))u.y+=dy/n;}};
 wrap('recruit',(old,...a)=>{const ids=new Set(g.units.map(u=>u.id)),r=old(...a);for(const u of g.units)if(!ids.has(u.id))recoverActor(u);return r;});
 wrap('updateDirector',(old,...a)=>{const ids=new Set(g.units.map(u=>u.id)),r=old(...a);for(const u of g.units)if(!ids.has(u.id))recoverActor(u);return r;});
 const arrival=g.coreArrivalPosition.bind(g);g.coreArrivalPosition=(u,p)=>{const q={...u,...arrival(u,p),health:1,dead:false};recoverActor(q);return{x:q.x,y:q.y};};
 wrap('completeBuilding',(old,b)=>{const actors=[g.player,...g.units,...g.zombies,g.expeditions.entity(),...g.territories.truckEntities()].filter(Boolean);if(b&&b.type!=='spikes'&&actors.some(u=>live(u)&&collides(b,u.x,u.y,u.radius||12)&&(!b.def.gate||T.gateMode(b)==='closed'||T.gateMode(b)==='auto'&&g.zombies.includes(u)))){const d=Math.max(0,b.progress-.999);b.health=Math.max(.001,b.health-d*b.maxHealth*.88);b.progress=Math.min(b.progress,.999);b.completionBlocked=true;if(collides(b,g.player.x,g.player.y,g.player.radius))g.interactionText='Emprise occupée : sortez du chantier pour l’achever.';return false;}return old(b);});
 // Hostile paths keep the existing flow costs, but cannot cut diagonally through a prop corner.
 function propSegment(z,to){const n=Math.max(1,Math.ceil(Math.hypot(to.x-z.x,to.y-z.y)/4));for(let i=1;i<=n;i++){const x=z.x+(to.x-z.x)*i/n,y=z.y+(to.y-z.y)*i/n;if([...props(x,y,z.radius)].some(p=>collides(p,x,y,z.radius*.7)))return false;}return true;}
 function steerZombie(z,dir,step){
  if(!Number.isFinite(step)||step<=0)return dir;
  if(propSegment(z,{x:z.x+dir.x*step,y:z.y+dir.y*step}))return dir;
  const gx=Math.max(0,Math.min(127,Math.floor(z.x/32))),gy=Math.max(0,Math.min(127,Math.floor(z.y/32))),candidates=[];
  for(const [dx,dy]of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){const x=gx+dx,y=gy+dy;if(x<0||y<0||x>=128||y>=128)continue;const p={x:x*32+16,y:y*32+16},d=Math.hypot(p.x-z.x,p.y-z.y);if(d<.05||!propSegment(z,p))continue;candidates.push({...p,d,cost:g.flow.values[y*128+x]});}
  candidates.sort((a,b)=>a.cost-b.cost||a.d-b.d);const p=candidates[0];if(!p)return{x:0,y:0};const scale=Math.max(p.d,step);return{x:(p.x-z.x)/scale,y:(p.y-z.y)/scale};
 }
 wrap('spawnZombie',(old,...a)=>{const r=old(...a),z=r?g.zombies[g.zombies.length-1]:null;if(z&&[...props(z.x,z.y,z.radius)].some(p=>collides(p,z.x,z.y,z.radius*.7)))recoverActor(z);return r;});
 const hostile=g.hostilePositionClear.bind(g);g.hostilePositionClear=(u,x,y)=>hostile(u,x,y)&&![...props(x,y,u.radius)].some(p=>collides(p,x,y,u.radius*.7));
 wrap('updateZombies',(old,dt)=>{const before=new Map(g.zombies.map(z=>[z.id,{x:z.x,y:z.y}])),r=old(dt);for(const z of g.zombies)if(!z.dead&&![...props(z.x,z.y,z.radius)].every(p=>!collides(p,z.x,z.y,z.radius*.7))){const p=before.get(z.id);if(p){z.x=p.x;z.y=p.y;}}return r;});
 function allowed(){return !g.frontier?.active()&&g.canIssueCommand()&&!g.player.dead&&!g.expeditions.driving()&&g.player.reload<=0&&!g.expansions?.busy();}
 function nearby(){return [...world.buildings.values()].filter(b=>live(b)&&workAt(g.player,b,rules.range)).sort((a,b)=>distance(g.player,a)-distance(g.player,b))[0]||null;}
 function price(b,rate){const cost={};for(const k of ['wood','scrap','stone'])if(b.def.cost[k])cost[k]=Math.max(1,Math.ceil(b.def.cost[k]*rate));if(!Object.keys(cost).length)cost.scrap=1;return cost;}
 function proposal(b,x,y,rotation,kind='move'){
  const no=reason=>({ok:false,reason});
  if(!allowed()||!b||!live(b)||!b.completed||!workAt(g.player,b,rules.range))return no('Approchez une structure achevée et accessible.');
  if(['core','sectorPost'].includes(b.type))return no('Le centre et les postes territoriaux restent ancrés.');
  if(g.phase!=='calm'||b.underAttack>0||b.siegeOffline||mounted===b.id)return no('Réimplantation au calme, sans feu ni attaque.');
  if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(rotation)||rotation<0||rotation>3)return no('Coordonnées invalides.');
  if(x===b.gx&&y===b.gy&&rotation===b.rotation)return no('Emplacement inchangé.');
  const place=world.placement(b.def,x,y,rotation,b.id);if(!place.valid)return no(place.reason);
  const a={l:x*32,t:y*32,r:(x+b.def.size[rotation%2?1:0])*32,b:(y+b.def.size[rotation%2?0:1])*32};
  for(const u of [g.player,...g.units,...g.zombies,g.expeditions.entity(),...g.territories.truckEntities()].filter(Boolean))if(live(u)){const r=u.radius||12;if(u.x+r>a.l&&u.x-r<a.r&&u.y+r>a.t&&u.y-r<a.b)return no('Un personnage ou véhicule occupe la nouvelle emprise.');}
  const cost=price(b,kind==='rotate'?rules.rotateRate:rules.moveRate);
  return{ok:C.canAfford(g.resources,cost),reason:'Coût : '+C.resourceText(cost),id:b.id,x,y,rotation,kind,cost,origin:[b.gx,b.gy,b.rotation,b.health,b.progress]};
 }
 function commit(){if(!quote)return false;const q=quote,b=world.buildings.get(q.id),now=proposal(b,q.x,q.y,q.rotation,q.kind);if(!now.ok||JSON.stringify(now.origin)!==JSON.stringify(q.origin)){quote=null;g.notify('Devis périmé. Aucun matériau débité.');return false;}if(!C.spend(g.resources,now.cost))return false;const cells=world.cells(b);b.gx=q.x;b.gy=q.y;b.rotation=q.rotation;world.rewrite(b,cells);quote=null;moving=null;g.refreshMetrics(true);g.nightwatch.invalidate();g.save(false);return true;}
 function cancel(){moving=null;quote=null;}
 function beginMove(b=nearby()){if(!allowed()||!b)return false;g.cancelPlacement();moving=b.id;quote=null;g.showCommand?.(false);g.notify('Choisissez une cellule, puis confirmez le devis.');return true;}
 function plan(x,y){const b=world.buildings.get(moving);return quote=proposal(b,x,y,b?b.rotation:0);}
 function rotate(b=nearby()){if(!b)return false;quote=proposal(b,b.gx,b.gy,(b.rotation+1)%4,'rotate');g.fieldcraftUI?.showBuilding(b,quote);return quote;}
 function usablePost(b){
  return Boolean(world===g.world&&live(g.player)&&!g.frontier?.active()&&!g.expeditions.driving()&&b&&world.buildings.get(b.id)===b&&b.completed&&live(b)&&b.def.range&&b.def.fireRate&&!b.siegeOffline&&!b.territoryOffline&&!b.gridOffline&&!b.dayOffline&&(!b.def.powerUse||b.powered)&&workAt(g.player,b,rules.range));
 }
 function releasePost(){mounted=null;g.releaseInputs();}
 function control(b=nearby()){
  if(mounted){mounted=null;return true;}
  if(!allowed()||!usablePost(b)||g.player.reload>0)return false;
  mounted=b.id;cancel();g.cancelPlacement();g.input.mouseDown=false;
  g.notify('Poste de tir manuel : viser, tirer. I ou déplacement pour quitter.');return true;
 }
 wrap('updateBuildings',(old,dt)=>{
  const b=world?world.buildings.get(mounted):null,cd=b?b.fireCooldown:0;
  if(b)b.fireCooldown=1e6;
  const result=old(dt);
  if(b)b.fireCooldown=Math.max(0,(cd||0)-dt);
  if(mounted&&(!live(b)||g.player.dead||distance(g.player,b)>rules.range))mounted=null;
  return result;
 });
 wrap('updatePlayer',(old,dt)=>{
  let b=world?world.buildings.get(mounted):null;
  // A lost operator, obstructed access or disabled weapon cannot retain remote control.
  // Release held fire before returning to on-foot/vehicle/death handling.
  if(mounted&&!usablePost(b)){releasePost();b=null;}
  if(b){
   if(['KeyW','KeyZ','KeyA','KeyQ','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k=>g.input.keys.has(k)))mounted=null;
   else{
    g.player.invulnerable=Math.max(0,g.player.invulnerable-dt);
    const angle=Math.atan2(g.input.mouseWorldY-b.y,g.input.mouseWorldX-b.x);g.player.facing=angle;
    if((g.input.mouseDown||g.input.touchFire)&&b.fireCooldown<=0&&(!b.def.powerUse||b.powered)&&!b.siegeOffline){
     const cost=b.def.ammoPerShot||1;
     if(g.resources.ammo>=cost){g.resources.ammo-=cost;b.fireCooldown=1/b.def.fireRate;g.fireFriendly(b.x,b.y,angle,b.def.damage*(g.hasResearch('ballistics')?1.12:1),b.def.range,'#ffe0a0');b.flash=.12;}
    }
    g.interactionText='POSTE DE TIR — I pour rendre le contrôle';return;
   }
  }
  return old(dt);
 });
 wrap('startReload',(old,...a)=>{
  if(!g.canIssueCommand()||g.player.dead||mounted||g.expeditions.driving())return false;
  if(g.player.reload>0){
   if(attempt)return false;
   attempt=true;feedbackUntil=g.elapsed+1.2;
   const p=1-g.player.reload/g.player.reloadTotal;
   if(p>=rules.reloadGoodStart&&p<=rules.reloadGoodEnd){outcome=p>=rules.reloadPerfectStart&&p<=rules.reloadPerfectEnd?'perfect':'good';g.player.reload=outcome==='perfect'?.04:.18;g.audio.ui();}
   else{outcome='failed';g.player.reload+=rules.penalty;g.player.reloadTotal+=rules.penalty;g.audio.hit();}
   return true;
  }
  const result=old(...a);if(g.player.reload>0){attempt=false;outcome='normal';}return result;
 });
 wrap('updateInteraction',(old,dt)=>{
  if(mounted||moving){action=null;g.interactionText=mounted?'Tir manuel : I pour quitter':'Déplacement : choisir une cellule puis confirmer';return;}
  if(!g.input.keys.has('KeyE')){action=null;return old(dt);}
  const beforeBag=C.bagTotal(g.player.carry),before=g.world.nodes.map(n=>n.amount);
  const buildingBefore=new Map([...g.world.buildings.values()].map(b=>[b.id,b.progress]));
  const result=old(dt);action=null;
  if(g.input.keys.has('KeyE')&&!g.paused&&!g.player.dead&&g.interactionText&&!/plein|interrompu|bloqué|proches|sécurisez|vide/i.test(g.interactionText)){
   const building=[...g.world.buildings.values()].find(b=>b.progress>(buildingBefore.get(b.id)??b.progress));
   const node=g.world.nodes.find((n,i)=>n.amount<before[i]-.000001);
   if(building)action={x:building.x,y:building.y,p:building.progress,label:'CONSTRUCTION'};
   else if(node)action={x:node.x,y:node.y,p:1-node.amount/node.maxAmount,label:'RÉCOLTE'};
   else{
    const e=g.expeditions.overview(),s=e.sites.find(s=>s.id===e.active?.id);
    if(s&&Math.hypot(s.x-g.player.x,s.y-g.player.y)<140&&(!s.reported||C.bagTotal(g.player.carry)>beforeBag))action={x:s.x,y:s.y,p:s.reported?C.bagTotal(g.player.carry)/g.player.carryCapacity:s.progress/s.seconds,label:s.reported?'FOUILLE':'RELEVÉ'};
   }
  }
  return result;
 });
 const targetOpacity=()=>g.nightwatch.isBlackout()?1:Math.max(0,Math.min(1,1-g.daylight()))*.72;
 wrap('update',(old,dt)=>{
  const result=old(dt);
  if(Number.isFinite(dt)&&dt>0){const target=targetOpacity();if(opacity===null)opacity=target;opacity+=Math.max(-dt/rules.transition,Math.min(dt/rules.transition,target-opacity));}
  return result;
 });
 function snapshot(){return{version:1,nodes:g.world.nodes.map(n=>[n.id,n.x,n.y]),opacity,attempt,outcome};}
 wrap('serialize',(old,...a)=>({...old(...a),fieldcraft:snapshot()}));
 wrap('restoreSave',(old,input)=>{
  const legacyLayout=input?.fieldcraft?.legacyLayout===true;
  function prepared(value){
    if(!value.fieldcraft || value.fieldcraft.nodes.length || !value.fieldcraft.legacyLayout)return value;
    const generated=new g.world.constructor(value.worldSeed);
    const points=new Map(generated.nodes.map(n=>[n.id,[n.id,n.x,n.y]]));
    return {...value,fieldcraft:{...value.fieldcraft,nodes:value.nodes.map(n=>points.get(n[0]))}};
   }
   const data=prepared(root.DeadwallSave.validate(prepared(input))),before=g.world,result=old(data);
  if(before!==g.world){setup(data.fieldcraft.nodes,Boolean(data.fieldcraft.nodes.length&&!legacyLayout&&!data.fieldcraft.legacyLayout));opacity=data.fieldcraft.opacity;attempt=data.fieldcraft.attempt;outcome=data.fieldcraft.outcome;cancel();mounted=null;action=null;}
  return result;
 });
 wrap('startNew',(old,...a)=>{
  const before=g.world,result=old(...a);if(g.world!==before){setup();opacity=targetOpacity();attempt=false;outcome='';mounted=null;action=null;cancel();g.save(false);}return result;
 });
 wrap('onEscape',(old,...a)=>{
  if(moving||quote){cancel();g.fieldcraftUI?.refresh();return;}
  if(mounted){mounted=null;return;}
  return old(...a);
 });
 wrap('handlePressed',(old,...a)=>{
  if(allowed()){
   if(g.input.pressed.has('KeyO'))rotate();
   if(g.input.pressed.has('KeyP'))beginMove();
   if(g.input.pressed.has('KeyI')){if(mounted)control();else{const b=nearby();if(b)g.fieldcraftUI?.showBuilding(b);}}
  }
  return old(...a);
 });
 function draw(c){
  if(action&&g.input.keys.has('KeyE')&&!g.paused&&!g.player.dead){
   const a=action;c.save();c.translate(a.x,a.y-28);c.lineWidth=5;c.strokeStyle='#122118';c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.stroke();c.strokeStyle='#edd28f';c.beginPath();c.arc(0,0,19,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.02,a.p));c.stroke();c.fillStyle='#fff1cf';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText(Math.round(a.p*100)+'%',0,4);c.fillStyle='#14231c';c.fillRect(-47,26,94,17);c.fillStyle='#f0ddb3';c.fillText(a.label,0,38);c.restore();
  }
  const b=world?world.buildings.get(moving):null;
  if(b){const x=Math.floor(g.input.mouseWorldX/32),y=Math.floor(g.input.mouseWorldY/32),q=proposal(b,x,y,b.rotation);c.save();c.fillStyle=q.ok?'rgba(155,205,141,.4)':'rgba(211,112,83,.4)';c.strokeStyle=q.ok?'#c8e0ae':'#d9a185';c.lineWidth=2;c.fillRect(x*32,y*32,b.w*32,b.h*32);c.strokeRect(x*32,y*32,b.w*32,b.h*32);c.restore();}
 }
 wrap('drawRally',(old,c,...a)=>{const result=old(c,...a);draw(c);return result;});
 const pick=e=>{
  if(!moving||!allowed()||e.button!==0||e.type==='pointerdown'&&e.pointerType==='mouse')return;
  e.preventDefault();e.stopImmediatePropagation();g.input.mouseDown=false;
  g.input.mouseX=e.clientX;g.input.mouseY=e.clientY;g.updateMouseWorld();
  const q=plan(Math.floor(g.input.mouseWorldX/32),Math.floor(g.input.mouseWorldY/32));
  g.fieldcraftUI?.showBuilding(world.buildings.get(moving),q);
 };
 if(typeof g.showCommand==='function')wrap('showCommand',(old,show,...a)=>{if(!show&&quote)cancel();return old(show,...a);});
 g.canvas.addEventListener('mousedown',pick,true);
 g.canvas.addEventListener('pointerdown',pick,true);
 g.fieldcraft=Object.freeze({setup,rect,reserveRect,distance,overlap,positionFree,workAt,service,props,nearby,proposal,commit,beginMove,plan,rotate,cancel,control,snapshot,steerZombie,context:()=>({moving,quote,mounted,action}),reload:()=>({attempt,outcome,feedback:g.elapsed<feedbackUntil,p:g.player.reloadTotal?1-g.player.reload/g.player.reloadTotal:0}),opacity:target=>opacity===null?target:opacity});
 setup();return g.fieldcraft;
}
const api={attach,rect,overlap,collides,distance};root.DeadwallFieldcraft=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
