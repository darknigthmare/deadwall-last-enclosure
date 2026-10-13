'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas');
const W=require('../src/world-variants158.js'),V=require('../src/vehicle-art152.js'),A136=require('../src/assets136.js'),D=require('../src/seed-detail-art157.js'),C=require('../src/core.js'),Art=require('../src/art.js');
const repo=path.resolve(__dirname,'..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let images;
test.before(async()=>{images={};for(const[key,spec]of Object.entries(W.ASSETS))images[key]=await loadImage(path.join(repo,spec.url));});
const art=()=>({images,blit(c,key,r,...destination){c.drawImage(this.images[key],...r,...destination);return true;}});
const raster=c=>Buffer.from(c.getImageData(0,0,c.canvas.width,c.canvas.height).data);
function bounds(c){const p=raster(c);let l=c.canvas.width,t=c.canvas.height,r=-1,b=-1,n=0;for(let y=0;y<c.canvas.height;y++)for(let x=0;x<c.canvas.width;x++)if(p[(y*c.canvas.width+x)*4+3]>8){n++;l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return{l,t,r,b,n};}

test('158 variants: ten original PNGs and every used measured cut retain native alpha and complete isolated source silhouettes',()=>{
 assert.equal(Object.keys(W.ASSETS).length,10);
 assert.equal(Object.entries(W.CUTS).reduce((count,[key,cuts])=>count+cuts.length-(W.UNUSED_SOURCE_INDICES[key]?.length||0),0),137,'Discarded crowded poses and short heavy vehicles are not counted as usable drawings');
 for(const[key,spec]of Object.entries(W.ASSETS)){
  const file=path.join(repo,spec.url),bytes=fs.readFileSync(file),im=images[key];assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.deepEqual([im.width,im.height],[spec.width,spec.height]);
  const c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);const p=raster(c),covered=new Uint8Array(im.width*im.height);let transparent=0;
  const cuts=W.CUTS[key].filter((_r,i)=>!W.UNUSED_SOURCE_INDICES[key]?.includes(i));
  for(const[x,y,w,h]of cuts){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=im.width&&y+h<=im.height,key+' valid measured bounds');let ink=0;
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[(yy*im.width+xx)*4+3]>8){const at=yy*im.width+xx;assert.equal(covered[at],0,key+' copied neighbour');covered[at]=1;ink++;assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1,key+' clipped source');}
   assert.ok(ink>100,key+' contains a real model or pose');
  }
  for(const[x,y,w,h]of W.UNUSED_SOURCE_CUTS[key]||[])for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const at=yy*im.width+xx;if(p[at*4+3]>8){assert.equal(covered[at],0,'Unused source area overlaps a usable drawing');covered[at]=2;}}
  for(let at=0;at<covered.length;at++){if(p[at*4+3]<=8)transparent++;else assert.ok(covered[at]===1||covered[at]===2,key+' unexplained source fragment');}
  assert.ok(transparent>covered.length*.1,key+' genuine alpha gutters');
 }
});

test('158 variants: all eleven new actor families contain eight different native poses without changing the historical actor roles',()=>{
 assert.equal(Object.keys(W.ACTORS).length,11);assert.equal(Object.values(W.ACTORS).reduce((n,a)=>n+a.frames.length,0),88);
 for(const[kind,profile]of Object.entries(W.ACTORS)){
  assert.ok(C.ENEMIES[kind]||C.SURVIVORS[kind]);const digests=new Set();
  for(let frame=0;frame<8;frame++){const c=createCanvas(100,100).getContext('2d');c.translate(50,50);assert.equal(W.drawActor(c,art(),kind,17,frame,55,{seed:17117,variant:1}),true);assert.ok(bounds(c).n>30,kind+' real pose');digests.add(sha(raster(c)));}
  assert.equal(digests.size,8,kind+' is not a static sprite repeated as a cycle');assert.equal(profile.frames.length,8);
 }
 for(const kind of['walker','worker','soldier','walkerAlt','workerAlt','soldierAlt','constructor','__proto__'])assert.equal(W.actorFrame(kind,17,0,{variant:1}),null);
});

