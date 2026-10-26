'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('187 furniture contracts retain both exhaustive commands and allow the measured job to finish',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../.github/workflows/codex-fill168.yml'),'utf8');
 const contracts=text.split('  contracts:\n')[1]?.split('  browser:\n')[0];assert.ok(contracts,'the contract job remains present');
 assert.match(contracts,/timeout-minutes: 75\n/);
 assert.ok(contracts.includes('node --test --test-concurrency=1 tests/codex*.test.cjs tests/distribution.test.cjs 2>&1 | tee artifacts/qa/fill168-contracts/contracts.log'));
 assert.match(contracts,/run: node scripts\/audit-fill168\.mjs\n/);
 assert.match(contracts,/git diff --exit-code/);assert.match(contracts,/if-no-files-found: error/);
 assert.doesNotMatch(contracts,/continue-on-error|DEADWALL_QA_PROFILES|--test-name-pattern|--test-only|--smoke|\|\| true/);
});
