'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/art.js'),C=require('../src/core.js');

async function painter(){
 const old=globalThis.Image;globalThis.Image=class{set src(_){this.onerror();}};
 let art;try{art=A.create();await art.ready;}finally{globalThis.Image=old;}
 for(const [atlas]of Object.values(A.ACTORS))art.images[atlas]={};
 let rect,atlas;
 art.blit=(_ctx,key,source)=>{atlas=key;rect=source;return true;};
 const ctx=new Proxy({},{get:(_t,key)=>typeof key==='symbol'?undefined:()=>{},set:()=>true});
 return{art,paint(actor,time,kind=actor.kind||'bloated',reduced=false){
  assert.equal(art.drawActor(ctx,actor,kind,time,reduced,false),true);
  const spec=A.ACTORS[A.actorVariant(kind,actor.id)];assert.equal(atlas,spec[0]);
  const frame=Array.from({length:8},(_,n)=>A.actorFrameRect(spec[0],spec[1],n)).findIndex(r=>r.every((v,i)=>v===rect[i]));
  assert.ok(frame>=0);return frame;
 }};
}

test('animation152: slow and staggered actors animate at 60, 144 and 240 paints per second',async()=>{
 const p=await painter();
 for(const speed of [C.ENEMIES.bloated.speed,C.ENEMIES.bloated.speed*.35])for(const hz of [60,144,240]){
  const actor={id:2,x:0,y:0,kind:'bloated',facing:0},frames=new Set();let midpoint;
  for(let tick=0;tick<=hz;tick++){actor.x=speed*tick/hz;const frame=p.paint(actor,tick/hz);frames.add(frame);if(tick===hz/2)midpoint=frame;}
  assert.equal(actor.x,speed);assert.equal(frames.size,8,`${speed} units/s at ${hz} Hz`);assert.equal(midpoint,6);
 }
});

test('animation152: all local unit and zombie roles keep their atlas and stop on the first idle sample',async()=>{
 const p=await painter();
 for(const kind of [...Object.keys(C.SURVIVORS),...Object.keys(C.ENEMIES)]){
  const actor={id:2,x:0,y:0,kind,facing:0};assert.equal(p.paint(actor,1),0,kind);
  actor.x=.02;assert.notEqual(p.paint(actor,1.05),0,kind);
  assert.equal(p.paint(actor,1.1),0,kind);
 }
});

test('animation152: repeated paints of a paused simulation preserve the exact pose',async()=>{
 const p=await painter(),actor={id:2,x:0,y:0,facing:0};p.paint(actor,1);actor.x=.1;
 const before=p.paint(actor,1.05);assert.notEqual(before,0);
 for(let n=0;n<40;n++)assert.equal(p.paint(actor,1.05),before);
 assert.equal(p.paint(actor,1.1),0);assert.equal(p.paint(actor,1.1),0);
});

test('animation152: regional presentation movement flags stay authoritative',async()=>{
 const p=await painter(),actor={id:2,x:0,y:0,facing:0,visualMoving:true};
 assert.notEqual(p.paint(actor,1.05,'medic'),0);
 actor.visualMoving=false;actor.x+=.1;assert.equal(p.paint(actor,1.1,'medic'),0);
 actor.visualMoving=true;assert.notEqual(p.paint(actor,1.15,'medic'),0);
 actor.visualMoving=false;actor.visualMotionReset=true;assert.equal(p.paint(actor,1.15,'medic'),0);
});

test('animation152: teleports, long gaps, reset flags and rewound simulation time clear inferred movement',async()=>{
 const p=await painter(),actor={id:2,x:0,y:0,facing:0};p.paint(actor,1);actor.x=.1;assert.notEqual(p.paint(actor,1.05),0);
 actor.x+=1;assert.equal(p.paint(actor,1.05),0,'coordinate jump without simulation time');
 actor.x+=100;assert.equal(p.paint(actor,1.1),0,'large coordinate jump');
 actor.x+=.1;assert.notEqual(p.paint(actor,1.15),0);
 actor.x+=.1;assert.equal(p.paint(actor,1.5),0,'unsampled simulation gap');
 actor.x+=.1;assert.notEqual(p.paint(actor,1.55),0);
 assert.equal(p.paint(actor,1),0,'rewound time');
 actor.x+=.1;assert.notEqual(p.paint(actor,1.05),0,'movement resumes after rewind');
 actor.visualMotionReset=true;actor.x+=.1;assert.equal(p.paint(actor,1.1),0,'explicit scene reset');
 delete actor.visualMotionReset;actor.x+=.1;assert.notEqual(p.paint(actor,1.15),0);
});

test('animation152: reduced motion and charger preparation retain neutral frames',async()=>{
 const p=await painter(),actor={id:2,x:0,y:0,facing:0,charge:{stage:'windup'}};p.paint(actor,1,'charger');actor.x=.1;
 assert.equal(p.paint(actor,1.05,'charger'),0);actor.charge.stage='rush';actor.x+=.1;assert.notEqual(p.paint(actor,1.2,'charger'),0);
 actor.x+=.1;assert.equal(p.paint(actor,1.25,'charger',true),0);
});

test('animation152: drawing preserves actor data and does not consume randomness',async()=>{
 const p=await painter(),actor=Object.freeze({id:2,x:0,y:0,facing:0,visualMoving:true}),before={...actor},random=Math.random;
 Math.random=()=>{throw Error('Drawing consumed randomness');};
 try{for(const time of [1,1.05,1.05,1.1])p.paint(actor,time);}finally{Math.random=random;}
 assert.deepEqual(actor,before);
});
