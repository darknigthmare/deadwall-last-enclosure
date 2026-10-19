'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Forage=require('../src/forage193.js');
function fixture(){
 let record;const g={world:{seed:17117},frontier:{},expansions:{register:r=>record=r},update(){},returnToMenu(){},
  startNew(){record.reset();throw Error('rejected by another campaign owner');}};
 Forage.install(g);return{g,record};
}
test('199 a failed new-campaign wrapper cannot clear finite forage history when the world was not replaced',()=>{
 const {g,record}=fixture(),old={version:1,enabled:true,harvested:['F193_0_0_0']};record.restore(old);const identity=g.world;
 assert.throws(()=>g.startNew(),/rejected/);assert.equal(g.world,identity);assert.deepEqual(g.forage193.snapshot(),old);
});
