'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const R=require('../src/road-profiles133.js'),C=require('../src/world-codex.js');
const root=path.resolve(__dirname,'..'),clone=v=>JSON.parse(JSON.stringify(v));
test('routes 1.33 : 51 programmes, 204 formes distinctes et séparation exacte du présent',()=>{
  assert.equal(R.profiles.length,51);assert.equal(R.profiles.flatMap(p=>p.variants).length,204);assert.deepEqual(R.validate(),[]);
  assert.equal(R.profiles.filter(p=>p.generated).length,3);assert.equal(R.profiles.filter(p=>p.status==='plan').length,48);
  for(const p of R.profiles){assert.ok(Object.isFrozen(p.geometry));assert.ok(Object.isFrozen(p.variants));assert.equal(R.profile(p.id),p);if(!p.generated)assert.equal(p.runtime,null);}
  assert.equal(R.profile('absent'),null);assert.equal(new Set(R.profiles.flatMap(p=>p.variants.map(v=>v.id))).size,204);
});
test('routes 1.33 : 2 × 2, 2 × 3 et 2 × 4 sont des voies par sens, hors accotements',()=>{
  for(const n of[2,3,4]){const p=R.profile('road133-motorway-2x'+n);assert.equal(p.geometry.lanes.forward,n);assert.equal(p.geometry.lanes.backward,n);assert.equal(p.geometry.lanes.separated,true);assert.deepEqual(p.geometry.metres,[n*7,n*7]);assert.equal(p.status,'plan');assert.equal(p.geometry.dimension,'carriageway');}
  assert.equal(R.profile('road133-roundabout-rural').geometry.dimension,'outer-diameter');
  assert.equal(R.profile('road133-diamond').geometry.dimension,'envelope');
  assert.equal(R.profile('road133-small-bridge').geometry.lanes.traffic,'shared');
  assert.equal(R.profile('road133-ramp').geometry.lanes.traffic,'one-way');
  assert.equal(R.profile('road133-ramp').variants[3].lanesOverride.forward,2);
});
test('routes 1.33 : les formes dangereuses ne deviennent pas jouables par simple catalogue',()=>{
  for(const id of['diamond','trumpet','cloverleaf','directional','river-bridge','viaduct','twin-tunnel','cut-cover','ford']){const p=R.profile('road133-'+id);assert.equal(p.status,'plan');assert.equal(p.generated,false);}
  for(const p of R.profiles.filter(p=>p.generated)){assert.equal(p.geometry.lanes,null);for(const file of p.runtime.files)assert.ok(fs.existsSync(path.join(root,file)));}
});
test('routes 1.33 : refus des identités, variantes, géométries et promesses corrompues',()=>{
  const one=clone(R.profiles[0]);assert.ok(R.validate([one,one]).length);
  for(const corrupt of[p=>p.generated=false,p=>p.geometry.metres=[7,3],p=>p.geometry.metres=[NaN,7],p=>p.variants[0].id=null,p=>p.variants={},p=>p.sources=['invente'],p=>p.geometry.lanes={forward:2,backward:2,separated:true}]){const p=clone(R.profiles[0]);corrupt(p);assert.ok(R.validate([p]).length);}
  assert.ok(R.validate(null).length);
});
test('routes 1.33 : guide raccordé, recherche sans accents et projets masqués dans le terrain',()=>{
  assert.equal(C.entries.filter(e=>!e.id.startsWith('arm134-')&&!e.id.startsWith('systems134-')&&!require('../src/biomes-codex135.js').some(b=>b.id===e.id)).length,215);assert.equal(C.query({text:'routes',status:'terrain'}).filter(e=>e.id.startsWith('road133-')).length,3);
  for(const word of['autoroute','tunnel','échangeur','giratoire','chemin'])assert.ok(C.query({text:'routes '+word,status:'plan'}).length,word);
  assert.equal(C.query({text:'autoroute 4 voies',status:'plan'}).some(e=>e.id==='road133-motorway-2x4'),true);
  for(const entry of R.entries)assert.equal(C.entries.find(e=>e.id===entry.id),entry);
});
test('routes 1.33 : le chargement navigateur raccorde le même catalogue sans Node ni réseau',()=>{
  const context=vm.createContext({});
  for(const file of['road-profiles133.js','world-codex-activites.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context);
  assert.equal(context.DeadwallRoadProfiles133.entries.length,51);
  assert.equal(context.DeadwallCodexPacks.activites.filter(e=>e.id.startsWith('road133-')).length,51);
});
test('routes 1.33 : intersections de niveaux différents refusées même aux mêmes coordonnées',()=>{
  const a={level:0,width:7,users:['car','truck']},b={level:0,width:7,users:['foot','car']};
  assert.equal(R.connectionCheck(a,b).ok,true);
  assert.equal(R.connectionCheck(a,{...b,level:1}).ok,false);
  assert.equal(R.connectionCheck(a,{...b,width:4}).ok,false);
  assert.equal(R.connectionCheck(a,{...b,width:4,transition:true}).ok,true);
  assert.equal(R.connectionCheck(a,{...b,users:['foot']}).ok,false);
  assert.equal(R.connectionCheck(a,{...b,controlledAccess:true}).ok,false);
  assert.equal(R.connectionCheck({...a,ramp:true},{...b,controlledAccess:true}).ok,true);
  assert.equal(R.connectionCheck({...a,level:NaN},b).ok,false);
});
test('routes 1.33 : dégagement routier tient compte de la canopée, des extrémités et de la largeur',()=>{
  const road={a:{x:0,y:0},b:{x:10,y:0},width:7};
  assert.equal(R.clearanceEnvelope(road,{x:5,y:4,radius:1}).clear,false,'un centre hors chaussée ne suffit pas');
  assert.equal(R.clearanceEnvelope(road,{x:5,y:5,radius:1,margin:.5}).clear,true);
  assert.equal(R.clearanceEnvelope(road,{x:12,y:0,radius:1}).clear,false,'raccord en bout de segment réservé');
  assert.equal(R.clearanceEnvelope(road,{x:20,y:0,radius:1}).clear,true,'pas de droite infinie');
  assert.equal(R.clearanceEnvelope({...road,width:14},{x:5,y:5,radius:1}).clear,false);
  assert.equal(R.clearanceEnvelope({a:road.a,b:road.a,width:7},{x:2,y:1,radius:1}).valid,false);
  assert.equal(R.clearanceEnvelope(road,{x:5,y:2,radius:-1}).valid,false);
});
test('routes 1.33 : le contrôle de capsule résiste aux rotations et translations',()=>{
  const road={a:{x:3,y:9},b:{x:43,y:19},width:8},tree={x:25,y:25,radius:4,margin:.7};
  const expected=R.clearanceEnvelope(road,tree);
  for(const angle of[.1,.9,1.7,3.14]){const point=p=>({x:p.x*Math.cos(angle)-p.y*Math.sin(angle)+500,y:p.x*Math.sin(angle)+p.y*Math.cos(angle)-800});const actual=R.clearanceEnvelope({...road,a:point(road.a),b:point(road.b)},{...tree,...point(tree)});assert.equal(actual.clear,expected.clear);assert.ok(Math.abs(actual.distance-expected.distance)<1e-10);}
});
test('routes 1.33 : probabilités conditionnelles finies ; capacité absente transférée au vide',()=>{
  for(const context of Object.keys(R.spawnProposals))for(let mask=0;mask<8;mask++){
    const proposal=R.conditionalSpawns(context,{validSite:true,returnPath:true,levelGeometry:true,infected:!!(mask&1),allied:!!(mask&2),hostile:!!(mask&4)});
    assert.equal(proposal.status,'design-only');assert.equal(Object.values(proposal.effective).reduce((a,b)=>a+b,0),100);
    for(const kind of['infected','allied','hostile'])assert.ok(proposal.effective[kind]===0||proposal.effective[kind]===proposal.proposal[kind]);
  }
  assert.deepEqual(R.conditionalSpawns('village',{validSite:true,returnPath:true,infected:true}).effective,{empty:66,infected:34,allied:0,hostile:0});
  assert.deepEqual(R.conditionalSpawns('service').effective,{empty:100,infected:0,allied:0,hostile:0});
  assert.equal(R.conditionalSpawns('tunnel',{validSite:true,returnPath:true,infected:true}).effective.infected,0);
  assert.throws(()=>R.conditionalSpawns('inconnu'));
});
test('routes 1.33 : aucun RNG, tick, sauvegarde ou installation de monde dans le catalogue',()=>{
  const context=vm.createContext({Math:Object.assign(Object.create(Math),{random(){throw Error('RNG interdit');}})});
  vm.runInContext(fs.readFileSync(path.join(root,'src/road-profiles133.js'),'utf8'),context);
  assert.equal(context.DeadwallRoadProfiles133.validate().length,0);assert.equal(context.DEADWALL,undefined);
  for(const action of['install','roll','update','serialize','restore'])assert.equal(R[action],undefined);
});
test('routes 1.33 : exports documentaires identiques à la source éditable',()=>{
  const exported=JSON.parse(fs.readFileSync(path.join(root,'docs/codex/ROUTES_PROFILS_1_33.json'),'utf8'));
  assert.deepEqual(exported.profiles,clone(R.profiles));assert.deepEqual(exported.spawnProposals,clone(R.spawnProposals));assert.deepEqual(exported.sources,clone(R.sources));
  const reader=fs.readFileSync(path.join(root,'codex-3000/addendum-1.33/LIRE_ROUTES.html'),'utf8');assert.ok(reader.includes('id="route-data"'));assert.ok(!reader.includes('<script src='));
  const embedded=JSON.parse(reader.match(/<script type="application\/json" id="route-data">([\s\S]*?)<\/script>/)[1]);assert.deepEqual(embedded.entries,clone(R.entries));
});
test('routes 1.33 : les 1 051 originaux historiques restent byte pour byte intacts',()=>{
  const base=path.join(root,'codex-3000'),manifest=JSON.parse(fs.readFileSync(path.join(base,'ORIGINAUX_SHA256.json'),'utf8'));
  assert.equal(Object.keys(manifest).length,1051);
  for(const[file,hash]of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex'),hash,file);
});
