'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('Armurerie UI : un aperçu partagé, travail linéaire et catalogue complet',()=>{
 const r=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/qa-startup134.cjs'),'armory_ui'],{encoding:'utf8',timeout:60000});
 assert.equal(r.status,0,r.stderr||r.stdout);const report=JSON.parse(r.stdout.trim());
 assert.equal(report.status,'passed');assert.equal(report.views,1);
});
