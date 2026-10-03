'use strict';
// Staged scene, actual game painters and paid defense API. No browser HUD capture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {game:g}=require('../tests/helpers/expansions127.cjs').boot127();
const D=require('../src/defense-pack131.js'),A=require('../src/art.js'),{standAt}=require('../tests/helpers/physical-fixtures.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/1.31.0/captures');
D.install(g);globalThis.Image=class{set src(_){this.onerror?.();}};g.art=A.create();
const canvas=createCanvas(1440,900),mini=createCanvas(220,220);g.ctx=canvas.getContext('2d');g.mctx=mini.getContext('2d');g.width=1440;g.height=900;g.dpr=1;
const add=(type,x,y,progress=1)=>{const b=new(g.core().constructor)(g.nextId++,type,x,y,0,progress);g.world.add(b);g.refreshMetrics(true);g.selectBuilding(b);standAt(g,g.player,b);return b;};
const checked=v=>assert.equal(v.ok,true,v.reason);
(async()=>{
 await g.art.ready;
 for(const [key,spec]of Object.entries(A.ASSETS)){
  const img=await loadImage(path.join(root,spec.url));
  if(['magenta','neutral'].includes(spec.matte)){const c=createCanvas(img.width,img.height),ctx=c.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,c.width,c.height);A.decodeMatte(data.data,c.width,c.height,spec.matte);ctx.putImageData(data,0,0);g.art.images[key]=c;const rects=key==='buildings'?A.BUILDINGS:key==='props'?A.PROPS:key==='defenses'?A.DEFENSES:key==='districtProps'?A.DISTRICT_PROPS:{};for(const[id,r]of Object.entries(rects))g.art.rects[key+':'+id]=A.tightRect(data.data,c.width,r);}else g.art.images[key]=img;
 }
 const create=document.createElement.bind(document);document.createElement=tag=>tag==='canvas'?createCanvas(300,150):create(tag);
 g.startNew('standard','17117');g.world.nodes.forEach(n=>{if(Math.hypot(n.x-2350,n.y-2250)<500)n.depleted=true;});g.units=[];Object.keys(g.resources).forEach(k=>g.resources[k]=400);g.phase='calm';g.dayClock=.44;g.phaseTime=999;g.weather=0;
 const tower=add('watchtower',72,68);checked(g.defense131.setArc(tower.id,3));
 const gate=add('gate',74,71);checked(g.defense131.configureGate(gate.id));
 const wall=add('woodWall',72,71);wall.health=wall.maxHealth*.4;checked(g.defense131.startMaintenance(wall.id));const ep=g.fieldcraft.service(g.player,wall),engineer=g.createProtectedSurvivor('engineer',ep.x,ep.y);assert.ok(engineer);
 const chantier=add('warehouse',78,72,.22);checked(g.defense131.equipWorksite(chantier.id));const wp=g.fieldcraft.service(g.player,chantier),worker=g.createProtectedSurvivor('worker',wp.x,wp.y);assert.ok(worker);worker.state='build';worker.targetBuilding=chantier.id;worker.think=10;
 for(let i=0;i<30;i++)g.updateUnits(.04);
 g.selectBuilding(tower);standAt(g,g.player,tower);g.player.facing=-Math.PI/2;g.actorPresentation?.update?.(.04);g.camera.x=2400;g.camera.y=2250;g.camera.zoom=2;g.camera.shake=0;g.settings.reducedMotion=true;g.nightwatch.invalidate();g.render();
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'defense131-preparations.png'),canvas.toBuffer('image/png'));fs.writeFileSync(path.join(out,'defense131-capture.json'),JSON.stringify({kind:'actual-engine-canvas-staged-scene',browser:false,seed:17117,description:'Arc de tir au sol, consigne sur porte, caisse de réfection consommée par ingénieur et chantier accéléré par ouvrier. Le décor est une fixture de validation, pas une implantation générée.',snapshot:g.defense131.snapshot(),supportIds:{tower:tower.id,gate:gate.id,wall:wall.id,worksite:chantier.id}},null,2));console.log('defense131-preparations.png');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
