// Décor des six quartiers de la cité de terrain (génération 12 « sans bord » ; docs/GAME_BIBLE.md §2.1 et §7.13, réserve
// « quartiers sans décor propre » du préalable O9 (a)). Chaque quartier reçoit son décor identitaire — pavillons des
// Maisons sans voix, galerie et étals des Arcades muettes, tentes et mirador du Camp des veilleurs, citernes et hangar
// de la Cour des citernes, carcasse et abris du Terminus des cendres, baraque, guérites et blocs du Passage du dernier
// feu —, des ruelles peintes vers sa place et des parcelles constructibles laissées libres.
// Dérivation pure : graine, terrain de la cité et lieux déjà posés (quartiers, haltes, chantiers de jour, gisements,
// cœur) ; aucun tirage dans un flux de génération, aucun identifiant ni prélèvement existant changé. Toutes les pièces
// sont posées sur le terrain atteint depuis le centre, jamais dans l'eau, sur une rampe ni sur un plateau inaccessible ;
// une pièce qui couperait une seule case atteinte du centre est refusée.
// Effet de jeu (obstacles) : module d'extension `quarterDecor218`, actif dans les seules campagnes sans bord créées
// avec lui (`reset()` sur l'option ; `validate(undefined)` = ancienne campagne, inactive). Les pièces pleines sont lues
// par `fieldcraft.js` exactement comme le décor métrique (corps `metric202`/`body202`) : pas des survivants et des
// infectés, champ de flux (case couverte infranchissable), pose des chantiers, véhicule. Elles n'arrêtent ni la vue ni
// les tirs, comme ce décor. Peintres (2,5D et FPS) : lecture du plan seule, ni stock, ni dégât, ni tirage, ni horloge.
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.DeadwallQuarterDecor218=api;
 if(root.DEADWALL&&root.document&&root.DEADWALL.expansions)api.install(root.DEADWALL);
})(globalThis,function(root){
 'use strict';
 const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
 const R=C.QuarterDecor218Rules,TILE=C.TILE,RAMP=2;
 const DX=[1,-1,0,0],DY=[0,0,1,-1];
 const round=n=>Math.round(n*100)/100;
 // Hachage entier pur (grain des façades) : jamais un flux de tirage.
 function grain(x,y,salt){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(salt|0,2246822519);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;}
 // Décalages de recherche autour d'une place voulue : anneaux croissants, ordre fixe.
 const SPIRAL=new Map();
 function spiral(reach){
  if(SPIRAL.has(reach))return SPIRAL.get(reach);
  const out=[];for(let y=-reach;y<=reach;y++)for(let x=-reach;x<=reach;x++)out.push([x,y]);
  out.sort((a,b)=>a[0]*a[0]+a[1]*a[1]-b[0]*b[0]-b[1]*b[1]||a[1]-b[1]||a[0]-b[0]);
  const list=Object.freeze(out.map(Object.freeze));SPIRAL.set(reach,list);return list;
 }
 // Repère d'un quartier : `out` vers l'extérieur de la cité (direction du centre au quartier, au quart de tour), `along` le long de la place.
 const FRAMES=Object.freeze([{out:[1,0],along:[0,1]},{out:[0,1],along:[-1,0]},{out:[-1,0],along:[0,-1]},{out:[0,-1],along:[1,0]}].map(Object.freeze));

 // --- Plan ------------------------------------------------------------------------------------------
 // `input` : {seed, tiles, levels, water, kinds, roads, deep, passes, reach, centre:{x,y} (cases), sites:[{id,name,theme,
 // x,y}] (unités), fixtures:[{l,t,r,b}] (lieux à laisser libres, unités), obstacles:[{l,t,r,b}] (corps de fieldcraft déjà
 // posés, unités), passages:[{x,y}] (cases)}. Rend un plan gelé, identique pour les mêmes entrées ; `digest` le résume.
 function layout(input){
  const N=input.tiles,size=N*N,{levels,water,kinds,roads,deep,passes,reach}=input,cx=input.centre.x+.5,cy=input.centre.y+.5;
  if(!Number.isInteger(N)||N<16||[levels,water,kinds,roads,deep,passes,reach].some(a=>!a||a.length!==size))throw Error('Terrain du décor des quartiers invalide.');
  const taken=new Uint8Array(size),fixture=new Uint8Array(size),solid=new Uint8Array(size),parcelled=new Uint8Array(size);
  const inside=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
  const mark=(grid,x0,y0,w,h,pad,v=1)=>{for(let y=y0-pad;y<y0+h+pad;y++)for(let x=x0-pad;x<x0+w+pad;x++)if(inside(x,y))grid[y*N+x]=v;};
  const cellOf=v=>Math.floor(v/TILE);
  const cover=(f,pad)=>{const x0=cellOf(f.l),y0=cellOf(f.t),x1=cellOf(f.r-1e-6),y1=cellOf(f.b-1e-6);mark(fixture,x0,y0,x1-x0+1,y1-y0+1,pad);};
  for(const f of input.fixtures||[])cover(f,R.fixtureMargin);
  // Obstacles déjà posés (gisements, haltes) : emprise seule, et case dont le centre touche leur corps (même lecture que le champ
  // de flux de `fieldcraft.js`, rayon de 12 unités) ; le décor ne doit couper aucune case encore atteinte malgré eux.
  const obstacle=new Uint8Array(size),touch=12;
  for(const f of input.obstacles||[]){cover(f,R.depositMargin);
   for(let y=Math.max(0,cellOf(f.t-touch));y<=Math.min(N-1,cellOf(f.b+touch));y++)for(let x=Math.max(0,cellOf(f.l-touch));x<=Math.min(N-1,cellOf(f.r+touch));x++){
    const px=(x+.5)*TILE,py=(y+.5)*TILE,dx=px-Math.max(f.l,Math.min(f.r,px)),dy=py-Math.max(f.t,Math.min(f.b,py));if(dx*dx+dy*dy<touch*touch)obstacle[y*N+x]=1;}}
  // Arête franchissable, comme le monde (`edge217`) : eau profonde refusée, même palier, ou rampe.
  const edge=(i,j,k)=>{if(deep[j])return false;if(levels[i]===levels[j])return true;return Boolean(k===0?passes[i]&1:k===1?passes[j]&1:k===2?passes[i]&2:passes[j]&2);};
  const start=input.centre.y*N+input.centre.x,seen=new Uint8Array(size),queue=new Int32Array(size);
  // Aucune case atteinte du centre (obstacles déjà posés compris) ne doit être coupée par les pièces pleines.
  function flood(){
   seen.fill(0);if(solid[start])return 0;let head=0,tail=0;seen[start]=1;queue[tail++]=start;
   while(head<tail){const i=queue[head++],x=i%N,y=(i-x)/N;
    for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(!inside(nx,ny))continue;const j=ny*N+nx;if(seen[j]||solid[j]||obstacle[j]||!edge(i,j,k))continue;seen[j]=1;queue[tail++]=j;}}
   return tail;
  }
  const base=new Uint8Array(size);let reachTotal=flood(),blockedCount=0;base.set(seen);
  const connected=()=>flood()===reachTotal-blockedCount;
  const ground=(i,level)=>reach[i]===1&&!water[i]&&kinds[i]!==RAMP&&levels[i]===level;
  const roadNear=(x0,y0,w,h,pad)=>{for(let y=y0-pad;y<y0+h+pad;y++)for(let x=x0-pad;x<x0+w+pad;x++)if(inside(x,y)&&roads[y*N+x])return true;return false;};
  const nearest=(x0,y0,w,h,px,py)=>Math.hypot(Math.max(x0-px,0,px-(x0+w)),Math.max(y0-py,0,py-(y0+h)));
  const placeable=(x0,y0,w,h,level)=>{
   if(x0<R.borderClear||y0<R.borderClear||x0+w>N-R.borderClear||y0+h>N-R.borderClear)return false;
   if(nearest(x0,y0,w,h,cx,cy)<R.centreClear)return false;
   for(const p of input.passages||[])if(nearest(x0,y0,w,h,p.x,p.y)<R.passageClear)return false;
   for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){const i=y*N+x;if(taken[i]||fixture[i]||!ground(i,level))return false;}
   return !roadNear(x0,y0,w,h,R.roadMargin);
  };
  const solidOK=(x0,y0,w,h,level)=>{
   if(!placeable(x0,y0,w,h,level))return false;
   for(let y=y0-R.clear;y<y0+h+R.clear;y++)for(let x=x0-R.clear;x<x0+w+R.clear;x++){if(!inside(x,y))return false;const i=y*N+x;if(!ground(i,level)||solid[i]||parcelled[i])return false;}
   return true;
  };
  const sites=(input.sites||[]).map(s=>({...s,gx:Math.min(N-1,Math.max(0,cellOf(s.x))),gy:Math.min(N-1,Math.max(0,cellOf(s.y)))}));
  // Places des six quartiers : jamais couvertes.
  for(const s of sites)mark(taken,s.gx-R.square,s.gy-R.square,2*R.square+1,2*R.square+1,0);
  const quarters=[];
  for(const s of sites){
   const recipe=R.themes[s.theme];if(!recipe)continue;
   const level=levels[s.gy*N+s.gx],a=Math.atan2(s.gy+.5-cy,s.gx+.5-cx),r=((Math.round(a/(Math.PI/2))%4)+4)%4,F=FRAMES[r];
   const at=(du,dv)=>({x:s.gx+.5+du*F.along[0]+dv*F.out[0],y:s.gy+.5+du*F.along[1]+dv*F.out[1]});
   const dims=(w,h)=>r%2===0?[h,w]:[w,h];
   // 1. Parcelles libres d'abord : elles ont la priorité sur les pièces du décor.
   const parcels=[];
   // Grande parcelle d'abord, puis la plus petite (une maison de 10 × 8 m dans le sens de la place).
   for(const [du,dv] of R.parcel.offsets){
    if(parcels.length>=R.parcel.count)break;
    const p=at(du,dv);let done=false;
    for(const [pw,ph] of R.parcel.sizes){
     const [w,h]=dims(pw,ph);
     for(const [ex,ey] of spiral(R.parcelSearch)){
      const x0=Math.round(p.x+ex-w/2),y0=Math.round(p.y+ey-h/2);if(!placeable(x0,y0,w,h,level))continue;
      parcels.push(Object.freeze({id:s.id+':parcelle-'+(parcels.length+1),x:x0,y:y0,w,h}));mark(taken,x0,y0,w,h,1);mark(parcelled,x0,y0,w,h,1);done=true;break;
     }
     if(done)break;
    }
   }
   // 2. Pièces pleines de la recette, au plus près de leur place, ruelle de `gap` mètres entre elles.
   const pieces=[];
   recipe.forEach(([kind,du,dv],n)=>{
    const K=R.kinds[kind],[w,h]=dims(K.w,K.h),p=at(du,dv);
    for(const [ex,ey] of spiral(R.search)){
     const x0=Math.round(p.x+ex-w/2),y0=Math.round(p.y+ey-h/2);if(!solidOK(x0,y0,w,h,level))continue;
     let own=0;for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)own+=base[y*N+x];
     mark(solid,x0,y0,w,h,0);blockedCount+=own;
     if(!connected()){mark(solid,x0,y0,w,h,0,0);blockedCount-=own;continue;}
     mark(taken,x0,y0,w,h,R.gap);
     pieces.push(Object.freeze({id:s.id+':'+kind+'-'+(n+1),kind,x:x0,y:y0,w,h,height:K.height,facing:r}));break;
    }
   });
   quarters.push({id:s.id,name:s.name,theme:s.theme,x:s.gx,y:s.gy,level,frame:r,parcels,pieces});
  }
  // 3. Ruelles : de la face de chaque pièce tournée vers sa place jusqu'à la place, par le sol du quartier (peinture seule).
  const parent=new Int32Array(size),dist=new Int16Array(size);
  for(const q of quarters){
   const goal=q.y*N+q.x,alleys=[];
   for(const p of q.pieces){
    // Case de seuil : au milieu de la face la plus proche de la place, hors de la pièce.
    const mx=p.x+p.w/2,my=p.y+p.h/2,dx=q.x+.5-mx,dy=q.y+.5-my;
    const door=Math.abs(dx)*p.h>=Math.abs(dy)*p.w?[dx>0?p.x+p.w:p.x-1,Math.floor(my)]:[Math.floor(mx),dy>0?p.y+p.h:p.y-1];
    if(!inside(door[0],door[1]))continue;const from=door[1]*N+door[0];if(!ground(from,q.level)||solid[from])continue;
    dist.fill(-1);dist[from]=0;parent[from]=-1;const list=[from];let found=false;
    for(let h=0;h<list.length&&!found;h++){const i=list[h],x=i%N,y=(i-x)/N;if(dist[i]>=R.alley.reach)continue;
     for(let k=0;k<4;k++){const nx=x+DX[k],ny=y+DY[k];if(!inside(nx,ny))continue;const j=ny*N+nx;if(dist[j]>=0||solid[j]||!ground(j,q.level))continue;dist[j]=dist[i]+1;parent[j]=i;list.push(j);if(j===goal){found=true;break;}}}
    if(!found)continue;
    const cells=[];for(let i=goal;i>=0;i=parent[i])cells.push([i%N,Math.floor(i/N)]);
    alleys.push(Object.freeze(cells.reverse().map(Object.freeze)));
   }
   q.alleys=alleys;
  }
  const frozen=quarters.map(q=>Object.freeze({...q,parcels:Object.freeze(q.parcels),pieces:Object.freeze(q.pieces),alleys:Object.freeze(q.alleys)}));
  const out={version:R.version,seed:input.seed,tiles:N,quarters:Object.freeze(frozen),pieces:frozen.reduce((n,q)=>n+q.pieces.length,0),parcels:frozen.reduce((n,q)=>n+q.parcels.length,0)};
  out.digest=digest(out);
  return Object.freeze(out);
 }
 function digest(plan){
  let h=2166136261;const text=JSON.stringify([plan.version,plan.seed,plan.tiles,plan.quarters]);
  for(let i=0;i<text.length;i++){const v=text.charCodeAt(i);h^=v&255;h=Math.imul(h,16777619);h^=v>>>8;h=Math.imul(h,16777619);}
  return(h>>>0).toString(16).padStart(8,'0');
 }
 // Entrées du plan lues dans une partie : terrain de la cité, quartiers, lieux déjà posés (positions stables d'une
 // reprise à l'autre : cœur, haltes, chantiers de jour, repères de quartier, gisements du terrain).
 function inputOf(g){
  const w=g?.world,t=w?.terrain217;if(!t)return null;
  const box=(x,y,size)=>({l:x-size/2,t:y-size/2,r:x+size/2,b:y+size/2}),fixtures=[];
  const core=typeof g.core==='function'?g.core():null;if(core)fixtures.push({l:core.left,t:core.top,r:core.right,b:core.bottom});
  for(const p of g.expeditions?.sites?.()||[])if(Number.isFinite(p.x)&&Number.isFinite(p.y))fixtures.push(box(p.x,p.y,90));
  for(const p of g.dayworks?.snapshot?.().sites||[])if(Number.isFinite(p.x)&&Number.isFinite(p.y))fixtures.push(box(p.x,p.y,50));
  for(const p of w.sites||[])fixtures.push(box(p.x,p.y,96));
  // Obstacles de fieldcraft déjà posés : gisements (enveloppe stable) et haltes d'expédition (corps fixes).
  const obstacles=[];for(const n of w.nodes||[])if(n.depositId)obstacles.push(envelope(g,n));
  if(g.fieldcraft?.fixtures&&g.fieldcraft.rect)for(const f of g.fieldcraft.fixtures())obstacles.push(g.fieldcraft.rect(f));
  const passages=[];for(const s of Object.values(t.sides||{}))for(const p of s?.passages||[])passages.push({x:p.x,y:p.y});
  return{seed:t.seed,tiles:t.tiles,levels:t.levels,water:t.water,kinds:t.kinds,roads:t.roads,deep:t.deep,passes:t.passes,reach:t.reach,centre:t.centre,sites:w.sites||[],fixtures,obstacles,passages};
 }
 // Enveloppe d'un gisement : son corps de collision sans gabarit métrique, réunie au gabarit d'épave que lui donne une
 // reprise (`prepareMetricScenery202` : ferraille 1 à 3, carburant impair) ; la même d'une reprise à l'autre.
 function envelope(g,n){
  const F=g.fieldcraft,plain={...n,metric202:undefined,body202:undefined,renderSize:n.metric202===1?undefined:n.renderSize},a=F?.rect?F.rect(plain):{l:n.x-(n.radius||20)*1.4,t:n.y-(n.radius||20)*1.4,r:n.x+(n.radius||20)*1.4,b:n.y+(n.radius||20)*1.4};
  const b=F?.reserveRect?F.reserveRect(plain):a,variant=Math.abs(n.variant||0)%4,profiles=C.WorldEvolution?.RULES?.vehicles||{};
  const kind=n.type==='scrap'?({1:'break',2:'van',3:'truck'})[variant]:n.type==='fuel'&&variant%2?'break':null,p=kind&&profiles[kind];
  const out={l:Math.min(a.l,b.l),t:Math.min(a.t,b.t),r:Math.max(a.r,b.r),b:Math.max(a.b,b.b)};
  if(p){const w=p.w*TILE/2,h=p.h*TILE/2;out.l=Math.min(out.l,n.x-w);out.t=Math.min(out.t,n.y-h);out.r=Math.max(out.r,n.x+w);out.b=Math.max(out.b,n.y+h);}
  return out;
 }
 // Corps physiques des pièces pleines (unités), lus par `fieldcraft.js` comme le décor métrique.
 function bodiesOf(plan){
  const out=[];
  for(const q of plan.quarters)for(const p of q.pieces)out.push(Object.freeze({id:'quartier218:'+p.id,quarter218:p.id,kind218:p.kind,x:(p.x+p.w/2)*TILE,y:(p.y+p.h/2)*TILE,metric202:1,body202:Object.freeze({w:p.w*TILE,h:p.h*TILE}),fixture:true}));
  return Object.freeze(out);
 }

 // --- Peinture 2,5D ---------------------------------------------------------------------------------
 const RISE=(C.CityGeometry202?.presentation?.projectedHeightUnitsPerMetre)||16;
 const PALETTE=Object.freeze({
  pavillon:{wall:'#7b7364',roof:'#5b4a3f',trim:'#3a352f'},appentis:{wall:'#6c6456',roof:'#4f4a43',trim:'#34302b'},
  arcade:{wall:'#8a7d68',roof:'#625548',trim:'#3d362e'},etal:{wall:'#6b5a44',roof:'#8b5a3c',trim:'#c2ab7a'},
  tente:{wall:'#59614d',roof:'#6d7559',trim:'#3d4335'},mirador:{wall:'#6b5638',roof:'#54452f',trim:'#3a2f21'},
  citerne:{wall:'#6c6a5f',roof:'#83796a',trim:'#8f5b3a'},hangar:{wall:'#636860',roof:'#4f5651',trim:'#2f3431'},
  abri:{wall:'#5e655f',roof:'#47504c',trim:'#9aa092'},carcasse:{wall:'#3b3632',roof:'#2a2623',trim:'#7a4a2e'},kiosque:{wall:'#6f6a5a',roof:'#4a5a4c',trim:'#363a33'},
  guerite:{wall:'#77786c',roof:'#55574f',trim:'#a3433a'},blocs:{wall:'#8d8b80',roof:'#a3a194',trim:'#6a685f'},baraque:{wall:'#6d7062',roof:'#4d5248',trim:'#a3433a'}});
 function drawPiece(ctx,p){
  const T=TILE,l=p.x*T,t=p.y*T,w=p.w*T,h=p.h*T,b=t+h,H=p.height*RISE,c=PALETTE[p.kind]||PALETTE.pavillon;
  ctx.save();
  ctx.fillStyle='rgba(8,10,8,.34)';ctx.fillRect(l+6,t+8,w,h);
  if(p.kind==='citerne'){
   const rx=w/2,ry=h/2*.55,x=l+rx;ctx.fillStyle=c.wall;ctx.fillRect(l,b-H-ry,w,H);
   ctx.beginPath();ctx.ellipse(x,b-ry,rx,ry,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=c.roof;ctx.beginPath();ctx.ellipse(x,b-H-ry,rx,ry,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=c.trim;ctx.lineWidth=3;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(l,b-ry-H*k/4);ctx.lineTo(l+w,b-ry-H*k/4);ctx.stroke();}
   ctx.restore();return;
  }
  if(p.kind==='mirador'){
   ctx.fillStyle=c.trim;for(const x of [l+4,l+w-10])ctx.fillRect(x,b-H,6,H);
   ctx.fillStyle=c.wall;ctx.fillRect(l,t-H,w,h);ctx.fillStyle=c.roof;ctx.fillRect(l-4,t-H-RISE*1.4,w+8,RISE*1.4);
   ctx.restore();return;
  }
  // Face avant (sud) puis toit : la hauteur monte vers le nord de l'écran.
  // Tente : deux pans de toile tendus sur un faîtage, pignon avant ouvert.
  if(p.kind==='tente'){const m=l+w/2;
   ctx.fillStyle=c.roof;ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(m,t-H);ctx.lineTo(m,b-H);ctx.lineTo(l,b);ctx.closePath();ctx.fill();
   ctx.fillStyle=c.wall;ctx.beginPath();ctx.moveTo(m,t-H);ctx.lineTo(l+w,t);ctx.lineTo(l+w,b);ctx.lineTo(m,b-H);ctx.closePath();ctx.fill();
   ctx.fillStyle='#4a513f';ctx.beginPath();ctx.moveTo(l,b);ctx.lineTo(m,b-H);ctx.lineTo(l+w,b);ctx.closePath();ctx.fill();
   ctx.fillStyle=c.trim;ctx.beginPath();ctx.moveTo(m-T*.45,b);ctx.lineTo(m,b-H*.7);ctx.lineTo(m+T*.45,b);ctx.closePath();ctx.fill();ctx.restore();return;}
  ctx.fillStyle=c.wall;ctx.fillRect(l,b-H,w,H);
  ctx.fillStyle=c.roof;ctx.fillRect(l,t-H,w,h);
  ctx.strokeStyle=c.trim;ctx.lineWidth=2;ctx.strokeRect(l+1,t-H+1,w-2,h-2);
  // Ouvertures de façade, au grain fixe de la pièce (hachage de sa position).
  const bays=Math.max(1,Math.floor(w/(2.4*T)));ctx.fillStyle=c.trim;
  for(let k=0;k<bays;k++){const x=l+(k+.5)*w/bays;
   if(p.kind==='arcade'){ctx.beginPath();ctx.moveTo(x-w/bays*.36,b);ctx.lineTo(x-w/bays*.36,b-H*.55);ctx.arc(x,b-H*.55,w/bays*.36,Math.PI,0);ctx.lineTo(x+w/bays*.36,b);ctx.closePath();ctx.fill();}
   else if(p.kind==='etal'){ctx.fillStyle=k%2?'#c2ab7a':'#8b5a3c';ctx.fillRect(l+k*w/bays,b-H,w/bays,H*.3);ctx.fillStyle=c.trim;}
   else if(p.kind==='carcasse'){ctx.fillStyle='#1b1816';ctx.fillRect(x-T*.7,b-H*.85,T*1.4,H*.4);ctx.fillStyle=c.trim;}
   else if(p.kind==='blocs'){ctx.fillRect(l+k*w/bays+2,b-H,2,H);}
   else{const shut=grain(p.x*7+k,p.y,218)>.35;ctx.fillStyle=shut?'#4b4237':'#1d1f1b';ctx.fillRect(x-T*.45,b-H*.72,T*.9,H*.32);ctx.fillStyle=c.trim;}
  }
  if(p.kind==='pavillon'||p.kind==='baraque'||p.kind==='kiosque'||p.kind==='guerite'){ctx.fillStyle='#2b2622';ctx.fillRect(l+w/2-T*.5,b-Math.min(H,2.1*RISE),T,Math.min(H,2.1*RISE));}
  ctx.restore();
 }
 function drawGround(ctx,plan,g,view){
  const T=TILE,vis=(x,y,r)=>!view||typeof g.visible!=='function'||g.visible(x,y,r,view);
  ctx.save();
  for(const q of plan.quarters){
   const qx=(q.x+.5)*T,qy=(q.y+.5)*T;if(!vis(qx,qy,40*T))continue;
   // Place : pavé usé.
   ctx.fillStyle='rgba(150,140,118,.22)';ctx.fillRect((q.x-R.square)*T,(q.y-R.square)*T,(2*R.square+1)*T,(2*R.square+1)*T);
   // Ruelles : terre battue de `alley.width` mètres.
   ctx.strokeStyle='rgba(126,112,86,.42)';ctx.lineWidth=R.alley.width*T;ctx.lineCap='round';ctx.lineJoin='round';
   for(const a of q.alleys){ctx.beginPath();a.forEach(([x,y],k)=>k?ctx.lineTo((x+.5)*T,(y+.5)*T):ctx.moveTo((x+.5)*T,(y+.5)*T));ctx.stroke();}
   // Parcelles libres : cordeau et piquets aux angles.
   for(const p of q.parcels){
    ctx.fillStyle='rgba(176,168,120,.10)';ctx.fillRect(p.x*T,p.y*T,p.w*T,p.h*T);
    ctx.strokeStyle='rgba(214,196,138,.7)';ctx.lineWidth=3;ctx.setLineDash?.([18,12]);ctx.strokeRect(p.x*T+2,p.y*T+2,p.w*T-4,p.h*T-4);ctx.setLineDash?.([]);
    ctx.fillStyle='#c9b27a';for(const [x,y] of [[p.x,p.y],[p.x+p.w,p.y],[p.x,p.y+p.h],[p.x+p.w,p.y+p.h]])ctx.fillRect(x*T-5,y*T-5,10,10);
   }
   if(typeof ctx.fillText==='function'){ctx.fillStyle='rgba(236,224,190,.85)';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText(q.name.toUpperCase(),qx,qy+10);}
  }
  ctx.restore();
 }
 // --- Peinture FPS ----------------------------------------------------------------------------------
 // Boîtes (mètres, z vers le haut) posées sur le relief du terrain : lecture seule du plan.
 const FPS_TINT=Object.freeze(Object.fromEntries(Object.entries(PALETTE).map(([k,v])=>[k,Object.freeze({wall:hex(v.wall),roof:hex(v.roof),trim:hex(v.trim)})])));
 function hex(s){return[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);}
 function fpsBoxes(plan,elevation){
  const out=[];
  for(const q of plan.quarters){
   const z0=elevation((q.x+.5)*TILE,(q.y+.5)*TILE);
   out.push({box:{x:q.x-R.square,y:q.y-R.square,z:z0,w:2*R.square+1,h:2*R.square+1,d:.03},tint:[.46,.43,.37]});
   for(const a of q.alleys){
    // Tronçons droits fusionnés.
    let k=0;while(k<a.length-1){let e=k+1;const dx=a[e][0]-a[k][0],dy=a[e][1]-a[k][1];while(e+1<a.length&&a[e+1][0]-a[e][0]===dx&&a[e+1][1]-a[e][1]===dy)e++;
     const x0=Math.min(a[k][0],a[e][0]),y0=Math.min(a[k][1],a[e][1]),x1=Math.max(a[k][0],a[e][0]),y1=Math.max(a[k][1],a[e][1]),half=R.alley.width/2;
     out.push({box:{x:x0+.5-half,y:y0+.5-half,z:z0+.01,w:x1-x0+2*half,h:y1-y0+2*half,d:.025},tint:[.40,.36,.28]});k=e;}
   }
   for(const p of q.parcels){
    out.push({box:{x:p.x,y:p.y,z:z0,w:p.w,h:p.h,d:.02},tint:[.50,.48,.36]});
    for(const [x,y] of [[p.x,p.y],[p.x+p.w,p.y],[p.x,p.y+p.h],[p.x+p.w,p.y+p.h]])out.push({box:{x:x-.12,y:y-.12,z:z0,w:.24,h:.24,d:1.1},tint:[.79,.70,.48]});
   }
   for(const p of q.pieces){
    const c=FPS_TINT[p.kind]||FPS_TINT.pavillon,z=elevation((p.x+p.w/2)*TILE,(p.y+p.h/2)*TILE),H=p.height;
    if(p.kind==='mirador'){for(const [x,y] of [[p.x,p.y],[p.x+p.w-.3,p.y],[p.x,p.y+p.h-.3],[p.x+p.w-.3,p.y+p.h-.3]])out.push({box:{x,y,z,w:.3,h:.3,d:H-1.6},tint:c.trim});
     out.push({box:{x:p.x,y:p.y,z:z+H-1.6,w:p.w,h:p.h,d:1},tint:c.wall});out.push({box:{x:p.x-.2,y:p.y-.2,z:z+H-.4,w:p.w+.4,h:p.h+.4,d:.4},tint:c.roof});continue;}
    if(p.kind==='etal'){out.push({box:{x:p.x,y:p.y,z,w:p.w,h:p.h,d:H*.45},tint:c.wall});out.push({box:{x:p.x-.1,y:p.y-.1,z:z+H-.15,w:p.w+.2,h:p.h+.2,d:.15},tint:c.roof});
     for(const [x,y] of [[p.x,p.y],[p.x+p.w-.15,p.y+p.h-.15]])out.push({box:{x,y,z,w:.15,h:.15,d:H},tint:c.trim});continue;}
    out.push({box:{x:p.x,y:p.y,z,w:p.w,h:p.h,d:H*(p.kind==='tente'?.6:.82)},tint:c.wall});
    if(p.kind==='tente'){out.push({box:{x:p.x+.3,y:p.y+.3,z:z+H*.6,w:p.w-.6,h:p.h-.6,d:H*.4},tint:c.roof});continue;}
    if(p.kind==='blocs'){continue;}
    out.push({box:{x:p.x-.2,y:p.y-.2,z:z+H*.82,w:p.w+.4,h:p.h+.4,d:H*.18},tint:c.roof});
    if(p.kind==='citerne')for(const f of [.3,.6])out.push({box:{x:p.x-.05,y:p.y-.05,z:z+H*f,w:p.w+.1,h:p.h+.1,d:.18},tint:c.trim});
    if(p.kind==='carcasse')out.push({box:{x:p.x+.4,y:p.y+.4,z:z+H*.4,w:p.w-.8,h:p.h-.8,d:H*.3},tint:[.10,.09,.08]});
   }
  }
  return Object.freeze(out.map(Object.freeze));
 }

 // --- Module d'extension ----------------------------------------------------------------------------
 const KEYS=Object.freeze(['version','active','digest']);
 function initial(){return{version:1,active:false,digest:null};}
 function fresh(){return{version:1,active:true,digest:null};}
 function validate(raw,full){
  if(raw===undefined)return initial();
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1||typeof raw.active!=='boolean'||Object.keys(raw).length!==KEYS.length||KEYS.some(k=>!(k in raw)))throw Error('Décor des quartiers 218 invalide.');
  if(raw.digest!==null&&!(typeof raw.digest==='string'&&/^[0-9a-f]{8}$/.test(raw.digest)))throw Error('Empreinte du décor des quartiers invalide.');
  if(!raw.active){if(raw.digest!==null)throw Error('Décor des quartiers 218 invalide.');return initial();}
  if(full&&full.frontier?.generation!==R.generation)throw Error('Décor des quartiers sur une campagne sans terrain.');
  return{version:1,active:true,digest:raw.digest};
 }
 function install(g){
  if(!g||g.quarterDecor218)return g?.quarterDecor218||null;
  if(!g.expansions)return null;
  let state=initial(),pending=false,bound=null;
  // Plan de la partie en cours : posé après la création de la campagne ou sa reprise, jamais pendant (lieux encore en
  // préparation) ; rien sur une carte plate ni sur un autre monde que celui de la pose.
  const current=()=>bound&&bound.world===g.world&&state.active?bound:null;
  function activate(){
   bound=null;if(!state.active||!g.world?.terrain217)return null;
   let plan;try{plan=layout(inputOf(g));}catch(error){console.error('Décor des quartiers non posé',error);return null;}
   // Une pièce ne prend jamais la place d'un ouvrage existant (garde défensive, un plan stable n'en retire aucune).
   const live=[...g.world.buildings.values()].filter(b=>!b.dead),hit=p=>live.some(b=>b.left<(p.x+p.w)*TILE&&b.right>p.x*TILE&&b.top<(p.y+p.h)*TILE&&b.bottom>p.y*TILE);
   if(live.some(b=>b.type!=='core')&&plan.quarters.some(q=>q.pieces.some(hit)))plan=Object.freeze({...plan,quarters:Object.freeze(plan.quarters.map(q=>Object.freeze({...q,pieces:Object.freeze(q.pieces.filter(p=>!hit(p)))})))});
   bound={world:g.world,plan,bodies:bodiesOf(plan),fps:null};state.digest=plan.digest;
   g.world.navigationVersion=(g.world.navigationVersion||0)+1;g.world.flowDirty=true;g.flowTimer=0;
   return bound;
  }
  function overview(){
   const b=current();
   if(!state.active)return{summary:'Campagne sans décor de quartiers : région finie, ou campagne sans bord créée avant le décor des quartiers.',rows:[{label:'Quartiers',value:'Sans décor propre.'}]};
   if(!b)return{summary:'Décor des quartiers en attente de la cité.',rows:[]};
   return{summary:'Six quartiers abandonnés autour de D-17 : maisons, étals et ruelles barrent le passage comme le reste du décor ; les parcelles marquées au cordeau restent libres pour bâtir.',
    rows:b.plan.quarters.map(q=>({label:q.name,value:q.pieces.length+' pièce'+(q.pieces.length>1?'s':'')+' · '+q.parcels.length+' parcelle'+(q.parcels.length>1?'s':'')+' libre'+(q.parcels.length>1?'s':'')}))};
  }
  const api=Object.freeze({active:()=>state.active,plan:()=>current()?.plan||null,bodies:()=>current()?.bodies||[],snapshot:()=>({...state}),activate});
  g.quarterDecor218=api;
  g.expansions.register({id:'quarterDecor218',title:'Décor des quartiers',overview,actions:()=>[],validate,snapshot:api.snapshot,available:()=>state.active,
   restore:raw=>{state=!raw||!raw.active?initial():{version:1,active:true,digest:raw.digest};bound=null;if(state.active)activate();},
   reset:()=>{state=pending?fresh():initial();bound=null;}});
  // Option « Sans bord » : septième argument de startNew (ou départ de génération 12) ; plan posé une fois la cité prête.
  const start=g.startNew.bind(g);
  g.startNew=(...a)=>{const before=pending;pending=a[6]===true||a[5]?.generation===R.generation;let r;try{r=start(...a);}finally{pending=before;}if(r!==false&&state.active)activate();return r;};
  const wrap=(name,fn)=>{const old=g[name]?.bind(g);if(old)g[name]=(...a)=>fn(old,...a);};
  const home=view=>!g.frontier?.active?.()||view?.homeProjection===true;
  wrap('drawGround',(old,ctx,view,...rest)=>{const r=old(ctx,view,...rest);const b=current();if(b&&home(view))drawGround(ctx,b.plan,g,view);return r;});
  wrap('depthEntries',(old,view,...rest)=>{
   const entries=old(view,...rest),b=current();if(!b||!home(view)||!Array.isArray(entries))return entries;
   let n=0;for(const q of b.plan.quarters)for(const p of q.pieces){n++;const x=(p.x+p.w/2)*TILE,y=(p.y+p.h/2)*TILE,r=Math.max(p.w,p.h)*TILE/2+p.height*RISE;
    if(view&&typeof g.visible==='function'&&!g.visible(x,y-p.height*RISE/2,r,view))continue;
    entries.push({kind:1,id:218000+n,depth:(p.y+p.h)*TILE,order:entries.length,draw:ctx=>drawPiece(ctx,p)});}
   entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||(a.order||0)-(b.order||0));return entries;
  });
  return api;
 }
 // Corps lus par `fieldcraft.js` (aucun sur une carte plate, une campagne sans le module ou avant la pose).
 function solids(g){return g?.quarterDecor218?.bodies?.()||[];}
 // Boîtes de la vue FPS (vertical-citadel175-render.js), sur le relief `F` (DeadwallTerrainFPS217) ; gardées par plan.
 const FPS=new WeakMap();
 function boxesFor(g,F){
  const plan=g?.quarterDecor218?.plan?.();if(!plan||!F||typeof F.elevation!=='function')return[];
  let list=FPS.get(plan);if(!list){list=fpsBoxes(plan,(x,y)=>F.elevation(g.world,x,y));FPS.set(plan,list);}return list;
 }
 return Object.freeze({RULES:R,layout,digest,inputOf,bodiesOf,fpsBoxes,drawPiece,drawGround,initial,fresh,validate,install,solids,boxesFor});
});
