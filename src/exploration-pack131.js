/* Long-distance logistics: real stocks, finite maintenance and physical wreck recovery. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Travel131Rules;
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
const Survey=root.DeadwallFrontierSurvey||(typeof require==='function'?require('./frontier-survey.js'):null);
const copy=x=>JSON.parse(JSON.stringify(x));
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const initial=()=>({version:1,tuning:null,wrecks:[]});
const validationWorlds=new Map();
function wreckReserve(seed,id){return R.wreckMinimum+G.hash(seed,id,'mechanical-reserve131')%R.wreckVariance;}
function resolveWreck(world,id){if(typeof id!=='string'||!/^P\d{4}:car:\d+$/.test(id))return null;const p=world.pois.find(p=>p.id===id.split(':')[0]);return p?.parking.find(v=>v.id===id&&!['bike','skate'].includes(v.type))||null;}
function normalize(raw,full){
 if(raw===undefined)return initial();
 const fail=()=>{throw Error('Logistique lointaine : registre invalide.');};
 if(!raw||Array.isArray(raw)||raw.version!==1||Object.keys(raw).some(k=>!['version','tuning','wrecks'].includes(k))||!Array.isArray(raw.wrecks)||raw.wrecks.length>R.maxWrecks)fail();
 const out=initial();
 if(raw.tuning!==null){const t=raw.tuning;if(!t||Object.keys(t).some(k=>!['id','remaining'].includes(k))||!Number.isInteger(t.id)||!finite(t.id,1,0x7ffffffe)||!finite(t.remaining,Number.MIN_VALUE,R.serviceDistance))fail();if(full&&(full.expeditions?.vehicle?.id!==t.id||full.expeditions.vehicle.health<=0||C.WorldEvolution?.RULES.vehicles[full.worldEvolution?.fleet?.active]?.fuel===0))fail();out.tuning={id:t.id,remaining:t.remaining};}
 let world=null;
 if(full&&raw.wrecks.length){const key=full.worldSeed+':'+full.frontier?.generation;if(!validationWorlds.has(key)){const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null);validationWorlds.set(key,W.create(full.worldSeed,full.frontier.generation));if(validationWorlds.size>3)validationWorlds.delete(validationWorlds.keys().next().value);}world=validationWorlds.get(key);}
 const ids=new Set();
 for(const record of raw.wrecks){
  if(!record||Object.keys(record).some(k=>!['id','recovered'].includes(k))||typeof record.id!=='string'||!/^P\d{4}:car:\d+$/.test(record.id)||ids.has(record.id)||!Number.isInteger(record.recovered)||!finite(record.recovered,1,R.wreckMinimum+R.wreckVariance-1))fail();
  if(world){const v=resolveWreck(world,record.id);if(!v||record.recovered>wreckReserve(full.worldSeed,record.id)||(full.frontier.taken[record.id]||0)<v.amount-1e-7||!full.frontier.seen.includes(record.id.split(':')[0]))fail();}
  ids.add(record.id);out.wrecks.push({id:record.id,recovered:record.recovered});
 }
 return out;
}
function install(g){
 if(g.travel131)return g.travel131;
 if(!g.expansions?.register)throw Error('Centre des opérations absent.');
 let state=initial(),task=null,message='';
 const wrap=(name,fn)=>{const old=g[name]?.bind(g);if(old)g[name]=(...args)=>fn(old,...args);};
 const alive=()=>g.player&&!g.player.dead&&g.player.health>0;
 const pose=()=>{const f=g.frontier.position();return f.active?{...f,domain:'region'}:{domain:'local',active:false,x:g.player.x,y:g.player.y,z:0,inside:null,car:null};};
 const car=()=>g.expeditions.car();
 const profile=()=>g.worldEvolution?.vehicleProfile()||C.WorldEvolution.RULES.vehicles.break;
 const available=()=>g.state==='playing'&&!g.gameOver&&alive()&&g.expansions.canAct();
 const fail=reason=>{message=reason;return{ok:false,reason};};
 const save=text=>{message=text;g.audio.ui?.();g.save(false);return{ok:true};};
 const homeNear=()=>!g.frontier.active()&&!!g.core()&&g.workerCanWorkAt(g.player,g.core(),R.homeReach);
 function reconcile(){if(state.tuning&&(car()?.id!==state.tuning.id||car().health<=0||state.tuning.remaining<=1e-7))state.tuning=null;}
 function safe(p){if(p.active){const f=g.frontier.overview();return ![...f.enemies,...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])].some(e=>!e.dead&&(e.hp??e.health)>0&&e.z===p.z&&(p.z===0||(e.inside??e.poi)===p.inside)&&Math.hypot(e.x-p.x,e.y-p.y)<R.danger&&f.world.line(p,e,p.z,p.inside,null,.05));}return !g.zombies.some(z=>!z.dead&&z.health>0&&Math.hypot(z.x-p.x,z.y-p.y)<R.danger*C.Frontier.RULES.metreUnits&&g.hostileLineClear(g.player,z));}
 function atCar(p){const v=car();if(!v||v.health<=0||p.active&&p.car?.driving||!p.active&&g.expeditions.driving())return false;if(p.active)return p.z===0&&!p.inside&&g.frontier.vehiclePresent();if(v.regionAway)return false;return Math.hypot(v.x-p.x,v.y-p.y)<=R.localCarReach&&g.hostileLineClear(g.player,v);}
 function interrupted(){return !alive()||g.player.reload>0||g.input.mouseDown||g.input.touchFire||[...g.input.keys,...g.input.pressed].some(k=>/^Key[WAZQSDERFVG]$|^Arrow|^Page|^Digit[123]$/.test(k));}
 function baseReason(){if(!available())return'Reprenez la campagne avec le commandant disponible.';if(task||g.expansions.busy('exploration131'))return'Terminez ou interrompez l’intervention en cours.';if(g.expeditions.driving()||g.frontier.position().car?.driving)return'Arrêtez-vous puis descendez du véhicule.';if(g.player.reload>0)return'Terminez le rechargement.';return'';}
 function manifest(id){const plan=R.manifests[id];if(!plan)return null;let room=Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry));const transfer={};for(const [key,target]of Object.entries(plan.stock)){const n=Math.min(Math.max(0,target-g.player.carry[key]),Math.max(0,g.resources[key]),room);transfer[key]=n;room-=n;}return{plan,transfer,total:Object.values(transfer).reduce((a,b)=>a+b,0)};}
 function nearestWreck(){const p=pose();if(!p.active||p.z!==0||p.inside||p.car?.driving)return null;return Survey.targets(g.frontier.world(),p,g.frontier.snapshot().taken,R.wreckReach).find(v=>v.kind==='car'&&!['bike','skate'].includes(v.type))||null;}
 function wreckStatus(id){const v=resolveWreck(g.frontier.world(),id);if(!v)return null;const total=wreckReserve(g.world.seed,id),used=state.wrecks.find(r=>r.id===id)?.recovered||0;return{total,recovered:used,remaining:total-used};}
 function check(kind,arg){
  reconcile();const reason=baseReason();if(reason)return{ok:false,reason};const p=pose();if(!safe(p))return{ok:false,reason:'Éloignez les infectés avant de manipuler les fournitures.'};
  if(kind==='pack'){
   if(!homeNear())return{ok:false,reason:'Préparez le sac auprès du dépôt de D-17.'};
   const plan=manifest(arg);if(!plan)return{ok:false,reason:'Profil de voyage inconnu.'};if(plan.total<=1e-7)return{ok:false,reason:'Sac prêt, plein ou fournitures absentes au dépôt.'};
   return{ok:true,seconds:R.packingSeconds,transfer:plan.transfer,cost:{}};
  }
  if(kind==='siphon'||kind==='service'){
   if(!atCar(p))return{ok:false,reason:'Rejoignez le véhicule garé par un accès libre, au niveau du sol.'};
   if(profile().tank<=0||profile().fuel<=0)return{ok:false,reason:'Ce véhicule utilise la propulsion humaine.'};
   if(kind==='siphon'){
    const amount=Math.min(R.siphonBatch,car().fuel,Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry)));
    return amount>1e-7?{ok:true,seconds:R.siphonSeconds,amount,cost:{},carId:car().id}:{ok:false,reason:'Réservoir vide ou sac plein.'};
   }
   if(state.tuning)return{ok:false,reason:'La révision est encore efficace ; parcourez sa distance restante.'};
   if(!C.canAfford(g.player.carry,R.serviceCost))return{ok:false,reason:'Révision : '+C.resourceText(R.serviceCost)+' dans le sac.'};
   return{ok:true,seconds:R.serviceSeconds,cost:R.serviceCost,carId:car().id};
  }
  if(kind==='dismantle'){
   if(!p.active||p.z!==0||p.inside)return{ok:false,reason:'Rejoignez une épave extérieure, au niveau du sol.'};
   const candidate=nearestWreck();if(!candidate||candidate.id!==arg)return{ok:false,reason:'Approchez de l’épave par un accès libre.'};
   if(candidate.left>1e-7)return{ok:false,reason:'Fouillez d’abord tout le coffre avec E.'};
   const status=wreckStatus(arg);if(!status?.remaining)return{ok:false,reason:'Mécanique entièrement récupérée : cette épave est épuisée.'};
   if(!state.wrecks.some(r=>r.id===arg)&&state.wrecks.length>=R.maxWrecks)return{ok:false,reason:'Carnet de récupération complet.'};
   if(!C.canAfford(g.player.carry,R.dismantleCost))return{ok:false,reason:'Préparez 1 ferraille dans le sac pour l’outillage consommable.'};
   const room=Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry)+C.bagTotal(R.dismantleCost));
   const amount=Math.min(status.remaining,R.dismantleBatch,Math.floor(room));
   if(amount<=0)return{ok:false,reason:'Libérez une place dans le sac.'};
   return{ok:true,seconds:R.dismantleSeconds,cost:R.dismantleCost,amount};
  }
  return{ok:false,reason:'Intervention inconnue.'};
 }
 function begin(kind,arg){const q=check(kind,arg);if(!q.ok)return fail(q.reason);task={kind,arg,...q,position:pose(),elapsed:0,health:g.player.health,carHealth:car()?.health??0,pulse:0};g.releaseInputs();message='Travail sur place : déplacement, tir ou dégâts interrompent sans dépense.';return{ok:true};}
 function cancel(){if(!task)return false;task=null;message='Intervention interrompue. Fournitures conservées.';return true;}
 function step(dt){
  if(!task||!finite(dt,Number.MIN_VALUE,R.maxStep)||g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver)return;
  const t=task,p=pose(),same=p.domain===t.position.domain&&p.z===t.position.z&&p.inside===t.position.inside,tolerance=p.active?R.moveTolerance:R.moveTolerance*C.Frontier.RULES.metreUnits;
  if(!same||Math.hypot(p.x-t.position.x,p.y-t.position.y)>tolerance||interrupted()||g.player.health<t.health||t.carId&&((car()?.id!==t.carId)||(car()?.health??0)<t.carHealth)){cancel();return;}
  task=null;const q=check(t.kind,t.arg);task=t;if(!q.ok){cancel();message=q.reason;return;}
  t.elapsed+=dt;t.pulse-=dt;
  if(p.active&&['service','dismantle'].includes(t.kind)&&t.pulse<=0){g.frontier.signalAt?.({...p,z:0},R.workNoise);g.worldEvolution?.hear?.(p,R.workNoise);t.pulse=R.noisePulse;}
  g.player.action=t.kind==='dismantle'?'harvest':'build';
  if(t.elapsed+1e-8<t.seconds)return;
  task=null;
  if(t.kind==='pack'){for(const[k,n]of Object.entries(q.transfer)){g.resources[k]-=n;g.player.carry[k]+=n;}save('Sac préparé : '+R.manifests[t.arg].name+'. Les quantités viennent du dépôt.');}
  else if(t.kind==='siphon'){car().fuel=Math.max(0,car().fuel-q.amount);g.player.carry.fuel+=q.amount;save(q.amount.toFixed(1)+' carburant récupéré dans le sac.');}
  else if(t.kind==='service'){C.spend(g.player.carry,q.cost);state.tuning={id:q.carId,remaining:R.serviceDistance};save('Révision terminée : consommation réduite de 20 % sur 2 km.');}
  else{C.spend(g.player.carry,q.cost);g.player.carry.scrap+=q.amount;let record=state.wrecks.find(r=>r.id===t.arg);if(!record){record={id:t.arg,recovered:0};state.wrecks.push(record);}record.recovered+=q.amount;g.stats.gathered+=q.amount;save(q.amount+' pièces récupérées. La réserve mécanique de cette épave diminue.');}
 }
 function remaining(id){reconcile();return state.tuning&&state.tuning.id===id?state.tuning.remaining:0;}
 function fuelCost(metres,rate,id){if(!finite(metres,0,1e9)||!finite(rate,0,1e3))return 0;return rate*(metres-Math.min(metres,remaining(id))*R.fuelDiscount);}
 function fuelDistance(fuel,rate,id){if(!finite(fuel,0,1e9)||!finite(rate,0,1e3))return 0;if(rate===0)return Infinity;const tuned=remaining(id),discountedRate=rate*(1-R.fuelDiscount),firstCost=tuned*discountedRate;return fuel<=firstCost?fuel/discountedRate:tuned+(fuel-firstCost)/rate;}
 function consumeDistance(metres,id){if(!finite(metres,0,1e9))return;const left=remaining(id);if(left>0){state.tuning.remaining=Math.max(0,left-metres);reconcile();}}
 function overview(){reconcile();const p=pose(),v=car(),w=p.active?nearestWreck():null,s=w&&wreckStatus(w.id);return{summary:message||'Préparez le retour avant de partir. Les fournitures voyagent dans le sac et le coffre.',rows:[{label:'Sac',value:C.bagTotal(g.player.carry).toFixed(1)+' / '+g.player.carryCapacity},{label:'Véhicule',value:v&&v.health>0?profile().name:'Aucun véhicule utilisable'},{label:'Révision',value:state.tuning?Math.ceil(state.tuning.remaining)+' m restants · −20 % carburant':'À effectuer sur place'},{label:'Épave proche',value:w?(s.remaining+' pièces mécaniques · '+(w.left>0?'coffre à fouiller':'coffre vidé')):'Aucune accessible'},{label:'Intervention',value:task?Math.floor(task.elapsed/task.seconds*100)+' %':'Aucune'}],task:task?{kind:task.kind,progress:task.elapsed/task.seconds}:null};}
 function actions(){const list=[],add=(id,label,kind,arg)=>{const q=check(kind,arg),transfer=kind==='pack'?manifest(arg)?.transfer:null;const quantities=transfer?Object.entries(transfer).filter(([,n])=>n>1e-7).map(([key,n])=>Number(n.toFixed(2)).toLocaleString('fr-FR')+' '+C.RESOURCE_META[key].label.toLowerCase()).join(' · '):'';list.push({id,label,description:transfer?quantities?'Dépôt → sac : '+quantities+'. Prélevés après la préparation, sans création de fournitures.':'Aucun prélèvement prévu : vérifiez le sac et les réserves.':undefined,disabled:!q.ok,reason:q.reason||q.seconds+' s sur place',run:()=>begin(kind,arg),close:true});};for(const[id,m]of Object.entries(R.manifests))add('pack-'+id,'Préparer : '+m.name,'pack',id);add('siphon','Siphonner 6 carburants du réservoir','siphon');add('service','Réviser le moteur · 8 ferrailles, 1 carburant','service');add('dismantle','Démonter l’épave · 1 ferraille','dismantle',nearestWreck()?.id);if(task)list.push({id:'cancel',label:'Interrompre le travail',run:()=>({ok:cancel()}),close:true});return list;}
 const api={begin,cancel,busy:()=>!!task,preview:check,overview,actions,manifest,wreckStatus,wreckVisual:id=>{const record=state.wrecks.find(r=>r.id===id);return record?{dismantled:true,exhausted:record.recovered>=wreckReserve(g.world.seed,id)}:null;},step,fuelCost,fuelDistance,consumeDistance,snapshot:()=>{reconcile();return copy(state);}};
 g.travel131=Object.freeze(api);
 g.expansions.register({id:'exploration131',title:'Voyages lointains',overview,actions,busy:api.busy,validate:normalize,snapshot:api.snapshot,restore:raw=>{state=normalize(raw);task=null;message='';},reset:()=>{state=initial();task=null;message='';}});
 wrap('update',(old,dt)=>{if(task&&(!alive()||interrupted()))cancel();const result=old(dt);if(task&&(!alive()||g.gameOver||g.state!=='playing'))cancel();if(task)step(dt);return result;});
 wrap('updateInteraction',(old,...a)=>{if(task){g.interactionText='Logistique : '+Math.floor(task.elapsed/task.seconds*100)+' % · restez sur place';return;}return old(...a);});
 wrap('returnToMenu',(old,...a)=>{cancel();return old(...a);});
 return api;
}
const API={initial,normalize,install,wreckReserve,resolveWreck};root.DeadwallExploration131=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;if(root.DEADWALL?.expansions)install(root.DEADWALL);
})(globalThis);
