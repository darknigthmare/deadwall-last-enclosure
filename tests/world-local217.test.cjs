'use strict';
// Carte locale de D-17 née de son canton (specs/monde-sans-bord, tranche T4 hors jeu).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../src/core.js'),K=require('../src/world-cantons217.js'),G=require('../src/world-canton-gen217.js'),L=require('../src/world-local217.js');
const ROOT=path.resolve(__dirname,'..'),R=C.WorldLocal217Rules,W=G.WATER,read=file=>fs.readFileSync(path.join(ROOT,file),'utf8');
const SEEDS=[0,1,42,17117,84329,967313470,1947648717,4294967295];
// Les 50 graines du relevé : les huit de référence, puis la suite tirée comme pour le site de fondation.
const FIFTY=[...SEEDS];for(let k=1;FIFTY.length<50;k++)FIFTY.push(K.subSeed(217,k,0,'graines-d17'));
const locals=new Map(),local=seed=>{if(!locals.has(seed))locals.set(seed,L.describe(seed));return locals.get(seed);};
const cellOf=(S,side,t)=>side==='north'?t:side==='south'?(S-1)*S+t:side==='west'?t*S:t*S+S-1;
const deep=(l,i)=>l.water[i]===W.sea||l.water[i]===W.lake||(l.water[i]===W.river&&!l.roads[i]);
// Un pas entre deux cases voisines est-il permis ? Relu ici sans passer par le module.
function stepOK(l,i,j){
  const S=l.frame,d=j-i;if(deep(l,j))return false;if(l.levels[i]===l.levels[j])return true;
  return Boolean(d===1?l.passes[i]&1:d===-1?l.passes[j]&1:d===S?l.passes[i]&2:l.passes[j]&2);
}

test('carte locale 217 : règles gelées dans le cœur, cadre réglable et aligné sur les mailles',()=>{
  assert.ok(Object.isFrozen(R)&&Object.isFrozen(R.costs)&&Object.isFrozen(R.deposits)&&Object.isFrozen(R.deposits.kinds.wood));
  assert.equal(L.RULES,R);assert.equal(R.version,1);assert.equal(R.frame,192);assert.equal(R.tile,1,'même pas que la carte actuelle : une case d’un mètre');
  assert.equal(C.TILE,32);assert.equal(C.WORLD_TILES,128,'la carte actuelle fait 128 cases de 1 m');
  assert.equal(R.frame%(2*G.CELL),0);assert.ok(R.ramp>=2&&R.ramp<=G.CELL&&R.narrow>R.ramp,'une rampe est plus étroite qu’un front ouvert');
  // Le cadre tient dans le canton d'origine quel que soit le site retenu.
  const F=C.WorldRelief217Rules.foundation;assert.ok((R.frame-F.size)/2<=F.margin*G.CELL,'cadre dans K0_0');
  assert.equal(F.size,64);assert.equal(F.idealCliff,0);assert.ok(F.backWeight>0&&F.backCap===2,'site adossé, réglé dans les règles');
  // Quantités relevées sur la carte actuelle (graines 17117, 42, 84329) : 99 à 102 gisements de bois, 30 à 47 de pierre, 44 à 59 de ferraille.
  assert.deepEqual(Object.fromEntries(Object.entries(R.deposits.kinds).map(([k,v])=>[k,v.count])),{stone:40,wood:100,scrap:52});
  assert.equal(R.deposits.zone,128,'récolte dans le carré de la carte actuelle');
  // Le cadre se règle : 128 m (la carte actuelle) et 256 m restent valides ; hors maille, refusé.
  for(const frame of [128,256]){const l=L.describe(17117,{frame});assert.equal(l.frame,frame);assert.equal(l.levels.length,frame*frame);assert.ok(L.siege(l).ok);}
  for(const frame of [100,96,0,2048,'192'])assert.throws(()=>L.describe(17117,{frame}),/Cadre de carte locale/);
  assert.throws(()=>L.describe(-1),/Graine régionale invalide/);
});

