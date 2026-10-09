'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas'),C=require('../src/core.js');
const oracle=require('./fixtures/night-render154.cjs');
const current=fs.readFileSync(require.resolve('../src/nightwatch.js'),'utf8');
// Reconstruct only the previous two-read drawing path as a pixel oracle. The
// external audit additionally runs against the saved, unmodified source file.
const baseline=process.env.DEADWALL_NIGHTWATCH_BASELINE?fs.readFileSync(process.env.DEADWALL_NIGHTWATCH_BASELINE,'utf8'):current.replace(/  function draw\(ctx\)\{[\s\S]*?(?=\n  g.drawNight=draw;)/,oracle.localDraw.replace('const lights=sources();','').replaceAll('for(const l of lights)','for(const l of sources())'));
function fixture(source,mode){
 const module={exports:{}},context={module,require:()=>C,document:{createElement:()=>createCanvas(1,1)}};vm.runInNewContext(source,context);
 const reads={gear:0,kits:0,car:0},lamp={id:1,type:'streetlight',x:100,y:90,health:100,completed:true,powered:true,def:{light:95,powerUse:1}},wall={id:2,x:160,y:80,health:100,completed:true,def:{},gateMode:mode==='open'?'open':'closed'},buildings=new Map([[1,lamp]]);
 const g={width:320,height:200,elapsed:2,wave:4,phase:mode==='dusk'?'calm':'assault',state:'playing',resources:{fuel:10},camera:{x:160,y:100,zoom:mode==='zoom'?1.4:1},frameShake:{x:mode==='zoom'?3:0,y:0},player:{health:100,x:55,y:90,facing:0},urban:{lightingState:()=>({flashlight:mode==='torch',skipNightWave:0})},world:{navigationVersion:0,buildings,at:(x,y)=>mode==='wall'&&x>=158&&x<=170&&y>=20&&y<=180?wall:null},daylight:()=>.3,essentials:{lights:()=>{reads.kits++;return[{id:3,x:270,y:50,r:38}];}},nightGear:{lights:()=>{reads.gear++;return[{id:'gear-colored',x:240,y:135,r:65,color:'#ff9944'}];}},expeditions:{entity:()=>{reads.car++;return mode==='car'?{driving:true,fuel:4,x:80,y:140,angle:0}:null;}},drawNight(){},drawThreatArrows(){},refreshMetrics(){},updateDirector(){},startNew(){},restoreSave(){}};
 const canvas=createCanvas(g.width,g.height),ctx=canvas.getContext('2d'),n=module.exports.install(g);
 const paint=()=>{ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#6a8599';ctx.fillRect(0,0,g.width,g.height);n.draw(ctx);return Buffer.from(ctx.getImageData(0,0,g.width,g.height).data);};
 return{g,n,reads,paint,mask:()=>Buffer.from(n.mask().getContext('2d').getImageData(0,0,g.width,g.height).data)};
}
test('nightwatch154: one source list preserves the previous mask, colored light and visible sources',()=>{
 assert.ok(current.includes('const lights=sources();'));assert.notEqual(current,baseline);
 for(const mode of ['dusk','dark','torch','wall','car','zoom']){
  const before=fixture(baseline,mode),after=fixture(current,mode);
  assert.deepEqual(after.paint(),before.paint(),mode+' complete native Canvas pixels');assert.deepEqual(after.mask(),before.mask(),mode+' light openings');
  assert.deepEqual(after.reads,{gear:1,kits:1,car:1});assert.deepEqual(before.reads,{gear:2,kits:2,car:2});
  assert.equal(JSON.stringify(after.n.sources(false)),JSON.stringify(before.n.sources(false)),mode+' authoritative lights unchanged');
 }
});
test('nightwatch154: mobile lights are refreshed next draw and powered-light invalidation remains effective',()=>{
 const {g,n,paint,reads}=fixture(current,'torch'),first=paint();g.player.x=130;g.elapsed+=.1;const moved=paint();assert.notDeepEqual(moved,first);assert.deepEqual(reads,{gear:2,kits:2,car:2});
 g.world.buildings.get(1).powered=false;n.invalidate();assert.equal(n.sources(false).some(l=>l.id===1),false);assert.equal(n.sources(false).find(l=>l.id==='player').x,130);
 g.camera.x=900;assert.ok(n.sources(false).some(l=>l.id==='gear-colored'),'offscreen lights retain their authoritative source');
});
