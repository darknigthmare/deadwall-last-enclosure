// Canton sec d'un monde sans bord, avec relief par paliers (docs/GAME_BIBLE.md §7.13,
// specs/monde-sans-bord/, tranche T2). Module pur et déterministe : pour (graine, cx, cy) il
// rend un canton de 1 024 m — paliers, falaises, milieux, eau, routes, lieux candidats —
// sans connaître ses voisins et sans dépendre de l'ordre de visite.
// Hors jeu : non chargé par index.html, lu par aucune génération (1 à 11), aucun flux existant.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallWorldCantonGen217=api;
})(globalThis,function(root){
 'use strict';
 const node=typeof require==='function';
 const C=root.DeadwallCore||(node?require('./core.js'):null);
 const K=root.DeadwallWorldCantons217||(node?require('./world-cantons217.js'):null);
 const R=C.WorldRelief217Rules,SIZE=K.SIZE,CELL=R.cell,N=SIZE/CELL,M=N+2,TOP=R.levels-1;
 if(!Number.isInteger(N)||N<8)throw Error('Maille de relief invalide.');
 const BIOMES=Object.freeze([...C.BiomeRules135.defs,...C.EcologyRules164.defs]),BIOME_IDS=Object.freeze(BIOMES.map(d=>d.id));
 const WATER=Object.freeze({none:0,sea:1,lake:2,river:3,stream:4});
 const CLASSES=Object.freeze(['regional','secondary','local']);
 // Racine carrée exacte plutôt que Math.hypot ou Math.pow : même résultat sur tout moteur.
 const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy);
 const clamp=(n,a,b)=>n<a?a:n>b?b:n,mod=(n,m)=>((n%m)+m)%m,unit=h=>h/4294967296;

 // --- Champs en coordonnées monde ---------------------------------------
 // Bruit de valeur sur treillis entier : continu partout, donc sans couture entre cantons.
 function lattice(seed,x,y){let h=(seed^Math.imul(x,0x27d4eb2d)^Math.imul(y,0x165667b1))>>>0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return((h^h>>>16)>>>0)/4294967296;}
 function noise(seed,x,y,scale){const u=x/scale,v=y/scale,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=lattice(seed,ix,iy),b=lattice(seed,ix+1,iy),c=lattice(seed,ix,iy+1),d=lattice(seed,ix+1,iy+1);return a+(b-a)*sx+(c+(d-c)*sx-a-(b-a)*sx)*sy;}
 // Sels de champ et mémoire de calcul par graine. La mémoire n'est qu'un accélérateur :
 // chaque valeur mémorisée est une fonction pure de sa clé.
 let memo=null;
 function ctx(seed){
  if(memo&&memo.seed===seed&&memo.count<60000)return memo;
  const salt=name=>K.subSeed(seed,0,0,name);
  memo={seed,count:0,relief:salt('relief'),detail:salt('relief-detail'),scarp:salt('relief-ressaut'),pass:salt('relief-col'),warpX:salt('relief-pli-x'),warpY:salt('relief-pli-y'),warm:salt('climat-chaleur'),wet:salt('climat-eau'),fine:salt('climat-detail'),dense:salt('habitat'),
   seamLow:new Map(),low:new Map(),drain:new Map(),flow:new Map(),waterSeam:new Map(),roadSeam:new Map()};
  return memo;
 }
 const keep=(m,map,key,value)=>{m.count++;map.set(key,value);return value;};
 // Altitude continue, en crans : champ de basse fréquence plus un ressaut raide.
 function altitudeOf(m,px,py){
  const f=R.field,q=R.pass,x=px+(noise(m.warpX,px,py,f.warpScale)-.5)*f.warpAmplitude,y=py+(noise(m.warpY,px,py,f.warpScale)-.5)*f.warpAmplitude;
  const n=noise(m.relief,x,y,f.scale)*(1-f.detailWeight)+noise(m.detail,x,y,f.detailScale)*f.detailWeight;
  let h=clamp(.5+(n-.5)*f.contrast,0,1)*f.span+f.offset;
  // Ressaut étroit : falaise. Là où le bruit de col est fort, il s'élargit en rampes.
  const band=noise(m.pass,px,py,q.scale)>q.threshold?q.wideBand:q.band;
  for(let k=0;k<R.escarpments.length;k++){const e=R.escarpments[k],t=clamp((noise(m.scarp+k,x,y,e.scale)-e.threshold)/band,0,1);h+=e.height*t*t*(3-2*t);}
  return clamp(h,0,R.levels-1e-6);
 }
 // Palier d'un point : celui de sa maille, lu au centre de la maille.
 const centre=n=>(Math.floor(n/CELL)+.5)*CELL;
 const levelOf=(m,x,y)=>Math.floor(altitudeOf(m,centre(x),centre(y)));
 function climateOf(m,x,y,h){
  const k=C.BiomeRules135.climate,q=R.climate,elevation=clamp((h-1)/(TOP-1),0,1);
  const channel=(salt,scale)=>clamp(.5+((noise(salt,x,y,scale)*(1-k.detailWeight)+noise(m.fine^salt,x,y,k.detailScale)*k.detailWeight)-.5)*k.contrast,0,1);
  return{temperature:clamp(channel(m.warm,k.temperatureScale)-q.coldHigh*(elevation-.5),0,1),moisture:clamp(channel(m.wet,k.moistureScale)+q.wetLow*(.5-elevation),0,1),elevation};
 }
 // Milieu : le plus proche des 16 milieux existants dans leur espace (chaleur, eau, altitude).
 function biomeIndex(c){let best=0,low=Infinity;for(let n=0;n<BIOMES.length;n++){const d=BIOMES[n],a=(c.temperature-d.climate[0])/d.spread[0],b=(c.moisture-d.climate[1])/d.spread[1],e=(c.elevation-d.climate[2])/d.spread[2],score=a*a+b*b+e*e;if(score<low){low=score;best=n;}}return best;}
 const seedOK=seed=>{if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Graine régionale invalide');};
 const pointOK=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Position de relief invalide.');};
 function altitude(seed,x,y){seedOK(seed);pointOK(x,y);return altitudeOf(ctx(seed),x,y);}
 function levelAt(seed,x,y){seedOK(seed);pointOK(x,y);return levelOf(ctx(seed),x,y);}
 function biomeAt(seed,x,y){seedOK(seed);pointOK(x,y);const m=ctx(seed),px=centre(x),py=centre(y);return BIOME_IDS[biomeIndex(climateOf(m,px,py,altitudeOf(m,px,py)))];}

 // --- Écoulement entre cantons ------------------------------------------
 // Point bas d'une couture, pris sur des points fixes : la rivière passe par la vallée.
 function seamLow(m,e){
  const found=m.seamLow.get(e.id);if(found)return found;
  const w=R.water;let best=null;
  for(let i=w.seamMargin;i<N-w.seamMargin;i+=w.seamStep){const t=(i+.5)*CELL,x=e.x*SIZE+(e.axis==='h'?t:0),y=e.y*SIZE+(e.axis==='v'?t:0),h=altitudeOf(m,x,y);if(!best||h<best.h)best={i,t,x,y,h};}
  return keep(m,m.seamLow,e.id,best);
 }
 // Altitude basse d'un canton : minimum de neuf points intérieurs et de ses quatre coutures.
 function lowOf(m,cx,cy){
  const key=cx+','+cy,found=m.low.get(key);if(found!==undefined)return found;
  let h=Infinity;for(let j=1;j<=3;j++)for(let i=1;i<=3;i++)h=Math.min(h,altitudeOf(m,(cx+i/4)*SIZE,(cy+j/4)*SIZE));
  for(const side of K.SIDES)if(K.neighbours(cx,cy).some(n=>n.side===side))h=Math.min(h,seamLow(m,K.edge(cx,cy,side)).h);
  return keep(m,m.low,key,h);
 }
 // Chaque canton s'écoule vers son voisin le plus bas ; sinon c'est une cuvette, ou la mer.
 function drainOf(m,cx,cy){
  const key=cx+','+cy,found=m.drain.get(key);if(found)return found;
  const h=lowOf(m,cx,cy);let out;
  if(h<1)out={low:h,to:null,sink:'sea'};
  else{let best=null;for(const n of K.neighbours(cx,cy)){const v=lowOf(m,n.cx,n.cy);if(v<h&&(!best||v<best.v))best={v,side:n.side};}out=best?{low:h,to:best.side,sink:null}:{low:h,to:null,sink:'lake'};}
  return keep(m,m.drain,key,Object.freeze(out));
 }
 // Débit : nombre de cantons drainés, lui compris, compté jusqu'à un plafond. Il ne décroît
 // jamais vers l'aval, donc un cours d'eau ne disparaît pas en route.
 function flowOf(m,cx,cy){
  const key=cx+','+cy,found=m.flow.get(key);if(found!==undefined)return found;
  const cap=R.water.capFlow,queue=[[cx,cy]];let count=0;
  while(queue.length&&count<cap){const[x,y]=queue.shift();count++;for(const n of K.neighbours(x,y)){const d=drainOf(m,n.cx,n.cy);if(d.to===K.OPPOSITE[n.side])queue.push([n.cx,n.cy]);}}
  return keep(m,m.flow,key,count);
 }
 const sideCell=(side,i)=>side==='north'?[i,0]:side==='south'?[i,N-1]:side==='west'?[0,i]:[N-1,i];
 // Les deux mailles qui se font face de part et d'autre d'une couture, à l'indice i.
 function seamLevels(m,e,i){const t=(i+.5)*CELL,x=e.x*SIZE,y=e.y*SIZE;return e.axis==='h'?[levelOf(m,x+t,y-CELL/2),levelOf(m,x+t,y+CELL/2)]:[levelOf(m,x-CELL/2,y+t),levelOf(m,x+CELL/2,y+t)];}
 // Passage d'eau d'une couture : même objet vu des deux cantons.
 function waterSeam(m,cx,cy,side){
  const e=K.edge(cx,cy,side),found=m.waterSeam.get(e.id);if(found!==undefined)return found;
  const n=K.neighbour(cx,cy,side),w=R.water;let up=null,down=null;
  if(drainOf(m,cx,cy).to===side){up={cx,cy};down={cx:n.cx,cy:n.cy};}
  else if(drainOf(m,n.cx,n.cy).to===n.opposite){up={cx:n.cx,cy:n.cy};down={cx,cy};}
  const flow=up?flowOf(m,up.cx,up.cy):0;
  if(flow<w.streamFlow)return keep(m,m.waterSeam,e.id,null);
  const p=seamLow(m,e),kind=flow>=w.riverFlow?'river':'stream',range=C.Hydrology165Rules.kinds[kind].width,first=kind==='river'?w.riverFlow:w.streamFlow,last=kind==='river'?w.capFlow:w.riverFlow;
  const pair=seamLevels(m,e,p.i),mouth=pair[0]===0||pair[1]===0,jitter=(unit(K.edgeSeed(m.seed,cx,cy,side,'eau'))-.5)*CELL*.5;
  const t=p.t+jitter,width=Math.round((range[0]+(range[1]-range[0])*clamp((flow-first)/Math.max(1,last-first),0,1))*10)/10;
  return keep(m,m.waterSeam,e.id,Object.freeze({edge:e.id,index:p.i,t,x:e.axis==='h'?e.x*SIZE+t:e.x*SIZE,y:e.axis==='v'?e.y*SIZE+t:e.y*SIZE,kind,width,flow,mouth,
   level:Math.min(TOP,Math.floor(lowOf(m,down.cx,down.cy))),from:K.id(up.cx,up.cy),to:K.id(down.cx,down.cy)}));
 }

 // --- Passages de route aux coutures ------------------------------------
 // Trame : une rangée sur `trunkEvery` porte une route d'est en ouest ; les autres cantons
 // se raccordent vers elle, par l'ouest ou droit vers la rangée la plus proche.
 function parentOf(m,cx,cy){const q=R.roads,r=mod(cy,q.trunkEvery);if(r===0)return'trunk';if(unit(K.subSeed(m.seed,cx,cy,'routes-raccord'))<q.westChance)return'west';return r*2<=q.trunkEvery?'north':'south';}
 function roadSeam(m,cx,cy,side){
  const e=K.edge(cx,cy,side),found=m.roadSeam.get(e.id);if(found!==undefined)return found;
  const q=R.roads,draw=K.rng(K.edgeSeed(m.seed,cx,cy,side,'routes'));let cls=null;
  // Les deux cantons de la couture, nommés depuis la couture elle-même.
  const a=e.axis==='h'?{cx:e.x,cy:e.y-1}:{cx:e.x-1,cy:e.y},b={cx:e.x,cy:e.y};
  if(e.axis==='v'){if(mod(e.y,q.trunkEvery)===0)cls='regional';else if(parentOf(m,b.cx,b.cy)==='west')cls='secondary';}
  else if(parentOf(m,b.cx,b.cy)==='north'||parentOf(m,a.cx,a.cy)==='south')cls='secondary';
  const extra=draw()<q.extraChance,pick=draw();
  if(!cls&&extra)cls='local';
  if(!cls)return keep(m,m.roadSeam,e.id,null);
  const water=waterSeam(m,cx,cy,side),flat=[],ramp=[];let sea=0;
  for(let i=q.seamMargin;i<N-q.seamMargin;i++){
   if(water&&Math.abs(i-Math.floor(water.t/CELL))<=1)continue;
   const[u,v]=seamLevels(m,e,i);if(u===0||v===0){sea++;continue;}
   if(u===v)flat.push([i,u,v]);else if(Math.abs(u-v)===1)ramp.push([i,u,v]);
  }
  const list=flat.length?flat:ramp;
  if(!list.length)return keep(m,m.roadSeam,e.id,Object.freeze({edge:e.id,blocked:sea?'mer':'falaise',class:cls}));
  const[i,u,v]=list[Math.floor(pick*list.length)],t=(i+.5)*CELL;
  return keep(m,m.roadSeam,e.id,Object.freeze({edge:e.id,blocked:null,index:i,t,x:e.axis==='h'?e.x*SIZE+t:e.x*SIZE,y:e.axis==='v'?e.y*SIZE+t:e.y*SIZE,class:cls,width:q.widths[cls],levels:Object.freeze([u,v])}));
 }

 // --- Plus court chemin sur la maille du canton -------------------------
 // step(de, vers) rend le coût du pas, ou -1 s'il est interdit. Rend les parents.
 const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1];
 function search(sources,step,moves=4){
  const dist=new Float64Array(N*N).fill(Infinity),parent=new Int16Array(N*N).fill(-1),keys=[],cells=[];
  // Tas binaire en deux tableaux parallèles (coût, maille).
  const push=(d,i)=>{let k=keys.length;keys.push(d);cells.push(i);while(k>0){const p=(k-1)>>1;if(keys[p]<=d)break;keys[k]=keys[p];cells[k]=cells[p];k=p;}keys[k]=d;cells[k]=i;};
  const pop=()=>{const last=keys.pop(),cell=cells.pop(),n=keys.length;if(!n)return;let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&keys[c+1]<keys[c])c++;if(keys[c]>=last)break;keys[k]=keys[c];cells[k]=cells[c];k=c;}keys[k]=last;cells[k]=cell;};
  for(const i of sources){dist[i]=0;push(0,i);}
  while(keys.length){const d=keys[0],i=cells[0];pop();if(d>dist[i])continue;const x=i%N,y=(i-x)/N;
   for(let k=0;k<moves;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx,c=step(i,j,k>3);if(c<0)continue;if(d+c<dist[j]){dist[j]=d+c;parent[j]=i;push(d+c,j);}}}
  return{dist,parent};
 }
 // Ligne adoucie (une passe de coins coupés), extrémités conservées.
 function soften(points){
  if(points.length<3)return points;
  const kept=[points[0]];for(let i=1;i<points.length-1;i++){const a=kept[kept.length-1],b=points[i],c=points[i+1];if(Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>1e-9)kept.push(b);}kept.push(points[points.length-1]);
  const out=[kept[0]];for(let i=0;i<kept.length-1;i++){const a=kept[i],b=kept[i+1];if(i>0)out.push({...a,x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25});if(i<kept.length-2)out.push({...b,x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75});}out.push(kept[kept.length-1]);
  return out;
 }
 const round=n=>Math.round(n*100)/100;

 // --- Génération d'un canton --------------------------------------------
 function generate(seed,cx,cy){
  seedOK(seed);const box=K.bounds(cx,cy),m=ctx(seed),id=K.id(cx,cy),W=R.water,Q=R.roads;
  const cellX=i=>box.x+(i%N+.5)*CELL,cellY=i=>box.y+(Math.floor(i/N)+.5)*CELL;
  // 1. Paliers, avec une maille de marge lue dans le même champ que les voisins.
  const high=new Float32Array(N*N),levels=new Uint8Array(N*N),grid=new Uint8Array(M*M),biomes=new Uint8Array(N*N),water=new Uint8Array(N*N);
  for(let y=-1;y<=N;y++)for(let x=-1;x<=N;x++){const px=box.x+(x+.5)*CELL,py=box.y+(y+.5)*CELL,h=altitudeOf(m,px,py);grid[(y+1)*M+x+1]=Math.floor(h);
   if(x>=0&&y>=0&&x<N&&y<N){const i=y*N+x;high[i]=h;levels[i]=Math.floor(h);biomes[i]=biomeIndex(climateOf(m,px,py,h));if(levels[i]===0)water[i]=WATER.sea;}}
  // 2. Écarts de palier vers l'est et vers le sud : 0 plat, ±1 rampe, au-delà falaise.
  const east=new Int8Array(N*N),south=new Int8Array(N*N);let cliffs=0,slopes=0;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,g=(y+1)*M+x+1;east[i]=grid[g+1]-grid[g];south[i]=grid[g+M]-grid[g];for(const d of [east[i],south[i]])if(d>1||d<-1)cliffs++;else if(d)slopes++;}
  // 3. Eau : passages aux coutures, puis tracé qui descend vers la sortie, le lac ou la mer.
  const crossings={},drain=drainOf(m,cx,cy),flow=flowOf(m,cx,cy),inlets=[];let outlet=null;
  for(const side of K.SIDES){
   const open=K.neighbours(cx,cy).some(n=>n.side===side),w=open?waterSeam(m,cx,cy,side):null,r=open?roadSeam(m,cx,cy,side):null;
   crossings[side]=Object.freeze({edge:open?K.edge(cx,cy,side).id:null,water:w&&Object.freeze({...w,flow:w.flow,direction:w.to===id?'in':'out'}),road:r&&!r.blocked?r:null,blocked:r&&r.blocked?r.blocked:null});
   if(w){const[ix,iy]=sideCell(side,Math.floor(w.t/CELL)),item={side,w,cell:iy*N+ix};if(w.to===id)inlets.push(item);else outlet=item;}
  }
  inlets.sort((a,b)=>b.w.flow-a.w.flow||K.SIDES.indexOf(a.side)-K.SIDES.indexOf(b.side));
  const rivers=[],lakes=[],eau=K.stream(seed,cx,cy,'eau'),wobble=i=>lattice(m.detail^0x51ed,box.x/CELL+i%N,box.y/CELL+Math.floor(i/N))*W.meander;
  const seaCells=[];for(let i=0;i<N*N;i++)if(levels[i]===0)seaCells.push(i);
  let targets=null,mode=null,floor=0;
  if(outlet){targets=[outlet.cell];mode='outlet';floor=outlet.w.level;}
  else if(drain.sink==='sea'&&seaCells.length){targets=seaCells;mode='sea';}
  else if(drain.sink){
   // Cuvette : lac au point le plus bas de l'intérieur, entièrement contenu dans le canton.
   let c=-1;for(let y=W.lakeMargin;y<N-W.lakeMargin;y++)for(let x=W.lakeMargin;x<N-W.lakeMargin;x++){const i=y*N+x;if(levels[i]>0&&(c<0||high[i]<high[c]))c=i;}
   if(c>=0){
    const kind=flow>=3?'lake':'pond',span=C.Hydrology165Rules.basins[kind].radius,r=round(span[0]+(span[1]-span[0])*clamp((flow-1)/(W.capFlow/2),0,1)),x=cellX(c),y=cellY(c);let cells=0;
    for(let i=0;i<N*N;i++)if(i===c||(levels[i]===levels[c]&&far(cellX(i)-x,cellY(i)-y)<=r)){water[i]=WATER.lake;cells++;}
    // Le fond du lac ne dépasse pas le niveau d'arrivée des cours d'eau : rien ne remonte.
    floor=Math.min(levels[c],Math.floor(drain.low));lakes.push(Object.freeze({id:K.entityId(cx,cy,'lac',0),kind,x,y,r,level:levels[c],bed:floor,cells,flow}));targets=[c];mode='lake';
   }
  }
  if(targets){
   // Recherche depuis l'aval : le pas « de j vers i » est le sens du courant.
   const{dist,parent}=search(targets,(i,j,diagonal)=>diagonal&&levels[i]!==levels[j]?-1:(diagonal?Math.SQRT2:1)*(1+wobble(j))+W.levelCost*levels[j]+W.climbCost*Math.max(0,levels[i]-levels[j]),8);
   const starts=inlets.map(n=>({cell:n.cell,level:n.w.level,kind:n.w.kind,width:n.w.width,from:n.w.edge,head:{x:n.w.x,y:n.w.y}}));
   if(mode==='outlet'&&!starts.length){
    // Source : la plus haute de quelques mailles tirées à l'intérieur du canton.
    let best=-1;for(let k=0;k<6;k++){const i=(4+Math.floor(eau()*(N-8)))*N+4+Math.floor(eau()*(N-8));if(levels[i]>0&&Number.isFinite(dist[i])&&(best<0||high[i]>high[best]))best=i;}
    if(best<0)best=outlet.cell;
    starts.push({cell:best,level:Math.max(Math.min(TOP,Math.floor(drain.low)),floor),kind:outlet.w.kind,width:outlet.w.width,from:null,head:null});
   }
   for(const s of starts){
    if(!Number.isFinite(dist[s.cell]))continue;
    const top=Math.max(s.level,floor),points=[];let level=top,i=s.cell,end=null;
    if(s.head)points.push({x:s.head.x,y:s.head.y,level:top});
    for(;;){
     if(water[i]===WATER.lake){end='lake';points.push({x:cellX(i),y:cellY(i),level:floor});break;}
     if(mode==='sea'&&water[i]===WATER.sea){end='sea';points.push({x:cellX(i),y:cellY(i),level:0});break;}
     level=Math.min(level,clamp(levels[i],floor,top));points.push({x:cellX(i),y:cellY(i),level});
     if(water[i]===WATER.river||water[i]===WATER.stream){end='confluence';break;}
     if(water[i]!==WATER.sea)water[i]=s.kind==='river'?WATER.river:WATER.stream;
     if(parent[i]<0){end=mode;break;}
     i=parent[i];
    }
    if(end==='outlet')points.push({x:outlet.w.x,y:outlet.w.y,level:floor});
    if(points.length<2)continue;
    rivers.push(Object.freeze({id:K.entityId(cx,cy,'eau',rivers.length),kind:s.kind,width:s.width,from:s.from,to:end==='outlet'?outlet.w.edge:end==='lake'?lakes[0].id:end,points:Object.freeze(soften(soften(points)).map(p=>Object.freeze({x:round(p.x),y:round(p.y),level:p.level})))}));
   }
  }
  // 4. Routes : carrefour intérieur relié aux passages des coutures. Falaise et eau
  //    profonde infranchissables ; une rampe coûte, donc les routes s'y rejoignent.
  const draw=K.stream(seed,cx,cy,'routes'),gates=[];
  for(const side of K.SIDES){const r=crossings[side].road;if(r){const[ix,iy]=sideCell(side,r.index);gates.push({side,r,cell:iy*N+ix});}}
  const dry=i=>levels[i]>0&&water[i]!==WATER.lake&&water[i]!==WATER.sea;
  let hub=-1,calm=-1;
  for(let k=0;k<Q.hubTries;k++){
   const x=Q.hubMargin+Math.floor(draw()*(N-2*Q.hubMargin)),y=Q.hubMargin+Math.floor(draw()*(N-2*Q.hubMargin)),i=y*N+x;if(!dry(i)||water[i])continue;
   let same=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(levels[i+dy*N+dx]===levels[i])same++;
   if(same>calm){calm=same;hub=i;}
  }
  const jitter=i=>lattice(m.relief^0x70a3,box.x/CELL+i%N,box.y/CELL+Math.floor(i/N))*Q.jitter;
  const border=i=>{const x=i%N,y=(i-x)/N;return x===0||y===0||x===N-1||y===N-1;};
  const pace=(i,j,diagonal)=>{
   if(!dry(j))return-1;const d=Math.abs(levels[i]-levels[j]);if(d>1)return-1;
   // En biais seulement sur du plat sec : une rampe ou un pont se prend de face.
   if(diagonal){const u=Math.floor(i/N)*N+j%N,v=Math.floor(j/N)*N+i%N;if(d||water[i]||water[j]||!dry(u)||!dry(v)||levels[u]!==levels[i]||levels[v]!==levels[i])return-1;}
   return(diagonal?Math.SQRT2:1)*(1+jitter(j))+(d?Q.rampCost:0)+(water[j]?Q.bridgeCost:0)+(border(j)?Q.borderCost:0);};
  const roads=[],onRoad=new Int16Array(N*N).fill(-1),ramps=[],bridges=[],rampSeen=new Set();
  const lay=(gate,parent)=>{
   const cells=[];let i=gate.cell;for(;;){cells.push(i);if(onRoad[i]>=0)break;if(parent[i]<0)break;i=parent[i];}
   const index=roads.length,points=[{x:gate.r.x,y:gate.r.y},...cells.map(c=>({x:cellX(c),y:cellY(c)}))];
   for(let k=0;k<cells.length;k++){const c=cells[k];if(onRoad[c]<0){onRoad[c]=index;if(water[c]===WATER.river||water[c]===WATER.stream)bridges.push(Object.freeze({x:cellX(c),y:cellY(c),road:index,water:water[c]===WATER.river?'river':'stream'}));}
    if(k){const p=cells[k-1],key=Math.min(p,c)+':'+Math.max(p,c);if(levels[p]!==levels[c]&&!rampSeen.has(key)){rampSeen.add(key);ramps.push(Object.freeze({x:(cellX(p)+cellX(c))/2,y:(cellY(p)+cellY(c))/2,low:Math.min(levels[p],levels[c]),high:Math.max(levels[p],levels[c]),road:index}));}}}
   roads.push(Object.freeze({id:K.entityId(cx,cy,'route',index),class:gate.r.class,width:gate.r.width,from:gate.r.edge,deadEnd:false,cells:Object.freeze(cells),points:Object.freeze(soften(soften(points)).map(p=>Object.freeze({x:round(p.x),y:round(p.y)})))}));
  };
  let pending=gates.slice().sort((a,b)=>CLASSES.indexOf(a.r.class)-CLASSES.indexOf(b.r.class)||K.SIDES.indexOf(a.side)-K.SIDES.indexOf(b.side));
  // Le carrefour d'abord ; un passage qu'une falaise en sépare devient la racine d'un
  // second réseau, et s'il reste seul, la route s'arrête au bord du canton.
  let rootCell=gates.length&&hub>=0?hub:-1,hubUsed=false;
  while(pending.length){
   const lone=rootCell<0;if(lone)rootCell=pending[0].cell;
   const{dist,parent}=search([rootCell],pace,8),reached=pending.filter(g=>g.cell!==rootCell&&Number.isFinite(dist[g.cell])&&dry(g.cell));
   if(!lone&&reached.length)hubUsed=true;
   const before=roads.length;for(const g of reached)lay(g,parent);
   const done=new Set(reached);
   if(lone){const g=pending[0];done.add(g);
    const p={x:cellX(g.cell),y:cellY(g.cell)},deadEnd=roads.length===before;if(onRoad[g.cell]<0)onRoad[g.cell]=roads.length;
    roads.push(Object.freeze({id:K.entityId(cx,cy,'route',roads.length),class:g.r.class,width:g.r.width,from:g.r.edge,deadEnd,cells:Object.freeze([g.cell]),points:Object.freeze([Object.freeze({x:g.r.x,y:g.r.y}),Object.freeze(p)])}));}
   pending=pending.filter(g=>!done.has(g));rootCell=-1;
  }
  const centreOfRoads=hubUsed?Object.freeze({x:cellX(hub),y:cellY(hub),level:levels[hub]}):null;
  // 5. Lieux candidats : le long des routes, serrés vers le carrefour quand l'habitat est dense.
  const S=R.sites,sites=[],lieux=K.stream(seed,cx,cy,'lieux'),roadCells=[];
  for(let i=0;i<N*N;i++)if(onRoad[i]>=0)roadCells.push(i);
  if(roadCells.length){
   const hx=hubUsed?cellX(hub):box.x+SIZE/2,hy=hubUsed?cellY(hub):box.y+SIZE/2;
   roadCells.sort((a,b)=>far(cellX(a)-hx,cellY(a)-hy)-far(cellX(b)-hx,cellY(b)-hy)||a-b);
   const density=noise(m.dense,box.x+SIZE/2,box.y+SIZE/2,S.densityScale),meanLevel=levels[roadCells[0]],wanted=Math.round(S.maximum*density*(meanLevel>=TOP-1?S.highlandFactor:1));
   for(let tries=0;sites.length<wanted&&tries<wanted*6;tries++){
    const u=lieux(),c=roadCells[Math.floor((u*(1-density)+u*u*u*density)*roadCells.length)],k=Math.floor(lieux()*4),x=c%N+(k===0?1:k===1?-1:0),y=Math.floor(c/N)+(k===2?1:k===3?-1:0),ox=(lieux()-.5)*CELL*.4,oy=(lieux()-.5)*CELL*.4;
    if(x<0||y<0||x>=N||y>=N)continue;const i=y*N+x,px=round(cellX(i)+ox),py=round(cellY(i)+oy);
    if(!dry(i)||water[i]||onRoad[i]>=0||levels[i]!==levels[c])continue;
    if(px-box.x<S.seamMargin||py-box.y<S.seamMargin||box.x+SIZE-px<S.seamMargin||box.y+SIZE-py<S.seamMargin)continue;
    if(sites.some(s=>far(s.x-px,s.y-py)<S.spacing))continue;
    sites.push(Object.freeze({id:K.entityId(cx,cy,'site',sites.length),x:px,y:py,level:levels[i],biome:BIOME_IDS[biomes[i]],road:roads[onRoad[c]].id}));
   }
  }
  const canton={version:R.version,generation:K.RULES.reservedGeneration,seed,cx,cy,id,bounds:Object.freeze(box),cell:CELL,cells:N,levels,altitudes:high,east,south,biomes,water,
   drain:Object.freeze({to:drain.to,sink:drain.sink,flow,low:drain.low}),crossings:Object.freeze(crossings),rivers:Object.freeze(rivers),lakes:Object.freeze(lakes),
   roads:Object.freeze(roads),hub:centreOfRoads,ramps:Object.freeze(ramps),bridges:Object.freeze(bridges),sites:Object.freeze(sites),counts:Object.freeze({cliffs,slopes,sea:seaCells.length})};
  canton.digest=digest(canton);
  return Object.freeze(canton);
 }
 // Empreinte stable d'un canton : toute différence de contenu la change.
 function digest(c){
  let h=2166136261;const eat=v=>{h^=v&255;h=Math.imul(h,16777619);},text=s=>{for(let i=0;i<s.length;i++){const v=s.charCodeAt(i);eat(v);eat(v>>>8);}};
  for(const list of [c.levels,c.east,c.south,c.biomes,c.water])for(let i=0;i<list.length;i++)eat(list[i]);
  for(let i=0;i<c.altitudes.length;i++)text(c.altitudes[i].toFixed(4));
  text(JSON.stringify([c.id,c.seed,c.drain,c.crossings,c.rivers,c.lakes,c.roads,c.hub,c.ramps,c.bridges,c.sites]));
  return(h>>>0).toString(16).padStart(8,'0');
 }
 // Passages d'une couture sans générer de canton (sonde et tests).
 function seam(seed,cx,cy,side){seedOK(seed);const m=ctx(seed),r=roadSeam(m,cx,cy,side);return{edge:K.edge(cx,cy,side).id,water:waterSeam(m,cx,cy,side),road:r&&!r.blocked?r:null,blocked:r&&r.blocked?r.blocked:null};}
 function drainage(seed,cx,cy){seedOK(seed);const m=ctx(seed),d=drainOf(m,cx,cy);return{to:d.to,sink:d.sink,low:d.low,flow:flowOf(m,cx,cy)};}
 const forget=()=>{memo=null;};

 return Object.freeze({RULES:R,CELL,CELLS:N,BIOMES:BIOME_IDS,WATER,CLASSES,altitude,levelAt,biomeAt,seam,drainage,generate,digest,forget});
});
