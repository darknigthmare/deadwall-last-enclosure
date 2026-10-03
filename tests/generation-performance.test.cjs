'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),W=require('../src/frontier-world.js'),{describeWorld}=require('./helpers/world-generation-digest.cjs'),preserved=require('./fixtures/world-generation141-preserved.json');

for(const expected of preserved.rows)test('generation performance: G7 preserves release geometry, every floor, finite nodes and threats for seed '+expected.seed,()=>{
 const world=W.create(expected.seed,7);
 assert.deepEqual(describeWorld(world),expected);
 assert.ok(world.cacheSize()<=W.RULES.chunkCache);
 assert.ok(world.planCacheSize()<=W.RULES.planCache);
 // Eviction must not alter the original map's content.
 const first=JSON.parse(JSON.stringify(world.chunk(0,0))),plan=JSON.parse(JSON.stringify(world.plan(world.pois[0],0)));
 for(let i=1;i<=W.RULES.chunkCache+1;i++)world.chunk(i,i);
 for(const p of world.pois.slice(1,W.RULES.planCache+2))world.plan(p,0);
 assert.deepEqual(world.chunk(0,0),first);
 assert.deepEqual(world.plan(world.pois[0],0),plan);
 assert.ok(world.cacheSize()<=W.RULES.chunkCache);
 assert.ok(world.planCacheSize()<=W.RULES.planCache);
});
