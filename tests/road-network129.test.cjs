'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Road=require('../src/region-roadkit.js'),G=require('../src/frontier-geometry.js'),W=require('../src/frontier-world.js');
const road=(ax,ay,bx,by,width=7)=>({a:{x:ax,y:ay},b:{x:bx,y:by},width});
function canvas(){const strokes=[],fills=[],texts=[],rotations=[];let path=[];const stack=[];const c={strokes,fills,texts,rotations,lineWidth:1,lineDashOffset:0,strokeStyle:'',fillStyle:'',lineCap:'butt',save(){stack.push({lineWidth:this.lineWidth,lineDashOffset:this.lineDashOffset,strokeStyle:this.strokeStyle,fillStyle:this.fillStyle,lineCap:this.lineCap});},restore(){Object.assign(this,stack.pop());},setTransform(){},translate(){},scale(){},rotate(a){rotations.push(a);},setLineDash(a){this.dash=a;},beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},closePath(){},arc(...a){path.push({arc:a});},stroke(){strokes.push({color:this.strokeStyle,width:this.lineWidth,cap:this.lineCap,path:path.slice(),offset:this.lineDashOffset,dash:this.dash});},fill(){fills.push({color:this.fillStyle,path:path.slice()});},fillRect(...rect){fills.push({color:this.fillStyle,rect});},strokeRect(...rect){strokes.push({color:this.strokeStyle,rect});},fillText(text,...p){texts.push({text,p});}};return c;}
function contains(spans,n){return spans.some(([a,b])=>n>=a&&n<=b);}
test('1.29 roads: every shoulder is beneath every surface, with no artificial junction disk',()=>{
 const roads=[road(-30,0,30,0),road(0,-25,0,0,4),road(14,0,14,25,4)],c=canvas(),before=JSON.stringify(roads);
 Road.drawNetwork(c,roads);assert.equal(JSON.stringify(roads),before);
 assert.deepEqual(c.strokes.slice(0,6).map(s=>s.color),[...Array(3).fill(Road.STYLE.shoulder),...Array(3).fill(Road.STYLE.surface)]);
 assert.deepEqual(c.strokes.slice(3,6).map(s=>s.width),[7,4,4]);assert.equal(c.fills.length,0);
 for(const s of c.strokes)assert.ok(s.path.every(p=>Array.isArray(p)),'no roundabout invented');
});
test('1.29 roads: T-junction stops centre marks before the driveway surface',()=>{
 const main=road(-30,0,30,0),drive=road(0,-25,0,0,4),spans=Road.markingSpans(main,[main,drive]);
 assert.deepEqual(spans,[[0,27.3],[32.7,60]]);assert.equal(contains(spans,30),false);assert.equal(contains(spans,20),true);
 assert.deepEqual(Road.markingSpans(drive,[main,drive]),[]);
});
test('1.29 roads: acute and oblique junctions clear the full crossing width',()=>{
 for(const angle of[Math.PI/6,Math.PI/4,Math.PI/2]){const main=road(-40,0,40,0),cross=road(-30*Math.cos(angle),-30*Math.sin(angle),30*Math.cos(angle),30*Math.sin(angle),6),spans=Road.markingSpans(main,[main,cross]),clear=3.7/Math.sin(angle);
  assert.ok(Math.abs(spans[0][1]-(40-clear))<1e-8);assert.ok(Math.abs(spans[1][0]-(40+clear))<1e-8);assert.equal(contains(spans,40),false);
 }
});
test('1.29 roads: straight split segments retain their continuous centre marking',()=>{
 const a=road(0,0,30,0),b=road(30,0,80,0);assert.deepEqual(Road.markingSpans(a,[a,b]),[[0,30]]);assert.deepEqual(Road.markingSpans(b,[a,b]),[[0,50]]);
});
test('1.29 roads: nearby parallel lanes and remote crossings do not erase markings',()=>{
 const main=road(0,0,60,0),parallel=road(0,10,60,10),remote=road(20,10,20,40);assert.deepEqual(Road.markingSpans(main,[main,parallel,remote]),[[0,60]]);
});
test('1.29 roads: close driveways merge their junction opening without dash fragments',()=>{
 const main=road(0,0,60,0),a=road(20,-10,20,0,4),b=road(24,0,24,10,4);assert.deepEqual(Road.markingSpans(main,[main,a,b]),[[0,17.3],[26.7,60]]);
 const c=canvas();Road.drawNetwork(c,[main,a,b]);assert.deepEqual(c.strokes.filter(s=>s.color===Road.STYLE.marking).map(s=>s.offset||0),[0,-26.7]);
});
test('1.29 roads: viewport keeps intersecting long segments and rejects offscreen or invalid data',()=>{
 const c=canvas(),roads=[road(-100,0,100,0),road(-2,-100,-2,100),road(80,80,90,80),road(0,0,0,0),road(NaN,0,20,0)];
 assert.deepEqual(Road.drawNetwork(c,roads,{view:{l:-10,r:10,t:-10,b:10},markings:false}),{roads:2,spans:0});assert.equal(c.strokes.length,4);
});
test('1.29 roads: real G4 school driveway joins its generated main road without mutating IDs or geometry',()=>{
 const w=W.create(17117,4),p=w.pois.find(p=>p.type==='school'),main=w.roads.find(r=>r.width>4&&G.nearest(p.drive.a,r.a,r.b).d<.001);assert.ok(main);
 const before=JSON.stringify({roads:w.roads,drive:p.drive,junctions:w.junctions});
 const point=G.nearest(p.drive.a,main.a,main.b),len=Math.hypot(main.b.x-main.a.x,main.b.y-main.a.y);assert.equal(contains(Road.markingSpans(main,[main,p.drive]),point.t*len),false);
 const c=canvas();Road.drawNetwork(c,[...w.roads,...w.pois.map(p=>p.drive)],{view:{l:point.x-25,r:point.x+25,t:point.y-25,b:point.y+25}});
 assert.ok(c.strokes.length>3);assert.equal(JSON.stringify({roads:w.roads,drive:p.drive,junctions:w.junctions}),before);
});
test('1.29 regional minimap: live seed, rotated actual footprints, camera extent and heading',()=>{
 globalThis.DeadwallFrontierGeometry=G;globalThis.DeadwallRoadKit=Road;const calls=[];globalThis.DeadwallAtlasRender={drawHome(_c,_g,opts){calls.push(opts);},getApproaches:()=>[]};require('../src/frontier-art.js');
 const p={id:'school',x:30,y:50,w:38,h:28,a:Math.PI/6,drive:road(30,0,30,36,4)},c=canvas(),g={mctx:c,minimap:{width:220,height:220},width:1440,height:900,frontier:{visibleEnemy:()=>true}},v={x:20,y:30,a:1.2,scale:36,seen:['school'],world:{seed:17117,roads:[road(0,0,90,0)],nearPOI:()=>[p]},enemies:[]};
 const report=globalThis.DeadwallFrontierArt.minimap(g,v);assert.equal(report.seed,17117);assert.deepEqual(report.field,{w:40,h:25});assert.deepEqual(report.places,['school']);assert.ok(c.rotations.includes(p.a));assert.ok(c.rotations.includes(v.a));assert.ok(c.fills.some(x=>x.rect?.join(',')==='-19,-14,38,28'));assert.ok(c.texts.some(x=>x.text.includes('Graine 17117')));assert.equal(calls[0].resources,true);
 v.world.seed=42;v.seen=[];const next=globalThis.DeadwallFrontierArt.minimap(g,v);assert.equal(next.seed,42);assert.deepEqual(next.places,[]);assert.ok(c.texts.some(x=>x.text.includes('Graine 42')));
});
