'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const native=require('@napi-rs/canvas'),Raster=require('../src/render-cache153.js');
const makeCanvas=()=>native.createCanvas(1,1),cache=options=>Raster.create({canvas:makeCanvas,...options});
function image(color='#72985e'){const s=native.createCanvas(512,512),c=s.getContext('2d');c.fillStyle=color;c.fillRect(25,35,405,400);c.clearRect(140,140,40,55);return s;}
function counted(frozen=true){let joins=0;const rect=[0,0,512,512];rect.join=function(separator){joins++;return Array.prototype.join.call(this,separator);};return{rect:frozen?Object.freeze(rect):rect,joins:()=>joins};}
test('metadata155: recurring immutable source rectangles reuse their key without retaining atlas/zoom history',()=>{
 const c=native.createCanvas(160,160).getContext('2d'),s=image(),memo=cache(),q=counted();let first;
 for(let i=0;i<100;i++){const r=memo.get(c,'tree',s,q.rect,55,55);assert.ok(r);first??=r;assert.equal(r,first);}
 assert.equal(q.joins(),1);assert.equal(memo.stats.hits,99);assert.equal(memo.items.size,1);assert.ok(memo.rectKeys instanceof WeakMap);
 c.scale(2,2);assert.equal(memo.get(c,'tree',s,q.rect,55,55).level,1);assert.equal(q.joins(),2);
 memo.get(c,'other',s,q.rect,55,55);assert.equal(q.joins(),3);assert.deepEqual(memo.rectKeys.get(q.rect),{atlas:'other',level:1,key:'other:0,0,512,512:1'});
 memo.clear();assert.equal(memo.rectKeys.has(q.rect),false);assert.equal(memo.bytes,0);assert.equal(memo.items.size,0);
});
test('metadata155: mutable cuts, source replacement and resize retain invalidation and bounded rasters',()=>{
 const c=native.createCanvas(160,160).getContext('2d'),a=image(),memo=cache({bytes:140000,entries:2}),q=counted(false),r=Object.freeze([0,0,512,512]);
 const first=memo.get(c,'tree',a,q.rect,55,55);q.rect[0]=32;q.rect[2]=480;const moved=memo.get(c,'tree',a,q.rect,55,55);assert.notEqual(moved,first);assert.equal(q.joins(),2);assert.equal(memo.rectKeys.has(q.rect),false);
 const original=memo.get(c,'tree',a,r,55,55),b=image('#914153'),replacement=memo.get(c,'tree',b,r,55,55);assert.notEqual(replacement,original);assert.equal(replacement.source,b);
 b.width=600;const resized=memo.get(c,'tree',b,r,55,55);assert.notEqual(resized,replacement);assert.equal(resized.sourceWidth,600);
 for(let i=0;i<30;i++)memo.get(c,'other'+i,a,Object.freeze([0,0,512,512]),55,55);
 assert.ok(memo.bytes<=140000);assert.ok(memo.items.size<=2);assert.ok(memo.stats.evictions>0);
});
test('metadata155: old and new cache paths retain exact Canvas pixels, sampling levels and context state',()=>{
 // Only the key bookkeeping is reverted for the previous-path pixel oracle;
 // the external audit additionally uses the source saved before this patch.
 const source=process.env.DEADWALL_RASTER_BASELINE?fs.readFileSync(process.env.DEADWALL_RASTER_BASELINE,'utf8'):fs.readFileSync(require.resolve('../src/render-cache153.js'),'utf8').replace(/const immutable=Object\.isFrozen\(rect\),memo=immutable\?this\.rectKeys\.get\(rect\):null;[\s\S]*?const old=this\.items\.get\(key\);/,"const key=atlas+':'+rect.join(',')+':'+level,old=this.items.get(key);");
 const module={exports:{}};vm.runInNewContext(source,{module});const old=module.exports.create({canvas:makeCanvas}),current=cache(),s=image(),rect=Object.freeze([0,0,512,512]);
 for(const scale of [.52,1,2,3.6])for(const reflected of [false,true]){
  const paint=m=>{const c=native.createCanvas(260,260).getContext('2d');c.translate(130.37,130.61);c.rotate(.7);c.scale(reflected?-scale:scale,scale);c.globalAlpha=.61;c.filter='brightness(.7)';const state=[c.getTransform().toJSON(),c.globalAlpha,c.filter],r=m.get(c,'atlas',s,rect,55,55);if(r)c.drawImage(r.image,0,0,r.width,r.height,-27.5,-27.5,55,55);else c.drawImage(s,...rect,-27.5,-27.5,55,55);assert.deepEqual([c.getTransform().toJSON(),c.globalAlpha,c.filter],state);return{level:r?.level||0,pixels:Buffer.from(c.getImageData(0,0,260,260).data)};};
  const a=paint(old),b=paint(current);assert.equal(b.level,a.level);assert.deepEqual(b.pixels,a.pixels);
 }
 for(const atlas of Raster.NATIVE_ACTORS)assert.equal(current.get(native.createCanvas(1,1).getContext('2d'),atlas,s,rect,55,55),null);
});
