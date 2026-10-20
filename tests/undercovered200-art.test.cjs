'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
globalThis.DeadwallCore=require('../src/core.js');const A=require('../src/husbandry191-art.js');
function render(progress,reducedMotion=false){const canvas=createCanvas(240,200),c=canvas.getContext('2d');c.translate(40,100);c.scale(130,130);c.globalAlpha=.8;c.setLineDash([.04,.02]);const pose={kind:'care',progress,x:0,y:0,a:.2},before=JSON.stringify(pose),matrix=c.getTransform(),dash=c.getLineDash();assert.equal(A.drawWork(c,pose,{reducedMotion}),true);assert.equal(JSON.stringify(pose),before);assert.deepEqual(c.getTransform(),matrix);assert.deepEqual(c.getLineDash(),dash);assert.equal(c.globalAlpha,.8);return canvas.toBuffer('image/png');}
test('200 care gesture follows task progress and honors reduced motion without changing state',()=>{assert.notDeepEqual(render(.07),render(.13));assert.deepEqual(render(.07,true),render(.13,true));});
