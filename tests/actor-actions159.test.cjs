'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas'),A=require('../src/actor-actions159.js'),C=require('../src/core.js'),W=require('../src/world-variants158.js');
const repo=path.resolve(__dirname,'..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let images;
test.before(async()=>{images={};for(const[key,spec]of Object.entries(A.ASSETS))images[key]=await loadImage(path.join(repo,spec.url));});
const art=()=>({images,blit(ctx,key,rect,...destination){ctx.drawImage(this.images[key],...rect,...destination);return true;}});
const raster=ctx=>Buffer.from(ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height).data);
const actor=(kind,id=73)=>Object.freeze({id,kind,x:100,y:100,facing:.35,health:90,visualMoving:false});
const view=(owner,action,progress)=>Object.freeze({ownerId:owner.id,action,active:true,progress});

test('159 action sources: every original PNG retains alpha and all 256 poses are complete and isolated without borrowing a neighbour',()=>{
 assert.equal(Object.keys(A.ASSETS).length,17);assert.equal(Object.values(A.CUTS).reduce((n,cuts)=>n+cuts.length,0),256);
 for(const[key,spec]of Object.entries(A.ASSETS)){
  const bytes=fs.readFileSync(path.join(repo,spec.url)),im=images[key];assert.equal(bytes[25],6);assert.deepEqual([im.width,im.height],[spec.width,spec.height]);
  const ctx=createCanvas(im.width,im.height).getContext('2d');ctx.drawImage(im,0,0);const pixels=raster(ctx),covered=new Uint8Array(im.width*im.height);let clear=0;
  let ownerIndex=0;
  for(const[x,y,w,h]of A.CUTS[key]){
   ownerIndex++;
   assert.ok([x,y,w,h].every(Number.isInteger)&&x>=0&&y>=0&&w>0&&h>0&&x+w<=im.width&&y+h<=im.height);let ink=0;
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(pixels[(yy*im.width+xx)*4+3]>8){const at=yy*im.width+xx;assert.equal(covered[at],0,key+' duplicate neighbour pixels');covered[at]=ownerIndex;ink++;assert.ok(xx>0&&xx<im.width-1&&yy>0&&yy<im.height-1,key+' figure is clipped by its source PNG edge');}
   assert.ok(ink>200,key+' complete action figure');
  }
  for(const[x,y,w,h]of A.UNUSED_SOURCE_CUTS[key]||[]){ownerIndex++;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const at=yy*im.width+xx;if(pixels[at*4+3]>8){assert.equal(covered[at],0,key+' rejected source overlaps a usable pose');covered[at]=ownerIndex;}}}
  for(let at=0;at<covered.length;at++){if(pixels[at*4+3]<=8)clear++;else assert.ok(covered[at]>0,key+' unexplained opaque fragment');}
  // A crop may end at its own complete fingertip when neighbouring transparent
  // space is narrow. No connected source body can be split between two frames.
  const visited=new Uint8Array(covered.length),queue=new Int32Array(covered.length);
  for(let at=0;at<covered.length;at++)if(!visited[at]&&pixels[at*4+3]>8){let head=0,tail=1;queue[0]=at;visited[at]=1;const owner=covered[at];
   while(head<tail){const here=queue[head++],x=here%im.width,y=Math.floor(here/im.width);assert.equal(covered[here],owner,key+' amputated connected body assigned to another pose');
    for(const next of[x>0?here-1:-1,x+1<im.width?here+1:-1,y>0?here-im.width:-1,y+1<im.height?here+im.width:-1])if(next>=0&&!visited[next]&&pixels[next*4+3]>8){visited[next]=1;queue[tail++]=next;}
   }
  }
  assert.ok(clear>covered.length*.3,key+' transparent gutters are real');
 }
});

