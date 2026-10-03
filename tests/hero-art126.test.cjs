'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../src/art.js');
test('hero126: chaque pose reste dans l’image et préserve une échelle commune',()=>{
  assert.equal(A.HERO_STATES.length,8);
  for(const [atlas,rows] of Object.entries(A.HERO_FRAMES)){
    assert.equal(rows.length,8);
    for(const [row,frames] of rows.entries()){
      assert.equal(frames.length,4);
      for(const [column,r] of frames.entries()){
        assert.ok(r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0);
        assert.ok(r[0]+r[2]<=A.ASSETS[atlas].width&&r[1]+r[3]<=A.ASSETS[atlas].height);
        assert.ok(128+256*column>=r[0]&&128+256*column<=r[0]+r[2]);
        assert.ok(A.HERO_PIVOT_Y[row]>r[1]&&A.HERO_PIVOT_Y[row]<r[1]+r[3]);
      }
    }
  }
});
test('hero126: posture, rechargement et travail ont priorité sur le déplacement',()=>{
 const pose=(v,t=.4)=>A.heroPose(v,t,false,true);
 assert.equal(pose({visualMoving:false}).state,'idle');
 assert.equal(pose({visualMoving:true}).state,'walk');
 assert.equal(pose({visualMoving:true,sprinting:true}).state,'sprint');
 assert.equal(pose({visualPosture:'crouch',sprinting:true}).state,'crouch');
 assert.equal(pose({visualPosture:'prone',reload:1}).state,'prone');
 assert.equal(pose({reload:1,reloadTotal:2,shootCooldown:.2}).state,'reload');
 assert.equal(pose({visualAction:'work'}).state,'work');
 assert.equal(pose({shootCooldown:.2}).state,'shoot');
 assert.equal(pose({dead:true,reload:1}).state,'prone');
 assert.equal(pose({reload:1,reloadTotal:2}).frame,2);
});
test('hero126: mouvement réduit et immobilité basse ne bouclent pas les pas',()=>{
 for(const visualPosture of ['crouch','prone'])for(const t of [0,.1,.3,3.7])assert.equal(A.heroPose({visualPosture,visualMoving:false},t,false).frame,0);
 for(const t of [.1,.3,3.7])assert.equal(A.heroPose({visualMoving:true,sprinting:true},t,true).frame,0);
 const frames=new Set([0,.13,.26,.39].map(t=>A.heroPose({visualMoving:true},t,false).frame));assert.equal(frames.size,4);
});
test('hero126: atlas dédié peut charger même si le vieux survivant manque',async()=>{
 const old=globalThis.Image;globalThis.Image=class{set src(v){this.onerror();}};
 try{const art=A.create();await art.ready;art.images.commanderPistol={};let used='';art.blit=(_c,atlas)=>{used=atlas;return true;};
 const c={save(){},restore(){},translate(){},rotate(){},beginPath(){},ellipse(){},stroke(){}};
 assert.equal(art.drawActor(c,{x:0,y:0,weapon:'pistol'},'player',1,false,false),true);assert.equal(used,'commanderPistol');
 }finally{globalThis.Image=old;}
});
