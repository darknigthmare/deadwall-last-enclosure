'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js'),K=require('../src/world-cantons217.js'),G=require('../src/world-canton-gen217.js');
const {probe}=require('../scripts/probe-cantons217.cjs');
const ROOT=path.resolve(__dirname,'..'),R=C.WorldRelief217Rules,N=G.CELLS,read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const SEEDS=[0,1,42,17117,84329,967313470,1947648717,4294967295];
const block=(cx,cy,r)=>K.ring(cx,cy,r).map(c=>[c.cx,c.cy]);
const strip=w=>{if(!w)return w;const{direction,...rest}=w;return rest;};
// Les points de tracé sont arrondis au centimètre ; des deux côtés d'une couture ils sont strictement égaux.
const same=(a,b)=>Math.abs(a.x-b.x)<=.005+1e-9&&Math.abs(a.y-b.y)<=.005+1e-9;

test('canton 217 : règles gelées dans le cœur, maille et milieux cohérents avec l’existant',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.field)&&Object.isFrozen(R.escarpments)&&Object.isFrozen(R.roads.widths)&&Object.isFrozen(G)&&G.RULES===R);
  assert.equal(R.version,4);assert.equal(K.SIZE%R.cell,0);
  // Version 4 (T5) : prime de rive au choix du site de D-17 ; seul le site de certaines graines change.
  assert.ok(R.foundation.shoreWeight>0&&R.foundation.shoreReach>=1&&R.foundation.shoreCap>=1);
  for(const part of [R.pass,R.valley,R.origin,R.water,R.roads,R.towns,R.towns.kinds,R.towns.kinds.ville,R.towns.names,R.towns.order,R.foundation,R.sites])assert.ok(Object.isFrozen(part));
  // Falaises fréquentes, rampes rares : tailler une rampe coûte bien plus cher qu'emprunter un col.
  assert.ok(R.roads.rampCost*5<=R.roads.cutCost&&R.roads.cutCost<R.roads.steepCost&&R.pass.strand>=4&&R.pass.every>=16&&R.pass.islet>=2);
  assert.ok(R.water.streamFlow===1&&R.water.highSpring<R.water.spring&&R.water.spring<=1&&R.water.pondChance>0&&R.water.pondChance<1);
  assert.deepEqual([...G.TOWNS],['hameau','bourg','ville']);assert.ok(Math.abs(G.TOWNS.reduce((a,k)=>a+R.towns.kinds[k].share,0)-1)<1e-9);
  assert.ok(R.towns.kinds.hameau.radius<R.towns.kinds.bourg.radius&&R.towns.kinds.bourg.radius<R.towns.kinds.ville.radius&&R.towns.reach+R.towns.kinds.ville.radius<K.SIZE);
  // Les noms sont ceux du générateur d'agglomérations existant, repris tels quels.
  assert.deepEqual([...R.towns.names],JSON.parse(/const names=(\[[^\]]+\])/.exec(read('src/geography135.js'))[1].replace(/'/g,'"')));
  assert.equal(R.foundation.size,64);assert.equal(R.foundation.size%R.cell,0);assert.ok(R.origin.floor>1&&R.origin.inner<R.origin.outer);assert.equal(N,32);assert.equal(R.levels,6);
  assert.deepEqual([...G.BIOMES],[...C.BiomeRules135.defs,...C.EcologyRules164.defs].map(d=>d.id),'les 16 milieux existants, dans leur ordre');
  assert.equal(G.BIOMES.length,16);
  assert.ok(R.water.streamFlow<R.water.riverFlow&&R.water.riverFlow<R.water.capFlow);
  assert.ok(R.pass.band<R.pass.wideBand&&R.escarpments.every(e=>e.height>=2),'un ressaut d’au moins deux crans, sinon aucune falaise');
  assert.equal((read('src/core.js').match(/WorldRelief217Rules=/g)||[]).length,1);
});

test('canton 217 : même (graine, canton) → même canton, quel que soit l’ordre de visite et le cache',()=>{
  const cells=[...block(0,0,2),...block(-40,17,1)];
  const run=order=>{G.forget();const out=new Map();for(const[x,y]of order)out.set(K.id(x,y),G.generate(17117,x,y));return out;};
  const forward=run(cells),backward=run([...cells].reverse()),shuffled=run(cells.map((c,i)=>[K.subSeed(9,i,0,'ordre'),c]).sort((a,b)=>a[0]-b[0]).map(p=>p[1]));
  for(const[key,canton]of forward){
   assert.equal(backward.get(key).digest,canton.digest,key);assert.equal(shuffled.get(key).digest,canton.digest,key);
   assert.deepEqual(backward.get(key).roads,canton.roads);assert.deepEqual(backward.get(key).rivers,canton.rivers);assert.deepEqual(backward.get(key).sites,canton.sites);
   assert.deepEqual(shuffled.get(key).cols,canton.cols);assert.deepEqual(shuffled.get(key).towns,canton.towns);assert.deepEqual(shuffled.get(key).foundation,canton.foundation);assert.deepEqual([...shuffled.get(key).passes],[...canton.passes]);
   assert.deepEqual([...backward.get(key).levels],[...canton.levels]);
  }
  // Seul, sans aucun voisin généré, puis après un détour lointain et une autre graine.
  for(const[x,y]of [[0,0],[1,-2],[-40,17]]){G.forget();assert.equal(G.generate(17117,x,y).digest,forward.get(K.id(x,y)).digest);}
  for(const[x,y]of block(500,-500,1))G.generate(17117,x,y);G.generate(42,0,0);
  assert.equal(G.generate(17117,0,0).digest,forward.get('K0_0').digest);
  assert.notEqual(G.generate(42,0,0).digest,forward.get('K0_0').digest,'la graine change le canton');
  // Passé par le cache borné de la brique : l'éviction puis la reconstruction rendent le même canton.
  const cache=K.createCache();for(let step=0;step<=14;step++){for(const c of K.ring(step,0,1))cache.ensure(c.cx,c.cy,(x,y)=>G.generate(17117,x,y));cache.evict(step,0);}
  assert.ok(!cache.has(0,0));assert.equal(cache.ensure(0,0,(x,y)=>G.generate(17117,x,y)).digest,forward.get('K0_0').digest);
});

test('canton 217 : empreintes de référence figées (les changer, c’est changer les mondes sans bord)',()=>{
  // Tant que la génération 12 n'est ouverte nulle part, ces vecteurs peuvent encore bouger avec un réglage ; après l'ouverture, non.
  G.forget();
  assert.deepEqual([[17117,0,0],[17117,-3,2],[4294967295,-1048575,1048575],[0,5,-7]].map(([s,x,y])=>G.generate(s,x,y).digest),REFERENCE);
});
const REFERENCE=['d9f33527','a2a42a37','21cd15f4','113884c5'];

