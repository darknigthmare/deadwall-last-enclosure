'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/d17-art150.js'),V=require('../src/d17-extended-variants157.js'),C=require('../src/core.js');
function scene(){
 const assets={...A.ASSETS,...V.ASSETS},images=Object.fromEntries(Object.entries(assets).map(([key,s])=>[key,{width:s.width,height:s.height}]));
 const models=Object.entries(C.CityContent150.BUILDINGS).map(([type,def],i)=>({id:50+i,type,def,w:def.size[0],h:def.size[1],x:500+i*80,y:600,completed:true,dead:false,health:100,powered:true}));
 for(const b of models){b.left=b.x-b.w*16;b.bottom=b.y+b.h*16;}
 const context={save(){},restore(){},fillRect(){},drawImage(){}};
 const art={images,blit(){return true;},drawBuilding(c,b){return A.drawBuilding(c,this,b,{seed:g.world.seed});}};
 const g={world:{seed:17117,buildings:new Map(models.map(b=>[b.id,b]))},art,stock:17,serialize(){return{stock:this.stock,models};},render(){models.forEach(b=>art.drawBuilding(context,b));}};
 return {g,models,art,context,assets};
}
function globals(t,s){
 const values={DEADWALL:s.g,DeadwallCore:C,DeadwallD17Art150:A,DeadwallArt:{ASSETS:s.assets}};
 const before=Object.fromEntries(Object.keys(values).map(k=>[k,{own:Object.hasOwn(globalThis,k),value:globalThis[k]}]));
 Object.assign(globalThis,values);t.after(()=>{for(const[k,v]of Object.entries(before))if(v.own)globalThis[k]=v.value;else delete globalThis[k];});
}
test('164 city: each of 20 exact source/destination frames is tied to its real live support across base and alternate seeds',async t=>{
 const {observeCityFrames164:observe}=await import('../scripts/browser-city-proof164.mjs');const s=scene();globals(t,s);const variants=new Set();
 for(const seed of [42,17117,271828]){s.g.world.seed=seed;const result=observe();assert.equal(result.paintedIds.length,20);assert.deepEqual(result.missingIds,[]);assert.ok(result.persistentUnchanged);assert.ok(result.decoded.every(x=>x.width===x.expectedWidth&&x.height===x.expectedHeight));for(const e of result.expected)variants.add(e.atlas.startsWith('d17Extended')?'alternate':'base');}
 assert.deepEqual([...variants].sort(),['alternate','base']);
});
test('164 city: wrong atlas, crop, destination, missing model and rejected blit cannot pass the frame proof',async t=>{
 const {observeCityFrames164:observe}=await import('../scripts/browser-city-proof164.mjs');const s=scene();globals(t,s);const original=s.art.drawBuilding,blit=s.art.blit;
 for(const fault of ['atlas','source','destination','unrelated','none','refused']){
  s.art.drawBuilding=function(c,b){if(b!==s.models[0])return original.call(this,c,b);if(fault==='none')return false;if(fault==='unrelated')return this.drawBuilding(c,{...b,id:b.id+1000});
   const f=A.measure(b,{seed:s.g.world.seed,art:this});if(fault==='atlas')f.atlas='wrongAtlas';if(fault==='source')f.source=f.source.map((v,i)=>v+(i===0?1:0));if(fault==='destination')f.destination=f.destination.map((v,i)=>v+(i===0?1:0));return this.blit(c,f.atlas,f.source,...f.destination);};
  s.art.blit=fault==='refused'?()=>false:blit;const currentBlit=s.art.blit;const result=observe();assert.ok(result.missingIds.includes(s.models[0].type),fault);assert.equal(s.art.blit,currentBlit);
 }
 s.art.blit=blit;s.art.drawBuilding=original;s.models[0].dead=true;assert.throws(observe,/Missing live city supports/);
});
test('164 city: renderer hooks are restored on throw and persistent mutation is detected',async t=>{
 const {observeCityFrames164:observe}=await import('../scripts/browser-city-proof164.mjs');const s=scene();globals(t,s);const original=s.g.render,paint=s.art.drawBuilding,blit=s.art.blit;
 s.g.render=()=>{throw Error('paint fault');};assert.throws(observe,/paint fault/);assert.equal(s.art.drawBuilding,paint);assert.equal(s.art.blit,blit);
 s.g.render=()=>{original();s.g.stock++;};assert.equal(observe().persistentUnchanged,false);assert.equal(s.art.drawBuilding,paint);assert.equal(s.art.blit,blit);
});
