'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto'),fs=require('node:fs');
const N=require('@napi-rs/canvas'),Art=require('../src/art.js'),Nature=require('../src/nature-art153.js'),Props=require('../src/world-props-art153.js'),Interior=require('../src/interior-art153.js'),Assets=require('../src/assets136.js'),B=require('../src/biomes135.js'),P=require('../src/atlas-projection.js'),Ground=require('../src/ground135.js'),T=require('../src/tactics.js'),Field=require('../src/fieldcraft.js'),C=require('../src/core.js');
const root=path.resolve(__dirname,'..');let ready;
async function nativeArt(){
 if(!ready)ready=(async()=>{const previous={Image:globalThis.Image,document:globalThis.document};
  class LocalImage extends N.Image{set src(value){super.src=path.resolve(root,value);}}
  globalThis.Image=LocalImage;globalThis.document={createElement(kind){assert.equal(kind,'canvas');return N.createCanvas(1,1);}};
  try{const art=Art.create();await art.ready;art.renderCache153=require('../src/render-cache153.js').create({canvas:()=>N.createCanvas(1,1)});return art;}finally{globalThis.Image=previous.Image;globalThis.document=previous.document;}
 })();return ready;
}
const context=()=>N.createCanvas(360,360).getContext('2d');
const pixels=c=>c.getImageData(0,0,c.canvas.width,c.canvas.height).data;
const hash=c=>crypto.createHash('sha256').update(pixels(c)).digest('hex');
function solid(c){const p=pixels(c);let n=0;for(let i=3;i<p.length;i+=4)if(p[i]>8)n++;return n;}
function opaqueBounds(c){const p=pixels(c);let l=Infinity,t=Infinity,r=-Infinity,b=-Infinity;for(let y=0;y<c.canvas.height;y++)for(let x=0;x<c.canvas.width;x++)if(p[(y*c.canvas.width+x)*4+3]>8){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return{l,t,r,b,w:r-l+1,h:b-t+1};}
async function record(art,run){const calls=[],old=art.blit;art.blit=function(c,key,source,...destination){calls.push({key,source,destination,alpha:c.globalAlpha,matrix:c.getTransform().toJSON()});return old.call(this,c,key,source,...destination);};try{return await run(calls);}finally{art.blit=old;}}
function noRandom(run){const old=Math.random;Math.random=()=>assert.fail('A painter consumed randomness.');try{return run();}finally{Math.random=old;}}
const node=(type='wood',extra={})=>({id:51,type,x:170,y:190,radius:24,variant:0,amount:30,maxAmount:60,flash:0,...extra});
const game=(seed=17117,generation=7)=>({world:{seed,rng:new C.Random(seed)},frontier:{position:()=>({generation})},fieldcraft:{rect:Field.rect}});
function familyOf(call,catalogue){return Object.entries(catalogue).find(([,forms])=>forms.some(f=>f.atlas===call.key&&JSON.stringify(f.rect)===JSON.stringify(call.source)))?.[0];}
function campaign(g){const state=g.serialize();delete state.timestamp;return JSON.stringify(state);}
function capture(c,name,metadata={}){const dir=process.env.DEADWALL_NATIVE153_CAPTURE_DIR;if(!dir)return;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,name+'.png'),c.canvas.toBuffer('image/png'));fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify({width:c.canvas.width,height:c.canvas.height,rgbaSha256:hash(c),...metadata},null,2)+'\n');}

