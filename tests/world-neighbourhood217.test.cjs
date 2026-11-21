'use strict';
// Monde sans bord, tranche O4 : accesseurs de voisinage (`sitesIn`, `seenSites`, `nearestSite`,
// `sitesByDistance`, `siteIndex`) posés sur les deux mondes. Sur la région finie (G1–G11), ils rendent
// exactement les anciens parcours de toute la liste, ordre compris ; sur le monde G12 hors jeu, ils
// répondent par cantons sans liste globale. Les lecteurs convertis donnent les mêmes sorties qu'avec
// leur repli historique (monde privé des accesseurs O4).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),W=require('../src/frontier-world.js');
const src=name=>fs.readFileSync(path.join(__dirname,'..','src',name),'utf8');
const O4=['sitesIn','seenSites','nearestSite','sitesByDistance','siteIndex'];
function lcg(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
// Monde privé des accesseurs O4 : chaque lecteur converti y reprend son parcours historique de `pois`.
const legacy=w=>{const o={...w};for(const k of O4)delete o[k];return o;};
const worlds=new Map();
const world=(seed,g)=>{const key=seed+':'+g;if(!worlds.has(key))worlds.set(key,W.create(seed,g));return worlds.get(key);};
const CASES=[[17117,4],[17117,8],[17117,11],[42,4],[42,8],[42,11]];

// Anciens parcours, recopiés tels qu'ils étaient écrits aux sites d'appel.
const old={
 inView:(w,v)=>w.pois.filter(p=>!(p.x+p.w<v.left||p.x-p.w>v.right||p.y+p.h<v.top||p.y-p.h>v.bottom)),
 seen:(w,list)=>w.pois.filter(p=>list.includes(p.id)),
 nearest:(w,x,y,type)=>{let best=null;for(const p of w.pois){if(p?.type!==type||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const d=Math.hypot(p.x-x,p.y-y);if(!best||d<best.distance)best={p,distance:d};}return best?.p||null;},
 sorted:(w,x,y,keep)=>w.pois.filter(keep).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.id.localeCompare(b.id)),
 index:w=>new Map(w.pois.map(p=>[p.id,p]))};

test('O4 : région finie, accesseurs identiques aux anciens parcours (G4, G8, G11, deux graines, ordre compris)',()=>{
 for(const[seed,g]of CASES){
  const w=world(seed,g),r=lcg(seed^g^0x04),size=w.size,types=[...new Set(w.pois.map(p=>p.type))];
  for(const k of O4)assert.equal(typeof w[k],'function',k);
  // Rectangles : caméras d'atlas au hasard, rectangles dégénérés, hors région, NaN.
  const rects=[{left:0,top:0,right:size,bottom:size},{left:-50,top:-50,right:-1,bottom:-1},{left:NaN,top:0,right:size,bottom:size},{left:size/2,top:size/2,right:size/2,bottom:size/2}];
  for(let i=0;i<300;i++){const x=(r()*1.2-.1)*size,y=(r()*1.2-.1)*size,s=r()<.5?r()*400:r()*6000;rects.push({left:x,top:y,right:x+s*(.5+r()),bottom:y+s*(.5+r())});}
  for(const v of rects){const a=w.sitesIn(v),b=old.inView(w,v);assert.equal(a.length,b.length);assert.ok(a.every((p,i)=>p===b[i]),'sitesIn '+seed+'/'+g);}
  // Lieux vus : sous-ensembles au hasard, identifiants inconnus, doublons, liste et ensemble.
  for(let i=0;i<40;i++){const list=w.pois.filter(()=>r()<.08).map(p=>p.id).sort(()=>r()-.5);list.push('P9999','nope',list[0]);
   const b=old.seen(w,list);for(const a of[w.seenSites(list),w.seenSites(new Set(list))]){assert.equal(a.length,b.length);assert.ok(a.every((p,i)=>p===b[i]),'seenSites');}}
  assert.deepEqual(w.seenSites([]),[]);
  // Plus proche lieu d'un type : depuis D-17 et depuis des points au hasard, premier minimum de la liste.
  const points=[w.home,{x:0,y:0},{x:size,y:size}];for(let i=0;i<25;i++)points.push({x:r()*size,y:r()*size});
  for(const q of points)for(const type of[...types,'absent']){
   const keep=p=>p?.type===type&&Number.isFinite(p.x)&&Number.isFinite(p.y);
   assert.equal(w.nearestSite(q.x,q.y,keep),old.nearest(w,q.x,q.y,type),'nearestSite '+type);
   const a=w.sitesByDistance(q.x,q.y,p=>p.type===type),b=old.sorted(w,q.x,q.y,p=>p.type===type);
   assert.equal(a.length,b.length);assert.ok(a.every((p,i)=>p===b[i]),'sitesByDistance '+type);
  }
  // Rayon maximal : un lieu au-delà est écarté, en deçà gardé.
  const q=w.home,near=w.sitesByDistance(q.x,q.y,()=>true,3000);
  assert.ok(near.length&&near.every(p=>Math.hypot(p.x-q.x,p.y-q.y)<=3000));
  assert.equal(near.length,w.pois.filter(p=>Math.hypot(p.x-q.x,p.y-q.y)<=3000).length);
  // Index : mêmes clés, même ordre, mêmes lieux ; neuf à chaque appel (un appelant peut le garder).
  const ia=w.siteIndex(),ib=old.index(w);assert.deepEqual([...ia.keys()],[...ib.keys()]);assert.ok([...ia].every(([k,p])=>ib.get(k)===p));
  assert.notEqual(w.siteIndex(),ia);
  // Chaque lieu est dans l'étendue : la lecture par cantons de `sitesIn` ne perd aucun lieu.
  const e=w.extent();assert.ok(w.pois.every(p=>p.x>=e.minX&&p.x<=e.maxX&&p.y>=e.minY&&p.y<=e.maxY));
 }
});

test('O4 : index et doublons — le dernier doublon gagne dans siteIndex, comme new Map(pois.map(…))',()=>{
 const w=W.create(17117,4),first=w.pois[0],extra={...w.pois[1],id:first.id};
 w.pois.push(extra);
 try{assert.equal(w.siteIndex().get(first.id),extra);assert.equal(w.site(first.id),first);
  assert.deepEqual(w.seenSites([first.id]),[first,extra]);}
 finally{w.pois.pop();}
 assert.equal(w.siteIndex().get(first.id),first);
});

test('O4 : lecteurs convertis — mêmes sorties qu\'avec leur repli historique',()=>{
 const Rk=require('../src/remarkable217.js'),Card=require('../src/seed-card217.js'),X=require('../src/world-codex-actions159.js');
 for(const[seed,g]of CASES){
  const w=world(seed,g),l=legacy(w);
  // Lieux remarquables : sélection par cantons (sitesIn) contre le parcours de toute la liste.
  const a=Rk.select(w),b=Rk.select(l);assert.deepEqual(a,b,'remarkable '+seed+'/'+g);
  if(g>=8)assert.ok(a.length>0);
  // Fiche de graine : exploitations les plus proches (nearestSite) et tout le reste de la fiche.
  const nodes=[];
  assert.deepEqual(JSON.parse(JSON.stringify(Card.describe({seed,world:w,nodes}))),JSON.parse(JSON.stringify(Card.describe({seed,world:l,nodes}))));
  // Codex : lieux connus d'un programme et programmes connus (seenSites).
  const r=lcg(seed+g),seen=w.pois.filter(()=>r()<.2).map(p=>p.id);
  const game=world=>({frontier:{discoveries:()=>seen,world:()=>world}});
  assert.deepEqual(X.knownProgrammes(game(w)),X.knownProgrammes(game(l)));
  for(const id of X.knownProgrammes(game(w)).slice(0,12))assert.deepEqual(X.knownPlaces(game(w),'programme-'+id),X.knownPlaces(game(l),'programme-'+id));
 }
 // Monde factice sans accesseur ni liste : aucun lieu, comme avant.
 assert.deepEqual(Rk.select({seed:1}),[]);assert.deepEqual(Rk.select(null),[]);
});

test('O4 : monde G12 hors jeu, accesseurs par cantons sans liste globale',()=>{
 const O=require('../src/world-open217.js'),K=require('../src/world-cantons217.js'),R=C.WorldOpen217Rules;
 const w=O.create(17117),r=lcg(0x12);
 for(const k of O4)assert.equal(typeof w[k],'function',k);
 assert.equal(w.pois,undefined);
 // Calcul exhaustif sur 7 × 7 cantons autour de l'origine.
 const all=[];for(let cy=-3;cy<=3;cy++)for(let cx=-3;cx<=3;cx++)all.push(...w.canton(cx,cy).sites);
 const span=K.SIZE*1.5;
 for(let i=0;i<60;i++){
  const x=(r()-.5)*span*2,y=(r()-.5)*span*2,s=r()*R.nearMaxRadius,v={left:x-s/2,top:y-s/2,right:x+s/2,bottom:y+s/2};
  const a=w.sitesIn(v),b=all.filter(p=>p.x>=v.left&&p.x<=v.right&&p.y>=v.top&&p.y<=v.bottom);
  assert.deepEqual(a.map(p=>p.id).sort(),b.map(p=>p.id).sort());
  // Plus proche lieu : contre le minimum exhaustif (rayon de 1 500 m, tout entier dans la zone calculée).
  const biome=all[Math.floor(r()*all.length)].biome,keep=p=>p.biome===biome;
  const n=w.nearestSite(x,y,keep,1500),ref=all.filter(keep).map(p=>({p,d:Math.hypot(p.x-x,p.y-y)})).filter(e=>e.d<=1500).sort((p,q)=>p.d-q.d)[0];
  assert.equal(n?.id,ref?.p.id);
  const list=w.sitesByDistance(x,y,keep,1500),refList=all.filter(p=>keep(p)&&Math.hypot(p.x-x,p.y-y)<=1500).sort((p,q)=>Math.hypot(p.x-x,p.y-y)-Math.hypot(q.x-x,q.y-y)||p.id.localeCompare(q.id));
  assert.deepEqual(list.map(p=>p.id),refList.map(p=>p.id));
 }
 // Lieux vus : ordre des identifiants donnés, doublons et inconnus écartés ; index paresseux get/has.
 const ids=[all[5].id,all[2].id,all[5].id,'K0_0:site:999','P0001',all[40].id];
 assert.deepEqual(w.seenSites(ids).map(p=>p.id),[all[5].id,all[2].id,all[40].id]);
 const index=w.siteIndex();assert.ok(Object.isFrozen(index));assert.deepEqual(index.get(all[7].id),all[7]);assert.equal(index.has(all[7].id),true);assert.equal(index.has('P0001'),false);
 assert.equal(index.size,undefined);
 // Refus : rectangle trop grand ou non mesurable, rayon trop grand.
 assert.throws(()=>w.sitesIn({left:0,top:0,right:2*R.nearMaxRadius+1,bottom:10}));
 assert.throws(()=>w.sitesIn({left:NaN,top:0,right:1,bottom:1}));assert.throws(()=>w.sitesIn(null));
 assert.throws(()=>w.nearestSite(0,0,()=>true,R.nearMaxRadius+1));assert.throws(()=>w.sitesByDistance(0,0,()=>true,R.nearMaxRadius+1));
 assert.equal(w.nearestSite(NaN,0,()=>true),null);assert.equal(w.nearestSite(0,0,()=>false),null);
 // La recherche par anneaux s'arrête tôt : un lieu du canton d'origine ne charge pas les cantons lointains.
 const fresh=O.create(42),home=fresh.home,before=fresh.streamStats().generated;
 assert.ok(fresh.nearestSite(home.x,home.y,()=>true));assert.ok(fresh.streamStats().generated-before<=9);
 // Lecteurs convertis : aucun ne lit `pois` sur le monde G12.
 const guard=new Proxy(w,{get(t,k){if(k==='pois'||k==='roads'||k==='size')throw Error('lecture globale '+String(k));return t[k];}});
 const Rk=require('../src/remarkable217.js'),Card=require('../src/seed-card217.js'),X=require('../src/world-codex-actions159.js');
 assert.deepEqual(Rk.select(guard),[]);
 const game={frontier:{discoveries:()=>ids,world:()=>guard}};
 assert.deepEqual(X.knownProgrammes(game),[]);assert.deepEqual(X.knownPlaces(game,'programme-DW-0001'),[]);
 assert.equal(guard.nearestSite(home.x,home.y,p=>p?.type==='quarry'),null);
 void Card;
});

test('O4 : sites d\'appel convertis, repli historique seulement sans accesseur',()=>{
 const checks={
  'remarkable217.js':[/world\.sitesIn\(\{left:cx\*S/],
  'seed-card217.js':[/world\.nearestSite\(home\.x,home\.y,wanted\)/],
  'atlas-render.js':[/seenSites217\(v\.world,seen\)\.map/,/for\(const p of sitesIn217\(v\.world,view\)\)/,/for\(const p of seenSites217\(v\.world,seen\)\)/],
  'field-atlas.js':[/sitesByDistance217\(g\.frontier\.world\(\)/,/for\(const p of seenSites217\(w,seen\)\)/,/candidates=seenSites217\(w,seen\)/],
  'field-atlas-ui.js':[/w\.seenSites\?w\.seenSites\(f\.seen\)/],
  'frontier-ui.js':[/v\.world\.seenSites\?v\.world\.seenSites\(v\.seen\)/],
  'world-codex-actions159.js':[/seenSites217\(frontier\.world\(\),known\)\.filter/,/new Set\(seenSites217\(frontier\.world\(\),known\)/],
  'campaign-pack.js':[/ids=seenSites217\(w,seen\)/],
  'frontier.js':[/const known=siteIndex217\(world\(\)\)/],
  'exploration-needs217.js':[/region\.siteIndex\(\)/],
  'urban.js':[/byId=typeof world\.siteIndex==='function'\?world\.siteIndex\(\)/],
  'outposts217.js':[/b=\{by:typeof w\.siteIndex==='function'\?w\.siteIndex\(\)/]};
 for(const[file,list]of Object.entries(checks)){const text=src(file);for(const re of list)assert.match(text,re,file);}
 // Les accesseurs restent hors des modules hors jeu : world-open217.js n'est lu par aucun fichier de src/,
 // sauf world-sites217.js (tranche O2), qui l'enveloppe, et world-save217.js (tranche O3), qui le lit ; tous deux hors jeu.
 for(const file of fs.readdirSync(path.join(__dirname,'..','src')).filter(f=>f.endsWith('.js')&&f!=='world-open217.js'&&f!=='world-sites217.js'&&f!=='world-save217.js'))
  assert.doesNotMatch(src(file),/require\([^)]*world-open217|DeadwallWorldOpen217/,file);
});
