'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const A=require('../src/post-art159.js'),C=require('../src/core.js'),D=C.Arsenal134Rules.catalog;
const root=path.join(__dirname,'..');let artPromise;
function artwork(){return artPromise??=Promise.all(Object.entries(A.ASSETS).map(async([key,spec])=>[key,await loadImage(path.join(root,spec.url))])).then(entries=>({images:Object.fromEntries(entries),blit(c,k,r,...d){c.drawImage(this.images[k],...r,...d);return true;}}));}
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const post=kind=>({item:{uid:27,id:kind,condition:100,rounds:D[kind].magazine},x:70,y:60,angle:0,health:D[kind].health,cooldown:.2});

test('159 posts have two original appearances with four isolated independent parts, alpha gutters and exact asset dimensions',async()=>{
 const art=await artwork();assert.deepEqual(Object.keys(A.TYPES),['tripod','heavyNest','boltNest','spikeFrame']);
 for(const [key,spec]of Object.entries(A.ASSETS)){
  const img=art.images[key];assert.equal(img.width,spec.width);assert.equal(img.height,spec.height);
  const c=createCanvas(img.width,img.height).getContext('2d');c.drawImage(img,0,0);const pixels=c.getImageData(0,0,img.width,img.height).data;
  assert.equal(A.CUTS[key].length,16);let count=0;
  for(const r of A.CUTS[key]){const[x,y,w,h]=r;assert.ok(x>0&&y>0&&x+w<img.width&&y+h<img.height);
   let occupied=0;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(pixels[(yy*img.width+xx)*4+3]>8){occupied++;assert.ok(xx>x&&xx<x+w-1&&yy>y&&yy<y+h-1,'complete silhouette with transparent cut edge');}
   assert.ok(occupied>40);count+=occupied;
  }
  let total=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>8)total++;
  assert.equal(count,total,'all original parts covered exactly once, none borrowed or omitted');
 }
 for(const forms of Object.values(A.TYPES)){assert.equal(forms.length,2);for(const form of forms){assert.deepEqual(Object.keys(form),['base','weapon','supply','wreck']);assert.notDeepEqual(form.base.rect,form.weapon.rect);}}
});

test('159 post poses require observed strikes; restored cooldown, empty ammo and wall clock alone cannot invent fire',()=>{
 for(const kind of Object.keys(A.TYPES)){
  const p=post(kind);assert.equal(A.pose(D[kind],p,null).active,false);
  assert.equal(A.pose(D[kind],p,{shotElapsed:.1,shotDuration:.3}).active,true);
  assert.equal(A.pose(D[kind],p,{shotElapsed:.1,shotDuration:.3},true).active,false);
  assert.equal(A.pose(D[kind],p,{shotElapsed:.3,shotDuration:.3}).active,false);
  assert.equal(A.pose(D[kind],p,{shotElapsed:NaN,shotDuration:.3}).active,false);
  p.item.rounds=0;assert.equal(A.pose(D[kind],p,null).active,false);
  if(kind!=='spikeFrame')assert.equal(A.pose(D[kind],p,null).empty,true);
  p.health=0;assert.equal(A.pose(D[kind],p,{shotElapsed:0,shotDuration:.3}).active,false);
 }
});

test('159 native bases stay fixed while weapons rotate and recoil; empty and destroyed owner states change the real parts',async()=>{
 const art=await artwork(),calls=[],original=art.blit;art.blit=function(c,key,r,...d){calls.push({key,r,d,m:c.getTransform()});return original.call(this,c,key,r,...d);};
 try{for(const kind of Object.keys(A.TYPES)){
  const p=post(kind),saved=JSON.stringify(p),c=createCanvas(180,140).getContext('2d');
  assert.equal(A.drawPost(c,art,p,D[kind],{seed:17117}),true);const idle=sha(c.getImageData(0,0,180,140).data),first=calls.slice(-3);assert.equal(first[0].m.a,1);assert.equal(first[0].m.b,0);
  c.clearRect(0,0,180,140);calls.length=0;p.angle=Math.PI/2;A.drawPost(c,art,p,D[kind],{seed:17117,presentation:{shotElapsed:.1,shotDuration:.3}});
  assert.equal(calls[0].m.a,1);assert.equal(calls[0].m.b,0,'fixed support');assert.ok(Math.abs(calls[1].m.b-1)<1e-8,'mounted part turns');assert.notEqual(sha(c.getImageData(0,0,180,140).data),idle);
  p.angle=0;c.clearRect(0,0,180,140);A.drawPost(c,art,p,D[kind],{seed:17117,presentation:{shotElapsed:.1,shotDuration:.3},reducedMotion:true});assert.equal(sha(c.getImageData(0,0,180,140).data),idle);
  p.item.rounds=0;calls.length=0;A.drawPost(c,art,p,D[kind],{seed:17117});if(kind!=='spikeFrame')assert.equal(calls.length,2,'empty local supply removed');
  p.health=0;calls.length=0;A.drawPost(c,art,p,D[kind],{seed:17117});assert.deepEqual(calls[1].r,A.select(kind,p.item.uid,17117).wreck.rect);
  assert.equal(saved,JSON.stringify(post(kind)),'input fixture remains explicit');
 }}finally{art.blit=original;}
 const c=createCanvas(80,80).getContext('2d'),before=sha(c.getImageData(0,0,80,80).data);
 assert.equal(A.drawPost(c,{images:{}},post('tripod'),D.tripod),false);assert.equal(sha(c.getImageData(0,0,80,80).data),before);
});

