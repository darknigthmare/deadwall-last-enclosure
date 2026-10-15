'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createRequire}=require('node:module'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const B=require('../src/biomes135.js'),N=require('../src/nature-art153.js'),G=require('../src/frontier-geometry.js'),C=require('../src/core.js');
const repo=path.resolve(__dirname,'..'),source=path.join(repo,'src/context-art160.js');
const freeze=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')freeze(child);return Object.freeze(value);};
function fixture(){
 const trees=[],sandbox={module:{exports:{}},require:createRequire(source),DeadwallBiomes135:B,DeadwallNatureArt153:{...N,drawTree(c,art,tree,options){trees.push({tree,options});return N.drawTree(c,art,tree,options);}}};
 vm.runInNewContext(fs.readFileSync(source,'utf8'),sandbox,{filename:source});return{A:sandbox.module.exports,trees};
}
// The physical seed42/P2912/DW1768 forest obstacle captured from the real G10 plan.
function scene(){
 const p=freeze({id:'P2912',x:5740.883013358456,y:12158.674900222166,a:5.00121037305908,w:78,h:70,context160:{mode:'open'},levels:[0]});
 const o=freeze({id:'P2912:160:tree:0',kind:'tree',x:-8,y:3,w:.5,h:.5,z:0,opaque:true});
 const plan=freeze({z:0,visuals160:[o],terrain160:[],volumes160:[],operations160:[]}),world={seed:42,generation:10};
 return{p,o,plan,world};
}
let images;
test.before(async()=>{images={};for(const key of ['natureTreesBroad153','natureTreesConifer153','natureTreesWet153'])images[key]=await loadImage(path.join(repo,N.ASSETS[key].url));});
function painter(){
 const canvas=createCanvas(260,260),c=canvas.getContext('2d'),calls=[];
 const art={images,blit(ctx,key,rect,...dest){calls.push({key,rect,dest,matrix:ctx.getTransform().toJSON(),alpha:ctx.globalAlpha});ctx.drawImage(images[key],...rect,...dest);return true;}};
 return{canvas,c,art,calls};
}
const alphaAt=(canvas,x,y)=>canvas.getContext('2d').getImageData(x,y,1,1).data[3];

test('163 physical forest: the real Nature tree painter uses seed ecology and original canopy cuts without mutating the native trunk',()=>{
 const {A,trees}=fixture(),s=scene(),r=painter(),before=JSON.stringify(s),point=G.global(s.p,s.o.x+s.o.w/2,s.o.y+s.o.h/2);
 r.c.translate(130,130);r.c.scale(18,18);r.c.translate(-(s.o.x+s.o.w/2),-(s.o.y+s.o.h/2));const matrix=r.c.getTransform().toJSON();
 const random=Math.random,next=C.Random.prototype.next;Math.random=()=>assert.fail('Painting consumed ambient RNG');C.Random.prototype.next=()=>assert.fail('Painting consumed simulation RNG');
 try{assert.equal(A.drawVisual(r.c,{art:r.art},s.p,s.plan,s.o,{world:s.world}),true);}finally{Math.random=random;C.Random.prototype.next=next;}
 assert.equal(trees.length,1,'The actual tree renderer is called, rather than the generic rectangle fallback');
 const {tree,options}=trees[0],ecology=B.pickTree(42,point.x,point.y,s.o.id+':0',{generation:10}),sprite=N.select(ecology.species,s.o.id,42);
 assert.equal(tree.id,s.o.id);assert.equal(tree.species,ecology.species);assert.equal(tree.x,s.o.x+s.o.w/2);assert.equal(tree.y,s.o.y+s.o.h/2);assert.equal(tree.r,.25);
 assert.ok(tree.canopy>=ecology.canopy[0]&&tree.canopy<=ecology.canopy[1],'Canopy metres come from the existing botanical definition');
 assert.equal(options.seed,42);assert.equal(r.calls.length,1);assert.equal(r.calls[0].key,sprite.atlas);assert.deepEqual(r.calls[0].rect,sprite.rect);
 const d=r.calls[0].dest;assert.ok(d[2]>s.o.w*4&&d[3]>s.o.h*4);assert.ok(d[2]<=tree.canopy*2&&d[3]<=tree.canopy*2);assert.ok(Math.abs(d[2]/d[3]-sprite.rect[2]/sprite.rect[3])<1e-9);
 assert.ok(alphaAt(r.canvas,130,130)>100);assert.deepEqual(r.c.getTransform().toJSON(),matrix);assert.equal(JSON.stringify(s),before,'IDs, footprint, opacity and world state remain untouched');
});

