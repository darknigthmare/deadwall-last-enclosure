'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas'),C=require('../src/core.js'),oracle=require('./fixtures/night-render154.cjs');
const local=fs.readFileSync(require.resolve('../src/nightwatch.js'),'utf8'),regional=fs.readFileSync(require.resolve('../src/frontier-art.js'),'utf8');
const oldLocal=local.replace(/  function polygon\(l\)\{[\s\S]*?(?=\n  const normal=)/,oracle.localPolygon).replace(/  function draw\(ctx\)\{[\s\S]*?(?=\n  g.drawNight=draw;)/,oracle.localDraw);
const oldRegional=regional.replace(/function kitLightHole\([\s\S]*?(?=\nfunction tintLight\()/,oracle.regionalHole).replace(/function night\([\s\S]*?(?=\nfunction scenery\()/,oracle.regionalNight);

function localFixture(source,{torch=true,scene=false,beam=false}={}){
 const module={exports:{}},calls={clears:0,gradients:0,gear:0,kits:0,car:0},document={createElement(){const canvas=createCanvas(1,1),ctx=canvas.getContext('2d'),clear=ctx.clearRect.bind(ctx),gradient=ctx.createRadialGradient.bind(ctx);ctx.clearRect=(...args)=>{calls.clears++;return clear(...args);};ctx.createRadialGradient=(...args)=>{calls.gradients++;return gradient(...args);};return canvas;}};
 vm.runInNewContext(source,{module,require:()=>C,document});
 const lamp={id:1,type:'streetlight',x:80,y:90,health:100,completed:true,powered:true,rotation:0,def:{light:125,powerUse:1,...(beam?{beamHalfAngle:.5}:{})}},gate={id:2,health:100,completed:true,def:{gate:true},gateMode:'closed'},gear={id:'gear-lamp',x:230,y:135,r:65,color:'#ff9944'},kit={id:3,x:260,y:45,r:35},controls={torch,opacity:1,wall:true,gear:true,car:false};
 const buildings=new Map([[1,lamp],[2,gate]]),g={width:320,height:200,elapsed:0,wave:4,phase:'assault',state:'playing',gameOver:false,resources:{fuel:10},camera:{x:160,y:100,zoom:1},frameShake:{x:0,y:0},player:{health:100,x:55,y:90,facing:0},weather:0,
  urban:{lightingState:()=>({flashlight:controls.torch,skipNightWave:0})},world:{navigationVersion:0,buildings,at:(x,y)=>controls.wall&&x>=140&&x<=151&&y>=12&&y<=180?gate:null},daylight:()=>0,fieldcraft:{opacity:()=>controls.opacity},
  essentials:{lights:()=>{calls.kits++;return[kit];}},nightGear:{lights:()=>{calls.gear++;return controls.gear?[gear]:[];}},expeditions:{entity:()=>{calls.car++;return controls.car?{driving:true,fuel:g.resources.fuel,x:60,y:155,angle:g.player.facing}:null;}},
  drawNight(){},drawThreatArrows(){},refreshMetrics(){},updateDirector(){},startNew(){},restoreSave(){}
 };
 if(scene)g.exploration125={generation:4,plan:{solids:[{kind:'station-wall',x:145,y:0,w:10,h:200}]}};
 const canvas=createCanvas(g.width,g.height),ctx=canvas.getContext('2d'),n=module.exports.install(g);
 function paint(){if(canvas.width!==g.width||canvas.height!==g.height){canvas.width=g.width;canvas.height=g.height;}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#6a8599';ctx.fillRect(0,0,g.width,g.height);n.draw(ctx);return Buffer.from(ctx.getImageData(0,0,g.width,g.height).data);}
 return{g,n,paint,calls,controls,lamp,gate,gear,kit,mask:()=>Buffer.from(n.mask().getContext('2d').getImageData(0,0,g.width,g.height).data)};
}
function identical(a,b,label){assert.deepEqual(a.paint(),b.paint(),label+' full native Canvas pixels');assert.deepEqual(a.mask(),b.mask(),label+' mask pixels');assert.equal(JSON.stringify(a.n.sources(false)),JSON.stringify(b.n.sources(false)),label+' authoritative sources');for(const p of [{x:110,y:90},{x:175,y:90},{x:235,y:135}])assert.equal(a.n.lit(p),b.n.lit(p),label+' occluded visibility '+JSON.stringify(p));}

test('night155: exact stationary mask is reused while all sources remain live reads',()=>{
 const a=localFixture(local),b=localFixture(oldLocal);assert.notEqual(local,oldLocal);
 for(let i=0;i<50;i++){a.g.elapsed=b.g.elapsed=i/60;identical(a,b,'stationary '+i);}
 assert.equal(a.calls.clears,1);assert.equal(b.calls.clears,50);assert.equal(a.calls.gradients*50,b.calls.gradients);
 assert.equal(a.calls.gear,b.calls.gear);assert.equal(a.calls.kits,b.calls.kits);assert.equal(a.calls.car,b.calls.car);
 const clear=a.calls.clears,first=a.paint();a.gear.color=b.gear.color='#66aaff';identical(a,b,'live tint color');assert.notDeepEqual(a.paint(),first);assert.equal(a.calls.clears,clear,'color remains a live screen tint over the unchanged mask');
});
test('night155: movement, gates, power, fuel, opacity and projection preserve 1.54 pixels and visibility',()=>{
 const a=localFixture(local),b=localFixture(oldLocal);identical(a,b,'initial');
 const actions=[
  f=>{f.g.player.x+=1.1;},f=>{f.g.player.x+=23;f.g.player.facing+=.35;},f=>{f.g.camera.x+=9;},f=>{f.g.camera.zoom=1.35;f.g.frameShake={x:3,y:-2};},
  f=>{f.gate.gateMode='open';f.g.world.navigationVersion++;},f=>{f.gate.gateMode='closed';f.g.world.navigationVersion++;},f=>{f.gate.dead=true;f.g.world.navigationVersion++;},
  f=>{f.lamp.powered=false;f.n.invalidate();},f=>{f.lamp.powered=true;f.n.invalidate();},f=>{f.controls.car=true;},f=>{f.g.resources.fuel=0;},f=>{f.g.resources.fuel=10;},
  f=>{f.gear.x-=18;f.gear.r=80;},f=>{f.controls.gear=false;f.g.weather=.9;},f=>{f.controls.gear=true;f.g.weather=0;},f=>{f.controls.opacity=.31;},f=>{f.controls.torch=false;f.g.phase='calm';},
  f=>{f.g.width=380;f.g.height=240;},f=>{f.g.startNew();},f=>{f.g.restoreSave();}
 ];
 for(let i=0;i<actions.length;i++){for(const f of[a,b]){actions[i](f);f.g.elapsed+=.1;}identical(a,b,'transition '+i);}
});
test('night155: cache is bounded and polygon eviction does not retain a stale mobile mask',()=>{
 const a=localFixture(local),b=localFixture(oldLocal);
 for(let i=0;i<75;i++){for(const f of[a,b]){f.g.elapsed+=.1;f.g.player.x=40+i*3.05;f.gear.x=210+i*.4;f.g.player.facing=i*.051;}identical(a,b,'moving '+i);}
 for(let i=0;i<4;i++){for(const f of[a,b])f.g.elapsed+=.1;identical(a,b,'settled '+i);}
 assert.equal(a.n.mask().width,a.g.width);assert.equal(a.n.mask().height,a.g.height);
});
test('night155: replacement G4 geometry and changed beam angle invalidate the cached opening',()=>{
 const f=localFixture(local,{torch:false,scene:true,beam:true});f.controls.wall=false;const before=f.paint();
 f.g.exploration125.plan={solids:[]};f.g.elapsed+=.1;const after=f.paint();assert.notDeepEqual(after,before);assert.equal(f.n.lit({x:170,y:90}),true);
 const fresh=localFixture(local,{torch:false,scene:true,beam:true});fresh.controls.wall=false;fresh.g.exploration125.plan={solids:[]};assert.deepEqual(after,fresh.paint(),'new scene matches a fresh native raster');
 f.lamp.def.beamHalfAngle=.18;f.g.elapsed+=.1;const narrow=f.paint();assert.notDeepEqual(narrow,after);fresh.lamp.def.beamHalfAngle=.18;fresh.n.invalidate();fresh.g.restoreSave();assert.deepEqual(narrow,fresh.paint(),'same projector with a narrower cone recomputes its polygon');
});

function regionalFixture(source){
 const width=160,height=120,canvas=createCanvas(width,height),calls={blocked:0,offscreen:0,gear:0,kits:0},controls={blackout:false,daylight:0,torch:true,wall:true,fuel:25},lights=[
  {id:'gear-visible',x:24,y:21,r:9,z:1,inside:null,color:'#fcb679'},
  {id:'gear-offscreen',x:120,y:20,r:9,z:1,inside:null,color:'#88bbff'},
  {id:'gear-floor2',x:22,y:22,r:9,z:2,inside:'floor2',color:'#aaee99'}
 ];
 const g={ctx:canvas.getContext('2d'),width,height,dpr:1,elapsed:0,player:{dead:true},weather:0,nightwatch:{isBlackout:()=>controls.blackout},daylight:()=>controls.daylight,expeditions:{car:()=>({fuel:controls.fuel})},urban:{lightingState:()=>({flashlight:controls.torch})},essentials:{lights:()=>{calls.kits++;return[];}},nightGear:{lights:()=>{calls.gear++;return lights;}},drawRain(){},drawCrosshair(){}};
 const v={x:20,y:20,z:1,inside:null,a:.31,scale:5,bullets:[],car:null,world:{pois:[],blocked(x,y,r,z,inside){calls.blocked++;if(x>100)calls.offscreen++;return controls.wall&&x>=22&&x<=23&&y>=10&&y<=35;}}};
 const sandbox={document:{createElement:()=>createCanvas(width,height)}};vm.runInNewContext(source,sandbox);
 function paint(){sandbox.DeadwallFrontierArt.render(g,v);return Buffer.from(g.ctx.getImageData(0,0,width,height).data);}
 return{g,v,lights,calls,controls,paint};
}
test('regional night155: offscreen ray culling preserves native mask and colored pixels without dropping sources',()=>{
 const a=regionalFixture(regional),b=regionalFixture(oldRegional);assert.notEqual(regional,oldRegional);
 for(let i=0;i<12;i++){a.g.elapsed=b.g.elapsed=i*.1;assert.deepEqual(a.paint(),b.paint(),'native regional frame '+i);}
 assert.equal(a.calls.offscreen,0);assert.ok(b.calls.offscreen>1000);assert.ok(a.calls.blocked<b.calls.blocked);assert.equal(a.calls.gear,b.calls.gear);assert.equal(a.calls.kits,b.calls.kits);assert.equal(a.lights.length,3);
 const actions=[f=>{f.v.x=112;},f=>{f.controls.blackout=true;f.controls.torch=false;},f=>{f.controls.torch=true;f.v.a+=.6;},f=>{f.v.car={driving:true};},f=>{f.controls.fuel=0;},f=>{f.controls.wall=false;},f=>{f.v.z=2;f.v.inside='floor2';f.v.x=20;},f=>{f.lights[2].x=25;f.lights[2].r=7;f.lights[2].color='#eeaa66';f.g.weather=.9;},f=>{f.controls.daylight=1;f.controls.blackout=false;},f=>{f.lights.splice(0,3);}];
 for(let i=0;i<actions.length;i++){for(const f of[a,b]){actions[i](f);f.g.elapsed+=.1;}assert.deepEqual(a.paint(),b.paint(),'native regional transition '+i);}
});
