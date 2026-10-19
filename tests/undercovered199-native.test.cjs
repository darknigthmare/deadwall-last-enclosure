'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{build,captured,finish}=require('./helpers/husbandry191.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function prepare(g,change){const raw=g.serialize();change(raw);assert.equal(g.restoreSave(raw),true);g.paused=false;g.activeOverlay=null;g.releaseInputs();}
function stable(g){const {timestamp,...s}=g.serialize();return s;}
test('199 native carried-water delivery and cancelled action survive Save/Menu/Continue without duplicate water',()=>{
 const {g,pen}=build();prepare(g,raw=>{raw.siege.playerWater=6;raw.siege.stats.waterProduced+=6;});
 assert.equal(g.siege.carriedWater199(),6);assert.ok(g.husbandry191.begin('water-carried',pen.id).ok);g.husbandry191.cancel();
 assert.equal(g.siege.carriedWater199(),6);assert.equal(g.husbandry191.view().pens[0].water,0);
 assert.ok(g.husbandry191.begin('water-carried',pen.id).ok);finish(g);assert.equal(g.siege.carriedWater199(),0);assert.equal(g.husbandry191.view().pens[0].water,6);
 const before=stable(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(stable(g),before);
 assert.equal(g.husbandry191.quote('water-carried',pen.id).ok,false);
});
test('199 native death spills only the shared carried bucket, not the water already at an enclosure',()=>{
 const {g,pen}=build();prepare(g,raw=>{raw.siege.playerWater=5;raw.expansions127.modules.husbandry191.pens[0].water=9;});
 const before=g.siege.snapshot();g.player.invulnerable=0;assert.equal(g.frontier.damage(g.player.health+20),true);
 assert.equal(g.siege.carriedWater199(),0);assert.equal(g.siege.snapshot().stats.waterLost,before.stats.waterLost+5);
 assert.equal(g.husbandry191.view().pens[0].water,9);assert.equal(g.husbandry191.quote('water-carried',pen.id).ok,false);
 assert.doesNotThrow(()=>DeadwallSave.validate(g.serialize()));
});
test('199 native enclosure repairs use the real backpack and cannot alter terminal wildlife or other stocks',()=>{
 const {g,pen}=captured();prepare(g,raw=>{raw.expansions127.modules.husbandry191.pens[0].health=60;raw.player.carry.wood=3;raw.player.carry.scrap=2;});
 const stock=clone(g.resources),wild=clone(g.serialize().frontier.wildlife165),before=g.husbandry191.view();
 assert.ok(g.husbandry191.begin('repair',pen.id).ok);finish(g);const after=g.husbandry191.view();assert.equal(after.pens[0].health,85);
 assert.equal(g.player.carry.wood,0);assert.equal(g.player.carry.scrap,0);assert.deepEqual(g.resources,stock);assert.deepEqual(g.serialize().frontier.wildlife165,wild);
 assert.equal(after.animals[0].source,before.animals[0].source);assert.ok(after.animals[0].age>before.animals[0].age);assert.ok(after.animals[0].health<=before.animals[0].health);
 const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.deepEqual(g.husbandry191.view(),after);
});
test('199 native reproduction preference and optional behavior controls preserve unrelated saved owners',()=>{
 const {g,pen}=captured();const before=stable(g);assert.ok(g.husbandry191.begin('breeding-off',pen.id).ok);const after=stable(g);
 const expected=clone(before);expected.expansions127.modules.husbandry191.pens[0].breeding199=false;expected.expansions127.modules.husbandry191.pens[0].breed=0;
 assert.deepEqual(after,expected);assert.equal(g.restoreSave(g.serialize()),true);assert.equal(g.husbandry191.view().pens[0].breeding199,false);
 const bad=g.serialize();bad.expansions127.modules.husbandry191.pens[0].breed=1;const world=g.world;
 assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,world);assert.deepEqual(stable(g),expected);
});
