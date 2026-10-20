'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,stock}=require('./helpers/husbandry199.cjs'),C=require('../src/core.js'),R=C.Husbandry191Rules;
function setup(health=40){const f=fixture(),s=stock();s.animals=s.animals.slice(0,1);s.animals[0].health=health;f.restore(s);f.g.player.carry.medicine=3;return f;}
const finish=f=>{for(let i=0;i<100&&f.g.husbandry191.busy();i++)f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false);};
const pet=f=>f.read().animals[0];
test('200 care consumes actual carried medicine once and heals only its living captive after work',()=>{
 const f=setup(),g=f.g,before=f.read(),bag={...g.player.carry};assert.equal(g.husbandry191.begin('care',1,2).ok,true);
 assert.equal(g.player.carry.medicine,bag.medicine-R.careCost.medicine);assert.equal(pet(f).health,40);
 g.paused=true;for(let i=0;i<80;i++)g.husbandry191.step(.1);assert.equal(pet(f).health,40);g.paused=false;finish(f);
 assert.equal(pet(f).health,40+R.careHealth);assert.equal(pet(f).source,before.animals[0].source);assert.equal(pet(f).status,'held');
 for(const key of ['wood','scrap','food','fuel'])assert.equal(g.player.carry[key],bag[key]);for(const key of ['meat','hides','leather'])assert.equal(f.read().pens[0][key],before.pens[0][key]);
});
test('200 care caps health and refuses a full-health subject before payment',()=>{
 const f=setup(95);assert.equal(f.g.husbandry191.begin('care',1,2).ok,true);finish(f);assert.equal(pet(f).health,100);const b={...f.g.player.carry};assert.equal(f.g.husbandry191.begin('care',1,2).ok,false);assert.deepEqual(f.g.player.carry,b);
});
for(const mutation of [f=>f.g.player.carry.medicine=0,f=>f.position.x+=50,f=>f.g.fieldcraft={context:()=>({mounted:true})},f=>f.g.siege={toolActive:()=>true},f=>f.g.player.dead=true])test('200 care refuses unavailable supplies, access, hands or commander before debit: '+mutation,()=>{
 const f=setup();mutation(f);const before=JSON.stringify(f.read()),bag={...f.g.player.carry};assert.equal(f.g.husbandry191.begin('care',1,2).ok,false);assert.equal(JSON.stringify(f.read()),before);assert.deepEqual(f.g.player.carry,bag);
});
for(const interrupt of [f=>f.position.x+=1,f=>f.g.damagePlayer(1),f=>f.g.husbandry191.cancel(),f=>f.g.fieldcraft={context:()=>({mounted:true})}])test('200 interrupted care has no heal or medicine refund: '+interrupt,()=>{
 const f=setup();assert.equal(f.g.husbandry191.begin('care',1,2).ok,true);interrupt(f);finish(f);assert.equal(pet(f).health,40);assert.equal(f.g.player.carry.medicine,3-R.careCost.medicine);
});
test('200 a captive that dies of neglect during care cannot be resurrected',()=>{
 const f=setup(.00001),s=f.read();s.pens[0].food=s.pens[0].water=0;f.restore(s);assert.equal(f.g.husbandry191.begin('care',1,2).ok,true);finish(f);assert.equal(pet(f).status,'dead');assert.equal(pet(f).health,0);assert.equal(f.read().pens[0].meat,0);
});
test('200 save/restore cancels paid treatment without finishing or charging it twice',()=>{
 const f=setup();assert.equal(f.g.husbandry191.begin('care',1,2).ok,true);f.g.husbandry191.step(.1);const saved=f.read();f.restore(saved);finish(f);assert.equal(pet(f).health,40);assert.equal(f.g.player.carry.medicine,3-R.careCost.medicine);
});
test('200 reports identify the weakest captive and suspended births without mutating any owner',()=>{
 const f=setup(45),s=f.read();s.pens[0].breeding199=false;f.restore(s);const before=JSON.stringify(f.read()),rows=f.g.husbandry191.reports();assert.equal(rows[0].lowestHealth,45);assert.equal(rows[0].breedingAllowed,false);assert.equal(rows[0].birthSeconds,null);assert.match(f.g.husbandry191.overview().rows.find(r=>r.label.startsWith('Registre')).value,/naissances suspendues/i);assert.equal(JSON.stringify(f.read()),before);
 assert.ok(f.g.husbandry191.actions().some(a=>a.id==='care:1:2'&&!a.disabled));
});