test('carte locale 217 : déterminisme — même graine, même carte, quel que soit l’ordre et le cache',()=>{
  const first=SEEDS.map(s=>L.describe(s).digest);
  G.forget();for(const[x,y]of [[3,-2],[0,1],[-1,0]])G.generate(84329,x,y);
  const second=[...SEEDS].reverse().map(s=>L.describe(s).digest).reverse();
  assert.deepEqual(second,first);assert.equal(new Set(first).size,SEEDS.length,'huit graines, huit cartes');
  const a=L.describe(17117),b=L.describe(17117);assert.notEqual(a,b);assert.deepEqual(a.levels,b.levels);assert.deepEqual(a.sides,b.sides);assert.deepEqual(a.deposits,b.deposits);assert.equal(L.digest(a),a.digest);
  // Empreintes de référence, vues à l'identique sous Node et dans Chromium (page d'aperçu). Elles peuvent
  // encore bouger avec un réglage tant que la génération 12 n'est ouverte nulle part.
  assert.deepEqual([17117,42,4294967295].map(s=>local(s).digest),['e59f29a8','8d447481','8a666ce2']);
  assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.sides)&&Object.isFrozen(a.sides.north)&&Object.isFrozen(a.sheet)&&Object.isFrozen(a.deposits)&&Object.isFrozen(a.accesses));
});

test('carte locale 217 : cohérence avec le canton — mêmes paliers, milieux, eau et cols aux mêmes points',()=>{
  for(const seed of SEEDS){
   const l=local(seed),c=G.generate(seed,0,0),f=c.foundation,S=l.frame,N=G.CELLS,CELL=G.CELL;
   assert.equal(l.canton,'K0_0');assert.equal(l.site,f.id);assert.equal(l.generation,12);assert.equal(l.unit,C.TILE);
   assert.deepEqual(l.origin,{x:f.x-S/2,y:f.y-S/2});assert.equal(l.level,f.level);assert.equal(l.biome,f.biome);
   for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const i=y*S+x,wx=l.origin.x+x+.5,wy=l.origin.y+y+.5,m=Math.floor(wy/CELL)*N+Math.floor(wx/CELL);
    if(l.levels[i]!==c.levels[m])assert.fail('palier différent du canton en '+x+','+y+' graine '+seed);
    if(l.biomes[i]!==c.biomes[m])assert.fail('milieu différent du canton');
    // Mer et lacs : ceux de la maille. Rivière ou ruisseau : seulement dans une maille que le canton mouille, ou sa voisine (largeur du lit).
    const still=c.water[m]===W.sea||c.water[m]===W.lake;if(still!==(l.water[i]===W.sea||l.water[i]===W.lake))assert.fail('mer ou lac différent du canton');
    // Une rampe n'existe que sur une arête de col du canton.
    if(l.passes[i]&1&&!(x%CELL===CELL-1&&c.passes[m]&1))assert.fail('rampe hors col (est)');
    if(l.passes[i]&2&&!(y%CELL===CELL-1&&c.passes[m]&2))assert.fail('rampe hors col (sud)');
   }
   // Points pris au hasard fixe : la fonction de champ du générateur donne le même palier.
   for(let k=0;k<200;k++){const x=(k*37+11)%S,y=(k*91+5)%S;assert.equal(l.levels[y*S+x],G.levelAt(seed,l.origin.x+x+.5,l.origin.y+y+.5));assert.equal(G.BIOMES[l.biomes[y*S+x]],G.biomeAt(seed,l.origin.x+x+.5,l.origin.y+y+.5));}
   // Chaque arête de col du canton prise dans le cadre porte une rampe de la largeur réglée, et une seule.
   for(let my=0;my<S/CELL;my++)for(let mx=0;mx<S/CELL;mx++){
    const m=(l.origin.y/CELL+my)*N+l.origin.x/CELL+mx;let east=0,south=0;
    for(let t=0;t<CELL;t++){if(l.passes[(my*CELL+t)*S+mx*CELL+CELL-1]&1)east++;if(l.passes[(my*CELL+CELL-1)*S+mx*CELL+t]&2)south++;}
    assert.equal(east,c.passes[m]&1&&mx<S/CELL-1?R.ramp:0);assert.equal(south,c.passes[m]&2&&my<S/CELL-1?R.ramp:0);
   }
   // Le plat du site est d'un seul palier et à sec ; le centre de la carte est le centre du site.
   const flat=f.size;for(let y=(S-flat)/2;y<(S+flat)/2;y++)for(let x=(S-flat)/2;x<(S+flat)/2;x++){const i=y*S+x;assert.equal(l.levels[i],f.level);assert.ok(l.water[i]!==W.sea&&l.water[i]!==W.lake);}
   assert.deepEqual(l.centre,{x:S/2,y:S/2});assert.equal(l.cost[(S/2)*S+S/2],0);
   // Cols et routes : ceux du canton, en coordonnées locales.
   for(const k of l.cols){const o=c.cols.find(q=>q.id===k.id);assert.ok(o&&Math.abs(o.x-l.origin.x-k.x)<.011&&Math.abs(o.y-l.origin.y-k.y)<.011&&k.x>=0&&k.y>=0&&k.x<=S&&k.y<=S);}
   for(const a of l.accesses){assert.ok(c.roads.some(r=>r.id===a.road&&r.class===a.class));assert.ok(L.SIDES.includes(a.side)&&a.x>=0&&a.y>=0&&a.x<=S&&a.y<=S&&typeof a.linked==='boolean');
    assert.ok(a.side==='north'?a.y===0:a.side==='south'?a.y===S:a.side==='west'?a.x===0:a.x===S,'une route entre par le bord du cadre');}
   assert.ok(l.accesses.some(a=>a.linked),'une route au moins mène à la cité : '+seed);
   // Nature des cases : l'eau est de l'eau, une rampe touche un col, une falaise borde un ressaut.
   for(let i=0;i<S*S;i++){const k=l.kinds[i];if(k===L.KIND.water)assert.ok(l.water[i]&&!(l.roads[i]&&l.water[i]!==W.sea&&l.water[i]!==W.lake));}
  }
});

