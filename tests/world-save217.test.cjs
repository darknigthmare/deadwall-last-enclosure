'use strict';
// Sauvegarde creuse G12 hors jeu (specs/monde-sans-bord/ouverture.md, tranche O3).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),K=require('../src/world-cantons217.js'),O=require('../src/world-open217.js'),S=require('../src/world-sites217.js'),M=require('../src/world-save217.js');
const St=require('../src/frontier-state.js'),Wd=require('../src/frontier-world.js');
const ROOT=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(ROOT,file),'utf8'),R=C.WorldSave217Rules,SEED=17117;
const copy=v=>JSON.parse(JSON.stringify(v));

// Campagne G12 synthétique : 60 cantons traversés plein est depuis D-17, trois lieux repérés par
// canton, un contenant et une voiture vidés, les occupants d'un lieu tués ou blessés, un arbre et
// un rocher abattus tous les cinq cantons ; les cantons de part et d'autre du chemin sont vus.
function walk(world,length=60,offset=0){
 const s=M.initial(world.home),h=K.at(world.home.x,world.home.y),cantons=new Set(s.cantons),out={touched:new Set()};
 for(let k=0;k<length;k++){
  const cx=h.cx+offset+k,cy=h.cy;for(const dy of [-1,0,1])cantons.add(K.id(cx,cy+dy));
  const places=world.placesOf(cx,cy);
  for(const p of places.slice(0,3)){s.seen.push(p.id);out.touched.add(K.id(cx,cy));}
  const p=places[0];if(p){const o=world.plan(p,0).objects.find(q=>q.amount>0);if(o)s.taken[o.id]=o.amount;if(p.parking[0])s.taken[p.parking[0].id]=Math.min(1,p.parking[0].amount);s.notes[p.id]=k%2?'visited':'cleared';}
  const foe=places.find(q=>world.threatCount(q)>0);if(foe){s.seen.includes(foe.id)||s.seen.push(foe.id);const o=world.occupants(foe);s.enemies[o[0].id]=0;s.kills++;if(o[1])s.enemies[o[1].id]=Math.floor(o[1].health/2);out.touched.add(K.id(cx,cy));}
  if(k%5===0){const c=world.chunk(cx*4+1,cy*4+1);if(c.trees[0])s.taken[c.trees[0].id]=c.trees[0].amount;if(c.rocks[0])s.taken[c.rocks[0].id]=1;if(c.trees[0]||c.rocks[0])out.touched.add(K.id(cx,cy));}
 }
 const end=world.placesOf(h.cx+offset+length-1,h.cy)[0]||world.home;
 Object.assign(s,{active:true,x:end.x,y:end.y,a:1.5,anchor:{x:4060,y:2048},distance:length*1024,shots:12,cantons:[...cantons]});
 s.pin=s.seen[s.seen.length-1];return{state:s,data:{worldSeed:SEED,player:{x:4060,y:2048},expeditions:{vehicle:null}},...out};
}
const world=S.create(SEED);
const trip=walk(world);

test('sauvegarde G12 : règles, génération 12 fermée partout, chemin séparé de frontier-state branché mais inactif',()=>{
 assert.ok(Object.isFrozen(R)&&M.RULES===R);assert.equal(R.maxCantons,64);assert.equal(R.open,false);assert.equal(M.opened(),false);
 assert.equal((read('src/core.js').match(/WorldSave217Rules=/g)||[]).length,1);
 const g12=M.normalize(trip.state);
 // Module absent (le jeu) ou présent mais fermé : la génération 12 reste inconnue, comme avant.
 for(const present of [false,true]){
  if(present)globalThis.DeadwallWorldSave217=M;
  try{assert.throws(()=>St.normalize(copy(g12)),/Génération inconnue/);assert.throws(()=>St.validate(copy(g12),trip.data),/Génération inconnue/);
   assert.throws(()=>St.normalize({...St.initial(),generation:12}),/Génération inconnue/);assert.throws(()=>Wd.create(SEED,12),/Version du monde inconnue/);}
  finally{delete globalThis.DeadwallWorldSave217;}
 }
 assert.throws(()=>C.migrateSaveData({version:20,frontier:copy(g12)}));
 // Ouvert (simulé ici seulement) : frontier-state délègue les deux appels au module, rien d'autre.
 const calls=[];globalThis.DeadwallWorldSave217={...M,opened:()=>true,normalize:raw=>{calls.push('n');return M.normalize(raw);},validate:(st,d)=>{calls.push('v');return M.validate(st,d);}};
 try{assert.deepEqual(St.normalize(copy(g12)),g12);assert.deepEqual(St.validate(copy(g12),trip.data),g12);assert.deepEqual(calls,['n','v']);
  // une génération 1 à 11 ne passe jamais par le module, même ouvert.
  assert.deepEqual(St.normalize(St.initial()),St.initial());assert.deepEqual(calls,['n','v']);}
 finally{delete globalThis.DeadwallWorldSave217;}
});

