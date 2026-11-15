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
  assert.equal(R.version,1);assert.equal(K.SIZE%R.cell,0);assert.equal(N,32);assert.equal(R.levels,6);
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
const REFERENCE=['25958dd9','3205359d','826c607b','df36764a'];

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

test('canton 217 : relief par paliers — champ continu aux coutures, falaises au-delà d’un cran',()=>{
  const seen=new Set();let cliffs=0,slopes=0,sea=0;
  for(const seed of [17117,42])for(const[x,y]of block(-1,1,4)){
   const c=G.generate(seed,x,y),east=x<K.RULES.maxCoordinate?G.generate(seed,x+1,y):null,south=G.generate(seed,x,y+1);let localCliffs=0,localSlopes=0;
   for(let i=0;i<N*N;i++){
    const cx=i%N,cy=(i-cx)/N,l=c.levels[i];seen.add(l);assert.ok(l>=0&&l<R.levels);
    assert.equal(l,Math.floor(c.altitudes[i]));assert.equal(c.water[i]===G.WATER.sea,l===0,'palier 0 = mer');if(l===0)sea++;
    // L'écart vers l'est et le sud se lit dans le canton voisin : aucune couture dans le relief.
    const right=cx<N-1?c.levels[i+1]:east.levels[cy*N],below=cy<N-1?c.levels[i+N]:south.levels[cx];
    assert.equal(c.east[i],right-l);assert.equal(c.south[i],below-l);
    for(const d of [c.east[i],c.south[i]])if(Math.abs(d)>1)localCliffs++;else if(d)localSlopes++;
   }
   assert.deepEqual([c.counts.cliffs,c.counts.slopes],[localCliffs,localSlopes]);cliffs+=localCliffs;slopes+=localSlopes;
   const b=c.bounds;assert.equal(G.levelAt(seed,b.x+5,b.y+1000),c.levels[31*N]);assert.equal(G.biomeAt(seed,b.x+700,b.y+40),G.BIOMES[c.biomes[N+21]]);
  }
  assert.deepEqual([...seen].sort(),[0,1,2,3,4,5],'tous les paliers apparaissent');
  assert.ok(cliffs>1000&&slopes>cliffs,'falaises présentes, rampes plus fréquentes : '+cliffs+' / '+slopes);assert.ok(sea>0);
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
  let seams=0,roadSeams=0,waterSeams=0,blocked=0;
  for(const seed of [17117,84329,4294967295])for(const[x,y]of block(-2,3,4)){
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
     assert.ok(Math.abs(mine.road.levels[0]-mine.road.levels[1])<=1&&mine.road.levels[0]>0&&mine.road.levels[1]>0,'jamais de route par une falaise ou par la mer');
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
  assert.ok(seams===486&&roadSeams>150&&waterSeams>30,'damier significatif : '+[seams,roadSeams,waterSeams,blocked]);
});

test('canton 217 : l’eau descend les paliers, les lacs tiennent dans leur canton',()=>{
  let rivers=0,lakes=0,drops=0;
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
    lakes++;assert.equal(c.drain.sink==='lake'||c.drain.sink==='sea',true);const b=c.bounds;
    assert.ok(lake.x-lake.r>=b.x&&lake.x+lake.r<=b.x+1024&&lake.y-lake.r>=b.y&&lake.y+lake.r<=b.y+1024,'aucun lac coupé par une couture');
    let cells=0;for(let i=0;i<N*N;i++)if(c.water[i]===G.WATER.lake){cells++;assert.equal(c.levels[i],lake.level,'un lac est à plat');}
    assert.equal(cells,lake.cells);assert.ok(cells>=1);
   }
   if(c.drain.sink==='lake')assert.equal(c.lakes.length,1,'une cuvette porte un lac : '+c.id);
  }
  assert.ok(rivers>60&&lakes>5&&drops>20,'eau présente : '+[rivers,lakes,drops]);
});

// Composantes du réseau : routes d'un canton liées par leurs mailles communes, cantons liés par leurs coutures.
function network(seed,radius){
  const parent=new Map(),find=k=>{let r=k;while(parent.get(r)!==r)r=parent.get(r);parent.set(k,r);return r;},join=(a,b)=>{for(const k of [a,b])if(!parent.has(k))parent.set(k,k);parent.set(find(a),find(b));};
  let cantons=0,served=0,dead=0,roads=0;const withRoads=[];
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
   const c=G.generate(seed,x,y);cantons++;if(!c.roads.length)continue;served++;withRoads.push(c.id);
   const cell=new Map();
   for(const r of c.roads){roads++;if(r.deadEnd)dead++;const key=c.id+'#'+r.id;join(key,key);join(c.id,c.id);for(const i of r.cells){if(cell.has(i))join(key,cell.get(i));else cell.set(i,key);}if(r.from)join(key,'couture '+r.from);}
   // Le canton compte comme desservi par sa plus grande composante : on le rattache à son premier tronçon.
   join(c.id,c.id+'#'+c.roads[0].id);
  }
  const sizes=new Map();for(const id of withRoads){const r=find(id);sizes.set(r,(sizes.get(r)||0)+1);}
  return{cantons,served,roads,dead,largest:Math.max(...sizes.values()),components:sizes.size};
}

