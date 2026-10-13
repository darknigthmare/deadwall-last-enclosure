'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const{createRequire}=require('node:module'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/context-art160.js'),I=require('../src/interior-art153.js'),G=require('../src/frontier-geometry.js'),C=require('../src/core.js');
const repo=path.resolve(__dirname,'..'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),metadata=JSON.parse(fs.readFileSync(path.join(repo,'assets/art160/CUTS_METADATA.json'))),provenance=JSON.parse(fs.readFileSync(path.join(repo,'assets/art160/PROVENANCE.json')));
let images;
test.before(async()=>{images={};for(const[key,s]of Object.entries(A.ASSETS))images[key]=await loadImage(path.join(repo,s.url));for(const key of ['habitatResidential153','habitatServices153','habitatRoofs157'])images[key]=await loadImage(path.join(repo,I.ASSETS[key].url));});
const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
const rasterDigest=canvas=>sha(Buffer.from(pixels(canvas)));
const frozen=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')frozen(child);return Object.freeze(value);};
function recording(width=640,height=480){const canvas=createCanvas(width,height),native=canvas.getContext('2d'),calls=[];const ctx=new Proxy(native,{get(target,key){if(key==='drawImage')return(...args)=>{calls.push({image:args[0],args:args.slice(1),matrix:target.getTransform().toJSON(),alpha:target.globalAlpha});return target.drawImage(...args);};const v=target[key];return typeof v==='function'?v.bind(target):v;},set(target,key,value){target[key]=value;return true;}});return{canvas,ctx,native,calls};}
function simpleArt(){return{images};}
function masterArt(){
 const source=path.join(repo,'src/art.js'),module={exports:{}},sandbox={module,require:createRequire(source),Image:class DormantImage{set src(value){this.url=value;}}};
 vm.runInNewContext(fs.readFileSync(source,'utf8'),sandbox,{filename:source});const art=module.exports.create();Object.assign(art.images,images);return art;
}
function scene({kind='pumpBase',variant=0}={}){const p=frozen({id:'P9001',x:140,y:130,w:40,h:36,a:0,levels:[0],context160:{mode:'open'}}),o=frozen({id:p.id+':160:pump',kind,x:8,y:8,w:7,h:5,z:0,variant}),plan=frozen({z:0,terrain160:[],visuals160:[o],volumes160:[],operations160:[{key:'pump',kind:'pumpBasin'}]});let job=null;const completed=new Set(),world={seed:903159,contextCompleted160:key=>completed.has(key)},game={art:simpleArt(),world:{seed:world.seed},settings:{reducedMotion:false},elapsed:90,paused:false,serialize:()=>assert.fail('Painting must not serialize'),frontier:{world:()=>assert.fail('Painting must not materialize the world')},contextOperations160:{presentation:key=>job?.fullKey===key?job:null,isComplete:key=>completed.has(key)}};return{p,o,plan,world,game,completed,setJob:payload=>{job=payload;}};}
function visualCapture(s){const r=recording(420,340);r.ctx.scale(18,18);A.drawVisual(r.ctx,s.game,s.p,s.plan,s.o,{world:s.world});return{calls:r.calls,digest:rasterDigest(r.canvas)};}
const payload=(progress,kind='pumpBasin',key='P9001:160:pump')=>frozen({fullKey:key,kind,progress,elapsed:progress*30,start:90,duration:30,anchor:{x:150,y:148,z:0}});

// Actual pixel/identity assertions, not a declaration-count substitute for rendering.
test('160 context art: three original alpha PNGs agree with their dimensions and generation provenance',()=>{
 assert.equal(Object.keys(A.ASSETS).length,3);assert.equal(provenance.generator,'OpenAI image_gen.imagegen');assert.equal(provenance.sourceCuts,48);assert.equal(provenance.totalSourceBytes,8211248);
 let size=0;for(const[key,s]of Object.entries(A.ASSETS)){const bytes=fs.readFileSync(path.join(repo,s.url)),record=provenance.atlases.find(a=>a.key===key),image=images[key];assert.ok(record);assert.equal(s.lazy,true);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes[25],6,'PNG has a real alpha channel');assert.equal(sha(bytes),record.sha256);assert.equal(record.copiedVerbatim,true);assert.equal(record.transparentBackgroundRequested,true);assert.deepEqual([image.width,image.height],[s.width,s.height]);size+=bytes.length;
  const canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');c.drawImage(image,0,0);const data=pixels(canvas);let zero=0,ink=0;for(let i=3;i<data.length;i+=4){if(data[i]===0)zero++;if(data[i]>=32)ink++;}assert.ok(zero>image.width*image.height*.35,'Transparent space separates the components');assert.ok(ink>100000,'Atlas contains actual detailed drawings');
 }assert.equal(size,provenance.totalSourceBytes);assert.ok(size<12*1024*1024,'Three shared atlases remain within their stated12MiB budget');
});

