'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
globalThis.DeadwallCore=require('../src/core.js');const A=require('../src/husbandry191-art.js'),{createCanvas}=require('@napi-rs/canvas');
function paint(progress,reducedMotion=false){const c=createCanvas(200,200),ctx=c.getContext('2d');ctx.translate(60,100);ctx.scale(75,75);const transform=ctx.getTransform(),s={kind:'slaughter',x:0,y:0,a:.2,progress};assert.ok(A.drawWork(ctx,s,{reducedMotion}));assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,1);return c.toBuffer('image/png');}
test('191 work forearms/tool animate from progress, freeze in reduced motion and restore painter state',()=>{assert.notDeepEqual(paint(.07),paint(.13));assert.deepEqual(paint(.07,true),paint(.13,true));});
test('191 a real procedural pen shows juvenile/captive silhouettes without changing custody',()=>{
 const c=createCanvas(600,440),ctx=c.getContext('2d');ctx.translate(270,200);ctx.scale(95,95);
 const pen={id:1,x:0,y:0,health:100,water:16,food:12,meat:2,leather:1},animals=[{id:2,source:'A189_0_0_0',species:'rabbit',health:100,age:1000},{id:4,source:null,species:'rabbit',health:100,age:10}],before=JSON.stringify({pen,animals}),transform=ctx.getTransform();
 assert.ok(A.drawPen(ctx,pen,animals));assert.equal(JSON.stringify({pen,animals}),before);assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,1);
});