test('158 variants: seed and stable identity select old and new appearances without RNG or live state affecting the choice',()=>{
 const oldRandom=Math.random,oldCoreRandom=C.Random.prototype.next;
 Math.random=()=>assert.fail('Ambient RNG consumed');C.Random.prototype.next=()=>assert.fail('Simulation RNG consumed');
 try{
  for(const kind of Object.keys(W.ACTORS)){
   const choices=new Set();for(let id=0;id<32;id++){const a=W.actorFrame(kind,id,0,{seed:17117});assert.deepEqual(W.actorFrame(kind,id,0,{seed:17117}),a);choices.add(!!a);}assert.equal(choices.size,2,kind);
  }
  for(const type of W.VEHICLE_TYPES){const choices=new Set();for(let id=0;id<32;id++)choices.add(!!W.vehicleSprite(type,id,{seed:17117}));assert.equal(choices.size,2,type);assert.equal(W.vehicleSprite(type,undefined,{variant:1}),null);}
  for(const registry of[W.MECHANISMS,W.DETAILS])for(const kind of Object.keys(registry)){const choices=new Set();for(let id=0;id<32;id++)choices.add(W.selectPair(registry,kind,id,{seed:17117}).variant);assert.equal(choices.size,2,kind);}
 }finally{Math.random=oldRandom;C.Random.prototype.next=oldCoreRandom;}
});

test('158 actor owner: native alternative cycles keep stationary, reduced-motion and charge windup frames, while equipment overlays still run',()=>{
 const priorGame=global.DEADWALL;global.DEADWALL={world:{seed:17117}};
 try{
  // Use the actual owner while keeping the loader synchronous in this fixture.
  const previousImage=global.Image;global.Image=class{set src(_value){this.onerror();}};let instance;
  try{instance=Art.create();}finally{global.Image=previousImage;}
  const calls=[],equipment=[];instance.images={...images,survivors:{},infected:{},infectedExpansion:{},specialists:{}};instance.blit=(_c,key,r,...d)=>{calls.push({key,r,d});return true;};instance.drawInfectedEquipment=(_c,e,kind)=>equipment.push({id:e.id,kind});
  const c=createCanvas(300,300).getContext('2d');
  for(const kind of Object.keys(W.ACTORS)){
   const id=Array.from({length:32},(_,n)=>n).find(n=>W.actorFrame(kind,n,0,{seed:17117})),owned={id,x:120,y:140,facing:.6,visualMoving:false},before=JSON.stringify(owned);
   assert.equal(instance.drawActor(c,owned,kind,1,false,false),true);assert.deepEqual(calls.at(-1).r,W.actorFrame(kind,id,0,{seed:17117}).rect);assert.equal(JSON.stringify(owned),before);assert.equal(equipment.at(-1).kind,kind);
   assert.equal(instance.drawActor(c,{...owned,visualMoving:true,x:121},kind,1.13,true,false),true);assert.deepEqual(calls.at(-1).r,W.actorFrame(kind,id,0,{seed:17117}).rect);
   if(kind==='charger'){assert.equal(instance.drawActor(c,{...owned,visualMoving:true,charge:{stage:'windup'}},kind,1.26,false,false),true);assert.deepEqual(calls.at(-1).r,W.actorFrame(kind,id,0,{seed:17117}).rect);}
  }
  const player={id:1,x:130,y:145,facing:0},paths=['drawHeroAction133','drawHandheld136','drawUnarmed133','drawLowFirearm137','drawCommanderRig'];
  for(const active of paths){for(const name of paths)instance[name]=()=>name===active;assert.equal(instance.drawActor(c,player,'player',1,false,false),true);assert.equal(calls.at(-1).key,'art158PlayerGear',active+' preserves its native action before torso equipment');}
 }finally{global.DEADWALL=priorGame;}
});

