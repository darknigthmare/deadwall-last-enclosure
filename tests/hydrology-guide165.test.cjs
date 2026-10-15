'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),Guide=require('../src/hydrology-codex165.js');
const source=fs.readFileSync(require.resolve('../src/hydrology-codex165.js'),'utf8');
const display=value=>String(Number(value.toFixed(3))).replace('.',',');

test('165 water Guide exposes the seven real water kinds and three distinct operational topics',()=>{
 const before=JSON.stringify([C.Hydrology165Rules,C.BiomePopulation165Rules,C.BiomeRules135]),entries=Guide.entries(),by=new Map(entries.map(e=>[e.id,e]));
 assert.equal(entries.length,10);assert.equal(by.size,10);
 assert.deepEqual([...by.keys()].sort(),[...Object.keys(C.Hydrology165Rules.kinds).map(id=>'hydrology165-'+id),'hydrology165-banks','hydrology165-wildlife','hydrology165-infected'].sort());
 for(const [id,definition]of Object.entries(C.Hydrology165Rules.kinds)){
  const entry=by.get('hydrology165-'+id);assert.ok(entry.title.includes(definition.name));
  assert.ok(entry.layout.includes(display(definition.depth)+' m'));assert.ok(entry.layout.includes(display(definition.bankWidth)+' m'));
  for(const width of definition.width)assert.ok(entry.layout.includes(display(width)),id+' metric width');
  assert.ok(entry.layout.includes(definition.salinity==='salt'?'Eau salée':'Eau douce'));
  assert.match(entry.access,/Aucune nage/);assert.match(entry.supplies,/réserves finies/);assert.match(entry.source,/sauvegardes historiques gardent/);
 }
 for(const entry of entries){
  assert.equal(entry.status,'jouable');assert.ok(['nature','systemes'].includes(entry.family));
  for(const field of ['title','family','status','summary','layout','access','supplies','risks','night','variants','interactions','qa','source']){
   assert.ok(typeof entry[field]==='string'&&entry[field].length,entry.id+' '+field);assert.doesNotMatch(entry[field],/undefined|NaN|À COMPLÉTER/);
  }
 }
 assert.ok(Object.isFrozen(entries)&&entries.every(Object.isFrozen));assert.strictEqual(Guide.entries(),entries);
 assert.equal(JSON.stringify([C.Hydrology165Rules,C.BiomePopulation165Rules,C.BiomeRules135]),before,'consultation preserves rules');
});

test('165 water Guide resolves Core lazily and derives metric changes from the current rules owner',()=>{
 let reads=0;const sandbox={};Object.defineProperty(sandbox,'DeadwallCore',{configurable:true,get(){reads++;return undefined;}});
 vm.createContext(sandbox);vm.runInContext(source,sandbox);assert.equal(reads,0);assert.throws(()=>sandbox.DeadwallHydrologyCodex165.entries(),/absentes/);assert.ok(reads>0);
 const changedWater=structuredClone(C.Hydrology165Rules),changedPopulation=structuredClone(C.BiomePopulation165Rules);
 changedWater.kinds.lake.width=[174,343];changedWater.kinds.stream.depth=.61;changedWater.crossings.maxSpan=211;
 changedPopulation.species.hare.speed=6.37;changedPopulation.animalBudget=23;
 Object.defineProperty(sandbox,'DeadwallCore',{value:{...C,Hydrology165Rules:changedWater,BiomePopulation165Rules:changedPopulation},writable:true,configurable:true});
 const entries=sandbox.DeadwallHydrologyCodex165.entries(),by=new Map(entries.map(e=>[e.id,e]));
 assert.match(by.get('hydrology165-lake').layout,/174 à 343 m/);assert.match(by.get('hydrology165-stream').layout,/0,61 m/);
 assert.match(by.get('hydrology165-banks').layout,/211 m/);assert.match(by.get('hydrology165-wildlife').layout,/6,37 m\/s/);assert.match(by.get('hydrology165-wildlife').variants,/23 animaux actifs/);
 assert.strictEqual(sandbox.DeadwallHydrologyCodex165.entries(),entries);
 sandbox.DeadwallCore=C;const original=sandbox.DeadwallHydrologyCodex165.entries();assert.notStrictEqual(original,entries);assert.match(original.find(e=>e.id==='hydrology165-lake').layout,/150 à 310 m/);
 const absent={};vm.createContext(absent);vm.runInContext(source,absent);assert.throws(()=>absent.DeadwallHydrologyCodex165.entries(),/absentes/);
});

test('165 wildlife and infected Guide uses actual regional profiles and states the delivered animal limits',()=>{
 const entries=Guide.entries(),wildlife=entries.find(e=>e.id==='hydrology165-wildlife'),infected=entries.find(e=>e.id==='hydrology165-infected');
 for(const species of Object.values(C.BiomePopulation165Rules.species)){
  assert.ok(wildlife.summary.includes(species.name));assert.ok(wildlife.layout.includes(species.name+' : '+display(species.length)+' × '+display(species.width)+' m'));
  assert.ok(wildlife.layout.includes(display(species.speed)+' m/s'));
  if(species.bankRange)assert.ok(wildlife.layout.includes(species.name+' à '+display(species.bankRange)+' m'));
 }
 for(const profile of Object.values(C.BiomeRules135.enemies))assert.ok(infected.layout.includes(profile.name+' : '+display(profile.health)+' PV, '+display(profile.speed)+' m/s'));
 assert.match(wildlife.access,/oiseaux restent au sol/);assert.match(wildlife.access,/aucun vol ni nage/);assert.match(wildlife.risks,/n’attaquent pas/);
 assert.match(wildlife.supplies,/Pas d’élevage, de capture ni d’économie de chasse/);assert.match(wildlife.interactions,/blessures et les morts/);
 assert.match(infected.supplies,/aucun budget de horde supplémentaire/);assert.match(infected.interactions,/réellement observés par un allié/);
});

test('165 public Guide searches all new entries and preserves the broader historic water projects',()=>{
 const codex=require('../src/world-codex.js'),ids=new Set(codex.entries.map(e=>e.id));assert.equal(ids.size,codex.entries.length);
 for(const entry of Guide.entries())assert.ok(codex.entries.some(item=>item===entry),'same owner entry '+entry.id);
 assert.ok(codex.query({text:'canard colvert',status:'terrain'}).some(e=>e.id==='hydrology165-wildlife'));
 assert.ok(codex.query({text:'mer côtière',family:'nature',status:'terrain'}).some(e=>e.id==='hydrology165-sea'));
 assert.ok(codex.query({text:'franchissements',family:'systemes',status:'terrain'}).some(e=>e.id==='hydrology165-banks'));
 for(const id of ['lac','riviere','plage'])assert.equal(codex.entries.find(e=>e.id===id)?.status,'plan','broader project '+id+' is not promoted by water alone');
 assert.equal(require('../src/biomes-codex135.js').length,115);assert.equal(require('../src/biomes-codex164.js').entries().length,5);
});