test('sauvegarde G12 : aller-retour après 60 cantons traversés — écarts seuls, taille et plafonds',()=>{
 const s=M.normalize(trip.state),text=JSON.stringify(s),t0=Date.now(),back=M.validate(JSON.parse(text),trip.data),ms=Date.now()-t0,v=M.lastValidation();
 assert.equal(JSON.stringify(back),text,'relue à l’identique, octet pour octet');
 assert.equal(JSON.stringify(M.validate(JSON.parse(JSON.stringify(back)),trip.data)),text,'seconde relecture identique');
 assert.ok(s.cantons.length>=180&&s.seen.length>=120&&Object.keys(s.taken).length>=100&&s.kills>=10,JSON.stringify([s.cantons.length,s.seen.length,Object.keys(s.taken).length,s.kills]));
 assert.equal(v.cited,trip.touched.size);assert.ok(v.cited<=R.maxCantons&&v.formOnly.length===0,'tout est vérifié strictement');
 const bytes=Buffer.byteLength(text);console.log('# G12 60 cantons : '+bytes+' octets, '+s.cantons.length+' cantons vus, '+s.seen.length+' lieux, '+Object.keys(s.taken).length+' prélèvements, '+Object.keys(s.enemies).length+' occupants ; validation '+v.strict.length+' cantons, '+v.generated+' générés, '+ms+' ms');
 assert.ok(bytes<40000,'sauvegarde creuse : '+bytes+' octets');
 // Un canton vu sans y toucher ne pèse que son identifiant.
 const more=copy(s);more.cantons.push('K9_9','K-9_-9');assert.equal(Buffer.byteLength(JSON.stringify(M.normalize(more)))-bytes,Buffer.byteLength(',"K9_9","K-9_-9"'));
 // Plafonds : cantons vus, lieux repérés.
 const full=copy(s),have=new Set(s.cantons);for(let i=0;full.cantons.length<R.maxSeenCantons;i++){const id=K.id(i%100-50,Math.floor(i/100)+20);if(!have.has(id))full.cantons.push(id);}
 M.normalize(full);full.cantons.push('K-500_500');assert.throws(()=>M.normalize(full),/Trop de cantons vus/);
 const many=copy(s);many.seen=Array.from({length:R.maxSeen+1},(_,i)=>K.entityId(0,0,'site',i));assert.throws(()=>M.normalize(many),/Trop de découvertes/);
});

test('sauvegarde G12 : la validation ne génère que les cantons cités, au plus 64, les plus proches du joueur d’abord',()=>{
 M.validate(trip.state,trip.data);const v=M.lastValidation(),home=K.id(0,0);
 assert.deepEqual([...v.strict].sort(),[...trip.touched].sort());
 assert.equal(v.generated,v.strict.length+(trip.touched.has(home)?0:1),'cantons cités, plus le canton de fondation que tout monde G12 charge');
 assert.equal(v.cantons.generated,v.generated);
 // 80 cantons cités : les 64 plus proches du joueur sont régénérés, les 16 autres vérifiés de forme seule.
 const long=walk(world,90);M.validate(long.state,long.data);const w=M.lastValidation(),me=K.at(long.state.x,long.state.y);
 assert.ok(w.cited>64,'cantons cités : '+w.cited);assert.equal(w.strict.length,64);assert.equal(w.formOnly.length,w.cited-64);
 const d=id=>{const p=K.parse(id);return Math.max(Math.abs(p.cx-me.cx),Math.abs(p.cy-me.cy));};
 assert.ok(Math.max(...w.strict.map(d))<=Math.min(...w.formOnly.map(d)));assert.ok(w.generated<=65);
 // Au-delà du plafond, un lieu inventé n'est pas détecté (décision D4, contrôle de forme seul) ; en deçà, il l'est.
 const far=copy(long.state),fake=K.entityId(K.parse(w.formOnly[w.formOnly.length-1]).cx,0,'site',9999);far.seen.push(fake);M.validate(far,long.data);
 const near=copy(long.state);near.seen.push(K.entityId(me.cx,me.cy,'site',9999));if(!near.cantons.includes(K.id(me.cx,me.cy)))near.cantons.push(K.id(me.cx,me.cy));assert.throws(()=>M.validate(near,long.data),/Lieu absent/);
 // Plafond réglable vers le bas seulement (tests) : 0 canton = forme seule.
 M.validate(trip.state,trip.data,{maxCantons:0});assert.equal(M.lastValidation().generated,1);assert.throws(()=>M.validate(trip.state,trip.data,{maxCantons:65}));
});