test('canton 217 : coordonnées négatives et bout de l’adressage',()=>{
  const m=K.RULES.maxCoordinate;
  for(const[x,y]of [[-1,-1],[-1,0],[0,-1],[-1000,999],[m,-m],[-m,m],[m,m]]){
   const c=G.generate(17117,x,y);assert.equal(c.id,K.id(x,y));assert.deepEqual(c.bounds,K.bounds(x,y));assert.equal(c.levels.length,N*N);
   for(const r of [...c.roads,...c.rivers])for(const p of r.points)assert.ok(p.x>=c.bounds.x&&p.x<=c.bounds.x+1024&&p.y>=c.bounds.y&&p.y<=c.bounds.y+1024,c.id);
   for(const s of c.sites)assert.deepEqual(K.parseEntity(s.id),{cx:x,cy:y,canton:c.id,kind:'site',index:c.sites.indexOf(s)});
  }
  // Au bout du monde, la couture extérieure n'existe pas : ni route ni eau n'en sortent.
  const corner=G.generate(17117,m,m);assert.equal(corner.crossings.east.edge,null);assert.equal(corner.crossings.south.road,null);assert.equal(corner.crossings.south.water,null);
  // Pas de symétrie entre quadrants.
  assert.notEqual(G.generate(17117,3,-2).digest,G.generate(17117,-3,2).digest);assert.notEqual(G.generate(17117,3,2).digest,G.generate(17117,-3,-2).digest);
  for(const bad of [[-1,0,0],[1.5,0,0],[4294967296,0,0],[1,.5,0],[1,0,m+1],['17117',0,0]])assert.throws(()=>G.generate(...bad));
  assert.throws(()=>G.altitude(1,NaN,0));assert.throws(()=>G.levelAt(-1,0,0));
});

test('canton 217 : relief par paliers — champ continu aux coutures, falaise à tout changement de palier hors col',()=>{
  const seen=new Set();let cliffs=0,slopes=0,sea=0;
  for(const seed of [17117,42])for(const[x,y]of block(-1,1,4)){
   const c=G.generate(seed,x,y),east=x<K.RULES.maxCoordinate?G.generate(seed,x+1,y):null,south=G.generate(seed,x,y+1);let localCliffs=0,localSlopes=0,localShore=0;
   for(let i=0;i<N*N;i++){
    const cx=i%N,cy=(i-cx)/N,l=c.levels[i];seen.add(l);assert.ok(l>=0&&l<R.levels);
    assert.equal(l,Math.floor(c.altitudes[i]));assert.equal(c.water[i]===G.WATER.sea,l===0,'palier 0 = mer');if(l===0)sea++;
    // L'écart vers l'est et le sud se lit dans le canton voisin : aucune couture dans le relief.
    const right=cx<N-1?c.levels[i+1]:east.levels[cy*N],below=cy<N-1?c.levels[i+N]:south.levels[cx];
    assert.equal(c.east[i],right-l);assert.equal(c.south[i],below-l);
    // Tout écart de palier est une falaise, sauf sur une arête de col ; du palier 1 à la mer, c'est un rivage.
    for(const[d,bit]of [[c.east[i],1],[c.south[i],2]]){
     if(!d){assert.equal(c.passes[i]&bit,0,'pas de col sur du plat');continue;}
     if(c.passes[i]&bit){localSlopes++;assert.ok(l>0&&l+d>0&&Math.abs(d)<=2,'un col relie deux paliers de terre');}
     else if((l===0||l+d===0)&&Math.abs(d)===1)localShore++;else localCliffs++;
    }
   }
   assert.deepEqual([c.counts.cliffs,c.counts.slopes,c.counts.shore],[localCliffs,localSlopes,localShore]);cliffs+=localCliffs;slopes+=localSlopes;
   const b=c.bounds;assert.equal(G.levelAt(seed,b.x+5,b.y+1000),c.levels[31*N]);assert.equal(G.biomeAt(seed,b.x+700,b.y+40),G.BIOMES[c.biomes[N+21]]);
  }
  assert.deepEqual([...seen].sort(),[0,1,2,3,4,5],'tous les paliers apparaissent');
  assert.ok(slopes>500&&cliffs>3*slopes,'falaises fréquentes, rampes rares : '+cliffs+' / '+slopes);assert.ok(sea>0);
  // Le champ lui-même est continu en mètres hors ressaut : deux points à 1 m ne diffèrent presque pas d'un canton à l'autre.
  for(const y of [-2000,37,5000])assert.ok(Math.abs(G.altitude(17117,1023.5,y)-G.altitude(17117,1024.5,y))<.5);
});

test('canton 217 : milieux cohérents avec l’altitude et l’humidité',()=>{
  const level=Object.fromEntries(G.BIOMES.map(id=>[id,[0,0]]));
  for(const seed of [17117,42,84329])for(const[x,y]of block(0,0,5)){const c=G.generate(seed,x,y);for(let i=0;i<N*N;i++)if(c.levels[i]){const s=level[G.BIOMES[c.biomes[i]]];s[0]+=c.levels[i];s[1]++;}}
  for(const id of G.BIOMES)assert.ok(level[id][1]>0,'milieu absent : '+id);
  const mean=id=>level[id][0]/level[id][1];
  for(const high of ['rockyHighland','conifer','limestone'])for(const low of ['wetland','riparian','peatland','alluvialTerrace','meadow'])assert.ok(mean(high)>mean(low)+.8,high+' '+mean(high).toFixed(2)+' > '+low+' '+mean(low).toFixed(2));
  // Un milieu d'eau n'occupe pas les hauteurs, un milieu de sommet n'occupe pas le bord de mer.
  assert.ok(mean('wetland')<2.6&&mean('rockyHighland')>3.4);
});

