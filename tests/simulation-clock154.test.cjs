'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js');

function fixture(){
  const env=bootGame(),g=env.game;
  g.startNew('standard','54831');g.paused=false;g.activeOverlay=null;g.render=()=>{};g.lastFrame=0;
  return {...env,g};
}

test('clock154: native countdown and play time advance equally at 10, 15, 20, 60 and 120 display Hz',()=>{
  const {g}=fixture(),base=JSON.parse(JSON.stringify(g.serialize()));
  for(const hz of [10,15,20,60,120]){
    g.restoreSave(base);g.paused=false;g.activeOverlay=null;g.lastFrame=0;
    const elapsed=g.elapsed,played=g.stats.playSeconds,phase=g.phaseTime;
    for(let frame=1;frame<=hz*5;frame++)g.loop(frame*1000/hz);
    assert.ok(Math.abs(g.elapsed-elapsed-5)<1e-9,hz+' Hz campaign clock');
    assert.ok(Math.abs(g.stats.playSeconds-played-5)<1e-9,hz+' Hz play record');
    assert.ok(Math.abs(phase-g.phaseTime-5)<1e-8,hz+' Hz preparation countdown');
  }
});

test('clock154: a slow frame delivers one press, bounded physical steps and one paint',()=>{
  const {g}=fixture(),steps=[],edges=[];let paints=0;
  g.update=dt=>{steps.push(dt);edges.push(g.input.pressed.has('KeyR'));};g.render=()=>paints++;
  g.input.pressed.add('KeyR');g.loop(100);
  assert.equal(steps.length,3);assert.ok(steps.every(dt=>dt>0&&dt<=C.SIMULATION_RULES.maxStepSeconds));
  assert.ok(Math.abs(steps.reduce((a,b)=>a+b,0)-.1)<1e-12);
  assert.deepEqual(edges,[true,false,false]);assert.equal(paints,1);
  g.loop(350);assert.equal(steps.length,10,'a 250 ms frame uses at most seven updates');assert.equal(paints,2);
});

test('clock154: zero-time callbacks preserve a press until the next positive simulation step',()=>{
  const {g}=fixture(),edges=[];g.update=()=>edges.push(g.input.pressed.has('KeyB'));
  g.input.pressed.add('KeyB');g.loop(0);g.loop(0);
  assert.deepEqual(edges,[]);assert.equal(g.input.pressed.has('KeyB'),true);
  g.loop(16);assert.deepEqual(edges,[true]);assert.equal(g.input.pressed.size,0);
});

test('clock154: a modal, pause, defeat or scene exit stops the remaining steps of the current frame',()=>{
  for(const stop of [g=>g.paused=true,g=>g.gameOver=true,g=>g.activeOverlay={},g=>g.state='menu']){
    const {g}=fixture();let updates=0,paints=0;
    g.update=()=>{updates++;stop(g);};g.render=()=>paints++;
    g.input.pressed.add('Space');g.loop(250);
    assert.equal(updates,1);assert.equal(paints,1);assert.equal(g.input.pressed.size,0);
  }
});

test('clock154: hidden tabs, pauses and long stalls create no catch-up debt',()=>{
  const {g}=fixture(),steps=[];g.update=dt=>steps.push(dt);
  g.loop(100);assert.equal(steps.length,3);steps.length=0;
  globalThis.document.hidden=true;g.input.pressed.add('Space');g.loop(200);
  assert.deepEqual(steps,[]);assert.equal(g.input.pressed.size,0);
  globalThis.document.hidden=false;g.loop(216);assert.deepEqual(steps,[.016]);steps.length=0;
  g.paused=true;g.loop(316);g.paused=false;g.loop(332);assert.deepEqual(steps,[.016]);steps.length=0;
  g.loop(2000);assert.deepEqual(steps,[]);g.loop(2016);assert.deepEqual(steps,[.016]);
});

test('clock154: closing a pause between animation callbacks resets the wall-time baseline',()=>{
  const {g}=fixture(),prior=globalThis.performance;let wall=0;const steps=[];
  globalThis.performance={now:()=>wall};g.update=dt=>steps.push(dt);
  try{
    g.lastFrame=0;wall=100;g.togglePause(true);assert.equal(g.lastFrame,100);
    wall=300;g.togglePause(false);assert.equal(g.lastFrame,300);
    g.loop(316);assert.deepEqual(steps,[.016]);
  }finally{globalThis.performance=prior;}
});

test('clock154: invalid and reversed timestamps cannot poison finite campaign time',()=>{
  const {g}=fixture(),steps=[];g.update=dt=>steps.push(dt);
  g.loop(NaN);assert.equal(steps.length,0);assert.ok(Number.isFinite(g.lastFrame));
  g.loop(g.lastFrame-1);assert.equal(steps.length,0);
  g.loop(g.lastFrame+16);assert.deepEqual(steps,[.016]);
});