test('carte locale 217 : 50 graines — jamais de cité enclavée, centre atteint depuis chaque front, fronts conformes aux côtés',()=>{
  for(const seed of FIFTY){
   const l=local(seed),s=L.siege(l),S=l.frame,centre=(S/2)*S+S/2;
   assert.equal(s.enclosed,false,'cité enclavée : '+seed);assert.ok(s.reachable&&s.consistent&&s.ok,'siège incohérent : '+seed);
   assert.ok(s.fronts.length>=1&&s.fronts.length+s.closed===4);assert.equal(s.open+s.slowed+s.funnelled,s.fronts.length);
   for(const side of L.SIDES){
    const d=l.sides[side],front=s.fronts.find(f=>f.side===side);
    assert.ok(['ouvert','ralenti','passage','clos'].includes(d.status));assert.ok(d.width>=0&&d.width<=S&&Math.abs(d.share-d.width/S)<.006);
    const reached=[];for(let t=0;t<S;t++)if(l.cost[cellOf(S,side,t)]>=0)reached.push(t);
    assert.equal(d.entries.reduce((n,e)=>n+e.width,0),reached.length,'les entrées sont les cases du bord d’où l’on atteint la cité');
    if(d.status==='clos'){assert.equal(front,undefined);assert.equal(reached.length,0,'un côté fermé n’a aucune entrée');assert.ok(['falaise','eau'].includes(d.cause));assert.equal(d.width,0);assert.equal(d.passages.length,0);continue;}
    assert.ok(front&&front.status===d.status&&front.entries.length>=1&&front.walk>=S/2-1,'front : '+seed+' '+side);assert.equal(d.cause,null);
    // Chaque extrémité d'entrée mène au centre par un chemin de cases voisines, sans falaise ni eau profonde.
    for(const e of d.entries)for(const t of [e.from,e.to-1]){
     const i=cellOf(S,side,t),way=L.pathToCentre(l,i%S,Math.floor(i/S));assert.ok(way&&way[0]===i&&way[way.length-1]===centre,'pas de chemin : '+seed+' '+side);
     for(let k=1;k<way.length;k++){const a=way[k-1],b=way[k],step=Math.abs(a-b);assert.ok(step===1||step===S);assert.ok(stepOK(l,a,b),'chemin par une falaise ou l’eau : '+seed);}
    }
    if(d.status==='passage'){
     assert.ok(d.passages.length>=1,'un côté canalisé nomme ses passages : '+seed+' '+side);assert.deepEqual(front.funnels,d.passages);
     for(const p of d.passages){assert.ok(['col','pont','goulet'].includes(p.kind)&&p.width>=1&&p.width<R.narrow&&p.x>=0&&p.y>=0&&p.x<=S&&p.y<=S);if(p.kind==='col'){assert.equal(p.width,R.ramp);assert.equal(p.high-p.low>=1,true);assert.ok(p.low===l.level||p.high===l.level,'la rampe donne sur le plateau de la cité');}}
     assert.equal(d.width,Math.min(S,d.passages.reduce((n,p)=>n+p.width,0)));
    }else{
     // Front ouvert ou ralenti : au moins `narrow` mètres de bord de plain-pied, compris dans les entrées.
     assert.ok(d.width>=R.narrow&&d.lanes.length>=1);assert.equal(d.passages.length,0);
     for(const lane of d.lanes){assert.ok(d.entries.some(e=>e.from<=lane.from&&e.to>=lane.to));for(let t=lane.from;t<lane.to;t++)assert.equal(l.levels[cellOf(S,side,t)],l.level,'un front ouvert arrive de plain-pied');}
    }
   }
   // Une case hors d'atteinte l'est vraiment : aucune voisine atteinte n'y mène.
   for(let i=0;i<S*S;i+=7){if(l.cost[i]>=0)continue;const x=i%S;for(const j of [x<S-1?i+1:-1,x>0?i-1:-1,i+S<S*S?i+S:-1,i-S>=0?i-S:-1])if(j>=0&&l.cost[j]>=0)assert.ok(!stepOK(l,j,i),'case atteignable oubliée : '+seed);}
  }
});

