'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),Guide=require('../src/biomes-codex164.js');
test('164 ecology guide: all four real definitions have complete entries and the historical pack is preserved',()=>{
 const entries=Guide.entries(),by=new Map(entries.map(e=>[e.id,e]));assert.equal(entries.length,5);
 for(const d of C.EcologyRules164.defs){const e=by.get('biome164-'+d.id);assert.ok(e);assert.equal(e.summary,d.description);assert.equal(e.risks,d.risk);assert.ok(e.title.includes(d.name));
  for(const k of ['title','family','status','summary','layout','access','supplies','risks','night','variants','interactions','qa','source'])assert.ok(typeof e[k]==='string'&&e[k].length,k);
  assert.equal(e.status,'jouable');assert.match(e.supplies,/réserves finies/);assert.match(e.source,/sauvegardées gardent/);
 }
 const legacy=require('../src/biomes-codex135.js');assert.equal(legacy.length,115);assert.ok(legacy.every(e=>!e.id.startsWith('biome164-')));
 const codex=require('../src/world-codex.js');for(const e of entries)assert.ok(codex.entries.some(x=>x.id===e.id));
});
test('164 ecology guide: bundled evaluation before Core is safe and later definitions are read without shared state',()=>{
 const sandbox={};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../src/biomes-codex164.js'),'utf8'),sandbox);
 assert.throws(()=>sandbox.DeadwallEcologyCodex164.entries(),/absentes/);
 sandbox.DeadwallCore=C;sandbox.DeadwallFrontierGeometry=require('../src/frontier-geometry.js');
 const a=sandbox.DeadwallEcologyCodex164.entries();assert.equal(a.length,5);assert.strictEqual(sandbox.DeadwallEcologyCodex164.entries(),a);assert.ok(Object.isFrozen(a)&&a.every(Object.isFrozen));
});
test('164 ecology compatibility: authored placement accepts meaningful aliases without weakening town or terrain restrictions',()=>{
 const R=require('../src/codex3000-runtime.js');
 const rural=R.records.find(r=>r.extension===158&&r.details.placement.mode==='rural'&&r.details.placement.biomes.includes('meadow'));assert.ok(rural);
 assert.equal(R.enabled(rural,{biome:'agriculturalPlateau'}),false);assert.equal(R.enabled(rural,{biome:'agriculturalPlateau',biomeAliases:['agriculturalPlateau','meadow','orchard']}),true);
 assert.equal(R.enabled(rural,{biome:'agriculturalPlateau',biomeAliases:['agriculturalPlateau','meadow'],townKind:'ville'}),false);
 const forbidden=R.records.find(r=>r.module==='riviere');assert.ok(forbidden);assert.equal(R.enabled(forbidden,{biome:'alluvialTerrace',biomeAliases:['riparian']}),false);
});
