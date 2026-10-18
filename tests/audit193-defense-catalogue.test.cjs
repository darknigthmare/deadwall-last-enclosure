'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),City=require('../src/city-catalogue150.js'),Guide=require('../src/world-codex-actions159.js');
const mechanisms=()=>City.create(C).items.filter(item=>item.kind==='mechanism');
test('193 defensive guide lists the actual allowed contacts and links the real twelve mechanisms',()=>{
 const items=mechanisms();assert.equal(items.length,12);
 for(const item of items){
  const d=C.FortificationPackRules.mechanisms[item.id],card=Guide.entries.find(e=>e.choice159===item.key);assert.ok(card,item.key);
  if(d.targetKinds)for(const kind of d.targetKinds)assert.ok(item.facts.some(text=>text.includes(C.ENEMIES[kind].name)),item.id+' actual allowed species');
  else assert.ok(item.facts.some(text=>text.includes('Tous les profils')));
  assert.equal(item.payment,'bag');assert.ok(card.layout.includes(d.damage+' dégâts'));
  assert.ok(card.risks.includes('intervalle entre prises'));assert.ok(card.risks.includes('durée de travail de réarmement'));
  assert.ok(card.risks.includes('paiement unique')||card.risks.includes('Paiement unique'));assert.ok(card.risks.includes('cycle et autres réserves conservés'));
 }
 const cable=Guide.entries.find(e=>e.choice159==='mechanism:quickCable193');assert.ok(cable.summary.includes('Zéro dégât'));assert.ok(cable.layout.includes('0 dégâts'));
});
test('193 guide one-charge rearm quote gives the actual 1 wood, 2 scrap and 1.2s without inventing a minimum',()=>{
 const card=Guide.entries.find(e=>e.choice159==='mechanism:runnerCable193');
 assert.ok(card.layout.includes(C.resourceText({wood:1,scrap:2})));assert.ok(card.layout.includes('réarmement 1.2 s'));
 assert.ok(card.risks.includes('arrondi supérieur'));assert.ok(card.risks.includes('× 0.8 × charges manquantes / capacité'));
 assert.ok(card.risks.includes('× 0.6 × charges manquantes / capacité'));assert.ok(card.risks.includes('libération de toute cible retenue'));
});
test('193 repeated defensive catalogue reads preserve Core rules and consume no ambient or campaign RNG',()=>{
 const before=JSON.stringify(C.FortificationPackRules),random=Math.random,next=C.Random.prototype.next;
 Math.random=()=>assert.fail('No ambient RNG while reading guide');C.Random.prototype.next=()=>assert.fail('No campaign RNG while reading guide');
 try{const first=JSON.stringify(City.create(C));for(let n=0;n<4;n++)assert.equal(JSON.stringify(City.create(C)),first);assert.equal(JSON.stringify(C.FortificationPackRules),before);}
 finally{Math.random=random;C.Random.prototype.next=next;}
});
