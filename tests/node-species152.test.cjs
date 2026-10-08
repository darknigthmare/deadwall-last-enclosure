'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const native=require('@napi-rs/canvas');
const Art=require('../src/art.js'),Assets=require('../src/assets136.js'),B=require('../src/biomes135.js'),P=require('../src/atlas-projection.js');

function context(){
 const stack=[];let matrix={a:1,b:0,c:0,d:1,e:0,f:0};
 const c={globalAlpha:.8,
  save(){stack.push({alpha:this.globalAlpha,matrix:{...matrix}});},
  restore(){const saved=stack.pop();this.globalAlpha=saved.alpha;matrix=saved.matrix;},
  translate(x,y){matrix.e+=matrix.a*x+matrix.c*y;matrix.f+=matrix.b*x+matrix.d*y;},
  rotate(angle){const {a,b,c,d}=matrix,cos=Math.cos(angle),sin=Math.sin(angle);Object.assign(matrix,{a:a*cos+c*sin,b:b*cos+d*sin,c:c*cos-a*sin,d:d*cos-b*sin});},
  scale(x,y){matrix.a*=x;matrix.b*=x;matrix.c*=y;matrix.d*=y;},
  getTransform(){return{...matrix};}
 };return{c};
}
async function painter(run){
 const previous={Image:globalThis.Image,B:globalThis.DeadwallBiomes135,P:globalThis.DeadwallAtlasProjection};
 globalThis.Image=class{set src(_){this.onerror();}};
 try{
  const art=Art.create();await art.ready;globalThis.Image=previous.Image;
  const hits={wood:0,stone:0},provider={...B,pickTree(...args){hits.wood++;return B.pickTree(...args);},pickRock(...args){hits.stone++;return B.pickRock(...args);}};
  globalThis.DeadwallBiomes135=provider;globalThis.DeadwallAtlasProjection=P;
  const pose={generation:7},game={world:{seed:17117},frontier:{position:()=>pose}},draws=[];
  for(const key of [...Object.values(Assets.TREE_SPRITES),...Object.values(Assets.ROCK_SPRITES)])art.images[key]={width:1254,height:1254};
  for(const[id,rect]of Object.entries(Art.PROPS))art.rects['props:'+id]=rect;
  art.rects['districtProps:burntTree']=Art.DISTRICT_PROPS.burntTree;
  art.blit=(c,key,rect,...destination)=>{const m=c.getTransform();draws.push({key,rect,destination,alpha:c.globalAlpha,matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}});return true;};
  const node=(type='wood')=>({id:51,type,x:715,y:1380,radius:28,variant:0,amount:30,maxAmount:60,flash:0});
  const expected=n=>{const q=globalThis.DeadwallAtlasProjection.toRegion(n.x,n.y,game),species=B[n.type==='wood'?'pickTree':'pickRock'](game.world.seed,q.x,q.y,'local:'+n.id,{generation:pose.generation}).species;return Assets[n.type==='wood'?'TREE_SPRITES':'ROCK_SPRITES'][species];};
  const paint=n=>{draws.length=0;const{c}=context(),matrix=c.getTransform(),alpha=c.globalAlpha;assert.equal(art.drawNode(c,n,game),true);assert.equal(draws.length,1);assert.deepEqual(c.getTransform(),matrix,'Every painter restores the caller transform, including a failed native attempt.');assert.equal(c.globalAlpha,alpha);return{...draws[0]};};
  await run({art,game,pose,hits,provider,node,expected,paint});
 }finally{globalThis.Image=previous.Image;globalThis.DeadwallBiomes135=previous.B;globalThis.DeadwallAtlasProjection=previous.P;}
}

test('species152: repeated G7 paints reuse the exact regional species without resampling ecology',()=>painter(h=>{
 for(const type of ['wood','stone']){
  const n=h.node(type),before=JSON.stringify(n),expected=h.expected(n),first=h.paint(n);
  assert.equal(first.key,expected);
  for(let frame=0;frame<30;frame++)assert.deepEqual(h.paint(n),first);
  assert.equal(h.hits[type],1,type+' samples once');assert.equal(JSON.stringify(n),before);
 }
 assert.ok(h.art.nodeSpecies instanceof WeakMap);
}));

