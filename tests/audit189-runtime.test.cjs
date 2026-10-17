'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),W=require('../src/frontier-world.js'),P=require('../src/biome-population165.js'),F=require('../src/wildlife189.js'),{boot131}=require('./helpers/expansions131.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
let natural;
function world(){return natural||(natural=W.create(17117,8,{ecologyVersion:1,hydrologyVersion:1,landscape189:'balanced'}));}
function find(mode){const w=world();for(let cy=0;cy<96;cy+=1)for(let cx=0;cx<96;cx+=1)for(let i=0;i<8;i++){const q=P.animal(w,cx,cy,i);if(q&&q.profile.mode===mode&&P.admitted(w,q))return q;}throw Error('No actual '+mode+' habitat');}
test('189 actual landscape and descriptors survive query order and chunk cache eviction',()=>{
 const w=world(),q=find('land'),before=copy(q),rng=JSON.stringify(w.geography);
 for(let i=0;i<1200;i++)P.animal(w,i%90,Math.floor(i/90),i%8);
 assert.deepEqual(copy(P.candidate(w,q.id)),before);assert.ok(P.cacheSize(w)<=C.BiomePopulation165Rules.candidateCache);assert.equal(JSON.stringify(w.geography),rng);
 assert.equal(P.candidate(w,'A165_2_0_0'),null);assert.equal(P.candidate({...w,landscape189:'classic'},q.id),null);
 for(const invalid of ['A189_01_1_0','A189_100_1_0','A189_1_1_8']){const descriptor=P.candidate(w,invalid);assert.ok(!descriptor||descriptor.id!==invalid);}
});
test('189 fish generate on real water, air and terrestrial guilds keep distinct collision rules',()=>{
 const w=world(),fish=find('swim');assert.equal(w.hydrology.sample(fish.x,fish.y).water,true);assert.equal(w.blocked(fish.x,fish.y,fish.radius,0,null),true,'player still cannot swim');assert.equal(F.clear(w,fish),true);
 const air=find('air');assert.equal(F.clear(w,air),true);assert.equal(P.admitted(w,find('land')),true);
});
test('189 new campaign profile persists with wounds/death while classic restart stays classic',()=>{
 const {g}=boot131({generation:8,seed:'17117'});assert.equal(g.frontier.snapshot().landscape189,undefined);
 g.startNew('standard','17117','classic','balanced');assert.equal(g.frontier.snapshot().landscape189,'balanced');const w=g.frontier.world();assert.equal(w.landscape189,'balanced');
 const animal=find('land');let point=null;for(let n=0;n<32&&!point;n++){const a=n/32*Math.PI*2,p={x:animal.x+Math.cos(a)*5,y:animal.y+Math.sin(a)*5};if(!w.blocked(p.x,p.y,.32,0,null))point=p;}assert.ok(point);
 const data=copy(g.serialize());Object.assign(data.frontier,{active:true,...point,z:0,inside:null,a:0,anchor:{x:data.player.x,y:data.player.y}});assert.equal(g.restoreSave(data),true);g.paused=false;g.activeOverlay=null;g.input.keys.clear();g.input.pressed.clear();g.update(.1);
 assert.ok(g.frontier.wildlife165().some(a=>a.id===animal.id));assert.equal(g.frontier.hitEnemy(animal.id,3),true);const saved=copy(g.frontier.snapshot());assert.equal(saved.wildlife165[animal.id].hp,animal.profile.health-3);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.frontier.snapshot(),saved);
 g.paused=false;g.activeOverlay=null;assert.equal(g.frontier.hitEnemy(animal.id,100),true);const carry=copy(g.player.carry),kills=g.frontier.snapshot().kills;assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);g.paused=false;g.activeOverlay=null;for(let i=0;i<8;i++)g.update(.1);
 assert.equal(g.frontier.snapshot().wildlife165[animal.id].hp,0);assert.ok(!g.frontier.wildlife165().some(a=>a.id===animal.id));assert.deepEqual(g.player.carry,carry);assert.equal(g.frontier.snapshot().kills,kills);
 g.startNew('standard','17117','classic','classic');assert.equal(g.frontier.snapshot().landscape189,undefined);assert.equal(g.frontier.world().landscape189,'classic');
});
test('189 swimmer record restores through authoritative validation, but a stranded fish is rejected atomically',()=>{
 const {g}=boot131({generation:8,seed:'17117'});g.startNew('standard','17117','classic','balanced');const q=find('swim'),d=copy(g.serialize());
 d.frontier.wildlife165[q.id]={x:q.x,y:q.y,a:0,hp:q.profile.health,alarm:0,stride:0};assert.equal(g.restoreSave(d),true);
 const before=g.world,bad=copy(d);bad.frontier.wildlife165[q.id].x=q.x+100;assert.throws(()=>g.restoreSave(bad));assert.equal(g.world,before);
 const wrong=copy(d);wrong.frontier.landscape189='classic';assert.throws(()=>g.restoreSave(wrong));assert.equal(g.world,before);
});

test('189 invalid landscape is refused before replacing or saving the current campaign',()=>{
 const {g}=boot131({generation:8,seed:'17117'}),before=g.world,old=g.frontier.snapshot();
 for(const profile of ['bogus',null,123,{}]){assert.equal(g.startNew('standard','22','classic',profile),false);assert.equal(g.world,before);assert.deepEqual(g.frontier.snapshot(),old);}
});