test('160 context art: forty-eight measured cuts contain complete principal silhouettes without sharing pixels',()=>{
 assert.equal(Object.keys(A.CUTS).length,24);assert.deepEqual(A.CUTS,metadata.families);let total=0;
 for(const[key,s]of Object.entries(A.ASSETS)){const image=images[key],canvas=createCanvas(s.width,s.height),c=canvas.getContext('2d');c.drawImage(image,0,0);const data=pixels(canvas),covered=new Uint8Array(s.width*s.height);
  for(const[kind,forms]of Object.entries(A.CUTS)){assert.equal(forms.length,2,kind);for(const sprite of forms){if(sprite.atlas!==key)continue;total++;assert.ok(Object.isFrozen(sprite)&&Object.isFrozen(sprite.rect)&&Object.isFrozen(sprite.pivot));const[x,y,w,h]=sprite.rect;assert.ok([x,y,w,h].every(Number.isSafeInteger));assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=s.width&&y+h<=s.height);assert.ok(sprite.pivot.every(v=>Number.isFinite(v)&&v>=0&&v<=1));let principal=0;
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const at=yy*s.width+xx;if(data[at*4+3]<32)continue;assert.equal(covered[at],0,kind+' never copies another principal component');covered[at]=1;principal++;}assert.ok(principal>500,kind+' contains a real independently painted component');
  }}
  for(let at=0;at<covered.length;at++)if(data[at*4+3]>=32)assert.equal(covered[at],1,'All principal pixels have an explained original cut');
 }assert.equal(total,48);
 // The provenance explicitly reports the small alpha9–31 feather traces where two natural regions meet.
 assert.ok(provenance.cutNotes.some(t=>t.includes('alpha9')));assert.ok(provenance.negativeCandidate.reason.includes('24'));
});

test('160 context art: each pair is two different native drawings and selects deterministically without RNG',()=>{
 const previousRandom=Math.random,previousNext=C.Random.prototype.next;Math.random=()=>assert.fail('Ambient RNG consumed');C.Random.prototype.next=()=>assert.fail('Simulation RNG consumed');
 try{for(const[kind,forms]of Object.entries(A.CUTS)){const digests=forms.map(s=>{const canvas=createCanvas(s.rect[2],s.rect[3]);canvas.getContext('2d').drawImage(images[s.atlas],...s.rect,0,0,s.rect[2],s.rect[3]);return rasterDigest(canvas);});assert.notEqual(digests[0],digests[1],kind+' has two actual models');const selected=new Set();for(let id=0;id<64;id++){const a=A.select(kind,'component:'+id,{seed:903159});assert.equal(a,A.select(kind,'component:'+id,{seed:903159}));selected.add(a.variant);}assert.equal(selected.size,2,kind+' uses both forms');assert.equal(A.select(kind,'component',{variant:0}),forms[0]);assert.equal(A.select(kind,'component',{variant:1}),forms[1]);}
  for(const kind of ['__proto__','constructor','unknown'])assert.equal(A.select(kind,'component'),null);
 }finally{Math.random=previousRandom;C.Random.prototype.next=previousNext;}
});

test('160 context art: every source cut is actually blitted from its decoded PNG with stable ground contact',()=>{
 for(const[kind,forms]of Object.entries(A.CUTS))for(const variant of[0,1]){const r=recording(400,320),o=frozen({id:'native:'+kind,kind,x:80,y:100,w:160,h:100,variant}),before=JSON.stringify(o);assert.equal(A.drawSprite(r.ctx,simpleArt(),o,{seed:903159,variant}),true);assert.equal(r.calls.length,1);const call=r.calls[0],s=forms[variant];assert.equal(call.image,images[s.atlas]);assert.deepEqual(call.args.slice(0,4),s.rect);const[x,y,w,h]=call.args.slice(4);assert.ok(w>0&&h>0&&x>=o.x-1e-8&&x+w<=o.x+o.w+1e-8);assert.ok(Math.abs(y+h-(o.y+o.h))<1e-8,'Real ground contact remains on the support');assert.ok(pixels(r.canvas).some((v,i)=>i%4===3&&v>=32));assert.equal(JSON.stringify(o),before);}
});

