'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('../src/codex-size163.js'),Q=require('../src/codex3000-recipes159.js'),G=require('../src/frontier-geometry.js');
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const spec=(asset='chair',w=.48,h=.5)=>({asset,gabarit_m:{longueur:w,largeur:h,hauteur:asset==='sign'?2:.9},quantite_par_espace:[1,3],loot_eligible:false});
function fixture(){
 const p={id:'P0163',w:24,h:18,levels:[0],outdoor:[],a:.73,x:200,y:300};
 const room={name:'Salle de lecture',x:.4,y:.4,w:23.2,h:17.2};
 return {seed:17117,p,z:0,plan:{walls:[],stairs:[],rooms:[room],objects:[{id:'finite-stock',kind:'crate',x:16,y:2,w:1.2,h:.8,amount:7,resource:'scrap'}]},
  detail:{interior:[{id:'old-chair',kind:'chair',x:4,y:3,w:.65,h:.65,solid:true,access165:{x:4,y:3.8,w:.8,h:.9}},{id:'old-sign',kind:'sign',x:6,y:2,w:1.5,h:.45,solid:true}],outdoor:[]},
  description:{id:'DW-0018',rooms:[{...room,id:'source-room',levels:[0],exterior:false,authoredProps:[spec(),spec('sign',.8,.12)]}]},recipes:Q};
}
test('163 size: only exact unambiguous authored dimensions are offered to new density placements',()=>{
 const room=fixture().description.rooms[0];assert.deepEqual(S.shapeFor('chair',room),{w:.48,h:.5,height:.9,source:'authored-footprint'});
 assert.deepEqual(S.shapeFor('chair',{authoredProps:[spec(),spec()]}),S.shapeFor('chair',room));
 for(const source of [null,{authoredProps:{}},{sourceProps158:[{kind:'chair'}]},{authoredProps:[spec(),spec('chair',.52,.5)]},{authoredProps:[{asset:'chair',gabarit_m:{longueur:.48,largeur:.5}}]}])assert.equal(S.shapeFor('chair',source),null);
 for(const bad of [NaN,Infinity,0,-1])assert.equal(S.shapeFor('chair',{authoredProps:[spec('chair',bad,.5)]}),null);
 assert.equal(S.shapeFor('table',room),null);
});
test('163 size: source footprints shrink real details with stable centres, IDs, loot owners and all previously accessible cells',()=>{
 const a=fixture(),before=hash(a),result=S.enrich(a);assert.equal(hash(a),before);assert.equal(Object.isFrozen(a.detail.interior[0]),false);
 assert.equal(result.size163.adjusted,2);assert.equal(result.size163.navigationChecked,true);assert.equal(result.size163.scope,'authored-floor-footprints-not-height-or-building-conformance');
 assert.strictEqual(result.outdoor,a.detail.outdoor);assert.deepEqual(a.plan.objects,[{id:'finite-stock',kind:'crate',x:16,y:2,w:1.2,h:.8,amount:7,resource:'scrap'}]);
 const base=Q.accessGrid(a.p,0,a.plan,a.detail),next=Q.accessGrid(a.p,0,a.plan,result);
 assert.ok(base.reachable.every((v,i)=>!v||next.reachable[i]));
 for(const [i,o]of result.interior.entries()){
  const old=a.detail.interior[i],source=S.shapeFor(o.kind,a.description.rooms[0]);assert.equal(o.id,old.id);
  assert.ok(Math.abs(o.x+o.w/2-old.x-old.w/2)<1e-10&&Math.abs(o.y+o.h/2-old.y-old.h/2)<1e-10);
  assert.equal(o.w,source.w);assert.equal(o.h,source.h);assert.ok(o.x>=old.x&&o.y>=old.y&&o.x+o.w<=old.x+old.w+1e-10&&o.y+o.h<=old.y+old.h+1e-10);
  assert.strictEqual(o.access165,old.access165);assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);
  assert.ok(Object.isFrozen(o.size163.source));
 }
 assert.deepEqual(result,S.enrich(a));assert.strictEqual(S.enrich({...a,detail:result}),result);
});
test('163 size: non-square authored chairs keep physical, sprite and parcel rotations coherent',()=>{
 for(const [tag,turn]of [['ensemble165',0],['ensemble165',1],['ensemble165',2],['ensemble165',3],['anchored160',1],['infill169',3],['station170',2],['garden171',1]]){
  const a=fixture(),layer=tag.slice(-3),angle=turn*Math.PI/2,old=a.detail.interior[0];
  Object.assign(old,{[tag]:true,['angle'+layer]:angle,['spriteWidth'+layer]:.65,['spriteHeight'+layer]:.65});
  const o=S.enrich(a).interior[0],expected=S.extent(.48,.5,angle);assert.equal(o.w,expected.w);assert.equal(o.h,expected.h);
  assert.equal(o['spriteWidth'+layer],.48);assert.equal(o['spriteHeight'+layer],.5);assert.equal(o['angle'+layer],angle);
  // The same parcel transform carries both the collider and the sprite centre.
  assert.deepEqual(G.global(a.p,o.x+o.w/2,o.y+o.h/2),G.global(a.p,old.x+old.w/2,old.y+old.h/2));
 }
});
test('163 size: finite containers, unsupported kinds, missing prescriptions and source expansion retain original objects',()=>{
 for(const change of [a=>a.detail.interior[0].amount=0,a=>a.detail.interior[0].resource=null,a=>a.detail.interior[0].kind='bed',a=>a.description.rooms[0].authoredProps=[],a=>a.description.rooms[0].authoredProps=[spec('chair',.7,.5)],a=>a.description.rooms[0].exterior=true,a=>a.description.rooms[0].levels=[1],a=>a.description.rooms.push({...a.description.rooms[0]})]){
  const a=fixture();change(a);const old=a.detail.interior[0],result=S.enrich(a);assert.strictEqual(result.interior[0],old);assert.equal(result.interior.length,a.detail.interior.length);
 }
});
test('163 size: invalid render metadata, inaccessible entry and navigation loss fail closed',()=>{
 const invalid=fixture();Object.assign(invalid.detail.interior[0],{ensemble165:true,angle165:NaN,spriteWidth165:.65,spriteHeight165:.65});
 assert.strictEqual(S.enrich(invalid).interior[0],invalid.detail.interior[0]);
 const blocked=fixture();blocked.plan.walls.push({x:10,y:-2,w:4,h:3});assert.equal(Q.accessGrid(blocked.p,0,blocked.plan,blocked.detail).baseline,false);
 const stopped=S.enrich(blocked);assert.equal(stopped.size163.adjusted,0);assert.equal(stopped.size163.navigationChecked,false);assert.strictEqual(stopped.interior,blocked.detail.interior);
 const a=fixture();let calls=0;a.recipes={accessGrid(...args){const grid=Q.accessGrid(...args);if(++calls===2){grid.reachable=grid.reachable.slice();grid.reachable[grid.reachable.indexOf(1)]=0;}return grid;}};
 const rejected=S.enrich(a);assert.equal(rejected.size163.adjusted,0);assert.equal(rejected.size163.navigationChecked,false);assert.equal(rejected.size163.reason,'navigation-regression');assert.strictEqual(rejected.interior,a.detail.interior);
});
test('163 size: actual authored historical model improves without rewriting its revision11 plan or details',()=>{
 const P=require('../src/codex-plan165.js'),C=require('../src/codex-coverage167.js'),R=require('../src/codex3000-runtime.js');
 const preview=P.inspect('DW-0018',42,0,11),before=hash(preview),result=S.enrich({...preview,detail:preview.details,description:R.describe(preview.id),recipes:Q});
 assert.equal(hash(preview),before);assert.ok(result.size163.adjusted>0);assert.ok(result.size163.navigationChecked);
 const old=C.compare(preview),next=C.compare({...preview,details:result,detailVersion:12});
 assert.ok(next.totals.footprintMismatches<old.totals.footprintMismatches);assert.equal(next.totals.sourceObjects,old.totals.sourceObjects);assert.equal(next.totals.decorativeObjects,old.totals.decorativeObjects);
 assert.equal(next.totals.newLootRecords,0);assert.deepEqual(preview,P.inspect('DW-0018',42,0,11));
 const independent=P.inspect('DW-3041',42,0,11),kept=S.enrich({...independent,detail:independent.details,description:R.describe(independent.id),recipes:Q});
 assert.equal(kept.size163.adjusted,0);assert.deepEqual(kept.interior,independent.details.interior);
});
test('163 size: the measured on-seed oversized sign becomes an exact authored footprint only in the new layer',()=>{
 const W=require('../src/frontier-world.js'),R=require('../src/codex3000-runtime.js'),C=require('../src/codex-coverage167.js');
 const world=W.create(17117,10,{detailVersion:11}),p=world.pois.find(p=>p.programme3000==='DW-0002');assert.ok(p);
 const plan=world.plan(p,0),detail=world.detailAt(p,0),before=hash([p,plan,detail]),source=detail.interior.find(o=>o.id===p.id+':recipe159:0:r0-0');
 assert.ok(source);assert.equal(source.kind,'sign');assert.equal(source.w,1.5);assert.equal(source.h,.45);
 const result=S.enrich({seed:17117,p,z:0,plan,detail,description:R.describe('DW-0002'),recipes:Q}),sign=result.interior.find(o=>o.id===source.id);
 assert.equal(hash([p,plan,detail]),before);assert.equal(sign.w,.8);assert.equal(sign.h,.12);assert.equal(sign.id,source.id);assert.ok(result.size163.navigationChecked);
 const comparison=C.compare({id:'DW-0002',seed:17117,z:0,supported:true,p,plan,details:result,detailVersion:12});
 assert.equal(comparison.totals.footprintMismatches,0);assert.deepEqual(result.interior.map(o=>o.id),detail.interior.map(o=>o.id));
});
test('163 size: new overhead sign variants fill the exact rotated footprint while historical signs retain their decoded atlas',async()=>{
 const canvas=require('@napi-rs/canvas'),Art=require('../src/seed-detail-art157.js'),Props=require('../src/world-props-art153.js'),path=require('node:path');
 const image=await canvas.loadImage(path.resolve(__dirname,'..',Props.ASSETS.worldPropsRoad153.url));let blits=0;
 const art={images:{worldPropsRoad153:image},blit(c,key,source,...dest){blits++;c.drawImage(image,...source,...dest);return true;}};
 const draw=o=>{const c=canvas.createCanvas(512,512),ctx=c.getContext('2d');ctx.scale(128,128);assert.equal(Art.draw(ctx,o,{art,seed:42}),true);return c.getContext('2d').getImageData(0,0,512,512).data;};
 const historical={id:'old-sign',kind:'sign',x:1,y:1,w:1.5,h:.45,solid:true},oldHash=hash(historical);draw(historical);assert.equal(blits,1);assert.equal(hash(historical),oldHash);
 const variants=new Set();
 for(const marker of ['size163','density163'])for(const turn of [0,1,2,3])for(let variant=0;variant<4;variant++){
  let id;for(let n=0;n<1000;n++){const candidate='metric-sign-'+n;if(Art.variantFor({id:candidate,kind:'sign'},42,4)===variant){id=candidate;break;}}assert.ok(id);
  const a=turn*Math.PI/2,b=S.extent(.8,.12,a),o={id,kind:'sign',x:2-b.w/2,y:2-b.h/2,w:b.w,h:b.h,solid:true,anchored160:true,angle160:a,spriteWidth160:.8,spriteHeight160:.12,[marker]:marker==='size163'?{revision:12}:true};
  const before=hash(o),oldBlits=blits,pixels=draw(o);assert.equal(hash(o),before);assert.equal(blits,oldBlits,'new thin signs do not reuse the upright atlas');
  let left=512,right=-1,top=512,bottom=-1,painted=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(pixels[(y*512+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);painted++;assert.ok(x>=Math.floor(o.x*128)-1&&x<=Math.ceil((o.x+o.w)*128)+1&&y>=Math.floor(o.y*128)-1&&y<=Math.ceil((o.y+o.h)*128)+1,'paint remains inside the real physical box');}
  assert.ok(painted>100);assert.ok((right-left+1)>=o.w*128*.9);assert.ok((bottom-top+1)>=o.h*128*.9);if(marker==='size163'&&turn===0)variants.add(hash(pixels));
 }
 assert.equal(variants.size,4,'four distinct deterministic material variants at the same orientation');
});