test('158 actor owner: regional text IDs stay visible through movement, pause, stop and resumed presentation',()=>{
 const priorGame=global.DEADWALL,previousImage=global.Image;global.DEADWALL={world:{seed:17117}};global.Image=class{set src(_value){this.onerror();}};let instance;
 try{instance=Art.create();}finally{global.Image=previousImage;}
 try{
  const calls=[];instance.images={...images,survivors:{},infected:{},infectedExpansion:{},specialists:{}};instance.blit=(_c,key,r,...d)=>{assert.ok([...r,...d].every(Number.isFinite),'Every source and destination coordinate is finite');calls.push({key,r,d});return true;};
  const c=createCanvas(220,220).getContext('2d');
  const frameFor=(kind,id,frame)=>W.actorFrame(kind,id,frame,{seed:17117})?.rect||Art.actorFrameRect(...Art.ACTORS[Art.actorVariant(kind,id)],frame);
  for(const kind of['walker','runner','crawler']){
   const id=kind==='walker'?'P00001:e1':Array.from({length:64},(_,n)=>'P00001:e'+n).find(id=>W.actorFrame(kind,id,0,{seed:17117})),entity={id,visualIdentity:'regional:'+id+':'+kind,x:100,y:100,facing:0},original=JSON.stringify(entity),rate=kind==='runner'?13:9,phase=W.hash(0,id,'actor-phase')%8;
   const paint=(value,time,reduced=false)=>{assert.equal(instance.drawActor(c,value,kind,time,reduced,false),true);return calls.at(-1);};
   assert.deepEqual(paint(entity,1).r,frameFor(kind,id,0),'Stationary arrival');
   const moving={...entity,x:101},time=1.125,expected=Math.floor(time*rate+phase)%8;
   assert.deepEqual(paint(moving,time).r,frameFor(kind,id,expected),'Text identity animates while moving');
   assert.deepEqual(paint({...moving},time).r,frameFor(kind,id,expected),'Paused repeated paint retains the pose');
   assert.deepEqual(paint({...moving},1.25).r,frameFor(kind,id,0),'A new stationary sample stops walking');
   assert.deepEqual(paint({...moving,x:102},1.375).r,frameFor(kind,id,Math.floor(1.375*rate+phase)%8),'Movement resumes');
   assert.deepEqual(paint({...moving,x:102,visualMotionReset:true},.5).r,frameFor(kind,id,0),'Restored presentation starts stationary');
   assert.deepEqual(paint({...moving,x:103},.625).r,frameFor(kind,id,Math.floor(.625*rate+phase)%8),'Restored text identity keeps the same phase');
   const poses=new Set();for(let frame=0;frame<8;frame++){const time=(8+frame+.1-phase)/rate;poses.add(JSON.stringify(paint({...entity,visualMoving:true},time).r));}assert.equal(poses.size,8,kind+' keeps the full cycle');
   assert.equal(JSON.stringify(entity),original,'Painting does not mutate the actor');
  }
  const id=17,time=1.125,kind='runner';assert.deepEqual(instance.drawActor(c,{id,x:100,y:100,facing:0,visualMoving:true},kind,time,false,false),true);assert.deepEqual(calls.at(-1).r,frameFor(kind,id,Math.floor(time*13+id)%8),'Historical numeric phases are unchanged');
 }finally{global.DEADWALL=priorGame;}
});

test('158 crawler ground anchors retain the same owner centre through both source rows',()=>{
 for(let frame=0;frame<8;frame++){const c=createCanvas(100,100).getContext('2d');c.translate(50,50);assert.equal(W.drawActor(c,art(),'crawler',17,frame,49,{variant:1}),true);const b=bounds(c);assert.ok(Math.abs((b.t+b.b)/2-50)<7,'Prone body remains centred on its physical owner');}
});

test('158 engorged poses preserve a broad heavy silhouette at the historical actor scale',()=>{
 for(let frame=0;frame<8;frame++){const c=createCanvas(100,100).getContext('2d');c.translate(50,50);assert.equal(W.drawActor(c,art(),'bloated',17,frame,62,{variant:1}),true);const b=bounds(c),width=b.r-b.l+1,height=b.b-b.t+1;assert.ok(width>=31&&height>=50&&width/height>=.55,'Engorged body stays heavy rather than reading as a thin worker');}
});