test('159 native actions: the four living roles and ten infected families have distinct complete action frames',()=>{
 assert.equal(Object.keys(A.ACTIONS).length,14);assert.equal(Object.values(A.ACTIONS).reduce((n,actions)=>n+Object.keys(actions).length,0),16);
 for(const[kind,actions]of Object.entries(A.ACTIONS)){
  assert.ok(C.SURVIVORS[kind]||C.ENEMIES[kind]);const owner=actor(kind);
  for(const action of Object.keys(actions))for(const appearance of['base','alt']){
   const id=['worker','soldier','walker'].includes(kind)?(appearance==='alt'?1:0):Array.from({length:128},(_,n)=>n).find(n=>A.appearanceFor(kind,n,{seed:17117})===appearance),subject=actor(kind,id),painter=art();for(const spec of Object.values(W.ACTORS))painter.images[spec.atlas]??={};
   const renders=new Set();for(let frame=0;frame<8;frame++){const ctx=createCanvas(120,120).getContext('2d');ctx.translate(60,60);
    const presentation=view(subject,action,(frame+.5)/8);assert.equal(A.pose(subject,{presentation,seed:17117}).frame,frame);assert.equal(A.draw(ctx,painter,subject,{size:55,presentation,seed:17117}),true);
    const pixels=raster(ctx);assert.ok(pixels.some((value,index)=>index%4===3&&value>8),kind+' '+action+' visible at native size');renders.add(sha(pixels));}
   assert.equal(renders.size,8,kind+' '+action+' '+appearance+' does not repeat one static drawing');
  }
 }
});

test('159 owner guards: an assignment, cooldown or restored timer cannot invent an action',()=>{
 for(const kind of Object.keys(A.ACTIONS)){
  const owner=actor(kind);assert.equal(A.pose(owner,{time:1}),null);assert.equal(A.pose({...owner,state:'build',supportActive:false,fireCooldown:.24,attackCooldown:.7},{time:1}),null);
  const action=Object.keys(A.ACTIONS[kind])[0],presentation=view(owner,action,.5);
  for(const patch of[{active:false},{ownerId:74},{action:'__proto__'},{progress:-.1},{progress:1.1},{progress:NaN},{progress:Infinity}])assert.equal(A.pose(owner,{presentation:{...presentation,...patch}}),null);
  for(const patch of[{dead:true},{health:0},{regionAbsent:true},{visualMoving:true}])assert.equal(A.pose({...owner,...patch},{presentation}),null);
 }
 for(const kind of['player','constructor','__proto__','missing'])assert.equal(A.pose(actor(kind),{time:1}),null);
});

test('159 planted actions: changing source rows does not make standing actors jump away from their physical ground contact',()=>{
 for(const[kind,actions]of Object.entries(A.ACTIONS))if(kind!=='crawler')for(const action of Object.keys(actions)){
  const owner={...actor(kind),facing:0},bottoms=[];
  for(let frame=0;frame<8;frame++){
   const ctx=createCanvas(180,180).getContext('2d');ctx.translate(90,90);assert.equal(A.draw(ctx,art(),owner,{presentation:view(owner,action,(frame+.5)/8),size:55}),true);
   const pixels=raster(ctx);let bottom=-1;for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(pixels[(y*180+x)*4+3]>24)bottom=Math.max(bottom,y);assert.ok(bottom>90);bottoms.push(bottom);
  }
  assert.ok(Math.max(...bottoms)-Math.min(...bottoms)<=2,kind+' '+action+' source-row spacing is not body motion: '+bottoms.join(','));
 }
});

test('159 service: only useful active medicine/repair consumption selects its continuous picture, and pause keeps the same frame',()=>{
 for(const kind of['medic','engineer']){
  const owner={...actor(kind),state:'repair',supportActive:true},first=A.pose(owner,{time:1.31});assert.ok(first);assert.equal(first.action,kind==='medic'?'heal':'repair');
  assert.deepEqual(A.pose(owner,{time:1.31}),first);assert.notEqual(A.pose(owner,{time:1.49}).frame,first.frame);
  assert.equal(A.pose({...owner,supportActive:false},{time:1.49}),null);assert.equal(A.pose({...owner,state:'flee'},{time:1.49}),null);assert.equal(A.pose(owner,{time:NaN}),null);
  assert.equal(A.pose(owner,{time:1.49,reducedMotion:true}).frame,0);
 }
});

