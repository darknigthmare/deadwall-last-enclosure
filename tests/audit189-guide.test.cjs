'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/wildlife189.js'),Guide=require('../src/ecology-codex189.js');

test('189 field guide retains its 43 stable species, biome and generation identities without mutating rules',()=>{
 const before=JSON.stringify({landscape:C.Landscape189Rules,harvest:C.WildlifeHarvest190Rules,husbandry:C.Husbandry191Rules});
 const entries=Guide.entries(),ids=[...Object.keys(W.species()).map(id=>'fauna189-'+id),...Object.keys(C.Landscape189Rules.guilds).map(id=>'fauna189-biome-'+id),'landscape189-profiles'];
 assert.equal(entries.length,43);assert.deepEqual(entries.map(e=>e.id).sort(),ids.sort());assert.equal(new Set(entries.map(e=>e.id)).size,43);
 assert.ok(Object.isFrozen(entries));assert.ok(entries.every(e=>Object.isFrozen(e)&&e.status==='jouable'));
 assert.equal(JSON.stringify({landscape:C.Landscape189Rules,harvest:C.WildlifeHarvest190Rules,husbandry:C.Husbandry191Rules}),before);
 const landscape=entries.find(e=>e.id==='landscape189-profiles');assert.match(landscape.summary,/graine.*profil/i);assert.match(landscape.access,/anciennes cartes.*jamais converties/i);
});

test('189 species guide advertises only the harvests, captives and products implemented for that species',()=>{
 const by=new Map(Guide.entries().map(e=>[e.id,e]));
 for(const d of Object.values(W.species())){
  const text=by.get('fauna189-'+d.id).supplies,yieldAmount=C.WildlifeHarvest190Rules.yields[d.id]||0,captive=C.Husbandry191Rules.captive[d.id];
  if(yieldAmount){assert.match(text,new RegExp('finie de '+yieldAmount+' provisions'));assert.match(text,d.mode==='swim'?/pêche.*berge/i:/dépouille.*couteau.*machette/i);}
  else assert.match(text,/aucune provision récoltable/i);
  if(captive){
   assert.match(text,/capture vivante.*filet.*enclos/i);assert.match(text,new RegExp(captive.meat+' unités de viande brute'));
   assert.match(text,captive.hides?new RegExp(captive.hides+' peau'): /aucune peau/);
   assert.match(text,/stock du site/);assert.match(text,/cuisson.*provisions dans le sac/i);
   if(captive.breed){assert.match(text,/reproduction possible/i);assert.match(text,new RegExp(C.Husbandry191Rules.breedSeconds+' secondes simulées'));assert.match(text,new RegExp('Maturité.*'+C.Husbandry191Rules.matureSeconds+' secondes simulées'));}
   else assert.match(text,/reproduction indisponible/i);
  }else{assert.match(text,/capture vivante et élevage indisponibles/i);assert.doesNotMatch(text,/transformation d’un adulte captif/i);}
 }
});

test('189 population guide explains optional predators and boar defence without claiming universal aggression',()=>{
 const entries=Guide.entries(),populations=entries.filter(e=>e.id.startsWith('fauna189-biome-'));
 assert.equal(populations.length,16);
 for(const e of populations){
  for(const id of Object.keys(C.Husbandry191Rules.captive))assert.ok(e.supplies.includes(W.species()[id].name));
  for(const id of Object.keys(C.Husbandry191Rules.prey))assert.ok(e.risks.includes(W.species()[id].name));
  assert.match(e.risks,/désactivés au départ.*activation volontaire/i);assert.match(e.risks,/sanglier blessé et alarmé.*riposter au contact/i);
  assert.match(e.supplies,/eau douce.*sur place/i);assert.match(e.supplies,/provisions dans le sac/i);
 }
 for(const e of entries){assert.doesNotMatch(JSON.stringify(e),/capture vivante et élevage non raccordés|faune non agressive/i);}
});