test('160 context art: a native depth entry uses the production Art blitter and the rotated metric POI transform',()=>{
 const s=scene(),p={...s.p,x:400,y:300,a:Math.PI/2},r=recording(800,640);s.game.art=masterArt();r.ctx.translate(400,320);r.ctx.scale(8,8);r.ctx.translate(-p.x,-p.y);const before=r.ctx.getTransform().toJSON(),entries=A.depthEntries(s.game,p,s.plan,{world:s.world,v:{z:0,x:0,y:0}});assert.equal(entries.length,1);entries[0].draw(r.ctx);assert.deepEqual(r.ctx.getTransform().toJSON(),before);assert.ok(r.calls.length>=2,'Pump body and rotor are both painted');
 const body=r.calls.find(call=>call.image===images.waterPort160&&call.args.slice(0,4).every((v,i)=>v===A.CUTS.pumpBase[0].rect[i]));assert.ok(body,'The actual original pump source is used by Art.blit');assert.equal(s.game.art.diagnostics.draws.waterPort160,r.calls.length);const d=body.args.slice(4),localFoot={x:d[0]+d[2]/2,y:d[1]+d[3]},m=body.matrix,screen={x:m.a*localFoot.x+m.c*localFoot.y+m.e,y:m.b*localFoot.x+m.d*localFoot.y+m.f},globalFoot=G.global(p,s.o.x+s.o.w/2,s.o.y+s.o.h);assert.ok(Math.abs(screen.x-(400+8*(globalFoot.x-p.x)))<1e-7);assert.ok(Math.abs(screen.y-(320+8*(globalFoot.y-p.y)))<1e-7);
});

test('160 context art: mechanical layers move only for the matching physical operation presentation',()=>{
 const s=scene(),idle=visualCapture(s);assert.equal(idle.calls.length,2);s.game.elapsed+=1000;assert.equal(visualCapture(s).digest,idle.digest,'Elapsed time alone does not animate a machine');s.setJob(payload(.12,'switchTrack','P9002:160:switch'));assert.equal(visualCapture(s).digest,idle.digest,'Another place or operation does not animate this pump');
 s.setJob(payload(.12));const a=visualCapture(s);s.setJob(payload(.28));const b=visualCapture(s);assert.notEqual(a.digest,b.digest);assert.deepEqual(a.calls[0].args,b.calls[0].args);assert.deepEqual(a.calls[0].matrix,b.calls[0].matrix,'Fixed pump base never rotates');assert.equal(a.calls[1].image,images.waterPort160);assert.deepEqual(a.calls[1].args.slice(0,4),A.CUTS.pumpRotor[0].rect);assert.notDeepEqual(a.calls[1].matrix,b.calls[1].matrix,'Separate rotor follows real job progress');
 s.setJob(null);assert.equal(visualCapture(s).digest,idle.digest,'Ending or losing the operation resets its transient motion');
});

test('160 context art: pause and reduced motion preserve persistent quantities and do not invent progress',()=>{
 const s=scene();s.setJob(payload(.23));const before=JSON.stringify({p:s.p,o:s.o,plan:s.plan,completed:[...s.completed]}),first=visualCapture(s);s.game.paused=true;s.game.elapsed+=500;assert.equal(visualCapture(s).digest,first.digest,'Owner progress is frozen during pause');
 s.game.settings.reducedMotion=true;const reduced=visualCapture(s);s.setJob(payload(.78));assert.equal(visualCapture(s).digest,reduced.digest,'Reduced motion retains the real active state without continuous spinning');assert.equal(JSON.stringify({p:s.p,o:s.o,plan:s.plan,completed:[...s.completed]}),before);
});

test('160 context art: a valve uses independently drawn body and handwheel, never a fuel dispenser',()=>{
 const s=scene({kind:'valveBody'});s.o=frozen({...s.o,id:'P9001:160:valve'});s.plan=frozen({...s.plan,visuals160:[s.o],operations160:[{key:'access',kind:'restoreAccess'}]});s.setJob(payload(.18,'restoreAccess','P9001:160:access'));const a=visualCapture(s);s.setJob(payload(.37,'restoreAccess','P9001:160:access'));const b=visualCapture(s);assert.equal(a.calls.length,2);assert.equal(a.calls[0].image,images.waterPort160);assert.deepEqual(a.calls[0].args.slice(0,4),A.CUTS.valveBody[0].rect);assert.deepEqual(a.calls[1].args.slice(0,4),A.CUTS.valveWheel[0].rect);assert.deepEqual(a.calls[0].matrix,b.calls[0].matrix);assert.notDeepEqual(a.calls[1].matrix,b.calls[1].matrix);assert.notEqual(a.digest,b.digest);
});

