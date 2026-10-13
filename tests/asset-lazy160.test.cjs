'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');

const LAZY_KEYS=Object.freeze(['civilRail160','waterPort160','shoreServices160']);
const options=Object.freeze({concurrency:false,timeout:5000});
const flush=()=>new Promise(resolve=>setImmediate(resolve));

// Only browser image delivery is controlled. Art.create(), its queue, its
// promises, dimensions and historical decoder execute without replacement.
async function fixture(run,{matteCanvas=false}={}){
 const savedImage=Object.getOwnPropertyDescriptor(globalThis,'Image');
 const savedDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
 const moduleId=require.resolve('../src/art.js');
 const cached=require.cache[moduleId];
 const requests=[],canvases=[],canvasCalls=[];
 let registry=new Map(),constructed=0,activeLazy=0,maxActiveLazy=0;
 const restore=(key,descriptor)=>descriptor?Object.defineProperty(globalThis,key,descriptor):delete globalThis[key];
 class ControlledImage{
  constructor(){constructed++;this.naturalWidth=0;this.naturalHeight=0;}
  set src(url){
   const record=registry.get(url);
   assert.ok(record,'The loader must request an actual registered asset');
   const request={key:record.key,spec:record.spec,image:this,url,scheduled:false,settled:false};
   requests.push(request);this.url=url;
   if(record.spec.lazy===true){activeLazy++;maxActiveLazy=Math.max(maxActiveLazy,activeLazy);}
  }
 }
 const document={createElement(kind){
  canvasCalls.push(kind);
  if(!matteCanvas)throw new Error('This image must not allocate a canvas');
  assert.equal(kind,'canvas');
  const canvas={width:0,height:0},context={
   drawImage(image,...args){this.source=image;this.drawArgs=args;},
   getImageData(x,y,width,height){
    assert.deepEqual([x,y,width,height],[0,0,canvas.width,canvas.height]);
    const data=new Uint8ClampedArray(width*height*4);
    data.set([255,0,255,255,40,55,30,255]);
    this.original={data,width,height};return this.original;
   },
   putImageData(imageData,x,y){this.result=imageData;this.putArgs=[x,y];}
  };
  canvas.getContext=(kind,configuration)=>{assert.equal(kind,'2d');context.configuration=configuration;return context;};
  canvas.context=context;canvases.push(canvas);return canvas;
 }};
 function finish(request,{error=false,width=request.spec.width,height=request.spec.height}={}){
  assert.ok(request&&!request.scheduled&&!request.settled,'Exactly one pending source receives this event');
  request.scheduled=true;
  queueMicrotask(()=>{
   request.settled=true;
   if(request.spec.lazy===true)activeLazy--;
   request.image.naturalWidth=width;request.image.naturalHeight=height;
   request.image.width=width;request.image.height=height;
   if(error)request.image.onerror();else request.image.onload();
  });
 }
 function pending(key){
  const matches=requests.filter(request=>request.key===key&&!request.scheduled&&!request.settled);
  assert.equal(matches.length,1,'One source is pending for '+key);return matches[0];
 }
 function failHistorical(){
  for(const request of requests)if(request.spec.lazy!==true&&!request.scheduled&&!request.settled)finish(request,{error:true});
 }
 try{
  Object.defineProperty(globalThis,'Image',{configurable:true,writable:true,value:ControlledImage});
  Object.defineProperty(globalThis,'document',{configurable:true,writable:true,value:document});
  delete require.cache[moduleId];
  const Art=require('../src/art.js');
  registry=new Map(Object.entries(Art.ASSETS).map(([key,spec])=>[spec.url,{key,spec}]));
  await run({Art,requests,canvases,canvasCalls,pending,finish,failHistorical,
   get constructed(){return constructed;},get activeLazy(){return activeLazy;},get maxActiveLazy(){return maxActiveLazy;}});
 }finally{
  try{
   // Settle unfinished real loader promises before restoring browser globals.
   // Completing a queued image can start the third optional atlas afterwards.
   for(let turn=0;turn<6;turn++){
    const pendingRequests=requests.filter(request=>!request.scheduled&&!request.settled);
    for(const request of pendingRequests)finish(request,{error:true});
    await flush();
    if(requests.every(request=>request.settled)&&activeLazy===0)break;
   }
  }finally{
   restore('Image',savedImage);restore('document',savedDocument);
   delete require.cache[moduleId];if(cached)require.cache[moduleId]=cached;
  }
 }
}

test('160 lazy metadata: importing and reading 146 definitions allocates no Image or canvas',options,async()=>{
 await fixture(async f=>{
  const entries=Object.entries(f.Art.ASSETS);
  assert.equal(entries.length,146);
  assert.deepEqual(entries.filter(([,spec])=>spec.lazy===true).map(([key])=>key).sort(),[...LAZY_KEYS].sort());
  assert.equal(entries.filter(([,spec])=>spec.lazy!==true).length,143);
  for(const [key,spec]of entries){
   assert.equal(typeof key,'string');assert.equal(typeof spec.url,'string');
   assert.ok(Number.isInteger(spec.width)&&spec.width>0);assert.ok(Number.isInteger(spec.height)&&spec.height>0);
  }
  assert.equal(f.constructed,0);assert.deepEqual(f.requests,[]);assert.deepEqual(f.canvasCalls,[]);
 });
});