test('canton 217 : coutures — passages de route et d’eau identiques des deux côtés d’un damier',()=>{
  let seams=0,roadSeams=0,waterSeams=0,blocked=0,cutSeams=0;
  // Trois damiers, plus deux cantons connus dont une couture n'a aucun passage de plain-pied : la route y taille sa rampe.
  const cells=[];for(const seed of [17117,84329,4294967295])for(const[x,y]of block(-2,3,4))cells.push([seed,x,y]);cells.push([17117,5,0],[42,0,12]);
  for(const[seed,x,y]of cells){
   const c=G.generate(seed,x,y);
   for(const side of ['east','south']){
    const n=K.neighbour(x,y,side),other=G.generate(seed,n.cx,n.cy),mine=c.crossings[side],theirs=other.crossings[n.opposite];seams++;
    assert.equal(mine.edge,theirs.edge);assert.equal(mine.edge,K.edge(x,y,side).id);
    assert.deepEqual(mine.road,theirs.road);assert.equal(mine.blocked,theirs.blocked);assert.deepEqual(strip(mine.water),strip(theirs.water));
    assert.deepEqual(G.seam(seed,x,y,side).road,mine.road);assert.deepEqual(G.seam(seed,n.cx,n.cy,n.opposite).water,strip(mine.water));
    const line=K.edgeLine(x,y,side);
    for(const p of [mine.road,mine.water])if(p)assert.ok(p.x>=line.a.x&&p.x<=line.b.x&&p.y>=line.a.y&&p.y<=line.b.y,'le passage est sur la couture');
    if(mine.blocked)blocked++;
    if(mine.road){
     roadSeams++;
     // Un tronçon de chaque canton part exactement du même point, avec la même largeur et la même classe.
     const starts=[];for(const k of [c,other]){const road=k.roads.filter(r=>r.from===mine.edge);assert.equal(road.length,1,k.id+' '+mine.edge);assert.ok(same(road[0].points[0],mine.road));starts.push({...road[0].points[0]});assert.equal(road[0].width,mine.road.width);assert.equal(road[0].class,mine.road.class);}
     assert.deepEqual(starts[0],starts[1]);
     // Jamais par la mer ; de plain-pied, sinon par une rampe taillée que le canton ouest ou nord déclare comme col.
     const rise=Math.abs(mine.road.levels[0]-mine.road.levels[1]);assert.ok(rise<=2&&mine.road.levels[0]>0&&mine.road.levels[1]>0,'jamais de route par la mer ni par une très haute falaise');
     assert.equal(mine.road.via,rise?'taille':'plat');if(rise)cutSeams++;
     const made=c.cols.filter(k=>k.seam===mine.edge);assert.equal(made.length,rise?1:0);
     if(rise){assert.equal(made[0].kind,'taille');assert.equal(made[0].high-made[0].low,rise);assert.ok(same(made[0],mine.road));const[ix,iy]=side==='east'?[N-1,mine.road.index]:[mine.road.index,N-1];assert.ok(c.passes[iy*N+ix]&(side==='east'?1:2),'l’arête de couture taillée se franchit');}
    }
    if(mine.water){
     waterSeams++;assert.notEqual(mine.water.direction,theirs.water.direction);
     const up=mine.water.direction==='out'?c:other,down=up===c?other:c,w=mine.water;
     assert.equal(w.from,up.id);assert.equal(w.to,down.id);
     const out=up.rivers.filter(r=>r.to===w.edge);assert.equal(out.length,1,'une sortie d’eau en amont : '+w.edge);
     const last=out[0].points[out[0].points.length-1];assert.ok(same(last,w));assert.equal(last.level,w.level);
     // En aval, le cours d'eau repart du même point au même niveau — sauf s'il se jette aussitôt dans la mer.
     const entering=down.rivers.filter(r=>r.from===w.edge);
     if(entering.length){assert.equal(entering.length,1);assert.ok(same(entering[0].points[0],w));assert.deepEqual({...entering[0].points[0]},{...last},'même point, même niveau des deux côtés');assert.equal(entering[0].points[0].level,w.level);assert.equal(entering[0].width,w.width);assert.equal(entering[0].kind,w.kind);}
     else assert.ok(w.mouth,'un cours d’eau ne disparaît qu’à la mer : '+w.edge);
     if(mine.road)assert.ok(Math.abs(mine.road.index-w.index)>1,'route et eau ne passent pas au même point');
    }
   }
  }
  assert.ok(seams===490&&roadSeams>350&&waterSeams>100&&cutSeams>=2&&cutSeams*4<roadSeams,'damier significatif : '+[seams,roadSeams,waterSeams,blocked,cutSeams]);
});

test('canton 217 : l’eau descend les paliers, les lacs tiennent dans leur canton',()=>{
  let rivers=0,lakes=0,drops=0,through=0,fed=0;
  for(const seed of [17117,42,0])for(const[x,y]of block(2,-3,5)){
   const c=G.generate(seed,x,y),d=G.drainage(seed,x,y);assert.deepEqual({to:c.drain.to,sink:c.drain.sink,flow:c.drain.flow},{to:d.to,sink:d.sink,flow:d.flow});
   // L'écoulement entre cantons descend strictement et le débit ne décroît jamais vers l'aval.
   if(d.to){const n=K.neighbour(x,y,d.to),down=G.drainage(seed,n.cx,n.cy);assert.ok(down.low<d.low);assert.ok(down.flow>=Math.min(R.water.capFlow,d.flow));assert.equal(d.sink,null);}
   else assert.ok(d.sink==='sea'||d.sink==='lake');
   for(const r of c.rivers){
    rivers++;assert.ok(r.points.length>=2);assert.deepEqual(K.parseEntity(r.id),{cx:x,cy:y,canton:c.id,kind:'eau',index:c.rivers.indexOf(r)});
    assert.ok(['river','stream'].includes(r.kind));const range=C.Hydrology165Rules.kinds[r.kind].width;assert.ok(r.width>=range[0]&&r.width<=range[1]);
    for(let i=1;i<r.points.length;i++){assert.ok(r.points[i].level<=r.points[i-1].level,'le niveau ne remonte jamais : '+r.id);if(r.points[i].level<r.points[i-1].level)drops++;}
    assert.ok(r.to==='sea'||r.to==='confluence'||K.parseEdge(r.to)||K.parseEntity(r.to)?.kind==='lac',r.to);
   }
   assert.ok(c.lakes.length<=1);
   for(const lake of c.lakes){
    lakes++;const b=c.bounds;
    // Lac de cuvette (ou d'un canton côtier sans sortie), ou lac de vallée qu'un cours d'eau traverse et quitte
    // (un lac posé sur la source n'a qu'un émissaire).
    if(lake.through){through++;assert.equal(c.drain.sink,null);if(c.rivers.some(r=>r.to===lake.id))fed++;const out=c.rivers.filter(r=>r.from===lake.id);assert.equal(out.length,1,'un émissaire');assert.ok(K.parseEdge(out[0].to));assert.ok(out[0].points.every(p=>p.level===lake.bed),'l’émissaire repart au niveau du lac');}
    else assert.equal(c.drain.sink==='lake'||c.drain.sink==='sea',true);
    assert.ok(lake.x-lake.r>=b.x&&lake.x+lake.r<=b.x+1024&&lake.y-lake.r>=b.y&&lake.y+lake.r<=b.y+1024,'aucun lac coupé par une couture');
    let cells=0;for(let i=0;i<N*N;i++)if(c.water[i]===G.WATER.lake){cells++;assert.equal(c.levels[i],lake.level,'un lac est à plat');}
    assert.equal(cells,lake.cells);assert.ok(cells>=1);
   }
   if(c.drain.sink==='lake')assert.equal(c.lakes.length,1,'une cuvette porte un lac : '+c.id);
  }
  assert.ok(rivers>250&&lakes>30&&through>15&&fed*2>through&&drops>60,'eau présente : '+[rivers,lakes,through,fed,drops]);
});

