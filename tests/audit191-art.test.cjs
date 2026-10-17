'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
globalThis.DeadwallCore=require('../src/core.js');require('../src/wildlife-art189.js');const A=require('../src/husbandry191-art.js'),{createCanvas}=require('@napi-rs/canvas');
function paint(progress,reducedMotion=false){const c=createCanvas(200,200),ctx=c.getContext('2d');ctx.translate(60,100);ctx.scale(75,75);const transform=ctx.getTransform(),s={kind:'slaughter',x:0,y:0,a:.2,progress};assert.ok(A.drawWork(ctx,s,{reducedMotion}));assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,1);return c.toBuffer('image/png');}
test('191 work forearms/tool animate from progress, freeze in reduced motion and restore painter state',()=>{assert.notDeepEqual(paint(.07),paint(.13));assert.deepEqual(paint(.07,true),paint(.13,true));});
test('191 a real procedural pen shows juvenile/captive silhouettes without changing custody',()=>{
 const c=createCanvas(600,440),ctx=c.getContext('2d');ctx.translate(270,200);ctx.scale(95,95);
 const pen={id:1,x:0,y:0,health:100,water:16,food:12,meat:2,leather:1},animals=[{id:2,source:'A189_0_0_0',species:'rabbit',health:100,age:1000},{id:4,source:null,species:'rabbit',health:100,age:10}],before=JSON.stringify({pen,animals}),transform=ctx.getTransform();
 assert.ok(A.drawPen(ctx,pen,animals));assert.equal(JSON.stringify({pen,animals}),before);assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,1);
});
test('191 every timed work has a distinct attached tool, a progress-driven gesture and reduced-motion pose',()=>{
 const render=(kind,progress,reducedMotion=false)=>{const c=createCanvas(240,200),ctx=c.getContext('2d');ctx.translate(35,100);ctx.scale(120,120);ctx.setLineDash([.03,.04]);const transform=ctx.getTransform(),dash=ctx.getLineDash();
  const work={kind,x:0,y:0,a:0,progress},before=JSON.stringify(work);assert.ok(A.drawWork(ctx,work,{reducedMotion}));assert.equal(JSON.stringify(work),before);assert.deepEqual(ctx.getTransform(),transform);assert.deepEqual(ctx.getLineDash(),dash);return c.toBuffer('image/png');};
 const kinds=['harvest','capture','cook','tan','build','water','slaughter'],poses=[];
 for(const kind of kinds){assert.notDeepEqual(render(kind,.07),render(kind,.13),kind);assert.deepEqual(render(kind,.07,true),render(kind,.13,true),kind);poses.push(render(kind,.07).toString('base64'));}
 // Slaughter and harvesting share the knife, while the other operations have their own equipment.
 assert.equal(new Set(poses).size,kinds.length-1);
 assert.deepEqual(render('build',.13),render('rebuild',.13));
 const ctx=createCanvas(50,50).getContext('2d');assert.equal(A.drawWork(ctx,{kind:'unknown',x:0,y:0,progress:.5}),false);
});
test('191 construction follows the detached task footprint and progress without creating a completed pen',()=>{
 const render=progress=>{const c=createCanvas(460,440),ctx=c.getContext('2d');ctx.translate(230,230);ctx.scale(110,110);ctx.setLineDash([.04,.08]);const transform=ctx.getTransform(),dash=ctx.getLineDash(),task={kind:'build',point:{x:0,y:0},progress},before=JSON.stringify(task);
  assert.ok(A.drawConstruction(ctx,task));assert.equal(JSON.stringify(task),before);assert.deepEqual(ctx.getTransform(),transform);assert.deepEqual(ctx.getLineDash(),dash);return c.toBuffer('image/png');};
 assert.notDeepEqual(render(0),render(.5));assert.notDeepEqual(render(.5),render(1));assert.deepEqual(render(.5),render(.5));
 const ctx=createCanvas(50,50).getContext('2d');for(const task of [null,{kind:'capture',point:{x:0,y:0},progress:.5},{kind:'build',point:{x:NaN,y:0},progress:.5},{kind:'build',point:{x:0,y:0},progress:Infinity}])assert.equal(A.drawConstruction(ctx,task),false);
});
test('191 construction depth entries obey real visibility and viewport without modifying their owners',()=>{
 const point={x:10,y:12},state={pens:[],animals:[],task:{kind:'build',point,progress:.3}},g={world:{seed:17117},settings:{reducedMotion:true},husbandry191:{view:()=>state},frontier:{position:()=>({x:10,y:15,a:0})},visibility:{frame:()=>({canSeeRegionalPoint:()=>true})}},before=JSON.stringify(state),view={left:0,right:20,top:0,bottom:20};
 const entries=A.depthEntries(g,{z:0},view);assert.ok(entries.some(e=>e.kind==='husbandry191-construction'));assert.ok(entries.some(e=>e.kind==='husbandry191-work'));
 for(const entry of entries){const ctx=createCanvas(100,100).getContext('2d');ctx.scale(5,5);entry.draw(ctx);}assert.equal(JSON.stringify(state),before);
 g.visibility.frame=()=>({canSeeRegionalPoint:()=>false});assert.equal(A.depthEntries(g,{z:0},view).filter(e=>e.kind==='husbandry191-construction').length,0);
 g.visibility.frame=()=>({canSeeRegionalPoint:()=>true});assert.equal(A.depthEntries(g,{z:0},{l:50,r:60,t:50,b:60}).filter(e=>e.kind==='husbandry191-construction').length,0);
 assert.deepEqual(A.depthEntries(g,{z:1},view),[]);
});
test('189 all 26 species and four variants draw, animate, freeze at rest and preserve the painter and actor',()=>{
 const Art=require('../src/wildlife-art189.js'),Wild=require('../src/wildlife189.js'),catalogue=Wild.species();assert.equal(Object.keys(catalogue).length,26);
 const render=(a,options={})=>{const c=createCanvas(300,320),ctx=c.getContext('2d');ctx.translate(150,240);ctx.scale(80,80);ctx.globalAlpha=.8;ctx.setLineDash([.02,.04]);const transform=ctx.getTransform(),before=JSON.stringify(a),dash=ctx.getLineDash();
  assert.ok(Art.draw(ctx,a,options),a.species);assert.equal(JSON.stringify(a),before);assert.deepEqual(ctx.getTransform(),transform);assert.equal(ctx.globalAlpha,.8);assert.deepEqual(ctx.getLineDash(),dash);return c.toBuffer('image/png');};
 for(const [species,d]of Object.entries(catalogue)){
  const a={id:'A189_0_0_0',species,x:0,y:0,a:0,hp:d.health,moving:true,stride165:0,variant:0},phased={...a,stride165:Math.PI/2};
  assert.notDeepEqual(render(a),render(phased),species+' gait');assert.deepEqual(render(a,{reducedMotion:true}),render(phased,{reducedMotion:true}),species+' reduced motion');
  assert.deepEqual(render({...a,moving:false}),render({...phased,moving:false}),species+' resting');
  assert.deepEqual(render({...a,hp:0},{corpse:true}),render({...phased,hp:0},{corpse:true}),species+' carcass');
  assert.equal(new Set([0,1,2,3].map(variant=>render({...a,variant}).toString('base64'))).size,4,species+' variants');
  assert.deepEqual(render({...a,variant:-1}),render({...a,variant:3}),species+' normalized variant');
  assert.deepEqual(render({...a,stride165:NaN}),render(a),species+' finite pose');
 }
});
test('191 born captive silhouettes are visible and juvenile scale remains smaller at identical metric placement',()=>{
 const Art=require('../src/wildlife-art189.js'),paint=juvenile=>{const c=createCanvas(300,300),ctx=c.getContext('2d');ctx.translate(150,150);ctx.scale(300,300);if(juvenile)ctx.scale(.6,.6);assert.ok(Art.draw(ctx,{id:'B191_4',species:'rabbit',x:0,y:0,a:0,hp:100,variant:0,moving:false}));return ctx.getImageData(0,0,300,300).data;};
 const area=data=>{let n=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)n++;return n;},adult=area(paint(false)),young=area(paint(true));assert.ok(young>0);assert.ok(young<adult*.5);
});
test('191 a destroyed pen visibly opens the fence while retaining on-site products',()=>{
 const render=health=>{const c=createCanvas(600,600),ctx=c.getContext('2d');ctx.translate(300,300);ctx.scale(150,150);A.drawPen(ctx,{id:1,x:0,y:0,health,food:0,water:0,meat:1,hides:1,leather:1},[]);return ctx.getImageData(0,0,600,600).data;},intact=render(100),ruin=render(0);
 const alphaAt=(pixels,x,y)=>pixels[(y*600+x)*4+3];
 assert.ok(alphaAt(intact,300,75)>200);assert.ok(alphaAt(ruin,300,75)<100);
 for(const y of[380,420,457])assert.ok(alphaAt(ruin,555,y)>200,'product stays at its site');
});
test('191 stranded captives remain visible in a ruined pen without reintroducing released subjects',()=>{
 const paint=status=>{const state={pens:[{id:1,x:0,y:0,health:0,water:0,food:0,meat:0,hides:0,leather:0}],animals:[{id:4,source:null,species:'rabbit',health:60,age:1000,status,pen:1}],task:null},before=JSON.stringify(state),
  g={world:{seed:17117},husbandry191:{view:()=>state},visibility:{frame:()=>({canSeeRegionalPoint:()=>true})}},c=createCanvas(600,600),ctx=c.getContext('2d');ctx.translate(300,300);ctx.scale(150,150);
  for(const entry of A.depthEntries(g,{z:0},{l:-3,r:3,t:-3,b:3}))entry.draw(ctx);assert.equal(JSON.stringify(state),before);return c.toBuffer('image/png');};
 assert.deepEqual(paint('stranded'),paint('held'));assert.notDeepEqual(paint('stranded'),paint('released'));
});
test('191 a captured generated animal keeps its seeded appearance instead of taking its new custody id colour',()=>{
 const C=globalThis.DeadwallCore,Wild=require('../src/wildlife189.js'),Art=require('../src/wildlife-art189.js'),seed=17117,w={seed,size:24576,home:{x:0,y:0},landscape189:'balanced',hydrologyVersion:1,
  hydrology:{sample:()=>({water:false,salinity:0,distanceToWater:10,distanceToShore:10}),featuresIn:()=>[]},biomeAt:()=>({id:'meadow'}),nearestRoad:()=>null};
 let source;for(let cx=2;cx<30&&!source;cx++)for(let index=0;index<4&&!source;index++){const q=Wild.animal(w,cx,2,index);if(q&&C.Husbandry191Rules.captive[q.species])source=q;}assert.ok(source);
 const custodyId=(source.variant+1)%4+4,animal={id:custodyId,source:source.id,species:source.species,health:100,age:1000},pen={id:1,x:0,y:0,health:100,water:0,food:0,meat:0,hides:0,leather:0};
 const canvas=createCanvas(600,600),ctx=canvas.getContext('2d');ctx.translate(300,300);ctx.scale(150,150);A.drawPen(ctx,pen,[animal],{worldSeed:seed});
 const expected=createCanvas(600,600),other=expected.getContext('2d');other.translate(300,300);other.scale(150,150);Art.draw(other,{...source,x:-.55,y:-.5,a:0,hp:100,moving:false});
 // Compare only opaque animal pixels; the pen floor is deliberately translucent.
 const actual=ctx.getImageData(0,0,600,600).data,reference=other.getImageData(0,0,600,600).data;let pixels=0;
 for(let i=0;i<reference.length;i+=4)if(reference[i+3]===255){assert.deepEqual([...actual.subarray(i,i+3)],[...reference.subarray(i,i+3)]);pixels++;}assert.ok(pixels>20);
});
