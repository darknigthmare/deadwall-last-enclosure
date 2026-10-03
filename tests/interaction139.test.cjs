'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
for(const scenario of['harvest','deposit','build','expedition'])test('139 HTML : ACTION attend la recharge — '+scenario,()=>{
 const result=spawnSync(process.execPath,['scripts/qa139-interaction.cjs',scenario],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:45000});
 assert.equal(result.status,0,result.stderr||result.stdout);const evidence=JSON.parse(result.stdout);assert.equal(evidence.status,'passed');assert.equal(evidence.browser,false);assert.equal(evidence.saveRoundTrip,true);
});
