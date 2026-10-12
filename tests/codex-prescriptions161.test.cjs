'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../src/codex3000-runtime.js'),UI=require('../src/world-codex.js');
test('161: all 3000 programmes expose their authored dimensions, anchors and quantities without source mutation',()=>{
 let rooms=0,props=0,access=0;
 for(const record of R.records){const d=R.describe(record.id),before=JSON.stringify(d);for(const room of d.rooms){rooms++;
  for(const prop of room.authoredProps){const rows=UI.sourcePropRows161(prop),text=rows.flat().join(' ');props++;
   assert.ok(rows.length>=2);assert.ok(rows.every(r=>r.length===2&&r.every(v=>typeof v==='string')));
   for(const v of Object.values(prop.gabarit_m||{}))if(Number.isFinite(v))assert.ok(text.includes(String(v).replace('.',',')));
   if(prop.ancrage)assert.ok(text.includes(prop.ancrage));if(prop.rotation)assert.ok(text.includes(prop.rotation));
  }}const rows=UI.accessRows161(d);access+=rows.length;assert.equal(rows.length,d.access.length);
  assert.equal(JSON.stringify(d),before);for(const row of rows)assert.ok(row.every(v=>typeof v==='string'));
 }
 assert.equal(rooms,13680);assert.equal(props,18117);assert.ok(access>0);console.log(JSON.stringify({programmes:3000,rooms,props,access}));
});
test('161: incomplete specifications are explicit; authored zero quantities and false loot eligibility remain meaningful',()=>{
 const rows=UI.sourcePropRows161({quantite_par_espace:[0,0],loot_eligible:false});
 assert.equal(rows[0][1],'0');assert.match(rows[1][1],/non renseigné/);assert.equal(rows.at(-1)[1],'Non éligible');
 const result=UI.accessRows161({rooms:[{id:'DW-0001/r1',name:'Cuisine'}],access:[{de:'voie_publique',vers:'DW-0001/r1',largeur_min_m:1.35,contrainte:'Accès conservé'}]});
 assert.deepEqual(result,[['voie publique → Cuisine','1,35 m minimum proposé · Accès conservé']]);
});
