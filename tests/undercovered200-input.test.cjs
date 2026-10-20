'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{bootGame}=require('./helpers/browser.cjs');
function setup(){const{game:g}=bootGame();g.startNew('standard','17117');g.paused=false;g.activeOverlay=null;g.render=()=>{};g.lastFrame=0;return g;}
test('200 an active slow frame does not discard a queued reload before any simulation consumes it',()=>{
 const g=setup(),delivered=[],steps=[];g.update=dt=>{steps.push(dt);delivered.push([...g.input.pressed]);};g.input.pressed.add('KeyR');g.loop(1000);
 assert.equal(steps.length,0,'no catch-up debt or simulation added');assert.equal(g.input.pressed.has('KeyR'),true);g.loop(1016);g.loop(1032);assert.deepEqual(delivered,[['KeyR'],[]]);assert.deepEqual(steps,[.016,.016]);
});
for(const stop of [g=>g.paused=true,g=>g.activeOverlay={},g=>g.gameOver=true,g=>g.state='menu',()=>globalThis.document.hidden=true])test('200 stalled input is discarded when control is surrendered: '+stop,()=>{
 const g=setup();g.update=()=>assert.fail('must not simulate');g.input.pressed.add('KeyR');g.loop(1000);stop(g);g.loop(2000);assert.equal(g.input.pressed.size,0);globalThis.document.hidden=false;
});
