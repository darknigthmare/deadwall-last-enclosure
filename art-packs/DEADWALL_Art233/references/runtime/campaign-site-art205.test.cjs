'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/campaign-site-art205.js'),F=require('../src/codex-furnishings2026.js'),I=require('../src/interior-art153.js'),D=require('../src/seed-detail-art157.js'),P=require('../src/world-props-art153.js'),G=require('../src/frontier-geometry.js'),Context=require('../src/context-art160.js');
const Residential=require('../scripts/codex-residential2026.cjs');
const kinds=Object.keys(F.CATALOGUE),repo=path.resolve(__dirname,'..'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pixels=canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
const cold={images:{}},images={};
test.before(async()=>{
 const sources={...I.ASSETS,...P.ASSETS157};
 for(const[key,spec]of Object.entries(sources))images[key]=await loadImage(path.join(repo,spec.url));
});
function prop(kind,changes={}){const shape=Object.hasOwn(F.CATALOGUE,kind)?F.shape(kind):{w:3,h:1.5};return Object.freeze({id:'campaign205:'+kind,kind,campaign205:true,x:1.25,y:1.5,w:shape.w,h:shape.h,z:0,rotationRad:0,...changes});}
function render(kind,{variant=0,turn=0,art=cold,changes={},record=false,scale=45}={}){
 const base=prop(kind,changes),o=prop(kind,{...changes,w:turn%2?base.h:base.w,h:turn%2?base.w:base.h,rotationRad:turn*Math.PI/2});
 const canvas=createCanvas(400,350),native=canvas.getContext('2d'),calls=[];native.scale(scale,scale);
 const c=record?new Proxy(native,{get(target,key){const value=target[key];return typeof value==='function'?function(...args){if(['fillRect','strokeRect','moveTo','lineTo','ellipse','arc','rotate','translate','scale'].includes(key))calls.push([key,...args]);return value.apply(target,args);}:value;},set(target,key,value){target[key]=value;return true;}}):native;
 const before=JSON.stringify(o),accepted=A.drawProp(c,art,o,{variant,seed:17117,floor:o.z,scale});assert.equal(JSON.stringify(o),before);
 return {canvas,c,o,scale,accepted,data:pixels(canvas),hash:hash(pixels(canvas)),calls};
}
function contained(image){
 const {canvas,data,o,scale}=image,l=Math.floor(o.x*scale+1e-8),t=Math.floor(o.y*scale+1e-8),r=Math.ceil((o.x+o.w)*scale-1e-8),b=Math.ceil((o.y+o.h)*scale-1e-8);let visible=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const alpha=data[(y*canvas.width+x)*4+3];if(x<l||x>=r||y<t||y>=b)assert.equal(alpha,0,o.kind+' paint beyond footprint at '+x+','+y);else if(alpha)visible++;}
 assert.ok(visible>8,o.kind+' has a real visible picture');
}
function frontier(){
 const sandbox={DeadwallFrontierGeometry:G,DeadwallInteriorArt153:I,DeadwallSeedDetailArt157:D,DeadwallContextArt160:Context,DeadwallCampaignSiteArt205:A};
 vm.runInNewContext(fs.readFileSync(path.join(repo,'src/frontier-art.js'),'utf8'),sandbox);return sandbox.DeadwallFrontierArt;
}
test('205 campaign: all58 author furniture kinds route to real campaign painters, including28 newly drawn families',()=>{
 assert.equal(kinds.length,58);assert.equal(A.SPECIALISED_KINDS.length,28);const counts={};
 for(const kind of kinds){const route=A.routeFor(kind);assert.ok(route,kind);counts[route]=(counts[route]||0)+1;}
 assert.deepEqual(counts,{atlas153:23,detail157:7,procedural205:28});
 for(const kind of ['__proto__','constructor','unknown-appliance'])assert.equal(A.routeFor(kind),null);
 assert.equal(A.STRUCTURAL_KINDS.length,7);for(const kind of A.STRUCTURAL_KINDS)assert.equal(A.routeFor(kind),'structural205');
});
test('205 campaign: every structural object and outdoor area in all200 residential source plans has a painter',()=>{
 const structureKinds=new Set(),areaKinds=new Set();for(const type of Residential.TYPES)for(let variant=1;variant<=50;variant++){
  const plan=Residential.build(type,variant);for(const o of plan.structures){structureKinds.add(o.kind);assert.equal(A.routeFor(o.kind),'structural205',type+'/'+variant+'/'+o.kind);}
  for(const area of [...plan.reservedAreas,...plan.outdoorAreas]){areaKinds.add(area.kind);assert.ok(A.AREA_KINDS.includes(area.kind),type+'/'+variant+'/'+area.kind);}
 }assert.equal(structureKinds.size,7);assert.equal(areaKinds.size,9);assert.ok(structureKinds.has('closed-pool'),'Later pool variants are actually included');
});
test('205 campaign: every real furniture kind stays in its metric footprint in four orientations with warm and missing atlases',()=>{
 for(const art of[cold,{images}])for(const kind of kinds)for(const turn of[0,1,2,3]){
  const image=render(kind,{turn,art});assert.equal(image.accepted,true,kind);contained(image);
 }
});
test('205 campaign:28 specialised families each have3 different geometries, not only recoloured pixels',()=>{
 for(const kind of A.SPECIALISED_KINDS){
  const pictures=[0,1,2].map(variant=>render(kind,{variant,record:true,changes:{w:2.4,h:1.6}}));
  assert.equal(new Set(pictures.map(p=>p.hash)).size,3,kind+' distinct visible models');
  assert.equal(new Set(pictures.map(p=>JSON.stringify(p.calls))).size,3,kind+' distinct physical drawing commands');
  for(let variant=0;variant<3;variant++)assert.equal(render(kind,{variant,changes:{w:2.4,h:1.6}}).hash,pictures[variant].hash,kind+' reproducible');
 }
});
test('205 campaign: the narrow bunk pillow remains at the short sleeping end after every quarter turn',()=>{
 function brightness(image,side){const {o,scale,data,canvas}=image;let sum=0,count=0;for(let y=.20;y<.81;y+=.025)for(let x=.14;x<.86;x+=.025){if(!(side==='west'?x<.31:side==='east'?x>.69:side==='north'?y<.34:y>.66))continue;const px=Math.floor((o.x+o.w*x)*scale),py=Math.floor((o.y+o.h*y)*scale),i=(py*canvas.width+px)*4;sum+=(data[i]+data[i+1]+data[i+2])/3;count++;}return sum/count;}
 for(const [turn,head,foot]of [[0,'west','east'],[1,'north','south'],[2,'east','west'],[3,'south','north']]){const image=render('singleBunk',{turn,variant:0});assert.ok(brightness(image,head)>brightness(image,foot)+6,'Correct pillow end for quarter '+turn);}
});
test('205 campaign:7 compound structural kinds have3 bounded original forms and do not become vehicles or services',()=>{
 for(const kind of A.STRUCTURAL_KINDS){const seen=new Set();for(const variant of[0,1,2])for(const turn of[0,1,2,3]){
  const image=render(kind,{variant,turn,changes:{campaign205Structural:true,w:kind==='fence'?5:3,h:kind==='fence'?.2:1.6}});assert.equal(image.accepted,true);contained(image);if(turn===0)seen.add(image.hash);
 }assert.equal(seen.size,3,kind+' three forms');}
 const normal=render('touring-caravan',{changes:{campaign205Structural:true,w:4,h:2}}),abandoned=render('abandoned-caravan',{changes:{campaign205Structural:true,w:4,h:2}});assert.notEqual(normal.hash,abandoned.hash);
 assert.equal(render('touring-caravan').accepted,false,'Structural admission is explicit');
 const pool=render('closed-pool',{scale:15,changes:{campaign205Structural:true,w:8,h:12}});assert.equal(pool.accepted,true);contained(pool);
});
test('205 campaign: a50m boundary keeps ordinary12cm posts at plausible intervals instead of stretching five huge posts',()=>{
 const canvas=createCanvas(1700,100),c=canvas.getContext('2d');c.scale(32,32);assert.equal(A.drawProp(c,cold,prop('fence',{x:1,y:1,w:50,h:.2,campaign205Structural:true}),{variant:0}),true);const data=pixels(canvas),runs=[];let current=0;
 for(let x=32;x<1633;x++){const alpha=data[(37*canvas.width+x)*4+3];if(alpha>32)current++;else if(current){runs.push(current);current=0;}}if(current)runs.push(current);
 assert.ok(runs.length>=25&&runs.length<=40,'Many individual ordinary posts across50m');assert.ok(Math.max(...runs)<=6,'A post remains below20cm at32px/m');
});
test('205 campaign: warm atlas153 furniture uses its existing original source instead of replacing historical artwork',()=>{
 for(const kind of kinds.filter(k=>A.routeFor(k)==='atlas153')){
  const calls=[],art={images,blit(c,key,source,...destination){calls.push({key,source,destination});c.drawImage(images[key],...source,...destination);return true;}};
  const picture=render(kind,{art});assert.equal(picture.accepted,true);assert.equal(calls.length,1,kind);assert.ok(I.FURNITURE[kind].some(s=>s.atlas===calls[0].key&&JSON.stringify(s.rect)===JSON.stringify(calls[0].source)),kind+' real source');contained(picture);
 }
});
test('205 campaign: pictures preserve immutable props, Canvas state, caller clipping and simulation randomness',()=>{
 const canvas=createCanvas(500,400),c=canvas.getContext('2d');c.translate(13,19);c.scale(35,35);c.globalAlpha=.63;c.fillStyle='#f49a31';c.strokeStyle='#abcdef';c.lineWidth=.13;c.setLineDash([.12,.08]);c.shadowColor='#678934';c.shadowBlur=3;c.shadowOffsetX=2;c.shadowOffsetY=1;c.filter='contrast(1.1)';
 const state=()=>({transform:c.getTransform().toJSON(),fill:c.fillStyle,stroke:c.strokeStyle,width:c.lineWidth,alpha:c.globalAlpha,dash:c.getLineDash(),shadow:c.shadowColor,blur:c.shadowBlur,dx:c.shadowOffsetX,dy:c.shadowOffsetY,filter:c.filter});const before=state(),random=Math.random;
 Math.random=()=>assert.fail('Painting consumed ambient random');try{for(const kind of kinds){const o=prop(kind);assert.equal(A.drawProp(c,{images},o,{seed:42,floor:0}),true);assert.deepEqual(state(),before,kind);assert.deepEqual(o,prop(kind));}}finally{Math.random=random;}
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.shadowBlur=0;c.shadowOffsetX=c.shadowOffsetY=0;c.filter='none';c.clearRect(0,0,500,400);c.fillRect(0,0,500,400);assert.equal([...pixels(canvas)].filter((v,i)=>i%4===3&&v===255).length,500*400,'Object clipping never leaks into the next draw');
});
test('205 campaign: finite exhaustion fades once and never creates stock or a running machine state',()=>{
 const o=prop('milkVat',{amount:12}),before=JSON.stringify(o);function opacity(taken,stateAlpha=true){const canvas=createCanvas(220,190),c=canvas.getContext('2d');c.scale(45,45);assert.equal(A.drawProp(c,cold,o,{seed:42,taken,stateAlpha}),true);const data=pixels(canvas);return{sum:[...data].filter((v,i)=>i%4===3).reduce((a,b)=>a+b,0),hash:hash(data)};}
 // Overlapping vector parts accumulate their opacity; an atlas-wide alpha
 // ratio is not an appropriate oracle for a multi-part procedural object.
 const full=opacity(0),empty=opacity(12);assert.ok(empty.sum>full.sum*.5&&empty.sum<full.sum);assert.deepEqual(opacity(12,false),full);assert.equal(JSON.stringify(o),before);
 const canvas=createCanvas(220,190),c=canvas.getContext('2d');c.scale(45,45);frontier().object(c,o,12,0,{game:{art:cold,world:{seed:42}},seed:42,floor:0});assert.equal(hash(pixels(canvas)),empty.hash,'The real frontier path does not apply the finite-state fade a second time');
 const first=render('conveyor',{changes:{elapsed:10,powered:false}}),later=render('conveyor',{changes:{elapsed:900,powered:false}});assert.equal(first.hash,later.hash,'Elapsed time alone never animates a disconnected appliance');
});
test('205 campaign: seed, stable identity and floor select all3 forms without materializing game state',()=>{
 const o=prop('loom'),seen=new Set();for(let seed=0;seed<40;seed++){const v=A.variantFor(o,{seed,floor:0});seen.add(v);assert.equal(v,A.variantFor({...o},{seed,floor:0}));}assert.equal(seen.size,3);
 assert.equal(A.variantFor(o,{variant:-1}),2);assert.equal(A.variantFor(o,{variant:4}),1);assert.equal(A.variantFor(o,{count:0}),0);
 assert.ok(Array.from({length:40},(_,floor)=>A.variantFor(o,{seed:4,floor})).some(v=>v!==A.variantFor(o,{seed:4,floor:0})));
});
test('205 campaign: unversioned, malformed or unknown objects leave pixels and Canvas state untouched',()=>{
 const canvas=createCanvas(80,80),c=canvas.getContext('2d');c.fillStyle='#385546';c.fillRect(0,0,80,80);const before=hash(pixels(canvas)),o=prop('singleBunk',{x:10,y:10,w:20,h:30});
 for(const changes of[{campaign205:false},{campaign205:1},{id:''},{id:3},{kind:'constructor'},{kind:'future-kind'},{w:0},{h:-1},{x:NaN},{y:Infinity},{rotationRad:.3},{rotationRad:1e100},{x:Number.MAX_VALUE,w:Number.MAX_VALUE}]){assert.equal(A.drawProp(c,cold,{...o,...changes}),false);assert.equal(hash(pixels(canvas)),before);}
 for(const options of[{scale:0},{scale:NaN},{scale:Infinity},{scale:Number.MAX_VALUE},{variant:1.4}])assert.equal(A.drawProp(c,cold,o,options),false);
 assert.equal(A.drawProp(null,cold,o),false);assert.equal(A.drawProp({},cold,o),false);assert.equal(A.drawProp(c,cold,null),false);assert.equal(hash(pixels(canvas)),before);
});
test('205 campaign: the existing G1–G10 object path retains its captured1.71 pixels exactly',()=>{
 const art=frontier(),game={art:cold,world:{seed:42}},expected={bed:'9d66c7d0097920fcd50098901febe1c80c6586a8864ae088df0c4cda77a9943a',shelf:'4ab70e16e3aaaba8e5273675ff3a7b35571ce88ff1b94b99ed09ed977246a94e',medical:'a341c6397a9e01e3db8ff67131fe4b931be03bcf9ad9f55160cf62039751263d',generator:'7f0f2b5d75591cb47ad4d6e5899d297edae9902f2163e2d91acd88e7df93bb07',desk:'d759ce5df205a8ce7068815eec355db3f2a6db6d9db65c185bef3ac8ba965b5b','future-kind':'aedb5c93969bb03462ec3dd43a9ad7aeb4f465ee0d54ceb7e31c7a01c84fa177'};
 for(const[kind,wanted]of Object.entries(expected)){const canvas=createCanvas(240,200),c=canvas.getContext('2d');c.scale(45,45);art.object(c,{id:'legacy:'+kind,kind,x:1,y:1,w:2,h:1.4,amount:12},0,.31,{game,seed:42,floor:0});assert.equal(hash(pixels(canvas)),wanted,kind);}
});
function compound(){
 const campaign205=Object.freeze({version:1,typology:'EXT-MONDE-T045',variant:1,authorPlanId:'EXT-MONDE-T045-V01'}),poi=Object.freeze({id:'P205',x:100,y:100,w:34,h:22,a:0,levels:[0],campaign205,outdoor:[],parking:[]}),volumes=[{id:'P205:205:building:a',x:3,y:4,w:8,h:8,z:0,roofFamily:'cottage'},{id:'P205:205:building:b',x:21,y:5,w:9,h:10,z:0,roofFamily:'service'}];
 const plan=Object.freeze({campaign205,z:0,rooms:volumes.map((o,i)=>({...o,id:'room:'+i,name:'room'+i})),walls:[],objects:[prop('crate',{id:'P205:0:0',x:5,y:6,w:1,h:1,amount:12})],stairs:[],terrain160:[],visuals160:[],volumes160:volumes});
 const details={interior:[prop('singleBunk',{x:7,y:7,w:2,h:.75})],outdoor:[prop('touring-caravan',{campaign205Structural:true,x:14,y:14,w:4,h:2})]},world={seed:17117,plan:()=>plan,detailAt:()=>details,nearPOI:()=>[poi]},game={art:cold,world,settings:{reducedMotion:false}},v={world,z:0,x:0,y:0,inside:poi.id,taken:{},scale:20};return {poi,plan,details,world,game,v};
}
test('205 campaign: the real frontier queue paints compounds with individual roofs and leaves the space between buildings open',()=>{
 const f=frontier(),s=compound(),before=JSON.stringify(s.poi),outside=f.lotEntries(s.game,s.poi,s.v),roofs=outside.filter(x=>x.kind==='context-roof160');assert.equal(roofs.length,2);assert.equal(outside.some(x=>x.kind==='roof'),false,'No single parcel-sized roof');
 const canvas=createCanvas(900,700),c=canvas.getContext('2d');c.translate(400,300);c.scale(20,20);c.translate(-s.poi.x,-s.poi.y);const matrix=c.getTransform().toJSON();for(const entry of roofs)entry.draw(c);assert.deepEqual(c.getTransform().toJSON(),matrix);
 const local=(x,y)=>({x:400+(x-s.poi.w/2)*20,y:300+(y-s.poi.h/2)*20}),gap=local(16,8),data=pixels(canvas);assert.equal(data[(Math.round(gap.y)*canvas.width+Math.round(gap.x))*4+3],0,'The open garden lane has no roof');
 const insidePoint=G.global(s.poi,7,7),inside=f.lotEntries(s.game,s.poi,{...s.v,...insidePoint});assert.equal(inside.filter(x=>x.kind==='context-roof160').length,1,'Entering one building opens only that building');
 assert.equal(JSON.stringify(s.poi),before);assert.equal(s.poi.context160,undefined,'The visual adapter does not mutate the historical context registry');
 for(const entry of outside.filter(x=>['furniture','detail','detail-yard'].includes(x.kind)))entry.draw(c);
});
test('205 campaign: actor occlusion uses the same rotated building volume as its roof',()=>{
 const f=frontier(),s=compound(),poi={...s.poi,a:Math.PI*.37};s.world.nearPOI=()=>[poi];const target=G.global(poi,7,7),other=G.global(poi,24,9),outside=G.global(poi,16,18);
 assert.equal(f.visiblePoint(s.game,{...target,z:0,inside:poi.id},{...s.v,...outside}),false);
 assert.equal(f.visiblePoint(s.game,{...target,z:0,inside:poi.id},{...s.v,...target}),true);
 assert.equal(f.visiblePoint(s.game,{...target,z:0,inside:poi.id},{...s.v,...other}),false,'Another building in the same park does not reveal actors');
});
test('205 campaign: compound floors follow each declared building family and never cover the whole garden parcel',()=>{
 const f=frontier(),s=compound(),canvas=createCanvas(900,700),c=canvas.getContext('2d');c.translate(400,300);c.scale(20,20);c.translate(-s.poi.x,-s.poi.y);f.lotFloor(c,s.poi,s.v,s.game);const data=pixels(canvas),at=(x,y)=>{const global=G.global(s.poi,x,y),px=Math.round(400+(global.x-s.poi.x)*20),py=Math.round(300+(global.y-s.poi.y)*20);return [...data.subarray((py*canvas.width+px)*4,(py*canvas.width+px)*4+4)];};assert.equal(at(16,8)[3],0);assert.notDeepEqual(at(7,7),at(25,9),'Residential wood and service tile retain distinct floor materials');assert.ok(at(7,7)[3]>200&&at(25,9)[3]>200);
 assert.equal(A.drawRoomFloor(c,cold,{...s.poi,campaign205:undefined},s.plan,s.plan.rooms[0]),false);
 assert.equal(I.floorFamily({type:A.roofTypeFor('cabin')}),'wood');assert.equal(I.floorFamily({type:A.roofTypeFor('warehouse')}),'concrete');
});
test('205 campaign: declared gardens, terraces and empty parking have bounded, reproducible physical surfaces without stock',()=>{
 const poi={campaign205:{version:1}},canvas=createCanvas(340,240),c=canvas.getContext('2d');c.scale(40,40);c.fillStyle='#fa34ed';c.strokeStyle='#81edfa';c.globalAlpha=.7;c.shadowBlur=3;const state=()=>({fill:c.fillStyle,stroke:c.strokeStyle,alpha:c.globalAlpha,blur:c.shadowBlur,matrix:c.getTransform().toJSON()}),before=state(),oldRandom=Math.random;Math.random=()=>assert.fail('A garden picture consumed random state');
 try{for(const kind of A.AREA_KINDS){const area=Object.freeze({id:'area205:'+kind,kind,x:1.25,y:1.5,w:3.2,h:2.4,level:0}),plan=Object.freeze({campaign205:{version:1},areas205:[area]}),text=JSON.stringify(plan);c.clearRect(0,0,8,6);assert.equal(A.drawAreas(c,poi,plan,{seed:42}),true);contained({canvas,data:pixels(canvas),o:area,scale:40});const first=hash(pixels(canvas));c.clearRect(0,0,8,6);assert.equal(A.drawAreas(c,poi,plan,{seed:42}),true);assert.equal(hash(pixels(canvas)),first);assert.equal(JSON.stringify(plan),text);assert.deepEqual(state(),before);}}
 finally{Math.random=oldRandom;}
 c.clearRect(0,0,8,6);assert.equal(A.drawAreas(c,{}, {campaign205:{},areas205:[]}),false);assert.equal(A.drawAreas(c,poi,{campaign205:{},areas205:[{id:'unknown',kind:'future-water-supply',x:1,y:1,w:2,h:2}]}),false);assert.equal(pixels(canvas).some((v,i)=>i%4===3&&v),false);
});
test('205 campaign: destroyed compound buildings lose their roofs in the same presentation as their physical walls',()=>{
 const f=frontier(),s=compound(),before=JSON.stringify(s.plan);s.game.worldEvolution={structureDestroyed:id=>id===s.poi.id};const entries=f.lotEntries(s.game,s.poi,s.v);assert.equal(entries.some(e=>e.kind==='context-roof160'||e.kind==='roof'||e.kind==='wall'),false);assert.ok(entries.some(e=>e.kind==='furniture'));assert.equal(JSON.stringify(s.plan),before);
 const target=G.global(s.poi,7,7);assert.equal(f.visiblePoint(s.game,{...target,z:0,inside:s.poi.id},s.v),true);
});
test('205 campaign: the UMD painter needs only declared catalogues, not a DOM, game singleton, timer or network',()=>{
 const sandbox={module:{exports:{}},DeadwallCodexFurnishings2026:{CATALOGUE:F.CATALOGUE}};vm.runInNewContext(fs.readFileSync(path.join(repo,'src/campaign-site-art205.js'),'utf8'),sandbox);const canvas=createCanvas(160,160),c=canvas.getContext('2d');c.scale(40,40);assert.equal(sandbox.module.exports.drawProp(c,cold,prop('conveyor',{w:2,h:1})),true);assert.ok(pixels(canvas).some((v,i)=>i%4===3&&v));for(const name of['document','DEADWALL','requestAnimationFrame','fetch'])assert.equal(sandbox[name],undefined);
});
