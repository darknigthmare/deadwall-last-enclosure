'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),M=require('../src/metric-contract174.js'),V=require('../src/vehicle-art152.js'),H=require('../src/assets136.js'),Variants=require('../src/world-variants158.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('174 all nine vehicle profiles have exact metre footprints in regional and opted-in local render frames',()=>{
 for(const [type,p] of Object.entries(C.WorldEvolution.RULES.vehicles)){
  const regional=M.vehicle(p),local=M.vehicle(p,{domain:'local',metric:true}),old=M.vehicle(p,{domain:'local'});
  assert.equal(regional.w,p.w);assert.equal(regional.h,p.h);close(local.w/32,p.w);close(local.h/32,p.h);close(old.w,p.w*44/4.6);assert.equal(old.legacyCompressed,true);
  const alternate=Variants.measureVehicle(type,'test',p.w,p.h,{variant:1,groundFootprint:true});assert.deepEqual(alternate.destination,[-p.w/2,-p.h/2,p.w,p.h]);
  const calls=[],c={save(){},restore(){},drawImage(){},globalAlpha:1};
  const art={images:Object.fromEntries(Object.keys({...V.ASSETS,...H.ASSETS139,...H.ASSETS140,...Variants.ASSETS}).map(k=>[k,{width:1,height:1}])),blit(ctx,key,source,...dest){calls.push({key,source,dest});return true;}};
  for(const variant of [0,1]){calls.length=0;const fn=V.SPRITES[type]?V.drawVehicle:H.drawVehicle139;assert.equal(fn(c,art,type,p.w,p.h,{identity:'test',variant}),true);assert.ok(calls.length>0);assert.deepEqual(calls[0].dest,[-p.w/2,-p.h/2,p.w,p.h],type+' variant '+variant);}
 }
 const bus=C.WorldEvolution.RULES.vehicles.bus;assert.ok(bus.w/(2*C.Frontier.RULES.footRadius)>16);assert.equal(Object.keys(C.WorldEvolution.RULES.vehicles).length,9);
});
test('174 footprint fitting is explicit and does not alter icon or upright-object fitting',()=>{
 const s=[0,0,100,100];assert.deepEqual(M.footprintFrame(s,10,2).destination,[-5,-1,10,2]);assert.deepEqual(s,[0,0,100,100]);
 for(const r of [[0,0,0,100],[-1,0,100,100],[0,0,NaN,100],null])assert.equal(M.footprintFrame(r,10,2),null);
 assert.equal(M.footprintFrame(s,0,2),null);assert.throws(()=>M.vehicle({w:0,h:2}));assert.throws(()=>M.vehicle({w:1,h:2},{domain:'screen'}));
 const old=V.measure('compact',4.05,1.72),ratio=old.destination[2]/old.destination[3];close(ratio,V.SPRITES.compact.rect[2]/V.SPRITES.compact.rect[3]);
 assert.notDeepEqual(old.destination,V.measureGround('compact',4.05,1.72).destination);
});
test('174 metric audit distinguishes missing dimensions, domains and height roles instead of certifying an unknown asset',()=>{
 const valid=M.diagnose({id:'house',kind:'house',bounds:{x:0,y:0,w:14,h:12},source:'native-preset'});assert.equal(valid.status,'dimensioned');assert.equal(valid.metres.length,14);
 assert.equal(M.diagnose({id:'unknown',bounds:{x:0,y:0,w:2,h:3}}).status,'unattributed');
 assert.equal(M.diagnose({id:'bad',bounds:{x:0,y:0,w:0,h:3}}).status,'invalid');
 const group={id:'block',domain:'region',bounds:{x:0,y:0,w:20,h:20},members:[{id:'home',kind:'house',domain:'region',bounds:{x:3,y:3,w:14,h:12},source:'native-preset'}]};assert.ok(M.assembly(group).ok);
 assert.ok(!M.assembly({...group,members:[...group.members,...group.members]}).ok);
 assert.ok(!M.assembly({...group,members:[{...group.members[0],angle:Math.PI/4}]}).ok);
 assert.ok(!M.assembly({...group,members:[{...group.members[0],domain:'local'}]}).ok);
});
test('174 saved opt-in is strict, absent on legacy data, never assumed from a decorative image',()=>{
 const v={id:1,x:1000,y:1000,health:320,fuel:2,angle:0,driving:false,cargo:C.makeBag()},raw={...C.Expeditions.initial(),vehicle:v};
 assert.equal(Object.hasOwn(C.Expeditions.normalize(raw).vehicle,'metric174'),false);
 assert.equal(C.Expeditions.normalize({...raw,vehicle:{...v,metric174:1}}).vehicle.metric174,1);
 for(const value of [0,2,-1,'1',null,false,NaN,Infinity])assert.throws(()=>C.Expeditions.normalize({...raw,vehicle:{...v,metric174:value}}));
});
