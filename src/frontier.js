/* Regional travel. The historical defending city keeps updating while its commander is elsewhere. */
(function(root){'use strict';const C=root.DeadwallCore,G=root.DeadwallFrontierGeometry,W=root.DeadwallFrontierWorld,R=W.RULES,Survey=root.DeadwallFrontierSurvey||(typeof require==='function'?require('./frontier-survey.js'):null),T=C.FrontierTacticsRules,P=root.DeadwallAtlasProjection||(typeof require==='function'?require('./atlas-projection.js'):null);
function install(g){if(g.frontier)return g.frontier;let state=C.Frontier.initial(),home=g.world,region=null,pending=null,near=[],enemies=new Map(),bullets=[],action=null,message='',scale=26,oldCollapse=false,locked=null,focus=null,candidates=[],sound={kind:'Silence',radius:0,time:0},pulse=0,takenCount=0;
const wrap=(n,fn)=>{const f=g[n].bind(g);g[n]=(...a)=>fn(f,...a);};const can=()=>g.state==='playing'&&!g.gameOver&&!g.player.dead&&(!g.paused||g.activeOverlay===g.ui.commandModal);const car=()=>g.expeditions.car();
function ensure(){if(home!==g.world){const next=C.Frontier.normalize(pending||undefined);
// Geometry and its bounded read caches are independent of loot, actors and damage.
// Keep this same game's model across a compatible restore; destruction is read live.
if(!pending||region?.seed!==g.world.seed||region?.generation!==next.generation)region=null;
home=g.world;state=next;takenCount=Object.keys(state.taken).length;pending=null;near=[];enemies.clear();bullets=[];action=null;locked=null;focus=null;candidates=[];sound={kind:'Silence',radius:0,time:0};pulse=0;}const v=car();if(state.car&&(!v||v.id!==state.car.id))state.car=null;if(v)v.regionAway=!!state.car;g.player.regionAbsent=state.active;return state;}
// Frequent pose readers do not need geometry or a validated copy of the expedition history.
function position(){ensure();return{active:state.active,generation:state.generation,x:state.x,y:state.y,z:state.z,inside:state.inside,a:state.a,car:state.car?{...state.car}:null};}
const world=()=>{ensure();if(!region)region=W.create(g.world.seed,state.generation,{structureDestroyed:id=>!!g.worldEvolution?.structureDestroyed(id),resourceTaken:id=>state.taken[id]||0});return region;};
const tell=t=>{message=t;g.notify(t);return false;};
// Local driving reserves the full profile radius (see expeditions.carClear).
// Its centre must be able to reach the seam before the boundary rejects it.
const exitInset=base=>g.expeditions.driving()?Math.max(base,g.player.radius/.9+8):base;
const materialReady=()=>g.player.reload<=0&&!g.selectedBuild&&!g.fieldSupplies?.busy()&&!g.essentials?.busy()&&!g.expansions?.busy();
function syncUI(){document.body.classList.toggle('region-active',state.active&&g.state==='playing');g.frontierUI?.refresh(true);}
function enter(){if(g.fieldSupplies?.busy()||g.essentials?.busy())return false;ensure();if(!can()||state.active)return false;const p=g.player,inset=exitInset(56),side=p.x>C.WORLD_SIZE-inset?'east':p.x<inset?'west':p.y>C.WORLD_SIZE-inset?'south':p.y<inset?'north':null;if(!side)return tell('Rejoignez un bord de D-17.');if(state.generation<4&&(side==='east'||side==='west'?Math.abs(p.y-2048):Math.abs(p.x-2048))>66)return tell('La jonction routière est au milieu de ce côté de D-17.');
const driving=g.expeditions.driving(),v=car();if(state.car&&driving)return false;world();g.departure130?.beforeExit(side);if(g.fieldcraft?.context().mounted)g.fieldcraft.control();state.active=true;state.z=0;state.inside=null;state.anchor={x:p.x,y:p.y};Object.assign(state,P.exitPosition(p,side,g));
if(driving&&v){v.driving=false;state.car={id:v.id,x:state.x,y:state.y,a:v.angle,driving:true};v.regionAway=true;p.radius=13;}g.fieldcraft?.cancel();g.cancelPlacement();oldCollapse=g.buildCollapsed;g.setBuildCollapsed(true);g.releaseInputs();p.regionAbsent=true;near=world().nearPOI(state.x,state.y,130);message='Région : ressources finies, rues et intérieurs. D-17 continue de vivre.';syncUI();g.save(false);return true;}
function gate(){
  if(state.generation<4)return P.entryTarget(state,g);
  if(state.z!==0)return null;
  const r=C.AtlasRules,h=P.home(g);
  for(const side of ['east','west','north','south']){
    const ew=side==='east'||side==='west',cross=ew?state.y:state.x,normal=ew?state.x:state.y,max=side==='east'||side==='south',edge=ew?(max?h.maxX:h.minX):(max?h.maxY:h.minY);
    if(cross<(ew?h.minY:h.minX)||cross>(ew?h.maxY:h.maxX)||!(normal>(max?edge-4:edge-1)&&normal<(max?edge+1:edge+4)))continue;
    const lateral=Math.max(r.entryInset,Math.min(r.localUnits-r.entryInset,(cross-(ew?h.minY:h.minX))*r.unitsPerMetre));
    return {side,x:ew?(max?r.localUnits-r.entryInset:r.entryInset):lateral,y:ew?lateral:(max?r.localUnits-r.entryInset:r.entryInset)};
  }
  return null;
}
function leave(){if(g.fieldSupplies?.busy()||g.essentials?.busy())return false;ensure();if(!state.active||!can())return false;const target=gate();if(!target)return tell('Rejoignez le bord de D-17.');const p=g.player,v=car(),driving=state.car?.driving,probe={radius:driving?Math.max(13,Number((Math.max((g.worldEvolution?.vehicleProfile()||{w:4.6,h:1.85}).w,(g.worldEvolution?.vehicleProfile()||{w:4.6,h:1.85}).h)*(22/4.6)).toFixed(6))):13};let arrival=target;
if(!g.friendlyPositionClear(probe,arrival.x,arrival.y)&&state.generation>=4){const ew=target.side==='east'||target.side==='west';for(let d=24;d<=480&&arrival===target;d+=24)for(const sign of [-1,1]){const lateral=Math.max(probe.radius+8,Math.min(C.WORLD_SIZE-probe.radius-8,(ew?target.y:target.x)+d*sign)),candidate={...target,[ew?'y':'x']:lateral};if(g.friendlyPositionClear(probe,candidate.x,candidate.y)){arrival=candidate;break;}}}
if(!g.friendlyPositionClear(probe,arrival.x,arrival.y))return tell('Le passage dans D-17 est obstrué. Dégagez cet accès ou utilisez une autre route.');
p.x=arrival.x;p.y=arrival.y;p.regionAbsent=false;p.radius=probe.radius;if(driving&&v){v.x=p.x;v.y=p.y;v.angle=state.car.a;v.driving=true;v.regionAway=false;state.car=null;}syncTracks();state.active=false;state.anchor=null;state.z=0;state.inside=null;near=[];enemies.clear();bullets=[];g.releaseInputs();g.camera.x=p.x;g.camera.y=p.y;g.setBuildCollapsed(oldCollapse);syncUI();g.save(false);return true;}
function vehiclePresent(){return state.z===0&&state.car&&car()?.health>0&&Math.hypot(state.x-state.car.x,state.y-state.car.y)<4.4&&world().line(state,state.car,0,state.inside,null,.05);}
function disembark(){
 const vp=g.worldEvolution?.vehicleProfile()||{w:4.6,h:1.85},clearance=Math.max(1.55,vp.h/2+R.footRadius+.01);
 for(let i=0;i<20;i++){
  const a=state.car.a+Math.PI/2+(i%2)*Math.PI,r=clearance+Math.floor(i/2)*.25,x=state.car.x+Math.cos(a)*r,y=state.car.y+Math.sin(a)*r;
  if(!world().blocked(x,y,R.footRadius)&&!g.worldEvolution?.districtBlocked(x,y,R.footRadius)&&world().line(state.car,{x,y},0,null,null,R.footRadius)){
   state.car.driving=false;state.x=x;state.y=y;return true;
  }
 }
 return false;
}
function board(){if(g.fieldSupplies?.busy()||g.essentials?.busy())return false;ensure();if(!can()||!state.active||state.z!==0||!vehiclePresent())return false;if(state.car.driving){if(!disembark())return tell('Portières obstruées. Déplacez le véhicule.');g.save(false);return true;}if(!materialReady())return tell('Terminez le rechargement ou l’intervention avant de prendre le volant.');state.car.driving=true;state.x=state.car.x;state.y=state.car.y;state.a=state.car.a;g.save(false);return true;}
function transfer(){if(!materialReady())return false;ensure();if(!can()||!state.active||state.car?.driving||!vehiclePresent())return false;const v=car(),vp=g.worldEvolution?.vehicleProfile()||{cargo:80};let room=vp.cargo-C.bagTotal(v.cargo),n=0;for(const k of C.RESOURCE_KEYS){const amount=Math.max(0,Math.min(room,g.player.carry[k]));g.player.carry[k]-=amount;v.cargo[k]+=amount;room-=amount;n+=amount;}if(n)g.save(false);message=n?n.toFixed(1)+' ressources chargées au coffre.':'Sac vide ou coffre plein.';return n>0;}
function refuel(){if(!materialReady())return false;ensure();if(!can()||!state.active||state.car?.driving||!vehiclePresent())return false;const v=car(),vp=g.worldEvolution?.vehicleProfile()||{tank:24};if(vp.tank<=0)return false;let missing=vp.tank-v.fuel,n=Math.min(missing,g.player.carry.fuel);v.fuel+=n;g.player.carry.fuel-=n;missing-=n;const extra=Math.min(missing,v.cargo.fuel);v.fuel+=extra;v.cargo.fuel-=extra;if(n+extra)g.save(false);message=n+extra?'Réservoir rempli avec le carburant transporté.':'Aucun carburant porté ou réservoir plein.';return n+extra>0;}
function stairsStatus(delta){
 ensure();
 if(!can()||!state.active||![-1,1].includes(delta))return {ok:false,code:'unavailable',reason:'Les escaliers se rejoignent pendant une sortie régionale.'};
 if(g.fieldSupplies?.busy()||g.essentials?.busy())return {ok:false,code:'busy',reason:'Terminez l’intervention avant de changer de niveau.'};
 if(state.car?.driving)return {ok:false,code:'driving',reason:'Descendez du véhicule avant de rejoindre l’escalier.'};
 const w=world(),p=w.pois.find(p=>p.id===state.inside);
 if(!p||g.worldEvolution?.structureDestroyed(p.id))return {ok:false,code:'no-stairs',reason:'Rejoignez un bâtiment encore accessible avec un escalier.'};
 const q=G.local(p,state.x,state.y),pad=w.plan(p,state.z).stairs[0],level=state.z+delta;
 if(!pad||!p.levels.includes(level))return {ok:false,code:'no-level',reason:'Aucun niveau accessible dans cette direction.'};
 const approach=G.global(p,pad.x+pad.w/2,pad.y+pad.h/2);
 const distance=Math.hypot(q.x-pad.x-pad.w/2,q.y-pad.y-pad.h/2),target={approach,distance,level};
 if(distance>1.8)return {ok:false,code:'approach-required',reason:'Rejoignez l’escalier pour changer de niveau.',...target};
 if(!w.line(state,approach,state.z,p.id,null,R.footRadius))return {ok:false,code:'access-blocked',reason:'Rejoignez l’escalier par un accès dégagé.',...target};
 // Floor layouts and player-built obstacles can differ at the same coordinates.
 // Refuse an obstructed landing before changing the persistent floor context.
 if(w.blocked(state.x,state.y,R.footRadius,level,p.id))return {ok:false,code:'landing-blocked',reason:'Le palier est obstrué à cet endroit. Rapprochez-vous du centre de l’escalier.',...target};
 return {ok:true,code:'ready',reason:'Escalier accessible.',...target};
}
function stairs(delta){
 const status=stairsStatus(delta);
 if(!status.ok)return status.code==='unavailable'?false:tell(status.reason);
 syncTracks();state.z=status.level;enemies.clear();bullets=[];action=null;focus=null;candidates=[];locked=null;
 g.save(false);return true;
}
function hitsBase(x,y){return state.generation<4&&P.homeBarrier(x,y,g);}
const vehicleClear=(x,y,a,vp)=>world().vehicleClear(x,y,a,vp.w,vp.h)&&!g.worldEvolution?.districtBlocked(x,y,0,{a,w:vp.w,h:vp.h});
function overlapsCar(x,y){const vp=g.worldEvolution?.vehicleProfile()||{w:4.6,h:1.85},q=G.local({...state.car,w:vp.w,h:vp.h},x,y);return G.circleRect(q.x,q.y,R.footRadius,{x:0,y:0,w:vp.w,h:vp.h});}
function move(dx,dy){
 const w=world(),n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.16)),driving=state.car?.driving;
 const clear=(x,y)=>{
  if(hitsBase(x,y)||!driving&&state.z===0&&g.worldEvolution?.districtBlocked(x,y,R.footRadius))return false;
  // An older save can retain the driver inside a destroyed vehicle. Let them
  // clear that overlap once; the wreck remains solid when approached outside.
  if(!driving&&state.z===0&&state.car&&(car()?.health>0||!overlapsCar(state.x,state.y))&&overlapsCar(x,y))return false;
  const vp=g.worldEvolution?.vehicleProfile()||{w:4.8,h:2.03};return driving?vehicleClear(x,y,state.a,vp):!w.blocked(x,y,R.footRadius,state.z,state.inside);
 };
 for(let i=0;i<n;i++){const x=state.x+dx/n,y=state.y+dy/n;if(clear(x,state.y))state.x=x;if(clear(state.x,y))state.y=y;}
 if(driving){state.car.x=state.x;state.car.y=state.y;state.car.a=state.a;}
}
function annotate(id,note){if(!can()||!state.seen.includes(id)||!['todo','visited','cleared','danger'].includes(note))return false;state.notes[id]=note;g.save(false);return true;}
function pin(id){if(!can()||id!==null&&!state.seen.includes(id))return false;state.pin=id;g.save(false);return true;}
function guidance(){ensure();const tour=g.fieldAtlas?.guidance();let result=tour;if(!result){if(!state.pin)return null;const target=world().pois.find(p=>p.id===state.pin);if(!target)return null;const origin=state.active?state:P.toRegion(g.player.x,g.player.y,g),Route=root.DeadwallFrontierRouting||(typeof require==='function'?require('./frontier-routing.js'):null),r=Route.route(world(),origin,target);if(!r)return null;const rate=g.worldEvolution?.vehicleProfile()?.fuel??R.fuelPerMetre;result={...r,name:target.name,id:target.id,fuel:g.travel131?.fuelCost(r.metres,rate,car()?.id??null)??r.metres*rate};}return{...result,status:state.active&&state.z!==0?'level-required':'guiding',level:state.active?state.z:0,...(state.active&&state.z!==0?{path:[]}:{}),target:result.target||result.path?.at(-1)||null};}
function sight(a,b,ignore=null){return world().line(a,b,state.z,state.inside,ignore,.015);}
// Place existing contacts in free cells. Ground-floor sentries begin by the facade;
// upstairs contacts keep their original floor and recorded IDs across old saves.
function spawnPoint(w,p,index,z,firstGround){
 const candidates=[];
 if(z===0&&index===firstGround){
  for(let row=0;row<4;row++)for(const t of [.5,.25,.75,.12,.88]){
   candidates.push(G.global(p,p.w*t,p.h+1.2+row*1.1));
   candidates.push(G.global(p,p.w*t,-1.2-row*1.1));
  }
 }
 candidates.push(G.global(p,p.w/2,p.h/2+Math.min(index,2)*.9));
 for(let k=0;k<64;k++)candidates.push(G.global(p,.65+(p.w-1.3)*(G.hash(p.id,index,k,'x')%10001)/10000,.65+(p.h-1.3)*(G.hash(p.id,index,k,'y')%10001)/10000));
 return candidates.find(q=>!w.blocked(q.x,q.y,T.enemyRadius,z,z?p.id:null)&&!([...enemies.values()].some(e=>e.z===z&&Math.hypot(e.x-q.x,e.y-q.y)<T.enemyRadius*2)));
}
function spawn(){const w=world();near=w.nearPOI(state.x,state.y,130);for(const p of near){if(Math.hypot(p.x-state.x,p.y-state.y)>80+Math.hypot(p.w,p.h)/2)continue;if(Math.hypot(p.x-state.x,p.y-state.y)<R.discover&&!state.seen.includes(p.id)){state.seen.push(p.id);message='Découverte : '+p.name;}
 const count=w.threatCount(p),levels=Array.from({length:count},(_,i)=>p.levels[G.hash(p.id,i)%p.levels.length]),firstGround=levels.indexOf(0);
 for(let i=0;i<count&&enemies.size<R.maxEnemy;i++){
  const id=p.id+':e'+i,z=levels[i];if(state.enemies[id]===0||enemies.has(id)||z!==state.z||z!==0&&p.id!==state.inside)continue;
  const saved=state.tracks[id],validSaved=saved&&!w.blocked(saved.x,saved.y,T.enemyRadius,z,z?p.id:null)?saved:null;
  const pos=validSaved||spawnPoint(w,p,i,z,firstGround);if(!pos)continue;
  const profile=state.generation>=6?root.DeadwallBiomes135?.enemyProfile(w.seed,p.x,p.y,id,{generation:state.generation}):null;
  enemies.set(id,{...(profile?{kind:profile.kind,maxHealth:profile.health,biomeProfile:profile}:{}),id,poi:p.id,z,x:pos.x,y:pos.y,a:validSaved?.a??G.hash(id,'facing')/4294967296*Math.PI*2,hp:state.enemies[id]??profile?.health??65,cool:0,mode:'idle',ttl:0,gx:pos.x,gy:pos.y,...(validSaved||{}),path:null,repath:0});
 }
}
for(const[id,e]of enemies)if(e.z!==state.z||Math.hypot(e.x-state.x,e.y-state.y)>180){if(e.hp<65)state.enemies[id]=e.hp;state.tracks[id]=Survey.record(e);enemies.delete(id);}}
function hurt(amount){if(g.player.invulnerable>0)return;const v=car();if(state.car?.driving&&v){g.expeditions.damage(amount);if(v.health<=0){disembark();state.car.driving=false;message='Véhicule détruit : carburant et coffre perdus.';}return;}
amount=g.playerOps131?.absorbDamage(amount)??amount;g.player.health=Math.max(0,g.player.health-amount);g.player.invulnerable=.4;g.damageFlash=.3;if(g.player.health===0){const point={domain:'region',x:state.x,y:state.y,z:state.z,inside:state.inside,angle:state.a||0};g.succession133?.captureDeathPoint?.(point);g.nightGear?.dropOnDeath?.(point);g.essentials?.dropOnDeath?.(point);state.active=false;state.z=0;state.inside=null;state.anchor=null;if(state.car)state.car.driving=false;g.player.regionAbsent=false;g.player.dead=true;g.player.downTimer=8;enemies.clear();bullets=[];g.releaseInputs();syncUI();if(g.succession133)g.succession133.captureDeath();else g.notify('Commandant à terre : retour sanitaire vers D-17.','danger');}}
function shoot(){if(!g.arsenal134&&g.succession133&&!g.succession133.ownsWeapon(g.player.weapon))return false;if(g.fieldSupplies?.busy()||g.essentials?.busy())return false;if(!can()||!state.active||state.car?.driving||g.player.reload>0||g.player.shootCooldown>0)return false;if(g.arsenal134&&!g.arsenal134.beforeShot())return false;const p=g.player,w=g.arsenal134?.weaponSpec()||C.WEAPONS[p.weapon];if(p.magazine[p.weapon]<=0){g.startReload();return false;}p.magazine[p.weapon]--;g.arsenal134?.afterShot();p.shootCooldown=1/w.fireRate;g.stats.shots++;emitNoise(T.shotNoise[p.weapon]||42,'Tir');g.audio.shot(p.weapon);for(let i=0;i<w.pellets;i++){const spread=(G.hash(world().seed,state.shots++,i)/4294967296-.5)*2*w.spread;bullets.push({x:state.x,y:state.y,dx:Math.cos(state.a+spread),dy:Math.sin(state.a+spread),left:w.range/32,damage:w.damage});}return true;}
// Damage live regional contacts through the same persistent health ledger as projectiles.
function hitEnemy(id,damage){
 ensure();const e=enemies.get(id);
 if(!e||!Number.isFinite(damage)||damage<=0||!can()||!state.active||e.z!==state.z||e.z!==0&&e.poi!==state.inside)return false;
 e.hp=Math.max(0,e.hp-damage);state.enemies[e.id]=e.hp;
 if(e.hp===0){enemies.delete(e.id);delete state.tracks[e.id];state.kills++;}
 return true;
}
function companionShot(origin,range,damage){
 if(!can()||!state.active||state.car?.driving||origin.z!==state.z)return false;
 const target=[...enemies.values(),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])].filter(e=>e.z===state.z&&(state.z===0||e.poi===state.inside)&&Math.hypot(e.x-origin.x,e.y-origin.y)<=range&&world().line(origin,e,state.z,state.inside,null,.015)).sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y))[0];
 if(!target)return false;
 if(target.fallen)g.succession133.hit(target.x,target.y,damage,target.z,target.poi,target.id);else if(target.group)g.worldEvolution.hitContact(target.x,target.y,damage,target.id);else{target.hp=Math.max(0,target.hp-damage);state.enemies[target.id]=target.hp;
 if(target.hp===0){enemies.delete(target.id);delete state.tracks[target.id];state.kills++;}}
 Survey.hear(world(),enemies.values(),origin,T.shotNoise.pistol||42,T);g.worldEvolution?.hear(origin,T.shotNoise.pistol||42);return true;
}
function syncTracks(){for(const e of enemies.values())if(e.hp>0)state.tracks[e.id]=Survey.record(e);for(const id of Object.keys(state.tracks))if(state.enemies[id]===0)delete state.tracks[id];}
function quiet(value){if(!can()||!state.active||state.car?.driving||typeof value!=='boolean')return false;state.quiet=value;g.worldEvolution?.setPosture(value?'crouch':'stand');g.save(false);return true;}
function selection(){candidates=Survey.targets(world(),state,state.taken,R.lootReach);if(locked&&!candidates.some(b=>b.id===locked))locked=null;focus=(locked?candidates.find(b=>b.id===locked):candidates.find(b=>b.left>.00001)||candidates[0])||null;return focus;}
function cycle(){if(!can()||!state.active||state.car?.driving)return false;selection();if(!candidates.length)return false;const at=candidates.findIndex(b=>b.id===focus?.id);locked=candidates[(at+1)%candidates.length].id;selection();return true;}
function emitNoise(radius,kind){if(!state.active||radius<=0)return;sound={kind,radius,time:T.pulse+0.2};Survey.hear(world(),enemies.values(),state,radius,T);g.worldEvolution?.hear(state,radius);}
function visibleEnemy(e){return e.z===state.z&&world().line(state,e,e.z,e.z?state.inside:null,null,.015);}
function enemyBlocked(e,x,y){if(world().blocked(x,y,T.enemyRadius,e.z,e.z?e.poi:null)||e.z===0&&g.worldEvolution?.districtBlocked(x,y,T.enemyRadius))return true;if(e.z===0&&state.car){const vp=g.worldEvolution?.vehicleProfile()||{w:4.6,h:1.85},q=G.local({...state.car,w:vp.w,h:vp.h},x,y);return G.circleRect(q.x,q.y,T.enemyRadius,{x:0,y:0,w:vp.w,h:vp.h});}return false;}
function enemyTurn(dt){const budget={left:T.pathBudget};for(const e of enemies.values()){
 Survey.step(world(),e,state,dt,e.biomeProfile?{...T,enemySpeed:e.biomeProfile.speed}:T,budget,(x,y)=>enemyBlocked(e,x,y));
 const vp=g.worldEvolution?.vehicleProfile()||{w:4.6,h:1.85},target=state.car?.driving?Survey.edge(e,{...state.car,w:vp.w,h:vp.h}):state,reach=state.car?.driving ? .8 : .9;
 if(Math.hypot(target.x-e.x,target.y-e.y)<reach&&e.cool===0&&world().line(e,target,e.z,e.z?e.poi:null,null,.015)){hurt(e.biomeProfile?.damage??8);e.cool=e.biomeProfile?.interval??1.15;}
}}
function fight(dt){enemyTurn(dt);
for(let i=bullets.length-1;i>=0;i--){const b=bullets[i],length=Math.min(b.left,30*dt),n=Math.max(1,Math.ceil(length/.18));let done=false;for(let k=0;k<n;k++){b.x+=b.dx*length/n;b.y+=b.dy*length/n;b.left-=length/n;if(world().blocked(b.x,b.y,.005,state.z,state.inside)){g.barricades134?.hitProjectile?.('region',b.x,b.y,b.damage,state.z,state.inside);done=true;break;}if(g.succession133?.hit(b.x,b.y,b.damage,state.z,state.inside)){done=true;break;}if(state.z===0&&g.worldEvolution?.hitContact(b.x,b.y,b.damage)){done=true;break;}const e=[...enemies.values()].find(e=>Math.hypot(e.x-b.x,e.y-b.y)<.4);if(e){e.hp=Math.max(0,e.hp-b.damage);state.enemies[e.id]=e.hp;if(e.hp===0){enemies.delete(e.id);delete state.tracks[e.id];state.kills++;}done=true;break;}}if(done||b.left<=0)bullets.splice(i,1);}}
function harvest(dt){action=null;if(g.fieldSupplies?.busy()||g.essentials?.busy()){g.interactionText='Opération de terrain en cours. Bouger ou tirer pour interrompre.';return;}if(state.car?.driving){focus=null;candidates=[];return;}const b=selection();if(!b){g.interactionText='RÉGION · E fouiller · C marche prudente · T changer de cible';return;}if(g.fieldSupplies?.hasCache(b.id)){g.interactionText='Relais aménagé · ouvrez SAC & RELAIS pour déposer ou reprendre.';return;}g.interactionText=b.label+' · '+C.RESOURCE_META[b.resource].label+' · '+b.left.toFixed(1)+' restant'+(candidates.length>1?' · T cible suivante':'');if(g.interventions134?.blocksLoot(b)){g.interactionText=g.interventions134.lootReason?.(b)||'Contenant verrouillé · INTERVENTIONS pour crocheter sur place.';return;}if(b.sealed131&&!g.worldOps131?.opened(b.poi)){g.interactionText='Réserve scellée · ouvrez MONDE & RELAIS pour la déverrouiller.';return;}if(b.left<=.00001){g.interactionText=b.label+' · VIDE';return;}const known=Object.hasOwn(state.taken,b.id);if(!known&&takenCount>=C.Frontier.MAX_TAKEN){g.interactionText='Limite du carnet de campagne atteinte : poursuivez les récoltes déjà commencées.';return;}if(g.player.reload>0){g.interactionText='Rechargement en cours.';return;}if(!g.input.keys.has('KeyE'))return;
if([...enemies.values()].some(e=>Math.hypot(e.x-state.x,e.y-state.y)<5.5&&sight(e,state))){g.interactionText='Écartez les infectés avant de fouiller.';return;}
const capacity=g.player.carryCapacity-C.bagTotal(g.player.carry),n=Math.max(0,Math.min(capacity,b.left,R.lootRate*dt*g.difficulty.resourceYield*(g.interventions134?.harvestFactor(b)||1)*(g.arsenal134?.toolFactor(b.resource)||1)));if(!n){g.interactionText='Sac plein : transférez au coffre ou rentrez.';return;}g.player.carry[b.resource]+=n;g.arsenal134?.wearTool(b.resource,dt);if(!known)takenCount++;state.taken[b.id]=(state.taken[b.id]||0)+n;g.stats.gathered+=n;focus.left=Math.max(0,b.amount-state.taken[b.id]);action={x:b.x,y:b.y,p:state.taken[b.id]/b.amount,name:b.label};if(pulse<=0||sound.radius<T.workNoise){emitNoise(T.workNoise,'Fouille');pulse=T.pulse;}}
function updatePlayer(dt){pulse=Math.max(0,pulse-dt);sound.time=Math.max(0,sound.time-dt);if(!sound.time)sound={kind:'Silence',radius:0,time:0};const p=g.player,k=g.input.keys;p.meleeCooldown=Math.max(0,p.meleeCooldown-dt);p.invulnerable=Math.max(0,p.invulnerable-dt);p.shootCooldown=Math.max(0,p.shootCooldown-dt);if(p.reload>0){p.reload=Math.max(0,p.reload-dt);if(p.reload===0)g.finishReload();}
const dx=+(k.has('KeyD')||k.has('ArrowRight'))-+(k.has('KeyA')||k.has('KeyQ')||k.has('ArrowLeft')),dy=+(k.has('KeyS')||k.has('ArrowDown'))-+(k.has('KeyW')||k.has('KeyZ')||k.has('ArrowUp')),n=Math.hypot(dx,dy);state.a=state.car?.driving?state.car.a:Math.atan2((g.input.mouseY??g.height/2)-g.height/2,(g.input.mouseX??g.width/2+1)-g.width/2);const pose=g.worldEvolution?.posture()||{key:state.quiet?'crouch':'stand',speed:state.quiet?T.quietSpeed/R.walk:1,noise:state.quiet?.35:1},ground=g.worldEvolution?.surface({...state,world:world()})||{speed:1,noise:1};let speed=(pose.key==='crouch'?T.quietSpeed:R.walk*pose.speed)*(state.generation>=4?ground.speed:1);if(!g.essentials?.carrying()&&!g.campaignPack?.carrying()&&pose.key==='stand'&&!state.car?.driving&&n&&k.has('ShiftLeft')&&p.stamina>0){speed=R.run*ground.speed;p.stamina=Math.max(0,p.stamina-12*dt);}else p.stamina=Math.min(p.maxStamina,p.stamina+7*dt);
if(state.car?.driving){const v=car(),road=world().nearestRoad(state),vp=g.worldEvolution?.vehicleProfile()||{speed:R.roadSpeed,fuel:R.fuelPerMetre,w:4.8,h:2.03};speed=Math.min(road.d<road.road.width/2+1.5?vp.speed:Math.min(vp.speed*.55,R.offroadSpeed),vp.fuel>0?(g.travel131?.fuelDistance(v?.fuel||0,vp.fuel,v?.id)??((v?.fuel||0)/vp.fuel))/dt:vp.speed);if(n&&speed>0){const nextAngle=Math.atan2(dy,dx);if(vehicleClear(state.x,state.y,nextAngle,vp))state.a=nextAngle;else speed=0;}}
if(g.essentials?.carrying()&&!state.car?.driving)speed*=C.Essentials.RULES.packSpeed;
if(!state.car?.driving){speed*=g.campaignPack?.movementFactor?.()??1;speed*=g.succession133?.movementFactor?.()??1;}
if(n&&speed>0){const before={x:state.x,y:state.y};move(dx/n*speed*dt,dy/n*speed*dt);const d=Math.hypot(state.x-before.x,state.y-before.y);state.distance+=d;if(state.car?.driving){const vp=g.worldEvolution?.vehicleProfile()||{fuel:R.fuelPerMetre};const vehicle=car(),used=g.travel131?.fuelCost(d,vp.fuel,vehicle.id)??d*vp.fuel;vehicle.fuel=Math.max(0,vehicle.fuel-used);g.travel131?.consumeDistance(d,vehicle.id);}if(d>.001&&pulse<=0){const driving=state.car?.driving,running=pose.key==='stand'&&k.has('ShiftLeft')&&p.stamina>0,base=driving?T.carNoise:pose.key!=='stand'?T.quietNoise:running?T.runNoise:T.walkNoise;emitNoise(base*(driving?1:pose.noise*(state.generation>=4?ground.noise:1)),driving?'Moteur':pose.key==='prone'?'Rampe':pose.key==='crouch'?'Pas prudents':running?'Course':'Marche');pulse=T.pulse;}}
if(state.z===0)state.inside=near.find(p=>{const q=G.local(p,state.x,state.y);return q.x>0&&q.y>0&&q.x<p.w&&q.y<p.h;})?.id||null;
p.facing=state.a;if(g.input.mouseDown||g.input.touchFire)shoot();harvest(dt);fight(dt);if(state.active&&gate())leave();}
function revealSites(ids){ensure();const known=new Set(world().pois.map(p=>p.id));for(const id of ids)if(known.has(id)&&!state.seen.includes(id))state.seen.push(id);}
function overview(){ensure();syncTracks();const w=world();return{...C.Frontier.normalize(state),world:w,near,enemies:[...enemies.values()],bullets,action,message,scale,focus,choices:candidates.length,sound:{kind:sound.kind,radius:sound.radius},poi:w.pois.find(p=>p.id===state.inside)||null};}
function cyclePosture(){if(g.worldEvolution?.cyclePosture()){state.quiet=g.worldEvolution.posture().key!=='stand';g.save(false);return true;}return quiet(!state.quiet);}
function input(){const p=g.input.pressed;if(p.has('Space')&&!g.arsenal134?.melee())g.succession133?.regionalMelee?.();if(p.has('KeyC'))cyclePosture();if(p.has('KeyT'))cycle();if(p.has('KeyF'))board();if(p.has('KeyG'))transfer();if(p.has('KeyV'))refuel();if(p.has('PageUp'))stairs(1);if(p.has('PageDown'))stairs(-1);if(p.has('KeyR')&&!state.car?.driving)g.startReload();if(p.has('Digit1'))g.switchWeapon('pistol');if(p.has('Digit2'))g.switchWeapon('rifle');if(p.has('Digit3'))g.switchWeapon('shotgun');}
g.frontier=Object.freeze({active:()=>state.active,position,contacts:()=>[...enemies.values()],enemyHealth:id=>state.enemies[id],takenAmount:id=>(state.taken[id]||0),discoveries:()=>state.seen.slice(),revealSites,enter,leave,board,transfer,refuel,stairs,stairsStatus,shoot,world,overview,annotate,pin,guidance,quiet,cyclePosture,cycle,visibleEnemy,vehiclePresent,damage:hurt,companionShot,hitEnemy,signalAt:(point,radius)=>{if(state.active&&point.z===state.z)Survey.hear(world(),enemies.values(),point,radius,T);},signalWork:()=>emitNoise(T.workNoise,'Travaux de terrain'),snapshot:()=>{ensure();syncTracks();return C.Frontier.normalize(state);},scale:v=>{if(Number.isFinite(v))scale=Math.max(12,Math.min(44,v));return scale;}});
wrap('handlePressed',(old,...a)=>{ensure();if(state.active){input();return;}return old(...a);});wrap('updatePlayer',(old,dt)=>{ensure();if(state.active){updatePlayer(Math.min(.1,dt));return;}return old(dt);});
wrap('damagePlayer',(old,...a)=>state.active?undefined:old(...a));wrap('workerCanWorkAt',(old,u,...a)=>state.active&&u===g.player?false:old(u,...a));wrap('placeOne',(old,...a)=>state.active?false:old(...a));
wrap('serialize',(old,...a)=>{ensure();syncTracks();return{...old(...a),frontier:C.Frontier.normalize(state)};});wrap('restoreSave',(old,raw)=>{const legacyLayout=raw?.fieldcraft?.legacyLayout===true;if(raw?.fieldcraft?.legacyLayout&&!raw.fieldcraft.nodes.length){const generated=new g.world.constructor(raw.worldSeed),points=new Map(generated.nodes.map(n=>[n.id,[n.id,n.x,n.y]]));raw={...raw,fieldcraft:{...raw.fieldcraft,nodes:raw.nodes.map(n=>points.get(n[0]))}};}const d=root.DeadwallSave.validate(raw);if(legacyLayout)d.fieldcraft={...d.fieldcraft,legacyLayout:true};pending=d.frontier;try{return old(d);}finally{ensure();pending=null;syncUI();}});wrap('startNew',(old,...a)=>{const previousWorld=g.world,r=old(...a);if(g.world!==previousWorld){pending=null;ensure();state=C.Frontier.initial();takenCount=0;g.player.regionAbsent=false;syncUI();}return r;});
wrap('returnToMenu',(old,...a)=>{const r=old(...a);syncUI();return r;});
wrap('update',(old,dt)=>{ensure();g.departure130?.approach();if(state.active&&g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay){world().prefetch(state.x+Math.cos(state.a)*(state.car?.driving?45:3),state.y+Math.sin(state.a)*(state.car?.driving?45:3),1);spawn();}const r=old(dt);if(!state.active&&can()&&!g.paused&&!g.activeOverlay){const p=g.player,k=g.input.keys,inset=exitInset(41),out=p.x>C.WORLD_SIZE-inset&&(k.has('KeyD')||k.has('ArrowRight'))||p.x<inset&&(k.has('KeyA')||k.has('KeyQ')||k.has('ArrowLeft'))||p.y>C.WORLD_SIZE-inset&&(k.has('KeyS')||k.has('ArrowDown'))||p.y<inset&&(k.has('KeyW')||k.has('KeyZ')||k.has('ArrowUp'));if(out&&(state.generation>=4||Math.min(Math.abs(p.x-2048),Math.abs(p.y-2048))<66))enter();}return r;});
wrap('render',(old,...a)=>{if(state.active&&g.state==='playing'&&root.DeadwallFrontierArt){root.DeadwallFrontierArt.render(g,overview());g.frontierUI?.refresh();return;}return old(...a);});wrap('renderMinimap',(old,...a)=>state.active&&root.DeadwallFrontierArt?root.DeadwallFrontierArt.minimap(g,overview()):old(...a));
return g.frontier;}
const api={install};root.DeadwallFrontier=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
