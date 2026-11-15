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
  for(const k of['outside','outsideOpen','contains','clampInside','extent','chunkRange','axisMin','axisMax'])assert.equal(w[k],L[k],k);
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
 span:"const span217=w=>w.extent?w.extent().w:w.size;",
 near:"const sitesNear217=(w,x,y,radius)=>w.sitesNear?w.sitesNear(x,y,radius):w.pois;",
 listed:"const listed217=(w,p)=>w.site?w.site(p.id)===p:w.pois.includes(p);",
 byId:"const sitesById217=(w,id)=>w.site?(p=>p?[p]:[])(w.site(id)):w.pois.filter(p=>p.id===id);",
 limitsOf:"const limitsOf217=(W,g,size)=>W&&W.limitsForGeneration?W.limitsForGeneration(g):(s=>({axisMin:(pad=0)=>pad,axisMax:(pad=0)=>s-pad}))(size());"};
const USERS={
 'frontier.js':['site','outsideOpen','outside'],'world-evolution.js':['site','outside'],'biome-population165.js':['outside','chunks'],'wildlife189.js':['outside','outsideOpen','chunks'],
 'biome-forage193.js':['outside'],'atlas-view.js':['site','inside','span','near'],'atlas-render.js':['span','outside'],'barricades134.js':['site'],'campaign-pack.js':['site'],
 'campaign-services208.js':['site','listed'],'campaign-water-supports214.js':['site','listed'],'companions-pack.js':['site','limitsOf'],'context-operations160.js':['site'],'essential-state.js':['site','limitsOf'],
 'exploration-pack131.js':['site'],'field-atlas.js':['site'],'frontier-care.js':['site'],'frontier-logistics.js':['site'],'interventions134.js':['site'],'night-gear.js':['site','limitsOf'],
 'succession133.js':['site','limitsOf'],'world-pack131.js':['site','span'],
 'frontier-state.js':['limitsOf'],'survival-pack.js':['limitsOf'],'husbandry191.js':['limitsOf'],'world-evolution-state.js':['limitsOf'],'frontier-art.js':['byId']};

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

const helper=name=>Function('return ('+HELPERS[name].replace(/^const \w+=/,'').replace(/;$/,'')+')')();
const count=(text,needle)=>text.split(needle).length-1;

test('limites217 : sites à lecture paresseuse convertis sans avancer la création de la région',()=>{
 // `world()` crée la région à la demande ; `view()` peut la demander aussi. Les précomparaisons restent en tête :
 // l'accesseur n'est lu qu'au moment où l'ancienne expression lisait `world().size` pour la première fois.
 const f=src('frontier.js'),a=src('atlas-view.js');
 assert.equal(count(f,'x<R.footRadius||y<R.footRadius||outside217(world(),x,y,R.footRadius)))return true;'),1);
 assert.ok(!f.includes('world().size'));
 assert.equal(count(a,'q.x>=0&&q.y>=0&&inside217(view().world,q.x,q.y)? '),1);assert.ok(!a.includes('view().world.size'));
 // même résultat, et le monde n'est pas demandé quand une précomparaison tranche.
 const outside=helper('outside'),inside=helper('inside');
 for(const size of[8192,24576]){const w={size,...W.limits(size)};let reads=0;const world=()=>{reads++;return w;},fr=C.FrontierRules?.footRadius??.32;
  for(const[x,y]of points(size,4000,size^0x51)){
   reads=0;const now=x<fr||y<fr||outside(world(),x,y,fr),was=x<fr||y<fr||x>size-fr||y>size-fr;assert.equal(now,was);assert.equal(reads,x<fr||y<fr?0:1);
   reads=0;const hover=x>=0&&y>=0&&inside(world(),x,y),before=x>=0&&y>=0&&x<=size&&y<=size;assert.equal(hover,before);assert.equal(reads,x>=0&&y>=0?1:0);}}
});

