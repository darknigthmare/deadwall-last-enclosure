/* DEADWALL — Les Vivants de D-17. Pure rules, no browser or clock dependency. */
(function initCitadel(root) {
  'use strict';
  const VERSION = '1.5.0-candidate.1';
  const RULES = Object.freeze({ discoverRange: 280, radioRange: 720, contactRange: 105, dangerRange: 125,
    homeRange: 72, followDistance: 65, maxStep: .25, maxSuspended: 128, maxHistory: 10, maxEvents: 32,
    inspectionSeconds: .5, maxReserve: 200, maxUnits: 10000 });
  const CALLS = Object.freeze([
    {id:'housing',name:'Élise Morel',role:'Menuisière',kind:'worker',tier:0,requires:null,cost:{food:8,medicine:1},
      brief:'J’ai calé la porte de la remise. Mes outils sont dehors. Montrez-moi un passage jusqu’au refuge, je reconstruirai avec vous.',
      arrival:'Élise a déposé sa caisse. « Demain, on fera mieux que tenir derrière des planches. »'},
    {id:'market',name:'Rachid Bensaïd',role:'Récupérateur',kind:'worker',tier:0,requires:null,cost:{food:8,medicine:1},
      brief:'Les arcades sont vides, mais les rues ne le sont pas. Je peux marcher. Je ne pars pas sans quelqu’un devant.',
      arrival:'Rachid rejoint les récupérateurs. Il repère déjà les pièces réutilisables dans la cour.'},
    {id:'aid',name:'Léa Vasseur',role:'Secouriste',kind:'medic',tier:2,requires:'clinic',cost:{food:12,medicine:4},
      brief:'Il ne reste rien dans l’ambulance. Préparez une clinique et quelques pansements ; je pourrai reprendre les soins au retour.',
      arrival:'Léa rejoint les secours. Les médicaments restent nécessaires à chaque intervention.'},
    {id:'industry',name:'Pavel Costa',role:'Technicien de maintenance',kind:'engineer',tier:2,requires:'workshop',cost:{food:12,scrap:12},
      brief:'Le portail a cédé. J’ai les mains blessées, mais je sais réparer vos machines. Il me faut un atelier, pas un miracle.',
      arrival:'Pavel rejoint les ingénieurs. Il demande de la ferraille avant de promettre des réparations.'},
    {id:'transit',name:'Aïcha Laurent',role:'Conductrice devenue récupératrice',kind:'worker',tier:1,requires:null,cost:{food:10,fuel:2},
      brief:'Le car ne repartira pas. Je viens à pied. Gardez une place au refuge ; je prendrai ma part des transports et des chantiers.',
      arrival:'Aïcha rejoint les ouvriers. Le vieux car reste au terminus ; personne n’a reçu un véhicule gratuit.'},
    {id:'checkpoint',name:'Gabriel Klein',role:'Fusilier',kind:'soldier',tier:1,requires:'barracks',cost:{food:10,ammo:15},
      brief:'Je n’ai plus de chargeur fiable. Je garde mon arme baissée jusqu’au dépôt. Il vous faudra une caserne pour me remettre en ligne.',
      arrival:'Gabriel rejoint une section. Son tir utilisera la même réserve de munitions que les autres fusiliers.'}
  ].map(c=>Object.freeze({...c,cost:Object.freeze(c.cost)})));
  const BY_ID = Object.freeze(Object.fromEntries(CALLS.map(c=>[c.id,c])));
  const building=(id,name,size,cost,extra)=>Object.freeze({id,name,size:Object.freeze(size),cost:Object.freeze(cost),category:'colony',icon:'⌂',
    health:850,buildTime:30,unlockTier:1,score:6,color:'#606858',roof:'#899078',...extra});
  const BUILDINGS=Object.freeze({
    receptionHall:building('receptionHall','Maison d’accueil',[4,3],{wood:100,scrap:40,food:20},{housing:10,light:95,
      description:'Dix logements. Les personnes escortées occupent leur place dès la prise en charge et rejoignent leurs tâches au retour.'}),
    radioRelay:building('radioRelay','Relais radio de quartier',[2,2],{wood:35,scrap:80,fuel:5},{health:620,buildTime:24,score:5,powerUse:2,requires:'generator',light:60,
      description:'Repère les appels dans un rayon de 720 lorsqu’il est alimenté. Ne révèle pas les infectés, ne sécurise pas un trajet et ne recrute personne à distance.'})
  });
  const clone=o=>JSON.parse(JSON.stringify(o));
  const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
  const int=(v,lo=0,hi=1e7)=>Number.isSafeInteger(v)&&v>=lo&&v<=hi;
  const num=(v,lo=0,hi=1e15)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
  const fail=label=>{throw new Error('Registre de la cité invalide : '+label+'.');};
  const ACTIVE=Object.freeze(['follow','hold','return']);
  const METRICS=Object.freeze(['kills','unitsLost','buildingsLost','shots','rescued','escortLosses','ignitions','extinguished']);
  function counters(raw={}) { if(!object(raw))fail('compteurs');return Object.fromEntries(METRICS.map(k=>{const v=raw[k]??0;if(!num(v))fail('compteur '+k);return[k,v];})); }
  function create(){return {version:1,calls:CALLS.map(c=>({id:c.id,seen:false,status:'waiting',unitId:null,citizenId:null})),suspended:[],reserve:0,
    stances:['mobile','mobile','mobile'],recallAtDusk:false,baseline:null,history:[],events:[],stats:{rescued:0,escortLosses:0}};}
  function normalize(raw){
    if(raw===undefined)return create();if(!object(raw)||raw.version!==1)fail('version');
    if(!Array.isArray(raw.calls)||raw.calls.length!==CALLS.length)fail('appels');const seen=new Set(),units=new Set();
    const calls=raw.calls.map(s=>{if(!object(s)||!Object.hasOwn(BY_ID,s.id)||seen.has(s.id)||typeof s.seen!=='boolean'||!['waiting',...ACTIVE,'delivered','lost'].includes(s.status))fail('appel');seen.add(s.id);
      if(ACTIVE.includes(s.status)){if(!s.seen||!int(s.unitId,1,0x7ffffffe)||units.has(s.unitId))fail('escorte');units.add(s.unitId);}
      else if(s.unitId!==null)fail('référence inactive');
      if(s.status==='delivered'){if(!int(s.citizenId,1,0x7ffffffe)||units.has(s.citizenId))fail('identité du résident');units.add(s.citizenId);}else if(s.citizenId!==null)fail('résident non arrivé');
      if(s.status!=='waiting'&&!s.seen)fail('contact inconnu');return {id:s.id,seen:s.seen,status:s.status,unitId:s.unitId,citizenId:s.citizenId};});
    if(!Array.isArray(raw.suspended)||raw.suspended.length>RULES.maxSuspended||new Set(raw.suspended).size!==raw.suspended.length||raw.suspended.some(n=>!int(n,1,0x7ffffffe)))fail('chantiers');
    if(!int(raw.reserve,0,RULES.maxReserve)||!Array.isArray(raw.stances)||raw.stances.length!==3||raw.stances.some(s=>!['mobile','hold'].includes(s))||typeof raw.recallAtDusk!=='boolean')fail('consignes');
    let baseline=null;
    if(raw.baseline!==null){const b=raw.baseline;if(!object(b)||!int(b.wave,1)||!num(b.at,0,1e12))fail('début de nuit');if(typeof b.partial!=='boolean')fail('origine du bilan');baseline={wave:b.wave,at:b.at,partial:b.partial,metrics:counters(b.metrics)};}
    if(!Array.isArray(raw.history)||raw.history.length>RULES.maxHistory)fail('bilans');const waves=new Set();let last=0;
    const history=raw.history.map(h=>{if(!object(h)||!int(h.wave,1)||h.wave<=last||waves.has(h.wave)||!num(h.seconds,0,1e12)||!['secured','fallen'].includes(h.outcome))fail('bilan');waves.add(h.wave);last=h.wave;if(typeof h.partial!=='boolean')fail('bilan partiel');return{wave:h.wave,seconds:h.seconds,outcome:h.outcome,partial:h.partial,metrics:counters(h.metrics)};});
    if(baseline&&waves.has(baseline.wave))fail('nuit déjà consignée');
    if(!Array.isArray(raw.events)||raw.events.length>RULES.maxEvents)fail('journal');
    const events=raw.events.map(e=>{if(!object(e)||!num(e.at,0,1e12)||!['found','joined','arrived','lost','dusk','order','suspend','resume'].includes(e.type)||typeof e.subject!=='string'||e.subject.length>40||!/^[a-zA-Z0-9 :_-]*$/.test(e.subject))fail('événement');return {at:e.at,type:e.type,subject:e.subject};});
    if(!object(raw.stats)||!int(raw.stats.rescued,0,6)||!int(raw.stats.escortLosses,0,6)||raw.stats.rescued!==calls.filter(c=>c.status==='delivered').length||raw.stats.escortLosses!==calls.filter(c=>c.status==='lost').length)fail('effectifs consignés');
    return {version:1,calls,suspended:raw.suspended.slice(),reserve:raw.reserve,stances:raw.stances.slice(),recallAtDusk:raw.recallAtDusk,baseline,history,events,stats:{...raw.stats}};
  }
  function canFire(stock,cost,reserve=0){return num(stock)&&num(cost,Number.MIN_VALUE)&&int(reserve,0,RULES.maxReserve)&&stock-cost>=reserve-1e-9;}
  function enlistStatus(state,id,ctx){const s=state.calls.find(s=>s.id===id),d=BY_ID[id];
    if(!s||!d||!s.seen)return{ok:false,reason:'Appel non repéré.'};if(s.status!=='waiting')return{ok:false,reason:'Cet appel a déjà été pris en charge.'};
    if(!ctx.command||ctx.dead)return{ok:false,reason:'Le commandant doit être debout et disponible.'};
    if(!ctx.day)return{ok:false,reason:'La prise de contact se prépare pendant le calme.'};
    if(!ctx.accessible)return{ok:false,reason:'Rejoignez le signal par un accès libre.'};
    if(!ctx.secure)return{ok:false,reason:'Éloignez les infectés avant la prise en charge.'};
    if(ctx.tier<d.tier||d.requires&&!ctx.has(d.requires))return{ok:false,reason:'Palier et infrastructure du rôle requis avant le départ.'};
    if(ctx.population>=RULES.maxUnits+1)return{ok:false,reason:'Limite technique de survivants atteinte ; aucune prise en charge engagée.'};
    if(!int(ctx.population,0,10001)||!num(ctx.housing)||ctx.population>=ctx.housing)return{ok:false,reason:'Une place de logement est requise dès la prise en charge.'};
    if(!object(ctx.resources)||Object.entries(d.cost).some(([k,n])=>!num(ctx.resources[k])||ctx.resources[k]<n))return{ok:false,reason:'Réserves de prise en charge insuffisantes.'};
    return{ok:true,reason:'Coût unique ; escorte physique jusqu’au centre. Aucun renfort téléporté.'};
  }
  class Engine{
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    call(id){return this.state.calls.find(s=>s.id===id)||null;}
    log(type,subject,at){this.state.events.push({type,subject:String(subject),at:Math.max(0,Math.min(1e12,at||0))});if(this.state.events.length>RULES.maxEvents)this.state.events.shift();}
    reveal(id,at=0){const s=this.call(id);if(!s||s.seen)return false;s.seen=true;this.log('found',id,at);return true;}
    enlist(id,unitId,ctx,at=0){const result=enlistStatus(this.state,id,ctx);if(!result.ok)return result;
      if(!int(unitId,1,0x7ffffffe)||this.state.calls.some(s=>s.unitId===unitId||s.citizenId===unitId))return{ok:false,reason:'Identifiant du survivant invalide.'};
      for(const [k,n]of Object.entries(BY_ID[id].cost))ctx.resources[k]-=n;
      Object.assign(this.call(id),{status:'follow',unitId});this.log('joined',id,at);return{ok:true};}
    order(id,order,at=0){const s=this.call(id);if(!s||!ACTIVE.includes(s.status)||!ACTIVE.includes(order))return false;s.status=order;this.log('order',id,at);return true;}
    finish(id,alive,at=0){const s=this.call(id);if(!s||!ACTIVE.includes(s.status))return false;s.status=alive?'delivered':'lost';s.citizenId=alive?s.unitId:null;s.unitId=null;this.state.stats[alive?'rescued':'escortLosses']++;this.log(alive?'arrived':'lost',id,at);return true;}
    suspend(id,value,at=0){if(!int(id,1,0x7ffffffe)||typeof value!=='boolean')return false;const i=this.state.suspended.indexOf(id);if(value&&i===-1){if(this.state.suspended.length>=RULES.maxSuspended)return false;this.state.suspended.push(id);this.log('suspend',id,at);}else if(!value&&i!==-1){this.state.suspended.splice(i,1);this.log('resume',id,at);}return true;}
    beginNight(wave,at,metrics,partial=false){if(!int(wave,1)||!num(at,0,1e12)||this.state.history.some(h=>h.wave===wave)||this.state.baseline?.wave===wave)return false;this.state.baseline={wave,at,partial:partial===true,metrics:counters(metrics)};return true;}
    endNight(wave,at,metrics,outcome='secured'){const b=this.state.baseline;if(!b||b.wave!==wave||!num(at,b.at,1e12)||!['secured','fallen'].includes(outcome))return false;
      const now=counters(metrics),delta=Object.fromEntries(METRICS.map(k=>[k,Math.max(0,now[k]-b.metrics[k])]));this.state.history.push({wave,seconds:at-b.at,outcome,partial:b.partial,metrics:delta});if(this.state.history.length>RULES.maxHistory)this.state.history.shift();this.state.baseline=null;return true;}
  }
  function install(C){if(!C||C.Citadel)return;for(const [id,b]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw Error('Construction en conflit : '+id);C.BUILDINGS[id]=b;}
    const old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!object(raw))return null;if(raw.version===7){if(raw.citadel===undefined)fail('registre v7 absent');const state=normalize(raw.citadel),base=old({...raw,version:6});return base?{...base,version:7,citadel:state}:null;}if(![1,2,3,4,5,6].includes(raw.version))return null;const base=old(raw);return base?{...base,version:7,citadel:create()}:null;};
    C.SAVE_VERSION=7;C.SAVE_KEY='deadwall-save-v7';C.SAVE_BACKUP_KEY='deadwall-save-backup-v7';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v6','deadwall-save-backup-v6',...C.LEGACY_SAVE_KEYS])];C.CITADEL_RULES=RULES;C.Citadel=API;
  }
  const API=Object.freeze({VERSION,RULES,CALLS,BY_ID,BUILDINGS,ACTIVE,METRICS,create,normalize,counters,canFire,enlistStatus,Engine,install});root.DeadwallCitadel=API;
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;if(root.DeadwallCore)install(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);
