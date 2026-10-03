'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
const titles={access:'escalier inaccessible à travers une cloison',landing:'palier obstrué refusé, approche réelle puis descente et reprise libres',recover:'ancienne reprise coincée sur un palier récupérée sans gain',passage:'bâtiment G6 généré, deux traversées et étages, portes, rendu et cache persistants',wreck:'fouille réelle, coffre dessiné ouvert et contenu conservé après reprise',companion:'le tir de compagnon blesse le contact sélectionné dans une horde serrée'};
for(const[name,title]of Object.entries(titles))test('Monde 137 : '+title,()=>{
 const r=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/qa137-world.cjs'),name],{encoding:'utf8',timeout:90000});
 assert.equal(r.status,0,r.stderr||r.stdout);const v=JSON.parse(r.stdout.trim());assert.equal(v.scenario,name);assert.equal(v.status,'passed');assert.equal(v.browser,false);
});
