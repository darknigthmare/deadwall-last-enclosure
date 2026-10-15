'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const{createCanvas}=require('@napi-rs/canvas'),Water=require('../src/water-art165.js'),Wild=require('../src/wildlife-art165.js');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const view={l:0,r:20,t:0,b:20};
const river={id:'r',kind:'river',shape:'line',points:[{x:2,y:5,level:2},{x:18,y:5,level:0}],width:2,bankWidth:1,depth:1,salinity:'fresh',flowing:true};
const world=(features=[river],crossings=[])=>({generation:8,hydrologyVersion:1,hydrology:{featuresIn:()=>features,crossings}});
function raster(w,options={}){const c=createCanvas(320,320),ctx=c.getContext('2d');ctx.fillStyle='#d0cab0';ctx.fillRect(0,0,320,320);ctx.scale(16,16);Water.draw(ctx,w,view,{scale:16,...options});return c;}
function rgb(c,x,y){return[...c.getContext('2d').getImageData(Math.round(x*16),Math.round(y*16),1,1).data].slice(0,3);}
const hex=h=>h.match(/\w\w/g).map(v=>parseInt(v,16));
const sizes={duck:[.55,.26],heron:[.9,.3],roeDeer:[1.25,.42],boar:[1.3,.55],hare:[.55,.22],gull:[.6,.24]};
function animal(species,variant=0){const[length,width]=sizes[species];return{id:'a:'+species,species,variant,x:1,y:1,z:0,a:0,hp:12,maxHealth:12,length,width,moving:true,stride165:1};}
function animalRaster(a,options={}){const c=createCanvas(192,192),ctx=c.getContext('2d');ctx.scale(80,80);ctx.translate(.2,.2);Wild.drawAnimal(ctx,a,options);return c;}
function mask(c){const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data,b=Buffer.alloc(c.width*c.height);for(let i=0;i<b.length;i++)b[i]=p[i*4+3]>128?255:0;return b;}