test('sauvegarde G12 : falsifications refusées',()=>{
 const base=M.normalize(trip.state),seen=base.seen[0],taken=Object.keys(base.taken).find(id=>/:site:\d+:0:/.test(id)),car=Object.keys(base.taken).find(id=>id.includes(':car:')),tree=Object.keys(base.taken).find(id=>id.includes(':arbre:')),rock=Object.keys(base.taken).find(id=>id.includes(':roche:'));
 const dead=Object.keys(base.enemies).find(id=>base.enemies[id]===0),hurt=Object.keys(base.enemies).find(id=>base.enemies[id]>0);
 const foe=world.site(dead.split(':e')[0]),c=K.parseEntity(seen);
 // Lieu candidat du canton qui n'a pas trouvé d'emprise : identifiant bien formé, mais pas un lieu.
 const unfit=world.candidate&&world.canton(c.cx,c.cy).sites.map(q=>q.id).find(id=>!world.site(id));
 const cases={
  'lieu inexistant':s=>{s.seen.push(K.entityId(c.cx,c.cy,'site',999));},
  'candidat sans emprise':s=>{if(unfit)s.seen.push(unfit);else s.seen.push(K.entityId(c.cx,c.cy,'site',998));},
  'prélèvement supérieur':s=>{s.taken[taken]+=1;},
  'contenant inexistant':s=>{s.taken[taken.replace(/:(\d+)$/,':9999')]=1;},
  'voiture inexistante':s=>{s.taken[car.replace(/:car:\d+$/,':car:77')]=1;},
  'étage inexistant':s=>{s.taken[taken.replace(/:0:(\d+)$/,':2:$1')]=1;},
  'arbre inexistant':s=>{const e=M.sceneryOf(tree),have=new Set(world.chunk(e.chunk.cx,e.chunk.cy).trees.map(t=>t.id)),j=Math.floor(e.index/1200);let i=0;while(have.has(K.entityId(e.cx,e.cy,'arbre',j*1200+i)))i++;s.taken[K.entityId(e.cx,e.cy,'arbre',j*1200+i)]=1;},
  'arbre au-delà de sa grille':s=>{s.taken[tree.replace(/:\d+$/,':1199')]=1;},
  'rocher trop pris':s=>{s.taken[rock]=999;},
  'occupant de trop':s=>{s.enemies[foe.id+':e'+world.threatCount(foe)]=1;},
  'occupant trop solide':s=>{s.enemies[hurt]=world.occupants(world.site(hurt.split(':e')[0]))[Number(hurt.split(':e')[1])].health+1;},
  'compteur de morts':s=>{s.kills++;},
  'poursuite d’un mort':s=>{s.tracks[dead]={x:s.x,y:s.y,z:0,a:0,mode:'pursuit',ttl:4,gx:s.x,gy:s.y,cool:0};},
  'poursuite hors niveau':s=>{s.tracks[hurt]={x:s.x,y:s.y,z:world.occupants(world.site(hurt.split(':e')[0]))[Number(hurt.split(':e')[1])].z===0?1:0,a:0,mode:'pursuit',ttl:4,gx:s.x,gy:s.y,cool:0};},
  'lieu G1–G11':s=>{s.seen.push('P0001');},
  'arbre G1–G11':s=>{s.taken.T1_2_3=1;},
  'contact naturel G1–G11':s=>{s.enemies.N165_1_1_0=0;s.kills++;},
  'faune G1–G11':s=>{s.wildlife165.A165_1_1_0={x:1,y:1,a:0,hp:1,alarm:0,stride:0};},
  'canton jamais vu':s=>{s.cantons=s.cantons.filter(id=>id!==K.parseEntity(seen).canton);},
  'canton en double':s=>{s.cantons.push(s.cantons[0]);},
  'canton mal formé':s=>{s.cantons.push('K-0_0');},
  'canton hors adressage':s=>{s.cantons.push('K1048576_0');},
  'lieu hors adressage':s=>{s.seen.push('K1048576_0:site:0');},
  'découverte en double':s=>{s.seen.push(seen);},
  'note sur lieu non repéré':s=>{s.notes[K.entityId(c.cx,c.cy,'site',997)]='todo';},
  'clé inconnue':s=>{s.extra=1;},
  'clé absente':s=>{delete s.cantons;},
  'relief d’une autre version':s=>{s.reliefVersion++;},
  'détail d’une autre version':s=>{s.detailVersion=12;},
  'écologie G1–G11':s=>{s.ecologyVersion=1;},
  'position hors adressage':s=>{s.x=O.LIMITS.axisMax(.32)+1;},
  'position non mesurable':s=>{s.y=NaN;},
  'position dans un canton jamais vu':s=>{s.x+=1024*200;},
  'ancre absente':s=>{s.anchor=null;},
  'voiture désynchronisée':s=>{s.car={id:7,x:s.x+5,y:s.y,a:0,driving:true};},
  'étage sans lieu':s=>{s.z=1;},
 };
 for(const[name,mutate]of Object.entries(cases)){const s=copy(base);mutate(s);assert.throws(()=>M.validate(JSON.parse(JSON.stringify(s,(k,v)=>Number.isNaN(v)?'NaN':v),(k,v)=>v==='NaN'?NaN:v),trip.data),Error,name);}
 // Joueur déplacé dans la cité pendant la sortie ; voiture étrangère à la campagne.
 assert.throws(()=>M.validate(base,{...trip.data,player:{x:10,y:10}}),/Position locale/);
 const withCar=copy(base);withCar.car={id:7,x:base.x,y:base.y,a:0,driving:false};assert.throws(()=>M.validate(withCar,trip.data),/Voiture étrangère/);M.validate(withCar,{...trip.data,expeditions:{vehicle:{id:7}}});
 // Falsification systématique : chaque identifiant cité, rang décalé hors de son canton, est refusé.
 let n=0;for(const id of [...base.seen,...Object.keys(base.taken),...Object.keys(base.enemies)]){const s=copy(base),bump=x=>x.replace(/:(\d+)$/,(m,d)=>{const n=Number(d),slots=/:arbre:/.test(x)?1200:/:roche:/.test(x)?120:0;return':'+(slots?Math.floor(n/slots)*slots+slots-1:n+900);});
  if(s.seen.includes(id)){s.seen[s.seen.indexOf(id)]=bump(id);for(const k of Object.keys(s.notes))if(k===id){s.notes[bump(id)]=s.notes[k];delete s.notes[k];}if(s.pin===id)s.pin=bump(id);}
  else if(id in s.taken){s.taken[bump(id)]=s.taken[id];delete s.taken[id];}
  else{s.enemies[id.replace(/:e(\d+)$/,(m,d)=>':e'+(Number(d)+4))]=s.enemies[id];delete s.enemies[id];}
  assert.throws(()=>M.validate(s,trip.data),Error,id);n++;}
 assert.ok(n>200,'identifiants falsifiés : '+n);
});

