'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const N=require('../src/codex-native173.js'),R=require('../src/codex3000-runtime.js'),G=require('../src/frontier-geometry.js');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
test('173 native: all 3000 records preserve source identities, requested levels and repetitions, exteriors outside the shell',()=>{
 let supported=0,rooms=0,yards=0,levels=0,stairs=0;const before=hash(R.records);
 for(const rec of R.records){const m=N.build(rec.id,17117);if(!m.supported)continue;supported++;const d=R.describe(rec.id),all=[...m.floors.flatMap(f=>f.rooms),...m.yards];
  assert.equal(new Set(all.map(s=>s.id)).size,all.length);
  for(const s of d.rooms){const instances=all.filter(i=>i.source===s.id);assert.ok(instances.length>=s.repeat[0]&&instances.length<=s.repeat[1]);for(const i of instances){assert.equal(i.exterior,s.exterior===true);if(s.levels?.length)assert.ok(s.levels.includes(i.z));}}
  assert.ok(d.rooms.flatMap(s=>s.levels||[]).every(z=>m.p.levels.includes(z)));
  for(const f of m.floors){for(const room of f.rooms){assert.equal(room.exterior,false);assert.ok(room.x>=0&&room.y>=0&&room.x+room.w<=m.p.w&&room.y+room.h<=m.p.h);}assert.equal(f.doors.length,f.rooms.length);
   for(const door of f.doors){assert.ok(!f.walls.some(w=>G.circleRect(door.inside.x,door.inside.y,.32,w)));assert.ok(!f.walls.some(w=>G.circleRect(door.corridor.x,door.corridor.y,.32,w)));}
   const s=f.stairs[0];if(s)assert.ok(!f.walls.some(w=>G.circleRect(s.x+s.w/2,s.y+s.h/2,.32,w)));
  }
  for(const y of m.yards){assert.ok(!hit(y,{x:0,y:0,w:m.p.w,h:m.p.h}));assert.equal(y.roofed,false);for(const other of m.yards)if(other.id!==y.id&&other.z===y.z)assert.ok(!hit(y,other));}
  for(const t of m.transitions){assert.equal(t.to-t.from,1);assert.ok(m.floors.filter(f=>[t.from,t.to].includes(f.z)).every(f=>f.stairs.some(s=>Math.abs(s.x+s.w/2-t.x)<1e-9&&Math.abs(s.y+s.h/2-t.y)<1e-9)));}
  rooms+=m.summary.indoor;yards+=m.summary.outdoor;levels+=m.summary.levels;stairs+=m.transitions.length;
 }
 assert.equal(hash(R.records),before);assert.equal(supported,2374);console.log('NATIVE173_ALL '+JSON.stringify({supported,rooms,yards,levels,stairs}));
});
test('173 native: seed reproducibility, immutable models and support issues are explicit',()=>{
 const a=N.build('DW-0001',42);assert.deepEqual(a,N.build('DW-0001',42));assert.ok(Object.isFrozen(a.floors[0].rooms));
 assert.ok(a.yards.length);assert.ok(a.issues.some(i=>i.reason==='plot-exceeds-source-envelope'));
 assert.equal(N.build('DW-0300').supported,false);for(const bad of [-1,1.5,4294967296,null])assert.throws(()=>N.build('DW-0001',bad));assert.throws(()=>N.floor(a,99));
});
test('173 native furnishings: exact original source is unchanged, no decorative loot and garden gate stays open',()=>{
 for(const id of ['DW-0001','DW-0020','DW-0051','DW-0123','DW-0221','DW-0501']){const model=N.build(id,42),before=hash(model);if(!model.supported)continue;
  for(const z of model.p.levels){const d=N.details(model,z);assert.strictEqual(d,N.details(model,z));assert.equal(hash(model),before);
   for(const o of [...d.interior,...d.outdoor]){assert.equal(o.amount,undefined);assert.equal(o.resource,undefined);assert.ok([o.x,o.y,o.w,o.h].every(Number.isFinite));}
   for(const door of N.floor(model,z).doors)assert.equal(N.blocked(model,door.inside.x,door.inside.y,z),false,door.id);
   for(const zone of model.yards.filter(z=>z.z===0))for(const offset of [-.3,0,.3])assert.equal(N.blocked(model,zone.x+offset,zone.y+zone.h/2,0),false);
  }
 }
});
test('173 native stairs: matching landing is mandatory, adjacent floors only, vehicles are refused',()=>{
 const model=N.build('DW-0501',42),t=model.transitions[0];assert.ok(t);const s={x:t.x,y:t.y,z:t.from,mode:'foot',inventory:{wood:3}};
 const up=N.moveLevel(model,s,1);assert.ok(up.ok);assert.equal(up.state.z,t.to);assert.deepEqual(up.state.inventory,s.inventory);assert.deepEqual(N.moveLevel(model,up.state,-1).state,s);
 assert.equal(N.moveLevel(model,{...s,x:0},1).ok,false);assert.equal(N.moveLevel(model,{...s,mode:'vehicle'},1).ok,false);
});