test('limites217 : bornes d’axe des validateurs, identiques à `pad` et `size - pad`',()=>{
 const pads=[undefined,0,.32,3,40,C.Husbandry191Rules.penSize];
 for(const size of[8192,24576]){const L=W.limits(size),r=lcg(size^0x99);
  for(const pad of pads){const p=pad===undefined?0:pad;assert.ok(Object.is(L.axisMin(pad),p));assert.ok(Object.is(L.axisMax(pad),size-p));}
  // la garde historique `!Number.isFinite(v)||v<lo||v>hi` rend le même verdict avec les bornes lues par l'accesseur.
  const edges=[NaN,Infinity,-Infinity,-1e-9,0,.31,.32,.3200001,2.9999,3,40,size-40,size-3,size-.32,size-.31,size,size+1e-9];
  for(let i=0;i<10000;i++){const v=i<edges.length?edges[i]:(r()-.1)*size*1.2;
   for(const pad of[0,.32,3,40]){const old=!Number.isFinite(v)||v<pad||v>size-pad,now=!Number.isFinite(v)||v<L.axisMin(pad)||v>L.axisMax(pad);assert.equal(now,old);
    assert.equal(v>L.axisMax(pad),v>size-pad);}}}
});

test('limites217 : repli des validateurs — module du monde complet, réduit à `sizeForGeneration`, ou absent',()=>{
 const limitsOf=helper('limitsOf'),fake={sizeForGeneration:g=>g>=5?24576:8192};
 for(const g of[undefined,1,2,3,4,5,6,7,8,9,10,11]){let thunks=0;const size=()=>{thunks++;return fake.sizeForGeneration(g);};
  const real=limitsOf(W,g,size);assert.equal(real,W.limitsForGeneration(g));assert.equal(thunks,0,'accesseur présent : ancien calcul non évalué');
  const bare=limitsOf(fake,g,size);assert.equal(thunks,1,'repli : ancien calcul évalué une fois, tout de suite');
  for(const pad of[undefined,0,.32,3,40,96]){assert.ok(Object.is(bare.axisMin(pad),real.axisMin(pad)));assert.ok(Object.is(bare.axisMax(pad),real.axisMax(pad)));}
  assert.equal(thunks,1);}
 // module absent : succession133 retombe sur 24 576, companions-pack sur 8 192 (avec sauvegarde) ou 24 576 (sans).
 assert.equal(limitsOf(undefined,5,()=>undefined?.sizeForGeneration(5)||24576).axisMax(),24576);
 assert.equal(limitsOf(null,undefined,()=>24576).axisMax(),24576);assert.equal(limitsOf(undefined,3,()=>8192).axisMax(.32),8192-.32);
 // un module réduit qui lève continue de lever au même endroit.
 assert.throws(()=>limitsOf(null,5,()=>null.sizeForGeneration(5)),TypeError);
 for(const name of['frontier-state.js','essential-state.js','night-gear.js','survival-pack.js','succession133.js','husbandry191.js','world-evolution-state.js','companions-pack.js']){const text=src(name);
  assert.ok(!/regionSize|size-\.32|size-40|size-3\b|,0,bound\)/.test(text),name+' : plus de borne calculée sur place');
  assert.ok(count(text,'L217.axisMax(')>=2,name+' : bornes lues par l’accesseur');}
});

test('limites217 : registre régional, bornes de position inchangées pour les générations 1 à 11',()=>{
 const FS=require('../src/frontier-state.js');
 const raw=(g,more)=>({...FS.initial(),generation:g,...(g>=7?{ecologyVersion:1}:{}),...(g>=8?{hydrologyVersion:1}:{}),...more});
 const ok=v=>{try{FS.normalize(v);return true;}catch(e){assert.equal(e.message,'Valeur régionale invalide.');return false;}};
 for(let g=1;g<=11;g++){const size=g>=5?24576:8192;
  for(const[v,expected]of[[.32,true],[.31,false],[.32-1e-12,false],[size-.32,true],[size-.32+1e-9,false],[size,false],[NaN,false],[Infinity,false],[-1,false],[size/2,true]]){
   assert.equal(ok(raw(g,{x:v})),expected,'x G'+g+' '+v);assert.equal(ok(raw(g,{y:v})),expected,'y G'+g+' '+v);}
  for(const[v,expected]of[[3,true],[2.999,false],[size-3,true],[size-2.999,false],[NaN,false]]){
   assert.equal(ok(raw(g,{car:{id:1,x:v,y:size/2,a:0,driving:false}})),expected,'voiture x G'+g+' '+v);assert.equal(ok(raw(g,{car:{id:1,x:size/2,y:v,a:0,driving:false}})),expected,'voiture y G'+g+' '+v);}}
});

