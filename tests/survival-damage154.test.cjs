'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');
const C=require('../src/core.js');
let env;
test.before(()=>{env=bootDocument134();});
function fresh(domain='local'){
 const {g}=env;g.startNew('standard','17117');g.campaignIntro132.skip();g.phaseTime=999;
 const raw=g.serialize(),target=g.essentials.targets().find(t=>t.family==='aid');
 // One previously delivered and equipped kit isolates the interaction. This
 // fixture is not evidence of travelling, crafting or earning that equipment.
 raw.essentials.jobs[target.id]={stage:'delivered'};raw.frontier.seen.push(target.poi);raw.essentials.belt.aid=1;
 raw.player.health=50;raw.player.carry.medicine=2;g.restoreSave(raw);
 if(domain==='region'){Object.assign(g.player,{x:4058,y:2048});assert.equal(g.frontier.enter(),true);}
 return g;
}
function step(g,seconds){for(let i=0;i<Math.round(seconds/.04);i++)g.survivalPack.step(.04);}
function dress(g,kind='dressing'){assert.equal(g.survivalPack.begin(kind).ok,true);step(g,C.SurvivalPackRules[kind].seconds);assert.equal(g.survivalPack.snapshot().dressing.remaining,C.SurvivalPackRules[kind].heal);}

for(const domain of ['local','region'])test('154 survival: '+domain+' impact breaks the paid dressing before same-frame first aid can hide the damage',()=>{
 const g=fresh(domain),notifications=[],old=g.notify;
 dress(g);const bag={...g.player.carry},stocks={...g.resources};g.notify=(message,tone)=>{notifications.push({message,tone});return old.call(g,message,tone);};
 try{
  g.player.invulnerable=0;if(domain==='local')g.damagePlayer(8);else g.frontier.damage(8);
  assert.equal(g.player.health,42);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0},'The real hit invalidates the dressing immediately, before any next update');
  assert.equal(g.essentials.use('aid').amount,40);assert.equal(g.player.health,82);assert.equal(g.essentials.snapshot().belt.aid,0);
  step(g,5);assert.equal(g.player.health,82);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stocks);
  assert.equal(notifications.filter(n=>/Pansement interrompu/.test(n.message)).length,1);
  assert.equal(g.save(false),true);assert.equal(g.load(),true);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});assert.equal(g.player.health,82);
 }finally{g.notify=old;}
});

test('154 survival: impact cancels unfinished preparation without spending medicine even when immediate first aid restores more health',()=>{
 const g=fresh();assert.equal(g.survivalPack.begin('dressing').ok,true);step(g,1);const bag={...g.player.carry},stocks={...g.resources};
 g.damagePlayer(8);assert.equal(g.survivalPack.busy(),false);assert.equal(g.essentials.use('aid').amount,40);
 step(g,10);assert.equal(g.player.health,82);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});
});

for(const domain of ['local','region'])test('154 survival: '+domain+' invulnerability rejects the hit and preserves legitimate ongoing dressing',()=>{
 const g=fresh(domain);dress(g,'dressingLight');const before=g.survivalPack.snapshot().dressing;
 g.player.invulnerable=1;if(domain==='local')g.damagePlayer(8);else g.frontier.damage(8);
 assert.equal(g.player.health,50);assert.deepEqual(g.survivalPack.snapshot().dressing,before);
 step(g,.04);assert.ok(Math.abs(g.player.health-50.024)<1e-8);assert.ok(g.survivalPack.snapshot().dressing.left>0);
});
