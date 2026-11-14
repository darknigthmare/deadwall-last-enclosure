'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),K=require('../src/world-cantons217.js');
const ROOT=path.resolve(__dirname,'..'),R=C.WorldCantons217Rules,read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');

test('cantons 217 : règles gelées dans le cœur et cohérentes avec le découpage existant',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(K)&&K.RULES===R);
  assert.deepEqual({...R},{reservedGeneration:12,canton:1024,chunk:256,loadRadius:1,keepRadius:2,cacheCapacity:36,maxCoordinate:1048575,maxIndex:65535});
  assert.equal(R.canton,C.WorldStreamRules131.sector,'un canton a la taille d’un secteur actuel');
  assert.equal(R.canton%R.chunk,0);assert.ok(R.keepRadius>=R.loadRadius&&R.cacheCapacity>=(2*R.keepRadius+1)**2);
  assert.ok(Number.isSafeInteger(R.maxCoordinate*R.canton),'les mètres restent exacts en flottant');
});

test('cantons 217 : coordonnées signées, sans zéro négatif, aller-retour exact',()=>{
  assert.deepEqual(K.at(0,0),{cx:0,cy:0});assert.deepEqual(K.at(1023.999,1024),{cx:0,cy:1});
  assert.deepEqual(K.at(-.5,-1024),{cx:-1,cy:-1});assert.deepEqual(K.at(-1024.001,2048),{cx:-2,cy:2});
  const zero=K.at(-0,-0);assert.ok(Object.is(zero.cx,0)&&Object.is(zero.cy,0));
  assert.deepEqual(K.bounds(-3,2),{x:-3072,y:2048,w:1024,h:1024});
  for(const [x,y]of [[0,0],[-1,-1],[12345.25,-98765.5],[-1048575*1024,1048575*1024+1023]]){
    const p=K.toLocal(x,y),back=K.toWorld(p.cx,p.cy,p.x,p.y);assert.ok(p.x>=0&&p.x<1024&&p.y>=0&&p.y<1024);assert.deepEqual(back,{x,y});
  }
  for(const bad of [[NaN,0],[0,Infinity],[2e12,0]])assert.throws(()=>K.at(...bad));
  assert.throws(()=>K.bounds(.5,0));assert.throws(()=>K.bounds(0,1048576));assert.throws(()=>K.toWorld(0,0,-1,0));
});

test('cantons 217 : identifiants canoniques, stables et distincts des identifiants historiques',()=>{
  assert.equal(K.id(0,0),'K0_0');assert.equal(K.id(-12,7),'K-12_7');assert.equal(K.id(1048575,-1048575),'K1048575_-1048575');
  for(const [cx,cy]of [[0,0],[-1,0],[0,-1],[37,-204],[1048575,-1048575]])assert.deepEqual(K.parse(K.id(cx,cy)),{cx,cy});
  for(const bad of ['K-0_0','K01_0','K1_','K1_2 ','S1_2','K1048576_0','K1_2:site:0','k1_2',12,null,undefined])assert.equal(K.parse(bad),null,String(bad));
  assert.equal(K.entityId(-3,4,'site',0),'K-3_4:site:0');
  assert.deepEqual(K.parseEntity('K-3_4:site:65535'),{cx:-3,cy:4,canton:'K-3_4',kind:'site',index:65535});
  for(const bad of ['K-3_4:site:65536','K-3_4:site:01','K-3_4:Site:1','K-3_4:site','K-3_4::1','P0001','K-0_4:site:1'])assert.equal(K.parseEntity(bad),null,bad);
  assert.throws(()=>K.entityId(0,0,'site',-1));assert.throws(()=>K.entityId(0,0,'S',1));assert.throws(()=>K.entityId(0,0,'site',65536));
  // Aucun identifiant de canton ne passe pour un identifiant d'une campagne existante.
  const historical=[/^P\d{4}$/,/^(P\d{4}:(-?\d+:\d+|car:\d+|out:\d+)|[TR]\d+_\d+_\d+)$/,/^(?:P\d{4}:e\d+|N165_(?:0|[1-9]\d{0,2})_(?:0|[1-9]\d{0,2})_0)$/,/^S\d+_\d+$/,/^T131_\d{1,2},\d{1,2}$/,/^T135_(0|[1-9]\d*)$/];
  for(const sample of [K.id(0,0),K.id(-5,9),K.entityId(1,2,'site',3),K.entityId(-1,-2,'arbre',40),K.edge(0,0,'east').id])for(const re of historical)assert.ok(!re.test(sample),sample+' ~ '+re);
});

