'use strict';
// Actual runtime painters. Prepared states under a simulated DOM, never browser screenshots.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),root=path.resolve(__dirname,'..'),out=path.join(root,'reports/1.31.0/captures');
const {game:g}=require('../tests/helpers/expansions131.cjs').boot131(),Art=require('../src/art.js'),G=require('../src/frontier-geometry.js');
for(const name of['region-roadkit','atlas-render','essential-art','world-evolution-art','frontier-art'])require('../src/'+name+'.js');
const A=globalThis.DeadwallFrontierArt,canvas=createCanvas(1000,760),ctx=canvas.getContext('2d');g.ctx=ctx;g.width=1000;g.height=760;g.dpr=1;
const make=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):make(tag);
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();
(async()=>{
 await g.art.ready;for(const[key,spec]of Object.entries(Art.ASSETS)){const image=await loadImage(path.join(root,spec.url));if(['magenta','neutral'].includes(spec.matte)){const bitmap=createCanvas(image.width,image.height),c=bitmap.getContext('2d');c.drawImage(image,0,0);const data=c.getImageData(0,0,image.width,image.height);Art.decodeMatte(data.data,image.width,image.height,spec.matte);c.putImageData(data,0,0);g.art.images[key]=bitmap;const rects=key==='buildings'?Art.BUILDINGS:key==='props'?Art.PROPS:key==='defenses'?Art.DEFENSES:key==='districtProps'?Art.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=Art.tightRect(data.data,image.width,r);}else g.art.images[key]=image;}
 g.phaseTime=9999;g.dayClock=.44;g.weather=0;g.settings.reducedMotion=true;
 const state=g.chronicles131.snapshot();state.collected=['doors-0'];g.chronicles131.restore(state);
 const marker=g.chronicles131.location('doors-1'),w=g.frontier.world();assert.ok(marker);
 g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());
 let point;for(const d of [2.0,-2.0,3.0,-3.0]){const p={x:marker.x+d,y:marker.y};if(!w.blocked(p.x,p.y,.32,0,null)&&w.line(p,marker,0,null,null,.05)){point=p;break;}}assert.ok(point);
 const save=g.serialize();Object.assign(save.frontier,point,{z:0,inside:null,a:Math.atan2(marker.y-point.y,marker.x-point.x)});if(!save.frontier.seen.includes(marker.poi))save.frontier.seen.push(marker.poi);g.restoreSave(save);g.dayClock=.44;g.weather=0;g.paused=true;g.frontier.scale(44);
 const v=g.frontier.overview(),view={l:v.x-12,r:v.x+12,t:v.y-9,b:v.y+9},queue=A.depthEntries(g,v,view);assert.ok(queue.some(e=>e.id==='record:doors-1'),'chronicle marker must join actual regional queue');
 A.render(g,v);ctx.fillStyle='rgba(12,22,19,.95)';ctx.fillRect(0,0,1000,44);ctx.fillStyle='#e9d5a3';ctx.font='18px sans-serif';ctx.textAlign='left';ctx.fillText('Chroniques · pochette physique devant un accès régional libre',18,28);
 fs.mkdirSync(out,{recursive:true});const file='chroniques-terrain-131.png';fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));
 fs.writeFileSync(path.join(out,'chronicles131.json'),JSON.stringify({renderer:'DeadwallFrontierArt.render — native Canvas, simulated DOM',browser:false,prepared:true,seed:g.world.seed,generation:v.generation,document:'doors-1',marker,file,queue:queue.map(e=>({kind:e.kind,id:e.id,depth:e.depth}))},null,2));console.log(JSON.stringify({out,file,marker}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
