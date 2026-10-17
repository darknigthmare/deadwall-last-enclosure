'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{spawnSync}=require('node:child_process');
const workflow=fs.readFileSync('.github/workflows/vertical-network180.yml','utf8');
const job=name=>{const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=workflow.match(new RegExp('^  '+escaped+':\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9-]*:|$(?![\\s\\S]))','m'));assert.ok(match,'job '+name);return match[1];};
test('188 vertical workflow retains focused native contracts and every actual browser revision',()=>{
 const focused=job('focused');
 assert.ok(focused.includes('tests/vertical-*.test.cjs'));
 for(const name of ['core','urban-night','power-grid','expeditions','expansion-kit'])assert.ok(focused.includes('tests/'+name+'.test.cjs'));
 assert.ok(focused.includes('for rev in 175 176 177 178 179 180; do'));
 assert.ok(focused.includes('|| fail=1'));assert.ok(focused.includes('exit "$fail"'));
});
test('188 vertical full checks use the same exhaustive partitioner and endurance as main CI',()=>{
 const shard=job('native-shard'),native=job('native'),main=fs.readFileSync('.github/workflows/ci.yml','utf8');
 assert.ok(shard.includes('fail-fast: false'));assert.ok(shard.includes('shard: [1, 2, 3, 4, 5, 6]'));assert.ok(shard.includes("DEADWALL_SOAK: '1'"));
 const run='node scripts/ci-native186.mjs run ${{ matrix.shard }} artifacts/qa/native186';assert.ok(shard.includes(run)&&main.includes(run));
 const aggregate='node scripts/ci-native186.mjs aggregate artifacts/native186-input artifacts/qa/native186/aggregate.json';assert.ok(native.includes(aggregate)&&main.includes(aggregate));
 assert.ok(native.includes('needs: [native-shard]'));assert.ok(native.includes('if(process.env.SHARD_RESULT !== "success") process.exit(1)'));
 assert.ok(native.includes('pattern: deadwall-native186-shard-*'));assert.ok(shard.includes('name: deadwall-native186-shard-${{ matrix.shard }}'));
 assert.ok(!workflow.includes('continue-on-error'));assert.ok(!workflow.includes('--test-name-pattern'));
});
test('188 original network180 gate requires focused and complete native results, never partial success',()=>{
 const gate=job('network180');assert.ok(gate.includes('needs: [focused, native]'));assert.ok(gate.includes('always()'));
 const script=gate.match(/node -e '([^']+)'/)[1];
 const code=results=>spawnSync(process.execPath,['-e',script],{env:{...process.env,REQUIRED_JOB_RESULTS:JSON.stringify(results)},encoding:'utf8'}).status;
 assert.equal(code({focused:{result:'success'},native:{result:'success'}}),0);
 for(const key of ['focused','native'])for(const result of ['failure','cancelled','skipped',null])assert.notEqual(code({focused:{result:'success'},native:{result:'success'},[key]:{result}}),0);
 assert.notEqual(code({}),0);
});
