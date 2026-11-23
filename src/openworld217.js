/* Ouverture « Sans bord — expérimental » (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/ouverture.md, tranche O9).
   Une campagne NOUVELLE, créée avec l'option de menu « MONDE : Sans bord — expérimental », joue la génération 12 : cité de
   192 m adossée née de sa graine (src/world-local217.js), monde régional sans bord fait de cantons (src/world-sites217.js),
   sauvegarde creuse (src/world-save217.js). La région finie reste le défaut ; une campagne lancée sans l'option ne lit rien
   de ce module (aucune clé de sauvegarde, aucun tirage, aucun monde chargé).
   - `region(graine, effets)` : façade du monde régional G12 pour frontier-world.create(…, 12) : monde O2 plus les accesseurs
     que la boucle régionale lit sur la région finie (préparation d'un canton par image, routes et relief à peindre autour de
     la vue, eau pour la faune), le cadre de la cité comme `home`.
   - `home(graine)` : cadre de la cité de 192 m dans le repère régional (fonction pure de la graine).
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

 // Cadre de la cité dans le repère régional : origine de la carte locale dans son canton, plus le coin du canton.
 const frames=new Map();
 function home(seed){
  if(frames.has(seed))return frames.get(seed);
  const d=L().describe(seed),c=K().parse(d.canton),b=K().bounds(c.cx,c.cy),size=d.frame,minX=b.x+d.origin.x,minY=b.y+d.origin.y;
  const h=Object.freeze({x:minX+size/2,y:minY+size/2,size,minX,minY,maxX:minX+size,maxY:minY+size,canton:d.canton,site:d.site});
  frames.set(seed,h);if(frames.size>4)frames.delete(frames.keys().next().value);return h;
 }

 // Milieu d'une maille de canton sous la forme d'un échantillon de src/biomes135.js (lu par le sol et les codex).
 function biomeSample(def){return Object.freeze({id:def.id,name:def.name,primary:def.id,secondary:def.id,blend:0,weights:Object.freeze({[def.id]:1}),treeChance:def.treeChance,rockChance:def.rockChance,decorChance:def.decorChance,def,palette:def.palette,ground:def.ground,surface:def.surface,temperature:.5,moisture:.5,elevation:.5,fertility:.5,urban:0});}

 // Façade régionale G12. Chaque réponse reste une fonction pure de (graine, arguments) ; la préparation par anneau ne fait
 // qu'avancer le moment où un canton est construit (T5.2 : au plus `prefetch.perFrame` canton par image).
 function region(seed,effects={}){
  if(!available())throw Error('Monde sans bord indisponible dans cette version.');
  const k=K(),G=Gen(),w=Sites().create(seed,{effects}),frame=home(seed),CELL=G.CELL,N=G.CELLS;
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
   cacheSize:()=>w.streamStats().size,planCacheSize:()=>w.streamStats().planCache,
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
 const KEYS=Object.freeze(['version','active','revision']);
 function initial(){return{version:1,active:false,revision:null};}
 function fresh(){return{version:1,active:true,revision:revision()};}
 function validate(raw,full){
  const g=full?.frontier?.generation;
  if(raw===undefined){if(g===12)throw Error('Campagne sans bord sans marque expérimentale.');return initial();}
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||KEYS.some(k=>!(k in raw)))throw Error('Monde sans bord 217 invalide.');
  // Forme inactive (instantané d'une campagne à région finie, quand un appelant lit le registre sans la sauvegarde).
  if(raw.active===false){if(raw.revision!==null)throw Error('Monde sans bord 217 invalide.');if(g===12)throw Error('Campagne sans bord sans marque expérimentale.');return initial();}
  const v=raw.revision;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==REVISION_KEYS.length||REVISION_KEYS.some(k=>!Number.isInteger(v[k])||v[k]<1||v[k]>1e6))throw Error('Révision du monde sans bord invalide.');
  if(full&&g!==12)throw Error('Marque expérimentale sur une campagne à région finie.');
  return{version:1,active:true,revision:Object.fromEntries(REVISION_KEYS.map(k=>[k,v[k]]))};
 }
 const REVISED_TEXT='Monde révisé : cette campagne sans bord a été créée avec une autre révision du générateur. Elle reste jouable ; les cantons jamais visités peuvent différer, vos lieux repérés, prélèvements et cantons vus sont conservés.';
 function install(g){
  if(!g||g.openWorld217)return g?.openWorld217||null;
  if(!g.expansions)return null;
  let state=initial(),pending=false,told=false;
  const revised=()=>state.active&&!!state.revision&&available()&&!sameRevision(state.revision,revision());
  function overview(){
   if(!state.active)return{summary:'Campagne à région finie (défaut). Le monde sans bord se choisit seulement à la création d’une nouvelle campagne.',rows:[{label:'Monde',value:'Région finie.'}]};
   const v=state.revision,f=home(g.world.seed),pos=g.frontier?.position?.();
   return{summary:'Campagne expérimentale : monde sans bord (génération 12). Le générateur peut encore évoluer ; cette campagne n’est pas convertible en région finie.',rows:[
    {label:'Monde',value:'Sans bord — expérimental'+(revised()?' · monde révisé':'')},
    {label:'Cité',value:f.size+' m de côté. '+L().describe(g.world.seed).sheet.sentence},
    {label:'Révision',value:'générateur '+[v.open,v.canton,v.relief,v.sites,v.local].join('.')+(revised()?' (actuel : '+Object.values(revision()).join('.')+')':'')},
    {label:'Cantons vus',value:String(pos?.generation===12?(g.frontier.snapshot().cantons||[]).length:0)},
    ...(revised()?[{label:'Révision',value:REVISED_TEXT}]:[])]};
  }
  const api=Object.freeze({active:()=>state.active,revised,revision:()=>state.revision?{...state.revision}:null,current:()=>available()?revision():null,overview,snapshot:()=>JSON.parse(JSON.stringify(state)),home:()=>home(g.world.seed)});
  g.openWorld217=api;
  g.expansions.register({id:'openworld217',title:'Sans bord — expérimental',overview,actions:()=>[],validate,snapshot:api.snapshot,available:()=>state.active,
   restore:raw=>{state=raw&&raw.active?{version:1,active:true,revision:{...raw.revision}}:initial();told=false;},
   reset:()=>{state=pending?fresh():initial();told=false;}});
  // Option de menu : septième argument de startNew. Elle ne vaut que pour ce départ.
  const start=g.startNew.bind(g);
  g.startNew=(...a)=>{const before=pending;pending=a[6]===true||a[5]?.generation===12;try{return start(...a);}finally{pending=before;}};
  // Campagne sans l'option : forme inactive {version:1, active:false, revision:null}, comme tout module enregistré
  // (contrat 202 : chaque module est présent dans l'écriture de la campagne ; relecture identique, metric174).
  const restore=g.restoreSave.bind(g);
  g.restoreSave=raw=>{const r=restore(raw);if(r!==false&&revised()&&!told){told=true;g.notify?.(REVISED_TEXT,'danger');}return r;};
  return api;
 }

 const api=Object.freeze({RULES:R,available,revision,sameRevision,home,region,paint,initial,fresh,validate,install,REVISED_TEXT});
 root.DeadwallOpenWorld217=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)install(root.DEADWALL);
})(globalThis);
