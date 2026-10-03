/* D-17 1.31 — paid, physical preparations for long expeditions. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.Defense131Rules;
const T=root.DeadwallTactics||(typeof require==='function'?require('./tactics.js'):null);
const copy=v=>JSON.parse(JSON.stringify(v)),live=v=>v&&!v.dead&&v.health>0;
const finite=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
const integer=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const directions=['Est','Sud','Ouest','Nord'];
function initial(){return{version:1,posts:[]};}
function normalize(raw,full){
 if(raw===undefined)return initial();
 const fail=why=>{throw Error('Préparations D-17 : '+why+'.');};
 if(!raw||Array.isArray(raw)||raw.version!==1||Object.keys(raw).some(k=>!['version','posts'].includes(k))||!Array.isArray(raw.posts)||raw.posts.length>R.maxPosts)fail('registre invalide');
 const ids=new Set(),buildings=full?.buildings&&new Map(full.buildings.map(b=>[b.id,b]));
 const posts=raw.posts.map(p=>{
  if(!p||Array.isArray(p)||Object.keys(p).some(k=>!['id','gate','maintenance','work','arc'].includes(k))||!integer(p.id,1,0x7ffffffe)||ids.has(p.id)||!finite(p.work,0,R.workCapacity)||(p.arc!==null&&!integer(p.arc,0,3)))fail('poste invalide');
  ids.add(p.id);
  let gate=null,maintenance=null;
  if(p.gate!==null){const a=p.gate;if(!a||Object.keys(a).some(k=>!['enabled','manualPhase','delay'].includes(k))||typeof a.enabled!=='boolean'||!(a.manualPhase===null||['calm','warning','assault','aftermath'].includes(a.manualPhase))||!finite(a.delay,0,R.gateSeconds))fail('consigne de porte invalide');gate={enabled:a.enabled,manualPhase:a.manualPhase,delay:a.delay};}
  if(p.maintenance!==null){const a=p.maintenance;if(!a||Array.isArray(a)||Object.keys(a).some(k=>!Object.hasOwn(R.maintenanceCost,k)))fail('réserve invalide');maintenance={};for(const key of Object.keys(R.maintenanceCost)){if(!finite(a[key],0,R.maintenanceCost[key]))fail('matériaux de réfection invalides');maintenance[key]=a[key];}}
  if(buildings){const b=buildings.get(p.id),d=b&&C.BUILDINGS[b.type];if(!d||b.health<=0)fail('support absent');if(gate&&(!d.gate||b.progress<1)||maintenance&&b.progress<1||p.arc!==null&&(!d.range||b.progress<1)||p.work>0&&b.progress>=1)fail('support incompatible');}
  return{id:p.id,gate,maintenance,work:p.work,arc:p.arc};
 });
 return{version:1,posts};
}
function install(g){
 if(!g||g.defense131)return g?.defense131;
 if(!g.expansions?.register)throw Error('Centre des extensions absent.');
 let state=initial(),byId=new Map(),message='',workerPass=false,inspection=0;
 const wired=new WeakSet();
 const wrap=(name,fn)=>{const old=g[name]?.bind(g);if(old)g[name]=(...a)=>fn(old,...a);};
 const running=()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay;
 const acting=()=>g.expansions.canAct()&&!g.frontier?.active?.()&&!g.expeditions?.driving?.();
 const building=id=>{const b=g.world.buildings.get(id);return live(b)?b:null;};
 const target=()=>building(g.selectedBuilding?.id);
 const touch=b=>!!b&&g.workerCanWorkAt(g.player,b,R.reach);
 const secure=b=>!g.zombies.some(z=>live(z)&&Math.hypot(z.x-b.x,z.y-b.y)<R.dangerRange&&g.hostileLineClear(z,b));
 function index(){byId=new Map(state.posts.map(p=>[p.id,p]));}
 function reconcile(){
  state.posts=state.posts.filter(p=>{const b=building(p.id);if(!b)return false;if(b.completed)p.work=0;if(!b.def.gate)p.gate=null;if(!b.def.range)p.arc=null;return p.gate||p.maintenance||p.work>0||p.arc!==null;});index();
 }
 function record(id){let p=byId.get(id);if(!p){p={id,gate:null,maintenance:null,work:0,arc:null};state.posts.push(p);byId.set(id,p);}return p;}
 function changed(text){message=text;g.audio.ui?.();g.save(false);return{ok:true};}
 function reject(reason){message=reason;return{ok:false,reason};}
 function check(kind,id){
  if(!['gate','maintenance','work','arc'].includes(kind))return{ok:false,reason:'Préparation inconnue.'};
  const b=building(id),p=byId.get(id),cost=R[kind+'Cost'];
  if(!acting())return{ok:false,reason:'Rejoignez D-17 à pied, en vie.'};
  if(g.expansions.busy('defense131'))return{ok:false,reason:'Terminez ou interrompez la préparation en cours.'};
  if(!b||!touch(b))return{ok:false,reason:'Approchez la structure sélectionnée par un accès libre.'};
  if(!secure(g.player)||!secure(b))return{ok:false,reason:'Écartez les infectés avant la préparation.'};
  if(!p&&state.posts.length>=R.maxPosts)return{ok:false,reason:'Limite des postes préparés atteinte.'};
  if(kind==='gate'&&(!b.completed||!b.def.gate))return{ok:false,reason:'Sélectionnez une porte achevée.'};
  if(kind==='arc'&&(!b.completed||!b.def.range))return{ok:false,reason:'Sélectionnez un poste de tir achevé.'};
  if(kind==='maintenance'&&!b.completed)return{ok:false,reason:'Achevez le support avant la réfection.'};
  if(kind==='work'&&(b.completed||g.phase!=='calm'))return{ok:false,reason:'Sélectionnez un chantier pendant le calme.'};
  const existing=kind==='arc'?p?.arc!==null&&p?.arc!==undefined:kind==='work'?p?.work>0:!!p?.[kind==='gate'?'gate':'maintenance'];
  if(existing&&['work','maintenance'].includes(kind))return{ok:false,reason:'Cette réserve est déjà en place.'};
  const payable=existing?{}:cost;
  if(!C.canAfford(g.resources,payable))return{ok:false,reason:'Réserves requises : '+C.resourceText(payable)+'.'};
  return{ok:true,b,cost:payable};
 }
 function configureGate(id,enabled=true){
  if(typeof enabled!=='boolean')return reject('Consigne invalide.');
  if(!enabled&&!byId.get(id)?.gate)return reject('Aucune consigne installée sur cette porte.');
  reconcile();const q=check('gate',id);if(!q.ok)return reject(q.reason);
  C.spend(g.resources,q.cost);const p=record(id);p.gate={enabled,manualPhase:null,delay:0};
  return changed(enabled?'Consigne installée : passage allié au calme, verrouillage à l’alerte. Une présence bloque la fermeture.':'Consigne suspendue. La position actuelle de la porte est conservée.');
 }
 function startMaintenance(id){
  reconcile();const q=check('maintenance',id);if(!q.ok)return reject(q.reason);C.spend(g.resources,q.cost);record(id).maintenance=copy(R.maintenanceCost);
  for(const u of g.units)if(u.kind==='engineer')u.think=0;
  return changed('Matériaux réservés sur place. Les ingénieurs accessibles réparent jusqu’à '+Math.round(R.maintenanceTarget*100)+' %, à leur cadence habituelle.');
 }
 function recoverMaintenance(id){
  if(g.expansions.busy('defense131'))return reject('Terminez ou interrompez la préparation en cours.');
  const b=building(id),p=byId.get(id);if(!acting()||!touch(b)||!secure(g.player)||!p?.maintenance)return reject('Rejoignez la caisse de réfection en sécurité.');
  let moved=0;for(const k of Object.keys(R.maintenanceCost)){const n=Math.min(p.maintenance[k],Math.max(0,g.storage-g.resources[k]));g.resources[k]+=n;p.maintenance[k]-=n;moved+=n;}
  if(Object.values(p.maintenance).every(v=>v<=1e-9))p.maintenance=null;
  if(!moved&&p.maintenance)return reject('Dépôt plein : les matériaux restent sur place.');
  reconcile();return changed('Reliquat restitué dans la limite du stockage ; aucune ressource créée.');
 }
 function equipWorksite(id){reconcile();const q=check('work',id);if(!q.ok)return reject(q.reason);C.spend(g.resources,q.cost);record(id).work=R.workCapacity;wire();return changed('Outillage livré : +'+Math.round(R.workBonus*100)+' % au travail réel des ouvriers, avec une réserve finie de '+R.workCapacity+' unités de travail.');}
 function setArc(id,direction){
  if(direction!==null&&!integer(direction,0,3))return reject('Orientation invalide.');
  reconcile();const q=check('arc',id);if(!q.ok)return reject(q.reason);
  if(direction===null){const p=byId.get(id);if(p)p.arc=null;reconcile();return changed('Poste libéré : couverture à 360°. Matériel de balisage non remboursé.');}
  C.spend(g.resources,q.cost);record(id).arc=direction;return changed('Secteur de tir : '+directions[direction]+' sur 90°. Les autres directions restent à couvrir.');
 }
 function wire(){for(const p of state.posts){const b=building(p.id);if(!b||!p.work||wired.has(b))continue;const old=b.work;b.work=function(amount){
   const post=byId.get(b.id),extra=workerPass&&running()&&!b.completed&&post?.work>0&&finite(amount,Number.MIN_VALUE,R.maxWorkInput)?Math.min(post.work,amount*R.workBonus):0;
   const before=b.progress,result=old.call(b,amount+extra);
   if(extra&&b.progress>before)post.work=Math.max(0,post.work-Math.min(extra,(b.progress-before)*Math.max(1,b.def.buildTime)));
   return result;
  };wired.add(b);}}
 function actors(){return[...(!g.frontier?.active?.()?[g.player]:[]),...g.units,...g.zombies,g.expeditions?.entity?.(),...(g.territories?.truckEntities?.()||[])].filter(v=>v&&live(v));}
 function step(dt){
  if(!running()||!finite(dt,Number.MIN_VALUE,R.maxStep))return;
  inspection-=dt;if(inspection<=0){inspection=R.inspectionSeconds;reconcile();wire();}
  for(const p of state.posts){const a=p.gate,b=building(p.id);if(!a?.enabled||!b?.completed)continue;
   if(a.manualPhase!==null){if(a.manualPhase===g.phase)continue;a.manualPhase=null;a.delay=0;}
   const mode=g.phase==='calm'?'auto':'closed';
   if(b.gateMode===mode){a.delay=0;continue;}
   a.delay=Math.min(R.gateSeconds,a.delay+dt);if(a.delay<R.gateSeconds)continue;
   if(b.siegeOffline||b.territoryOffline||b.gridOffline||b.dayOffline||b.def.powerUse&&!b.powered||!T.gateChangeAllowed(b,mode,actors()))continue;
   b.gateMode=mode;a.delay=0;g.world.navigationVersion++;g.world.flowDirty=true;g.flowTimer=0;g.nightwatch?.invalidate();
  }
 }
 function maintenanceReady(u,b){
  const m=byId.get(b?.id)?.maintenance;
  return !!(m&&live(b)&&b.completed&&b.health<b.maxHealth*R.maintenanceTarget&&Math.hypot(u.x-b.x,u.y-b.y)<=C.NPC_RULES.searchRadius&&Object.entries(g.engineerRepairRates(b)).every(([k,rate])=>!rate||m[k]>1e-9)&&g.workerBuildExit(u,b,'repair'));
 }
 wrap('engineerTargetValid',(old,u,b)=>byId.get(b?.id)?.maintenance?maintenanceReady(u,b):old(u,b));
 // Keep the engine's priority, damage and distance ordering for every repair source.
 // Its candidate search calls the wrapped validity check above for reserved materials.
 wrap('repairWithEngineer',(old,u,b,dt,point)=>{
  const m=byId.get(b?.id)?.maintenance;if(!m)return old(u,b,dt,point);
  if(!running()||!finite(dt,Number.MIN_VALUE,R.maxStep)||u.kind!=='engineer'||!live(u)||g.workerOrder==='retreat'||!maintenanceReady(u,b)||g.world.buildings.get(b.id)!==b)return 0;
  point=point||g.workerBuildExit(u,b,'repair');if(!point||!g.workerCanWorkAt(u,point,C.NPC_RULES.repairRange))return 0;
  const rates=g.engineerRepairRates(b);let amount=Math.max(0,Math.min(b.maxHealth*R.maintenanceTarget-b.health,dt*C.NPC_RULES.repairPerSecond));
  for(const[k,rate]of Object.entries(rates))if(rate>0)amount=Math.min(amount,m[k]/rate);
  if(amount>0){for(const[k,rate]of Object.entries(rates))if(rate>0)m[k]=Math.max(0,m[k]-amount*rate);b.health+=amount;}return amount;
 });
 wrap('updateUnits',(old,dt)=>{wire();workerPass=running()&&finite(dt,Number.MIN_VALUE,R.maxStep);try{return old(dt);}finally{workerPass=false;}});
 wrap('update',(old,dt)=>{const r=old(dt);step(dt);return r;});
 wrap('setGateMode',(old,mode,b=g.selectedBuilding)=>{const r=old(mode,b),a=byId.get(b?.id)?.gate;if(r&&a){a.manualPhase=g.phase;a.delay=0;g.save(false);}return r;});
 function arcTarget(old,x,y,range){
  const b=g.world.at(x,y),p=b&&byId.get(b.id);if(!b||b.x!==x||b.y!==y||p?.arc===null||p?.arc===undefined)return old(x,y,range);
  let best=range*range,result=null;const angle=p.arc*Math.PI/2,black=g.nightwatch?.isBlackout(),lights=black?g.nightwatch.sources(false):null;
  for(const z of g.nearbyZombies(x,y,range)){const dx=z.x-x,dy=z.y-y,d=dx*dx+dy*dy;if(!live(z)||d>=best)continue;
   const a=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
   if(Math.abs(a)>R.arcHalfAngle||black&&!g.nightwatch.lit(z,lights))continue;best=d;result=z;
  }return result;
 }
 if(g.nightwatch){const old=g.nightwatch.target;g.nightwatch=Object.freeze({...g.nightwatch,target:(...a)=>arcTarget(old,...a)});}else wrap('nearestZombie',(old,...a)=>arcTarget(old,...a));
 function drawGround(ctx,view){
  if(g.frontier?.active?.()&&!view?.homeProjection)return;
  const b=target(),p=b&&byId.get(b.id);if(!b||!p)return;
  ctx.save();ctx.strokeStyle='#a8c5b7';ctx.fillStyle='rgba(117,171,148,.09)';ctx.lineWidth=2;
  if(p.arc!==null){const a=p.arc*Math.PI/2;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.arc(b.x,b.y,b.def.range,a-R.arcHalfAngle,a+R.arcHalfAngle);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.setLineDash([5,5]);ctx.strokeRect(b.left-5,b.top-5,b.right-b.left+10,b.bottom-b.top+10);ctx.restore();
 }
 wrap('drawGround',(old,ctx,view,...args)=>{const r=old(ctx,view,...args);drawGround(ctx,view);return r;});
 wrap('drawBuilding',(old,ctx,b,...args)=>{const r=old(ctx,b,...args),p=byId.get(b.id);if(!p||!live(b))return r;ctx.save();
  const badges=[[!!p.gate,p.gate?.enabled?'#9fbea2':'#756d64'],[!!p.maintenance,'#6f9baf'],[p.work>0,'#c5a773'],[p.arc!==null,'#bed29c']];
  badges.forEach(([on,color],i)=>{if(on){ctx.fillStyle='#252d28';ctx.fillRect(b.left+4+i*10,b.bottom-14,9,10);ctx.fillStyle=color;ctx.fillRect(b.left+6+i*10,b.bottom-12,5,6);}});ctx.restore();return r;
 });
 function overview(){
  reconcile();const b=target(),p=b&&byId.get(b.id),m=p?.maintenance;
  return{summary:message||'Préparez les accès et les équipes avant une longue sortie. Les stocks engagés restent finis.',rows:[
   {label:'Support sélectionné',value:b?b.def.name+' #'+b.id:'Sélectionnez une structure sur le terrain'},
   {label:'Consigne de porte',value:p?.gate?(p.gate.enabled?(p.gate.manualPhase?'Commande manuelle jusqu’au prochain changement de phase':'Alliés au calme · verrouillée dès l’alerte'):'Suspendue'):'Non installée'},
   {label:'Réfection réservée',value:m?C.resourceText(m)+' · arrêt à '+Math.round(R.maintenanceTarget*100)+' %':'Aucune · ingénieur vivant requis'},
   {label:'Outillage chantier',value:p?.work>0?p.work.toFixed(1)+' unités de travail supplémentaire':'Non installé · travail ouvrier requis'},
   {label:'Secteur de tir',value:p?.arc!==null&&p?.arc!==undefined?directions[p.arc]+' · 90°':'Couverture habituelle 360°'},
   {label:'Postes préparés',value:state.posts.length+' / '+R.maxPosts}]};
 }
 function actions(){
  reconcile();const id=target()?.id,p=byId.get(id),result=[];
  const add=(kind,label,run,key=kind)=>{const q=check(kind,id);result.push({id:key,label,disabled:!q.ok,reason:q.reason||'',run});};
  add('gate',(p?.gate?.enabled?'Suspendre la consigne de porte':'Consigne jour / alerte')+(p?.gate?'':' · '+C.resourceText(R.gateCost)),()=>configureGate(id,!p?.gate?.enabled));
  add('maintenance','Réserver la réfection · '+C.resourceText(R.maintenanceCost),()=>startMaintenance(id));
  if(p?.maintenance)result.push({id:'recover-maintenance',label:'Récupérer les matériaux restants',disabled:!acting()||!touch(target()),run:()=>recoverMaintenance(id)});
  add('work','Outiller le chantier · '+C.resourceText(R.workCost),()=>equipWorksite(id));
  for(let d=0;d<4;d++)add('arc','Couvrir le '+directions[d].toLowerCase()+' · 90°'+(p?.arc!==null&&p?.arc!==undefined?'':' · '+C.resourceText(R.arcCost)),()=>setArc(id,d),'arc-'+d);
  if(p?.arc!==null&&p?.arc!==undefined)result.push({id:'arc-off',label:'Rétablir la couverture à 360°',disabled:!acting()||!touch(target()),run:()=>setArc(id,null)});
  return result;
 }
 const api={version:'1.31.0',overview,actions,check,configureGate,startMaintenance,recoverMaintenance,equipWorksite,setArc,step,drawGround,snapshot:()=>{reconcile();return copy(state);},busy:()=>false};
 g.defense131=api;
 g.expansions.register({id:'defense131',title:'Préparer D-17',overview,actions,validate:normalize,snapshot:api.snapshot,restore:raw=>{state=normalize(raw);index();wire();inspection=0;message='';},reset:()=>{state=initial();index();inspection=0;message='';}});
 return api;
}
const API={install,normalize,initial};root.DeadwallDefense131=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;if(root.DEADWALL?.expansions)install(root.DEADWALL);
})(globalThis);
