/* Night equipment shares the essential belt and both spatial domains. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.NightGearRules;
const kinds=Object.keys(R.types),copy=v=>JSON.parse(JSON.stringify(v));
const initial=()=>({version:1,serial:1,devices:[]});
const validationWorlds=new Map();
function validationWorld(W,seed,generation){
 const key=seed+':'+generation;let world=validationWorlds.get(key);
 if(world)validationWorlds.delete(key);else world=W.create(seed,generation);
 validationWorlds.set(key,world);
 if(validationWorlds.size>3)validationWorlds.delete(validationWorlds.keys().next().value);
 return world;
}
function normalize(raw,data){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Registre d’éclairage nocturne invalide.');};
 const number=(v,min,max,int=false)=>{if(!Number.isFinite(v)||v<min||v>max||int&&!Number.isInteger(v))bad();return v;};
 if(!raw||raw.version!==1||!Array.isArray(raw.devices)||raw.devices.length>R.maxDevices)bad();
 let regionalWorld=null;
 const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null),regionSize=W.sizeForGeneration(data?.frontier?.generation??5);
 const out=initial(),seen=new Set();out.serial=number(raw.serial,1,1e9,true);let held=0,lit=0,placed=0;
 const advancedAllowed=!data||Object.entries(data.essentials?.jobs||{}).some(([id,j])=>j.stage==='delivered'&&C.Essentials.content.byId[id]?.family==='light');
 for(const d of raw.devices){
  if(!d||!Object.hasOwn(R.types,d.kind)||!['stock','belt','placed'].includes(d.location)||typeof d.on!=='boolean'||typeof d.used!=='boolean')bad();
  const type=R.types[d.kind];if(type.locked&&!advancedAllowed)bad();const item={id:number(d.id,1,out.serial-1,true),kind:d.kind,location:d.location,left:number(d.left,0,type.duration),on:d.on,used:d.used};
  if(seen.has(item.id)||d.on&&(!d.used||d.left<=0||d.location==='stock'||d.location==='belt'&&!type.carry)||!d.used&&d.left!==type.duration)bad();seen.add(item.id);
  if(d.location==='belt'){held++;if(d.on)lit++;}
  if(d.location==='placed'){
   placed++;if(!['local','region'].includes(d.domain))bad();
   Object.assign(item,{domain:d.domain,x:number(d.x,0,d.domain==='local'?4096:regionSize),y:number(d.y,0,d.domain==='local'?4096:regionSize),z:number(d.z,-1,2,true),inside:d.inside??null,angle:number(d.angle,-Math.PI*2,Math.PI*2)});
   if(item.inside!==null&&!/^P\d{4}$/.test(item.inside)||item.domain==='local'&&(item.z!==0||item.inside!==null))bad();
   if(data&&item.domain==='region'&&(item.z!==0||item.inside!==null)){
    const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null),G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),w=regionalWorld||(regionalWorld=validationWorld(W,data.worldSeed,data.frontier.generation)),p=w.pois.find(p=>p.id===item.inside);
    if(!p||!p.levels.includes(item.z))bad();const q=G.local(p,item.x,item.y);if(q.x<0||q.y<0||q.x>p.w||q.y>p.h)bad();
   }
  }
  out.devices.push(item);
 }
 const essentialCount=Object.values(data?.essentials?.belt||{}).reduce((sum,n)=>sum+n,0);
 if(held+essentialCount>R.beltMax||lit>1||placed>R.maxDevices)bad();
 return out;
}
function install(g){
 if(g.nightGear)return g.nightGear;
 let state=initial(),task=null,message='',pulse=0,fixtureWorld=null,fixtureCache=[],ui=null;
 const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
 const active=()=>g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0&&g.canIssueCommand();
 const frontierPosition=()=>g.frontier.position?.()||g.frontier.snapshot();
 const standing=()=>active()&&!g.expeditions.driving()&&!frontierPosition().car?.driving;
 const handlingReason=()=>!standing()?'Le commandant doit être à pied.':g.fieldcraft?.context?.().mounted?'Libérez le poste manuel avant de manipuler le matériel.':g.player.reload>0?'Terminez la recharge avant de manipuler le matériel.':task||g.essentials.busy()||g.fieldSupplies?.busy()||g.expansions?.busy('night')?'Terminez le travail en cours avant de manipuler le matériel.':'';
 const atHome=()=>!g.frontier.active()&&g.core()&&g.workerCanWorkAt(g.player,g.core(),100);
 const fail=reason=>{message=reason;return{ok:false,reason};};
 const save=()=>{g.nightwatch?.invalidate();g.audio.ui?.();g.save(false);ui?.refresh(true);return{ok:true};};
 const beltCount=()=>state.devices.filter(d=>d.location==='belt').length;
 const sharedCount=()=>beltCount()+Object.values(g.essentials.snapshot().belt).reduce((a,b)=>a+b,0);
 const unlocked=d=>!d.locked||Object.entries(g.essentials.snapshot().jobs).some(([id,j])=>j.stage==='delivered'&&C.Essentials.content.byId[id]?.family==='light');
 function position(){const v=frontierPosition();return v.active?{domain:'region',x:v.x,y:v.y,z:v.z,inside:v.inside,angle:v.a||0}:{domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null,angle:g.player.facing||0};}
 function localLineClear(a,b){
  if(!g.hostileLineClear(a,b,false))return false;
  // Sample the shared collision grid as well: G4 walls are outside world.at().
  const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));
  for(let i=1;i<n;i++)if(g.world.solidForFriendly(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;
  return true;
 }
 function near(d,p=position()){const scale=p.domain==='local'?32:1;return d.location==='placed'&&d.domain===p.domain&&d.z===p.z&&(p.z===0||d.inside===p.inside)&&Math.hypot(d.x-p.x,d.y-p.y)<=R.reach*scale&&(p.domain==='local'?localLineClear(p,d):g.frontier.world().line(p,d,p.z,p.inside,null,.015));}
 function sourceCost(){return atHome()?g.resources:g.player.carry;}
 function previewCraft(kind){
  const d=R.types[kind];if(!d||!Object.hasOwn(R.types,kind))return{ok:false,reason:'Équipement inconnu.'};
  const reason=handlingReason();if(reason)return{ok:false,reason};
  if(g.phase!=='calm'&&!d.field)return{ok:false,reason:'L’assemblage d’atelier se prépare pendant l’accalmie.'};
  if(!unlocked(d))return{ok:false,reason:'Rapportez un module d’éclairage des services essentiels.'};
  if(!atHome()&&!d.field)return{ok:false,reason:'Assemblage au dépôt de D-17.'};
  if(!atHome()&&sharedCount()>=R.beltMax)return{ok:false,reason:'Ceinture commune pleine (8 emplacements).'};
  if(state.devices.length>=R.maxDevices||state.serial>=1e9)return{ok:false,reason:'Réserve d’éclairage pleine.'};
  if(!C.canAfford(sourceCost(),d.cost))return{ok:false,reason:atHome()?'Matériaux insuffisants au dépôt.':'Matériaux requis dans le sac.'};
  const p=position(),dangerRange=C.Essentials.RULES.danger,danger=p.domain==='local'
   ?g.nearbyZombies(p.x,p.y,dangerRange*32).some(z=>!z.dead&&z.health>0)
   :g.frontier.overview().enemies.some(e=>e.hp>0&&e.z===p.z&&Math.hypot(e.x-p.x,e.y-p.y)<dangerRange&&g.frontier.visibleEnemy(e))
    ||p.z===0&&(g.worldEvolution?.snapshot().groups||[]).some(h=>h.count>h.lost&&Math.hypot(h.x-p.x,h.y-p.y)<g.worldEvolution.groupRadius(h)+dangerRange&&g.frontier.world().line(h,p,0,p.inside,null,.05));
  if(danger)return{ok:false,reason:'Éloignez les infectés avant l’assemblage.'};
  return{ok:true,cost:d.cost,seconds:atHome()?R.craftSeconds:R.fieldCraftSeconds};
 }
 function craft(kind){const q=previewCraft(kind);if(!q.ok)return fail(q.reason);task={kind,seconds:q.seconds,elapsed:0,position:position(),health:g.player.health,home:!!atHome()};g.releaseInputs();message='Assemblage en cours — bouger interrompt sans dépense.';return{ok:true};}
 function cancel(){if(!task)return false;task=null;message='Assemblage interrompu. Les matériaux sont conservés.';return true;}
 function transfer(id,direction){
  const reason=handlingReason();if(reason)return fail(reason);
  const d=state.devices.find(d=>d.id===id);if(!standing()||task||!atHome()||!d)return fail('Rejoignez le dépôt à pied.');
  const from=direction==='equip'?'stock':direction==='store'?'belt':null;if(!from||d.location!==from)return fail('Équipement indisponible.');
  if(direction==='equip'&&sharedCount()>=R.beltMax)return fail('La ceinture commune est pleine.');
  if(d.on)return fail('Éteignez cet équipement avant de le ranger.');
  d.location=direction==='equip'?'belt':'stock';message=R.types[d.kind].name+' '+(direction==='equip'?'équipé.':'rangé au dépôt.');return save();
 }
 function ignite(id){
  const d=state.devices.find(d=>d.id===id),type=d&&R.types[d.kind];if(!standing()||task||!d||d.location==='stock'||d.location==='placed'&&!near(d))return fail('Approchez de votre équipement.');
  if(d.on){if(type.disposable&&['flare','chemlight'].includes(d.kind))return fail('Ce consommable reste actif jusqu’à épuisement.');d.on=false;message=type.name+' éteint.';return save();}
  const reason=handlingReason();if(reason)return fail(reason);
  if(d.left<=0)return fail('Autonomie épuisée ; rechargez ce matériel.');
  if(d.location==='belt'&&!type.carry)return fail('Posez cet équipement avant de l’allumer.');
  if(d.location==='belt'&&state.devices.some(e=>e.location==='belt'&&e.on))return fail('Une seule source peut être portée allumée.');
  if(d.kind==='campfire'&&!fireSafe(d))return fail('Le feu exige un sol extérieur dégagé, loin des véhicules.');
  d.on=true;d.used=true;message=type.name+' allumé.';return save();
 }
 function insideHome(p){const plan=g.exploration125?.generation===4?g.exploration125.plan:null;if(!plan)return false;return [...(plan.stations||[]),...(plan.settlements||[]).flatMap(s=>s.buildings||[]),...(plan.backyards||[]).map(y=>y.house)].some(b=>Math.abs(p.x-b.x)<b.w/2&&Math.abs(p.y-b.y)<b.h/2);}
 function fireSafe(p){
  if(p.domain==='region'){
   const w=g.frontier.world(),G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
   if(p.z!==0||w.nearPOI(p.x,p.y,50).some(b=>{const q=G.local(b,p.x,p.y);return q.x>-.8&&q.y>-.8&&q.x<b.w+.8&&q.y<b.h+.8||b.parking.some(car=>Math.hypot(car.x-p.x,car.y-p.y)<4);}))return false;
   const car=frontierPosition().car;return !car||Math.hypot(car.x-p.x,car.y-p.y)>=4;
  }
  if(insideHome(p))return false;const car=g.expeditions.car();return !car||Math.hypot(car.x-p.x,car.y-p.y)>=128;
 }
 function place(id){
  const reason=handlingReason();if(reason)return fail(reason);
  const d=state.devices.find(d=>d.id===id);if(!standing()||task||!d||d.location!=='belt')return fail('Équipez cet objet puis descendez du véhicule.');
  if(state.devices.filter(e=>e.location==='placed').length>=R.maxPlaced)return fail('Trop de dispositifs posés. Récupérez-en.');
  const from=position(),p={...from},scale=p.domain==='local'?32:1,offset=R.placeDistance*scale;p.x+=Math.cos(p.angle)*offset;p.y+=Math.sin(p.angle)*offset;
  const clear=p.domain==='local'?g.friendlyPositionClear({radius:9},p.x,p.y)&&p.x>=16&&p.y>=16&&p.x<=4080&&p.y<=4080:!g.frontier.world().blocked(p.x,p.y,.28,p.z,p.inside);
  const reachable=p.domain==='local'?localLineClear(from,p):g.frontier.world().line(from,p,p.z,p.inside,null,.015);
  if(!clear||!reachable)return fail('Le sol devant vous est occupé ou inaccessible.');
  if(d.kind==='campfire'&&!fireSafe(p))return fail('Le feu exige un sol extérieur dégagé, loin des véhicules.');
  if(p.domain==='region'&&p.z===0){const w=g.frontier.world(),G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);p.inside=w.nearPOI(p.x,p.y,50).find(b=>{const q=G.local(b,p.x,p.y);return q.x>=0&&q.y>=0&&q.x<=b.w&&q.y<=b.h;})?.id||null;}
  Object.assign(d,p,{location:'placed'});message=R.types[d.kind].name+' posé'+(d.on?' et allumé.':'.');return save();
 }
 function pickup(id){
  const reason=handlingReason();if(reason)return fail(reason);
  const d=state.devices.find(d=>d.id===id);if(!standing()||task||!d||!near(d))return fail('Approchez de l’objet par un accès libre.');
  if(d.kind==='campfire')return fail('Un foyer se ravitaille ou se démonte sur place.');
  if(sharedCount()>=R.beltMax)return fail('Ceinture commune pleine.');
  if(d.on&&!R.types[d.kind].carry)return fail('Éteignez le pied avant de le replier.');
  if(d.on&&state.devices.some(e=>e.location==='belt'&&e.on))return fail('Éteignez la source déjà portée.');
  for(const k of ['domain','x','y','z','inside','angle'])delete d[k];d.location='belt';message=R.types[d.kind].name+' repris.';return save();
 }
 function refill(id){
  const reason=handlingReason();if(reason)return fail(reason);
  const d=state.devices.find(d=>d.id===id),type=d&&R.types[d.kind];if(!standing()||task||!d||!type.refill)return fail('Cet équipement ne se recharge pas.');
  const camp=d.kind==='campfire';if(camp?!near(d):!atHome()||d.location==='placed')return fail(camp?'Approchez du foyer.':'Recharge au dépôt, matériel porté ou rangé.');
  if(d.on||d.left>=type.duration-.01)return fail(d.on?'Éteignez avant de ravitailler.':'Autonomie déjà complète.');
  const pool=camp?sourceCost():g.resources;if(!C.canAfford(pool,type.refill))return fail(camp?'Bois requis dans le sac ou au dépôt.':'Matériaux de recharge insuffisants.');
  C.spend(pool,type.refill);d.left=type.duration;d.used=false;message=type.name+' ravitaillé.';return save();
 }
 function remove(id){const reason=handlingReason();if(reason)return fail(reason);const d=state.devices.find(d=>d.id===id);if(!standing()||task||!d||d.location==='placed'&&!near(d)||d.location==='stock'&&!atHome())return fail('Approchez de l’équipement.');if(d.on)return fail('Éteignez avant de démonter.');state.devices=state.devices.filter(e=>e.id!==id);message='Équipement démonté ; aucun matériau récupérable.';return save();}
 function fixtures(domain){
  if(domain==='local'){
   const plan=g.exploration125?.generation===4?g.exploration125.plan:null;if(!plan)return[];
   return (plan.stations||[]).map((b,i)=>({id:'solar-d17-'+i,kind:'solar',domain,x:b.x-b.w/2-18,y:b.y+b.h/2+18,z:0,inside:null,r:R.fixtureRadius*32,color:'#c8dcbb',on:true,angle:0,half:Math.PI}));
  }
  const w=g.frontier.world(),p=position();if(w!==fixtureWorld){fixtureWorld=w;fixtureCache=[];const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
   for(const b of w.pois){if(!['fuel','firestation','bunker','generatorRoom','freight','townhall'].includes(b.type)||G.hash(w.seed,b.id,'solar')%3!==0)continue;const q=G.global(b,b.w/2,-2);if(!w.blocked(q.x,q.y,.1,0,null))fixtureCache.push({id:'solar-'+b.id,kind:'solar',domain:'region',...q,z:0,inside:null,r:R.fixtureRadius,color:'#c8dcbb',on:true,angle:0,half:Math.PI});}
  }
  return fixtureCache.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<100).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,R.fixtureMax);
 }
 function lights(domain){
  const p=position(),scale=domain==='local'?32:1,list=[];
  for(const d of state.devices){if(!d.on||d.left<=0)continue;let q;if(d.location==='belt'){if(p.domain!==domain||g.player.dead||g.player.health<=0||g.expeditions.driving()||frontierPosition().car?.driving)continue;q=p;}else if(d.location==='placed'&&d.domain===domain)q=d;else continue;const type=R.types[d.kind];list.push({...q,id:'gear-'+d.id,kind:d.kind,r:type.radius*scale,color:type.color,half:Math.PI,on:true});}
  if(g.daylight()<.45||g.nightwatch?.isBlackout())list.push(...fixtures(domain));
  return list;
 }
 function serviceLantern(id,amount){
  const d=state.devices.find(d=>d.id===id);
  if(!g.survivalPack?.authorizeService?.(id,amount)||!standing()||task||!d||d.kind!=='lantern'||d.on||!Number.isFinite(amount)||amount<=0||!(d.location==='belt'||near(d)))return false;
  const duration=R.types.lantern.duration;if(d.left>=duration)return false;
  d.left=Math.min(duration,d.left+amount);d.used=d.left<duration;g.nightwatch?.invalidate();return true;
 }
 function overview(){const p=position();return{...copy(state),message,handlingReason:handlingReason(),atHome:!!atHome(),beltCount:sharedCount(),task:task?{kind:task.kind,progress:task.elapsed/task.seconds}:null,devices:state.devices.map(d=>({...d,...R.types[d.kind],near:near(d,p)})),recipes:kinds.map(kind=>({kind,...R.types[kind],unlocked:unlocked(R.types[kind]),preview:previewCraft(kind)})),position:p};}
 function dropOnDeath(p=position()){
  if(!g.player.dead&&g.player.health>0)return false;
  let changed=false;
  for(const d of state.devices)if(d.location==='belt'){Object.assign(d,p,{location:'placed',on:R.types[d.kind].carry?d.on:false});changed=true;}
  if(task)cancel();
  if(changed)g.nightwatch?.invalidate();
  return changed;
 }
 function step(dt){
  if(g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(.1,dt);pulse-=dt;
  const p=position(),dead=g.player.dead||g.player.health<=0,driving=g.expeditions.driving()||frontierPosition().car?.driving;
  if(dead)dropOnDeath(p);
  for(const d of state.devices){
   if(d.location==='belt'&&d.on&&driving&&!['flare','chemlight'].includes(d.kind)){d.on=false;message=R.types[d.kind].name+' éteint en montant dans le véhicule.';}
   if(!d.on)continue;const type=R.types[d.kind],q=d.location==='belt'?p:d,outdoor=q.z===0&&!q.inside&&!(q.domain==='local'&&insideHome(q));
   d.left=Math.max(0,d.left-dt*(1+(type.flame&&outdoor?(g.weather||0)*R.fireRainDrain*(1-Math.max(0,Math.min(1,g.survivalPack?.rainProtection(d,p)||0))):0)));
   if(!d.left)d.on=false;
   if(pulse<=0&&type.noise&&d.location==='placed'&&d.domain==='region'&&p.domain==='region'&&d.z===p.z)g.frontier.signalAt(d,type.noise);
  }
  state.devices=state.devices.filter(d=>!(R.types[d.kind].disposable&&d.used&&d.left<=0));
  if(pulse<=0)pulse=R.noisePulse;
  if(!task)return;const t=task,held=task;task=null;const q=previewCraft(t.kind);task=held;
  if(!q.ok||dead||p.domain!==t.position.domain||p.z!==t.position.z||Math.hypot(p.x-t.position.x,p.y-t.position.y)>.06||g.player.health<t.health||!!atHome()!==t.home){cancel();return;}
  t.elapsed+=dt;if(t.elapsed+1e-7<t.seconds)return;
  C.spend(sourceCost(),R.types[t.kind].cost);state.devices.push({id:state.serial++,kind:t.kind,location:t.home?'stock':'belt',left:R.types[t.kind].duration,on:false,used:false});message=R.types[t.kind].name+(t.home?' préparé au dépôt.':' ajouté à la ceinture.');task=null;save();
 }
 g.nightGear={busy:()=>!!task,localLineClear,dropOnDeath,serviceLantern,craft,previewCraft,cancel,transfer,ignite,place,pickup,refill,remove,lights,fixtures,overview,beltCount,snapshot:()=>normalize(state),step,draw:(ctx,domain,view)=>draw(ctx,g,domain,state,fixtures(domain),view),depthEntries:(domain,v,view)=>depthEntries(g,domain,state,fixtures(domain),v,view),drawCarried:(ctx,domain,v)=>drawCarried(ctx,g,domain,state,v)};
 const S=root.DeadwallSave;if(S&&!S.__nightGear){const old=S.validate.bind(S);S.validate=input=>{const data=old(input);data.nightGear=normalize(input?.nightGear,data);return data;};S.__nightGear=true;}
 wrap('serialize',(old,...a)=>({...old(...a),nightGear:normalize(state)}));
 wrap('restoreSave',(old,raw)=>{const next=normalize(raw?.nightGear,raw),result=old(raw);state=next;task=null;fixtureWorld=null;message='';g.nightwatch?.invalidate();return result;});
 wrap('startNew',(old,...a)=>{
  // Reset before the first automatic save, but retain the active campaign if
  // an older controller rejects the new-world request.
  const before=g.world,previous={state,task,fixtureWorld,message};state=initial();task=null;fixtureWorld=null;message='';
  try{return old(...a);}finally{if(g.world===before){state=previous.state;task=previous.task;fixtureWorld=previous.fixtureWorld;message=previous.message;}}
 });
 wrap('returnToMenu',(old,...a)=>{cancel();return old(...a);});
 wrap('update',(old,dt)=>{const running=g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver;if(running&&(g.player.dead||g.player.health<=0))dropOnDeath();if(running&&task&&(g.input.keys.size||g.input.mouseDown||g.input.touchFire))cancel();const result=old(dt);if(running)step(dt);return result;});
 const essential=g.essentials;g.essentials=Object.freeze({...essential,transferKit(k,direction){if(direction==='equip'&&sharedCount()>=R.beltMax)return fail('Ceinture commune pleine (kits et éclairage).');return essential.transferKit(k,direction);}});
 wrap('depthEntries',(old,view)=>{const entries=old(view);if(g.frontier.active()&&!view?.homeProjection)return entries;for(const item of g.nightGear.depthEntries('local',null,view))entries.push({kind:1,id:-126000,depth:item.depth,order:entries.length,entity:{id:-126000,x:item.x,y:item.y,__nightGearDraw:item.draw}});entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);return entries;});
 wrap('drawBuilding',(old,ctx,b,...a)=>b.__nightGearDraw?b.__nightGearDraw(ctx):old(ctx,b,...a));
 wrap('drawPlayer',(old,ctx,...a)=>{const result=old(ctx,...a);if(!g.frontier.active())g.nightGear.drawCarried(ctx,'local');return result;});
 if(root.document){ui=mount(g);wrap('updateUI',(old,...a)=>{const result=old(...a);ui?.refresh();return result;});}
 return g.nightGear;
}
function glyph(c,x,y,kind,on,scale,time,g=null,identity=kind){
 if(root.DeadwallWorldPropsArt153?.drawLight(c,g?.art,kind,x,y,scale,{identity,seed:g?.world?.seed??0,on,time,reducedMotion:g?.settings?.reducedMotion}))return;
 c.save();c.translate(x,y);c.scale(scale,scale);c.lineWidth=.07;c.strokeStyle='#28372c';c.fillStyle='#645b43';
 if(['branch','torch','campfire'].includes(kind)){
  c.strokeStyle='#6f4c2f';c.lineWidth=.16;c.beginPath();c.moveTo(-.36,.28);c.lineTo(.32,-.14);if(kind==='campfire'){c.moveTo(-.35,-.16);c.lineTo(.35,.26);}c.stroke();
  if(kind==='campfire'){c.strokeStyle='#909382';c.lineWidth=.14;c.beginPath();c.ellipse(0,.1,.58,.4,0,0,Math.PI*2);c.stroke();}
  if(on){const sway=Math.sin(time*7)*.09;c.fillStyle='#f09a43';c.beginPath();c.moveTo(-.24,.05);c.quadraticCurveTo(-.32,-.2,sway,-.72);c.quadraticCurveTo(.37,-.14,.21,.13);c.closePath();c.fill();c.fillStyle='#ffe4a1';c.beginPath();c.ellipse(0,-.1,.1,.21,0,0,Math.PI*2);c.fill();}
 }else if(kind==='chemlight'||kind==='flare'){
  c.rotate(-.6);c.fillStyle=on?(kind==='chemlight'?'#a3f0b7':'#ff8e66'):'#87947a';c.fillRect(-.09,-.45,.18,.8);c.strokeRect(-.09,-.45,.18,.8);c.fillStyle='#37483e';c.fillRect(-.13,.27,.26,.15);
 }else{
  c.fillStyle=kind==='lantern'?'#b4a35d':kind==='worklight'?'#bd9e53':'#899470';c.fillRect(-.3,-.34,.6,.58);c.strokeRect(-.3,-.34,.6,.58);c.fillStyle=on?(kind==='solar'?'#d4e9bf':'#ffefbd'):'#52615a';c.fillRect(-.21,-.26,.42,.32);
  c.strokeStyle='#c1c5a7';c.lineWidth=.06;c.beginPath();c.arc(0,-.36,.2,Math.PI,Math.PI*2);c.stroke();
  if(kind==='worklight'||kind==='beacon'||kind==='solar'){c.strokeStyle='#535b4b';c.lineWidth=.09;c.beginPath();c.moveTo(0,.2);c.lineTo(0,.65);c.moveTo(-.3,.73);c.lineTo(0,.47);c.lineTo(.3,.73);c.stroke();}
 }
 c.restore();
}
function depthEntries(g,domain,state,fixtures,v,view){
 v=v||g.frontier.position?.()||g.frontier.snapshot();const p=domain==='region'?v:g.player,scale=domain==='local'?32:1,z=domain==='local'?0:v.z,entries=[];
 const items=state.devices.filter(d=>d.location==='placed'&&d.domain===domain);
 for(const d of [...fixtures,...items]){
  if(d.z!==z||z!==0&&d.inside!==v.inside)continue;
  if(domain==='region'&&root.DeadwallFrontierArt?.visiblePoint&&!root.DeadwallFrontierArt.visiblePoint(g,d,v))continue;
  if(view?(domain==='local'?!g.visible(d.x,d.y,scale,view):d.x<view.l-scale||d.x>view.r+scale||d.y<view.t-scale||d.y>view.b+scale):Math.hypot(d.x-p.x,d.y-p.y)>80*scale)continue;
  entries.push({kind:'light',id:'night:'+d.id,x:d.x,y:d.y,depth:d.y+.24*scale,draw(ctx){glyph(ctx,d.x,d.y,d.kind,d.kind==='solar'?(g.daylight()<.45||g.nightwatch.isBlackout()):d.on,scale*.85,g.settings.reducedMotion?0:g.elapsed,g,d.id);}});
 }
 return entries;
}
function drawCarried(ctx,g,domain,state,v){
 v=v||g.frontier.position?.()||g.frontier.snapshot();if((domain==='region')!==g.frontier.active()||g.player.dead||g.expeditions.driving()||v.car?.driving)return;
 const p=domain==='region'?v:g.player,scale=domain==='local'?32:1,d=state.devices.find(d=>d.location==='belt'&&d.on);if(d)glyph(ctx,p.x+.38*scale,p.y+.24*scale,d.kind,true,.55*scale,g.settings.reducedMotion?0:g.elapsed,g,d.id);
}
function draw(ctx,g,domain,state,fixtures,view){for(const entry of depthEntries(g,domain,state,fixtures,null,view))entry.draw(ctx);if(view?.carried!==false)drawCarried(ctx,g,domain,state);}
function mount(g){
 if(!root.document?.body)return null;
 const doc=root.document,el=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const panel=el('details');panel.id='nightGearQuick';panel.className='night-gear hidden';const summary=el('summary','ÉCLAIRAGE'),body=el('div');body.className='night-gear-body';panel.appendChild(summary);panel.appendChild(body);
 const status=el('p'),guide=el('p','Au dépôt : assembler, équiper, allumer puis poser. Sur le terrain : bois, torche et foyer avec les ressources du sac. Huit emplacements partagés avec les kits. Les bornes solaires des lieux publics balisent quelques entrées.'),recipes=el('div'),devices=el('div'),cancel=el('button','Interrompre l’assemblage');guide.className='night-gear-guide';status.setAttribute('role','status');cancel.type='button';cancel.addEventListener('click',()=>{g.nightGear.cancel();refresh(true);});
 for(const node of [el('h3','Préparer la nuit'),guide,status,cancel,recipes,el('h3','Votre matériel'),devices])body.appendChild(node);
 const rows={};for(const kind of kinds){const type=R.types[kind],row=el('article'),button=el('button','Assembler'),cost=el('small',Object.entries(type.cost).map(([k,v])=>v+' '+C.RESOURCE_META[k].label.toLowerCase()).join(' + '));button.type='button';button.dataset.kind=kind;button.addEventListener('click',()=>{g.nightGear.craft(kind);refresh(true);});row.appendChild(el('strong',type.name+' · '+type.radius+' m · '+type.duration+' s'));row.appendChild(el('p',type.note));row.appendChild(cost);row.appendChild(button);recipes.appendChild(row);rows[kind]=button;}
 let handlingReason='';
 const button=(text,fn,id,extinguish=false)=>{const b=el('button',text);b.type='button';if(id)b.id='night-device-'+id;b.disabled=!extinguish&&Boolean(handlingReason);if(b.disabled)b.title=handlingReason;b.addEventListener('click',()=>{fn();refresh(true);});return b;};
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.code==='Escape'||e.key==='Escape'){e.preventDefault();panel.open=false;g.releaseInputs();g.canvas.focus?.();}});panel.addEventListener('pointerdown',e=>e.stopPropagation());panel.addEventListener('toggle',()=>{if(panel.open){g.releaseInputs();refresh(true);}});doc.body.appendChild(panel);let last=0,signature='';
 function refresh(force=false){if(!force&&performance.now()-last<450)return;last=performance.now();panel.classList.toggle('hidden',g.state!=='playing'||g.gameOver);panel.inert=Boolean(g.activeOverlay);if(g.state!=='playing')return;const v=g.nightGear.overview();summary.textContent='ÉCLAIRAGE · '+v.beltCount+'/8'+(v.task?' · '+Math.round(v.task.progress*100)+' %':'');if(!panel.open&&!force)return;status.textContent=v.message||'Les lampes n’utilisent pas le réseau des projecteurs de la cité.';cancel.hidden=!v.task;for(const recipe of v.recipes){rows[recipe.kind].disabled=!recipe.preview.ok;rows[recipe.kind].title=recipe.preview.reason||'Assembler en '+recipe.preview.seconds+' s';}
  handlingReason=v.handlingReason;const key=JSON.stringify([handlingReason,v.devices.map(d=>[d.id,d.location,Math.ceil(d.left),d.on,d.near])]);if(!force&&key===signature)return;signature=key;const focusId=devices.contains(doc.activeElement)?doc.activeElement.id:null;devices.replaceChildren();
  for(const d of v.devices){if(d.location==='stock'&&!v.atHome)continue;if(d.location==='placed'&&!d.near)continue;const card=el('article');card.appendChild(el('strong',d.name));card.appendChild(el('small',(d.location==='stock'?'Dépôt':d.location==='belt'?'Ceinture':'Au sol')+' · '+Math.ceil(d.left)+' s'+(d.on?' · ALLUMÉ':'')));
   if(d.location==='stock')card.appendChild(button('Équiper',()=>g.nightGear.transfer(d.id,'equip'),d.id+'-equip'));else{const toggle=button(d.on?'Éteindre':'Allumer',()=>g.nightGear.ignite(d.id),d.id+'-toggle',d.on);if(d.on&&['flare','chemlight'].includes(d.kind)){toggle.disabled=true;toggle.title='Ce consommable reste actif jusqu’à épuisement.';}card.appendChild(toggle);card.appendChild(button(d.location==='belt'?'Poser':'Reprendre',()=>d.location==='belt'?g.nightGear.place(d.id):g.nightGear.pickup(d.id),d.id+'-place'));if(v.atHome&&d.location==='belt')card.appendChild(button('Ranger',()=>g.nightGear.transfer(d.id,'store'),d.id+'-store'));}
   if(d.refill)card.appendChild(button('Ravitailler',()=>g.nightGear.refill(d.id),d.id+'-refill'));card.appendChild(button('Démonter',()=>g.nightGear.remove(d.id),d.id+'-remove'));devices.appendChild(card);
  }
  if(focusId){const next=devices.querySelectorAll('button').find?devices.querySelectorAll('button').find(b=>b.id===focusId):Array.from(devices.querySelectorAll('button')).find(b=>b.id===focusId);next?.focus();}
  if(!devices.children.length)devices.appendChild(el('p','Aucun équipement accessible. Assemblez au dépôt ou reprenez un dispositif proche.'));
 }
 refresh(true);return{refresh,panel};
}
const api={install,normalize,initial,glyph};root.DeadwallNightGear=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
