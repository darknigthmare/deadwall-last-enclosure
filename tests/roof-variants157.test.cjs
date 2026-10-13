'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/interior-art153.js'),G=require('../src/frontier-geometry.js'),E=require('../src/exploration-125.js');
const Codex=require('../src/codex3000-runtime.js');
const root=path.resolve(__dirname,'..');let ready;
async function artwork(){
 if(!ready)ready=Promise.all(Object.entries(A.ASSETS).map(async([id,spec])=>[id,await loadImage(path.join(root,spec.url))])).then(Object.fromEntries);
 const images=await ready;return{images,blit(c,atlas,rect,...destination){c.drawImage(images[atlas],...rect,...destination);return true;}};
}
function withoutRandom(run){const previous=Math.random;Math.random=()=>assert.fail('Roof presentation consumed RNG');try{return run();}finally{Math.random=previous;}}
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
function alphaBounds(c){const{data,width,height}=c.getImageData(0,0,c.canvas.width,c.canvas.height);let l=width,t=height,r=-1,b=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return{l,t,r,b};}

test('157 roofs retain historical cuts and add four different models to twelve compatible families',()=>{
 const families=['cottage','farm','rowhouse','collective','hotel','industrial','workshop','retail','civic','school','clinic','service'];
 assert.equal(A.ROOF_MODELS157.length,16);assert.equal(new Set(A.ROOF_MODELS157).size,16);
 for(const family of families){const choices=A.ROOFS[family];assert.equal(choices.length,6,family);assert.ok(choices.slice(0,2).every(s=>s.atlas!=='habitatRoofs157'));assert.ok(choices.slice(2).every(s=>s.atlas==='habitatRoofs157'));assert.equal(new Set(choices.slice(2).map(s=>s.model)).size,4);assert.deepEqual(choices.map(s=>s.variant),[0,1,2,3,4,5]);}
 for(const family of['chapel','greenhouse','underground','ruin'])assert.equal(A.ROOFS[family].length,2,'specific architecture '+family);
 for(const type of['house','duplex','basementHouse','cottageSmall','bungalow','familyHouse','villa','duplexWide'])assert.equal(A.roofChoices(type).length,6,type);
 const cabin=A.roofChoices('cabin');assert.equal(cabin.length,4);assert.ok(!cabin.some(s=>['slate-mansard','terracotta-dormer'].includes(s.model)),'a small cabin does not borrow a villa mansard or dormer');
});

test('157 alpha-measured source cuts include each complete silhouette and remain inside isolated cells',async()=>{
 const art=await artwork(),image=art.images.habitatRoofs157,canvas=createCanvas(image.width,image.height),c=canvas.getContext('2d');c.drawImage(image,0,0);
 assert.equal(image.width,1536);assert.equal(image.height,1024);const data=c.getImageData(0,0,1536,1024).data,unique=new Set();
 for(const[cell,rect]of A.ROOF_CUTS157.entries()){
  const sx=cell%4*384,sy=Math.floor(cell/4)*256,[x,y,w,h]=rect;assert.ok(x>sx&&y>sy&&x+w<sx+384&&y+h<sy+256,'transparent margins '+cell);
  let visible=0;for(let dy=0;dy<256;dy++)for(let dx=0;dx<384;dx++)if(data[((sy+dy)*1536+sx+dx)*4+3]>8){visible++;assert.ok(sx+dx>=x&&sx+dx<x+w&&sy+dy>=y&&sy+dy<y+h,'all visible silhouette pixels included '+cell);}
  assert.ok(visible>15000,'nonempty roof '+cell);unique.add(sha(c.getImageData(x,y,w,h).data));
 }
 assert.equal(unique.size,16,'the atlas contains sixteen different images');
});

test('157 morphology is reachable and stays stable under movement, rotation, camera, generation and save roundtrips',()=>{
 const object={id:'house:stable',type:'house',x:20,y:30,w:18,h:14,variant:3,amount:17},before=JSON.stringify(object),first=withoutRandom(()=>A.spriteForRoof(object,{seed:903145}));
 assert.strictEqual(A.spriteForRoof(JSON.parse(before),{seed:903145}),first,'save roundtrip');
 for(const generation of[1,2,3,4,5,6,7])for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5])assert.strictEqual(withoutRandom(()=>A.spriteForRoof({...object,x:320,y:-30,a,generation,camera:{x:10,y:20,zoom:2},amount:0},{seed:903145,floor:2})),first);
 object.x+=100;object.y-=80;object.variant=99;object.amount=0;assert.strictEqual(A.spriteForRoof(object,{seed:903145}),first,'live state does not invalidate a persistent identity');
 for(const type of['house','cabin','apartments','warehouse','clinic']){
  const choices=A.roofChoices(type),seen=new Set();for(let seed=0;seed<256;seed++){const value=Object.freeze({id:'repeat:'+type,type,x:10,y:12});const sprite=withoutRandom(()=>A.spriteForRoof(value,{seed}));assert.strictEqual(A.spriteForRoof({...value},{seed}),sprite);seen.add(sprite);}
  assert.equal(seen.size,choices.length,type+' all models reached');
  for(let index=0;index<choices.length;index++)assert.strictEqual(A.spriteForRoof({type},{variant:index}),choices[index]);
  assert.strictEqual(A.spriteForRoof({type},{variant:-1}),choices.at(-1));assert.strictEqual(A.spriteForRoof({type},{variant:choices.length}),choices[0]);
 }
 const cloned=JSON.parse(before);withoutRandom(()=>A.spriteForRoof(cloned,{seed:903145}));assert.equal(JSON.stringify(cloned),before,'painting selection adds no saved field');
 assert.notEqual(A.hash(1,23),A.hash(12,3),'typed key parts cannot concatenate ambiguously');
});

