/* Ouverture « Sans bord — expérimental » (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/ouverture.md, tranche O9).
   Une campagne NOUVELLE, créée avec l'option de menu « MONDE : Sans bord — expérimental », joue la génération 12 : cité de
   192 m adossée née de sa graine (src/world-local217.js), monde régional sans bord fait de cantons (src/world-sites217.js),
   sauvegarde creuse (src/world-save217.js). La région finie reste le défaut ; une campagne lancée sans l'option ne lit rien
   de ce module (aucune clé de sauvegarde, aucun tirage, aucun monde chargé).
   - `region(graine, effets)` : façade du monde régional G12 pour frontier-world.create(…, 12) : monde O2 plus les accesseurs
     que la boucle régionale lit sur la région finie (préparation d'un canton par image, routes et relief à peindre autour de
     la vue, eau pour la faune), le cadre de la cité comme `home`.
   - `home(graine)` : cadre de la cité de 192 m dans le repère régional (fonction pure de la graine et de la révision de la cité).
   - Révisions (D-O4 tranché : « le visité reste ») : `engines` garde côte à côte les moteurs figés des révisions passées
     (générateur de cantons, monde régional, lieux, carte locale) ; une campagne reprise sous une autre révision lit ses cantons
     vus et sa cité dans le moteur de la révision sous laquelle ils ont été vus, les cantons jamais vus dans le moteur courant.
     La sauvegarde ne garde que des bornes : `eras` = [{revision, from}] (rang du premier canton vu sous chaque révision dans le
     registre `cantons` du monde régional, qui ne fait que s'allonger) ; aucun contenu de canton n'est sauvegardé.
   - Module d'extension `openworld217` : marque la campagne « expérimentale » et porte la révision du générateur avec
     laquelle elle a été créée (D-O4, « évoluer, puis geler ») ; une campagne d'une autre révision reste jouable, signalée
     « monde révisé ». `reset()` n'active le module que sur l'option ; `validate(undefined)` = campagne sans l'option.
   Présentation (`paint`) : lit les cantons déjà chargés, ne crée ni stock, ni dégât, ni tirage, ni horloge. */
