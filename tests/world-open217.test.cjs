'use strict';
// Monde régional G12 hors jeu (specs/monde-sans-bord/ouverture.md, tranche O1).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js'),K=require('../src/world-cantons217.js'),G=require('../src/world-canton-gen217.js'),O=require('../src/world-open217.js');
const ROOT=path.resolve(__dirname,'..'),R=C.WorldOpen217Rules,read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const SEEDS=[0,1,42,17117,84329,967313470,1947648717,4294967295];
const far=(dx,dy)=>Math.sqrt(dx*dx+dy*dy);

test('monde ouvert 217 : règles gelées, accesseurs communs du monde fini présents',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.route)&&Object.isFrozen(O)&&O.RULES===R);
  assert.deepEqual(JSON.parse(JSON.stringify(R)),{route:{margin:1,maxCantons:25},snapRadius:1,nearMaxRadius:2048,pickRadius:1});
  assert.ok(R.route.margin>=R.snapRadius,'la route la plus proche tombe toujours dans la zone de recherche');
  assert.equal((read('src/core.js').match(/WorldOpen217Rules=/g)||[]).length,1);
  const w=O.create(17117),finite=require('../src/frontier-world.js').limits(24576);
  for(const name of Object.keys(finite))assert.equal(typeof w[name],'function',name);
  for(const name of ['site','sitesNear','nearestRoad'])assert.equal(typeof w[name],'function',name);
  assert.equal(w.generation,K.RULES.reservedGeneration);assert.equal(w.unbounded,true);assert.ok(Object.isFrozen(w));
  // Aucune liste globale : un lecteur de `roads`, `pois` ou `size` doit échouer, pas lire une vue partielle.
  for(const name of ['roads','pois','size','bounds','sectors','towns'])assert.equal(w[name],undefined,name);
});

test('monde ouvert 217 : limites — contains toujours vrai pour un point mesurable, étendue infinie',()=>{
  const w=O.create(42),edge=K.RULES.maxCoordinate*K.SIZE;
  const points=[[0,0],[-1,-1],[-24576,99999.5],[1e6,-1e6],[-edge+1,-edge+1],[edge+1022,edge+1022],[24576,24576],[-0.0001,8192]];
  for(const[x,y]of points){assert.equal(w.contains(x,y),true,x+','+y);assert.equal(w.outside(x,y),false);assert.equal(w.outsideOpen(x,y),false);assert.deepEqual(w.clampInside(x,y),{x,y});}
  // Mêmes conventions que le monde fini pour un point non mesurable : contains refuse NaN, outside l'admet.
  // Bord de l'adressage : admis par contains et outside, refusé par outsideOpen, comme le bord du monde fini.
  assert.equal(w.contains(-edge,edge+1023),true);assert.equal(w.outside(-edge,edge+1023),false);assert.equal(w.outsideOpen(-edge,0),true);assert.equal(w.contains(edge+1024,0),false);
  assert.equal(w.contains(NaN,0),false);assert.equal(w.outside(NaN,0),false);assert.equal(w.outsideOpen(0,NaN),false);
  assert.equal(w.contains(Infinity,0),false);assert.equal(w.outside(Infinity,0),true);
  const e=w.extent();assert.equal(e.bounded,false);assert.equal(e.w,Infinity);assert.equal(e.minX,-Infinity);assert.equal(e.maxY,Infinity);assert.ok(Object.isFrozen(e));
  assert.ok(w.axisMin()<=-edge&&w.axisMax()>=edge);
  const r=w.chunkRange(256);assert.equal(r.min,-edge/256);assert.equal(r.max-r.min+1,r.count);assert.ok(r.count>8e6);
  assert.throws(()=>w.chunkRange(0));
});

test('monde ouvert 217 : site(id) charge le canton nommé ; tout autre identifiant est refusé',()=>{
  const w=O.create(17117);
  for(const[cx,cy]of [[0,0],[-3,2],[5,-7]]){const c=G.generate(17117,cx,cy);for(const s of c.sites)assert.deepEqual(w.site(s.id),s);}
  for(const bad of ['P0001','K0_0:route:0','K0_0:site:999','K-0_0:site:0','K0_0:site:01','S1_2',12,null,undefined,{}])assert.equal(w.site(bad),undefined,String(bad));
});

