'use strict';
// Monde sans bord, tranche T1 : les accesseurs de limite rendent, pour les générations 1 à 11,
// exactement les comparaisons historiques à `size` et la recherche historique `pois.find`.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),W=require('../src/frontier-world.js');
const src=name=>fs.readFileSync(path.join(__dirname,'..','src',name),'utf8');

// Anciennes formules, recopiées telles qu'elles étaient écrites aux sites d'appel.
const old={
 outside:(size,x,y,pad)=>x<pad||y<pad||x>size-pad||y>size-pad,
 outsideOpen:(size,x,y,pad)=>x<=pad||y<=pad||x>=size-pad||y>=size-pad,
 contains:(size,x,y)=>x>=0&&y>=0&&x<=size&&y<=size,
 clamp:(size,v,pad)=>Math.min(size-pad,Math.max(pad,v)),
 chunks:(size,chunk)=>Math.ceil(size/chunk)};
function lcg(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const PADS=[0,.32,1,2,2.5,45,C.FrontierRules?.footRadius??.32,.1+.2];

function points(size,count,seed){const r=lcg(seed),out=[];
 const edges=[0,-0,size,-1e-9,1e-9,size-1e-9,size+1e-9,.32,size-.32,1,size-1,2,size-2,45,size-45,-1,size+1,size/2,NaN,Infinity,-Infinity,Number.MAX_VALUE,-Number.MAX_VALUE,Number.EPSILON,size-Number.EPSILON];
 for(const x of edges)for(const y of edges)out.push([x,y]);
 while(out.length<count){const kind=r();let x,y;
  if(kind<.55){x=r()*size;y=r()*size;}
  else if(kind<.8){x=(r()-.25)*size*2;y=(r()-.25)*size*2;}
  else{const near=()=>{const pad=PADS[Math.floor(r()*PADS.length)],base=r()<.5?pad:size-pad;return base+(r()-.5)*(r()<.5?1e-9:4);};x=near();y=r()<.5?near():r()*size;}
  out.push([x,y]);}
 return out;}

test('limites217 : 10 000 points par taille, bords compris, anciens calculs contre accesseurs',()=>{
 for(const size of[8192,24576]){const L=W.limits(size),list=points(size,10000,size^0x217);assert.ok(list.length>=10000);
  let inside=0,out=0;
  for(const[x,y]of list){
   assert.equal(L.contains(x,y),old.contains(size,x,y),'contains '+x+','+y);
   for(const pad of PADS){
    const a=L.outside(x,y,pad),b=old.outside(size,x,y,pad);assert.equal(a,b,'outside '+x+','+y+','+pad);if(b)out++;else inside++;
    assert.equal(L.outsideOpen(x,y,pad),old.outsideOpen(size,x,y,pad),'outsideOpen '+x+','+y+','+pad);
    const q=L.clampInside(x,y,pad);assert.ok(Object.is(q.x,old.clamp(size,x,pad))&&Object.is(q.y,old.clamp(size,y,pad)),'clampInside '+x+','+y+','+pad);}
   // marge omise = marge nulle, comme `x<0||x>size`
   assert.equal(L.outside(x,y),x<0||y<0||x>size||y>size);assert.equal(L.outsideOpen(x,y),x<=0||y<=0||x>=size||y>=size);}
  assert.ok(inside>20000&&out>20000,'échantillon des deux côtés du bord');}
});

test('limites217 : NaN, bord exact et forme positive gardent leur sens historique',()=>{
 const L=W.limits(24576);
 // les formes en « || » laissent passer un NaN, la forme en « && » le refuse : les deux sont conservées.
 assert.equal(L.outside(NaN,5,2),false);assert.equal(L.outsideOpen(NaN,5,2),false);assert.equal(L.contains(NaN,5),false);
 assert.equal(L.outside(0,0,0),false);assert.equal(L.outside(24576,24576,0),false);assert.equal(L.outsideOpen(0,10,0),true);assert.equal(L.outsideOpen(10,24576,0),true);
 assert.equal(L.outside(.32,.32,.32),false);assert.equal(L.outsideOpen(.32,.32,.32),true);assert.equal(L.outside(24576-.32,10,.32),false);
 assert.equal(L.contains(0,24576),true);assert.equal(L.contains(-1e-12,0),false);
 assert.deepEqual(L.clampInside(-5,30000,2),{x:2,y:24574});assert.ok(Number.isNaN(L.clampInside(NaN,1,0).x));
});

test('limites217 : étendue, plage de morceaux et taille par génération inchangées',()=>{
 assert.equal(C.WorldStreamRules131.size,24576);assert.equal(W.RULES.size,8192);assert.equal(C.AtlasRules.regionSize,8192);
 for(let g=1;g<=11;g++){const size=g>=5?24576:8192,L=W.limitsForGeneration(g);
  assert.equal(W.sizeForGeneration(g),size);assert.equal(L,W.limits(size),'même objet gelé par taille');
  assert.deepEqual(L.extent(),{x:0,y:0,w:size,h:size,minX:0,minY:0,maxX:size,maxY:size,bounded:true});assert.ok(Object.isFrozen(L.extent())&&Object.isFrozen(L));
  for(const chunk of[256,C.BiomePopulation165Rules.chunk,C.FieldAtlas?.RULES?.cell||128,1024,1000]){const r=L.chunkRange(chunk);
   assert.equal(r.count,old.chunks(size,chunk));assert.equal(r.max,old.chunks(size,chunk)-1);assert.equal(r.min,0);assert.equal(L.chunkRange(chunk),r);}
  assert.equal(L.chunkRange().max,size/256-1);}
 assert.equal(W.limitsForGeneration(undefined),W.limits(W.sizeForGeneration(undefined)));
});

test('limites217 : mondes réels G4 et G11, accesseurs du monde et lieux par identifiant',()=>{
 for(const[seed,generation]of[[17117,4],[42,8],[17117,11]]){
  const w=W.create(seed,generation),size=W.sizeForGeneration(generation),L=W.limits(size);
  assert.equal(w.size,size);assert.deepEqual(w.bounds,{x:0,y:0,w:size,h:size});
  for(const k of['outside','outsideOpen','contains','clampInside','extent','chunkRange'])assert.equal(w[k],L[k],k);
  assert.equal(w.extent().w,w.size);assert.equal(w.chunkRange(256).count,size/256);
  // identifiants uniques : `site` rend donc le même objet que la recherche linéaire historique.
  assert.equal(new Set(w.pois.map(p=>p.id)).size,w.pois.length);assert.ok(w.pois.length>100);
  for(const p of w.pois)assert.equal(w.site(p.id),p);
  for(const id of['P9999x','','P','p0001',' P0001','P0001 ',undefined,null,0,1,NaN,{},'toString','__proto__','constructor'])
   assert.equal(w.site(id),w.pois.find(p=>p.id===id),'identifiant étranger '+String(id));
  // une copie par étalement garde les accesseurs (aucun n'utilise `this`).
  const copy={...w};assert.equal(copy.site(w.pois[7].id),w.pois[7]);assert.equal(copy.outside(-1,0,0),true);
  // le monde lui-même juge ses bords comme avant.
  assert.equal(w.blocked(-1,10,.32),true);assert.equal(w.blocked(10,size+1,.32),true);
  assert.deepEqual(w.chunk(-1,0),{cx:-1,cy:0,trees:[],rocks:[]});assert.deepEqual(w.chunk(size/256,0),{cx:size/256,cy:0,trees:[],rocks:[]});
 }
});

test('limites217 : `site` suit une liste de lieux modifiée après coup',()=>{
 const w=W.create(17117,4),first=w.pois[0],extra={...w.pois[1],id:'P9998'};
 assert.equal(w.site('P9998'),undefined);w.pois.push(extra);assert.equal(w.site('P9998'),extra);
 w.pois.pop();assert.equal(w.site('P9998'),undefined);assert.equal(w.site(first.id),first);
 const removed=w.pois.shift();assert.equal(w.site(removed.id),undefined);assert.equal(w.site(w.pois[0].id),w.pois[0]);w.pois.unshift(removed);assert.equal(w.site(removed.id),removed);
});

const HELPERS={
 site:"const siteOf217=(w,id)=>w.site?w.site(id):w.pois.find(p=>p.id===id);",
 outside:"const outside217=(w,x,y,pad)=>w.outside?w.outside(x,y,pad):x<pad||y<pad||x>w.size-pad||y>w.size-pad;",
 outsideOpen:"const outsideOpen217=(w,x,y,pad)=>w.outsideOpen?w.outsideOpen(x,y,pad):x<=pad||y<=pad||x>=w.size-pad||y>=w.size-pad;",
 inside:"const inside217=(w,x,y)=>w.contains?w.contains(x,y):x>=0&&y>=0&&x<=w.size&&y<=w.size;",
 chunks:"const chunks217=(w,chunk)=>w.chunkRange?w.chunkRange(chunk).count:Math.ceil(w.size/chunk);",
 span:"const span217=w=>w.extent?w.extent().w:w.size;"};
const USERS={
 'frontier.js':['site','outsideOpen'],'world-evolution.js':['site','outside'],'biome-population165.js':['outside','chunks'],'wildlife189.js':['outside','outsideOpen','chunks'],
 'biome-forage193.js':['outside'],'atlas-view.js':['site','inside','span'],'atlas-render.js':['span','outside'],'barricades134.js':['site'],'campaign-pack.js':['site'],
 'campaign-services208.js':['site'],'campaign-water-supports214.js':['site'],'companions-pack.js':['site'],'context-operations160.js':['site'],'essential-state.js':['site'],
 'exploration-pack131.js':['site'],'field-atlas.js':['site'],'frontier-care.js':['site'],'frontier-logistics.js':['site'],'interventions134.js':['site'],'night-gear.js':['site'],
 'succession133.js':['site'],'world-pack131.js':['site']};

test('limites217 : chaque fichier converti lit l’accesseur, avec un repli identique à l’ancien calcul',()=>{
 for(const[name,helpers]of Object.entries(USERS)){const text=src(name);
  for(const h of helpers){assert.equal(text.split(HELPERS[h]).length-1,1,name+' : repli '+h);
   const call=HELPERS[h].match(/^const (\w+)=/)[1];assert.ok(text.split(call+'(').length-1>=1,name+' : '+call+' lu');}
  // plus aucune recherche linéaire d'un lieu par identifiant hors du repli
  if(helpers.includes('site'))assert.equal((text.match(/pois\??\.find\(/g)||[]).length,1,name+' : une seule recherche linéaire, celle du repli');}
 assert.equal((src('frontier-world.js').match(/pois\.find\(/g)||[]).length,2,'frontier-world : seulement dans siteById');
 assert.ok(!/world\.size\|\|8192/.test(src('atlas-render.js')));
});

test('limites217 : les replis valent les accesseurs sur un monde factice et sur un monde réel',()=>{
 const make=name=>Function('return ('+HELPERS[name].replace(/^const \w+=/,'').replace(/;$/,'')+')')();
 const f=Object.fromEntries(Object.keys(HELPERS).map(k=>[k,make(k)]));
 for(const size of[8192,24576]){const pois=[{id:'P0001'},{id:'P0002'}],bare={size,pois},full={size,pois,...W.limits(size),site:id=>pois.find(p=>p.id===id)};
  for(const[x,y]of points(size,2500,size^7)){
   for(const pad of[0,.32,2,45]){assert.equal(f.outside(bare,x,y,pad),f.outside(full,x,y,pad));assert.equal(f.outsideOpen(bare,x,y,pad),f.outsideOpen(full,x,y,pad));}
   assert.equal(f.inside(bare,x,y),f.inside(full,x,y));}
  for(const chunk of[256,C.BiomePopulation165Rules.chunk])assert.equal(f.chunks(bare,chunk),f.chunks(full,chunk));
  assert.equal(f.span(bare),f.span(full));assert.equal(f.site(bare,'P0002'),f.site(full,'P0002'));assert.equal(f.site(bare,'P0003'),f.site(full,'P0003'));}
});

test('limites217 : sites laissés en l’état (équivalence non évidente) toujours présents',()=>{
 // notés dans specs/monde-sans-bord/tasks.md : ces lignes ne doivent pas être converties sans décision.
 assert.ok(src('frontier.js').includes('x>world().size-R.footRadius||y>world().size-R.footRadius'));
 assert.ok(src('atlas-view.js').includes('q.x<=view().world.size&&q.y<=view().world.size'));
 assert.ok(src('field-atlas-state.js').includes('x>=24576||y>=24576'));
 assert.ok(src('succession133.js').includes('||24576'));assert.ok(src('companions-pack.js').includes('||8192):24576'));
 assert.ok(src('world-stream131.js').includes('old=8192'));
});
