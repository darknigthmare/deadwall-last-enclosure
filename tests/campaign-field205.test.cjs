'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),A=require('../src/codex-campaign205.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=v=>JSON.parse(JSON.stringify(v)),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function finish(owner,seconds){for(let i=0;i<Math.ceil(seconds/.1);i++)owner.step(.1);}
function fresh(){const g=boot127().game;require('../src/world-pack131.js').install(g);g.startNew('standard','17117','classic','classic',true);assert.equal(g.frontier.position().generation,11);standAt(g,g.player,g.core());g.phaseTime=999;return g;}
function prepareEntry(g,localY=-1){
 const w=g.frontier.world(),site=w.pois.find(p=>p.campaign205),entry=A.template(site.type).base.entry,q=G.global(site,entry.x,localY),raw=g.serialize();
 assert.equal(w.blocked(q.x,q.y,.32),false);Object.assign(raw.frontier,{active:true,...q,z:0,inside:null,a:site.a+Math.PI/2,anchor:{x:g.player.x,y:g.player.y}});
 if(!raw.frontier.seen.includes(site.id))raw.frontier.seen.push(site.id);
 for(const p of w.nearPOI(q.x,q.y,200))for(let i=0;i<w.threatCount(p);i++)raw.frontier.enemies[p.id+':e'+i]=0;
 raw.frontier.kills=Object.values(raw.frontier.enemies).filter(h=>h===0).length;
 assert.equal(g.restoreSave(raw),true);g.update(0);g.input.keys.clear();g.input.pressed.clear();return{w:g.frontier.world(),site,entry};
}
function face(g,angle){g.input.mouseX=g.width/2+Math.cos(angle)*100;g.input.mouseY=g.height/2+Math.sin(angle)*100;g.updatePlayer(0);}
// A prepared expedition start is restored once. From here on only the native
// keyboard/controller moves the player: no assigned coordinates or teleports.
function walk(g,target){
 const start=g.frontier.position(),vx=target.x-start.x,vy=target.y-start.y,length=Math.hypot(vx,vy);let ticks=0;
 assert.ok(g.frontier.world().movementLine(start,target,0,null,null,.32),'The authored path must admit the actual foot disc.');
 while(true){const p=g.frontier.position(),left=Math.hypot(target.x-p.x,target.y-p.y);if(left<.04)break;
  assert.ok(++ticks<6000,'Native walking must make continuous progress.');
  const progress=Math.max(0,Math.min(length,((p.x-start.x)*vx+(p.y-start.y)*vy)/length)),ahead=Math.min(length,progress+.18),aim={x:start.x+vx/length*ahead,y:start.y+vy/length*ahead};
  const angle=Math.atan2(aim.y-p.y,aim.x-p.x),octant=Math.round(angle/(Math.PI/4)),dx=Math.round(Math.cos(octant*Math.PI/4)),dy=Math.round(Math.sin(octant*Math.PI/4));
  g.input.keys.clear();if(dx)g.input.keys.add(dx>0?'KeyD':'KeyA');if(dy)g.input.keys.add(dy>0?'KeyS':'KeyW');
  const dt=Math.min(.01,left/(C.Frontier.RULES.walk*2));g.updatePlayer(dt);const next=g.frontier.position(),distance=Math.hypot(next.x-p.x,next.y-p.y);
  assert.ok(distance<=C.Frontier.RULES.walk*dt+1e-7,'No coordinate jump at a domain boundary.');assert.equal(g.frontier.world().blocked(next.x,next.y,.32,0,next.inside),false);
 }
 g.input.keys.clear();return ticks;
}
function checkpoint(g){const d=copy(g.serialize());delete d.timestamp;return d;}