test('153 world painters: real Art loader decodes all 91 assets including every botanical, object and interior plate',async()=>{
 const art=await nativeArt();assert.equal(Object.keys(Art.ASSETS).length,91);assert.deepEqual(art.diagnostics.failed,[]);assert.equal(art.diagnostics.ready.length,91);
 for(const catalog of[Nature.ASSETS,Props.ASSETS,Interior.ASSETS])for(const[key,spec]of Object.entries(catalog)){assert.deepEqual(Art.ASSETS[key],spec);assert.ok(art.images[key]);assert.equal(art.images[key].width,spec.width);assert.equal(art.images[key].height,spec.height);}
 assert.deepEqual([...Nature.TREES].sort(),Object.keys(C.BiomeRules135.trees).sort());assert.deepEqual([...Nature.ROCKS].sort(),Object.keys(C.BiomeRules135.rocks).sort());assert.deepEqual([...Nature.DECOR].sort(),[...new Set(C.BiomeRules135.defs.flatMap(d=>Object.keys(d.decor)))].sort());
});
test('153 world painters: isolated real queue callbacks cover a long counter footprint and rotate a native bench around its owner position',async()=>{
 const art=await nativeArt(),{boot131}=require('./helpers/expansions131.cjs'),E=require('../src/exploration-125.js'),previousArt=globalThis.DeadwallArt;globalThis.DeadwallArt={...Art,create:()=>art};
 try{const{g}=boot131({seed:'17117',generation:4});g.art=art;const plan=g.exploration125.plan,view={left:0,top:0,right:C.WORLD_SIZE,bottom:C.WORLD_SIZE},saved=campaign(g),rng=g.random.state;
  const item=plan.stations.flatMap(E.stationFurniture).filter(item=>item.kind==='counter'&&item.w>=100&&item.w/item.h>4).sort((a,b)=>b.w-a.w)[0],bench=plan.decor.find(prop=>prop.kind==='bench');assert.ok(item);assert.ok(bench);
  const entries=g.depthEntries(view),entryFor=owner=>{const found=entries.find(entry=>entry.entity?.__exploration125Draw&&entry.entity.x===owner.x&&entry.entity.y===owner.y);assert.ok(found);return found;},counterEntry=entryFor(item),benchEntry=entryFor(bench);
  function isolated(entry){const c=context();c.translate(180-entry.entity.x,180-entry.entity.y);const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha;noRandom(()=>g.drawBuilding(c,entry.entity));assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);return c;}
  await record(art,calls=>{
   const counter=isolated(counterEntry);assert.equal(familyOf(calls.at(-1),Interior.FURNITURE),'counter','The real callback includes native details on its physical support.');
   for(const side of[-1,1]){const x=Math.round(180+side*(item.w/2-3)),sample=counter.getImageData(x-1,179,3,3).data;for(let i=3;i<sample.length;i+=4)assert.ok(sample[i]>=240,'The occupied counter end stays visibly covered.');}
   const bounds=opaqueBounds(counter);assert.ok(bounds.w>=item.w-2);assert.ok(bounds.h>=item.h-2);capture(counter,'counter-owner-support',{owner:item,bounds});
   const detail=context();detail.translate(180-item.x,180-item.y);assert.equal(Interior.drawFurniture(detail,art,{...item,x:item.x-item.w/2,y:item.y-item.h/2},{seed:g.world.seed,alignLongAxis:true}),true);capture(detail,'counter-proportional-detail-only',{owner:item,bounds:opaqueBounds(detail),scope:'Reference detail pass only; the production owner also paints the physical support.'});
   const originalAngle=bench.angle;try{
    bench.angle=0;calls.length=0;const horizontal=isolated(benchEntry),zero=calls.at(-1);assert.equal(familyOf(zero,Interior.FURNITURE),'bench');assert.ok(Math.abs(zero.matrix.a-1)<1e-6&&Math.abs(zero.matrix.b)<1e-6);const wide=opaqueBounds(horizontal);assert.ok(wide.w>wide.h+8);capture(horizontal,'bench-owner-angle-zero',{owner:{...bench},bounds:wide});
    bench.angle=Math.PI/2;calls.length=0;const vertical=isolated(benchEntry),quarter=calls.at(-1);assert.equal(familyOf(quarter,Interior.FURNITURE),'bench');assert.deepEqual(quarter.source,zero.source,'Rotation keeps the same object morphology.');assert.ok(Math.abs(quarter.matrix.a)<1e-6&&Math.abs(quarter.matrix.b-1)<1e-6&&Math.abs(quarter.matrix.c+1)<1e-6&&Math.abs(quarter.matrix.d)<1e-6);const tall=opaqueBounds(vertical);assert.ok(tall.h>tall.w+8);assert.ok(Math.abs(tall.w-wide.h)<=2&&Math.abs(tall.h-wide.w)<=2);assert.ok(Math.abs(tall.l-(360-wide.b-1))<=2&&Math.abs(tall.t-wide.l)<=2,'Pixels rotate around the authoritative owner position.');assert.notEqual(hash(vertical),hash(horizontal));capture(vertical,'bench-owner-quarter-turn',{owner:{...bench},bounds:tall,scope:'Explicit angle fixture; current generated layout 3 benches use angle zero.'});
   }finally{bench.angle=originalAngle;}
   assert.equal(g.random.state,rng);assert.equal(campaign(g),saved);
  });
 }finally{globalThis.DeadwallArt=previousArt;}
});
test('153 world painters: G7 Art uses the actual regional ecology and authoritative projection, with pure cached species and live quantities',async()=>{
 const art=await nativeArt(),previous={B:globalThis.DeadwallBiomes135,P:globalThis.DeadwallAtlasProjection};let reads=0;
 globalThis.DeadwallBiomes135={...B,pickTree(...a){reads++;return B.pickTree(...a);},pickRock(...a){reads++;return B.pickRock(...a);}};globalThis.DeadwallAtlasProjection=P;
 try{await record(art,calls=>{for(const seed of[0,1,42,903145,0xffffffff])for(const type of['wood','stone']){
  const g=game(seed),n=node(type,{id:seed%997+51}),q=P.toRegion(n.x,n.y,g),species=B[type==='wood'?'pickTree':'pickRock'](seed,q.x,q.y,'local:'+n.id,{generation:7}).species,expected=Nature.select(species,n.id,seed),saved=JSON.stringify({n,world:g.world}),c=context();
  const matrix=c.getTransform().toJSON(),oldReads=reads;noRandom(()=>assert.equal(art.drawNode(c,n,g),true));assert.ok(solid(c)>50);assert.equal(calls.at(-1).key,expected.atlas);assert.deepEqual(calls.at(-1).source,expected.rect);assert.equal(reads,oldReads+1);
  const original=hash(c);c.clearRect(0,0,360,360);noRandom(()=>art.drawNode(c,n,g));assert.equal(hash(c),original);assert.equal(reads,oldReads+1,'The same node does not resample ecology.');assert.equal(JSON.stringify({n,world:g.world}),saved);assert.deepEqual(c.getTransform().toJSON(),matrix);
  n.amount=1;n.radius=31;c.clearRect(0,0,360,360);art.drawNode(c,n,g);assert.equal(reads,oldReads+1);assert.notEqual(hash(c),original,'Remaining reserves and physical size stay live.');assert.ok(Math.abs(calls.at(-1).alpha-.45)<=1/255);
 }
 const g=game(42),n=node(),q=P.toRegion(n.x,n.y,g);art.drawNode(context(),n,g);const before=reads;g.home={x:q.x+1000,y:q.y+500,minX:q.x+936,minY:q.y+436};const moved=P.toRegion(n.x,n.y,g),species=B.pickTree(42,moved.x,moved.y,'local:'+n.id,{generation:7}).species;art.drawNode(context(),n,g);assert.equal(reads,before+1);assert.deepEqual(calls.at(-1).source,Nature.select(species,n.id,42).rect);
 });}finally{globalThis.DeadwallBiomes135=previous.B;globalThis.DeadwallAtlasProjection=previous.P;}
});
test('153 world painters: all historical generations keep real finite nodes while new nature and resource sprites preserve fallback',async()=>{
 const art=await nativeArt();await record(art,calls=>{
  for(let generation=1;generation<=6;generation++)for(const [type,variant,family]of[['wood',0,'oak'],['wood',1,'pine'],['wood',2,'logs'],['stone',0,'limestone'],['scrap',0,'scrap'],['food',3,'supplies'],['fuel',0,'fuel']]){
   const g=game(42,generation),n=node(type,{variant}),saved=JSON.stringify({n,world:g.world}),c=context();noRandom(()=>assert.equal(art.drawNode(c,n,g),true));assert.ok(solid(c)>30);const catalogue=family in Nature.FAMILIES?Nature.FAMILIES:Props.FAMILIES;assert.equal(familyOf(calls.at(-1),catalogue),family);assert.equal(JSON.stringify({n,world:g.world}),saved);
  }
  const n=node('wood',{variant:2}),g=game(42,7),image=art.images[Nature.FAMILIES.logs[0].atlas],key=Nature.FAMILIES.logs[0].atlas;delete art.images[key];try{const c=context();assert.equal(art.drawNode(c,n,g),true);assert.equal(calls.at(-1).key,'props');assert.ok(solid(c)>30);}finally{art.images[key]=image;}
  art.drawNode(context(),n,g);assert.equal(familyOf(calls.at(-1),Nature.FAMILIES),'logs','A late image immediately resumes native rendering.');
 });
});
test('153 world painters: all sixteen recoverable scenery kinds reach native sprites and vehicle cuts fit the actual field collider',async()=>{
 const art=await nativeArt();await record(art,calls=>{for(const[kind,def]of Object.entries(C.SCENERY_DEFS)){
  const n=node(def.resource,{sceneryKind:kind,radius:def.radius,renderSize:def.renderSize,amount:def.amount,maxAmount:def.amount}),g=game(903145),saved=JSON.stringify(n),c=context();c.translate(9,11);c.globalAlpha=.7;const matrix=c.getTransform().toJSON(),alpha=c.globalAlpha;
  assert.equal(art.drawNode(c,n,g),true);const draw=calls.at(-1);assert.equal(familyOf(draw,{...Nature.FAMILIES,...Props.FAMILIES,...Interior.RUINS}),kind,kind+' reaches its native family');assert.ok(solid(c)>30);assert.equal(JSON.stringify(n),saved);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(c.globalAlpha,alpha);
  if(['ambulance','bus','utilityTruck','tanker'].includes(kind)){const rect=Field.rect(n),[x,y,w,h]=draw.destination;assert.ok(x>=rect.l-1e-9&&x+w<=rect.r+1e-9,kind+' width within collider');assert.ok(y>=rect.t-1e-9&&y+h<=rect.b+1e-9,kind+' height within collider');}
 }
 const n=node('scrap',{variant:1}),g=game(42),r=Field.rect(n);art.drawNode(context(),n,g);const[x,y,w,h]=calls.at(-1).destination;assert.ok(x>=r.l-1e-9&&x+w<=r.r+1e-9,'A new sedan preserves the narrower historical vehicle collider.');assert.ok(y>=r.t-1e-9&&y+h<=r.b+1e-9);
 });
});
test('153 world painters: regional ground routes all nine trees, four rock families and eight decor kinds through native images',async()=>{
 const art=await nativeArt(),old=globalThis.DEADWALL;globalThis.DEADWALL={art};try{await record(art,calls=>{
  for(const species of Nature.TREES)for(const near of[false,true]){const t={id:'ground:'+species,x:170,y:190,r:.3,canopy:3,a:.4,kind:'tree',species,amount:15},v={world:{generation:7,seed:42},x:near?170:200,y:190},saved=JSON.stringify(t),c=context();c.scale(20,20);c.translate(-160,-180);const matrix=c.getTransform().toJSON();noRandom(()=>assert.equal(Ground.drawScenery(c,t,v,false),true));assert.equal(familyOf(calls.at(-1),Nature.FAMILIES),species);assert.ok(Math.abs(calls.at(-1).alpha-(near?.32:.97))<=1/255);assert.deepEqual(c.getTransform().toJSON(),matrix);assert.equal(JSON.stringify(t),saved);assert.ok(solid(c)>20);
   Ground.drawScenery(c,t,v,true);assert.equal(familyOf(calls.at(-1),Nature.FAMILIES),'stump');assert.equal(JSON.stringify(t),saved);
  }
  for(const species of Nature.ROCKS){const t={id:'ground:'+species,x:170,y:190,r:.8,a:.5,kind:'rock',species,amount:25},v={world:{generation:7,seed:42}},saved=JSON.stringify(t),c=context();c.scale(35,35);c.translate(-165,-185);noRandom(()=>assert.equal(Ground.drawScenery(c,t,v,false),true));assert.equal(familyOf(calls.at(-1),Nature.FAMILIES),species);Ground.drawScenery(c,t,v,true);assert.equal(familyOf(calls.at(-1),Nature.FAMILIES),'exhaustedRock');assert.equal(JSON.stringify(t),saved);}
  for(const kind of Nature.DECOR){const d={id:'decor:'+kind,kind,x:170,y:190,r:.8,a:.6},saved=JSON.stringify(d),c=context();c.scale(35,35);c.translate(-165,-185);const m=c.getTransform().toJSON();noRandom(()=>Ground.drawDecor(c,d));assert.equal(familyOf(calls.at(-1),Nature.FAMILIES),kind);assert.equal(JSON.stringify(d),saved);assert.deepEqual(c.getTransform().toJSON(),m);assert.ok(solid(c)>10);}
  assert.equal(Ground.drawScenery(context(),{kind:'tree',species:'oak',x:170,y:190},{world:{generation:5}},false),false,'Legacy regions keep their historical owner.');
 });}finally{globalThis.DEADWALL=old;}
});
test('153 world painters: missing regional images use the previous bitmap or procedural painter without moving resources or camera state',async()=>{
 const art=await nativeArt(),images=art.images,old=globalThis.DEADWALL;globalThis.DEADWALL={art};
 try{art.images=Object.fromEntries(Object.entries(images).filter(([key])=>!Object.hasOwn(Nature.ASSETS,key)));await record(art,calls=>{
  const t={id:'fallback',kind:'tree',species:'oak',x:170,y:190,r:.3,canopy:3,a:.4,amount:14},v={world:{generation:7},x:200,y:190},saved=JSON.stringify(t),c=context();c.scale(20,20);c.translate(-160,-180);const m=c.getTransform().toJSON();Ground.drawScenery(c,t,v,false);assert.equal(calls.at(-1).key,Assets.TREE_SPRITES.oak);assert.ok(solid(c)>20);assert.equal(JSON.stringify(t),saved);assert.deepEqual(c.getTransform().toJSON(),m);
  art.images={};const n=calls.length;c.clearRect(0,0,360,360);Ground.drawScenery(c,t,v,false);assert.equal(calls.length,n);assert.ok(solid(c)>20,'The historical vector tree remains visible.');assert.equal(JSON.stringify(t),saved);assert.deepEqual(c.getTransform().toJSON(),m);
 });}finally{art.images=images;globalThis.DEADWALL=old;}
});
test('153 world painters: actual G4 depth queue paints station furniture, road objects, yards and terrain while preserving the saved campaign',async()=>{
 const art=await nativeArt(),{boot131}=require('./helpers/expansions131.cjs'),previousArt=globalThis.DeadwallArt;globalThis.DeadwallArt={...Art,create:()=>art};
 try{const{g}=boot131({seed:'17117',generation:4});assert.equal(g.exploration125.generation,4);g.art=art;const view={left:0,top:0,right:C.WORLD_SIZE,bottom:C.WORLD_SIZE},c=context(),saved=campaign(g),state=g.random.state;
  await record(art,calls=>{const entries=g.depthEntries(view).filter(e=>e.entity?.__exploration125Draw);assert.ok(entries.length>100,'The actual world exposes its physical local features.');
   noRandom(()=>{for(const entry of entries){c.save();c.translate(180-entry.entity.x,180-entry.entity.y);g.drawBuilding(c,entry.entity);c.restore();}g.drawGround(c,view);});
   const keys=new Set(calls.map(x=>x.key));assert.ok(keys.has('worldPropsRoad153'));assert.ok(keys.has('worldPropsYard153'));assert.ok(keys.has('worldPropsOperations153'));assert.ok(calls.some(draw=>familyOf(draw,Interior.FURNITURE)));assert.ok(calls.some(draw=>familyOf(draw,Nature.FAMILIES)));
   const paintedRoad=new Set(calls.map(x=>familyOf(x,Props.FAMILIES)).filter(Boolean));for(const kind of['cone','roadSign','bollard','luggage','pallet','repairKit','tarp','shed','barrel','mailbox','drain','manhole','marker','crack','litter'])assert.ok(paintedRoad.has(kind),kind+' is routed by the real generated-world painter');
   assert.ok(solid(c)>100);assert.equal(g.random.state,state);assert.equal(campaign(g),saved,'Drawing the depth queue and ground performs no transaction.');
   const sources=calls.map(x=>[x.key,x.source]);calls.length=0;noRandom(()=>{for(const entry of entries){c.save();c.translate(180-entry.entity.x,180-entry.entity.y);g.drawBuilding(c,entry.entity);c.restore();}g.drawGround(c,view);});assert.deepEqual(calls.map(x=>[x.key,x.source]),sources,'Unchanged IDs and seed keep all local forms stable.');
   const previous={ctx:g.ctx,width:g.width,height:g.height,dpr:g.dpr,camera:g.camera,createElement:document.createElement};
   try{
    const station=g.exploration125.plan.stations[0],frame=context();g.ctx=frame;g.width=360;g.height=360;g.dpr=1;g.camera={...g.camera,x:station.x,y:station.y,zoom:1,shake:0};
    document.createElement=function(kind,...args){return kind==='canvas'?N.createCanvas(1,1):previous.createElement.call(this,kind,...args);};
    calls.length=0;noRandom(()=>g.render());assert.ok(solid(frame)>1000);assert.ok(calls.some(draw=>familyOf(draw,Interior.FURNITURE)),'A real Game.render frame reaches station furniture through its shared depth queue.');
    assert.equal(g.random.state,state);assert.equal(campaign(g),saved,'A complete rendered frame preserves the campaign and its deterministic generator.');
    const nativeHash=hash(frame),nativeImages=art.images,newKeys=new Set([...Object.keys(Nature.ASSETS),...Object.keys(Props.ASSETS),...Object.keys(Interior.ASSETS)]),proof={seed:g.world.seed,generation:4,layoutRevision:g.exploration125.layoutRevision,camera:g.camera,campaignSha256:crypto.createHash('sha256').update(saved).digest('hex'),rngState:state};
    capture(frame,'g4-game-render-153',{...proof,atlasDraws:calls.map(({key,source})=>({key,source}))});
    try{
     art.images=Object.fromEntries(Object.entries(nativeImages).filter(([key])=>!newKeys.has(key)));calls.length=0;noRandom(()=>g.render());assert.ok(solid(frame)>1000);assert.notEqual(hash(frame),nativeHash,'The complete frame visibly uses the new pictures.');assert.ok(calls.every(draw=>!newKeys.has(draw.key)),'Absent new images use only their established fallback.');assert.equal(g.random.state,state);assert.equal(campaign(g),saved);capture(frame,'g4-game-render-fallback',{...proof,atlasDraws:calls.map(({key,source})=>({key,source}))});
    }finally{art.images=nativeImages;}
   }finally{Object.assign(g,{ctx:previous.ctx,width:previous.width,height:previous.height,dpr:previous.dpr,camera:previous.camera});document.createElement=previous.createElement;}
   for(const revision of[1,2]){
    const archived=g.serialize();archived.exploration125.layoutRevision=revision;g.restoreSave(archived);assert.equal(g.exploration125.layoutRevision,revision);const historical=campaign(g),rng=g.random.state;
    const historicalEntries=g.depthEntries(view).filter(e=>e.entity?.__exploration125Draw);calls.length=0;noRandom(()=>{for(const entry of historicalEntries){c.save();c.translate(180-entry.entity.x,180-entry.entity.y);g.drawBuilding(c,entry.entity);c.restore();}g.drawGround(c,view);});
    const forms=new Set(calls.map(draw=>familyOf(draw,Props.FAMILIES)).filter(Boolean));for(const family of['roadBarrier','tirePile','shoppingCart','cache'])assert.ok(forms.has(family),family+' is rendered from archived layout '+revision);assert.equal(g.random.state,rng);assert.equal(campaign(g),historical,'The renderer preserves an archived physical layout.');
   }
  });
 }finally{globalThis.DeadwallArt=previousArt;}
});
