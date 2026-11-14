/* Lois de cité (docs/GAME_BIBLE.md §8.5), première tranche : une loi est une politique durable à contrepartie visible.
   Le jeu ne juge pas ; il montre le prix. Trois lois composées sur l'existant, sans rien créer :
   - Demi-rations : une part de la ration qui vient d'être consommée est rendue au stock ; le moral baisse en continu.
   - Rationnement de l'eau : la population puise moins dans les citernes (src/city-water215.js) ; le moral baisse.
   - Corvée de déblaiement : après chaque assaut repoussé, l'ordre « déblayer » existant est imposé aux ouvriers, plus
     vite qu'à l'ordinaire ; pendant ce temps ils ne récoltent ni ne bâtissent.
   Un changement se décide au dépôt, prend effet après un délai, et jamais de l'alerte à la fin de l'assaut. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CityLaws217Rules;
 const START=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.startAge].name);
 const IDS=['halfRations','waterRation','clearingDuty'],KEYS=['version','active',...IDS,'dutyLeft','dutyResume','dutyServed'];
 const RESUME=['auto','harvest','build','clear'],MAX_WAVE=1e6;
 const NAMES={halfRations:'Demi-rations',waterRation:'Rationnement de l’eau',clearingDuty:'Corvée de déblaiement'};
 const off=()=>({on:false,wait:0});
 function initial(){return{version:1,active:false,halfRations:off(),waterRation:off(),clearingDuty:off(),dutyLeft:0,dutyResume:null,dutyServed:0};}
 const span=(v,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Lois de cité 217 invalides.');};
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k)))bad();
  const out={version:1,active:raw.active};
  for(const id of IDS){const l=raw[id];if(!l||typeof l!=='object'||Array.isArray(l)||Object.keys(l).length!==2||typeof l.on!=='boolean'||!span(l.wait,R.delaySeconds))bad();out[id]={on:l.on,wait:l.wait};}
  if(!span(raw.dutyLeft,R.clearingDuty.seconds)||!Number.isInteger(raw.dutyServed)||raw.dutyServed<0||raw.dutyServed>MAX_WAVE||raw.dutyResume!==null&&!RESUME.includes(raw.dutyResume))bad();
  // Une corvée en cours appartient à une loi en vigueur et connaît l'ordre à rendre ; une campagne inactive ne porte rien.
  if((raw.dutyLeft>0)!==(raw.dutyResume!==null)||raw.dutyLeft>0&&!raw.clearingDuty.on)bad();
  if(!raw.active&&(IDS.some(id=>raw[id].on||raw[id].wait>0)||raw.dutyLeft>0||raw.dutyServed>0))bad();
  return{...out,dutyLeft:raw.dutyLeft,dutyResume:raw.dutyResume,dutyServed:raw.dutyServed};
 }
 // Nombre de lois que la cité peut tenir à cet âge. Nul avant l'âge de départ.
 function cap(age){
  if(!Number.isInteger(age)||age<0)throw Error('Âge de cité invalide.');
  return age<R.startAge?0:R.caps[Math.min(age-R.startAge,R.caps.length-1)];
 }
 // Lois engagées : en vigueur sans abrogation décidée, ou promulguées et en attente.
 function engaged(state){return IDS.filter(id=>state[id].on!==(state[id].wait>0)).length;}
 // Part de la ration rendue par les demi-rations : jamais plus que ce qui vient d'être consommé.
 function spared(before,population,dt){
  if(!(before>0)||!(population>0)||!(dt>0)||!Number.isFinite(before+population+dt))return 0;
  return Math.min(before,population*R.foodPerPersonSecond*dt)*(1-R.halfRations.foodFactor);
 }
 const percent=n=>Math.round(n*100)+' %',amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const TERMS={
  halfRations:{effect:'nourriture consommée −'+percent(1-R.halfRations.foodFactor),price:'moral −'+amount(R.halfRations.moraleDrain*60)+' par minute',
   on:'la population ne touche plus qu’une part de sa ration ; le moral baisse.',gone:'les rations entières reviennent.'},
  waterRation:{effect:'eau puisée par la population −'+percent(1-R.waterRation.waterFactor)+', citernes préservées pour les incendies',price:'moral −'+amount(R.waterRation.moraleDrain*60)+' par minute',
   on:'la population puise moins dans les citernes ; le moral baisse.',gone:'la population puise de nouveau à sa soif.'},
  clearingDuty:{effect:'après chaque assaut repoussé, les ouvriers déblaient les murs '+C.formatTime(R.clearingDuty.seconds)+', cadence ×'+amount(R.clearingDuty.speed),price:'ni récolte ni chantier d’ouvrier pendant la corvée',
   on:'après chaque assaut repoussé, les ouvriers déblaient avant toute récolte.',gone:'les ouvriers reprennent leurs ordres après l’assaut.'}
 };
 function install(g){
  if(g.cityLaws217)return g.cityLaws217;if(!g.expansions)throw Error('Installer les opérations avant les lois de cité.');
  let state=initial();
  const active=()=>state.active,age=()=>g.tier?.id||0,open=()=>active()&&age()>=R.startAge;
  const inForce=id=>open()&&state[id].on,sieged=()=>g.phase==='warning'||g.phase==='assault';
  const waterFollowed=()=>Boolean(g.cityWater215?.active?.());
  const waterFactor=()=>inForce('waterRation')&&waterFollowed()?R.waterRation.waterFactor:1;
  function atDepot(){
   const core=g.core(),p=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('cityLaws217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!p?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.activationReach));
  }
  const DEPOT='Décidez-le au dépôt de D-17, à pied et les mains libres.';
  function quote(id){
   if(!IDS.includes(id))return{ok:false,reason:'Loi inconnue.'};
   if(!active())return{ok:false,reason:'Cette campagne ne suit pas les lois de cité.'};
   if(!open())return{ok:false,reason:'Les lois viendront à l’âge '+START+'.'};
   const law=state[id];
   if(law.wait>0)return{ok:false,reason:'Changement déjà décidé : effet dans '+C.formatTime(law.wait)+'.'};
   if(sieged())return{ok:false,reason:'Aucune loi ne change de l’alerte à la fin de l’assaut.'};
   if(!law.on){
    const limit=cap(age());
    if(engaged(state)>=limit)return{ok:false,reason:'À cet âge, la cité ne tient que '+limit+' loi'+(limit>1?'s':'')+' à la fois. Abrogez-en une d’abord.'};
    if(id==='waterRation'&&!waterFollowed())return{ok:false,reason:'Cette campagne ne suit pas l’eau de cité : rien à rationner.'};
   }
   if(!atDepot())return{ok:false,reason:DEPOT};
   return{ok:true};
  }
  // Promulguer ou abroger : la décision est prise au dépôt, l'effet vient après le délai.
  function change(id){
   const q=quote(id);if(!q.ok)return q;
   const law=state[id];law.wait=R.delaySeconds;
   g.notify?.((law.on?'Abrogation décidée : ':'Loi décidée : ')+NAMES[id]+'. Effet dans '+C.formatTime(R.delaySeconds)+', hors assaut.');
   g.audio?.ui?.();g.save(false);return{ok:true};
  }
  function endDuty(restore){
   const resume=state.dutyResume;state.dutyLeft=0;state.dutyResume=null;
   if(restore&&resume&&resume!=='clear'&&g.workerOrder==='clear')g.setWorkerOrder(resume);
  }
  // La corvée emprunte l'ordre « déblayer » existant. Un repli général en cours est respecté : pas de corvée.
  function startDuty(){
   const prior=g.workerOrder||'auto';if(!RESUME.includes(prior))return false;
   const served=state.dutyServed;
   state.dutyServed=g.wave;state.dutyLeft=R.clearingDuty.seconds;state.dutyResume=prior;
   if(prior!=='clear'&&!g.setWorkerOrder('clear')){state.dutyServed=served;state.dutyLeft=0;state.dutyResume=null;return false;}
   g.notify?.('Corvée de déblaiement : les ouvriers dégagent les murs pendant '+C.formatTime(R.clearingDuty.seconds)+'.');return true;
  }
  function tick(dt){
   if(!active()||!(dt>0)||g.state!=='playing'||g.gameOver)return;
   const siege=sieged();
   if(!siege)for(const id of IDS){
    const law=state[id];if(!(law.wait>0))continue;
    law.wait=Math.max(0,law.wait-dt);if(law.wait>0)continue;
    law.on=!law.on;
    if(id==='clearingDuty'&&!law.on&&state.dutyLeft>0)endDuty(true);
    g.notify?.(law.on?NAMES[id]+' en vigueur : '+TERMS[id].on:NAMES[id]+' abrogée : '+TERMS[id].gone,law.on?'normal':'good');
   }
   let drain=0;
   if(inForce('halfRations'))drain+=R.halfRations.moraleDrain;
   if(waterFactor()<1&&g.cityWater215?.needed?.())drain+=R.waterRation.moraleDrain;
   if(drain>0)g.morale=Math.max(0,g.morale-dt*drain);
   if(state.dutyLeft>0){
    // Un assaut qui revient ou un ordre contraire du Commandant lève la corvée de la nuit.
    if(siege)endDuty(true);
    else if(g.workerOrder!=='clear')endDuty(false);
    else{state.dutyLeft=Math.max(0,state.dutyLeft-dt);if(!(state.dutyLeft>0))endDuty(true);}
   }else if(inForce('clearingDuty')&&g.phase==='aftermath'&&Number.isInteger(g.wave)&&g.wave>=0&&g.wave<=MAX_WAVE&&state.dutyServed!==g.wave)startDuty();
  }
  function activationQuote(){
   if(active())return{ok:false,reason:'Les lois de cité sont déjà suivies pour cette campagne.'};
   return atDepot()?{ok:true}:{ok:false,reason:DEPOT};
  }
  function activate(){const q=activationQuote();if(!q.ok)return q;state={...initial(),active:true};g.notify?.('Lois de cité suivies : à partir de l’âge '+START+', la cité pourra promulguer des lois.');g.audio?.ui?.();g.save(false);return{ok:true};}
  function status(id){
   const law=state[id],held=law.wait>0&&sieged()?' (délai suspendu pendant l’assaut)':'';
   return law.on?(law.wait>0?'En vigueur · abrogation dans '+C.formatTime(law.wait)+held:'En vigueur'):law.wait>0?'En attente · en vigueur dans '+C.formatTime(law.wait)+held:'Abrogée';
  }
  function overview(){
   if(!active())return{summary:'Cette campagne ne suit pas les lois de cité. Elle peut les activer une fois, au dépôt.',rows:[{label:'Lois de cité',value:'Non suivies'}]};
   if(!open())return{summary:'La cité est encore assez petite pour se gouverner sans lois. Les lois viendront à l’âge '+START+'.',rows:[{label:'Lois de cité',value:'Aucune avant l’âge '+START}]};
   const limit=cap(age()),count=engaged(state),people=g.population||0;
   const rows=[{label:'Lois engagées',value:count+' / '+limit+' à cet âge'},
    {label:'Changement',value:'Au dépôt ; effet après '+C.formatTime(R.delaySeconds)+', jamais de l’alerte à la fin de l’assaut.'}];
   for(const id of IDS){
    let extra='';
    if(id==='halfRations')extra=' (ici '+amount(people*R.foodPerPersonSecond*(1-R.halfRations.foodFactor)*60)+' de nourriture épargnée par minute)';
    if(id==='waterRation')extra=waterFollowed()?' (ici '+amount(people*C.CityWater215Rules.perPersonSecond*(1-R.waterRation.waterFactor)*60)+' d’eau épargnée par minute)':' (sans objet : eau de cité non suivie)';
    if(id==='clearingDuty'&&state.dutyLeft>0)extra=' (corvée en cours, encore '+C.formatTime(state.dutyLeft)+')';
    rows.push({label:NAMES[id],value:status(id)+' — Effet : '+TERMS[id].effect+extra+'. Prix : '+TERMS[id].price+'.'});
   }
   const live=IDS.filter(id=>state[id].on).map(id=>NAMES[id]);
   return{summary:live.length?'En vigueur : '+live.join(', ')+'. Chaque loi a un prix ; il est payé tant qu’elle dure.':'Aucune loi en vigueur. Une loi est une politique durable : son effet et son prix durent autant qu’elle.',rows};
  }
  function actions(){
   if(!active()){const q=activationQuote();return[{id:'activate',label:'Suivre les lois de cité pour cette campagne',description:'Conserve le monde et les stocks. À partir de l’âge '+START+', la cité peut promulguer des lois à contrepartie visible. Activation durable.',disabled:!q.ok,reason:q.reason||'Aucun matériau consommé ; rien n’est créé.',run:activate}];}
   if(!open())return[];
   return IDS.map(id=>{const on=state[id].on,q=quote(id);return{id:(on?'repeal-':'enact-')+id,label:(on?'Abroger : ':'Promulguer : ')+NAMES[id],
    description:'Effet : '+TERMS[id].effect+'. Prix : '+TERMS[id].price+'.',disabled:!q.ok,reason:q.reason||'Effet dans '+C.formatTime(R.delaySeconds)+', hors assaut.',run:()=>change(id)};});
  }
  // Demi-rations : la ration entière est d'abord consommée par le moteur ; la part épargnée est rendue ensuite,
  // dans la limite du stockage. Rien n'est rendu qui n'ait été consommé à ce pas.
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){
   const rationed=inForce('halfRations'),before=rationed?this.resources.food:0,people=this.population;
   const result=economy.call(this,dt,...rest);
   if(rationed){const back=spared(before,people,dt),room=this.storage-this.resources.food;if(back>0&&room>0)this.resources.food+=Math.min(back,room);}
   tick(dt);return result;
  };
  // Corvée : même geste, même propriétaire ; seule la cadence des ouvriers change tant qu'elle dure.
  const clear=g.clearCorpsesWithWorker;
  g.clearCorpsesWithWorker=function(unit,wall,dt,...rest){
   return clear.call(this,unit,wall,state.dutyLeft>0&&unit&&unit!==this.player&&unit.kind==='worker'?dt*R.clearingDuty.speed:dt,...rest);
  };
  const api=Object.freeze({active,open,inForce,waterFactor,cap:()=>cap(age()),engaged:()=>engaged(state),duty:()=>state.dutyLeft,quote,change,tick,overview,actions,activationQuote,activate,snapshot:()=>validate(state)});g.cityLaws217=api;
  g.expansions.register({id:'cityLaws217',title:'Lois de la cité',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);},reset:()=>{state={...initial(),active:true};}});
  return api;
 }
 const api=Object.freeze({IDS:Object.freeze([...IDS]),initial,validate,cap,engaged,spared,install});root.DeadwallCityLaws217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