test('carte locale 217 : « une falaise vaut une enceinte » — parts mesurées sur 50 graines, figées',()=>{
  const tally={closed:0,cliff:0,water:0,gated:0,either:0,half:0,slowed:0,open:[0,0,0,0,0],seen:0,near:0,ramps:0,plateau:0},sentences=new Set();
  for(const seed of FIFTY){
   const l=local(seed),all=L.SIDES.map(k=>l.sides[k]),closed=all.filter(s=>s.status==='clos'),gated=all.filter(s=>s.status==='passage'),free=all.filter(s=>s.status==='ouvert'||s.status==='ralenti');
   if(closed.length)tally.closed++;if(closed.some(s=>s.cause==='falaise'))tally.cliff++;if(closed.some(s=>s.cause==='eau'))tally.water++;if(gated.length)tally.gated++;if(closed.length||gated.length)tally.either++;
   if(all.some(s=>s.status==='ouvert'&&s.share<=.5))tally.half++;if(all.some(s=>s.status==='ralenti'))tally.slowed++;tally.open[free.length]++;tally.ramps+=gated.reduce((n,s)=>n+s.passages.length,0);
   if(l.sheet.cliff){tally.seen++;tally.near+=l.sheet.cliff.distance;}tally.plateau+=l.sheet.ground.plateau;sentences.add(l.sheet.sentence);
  }
  console.log('# carte locale sur 50 graines (cadre '+R.frame+' m) : au moins un côté fermé pour '+tally.closed+' (falaise '+tally.cliff+', eau '+tally.water+'), au moins un côté réduit à un passage pour '+tally.gated+', l’un ou l’autre pour '+tally.either
   +', un côté à demi couvert pour '+tally.half+', un front ralenti par un gué pour '+tally.slowed+' ; côtés ouverts 0 à 4 : '+tally.open.join('/')+' ; falaise dans le cadre pour '+tally.seen+', à '+(tally.near/tally.seen).toFixed(0)+' m du centre en moyenne ; '
   +tally.ramps+' passages à tenir ; '+(tally.plateau/50*100).toFixed(0)+' % du cadre sur le palier de la cité ; '+sentences.size+' phrases d’ouverture différentes');
  // Chiffres obtenus avec les règles livrées (cadre de 192 m, plat de 64 m, site adossé). Avant cette tranche,
  // avec un plat de 128 m et la falaise idéale à deux mailles : 0 graine sur 50 à 128 m, 4 sur 50 à 256 m.
  assert.deepEqual({closed:tally.closed,cliff:tally.cliff,water:tally.water,gated:tally.gated,either:tally.either,open:tally.open},{closed:29,cliff:29,water:0,gated:12,either:38,open:[0,2,18,18,12]});
  assert.ok(tally.seen>=40&&tally.near/tally.seen<=40,'la falaise est à l’échelle de la cité');
  assert.ok(sentences.size>=30,'la graine change la phrase d’ouverture');
});