// Composantes du réseau : routes d'un canton liées par leurs mailles communes, cantons liés par leurs coutures.
// `land` : part des réseaux d'un canton qui appartiennent au plus grand réseau de leur masse de terre
// (mailles de terre voisines à deux crans d'écart au plus) — la mer ne compte pas comme une coupure.
function network(seed,radius){
  const parent=new Map(),find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);parent.set(k,r);return r;},join=(a,b)=>{for(const k of [a,b])if(!parent.has(k))parent.set(k,k);parent.set(find(a),find(b));};
  const side=2*radius+1,W=side*N,lev=new Uint8Array(W*W),list=[];let cantons=0,served=0,dead=0,roads=0;const withRoads=[];
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
   const c=G.generate(seed,x,y);cantons++;list.push(c);
   for(let i=0;i<N*N;i++)lev[((y+radius)*N+Math.floor(i/N))*W+(x+radius)*N+i%N]=c.levels[i];
   if(!c.roads.length)continue;served++;withRoads.push(c.id);
   const cell=new Map();
   for(const r of c.roads){roads++;if(r.deadEnd)dead++;const key=c.id+'#'+r.id;join(key,key);join(c.id,c.id);for(const i of r.cells){if(cell.has(i))join(key,cell.get(i));else cell.set(i,key);}if(r.from)join(key,'couture '+r.from);}
   // Le canton compte comme desservi par sa plus grande composante : on le rattache à son premier tronçon.
   join(c.id,c.id+'#'+c.roads[0].id);
  }
  const sizes=new Map();for(const id of withRoads){const r=find(id);sizes.set(r,(sizes.get(r)||0)+1);}
  const mass=new Int32Array(W*W).fill(-1);let masses=0;
  for(let s=0;s<W*W;s++){if(mass[s]>=0||!lev[s])continue;const q=[s];mass[s]=masses;for(let k=0;k<q.length;k++){const i=q[k],x=i%W;for(const j of [x<W-1?i+1:-1,x>0?i-1:-1,i+W<W*W?i+W:-1,i-W])if(j>=0&&mass[j]<0&&lev[j]&&Math.abs(lev[j]-lev[i])<=2){mass[j]=masses;q.push(j);}}masses++;}
  const per=new Map();
  for(const c of list){const seen=new Set();for(const r of c.roads){const i=r.cells[0],g=mass[((c.cy+radius)*N+Math.floor(i/N))*W+(c.cx+radius)*N+i%N],net=find(c.id+'#'+r.id),key=g+'|'+net;if(seen.has(key))continue;seen.add(key);if(!per.has(g))per.set(g,new Map());per.get(g).set(net,(per.get(g).get(net)||0)+1);}}
  let total=0,main=0;for(const nets of per.values()){const v=[...nets.values()];total+=v.reduce((a,b)=>a+b,0);main+=Math.max(...v);}
  return{cantons,served,roads,dead,largest:Math.max(...sizes.values()),components:sizes.size,land:main/total,masses:per.size};
}

test('canton 217 : routes — jamais par l’eau profonde, changement de palier par un col seulement',()=>{
  let ramps=0,bridges=0,roads=0,cuts=0,steep=0;
  for(const seed of [17117,42,1947648717])for(const[x,y]of block(-3,-3,5)){
   const c=G.generate(seed,x,y),seenRamps=new Set(),owner=new Map();
   for(const r of c.roads){
    roads++;assert.deepEqual(K.parseEntity(r.id),{cx:x,cy:y,canton:c.id,kind:'route',index:c.roads.indexOf(r)});
    assert.ok(G.CLASSES.includes(r.class));assert.equal(r.width,R.roads.widths[r.class]);assert.ok(K.parseEdge(r.from),'chaque tronçon part d’une couture');
    assert.equal(c.crossings[K.SIDES.find(s=>c.crossings[s].edge===r.from)].road.class,r.class);
    for(let k=0;k<r.cells.length;k++){
     const i=r.cells[k];assert.ok(c.levels[i]>0&&c.water[i]!==G.WATER.sea&&c.water[i]!==G.WATER.lake,'route à sec : '+r.id);
     if(!k)continue;const p=r.cells[k-1],dx=Math.abs(i%N-p%N),dy=Math.abs(Math.floor(i/N)-Math.floor(p/N)),d=Math.abs(c.levels[i]-c.levels[p]);
     assert.ok(dx<=1&&dy<=1&&dx+dy>0);assert.ok(d<=2,'aucune route ne franchit une très haute falaise : '+r.id);
     if(d){assert.equal(dx+dy,1,'une rampe se prend de face');seenRamps.add(Math.min(i,p)+':'+Math.max(i,p));
      // Une route ne change de palier que sur une arête de col, naturel ou taillé par elle.
      const owner=Math.min(i,p),bit=dx?1:2;assert.ok(c.passes[owner]&bit,'changement de palier hors col : '+r.id);}
     if(dx+dy===2)assert.ok(!c.water[i]&&!c.water[p],'un pont se prend de face');
    }
    for(const i of r.cells)if(!owner.has(i))owner.set(i,r.id);
   }
   assert.equal(c.ramps.length,seenRamps.size,'chaque changement de palier d’une route est une rampe déclarée');
   for(const r of c.ramps){
    ramps++;if(r.cut)cuts++;else assert.equal(r.high-r.low,1,'un col naturel monte d’un cran');assert.ok(r.high-r.low>=1&&r.high-r.low<=2);if(r.high-r.low===2)steep++;
    // Rampe taillée ↔ col « taille » au même point ; rampe de col ↔ col naturel emprunté.
    const made=c.cols.filter(k=>k.kind==='taille'&&k.seam===null&&Math.abs(k.x-r.x)<.01&&Math.abs(k.y-r.y)<.01);assert.equal(made.length,r.cut?1:0);if(r.cut){assert.equal(made[0].width,1);assert.equal(made[0].high-made[0].low,r.high-r.low);}
   }
   assert.equal(c.cols.filter(k=>k.kind==='taille'&&k.seam===null).length,c.ramps.filter(r=>r.cut).length);assert.equal(c.counts.cuts,c.cols.filter(k=>k.kind==='taille').length);
   for(const k of c.cols)if(k.road)assert.ok(c.roads.some(r=>r.id===k.road));
   for(const b of c.bridges){bridges++;const i=Math.floor((b.y-c.bounds.y)/R.cell)*N+Math.floor((b.x-c.bounds.x)/R.cell);assert.ok(owner.has(i)&&(c.water[i]===G.WATER.river||c.water[i]===G.WATER.stream));}
   if(c.hub)assert.ok(owner.has(Math.floor((c.hub.y-c.bounds.y)/R.cell)*N+Math.floor((c.hub.x-c.bounds.x)/R.cell)),'le carrefour est sur une route');
  }
  // Les routes passent par les cols : les rampes taillées restent la minorité, celles de deux crans l'exception.
  assert.ok(roads>250&&ramps>150&&bridges>10&&cuts*2<ramps&&steep*10<ramps,'routes, rampes, ponts, rampes taillées, dont de deux crans : '+[roads,ramps,bridges,cuts,steep]);
});

