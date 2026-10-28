/* Prepared G11 rain collectors own only their fixed reservoir. The existing
 * siege owner remains the sole authority for the player's carried water. */
(function(root){
 'use strict';
 const dependency=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=dependency('DeadwallCore','./core.js');
 const rules=()=>C.CampaignWater214Rules;
 const supports=()=>dependency('DeadwallCampaignWaterSupports214','./campaign-water-supports214.js');
 const worlds=new Map(),copy=value=>JSON.parse(JSON.stringify(value));
 const initial=()=>({version:1,collectors:[]});
 const recordKey=/^(P\d{4}):205:static:(0|[1-9]\d*)$/;
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

 function reference(full){
  const f=full.frontier,key=[full.worldSeed,f.generation,f.detailVersion??0,f.ecologyVersion??0,f.hydrologyVersion??0,f.landscape189||'classic'].join(':');
  if(!worlds.has(key)){
   const W=dependency('DeadwallFrontierWorld','./frontier-world.js');
   worlds.set(key,W.create(full.worldSeed,f.generation,{detailVersion:f.detailVersion??0,ecologyVersion:f.ecologyVersion??0,hydrologyVersion:f.hydrologyVersion??0,...(f.landscape189?{landscape189:f.landscape189}:{})}));
   if(worlds.size>3)worlds.delete(worlds.keys().next().value);
  }
  return worlds.get(key);
 }
 function validate(raw,full){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Registre des récupérateurs de pluie invalide.');};
  const fields=(value,names)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join('|')!==[...names].sort().join('|'))bad();};
  fields(raw,['version','collectors']);
  if(raw.version!==1||!Array.isArray(raw.collectors)||raw.collectors.length>rules().maxCollectors)bad();
  const seen=new Set(),result=initial();
  for(const item of raw.collectors){
   fields(item,['siteId','supportId','water']);
   const match=typeof item.supportId==='string'&&recordKey.exec(item.supportId);
   if(!match||item.siteId!==match[1]||seen.has(item.supportId)||!Number.isFinite(item.water)||item.water<0||item.water>rules().capacity)bad();
   seen.add(item.supportId);result.collectors.push({...item});
  }
  if(full&&result.collectors.length){
   if(full.frontier?.generation!==rules().generation||!Number.isInteger(full.worldSeed)||!Array.isArray(full.frontier.seen))bad();
   const f=full.frontier;
   // Reject type aliases before consulting a cache keyed by printable values.
   if(f.detailVersion!==undefined&&(!Number.isInteger(f.detailVersion)||f.detailVersion<0)||
    f.ecologyVersion!==undefined&&![0,1].includes(f.ecologyVersion)||f.hydrologyVersion!==undefined&&![0,1].includes(f.hydrologyVersion)||
    f.landscape189!==undefined&&(typeof f.landscape189!=='string'||!Object.hasOwn(C.Landscape189Rules.presets,f.landscape189)))bad();
   const w=reference(full),bySite=new Map(w.pois.map(p=>[p.id,p])),descriptors=new Map();
   for(const item of result.collectors){
    const p=bySite.get(item.siteId);if(!p||!full.frontier.seen.includes(item.siteId))bad();
    if(!descriptors.has(p.id))descriptors.set(p.id,supports().supportsFor(p,w.plan(p,0),w.detailAt(p,0)));
    if(!descriptors.get(p.id).some(s=>s.supportId===item.supportId))bad();
   }
  }
  return result;
 }

 function install(g){
  if(g.campaignWater214)return g.campaignWater214;
  if(!g.expansions||!g.frontier)return null;
  const R=rules();
  let state=initial(),byId=new Map(),task=null,message='',stateWorld=g.world,rainCache=null;
  const pos=()=>g.frontier.position(),world=()=>g.frontier.world();
  const alive=()=>g.state==='playing'&&!g.gameOver&&!!g.player&&!g.player.dead&&g.player.health>0;
  const running=()=>alive()&&!g.paused&&!g.activeOverlay;
  const destroyed=siteId=>typeof g.worldEvolution?.structureDestroyed==='function'?g.worldEvolution.structureDestroyed(siteId):undefined;
  const options=()=>({structureDestroyed:destroyed});
  const bucket=()=>g.siege?.carriedWater199?.()??0;
  const fail=reason=>({ok:false,reason});
  const names={prepare:'Remettre en service le récupérateur',draw:'Puiser dans le seau de service',pour:'Verser le seau dans le récupérateur'};
  function hands(){
   if(!alive()||!g.expansions.canAct()||g.expansions.busy('water214'))return 'Terminez l’intervention en cours et libérez vos mains.';
   if(g.player.reload>0||g.player.shootCooldown>0||g.player.meleeCooldown>0)return 'Terminez le rechargement ou le geste de combat.';
   const day=g.dayworks?.workContext?.();
   if(g.selectedBuild||g.rallyPlacement||g.expeditions?.driving?.()||g.fieldcraft?.context?.()?.mounted||g.siege?.toolActive?.()||g.linecare?.toolActive?.()||g.infrastructure?.toolActive?.()||(day?.tool||'none')!=='none'||day?.placing||day?.preview)return 'Rangez les outils et quittez le placement avant de manipuler ce récupérateur.';
   return '';
  }
  function danger(p,w){
   const contacts=[...(g.frontier.contacts?.()||[]),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])];
   return contacts.some(e=>!e.dead&&(e.hp??e.health)>0&&(e.z??0)===p.z&&Math.hypot(e.x-p.x,e.y-p.y)<R.danger&&w.line(p,e,p.z,p.inside,null,.05));
  }
  function amount(kind,item){
   if(!item||!['draw','pour'].includes(kind))return 0;
   const water=bucket();if(!Number.isFinite(water)||water<0||water>C.Siege.RULES.bucketCapacity)return 0;
   return kind==='draw'?Math.min(R.draw.portion,item.water,C.Siege.RULES.bucketCapacity-water):Math.min(R.pour.portion,water,R.capacity-item.water);
  }
  function preview(kind,siteId,supportId,continuing=false){
   if(!Object.hasOwn(names,kind))return fail('Intervention inconnue.');
   if(g.world!==stateWorld||g.expansions.restoring?.())return fail('Terminez la restauration de cette campagne.');
   const why=hands();if(why)return fail(why);
   if(task&&!continuing)return fail('Terminez ou interrompez le travail en cours.');
   const p=pos(),w=world();if(w.seed!==g.world.seed)return fail('La région courante ne correspond plus à cette campagne.');
   const support=supports().resolve(w,p,{siteId,supportId},g.frontier.discoveries(),options());
   if(!support.ok)return support;
   if(danger(p,w))return fail('Sécurisez les abords avant de manipuler cette eau de service.');
   const item=byId.get(supportId),cost=kind==='prepare'?R.prepare.cost:{};
   if(kind==='prepare'){
    if(item)return fail('Ce récupérateur est déjà aménagé.');
    if(state.collectors.length>=R.maxCollectors)return fail('Le carnet des récupérateurs est plein.');
    if(!C.canAfford(g.player.carry,cost))return fail('Dans le sac : '+C.resourceText(cost)+' nécessaires.');
   }else{
    if(!item)return fail('Remettez d’abord ce récupérateur en service ; il commence vide.');
    if(typeof g.siege?.transferFieldWater199!=='function'||typeof g.siege?.carriedWater199!=='function')return fail('Le seau de service est indisponible.');
    if(!(amount(kind,item)>0))return fail(kind==='draw'?'Réserve vide ou seau de service plein.':'Seau vide ou récupérateur plein.');
   }
   return{ok:true,kind,siteId,supportId,support,seconds:R[kind].seconds,cost:{...cost},amount:kind==='prepare'?0:amount(kind,item)};
  }
  function resetGesture(){g.heroActions133?.reset?.();}
  function begin(kind,siteId,supportId){
   const q=preview(kind,siteId,supportId);if(!q.ok){message=q.reason;return q;}
   const p=pos();resetGesture();task={...q,elapsed:0,start:g.elapsed,origin:{x:p.x,y:p.y,z:p.z,inside:p.inside},regionKey:regionKey(p),world:g.world,regional:world(),player:g.player,source:g.player.carry,shots:g.stats?.shots,health:g.player.health};
   message=names[kind]+' : restez sur place, le temps et les menaces continuent.';g.releaseInputs?.();
   if(g.activeOverlay===g.ui?.commandModal){g.showCommand?.(false);if(g.paused)g.togglePause?.(false);}
   try{g.audio?.ui?.();}catch{/* Optional audio never owns a resource transaction. */}
   return{ok:true};
  }
  function cancel(reason='Travail interrompu ; aucun matériau ni volume transféré.'){
   if(!task)return false;task=null;message=reason;resetGesture();return true;
  }
  const regionKey=p=>[p.generation,p.detailVersion??0,p.ecologyVersion??0,p.hydrologyVersion??0,p.landscape189||'classic'].join(':');
  function unchanged(t,p){
   return g.world===t.world&&g.player===t.player&&g.player.carry===t.source&&g.stats?.shots===t.shots&&g.player.health>=t.health&&regionKey(p)===t.regionKey&&p.active&&p.generation===R.generation&&p.z===t.origin.z&&p.inside===t.origin.inside&&!p.car?.driving&&Math.hypot(p.x-t.origin.x,p.y-t.origin.y)<=R.moveTolerance;
  }
  function useful(t){return t.kind==='prepare'?!byId.has(t.supportId)&&C.canAfford(g.player.carry,t.cost):amount(t.kind,byId.get(t.supportId))>0;}
  function activity(){
   const t=task;if(!t||!(t.elapsed>0)||!alive()||destroyed(t.siteId)!==false||!unchanged(t,pos())||g.player.reload>0||g.player.shootCooldown>0||g.player.meleeCooldown>0||!useful(t))return null;
   return freeze({siteId:t.siteId,supportId:t.supportId,supportKind:'rain-barrel',kind:t.kind,elapsed:t.elapsed,duration:t.seconds,progress:Math.min(1,t.elapsed/t.seconds),start:t.start,amount:t.kind==='prepare'?0:amount(t.kind,byId.get(t.supportId)),anchor:{...t.support.anchor},workTarget:{...t.support.workTarget}});
  }
  function status(supportId){
   const item=byId.get(supportId);if(!item||g.world!==stateWorld||destroyed(item.siteId)!==false)return null;
   return freeze({...item,capacity:R.capacity,prepared:true});
  }
  function rainSources(w){
   if(rainCache?.world===w&&rainCache.local===g.world&&rainCache.count===state.collectors.length)return rainCache.sources;
   const bySite=new Map(w.pois.map(p=>[p.id,p])),descriptors=new Map(),sources=new Map();
   for(const item of state.collectors){
    const p=bySite.get(item.siteId);if(!p)continue;
    if(!descriptors.has(p.id))descriptors.set(p.id,supports().supportsFor(p,w.plan(p,0),w.detailAt(p,0)));
    const support=descriptors.get(p.id).find(s=>s.supportId===item.supportId);if(support)sources.set(item.supportId,support.center);
   }
   // Retain scalar source coordinates, never plans or mutable permissions.
   rainCache={world:w,local:g.world,count:state.collectors.length,sources};return sources;
  }
  function collectRain(dt){
   if(!state.collectors.length||g.world!==stateWorld||!Number.isFinite(g.weather)||!(g.weather>0))return;
   const w=world();if(w.generation!==R.generation||w.seed!==g.world.seed||typeof w.coveredAt205!=='function')return;
   const sources=rainSources(w),rain=Math.min(1,g.weather)*R.rainPerSecond*dt;
   if(!Number.isFinite(rain)||rain<=0)return;
   for(const item of state.collectors){
    const point=sources.get(item.supportId);if(!point||destroyed(item.siteId)!==false||w.coveredAt205(point.x,point.y,0,null)!==false)continue;
    item.water=Math.min(R.capacity,item.water+rain);
   }
  }
  function finish(t,q){
   if(t.kind==='prepare'){
    if(!C.spend(g.player.carry,q.cost))return cancel('Fournitures indisponibles ; récupérateur non aménagé.');
    const item={siteId:t.siteId,supportId:t.supportId,water:0};state.collectors.push(item);byId.set(item.supportId,item);stateWorld=g.world;rainCache=null;
   }else{
    const item=byId.get(t.supportId),requested=amount(t.kind,item);
    if(!(requested>0))return cancel('Aucun volume utile ne peut être transféré.');
    const accepted=g.siege.transferFieldWater199(t.kind==='draw'?'fill':'pour',requested);
    if(!Number.isFinite(accepted)||accepted<=0||accepted>requested)return cancel('Seau indisponible ; aucun volume ajouté au récupérateur.');
    // The bucket owner's synchronous acceptance is the exact fixed-stock debit
    // or credit; previews and failed transfers never touch either reservoir.
    item.water+=t.kind==='draw'?-accepted:accepted;
   }
   task=null;resetGesture();message=t.kind==='prepare'?'Récupérateur aménagé, vide. Seule la pluie pendant la partie le remplit.':'Transfert achevé avec le seau commun. Cette eau est non potable.';
   const saved=g.save?.(false);if(saved===false)message+=' Stockage indisponible : exportez la partie.';
   g.notify?.(message,saved===false?'danger':'good');try{g.audio?.ui?.();}catch{/* Optional audio only. */}
  }
  function step(dt){
   if(!alive()){cancel();return;}if(g.paused||g.activeOverlay||!Number.isFinite(dt)||dt<=0)return;
   const delta=Math.min(dt,R.maxStep);collectRain(delta);
   if(!task)return;const t=task,p=pos();
   if(!unchanged(t,p)||world()!==t.regional){cancel();return;}
   const q=preview(t.kind,t.siteId,t.supportId,true);
   const changed=q.ok&&['anchor','workTarget'].some(key=>['x','y','z'].some(axis=>q.support[key][axis]!==t.support[key][axis]));
   if(!q.ok||changed){cancel(q.reason||'Le point de travail a changé.');return;}
   t.elapsed+=delta;g.heroActions133?.observeWaterWork214?.(delta);
   if(t.elapsed+1e-8>=t.seconds)finish(t,q);
  }
  function actions(){
   if(task)return[{id:'cancel-water214',label:'Interrompre la manipulation du récupérateur',close:false,run:()=>({ok:cancel()})}];
   const p=pos();if(!alive()||!p.active||p.generation!==R.generation)return[];
   const candidates=supports().list(world(),p,g.frontier.discoveries(),options()),result=[];
   for(const support of candidates){
    for(const kind of byId.has(support.supportId)?['draw','pour']:['prepare']){
     const q=preview(kind,support.siteId,support.supportId);
     result.push({id:'water214-'+kind+'-'+support.supportId,label:names[kind]+' · '+support.supportLabel,description:'Eau non potable pour les incendies et les abreuvoirs. '+(kind==='prepare'?C.resourceText(R.prepare.cost)+' du sac ; réserve initialement vide.':'Le seau de service reste l’unique eau portée.'),disabled:!q.ok,reason:q.reason||(q.seconds+' s sur place'+(q.amount?' · '+q.amount.toFixed(1)+' unité(s) transférable(s)':'')),close:true,run:()=>begin(kind,support.siteId,support.supportId)});
    }
   }
   return result.slice(0,R.maxActions);
  }
  function overview(){return{summary:'Remettez en service les récupérateurs des haltes G11. Leur pluie accumulée reste finie ; eau non potable, aucun réseau d’eau courante.',message,rows:[{label:'Récupérateurs aménagés',value:state.collectors.length+' / '+R.maxCollectors},{label:'Réserve maximale',value:R.capacity+' par récupérateur ; vide à l’installation'},{label:'Seau partagé',value:bucket().toFixed(1)+' / '+C.Siege.RULES.bucketCapacity},{label:'Pluie',value:'Collecte uniquement pendant le temps actif, hors couverture ; aucun gain hors ligne'}],task:task?{kind:task.kind,name:names[task.kind],progress:Math.min(1,task.elapsed/task.seconds)}:null};}
  function restore(raw){state=validate(raw);byId=new Map(state.collectors.map(c=>[c.supportId,c]));task=null;message='';stateWorld=g.world;rainCache=null;resetGesture();}
  const api=Object.freeze({preview,begin,cancel,step,actions,overview,status,activity,presentation:supportId=>{const view=activity();return view?.supportId===supportId?view:null;},snapshot:()=>copy(state),busy:()=>!!task});g.campaignWater214=api;
  g.expansions.register({id:'water214',title:'Récupérateurs & eau de service',overview,actions,validate,snapshot:api.snapshot,restore,reset:()=>restore(undefined),busy:api.busy});
  const update=g.update.bind(g);g.update=dt=>{
   if(task&&running()&&(g.input?.mouseDown||g.input?.touchFire||g.input?.keys?.size||g.input?.pressed?.size))cancel();
   const result=update(dt);step(dt);return result;
  };
  const damage=g.damagePlayer?.bind(g);if(damage)g.damagePlayer=(...args)=>{const before=g.player.health,result=damage(...args);if(g.player.health<before)cancel('Blessure : travail interrompu avant le transfert.');return result;};
  const menu=g.returnToMenu?.bind(g);if(menu)g.returnToMenu=(...args)=>{cancel();return menu(...args);};
  const start=g.startNew.bind(g);g.startNew=(...args)=>{
   const before={world:g.world,state,byId,task,message,stateWorld,rainCache};
   try{return start(...args);}finally{
    if(g.world===before.world){({state,byId,task,message,stateWorld,rainCache}=before);}else stateWorld=g.world;
   }
  };
  return api;
 }
 const api=Object.freeze({initial,validate,install});root.DeadwallCampaignWater214=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(typeof globalThis!=='undefined'?globalThis:this);