test('160 startup: ready starts exactly 143 historical images and never waits for an optional pending atlas',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),historical=Object.keys(f.Art.ASSETS).filter(key=>f.Art.ASSETS[key].lazy!==true);
  assert.equal(f.constructed,143);assert.deepEqual(f.requests.map(request=>request.url),historical.map(key=>f.Art.ASSETS[key].url));
  let ready=false,optionalDone=false;
  art.ready.then(()=>{ready=true;});
  const optional=art.ensure(LAZY_KEYS[0]);optional.then(()=>{optionalDone=true;});
  await flush();
  assert.equal(ready,false);assert.equal(optionalDone,false);assert.equal(f.constructed,144);
  f.failHistorical();await art.ready;await flush();
  assert.equal(ready,true);assert.equal(optionalDone,false);
  assert.deepEqual(art.diagnostics.failed,[...historical]);
  assert.equal(f.requests.filter(request=>request.spec.lazy===true).length,1);
  f.finish(f.pending(LAZY_KEYS[0]));assert.equal(await optional,true);
  assert.deepEqual(art.diagnostics.ready,[LAZY_KEYS[0]]);assert.deepEqual(f.canvasCalls,[]);
 });
});

test('160 unknown keys: malformed and inherited names resolve false without allocating an image',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),before=f.constructed;
  for(const key of['missingAtlas','__proto__','constructor','toString','',null,undefined,1,{}])assert.equal(await art.ensure(key),false);
  assert.deepEqual(await art.ensureAssets(null),[]);assert.deepEqual(await art.ensureAssets('civilRail160'),[]);
  await flush();assert.equal(f.constructed,before);assert.equal(f.requests.length,143);assert.deepEqual(f.canvasCalls,[]);
 });
});

test('160 optional deduplication: all callers receive the identical pending and settled promise for a key',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),key=LAZY_KEYS[0],first=art.ensure(key);
  for(let i=0;i<30;i++)assert.equal(art.ensure(key),first);
  await flush();assert.equal(f.requests.filter(request=>request.key===key).length,1);
  f.finish(f.pending(key));assert.equal(await first,true);
  for(let i=0;i<30;i++){assert.equal(art.ensure(key),first);assert.equal(await art.ensure(key),true);}
  assert.equal(f.constructed,144);assert.deepEqual(art.diagnostics.ready,[key]);assert.deepEqual(f.canvasCalls,[]);
 });
});

test('160 bounded delivery: three requested atlases start FIFO with at most two simultaneous lazy sources',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),promises=LAZY_KEYS.map(key=>art.ensure(key));
  await flush();
  assert.deepEqual(f.requests.filter(request=>request.spec.lazy===true).map(request=>request.key),LAZY_KEYS.slice(0,2));
  assert.equal(f.activeLazy,2);assert.equal(f.maxActiveLazy,2);
  f.finish(f.pending(LAZY_KEYS[0]));assert.equal(await promises[0],true);await flush();
  assert.deepEqual(f.requests.filter(request=>request.spec.lazy===true).map(request=>request.key),[...LAZY_KEYS]);
  assert.equal(f.activeLazy,2);
  f.finish(f.pending(LAZY_KEYS[1]));f.finish(f.pending(LAZY_KEYS[2]));
  assert.deepEqual(await Promise.all(promises),[true,true,true]);
  assert.equal(f.activeLazy,0);assert.equal(f.maxActiveLazy,2);assert.equal(f.constructed,146);
 });
});

test('160 FIFO order: finishing the second active atlas releases the oldest queued request',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),order=[LAZY_KEYS[2],LAZY_KEYS[0],LAZY_KEYS[1]],promises=order.map(key=>art.ensure(key));
  await flush();
  assert.deepEqual(f.requests.filter(request=>request.spec.lazy===true).map(request=>request.key),order.slice(0,2));
  f.finish(f.pending(order[1]));assert.equal(await promises[1],true);await flush();
  assert.deepEqual(f.requests.filter(request=>request.spec.lazy===true).map(request=>request.key),order);
  assert.equal(f.activeLazy,2);f.finish(f.pending(order[0]));f.finish(f.pending(order[2]));
  assert.deepEqual(await Promise.all(promises),[true,true,true]);assert.equal(f.maxActiveLazy,2);
 });
});

