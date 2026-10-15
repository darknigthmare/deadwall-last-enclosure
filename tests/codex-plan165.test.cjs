'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const P=require('../src/codex-plan165.js'),R=require('../src/codex3000-runtime.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
test('165 inspector: uint32 seeds, exact IDs and authored levels reject malformed input',()=>{
 for(const value of [0,42,4294967295,'0',' 17117 ','4294967295'])assert.equal(P.validateSeed(value),Number(value));
 for(const value of ['', '  ','-1','1.5','1e3','0x20',-1,NaN,Infinity,4294967296,{},null,[],true])assert.throws(()=>P.validateSeed(value));
 for(const id of ['DW-9999','DW-0000','DW-1','../DW-0001',null])assert.throws(()=>P.inspect(id,42));
 for(const z of [99,'0',.5,NaN])assert.throws(()=>P.inspect('DW-0501',42,z));
});
test('165 inspector: all 4000 programmes are classified without inventing a generic port, tunnel or district',()=>{
 let enabled=0,unsupported=0;const families=new Set();
 for(const record of R.records){
  const preset=R.preset('codex3000-'+record.id.slice(3));
  if(preset){enabled++;families.add(record.family);}
  else{unsupported++;const p=P.inspect(record.id,42);assert.equal(p.supported,false);assert.equal(p.plan,undefined);assert.equal(p.p,undefined);assert.match(p.reason,/spécialisés/);}
 }
 assert.equal(enabled+unsupported,4000);assert.ok(enabled>1000&&unsupported>0);assert.ok(families.size>15);
 console.log('PREVIEW165 '+JSON.stringify({programmes:4000,recipeCompatible:enabled,unsupported,families:families.size}));
});
test('165 inspector: every supported source family and authored floor remains deterministic and disconnected from saves',()=>{
 const subjects=new Map();for(const r of R.records)if(R.preset('codex3000-'+r.id.slice(3))&&!subjects.has(r.family))subjects.set(r.family,r.id);
 const before=digest(R.records);let floors=0,contents=0,shortfalls=0;
 for(const id of subjects.values())for(const z of R.template(id).levels){
  const p=P.inspect(id,17117,z),a=digest(p),again=P.inspect(id,17117,z);
  assert.equal(a,digest(again));assert.equal(p.supported,true);assert.equal(p.p.id,'preview-'+id);assert.ok(!/^P\d{4}$/.test(p.p.id));
  assert.equal(p.p.x,p.p.w/2);assert.equal(p.p.y,p.p.h/2);assert.deepEqual(p.plan,R.floor(id,17117,z,p.p.id));
  assert.ok(p.details.interior.every(o=>o.amount===undefined&&o.resource===undefined));
  assert.ok(p.details.outdoor.every(o=>o.amount===undefined&&o.resource===undefined));
  assert.equal(p.summary.sourceObjects,p.plan.objects.length);assert.equal(p.summary.solidDetails,p.details.interior.filter(o=>o.solid).length);
  assert.equal(p.summary.adapted,R.template(id).adapted);assert.ok(p.summary.quantityUnplaced>=0);
  contents+=p.summary.anchoredContents;shortfalls+=p.summary.quantityUnplaced;floors++;
 }
 assert.equal(digest(R.records),before);assert.ok(floors>=20&&contents>0&&shortfalls>0);
 console.log('FLOORS165 '+JSON.stringify({families:subjects.size,floors,paintedContents:contents,unplacedRequests:shortfalls}));
});
test('165 inspector: original exterior rooms in simplified shells remain explicitly identified',()=>{
 const p=P.inspect('DW-0001',42);assert.ok(p.summary.exteriorSpacesSimplified.includes('jardin'));
 assert.deepEqual(p.reference,R.template('DW-0001',42).reference);assert.equal(p.summary.adapted,true);
});
test('165 renderer: delegates to existing lot painter with disposable data and restores the canvas after failure',()=>{
 const saved=globalThis.DeadwallFrontierArt;let depth=0,called=0,last;const c={save(){depth++;},restore(){depth--;},clearRect(){},fillRect(){},translate(){},scale(){}};
 const canvas={width:900,height:720,getContext:()=>c},p=P.inspect('DW-0501',42,0),before=digest(p);
 globalThis.DeadwallFrontierArt={lot(ctx,site,view){called++;last=view;assert.strictEqual(ctx,c);assert.strictEqual(site,p.p);assert.strictEqual(view.world.plan(),p.plan);assert.strictEqual(view.world.detailAt(),p.details);assert.equal(view.inside,p.p.id);}};
 try{
  assert.equal(P.render(canvas,p),true);assert.equal(called,1);assert.equal(depth,0);assert.equal(last.world.seed,42);assert.equal(digest(p),before);
  assert.equal(P.render(canvas,P.inspect('DW-0300',42)),false);assert.equal(called,1);
  globalThis.DeadwallFrontierArt={lot(){throw Error('draw failure');}};assert.throws(()=>P.render(canvas,p),/draw failure/);assert.equal(depth,0);
 }finally{if(saved===undefined)delete globalThis.DeadwallFrontierArt;else globalThis.DeadwallFrontierArt=saved;}
});
test('165 inspector: live G8 revision-4 places, stocks and RNG stay unchanged during recipe inspections',()=>{
 const w=W.create(17117,8,{detailVersion:4}),p=w.pois.find(p=>p.type==='house'),plan=w.plan(p,0),detail=w.detailAt(p,0);
 const before=digest([w.pois,w.roads,p,plan,detail]);for(const id of ['DW-0001','DW-0501','DW-1001','DW-3000'])P.inspect(id,42,0);
 assert.equal(digest([w.pois,w.roads,p,w.plan(p,0),w.detailAt(p,0)]),before);
});
