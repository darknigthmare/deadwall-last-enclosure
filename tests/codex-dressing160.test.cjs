'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const G=require('../src/frontier-geometry.js'),R=require('../src/codex3000-runtime.js'),D=require('../src/seed-detail157.js'),P=require('../src/codex-dressing160.js'),W=require('../src/frontier-world.js');
const A=require('../src/seed-detail-art157.js'),Atlas=require('../src/world-codex.js');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const within=(o,b)=>o.x>=b.x&&o.y>=b.y&&o.x+o.w<=b.x+b.w+1e-10&&o.y+o.h<=b.y+b.h+1e-10;
test('160: all 3000 plans and all authored floors receive anchored contents without collision or loot',()=>{
 let floors=0,total=0;const appearances=new Set();
 for(const record of R.records){const b=R.template(record.id,42,'P3000');
  for(const z of b.levels){const p={id:'P3000',...b,codex:record.id,x:120,y:220,a:.3,parking:[],outdoor:[]};p.id='P3000';
   const plan=R.floor(record.id,42,z,p.id),detail={interior:[],outdoor:[]},before=hash([p,plan,detail]);
   const next=P.enrich({seed:42,p,z,plan,detail}),again=P.enrich({seed:42,p,z,plan,detail:next});assert.deepEqual(next,again);
   assert.equal(hash([p,plan,detail]),before);const all=[...next.interior,...next.outdoor];assert.equal(new Set(all.map(o=>o.id)).size,all.length);
   assert.ok(all.length<=96);for(const o of all){assert.equal(o.solid,false);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.equal(o.z,z);assert.ok(within(o,o.supportBounds));assert.ok(P.valid(o));appearances.add(o.style);assert.ok(Object.isFrozen(o));}
   if(z!==0)assert.equal(next.outdoor.length,0);floors++;total+=all.length;
  }
 }
 assert.ok(floors>=3606&&total>10000);assert.ok(appearances.size>=7);console.log(JSON.stringify({floors,attachments:total,appearances:[...appearances]}));
});
test('160: type selection follows actual room use and unsupported props receive no fake decoration',()=>{
 assert.equal(P.typeFor({kind:'table',room:'Cuisine'}),'dishes');assert.equal(P.typeFor({kind:'desk',room:'Archives'}),'book');
 assert.equal(P.typeFor({kind:'workbench',room:'Réparation'}),'tools');assert.equal(P.typeFor({kind:'table',room:'Soins'}),'medical');
 assert.equal(P.typeFor({kind:'missing'}),null);assert.equal(P.valid({kind:'dressing160',style:'__proto__',variant:0,x:0,y:0,w:1,h:1}),false);
});
test('160: real walls own every switch; depth renders contents above their support at all rotations',()=>{
 require('../src/frontier-art.js');const Art=globalThis.DeadwallFrontierArt;
 const p={id:'P0200',type:'house',w:14,h:12,levels:[0],x:100,y:200,a:0,parking:[],outdoor:[]},plan=G.plan(p,0),detail={interior:[],outdoor:[]};
 const next=P.enrich({seed:14,p,z:0,plan,detail});for(const o of next.interior){
  if(o.plane==='wall')assert.ok(plan.walls.some(w=>within(o,w)));else assert.ok(plan.objects.some(w=>w.id===o.supportId&&within(o,w)));
 }
 for(const angle of [0,.7,1.5,2.6,Math.PI]){p.a=angle;for(const o of next.interior)assert.ok(Art.rectDepth(p,o)>Art.rectDepth(p,o.supportBounds));}
});
test('160: atlas searches authored furniture instead of only room titles, without marking projects playable',()=>{
 assert.ok(Atlas.query({text:'réfrigérateur',status:'programme'}).some(e=>e.id==='programme-DW-0001'));
 assert.ok(Atlas.query({text:'serre-joints',status:'programme'}).length>0);
 assert.equal(Atlas.query({text:'réfrigérateur',status:'terrain'}).some(e=>e.id.startsWith('programme-')),false);
});
test('160: pixels remain inside their support; existing sprite painter accepts all new styles',()=>{
 const {createCanvas}=require('@napi-rs/canvas');let painted=0;
 for(const style of Object.keys(P.META))for(const variant of [0,1]){const canvas=createCanvas(100,100),c=canvas.getContext('2d');
  const o={kind:'dressing160',dressing160:true,style,variant,x:20,y:20,w:60,h:60};assert.equal(A.draw(c,o),true);
  const bytes=c.getImageData(0,0,100,100).data;for(let y=0;y<100;y++)for(let x=0;x<100;x++){const alpha=bytes[(y*100+x)*4+3];if(x<20||x>=80||y<20||y>=80)assert.equal(alpha,0);else if(alpha)painted++;}
 }
 assert.ok(painted>2000);
});
test('160: legacy G7/G8 resource records, base details and collision shapes stay byte-identical',()=>{
 const w=W.create(17117,8,{detailVersion:2});let count=0;
 for(const p of w.pois.slice(0,12))for(const z of p.levels){const plan=w.plan(p,z),before=hash([p,plan]);const d=w.detailAt(p,z);
  assert.ok(d.dressing160);assert.deepEqual(d.colliders160.interior,d.interior.filter(o=>o.solid));assert.deepEqual(d.colliders160.outdoor,d.outdoor.filter(o=>o.solid));const stripped={...d,interior:d.interior.filter(o=>!o.dressing160),outdoor:d.outdoor.filter(o=>!o.dressing160)};
  const expected=P.enrich({seed:w.seed,p,z,plan,detail:stripped});assert.deepEqual(expected.interior,d.interior);assert.equal(hash([p,plan]),before);
  for(const o of [...d.interior,...d.outdoor].filter(o=>o.dressing160)){assert.equal(o.solid,false);count++;}
 }
 assert.ok(count>50);
});