test('160 ensureAssets: duplicates share delivery and the result waits for every actual requested atlas',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),keys=[LAZY_KEYS[2],LAZY_KEYS[0],LAZY_KEYS[2],'unknown',LAZY_KEYS[1]];
  let settled=false;const all=art.ensureAssets(keys);all.then(()=>{settled=true;});
  await flush();assert.equal(settled,false);
  assert.deepEqual(f.requests.filter(request=>request.spec.lazy===true).map(request=>request.key),[LAZY_KEYS[2],LAZY_KEYS[0]]);
  f.finish(f.pending(LAZY_KEYS[0]));await flush();
  f.finish(f.pending(LAZY_KEYS[1]));await flush();
  assert.equal(settled,false,'The first source is still waiting for its real onload callback');
  f.finish(f.pending(LAZY_KEYS[2]));
  assert.deepEqual(await all,[true,true,true,false,true]);assert.equal(settled,true);
  assert.equal(f.constructed,146);assert.equal(f.maxActiveLazy,2);
  assert.deepEqual(await art.ensureAssets([]),[]);
 });
});

test('160 network failure: failed optional delivery is diagnosed once, frees the queue and never retries per frame',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),promises=LAZY_KEYS.map(key=>art.ensure(key));await flush();
  f.finish(f.pending(LAZY_KEYS[0]),{error:true});assert.equal(await promises[0],false);await flush();
  assert.deepEqual(art.diagnostics.failed,[LAZY_KEYS[0]]);assert.equal(art.images[LAZY_KEYS[0]],undefined);
  assert.ok(f.pending(LAZY_KEYS[2]));
  f.finish(f.pending(LAZY_KEYS[1]));f.finish(f.pending(LAZY_KEYS[2]));
  assert.deepEqual(await Promise.all(promises),[false,true,true]);
  const before=f.constructed;
  for(let frame=0;frame<40;frame++){assert.equal(art.ensure(LAZY_KEYS[0]),promises[0]);assert.equal(await art.ensure(LAZY_KEYS[0]),false);}
  await flush();assert.equal(f.constructed,before);assert.equal(f.maxActiveLazy,2);
  assert.equal(art.diagnostics.failed.filter(key=>key===LAZY_KEYS[0]).length,1);
 });
});

test('160 dimensions: incorrect width and height fail through the real decoder without publishing or retrying either image',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),promises=LAZY_KEYS.map(key=>art.ensure(key));await flush();
  f.finish(f.pending(LAZY_KEYS[0]),{width:f.Art.ASSETS[LAZY_KEYS[0]].width-1});
  f.finish(f.pending(LAZY_KEYS[1]),{height:f.Art.ASSETS[LAZY_KEYS[1]].height+1});
  assert.deepEqual(await Promise.all(promises.slice(0,2)),[false,false]);await flush();
  assert.deepEqual(art.diagnostics.failed,LAZY_KEYS.slice(0,2));
  for(const key of LAZY_KEYS.slice(0,2)){assert.equal(art.images[key],undefined);assert.equal(art.diagnostics.ready.includes(key),false);}
  f.finish(f.pending(LAZY_KEYS[2]));assert.equal(await promises[2],true);
  const before=f.constructed;
  for(let frame=0;frame<40;frame++)for(let index=0;index<2;index++){assert.equal(art.ensure(LAZY_KEYS[index]),promises[index]);assert.equal(await art.ensure(LAZY_KEYS[index]),false);}
  await flush();assert.equal(f.constructed,before);assert.deepEqual(f.canvasCalls,[]);
 });
});

test('160 historical startup deduplication: ensure joins the original eager image and preserves ready delivery',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),ground=f.pending('ground'),first=art.ensure('ground');
  let settled=false;first.then(()=>{settled=true;});
  for(let frame=0;frame<20;frame++)assert.equal(art.ensure('ground'),first);
  await flush();assert.equal(settled,false);assert.equal(f.constructed,143);
  f.finish(ground);assert.equal(await first,true);assert.equal(art.images.ground,ground.image);
  assert.equal(art.ensure('ground'),first);assert.equal(f.requests.filter(request=>request.key==='ground').length,1);
  f.failHistorical();await art.ready;
  assert.deepEqual(art.diagnostics.ready,['ground']);assert.equal(f.constructed,143);
  assert.equal(f.requests.some(request=>request.spec.lazy===true),false);assert.deepEqual(f.canvasCalls,[]);
 });
});

test('160 historical matte: eager ensure retains the actual magenta decoder and source dimensions',options,async()=>{
 await fixture(async f=>{
  const art=f.Art.create(),request=f.pending('survivors'),loaded=art.ensure('survivors'),spec=f.Art.ASSETS.survivors;
  assert.equal(spec.matte,'magenta');f.finish(request);assert.equal(await loaded,true);
  assert.equal(f.canvases.length,1);const canvas=f.canvases[0],context=canvas.context;
  assert.deepEqual([canvas.width,canvas.height],[spec.width,spec.height]);
  assert.equal(context.source,request.image);assert.deepEqual(context.drawArgs,[0,0]);
  assert.deepEqual(context.putArgs,[0,0]);assert.equal(context.result,context.original);
  assert.deepEqual([...context.result.data.subarray(0,8)],[255,0,255,0,40,55,30,255]);
  assert.equal(art.images.survivors,canvas);assert.deepEqual(art.diagnostics.ready,['survivors']);
  assert.equal(art.ensure('survivors'),loaded);assert.equal(f.constructed,143);
 },{matteCanvas:true});
});
