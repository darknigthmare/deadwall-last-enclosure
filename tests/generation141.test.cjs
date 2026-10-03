'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),Geo=require('../src/geography135.js'),B=require('../src/biomes135.js'),C=require('../src/core.js');
test('141 : les vrais générateurs, plans et réserves G1–G6 conservent les empreintes 1.40',()=>{
 const run=spawnSync(process.execPath,['scripts/qa141-legacy.cjs',root],{cwd:root,encoding:'utf8',timeout:120000});assert.equal(run.status,0,run.stderr);
 assert.deepEqual(JSON.parse(run.stdout),JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/world141-legacy.json'),'utf8')));
});
test('141 G7 : graines reproductibles et D17 entouré de plusieurs kilomètres sur ses quatre côtés',()=>{
 const points=[];for(let seed=0;seed<64;seed++){const h=Geo.home(seed,7);assert.deepEqual(h,Geo.home(seed,7));assert.ok(Object.isFrozen(h));assert.ok(Math.min(h.minX,h.minY,C.GeographyRules135.size-h.maxX,C.GeographyRules135.size-h.maxY)>5500);points.push(h);}
 assert.equal(new Set(points.map(p=>p.x+','+p.y)).size,64);for(const axis of['x','y'])assert.ok(Math.max(...points.map(p=>p[axis]))-Math.min(...points.map(p=>p[axis]))>10000);
 assert.notDeepEqual(Geo.home(17117,7),Geo.home(17117,6));
});
test('141 G7 : réseau naturel raccordé aux quatre limites et à chaque agglomération',()=>{
 const roads=[],n=Geo.generate(84329,{generation:7,biomes:B,addRoad:(a,b,width)=>{const r={a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]},width};roads.push(r);return r;}}),seen=new Set([n.nodes[0].id]);
 for(let i=0;i<n.nodes.length;i++)for(const e of n.edges){if(seen.has(e.a))seen.add(e.b);if(seen.has(e.b))seen.add(e.a);}assert.equal(seen.size,n.nodes.length);assert.equal(n.towns.length,34);assert.equal(n.nodes.filter(n=>n.kind==='terminal').length,4);
 assert.ok(roads.filter(r=>Math.abs(r.a.x-r.b.x)<.01||Math.abs(r.a.y-r.b.y)<.01).length/roads.length<.08);
 for(const road of roads)for(const p of[road.a,road.b])assert.ok(p.x>=60&&p.y>=60&&p.x<=24516&&p.y<=24516);
});
