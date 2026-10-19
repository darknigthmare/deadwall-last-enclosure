'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
globalThis.DeadwallCore=require('../src/core.js');const Art=require('../src/husbandry191-art.js');
function draw(kind,progress,reducedMotion=false){
 const canvas=createCanvas(240,200),ctx=canvas.getContext('2d');ctx.translate(40,100);ctx.scale(130,130);ctx.globalAlpha=.8;ctx.setLineDash([.04,.02]);
 const pose={kind,progress,x:0,y:0,a:.2},before=JSON.stringify(pose),transform=ctx.getTransform(),dash=ctx.getLineDash();
 assert.equal(Art.drawWork(ctx,pose,{reducedMotion}),true);assert.equal(JSON.stringify(pose),before);assert.deepEqual(ctx.getTransform(),transform);assert.deepEqual(ctx.getLineDash(),dash);assert.equal(ctx.globalAlpha,.8);
 return canvas.toBuffer('image/png');
}
for(const kind of ['repair','fill-bucket','water-carried'])test('199 '+kind+' follows work progress and respects reduced motion without changing its owner',()=>{
 assert.notDeepEqual(draw(kind,.07),draw(kind,.13));assert.deepEqual(draw(kind,.07,true),draw(kind,.13,true));
});
test('199 field maintenance uses the existing attached hammer and bucket, not an unrelated animation',()=>{
 assert.deepEqual(draw('repair',.13),draw('build',.13));assert.deepEqual(draw('fill-bucket',.13),draw('water',.13));assert.deepEqual(draw('water-carried',.13),draw('water',.13));
});