test('163 physical forest: canopy visibility and fading follow the rotated world position while depth stays on the native trunk',()=>{
 const {A,trees}=fixture(),s=scene(),r=painter(),point=G.global(s.p,s.o.x+.25,s.o.y+.25),game={art:r.art};
 const view={l:point.x+1.45,r:point.x+1.55,t:point.y-.05,b:point.y+.05},entries=A.depthEntries(game,s.p,s.plan,{world:s.world,v:{z:0,x:point.x,y:point.y},view});
 assert.equal(entries.length,1,'A visible crown survives culling even when its half-metre trunk is offscreen');assert.equal(trees.length,0,'Queue inspection never starts image drawing');
 const foot=[G.global(s.p,s.o.x,s.o.y),G.global(s.p,s.o.x+s.o.w,s.o.y),G.global(s.p,s.o.x,s.o.y+s.o.h),G.global(s.p,s.o.x+s.o.w,s.o.y+s.o.h)];assert.equal(entries[0].depth,Math.max(...foot.map(q=>q.y)));
 r.c.translate(130,130);r.c.scale(18,18);r.c.translate(-point.x,-point.y);const matrix=r.c.getTransform().toJSON();entries[0].draw(r.c);
 assert.equal(trees.length,1);assert.equal(trees[0].options.alpha,.32,'A player beneath the crown remains visible');assert.equal(r.calls.length,1);assert.deepEqual(r.c.getTransform().toJSON(),matrix);
 assert.deepEqual(Array.from(A.depthEntries(game,s.p,s.plan,{world:s.world,v:{z:1},view})),[]);
 assert.deepEqual(Array.from(A.depthEntries(game,s.p,s.plan,{world:s.world,v:{z:0},view:{l:100,r:101,t:100,b:101}})),[]);
});

test('163 physical forest: a missing or rejected botanical image keeps a seeded tree silhouette and requests no context atlas',()=>{
 const {A,trees}=fixture(),s=scene(),requested=[],art={images:{},ensure:key=>requested.push(key)};
 const digests=[];
 for(const species of ['oak','pine','poplar','willow']){
  const canvas=createCanvas(180,180),c=canvas.getContext('2d'),o=freeze({...s.o,id:'cold:'+species,species}),rectangles=[];
  const fillRect=c.fillRect.bind(c);c.fillRect=(...args)=>{rectangles.push(args);return fillRect(...args);};
  c.translate(90,90);c.scale(15,15);c.translate(-(o.x+.25),-(o.y+.25));const matrix=c.getTransform().toJSON();
  assert.equal(A.drawVisual(c,{art},s.p,{...s.plan,visuals160:[o]},o,{world:s.world}),true);assert.equal(rectangles.length,0,'Tree fallback never returns to the half-metre grey box');
  const data=c.getImageData(0,0,180,180).data;let ink=0,outside=0;for(let y=0;y<180;y++)for(let x=0;x<180;x++)if(data[(y*180+x)*4+3]>32){ink++;if(Math.abs(x-90)>8||Math.abs(y-90)>8)outside++;}
  assert.ok(ink>600&&outside>500,species+' has a real canopy outside its native trunk');assert.equal(alphaAt(canvas,5,5),0,'The fallback keeps open space around its silhouette');assert.deepEqual(c.getTransform().toJSON(),matrix);
  digests.push(Buffer.from(data).toString('base64'));
 }
 assert.equal(new Set(digests).size,4,'Broadleaf, conifer, columnar and drooping trees retain distinct silhouettes');assert.equal(trees.length,4);assert.deepEqual(requested,[],'Existing eager Nature art does not start any optional context atlas');
 const rejected=painter();rejected.art.blit=()=>false;assert.equal(A.drawVisual(rejected.c,{art:rejected.art},s.p,s.plan,s.o,{world:s.world}),true,'A refused real blit also draws the fallback');
});

test('163 physical forest: identity variants and canopy geometry remain stable across paint order, elapsed time and metadata inspection',()=>{
 const {A,trees}=fixture(),s=scene(),r=painter(),game={art:r.art,elapsed:0},capture=(o,world=s.world)=>{A.drawVisual(r.c,game,s.p,s.plan,o,{world});const {tree}=trees.at(-1),call=r.calls.at(-1);return JSON.stringify({id:tree.id,species:tree.species,canopy:tree.canopy,a:tree.a,key:call.key,rect:call.rect,dest:call.dest});};
 const first=capture(s.o),cuts=new Set();for(let i=1;i<33;i++){const o={...s.o,id:'forest-variant:'+i};capture(o);cuts.add(r.calls.at(-1).rect.join(','));}
 assert.ok(cuts.size>=4,'Distinct identities actually select multiple existing source drawings');game.elapsed=9999;A.depthEntries(game,s.p,s.plan,{world:s.world,v:{z:0}});assert.equal(capture(s.o),first);
 assert.notEqual(capture(s.o,{...s.world,seed:17117}),first,'A different seed has its own deterministic presentation');assert.equal(capture(s.o),first,'Inspecting another seed cannot contaminate this world');
 const relocated={...s.o};capture(relocated);relocated.id='relocated-trunk';relocated.x+=9000;capture(relocated);const moved=trees.at(-1).tree,point=G.global(s.p,relocated.x+.25,relocated.y+.25),ecology=B.pickTree(42,point.x,point.y,relocated.id+':0',{generation:10});
 assert.equal(moved.id,relocated.id);assert.equal(moved.species,ecology.species);assert.ok(Math.abs(moved.point.x-point.x)<1e-8&&Math.abs(moved.point.y-point.y)<1e-8,'Presentation cache cannot retain a former identity or location');
 const dormant=fixture(),requests=[],cold={images:{},ensure:key=>requests.push(key)};dormant.A.depthEntries({art:cold},s.p,s.plan,{world:s.world,v:{z:0}});assert.equal(dormant.trees.length,0);assert.deepEqual(requests,[]);
});
