/* DEADWALL — habitable fortifications and paid vertical districts.
 * The existing Game remains the only owner of time, resources, enemies and rewards.
 * No procedural preview is permitted to advance this simulation.
 */
(function(root){
 'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalRules175;
 const G=root.DeadwallVerticalGeometry175||(typeof require==='function'?require('./vertical-geometry175.js'):null);
 const copy=x=>JSON.parse(JSON.stringify(x)),M=R.unitsPerMetre,own=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
 const num=(n,a=0,b=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
 const integer=(n,a=0,b=0x7ffffffe)=>Number.isInteger(n)&&n>=a&&n<=b;
 const live=b=>!!b&&!b.dead&&b.health>0;
 const keys=(o,list)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===list.length&&Object.keys(o).every(k=>list.includes(k));
 const baseLevels=type=>Array.from({length:R.supports[type].height/R.supports[type].step},(_,i)=>(i+1)*R.supports[type].step);
 const initial=()=>({version:1,structures:[],actor:null});
 const maxFoundationFloors=tier=>R.foundationLimits.filter(v=>v.tier<=tier).at(-1)?.levels||1;
 function bounds(b){const size=C.BUILDINGS[b.type].size,[w,h]=b.rotation%2?[size[1],size[0]]:size;return{x0:b.gx,y0:b.gy,x1:b.gx+w,y1:b.gy+h};}
 function entry(b){const q=bounds(b),x=(q.x0+q.x1)/2,y=(q.y0+q.y1)/2;
  return b.rotation===1?{x:q.x0-.85,y}:b.rotation===2?{x,y:q.y0-.85}:b.rotation===3?{x:q.x1+.85,y}:{x,y:q.y1+.85};
 }
 function landing(b){const q=bounds(b),e=entry(b);return{x:Math.max(q.x0+1.2,Math.min(q.x1-1.2,e.x)),y:Math.max(q.y0+1.2,Math.min(q.y1-1.2,e.y))};}
 function modulePoint(b,slot){const q=bounds(b),offset=1;return{x:slot%2?q.x1-offset:q.x0+offset,y:slot<2?q.y0+offset:q.y1-offset};}
 function normalize(raw,full){
  const fail=text=>{throw Error('Citadelle verticale : '+text+'.');};
  if(raw===undefined)return initial();
  if(!keys(raw,['version','structures','actor'])||raw.version!==1||!Array.isArray(raw.structures)||raw.structures.length>R.maxSupports)fail('registre invalide');
  const buildings=full?.buildings?new Map(full.buildings.map(b=>[b.id,b])):null;
  const tier=full?.urban?C.Urban.knownTier(full.urban).id:10,ids=new Set();
  const structures=raw.structures.map(s=>{
   if(!keys(s,['id','levels','lift','modules','stress'])||!integer(s.id,1)||ids.has(s.id)||!Array.isArray(s.levels)||!s.levels.length||s.levels.length>R.maxFloors||typeof s.lift!=='boolean'||!num(s.stress,0,R.stressSeconds)||!Array.isArray(s.modules)||s.modules.length>s.levels.length*R.slots)fail('support invalide');
   ids.add(s.id);
   const b=buildings?.get(s.id),r=b&&R.supports[b.type];
   if(buildings&&(!r||b.progress!==1||b.health<=0))fail('support absent ou inachevé');
   if(s.levels.some((v,i)=>!integer(v,1,60)||i&&v<=s.levels[i-1]))fail('niveaux invalides');
   if(r){const expected=r.foundation?Array.from({length:s.levels.length},(_,i)=>(i+1)*r.step):baseLevels(b.type);
    if(JSON.stringify(s.levels)!==JSON.stringify(expected)||r.foundation&&s.levels.length>maxFoundationFloors(tier))fail('étages sans fondations ou âge requis');
   }
   const slots=new Set();
   const modules=s.modules.map(m=>{
    if(!keys(m,['kind','level','slot','ammo','cooldown','heat','locked','mode'])||!own(R.modules,m.kind)||!s.levels.includes(m.level)||!integer(m.slot,0,R.slots-1))fail('équipement inconnu ou sans sol');
    const d=R.modules[m.kind],key=m.level+':'+m.slot;
    if(slots.has(key)||d.tier>tier||!integer(m.ammo,0,d.ammoCapacity||0)||!num(m.cooldown,0,d.fireRate?1/d.fireRate:0)||!num(m.heat,0,R.overheat+(d.heatPerShot||0))||typeof m.locked!=='boolean'||!['auto','hold'].includes(m.mode)||!d.range&&(m.mode!=='hold'||m.locked))fail('état d’équipement invalide');
    if(r?.wall&&d.range&&m.level!==s.levels.at(-1))fail('batterie hors crête');
    slots.add(key);return copy(m);
   });
   // Damage can temporarily overload an existing floor, but a save must never
   // encode a payload that could not fit an intact support in the first place.
   if(r&&(modules.reduce((n,m)=>n+R.modules[m.kind].mass,0)>r.capacity||s.levels.some(l=>modules.filter(m=>m.level===l).reduce((n,m)=>n+R.modules[m.kind].mass,0)>r.floorCapacity)))fail('charge impossible');
   return{id:s.id,levels:[...s.levels],lift:s.lift,modules,stress:s.stress};
  });
  let actor=null;
  if(raw.actor!==null){
   if(!keys(raw.actor,['id','level'])||!integer(raw.actor.id,1)||!integer(raw.actor.level,1,60))fail('position verticale invalide');
   const s=structures.find(s=>s.id===raw.actor.id),b=buildings?.get(raw.actor.id);
   if(!s||!s.levels.includes(raw.actor.level)||full?.player?.dead||b&&!G.contains(bounds(b),full.player.x/M,full.player.y/M))fail('joueur sans sol');
   actor={id:raw.actor.id,level:raw.actor.level};
  }
  return{version:1,structures,actor};
 }
 function install(g){
  if(!g||g.verticalCitadel175)return g?.verticalCitadel175;
  if(!g.expansions?.register)throw Error('Registre d’extensions absent.');
  let state=initial(),world=g.world,revision=0,job=null,travel=null,mounted=null,view='classic',yaw=0,pitch=-.2,message='',scanCursor=0;
  let definitionCache=new WeakMap();const targets=new Map(),flashes=new Map();
  const wrap=(name,fn)=>{const old=g[name]?.bind(g);if(old)g[name]=(...a)=>fn(old,...a);};
  const home=()=>!g.frontier?.active?.();
  const active=()=>g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver;
  const acting=()=>g.expansions.canAct()&&home()&&live(g.player)&&!g.expeditions?.driving?.()&&!g.fieldcraft?.context?.()?.mounted&&!(g.player.reload>0);
  const free=()=>acting()&&!job&&!travel&&!mounted&&!g.expansions.busy('vertical175');
  const support=id=>{const b=g.world.buildings.get(id);return live(b)&&b.completed&&own(R.supports,b.type)?b:null;};
  const row=id=>state.structures.find(s=>s.id===id);
  const height=()=>travel?travel.from+(travel.to-travel.from)*Math.min(1,travel.elapsed/travel.duration):(state.actor?.level||0);
  const playerPoint=()=>({x:g.player.x/M,y:g.player.y/M,z:height()});
  const changed=()=>{revision++;definitionCache=new WeakMap();targets.clear();};
  const notify=(ok,text)=>{message=text;g.notify?.(text,ok?'good':'danger');g.expansionUI?.refresh?.(true);return{ok,reason:ok?'':text,message:text};};
  const reachable=p=>Math.hypot(g.player.x/M-p.x,g.player.y/M-p.y)<=R.reach;
  const atAccess=b=>state.actor?.id===b.id?reachable(landing(b)):!state.actor&&reachable(entry(b))&&g.friendlyPositionClear(g.player,entry(b).x*M,entry(b).y*M);
  const secure=()=>!g.zombies.some(z=>live(z)&&Math.hypot(z.x/M-g.player.x/M,z.y/M-g.player.y/M,height())<R.danger);
  function definition(b,base){
   if(!base?.vertical175||world!==g.world||g.world.buildings.get(b.id)!==b)return base;
   const s=row(b.id);if(!s)return base;
   const cached=definitionCache.get(b);if(cached?.revision===revision)return cached.value;
   const result={...base,powerUse:base.powerUse+(s.lift?R.liftPower:0)};
   for(const m of s.modules){const d=R.modules[m.kind];for(const key of ['housing','storage','powerUse'])result[key]=(result[key]||0)+(d[key]||0);
    for(const key of ['production','consumes'])if(d[key]){result[key]={...result[key]};for(const [r,n]of Object.entries(d[key]))result[key][r]=(result[key][r]||0)+n;}
    if(d.light)result.light=Math.max(result.light||0,d.light);
   }
   definitionCache.set(b,{revision,value:result});return result;
  }
  function leavePost(){mounted=null;view='classic';g.input.mouseDown=false;g.input.touchFire=false;g.releaseInputs?.();return{ok:true};}
  function safeGround(b){
   if(b){const p=entry(b);if(g.friendlyPositionClear(g.player,p.x*M,p.y*M))return{x:p.x*M,y:p.y*M};}
   const c=g.core();return c?g.coreArrivalPosition(g.player,{x:c.x+80,y:c.y}):{x:g.player.x,y:g.player.y};
  }
  function settle(b,fallHeight=0){
   leavePost();travel=null;job=null;state.actor=null;const p=safeGround(b);g.player.x=p.x;g.player.y=p.y;
   if(fallHeight>0)g.damagePlayer(fallHeight*R.fallDamagePerMetre);
  }
  function reconcile(){
   if(world!==g.world){world=g.world;state=initial();job=null;travel=null;leavePost();changed();}
   const missing=state.structures.filter(s=>!support(s.id));
   if(missing.length){if(state.actor&&missing.some(s=>s.id===state.actor.id)||travel&&missing.some(s=>s.id===travel.id))settle(null,height());state.structures=state.structures.filter(s=>support(s.id));changed();}
   for(const b of g.world.buildings.values())if(live(b)&&b.completed&&own(R.supports,b.type)&&!row(b.id)&&state.structures.length<R.maxSupports){state.structures.push({id:b.id,levels:baseLevels(b.type),lift:false,modules:[],stress:0});changed();}
   if(state.actor&&(!live(g.player)||!home()))settle(support(state.actor.id));
   if(mounted&&!getGun(mounted))leavePost();
  }
  function decks(level){return state.structures.filter(s=>s.levels.includes(level)).map(s=>support(s.id)).filter(Boolean).map(b=>({...bounds(b),id:b.id}));}
  function onDeck(x,y,level,radius=g.player.radius/M){
   if(!G.supported(decks(level),x,y,radius))return false;
   for(const s of state.structures){const b=support(s.id);if(!b)continue;for(const m of s.modules){if(m.level!==level)continue;const p=modulePoint(b,m.slot),half=R.modules[m.kind].range?.3:.8;if(Math.abs(x-p.x)<half+radius&&Math.abs(y-p.y)<half+radius)return false;}}
   return true;
  }
  function payload(s){return s.modules.reduce((n,m)=>n+R.modules[m.kind].mass,0);}
  function loadReport(id){const b=support(id),s=row(id);if(!b||!s)return null;const r=R.supports[b.type],ratio=Math.max(R.loadHealthFloor,b.health/b.maxHealth);return{mass:payload(s),capacity:r.capacity*ratio,floorCapacity:r.floorCapacity*ratio,overloaded:payload(s)>r.capacity*ratio||s.levels.some(l=>s.modules.filter(m=>m.level===l).reduce((n,m)=>n+R.modules[m.kind].mass,0)>r.floorCapacity*ratio)};}
  function getGun(ref){const b=support(ref?.id),s=row(ref?.id),m=s?.modules.find(m=>m.level===ref?.level&&m.slot===ref?.slot);return b&&m&&R.modules[m.kind].range?{b,s,m,d:R.modules[m.kind]}:null;}
  function validateWork(kind,id,level,slot,moduleKind){
   const b=support(id),s=row(id);if(!acting()||!b||!s)return{ok:false,reason:'Ouvrage achevé et présence à D-17 requis.'};
   if((kind==='reload'?!reachable(modulePoint(b,slot)):!atAccess(b))||!secure())return{ok:false,reason:'Rejoignez le point de travail de cet étage, hors de portée immédiate des infectés.'};
   if(kind==='raise'){
    if(!R.supports[b.type].foundation||g.tier.id<3||s.levels.length>=maxFoundationFloors(g.tier.id)||b.health/b.maxHealth<R.minRaiseIntegrity)return{ok:false,reason:'Fondation saine et âge supérieur nécessaires pour ajouter un étage.'};
    return{ok:true,cost:R.raiseCost,seconds:R.raiseSeconds,b,s};
   }
   if(kind==='lift')return s.lift?{ok:false,reason:'Ascenseur déjà installé.'}:{ok:true,cost:R.liftCost,seconds:R.liftSeconds,b,s};
   if(kind==='module'){
    const d=own(R.modules,moduleKind)?R.modules[moduleKind]:null;
    if(!d||g.tier.id<d.tier||!s.levels.includes(level)||state.actor?.id!==id||state.actor.level!==level||!integer(slot,0,R.slots-1)||s.modules.some(m=>m.level===level&&m.slot===slot))return{ok:false,reason:'Âge, étage accessible et emplacement libre requis.'};
    if(R.supports[b.type].wall&&d.range&&level!==s.levels.at(-1))return{ok:false,reason:'Les batteries des remparts doivent être installées sur leur crête.'};
    const load=loadReport(id),floorMass=s.modules.filter(m=>m.level===level).reduce((n,m)=>n+R.modules[m.kind].mass,0);
    if(load.mass+d.mass>load.capacity||floorMass+d.mass>load.floorCapacity)return{ok:false,reason:'Charge porteuse insuffisante : réparer ou répartir les équipements.'};
    return{ok:true,cost:d.cost,seconds:d.seconds,b,s,d};
   }
   if(kind==='reload'){
    const gun=getGun({id,level,slot});if(!gun||state.actor?.id!==id||state.actor.level!==level||gun.m.ammo>=gun.d.ammoCapacity)return{ok:false,reason:'Batterie accessible et caisson non plein requis.'};
    return{ok:true,cost:{},seconds:R.reloadSeconds,b,s,gun};
   }
   return{ok:false,reason:'Travail inconnu.'};
  }
  function startWork(kind,id,level=null,slot=null,moduleKind=null){
   if(!free())return notify(false,'Terminez l’action ou quittez le poste en cours.');
   const q=validateWork(kind,id,level,slot,moduleKind);if(!q.ok)return notify(false,q.reason);
   if(!C.canAfford(g.resources,q.cost)||kind==='reload'&&Math.floor(g.player.carry.ammo||0)<1)return notify(false,kind==='reload'?'Transportez des cartouches dans votre sac.':'Matériaux insuffisants dans la réserve de D-17.');
   job={kind,id,level,slot,moduleKind,elapsed:0,seconds:q.seconds,x:g.player.x,y:g.player.y,health:g.player.health};g.releaseInputs?.();return notify(true,'Travail engagé. Le paiement aura lieu uniquement après achèvement et revalidation.');
  }
  function stopWork(){job=null;return notify(true,'Travail interrompu, aucun matériau prélevé.');}
  function advanceWork(dt){
   if(!job)return;const j=job,q=validateWork(j.kind,j.id,j.level,j.slot,j.moduleKind);
   if(!q.ok||g.player.health<j.health||Math.hypot(g.player.x-j.x,g.player.y-j.y)>R.workMoveTolerance*M||g.player.reload>0||g.input.mouseDown){job=null;message='Travail interrompu : contexte changé.';return;}
   j.elapsed=Math.min(j.seconds,j.elapsed+dt);g.player.action='build';if(j.elapsed<j.seconds)return;
   // Revalidate once more at the only commit point. No charge on preview/cancel.
   if(!C.canAfford(g.resources,q.cost)){job=null;message='Matériaux devenus insuffisants.';return;}
   if(j.kind==='reload'){
    const n=Math.min(q.gun.d.ammoCapacity-q.gun.m.ammo,Math.floor(g.player.carry.ammo||0));if(n<1){job=null;message='Aucune cartouche transportée.';return;}
    g.player.carry.ammo-=n;q.gun.m.ammo+=n;
   }else{
    C.spend(g.resources,q.cost);
    if(j.kind==='raise')q.s.levels.push(q.s.levels.at(-1)+R.supports[q.b.type].step);
    if(j.kind==='lift')q.s.lift=true;
    if(j.kind==='module')q.s.modules.push({kind:j.moduleKind,level:j.level,slot:j.slot,ammo:0,cooldown:0,heat:0,locked:false,mode:q.d.range?'auto':'hold'});
   }
   job=null;changed();g.refreshMetrics(true);g.audio.build?.();notify(true,'Travaux achevés. Les capacités et la demande électrique ont été recalculées.');
  }
  function travelTo(id,to,mode='stairs'){
   const b=support(id),s=row(id);if(!free()||!b||!s||!integer(to,0,60)||to!==0&&!s.levels.includes(to)||!['stairs','lift'].includes(mode))return notify(false,'Trajet indisponible.');
   const from=state.actor?.level||0;if(from===to||state.actor&&state.actor.id!==id||!atAccess(b))return notify(false,'Rejoignez l’accès intérieur de cet ouvrage, au niveau actuel.');
   if(mode==='lift'&&(!s.lift||!b.powered))return notify(false,'Ascenseur installé et alimentation complète requis. Les escaliers restent indépendants du courant.');
   const start={x:g.player.x,y:g.player.y},p=to===0?entry(b):landing(b),end={x:p.x*M,y:p.y*M};
   if(to===0&&!g.friendlyPositionClear(g.player,end.x,end.y))return notify(false,'Sortie occupée : dégagez le palier au sol.');
   const speed=mode==='lift'?R.liftSpeed:R.stairsSpeed;
   travel={id,from,to,mode,start,end,elapsed:0,duration:Math.abs(to-from)/speed+(mode==='lift'?R.liftBoardSeconds:0),direction:1,health:g.player.health};
   g.releaseInputs?.();return notify(true,(mode==='lift'?'Ascenseur':'Escalier intérieur')+' : trajet vers '+to+' m.');
  }
  function cancelTravel(){if(!travel)return{ok:false};travel.direction=-1;return notify(true,'Retour au palier de départ. Une cabine sans courant reste immobilisée.');}
  function advanceTravel(dt){
   if(!travel)return;const t=travel,b=support(t.id);
   if(!b){settle(null,height());return;}
   if(t.mode==='lift'&&!b.powered){message='Ascenseur immobilisé : rétablissez son alimentation.';return;}
   if(g.player.health<t.health)t.direction=-1;
   const next=Math.max(0,Math.min(t.duration,t.elapsed+dt*t.direction)),p=next/t.duration;
   if(p===1&&t.to===0&&!g.friendlyPositionClear(g.player,t.end.x,t.end.y)){message='Sortie occupée. La cabine attend au palier.';return;}
   t.elapsed=next;g.player.x=t.start.x+(t.end.x-t.start.x)*p;g.player.y=t.start.y+(t.end.y-t.start.y)*p;
   if(t.direction>0&&p===1||t.direction<0&&p===0){const level=t.direction>0?t.to:t.from;state.actor=level?{id:t.id,level}:null;travel=null;message='Palier '+level+' m atteint.';g.expansionUI?.refresh?.(true);}
  }
  function mount(id,level,slot){
   const gun=getGun({id,level,slot});if(!free()||!gun||state.actor?.id!==id||state.actor.level!==level||!reachable(modulePoint(gun.b,slot)))return notify(false,'Approchez physiquement de la batterie sur son étage.');
   mounted={id,level,slot};yaw=g.player.facing||0;pitch=-.2;view='classic';g.releaseInputs?.();return notify(true,'Poste occupé. Clic pour tirer ; V pour alterner entre les deux vues.');
  }
  function switchView(){if(!mounted||!acting())return{ok:false};view=view==='fps'?'classic':'fps';g.input.mouseDown=false;return{ok:true,view};}
  function setAim(nextYaw,nextPitch){if(!mounted||!num(nextYaw,-1e6,1e6)||!num(nextPitch,R.minPitch,R.maxPitch))return false;yaw=Math.atan2(Math.sin(nextYaw),Math.cos(nextYaw));pitch=nextPitch;return true;}
  function setMode(id,level,slot,mode){const gun=getGun({id,level,slot});if(!acting()||!gun||!['auto','hold'].includes(mode))return{ok:false};gun.m.mode=mode;return{ok:true};}
  function scene(){
   const boxes=[],box=(id,x0,y0,z0,x1,y1,z1,kind,color,extra={})=>boxes.push({id,x0,y0,z0,x1,y1,z1,kind,color,...extra});
   box('ground',0,0,-.3,C.WORLD_SIZE/M,C.WORLD_SIZE/M,0,'ground','#424e3c');
   for(const b of g.world.buildings.values()){
    if(!live(b))continue;const q=bounds(b),s=row(b.id),r=R.supports[b.type];
    if(!r||!b.completed||!s){
     if(b.def.gate&&b.gateMode==='open')continue;
     box('building:'+b.id,q.x0,q.y0,0,q.x1,q.y1,r?r.height*Math.max(.05,b.progress):b.def.wall?2.5:4,'structure',b.def.color||'#5a655e',{owner:b.id});continue;
    }
    const top=s.levels.at(-1),w=R.wallThickness;
    if(r.foundation){for(const x of [q.x0,q.x1-.65])for(const y of [q.y0,q.y1-.65])box('pillar:'+b.id+':'+x+':'+y,x,y,0,x+.65,y+.65,top,'structure','#777d70',{owner:b.id});}
    else{
     box('west:'+b.id,q.x0,q.y0,0,q.x0+w,q.y1,top,'structure','#6b746b',{owner:b.id});
     box('east:'+b.id,q.x1-w,q.y0,0,q.x1,q.y1,top,'structure','#70796e',{owner:b.id});
     if(!r.gate||b.gateMode!=='open'){
      box('north:'+b.id,q.x0,q.y0,0,q.x1,q.y0+w,top,'structure','#7a8176',{owner:b.id});
      box('south:'+b.id,q.x0,q.y1-w,0,q.x1,q.y1,top,'structure','#7a8176',{owner:b.id});
     }else{
      // An open gate is not a transparent wall: two jambs and the lintel remain.
      for(const y of [q.y0,q.y1-w]){
       box('gateL:'+b.id+':'+y,q.x0,y,0,q.x0+1.2,y+w,top,'structure','#72796b',{owner:b.id});
       box('gateR:'+b.id+':'+y,q.x1-1.2,y,0,q.x1,y+w,top,'structure','#72796b',{owner:b.id});
       box('gateTop:'+b.id+':'+y,q.x0+1.2,y,4,q.x1-1.2,y+w,top,'structure','#72796b',{owner:b.id});
      }
     }
    }
    for(const level of s.levels){
     box('slab:'+b.id+':'+level,q.x0,q.y0,level-R.slabThickness,q.x1,q.y1,level,'slab','#939a87',{owner:b.id});
     for(const m of s.modules.filter(m=>m.level===level)){
      const d=R.modules[m.kind],p=modulePoint(b,m.slot),h=d.range?1.05:m.kind==='searchlight'?2.4:2.6,half=d.range?.3:.8;
      box('module:'+b.id+':'+level+':'+m.slot,p.x-half,p.y-half,level,p.x+half,p.y+half,level+h,'equipment',d.color,{owner:b.id,moduleLevel:level,moduleSlot:m.slot});
     }
    }
   }
   if(g.exploration125?.generation===4){
    const physical=root.DeadwallExploration125?.physicalSolids134?.(g.exploration125.plan)||g.exploration125.plan?.solids||[];
    for(const [index,p]of physical.entries())if([p.x,p.y,p.w,p.h].every(Number.isFinite))box('terrain:'+index,p.x/M,p.y/M,0,(p.x+p.w)/M,(p.y+p.h)/M,['house','settlement-building','station-wall'].includes(p.kind)?4:2,'structure','#697265');
   }
   for(const z of g.zombies)if(live(z)){
    const h=C.ENEMIES[z.kind].height||(z.kind==='crawler'?.6:R.bodyHeight),x=z.x/M,y=z.y/M,r=z.radius/M;
    box('zombie:'+z.id,x-r,y-r,0,x+r,y+r,h,'zombie',C.ENEMIES[z.kind].color,{zombie:z});
   }
   // Never drop blockers to meet a rendering budget: combat reads the complete
   // geometry. Visual culling is a separate, read-only consumer.
   return boxes;
  }
  function gunOrigin(gun){const p=modulePoint(gun.b,gun.m.slot);return{x:p.x,y:p.y,z:gun.m.level+R.eyeHeight};}
  function gunSkip(gun,b){return b.kind==='equipment'&&b.owner===gun.b.id&&b.moduleLevel===gun.m.level&&b.moduleSlot===gun.m.slot;}
  function rayShot(gun,ray,boxes){
   if(!active()||!home()||!gun||!gun.b.powered||gun.b.siegeOffline||gun.b.territoryOffline||gun.m.ammo<1||gun.m.cooldown>0||gun.m.locked||!ray)return false;
   gun.m.ammo--;gun.m.cooldown=1/gun.d.fireRate;gun.m.heat+=gun.d.heatPerShot;if(gun.m.heat>=R.overheat)gun.m.locked=true;
   const hit=G.firstHit(gunOrigin(gun),ray,boxes,gun.d.range,b=>gunSkip(gun,b));
   g.stats.shots++;g.audio.shot('rifle');flashes.set(gun.b.id+':'+gun.m.level+':'+gun.m.slot,{until:g.elapsed+.09,point:hit?.point||null});
   if(hit?.box.zombie){const z=hit.box.zombie;z.health-=g.zombieBulletDamage(z,gun.d.damage,{x:gunOrigin(gun).x*M,y:gunOrigin(gun).y*M});g.audio.hit?.();z.stagger=Math.max(z.stagger||0,.08);if(z.health<=0)g.killZombie(z,false);}
   return true;
  }
  function fireMounted(){
   const gun=getGun(mounted);if(!gun)return false;let ray;
   if(view==='fps')ray=G.direction(yaw,pitch);
   else{const origin=gunOrigin(gun),target={x:g.input.mouseWorldX/M,y:g.input.mouseWorldY/M,z:R.bodyHeight*.55};ray=G.lookAt(origin,target);if(ray){yaw=Math.atan2(ray.y,ray.x);pitch=Math.max(R.minPitch,Math.min(R.maxPitch,Math.asin(ray.z)));ray=G.direction(yaw,pitch);}}
   return rayShot(gun,ray,scene());
  }
  function advanceGuns(dt){
   const guns=[];for(const s of state.structures){const b=support(s.id);if(!b)continue;for(const m of s.modules){const d=R.modules[m.kind];if(!d.range)continue;
    m.cooldown=Math.max(0,m.cooldown-dt);m.heat=Math.max(0,m.heat-R.gunCooling*dt);if(m.heat<=R.resetHeat)m.locked=false;
    guns.push({b,s,m,d});
   }}
   if(mounted&&(g.input.mouseDown||g.input.touchFire))fireMounted();
   let scans=0,shots=0,boxes=null;
   for(let i=0;i<guns.length&&scans<R.maxScansPerStep&&shots<R.maxShotsPerStep;i++){
    const gun=guns[(scanCursor+i)%guns.length],m=gun.m,key=gun.b.id+':'+m.level+':'+m.slot;
    if(mounted?.id===gun.b.id&&mounted.level===m.level&&mounted.slot===m.slot||m.mode!=='auto'||m.cooldown>0||m.ammo<1||m.locked||!gun.b.powered)continue;
    let target=targets.get(key),origin=gunOrigin(gun);
    if(!target||target.next<=g.elapsed||!live(target.z)){
     scans++;const candidates=g.zombies.filter(z=>live(z)&&Math.hypot(z.x/M-origin.x,z.y/M-origin.y,origin.z)<gun.d.range).sort((a,b)=>Math.hypot(a.x/M-origin.x,a.y/M-origin.y)-Math.hypot(b.x/M-origin.x,b.y/M-origin.y));
     let chosen=null;boxes??=scene();
     for(const z of candidates.slice(0,24)){const ray=G.lookAt(origin,{x:z.x/M,y:z.y/M,z:(C.ENEMIES[z.kind].height||(z.kind==='crawler'?.6:R.bodyHeight))*.55});if(!ray||Math.asin(ray.z)<R.minPitch)continue;const hit=G.firstHit(origin,ray,boxes,gun.d.range,b=>gunSkip(gun,b));if(hit?.box.zombie===z){chosen=z;break;}}
     target={z:chosen,next:g.elapsed+R.scanSeconds};targets.set(key,target);
    }
    if(live(target.z)){boxes??=scene();const ray=G.lookAt(origin,{x:target.z.x/M,y:target.z.y/M,z:(C.ENEMIES[target.z.kind].height||(target.z.kind==='crawler'?.6:R.bodyHeight))*.55});if(rayShot(gun,ray,boxes))shots++;}
   }
   if(guns.length)scanCursor=(scanCursor+Math.max(1,scans))%guns.length;
  }
  function collapseTop(s,b){
   const r=R.supports[b.type],ratio=Math.max(R.loadHealthFloor,b.health/b.maxHealth);
   const overloaded=s.levels.filter(l=>s.modules.filter(m=>m.level===l).reduce((n,m)=>n+R.modules[m.kind].mass,0)>r.floorCapacity*ratio);
   // A vacant rooftop must not absorb every collapse while a lower floor stays
   // overloaded forever. Foundations lose all dependent upper slabs; a hollow
   // wall retains its load-bearing shell and sheds the affected installations.
   const level=overloaded.at(-1)||s.modules.reduce((h,m)=>Math.max(h,m.level),s.levels[0]);
   s.modules=s.modules.filter(m=>r.foundation?m.level<level:m.level!==level);
   if(r.foundation&&s.levels.length>1)s.levels=s.levels.filter((h,i)=>i===0||h<level);
   if(state.actor?.id===b.id&&state.actor.level>=level||travel?.id===b.id||mounted?.id===b.id){
    const from=height(),lower=s.levels.filter(h=>h<level).at(-1)||0;leavePost();job=null;travel=null;
    if(lower){const p=landing(b);g.player.x=p.x*M;g.player.y=p.y*M;state.actor={id:b.id,level:lower};g.damagePlayer((from-lower)*R.fallDamagePerMetre);}
    else settle(b,from);
   }
   s.stress=0;changed();g.refreshMetrics(true);notify(false,'Surcharge : le niveau supérieur a perdu ses installations. Aucun remboursement automatique.');
  }
  function step(dt){
   if(!active()||!num(dt,Number.MIN_VALUE,R.maxStep))return;
   reconcile();if(!home())return;
   advanceTravel(dt);advanceWork(dt);advanceGuns(dt);
   for(const s of state.structures){const b=support(s.id),load=loadReport(s.id);if(!b||!load)continue;s.stress=load.overloaded?Math.min(R.stressSeconds,s.stress+dt):Math.max(0,s.stress-dt);
    if(s.stress>=R.stressSeconds)collapseTop(s,b);
   }
   for(const[key,f]of flashes)if(f.until<g.elapsed)flashes.delete(key);
  }
  function target(){
   if(state.actor)return support(state.actor.id);
   if(support(g.selectedBuilding?.id))return support(g.selectedBuilding.id);
   return state.structures.map(s=>support(s.id)).find(b=>b&&reachable(entry(b)))||null;
  }
  function overview(){
   const b=target(),s=b&&row(b.id),load=b&&loadReport(b.id),count=state.structures.reduce((n,s)=>n+s.modules.length,0),pending=Object.values(g.pendingSpawns||{}).reduce((a,b)=>a+b,0)+(g.spawnQueue?.length||0);
   return{summary:'Construire des ouvrages porteurs, rejoindre leurs étages puis y financer des équipements. Le terrain et les vagues restent ceux de la campagne.',
    rows:[{label:'Altitude du commandant',value:height().toFixed(1)+' m'},{label:'Ouvrages / équipements',value:state.structures.length+' / '+count},{label:'Support choisi',value:b?.def.name||'Approchez d’un accès ou sélectionnez un ouvrage'},{label:'Niveaux achevés',value:s?s.levels.join(' / ')+' m':'—'},{label:'Charge / capacité actuelle',value:load?load.mass+' / '+Math.floor(load.capacity)+' unités':'—'},{label:'Infectés actifs / en attente',value:g.zombies.filter(live).length+' / '+pending},{label:'Dernière action',value:message||'Aucune'}],
    ...(job?{task:{name:'Travaux de citadelle',progress:job.elapsed/job.seconds}}:travel?{task:{name:travel.mode==='lift'?'Ascenseur intérieur':'Escalier intérieur',progress:travel.elapsed/travel.duration}}:{})};
  }
  function actions(){
   const result=[],b=target(),s=b&&row(b.id),push=(id,label,run,enabled=true,description='',close=false)=>result.push({id,label,run,disabled:!enabled,description,reason:enabled?'':'Rejoignez le bon palier, vérifiez les ressources et terminez l’action en cours.',close});
   if(mounted){push('view','Alterner classique / FPS 3D',switchView,true,'Les deux vues tirent sur les mêmes infectés, avec le même stock.',true);push('unmount','Quitter la batterie',leavePost,true,'Retour au commandant sur le même étage.',true);return result;}
   if(travel){push('return','Revenir au palier de départ',cancelTravel,true,'Le retour prend du temps ; l’ascenseur exige toujours du courant.',true);return result;}
   if(job){push('stop','Interrompre le chantier',stopWork,true,'Aucun paiement pour un travail inachevé.',true);return result;}
   if(!state.actor)for(const[id,r]of Object.entries(R.supports))push('build:'+id,r.name,()=>{if(!free()||g.tier.id<r.tier)return{ok:false};g.selectBuild(id);return{ok:true};},free()&&g.tier.id>=r.tier,'Âge '+C.CITY_TIERS[r.tier].name+' · '+Object.entries(r.cost).map(([k,v])=>v+' '+C.RESOURCE_META[k].label.toLowerCase()).join(', '),true);
   if(!b||!s)return result;
   for(const level of [0,...s.levels])if(level!==(state.actor?.level||0)){
    push('stairs:'+level,'Escalier → '+level+' m',()=>travelTo(b.id,level,'stairs'),free()&&atAccess(b),'Accès intérieur, indépendant de l’électricité.',true);
    if(s.lift)push('lift:'+level,'Ascenseur → '+level+' m',()=>travelTo(b.id,level,'lift'),free()&&atAccess(b)&&b.powered,'Alimentation complète nécessaire pendant tout le trajet.',true);
   }
   if(!s.lift)push('install-lift','Installer un ascenseur intérieur',()=>startWork('lift',b.id),free()&&atAccess(b),'Consomme des matériaux ; augmente la demande électrique de '+R.liftPower+'.',true);
   if(R.supports[b.type].foundation)push('raise','Construire le prochain étage · +6 m',()=>startWork('raise',b.id),free()&&atAccess(b)&&s.levels.length<maxFoundationFloors(g.tier.id),'Ajoute une plateforme au-dessus, sans téléporter ni soulever les bâtiments existants.',true);
   if(state.actor?.id===b.id){const level=state.actor.level;
    for(let slot=0;slot<R.slots;slot++){
     const m=s.modules.find(m=>m.level===level&&m.slot===slot);
     if(!m){for(const[k,d]of Object.entries(R.modules))push('module:'+slot+':'+k,'Emplacement '+(slot+1)+' · '+d.name,()=>startWork('module',b.id,level,slot,k),free()&&atAccess(b)&&g.tier.id>=d.tier,'Charge '+d.mass+' · '+d.seconds+' s · coûts prélevés à l’achèvement.',true);}
     else if(R.modules[m.kind].range){
      push('mount:'+slot,'Prendre la batterie '+(slot+1),()=>mount(b.id,level,slot),free()&&reachable(modulePoint(b,slot)),m.ammo+' cartouches · '+m.mode,true);
      push('reload:'+slot,'Ravitailler la batterie '+(slot+1)+' depuis le sac',()=>startWork('reload',b.id,level,slot),free()&&reachable(modulePoint(b,slot)),'Cartouches transportées uniquement ; aucun chargeur gratuit.',true);
      push('mode:'+slot,m.mode==='auto'?'Suspendre le tir automatique '+(slot+1):'Autoriser le tir automatique '+(slot+1),()=>setMode(b.id,level,slot,m.mode==='auto'?'hold':'auto'),acting());
     }
    }
   }
   return result;
  }
  function drawSupport(ctx,b){
   const s=row(b.id);if(!s||!b.completed)return;
   const q=bounds(b),inside=state.actor?.id===b.id||travel?.id===b.id,level=inside?(state.actor?.level||travel?.to||0):s.levels.at(-1),offset=inside?0:level*M*.18,l=q.x0*M,t=q.y0*M,w=(q.x1-q.x0)*M,h=(q.y1-q.y0)*M;
   ctx.save();ctx.fillStyle='#555e58';ctx.beginPath();ctx.moveTo(l,t+h);ctx.lineTo(l+w,t+h);ctx.lineTo(l+w,t+h-offset);ctx.lineTo(l,t+h-offset);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#89927e';ctx.lineWidth=2;for(const floor of s.levels){const y=t+h-floor*M*.18;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(l+w,y);ctx.stroke();}
   ctx.fillStyle=inside?'#777f6c':'#939b87';ctx.fillRect(l,t-offset,w,h);ctx.strokeStyle='#c6c8a8';ctx.lineWidth=5;ctx.strokeRect(l+3,t-offset+3,w-6,h-6);
   const a=landing(b);ctx.fillStyle='#394b43';ctx.fillRect(a.x*M-15,a.y*M-offset-20,30,40);ctx.strokeStyle='#d3c18f';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(a.x*M-12,a.y*M-offset-16+i*8);ctx.lineTo(a.x*M+12,a.y*M-offset-16+i*8);ctx.stroke();}
   if(s.lift){ctx.fillStyle=b.powered?'#c8b773':'#71584d';ctx.fillRect(a.x*M+22,a.y*M-offset-15,18,30);}
   for(const m of s.modules.filter(m=>m.level===level)){const p=modulePoint(b,m.slot),d=R.modules[m.kind];ctx.fillStyle=d.color;ctx.fillRect(p.x*M-16,p.y*M-offset-16,32,32);if(d.range){ctx.strokeStyle='#263b35';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(p.x*M,p.y*M-offset);const angle=mounted?.id===b.id&&mounted.slot===m.slot?yaw:-Math.PI/2;ctx.lineTo(p.x*M+Math.cos(angle)*35,p.y*M-offset+Math.sin(angle)*35);ctx.stroke();}ctx.fillStyle='#f0e6c5';ctx.font='12px sans-serif';ctx.fillText(String(m.slot+1),p.x*M-4,p.y*M-offset+4);}
   const e=entry(b);ctx.fillStyle='#dac384';ctx.beginPath();ctx.arc(e.x*M,e.y*M,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e5e9d4';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText((inside?'NIVEAU ':'CRÊTE ')+level+' m',l+w/2,t-offset+23);ctx.fillText('E · ACCÈS INTÉRIEUR',e.x*M,e.y*M+25);
   ctx.restore();
  }
  wrap('prepareWave',(old,...a)=>{
   const result=old(...a),plan=g.wavePlan;if(!plan||!home()||g.wave%3!==0)return result;
   const eligible=Object.values(C.VerticalColossi175).filter(d=>g.tier.id>=d.tier&&g.wave>=d.unlockWave),profile=eligible.at(-1);
   if(profile){const n=Math.min(plan.composition.walker||0,3,1+Math.floor((g.wave-profile.unlockWave)/12));plan.composition.walker-=n;plan.composition[profile.id]=(plan.composition[profile.id]||0)+n;}
   return result;
  });
  wrap('spawnZombie',(old,kind,...a)=>{
   const result=old(kind,...a);if(result&&C.ENEMIES[kind]?.giant175){const z=g.zombies.at(-1),margin=z.radius+4;z.x=Math.max(margin,Math.min(C.WORLD_SIZE-margin,z.x));z.y=Math.max(margin,Math.min(C.WORLD_SIZE-margin,z.y));z.lastX=z.x;z.lastY=z.y;}
   return result;
  });
  wrap('drawZombie',(old,ctx,z,...a)=>{
   const d=C.ENEMIES[z.kind];if(!d?.giant175)return old(ctx,z,...a);
   ctx.save();ctx.translate(z.x,z.y);ctx.rotate(z.facing);const r=z.radius,stride=g.settings.reducedMotion?0:Math.sin(g.elapsed*2+z.id)*r*.12;
   ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(0,r*.25,r*1.3,r*.9,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#463e35';ctx.lineWidth=r*.3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.3,-r*.25);ctx.lineTo(-r*1.1,-r*.6+stride);ctx.moveTo(-r*.3,r*.25);ctx.lineTo(-r*1.1,r*.6-stride);ctx.stroke();
   ctx.fillStyle=d.color;ctx.beginPath();ctx.ellipse(0,0,r*.95,r*.75,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#958774';ctx.lineWidth=r*.24;ctx.beginPath();ctx.moveTo(r*.2,-r*.55);ctx.lineTo(r*.9,-r*1.1);ctx.moveTo(r*.2,r*.55);ctx.lineTo(r*.9,r*1.1);ctx.stroke();ctx.fillStyle='#aca18b';ctx.beginPath();ctx.arc(r*.85,0,r*.4,0,Math.PI*2);ctx.fill();ctx.rotate(-z.facing);
   ctx.fillStyle='#241f1b';ctx.fillRect(-r,-r-17,r*2,5);ctx.fillStyle='#c48561';ctx.fillRect(-r,-r-17,r*2*Math.max(0,z.health/z.maxHealth),5);ctx.fillStyle='#ddd2b9';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(d.height+' m · '+d.name,0,-r-25);ctx.restore();
  });
  wrap('completeBuilding',(old,b,...a)=>{const result=old(b,...a);reconcile();return result;});
  wrap('destroyBuilding',(old,b,...a)=>{const relevant=state.actor?.id===b.id||travel?.id===b.id,fall=height();if(relevant)settle(b,0);const result=old(b,...a);reconcile();if(relevant)g.damagePlayer(fall*R.fallDamagePerMetre);return result;});
  wrap('update',(old,dt,...a)=>{const running=active(),result=old(dt,...a);if(running)step(dt);return result;});
  wrap('updatePlayer',(old,dt,...a)=>{
   if(!home()||!live(g.player))return old(dt,...a);
   if(travel||mounted){g.player.vx=g.player.vy=0;g.player.invulnerable=Math.max(0,g.player.invulnerable-dt);
    if(mounted&&view==='fps'){const k=g.input.keys;setAim(yaw+((k.has('ArrowRight')?1:0)-(k.has('ArrowLeft')?1:0))*R.yawSpeed*dt,Math.max(R.minPitch,Math.min(R.maxPitch,pitch+((k.has('ArrowUp')?1:0)-(k.has('ArrowDown')?1:0))*R.pitchSpeed*dt)));}
    return;
   }
   return old(dt,...a);
  });
  wrap('moveFriendly',(old,entity,dx,dy,...a)=>{
   if(entity!==g.player||!state.actor||!home())return old(entity,dx,dy,...a);
   if(travel||mounted)return;
   if(!num(dx,-C.WORLD_SIZE,C.WORLD_SIZE)||!num(dy,-C.WORLD_SIZE,C.WORLD_SIZE))return;
   // Swept short steps prevent jumping off one deck and landing on an unrelated
   // distant one when a caller supplies a large delta.
   const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/(M*.25)));
   for(let i=0;i<steps;i++){
    const nx=entity.x+dx/steps,ny=entity.y+dy/steps;
    if(onDeck(nx/M,entity.y/M,state.actor.level))entity.x=nx;
    if(onDeck(entity.x/M,ny/M,state.actor.level))entity.y=ny;
   }
   const owner=decks(state.actor.level).find(r=>G.contains(r,entity.x/M,entity.y/M));if(owner)state.actor.id=owner.id;
  });
  wrap('workerCanWorkAt',(old,worker,target,...a)=>{if(home()&&(worker===g.player||target===g.player)&&height()>0)return false;return old(worker,target,...a);});
  wrap('updateInteraction',(old,...a)=>{if(state.actor||travel||mounted){g.interactionText='E : accès et équipements de cet étage. Aucune interaction avec le sol inférieur.';return;}return old(...a);});
  // Hand weapons retain their authoritative inventory, cooldown and arsenal
  // hooks; only the projectile geometry changes when fired from an upper floor.
  wrap('shootPlayer',(old,...a)=>{
   if(!state.actor&&!travel&&!mounted)return old(...a);
   if(travel||mounted||job||!active()||!live(g.player))return;
   const p=g.player,w=g.arsenal134?.weaponSpec()||C.WEAPONS[p.weapon];if(p.reload>0||p.shootCooldown>0||!w)return;
   if(g.arsenal134&&!g.arsenal134.beforeShot())return;if(p.magazine[p.weapon]<=0){g.startReload();return;}
   p.magazine[p.weapon]--;g.arsenal134?.afterShot();p.shootCooldown=1/w.fireRate;g.stats.shots++;g.audio.shot(p.weapon);
   const origin={x:p.x/M,y:p.y/M,z:height()+R.eyeHeight},base=G.lookAt(origin,{x:g.input.mouseWorldX/M,y:g.input.mouseWorldY/M,z:R.bodyHeight*.55});if(!base)return;
   const boxes=scene(),baseYaw=Math.atan2(base.y,base.x),aimPitch=Math.asin(base.z);
   for(let i=0;i<w.pellets;i++){const ray=G.direction(baseYaw+g.random.range(-w.spread,w.spread),aimPitch),hit=G.firstHit(origin,ray,boxes,w.range/M);
    if(hit?.box.zombie){const z=hit.box.zombie,head=g.random.chance(w.headshotChance||0),damage=w.damage*(head?w.headshotMultiplier:1);if(head)g.stats.headshots++;z.health-=g.zombieBulletDamage(z,damage,{x:p.x,y:p.y});z.stagger=Math.max(z.stagger||0,.08);g.audio.hit?.();if(z.health<=0)g.killZombie(z,head);}
   }
   if(p.magazine[p.weapon]<=0)g.startReload();
  });
  wrap('melee',(old,...a)=>{if(state.actor||travel||mounted)return false;return old(...a);});
  wrap('hostileLineClear',(old,from,to,...a)=>{if(to===g.player&&height()>R.bodyHeight&&home()){
   const d=C.ENEMIES[from?.kind];if(!d?.giant175||d.height<height()+.8)return false;
   const origin={x:from.x/M,y:from.y/M,z:d.height*.9},target={x:to.x/M,y:to.y/M,z:height()+R.eyeHeight},ray=G.lookAt(origin,target),distance=Math.hypot(target.x-origin.x,target.y-origin.y,target.z-origin.z);
   return !!ray&&!G.firstHit(origin,ray,scene(),distance,b=>b.zombie===from);
  }return old(from,to,...a);});
  wrap('zombieCanClimb',(old,z,b,...a)=>b?.def.vertical175?Boolean(R.supports[b.type].wall&&b.corpseLoad>R.supports[b.type].height*R.corpseUnitsPerMetre+(z.id%18)&&['runner','crawler'].includes(z.kind)):old(z,b,...a));
  wrap('placeOne',(old,type,...a)=>{if(state.actor||travel||mounted)return false;if(own(R.supports,type)&&[...g.world.buildings.values()].filter(b=>live(b)&&own(R.supports,b.type)).length>=R.maxSupports)return false;return old(type,...a);});
  wrap('drawBuilding',(old,ctx,b,...a)=>{const result=old(ctx,b,...a);if(own(R.supports,b.type))drawSupport(ctx,b);return result;});
  wrap('render',(old,...a)=>{
   const gun=getGun(mounted);if(view!=='fps'||!gun||!home()||g.state!=='playing')return old(...a);
   const camera={...gunOrigin(gun),yaw,pitch};g.ctx.setTransform(g.dpr,0,0,g.dpr,0,0);G.draw(g.ctx,g.width,g.height,camera,scene(),R,{name:gun.d.name,ammo:gun.m.ammo,heat:gun.m.heat,powered:gun.b.powered,hot:gun.m.locked});
  });
  wrap('serialize',(old,...a)=>{
   const result=old(...a);
   if(travel){result.player={...result.player,x:travel.start.x,y:travel.start.y};}
   return result;
  });
  // Capture the controls only while this owner has the relevant context.
  // Escape exits a station first; it does not leave an invisible firing input.
  root.addEventListener?.('keydown',event=>{
   if(!active()||!home()||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName||''))return;
   if(event.repeat)return;
   if(event.code==='KeyV'&&mounted){switchView();event.preventDefault();event.stopImmediatePropagation();}
   else if(event.code==='Escape'&&(mounted||travel||job)){if(mounted)leavePost();else if(travel)cancelTravel();else stopWork();event.preventDefault();event.stopImmediatePropagation();}
   else if(event.code==='KeyE'&&!job&&!travel&&!mounted&&target()){
    const b=target(),s=row(b.id),near=state.actor&&s.modules.find(m=>m.level===state.actor.level&&R.modules[m.kind].range&&reachable(modulePoint(b,m.slot)));
    if(near)mount(b.id,near.level,near.slot);else g.expansionUI?.open?.('vertical175');event.preventDefault();event.stopImmediatePropagation();
   }
  },true);
  g.canvas?.addEventListener?.('pointermove',event=>{if(view!=='fps'||!mounted||!active()||event.pointerType==='touch'&&!event.buttons)return;const dx=Number(event.movementX)||0,dy=Number(event.movementY)||0;setAim(yaw+dx*.003,Math.max(R.minPitch,Math.min(R.maxPitch,pitch-dy*.003)));});
  const api={version:'0.1.0',definition,height,overview,actions,scene,step,reconcile,entry:id=>{const b=support(id);return b?entry(b):null;},landing:id=>{const b=support(id);return b?landing(b):null;},modulePoint:(id,slot)=>{const b=support(id);return b?modulePoint(b,slot):null;},onDeck,loadReport,startWork,stopWork,travelTo,cancelTravel,mount,leavePost,switchView,setAim,setMode,fireMounted,
   busy:()=>Boolean(state.actor||job||travel||mounted),snapshot:()=>copy(state),get view(){return view;},get mounted(){return mounted&&{...mounted};},get job(){return job&&{...job};},get travel(){return travel&&copy(travel);}};
  g.verticalCitadel175=api;
  g.expansions.register({id:'vertical175',title:'Citadelle verticale',overview,actions,busy:api.busy,validate:normalize,snapshot:api.snapshot,
   reset:()=>{state=initial();world=g.world;job=null;travel=null;leavePost();changed();},
   restore:raw=>{state=normalize(raw);world=g.world;job=null;travel=null;leavePost();changed();reconcile();g.refreshMetrics(true);}});
  reconcile();return api;
 }
 const api={initial,normalize,bounds,entry,landing,modulePoint,install,maxFoundationFloors};root.DeadwallVerticalCitadel175=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
