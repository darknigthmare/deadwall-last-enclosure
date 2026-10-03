/* DEADWALL 1.2 — local district economy, occupation and real cargo accounting. */
(function initTerritories(root){
  'use strict';
  const KEYS=Object.freeze(['wood','scrap','stone','food','fuel','ammo','medicine']);
  const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
  const RULES=freeze({version:1,saveVersion:4,radius:220,buildRadius:180,interactionRadius:100,
    hostileRadius:190,innerRadius:85,claimSeconds:14,reclaimSeconds:22,claimFood:6,supplyPack:12,
    supplyCapacity:36,supplyPerSecond:.025,stockCapacity:120,workerRadius:100,
    occupationSeconds:24,pressureRecovery:1.5,convoyCost:{food:12,fuel:6},truckCapacity:48,
    truckHealth:240,truckRadius:11,truckSpeed:108,truckDamagePerContactSecond:7,
    truckMaxContacts:6,truckContactRadius:36,truckMax:6,repathSeconds:1.25,routeBudget:2,
    maxPathExpanded:16384,autoInterval:45,maxStep:.25,eventLimit:20,maxCounter:1e9,
    takeFood:12,epsilon:1e-7,repairScrap:8,repairHealth:100,repairRadius:110});
  const SECTORS=freeze([
    {id:'housing',name:'Les Maisons sans voix',short:'MAISONS',resource:'wood',rate:.42,reserve:900,
      briefing:'Les charpentes sont encore récupérables. Installer un poste, détacher un ouvrier et tenir les rues permet de sortir le bois sans abandonner le dépôt.',story:'Sous la poussière, les poutres portent toujours les mesures d’une autre vie.'},
    {id:'market',name:'Les Arcades muettes',short:'ARCADES',resource:'scrap',rate:.36,reserve:840,
      briefing:'Les arrière-boutiques recèlent des pièces. Les trieurs ne travaillent que si le quartier est calme, alimenté et ravitaillé.',story:'On a retiré les rideaux de fer. Pour la première fois, personne ne les a refermés derrière nous.'},
    {id:'aid',name:'Le Camp des veilleurs',short:'VEILLEURS',resource:'medicine',rate:.032,reserve:64,
      briefing:'Récupérer les fournitures encore conditionnées. Les réserves sont finies ; il ne s’agit ni d’un remède ni d’une production infinie de médicaments.',story:'Les dates sur les cartons ont été vérifiées une par une. Le reste ne sortira pas d’ici.'},
    {id:'industry',name:'La Cour des citernes',short:'CITERNES',resource:'fuel',rate:.24,reserve:600,
      briefing:'Les restes de carburant doivent être triés puis transportés. Le plein d’un convoi est payé au départ ; protéger l’itinéraire reste votre responsabilité.',story:'Le premier moteur a repris. Tout le monde a regardé la rue avant de sourire.'},
    {id:'transit',name:'Le Terminus des cendres',short:'TERMINUS',resource:'stone',rate:.40,reserve:920,
      briefing:'Le ballast et les dalles peuvent renforcer les enceintes. Le fourgon suit les passages praticables, pas une ligne qui ignore les portes.',story:'Les rails ne portent plus de trains. Ils nous indiquent encore le chemin du retour.'},
    {id:'checkpoint',name:'Le Passage du dernier feu',short:'BARRAGE',resource:'ammo',rate:.28,reserve:680,
      briefing:'Des caisses scellées restent derrière le barrage. La capture ne crédite pas de munitions : un ouvrier doit les récupérer, puis le convoi les rapporter.',story:'Les dernières caisses ont été comptées deux fois. Le poste avait tenu plus longtemps que nous le pensions.'}
  ]);
  const BY_ID=Object.freeze(Object.fromEntries(SECTORS.map(s=>[s.id,s])));
  const building=(id,name,category,icon,description,cost,health,time,size,tier,score,extra)=>({id,name,category,icon,description,cost,health,buildTime:time,size,unlockTier:tier,score,color:'#576159',roof:'#8b9280',...extra});
  const BUILDINGS=freeze({
    sectorPost:building('sectorPost','Poste de secteur','colony','⚑','À construire près d’un site de récupération. La prise exige 6 rations dans le sac. Un ouvrier affecté, présent, alimenté et ravitaillé alimente un stock local ; les convois le rapportent.',{wood:65,scrap:45,stone:25},1100,24,[2,2],1,7,{symbol:'PS',powerUse:1,light:95}),
    logisticsGarage:building('logisticsGarage','Garage logistique','industry','▰','Lance des fourgons non armés vers les postes. Chaque trajet engage 12 rations et 6 carburants ; la cargaison reste physique et peut être perdue.',{wood:70,scrap:120,stone:35,fuel:20},1250,36,[4,3],2,10,{symbol:'GL',powerUse:3,requires:'workshop',light:115}),
    fallbackRedoubt:building('fallbackRedoubt','Redoute de repli','defense','▣','Position de repli pour les ouvriers détachés et les sections. Tire avec la réserve commune de munitions, ajoute quatre logements et doit être défendue.',{wood:85,scrap:100,stone:70,ammo:30},1650,38,[3,3],2,9,{symbol:'RD',defense:true,housing:4,range:280,fireRate:1.4,damage:38,ammoPerShot:1,light:130})
  });
  const clone=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const finite=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const integer=(v,min=0,max=RULES.maxCounter)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  const fail=label=>{throw new Error('Territoires D-17 invalides : '+label+'.');};
  const has=(id)=>typeof id==='string'&&Object.hasOwn(BY_ID,id);
  const result=(ok,reason,extra={})=>({ok,reason,...extra});
  const emptySector=def=>({status:'neutral',control:0,pressure:0,supplies:0,stock:0,remaining:def.reserve,
    workerId:null,postId:null,everHeld:false,captures:0,losses:0,exported:0,automatic:false,nextDispatch:0});
  function create(){return{version:1,sectors:Object.fromEntries(SECTORS.map(s=>[s.id,emptySector(s)])),trucks:[],nextTruckId:1,
    withdrawing:[],fallbackId:null,stats:{delivered:0,convoysReturned:0,convoysLost:0,reclaimed:0},events:[]};}
  function normalize(raw){
    if(raw===undefined)return create();
    if(!object(raw)||raw.version!==1||!object(raw.sectors)||Object.keys(raw.sectors).length!==SECTORS.length)fail('registre');
    const state=create(),workers=new Set(),posts=new Set();
    for(const def of SECTORS){
      const s=raw.sectors[def.id];if(!object(s)||!['neutral','held','contested','lost','evacuated'].includes(s.status))fail('état de secteur');
      for(const [key,max]of [['control',RULES.reclaimSeconds],['pressure',RULES.occupationSeconds],['supplies',RULES.supplyCapacity],['stock',RULES.stockCapacity],['remaining',def.reserve],['exported',def.reserve],['nextDispatch',RULES.autoInterval]])if(!finite(s[key],0,max))fail(key);
      if(typeof s.everHeld!=='boolean'||typeof s.automatic!=='boolean'||!integer(s.captures)||!integer(s.losses))fail('historique');
      if((s.captures>0)!==s.everHeld||(['held','contested','lost','evacuated'].includes(s.status)&&!s.everHeld))fail('occupation sans capture');
      if(['held','contested'].includes(s.status)&&s.control!==0)fail('progression après capture');
      if(s.remaining+s.stock+s.exported>def.reserve+RULES.epsilon)fail('ressources de secteur dupliquées');
      for(const [key,set]of [['workerId',workers],['postId',posts]])if(s[key]!==null){if(!integer(s[key],1,0x7ffffffe)||set.has(s[key]))fail('affectation dupliquée');set.add(s[key]);}
      if(s.workerId!==null&&!['held','contested'].includes(s.status))fail('ouvrier affecté à un secteur non tenu');
      if(['held','contested'].includes(s.status)&&s.postId===null)fail('poste absent');
      state.sectors[def.id]={...emptySector(def),...Object.fromEntries(Object.keys(emptySector(def)).map(key=>[key,s[key]]))};
    }
    if(!Array.isArray(raw.trucks)||raw.trucks.length>RULES.truckMax||!integer(raw.nextTruckId,1))fail('parc de véhicules');
    const truckIds=new Set(),destinations=new Set();
    state.trucks=raw.trucks.map(t=>{
      if(!object(t)||!integer(t.id,1)||t.id>=raw.nextTruckId||truckIds.has(t.id)||!has(t.theme)||destinations.has(t.theme))fail('identité de convoi');
      truckIds.add(t.id);destinations.add(t.theme);
      if(!['outbound','returning'].includes(t.phase)||!finite(t.x,0,4096)||!finite(t.y,0,4096)||!finite(t.health,Number.MIN_VALUE,RULES.truckHealth)||!finite(t.food,0,RULES.supplyPack)||!finite(t.cargo,0,RULES.truckCapacity)||!finite(t.angle,-Math.PI,Math.PI))fail('véhicule');
      if(t.phase==='outbound'&&t.cargo!==0)fail('cargaison aller');
      if(typeof t.recalled!=='boolean'||t.recalled&&t.phase!=='returning')fail('rappel');
      const s=state.sectors[t.theme];if(s.remaining+s.stock+s.exported+t.cargo>BY_ID[t.theme].reserve+RULES.epsilon)fail('lot en transit dupliqué');
      return{id:t.id,theme:t.theme,phase:t.phase,x:t.x,y:t.y,health:t.health,food:t.food,cargo:t.cargo,angle:t.angle,recalled:t.recalled};
    });
    if(!Array.isArray(raw.withdrawing)||raw.withdrawing.length>10000||new Set(raw.withdrawing).size!==raw.withdrawing.length||raw.withdrawing.some(id=>!integer(id,1,0x7ffffffe)||workers.has(id)))fail('repli');
    state.withdrawing=raw.withdrawing.slice();state.nextTruckId=raw.nextTruckId;
    if(raw.fallbackId!==null&&!integer(raw.fallbackId,1,0x7ffffffe))fail('redoute');state.fallbackId=raw.fallbackId;
    if(!object(raw.stats))fail('statistiques');for(const key of Object.keys(state.stats)){if(!finite(raw.stats[key],0,RULES.maxCounter))fail('statistiques');state.stats[key]=raw.stats[key];}
    if(!Array.isArray(raw.events)||raw.events.length>RULES.eventLimit)fail('journal');
    const types=['captured','reclaimed','lost','evacuated','dispatched','returned','truckLost','supplied','assigned','recalled'];
    state.events=raw.events.map(e=>{if(!object(e)||!types.includes(e.type)||!has(e.theme))fail('entrée de journal');return{type:e.type,theme:e.theme};});
    return state;
  }
  const safeBag=bag=>object(bag)&&KEYS.every(k=>finite(bag[k]??0));
  class Engine{
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    sector(id){return has(id)?this.state.sectors[id]:null;}
    log(type,theme){this.state.events.push({type,theme});if(this.state.events.length>RULES.eventLimit)this.state.events.shift();}
    post(id,postId){
      const s=this.sector(id);if(!s||postId!==null&&!integer(postId,1,0x7ffffffe))return false;
      if(postId!==null&&SECTORS.some(d=>d.id!==id&&this.state.sectors[d.id].postId===postId))return false;
      if(s.postId!==null&&s.postId!==postId&&['held','contested'].includes(s.status))this.lose(id,'lost');
      s.postId=postId;return true;
    }
    claimStatus(id,ctx){
      const s=this.sector(id);if(!s)return result(false,'Quartier inconnu.');
      if(['held','contested'].includes(s.status))return result(false,'Poste déjà établi.');
      if(!ctx.running||ctx.dead||!ctx.atPost||!ctx.accessible)return result(false,'Rejoignez le poste terminé par un accès libre.');
      if(!ctx.operational||s.postId===null)return result(false,'Construisez et terminez un poste dans ce quartier.');
      if(!ctx.secure)return result(false,'Sécurisez les abords : des infectés sont trop proches.');
      if(!safeBag(ctx.carry)||(ctx.carry.food||0)<RULES.claimFood)return result(false,'Il faut 6 rations dans le sac. Prenez-les au centre.');
      return result(true,(s.everHeld?'Reconquérir':'Établir')+' le poste — maintenir ACTION / E.');
    }
    claim(id,dt,ctx){
      const status=this.claimStatus(id,ctx);if(!status.ok)return status;
      if(!finite(dt,Number.MIN_VALUE,RULES.maxStep))return result(false,'Pas de simulation invalide.');
      const s=this.sector(id),target=s.everHeld?RULES.reclaimSeconds:RULES.claimSeconds;
      s.control=Math.min(target,s.control+dt);
      if(s.control+RULES.epsilon<target)return result(true,status.reason);
      const reclaimed=s.everHeld;ctx.carry.food-=RULES.claimFood;s.supplies=Math.min(RULES.supplyCapacity,s.supplies+RULES.claimFood);
      s.status='held';s.control=0;s.pressure=0;s.everHeld=true;s.captures=Math.min(RULES.maxCounter,s.captures+1);
      if(reclaimed)this.state.stats.reclaimed=Math.min(RULES.maxCounter,this.state.stats.reclaimed+1);
      const event=reclaimed?'reclaimed':'captured';this.log(event,id);
      return result(true,reclaimed?'Quartier reconquis. Rétablissez son équipe et sa desserte.':'Poste établi. Affectez un ouvrier et protégez le trajet.',{event,theme:id});
    }
    lose(id,status='lost'){
      const s=this.sector(id);if(!s||!['held','contested'].includes(s.status)||!['lost','evacuated'].includes(status))return result(false,'Aucun poste tenu à évacuer.');
      if(s.workerId!==null&&!this.state.withdrawing.includes(s.workerId))this.state.withdrawing.push(s.workerId);
      s.workerId=null;s.status=status;s.control=0;s.pressure=0;s.stock=0;s.supplies=0;s.automatic=false;s.losses=Math.min(RULES.maxCounter,s.losses+1);
      for(const t of this.state.trucks)if(t.theme===id&&t.phase==='outbound'){t.phase='returning';t.recalled=true;}
      this.log(status,id);return result(true,status==='lost'?'Quartier perdu : stock local abandonné, ouvrier en repli. Le centre reste à défendre.':'Poste évacué : stocks locaux abandonnés, ouvrier en repli.',{event:status,theme:id});
    }
    assign(id,workerId,ctx){
      const s=this.sector(id);if(!s||s.status!=='held'||!ctx.canCommand||!integer(workerId,1,0x7ffffffe)||!ctx.workerAvailable)return result(false,'Affectation indisponible.');
      if(s.workerId!==null||SECTORS.some(d=>this.state.sectors[d.id].workerId===workerId)||this.state.withdrawing.includes(workerId))return result(false,'Cet ouvrier ou ce poste a déjà une affectation.');
      s.workerId=workerId;this.log('assigned',id);return result(true,'Ouvrier détaché : il rejoint physiquement le poste.',{event:'assigned',theme:id});
    }
    unassign(id){const s=this.sector(id);if(!s||s.workerId===null)return false;this.state.withdrawing.push(s.workerId);s.workerId=null;return true;}
    supply(id,ctx){
      const s=this.sector(id);if(!s||!['held','contested'].includes(s.status)||!ctx.running||ctx.dead||!ctx.atPost||!ctx.accessible||!ctx.secure||!safeBag(ctx.carry))return result(false,'Ravitaillement impossible ici.');
      const amount=Math.min(RULES.supplyPack,ctx.carry.food||0,RULES.supplyCapacity-s.supplies);
      if(amount<=RULES.epsilon)return result(false,'Poste plein ou aucune ration transportée.');
      s.supplies+=amount;ctx.carry.food-=amount;this.log('supplied',id);return result(true,amount.toFixed(1)+' rations remises au poste.',{event:'supplied',theme:id});
    }
    tick(id,dt,ctx){
      const s=this.sector(id),def=BY_ID[id];if(!s||!ctx.running||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return null;
      s.nextDispatch=Math.max(0,s.nextDispatch-dt);
      if(!['held','contested'].includes(s.status)){if(!ctx.secure)s.control=Math.max(0,s.control-dt);return null;}
      if(!ctx.operational)return this.lose(id);
      const enemies=finite(ctx.enemies,0,1e6)?ctx.enemies:0,inner=finite(ctx.innerEnemies,0,1e6)?ctx.innerEnemies:0,defenders=finite(ctx.defenders,0,1e6)?ctx.defenders:0;
      s.status=enemies>0?'contested':'held';
      if(inner>defenders)s.pressure=Math.min(RULES.occupationSeconds,s.pressure+dt*Math.min(3,inner-defenders));
      else s.pressure=Math.max(0,s.pressure-dt*RULES.pressureRecovery);
      if(s.pressure+RULES.epsilon>=RULES.occupationSeconds)return this.lose(id);
      if(s.status!=='held'||!ctx.powered||!ctx.workerPresent||s.workerId===null||s.supplies<=0||s.remaining<=0||s.stock>=RULES.stockCapacity)return null;
      const fraction=Math.min(1,s.supplies/(RULES.supplyPerSecond*dt),s.remaining/(def.rate*dt),(RULES.stockCapacity-s.stock)/(def.rate*dt));
      const amount=def.rate*dt*fraction;s.stock=Math.min(RULES.stockCapacity,s.stock+amount);s.remaining=Math.max(0,s.remaining-amount);s.supplies=Math.max(0,s.supplies-RULES.supplyPerSecond*dt*fraction);
      return null;
    }
    dispatchStatus(id,ctx){
      const s=this.sector(id);if(!s||s.status!=='held')return result(false,'Un poste tenu et sécurisé est requis.');
      if(!ctx.canCommand||!ctx.garage)return result(false,'Garage logistique terminé et alimenté requis.');
      if(!ctx.operational||!ctx.reachable)return result(false,'Aucun itinéraire praticable : vérifiez les portes.');
      if(this.state.trucks.some(t=>t.theme===id)||this.state.trucks.length>=RULES.truckMax)return result(false,'Un convoi dessert déjà ce quartier.');
      if(this.state.nextTruckId>=RULES.maxCounter)return result(false,'Compteur de convois épuisé.');
      if(!safeBag(ctx.resources)||Object.entries(RULES.convoyCost).some(([k,v])=>(ctx.resources[k]||0)<v))return result(false,'12 rations et 6 carburants sont nécessaires.');
      if(!finite(ctx.origin?.x,0,4096)||!finite(ctx.origin?.y,0,4096))return result(false,'Dépôt inaccessible.');
      return result(true,'Engager 12 rations et 6 carburants. Le fourgon sera exposé pendant le trajet.');
    }
    dispatch(id,ctx){
      const status=this.dispatchStatus(id,ctx);if(!status.ok)return status;
      for(const [k,v]of Object.entries(RULES.convoyCost))ctx.resources[k]-=v;
      const t={id:this.state.nextTruckId++,theme:id,phase:'outbound',x:ctx.origin.x,y:ctx.origin.y,health:RULES.truckHealth,food:RULES.supplyPack,cargo:0,angle:0,recalled:false};
      this.state.trucks.push(t);this.sector(id).nextDispatch=RULES.autoInterval;this.log('dispatched',id);
      return result(true,'Convoi en route. Aucun stock local n’est encore crédité.',{event:'dispatched',theme:id,truck:t});
    }
    arrivePost(truck,ctx){
      if(!this.state.trucks.includes(truck)||truck.phase!=='outbound'||!ctx.arrived)return result(false,'Convoi hors du poste.');
      const s=this.sector(truck.theme);
      if(!ctx.operational||s.status!=='held'){truck.phase='returning';truck.recalled=true;return result(true,'Poste indisponible : retour avec le chargement restant.');}
      const food=Math.min(truck.food,RULES.supplyCapacity-s.supplies);s.supplies+=food;truck.food-=food;
      truck.cargo=Math.min(RULES.truckCapacity,s.stock);s.stock-=truck.cargo;truck.phase='returning';
      return result(true,'Rations remises, stock embarqué. Le retour reste à effectuer.',{event:'loaded',theme:truck.theme});
    }
    unload(truck,ctx){
      if(!this.state.trucks.includes(truck)||truck.phase!=='returning'||!ctx.arrived||!safeBag(ctx.resources)||!finite(ctx.storage))return result(false,'Retour au dépôt nécessaire.');
      const key=BY_ID[truck.theme].resource,s=this.sector(truck.theme),food=Math.min(truck.food,Math.max(0,ctx.storage-(ctx.resources.food||0)));
      ctx.resources.food=(ctx.resources.food||0)+food;truck.food-=food;
      const cargo=Math.min(truck.cargo,Math.max(0,ctx.storage-(ctx.resources[key]||0)));ctx.resources[key]=(ctx.resources[key]||0)+cargo;truck.cargo-=cargo;
      s.exported+=cargo;this.state.stats.delivered=Math.min(RULES.maxCounter,this.state.stats.delivered+cargo);
      if(truck.food>RULES.epsilon||truck.cargo>RULES.epsilon)return result(true,'Dépôt plein : le reste du lot est conservé dans le fourgon.',{waiting:true,transferred:cargo});
      this.state.trucks.splice(this.state.trucks.indexOf(truck),1);this.state.stats.convoysReturned=Math.min(RULES.maxCounter,this.state.stats.convoysReturned+1);this.log('returned',truck.theme);
      return result(true,'Convoi rentré : la livraison est dans les réserves.',{event:'returned',theme:truck.theme,transferred:cargo});
    }
    recall(id){const t=this.state.trucks.find(t=>t.id===id);if(!t||t.phase!=='outbound')return result(false,'Ce convoi rentre déjà.');t.phase='returning';t.recalled=true;this.log('recalled',t.theme);return result(true,'Convoi rappelé. Les rations restantes reviennent ; le carburant engagé reste consommé.',{event:'recalled',theme:t.theme});}
    damage(id,amount){
      const t=this.state.trucks.find(t=>t.id===id);if(!t||!finite(amount,Number.MIN_VALUE,1e8))return null;
      t.health=Math.max(0,t.health-amount);if(t.health>0)return null;
      this.state.trucks.splice(this.state.trucks.indexOf(t),1);this.state.stats.convoysLost=Math.min(RULES.maxCounter,this.state.stats.convoysLost+1);this.log('truckLost',t.theme);
      return result(true,'Fourgon détruit : cargaison et rations en transit perdues.',{event:'truckLost',theme:t.theme});
    }
    repair(id,ctx){const t=this.state.trucks.find(t=>t.id===id);if(!t||!ctx.canCommand||!ctx.atTruck||!ctx.secure||!safeBag(ctx.resources)||t.health>=RULES.truckHealth||(ctx.resources.scrap||0)<RULES.repairScrap)return result(false,'Approchez le fourgon hors combat avec 8 ferrailles en réserve.');ctx.resources.scrap-=RULES.repairScrap;t.health=Math.min(RULES.truckHealth,t.health+RULES.repairHealth);return result(true,'Fourgon réparé de 100 points au maximum.');}
    overview(){const ss=Object.values(this.state.sectors);return{held:ss.filter(s=>s.status==='held').length,contested:ss.filter(s=>s.status==='contested').length,lost:ss.filter(s=>s.status==='lost'||s.status==='evacuated').length,staffed:ss.filter(s=>s.workerId!==null).length,convoys:this.state.trucks.length,...this.state.stats};}
  }
  function installCatalogue(C){
    if(!C||C.Territories)return;
    for(const [id,def]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Bâtiment de territoire déjà déclaré : '+id);C.BUILDINGS[id]=def;}
    C.TERRITORY_RULES=RULES;C.TERRITORY_SECTORS=SECTORS;
    const migrate=C.migrateSaveData;
    C.migrateSaveData=function(input){
      if(!object(input))return null;
      if(input.version===4){if(input.territories===undefined)fail('registre v4 absent');const territories=normalize(input.territories);const base=migrate({...input,version:3});return base?{...base,version:4,territories}:null;}
      if(![1,2,3].includes(input.version))return null;const base=migrate(input);return base?{...base,version:4,territories:create()}:null;
    };
    C.SAVE_VERSION=4;C.SAVE_KEY='deadwall-save-v4';C.SAVE_BACKUP_KEY='deadwall-save-backup-v4';
    C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v3','deadwall-save-backup-v3',...C.LEGACY_SAVE_KEYS])];C.Territories=API;
  }
  const API=Object.freeze({KEYS,RULES,SECTORS,BY_ID,BUILDINGS,create,normalize,Engine,installCatalogue});
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;
  root.DeadwallTerritories=API;if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);
