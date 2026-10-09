'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),BaseArt=require('../src/art.js'),G=require('../src/frontier-geometry.js');
globalThis.DeadwallCore=C;globalThis.DeadwallFrontierGeometry=G;
const Art=require('../src/world-evolution-art.js');require('../src/frontier-art.js');
function scene(angle=0){
 const draws=[],fills=[],transforms=[],buildings=Object.keys(C.WorldEvolution.RULES.districtBuildings).map((type,slot)=>({type,slot,progress:1}));
 const districts=[{id:'east',level:1,pos:{x:0,y:0,a:angle},buildings}],overview={districts,companions:[],fleet:{active:'break'}};
 const ctx={save(){},restore(){},translate(...args){transforms.push(['translate',...args]);},rotate(...args){transforms.push(['rotate',...args]);},fillRect(...args){fills.push({color:this.fillStyle,args});},setLineDash(){},strokeRect(){}};
 const g={world:{},player:{health:100},elapsed:0,state:'playing',settings:{},frontier:{visibleEnemy:()=>true},expeditions:{car:()=>null},
  worldEvolution:{overview:()=>overview,groupMembers:()=>[],structureDestroyed:()=>false},
  art:{images:{buildings:{}},rects:Object.fromEntries(Object.entries(BaseArt.BUILDINGS).map(([id,rect])=>['buildings:'+id,rect])),blit(_c,atlas,rect,...destination){draws.push({atlas,rect,destination});return true;}}};
 const v={x:0,y:0,z:0,a:0,inside:null,enemies:[],taken:{},world:{nearPOI:()=>[],around:()=>[]}},view={l:-60,r:60,t:-60,b:60};
 return{g,v,view,ctx,draws,fills,transforms,overview,buildings};
}
test('regional annexes: six paid models paint distinct original sprites through the live shared depth pipeline, without changing state',()=>{
 const f=scene(),before=JSON.stringify(f.overview),entries=globalThis.DeadwallFrontierArt.depthEntries(f.g,f.v,f.view,[],f.overview).filter(e=>e.kind==='annex');
 assert.equal(entries.length,6);for(const e of entries)e.draw(f.ctx);
 assert.equal(f.draws.length,6);assert.equal(new Set(f.draws.map(d=>d.rect)).size,6);assert.ok(f.draws.every(d=>d.atlas==='buildings'));
 assert.equal(JSON.stringify(f.overview),before);
 for(const [i,d]of f.draws.entries()){
  const [x,y,w,h]=d.destination,slot=f.buildings[i].slot,left=-22+slot%2*28,top=-22+Math.floor(slot/2)*13;
  assert.ok(x>=left&&x+w<=left+20+1e-9);assert.ok(y>=top-4-1e-9);assert.ok(Math.abs(y+h-(top+9))<1e-9);
  assert.ok(Math.abs(w/h-d.rect[2]/d.rect[3])<1e-9,'original silhouette keeps its aspect ratio');
 }
});
test('regional annexes: rotated foundations keep the exact physical depth and the legacy projection uses the same sprites',()=>{
 for(const angle of [0,Math.PI/2,Math.PI/3,Math.PI]){
  const f=scene(angle),entries=Art.depthEntries(f.g,f.v,f.view,f.overview);
  for(const [i,e]of entries.entries()){
   const x=-22+i%2*28,y=-22+Math.floor(i/2)*13,expected=Math.max(...[[x,y],[x+20,y],[x,y+9],[x+20,y+9]].map(([xx,yy])=>Math.sin(angle)*xx+Math.cos(angle)*yy));
   assert.equal(e.depth,expected);e.draw(f.ctx);
  }
  const first=[...f.draws];f.draws.length=0;Art.draw(f.ctx,f.g,f.v,f.view);assert.deepEqual(f.draws,first);
  assert.ok(f.transforms.some(t=>t[0]==='rotate'&&t[1]===angle));
 }
});
test('regional annexes: unfinished work, absent images, upper floors and off-screen districts preserve their existing visible states',()=>{
 const f=scene();f.buildings[0].progress=.5;for(const e of Art.depthEntries(f.g,f.v,f.view,f.overview))e.draw(f.ctx);
 assert.equal(f.draws.length,5);assert.ok(f.fills.some(p=>p.color==='#8b765a'&&p.args[2]===20&&p.args[3]===9));
 assert.ok(f.fills.some(p=>p.color==='#d5bd82'&&p.args[2]===10&&p.args[3]===.55));
 f.buildings[0].progress=1;f.g.art.images={};f.draws.length=0;f.fills.length=0;for(const e of Art.depthEntries(f.g,f.v,f.view,f.overview))e.draw(f.ctx);
 assert.equal(f.draws.length,0);assert.equal(f.fills.filter(p=>p.color==='#768b72').length,6);
 f.v.z=1;assert.equal(Art.depthEntries(f.g,f.v,f.view,f.overview).length,0);
 f.v.z=0;f.overview.districts[0].pos.x=200;assert.equal(Art.depthEntries(f.g,f.v,f.view,f.overview).length,0);
});
