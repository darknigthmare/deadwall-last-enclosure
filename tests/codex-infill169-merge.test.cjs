'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/codex-plan165.js'),R=require('../src/codex3000-runtime.js'),I=require('../src/codex-infill169.js');
test('169 revisions 5/6/7 form ordered append-only layers with independent identities',()=>{
 for(const id of ['DW-0002','DW-0004','DW-0027','DW-0061','DW-0069','DW-0123','DW-0221'])for(const seed of [42,17117]){
  const five=P.inspect(id,seed,0,5,8),six=P.inspect(id,seed,0,6,8),seven=P.inspect(id,seed,0,7,8);
  assert.deepEqual(seven.plan,six.plan);assert.deepEqual(six.plan,five.plan);assert.deepEqual(seven.p,six.p);
  assert.deepEqual(seven.details.fill168,six.details.fill168,'published revision-six decisions changed');
  assert.deepEqual(seven.details.interior.filter(o=>!o.infill169),six.details.interior);
  assert.deepEqual(seven.details.outdoor.filter(o=>!o.infill169),six.details.outdoor);
  assert.equal(six.details.infill169,undefined);assert.equal(five.details.fill168,undefined);
  assert.equal(seven.details.infill169.revision,7);
  assert.equal(new Set([...seven.details.interior,...seven.details.outdoor].map(o=>o.id)).size,seven.details.interior.length+seven.details.outdoor.length);
 }
});
test('169 contracts reject a floor outside the actual parcel, without source mutation',()=>{
 const p=P.inspect('DW-0004',42,0,6,8);const before=JSON.stringify(p);
 assert.throws(()=>R.infill({seed:42,p:p.p,z:99,plan:p.plan,detail:p.details,programme:p.id}),/Contrat/);
 assert.equal(JSON.stringify(p),before);assert.equal(I.RULES.revision,7);
});
