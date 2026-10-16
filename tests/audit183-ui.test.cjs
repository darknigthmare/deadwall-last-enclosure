'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {installFakeBrowser}=require('./helpers/browser.cjs');
const UI=require('../src/vertical-citadel175-ui.js');
function setup(){
 const env=installFakeBrowser(),doc=globalThis.document;globalThis.DeadwallCore=require('../src/core.js');
 const state={view:'fps',controlled:1},module={m:{yaw:0,pitch:0}};
 const V={presentation:()=>state,moduleRef:()=>module,setView:v=>{state.view=v;return true;},aim:(yaw,pitch)=>Object.assign(module.m,{yaw,pitch})};
 const g={vertical175:V,input:{mouseDown:false,touchFire:false},state:'playing',paused:false,activeOverlay:null,gameOver:false,player:{dead:false},render(){},notify(){}};
 UI.install(g,doc);return{...env,g,state,doc,canvas:doc.body.querySelectorAll('#vertical175canvas')[0],fire:doc.body.querySelectorAll('#vertical175fire')[0],module};
}
test('183 right drag aims without firing; primary mouse fire releases with its owner',()=>{
 const {g,canvas,module}=setup();canvas.dispatch('pointerdown',{pointerId:7,pointerType:'mouse',button:2,buttons:2,clientX:1,clientY:2});
 assert.equal(g.input.mouseDown,false);canvas.dispatch('pointermove',{pointerId:7,pointerType:'mouse',buttons:2,clientX:11,clientY:4});assert.ok(module.m.yaw>0);assert.equal(g.input.mouseDown,false);
 canvas.dispatch('pointerup',{pointerId:7});canvas.dispatch('pointerdown',{pointerId:8,pointerType:'mouse',button:0});assert.equal(g.input.mouseDown,true);
 canvas.dispatch('pointercancel',{pointerId:9});assert.equal(g.input.mouseDown,true);canvas.dispatch('lostpointercapture',{pointerId:8});assert.equal(g.input.mouseDown,false);
});
test('183 trigger ownership survives unrelated touches and combines keyboard/pointer holds',()=>{
 const {g,fire}=setup();fire.dispatch('pointerdown',{pointerId:21});assert.equal(g.input.touchFire,true);
 fire.dispatch('pointercancel',{pointerId:22});assert.equal(g.input.touchFire,true);fire.dispatch('keydown',{key:' '});
 fire.dispatch('pointerup',{pointerId:21});assert.equal(g.input.touchFire,true);fire.dispatch('keyup',{key:' '});assert.equal(g.input.touchFire,false);
 fire.dispatch('pointerdown',{pointerId:24});fire.dispatch('keydown',{key:'Enter'});fire.dispatch('keyup',{key:'Enter'});assert.equal(g.input.touchFire,true);fire.dispatch('lostpointercapture',{pointerId:24});assert.equal(g.input.touchFire,false);
});
test('183 pause, hidden view and dead actors cannot initiate FPS firing',()=>{
 const {g,state,fire,canvas}=setup();
 for(const apply of [()=>g.paused=true,()=>g.activeOverlay={},()=>g.player.dead=true,()=>state.view='classic',()=>state.controlled=null]){
  g.paused=false;g.activeOverlay=null;g.player.dead=false;state.view='fps';state.controlled=1;apply();
  fire.dispatch('pointerdown');fire.dispatch('keydown',{key:'Enter'});canvas.dispatch('pointerdown',{pointerType:'mouse',button:0});assert.equal(g.input.mouseDown,false);assert.equal(g.input.touchFire,false);
 }
});
test('183 focus loss and control release clear all trigger owners',()=>{
 const {g,fire,canvas,dispatchWindow}=setup();fire.dispatch('pointerdown',{pointerId:2});canvas.dispatch('pointerdown',{pointerId:3,pointerType:'mouse',button:0});
 dispatchWindow('blur');assert.equal(g.input.touchFire,false);assert.equal(g.input.mouseDown,false);
 fire.dispatch('pointerdown',{pointerId:4});g.vertical175UI.release();assert.equal(g.input.touchFire,false);assert.equal(g.input.mouseDown,false);
});
