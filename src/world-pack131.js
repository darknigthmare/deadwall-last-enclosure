/* Four field operations in actual distant buildings; stocks never regenerate on streaming. */
(function(root){'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null),W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null),R=C.WorldOpsRules131,copy=v=>JSON.parse(JSON.stringify(v)),worlds=new Map();
const initial=()=>({version:1,relays:{},secured:[],opened:[],surveyed:[]});
function reference(full){if(!full)return null;const key=full.worldSeed+':'+full.frontier?.generation;if(!worlds.has(key)){worlds.set(key,W.create(full.worldSeed,full.frontier?.generation||3));if(worlds.size>3)worlds.delete(worlds.keys().next().value);}return worlds.get(key);}
function normalize(raw,full){if(raw===undefined)return initial();const bad=()=>{throw Error('Registre des régions lointaines invalide.');};if(!raw||raw.version!==1||Object.keys(raw).some(k=>!['version','relays','secured','opened','surveyed'].includes(k)))bad();const s=initial(),w=reference(full),by=w?new Map(w.pois.map(p=>[p.id,p])):null;
 for(const key of ['secured','opened','surveyed']){if(!Array.isArray(raw[key])||raw[key].length>R.maxRecords||new Set(raw[key]).size!==raw[key].length)bad();s[key]=raw[key].map(id=>{if(typeof id!=='string'||!(key==='surveyed'?/^S\d+_\d+$/:/^P\d{4}$/).test(id))bad();if(w&&(key==='surveyed'?!w.sectors.some(t=>t.id===id):!by.has(id)))bad();return id;});}
 if(!raw.relays||typeof raw.relays!=='object'||Array.isArray(raw.relays)||Object.keys(raw.relays).length>R.maxRecords)bad();
 for(const[id,stock]of Object.entries(raw.relays)){if(!/^P\d{4}$/.test(id)||!stock||Object.keys(stock).some(k=>!C.RESOURCE_KEYS.includes(k)))bad();if(by&&by.get(id)?.occupation!=='allied'&&!s.secured.includes(id))bad();const bag=C.makeBag();for(const k of C.RESOURCE_KEYS){const v=stock[k];if(!Number.isFinite(v)||v<0||v>R.relayCapacity)bad();bag[k]=v;}if(C.bagTotal(bag)>R.relayCapacity+.000001)bad();s.relays[id]=bag;}
 if(full){if(full.frontier?.generation<5&&(Object.keys(s.relays).length||s.secured.length||s.opened.length||s.surveyed.length))bad();const seen=new Set(full.frontier?.seen||[]);for(const id of [...Object.keys(s.relays),...s.secured,...s.opened])if(!seen.has(id))bad();for(const id of s.surveyed)if(w.sectors.find(t=>t.id===id).sites.some(site=>!seen.has(site)))bad();for(const id of s.opened)if(!by.get(id)?.frontier131?.reserve)bad();for(const id of s.secured){const p=by.get(id);if(p?.occupation!=='infected')bad();for(let i=0;i<w.threatCount(p);i++)if(full.frontier.enemies[id+':e'+i]!==0)bad();}for(const p of w.pois)if(p.frontier131?.reserve&&(full.frontier.taken[p.frontier131.reserve]||0)>0&&!s.opened.includes(p.id))bad();}
 return s;
}
function install(g){if(g.worldOps131)return g.worldOps131;if(!g.expansions)return null;let state=initial(),task=null,message='';
 const pos=()=>g.frontier.position(),world=()=>g.frontier.world(),can=()=>g.expansions.canAct(),fail=reason=>{message=reason;return{ok:false,reason};},done=t=>{message=t;g.audio.ui?.();g.notify?.(t,'good');g.save(false);return{ok:true};};
 const nearHome=()=>!pos().active&&g.core()&&g.workerCanWorkAt(g.player,g.core(),100),target=p=>G.global(p,p.w/2,-2),near=p=>{const f=pos(),q=target(p);return f.active&&f.z===0&&!f.car?.driving&&Math.hypot(f.x-q.x,f.y-q.y)<=R.reach&&world().line(f,q,0,null,null,.05);};
 function nearby(){const f=pos();if(!f.active||f.generation<5)return null;return world().nearPOI(f.x,f.y,60).filter(p=>p.generation>=5).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y))[0]||null;}
 function safe(){const f=pos();return![...g.frontier.contacts(),...(g.worldEvolution?.groupMembers()||[]),...(g.succession133?.contacts?.()||[])].some(e=>!e.dead&&(e.hp??e.health)>0&&e.z===f.z&&(f.z===0||(e.inside??e.poi)===f.inside)&&Math.hypot(e.x-f.x,e.y-f.y)<R.danger&&world().line(f,e,f.z,f.inside,null,.05));}
 function cleared(p){for(let i=0;i<world().threatCount(p);i++)if(g.frontier.enemyHealth(p.id+':e'+i)!==0)return false;return true;}
 function preview(kind,id){if(kind==='reserve'&&g.interventions134)return g.interventions134.previewReserve(id);if(!can()||g.player.dead||g.player.health<=0)return{ok:false,reason:'Commandant indisponible.'};if(task||g.expansions.busy('world131'))return{ok:false,reason:'Une intervention est déjà en cours.'};const p=world().pois.find(p=>p.id===id);if(!p||p.generation<5||!near(p))return{ok:false,reason:'Rejoignez à pied l’entrée du site lointain.'};if(!safe())return{ok:false,reason:'Éloignez les infectés de l’entrée.'};if(g.player.reload>0)return{ok:false,reason:'Terminez le rechargement.'};const rule=R[kind];if(!rule)return{ok:false,reason:'Opération inconnue.'};let source=g.player.carry;
  if(kind==='relay'){if(state.relays[id])return{ok:false,reason:'Relais déjà ouvert.'};if(p.occupation!=='allied'&&!state.secured.includes(id))return{ok:false,reason:'Un site infesté doit être entièrement sécurisé.'};}
  if(kind==='secure'&&(p.occupation!=='infected'||state.secured.includes(id)||!cleared(p)))return{ok:false,reason:'Éliminez les occupants de tous les étages avant de certifier le site.'};
  if(kind==='reserve'&&(!p.frontier131.reserve||state.opened.includes(id)))return{ok:false,reason:'Aucune réserve scellée à ouvrir.'};
  if(kind==='survey'&&state.surveyed.includes(p.sector))return{ok:false,reason:'Carrefour déjà relevé.'};
  if(kind==='rest'){source=state.relays[id];if(!source)return{ok:false,reason:'Ouvrez et ravitaillez ce relais.'};if(g.player.health>=g.player.maxHealth)return{ok:false,reason:'Aucun soin nécessaire.'};}
  if(!C.canAfford(source,rule.cost))return{ok:false,reason:kind==='rest'?'Relais : 2 vivres et 1 médicament nécessaires.':'Fournitures insuffisantes dans le sac.'};return{ok:true,seconds:rule.seconds,cost:rule.cost,p,source};
 }
 function begin(kind,id=nearby()?.id){if(kind==='reserve'&&g.interventions134)return g.interventions134.beginReserve(id);const q=preview(kind,id);if(!q.ok)return fail(q.reason);const f=pos();task={kind,id,x:f.x,y:f.y,z:f.z,inside:f.inside,elapsed:0,seconds:q.seconds,health:g.player.health};g.releaseInputs();return{ok:true};}
 const cancel=()=>{if(!task)return false;task=null;message='Intervention interrompue, fournitures conservées.';return true;};
 function finish(t,q){C.spend(q.source,q.cost);g.frontier.revealSites([t.id]);if(t.kind==='relay'){state.relays[t.id]=C.makeBag();message='Relais ouvert et vide. Déposez vos fournitures pour les prochains voyages.';}
  if(t.kind==='secure'){state.secured.push(t.id);g.frontier.annotate(t.id,'cleared');message='Site dégagé : un relais peut y être aménagé. Les migrations peuvent encore revenir.';}
  if(t.kind==='reserve'){state.opened.push(t.id);message='Scellé retiré. Rejoignez la caisse extérieure et maintenez E pour prélever son stock fini.';}
  if(t.kind==='survey'){state.surveyed.push(q.p.sector);const sector=world().sectors.find(s=>s.id===q.p.sector);g.frontier.revealSites(sector?.sites||[]);message='Plan du secteur relevé. Ses accès figurent maintenant dans le carnet et le GPS.';}
  if(t.kind==='rest'){g.player.health=Math.min(g.player.maxHealth,g.player.health+R.rest.health);message='Soins de relais terminés. Les fournitures ont été prélevées dans sa réserve.';}
  done(message);
 }
 function step(dt){if(!task||g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver||!Number.isFinite(dt)||dt<=0)return;const f=pos(),t=task;task=null;const q=preview(t.kind,t.id);task=t;const moving=[...g.input.keys,...g.input.pressed].some(k=>/^Key[WAZQSDERF]$|^Arrow|^Page/.test(k));if(!q.ok||!f.active||f.z!==t.z||f.inside!==t.inside||Math.hypot(f.x-t.x,f.y-t.y)>R.moveTolerance||g.player.health<t.health||g.input.mouseDown||g.input.touchFire||moving){cancel();return;}t.elapsed+=Math.min(.1,dt);g.frontier.signalAt(f,R.workNoise);if(t.elapsed>=q.seconds){task=null;finish(t,q);}}
 function previewTransfer(id,direction){
  if(!['store','take'].includes(direction))return{ok:false,reason:'Transfert inconnu.'};
  if(!can()||g.player.dead||g.player.health<=0)return{ok:false,reason:'Commandant indisponible.'};
  if(task||g.expansions.busy('world131'))return{ok:false,reason:'Terminez ou interrompez l’intervention en cours.'};
  if(g.player.reload>0)return{ok:false,reason:'Terminez le rechargement avant de manipuler les fournitures.'};
  const p=world().pois.find(p=>p.id===id),stock=state.relays[id];
  if(!p||!stock||!near(p))return{ok:false,reason:'Approchez un relais accessible à pied, au niveau du sol.'};
  if(!safe())return{ok:false,reason:'Éloignez les infectés de l’entrée.'};
  const source=direction==='store'?g.player.carry:stock,targetBag=direction==='store'?stock:g.player.carry;
  let room=Math.max(0,(direction==='store'?R.relayCapacity:g.player.carryCapacity)-C.bagTotal(targetBag)),total=0;const amounts={};
  for(const k of C.RESOURCE_KEYS){const n=Math.max(0,Math.min(room,source[k]));amounts[k]=n;room-=n;total+=n;}
  return total>0?{ok:true,total,amounts}:{ok:false,reason:'Sac ou relais plein, ou réserve vide.'};
 }
 function transfer(id,direction){const q=previewTransfer(id,direction);if(!q.ok)return fail(q.reason);const source=direction==='store'?g.player.carry:state.relays[id],targetBag=direction==='store'?state.relays[id]:g.player.carry;for(const[k,n]of Object.entries(q.amounts)){source[k]-=n;targetBag[k]+=n;}return done(Number(q.total.toFixed(2)).toLocaleString('fr-FR')+' fournitures transférées.');}
 function expand(){if(!can()||!nearHome()||g.expansions.busy('world131'))return fail('Rejoignez le dépôt de D-17 avec le commandant libre.');if(pos().generation!==4)return fail('Le noyau régional doit être de génération 4.');const data=g.serialize();if(data.expansions127?.modules.lore131)data.expansions127.modules.lore131.siteGeneration??=4;data.frontier.generation=5;try{g.restoreSave(data);}catch(error){return fail(error.message);}return done('Relevés étendus à 24,576 km de côté. Les anciens lieux et prélèvements sont conservés.');}
 function codexExpansionStatus(){
  if(!can()||!nearHome()||task||g.expansions.busy('world131'))return{ok:false,reason:'Rejoignez le dépôt de D-17 avec le commandant disponible.'};
  if(pos().generation!==7)return{ok:false,reason:'Les plans régionaux G7 sont requis.'};
  if(g.player.reload>0)return{ok:false,reason:'Terminez le rechargement avant d’étendre les relevés.'};
  const runtime=root.DeadwallCodex3000Runtime;
  if(!runtime||runtime.summary().count!==3000)return{ok:false,reason:'Le catalogue Codex 3000 doit être complet avant activation.'};
  return{ok:true};
 }
 function expandCodex3000(){
  const ready=codexExpansionStatus();if(!ready.ok)return fail(ready.reason);
  const data=g.serialize(),effects={detailVersion:data.frontier.detailVersion??0,
   structureDestroyed:id=>(data.worldEvolution?.structures?.[id]??1)<=.001,
   resourceTaken:id=>data.frontier.taken[id]||0};
  const next=W.create(data.worldSeed,8,effects),current=world(),added=next.pois.filter(p=>p.generation===8);
  const builtOver=(point,radius)=>added.some(p=>{const q=G.local(p,point.x,point.y);return q.x>-radius&&q.y>-radius&&q.x<p.w+radius&&q.y<p.h+radius;});
  const newlyBlocked=(point,radius)=>next.blocked(point.x,point.y,radius,point.z,point.inside)&&!current.blocked(point.x,point.y,radius,point.z,point.inside);
  for(const camp of data.expansions127?.modules.survival?.camps||[])if(camp.domain==='region'
    &&(builtOver(camp,C.SurvivalPackRules.campRadius)||newlyBlocked(camp,C.SurvivalPackRules.campRadius)))return fail('Un nouveau site recouvrirait un bivouac. Démontez cette halte sur place avant d’étendre les relevés.');
  for(const device of data.nightGear?.devices||[])if(device.location==='placed'&&device.domain==='region'&&device.z===0
    &&(builtOver(device,.28)||newlyBlocked(device,.28)))return fail('Un nouveau site recouvrirait un éclairage posé. Reprenez ou démontez cet appareil sur place avant l’extension.');
  const parked=data.frontier.car,profile=g.worldEvolution?.vehicleProfile()||C.WorldEvolution.RULES.vehicles.break;
  if(parked&&!next.vehicleClear(parked.x,parked.y,parked.a,profile.w,profile.h)
    &&current.vehicleClear(parked.x,parked.y,parked.a,profile.w,profile.h))return fail('Un nouveau site bloquerait la voiture régionale. Déplacez-la vers un accès dégagé avant l’extension.');
  // A previously paid sector survey retains its map coverage when the catalogue
  // extends it. No other sector is revealed, and no stock is replenished.
  const seen=new Set(data.frontier.seen);
  for(const id of data.expansions127?.modules.world131?.surveyed||[])for(const site of next.sectors.find(s=>s.id===id)?.sites||[])seen.add(site);
  data.frontier.seen=[...seen];data.frontier.generation=8;
  try{if(g.restoreSave(data)!==true)return fail('La sauvegarde a refusé cette extension ; aucun site ajouté.');}catch(error){return fail(error.message);}
  return done('Monde G8 activé : programmes Codex 3000 éligibles sur les routes existantes ; sites historiques préservés.');
 }
 function detailUpgradeStatus159(target=2){
  if(![2,3,4,5].includes(target))return{ok:false,reason:"Révision d’aménagement inconnue."};
  if(!can()||!nearHome()||task||g.expansions.busy('world131')||g.player.reload>0)return{ok:false,reason:'Rejoignez le dépôt, terminez vos actions et le rechargement.'};
  if(pos().generation<7)return{ok:false,reason:'Les cartes G7 ou G8 sont requises.'};
  if((g.frontier.snapshot().detailVersion??0)>=target)return{ok:false,reason:'Les aménagements détaillés sont déjà actifs.'};
  if(!root.DeadwallCodex3000Runtime?.describe||(target>=4&&!root.DeadwallCodex3000Runtime?.quantities)||(target===5&&!root.DeadwallCodex3000Runtime?.ensembles))return{ok:false,reason:'Le catalogue détaillé doit être chargé.'};
  return{ok:true};
 }
 function upgradeDetails159(target=2){
  const ready=detailUpgradeStatus159(target);if(!ready.ok)return fail(ready.reason);
  const data=g.serialize(),current=world(),next=W.create(data.worldSeed,data.frontier.generation,{detailVersion:target,
   structureDestroyed:id=>(data.worldEvolution?.structures?.[id]??1)<=.001,resourceTaken:id=>data.frontier.taken[id]||0});
  const unsafe=(point,radius=.4)=>next.blocked(point.x,point.y,radius,point.z??0,point.inside??point.poi??null)
   &&!current.blocked(point.x,point.y,radius,point.z??0,point.inside??point.poi??null);
  for(const camp of data.expansions127?.modules.survival?.camps||[])if(camp.domain==='region'&&unsafe(camp,C.SurvivalPackRules.campRadius))return fail('Un aménagement gênerait un bivouac. Repliez cette halte avant activation.');
  const parked=data.frontier.car,profile=g.worldEvolution?.vehicleProfile()||C.WorldEvolution.RULES.vehicles.break;
  if(parked&&!next.vehicleClear(parked.x,parked.y,parked.a,profile.w,profile.h)&&current.vehicleClear(parked.x,parked.y,parked.a,profile.w,profile.h))return fail('Un aménagement gênerait le véhicule régional. Déplacez-le avant activation.');
  const points=[];const visit=(value,regional=false,depth=0)=>{
   if(!value||typeof value!=='object'||depth>18)return;
   const own=value.domain==='region'||value.location==='region'||regional;
   if(own&&Number.isFinite(value.x)&&Number.isFinite(value.y))points.push(value);
   for(const [key,child] of Object.entries(value))if(child&&typeof child==='object'&&key!=='frontier')visit(child,own,depth+1);
  };
  visit(data);for(const track of Object.values(data.frontier.tracks||{}))points.push(track);
  if(points.some(p=>unsafe(p)))return fail('Un personnage ou équipement régional occupe un nouvel emplacement. Libérez cet emplacement avant activation.');
  data.frontier.detailVersion=target;
  try{if(g.restoreSave(data)!==true)return fail("La sauvegarde a refusé cette activation ; aucun aménagement appliqué.");}catch(error){return fail(error.message);}
  return done('Aménagements détaillés activés : pièces et cours enrichies, stocks et lieux conservés.');
 }
 function overview(){const f=pos(),p=nearby(),w=f.generation>=5?world():null;return{summary:'Régions lointaines : ouvrir des relais, dégager des bâtiments, récupérer des réserves finies et relever les accès.',rows:[{label:'Carte',value:((w?.size||8192)/1000).toFixed(3)+' km de côté'},{label:'Relais',value:Object.keys(state.relays).length},{label:'Sites dégagés',value:state.secured.length},{label:'Réserves ouvertes',value:state.opened.length},{label:'Secteurs relevés',value:state.surveyed.length},{label:'Site proche',value:p?.name||'Aucun site lointain à proximité'},{label:'Travail',value:task?Math.floor(task.elapsed/task.seconds*100)+' %':message||'Approchez l’entrée d’un site'}],near:p?.id||null,state:copy(state),task:task?{kind:task.kind,progress:task.elapsed/task.seconds}:null,message};}
 function actions(){const p=nearby(),a=[];if(pos().generation>=7){const group=detailUpgradeStatus159(5);a.push({id:'ensembleDetails165',label:'COMPOSER TABLES ET ASSISES',reason:group.reason||'Au dépôt : tables et sièges posés ensemble avec leurs accès. Anciennes sauvegardes et meubles conservés ; aucun nouveau butin.',disabled:!group.ok,run:()=>upgradeDetails159(5),close:true});const series=detailUpgradeStatus159(4);a.push({id:'quantityDetails164',label:'COMPLÉTER LES SÉRIES DE MOBILIER',reason:series.reason||'Au dépôt : quantités du codex, dimensions et dégagements respectés selon la place disponible. Ancien mobilier conservé ; aucun nouveau stock.',disabled:!series.ok,run:()=>upgradeDetails159(4),close:true});const anchored=detailUpgradeStatus159(3);a.push({id:'anchoredDetails160',label:'COMPLÉTER LE MOBILIER ANCRÉ',reason:anchored.reason||'Au dépôt : mobilier contre ses vrais murs, espace de service et retour préservés, aucun stock ajouté.',disabled:!anchored.ok,run:()=>upgradeDetails159(3),close:true});const ready=detailUpgradeStatus159();a.push({id:'richDetails159',label:'ACTIVER LES AMÉNAGEMENTS DÉTAILLÉS',reason:ready.reason||'Au dépôt : enrichir pièces et cours sans nouveau butin. Vos possessions sont vérifiées avant activation.',disabled:!ready.ok,run:upgradeDetails159,close:true});}if(pos().generation===7){const ready=codexExpansionStatus();a.push({id:'expandCodex3000',label:'ÉTENDRE AUX 3 000 PROGRAMMES',reason:ready.reason||'Au dépôt : activer les implantations G8 du Codex 3000 sans changer les anciens lieux.',disabled:!ready.ok,run:expandCodex3000,close:true});}if(pos().generation===4)a.push({id:'expand131',label:'Étendre les relevés régionaux',reason:'Au dépôt : ouvrir les routes au-delà des 8 km historiques.',disabled:!nearHome()||!can(),run:expand,close:true});for(const[k,label]of [['relay','Aménager ce relais'],['secure','Certifier le site dégagé'],['reserve','Ouvrir la réserve scellée'],['survey','Relever le plan du carrefour'],['rest','Recevoir les soins du relais']]){const q=preview(k,p?.id);a.push({id:k,label,disabled:!q.ok,reason:q.reason||(k==='reserve'&&g.interventions134?'Mini-jeu sur le contenant · ':q.seconds+' s sur place · ')+Object.entries(q.cost).map(([r,n])=>n+' '+C.RESOURCE_META[r].label).join(', '),run:()=>begin(k,p.id),close:true});}if(p&&state.relays[p.id])for(const [dir,label]of [['store','Déposer le sac au relais'],['take','Reprendre les fournitures']]){const q=previewTransfer(p.id,dir);a.push({id:dir,label,disabled:!q.ok,reason:q.reason||Math.floor(C.bagTotal(state.relays[p.id]))+' / '+R.relayCapacity+' fournitures',run:()=>transfer(p.id,dir),close:true});}if(task)a.push({id:'cancel',label:'Interrompre',run:()=>({ok:cancel()}),close:true});return a;}
 function depthEntries(v,view){if(v.z!==0)return[];const entries=[];for(const p of v.world.nearPOI(v.x,v.y,80)){const stock=state.relays[p.id],mapped=state.surveyed.includes(p.sector);if(!stock&&!mapped)continue;const q=G.global(p,p.w/2+1.6,-2);if(q.x<view.l||q.x>view.r||q.y<view.t||q.y>view.b)continue;entries.push({kind:'world131',id:'world131:'+p.id,depth:q.y,draw:c=>{c.save();c.strokeStyle='#d8cc9e';c.lineWidth=.08;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x,q.y-1.3);c.stroke();c.fillStyle=stock?'#86a681':'#c4ac73';c.fillRect(q.x,q.y-1.3,.55,.4);if(stock){c.fillStyle='#5f6953';c.fillRect(q.x-.65,q.y-.4,.45,.4);c.fillStyle='#c1caa2';c.fillRect(q.x-.65,q.y-.43,.45,.1);}c.restore();}});}return entries;}
 function completeInterventionReserve(id){if(!g.interventions134?.authorizesReserve(id)||state.opened.includes(id))return false;const p=world().pois.find(p=>p.id===id);if(!p?.frontier131?.reserve)return false;g.frontier.revealSites([id]);state.opened.push(id);return true;}
 const api={detailUpgradeStatus159,upgradeDetails159,completeInterventionReserve,overview,actions,preview,previewTransfer,begin,cancel,step,expand,transfer,opened:id=>state.opened.includes(id),snapshot:()=>copy(state),busy:()=>!!task,activity:()=>task?{kind:task.kind,progress:task.elapsed/task.seconds}:null,depthEntries};g.worldOps131=Object.freeze(api);
 g.expansions.register({id:'world131',title:'Monde & relais',overview,actions,validate:normalize,snapshot:api.snapshot,restore:raw=>{state=normalize(raw);task=null;message='';},reset:()=>{state=initial();task=null;message='';},busy:api.busy});
 const unavailable=()=>!g.player||g.player.dead||g.player.health<=0||g.gameOver||g.state!=='playing';
 const update=g.update.bind(g);g.update=dt=>{if(task&&unavailable())cancel();const r=update(dt);if(task&&unavailable())cancel();step(dt);return r;};const menu=g.returnToMenu.bind(g);g.returnToMenu=(...a)=>{cancel();return menu(...a);};
 const start=g.startNew.bind(g);g.startNew=(...a)=>{const r=start(...a);if(r!==false&&g.state==='playing'&&pos().generation===4){const data=g.serialize();data.frontier.generation=root.DeadwallGeography135?7:5;if(data.frontier.generation>=6){const home=root.DeadwallGeography135.home(data.worldSeed,data.frontier.generation);data.frontier.x=home.maxX+2;data.frontier.y=home.y;}g.restoreSave(data);g.save(false);}return r;};return api;
}
const api={install,normalize,initial};root.DeadwallWorldPack131=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
