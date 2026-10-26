'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),A=require('../src/codex-campaign205.js'),G=require('../src/frontier-geometry.js'),S=require('../src/campaign-services208.js');

// Pure permission tests use actual author plans with deliberately controlled
// geometry readers. Actual collision and seeded-world coverage are separate.
function fixture(typology='EXT-MONDE-T047'){
 const type=A.typeFor(typology,1),preset=A.preset(type),p={...preset,id:'P0001',type,x:500,y:500,a:Math.PI/2,generation:11},plan=A.plan(p,0),details=A.details(p,0);
 const w={generation:11,pois:[p],plan:()=>plan,detailAt:()=>details,blocked:()=>false,line:()=>true,movementLine:()=>true,coveredAt205:()=>true,nearPOI:()=>[p]};
 const support=S.supportsFor(p,plan,details).find(s=>s.action==='meal'),pose={active:true,generation:11,...support.anchor,inside:p.id,car:null};
 return{p,plan,details,w,support,pose,seen:[p.id],options:{structureDestroyed:()=>false}};
}

test('208 support descriptors preserve exact furniture identities and authored service-side geometry',()=>{
 const f=fixture(),before=JSON.stringify([f.plan,f.details]),supports=S.supportsFor(f.p,f.plan,f.details);
 assert.ok(supports.length>0);assert.equal(new Set(supports.map(s=>s.supportId+'/'+s.action)).size,supports.length);
 for(const s of supports){
  const o=[...f.plan.objects,...f.details.interior].find(o=>o.id===s.supportId);assert.ok(o);assert.equal(o.kind,s.supportKind);
  const anchor=G.local(f.p,s.anchor.x,s.anchor.y),work=G.local(f.p,s.workTarget.x,s.workTarget.y);
  assert.ok(Math.abs(anchor.x-o.access.x-o.access.w/2)<1e-8);assert.ok(Math.abs(anchor.y-o.access.y-o.access.h/2)<1e-8);
  assert.ok(Math.abs(work.x-Math.max(o.x,Math.min(o.x+o.w,anchor.x)))<1e-8);assert.ok(Math.abs(work.y-Math.max(o.y,Math.min(o.y+o.h,anchor.y)))<1e-8);
  assert.ok(Math.hypot(work.x-anchor.x,work.y-anchor.y)>0);assert.equal(Object.isFrozen(s.anchor),true);
 }
 assert.equal(JSON.stringify([f.plan,f.details]),before);
});

test('208 exact admission revalidates physical approach, gesture, visibility, discovery and live demolition on each call',()=>{
 const f=fixture(),run=()=>S.resolve(f.w,f.pose,f.support,f.seen,f.options);assert.equal(run().ok,true);
 for(const [key,bad]of [['blocked',()=>true],['line',()=>false],['movementLine',()=>false]]){const old=f.w[key];f.w[key]=bad;assert.equal(run().ok,false,key);f.w[key]=old;assert.equal(run().ok,true,key);}
 const old=f.options.structureDestroyed;f.options.structureDestroyed=()=>true;assert.equal(run().ok,false);f.options.structureDestroyed=old;
 assert.equal(S.resolve(f.w,f.pose,f.support,[],f.options).ok,false);assert.equal(S.resolve(f.w,f.pose,f.support,f.seen,{}).ok,false);
 assert.equal(S.resolve(f.w,{...f.pose,z:1},f.support,f.seen,f.options).ok,false);assert.equal(S.resolve(f.w,{...f.pose,car:{driving:true}},f.support,f.seen,f.options).ok,false);
 assert.equal(S.resolve(f.w,{...f.pose,x:f.pose.x+100},f.support,f.seen,f.options).ok,false);
 let finalIgnore;f.w.movementLine=(a,b,z,inside,ignore,r)=>{assert.equal(r,C.CampaignServices208Rules.actorRadius);if(a===f.support.anchor||Math.hypot(a.x-f.support.anchor.x,a.y-f.support.anchor.y)<1e-8&&Math.hypot(b.x-f.support.workTarget.x,b.y-f.support.workTarget.y)<1e-8)finalIgnore=ignore;return true;};
 assert.equal(run().ok,true);assert.equal(finalIgnore,f.support.supportId);
});

test('208 large compounds are offered by their actual footprint and support distance, with bounded action results',()=>{
 const f=fixture('EXT-MONDE-T045'),all=S.supportsFor(f.p,f.plan,f.details),far=[...all].sort((a,b)=>Math.hypot(b.anchor.x-f.p.x,b.anchor.y-f.p.y)-Math.hypot(a.anchor.x-f.p.x,a.anchor.y-f.p.y))[0];
 assert.ok(Math.hypot(far.anchor.x-f.p.x,far.anchor.y-f.p.y)>C.CampaignServices208Rules.nearbyRadius);
 const offered=S.list(f.w,{...f.pose,...far.anchor},f.seen,f.options);assert.ok(offered.some(s=>s.supportId===far.supportId&&s.action===far.action));assert.ok(offered.length<=C.CampaignServices208Rules.maxActions);
 assert.deepEqual(S.list(f.w,f.pose,[],f.options),[]);
});

test('208 medical support remains specific to T047 and unsupported crafting never becomes a service',()=>{
 for(const type of A.types){const f=fixture(type),medical=S.supportsFor(f.p,f.plan,f.details).filter(s=>s.action==='medicalCare');assert.equal(medical.length,type==='EXT-MONDE-T047'?1:0);}
 const f=fixture();assert.equal(S.resolve(f.w,f.pose,{...f.support,action:'craft'},f.seen,f.options).ok,false);
 assert.deepEqual(S.supportsFor({...f.p,generation:10},f.plan,f.details),[]);assert.deepEqual(S.supportsFor(f.p,{...f.plan,campaign205:{...f.plan.campaign205,variant:2}},f.details),[]);
 assert.equal(S.resolve(f.w,f.pose,{...f.support,supportId:'P0001:0:__proto__'},f.seen,f.options).ok,false);
});

test('208 geometry cache cannot retain an authority after a world, support identity or source-plan replacement',()=>{
 const f=fixture(),run=()=>S.resolve(f.w,f.pose,f.support,f.seen,f.options);assert.equal(run().ok,true);
 const original=f.w.pois;f.w.pois=[{...f.p,generation:10}];assert.equal(run().ok,false);f.w.pois=original;assert.equal(run().ok,true);
 const plan=f.w.plan,detail=f.w.detailAt;f.w.plan=()=>({...f.plan,objects:[]});f.w.detailAt=()=>({...f.details,interior:[]});assert.equal(run().ok,false);
 f.w.plan=plan;f.w.detailAt=detail;assert.equal(run().ok,true);
 const second={...f.w,pois:[]};assert.equal(S.resolve(second,f.pose,f.support,f.seen,f.options).ok,false);
});

test('208 consultation consumes no randomness and changes no plan or owner data',()=>{
 const f=fixture(),before=JSON.stringify([f.p,f.plan,f.details,f.pose,f.seen]),random=Math.random;Math.random=()=>assert.fail('A pure furniture consultation consumed random state');
 try{for(let i=0;i<4;i++){assert.equal(S.resolve(f.w,f.pose,f.support,f.seen,f.options).ok,true);assert.ok(S.list(f.w,f.pose,f.seen,f.options).length);}}finally{Math.random=random;}
 assert.equal(JSON.stringify([f.p,f.plan,f.details,f.pose,f.seen]),before);
});