test('sauvegarde G12 : refus croisés avec les générations 1 à 11',()=>{
 const old={...St.initial(),version:2};
 assert.throws(()=>St.normalize({...old,seen:['K0_0:site:1']}),/découverte invalide/);
 assert.throws(()=>St.normalize({...old,inside:'K0_0:site:1'}),/Lieu absent/);
 assert.throws(()=>St.normalize({...old,taken:{'K0_0:site:1:0:0':1}}),/Identifiant régional invalide/);
 assert.throws(()=>St.normalize({...old,taken:{'K0_0:arbre:6001':1}}),/Identifiant régional invalide/);
 assert.throws(()=>St.normalize({...old,enemies:{'K0_0:site:1:e0':0}}),/Identifiant régional invalide/);
 assert.throws(()=>St.normalize({...old,notes:{'K0_0:site:1':'todo'}}),/Note invalide/);
 // L'inverse : un registre G12 ne lit aucun identifiant ancien, et un registre ancien n'est pas un registre G12.
 assert.throws(()=>M.normalize(old),/G12 invalide/);assert.throws(()=>M.normalize({...M.initial(world.home),inside:'P0001'}),/Lieu absent/);
 assert.throws(()=>M.normalize({...M.initial(world.home),taken:{'P0001:0:1':1}}),/Identifiant régional invalide/);
 assert.throws(()=>M.normalize({...M.initial(world.home),enemies:{'P0001:e0':0},kills:1}),/Identifiant régional invalide/);
});

