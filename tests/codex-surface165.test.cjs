'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('../src/codex-dressing160.js'),A=require('../src/seed-detail-art157.js'),G=require('../src/frontier-geometry.js');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function fixture(kind='desk',angle=0){const [w,h]=G.SHAPES[kind]||[2,1];return {id:'fixture:'+kind,kind,room:'Bureau',x:3,y:4,w:angle%Math.PI?h:w,h:angle%Math.PI?w:h,spriteWidth160:w,spriteHeight160:h,angle160:angle,anchored160:true,solid:true,z:0};}
test('165 contents: four orientations, all supported furniture and three seeds keep items inside their own surface',()=>{
 let supports=0,children=0;const styles=new Set();
 for(const kind of Object.keys(G.SHAPES))for(const seed of [0,42,4294967295])for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
  const o=fixture(kind,angle),before=digest(o),items=S.surfaceItems165(o,seed);assert.equal(digest(o),before);assert.equal(items,S.surfaceItems165(o,seed));assert.ok(Object.isFrozen(items));assert.ok(items.length<=3);
  for(const item of items){assert.ok(S.valid(item));assert.ok(Object.isFrozen(item));assert.ok(item.w>0&&item.h>0);assert.equal(item.supportId,o.id);assert.equal(item.solid,false);assert.equal(item.amount,undefined);assert.equal(item.resource,undefined);
   assert.ok(item.x>=-o.spriteWidth160/2&&item.y>=-o.spriteHeight160/2&&item.x+item.w<=o.spriteWidth160/2&&item.y+item.h<=o.spriteHeight160/2);
   assert.ok(items.filter(x=>x!==item).every(x=>!overlap(x,item)));styles.add(item.style);children++;
  }if(items.length)supports++;
 }
 assert.ok(supports>100&&children>150&&styles.size>=6);console.log('SURFACES165 '+JSON.stringify({supports,children,styles:[...styles].sort()}));
});
test('165 contents: bounded cache evicts without changing a support and invalid supports remain empty',()=>{
 const original=S.surfaceItems165(fixture(),17117),before=digest(original);for(let i=0;i<200;i++)S.surfaceItems165({...fixture(),id:'other:'+i},i);
 assert.ok(S.surfaceCacheStats165().entries<=128);assert.equal(digest(S.surfaceItems165(fixture(),17117)),before);
 for(const o of [null,{}, {...fixture(),anchored160:false},{...fixture(),spriteWidth160:0},{...fixture(),spriteHeight160:Infinity},{...fixture(),id:''}])assert.deepEqual(S.surfaceItems165(o,42),[]);
 assert.deepEqual(S.surfaceItems165(fixture(),1.5),[]);
});
test('165 contents: the real detail painter draws contents after their rotated furniture without altering its collider',()=>{
 const saved=globalThis.DeadwallCodexDressing160;let depth=0;const calls=[];
 const c=new Proxy({save(){depth++;calls.push('save');},restore(){depth--;calls.push('restore');},rotate(a){calls.push(['rotate',a]);},fillRect(){calls.push('furniture-paint');}}, {get(t,k){return k in t?t[k]:(...args)=>{calls.push(k);};},set(t,k,v){t[k]=v;return true;}});
 globalThis.DeadwallCodexDressing160={surfaceItems165:S.surfaceItems165,draw(ctx,o){assert.ok(calls.includes('furniture-paint'),'contents painted before support');calls.push('contents');return S.draw(ctx,o);}};
 try{for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2]){calls.length=0;const o=fixture('desk',angle),before=digest(o);assert.equal(A.draw(c,o,{art:null,seed:42}),true);assert.ok(calls.includes('contents'));assert.ok(calls.some(x=>Array.isArray(x)&&x[0]==='rotate'&&x[1]===angle));assert.equal(depth,0);assert.equal(digest(o),before);}}
 finally{globalThis.DeadwallCodexDressing160=saved;}
});