test('159 appearances: action costumes and camera follow exactly the historical kind, seed, ID and available walking images',()=>{
 for(const kind of Object.keys(A.ACTIONS))for(const seed of[17117,84329])for(let id=0;id<32;id++){
  const alternative=W.actorFrame(kind,id,0,{seed}),expected=['worker','soldier','walker'].includes(kind)?(Math.abs(id)%3===1?'alt':'base'):alternative?'alt':'base';
  assert.equal(A.appearanceFor(kind,id,{seed}),expected);assert.equal(A.appearanceFor(kind,id,{seed,images:{}}),['worker','soldier','walker'].includes(kind)?expected:'base','A missing alternative walking image does not change clothes just for the action');
  if(alternative)assert.equal(A.appearanceFor(kind,id,{seed,images:{[alternative.atlas]:{}}}),expected);
 }
 for(const kind of['worker','soldier','walker'])assert.equal(A.appearanceFor(kind,'P0042:e2',{seed:17117}),'base','Legacy text identity keeps its historical actorVariant result');
 for(const alias of['workerAlt','soldierAlt','walkerAlt']){assert.equal(A.appearanceFor(alias,0,{seed:17117}),'alt');assert.equal(A.uprightAppearance(alias,0,{seed:17117}),true);}
 assert.equal(A.uprightAppearance('worker',0),false);assert.equal(A.uprightAppearance('worker',1),true);assert.equal(A.uprightAppearance('medic',0),true);assert.equal(A.uprightAppearance('crawler',0),false);assert.equal(A.uprightAppearance('player',0),null);
});

test('159 combat: the same observed event drives local and text-ID regional actors without RNG, clocks or simulation mutations',()=>{
 const random=Math.random,clock=Date.now;Math.random=()=>assert.fail('Rendering used random state');Date.now=()=>assert.fail('Rendering used wall time');
 try{
  for(const kind of['soldier','walker','walkerAlt','crawler','shielded']){
   const action=kind==='soldier'?'shoot':'attack',owner=actor(kind,'P0042:e2'),before=JSON.stringify(owner),event=view(owner,action,.46);
   const normal=A.pose(owner,{presentation:event,time:10}),paused=A.pose(owner,{presentation:event,time:999});assert.deepEqual(paused,normal);assert.equal(normal.frame,3);
   const ctx=createCanvas(160,160).getContext('2d');ctx.translate(80,80);assert.equal(A.draw(ctx,art(),owner,{presentation:event}),true);assert.equal(JSON.stringify(owner),before);
  }
 }finally{Math.random=random;Date.now=clock;}
});

test('159 painter: missing assets preserve the historical path, and successful or throwing painters restore caller Canvas state',()=>{
 const ctx=createCanvas(160,160).getContext('2d');ctx.translate(80,80);ctx.scale(1.2,.8);ctx.globalAlpha=.61;ctx.filter='contrast(1.1)';const transform=ctx.getTransform().toJSON(),alpha=ctx.globalAlpha,filter=ctx.filter,owner=actor('medic'),presentation=view(owner,'heal',.7);
 assert.equal(A.draw(ctx,{images:{}},owner,{presentation}),false);assert.equal(A.draw(ctx,art(),owner,{presentation}),true);
 assert.deepEqual(ctx.getTransform().toJSON(),transform);assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.filter,filter);
 assert.throws(()=>A.draw(ctx,{images,blit(){throw new Error('Fixture paint error');}},owner,{presentation}),/Fixture paint error/);
 assert.deepEqual(ctx.getTransform().toJSON(),transform);assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.filter,filter);
});