test('canton 217 : réseau routier connexe sans arbre couvrant global (mesure sur les huit graines)',()=>{
  const lines=[];
  for(const seed of SEEDS){
   const n=network(seed,seed===17117?15:10),share=n.largest/n.served;
   lines.push(seed+' : '+n.served+'/'+n.cantons+' cantons desservis, plus grande composante '+(share*100).toFixed(1)+' %, '+n.components+' composantes ; par masse de terre '+(n.land*100).toFixed(2)+' % ('+n.masses+' masses desservies), '+n.dead+' impasses sur '+n.roads+' tronçons');
   // Seule la mer isole encore : sur une même terre, le réseau est d'un seul tenant, à de rares cantons près.
   assert.ok(share>=.97,'réseau morcelé : '+lines[lines.length-1]);assert.ok(n.land>=.99,'réseau coupé sur une même terre : '+lines[lines.length-1]);
   assert.ok(n.served/n.cantons>=.95,lines[lines.length-1]);assert.ok(n.dead/n.roads<=.03,lines[lines.length-1]);
  }
  console.log('# connexité des cantons 217\n# '+lines.join('\n# '));
});

test('canton 217 : falaises fréquentes, rampes rares — rapports sur les huit graines, cols groupés et étroits',()=>{
  const lines=[];
  for(const seed of SEEDS){
   const p=probe(seed,5),c=p.perCanton;
   lines.push(seed+' : '+c.cliffs+' arêtes de falaise et '+c.slopes+' de rampe par canton (rapport '+p.cliffPerRamp+'), '+c.cols+' cols dont '+c.cuts+' taillés, largeur moyenne d’un col naturel '+p.colWidth+' arêtes');
   assert.ok(p.cliffPerRamp>=3.5,'trop de rampes : '+lines[lines.length-1]);assert.ok(c.cols>=2&&c.cols<=9,lines[lines.length-1]);
   assert.ok(p.colWidth>=2.5&&p.colWidth<=5.5,'cols larges de quelques mailles : '+lines[lines.length-1]);assert.ok(c.cuts*3<c.cols,'les cols naturels dominent : '+lines[lines.length-1]);
  }
  console.log('# falaises et rampes des cantons 217 (T2 : environ 17 arêtes de falaise pour 80 de rampe)\n# '+lines.join('\n# '));
  // Un col naturel : quelques arêtes d'un cran, voisines, entre les deux mêmes paliers de terre, jamais sur une couture.
  for(const[x,y]of block(3,-2,3)){
   const c=G.generate(17117,x,y),member=new Map();
   for(const k of c.cols){assert.deepEqual(K.parseEntity(k.id),{cx:x,cy:y,canton:c.id,kind:'col',index:c.cols.indexOf(k)});assert.ok(k.low>=1&&k.high>k.low&&k.high-k.low<=2);
    if(k.kind==='naturel'){assert.equal(k.high-k.low,1);assert.equal(k.seam,null);assert.ok(k.width>=1&&k.width<=10,'col trop large : '+k.width);assert.ok(k.x>c.bounds.x&&k.x<c.bounds.x+1024&&k.y>c.bounds.y&&k.y<c.bounds.y+1024);member.set(k,0);}
    else assert.equal(k.width,1);}
   for(let i=0;i<N*N;i++)for(const[d,bit,ex,ey]of [[c.east[i],1,1,.5],[c.south[i],2,.5,1]]){
    if(!(c.passes[i]&bit))continue;const px=c.bounds.x+(i%N+ex)*R.cell,py=c.bounds.y+(Math.floor(i/N)+ey)*R.cell,low=Math.min(c.levels[i],c.levels[i]+d);
    const cut=c.cols.some(k=>k.kind==='taille'&&Math.abs(k.x-px)<.01&&Math.abs(k.y-py)<.01);if(cut)continue;
    const owner=c.cols.filter(k=>k.kind==='naturel'&&k.low===low&&Math.hypot(k.x-px,k.y-py)<=R.pass.reach*R.cell+.01);assert.ok(owner.length>=1,'arête de rampe sans col : '+c.id);
    assert.equal(Math.abs(d),1);assert.ok(bit===1?i%N<N-1:Math.floor(i/N)<N-1,'un col naturel ne touche pas une couture');
   }
  }
});

// Régions de même palier (terre), dans un canton ou sur une fenêtre de cantons.
function regions(levels,W,H){const id=new Int32Array(W*H).fill(-1),sizes=[];for(let s=0;s<W*H;s++){if(id[s]>=0||!levels[s])continue;const q=[s];id[s]=sizes.length;for(let k=0;k<q.length;k++){const i=q[k],x=i%W;for(const j of [x<W-1?i+1:-1,x>0?i-1:-1,i+W<W*H?i+W:-1,i-W])if(j>=0&&id[j]<0&&levels[j]===levels[i]){id[j]=id[s];q.push(j);}}sizes.push(q.length);}return{id,sizes};}

