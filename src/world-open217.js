// Monde régional de la génération 12, sans bord (docs/GAME_BIBLE.md §7.13,
// specs/monde-sans-bord/ouverture.md, tranche O1). Objet monde hors jeu qui répond aux
// accesseurs communs du monde fini (`site`, `sitesNear`, `contains`, `outside`,
// `outsideOpen`, `clampInside`, `extent`, `chunkRange`, `axisMin`, `axisMax`,
// `nearestRoad`, et depuis O4 `sitesIn`, `seenSites`, `nearestSite`, `sitesByDistance`,
// `siteIndex`) à partir des cantons de src/world-canton-gen217.js, avec un itinéraire
// borné à quelques cantons au lieu du Dijkstra global, et un tirage de route par position
// au lieu de `% roads.length`.
// Aucune liste globale (`roads`, `pois`, `size`) : un lecteur qui en dépend échoue au lieu
// de lire une vue partielle. Le cache ne fait qu'accélérer : chaque réponse est une fonction
// pure de (graine, arguments). Hors jeu : non chargé par index.html, lu par aucune
// génération (1 à 11), aucun flux existant ; la génération 12 reste refusée partout.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallWorldOpen217=api;
})(globalThis,function(root){
 'use strict';
 const node=typeof require==='function';
 const C=root.DeadwallCore||(node?require('./core.js'):null);
 const K=root.DeadwallWorldCantons217||(node?require('./world-cantons217.js'):null);
 const G=root.DeadwallWorldCantonGen217||(node?require('./world-canton-gen217.js'):null);
 const R=C.WorldOpen217Rules,SIZE=K.SIZE,CELL=G.CELL,N=G.CELLS,MAX=K.RULES.maxCoordinate;
 // Bornes de l'adressage, en mètres, bornes comprises : au-delà, aucun canton n'a d'identifiant.
 const LO=-MAX*SIZE,HI=(MAX+1)*SIZE-1;
 const EXTENT=Object.freeze({x:-Infinity,y:-Infinity,w:Infinity,h:Infinity,minX:-Infinity,minY:-Infinity,maxX:Infinity,maxY:Infinity,bounded:false});
 const finite=(x,y)=>Number.isFinite(x)&&Number.isFinite(y);
 const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy);
 const seedOK=seed=>{if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Graine régionale invalide');};

 // Prédicats de limite : mêmes conventions que `limits(size)` de frontier-world.js (T1) —
 // `contains` refuse NaN, `outside` et `outsideOpen` l'admettent — sur l'étendue de l'adressage.
 const LIMITS=Object.freeze({
  axisMin:(pad=0)=>LO+pad,axisMax:(pad=0)=>HI-pad,
  contains:(x,y,pad=0)=>x>=LO+pad&&y>=LO+pad&&x<=HI-pad&&y<=HI-pad,
  outside:(x,y,pad=0)=>x<LO+pad||y<LO+pad||x>HI-pad||y>HI-pad,
  outsideOpen:(x,y,pad=0)=>x<=LO+pad||y<=LO+pad||x>=HI-pad||y>=HI-pad,
  clampInside:(x,y,pad=0)=>({x:Math.max(LO+pad,Math.min(HI-pad,x)),y:Math.max(LO+pad,Math.min(HI-pad,y))}),
  extent:()=>EXTENT,
  chunkRange:(chunk=256)=>{if(!Number.isInteger(chunk)||chunk<1)throw Error('Morceau invalide.');const min=Math.floor(LO/chunk),max=Math.floor(HI/chunk);return Object.freeze({min,max,count:max-min+1});}
 });

 function create(seed,options={}){
  seedOK(seed);
  const cache=K.createCache(options.cache||{}),stats={generated:0,routes:0,routeNodes:0};
  // D-O4 : `options.generate(cx, cy)` rend le canton d'une autre révision du générateur (canton déjà vu d'une campagne
  // créée sous cette révision, src/openworld217.js) ; rien (undefined) = générateur courant.
  const own=typeof options.generate==='function'?options.generate:null;
  const canton=(cx,cy)=>cache.ensure(cx,cy,()=>{stats.generated++;return own&&own(cx,cy)||G.generate(seed,cx,cy);});
  // Garde l'anneau protégé autour du dernier point lu, rend la mémoire au-delà.
  const settle=(cx,cy)=>{cache.evict(cx,cy);};
  const cellX=(c,i)=>c.bounds.x+(i%N+.5)*CELL,cellY=(c,i)=>c.bounds.y+(Math.floor(i/N)+.5)*CELL;
  // Cantons d'un rectangle, dans l'ordre canonique : ligne puis colonne.
  const box=(x0,y0,x1,y1)=>{const out=[];for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)if(cx>=-MAX&&cx<=MAX&&cy>=-MAX&&cy<=MAX)out.push({cx,cy});return out;};
  const around=(cx,cy,r)=>box(cx-r,cy-r,cx+r,cy+r);

  const origin=canton(0,0),found=origin.foundation;
  if(!found)throw Error('Site de fondation absent.');
  // Emprise de D-17 : le plat garanti du site de fondation. La tranche de la carte de la cité
  // (O4) la remplacera par le cadre de la carte locale, que ce module ne lit pas.
  const half=found.size/2;
  const home=Object.freeze({x:found.x,y:found.y,size:found.size,minX:found.x-half,minY:found.y-half,maxX:found.x+half,maxY:found.y+half,canton:origin.id,site:found.id});

  // Lieu nommé par son identifiant : charge le canton qui le porte, rien d'autre.
  function site(id){
   const p=K.parseEntity(id);if(!p||p.kind!=='site')return undefined;
   const c=canton(p.cx,p.cy),s=c.sites[p.index];settle(p.cx,p.cy);return s&&s.id===id?s:undefined;
  }
  // Lieux à `radius` mètres au plus du point, dans l'ordre canonique (canton par ligne puis
  // colonne, puis rang dans le canton). Rayon borné : un voisinage, jamais toute la région.
  // Un point non mesurable n'a pas de voisinage (le monde fini rendait toute la liste).
  function sitesNear(x,y,radius){
   if(!(radius>=0)||radius>R.nearMaxRadius)throw Error('Rayon de voisinage invalide.');
   if(!finite(x,y)||!LIMITS.contains(x,y))return[];
   const a=K.at(Math.max(LO,x-radius),Math.max(LO,y-radius)),b=K.at(Math.min(HI,x+radius),Math.min(HI,y+radius)),out=[];
   for(const k of box(a.cx,a.cy,b.cx,b.cy))for(const s of canton(k.cx,k.cy).sites)if(!(far(s.x-x,s.y-y)>radius))out.push(s);
   const c=K.at(x,y);settle(c.cx,c.cy);return out;
  }
  // Accesseurs de voisinage (tranche O4), mêmes noms que sur la région finie, sans liste globale.
  // Lieux dont le centre est dans le rectangle {left, top, right, bottom}, dans l'ordre canonique ; côté borné au
  // double de `nearMaxRadius` (le carré de `sitesNear`). Un lieu G12 n'a pas encore d'emprise (O2).
  function sitesIn(rect){
   const l=rect?.left,t=rect?.top,r=rect?.right,b=rect?.bottom;
   if(![l,t,r,b].every(Number.isFinite)||l>r||t>b||r-l>2*R.nearMaxRadius||b-t>2*R.nearMaxRadius)throw Error('Rectangle de voisinage invalide.');
   if(r<LO||l>HI||b<LO||t>HI)return[];
   const a=K.at(Math.max(LO,l),Math.max(LO,t)),z=K.at(Math.min(HI,r),Math.min(HI,b)),out=[];
   for(const k of box(a.cx,a.cy,z.cx,z.cy))for(const s of canton(k.cx,k.cy).sites)if(!(s.x<l||s.x>r||s.y<t||s.y>b))out.push(s);
   const c=K.at(Math.max(LO,Math.min(HI,(l+r)/2)),Math.max(LO,Math.min(HI,(t+b)/2)));settle(c.cx,c.cy);return out;
  }
  // Lieux cités, lus un par un par `site(id)`, dans l'ordre des identifiants donnés (doublons et inconnus écartés).
  // La région finie rend l'ordre de sa liste : un appelant qui dépend de l'ordre trie lui-même.
  function seenSites(ids){
   const out=[],done=new Set();
   for(const id of ids instanceof Set?ids:Array.from(ids||[])){if(done.has(id))continue;done.add(id);const s=site(id);if(s)out.push(s);}
   return out;
  }
  // Index paresseux : seules `get` et `has` existent ; chaque lecture charge le seul canton cité.
  const index=Object.freeze({get:id=>site(id),has:id=>site(id)!==undefined});
  // Lieux retenus à `maxRadius` au plus, triés par distance puis identifiant (même ordre que la région finie).
  function sitesByDistance(x,y,filter,maxRadius=R.nearMaxRadius){
   const d=s=>far(s.x-x,s.y-y);
   return sitesNear(x,y,maxRadius).filter(s=>filter(s)).sort((p,q)=>d(p)-d(q)||p.id.localeCompare(q.id));
  }
  // Lieu retenu le plus proche, cherché par anneaux de cantons autour du point : un lieu de l'anneau k est à plus
  // de (k - 1) cantons, la recherche s'arrête donc dès qu'un lieu retenu est à moins. Égalité : ordre canonique.
  function nearestSite(x,y,filter,maxRadius=R.nearMaxRadius){
   if(!(maxRadius>=0)||maxRadius>R.nearMaxRadius)throw Error('Rayon de voisinage invalide.');
   if(!finite(x,y)||!LIMITS.contains(x,y))return null;
   // Au-delà de l'anneau ceil(maxRadius / SIZE), tout lieu est à plus de maxRadius.
   const c=K.at(x,y),last=Math.ceil(maxRadius/SIZE);let best=null,bd=0,bk=null;
   const before=(p,q)=>p[0]-q[0]||p[1]-q[1]||p[2]-q[2];
   for(let k=0;k<=last;k++){
    if(best&&bd<=(k-1)*SIZE)break;
    for(const q of box(c.cx-k,c.cy-k,c.cx+k,c.cy+k)){
     if(Math.max(Math.abs(q.cx-c.cx),Math.abs(q.cy-c.cy))!==k)continue;
     canton(q.cx,q.cy).sites.forEach((s,i)=>{
      if(!filter(s))return;const d=far(s.x-x,s.y-y);if(d>maxRadius)return;const key=[q.cy,q.cx,i];
      if(!best||d<bd||d===bd&&before(key,bk)<0){best=s;bd=d;bk=key;}
     });
    }
   }
   settle(c.cx,c.cy);return best;
  }
  // Routes des cantons à `radius` cantons du point, dans l'ordre canonique.
  function roadsAround(x,y,radius=R.pickRadius){
   if(!finite(x,y)||!LIMITS.contains(x,y))return[];if(!Number.isInteger(radius)||radius<0||radius>2)throw Error('Rayon de cantons invalide.');
   const c=K.at(x,y),out=[];for(const k of around(c.cx,c.cy,radius))out.push(...canton(k.cx,k.cy).roads);settle(c.cx,c.cy);return out;
  }
  // Remplace `w.roads[h % w.roads.length]` : la route tirée dépend du hachage et du canton du
  // point, jamais de ce qui est chargé ni de la taille d'un monde entier.
  function pickRoad(hash,x,y){
   if(!Number.isInteger(hash)||hash<0||hash>4294967295)throw Error('Hachage invalide.');
   const list=roadsAround(x,y);return list.length?list[hash%list.length]:null;
  }
  // Case de route la plus proche, cherchée dans l'anneau `snapRadius` du point.
  function nearestRoad(point){
   if(!point||!finite(point.x,point.y)||!LIMITS.contains(point.x,point.y))return null;
   const c=K.at(point.x,point.y);let best=null;
   for(const k of around(c.cx,c.cy,R.snapRadius)){const t=canton(k.cx,k.cy);for(const r of t.roads)for(const i of r.cells){const x=cellX(t,i),y=cellY(t,i),d=far(x-point.x,y-point.y);if(!best||d<best.d)best={x,y,d,road:r,canton:t.id,cell:i};}}
   settle(c.cx,c.cy);return best;
  }

  // Graphe routier d'un rectangle de cantons. Nœuds : cases de route (`K…#case`) et passages
  // de couture (identifiant de la couture, partagé par ses deux cantons). Arêtes : pas d'une
  // case à la suivante le long d'une route, et du passage de couture à la première case.
  function graph(list){
   const ids=new Map(),pos=[],edges=[];
   const add=(key,x,y)=>{let n=ids.get(key);if(n===undefined){n=pos.length;ids.set(key,n);pos.push({x,y});edges.push([]);}return n;};
   const link=(a,b)=>{if(a===b)return;const d=far(pos[a].x-pos[b].x,pos[a].y-pos[b].y);edges[a].push([b,d]);edges[b].push([a,d]);};
   for(const k of list){const t=canton(k.cx,k.cy);
    for(const r of t.roads){const seam=add(r.from,r.points[0].x,r.points[0].y);let prev=seam;
     for(const i of r.cells){const n=add(t.id+'#'+i,cellX(t,i),cellY(t,i));link(prev,n);prev=n;}}}
   return{ids,pos,edges};
  }
  // Itinéraire routier borné : la recherche ne voit que le rectangle des cantons de départ et
  // d'arrivée élargi de `route.margin`, et refuse au-delà de `route.maxCantons` cantons.
  // Rend null si l'un des points est sans route proche, hors zone, ou non relié dans la zone.
  function route(from,to){
   if(!from||!to||!finite(from.x,from.y)||!finite(to.x,to.y)||!LIMITS.contains(from.x,from.y)||!LIMITS.contains(to.x,to.y))return null;
   const a=K.at(from.x,from.y),b=K.at(to.x,to.y),m=R.route.margin,x0=Math.min(a.cx,b.cx)-m,y0=Math.min(a.cy,b.cy)-m,x1=Math.max(a.cx,b.cx)+m,y1=Math.max(a.cy,b.cy)+m;
   if((x1-x0+1)*(y1-y0+1)>R.route.maxCantons)return null;
   const start=nearestRoad(from),end=nearestRoad(to);if(!start||!end)return null;
   const list=box(x0,y0,x1,y1),inside=key=>{const p=K.parse(key.split('#')[0]);return p&&p.cx>=x0&&p.cx<=x1&&p.cy>=y0&&p.cy<=y1;};
   if(!inside(start.canton)||!inside(end.canton))return null;
   const g=graph(list),s=g.ids.get(start.canton+'#'+start.cell),e=g.ids.get(end.canton+'#'+end.cell);stats.routes++;stats.routeNodes=g.pos.length;
   const dist=new Float64Array(g.pos.length).fill(Infinity),parent=new Int32Array(g.pos.length).fill(-1),done=new Uint8Array(g.pos.length),heap=[];
   const less=(p,q)=>p.d<q.d||(p.d===q.d&&p.n<q.n);
   const push=item=>{let i=heap.length;heap.push(item);while(i){const j=(i-1)>>1;if(!less(item,heap[j]))break;heap[i]=heap[j];i=j;}heap[i]=item;};
   const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&less(heap[c+1],heap[c]))c++;if(!less(heap[c],last))break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;};
   dist[s]=0;push({n:s,d:0});
   while(heap.length){const{n,d}=pop();if(done[n]||d!==dist[n])continue;done[n]=1;if(n===e)break;for(const[v,w]of g.edges[n])if(d+w<dist[v]){dist[v]=d+w;parent[v]=n;push({n:v,d:d+w});}}
   settle(a.cx,a.cy);
   if(!Number.isFinite(dist[e]))return null;
   const pts=[];for(let n=e;n>=0;n=parent[n])pts.push({x:g.pos[n].x,y:g.pos[n].y});pts.reverse();
   const connector=start.d+end.d;
   return{path:[{x:from.x,y:from.y},...pts,{x:to.x,y:to.y}],metres:dist[e]+connector,roadMetres:dist[e],connectorMetres:connector,cantons:list.map(k=>K.id(k.cx,k.cy))};
  }

  return Object.freeze({
   seed,generation:K.RULES.reservedGeneration,unbounded:true,
   reliefVersion:G.RULES.version,
   home,foundation:found,...LIMITS,
   site,sitesNear,sitesIn,seenSites,nearestSite,sitesByDistance,siteIndex:()=>index,roadsAround,pickRoad,nearestRoad,route,
   canton:(cx,cy)=>{const t=canton(cx,cy);settle(cx,cy);return t;},
   cantonAt:(x,y)=>{const c=K.at(x,y),t=canton(c.cx,c.cy);settle(c.cx,c.cy);return t;},
   streamStats:()=>({...cache.stats(),generated:stats.generated,routes:stats.routes,routeNodes:stats.routeNodes})
  });
 }

 return Object.freeze({RULES:R,LIMITS,EXTENT,create});
});