test('157 regional and local roof owners reach new frames on the same pure seed and identity',async()=>{
 const art=await artwork(),calls=[],blit=art.blit;art.blit=(...args)=>{calls.push({atlas:args[1],source:args[2],matrix:args[0].getTransform().toJSON()});return blit(...args);};
 const game={world:{seed:17117},art,worldEvolution:{structureDestroyed:()=>false},random:{next(){assert.fail('Simulation RNG used by a roof');}}},sandbox={DeadwallFrontierGeometry:G,DeadwallInteriorArt153:A,DEADWALL:game};
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/frontier-art.js'),'utf8'),sandbox,{filename:'frontier-art.js'});
 const previous={owner:globalThis.DEADWALL,interior:globalThis.DeadwallInteriorArt153};globalThis.DEADWALL=game;globalThis.DeadwallInteriorArt153=A;
 try{for(const generation of[1,2,3,4,5,6,7]){
  let id;for(let index=0;index<256;index++){const candidate='shared-roof:'+index;if(A.spriteForRoof({id:candidate,type:'bungalow'},{seed:17117}).atlas==='habitatRoofs157'){id=candidate;break;}}assert.ok(id);
  const place={...G.BY.bungalow,id,type:'bungalow',x:20,y:20,w:14,h:10,a:Math.PI/2,generation,outdoor:[],parking:[]},view={world:{seed:17117,plan:(p,z)=>G.plan(p,z)},inside:null,z:0,taken:{}},before=JSON.stringify(place),c=createCanvas(700,700).getContext('2d');c.scale(10,10);
  const closed=sandbox.DeadwallFrontierArt.lotEntries(game,place,view);assert.equal(closed.length,1);assert.equal(closed[0].kind,'roof');withoutRandom(()=>closed[0].draw(c));const regional=calls.at(-1);assert.equal(regional.atlas,'habitatRoofs157');assert.ok(Math.abs(regional.matrix.a)<1e-8&&Math.abs(regional.matrix.b-10)<1e-8,'owner rotation remains');
  const local={...place,kind:'bungalow',x:200,y:180,w:180,h:120};withoutRandom(()=>E.drawBuildingShell134(createCanvas(500,400).getContext('2d'),local,true));const localCall=calls.at(-1);assert.equal(localCall.atlas,'habitatRoofs157');assert.deepEqual(localCall.source,regional.source,'local and regional owners select the same family morphology');
  const entered=sandbox.DeadwallFrontierArt.lotEntries(game,place,{...view,inside:id});assert.ok(entered.some(entry=>entry.kind==='furniture'));assert.ok(!entered.some(entry=>entry.kind==='roof'),'entering shows the physical floor instead of an opaque roof');assert.equal(JSON.stringify(place),before);
 }}finally{globalThis.DEADWALL=previous.owner;globalThis.DeadwallInteriorArt153=previous.interior;}
});

test('157 every added roof stays clipped to its owner rectangle at four rotations and preserves canvas state',async()=>{
 const art=await artwork();for(const type of['house','farmhouse','rowhouse','apartments','hotel','warehouse','garage','clinic','school','townhall','market','fuel'])for(let variant=2;variant<6;variant++)for(let rotation=0;rotation<4;rotation++){
  const canvas=createCanvas(320,320),c=canvas.getContext('2d');c.translate(160,160);c.rotate(rotation*Math.PI/2);c.globalAlpha=.7;const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha,rect={x:-80,y:-50,w:160,h:100};
  assert.equal(withoutRandom(()=>A.drawRoof(c,art,{id:type,type,w:18,h:14},rect,{variant})),true);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);const bounds=alphaBounds(c),halfW=rotation%2?50:80,halfH=rotation%2?80:50;
  assert.ok(bounds.r>bounds.l&&bounds.b>bounds.t);assert.ok(bounds.l>=160-halfW&&bounds.r<160+halfW&&bounds.t>=160-halfH&&bounds.b<160+halfH,type+' '+variant+' '+rotation);
 }
 const c=createCanvas(100,100).getContext('2d'),before=sha(c.getImageData(0,0,100,100).data);assert.equal(A.drawRoof(c,{images:{}},{type:'house'},{x:0,y:0,w:50,h:30},{variant:5}),false);assert.equal(sha(c.getImageData(0,0,100,100).data),before,'failed image returns to the existing painter without modifying canvas');
});

