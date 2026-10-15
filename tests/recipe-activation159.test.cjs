'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/codex3000-runtime.js');
const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const checkpoint=g=>{const s=g.serialize();delete s.timestamp;return s;};
function campaign(){const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();return g;}
test('159 activation: only explicit depot action changes the saved detail version, no stock or RNG gain',()=>{
 const g=campaign(),before=checkpoint(g);assert.notEqual(before.frontier.detailVersion,2);
 const a=g.worldOps131.actions().find(x=>x.id==='richDetails159');assert.ok(a&&!a.disabled,a?.reason);
 const result=a.run();assert.equal(result.ok,true,result.reason);const after=checkpoint(g);
 assert.equal(after.frontier.detailVersion,2);after.frontier.detailVersion=before.frontier.detailVersion;
 assert.deepEqual(after,before,'all persisted gameplay outside the explicit version remains unchanged');
 const repeat=g.worldOps131.actions().find(x=>x.id==='richDetails159');assert.equal(repeat.disabled,true);assert.equal(repeat.run().ok,false);
});
test('159 activation: reload or absence from the depot refuses atomically with matching UI reason',()=>{
 const g=campaign();g.player.reload=1;const before=checkpoint(g),a=g.worldOps131.actions().find(x=>x.id==='richDetails159');
 assert.ok(a.disabled);const result=a.run();assert.equal(result.ok,false);assert.equal(result.reason,a.reason);assert.deepEqual(checkpoint(g),before);
 g.player.reload=0;g.player.x=100;g.player.y=100;const remote=checkpoint(g);assert.equal(g.worldOps131.upgradeDetails159().ok,false);assert.deepEqual(checkpoint(g),remote);
});
