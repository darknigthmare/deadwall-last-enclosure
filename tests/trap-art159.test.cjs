'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const{createCanvas,loadImage}=require('@napi-rs/canvas');
const T=require('../src/trap-art159.js'),C=require('../src/core.js');
const repo=path.resolve(__dirname,'..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let images;
test.before(async()=>{images={};for(const[key,a]of Object.entries(T.ASSETS))images[key]=await loadImage(path.join(repo,a.url));});
const art=()=>({images,blit(c,key,r,...d){c.drawImage(this.images[key],...r,...d);return true;}});
const pixels=c=>Buffer.from(c.getImageData(0,0,c.canvas.width,c.canvas.height).data);
function bounds(c){const p=pixels(c);let l=c.canvas.width,t=c.canvas.height,r=-1,b=-1,n=0;for(let y=0;y<c.canvas.height;y++)for(let x=0;x<c.canvas.width;x++)if(p[(y*c.canvas.width+x)*4+3]>8){n++;l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return{l,t,r,b,n};}
function owner(rotation=0,type='spikes'){const def=C.BUILDINGS[type],size=def.size.map(n=>n*C.TILE),w=size[rotation%2?1:0],h=size[rotation%2?0:1];return Object.freeze({id:29,type,completed:true,dead:false,health:def.health,rotation,left:80-w/2,top:80-h/2,right:80+w/2,bottom:80+h/2});}
function paintMechanism(kind,motion,variant=0,rotation=0,phase=motion?'action':'armed',exposure=false){
 const c=createCanvas(160,160).getContext('2d'),b=owner(rotation),capacity=C.FortificationPackRules.mechanisms[kind].charges,charges=phase==='exhausted'?0:capacity,m=Object.freeze({kind,charges,cooldown:0,caught:Object.freeze([])}),presentation=Object.freeze({kind,phase,progress:.5,motion,charges,capacity,held:phase==='held'?1:0});
 if(exposure)c.clip=()=>{};
 assert.equal(T.drawMechanism(c,art(),b,m,{seed:17117,variant,presentation}),true);return c;
}

test('159 trap art: four untouched transparent PNG originals contain sixty completely isolated components',()=>{
 assert.equal(Object.keys(T.ASSETS).length,4);assert.equal(Object.values(T.CUTS).reduce((n,rows)=>n+rows.length,0),60);
 const provenance=JSON.parse(fs.readFileSync(path.join(repo,'assets/art159/PROVENANCE-traps159.json')));assert.equal(provenance.images.length,4);assert.equal(provenance.usedDrawingCount,60);assert.equal(provenance.sourcePixelEdits,false);assert.equal(provenance.runtimeRegistrySha256,sha(fs.readFileSync(path.join(repo,provenance.runtimeRegistry))));
 for(const[key,a]of Object.entries(T.ASSETS)){
  const bytes=fs.readFileSync(path.join(repo,a.url)),im=images[key];assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6);assert.deepEqual([im.width,im.height],[a.width,a.height]);
  const record=provenance.images.find(v=>v.assetKey===key);assert.ok(record);assert.equal(record.file,a.url);assert.equal(record.sha256,sha(bytes));assert.equal(record.originalSha256,record.sha256);assert.equal(record.components,T.CUTS[key].length);
  const c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);const p=pixels(c),covered=new Uint8Array(im.width*im.height);let transparent=0;
  for(const[x,y,w,h]of T.CUTS[key]){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=im.width&&y+h<=im.height);let ink=0;
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[(yy*im.width+xx)*4+3]>8){const at=yy*im.width+xx;assert.equal(covered[at],0,key+' copied a neighbouring piece');assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1,key+' clipped source component');covered[at]=1;ink++;}
   assert.ok(ink>400,key+' real independently rendered part');
  }
  for(let at=0;at<covered.length;at++){if(p[at*4+3]<=8)transparent++;else assert.equal(covered[at],1,key+' unexplained fragment outside component crops');}
  assert.ok(transparent>covered.length*.35,key+' transparent source gutters');
 }
});

