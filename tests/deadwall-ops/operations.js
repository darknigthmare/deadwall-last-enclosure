/* DEADWALL — Sorties de ravitaillement. Original extension, 2026-09-22.
 * Pure campaign logic. This module is appended to core.js by the installer.
 * It never advances the game, grants rewards on load, or uses the campaign RNG.
 */
(function initFieldOperations(root) {
  'use strict';
  const KEYS = Object.freeze(['wood','scrap','stone','food','fuel','ammo','medicine']);
  const RULES = Object.freeze({ version:1, saveVersion:3, radius:80, safeRadius:150, baseRadius:180, maxStep:.25, maxHistory:12, maxFailures:100000, epsilon:1e-6 });
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const contract = (id, theme, name, briefing, tier, wave, seconds, timeLimit, cost, cargo, insight, morale, prerequisite=null, requires=null, unlock=null) =>
    ({id,theme,name,briefing,tier,wave,seconds,timeLimit,cost,cargo,insight,morale,prerequisite,requires,unlock});
  const CONTRACTS = freeze([
    contract('housing-cache','housing','La remise des maisons',
      'Des réserves sont encore fermées dans une remise. Rejoignez le quartier, écartez les infectés proches et préparez le chargement. Le registre des habitants reste une enquête séparée.',
      0,1,12,210,{food:8,ammo:4},{wood:20,food:8},1,2),
    contract('housing-register','housing','Les noms sur les boîtes',
      'Les effets personnels retrouvés donnent un sens aux numéros du dépôt. Récupérez les boîtes identifiées et rapportez-les avec leurs vivres. Rien ne permet d’affirmer que leurs propriétaires sont encore vivants.',
      1,3,22,255,{food:12,scrap:16},{food:18,medicine:6},2,6,'housing-cache'),
    contract('market-cache','market','Le rideau de fer',
      'Une arrière-boutique contient un lot de conserves. La manutention demande une zone calme. Les denrées n’entreront dans les réserves qu’après leur retour au commandement.',
      0,1,14,215,{food:8,ammo:4},{food:28},1,2),
    contract('market-kitchen','market','Le four communal',
      'Relevez le montage d’une cuisine collective et récupérez les pièces utilisables. Une ferme doit déjà nourrir la colonie : la cuisine développera cette chaîne, elle ne la remplacera pas.',
      1,3,24,280,{food:12,scrap:20,fuel:8},{food:12,scrap:12},1,3,'market-cache','farm','fieldKitchen'),
    contract('aid-cache','aid','Les armoires scellées',
      'Des trousses intactes subsistent au camp des veilleurs. Ne travaillez pas avec des infectés au contact. Le lot est encombrant et doit être ramené personnellement.',
      0,1,12,210,{food:8,ammo:6},{medicine:8,food:12},1,2),
    contract('aid-sterile','aid','Le protocole de stérilisation',
      'Récupérez le matériel et les fiches de préparation du camp. La clinique utilisera ce relevé pour ouvrir un atelier de pansements ; il ne produit aucun remède à l’infection.',
      2,4,26,300,{food:12,scrap:30,medicine:4},{medicine:8,food:8},2,4,'aid-cache','clinic','dressingWorkshop'),
    contract('industry-fuel','industry','Les fûts consignés',
      'Repérez les fûts encore étanches de la cour des citernes. Préparez uniquement ce que le sac peut emporter. La réserve de carburant de la cité ne bougera pas pendant le trajet aller.',
      1,2,16,240,{food:10,ammo:6},{fuel:24,scrap:6},1,1),
    contract('industry-bench','industry','Le banc de récupération',
      'Le plan du banc de tri permettrait de mieux récupérer les petites pièces. Un atelier militaire terminé est nécessaire pour adapter ses outils à la colonie.',
      2,5,28,320,{food:14,scrap:35,fuel:8},{scrap:24},2,3,'industry-fuel','workshop','recoveryBench'),
    contract('transit-manifest','transit','Le manifeste du terminus',
      'Le manifeste indique où les derniers manutentionnaires ont regroupé des pièces et des cartouches. Rejoignez le terminus et faites l’inventaire sur place.',
      1,2,18,245,{food:10,ammo:8},{scrap:16,ammo:12},1,2),
    contract('transit-reserve','transit','La réserve du dernier autobus',
      'Un compartiment d’entretien contient encore des rations et des trousses. Les récupérer n’ajoute aucun survivant à la colonie : ce sont les réserves d’un départ qui n’a pas eu lieu.',
      2,5,25,300,{food:12,scrap:20,ammo:10},{food:20,medicine:8},2,5,'transit-manifest'),
    contract('checkpoint-ammo','checkpoint','Les caisses de la relève',
      'Des caisses ont été abandonnées au barrage. Préparez un lot transportable et gardez une issue vers l’enceinte. Les armes de la colonie ne pourront l’utiliser qu’après livraison.',
      1,2,17,245,{food:10,ammo:8},{ammo:30},1,1),
    contract('checkpoint-optics','checkpoint','Les optiques du barrage',
      'Relevez les raccordements des projecteurs du barrage et récupérez leurs composants. Un générateur achevé est requis ; les futurs projecteurs consommeront réellement de l’électricité.',
      2,4,24,295,{food:12,scrap:25,fuel:6},{ammo:14,scrap:12},2,3,'checkpoint-ammo','generator','perimeterLight')
  ]);
  const BY_ID = Object.freeze(Object.fromEntries(CONTRACTS.map(item=>[item.id,item])));
  const building = (id,name,category,icon,description,cost,health,buildTime,size,unlockTier,score,extra) =>
    ({id,name,category,icon,description,cost,health,buildTime,size,unlockTier,score,color:'#53615a',roof:'#809086',...extra});
  const BUILDINGS = freeze({
    fieldKitchen: building('fieldKitchen','Cuisine collective','industry','♨',
      'Prépare les rations de la cité. Nécessite une ferme, de l’électricité et du carburant ; s’arrête si la nourriture est stockée au plafond.',
      {wood:65,scrap:70,stone:20},720,26,[3,2],1,6,
      {symbol:'CU',color:'#625544',roof:'#998369',powerUse:2,requires:'farm',production:{food:.58},consumes:{fuel:.025},light:65}),
    dressingWorkshop: building('dressingWorkshop','Atelier de pansements','industry','+',
      'Prépare des fournitures de soin. Nécessite une clinique, de la nourriture, de la ferraille et de l’électricité. Aucun remède à l’infection.',
      {wood:55,scrap:90,medicine:6},780,32,[3,3],2,8,
      {symbol:'SO',color:'#4c6763',roof:'#809d95',powerUse:3,requires:'clinic',production:{medicine:.045},consumes:{food:.08,scrap:.025},light:80}),
    recoveryBench: building('recoveryBench','Banc de récupération','industry','⚙',
      'Trie et remet en état les pièces de récupération. Nécessite un atelier militaire, du carburant et de l’électricité.',
      {wood:45,scrap:85,stone:30,fuel:10},850,30,[3,3],2,8,
      {symbol:'BR',color:'#555e5d',roof:'#879490',powerUse:3,requires:'workshop',production:{scrap:.56},consumes:{fuel:.04},light:65}),
    perimeterLight: building('perimeterLight','Projecteur de périmètre','defense','◌',
      'Éclaire un secteur de nuit quand il est alimenté. Consomme une unité d’énergie prioritaire ; ne tire pas et ne révèle pas une nouvelle carte.',
      {scrap:35,fuel:6},360,12,[1,1],2,2,
      {symbol:'PJ',color:'#5f6459',roof:'#b4ac88',powerUse:1,defense:true,requires:'generator',light:230})
  });
  const BLUEPRINTS = Object.freeze(Object.fromEntries(CONTRACTS.filter(item=>item.unlock).map(item=>[item.unlock,item.id])));
  const sum = bag => KEYS.reduce((total,key)=>total+(bag[key]||0),0);
  const clone = value => JSON.parse(JSON.stringify(value));
  const finite = (value,min=0,max=1e12) => typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
  const obj = value => value!==null&&typeof value==='object'&&!Array.isArray(value);
  const reject = label => { throw new Error('Opérations D-17 invalides : '+label+'.'); };
  const get = id => typeof id==='string'&&Object.hasOwn(BY_ID,id)?BY_ID[id]:null;
  function create() { return {version:RULES.version,completed:[],failures:{},active:null,last:null}; }
  function normalize(raw) {
    if (raw === undefined) return create();
    if(!obj(raw)||raw.version!==RULES.version||!Array.isArray(raw.completed)||raw.completed.length>CONTRACTS.length)reject('format');
    const completed=raw.completed.slice();
    if(completed.some(id=>!get(id))||new Set(completed).size!==completed.length)reject('contrats terminés');
    for(const id of completed)if(get(id).prerequisite&&!completed.includes(get(id).prerequisite))reject('enchaînement des contrats');
    const failures={};
    if(!obj(raw.failures)||Object.keys(raw.failures).length>CONTRACTS.length)reject('échecs');
    for(const [id,count]of Object.entries(raw.failures)){
      if(!get(id)||!Number.isInteger(count)||!finite(count,0,RULES.maxFailures))reject('compteur d’échecs');
      if(count)failures[id]=count;
    }
    let active=null;
    if(raw.active!==null){
      const item=get(raw.active?.id),a=raw.active;
      if(!item||!obj(a)||completed.includes(item.id)||!['outbound','working','returning'].includes(a.phase))reject('sortie active');
      if(item.prerequisite&&!completed.includes(item.prerequisite))reject('prérequis de sortie');
      if(!finite(a.work,0,item.seconds)||!finite(a.remaining,0,item.timeLimit)||a.remaining===0)reject('chronomètre');
      if((a.phase==='outbound'&&a.work!==0)||(a.phase==='working'&&a.work>=item.seconds)||(a.phase==='returning'&&a.work!==item.seconds))reject('progression incohérente');
      active={id:item.id,phase:a.phase,work:a.work,remaining:a.remaining};
    }
    let last=null;
    if(raw.last!==null){
      if(!obj(raw.last)||!get(raw.last.id)||!['delivered','abandoned','timeout','downed'].includes(raw.last.result))reject('dernier bilan');
      if(raw.last.result==='delivered'&&!completed.includes(raw.last.id))reject('livraison non consignée');
      if(raw.last.result!=='delivered'&&!(failures[raw.last.id]>0))reject('échec non consigné');
      last={id:raw.last.id,result:raw.last.result};
    }
    return {version:RULES.version,completed,failures,active,last};
  }
  function safeResources(ctx){return obj(ctx.resources)&&KEYS.every(key=>finite(ctx.resources[key],0,1e12));}
  const answer = (ok,reason='',extra={})=>({ok,reason,...extra});
  class Engine {
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    current(){return get(this.state.active?.id);}
    cargoMass(){const item=this.current();return item&&this.state.active.phase==='returning'?sum(item.cargo):0;}
    canBuild(id){return !Object.hasOwn(BLUEPRINTS,id)||this.state.completed.includes(BLUEPRINTS[id]);}
    availability(id,ctx){
      const item=get(id);
      if(!item)return answer(false,'Contrat inconnu.');
      if(this.state.completed.includes(id))return answer(false,'Livraison déjà terminée.');
      if(this.state.active)return answer(false,this.state.active.id===id?'Sortie en cours.':'Terminez ou abandonnez la sortie active.');
      if(!ctx.canCommand||ctx.dead)return answer(false,'Le commandant doit être disponible dans une campagne active.');
      if(!ctx.atBase)return answer(false,'Préparez la sortie près du centre, par un accès ouvert.');
      if(item.prerequisite&&!this.state.completed.includes(item.prerequisite))return answer(false,'Terminez « '+get(item.prerequisite).name+' ».');
      if(!finite(ctx.tier)||ctx.tier<item.tier)return answer(false,'Palier '+item.tier+' requis.');
      if(!finite(ctx.wave)||ctx.wave<item.wave)return answer(false,'Disponible à partir de la vague '+item.wave+'.');
      if(!ctx.siteAvailable)return answer(false,'Site introuvable sur cette carte.');
      if(item.requires&&!ctx.hasBuilding(item.requires))return answer(false,'Bâtiment terminé requis : '+item.requires+'.');
      if(!safeResources(ctx)||KEYS.some(key=>ctx.resources[key]+RULES.epsilon<(item.cost[key]||0)))return answer(false,'Réserves de préparation insuffisantes.');
      return answer(true,'Le matériel sera débité au départ. Aucun remboursement en cas d’échec.');
    }
    start(id,ctx){
      const status=this.availability(id,ctx);if(!status.ok)return status;
      const item=get(id);
      for(const key of KEYS)ctx.resources[key]=Math.max(0,ctx.resources[key]-(item.cost[key]||0));
      this.state.active={id,phase:'outbound',work:0,remaining:item.timeLimit};
      return answer(true,'Sortie engagée : '+item.name+'.',{event:'started',id});
    }
    fail(reason){
      const active=this.state.active;if(!active)return answer(false,'Aucune sortie active.');
      if(!['abandoned','timeout','downed'].includes(reason))return answer(false,'Motif inconnu.');
      const id=active.id;this.state.failures[id]=Math.min(RULES.maxFailures,(this.state.failures[id]||0)+1);
      this.state.active=null;this.state.last={id,result:reason};
      return answer(true,reason==='timeout'?'Fenêtre de retour dépassée. La sortie est perdue.':reason==='downed'?'Commandant à terre : le matériel de sortie est perdu.':'Sortie abandonnée. Le matériel engagé est perdu.',{event:'failed',id});
    }
    abort(id,ctx){
      if(!ctx.canCommand||id!==this.state.active?.id)return answer(false,'Cette sortie n’est plus active.');
      return this.fail('abandoned');
    }
    tick(dt,ctx){
      if(!this.state.active||!ctx.running||!finite(dt,Number.MIN_VALUE,.25))return null;
      if(ctx.dead)return this.fail('downed');
      this.state.active.remaining=Math.max(0,this.state.active.remaining-dt);
      if(this.state.active.remaining<=RULES.epsilon)return this.fail('timeout');
      return null;
    }
    workStatus(ctx){
      const item=this.current(),a=this.state.active;
      if(!item||a.phase==='returning')return answer(false,'Aucun lot à préparer ici.');
      if(!ctx.running||ctx.dead)return answer(false,'Reprenez le contrôle du commandant.');
      if(!ctx.atSite||!ctx.accessible)return answer(false,'Rejoignez le marqueur par un passage libre.');
      if(!ctx.secure)return answer(false,'Infectés proches : sécurisez un rayon de '+RULES.safeRadius+' unités.');
      if(!finite(ctx.capacity)||!finite(ctx.normalCarry)||ctx.normalCarry+sum(item.cargo)>ctx.capacity+RULES.epsilon)return answer(false,'Sac trop plein : '+sum(item.cargo)+' places libres sont nécessaires.');
      if(item.requires&&!ctx.hasBuilding(item.requires))return answer(false,'Le bâtiment de soutien requis a été perdu. Reconstruisez-le.');
      return answer(true,'Maintenez ACTION / E pour préparer le lot.');
    }
    work(dt,ctx){
      const status=this.workStatus(ctx);if(!status.ok)return status;
      if(!ctx.action||!finite(dt,Number.MIN_VALUE,.25))return answer(false,status.reason);
      const item=this.current(),active=this.state.active;
      active.phase='working';active.work=Math.min(item.seconds,active.work+dt);
      if(active.work+RULES.epsilon>=item.seconds){active.work=item.seconds;active.phase='returning';return answer(true,'Lot chargé. Retournez au centre de commandement.',{event:'loaded',id:item.id});}
      return answer(true,status.reason);
    }
    deliveryStatus(ctx){
      const item=this.current();
      if(!item||this.state.active.phase!=='returning')return answer(false,'Aucune cargaison de sortie à livrer.');
      if(!ctx.running||ctx.dead||!ctx.atBase)return answer(false,'Rapportez le lot près du centre, par un passage ouvert.');
      if(!safeResources(ctx)||!finite(ctx.storage,1,1e12))return answer(false,'Stocks indisponibles.');
      const missing=KEYS.filter(key=>(item.cargo[key]||0)>Math.max(0,ctx.storage-ctx.resources[key])+RULES.epsilon);
      if(missing.length)return answer(false,'Dépôt plein : libérez de la place avant la livraison.',{missing});
      if(!finite(ctx.insight,0,ctx.insightMax)||ctx.insight+item.insight>ctx.insightMax)return answer(false,'Dépensez des points d’analyse avant la livraison.');
      if(!finite(ctx.morale,0,100))return answer(false,'État de la colonie invalide.');
      return answer(true,'Maintenez ACTION / E pour remettre la cargaison et le relevé.');
    }
    deliver(ctx){
      const status=this.deliveryStatus(ctx);if(!status.ok)return status;
      const item=this.current();
      // Single synchronous commit: no partial payment, reward queue or duplicated return.
      for(const key of KEYS)ctx.resources[key]+=(item.cargo[key]||0);
      ctx.insight+=item.insight;ctx.morale=Math.min(100,ctx.morale+item.morale);
      this.state.completed.push(item.id);this.state.last={id:item.id,result:'delivered'};this.state.active=null;
      return answer(true,'Livraison consignée : '+item.name+'.',{event:'delivered',id:item.id,unlock:item.unlock,insight:ctx.insight,morale:ctx.morale});
    }
  }
  function logistics(ctx){
    const production=Object.fromEntries(KEYS.map(k=>[k,0])),consumption={...production};
    consumption.food=Math.max(0,ctx.population||0)*.0065*60;
    let unpowered=0,pausedIndustry=0,generatorUse=0;
    for(const b of ctx.buildings||[]){
      if(b.dead||!b.completed||!b.def)continue;
      if(b.type==='generator'&&ctx.resources.fuel>0){const use=(ctx.hasResearch('grid')?.0135:.018)*60;consumption.fuel+=use;generatorUse+=use;}
      if(b.def.powerUse&&!b.powered)unpowered++;
      if(!b.def.production)continue;
      const power=b.def.powerUse?(b.powered?1:(b.powerShare||0)*(ctx.hasResearch('grid')?.7:.35)):1;
      const crisis=b.def.powerUse&&ctx.activeCrisis?.id==='blackout'&&ctx.activeCrisis.status==='resolved'&&ctx.activeCrisis.choice==='B'?.5:1;
      let fraction=1;
      for(const [key,rate]of Object.entries(b.def.production))if(rate>0)fraction=Math.min(fraction,Math.max(0,ctx.storage-ctx.resources[key])/(rate*.25*Math.max(.0001,power)*crisis));
      for(const [key,rate]of Object.entries(b.def.consumes||{}))if(rate>0)fraction=Math.min(fraction,ctx.resources[key]/(rate*.25*Math.max(.0001,power)*crisis));
      if(power<=.05||fraction<=0){pausedIndustry++;continue;}
      const factor=Math.min(1,fraction)*power*crisis*60;
      for(const [key,rate]of Object.entries(b.def.production))production[key]+=rate*factor;
      for(const [key,rate]of Object.entries(b.def.consumes||{}))consumption[key]+=rate*factor;
    }
    return {rows:KEYS.map(key=>({key,stock:ctx.resources[key],capacity:ctx.storage,production:production[key],consumption:consumption[key],net:production[key]-consumption[key]})),unpowered,pausedIndustry,generatorUse};
  }
  function installCatalogue(C){
    if(!C||!C.BUILDINGS||C.FieldOperations)return;
    for(const [id,def]of Object.entries(BUILDINGS)){
      if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Identifiant de bâtiment déjà utilisé : '+id);
      C.BUILDINGS[id]=def;
    }
    const migrate=C.migrateSaveData;
    C.migrateSaveData=function(input){
      if(!obj(input))return null;
      if(input.version===RULES.saveVersion){
        if(input.fieldOps===undefined)reject('registre v3 absent');
        const fieldOps=normalize(input.fieldOps);
        // Reuse the original v2 research normalization, then preserve the new registry.
        const base=migrate({...input,version:2});
        return base?{...base,version:RULES.saveVersion,fieldOps}:null;
      }
      if(input.version!==1&&input.version!==2)return null;
      const prior=migrate(input);return prior?{...prior,version:RULES.saveVersion,fieldOps:create()}:null;
    };
    C.SAVE_VERSION=RULES.saveVersion;C.SAVE_KEY='deadwall-save-v3';C.SAVE_BACKUP_KEY='deadwall-save-backup-v3';
    C.LEGACY_SAVE_KEYS=['deadwall-save-v2','deadwall-save-backup-v2',...C.LEGACY_SAVE_KEYS];
    C.FieldOperations=API;
  }
  const API=Object.freeze({KEYS,RULES,CONTRACTS,BY_ID,BUILDINGS,BLUEPRINTS,get,create,normalize,Engine,logistics,installCatalogue,sum});
  if(typeof module!=='undefined'&&module.exports){
    if(module.exports.BUILDINGS)module.exports.FieldOperations=undefined;
    else module.exports=API;
  }
  root.DeadwallOperations=API;
  if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);
