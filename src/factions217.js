/* Factions (docs/GAME_BIBLE.md §4), NOUVELLES campagnes seulement. Deux factions de la bible :
   - Les Rouleurs (pillards) attaquent la chaîne, jamais le mur : ils barrent la route à un fourgon qui rentre chargé.
     Le barrage tombe tous les `period` retours chargés (compteur, aucun tirage). Il se passe sans tir : escorte de
     fusiliers près du fourgon, ou tribut versé d'avance ; sinon une part bornée du coffre est prise, carburant d'abord.
   - Les Relais (alliés) demandent de l'aide à vagues fixes. Donner depuis le stock, au dépôt, fait monter l'entente
     et rapporte plus tard une contrepartie annoncée, plus petite que le don.
   Un état de relation change par des actes, jamais par un menu. Ce module ne tire aucun hasard, ne touche ni à la
   génération du monde ni aux identifiants.
   Deuxième tranche (état v2 ; un état v1 est converti sans rien perdre) :
   - Repaire : chaque faction tient un lieu régional DÉJÀ généré, choisi par une fonction pure du monde (`lairs`) :
     usage compatible lu sur le titre d'origine, lieu sans occupant infecté, ni remarquable, ni allié pour les
     Rouleurs, à distance bornée de D-17, puis hachage de l'identifiant. Rien n'est écrit dans le monde. Un lieu tenu
     par un avant-poste a eu des occupants infectés : il n'est donc jamais candidat. Le repaire n'est repéré (et
     marqué sur l'atlas) qu'en sortie, à `lair.spot` mètres, comme un lieu remarquable.
   - Entente : Rouleurs en Entente → plus de barrage, et un renseignement à acheter au dépôt contre du carburant
     (prochaine vague menée, ou un lieu remarquable pas encore repéré). Elle s'entretient : sans tribut ni achat
     pendant `entente.memory` vagues, la réputation baisse d'un cran. Relais en Entente → un échange par vague
     (ressource contre ressource) et une recrue, une seule fois.
   - Escorte : elle se mesure pendant tout le retour, à `escort.checks` points fixes de la route entre la sortie et
     les abords ; seuls comptent les fusiliers hors des murs (district « Dehors », à `escort.beyond` au moins de
     l'enceinte extérieure). Les abords suivent l'enceinte extérieure : jamais à l'intérieur des murs.
   - Repaire attaqué (§4.5) : décidé en sortie, devant le repaire des Rouleurs. Aucun humain hostile n'existe dans le
     moteur et aucune règle de combat n'est ajoutée : le repaire est représenté par sa garde, neutralisée par une
     section de fusiliers de D-17 à prix fixe et annoncé, « payé trois fois » : munitions prises au stock, bruit
     (signature de la cité pendant `assault.noiseWaves` vagues, donc hordes plus nombreuses) et fusiliers tués.
     Détruits, les Rouleurs ne reviennent pas : plus de barrage, mais plus de tribut, de renseignement ni de
     ralliement, définitivement. Le stock du repaire (carburant) rentre au dépôt.
   - Ralliement : après `rally.afterWaves` vagues d'Entente tenue, les Rouleurs demandent à rejoindre D-17. Accepter
     coûte de la nourriture et des logements ; leurs membres deviennent des fusiliers de la cité, sans barrage ensuite.
   - Tribut : son coût suit l'âge de la cité et les vagues, borné.
   Une campagne commencée avant cette règle n'a ni faction, ni repaire, ni repère. */