test('159 trap art: every paid montage has a separate fixed base and two mobile components in two visual forms',()=>{
 for(const kind of T.MECHANISM_TYPES){assert.ok(C.FortificationPackRules.mechanisms[kind]);
  const forms=[];for(const variant of[0,1]){const p=T.partsFor(kind,29,{variant});assert.equal(p.parts.length,3);assert.deepEqual(p.parts.map(v=>v.role),['base','mobile1','mobile2']);const digests=p.parts.map(part=>{const c=createCanvas(part.rect[2],part.rect[3]).getContext('2d');c.drawImage(images[part.atlas],...part.rect,0,0,...part.rect.slice(2));return sha(pixels(c));});assert.equal(new Set(digests).size,3,kind+' components are distinct drawings');forms.push(sha(pixels(paintMechanism(kind,0,variant))));}assert.notEqual(...forms,kind+' actual structural variants');
 }
 for(const kind of T.SUPPLY_TYPES)for(const variant of[0,1])assert.equal(T.partsFor(kind,29,{variant}).parts.length,2);
});

test('159 trap art: real trigger/action/return motion articulates mobile pieces while leaving the fixed source and transform unchanged',()=>{
 for(const kind of T.MECHANISM_TYPES)for(const variant of[0,1]){
  const captures=[];for(const motion of[0,.5,1]){const c=createCanvas(160,160).getContext('2d'),a=art(),calls=[];a.blit=function(ctx,key,r,...d){calls.push({key,r,d,matrix:ctx.getTransform().toJSON()});ctx.drawImage(this.images[key],...r,...d);return true;};T.drawMechanism(c,a,owner(),{kind,charges:6},{variant,presentation:{phase:motion===0?'armed':motion===.5?'trigger':'action',motion}});captures.push({calls,digest:sha(pixels(c))});}
  assert.equal(new Set(captures.map(v=>v.digest)).size,3,kind+' visible intermediate articulation');assert.deepEqual(captures[0].calls[0],captures[1].calls[0]);assert.deepEqual(captures[0].calls[0],captures[2].calls[0]);assert.notDeepEqual(captures[0].calls.slice(1),captures[2].calls.slice(1),kind+' actual moving pieces');
  if(C.FortificationPackRules.mechanisms[kind].holdSeconds>0)assert.deepEqual(pixels(paintMechanism(kind,1,variant,0,'held')),pixels(paintMechanism(kind,1,variant,0,'action')),kind+' held pose remains physically closed');
  assert.deepEqual(pixels(paintMechanism(kind,.5,variant,0,'return')),pixels(paintMechanism(kind,.5,variant,0,'trigger')),kind+' resetting reverses the same mechanism');
 }
});

test('159 trap art: native montage silhouettes remain inside the actual rotated Hérisson support from core rules',()=>{
 for(const kind of T.MECHANISM_TYPES)for(const variant of[0,1])for(const rotation of[0,1,2,3])for(const motion of[0,.5,1]){const c=paintMechanism(kind,motion,variant,rotation),ink=bounds(c),b=owner(rotation);assert.ok(ink.n>100,kind+' readable native silhouette');assert.ok(ink.l>=b.left+3&&ink.r<b.right-3&&ink.t>=b.top+3&&ink.b<b.bottom-3,kind+' physical bounds retained');
  const uncut=paintMechanism(kind,motion,variant,rotation,motion?'action':'armed',true),complete=bounds(uncut);assert.ok(complete.l>=b.left+3&&complete.r<b.right-3&&complete.t>=b.top+3&&complete.b<b.bottom-3,kind+' whole assembled components fit without relying on the runtime owner clip');
 }
});

test('159 trap art: idle and exhausted views never invent animation; reduced motion keeps discrete real phases',()=>{
 for(const kind of T.MECHANISM_TYPES){
  const draw=(phase,motion,reducedMotion=false)=>{const c=createCanvas(160,160).getContext('2d');T.drawMechanism(c,art(),owner(),{kind,charges:phase==='exhausted'?0:6},{variant:0,reducedMotion,presentation:{phase,motion}});return pixels(c);};
  assert.deepEqual(draw('armed',0),draw('armed',0));assert.deepEqual(draw('armed',0),draw('not-real',1));assert.notDeepEqual(draw('armed',0),draw('exhausted',0));assert.deepEqual(draw('trigger',.1,true),draw('trigger',.9,true));assert.deepEqual(draw('return',.1,true),draw('armed',0));
 }
});