test('205 native field walk: outside, open lane, doorway and real room keep physical continuity and paid torch rain exposure',()=>{
 const g=fresh();g.resources.wood=g.resources.fuel=400;const stocks={...g.resources};assert.equal(g.nightGear.craft('torch').ok,true);finish(g.nightGear,C.NightGearRules.craftSeconds);
 const torch=g.nightGear.snapshot().devices[0];assert.ok(torch);assert.equal(g.resources.wood,stocks.wood-4);assert.equal(g.resources.fuel,stocks.fuel-2);assert.equal(g.nightGear.transfer(torch.id,'equip').ok,true);assert.equal(g.nightGear.ignite(torch.id).ok,true);
 const {w,site,entry}=prepareEntry(g),yard=G.global(site,entry.x,1),corner=G.global(site,entry.x,6),junction=G.global(site,28,6),room=G.global(site,28,12.8),device=()=>g.nightGear.snapshot().devices.find(d=>d.id===torch.id);
 assert.notEqual(entry.x,site.w/2,'The actual author gate is deliberately off centre.');walk(g,yard);assert.equal(g.frontier.position().inside,null);assert.equal(w.coveredAt205(yard.x,yard.y),false);g.weather=1;
 let left=device().left;g.nightGear.step(.1);close(device().left,left-.26);face(g,site.a+Math.PI/2);assert.equal(g.nightGear.place(torch.id).ok,true);assert.equal(device().inside,null);left=device().left;g.nightGear.step(.1);close(device().left,left-.26);assert.equal(g.nightGear.pickup(torch.id).ok,true);
 walk(g,corner);walk(g,junction);walk(g,room);assert.equal(g.frontier.position().inside,site.id);assert.equal(w.coveredAt205(room.x,room.y,0,site.id),true);
 left=device().left;g.nightGear.step(.1);close(device().left,left-.1);face(g,site.a+Math.PI/2);assert.equal(g.nightGear.place(torch.id).ok,true);assert.equal(device().inside,site.id);left=device().left;g.nightGear.step(.1);close(device().left,left-.1);
 const saved=checkpoint(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),saved);assert.equal(g.nightGear.pickup(torch.id).ok,true);
 walk(g,junction);assert.equal(g.frontier.position().inside,null);walk(g,corner);walk(g,G.global(site,entry.x,-1));assert.equal(g.frontier.position().inside,null);assert.equal(g.frontier.position().z,0);
});

test('205 survival: the courtyard grants neither a free camp nor free healing; a paid exterior tarp protects nearby exposed flames',()=>{
 const g=fresh();Object.assign(g.player.carry,{wood:16,scrap:9,fuel:1});const {w,site,entry}=prepareEntry(g,-3.3);face(g,site.a+Math.PI/2);
 const before={...g.player.carry},q=g.survivalPack.preview('camp');assert.equal(q.ok,true,q.reason);assert.equal(g.survivalPack.begin('camp').ok,true);finish(g.survivalPack,C.SurvivalPackRules.camp.seconds);assert.equal(g.survivalPack.snapshot().camps.length,1);assert.equal(g.player.carry.wood,before.wood-12);assert.equal(g.player.carry.scrap,before.scrap-6);
 assert.equal(g.survivalPack.begin('cover').ok,true);finish(g.survivalPack,C.SurvivalPackRules.cover.seconds);assert.equal(g.player.carry.wood,0);assert.equal(g.player.carry.scrap,0);assert.equal(g.player.carry.fuel,0);
 const lane=G.global(site,entry.x,.5),point={location:'placed',domain:'region',...lane,z:0,inside:site.id};assert.equal(w.coveredAt205(point.x,point.y,0,site.id),false);assert.equal(g.survivalPack.rainProtection(point,null),.9);assert.equal(g.survivalPack.rainProtection({...point,z:1},null),0);assert.equal(g.survivalPack.rainProtection({...point,x:point.x+100},null),0);
 walk(g,lane);assert.equal(g.frontier.position().inside,null);const health=g.player.health,bag={...g.player.carry};assert.equal(g.survivalPack.preview('camp').ok,false);assert.equal(g.survivalPack.begin('restSheltered').ok,false);assert.equal(g.player.health,health);assert.deepEqual(g.player.carry,bag);
 const saved=checkpoint(g);assert.equal(g.restoreSave(g.serialize()),true);assert.deepEqual(checkpoint(g),saved);assert.equal(g.survivalPack.rainProtection(point,null),.9);
});