(function(root){'use strict';
 const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=need('DeadwallCore','./core.js'),G=need('DeadwallFrontierGeometry','./frontier-geometry.js'),R=C.Factions217Rules,RAID=R.raid,RELAY=R.relay;
 const IDS=['rouleurs','relais'],NAMES={rouleurs:'Les Rouleurs',relais:'Les Relais'};
 const KEYS_V1=['version','active','spotted','returns','exposed','passes','rep','affairs','relay'];
 const KEYS=[...KEYS_V1,'lairs','leg','kept','entente','fate','rally','intel','noise','traded','recruit'],STAGES=['none','open','owed'];
 const CODES_V1={rouleurs:['spotted','robbed','deterred','passed','tribute','guarded'],relais:['asked','helped','returned','unanswered']};
 const CODES={rouleurs:[...CODES_V1.rouleurs,'friendly','intel','stormed','rallied','rallyAsked','decayed'],relais:[...CODES_V1.relais,'traded','recruited']};
 const FATES=['free','destroyed','rallied'],RECRUIT=['none','offered','taken'],INTEL=['led','site'];
 const MAX=1e6,ID=/^P\d{4}$/,CHECK_SECONDS=.5;
 // Usage compatible lu sur le titre d'origine du lieu (avant la variante et le bourg).
 const USES={rouleurs:/^garage|^casse automobile|station-service|^entrep[ôo]t/i,relais:/^ferme|^corps de ferme|^hameau|^long[èe]re|^exploitation mara[îi]ch/i};
 function initial(){return{version:2,active:false,spotted:false,returns:0,exposed:false,passes:0,rep:{rouleurs:0,relais:0},affairs:{rouleurs:null,relais:null},relay:{index:0,stage:'none',wave:0},
  lairs:{rouleurs:false,relais:false},leg:{checks:0,guarded:0},kept:0,entente:null,fate:'free',rally:{stage:'none',wave:0},intel:null,noise:0,traded:-1,recruit:'none'};}
 const fresh=()=>({...initial(),active:true});
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 const exact=(o,keys)=>Boolean(o)&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(o,k));
 function validate(raw){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Factions 217 invalides.');};
  // v1 (première tranche) : mêmes champs, sans repaire ni effets d'entente ; convertie avec les valeurs neutres.
  const old=raw&&typeof raw==='object'&&raw.version===1,codes=old?CODES_V1:CODES;
  if(!exact(raw,old?KEYS_V1:KEYS)||![1,2].includes(raw.version)||typeof raw.active!=='boolean'||typeof raw.spotted!=='boolean'||typeof raw.exposed!=='boolean'
   ||!int(raw.returns,0,MAX)||!int(raw.passes,0,RAID.maxPasses)||!exact(raw.rep,IDS)||!exact(raw.affairs,IDS)||!exact(raw.relay,['index','stage','wave']))bad();
  const out={...initial(),active:raw.active,spotted:raw.spotted,returns:raw.returns,exposed:raw.exposed,passes:raw.passes,rep:{},affairs:{},relay:null};
  for(const id of IDS){
   if(!int(raw.rep[id],R.factions[id].min,R.factions[id].max))bad();out.rep[id]=raw.rep[id];
   const a=raw.affairs[id];
   if(a!==null&&(!exact(a,['code','amount','wave'])||!codes[id].includes(a.code)||typeof a.amount!=='number'||!Number.isFinite(a.amount)||a.amount<0||a.amount>MAX||!int(a.wave,0,MAX)))bad();
   out.affairs[id]=a===null?null:{code:a.code,amount:a.amount,wave:a.wave};
  }
  const q=raw.relay;if(!int(q.index,0,MAX)||!STAGES.includes(q.stage)||!int(q.wave,0,MAX+RELAY.returnWaves))bad();
  out.relay={index:q.index,stage:q.stage,wave:q.wave};
  // Les Rouleurs ne sont connus qu'après un premier retour chargé ; rien ne se négocie avec des inconnus.
  if(!raw.spotted&&(raw.returns>0||raw.passes>0||raw.rep.rouleurs!==0||raw.affairs.rouleurs!==null))bad();
  if(raw.spotted!==(raw.returns>0)||q.stage==='none'&&q.wave!==0)bad();
  if(!old){
   if(!exact(raw.lairs,IDS)||IDS.some(id=>typeof raw.lairs[id]!=='boolean')||!exact(raw.leg,['checks','guarded'])||!int(raw.leg.checks,0,R.escort.checks)||!int(raw.leg.guarded,0,raw.leg.checks)
    ||!int(raw.kept,0,MAX)||raw.entente!==null&&!int(raw.entente,0,MAX)||!FATES.includes(raw.fate)||!exact(raw.rally,['stage','wave'])||!['none','asked'].includes(raw.rally.stage)||!int(raw.rally.wave,0,MAX)
    ||!int(raw.noise,0,MAX+R.assault.noiseWaves)||!int(raw.traded,-1,MAX)||!RECRUIT.includes(raw.recruit))bad();
   const i=raw.intel;
   if(i!==null&&(!exact(i,['kind','ref','wave'])||!INTEL.includes(i.kind)||!int(i.wave,0,MAX)||(i.kind==='led'?!int(i.ref,1,MAX*2):typeof i.ref!=='string'||!ID.test(i.ref))))bad();
   // Entente, renseignement, ralliement et sort du repaire supposent des Rouleurs connus ; un repaire détruit ne
   // prend plus de tribut ; une demande de ralliement suppose l'Entente et un repaire libre.
   if(!raw.spotted&&(raw.fate!=='free'||raw.entente!==null||raw.intel!==null||raw.kept!==0||raw.rally.stage!=='none'))bad();
   if(raw.fate==='destroyed'&&(raw.passes>0||raw.entente!==null)||raw.rally.stage==='asked'&&(raw.fate!=='free'||raw.entente===null)||raw.rally.stage==='none'&&raw.rally.wave!==0)bad();
   if(raw.entente!==null&&raw.rep.rouleurs<R.ententeAt)bad();
   if(raw.noise>0&&raw.fate!=='destroyed')bad();
   out.lairs={rouleurs:raw.lairs.rouleurs,relais:raw.lairs.relais};out.leg={checks:raw.leg.checks,guarded:raw.leg.guarded};
   out.kept=raw.kept;out.entente=raw.entente;out.fate=raw.fate;out.rally={stage:raw.rally.stage,wave:raw.rally.wave};
   out.intel=i===null?null:{kind:i.kind,ref:i.ref,wave:i.wave};out.noise=raw.noise;out.traded=raw.traded;out.recruit=raw.recruit;
  }
  // v1 : la dernière affaire connue des Rouleurs date l'entretien de la relation.
  if(old&&raw.spotted&&raw.affairs.rouleurs)out.kept=raw.affairs.rouleurs.wave;
  if(!raw.active&&JSON.stringify(out)!==JSON.stringify(initial()))bad();
  return out;
 }
 // Cinq états de la bible (§4.4), lus depuis la réputation ; aucune jauge chiffrée n'est montrée.
 function standing(id,rep,known=true){
  if(!IDS.includes(id)||!Number.isInteger(rep))throw Error('Faction inconnue.');
  if(!known)return'Inconnue';
  if(rep>=R.ententeAt)return'Entente';if(rep<=R.hostileAt)return'Hostile';if(rep<0)return'Tension';
  return id==='rouleurs'&&rep===0?'Repérée':'En contact';
 }
 // Le barrage tombe tous les `period` retours chargés : compteur de sorties, aucun tirage.
 const ambushAt=returns=>Number.isInteger(returns)&&returns>0&&returns%RAID.period===0;
 const untilAmbush=returns=>RAID.period-returns%RAID.period;
 // Part prise à un coffre : bornée par la part et par le plafond, carburant d'abord, jamais plus que le coffre.
 function toll(cargo,rep=0){
  const rule=rep<=R.hostileAt?RAID.hostile:RAID,taken=C.makeBag(),total=C.bagTotal(cargo);
  let left=Math.min(total*rule.share,rule.maxLoss);
  if(!(left>0)||!Number.isFinite(left))return{taken,total:0};
  let sum=0;
  for(const k of ['fuel',...C.RESOURCE_KEYS.filter(k=>k!=='fuel')]){const n=Math.min(left,Math.max(0,cargo[k]||0));taken[k]=n;left-=n;sum+=n;}
  return{taken,total:sum};
 }
 // Tribut : la base de la première tranche, plus un cran par âge de la cité et par tranche de vagues, plafonné.
 function tributeCost(age=0,wave=0){
  const T=R.tributeScale,n=Math.min(T.max,RAID.tribute.fuel+T.perTier*Math.max(0,Math.floor(Number(age)||0))+T.perStep*Math.floor(Math.max(0,Number(wave)||0)/T.everyWaves));
  return{...C.makeBag(),fuel:n};
 }
 const title=p=>String(p?.name||'').split(' · ')[0].split(' — ')[0];
 // Repaires : fonction pure du monde. Mêmes lieux, mêmes repaires ; rien n'est écrit dans le monde.
 const lairCache=new WeakMap();
 function lairs(world){
  if(!world||!Array.isArray(world.pois)||!world.home)return Object.freeze({rouleurs:null,relais:null});
  const known=lairCache.get(world);if(known)return known;
  const Remarkable=need('DeadwallRemarkable217','./remarkable217.js');
  const marked=new Set((Remarkable?.select?.(world)||[]).map(e=>e.id)),taken=new Set(),out={};
  for(const id of IDS){
   let best=null;
   for(const p of world.pois){
    if(!p||!ID.test(p.id)||taken.has(p.id)||marked.has(p.id)||!USES[id].test(title(p)))continue;
    if(p.occupation==='infected'||id==='rouleurs'&&p.occupation==='allied')continue;
    if(typeof world.threatCount==='function'&&world.threatCount(p)>0)continue;
    const d=Math.hypot(p.x-world.home.x,p.y-world.home.y);if(d<R.lair.minDistance||d>R.lair.maxDistance)continue;
    // Les Relais s'installent d'abord dans un lieu déjà tenu par des alliés ; ensuite seulement le hachage départage.
    const first=id==='relais'&&p.occupation==='allied'?0:1,rank=G.hash(world.seed,p.id,'lair217:'+id);
    if(!best||first<best.first||first===best.first&&(rank<best.rank||rank===best.rank&&p.id<best.p.id))best={p,rank,first};
   }
   if(best){taken.add(best.p.id);out[id]=Object.freeze({id:best.p.id,name:best.p.name,title:title(best.p),x:best.p.x,y:best.p.y,radius:Math.hypot(best.p.w,best.p.h)/2,faction:id});}
   else out[id]=null;
  }
  const result=Object.freeze(out);lairCache.set(world,result);return result;
 }
 const request=index=>RELAY.requests[index%RELAY.requests.length];
 const requestWave=index=>RELAY.firstWave+index*RELAY.everyWaves;
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const bagText=bag=>C.RESOURCE_KEYS.filter(k=>bag[k]>0).map(k=>amount(bag[k])+' '+C.RESOURCE_META[k].label.toLowerCase()).join(', ');
 const metres=d=>d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m';
 const WINDS=['E','SE','S','SO','O','NO','N','NE'],wind=(dx,dy)=>WINDS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
 const live=e=>e&&!e.dead&&e.health>0;
 // « à Les Granges » se dit « aux Granges ».
 const to=name=>name.startsWith('Les ')?'aux '+name.slice(4):'à '+name,of=name=>name.startsWith('Les ')?'des '+name.slice(4):'de '+name;
 function install(g,doc){
  if(g.factions217)return g.factions217;if(!g.expansions)throw Error('Installer les opérations avant les factions.');
  let state=initial(),clock=-Infinity,fenceCache=null;
  const active=()=>state.active,wave=()=>int(g.wave,0,MAX)?g.wave:0,age=()=>g.tier?.id||0;
  const setRep=(id,delta)=>{state.rep[id]=C.clamp(state.rep[id]+delta,R.factions[id].min,R.factions[id].max);};
  const affair=(id,code,n=0)=>{state.affairs[id]={code,amount:n,wave:wave()};};
  const vehicle=()=>{const v=g.expeditions?.car?.();return live(v)&&!v.regionAway?v:null;};
  const fromCore=p=>{const core=g.core?.();return core?Math.hypot(p.x-core.x,p.y-core.y):Infinity;};
  // Seul point de crédit du module : un dépôt borné par la place du dépôt, pour un échange déjà payé.
  function credit(bag){const got=C.makeBag();for(const k of C.RESOURCE_KEYS){const n=Math.max(0,Math.min(bag[k]||0,g.storage-g.resources[k]));if(n>0){g.resources[k]+=n;got[k]=n;}}return got;}
  const room=bag=>C.RESOURCE_KEYS.every(k=>!(bag[k]>0)||g.storage-g.resources[k]>=bag[k]);
  // --- Enceinte : relevé des districts (lecture seule), gardé par version de navigation. ---
  function fence(){
   const world=g.world,version=world?.navigationVersion;
   if(fenceCache&&fenceCache.world===world&&fenceCache.version===version)return fenceCache.value;
   let value={rings:0,districtOf:()=>0,works:[],reach:0};
   try{
    const D=need('DeadwallDistricts','./districts.js'),T=need('DeadwallTactics','./tactics.js'),core=g.core?.();
    if(D&&T&&world&&core){
     const view=D.survey(C,T,world.buildings.values()),outer=view.rings[view.rings.length-1];
     const works=outer?outer.works.map(b=>{const f=T.footprint(b);return{x:f.x*C.TILE,y:f.y*C.TILE,w:f.width*C.TILE,h:f.height*C.TILE};}):[];
     let reach=0;for(const r of works)for(const[x,y]of[[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]])reach=Math.max(reach,Math.hypot(x-core.x,y-core.y));
     value={rings:view.rings.length,districtOf:view.districtOf,works,reach};
    }
   }catch(error){/* relevé indisponible : pas d'enceinte connue */}
   fenceCache={world,version,value};return value;
  }
  // Abords de la cité et seuil de sortie : jamais en deçà de l'enceinte extérieure. Bornés par la carte locale.
  function approach(){
   const f=fence(),half=(g.local||C.LOCAL_MAP217).size/2,span=RAID.awayDistance-RAID.ambushDistance;
   const away=Math.min(half-2*C.TILE,Math.max(RAID.awayDistance,f.reach+R.escort.margin+span));
   return{away,near:Math.min(away-span/2,Math.max(RAID.ambushDistance,f.reach+R.escort.margin))};
  }
  // Hors des murs : district « Dehors », au-delà de `beyond` de tout ouvrage de l'enceinte extérieure, et loin du centre.
  function outside(u){
   if(fromCore(u)<R.escort.minCore)return false;
   const f=fence();if(!f.rings)return true;
   if(f.districtOf(u)!==0)return false;
   for(const r of f.works){const dx=Math.max(r.x-u.x,0,u.x-r.x-r.w),dy=Math.max(r.y-u.y,0,u.y-r.y-r.h);if(Math.hypot(dx,dy)<R.escort.beyond)return false;}
   return true;
  }
  const escort=v=>g.units.filter(u=>live(u)&&u.kind==='soldier'&&!u.regionAbsent&&Math.hypot(u.x-v.x,u.y-v.y)<=RAID.escortRange&&outside(u)).length;
  function atDepot(){
   const core=g.core(),p=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('factions217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!p?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.reach));
  }
  const DEPOT='Décidez-le au dépôt de D-17, à pied et les mains libres.',NONE='Cette campagne ne connaît pas les factions.';
  const entente=id=>state.rep[id]>=R.ententeAt;
  const free=()=>state.fate==='free';
  // Retour d'un fourgon chargé : l'affaire se règle sur la route, aux abords de la cité, avant le déchargement.
  function resolveReturn(v){
   const escorted=state.leg.checks>=R.escort.checks&&state.leg.guarded>=R.escort.checks;
   state.exposed=false;state.leg={checks:0,guarded:0};
   if(C.bagTotal(v.cargo)<RAID.minCargo)return;
   // Rouleurs détruits ou ralliés : plus personne ne suit le fourgon.
   if(!free()){g.save(false);return;}
   state.returns=Math.min(MAX,state.returns+1);
   if(!state.spotted){state.spotted=true;affair('rouleurs','spotted');g.notify?.('Des motards ont suivi le fourgon à distance jusqu’aux abords de D-17. Les Rouleurs savent désormais qu’il rentre chargé.','danger');}
   if(!ambushAt(state.returns)){g.save(false);return;}
   // Route gardée (avant-postes 217) : un fourgon qui rentre du côté d'un avant-poste n'est pas barré ; le tribut est gardé.
   const guard=g.outposts217?.guards?.(v);
   if(guard){affair('rouleurs','guarded');g.notify?.('Les Rouleurs n’ont pas barré la route du retour : elle est gardée par l’avant-poste « '+guard+' ».','good');}
   else if(entente('rouleurs')){affair('rouleurs','friendly');g.notify?.('Les Rouleurs attendaient au carrefour : en Entente, ils laissent passer le fourgon et lèvent la main.','good');}
   else if(state.passes>0){state.passes--;affair('rouleurs','passed');g.notify?.('Barrage des Rouleurs sur la route du retour : le tribut a été versé, ils laissent passer le fourgon.');}
   else if(escorted){affair('rouleurs','deterred');g.notify?.('Barrage des Rouleurs sur la route du retour : devant l’escorte qui a suivi le fourgon hors des murs, ils dégagent la chaussée sans un tir.','good');}
   else{
    const t=toll(v.cargo,state.rep.rouleurs);for(const k of C.RESOURCE_KEYS)v.cargo[k]=Math.max(0,v.cargo[k]-t.taken[k]);
    setRep('rouleurs',-1);affair('rouleurs','robbed',t.total);
    g.notify?.('Fourgon intercepté par les Rouleurs sur la route du retour : '+bagText(t.taken)+' pris dans le coffre. Personne n’a tiré.','danger');
   }
   g.save(false);
  }
  // Points de contrôle du retour, de la sortie vers les abords ; le dernier est aux abords.
  const checkpoint=(z,i)=>z.away-(z.away-z.near)*i/R.escort.checks;
  function tickRoad(){
   const v=vehicle();if(!v){state.exposed=false;state.leg={checks:0,guarded:0};return;}
   const d=fromCore(v),z=approach();
   if(!state.exposed){if(d>=z.away&&C.bagTotal(v.cargo)>=RAID.minCargo){state.exposed=true;state.leg={checks:0,guarded:0};}return;}
   // Reparti au large : le retour recommence, l'escorte aussi.
   if(d>=z.away){state.leg={checks:0,guarded:0};return;}
   while(state.leg.checks<R.escort.checks&&d<=checkpoint(z,state.leg.checks+1)){
    const ok=escort(v)>=RAID.escortSoldiers;state.leg={checks:state.leg.checks+1,guarded:state.leg.guarded+(ok?1:0)};
   }
   if(d<=z.near)resolveReturn(v);
  }
  const terms=q=>bagText(q.ask)+' ; contrepartie annoncée : '+bagText(q.back);
  function tickRelay(){
   const q=state.relay,w=wave(),req=request(q.index);
   if(q.stage==='none'){
    if(g.phase==='calm'&&w>=requestWave(q.index)){q.stage='open';q.wave=w;affair('relais','asked',q.index);
     g.notify?.(req.relay+' demande de l’aide : '+terms(req)+', '+RELAY.returnWaves+' vagues après le don. Réponse au dépôt avant la fin de la vague.');g.save(false);}
   }else if(q.stage==='open'){
    if(w>=q.wave+RELAY.openWaves){setRep('relais',-1);affair('relais','unanswered',q.index);q.stage='none';q.wave=0;q.index++;
     g.notify?.(req.relay+' n’a rien reçu de D-17. Le relais s’est débrouillé seul ; il s’en souviendra.');g.save(false);}
   }else if(g.phase==='calm'&&w>=q.wave&&room(req.back)){
    credit(req.back);
    affair('relais','returned',q.index);q.stage='none';q.wave=0;q.index++;
    g.notify?.(req.relay+' tient parole : '+bagText(req.back)+' livrés au dépôt.','good');g.save(false);
   }
   // Première Entente avec les Relais : une recrue est proposée, une seule fois.
   if(state.recruit==='none'&&entente('relais')){state.recruit='offered';g.notify?.('Les Relais ont confiance : une famille propose qu’un des siens rejoigne D-17. Réponse au dépôt.','good');g.save(false);}
  }
  // Entente des Rouleurs : elle s'entretient par des actes, se suit par vague, et mène à la demande de ralliement.
  function tickEntente(){
   if(!state.spotted||!free())return;
   const w=wave();let changed=false;
   if(state.rep.rouleurs>0&&w>=state.kept+R.entente.memory){
    const was=entente('rouleurs');setRep('rouleurs',-1);state.kept=w;affair('rouleurs','decayed');changed=true;
    if(was&&!entente('rouleurs'))g.notify?.('Les Rouleurs n’ont rien reçu de D-17 depuis '+R.entente.memory+' vagues : l’Entente est rompue, le barrage reprendra.','danger');
   }
   if(entente('rouleurs')){if(state.entente===null){state.entente=w;changed=true;}}
   else if(state.entente!==null){state.entente=null;if(state.rally.stage==='asked')state.rally={stage:'none',wave:0};changed=true;}
   if(state.rally.stage==='none'&&state.entente!==null&&w>=state.entente+R.rally.afterWaves){
    state.rally={stage:'asked',wave:w};affair('rouleurs','rallyAsked');changed=true;
    g.notify?.('Les Rouleurs demandent à rejoindre D-17 : '+R.rally.members+' des leurs, contre '+bagText(R.rally.cost)+' et des logements. Réponse au dépôt.','good');
   }
   if(changed)g.save(false);
  }
  function tickNoise(){if(state.noise>0&&wave()>state.noise){state.noise=0;g.refreshMetrics?.(true);g.save(false);}}
  function tick(dt){if(!active()||!(dt>0)||g.state!=='playing'||g.gameOver)return;tickRoad();tickRelay();tickEntente();tickNoise();}
  // --- Repaires : lus sur le monde, repérés en sortie seulement. ---
  const world=()=>{try{return g.frontier?.world?.()||null;}catch(error){return null;}};
  const lairOf=id=>{const w=world();return w?lairs(w)[id]:null;};
  function sight(){
   if(!active()||g.state!=='playing'||g.gameOver||!g.frontier?.active?.())return;
   const f=g.frontier.position();if(!f?.active||f.z!==0)return;
   for(const id of IDS){
    const l=state.lairs[id]?null:lairOf(id);if(!l||Math.hypot(l.x-f.x,l.y-f.y)>R.lair.spot)continue;
    state.lairs[id]=true;
    g.notify?.(id==='rouleurs'?'Repaire repéré : '+l.title+'. Motos sous bâche, bidons alignés, une vigie sur le toit'+(state.spotted?' : les Rouleurs vivent ici.':' : une bande motorisée vit ici.'):'Relais repéré : '+l.title+'. Une fumée de cuisine, des volets tenus : des familles vivent ici.',id==='rouleurs'?'danger':'good');
    g.save(false);
   }
  }
  function helpQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(state.relay.stage!=='open')return{ok:false,reason:'Aucun relais ne demande d’aide en ce moment.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   const req=request(state.relay.index);
   return C.canAfford(g.resources,req.ask)?{ok:true}:{ok:false,reason:'Stock insuffisant : '+bagText(req.ask)+' demandés.'};
  }
  function help(){
   const quote=helpQuote();if(!quote.ok)return quote;
   const q=state.relay,req=request(q.index);
   C.spend(g.resources,req.ask);setRep('relais',1);affair('relais','helped',q.index);q.stage='owed';q.wave=wave()+RELAY.returnWaves;
   g.notify?.('Aide envoyée '+to(req.relay)+' : '+bagText(req.ask)+'. Contrepartie promise à la vague '+q.wave+' : '+bagText(req.back)+'.','good');
   g.audio?.ui?.();g.save(false);return{ok:true};
  }
  const tribute=()=>tributeCost(age(),wave());
  function tributeQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(!state.spotted)return{ok:false,reason:'Personne n’a encore approché le fourgon.'};
   if(!free())return{ok:false,reason:state.fate==='destroyed'?'Les Rouleurs ne sont plus.':'Les Rouleurs vivent désormais à D-17.'};
   if(state.passes>=RAID.maxPasses)return{ok:false,reason:'Le prochain barrage est déjà payé.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   const cost=tribute();return C.canAfford(g.resources,cost)?{ok:true}:{ok:false,reason:'Stock insuffisant : '+bagText(cost)+' exigés.'};
  }
  function payTribute(){
   const quote=tributeQuote();if(!quote.ok)return quote;
   const cost=tribute();
   C.spend(g.resources,cost);state.passes++;setRep('rouleurs',1);state.kept=wave();affair('rouleurs','tribute',C.bagTotal(cost));
   g.notify?.('Tribut laissé au carrefour pour les Rouleurs : '+bagText(cost)+'. Le prochain barrage laissera passer le fourgon.');
   tickEntente();g.audio?.ui?.();g.save(false);return{ok:true};
  }
  // Renseignement des Rouleurs : la prochaine vague menée, sinon le lieu remarquable non repéré le plus proche de D-17.
  function offer(){
   const last=state.intel;
   try{
    const A=g.abominations217,n=A?.active?.()?A.next?.():null;
    if(Number.isInteger(n)&&n>=wave()&&!(last?.kind==='led'&&last.ref===n))return{kind:'led',ref:n};
   }catch(error){/* module absent */}
   try{
    const w=world(),list=g.remarkable217?.active?.()?g.remarkable217.list():[];
    if(w?.home){const site=list.filter(v=>!v.sighted&&!(last?.kind==='site'&&last.ref===v.id)).map(v=>({v,d:Math.hypot(v.x-w.home.x,v.y-w.home.y)})).sort((a,b)=>a.d-b.d||(a.v.id<b.v.id?-1:1))[0];
     if(site)return{kind:'site',ref:site.v.id};}
   }catch(error){/* module absent */}
   return null;
  }
  function intelText(i){
   if(!i)return'';
   if(i.kind==='led'){
    const A=root.DeadwallAbominations217||(typeof require==='function'?require('./abominations217.js'):null),where=A?.post?.(g.world?.seed??0,i.ref)?.where;
    return'vague '+i.ref+' menée : la Meneuse rassemblera la horde '+(where||'au bord de la carte');
   }
   const w=world(),v=g.remarkable217?.list?.().find(e=>e.id===i.ref);
   if(!v||!w?.home)return'un lieu remarquable';
   return v.name+' ('+v.label+'), cap '+wind(v.x-w.home.x,v.y-w.home.y)+' à '+metres(Math.hypot(v.x-w.home.x,v.y-w.home.y))+' de D-17 ; des infectés y sont terrés';
  }
  function intelQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(!state.spotted||state.fate==='destroyed')return{ok:false,reason:state.fate==='destroyed'?'Les Rouleurs ne sont plus : leurs renseignements sont perdus.':'Personne à qui acheter un renseignement.'};
   if(state.fate!=='rallied'&&!entente('rouleurs'))return{ok:false,reason:'Les Rouleurs ne vendent qu’en Entente.'};
   if(state.intel?.wave===wave())return{ok:false,reason:'Un renseignement par vague.'};
   const o=offer();if(!o)return{ok:false,reason:'Les Rouleurs n’ont rien de neuf à vendre.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   return C.canAfford(g.resources,R.intel.cost)?{ok:true,offer:o}:{ok:false,reason:'Stock insuffisant : '+bagText(R.intel.cost)+' exigés.'};
  }
  function buyIntel(){
   const q=intelQuote();if(!q.ok)return q;
   C.spend(g.resources,R.intel.cost);state.intel={...q.offer,wave:wave()};state.kept=wave();affair('rouleurs','intel',C.bagTotal(R.intel.cost));
   g.notify?.('Renseignement des Rouleurs, payé '+bagText(R.intel.cost)+' : '+intelText(state.intel)+'.','good');
   tickEntente();g.audio?.ui?.();g.save(false);return{ok:true,intel:{...state.intel}};
  }
  // Places libres autour du dépôt pour ceux qui arrivent : positions fixes, aucune n'est tirée.
  function spots(n){
   const core=g.core?.(),out=[];if(!core||typeof g.friendlyPositionClear!=='function')return out;
   const radius=C.SURVIVORS.soldier.radius;
   for(const r of [70,100,130,160])for(let i=0;i<12&&out.length<n;i++){
    const a=i*Math.PI/6,x=core.x+Math.cos(a)*r,y=core.y+Math.sin(a)*r;
    if(g.friendlyPositionClear({radius},x,y)&&!out.some(q=>Math.hypot(q.x-x,q.y-y)<radius*2+2))out.push({x,y});
   }
   return out;
  }
  function welcome(kind,n){
   const made=[];for(const s of spots(n)){const u=g.createProtectedSurvivor(kind,s.x,s.y);if(u)made.push(u);}
   if(made.length<n){g.units=g.units.filter(u=>!made.includes(u));return false;}
   g.refreshMetrics?.(true);return true;
  }
  const housed=n=>Number(g.population)+n<=Number(g.housing);
  function rallyQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(state.rally.stage!=='asked')return{ok:false,reason:'Les Rouleurs n’ont rien demandé : un ralliement se demande après une Entente tenue.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(!housed(R.rally.members))return{ok:false,reason:'Logements insuffisants : '+R.rally.members+' places libres requises.'};
   if(typeof g.createProtectedSurvivor!=='function'||spots(R.rally.members).length<R.rally.members)return{ok:false,reason:'Aucune place libre près du dépôt pour les accueillir.'};
   return C.canAfford(g.resources,R.rally.cost)?{ok:true}:{ok:false,reason:'Stock insuffisant : '+bagText(R.rally.cost)+' requis.'};
  }
  function rally(){
   const q=rallyQuote();if(!q.ok)return q;
   if(!welcome('soldier',R.rally.members))return{ok:false,reason:'Aucune place libre près du dépôt pour les accueillir.'};
   C.spend(g.resources,R.rally.cost);state.fate='rallied';state.rally={stage:'none',wave:0};state.passes=0;affair('rouleurs','rallied',R.rally.members);
   g.notify?.('Les Rouleurs rejoignent D-17 : '+R.rally.members+' fusiliers de plus, '+bagText(R.rally.cost)+' pris au stock. Plus aucun barrage sur la route du retour ; leurs éclaireurs vendent toujours ce qu’ils voient.','good');
   g.audio?.ui?.();g.save(false);return{ok:true};
  }
  // Assaut du repaire : en sortie, devant le repaire repéré, à pied. Prix fixe, annoncé, sans tirage.
  const losses=()=>R.assault.losses+(state.rep.rouleurs<=R.hostileAt?R.assault.alerted:0);
  // Section d'assaut : les fusiliers présents à D-17 ; les derniers arrivés tombent les premiers (ordre fixe).
  const cityFighters=()=>g.units.filter(u=>live(u)&&u.kind==='soldier'&&!u.regionAbsent).sort((a,b)=>b.id-a.id);
  function assaultQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(!state.spotted)return{ok:false,reason:'Personne ne sait encore qui vit là.'};
   if(!free())return{ok:false,reason:state.fate==='destroyed'?'Le repaire est déjà vide.':'Les Rouleurs vivent désormais à D-17.'};
   const l=lairOf('rouleurs');if(!l||!state.lairs.rouleurs)return{ok:false,reason:'Le repaire n’a pas été repéré.'};
   const f=g.frontier?.position?.();
   if(!f?.active||f.z!==0||Math.hypot(l.x-f.x,l.y-f.y)>l.radius+R.assault.reach)return{ok:false,reason:'L’assaut se décide en sortie, devant le repaire.'};
   if(f.car?.driving)return{ok:false,reason:'Descendez du véhicule.'};
   if(g.expansions.canAct?.()===false)return{ok:false,reason:'Pas maintenant.'};
   if(cityFighters().length<R.assault.soldiers)return{ok:false,reason:'Il faut '+R.assault.soldiers+' fusiliers à D-17 pour la section d’assaut.'};
   return C.canAfford(g.resources,R.assault.cost)?{ok:true,losses:losses()}:{ok:false,reason:'Stock insuffisant : '+bagText(R.assault.cost)+' pour la section.'};
  }
  function assault(){
   const q=assaultQuote();if(!q.ok)return q;
   const dead=new Set(cityFighters().slice(0,q.losses));
   C.spend(g.resources,R.assault.cost);g.units=g.units.filter(u=>!dead.has(u));
   state.fate='destroyed';state.passes=0;state.entente=null;state.rally={stage:'none',wave:0};state.noise=wave()+R.assault.noiseWaves-1;
   affair('rouleurs','stormed',q.losses);
   const got=credit(R.assault.cache);g.refreshMetrics?.(true);
   g.notify?.('Repaire des Rouleurs pris et vidé : '+bagText(R.assault.cost)+' brûlées, '+q.losses+' fusiliers tués. Les coups de feu ont porté : la cité s’entend de plus loin pendant '+R.assault.noiseWaves+' vagues. '+(C.bagTotal(got)>0?bagText(got)+' du repaire rentrent au dépôt. ':'')+'Plus de barrage, mais plus de tribut ni de renseignement : c’est définitif.','danger');
   g.audio?.ui?.();g.save(false);return{ok:true,losses:q.losses};
  }
  // Relais en Entente : un échange par vague, au dépôt.
  function tradeQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(!entente('relais'))return{ok:false,reason:'Les Relais n’échangent qu’en Entente.'};
   if(state.traded>=wave())return{ok:false,reason:'Un échange par vague.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(!C.canAfford(g.resources,R.exchange.give))return{ok:false,reason:'Stock insuffisant : '+bagText(R.exchange.give)+' à échanger.'};
   return room(R.exchange.get)?{ok:true}:{ok:false,reason:'Le dépôt n’a pas la place.'};
  }
  function trade(){
   const q=tradeQuote();if(!q.ok)return q;
   C.spend(g.resources,R.exchange.give);const got=credit(R.exchange.get);state.traded=wave();affair('relais','traded',C.bagTotal(got));
   g.notify?.('Échange avec les Relais : '+bagText(R.exchange.give)+' contre '+bagText(got)+'.','good');g.audio?.ui?.();g.save(false);return{ok:true};
  }
  function recruitQuote(){
   if(!active())return{ok:false,reason:NONE};
   if(state.recruit!=='offered')return{ok:false,reason:state.recruit==='taken'?'La recrue des Relais a déjà rejoint D-17.':'Les Relais ne proposent personne avant l’Entente.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(!housed(1))return{ok:false,reason:'Logements insuffisants.'};
   return typeof g.createProtectedSurvivor==='function'&&spots(1).length?{ok:true}:{ok:false,reason:'Aucune place libre près du dépôt.'};
  }
  function recruit(){
   const q=recruitQuote();if(!q.ok)return q;
   if(!welcome('worker',1))return{ok:false,reason:'Aucune place libre près du dépôt.'};
   state.recruit='taken';affair('relais','recruited',1);
   g.notify?.('Une recrue des Relais rejoint D-17 : un ouvrier de plus, une bouche de plus.','good');g.audio?.ui?.();g.save(false);return{ok:true};
  }
  const AFFAIRS={
   spotted:()=>'des motards ont suivi le fourgon jusqu’aux abords de la cité',
   robbed:a=>'fourgon intercepté, '+amount(a.amount)+' unités prises dans le coffre',
   deterred:()=>'barrage levé devant l’escorte, sans un tir',
   passed:()=>'barrage franchi, tribut honoré',
   guarded:()=>'pas de barrage, la route du retour est gardée par un avant-poste',
   tribute:a=>'tribut versé ('+amount(a.amount)+' carburant)',
   friendly:()=>'pas de barrage : Entente, le fourgon passe',
   intel:a=>'renseignement acheté ('+amount(a.amount)+' carburant)',
   stormed:a=>'repaire pris et vidé, '+a.amount+' fusiliers tués',
   rallied:a=>'ralliés à D-17, '+a.amount+' fusiliers de plus',
   rallyAsked:()=>'ils demandent à rejoindre D-17',
   decayed:()=>'rien reçu depuis '+R.entente.memory+' vagues, la relation se refroidit',
   asked:a=>request(a.amount).relay+' demande '+bagText(request(a.amount).ask),
   helped:a=>'aide envoyée '+to(request(a.amount).relay),
   returned:a=>request(a.amount).relay+' a tenu parole : '+bagText(request(a.amount).back)+' livrés',
   unanswered:a=>'la demande '+of(request(a.amount).relay)+' est restée sans réponse',
   traded:a=>'échange honoré, '+amount(a.amount)+' unités reçues',
   recruited:()=>'une recrue a rejoint D-17'
  };
  const lastAffair=id=>{const a=state.affairs[id];return a?'Vague '+a.wave+' : '+AFFAIRS[a.code](a)+'.':'Aucune affaire pour l’instant.';};
  const standingOf=id=>{
   if(id==='rouleurs'&&state.fate==='destroyed')return'Détruite';if(id==='rouleurs'&&state.fate==='rallied')return'Ralliée';
   return standing(id,state.rep[id],id!=='rouleurs'||state.spotted);
  };
  function roadLine(){
   const cost=tribute(),parade='Parade : '+RAID.escortSoldiers+' fusiliers près du fourgon tout au long du retour, hors des murs (une section envoyée sur la route ; la garnison des portes ne compte pas), ou tribut versé d’avance ('+bagText(cost)+'). Un coffre de moins de '+RAID.minCargo+' unités ne les intéresse pas.';
   if(state.fate==='destroyed')return'Route du retour libre : le repaire des Rouleurs a été vidé.';
   if(state.fate==='rallied')return'Route du retour libre : les Rouleurs vivent à D-17.';
   if(!state.spotted)return'Route du retour libre pour l’instant. Un fourgon qui rentre chargé finit par être remarqué.';
   const n=untilAmbush(state.returns),rule=state.rep.rouleurs<=R.hostileAt?RAID.hostile:RAID,when=n===1?'Barrage attendu au prochain retour chargé':'Barrage attendu dans '+n+' retours chargés';
   if(entente('rouleurs'))return'Entente : pas de barrage tant qu’elle tient (un tribut ou un renseignement acheté avant la vague '+(state.kept+R.entente.memory)+' la prolonge).';
   if(state.passes>0)return when+' ; tribut déjà versé, le fourgon passera.';
   return when+' : jusqu’à '+Math.round(rule.share*100)+' % du coffre, '+rule.maxLoss+' unités au plus, carburant d’abord. '+parade;
  }
  function relayLine(){
   const q=state.relay,req=request(q.index);
   if(q.stage==='open')return req.relay+' demande '+terms(req)+', '+RELAY.returnWaves+' vagues après le don. À donner au dépôt avant la fin de la vague '+(q.wave+RELAY.openWaves-1)+'.';
   if(q.stage==='owed')return req.relay+' doit '+bagText(req.back)+(wave()>=q.wave?' : livraison dès que le dépôt a la place.':' à la vague '+q.wave+'.');
   return'Prochaine demande attendue vers la vague '+Math.max(requestWave(q.index),wave())+'.';
  }
  function lairLine(id){
   const l=lairOf(id);
   if(!l)return'Aucun lieu compatible dans la région.';
   if(!state.lairs[id])return'Inconnu : il se repère en sortie, à '+metres(R.lair.spot)+'.';
   const w=world(),where=w?.home?' · cap '+wind(l.x-w.home.x,l.y-w.home.y)+' à '+metres(Math.hypot(l.x-w.home.x,l.y-w.home.y))+' de D-17':'';
   if(id==='relais')return l.title+where+'.';
   if(state.fate==='destroyed')return l.title+where+' · vidé, il reste vide.';
   if(state.fate==='rallied')return l.title+where+' · abandonné : ses occupants vivent à D-17.';
   return l.title+where+' · assaut possible en sortie, devant le repaire : '+R.assault.soldiers+' fusiliers de D-17 engagés, '+bagText(R.assault.cost)+', '+losses()+' tués, la cité s’entend de plus loin pendant '+R.assault.noiseWaves+' vagues. Définitif.';
  }
  function ententeLine(){
   const parts=[];
   if(state.fate==='destroyed')parts.push('Rouleurs : détruits, plus rien à attendre d’eux.');
   else if(state.fate==='rallied'||entente('rouleurs'))parts.push('Rouleurs : plus de barrage ; un renseignement par vague contre '+bagText(R.intel.cost)+(state.intel?' (dernier : '+intelText(state.intel)+')':'')+'.'+(state.rally.stage==='asked'?' Ils demandent à rejoindre D-17.':state.entente!==null&&state.fate==='free'?' Demande de ralliement possible à la vague '+(state.entente+R.rally.afterWaves)+' si l’Entente tient.':''));
   else parts.push('Rouleurs : en Entente, plus de barrage et un renseignement à acheter.');
   parts.push(entente('relais')?'Relais : un échange par vague ('+bagText(R.exchange.give)+' contre '+bagText(R.exchange.get)+')'+(state.recruit==='offered'?', une recrue proposée.':state.recruit==='taken'?', recrue accueillie.':'.'):'Relais : en Entente, un échange par vague et une recrue.');
   return parts.join(' ');
  }
  function overview(){
   if(!active())return{summary:'Cette campagne a commencé avant l’arrivée des factions : les routes de D-17 restent celles d’avant.',rows:[{label:'Factions',value:'Absentes de cette campagne'}]};
   return{summary:'Hors des murs, d’autres vivants. Ils sont peu nombreux et ne menacent jamais l’enceinte : ils pèsent sur les routes et sur la parole donnée.',
    rows:[{label:NAMES.rouleurs,value:state.spotted?standingOf('rouleurs')+' — bande motorisée qui vit du carburant des autres. Dernière affaire : '+lastAffair('rouleurs'):'Inconnue — personne n’a encore été vu sur les routes.'},
     {label:'Route du retour',value:roadLine()},
     {label:'Repaire des Rouleurs',value:lairLine('rouleurs')},
     {label:NAMES.relais,value:standingOf('relais')+' — hameaux alliés tenus par quelques familles. Dernière affaire : '+lastAffair('relais')},
     {label:'Demande des relais',value:relayLine()},
     {label:'Relais repéré',value:lairLine('relais')},
     {label:'Entente',value:ententeLine()}]};
  }
  function actions(){
   if(!active())return[];
   const list=[];
   if(state.relay.stage==='open'){const req=request(state.relay.index),q=helpQuote();list.push({id:'help',label:'Aider '+req.relay,description:'Don : '+bagText(req.ask)+', pris au stock. Contrepartie annoncée : '+bagText(req.back)+', '+RELAY.returnWaves+' vagues plus tard.',disabled:!q.ok,reason:q.reason||'L’entente avec les Relais progresse.',run:help});}
   if(state.spotted&&free()){const q=tributeQuote();list.push({id:'tribute',label:'Verser le tribut aux Rouleurs',description:'Coût : '+bagText(tribute())+', pris au stock (il suit l’âge de la cité et les vagues). Le prochain barrage laisse passer le fourgon, sans tir ni perte.',disabled:!q.ok,reason:q.reason||'Vaut pour un seul barrage.',run:payTribute});}
   if(state.spotted&&state.fate!=='destroyed'&&(state.fate==='rallied'||entente('rouleurs'))){const q=intelQuote();list.push({id:'intel',label:'Acheter un renseignement aux Rouleurs',description:'Coût : '+bagText(R.intel.cost)+'. La prochaine vague menée, sinon un lieu remarquable pas encore repéré. Un par vague.',disabled:!q.ok,reason:q.reason||'Entretient l’Entente.',run:buyIntel});}
   if(state.rally.stage==='asked'){const q=rallyQuote();list.push({id:'rally',label:'Accueillir les Rouleurs à D-17',description:R.rally.members+' fusiliers de plus, contre '+bagText(R.rally.cost)+' et '+R.rally.members+' logements. Plus de barrage ; définitif.',disabled:!q.ok,reason:q.reason||'Ralliement demandé par les Rouleurs.',run:rally});}
   const a=assaultQuote();
   if(a.ok||state.spotted&&free()&&state.lairs.rouleurs&&g.frontier?.active?.())list.push({id:'assault',label:'Attaquer le repaire des Rouleurs',description:'Prix payé trois fois : '+bagText(R.assault.cost)+' prises au stock, '+losses()+' fusiliers de la section tués, la cité s’entend de plus loin pendant '+R.assault.noiseWaves+' vagues (hordes plus nombreuses). Gain : plus aucun barrage et '+bagText(R.assault.cache)+' du repaire. Perte : plus de tribut, de renseignement ni de ralliement, définitivement.',disabled:!a.ok,reason:a.reason||'Définitif.',run:assault});
   if(entente('relais')){const q=tradeQuote();list.push({id:'trade',label:'Échanger avec les Relais',description:bagText(R.exchange.give)+' contre '+bagText(R.exchange.get)+'. Un échange par vague.',disabled:!q.ok,reason:q.reason||'Échange régulier de l’Entente.',run:trade});}
   if(state.recruit==='offered'){const q=recruitQuote();list.push({id:'recruit',label:'Accueillir la recrue des Relais',description:'Un ouvrier de plus, une seule fois. Il faut un logement libre.',disabled:!q.ok,reason:q.reason||'Proposée par les Relais en Entente.',run:recruit});}
   return list;
  }
  const economy=g.economyTick;
  g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  // Bruit de l'assaut : s'ajoute à la signature de la cité, comme les autres sources, pendant les vagues annoncées.
  const metrics=g.refreshMetrics;
  if(typeof metrics==='function')g.refreshMetrics=function(...args){const result=metrics.apply(this,args);if(active()&&state.noise>0&&wave()<=state.noise&&Number.isFinite(this.signature))this.signature+=R.assault.signature;return result;};
  // Repérage des repaires : suit la boucle de jeu, en sortie seulement.
  const update=g.update;
  if(typeof update==='function')g.update=function(dt,...rest){const result=update.call(g,dt,...rest),now=Number(g.elapsed)||0;if(now<clock||now-clock>=CHECK_SECONDS){clock=now;sight();}return result;};
  // --- Présentation : lit l'état ci-dessus, ne modifie rien. ---
  const safe=fn=>{try{fn();}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}};
  const COLORS={rouleurs:'#e09a6e',relais:'#b9d38f',gone:'#8b9488'};
  function marks(){
   if(!active())return[];
   return IDS.map(id=>{const l=state.lairs[id]?lairOf(id):null;if(!l)return null;
    const gone=id==='rouleurs'&&!free();
    return{id,x:l.x,y:l.y,color:gone?COLORS.gone:COLORS[id],text:(id==='rouleurs'?(state.fate==='destroyed'?'REPAIRE VIDÉ · ':state.fate==='rallied'?'REPAIRE ABANDONNÉ · ':'REPAIRE · '+(state.spotted?'Rouleurs · ':'')):'RELAIS · ')+l.title};}).filter(Boolean);
  }
  function badge(c,x,y,m,width){
   c.save();c.strokeStyle=m.color;c.fillStyle=m.color;c.lineWidth=2;
   c.beginPath();c.moveTo(x-7,y);c.lineTo(x,y-12);c.lineTo(x+7,y);c.closePath();c.stroke();c.beginPath();c.arc(x,y-5,2,0,Math.PI*2);c.fill();
   c.font='bold 12px system-ui, sans-serif';c.textAlign='center';const w=Math.min(width||Infinity,(c.measureText?.(m.text)?.width||m.text.length*7)+10),left=Math.max(4,Math.min((width||Infinity)-w-4,x-w/2));
   c.fillStyle='rgba(12,24,18,.86)';c.fillRect(left,y+3,w,17);c.fillStyle=m.color;c.fillText(m.text,left+w/2,y+16,w-6);c.restore();
  }
  function drawAtlas(c,cam){
   if(!active()||!c||!cam?.screen)return;
   for(const m of marks()){const q=cam.screen(m.x,m.y);if(q.x<-30||q.y<-30||q.x>cam.width+30||q.y>cam.height+30)continue;badge(c,q.x,q.y,m,cam.width);}
  }
  function drawRegion(){
   if(!active()||!g.frontier?.active?.()||g.state!=='playing'||!g.ctx)return;
   const list=marks();if(!list.length)return;
   const f=g.frontier.position(),s=g.frontier.scale(),c=g.ctx,W=g.width,H=g.height;
   c.save();c.setTransform?.(g.dpr||1,0,0,g.dpr||1,0,0);
   // Hors de l'écran, le repère se pose sur une ellipse autour du commandant, dans la direction du repaire (comme les lieux remarquables).
   const rx=W*.3,ry=H*.16;
   for(const m of list){
    const dx=m.x-f.x,dy=m.y-f.y;let x=W/2+dx*s,y=H/2+dy*s;
    if(Math.abs(dx*s)>=rx*.9||Math.abs(dy*s)>=ry*.9){if(Math.hypot(dx,dy)>R.lair.maxDistance)continue;const k=1/Math.max(1e-9,Math.hypot(dx/rx,dy/ry));x=W/2+dx*k;y=H/2+dy*k;}
    badge(c,x,y,{...m,text:m.text+' · '+metres(Math.hypot(dx,dy))},W);
   }
   c.restore();
  }
  if(doc||root.document){
   const render=g.render;
   if(typeof render==='function')g.render=function(...args){const result=render.apply(g,args);safe(drawRegion);return result;};
   const A=root.DeadwallAtlasRender;
   if(A&&typeof A.render==='function'&&!A.__factions217){
    const base=A.render;A.__factions217=true;
    A.render=function(c,game,v,cam,...rest){const result=base.call(this,c,game,v,cam,...rest);if(game?.factions217)safe(()=>game.factions217.drawAtlas(c,cam));return result;};
   }
  }
  // Carte du panneau de droite : lecture seule de l'état ci-dessus.
  doc=doc||root.document;
  let card=null,key='';
  function mount(){
   const host=doc?.getElementById?.('rightPanel');if(!host||typeof doc.createElement!=='function')return null;
   const el=(tag,text,cls)=>{const node=doc.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
   const box=el('section',undefined,'siege-readout factions217');box.id='factions217Card';box.setAttribute?.('aria-label','Factions hors de D-17');
   const parts={};
   for(const id of IDS){const art=el('article',undefined,'siege-readout-card'),title=el('h3'),last=el('p'),note=el('p',undefined,'siege-readout-effect');
    title.id='factions217-'+id;art.append(el('small',id==='rouleurs'?'FACTIONS · PILLARDS':'FACTIONS · ALLIÉS'),title,last,note);box.append(art);parts[id]={title,last,note};}
   const anchor=doc.getElementById('siegeReadout'),next=anchor&&anchor.parentNode===host?anchor.nextSibling:host.firstChild;
   if(next&&typeof host.insertBefore==='function')host.insertBefore(box,next);else host.appendChild(box);
   return{box,parts};
  }
  function render(){
   if(!card)card=mount();if(!card)return false;
   const show=active()&&g.state==='playing';card.box.hidden=!show;if(!show)return false;
   const lines={rouleurs:[(state.spotted?NAMES.rouleurs:'Sur les routes')+' · '+standingOf('rouleurs'),'Dernière affaire — '+lastAffair('rouleurs'),roadLine()],relais:[NAMES.relais+' · '+standingOf('relais'),'Dernière affaire — '+lastAffair('relais'),relayLine()]};
   const now=JSON.stringify(lines);if(now===key)return true;key=now;
   for(const id of IDS){const p=card.parts[id];p.title.textContent=lines[id][0];p.last.textContent=lines[id][1];p.note.textContent=lines[id][2];}
   return true;
  }
  const updateUI=g.updateUI;
  if(typeof updateUI==='function')g.updateUI=function(...args){const result=updateUI.apply(this,args);render();return result;};
  const forget=()=>{clock=-Infinity;fenceCache=null;key='';};
  const api=Object.freeze({active,standing:standingOf,reputation:id=>state.rep[id],lastAffair,returns:()=>state.returns,passes:()=>state.passes,request:()=>state.relay.stage==='none'?null:{...request(state.relay.index),stage:state.relay.stage,wave:state.relay.wave},
   lair:id=>{const l=active()&&IDS.includes(id)?lairOf(id):null;return l?{...l,sighted:state.lairs[id]}:null;},fate:()=>state.fate,approach,escortCount:v=>escort(v),outside,tributeCost:tribute,
   helpQuote,help,tributeQuote,tribute:payTribute,intelQuote,buyIntel,rallyQuote,rally,assaultQuote,assault,tradeQuote,trade,recruitQuote,recruit,
   tick,sight,render,overview,actions,marks,drawAtlas,drawRegion,snapshot:()=>validate(state)});g.factions217=api;
  g.expansions.register({id:'factions217',title:'Factions',overview,actions,validate,snapshot:api.snapshot,restore:raw=>{state=validate(raw);forget();},reset:()=>{state=fresh();forget();}});
  return api;
 }
 const api=Object.freeze({IDS:Object.freeze([...IDS]),initial,validate,standing,ambushAt,untilAmbush,toll,tributeCost,lairs,request,requestWave,install});root.DeadwallFactions217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL,root.document);
})(globalThis);
