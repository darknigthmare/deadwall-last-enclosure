/** Declared presentation fixtures. No production method, RNG, damage, radius,
 * action event, elapsed clock or animation phase is replaced or manufactured. */
export function spriteCampFixture159() {
 const g=globalThis.DEADWALL,C=globalThis.DeadwallCore;
 if(g.state!=='playing'||!g.paused||g.frontier.active())throw Error('A deliberately paused, living local campaign is required');
 const rng=g.random.state,Building=g.core().constructor,added=[],mounts={};
 function place(type,progress=1){
  const core=g.core();
  for(let ring=6;ring<42;ring+=2)for(let dy=-ring;dy<=ring;dy+=2)for(let dx=-ring;dx<=ring;dx+=2){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
   const gx=core.gx+dx,gy=core.gy+dy;
   if(!g.world.placement(C.BUILDINGS[type],gx,gy,0).valid)continue;
   const b=new Building(g.nextId,type,gx,gy,0,progress);g.world.add(b);
   const point=g.fieldcraft.service(g.player,b);
   if(!point||!g.friendlyPositionClear(g.player,point.x,point.y)){g.world.remove(b);continue;}
   g.nextId++;added.push({id:b.id,type,gx,gy,progress});return b;
  }
  throw Error('No real free fixture placement for '+type);
 }
 for(const type of ['warehouse','generator','workshop'])place(type);
 for(const kind of Object.keys(C.FortificationPackRules.mechanisms))mounts[kind]=place('spikes').id;
 const raw=g.serialize();raw.urban.peakScore=Math.max(raw.urban.peakScore,C.CITY_TIERS[9].requiredScore);delete raw.urban.progression151;
 raw.units=[];raw.phase='calm';raw.phaseTime=1000;raw.resources=Object.fromEntries(C.RESOURCE_KEYS.map(k=>[k,300]));
 g.restoreSave(DeadwallSave.validate(raw));g.togglePause(true);g.flow.rebuild(g.world,g.core());
 if(g.random.state!==rng||g.tier.id<9)throw Error('Prepared inherited knowledge or source RNG changed unexpectedly');
 const state=globalThis.__SPRITES159__={mounts,added,syntheticEnemies:new Set(),steps:0,pictures:[],events:[]};
 state.material=()=>{const {timestamp,...save}=g.serialize();return JSON.stringify(save);};
 state.running=fn=>{if(!g.paused)throw Error('Bounded fixture requires deliberate Pause');g.togglePause(false);try{return fn();}finally{g.togglePause(true);}};
 state.advance=seconds=>state.running(()=>{for(let left=seconds;left>1e-8;left-=.04){g.update(Math.min(.04,left));state.steps++;if(g.gameOver)throw Error('Prepared fixture lost its real commander');}});
 state.service=b=>{const point=g.fieldcraft.service(g.player,b);if(!point||!g.friendlyPositionClear(g.player,point.x,point.y))throw Error('Free physical service point required');Object.assign(g.player,point);return point;};
 state.retire=()=>{const ids=[...state.syntheticEnemies];g.zombies=g.zombies.filter(z=>!state.syntheticEnemies.has(z.id));state.syntheticEnemies.clear();g.rebuildBuckets();g.fortificationPack.snapshot();return ids;};
 state.spawn=(b,near=false,kind='walker')=>{
  if(!g.spawnZombie(kind))throw Error('Native finite spawn refused');const z=g.zombies.at(-1);state.syntheticEnemies.add(z.id);
  let point;const distances=near?[z.radius+.5]:[z.radius+C.FortificationPackRules.mechanismContactReach-1];
  for(const distance of distances)for(const [x,y]of [[b.right+distance,b.y],[b.left-distance,b.y],[b.x,b.bottom+distance],[b.x,b.top-distance]]){
   const p={x,y},edge={x:Math.max(b.left,Math.min(b.right,x)),y:Math.max(b.top,Math.min(b.bottom,y))};
   if(!g.hostilePositionClear(z,x,y)||!g.hostileLineClear(p,edge,false,b))continue;
   if(near){const dir=g.flow.direction(x,y,z.bias,g.elapsed);if(g.world.at(x+dir.x*(z.radius+13),y+dir.y*(z.radius+13))!==b)continue;}
   const props=[...g.fieldcraft.props((x+edge.x)/2,(y+edge.y)/2,Math.hypot(x-edge.x,y-edge.y)/2+2)];
   if(props.some(prop=>{if(prop.depleted)return false;const r=g.fieldcraft.rect(prop);return x>=r.l-z.radius&&x<=r.r+z.radius&&y>=r.t-z.radius&&y<=r.b+z.radius;}))continue;
   point=p;break;
  }
  if(!point)throw Error('No native physically clear contact approach');Object.assign(z,point);g.rebuildBuckets();
  let observer;
  for(const d of [90,110,130])for(const [dx,dy]of [[d,0],[-d,0],[0,d],[0,-d]]){
   const p={x:z.x+dx,y:z.y+dy};if(!observer&&g.friendlyPositionClear(g.player,p.x,p.y)&&g.hostileLineClear(p,z,false))observer=p;
  }
  if(!observer)throw Error('Native contact needs a physical observer away from contact');Object.assign(g.player,observer);g.camera.x=b.x;g.camera.y=b.y;
  return z;
 };
 state.capture=(name,owner,kind='building')=>{
  const before=state.material(),rng=g.random.state,canvas=document.createElement('canvas');canvas.width=300;canvas.height=190;
  const actions=globalThis.DeadwallActorActions159,ownedPose=kind==='unit'||kind==='zombie'?actions?.pose(owner,{kind:owner.kind,time:g.elapsed,presentation:g.actorActionPresentation159(owner),reducedMotion:g.settings.reducedMotion,seed:g.world.seed,appearance:actions.appearanceFor(owner.kind,owner.id,{seed:g.world.seed,images:g.art.images})}):null;
  const ctx=canvas.getContext('2d'),calls=[],blit=g.art.blit;
  ctx.fillStyle='#19251f';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(150-owner.x*2,100-owner.y*2);ctx.scale(2,2);
  g.art.blit=function(c,atlas,rect,...destination){calls.push({atlas,rect:[...rect],destination,transform:[c.getTransform().a,c.getTransform().b,c.getTransform().c,c.getTransform().d,c.getTransform().e,c.getTransform().f]});return blit.call(this,c,atlas,rect,...destination);};
  try{if(kind==='building')g.drawBuilding(ctx,owner);else if(kind==='player')g.drawPlayer(ctx);else if(kind==='zombie'){if(!g.visibility.canSeeLocal(owner))throw Error('Enemy gallery owner must actually be physically visible');g.drawZombie(ctx,owner);}else g.drawUnit(ctx,owner);}finally{g.art.blit=blit;ctx.restore();}
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let hash=2166136261;for(const p of pixels)hash=Math.imul(hash^p,16777619);const data=canvas.toDataURL('image/png');
  ctx.fillStyle='#f1deb4';ctx.font='14px sans-serif';ctx.fillText(name,9,19);
  state.pictures.push({name,data:canvas.toDataURL('image/png')});
  return{name,owner:owner.id,hash:(hash>>>0).toString(16),ownedPose,calls,usesOwnedActionSheet:!!ownedPose&&calls.some(c=>c.atlas===ownedPose.atlas&&JSON.stringify(c.rect)===JSON.stringify(ownedPose.rect)),materialUnchanged:state.material()===before,rngUnchanged:g.random.state===rng,rawData:data};
 };
 return{type:'prepared-inherited-age9-art-camp',added,mounts,achievedTier:g.tier.id,generation:g.frontier.position().generation,rngPreserved:true,
  assignedFields:['9 completed legally placed structures','nextId','urban.peakScore=1200 historical knowledge','urban.progression151 omitted for supported legacy import','units=[] declared starting-unit isolation','phase=calm','phaseTime=1000','finite depot resources=300 each'],
  note:'This is inherited knowledge and completed infrastructure for an isolated art scene, not organically earned campaign progress. Terrain, nodes, enemy rules, renderers, radius, damage, save identity and RNG remain native.'};
}

