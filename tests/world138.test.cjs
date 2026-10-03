'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const scenario of ['bus-seam','truck-seam','bus-north','bus-west','bus-south','bus-g5','bus-g6','bus-doors','truck-doors','destroyed','district'])test('138 accès et conduite régionale : '+scenario,()=>{
 const result=spawnSync(process.execPath,['scripts/qa138-world.cjs',scenario],{cwd:root,encoding:'utf8',timeout:45000});
 assert.equal(result.status,0,result.stderr||result.stdout);const evidence=JSON.parse(result.stdout);assert.equal(evidence.status,'passed');assert.equal(evidence.browser,false);
 if(['bus-seam','truck-seam','bus-north','bus-west','bus-south','bus-g5','bus-g6'].includes(scenario)){const generation=scenario==='bus-g5'?5:scenario==='bus-g6'?6:7;assert.equal(evidence.generation,generation);assert.equal(evidence.remote.generation,generation);}
});