test('cantons 217 : sous-graines figées, pures et indépendantes de l’ordre de visite',()=>{
  // Vecteurs de référence : les modifier, c'est changer tous les mondes sans bord déjà créés.
  assert.deepEqual([K.subSeed(17117,0,0,'routes'),K.subSeed(17117,-1,0,'routes'),K.subSeed(17117,0,-1,'routes'),K.subSeed(0,0,0,'routes'),K.subSeed(4294967295,1048575,-1048575,'lieux'),K.edgeSeed(17117,0,0,'east','routes'),K.cornerSeed(17117,0,0,'routes')],
    [242703623,3894040767,124099447,2801488010,3720449754,2643223248,4154194328]);
  const draw=K.stream(17117,3,-2,'lieux');assert.deepEqual([draw(),draw(),draw()],[0.49516498064622283,0.5082461684942245,0.3119235155172646]);
  const cells=[];for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++)cells.push([x,y]);
  const sample=order=>{const out=new Map();for(const [x,y]of order){const r=K.stream(84329,x,y,'lieux');out.set(K.id(x,y),[K.subSeed(84329,x,y,'routes'),r(),r()]);}return out;};
  const forward=sample(cells),backward=sample([...cells].reverse()),spiral=sample(K.ring(0,0,6).map(c=>[c.cx,c.cy]));
  for(const [key,value]of forward){assert.deepEqual(backward.get(key),value);assert.deepEqual(spiral.get(key),value);}
  // Deux tirages du même canton repartent du même point : aucun état caché.
  const a=K.stream(1,5,5,'eau'),b=K.stream(1,5,5,'eau');a();a();assert.equal(b(),K.stream(1,5,5,'eau')());
  for(const bad of [-1,4294967296,1.5,'17117'])assert.throws(()=>K.subSeed(bad,0,0,'routes'));
  for(const bad of ['', 'Routes','1routes','a'.repeat(33),null])assert.throws(()=>K.subSeed(1,0,0,bad));
  assert.throws(()=>K.subSeed(1,.5,0,'routes'));
});

test('cantons 217 : sous-graines sans collision proche ni symétrie, répartition correcte',()=>{
  const seen=new Set();let count=0;
  for(const name of ['routes','lieux','eau'])for(let y=-40;y<=40;y++)for(let x=-40;x<=40;x++){seen.add(K.subSeed(17117,x,y,name));count++;}
  assert.equal(seen.size,count,'aucune collision sur 81×81 cantons et trois flux');
  assert.notEqual(K.subSeed(17117,3,-2,'routes'),K.subSeed(17117,-2,3,'routes'));assert.notEqual(K.subSeed(17117,3,2,'routes'),K.subSeed(17117,-3,-2,'routes'));
  assert.notEqual(K.subSeed(17117,3,2,'routes'),K.subSeed(17118,3,2,'routes'));assert.notEqual(K.subSeed(17117,3,2,'routes'),K.subSeed(17117,3,2,'lieux'));
  // Canton, couture et sommet de mêmes coordonnées ne partagent pas leur graine.
  assert.equal(new Set([K.subSeed(9,4,4,'routes'),K.edgeSeed(9,4,4,'north','routes'),K.edgeSeed(9,4,4,'west','routes'),K.cornerSeed(9,4,4,'routes')]).size,4);
  const buckets=new Array(16).fill(0);for(let y=-100;y<100;y++)for(let x=-100;x<100;x++)buckets[K.subSeed(42,x,y,'routes')>>>28]++;
  for(const n of buckets)assert.ok(n>2250&&n<2750,'répartition des bits de tête : '+buckets.join(' '));
  let mean=0;const r=K.stream(42,0,0,'lieux');for(let i=0;i<20000;i++){const v=r();assert.ok(v>=0&&v<1);mean+=v;}assert.ok(Math.abs(mean/20000-.5)<.01);
});