test('159 trap art: seed/identity alone select forms without state mutations or any RNG draws',()=>{
 const oldRandom=Math.random,oldNext=C.Random.prototype.next;Math.random=()=>assert.fail('Ambient RNG consumed');C.Random.prototype.next=()=>assert.fail('World RNG consumed');
 try{for(const kind of[...T.MECHANISM_TYPES,...T.SUPPLY_TYPES]){const forms=new Set();for(let id=0;id<64;id++){const first=T.partsFor(kind,id,{seed:17117});assert.deepEqual(T.partsFor(kind,id,{seed:17117}),first);forms.add(first.variant);}assert.equal(forms.size,2,kind);}const b=owner(),m={kind:'ankle',charges:6,cooldown:1,caught:[{id:77,left:2.1}]},view={phase:'held',motion:1,progress:.3},before=JSON.stringify({b,m,view});T.drawMechanism(createCanvas(160,160).getContext('2d'),art(),b,m,{presentation:view,seed:17117});assert.equal(JSON.stringify({b,m,view}),before);}finally{Math.random=oldRandom;C.Random.prototype.next=oldNext;}
});

test('159 trap art: spikes only flex on a real contact and the finite net deforms only during real absorption',()=>{
 for(const variant of[0,1])for(const rotation of[0,1,2,3]){
  const draw=(method,presentation)=>{const c=createCanvas(160,160).getContext('2d');assert.equal(T[method](c,art(),owner(rotation),{variant,presentation}),true);return pixels(c);};
  assert.notDeepEqual(draw('drawSpikes',{phase:'idle',motion:0}),draw('drawSpikes',{phase:'action',motion:1}));assert.deepEqual(draw('drawSpikes',{phase:'idle',motion:1}),draw('drawSpikes',{phase:'idle',motion:0}));
  assert.notDeepEqual(draw('drawNet',{phase:'armed',motion:0,remaining:12}),draw('drawNet',{phase:'action',motion:1,remaining:11}));assert.notDeepEqual(draw('drawNet',{phase:'action',motion:1,progress:.2,remaining:1}),draw('drawNet',{phase:'return',motion:.3,progress:.8,remaining:0}));
 }
 const c=createCanvas(160,160).getContext('2d');assert.equal(T.drawNet(c,art(),owner(),{presentation:{phase:'armed',remaining:0}}),false);assert.equal(bounds(c).n,0);
});

test('159 trap art: preparation crates use separate lids and act only during paid worker/engineer service',()=>{
 const draw=(view,type='spikes')=>{const c=createCanvas(160,160).getContext('2d'),b=owner(0,type);assert.equal(T.drawPreparation(c,art(),view.work?{...b,completed:false}:b,{variant:0,presentation:view}),true);return pixels(c);};
 const reserve={remaining:{scrap:5,wood:4,stone:1},phase:'idle',motion:0};assert.notDeepEqual(draw({maintenance:reserve}),draw({maintenance:{...reserve,active:true,phase:'service',motion:1}}));assert.notDeepEqual(draw({work:{remaining:C.Defense131Rules.workCapacity,phase:'idle',motion:0}}),draw({work:{remaining:C.Defense131Rules.workCapacity-1,active:true,phase:'service',motion:1}}));
 assert.deepEqual(draw({maintenance:{...reserve,motion:1}}),draw({maintenance:reserve}),'Stored supplies never animate by themselves');
 assert.notDeepEqual(draw({gate:{enabled:true}},'gate'),draw({gate:{enabled:false}},'gate'));
 const c=createCanvas(160,160).getContext('2d');assert.equal(T.drawPreparation(c,art(),{...owner(),completed:false},{presentation:{work:{remaining:C.Defense131Rules.workCapacity,phase:'service',motion:1}}}),true);assert.equal(T.drawPreparation(c,art(),owner(),{presentation:{maintenance:{remaining:{scrap:0,wood:0,stone:0}},work:{remaining:0}}}),false);
});

