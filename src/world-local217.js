// Carte locale de D-17 née de son canton (docs/GAME_BIBLE.md §7.13, specs/monde-sans-bord/,
// tranche T4 hors jeu). Module pur et déterministe : pour une graine, il découpe dans le canton
// d'origine K0_0 le cadre jouable de la cité et le décrit case par case — paliers, falaises,
// rampes de col, eau, routes —, puis en tire ce qu'un siège y trouverait : côtés ouverts,
// côtés fermés, passages obligés, gisements, fiche du site.
// « Une falaise vaut une enceinte ; une pente est une porte. »
// Hors jeu : non chargé par index.html, lu par aucune génération (1 à 11), aucun flux existant.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DeadwallWorldLocal217=api;
})(globalThis,function(root){
 'use strict';
 const node=typeof require==='function';
 const C=root.DeadwallCore||(node?require('./core.js'):null);
 const K=root.DeadwallWorldCantons217||(node?require('./world-cantons217.js'):null);
 const G=root.DeadwallWorldCantonGen217||(node?require('./world-canton-gen217.js'):null);
 const R=C.WorldLocal217Rules,CELL=G.CELL,N=G.CELLS,W=G.WATER,SIDES=K.SIDES;
 const BIOMES=Object.freeze([...C.BiomeRules135.defs,...C.EcologyRules164.defs]);
 // Nature d'une case : plat, pied ou crête de falaise, rampe de col, rive, eau.
 const KIND=Object.freeze({flat:0,cliff:1,ramp:2,shore:3,water:4});
 const WHERE=Object.freeze({north:'au nord',east:'à l’est',south:'au sud',west:'à l’ouest'});
 const WATER_NAME=Object.freeze(['','la mer','un lac','la rivière','un ruisseau']);
 const COUNT=Object.freeze(['','un','deux','trois','quatre','cinq','six']);
 const DX=[1,-1,0,0],DY=[0,0,1,-1];
 const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy),round=n=>Math.round(n*100)/100;
 const lattice=(seed,x,y)=>{let h=(seed^Math.imul(x,0x27d4eb2d)^Math.imul(y,0x165667b1))>>>0;h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return((h^h>>>16)>>>0)/4294967296;};

 // --- Grille ------------------------------------------------------------
 // Cadre de `frame` mètres centré sur le site de fondation, aligné sur les mailles du canton.
 function grid(seed,options={}){
  const c=G.generate(seed,0,0),f=c.foundation;if(!f)throw Error('Site de fondation absent.');
  const S=options.frame===undefined?R.frame:options.frame,ramp=options.ramp===undefined?R.ramp:options.ramp;
  if(!Number.isInteger(S)||S<2*CELL||S%(2*CELL)||!(ramp>=2&&ramp<=CELL))throw Error('Cadre de carte locale invalide.');
  const ox=f.x-c.bounds.x-S/2,oy=f.y-c.bounds.y-S/2;
  if(ox<0||oy<0||ox+S>N*CELL||oy+S>N*CELL||ox%CELL||oy%CELL)throw Error('Cadre de carte locale hors du canton d’origine.');
  const mx=ox/CELL,my=oy/CELL,size=S*S,levels=new Uint8Array(size),biomes=new Uint8Array(size),water=new Uint8Array(size),passes=new Uint8Array(size),kinds=new Uint8Array(size),roads=new Uint8Array(size);
  // 1. Paliers, milieux, mer et lacs : ceux de la maille du canton, case par case. Une arête
  //    de col ne se franchit que par sa rampe, large de `ramp` mètres au milieu de l'arête.
  const half=ramp/2,mid=CELL/2;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
   const i=y*S+x,lx=x%CELL,ly=y%CELL,m=(my+(y-ly)/CELL)*N+mx+(x-lx)/CELL;
   levels[i]=c.levels[m];biomes[i]=c.biomes[m];if(c.water[m]===W.sea||c.water[m]===W.lake)water[i]=c.water[m];
   if(lx===CELL-1&&x<S-1&&c.passes[m]&1&&Math.abs(ly+.5-mid)<half)passes[i]|=1;
   if(ly===CELL-1&&y<S-1&&c.passes[m]&2&&Math.abs(lx+.5-mid)<half)passes[i]|=2;
  }
  // 2. Cours d'eau et routes : tracés du canton, posés à leur largeur réelle.
  const trace=(points,r,mark)=>{
   for(let k=1;k<points.length;k++){
    const ax=points[k-1].x-c.bounds.x-ox,ay=points[k-1].y-c.bounds.y-oy,bx=points[k].x-c.bounds.x-ox,by=points[k].y-c.bounds.y-oy;
    if(Math.max(ax,bx)<-r||Math.max(ay,by)<-r||Math.min(ax,bx)>S+r||Math.min(ay,by)>S+r)continue;
    const steps=Math.max(1,Math.ceil(far(bx-ax,by-ay)*2));
    for(let s=0;s<=steps;s++){const px=ax+(bx-ax)*s/steps,py=ay+(by-ay)*s/steps;
     for(let y=Math.max(0,Math.floor(py-r));y<=Math.min(S-1,Math.floor(py+r));y++)for(let x=Math.max(0,Math.floor(px-r));x<=Math.min(S-1,Math.floor(px+r));x++)if(far(x+.5-px,y+.5-py)<=r+.5)mark(y*S+x);}
   }
  };
  for(const r of c.rivers){const code=r.kind==='river'?W.river:W.stream;trace(r.points,Math.max(R.brush,r.width/2),i=>{if(!water[i]||(water[i]===W.stream&&code===W.river))water[i]=code;});}
  const paint=(points,cls)=>{const code=G.CLASSES.indexOf(cls)+1;trace(points,G.RULES.roads.widths[cls]/2,i=>{if(water[i]!==W.sea&&water[i]!==W.lake&&(!roads[i]||code<roads[i]))roads[i]=code;});};
  for(const r of c.roads)paint(r.points,r.class);
  // Le carrefour du canton est au centre d'une maille du site : la route est menée jusqu'au centre.
  if(c.hub&&f.roadClass)paint([{x:c.hub.x,y:c.hub.y},{x:f.x,y:f.y}],f.roadClass);
  // 3. Nature de chaque case.
  const deep=i=>{const w=water[i];return w===W.sea||w===W.lake||(w===W.river&&!roads[i]);};
  const wet=i=>deep(i)||(water[i]===W.stream&&!roads[i]);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
   const i=y*S+x;if(wet(i)){kinds[i]=KIND.water;continue;}
   let kind=KIND.flat;
   for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;
    if(levels[j]===levels[i]||(levels[j]===0&&levels[i]===1)){if(wet(j)&&kind===KIND.flat)kind=KIND.shore;continue;}
    if(kind!==KIND.ramp)kind=KIND.cliff;}
   kinds[i]=kind;
  }
  const depth=R.rampDepth;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const p=passes[y*S+x];if(!p)continue;
   if(p&1)for(let d=1-depth;d<=depth;d++){const nx=x+d;if(nx>=0&&nx<S&&kinds[y*S+nx]!==KIND.water)kinds[y*S+nx]=KIND.ramp;}
   if(p&2)for(let d=1-depth;d<=depth;d++){const ny=y+d;if(ny>=0&&ny<S&&kinds[ny*S+x]!==KIND.water)kinds[ny*S+x]=KIND.ramp;}}
  // 4. Accès : routes qui entrent dans le cadre, cols du canton pris dans le cadre.
  const accesses=[],seen=new Set();
  for(const r of c.roads)for(let k=1;k<r.points.length;k++){
   const ax=r.points[k-1].x-c.bounds.x-ox,ay=r.points[k-1].y-c.bounds.y-oy,bx=r.points[k].x-c.bounds.x-ox,by=r.points[k].y-c.bounds.y-oy,inA=ax>=0&&ay>=0&&ax<=S&&ay<=S,inB=bx>=0&&by>=0&&bx<=S&&by<=S;
   if(inA===inB)continue;
   const ix=inA?ax:bx,iy=inA?ay:by,ex=inA?bx:ax,ey=inA?by:ay;let t=1,side=null;
   for(const[s,v]of [['west',ex<0?(0-ix)/(ex-ix):2],['east',ex>S?(S-ix)/(ex-ix):2],['north',ey<0?(0-iy)/(ey-iy):2],['south',ey>S?(S-iy)/(ey-iy):2]])if(v<=t){t=v;side=s;}
   if(!side)continue;
   const x=round(ix+(ex-ix)*t),y=round(iy+(ey-iy)*t),at=side==='north'||side==='south'?x:y,key=side+':'+Math.round(at/4);
   if(seen.has(key))continue;seen.add(key);
   accesses.push(Object.freeze({kind:'route',side,x,y,at,road:r.id,class:r.class,width:r.width}));
  }
  accesses.sort((a,b)=>SIDES.indexOf(a.side)-SIDES.indexOf(b.side)||a.at-b.at||(a.road<b.road?-1:1));
  const cols=c.cols.filter(k=>k.x-c.bounds.x>=ox&&k.y-c.bounds.y>=oy&&k.x-c.bounds.x<=ox+S&&k.y-c.bounds.y<=oy+S).map(k=>Object.freeze({id:k.id,x:round(k.x-c.bounds.x-ox),y:round(k.y-c.bounds.y-oy),low:k.low,high:k.high,kind:k.kind,road:k.road}));
  return{canton:c,site:f,S,ramp,ox,oy,levels,biomes,water,passes,kinds,roads,accesses,cols,deep};
 }

 // --- Déplacement sur la grille -----------------------------------------
 // Pas de la case i à sa voisine j (direction k) : interdit par une falaise, la mer, un lac,
 // une rivière sans pont ; un changement de palier ne passe que par une rampe.
 function mover(g){
  const{S,levels,passes,water,roads,deep}=g;
  return(i,j,k)=>{
   if(deep(j))return false;if(levels[i]===levels[j])return true;
   return Boolean(k===0?passes[i]&1:k===1?passes[j]&1:k===2?passes[i]&2:passes[j]&2);
  };
 }
 // Plus court chemin depuis le centre : coûts, parents et ordre d'arrivée.
 function reachFrom(g,start){
  const{S,levels,water,roads}=g,size=S*S,Q=R.costs,can=mover(g),dist=new Float64Array(size).fill(Infinity),parent=new Int32Array(size).fill(-1),order=[],keys=[],cells=[];
  const push=(d,i)=>{let k=keys.length;keys.push(d);cells.push(i);while(k>0){const p=(k-1)>>1;if(keys[p]<=d)break;keys[k]=keys[p];cells[k]=cells[p];k=p;}keys[k]=d;cells[k]=i;};
  const pop=()=>{const last=keys.pop(),cell=cells.pop(),n=keys.length;if(!n)return;let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&keys[c+1]<keys[c])c++;if(keys[c]>=last)break;keys[k]=keys[c];cells[k]=cells[c];k=c;}keys[k]=last;cells[k]=cell;};
  dist[start]=0;push(0,start);
  while(keys.length){const d=keys[0],i=cells[0];pop();if(d>dist[i])continue;order.push(i);const x=i%S,y=(i-x)/S;
   for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(!can(i,j,k))continue;
    const cost=d+Q.step+(levels[i]!==levels[j]?Q.ramp:0)+(water[j]===W.stream&&!roads[j]?Q.ford:0);
    if(cost<dist[j]){dist[j]=cost;parent[j]=i;push(cost,j);}}}
  return{dist,parent,order};
 }
 // Cases d'un bord, de l'ouest vers l'est ou du nord vers le sud.
 const borderCell=(S,side,t)=>side==='north'?t:side==='south'?(S-1)*S+t:side==='west'?t*S:t*S+S-1;
 const segments=(S,has)=>{const out=[];let from=-1;for(let t=0;t<=S;t++){const on=t<S&&has(t);if(on&&from<0)from=t;if(!on&&from>=0){out.push(Object.freeze({from,to:t,width:t-from}));from=-1;}}return out;};

 // --- Côtés et passages -------------------------------------------------
 function sidesOf(g,reach){
  const{S,levels,water,roads,passes,deep,canton:c,ox,oy}=g,size=S*S,centre=(S/2)*S+S/2,level=levels[centre],can=mover(g),r0=Math.floor(R.narrow/2);
  // De plain-pied : même palier que le centre, à sec, sans passer de pont. Mode 0 : les ruisseaux arrêtent ; mode 1 : ils se passent à gué.
  const plain=mode=>{
   const free=i=>levels[i]===level&&!deep(i)&&water[i]!==W.river&&(mode===1||water[i]!==W.stream||roads[i]>0);
   // Dégagement : distance (en cases, quatre voisins) à la première case qui n'est pas de plain-pied.
   const clear=new Int16Array(size).fill(-1),queue=[];
   for(let i=0;i<size;i++)if(!free(i)){clear[i]=0;queue.push(i);}
   for(let q=0;q<queue.length;q++){const i=queue[q],x=i%S,y=(i-x)/S;for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(clear[j]<0){clear[j]=clear[i]+1;queue.push(j);}}}
   for(let i=0;i<size;i++)if(clear[i]<0)clear[i]=S;
   const flood=least=>{const seen=new Uint8Array(size),from=new Int32Array(size).fill(-1),list=[centre];seen[centre]=1;
    for(let q=0;q<list.length;q++){const i=list[q],x=i%S,y=(i-x)/S;for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(!seen[j]&&free(j)&&clear[j]>=least){seen[j]=1;from[j]=i;list.push(j);}}}
    return{seen,from};};
   return{clear,flood,any:flood(1).seen,wide:flood(r0).seen};
  };
  const dry=plain(0),ford=plain(1);
  // Portes du plateau de la cité : rampes de col et ponts par lesquels on y entre. Un front
  // canalisé doit passer par l'une de celles que son bord peut joindre sans traverser le plateau.
  const gates=[],byKey=new Map(),bridge=new Int32Array(size).fill(-1);
  const colGate=(i,j)=>{
   const a=i<j?i:j,dir=j-i===1||i-j===1?0:1,x=a%S,y=(a-x)/S,key='c'+(dir?'s':'e')+Math.floor(x/CELL)+'_'+Math.floor(y/CELL);let n=byKey.get(key);if(n!==undefined)return n;
   // La rampe de cette arête de maille : toutes ses cases franchissables.
   let width=0;const bx=x-x%CELL,by=y-y%CELL;for(let t=0;t<CELL;t++){const cell=dir?(by+CELL-1)*S+bx+t:(by+t)*S+bx+CELL-1;if(passes[cell]&(dir?2:1))width++;}
   const px=dir?bx+CELL/2:bx+CELL,py=dir?by+CELL:by+CELL/2;let col=null,low=Infinity;
   for(const k of g.cols){const d=far(k.x-px,k.y-py);if(d<low&&d<=(G.RULES.pass.reach+1)*CELL){low=d;col=k;}}
   n=gates.length;gates.push({kind:'col',x:px,y:py,width,low:Math.min(levels[i],levels[j]),high:Math.max(levels[i],levels[j]),col:col?col.id:null,cut:col?col.kind==='taille':false});byKey.set(key,n);return n;
  };
  const bridgeGate=j=>{
   if(bridge[j]>=0)return bridge[j];
   const list=[j],n=gates.length;bridge[j]=n;let sx=0,sy=0,cls=3;
   for(let q=0;q<list.length;q++){const i=list[q],x=i%S,y=(i-x)/S;sx+=x+.5;sy+=y+.5;if(roads[i]<cls)cls=roads[i];for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const o=ny*S+nx;if(bridge[o]<0&&water[o]===W.river&&roads[o]){bridge[o]=n;list.push(o);}}}
   gates.push({kind:'pont',x:round(sx/list.length),y:round(sy/list.length),width:G.RULES.roads.widths[G.CLASSES[cls-1]],low:levels[j],high:levels[j],col:null,cut:false});return n;
  };
  const plateau=ford.any;
  const doorsOf=starts=>{
   const seen=new Uint8Array(size),list=[],found=new Set();for(const i of starts)if(!plateau[i]&&!seen[i]){seen[i]=1;list.push(i);}
   for(let q=0;q<list.length;q++){const i=list[q],x=i%S,y=(i-x)/S;
    for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(seen[j]||!can(i,j,k))continue;
     if(plateau[j]){found.add(levels[i]!==levels[j]?colGate(i,j):water[i]===W.river?bridgeGate(i):-1);continue;}
     seen[j]=1;list.push(j);}}
   found.delete(-1);return[...found].sort((a,b)=>gates[a].y-gates[b].y||gates[a].x-gates[b].x).map(n=>gates[n]);
  };
  // Goulet : couloir de plain-pied plus étroit que `narrow`. Sa largeur est celle du plus
  // large couloir qui joint encore le côté ; il est situé à l'endroit le plus resserré.
  const goulet=(side)=>{
   for(let least=r0-1;least>=1;least--){const f=ford.flood(least);
    for(let t=0;t<S;t++){let i=borderCell(S,side,t);if(!f.seen[i])continue;let tight=i;for(;i>=0;i=f.from[i])if(ford.clear[i]<ford.clear[tight])tight=i;
     return{kind:'goulet',x:tight%S+.5,y:Math.floor(tight/S)+.5,width:Math.min(R.narrow-1,2*least+1),low:level,high:level,col:null,cut:false};}}
   return null;
  };
  const out={};
  for(const side of SIDES){
   const cell=t=>borderCell(S,side,t),reached=segments(S,t=>Number.isFinite(reach.dist[cell(t)]));
   // Un tronçon du bord est ouvert s'il se joint au centre par un couloir large.
   const openIn=p=>segments(S,t=>p.any[cell(t)]===1).filter(s=>{for(let t=s.from;t<s.to;t++)if(p.wide[cell(t)])return true;return false;});
   const open=openIn(dry),slow=open.length?[]:openIn(ford),total=list=>list.reduce((n,s)=>n+s.width,0);
   let status,width=0,passages=[],cause=null,blocker=null,lanes=[];
   if(total(open)>=R.narrow){status='ouvert';width=total(open);lanes=open;}
   else if(total(slow)>=R.narrow){status='ralenti';width=total(slow);lanes=slow;}
   else if(reached.length){
    status='passage';lanes=reached;const starts=[];let narrow=null;
    for(let t=0;t<S;t++){const i=cell(t);if(!Number.isFinite(reach.dist[i]))continue;if(plateau[i]){if(!narrow)narrow=goulet(side);}else starts.push(i);}
    passages=doorsOf(starts);if(narrow)passages.push(narrow);
    // Un côté joint de plain-pied sans couloir large ni goulet mesurable : goulet d'une case.
    if(!passages.length)passages.push({kind:'goulet',x:cell(reached[0].from)%S+.5,y:Math.floor(cell(reached[0].from)/S)+.5,width:1,low:level,high:level,col:null,cut:false});
    width=Math.min(S,passages.reduce((n,p)=>n+p.width,0));
   }else{
    // Fermé : ce qui arrête, vu du bord en marchant droit vers la cité.
    status='clos';const[sx,sy]=side==='north'?[0,1]:side==='south'?[0,-1]:side==='west'?[1,0]:[-1,0];let rock=0,wet=0;const kindsSeen=[0,0,0,0,0];
    for(let t=0;t<S;t++){let i=cell(t),last=-1;for(let s=0;s<S;s++){if(Number.isFinite(reach.dist[i])){break;}last=i;i+=sy*S+sx;if(s===S-1)last=-1;}
     if(last<0)continue;if(deep(last)){wet++;kindsSeen[water[last]]++;}else rock++;}
    cause=wet>rock?'eau':'falaise';if(cause==='eau')blocker=[W.sea,W.lake,W.river].reduce((a,b)=>kindsSeen[b]>kindsSeen[a]?b:a,W.sea);
   }
   out[side]=Object.freeze({side,status,width,share:round(width/S),cause,water:blocker===null?null:['','sea','lake','river','stream'][blocker],
    lanes:Object.freeze(lanes),entries:Object.freeze(reached),passages:Object.freeze(passages.map(p=>Object.freeze({kind:p.kind,x:p.x,y:p.y,width:p.width,low:p.low,high:p.high,col:p.col,cut:p.cut})))});
  }
  return Object.freeze(out);
 }

 // --- Gisements candidats -----------------------------------------------
 // Pierre au pied des falaises et sur sol rocheux, bois en milieu boisé et en lisière,
 // ferraille au bord des routes. Tirage par hachage de la case : aucun flux de génération.
 function depositsOf(g,reach){
  const{S,levels,biomes,water,roads,kinds,passes,canton:c}=g,D=R.deposits,Wt=D.weights,size=S*S,zone=Math.min(D.zone,S),z0=(S-zone)/2,centre=S/2;
  const spreadFrom=(source,limit)=>{const d=new Int16Array(size).fill(-1),queue=[];for(let i=0;i<size;i++)if(source(i)){d[i]=0;queue.push(i);}
   for(let q=0;q<queue.length;q++){const i=queue[q];if(d[i]>=limit)continue;const x=i%S,y=(i-x)/S;for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(d[j]<0&&levels[j]===levels[i]){d[j]=d[i]+1;queue.push(j);}}}return d;};
  // Pied de falaise : case basse au contact d'un ressaut infranchissable.
  const foot=spreadFrom(i=>{const x=i%S,y=(i-x)/S;for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(levels[j]>levels[i]&&levels[i]>0&&!(k===0?passes[i]&1:k===1?passes[j]&1:k===2?passes[i]&2:passes[j]&2))return true;}return false;},D.foot);
  const roadside=spreadFrom(i=>roads[i]>0,D.roadside);
  const wooded=i=>BIOMES[biomes[i]].treeChance>=.3;
  const lisiere=spreadFrom(i=>{const x=i%S,y=(i-x)/S;for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;if(wooded(ny*S+nx)!==wooded(i))return true;}return false;},D.edge);
  const salt=K.subSeed(g.canton.seed,0,0,'gisements'),candidates=[];
  for(let y=z0+D.lattice/2;y<z0+zone;y+=D.lattice)for(let x=z0+D.lattice/2;x<z0+zone;x+=D.lattice){
   const px=round(x+(lattice(salt,x,y)-.5)),py=round(y+(lattice(salt^0x9e3779b9,x,y)-.5)),i=Math.floor(py)*S+Math.floor(px);
   if(far(px-centre,py-centre)<D.clear||!Number.isFinite(reach.dist[i])||water[i]||roads[i]||kinds[i]===KIND.ramp)continue;
   candidates.push({x:px,y:py,i,gx:x,gy:y});
  }
  const weigh={
   stone:p=>foot[p.i]>=0?[Wt.base+Wt.cliffFoot,'pied de falaise']:[Wt.base+Wt.rock*BIOMES[biomes[p.i]].rockChance,'sol rocheux'],
   wood:p=>lisiere[p.i]>=0?[Wt.base+Wt.tree*BIOMES[biomes[p.i]].treeChance+Wt.edge,'lisière']:[Wt.base+Wt.tree*BIOMES[biomes[p.i]].treeChance,wooded(p.i)?'bois':'arbres isolés'],
   scrap:p=>roadside[p.i]>=0?[Wt.base+Wt.roadside,'bord de route']:[Wt.base,'épave isolée']};
  const taken=[],out=[],order=Object.keys(D.kinds);
  order.forEach((type,n)=>{
   const def=D.kinds[type],seed=K.subSeed(g.canton.seed,0,0,'gisements-'+type),list=candidates.map(p=>{const[w,why]=weigh[type](p);return{p,why,key:Math.log(Math.max(1e-12,lattice(seed,p.gx,p.gy)))/w};}).sort((a,b)=>b.key-a.key||a.p.i-b.p.i);
   let count=0;
   for(const item of list){if(count>=def.count)break;const p=item.p;if(taken.some(q=>far(q.x-p.x,q.y-p.y)<D.spacing))continue;
    const u=lattice(seed^0x51ed270b,p.gx,p.gy),v=lattice(seed^0x2545f491,p.gx,p.gy);taken.push(p);count++;
    out.push(Object.freeze({id:K.entityId(0,0,'gite',out.length),type,x:p.x,y:p.y,amount:round(def.amount*(D.spread[0]+(D.spread[1]-D.spread[0])*u)),radius:round(def.radius*(.8+.4*v)),why:item.why,level:levels[p.i],biome:G.BIOMES[biomes[p.i]]}));}
  });
  return Object.freeze(out);
 }

 // --- Fiche du site -----------------------------------------------------
 const listing=sides=>sides.map(s=>WHERE[s]).join(', ').replace(/, ([^,]*)$/,' et $1');
 function sheetOf(g,sides,reach){
  const{S,water,levels,biomes,site}=g,centre=(S/2)*S+S/2,by=status=>SIDES.filter(s=>sides[s].status===status);
  const cliffs=SIDES.filter(s=>sides[s].status==='clos'&&sides[s].cause==='falaise'),wet=SIDES.filter(s=>sides[s].status==='clos'&&sides[s].cause==='eau'),gated=by('passage'),slowed=by('ralenti'),open=by('ouvert');
  const partial=open.filter(s=>sides[s].share<=.5),full=open.filter(s=>sides[s].share>.5),parts=[];
  if(cliffs.length===1)parts.push('adossée à une falaise '+WHERE[cliffs[0]]);else if(cliffs.length>1)parts.push('ceinte de falaises '+listing(cliffs));
  for(const s of wet)parts.push('fermée par '+WATER_NAME[['','sea','lake','river','stream'].indexOf(sides[s].water)]+' '+WHERE[s]);
  for(const s of gated){const p=sides[s].passages,kinds=[...new Set(p.map(q=>q.kind))],n=p.length;
   const name=kinds.length>1?(COUNT[n]||n)+' passages':kinds[0]==='col'?(n>1?(COUNT[n]||n)+' rampes':p[0].cut?'une rampe taillée':'un col'):kinds[0]==='pont'?(n>1?(COUNT[n]||n)+' ponts':'un pont'):'un goulet de '+p[0].width+' m';
   parts.push(name+' à tenir '+WHERE[s]);}
  for(const s of slowed)parts.push('un ruisseau à passer à gué '+WHERE[s]);
  if(partial.length)parts.push('à demi couverte '+listing(partial));
  if(full.length===4)parts.push('en terrain ouvert, rien pour s’adosser : quatre côtés à tenir');
  else if(full.length)parts.push('ouverte '+listing(full));
  const text=parts.join(', '),sentence=text.charAt(0).toUpperCase()+text.slice(1)+'.';
  // Eau la plus proche du centre, dans le cadre.
  let near=null;for(let i=0;i<S*S;i++)if(water[i]){const x=i%S+.5-S/2,y=Math.floor(i/S)+.5-S/2,d=far(x,y);if(!near||d<near.distance)near={distance:d,kind:['','sea','lake','river','stream'][water[i]],side:Math.abs(x)>Math.abs(y)?(x>0?'east':'west'):(y>0?'south':'north')};}
  let cliff=null;for(let i=0;i<S*S;i++)if(g.kinds[i]===KIND.cliff){const x=i%S+.5-S/2,y=Math.floor(i/S)+.5-S/2,d=far(x,y);if(!cliff||d<cliff.distance)cliff={distance:d,side:Math.abs(x)>Math.abs(y)?(x>0?'east':'west'):(y>0?'south':'north')};}
  const def=BIOMES[biomes[centre]];let within=0,level=0;for(let i=0;i<S*S;i++)if(Number.isFinite(reach.dist[i])){within++;if(levels[i]===levels[centre])level++;}
  return Object.freeze({level:levels[centre],biome:def.id,biomeName:def.name,closed:Object.freeze([...cliffs,...wet].sort((a,b)=>SIDES.indexOf(a)-SIDES.indexOf(b))),closedByCliff:Object.freeze(cliffs),closedByWater:Object.freeze(wet),
   passages:Object.freeze(gated.flatMap(s=>sides[s].passages.map(p=>Object.freeze({side:s,kind:p.kind,width:p.width,x:p.x,y:p.y,col:p.col})))),slowed:Object.freeze(slowed),open:Object.freeze(open),halfOpen:Object.freeze(partial),
   water:near&&Object.freeze({kind:near.kind,side:near.side,distance:round(near.distance)}),cliff:cliff&&Object.freeze({side:cliff.side,distance:round(cliff.distance)}),
   ground:Object.freeze({reachable:round(within/(S*S)),plateau:round(level/(S*S))}),
   regional:Object.freeze({cliff:site.cliff,water:site.water,cols:site.cols.length,enclosure:site.plateau.enclosure}),sentence});
 }

 // --- Carte locale ------------------------------------------------------
 function describe(seed,options={}){
  const g=grid(seed,options),S=g.S,centre=(S/2)*S+S/2;
  if(g.deep(centre))throw Error('Centre de la carte locale sous l’eau.');
  const reach=reachFrom(g,centre),sides=sidesOf(g,reach),deposits=depositsOf(g,reach),sheet=sheetOf(g,sides,reach);
  const cost=new Int32Array(S*S);for(let i=0;i<cost.length;i++)cost[i]=Number.isFinite(reach.dist[i])?reach.dist[i]:-1;
  // Une route peut longer le cadre sur un autre palier, sa rampe restant dehors : `linked` dit si elle mène à la cité sans sortir du cadre.
  const at=n=>Math.min(S-1,Math.max(0,Math.floor(n))),accesses=g.accesses.map(a=>Object.freeze({...a,linked:cost[at(a.y)*S+at(a.x)]>=0}));
  const local={version:R.version,generation:K.RULES.reservedGeneration,seed,canton:g.canton.id,site:g.site.id,frame:S,tile:R.tile,cells:S/R.tile,unit:C.TILE,ramp:g.ramp,
   origin:Object.freeze({x:g.canton.bounds.x+g.ox,y:g.canton.bounds.y+g.oy}),centre:Object.freeze({x:S/2,y:S/2}),level:g.levels[centre],biome:G.BIOMES[g.biomes[centre]],
   levels:g.levels,biomes:g.biomes,water:g.water,passes:g.passes,kinds:g.kinds,roads:g.roads,cost,accesses:Object.freeze(accesses),cols:Object.freeze(g.cols),sides,deposits,sheet};
  local.digest=digest(local);
  return Object.freeze(local);
 }
 function digest(l){
  let h=2166136261;const eat=v=>{h^=v&255;h=Math.imul(h,16777619);},text=s=>{for(let i=0;i<s.length;i++){const v=s.charCodeAt(i);eat(v);eat(v>>>8);}};
  for(const list of [l.levels,l.biomes,l.water,l.passes,l.kinds,l.roads])for(let i=0;i<list.length;i++)eat(list[i]);
  for(let i=0;i<l.cost.length;i++){const v=l.cost[i];eat(v);eat(v>>>8);eat(v>>>16);}
  text(JSON.stringify([l.seed,l.frame,l.origin,l.accesses,l.cols,l.sides,l.deposits,l.sheet]));
  return(h>>>0).toString(16).padStart(8,'0');
 }

 // --- Siège : fronts possibles et vérification par les chemins -----------
 // Relit la grille seule (paliers, rampes, eau, routes) : parcours en largeur indépendant du
 // calcul de `describe`. Une cité sans aucun front n'aurait ni siège ni sortie : `enclosed`.
 function siege(local){
  const S=local.frame,size=S*S,{levels,passes,water,roads}=local,centre=(S/2)*S+S/2;
  const deep=i=>{const w=water[i];return w===W.sea||w===W.lake||(w===W.river&&!roads[i]);};
  const steps=new Int32Array(size).fill(-1),queue=[centre];steps[centre]=0;
  for(let q=0;q<queue.length;q++){const i=queue[q],x=i%S,y=(i-x)/S;
   for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(steps[j]>=0||deep(j))continue;
    if(levels[i]!==levels[j]&&!(k===0?passes[i]&1:k===1?passes[j]&1:k===2?passes[i]&2:passes[j]&2))continue;
    steps[j]=steps[i]+1;queue.push(j);}}
  const fronts=[];let reachable=true,consistent=true;
  for(const side of SIDES){
   const s=local.sides[side],entries=segments(S,t=>steps[borderCell(S,side,t)]>=0);
   if(JSON.stringify(entries)!==JSON.stringify(s.entries))consistent=false;
   if(s.status==='clos'){if(entries.length)consistent=false;continue;}
   if(!entries.length){reachable=false;continue;}
   let walk=Infinity;for(const e of entries)for(let t=e.from;t<e.to;t++){const d=steps[borderCell(S,side,t)];if(d<walk)walk=d;}
   // Où la horde entre (tronçons du bord), et où elle est canalisée (passages).
   fronts.push(Object.freeze({side,status:s.status,width:s.width,entries:Object.freeze(entries),lanes:s.lanes,funnels:s.passages,walk:walk*local.tile}));
  }
  const count=status=>fronts.filter(f=>f.status===status).length;
  return Object.freeze({fronts:Object.freeze(fronts),open:count('ouvert'),slowed:count('ralenti'),funnelled:count('passage'),closed:SIDES.length-fronts.length,
   enclosed:fronts.length===0,reachable,consistent,ok:fronts.length>0&&reachable&&consistent});
 }
 // Chemin le moins coûteux d'un point du cadre au centre (cases), ou null : pour l'aperçu et les tests.
 function pathToCentre(local,x,y){
  const S=local.frame;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=S||y>=S)throw Error('Case de carte locale invalide.');
  let i=y*S+x;if(local.cost[i]<0)return null;
  const out=[i];
  while(local.cost[i]>0){let best=-1;const cx=i%S,cy=(i-cx)/S;
   for(let k=0;k<4;k++){const nx=cx+DX[k],ny=cy+DY[k];if(nx<0||ny<0||nx>=S||ny>=S)continue;const j=ny*S+nx;if(local.cost[j]<0||local.cost[j]>=local.cost[i])continue;
    if(local.levels[i]!==local.levels[j]&&!(k===0?local.passes[i]&1:k===1?local.passes[j]&1:k===2?local.passes[i]&2:local.passes[j]&2))continue;
    if(best<0||local.cost[j]<local.cost[best])best=j;}
   if(best<0)return null;i=best;out.push(i);}
  return out;
 }

 return Object.freeze({RULES:R,KIND,SIDES,WHERE,describe,siege,pathToCentre,digest});
});
