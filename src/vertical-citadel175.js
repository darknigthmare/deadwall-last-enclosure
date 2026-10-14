/* One authoritative citadel owner. Cameras read this state; neither creates targets or ammunition. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.VerticalCitadel175,A=C.VerticalAges177;
 const S=root.DeadwallVertical175State||(typeof require==='function'?require('./vertical-citadel175-state.js'):null);
 const N=root.DeadwallVerticalNetwork179||(typeof require==='function'?require('./vertical-network179.js'):null);
 const Siege=root.DeadwallVerticalSiege176||(typeof require==='function'?require('./vertical-siege176.js'):null);
 const copy=o=>JSON.parse(JSON.stringify(o)),live=o=>o&&!o.dead&&o.health>0,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const angle=a=>Math.atan2(Math.sin(a),Math.cos(a)),clamp=C.clamp;
 function install(g){
  if(g.vertical175)return g.vertical175;if(!g.expansions)return null;S.register();
  let network=null;
  let state=S.initial(),job=null,travel=null,controlled=null,view='classic',notice='',scanClock=0,personalShot=false,moduleGroup=A.defaultGroup,dismantleReview=null,catalogueAge=null,engineeringReview178=null;
  const autoTargets=new Map(),wired=new WeakSet(),traces=[],wrap=(key,fn)=>{if(typeof g[key]==='function'){const old=g[key].bind(g);g[key]=(...args)=>fn(old,...args);}};
  const site=id=>state.sites.find(s=>s.id===id),building=id=>g.world?.buildings.get(id),base=b=>b&&R.bases[b.type];
  const structural=b=>live(b)&&b.completed&&!b.siegeOffline&&!b.territoryOffline&&!b.dayOffline;
  const operational=q=>q&&structural(q.b)&&(!(q.def.powerUse>0)||online(q.b));
  const online=b=>live(b)&&b.completed&&!b.siegeOffline&&!b.territoryOffline&&!b.gridOffline&&!b.dayOffline&&(!b.def.powerUse||b.powered);
  const supportMass=s=>S.mass(s)+(network?.load(s.id)||0);
  const can=(allowCargo=false)=>g.expansions.canAct()&&!g.frontier?.active()&&!g.expeditions?.driving()&&!g.expansions.busy('vertical175')&&!g.fieldcraft?.context().mounted&&(allowCargo||!network?.carrying());
  const nativeBusy=()=>!!job||!!travel||controlled!==null;
  const busy=()=>nativeBusy()||!!network?.busy();
  const no=reason=>({ok:false,reason}),say=q=>{notice=q.reason||'';g.notify?.(notice,q.ok?'good':'danger');return q;};
  const ok=reason=>({ok:true,reason});
  function release(){controlled=null;view='classic';g.releaseInputs?.();g.vertical175UI?.release?.();}
  function stop(reason='Travail interrompu ; l’avancement financé est conservé.'){network?.stop();dismantleReview=null;engineeringReview178=null;job=null;travel=null;release();notice=reason;return ok(reason);}
  function moduleRef(id){for(const s of state.sites)for(let level=0;level<s.decks.length;level++){const m=s.decks[level].modules.find(m=>m.id===id);if(m)return{s,b:building(s.id),level,m,def:R.modules[m.kind]};}return null;}
  function wire(b){if(!base(b)||wired.has(b))return;wired.add(b);
   Object.defineProperty(b,'def',{configurable:true,get(){const d=C.BUILDINGS[this.type],s=site(this.id);if(!s||!R.bases[this.type])return d;const n=S.totals(s);return{...d,housing:(d.housing||0)+n.housing,storage:(d.storage||0)+n.storage,powerUse:n.powerUse,score:d.score+n.score,light:n.light,production:n.production,consumes:n.consumes};}});
  }
  function ensure(){for(const b of g.world?.buildings.values()||[])if(base(b)&&live(b)){if(!site(b.id)){if(state.sites.length>=R.maxSites)continue;state.sites.push(S.siteInitial(b.id));}wire(b);}}
  function pose(){const a=state.actor,b=a&&building(a.site),s=a&&site(a.site);const z=b&&s?S.height(s,a.level,base(b)):0;
   const visibleZ=travel?travel.fromZ+(travel.toZ-travel.fromZ)*Math.min(1,travel.elapsed/travel.seconds):z;
   return{x:g.player?.x||0,y:g.player?.y||0,z:visibleZ,site:a?.site??null,level:a?.level??-1,travel:travel?{kind:travel.kind,progress:travel.elapsed/travel.seconds}:null};
  }
  function entrance(b){const q=S.bounds(b),r=(b.rotation||0)%4,offset=1.1;
   const p=r===0?{x:q.x+q.w/2,y:q.y+q.h+offset}:r===1?{x:q.x-offset,y:q.y+q.h/2}:r===2?{x:q.x+q.w/2,y:q.y-offset}:{x:q.x+q.w+offset,y:q.y+q.h/2};return{x:p.x*R.tile,y:p.y*R.tile};
  }
  const target=()=>state.actor?building(state.actor.site):base(g.selectedBuilding)?g.selectedBuilding:[...g.world.buildings.values()].filter(b=>base(b)&&live(b)&&dist(g.player,entrance(b))<R.workReach).sort((a,b)=>dist(g.player,a)-dist(g.player,b))[0]||null;
  function surfaceAt(x,y,z){for(const s of state.sites){const b=building(s.id);if(!live(b)||!b.completed)continue;const q=S.bounds(b);
   if(x<q.x*R.tile||x>=(q.x+q.w)*R.tile||y<q.y*R.tile||y>=(q.y+q.h)*R.tile)continue;
   const level=s.decks.findIndex((d,i)=>d.progress===1&&Math.abs(S.height(s,i,base(b))-z)<.001);if(level>=0)return{s,b,level};
  }return network?.surfaceAt(x,y,z)||null;}
  function clearAt(x,y,z,r=g.player.radius*.78){
   if(![x,y,z,r].every(Number.isFinite)||r<0)return false;
   for(const [dx,dy]of [[0,0],[-r,0],[r,0],[0,-r],[0,r],[-r*.71,-r*.71],[r*.71,r*.71],[-r*.71,r*.71],[r*.71,-r*.71]])if(!surfaceAt(x+dx,y+dy,z))return false;
   for(const s of state.sites){const b=building(s.id);if(!live(b))continue;const i=s.decks.findIndex((d,k)=>d.progress===1&&Math.abs(S.height(s,k,base(b))-z)<.001);if(i<0)continue;
    for(const m of s.decks[i].modules){const box=S.moduleBox(b,m,z);if(x+r>box.x*R.tile&&x-r<(box.x+box.w)*R.tile&&y+r>box.y*R.tile&&y-r<(box.y+box.h)*R.tile)return false;}
   }return true;
  }
  function accessQuote(id,level=0,kind='stairs'){
   const b=building(id),s=site(id);if(!can(true)||busy()||g.player.reload>0)return no('Libérez vos mains et terminez le rechargement.');
   if(!live(b)||!b.completed||!s||!Number.isInteger(level)||level<-1||level>=s.decks.length||level>=0&&s.decks[level].progress!==1||!['stairs','lift'].includes(kind))return no('Palier inexistant ou chantier inachevé.');
   if(state.actor&&state.actor.site!==id)return no('Rejoignez la cage intérieure de ce support.');
   if(!state.actor&&level<0||state.actor?.level===level)return no('Vous êtes déjà sur ce palier.');
   const anchor=state.actor?{x:b.x,y:b.y}:entrance(b);
   if(dist(g.player,anchor)>R.workReach||!state.actor&&!g.workerCanWorkAt(g.player,anchor,R.workReach))return no('Rejoignez l’entrée intérieure, ou le palier central.');
   if(kind==='lift'&&(s.lift!==1||!online(b)))return no('Ascenseur inachevé ou hors tension : utilisez les escaliers.');
   const to=level<0?entrance(b):{x:b.x,y:b.y};if(level<0&&!groundClear(g.player,to.x,to.y)||level>=0&&!clearAt(to.x,to.y,S.height(s,level,base(b))))return no('Le palier de sortie est obstrué.');
   const fromZ=pose().z,toZ=level<0?0:S.height(s,level,base(b));return{ok:true,b,s,level,kind,fromZ,toZ,to,seconds:Math.abs(toZ-fromZ)/(kind==='lift'?R.liftSpeed:R.stairSpeed)+R.landingSeconds};
  }
  function access(id,level=0,kind='stairs'){const q=accessQuote(id,level,kind);if(!q.ok)return say(q);
   travel={...q,elapsed:0,world:g.world,health:g.player.health};g.cancelPlacement();g.releaseInputs();notice=(kind==='lift'?'Ascenseur':'Escalier intérieur')+' : progression vers '+q.toZ+' m.';return ok(notice);
  }
  function currentWorkSite(id){const b=building(id),s=site(id);if(!can()||busy()||g.player.reload>0)return no('Une autre action occupe vos mains.');
   if(!live(b)||!b.completed||!s)return no('Achevez le support porteur.');
   if(!state.actor||state.actor.site!==id)return no('Montez sur le support avant de lancer ses travaux.');
   if(dist(g.player,{x:b.x,y:b.y})>R.workReach)return no('Rejoignez le palier central pour travailler.');return{ok:true,b,s,level:state.actor.level};
  }

  function catalogue(age=g.tier.id){
   if(!Number.isInteger(age)||age<0||age>=C.CITY_TIERS.length)return null;
   return {age,name:C.CITY_TIERS[age].name,theme:A.ages[age].theme,height:A.ages[age].height,
    supports:Object.values(R.bases).filter(b=>b.unlockTier===age).map(b=>({id:b.id,name:b.name,height:b.height,cost:{...b.cost}})),
    modules:Object.entries(R.modules).filter(([,d])=>d.tier===age).map(([id,d])=>({id,name:d.name,cost:{...d.cost},mass:d.mass,manualOnly:!!d.manualOnly}))};
  }
  function productionPlans(b){
   const s=site(b.id);if(!s)return null;
   return s.decks.filter(d=>d.progress===1).flatMap(d=>d.modules.filter(m=>m.progress===1&&m.health>0&&R.modules[m.kind].production&&!(job?.kind==='engineering178'&&job.object===m)&&!network?.moduleSuspended(m.id)).map(m=>R.modules[m.kind]));
  }
  function maintenanceQuote(id,kind){
   const q=moduleRef(id);
   if(!can()||busy()||g.player.reload>0||!nearModule(q))return no('Rejoignez cet équipement sur son palier et libérez vos mains.');
   if(kind==='repair'){
    const amount=Math.min(A.repairHealth,q.def.health-q.m.health);
    if(amount<=0)return no('Intégrité complète.');
    const cost=Object.fromEntries(Object.entries(q.def.cost).filter(([k])=>['wood','scrap','stone'].includes(k)).map(([k,n])=>[k,Math.ceil(n*A.repairFraction*amount/q.def.health)]));
    if(!C.canAfford(g.resources,cost))return no('Matériaux manquants au dépôt : '+C.resourceText(cost));
    return {...q,ok:true,kind,cost,amount,seconds:A.repairSeconds};
   }
   if(kind==='medical'){
    const care=q.def.medical;
    if(!care||!operational(q))return no('Poste de soins absent ou hors tension.');
    if(g.player.health>=g.player.maxHealth)return no('Aucun soin nécessaire.');
    if((g.player.carry.medicine||0)<care.medicine)return no('Médicaments requis dans le sac : '+care.medicine+'.');
    const origin={x:g.player.x/R.tile,y:g.player.y/R.tile,z:pose().z+R.eyeHeight},visible=sightQuery(origin,A.medicalDanger,q.m.id);
    if([...g.zombies,...state.giants].some(visible))return no('Menace visible trop proche : sécurisez le poste.');
    return {...q,ok:true,kind,care,seconds:care.seconds};
   }
   if(kind==='dismantle'){
    const capacity=Math.max(100,g.storage-(q.def.storage||0));
    if(C.RESOURCE_KEYS.some(k=>g.resources[k]>capacity+.000001))return no('Réduisez les stocks avant de retirer cette réserve : capacité restante '+capacity+'.');
    const wanted=Object.fromEntries(Object.entries(q.def.cost).map(([k,n])=>[k,wholeRefund178(n*A.salvageFraction*q.m.health/q.def.health)]));
    wanted.ammo=(wanted.ammo||0)+q.m.ammo;
    const refund=Object.fromEntries(Object.entries(wanted).map(([k,n])=>[k,Math.min(n,Math.max(0,capacity-(g.resources[k]||0)))]));
    return {...q,ok:true,kind,capacity,refund,seconds:A.dismantleSeconds};
   }
   return no('Intervention inconnue.');
  }
  function beginMaintenance(q){
   dismantleReview=null;
   job={kind:q.kind,id:q.s.id,level:q.level,object:q.m,seconds:q.seconds,elapsed:0,
    x:g.player.x,y:g.player.y,health:g.player.health,moduleHealth:q.m.health,world:g.world,bag:g.player.carry};
   g.releaseInputs();notice='Intervention : '+q.def.name+'. Restez à proximité ; paiement seulement à la fin.';return ok(notice);
  }
  function repairModule(id){const q=maintenanceQuote(id,'repair');return q.ok?beginMaintenance(q):say(q);}
  function useMedical(id){const q=maintenanceQuote(id,'medical');return q.ok?beginMaintenance(q):say(q);}
  function dismantleModule(id,confirm=false){
   const q=maintenanceQuote(id,'dismantle');if(!q.ok){dismantleReview=null;return say(q);}
   const fingerprint=JSON.stringify([q.m,q.capacity,g.resources]);
   if(!confirm||!dismantleReview||dismantleReview.id!==id||dismantleReview.fingerprint!==fingerprint||dismantleReview.world!==g.world){
    dismantleReview={id,fingerprint,world:g.world};notice='Confirmer le démontage de '+q.def.name+' ? Capacités retirées ; récupération plafonnée : '+C.resourceText(q.refund)+'.';return {ok:false,confirmation:true,reason:notice};
   }
   return beginMaintenance(q);
  }
  function serviceStep(j,dt){
   const current=moduleRef(j.object.id);
   if(!current||current.m!==j.object||j.object.health<j.moduleHealth||g.player.carry!==j.bag){job=null;notice='Intervention interrompue ; aucune ressource débitée.';return;}
   // The same pure quote is revalidated; it normally rejects our own active job.
   job=null;let q;try{q=maintenanceQuote(j.object.id,j.kind);}finally{job=j;}
   if(!q.ok){job=null;notice=q.reason;return;}
   j.elapsed+=dt;if(j.elapsed+1e-8<j.seconds)return;
   if(j.kind==='repair'){C.spend(g.resources,q.cost);q.m.health=Math.min(q.def.health,q.m.health+q.amount);}
   else if(j.kind==='medical'){j.bag.medicine-=q.care.medicine;g.player.health=Math.min(g.player.maxHealth,g.player.health+q.care.heal);}
   else{
    q.s.decks[q.level].modules=q.s.decks[q.level].modules.filter(m=>m!==q.m);autoTargets.delete(q.m.id);g.refreshMetrics(true);
    for(const [k,n]of Object.entries(q.refund))g.resources[k]+=Math.min(n,Math.max(0,g.storage-g.resources[k]));
   }
   job=null;notice=j.kind==='dismantle'?'Équipement démonté ; emplacement libéré.':j.kind==='repair'?'Réparation effectuée ; matériaux débités une seule fois.':'Soins terminés ; médicaments prélevés dans le sac.';g.audio?.build?.();g.refreshMetrics(true);
  }
  // Keep whole material counts at decimal boundaries (180 * .35 is not exact in binary).
  const wholeRefund178=amount=>Math.floor(amount+C.VerticalMaintenance178.refundEpsilon);
  function engineeringClear178(b,level,kind,slot,ignoreId=null){
   const footprint=S.moduleBox(b,{kind,slot},S.height(site(b.id),level,base(b))),bounds=S.bounds(b);
   if(footprint.x<bounds.x||footprint.y<bounds.y||footprint.x+footprint.w>bounds.x+bounds.w||footprint.y+footprint.h>bounds.y+bounds.h)return no('Équipement trop large pour ce support.');
   const overlaps=box=>footprint.x<box.x+box.w&&footprint.x+footprint.w>box.x&&footprint.y<box.y+box.h&&footprint.y+footprint.h>box.y;
   for(const m of site(b.id).decks[level].modules)if(m.id!==ignoreId&&(m.slot===slot||overlaps(S.moduleBox(b,m,footprint.z))))return no('Emplacement ou emprise déjà occupé.');
   const actorBox=(e,r)=>({x:(e.x-r)/R.tile,y:(e.y-r)/R.tile,w:2*r/R.tile,h:2*r/R.tile});
   if(Math.abs(pose().z-footprint.z)<.1&&overlaps(actorBox(g.player,g.player.radius*.78)))return no('Écartez-vous de la destination avant les travaux.');
   for(const z of g.zombies)if(live(z)&&Math.abs(siege.enemyPose(z).z-footprint.z)<.1&&overlaps(actorBox(z,z.radius)))return no('Destination occupée par un infecté : sécurisez le palier.');
   if(network?.reserveConflict(b,level,footprint))return no('Gardez les accès des passerelles et les caisses libres.');
   return ok('Emprise libre.');
  }
  function engineeringQuote178(kind,id,slot){
   const E=C.VerticalMaintenance178;
   if(network?.protectedStructure(kind,id))return no('Déposez les liaisons et récupérez les caisses de cette dalle avant son retrait.');
   if(!can()||busy()||g.player.reload>0)return no('Libérez vos mains avant l’intervention.');
   let q,object,level,seconds,cost={},refund={},amount=0;
   if(kind==='relocate'||kind==='cancelModule'){
    q=moduleRef(id);
    if(!q||!structural(q.b)||!state.actor||state.actor.site!==q.s.id||state.actor.level!==q.level)return no('Rejoignez l’équipement sur son palier.');
    const p=S.slots(q.b)[q.m.slot];
    if(Math.hypot(g.player.x-p.x*R.tile,g.player.y-p.y*R.tile)>R.workReach)return no('Approchez l’équipement à reconfigurer.');
    object=q.m;level=q.level;
    if(kind==='relocate'){
     if(q.m.progress!==1||!Number.isInteger(slot)||slot<0||slot>3||slot===q.m.slot)return no('Choisissez un autre emplacement pour un équipement achevé.');
     const clear=engineeringClear178(q.b,level,q.m.kind,slot,q.m.id);if(!clear.ok)return clear;
     cost=Object.fromEntries(Object.entries(q.def.cost).filter(([k])=>E.materials.includes(k)).map(([k,n])=>[k,Math.ceil(n*E.moveCostFraction)]));
     seconds=E.moveSeconds+q.def.mass*E.moveSecondsPerMass;
    }else{
     if(q.m.progress===1)return no('Équipement achevé : utilisez son démontage ordinaire.');
     seconds=E.cancelSeconds;
     refund=Object.fromEntries(Object.entries(q.def.cost).map(([k,n])=>[k,wholeRefund178(n*A.salvageFraction*q.m.progress*q.m.health/q.def.health)]));
    }
   }else{
    q=currentWorkSite(id);if(!q.ok)return q;
    if(!structural(q.b))return no('Support indisponible pour les travaux.');
    level=q.level;
    if(kind==='removeDeck'){
     const top=q.s.decks.length-1;
     if(top<=0||base(q.b).wall)return no('La dalle de base et les chemins de ronde sont indissociables du support.');
     if(level!==top-1)return no('Redescendez sur le palier immédiatement inférieur pour déposer la dalle supérieure.');
     object=q.s.decks[top];
     if(object.modules.length)return no('Videz tous les équipements et chantiers de la dalle supérieure.');
     const z=S.height(q.s,top,base(q.b));
     if(g.zombies.some(e=>live(e)&&siege.enemyPose(e).site===id&&Math.abs(siege.enemyPose(e).z-z)<.1))return no('Un infecté occupe encore la dalle.');
     seconds=E.deckDismantleSeconds;
     refund=Object.fromEntries(Object.entries(R.deck.cost).map(([k,n])=>[k,wholeRefund178(n*A.salvageFraction*object.progress*object.health/R.deck.health)]));
    }else if(kind==='removeLift'){
     if(q.s.lift<=0)return no('Aucun ascenseur ni chantier à déposer.');
     object=q.s;seconds=E.liftDismantleSeconds;
     refund=Object.fromEntries(Object.entries(R.lift.cost).map(([k,n])=>[k,wholeRefund178(n*A.salvageFraction*q.s.lift)]));
    }else if(kind==='repairDeck'){
     if(level<=0)return no('Réparez le support au sol pour entretenir sa dalle de base.');
     object=q.s.decks[level];amount=Math.min(E.deckRepairHealth,R.deck.health-object.health);
     if(object.progress!==1||amount<=0)return no('Dalle inachevée ou intégrité complète.');
     cost=Object.fromEntries(Object.entries(R.deck.cost).map(([k,n])=>[k,Math.ceil(n*A.repairFraction*amount/R.deck.health)]));
     seconds=E.deckRepairSeconds;
    }else return no('Opération de reconfiguration inconnue.');
   }
   if(!C.canAfford(g.resources,cost))return no('Matériaux manquants au dépôt : '+C.resourceText(cost));
   // Capacity is unchanged: no occupied deck, completed warehouse or habitat is removed here.
   refund=Object.fromEntries(Object.entries(refund).map(([k,n])=>[k,Math.min(n,Math.max(0,g.storage-(g.resources[k]||0)))]));
   return {...q,ok:true,kind,object,level,slot,seconds,cost,refund,amount};
  }
  function engineering178(kind,id,slot,confirm=false){
   const q=engineeringQuote178(kind,id,slot);if(!q.ok){engineeringReview178=null;return say(q);}
   if(['removeDeck','removeLift','cancelModule'].includes(kind)){
    const fingerprint=JSON.stringify([kind,id,slot,q.object,q.b.health,q.s.decks.length,g.resources]);
    if(!confirm||engineeringReview178?.fingerprint!==fingerprint||engineeringReview178.world!==g.world){
     engineeringReview178={kind,id,fingerprint,world:g.world};notice='Confirmer la dépose ? Les accès restants sont conservés. Récupération plafonnée : '+C.resourceText(q.refund)+'.';
     return {ok:false,confirmation:true,reason:notice};
    }
   }
   engineeringReview178=null;dismantleReview=null;
   job={kind:'engineering178',operation:kind,requestedId:id,slot,object:q.object,id:q.s.id,level:q.level,seconds:q.seconds,elapsed:0,
    x:g.player.x,y:g.player.y,health:g.player.health,targetHealth:q.object.health??q.b.health,supportHealth:q.b.health,world:g.world};
   g.releaseInputs();notice='Reconfiguration en cours ; restez sur ce palier. Aucun paiement avant achèvement.';return ok(notice);
  }
  function engineeringStep178(j,dt){
   job=null;let q;try{q=engineeringQuote178(j.operation,j.requestedId,j.slot);}finally{job=j;}
   if(!q.ok||q.object!==j.object||(q.object.health??q.b.health)<j.targetHealth||q.b.health<j.supportHealth){job=null;notice=q.ok?'Travaux interrompus par des dégâts ; rien n’a été déplacé ni débité.':q.reason;return;}
   j.elapsed+=dt;if(j.elapsed+1e-8<j.seconds)return;
   C.spend(g.resources,q.cost);
   if(j.operation==='relocate'){q.m.slot=j.slot;autoTargets.delete(q.m.id);}
   else if(j.operation==='removeDeck')q.s.decks.pop();
   else if(j.operation==='removeLift')q.s.lift=0;
   else if(j.operation==='repairDeck')q.object.health=Math.min(R.deck.health,q.object.health+q.amount);
   else if(j.operation==='cancelModule')q.s.decks[q.level].modules=q.s.decks[q.level].modules.filter(m=>m!==q.m);
   job=null;g.refreshMetrics(true);
   for(const [k,n]of Object.entries(q.refund))g.resources[k]+=Math.min(n,Math.max(0,g.storage-g.resources[k]));
   notice=j.operation==='relocate'?'Équipement déplacé ; identité, intégrité et munitions conservées.':j.operation==='repairDeck'?'Dalle réparée ; matériaux débités.':'Dépose achevée ; matériaux récupérés dans la limite du stockage.';
   g.audio?.build?.();
  }
  function moduleQuote(kind,slot,id=state.actor?.site){const q=currentWorkSite(id),d=R.modules[kind];if(!q.ok)return q;
   if(!d||!Number.isInteger(slot)||slot<0||slot>3)return no('Équipement ou emplacement inconnu.');
   if(g.tier.id<d.tier)return no('Âge requis : '+C.CITY_TIERS[d.tier].name+'.');
   const clearance178=engineeringClear178(q.b,q.level,kind,slot);if(!clearance178.ok)return clearance178;
   const footprint=S.moduleBox(q.b,{kind,slot},S.height(q.s,q.level,base(q.b)));
   const bounds=S.bounds(q.b);if(footprint.x<bounds.x||footprint.y<bounds.y||footprint.x+footprint.w>bounds.x+bounds.w||footprint.y+footprint.h>bounds.y+bounds.h)return no('Équipement trop large pour ce support.');
   if(g.zombies.some(z=>live(z)&&siege.enemyPose(z).site===id&&Math.abs(siege.enemyPose(z).z-footprint.z)<.1&&z.x+z.radius>footprint.x*R.tile&&z.x-z.radius<(footprint.x+footprint.w)*R.tile&&z.y+z.radius>footprint.y*R.tile&&z.y-z.radius<(footprint.y+footprint.h)*R.tile))return no('Emplacement occupé par un infecté : sécurisez le palier.');
   if(q.s.decks[q.level].modules.some(m=>m.slot===slot))return no('Cet emplacement est déjà occupé.');
   if(state.sites.reduce((n,s)=>n+s.decks.reduce((v,d)=>v+d.modules.length,0),0)+state.network.crates.length+Number(!!state.network.cargo)>=R.maxModules||state.nextId>=Number.MAX_SAFE_INTEGER)return no('Limite de construction atteinte.');
   if(supportMass(q.s)+d.mass>base(q.b).capacity)return no('Charge portante dépassée : utilisez une fondation plus profonde.');
   if(!C.canAfford(g.resources,d.cost))return no('Matériaux manquants au dépôt : '+C.resourceText(d.cost));return{...q,kind,slot,def:d,cost:d.cost};
  }
  function launchJob(q,kind,object,seconds){job={kind,object,id:q.b.id,level:q.level,seconds,x:g.player.x,y:g.player.y,health:g.player.health,world:g.world,elapsed:0};g.releaseInputs();notice='Travaux en cours : restez au palier central.';g.refreshMetrics(true);return ok(notice);}
  function buildModule(kind,slot,id=state.actor?.site){const q=moduleQuote(kind,slot,id);if(!q.ok)return say(q);
   const m={id:state.nextId++,kind,slot,progress:0,health:q.def.health,ammo:0,yaw:-Math.PI/2,pitch:0,heat:0,cooldown:0,overheated:false};C.spend(g.resources,q.cost);q.s.decks[q.level].modules.push(m);return launchJob(q,'module',m,q.def.seconds);
  }
  function deckQuote(id=state.actor?.site){const q=currentWorkSite(id);if(!q.ok)return q;const n=q.s.decks.length;
   if(base(q.b).wall)return no('Les remparts portent leur chemin de ronde ; les quartiers superposés nécessitent des fondations.');
   if(q.level!==n-1||q.s.decks.some(d=>d.progress<1))return no('Rejoignez la dernière dalle achevée.');
   if(S.height(q.s,n,base(q.b))>A.ages[g.tier.id].height)return no('Hauteur de chantier autorisée à cet âge : '+A.ages[g.tier.id].height+' m. Les anciens paliers restent accessibles.');
   if(n>=(base(q.b).maxDecks??R.maxDecks)||S.height(q.s,n,base(q.b))>R.maxHeight||supportMass(q.s)+R.deckMass>base(q.b).capacity)return no('Limite de hauteur ou de charge portante atteinte.');
   if(!C.canAfford(g.resources,R.deck.cost))return no('Matériaux requis : '+C.resourceText(R.deck.cost));return q;
  }
  function buildDeck(id=state.actor?.site){const q=deckQuote(id);if(!q.ok)return say(q);const d={progress:0,health:R.deck.health,modules:[]};C.spend(g.resources,R.deck.cost);q.s.decks.push(d);return launchJob(q,'deck',d,R.deck.seconds);}
  function buildLift(id=state.actor?.site){const q=currentWorkSite(id);if(!q.ok)return say(q);const tier=base(q.b).liftTier===undefined?A.liftTier:base(q.b).liftTier;if(tier===null||g.tier.id<tier)return say(no(tier===null?'Ce support léger ne peut pas porter un ascenseur.':'Ascenseur accessible à partir de '+C.CITY_TIERS[tier].name+'.'));if(q.s.lift!==0)return say(no('Ascenseur déjà construit ou en chantier.'));if(!C.canAfford(g.resources,R.lift.cost))return say(no('Matériaux requis : '+C.resourceText(R.lift.cost)));C.spend(g.resources,R.lift.cost);q.s.lift=Number.EPSILON;return launchJob(q,'lift',q.s,R.lift.seconds);}
  function resume(id=state.actor?.site){const q=currentWorkSite(id);if(!q.ok)return say(q);
   const m=q.s.decks[q.level].modules.find(m=>m.progress<1);if(m)return launchJob(q,'module',m,R.modules[m.kind].seconds);
   const d=q.s.decks[q.level+1];if(d&&d.progress<1)return launchJob(q,'deck',d,R.deck.seconds);
   if(q.s.lift>0&&q.s.lift<1)return launchJob(q,'lift',q.s,R.lift.seconds);return say(no('Aucun chantier à reprendre à ce palier.'));
  }
  function nearModule(ref){if(!ref||!structural(ref.b)||ref.m.progress!==1||!state.actor||state.actor.site!==ref.s.id||state.actor.level!==ref.level)return false;
   const p=S.slots(ref.b)[ref.m.slot];return Math.hypot(g.player.x-p.x*R.tile,g.player.y-p.y*R.tile)<=R.workReach;
  }
  function reload(id){const q=moduleRef(id);if(!can()||busy()||!nearModule(q)||!q.def.range||g.player.reload>0)return say(no('Rejoignez l’affût, hors tir et rechargement.'));
   const n=Math.min(q.def.capacity-q.m.ammo,Math.floor(g.player.carry.ammo||0));if(n<=0)return say(no('Chargeur plein, ou aucune munition dans votre sac.'));
   job={kind:'reload',id:q.s.id,level:q.level,object:q.m,seconds:R.reloadSeconds,elapsed:0,amount:n,bag:g.player.carry,x:g.player.x,y:g.player.y,health:g.player.health,world:g.world};g.releaseInputs();return ok('Ravitaillement depuis le sac : restez auprès de l’affût.');
  }
  function possess(id){if(controlled===id){release();return ok('Contrôle automatique rétabli.');}const q=moduleRef(id);
   if(!can()||busy()||g.player.reload>0||!nearModule(q)||!q.def.range||!operational(q))return say(no('Rejoignez à pied un affût opérationnel sur ce palier.'));
   controlled=id;view='classic';g.cancelPlacement();g.releaseInputs();return say(ok('Affût contrôlé : viser et tirer ; V change la vue, I rend le contrôle.'));
  }
  function setView(next){if(controlled===null||!['classic','fps'].includes(next))return false;view=next;g.input.mouseDown=false;g.input.touchFire=false;return true;}
  function aim(yaw,pitch){const q=moduleRef(controlled);if(!q||![yaw,pitch].every(Number.isFinite))return false;q.m.yaw=angle(yaw);q.m.pitch=clamp(pitch,-1.45,1.1);return true;}
  function screenAim(origin){const x=g.input.mouseWorldX,y=g.input.mouseWorldY,visible=sightQuery(origin,R.maxShotRange);let picked=null,best=C.VerticalSiege176.aimPickPixels;
   for(const e of [...g.zombies,...state.giants]){if(!live(e)||!visible(e))continue;const z=siege.enemyPose(e).z,d=R.siege.kinds[e.kind],height=d?.height||(e.kind==='crawler'?.6:1.8),r=(d?.radius||e.radius/R.tile)*R.tile,top=e.y-(z+height)*R.projectedHeight,bottom=e.y-z*R.projectedHeight;
    const delta=Math.hypot(x-C.clamp(x,e.x-r,e.x+r),y-C.clamp(y,top,bottom));if(delta<best){best=delta;picked={x:e.x/R.tile,y:e.y/R.tile,z:C.clamp((e.y-y)/R.projectedHeight,z+.1,z+height-.1)};}
   }return picked||{x:x/R.tile,y:y/R.tile,z:.9};
  }
  function muzzle(q){const p=S.slots(q.b)[q.m.slot],z=S.height(q.s,q.level,base(q.b))+R.muzzleHeight;return{x:p.x,y:p.y,z};}
  function geometry(){const boxes=[];
   for(const b of g.world.buildings.values())if(live(b)&&b.completed){const q=S.bounds(b),s=site(b.id),v=base(b),h=v?.height||(b.def.wall?3:R.structureHeight);
    const open=b.def.gate&&b.gateMode==='open';if(open&&!v)continue;
    const sill=open?v.gateClearance||0:0;
    boxes.push({...q,z:sill,d:h-sill,owner:b.id,type:'structure'});
    if(s)for(let i=0;i<s.decks.length;i++){const d=s.decks[i],z=S.height(s,i,v);if(i&&d.progress===1)boxes.push({...q,z:z-.4,d:.4,owner:b.id,type:'deck'});
     for(const m of d.modules)boxes.push({...S.moduleBox(b,m,z),owner:b.id,module:m.id,type:'module'});
    }
   }boxes.push(...(network?.geometry()||[]));return boxes;
  }
  function groundObstruction(from,to){if(!state.sites.length)return null;const distance=Math.hypot(to.x-from.x,to.y-from.y)/R.tile;if(!distance)return null;
   const origin={x:from.x/R.tile,y:from.y/R.tile,z:C.VerticalSiege176.groundShotHeight},direction={x:(to.x-from.x)/R.tile/distance,y:(to.y-from.y)/R.tile/distance,z:0};let nearest=Infinity;
   for(const s of state.sites){const b=building(s.id),d=b&&base(b);if(!live(b)||!b.completed||d.gate&&b.gateMode==='open')continue;const q=S.bounds(b),hit=S.rayBox(origin,direction,{...q,z:0,d:d.height},distance);if(hit!==null)nearest=Math.min(nearest,hit);}
   return nearest<=distance?{fraction:nearest/distance,vertical176:true}:null;
  }
  function giantBox(e){const d=R.siege.kinds[e.kind];return{x:e.x/R.tile-d.radius,y:e.y/R.tile-d.radius,z:0,w:d.radius*2,h:d.radius*2,d:d.height};}
  function aimPoint(e){return{x:e.x/R.tile,y:e.y/R.tile,z:R.siege.kinds[e.kind]?R.siege.kinds[e.kind].height*.86:((e.kind==='crawler'?.3:.9)+siege.enemyPose(e).z)};}
  function sightQuery(origin,range,ignoreModule=null,boxes=geometry()){
   const blackout=g.nightwatch?.isBlackout?.(),day=blackout?0:clamp(g.daylight?.()??1,0,1),lights=[];
   const clear=(from,to,ignoredOwner=null,ignoredModule=ignoreModule)=>{const a=S.lookAt(from,to),direction=S.direction(a.yaw,a.pitch),distance=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z);return boxes.every(box=>box.owner===ignoredOwner||box.module===ignoredModule||S.rayBox(from,direction,box,Math.max(0,distance-.02))===null);};
   if(day<1){
    for(const l of g.nightwatch?.sources?.(false)||[])if(l.r>0)lights.push({x:l.x/R.tile,y:l.y/R.tile,z:R.eyeHeight,range:l.r/R.tile,owner:l.id??null,angle:l.angle||0,half:l.half??Math.PI});
    for(const s of state.sites){const b=building(s.id);if(!online(b))continue;for(let level=0;level<s.decks.length;level++)for(const m of s.decks[level].modules)if(R.modules[m.kind].light>0&&m.progress===1){const p=S.slots(b)[m.slot];lights.push({x:p.x,y:p.y,z:S.height(s,level,base(b))+R.muzzleHeight,range:R.modules[m.kind].light/R.tile,owner:null,module:m.id,half:Math.PI});}}
   }
   return e=>{if(!live(e))return false;const to=aimPoint(e),distance=Math.hypot(to.x-origin.x,to.y-origin.y,to.z-origin.z);if(distance>range||!clear(origin,to))return false;
    if(distance<=Math.max(R.nightSight,range*day))return true;
    return lights.some(l=>Math.hypot(to.x-l.x,to.y-l.y,to.z-l.z)<=l.range&&Math.abs(angle(Math.atan2(to.y-l.y,to.x-l.x)-(l.angle||0)))<=l.half&&clear(l,to,l.owner,l.module??null));
   };
  }
  function raycast(origin,yaw,pitch,range,ignoreModule=null,boxes=geometry()){
   const dir=S.direction(yaw,pitch);let best={distance:range,type:'miss',entity:null};
   if(dir.z<0){const d=-origin.z/dir.z;if(d>=0&&d<best.distance)best={distance:d,type:'ground',entity:null};}
   for(const box of boxes){if(box.module===ignoreModule)continue;const d=S.rayBox(origin,dir,box,best.distance);if(d!==null&&d<best.distance)best={distance:d,type:box.type,entity:box};}
   for(const e of g.zombies){if(!live(e))continue;const h=e.kind==='crawler'?.6:1.8,r=e.radius/R.tile,box={x:e.x/R.tile-r,y:e.y/R.tile-r,z:siege.enemyPose(e).z,w:2*r,h:2*r,d:h};const d=S.rayBox(origin,dir,box,best.distance);if(d!==null&&d<best.distance)best={distance:d,type:'zombie',entity:e};}
   for(const e of state.giants){const d=S.rayBox(origin,dir,giantBox(e),best.distance);if(d!==null&&d<best.distance)best={distance:d,type:'giant',entity:e};}
   return{...best,origin,point:{x:origin.x+dir.x*best.distance,y:origin.y+dir.y*best.distance,z:origin.z+dir.z*best.distance}};
  }
  function hit(result,damage){if(result.type==='zombie'&&live(result.entity)){const from={x:result.origin.x*R.tile,y:result.origin.y*R.tile},applied=g.zombieBulletDamage?.(result.entity,damage,from)??damage;if(applied<damage)result.entity.shieldImpact=.12;result.entity.health-=applied;if(result.entity.health<=0)g.killZombie(result.entity,false);}
   if(result.type==='giant'){const e=result.entity,d=R.siege.kinds[e.kind],weak=result.point.z<d.height*.18||result.point.z>d.height*.84;e.health-=damage*(weak?d.weakDamage:1);if(e.health<=0){state.giants=state.giants.filter(v=>v!==e);g.stats.kills++;notice=d.name+' abattu ; les infectés ordinaires restent actifs.';}}
  }
  function shoot(q){if(!operational(q)||q.m.progress!==1||q.m.ammo<q.def.ammoPerShot||q.m.cooldown>0||q.m.overheated)return false;
   const origin=muzzle(q),result=raycast(origin,q.m.yaw,q.m.pitch,q.def.range,q.m.id);q.m.ammo-=q.def.ammoPerShot;q.m.cooldown=1/q.def.rate;q.m.heat=Math.min(R.heatLimit,q.m.heat+q.def.heat);if(q.m.heat>=R.heatLimit)q.m.overheated=true;hit(result,q.def.damage);
   if(q.def.splash&&result.type!=='miss')for(const e of [...g.zombies,...state.giants]){if(!live(e)||e===result.entity)continue;const to={x:e.x/R.tile,y:e.y/R.tile,z:aimPoint(e).z},d=Math.hypot(to.x-result.point.x,to.y-result.point.y,to.z-result.point.z);if(d>q.def.splash)continue;
    const start={...result.point,z:result.point.z+.06},a=S.lookAt(start,to),r=raycast(start,a.yaw,a.pitch,d+.05,q.m.id);if(r.entity===e)hit(r,q.def.damage*(1-d/q.def.splash));
   }
   traces.push({from:origin,to:result.point,life:R.traceLife});if(traces.length>R.maxTraces)traces.shift();g.audio?.shoot?.('rifle');return true;
  }
  function fire(){const q=moduleRef(controlled);return !!q&&can()&&!g.paused&&!g.activeOverlay&&nearModule(q)&&shoot(q);}
  function fallActor179(height){release();state.actor=null;travel=null;job=null;let point={x:g.player.x,y:g.player.y};
   if(!groundClear(g.player,point.x,point.y)){let found=false;for(let r=R.tile;r<R.tile*12&&!found;r+=R.tile)for(let i=0;i<16;i++){const p={x:point.x+Math.cos(i*Math.PI/8)*r,y:point.y+Math.sin(i*Math.PI/8)*r};if(groundClear(g.player,p.x,p.y)){point=p;found=true;break;}}}
   g.player.x=point.x;g.player.y=point.y;g.damagePlayer(height*R.fallDamagePerMetre);
  }
  function dropSite(id,height){siege.removeSupport(id);autoTargets.clear();state.sites=state.sites.filter(s=>s.id!==id);if(job?.id===id)job=null;if(travel?.b.id===id)travel=null;
   if(state.actor?.site!==id)return;release();state.actor=null;let point={x:g.player.x,y:g.player.y};
   if(!groundClear(g.player,point.x,point.y)){let found=false;for(let r=R.tile;r<R.tile*12&&!found;r+=R.tile)for(let i=0;i<16;i++){const p={x:point.x+Math.cos(i*Math.PI/8)*r,y:point.y+Math.sin(i*Math.PI/8)*r};if(groundClear(g.player,p.x,p.y)){point=p;found=true;break;}}}
   g.player.x=point.x;g.player.y=point.y;g.damagePlayer(height*R.fallDamagePerMetre);notice='Support perdu : effondrement des étages et perte de leurs équipements.';
  }
  function workStep(dt){if(!job)return;const j=job,b=building(j.id);if(!live(b)||g.world!==j.world||g.player.health<j.health||g.player.reload>0||dist(g.player,j)>R.workMoveTolerance||!state.actor||state.actor.site!==j.id||state.actor.level!==j.level||g.frontier?.active()||g.input.mouseDown||g.input.touchFire){job=null;notice='Travail interrompu ; chantier conservé.';return;}
   if(j.kind==='engineering178'){engineeringStep178(j,dt);return;}
   if(['repair','medical','dismantle'].includes(j.kind)){serviceStep(j,dt);return;}
   if(j.kind==='reload'){const q=moduleRef(j.object.id);if(!nearModule(q)||g.player.carry!==j.bag){job=null;return;}j.elapsed+=dt;if(j.elapsed>=j.seconds){const n=Math.min(j.amount,Math.floor(j.bag.ammo||0),q.def.capacity-q.m.ammo);j.bag.ammo-=n;q.m.ammo+=n;job=null;notice='Ravitaillement terminé : '+n+' cartouches transférées.';}return;}
   j.elapsed+=dt;const key=j.kind==='lift'?'lift':'progress';j.object[key]=Math.min(1,j.object[key]+dt/j.seconds);if(j.object[key]===1){job=null;g.refreshMetrics(true);notice='Chantier achevé : '+(j.kind==='module'?R.modules[j.object.kind].name:j.kind==='deck'?R.deck.name:R.lift.name);}
  }
  function travelStep(dt){if(!travel)return;const t=travel;if(!live(t.b)||g.world!==t.world||!live(g.player)||g.player.health<t.health){travel=null;notice='Accès interrompu : retour au dernier palier sûr.';return;}
   if(t.kind==='lift'&&!online(t.b)){travel=null;notice='Coupure de courant : accès interrompu. Les escaliers restent disponibles.';return;}
   t.elapsed+=dt;if(t.elapsed<t.seconds)return;
   if(t.level<0&&!groundClear(g.player,t.to.x,t.to.y)||t.level>=0&&!clearAt(t.to.x,t.to.y,t.toZ)){travel=null;notice='Palier devenu obstrué : trajet annulé.';return;}
   state.actor=t.level<0?null:{site:t.b.id,level:t.level};g.player.x=t.to.x;g.player.y=t.to.y;g.player.vx=g.player.vy=0;travel=null;g.releaseInputs();notice='Palier rejoint : '+t.toZ+' m.';
  }
  function spawnSiege(){if(g.phase!=='assault'||g.wave<R.siege.firstWave||g.wave%R.siege.spawnWaveInterval||state.lastSiegeWave===g.wave||state.giants.length>=R.siege.maxGiants)return;
   const wall=state.sites.map(s=>building(s.id)).find(b=>live(b)&&b.completed&&base(b).wall);if(!wall||g.tier.id<6)return;
   state.lastSiegeWave=g.wave;const kind=g.tier.id>=10?'colossus':g.tier.id>=8?'carrier':'breaker',d=R.siege.kinds[kind],m=(d.radius+2)*R.tile,W=C.WORLD_SIZE;
   const points=[{x:m,y:W*.25},{x:W-m,y:W*.75},{x:W*.75,y:m},{x:W*.25,y:W-m}];
   for(let i=0;i<4;i++){const p=points[(i+g.wave)%4],probe={...p,radius:d.radius*R.tile,kind:'walker'};if(g.hostilePositionClear(probe,p.x,p.y)&&!g.visible(p.x,p.y,120,g.viewBounds())){state.giants.push({id:state.nextId++,kind,...p,health:d.health,cooldown:R.siege.interval,windup:0,target:null,yaw:0});notice=d.name+' repéré sur le front extérieur.';break;}}
  }
  function giantStep(dt){spawnSiege();for(const e of [...state.giants]){const d=R.siege.kinds[e.kind];let target=building(e.target);e.cooldown=Math.max(0,e.cooldown-dt);
   if(e.windup>0){e.windup=Math.max(0,e.windup-dt);if(e.windup===0&&live(target)){const near=Math.hypot(e.x-clamp(e.x,target.left,target.right),e.y-clamp(e.y,target.top,target.bottom))/R.tile;if(near<=d.reach+d.radius){g.damageBuilding(target,d.damage*g.difficulty.enemyDamage);network?.giantImpact(e,d);if(dist(g.player,e)<(d.radius+R.siege.damageRadius)*R.tile&&pose().z<=d.height)g.damagePlayer(d.damage*.3);}}continue;}
   if(!live(target)){target=state.sites.map(s=>building(s.id)).filter(b=>live(b)&&b.completed).sort((a,b)=>dist(e,a)-dist(e,b))[0]||g.core();e.target=target?.id??null;}if(!live(target))continue;
   const dx=target.x-e.x,dy=target.y-e.y,len=Math.hypot(dx,dy)||1;e.yaw=Math.atan2(dy,dx);
   const reach=Math.hypot(e.x-clamp(e.x,target.left,target.right),e.y-clamp(e.y,target.top,target.bottom))/R.tile;
   if(reach<=d.reach+d.radius){if(e.cooldown<=0){e.windup=R.siege.telegraph;e.cooldown=R.siege.interval;}continue;}
   const step=d.speed*R.tile*dt,nx=e.x+dx/len*step,ny=e.y+dy/len*step,block=g.world.at(nx+dx/len*d.radius*R.tile,ny+dy/len*d.radius*R.tile);
   if(block&&!block.dead&&block!==target){e.target=block.id;continue;}
   if(g.hostilePositionClear({x:e.x,y:e.y,radius:d.radius*R.tile,kind:'walker'},nx,ny)){e.x=nx;e.y=ny;}
  }}
  function step(dt){if(!Number.isFinite(dt)||dt<=0||g.paused||g.activeOverlay||g.state!=='playing'||g.gameOver)return;
   const delta=Math.min(dt,R.step);ensure();network?.step(delta);if(!live(g.player)){state.actor=null;stop('');}
   for(const s of [...state.sites])if(!live(building(s.id)))dropSite(s.id,pose().z);
   travelStep(delta);workStep(delta);scanClock-=delta;let boxes=null;
   for(const s of state.sites){const b=building(s.id);if(!live(b))continue;for(let level=0;level<s.decks.length;level++)for(const m of s.decks[level].modules){const def=R.modules[m.kind];if(!def.range||m.progress!==1||network?.moduleSuspended(m.id))continue;
    m.cooldown=Math.max(0,m.cooldown-delta);m.heat=Math.max(0,m.heat-R.heatRecovery*delta);if(m.overheated&&m.heat<=R.heatResume)m.overheated=false;
    const q={b,s,level,m,def};if(m.id===controlled){if(!nearModule(q)){release();continue;}if(view==='classic'){const p=muzzle(q),to=screenAim(p),a=S.lookAt(p,to);aim(a.yaw,a.pitch);}if(g.input.mouseDown||g.input.touchFire)fire();}
    else if(!(job?.kind==='engineering178'&&job.object===m)&&!def.manualOnly&&operational(q)&&m.ammo>=def.ammoPerShot){boxes??=geometry();const origin=muzzle(q);let enemy=autoTargets.get(m.id);
     if(scanClock<=0){const visible=sightQuery(origin,def.range,m.id,boxes),candidates=[];
      for(const e of [...g.zombies,...state.giants]){if(!live(e))continue;const p=aimPoint(e),distance=Math.hypot(p.x-origin.x,p.y-origin.y,p.z-origin.z);if(distance>def.range)continue;let index=candidates.findIndex(v=>v.distance>distance);if(index<0)index=candidates.length;if(index>=R.targetCandidates)continue;candidates.splice(index,0,{e,distance});if(candidates.length>R.targetCandidates)candidates.pop();}
      enemy=candidates.find(v=>visible(v.e))?.e;autoTargets.set(m.id,enemy);
     }
     if(live(enemy)&&m.cooldown<=0&&!m.overheated){const a=S.lookAt(origin,aimPoint(enemy));m.yaw=a.yaw;m.pitch=clamp(a.pitch,-1.45,1.1);shoot(q);}
    }
   }}
   if(scanClock<=0)scanClock=R.scanInterval;for(let i=traces.length-1;i>=0;i--){traces[i].life-=delta;if(traces[i].life<=0)traces.splice(i,1);}giantStep(delta);
  }
  function damageModule(id,amount){if(!(amount>0)||!Number.isFinite(amount))return false;const q=moduleRef(id);if(!q)return false;
   q.m.health-=amount;if(q.m.health<=0){q.s.decks[q.level].modules=q.s.decks[q.level].modules.filter(m=>m.id!==id);if(controlled===id)release();if(job?.object===q.m)job=null;autoTargets.delete(id);g.refreshMetrics(true);notice='Équipement d’étage détruit : '+q.def.name;}return true;
  }
  const groundClear=g.friendlyPositionClear.bind(g);
  const siege=Siege.create(g,{state:()=>state,building,surfaceAt,clearAt,pose,geometry,damageModule,groundLine:g.hostileLineClear.bind(g),notice:message=>{notice=message;}});
  network=N.create(g,{S,state:()=>state,can,nativeBusy,pose,surfaceAt,moduleRef,clearFootprint:engineeringClear178,groundLine:g.hostileLineClear.bind(g),fallActor:fallActor179});
  wrap('damagePlayer',(old,...args)=>{const result=old(...args);if(!live(g.player)){if(network.carrying())network.dropCargo(true);state.actor=null;stop('');}return result;});
  wrap('killZombie',(old,z,...args)=>{siege.forget(z.id);return old(z,...args);});
  wrap('friendlyPositionClear',(old,e,x,y)=>e===g.player&&state.actor?clearAt(x,y,pose().z,e.radius*.78):old(e,x,y));
  wrap('moveFriendly',(old,e,dx,dy)=>{if(e===g.player&&network.carrying()){dx*=C.VerticalNetwork179.carrySpeed;dy*=C.VerticalNetwork179.carrySpeed;}if(e!==g.player||!state.actor)return old(e,dx,dy);if(travel||controlled!==null)return;const z=pose().z,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/(e.radius*.5)));for(let i=0;i<n;i++){if(clearAt(e.x+dx/n,e.y,z))e.x+=dx/n;if(clearAt(e.x,e.y+dy/n,z))e.y+=dy/n;}const s=surfaceAt(e.x,e.y,z);if(s)state.actor={site:s.s.id,level:s.level};});
  wrap('workerCanWorkAt',(old,e,t,...args)=>e===g.player&&state.actor?false:old(e,t,...args));
  wrap('hostileLineClear',(old,a,b,...args)=>{if(siege.enemyPose(a).z||siege.enemyPose(b).z||(a===g.player||b===g.player)&&pose().z>0)return siege.canMelee(a,b);return old(a,b,...args);});
  wrap('zombieCanClimb',(old,e,b)=>base(b)?false:old(e,b));
  wrap('selectBuild',(old,...args)=>state.actor||network.carrying()?say(no('Redescendez au sol, les mains libres, pour placer une fondation.')):old(...args));
  wrap('placeOne',(old,type,...args)=>{if(network.carrying()||network.blocksConstruction(type,...args))return false;if(base({type})&&state.sites.length>=R.maxSites)return false;const result=old(type,...args);if(result&&R.bases[type]){ensure();g.refreshMetrics(true);}return result;});
  wrap('updateInteraction',(old,dt)=>{if(!state.actor&&!travel)return old(dt);g.interactionText=notice||'CITÉ VERTICALE — E : accès intérieur · Préparatifs : équipements et dalles';if(g.input.pressed.has('KeyE')&&!busy()){const b=target();if(b)access(b.id,state.actor?.level>0?state.actor.level-1:-1);}});
  wrap('updatePlayer',(old,dt)=>{if(travel||controlled!==null){g.player.shootCooldown=Math.max(0,g.player.shootCooldown-dt);g.player.meleeCooldown=Math.max(0,g.player.meleeCooldown-dt);g.player.invulnerable=Math.max(0,g.player.invulnerable-dt);g.player.vx=g.player.vy=0;
    if(g.input.pressed.has('KeyI'))release();if(controlled!==null&&g.input.pressed.has('KeyV'))g.vertical175UI?.toggleView?.();if(!live(g.player)){state.actor=null;stop('');return old(dt);}return;}
   return old(dt);
  });
  for(const action of ['melee','startReload'])wrap(action,(old,...args)=>network.carrying()?false:old(...args));
  wrap('shootPlayer',(old,...args)=>{if(network.carrying())return false;personalShot=!!state.actor;try{return old(...args);}finally{personalShot=false;}});
  wrap('fireFriendly',(old,x,y,yaw,damage,range,...args)=>{if(!personalShot)return old(x,y,yaw,damage,range,...args);const p={x:g.player.x/R.tile,y:g.player.y/R.tile,z:pose().z+R.eyeHeight},to=screenAim(p),a=S.lookAt(p,to),result=raycast(p,a.yaw,a.pitch,range/R.tile);hit(result,damage);traces.push({from:p,to:result.point,life:R.traceLife});if(traces.length>R.maxTraces)traces.shift();});
  wrap('updateProjectiles',(old,dt)=>{if(state.giants.length)for(const p of g.projectiles){if(p.dead||p.owner!=='friendly')continue;const speed=Math.hypot(p.vx,p.vy),origin={x:p.x/R.tile,y:p.y/R.tile,z:R.eyeHeight},result=raycast(origin,Math.atan2(p.vy,p.vx),0,speed*dt/R.tile);if(result.type==='giant'){hit(result,p.damage);p.dead=true;}}return old(dt);});
  wrap('destroyBuilding',(old,b,...args)=>{const z=state.actor?.site===b.id?pose().z:0,result=old(b,...args);if(base(b)&&b.dead){dropSite(b.id,z);network.prune();g.refreshMetrics(true);}return result;});
  wrap('structureActionStatus',(old,action,b,...args)=>{if(base(b)&&network.load(b.id)>0&&['demolish','upgrade'].includes(action))return no('Retirez les passerelles avant de modifier leur support.');if(base(b)&&site(b.id)&&(site(b.id).decks.length>1||site(b.id).decks.some(d=>d.modules.length)||site(b.id).lift||state.actor?.site===b.id)&&['demolish','upgrade'].includes(action))return no('Support occupé : ses étages ne peuvent pas être démontés par l’outil au sol.');return old(action,b,...args);});
  wrap('update',(old,dt)=>{const result=old(dt);step(dt);return result;});
  wrap('returnToMenu',(old,...args)=>{stop('');return old(...args);});
  wrap('onEscape',(old,...args)=>{if(busy()){stop();return;}return old(...args);});
  function overview(){const b=target(),s=b&&site(b.id),p=pose(),c=catalogue(catalogueAge??g.tier.id);return{summary:A.ages[g.tier.id].theme+' · ouvrages reliés aux stocks et à l’électricité de D-17.',message:notice,
   rows:[network.overview(),{label:'Catalogue consulté',value:c.name+' · '+c.height+' m'},{label:'Nouveaux ouvrages',value:c.supports.map(b=>b.name).join(' ; ')},{label:'Nouveaux équipements',value:c.modules.map(m=>m.name).join(' ; ')},{label:'Âge',value:C.CITY_TIERS[g.tier.id].name},{label:'Plafond des nouveaux étages',value:A.ages[g.tier.id].height+' m'},{label:'Dossier',value:moduleGroup},{label:'Altitude',value:p.z.toFixed(1)+' m'},{label:'Support',value:b?.def.name||'Approchez une entrée ou sélectionnez une fondation'},{label:'Charge',value:s?supportMass(s).toFixed(1)+' / '+base(b).capacity:'—'},{label:'Paliers',value:s?s.decks.filter(d=>d.progress===1).length:'—'},{label:'Grimpeurs',value:state.climbers.length+' / '+C.VerticalSiege176.maxClimbers},{label:'Accès',value:s?.lift===1?'Escalier + ascenseur alimenté selon le réseau':'Escalier intérieur'},{label:'Travail',value:job?job.kind:travel?travel.kind:controlled!==null?'Affût manuel':'Aucun'}]};}
  function actions(){const b=target(),s=b&&site(b.id),result=[],age=catalogueAge??g.tier.id;
   for(const [dir,label]of [[-1,'Catalogue : âge précédent'],[1,'Catalogue : âge suivant']])if(age+dir>=0&&age+dir<C.CITY_TIERS.length)result.push({id:'catalogue-'+dir,label,close:false,run:()=>{catalogueAge=age+dir;return ok('Consultation uniquement ; aucun âge débloqué et aucune ressource dépensée.');}});
   if(!s){result.push(...network.actions());return result;}
   const add=(id,label,run,description='')=>result.push({id,label,run,description,close:true});
   if(!state.actor){add('up','Monter par l’escalier intérieur',()=>access(b.id,0));result.push(...network.actions());}
   else{
    add('down','Descendre au palier inférieur',()=>access(b.id,state.actor.level>0?state.actor.level-1:-1));
    if(s.decks[state.actor.level+1]?.progress===1)add('next','Monter au palier supérieur',()=>access(b.id,state.actor.level+1));
    if(s.lift===1){add('lift-ground','Ascenseur : rez-de-chaussée',()=>access(b.id,-1,'lift'));if(s.decks[state.actor.level+1]?.progress===1)add('lift-up','Ascenseur : palier supérieur',()=>access(b.id,state.actor.level+1,'lift'));}
    add('deck','Financer une dalle supplémentaire (+6 m)',()=>buildDeck(b.id),C.resourceText(R.deck.cost));add('lift','Installer l’ascenseur',()=>buildLift(b.id),C.resourceText(R.lift.cost));add('resume','Reprendre le chantier financé',()=>resume(b.id));
    for(const [group,label]of [['defense','Défenses et éclairage'],['civil','Vie et production'],['service','Entretien et soins'],['network','Liaisons et transport']])result.push({id:'group-'+group,label,close:false,run:()=>{moduleGroup=group;dismantleReview=null;return ok(label);}});
    const deck=s.decks[state.actor.level],free=[0,1,2,3].find(slot=>!deck.modules.some(m=>m.slot===slot));
    if(moduleGroup==='network')result.push(...network.actions());
    if(free!==undefined&&moduleGroup!=='service'&&moduleGroup!=='network')for(const [kind,d]of Object.entries(R.modules).filter(([,d])=>d.tier<=g.tier.id&&(moduleGroup==='defense'?d.range||d.light:!d.range&&!d.light)))add('build-'+kind,'Installer : '+d.name,()=>buildModule(kind,free,b.id),C.resourceText(d.cost)+(d.manualOnly?' · manuel, sans courant':'')+' · '+d.mass+' charge · emplacement '+(free+1));
    if(moduleGroup==='service'){
     if(state.actor.level>0&&deck.health<R.deck.health)add('repair-deck','Réparer la dalle actuelle',()=>engineering178('repairDeck',b.id),'Paiement final ; aucune construction supplémentaire.');
     const structureAction=(operation,id,label,description)=>result.push({id,label:engineeringReview178?.kind===operation&&engineeringReview178.id===b.id?'CONFIRMER : '+label:label,close:true,run:()=>engineering178(operation,b.id,undefined,engineeringReview178?.kind===operation&&engineeringReview178.id===b.id),description});
     if(s.decks.length>1)structureAction('removeDeck','remove-top-deck','Déposer la dalle supérieure','Dalle vide uniquement ; opérer depuis le palier inférieur.');
     if(s.lift>0)structureAction('removeLift','remove-lift','Déposer l’ascenseur','Les escaliers et tous les paliers restent utilisables.');
     for(const m of deck.modules){
      if(m.progress===1){for(let slot=0;slot<4;slot++)if(slot!==m.slot&&!deck.modules.some(other=>other.slot===slot))add('move-'+m.id+'-'+slot,'Déplacer : '+R.modules[m.kind].name+' → emplacement '+(slot+1),()=>engineering178('relocate',m.id,slot),'Même palier ; intégrité et stocks conservés ; matériaux payés à la fin.');}
      else result.push({id:'cancel-project-'+m.id,label:engineeringReview178?.kind==='cancelModule'&&engineeringReview178.id===m.id?'CONFIRMER : déposer le chantier':'Déposer le chantier : '+R.modules[m.kind].name,close:true,run:()=>engineering178('cancelModule',m.id,undefined,engineeringReview178?.kind==='cancelModule'&&engineeringReview178.id===m.id),description:'Aucune capacité acquise ; récupération selon l’avancement réel.'});
     }
    }
    if(moduleGroup==='service')for(const m of deck.modules)if(m.progress===1){
     const d=R.modules[m.kind];if(m.health<d.health)add('repair-'+m.id,'Réparer : '+d.name,()=>repairModule(m.id),'Intervention sur place ; paiement final au dépôt.');
     if(d.medical)add('medical-'+m.id,'Se soigner : '+d.name,()=>useMedical(m.id),d.medical.medicine+' médicament(s) du sac ; absence de menace.');
     result.push({id:'dismantle-'+m.id,label:dismantleReview?.id===m.id?'CONFIRMER : '+d.name:'Démonter : '+d.name,close:true,run:()=>dismantleModule(m.id,dismantleReview?.id===m.id),description:'Retire les capacités ; récupération limitée par le stockage restant.'});
    }
    for(const m of deck.modules)if(R.modules[m.kind].range&&m.progress===1){add('control-'+m.id,'Contrôler : '+R.modules[m.kind].name,()=>possess(m.id),'Rejoignez physiquement son emplacement.');add('reload-'+m.id,'Ravitailler : '+R.modules[m.kind].name,()=>reload(m.id),m.ammo+' cartouches · transfert depuis le sac.');}
   }
   if(busy())add('cancel','Interrompre / rendre le contrôle',()=>stop());return result;
  }
  const api={network,engineeringQuote178,relocateModule:(id,slot)=>engineering178('relocate',id,slot),dismantleTopDeck:(id=state.actor?.site,confirm=false)=>engineering178('removeDeck',id,undefined,confirm),dismantleLift:(id=state.actor?.site,confirm=false)=>engineering178('removeLift',id,undefined,confirm),repairDeck:(id=state.actor?.site)=>engineering178('repairDeck',id),cancelModuleProject:(id,confirm=false)=>engineering178('cancelModule',id,undefined,confirm),catalogue,productionPlans,maintenanceQuote,repairModule,useMedical,dismantleModule,groundObstruction,screenAim,pose,entrance,target,surfaceAt,clearAt,accessQuote,access,moduleQuote,buildModule,deckQuote,buildDeck,buildLift,resume,reload,possess,release,setView,aim,fire,raycast,geometry,giantBox,step,overview,actions,busy,stop,sightQuery,aimPoint,
   prepareSiege:siege.prepare,updateClimber:siege.update,enemyPose:siege.enemyPose,pressure:siege.pressure,damageModule,aboveGate:(e,b)=>(e===g.player?pose().z:siege.enemyPose(e).z)>=(base(b)?.gateClearance||Infinity),hasActiveSiege:()=>state.giants.length>0,snapshot:()=>copy(state),presentation:()=>({sites:state.sites,giants:state.giants,traces,controlled,view,job:job?{kind:job.kind,seconds:job.seconds,elapsed:job.elapsed}:network.jobState(),notice:network.presentation().notice||notice}),moduleRef,muzzle};g.vertical175=Object.freeze(api);
  g.expansions.register({id:'vertical175',title:'Citadelle verticale',validate:S.normalize,snapshot:api.snapshot,overview,actions,busy:()=>busy()||network.carrying(),
   restore:raw=>{state=S.normalize(raw);network.reset();siege.reset();autoTargets.clear();stop('');ensure();g.refreshMetrics(true);},reset:()=>{catalogueAge=null;moduleGroup=A.defaultGroup;state=S.initial();network.reset();siege.reset();stop('');traces.length=0;autoTargets.clear();scanClock=0;}});
  wrap('restoreSave',(old,raw)=>{const p=raw?.player?{x:raw.player.x,y:raw.player.y}:null,result=old(raw);if(result!==false&&state.actor&&p){g.player.x=p.x;g.player.y=p.y;}return result;});
  ensure();return api;
 }
 const api={install};root.DeadwallVerticalCitadel175=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.DEADWALL&&root.document)install(root.DEADWALL);
})(globalThis);