test('160 context art: completed access and drained basins reflect the saved owner state',()=>{
 const s=scene({kind:'lockGate'}),key='P9001:160:access';s.o=frozen({...s.o,id:'P9001:160:access-gate',completedKey:key});s.plan=frozen({...s.plan,visuals160:[s.o],operations160:[{key:'access',kind:'restoreAccess'}],terrain160:[{id:'P9001:160:basin',kind:'water',x:1,y:1,w:5,h:4,z:0,completedKey:key}]});const closed=visualCapture(s),terrain=()=>{const r=recording(300,240);r.ctx.scale(30,30);assert.equal(A.drawTerrain(r.ctx,s.game,s.p,s.plan,{world:s.world,v:{z:0}}),true);return rasterDigest(r.canvas);},wet=terrain();s.completed.add(key);assert.notEqual(visualCapture(s).digest,closed.digest,'The opened leaf rests beside the now-free access');assert.notEqual(terrain(),wet,'Completed pumping paints the real drained surface');assert.equal(A.pose(s.game,s.p,s.plan,s.o,{world:s.world}).complete,true);
});

test('160 context art: only the occupied volume opens, while other real roofs keep their own source models',()=>{
 const s=scene(),volumes=frozen([{id:'P9001:160:house',x:2,y:2,w:10,h:9,z:0,kind:'building',roofFamily:'house'},{id:'P9001:160:store',x:18,y:3,w:12,h:10,z:0,kind:'building',roofFamily:'grocer'}]),plan=frozen({...s.plan,visuals160:[],volumes160:volumes});const point=G.global(s.p,6,6),v={x:point.x,y:point.y,z:0,inside:s.p.id},entries=A.depthEntries(s.game,s.p,plan,{world:s.world,v});assert.equal(entries.length,1);assert.equal(entries[0].id,volumes[1].id+':roof');assert.equal(A.viewerInside(v,s.p,volumes[0]),true);assert.equal(A.viewerInside(v,s.p,volumes[1]),false);const r=recording(600,460);r.ctx.translate(300,220);r.ctx.scale(10,10);r.ctx.translate(-s.p.x,-s.p.y);const before=r.ctx.getTransform().toJSON();entries[0].draw(r.ctx);assert.deepEqual(r.ctx.getTransform().toJSON(),before);const expected=I.spriteForRoof({id:volumes[1].id,type:'grocer'},{seed:s.world.seed});assert.equal(r.calls.length,1);assert.equal(r.calls[0].image,images[expected.atlas]);assert.deepEqual(r.calls[0].args.slice(0,4),expected.rect);assert.equal(A.depthEntries(s.game,s.p,plan,{world:s.world,v:{...v,x:s.p.x+200,y:s.p.y+200}}).length,2,'Being inside the parent POI never opens the whole district');assert.equal(A.viewerInside({...v,z:1},s.p,volumes[0]),false);
});

test('160 context art: viewer containment follows rotated physical volumes and rejects another level',()=>{
 const p={id:'P9001',x:90,y:110,w:50,h:40,a:Math.PI*.37},volume={id:'room',x:3,y:4,w:9,h:8,z:1};for(const local of[{x:5,y:6,expected:true},{x:20,y:6,expected:false},{x:5,y:20,expected:false}]){const point=G.global(p,local.x,local.y);assert.equal(A.viewerInside({...point,z:1,inside:p.id},p,volume),local.expected);assert.equal(A.viewerInside({...point,z:0,inside:p.id},p,volume),false);}
});

test('160 context art: road annuli preserve their physical center hole and render both directions',()=>{
 const s=scene(),plan=frozen({...s.plan,terrain160:[{id:'roundabout',kind:'road',shape:'annulus',x:2,y:2,w:12,h:10,innerRx:3.8,innerRy:2.8,z:0}],visuals160:[]});const r=recording(520,430);r.ctx.scale(30,30);const before=r.ctx.getTransform().toJSON();assert.equal(A.drawTerrain(r.ctx,s.game,s.p,plan,{world:s.world,v:{z:0}}),true);assert.deepEqual(r.ctx.getTransform().toJSON(),before);const data=pixels(r.canvas),alpha=(x,y)=>data[(y*r.canvas.width+x)*4+3];assert.equal(alpha(240,210),0,'Road painting never fills the reserved central island');assert.ok(alpha(240,90)>=32);assert.ok(alpha(240,330)>=32);assert.ok(alpha(75,210)>=32);assert.ok(alpha(405,210)>=32);
});