test('species152: world, seed, identity, position, variant, providers and resolved origin invalidate the selection',()=>painter(h=>{
 const n=h.node();h.paint(n);let count=1;
 const changes=[
  ()=>{h.game.world={seed:h.game.world.seed};},
  ()=>{h.game.world.seed=84329;},
  ()=>{n.id++;},()=>{n.x+=32;},()=>{n.y-=64;},()=>{n.variant=1;},
  ()=>{h.game.worldSeed=17117;},
  ()=>{h.game.home={x:9000,y:8000,minX:8936,minY:7936};},
  ()=>{h.game.home.minX+=16;},()=>{h.game.home.minY-=24;},
  ()=>{globalThis.DeadwallAtlasProjection={...P};},
  ()=>{globalThis.DeadwallBiomes135={...h.provider};},
  ()=>{n.type='stone';}
 ];
 for(const change of changes){change();const actual=h.paint(n);assert.equal(actual.key,h.expected(n));assert.equal(h.hits.wood+h.hits.stone,++count);h.paint(n);assert.equal(h.hits.wood+h.hits.stone,count,'same signature reuses one record');}
}));

test('species152: historical generations, log and scenery painters remain live and returning to G7 resamples',()=>painter(h=>{
 const n=h.node();h.paint(n);let count=1;
 for(const generation of [1,2,3,4,5,6]){
  h.pose.generation=generation;n.amount=12;n.flash=.2;
  const legacy=h.paint(n);assert.equal(legacy.key,'props');assert.equal(legacy.alpha,.45);assert.deepEqual(legacy.matrix,{a:1.04,b:0,c:0,d:1.04,e:n.x,f:n.y},'Only the historical flash transform reaches the actual blit.');
  assert.equal(h.hits.wood,count);h.pose.generation=7;assert.equal(h.paint(n).key,h.expected(n));assert.equal(h.hits.wood,++count);
 }
 n.variant=2;assert.equal(h.paint(n).key,'props');assert.equal(h.hits.wood,count);
 n.variant=0;assert.equal(h.paint(n).key,h.expected(n));assert.equal(h.hits.wood,++count);
 n.sceneryKind='burntTree';assert.equal(h.paint(n).key,'districtProps');assert.equal(h.hits.wood,count);
 delete n.sceneryKind;h.paint(n);assert.equal(h.hits.wood,++count);
 h.paint({...n});assert.equal(h.hits.wood,++count,'a new node with an identical saved ID has its own record');
}));

test('species152: quantity and geometry stay live, native alpha paint matches uncached output, and rendering is pure',()=>painter(async h=>{
 const nodes=[h.node('wood'),h.node('stone')];
 for(const n of nodes){
  const first=h.paint(n);n.amount=5;n.maxAmount=80;n.radius=39;n.flash=.2;
  const next=h.paint(n);assert.equal(next.key,first.key);assert.equal(next.alpha,.8*.45);assert.notDeepEqual(next.destination,first.destination);assert.equal(h.hits[n.type],1,'live amount/radius/flash do not resample species');
  const key=h.expected(n);h.art.images[key]=await native.loadImage(path.join(__dirname,'..',Art.ASSETS[key].url));Object.freeze(n);
 }
 Object.freeze(h.game.world);const before=JSON.stringify({game:h.game,nodes}),random=Math.random;
 h.art.blit=(c,key,rect,...destination)=>{c.drawImage(h.art.images[key],...rect,...destination);return true;};
 const render=(n,cached)=>{
  const canvas=native.createCanvas(128,128),c=canvas.getContext('2d');c.fillStyle='#34402b';c.fillRect(0,0,128,128);c.globalAlpha=.79;c.translate(64.37-n.x,64.61-n.y);
  if(cached)assert.equal(h.art.drawNode(c,n,h.game),true);
  else{const key=h.expected(n),size=n.radius*(n.type==='wood'?3.5:2.65),alpha=Math.max(.45,Math.min(1,n.amount/n.maxAmount));assert.equal(Assets.drawSprite(c,h.art,key,n.x,n.y,size,size,{alpha}),true);}
  return c.getImageData(0,0,128,128).data;
 };
 Math.random=()=>{throw Error('Rendering consumed randomness');};
 try{for(const n of nodes)assert.deepEqual(render(n,true),render(n,false));}finally{Math.random=random;}
 assert.equal(JSON.stringify({game:h.game,nodes}),before);assert.deepEqual(h.hits,{wood:1,stone:1});
}));

test('species152: an atlas arriving after a fallback paint uses the cached species immediately',()=>painter(h=>{
 const n=h.node(),key=h.expected(n),image=h.art.images[key];delete h.art.images[key];
 assert.equal(h.paint(n).key,'props');assert.equal(h.hits.wood,1);
 h.art.images[key]=image;assert.equal(h.paint(n).key,key);assert.equal(h.hits.wood,1);
}));