test('158 vehicles: all nine alternate native bodies keep the true caller rectangle, orientation and finite service states',()=>{
 const a=art();for(const type of W.VEHICLE_TYPES){const p=C.WorldEvolution.RULES.vehicles[type],before=JSON.stringify(p),painter=Object.hasOwn(V.SPRITES,type)?V.drawVehicle:A136.drawVehicle139;
  for(const factor of[1,44/4.6])for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
   const f=W.measureVehicle(type,17,p.w*factor,p.h*factor,{seed:17117,variant:1}),[x,y,w,h]=f.destination;assert.equal(x,-w/2);assert.equal(y,-h/2);assert.ok(w<=p.w*factor+1e-9&&h<=p.h*factor+1e-9);assert.ok(Math.abs(w/h-f.source[2]/f.source[3])<1e-9);
   const c=createCanvas(600,600).getContext('2d');c.translate(300,300);c.rotate(angle);c.scale(40/factor,40/factor);c.globalAlpha=.7;c.filter='contrast(1.1)';const alpha=c.globalAlpha,matrix=c.getTransform().toJSON(),state={identity:17,seed:17117,variant:1,hp:p.health,opened:true,dismantled:true,exhausted:true,active:true},saved=JSON.stringify(state);
   assert.equal(painter(c,a,type,p.w*factor,p.h*factor,state),true);assert.equal(JSON.stringify(state),saved);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,'contrast(1.1)');assert.deepEqual(c.getTransform().toJSON(),matrix);assert.ok(bounds(c).n>20,type);
  }assert.equal(JSON.stringify(p),before);
 }
 for(const type of['skate','bike']){const p=C.WorldEvolution.RULES.vehicles[type],render=state=>{const c=createCanvas(240,160).getContext('2d');c.translate(120,80);c.scale(70,70);V.drawVehicle(c,a,type,p.w,p.h,{identity:17,variant:1,hp:p.health,...state});return raster(c);};assert.deepEqual(render({}),render({opened:true,dismantled:true,exhausted:true,active:true}),type+' no invented hatch or motor');}
 for(const type of['bus','truck']){const p=C.WorldEvolution.RULES.vehicles[type],f=W.measureVehicle(type,17,p.w,p.h,{variant:1});assert.equal(f.sprite.atlas,'art158HeavyVehicles');assert.ok(f.destination[2]>=p.w*.85&&f.destination[3]>=p.h*.75,type+' long body matches its physical rectangle without stretching');}
});

test('158 detail sprites: all thirteen pairs fit their real supports at each parcel orientation and respect vertical hedges and fences',()=>{
 assert.equal(W.DETAIL_TYPES.length,13);const a=art();
 for(const kind of W.DETAIL_TYPES)for(const[w,h]of[[3,.6],[.6,3]])for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const digests=new Set();for(const variant of[0,1]){const c=createCanvas(320,320).getContext('2d'),o=Object.freeze({id:'detail:'+kind,kind,x:-w/2,y:-h/2,w,h,z:1,solid:!['patio','paper','menu','notice','palletMark'].includes(kind)}),before=JSON.stringify(o);c.translate(160,160);c.rotate(angle);c.scale(50,50);const matrix=c.getTransform().toJSON();
   assert.equal(W.drawDetail(c,a,o,{seed:17117,variant}),true);const b=bounds(c),halfW=(angle===Math.PI/2||angle===Math.PI*1.5?h:w)*25,halfH=(angle===Math.PI/2||angle===Math.PI*1.5?w:h)*25;assert.ok(b.n>3,kind);assert.ok(b.l>=Math.floor(160-halfW)&&b.r<=Math.ceil(160+halfW)&&b.t>=Math.floor(160-halfH)&&b.b<=Math.ceil(160+halfH),kind+' no picture outside the blocker');assert.equal(JSON.stringify(o),before);assert.deepEqual(c.getTransform().toJSON(),matrix);digests.add(sha(raster(c)));
  }assert.equal(digests.size,2,kind+' structurally different pictures');
 }
 for(const kind of W.DETAIL_TYPES){const o={id:'owner'+kind,kind,x:0,y:0,w:2,h:1,z:0},c=createCanvas(200,160).getContext('2d');c.scale(50,50);assert.equal(D.draw(c,o,{art:a,seed:17117}),true);assert.ok(bounds(c).n>3,kind+' real seed detail owner calls image painter');}
});

