'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
require('../src/frontier-geometry.js');require('../src/frontier-art.js');const Art=globalThis.DeadwallFrontierArt;
function parcel(generation,type='cabin'){return{id:'P0141',type,generation,x:0,y:0,w:9,h:8,a:0,parking:[],outdoor:[]};}
function render(p,z=0){const c=createCanvas(600,600),ctx=c.getContext('2d');ctx.fillStyle='#40553a';ctx.fillRect(0,0,600,600);ctx.translate(300,300);ctx.scale(10,10);Art.lotGround(ctx,p,{z});return c;}
function pixel(c,x,y){return Array.from(c.getContext('2d').getImageData(Math.round(300+x*10),Math.round(300+y*10),1,1).data);}
test('parcel141: historic cabin paint stays unchanged while G7 keeps natural ground outside its real support',()=>{
 const old=render(parcel(6)),fresh=render(parcel(7));assert.notDeepEqual(pixel(old,-9,-10),[64,85,58,255]);assert.deepEqual(pixel(fresh,-9,-10),[64,85,58,255]);assert.notDeepEqual(pixel(fresh,0,-10),[64,85,58,255],'Actual central approach still has a prepared surface');
});
test('parcel141: rural parking pads follow the actual parked vehicle pose and never move its collision',()=>{
 const p=parcel(7),cv={id:'P0141:car:0',x:-8,y:-10,w:4.6,h:1.85,a:.6};p.parking.push(cv);const before=JSON.stringify(p),c=render(p);assert.notDeepEqual(pixel(c,-8,-10),[64,85,58,255]);assert.equal(JSON.stringify(p),before);assert.deepEqual(c.toBuffer('image/png'),render(p).toBuffer('image/png'));
});
test('parcel141: commercial service yard and above-ground priority remain explicit',()=>{
 const p=parcel(7,'warehouse'),c=render(p);assert.notDeepEqual(pixel(c,-9,-10),[64,85,58,255]);assert.deepEqual(pixel(render(p,1),-9,-10),[64,85,58,255]);assert.deepEqual(pixel(render(p,-1),-9,-10),[64,85,58,255]);
});
