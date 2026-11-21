/* Avant-postes et routes gardées (docs/GAME_BIBLE.md §7.14), troisième tranche, NOUVELLES campagnes seulement.
   - Avant-poste : décidé au dépôt de D-17, sur un lieu régional déjà vu, vidé de ses occupants et relié par la route.
     Des fusiliers quittent la cité et un coût est pris au stock. Aucun plafond par âge : la limite est celle des
     hommes et du stock (seul un plafond technique borne le registre). Fait sauvegardé.
   - Entretien : à chaque intervalle de vagues, en phase calme, la garnison est ravitaillée au dépôt. Non
     ravitaillée, elle ne garde plus sa route et n'envoie pas de convoi jusqu'au prochain ravitaillement payé.
   - Route gardée : l'itinéraire routier existant (frontier-routing) entre D-17 et l'avant-poste, tant qu'il tient.
     Elle garde le côté de D-17 où se trouve l'avant-poste (axe dominant), pas le tracé exact : l'itinéraire reste
     indicatif. Effets sur des systèmes existants : un fourgon qui rentre de ce côté n'est pas barré par les Rouleurs ;
     le budget de retour du Commandant (return-routes) par l'accès de ce côté ne compte plus de marge de détour.
   - Convoi : à chaque intervalle de vagues, en phase calme, un lot borné du butin RÉEL du lieu arrive au dépôt contre
     du carburant. Il est prélevé dans le registre régional par `g.frontier.takeFromSite` : mêmes contenants et mêmes
     gardes que la fouille à la main. Ce que le Commandant a pris n'est plus au convoi, et inversement.
     Le convoi est une ligne du registre : aucun acteur simulé.
   - Rangs (troisième tranche) : Relais → Poste → Avant-poste, chacun par un chantier décidé sur place, en sortie, payé au
     dépôt et mené par la garnison pendant une durée de jeu (suspendu tant qu'elle n'est pas ravitaillée). Chaque rang
     agrandit le convoi, étend la portée radio autour du lieu, rend la garnison plus solide et rend le lieu plus bruyant.
   - Signature : pendant une sortie, chaque avant-poste fait du bruit par l'écoute existante des hordes régionales
     (`g.worldEvolution.hear`) : les migrations et meutes proches s'orientent vers lui. Aucune règle de mouvement nouvelle.
   - Chute : une migration vivante qui passe à portée d'un avant-poste, hors de vue du Commandant, le fait tomber si son
     effectif dépasse ce que tient la garnison (fusiliers × rang, moitié si elle n'est pas ravitaillée). Règle lue sur des
     nombres, sans tirage. Tombé : la garnison est tuée (pertes d'équipiers ordinaires), la route n'est plus gardée et le
     lieu se réinfeste — un lieu remarquable par son propre repeuplement (remarkable217, qui ne repeuple pas un lieu
     tenu), un lieu ordinaire par de nouveaux occupants du registre régional, à la suite des siens (frontier, frontier-state).
     Annoncé, et relayé par la radio de cité (city-radio217) quand le Commandant est à portée.
   - État v3. Un état v2 est converti (rang Relais, aucun chantier, aucune chute) ; un état v1 passe par la conversion v2 :
     l'avant-poste garde son lieu et repart sur le butin réel restant.
   - Radio : hors de portée de D-17 et de tout avant-poste, la radio de cité se tait (crochet lu par city-radio217).
   Aucun hasard, aucun flux de génération tiré, monde inchangé. Une campagne commencée avant cette règle n'a rien de
   tout cela. Reste à faire : états de route, « une bonne route sert aussi l'ennemi », vagues menées et factions
   contre un avant-poste. */