test('sauvegarde G12 : carnet de reconnaissance par canton (`K…:cell:n`), carnet dense des générations 1 à 11 inchangé',()=>{
 const A=C.FieldAtlas,s=M.normalize(trip.state),h=world.home,id=M.cell(h.x,h.y),e=K.parseEntity(id);
 assert.equal(e.kind,'cell');assert.equal(e.canton,K.id(K.at(h.x,h.y).cx,K.at(h.x,h.y).cy));assert.ok(e.index<64);
 assert.equal(M.cell(-1,-1),'K-1_-1:cell:63');assert.equal(M.cell(0,0),'K0_0:cell:0');assert.equal(M.cell(1023.9,128),'K0_0:cell:15');assert.equal(M.cell(NaN,0),null);
 const cells=[...new Set(s.cantons.slice(0,40).flatMap(c=>{const p=K.parse(c);return[M.cell(p.cx*1024+5,p.cy*1024+5),M.cell(p.cx*1024+900,p.cy*1024+700)];}))];
 const atlas={...A.initial(),cells};assert.deepEqual(M.normalizeAtlas(copy(atlas),s),{...A.initial(),cells});
 assert.throws(()=>M.normalizeAtlas({...atlas,cells:[...cells,'K700_700:cell:0']},s),/jamais vu/);
 assert.throws(()=>M.normalizeAtlas({...atlas,cells:[...cells,'K0_0:cell:64']},s));assert.throws(()=>M.normalizeAtlas({...atlas,cells:[...cells,cells[0]]},s));
 assert.throws(()=>M.normalizeAtlas({...atlas,cells:[12]},s));assert.throws(()=>M.normalizeAtlas({...atlas,reports:[{id:'P0001',town:'T135_0',at:1}]},s),/indisponibles/);
 // Le carnet dense des générations 1 à 11 refuse un identifiant de canton, comme avant.
 assert.throws(()=>A.normalize({...A.initial(),cells:['K0_0:cell:0']}),/Secteurs parcourus/);assert.equal(A.cell(100,100),A.cell(100,100));assert.equal(A.cell(-1,0),-1);
});