test('159 trap art: fortification and defense supply banks preserve one another and require all images before painting',()=>{
 const c=createCanvas(160,160).getContext('2d'),b=owner(0,'watchtower'),fort={ammo:C.FortificationPackRules.ammoCapacity,repair:C.FortificationPackRules.repairCapacity},defense={maintenance:{remaining:{wood:3}}},a=art();
 assert.equal(T.drawPreparation(c,a,b,{variant:0,presentation:fort}),true);const fortPixels=pixels(c);assert.equal(T.drawPreparation(c,a,b,{variant:0,presentation:defense}),true);const combined=pixels(c);for(let y=b.top;y<80;y++)for(let x=b.left;x<b.right;x++){const at=(y*160+x)*4;if(fortPixels[at+3]>8)assert.deepEqual(combined.subarray(at,at+4),fortPixels.subarray(at,at+4),'Defense reserve never covers fortification bank');}
 const missing=createCanvas(160,160).getContext('2d');assert.equal(T.drawPreparation(missing,{images:{}},b,{variant:0,presentation:fort}),false);assert.equal(bounds(missing).n,0);
 const splitId=Array.from({length:64},(_,n)=>n+1).find(id=>T.partsFor('ammo',id).atlas!==T.partsFor('repair',id).atlas);assert.ok(splitId);
 const ammoAtlas=T.partsFor('ammo',splitId).atlas,partial={images:{[ammoAtlas]:images[ammoAtlas]}};assert.equal(T.drawPreparation(missing,partial,{...b,id:splitId},{presentation:fort}),false);assert.equal(bounds(missing).n,0,'One unavailable required image prevents every supply part from drawing');
});

test('159 trap art: the actual defense draw wrapper leaves supply sprites visible above its historical badges',()=>{
 const Defense=require('../src/defense-pack131.js');
 for(const type of['spikes','gate','watchtower']){
  const b=Object.freeze({...owner(0,type),def:C.BUILDINGS[type]}),registered=[],g={world:{seed:17117,buildings:new Map([[b.id,b]])},art:art(),settings:{reducedMotion:false},expansions:{register(m){registered.push(m);}},drawBuilding(){}};
  const api=Defense.install(g),gate=C.BUILDINGS[type].gate?{enabled:true,delay:0,manualPhase:null}:null;
  registered[0].restore({version:1,posts:[{id:b.id,gate,maintenance:{...C.Defense131Rules.maintenanceCost},work:0,arc:null}]});
  const clean=createCanvas(160,160).getContext('2d'),wrapped=createCanvas(160,160).getContext('2d');assert.equal(T.drawPreparation(clean,g.art,b,{seed:17117,presentation:api.presentation(b)}),true);g.drawBuilding(wrapped,b);
  const before=pixels(clean),after=pixels(wrapped);let ink=0,visible=0;for(let at=0;at<before.length;at+=4)if(before[at+3]>8){ink++;if(before.subarray(at,at+4).equals(after.subarray(at,at+4)))visible++;}
  assert.ok(ink>5,type+' sprite exists at its actual dimensions');assert.ok(visible>=ink*.65,type+' reserve remains visible after the actual badge painter');
 }
});

test('159 trap art: painters restore caller canvas state and retain safe historical fallbacks',()=>{
 const c=createCanvas(160,160).getContext('2d');c.translate(2,3);c.globalAlpha=.6;c.filter='contrast(1.1)';c.setLineDash([4,3]);const matrix=c.getTransform().toJSON(),b=owner();
 for(const call of[()=>T.drawMechanism(c,art(),b,{kind:'ankle',charges:0},{presentation:{phase:'exhausted',motion:0}}),()=>T.drawSpikes(c,art(),b,{presentation:{phase:'action',motion:1}}),()=>T.drawNet(c,art(),b,{presentation:{phase:'return',motion:.5,remaining:0,progress:.7}}),()=>T.drawPreparation(c,art(),b,{presentation:{ammo:12,repair:50,regulator:true}})]){assert.equal(call(),true);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,.6);assert.equal(c.filter,'contrast(1.1)');assert.deepEqual(c.getLineDash(),[4,3]);}
 const before=pixels(c);for(const kind of['unknown','__proto__',null]){assert.equal(T.partsFor(kind,1),null);assert.equal(T.drawMechanism(c,art(),b,{kind}),false);}assert.equal(T.drawMechanism(c,{images:{}},b,{kind:'ankle'}),false);assert.equal(T.drawSpikes(c,art(),{...b,type:'wall'}),false);assert.equal(T.drawSpikes(c,art(),{...b,dead:true}),false);assert.equal(T.drawSpikes(c,art(),{...b,completed:false}),false);assert.equal(T.drawNet(c,art(),{...b,left:NaN},{presentation:{remaining:12}}),false);assert.deepEqual(pixels(c),before);
 c.fillStyle='#ff0000';c.fillRect(2,2,4,4);assert.ok(c.getImageData(5,6,1,1).data[3]>0,'Renderer did not leak its owner clip');
});
