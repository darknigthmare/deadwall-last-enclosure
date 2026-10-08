/* Local logistics uses existing finite nodes and player supplies. No loot is minted. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.ExplorePackRules;
const typeMaps=new Map();
function nodeTypes(full){if(!full||!root.DEADWALL?.world?.constructor)return null;const key=full.worldSeed+':'+full.frontier?.generation;if(typeMaps.has(key))return typeMaps.get(key);const world=new root.DEADWALL.world.constructor(full.worldSeed),types=new Map(world.nodes.map(n=>[n.id,n.type]));if(full.frontier?.generation>=4){const E=root.DeadwallExploration125||(typeof require==='function'?require('./exploration-125.js'):null);for(const n of E?.createFeaturePlan(full.worldSeed).stationLoot||[])types.set(n.id,n.type);}typeMaps.set(key,types);if(typeMaps.size>3)typeMaps.delete(typeMaps.keys().next().value);return types;}
const copy=v=>JSON.parse(JSON.stringify(v)),initial=()=>({version:1,serial:1,surveys:[],caches:[],markers:[],cargo:[],delivered:0});
function normalize(raw,full){
 if(raw===undefined)return initial();
 const bad=()=>{throw Error('Registre de prospection invalide.');};
 const n=(v,a,b,integer=false)=>{if(!Number.isFinite(v)||v<a||v>b||integer&&!Number.isInteger(v))bad();return v;};
 if(!raw||raw.version!==1)bad();
 const out=initial(),used=new Set(),types=nodeTypes(full),nodeIds=full?.nodes?new Set(full.nodes.map(row=>row[0])):null;
 out.serial=n(raw.serial,1,1e9,true);out.delivered=n(raw.delivered,0,1e12);
 const list=(a,max)=>{if(!Array.isArray(a)||a.length>max)bad();return a;};
 const id=v=>{n(v,1,out.serial-1,true);if(used.has(v))bad();used.add(v);return v;};
 const pos=d=>({x:n(d.x,0,C.WORLD_SIZE||4096),y:n(d.y,0,C.WORLD_SIZE||4096)});
 const node=v=>{n(v,0,1e9,true);if(nodeIds&&!nodeIds.has(v))bad();return v;};
 const seen=new Set();for(const s of list(raw.surveys,R.maxSurveys)){const nodeId=node(s.nodeId);if(seen.has(nodeId)||!C.RESOURCE_KEYS.includes(s.type)||types&&types.get(nodeId)!==s.type)bad();seen.add(nodeId);out.surveys.push({nodeId,type:s.type,...pos(s)});}
 for(const c of list(raw.caches,R.maxCaches)){const bag=C.makeBag();for(const k of C.RESOURCE_KEYS)bag[k]=n(c.stock?.[k],0,R.cacheCapacity);if(C.bagTotal(bag)>R.cacheCapacity+.000001)bad();out.caches.push({id:id(c.id),...pos(c),stock:bag});}
 for(const m of list(raw.markers,R.maxMarkers))out.markers.push({id:id(m.id),...pos(m)});
 let held=0;for(const p of list(raw.cargo,R.maxCargo)){if(!C.RESOURCE_KEYS.includes(p.type)||!['held','ground'].includes(p.stage)||types&&types.get(p.nodeId)!==p.type)bad();if(p.stage==='held')held++;out.cargo.push({id:id(p.id),nodeId:node(p.nodeId),type:p.type,amount:n(p.amount,.000001,R.cargoAmount),stage:p.stage,...pos(p)});}
 if(held>1)bad();return out;
}
function install(g){
 if(g.explorationPack)return g.explorationPack;if(!g.expansions?.register)return null;
 let state=initial(),task=null,message='',previous={x:g.player.x,y:g.player.y},nearestCache=null,nearestNode=null;
 const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);};
 const local=()=>!g.frontier?.active(),standing=()=>local()&&!g.expeditions?.driving()&&g.state==='playing'&&!g.gameOver&&!g.player.dead&&g.player.health>0;
 const active=()=>standing()&&(g.expansions?.canAct?.()??g.canIssueCommand());
 const held=()=>state.cargo.find(p=>p.stage==='held'),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const cargoSpeed=()=>held()?.amount<=R.compactExtract.amount?R.compactExtract.speed:R.cargoSpeed;
 const accessible=p=>local()&&dist(g.player,p)<=R.reach&&g.hostileLineClear(g.player,p);
 const coreNear=()=>local()&&g.core()&&g.workerCanWorkAt(g.player,g.core(),100);
 const safe=()=>!g.zombies.some(z=>!z.dead&&z.health>0&&dist(z,g.player)<R.danger&&g.hostileLineClear(z,g.player));
 const fail=reason=>{message=reason;return{ok:false,reason};};
 const tell=t=>{message=t;g.audio.ui?.();g.notify?.(t,'good');g.save(false);return{ok:true};};
 function scan(){nearestNode=g.world.nodes.filter(n=>!n.depleted&&n.amount>0&&local()&&g.workerCanWorkAt(g.player,n,R.reach)).sort((a,b)=>dist(a,g.player)-dist(b,g.player)||a.id-b.id)[0]||null;nearestCache=state.caches.filter(accessible).sort((a,b)=>dist(a,g.player)-dist(b,g.player))[0]||null;}
 function resourceName(k){return C.RESOURCE_META[k]?.label||k;}
 function conflict(){return g.expansions.busy('exploration');}
 function interrupted(){return g.player.dead||g.player.health<=0||g.player.reload>0||g.input.mouseDown||g.input.touchFire||[...g.input.keys,...g.input.pressed].some(k=>/^Key[WAZQSDERF]$|^Arrow|^Page/.test(k));}
 function baseReason(){if(!standing())return'À pied dans D-17, commandant debout.';if(task||conflict())return'Une intervention est déjà en cours.';if(g.fieldcraft?.context?.().mounted)return'Quittez le poste de tir avant de travailler.';if(g.player.reload>0)return'Terminez le rechargement avant de travailler.';if(!safe())return'Éloignez les infectés avant de travailler.';return'';}
 function preview(kind,id){
  const reason=baseReason();if(reason)return{ok:false,reason};let cost={},seconds=0;
  if(['survey','extract','extract-compact'].includes(kind)){
   const node=g.world.nodes.find(n=>n.id===id);if(!node||node.depleted||!local()||!g.workerCanWorkAt(g.player,node,R.reach))return{ok:false,reason:'Approchez un gisement accessible.'};
   const surveyed=state.surveys.some(s=>s.nodeId===id);
   if(kind==='survey'){if(surveyed)return{ok:false,reason:'Ce gisement figure déjà dans vos relevés.'};if(state.surveys.length>=R.maxSurveys)return{ok:false,reason:'Carnet complet.'};cost=R.surveyCost;seconds=R.surveySeconds;}
   else{if(!surveyed)return{ok:false,reason:'Relevez ce gisement avant d’en arrimer un ballot.'};if(held()||g.essentials?.carrying?.()||g.campaignPack?.carrying?.())return{ok:false,reason:'Le dos doit être libre de cargaison.'};if(state.serial>=1e9||state.cargo.length>=R.maxCargo)return{ok:false,reason:'Récupérez les ballots déjà abandonnés.'};if(kind==='extract-compact'){cost=R.compactExtract.cost;seconds=R.compactExtract.seconds;}else seconds=R.extractSeconds;}
  }else if(kind==='cache'||kind==='marker'){
   if(state.serial>=1e9)return{ok:false,reason:'Registre plein.'};
   const p=g.player,objects=[...state.caches,...state.markers,...state.cargo.filter(q=>q.stage==='ground')];
   if(!g.friendlyPositionClear(p,p.x,p.y)||objects.some(q=>dist(p,q)<R.placementSpacing))return{ok:false,reason:'Choisissez un sol libre, à distance des autres équipements.'};
   if(kind==='cache'){if(state.caches.length>=R.maxCaches)return{ok:false,reason:'Huit caches déjà posées.'};cost=R.cacheCost;seconds=R.cacheSeconds;}
   else{if(state.markers.length>=R.maxMarkers)return{ok:false,reason:'Itinéraire complet ; effacez-le au dépôt.'};if(state.markers.length&&dist(p,state.markers.at(-1))<R.markerSpacing)return{ok:false,reason:'Éloignez-vous du dernier piquet.'};cost=R.markerCost;seconds=R.markerSeconds;}
  }else if(kind==='recover'){const p=state.cargo.find(p=>p.id===id&&p.stage==='ground');if(held()||g.essentials?.carrying?.()||g.campaignPack?.carrying?.()||!p||!accessible(p))return{ok:false,reason:'Approchez le ballot avec le dos libre.'};seconds=R.recoverSeconds;
  }else if(kind==='deliver'){const p=held();if(!p||!coreNear())return{ok:false,reason:'Rapportez un ballot au dépôt de D-17.'};if(g.resources[p.type]>=g.storage)return{ok:false,reason:'Dépôt plein pour cette ressource.'};seconds=R.deliverySeconds;
  }else if(kind==='stash'){const p=held(),cache=state.caches.find(c=>c.id===id);if(!p)return{ok:false,reason:'Arrimez un ballot avant de le ranger.'};if(!cache||!accessible(cache))return{ok:false,reason:'Approchez la cache avec le ballot par un accès libre.'};if(C.bagTotal(cache.stock)>=R.cacheCapacity-.000001)return{ok:false,reason:'Cache pleine : le ballot reste porté.'};seconds=R.stashSeconds;
  }else return{ok:false,reason:'Intervention inconnue.'};
  if(!C.canAfford(g.player.carry,cost))return{ok:false,reason:'Fournitures nécessaires dans le sac : '+Object.entries(cost).map(([k,v])=>v+' '+resourceName(k).toLowerCase()).join(', ')+'.'};
  return{ok:true,cost,seconds};
 }
 function begin(kind,id){const q=preview(kind,id);if(!q.ok)return fail(q.reason);if(!active())return fail('Reprenez la campagne pour travailler.');task={kind,id,seconds:q.seconds,elapsed:0,x:g.player.x,y:g.player.y,health:g.player.health};g.releaseInputs();message='Intervention sur place — bouger ou subir un coup l’interrompt sans dépense.';return{ok:true};}
 function cancel(){if(!task)return false;task=null;message='Intervention interrompue. Fournitures conservées.';return true;}
 function finish(t,q){
  if(t.kind==='survey'){const p=g.world.nodes.find(n=>n.id===t.id);C.spend(g.player.carry,q.cost);state.surveys.push({nodeId:p.id,type:p.type,x:p.x,y:p.y});message='Gisement relevé : vous pouvez préparer un ballot de '+resourceName(p.type).toLowerCase()+'.';}
  else if(t.kind==='cache'){C.spend(g.player.carry,q.cost);state.caches.push({id:state.serial++,x:t.x,y:t.y,stock:C.makeBag()});message='Cache posée, vide. Transférez-y des fournitures de votre sac.';}
  else if(t.kind==='marker'){C.spend(g.player.carry,q.cost);state.markers.push({id:state.serial++,x:t.x,y:t.y});message='Piquet '+state.markers.length+' planté. Le fil discret conserve votre itinéraire.';}
  else if(['extract','extract-compact'].includes(t.kind)){const n=g.world.nodes.find(n=>n.id===t.id),amount=n.harvest(Math.min(t.kind==='extract-compact'?R.compactExtract.amount:R.cargoAmount,n.amount));if(amount>0){C.spend(g.player.carry,q.cost);state.cargo.push({id:state.serial++,nodeId:n.id,type:n.type,amount,stage:'held',x:t.x,y:t.y});g.stats.gathered+=amount;message='Ballot arrimé : '+amount.toFixed(0)+' '+resourceName(n.type).toLowerCase()+'. Retour au dépôt, allure '+Math.round(cargoSpeed()*100)+' %, sprint suspendu.';}}
  else if(t.kind==='recover'){state.cargo.find(p=>p.id===t.id).stage='held';message='Ballot récupéré avec son contenu restant.';}
  else if(t.kind==='deliver'){const p=held(),amount=Math.min(p.amount,Math.max(0,g.storage-g.resources[p.type]));g.resources[p.type]+=amount;p.amount-=amount;g.depositedResources+=amount;state.delivered+=amount;if(p.amount<=.000001)state.cargo=state.cargo.filter(q=>q.id!==p.id);message=amount.toFixed(0)+' '+resourceName(p.type).toLowerCase()+' déposé'+(held()?' ; reliquat conservé dans le ballot.':'.');}
  else if(t.kind==='stash'){const p=held(),cache=state.caches.find(c=>c.id===t.id),amount=Math.min(p.amount,Math.max(0,R.cacheCapacity-C.bagTotal(cache.stock)));cache.stock[p.type]+=amount;p.amount-=amount;if(p.amount<=.000001)state.cargo=state.cargo.filter(q=>q.id!==p.id);message=amount.toFixed(0)+' '+resourceName(p.type).toLowerCase()+' rangé dans la cache'+(held()?' ; reliquat conservé dans le ballot.':'. Reprenez les fournitures dans votre sac pour les ramener au dépôt.');}
  tell(message);scan();
 }
 function step(dt){if(!Number.isFinite(dt)||dt<=0||g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver)return;
  if(held()&&(!local()||g.expeditions?.driving()||g.player.dead||g.player.health<=0)){const p=held();p.stage='ground';p.x=previous.x;p.y=previous.y;cancel();tell('Ballot laissé à son dernier emplacement dans D-17. Revenez le récupérer.');}
  if(local()&&!g.expeditions?.driving()&&!g.player.dead)previous={x:g.player.x,y:g.player.y};
  if(!task)return;const t=task;task=null;const q=preview(t.kind,t.id);task=t;
  if(!q.ok||dist(g.player,t)>R.movementTolerance||g.player.health<t.health||interrupted()){cancel();return;}
  t.elapsed+=Math.min(R.maxStep,dt);if(t.elapsed+.0000001>=q.seconds){task=null;finish(t,q);}
 }
 function transferStatus(id,direction){
  if(!active())return{ok:false,reason:'Commandant libre à pied requis.'};const reason=baseReason();if(reason)return{ok:false,reason};
  const cache=state.caches.find(c=>c.id===id);if(!cache||!accessible(cache))return{ok:false,reason:'Approchez la cache par un accès libre.'};
  const from=direction==='store'?g.player.carry:direction==='take'?cache.stock:null,to=direction==='store'?cache.stock:g.player.carry;
  if(!from)return{ok:false,reason:'Transfert inconnu.'};const room=Math.max(0,(direction==='store'?R.cacheCapacity:g.player.carryCapacity)-C.bagTotal(to));
  return room>0&&C.bagTotal(from)>0?{ok:true,from,to,room}:{ok:false,reason:'Aucun transfert possible : source vide ou destination pleine.'};
 }
 function transfer(id,direction){const q=transferStatus(id,direction);if(!q.ok)return fail(q.reason);let room=q.room,total=0;for(const k of C.RESOURCE_KEYS){const amount=Math.min(q.from[k],room);q.from[k]-=amount;q.to[k]+=amount;room-=amount;total+=amount;}return total>0?tell(total.toFixed(0)+' fournitures '+(direction==='store'?'mises à l’abri dans la cache.':'reprises dans le sac.')):fail('Aucun transfert possible : source vide ou destination pleine.');}
 function drop(){if(!active()||!held())return fail('Aucun ballot porté.');cancel();const p=held();p.stage='ground';p.x=g.player.x;p.y=g.player.y;return tell('Ballot posé au sol. Son contenu reste récupérable.');}
 function clearRoute(){if(!active()||!coreNear()||task)return fail('Effacez l’itinéraire depuis le dépôt.');if(!state.markers.length)return fail('Aucun itinéraire balisé.');state.markers=[];return tell('Itinéraire effacé ; les piquets ne sont pas remboursés.');}
 function overview(){scan();const p=held(),near=nearestNode,surveyed=near&&state.surveys.some(s=>s.nodeId===near.id);return{summary:'D-17 : relever les réserves, choisir la taille du ballot et préparer le retour par les caches. Les relais régionaux restent dans le carnet de terrain.',rows:[{label:'Relevés',value:state.surveys.length+' / '+R.maxSurveys},{label:'Caches locales',value:state.caches.length+' / '+R.maxCaches},{label:'Piquets du trajet',value:state.markers.length+' / '+R.maxMarkers},{label:'Ballot porté',value:p?p.amount.toFixed(0)+' '+resourceName(p.type)+' · allure '+Math.round(cargoSpeed()*100)+' % · sprint suspendu':'Aucun'},{label:'Livraisons',value:state.delivered.toFixed(0)+' ressources'},{label:'À proximité',value:near?resourceName(near.type)+' · '+Math.floor(near.amount)+' restant'+(surveyed?' · relevé':''):'Approchez un gisement'},{label:'Intervention',value:task?Math.floor(task.elapsed/task.seconds*100)+' % — restez sur place':message||'Aucune'}],state:copy(state),task:task?{kind:task.kind,progress:task.elapsed/task.seconds}:null,message,nearNode:near?.id??null,nearCache:nearestCache?.id??null};}
 function actions(){scan();const a=[],add=(id,label,kind,arg)=>{const q=preview(kind,arg);a.push({id,label,disabled:!q.ok,reason:q.reason||'Travail sur place : '+q.seconds+' s.',run:()=>begin(kind,arg),close:true});};
  add('survey','Relever le gisement — 1 nourriture','survey',nearestNode?.id);add('extract','Arrimer jusqu’à '+R.cargoAmount+' ressources','extract',nearestNode?.id);add('extract-compact',R.compactExtract.name+' — jusqu’à '+R.compactExtract.amount+' ressources · '+Object.entries(R.compactExtract.cost).map(([k,n])=>n+' '+resourceName(k).toLowerCase()).join(' + '),'extract-compact',nearestNode?.id);a.at(-1).description='Travail '+R.compactExtract.seconds+' s, retrait dans le gisement fini relevé. Allure '+Math.round(R.compactExtract.speed*100)+' % jusqu’à '+R.compactExtract.amount+' ressources ; sprint suspendu.';add('cache','Poser une cache — 6 bois, 3 ferraille','cache');add('marker','Planter un piquet — 2 bois, 1 ferraille','marker');add('deliver','Déposer le ballot','deliver');
  add('stash','Ranger le ballot dans cette cache','stash',nearestCache?.id);a.at(-1).description='Travail '+R.stashSeconds+' s sur place. La cache reçoit seulement son espace libre, sur '+R.cacheCapacity+' ressources au total ; le reliquat reste porté. Ce transfert ne livre rien au dépôt.';
  if(task)a.push({id:'cancel',label:'Interrompre le travail',reason:'Arrête cette intervention sans dépenser ses fournitures.',run:()=>({ok:cancel()}),close:true});
  const c=nearestCache,dropReason=!held()?'Aucun ballot porté.':!active()?'Commandant disponible à pied dans D-17 requis.':'Le contenu reste récupérable sur place.',routeReason=!state.markers.length?'Aucun itinéraire balisé.':!active()?'Commandant disponible à pied dans D-17 requis.':!coreNear()?'Rejoignez le dépôt de D-17.':task?'Terminez ou interrompez le travail en cours.':'Efface les piquets sans remboursement.';
  const store=transferStatus(c?.id,'store'),take=transferStatus(c?.id,'take');
  a.push({id:'store-cache',label:'Mettre le sac dans la cache',disabled:!store.ok,reason:store.reason||(c?'Cache '+c.id+' · '+Math.floor(C.bagTotal(c.stock))+' / '+R.cacheCapacity:'Approchez une cache.'),run:()=>transfer(c?.id,'store'),close:true},{id:'take-cache',label:'Reprendre les fournitures de la cache',disabled:!take.ok,reason:take.reason||'Remplit le sac dans sa limite de charge.',run:()=>transfer(c?.id,'take'),close:true},{id:'drop',label:'Poser le ballot au sol',disabled:!held()||!active(),reason:dropReason,run:drop,close:true},{id:'clear-route',label:'Effacer le trajet au dépôt',disabled:!active()||!coreNear()||!state.markers.length||!!task,reason:routeReason,run:clearRoute,close:true});
  for(const p of state.cargo.filter(p=>p.stage==='ground'&&accessible(p)))add('recover-'+p.id,'Récupérer le ballot '+p.id+' — '+Math.floor(p.amount)+' '+resourceName(p.type),'recover',p.id);return a;
 }
 function paint(ctx,p,kind){if(g.operationsArt?.draw(ctx,kind,p.x,p.y,kind==='marker'?27:kind==='cargo'?31:38))return;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,3,kind==='marker'?5:15,5,0,0,Math.PI*2);ctx.fill();if(kind==='marker'){ctx.strokeStyle='#7e6b43';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(0,-20);ctx.stroke();ctx.fillStyle='#d4bc76';ctx.fillRect(0,-20,12,7);}else{ctx.fillStyle=kind==='cargo'?'#a68c5c':'#686e58';ctx.fillRect(-12,-13,24,15);ctx.strokeStyle='#24291e';ctx.strokeRect(-12,-13,24,15);ctx.strokeStyle='#bdb186';ctx.beginPath();ctx.moveTo(-6,-13);ctx.lineTo(-6,2);ctx.moveTo(6,-13);ctx.lineTo(6,2);ctx.stroke();if(kind==='cache'&&!C.bagTotal(p.stock)){ctx.strokeStyle='#c0bca2';ctx.beginPath();ctx.moveTo(-10,-15);ctx.lineTo(10,-19);ctx.stroke();}}ctx.restore();}
 const api={survey:id=>begin('survey',id),placeCache:()=>begin('cache'),cacheTransfer:transfer,markRoute:()=>begin('marker'),extract:id=>begin('extract',id),extractCompact:id=>begin('extract-compact',id),stash:id=>begin('stash',id),deliver:()=>begin('deliver'),drop,recover:id=>begin('recover',id),clearRoute,cancel,preview,overview,actions,snapshot:()=>copy(state),busy:()=>!!task,carrying:()=>!!held(),step};g.explorationPack=Object.freeze(api);
 g.expansions.register({id:'exploration',title:'Trajets & récupération',overview,actions,validate:normalize,snapshot:api.snapshot,restore:data=>{state=normalize(data);task=null;message='';previous={x:g.player.x,y:g.player.y};scan();},reset:()=>{state=initial();task=null;message='';previous={x:g.player.x,y:g.player.y};scan();}});
 wrap('update',(old,dt)=>{const running=g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver;if(running&&task&&interrupted())cancel();if(running&&held()&&local()&&(g.player.dead||g.player.health<=0)){const p=held();p.stage='ground';p.x=g.player.x;p.y=g.player.y;cancel();message='Ballot laissé au point de chute du commandant.';}if(running&&local()&&!g.expeditions?.driving()&&!g.player.dead)previous={x:g.player.x,y:g.player.y};const r=old(dt);if(running)step(dt);return r;});
 wrap('moveFriendly',(old,entity,dx,dy,...rest)=>{const factor=entity===g.player&&held()&&local()&&!g.expeditions?.driving()?cargoSpeed():1;return old(entity,dx*factor,dy*factor,...rest);});
 wrap('updatePlayer',(old,...a)=>{const keys=g.input.keys,shift=held()&&local()&&keys.has('ShiftLeft');if(shift)keys.delete('ShiftLeft');try{return old(...a);}finally{if(shift)keys.add('ShiftLeft');}});
 wrap('updateInteraction',(old,...a)=>{if(task){g.interactionText='Travail sur place : '+Math.floor(task.elapsed/task.seconds*100)+' % — bouger pour interrompre';return;}return old(...a);});
 wrap('depthEntries',(old,view)=>{const entries=old(view);if(!local()&&!view?.homeProjection)return entries;for(const [kind,items]of [['cache',state.caches],['marker',state.markers],['cargo',state.cargo.filter(p=>p.stage==='ground')]])for(const p of items)if(g.visible(p.x,p.y,32,view))entries.push({kind:1,entity:{x:p.x,y:p.y,id:-127000-p.id,__explorationPack:{p,kind}},depth:p.y+4,id:-127000-p.id,order:entries.length});entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);return entries;});
 wrap('drawBuilding',(old,ctx,b,...a)=>b.__explorationPack?paint(ctx,b.__explorationPack.p,b.__explorationPack.kind):old(ctx,b,...a));
 wrap('drawGround',(old,ctx,view)=>{const r=old(ctx,view);if((local()||view?.homeProjection)&&state.markers.length>1){ctx.save();ctx.strokeStyle='rgba(215,194,131,.3)';ctx.setLineDash([6,12]);ctx.lineWidth=1;ctx.beginPath();state.markers.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}return r;});
 wrap('drawPlayer',(old,ctx,...a)=>{const r=old(ctx,...a);if(held()&&local()&&!g.player.dead)paint(ctx,{x:g.player.x-8,y:g.player.y-13},'cargo');return r;});
 wrap('renderMinimap',(old,...a)=>{const result=old(...a);if(!local()||g.state!=='playing')return result;const ctx=g.mctx,sx=g.minimap.width/C.WORLD_SIZE,sy=g.minimap.height/C.WORLD_SIZE;ctx.save();ctx.strokeStyle='#c9b16c';ctx.lineWidth=1;ctx.beginPath();state.markers.forEach((p,i)=>i?ctx.lineTo(p.x*sx,p.y*sy):ctx.moveTo(p.x*sx,p.y*sy));ctx.stroke();for(const p of state.caches){ctx.fillStyle='#9da77c';ctx.fillRect(p.x*sx-2,p.y*sy-2,4,4);}for(const p of state.cargo)if(p.stage==='ground'){ctx.strokeStyle='#e2ba69';ctx.strokeRect(p.x*sx-3,p.y*sy-3,6,6);}ctx.restore();return result;});
 wrap('returnToMenu',(old,...a)=>{cancel();return old(...a);});return api;
}
const api={initial,normalize,install};root.DeadwallExplorationPack=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
