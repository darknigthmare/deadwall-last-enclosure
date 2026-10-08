'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const {bootGame}=require('./helpers/browser.cjs');
const source=fs.readFileSync(path.join(__dirname,'../src/frontier-art.js'),'utf8');

// Exercise the public regional painter and a real Canvas mask. The empty
// entered floor isolates lighting from geographic generation and actor art.
function fixture(urban,{blackout=false,daylight=0,driving=false,forbidSnapshot=false,text=source}={}){
 const width=160,height=120,canvas=createCanvas(width,height),radii=[],calls={scalar:0,snapshot:0};
 const document={createElement(){const mask=createCanvas(width,height),c=mask.getContext('2d'),gradient=c.createRadialGradient.bind(c);c.createRadialGradient=(...args)=>{radii.push(args[5]);return gradient(...args);};return mask;}};
 const g={ctx:canvas.getContext('2d'),width,height,dpr:1,elapsed:0,player:{dead:true},
  nightwatch:{isBlackout:()=>blackout},daylight:()=>daylight,
  expeditions:{car:()=>({fuel:25})},drawRain(){},drawCrosshair(){},
  urban:{lightingState(){calls.scalar++;return urban.lightingState();},snapshot(){calls.snapshot++;if(forbidSnapshot)throw Error('Regional paint must not normalize the campaign');return urban.snapshot();}}
 };
 const v={x:20,y:20,z:1,inside:null,a:.31,scale:5,bullets:[],car:driving?{driving:true}:null,world:{pois:[],blocked:()=>false}};
 const sandbox={document};vm.runInNewContext(text,sandbox,{filename:'frontier-art.js'});
 function paint(){for(let i=0;i<=12;i++){g.elapsed=i/10;sandbox.DeadwallFrontierArt.render(g,v);}return canvas.getContext('2d').getImageData(0,0,width,height).data;}
 return{paint,calls,radii};
}

function nativeUrban(){const {game:g}=bootGame();g.startNew('standard','17117');return g.urban;}

test('regional night154: real flashlight state and driving choose the same light without a campaign snapshot',()=>{
 const urban=nativeUrban();
 for(const mode of [
  {flashlight:false,blackout:false,range:4},
  {flashlight:true,blackout:true,range:9},
  {flashlight:false,blackout:true,range:null},
  {flashlight:true,blackout:true,driving:true,range:22}
 ]){
  assert.equal(urban.flashlight(mode.flashlight),true);
  assert.equal(urban.lightingState().flashlight,urban.snapshot().flashlight,'native readers share the same saved flag');
  const f=fixture(urban,{...mode,forbidSnapshot:true});assert.doesNotThrow(f.paint);
  assert.ok(f.calls.scalar>0);assert.equal(f.calls.snapshot,0);
  if(mode.range===null)assert.deepEqual(f.radii,[],'an unlit blackout stays black');
  else assert.ok(f.radii.length>0&&f.radii.every(r=>r===mode.range*5),'native cone and range remain unchanged');
 }
});

test('regional night154: real mask pixels match the historical snapshot reader across night, blackout and headlights',()=>{
 const urban=nativeUrban(),historical=source.replace('g.urban.lightingState().flashlight','g.urban.snapshot().flashlight');
 for(const mode of [
  {flashlight:false}, {flashlight:true},
  {flashlight:false,blackout:true}, {flashlight:true,blackout:true},
  {flashlight:false,blackout:true,driving:true}, {flashlight:true,daylight:1}
 ]){
  assert.equal(urban.flashlight(mode.flashlight),true);
  const old=fixture(urban,{...mode,text:historical}),current=fixture(urban,mode);
  assert.deepEqual(Buffer.from(current.paint()),Buffer.from(old.paint()),JSON.stringify(mode));
 }
});
