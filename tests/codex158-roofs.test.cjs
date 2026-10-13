'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const A=require('../src/interior-art153.js');
const R=require('../src/codex3000-runtime.js');

test('158 independently authored roofs override historical name and family guesses',()=>{
 for(const [id,expected]of [['DW-3891','service'],['DW-3991','civic']]){
  const card=R.get(id);assert.equal(card?.extension,158,id);
  assert.equal(card.details.architecture.roofFamily,expected,id);
  const item={id:'roof:'+id,type:'codex3000-'+id.slice(3),generation:9};
  assert.equal(A.roofFamily(item),expected,id);
  assert.strictEqual(A.roofChoices(item),A.ROOFS[expected]);
  assert.strictEqual(A.spriteForRoof(item,{variant:0}),A.ROOFS[expected][0]);
 }
});

test('158 every new programme routes to its actual authored sprite family',()=>{
 const cards=R.records.filter(p=>p.extension===158);assert.equal(cards.length,1000);
 for(const card of cards){
  const item={id:'programme-roof:'+card.id,type:'codex3000-'+card.id.slice(3),generation:9};
  const family=card.details.architecture.roofFamily,saved=JSON.stringify(item);
  assert.ok(Object.hasOwn(A.ROOFS,family),card.id);
  assert.equal(A.roofFamily(item),family,card.id);
  assert.strictEqual(A.roofChoices(item),A.ROOFS[family],card.id);
  const selected=A.spriteForRoof(item,{seed:903145});
  assert.ok(A.ROOFS[family].includes(selected),card.id);
  assert.strictEqual(A.spriteForRoof(JSON.parse(saved),{seed:903145}),selected,card.id);
  assert.equal(JSON.stringify(item),saved,card.id);
 }
});

test('158 all 3000 archived roof routes, variants and seeded choices retain their 1.57 fingerprint',()=>{
 const cards=R.records.filter(p=>Number(p.id.slice(3))<=3000);assert.equal(cards.length,3000);
 const rows=cards.map(p=>{const type='codex3000-'+p.id.slice(3);return [p.id,A.roofFamily(type),A.roofChoices(type),
  [17117,903145].map(seed=>A.spriteForRoof({id:'legacyRoof:'+p.id,type,generation:8,x:120,y:20},{seed}))];});
 const digest=crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');
 assert.equal(digest,'cde3c2509389af24cbcfefb9d8d1d7a18664c95676162bcaef4d25d62e558cbc');
});

test('158 an unknown or inherited author roof never enters the sprite cache',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/interior-art153.js'),'utf8');
 const values=['absent','__proto__','constructor',null];
 const cards=new Map(values.map((roof,i)=>['DW-'+(3996+i),{id:'DW-'+(3996+i),extension:158,details:{architecture:{roofFamily:roof}}}]));
 const runtime={
  preset(type){const id='DW-'+type.slice(-4);return cards.has(id)?{codex:id,name:'Atelier de contrôle terrestre',family:'Services et petits ateliers'}:null;},
  get:id=>cards.get(id),parentFor:()=>['Atelier de contrôle terrestre'],detailFamily:()=> 'artisanat'
 };
 const sandbox={module:{exports:{}},DeadwallCodex3000Runtime:runtime};vm.runInNewContext(source,sandbox);
 const owner=sandbox.module.exports;
 for(const id of cards.keys()){
  const type='codex3000-'+id.slice(3);
  assert.equal(owner.roofFamily(type),'workshop');
  assert.strictEqual(owner.roofChoices(type),owner.ROOFS.workshop);
  assert.ok(owner.ROOFS.workshop.includes(owner.spriteForRoof({id,type},{seed:17117})));
 }
});