test('monde ouvert 217 : sitesNear rend exactement le voisinage, dans un ordre fixe, borné',()=>{
  for(const seed of [17117,84329]){
    const w=O.create(seed),all=[];for(let cy=-3;cy<=3;cy++)for(let cx=-3;cx<=3;cx++)all.push(...G.generate(seed,cx,cy).sites);
    for(const[x,y,r]of [[w.home.x,w.home.y,600],[-1500,700,900],[0,0,2048],[1023.5,-1.5,40],[2900,2900,0]]){
      const got=w.sitesNear(x,y,r),want=all.filter(s=>far(s.x-x,s.y-y)<=r);
      assert.deepEqual(got.map(s=>s.id).sort(),want.map(s=>s.id).sort(),seed+' '+x+','+y);
      // Ordre canonique : canton par ligne puis colonne, puis rang.
      const key=s=>{const p=K.parseEntity(s.id);return[p.cy,p.cx,p.index];};
      for(let i=1;i<got.length;i++){const a=key(got[i-1]),b=key(got[i]);assert.ok(a[0]<b[0]||a[0]===b[0]&&(a[1]<b[1]||a[1]===b[1]&&a[2]<b[2]));}
    }
    assert.deepEqual(w.sitesNear(NaN,0,100),[]);
    assert.throws(()=>w.sitesNear(0,0,R.nearMaxRadius+1));assert.throws(()=>w.sitesNear(0,0,-1));assert.throws(()=>w.sitesNear(0,0,NaN));
  }
});

test('monde ouvert 217 : réponses indépendantes du cache, de l’ordre des requêtes et de l’éviction',()=>{
  const queries=[[0,0],[5000,-3000],[-9000,4000],[480,640],[20000,20000],[-2048,-2048]];
  const run=(order,cache)=>{const w=O.create(1947648717,cache?{cache}:{}),out={};
    for(const i of order){const[x,y]=queries[i];out[i]=JSON.stringify([w.sitesNear(x,y,700).map(s=>s.id),w.nearestRoad({x,y})?.road.id??null,w.pickRoad(2654435761,x,y)?.id??null,w.route({x,y},{x:x+1200,y:y-900})?.metres??null]);}
    const st=w.streamStats();assert.ok(st.size<=st.capacity,'cache borné');return{out,st};};
  const a=run([0,1,2,3,4,5]),b=run([5,4,3,2,1,0],{capacity:25}),c=run([3,0,4,1,5,2,0,3],{capacity:25});
  assert.deepEqual(b.out,a.out);assert.deepEqual(c.out,a.out);
  assert.ok(b.st.evictions>0&&c.st.evictions>0,'l’éviction a eu lieu');
});

test('monde ouvert 217 : migrations et épaves — tirage de route par position, sans % roads.length',()=>{
  const w=O.create(17117),x=w.home.x,y=w.home.y,ring=w.roadsAround(x,y);
  assert.ok(ring.length>=4);
  const ids=new Set();for(let h=0;h<64;h++){const r=w.pickRoad(h*2654435761>>>0,x,y);assert.ok(ring.includes(r));ids.add(r.id);}
  assert.ok(ids.size>=Math.min(ring.length,8),'les tirages couvrent l’anneau');
  // Même tirage depuis un monde neuf, après avoir parcouru ailleurs : aucune dépendance au chargé.
  const v=O.create(17117);v.sitesNear(-30000,30000,500);assert.equal(v.pickRoad(77,x,y).id,w.pickRoad(77,x,y).id);
  assert.equal(w.pickRoad(0,NaN,0),null);assert.throws(()=>w.pickRoad(-1,x,y));assert.throws(()=>w.pickRoad(1.5,x,y));
});

test('monde ouvert 217 : graphe routier — chaque passage de couture est vu des deux cantons',()=>{
  for(const seed of [0,17117,4294967295]){const w=O.create(seed);let seams=0;
    for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++){const c=w.canton(cx,cy);
      for(const r of c.roads){const e=K.parseEdge(r.from);assert.ok(e,r.from);
        const other=e.axis==='v'?(e.x===cx?{cx:cx-1,cy}:{cx:cx+1,cy}):(e.y===cy?{cx,cy:cy-1}:{cx,cy:cy+1});
        const twin=w.canton(other.cx,other.cy).roads.find(q=>q.from===r.from);assert.ok(twin,seed+' '+r.id+' '+r.from);assert.deepEqual(twin.points[0],r.points[0]);seams++;}}
    assert.ok(seams>40,seed+' : '+seams);
  }
});