test('165 water painter leaves old campaigns and malformed views untouched',()=>{
 const c=new Proxy({},{get(){assert.fail('old campaigns must retain their original painter');}});
 assert.equal(Water.draw(c,{hydrologyVersion:0},view),false);assert.equal(Water.drawCrossings(c,{hydrologyVersion:0},view),0);
 assert.equal(Water.draw(c,world(),{l:NaN,r:20,t:0,b:20}),false);assert.equal(Water.draw(c,world(),view,{scale:0}),false);
});
test('165 water and banks use the same real line width in landscape and map',()=>{
 const w=world(),c=raster(w,{map:true});assert.deepEqual(rgb(c,10,5),hex(Water.STYLE.river.water));assert.deepEqual(rgb(c,10,6.5),hex(Water.STYLE.river.bank));assert.deepEqual(rgb(c,10,7.5),[208,202,176]);
});
test('165 closed polygon points take priority over the ellipse metadata for the physical water footprint',()=>{
 const body={id:'p',kind:'pond',shape:'polygon',points:[{x:4,y:4},{x:12,y:4},{x:4,y:12}],ellipse:{cx:8,cy:8,rx:7,ry:7,a:0},bankWidth:0,depth:1};
 const c=raster(world([body]),{map:true});assert.deepEqual(rgb(c,6,6),hex(Water.STYLE.pond.water));assert.deepEqual(rgb(c,11,11),[208,202,176]);
 const textured=raster(world([body]),{time:4});assert.deepEqual(rgb(textured,11,11),[208,202,176]);
 for(let y=4;y<13;y+=.25)for(let x=4;x<13;x+=.25)if(x+y>16.3)assert.deepEqual(rgb(textured,x,y),[208,202,176],'depth and ripples must remain inside the physical polygon');
});
test('165 every freshwater and saltwater family has a bounded metric painter and an honest name',()=>{
 for(const kind of['pool','pond','lake','stream','river','sea','ocean']){const f={...river,id:kind,kind,shape:['sea','ocean'].includes(kind)?'polygon':'line',points:['sea','ocean'].includes(kind)?[{x:2,y:2},{x:18,y:2},{x:18,y:18},{x:2,y:18}]:river.points};const c=raster(world([f]),{map:true});assert.deepEqual(rgb(c,10,5),hex(Water.STYLE[kind].water),kind);assert.ok(Water.describe({kind,water:true,salinity:['sea','ocean'].includes(kind)?'salt':'fresh'}).includes(['sea','ocean'].includes(kind)?'salée':'douce'));}
 assert.equal(Water.describe({kind:'constructor'}),'');
});
test('165 water animation reads active simulation time, while reduced motion and maps remain static',()=>{
 const w=world(),a=digest(raster(w,{time:0}).toBuffer('image/png')),b=digest(raster(w,{time:3}).toBuffer('image/png'));assert.notEqual(a,b);
 assert.deepEqual(raster(w,{time:3}).toBuffer('image/png'),raster(w,{time:3}).toBuffer('image/png'));
 assert.deepEqual(raster(w,{time:0,reducedMotion:true}).toBuffer('image/png'),raster(w,{time:100,reducedMotion:true}).toBuffer('image/png'));
 assert.deepEqual(raster(w,{time:0,map:true}).toBuffer('image/png'),raster(w,{time:100,map:true}).toBuffer('image/png'));
});
test('165 painters preserve source geometry, transforms and alpha without consuming random numbers',()=>{
 const w=world(),saved=JSON.stringify(w.hydrology.featuresIn()),c=createCanvas(320,320).getContext('2d');c.translate(2,3);c.scale(2,3);c.globalAlpha=.6;const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,previous=Math.random;Math.random=()=>assert.fail('presentation must never consume simulation RNG');
 try{assert.equal(Water.draw(c,w,view,{time:2}),true);for(const species of Wild.SPECIES){const a=animal(species),before=JSON.stringify(a);assert.equal(Wild.drawAnimal(c,a),true);assert.equal(JSON.stringify(a),before);}}finally{Math.random=previous;}
 assert.equal(JSON.stringify(w.hydrology.featuresIn()),saved);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);
});
test('165 bridge deck follows the real road angle, width and length, culling distant and invalid bridges',()=>{
 const crossing={id:'bridge',x:10,y:10,a:0,width:3,length:8},w=world([],[crossing,{...crossing,id:'far',x:900},{...crossing,id:'invalid',width:-1}]),c=createCanvas(320,320),ctx=c.getContext('2d');ctx.scale(16,16);assert.equal(Water.drawCrossings(ctx,w,view,{scale:16,map:true}),1);assert.deepEqual(rgb(c,10,10),[115,123,112]);assert.equal(c.getContext('2d').getImageData(10*16,12*16,1,1).data[3],0);assert.equal(c.getContext('2d').getImageData(15*16,10*16,1,1).data[3],0);
});
test('165 six animal species have four genuinely distinct silhouette variants at their own metric size',()=>{
 assert.deepEqual(Wild.SPECIES,Object.keys(sizes));for(const species of Wild.SPECIES){const hashes=new Set();for(let v=0;v<4;v++){const c=animalRaster(animal(species,v)),alpha=mask(c);assert.ok(alpha.filter(v=>v).length>40,species+' visible');hashes.add(digest(alpha));}assert.equal(hashes.size,4,species+' four physical silhouette masks');}
});
test('165 gait follows only the actual movement phase and respects reduced motion',()=>{
 for(const species of Wild.SPECIES){const a=animal(species),b={...a,stride165:2.4};assert.notDeepEqual(animalRaster(a).toBuffer('image/png'),animalRaster(b).toBuffer('image/png'),species+' gait phase');assert.deepEqual(animalRaster({...a,moving:false}).toBuffer('image/png'),animalRaster({...b,moving:false}).toBuffer('image/png'));assert.deepEqual(animalRaster(a,{reducedMotion:true}).toBuffer('image/png'),animalRaster(b,{reducedMotion:true}).toBuffer('image/png'));}
});
test('165 dead or unsupported animals never gain a cosmetic replacement or stale corpse',()=>{
 const c=new Proxy({},{get(){assert.fail('invalid animal must not paint');}});assert.equal(Wild.drawAnimal(c,{...animal('duck'),hp:0}),false);assert.equal(Wild.drawAnimal(c,{...animal('duck'),species:'constructor'}),false);assert.equal(Wild.drawAnimal(c,{...animal('duck'),length:-1}),false);
});
test('165 animals join the same depth queue and appear on maps only while an ally physically observes them',()=>{
 const near=animal('roeDeer'),hidden={...animal('boar'),id:'hidden',x:3},dead={...animal('hare'),id:'dead',hp:0},far={...animal('gull'),id:'far',x:100},g={settings:{},frontier:{wildlife165:()=>[near,hidden,dead,far]},visibility:{frame:()=>({canSeeRegional:a=>a.id!=='hidden'})}},v={z:0};
 assert.deepEqual(Wild.depthEntries(g,v,view).map(e=>[e.id,e.kind,e.depth]),[[near.id,'wildlife165',near.y]]);
 assert.deepEqual(Wild.depthEntries(g,{z:1},view),[]);assert.deepEqual(Wild.observed(g,v,null),[]);
 const c=createCanvas(100,100).getContext('2d'),cam={width:100,height:100,screen:(x,y)=>({x:x*10,y:y*10})};assert.equal(Wild.map(c,g,v,cam,g.visibility.frame()),1);assert.equal(Wild.map(c,g,{z:1},cam,g.visibility.frame()),0);assert.equal(Wild.map(c,g,v,cam,{canSeeRegional:()=>false}),0);
});
