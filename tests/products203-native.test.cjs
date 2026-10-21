'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/husbandry191.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function produced(){
 const env=H.captured(),g=env.g,p=env.pen;
 assert.equal(g.husbandry191.begin('slaughter',p.id,g.husbandry191.view().animals[0].id).ok,true);H.finish(g);
 assert.ok(g.husbandry191.view().pens[0].meat>0,'native animal produced finite meat');
 return env;
}
test('203 native generated game: actual production, paid pack, exact save/restore and partial return',()=>{
 const{g,pen}=produced();let before=g.serialize();const stock=before.expansions127.modules.husbandry191.pens[0].meat;
 assert.equal(g.husbandry191.begin('pack-meat',pen.id).ok,true);H.finish(g);let s=g.serialize();assert.doesNotThrow(()=>DeadwallSave.validate(s));assert.equal(s.expansions127.modules.husbandry191.cargo203.amount,Math.min(stock,6));
 assert.equal(g.restoreSave(s),true);g.paused=false;g.activeOverlay=null;
 assert.deepEqual(g.husbandry191.snapshot(),s.expansions127.modules.husbandry191);
 assert.equal(g.frontier.leave(),false);assert.equal(g.frontier.active(),true);assert.equal(g.frontier.board(),false);assert.equal(g.frontier.stairsStatus(1).code,'cargo');
 const p=g.frontier.position();assert.equal(g.husbandry191.begin('drop-products').ok,true);s=g.serialize();assert.doesNotThrow(()=>DeadwallSave.validate(s));assert.equal(g.restoreSave(s),true);g.paused=false;g.activeOverlay=null;
 assert.equal(g.husbandry191.begin('pickup-products').ok,true);H.finish(g);assert.equal(g.husbandry191.begin('unpack-products',pen.id).ok,true);H.finish(g);
 assert.equal(g.husbandry191.view().cargo203,undefined);assert.equal(g.husbandry191.view().pens[0].meat,stock);assert.deepEqual(g.resources,before.resources);assert.equal(g.player.carry.food,before.player.carry.food);
});
test('203 native regional death leaves one recoverable package, never at the replacement D-17 position',()=>{
 const{g,pen}=produced();assert.equal(g.husbandry191.begin('pack-meat',pen.id).ok,true);H.finish(g);const where=g.frontier.position(),amount=g.husbandry191.view().cargo203.amount;
 g.player.invulnerable=0;assert.equal(g.frontier.damage(g.player.health+1000),true);assert.equal(g.player.dead,true);
 const c=g.husbandry191.view().cargo203;assert.equal(c.stage,'ground');assert.equal(c.amount,amount);assert.deepEqual(c.point,{x:where.x,y:where.y});
 const s=g.serialize();assert.doesNotThrow(()=>DeadwallSave.validate(s));assert.equal(g.restoreSave(s),true);assert.deepEqual(g.husbandry191.view().cargo203,c);
});
test('203 native import refuses a second large load before replacing the live campaign',()=>{
 const{g,pen}=produced();g.husbandry191.begin('pack-meat',pen.id);H.finish(g);const s=g.serialize(),world=g.world;
 // The source module validators can be isolated to exercise the shared ownership check.
 const X=require('../src/expansion-kit.js'),validators=new Map(Object.entries(s.expansions127.modules).map(([id])=>[id,v=>v]));
 const invalid=clone(s.expansions127);invalid.modules.vertical175.network.cargo={kind:'sentry'};
 assert.throws(()=>X.normalize(invalid,s,validators),/Un seul chargement/);assert.equal(g.world,world);assert.equal(g.husbandry191.carryingProducts(),true);
 const nonRegional=clone(s);nonRegional.frontier.active=false;
 assert.throws(()=>DeadwallSave.validate(nonRegional),/Registre des enclos/);assert.equal(g.world,world);
});
