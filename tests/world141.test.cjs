'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),B=require('../src/biomes135.js'),W=require('../src/frontier-world.js'),crypto=require('node:crypto');
const worlds=new Map(),world=(seed=17117)=>{if(!worlds.has(seed))worlds.set(seed,W.create(seed,7));return worlds.get(seed);};
const fingerprint=w=>crypto.createHash('sha256').update(JSON.stringify({home:w.home,roads:w.roads,pois:w.pois,towns:w.towns,sectors:w.sectors})).digest('hex');
test('G7 : chaque agglomération possède ses vrais services locaux, sans récompense de consultation',()=>{
 for(const seed of[0,42,17117,84329,903145]){const w=world(seed);assert.equal(w.towns.length,34);assert.equal(new Set(w.pois.map(p=>p.type)).size,G.PRESETS.length);const before=fingerprint(w);for(const t of w.towns){const programme=t.program141;assert.deepEqual(programme.required,C.WorldTownRules141.required[t.kind]);assert.equal(programme.complete,true,t.id);for(const role of programme.required){const p=w.pois.find(p=>p.id===programme.services[role]);assert.ok(p,t.id+' '+role);assert.equal(p.town,t.id);assert.equal(p.program141.role,role);assert.ok(C.WorldTownRules141.services[role].includes(p.type));assert.ok(Math.hypot(p.x-t.x,p.y-t.y)<=t.radius+60);assert.ok(w.plan(p,0).objects.length>0);}}assert.equal(fingerprint(w),before);}
});
test('G7 : habitat, centre et activité donnent des programmes distincts aux villes',()=>{
 const w=world();for(const t of w.towns){const sites=w.pois.filter(p=>p.town===t.id);assert.ok(sites.some(p=>p.zone==='habitat'),t.id+' logement');assert.ok(sites.some(p=>p.zone==='centre'),t.id+' services');assert.ok(sites.some(p=>p.zone==='activite'),t.id+' maintenance');assert.equal(t.program141.parcels,sites.length);}assert.ok(w.pois.filter(p=>p.program141.role==='food').length>=34);
});
test('G7 : les sites isolés et extractions suivent le biome de la parcelle réelle',()=>{
 for(const w of[world(),world(84329)])for(const p of w.pois){const profile=B.sample(w.seed,p.x,p.y,false,{generation:7});assert.equal(p.biome,profile.id);if(!p.town||['mine','quarry','sawmill','marketgarden'].includes(p.type))assert.ok(Object.hasOwn(B.buildingPool(profile.id),p.type),p.id+' '+p.type+' '+profile.id);}
});
test('G7 : chaussées complètes et dessertes ne coupent aucune parcelle',()=>{
 const w=world();for(const p of w.pois){assert.equal(p.generation,7);assert.ok(w.nearestRoad(p.drive.a).d<.05,p.id);for(const r of w.roads){const pad=r.width/2;assert.equal(G.segmentRect(G.local(p,r.a.x,r.a.y),G.local(p,r.b.x,r.b.y),{x:-pad,y:-pad,w:p.w+pad*2,h:p.h+pad*2}),false,p.id+' '+r.id);}const d=p.drive,mx=(d.a.x+d.b.x)/2,my=(d.a.y+d.b.y)/2,reach=Math.hypot(d.b.x-d.a.x,d.b.y-d.a.y)/2+d.width/2;for(const q of w.nearPOI(mx,my,reach))if(q!==p){const box=q.reserve;assert.equal(G.segmentRect(d.a,d.b,{x:box.l-d.width/2,y:box.t-d.width/2,w:box.r-box.l+d.width,h:box.b-box.t+d.width}),false,p.id+' accès '+q.id);}}
});
test('G7 : même graine reproduite, autre graine transforme position et programme',()=>{
 const w=world(),copy=W.create(w.seed,7);assert.equal(fingerprint(copy),fingerprint(w));assert.notEqual(fingerprint(w),fingerprint(world(84329)));assert.notDeepEqual(w.home,world(84329).home);assert.notDeepEqual(w.towns.map(t=>[t.x,t.y,t.program141.services]),world(84329).towns.map(t=>[t.x,t.y,t.program141.services]));
});