test('160 context art: the roundabout island is an ellipse whose edge meets the road without rectangular corners or gaps',()=>{
 const s=scene(),road=frozen({id:'roundabout',kind:'road',shape:'annulus',x:2,y:2,w:12,h:10,innerRx:3.8,innerRy:2.8,z:0}),island=frozen({id:'island',kind:'bank',shape:'ellipse',x:4.2,y:4.2,w:7.6,h:5.6,z:0,blocked:true,vehicleOnly:true,opaque:false});
 const render=terrain=>{const r=recording(520,430);r.ctx.scale(30,30);const before=r.ctx.getTransform().toJSON();assert.equal(A.drawTerrain(r.ctx,s.game,s.p,{...s.plan,terrain160:terrain},{world:s.world,v:{z:0}}),true);assert.deepEqual(r.ctx.getTransform().toJSON(),before);const data=pixels(r.canvas);return(x,y)=>data[(y*r.canvas.width+x)*4+3];};
 const bankAlpha=render([island]);assert.ok(bankAlpha(240,210)>=200,'The actual island center is painted');
 for(const[x,y]of[[129,129],[351,129],[129,291],[351,291]])assert.equal(bankAlpha(x,y),0,'Ellipse corners never paint the old rectangular blocker');
 const combined=render([road,island]);for(let x=75;x<=405;x++)assert.ok(combined(x,210)>=32,'Horizontal road/island join has no transparent gap at '+x);for(let y=75;y<=345;y++)assert.ok(combined(240,y)>=32,'Vertical road/island join has no transparent gap at '+y);
 for(const[x,y]of[[129,129],[351,129],[129,291],[351,291]])assert.ok(combined(x,y)>=32,'The road stays continuous outside the elliptical island');
});

test('160 context art: cold rail signals and tunnel portals retain their real silhouette instead of a full fallback rectangle',()=>{
 const s=scene(),requested=[];s.game.art={images:{},ensure:key=>{requested.push(key);return Promise.resolve(false);}};
 for(const kind of['railSignal','tunnelPortal']){const r=recording(160,150),o=frozen({id:'cold:'+kind,kind,x:20,y:20,w:80,h:100,z:0});assert.equal(A.drawVisual(r.ctx,s.game,s.p,{...s.plan,operations160:[]},o,{world:s.world}),true);assert.equal(r.calls.length,0);const data=pixels(r.canvas),alpha=(x,y)=>data[(y*r.canvas.width+x)*4+3];assert.ok(alpha(60,30)>=200,'Visible upper structural part');assert.equal(alpha(kind==='railSignal'?25:60,110),0,kind+' retains its open space');}
 assert.ok(requested.length>=2&&requested.every(key=>key==='civilRail160'));
});

test('160 context art: cold, failed and legacy scenes keep truthful bounded fallback ownership',()=>{
 const requested=[],s=scene(),r=recording(420,340);s.game.art={images:{},ensure:key=>{requested.push(key);return Promise.resolve(false);}};r.ctx.scale(18,18);assert.equal(A.drawVisual(r.ctx,s.game,s.p,s.plan,s.o,{world:s.world}),true);assert.ok(requested.length>=1);assert.ok(requested.every(k=>k==='waterPort160'));assert.equal(r.calls.length,0,'Fallback never pretends that a PNG was blitted');assert.ok(pixels(r.canvas).some((v,i)=>i%4===3&&v>=32));
 requested.length=0;assert.equal(A.drawTerrain(r.ctx,s.game,{...s.p,context160:undefined},s.plan,{world:s.world}),false);assert.deepEqual(A.depthEntries(s.game,{...s.p,context160:undefined},s.plan,{world:s.world}),[]);assert.equal(requested.length,0,'Legacy scenes never request optional atlases');assert.equal(A.drawSprite(r.ctx,s.game.art,{kind:'pumpBase',x:0,y:0,w:NaN,h:1}),false);assert.equal(A.measure('unknown',s.o),null);
});

test('160 context art: offscreen and other-floor components do not load or draw optional images',()=>{
 const s=scene(),requested=[];s.game.art={images:{},ensure:key=>{requested.push(key);return Promise.resolve(false);}};assert.deepEqual(A.depthEntries(s.game,s.p,s.plan,{world:s.world,v:{z:0},view:{l:1000,r:1020,t:1000,b:1020}}),[]);assert.deepEqual(A.depthEntries(s.game,s.p,s.plan,{world:s.world,v:{z:1}}),[]);const r=recording(),plan=frozen({...s.plan,terrain160:[{id:'rail',kind:'rail',x:0,y:0,w:20,h:1.5,z:0}]});assert.equal(A.drawTerrain(r.ctx,s.game,s.p,plan,{world:s.world,v:{z:1}}),false);assert.equal(requested.length,0);assert.equal(r.calls.length,0);
});
