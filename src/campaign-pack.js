/* Optional campaign operations link discovered places, carried supplies and D-17. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),P=root.DeadwallAtlasProjection||(typeof require==='function'?require('./atlas-projection.js'):null),R=C.CampaignPackRules,D=R.definitions,keys=Object.keys(D),copy=x=>JSON.parse(JSON.stringify(x));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const legacyKeys=['patrol','aid','salvage','evacuation','defense'];
const cargoKind=kind=>D[kind]?.cargo||(kind==='aid'?'outbound':['salvage','evacuation'].includes(kind)?'inbound':null);
function initial(){return{version:1,lastStarted:Object.fromEntries(keys.map(k=>[k,0])),finished:Object.fromEntries(keys.map(k=>[k,0])),usedSites:Object.fromEntries(keys.filter(k=>k!=='defense').map(k=>[k,[]])),active:null,history:[]};}
function normalize(raw,full){
 if(raw===undefined)return initial();const invalid=()=>{throw Error('Opération de campagne 1.27 invalide.');},s=initial();
 if(!raw||Array.isArray(raw)||raw.version!==1||Object.keys(raw).some(k=>!own(s,k)))invalid();
 const legacy=raw.lastStarted&&Object.keys(raw.lastStarted).length===legacyKeys.length,expectedKeys=legacy?legacyKeys:keys;
 for(const key of ['lastStarted','finished']){
  const v=raw[key];if(!v||Array.isArray(v)||Object.keys(v).length!==expectedKeys.length||Object.keys(v).some(k=>!expectedKeys.includes(k)))invalid();
  for(const k of expectedKeys){if(!integer(v[k],0,R.maxCount)||full&&key==='lastStarted'&&v[k]>full.wave)invalid();s[key][k]=v[k];}
 }
 const expectedSites=expectedKeys.filter(k=>k!=='defense');
 if(!raw.usedSites||Array.isArray(raw.usedSites)||Object.keys(raw.usedSites).length!==expectedSites.length||Object.keys(raw.usedSites).some(k=>!expectedSites.includes(k)))invalid();
 for(const k of expectedSites){
  const a=raw.usedSites[k];if(!Array.isArray(a)||a.length>R.maxUsed||a.some(id=>typeof id!=='string'||!/^P\d{4}$/.test(id))||new Set(a).size!==a.length)invalid();s.usedSites[k]=[...a];
 }
 if(raw.active!==null){
  const a=raw.active;if(!a||!own(D,a.kind)||Object.keys(a).some(k=>!['kind','wave','sites','index','stage','integrity','baselineWaves','minimumCore'].includes(k))||!integer(a.wave,1,R.maxCount)||a.wave!==s.lastStarted[a.kind]||full&&a.wave>full.wave||!Array.isArray(a.sites)||a.sites.length!==D[a.kind].sites||new Set(a.sites).size!==a.sites.length||a.sites.some(id=>!s.usedSites[a.kind]?.includes(id))||!integer(a.index,0,a.sites.length)||!Number.isFinite(a.integrity)||a.integrity<=0||a.integrity>100||!integer(a.baselineWaves,0,R.maxCount)||!Number.isFinite(a.minimumCore)||a.minimumCore<0||a.minimumCore>1)invalid();
  if(a.kind==='defense'){if(!['defending','ready'].includes(a.stage)||a.index!==0||a.minimumCore<R.minimumCore)invalid();if(full&&(a.baselineWaves>full.stats.wavesSurvived||a.stage==='ready'&&full.stats.wavesSurvived<=a.baselineWaves))invalid();}
  else if(!['field','return'].includes(a.stage)||a.stage==='field'&&a.index>=a.sites.length||a.stage==='return'&&a.index!==a.sites.length)invalid();
  s.active=copy(a);
 }
 for(const k of keys.filter(k=>D[k].unique)){
  if(s.finished[k]>1||s.usedSites[k].length!==(s.lastStarted[k]?D[k].sites:0)||s.finished[k]&&!s.lastStarted[k]||s.active?.kind===k&&s.finished[k])invalid();
 }
 if(!Array.isArray(raw.history)||raw.history.length>R.history)invalid();
 for(const h of raw.history){if(!h||!own(D,h.kind)||!integer(h.wave,1,R.maxCount)||h.wave>s.lastStarted[h.kind]||!['complete','lost','abandoned'].includes(h.result)||Object.keys(h).some(k=>!['kind','wave','result'].includes(k)))invalid();s.history.push({...h});}
 if(full&&Object.values(s.usedSites).some(a=>a.length)){
  const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null),key=full.worldSeed+':'+full.frontier.generation;let w=worldCache.get(key);if(!w){w=W.create(full.worldSeed,full.frontier.generation);worldCache.set(key,w);if(worldCache.size>3)worldCache.delete(worldCache.keys().next().value);}
  const seen=new Set(full.frontier.seen),pois=new Map(w.pois.map(p=>[p.id,p]));
  for(const kind of Object.keys(s.usedSites))for(const id of s.usedSites[kind]){const p=pois.get(id);if(!p||!seen.has(id)||D[kind].types&&!D[kind].types.includes(p.type))invalid();}
 }
 return s;
}
const worldCache=new Map();
function install(g){
 if(g.campaignPack)return g.campaignPack;if(!g.expansions)throw Error('Installer expansion-kit avant campaign-pack.');
 let state=initial(),task=null,message='',targetCache=new Map(),candidateCache=new Map(),worldRef=null;
 const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...a)=>fn(old,...a);},fail=reason=>({ok:false,reason}),can=()=>g.expansions.canAct()&&!g.fieldcraft?.context?.().mounted&&g.player.reload<=0,home=()=>!g.frontier.active()&&!g.expeditions.driving()&&g.core()&&g.workerCanWorkAt(g.player,g.core(),R.homeReach);
 const expired=a=>!!a&&!!D[a.kind].waveLimit&&g.wave-a.wave>=D[a.kind].waveLimit;
 function sitePoint(id){
  const w=g.frontier.world();if(worldRef!==w){worldRef=w;targetCache.clear();candidateCache.clear();}if(targetCache.has(id))return targetCache.get(id);
  const p=w.pois.find(p=>p.id===id);if(!p)return null;const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);let point=null;
  for(const offset of [-3,-5,-8,-12,-16,-20]){const q=G.global(p,p.w/2,offset);if(!w.blocked(q.x,q.y,.4,0,null)){point={...q,z:0,inside:null,id:p.id,name:p.name,type:p.type};break;}}
  targetCache.set(id,point);return point;
 }
 function candidates(kind){
  if(!own(D,kind)||kind==='defense')return[];const w=g.frontier.world(),f=g.frontier.snapshot(),seen=new Set(f.seen),used=new Set(state.usedSites[kind]),d=D[kind],key=f.seen.length+':'+state.usedSites[kind].length;
  if(worldRef!==w){worldRef=w;targetCache.clear();candidateCache.clear();}const cached=candidateCache.get(kind);if(cached?.key===key)return[...cached.ids];
  const anchor=P.home(w),ids=w.pois.filter(p=>seen.has(p.id)&&!used.has(p.id)&&(!d.types||d.types.includes(p.type))).sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y)||a.id.localeCompare(b.id)).filter(p=>sitePoint(p.id)).map(p=>p.id);candidateCache.set(kind,{key,ids});return[...ids];
 }
 function previewStart(kind){
  if(!own(D,kind))return fail('Opération inconnue.');if(!can()||task||g.expansions.busy('campaign'))return fail('Le commandant doit être disponible.');if(state.active)return fail('Terminez ou abandonnez l’opération en cours.');if(!home()||g.phase!=='calm')return fail('Préparez cette opération au dépôt, pendant le calme.');if(g.wave<=state.lastStarted[kind])return fail('Une seule tentative de ce type par vague.');if(state.finished[kind]>=R.maxCount||g.wave>R.maxCount)return fail('Registre de campagne complet.');
  const d=D[kind];if(d.unique&&state.lastStarted[kind])return fail('Cette tentative unique a déjà été engagée dans cette campagne.');if(cargoKind(kind)==='outbound'&&(g.essentials?.carrying()||g.explorationPack?.carrying()))return fail('Déposez le module ou le ballot avant de charger un colis.');if(!C.canAfford(g.resources,d.fee))return fail('Réserves du dépôt insuffisantes.');if(kind==='defense'&&g.core().health/g.core().maxHealth<R.minimumCore)return fail('Réparez le centre à au moins 65 %.');
  const sites=candidates(kind).slice(0,d.sites);if(sites.length!==d.sites)return fail('Explorez davantage de lieux compatibles : '+sites.length+'/'+d.sites+' disponibles.');if(kind!=='defense'&&state.usedSites[kind].length+d.sites>R.maxUsed)return fail('Toutes les opportunités de ce registre sont engagées.');return{ok:true,cost:{...d.fee},sites};
 }
 function announce(text){message=text;g.notify?.(text);g.audio.ui?.();}
 function start(kind){
  const q=previewStart(kind);if(!q.ok)return q;C.spend(g.resources,q.cost);state.lastStarted[kind]=g.wave;if(kind!=='defense')state.usedSites[kind].push(...q.sites);
  state.active={kind,wave:g.wave,sites:q.sites,index:0,stage:kind==='defense'?'defending':'field',integrity:100,baselineWaves:g.stats.wavesSurvived,minimumCore:g.core().health/g.core().maxHealth};
  announce(D[kind].name+' engagé. '+(kind==='defense'?'Tenez la vague puis rendez compte au dépôt.':'Le prochain accès figure dans votre feuille de route.'));g.save(false);return{ok:true};
 }
 function position(){const f=g.frontier.position();return f.active?{domain:'region',x:f.x,y:f.y,z:f.z,inside:f.inside}:{domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null};}
 function safeAt(point){const f=g.frontier.overview();return f.active&&f.z===0&&!f.car?.driving&&Math.hypot(f.x-point.x,f.y-point.y)<=R.reach&&f.world.line(f,point,0,f.inside,null,.05)&&!f.enemies.some(e=>e.hp>0&&e.z===0&&Math.hypot(e.x-f.x,e.y-f.y)<R.danger&&g.frontier.visibleEnemy(e))&&!(g.worldEvolution?.overview().groups||[]).some(h=>h.alive>0&&Math.hypot(h.x-f.x,h.y-f.y)<R.danger+(g.worldEvolution.groupRadius?.(h)||0));}
 function previewWork(){
  const a=state.active;if(!can()||task||g.expansions.busy('campaign')||!a||a.stage!=='field')return fail('Aucun travail de campagne disponible.');if(expired(a))return fail('Délai dépassé : cette opportunité est perdue.');if(cargoKind(a.kind)==='inbound'&&(g.essentials?.carrying()||g.explorationPack?.carrying()))return fail('Déposez le module ou le ballot avant cette prise en charge.');const p=sitePoint(a.sites[a.index]);if(!p||!safeAt(p)||g.player.reload>0)return fail('Rejoignez l’accès indiqué au rez-de-chaussée, à pied et hors de portée des infectés.');const d=D[a.kind];if(!C.canAfford(g.player.carry,d.fieldCost))return fail('Consommables requis dans le sac : '+costText(d.fieldCost)+'.');return{ok:true,cost:{...d.fieldCost},seconds:d.seconds,point:p};
 }
 function begin(){const q=previewWork();if(!q.ok)return q;task={elapsed:0,seconds:q.seconds,position:position(),health:g.player.health,pulse:0};g.releaseInputs?.();if(g.activeOverlay===g.ui.commandModal)g.showCommand(false);message='Intervention en cours…';return{ok:true};}
 function cancel(){if(!task)return false;task=null;message='Intervention interrompue. Les consommables de terrain restent dans le sac.';return true;}
 function conclude(result,text){const a=state.active;if(!a)return;state.history.push({kind:a.kind,wave:a.wave,result});if(state.history.length>R.history)state.history.shift();state.active=null;task=null;announce(text);}
 function abandon(){if(!can()||!state.active)return fail('Aucune opération à abandonner.');conclude('abandoned','Opération abandonnée. Le budget engagé et cette opportunité sont perdus.');g.save(false);return{ok:true};}
 function previewFinish(){
  const a=state.active;if(!can()||task||g.expansions.busy('campaign')||!a||!['return','ready'].includes(a.stage)||!home())return fail('Rejoignez le dépôt avec une opération achevée.');const r=D[a.kind].reward;
  if(expired(a))return fail('Délai dépassé : cette opportunité est perdue.');
  if(r.insight&&g.research.insight+r.insight>C.RESEARCH_INSIGHT_MAX)return fail('Dépensez un point d’analyse avant de rendre compte.');
  for(const key of C.RESOURCE_KEYS)if(r[key]&&g.resources[key]+r[key]>g.storage)return fail('Libérez '+r[key]+' places de '+C.RESOURCE_META[key].label.toLowerCase()+' au dépôt.');
  if(r.worker){if(1+g.units.filter(u=>!u.dead&&u.health>0).length>=g.housing)return fail('Terminez un logement pour accueillir le blessé.');if(g.nextId>=0x7ffffffd)return fail('Compteur des survivants complets.');const p=g.coreArrivalPosition({radius:12},g.player);if(!p||!g.friendlyPositionClear({radius:12},p.x,p.y))return fail('Libérez un accès au dépôt pour accueillir le blessé.');}
  return{ok:true,reward:{...r}};
 }
 function finish(){
  const q=previewFinish();if(!q.ok)return q;const a=state.active,r=q.reward;
  if(r.worker){const p=g.coreArrivalPosition({radius:12},g.player),unit=g.createProtectedSurvivor('worker',p.x,p.y);if(!unit)return fail('Accès au dépôt bloqué.');unit.health=Math.max(1,Math.min(unit.maxHealth,a.integrity));}
  for(const key of C.RESOURCE_KEYS)if(r[key])g.resources[key]+=r[key];if(r.insight)g.research.insight+=r.insight;if(r.morale)g.morale=Math.min(100,g.morale+r.morale);state.finished[a.kind]++;conclude('complete',D[a.kind].name+' terminé. '+rewardText(r));g.refreshMetrics(true);g.save(false);return{ok:true,reward:r};
 }
 function carrying(){const a=state.active;return!!a&&(cargoKind(a.kind)==='outbound'&&a.stage==='field'||cargoKind(a.kind)==='inbound'&&a.stage==='return');}
 function movementFactor(){return carrying()?state.active.kind==='evacuation'?R.rescueSpeed:R.cargoSpeed:1;}
 function tick(dt,beforeHealth){
  const a=state.active;if(!a)return;if(g.player.dead||g.player.health<=0){conclude('lost','Opération perdue avec le commandant.');return;}
  if(expired(a)){conclude('lost','Délai dépassé. Le budget engagé et cette opportunité sont perdus.');return;}
  if(carrying()&&g.player.health<beforeHealth){a.integrity=Math.max(0,a.integrity-(beforeHealth-g.player.health)*(a.kind==='evacuation'?R.rescueDamage:R.cargoDamage));if(a.integrity<=0){conclude('lost',a.kind==='evacuation'?'Le blessé n’a pas survécu au transport.':'Le colis de campagne est inutilisable.');return;}}
  if(a.kind==='defense'&&a.stage==='defending'){
   a.minimumCore=Math.min(a.minimumCore,(g.core()?.health||0)/(g.core()?.maxHealth||1));if(a.minimumCore<R.minimumCore){conclude('lost','Engagement perdu : le centre est passé sous 65 % d’intégrité.');return;}
   if(g.stats.wavesSurvived>a.baselineWaves){a.stage='ready';announce('Engagement tenu. Rendez compte au dépôt.');}return;
  }
  if(!task)return;const t=task,p=position();task=null;const q=previewWork();task=t;
  if(!q.ok||p.domain!==t.position.domain||p.z!==t.position.z||p.inside!==t.position.inside||Math.hypot(p.x-t.position.x,p.y-t.position.y)>(p.domain==='local'?R.localMovementTolerance:R.movementTolerance)||g.player.health<t.health){cancel();return;}
  t.elapsed+=dt;t.pulse-=dt;if(t.pulse<=0){g.frontier.signalAt(q.point,R.workNoise);t.pulse=1;}if(t.elapsed+1e-7<t.seconds)return;
  C.spend(g.player.carry,q.cost);task=null;a.index++;if(a.index===a.sites.length)a.stage='return';announce(a.stage==='return'?'Intervention terminée. Retournez au dépôt.':'Accès relevé. Rejoignez le point suivant.');g.save(false);
 }
 function costText(cost){return Object.entries(cost).map(([k,n])=>n+' '+C.RESOURCE_META[k].label.toLowerCase()).join(' + ')||'aucun';}
 function rewardText(r){return Object.entries(r).map(([k,n])=>n+' '+(k==='worker'?'survivant accueilli':k==='insight'?'point d’analyse':k==='morale'?'moral':C.RESOURCE_META[k].label.toLowerCase())).join(' · ');}
 function overview(){
  const a=state.active,p=a?.stage==='field'?sitePoint(a.sites[a.index]):null;
  return{summary:message||keys.length+' opérations facultatives. Les sites engagés ne se renouvellent pas ; les contrats uniques n’autorisent qu’une tentative par campagne.',rows:[{label:'Opération',value:a?D[a.kind].name:'Aucune'},{label:'Étape',value:a?a.stage==='field'?'Terrain '+(a.index+1)+'/'+a.sites.length:a.stage==='defending'?'Défendre la vague':'Retour au dépôt':'Choisir au dépôt'},{label:'Destination',value:p?p.name+' · '+p.id+' · '+Math.round(p.x)+' / '+Math.round(p.y):'D-17'},{label:'Délai',value:a&&D[a.kind].waveLimit?'Retour avant la vague '+(a.wave+D[a.kind].waveLimit)+' · '+Math.max(0,D[a.kind].waveLimit-(g.wave-a.wave))+' changements restants':'Sans échéance de vague'},{label:'Tentatives',value:a&&D[a.kind].unique?'Unique dans cette campagne':'Une de chaque type par vague'},{label:'Consommables à porter',value:a?costText(D[a.kind].fieldCost):'Selon la mission'},{label:'Transport',value:carrying()?(a.kind==='evacuation'?'Blessé':'Colis')+' · '+Math.round(a.integrity)+' % · vitesse '+Math.round(movementFactor()*100)+' %':'Aucun'},{label:'Intervention',value:task?Math.floor(task.elapsed/task.seconds*100)+' % — rester sur place':'Aucune'},{label:'Opérations terminées',value:keys.map(k=>D[k].name+' : '+state.finished[k]).join(' · ')}],active:a?copy(a):null,target:p?{...p}:null,task:task?{progress:task.elapsed/task.seconds}:null,definitions:keys.map(id=>({id,...D[id],preview:previewStart(id)})),history:copy(state.history)};
 }
 function actions(){const out=[];if(!state.active){for(const kind of keys){const p=previewStart(kind),d=D[kind];out.push({id:'start-'+kind,label:d.name+' · '+costText(d.fee),description:d.brief+' Sac : '+costText(d.fieldCost)+' · '+d.seconds+' s par accès. Récompense : '+rewardText(d.reward),disabled:!p.ok,reason:p.reason||d.brief+' Sac : '+costText(d.fieldCost)+' · '+d.seconds+' s par accès. Récompense : '+rewardText(d.reward),run:()=>start(kind)});}}
  else{if(state.active.stage==='field'){const p=previewWork();out.push({id:'work',label:task?'Intervention en cours':'Intervenir · '+D[state.active.kind].seconds+' s',disabled:!p.ok,reason:p.reason,run:begin,close:true});const point=sitePoint(state.active.sites[state.active.index]);if(point)out.push({id:'pin',label:'Repérer cet accès sur la carte',disabled:!can(),run:()=>({ok:g.frontier.pin(point.id)})});}
   if(['return','ready'].includes(state.active.stage)){const p=previewFinish();out.push({id:'finish',label:'Livrer et rendre compte',disabled:!p.ok,reason:p.reason,run:finish});}
   if(task)out.push({id:'cancel',label:'Interrompre le travail',run:()=>({ok:cancel()})});out.push({id:'abandon',label:'Abandonner · budget et opportunité perdus',run:abandon});}
  return out;
 }
 function draw(ctx,domain,v,options={}){
  const a=state.active;if(!a)return;const p=domain==='region'&&a.stage==='field'?sitePoint(a.sites[a.index]):null,scale=domain==='region'?1:32;
  function casualty(x,y,s){if(g.operationsArt?.draw(ctx,'casualty',x,y,67*s/32))return;ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#504c38';ctx.fillRect(-.38,-.96,.76,1.92);ctx.fillStyle='#819085';ctx.fillRect(-.31,-.78,.62,1.55);ctx.fillStyle='#415142';ctx.fillRect(-.2,-.35,.4,.75);ctx.fillStyle='#302f2b';ctx.fillRect(-.18,.4,.15,.31);ctx.fillRect(.03,.4,.15,.31);ctx.fillStyle='#bda27e';ctx.beginPath();ctx.arc(0,-.55,.19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d4c9a0';ctx.fillRect(-.2,-.06,.4,.11);ctx.restore();}
  ctx.save();if(options.ground!==false&&p&&(!v||v.z===0)&&(!v||Math.hypot(p.x-v.x,p.y-v.y)<100)){if(a.kind==='evacuation')casualty(p.x,p.y,1);else if(!g.operationsArt?.draw(ctx,'cache',p.x,p.y,1.4)){ctx.strokeStyle='#d9bf79';ctx.fillStyle='#4c5748';ctx.lineWidth=.07;ctx.strokeRect(p.x-.7,p.y-.5,1.4,1);ctx.fillRect(p.x-.62,p.y-.42,1.24,.84);}ctx.fillStyle='#eadbb7';ctx.font='.45px sans-serif';ctx.textAlign='center';ctx.fillText(a.kind==='evacuation'?'SOS':a.kind==='aid'?'AIDE':'MISSION',p.x,p.y-1.2);}
  if(options.carried!==false&&carrying()&&!g.player.dead&&(domain==='region')===g.frontier.active()){const f=domain==='region'?(v||g.frontier.overview()):g.player;if(!f.car?.driving&&!g.expeditions.driving()){if(a.kind==='evacuation')casualty(f.x-.42*scale,f.y+.15*scale,scale*.66);else if(!g.operationsArt?.draw(ctx,'cargo',f.x,f.y,scale*.8)){ctx.fillStyle='#937449';ctx.strokeStyle='#dbcd9f';ctx.lineWidth=.04*scale;ctx.fillRect(f.x-.23*scale,f.y+.2*scale,.46*scale,.55*scale);ctx.strokeRect(f.x-.23*scale,f.y+.2*scale,.46*scale,.55*scale);}}}
  ctx.restore();
 }
 function depthEntries(v,view){const a=state.active,p=a?.stage==='field'?sitePoint(a.sites[a.index]):null;if(!p||v.z!==0||p.x<view.l-2||p.x>view.r+2||p.y<view.t-2||p.y>view.b+2||!(root.DeadwallFrontierArt?.visiblePoint?.(g,{...p,z:0,inside:null},v)??true))return[];return[{kind:'mission',id:'mission:'+a.kind,depth:p.y+.5,draw:ctx=>draw(ctx,'region',v,{carried:false})}];}
 function reset(){state=initial();task=null;message='';targetCache.clear();candidateCache.clear();worldRef=null;}
 const api=Object.freeze({start,previewStart,begin,previewWork,cancel,finish,previewFinish,abandon,carrying,movementFactor,candidates,sitePoint,overview,actions,draw,depthEntries,busy:()=>!!task,snapshot:()=>normalize(state),restore:raw=>{state=normalize(raw);task=null;message='';targetCache.clear();candidateCache.clear();worldRef=null;},reset});g.campaignPack=api;
 g.expansions.register({id:'campaign',title:'Campagne et secours',overview,actions,validate:normalize,snapshot:api.snapshot,restore:api.restore,reset});
 wrap('update',(old,dt)=>{const running=g.state==='playing'&&!g.paused&&!g.activeOverlay&&!g.gameOver&&Number.isFinite(dt)&&dt>0,before=g.player?.health||0;if(running&&state.active&&(g.player.dead||before<=0))conclude('lost','Opération perdue avec le commandant.');if(running&&task&&(g.input.mouseDown||g.input.touchFire||['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyZ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyF','KeyR','PageUp','PageDown'].some(k=>g.input.keys.has(k)||g.input.pressed.has(k))))cancel();const r=old(dt);if(running)tick(Math.min(R.maxStep,dt),before);return r;});
 wrap('returnToMenu',(old,...args)=>{cancel();return old(...args);});wrap('drawPlayer',(old,ctx,...args)=>{const r=old(ctx,...args);if(!g.frontier.active())draw(ctx,'local');return r;});return api;
}
const api={install,initial,normalize};root.DeadwallCampaignPack=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
