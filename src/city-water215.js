/* Eau de cité (docs/GAME_BIBLE.md §7.3) : la population puise dans les citernes existantes.
   Une seule réserve : les citernes servent aussi aux incendies. Aucune eau n'est créée ici. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CityWater215Rules;
 const MAX_DRY=1e9,START=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.startAge].name);
 function initial(){return{version:1,active:false,dry:0};}
 function validate(raw){
  if(raw===undefined)return initial();
  if(!raw||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||typeof raw.dry!=='number'||!Number.isFinite(raw.dry)||raw.dry<0||raw.dry>MAX_DRY||Object.keys(raw).length!==3||Object.keys(raw).some(k=>!['version','active','dry'].includes(k)))throw Error('Eau de cité 215 invalide.');
  return{version:1,active:raw.active,dry:raw.dry};
 }
 // Besoin en eau d'une cité, par seconde. Nul avant l'âge de départ.
 function demand(population,age){
  if(!Number.isFinite(population)||population<0||!Number.isInteger(age)||age<0)throw Error('Besoin en eau invalide.');
  return age>=R.startAge?population*R.perPersonSecond:0;
 }
 // 0 : servie · 1 : citernes vides, délai de grâce · 2 : pénurie, le moral baisse.
 function stage(dry){return dry<=0?0:dry<R.graceSeconds?1:2;}
 function install(g){
  if(g.cityWater215)return g.cityWater215;if(!g.expansions)throw Error('Installer les opérations avant l’eau de cité.');
  let state=initial(),announced=0;
  const active=()=>state.active,needed=()=>active()&&g.tier?.id>=R.startAge;
  const reserve=()=>g.siege?.cityReserve215?.()||{tanks:0,water:0,capacity:0};
  function tick(dt){
   if(!needed()||!(dt>0)||g.state!=='playing'||g.gameOver)return 0;
   const need=demand(g.population,g.tier.id)*dt;if(need<=0)return 0;
   const drawn=g.siege?.drawCityWater215?.(need)||0;
   if(drawn>=need-1e-9){if(state.dry>0&&announced)g.notify?.('Eau de cité : les citernes servent de nouveau toute la population.','good');state.dry=0;announced=0;return drawn;}
   state.dry=Math.min(MAX_DRY,state.dry+dt);
   const now=stage(state.dry);
   if(now===2)g.morale=Math.max(0,g.morale-dt*R.moraleDrain);
   if(now>announced){announced=now;g.notify?.(now===1?'Eau de cité : les citernes sont vides. La population se rationne ; le moral baissera si rien ne change.':'Pénurie d’eau : le moral de la cité baisse.',now===1?'normal':'danger');}
   return drawn;
  }
  function activationQuote(){
   if(active())return{ok:false,reason:'L’eau de cité est déjà suivie pour cette campagne.'};
   const core=g.core(),p=g.frontier?.position?.();
   if(!g.expansions.canAct()||g.expansions.busy('cityWater215')||g.player.reload>0||g.selectedBuild||g.fieldcraft?.context?.().mounted||p?.active||g.expeditions?.driving?.()||!core||!g.workerCanWorkAt(g.player,core,R.activationReach))return{ok:false,reason:'Décidez-le au dépôt de D-17, à pied et les mains libres.'};
   return{ok:true};
  }
  function activate(){const q=activationQuote();if(!q.ok)return q;state.active=true;state.dry=0;announced=0;g.notify?.('Eau de cité suivie : à partir de l’âge '+START+', la population puisera dans les citernes.');g.audio?.ui?.();g.save(false);return{ok:true};}
  const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
  function overview(){
   const r=reserve(),age=g.tier?.id||0,perMinute=demand(g.population||0,age)*60,s=stage(state.dry);
   const autonomy=perMinute>0?r.water/(perMinute/60):null;
   const summary=!active()?'Cette campagne ne suit pas l’eau de cité. Elle peut l’activer une fois, au dépôt.':age<R.startAge?'La cité est encore assez petite pour se servir sans réseau. L’eau devient un besoin à l’âge '+START+'.':s===2?'Pénurie : le moral baisse tant que les citernes restent vides.':s===1?'Citernes vides : la population se rationne.':'La population puise dans les citernes. Ce sont les mêmes que celles des incendies.';
   return{summary,rows:[
    {label:'Réserve des citernes',value:amount(r.water)+' / '+amount(r.capacity)+' · '+r.tanks+' citerne'+(r.tanks>1?'s':'')},
    {label:'Besoin de la population',value:!active()?'Non suivi':perMinute>0?amount(perMinute)+' par minute':'Aucun avant l’âge '+START},
    {label:'Autonomie sans apport',value:autonomy===null?'Sans objet':autonomy<=0?'Aucune':C.formatTime(autonomy)},
    {label:'Approvisionnement',value:'Pompe des citernes alimentée en électricité et en carburant ; la pluie remplit lentement.'},
    {label:'Incendies',value:'L’eau bue n’est plus disponible pour éteindre un foyer. Gardez une marge avant un assaut.'}
   ]};
  }
  function actions(){if(active())return[];const q=activationQuote();return[{id:'activate',label:'Suivre l’eau de cité pour cette campagne',description:'Conserve le monde et les stocks. À partir de l’âge '+START+', la population puise dans les citernes ; une pénurie fait baisser le moral. Activation durable.',disabled:!q.ok,reason:q.reason||'Aucun matériau consommé ; aucune eau n’est créée.',run:activate}];}
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  const api=Object.freeze({active,needed,stage:()=>stage(state.dry),reserve,tick,overview,actions,activationQuote,activate,snapshot:()=>validate(state)});g.cityWater215=api;
  g.expansions.register({id:'cityWater215',title:'Eau de la cité',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);announced=stage(state.dry);},reset:()=>{state={version:1,active:true,dry:0};announced=0;}});
  return api;
 }
 const api=Object.freeze({initial,validate,demand,stage,install});root.DeadwallCityWater215=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
