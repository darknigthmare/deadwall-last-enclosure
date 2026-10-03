'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {spawnSync}=require('node:child_process');
test('QA intégration 133 : ordre HTML complet, intro, mort, choix réel et reprise',()=>{
 const result=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/qa-startup133.cjs')],{encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stderr||result.stdout);
 const rows=result.stdout.trim().split('\n').map(s=>JSON.parse(s));
 assert.equal(rows.length,4);assert.equal(rows[0].stage,'intro');assert.equal(rows[0].intro,true);assert.equal(rows[0].revision,3);
 assert.ok(rows[0].modules.every(([,installed])=>installed));
 assert.deepEqual(rows[1],{stage:'death',pending:true,overlay:'succession133',stored:1});
 assert.equal(rows[2].dead,false);assert.equal(rows[2].pending,false);assert.equal(rows[2].paused,false);assert.equal(rows[2].profile,'scout');assert.equal(rows[2].save,true);
 assert.equal(rows[3].dead,false);assert.equal(rows[3].pending,false);assert.equal(rows[3].profile,'scout');assert.equal(rows[3].save,true);
});