test('158 mechanisms: six pairs retain the paid support, charges and exhausted appearance without creating gameplay state',()=>{
 const a=art();assert.equal(W.MECHANISM_TYPES.length,6);
 for(const kind of W.MECHANISM_TYPES){assert.ok(C.FortificationPackRules.mechanisms[kind]);const model=Object.freeze({id:21,completed:true,dead:false,left:10,top:10,right:90,bottom:70}),digests=new Set();
  for(const variant of[0,1])for(const charges of[0,C.FortificationPackRules.mechanisms[kind].charges]){const c=createCanvas(100,80).getContext('2d'),m=Object.freeze({kind,charges,cooldown:.2,caught:[]}),before=JSON.stringify({model,m});assert.equal(W.drawMechanism(c,a,model,m,{seed:17117,variant}),true);const b=bounds(c);assert.ok(b.n>100);assert.ok(b.l>=13&&b.r<=87&&b.t>=13&&b.b<=67);assert.equal(JSON.stringify({model,m}),before);digests.add(sha(raster(c)));}
  assert.equal(digests.size,4,kind+' two real mountings and actual exhausted fade');
 }
});

test('158 player gear: two torso-attached packs preserve actions, posture and commander appearance across the historical ID sentinel restore',()=>{
 const a=art(),original={id:1,x:100,y:100,facing:.8,visualUpperFacing:.4,visualLowerFacing:-.4,visualMoving:true,visualStride:2,weapon:'rifle',reload:1,visualAction:'work'},before=JSON.stringify(original),digests=new Set();
 for(const variant of[0,1]){
  for(const posture of['stand','crouch','prone']){const c=createCanvas(200,200).getContext('2d');c.globalAlpha=.6;c.filter='contrast(1.1)';const matrix=c.getTransform().toJSON();assert.equal(W.drawPlayerGear(c,a,{...original,visualPosture:posture},{seed:17117,variant}),true);assert.ok(bounds(c).n>20);assert.equal(c.globalAlpha,.6);assert.equal(c.filter,'contrast(1.1)');assert.deepEqual(c.getTransform().toJSON(),matrix);if(posture==='stand')digests.add(sha(raster(c)));}
 }
 assert.equal(digests.size,2);assert.equal(JSON.stringify(original),before);
 const render=id=>{const c=createCanvas(200,200).getContext('2d');W.drawPlayerGear(c,a,{...original,id},{seed:17117});return raster(c);};assert.deepEqual(render(1),render(0),'The restored commander ID does not reroll equipment');
});

test('158 variants: absent images and invalid inherited kinds preserve the old paint path and all caller Canvas state',()=>{
 const c=createCanvas(100,100).getContext('2d');c.translate(3,4);c.scale(2,2);c.globalAlpha=.5;c.filter='contrast(1.1)';const alpha=c.globalAlpha,before=raster(c),matrix=c.getTransform().toJSON();
 for(const kind of['constructor','__proto__','unknown']){assert.equal(W.actorFrame(kind,1,0,{variant:1}),null);assert.equal(W.vehicleSprite(kind,1,{variant:1}),null);assert.equal(W.selectPair(W.DETAILS,kind,1),null);assert.equal(W.selectPair(W.MECHANISMS,kind,1),null);}
 assert.equal(W.drawActor(c,{images:{}},'runner',1,0,55,{variant:1}),false);assert.equal(W.drawDetail(c,{images:{}},{id:1,kind:'hedge',x:0,y:0,w:1,h:3}),false);assert.equal(W.drawPlayerGear(c,{images:{}},{id:0,x:10,y:10}),false);
 for(const[w,h]of[[NaN,1],[1,Infinity],[0,1],[1,-1]])assert.equal(W.measureVehicle('break',1,w,h,{variant:1}),null);
 assert.deepEqual(raster(c),before);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);assert.equal(c.filter,'contrast(1.1)');
});
