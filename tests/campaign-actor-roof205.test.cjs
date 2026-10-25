'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas}=require('@napi-rs/canvas');
const C=require('../src/core.js'),G=require('../src/frontier-geometry.js'),A=require('../src/codex-campaign205.js');
const V=require('../src/visibility146.js'),W=require('../src/frontier-world.js');
const repo=path.resolve(__dirname,'..'),source=file=>fs.readFileSync(path.join(repo,'src',file),'utf8');
function renderer(){
 const root={DeadwallCore:C,DeadwallFrontierGeometry:G};
 vm.runInNewContext(source('frontier-art.js'),root);
 vm.runInNewContext(source('world-evolution-art.js'),root);
 return root.DeadwallWorldEvolutionArt;
}
const renderer205=renderer();
function compound(turn=0){
 const type='campaign205-045-01',p={...A.preset(type),id:'P9000',type,x:1000,y:1000,a:turn*Math.PI/2,generation:11,parking:[],outdoor:[]};
 const plan=A.plan(p,0),world={seed:17117,generation:11,nearPOI:()=>[p],plan:()=>plan};
 return{p,plan,world,at:(x,y)=>G.global(p,x,y)};
}
function actorFixture(scene,point,viewer,{inside=null,enemyVisible=true,destroyed=false}={}){
 const companion={id:'lea',...point,z:0,inside:scene.p.id,health:100,a:0};
 const enemy={id:scene.p.id+':e0',...point,z:0,poi:scene.p.id,hp:30,a:0};
 const evolution={companions:[companion],districts:[]},calls=[];
 const game={state:'playing',world:{seed:17117,buildings:new Map()},player:{health:100},elapsed:1,units:[],settings:{reducedMotion:true},daylight:()=>1,
  frontier:{visibleEnemy:()=>enemyVisible},worldEvolution:{overview:()=>evolution,structureDestroyed:()=>destroyed},
  art:{drawActor(_c,actor,kind){calls.push({id:actor.id,x:actor.x,y:actor.y,kind});return true;}}};
 const v={active:true,...viewer,z:0,inside,world:scene.world,enemies:[enemy]},view={l:700,r:1300,t:700,b:1300};
 return{game,v,view,companion,enemy,evolution,calls,entries(){return renderer205.depthEntries(game,v,this.view,evolution);}};
}
const ids=entries=>Array.from(entries,e=>e.id).sort();
function direct(f){
 const canvas=createCanvas(1,1),c=canvas.getContext('2d');f.calls.length=0;
 renderer205.draw(c,f.game,f.v,f.view);renderer205.drawEnemies(c,f.game,f.v,f.view);
 return f.calls;
}

test('205 actual actor owners retain both courtyard actors outside the parcel in all four orientations',()=>{
 for(let turn=0;turn<4;turn++){
  const s=compound(turn),entry=A.template(s.p.type).base.entry,point=s.at(entry.x,.75),viewer=s.at(entry.x,-2);
  assert.equal(A.insideBuilding(s.p,point),false);
  const f=actorFixture(s,point,viewer),before=JSON.stringify({plan:s.plan,p:s.p,companion:f.companion,enemy:f.enemy});
  assert.deepEqual(ids(f.entries()),['P9000:e0','lea']);
  assert.deepEqual(direct(f).map(a=>a.kind).sort(),['walkerAlt','workerAlt']);
  for(const actor of f.calls){assert.equal(actor.x,point.x*32);assert.equal(actor.y,point.y*32);}
  assert.equal(JSON.stringify({plan:s.plan,p:s.p,companion:f.companion,enemy:f.enemy}),before);
 }
});

test('205 sharing an inside parcel ID opens only the actual occupied building, never neighbouring roofs',()=>{
 for(let turn=0;turn<4;turn++){
  const s=compound(turn),[first,other]=s.plan.volumes160,center=b=>s.at(b.x+b.w/2,b.y+b.h/2);
  assert.ok(first&&other);const same=actorFixture(s,center(first),center(first),{inside:s.p.id});
  assert.deepEqual(ids(same.entries()),['P9000:e0','lea']);assert.equal(direct(same).length,2);
  const separate=actorFixture(s,center(other),center(first),{inside:s.p.id});
  assert.deepEqual(ids(separate.entries()),[]);assert.equal(direct(separate).length,0);
  const outside=actorFixture(s,center(first),s.at(-2,-2));
  assert.deepEqual(ids(outside.entries()),[]);assert.equal(direct(outside).length,0);
 }
});

