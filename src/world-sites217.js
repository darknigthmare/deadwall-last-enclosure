// Lieux complets et obstacles régionaux du monde sans bord G12 (docs/GAME_BIBLE.md §7.13,
// specs/monde-sans-bord/ouverture.md, tranche O2). Enveloppe le monde régional d'O1
// (src/world-open217.js) et donne à chaque lieu candidat d'un canton ce que la région finie
// donne à un lieu : emprise tournée face à sa route, genre tiré du milieu, programme et plan
// d'intérieur du codex existant (même sélection `forParcel` et même plan `floor` que les lieux
// natifs de G8+), accès (`drive`, raccord de frontage174), occupation et nombre d'occupants.
// Il ajoute les obstacles régionaux : une arête de falaise ne se franchit ni à pied ni en
// voiture, une rampe de col se prend, l'eau bloque comme les rivières de G8+ (sauf sur un pont),
// et la règle de vue et de tir D-O1 (`lineOfSight`) : une falaise arrête ce qui vient d'en bas,
// pas ce qui vient d'en haut.
// Chaque réponse est une fonction pure de (graine, canton, indice) : un canton se meuble seul,
// sans lire ses voisins, et le cache ne fait qu'accélérer. Flux nouveaux par K.stream et
// K.subSeed ; aucun tirage dans un flux des générations 1 à 11 (les fonctions de géométrie,
// du codex et des occupants qu'il réemploie sont des hachages purs de leurs arguments).
// Hors jeu : non chargé par index.html ; la génération 12 reste refusée partout.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallWorldSites217=api;
})(globalThis,function(root){
 'use strict';
 const node=typeof require==='function';
 const C=root.DeadwallCore||(node?require('./core.js'):null);
 const K=root.DeadwallWorldCantons217||(node?require('./world-cantons217.js'):null);
 const Gen=root.DeadwallWorldCantonGen217||(node?require('./world-canton-gen217.js'):null);
 const O=root.DeadwallWorldOpen217||(node?require('./world-open217.js'):null);
 const F=root.DeadwallFrontierGeometry||(node?require('./frontier-geometry.js'):null);
 const X=root.DeadwallCodex3000Runtime||(node?require('./codex3000-runtime.js'):null);
 const S=root.DeadwallWorldSpawns131||(node?require('./world-spawns131.js'):null);
 const B=root.DeadwallBiomes135||(node?require('./biomes135.js'):null);
 const Fr=root.DeadwallFrontage174||(node?require('./frontage174.js'):null);
 const D157=root.DeadwallSeedDetail157||(node?require('./seed-detail157.js'):null);
 const R=C.WorldSites217Rules,CELL=Gen.CELL,N=Gen.CELLS,SIZE=K.SIZE,W=Gen.WATER,TOP=C.WorldRelief217Rules.levels-1;
 const DEFS=Object.freeze([...C.BiomeRules135.defs,...C.EcologyRules164.defs]),BY=Object.freeze(Object.fromEntries(DEFS.map(d=>[d.id,d])));
 if(DEFS.length!==Gen.BIOMES.length||DEFS.some((d,i)=>d.id!==Gen.BIOMES[i]))throw Error('Milieux du relief et des lieux désaccordés.');
 const TREES=C.BiomeRules135.trees,ROCKS=C.BiomeRules135.rocks,ENEMIES=C.BiomeRules135.enemies;
 const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy),finite=(x,y)=>Number.isFinite(x)&&Number.isFinite(y);
 const unit=(seed,cx,cy,name)=>K.subSeed(seed,cx,cy,name)/4294967296;
 // Tirage pondéré par une valeur de [0, 1) ; ordre d'entrée conservé.
 function weighted(pool,u){const entries=Object.entries(pool||{}).filter(([,v])=>Number.isFinite(v)&&v>0);if(!entries.length)return null;let n=u*entries.reduce((s,[,v])=>s+v,0);for(const[id,w]of entries){n-=w;if(n<0)return id;}return entries[entries.length-1][0];}
 // Distances exactes, sans Math.hypot (même résultat sur tout moteur).
 function pointSegment(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=t<0?0:t>1?1:t;return far(px-ax-dx*t,py-ay-dy*t);}
 function nearestOn(points,p){let best=null;for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((p.x-a.x)*dx+(p.y-a.y)*dy)/l:0;t=t<0?0:t>1?1:t;const x=a.x+dx*t,y=a.y+dy*t,d=far(p.x-x,p.y-y);if(!best||d<best.d)best={x,y,d,k};}return best;}
 const orient=(ax,ay,bx,by,cx,cy)=>(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
 function segmentsCross(a,b,c,d){const o1=orient(a.x,a.y,b.x,b.y,c.x,c.y),o2=orient(a.x,a.y,b.x,b.y,d.x,d.y),o3=orient(c.x,c.y,d.x,d.y,a.x,a.y),o4=orient(c.x,c.y,d.x,d.y,b.x,b.y);return(o1>0&&o2<0||o1<0&&o2>0)&&(o3>0&&o4<0||o3<0&&o4>0);}
 function segmentSegment(a,b,c,d){if(segmentsCross(a,b,c,d))return 0;return Math.min(pointSegment(a.x,a.y,c.x,c.y,d.x,d.y),pointSegment(b.x,b.y,c.x,c.y,d.x,d.y),pointSegment(c.x,c.y,a.x,a.y,b.x,b.y),pointSegment(d.x,d.y,a.x,a.y,b.x,b.y));}

 // Règle D-O1, pure : franchir une arête de falaise de `from` vers `to` (paliers des deux
 // mailles) arrête la vue et le tir d'un tireur posé au palier `shooter` seulement si l'arête
 // monte et que le haut dépasse le palier du tireur. D'en haut, on voit et on touche en contrebas ;
 // d'en bas, on ne voit ni ne touche ce qui est au-dessus ; d'un plateau à un plateau de même
 // hauteur par-dessus une vallée, la vue passe. Une rampe de col n'est pas une falaise.
 const SIGHT=Object.freeze({blocks:(shooter,from,to)=>to>from&&to>shooter});
 // Nature d'une arête entre deux mailles voisines, comme les décomptes du générateur :
 // rien, rive (mer et palier 1), rampe (col naturel ou taillé), ou falaise.
 const edgeKind=(a,b,pass)=>a===b?'none':pass?'ramp':(a===0||b===0)&&(a-b===1||b-a===1)?'shore':'cliff';

 function create(seed,options={}){
  const world=O.create(seed,options.open||{}),effects=options.effects||{},detailVersion=options.detailVersion??R.detailVersion,home=world.home;
  // O9 : la cité de la campagne (carte de 192 m, D-O5) occupe tout son cadre autour du site de fondation ; aucun lot, arbre
  // ni rocher régional n'y est posé (le plat garanti de 64 m n'en couvrait que le centre).
  const cityHalf=Math.max(home.size,C.OpenWorld217Rules?.frame||0)/2,city={canton:home.canton,minX:home.x-cityHalf,maxX:home.x+cityHalf,minY:home.y-cityHalf,maxY:home.y+cityHalf};
  const stats={places:0,placed:0,unfit:0,plans:0,details:0,chunks:0},refusals={};
  const refuse=reason=>{refusals[reason]=(refusals[reason]||0)+1;return false;};
  const lru=(map,key,cap,build)=>{if(map.has(key)){const v=map.get(key);map.delete(key);map.set(key,v);return v;}const v=build();map.set(key,v);while(map.size>cap)map.delete(map.keys().next().value);return v;};
  const infos=new Map(),plans=new Map(),details=new Map(),chunks=new Map();

  // --- Mailles, paliers et arêtes, en coordonnées monde --------------------
  const inside=(x,y,pad=0)=>finite(x,y)&&world.contains(x,y,pad);
  const own=n=>Math.floor(n/N);
  function cellInfo(gx,gy){const kx=own(gx),ky=own(gy);if(kx<-K.RULES.maxCoordinate||kx>K.RULES.maxCoordinate||ky<-K.RULES.maxCoordinate||ky>K.RULES.maxCoordinate)return null;return{info:info(kx,ky),i:(gy-ky*N)*N+(gx-kx*N)};}
  function levelCell(gx,gy){const c=cellInfo(gx,gy);return c?c.info.canton.levels[c.i]:-1;}
  function waterCell(gx,gy){const c=cellInfo(gx,gy);return c?c.info.canton.water[c.i]:W.sea;}
  // Bit de passage d'une arête : porté par la maille ouest (arête est, bit 1) ou nord (arête sud, bit 2).
  function passCell(gx,gy,dir){const c=cellInfo(gx,gy);return c?c.info.canton.passes[c.i]>>dir&1:0;}
  const levelAt=(x,y)=>inside(x,y)?levelCell(Math.floor(x/CELL),Math.floor(y/CELL)):-1;
  // Arêtes de changement de palier qui touchent le rectangle, dans un ordre fixe.
  function edgesIn(l,t,r,b){
   const out=[],x0=Math.floor(l/CELL)-1,x1=Math.floor(r/CELL),y0=Math.floor(t/CELL)-1,y1=Math.floor(b/CELL);
   for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){
    const a=levelCell(gx,gy);if(a<0)continue;
    // Arête est : verticale, x = (gx+1)·maille.
    {const x=(gx+1)*CELL,ya=gy*CELL,yb=ya+CELL;if(x>=l&&x<=r&&yb>=t&&ya<=b){const v=levelCell(gx+1,gy);if(v>=0&&v!==a){const kind=edgeKind(a,v,passCell(gx,gy,0));out.push({kind,axis:'v',gx,gy,a:{x,y:ya},b:{x,y:yb},before:a,after:v});}}}
    // Arête sud : horizontale, y = (gy+1)·maille.
    {const y=(gy+1)*CELL,xa=gx*CELL,xb=xa+CELL;if(y>=t&&y<=b&&xb>=l&&xa<=r){const v=levelCell(gx,gy+1);if(v>=0&&v!==a){const kind=edgeKind(a,v,passCell(gx,gy,1));out.push({kind,axis:'h',gx,gy,a:{x:xa,y},b:{x:xb,y},before:a,after:v});}}}
   }
   return out;
  }
  const cliffs=(l,t,r,b)=>edgesIn(l,t,r,b).filter(e=>e.kind==='cliff');

  // --- Mobilier d'un canton : index des routes et de l'eau, lieux complets ---
  function index(list,box,pad,item){const x0=Math.max(0,Math.floor((Math.min(item.a.x,item.b.x)-pad-box.x)/CELL)),x1=Math.min(N-1,Math.floor((Math.max(item.a.x,item.b.x)+pad-box.x)/CELL)),y0=Math.max(0,Math.floor((Math.min(item.a.y,item.b.y)-pad-box.y)/CELL)),y1=Math.min(N-1,Math.floor((Math.max(item.a.y,item.b.y)+pad-box.y)/CELL));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=y*N+x;(list[k]||(list[k]=[])).push(item);}}
  function info(kx,ky){return lru(infos,kx+','+ky,R.placeCache,()=>furnish(kx,ky));}
  function furnish(kx,ky){
   const c=world.canton(kx,ky),box=c.bounds,segs=[],rivers=[],roadCells=new Array(N*N),riverCells=new Array(N*N),pad=reach;
   for(const r of c.roads)for(let k=1;k<r.points.length;k++){const s={id:r.id+'#'+k,road:r.id,a:r.points[k-1],b:r.points[k],width:r.width};segs.push(s);index(roadCells,box,pad+r.width/2,s);}
   for(const r of c.rivers)for(let k=1;k<r.points.length;k++){const s={id:r.id+'#'+k,a:r.points[k-1],b:r.points[k],width:r.width,kind:r.kind};rivers.push(s);index(riverCells,box,pad+r.width/2,s);}
   // Paliers du canton et de sa couronne de mailles voisines, lus dans le même champ que le générateur.
   const M=N+2,halo=new Int8Array(M*M);for(let y=-1;y<=N;y++)for(let x=-1;x<=N;x++)halo[(y+1)*M+x+1]=x>=0&&y>=0&&x<N&&y<N?c.levels[y*N+x]:Gen.levelAt(seed,box.x+(x+.5)*CELL,box.y+(y+.5)*CELL);
   const self={canton:c,segs,rivers,roadCells,riverCells,halo,places:[],byIndex:new Map()};
   // Les lieux sont meublés dans l'ordre des indices ; chacun ne voit que les précédents du même canton.
   for(const s of c.sites){stats.places++;const p=fit(self,s);if(p){self.places.push(p);self.byIndex.set(K.parseEntity(s.id).index,p);stats.placed++;}else stats.unfit++;}
   self.places=Object.freeze(self.places);return self;
  }
  const localCell=(self,x,y)=>{const gx=Math.floor((x-self.canton.bounds.x)/CELL),gy=Math.floor((y-self.canton.bounds.y)/CELL);return gx<0||gy<0||gx>=N||gy>=N?-1:gy*N+gx;};
  const lot=p=>{const centre=F.global(p,p.w/2,p.h/2+(R.lot.back-R.lot.front)/2);return{x:centre.x,y:centre.y,w:p.w+2*R.lot.side,h:p.h+R.lot.front+R.lot.back,a:p.a};};
  const corridorHits=(drive,box)=>F.segmentRect(drive.a,drive.b,{x:box.l-drive.width/2,y:box.t-drive.width/2,w:box.r-box.l+drive.width,h:box.b-box.t+drive.width});

  // Un lieu candidat devient un lieu complet : genre, programme, emprise, accès, occupants.
  function fit(self,s){
   const c=self.canton,ent=K.parseEntity(s.id),def=BY[s.biome],road=c.roads.find(r=>r.id===s.road);
   if(!def||!road||!ent)return null;
   const pool=Object.fromEntries(Object.entries(def.buildings).filter(([t,w])=>F.BY[t]&&w>0)),first=weighted(pool,unit(seed,ent.cx,ent.cy,'lieu-genre-'+ent.index));
   const rest=Object.keys(pool).filter(t=>t!==first).sort((a,b)=>pool[b]-pool[a]||(a<b?-1:1));
   const order=[...new Set([first,...rest].filter(Boolean).slice(0,R.typeTries).concat(R.fallback.filter(t=>F.BY[t])))];
   const town=s.town?c.towns.find(t=>t.id===s.town)||null:null,aliases=Object.freeze([def.id,...(def.aliases||[])]);
   const q=nearestOn(road.points,s);if(!q)return null;
   let ux=s.x-q.x,uy=s.y-q.y;const len=far(ux,uy);if(len<1e-6){ux=0;uy=1;}else{ux/=len;uy/=len;}
   const a=Math.atan2(-ux,uy),distance=far(s.x-home.x,s.y-home.y);
   for(const type of order){
    const legacy=F.BY[type],proto={id:s.id,type,codex:legacy.codex,generation:12,biome:def.id,biomeAliases:aliases};
    const context={biome:def.id,biomeAliases:aliases,townKind:town?.kind};
    const card=X.forParcel(seed,proto,context),preset=card&&X.enabled(card,context)?X.preset('codex3000-'+card.id.slice(3)):null;
    // Programme natif du codex d'abord (plan `floor`), sinon le plan historique du genre.
    for(const d of preset?[{...preset,programme:card},{...legacy,programme:null}]:[{...legacy,programme:null}]){
     const off=road.width/2+R.setback+d.h/2,p={id:s.id,type:d.id,x:q.x+ux*off,y:q.y+uy*off,a,w:d.w,h:d.h,levels:d.levels,codex:d.programme?d.programme.id:d.codex,road:road.id,generation:12};
     const placed=check(self,s,p,road);if(!placed)continue;
     const occupancy=S.roll({seed,id:p.id,biome:def.spawnBiome,distance});
     Object.assign(p,{name:(d.programme?d.programme.name.slice(0,70):legacy.name)+' · '+(town?town.name:def.name),canton:c.id,level:s.level,biome:def.id,biomeAliases:aliases,town:town?town.id:null,townKind:town?town.kind:null,
      ...(d.programme?{programme3000:d.programme.id,family:d.programme.family}:{}),
      occupation:occupancy.kind,distanceBand:occupancy.band,zone:town?'centre':'activite',sector:c.id,frontier131:{role:occupancy.kind==='allied'?'relay':occupancy.kind==='infected'?'contested':'waypoint'},anchor:Object.freeze({x:s.x,y:s.y})});
     p.parking=F.parking(p);p.outdoor=F.outdoor(p);
     return deepFreeze(p);
    }
   }
   return null;
  }
  // Veto physique d'une emprise : dans le canton (hors couture), hors du site de fondation,
  // hors des autres lots, sur un seul palier sec, à l'écart des routes et des rivières, avec
  // un accès de même palier que frontage174 sait raccorder à la route.
  function check(self,s,p,road){
   const c=self.canton,box=c.bounds,m=R.seamMargin,body=lot(p),b=F.bounds(body);
   if(b.l<box.x+m||b.t<box.y+m||b.r>box.x+SIZE-m||b.b>box.y+SIZE-m)return refuse('couture');
   if(c.id===home.canton&&F.overlap(b,{l:city.minX-R.homeMargin,r:city.maxX+R.homeMargin,t:city.minY-R.homeMargin,b:city.maxY+R.homeMargin}))return refuse('fondation');
   if(self.places.some(q=>F.overlap(b,q.reserve,R.parcelGap)))return refuse('voisin');
   for(let gy=Math.floor((b.t-box.y)/CELL);gy<=Math.floor((b.b-box.y)/CELL);gy++)for(let gx=Math.floor((b.l-box.x)/CELL);gx<=Math.floor((b.r-box.x)/CELL);gx++){
    const i=gy*N+gx;if(!F.obb(body,{x:box.x+(gx+.5)*CELL,y:box.y+(gy+.5)*CELL,w:CELL,h:CELL,a:0}))continue;
    if(c.levels[i]!==s.level)return refuse('palier');if(c.water[i])return refuse('eau');}
   // Routes et rivières voisines du lot, lues dans l'index par mailles (ordre de la liste conservé).
   const nearRoads=new Set(),nearRivers=new Set();
   for(let gy=Math.max(0,Math.floor((b.t-box.y)/CELL));gy<=Math.min(N-1,Math.floor((b.b-box.y)/CELL));gy++)for(let gx=Math.max(0,Math.floor((b.l-box.x)/CELL));gx<=Math.min(N-1,Math.floor((b.r-box.x)/CELL));gx++){for(const r of self.roadCells[gy*N+gx]||[])nearRoads.add(r);for(const r of self.riverCells[gy*N+gx]||[])nearRivers.add(r);}
   const P=R.prohibited,forbid={x:-P.side,y:-P.front,w:p.w+2*P.side,h:p.h+P.front+P.back};
   for(const r of nearRoads){const pad=r.width/2,area={x:forbid.x-pad,y:forbid.y-pad,w:forbid.w+2*pad,h:forbid.h+2*pad};if(F.segmentRect(F.local(p,r.a.x,r.a.y),F.local(p,r.b.x,r.b.y),area))return refuse('route');}
   const L={x:-R.lot.side,y:-R.lot.front,w:p.w+2*R.lot.side,h:p.h+R.lot.front+R.lot.back};
   for(const r of nearRivers){const pad=r.width/2+R.riverClearance,area={x:L.x-pad,y:L.y-pad,w:L.w+2*pad,h:L.h+2*pad};if(F.segmentRect(F.local(p,r.a.x,r.a.y),F.local(p,r.b.x,r.b.y),area))return refuse('riviere');}
   const front=F.global(p,p.w/2,-R.drive.front),near=nearestOn(road.points,front);if(!near)return false;
   p.drive={a:{x:near.x,y:near.y},b:F.global(p,p.w/2,0),width:R.drive.width};p.reserve=b;
   const dl=far(p.drive.b.x-p.drive.a.x,p.drive.b.y-p.drive.a.y),steps=Math.max(1,Math.ceil(dl/R.drive.step));
   for(let k=0;k<=steps;k++){const x=p.drive.a.x+(p.drive.b.x-p.drive.a.x)*k/steps,y=p.drive.a.y+(p.drive.b.y-p.drive.a.y)*k/steps,i=localCell(self,x,y);if(i<0||c.levels[i]!==s.level||c.water[i]===W.sea||c.water[i]===W.lake)return refuse('acces');}
   if(self.places.some(q=>corridorHits(p.drive,q.reserve)||corridorHits(q.drive,b)))return refuse('acces-voisin');
   // Raccord de frontage174 sur les seules routes voisines de l'accès, comme son index par cases.
   const close=new Set(),reach=CELL/2;for(let gy=Math.floor((Math.min(p.drive.a.y,p.drive.b.y)-reach-box.y)/CELL);gy<=Math.floor((Math.max(p.drive.a.y,p.drive.b.y)+reach-box.y)/CELL);gy++)for(let gx=Math.floor((Math.min(p.drive.a.x,p.drive.b.x)-reach-box.x)/CELL);gx<=Math.floor((Math.max(p.drive.a.x,p.drive.b.x)+reach-box.x)/CELL);gx++)if(gx>=0&&gy>=0&&gx<N&&gy<N)for(const r of self.roadCells[gy*N+gx]||[])close.add(r);
   const join=Fr.resolve(p,self.segs.filter(r=>close.has(r)));if(!join.ok)return refuse('raccord');
   p.connection=join.connection;p.surface=join.surface;
   return true;
  }
  function deepFreeze(o){for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);return Object.freeze(o);}

  // --- Lieux ----------------------------------------------------------------
  // Lieu complet nommé par son identifiant ; un candidat sans emprise valable n'est pas un lieu.
  function site(id){const e=K.parseEntity(id);if(!e||e.kind!=='site')return undefined;const s=info(e.cx,e.cy);const p=s.byIndex.get(e.index);return p&&p.id===id?p:undefined;}
  const cantonsIn=(l,t,r,b)=>{const a=K.at(Math.max(world.axisMin(),l),Math.max(world.axisMin(),t)),z=K.at(Math.min(world.axisMax(),r),Math.min(world.axisMax(),b)),out=[];for(let cy=a.cy;cy<=z.cy;cy++)for(let cx=a.cx;cx<=z.cx;cx++)out.push(info(cx,cy));return out;};
  // Même critère que la région finie (frontier-world.js, `sitesNear`) : centre ou emprise
  // tournée à `radius` au plus ; ordre canonique (canton par ligne puis colonne, puis rang).
  function sitesNear(x,y,radius){
   if(!(radius>=0)||radius>O.RULES.nearMaxRadius)throw Error('Rayon de voisinage invalide.');
   if(!inside(x,y))return[];const rr=radius*radius,out=[];
   for(const s of cantonsIn(x-radius,y-radius,x+radius,y+radius))for(const p of s.places){if(!(far(p.x-x,p.y-y)>radius)){out.push(p);continue;}const l=F.local(p,x,y),dx=Math.max(-l.x,0,l.x-p.w),dy=Math.max(-l.y,0,l.y-p.h);if(!(dx*dx+dy*dy>rr))out.push(p);}
   return out;
  }
  // Lieux dont le lot touche le carré de côté 2r autour du point (phase large des collisions).
  function nearPOI(x,y,r=80){if(!inside(x,y))return[];const box={l:x-r,r:x+r,t:y-r,b:y+r},out=[];for(const s of cantonsIn(box.l,box.t,box.r,box.b))for(const p of s.places)if(F.overlap(box,p.reserve))out.push(p);return out;}
  const threatCount=p=>['allied','empty'].includes(p.occupation)?0:1+F.hash(seed,p.id,'threat')%4;
  // Occupants d'un lieu : même nombre et même étage que le registre des ennemis régionaux
  // (`P…:eN`, niveau `levels[hash(id, N) % n]`), profil tiré du milieu du lieu.
  function occupants(p){const out=[];for(let n=0;n<threatCount(p);n++){const id=p.id+':e'+n,kind=B.weighted(BY[p.biome].enemies,seed,'enemy',id);out.push(Object.freeze({id,site:p.id,z:p.levels[F.hash(p.id,n)%p.levels.length],kind,health:ENEMIES[kind].health}));}return Object.freeze(out);}
  function plan(p,z=0){
   if(!p||!p.levels.includes(z))throw Error('Étage absent');
   return lru(plans,p.id+':'+z,R.planCache,()=>{stats.plans++;return p.programme3000?{...X.floor(p.programme3000,seed,z,p.id),entry:F.global(p,p.w/2,-1),exit:F.global(p,p.w/2,p.h+1)}:F.plan(p,z);});
  }
  // Détails d'un lieu, par la chaîne des lieux natifs du codex de la région finie, au niveau
  // de détail des campagnes neuves ; paresseux et mis en cache comme les plans.
  function detailAt(p,z=0){
   if(!p||!p.levels.includes(z))return{interior:[],outdoor:[],variant:null};
   return lru(details,p.id+':'+z,R.detailCache,()=>{
    stats.details++;const programme=p.programme3000?X.get(p.programme3000):X.forParcel(seed,p,{biome:p.biome,biomeAliases:p.biomeAliases,townKind:p.townKind||undefined}),pl=plan(p,z),o={seed,p,z,plan:pl};
    let detail=D157.make(seed,p,z,pl,{story:X.programmeProps(programme?.state)||[],family:X.detailFamily(programme?.family)});
    if(detailVersion>=2&&programme)detail=X.enrich({...o,detail,programme:programme.id,shapes:D157.objects});
    let d=X.dress?.({...o,detail})||detail;const step=(v,fn)=>{if(detailVersion>=v&&programme)d=fn({...o,detail:d,programme:programme.id,detailVersion});};
    step(3,X.anchored);step(4,X.quantities);step(5,X.ensembles);step(6,X.fill);step(7,X.infill);step(8,X.stations);step(9,X.gardens);step(10,X.packing);
    if(detailVersion>=11&&programme?.extension===158)d=X.furnish({...o,detail:d,programme:programme.id});
    step(12,X.complete);
    const colliders160=Object.freeze({interior:Object.freeze(d.interior.filter(q=>q.solid)),outdoor:Object.freeze(d.outdoor.filter(q=>q.solid))});
    return Object.freeze({...d,colliders160,programme3000:programme?.id||null,programmeState:programme?.state||null});
   });
  }
  const solids=(p,z,part,optical)=>{const items=detailAt(p,z).colliders160?.[part]||[];return optical?items.filter(q=>q.opaque!==false):items;};

  // --- Arbres et rochers par morceaux de 256 m, à clé signée ---------------
  // Flux nouveaux : un par morceau, nommé dans son canton (`arbres-j`, `roches-j`).
  const PER=SIZE/R.chunk;
  function clearOf(self,x,y,pad,rule){
   const c=self.canton,i=localCell(self,x,y);if(i<0||!c.levels[i]||c.water[i])return false;
   const M=N+2,h=self.halo,g=(Math.floor(i/N)+1)*M+i%N+1,l=c.levels[i],e=rule.edgeClearance+pad,ox=x-c.bounds.x-(i%N)*CELL,oy=y-c.bounds.y-Math.floor(i/N)*CELL;
   // Ni au bord d'une falaise ni sur une rampe : à l'écart de toute arête de changement de palier.
   const W0=ox<e,E0=CELL-ox<e,N0=oy<e,S0=CELL-oy<e;
   if(W0&&h[g-1]!==l||E0&&h[g+1]!==l||N0&&h[g-M]!==l||S0&&h[g+M]!==l||W0&&N0&&h[g-M-1]!==l||E0&&N0&&h[g-M+1]!==l||W0&&S0&&h[g+M-1]!==l||E0&&S0&&h[g+M+1]!==l)return false;
   for(const r of self.roadCells[i]||[])if(pointSegment(x,y,r.a.x,r.a.y,r.b.x,r.b.y)<r.width/2+rule.roadClearance+pad)return false;
   for(const r of self.riverCells[i]||[])if(pointSegment(x,y,r.a.x,r.a.y,r.b.x,r.b.y)<r.width/2+rule.waterClearance+pad)return false;
   for(const p of self.places)if(x>p.reserve.l-pad&&x<p.reserve.r+pad&&y>p.reserve.t-pad&&y<p.reserve.b+pad)return false;
   const q=R.homeClearance+pad;if(c.id===home.canton&&x>city.minX-q&&x<city.maxX+q&&y>city.minY-q&&y<city.maxY+q)return false;
   return true;
  }
  function chunk(cx,cy){
   const empty={cx,cy,trees:[],rocks:[]};if(!Number.isInteger(cx)||!Number.isInteger(cy))return empty;
   const kx=Math.floor(cx/PER),ky=Math.floor(cy/PER);if(Math.abs(kx)>K.RULES.maxCoordinate||Math.abs(ky)>K.RULES.maxCoordinate)return empty;
   return lru(chunks,cx+','+cy,R.chunkCache,()=>{
    stats.chunks++;const self=info(kx,ky),c=self.canton,j=(cy-ky*PER)*PER+(cx-kx*PER),trees=[],rocks=[];
    for(const[kind,rule,list,name]of [['tree',R.trees,trees,'arbres'],['rock',R.rocks,rocks,'roches']]){
     const draw=K.stream(seed,kx,ky,name+'-'+j),n=rule.grid,step=R.chunk/n;
     for(let i=0;i<n*n;i++){
      // Huit tirages par candidat, toujours : un rejet ne décale jamais les suivants.
      const u=[draw(),draw(),draw(),draw(),draw(),draw(),draw(),draw()],x=cx*R.chunk+(i%n+u[0])*step,y=cy*R.chunk+(Math.floor(i/n)+u[1])*step;
      const cell=localCell(self,x,y);if(cell<0)continue;const def=DEFS[c.biomes[cell]];
      if(u[2]>=(kind==='tree'?def.treeChance:def.rockChance*rule.chance))continue;
      const species=weighted(kind==='tree'?def.trees:def.rocks,u[3]),spec=kind==='tree'?TREES[species]:ROCKS[species];if(!spec)continue;
      const r=spec.radius[0]+u[4]*(spec.radius[1]-spec.radius[0]),canopy=kind==='tree'?spec.canopy[0]+u[5]*(spec.canopy[1]-spec.canopy[0]):0;
      if(!clearOf(self,x,y,kind==='tree'?canopy+.6:r+.6,rule))continue;
      if(list.some(q=>far(q.x-x,q.y-y)<rule.spacing+(kind==='rock'?r:0))||kind==='rock'&&trees.some(t=>far(t.x-x,t.y-y)<t.r+r+rule.spacing))continue;
      const range=kind==='tree'?spec.wood:spec.stone,amount=range[0]+Math.floor(u[7]*(range[1]-range[0]+1));
      list.push(Object.freeze({id:K.entityId(kx,ky,kind==='tree'?'arbre':'roche',j*rule.slots+i),x,y,r,...(kind==='tree'?{canopy}:{}),a:u[6]*Math.PI*2,kind,species,biome:def.id,resource:kind==='tree'?'wood':'stone',amount,label:spec.name}));
     }
    }
    return Object.freeze({cx,cy,canton:c.id,trees:Object.freeze(trees),rocks:Object.freeze(rocks)});
   });
  }
  function around(x,y,r=100){const out=[];for(let cy=Math.floor((y-r)/R.chunk);cy<=Math.floor((y+r)/R.chunk);cy++)for(let cx=Math.floor((x-r)/R.chunk);cx<=Math.floor((x+r)/R.chunk);cx++)out.push(chunk(cx,cy));return out;}
  const sceneryRadius=t=>{const depleted=(effects.resourceTaken?.(t.id)||0)>=t.amount-.001;return depleted?(t.kind==='rock'?0:Math.min(t.r,.18)):t.r;};

  // --- Eau : règles des rivières de G8+ (tout plan d'eau bloque, sauf un pont) ----
  // Index par mailles de chaque canton : une route ou une rivière y est rangée dans toutes les
  // mailles à moins de `reach` mètres de son tracé ; un canton voisin porte le prolongement.
  const reach=R.trees.roadClearance+R.rocks.roadClearance+10;
  const at=(x,y)=>{const c=cellInfo(Math.floor(x/CELL),Math.floor(y/CELL));return c&&{s:c.info,i:c.i};};
  function onBridge(x,y){const c=at(x,y);if(!c)return false;for(const r of c.s.roadCells[c.i]||[])if(pointSegment(x,y,r.a.x,r.a.y,r.b.x,r.b.y)<=r.width/2)return true;return false;}
  function waterBlocked(x,y,r=0){
   if(onBridge(x,y))return false;
   for(let gy=Math.floor((y-r)/CELL);gy<=Math.floor((y+r)/CELL);gy++)for(let gx=Math.floor((x-r)/CELL);gx<=Math.floor((x+r)/CELL);gx++){
    const w=waterCell(gx,gy);if(w!==W.sea&&w!==W.lake)continue;const dx=Math.max(gx*CELL-x,0,x-(gx+1)*CELL),dy=Math.max(gy*CELL-y,0,y-(gy+1)*CELL);if(far(dx,dy)<=r)return true;}
   const list=r<=reach?(at(x,y)?.s.riverCells[at(x,y).i]||[]):cantonsIn(x-r-16,y-r-16,x+r+16,y+r+16).flatMap(s=>s.rivers);
   for(const w of list)if(pointSegment(x,y,w.a.x,w.a.y,w.b.x,w.b.y)<=w.width/2+r)return true;
   return false;
  }
  // --- Relief : une falaise bloque tout disque qui la touche, une rampe se franchit ---
  const terrainBlocked=(x,y,r=R.footRadius)=>cliffs(x-r,y-r,x+r,y+r).some(e=>pointSegment(x,y,e.a.x,e.a.y,e.b.x,e.b.y)<Math.max(r,1e-9));
  const terrainLine=(a,b,r=R.footRadius)=>cliffs(Math.min(a.x,b.x)-r,Math.min(a.y,b.y)-r,Math.max(a.x,b.x)+r,Math.max(a.y,b.y)+r).some(e=>segmentSegment(a,b,e.a,e.b)<Math.max(r,1e-9));
  const lineLength=(a,b)=>{const d=far(b.x-a.x,b.y-a.y);if(d>R.maxLine)throw Error('Segment régional trop long.');return d;};
  // D-O1 : vrai si aucune arête de falaise montante, plus haute que le palier du tireur, ne se
  // dresse entre le tireur et la cible. Le tireur est au palier de sa maille.
  function lineOfSight(from,to){
   if(!from||!to||!inside(from.x,from.y)||!inside(to.x,to.y))return false;lineLength(from,to);
   const shooter=levelAt(from.x,from.y),dx=to.x-from.x,dy=to.y-from.y;
   for(const e of cliffs(Math.min(from.x,to.x),Math.min(from.y,to.y),Math.max(from.x,to.x),Math.max(from.y,to.y))){
    const sign=e.axis==='v'?dx:dy;if(!sign)continue;
    const touch=segmentsCross(from,to,e.a,e.b)||pointSegment(e.a.x,e.a.y,from.x,from.y,to.x,to.y)===0||pointSegment(e.b.x,e.b.y,from.x,from.y,to.x,to.y)===0||pointSegment(from.x,from.y,e.a.x,e.a.y,e.b.x,e.b.y)===0||pointSegment(to.x,to.y,e.a.x,e.a.y,e.b.x,e.b.y)===0;
    if(!touch)continue;const before=sign>0?e.before:e.after,after=sign>0?e.after:e.before;
    if(SIGHT.blocks(shooter,before,after))return false;
   }
   return true;
  }

  // --- Collisions communes, aux conventions de la région finie ----------------
  function blocked(x,y,r=R.footRadius,z=0,insideId=null,ignore=null,optical=false,naturalWaterIgnored=false){
   if(!finite(x,y)||!inside(x,y,r))return true;
   if(z===0&&!optical){if(terrainBlocked(x,y,r))return true;if(!naturalWaterIgnored&&waterBlocked(x,y,r))return true;}
   if(z!==0){const p=site(insideId);if(!p||!p.levels.includes(z))return true;const q=F.local(p,x,y);if(q.x<r||q.y<r||q.x>p.w-r||q.y>p.h-r)return true;}
   for(const p of nearPOI(x,y,r+3)){
    if(z!==0&&p.id!==insideId||!p.levels.includes(z))continue;const q=F.local(p,x,y),destroyed=!!effects.structureDestroyed?.(p.id);
    if(q.x>-r&&q.y>-r&&q.x<p.w+r&&q.y<p.h+r){const pl=plan(p,z);if(!destroyed&&pl.walls.some(o=>F.circleRect(q.x,q.y,r,o)))return true;if(pl.objects.some(o=>o.id!==ignore&&F.circleRect(q.x,q.y,r,o)))return true;if(solids(p,z,'interior',optical).some(o=>o.id!==ignore&&F.circleRect(q.x,q.y,r,o)))return true;}
    if(z===0){for(const o of p.outdoor||[])if(o.id!==ignore&&F.circleRect(q.x,q.y,r,o))return true;for(const o of solids(p,0,'outdoor',optical))if(o.id!==ignore&&F.circleRect(q.x,q.y,r,o))return true;
     for(const car of p.parking){if(car.id===ignore)continue;const v=F.local(car,x,y);if(F.circleRect(v.x,v.y,r,{x:0,y:0,w:car.w,h:car.h}))return true;}}
   }
   if(z===0)for(const c of around(x,y,r+6))for(const t of [...c.trees,...c.rocks])if(t.id!==ignore&&sceneryRadius(t)>0&&far(t.x-x,t.y-y)<sceneryRadius(t)+r)return true;
   return false;
  }
  // Balayage d'un disque : mouvement (falaises et eau), vue et tir (règle D-O1), puis objets.
  function line(a,b,z=0,insideId=null,ignore=null,r=.05,purpose='optical'){
   if(!a||!b||!Number.isFinite(a.x+a.y+b.x+b.y+r)||r<0||!inside(a.x,a.y,r)||!inside(b.x,b.y,r))return false;
   const length=lineLength(a,b);
   if(z===0&&purpose==='movement'){if(terrainLine(a,b,r))return false;const n=Math.max(1,Math.ceil(length/R.lineStep));for(let k=0;k<=n;k++)if(waterBlocked(a.x+(b.x-a.x)*k/n,a.y+(b.y-a.y)*k/n,r))return false;}
   if(z===0&&purpose!=='movement'&&!lineOfSight(a,b))return false;
   if(length<1e-6)return!blocked(b.x,b.y,r,z,insideId,ignore,purpose!=='movement');
   const circle=(p,radius)=>pointSegment(p.x,p.y,a.x,a.y,b.x,b.y)<radius-1e-9;
   const rect=(u,v,o)=>F.segmentRect(u,v,{x:o.x-r,y:o.y,w:o.w+2*r,h:o.h})||F.segmentRect(u,v,{x:o.x,y:o.y-r,w:o.w,h:o.h+2*r})||r>0&&[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]].some(([x,y])=>pointSegment(x,y,u.x,u.y,v.x,v.y)<r-1e-9);
   if(z!==0){const p=site(insideId);if(!p||!p.levels.includes(z))return false;for(const point of [a,b]){const q=F.local(p,point.x,point.y);if(q.x<r||q.y<r||q.x>p.w-r||q.y>p.h-r)return false;}}
   const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,reach=length/2+r+4,optical=purpose!=='movement';
   for(const p of nearPOI(mx,my,reach)){
    if(z!==0&&p.id!==insideId||!p.levels.includes(z))continue;
    // Le lot contient tout ce que le lieu pose : un segment qui ne le touche pas ne lit ni plan ni détail.
    if(z===0&&!F.segmentRect(a,b,{x:p.reserve.l-r,y:p.reserve.t-r,w:p.reserve.r-p.reserve.l+2*r,h:p.reserve.b-p.reserve.t+2*r}))continue;
    const u=F.local(p,a.x,a.y),v=F.local(p,b.x,b.y);
    if(F.segmentRect(u,v,{x:-r,y:-r,w:p.w+2*r,h:p.h+2*r})){const pl=plan(p,z);if(!effects.structureDestroyed?.(p.id)&&pl.walls.some(o=>rect(u,v,o)))return false;if(pl.objects.some(o=>o.id!==ignore&&rect(u,v,o)))return false;if(solids(p,z,'interior',optical).some(o=>o.id!==ignore&&rect(u,v,o)))return false;}
    if(z===0){if((p.outdoor||[]).some(o=>o.id!==ignore&&rect(u,v,o)))return false;if(solids(p,0,'outdoor',optical).some(o=>o.id!==ignore&&rect(u,v,o)))return false;for(const car of p.parking){if(car.id===ignore)continue;if(rect(F.local(car,a.x,a.y),F.local(car,b.x,b.y),{x:0,y:0,w:car.w,h:car.h}))return false;}}
   }
   if(z===0)for(const c of around(mx,my,reach))for(const items of [c.trees,c.rocks])for(const t of items)if(t.id!==ignore&&sceneryRadius(t)>0&&circle(t,sceneryRadius(t)+r))return false;
   return true;
  }
  // Voiture : aucune falaise sous la caisse, pas d'eau hors d'un pont, ni lot ni arbre.
  function vehicleClear(x,y,a,w=R.car.w,h=R.car.h){
   const car={x,y,w,h,a},pad=Math.max(w,h)/2+.5;if(!finite(x,y)||!inside(x,y,pad))return false;
   if(cliffs(x-pad,y-pad,x+pad,y+pad).some(e=>F.segmentRect(F.local(car,e.a.x,e.a.y),F.local(car,e.b.x,e.b.y),{x:0,y:0,w,h})))return false;
   const corners=[[0,0],[w,0],[w,h],[0,h]].map(([u,v])=>F.global(car,u,v));
   if(waterBlocked(x,y,0))return false;
   for(let i=0;i<4;i++){const p=corners[i],q=corners[(i+1)%4],n=Math.max(1,Math.ceil(far(q.x-p.x,q.y-p.y)/R.lineStep));for(let k=0;k<n;k++)if(waterBlocked(p.x+(q.x-p.x)*k/n,p.y+(q.y-p.y)*k/n,0))return false;}
   for(const p of nearPOI(x,y,pad)){const pl=plan(p,0),destroyed=!!effects.structureDestroyed?.(p.id);for(const o of [...(destroyed?[]:pl.walls),...pl.objects,...(p.outdoor||[]),...solids(p,0,'interior'),...solids(p,0,'outdoor')]){const centre=F.global(p,o.x+o.w/2,o.y+o.h/2);if(F.obb(car,{...centre,w:o.w,h:o.h,a:p.a}))return false;}for(const v of p.parking)if(F.obb(car,v))return false;}
   for(const c of around(x,y,7))for(const t of [...c.trees,...c.rocks]){const q=F.local(car,t.x,t.y),radius=sceneryRadius(t);if(radius>0&&F.circleRect(q.x,q.y,radius,{x:0,y:0,w,h}))return false;}
   return true;
  }
  function containers(x,y,r=3,z=0,insideId=null){const out=[];for(const p of nearPOI(x,y,r+8)){if(z!==0&&p.id!==insideId||!p.levels.includes(z))continue;for(const o of plan(p,z).objects){const point=F.global(p,o.x+o.w/2,o.y+o.h/2);if(far(point.x-x,point.y-y)<far(o.w,o.h)/2+r)out.push({...o,...point,worldAngle:p.a,poi:p.id,z});}if(z===0){for(const o of p.outdoor||[]){const point=F.global(p,o.x+o.w/2,o.y+o.h/2);if(far(point.x-x,point.y-y)<r+far(o.w,o.h)/2)out.push({...o,...point,worldAngle:p.a,poi:p.id,z:0});}for(const o of p.parking)if(far(x-o.x,y-o.y)<r+2.4)out.push({...o,poi:p.id,z:0});}}if(z===0)for(const c of around(x,y,r+5))for(const t of [...c.trees,...c.rocks])if(far(x-t.x,y-t.y)<r+t.r)out.push({...t,z:0});return out;}

  return Object.freeze({
   ...world,sitesVersion:R.version,
   site,candidate:world.site,sitesNear,nearPOI,threatCount,occupants,plan,detailAt,
   drive:p=>p?.drive||null,driveFor:p=>p?.surface||null,connectionFor:p=>p?.connection||p?.drive||null,
   chunk,around,blocked,line,vehicleClear,containers,
   opticalBlocked:(x,y,r=.05,z=0,insideId=null,ignore=null)=>blocked(x,y,r,z,insideId,ignore,true),
   movementLine:(a,b,z=0,insideId=null,ignore=null,r=R.footRadius)=>line(a,b,z,insideId,ignore,r,'movement'),
   lineOfSight,levelAt,edgesIn,terrainBlocked,waterBlocked,
   placesOf:(cx,cy)=>info(cx,cy).places,
   streamStats:()=>({...world.streamStats(),...stats,refusals:{...refusals},placeCache:infos.size,planCache:plans.size,detailCache:details.size,chunkCache:chunks.size})
  });
 }

 return Object.freeze({RULES:R,SIGHT,edgeKind,create});
});