test('sauvegarde G12 : module isolé — absent du jeu, lu par frontier-state seulement, aucun flux des générations 1 à 11',()=>{
 const source=read('src/world-save217.js'),code=source.replace(/\/\/.*$/gm,'');
 assert.ok(!/Math\.random|Date\.now|performance\.|localStorage|document\b|setTimeout|setInterval/.test(code),'module pur');
 assert.deepEqual([...source.matchAll(/require\('([^']+)'\)/g)].map(m=>m[1]),['./core.js','./world-cantons217.js','./world-open217.js','./world-sites217.js','./frontier-geometry.js']);
 assert.ok(!/G\.rng|F\.rng|F\.hash|Geography135|geography141|WorldContent|expansions|W\.create/.test(code),'aucun flux ni monde des générations 1 à 11');
 for(const file of ['index.html','sw.js','scripts/server.mjs','scripts/build.mjs','scripts/public-manifest183.cjs','src/expansion-kit.js','src/expansion-ui.js'])assert.ok(!read(file).includes('world-save217')&&!read(file).includes('WorldSave217'),file);
 for(const file of fs.readdirSync(path.join(ROOT,'src')))if(!['world-save217.js','core.js','frontier-state.js'].includes(file)){const text=read('src/'+file);assert.ok(!text.includes('WorldSave217')&&!text.includes('world-save217'),file+' ne doit pas lire la sauvegarde G12');}
 // frontier-state ne charge pas le module : il ne le lit que s'il est déjà présent, et s'il est ouvert.
 const fs217=read('src/frontier-state.js');assert.ok(!fs217.includes('world-save217'));assert.equal((fs217.match(/DeadwallWorldSave217/g)||[]).length,1);assert.ok(fs217.includes('M&&M.opened()?M:null'));
 const dist=path.join(ROOT,'dist');if(fs.existsSync(dist))assert.ok(!fs.existsSync(path.join(dist,'src','world-save217.js')));
 assert.equal(globalThis.DeadwallWorldSave217,undefined,'aucune globale posée sous Node');
});

test('sauvegarde G12 : validateurs convertis à `siteIndex` / `sitesByDistance`, identiques en région finie',()=>{
 const files={'frontier-state.js':['by=siteIndex217(w)'],'field-atlas-state.js':['by=siteIndex217(w)'],'world-pack131.js':['by=w?siteIndex217(w):null'],'campaign-water214.js':['bySite=siteIndex217(w),descriptors=new Map();','bySite=siteIndex217(w),descriptors=new Map(),sources'],'campaign-pack.js':['pois=siteIndex217(w)'],'context-operations160.js':['by=siteIndex217(world)'],'world-evolution-state.js':['ids=siteIndex217(world)'],'essential-state.js':['pool=sitesByDistance217(w,anchor.x,anchor.y,']};
 const helper='const siteIndex217=w=>w.siteIndex?w.siteIndex():new Map(w.pois.map(p=>[p.id,p]));';
 for(const[file,needles]of Object.entries(files)){const text=read('src/'+file);for(const n of needles)assert.ok(text.includes(n),file+' : '+n);
  if(file!=='essential-state.js')assert.ok(text.includes(helper),file);assert.ok(!/new (Map|Set)\((?!next\.)\w+\.pois\.map\(p=>(\[p\.id,p\]|p\.id)\)\)/.test(text.replace(helper,'')),file+' : plus d’index de toute la liste');}
 const byDistance=Function('return '+read('src/essential-state.js').match(/const sitesByDistance217=(.*?);\nfunction targets/s)[1])(),index=Function('return '+helper.slice('const siteIndex217='.length,-1))();
 for(const[seed,g]of [[17117,4],[17117,8],[42,11]]){
  const w=Wd.create(seed,g),fake={pois:w.pois},anchor={x:w.home?.x??4096,y:w.home?.y??4096};
  for(const v of [w,fake]){const m=index(v),old=new Map(w.pois.map(p=>[p.id,p]));assert.deepEqual([...m.entries()].map(([k,p])=>[k,p===old.get(k)]),[...old.keys()].map(k=>[k,true]));}
  for(const type of [...new Set(w.pois.map(p=>p.type))].slice(0,12)){const filter=p=>p.type===type&&p.id!==w.pois[3].id,old=w.pois.filter(p=>p.type===type&&p.id!==w.pois[3].id).sort((a,b)=>Math.hypot(a.x-anchor.x,a.y-anchor.y)-Math.hypot(b.x-anchor.x,b.y-anchor.y)||a.id.localeCompare(b.id));
   assert.deepEqual(byDistance(w,anchor.x,anchor.y,filter).map(p=>p.id),old.map(p=>p.id));assert.deepEqual(byDistance(fake,anchor.x,anchor.y,filter).map(p=>p.id),old.map(p=>p.id));}
 }
 // Monde sans bord : l'accesseur est lu (la région finie garde le parcours de sa propre liste, même recopiée).
 let asked=null;assert.equal(byDistance({unbounded:true,sitesByDistance:(x,y,f)=>{asked=[x,y,f];return'g12';}},1,2,Boolean),'g12');assert.deepEqual(asked,[1,2,Boolean]);
 // En G12, l'index n'offre que `get` et `has`, et ne lit que le canton cité.
 const ix=world.siteIndex();assert.deepEqual(Object.keys(ix).sort(),['get','has']);
});
