/* Site surfaces follow existing geometry. No collision, speed, loot or save ownership. */
(function(root,factory){'use strict';const api=factory(root);root.DeadwallCodexSites162=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const RULES=freeze({cell:.6,clearance:.52,pathWidth:.72,maxCells:80000,maxTargets:6,maxCache:24});
 const MATERIALS=freeze({earth:{name:'Terre tassée',base:'#8c866c',edge:'#a09a7b'},gravel:{name:'Gravier stabilisé',base:'#929583',edge:'#aaa891'},paving:{name:'Dallage',base:'#a1a491',edge:'#c0bda4'},concrete:{name:'Béton de service',base:'#939d94',edge:'#afb4a4'},asphalt:{name:'Enrobé usé',base:'#697b73',edge:'#87978a'},rubble:{name:'Gravats tassés',base:'#818777',edge:'#a09b82'}});
 const rows=[
 ['residence','Maison et jardin',true,'gravel','Entrée, jardin arrière et annexes'],
 ['collective','Cour résidentielle partagée',false,'paving','Accès communs, vélos et déchets'],
 ['retail','Commerce et arrière-boutique',false,'paving','Accès clientèle séparé des équipements'],
 ['food','Alimentation et restauration',false,'paving','Terrasse, arrière-cour et livraisons'],
 ['workshop','Atelier et garage',false,'concrete','Accès aux établis, stocks et entretien'],
 ['hotel','Hébergement et cour de repos',false,'paving','Accès des chambres, terrasse et annexes'],
 ['health','Établissement de soins',false,'paving','Entrée et accès de service dégagés'],
 ['civic','Bâtiment public',false,'paving','Parvis et cour de maintenance'],
 ['education','École et connaissance',false,'paving','Cour commune et accès au matériel'],
 ['leisure','Loisirs et culture',false,'paving','Parvis et équipements existants'],
 ['logistics','Entrepôt et quai',false,'concrete','Manutention sans recouvrir les caisses'],
 ['industry','Site industriel',false,'concrete','Machines et stockage en place'],
 ['agriculture','Ferme et cultures',true,'earth','Cultures, remises et récupération d’eau'],
 ['forest','Site forestier',true,'gravel','Stockage du bois et matériel'],
 ['networks','Équipement de réseau',false,'concrete','Cour technique et maintenance'],
 ['transport','Transport et voirie',false,'asphalt','Supports existants seulement, sans ouvrage inventé'],
 ['security','Secours et protection',false,'concrete','Cour opérationnelle et stocks'],
 ['ruin','Lieu dégradé',true,'rubble','Passages conservés entre les vestiges']
 ];
 const PROFILES=freeze(Object.fromEntries(rows.map(([id,name,natural,material,purpose])=>[id,{id,name,natural,material,purpose}])));
 const FAMILIES=freeze({
 'Habitat individuel':'residence','Habitat collectif':'collective','Commerces non alimentaires':'retail',
 'Alimentation et restauration':'food','Services et petits ateliers':'workshop','Hôtellerie et hébergement':'hotel',
 'Santé':'health','Éducation et connaissance':'education','Administration et communauté':'civic',
 'Secours et protection civile':'security','Abris et souterrains':'security','Entrepôts et réserves':'logistics',
 'Automobile et carburant':'transport','Routes et ouvrages':'transport','Ferroviaire et transports collectifs':'transport',
 'Industrie et production':'industry','Énergie et communication':'networks','Eau et réseaux':'networks',
 'Agriculture':'agriculture','Forêts et filière bois':'forest','Mines et matériaux':'industry',
 'Ports et activités nautiques':'transport','Loisirs et culture':'leisure','Quartiers et agglomérations':'civic',
 'Ruines et lieux dégradés visitables':'ruin',habitat:'residence',commerce:'retail',industrie:'industry',public:'civic',rural:'agriculture',militaire:'security',transport:'transport',ruines:'ruin'});
 const BASE=freeze({residence:'residence',collective:'collective',alimentation:'food',restauration:'food',hebergement:'hotel',magasins:'retail',medical:'health',administration:'civic',education:'education',loisirs:'leisure',artisanat:'workshop',logistique:'logistics',industrie:'industry',campagne:'agriculture',reseaux:'networks',securite:'security',ruines:'ruin'});
 const getG=()=>root.DeadwallFrontierGeometry||(typeof require==='function'?require('./frontier-geometry.js'):null);
 const getR=()=>root.DeadwallCodex3000Runtime||(typeof require==='function'?require('./codex3000-runtime.js'):null);
 function describe(id){const card=getR()?.get(id);return card&&Object.hasOwn(FAMILIES,card.family)?PROFILES[FAMILIES[card.family]]:null;}
 function profileFor(p){
  if(p?.programme3000)return describe(p.programme3000)||PROFILES.retail;
  if(['cabin','sawmill'].includes(p?.type))return PROFILES.forest;
  if(p?.type==='garden'||p?.type==='marketgarden'||p?.type==='farmhouse')return PROFILES.agriculture;
  const detail=root.DeadwallSeedDetail157||(typeof require==='function'?require('./seed-detail157.js'):null);
  const family=detail?.typeFamily?.[p?.type];
  return family&&BASE[family]?PROFILES[BASE[family]]:describe(p?.codex)||PROFILES.retail;
 }
 const box=o=>({id:o.id,x:o.x,y:o.y,w:o.w,h:o.h});
 const positive=o=>o&&[o.x,o.y,o.w,o.h].every(Number.isFinite)&&o.w>0&&o.h>0;
 const over=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
 function obstacles(p,detail,G=getG()){
  const out=[{id:p.id+':building',x:0,y:0,w:p.w,h:p.h}];
  // Even a traversable flower bed should not receive a gravel path through its crops.
  const protectedSurface=new Set(['cropbed','flowerbed','patio','planter','pool']);
  for(const o of [...(p.outdoor||[]),...(detail?.outdoor||[])])if(positive(o)&&!o.dressing160&&(o.solid!==false||protectedSurface.has(o.kind)))out.push(box(o));
  for(const car of p.parking||[]){if(!positive(car)||!Number.isFinite(car.a))continue;
   const q=[[0,0],[car.w,0],[car.w,car.h],[0,car.h]].map(([x,y])=>{const v=G.global(car,x,y);return G.local(p,v.x,v.y);});
   const x=Math.min(...q.map(v=>v.x)),y=Math.min(...q.map(v=>v.y));
   out.push({id:car.id,x,y,w:Math.max(...q.map(v=>v.x))-x,h:Math.max(...q.map(v=>v.y))-y});
  }
  return out;
 }
 function build({seed,p,detail,geometry=getG()}){
  if(!Number.isInteger(seed)||!p?.id||!positive({x:0,y:0,w:p.w,h:p.h})||!geometry)throw Error('Parcelle de surface invalide');
  const profile=profileFor(p),bounds={x:-11,y:-16,w:p.w+22,h:p.h+40},cell=RULES.cell;
  const cols=Math.ceil(bounds.w/cell),rows=Math.ceil(bounds.h/cell),size=cols*rows,barriers=obstacles(p,detail,geometry);
  const empty=reason=>freeze({version:162,profile,bounds,paths:[],pads:[],connected:[],unreachable:[],reason,cells:0});
  if(size>RULES.maxCells)return empty('grid-limit');
  const blocked=new Uint8Array(size),parent=new Int32Array(size);parent.fill(-2);
  const at=(x,y)=>{const a=Math.floor((x-bounds.x)/cell),b=Math.floor((y-bounds.y)/cell);return a<0||b<0||a>=cols||b>=rows?-1:b*cols+a;};
  const point=i=>({x:bounds.x+(i%cols+.5)*cell,y:bounds.y+(Math.floor(i/cols)+.5)*cell});
  const margin=RULES.clearance+cell/2;
  for(const o of barriers){const x0=Math.max(0,Math.ceil((o.x-margin-bounds.x)/cell-.5)),x1=Math.min(cols-1,Math.floor((o.x+o.w+margin-bounds.x)/cell-.5));
   const y0=Math.max(0,Math.ceil((o.y-margin-bounds.y)/cell-.5)),y1=Math.min(rows-1,Math.floor((o.y+o.h+margin-bounds.y)/cell-.5));
   if(x0<=x1&&y0<=y1)for(let y=y0;y<=y1;y++)blocked.fill(1,y*cols+x0,y*cols+x1+1);
  }
  for(let i=0;i<size;i++){const q=point(i);if(q.x-RULES.clearance<bounds.x||q.y-RULES.clearance<bounds.y||q.x+RULES.clearance>bounds.x+bounds.w||q.y+RULES.clearance>bounds.y+bounds.h)blocked[i]=1;}
  const clear=(a,b)=>!barriers.some(o=>geometry.segmentRect(a,b,{x:o.x-RULES.clearance,y:o.y-RULES.clearance,w:o.w+RULES.clearance*2,h:o.h+RULES.clearance*2}));
  const nearest=(q,reachable=false)=>{let result=-1,d=Infinity;const center=at(q.x,q.y);if(center<0)return -1;
   const cx=center%cols,cy=Math.floor(center/cols);
   for(let y=Math.max(0,cy-2);y<=Math.min(rows-1,cy+2);y++)for(let x=Math.max(0,cx-2);x<=Math.min(cols-1,cx+2);x++){
    const i=y*cols+x;if(blocked[i]||reachable&&parent[i]===-2)continue;const v=point(i),distance=(v.x-q.x)**2+(v.y-q.y)**2;
    if(distance<d&&distance<=1.5**2&&clear(q,v)){result=i;d=distance;}
   }return result;
  };
  const entry={x:p.w/2,y:-1.3},start=nearest(entry);if(start<0)return empty('entry-obstructed');
  const queue=new Int32Array(size);let head=0,tail=1;queue[0]=start;parent[start]=-1;
  while(head<tail){const i=queue[head++],x=i%cols,y=Math.floor(i/cols);
   for(const n of [x>0?i-1:-1,x+1<cols?i+1:-1,y>0?i-cols:-1,y+1<rows?i+cols:-1])if(n>=0&&!blocked[n]&&parent[n]===-2){parent[n]=i;queue[tail++]=n;}
  }
  const targets=[{id:p.id+':rear-entry',points:[{x:p.w/2,y:p.h+1.3}]},{id:p.id+':garden-exit',points:[{x:p.w/2,y:p.h+23}]}];
  const equipment=new Set(['shed','greenhouse','pool','bench','worktable','workbench','container','waterButt','compost','cropbed','barbecue','playset','pallet','crateStack']);
  const fixtures=[...(p.outdoor||[]),...(detail?.outdoor||[])].filter(o=>positive(o)&&equipment.has(o.kind)&&!over(o,{x:0,y:0,w:p.w,h:p.h}));
  const rank=o=>['shed','greenhouse','pool','worktable','container'].includes(o.kind)?0:1;
  fixtures.sort((a,b)=>rank(a)-rank(b)||String(a.id).localeCompare(String(b.id)));
  for(const o of fixtures.slice(0,RULES.maxTargets-2))targets.push({id:o.id,points:[{x:o.x-1.2,y:o.y+o.h/2},{x:o.x+o.w+1.2,y:o.y+o.h/2},{x:o.x+o.w/2,y:o.y-1.2},{x:o.x+o.w/2,y:o.y+o.h+1.2}]});
  const paths=[],connected=[],unreachable=[],edges=new Set();
  for(const target of targets){let goal=-1;
   for(const q of target.points){const n=nearest(q,true);if(n>=0&&(goal<0||Math.hypot(point(n).x-entry.x,point(n).y-entry.y)<Math.hypot(point(goal).x-entry.x,point(goal).y-entry.y)))goal=n;}
   if(goal<0){unreachable.push(target.id);continue;}connected.push(target.id);
   for(let n=goal;parent[n]>=0;n=parent[n]){const prev=parent[n],key=n<prev?n+':'+prev:prev+':'+n;if(edges.has(key))continue;edges.add(key);paths.push({a:point(prev),b:point(n)});}
  }
  const pads=fixtures.filter(o=>['shed','greenhouse','worktable','workbench','container','barbecue'].includes(o.kind)).slice(0,8).map(o=>({id:o.id,x:o.x,y:o.y,w:o.w,h:o.h,material:profile.natural?'gravel':'concrete'}));
  return freeze({version:162,profile,bounds,paths,pads,connected,unreachable,entry:point(start),reason:null,cells:size});
 }
 const caches=new WeakMap();
 function forWorld(world,p){
  if(!world||world.generation<7||!p||typeof world.detailAt!=='function')return null;
  let cache=caches.get(world);if(!cache){cache=new Map();caches.set(world,cache);}
  const detail=world.detailAt(p,0),key=p.id,signature=[p.x,p.y,p.a,p.w,p.h].join(':');
  const old=cache.get(key);if(old&&old.detail===detail&&old.signature===signature){cache.delete(key);cache.set(key,old);return old.value;}
  const value=build({seed:world.seed,p,detail});cache.set(key,{detail,signature,value});
  if(cache.size>RULES.maxCache)cache.delete(cache.keys().next().value);return value;
 }
 function cacheSize(world){return caches.get(world)?.size||0;}
 function draw(c,site){if(!c||!site)return false;const material=MATERIALS[site.profile.material],b=site.bounds;
  c.save();try{c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();
   for(const p of site.pads){c.fillStyle=MATERIALS[p.material].base;c.fillRect(p.x,p.y,p.w,p.h);}
   c.lineCap='round';c.lineJoin='round';c.strokeStyle=material.edge;c.lineWidth=RULES.pathWidth;
   c.beginPath();for(const s of site.paths){c.moveTo(s.a.x,s.a.y);c.lineTo(s.b.x,s.b.y);}c.stroke();
   c.strokeStyle=material.base;c.lineWidth=RULES.pathWidth*.72;c.stroke();return true;
  }finally{c.restore();}
 }
 return freeze({RULES,MATERIALS,PROFILES,FAMILIES,describe,profileFor,obstacles,build,forWorld,cacheSize,draw});
});