test('limites217 : constantes 8192 / 24576 nommées, valeurs et schémas historiques inchangés',()=>{
 // une seule ligne de déclaration par fichier porte encore le nombre en clair.
 const literals=name=>(src(name).match(/\b(24576|8192)\b/g)||[]).length;
 assert.equal(literals('field-atlas-state.js'),3);assert.ok(src('field-atlas-state.js').includes('const INDEX_BLOCK_217=8192,INDEX_SPAN_217=24576,OLD_REGION_217=8192;'));
 assert.equal(literals('world-stream131.js'),1);assert.ok(src('world-stream131.js').includes('OLD_REGION_131=8192'));
 assert.equal(literals('frontier-world.js'),2);assert.ok(src('frontier-world.js').includes('const OLD_REGION=8192,WIDE_REGION=24576;'));
 assert.equal(literals('world-pack131.js'),1);assert.equal(literals('succession133.js'),1);assert.ok(src('succession133.js').includes('const WIDE_REGION_217=24576;'));
 assert.equal(literals('companions-pack.js'),2);assert.ok(src('companions-pack.js').includes('const OLD_REGION_217=8192,WIDE_REGION_217=24576;'));
 // l'index des cellules parcourues reste la grille 3 × 3 blocs de 8 192 m, quelle que soit la génération.
 const A=require('../src/field-atlas-state.js'),cellSize=C.FieldAtlas.RULES.cell;
 const old=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=24576||y>=24576)return -1;const sx=Math.floor(x/8192),sy=Math.floor(y/8192);return(sy*3+sx)*4096+Math.floor((y%8192)/cellSize)*64+Math.floor((x%8192)/cellSize);};
 for(const[x,y]of points(24576,10000,0x3a3))assert.equal(C.FieldAtlas.cell(x,y),old(x,y));
 for(const v of[0,8191.999,8192,16383.999,16384,24575.999,24576])assert.equal(A.cell(v,v),old(v,v));
 // l'ancienne région garde ses agglomérations historiques dans une région élargie.
 const w5=W.create(17117,5),inOld=w5.pois.find(p=>p.x<8192&&p.y<8192),far=w5.pois.find(p=>p.x>=8192||p.y>=8192);
 assert.ok(W.TOWNS.some(t=>t.id===A.district(inOld,w5).id));assert.ok(far&&A.district(far,w5));
 assert.equal(W.RULES.size,8192);assert.equal(W.sizeForGeneration(4),8192);assert.equal(W.sizeForGeneration(5),24576);
});

