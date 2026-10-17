/* Finite field harvests. All rewards share the real backpack and normal deposit route. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
const P=root.DeadwallBiomePopulation165||(typeof require==='function'?require('./biome-population165.js'):null);
const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null);
const R=C.WildlifeHarvest190Rules, worlds=new Map(), copy=v=>JSON.parse(JSON.stringify(v));
const initial=()=>({version:1,harvested:{}});
function validate(raw,full){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Registre des récoltes sauvages invalide.');};
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==2||raw.version!==1||!Object.hasOwn(raw,'harvested'))bad();
 if(!raw.harvested||typeof raw.harvested!=='object'||Array.isArray(raw.harvested)||Object.keys(raw.harvested).length>R.maxRecords)bad();
 const s=initial();let world=null;
 for(const [id,n]of Object.entries(raw.harvested)){
  if(!/^A(?:165|189)_(0|[1-9]\d{0,2})_(0|[1-9]\d{0,2})_[0-7]$/.test(id)||!Number.isFinite(n)||n<=0||n>Math.max(...Object.values(R.yields)))bad();
  if(full){
   const f=full.frontier;if(f?.hydrologyVersion!==1||f.wildlife165?.[id]?.hp!==0)bad();
   if(!world){
    const key=[full.worldSeed,f.generation,f.detailVersion,f.ecologyVersion,f.hydrologyVersion,f.landscape189||'classic'].join(':');
    if(!worlds.has(key)){worlds.set(key,W.create(full.worldSeed,f.generation,{detailVersion:f.detailVersion,ecologyVersion:f.ecologyVersion,hydrologyVersion:f.hydrologyVersion,...(f.landscape189?{landscape189:f.landscape189}:{})}));if(worlds.size>3)worlds.delete(worlds.keys().next().value);}
    world=worlds.get(key);
   }
   const q=P.candidate(world,id);if(!q||q.id!==id||n>(R.yields[q.species]||0)+1e-7)bad();
  }
  s.harvested[id]=n;
 }
 return s;
}
function install(g){
 if(g.wildHarvest190)return g.wildHarvest190;if(!g.expansions||!g.frontier)return null;
 let state=initial(),task=null,message='',lastMenuTime=-Infinity,cachedChoices=[];
 const position=()=>g.frontier.position();
 const alive=()=>g.state==='playing'&&!g.gameOver&&g.player&&!g.player.dead&&g.player.health>0;
 const permitted=()=>alive()&&g.expansions.canAct();
 const fail=reason=>({ok:false,reason});
 const free=()=>Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry));
 const taken=id=>state.harvested[id]||0;
 const fishingCostText=()=>Object.entries(R.fishingCost).map(([id,n])=>n.toLocaleString('fr-FR')+' '+C.RESOURCE_META[id].label.toLowerCase()).join(' + ');
 const record=id=>g.frontier.wildlifeStatus165(id);
 const yieldOf=q=>R.yields[q.species]||0;
 const remaining=q=>Math.max(0,yieldOf(q)-taken(q.id));
 const equipped=()=>{const a=g.arsenal134?.snapshot();return a?.carried.find(i=>i.uid===a.equipped)||null;};
 const visible=q=>{const frame=g.visibility?.frame?.();return frame?.canSeeRegionalPoint?frame.canSeeRegionalPoint(q):g.frontier.world().line(position(),q,0,null,null,.015);};
 const emit=(frequency,volume=.035)=>{try{g.audio?.tone?.(frequency,.09,'sine',volume,-45);}catch{/* Audio failure cannot duplicate or undo an inventory transaction. */}};
 function danger(){
  const p=position(),w=g.frontier.world();
  return [...g.frontier.contacts(),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])].some(e=>!e.dead&&(e.hp??e.health)>0&&(e.z??0)===0&&Math.hypot(e.x-p.x,e.y-p.y)<R.dangerRange&&w.line(p,e,0,null,null,.015));
 }
 function baseReason(continuing=null){
  if(!permitted())return 'Rejoignez le terrain avec un commandant vivant.';
  const p=position();
  if(!p.active||p.z!==0||p.hydrologyVersion!==1)return 'À pied, dans la région avec faune, au niveau du sol.';
  if(p.car?.driving||g.expeditions?.driving())return 'Descendez du véhicule avant de récolter.';
  if(g.player.reload>0||g.expansions.busy('wildlife190')||task&&task!==continuing||g.selectedBuild)return 'Terminez l’action en cours et libérez vos mains.';
  if(g.frontier.world().blocked(p.x,p.y,W.RULES.footRadius,0,p.inside))return 'Rejoignez une berge ou un sol praticable.';
  if(danger())return 'Écartez les infectés avant de préparer une prise.';
  return '';
 }
 function quote(kind,id,continuing=null){
  const reason=baseReason(continuing);if(reason)return fail(reason);
  if(!['harvest','fish'].includes(kind))return fail('Récolte inconnue.');
  if(g.husbandry191?.claimed(id))return fail('Cette prise appartient au registre des enclos.');
  const q=record(id);if(!q)return fail('Animal non rencontré ou hors du carnet de cette campagne.');
  const p=position(),w=g.frontier.world(),fish=q.profile.mode==='swim';
  if(remaining(q)<=1e-7)return fail(yieldOf(q)>0?'Prise épuisée : rien à récupérer.':'Cette espèce ne fournit pas de provisions dans ce système.');
  if(!Object.hasOwn(state.harvested,id)&&Object.keys(state.harvested).length>=R.maxRecords)return fail('Carnet des récoltes plein : terminez les prises déjà enregistrées.');
  if(!visible(q))return fail('La prise doit être visible depuis votre position.');
  if(kind==='fish'&&(!fish||q.hp<=0||!g.frontier.wildlife165().some(a=>a.id===id)))return fail('Choisissez un poisson vivant réellement présent.');
  if(kind==='harvest'&&q.hp>0)return fail('La préparation nécessite une dépouille, pas un animal vivant.');
  const reach=kind==='fish'?R.castReach:R.reach;
  if(Math.hypot(p.x-q.x,p.y-q.y)>reach)return fail(kind==='fish'?'Poisson hors de portée de la ligne.':'Rapprochez-vous de la dépouille.');
  if(fish){
   const shore=w.hydrology.sample(p.x,p.y),water=w.hydrology.sample(q.x,q.y);
   if(shore.water||!water.water||water.crossing||!w.wildlifeWaterLine(p,q,.04))return fail('Pêchez depuis la terre ferme, avec une ligne libre jusqu’à l’eau.');
  }else if(!w.movementLine(p,q,0,p.inside,null,.05))return fail('La dépouille est derrière un obstacle.');
  let tool=null;
  if(!fish){tool=equipped();if(!tool||!R.knives.includes(tool.id)||tool.condition<=0)return fail('Équipez un couteau ou une machette en état depuis l’armurerie.');}
  const amount=Math.min(remaining(q),free(),kind==='fish'?yieldOf(q):R.portion);
  if(amount<=1e-7)return fail('Sac plein : déposez votre chargement avant la récolte.');
  if(kind==='fish'&&!continuing&&!C.canAfford(g.player.carry,R.fishingCost))return fail('Ligne de fortune : '+fishingCostText()+' transportés requis.');
  const seconds=kind==='fish'?R.fishSeconds:(R.baseSeconds+amount*R.secondsPerUnit)/(tool?g.arsenal134.toolFactor('butcher'):1);
  return {ok:true,id,kind,amount,seconds,tool:tool?.uid??null,name:q.profile.name,cost:kind==='fish'?{...R.fishingCost}:{},x:q.x,y:q.y};
 }
 function cancel(reason='Récolte interrompue ; aucune nourriture accordée. Le matériel de pêche engagé reste consommé.'){
  if(!task)return false;task=null;message=reason;lastMenuTime=-Infinity;return true;
 }
 function begin(kind,id){
  const q=quote(kind,id);if(!q.ok){message=q.reason;return q;}
  if(kind==='fish'&&!C.spend(g.player.carry,R.fishingCost))return fail('Matériel de pêche indisponible.');
  const p=position();task={...q,elapsed:0,noiseTime:0,origin:{x:p.x,y:p.y,z:p.z},health:g.player.health,world:g.world};
  message=kind==='fish'?'Ligne engagée : restez sur la berge pour ramener la prise.':'Préparation au couteau : restez près de la dépouille.';
  g.frontier.signalAt({...p,z:0},R.noise);emit(kind==='fish'?510:210);lastMenuTime=-Infinity;
  // Saving records costs now, but intentionally never resumes an interrupted job for free.
  g.save(false);return {ok:true};
 }
 function step(dt){
  if(!task)return;
  if(!alive()||!position().active){cancel('Récolte arrêtée : commandant indisponible.');return;}
  if(g.paused||g.activeOverlay)return;
  if(!Number.isFinite(dt)||dt<=0)return;
  const t=task,p=position(),q=quote(t.kind,t.id,t);
  if(!q.ok||t.world!==g.world||g.player.health<t.health||p.z!==t.origin.z||Math.hypot(p.x-t.origin.x,p.y-t.origin.y)>R.moveTolerance||q.tool!==t.tool){cancel(q.reason||'Déplacement, blessure ou changement d’outil : travail interrompu.');return;}
  dt=Math.min(R.maxStep,dt);t.elapsed+=dt;t.noiseTime+=dt;
  if(t.tool!==null)g.arsenal134.wearTool('butcher',dt);
  g.interactionText=(t.kind==='fish'?'Pêche à la ligne':'Préparation du gibier')+' · '+Math.min(100,Math.floor(t.elapsed/t.seconds*100))+' %';
  if(t.noiseTime>=R.noiseInterval){t.noiseTime=0;g.frontier.signalAt({...p,z:0},R.noise);emit(t.kind==='fish'?450:180,.015);}
  if(t.elapsed+1e-8<t.seconds)return;
  const final=quote(t.kind,t.id,t);if(!final.ok){cancel(final.reason);return;}
  const amount=Math.min(t.amount,final.amount);if(amount<=1e-7){cancel('Sac plein : prise conservée sur place.');return;}
  if(t.kind==='fish'&&!g.frontier.hitWildlife165(t.id,record(t.id).profile.health)){cancel('Le poisson n’est plus disponible.');return;}
  // Single synchronous commit: a corpse, the spent share and the bag change together.
  state.harvested[t.id]=taken(t.id)+amount;g.player.carry.food+=amount;g.stats.gathered+=amount;
  task=null;lastMenuTime=-Infinity;message=amount.toFixed(1)+' provisions préparées dans le sac. Rapportez-les au dépôt.';
  emit(690);const stored=g.save(false);g.notify(message+(stored?'':' Stockage indisponible : exportez la partie.'),stored?'good':'danger');
 }
 function remains(range=12){
  if(!alive()||!position().active||position().z!==0)return [];
  return g.frontier.wildlifeRemains165(range).filter(q=>remaining(q)>1e-7);
 }
 function choices(){
  if(!alive()||!position().active||position().z!==0)return [];
  const p=position();
  return [...remains(R.castReach+2).map(q=>({...q,kind:'harvest'})),...g.frontier.wildlife165().filter(q=>q.profile.mode==='swim'&&Math.hypot(q.x-p.x,q.y-p.y)<=R.castReach+2).map(q=>({...q,kind:'fish'}))]
    .filter(visible).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||a.id.localeCompare(b.id)).slice(0,8);
 }
 function presentation(){
  if(!task||task.kind!=='fish'||!alive())return null;const p=position(),q=record(task.id);
  if(!p.active||p.z!==0||!q||q.hp<=0)return null;
  return {id:task.id,kind:'fish',x:p.x,y:p.y,target:{x:q.x,y:q.y,z:0},progress:Math.min(1,task.elapsed/task.seconds)};
 }
 function taskView(){if(!task)return null;const {world,...view}=task;return {...copy(view),progress:Math.min(1,task.elapsed/task.seconds)};}
 function overview(){
  return {summary:message||'Chassez avec vos armes, préparez le gibier mort au couteau et pêchez les poissons visibles depuis une berge. Récoltes finies ; retour au dépôt nécessaire.',rows:[
   {label:'Portée de pêche',value:R.castReach+' m. Ouvrez Terrain & trajet avant l’approche ; le poisson peut fuir tant que la ligne n’est pas engagée.'},
   {label:'Matériel de pêche par prise',value:fishingCostText()+' ; perdu à l’interruption'},
   {label:'Préparation du gibier',value:'Couteau ou machette équipé ; usure et bruit'},
   {label:'Sac',value:C.bagTotal(g.player.carry).toFixed(1)+' / '+g.player.carryCapacity},
   {label:'Prises déjà prélevées',value:Object.keys(state.harvested).length+' ; aucun renouvellement au chargement'}],task:taskView()};
 }
 function actions(){
  if(task)return [{id:'cancel',label:'Interrompre la récolte',description:'Pas de nourriture accordée ; matériel de pêche déjà engagé non remboursé.',close:false,run:()=>({ok:cancel()})}];
  // Menu queries are read-only; cache only the bounded choice list, never quotes.
  const time=Number.isFinite(g.elapsed)?g.elapsed:0;if(time!==lastMenuTime){cachedChoices=choices();lastMenuTime=time;}
  return cachedChoices.map(q=>{const offer=quote(q.kind,q.id);return {id:q.kind+':'+q.id,label:(q.kind==='fish'?'Pêcher : ':'Préparer : ')+q.profile.name,
   description:q.kind==='fish'?'Ligne de fortune, durée '+R.fishSeconds+' secondes ; bruit et risque d’interruption.':remaining(q).toFixed(1)+' provisions restantes ; récupération par portions dans le sac.',
   disabled:!offer.ok,reason:offer.reason||'',close:true,run:()=>begin(q.kind,q.id)};});
 }
 const api=Object.freeze({begin,cancel,step,quote,overview,actions,remains,choices,taken,presentation,hooked:id=>task?.kind==='fish'&&task.id===id,busy:()=>!!task,snapshot:()=>validate(state)});
 g.wildHarvest190=api;
 g.expansions.register({id:'wildlife190',title:'Récoltes sauvages',overview,actions,busy:api.busy,validate,snapshot:api.snapshot,
  restore:raw=>{state=validate(raw);task=null;message='';cachedChoices=[];lastMenuTime=-Infinity;},reset:()=>{state=initial();task=null;message='';cachedChoices=[];lastMenuTime=-Infinity;}});
 const oldUpdate=g.update.bind(g);g.update=dt=>{
  if(task&&!g.paused&&!g.activeOverlay){
   const keys=g.input.keys,pressed=g.input.pressed;
   if(g.input.mouseDown||g.input.touchFire||['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyZ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyR','KeyF','KeyG','KeyV','PageUp','PageDown'].some(k=>keys.has(k)||pressed.has(k)))cancel();
  }
  const result=oldUpdate(dt);step(dt);return result;
 };
 const oldStart=g.startNew.bind(g);g.startNew=(...args)=>{const previous={world:g.world,state,task,message},result=oldStart(...args);if(g.world===previous.world){state=previous.state;task=previous.task;message=previous.message;}return result;};
 const menu=g.returnToMenu.bind(g);g.returnToMenu=(...args)=>{cancel();return menu(...args);};
 return api;
}
const api=Object.freeze({initial,validate,install});root.DeadwallWildlifeHarvest190=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
