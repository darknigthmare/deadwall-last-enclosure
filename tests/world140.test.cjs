'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const scenario of['barricaded-exit','bus-free-exit'])test('140 HTML monde : '+scenario,()=>{
 const result=spawnSync(process.execPath,['scripts/qa140-world.cjs',scenario],{cwd:root,encoding:'utf8',timeout:45000});assert.equal(result.status,0,result.stderr||result.stdout);const evidence=JSON.parse(result.stdout);assert.equal(evidence.status,'passed');assert.equal(evidence.browser,false);
});