(function(root){'use strict';
 const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
 const C=need('DeadwallCore','./core.js'),Routing=need('DeadwallFrontierRouting','./frontier-routing.js'),G=need('DeadwallFrontierGeometry','./frontier-geometry.js');
 const R=C.Outposts217Rules,CONVOY=R.convoy,UPKEEP=R.upkeep,RANKS=R.ranks,TOP=RANKS.length-1,FALL=R.fall;
 const ID=/^P\d{4}$/,GROUP=/^W\d{4}$/,KEYS=['version','active','posts','fallen','reinfested'],KEYS_V2=['version','active','posts'];
 const POST_V2=['id','garrison','founded','convoy','hauled','note','sent'],POST=[...POST_V2,'rank','work'],WORK=['rank','left'],FALLEN=['id','wave','by','rank'];
 const NOTES=['held','delivered','nofuel','full','empty','unfed'],MAX_WAVE=1e6,MAX_POSTS=R.limits.posts,MAX_HAULED=R.limits.hauled,OFFERS=6;
 // Réglages techniques, sans effet sur l'équilibrage : cadence du relevé des hordes, borne des lieux réinfestés.
 const CHECK_SECONDS=.25,MAX_SITES=4096;
 // Bornes de l'état v1, gardées pour valider puis convertir une sauvegarde de la première tranche.
 const V1=Object.freeze({notes:Object.freeze(['held','delivered','nofuel','full','empty']),posts:3,hold:160,lot:16});
 const SIDE=Object.freeze({east:'est',west:'ouest',north:'nord',south:'sud'});
 function initial(){return{version:3,active:false,posts:[],fallen:[],reinfested:{}};}
 function fresh(){return{...initial(),active:true};}
 const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
 const exact=(o,keys)=>Boolean(o)&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.prototype.hasOwnProperty.call(o,k));
 const plain=o=>Boolean(o)&&typeof o==='object'&&!Array.isArray(o);
 function validate(raw,full){
  if(raw===undefined)return initial();
  const bad=()=>{throw Error('Avant-postes 217 invalides.');};
  if(!plain(raw)||![1,2,3].includes(raw.version)||!exact(raw,raw.version===3?KEYS:KEYS_V2)||typeof raw.active!=='boolean'||!Array.isArray(raw.posts))bad();
  const v=raw.version,old=v===1,notes=old?V1.notes:NOTES,each=old?V1.hold:MAX_HAULED;
  if(raw.posts.length>(old?V1.posts:MAX_POSTS)||!raw.active&&raw.posts.length)bad();
  const seen=full?.frontier?.seen,ledger=full?.frontier?.enemies,taken=full?.frontier?.taken;
  const posts=raw.posts.map((p,i)=>{
   if(!exact(p,v===3?POST:POST_V2))bad();
   // v3 : rang et chantier en cours ; un état v1 ou v2 n'en a pas et repart au rang Relais.
   let rank=0,work=null;
   if(v===3){
    if(!int(p.rank,0,TOP))bad();rank=p.rank;
    if(p.work!==null){const x=p.work;if(!exact(x,WORK)||x.rank!==rank+1||!int(x.rank,1,TOP)||typeof x.left!=='number'||!Number.isFinite(x.left)||!(x.left>0)||x.left>RANKS[x.rank].seconds)bad();work={rank:x.rank,left:x.left};}
   }
   const lotMax=old?V1.lot:RANKS[rank].lot;
   if(typeof p.id!=='string'||!ID.test(p.id)||i&&!(raw.posts[i-1].id<p.id)||p.garrison!==R.garrison||!int(p.founded,0,MAX_WAVE)||!int(p.convoy,p.founded,MAX_WAVE)
    ||!notes.includes(p.note)||typeof p.sent!=='number'||!Number.isFinite(p.sent)||p.sent<0||p.sent>lotMax||!exact(p.hauled,C.RESOURCE_KEYS))bad();
   const hauled=C.makeBag();
   for(const k of C.RESOURCE_KEYS){const n=p.hauled[k];if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>each)bad();hauled[k]=n;}
   if(old&&C.bagTotal(hauled)>V1.hold+1e-6)bad();
   // Un avant-poste se tient sur un lieu vu, dont au moins un occupant est tombé dans le registre de la même sauvegarde.
   if(Array.isArray(seen)&&!seen.includes(p.id))bad();
   if(ledger&&!Object.keys(ledger).some(id=>ledger[id]===0&&id.startsWith(p.id+':e')))bad();
   // v1 → v3 : le lieu, la garnison et les vagues sont gardés ; le compte de l'ancien fonds dérivé est abandonné.
   if(old)return{id:p.id,garrison:p.garrison,founded:p.founded,convoy:p.convoy,hauled:C.makeBag(),note:'held',sent:0,rank:0,work:null};
   // v2 et v3 : tout ce qu'un convoi a rapporté a été écrit dans les prélèvements du lieu, dans la même sauvegarde.
   if(taken&&typeof taken==='object'){let sum=0;for(const id of Object.keys(taken))if(id.startsWith(p.id+':')&&Number.isFinite(taken[id]))sum+=taken[id];if(C.bagTotal(hauled)>sum+1e-6)bad();}
   return{id:p.id,garrison:p.garrison,founded:p.founded,convoy:p.convoy,hauled,note:p.note,sent:p.sent,rank,work};
  });
  // Chutes (journal borné, dans l'ordre des vagues) et occupants ramenés dans des lieux ordinaires : v3 seulement.
  const fallen=[],reinfested={};
  if(v===3){
   if(!Array.isArray(raw.fallen)||raw.fallen.length>R.limits.fallen)bad();
   raw.fallen.forEach((f,i)=>{if(!exact(f,FALLEN)||typeof f.id!=='string'||!ID.test(f.id)||typeof f.by!=='string'||!GROUP.test(f.by)||!int(f.wave,0,MAX_WAVE)||!int(f.rank,0,TOP)||i&&raw.fallen[i-1].wave>f.wave)bad();fallen.push({id:f.id,wave:f.wave,by:f.by,rank:f.rank});});
   if(!plain(raw.reinfested)||Object.keys(raw.reinfested).length>MAX_SITES)bad();
   for(const id of Object.keys(raw.reinfested).sort()){const n=raw.reinfested[id];if(!ID.test(id)||!int(n,1,R.limits.reinfest)||Array.isArray(seen)&&!seen.includes(id))bad();reinfested[id]=n;}
   if(!raw.active&&(fallen.length||Object.keys(reinfested).length))bad();
  }
  return{version:3,active:raw.active,posts,fallen,reinfested};
 }
 // Occupants ramenés dans un lieu ordinaire, lus dans un état brut (sauvegarde) : entier borné, sinon zéro. Lu par frontier-state.
 function reinfested(raw,id){
  const box=raw&&raw.active===true&&raw.version===3&&plain(raw.reinfested)?raw.reinfested:null;
  const n=box&&Object.prototype.hasOwnProperty.call(box,id)?box[id]:0;
  return int(n,1,R.limits.reinfest)?n:0;
 }
 // Effectif qu'une migration donnée installe dans un lieu donné : fonction pure (hachage), jamais un tirage.
 const reinfestCount=(seed,site,group)=>FALL.reinfest.min+G.hash(seed,site,group,'outpost217')%(FALL.reinfest.max-FALL.reinfest.min+1);
 // Ce que tient une garnison : fusiliers × perRifle × solidité du rang, moitié (unfed) si elle n'est pas ravitaillée.
 const holds=(garrison,rank,fed)=>Math.round(garrison*FALL.perRifle*RANKS[rank].hold*(fed?1:FALL.unfed));
 // Ouverture : âge minimal seulement (indice de C.CITY_TIERS). Au-delà, aucun plafond par âge.
 const open=age=>Number.isInteger(age)&&age>=R.startAge;
 // Côté de D-17 par lequel une direction sort : axe dominant, est et sud positifs comme à l'écran.
 const sideOf=(dx,dy)=>Math.abs(dx)>=Math.abs(dy)?(dx>=0?'east':'west'):(dy>=0?'south':'north');
 // Lot d'un convoi : au plus `cap` unités (celles du rang) de ce qui reste, dans l'ordre des ressources, sans dépasser la place du dépôt.
 function lot(left,room,cap=CONVOY.lot){
  const bag=C.makeBag();let free=cap,total=0;
  for(const k of C.RESOURCE_KEYS){const n=Math.max(0,Math.min(free,left[k]||0,room(k)));bag[k]=n;free-=n;total+=n;}
  return{bag,total};
 }
 const title=p=>String(p?.name||'').split(' · ')[0].split(' — ')[0];
 const metres=d=>d>=1000?(d/1000).toFixed(1).replace('.',',')+' km':Math.round(d)+' m';
 const amount=n=>(Math.round(n*10)/10).toLocaleString('fr-FR');
 const scale=(bag,n)=>{const out=C.makeBag();for(const k of Object.keys(bag))out[k]=bag[k]*n;return out;};
 const bagText=bag=>C.RESOURCE_KEYS.filter(k=>bag[k]>0).map(k=>amount(bag[k])+' '+C.RESOURCE_META[k].label.toLowerCase()).join(', ');
 const live=u=>u&&!u.dead&&u.health>0;
 // « de » élidé devant une voyelle ou un h muet : « avant-poste d’Entrepôt… ».
 const of=name=>(/^[aeiouyhàâéèêëîïôöûü]/i.test(name)?'d’':'de ')+name;
 const seconds=s=>s>=60?Math.floor(s/60)+' min'+(Math.round(s%60)?' '+Math.round(s%60)+' s':''):Math.ceil(s)+' s';
 function install(g,doc){
  if(g.outposts217)return g.outposts217;if(!g.expansions)throw Error('Installer les opérations avant les avant-postes 217.');
  let state=initial(),memo=new WeakMap(),clock=0,loud=[];
  // En mémoire seulement : migrations qui ont passé un avant-poste qui a tenu (annoncées une fois), vague de l'annonce.
  let passed=new Map();
  const forget=()=>{memo=new WeakMap();clock=0;loud=[];passed=new Map();};
  const active=()=>state.active&&Boolean(g.frontier);
  const world=()=>g.frontier.world(),age=()=>g.tier?.id||0,wave=()=>int(g.wave,0,MAX_WAVE)?g.wave:0;
  // Par monde : lieux par identifiant et itinéraires déjà calculés. Rien n'est écrit dans le monde.
  // Monde sans bord O4 : index par identifiant lu par l'accesseur du monde (dernier doublon, comme une Map) ; repli identique.
  function book(){const w=world();let b=memo.get(w);if(!b){b={by:typeof w.siteIndex==='function'?w.siteIndex():new Map(w.pois.map(p=>[p.id,p])),routes:new Map()};memo.set(w,b);}return b;}
  const site=id=>book().by.get(id)||null;
  function routeOf(id){
   const b=book();if(b.routes.has(id))return b.routes.get(id);
   const w=world(),p=site(id);let r=null;
   try{if(p&&w.home){const found=Routing.route(w,{x:w.home.x,y:w.home.y},p);if(found)r={metres:found.metres,path:found.path.map(q=>({x:q.x,y:q.y})),side:sideOf(p.x-w.home.x,p.y-w.home.y)};}}catch(error){r=null;}
   b.routes.set(id,r);return r;
  }
  const post=id=>state.posts.find(p=>p.id===id)||null;
  const fed=p=>p.note!=='unfed';
  const defence=p=>holds(p.garrison,p.rank,fed(p));
  // Butin réel du lieu, lu chez son propriétaire : `free` est prenable, `locked` attend une clé, un scellé ou un arrêt de groupe.
  const NO_STOCK=()=>({free:C.makeBag(),locked:C.makeBag()});
  const stockOf=id=>{try{return g.frontier.siteStock?.(id)||NO_STOCK();}catch(error){return NO_STOCK();}};
  const leftOf=p=>stockOf(p.id).free;
  const stockText=s=>(C.bagTotal(s.free)>1e-9?bagText(s.free):'rien à prendre')+(C.bagTotal(s.locked)>1e-9?' (sous clé : '+bagText(s.locked)+')':'');
  const marked=id=>{try{return g.remarkable217?.active?.()?g.remarkable217.list().find(v=>v.id===id)||null:null;}catch(error){return null;}};
  // Occupants ramenés dans un lieu ordinaire après une chute : à la suite des siens dans le registre régional.
  const extraOf=id=>state.active&&Object.prototype.hasOwnProperty.call(state.reinfested,id)?state.reinfested[id]:0;
  // Vidé : nid d'un lieu remarquable s'il en est un, sinon tous les occupants d'un lieu infesté, ramenés compris.
  function emptied(p){
   const mark=marked(p.id);
   if(mark)return mark.state!=='nest';
   if(p.occupation!=='infected')return false;
   const n=world().threatCount(p);if(!(n>0))return false;
   for(let i=0,all=n+extraOf(p.id);i<all;i++)if(g.frontier.enemyHealth(p.id+':e'+i)!==0)return false;
   return true;
  }
  const soldiers=()=>{const core=g.core?.();return g.units.filter(u=>live(u)&&u.kind==='soldier'&&!u.regionAbsent).sort((a,b)=>(core?Math.hypot(a.x-core.x,a.y-core.y)-Math.hypot(b.x-core.x,b.y-core.y):0)||a.id-b.id);};
  function atDepot(){
   const core=g.core?.(),f=g.frontier?.position?.();
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('outposts217')&&!(g.player.reload>0)&&!g.selectedBuild&&!g.fieldcraft?.context?.().mounted&&!f?.active&&!g.expeditions?.driving?.()&&core&&g.workerCanWorkAt(g.player,core,R.reach));
  }
  // Sur place : en sortie, au sol, à `works.reach` mètres du lieu (au-delà de son emprise).
  const reachOf=s=>R.works.reach+Math.max(Number(s?.w)||0,Number(s?.h)||0)/2;
  function onSite(id){
   const f=g.frontier?.position?.(),s=site(id);
   return Boolean(g.expansions.canAct()&&!g.expansions.busy('outposts217')&&f?.active&&f.z===0&&s&&Math.hypot(s.x-f.x,s.y-f.y)<=reachOf(s));
  }
  const DEPOT='Décidez-le au dépôt de D-17, à pied et les mains libres.',NONE='Cette campagne ne connaît pas les avant-postes.';
  function foundQuote(id){
   if(!active())return{ok:false,reason:NONE};
   if(!open(age()))return{ok:false,reason:'Il faut une cité d’âge « '+C.CITY_TIERS[R.startAge].name+' » pour tenir un avant-poste.'};
   const p=typeof id==='string'&&ID.test(id)?site(id):null;
   if(!p||!g.frontier.discoveries().includes(id))return{ok:false,reason:'Ce lieu n’a pas été visité.'};
   if(post(id))return{ok:false,reason:'Un avant-poste tient déjà ce lieu.'};
   if(state.posts.length>=MAX_POSTS)return{ok:false,reason:'Le registre des avant-postes est plein ('+MAX_POSTS+').'};
   if(p.occupation==='allied')return{ok:false,reason:'Ce lieu est tenu par un relais allié.'};
   if(!emptied(p))return{ok:false,reason:'Le lieu doit d’abord être vidé de ses occupants.'};
   const route=routeOf(id);if(!route)return{ok:false,reason:'Aucune route ne relie ce lieu à D-17.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(soldiers().length<R.garrison)return{ok:false,reason:'Il faut '+R.garrison+' fusiliers présents dans la cité pour la garnison.'};
   if(!C.canAfford(g.resources,R.cost))return{ok:false,reason:'Stock insuffisant : '+bagText(R.cost)+' requis.'};
   return{ok:true,route};
  }
  function found(id){
   const q=foundQuote(id);if(!q.ok)return q;
   const leaving=new Set(soldiers().slice(0,R.garrison));
   C.spend(g.resources,R.cost);g.units=g.units.filter(u=>!leaving.has(u));g.refreshMetrics?.(true);
   state.posts.push({id,garrison:R.garrison,founded:wave(),convoy:wave(),hauled:C.makeBag(),note:'held',sent:0,rank:0,work:null});state.posts.sort((a,b)=>a.id<b.id?-1:1);
   g.notify?.('Avant-poste établi : '+title(site(id))+'. '+R.garrison+' fusiliers quittent la cité ; la route qui y mène ('+metres(q.route.metres)+') est désormais gardée, côté '+SIDE[q.route.side]+' de D-17.','good');
   g.audio?.ui?.();g.save?.(false);return{ok:true};
  }
  // Places libres autour du dépôt pour les hommes qui rentrent : positions fixes, aucune n'est tirée.
  function spots(n){
   const core=g.core?.(),out=[];if(!core||typeof g.friendlyPositionClear!=='function')return out;
   const radius=C.SURVIVORS.soldier.radius;
   for(const r of [70,100,130,160])for(let i=0;i<12&&out.length<n;i++){
    const a=i*Math.PI/6,x=core.x+Math.cos(a)*r,y=core.y+Math.sin(a)*r;
    if(g.friendlyPositionClear({radius},x,y)&&!out.some(q=>Math.hypot(q.x-x,q.y-y)<radius*2+2))out.push({x,y});
   }
   return out;
  }
  const NO_ROOM='Aucune place libre près du dépôt pour les hommes qui rentrent.';
  function abandonQuote(id){
   if(!active())return{ok:false,reason:NONE};
   const p=post(id);if(!p)return{ok:false,reason:'Aucun avant-poste sur ce lieu.'};
   if(!atDepot())return{ok:false,reason:DEPOT};
   if(typeof g.createProtectedSurvivor!=='function'||spots(p.garrison).length<p.garrison)return{ok:false,reason:NO_ROOM};
   return{ok:true};
  }
  function abandon(id){
   const q=abandonQuote(id);if(!q.ok)return q;
   const p=post(id),back=[];
   for(const s of spots(p.garrison)){const u=g.createProtectedSurvivor('soldier',s.x,s.y);if(u)back.push(u);}
   if(back.length<p.garrison){g.units=g.units.filter(u=>!back.includes(u));return{ok:false,reason:NO_ROOM};}
   state.posts=state.posts.filter(e=>e!==p);g.refreshMetrics?.(true);
   g.notify?.('Avant-poste abandonné : '+title(site(id))+'. '+p.garrison+' fusiliers rentrent à D-17 ; la route n’est plus gardée et les convois cessent. Le coût d’établissement est perdu.');
   g.audio?.ui?.();g.save?.(false);return{ok:true};
  }
  // --- Rangs : chantier décidé sur place, payé au dépôt, mené par la garnison. ---
  const effects=r=>'convoi de '+RANKS[r].lot+' unités, radio à '+metres(RANKS[r].radio)+', garnison qui tient contre '+holds(R.garrison,r,true)+' infectés, bruit porté à '+metres(RANKS[r].signature);
  function rankQuote(id){
   if(!active())return{ok:false,reason:NONE};
   const p=post(id);if(!p)return{ok:false,reason:'Aucun avant-poste sur ce lieu.'};
   if(p.rank>=TOP)return{ok:false,reason:'Rang le plus haut atteint : '+RANKS[TOP].name+'.'};
   if(p.work)return{ok:false,reason:'Chantier en cours : rang '+RANKS[p.work.rank].name+' dans '+seconds(p.work.left)+'.'};
   if(!fed(p))return{ok:false,reason:'Garnison non ravitaillée : rien ne monte par une route qui n’est plus gardée.'};
   const s=site(id);if(!onSite(id))return{ok:false,reason:'Le chantier se décide sur place, en sortie, à '+metres(reachOf(s))+' au plus de '+title(s)+'.'};
   const next=RANKS[p.rank+1];
   if(!C.canAfford(g.resources,next.cost))return{ok:false,reason:'Stock du dépôt insuffisant : '+bagText(next.cost)+' requis.'};
   return{ok:true,rank:p.rank+1};
  }
  function rankUp(id){
   const q=rankQuote(id);if(!q.ok)return q;
   const p=post(id),next=RANKS[q.rank];
   C.spend(g.resources,next.cost);p.work={rank:q.rank,left:next.seconds};
   g.notify?.('Chantier ouvert à '+title(site(id))+' : rang '+next.name+'. '+bagText(next.cost)+' partent du dépôt par la route gardée ; la garnison bâtit pendant '+seconds(next.seconds)+', tant qu’elle est ravitaillée.','good');
   g.audio?.ui?.();g.save?.(false);return{ok:true};
  }
  function works(dt){
   let changed=false;
   for(const p of state.posts){
    if(!p.work||!fed(p))continue;
    p.work.left-=dt;if(p.work.left>1e-9)continue;
    p.rank=p.work.rank;p.work=null;changed=true;
    g.notify?.(title(site(p.id))+' passe au rang '+RANKS[p.rank].name+' : '+effects(p.rank)+'.','good');
   }
   return changed;
  }
  // --- Chute : une migration à portée, hors de vue du Commandant, contre ce que tient la garnison. ---
  function groups(){
   let list=null;try{list=g.worldEvolution?.overview?.().groups;}catch(error){list=null;}
   return Array.isArray(list)?list.filter(h=>h&&typeof h.id==='string'&&GROUP.test(h.id)&&h.alive>0&&Number.isFinite(h.x)&&Number.isFinite(h.y)):[];
  }
  function fall(p,h,s){
   const name=title(s),rank=p.rank,held=defence(p),seed=world().seed;
   state.posts=state.posts.filter(e=>e!==p);
   // Pertes : comptées comme toute perte d'équipier ; les fusiliers avaient déjà quitté la population de la cité.
   if(g.stats&&Number.isFinite(g.stats.unitsLost))g.stats.unitsLost+=p.garrison;
   state.fallen.push({id:p.id,wave:wave(),by:h.id,rank});while(state.fallen.length>R.limits.fallen)state.fallen.shift();
   let back;
   if(marked(p.id))back='Le nid n’est plus tenu : une migration qui passe peut de nouveau le peupler.';
   else{
    const n=Math.min(reinfestCount(seed,p.id,h.id),R.limits.reinfest-extraOf(p.id));
    if(n>0){state.reinfested[p.id]=extraOf(p.id)+n;back=n+' infectés de la migration s’installent dans le lieu.';}
    else back='Le lieu n’est plus tenu.';
   }
   g.refreshMetrics?.(true);
   g.notify?.('Avant-poste tombé : '+name+' ('+RANKS[rank].name+'). Une migration de '+Math.round(h.alive)+' infectés a submergé la garnison, qui tenait contre '+held+(fed(p)?'':' faute de ravitaillement')+'. '+p.garrison+' fusiliers tués ; la route n’est plus gardée, plus de convoi. '+back,'danger');
  }
  function watch(){
   loud=[];
   if(!g.frontier.active?.()||!state.posts.length)return false;
   const list=groups();if(!list.length)return false;
   const f=g.frontier.position(),w=wave();let changed=false;
   for(const p of [...state.posts]){
    const s=site(p.id);if(!s)continue;
    // Signature : avant-postes dont le bruit porte jusqu'à une horde en marche (rayon de l'écoute existante, × 1,6).
    if(list.some(h=>h.kind!=='resting'&&Math.hypot(h.x-s.x,h.y-s.y)<RANKS[p.rank].signature*1.6))loud.push(p.id);
    if(f&&Math.hypot(s.x-f.x,s.y-f.y)<=FALL.unseen)continue;
    const near=list.filter(h=>h.kind==='migrating'&&Math.hypot(h.x-s.x,h.y-s.y)<=FALL.range).sort((a,b)=>b.alive-a.alive||(a.id<b.id?-1:1));
    if(!near.length)continue;
    const h=near[0];
    if(h.alive>defence(p)){fall(p,h,s);loud=loud.filter(id=>id!==p.id);changed=true;continue;}
    const key=p.id+':'+h.id;
    if(!passed.has(key)){passed.set(key,{id:p.id,by:h.id,wave:w,alive:Math.round(h.alive)});g.notify?.('Une migration de '+Math.round(h.alive)+' infectés passe à '+title(s)+' : la garnison ('+RANKS[p.rank].name+') tient, elle tient contre '+defence(p)+'.','good');}
   }
   return changed;
  }
  // Bruit : chaque image de sortie, par l'écoute existante des hordes ; seulement les avant-postes relevés comme entendus.
  function signal(){
   if(!active()||!loud.length||!g.frontier.active?.())return 0;
   const E=g.worldEvolution;if(typeof E?.hear!=='function')return 0;
   let n=0;for(const id of loud){const p=post(id),s=site(id);if(p&&s){E.hear({x:s.x,y:s.y,z:0,inside:null},RANKS[p.rank].signature);n++;}}
   return n;
  }
  // Convoi : une ligne par avant-poste et par intervalle, en phase calme. Livre au dépôt, paie en carburant.
  function tickPost(p,w){
   if(w<p.convoy+CONVOY.everyWaves)return false;
   const name=title(site(p.id)),was=p.note;
   p.convoy=w;p.sent=0;
   // Entretien de la garnison : payé d'abord. Impayé, la route n'est plus gardée et aucun convoi ne part.
   if(!C.canAfford(g.resources,UPKEEP)){p.note='unfed';if(was!=='unfed')g.notify?.('Avant-poste de '+name+' non ravitaillé : il faut '+bagText(UPKEEP)+' au dépôt à chaque vague. Sa route n’est plus gardée et son convoi ne part pas.','danger');return true;}
   C.spend(g.resources,UPKEEP);
   if(was==='unfed')g.notify?.('Avant-poste de '+name+' de nouveau ravitaillé : sa route est gardée.','good');
   const stock=stockOf(p.id),left=stock.free;
   if(!(C.bagTotal(left)>1e-9)){p.note='empty';if(was!=='empty')g.notify?.('Convoi : il ne reste rien à prendre à '+name+(C.bagTotal(stock.locked)>1e-9?' hors ce qui est sous clé ('+bagText(stock.locked)+')':'')+'. Plus de convoi tant que rien n’y est ouvert ; la garnison garde toujours la route.');return true;}
   if(!(g.resources.fuel>=CONVOY.fuel)){p.note='nofuel';g.notify?.('Convoi de '+name+' resté sur place : il faut '+CONVOY.fuel+' carburant au dépôt pour le faire rouler.','danger');return true;}
   const cap=RANKS[p.rank].lot,load=lot(left,k=>Math.max(0,g.storage-g.resources[k]),cap);
   if(!(load.total>1e-9)){p.note='full';g.notify?.('Convoi de '+name+' resté sur place : le dépôt n’a pas la place.');return true;}
   g.resources.fuel-=CONVOY.fuel;
   // Prélèvement chez le propriétaire du registre régional : seul ce qui a réellement quitté le lieu entre au dépôt.
   const got=C.makeBag();let sent=0;
   for(const k of C.RESOURCE_KEYS){if(!(load.bag[k]>0))continue;const n=g.frontier.takeFromSite(p.id,k,load.bag[k]);got[k]=n;g.resources[k]+=n;p.hauled[k]=Math.min(MAX_HAULED,p.hauled[k]+n);sent+=n;}
   p.sent=Math.min(cap,sent);
   const after=stockOf(p.id),rest=C.bagTotal(after.free),done=!(rest>1e-9);
   p.note=done?'empty':'delivered';
   g.notify?.('Convoi de '+name+' arrivé seul par la route gardée : '+bagText(got)+' au dépôt, '+CONVOY.fuel+' carburant brûlé. '+(done?'Il ne reste rien à prendre sur place'+(C.bagTotal(after.locked)>1e-9?' hors ce qui est sous clé':'')+' : c’était le dernier convoi.':'Reste sur place : '+amount(rest)+'.'),'good');
   return true;
  }
  function tick(dt){
   if(!active()||!(dt>0)||g.state!=='playing'||g.gameOver||!state.posts.length)return;
   let changed=works(dt);
   // Relevé des hordes à cadence fixe du temps de jeu (technique) ; les hordes ne marchent qu'en sortie.
   clock+=dt;if(clock>=CHECK_SECONDS-1e-9){clock=0;changed=watch()||changed;}
   if(g.phase==='calm'){const w=wave();for(const p of state.posts)changed=tickPost(p,w)||changed;}
   if(changed)g.save?.(false);
  }
  // Route gardée : nom de l'avant-poste qui tient le côté par lequel ce point local revient vers le dépôt.
  function guards(point){
   if(!active()||!state.posts.length||!point)return null;
   const core=g.core?.();if(!core||!Number.isFinite(point.x)||!Number.isFinite(point.y))return null;
   return guardsGate(sideOf(point.x-core.x,point.y-core.y));
  }
  // Même lecture par accès de D-17 (east, west, north, south), pour le budget de retour du Commandant.
  function guardsGate(side){
   if(!active()||!state.posts.length||!SIDE[side])return null;
   for(const p of state.posts){const r=fed(p)&&routeOf(p.id);if(r&&r.side===side)return title(site(p.id));}
   return null;
  }
  const roads=()=>active()?state.posts.map(p=>{const r=routeOf(p.id),s=site(p.id);return r&&s?{id:p.id,name:title(s),x:s.x,y:s.y,side:r.side,metres:r.metres,guarded:fed(p),rank:p.rank,path:r.path.map(q=>({...q}))}:null;}).filter(Boolean):[];
  // Portée radio : vraie hors région, à portée de D-17 ou d'un avant-poste (portée de son rang) ; sans limite pour une ancienne campagne.
  function radioInRange(){
   if(!active())return true;
   const f=g.frontier.position();if(!f?.active)return true;
   const w=world(),near=(q,range)=>Math.hypot(q.x-f.x,q.y-f.y)<=range;
   if(!w.home||near(w.home,R.radio.range))return true;
   return state.posts.some(p=>{const s=site(p.id);return s&&near(s,RANKS[p.rank].radio);});
  }
  // Faits lus par la radio de cité pendant une sortie : chutes et passages tenus de la vague en cours.
  function radioFacts(){
   if(!active())return[];
   const w=wave(),out=[];
   for(const f of state.fallen)if(f.wave===w)out.push({key:'outpostfall:'+f.id+':'+f.wave+':'+f.by,level:1,tone:'danger',text:'Avant-poste '+of(title(site(f.id)))+' tombé sous une migration : la garnison ne répond plus, la route n’est plus gardée.'});
   for(const e of passed.values())if(e.wave===w&&post(e.id))out.push({key:'outposthold:'+e.id+':'+e.by,level:1,tone:'good',text:'Avant-poste '+of(title(site(e.id)))+' : une migration de '+e.alive+' infectés est passée, la garnison a tenu.'});
   return out;
  }
  const NOTE_TEXT={held:()=>'premier convoi à la prochaine accalmie',delivered:p=>'dernier convoi : '+amount(p.sent)+' unités livrées (vague '+p.convoy+')',
   nofuel:p=>'convoi resté sur place faute de carburant (vague '+p.convoy+')',full:p=>'convoi resté sur place, dépôt plein (vague '+p.convoy+')',empty:()=>'plus rien à prendre, plus de convoi',
   unfed:p=>'garnison non ravitaillée (vague '+p.convoy+'), pas de convoi'};
  function line(p){
   const r=routeOf(p.id),stock=stockOf(p.id),left=stock.free,locked=C.bagTotal(stock.locked)>1e-9?' (sous clé : '+bagText(stock.locked)+')':'';
   return RANKS[p.rank].name+' · '+p.garrison+' fusiliers en garnison · route '+(r?(p.note==='unfed'?'non gardée':'gardée')+' côté '+SIDE[r.side]+', '+metres(r.metres):'coupée')+' · reste sur place : '+(C.bagTotal(left)>1e-9?bagText(left):'rien')+locked+' · '+NOTE_TEXT[p.note](p)+'.'
    +' Tient contre une migration de '+defence(p)+' infectés'+(fed(p)?'':' (moitié, faute de ravitaillement)')+'.'+(p.work?' Chantier : rang '+RANKS[p.work.rank].name+' dans '+seconds(p.work.left)+(fed(p)?'':', suspendu')+'.':'');
  }
  function candidates(){
   const w=world(),out=[];
   for(const id of g.frontier.discoveries()){const p=site(id);if(!p||post(id)||p.occupation==='allied'||!emptied(p))continue;out.push({p,d:w.home?Math.hypot(p.x-w.home.x,p.y-w.home.y):0});}
   return out.sort((a,b)=>a.d-b.d||(a.p.id<b.p.id?-1:1)).slice(0,OFFERS).map(c=>c.p);
  }
  function overview(){
   if(!state.active)return{summary:'Cette campagne a commencé avant cette règle : elle n’a ni avant-poste, ni route gardée, ni convoi. La règle ne s’active pas en cours de campagne.',
    rows:[{label:'Avant-postes',value:'Sans objet.'},{label:'Routes gardées',value:'Sans objet.'}]};
   const n=state.posts.length,rows=[{label:'Avant-postes',value:open(age())?(n?n+' tenu'+(n>1?'s':'')+' : '+n*R.garrison+' fusiliers hors de la cité, '+bagText(scale(UPKEEP,n))+' par vague.':'Aucun.')+' Pas de plafond : la limite est celle des hommes et du stock.':'Aucun avant l’âge « '+C.CITY_TIERS[R.startAge].name+' ».'}];
   if(g.frontier)for(const p of state.posts)rows.push({label:title(site(p.id)),value:line(p)});
   rows.push({label:'Établir',value:'Au dépôt, sur un lieu visité, vidé de ses occupants et relié par la route : '+R.garrison+' fusiliers quittent la cité, '+bagText(R.cost)+' pris au stock.'},
    {label:'Route gardée',value:'Un avant-poste garde le côté de D-17 où il se trouve : un fourgon qui rentre de ce côté n’est pas barré par les Rouleurs, et le budget de retour par l’accès de ce côté ne compte plus de marge de détour.'},
    {label:'Entretien',value:(CONVOY.everyWaves>1?'Toutes les '+CONVOY.everyWaves+' vagues':'À chaque vague')+', en phase calme : '+bagText(UPKEEP)+' du dépôt par avant-poste. Non ravitaillée, une garnison ne garde plus sa route et n’envoie pas de convoi.'},
    {label:'Convoi',value:(CONVOY.everyWaves>1?'Toutes les '+CONVOY.everyWaves+' vagues':'À chaque vague')+', en phase calme : '+CONVOY.lot+' unités au plus du butin réel du lieu (plus selon le rang), contre '+CONVOY.fuel+' carburant du dépôt. Ce que vous y avez pris à la main n’y est plus ; ce qui est sous clé reste sur place.'},
    {label:'Rangs',value:RANKS.map((r,i)=>r.name+(i?' (sur place, '+bagText(r.cost)+' du dépôt, '+seconds(r.seconds)+' de chantier)':' (à l’établissement)')+' : '+effects(i)).join(' — ')+'. Un chantier ne progresse que si la garnison est ravitaillée.'},
    {label:'Chute',value:'Une migration qui passe à '+metres(FALL.range)+' d’un avant-poste, hors de vue du Commandant, le fait tomber si elle compte plus d’infectés que la garnison n’en tient (moitié faute de ravitaillement). Les fusiliers sont tués, la route n’est plus gardée et le lieu se réinfeste.'},
    {label:'Signature',value:'En sortie, chaque avant-poste fait du bruit : les migrations et les meutes qui l’entendent obliquent vers lui. Il les détourne de leur route… et s’expose à elles.'},
    {label:'Radio',value:'Portée : '+metres(R.radio.range)+' autour de D-17, et autour de chaque avant-poste selon son rang ('+RANKS.map(r=>r.name+' '+metres(r.radio)).join(', ')+'). Au-delà, silence.'});
   if(state.fallen.length)rows.push({label:'Tombés',value:state.fallen.slice(-3).reverse().map(f=>title(site(f.id))+' ('+RANKS[f.rank].name+', vague '+f.wave+')').join(' · ')+'.'});
   return{summary:'Un avant-poste immobilise des hommes, de la nourriture et du carburant ; en échange, sa route est gardée et un convoi rentre seul tant que le lieu a quelque chose à donner. Il peut tomber.',rows};
  }
  function actions(){
   if(!active())return[];
   const out=[];
   for(const p of state.posts){const q=abandonQuote(p.id);out.push({id:'abandon-'+p.id,label:'Abandonner l’avant-poste : '+title(site(p.id)),description:p.garrison+' fusiliers rentrent à D-17. La route n’est plus gardée, les convois cessent, le coût d’établissement est perdu.',disabled:!q.ok,reason:q.reason||'Les hommes sont rendus à la cité.',run:()=>abandon(p.id)});
    if(p.rank<TOP){const r=rankQuote(p.id),next=RANKS[p.rank+1];out.push({id:'rank-'+p.id,label:'Monter au rang '+next.name+' : '+title(site(p.id)),description:'Sur place : '+bagText(next.cost)+' du dépôt, '+seconds(next.seconds)+' de chantier. Ensuite : '+effects(p.rank+1)+'.',disabled:!r.ok,reason:r.reason||'La garnison bâtit tant qu’elle est ravitaillée.',run:()=>rankUp(p.id)});}}
   if(open(age())&&state.posts.length<MAX_POSTS)for(const p of candidates()){const q=foundQuote(p.id);
    out.push({id:'found-'+p.id,label:'Établir un avant-poste : '+title(p),description:'Coût : '+R.garrison+' fusiliers et '+bagText(R.cost)+', puis '+bagText(UPKEEP)+' par vague. Butin du lieu : '+stockText(stockOf(p.id))+'.'+(q.route?' Route de '+metres(q.route.metres)+', côté '+SIDE[q.route.side]+' de D-17.':''),disabled:!q.ok,reason:q.reason||'La route devient gardée ; un convoi rentre à chaque accalmie.',run:()=>found(p.id)});}
   return out;
  }
  const economy=g.economyTick;
  if(typeof economy==='function')g.economyTick=function(dt,...rest){const result=economy.call(this,dt,...rest);tick(dt);return result;};
  // Bruit à chaque image de sortie, après la simulation de l'image : il oriente les hordes à l'image suivante.
  const step=g.update;
  if(typeof step==='function')g.update=function(dt,...rest){const result=step.call(this,dt,...rest);if(g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay)signal();return result;};
  // --- Présentation : lit `roads()`, ne modifie rien. ---
  const safe=fn=>{try{fn();}catch(error){/* un affichage facultatif ne bloque jamais le jeu */}};
  const COLOR='#8fd0c0';
  function flag(c,x,y,text,width){
   c.save();c.strokeStyle=COLOR;c.fillStyle=COLOR;c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-18);c.stroke();
   c.beginPath();c.moveTo(x,y-18);c.lineTo(x+11,y-14);c.lineTo(x,y-10);c.closePath();c.fill();
   if(text){c.font='bold 12px system-ui, sans-serif';c.textAlign='center';const w=Math.min(width||Infinity,(c.measureText?.(text)?.width||text.length*7)+10),left=Math.max(4,Math.min((width||Infinity)-w-4,x-w/2));
    c.fillStyle='rgba(12,24,18,.86)';c.fillRect(left,y+3,w,17);c.fillStyle=COLOR;c.fillText(text,left+w/2,y+16,w-6);}
   c.restore();
  }
  const tag=r=>RANKS[r.rank].name.toUpperCase()+' · '+r.name;
  function drawAtlas(c,cam){
   if(!active()||!c||!cam?.screen)return;
   for(const r of roads()){
    c.save();c.strokeStyle=r.guarded?'rgba(143,208,192,.8)':'rgba(143,208,192,.28)';c.lineWidth=2.5;c.setLineDash?.([10,6]);c.beginPath();
    r.path.forEach((p,i)=>{const q=cam.screen(p.x,p.y);if(i)c.lineTo(q.x,q.y);else c.moveTo(q.x,q.y);});c.stroke();c.setLineDash?.([]);c.restore();
    const q=cam.screen(r.x,r.y);if(q.x<-30||q.y<-30||q.x>cam.width+30||q.y>cam.height+30)continue;
    flag(c,q.x,q.y,tag(r),cam.width);
   }
  }
  function drawRegion(){
   if(!active()||!g.frontier.active()||g.state!=='playing'||!g.ctx||!state.posts.length)return;
   const f=g.frontier.position(),s=g.frontier.scale(),c=g.ctx,W=g.width,H=g.height;
   c.save();c.setTransform?.(g.dpr||1,0,0,g.dpr||1,0,0);
   for(const r of roads()){const x=W/2+(r.x-f.x)*s,y=H/2+(r.y-f.y)*s;if(x<0||y<0||x>W||y>H)continue;flag(c,x,y,tag(r),W);}
   c.restore();
  }
  if(doc||root.document){
   const render=g.render;
   if(typeof render==='function')g.render=function(...args){const result=render.apply(g,args);safe(drawRegion);return result;};
   const A=root.DeadwallAtlasRender;
   if(A&&typeof A.render==='function'&&!A.__outposts217){
    const base=A.render;A.__outposts217=true;
    A.render=function(c,game,v,cam,...rest){const result=base.call(this,c,game,v,cam,...rest);if(game?.outposts217)safe(()=>game.outposts217.drawAtlas(c,cam));return result;};
   }
  }
  const api=Object.freeze({active:()=>state.active,open:()=>open(age()),posts:()=>state.posts.map(p=>({...p,hauled:{...p.hauled},work:p.work?{...p.work}:null,name:title(site(p.id)),left:leftOf(p),holds:defence(p)})),candidates:()=>active()?candidates().map(p=>p.id):[],
   stock:id=>active()&&site(id)?stockOf(id):null,foundQuote,found,abandonQuote,abandon,rankQuote,rankUp,tick,watch,signal,loud:()=>[...loud],guards,guardsGate,roads,radioInRange,radioFacts,
   siteExtra:(w,p)=>p&&typeof p.id==='string'?extraOf(p.id):0,fallen:()=>state.fallen.map(f=>({...f})),overview,actions,drawAtlas,drawRegion,snapshot:()=>validate(state)});g.outposts217=api;
  g.expansions.register({id:'outposts217',title:'Avant-postes',overview,actions,validate,snapshot:api.snapshot,
   restore:raw=>{state=validate(raw);forget();},reset:()=>{state=fresh();forget();}});
  return api;
 }
 const api=Object.freeze({initial,fresh,validate,reinfested,reinfestCount,holds,open,sideOf,lot,install});root.DeadwallOutposts217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL,root.document);
})(globalThis);