test('carte locale 217 : fiche du site — côtés fermés, passages, eau, milieu, phrase d’ouverture',()=>{
  for(const seed of FIFTY){
   const l=local(seed),f=l.sheet,by=status=>L.SIDES.filter(k=>l.sides[k].status===status);
   assert.deepEqual([...f.closed],by('clos'));assert.deepEqual([...f.open],by('ouvert'));assert.deepEqual([...f.slowed],by('ralenti'));
   assert.deepEqual([...f.closedByCliff,...f.closedByWater].sort(),[...f.closed].sort());
   assert.equal(f.passages.length,by('passage').reduce((n,k)=>n+l.sides[k].passages.length,0));for(const p of f.passages)assert.ok(l.sides[p.side].status==='passage');
   assert.equal(f.level,l.level);assert.equal(f.biome,l.biome);assert.ok(typeof f.biomeName==='string'&&f.biomeName.length>3);
   assert.ok(f.ground.reachable>0&&f.ground.reachable<=1&&f.ground.plateau>0&&f.ground.plateau<=f.ground.reachable);
   if(f.water)assert.ok(['sea','lake','river','stream'].includes(f.water.kind)&&L.SIDES.includes(f.water.side)&&f.water.distance>0);
   if(f.cliff)assert.ok(L.SIDES.includes(f.cliff.side)&&f.cliff.distance>=C.WorldRelief217Rules.foundation.size/2-1);
   assert.match(f.sentence,/^[A-ZÀ][^.]+\.$/);assert.ok(!/undefined|null|NaN/.test(f.sentence));
   // La phrase dit ce que disent les côtés.
   for(const k of f.closedByCliff)assert.ok(f.sentence.toLowerCase().includes('falaise'));
   if(by('passage').length)assert.match(f.sentence,/à tenir/);if(by('ralenti').length)assert.match(f.sentence,/à gué/);
   if(f.open.length===4&&!f.halfOpen.length)assert.match(f.sentence,/quatre côtés à tenir/);
  }
  assert.equal(local(17117).sheet.sentence,'Ceinte de falaises au nord et au sud, à demi couverte à l’est et à l’ouest.');
  assert.equal(local(967313470).sheet.sentence,'Deux rampes à tenir au nord, deux rampes à tenir à l’ouest, ouverte à l’est et au sud.');
  assert.equal(local(1947648717).sheet.sentence,'Adossée à une falaise à l’est, ouverte au nord, au sud et à l’ouest.');
});

