'use strict';
// Capture of the real Canvas painters with a simulated DOM; not browser UI QA.
// NODE_PATH must expose @napi-rs/canvas. No screenshot claims about HTML/CSS.
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const project=path.resolve(__dirname,'..'),out=path.join(project,'reports/1.26.0/captures');
fs.mkdirSync(out,{recursive:true});
const {game:g}=require('../tests/helpers/browser.cjs').bootGame();
const proto=Object.getPrototypeOf(document.createElement('div'));
if(!proto.append)proto.append=function(...nodes){nodes.forEach(n=>this.appendChild(n));};
if(!proto.insertBefore)proto.insertBefore=function(n,s){const i=this.children.indexOf(s);this.children.splice(i<0?this.children.length:i,0,n);n.parentNode=this;};
require('../src/night-gear.js').install(g);
require('../src/exploration-125.js').install(g,document);
require('../src/actor-presentation.js').install(g);
const A=require('../src/art.js'),C=require('../src/core.js');
globalThis.Image=class{set src(_){this.onerror?.();}};g.art=A.create();
const canvas=createCanvas(1440,900),mini=createCanvas(220,220);
g.ctx=canvas.getContext('2d');g.mctx=mini.getContext('2d');g.width=1440;g.height=900;g.dpr=1;
function save(name,c=canvas){fs.writeFileSync(path.join(out,name+'.png'),c.toBuffer('image/png'));console.log(name);}
function device(id,kind,domain,x,y){return{id,kind,domain,x,y,z:0,inside:null,angle:0,location:'placed',left:C.NightGearRules.types[kind].duration,on:true,used:true};}
function settleNight(){g.phase='assault';g.wave=4;g.dayClock=.99;g.weather=0;g.settings.reducedMotion=true;g.camera.shake=0;g.nightwatch.invalidate();for(let i=0;i<110;i++){g.elapsed+=.1;g.render();}}
(async()=>{
 await g.art.ready;
 for(const [key,spec] of Object.entries(A.ASSETS)){
  const img=await loadImage(path.join(project,spec.url));if(img.width!==spec.width||img.height!==spec.height)throw Error('Atlas dimensions: '+key);
  if(['magenta','neutral'].includes(spec.matte)){
   const c=createCanvas(img.width,img.height),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height);A.decodeMatte(data.data,c.width,c.height,spec.matte);ctx.putImageData(data,0,0);g.art.images[key]=c;
   const rects=key==='buildings'?A.BUILDINGS:key==='props'?A.PROPS:key==='defenses'?A.DEFENSES:key==='districtProps'?A.DISTRICT_PROPS:{};
   for(const [id,r] of Object.entries(rects))g.art.rects[key+':'+id]=A.tightRect(data.data,c.width,r);
  }else g.art.images[key]=img;
 }
 g.startNew('standard','17117');
 const domCreate=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):domCreate(tag);
 const s=g.exploration125.plan.stations[0],raw=g.serialize();
 const technical=g.essentials.targets().find(t=>t.family==='light');raw.frontier.seen=[...new Set([...raw.frontier.seen,technical.poi])];raw.essentials.jobs[technical.id]={stage:'delivered'};
 raw.player.x=s.x;raw.player.y=s.y+s.h*.8;raw.player.facing=0;
 raw.nightGear={version:1,serial:6,devices:[device(1,'lantern','local',s.x,s.y),device(2,'campfire','local',s.x+260,s.y+180),device(3,'chemlight','local',s.x-205,s.y+110),device(4,'torch','local',s.x,s.y+s.h*.8),device(5,'worklight','local',s.x-250,s.y-160)]};
 raw.fieldcraft.opacity=1;g.restoreSave(raw);g.camera.x=s.x;g.camera.y=s.y+40;g.camera.zoom=1.06;settleNight();save('01-station-nuit');
 const day=g.serialize();day.fieldcraft.opacity=0;g.restoreSave(day);g.camera.x=s.x;g.camera.y=s.y+40;g.camera.zoom=1.06;g.phase='calm';g.dayClock=.44;g.nightwatch.invalidate();for(let i=0;i<100;i++){g.elapsed+=.1;g.render();}save('02-station-jour');
 for(const file of ['region-roadkit','atlas-render','essential-art','world-evolution-art','frontier-art'])require('../src/'+file+'.js');
 g.player.x=4058;g.player.y=2048;if(!g.frontier.enter())throw Error('Region entry failed');
 const w=g.frontier.world(),G=require('../src/frontier-geometry.js'),p=w.pois.find(p=>p.type==='firestation')||w.pois[0],q=G.global(p,p.w/2,-8),r=g.serialize();
 r.frontier.x=q.x;r.frontier.y=q.y;r.frontier.z=0;r.frontier.inside=null;r.frontier.seen=[...new Set([...r.frontier.seen,p.id])];
 const entrance=G.global(p,p.w/2,-1.5),yard=G.global(p,p.w+12,-9),balise=G.global(p,-6,-4);
 r.nightGear={version:1,serial:4,devices:[device(1,'lantern','region',entrance.x,entrance.y),device(2,'campfire','region',yard.x,yard.y),device(3,'chemlight','region',balise.x,balise.y)]};
 g.restoreSave(r);g.frontier.scale(23);settleNight();save('03-region-nuit');
 // Visual contact sheet drawn through Art.drawActor, exercising both atlases.
 const sheet=createCanvas(1280,720),c=sheet.getContext('2d');c.fillStyle='#17241f';c.fillRect(0,0,sheet.width,sheet.height);
 c.fillStyle='#e5dbb7';c.font='bold 24px sans-serif';c.fillText('DEADWALL · ANIMATIONS DU COMMANDANT',32,40);c.font='15px sans-serif';c.fillText('8 états · 4 poses par cycle · pistolet et arme longue · rendu du moteur',32,67);
 const names=['Repos','Marche','Course','Accroupi','Allongé','Tir','Recharge','Travail / mêlée'];
 for(let row=0;row<8;row++){
  c.fillStyle='#bec9b4';c.font='14px sans-serif';c.fillText(names[row],25,113+row*75);
  for(let f=0;f<8;f++){
   const idx=f%4,t=idx/8,v={x:225+f*135,y:110+row*75,facing:0,id:row*10+f,weapon:f<4?'pistol':'rifle',visualMoving:row!==0&&row!==5&&row!==6,visualPosture:row===3?'crouch':row===4?'prone':'stand',sprinting:row===2,visualAction:row===7?'work':'',reload:row===6?4-idx:0,reloadTotal:4,shootCooldown:row===5?.2:0};
   const time=row===2?idx/12:row===3?idx/6:row===4?idx/5:row===5?idx/15:row===0?idx/2:t;
   c.save();c.translate(v.x,v.y);c.scale(1.28,1.28);v.x=v.y=0;g.art.drawActor(c,v,'player',time,false,false);c.restore();
  }
 }
 save('04-animations-moteur',sheet);
 console.log('Canvas only; no browser DOM screenshots.');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
