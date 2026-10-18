/* Finite regional foraging. The existing backpack owns every collected resource. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),F=root.DeadwallBiomeForage193||(typeof require==='function'?require('./biome-forage193.js'):null),W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null);
const copy=v=>JSON.parse(JSON.stringify(v)),worlds=new Map(),initial=()=>({version:1,enabled:false,harvested:[]}),rules=()=>C.Forage193Rules;
function reference(full){
 const f=full.frontier,key=[full.worldSeed,f.generation,f.detailVersion,f.ecologyVersion,f.hydrologyVersion,f.landscape189||'classic'].join(':');
 if(!worlds.has(key)){worlds.set(key,W.create(full.worldSeed,f.generation,{detailVersion:f.detailVersion,ecologyVersion:f.ecologyVersion,hydrologyVersion:f.hydrologyVersion,...(f.landscape189?{landscape189:f.landscape189}:{})}));if(worlds.size>3)worlds.delete(worlds.keys().next().value);}
 return worlds.get(key);
}
function validate(raw,full){
 if(raw===undefined)return initial();const bad=()=>{throw Error('Registre de cueillette193 invalide.');},R=rules();
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==3||Object.keys(raw).some(k=>!['version','enabled','harvested'].includes(k))||raw.version!==1||typeof raw.enabled!=='boolean'||!Array.isArray(raw.harvested)||raw.harvested.length>R.maxRecords)bad();
 if(!raw.enabled&&raw.harvested.length)bad();const ids=new Set();let world=null;
 for(const id of raw.harvested){
  const match=typeof id==='string'&&/^F193_(0|[1-9]\d?)_(0|[1-9]\d?)_(0|[1-9]\d?)$/.exec(id),limit=Math.ceil(C.GeographyRules135.size/R.chunk);
  if(!match||Number(match[1])>=limit||Number(match[2])>=limit||Number(match[3])>=R.candidates||ids.has(id))bad();
  if(full){if(full.frontier?.generation<8||full.frontier?.ecologyVersion!==1||full.frontier?.hydrologyVersion!==1)bad();world||=reference(full);if(!F.candidate(world,id))bad();}
  ids.add(id);
 }
 return{version:1,enabled:raw.enabled,harvested:[...ids]};
}
function install(g){
 if(g.forage193)return g.forage193;if(!g.expansions||!g.frontier)return null;
 let state=initial(),spent=new Set(),task=null,message='',displayCache=null;
 const R=rules(),pos=()=>g.frontier.position(),alive=()=>g.state==='playing'&&!g.gameOver&&g.player&&!g.player.dead&&g.player.health>0;
 const permitted=()=>alive()&&g.expansions.canAct(),fail=reason=>({ok:false,reason}),bagFree=()=>Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry));
 const emit=(hz=520)=>{try{g.audio?.tone?.(hz,.09,'triangle',.025,-35);}catch{/* Inventory commits do not depend on optional audio. */}};
 function localDanger(){return g.zombies.some(e=>!e.dead&&e.health>0&&Math.hypot(e.x-g.player.x,e.y-g.player.y)<R.activationReach&&g.hostileLineClear(e,g.player));}
 function activationQuote(){
  if(!permitted())return fail('Un commandant vivant doit préparer la cueillette.');
  if(state.enabled)return fail('Le carnet de cueillette est déjà actif ; les prises épuisées ne repoussent pas.');
  if(pos().active||g.expeditions?.driving()||g.player.reload>0||g.selectedBuild||g.fieldcraft?.context?.().mounted||g.expansions.busy('forage193'))return fail('Rejoignez le dépôt à pied, avec les mains libres.');
  const core=g.core();if(!core||!g.workerCanWorkAt(g.player,core,R.activationReach))return fail('Préparez le carnet au dépôt, par un accès ouvert.');
  const f=pos();if(f.generation<8||f.ecologyVersion!==1||f.hydrologyVersion!==1)return fail('La cueillette nécessite une région avec écologie et eaux naturelles.');
  if(localDanger())return fail('Écartez les infectés du dépôt avant la préparation.');
  if(!C.canAfford(g.player.carry,R.activationCost))return fail('Transportez quatre rations dans le sac pour préparer le carnet.');
  return{ok:true,cost:{...R.activationCost}};
 }
 function activate(){const q=activationQuote();if(!q.ok){message=q.reason;return q;}if(!C.spend(g.player.carry,q.cost))return fail('Rations indisponibles.');state.enabled=true;message='Carnet activé. Les ramassages de cette région restent finis.';g.save(false);emit();return{ok:true};}
 function visible(range=R.viewRange){
  const p=pos();if(!state.enabled||!alive()||!p.active||p.z!==0)return[];
  const w=g.frontier.world(),frame=g.visibility?.frame?.(),reach=Math.min(R.viewRange,Math.max(0,range)),key=[Math.floor(p.x/R.presentationCell),Math.floor(p.y/R.presentationCell),Math.floor(g.elapsed/R.presentationInterval),spent.size].join(':');
  // Only the bounded presentation shortlist is cached. Every transaction checks
  // current terrain, hands, threat and room again; sight is always read live.
  if(!displayCache||displayCache.world!==w||displayCache.local!==g.world||displayCache.key!==key)displayCache={world:w,local:g.world,key,rows:F.around(w,p.x,p.y,R.viewRange+Math.SQRT2*R.presentationCell)};
  return displayCache.rows.filter(q=>!spent.has(q.id)&&Math.hypot(q.x-p.x,q.y-p.y)<=reach&&(frame?.canSeeRegionalPoint?frame.canSeeRegionalPoint(q):w.line(p,q,0,p.inside,null,.015)));
 }
 function danger(){
  const p=pos(),w=g.frontier.world();return[...g.frontier.contacts(),...(g.worldEvolution?.groupMembers?.()||[]),...(g.succession133?.contacts?.()||[])].some(e=>!e.dead&&(e.hp??e.health)>0&&(e.z??0)===0&&Math.hypot(e.x-p.x,e.y-p.y)<R.dangerRange&&w.line(p,e,0,p.inside,null,.015));
 }
 function quote(id,continuing=null){
  if(!permitted()||!state.enabled)return fail('Activez le carnet de cueillette au dépôt.');const p=pos();
  if(!p.active||p.z!==0||p.generation<8||p.ecologyVersion!==1||p.hydrologyVersion!==1)return fail('Rejoignez la région naturelle au niveau du sol.');
  if(p.car?.driving||g.expeditions?.driving()||g.fieldcraft?.context?.().mounted)return fail('Descendez du véhicule et quittez le poste de tir.');
  if(g.player.reload>0||g.selectedBuild||g.expansions.busy('forage193')||task&&task!==continuing)return fail('Terminez l’action en cours et libérez les mains.');
  if(spent.has(id))return fail('Ramassage épuisé : il ne se renouvelle pas.');if(spent.size>=R.maxRecords)return fail('Le carnet de cueillette est complet.');
  const w=g.frontier.world(),q=F.candidate(w,id);if(!q||!F.admitted(w,q))return fail('Ramassage absent ou accès devenu impraticable.');
  if(Math.hypot(q.x-p.x,q.y-p.y)>R.reach)return fail('Rapprochez-vous du ramassage.');
  if(w.blocked(p.x,p.y,W.RULES.footRadius,0,p.inside)||!w.movementLine(p,q,0,p.inside,null,.05))return fail('Rejoignez le ramassage par un sol libre et une ligne dégagée.');
  const frame=g.visibility?.frame?.();if(frame?.canSeeRegionalPoint&&!frame.canSeeRegionalPoint(q))return fail('Le ramassage doit être visible depuis votre position.');
  if(danger())return fail('Écartez les infectés avant de vous baisser.');
  if(g.player.stamina<R.staminaCost)return fail('Reprenez votre souffle avant de ramasser.');
  if(bagFree()+1e-7<q.amount)return fail('Le lot doit tenir dans le sac ; rapportez votre chargement au dépôt.');
  return{ok:true,id:q.id,species:q.species,name:q.name,resource:q.resource,amount:q.amount,seconds:q.seconds,x:q.x,y:q.y,cost:{}};
 }
 function cancel(reason='Cueillette interrompue : aucun lot ni coût accordé.') {if(!task)return false;task=null;message=reason;return true;}
 function damageReceived(){return cancel('Blessure : cueillette interrompue sans gain.');}
 function begin(id){const q=quote(id);if(!q.ok){message=q.reason;return q;}const p=pos();task={...q,elapsed:0,origin:{x:p.x,y:p.y,z:p.z},health:g.player.health,world:g.world};g.releaseInputs();message='Ramassage sur place ; bouger, tirer ou subir un coup interrompt le travail.';g.frontier.signalAt({...p,z:0},R.noise);emit(340);return{ok:true};}
 function step(dt){
  if(!task)return;if(!alive()||!pos().active){cancel();return;}if(g.paused||g.activeOverlay)return;if(!Number.isFinite(dt)||dt<=0)return;
  const t=task,p=pos(),q=quote(t.id,t);if(!q.ok||t.world!==g.world||g.player.health<t.health||p.z!==t.origin.z||Math.hypot(p.x-t.origin.x,p.y-t.origin.y)>R.moveTolerance){cancel(q.reason||'Déplacement ou blessure : cueillette interrompue.');return;}
  t.elapsed+=Math.min(R.maxStep,dt);g.interactionText='Cueillette · '+Math.min(100,Math.floor(t.elapsed/t.seconds*100))+' %';
  if(t.elapsed+1e-8<t.seconds)return;const final=quote(t.id,t);if(!final.ok){cancel(final.reason);return;}
  // A single synchronous commit spends the finite node and fills only the real backpack.
  spent.add(t.id);state.harvested.push(t.id);g.player.carry[t.resource]+=t.amount;g.player.stamina=Math.max(0,g.player.stamina-R.staminaCost);g.stats.gathered+=t.amount;
  task=null;message=t.amount+' '+C.RESOURCE_META[t.resource].label.toLowerCase()+' dans le sac. Rapportez ce lot au dépôt.';emit(680);g.save(false);g.notify?.(message,'good');
 }
 function presentation(){if(!task)return null;const p=pos();if(!p.active||p.z!==0||!alive())return null;return{kind:'forage',species:task.species,x:p.x,y:p.y,target:{x:task.x,y:task.y},progress:Math.min(1,task.elapsed/task.seconds)};}
 function overview(){return{summary:message||'Ramassages comestibles identifiés, bois mort et pierres, répartis selon le milieu. Quantités finies, retour au dépôt nécessaire.',rows:[{label:'Carnet',value:state.enabled?'Actif ; aucune repousse au chargement':'Inactif dans cette ancienne campagne'},{label:'Ramassages achevés',value:spent.size+' / '+R.maxRecords},{label:'Sac',value:C.bagTotal(g.player.carry).toFixed(1)+' / '+g.player.carryCapacity},{label:'Travail',value:'Lot entier, '+R.staminaCost+' endurance, mains libres et accès à pied'},{label:'Milieux',value:'16 espèces de cueillette et ramassage ; aucune eau potable ni médicament produit'}],task:task?{kind:'forage',progress:Math.min(1,task.elapsed/task.seconds)}:null};}
 function actions(){
  if(!state.enabled){const q=activationQuote();return[{id:'activate',label:'Préparer le carnet — 4 rations du sac',disabled:!q.ok,reason:q.reason||'Activation définitive ; aucune redistribution du monde.',close:false,run:activate}];}
  if(task)return[{id:'cancel',label:'Interrompre la cueillette',close:false,run:()=>({ok:cancel()})}];
  return visible().sort((a,b)=>Math.hypot(a.x-pos().x,a.y-pos().y)-Math.hypot(b.x-pos().x,b.y-pos().y)||a.id.localeCompare(b.id)).slice(0,R.actionLimit).map(q=>{const offer=quote(q.id);return{id:'gather:'+q.id,label:'Ramasser : '+q.name,description:q.amount+' '+C.RESOURCE_META[q.resource].label.toLowerCase()+' · '+q.seconds+' s · lot fini dans le sac.',disabled:!offer.ok,reason:offer.reason||'',close:true,run:()=>begin(q.id)};});
 }
 const api=Object.freeze({activate,activationQuote,begin,quote,cancel,damageReceived,step,visible,presentation,active:()=>state.enabled,busy:()=>!!task,overview,actions,snapshot:()=>copy(state)});g.forage193=api;
 g.expansions.register({id:'forage193',title:'Cueillette & ramassage',overview,actions,busy:api.busy,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);spent=new Set(state.harvested);task=null;message='';displayCache=null;},reset:()=>{state={...initial(),enabled:true};spent=new Set();task=null;message='';displayCache=null;}});
 const update=g.update.bind(g);g.update=dt=>{if(task&&!g.paused&&!g.activeOverlay&&(g.input.mouseDown||g.input.touchFire||[...g.input.keys,...g.input.pressed].some(k=>/^Key[WAZQSDERFGV]$|^Arrow|^Page|^Space$/.test(k))))cancel();const result=update(dt);step(dt);return result;};
 const damage=g.damagePlayer?.bind(g);if(damage)g.damagePlayer=(...args)=>{const health=g.player.health,result=damage(...args);if(g.player.health<health)damageReceived();return result;};
 const menu=g.returnToMenu.bind(g);g.returnToMenu=(...args)=>{cancel();return menu(...args);};
 const start=g.startNew.bind(g);g.startNew=(...args)=>{const old={world:g.world,state,spent,task,message,displayCache},result=start(...args);if(g.world===old.world){state=old.state;spent=old.spent;task=old.task;message=old.message;displayCache=old.displayCache;}return result;};
 return api;
}
const api=Object.freeze({initial,validate,install});root.DeadwallForage193=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