test('canton 217 : aucun plateau fermé — toute région garde un col, sauf très petit îlot ou mesa ceinte de hautes falaises',()=>{
  const lines=[];
  for(const seed of SEEDS){
   // Garantie stricte, canton par canton : une région d'au moins `islet` mailles bordée d'une arête d'un cran (hors couture) a un col.
   const radius=3,side=2*radius+1,W=side*N,lev=new Uint8Array(W*W),pass=new Uint8Array(W*W);let parts=0;
   for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
    const c=G.generate(seed,x,y),r=regions(c.levels,N,N),open=new Uint8Array(r.sizes.length),climbable=new Uint8Array(r.sizes.length);
    for(let i=0;i<N*N;i++){lev[((y+radius)*N+Math.floor(i/N))*W+(x+radius)*N+i%N]=c.levels[i];pass[((y+radius)*N+Math.floor(i/N))*W+(x+radius)*N+i%N]=c.passes[i];
     for(const[j,bit,inner]of [[i+1,1,i%N<N-1],[i+N,2,i+N<N*N]]){if(!inner||!c.levels[i]||!c.levels[j]||c.levels[i]===c.levels[j])continue;
      if(c.passes[i]&bit){open[r.id[i]]=1;open[r.id[j]]=1;}if(Math.abs(c.levels[i]-c.levels[j])===1){climbable[r.id[i]]=1;climbable[r.id[j]]=1;}}}
    for(let k=0;k<r.sizes.length;k++)if(r.sizes[k]>=R.pass.islet&&climbable[k]){parts++;assert.ok(open[k],'région sans col dans '+c.id+' ('+r.sizes[k]+' mailles)');}
   }
   // Mesure sur la fenêtre : régions entières (hors bord de fenêtre) sans aucun col.
   const g=regions(lev,W,W),touch=new Uint8Array(g.sizes.length),open=new Uint8Array(g.sizes.length),climbable=new Uint8Array(g.sizes.length);
   for(let i=0;i<W*W;i++){const x=i%W,y=(i-x)/W,a=g.id[i];if(a<0)continue;if(x===0||y===0||x===W-1||y===W-1){touch[a]=1;continue;}
    for(const[j,bit]of [[i+1,1],[i+W,2]]){const b=g.id[j];if(b<0||b===a)continue;if(pass[i]&bit){open[a]=1;open[b]=1;}if(Math.abs(lev[i]-lev[j])===1){climbable[a]=1;climbable[b]=1;}}}
   let whole=0,closed=0,biggest=0,mesas=0,islets=0;
   for(let k=0;k<g.sizes.length;k++){if(touch[k])continue;whole++;if(open[k])continue;if(!climbable[k]){mesas++;continue;}if(g.sizes[k]<2*R.pass.islet){islets++;continue;}closed++;biggest=Math.max(biggest,g.sizes[k]);}
   lines.push(seed+' : '+whole+' régions entières sur 49 km², '+parts+' parts de région vérifiées, '+closed+' plateau fermé de '+2*R.pass.islet+' mailles ou plus'+(closed?' (jusqu’à '+biggest+' mailles)':'')+', '+islets+' îlots de moins de '+2*R.pass.islet+' mailles sans col, '+mesas+' mesas ou îles sans arête d’un cran');
   assert.equal(closed,0,lines[lines.length-1]);
  }
  console.log('# accès des plateaux des cantons 217\n# '+lines.join('\n# '));
});

test('canton 217 : eau plus présente — au moins un cours d’eau dans un canton sur deux hors hauts plateaux, lacs de vallée',()=>{
  const lines=[];
  for(const seed of SEEDS){
   const p=probe(seed,5),w=p.water;
   lines.push(seed+' : cours d’eau dans '+w.cantons+'/'+p.cantons+' cantons, '+w.lowlandWatered+'/'+w.lowland+' hors hauts plateaux et hors mer ('+w.lowlandShare+' %), '+p.perCanton.lakes+' lac par canton, '+p.perCanton.bridges+' pont par canton');
   assert.ok(w.lowlandShare>=50,'eau trop rare : '+lines[lines.length-1]);assert.ok(p.perCanton.lakes>=.08,lines[lines.length-1]);
  }
  console.log('# eau des cantons 217 (T2 : 0,4 cours d’eau par canton)\n# '+lines.join('\n# '));
  // Une vallée creuse le champ sans ouvrir la mer : le fond d'une vallée reste au-dessus du palier 1.
  let carved=0;for(let y=-3000;y<3000;y+=64)for(let x=-3000;x<3000;x+=64){const h=G.altitude(17117,x+.5,y+.5);assert.ok(h>=0&&h<R.levels);if(Math.abs(h-R.valley.floor)<1e-9)carved++;}
  assert.ok(carved>0,'des fonds de vallée au plancher');
});

test('canton 217 : agglomérations — portées par les sommets, identiques vues de leurs quatre cantons, reliées et entourées de lieux',()=>{
  const kinds={hameau:0,bourg:0,ville:0},names=new Set();let towns=0,vertices=0,links=0,regional=0,hubs=0,inTown=0,owners=0,ownerSites=0,plain=0,plainSites=0;
  for(const seed of [17117,42,967313470]){
   // Lue seule, avant tout canton : la sous-graine du sommet et le champ suffisent.
   G.forget();const alone=new Map();for(let vy=-4;vy<=5;vy++)for(let vx=-4;vx<=5;vx++)alone.set(vx+','+vy,G.town(seed,vx,vy));
   assert.equal(G.town(seed,0,0),null,'le sommet de D-17 reste libre');
   for(let vy=-4;vy<=5;vy++)for(let vx=-4;vx<=5;vx++){
    vertices++;const t=alone.get(vx+','+vy),around=[[vx,vy],[vx-1,vy],[vx-1,vy-1],[vx,vy-1]].map(([x,y])=>G.generate(seed,x,y));
    for(const c of around){const seen=c.towns.filter(o=>o.vx===vx&&o.vy===vy);assert.equal(seen.length,t?1:0,c.id);if(t){assert.deepEqual(seen[0],t,'même agglomération vue de '+c.id);assert.ok(Object.isFrozen(seen[0]));}}
    for(const c of around)assert.ok(c.towns.length<=4&&c.towns.every(o=>o.vx>=c.cx&&o.vx<=c.cx+1&&o.vy>=c.cy&&o.vy<=c.cy+1),'un canton ne voit que ses quatre sommets');
    if(!t)continue;towns++;kinds[t.kind]++;names.add(t.name);
    const home=around[0],b=home.bounds,i=Math.floor((t.y-b.y)/R.cell)*N+Math.floor((t.x-b.x)/R.cell);
    assert.equal(t.id,'Ka'+vx+'_'+vy);assert.ok(G.TOWNS.includes(t.kind));assert.equal(t.radius,R.towns.kinds[t.kind].radius);
    assert.ok(t.x-b.x>=R.towns.margin&&t.x-b.x<=R.towns.reach+R.cell&&t.y-b.y>=R.towns.margin&&t.y-b.y<=R.towns.reach+R.cell,'posée près de son sommet, dans son canton');
    assert.equal(home.levels[i],t.level);assert.ok(t.level>0,'jamais en mer');
    const m=/^(.+) (\d+)$/.exec(t.name);assert.ok(m&&R.towns.names.includes(m[1])&&Number(m[2])>=1&&Number(m[2])<=97,t.name);
    // Le carrefour du canton est l'agglomération (à une maille près si l'eau occupe son centre).
    if(home.hub){hubs++;assert.ok(Math.hypot(home.hub.x-t.x,home.hub.y-t.y)<=6*R.cell,'carrefour loin de l’agglomération : '+home.id);}
    // Deux agglomérations voisines : une route les relie, principale entre bourgs et villes.
    for(const[side,ox,oy]of [['east',1,0],['south',0,1]]){const o=alone.get((vx+ox)+','+(vy+oy));if(!o||vx+ox>5||vy+oy>5)continue;const k=home.crossings[side];if(k.blocked)continue;
     links++;assert.ok(k.road,'pas de route entre '+t.name+' et '+o.name);const both=t.kind!=='hameau'&&o.kind!=='hameau';if(both){regional++;assert.equal(k.road.class,'regional');}else assert.ok(k.road.class!=='local');}
    owners++;ownerSites+=home.sites.length;
    for(const c of around)for(const s of c.sites)if(s.town===t.id){inTown++;assert.ok(Math.hypot(s.x-t.x,s.y-t.y)<=t.radius);}
   }
   for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){const c=G.generate(seed,x,y);if(!c.towns.length){plain++;plainSites+=c.sites.length;}
    for(const s of c.sites)assert.equal(s.town,(c.towns.filter(t=>Math.hypot(s.x-t.x,s.y-t.y)<=t.radius).sort((a,b)=>Math.hypot(s.x-a.x,s.y-a.y)-Math.hypot(s.x-b.x,s.y-b.y))[0]||{id:null}).id);}
  }
  console.log('# agglomérations des cantons 217 : '+towns+' sur '+vertices+' sommets '+JSON.stringify(kinds)+', '+links+' liaisons dont '+regional+' principales, '+inTown+' lieux dans leur rayon ; '+(ownerSites/owners).toFixed(1)+' lieux par canton d’agglomération contre '+(plainSites/plain).toFixed(1)+' ailleurs');
  assert.ok(towns>60&&towns<vertices*.7&&kinds.hameau>kinds.bourg&&kinds.bourg>kinds.ville&&kinds.ville>0,'hiérarchie hameau > bourg > ville : '+JSON.stringify(kinds));
  assert.ok(names.size>towns*.8&&links>10&&regional>0&&hubs>towns*.9);
  assert.ok(ownerSites/owners>1.5*plainSites/plain&&inTown>towns*2,'les lieux se serrent autour des agglomérations');
  assert.throws(()=>G.town(17117,.5,0));assert.throws(()=>G.town(17117,0,K.RULES.maxCoordinate+1));assert.throws(()=>G.town(-1,0,0));
});