(function(root){'use strict';
 const node=typeof require==='function';
 const need=(name,file)=>root[name]||(node?require(file):null);
 const C=need('DeadwallCore','./core.js');
 const R=C.OpenWorld217Rules;
 const K=()=>need('DeadwallWorldCantons217','./world-cantons217.js');
 const Gen=()=>need('DeadwallWorldCantonGen217','./world-canton-gen217.js');
 const L=()=>need('DeadwallWorldLocal217','./world-local217.js');
 const Sites=()=>need('DeadwallWorldSites217','./world-sites217.js');
 const Save=()=>need('DeadwallWorldSave217','./world-save217.js');
 const finite=(x,y)=>Number.isFinite(x)&&Number.isFinite(y);
 // Les quatre modules de la génération 12 sont présents et la sauvegarde G12 est ouverte.
 function available(){try{return!!(K()&&Gen()&&L()?.describe&&Sites()?.create&&Save()?.opened?.());}catch{return false;}}
 // Révision du générateur : versions des règles qui décident du monde et de la cité d'une graine G12.
 function revision(){return{open:R.revision,canton:Gen().RULES.version,relief:C.WorldRelief217Rules.version,sites:C.WorldSites217Rules.version,local:L().RULES.version};}
 const REVISION_KEYS=Object.freeze(['open','canton','relief','sites','local']);
 const sameRevision=(a,b)=>REVISION_KEYS.every(k=>a?.[k]===b?.[k]);
 const keyOf=v=>REVISION_KEYS.map(k=>v[k]).join('.');
 const revisionOK=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===REVISION_KEYS.length&&REVISION_KEYS.every(k=>Number.isInteger(v[k])&&v[k]>=1&&v[k]<=1e6);

 // --- Moteurs des révisions passées (D-O4) ----------------------------------------------------
 // Un moteur figé = les quatre modules d'une révision : { revision, Gen, Open, Sites, Local } (copies gelées des modules de
 // cette révision, avec leurs règles). Le moteur courant est celui des modules chargés ; il ne s'enregistre pas.
 const engines=new Map();
 function register(engine){
  const e=engine||{},v=e.revision;
  if(!revisionOK(v))throw Error('Révision de moteur invalide.');
  if(typeof e.Gen?.generate!=='function'||typeof e.Open?.create!=='function'||typeof e.Sites?.create!=='function'||typeof e.Local?.describe!=='function')throw Error('Moteur de révision incomplet.');
  const key=keyOf(v);if(engines.has(key)||available()&&key===keyOf(revision()))throw Error('Moteur de révision déjà connu : '+key+'.');
  engines.set(key,Object.freeze({key,revision:Object.freeze(Object.fromEntries(REVISION_KEYS.map(k=>[k,v[k]]))),Gen:e.Gen,Open:e.Open,Sites:e.Sites,Local:e.Local}));
  return true;
 }
 const ENGINES=Object.freeze({register,keys:()=>[...engines.keys()],has:v=>revisionOK(v)&&engines.has(keyOf(v))});

 // Liaison de la campagne en cours : quel moteur lit chaque canton vu sous une révision passée, et la cité. null = tout courant
 // (campagne de la révision courante, ou campagne sans bord absente) : le monde est alors construit exactement comme avant.
 let bound=null;
 const eraList=st=>[{revision:st.revision,from:0},...(st.eras||[])];
 function bind(st,cantons,seed){
  if(!st?.active||!st.revision||!Array.isArray(cantons)||!available())return null;
  const cur=keyOf(revision()),eras=eraList(st);if(eras.every(e=>keyOf(e.revision)===cur))return null;
  const byCanton=new Map(),missing=new Set();let era=0;
  for(let i=0;i<cantons.length;i++){
   while(era+1<eras.length&&eras[era+1].from<=i)era++;
   const key=keyOf(eras[era].revision);if(key===cur)continue;const e=engines.get(key);if(e)byCanton.set(cantons[i],e);else missing.add(key);
  }
  const k0=keyOf(st.revision),own=k0===cur?null:engines.get(k0)||null;if(k0!==cur&&!own)missing.add(k0);
  if(!byCanton.size&&!own)return Object.freeze({seed,key:null,city:null,byCanton,missing:Object.freeze([...missing]),kept:0});
  const key=seed+'|'+(own?own.key:'')+'|'+[...byCanton].map(([id,e])=>id+'='+e.key).join(',');
  return Object.freeze({seed,key,city:own,byCanton,missing:Object.freeze([...missing]),kept:byCanton.size});
 }
 const boundTo=seed=>bound&&bound.seed===seed&&bound.key?bound:null;
 // Carte locale de la cité d'une campagne liée à une révision passée (null sinon : la cité est celle du moteur courant).
 const cities=new Map();
 function city(seed,link=boundTo(seed)){
  const b=link;if(!b?.city)return null;const key=seed+'|'+b.city.key;
  if(!cities.has(key)){cities.set(key,b.city.Local.describe(seed));if(cities.size>2)cities.delete(cities.keys().next().value);}
  return cities.get(key);
 }

 // Cadre de la cité dans le repère régional : origine de la carte locale dans son canton, plus le coin du canton.
 const frames=new Map();
 function home(seed,link=boundTo(seed)){
  const own=link?.city,key=own?seed+'|'+own.key:seed;
  if(frames.has(key))return frames.get(key);
  const d=own?city(seed,link):L().describe(seed),c=K().parse(d.canton),b=K().bounds(c.cx,c.cy),size=d.frame,minX=b.x+d.origin.x,minY=b.y+d.origin.y;
  const h=Object.freeze({x:minX+size/2,y:minY+size/2,size,minX,minY,maxX:minX+size,maxY:minY+size,canton:d.canton,site:d.site});
  frames.set(key,h);if(frames.size>4)frames.delete(frames.keys().next().value);return h;
 }

 // Milieu d'une maille de canton sous la forme d'un échantillon de src/biomes135.js (lu par le sol et les codex).
 function biomeSample(def){return Object.freeze({id:def.id,name:def.name,primary:def.id,secondary:def.id,blend:0,weights:Object.freeze({[def.id]:1}),treeChance:def.treeChance,rockChance:def.rockChance,decorChance:def.decorChance,def,palette:def.palette,ground:def.ground,surface:def.surface,temperature:.5,moisture:.5,elevation:.5,fertility:.5,urban:0});}

 // Façade régionale G12. Chaque réponse reste une fonction pure de (graine, arguments) ; la préparation par anneau ne fait
 // qu'avancer le moment où un canton est construit (T5.2 : au plus `prefetch.perFrame` canton par image).
 // `link` : liaison de révision (D-O4, `bind`) ; par défaut, celle de la campagne en cours pour cette graine.
 function region(seed,effects={},link=boundTo(seed)){
  if(!available())throw Error('Monde sans bord indisponible dans cette version.');
  const k=K(),G=Gen(),frame=home(seed,link),CELL=G.CELL,N=G.CELLS;
  // D-O4 : un canton vu sous une révision passée est lu, mobilier compris, dans un monde de cette révision (un par moteur) ;
  // les autres dans le monde courant. Sans liaison, le monde est créé exactement comme avant.
  let w;
  if(link&&link.byCanton.size){
   const worlds=new Map(),of=e=>{let x=worlds.get(e.key);if(!x){x=e.Sites.create(seed,{});if(!x.engine217)throw Error('Moteur de révision sans mobilier par canton.');worlds.set(e.key,x);}return x;};
   const pick=(cx,cy)=>link.byCanton.get(k.id(cx,cy))||null;
   w=Sites().create(seed,{effects,open:{generate:(cx,cy)=>{const e=pick(cx,cy);return e?of(e).canton(cx,cy):undefined;}},foreign:(kx,ky)=>{const e=pick(kx,ky);return e?of(e).engine217:null;}});
  }else w=Sites().create(seed,{effects});
  const DEFS=[...C.BiomeRules135.defs,...C.EcologyRules164.defs],BY=new Map(DEFS.map(d=>[d.id,d])),samples=new Map();
  // Cantons préparés (lieux comptés) : ceux de l'anneau gardé autour du dernier point préparé.
  const ready=new Set(),stats={prefetched:0,frames:0};
  function prefetch(x,y,count=R.prefetch.perFrame){
   if(!finite(x,y)||!w.contains(x,y))return 0;stats.frames++;
   const c=k.at(x,y);for(const id of [...ready]){const p=k.parse(id);if(Math.max(Math.abs(p.cx-c.cx),Math.abs(p.cy-c.cy))>k.RULES.keepRadius)ready.delete(id);}
   let done=0;for(const q of k.ring(c.cx,c.cy,R.prefetch.radius)){if(done>=count)break;if(ready.has(q.id))continue;w.placesOf(q.cx,q.cy);ready.add(q.id);done++;stats.prefetched++;}
   return done;
  }
  // Mailles et routes du rectangle de vue, sur les cantons qu'il touche (bornés : une vue, jamais la région).
  function cantonsIn(l,t,r,b){if(![l,t,r,b].every(Number.isFinite)||r-l>4096||b-t>4096)return[];const a=k.at(Math.max(w.axisMin(),l),Math.max(w.axisMin(),t)),z=k.at(Math.min(w.axisMax(),r),Math.min(w.axisMax(),b)),out=[];for(let cy=a.cy;cy<=z.cy;cy++)for(let cx=a.cx;cx<=z.cx;cx++)out.push(w.canton(cx,cy));return out;}
  function roadsIn(view){
   const out=[];for(const c of cantonsIn(view.l??view.left,view.t??view.top,view.r??view.right,view.b??view.bottom))for(const r of c.roads){const pts=r.points||[];for(let i=1;i<pts.length;i++)out.push({id:r.id+':'+i,a:pts[i-1],b:pts[i],width:r.width,kind:r.class});}
   return out;
  }
  function biomeAt(x,y){
   if(!finite(x,y)||!w.contains(x,y))return null;const c=w.cantonAt(x,y),gx=Math.floor((x-c.bounds.x)/CELL),gy=Math.floor((y-c.bounds.y)/CELL),id=G.BIOMES[c.biomes[gy*N+gx]];
   if(!samples.has(id)){const def=BY.get(id);samples.set(id,def?biomeSample(def):null);}return samples.get(id);
  }
  // Point de route le plus proche sur le tracé des routes (et non sur les centres de maille de 32 m) des cantons voisins du point
  // (anneau de 3 × 3 cantons) : même forme que la région finie, `road` portant le segment local {a, b} et la largeur. Les
  // segments de chaque canton sont rangés par cases de `BIN` mètres ; la recherche s'arrête au premier anneau de cases plus
  // lointain que le meilleur segment trouvé (même résultat que le parcours complet, l'égalité gardant l'ordre canonique).
  const BIN=64,segments=new Map();
  function segmentsOf(c){
   let e=segments.get(c.id);if(e){segments.delete(c.id);segments.set(c.id,e);return e;}
   const bins=new Map();let order=0;
   for(const r of c.roads){const p=r.points||[];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],seg={a,b,r,order:order++};
    for(let by=Math.floor(Math.min(a.y,b.y)/BIN);by<=Math.floor(Math.max(a.y,b.y)/BIN);by++)for(let bx=Math.floor(Math.min(a.x,b.x)/BIN);bx<=Math.floor(Math.max(a.x,b.x)/BIN);bx++){const key=bx+','+by;let l=bins.get(key);if(!l)bins.set(key,l=[]);l.push(seg);}}}
   e={bins,count:order};segments.set(c.id,e);while(segments.size>64)segments.delete(segments.keys().next().value);return e;
  }
  function nearestRoad(point){
   if(!point||!finite(point.x,point.y)||!w.contains(point.x,point.y))return null;
   const c=k.at(point.x,point.y),near=[];
   for(let cy=c.cy-1;cy<=c.cy+1;cy++)for(let cx=c.cx-1;cx<=c.cx+1;cx++){const t=w.canton(cx,cy),e=segmentsOf(t);if(e.count)near.push({rank:(cy-c.cy+1)*3+(cx-c.cx+1),bins:e.bins});}
   if(!near.length)return null;
   const bx=Math.floor(point.x/BIN),by=Math.floor(point.y/BIN),maxRing=Math.ceil(2*k.SIZE/BIN)+1;let best=null;
   const consider=(seg,rank)=>{const a=seg.a,b=seg.b,dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/l)):0,x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(point.x-x,point.y-y);
    if(!best||d<best.d||d===best.d&&(rank<best.rank||rank===best.rank&&seg.order<best.seg.order))best={x,y,d,seg,rank};};
   for(let ring=0;ring<=maxRing;ring++){
    if(best&&best.d<=(ring-1)*BIN)break;
    for(let y=by-ring;y<=by+ring;y++)for(let x=bx-ring;x<=bx+ring;x++){if(Math.max(Math.abs(x-bx),Math.abs(y-by))!==ring)continue;const key=x+','+y;for(const n of near){const l=n.bins.get(key);if(l)for(const seg of l)consider(seg,n.rank);}}
   }
   if(!best)return null;const r=best.seg.r;
   return{x:best.x,y:best.y,d:best.d,road:{id:r.id,class:r.class,width:r.width,a:best.seg.a,b:best.seg.b}};
  }
  // Segments plus longs que `WorldSites217Rules.maxLine` (une vue, un tir ou un pas lointains, entre deux points d'une sortie) :
  // le monde sans bord les refuse ; la boucle régionale, écrite pour la région finie, les lit comme une ligne obstruée.
  const longSafe=fn=>(...a)=>{try{return fn(...a);}catch(error){if(/Segment régional trop long/.test(error?.message))return false;throw error;}};
  const facade={...w,line:longSafe(w.line),movementLine:longSafe(w.movementLine),lineOfSight:longSafe(w.lineOfSight),wildlifeWaterLine:longSafe((a,b,r)=>w.line(a,b,0,null,null,r,'movement')),nearestRoad,
   home:frame,foundationHome:w.home,landscape189:'classic',ecologyVersion:0,hydrologyVersion:0,hydrology:null,hydrologyAt:()=>null,
   biomeAt,prefetch,roadsIn,cantonsIn,
   wildlifeWaterClear:(x,y,r)=>!w.blocked(x,y,r,0,null,null,false,true),
   cacheSize:()=>w.streamStats().size,planCacheSize:()=>w.streamStats().planCache,binding217:link?link.key:null,
   prefetchStats:()=>({...stats,ready:ready.size})};
  return facade;
 }

 // --- Peinture du relief régional (présentation seule) -------------------------------------------
 const LEVEL=['#4d5d48','#5d6c4f','#6c7955','#7b865d','#8b9366','#9a9f70'];
 const WATER_COLOR={1:'#3e5f6b',2:'#46697a',3:'#4f7686',4:'#5a8190'};
 function paint(c,world,view,{map=false}={}){
  if(!world?.unbounded||typeof world.cantonsIn!=='function')return false;
  const G=Gen(),CELL=G.CELL,N=G.CELLS,l=view.l,t=view.t,r=view.r,b=view.b;c.save();
  for(const k of world.cantonsIn(l,t,r,b)){
   const x0=Math.max(0,Math.floor((l-k.bounds.x)/CELL)),x1=Math.min(N-1,Math.floor((r-k.bounds.x)/CELL)),y0=Math.max(0,Math.floor((t-k.bounds.y)/CELL)),y1=Math.min(N-1,Math.floor((b-k.bounds.y)/CELL));
   for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){
    const i=gy*N+gx,x=k.bounds.x+gx*CELL,y=k.bounds.y+gy*CELL,water=k.water[i];
    c.globalAlpha=map?.8:.38;c.fillStyle=water?WATER_COLOR[water]||WATER_COLOR[1]:LEVEL[Math.max(0,Math.min(LEVEL.length-1,k.levels[i]))];c.fillRect(x,y,CELL+.05,CELL+.05);
   }
  }
  // Arêtes de falaise : trait sombre et ombre portée du côté bas (rampes exclues par edgesIn).
  c.globalAlpha=1;
  for(const e of world.edgesIn?.(l,t,r,b)||[]){
   const low=e.before<e.after?-1:1,ox=e.axis==='v'?low*1.4:0,oy=e.axis==='v'?0:low*1.4;
   c.strokeStyle='rgba(18,22,16,.45)';c.lineWidth=map?2.4:2.8;c.beginPath();c.moveTo(e.a.x+ox,e.a.y+oy);c.lineTo(e.b.x+ox,e.b.y+oy);c.stroke();
   c.strokeStyle=e.ramp?'#b7a676':'#2a2c25';c.lineWidth=map?1.4:.9;c.beginPath();c.moveTo(e.a.x,e.a.y);c.lineTo(e.b.x,e.b.y);c.stroke();
  }
  c.restore();return true;
 }

 // --- Module d'extension ----------------------------------------------------------------------
 // Forme 1 : {version:1, active, revision} (révision de création, jamais reprise sous une autre). Forme 2, écrite seulement
 // après une reprise sous une autre révision : {version:2, active:true, revision, eras:[{revision, from}]} — `revision` reste
 // celle de la création (cité et premiers cantons vus) ; chaque époque donne la révision sous laquelle la campagne a été
 // reprise et le rang, dans le registre `cantons` du monde régional, du premier canton vu sous elle.
 const KEYS=Object.freeze(['version','active','revision']),KEYS2=Object.freeze(['version','active','revision','eras']);
 const copyRevision=v=>Object.fromEntries(REVISION_KEYS.map(k=>[k,v[k]]));
 function initial(){return{version:1,active:false,revision:null};}
 function fresh(){return{version:1,active:true,revision:revision()};}
 function validate(raw,full){
  const g=full?.frontier?.generation;
  if(raw===undefined){if(g===12)throw Error('Campagne sans bord sans marque expérimentale.');return initial();}
  const keys=raw?.version===2?KEYS2:KEYS;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||![1,2].includes(raw.version)||typeof raw.active!=='boolean'||Object.keys(raw).length!==keys.length||keys.some(k=>!(k in raw)))throw Error('Monde sans bord 217 invalide.');
  // Forme inactive (instantané d'une campagne à région finie, quand un appelant lit le registre sans la sauvegarde).
  if(raw.active===false){if(raw.version!==1||raw.revision!==null)throw Error('Monde sans bord 217 invalide.');if(g===12)throw Error('Campagne sans bord sans marque expérimentale.');return initial();}
  const v=raw.revision;if(!revisionOK(v))throw Error('Révision du monde sans bord invalide.');
  if(full&&g!==12)throw Error('Marque expérimentale sur une campagne à région finie.');
  if(raw.version===1)return{version:1,active:true,revision:copyRevision(v)};
  // Époques : rangs strictement croissants (le canton de la cité, rang 0, est toujours de la révision de création), révision
  // différente de la précédente, au plus `maxEras`, jamais au-delà des cantons vus de la sauvegarde.
  const eras=raw.eras,cap=C.WorldSave217Rules.maxSeenCantons,bad=()=>{throw Error('Révisions de la campagne sans bord invalides.');};
  if(!Array.isArray(eras)||!eras.length||eras.length>C.WorldRevision217Rules.maxEras)bad();
  let prev=v,from=0;const list=[];
  for(const e of eras){
   if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).length!==2||!revisionOK(e.revision)||!Number.isInteger(e.from)||e.from<=from||e.from>cap||sameRevision(e.revision,prev))bad();
   list.push({revision:copyRevision(e.revision),from:e.from});prev=e.revision;from=e.from;
  }
  if(full&&(!Array.isArray(full.frontier?.cantons)||from>full.frontier.cantons.length))throw Error('Révisions de la campagne sans bord au-delà des cantons vus.');
  return{version:2,active:true,revision:copyRevision(v),eras:list};
 }
 // Reprise sous la révision courante d'une campagne dont le registre compte `count` cantons vus : les cantons vus à partir de
 // maintenant appartiennent à la révision courante. Une époque où aucun canton n'a été vu prend la nouvelle révision (ou
 // disparaît si la précédente revient). Plafond `maxEras` atteint : aucune époque ajoutée (réserve consignée, ouverture.md).
 function advance(st,count){
  if(!st?.active||!st.revision||!available()||!Number.isInteger(count)||count<1)return st;
  const cur=revision(),eras=(st.eras||[]).map(e=>({revision:copyRevision(e.revision),from:e.from})),last=eras.length?eras[eras.length-1]:null;
  if(sameRevision(last?last.revision:st.revision,cur))return st;
  if(last&&last.from>=count){eras.pop();const back=eras.length?eras[eras.length-1].revision:st.revision;if(!sameRevision(back,cur))eras.push({revision:cur,from:count});}
  else if(eras.length>=C.WorldRevision217Rules.maxEras)return st;
  else eras.push({revision:cur,from:count});
  return eras.length?{version:2,active:true,revision:copyRevision(st.revision),eras}:{version:1,active:true,revision:copyRevision(st.revision)};
 }
 const REVISED_TEXT='Monde révisé : cette campagne sans bord a été créée avec une autre révision du générateur. Elle reste jouable ; les cantons jamais visités peuvent différer, vos lieux repérés, prélèvements et cantons vus sont conservés.';
 const KEPT_TEXT='Monde révisé : cette campagne sans bord a été créée avec une autre révision du générateur. Elle reste jouable ; les cantons déjà vus et la cité gardent leur forme d’origine, seuls les cantons jamais visités suivent le nouveau générateur. Vos lieux repérés et prélèvements sont conservés.';
 const MISSING_TEXT=' Révision d’origine absente de cette version : les cantons déjà vus et la cité suivent eux aussi le générateur actuel.';
 // Liaison d'un document de sauvegarde, lue avant sa reprise : seule une campagne de génération 12 marquée est lue ; aucune
 // autre ne touche aux modules du monde sans bord.
 function prepare(raw){
  if(raw?.frontier?.generation!==12||!Array.isArray(raw.frontier.cantons))return null;
  let st;try{st=validate(raw.expansions127?.modules?.openworld217,{frontier:raw.frontier});}catch{return null;}
  if(!st.active)return null;const count=raw.frontier.cantons.length;
  return{count,binding:bind(advance(st,count),raw.frontier.cantons,raw.worldSeed)};
 }
 function install(g){
  if(!g||g.openWorld217)return g?.openWorld217||null;
  if(!g.expansions)return null;
  let state=initial(),pending=false,told=false,arriving=null;
  const revised=()=>state.active&&!!state.revision&&available()&&!sameRevision(state.revision,revision());
  const kept=()=>!!bound?.key&&!bound.missing.length;
  const revisedText=()=>kept()?KEPT_TEXT:REVISED_TEXT+(bound?.missing?.length?MISSING_TEXT:'');
  function overview(){
   if(!state.active)return{summary:'Campagne à région finie (défaut). Le monde sans bord se choisit seulement à la création d’une nouvelle campagne.',rows:[{label:'Monde',value:'Région finie.'}]};
   const v=state.revision,f=home(g.world.seed),pos=g.frontier?.position?.();
   return{summary:'Campagne expérimentale : monde sans bord (génération 12). Le générateur peut encore évoluer ; cette campagne n’est pas convertible en région finie.',rows:[
    {label:'Monde',value:'Sans bord — expérimental'+(revised()?' · monde révisé':'')},
    {label:'Cité',value:f.size+' m de côté. '+(city(g.world.seed)||L().describe(g.world.seed)).sheet.sentence},
    {label:'Révision',value:'générateur '+[v.open,v.canton,v.relief,v.sites,v.local].join('.')+(revised()?' (actuel : '+Object.values(revision()).join('.')+')':'')},
    {label:'Cantons vus',value:String(pos?.generation===12?(g.frontier.snapshot().cantons||[]).length:0)+(boundTo(g.world.seed)?' · '+bound.kept+' gardés dans leur révision d’origine'+(bound.city?', cité comprise':''):'')},
    ...(revised()?[{label:'Révision',value:revisedText()}]:[])]};
  }
  const api=Object.freeze({active:()=>state.active,revised,kept,revision:()=>state.revision?{...state.revision}:null,current:()=>available()?revision():null,overview,snapshot:()=>JSON.parse(JSON.stringify(state)),home:()=>home(g.world.seed),
   binding:()=>bound?{key:bound.key,kept:bound.kept,city:!!bound.city,missing:[...bound.missing]}:null});
  g.openWorld217=api;
  g.expansions.register({id:'openworld217',title:'Sans bord — expérimental',overview,actions:()=>[],validate,snapshot:api.snapshot,available:()=>state.active,
   restore:raw=>{state=!raw||!raw.active?initial():raw.version===2?{version:2,active:true,revision:{...raw.revision},eras:raw.eras.map(e=>({revision:{...e.revision},from:e.from}))}:{version:1,active:true,revision:{...raw.revision}};if(arriving!==null)state=advance(state,arriving);told=false;},
   reset:()=>{state=pending?fresh():initial();told=false;}});
  // Option de menu : septième argument de startNew. Elle ne vaut que pour ce départ. Une campagne neuve n'a aucune liaison.
  const start=g.startNew.bind(g);
  g.startNew=(...a)=>{const before=pending,link=bound;pending=a[6]===true||a[5]?.generation===12;bound=null;let r;try{r=start(...a);}catch(error){bound=link;throw error;}finally{pending=before;}if(r===false)bound=link;return r;};
  // Cité d'une campagne liée à une révision passée : carte locale de cette révision (mêmes conditions que Game#cityTerrain217).
  const terrain=typeof g.cityTerrain217==='function'?g.cityTerrain217.bind(g):null;
  if(terrain)g.cityTerrain217=data=>{const own=city(data?.worldSeed);return own&&data.frontier?.generation===12&&C.localMapOf217?.(data)?.tiles===C.LocalMap217Rules.generationTiles[12]?own:terrain(data);};
  // Campagne sans l'option : forme inactive {version:1, active:false, revision:null}, comme tout module enregistré
  // (contrat 202 : chaque module est présent dans l'écriture de la campagne ; relecture identique, metric174).
  // D-O4 : la liaison (moteur de chaque canton vu, cité) est posée avant la reprise, pour que la cité et le monde régional
  // soient bâtis dans leur révision ; refus de la reprise : la liaison précédente revient.
  const restore=g.restoreSave.bind(g);
  g.restoreSave=raw=>{
   const link=bound,prep=prepare(raw);bound=prep?prep.binding:null;arriving=prep?prep.count:null;
   let r;try{r=restore(raw);}catch(error){bound=link;throw error;}finally{arriving=null;}
   if(r===false){bound=link;return r;}
   if(revised()&&!told){told=true;g.notify?.(revisedText(),'danger');}
   return r;
  };
  return api;
 }

 const bindingKey=seed=>boundTo(seed)?.key??null;
 const api=Object.freeze({RULES:R,available,revision,sameRevision,home,city,region,paint,initial,fresh,validate,advance,bind,install,engines:ENGINES,bindingKey,REVISED_TEXT,KEPT_TEXT});
 root.DeadwallOpenWorld217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