export function spriteMechanismFixture159(kind) {
 const g=DEADWALL,C=DeadwallCore,s=__SPRITES159__,recipe=C.FortificationPackRules.mechanisms[kind],b=g.world.buildings.get(s.mounts[kind]);
 if(!g.paused||!recipe||!b)throw Error('Prepared physical mechanism owner required');
 const retired=s.retire(),point=s.service(b);g.player.carry={...C.makeBag(),...recipe.cost};
 const carryBefore={...g.player.carry},resourcesBefore={...g.resources};
 const quote=s.running(()=>g.fortificationPack.startMechanism(kind,b.id));if(!quote.ok)throw Error(quote.reason);
 s.advance(recipe.seconds+.08);const fitting=g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);
 if(g.fortificationPack.busy()||fitting?.mechanism?.kind!==kind)throw Error('Actual timed paid mount did not complete');
 const carryAfter={...g.player.carry},armed=g.fortificationPack.presentation(b).mechanism,first=s.capture(kind+' • armé',b);
 const z=s.spawn(b),hp=z.health,charges=fitting.mechanism.charges;s.advance(.04);
 const trigger=g.fortificationPack.presentation(b).mechanism,healthAfter=z.health;
 // Keep the actual synthetic contact alive but physically outside the paid
 // mount's reach, so one measured cycle cannot spend another finite charge.
 let departure;for(const [dx,dy]of [[400,0],[-400,0],[0,400],[0,-400]]){const p={x:b.x+dx,y:b.y+dy};if(!departure&&g.hostilePositionClear(z,p.x,p.y))departure=p;}
 if(!departure)throw Error('No real free departure for the already measured contact');Object.assign(z,departure);g.rebuildBuckets();
 s.advance(recipe.cooldown*.3);const action=g.fortificationPack.presentation(b).mechanism,second=s.capture(kind+' • action',b),paused=s.capture(kind+' • pause répétée',b);
 const motionCalls=c=>c.calls.filter(x=>/^trap159Mechanisms/.test(x.atlas));
 return{kind,support:b.id,recipe:{cost:recipe.cost,seconds:recipe.seconds,damage:recipe.damage,charges:recipe.charges},point,retiredSyntheticIds:retired,
  assignedFields:['player physical service point','finite carried recipe materials','native spawn followed by declared physical contact placement','same surviving synthetic contact departure outside mount reach'],
  payment:{carryBefore,carryAfter,resourcesBefore,resourcesAfter:{...g.resources}},event:{id:z.id,hpBefore:hp,hpAfter:healthAfter,chargesBefore:charges,chargesAfter:trigger.charges,trigger,action,departure},
  paint:{first:{...first,rawData:undefined},second:{...second,rawData:undefined},paused:{...paused,rawData:undefined},separateParts:motionCalls(first).length===3&&motionCalls(second).length===3,partsMoved:JSON.stringify(motionCalls(first))!==JSON.stringify(motionCalls(second)),unchangedOldWhole:![...first.calls,...second.calls].some(c=>c.atlas==='art158Mechanisms'),pauseIdentical:paused.hash===second.hash},
  simulationSteps:s.steps,note:'Only installed simulation owners run in bounded 0.04s steps. No cooldown, charge, target health, event, animation phase, AI or elapsed clock is assigned. Recipe payment happens through the original timed job.'};
}

