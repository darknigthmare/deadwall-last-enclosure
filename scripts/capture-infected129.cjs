'use strict';
// Canvas rendering of the actual regional runtime, with a stated contact fixture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),root=path.resolve(__dirname,'..'),out=path.join(root,'reports/1.29.0/captures');
const stress=process.argv.includes('--stress'),captureName=stress?'infectes-stress720-129':'infectes-region-129';
const {game:g}=require('../tests/helpers/expansions127.cjs').boot127(),Art=require('../src/art.js');
for(const f of ['region-roadkit','atlas-render','essential-art','world-evolution-art','frontier-art'])require('../src/'+f+'.js');
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=Art.create();
(async()=>{
 await g.art.ready;for(const[key,spec]of Object.entries(Art.ASSETS)){const img=await loadImage(path.join(root,spec.url));if(['magenta','neutral'].includes(spec.matte)){const c=createCanvas(img.width,img.height),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height);Art.decodeMatte(data.data,c.width,c.height,spec.matte);ctx.putImageData(data,0,0);g.art.images[key]=c;}else g.art.images[key]=img;}
 const canvas=createCanvas(1440,900),mini=createCanvas(220,220);g.ctx=canvas.getContext('2d');g.mctx=mini.getContext('2d');g.width=1440;g.height=900;g.dpr=1;const create=document.createElement.bind(document);document.createElement=t=>t==='canvas'?createCanvas(300,150):create(t);
 g.startNew('standard','17117');g.phaseTime=9999;g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());g.update(.04);
 const w=g.frontier.world();let point;for(const r of w.roads){const p={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2};if(Math.hypot(p.x-4096,p.y-4096)>600&&!w.blocked(p.x,p.y,.4)&&!w.nearPOI(p.x,p.y,120).length){point=p;break;}}assert.ok(point);
 const d=g.serialize();Object.assign(d.frontier,{x:point.x+19,y:point.y+3,z:0,inside:null});Object.assign(d.worldEvolution,{serial:stress?2:1,nextHorde:9999,groups:Array.from({length:stress?2:1},(_,i)=>({id:'W'+String(i).padStart(4,'0'),kind:'resting',count:stress?360:80,lost:0,wound:0,...point,a:0,seen:true}))});g.restoreSave(d);g.frontier.scale(26);g.input.mouseX=100;g.input.mouseY=450;g.settings.reducedMotion=true;g.weather=0;g.dayClock=.44;g.camera.shake=0;g.update(.04);
 const times=[];for(let i=0;i<60;i++){g.player.invulnerable=1;const t=performance.now();g.update(.04);times.push(performance.now()-t);}g.paused=true;g.render();
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,captureName+'.png'),canvas.toBuffer('image/png'));times.sort((a,b)=>a-b);const stats={capture:captureName+'.png',browser:false,fixture:(stress?'720 membres de deux hordes superposées volontairement pour éprouver le plafond':'80 membres d’une horde persistante')+' placés sur une route réelle de la graine 17117, 60 mises à jour du moteur puis pause.',contacts:g.worldEvolution.groupMembers().length,visible:g.worldEvolution.groupMembers().filter(e=>g.frontier.visibleEnemy(e)).length,simulationOnly:{samples:times.length,meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)]},limits:'DOM simulé ; mesure CPU locale, aucun FPS navigateur/GPU.'};fs.writeFileSync(path.join(out,captureName+'.json'),JSON.stringify(stats,null,2));console.log(JSON.stringify(stats));
})().catch(e=>{console.error(e);process.exitCode=1;});