test('159 post selection is stable across restore, seed-aware and never uses simulation RNG or changes the input',async()=>{
 const art=await artwork(),old=Math.random,c=createCanvas(180,140).getContext('2d');
 Math.random=()=>{throw Error('Art must not draw RNG');};try{for(const kind of Object.keys(A.TYPES)){
  const p=post(kind),saved=JSON.stringify(p);A.drawPost(c,art,p,D[kind],{seed:17117});assert.equal(JSON.stringify(p),saved);
  assert.strictEqual(A.select(kind,p.item.uid,17117),A.select(kind,JSON.parse(saved).item.uid,17117));
  assert.equal(new Set(Array.from({length:30},(_,i)=>A.variantFor(17117,i,kind))).size,2);
  assert.equal(new Set(Array.from({length:30},(_,seed)=>A.variantFor(seed,p.item.uid,kind))).size,2);
 }}finally{Math.random=old;}
});

test('159 real post owner publishes strikes only after ammo, visibility and LOS guards; pause, expiry, destruction and restore clear/freeze events',()=>{
 const {g}=require('./helpers/expansions131.cjs').boot131();require('../src/succession133.js').install(g);require('../src/arsenal134.js').install(g);
 const raw=g.serialize(),s=raw.expansions127.modules.arsenal134,uid=s.next++;
 s.posts.push({item:{uid,id:'tripod',condition:100,rounds:2},x:2700,y:2000,angle:0,health:D.tripod.health,cooldown:.3});g.restoreSave(raw);
 assert.equal(g.arsenal134.postPresentation(uid),null,'restored cooldown is not a new shot');
 const target={id:991,x:2820,y:2000,health:200,maxHealth:200,radius:10,dead:false,def:{damage:8}};
 // Prepared owner fixture isolates the existing LOS and light guards; does not claim a road journey.
 let line=true,light=false;g.nearbyZombies=()=>[target];g.hostileLineClear=()=>line;g.nightwatch={visible:()=>light};
 g.arsenal134.step(.1);g.arsenal134.step(.1);g.arsenal134.step(.1);assert.equal(g.arsenal134.postPresentation(uid),null);assert.equal(target.health,200);
 light=true;line=false;g.arsenal134.step(.1);assert.equal(g.arsenal134.postPresentation(uid),null);assert.equal(g.arsenal134.view().posts[0].item.rounds,2);
 line=true;const depot=g.resources.ammo;g.arsenal134.step(.1);assert.equal(target.health,200-D.tripod.damage);assert.equal(g.arsenal134.view().posts[0].item.rounds,1);assert.equal(g.resources.ammo,depot);
 const event=g.arsenal134.postPresentation(uid);assert.equal(event.shotElapsed,0);assert.equal(event.kind,'shot');
 g.paused=true;g.arsenal134.step(.1);assert.deepEqual(g.arsenal134.postPresentation(uid),event);g.paused=false;
 const module=g.expansions.get('arsenal134'),saved=g.arsenal134.snapshot();module.restore(saved);assert.equal(g.arsenal134.postPresentation(uid),null);assert.deepEqual(g.arsenal134.snapshot(),saved,'transient view never enters save');
 for(let n=0;n<4;n++)g.arsenal134.step(.1);assert.ok(g.arsenal134.postPresentation(uid));
 light=false;for(let n=0;n<6;n++)g.arsenal134.step(.1);assert.equal(g.arsenal134.postPresentation(uid),null);
 const restored=g.arsenal134.snapshot();restored.posts[0].cooldown=0;restored.posts[0].item.rounds=1;module.restore(restored);
 light=true;g.arsenal134.step(.1);assert.ok(g.arsenal134.postPresentation(uid));
 target.x=2705;target.def.damage=100000;g.arsenal134.step(.1);assert.equal(g.arsenal134.view().posts[0].health,0);assert.equal(g.arsenal134.postPresentation(uid),null,'real destruction removes transient owner');
 module.reset();assert.equal(g.arsenal134.postPresentation(uid),null);
});