test('carte locale 217 : gisements — bois, pierre, ferraille en quantité comparable, à portée, cohérents avec le relief',()=>{
  const D=R.deposits;let foot=0,roadside=0,total=0;
  for(const seed of FIFTY){
   const l=local(seed),S=l.frame,count={stone:0,wood:0,scrap:0},z0=(S-D.zone)/2;
   l.deposits.forEach((d,n)=>{
    assert.deepEqual(K.parseEntity(d.id),{cx:0,cy:0,canton:'K0_0',kind:'gite',index:n});count[d.type]++;total++;
    const i=Math.floor(d.y)*S+Math.floor(d.x);
    assert.ok(d.x>=z0&&d.y>=z0&&d.x<=z0+D.zone&&d.y<=z0+D.zone,'dans le carré de récolte');assert.ok(Math.hypot(d.x-S/2,d.y-S/2)>=D.clear,'hors du centre');
    assert.ok(l.cost[i]>=0,'à portée de la cité : '+seed);assert.equal(l.water[i],0);assert.equal(l.roads[i],0);assert.notEqual(l.kinds[i],L.KIND.ramp);
    const def=D.kinds[d.type];assert.ok(d.amount>=def.amount*D.spread[0]-.01&&d.amount<=def.amount*D.spread[1]+.01&&d.radius>0);assert.equal(d.level,l.levels[i]);
    if(d.why==='pied de falaise'){foot++;assert.equal(d.type,'stone');let high=false;for(let y=Math.max(0,Math.floor(d.y)-D.foot-1);y<=Math.min(S-1,Math.floor(d.y)+D.foot+1)&&!high;y++)for(let x=Math.max(0,Math.floor(d.x)-D.foot-1);x<=Math.min(S-1,Math.floor(d.x)+D.foot+1);x++)if(l.levels[y*S+x]>d.level){high=true;break;}assert.ok(high,'la pierre est au pied d’un ressaut');}
    if(d.why==='bord de route'){roadside++;assert.equal(d.type,'scrap');}
   });
   assert.deepEqual(count,{stone:D.kinds.stone.count,wood:D.kinds.wood.count,scrap:D.kinds.scrap.count},'quantités de la carte actuelle : '+seed);
   for(let a=0;a<l.deposits.length;a++)for(let b=a+1;b<l.deposits.length;b++)if(Math.hypot(l.deposits[a].x-l.deposits[b].x,l.deposits[a].y-l.deposits[b].y)<D.spacing-.02)assert.fail('gisements superposés : '+seed);
  }
  console.log('# gisements sur 50 graines : '+total+' en tout, '+(foot/50).toFixed(1)+' pierres au pied d’une falaise et '+(roadside/50).toFixed(1)+' ferrailles en bord de route par graine');
  assert.ok(foot/50>=10,'la pierre se trouve au pied des falaises');assert.ok(roadside/50>=40);
  // Le bois suit le milieu : en forêt il est « bois », en prairie « arbres isolés ».
  const reasons=new Set(FIFTY.flatMap(s=>local(s).deposits.filter(d=>d.type==='wood').map(d=>d.why)));assert.deepEqual([...reasons].sort(),['arbres isolés','bois','lisière']);
});

