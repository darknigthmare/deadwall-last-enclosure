'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');

test('QA indépendante 133 : les accès privés de l’épicerie et de la station restent libres d’arbres, sur trois graines',()=>{
 for(const seed of [17117,84329,1]){
  const w=W.create(seed,5);
  for(const id of ['P0001','P0002']){
   const p=w.pois.find(p=>p.id===id);assert.ok(p?.drive,'Accès initial attendu');
   const {a,b,width}=p.drive,r=Math.hypot(b.x-a.x,b.y-a.y)/2+6;
   const chunks=w.around((a.x+b.x)/2,(a.y+b.y)/2,r),trees=chunks.flatMap(c=>c.trees);
   for(const tree of trees)assert.ok(G.nearest(tree,a,b).d>=width/2+tree.r,`graine ${seed}, ${id} : le tronc ${tree.id} occupe la chaussée`);
   const snapshots=chunks.map(c=>({x:c.cx,y:c.cy,ids:[...c.trees,...c.rocks,...(c.cleared||[])].map(v=>v.id).sort()}));
   for(let i=0;i<30;i++)w.chunk(55+i%12,50+Math.floor(i/12));
   for(const s of snapshots){const c=w.chunk(s.x,s.y);assert.deepEqual([...c.trees,...c.rocks,...(c.cleared||[])].map(v=>v.id).sort(),s.ids,'Le streaming ne doit pas recréer des objets différents après éviction.');}
   assert.ok(w.cacheSize()<=25,'Cache borné malgré les accès privés');
  }
 }
});

test('QA indépendante 133 : 128 graines gardent les maisons hors des chaussées publiques et le dépôt hors d’un carrefour',()=>{
 const X=require('../src/exploration-125.js');
 for(let seed=0;seed<128;seed++){
  const p=X.createFeaturePlan(seed,4096,3),buildings=p.settlements.flatMap(s=>s.buildings).concat(p.backyards.map(y=>y.house));
  const roads=p.roads.filter(r=>r.className!=='access');
  for(const b of buildings)for(const r of roads){
   const a=r.axis==='h'||r.axis==='v'?{x:r.x,y:r.y}:{x:r.x1,y:r.y1};
   const z=r.axis==='h'?{x:r.x+r.length,y:r.y}:r.axis==='v'?{x:r.x,y:r.y+r.length}:{x:r.x2,y:r.y2};
   assert.equal(G.segmentRect(a,z,{x:b.x-b.w/2-r.width/2,y:b.y-b.h/2-r.width/2,w:b.w+r.width,h:b.h+r.width}),false,`graine ${seed} : maison ${b.id} sur chaussée ${r.id}`);
  }
  assert.equal(roads.some(r=>X.roadContains(r,2048,2048,70)),false,`graine ${seed} : le dépôt ne doit pas être posé au milieu d’une chaussée`);
 }
});
