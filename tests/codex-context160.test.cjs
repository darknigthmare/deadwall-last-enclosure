'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=require('../src/codex3000-runtime.js'),D=require('../src/codex3000-live-data.js'),X=require('../src/codex-context160.js');
const repo=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(repo,'codex-3000/addendum-1.60/CONTRATS.json'),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));

test('160 contracts: exactly the frozen626 exclusions receive their historical identity, not an unrelated replacement',()=>{
 const expected='98406f09cccc33595dfbe557dd94d5780353a71323cb29781fdd6665a301c7bf';
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(X.ids)).digest('hex'),expected);
 assert.equal(X.ids.length,626);assert.equal(new Set(X.ids).size,626);assert.equal(X.records.length,626);
 assert.equal(X.records.filter(record=>record.profile).length,300);assert.equal(X.records.filter(record=>!record.profile).length,326);
 for(const contract of X.records){const original=R.get(contract.id);
  assert.equal(contract.name,original.name);assert.equal(contract.parent,original.parent);assert.equal(contract.family,original.family);assert.equal(contract.module,original.module||null);assert.equal(contract.state,original.state||null);
  assert.equal(X.preset(X.typeFor(contract.id)).codex,contract.id);assert.equal(X.programmeFor(X.typeFor(contract.id)),contract.id);
  assert.equal(contract.status,'contract','A lookup alone cannot claim a physically qualified programme');
 }
});

test('160 geometry contracts: specialised300 retain real author minima, while326 existing interiors retain their historical geometry',()=>{
 for(const contract of X.records){const old=R.template(contract.id),special=!!contract.profile;
  assert.deepEqual([contract.w,contract.h],special?old.reference.min:[old.w,old.h],contract.id);
  assert.deepEqual(contract.levels,special?old.reference.levels:old.levels);assert.deepEqual(contract.reference,old.reference);
  const preset=X.preset(X.typeFor(contract.id));assert.deepEqual(preset.entry,[contract.w/2,-1]);assert.deepEqual(preset.exit,[contract.w/2,contract.h+1]);
  assert.deepEqual(contract.parentRooms,old.rooms);assert.ok(Object.isFrozen(contract));assert.ok(Object.isFrozen(contract.parentRooms));assert.ok(Object.isFrozen(contract.parentRooms[0]));
 }
 assert.deepEqual([X.get('DW-0265').w,X.get('DW-0265').h],[100,25],'The road bridge is not compacted into78m');
 assert.deepEqual([X.get('DW-0473').w,X.get('DW-0473').h],[250,200],'A dense city district is not a78×75m hall');
});

test('160 lookup: unknown or malformed identities cannot create a place, consume randomness, alter author data or enter a historical type namespace',()=>{
 const before=JSON.stringify(D),oldRandom=Math.random,oldClock=Date.now;
 Math.random=()=>assert.fail('Pure contract lookup consumed randomness');Date.now=()=>assert.fail('Pure contract lookup used wall time');
 try{
  for(const id of [null,undefined,261,'261','DW-261','DW-0001','DW-3001','DW-4000','__proto__']){assert.equal(X.get(id),null);assert.equal(X.typeFor(id),null);}
  for(const type of ['codex3000-0265','codex160-265','codex160-3001','house','__proto__',null])assert.equal(X.preset(type),null);
  for(const id of X.ids){assert.strictEqual(X.get(id),X.get(id));assert.strictEqual(X.preset(X.typeFor(id)),X.preset(X.typeFor(id)));}
 }finally{Math.random=oldRandom;Date.now=oldClock;}
 assert.equal(JSON.stringify(D),before,'Resolving contracts preserves shared author data');
});

test('160 compiler: missing coverage, forged originals and unowned operations are refused before producing a replacement',async()=>{
 const {validateManifest,compileData,renderModule}=await import('../scripts/compile-codex-context160.mjs');
 assert.equal(validateManifest(manifest),manifest);
 assert.equal(renderModule(compileData(manifest)),fs.readFileSync(path.join(repo,'src/codex-context160-data.js'),'utf8'));
 for(const [mutate,error]of [
  [m=>m.ids.pop(),/626 identifiants/],
  [m=>{m.ids[0]='DW-0001';m.ids.sort();},/identifiants figés/],
  [m=>{delete m.specialParents['DW-0265'];},/100 parents/],
  [m=>{delete m.contexts.port;},/11 contextes/],
  [m=>{m.specialParents['DW-0265'].name='Fake renamed bridge';},/historique dupliquée/],
  [m=>{m.specialParents['DW-0265'].geometry.operationCandidates=['freeTrain'];},/opération du profil/],
  [m=>{m.contexts.port.operations=['freeFuel'];},/opération de contexte/]
 ]){const broken=clone(manifest);mutate(broken);assert.throws(()=>compileData(broken),error);}
});