test('205 actor roof presentation reads live destruction, while its existing sight and floor guards remain authoritative',()=>{
 const s=compound(),body=s.plan.volumes160[0],point=s.at(body.x+body.w/2,body.y+body.h/2),viewer=s.at(-2,-2);
 const intact=actorFixture(s,point,viewer);assert.equal(intact.entries().length,0);
 intact.game.worldEvolution.structureDestroyed=()=>true;assert.equal(intact.entries().length,2);
 intact.game.frontier.visibleEnemy=()=>false;assert.deepEqual(ids(intact.entries()),['lea']);
 intact.companion.health=0;assert.equal(intact.entries().length,0);
 const level=actorFixture(s,point,point,{inside:s.p.id});level.v.z=1;
 assert.equal(level.entries().length,0);assert.equal(direct(level).length,0);
 level.companion.z=level.enemy.z=1;level.companion.inside='P9001';level.enemy.poi='P9001';
 assert.equal(level.entries().length,0);
});

test('205 courtyard clipping keeps native shared sight, opaque walls and living ally requirements',()=>{
 // A single genuine generated world exercises the actual optical owner. It
 // does not stand in for an organic journey or a human play-duration test.
 const world=W.create(17117,11,{detailVersion:13,ecologyVersion:1,hydrologyVersion:1});
 const p=world.pois.find(p=>p.campaign205),plan=world.plan(p,0),entry=A.template(p.type).base.entry;
 const outside=G.global(p,entry.x,-1),courtyard=G.global(p,entry.x,1),scene={p,plan,world};
 assert.equal(world.line(outside,courtyard,0,null,null,.015),true);
 const f=actorFixture(scene,courtyard,outside);f.view={l:p.x-500,r:p.x+500,t:p.y-500,b:p.y+500};
 f.game.frontier={active:()=>true,position:()=>({...f.v}),world:()=>world,visibleEnemy:e=>f.game.visibility.canSeeRegional(e)};
 V.install(f.game);assert.equal(f.game.visibility.canSeeRegional(f.enemy),true);assert.equal(f.entries().length,2);
 f.game.player.health=0;f.evolution.companions=[];assert.equal(f.entries().length,0);
 const ally={id:'samir',...outside,z:0,inside:null,health:100,riding:false};f.evolution.companions=[ally];
 assert.equal(f.game.visibility.canSeeRegional(f.enemy),true);assert.ok(ids(f.entries()).includes(f.enemy.id));
 ally.health=0;assert.equal(f.game.visibility.canSeeRegional(f.enemy),false);assert.equal(f.entries().length,0);
 let pair;
 for(const wall of plan.walls){
  const tall=wall.w<wall.h,x=wall.x+wall.w/2,y=wall.y+wall.h/2,a=G.global(p,x-(tall?.8:0),y-(tall?0:.8)),b=G.global(p,x+(tall?.8:0),y+(tall?0:.8));
  if(!world.blocked(a.x,a.y,.1)&&!world.blocked(b.x,b.y,.1)&&!world.line(a,b,0,null,null,.015)){pair={a,b};break;}
 }
 assert.ok(pair);Object.assign(f.v,pair.a);Object.assign(f.enemy,pair.b);f.game.player.health=100;
 f.game.visibility.invalidate();assert.equal(f.game.visibility.canSeeRegional(f.enemy),false);assert.equal(f.entries().length,0);
});

test('205 preserves captured historical G1–G10 actor queue and pixel golden cases',()=>{
 const golden=require('./fixtures/campaign205-actor-legacy-golden.json');
 assert.equal(golden.sourceCommit,'11f2ace5ee3b39ea318373229d4d5378d14057db');
 const observed=[];
 for(let generation=1;generation<=10;generation++)for(const scenario of ['closed','entered','ruin','destroyed','outside']){
  const p={id:'P0001',type:scenario==='ruin'?'ruin':'house',x:20,y:30,w:12,h:4,a:Math.PI/3,generation};
  const point=G.global(p,scenario==='outside'?-1:3,2),world={nearPOI:()=>[p]},s={p,world};
  const f=actorFixture(s,point,{x:10,y:10},{inside:scenario==='entered'?p.id:null,destroyed:scenario==='destroyed'});
  f.view={l:0,r:60,t:0,b:60};
  const canvas=createCanvas(160,160),c=canvas.getContext('2d');c.scale(2,2);
  f.game.art.drawActor=(_c,actor,kind)=>{_c.fillStyle=kind==='workerAlt'?'#c4a772':'#7a675c';_c.fillRect(actor.x-5,actor.y-7,10,14);return true;};
  const entries=f.entries();for(const entry of entries)entry.draw(c);
  observed.push({generation,scenario,entries:Array.from(entries,e=>({kind:e.kind,id:e.id,depth:e.depth})),pixelSha256:crypto.createHash('sha256').update(c.getImageData(0,0,160,160).data).digest('hex')});
 }
 assert.deepEqual(observed,golden.cases);
});
