/* Seed-local geographic structure. Older worlds retain their original origin. */
(function(root){'use strict';
const G=root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
const C=root.DeadwallCore||(typeof require==='function'?require('./core.js'):null);
const rules=()=>C.GeographyRules135;
function home(seed,generation=6){
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Graine géographique invalide');
 const R=generation>=7?{...rules(),...C.GeographyRules141}:rules(),span=R.homeMaxFraction-R.homeMinFraction,salt=generation>=7?'141':'135',x=generation>=6?Math.round(R.size*(R.homeMinFraction+span*G.hash(seed,'home-x'+salt)/4294967296)):4096,y=generation>=6?Math.round(R.size*(R.homeMinFraction+span*G.hash(seed,'home-y'+salt)/4294967296)):4096;
 return Object.freeze({x,y,size:128,minX:x-64,minY:y-64,maxX:x+64,maxY:y+64});
}
function annexes(seed,generation=6){const h=home(seed,generation),poses=rules().annexes;return Object.entries(poses).map(([id,p])=>Object.freeze({id,x:h.x+p.dx,y:h.y+p.dy,a:p.a}));}
function reservations(seed,generation=6){const pad=rules().annexReserve;return annexes(seed,generation).map(p=>({...p,l:p.x-pad,r:p.x+pad,t:p.y-pad,b:p.y+pad}));}
const point=(x,y)=>({x,y}),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function generate(seed,{addRoad,biomes,generation=6}={}){
 const modern=generation>=7,R=rules(),K=C.GeographyRules141,size=R.size,h=home(seed,generation),rnd=G.rng(G.hash(seed,modern?'geography141':'geography135')),nodes=[],edges=[],towns=[],roadLines=[];
 const sample=(x,y)=>biomes?.sample(seed,x,y,true,{generation});
 const addNode=(x,y,kind,id)=>{const n={id:id||'N135_'+nodes.length,x,y,kind};nodes.push(n);return n;};
 const ports=[addNode(h.x+380,h.y,'approach','D17_E'),addNode(h.x-380,h.y,'approach','D17_W'),addNode(h.x,h.y-380,'approach','D17_N'),addNode(h.x,h.y+380,'approach','D17_S')];
 const candidates=new Map();if(biomes)for(let iy=0;iy<64;iy++)for(let ix=0;ix<64;ix++){const x=1100+(ix+.5)*(size-2200)/64,y=1100+(iy+.5)*(size-2200)/64;if(distance({x,y},h)<1300)continue;const id=sample(x,y).id;if(!candidates.has(id))candidates.set(id,[]);candidates.get(id).push({x,y,id,rank:G.hash(seed,ix,iy,'ecological-town')});}
 const firstSites=[];for(const[,items]of[...candidates].sort((a,b)=>a[1].length-b[1].length)){const p=items.sort((a,b)=>a.rank-b.rank).find(p=>firstSites.every(q=>distance(p,q)>=R.settlementSpacing));if(p)firstSites.push(p);}
 const names=['Les Aubiers','Val-des-Saules','Montbrune','Belle-Futaie','La Combe','Les Ramiers','Rochebrune','Les Granges','Clairval','Bois-Ferré','La Rive','Fontvieille','Chantepierre','Les Brandes','Le Vallon','Saint-Orme'];
 for(let i=0;towns.length<R.settlements&&i<8000;i++){
  const x=i<firstSites.length?firstSites[i].x:1100+rnd()*(size-2200),y=i<firstSites.length?firstSites[i].y:1100+rnd()*(size-2200);
  if(distance({x,y},h)<1300||nodes.some(n=>n.kind==='settlement'&&distance({x,y},n)<R.settlementSpacing))continue;
  const n=addNode(x,y,'settlement'),index=towns.length,biome=sample(x,y)?.id||'rural',roll=biome==='brownfield'?90:G.hash(seed,n.id,'size')%100,kind=roll<18?'hameau':roll<53?'village':roll<84?'bourg':roll<96?'ville':'grande-ville',radius={hameau:240,village:360,bourg:490,ville:620,'grande-ville':780}[kind];
  const t={...n,id:'T135_'+index,name:names[G.hash(seed,n.id,'name')%names.length]+' '+(index+1),kind,r:radius,radius,target:{hameau:12,village:24,bourg:40,ville:65,'grande-ville':95}[kind],a:rnd()*Math.PI*2,parcels:0,biome};
  n.town=t.id;towns.push(t);
 }
 // The four termini are connected to real terrain on every side, independent of D-17.
 for(let side=0;side<4;side++){const lateral=size*(.18+rnd()*.64),xy=side===0?[R.margin,lateral]:side===1?[size-R.margin,lateral]:side===2?[lateral,R.margin]:[lateral,size-R.margin];addNode(...xy,'terminal','edge135_'+side);}
 const connected=new Set([0]),links=new Set();
 const link=(i,j,kind='regional')=>{const key=[i,j].sort((a,b)=>a-b).join(':');if(links.has(key))return false;links.add(key);edges.push({id:'E135_'+edges.length,a:nodes[i].id,b:nodes[j].id,kind});return true;};
 // A minimum spanning backbone connects every settlement and border terminus.
 while(connected.size<nodes.length){let best=null;for(const i of connected)for(let j=0;j<nodes.length;j++)if(!connected.has(j)){const d=distance(nodes[i],nodes[j]);if(!best||d<best.d)best={i,j,d};}link(best.i,best.j);connected.add(best.j);}
 // Short alternative itineraries avoid a tree of compulsory dead ends.
 for(let i=4;i<nodes.length;i++)if(nodes[i].kind==='settlement'&&G.hash(seed,i,'loop')%100<58){const choices=nodes.map((n,j)=>({j,d:distance(nodes[i],n)})).filter(q=>q.j!==i&&nodes[q.j].kind!=='terminal').sort((a,b)=>a.d-b.d);for(const q of choices.slice(0,4))if(link(i,q.j,'secondary'))break;}
 const bypassHalf=R.homeBypass,corner=bypassHalf+45,obstacle={x:h.x-bypassHalf,y:h.y-bypassHalf,w:bypassHalf*2,h:bypassHalf*2};
 function bypass(a,b){
  if(!G.segmentRect(a,b,obstacle))return[a,b];
  const v=[a,b,point(h.x-corner,h.y-corner),point(h.x+corner,h.y-corner),point(h.x+corner,h.y+corner),point(h.x-corner,h.y+corner)],cost=v.map(()=>Infinity),previous=v.map(()=>-1),done=new Set();cost[0]=0;
  while(done.size<v.length){let i=-1;for(let j=0;j<v.length;j++)if(!done.has(j)&&(i<0||cost[j]<cost[i]))i=j;if(i<0||!Number.isFinite(cost[i]))break;done.add(i);for(let j=0;j<v.length;j++)if(i!==j&&!G.segmentRect(v[i],v[j],obstacle)&&cost[i]+distance(v[i],v[j])<cost[j]){cost[j]=cost[i]+distance(v[i],v[j]);previous[j]=i;}}
  if(previous[1]<0)throw Error('Contour de D-17 introuvable');const out=[v[1]];for(let i=previous[1];i>=0;i=previous[i])out.unshift(v[i]);return out;
 }
 function curved(a,b,id,width,kind,allowHome=false){
  const len=distance(a,b);if(len<.01)return;const count=Math.max(1,Math.ceil(len/R.roadStep)),angle=Math.atan2(b.y-a.y,b.x-a.x),sign=G.hash(seed,id,'bend')%2?1:-1,amp=(kind==='approach'?0:Math.min(len*.09,260)*sign),phase=G.hash(seed,id,'sway')/4294967296*Math.PI*2;
  let poly;
  for(let factor=1;factor>=0;factor=factor===1?.4:factor===.4?0:-1){poly=[];for(let i=0;i<=count;i++){const t=i/count,offset=Math.sin(Math.PI*t)**2*(amp*Math.sin(Math.PI*t)+amp*.22*Math.sin(Math.PI*t*2+phase))*factor;poly.push(point(a.x+(b.x-a.x)*t-Math.sin(angle)*offset,a.y+(b.y-a.y)*t+Math.cos(angle)*offset));}if(allowHome||poly.slice(1).every((p,i)=>!G.segmentRect(poly[i],p,obstacle)))break;}
  for(let i=1;i<poly.length;i++){const a=poly[i-1],b=poly[i];if([a,b].some(p=>p.x<R.margin/2||p.y<R.margin/2||p.x>size-R.margin/2||p.y>size-R.margin/2))throw Error('Route hors limites');const r=addRoad([a.x,a.y],[b.x,b.y],width);r.corridor=id;r.roadClass=kind;roadLines.push(r);}
 }
 for(const e of edges){const a=nodes.find(n=>n.id===e.a),b=nodes.find(n=>n.id===e.b),way=bypass(a,b);for(let i=1;i<way.length;i++)curved(way[i-1],way[i],e.id+'_'+i,e.kind==='secondary'?5.8:7,e.kind);}
 // Only these straight approaches enter D-17; their four sides match its projection.
 for(const p of ports){const middle=point(h.x,h.y);curved(middle,p,'D17_'+p.id,7,'approach',true);}
 for(const t of towns){
  const small=t.kind==='hameau'||t.kind==='village',layout=small?'village-rue':t.kind==='ville'||t.kind==='grande-ville'?'quartier':G.hash(seed,t.id,'layout')%2?'bourg':'village-rue';t.layout=layout;
  const R=t.radius,c=Math.cos(t.a),s=Math.sin(t.a),at=(x,y)=>{const length=Math.hypot(x,y),scale=length>R*.96?R*.96/length:1;return point(t.x+(x*c-y*s)*scale,t.y+(x*s+y*c)*scale);},coordinates=[-.76,-.48,-.22,0,.24,.51,.78].map((x,i)=>modern&&i!==3?x+(G.hash(seed,t.id,i,'spine-position141')%1000/1000-.5)*K.streetPositionJitter:x),spine=coordinates.map((x,i)=>at(x*R,i===3?0:(G.hash(seed,t.id,i,'spine-bend')%1000/1000-.5)*R*(modern?K.streetBend:.19)));
  // A main street joins offset crossroads. Secondary streets never all start at
  // the regional node; this avoids repeating a radial star at every settlement.
  for(let i=1;i<spine.length;i++)curved(spine[i-1],spine[i],t.id+'_main'+i,layout==='quartier'?6.2:5.8,'street');
  const count=layout==='quartier'?6:layout==='bourg'?4:t.kind==='hameau'?2:3,indices=layout==='quartier'?[0,1,2,4,5,6]:layout==='bourg'?[1,2,4,5]:[1,4,5],ends=[[],[]];
  for(let i=0;i<count;i++){
   const anchor=spine[indices[i]],side=i%2?1:-1,branchAngle=t.a+side*(Math.PI/2+(G.hash(seed,t.id,i,'street-angle')%1000/1000-.5)*(modern?K.streetAngleSpread:.78)),length=R*(modern?K.streetLengthMin+G.hash(seed,t.id,i,'street-length')%1000/1000*K.streetLengthRange:.40+G.hash(seed,t.id,i,'street-length')%1000/2500),end=point(anchor.x+Math.cos(branchAngle)*length,anchor.y+Math.sin(branchAngle)*length),dx=end.x-t.x,dy=end.y-t.y,dist=Math.hypot(dx,dy);if(dist>R*.97){end.x=t.x+dx*R*.97/dist;end.y=t.y+dy*R*.97/dist;}
   curved(anchor,end,t.id+'_street'+i,5.2,'street');ends[i%2].push(end);
  }
  // Links only join a few neighbouring streets on the same side. No mandatory
  // circumferential polygon; village lanes may remain legitimate dead ends.
  const maxLinks=layout==='quartier'?3:layout==='bourg'?1+(G.hash(seed,t.id,'links')%2):G.hash(seed,t.id,'links')%4===0?1:0;let links=0;
  for(const side of ends)for(let i=1;i<side.length&&links<maxLinks;i++){curved(side[i-1],side[i],t.id+'_link'+links,5.2,'street');links++;}
 }

 const sectors=[];for(let y=0;y<size;y+=1024)for(let x=0;x<size;x+=1024)sectors.push({id:'S'+x/1024+'_'+y/1024,x,y,w:1024,h:1024,biome:sample(x+512,y+512)?.id||'rural',sites:[]});
 return{home:h,nodes,edges,towns,sectors,roads:roadLines};
}
const api=Object.freeze({home,annexes,reservations,generate});root.DeadwallGeography135=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