export function spriteActorFixture159() {
 const g=DEADWALL,C=DeadwallCore,s=__SPRITES159__,retired=s.retire(),Building=g.core().constructor;
 let foundation;const core=g.core();
 for(let ring=10;ring<42&&!foundation;ring+=2)for(let dy=-ring;dy<=ring&&!foundation;dy+=2)for(let dx=-ring;dx<=ring&&!foundation;dx+=2){
  const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.warehouse,gx,gy,0).valid)continue;
  const candidate=new Building(g.nextId,'warehouse',gx,gy,0,0),point=g.fieldcraft.service(g.player,candidate);if(!point)continue;
  s.running(()=>{if(!g.placeOne('warehouse',gx,gy,0))throw Error('Native paid foundation refused');});foundation=[...g.world.buildings.values()].find(b=>b.type==='warehouse'&&b.gx===gx&&b.gy===gy&&!b.completed);
 }
 if(!foundation)throw Error('Paid physically accessible foundation required');const point=s.service(foundation),worker=g.createProtectedSurvivor('worker',point.x,point.y);
 if(!worker)throw Error('Native worker fixture creation refused');s.running(()=>{if(!g.setWorkerOrder('build'))throw Error('Native construction order refused');});const progress=foundation.progress;s.advance(.04);
 const firstPose=g.actorActionPresentation159(worker),first=s.capture('Ouvrier • construction réellement avancée',worker,'unit');
 s.advance(.2);const secondPose=g.actorActionPresentation159(worker),second=s.capture('Ouvrier • cycle de construction',worker,'unit'),paused=s.capture('Ouvrier • pause répétée',worker,'unit');
 return{type:'prepared-actual-worker-construction',worker:worker.id,foundation:foundation.id,retiredSyntheticIds:retired,
  assignedFields:['one native protected worker at real service point'],nativeActions:['placeOne paid warehouse foundation','setWorkerOrder build','bounded ordinary update steps'],
  progressBefore:progress,progressAfter:foundation.progress,firstPose,secondPose,
  paint:{first:{...first,rawData:undefined},second:{...second,rawData:undefined},pauseIdentical:second.hash===paused.hash,usesActionSheet:first.usesOwnedActionSheet&&second.usesOwnedActionSheet},
  note:'No fabricated action event: the installed worker must increase the genuine funded foundation progress before its own event exists.'};
}

