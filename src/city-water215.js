/* Eau de cité (docs/GAME_BIBLE.md §7.3) : la population puise dans les citernes existantes.
   Une seule réserve : les citernes servent aussi aux incendies. Aucune eau n'est créée ici.
   Pénurie en trois temps, chacun annoncé avant d'arriver : le moral baisse, des ouvriers partent, puis les plus
   fragiles meurent dans les murs par `g.damageUnit`, le chemin de mort ordinaire. Le retour de l'eau arrête tout. */
(function(root){'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.CityWater215Rules;
 const MAX_DRY=1e9,START=(n=>n.charAt(0)+n.slice(1).toLowerCase())(C.CITY_TIERS[R.startAge].name);
 const KEYS=['version','active','dry','departs','deaths','left','died'],MAX_COUNT=1e6;
 function initial(){return{version:2,active:false,dry:0,departs:0,deaths:0,left:0,died:0};}
 // Échéances atteintes après `dry` secondes de pénurie continue. Les départs cessent quand les morts commencent.
 function departSlots(dry){return dry<R.departSeconds?0:Math.floor((Math.min(dry,R.deathSeconds-1e-6)-R.departSeconds)/R.departInterval)+1;}
 function deathSlots(dry){return dry<R.deathSeconds?0:Math.floor((dry-R.deathSeconds)/R.deathInterval)+1;}
 function validate(raw){
  if(raw===undefined)return initial();
  const count=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
  // Forme de la première tranche ({version:1,active,dry}) : acceptée et convertie. Les échéances déjà
  // dépassées sont tenues pour échues, afin qu'une reprise ne déclenche ni départ ni mort rétroactifs.
  if(raw&&typeof raw==='object'&&!Array.isArray(raw)&&raw.version===1&&typeof raw.active==='boolean'&&typeof raw.dry==='number'&&Number.isFinite(raw.dry)&&raw.dry>=0&&raw.dry<=MAX_DRY&&Object.keys(raw).length===3&&Object.keys(raw).every(k=>['version','active','dry'].includes(k))){
   const dry=raw.active?raw.dry:0;return{version:2,active:raw.active,dry,departs:departSlots(dry),deaths:deathSlots(dry),left:0,died:0};
  }
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==2||typeof raw.active!=='boolean'||typeof raw.dry!=='number'||!Number.isFinite(raw.dry)||raw.dry<0||raw.dry>MAX_DRY||Object.keys(raw).length!==KEYS.length||Object.keys(raw).some(k=>!KEYS.includes(k))
   ||!count(raw.departs,departSlots(raw.dry))||!count(raw.deaths,deathSlots(raw.dry))||!count(raw.left,MAX_COUNT)||!count(raw.died,MAX_COUNT)||!raw.active&&(raw.dry>0||raw.left>0||raw.died>0))throw Error('Eau de cité 215 invalide.');
  return{version:2,active:raw.active,dry:raw.dry,departs:raw.departs,deaths:raw.deaths,left:raw.left,died:raw.died};
 }
 // Besoin en eau d'une cité, par seconde. Nul avant l'âge de départ.
 function demand(population,age){
  if(!Number.isFinite(population)||population<0||!Number.isInteger(age)||age<0)throw Error('Besoin en eau invalide.');
  return age>=R.startAge?population*R.perPersonSecond:0;
 }
 // 0 : servie · 1 : citernes vides, délai de grâce · 2 : le moral baisse · 3 : départs annoncés
 // 4 : des ouvriers partent · 5 : morts annoncées, les départs continuent · 6 : les plus fragiles meurent.
 function stage(dry){return dry<=0?0:dry<R.graceSeconds?1:dry<R.departWarnSeconds?2:dry<R.departSeconds?3:dry<R.deathWarnSeconds?4:dry<R.deathSeconds?5:6;}
 const NOTICES={1:['Eau de cité : les citernes sont vides. La population se rationne ; le moral baissera si rien ne change.','normal'],
  2:['Pénurie d’eau : le moral de la cité baisse.','danger'],
  3:['Pénurie d’eau : des habitants parlent de partir. Les premiers départs suivront si les citernes restent vides.','danger'],
  5:['Pénurie d’eau : les plus fragiles ne tiendront plus longtemps. Il y aura des morts dans les murs si l’eau ne revient pas.','danger']};
 const live=u=>Boolean(u&&!u.dead&&u.health>0),present=u=>live(u)&&!u.regionAbsent;
 function install(g){
  if(g.cityWater215)return g.cityWater215;if(!g.expansions)throw Error('Installer les opérations avant l’eau de cité.');
  let state=initial(),announced=0;
  const active=()=>state.active,needed=()=>active()&&g.tier?.id>=R.startAge;
  const reserve=()=>g.siege?.cityReserve215?.()||{tanks:0,water:0,capacity:0};
  // Part du besoin servie quand une loi de cité rationne l'eau (src/city-laws217.js) ; 1 sans loi.
  const ration=()=>{const f=g.cityLaws217?.waterFactor?.();return f>0&&f<=1?f:1;};
  const title=u=>(C.SURVIVORS[u.kind]?.name||'survivant').toLowerCase();
  const assigned=u=>Boolean(g.citadel?.isEscort?.(u.id)||['expeditions','salvage','infrastructure','siege','territories'].some(name=>g[name]?.isAssigned?.(u.id))||g.vertical175?.population?.isAssigned?.(u.id));
  const named=u=>Boolean(g.citadel?.snapshot?.().calls?.some(c=>c.citizenId===u.id||c.unitId===u.id));
  const lastWorker=u=>u.kind==='worker'&&g.units.filter(o=>live(o)&&o.kind==='worker').length<=1;
  const RANK={idle:0,build:2,clear:2};
  // Départ : un ouvrier présent, sans affectation ni nom, jamais le dernier. Le plus disponible d'abord.
  function leaver(){return g.units.filter(u=>present(u)&&u.kind==='worker'&&!lastWorker(u)&&!assigned(u)&&!named(u)).sort((a,b)=>(RANK[a.state]??1)-(RANK[b.state]??1)||(a.carry||0)-(b.carry||0)||b.id-a.id)[0]||null;}
  // Mort : le plus affaibli des présents ; le Commandant n'est pas une unité, le dernier ouvrier est épargné.
  function frailest(){return g.units.filter(u=>present(u)&&!lastWorker(u)).sort((a,b)=>a.health/a.maxHealth-b.health/b.maxHealth||a.maxHealth-b.maxHealth||a.id-b.id)[0]||null;}
  // Aucune affectation ne désigne l'ouvrier choisi : le retirer de la cité ne laisse aucune référence.
  // Le jeu écarte de lui-même les unités marquées ; ni perte comptée, ni corps.
  // `counted` : départ dû à l'eau, porté au bilan de la fiche. Un autre système (moral, src/balance217.js) emprunte
  // le même retrait par `departWorker`, avec sa propre annonce et sans toucher au bilan de l'eau.
  function leave(message,counted){const u=leaver();if(!u)return false;u.dead=true;u.health=0;u.supportActive=false;if(counted)state.left++;g.refreshMetrics?.(true);g.notify?.(message,'danger');return true;}
  function depart(){return leave('Pénurie d’eau : un ouvrier a quitté la cité.',true);}
  function departWorker(message){return typeof message==='string'&&message.length>0&&g.state==='playing'&&!g.gameOver?leave(message,false):false;}
  function die(){const u=frailest();if(!u)return false;const name=title(u);g.damageUnit(u,u.health);if(live(u))return false;state.died++;g.refreshMetrics?.(true);g.notify?.('Pénurie d’eau : un '+name+' est mort dans les murs, faute d’eau.','danger');return true;}
  function tick(dt){
   if(!needed()||!(dt>0)||g.state!=='playing'||g.gameOver)return 0;
   const need=demand(g.population,g.tier.id)*ration()*dt;if(need<=0)return 0;
   const drawn=g.siege?.drawCityWater215?.(need)||0;
   if(drawn>=need-1e-9){if(state.dry>0&&announced)g.notify?.('Eau de cité : les citernes servent de nouveau toute la population.','good');state.dry=0;state.departs=0;state.deaths=0;announced=0;return drawn;}
   state.dry=Math.min(MAX_DRY,state.dry+dt);
   const now=stage(state.dry);
   if(now>=2)g.morale=Math.max(0,g.morale-dt*R.moraleDrain);
   for(;announced<now;){const notice=NOTICES[++announced];if(notice)g.notify?.(notice[0],notice[1]);}
   // Une échéance, un habitant : un pas de temps long ne provoque jamais plusieurs départs ou morts.
   const departs=departSlots(state.dry),deaths=deathSlots(state.dry);
   if(deaths>state.deaths){state.deaths=deaths;state.departs=departs;die();}
   else if(departs>state.departs){state.departs=departs;depart();}
   return drawn;
  }
  function activationQuote(){
   if(active())return{ok:false,reason:'L’eau de cité est déjà suivie pour cette campagne.'};
   const core=g.core(),p=g.frontier?.position?.();
   if(!g.expansions.canAct()||g.expansions.busy('cityWater215')||g.player.reload>0||g.selectedBuild||g.fieldcraft?.context?.().mounted||p?.active||g.expeditions?.driving?.()||!core||!g.workerCanWorkAt(g.player,core,R.activationReach))return{ok:false,reason:'Décidez-le au dépôt de D-17, à pied et les mains libres.'};
   return{ok:true};
  }
  function activate(){const q=activationQuote();if(!q.ok)return q;state={...initial(),active:true};announced=0;g.notify?.('Eau de cité suivie : à partir de l’âge '+START+', la population puisera dans les citernes.');g.audio?.ui?.();g.save(false);return{ok:true};}
  const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
  function overview(){
   const r=reserve(),age=g.tier?.id||0,rationed=ration()<1,perMinute=demand(g.population||0,age)*ration()*60,s=stage(state.dry);
   const autonomy=perMinute>0?r.water/(perMinute/60):null,d=state.dry,wait=t=>C.formatTime(Math.max(0,t-d));
   const phase=['Aucune','Rationnement','Premier temps : le moral baisse','Premier temps : le moral baisse','Deuxième temps : des ouvriers partent','Deuxième temps : des ouvriers partent','Troisième temps : les plus fragiles meurent'][s];
   const next=s===0?'Rien tant que les citernes servent la population.':s===1?'Le moral baissera dans '+wait(R.graceSeconds)+'.':s<=3?'Premier départ dans '+wait(R.departSeconds)+'.':s<=5?(departSlots(R.deathSeconds)>state.departs?'Prochain départ dans '+wait(R.departSeconds+state.departs*R.departInterval)+' ; première':'Première')+' mort dans '+wait(R.deathSeconds)+'.':'Prochaine mort dans '+wait(R.deathSeconds+state.deaths*R.deathInterval)+'.';
   const plural=(n,one,many)=>n+' '+(n>1?many:one);
   const summary=!active()?'Cette campagne ne suit pas l’eau de cité. Elle peut l’activer une fois, au dépôt.':age<R.startAge?'La cité est encore assez petite pour se servir sans réseau. L’eau devient un besoin à l’âge '+START+'.':s===6?'Pénurie : les plus fragiles meurent dans les murs tant que l’eau ne revient pas.':s===5?'Pénurie : des ouvriers partent. Il y aura des morts si l’eau ne revient pas.':s===4?'Pénurie : des ouvriers quittent la cité, un à la fois.':s===3?'Pénurie : le moral baisse et des habitants parlent de partir.':s===2?'Pénurie : le moral baisse tant que les citernes restent vides.':s===1?'Citernes vides : la population se rationne.':'La population puise dans les citernes. Ce sont les mêmes que celles des incendies.';
   return{summary,rows:[
    {label:'Réserve des citernes',value:amount(r.water)+' / '+amount(r.capacity)+' · '+r.tanks+' citerne'+(r.tanks>1?'s':'')},
    {label:'Besoin de la population',value:!active()?'Non suivi':perMinute>0?amount(perMinute)+' par minute'+(rationed?' · eau rationnée par la loi':''):'Aucun avant l’âge '+START},
    {label:'Autonomie sans apport',value:autonomy===null?'Sans objet':autonomy<=0?'Aucune':C.formatTime(autonomy)},
    {label:'Pénurie',value:s===0?phase:phase+' · citernes vides depuis '+C.formatTime(d)},
    {label:'Ensuite',value:!active()||age<R.startAge?'Sans objet':next+(s>0?' Le retour de l’eau arrête tout.':'')},
    {label:'Pertes dues à l’eau',value:plural(state.left,'départ','départs')+' · '+plural(state.died,'mort','morts')},
    {label:'Approvisionnement',value:'Pompe des citernes alimentée en électricité et en carburant ; la pluie remplit lentement.'},
    {label:'Incendies',value:'L’eau bue n’est plus disponible pour éteindre un foyer. Gardez une marge avant un assaut.'}
   ]};
  }
  function actions(){if(active())return[];const q=activationQuote();return[{id:'activate',label:'Suivre l’eau de cité pour cette campagne',description:'Conserve le monde et les stocks. À partir de l’âge '+START+', la population puise dans les citernes ; une pénurie fait baisser le moral, puis partir des ouvriers, puis mourir les plus fragiles. Activation durable.',disabled:!q.ok,reason:q.reason||'Aucun matériau consommé ; aucune eau n’est créée.',run:activate}];}
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  const api=Object.freeze({active,needed,stage:()=>stage(state.dry),reserve,tick,overview,actions,activationQuote,activate,departWorker,snapshot:()=>validate(state)});g.cityWater215=api;
  g.expansions.register({id:'cityWater215',title:'Eau de la cité',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);announced=stage(state.dry);},reset:()=>{state={...initial(),active:true};announced=0;}});
  return api;
 }
 const api=Object.freeze({initial,validate,demand,stage,departSlots,deathSlots,install});root.DeadwallCityWater215=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
