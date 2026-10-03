'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs'),C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),Save=require('../src/save.js'),A=require('../src/world-evolution-art.js');
const copy=x=>JSON.parse(JSON.stringify(x));
function fresh(seed=17117){const{game:g}=boot127();g.startNew('standard',String(seed));g.worldEvolution.enableWorld4();g.phaseTime=9999;g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());return g;}
function at(g,p){const d=g.serialize();Object.assign(d.frontier,p);g.restoreSave(d);}
let cachedRoad;function openRoad(g){if(cachedRoad)return cachedRoad;const w=g.frontier.world();for(const r of w.roads){const p={x:(r.a.x+r.b.x)/2,y:(r.a.y+r.b.y)/2};if(Math.hypot(p.x-4096,p.y-4096)>600&&!w.blocked(p.x,p.y,.4)&&!w.nearPOI(p.x,p.y,120).length)return(cachedRoad=p);}throw Error('fixture road absent');}
function horde(count=80){const g=fresh(),p=openRoad(g),d=g.serialize();Object.assign(d.frontier,{x:p.x+25,y:p.y,z:0,inside:null});Object.assign(d.worldEvolution,{serial:1,nextHorde:9999,groups:[{id:'W0000',kind:'resting',count,lost:0,wound:0,...p,a:0,seen:true}]});g.restoreSave(d);g.update(.04);return{g,p};}
for(const seed of[17117,42])test('1.29 infectés : sentinelles existantes dehors, cases libres et IDs conservés '+seed,()=>{
 const g=fresh(seed),w=g.frontier.world();let found=false;
 for(const p of w.pois.filter(p=>p.levels.length===1&&p.levels[0]===0).slice(0,12)){
  let q;for(const side of[1,-1]){const n=G.global(p,p.w/2,side>0?p.h+4:-4);if(!w.blocked(n.x,n.y,.32)){q=n;break;}}if(!q)continue;
  at(g,{...q,z:0,inside:null});g.update(.04);const enemies=g.frontier.overview().enemies.filter(e=>e.poi===p.id);assert.ok(enemies.length>0);
  for(const e of enemies){assert.equal(w.blocked(e.x,e.y,C.FrontierTacticsRules.enemyRadius,e.z,null),false);assert.match(e.id,new RegExp('^'+p.id+':e[0-3]$'));}
  const exterior=enemies.filter(e=>{const q=G.local(p,e.x,e.y);return q.x<0||q.y<0||q.x>p.w||q.y>p.h;});assert.ok(exterior.length>0);if(exterior.some(e=>g.frontier.visibleEnemy(e))){found=true;break;}
 }
 assert.ok(found,'une sentinelle apparaît réellement à l’extérieur et en ligne de vue');assert.ok(Save.validate(g.serialize()));
});
test('1.29 infectés : acteur sauvé dans un meuble replacé libre sans recréer un mort',()=>{
 const g=fresh(),w=g.frontier.world(),p=w.pois.find(p=>p.levels.length===1&&p.levels[0]===0&&1+G.hash(w.seed,p.id,'threat')%4>1),o=w.plan(p,0).objects[0],q=G.global(p,o.x+o.w/2,o.y+o.h/2),d=g.serialize(),id=p.id+':e0';
 Object.assign(d.frontier,{x:p.x,y:p.y,z:0,inside:p.id});d.frontier.tracks[id]={...q,z:0,a:0,mode:'idle',ttl:0,gx:q.x,gy:q.y,cool:0};d.frontier.enemies[p.id+':e1']=0;d.frontier.kills=1;g.restoreSave(d);g.update(.04);
 const e=g.frontier.overview().enemies.find(e=>e.id===id);assert.ok(e);assert.equal(w.blocked(e.x,e.y,.3,0,null),false);assert.equal(g.frontier.overview().enemies.some(e=>e.id===p.id+':e1'),false);assert.ok(Save.validate(g.serialize()));
});
test('1.29 horde : tir sur un espace vide ne touche pas le disque du groupe',()=>{
 const{g,p}=horde(),members=g.worldEvolution.groupMembers();assert.ok(members.length>0);let gap;
 for(let x=p.x-4;x<p.x+4&&!gap;x+=.25)for(let y=p.y-4;y<p.y+4;y+=.25)if(members.every(e=>Math.hypot(e.x-x,e.y-y)>.45)){gap={x,y};break;}
 assert.ok(gap);const before=copy(g.worldEvolution.snapshot().groups[0]);assert.equal(g.worldEvolution.hitContact(gap.x,gap.y,60),false);assert.deepEqual(g.worldEvolution.snapshot().groups[0],before);
});
test('1.29 horde : blessure puis mort concernent le sprite ciblé et persistent',()=>{
 const{g}=horde(),target=g.worldEvolution.groupMembers()[5],id=target.id,index=target.index,others=g.worldEvolution.groupMembers().filter(e=>e.id!==id).map(e=>[e.id,e.x,e.y]);
 assert.ok(g.worldEvolution.hitContact(target.x,target.y,22));let s=g.worldEvolution.snapshot().groups[0];assert.equal(s.lost,0);assert.equal(s.injuries[index],22);assert.equal(s.wound,22);
 const saved=g.serialize();g.restoreSave(saved);assert.deepEqual(g.worldEvolution.snapshot().groups[0],s);assert.ok(g.worldEvolution.groupMembers().some(e=>e.id===id),'visible immédiatement après reprise, même en pause');assert.deepEqual(g.worldEvolution.snapshot().groups[0],s,'la lecture ne change pas la sauvegarde');g.update(.04);const again=g.worldEvolution.groupMembers().find(e=>e.id===id);assert.ok(again);assert.ok(g.worldEvolution.hitContact(again.x,again.y,38));s=g.worldEvolution.snapshot().groups[0];assert.equal(s.lost,1);assert.deepEqual(s.fallen,[index]);assert.equal(s.wound,0);assert.equal(g.worldEvolution.groupMembers().some(e=>e.id===id),false);assert.ok(g.save(false));assert.ok(g.load());assert.equal(g.worldEvolution.snapshot().groups[0].lost,1);assert.ok(others.length>0);
});
test('1.29 horde : anciens compteurs migrent sans soins, morts ni cadeau supplémentaires',()=>{
 const{g}=horde(),d=g.serialize(),h=d.worldEvolution.groups[0];delete h.fallen;delete h.injuries;delete h.contacts;h.lost=3;h.wound=17;const resources=copy(d.resources);g.restoreSave(d);const s=g.worldEvolution.snapshot().groups[0];assert.deepEqual(s.fallen,[0,1,2]);assert.deepEqual(s.injuries,{'3':17});assert.equal(s.count,h.count);assert.equal(s.wound,17);assert.deepEqual(g.resources,resources);
});
test('1.29 horde : incohérences de morts/blessures/contacts rejetées avant mutation',()=>{
 const{g}=horde(),d=g.serialize(),world=g.world;for(const mutate of[h=>h.fallen=[0],h=>{h.lost=2;h.fallen=[1,1];},h=>h.injuries={'0':60},h=>h.contacts['999']={...h.contacts['0']},h=>h.contacts['0'].z=1,h=>{h.injuries={'0':20};h.wound=0;}]){const bad=copy(d);mutate(bad.worldEvolution.groups[0]);assert.throws(()=>g.restoreSave(bad),/Horde|Évolution/);assert.equal(g.world,world);}
});
test('1.29 horde : contact réel inflige des dégâts mais le vide entre silhouettes reste sans coup',()=>{
 const{g,p}=horde();let d=g.serialize();Object.assign(d.frontier,{x:p.x,y:p.y});d.player.health=100;d.player.invulnerable=0;g.restoreSave(d);g.update(.04);assert.ok(g.player.health<100,'premier infecté existe au centre et frappe à portée');
 d=g.serialize();Object.assign(d.frontier,{x:p.x+14,y:p.y});d.player.health=100;d.player.invulnerable=0;const h=d.worldEvolution.groups[0];h.contacts={};g.restoreSave(d);g.update(.04);assert.equal(g.player.health,100,'ancien bord du disque sans infecté à portée ne frappe plus');
});
test('1.29 horde : pause et plafond bornent les contacts physiques',()=>{
 const{g,p}=horde(360),d=g.serialize(),original=d.worldEvolution.groups[0];d.worldEvolution.serial=3;d.worldEvolution.groups=[original,{...copy(original),id:'W0001'},{...copy(original),id:'W0002'}];g.restoreSave(d);g.player.invulnerable=1;g.update(.04);assert.ok(g.worldEvolution.groupMembers().length<=C.RegionContactRules.contactBudget);assert.ok(g.worldEvolution.groupMembers().length>360);
 const before=copy(g.worldEvolution.snapshot());g.paused=true;g.update(.04);assert.deepEqual(g.worldEvolution.snapshot(),before);assert.ok(Save.validate(g.serialize()));
});
test('1.29 horde : le tireur utilise les membres réels et les munitions gardent leur circuit',()=>{
 const{g}=horde(),e=g.worldEvolution.groupMembers().find(e=>g.frontier.visibleEnemy(e));assert.ok(e);const origin={x:e.x+.8,y:e.y,z:0},before=g.worldEvolution.snapshot().groups[0].lost;assert.ok(g.frontier.companionShot(origin,2,60));assert.equal(g.worldEvolution.snapshot().groups[0].lost,before+1);assert.ok(Save.validate(g.serialize()));
});
test('1.29 art : atlas infecté, position commune, occultation et pause',()=>{
 const calls=[],g={state:'playing',world:{},player:{},elapsed:1,settings:{},frontier:{visibleEnemy:()=>true},art:{drawActor(c,p,kind){calls.push({p,kind,copy:{...p}});return true;}}},ctx={save(){},restore(){},scale(){}},e={id:'W0000:2',x:10,y:11,z:0,a:.3,hp:38},v={x:12,y:11,z:0,inside:null,enemies:[e],world:{nearPOI:()=>[]}},view={l:0,r:30,t:0,b:30};
 A.drawEnemies(ctx,g,v,view);assert.equal(calls[0].kind,'walkerAlt');assert.equal(calls[0].copy.visualUpright,true);assert.equal(calls[0].copy.x,320);const p=calls[0].p;g.elapsed+=.05;e.x+=.05;A.drawEnemies(ctx,g,v,view);assert.equal(calls.at(-1).p,p);assert.equal(p.visualMoving,true);g.paused=true;A.drawEnemies(ctx,g,v,view);assert.equal(p.visualMoving,false);
 const n=calls.length;g.frontier.visibleEnemy=()=>false;A.drawEnemies(ctx,g,v,view);assert.equal(calls.length,n);v.z=1;A.drawEnemies(ctx,g,v,view);assert.equal(calls.length,n);
});
test('1.29 art : les infectés debout se retournent par miroir, sans coucher leur sprite',async()=>{
 const Art=require('../src/art.js'),previous=globalThis.Image;globalThis.Image=class{set src(_){this.onerror?.();}};
 try{const art=Art.create();await art.ready;art.images.infectedExpansion={};const rotations=[],scales=[],frames=[],ctx={save(){},restore(){},translate(){},rotate(a){rotations.push(a);},scale(x,y){scales.push([x,y]);}};art.blit=(_c,atlas,rect)=>{frames.push({atlas,rect});return true;};
  for(const facing of[0,Math.PI/2,Math.PI,-2.4]){const p={id:1,x:10,y:10,facing,visualUpright:true,visualMoving:false,visualMotionReset:true};rotations.length=scales.length=0;assert.ok(art.drawActor(ctx,p,'walkerAlt',1,false,false));assert.deepEqual(rotations,[]);assert.deepEqual(scales,Math.cos(facing)<0?[[-1,1]]:[]);assert.equal(p.facing,facing);assert.equal(frames.at(-1).atlas,'infectedExpansion');}
 }finally{globalThis.Image=previous;}
});
