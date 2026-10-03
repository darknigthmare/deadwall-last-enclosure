/* One physical trip per assignment. No second inventory, generated loot, or fake worker. */
(function(root){
 'use strict';const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.DeadwallCore,R=C.Salvage.RULES;
 const live=u=>u&&!u.dead&&u.health>0;
 function install(g){if(!g||g.salvage)return g?.salvage;
  let state=C.Salvage.empty(),world=g.world,pending=null,notice='',jobs=new Map();
  const wrap=(name,fn)=>{const old=g[name].bind(g);g[name]=(...args)=>fn(old,...args);};
  const running=()=>g.state==='playing'&&!g.gameOver&&!g.paused&&!g.activeOverlay;
  function ensure(){if(world!==g.world){world=g.world;state=C.Salvage.normalize(pending||undefined);pending=null;notice='';jobs.clear();}return state;}
  function isAssigned(id){ensure();return state.crews.some(c=>c.id===id);}
  const structures=()=>[...g.world.buildings.values()].filter(b=>live(b)&&b.completed);
  function slots(){return Math.min(R.maxCrews,structures().filter(b=>b.type==='warehouse').length*R.perWarehouse);}
  function busy(id){const t=g.territories.snapshot();return isAssigned(id)||g.expeditions?.isAssigned(id)||t.withdrawing.includes(id)||Object.values(t.sectors).some(s=>s.workerId===id)||g.siege.isAssigned(id)||g.infrastructure.isAssigned(id)||g.citadel.isEscort(id);}
  function site(id){return g.dayworks.snapshot().sites.find(s=>s.id===id);}
  function reconcile(){ensure();for(const c of [...state.crews]){const u=g.units.find(u=>u.id===c.id);if(!live(u)){state.crews.splice(state.crews.indexOf(c),1);state.stats.lost++;jobs.delete(c.id);continue;}}
   let n=0;for(const c of state.crews)if(!c.returning&&(g.phase!=='calm'||g.workerOrder==='retreat'||!g.world.has('planningOffice')||++n>slots()))c.returning=true;
  }
  function status(id){ensure();const s=site(id);let reason='';
   if(!g.canIssueCommand()||!live(g.player))reason='Commandement actif et commandant debout requis.';
   else if(g.phase!=='calm')reason='Les équipes partent uniquement pendant le calme.';
   else if(g.workerOrder==='retreat')reason='Le repli général est actif.';
   else if(!s?.seen||s.survey!==C.Dayworks.RULES.surveySeconds)reason='Terminez vous-même le relevé de ce lieu.';
   else if(s.remaining<=.001)reason='Les réserves de ce lieu sont épuisées.';
   else if(!g.world.has('planningOffice')||!slots())reason='Bureau de chantier et entrepôt achevés requis.';
   else if(state.crews.some(c=>c.site===id))reason='Une équipe est déjà en charge de ce lieu.';
   else if(state.crews.length>=slots())reason='Les équipes occupent toutes les places disponibles.';
   else if(!g.units.some(u=>live(u)&&u.kind==='worker'&&!busy(u.id)))reason='Aucun ouvrier disponible pour cette sortie.';
   else if(!C.canAfford(g.resources,R.cost))reason='Quatre rations de préparation requises.';
   else if(state.stats.dispatched>=R.maxCounter)reason='Limite technique du registre atteinte.';
   return{ok:!reason,reason:reason||'Un trajet, un chargement, un retour. Les rations sont consommées au départ.',cost:{...R.cost},slots:slots()};
  }
  function assign(id){reconcile();const q=status(id);if(!q.ok){notice=q.reason;return q;}
   const u=g.units.filter(u=>live(u)&&u.kind==='worker'&&!busy(u.id)).sort((a,b)=>a.id-b.id)[0];if(!u||!C.spend(g.resources,R.cost))return{ok:false,reason:'Affectation devenue indisponible.'};
   state.crews.push({id:u.id,site:id,returning:false,prepared:!(u.carry>0)});state.stats.dispatched++;u.navigation=null;u.targetNode=-1;u.targetBuilding=-1;u.state=u.carry>0?'return':'move';
   notice='Ouvrier #'+u.id+' détaché : son éventuel sac précédent est déposé avant le départ.';g.notify(notice);g.audio?.ui();g.save(false);return{ok:true,id:u.id,reason:notice};
  }
  function recall(id){ensure();const c=state.crews.find(c=>c.id===id);if(!g.canIssueCommand()||!c)return false;c.returning=true;const u=g.units.find(u=>u.id===id);if(u)u.navigation=null;notice='Rappel transmis. Les ressources portées restent dans le sac jusqu’au dépôt.';g.save(false);return true;}
  function finish(c,u){state.crews.splice(state.crews.indexOf(c),1);state.stats.returned++;jobs.delete(c.id);u.state='idle';u.think=0;u.targetNode=-1;u.targetBuilding=-1;u.navigation=null;g.notify('Ouvrier #'+u.id+' rentré : récupération terminée.');}
  function secure(p){return !g.zombies.some(z=>live(z)&&Math.hypot(z.x-p.x,z.y-p.y)<R.dangerRadius&&g.hostileLineClear(z,p));}
  function updateAssignedUnit(u,dt){ensure();const c=state.crews.find(c=>c.id===u.id);if(!c||!live(u))return false;if(!running()||!Number.isFinite(dt)||dt<=0)return true;dt=Math.min(dt,R.maxStep);
   const home=g.core();if(!home)return true;const s=site(c.site);
   if(g.phase!=='calm'||g.workerOrder==='retreat'||!g.world.has('planningOffice')||!slots()||!secure(u)||s&&!secure(s))c.returning=true;
   if(!c.prepared||c.returning){u.state=c.returning?'flee':'return';
    if(u.carry>0){g.depositWorker(u,home,dt);jobs.set(u.id,{phase:'return',text:g.workerCanWorkAt(u,home,R.homeRange)&&u.carry>0?'Dépôt saturé : sac conservé':c.returning?'Retour avec la cargaison':'Dépôt du sac avant la sortie'});return true;}
    if(!g.workerCanWorkAt(u,home,R.homeRange)){g.moveWorkerToJob(u,home,dt,'salvage-home:'+u.id);jobs.set(u.id,{phase:'return',text:'Repli vers le centre'});return true;}
    if(c.returning){finish(c,u);return true;}c.prepared=true;
   }
   if(!s||s.remaining<=.001){c.returning=true;return true;}
   if(u.carry>=u.maxCarry-.001){c.returning=true;return true;}
   if(!g.workerCanWorkAt(u,s,R.range)){u.state='move';g.moveWorkerToJob(u,s,dt,'salvage-site:'+c.site);jobs.set(u.id,{phase:'outbound',text:u.navigation?.cells===null?'Passage bloqué : en attente d’un accès':'Rejoindre '+C.Dayworks.BY_ID[c.site].name});return true;}
   u.state='gather';const resource=C.Dayworks.BY_ID[c.site].resource,amount=g.dayworks.recoverForWorker(u,c.site,dt);jobs.set(u.id,{phase:'loading',text:'Chargement · '+u.carry.toFixed(1)+' / '+u.maxCarry+' '+C.RESOURCE_META[resource].label.toLowerCase()});
   if(amount>0&&u.carry>=u.maxCarry-.001||site(c.site)?.remaining<=.001)c.returning=true;return true;
  }
  function overview(){reconcile();return{slots:slots(),crews:state.crews.map(c=>{const u=g.units.find(u=>u.id===c.id);return{...c,name:C.Dayworks.BY_ID[c.site].name,carry:u?.carry||0,resource:u?.carryType||null,x:u?.x,y:u?.y,job:jobs.get(c.id)?.text||(c.returning?'Retour demandé':'Départ préparé')}}),stats:{...state.stats},notice};}
  wrap('serialize',(old,...args)=>{reconcile();return{...old(...args),salvage:C.Salvage.normalize(state)};});
  wrap('restoreSave',(old,input)=>{const data=root.DeadwallSave.validate(input),before=g.world;pending=data.salvage;try{return old(data);}finally{if(g.world!==before){ensure();reconcile();for(const c of state.crews){const u=g.units.find(u=>u.id===c.id),saved=data.units.find(u=>u.id===c.id);if(u&&saved){u.state=saved.state;u.navigation=null;}}}pending=null;}});
  wrap('startNew',(old,...args)=>{const r=old(...args);ensure();reconcile();return r;});
  wrap('update',(old,dt)=>{reconcile();const r=old(dt);reconcile();return r;});
  const api=Object.freeze({status,assign,recall,isAssigned,updateAssignedUnit,overview,snapshot:()=>{reconcile();return C.Salvage.normalize(state);}});g.salvage=api;return api;
 }
 const api=Object.freeze({install});root.DeadwallSalvage=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