export function spritePictures159() {
 const s=__SPRITES159__,columns=2,cw=300,ch=190,canvas=document.createElement('canvas');canvas.width=columns*cw;canvas.height=Math.ceil(s.pictures.length/columns)*ch;
 const ctx=canvas.getContext('2d');return Promise.all(s.pictures.map(async(p,index)=>{const image=new Image();image.src=p.data;await image.decode();ctx.drawImage(image,index%columns*cw,Math.floor(index/columns)*ch);})).then(()=>({count:s.pictures.length,names:s.pictures.map(p=>p.name),data:canvas.toDataURL('image/png')}));
}

export function spriteContactBody159() {
 const g=DEADWALL,C=DeadwallCore,s=__SPRITES159__,worker=g.units.find(u=>u.kind==='worker'&&!u.dead),core=g.core();
 if(!g.paused||!worker)throw Error('Existing prepared worker and deliberate Pause required');s.retire();let support;
 for(let ring=8;ring<42&&!support;ring+=2)for(let dy=-ring;dy<=ring&&!support;dy+=2)for(let dx=-ring;dx<=ring&&!support;dx+=2){
  const gx=core.gx+dx,gy=core.gy+dy;if(!g.world.placement(C.BUILDINGS.spikes,gx,gy,0).valid)continue;
  s.running(()=>{if(!g.placeOne('spikes',gx,gy,0))throw Error('Native funded spikes foundation refused');});support=[...g.world.buildings.values()].find(b=>b.type==='spikes'&&b.gx===gx&&b.gy===gy&&!b.completed);
 }
 if(!support)throw Error('Real funded spikes foundation required');const point=g.fieldcraft.service(worker,support);if(!point)throw Error('Actual worker needs a real exterior access');Object.assign(worker,point);
 s.running(()=>{if(!g.setWorkerOrder('retreat')||!g.setWorkerOrder('build'))throw Error('Native change of construction order refused');});
 let constructionSteps=0;s.running(()=>{while(!support.completed&&constructionSteps++<400){g.update(.04);s.steps++;}});if(!support.completed)throw Error('Ordinary worker did not complete paid support #'+support.id+' progress='+support.progress+' order='+g.workerOrder+' state='+worker.state+' target='+worker.targetBuilding);
 const departure=g.fieldcraft.service(worker,core);if(!departure)throw Error('Synthetic worker needs a free physical departure');Object.assign(worker,departure);s.running(()=>{if(!g.setWorkerOrder('retreat'))throw Error('Native retreat order refused');});g.flow.rebuild(g.world,g.core());
 if(!g.spawnZombie('walker'))throw Error('Native contact-body spawn refused');const z=g.zombies.at(-1);s.syntheticEnemies.add(z.id);let contactPoint;
 for(let i=0;i<8;i++){const p={x:g.player.x+Math.cos(i*Math.PI/4)*30,y:g.player.y+Math.sin(i*Math.PI/4)*30};if(!contactPoint&&g.hostilePositionClear(z,p.x,p.y)&&g.hostileLineClear(p,g.player,false)&&g.visibility.canSeeLocal({...z,...p})&&Math.hypot(p.x-g.player.x,p.y-g.player.y)>z.radius+g.player.radius)contactPoint=p;}
 if(!contactPoint)throw Error('Separated physical contact with live commander required');Object.assign(z,contactPoint);g.rebuildBuckets();
 const hp=z.health,bhp=support.health,playerHealth=g.player.health;s.advance(.04);const firstPose=g.actorActionPresentation159(z),first=s.capture('Errant • contact réel avec le commandant',z,'zombie');
 s.advance(.2);const secondPose=g.actorActionPresentation159(z),second=s.capture('Errant • cycle d’attaque natif',z,'zombie'),paused=s.capture('Errant • pause répétée',z,'zombie');
 return{type:'prepared-actual-contact-attack',support:support.id,contact:z.id,constructionSteps,healthBefore:hp,healthAfter:z.health,playerBefore:playerHealth,playerAfter:g.player.health,supportBefore:bhp,supportAfter:support.health,firstPose,secondPose,
  physicallyVisible:g.visibility.canSeeLocal(z),
  assignedFields:['existing synthetic worker relocated to free construction access','same worker relocated alive to free core access','native walker spawn relocated30 units from living commander, with nonoverlapping bodies'],
  nativeActions:['placeOne funded spikes foundation','setWorkerOrder build','ordinary worker construction through bounded update','setWorkerOrder retreat','ordinary updateZombies validates a real victim contact and records its successful strike'],
  paint:{first:{...first,rawData:undefined},second:{...second,rawData:undefined},pauseIdentical:second.hash===paused.hash,usesActionSheet:first.usesOwnedActionSheet&&second.usesOwnedActionSheet},
  note:'No health or action event is assigned. The support is paid and completed by its real worker; the visible enemy must hurt the actual living commander through its installed victim branch before an attack pose can exist. No field direction is forced.'};
}