test('159 native integration: actual master painter selects the new atlas and preserves each walking appearance camera',async()=>{
 const Master=require('../src/art.js'),oldImage=global.Image,oldGame=global.DEADWALL;
 global.Image=class{set src(_){this.onerror();}};let painter;
 try{painter=Master.create();await painter.ready;}finally{global.Image=oldImage;}
 painter.images={...Object.fromEntries(Object.keys(Master.ASSETS).map(key=>[key,{}])),...images};
 let event=null,painted=[];global.DEADWALL={world:{seed:17117},actorActionPresentation159:owner=>event?{...event,ownerId:owner.id}:null};
 painter.blit=(ctx,key,rect,...destination)=>{painted.push({key,rect,transform:ctx.getTransform().toJSON()});if(A.ASSETS[key])ctx.drawImage(painter.images[key],...rect,...destination);return true;};
 try{
  for(const[kind,actions]of Object.entries(A.ACTIONS))for(const appearance of['base','alt']){
   const id=Array.from({length:128},(_,n)=>n).find(n=>A.appearanceFor(kind,n,{seed:17117,images:painter.images})===appearance),owner={id,kind,x:90,y:90,facing:-.7,health:90,visualMoving:false};
   const ctx=createCanvas(180,180).getContext('2d');event=null;painted=[];
   assert.equal(painter.drawActor(ctx,owner,kind,10,false,false),true);assert.equal(painted.length,1);assert.equal(A.ASSETS[painted[0].key],undefined,'Idle must use the historical walking atlas');
   const oldCamera=painted[0].transform,oldTransform=ctx.getTransform().toJSON();
   for(const action of Object.keys(actions)){
    event={active:true,action,progress:.55,facing:owner.facing};painted=[];
    assert.equal(painter.drawActor(ctx,owner,kind,10,false,false),true);assert.equal(painted.length,1);
    const expected=A.pose(owner,{presentation:view(owner,action,.55),seed:17117});
    assert.equal(painted[0].key,expected.atlas,'A missing new image must not silently pass this action fixture by drawing the old walk');
    assert.deepEqual(painted[0].rect,expected.rect);assert.deepEqual(painted[0].transform,oldCamera,kind+' '+appearance+' changes camera during '+action);
    assert.deepEqual(ctx.getTransform().toJSON(),oldTransform,'Master painter restores its caller transform');
   }
  }
 }finally{global.DEADWALL=oldGame;}
});

test('159 regional presentation: companion and infected aliases preserve historical cosmetic IDs and physical visibility',()=>{
 global.DeadwallCore=C;const R=require('../src/world-evolution-art.js'),G=require('../src/frontier-geometry.js'),calls=[];
 const ctx=new Proxy({},{get(_target,key){return typeof key==='symbol'?undefined:()=>{};}}),companion={id:'samir',x:20,y:30,z:0,inside:null,health:100,a:.6},enemy={id:'P0042:e2',x:22,y:30,z:0,hp:60,a:.2,kind:'walker'};
 const g={world:{},player:{},state:'playing',settings:{reducedMotion:false},elapsed:1,
  worldEvolution:{overview:()=>({districts:[],companions:[companion]}),groupMembers:()=>[],structureDestroyed:()=>false},frontier:{visibleEnemy:()=>true},
  art:{drawActor(_ctx,owner,kind){calls.push({...owner,paintKind:kind});return true;}}};
 const v={x:20,y:30,z:0,inside:null,enemies:[enemy],world:{nearPOI:()=>[]}},bounds={l:0,r:60,t:0,b:60};
 for(const entry of R.depthEntries(g,v,bounds))entry.draw(ctx);
 const allied=calls.find(c=>c.paintKind==='medic'),infected=calls.find(c=>c.paintKind==='walkerAlt');assert.equal(allied.id,1);assert.equal(allied.visualActionOwner159,'companion:samir');assert.equal(infected.id,G.hash(enemy.id));assert.equal(infected.visualActionOwner159,'region:'+enemy.id);
 calls.length=0;g.frontier.visibleEnemy=()=>false;for(const entry of R.depthEntries(g,v,bounds))entry.draw(ctx);assert.equal(calls.some(c=>c.visualActionOwner159==='region:'+enemy.id),false,'Action readiness does not reveal a hidden enemy');
});