test('cantons 217 : une couture a le même nom, la même graine et le même segment des deux côtés',()=>{
  for(const [cx,cy]of [[0,0],[-1,-1],[17,-40],[-1048574,1048574]])for(const side of K.SIDES){
    const n=K.neighbour(cx,cy,side),mine=K.edge(cx,cy,side),theirs=K.edge(n.cx,n.cy,n.opposite);
    assert.deepEqual(mine,theirs);assert.deepEqual(K.parseEdge(mine.id),mine);
    assert.equal(K.edgeSeed(17117,cx,cy,side,'routes'),K.edgeSeed(17117,n.cx,n.cy,n.opposite,'routes'));
    assert.deepEqual(K.edgeLine(cx,cy,side),K.edgeLine(n.cx,n.cy,n.opposite));
    const line=K.edgeLine(cx,cy,side),b=K.bounds(cx,cy);
    for(const p of [line.a,line.b])assert.ok(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h,'la couture borde son canton');
    assert.ok(line.b.x-line.a.x+line.b.y-line.a.y===1024);
  }
  const ids=new Set(K.SIDES.map(side=>K.edge(5,5,side).id));assert.equal(ids.size,4);
  assert.equal(new Set(K.SIDES.map(side=>K.edgeSeed(3,5,5,side,'eau'))).size,4);
  assert.equal(K.parseEdge('Kx1_2'),null);assert.equal(K.parseEdge('Kh-0_2'),null);assert.throws(()=>K.edge(0,0,'up'));
  // Les quatre cantons autour d'un sommet le désignent tous.
  const around=[[4,4],[3,4],[3,3],[4,3]].map(([cx,cy])=>K.corners(cx,cy).some(v=>v.vx===4&&v.vy===4));assert.deepEqual(around,[true,true,true,true]);
  assert.equal(K.corners(4,4).length,4);
});

test('cantons 217 : voisinage et anneau de chargement, ordre total du plus proche au plus lointain',()=>{
  assert.deepEqual(K.neighbours(0,0).map(n=>[n.cx,n.cy,n.side]),[[0,-1,'north'],[1,0,'east'],[0,1,'south'],[-1,0,'west']]);
  assert.equal(K.neighbours(0,0,true).length,8);assert.equal(K.neighbours(1048575,1048575,true).length,3,'au bout de l’adressage, pas de voisin fantôme');
  assert.throws(()=>K.neighbour(1048575,0,'east'));
  assert.deepEqual(K.ring(0,0,0).map(c=>c.id),['K0_0']);
  assert.deepEqual(K.ring(0,0,1).map(c=>c.id),['K0_0','K0_-1','K-1_0','K1_0','K0_1','K-1_-1','K1_-1','K-1_1','K1_1']);
  for(const r of [0,1,2,5]){const ring=K.ring(-7,3,r);assert.equal(ring.length,(2*r+1)**2);assert.equal(new Set(ring.map(c=>c.id)).size,ring.length);for(let i=1;i<ring.length;i++)assert.ok(ring[i].distance>=ring[i-1].distance);assert.equal(ring[0].id,'K-7_3');}
  assert.deepEqual(K.ring(0,0).map(c=>c.id),K.ring(0,0,R.loadRadius).map(c=>c.id));
  assert.deepEqual(K.ringAt(-1,-1,1).map(c=>c.id),K.ring(-1,-1,1).map(c=>c.id));
  assert.deepEqual(K.ringAt(1023.9,0,0).map(c=>c.id),['K0_0']);assert.deepEqual(K.ringAt(1024,0,0).map(c=>c.id),['K1_0']);
  assert.throws(()=>K.ring(0,0,-1));assert.throws(()=>K.ring(0,0,65));assert.throws(()=>K.ring(0,0,1.5));
});

test('cantons 217 : plan de chargement pur, avec hystérésis sur la couture',()=>{
  const first=K.plan([],0,0);assert.deepEqual(first.load,K.ring(0,0,1).map(c=>c.id));assert.deepEqual(first.drop,[]);
  const loaded=first.load,east=K.plan(loaded,1,0);
  assert.deepEqual(east.load,['K2_0','K2_-1','K2_1']);assert.deepEqual(east.drop,[],'un pas ne lâche rien : anneau protégé de rayon 2');
  // Aller-retour sur la couture : rien à régénérer.
  assert.deepEqual(K.plan([...loaded,...east.load],0,0),{load:[],drop:[]});
  const far=K.plan([...loaded,...east.load],4,0);assert.deepEqual(far.drop.slice(0,3),['K-1_-1','K-1_0','K-1_1']);assert.ok(far.drop.includes('K1_0')&&!far.drop.includes('K2_0'));
  const input=['K0_0','K9_9'];K.plan(input,0,0);assert.deepEqual(input,['K0_0','K9_9'],'entrée intacte');
  assert.deepEqual(K.plan(new Set(['K9_9','K0_0']),0,0,{loadRadius:0,keepRadius:0}),{load:[],drop:['K9_9']});
  assert.throws(()=>K.plan(['S0_0'],0,0));assert.throws(()=>K.plan([],0,0,{loadRadius:2,keepRadius:1}));
});

