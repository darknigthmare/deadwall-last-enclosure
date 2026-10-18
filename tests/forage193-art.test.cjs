'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas'),{createHash}=require('node:crypto'),A=require('../src/forage-art193.js');
test('193 all sixteen low ground species and their four variants paint distinct real pixels without changing their source or canvas state',()=>{
 const hashes=new Set(),old=Math.random;Math.random=()=>assert.fail('No mutable randomness in presentation');
 try{for(const species of Object.keys(A.styles)){
  const variants=new Set();for(let variant=0;variant<4;variant++){
   const q=Object.freeze({id:'F193_1_2_0',species,x:0,y:0,a:0,length:.8,width:.7,variant}),c=createCanvas(128,128).getContext('2d');c.translate(64,64);c.scale(100,100);const before=c.getTransform().toJSON(),serialized=JSON.stringify(q);assert.equal(A.draw(c,q),true);assert.deepEqual(c.getTransform().toJSON(),before);assert.equal(JSON.stringify(q),serialized);
   const pixels=c.getImageData(0,0,128,128).data,count=pixels.filter((n,i)=>i%4===3&&n).length;assert.ok(count>100,'An actual visible ground prop exists for '+species);const hash=createHash('sha256').update(pixels).digest('hex');variants.add(hash);if(variant===0)hashes.add(hash);
  }assert.equal(variants.size,4,'Four authored cosmetic variants for '+species);
 }assert.equal(hashes.size,16,'Every species has its own visible identity');}finally{Math.random=old;}
});
test('193 depth entries obey current visibility, ground floor and culling; only the actual task animates',()=>{
 const q={id:'F193_1_2_0',species:'blackberry',x:2,y:3,a:0,length:.8,width:.7,variant:1},g={elapsed:1,settings:{},forage193:{active:()=>true,visible:()=>[q],presentation:()=>null}},view={l:0,r:8,t:0,b:8};
 assert.equal(A.depthEntries(g,{z:1},view).length,0);assert.equal(A.depthEntries(g,{z:0},{l:50,r:60,t:50,b:60}).length,0);assert.equal(A.depthEntries(g,{z:0},view).length,1);g.forage193.visible=()=>[];assert.equal(A.depthEntries(g,{z:0},view).length,0);
 g.forage193.visible=()=>[q];const hash=(time,task)=>{const c=createCanvas(128,128).getContext('2d');c.translate(64,64);c.scale(70,70);A.draw(c,{...q,x:0,y:0},{time,task:task?{...task,target:{x:0,y:0}}:null});return createHash('sha256').update(c.getImageData(0,0,128,128).data).digest('hex');};
 assert.equal(hash(0,null),hash(1,null),'Idle resources do not pretend to gather themselves');const task={kind:'forage',species:q.species,x:1,y:3,target:{x:q.x,y:q.y},progress:.3};assert.notEqual(hash(0,task),hash(1,task));g.forage193.presentation=()=>task;assert.equal(A.depthEntries(g,{z:0},view).length,2,'The real task adds a separate hand gesture');
});
