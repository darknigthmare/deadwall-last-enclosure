'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture,pen}=require('./helpers/husbandry199.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(){
 const f=fixture();f.g.player.carry.wood=30;f.g.player.carry.scrap=30;
 const p=pen();p.meat=12;p.meatAge=90;p.hides=5;p.hideAge=100;p.leather=4;
 f.restore({version:1,next:3,behaviors:false,pens:[p,{...pen(),id:2,x:50,y:50}],animals:[]});
 return {...f,finish(){for(let i=0;i<100&&f.g.husbandry191.busy();i++)f.g.husbandry191.step(.1);assert.equal(f.g.husbandry191.busy(),false);},go(id){Object.assign(f.position,f.g.husbandry191.access(f.g.husbandry191.view().pens.find(p=>p.id===id)));}};
}
for(const kind of ['meat','hides','leather'])test('203 '+kind+' moves only through finite paid packing and local delivery',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);const before=clone(f.g.player.carry),amount=Math.min(6,f.read().pens[0][kind]);
 assert.equal(h.begin('pack-'+kind,1).ok,true);assert.equal(f.g.player.carry.wood,before.wood-2);assert.equal(f.g.player.carry.scrap,before.scrap-1);assert.equal(h.carryingProducts(),false);f.finish();
 const packed=f.read();assert.equal(packed.cargo203.amount,amount);assert.equal(packed.pens[0][kind],(kind==='meat'?12:kind==='hides'?5:4)-amount);assert.equal(h.carryingProducts(),true);
 assert.equal(h.movementFactor203(),.72);f.go(2);const q=h.quote('unpack-products',2);assert.equal(q.ok,true,q.reason);assert.equal(h.begin('unpack-products',2).ok,true);f.finish();
 assert.equal(f.read().pens[1][kind],amount);assert.equal(f.read().cargo203,undefined);assert.equal(h.carryingProducts(),false);
 assert.equal(f.g.player.carry.food,before.food,'raw goods never become free provisions');
});
test('203 cancellation consumes packaging but neither removes products nor creates a parcel',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);assert.equal(h.begin('pack-meat',1).ok,true);h.step(1);assert.equal(h.cancel(),true);assert.equal(f.read().pens[0].meat,12);assert.equal(f.read().cargo203,undefined);assert.equal(f.g.player.carry.wood,28);
});
test('203 pause and read-only views never deliver or refresh a perishable lot',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-meat',1);f.g.paused=true;const state=JSON.stringify(h.view()),bag=JSON.stringify(f.g.player.carry);
 for(let i=0;i<10;i++){h.step(.1);h.overview();h.actions();h.snapshot();}
 assert.equal(JSON.stringify(h.view()),state);assert.equal(JSON.stringify(f.g.player.carry),bag);f.g.paused=false;f.finish();f.go(2);h.begin('unpack-products',2);h.cancel();assert.equal(f.read().pens[1].meat,0);assert.equal(f.read().cargo203.amount,6);
});
test('203 drop and pickup preserve quantity and age; obstructed or distant pickup refuses atomically',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-hides',1);f.finish();const a=f.read().cargo203;
 assert.equal(h.begin('drop-products').ok,true);assert.equal(h.carryingProducts(),false);const dropped=f.read().cargo203;assert.equal(dropped.stage,'ground');assert.equal(dropped.amount,a.amount);assert.equal(dropped.age,a.age);
 f.position.x+=20;let before=JSON.stringify(f.read());assert.equal(h.begin('pickup-products').ok,false);assert.equal(JSON.stringify(f.read()),before);
 Object.assign(f.position,dropped.point);f.world.movementLine=()=>false;assert.equal(h.begin('pickup-products').ok,false);assert.equal(JSON.stringify(f.read()),before);
 f.world.movementLine=()=>true;assert.equal(h.begin('pickup-products').ok,true);f.finish();assert.equal(f.read().cargo203.stage,'held');assert.equal(f.read().cargo203.amount,a.amount);assert.ok(f.read().cargo203.age>=a.age);
});
test('203 expiry applies on the ground and filling an old stock cannot renew it',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-meat',1);f.finish();const s=f.read();s.pens[1].meat=1;s.pens[1].meatAge=300;f.restore(s);f.go(2);h.begin('unpack-products',2);f.finish();assert.ok(f.read().pens[1].meatAge>=300);
 f.go(1);h.begin('pack-meat',1);f.finish();h.begin('drop-products');const nearExpiry=f.read();nearExpiry.cargo203.age=require('../src/core.js').Husbandry191Rules.meatLife-.05;f.restore(nearExpiry);h.step(.1);assert.equal(f.read().cargo203,undefined);
});
test('203 partial delivery conserves remainder and never overfills destination',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-meat',1);f.finish();const s=f.read();s.pens[1].meat=39;f.restore(s);f.go(2);h.begin('unpack-products',2);f.finish();assert.equal(f.read().pens[1].meat,40);assert.equal(f.read().cargo203.amount,5);
 const before=JSON.stringify(f.read());assert.equal(h.begin('unpack-products',2).ok,false);assert.equal(JSON.stringify(f.read()),before);
});
test('203 single-load ownership blocks both packing and picking up while another load is held',()=>{
 for(const owner of ['essentials','campaignPack','explorationPack']){const f=setup(),h=f.g.husbandry191;f.go(1);f.g[owner]={carrying:()=>true};const before=JSON.stringify(f.read());assert.equal(h.begin('pack-meat',1).ok,false);assert.equal(JSON.stringify(f.read()),before);assert.equal(f.g.player.carry.wood,30);}
});
test('203 source expiry during packing aborts with no parcel, refund or renewal',()=>{
 const f=setup(),h=f.g.husbandry191,s=f.read();s.pens[0].meatAge=require('../src/core.js').Husbandry191Rules.meatLife-.05;f.restore(s);f.go(1);h.begin('pack-meat',1);f.finish();assert.equal(f.read().cargo203,undefined);assert.equal(f.read().pens[0].meat,0);assert.equal(f.g.player.carry.wood,28);
});
test('203 death drops exactly once at the captured regional point',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-leather',1);f.finish();const p={domain:'region',x:20,y:25,z:0,inside:null};assert.equal(h.dropProductsOnDeath(p),true);const first=JSON.stringify(f.read());assert.equal(h.dropProductsOnDeath({domain:'local',x:10,y:10,z:0}),false);assert.equal(JSON.stringify(f.read()),first);assert.deepEqual(clone(f.read().cargo203.point),{x:20,y:25});
});
test('203 cargo schema rejects unknown keys, invalid quantities and extra owners without mutating old saves',()=>{
 const f=setup(),old=f.read();assert.equal(Object.hasOwn(old,'cargo203'),false);assert.equal(JSON.stringify(f.api.validate(old)),JSON.stringify(old));f.go(1);f.g.husbandry191.begin('pack-meat',1);f.finish();const s=f.read();
 for(const delta of [{amount:0},{amount:7},{kind:'constructor'},{age:-1},{stage:'car'},{extra:1},{point:{x:-1,y:1}}])assert.throws(()=>f.api.validate({...s,cargo203:{...s.cargo203,...delta}}));
 const restored=clone(s);f.restore(restored);assert.deepEqual(f.read(),s);restored.cargo203.amount=1;assert.equal(f.read().cargo203.amount,6);
});
test('203 a nearby threat or a blocked access interrupts unloading without losing a held lot',()=>{
 for(const obstruction of ['threat','wall']){const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-meat',1);f.finish();f.go(2);h.begin('unpack-products',2);
 if(obstruction==='wall')f.world.movementLine=()=>false;
 else{const old=f.g.frontier.contacts;f.g.frontier.contacts=()=>[{x:50,y:50,z:0,hp:100}];for(let i=0;i<1000&&h.busy();i++)h.step(.1);f.g.frontier.contacts=old;}
 h.step(.1);h.cancel();assert.equal(f.read().pens[1].meat,0);assert.equal(f.read().cargo203.amount,6);}
});
test('203 a dropped package reserves its patch of terrain against a new enclosure',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-leather',1);f.finish();Object.assign(f.position,{x:90,y:90});h.begin('drop-products');Object.assign(f.position,{x:90,y:93.4});assert.equal(h.quote('build').ok,false);
});
test('203 late acquisition of another load cancels packing without duplication',()=>{
 const f=setup(),h=f.g.husbandry191;f.go(1);h.begin('pack-meat',1);f.g.essentials={carrying:()=>true};h.step(.1);assert.equal(h.busy(),false);assert.equal(f.read().cargo203,undefined);assert.equal(f.read().pens[0].meat,12);assert.equal(f.g.player.carry.wood,28);
});
test('203 package drawing is finite and read-only',()=>{
 const art=require('../src/husbandry191-art.js'),calls=[];
 const c=new Proxy({}, {set:(o,k,v)=>(o[k]=v,true),get:(o,k)=>k in o?o[k]:(...a)=>{assert.ok(a.every(x=>typeof x!=='number'||Number.isFinite(x)));calls.push(k);}});
 const p=Object.freeze({kind:'meat',amount:6}),point=Object.freeze({x:12,y:15});assert.equal(art.drawProducts203(c,p,point),true);assert.ok(calls.includes('fillRect'));assert.equal(art.drawProducts203(c,p,{x:NaN,y:0}),false);
});