test('carte locale 217 : module isolé — absent d’index.html, de sw.js et du build ; génération 12 refusée ; mondes G1–G11 intouchés',()=>{
  const source=read('src/world-local217.js'),code=source.replace(/\/\/.*$/gm,'');
  assert.ok(!/Math\.random|Math\.hypot|Math\.pow|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(code),'module pur et portable');
  assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js','./world-cantons217.js','./world-canton-gen217.js']);
  assert.ok(!/G\.hash|G\.rng|Frontier|Geography135|geography141|WorldContent|taken\b(?!\.)|expansions/.test(code.replace(/taken=\[\]|taken\.(some|push)/g,'')),'aucun flux ni registre des générations 1 à 11');
  for(const file of ['index.html','sw.js','scripts/server.mjs','scripts/build.mjs','scripts/public-manifest183.cjs','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(!read(file).includes('world-local217')&&!read(file).includes('WorldLocal217'),file);
  for(const file of fs.readdirSync(path.join(ROOT,'src')))if(!['world-local217.js','core.js'].includes(file)){const text=read('src/'+file);assert.ok(!text.includes('WorldLocal217')&&!text.includes('world-local217'),file+' ne doit pas dépendre de la carte locale');}
  assert.equal((read('src/core.js').match(/WorldLocal217Rules/g)||[]).length,1);
  // Le build publié, s'il existe, ne contient ni le module ni la page d'aperçu.
  const dist=path.join(ROOT,'dist');
  if(fs.existsSync(dist)){const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
   for(const file of walk(dist)){assert.ok(!/world-local217|world-canton-gen217|apercu-cantons217/.test(file),file);if(/\.(html|js|json|webmanifest)$/.test(file)&&fs.statSync(file).size<4e6&&!file.endsWith(path.join('src','core.js')))assert.ok(!fs.readFileSync(file,'utf8').includes('WorldLocal217'),file);}}
  assert.ok(read('tools/apercu-cantons217.html').includes('hors jeu')&&read('scripts/apercu-cantons217.mjs').includes('world-local217'));
  // La génération 12 reste refusée partout, et aucune option de menu n'en parle.
  const Wd=require('../src/frontier-world.js'),St=require('../src/frontier-state.js');
  assert.throws(()=>Wd.create(17117,K.RULES.reservedGeneration),/Version du monde inconnue/);
  assert.throws(()=>St.normalize({...St.initial(),generation:K.RULES.reservedGeneration}),/Génération inconnue/);
  assert.ok(!/sans bord/i.test(read('index.html')),'aucune option de menu');
  // Décrire des cartes locales ne change rien à un monde existant ni à la carte locale actuelle de D-17.
  const print=world=>crypto.createHash('sha256').update(JSON.stringify([world.size,world.home,world.roads,world.pois.map(p=>[p.id,p.x,p.y,p.name]),world.towns])).digest('hex');
  const Content=require('../src/world-content.js'),before=[print(Wd.create(17117,4)),print(Wd.create(42,11))],content=JSON.stringify(Content.generate(17117)),frozen=JSON.stringify([R,C.WorldRelief217Rules]);
  for(const seed of SEEDS)L.describe(seed,{frame:256});
  assert.deepEqual([print(Wd.create(17117,4)),print(Wd.create(42,11))],before);assert.equal(JSON.stringify(Content.generate(17117)),content);assert.equal(JSON.stringify([R,C.WorldRelief217Rules]),frozen);
});

test('carte locale 217 : coût — une carte locale se décrit en une fraction de seconde',()=>{
  // Une seule fois par campagne, à la fondation. Temps réel : on garde la meilleure de trois passes.
  const pass=()=>{const times=[];for(const seed of SEEDS){G.forget();const a=process.hrtime.bigint();L.siege(L.describe(seed));times.push(Number(process.hrtime.bigint()-a)/1e6);}times.sort((a,b)=>a-b);return{median:Math.round(times[times.length>>1]*10)/10,max:Math.round(times[times.length-1]*10)/10};};
  let best=pass();for(let k=0;k<2&&best.median>=150;k++){const again=pass();if(again.median<best.median)best=again;}
  console.log('# coût d’une carte locale, canton compris (ms) : '+JSON.stringify(best)+' pour '+R.frame*R.frame+' cases');
  assert.ok(best.median<150,'carte locale trop lente : '+JSON.stringify(best));
});
