'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const A=require('../src/interior-art153.js'),G=require('../src/frontier-geometry.js');
const source=fs.readFileSync(path.join(__dirname,'../src/frontier-art.js'),'utf8');
function fixture({destroyed=false,cache=null,available=true}={}){
 const trace=[],game={world:{seed:1234},art:{images:available?Object.fromEntries(Object.keys(A.ASSETS).map(k=>[k,{}])):{}},fieldSupplies:{cacheSummary(id){trace.push({kind:'cache',id});return cache;}},worldEvolution:{structureDestroyed:()=>destroyed},random:{next(){throw Error('Drawing must not consume RNG');}}};
 const interiors={...A,
  drawFurniture(c,art,item,options){trace.push({kind:'furniture',id:item.id,item,options,alpha:c.globalAlpha,art});if(!available)return false;c.fillStyle='#617356';c.fillRect(item.x,item.y,item.w,item.h);return true;},
  drawRoof(c,art,item,rect,options){trace.push({kind:'roof',id:item.id,rect,options,art});if(!available)return false;c.fillStyle='#756956';c.fillRect(rect.x,rect.y,rect.w,rect.h);return true;},
  drawFloor(c,art,item,rect,options){trace.push({kind:'floor',id:item.id,rect,options,art});if(!available)return false;c.fillStyle='#979b83';c.fillRect(rect.x,rect.y,rect.w,rect.h);return true;}
 };
 const sandbox={DeadwallFrontierGeometry:G,DeadwallInteriorArt153:interiors,DeadwallNatureArt153:{drawSprite(c,art,family,id,x,y,w,h,options){trace.push({kind:'nature',family,id,x,y,w,h,options,alpha:c.globalAlpha});c.fillStyle='#858468';c.fillRect(x-w/2,y-h/2,w,h);return true;}},DEADWALL:game};
 vm.runInNewContext(source,sandbox,{filename:'frontier-art.js'});
 const canvas=createCanvas(600,500),c=canvas.getContext('2d');c.scale(10,10);
 return{game,trace,art:sandbox.DeadwallFrontierArt,canvas,c};
}
function place(type){const def=G.BY[type];return{...def,id:'fixture:'+type,type,w:def.w,h:def.h,x:20,y:20,a:Math.PI/2,generation:7,outdoor:[],parking:[]};}
function view(p,floor=0,entered=false){return{world:{seed:0xffffffff,plan:(place,z)=>G.plan(place,z)},inside:entered?p.id:null,z:floor,taken:{},scale:32};}
test('all 62 places retain roof depth and use the world owner seed without making hidden furniture visible',()=>{
 const f=fixture();for(const def of G.PRESETS){const p=place(def.id),v=view(p),before=JSON.stringify(p);const entries=f.art.lotEntries(f.game,p,v);
  if(def.id==='ruin'){assert.ok(entries.some(e=>e.kind==='furniture'));assert.ok(!entries.some(e=>e.kind==='roof'));continue;}
  assert.equal(entries.length,1,def.id);assert.equal(entries[0].kind,'roof');assert.equal(entries[0].depth,f.art.rectDepth(p,{x:0,y:0,w:p.w,h:p.h}));entries[0].draw(f.c);
  const last=f.trace.at(-1);assert.equal(last.kind,'roof');assert.equal(last.options.seed,v.world.seed);assert.strictEqual(last.art,f.game.art);assert.equal(JSON.stringify(p),before);
 }
});
test('entered floors preserve native stairs and exact furniture IDs, floor, seed and ordering under the lot transform',()=>{
 const f=fixture(),p=place('duplex'),v=view(p,1,true),plan=G.plan(p,1),before=JSON.stringify(plan);
 f.art.lotFloor(f.c,p,v,f.game);const floor=f.trace.find(e=>e.kind==='floor');assert.equal(floor.options.floor,1);assert.equal(floor.options.seed,v.world.seed);assert.deepEqual({...floor.rect},{x:.24,y:.24,w:p.w-.48,h:p.h-.48});
 const entries=f.art.lotEntries(f.game,p,v),furniture=entries.filter(e=>e.kind==='furniture');assert.deepEqual(Array.from(furniture,e=>e.id),plan.objects.map(o=>o.id));assert.equal(entries.filter(e=>e.kind==='wall').length,plan.walls.length);assert.ok(plan.stairs.length>0);
 for(const entry of furniture)entry.draw(f.c);for(const call of f.trace.filter(e=>e.kind==='furniture')){assert.equal(call.options.floor,1);assert.equal(call.options.seed,v.world.seed);assert.equal(call.options.stateAlpha,false);assert.strictEqual(call.art,f.game.art);}
 assert.equal(JSON.stringify(G.plan(p,1)),before);assert.ok(!entries.some(e=>e.kind==='roof'));
});
test('exhaustion fades once, then visible opening and actual finite cache state are painted over the sprite',()=>{
 const f=fixture({cache:{amount:5,capacity:12}}),o=Object.freeze({id:'crate:live',kind:'crate',x:5,y:5,w:2,h:1,amount:8}),before=JSON.stringify(o),events=[];
 const lineTo=f.c.lineTo.bind(f.c),strokeRect=f.c.strokeRect.bind(f.c);f.c.lineTo=(x,y)=>{events.push({kind:'lineTo',x,y});lineTo(x,y);};f.c.strokeRect=(x,y,w,h)=>{events.push({kind:'strokeRect',x,y,w,h});strokeRect(x,y,w,h);};
 f.art.object(f.c,o,8,Math.PI/2,{game:f.game,seed:42,floor:0});const draw=f.trace.find(e=>e.kind==='furniture');assert.ok(Math.abs(draw.alpha-.55)<.01);assert.equal(draw.options.taken,8);assert.equal(draw.options.stateAlpha,false);assert.equal(f.trace.at(-1).kind,'cache');
 assert.ok(events.some(e=>e.kind==='lineTo'&&e.x===o.x+o.w*.6&&e.y===o.y-.35),'opening marker remains');assert.ok(events.some(e=>e.kind==='strokeRect'&&e.x===o.x-.08&&e.w===o.w+.16),'actual cache border remains');assert.equal(f.c.globalAlpha,1);assert.equal(JSON.stringify(o),before);
});
test('logs and rubble use their real centres while destroyed lots and absent images retain their historical contracts',()=>{
 const f=fixture({destroyed:true});for(const kind of ['logs','rubble']){const[w,h]=G.SHAPES[kind],item=Object.freeze({id:kind,kind,x:2,y:4,w,h,amount:15});f.art.object(f.c,item,15,0,{game:f.game,seed:55,floor:-1});const call=f.trace.find(e=>e.kind==='nature'&&e.id===kind);assert.equal(call.x,item.x+w/2);assert.equal(call.y,item.y+h/2);assert.equal(call.w,w);assert.equal(call.h,h);assert.equal(call.options.seed,55);assert.equal(call.options.alpha,1);assert.ok(Math.abs(call.alpha-.55)<.01);}
 const p=place('duplex'),v=view(p),entries=f.art.lotEntries(f.game,p,v);assert.ok(entries.some(e=>e.kind==='furniture'));assert.ok(!entries.some(e=>e.kind==='roof'||e.kind==='wall'));f.art.lotFloor(f.c,p,v,f.game);
 const absent=fixture({available:false}),closed=place('garden'),closedView=view(closed);assert.doesNotThrow(()=>absent.art.lotEntries(absent.game,closed,closedView)[0].draw(absent.c));assert.doesNotThrow(()=>absent.art.object(absent.c,{id:'shelf',kind:'shelf',x:0,y:0,w:2.4,h:.7,amount:8},2));
});
