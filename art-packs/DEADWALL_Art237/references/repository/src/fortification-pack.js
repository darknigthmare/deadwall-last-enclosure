/* DEADWALL 1.27 — finite stores, physical recovery, controlled industry. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.FortificationPackRules;
const clone=x=>JSON.parse(JSON.stringify(x)),num=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const int=(v,min=1,max=0x7ffffffe)=>Number.isInteger(v)&&v>=min&&v<=max;
const live=b=>b&&!b.dead&&b.health>0;
const variants=()=>R.variants||{};
const capacityLimit=kind=>Math.max(R[kind+'Capacity'],...Object.values(variants()).filter(v=>v.target===kind).map(v=>v.capacity));
function equipment(kind){
 if(typeof kind!=='string')return null;
 if(Object.hasOwn(variants(),kind))return{...variants()[kind],kind};
 if(!['ammo','repair','net','regulator'].includes(kind))return null;
 return{kind,target:kind,cost:R[kind+'Cost'],capacity:kind==='regulator'?0:R[kind+'Capacity']};
}
function initial(){return{version:1,fittings:[],debris:[]};}
function normalizeMechanism(raw,full){
 const bad=()=>{throw Error('Fortifications : montage mécanique invalide.');};
 if(!raw||Array.isArray(raw)||typeof raw!=='object'||Object.keys(raw).length!==4||Object.keys(raw).some(k=>!['kind','charges','cooldown','caught'].includes(k)))bad();
 const recipe=typeof raw.kind==='string'&&Object.hasOwn(R.mechanisms||{},raw.kind)?R.mechanisms[raw.kind]:null;
 if(!recipe||!int(raw.charges,0,recipe.charges)||!num(raw.cooldown,0,recipe.cooldown)||!Array.isArray(raw.caught)||raw.charges+raw.caught.length>recipe.charges||!recipe.holdSeconds&&raw.caught.length)bad();
 if(full&&recipe.strictTier&&C.Urban.knownTier(full.urban).id<recipe.tier)bad();
 const ids=new Set(),zombies=full?.zombies&&new Set(full.zombies.map(z=>z.id));
 const caught=raw.caught.map(c=>{
  if(!c||Array.isArray(c)||Object.keys(c).length!==2||Object.keys(c).some(k=>!['id','left'].includes(k))||!int(c.id)||ids.has(c.id)||!num(c.left,Number.MIN_VALUE,recipe.holdSeconds)||zombies&&!zombies.has(c.id))bad();
  ids.add(c.id);return{id:c.id,left:c.left};
 });
 return{kind:raw.kind,charges:raw.charges,cooldown:raw.cooldown,caught};
}
function normalize(raw,full,geometryVersion202=full?.cityGeometry202??0){
 if(raw===undefined)return initial();
 const fail=m=>{throw Error('Fortifications : '+m+'.');};
 if(!raw||raw.version!==1||!Array.isArray(raw.fittings)||raw.fittings.length>R.maxFittings||!Array.isArray(raw.debris)||raw.debris.length>R.maxDebris)fail('registre invalide');
 const ids=new Set(),buildings=full?.buildings&&new Map(full.buildings.map(b=>[b.id,b]));
 const fittings=raw.fittings.map(f=>{
  if(!f||!int(f.id)||ids.has(f.id)||!num(f.ammo,0,capacityLimit('ammo'))||!num(f.repair,0,capacityLimit('repair'))||!num(f.net,0,capacityLimit('net'))||typeof f.regulator!=='boolean')fail('équipement invalide');
  ids.add(f.id);
  if(buildings){const b=buildings.get(f.id),d=b&&C.BUILDINGS[b.type];if(!d||b.progress<1||(f.ammo>0&&!d.range)||(f.net>0&&!d.wall)||(f.regulator&&(!d.production||!Object.keys(d.consumes||{}).length)))fail('support incompatible');}
  const next={id:f.id,ammo:f.ammo,repair:f.repair,net:f.net,regulator:f.regulator};
  if(Object.hasOwn(f,'mechanism')){
   next.mechanism=normalizeMechanism(f.mechanism,full);
   if(buildings&&buildings.get(f.id)?.type!=='spikes')fail('montage sur support incompatible');
  }
  return next;
 });
 ids.clear();
 const debris=raw.debris.map(d=>{
  if(!d||!int(d.id)||ids.has(d.id)||!C.BUILDINGS[d.type]||d.type==='core'||!num(d.x,0,C.WORLD_SIZE)||!num(d.y,0,C.WORLD_SIZE)||!num(d.w,1,C.WORLD_SIZE)||!num(d.h,1,C.WORLD_SIZE)||!d.remaining||typeof d.remaining!=='object'||Object.keys(d.remaining).some(k=>!R.debrisResources.includes(k)))fail('débris invalides');
  const def=C.CityGeometry202.definition(d.type,geometryVersion202);if(buildings?.has(d.id))fail('structure encore présente');if(full&&d.id>=full.nextId)fail('identifiant de ruine futur');
  const remaining={};for(const k of R.debrisResources){const amount=d.remaining[k]===undefined?0:d.remaining[k];if(!num(amount,0,Math.floor((def.cost[k]||0)*R.debrisFactor)))fail('réserve de débris');remaining[k]=amount;}
  if(!((d.w===def.size[0]*C.TILE&&d.h===def.size[1]*C.TILE)||(d.w===def.size[1]*C.TILE&&d.h===def.size[0]*C.TILE)))fail('empreinte de débris');
  ids.add(d.id);return{id:d.id,type:d.type,x:d.x,y:d.y,w:d.w,h:d.h,remaining};
 });
 return{version:1,fittings,debris};
}
function install(g){
 if(!g||g.fortificationPack)return g?.fortificationPack;
 if(!g.expansions?.register)throw Error('Centre des extensions absent.');
 let state=initial(),job=null,message='',guarded=[],mechanismPass=0,visualClock=0;
 // Contact pulses are presentation only. Mechanics continue to own their saved
 // charges, cooldowns and held targets; drawing never advances these clocks.
 const visualEvents=new Map(),visualDurations=Object.freeze({spikes:.24,net:.65});
 const maxEnemyRadius=Math.max(...Object.values(C.ENEMIES).map(d=>d.radius));
 const wrap=(name,fn)=>{const old=g[name]?.bind(g);if(old)g[name]=(...args)=>fn(old,...args);};
 const home=()=>!g.frontier?.active?.();
 const manualPost=()=>Boolean(g.fieldcraft?.context?.()?.mounted);
 const acting=()=>g.state==='playing'&&!g.gameOver&&live(g.player)&&home()&&!g.expeditions?.driving?.()&&!manualPost()&&g.player.reload<=0&&(g.expansions.canAct?.()??g.canIssueCommand());
 const simulationRunning=()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay;
 const running=()=>simulationRunning()&&home()&&live(g.player)&&!g.expeditions?.driving?.();
 const secure=p=>!g.zombies.some(z=>live(z)&&Math.hypot(z.x-p.x,z.y-p.y)<R.dangerRange&&g.hostileLineClear(z,p));
 const building=id=>{const b=g.world.buildings.get(id);return live(b)&&b.completed?b:null;};
 const fitting=id=>state.fittings.find(f=>f.id===id);
 const clamp01=n=>Math.max(0,Math.min(1,n));
 function visualOwner(value){const b=typeof value==='object'?value:building(value);return b&&building(b.id)===b?b:null;}
 function contactPulse(b,kind){
  if(!simulationRunning()||building(b?.id)!==b)return;
  const key=b.id+':'+kind,previous=visualEvents.get(key),duration=visualDurations[kind];
  if(previous?.owner===b&&visualClock-previous.at<duration)return;
  visualEvents.delete(key);if(visualEvents.size>=R.maxFittings)visualEvents.delete(visualEvents.keys().next().value);
  visualEvents.set(key,{owner:b,at:visualClock,duration});
 }
 function advanceVisuals(dt){
  visualClock+=dt;
  for(const[key,event]of visualEvents)if(visualClock-event.at>=event.duration||building(event.owner.id)!==event.owner)visualEvents.delete(key);
 }
 function pulsePresentation(b,kind){
  const event=visualEvents.get(b.id+':'+kind);
  if(!event||event.owner!==b||building(b.id)!==b||visualClock-event.at>=event.duration)return null;
  const progress=clamp01((visualClock-event.at)/event.duration),actionEnd=kind==='net'?.42:.28;
  return{phase:progress<actionEnd?'action':'return',progress,motion:progress<actionEnd?Math.sin(progress/actionEnd*Math.PI/2):Math.cos((progress-actionEnd)/(1-actionEnd)*Math.PI/2)};
 }
 function mechanismPresentation(m){
  const recipe=R.mechanisms[m.kind],held=m.caught.length,left=Math.max(0,...m.caught.map(c=>c.left)),cycle=clamp01(1-m.cooldown/recipe.cooldown);
  let phase,progress=0,motion=0;
  if(m.cooldown>0&&cycle<.18){phase='trigger';progress=cycle/.18;motion=progress;}
  else if(m.cooldown>0&&cycle<.55){phase='action';progress=(cycle-.18)/.37;motion=1;}
  else if(held){
   const releaseSeconds=Math.min(.28,recipe.holdSeconds*.12);
   if(left<releaseSeconds){phase='return';progress=clamp01(1-left/releaseSeconds);motion=1-progress;}
   else{phase='held';progress=clamp01(1-left/recipe.holdSeconds);motion=1;}
  }else if(m.cooldown>0){phase='return';progress=(cycle-.55)/.45;motion=1-progress;}
  else phase=m.charges>0?'armed':'exhausted';
  return{kind:m.kind,phase,progress:clamp01(progress),motion:clamp01(motion),charges:m.charges,capacity:recipe.charges,cooldown:m.cooldown,held};
 }
 function presentationFor(b,f){
  const netPulse=pulsePresentation(b,'net'),spikePulse=b.type==='spikes'?pulsePresentation(b,'spikes'):null;
  return{ownerId:b.id,spikes:b.type==='spikes'?(spikePulse||{phase:'idle',progress:0,motion:0}):null,
   mechanism:f?.mechanism?mechanismPresentation(f.mechanism):null,
   net:f?.net>0||netPulse?{remaining:f?.net||0,...(netPulse||{phase:'armed',progress:0,motion:0})}:null,
   ammo:f?.ammo||0,repair:f?.repair||0,regulator:!!f?.regulator};
 }
 function presentation(value){const b=visualOwner(value);return b?presentationFor(b,fitting(b.id)):null;}
 function releaseHeld(m,zombies){
  for(const c of m.caught){const z=zombies.get(c.id);if(!z)continue;
   for(const key of ['stagger','attackCooldown'])if(Math.abs(z[key]-c.left)<1e-6||mechanismPass>0&&Math.abs(z[key]-c.left-mechanismPass)<1e-6)z[key]=0;
  }
 }
 function reconcile(){
  if(state.fittings.some(f=>f.mechanism)){
   const zombies=new Map(g.zombies.filter(live).map(z=>[z.id,z]));
   for(const f of state.fittings)if(f.mechanism){
    const b=building(f.id);if(!b||b.type!=='spikes'){releaseHeld(f.mechanism,zombies);delete f.mechanism;}
    else f.mechanism.caught=f.mechanism.caught.filter(c=>c.left>0&&zombies.has(c.id));
   }
  }
  state.fittings=state.fittings.filter(f=>building(f.id)&&(f.ammo>0||f.repair>0||f.net>0||f.regulator||f.mechanism));
  if(job?.building&&!building(job.building))job=null;
 }
 function touch(b){
  if(!b||!live(g.player))return false;
  if(Math.hypot(g.player.x-Math.max(b.left,Math.min(b.right,g.player.x)),g.player.y-Math.max(b.top,Math.min(b.bottom,g.player.y)))>R.reach+g.player.radius+14)return false;
  const p=g.fieldcraft?.service(g.player,b)||g.workerBuildExit?.(g.player,b,'repair');
  return !!p&&Math.hypot(g.player.x-p.x,g.player.y-p.y)<=R.reach&&g.workerCanWorkAt(g.player,p,R.reach);
 }
 function debrisPoint(d){return g.fieldcraft?.service(g.player,{...d,def:g.world.definition?.(d.type)||C.BUILDINGS[d.type],left:d.x-d.w/2,right:d.x+d.w/2,top:d.y-d.h/2,bottom:d.y+d.h/2});}
 function touchDebris(d){if(!d||Math.hypot(g.player.x-Math.max(d.x-d.w/2,Math.min(d.x+d.w/2,g.player.x)),g.player.y-Math.max(d.y-d.h/2,Math.min(d.y+d.h/2,g.player.y)))>R.reach+g.player.radius+14)return false;const p=debrisPoint(d);return !!p&&Math.hypot(g.player.x-p.x,g.player.y-p.y)<=R.reach&&g.workerCanWorkAt(g.player,p,R.reach);}
 const target=()=>{const selected=building(g.selectedBuilding?.id);if(selected)return selected;return [...g.world.buildings.values()].filter(b=>live(b)&&b.completed&&touch(b)).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y))[0];};
 function eligibility(kind,b=target()){
  if(!acting())return{ok:false,reason:'Rejoignez D-17 à pied pendant la campagne.'};
  if(job||g.expansions.busy('fortification'))return{ok:false,reason:'Terminez ou interrompez le travail en cours.'};
  if(!b||!touch(b))return{ok:false,reason:'Approchez du support sélectionné par un accès libre.'};
  if(!secure(g.player))return{ok:false,reason:'Éloignez les infectés avant de manipuler cet équipement.'};
  const f=fitting(b.id);
  if(!f&&state.fittings.length>=R.maxFittings)return{ok:false,reason:'128 supports déjà équipés.'};
  const option=equipment(kind),cost=option?.cost,slot=option?.target;
  if(!cost)return{ok:false,reason:'Équipement inconnu.'};
  if(option.tier!==undefined&&g.tier.id<option.tier)return{ok:false,reason:'Palier requis : '+C.CITY_TIERS[option.tier].name+'.'};
  if(option.requires&&!g.world.has(option.requires))return{ok:false,reason:C.BUILDINGS[option.requires].name+' terminé requis.'};
  if(slot==='ammo'&&!b.def.range)return{ok:false,reason:'Sélectionnez un mirador ou une tourelle.'};
  if(slot==='net'&&!b.def.wall)return{ok:false,reason:'Sélectionnez un mur ou une porte.'};
  if(slot==='regulator'&&(!b.def.production||!Object.keys(b.def.consumes||{}).length))return{ok:false,reason:'Sélectionnez une industrie consommant des intrants.'};
  if(slot==='regulator'?f?.regulator:(f?.[slot]||0)>0)return{ok:false,reason:'Cet équipement est déjà en place ; utilisez d’abord sa réserve.'};
  if(!C.canAfford(g.resources,cost))return{ok:false,reason:'Réserves requises : '+C.resourceText(cost)+'.'};
  return{ok:true,b,cost,option};
 }
 function done(text,save=true){message=text;g.audio.ui?.();if(save)g.save(false);return{ok:true};}
 function fail(reason){message=reason;return{ok:false,reason};}
 function fieldWorkReason(continuing){
  if(!acting()||g.player.regionAbsent)return 'Rejoignez D-17 à pied, les mains libres et hors poste de tir.';
  if((job&&job!==continuing)||g.expansions.busy('fortification'))return 'Terminez ou interrompez le travail en cours.';
  const context=g.fieldcraft?.context?.(),day=g.dayworks?.workContext?.()||g.dayworks?.overview?.();
  if(g.selectedBuild||context?.moving||context?.quote||g.linecare?.toolActive?.()||g.siege?.toolActive?.()||g.infrastructure?.toolActive?.()||(day?.tool||'none')!=='none'||day?.placing||day?.preview)return 'Rangez les outils et quittez le placement avant de préparer la défense.';
  return '';
 }
 function fieldSupplyQuote(kind,b,continuing=null){
  const recipe=typeof kind==='string'&&Object.hasOwn(R.fieldSupply||{},kind)?R.fieldSupply[kind]:null;
  const refuse=reason=>({ok:false,reason});
  if(!recipe)return refuse('Appoint inconnu.');
  const reason=fieldWorkReason(continuing);if(reason)return refuse(reason);
  if(!b||continuing&&(b!==continuing.support||b.type!==continuing.type))return refuse('Le support prévu est absent ou a changé.');
  if(!touch(b))return refuse('Approchez du support prévu par un accès libre.');
  if(kind==='ammo'&&!b.def.range)return refuse('Sélectionnez un mirador ou une tourelle achevés.');
  if(!secure(g.player))return refuse('Éloignez les infectés avant de manipuler cet équipement.');
  const f=fitting(b.id),capacity=R[kind+'Capacity'],amount=continuing?.amount??Math.min(recipe.amount,Math.max(0,capacity-(f?.[kind]||0)));
  if(!f&&state.fittings.length>=R.maxFittings)return refuse('Tous les emplacements d’équipement sont occupés.');
  if(!(amount>0))return refuse('Cette réserve est pleine.');
  if((f?.[kind]||0)+amount>capacity)return refuse('La place disponible a changé ; préparez un nouveau devis.');
  const cost=continuing?.cost||Object.fromEntries(Object.entries(recipe.cost).map(([key,n])=>[key,Math.ceil(n*amount/recipe.amount)]));
  if(!C.canAfford(g.player.carry,cost))return refuse('À transporter dans le sac : '+C.resourceText(cost)+'.');
  return{ok:true,b,recipe,amount,cost:{...cost},capacity};
 }
 function previewFieldSupply(kind,id){reconcile();return fieldSupplyQuote(kind,id===undefined?target():building(id));}
 function startFieldSupply(kind,id){
  const q=previewFieldSupply(kind,id);if(!q.ok)return fail(q.reason);
  job={kind:'supply',slot:kind,building:q.b.id,support:q.b,type:q.b.type,amount:q.amount,cost:q.cost,seconds:q.recipe.seconds,elapsed:0,x:g.player.x,y:g.player.y,health:g.player.health};
  g.releaseInputs?.();return done(q.recipe.name+' en cours : '+q.amount+' '+(kind==='ammo'?'cartouches':'points')+'. Restez auprès du support ; paiement dans le sac à l’achèvement.',false);
 }
 function mechanismQuote(kind,b,continuing=null){
  const recipe=typeof kind==='string'&&Object.hasOwn(R.mechanisms||{},kind)?R.mechanisms[kind]:null,refuse=reason=>({ok:false,reason});
  if(!recipe)return refuse('Montage inconnu.');
  const reason=fieldWorkReason(continuing);if(reason)return refuse(reason);
  if(!b||continuing&&(b!==continuing.support||b.type!==continuing.type||b.gx!==continuing.gx||b.gy!==continuing.gy||b.rotation!==continuing.rotation))return refuse('Le support prévu est absent, déplacé ou remplacé.');
  if(b.type!=='spikes')return refuse('Construisez et achevez un Hérisson anti-horde, puis approchez son accès libre.');
  if(!touch(b))return refuse('Approchez du Hérisson prévu par un accès libre.');
  if(!secure(g.player))return refuse('Éloignez les infectés avant de préparer le montage.');
  if(g.tier.id<recipe.tier)return refuse('Palier requis : '+C.CITY_TIERS[recipe.tier].name+'.');
  if(recipe.requires&&!g.world.has(recipe.requires))return refuse(C.BUILDINGS[recipe.requires].name+' terminé requis.');
  const f=fitting(b.id),m=f?.mechanism;
  if(m&&(m.charges>0||m.caught.length))return refuse('Utilisez le montage en place ou retirez-le sans remboursement.');
  if(!f&&state.fittings.length>=R.maxFittings)return refuse('Tous les emplacements d’équipement sont occupés.');
  const cost=continuing?.cost||recipe.cost;
  if(!C.canAfford(g.player.carry,cost))return refuse('À transporter dans le sac : '+C.resourceText(cost)+'.');
  return{ok:true,b,recipe,cost:{...cost},seconds:recipe.seconds};
 }
 function previewMechanism(kind,id){reconcile();return mechanismQuote(kind,id===undefined?target():building(id));}
 function startMechanism(kind,id){
  const q=previewMechanism(kind,id);if(!q.ok)return fail(q.reason);
  job={kind:'mechanism',slot:kind,building:q.b.id,support:q.b,type:q.b.type,gx:q.b.gx,gy:q.b.gy,rotation:q.b.rotation,cost:q.cost,seconds:q.seconds,elapsed:0,x:g.player.x,y:g.player.y,health:g.player.health};
  g.releaseInputs?.();return done(q.recipe.name+' en cours. Restez près du Hérisson ; paiement dans le sac à l’achèvement.',false);
 }
 function mechanismRearmQuote(b,continuing=null){
  const refuse=reason=>({ok:false,reason}),reason=fieldWorkReason(continuing);if(reason)return refuse(reason);
  if(!b||b.type!=='spikes'||continuing&&(b!==continuing.support||b.gx!==continuing.gx||b.gy!==continuing.gy||b.rotation!==continuing.rotation))return refuse('Le Hérisson prévu est absent, déplacé ou remplacé.');
  if(!touch(b)||!secure(g.player))return refuse('Rejoignez le montage par un accès libre et sûr.');
  const m=fitting(b.id)?.mechanism,recipe=m&&R.mechanisms[m.kind];
  if(!m||!recipe)return refuse('Installez d’abord un montage mécanique.');
  if(continuing&&(m!==continuing.mechanism||m.kind!==continuing.slot||m.charges!==continuing.initialCharges))return refuse('Le montage ou ses charges ont changé ; préparez un nouveau réarmement.');
  if(m.caught.length)return refuse('Attendez la libération des cibles retenues avant de réarmer.');
  if(g.tier.id<recipe.tier||recipe.requires&&!g.world.has(recipe.requires))return refuse('Âge acquis et atelier achevé requis pour ce montage.');
  const amount=recipe.charges-m.charges;if(amount<=0)return refuse('Ce montage possède déjà toutes ses charges.');
  const cost=Object.fromEntries(Object.entries(recipe.cost).map(([key,n])=>[key,Math.ceil(n*R.mechanismRearmCostFactor*amount/recipe.charges)]));
  if(!C.canAfford(g.player.carry,cost))return refuse('Pièces à transporter dans le sac : '+C.resourceText(cost)+'.');
  return{ok:true,b,m,recipe,amount,cost,seconds:recipe.seconds*R.mechanismRearmTimeFactor*amount/recipe.charges};
 }
 function previewMechanismRearm(id){reconcile();return mechanismRearmQuote(id===undefined?target():building(id));}
 function startMechanismRearm(id){
  const q=previewMechanismRearm(id);if(!q.ok)return fail(q.reason);
  job={kind:'rearm',slot:q.m.kind,mechanism:q.m,initialCharges:q.m.charges,amount:q.amount,building:q.b.id,support:q.b,gx:q.b.gx,gy:q.b.gy,rotation:q.b.rotation,
   seconds:q.seconds,elapsed:0,x:g.player.x,y:g.player.y,health:g.player.health};
  g.releaseInputs?.();return done('Réarmement : '+q.amount+' charge'+(q.amount>1?'s':'')+' · '+C.resourceText(q.cost)+' dans le sac à l’achèvement. Le cycle du montage reste conservé.',false);
 }
 function removeMechanism(id){
  reconcile();const b=building(id),f=b&&fitting(id),reason=fieldWorkReason();
  if(reason)return fail(reason);
  if(!b||!touch(b)||!secure(g.player)||!f?.mechanism)return fail('Rejoignez le montage en sécurité par un accès libre.');
  if(f.mechanism.caught.length)return fail('Attendez la fin de l’entrave avant de retirer le mécanisme.');
  delete f.mechanism;reconcile();return done('Montage retiré sans remboursement. Les autres réserves restent sur le support.');
 }
 function planSpikes(){
  const reason=fieldWorkReason();if(reason)return fail(reason);
  if(g.tier.id<C.BUILDINGS.spikes.unlockTier)return fail('Palier requis : '+C.CITY_TIERS[C.BUILDINGS.spikes.unlockTier].name+'.');
  g.selectBuild('spikes');return done('Plan Hérisson sélectionné. Choisissez un sol libre et financez le chantier ordinaire.',false);
 }
 function equip(kind,id){reconcile();const q=eligibility(kind,id===undefined?target():building(id));if(!q.ok)return fail(q.reason);C.spend(g.resources,q.cost);let f=fitting(q.b.id);if(!f){f={id:q.b.id,ammo:0,repair:0,net:0,regulator:false};state.fittings.push(f);}const slot=q.option.target;if(slot==='regulator')f.regulator=true;else f[slot]=q.option.capacity;if(slot==='net')visualEvents.delete(q.b.id+':net');g.audio.build?.();return done(q.option.name?q.option.name+' installé : '+q.option.capacity+(slot==='ammo'?' cartouches à ce poste.':' unités de corps avant saturation.'):({ammo:'Caisson chargé : '+R.ammoCapacity+' cartouches à ce poste.',repair:'Cassette installée : '+R.repairCapacity+' points de réparation manuelle.',net:'Filet installé : '+R.netCapacity+' unités de corps avant saturation.',regulator:'Régulateur installé : '+R.inputReserve+' unités de chaque intrant seront préservées.'})[kind]);}
 function recoverAmmo(id){const b=building(id),f=fitting(id);if(!acting()||job||g.expansions.busy('fortification')||!b||!touch(b)||!secure(g.player)||!(f?.ammo>0))return fail('Approchez du caisson en sécurité, les mains libres.');const moved=Math.min(f.ammo,Math.max(0,g.storage-g.resources.ammo));if(!(moved>0))return fail('Le stock de munitions est plein.');g.resources.ammo+=moved;f.ammo-=moved;return done(moved+' cartouches remises en réserve commune.');}
 function startRepair(id){if(job||g.expansions.busy('fortification'))return fail('Un travail est déjà en cours.');const b=building(id),f=fitting(id);if(!acting()||!b||!touch(b)||!secure(g.player)||g.phase==='assault'||!(f?.repair>0)||b.health>=b.maxHealth)return fail('Cassette, support endommagé et accès sûr requis.');job={kind:'repair',building:id,health:g.player.health};g.releaseInputs?.();return done('Réparation manuelle en cours. Restez auprès du support.',false);}
 function startRecovery(id){if(job||g.expansions.busy('fortification'))return fail('Un travail est déjà en cours.');const d=state.debris.find(d=>d.id===id);if(!acting()||!d||!touchDebris(d)||!secure(g.player))return fail('Approchez des débris par un accès libre et sûr.');if(C.bagTotal(g.player.carry)>=g.player.carryCapacity)return fail('Votre sac est plein.');job={kind:'debris',id,health:g.player.health};g.releaseInputs?.();return done('Tri des débris en cours. Les matériaux entrent dans votre sac.',false);}
 function toggleRegulator(id){const b=building(id),f=fitting(id);if(!acting()||job||g.expansions.busy('fortification')||!f||!b||!touch(b)||!secure(g.player))return fail('Rejoignez cette industrie en sécurité, les mains libres.');if(!f.regulator)return fail('Ce régulateur a été retiré.');f.regulator=false;return done('Régulateur retiré sans remboursement.');}
 function stop(){if(!job)return false;job=null;message='Travail interrompu ; les réserves restantes sont conservées.';return true;}
 function step(dt){
  if(!running()||!num(dt,Number.MIN_VALUE,R.maxStep)||!job)return;
  if(g.expansions.busy('fortification')||manualPost()||g.player.health<job.health||!secure(g.player)||g.input.mouseDown||g.input.touchFire||g.player.reload>0||g.selectedBuild){stop();return;}
  if(job.kind==='supply'||job.kind==='mechanism'||job.kind==='rearm'){
   const t=job,q=t.kind==='supply'?fieldSupplyQuote(t.slot,building(t.building),t):t.kind==='rearm'?mechanismRearmQuote(building(t.building),t):mechanismQuote(t.slot,building(t.building),t);
   if(!q.ok||Math.hypot(g.player.x-t.x,g.player.y-t.y)>R.fieldSupplyMoveTolerance){stop();if(!q.ok)message=q.reason;return;}
   t.elapsed+=dt;g.player.action='build';
   if(t.elapsed>=t.seconds){
    if(!C.spend(g.player.carry,q.cost)){stop();return;}
    let f=fitting(t.building);if(!f){f={id:t.building,ammo:0,repair:0,net:0,regulator:false};state.fittings.push(f);}
    if(t.kind==='rearm'){
     q.m.charges+=q.amount;job=null;g.audio.build?.();done(q.recipe.name+' réarmé : '+q.amount+' charge'+(q.amount>1?'s payées.':' payée.')+' Refroidissement et autres réserves conservés.');
    }else if(t.kind==='mechanism'){
     f.mechanism={kind:t.slot,charges:q.recipe.charges,cooldown:0,caught:[]};job=null;g.audio.build?.();done(q.recipe.name+' prêt : '+q.recipe.charges+' déclenchements finis. Matériaux consommés une seule fois dans le sac.');
    }else{
     f[t.slot]+=t.amount;job=null;g.audio.build?.();done('Appoint livré : '+t.amount+' '+(t.slot==='ammo'?'cartouches au poste.':'points dans la cassette. Réparez ensuite le support avec sa réserve.'));
    }
   }
  }else if(job.kind==='repair'){
   const b=building(job.building),f=fitting(job.building);if(!b||!f||!touch(b)||g.phase==='assault'||g.siege?.snapshot().fires.some(f=>f.id===b.id)){stop();return;}
   const n=Math.min(f.repair,b.maxHealth-b.health,dt*R.repairRate);if(n>0){b.health+=n;f.repair-=n;g.player.action='build';}
   if(f.repair<=1e-8||b.health>=b.maxHealth){job=null;done('Réparation achevée. Le reliquat de cassette reste sur place.');}
  }else{
   const d=state.debris.find(d=>d.id===job.id);if(!d||!touchDebris(d)){stop();return;}
   let budget=Math.min(dt*R.debrisRate,g.player.carryCapacity-C.bagTotal(g.player.carry));
   for(const k of R.debrisResources){const n=Math.min(budget,d.remaining[k]);if(n>0){g.player.carry[k]+=n;d.remaining[k]-=n;budget-=n;}}
   if(C.bagTotal(d.remaining)<1e-8){state.debris=state.debris.filter(v=>v!==d);job=null;done('Débris triés. Déposez les matériaux pour les utiliser.');}
   else if(C.bagTotal(g.player.carry)>=g.player.carryCapacity-1e-8){job=null;done('Sac plein. Le reste des débris demeure sur place.');}
  }
 }
 function mechanismLineClear(from,to,support){
  if(!g.hostileLineClear(from,to,false,support))return false;
  const length=Math.hypot(to.x-from.x,to.y-from.y),props=g.fieldcraft?.props?.((from.x+to.x)/2,(from.y+to.y)/2,length/2)||[];
  for(const prop of props){
   if(prop.depleted)continue;const rect=g.fieldcraft.rect(prop);let near=0,far=1,intersects=true;
   for(const[origin,delta,low,high]of [[from.x,to.x-from.x,rect.l,rect.r],[from.y,to.y-from.y,rect.t,rect.b]]){
    if(Math.abs(delta)<1e-9){if(origin<low||origin>high){intersects=false;break;}}
    else{const a=(low-origin)/delta,b=(high-origin)/delta;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(near>far){intersects=false;break;}}
   }
   if(intersects)return false;
  }
  return true;
 }
 function mechanismStep(dt){
  if(!simulationRunning()||!num(dt,Number.MIN_VALUE,R.maxStep))return;
  if(!state.fittings.some(f=>f.mechanism&&(f.mechanism.charges>0||f.mechanism.caught.length))){for(const f of state.fittings)if(f.mechanism)f.mechanism.cooldown=Math.max(0,f.mechanism.cooldown-dt);return;}
  const zombies=new Map(g.zombies.filter(live).map(z=>[z.id,z]));
  for(const f of state.fittings){
   const m=f.mechanism,b=m&&building(f.id),recipe=m&&R.mechanisms[m.kind];if(!b||b.type!=='spikes'||!recipe)continue;
   m.cooldown=Math.max(0,m.cooldown-dt);
   // Historical saves can omit stagger. The paid support owns its remaining
   // entravement and reapplies it before the existing movement calculation.
   for(const c of m.caught){const z=zombies.get(c.id);if(z){z.stagger=Math.max(z.stagger||0,c.left);c.left=Math.max(0,c.left-dt);}else c.left=0;}
   m.caught=m.caught.filter(c=>c.left>0);
   if(m.charges<=0||m.cooldown>0)continue;
   const range=Math.hypot(b.w*C.TILE/2,b.h*C.TILE/2)+R.mechanismContactReach+maxEnemyRadius;
   let target=null,distance=Infinity;
   for(const z of g.nearbyZombies(b.x,b.y,range)){
    if(recipe.targetKinds&&!recipe.targetKinds.includes(z.kind))continue;
    if(!live(z)||recipe.holdSeconds&&(z.stagger>0||m.caught.some(c=>c.id===z.id)))continue;
    const point={x:Math.max(b.left,Math.min(b.right,z.x)),y:Math.max(b.top,Math.min(b.bottom,z.y))},near=Math.hypot(z.x-point.x,z.y-point.y);
    if(near>z.radius+R.mechanismContactReach||near>=distance||!mechanismLineClear(z,point,b))continue;
    target=z;distance=near;
   }
   if(!target)continue;
   m.charges--;m.cooldown=recipe.cooldown;target.health-=recipe.damage;b.flash=Math.max(b.flash||0,.12);
   if(target.health<=0)g.killZombie(target,false);
   else if(recipe.holdSeconds){
    target.stagger=Math.max(target.stagger||0,recipe.holdSeconds);target.attackCooldown=Math.max(target.attackCooldown||0,recipe.holdSeconds);
    const left=Math.max(0,recipe.holdSeconds-dt);if(left>0)m.caught.push({id:target.id,left});
   }
   if(g.visible(b.x,b.y,range,g.viewBounds())&&(!g.visibility||g.visibility.canSeeLocal(target)))g.audio.hit?.();
  }
 }
 function overview(){reconcile();const b=target(),f=b&&fitting(b.id),work=job?.kind==='rearm'?'Réarmement · '+R.mechanisms[job.slot].name+' · '+job.amount+' charges · '+Math.floor(Math.min(1,job.elapsed/job.seconds)*100)+' %':job?.kind==='mechanism'?R.mechanisms[job.slot].name+' · '+Math.floor(Math.min(1,job.elapsed/job.seconds)*100)+' %':job?.kind==='supply'?R.fieldSupply[job.slot].name+' · '+Math.floor(Math.min(1,job.elapsed/job.seconds)*100)+' % · '+job.amount+' '+(job.slot==='ammo'?'cartouches':'points'):job?(job.kind==='repair'?'Réparation manuelle':'Tri des débris'):'Aucun';return{summary:message||'Préparez les postes sur place ; toutes les réserves sont finies et perdues si leur support tombe.',rows:[{label:'Support',value:b?b.def.name:'Approchez ou sélectionnez une structure'},{label:'Caisson local',value:(f?.ammo||0).toFixed(0)+' cartouches'},{label:'Cassette',value:(f?.repair||0).toFixed(0)+' points'},{label:'Filet',value:(f?.net||0).toFixed(1)+' unités restantes'},{label:'Montage mécanique',value:f?.mechanism?R.mechanisms[f.mechanism.kind].name+' · '+f.mechanism.charges+' / '+R.mechanisms[f.mechanism.kind].charges+' déclenchements'+(f.mechanism.charges===0?' · ÉPUISÉ':''):'Absent · Hérisson requis'},{label:'Régulateur',value:f?.regulator?'Seuil : 25 unités par intrant':'Absent'},{label:'Débris récupérables',value:String(state.debris.length)},{label:'Travail',value:work}]};}
 function actions(){
  reconcile();const b=target(),f=b&&fitting(b.id),result=[];
  for(const [kind,label]of [['ammo','Installer le caisson · 24 munitions, 4 bois, 3 ferraille'],['repair','Installer la cassette · 10 ferraille, 4 bois'],['net','Tendre un filet · 12 bois, 6 ferraille'],['regulator','Installer le régulateur · 6 ferraille']]){const q=eligibility(kind,b);result.push({id:kind,label,disabled:!q.ok,reason:q.reason||'',run:()=>equip(kind,b?.id)});}
  for(const[kind,v]of Object.entries(variants())){const q=eligibility(kind,b);result.push({id:kind,label:v.name+' · '+v.capacity+(v.target==='ammo'?' cartouches':' corps')+' · '+C.resourceText(v.cost),description:v.description,disabled:!q.ok,reason:q.reason||v.description||'Réserve finie ; perdue si son support tombe.',run:()=>equip(kind,b?.id)});}
  for(const[kind,r]of Object.entries(R.fieldSupply||{})){const q=fieldSupplyQuote(kind,b);result.push({id:'field-'+kind,label:r.name+' · '+(q.ok?q.amount:'jusqu’à '+r.amount)+' '+(kind==='ammo'?'cartouches':'points'),description:C.resourceText(q.ok?q.cost:r.cost)+' dans le sac · '+r.seconds+' s sur place. Réserve plafonnée à '+R[kind+'Capacity']+' ; aucun prélèvement au dépôt.',disabled:!q.ok,reason:q.reason||'',run:()=>startFieldSupply(kind,b?.id),close:true});}
  const planReason=fieldWorkReason()||(g.tier.id<C.BUILDINGS.spikes.unlockTier?'Palier requis : '+C.CITY_TIERS[C.BUILDINGS.spikes.unlockTier].name+'.':'');
  result.push({id:'build-spikes',label:'Placer un Hérisson anti-horde',description:C.resourceText(C.BUILDINGS.spikes.cost)+' au dépôt pour le chantier ordinaire. Financement, placement libre et construction restent nécessaires avant le montage.',describeDetails:true,disabled:!!planReason,reason:planReason,run:planSpikes,close:true});
  for(const[kind,r]of Object.entries(R.mechanisms||{})){const q=mechanismQuote(kind,b);result.push({id:'mechanism-'+kind,label:r.name+' · '+r.charges+' déclenchements',description:C.resourceText(r.cost)+' dans le sac · '+r.seconds+' s sur place. '+r.description+' Un seul montage par Hérisson ; perdu si le support tombe.',describeDetails:true,disabled:!q.ok,reason:q.reason||'',run:()=>startMechanism(kind,b?.id),close:true});}
  if(f?.mechanism){const q=mechanismRearmQuote(b),recipe=R.mechanisms[f.mechanism.kind];
   const amount=q.ok?q.amount:recipe.charges-f.mechanism.charges;
   result.push({id:'rearm-mechanism',label:'Réarmer '+recipe.name+' · '+amount+' charge'+(amount>1?'s':''),
    description:q.ok?C.resourceText(q.cost)+' dans le sac · '+q.seconds.toFixed(1)+' s sur place. Pièces arrondies au prorata des charges manquantes ; cycle et réserves conservés.':'Réarmement partiel payé sur place, après libération des cibles retenues. Aucun remboursement ni remise à zéro du cycle.',
    describeDetails:true,disabled:!q.ok,reason:q.reason||'',run:()=>startMechanismRearm(b.id),close:true});
   const reason=fieldWorkReason()||(!touch(b)||!secure(g.player)?'Rejoignez le montage par un accès libre et sûr.':f.mechanism.caught.length?'Attendez la fin de l’entrave.':'');result.push({id:'remove-mechanism',label:'Retirer le montage · aucun remboursement',description:'Les charges et matériaux du montage sont perdus ; les autres réserves restent en place.',disabled:!!reason,reason,run:()=>removeMechanism(b.id)});}
  if(f?.ammo>0)result.push({id:'recover-ammo',label:'Récupérer les cartouches restantes',disabled:!acting()||!!job||g.expansions.busy('fortification')||!touch(b)||!secure(g.player),run:()=>recoverAmmo(b.id)});
  if(f?.repair>0)result.push({id:'start-repair',label:'Réparer avec la cassette · 8 points/s',disabled:!acting()||!!job||g.expansions.busy('fortification')||!touch(b)||!secure(g.player)||g.phase==='assault'||b.health>=b.maxHealth,reason:job||g.expansions.busy('fortification')?'Terminez ou interrompez le travail en cours.':'',run:()=>startRepair(b.id),close:true});
  if(f?.regulator)result.push({id:'regulator-off',label:'Retirer le régulateur',disabled:!acting()||!!job||g.expansions.busy('fortification')||!touch(b)||!secure(g.player),run:()=>toggleRegulator(b.id)});
  const d=state.debris.filter(touchDebris).sort((a,b)=>Math.hypot(a.x-g.player.x,a.y-g.player.y)-Math.hypot(b.x-g.player.x,b.y-g.player.y))[0];
  result.push({id:'recover-debris',label:'Trier les débris proches · 6 matériaux/s',disabled:!acting()||!!job||g.expansions.busy('fortification')||!d||!secure(g.player)||C.bagTotal(g.player.carry)>=g.player.carryCapacity,reason:job||g.expansions.busy('fortification')?'Terminez ou interrompez le travail en cours.':d?'':'Rejoignez le contour d’une ruine portant des débris.',run:()=>startRecovery(d?.id),close:true});
  if(job)result.push({id:'stop-work',label:'Interrompre le travail',run:stop});return result;
 }
 wrap('update',(old,dt)=>{if(job&&!live(g.player))stop();const r=old(dt);if(job&&(!home()||!live(g.player)||g.gameOver||g.expeditions?.driving?.()))stop();step(dt);return r;});
 wrap('updateZombies',(old,dt)=>{
  mechanismPass=simulationRunning()&&num(dt,Number.MIN_VALUE,R.maxStep)?dt:0;
  try{if(mechanismPass>0)advanceVisuals(dt);mechanismStep(dt);return old(dt);}finally{mechanismPass=0;}
 });
 wrap('damageZombieBuilding',(old,z,b,amount,...args)=>{const result=old(z,b,amount,...args);if(result&&mechanismPass>0&&b?.type==='spikes'&&num(amount,Number.MIN_VALUE))contactPulse(b,'spikes');return result;});
 wrap('updateBuildings',(old,dt)=>{
  const r=old(dt);if(!simulationRunning()||!num(dt,Number.MIN_VALUE,R.maxStep))return r;
  const mounted=g.fieldcraft?.context?.().mounted;
  for(const f of state.fittings){const b=building(f.id),cost=b?.def.ammoPerShot||1;if(!b||b.id===mounted||!b.def.range||f.ammo<cost||!b.powered||b.siegeOffline||b.territoryOffline||b.gridOffline||b.fireCooldown>0)continue;
   // The caisson is local and already paid. Normal firing always retains its own priority.
   if(g.resources.ammo>=cost&&(!g.citadel||g.citadel.canFire(cost)))continue;
   const z=g.nightwatch?g.nightwatch.target(b.x,b.y,b.def.range):g.nearestZombie(b.x,b.y,b.def.range);if(!z)continue;
   b.turretAngle=Math.atan2(z.y-b.y,z.x-b.x);b.fireCooldown=1/b.def.fireRate;f.ammo-=cost;b.flash=.06;g.fireFriendly(b.x,b.y-3,b.turretAngle,b.def.damage*(g.hasResearch('ballistics')?1.12:1),b.def.range,b.type==='heavyTurret'?'#ffc56e':'#ffe4a1');
  }return r;
 });
 wrap('economyTick',(old,dt)=>{
  if(!num(dt,Number.MIN_VALUE,60))return old(dt);
  guarded=[];
  for(const f of state.fittings){const b=building(f.id);if(!f.regulator||!b||!b.def.consumes)continue;
   const crisis=b.def.powerUse&&g.activeCrisis?.id==='blackout'&&g.activeCrisis.status==='resolved'&&g.activeCrisis.choice==='B'?.5:1;
   const power=b.def.powerUse?(b.powered?1:b.powerShare*(g.hasResearch('grid')?.7:.35)):1;
   const offline=b.territoryOffline||b.siegeOffline||b.dayOffline||(b.gridOffline&&!g.powerGrid?.hasProduction(b.id));
   const seconds=offline||power<=.05&&!g.powerGrid?.hasProduction(b.id)?0:g.powerGrid?g.powerGrid.productionSeconds(b,dt,power,crisis):dt*power*crisis;
   guarded.push({b,offline:b.dayOffline,seconds});b.dayOffline=true;
  }
  let result;try{result=old(dt);}finally{for(const entry of guarded)entry.b.dayOffline=entry.offline;}
  // Regulated factories consume only the excess actually left after essential services.
  for(const {b,seconds}of guarded){if(!(seconds>0))continue;const available={...g.resources};for(const k of Object.keys(b.def.consumes))available[k]=Math.max(0,available[k]-R.inputReserve);
   const fraction=C.productionFraction(available,b.def.production,b.def.consumes,g.storage,seconds);if(!(fraction>0))continue;
   for(const [k,rate]of Object.entries(b.def.consumes))g.resources[k]-=rate*seconds*fraction;
   for(const [k,rate]of Object.entries(b.def.production))g.resources[k]=Math.min(g.storage,g.resources[k]+rate*seconds*fraction);
   const activity=g.productionActivity159||(g.productionActivity159=new WeakMap());activity.set(b,{at:g.elapsed,duration:Math.max(.25,dt),seconds:seconds*fraction});
  }guarded=[];return result;
 });
 wrap('killZombie',(old,z,...args)=>{const b=z&&!z.dead?g.nearestWall(z.x,z.y,52,true):null,f=b&&fitting(b.id),before=b?.corpseLoad||0,r=old(z,...args);if(f?.net>0&&b&&b.corpseLoad>before){const n=Math.min(f.net,b.corpseLoad-before);b.corpseLoad-=n;f.net-=n;if(n>0)contactPulse(b,'net');}return r;});
 wrap('destroyBuilding',(old,b,...args)=>{
  const record=b&&!b.dead&&b.completed&&b.type!=='core'&&g.world.buildings.get(b.id)===b&&state.debris.length<R.maxDebris?{id:b.id,type:b.type,x:b.x,y:b.y,w:b.w*C.TILE,h:b.h*C.TILE,remaining:Object.fromEntries(R.debrisResources.map(k=>[k,Math.floor((b.def.cost[k]||0)*R.debrisFactor)]))}:null;
  const result=old(b,...args);reconcile();if(record&&state.debris.length<R.maxDebris&&!g.world.buildings.has(record.id)&&C.bagTotal(record.remaining)>0&&!state.debris.some(d=>d.id===record.id))state.debris.push(record);return result;
 });
 wrap('structureActionStatus',(old,action,b=g.selectedBuilding)=>{
  const quote=old(action,b),f=b&&fitting(b.id),next=b?.def?.upgradeTo&&C.BUILDINGS[b.def.upgradeTo];
  if(action==='upgrade'&&quote.ok&&f?.regulator&&next&&(!next.production||!Object.keys(next.consumes||{}).length))
   return{...quote,ok:false,reason:'Retirez le régulateur via Fortifications avant cette évolution.'};
  return quote;
 });
 wrap('demolishSelected',(old,...args)=>{const r=old(...args);reconcile();return r;});
 wrap('drawBuilding',(old,ctx,b,...args)=>{const r=old(ctx,b,...args),f=fitting(b.id);if(!b.completed||b.dead||!f&&!visualEvents.has(b.id+':net'))return r;const view=presentationFor(b,f),options={seed:g.world?.seed??0,reducedMotion:!!g.settings?.reducedMotion};if(!f&&!view.net)return r;ctx.save();const preparationDrawn=root.DeadwallTrapArt159?.drawPreparation?.(ctx,g.art,b,{...options,presentation:view});
  if(f?.mechanism){const m=f.mechanism,recipe=R.mechanisms[m.kind],pitch=Math.min(4,(b.right-b.left-6)/recipe.charges);if(!root.DeadwallTrapArt159?.drawMechanism?.(ctx,g.art,b,m,{...options,presentation:view.mechanism}))root.DeadwallWorldVariants158?.drawMechanism(ctx,g.art,b,m,options);ctx.fillStyle=m.charges>0?'#bcb797':'#555d51';ctx.strokeStyle=recipe.holdSeconds?'#a8bf99':'#d2b79c';ctx.lineWidth=2;ctx.strokeRect(b.left+2,b.top+2,b.right-b.left-4,b.bottom-b.top-4);for(let i=0;i<recipe.charges;i++){ctx.fillStyle=i<m.charges?'#dfc692':'#485047';ctx.fillRect(b.left+3+i*pitch,b.bottom-7,Math.min(3,pitch-0.5),4);}if(b.flash>0){ctx.strokeStyle='#ffe3a3';ctx.strokeRect(b.left-2,b.top-2,b.right-b.left+4,b.bottom-b.top+4);}}
  if(view.net&&!root.DeadwallTrapArt159?.drawNet?.(ctx,g.art,b,{...options,presentation:view.net})&&f?.net>0){ctx.strokeStyle='#99a8a1';ctx.lineWidth=1;for(let x=b.left+4;x<b.right;x+=9){ctx.beginPath();ctx.moveTo(x,b.top+3);ctx.lineTo(Math.min(b.right,x+12),b.bottom-3);ctx.stroke();}ctx.strokeRect(b.left+2,b.top+2,b.right-b.left-4,b.bottom-b.top-4);}
  if(!preparationDrawn&&f?.ammo>0&&!g.operationsArt?.draw(ctx,'ammo',b.left+11,b.bottom-4,23)){ctx.fillStyle='#526149';ctx.fillRect(b.left+4,b.bottom-14,15,10);ctx.fillStyle='#d5c58b';ctx.fillRect(b.left+7,b.bottom-12,9,2);}
  if(!preparationDrawn&&f?.repair>0&&!g.operationsArt?.draw(ctx,'support',b.right-12,b.bottom-4,21)){ctx.fillStyle='#916d4b';ctx.fillRect(b.right-20,b.bottom-14,16,10);ctx.strokeStyle='#d5b87a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.right-18,b.bottom-9);ctx.lineTo(b.right-6,b.bottom-9);ctx.stroke();}
  if(!preparationDrawn&&f?.regulator){ctx.fillStyle='#98b9ad';ctx.fillRect(b.left+4,b.top+4,9,9);ctx.fillStyle='#273b34';ctx.fillRect(b.left+7,b.top+6,2,5);}ctx.restore();return r;
 });
 wrap('drawGround',(old,ctx,...args)=>{const r=old(ctx,...args);if(!home()&&!args[0]?.homeProjection)return r;ctx.save();for(const d of state.debris){const v=args[0];if(v&&(d.x+d.w/2<v.left||d.x-d.w/2>v.right||d.y+d.h/2<v.top||d.y-d.h/2>v.bottom))continue;ctx.fillStyle='#887661';ctx.fillRect(d.x-d.w/2+3,d.y+d.h/2+4,16,5);ctx.fillStyle='#a7a295';ctx.fillRect(d.x-d.w/2+11,d.y+d.h/2+1,10,6);}ctx.restore();return r;});
 const api={version:'1.27.0',snapshot:()=>{reconcile();return clone(state);},presentation,inputReserve:id=>fitting(id)?.regulator?R.inputReserve:0,overview,actions,busy:()=>Boolean(job),equip,recoverAmmo,startRepair,startRecovery,previewFieldSupply,startFieldSupply,previewMechanism,startMechanism,previewMechanismRearm,startMechanismRearm,removeMechanism,planSpikes,toggleRegulator,stop,step,eligibility,get job(){return job;}};
 g.fortificationPack=api;
 g.expansions.register({id:'fortification',title:'Défenses & ateliers',overview,actions,validate:normalize,snapshot:api.snapshot,restore:raw=>{state=normalize(raw,undefined,g.world.cityGeometry202??0);job=null;message='';visualClock=0;visualEvents.clear();},reset:()=>{state=initial();job=null;message='';visualClock=0;visualEvents.clear();}});
 return api;
}
const API={install,initial,normalize};root.DeadwallFortificationPack=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;if(root.DEADWALL&&root.DEADWALL.expansions)install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this);