test('cantons 217 : cache borné, éviction hors de l’anneau protégé, contenu indépendant du cache',()=>{
  assert.throws(()=>K.createCache({capacity:24}));assert.throws(()=>K.createCache({capacity:5000}));
  const cache=K.createCache(),built=[],build=(cx,cy,key)=>{built.push(key);return{key,seed:K.subSeed(17117,cx,cy,'lieux')};};
  assert.equal(cache.capacity,36);assert.equal(cache.get(0,0),undefined);
  // Marche vers l'est sur 30 cantons : la mémoire reste bornée, l'anneau protégé reste chargé.
  for(let step=0;step<=30;step++){
    for(const c of K.ring(step,0,1))cache.ensure(c.cx,c.cy,build);
    const dropped=cache.evict(step,0);
    assert.ok(cache.size<=36,'taille '+cache.size);for(const key of dropped){const p=K.parse(key);assert.ok(Math.max(Math.abs(p.cx-step),Math.abs(p.cy))>2,'canton protégé retiré : '+key);}
    for(const c of K.ring(step,0,1))assert.ok(cache.has(c.cx,c.cy));
  }
  assert.equal(new Set(built).size,built.length,'aucun canton reconstruit pendant une marche sans retour');
  const stats=cache.stats();assert.equal(stats.size,cache.size);assert.ok(stats.evictions>0&&stats.hits>0&&stats.misses>0);
  // Retour au départ : le canton évincé se reconstruit à l'identique.
  assert.ok(!cache.has(0,0));const again=cache.ensure(0,0,build);assert.deepEqual(again,{key:'K0_0',seed:K.subSeed(17117,0,0,'lieux')});
  // Le moins récemment utilisé part le premier ; un canton relu est gardé.
  const lru=K.createCache({capacity:25,keepRadius:2});for(let i=0;i<27;i++)lru.set(100+i,100,i);lru.get(100,100);
  assert.deepEqual(lru.evict(0,0),['K101_100','K102_100']);assert.ok(lru.has(100,100));
  // Tout est protégé : rien n'est retiré, même au-delà de la capacité demandée par l'appelant.
  const tight=K.createCache({capacity:25,keepRadius:2});for(const c of K.ring(0,0,2))tight.set(c.cx,c.cy,c.id);assert.deepEqual(tight.evict(0,0),[]);assert.equal(tight.size,25);
  assert.throws(()=>cache.set(0,0,undefined));assert.throws(()=>K.createCache().ensure(0,0));
  assert.ok(lru.delete(100,100)&&!lru.has(100,100));lru.clear();assert.equal(lru.size,0);assert.deepEqual(lru.ids(),[]);
});

test('cantons 217 : brique isolée — aucune génération existante ne la lit, aucun script public ajouté',()=>{
  const source=read('src/world-cantons217.js');
  assert.ok(!/Math\.random|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(source.replace(/\/\/.*$/gm,'')),'module pur');
  assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js'],'seule dépendance : les règles du cœur');
  assert.ok(!read('index.html').includes('world-cantons217'),'non chargé par le jeu');assert.ok(!read('sw.js').includes('world-cantons217'));
  for(const file of fs.readdirSync(path.join(ROOT,'src')))if(file!=='world-cantons217.js'&&file!=='core.js')assert.ok(!read('src/'+file).includes('WorldCantons217'),file+' ne doit pas encore dépendre des cantons');
  assert.equal((read('src/core.js').match(/WorldCantons217Rules/g)||[]).length,1);
  // Les générations acceptées et la taille de la région finie n'ont pas bougé.
  const W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js');
  assert.equal(W.sizeForGeneration(11),24576);assert.equal(W.sizeForGeneration(4),8192);assert.equal(C.WorldStreamRules131.size,24576);assert.equal(C.GeographyRules135.size,24576);
  assert.throws(()=>W.create(17117,R.reservedGeneration),/Version du monde inconnue/);
  assert.throws(()=>S.normalize({...S.initial(),generation:R.reservedGeneration}),/Génération inconnue/);
});