test('canton 217 : routes — jamais par une falaise ni par l’eau profonde, rampes pour changer de palier',()=>{
  let ramps=0,bridges=0,roads=0;
  for(const seed of [17117,42,1947648717])for(const[x,y]of block(-3,-3,5)){
   const c=G.generate(seed,x,y),seenRamps=new Set(),owner=new Map();
   for(const r of c.roads){
    roads++;assert.deepEqual(K.parseEntity(r.id),{cx:x,cy:y,canton:c.id,kind:'route',index:c.roads.indexOf(r)});
    assert.ok(G.CLASSES.includes(r.class));assert.equal(r.width,R.roads.widths[r.class]);assert.ok(K.parseEdge(r.from),'chaque tronçon part d’une couture');
    assert.equal(c.crossings[K.SIDES.find(s=>c.crossings[s].edge===r.from)].road.class,r.class);
    for(let k=0;k<r.cells.length;k++){
     const i=r.cells[k];assert.ok(c.levels[i]>0&&c.water[i]!==G.WATER.sea&&c.water[i]!==G.WATER.lake,'route à sec : '+r.id);
     if(!k)continue;const p=r.cells[k-1],dx=Math.abs(i%N-p%N),dy=Math.abs(Math.floor(i/N)-Math.floor(p/N)),d=Math.abs(c.levels[i]-c.levels[p]);
     assert.ok(dx<=1&&dy<=1&&dx+dy>0);assert.ok(d<=1,'aucune route ne franchit une falaise : '+r.id);
     if(d){assert.equal(dx+dy,1,'une rampe se prend de face');seenRamps.add(Math.min(i,p)+':'+Math.max(i,p));}
     if(dx+dy===2)assert.ok(!c.water[i]&&!c.water[p],'un pont se prend de face');
    }
    for(const i of r.cells)if(!owner.has(i))owner.set(i,r.id);
   }
   assert.equal(c.ramps.length,seenRamps.size,'chaque changement de palier d’une route est une rampe déclarée');
   for(const r of c.ramps){assert.equal(r.high-r.low,1);ramps++;}
   for(const b of c.bridges){bridges++;const i=Math.floor((b.y-c.bounds.y)/R.cell)*N+Math.floor((b.x-c.bounds.x)/R.cell);assert.ok(owner.has(i)&&(c.water[i]===G.WATER.river||c.water[i]===G.WATER.stream));}
   if(c.hub)assert.ok(owner.has(Math.floor((c.hub.y-c.bounds.y)/R.cell)*N+Math.floor((c.hub.x-c.bounds.x)/R.cell)),'le carrefour est sur une route');
  }
  assert.ok(roads>250&&ramps>150&&bridges>10,'routes, rampes et ponts présents : '+[roads,ramps,bridges]);
});

test('canton 217 : réseau routier connexe sans arbre couvrant global (mesure sur les huit graines)',()=>{
  const lines=[];
  for(const seed of SEEDS){
   const n=network(seed,seed===17117?15:10),share=n.largest/n.served;
   lines.push(seed+' : '+n.served+'/'+n.cantons+' cantons desservis, plus grande composante '+(share*100).toFixed(1)+' %, '+n.components+' composantes, '+n.dead+' impasses sur '+n.roads+' tronçons');
   // La mer et les plateaux fermés isolent quelques cantons : on exige un réseau principal, pas la perfection.
   assert.ok(share>=.9,'réseau morcelé : '+lines[lines.length-1]);assert.ok(n.served/n.cantons>=.8,lines[lines.length-1]);assert.ok(n.dead/n.roads<=.05,lines[lines.length-1]);
  }
  console.log('# connexité des cantons 217\n# '+lines.join('\n# '));
});

test('canton 217 : lieux candidats — identifiants de canton, à sec, hors couture, espacés',()=>{
  const all=new Set();let count=0,empty=0,cantons=0;
  for(const seed of [17117,967313470])for(const[x,y]of block(4,4,5)){
   const c=G.generate(seed,x,y),b=c.bounds,S=R.sites;cantons++;if(!c.sites.length)empty++;assert.ok(c.sites.length<=S.maximum);
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
  assert.ok(count>400&&empty<cantons/2,'lieux présents : '+count+', cantons vides '+empty+'/'+cantons);
});

test('canton 217 : module isolé — rien de chargé par le jeu, génération 12 toujours refusée, mondes G1–G11 intouchés',()=>{
  const source=read('src/world-canton-gen217.js'),code=source.replace(/\/\/.*$/gm,'');
  assert.ok(!/Math\.random|Math\.hypot|Math\.pow|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(code),'module pur et portable');
  assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js','./world-cantons217.js'],'dépendances : les règles et la brique d’adressage');
  assert.ok(!/G\.hash|G\.rng|Frontier|Geography135|Hydrology165\b(?!Rules)|geography141|taken|localStorage/.test(code),'aucun flux ni registre des générations 1 à 11');
  for(const file of ['index.html','sw.js','scripts/server.mjs','scripts/build.mjs','scripts/public-manifest183.cjs'])assert.ok(!read(file).includes('canton-gen217')&&!read(file).includes('apercu-cantons217'),file);
  for(const file of fs.readdirSync(path.join(ROOT,'src')))if(!['world-canton-gen217.js','core.js'].includes(file)){const text=read('src/'+file);assert.ok(!text.includes('WorldRelief217')&&!text.includes('CantonGen217')&&!text.includes('canton-gen217'),file+' ne doit pas dépendre du générateur de cantons');}
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
  const cold=probe(17117,7),warm=probe(84329,7);
  console.log('# coût par canton (ms) — graine 17117 : '+JSON.stringify(cold.ms)+' ; graine 84329 : '+JSON.stringify(warm.ms));
  // La médiane est le budget du plan ; la moyenne est rapportée, elle subit la charge de la machine.
  assert.ok(warm.ms.median<8,'médiane hors budget : '+JSON.stringify(warm.ms));assert.ok(cold.ms.median<8,JSON.stringify(cold.ms));
  assert.equal(cold.cantons,225);assert.ok(cold.levelShare.every(v=>v>3),'aucun palier marginal : '+cold.levelShare);
});