test('157 all 2700 renderable Codex presets use compatible roofs without changing legacy or special architecture',()=>{
 let count=0;const families=new Set();for(const card of Codex.records.filter(card=>Number(card.id.slice(3))<=3000)){const type='codex3000-'+card.id.slice(3),preset=Codex.preset(type);if(!preset){assert.equal(A.roofFamily(type),null);continue;}
  count++;families.add(preset.family);const item={...preset,type,id:'programme:'+card.id},saved=JSON.stringify(item),choices=A.roofChoices(item);
  assert.ok(A.ROOF_FAMILIES.includes(A.roofFamily(item)),type);assert.ok(choices.length>=2,type);
  const frame=withoutRandom(()=>A.spriteForRoof(item,{seed:17117}));assert.ok(choices.includes(frame));assert.equal(JSON.stringify(item),saved);
  assert.strictEqual(A.spriteForRoof({...item,x:900,y:-900,a:Math.PI,generation:8,powered:false},{seed:17117}),frame);
  assert.strictEqual(A.roofChoices({...item,kind:type},{local:true}),choices);
 }
 assert.equal(count,2700);assert.equal(families.size,28);
 for(const[id,family]of Object.entries({'0001':'cottage','0021':'collective','0121':'clinic','0141':'school','0201':'underground','0301':'industrial','0525':'school','0527':'clinic','0534':'cottage','0541':'underground','0481':'ruin'}))assert.equal(A.roofFamily('codex3000-'+id),family,id);
 assert.equal(A.roofChoices('codex3000-0534').length,4,'forest cabin excludes villa dormers');
 assert.equal(A.roofChoices('codex3000-0201').length,2,'shelter keeps its underground covers');
 assert.equal(A.roofFamily('codex3000-9999'),null);assert.equal(A.roofFamily('constructor'),null);
});

test('157 actual Codex plans reach the regional and local roof cuts then uncover their finite interior on entry',async()=>{
 const art=await artwork(),calls=[],blit=art.blit;art.blit=(...args)=>{calls.push({atlas:args[1],source:args[2]});return blit(...args);};
 const game={world:{seed:17117},art,worldEvolution:{structureDestroyed:()=>false}},sandbox={DeadwallFrontierGeometry:G,DeadwallInteriorArt153:A,DEADWALL:game};vm.runInNewContext(fs.readFileSync(path.join(root,'src/frontier-art.js'),'utf8'),sandbox);
 const previous={owner:globalThis.DEADWALL,interior:globalThis.DeadwallInteriorArt153};globalThis.DEADWALL=game;globalThis.DeadwallInteriorArt153=A;
 try{for(const suffix of['0001','0021','0121','0141','0201','0301','0534']){
  const type='codex3000-'+suffix,preset=Codex.preset(type);let id;
  for(let i=0;i<256;i++){const candidate='g8:'+i,frame=A.spriteForRoof({type,id:candidate},{seed:17117});if(frame.atlas==='habitatRoofs157'||A.roofChoices(type).length===2){id=candidate;break;}}
  assert.ok(id);const p={...preset,type,id,x:50,y:50,a:Math.PI/2,generation:8,programme3000:preset.codex,outdoor:[],parking:[]},saved=JSON.stringify(p),view={world:{seed:17117,plan:(place,z)=>Codex.floor(place.programme3000,17117,z,place.id)},inside:null,z:0,taken:{}},c=createCanvas(600,600).getContext('2d');c.scale(5,5);
  const closed=sandbox.DeadwallFrontierArt.lotEntries(game,p,view);assert.equal(closed.length,1);assert.equal(closed[0].kind,'roof');withoutRandom(()=>closed[0].draw(c));const expected=A.spriteForRoof(p,{seed:17117}),regional=calls.at(-1);assert.equal(regional.atlas,expected.atlas);assert.deepEqual(regional.source,expected.rect);
  const local={...p,kind:type,x:250,y:180,w:180,h:110};withoutRandom(()=>E.drawBuildingShell134(createCanvas(600,500).getContext('2d'),local,true));assert.deepEqual(calls.at(-1),regional);
  const entered=sandbox.DeadwallFrontierArt.lotEntries(game,p,{...view,inside:id});assert.ok(!entered.some(e=>e.kind==='roof'));assert.ok(entered.some(e=>e.kind==='furniture'));assert.equal(JSON.stringify(p),saved);
 }}finally{globalThis.DEADWALL=previous.owner;globalThis.DeadwallInteriorArt153=previous.interior;}
});