test('canton 217 : site de fondation de D-17 — dans K0_0, plat, sec, relié, décrit, valide sur 50 graines',()=>{
  const seeds=[...SEEDS];for(let k=1;seeds.length<50;k++)seeds.push(K.subSeed(217,k,0,'graines-d17'));
  const span=R.foundation.size/R.cell,levels={};let interest=0,cliffNear=0,waterNear=0,guarded=0,closed=0,enclosure=0;
  for(const seed of seeds){
   G.forget();const c=G.generate(seed,0,0),f=c.foundation;assert.ok(f,'aucun site de fondation pour la graine '+seed);
   assert.deepEqual(G.foundation(seed),f);assert.ok(Object.isFrozen(f)&&Object.isFrozen(f.cols)&&Object.isFrozen(f.plateau));
   assert.deepEqual(K.parseEntity(f.id),{cx:0,cy:0,canton:'K0_0',kind:'d17',index:0});assert.equal(f.size,R.foundation.size);
   // Un plat (64 m depuis la tranche de la carte locale : site adossé), tout entier dans K0_0, à l'écart des coutures, d'un seul palier, hors mer et hors eau.
   const x0=(f.x-f.size/2)/R.cell,y0=(f.y-f.size/2)/R.cell;assert.ok(Number.isInteger(x0)&&Number.isInteger(y0)&&x0>=R.foundation.margin&&y0>=R.foundation.margin&&x0+span<=N-R.foundation.margin&&y0+span<=N-R.foundation.margin,'site hors du canton : '+seed);
   for(let dy=0;dy<span;dy++)for(let dx=0;dx<span;dx++){const i=(y0+dy)*N+x0+dx;assert.equal(c.levels[i],f.level,'site en pente : '+seed);assert.equal(c.water[i],G.WATER.none,'site dans l’eau : '+seed);}
   assert.ok(f.level>=1&&f.level<R.levels);assert.equal(G.levelAt(seed,f.x,f.y),f.level);assert.equal(G.biomeAt(seed,f.x+1,f.y+1),f.biome);levels[f.level]=(levels[f.level]||0)+1;
   // Relié : le site est le carrefour du canton, et une route en part jusqu'à une couture.
   assert.ok(c.hub&&Math.abs(c.hub.x-(f.x+R.cell/2))<.01&&Math.abs(c.hub.y-(f.y+R.cell/2))<.01,'le site n’est pas le carrefour : '+seed);
   const road=c.roads.find(r=>r.id===f.road);assert.ok(road&&K.parseEdge(road.from)&&!road.deadEnd,'site sans route : '+seed);assert.equal(f.roadClass,road.class);
   assert.ok(road.cells.includes((y0+(span>>1))*N+x0+(span>>1)),'la route passe par le site');
   // Fiche : falaise et eau les plus proches, palier du site et ce qui le borde, cols à garder.
   const p=f.plateau,edges=p.cliffs+p.passes+p.open+p.shore;assert.ok(p.cells>=span*span&&edges>0&&p.enclosure>=0&&p.enclosure<=1);assert.equal(p.closed,p.open===0);assert.ok(Math.abs(p.enclosure-(p.cliffs+p.shore)/edges)<.006);
   if(f.cliff){assert.ok(f.cliff.distance>=f.size/2&&f.cliff.drop>=1&&typeof f.cliff.wind==='string');if(f.cliff.distance<=400)cliffNear++;}
   if(f.water){assert.ok(f.water.distance>=f.size/2-R.cell&&['sea','lake','river','stream'].includes(f.water.kind));if(f.water.distance<=400)waterNear++;}
   if(f.interest){interest++;assert.ok(Math.min(f.cliff?f.cliff.distance:Infinity,f.water?f.water.distance:Infinity)<=(R.foundation.reach+span)*R.cell*1.5,'falaise ou eau à portée : '+seed);}
   assert.ok(f.cols.length<=R.foundation.guard);if(f.cols.length)guarded++;if(p.closed)closed++;enclosure+=p.enclosure;
   f.cols.forEach((k,n)=>{const col=c.cols.find(o=>o.id===k.id);assert.ok(col&&col.x===k.x&&col.y===k.y&&col.kind===k.kind);assert.ok(k.low===f.level||k.high===f.level,'un col à garder touche le palier du site');
    assert.ok(Math.abs(k.distance-Math.hypot(k.x-f.x,k.y-f.y))<.01);if(n)assert.ok(k.distance>=f.cols[n-1].distance);});
   // Les autres cantons n'ont pas de site ; aucune agglomération ne prend la place de D-17.
   assert.equal(G.generate(seed,1,0).foundation,null);assert.equal(G.generate(seed,-1,-1).foundation,null);assert.ok(c.towns.every(t=>t.vx!==0||t.vy!==0));
  }
  console.log('# sites de D-17 sur 50 graines : '+interest+' près d’une falaise ou de l’eau, falaise à 400 m ou moins pour '+cliffNear+', eau pour '+waterNear+', au moins un col à garder pour '+guarded+', plateau fermé dans le canton pour '+closed+', part de falaise moyenne '+(enclosure/seeds.length*100).toFixed(0)+' %, paliers '+JSON.stringify(levels));
  assert.ok(interest>=45&&cliffNear>=40&&waterNear>=30&&guarded>=40,'la graine doit changer la façon de bâtir');
  assert.ok(Object.keys(levels).length>=4,'des sites à tous les étages');
});

