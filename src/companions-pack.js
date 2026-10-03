/* Field-team orders, formations, training and finite shared supplies. */
(function(root){
'use strict';
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CompanionPackRules;
const ids=Object.keys(C.WorldEvolution.RULES.companions),types=['ammo','medicine','scrap'];
const worldCache=new Map();
const copy=v=>JSON.parse(JSON.stringify(v)),emptyBag=()=>({ammo:0,medicine:0,scrap:0});
const exercises=()=>R.exercises||{},skill=(id,exercise)=>exercise==='specialty'?id:id+':'+exercise;
const trainingOption=exercise=>typeof exercise!=='string'?null:exercise==='specialty'?{...R.training,name:'Spécialité'}:Object.hasOwn(exercises(),exercise)?exercises()[exercise]:null;
const allows=(option,id)=>!option?.allowedCompanions||option.allowedCompanions.includes(id);
function initial(){return{version:1,order:'follow',formation:'line',discipline:'free',anchor:null,trained:[],training:null,reserves:Object.fromEntries(ids.map(id=>[id,emptyBag()])),positions:{}};}
function validate(raw,data){
 if(raw===undefined)return initial();
 const fail=()=>{throw Error('Équipe de terrain invalide.');};
 const num=(v,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)fail();return v;};
 const bound=data?(root.DeadwallFrontierWorld?.sizeForGeneration?.(data.frontier?.generation)||8192):24576;
 const point=p=>{if(!p||!Number.isInteger(p.z)||p.z< -1||p.z>2||p.inside!==null&&!/^P\d{4}$/.test(p.inside)||p.z!==0&&p.inside===null)fail();return{x:num(p.x,0,bound),y:num(p.y,0,bound),z:p.z,inside:p.inside,a:num(p.a??0,-1e5,1e5)};};
 const knownSkills=new Set(ids.flatMap(id=>[id,...Object.entries(exercises()).filter(([,option])=>allows(option,id)).map(([exercise])=>skill(id,exercise))]));
 if(!raw||raw.version!==1||!['follow','hold','rally'].includes(raw.order)||!Object.hasOwn(R.formations,raw.formation)||!Object.hasOwn(R.disciplines,raw.discipline)||!Array.isArray(raw.trained)||raw.trained.length>knownSkills.size||new Set(raw.trained).size!==raw.trained.length||raw.trained.some(id=>!knownSkills.has(id)))fail();
 const s=initial();s.order=raw.order;s.formation=raw.formation;s.discipline=raw.discipline;s.trained=[...raw.trained];s.anchor=raw.anchor===null?null:point(raw.anchor);if((s.order==='rally')!==!!s.anchor)fail();
 const attained=data?C.cityTier(data.urban?.peakScore||0).id:null;
 for(const id of ids)for(const[exercise,option]of Object.entries(exercises()))if(s.trained.includes(skill(id,exercise))&&(!allows(option,id)||!s.trained.includes(skill(id,option.requires))||attained!==null&&option.tier!==undefined&&attained<option.tier))fail();
 if(raw.training!==null){
  if(!raw.training||!ids.includes(raw.training.id))fail();const exercise=raw.training.exercise===undefined?'specialty':raw.training.exercise,option=trainingOption(exercise);
  if(!option||!allows(option,raw.training.id)||s.trained.includes(skill(raw.training.id,exercise))||exercise!=='specialty'&&!s.trained.includes(skill(raw.training.id,option.requires))||attained!==null&&option.tier!==undefined&&attained<option.tier)fail();
  s.training={id:raw.training.id,left:num(raw.training.left,Number.EPSILON,option.seconds),...(exercise!=='specialty'?{exercise}:{})};
 }
 if(!raw.reserves||typeof raw.reserves!=='object'||Array.isArray(raw.reserves)||Object.keys(raw.reserves).some(id=>!ids.includes(id)))fail();
 for(const id of ids){const bag=raw.reserves[id];if(!bag||Object.keys(bag).some(k=>!types.includes(k)))fail();for(const key of types)s.reserves[id][key]=num(bag[key],0,R.reserve[key]);}
 if(!raw.positions||typeof raw.positions!=='object'||Array.isArray(raw.positions)||Object.keys(raw.positions).some(id=>!ids.includes(id)))fail();
 for(const[id,p]of Object.entries(raw.positions))s.positions[id]=point(p);
 const stored=[...Object.values(s.positions),...(s.anchor?[s.anchor]:[])];
 if(data&&stored.length){
  if(!(data.frontier?.generation>=4))fail();
  const indoor=stored.filter(p=>p.inside!==null);
  if(indoor.length){
   const W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null);
   const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
   const key=data.worldSeed+':'+data.frontier.generation;let w=worldCache.get(key);
   if(!w){w=W.create(data.worldSeed,data.frontier.generation);worldCache.set(key,w);if(worldCache.size>3)worldCache.delete(worldCache.keys().next().value);}
   for(const p of indoor){
    const place=w.pois.find(x=>x.id===p.inside);if(!place||!place.levels.includes(p.z))fail();
    if(p.z!==0){
     const q=G.local(place,p.x,p.y),r=C.WorldEvolution.RULES.companionRules.radius;
     if(q.x<r||q.y<r||q.x>place.w-r||q.y>place.h-r)fail();
    }
   }
  }
 }
 return s;
}
function install(g){
 if(g.companionsPack)return g.companionsPack;
 let state=initial(),message='';
 const can=()=>g.expansions.canAct();
 const team=()=>g.worldEvolution.overview().companions.filter(c=>c.health>0);
 const assigned=id=>team().some(c=>c.id===id);
 const atHome=()=>!g.frontier.active()&&!g.expeditions.driving()&&g.core()&&g.workerCanWorkAt(g.player,g.core(),R.homeReach);
 const fail=reason=>{message=reason;return{ok:false,reason};};
 const done=text=>{message=text;g.audio.ui?.();g.save(false);return{ok:true};};
 const info=id=>C.WorldEvolution.RULES.companions[id];
 function handlingReason(){return!can()?'Commandement indisponible.':g.fieldcraft?.context?.().mounted?'Libérez le poste de tir avant de manipuler le matériel.':g.player.reload>0?'Terminez le rechargement.':g.expeditions.driving()||g.frontier.position().car?.driving?'Quittez le véhicule pour manipuler le matériel.':g.expansions.busy?.('companions')?'Terminez votre activité en cours.':'';}
 function fieldReason(){return!can()?'Commandement indisponible.':!team().length?'Utilisez « Affecter l’équipe » pour choisir vos accompagnateurs.':g.frontier.snapshot().generation<4?'Les sorties d’équipe demandent le monde étendu.':!g.frontier.active()?'Les ordres de déplacement concernent une sortie régionale.':g.frontier.snapshot().car?.driving?'Quittez le véhicule pour donner un ordre à pied.':'';}
 function setOrder(order){
  if(!['follow','hold','rally'].includes(order))return fail('Ordre inconnu.');const reason=fieldReason();if(reason)return fail(reason);
  state.order=order;state.anchor=order==='rally'?selectPoint(g.frontier.snapshot()):null;
  for(const c of team())if(Number.isFinite(c.x)&&!c.riding)state.positions[c.id]=selectPoint(c);
  return done({follow:'L’équipe reprend le suivi.',hold:'L’équipe tient sa position.',rally:'Rassemblement sur votre position actuelle.'}[order]);
 }
 function selectPoint(p){return{x:p.x,y:p.y,z:p.z,inside:p.inside??null,a:p.a||0};}
 function setFormation(id){if(!can()||!Object.hasOwn(R.formations,id))return fail('Formation indisponible.');state.formation=id;return done('Formation : '+R.formations[id].name+'.');}
 function setDiscipline(id){if(!can()||!Object.hasOwn(R.disciplines,id))return fail('Consigne indisponible.');state.discipline=id;return done('Tir : '+R.disciplines[id].name+'.');}
 const trainingThreatened=()=>g.zombies.some(z=>!z.dead&&z.health>0&&Math.hypot(z.x-g.player.x,z.y-g.player.y)<R.trainingDanger&&g.hostileLineClear(z,g.player));
 function trainingAvailable(t=state.training){const option=t&&trainingOption(t.exercise||'specialty');return!!option&&(option.tier===undefined||g.tier.id>=option.tier&&!trainingThreatened());}
 function trainingReason(id,exercise='specialty'){
  const reason=handlingReason(),option=trainingOption(exercise);if(reason)return reason;
  return!ids.includes(id)||!assigned(id)?'Affectez cet équipier à votre sortie.':!option?'Exercice inconnu.':!allows(option,id)?'Formation réservée à '+option.allowedCompanions.map(key=>info(key).name).join(', ')+'.':option.tier!==undefined&&g.tier.id<option.tier?'Palier requis : '+C.CITY_TIERS[option.tier].name+'.':state.trained.includes(skill(id,exercise))?'Exercice déjà acquis.':state.training?'Un entraînement est déjà en cours.':exercise!=='specialty'&&!state.trained.includes(skill(id,option.requires))?'Terminez d’abord '+trainingOption(option.requires).name.toLowerCase()+'.':!atHome()?'Rejoignez le dépôt de D-17.':g.phase!=='calm'?'Attendez la phase calme.':option.tier!==undefined&&trainingThreatened()?'Éloignez les infectés avant cet entraînement.':!C.canAfford(g.resources,option.cost)?'Stocks insuffisants pour l’entraînement.':'';
 }
 function train(id,exercise='specialty'){const reason=trainingReason(id,exercise);if(reason)return fail(reason);const option=trainingOption(exercise);C.spend(g.resources,option.cost);state.training={id,left:option.seconds,...(exercise!=='specialty'?{exercise}:{})};return done(info(id).name+' commence '+option.name.toLowerCase()+' au dépôt.');}
 function cancelTraining(){if(!can()||!state.training)return fail('Aucun entraînement à interrompre.');state.training=null;return done('Entraînement interrompu ; les fournitures engagées restent consommées.');}
 function reserveReason(id){const reason=handlingReason();return reason||(!ids.includes(id)||!assigned(id)?'Affectez cet équipier à votre sortie.':busy()?'Terminez ou interrompez l’entraînement.':!atHome()?'Recharge des sacoches au dépôt de D-17.':'');}
 function reserveCost(id){return Object.fromEntries(types.map(k=>[k,Math.max(0,R.reserve[k]-state.reserves[id][k])]));}
 function fill(id){const reason=reserveReason(id);if(reason)return fail(reason);const cost=reserveCost(id);if(!Object.values(cost).some(v=>v>0))return fail('Sacoche déjà pleine.');if(!C.canAfford(g.resources,cost))return fail('Stocks insuffisants pour compléter la sacoche.');C.spend(g.resources,cost);for(const key of types)state.reserves[id][key]+=cost[key];return done('Sacoche de '+info(id).name+' ravitaillée.');}
 function transferReason(id){
  const reason=handlingReason();if(reason)return reason;if(!ids.includes(id)||!assigned(id))return'Équipier indisponible.';
  if(busy())return'Terminez ou interrompez l’entraînement.';
  if(g.frontier.active()){
   const f=g.frontier.snapshot(),p=state.positions[id];if(f.car?.driving)return'Quittez le véhicule pour partager les ressources.';
   if(!p||p.z!==f.z||p.z!==0&&p.inside!==f.inside||Math.hypot(p.x-f.x,p.y-f.y)>R.shareRange||!g.frontier.world().line(p,f,f.z,f.inside,null,.05))return'Rapprochez-vous de cet équipier par un accès libre.';
  }else if(!atHome())return'Rejoignez votre équipe au dépôt.';
  return C.bagTotal(g.player.carry)>=g.player.carryCapacity?'Votre sac est plein.':!types.some(k=>state.reserves[id][k]>0)?'Sacoche vide.':'';
 }
 function share(id){const reason=transferReason(id);if(reason)return fail(reason);let room=Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry)),amount=0;for(const key of types){const n=Math.min(room,state.reserves[id][key]);state.reserves[id][key]-=n;g.player.carry[key]+=n;room-=n;amount+=n;}return done(info(id).name+' vous transmet '+Math.round(amount*10)/10+' ressources.');}
 function control(id,f,index,p){
  if(!ids.includes(id))return{};
  const saved=state.positions[id];if(saved&&(saved.z!==f.z||f.z!==0&&saved.inside!==f.inside)){state.order='follow';state.anchor=null;delete state.positions[id];}
  if(state.anchor&&(state.anchor.z!==f.z||f.z!==0&&state.anchor.inside!==f.inside)){state.order='follow';state.anchor=null;}
  const escort=state.trained.includes(skill(id,'escort'))&&state.order==='follow'&&state.formation==='file',support=state.trained.includes(skill(id,'support'))&&state.order==='hold'&&state.discipline==='defensive';
  const active=exercise=>{const option=exercises()[exercise];return!!option&&allows(option,id)&&state.trained.includes(skill(id,exercise))&&state.order===option.order&&state.formation===option.formation&&(!option.discipline||state.discipline===option.discipline);};
  const triage=active('triage'),sapeur=active('sapeur'),veille=active('veille'),coordination=active('coordination');
  const gap=coordination?exercises().coordination.gapFactor:escort?exercises().escort.gapFactor:1,form=R.formations[state.formation],back=(form.back+form.step*index)*gap,side=form.side*(index%2?1:-1)*gap,base=state.order==='rally'&&state.anchor?state.anchor:f;
  const angle=base.a||0,goal={x:base.x-Math.cos(angle)*back+Math.cos(angle+Math.PI/2)*side,y:base.y-Math.sin(angle)*back+Math.sin(angle+Math.PI/2)*side};
  const trained=state.trained.includes(id),bonus=trained?R.training.bonus[id]:1;
  const services=support?exercises().support.serviceFactor:1,scout=support?exercises().support.scoutFactor:1;
  const token=state.order+':'+state.formation+':'+(state.anchor?state.anchor.x+','+state.anchor.y:'')+':'+escort+':'+support;
  return{token:token+(triage||sapeur||veille||coordination?':field150:'+triage+':'+sapeur+':'+veille+':'+coordination:''),hold:state.order==='hold',goal,fire:state.discipline!=='silent',shotRange:state.discipline==='defensive'?(veille?exercises().veille.defenseRange:support?exercises().support.defenseRange:R.defenseRange):undefined,healMultiplier:id==='samir'?bonus*services*(triage?exercises().triage.healFactor:1):1,repairMultiplier:id==='ines'?bonus*services*(sapeur?exercises().sapeur.repairFactor:1):1,scoutMultiplier:id==='lea'?bonus*scout:1,damageMultiplier:id==='malik'?bonus:1};
 }
 function resumePosition(id,f){const p=state.positions[id];return p&&p.z===f.z&&(f.z===0||p.inside===f.inside)?{...p,repath:0,cool:0}:null;}
 function record(id,p){if(!ids.includes(id)||!p)return;if(p.riding){delete state.positions[id];state.order='follow';state.anchor=null;}else if(Number.isFinite(p.x))state.positions[id]=selectPoint(p);}
 function update(dt){
  if(g.state!=='playing'||g.paused||g.activeOverlay||g.gameOver||g.player.dead||g.player.health<=0||!Number.isFinite(dt)||dt<=0)return;
  if(!g.frontier.active())state.positions={};
  const t=state.training;
  if(t&&trainingAvailable(t)&&atHome()&&g.phase==='calm'&&assigned(t.id)&&!handlingReason()){t.left=Math.max(0,t.left-Math.min(.1,dt));if(t.left===0){const exercise=t.exercise||'specialty';state.trained.push(skill(t.id,exercise));state.training=null;message=info(t.id).name+' a terminé '+trainingOption(exercise).name.toLowerCase()+'.';g.notify?.(message,'success');g.save(false);}}
 }
 const orderNames={follow:'Suivre',hold:'Tenir',rally:'Regrouper'};
 function overview(){const t=state.training,option=t&&trainingOption(t.exercise||'specialty');return{summary:message||'Préparez l’équipe au dépôt ; commandez ses déplacements sur le terrain.',rows:[{label:'Ordre',value:orderNames[state.order]},{label:'Formation',value:R.formations[state.formation].name},{label:'Discipline',value:R.disciplines[state.discipline].name},{label:'Entraînement',value:t?info(t.id).name+' · '+option.name+' · '+Math.ceil(t.left)+' s, au dépôt en phase calme'+(option.tier!==undefined&&trainingThreatened()?' · Suspendu : infectés proches · mains libres pour se défendre':''):'Disponible au dépôt'},...team().map(c=>({label:c.name,value:(state.trained.includes(c.id)?'Spécialité entraînée · ':'')+Object.entries(exercises()).filter(([exercise])=>state.trained.includes(skill(c.id,exercise))).map(([,option])=>option.name+' acquis · ').join('')+types.map(k=>Math.round(state.reserves[c.id][k]*10)/10+' '+({ammo:'mun.',medicine:'méd.',scrap:'ferr.'}[k])).join(' / ')}))]};}
 function actions(){
  const out=[],add=(id,label,reason,run,close=false)=>out.push({id,label,disabled:!!reason,reason:reason||'',run,close});
  for(const id of ['follow','hold','rally'])add('order-'+id,orderNames[id],state.order===id?'Ordre actif.':fieldReason(),()=>setOrder(id),true);
  for(const[id,f]of Object.entries(R.formations))add('formation-'+id,f.name,state.formation===id?'Formation active.':!can()?'Commandement indisponible.':'',()=>setFormation(id));
  for(const[id,f]of Object.entries(R.disciplines))add('discipline-'+id,f.name,state.discipline===id?'Consigne active.':!can()?'Commandement indisponible.':'',()=>setDiscipline(id));
  for(const c of team()){
   add('train-'+c.id,'Entraîner '+c.name+' · '+R.training.seconds+' s · '+R.training.cost.food+' nourriture, '+R.training.cost.scrap+' ferraille',trainingReason(c.id),()=>train(c.id),true);
   for(const[exercise,option]of Object.entries(exercises())){if(!allows(option,c.id))continue;const reason=trainingReason(c.id,exercise);out.push({id:'train-'+c.id+'-'+exercise,label:option.name+' · '+c.name+' · '+option.seconds+' s · '+C.resourceText(option.cost),description:option.description,disabled:!!reason,reason:reason||option.description||'',run:()=>train(c.id,exercise),close:true});}
   const cost=reserveCost(c.id),fillReason=reserveReason(c.id)||(!Object.values(cost).some(v=>v>0)?'Sacoche pleine.':!C.canAfford(g.resources,cost)?'Stocks insuffisants.':'');
   add('supply-fill-'+c.id,'Ravitailler '+c.name+' · '+types.map(k=>Math.round(cost[k]*10)/10+' '+({ammo:'mun.',medicine:'méd.',scrap:'ferr.'}[k])).join(', '),fillReason,()=>fill(c.id));
   add('supply-share-'+c.id,'Recevoir la sacoche de '+c.name,transferReason(c.id),()=>share(c.id));
  }
  if(state.training)add('train-cancel','Interrompre l’entraînement · sans remboursement',!can()?'Commandement indisponible.':'',cancelTraining);
  return out;
 }
 const busy=()=>!!state.training&&trainingAvailable()&&atHome()&&g.phase==='calm'&&assigned(state.training.id);
 const api={busy,cancelTraining,setOrder,setFormation,setDiscipline,train,fill,share,control,resumePosition,record,overview,actions,update,snapshot:()=>copy(state),restore:data=>{state=validate(data);message='';},reset:()=>{state=initial();message='';}};
 g.companionsPack=Object.freeze(api);
 const old=g.update.bind(g);g.update=dt=>{const value=old(dt);update(dt);return value;};
 g.expansions.register({id:'companions',title:'Équipe de terrain',overview,actions,busy,validate,snapshot:api.snapshot,restore:api.restore,reset:api.reset});
 return g.companionsPack;
}
const api={initial,validate,install};root.DeadwallCompanionsPack=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;else if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
