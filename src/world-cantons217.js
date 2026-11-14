// Adressage des cantons d'un monde sans bord (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/).
// Module pur : coordonnées entières signées, identifiants stables, sous-graines par canton,
// par couture et par sommet, voisinage, anneau de chargement, plan d'éviction et cache borné.
// Il ne génère rien, ne lit ni ne modifie aucune sauvegarde, ne tire dans aucun flux existant
// et n'est branché sur aucune génération (1 à 11). Il n'est pas chargé par index.html.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallWorldCantons217=api;
})(globalThis,function(root){
 'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null),R=C.WorldCantons217Rules;
 const SIZE=R.canton,MAX=R.maxCoordinate,MAX_INDEX=R.maxIndex;
 const SIDES=Object.freeze(['north','east','south','west']);
 // y croît vers le sud, comme dans le reste du monde régional.
 const STEP=Object.freeze({north:Object.freeze([0,-1]),east:Object.freeze([1,0]),south:Object.freeze([0,1]),west:Object.freeze([-1,0])});
 const OPPOSITE=Object.freeze({north:'south',east:'west',south:'north',west:'east'});
 const INT='(0|-?[1-9]\\d{0,6})',KIND='[a-z][a-z0-9]{0,7}',STREAM=/^[a-z][a-z0-9-]{0,31}$/;
 const CANTON_ID=new RegExp('^K'+INT+'_'+INT+'$'),ENTITY_ID=new RegExp('^K'+INT+'_'+INT+':('+KIND+'):(0|[1-9]\\d{0,4})$'),EDGE_ID=new RegExp('^K([hv])'+INT+'_'+INT+'$');
 const coordinate=n=>Number.isInteger(n)&&n>=-MAX&&n<=MAX;
 const need=(cx,cy)=>{if(!coordinate(cx)||!coordinate(cy))throw Error('Coordonnées de canton invalides.');};
 const seedOK=seed=>{if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Graine régionale invalide');};

 // --- Coordonnées -------------------------------------------------------
 // `+0` écarte le zéro négatif : un identifiant ne dépend jamais du signe de zéro.
 function at(x,y){if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Position de canton invalide.');const cx=Math.floor(x/SIZE)+0,cy=Math.floor(y/SIZE)+0;need(cx,cy);return{cx,cy};}
 function bounds(cx,cy){need(cx,cy);return{x:cx*SIZE,y:cy*SIZE,w:SIZE,h:SIZE};}
 function toLocal(x,y){const c=at(x,y);return{cx:c.cx,cy:c.cy,x:x-c.cx*SIZE,y:y-c.cy*SIZE};}
 function toWorld(cx,cy,x,y){need(cx,cy);if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>SIZE||y>SIZE)throw Error('Position locale de canton invalide.');return{x:cx*SIZE+x,y:cy*SIZE+y};}

 // --- Identifiants ------------------------------------------------------
 // Forme canonique unique : pas de zéro négatif, pas de zéro de tête.
 function id(cx,cy){need(cx,cy);return'K'+cx+'_'+cy;}
 function parse(value){const m=typeof value==='string'?CANTON_ID.exec(value):null;if(!m)return null;const cx=Number(m[1]),cy=Number(m[2]);return coordinate(cx)&&coordinate(cy)?{cx,cy}:null;}
 // Un objet du monde porte les coordonnées de son canton : « K12_-3:site:7 ».
 function entityId(cx,cy,kind,index){need(cx,cy);if(typeof kind!=='string'||!new RegExp('^'+KIND+'$').test(kind)||!Number.isInteger(index)||index<0||index>MAX_INDEX)throw Error('Identifiant de canton invalide.');return id(cx,cy)+':'+kind+':'+index;}
 function parseEntity(value){const m=typeof value==='string'?ENTITY_ID.exec(value):null;if(!m)return null;const cx=Number(m[1]),cy=Number(m[2]),index=Number(m[4]);return coordinate(cx)&&coordinate(cy)&&index<=MAX_INDEX?{cx,cy,canton:id(cx,cy),kind:m[3],index}:null;}

 // --- Sous-graines ------------------------------------------------------
 // Fonction pure de (graine, coordonnées, flux) : ni état, ni compteur, donc aucun effet de
 // l'ordre de visite. Flux nouveaux, propres à ce module ; ils ne recoupent ni G.hash ni G.rng.
 const fnv=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 const fold=(h,v)=>{h^=v|0;h=Math.imul(h^h>>>16,0x85ebca6b);h=Math.imul(h^h>>>13,0xc2b2ae35);return(h^h>>>16)>>>0;};
 function derive(domain,seed,a,b,stream){seedOK(seed);if(typeof stream!=='string'||!STREAM.test(stream))throw Error('Flux de canton invalide.');return fold(fold(fold(fold(fold(0x217ca27,domain),seed),a),b),fnv(stream));}
 function subSeed(seed,cx,cy,stream){need(cx,cy);return derive(1,seed,cx,cy,stream);}
 // Mulberry32 : même famille que le monde existant, mais amorcé par une sous-graine propre.
 function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
 const stream=(seed,cx,cy,name)=>rng(subSeed(seed,cx,cy,name));

 // --- Coutures ----------------------------------------------------------
 // Une couture appartient à ses deux cantons : chacun la nomme de la même façon, donc tire
 // les mêmes points de raccord (routes, cours d'eau) sans connaître son voisin.
 function edge(cx,cy,side){need(cx,cy);if(!SIDES.includes(side))throw Error('Côté de canton invalide.');const axis=side==='north'||side==='south'?'h':'v',x=side==='east'?cx+1:cx,y=side==='south'?cy+1:cy;need(x,y);return{axis,x,y,id:'K'+axis+x+'_'+y};}
 function parseEdge(value){const m=typeof value==='string'?EDGE_ID.exec(value):null;if(!m)return null;const x=Number(m[2]),y=Number(m[3]);return coordinate(x)&&coordinate(y)?{axis:m[1],x,y,id:value}:null;}
 function edgeSeed(seed,cx,cy,side,name){const e=edge(cx,cy,side);return derive(e.axis==='h'?2:3,seed,e.x,e.y,name);}
 // Segment de la couture en mètres, toujours orienté dans le sens croissant.
 function edgeLine(cx,cy,side){const e=edge(cx,cy,side),x=e.x*SIZE,y=e.y*SIZE;return e.axis==='h'?{a:{x,y},b:{x:x+SIZE,y}}:{a:{x,y},b:{x,y:y+SIZE}};}
 // Un sommet est partagé par quatre cantons (nord-ouest de (vx,vy)).
 function cornerSeed(seed,vx,vy,name){need(vx,vy);return derive(4,seed,vx,vy,name);}
 function corners(cx,cy){need(cx,cy);need(cx+1,cy+1);return[{vx:cx,vy:cy},{vx:cx+1,vy:cy},{vx:cx+1,vy:cy+1},{vx:cx,vy:cy+1}];}

 // --- Voisinage et anneau -----------------------------------------------
 function neighbour(cx,cy,side){need(cx,cy);if(!SIDES.includes(side))throw Error('Côté de canton invalide.');const[dx,dy]=STEP[side];need(cx+dx,cy+dy);return{cx:cx+dx,cy:cy+dy,side,opposite:OPPOSITE[side]};}
 const inside=(cx,cy)=>coordinate(cx)&&coordinate(cy);
 function neighbours(cx,cy,diagonals=false){need(cx,cy);const out=[];for(const side of SIDES){const[dx,dy]=STEP[side];if(inside(cx+dx,cy+dy))out.push({cx:cx+dx,cy:cy+dy,side});}if(diagonals)for(const[dx,dy]of [[1,-1],[1,1],[-1,1],[-1,-1]])if(inside(cx+dx,cy+dy))out.push({cx:cx+dx,cy:cy+dy,side:null});return out;}
 const radiusOK=r=>{if(!Number.isInteger(r)||r<0||r>64)throw Error('Rayon de cantons invalide.');};
 const distance=(a,b,cx,cy)=>Math.max(Math.abs(a-cx),Math.abs(b-cy));
 // Ordre total et fixe : du plus proche au plus lointain, puis par ligne, puis par colonne.
 // L'appelant peut donc générer « les n premiers » par image sans que le résultat en dépende.
 function ring(cx,cy,radius=R.loadRadius){need(cx,cy);radiusOK(radius);const out=[];for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(inside(cx+dx,cy+dy))out.push({cx:cx+dx,cy:cy+dy,d:Math.max(Math.abs(dx),Math.abs(dy)),m:Math.abs(dx)+Math.abs(dy)});out.sort((a,b)=>a.d-b.d||a.m-b.m||a.cy-b.cy||a.cx-b.cx);return out.map(c=>({cx:c.cx,cy:c.cy,id:id(c.cx,c.cy),distance:c.d}));}
 function ringAt(x,y,radius=R.loadRadius){const c=at(x,y);return ring(c.cx,c.cy,radius);}
 // Plan pur : ce qu'il faut charger et ce qu'on peut lâcher. L'écart entre les deux rayons
 // évite de régénérer un canton quand le joueur oscille sur une couture.
 function plan(loaded,cx,cy,options={}){
  need(cx,cy);const loadRadius=options.loadRadius??R.loadRadius,keepRadius=options.keepRadius??R.keepRadius;radiusOK(loadRadius);radiusOK(keepRadius);
  if(keepRadius<loadRadius)throw Error('Anneau protégé plus petit que l’anneau chargé.');
  const have=new Set();for(const value of loaded){const p=parse(value);if(!p)throw Error('Identifiant de canton invalide.');have.add(value);}
  const load=ring(cx,cy,loadRadius).filter(c=>!have.has(c.id)).map(c=>c.id);
  const drop=[...have].map(parse).filter(p=>distance(p.cx,p.cy,cx,cy)>keepRadius).sort((a,b)=>distance(b.cx,b.cy,cx,cy)-distance(a.cx,a.cy,cx,cy)||a.cy-b.cy||a.cx-b.cx).map(p=>id(p.cx,p.cy));
  return{load,drop};
 }

 // --- Cache borné -------------------------------------------------------
 // Le contenu d'un canton ne dépend jamais du cache : l'éviction ne fait que libérer de la
 // mémoire, et un canton reconstruit par `build` doit être identique au précédent.
 function createCache(options={}){
  const capacity=options.capacity??R.cacheCapacity,keepRadius=options.keepRadius??R.keepRadius;radiusOK(keepRadius);
  if(!Number.isInteger(capacity)||capacity<(2*keepRadius+1)**2||capacity>4096)throw Error('Capacité du cache de cantons invalide.');
  const entries=new Map(),stats={hits:0,misses:0,evictions:0};
  const touch=(key,value)=>{entries.delete(key);entries.set(key,value);return value;};
  function get(cx,cy){const key=id(cx,cy);if(!entries.has(key)){stats.misses++;return undefined;}stats.hits++;return touch(key,entries.get(key));}
  function set(cx,cy,value){if(value===undefined)throw Error('Canton vide refusé par le cache.');return touch(id(cx,cy),value);}
  function ensure(cx,cy,build){const found=get(cx,cy);if(found!==undefined)return found;if(typeof build!=='function')throw Error('Constructeur de canton absent.');return set(cx,cy,build(cx,cy,id(cx,cy)));}
  // Retire les cantons les moins récemment utilisés hors de l'anneau protégé, jusqu'à la
  // capacité. Un canton de l'anneau protégé n'est jamais retiré.
  function evict(cx,cy){need(cx,cy);const dropped=[];if(entries.size<=capacity)return dropped;for(const key of [...entries.keys()]){if(entries.size<=capacity)break;const p=parse(key);if(distance(p.cx,p.cy,cx,cy)<=keepRadius)continue;entries.delete(key);stats.evictions++;dropped.push(key);}return dropped;}
  return Object.freeze({capacity,keepRadius,get,set,ensure,evict,has:(cx,cy)=>entries.has(id(cx,cy)),delete:(cx,cy)=>entries.delete(id(cx,cy)),clear:()=>entries.clear(),ids:()=>[...entries.keys()],get size(){return entries.size;},stats:()=>({size:entries.size,capacity,...stats})});
 }

 return Object.freeze({RULES:R,SIZE,SIDES,OPPOSITE,CANTON_ID,ENTITY_ID,EDGE_ID,at,bounds,toLocal,toWorld,id,parse,entityId,parseEntity,subSeed,rng,stream,edge,parseEdge,edgeSeed,edgeLine,cornerSeed,corners,neighbour,neighbours,ring,ringAt,plan,createCache});
});
