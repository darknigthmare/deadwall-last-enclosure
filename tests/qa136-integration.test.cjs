'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
for(const[name,title]of Object.entries({loop:'G6 récolte, dépôt, chantier payé, alerte/assaut et sauvegardes du parcours',vehicle:'G6 voiture payée, coffre, passages D17/région, reprises et rayon à pied après conduite'}))test('QA136 intégration : '+title,()=>{
 const r=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/qa136-integration.cjs'),name],{encoding:'utf8',timeout:90000});
 assert.equal(r.status,0,r.stderr||r.stdout);const v=JSON.parse(r.stdout.trim());assert.equal(v.scenario,name);assert.equal(v.status,'passed');assert.equal(v.browser,false);
});