test('canton 217 : lieux candidats — identifiants de canton, à sec, hors couture, espacés',()=>{
  const all=new Set();let count=0,empty=0,cantons=0;
  for(const seed of [17117,967313470])for(const[x,y]of block(4,4,5)){
   const c=G.generate(seed,x,y),b=c.bounds,S=R.sites;cantons++;if(!c.sites.length)empty++;assert.ok(c.sites.length<=S.maximum+c.towns.reduce((a,t)=>a+R.towns.kinds[t.kind].sites,0));
   c.sites.forEach((s,index)=>{
    count++;assert.equal(s.id,K.entityId(x,y,'site',index));assert.ok(!all.has(seed+s.id));all.add(seed+s.id);
    assert.ok(s.x-b.x>=S.seamMargin&&b.x+1024-s.x>=S.seamMargin&&s.y-b.y>=S.seamMargin&&b.y+1024-s.y>=S.seamMargin,'aucun lieu à cheval sur une couture');
    const i=Math.floor((s.y-b.y)/R.cell)*N+Math.floor((s.x-b.x)/R.cell);
    assert.equal(c.levels[i],s.level);assert.ok(s.level>0&&c.water[i]===G.WATER.none);assert.equal(G.BIOMES[c.biomes[i]],s.biome);
    assert.ok(c.roads.some(r=>r.id===s.road&&!r.cells.includes(i)),'desservi par une route, sans être dessus');
    for(const o of c.sites)if(o!==s)assert.ok(Math.hypot(o.x-s.x,o.y-s.y)>=S.spacing);
    assert.ok(!/^P\d{4}$/.test(s.id)&&!/^S\d+_\d+$/.test(s.id));
   });
  }
  assert.ok(count>400&&empty<cantons/3,'lieux présents : '+count+', cantons vides '+empty+'/'+cantons);
});

test('canton 217 : module isolé — rien de chargé par le jeu, génération 12 toujours refusée, mondes G1–G11 intouchés',()=>{
  const source=read('src/world-canton-gen217.js'),code=source.replace(/\/\/.*$/gm,'');
  assert.ok(!/Math\.random|Math\.hypot|Math\.pow|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(code),'module pur et portable');
  assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js','./world-cantons217.js'],'dépendances : les règles et la brique d’adressage');
  assert.ok(!/G\.hash|G\.rng|Frontier|Geography135|Hydrology165\b(?!Rules)|geography141|taken|localStorage/.test(code),'aucun flux ni registre des générations 1 à 11');
  for(const file of ['index.html','sw.js','scripts/server.mjs','scripts/build.mjs','scripts/public-manifest183.cjs'])assert.ok(!read(file).includes('canton-gen217')&&!read(file).includes('apercu-cantons217'),file);
  for(const file of fs.readdirSync(path.join(ROOT,'src')))if(!['world-canton-gen217.js','world-local217.js','world-open217.js','world-sites217.js','core.js'].includes(file)){const text=read('src/'+file);assert.ok(!text.includes('WorldRelief217')&&!text.includes('CantonGen217')&&!text.includes('canton-gen217'),file+' ne doit pas dépendre du générateur de cantons');}
  assert.ok(read('tools/apercu-cantons217.html').includes('hors jeu'));
  const W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js');
  assert.throws(()=>W.create(17117,K.RULES.reservedGeneration),/Version du monde inconnue/);
  assert.throws(()=>S.normalize({...S.initial(),generation:K.RULES.reservedGeneration}),/Génération inconnue/);
  assert.equal(G.generate(17117,0,0).generation,12);
  // Générer des cantons ne change rien à un monde existant : même empreinte avant et après.
  const print=world=>crypto.createHash('sha256').update(JSON.stringify([world.size,world.home,world.roads,world.pois.map(p=>[p.id,p.x,p.y,p.name]),world.towns])).digest('hex');
  const before=print(W.create(17117,4)),frozen=JSON.stringify(R);
  for(const[x,y]of block(0,0,3))G.generate(17117,x,y);
  assert.equal(print(W.create(17117,4)),before);assert.equal(JSON.stringify(R),frozen);
});

test('canton 217 : sonde de coût — un canton tient dans le budget de 8 ms du plan',()=>{
  // La médiane est le budget du plan ; la moyenne est rapportée, elle subit la charge de la machine.
  // Mesure en temps réel : sur une machine chargée on garde la meilleure de trois passes.
  const best=seed=>{let p=probe(seed,7);for(let k=0;k<2&&p.ms.median>=8;k++){const again=probe(seed,7);if(again.ms.median<p.ms.median)p=again;}return p;};
  const cold=best(17117),warm=best(84329);
  console.log('# coût par canton (ms) — graine 17117 : '+JSON.stringify(cold.ms)+' ; graine 84329 : '+JSON.stringify(warm.ms));
  assert.ok(warm.ms.median<8,'médiane hors budget : '+JSON.stringify(warm.ms));assert.ok(cold.ms.median<8,JSON.stringify(cold.ms));
  assert.ok(cold.foundation&&cold.foundation.id==='K0_0:d17:0'&&cold.cliffPerRamp>3&&cold.water.lowlandShare>=50&&cold.towns.hameau>0,'la sonde rapporte falaises, eau, agglomérations et site de D-17');
  assert.equal(cold.cantons,225);assert.ok(cold.levelShare.every(v=>v>3),'aucun palier marginal : '+cold.levelShare);
});