test('limites217 : `sitesNear` rend le voisinage dans l’ordre de la liste, sans rien retirer aux lecteurs convertis',()=>{
 const G=require('../src/frontier-geometry.js'),near217=helper('near'),listed=helper('listed'),byId=helper('byId');
 for(const[seed,generation,effects]of[[17117,4,{}],[42,8,{ecologyVersion:1,hydrologyVersion:1}],[17117,11,{detailVersion:13,ecologyVersion:1,hydrologyVersion:1}]]){
  const w=W.create(seed,generation,effects),r=lcg(seed^generation^0x4e),order=new Map(w.pois.map((p,i)=>[p,i]));let picked=0,counted=0;
  assert.ok(w.pois.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.a)&&p.w>0&&p.h>0));
  for(let i=0;i<260;i++){const anchor=w.pois[Math.floor(r()*w.pois.length)],spread=[0,3,20,90,700][i%5];
   const x=i%13===12?r()*w.size:anchor.x+(r()-.5)*spread*2,y=i%13===12?r()*w.size:anchor.y+(r()-.5)*spread*2;
   for(const radius of[0,.5,8,40,160,600,2500]){const near=w.sitesNear(x,y,radius);
    for(let k=1;k<near.length;k++)assert.ok(order.get(near[k-1])<order.get(near[k]),'ordre de la liste');
    // fiche de graine : lieux dont le centre est à `radius` au plus (critère d'origine réappliqué).
    const centre=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&Math.hypot(p.x-x,p.y-y)<=radius;
    const before=w.pois.filter(centre),after=near.filter(centre);assert.equal(after.length,before.length);for(let k=0;k<before.length;k++)assert.equal(after[k],before[k]);counted+=before.length;
    // atlas : rectangle local élargi de `radius`, lu dans 1,5 × radius.
    const hit=p=>{const l=G.local(p,x,y);return l.x>=-radius&&l.y>=-radius&&l.x<=p.w+radius&&l.y<=p.h+radius;};
    const seen=p=>order.get(p)%3!==1,was=w.pois.filter(seen).filter(hit),now=w.sitesNear(x,y,radius*1.5).filter(seen).filter(hit);
    assert.equal(now.length,was.length);for(let k=0;k<was.length;k++)assert.equal(now[k],was[k]);
    assert.equal(w.sitesNear(x,y,radius*1.5).filter(seen).find(hit),w.pois.filter(seen).find(hit));picked+=was.length;}}
  assert.ok(picked>500&&counted>2000,'voisinages non vides : '+picked+', '+counted);
  // point ou rayon non mesurable : rien n'est retiré, le critère de l'appelant tranche comme avant.
  assert.equal(w.sitesNear(NaN,10,50).length,w.pois.length);assert.equal(w.sitesNear(10,10,NaN).length,w.pois.length);assert.equal(w.sitesNear(w.size/2,w.size/2,Infinity).length,w.pois.length);
  assert.ok(w.sitesNear(-5000,-5000,10).length===0);
  // repli d'un monde sans accesseur : toute la liste, comme avant.
  const bare={pois:w.pois};assert.equal(near217(bare,1,2,3),w.pois);assert.deepEqual(near217(w,w.pois[0].x,w.pois[0].y,5),w.sitesNear(w.pois[0].x,w.pois[0].y,5));
  // appartenance et lecture par identifiant : mêmes réponses que `includes` et `filter` (identifiants uniques).
  for(const p of w.pois){assert.equal(listed(w,p),true);assert.equal(listed(bare,p),true);}
  for(const stranger of[{...w.pois[3]},{id:'P9999'},{id:undefined},{}]){assert.equal(listed(w,stranger),w.pois.includes(stranger));assert.equal(listed(bare,stranger),false);}
  for(const id of[w.pois[0].id,w.pois.at(-1).id,'P9999',null,undefined,'',0]){const was=w.pois.filter(p=>p.id===id);assert.deepEqual(byId(w,id),was);assert.deepEqual(byId(bare,id),was);assert.equal(byId(w,id)[0],was[0]);}
  // la liste modifiée après coup est suivie.
  const extra={...w.pois[1],id:'P9998',x:-5000,y:-5000};w.pois.push(extra);assert.deepEqual(w.sitesNear(-5000,-5000,10),[extra]);assert.equal(listed(w,extra),true);w.pois.pop();assert.equal(w.sitesNear(-5000,-5000,10).length,0);assert.equal(listed(w,extra),false);}
});

test('limites217 : lecteurs de voisinage convertis, plus aucun parcours complet à ces endroits',()=>{
 const a=src('atlas-view.js');assert.equal(count(a,'sitesNear217(v.world,w.x,w.y,radius*1.5).filter(p=>v.seen.includes(p.id)).find(p=>{const l=G.local(p,w.x,w.y);return l.x>=-radius&&l.y>=-radius&&l.x<=p.w+radius&&l.y<=p.h+radius})'),1);assert.ok(!a.includes('world.pois.filter('));
 const s=src('seed-card217.js');assert.equal(count(s,'for(const p of (world?.sitesNear?world.sitesNear(home.x,home.y,RULES.placeRadius):world?.pois)||[])if(finite(p?.x)&&finite(p?.y)&&Math.hypot(p.x-home.x,p.y-home.y)<=RULES.placeRadius)places++;'),1);
 assert.equal(count(src('frontier-art.js'),'pois.filter('),1);assert.equal(count(src('frontier-art.js'),'sitesById217(v.world,v.inside)'),1);
 for(const name of['campaign-services208.js','campaign-water-supports214.js'])assert.equal(count(src(name),'pois.includes('),1,name+' : seulement dans le repli');
});
