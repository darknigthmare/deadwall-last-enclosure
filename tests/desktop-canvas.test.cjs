'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {analyzeCanvasPixels,afterTwoAnimationFrames}=require('../desktop/smoke.cjs');

function fixture(pixel,width=1280,height=720){
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)data.set(pixel(x,y),(y*width+x)*4);
  return{data,width,height};
}
const probe=({data,width,height})=>analyzeCanvasPixels(data,width,height);
const patterned=(x,y)=>[(x*5+y*3)%256,(x*7+y*11)%256,(x*13+y*17)%256,255];

test('QA native : noir, blanc et couleur unie opaques ne prouvent pas un rendu du jeu',()=>{
  for(const color of [[0,0,0],[255,255,255],[23,28,24]]){
    const image=fixture(()=>[...color,255]),result=probe(image);
    let legacyOpaque=0;for(let i=3;i<image.data.length;i+=400)if(image.data[i])legacyOpaque++;
    assert.ok(legacyOpaque>100,'reproduction du faux positif historique');
    assert.equal(result.opaque,768);assert.equal(result.colorBuckets,1);assert.equal(result.channelRange,0);assert.equal(result.pass,false);
  }
});

test('QA native : une variation RGB distribuée est détectée par au plus 768 prélèvements',()=>{
  const image=fixture(patterned),before=image.data.slice(),result=probe(image);
  assert.equal(result.samples,768);assert.equal(result.opaque,768);assert.ok(result.colorBuckets>=8);assert.ok(result.channelRange>=24);assert.equal(result.pass,true);
  assert.deepEqual(image.data,before,'probe sans mutation du buffer');
  const serialized=vm.runInNewContext('('+analyzeCanvasPixels.toString()+')(pixels,width,height)',{pixels:image.data,width:image.width,height:image.height});
  assert.deepEqual(JSON.parse(JSON.stringify(serialized)),result,'la fonction sérialisée utilisée dans Electron est identique');
});

test('QA native : transparence, quasi-aplat et quelques pixels parasites restent insuffisants',()=>{
  assert.equal(probe(fixture((x,y)=>[...patterned(x,y).slice(0,3),0])).pass,false);
  assert.equal(probe(fixture((x,y)=>[20+x%3,22+y%3,21+(x+y)%3,255])).pass,false);
  const image=fixture(()=>[0,0,0,255]);
  for(let column=0;column<8;column++){
    const x=Math.floor((column+.5)*image.width/32),y=Math.floor(.5*image.height/24);
    image.data.set([column*28+28,255-column*28,128,255],(y*image.width+x)*4);
  }
  const result=probe(image);assert.equal(result.colorBuckets,9);assert.equal(result.nonDominant,8);assert.equal(result.pass,false);
});

test('QA native : buffer incomplet et dimensions invalides sont refusés sans exception',()=>{
  for(const [pixels,width,height] of [[null,1280,720],[new Uint8ClampedArray(4),1280,720],[[],0,0],[[],NaN,2],[[],2.5,2],[[],Infinity,2],[[],Number.MAX_SAFE_INTEGER,2]]){
    assert.equal(analyzeCanvasPixels(pixels,width,height).pass,false);
  }
  const tiny=fixture(patterned,4,4);assert.equal(probe(tiny).pass,false);
});

test('captures natives : la promesse attend deux RAF distincts après la mutation UI',async()=>{
  const callbacks=[];let settled=false;
  const promise=vm.runInNewContext('('+afterTwoAnimationFrames.toString()+')()',{requestAnimationFrame:callback=>callbacks.push(callback)});
  promise.then(()=>{settled=true;});assert.equal(callbacks.length,1);
  callbacks.shift()();await Promise.resolve();
  assert.equal(settled,false);assert.equal(callbacks.length,1,'la deuxième frame ne peut pas être la première');
  callbacks.shift()();assert.equal(await promise,true);assert.equal(settled,true);
});
