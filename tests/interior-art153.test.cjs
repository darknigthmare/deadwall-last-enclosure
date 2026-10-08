'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/interior-art153.js');
const G=require('../src/frontier-geometry.js');
const C=require('../src/core.js');
const root=path.resolve(__dirname,'..');
let images;
async function art(){
 if(!images)images=Object.fromEntries(await Promise.all(Object.entries(A.ASSETS).map(async([key,spec])=>[key,await loadImage(path.join(root,spec.url))])));
 return{images,blit(c,key,r,...destination){c.drawImage(images[key],...r,...destination);return true;}};
}
function opaqueBounds(canvas){
 const {data,width,height}=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);let l=width,t=height,r=-1,b=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 return{l,t,r,b};
}
test('every real regional furniture shape and all 62 place plans have a documented painter owner',()=>{
 const otherOwners={car:'vehicle-art152 / vehicle variants153',logs:'nature153',rubble:'nature153'};
 assert.equal(Object.keys(G.SHAPES).length,35);assert.equal(G.PRESETS.length,62);
 assert.equal(A.FURNITURE_FAMILIES.length,33);assert.equal(A.ROOF_FAMILIES.length,16);assert.equal(A.RUIN_FAMILIES.length,4);
 for(const id of Object.keys(G.SHAPES))assert.ok(A.spriteForFurniture(id)||otherOwners[id],id);
 for(const def of G.PRESETS){assert.ok(A.spriteForRoof(def.id),def.id);assert.ok(A.floorFamily({type:def.id},0),def.id);}
 for(const id of ['ruinedHouse','ruinedShop','warehouseShell','guardBooth']){assert.ok(C.SCENERY_DEFS[id]);assert.ok(A.RUINS[id]);}
 for(const id of ['counter','shelf','workbench','pump','vending'])assert.ok(A.spriteForFurniture(id));
});
test('all generated cuts and vector surfaces decode with their exact declared dimensions and nonempty alpha',async()=>{
 const painter=await art();
 for(const [key,spec]of Object.entries(A.ASSETS)){assert.ok(fs.statSync(path.join(root,spec.url)).size>100);assert.equal(painter.images[key].width,spec.width,key);assert.equal(painter.images[key].height,spec.height,key);}
 for(const groups of [A.FURNITURE,A.ROOFS,A.RUINS])for(const pair of Object.values(groups)){
  assert.equal(pair.length,2);assert.notDeepEqual(pair[0].rect,pair[1].rect);
  for(const sprite of pair){const spec=A.ASSETS[sprite.atlas],[x,y,w,h]=sprite.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=spec.width&&y+h<=spec.height);const c=createCanvas(w,h);c.getContext('2d').drawImage(painter.images[sprite.atlas],x,y,w,h,0,0,w,h);assert.ok(opaqueBounds(c).r>0,sprite.family);}
 }
});
test('seed, identity, floor and requested morphology are deterministic pure presentation inputs',()=>{
 const item=Object.freeze({id:'P141:bed:2',kind:'bed',variant:4,x:2,y:5,w:2.05,h:1.6,resource:'wood',amount:17});
 const before=JSON.stringify(item),seen=new Set();
 for(let seed=0;seed<20;seed++){
  const selected=A.spriteForFurniture(item,{seed,floor:1});assert.strictEqual(selected,A.spriteForFurniture({...item},{seed,floor:1}));seen.add(selected.variant);
 }
 assert.equal(seen.size,2);assert.equal(JSON.stringify(item),before);
 assert.equal(A.spriteForFurniture(item,{variant:0}).variant,0);assert.equal(A.spriteForFurniture(item,{variant:1}).variant,1);assert.equal(A.spriteForFurniture(item,{variant:-1}).variant,1);
 for(const kind of ['__proto__','constructor','missing']){assert.equal(A.spriteForFurniture(kind),null);assert.equal(A.spriteForRoof(kind),null);}
});
test('all furniture morphologies stay within the real physical rectangle, without source mutation',async()=>{
 const painter=await art();
 for(const family of A.FURNITURE_FAMILIES)for(const variant of [0,1]){
  const [w,h]=G.SHAPES[family]||[.875,1.0625],canvas=createCanvas(400,220),c=canvas.getContext('2d'),item=Object.freeze({id:family,kind:family,x:2,y:1,w,h,amount:12});
  c.scale(45,45);const before=JSON.stringify(item);assert.equal(A.drawFurniture(c,painter,item,{variant}),true,family);
  const b=opaqueBounds(canvas);assert.ok(b.r>b.l&&b.b>b.t,family);assert.ok(b.l>=89&&b.t>=44&&b.r<=Math.ceil((2+w)*45)&&b.b<=Math.ceil((1+h)*45),family+' physical frame');assert.equal(JSON.stringify(item),before);
 }
});
test('exhausted furniture fades once and leaves open-container or finite cache overlays to their owners',async()=>{
 const painter=await art(),item={kind:'crate',id:'crate:7',x:0,y:0,w:2,h:2,amount:8};
 const paint=(taken,stateAlpha=true)=>{const canvas=createCanvas(100,100),c=canvas.getContext('2d');c.scale(40,40);A.drawFurniture(c,painter,item,{taken,stateAlpha,variant:0});return [...c.getImageData(0,0,100,100).data].filter((_,i)=>i%4===3).reduce((sum,n)=>sum+n,0);};
 const full=paint(0),empty=paint(8);assert.ok(empty<full*.6&&empty>full*.5);assert.equal(paint(8,false),full);assert.equal(item.amount,8);
});
test('local wall shelves rotate only for opposite long axes and keep their real centred footprint',async()=>{
 const painter=await art(),item=Object.freeze({kind:'shelf',id:'station:shelf',x:50,y:30,w:22,h:82});
 const render=alignLongAxis=>{const canvas=createCanvas(150,150),c=canvas.getContext('2d');assert.equal(A.drawFurniture(c,painter,item,{variant:0,alignLongAxis}),true);return opaqueBounds(canvas);};
 const ordinary=render(false),aligned=render(true);assert.ok(aligned.b-aligned.t>ordinary.b-ordinary.t,'long wall shelf is upright');assert.ok(aligned.l>=50&&aligned.r<=72&&aligned.t>=30&&aligned.b<=112);
 const shape=Object.freeze({kind:'shelf',id:'station:shelf-horizontal',x:20,y:30,w:82,h:22});const canvas=createCanvas(150,150),c=canvas.getContext('2d');A.drawFurniture(c,painter,shape,{variant:0,alignLongAxis:true});const b=opaqueBounds(canvas);assert.ok(b.l>=20&&b.r<=102&&b.t>=30&&b.b<=52);assert.equal(item.w,22);assert.equal(item.h,82);
});
test('roof variants cover exact parcel rectangles at each orientation and never paint a physical door or wall',async()=>{
 const painter=await art();
 for(const family of A.ROOF_FAMILIES){const type=Object.keys(A.ROOF_ALIASES).find(id=>A.ROOF_ALIASES[id]===family);for(const variant of [0,1])for(let turn=0;turn<4;turn++){
  const canvas=createCanvas(300,300),c=canvas.getContext('2d');c.translate(150,150);c.rotate(turn*Math.PI/2);const rect={x:-70,y:-45,w:140,h:90};assert.equal(A.drawRoof(c,painter,{type,id:'roof:'+type,w:18,h:14},rect,{variant}),true);
  const b=opaqueBounds(canvas),halfW=turn%2?45:70,halfH=turn%2?70:45;assert.ok(b.l>=150-halfW&&b.r<=150+halfW&&b.t>=150-halfH&&b.b<=150+halfH,type+' '+turn);
 }}
});
test('local roof presentation follows the existing projected plane, with no gravity or facade transform',async()=>{
 const painter=await art(),canvas=createCanvas(320,240),c=canvas.getContext('2d'),rect={x:50,y:27,w:188,h:117};
 for(const type of Object.keys(A.LOCAL_ROOFS)){assert.equal(A.drawLocalRoof(c,painter,{type,id:type,x:140,y:108,w:188,h:117},rect),true,type);}
 const b=opaqueBounds(canvas);assert.ok(b.l>=50&&b.r<=238&&b.t>=27&&b.b<=144);for(const type of ['not-a-building','constructor','__proto__'])assert.equal(A.drawLocalRoof(c,painter,{type},rect),false);
});
test('material patterns use one cached 256px tile per context, family and image, aligned with the existing floor',async()=>{
 const painter=await art();let canvases=0;const previous=global.document;global.document={createElement(kind){assert.equal(kind,'canvas');canvases++;return createCanvas(256,256);}};
 try{
  const canvas=createCanvas(280,180),c=canvas.getContext('2d'),item=Object.freeze({type:'house',id:'P1',w:14,h:12}),rect={x:1,y:1,w:7,h:4};c.scale(22,22);
  assert.equal(A.drawFloor(c,painter,item,rect,{seed:9}),true);assert.equal(A.drawFloor(c,painter,item,rect,{seed:9}),true);assert.equal(canvases,1);
  const b=opaqueBounds(canvas);assert.ok(b.l>=22&&b.t>=22&&b.r<=176&&b.b<=110);
  assert.equal(A.floorFamily({type:'basementHouse'},-1),'concrete');assert.equal(A.floorFamily({type:'clinic'},0),'tile');assert.equal(A.floorFamily({type:'gym'},0),'rubber');
  assert.equal(A.drawFloor(c,{images:{}},item,rect),false);assert.equal(A.drawFloor(c,painter,item,{x:0,y:0,w:0,h:2}),false);
 }finally{global.document=previous;}
});
test('recoverable ruins keep finite amounts and actual scene positions while images can fail safely',async()=>{
 const painter=await art();for(const kind of A.RUIN_FAMILIES){const def=C.SCENERY_DEFS[kind],item=Object.freeze({id:kind,sceneryKind:kind,x:150,y:120,amount:def.amount,def});
  const before=JSON.stringify(item),canvas=createCanvas(300,240),c=canvas.getContext('2d');assert.equal(A.drawSceneryRuin(c,painter,item,{size:def.renderSize}),true);assert.equal(JSON.stringify(item),before);
  const b=opaqueBounds(canvas);assert.ok(b.l>=Math.floor(150-def.renderSize/2)&&b.r<=Math.ceil(150+def.renderSize/2));assert.equal(A.drawSceneryRuin(c,{images:{}},item),false);
 }
});
test('missing images, invalid frames and unsupported furniture return to the existing painter without touching canvas',()=>{
 const canvas=createCanvas(80,80),c=canvas.getContext('2d'),before=c.getImageData(0,0,80,80).data;
 assert.equal(A.drawFurniture(c,{images:{}},{kind:'bed',x:0,y:0,w:2,h:1}),false);assert.equal(A.drawFurniture(c,{images:{}},{kind:'unknown',x:0,y:0,w:2,h:1}),false);assert.equal(A.drawRoof(c,{images:{}},{type:'house'}),false);
 assert.deepEqual(c.getImageData(0,0,80,80).data,before);
});
