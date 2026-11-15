// Canton d'un monde sans bord, avec relief par paliers (docs/GAME_BIBLE.md §7.13,
// specs/monde-sans-bord/, tranches T2 et T3). Module pur et déterministe : pour (graine, cx, cy)
// il rend un canton de 1 024 m — paliers, falaises, cols, milieux, eau, routes, agglomérations,
// lieux candidats, site de fondation de K0_0 — sans connaître le résultat généré de ses
// voisins et sans dépendre de l'ordre de visite.
// Tout changement de palier est une falaise, sauf aux cols : quelques mailles de rampe par
// contour de plateau, et les rampes qu'une route taille faute de col.
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
 const R=C.WorldRelief217Rules,SIZE=K.SIZE,CELL=R.cell,N=SIZE/CELL,M=N+2,TOP=R.levels-1,MAXC=K.RULES.maxCoordinate;
 if(!Number.isInteger(N)||N<8)throw Error('Maille de relief invalide.');
 const BIOMES=Object.freeze([...C.BiomeRules135.defs,...C.EcologyRules164.defs]),BIOME_IDS=Object.freeze(BIOMES.map(d=>d.id));
 const WATER=Object.freeze({none:0,sea:1,lake:2,river:3,stream:4});
 const CLASSES=Object.freeze(['regional','secondary','local']),TOWNS=R.towns.order;
 const WINDS=Object.freeze(['est','sud-est','sud','sud-ouest','ouest','nord-ouest','nord','nord-est']);
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
  memo={seed,count:0,relief:salt('relief'),detail:salt('relief-detail'),scarp:salt('relief-ressaut'),pass:salt('relief-col'),warpX:salt('relief-pli-x'),warpY:salt('relief-pli-y'),valley:salt('relief-vallee'),warm:salt('climat-chaleur'),wet:salt('climat-eau'),fine:salt('climat-detail'),dense:salt('habitat'),
   seamLow:new Map(),low:new Map(),drain:new Map(),flow:new Map(),waterSeam:new Map(),roadSeam:new Map(),seamOpen:new Map(),link:new Map(),towns:new Map()};
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
  // Fond de vallée : une ligne de bruit creuse le terrain d'un cran environ, sans jamais ouvrir la mer.
  const v=R.valley,r=Math.abs(noise(m.valley,x,y,v.scale)-.5)/v.width;
  if(r<1&&h>v.floor){const t=1-r;h=Math.max(v.floor,h-v.depth*t*t*(3-2*t));}
  // Socle de fondation : autour du centre de K0_0, la terre ne passe jamais sous la mer.
  const o=R.origin,dx=px-o.x,dy=py-o.y;
  if(dx<o.outer&&dx>-o.outer&&dy<o.outer&&dy>-o.outer){const t=clamp((o.outer-far(dx,dy))/(o.outer-o.inner),0,1);h=Math.max(h,o.floor*t*t*(3-2*t));}
  return clamp(h,0,R.levels-1e-6);
 }
 const fieldLevel=(m,gx,gy)=>Math.floor(altitudeOf(m,(gx+.5)*CELL,(gy+.5)*CELL));

 // --- Agglomérations ----------------------------------------------------
 // Une agglomération par sommet de la grille, au plus : tirée dans la sous-graine du sommet,
 // posée dans le canton dont ce sommet est le coin nord-ouest. Ses quatre cantons la lisent
 // à l'identique. Le sommet (0,0) reste libre : c'est la place de D-17.
 function townOf(m,vx,vy){
  const key=vx+','+vy,found=m.towns.get(key);if(found!==undefined)return found;
  const T=R.towns,draw=K.rng(K.cornerSeed(m.seed,vx,vy,'agglomeration')),roll=draw(),pick=draw(),number=draw();
  const chance=T.chance*(.5+noise(m.dense,vx*SIZE,vy*SIZE,R.sites.densityScale));
  if((vx===0&&vy===0)||roll>=chance)return keep(m,m.towns,key,null);
  let u=roll/chance,kind=TOWNS[0];for(const k of [...TOWNS].reverse()){if(u<T.kinds[k].share){kind=k;break;}u-=T.kinds[k].share;}
  for(let k=0;k<T.tries;k++){
   const gx=vx*N+Math.floor((T.margin+draw()*(T.reach-T.margin))/CELL),gy=vy*N+Math.floor((T.margin+draw()*(T.reach-T.margin))/CELL),l=fieldLevel(m,gx,gy);
   if(l<1||fieldLevel(m,gx+1,gy)!==l||fieldLevel(m,gx-1,gy)!==l||fieldLevel(m,gx,gy+1)!==l||fieldLevel(m,gx,gy-1)!==l)continue;
   return keep(m,m.towns,key,Object.freeze({id:'Ka'+vx+'_'+vy,vx,vy,kind,name:T.names[Math.floor(pick*T.names.length)]+' '+(1+Math.floor(number*97)),x:(gx+.5)*CELL,y:(gy+.5)*CELL,level:l,radius:T.kinds[kind].radius}));}
  return keep(m,m.towns,key,null);
 }
 const inWorld=(x,y)=>x>=-MAXC&&x<=MAXC&&y>=-MAXC&&y<=MAXC;
 const rank=t=>t?TOWNS.indexOf(t.kind):-1;
 // Palier d'un point : celui de sa maille, lu au centre de la maille.
 const centre=n=>(Math.floor(n/CELL)+.5)*CELL;
 const levelOf=(m,x,y)=>Math.floor(altitudeOf(m,centre(x),centre(y)));
 function climateOf(m,x,y,h){
  const k=C.BiomeRules135.climate,q=R.climate,elevation=clamp((h-1)/(TOP-1),0,1);
  const channel=(salt,scale)=>clamp(.5+((noise(salt,x,y,scale)*(1-k.detailWeight)+noise(m.fine^salt,x,y,k.detailScale)*k.detailWeight)-.5)*k.contrast,0,1);
  return{temperature:clamp(channel(m.warm,k.temperatureScale)-q.coldHigh*(elevation-.5),0,1),moisture:clamp(channel(m.wet,k.moistureScale)+q.wetLow*(.5-elevation),0,1),elevation};
 }
 // Milieu : le plus proche des 16 milieux existants dans leur espace (chaleur, eau, altitude).
 // Table à plat (centre et étendue de chaque milieu) : même calcul, sans parcourir d'objets.
 const NICHE=new Float64Array(BIOMES.length*6);BIOMES.forEach((d,n)=>{for(let k=0;k<3;k++){NICHE[n*6+k]=d.climate[k];NICHE[n*6+3+k]=d.spread[k];}});
 function biomeIndex(c){const t=c.temperature,w=c.moisture,h=c.elevation;let best=0,low=Infinity;for(let n=0,k=0;k<NICHE.length;n++,k+=6){const a=(t-NICHE[k])/NICHE[k+3],b=(w-NICHE[k+1])/NICHE[k+4],e=(h-NICHE[k+2])/NICHE[k+5],score=a*a+b*b+e*e;if(score<low){low=score;best=n;}}return best;}
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
  // Sans amont, le cours d'eau ne naît que là où une source est tirée ; plus rare sur les hauts plateaux.
  if(flow<w.streamFlow||(flow<2&&unit(K.subSeed(m.seed,up.cx,up.cy,'source'))>=(lowOf(m,up.cx,up.cy)>=w.highLevel?w.highSpring:w.spring)))return keep(m,m.waterSeam,e.id,null);
  const p=seamLow(m,e),kind=flow>=w.riverFlow?'river':'stream',range=C.Hydrology165Rules.kinds[kind].width,first=kind==='river'?w.riverFlow:w.streamFlow,last=kind==='river'?w.capFlow:w.riverFlow;
  const pair=seamLevels(m,e,p.i),mouth=pair[0]===0||pair[1]===0,jitter=(unit(K.edgeSeed(m.seed,cx,cy,side,'eau'))-.5)*CELL*.5;
  const t=p.t+jitter,width=Math.round((range[0]+(range[1]-range[0])*clamp((flow-first)/Math.max(1,last-first),0,1))*10)/10;
  return keep(m,m.waterSeam,e.id,Object.freeze({edge:e.id,index:p.i,t,x:e.axis==='h'?e.x*SIZE+t:e.x*SIZE,y:e.axis==='v'?e.y*SIZE+t:e.y*SIZE,kind,width,flow,mouth,
   level:Math.min(TOP,Math.floor(lowOf(m,down.cx,down.cy))),from:K.id(up.cx,up.cy),to:K.id(down.cx,down.cy)}));
 }

 // --- Passages de route aux coutures ------------------------------------
 // Positions où une route peut franchir une couture, hors mer et hors passage d'eau :
 // de plain-pied, ou avec un ou deux crans à tailler. Même liste vue des deux cantons.
 function seamOpen(m,cx,cy,side){
  const e=K.edge(cx,cy,side),found=m.seamOpen.get(e.id);if(found)return found;
  const q=R.roads,water=waterSeam(m,cx,cy,side),wet=water?Math.floor(water.t/CELL):-9,flat=[],ramp=[],steep=[];let sea=0;
  for(let i=q.seamMargin;i<N-q.seamMargin;i++){
   if(i-wet<=1&&wet-i<=1)continue;
   const[u,v]=seamLevels(m,e,i);if(u===0||v===0){sea++;continue;}
   const d=u>v?u-v:v-u;if(!d)flat.push([i,u,v]);else if(d===1)ramp.push([i,u,v]);else if(d===2)steep.push([i,u,v]);
  }
  return keep(m,m.seamOpen,e.id,{flat,ramp,steep,sea,open:flat.length+ramp.length+steep.length>0});
 }
 // Trame : une rangée sur `trunkEvery` porte une route d'est en ouest ; les autres cantons
 // se raccordent vers elle, par l'ouest ou droit vers la rangée la plus proche. Si la mer
 // ou une haute falaise ferme la couture voulue, le canton se raccorde par une autre ; un
 // canton de la trame dont la route est coupée cherche un détour par le nord ou le sud.
 function linkOf(m,cx,cy){
  const key=cx+','+cy,found=m.link.get(key);if(found!==undefined)return found;
  const q=R.roads,r=mod(cy,q.trunkEvery),there=K.neighbours(cx,cy).map(n=>n.side),usable=side=>there.includes(side)&&seamOpen(m,cx,cy,side).open;let order,fallback=null;
  if(r===0){if(usable('east')&&usable('west'))return keep(m,m.link,key,null);order=['north','south'];}
  else{const up=r*2<=q.trunkEvery?'north':'south',other=up==='north'?'south':'north';
   order=unit(K.subSeed(m.seed,cx,cy,'routes-raccord'))<q.westChance?['west',up,other,'east']:[up,'west',other,'east'];fallback=order[0];}
  return keep(m,m.link,key,order.find(usable)||fallback);
 }
 function roadSeam(m,cx,cy,side){
  const e=K.edge(cx,cy,side),found=m.roadSeam.get(e.id);if(found!==undefined)return found;
  const q=R.roads,draw=K.rng(K.edgeSeed(m.seed,cx,cy,side,'routes'));let cls=null;
  // Les deux cantons de la couture, nommés depuis la couture elle-même.
  const a=e.axis==='h'?{cx:e.x,cy:e.y-1}:{cx:e.x-1,cy:e.y},b={cx:e.x,cy:e.y};
  if(e.axis==='v'){if(mod(e.y,q.trunkEvery)===0)cls='regional';else if(linkOf(m,b.cx,b.cy)==='west'||linkOf(m,a.cx,a.cy)==='east')cls='secondary';}
  else if(linkOf(m,b.cx,b.cy)==='north'||linkOf(m,a.cx,a.cy)==='south')cls='secondary';
  const extra=draw()<q.extraChance,pick=draw();
  if(!cls&&extra)cls='local';
  // Deux agglomérations voisines sont reliées : route principale entre bourgs et villes.
  {const ta=rank(townOf(m,a.cx,a.cy)),tb=rank(townOf(m,b.cx,b.cy));if(ta>=0&&tb>=0){const link=ta>0&&tb>0?'regional':'secondary';if(!cls||CLASSES.indexOf(link)<CLASSES.indexOf(cls))cls=link;}}
  if(!cls)return keep(m,m.roadSeam,e.id,null);
  // De plain-pied d'abord ; sinon la route taille sa rampe sur la couture (aucun col naturel
  // n'est posé sur une couture : il faudrait connaître les régions du canton voisin).
  const o=seamOpen(m,cx,cy,side),list=o.flat.length?o.flat:o.ramp.length?o.ramp:o.steep,via=o.flat.length?'plat':'taille';
  if(!list.length)return keep(m,m.roadSeam,e.id,Object.freeze({edge:e.id,blocked:o.sea?'mer':'falaise',class:cls}));
  const[i,u,v]=list[Math.floor(pick*list.length)],t=(i+.5)*CELL;
  return keep(m,m.roadSeam,e.id,Object.freeze({edge:e.id,blocked:null,index:i,t,x:e.axis==='h'?e.x*SIZE+t:e.x*SIZE,y:e.axis==='v'?e.y*SIZE+t:e.y*SIZE,class:cls,width:q.widths[cls],levels:Object.freeze([u,v]),via}));
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
  seedOK(seed);const box=K.bounds(cx,cy),m=ctx(seed),id=K.id(cx,cy),W=R.water,Q=R.roads,ox=cx*N,oy=cy*N;
  const cellX=i=>box.x+(i%N+.5)*CELL,cellY=i=>box.y+(Math.floor(i/N)+.5)*CELL;
  // 1. Paliers, avec une maille de marge lue dans le même champ que les voisins.
  const high=new Float32Array(N*N),levels=new Uint8Array(N*N),grid=new Uint8Array(M*M),biomes=new Uint8Array(N*N),water=new Uint8Array(N*N);
  for(let y=-1;y<=N;y++)for(let x=-1;x<=N;x++){const px=box.x+(x+.5)*CELL,py=box.y+(y+.5)*CELL,h=altitudeOf(m,px,py);grid[(y+1)*M+x+1]=Math.floor(h);
   if(x>=0&&y>=0&&x<N&&y<N){const i=y*N+x;high[i]=h;levels[i]=Math.floor(h);biomes[i]=biomeIndex(climateOf(m,px,py,h));if(levels[i]===0)water[i]=WATER.sea;}}
  // 2. Écarts de palier vers l'est et vers le sud, puis cols : bit 1 = l'arête est se franchit,
  //    bit 2 = l'arête sud. Tout autre écart est une falaise (ou un rivage, du palier 1 à la mer).
  const east=new Int8Array(N*N),south=new Int8Array(N*N),passes=new Uint8Array(N*N),colOf=new Int16Array(2*N*N).fill(-1),cols=[];
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,g=(y+1)*M+x+1;east[i]=grid[g+1]-grid[g];south[i]=grid[g+M]-grid[g];}
  // Régions de terre de même palier dans le canton, puis contours : les arêtes d'un cran
  // entre deux mêmes régions. Chaque contour assez long porte un col par `every` arêtes, au
  // moins un : centre tiré par hachage, les suivants au plus loin des précédents.
  const P=R.pass,region=new Int16Array(N*N).fill(-1),contours=new Map();let regions=0;
  for(let s=0;s<N*N;s++){if(region[s]>=0||!levels[s])continue;const queue=[s];region[s]=regions;
   for(let q=0;q<queue.length;q++){const i=queue[q],x=i%N;if(x<N-1&&region[i+1]<0&&levels[i+1]===levels[i]){region[i+1]=regions;queue.push(i+1);}if(x>0&&region[i-1]<0&&levels[i-1]===levels[i]){region[i-1]=regions;queue.push(i-1);}
    if(i+N<N*N&&region[i+N]<0&&levels[i+N]===levels[i]){region[i+N]=regions;queue.push(i+N);}if(i>=N&&region[i-N]<0&&levels[i-N]===levels[i]){region[i-N]=regions;queue.push(i-N);}}
   regions++;}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;
   for(let dir=0;dir<2;dir++){if(dir?y===N-1:x===N-1)continue;const j=dir?i+N:i+1,d=levels[j]-levels[i];if((d!==1&&d!==-1)||!levels[i]||!levels[j])continue;
    const key=d>0?region[j]*regions+region[i]:region[i]*regions+region[j];let list=contours.get(key);if(!list)contours.set(key,list=[]);
    list.push({i,dir,mx:ox+x+(dir?.5:1),my:oy+y+(dir?1:.5),low:d>0?levels[i]:levels[j]});}}
  for(const list of contours.values()){if(list.length<P.strand)continue;
   const wanted=Math.max(1,Math.round(list.length/P.every)),centres=[];
   for(let n=0;n<wanted;n++){let c=null,best=-1;
    for(const e of list){let score;if(!n)score=lattice(m.pass,e.mx*2,e.my*2);else{score=Infinity;for(const o of centres){const d=far(e.mx-o.mx,e.my-o.my);if(d<score)score=d;}}if(score>best){best=score;c=e;}}
    if(n&&best<=2*P.reach)break;centres.push(c);
    let width=0;for(const e of list)if(far(e.mx-c.mx,e.my-c.my)<=P.reach&&colOf[2*e.i+e.dir]<0){passes[e.i]|=1<<e.dir;colOf[2*e.i+e.dir]=cols.length;width++;}
    cols.push({x:c.mx*CELL,y:c.my*CELL,low:c.low,width,cut:false,road:-1,seam:null});}}
  // Aucun plateau fermé : une région d'au moins `islet` mailles restée sans col en reçoit un,
  // sur l'arête d'un cran que le hachage désigne.
  {const size=new Int16Array(regions),reached=new Uint8Array(regions),pick=new Array(regions).fill(null),score=new Float64Array(regions).fill(-1);
   for(let i=0;i<N*N;i++)if(region[i]>=0)size[region[i]]++;
   for(const list of contours.values())for(const e of list){const j=e.dir?e.i+N:e.i+1,a=region[e.i],b=region[j];
    if(colOf[2*e.i+e.dir]>=0){reached[a]=1;reached[b]=1;continue;}
    const v=lattice(m.pass^0x5bd1e995,e.mx*2,e.my*2);if(v>score[a]){score[a]=v;pick[a]=e;}if(v>score[b]){score[b]=v;pick[b]=e;}}
   for(let r=0;r<regions;r++){const c=pick[r];if(reached[r]||!c||size[r]<P.islet)continue;
    let width=0;for(const list of contours.values())for(const e of list){const j=e.dir?e.i+N:e.i+1;if((region[e.i]!==r&&region[j]!==r)||e.low!==c.low||far(e.mx-c.mx,e.my-c.my)>P.reach||colOf[2*e.i+e.dir]>=0)continue;
     passes[e.i]|=1<<e.dir;colOf[2*e.i+e.dir]=cols.length;width++;reached[region[e.i]]=1;reached[region[j]]=1;}
    cols.push({x:c.mx*CELL,y:c.my*CELL,low:c.low,width,cut:false,road:-1,seam:null});}}
  // Arête entre deux mailles voisines de face : celle de la maille ouest ou nord.
  const edgeKey=(i,j)=>2*(i<j?i:j)+(i-j===1||j-i===1?0:1),open=key=>passes[key>>1]>>(key&1)&1;
  // 3. Eau : passages aux coutures, puis tracé qui descend vers la sortie, le lac ou la mer.
  const crossings={},drain=drainOf(m,cx,cy),flow=flowOf(m,cx,cy),inlets=[];let outlet=null;
  for(const side of K.SIDES){
   const there=K.neighbours(cx,cy).some(n=>n.side===side),w=there?waterSeam(m,cx,cy,side):null,r=there?roadSeam(m,cx,cy,side):null;
   crossings[side]=Object.freeze({edge:there?K.edge(cx,cy,side).id:null,water:w&&Object.freeze({...w,flow:w.flow,direction:w.to===id?'in':'out'}),road:r&&!r.blocked?r:null,blocked:r&&r.blocked?r.blocked:null});
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
    const kind=flow>=3?'lake':'pond',reach=C.Hydrology165Rules.basins[kind].radius,r=round(reach[0]+(reach[1]-reach[0])*clamp((flow-1)/(W.capFlow/2),0,1)),x=cellX(c),y=cellY(c);let cells=0;
    for(let i=0;i<N*N;i++)if(i===c||(levels[i]===levels[c]&&far(cellX(i)-x,cellY(i)-y)<=r)){water[i]=WATER.lake;cells++;}
    // Le fond du lac ne dépasse pas le niveau d'arrivée des cours d'eau : rien ne remonte.
    floor=Math.min(levels[c],Math.floor(drain.low));lakes.push(Object.freeze({id:K.entityId(cx,cy,'lac',0),kind,x,y,r,level:levels[c],bed:floor,cells,flow,through:false}));targets=[c];mode='lake';
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
   if(mode==='outlet'&&unit(K.subSeed(seed,cx,cy,'etang'))<W.pondChance&&Number.isFinite(dist[starts[0].cell])){
    // Lac de vallée : le cours d'eau principal le traverse et en ressort au niveau de la sortie.
    const path=[];for(let i=starts[0].cell;i>=0;i=parent[i])path.push(i);
    const g=W.pondMargin,inner=[];for(let k=0;k<path.length-1;k++){const x=path[k]%N,y=(path[k]-x)/N;if(x>=g&&y>=g&&x<N-g&&y<N-g&&levels[path[k]]>0)inner.push(k);}
    const u=eau(),v=eau();
    if(inner.length){
     const k=inner[Math.floor(u*inner.length)],c=path[k],reach=C.Hydrology165Rules.basins.lake.radius,r=round(reach[0]+(reach[1]-reach[0])*.4*v),x=cellX(c),y=cellY(c);let cells=0,last=k;
     for(let i=0;i<N*N;i++)if(i===c||(levels[i]===levels[c]&&far(cellX(i)-x,cellY(i)-y)<=r)){water[i]=WATER.lake;cells++;}
     for(let j=k;j<path.length;j++)if(water[path[j]]===WATER.lake)last=j;
     const lake=Object.freeze({id:K.entityId(cx,cy,'lac',0),kind:'lake',x,y,r,level:levels[c],bed:floor,cells,flow,through:true});lakes.push(lake);
     // L'émissaire d'abord : les affluents d'aval le rejoignent en confluence.
     if(last+1<path.length)starts.unshift({cell:path[last+1],level:floor,kind:outlet.w.kind,width:outlet.w.width,from:lake.id,head:{x:cellX(path[last]),y:cellY(path[last])}});
    }
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
  // 4. Agglomérations des quatre sommets ; celle du coin nord-ouest est dans ce canton.
  const towns=[];for(const[vx,vy]of [[cx,cy],[cx+1,cy],[cx+1,cy+1],[cx,cy+1]])if(inWorld(vx,vy)){const t=townOf(m,vx,vy);if(t)towns.push(t);}
  const own=towns.length&&towns[0].vx===cx&&towns[0].vy===cy?towns[0]:null;
  const dry=i=>levels[i]>0&&water[i]!==WATER.lake&&water[i]!==WATER.sea;
  // Maille sèche et sans eau la plus proche, par anneaux.
  const settle=i=>{if(dry(i)&&!water[i])return i;const x=i%N,y=(i-x)/N;for(let r=1;r<N;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const nx=x+dx,ny=y+dy;if(nx<1||ny<1||nx>=N-1||ny>=N-1)continue;const j=ny*N+nx;if(dry(j)&&!water[j])return j;}return-1;};
  // Une arête est une falaise si elle sépare deux paliers de terre et n'est pas un col.
  // k : 0 est, 1 ouest, 2 sud, 3 nord. Rend l'écart de palier, ou 0.
  const wall=(i,k)=>{const x=i%N,y=(i-x)/N,g=(y+1)*M+x+1,a=grid[g],b=grid[g+(k===0?1:k===1?-1:k===2?M:-M)];if(a===b||!a||!b)return 0;
   if(k===0)return passes[i]&1?0:b-a;if(k===2)return passes[i]&2?0:b-a;if(k===1)return x>0&&passes[i-1]&1?0:b-a;return y>0&&passes[i-N]&2?0:b-a;};
  // Distance en mailles à un ensemble de mailles (parcours en largeur, quatre voisins).
  const spread=sources=>{const d=new Int16Array(N*N).fill(-1),queue=[];for(const i of sources){d[i]=0;queue.push(i);}for(let q=0;q<queue.length;q++){const i=queue[q],x=i%N,y=(i-x)/N;for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(d[j]<0){d[j]=d[i]+1;queue.push(j);}}}return d;};
  // 5. Site de fondation de D-17, dans K0_0 seulement : un plat sec de 128 m, près du
  //    centre, de préférence au pied d'une falaise ou près de l'eau. Il devient le carrefour.
  const F=R.foundation,span=F.size/CELL;let found=null;
  if(cx===0&&cy===0){
   const edge=[],wet=[];for(let i=0;i<N*N;i++){if(water[i])wet.push(i);else if(wall(i,0)||wall(i,1)||wall(i,2)||wall(i,3))edge.push(i);}
   const dC=spread(edge),dW=spread(wet);let low=Infinity;
   for(let y=F.margin;y+span<=N-F.margin;y++)for(let x=F.margin;x+span<=N-F.margin;x++){
    const l=levels[y*N+x];let flat=l>0,c=N,w=N;
    for(let dy=0;dy<span&&flat;dy++)for(let dx=0;dx<span;dx++){const i=(y+dy)*N+x+dx;if(levels[i]!==l||water[i]){flat=false;break;}if(dC[i]>=0&&dC[i]<c)c=dC[i];if(dW[i]>=0&&dW[i]<w)w=dW[i];}
    if(!flat)continue;
    // Site adossé : côtés du plat entièrement bordés par une falaise (au plus `backCap` comptés).
    let backed=0;
    if(F.backWeight)for(let k=0;k<4;k++){let all=true;for(let t=0;t<span&&all;t++){const i=k===0?(y+t)*N+x+span-1:k===1?(y+t)*N+x:k===2?(y+span-1)*N+x+t:y*N+x+t;if(!wall(i,k))all=false;}if(all)backed++;}
    const interest=Math.min(c,w)<=F.reach,score=(interest?0:1000)+far(box.x+(x+span/2)*CELL-R.origin.x,box.y+(y+span/2)*CELL-R.origin.y)/CELL*F.centreWeight+Math.min(F.reach,Math.abs(c-F.idealCliff))+Math.min(F.reach,Math.abs(w-F.idealWater))-(F.backWeight?F.backWeight*Math.min(backed,F.backCap):0);
    if(score<low){low=score;found={x,y,level:l,interest};}
   }
  }
  // 6. Routes : carrefour relié aux passages des coutures. Eau profonde et falaise de plus
  //    de deux crans infranchissables ; un col coûte peu, tailler une rampe coûte cher (bien
  //    plus pour deux crans) : les routes passent par les cols quand le canton en offre.
  const draw=K.stream(seed,cx,cy,'routes'),gates=[];
  for(const side of K.SIDES){const r=crossings[side].road;if(r){const[ix,iy]=sideCell(side,r.index);gates.push({side,r,cell:iy*N+ix});}}
  let hub=-1,calm=-1;
  for(let k=0;k<Q.hubTries;k++){
   const x=Q.hubMargin+Math.floor(draw()*(N-2*Q.hubMargin)),y=Q.hubMargin+Math.floor(draw()*(N-2*Q.hubMargin)),i=y*N+x;if(!dry(i)||water[i])continue;
   let same=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(levels[i+dy*N+dx]===levels[i])same++;
   if(same>calm){calm=same;hub=i;}
  }
  if(found)hub=(found.y+(span>>1))*N+found.x+(span>>1);
  else if(own){const i=settle(Math.floor((own.y-box.y)/CELL)*N+Math.floor((own.x-box.x)/CELL));if(i>=0)hub=i;}
  const jitter=i=>lattice(m.relief^0x70a3,box.x/CELL+i%N,box.y/CELL+Math.floor(i/N))*Q.jitter;
  const border=i=>{const x=i%N,y=(i-x)/N;return x===0||y===0||x===N-1||y===N-1;};
  const pace=(i,j,diagonal)=>{
   if(!dry(j))return-1;const d=Math.abs(levels[i]-levels[j]);if(d>2)return-1;
   // En biais seulement sur du plat sec : un col ou un pont se prend de face.
   if(diagonal){const u=Math.floor(i/N)*N+j%N,v=Math.floor(j/N)*N+i%N;if(d||water[i]||water[j]||!dry(u)||!dry(v)||levels[u]!==levels[i]||levels[v]!==levels[i])return-1;}
   return(diagonal?Math.SQRT2:1)*(1+jitter(j))+(d?open(edgeKey(i,j))?Q.rampCost:d>1?Q.steepCost:Q.cutCost:0)+(water[j]?Q.bridgeCost:0)+(border(j)?Q.borderCost:0);};
  const roads=[],onRoad=new Int16Array(N*N).fill(-1),ramps=[],bridges=[],rampSeen=new Set();
  const cut=(key,x,y,low,rise,road,seam)=>{passes[key>>1]|=1<<(key&1);colOf[key]=cols.length;cols.push({x,y,low,rise,width:1,cut:true,road,seam});};
  const lay=(gate,parent)=>{
   const cells=[];let i=gate.cell;for(;;){cells.push(i);if(onRoad[i]>=0)break;if(parent[i]<0)break;i=parent[i];}
   const index=roads.length,points=[{x:gate.r.x,y:gate.r.y},...cells.map(c=>({x:cellX(c),y:cellY(c)}))];
   for(let k=0;k<cells.length;k++){const c=cells[k];if(onRoad[c]<0){onRoad[c]=index;if(water[c]===WATER.river||water[c]===WATER.stream)bridges.push(Object.freeze({x:cellX(c),y:cellY(c),road:index,water:water[c]===WATER.river?'river':'stream'}));}
    if(k){const p=cells[k-1],key=edgeKey(p,c);if(levels[p]!==levels[c]&&!rampSeen.has(key)){rampSeen.add(key);
     const x=(cellX(p)+cellX(c))/2,y=(cellY(p)+cellY(c))/2,low=Math.min(levels[p],levels[c]),rise=Math.abs(levels[p]-levels[c]),made=!open(key);
     if(made)cut(key,x,y,low,rise,index,null);else if(cols[colOf[key]].road<0)cols[colOf[key]].road=index;
     ramps.push(Object.freeze({x,y,low,high:low+rise,road:index,cut:made}));}}}
   roads.push(Object.freeze({id:K.entityId(cx,cy,'route',index),class:gate.r.class,width:gate.r.width,from:gate.r.edge,deadEnd:false,cells:Object.freeze(cells),points:Object.freeze(soften(soften(points)).map(p=>Object.freeze({x:round(p.x),y:round(p.y)})))}));
  };
  let pending=gates.slice().sort((a,b)=>CLASSES.indexOf(a.r.class)-CLASSES.indexOf(b.r.class)||K.SIDES.indexOf(a.side)-K.SIDES.indexOf(b.side));
  // Le carrefour d'abord ; un passage que la mer ou une très haute falaise en sépare devient la racine d'un
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
  // Passages de couture : ce canton possède ses arêtes est et sud. Une rampe taillée sur la
  // couture y devient un col.
  for(const g of gates){if((g.side!=='east'&&g.side!=='south')||g.r.via==='plat')continue;
   const key=2*g.cell+(g.side==='east'?0:1),road=roads.findIndex(r=>r.from===g.r.edge);
   cut(key,g.r.x,g.r.y,Math.min(g.r.levels[0],g.r.levels[1]),Math.abs(g.r.levels[0]-g.r.levels[1]),road,g.r.edge);}
  // 7. Lieux candidats : le long des routes, serrés vers le carrefour quand l'habitat est
  //    dense, et plus nombreux dans le rayon d'une agglomération.
  const S=R.sites,sites=[],lieux=K.stream(seed,cx,cy,'lieux'),roadCells=[];
  for(let i=0;i<N*N;i++)if(onRoad[i]>=0)roadCells.push(i);
  const townAt=(x,y)=>{let best=null,low=Infinity;for(const t of towns){const d=far(t.x-x,t.y-y);if(d<=t.radius&&d<low){low=d;best=t;}}return best;};
  const place=c=>{
   const k=Math.floor(lieux()*4),x=c%N+(k===0?1:k===1?-1:0),y=Math.floor(c/N)+(k===2?1:k===3?-1:0),sx=(lieux()-.5)*CELL*.4,sy=(lieux()-.5)*CELL*.4;
   if(x<0||y<0||x>=N||y>=N)return;const i=y*N+x,px=round(cellX(i)+sx),py=round(cellY(i)+sy);
   if(!dry(i)||water[i]||onRoad[i]>=0||levels[i]!==levels[c])return;
   if(px-box.x<S.seamMargin||py-box.y<S.seamMargin||box.x+SIZE-px<S.seamMargin||box.y+SIZE-py<S.seamMargin)return;
   if(sites.some(s=>far(s.x-px,s.y-py)<S.spacing))return;
   const t=townAt(px,py);sites.push(Object.freeze({id:K.entityId(cx,cy,'site',sites.length),x:px,y:py,level:levels[i],biome:BIOME_IDS[biomes[i]],road:roads[onRoad[c]].id,town:t?t.id:null}));
  };
  if(roadCells.length){
   const hx=hubUsed?cellX(hub):box.x+SIZE/2,hy=hubUsed?cellY(hub):box.y+SIZE/2;
   roadCells.sort((a,b)=>far(cellX(a)-hx,cellY(a)-hy)-far(cellX(b)-hx,cellY(b)-hy)||a-b);
   const density=noise(m.dense,box.x+SIZE/2,box.y+SIZE/2,S.densityScale),meanLevel=levels[roadCells[0]],wanted=Math.round(S.maximum*density*(meanLevel>=TOP-1?S.highlandFactor:1));
   for(let tries=0;sites.length<wanted&&tries<wanted*6;tries++){const u=lieux();place(roadCells[Math.floor((u*(1-density)+u*u*u*density)*roadCells.length)]);}
   for(const t of towns){
    const around=roadCells.filter(c=>far(cellX(c)-t.x,cellY(c)-t.y)<=t.radius),more=R.towns.kinds[t.kind].sites,quota=sites.length+more;
    for(let tries=0;around.length&&sites.length<quota&&tries<more*6;tries++)place(around[Math.floor(lieux()*around.length)]);
   }
  }
  // 8. Cols déclarés, décompte des arêtes et fiche du site de fondation.
  const colList=cols.map((c,n)=>Object.freeze({id:K.entityId(cx,cy,'col',n),x:round(c.x),y:round(c.y),low:c.low,high:c.low+(c.rise||1),width:c.width,kind:c.cut?'taille':'naturel',road:c.road>=0?roads[c.road].id:null,seam:c.seam}));
  let cliffs=0,slopes=0,shore=0;
  for(let i=0;i<N*N;i++)for(let dir=0;dir<2;dir++){const d=dir?south[i]:east[i];if(!d)continue;const a=levels[i],b=a+d;if(passes[i]>>dir&1)slopes++;else if((a===0||b===0)&&(d===1||d===-1))shore++;else cliffs++;}
  let foundation=null;
  if(found){
   const px=box.x+(found.x+span/2)*CELL,py=box.y+(found.y+span/2)*CELL,seen=new Uint8Array(N*N),queue=[hub],guard=new Set(),tally={cells:0,cliffs:0,passes:0,open:0,shore:0};seen[hub]=1;
   const wind=(dx,dy)=>{const ax=Math.abs(dx),ay=Math.abs(dy);return WINDS[ax>2.4142*ay?(dx>0?0:4):ay>2.4142*ax?(dy>0?2:6):dx>0?(dy>0?1:7):(dy>0?3:5)];};
   // Le palier du site, parcouru dans le canton : ce qui le borde est falaise, col, rivage
   // ou plain-pied vers un canton voisin.
   for(let q=0;q<queue.length;q++){const i=queue[q],x=i%N,y=(i-x)/N;tally.cells++;
    for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k],other=grid[(ny+1)*M+nx+1];
     if(nx<0||ny<0||nx>=N||ny>=N){if(other===levels[i])tally.open++;else if(!other)tally.shore++;else if((k===0&&passes[i]&1)||(k===2&&passes[i]&2))tally.passes++;else tally.cliffs++;continue;}
     const j=ny*N+nx;if(other===levels[i]){if(!seen[j]){seen[j]=1;queue.push(j);}continue;}
     const key=edgeKey(i,j);if(open(key)){tally.passes++;guard.add(colOf[key]);}else if(!other)tally.shore++;else tally.cliffs++;}}
   let cliff=null,wet=null;
   for(let i=0;i<N*N;i++){
    for(let k=0;k<4;k+=2){const d=wall(i,k);if(!d)continue;const x=cellX(i)+(k?0:CELL/2),y=cellY(i)+(k?CELL/2:0),gap=far(x-px,y-py);if(!cliff||gap<cliff.distance)cliff={distance:gap,drop:Math.abs(d),wind:wind(x-px,y-py)};}
    if(water[i]){const x=cellX(i),y=cellY(i),gap=far(x-px,y-py);if(!wet||gap<wet.distance)wet={distance:gap,kind:['','sea','lake','river','stream'][water[i]],wind:wind(x-px,y-py)};}
   }
   const edges=tally.cliffs+tally.passes+tally.open+tally.shore,road=onRoad[hub]>=0?roads[onRoad[hub]]:null;
   foundation=Object.freeze({id:K.entityId(cx,cy,'d17',0),x:px,y:py,size:F.size,level:found.level,biome:BIOME_IDS[biomes[hub]],interest:found.interest,road:road?road.id:null,roadClass:road?road.class:null,
    plateau:Object.freeze({cells:tally.cells,cliffs:tally.cliffs,passes:tally.passes,open:tally.open,shore:tally.shore,closed:tally.open===0,enclosure:edges?round((tally.cliffs+tally.shore)/edges):0}),
    cliff:cliff&&Object.freeze({distance:round(cliff.distance),drop:cliff.drop,wind:cliff.wind}),water:wet&&Object.freeze({distance:round(wet.distance),kind:wet.kind,wind:wet.wind}),
    cols:Object.freeze([...guard].map(n=>colList[n]).map(c=>Object.freeze({id:c.id,x:c.x,y:c.y,low:c.low,high:c.high,width:c.width,kind:c.kind,distance:round(far(c.x-px,c.y-py)),wind:wind(c.x-px,c.y-py)})).sort((a,b)=>a.distance-b.distance||(a.id<b.id?-1:1)).slice(0,F.guard))});
  }
  const canton={version:R.version,generation:K.RULES.reservedGeneration,seed,cx,cy,id,bounds:Object.freeze(box),cell:CELL,cells:N,levels,altitudes:high,east,south,passes,biomes,water,
   drain:Object.freeze({to:drain.to,sink:drain.sink,flow,low:drain.low}),crossings:Object.freeze(crossings),rivers:Object.freeze(rivers),lakes:Object.freeze(lakes),
   roads:Object.freeze(roads),hub:centreOfRoads,ramps:Object.freeze(ramps),bridges:Object.freeze(bridges),cols:Object.freeze(colList),towns:Object.freeze(towns),sites:Object.freeze(sites),foundation,
   counts:Object.freeze({cliffs,slopes,shore,sea:seaCells.length,cols:colList.length,cuts:colList.filter(c=>c.kind==='taille').length})};
  canton.digest=digest(canton);
  return Object.freeze(canton);
 }
 // Empreinte stable d'un canton : toute différence de contenu la change.
 function digest(c){
  let h=2166136261;const eat=v=>{h^=v&255;h=Math.imul(h,16777619);},text=s=>{for(let i=0;i<s.length;i++){const v=s.charCodeAt(i);eat(v);eat(v>>>8);}};
  for(const list of [c.levels,c.east,c.south,c.passes,c.biomes,c.water])for(let i=0;i<list.length;i++)eat(list[i]);
  for(let i=0;i<c.altitudes.length;i++){const v=Math.round(c.altitudes[i]*10000);eat(v);eat(v>>>8);eat(v>>>16);}
  text(JSON.stringify([c.id,c.seed,c.drain,c.crossings,c.rivers,c.lakes,c.roads,c.hub,c.ramps,c.bridges,c.cols,c.towns,c.sites,c.foundation]));
  return(h>>>0).toString(16).padStart(8,'0');
 }
 // Passages d'une couture sans générer de canton (sonde et tests).
 function seam(seed,cx,cy,side){seedOK(seed);const m=ctx(seed),r=roadSeam(m,cx,cy,side);return{edge:K.edge(cx,cy,side).id,water:waterSeam(m,cx,cy,side),road:r&&!r.blocked?r:null,blocked:r&&r.blocked?r.blocked:null};}
 function drainage(seed,cx,cy){seedOK(seed);const m=ctx(seed),d=drainOf(m,cx,cy);return{to:d.to,sink:d.sink,low:d.low,flow:flowOf(m,cx,cy)};}
 // Agglomération d'un sommet, ou null : lue sans générer de canton.
 function town(seed,vx,vy){seedOK(seed);if(!Number.isInteger(vx)||!Number.isInteger(vy)||!inWorld(vx,vy))throw Error('Sommet de canton invalide.');return townOf(ctx(seed),vx,vy);}
 // Site de fondation de D-17 : celui du canton K0_0 de la graine.
 function foundation(seed){return generate(seed,0,0).foundation;}
 const forget=()=>{memo=null;};

 return Object.freeze({RULES:R,CELL,CELLS:N,BIOMES:BIOME_IDS,WATER,CLASSES,TOWNS,altitude,levelAt,biomeAt,seam,drainage,town,foundation,generate,digest,forget});
});
