'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const G=require('../src/frontier-geometry.js'),R=require('../src/codex3000-runtime.js'),Q=require('../src/codex3000-recipes159.js'),A=require('../src/codex-anchors160.js');
const D=require('../src/seed-detail157.js'),W=require('../src/frontier-world.js'),S=require('../src/frontier-state.js'),Codex=require('../src/world-codex.js');
const Art=require('../src/seed-detail-art157.js'),{createCanvas}=require('@napi-rs/canvas');
const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w>b.x-m&&a.y<b.y+b.h+m&&a.y+a.h>b.y-m;
function campaign(){const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();return g;}
const checkpoint=g=>{const d=g.serialize();delete d.timestamp;return d;};
test('160 anchors: all 62 presets, levels and two seeds keep exact wall support, access and finite historical stocks',()=>{
 let anchors=0,validated=0;const sides=new Set();
 for(const seed of [42,17117])for(const d of G.PRESETS){
  const p={...d,type:d.id,id:'P0510',x:320,y:600,a:.4,generation:7};p.parking=G.parking(p);p.outdoor=G.outdoor(p);
  for(const z of p.levels){const plan=G.plan(p,z),detail=R.enrich({seed,p,z,plan,detail:D.make(seed,p,z,plan),programme:p.codex,shapes:D.objects});
   const before=hash([p,plan,detail]),rich=R.anchored({seed,p,z,plan,detail,programme:p.codex});
   assert.equal(hash([p,plan,detail]),before);assert.deepEqual(rich,R.anchored({seed,p,z,plan,detail,programme:p.codex}));
   assert.deepEqual(rich.outdoor,detail.outdoor);assert.deepEqual(rich.interior.slice(0,detail.interior.length),detail.interior);
   const extra=rich.interior.filter(o=>o.anchored160),all=[...plan.walls,...plan.objects,...plan.stairs,...rich.interior];
   assert.ok(extra.length<=A.RULES.maxAdded);assert.equal(new Set(extra.map(o=>o.id)).size,extra.length);
   for(const o of extra){anchors++;sides.add(o.support160.side);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.z,z);
    const wall=plan.walls[o.support160.wall];assert.ok(wall);const side=o.support160.side;
    const gap=side==='west'?o.x-wall.x-wall.w:side==='east'?wall.x-o.x-o.w:side==='north'?o.y-wall.y-wall.h:wall.y-o.y-o.h;
    assert.ok(Math.abs(gap-.04)<1e-9,`${d.id} ${side} floating prop ${gap}`);
    const vertical=side==='west'||side==='east';assert.equal(o.w,vertical?o.spriteHeight160:o.spriteWidth160);assert.equal(o.h,vertical?o.spriteWidth160:o.spriteHeight160);
    assert.ok(all.filter(x=>x!==o).every(x=>!hit(o,x,.01)),d.id+' overlapping wall or furniture');
    assert.ok(all.filter(x=>x!==o).every(x=>!hit(o.front160,x,.02)),d.id+' service area blocked');
   }
   const base=Q.accessGrid(p,z,plan,detail),expected=Q.anchorCells(p,z,plan,base),after=Q.accessGrid(p,z,plan,rich);
   if(base?.baseline){assert.ok(after?.baseline);assert.ok(expected.every(i=>after.reachable[i]),d.id+' old path severed');validated++;}
  }
 }
 assert.ok(anchors>60,JSON.stringify({anchors,validated}));assert.ok(validated>80);assert.equal(sides.size,4);
});
test('160 drawing: quarter-turned furniture renders inside its collider without mutating the scene',()=>{
 for(const side of ['north','east','south','west']){
  const support={side,index:0,wall:side==='north'?{x:0,y:0,w:8,h:.24}:side==='south'?{x:0,y:7.76,w:8,h:.24}:side==='west'?{x:0,y:0,w:.24,h:8}:{x:7.76,y:0,w:.24,h:8}};
  const pose=A.pose(support,{x:.4,y:.4,w:7.2,h:7.2},2,1.6,.5,.9);assert.ok(pose);
  const o={...pose,kind:'bed',id:'test:'+side,anchored160:true,solid:true,surface:false},before=hash(o),c=createCanvas(400,400),ctx=c.getContext('2d');ctx.scale(40,40);
  assert.equal(Art.draw(ctx,o),true);assert.equal(hash(o),before);
  const pixels=ctx.getImageData(0,0,400,400).data;let painted=0;
  for(let y=0;y<400;y++)for(let x=0;x<400;x++)if(pixels[(y*400+x)*4+3]>0){painted++;assert.ok(x>=Math.floor(o.x*40)-1&&x<=Math.ceil((o.x+o.w)*40)+1);assert.ok(y>=Math.floor(o.y*40)-1&&y<=Math.ceil((o.y+o.h)*40)+1);}
  assert.ok(painted>100,side+' invisible fallback');
 }
});
test('160 search: real furniture and room inventories are searchable without promoting recipes to live sites',()=>{
 const before=hash(R.records),mirror=Codex.query({text:'miroir',status:'programme'}),sofa=Codex.query({text:'canape',status:'programme'});
 assert.ok(mirror.length>0&&sofa.length>0);assert.ok(Codex.query({text:'DW-1001 refrigerateur',status:'programme'}).some(e=>e.id==='programme-DW-1001'));
 assert.ok(mirror.every(e=>R.searchDocument(e.id.slice(10)).includes('miroir')));
 assert.equal(Codex.query({text:'miroir',status:'terrain'}).some(e=>e.id.startsWith('programme-')),false);
 assert.equal(hash(R.records),before);assert.equal(R.searchDocument('DW-9999'),'');
});
test('160 save revision: anchored details append only, without changing POIs, floors, loot or version 2',()=>{
 const old=W.create(17117,8,{detailVersion:2}),next=W.create(17117,8,{detailVersion:3});
 assert.equal(hash(old.pois),hash(next.pois));assert.equal(hash(old.roads),hash(next.roads));let count=0;
 for(const p of next.pois.slice(0,12)){const o=old.pois.find(q=>q.id===p.id);for(const z of p.levels){
  const a=old.detailAt(o,z),b=next.detailAt(p,z);assert.deepEqual(next.plan(p,z),old.plan(o,z));assert.deepEqual(b.outdoor,a.outdoor);assert.deepEqual(b.interior.filter(i=>!i.anchored160),a.interior);count+=b.anchors160.added;
 }}assert.ok(count>0);
 const s=S.initial();s.generation=8;s.detailVersion=3;assert.equal(S.normalize(s).detailVersion,3);assert.throws(()=>S.normalize({...s,detailVersion:11}));
});
test('160 activation: depot opt-in updates only revision and is not applied twice',()=>{
 const g=campaign(),before=checkpoint(g),action=g.worldOps131.actions().find(a=>a.id==='anchoredDetails160');assert.ok(action&&!action.disabled,action?.reason);
 const r=action.run();assert.equal(r.ok,true,r.reason);const after=checkpoint(g);assert.equal(after.frontier.detailVersion,3);after.frontier.detailVersion=before.frontier.detailVersion;assert.deepEqual(after,before);
 assert.equal(g.worldOps131.actions().find(a=>a.id==='anchoredDetails160').disabled,true);
 assert.equal(g.worldOps131.upgradeDetails159(3).ok,false);
});
test('160 activation: a rejected restore or unknown revision cannot report success',()=>{
 const g=campaign(),before=checkpoint(g),restore=g.restoreSave;g.restoreSave=()=>false;
 try{assert.equal(g.worldOps131.upgradeDetails159(3).ok,false);assert.deepEqual(checkpoint(g),before);}finally{g.restoreSave=restore;}
 assert.equal(g.worldOps131.upgradeDetails159(11).ok,false);assert.deepEqual(checkpoint(g),before);
 g.player.reload=1;const state=checkpoint(g),action=g.worldOps131.actions().find(a=>a.id==='anchoredDetails160');assert.ok(action.disabled);assert.equal(action.run().ok,false);assert.deepEqual(checkpoint(g),state);
});
