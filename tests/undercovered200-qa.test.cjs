'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('200 source-native fixtures never inherit the distributed browser root',()=>{
 const source=fs.readFileSync('.github/workflows/quality199.yml','utf8').replace(/\r\n/g,'\n');
 assert.doesNotMatch(source.split('    steps:')[0],/DEADWALL_QA_ROOT/);
 assert.match(source,/node --test[^\n]*tests\/survival140\.test\.cjs/,'the failed historical contract is retained');
 for(const script of ['browser-quality199.mjs','browser-husbandry191.mjs']){
  const fragment=source.split('      - ').find(step=>step.includes('run: node scripts/'+script));
  assert.ok(fragment);assert.ok(fragment.includes('env:\n          DEADWALL_QA_ROOT: ${{ github.workspace }}/dist\n'));
 }
 const care=fs.readFileSync('scripts/browser-care200.mjs','utf8');
 assert.ok(care.includes('report.base=base;'));assert.ok(care.includes("location.search===''&&DEADWALL.playerMenus194?.mode==='player'"));
});
