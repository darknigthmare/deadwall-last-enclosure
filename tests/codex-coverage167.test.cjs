'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const R=require('../src/codex3000-runtime.js'),P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
test('167 coverage: all 3000 programmes expose ten independent evidence axes and exact source counts',()=>{
 const before=hash(R.records);let rooms=0,props=0;
 for(const rec of R.records){const s=C.source(rec.id),d=R.describe(rec.id);
  assert.equal(s.axes.length,10);assert.equal(new Set(s.axes.map(a=>a.key)).size,10);assert.ok(s.axes.every(a=>C.LABELS[a.key]&&C.STATUS[a.status]));
  assert.equal(s.id,rec.id);assert.equal(s.parent,rec.parent);assert.equal(s.totals.rooms,d.rooms.length);assert.equal(s.totals.furniture,d.rooms.reduce((n,r)=>n+r.authoredProps.length,0));
  assert.equal(s.contextCompatible,s.recipeAvailable&&R.enabled(rec,{townKind:'grande-ville'}));
  assert.equal(s.axes.find(a=>a.key==='representation').status,'uninspected');
  assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.sourceGaps));rooms+=s.totals.rooms;props+=s.totals.furniture;
 }
 assert.equal(rooms,13680);assert.equal(props,18117);assert.equal(hash(R.records),before);assert.ok(C.cacheSize()<=64);
});
test('167 coverage: inherited variants are never counted as independent parent architecture',()=>{
 const c=C.catalogue();assert.equal(c.programmes,3000);assert.equal(c.parents,1000);assert.equal(c.families.length,33);
 assert.equal(c.distinctParentSourceRooms,4560);assert.equal(c.distinctParentFurnitureReferences,6039);
 assert.equal(c.inspectable+c.requiresSystem,3000);assert.equal(c.recipeTemplates,2700);assert.equal(c.inspectable,2374);
 assert.equal(c.families.reduce((n,f)=>n+f.programmes,0),3000);assert.equal(c.families.reduce((n,f)=>n+f.parents,0),1000);
 console.log('COVERAGE167 '+JSON.stringify({programmes:c.programmes,parents:c.parents,families:c.families.length,inspectable:c.inspectable,requiresSystem:c.requiresSystem}));
});
test('167 comparison: every supported source family and level preserves recipe, stocks and deterministic results',()=>{
 const ids=new Map();for(const r of R.records)if(C.source(r.id).contextCompatible&&!ids.has(r.family))ids.set(r.family,r.id);
 let levels=0,shortfalls=0,exteriors=0;
 for(const id of ids.values())for(const z of R.template(id).levels){const p=P.inspect(id,17117,z),before=hash(p),out=C.compare(p);
  assert.equal(hash(p),before);assert.deepEqual(out,C.compare(p));assert.equal(out.floor,z);assert.equal(out.totals.newLootRecords,0);
  const assigned=out.rooms.flatMap(r=>r.props.flatMap(s=>s.objectIds));assert.equal(new Set(assigned).size,assigned.length,'same object credited twice');
  for(const r of out.rooms)for(const s of r.props){assert.equal(s.represented,s.objectIds.length);assert.ok(s.exactFootprintMatches<=s.represented);if(r.exterior)assert.equal(s.represented,0,'interior prop attributed to a garden');}
  assert.ok(out.layers.every(l=>Number.isInteger(l.refused)&&l.refused>=0));
  levels++;shortfalls+=out.totals.furnitureBelowMinimum;exteriors+=out.totals.exteriorSimplifications;
 }
 assert.ok(levels>=20&&shortfalls>0&&exteriors>0);console.log('MODELS167 '+JSON.stringify({families:ids.size,levels,shortfalls,exteriors}));
});
test('167 comparison: a source garden inside the historical shell remains an explicit architecture gap',()=>{
 const r=C.compare(P.inspect('DW-0001',42));const garden=r.rooms.find(r=>r.exterior&&r.name==='jardin');assert.ok(garden);
 assert.equal(garden.status,'exterior-simplified-inside-shell');assert.ok(garden.props.every(p=>p.represented===0));assert.ok(r.issues.some(i=>i.reason==='exterior-simplified-inside-shell'));
 const no=C.compare(P.inspect('DW-0300',42));assert.equal(no.scope,'unsupported');assert.equal(no.rooms.length,0);
});
test('167 counts: allocate scarce objects to minimum requirements before optional surplus, without duplicates',()=>{
 const original=globalThis.DeadwallCodex3000Runtime;
 const specs=[{nom:'Facultatif',asset:'shelf',quantite_par_espace:[0,2],gabarit_m:{longueur:1,largeur:.5,hauteur:2}},{nom:'Nécessaire',asset:'shelf',quantite_par_espace:[3,3],gabarit_m:{longueur:1,largeur:.5,hauteur:2}}];
 const room={id:'r',name:'Réserve',kit:{id:'storage'},exterior:false,levels:[0],authoredProps:specs};
 globalThis.DeadwallCodex3000Runtime={get:()=>({id:'DW-0001',parent:'DW-0001',name:'Test',family:'habitat'}),describe:()=>({rooms:[room],access:[],gardenOptions:[],exteriorOptions:[]}),template:()=>({w:10,h:10,levels:[0],reference:{},adapted:false}),preset:()=>({}),enabled:()=>true};
 C.clear();try{
  const p={id:'DW-0001',supported:true,z:0,seed:42,p:{levels:[0],outdoor:[]},plan:{rooms:[{name:'Réserve',x:0,y:0,w:10,h:10}],objects:Array.from({length:3},(_,i)=>({id:'o'+i,kind:'shelf',x:i+1,y:1,w:1,h:.5}))},details:{interior:[],outdoor:[]}};
  const a=C.compare(p).rooms[0].props;assert.equal(a[0].represented,0);assert.equal(a[1].represented,3);assert.equal(a[1].belowMinimum,0);
 }finally{globalThis.DeadwallCodex3000Runtime=original;C.clear();}
});
test('167 safety: invalid IDs and floors fail closed; cache eviction never changes a result',()=>{
 for(const bad of [null,'DW-0','DW-0000','DW-9999','../DW-0001'])assert.throws(()=>C.source(bad));
 assert.throws(()=>C.compare({}));assert.throws(()=>C.compare({...P.inspect('DW-0001',42),z:55}));
 const a=C.source('DW-0001');for(let i=2;i<80;i++)C.source('DW-'+String(i).padStart(4,'0'));assert.ok(C.cacheSize()<=64);assert.deepEqual(C.source('DW-0001'),a);
});
