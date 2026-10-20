'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/husbandry191.cjs');
const C=require('../src/core.js');
test('200 paid care of a genuinely injured generated animal survives native restoration and release',()=>{
 const{g,q,pen}=H.build();const original=g.frontier.wildlifeStatus165(q.a.id),max=original.profile.health;
 assert.equal(g.frontier.hitWildlife165(q.a.id,max*.5),true);assert.equal(g.husbandry191.begin('capture',pen.id,q.a.id).ok,true);H.finish(g);
 let save=g.serialize();save.player.carry.medicine=2;assert.equal(g.restoreSave(save),true);g.paused=false;g.activeOverlay=null;
 const a=g.husbandry191.view().animals[0],before=g.serialize(),bag=g.player.carry.medicine;assert.ok(a.health<51);
 assert.equal(g.husbandry191.begin('care',pen.id,a.id).ok,true);assert.equal(g.player.carry.medicine,bag-C.Husbandry191Rules.careCost.medicine);H.finish(g);
 const healed=g.husbandry191.view().animals[0];assert.ok(Math.abs(healed.health-(a.health+C.Husbandry191Rules.careHealth-C.Husbandry191Rules.careSeconds*C.Husbandry191Rules.starveDamage))<1e-7,'empty troughs continue to hurt during treatment');assert.deepEqual(g.resources,before.resources);
 save=g.serialize();assert.doesNotThrow(()=>DeadwallSave.validate(save));assert.equal(g.restoreSave(save),true);g.paused=false;g.activeOverlay=null;assert.equal(g.husbandry191.view().animals[0].health,healed.health);
 assert.equal(g.husbandry191.begin('release',pen.id,a.id).ok,true);const wild=g.frontier.wildlifeStatus165(q.a.id);assert.ok(Math.abs(wild.hp-max*healed.health/100)<1e-8,'the same paid health is transferred, not the old pre-care hp');
 assert.equal(g.husbandry191.owns(q.a.id),false);assert.equal(g.husbandry191.view().animals[0].status,'released');assert.equal(g.player.carry.medicine,bag-C.Husbandry191Rules.careCost.medicine);
 const final=g.serialize();assert.equal(g.restoreSave(final),true);assert.equal(g.frontier.wildlifeStatus165(q.a.id).hp,wild.hp);
});