test('monde ouvert 217 : itinéraire borné à quelques cantons, continu, symétrique, refusé au-delà',()=>{
  for(const seed of SEEDS){
    const w=O.create(seed),from={x:w.home.x,y:w.home.y};let found=0;
    for(const[dx,dy]of [[1900,300],[-1500,-1800],[700,-2100],[-2200,900]]){
      const to={x:from.x+dx,y:from.y+dy},r=w.route(from,to);if(!r)continue;found++;
      assert.ok(r.cantons.length<=R.route.maxCantons);
      assert.ok(r.metres+1e-9>=far(dx,dy),'jamais plus court que le vol d’oiseau');
      assert.ok(Math.abs(r.metres-r.roadMetres-r.connectorMetres)<1e-6);
      for(let i=2;i<r.path.length-1;i++)assert.ok(far(r.path[i].x-r.path[i-1].x,r.path[i].y-r.path[i-1].y)<=G.CELL*Math.SQRT2+1e-6,seed+' saut dans le tracé');
      const back=w.route(to,from);assert.ok(back&&Math.abs(back.roadMetres-r.roadMetres)<1e-6,'symétrique');
      assert.deepEqual(O.create(seed).route(from,to),r,'reproductible');
    }
    assert.ok(found>=2,seed+' : '+found+' itinéraires sur 4');
    // Au-delà du rectangle permis (trois cantons d'écart en diagonale, marge comprise : 6 × 6 > 25) : refusé sans rien charger de plus.
    const before=w.streamStats().generated;assert.equal(w.route(from,{x:from.x+3*1024,y:from.y+3*1024}),null);assert.equal(w.streamStats().generated,before);
    assert.equal(w.route(from,{x:NaN,y:0}),null);assert.equal(w.route(null,from),null);
  }
});

test('monde ouvert 217 : module isolé, génération 12 refusée, mondes G1–G11 intouchés',()=>{
  const source=read('src/world-open217.js'),code=source.replace(/\/\/.*$/gm,'');
  assert.ok(!/Math\.random|Math\.hypot|Math\.pow|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(code),'module pur et portable');
  assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js','./world-cantons217.js','./world-canton-gen217.js']);
  assert.ok(!/G\.hash|G\.rng|Frontier|Geography135|geography141|WorldContent|expansions|\.taken\b/.test(code),'aucun flux ni registre des générations 1 à 11');
  for(const file of ['index.html','sw.js','scripts/server.mjs','scripts/build.mjs','scripts/public-manifest183.cjs','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(!read(file).includes('world-open217')&&!read(file).includes('WorldOpen217'),file);
  for(const file of fs.readdirSync(path.join(ROOT,'src')))if(!['world-open217.js','world-sites217.js','world-save217.js','core.js'].includes(file)){const text=read('src/'+file);assert.ok(!text.includes('WorldOpen217')&&!text.includes('world-open217'),file+' ne doit pas dépendre du monde ouvert');}
  const Wd=require('../src/frontier-world.js'),St=require('../src/frontier-state.js');
  assert.throws(()=>Wd.create(17117,K.RULES.reservedGeneration),/Version du monde inconnue/);
  assert.throws(()=>St.normalize({...St.initial(),generation:K.RULES.reservedGeneration}),/Génération inconnue/);
  assert.ok(!/sans bord/i.test(read('index.html')),'aucune option de menu');
  const print=world=>crypto.createHash('sha256').update(JSON.stringify([world.size,world.home,world.roads,world.pois.map(p=>[p.id,p.x,p.y,p.name]),world.towns])).digest('hex');
  const before=[print(Wd.create(17117,4)),print(Wd.create(42,11))];
  for(const seed of [17117,42]){const w=O.create(seed);w.route({x:w.home.x,y:w.home.y},{x:w.home.x+1500,y:w.home.y});w.sitesNear(0,0,2048);}
  assert.deepEqual([print(Wd.create(17117,4)),print(Wd.create(42,11))],before);
});
