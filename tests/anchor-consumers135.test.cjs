'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),P=require('../src/atlas-projection.js'),Return=require('../src/return-routes.js');
const W=require('../src/frontier-world.js');
test('135 : routes de retour excluent le véritable D-17 décalé, conservent les anciennes coordonnées libres',()=>{
  const home={x:12480,y:10800,minX:12416,maxX:12544,minY:10736,maxY:10864,size:128};
  const world={home,roads:[{id:'new-home',a:{x:12000,y:10800},b:{x:13000,y:10800},width:8},{id:'old-home',a:{x:3900,y:4096},b:{x:4300,y:4096},width:8}]};
  const exterior=Return.outsideWorld(world),atNew=exterior.roads.filter(r=>r.id.startsWith('new-home')),atOld=exterior.roads.filter(r=>r.id.startsWith('old-home'));
  assert.equal(atNew.length,2);assert.equal(atOld.length,1);
  assert.ok(atNew.every(r=>r.b.x<=home.minX||r.a.x>=home.maxX));assert.deepEqual(atOld[0].a,world.roads[1].a);assert.deepEqual(atOld[0].b,world.roads[1].b);
});
test('135 : missions de récupération suivent les lieux proches du dépôt déplacé sans changer les anciennes campagnes',()=>{
  const original=W.create(17117,4),near=P.home(original),offset={x:9000,y:5500};
  const shifted={...original,home:{...near,x:near.x+offset.x,y:near.y+offset.y,minX:near.minX+offset.x,maxX:near.maxX+offset.x,minY:near.minY+offset.y,maxY:near.maxY+offset.y},pois:original.pois.map(p=>({...p,x:p.x+offset.x,y:p.y+offset.y})),plan:(p,z)=>original.plan(original.pois.find(q=>q.id===p.id),z)};
  const before=C.Essentials.targets(original),after=C.Essentials.targets(shifted);
  assert.equal(before.length,12);assert.deepEqual(after.map(t=>[t.id,t.poi,t.objectId]),before.map(t=>[t.id,t.poi,t.objectId]));
  for(let i=0;i<before.length;i++){assert.ok(Math.abs(after[i].x-before[i].x-offset.x)<1e-8);assert.ok(Math.abs(after[i].y-before[i].y-offset.y)<1e-8);}
});
