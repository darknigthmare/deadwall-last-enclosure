'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const R=require('../src/codex3000-runtime.js'),G=require('../src/frontier-geometry.js'),D=require('../src/seed-detail157.js'),S=require('../src/codex-sites162.js'),W=require('../src/frontier-world.js');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function parcel(type='villa',id='P0010'){const d=G.BY[type];const p={...d,id,type,x:500,y:800,a:.73,generation:7};p.parking=G.parking(p);p.outdoor=G.outdoor(p);return p;}
function checkPaths(site,p,detail){
 const obstacles=S.obstacles(p,detail),bounds=site.bounds;
 for(const path of site.paths){
  for(const q of [path.a,path.b])assert.ok(q.x>=bounds.x&&q.y>=bounds.y&&q.x<=bounds.x+bounds.w&&q.y<=bounds.y+bounds.h);
  for(const o of obstacles){const margin=S.RULES.pathWidth/2;
   assert.equal(G.segmentRect(path.a,path.b,{x:o.x-margin,y:o.y-margin,w:o.w+margin*2,h:o.h+margin*2}),false,`${p.id} ${o.id} route overlaps protected support`);
  }
 }
 assert.equal(new Set(site.connected).size,site.connected.length);
 assert.ok(site.connected.every(id=>!site.unreachable.includes(id)));
 assert.ok(Object.isFrozen(site)&&Object.isFrozen(site.paths));
}
test('162: all 4000 programmes retain historical exterior materials and independent source identity',()=>{
 const families=new Set(),legacyFamilies=new Set(),profiles=new Set();let legacy=0,independent=0;
 for(const r of R.records){const before=hash(r),d=S.describe(r.id);assert.ok(d,r.id);families.add(r.family);profiles.add(d.id);assert.ok(S.MATERIALS[d.material]);assert.equal(hash(r),before);if(r.independent)independent++;else{legacy++;legacyFamilies.add(r.family);}}
 assert.equal(legacy,3000);assert.equal(independent,1000);assert.equal(legacyFamilies.size,33);
 assert.equal(families.size,33);assert.equal(profiles.size,18);assert.equal(S.describe('DW-9999'),null);
 assert.equal(S.profileFor({programme3000:'DW-0001',type:'codex3000-0001'}).natural,true);
 assert.equal(S.profileFor(parcel('marketgarden')).material,'earth');
 assert.equal(S.profileFor(parcel('warehouse')).material,'concrete');
 assert.equal(R.enabled(R.get('DW-0300'),{biome:'meadow'}),false);
});
test('162: every historical type, three seeds, real cars and garden fixtures yield deterministic clear paths',()=>{
 let parcels=0,segments=0,reachable=0;
 for(const seed of [0,42,17117])for(const d of G.PRESETS){
  const p=parcel(d.id,'P'+String(parcels).padStart(4,'0')),detail=D.make(seed,p,0,G.plan(p,0)),before=hash([p,detail]);
  const a=S.build({seed,p,detail}),b=S.build({seed,p,detail});assert.deepEqual(a,b);assert.equal(hash([p,detail]),before);
  checkPaths(a,p,detail);parcels++;segments+=a.paths.length;reachable+=a.connected.length;
 }
 assert.equal(parcels,186);assert.ok(segments>1000&&reachable>150);console.log(JSON.stringify({parcels,segments,reachable}));
});
test('162: closed rear areas are not advertised as connected; an open gate is followed without straight shortcuts',()=>{
 const p={...parcel('house'),parking:[],outdoor:[]},detail={interior:[],outdoor:[
 {id:'left',kind:'fence',solid:true,x:-5,y:12,w:.25,h:10},
 {id:'right',kind:'fence',solid:true,x:19,y:12,w:.25,h:10},
 {id:'top',kind:'fence',solid:true,x:-5,y:12,w:24,h:.25},
 {id:'bottom',kind:'fence',solid:true,x:-5,y:22,w:24,h:.25},
 {id:'locked-shed',kind:'shed',solid:true,x:4,y:17,w:3.2,h:2.5}
 ]};
 const closed=S.build({seed:42,p,detail});assert.ok(closed.unreachable.includes('locked-shed'));checkPaths(closed,p,detail);
 const open={...detail,outdoor:detail.outdoor.filter(o=>o.id!=='bottom')};const result=S.build({seed:42,p,detail:open});assert.ok(result.connected.includes('locked-shed'));checkPaths(result,p,open);
 const blocked={...p,outdoor:[{id:'entrance-block',x:p.w/2-3,y:-4,w:6,h:5}]};assert.equal(S.build({seed:42,p:blocked,detail}).reason,'entry-obstructed');
});
test('162: rotated parked cars contribute their full conservative local footprint',()=>{
 const p={...parcel(),parking:[],outdoor:[]};for(const angle of [0,.3,Math.PI/2,2.8]){
  const q=G.global(p,p.w/2+5,-6),car={id:'car',...q,w:9,h:2.8,a:angle};p.parking=[car];
  const b=S.obstacles(p,{outdoor:[]}).find(x=>x.id==='car');
  for(const [x,y]of [[0,0],[9,0],[9,2.8],[0,2.8]]){const world=G.global(car,x,y),local=G.local(p,world.x,world.y);assert.ok(local.x>=b.x-1e-8&&local.x<=b.x+b.w+1e-8&&local.y>=b.y-1e-8&&local.y<=b.y+b.h+1e-8);}
  checkPaths(S.build({seed:42,p,detail:{outdoor:[]}}),p,{outdoor:[]});
 }
});
test('162: presentation cache is bounded and no collision, loot, floor or source identity changes',()=>{
 const w=W.create(17117,8,{detailVersion:3}),before=hash(w.pois),p=w.pois[0],plan=hash(w.plan(p,0)),detail=hash(w.detailAt(p,0));
 const a=S.forWorld(w,p);assert.equal(S.forWorld(w,p),a);
 for(const q of w.pois.slice(1,35))S.forWorld(w,q);assert.equal(S.cacheSize(w),24);assert.deepEqual(S.forWorld(w,p),a);
 assert.equal(hash(w.pois),before);assert.equal(hash(w.plan(p,0)),plan);assert.equal(hash(w.detailAt(p,0)),detail);
 assert.equal(S.forWorld({generation:6},p),null);assert.equal(S.forWorld(null,p),null);
 for(const o of a.pads)assert.equal(o.amount,undefined);for(const s of a.paths)assert.equal(s.solid,undefined);
});
test('162: the actual ground painter draws only within the local site bounds and restores canvas state',()=>{
 const {createCanvas}=require('@napi-rs/canvas');require('../src/frontier-art.js');
 const p=parcel('house'),detail=D.make(42,p,0,G.plan(p,0)),site=S.build({seed:42,p,detail});
 const c=createCanvas(800,800).getContext('2d');c.translate(200,200);c.scale(8,8);const transform=c.getTransform();
 assert.equal(S.draw(c,site),true);assert.deepEqual(c.getTransform(),transform);
 const img=c.getImageData(0,0,800,800).data;let painted=0;
 for(let y=0;y<800;y++)for(let x=0;x<800;x++){const alpha=img[(y*800+x)*4+3];if(!alpha)continue;painted++;
 assert.ok(x>=Math.floor(200+site.bounds.x*8)-1&&x<=Math.ceil(200+(site.bounds.x+site.bounds.w)*8)+1);
 assert.ok(y>=Math.floor(200+site.bounds.y*8)-1&&y<=Math.ceil(200+(site.bounds.y+site.bounds.h)*8)+1);}
 assert.ok(painted>100);assert.equal(S.draw(c,null),false);
});
test('162: G8 extension rejects a false restore instead of publishing a success message',()=>{
 const Ops=require('../src/world-pack131.js'),{boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');
 require('./helpers/generation141.cjs').legacy(g,7);
 assert.equal(g.frontier.position().generation,7,'This migration starts from an explicitly preserved G7 campaign');
 standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 const state=()=>{const s=g.serialize();delete s.timestamp;return s;},before=state(),restore=g.restoreSave;g.restoreSave=()=>false;
 try{const action=g.worldOps131.actions().find(a=>a.id==='expandCodex3000');assert.ok(action&&!action.disabled);assert.equal(action.run().ok,false);assert.deepEqual(state(),before);}finally{g.restoreSave=restore;}
});
