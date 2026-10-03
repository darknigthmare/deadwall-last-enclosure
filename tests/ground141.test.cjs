'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
const B=require('../src/biomes135.js'),Ground=require('../src/ground135.js');
const pal=B.BY.meadow.palette;
function world(id='meadow',seed=17117,habitat){return{seed,generation:6,biomeAt:()=>({id,weights:{[id]:1},palette:pal,habitat})};}
function render(w,v={l:28,r:36,t:28,b:36},scale=16){const c=createCanvas(Math.round((v.r-v.l)*scale),Math.round((v.b-v.t)*scale)),ctx=c.getContext('2d');ctx.scale(scale,scale);ctx.translate(-v.l,-v.t);Ground.draw(ctx,w,v,{scale});return c;}
function native(){globalThis.document={createElement:()=>createCanvas(1,1)};Ground.reset();}
test('ground141: conifer litter, mineral ground and damp mud receive their own continuous material cover',()=>{
 const p=[832.25,1767.73],plain=Ground.materialAt(world(),...p),forest=Ground.materialAt(world('conifer'),...p),rock=Ground.materialAt(world('rockyHighland'),...p),wet=Ground.materialAt(world('wetland'),...p);
 assert.ok(forest.litter>plain.litter+.25);assert.ok(rock.mineralCover>plain.mineralCover+.1);assert.ok(wet.damp>plain.damp+.1);assert.equal(forest.forest,1);assert.equal(plain.forest,0);
 for(const w of [world(),world('conifer'),world('rockyHighland'),world('wetland')])for(const [key,value]of Object.entries(Ground.materialAt(w,...p)))assert.ok(Number.isFinite(value)&&value>=0&&value<=1,key+' is a bounded presentation field');
});
test('ground141: changing the dominant name cannot jump the soil while the ecology weights stay equal',()=>{
 const sample={weights:{meadow:.49,conifer:.51},palette:pal},a={seed:14,generation:6,biomeAt:()=>({...sample,id:'meadow'})},b={seed:14,generation:6,biomeAt:()=>({...sample,id:'conifer'})};
 for(const p of [[-32,.9],[128.001,73.23],[14521.38,13842.12]]){assert.deepEqual(Ground.materialAt(a,...p),Ground.materialAt(b,...p));assert.deepEqual(Ground.colorAt(a,...p),Ground.colorAt(b,...p));}
});
test('ground141: actual G7 habitat cover and orchard row strength shape the soil without adding saved state',()=>{
 const forest=world('conifer',17117,{canopy:.85,openness:.15,mineral:0,wetness:0,rowStrength:0}),clearing=world('conifer',17117,{canopy:.12,openness:.88,mineral:0,wetness:0,rowStrength:0}),row=world('orchard',17117,{canopy:.2,openness:.8,mineral:0,wetness:0,rowStrength:.9}),aisle=world('orchard',17117,{canopy:.2,openness:.8,mineral:0,wetness:0,rowStrength:0}),p=[1106.8,3791.4];
 assert.ok(Ground.materialAt(forest,...p).litter>Ground.materialAt(clearing,...p).litter);assert.ok(Ground.materialAt(row,...p).soil>Ground.materialAt(aisle,...p).soil+.2);
 const state=JSON.stringify([forest,clearing,row,aisle]);for(const w of [forest,clearing,row,aisle])Ground.colorAt(w,...p);assert.equal(JSON.stringify([forest,clearing,row,aisle]),state);
});
test('ground141: late-loaded forest texture really paints conifer ground and invalidates its cached raster',()=>{
 native();const original=globalThis.DEADWALL,w=world('conifer');globalThis.DEADWALL={art:{images:{}}};
 try{const before=render(w).getContext('2d').getImageData(0,0,128,128).data,texture=createCanvas(256,256),c=texture.getContext('2d');c.fillStyle='#e0401c';c.fillRect(0,0,256,256);globalThis.DEADWALL.art.images.art136ForestFloor=texture;
  const after=render(w).getContext('2d').getImageData(0,0,128,128).data;let changed=0;for(let i=0;i<before.length;i+=4)if(after[i]!==before[i]||after[i+1]!==before[i+1]||after[i+2]!==before[i+2])changed++;assert.ok(changed>2000,'Conifer texture must be visible over a substantial area, changed '+changed+' pixels');
 }finally{globalThis.DEADWALL=original;Ground.reset();}
});
test('ground141: dense litter and mineral detail remain camera independent across native tile seams',()=>{
 native();const w={seed:17117,generation:7,biomeAt:(x,y)=>B.sample(17117,x,y,true,{generation:7})},v={l:28,r:36,t:252,b:260},a=render(w,v),b=render(w,{l:26,r:38,t:250,b:262});
 const ca=a.getContext('2d').getImageData(0,0,128,128).data,cb=b.getContext('2d').getImageData(32,32,128,128).data;assert.deepEqual(ca,cb);for(let i=3;i<ca.length;i+=4)assert.equal(ca[i],255);
});
test('ground141: new branch and reed art uses the shared renderer and the existing passable decorator footprint',()=>{
 const oldAssets=globalThis.DeadwallAssets136,oldGame=globalThis.DEADWALL,c=createCanvas(128,128).getContext('2d'),calls=[];
 globalThis.DeadwallAssets136={drawSprite(ctx,art,key,x,y,w,h){calls.push({key,x,y,w,h});return true;}};globalThis.DEADWALL={art:{}};
 try{const d={id:'D135_1_1_2',x:32,y:32,a:.7,r:.61,kind:'reeds'},before=JSON.stringify(d);Ground.drawDecor(c,d);assert.equal(JSON.stringify(d),before);Ground.drawDecor(c,{...d,kind:'fallenBranch'});assert.deepEqual(calls.map(q=>q.key),['art141Reeds','art141FallenBranch']);assert.ok(calls.every(q=>q.w===1.22&&q.h===1.22));}finally{globalThis.DeadwallAssets136=oldAssets;globalThis.DEADWALL=oldGame;}
});
