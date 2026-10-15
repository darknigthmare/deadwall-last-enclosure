'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),W=require('../src/frontier-world.js'),P=require('../src/biome-population165.js'),Ops=require('../src/world-pack131.js');
const{boot127}=require('./helpers/expansions127.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const checkpoint=g=>{const data=copy(g.serialize());delete data.timestamp;return data;};
function depletedTreePose(world,taken){
 const R=C.BiomePopulation165Rules,cx=Math.floor(world.home.x/R.chunk),cy=Math.floor(world.home.y/R.chunk);
 for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++)for(let i=0;i<R.animalCandidates;i++){
  const animal=P.animal(world,cx+dx,cy+dy,i);if(!animal)continue;
  const contacts=[];for(let ny=-1;ny<=1;ny++)for(let nx=-1;nx<=1;nx++){const n=P.contact(world,cx+dx+nx,cy+dy+ny,0);if(n)contacts.push(n);}
  if(!contacts.length)continue;
  for(const chunk of world.around(animal.x,animal.y,R.animalDrift))for(const tree of chunk.trees){
   if(tree.r<=.22||Math.hypot(tree.x-animal.x,tree.y-animal.y)>R.animalDrift-2)continue;
   const radius=Math.max(animal.radius,C.FrontierTacticsRules.enemyRadius),offset=radius+.22;
   for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){const point={x:tree.x+Math.cos(angle)*offset,y:tree.y+Math.sin(angle)*offset};
    if(Math.hypot(point.x-animal.x,point.y-animal.y)>R.animalDrift)continue;
    const contact=contacts.find(q=>Math.hypot(q.x-point.x,q.y-point.y)<R.contactDrift-1);if(!contact||!world.blocked(point.x,point.y,radius,0,null))continue;
    taken[tree.id]=tree.amount;const clear=!world.blocked(point.x,point.y,radius,0,null);delete taken[tree.id];
    if(clear)return{animal,contact,tree,point};
   }
  }
 }
 assert.fail('The actual seeded forest must offer a formerly solid tree beside valid natural territories');
}

test('165 Continue validates living animals and natural contacts on an actually depleted tree, and refreshes earlier saves of the same seed',()=>{
 const{game:g}=boot127();Ops.install(g);g.startNew('standard','17117');
 const taken={},world=W.create(17117,8,{detailVersion:1,ecologyVersion:1,hydrologyVersion:1,resourceTaken:id=>taken[id]||0});
 const{animal,contact,tree,point}=depletedTreePose(world,taken),raw=copy(g.serialize());
 // Prepared late-state fixture: a real finite tree is exhausted, and both
 // generated species stand on its newly free edge. No acquisition is claimed.
 raw.frontier.taken[tree.id]=tree.amount;
 raw.frontier.enemies[contact.id]=contact.profile.health-2;
 raw.frontier.tracks[contact.id]={...point,z:0,a:0,mode:'idle',ttl:0,gx:point.x,gy:point.y,cool:0};
 raw.frontier.wildlife165[animal.id]={...point,a:0,hp:animal.profile.health-1,alarm:0,stride:.5};
 assert.equal(g.restoreSave(raw),true);const before=checkpoint(g),home=g.world;
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),before);
 const unharvested=copy(raw);unharvested.frontier.taken[tree.id]=0;const current=g.world;
 assert.throws(()=>g.restoreSave(unharvested),/Poursuite naturelle|Animal absent/);assert.equal(g.world,current);assert.deepEqual(checkpoint(g),before);
 assert.equal(g.restoreSave(copy(raw)),true);assert.deepEqual(checkpoint(g),before,'The failed old candidate must not poison the reusable geometry effects');
 const malformed=copy(raw);malformed.worldEvolution.structures[world.pois[0].id]=-1;
 const validWorld=g.world;assert.throws(()=>g.restoreSave(malformed));assert.equal(g.world,validWorld);assert.deepEqual(checkpoint(g),before,'Later strict owners must reject malformed raw effects before restoring the world');
 assert.equal(g.frontier.takenAmount(tree.id),tree.amount);assert.equal(g.frontier.snapshot().wildlife165[animal.id].hp,animal.profile.health-1);
 assert.notEqual(g.world,home,'The real Continue restored a new local world');
});

function destroyedWallPose(world,destroyed){
 const G=require('../src/frontier-geometry.js'),R=C.BiomePopulation165Rules;
 for(const site of world.pois){if(site.programme160||!site.levels.includes(0))continue;const plan=world.plan(site,0);
  for(const wall of plan.walls){if(Math.max(wall.w,wall.h)<1)continue;const point=G.global(site,wall.x+wall.w/2,wall.y+wall.h/2),cx=Math.floor(point.x/R.chunk),cy=Math.floor(point.y/R.chunk);
   const animals=[],contacts=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    for(let i=0;i<R.animalCandidates;i++){const a=P.animal(world,cx+dx,cy+dy,i);if(a&&Math.hypot(a.x-point.x,a.y-point.y)<R.animalDrift-1)animals.push(a);}
    const n=P.contact(world,cx+dx,cy+dy,0);if(n&&Math.hypot(n.x-point.x,n.y-point.y)<R.contactDrift-1)contacts.push(n);
   }
   if(!animals.length||!contacts.length)continue;const animal=animals[0],contact=contacts[0],radius=Math.max(animal.radius,contact.radius);
   if(!world.blocked(point.x,point.y,radius,0,null))continue;destroyed.add(site.id);const clear=!world.blocked(point.x,point.y,radius,0,null);destroyed.delete(site.id);
   if(clear)return{site,point,animal,contact};
  }
 }
 assert.fail('The actual region must offer a destroyed wall beside valid natural territories');
}

test('165 Continue reads current destruction for living animals and contacts instead of the previous same-seed save',()=>{
 const{game:g}=boot127();Ops.install(g);g.startNew('standard','17117');
 const destroyed=new Set(),world=W.create(17117,8,{detailVersion:1,ecologyVersion:1,hydrologyVersion:1,structureDestroyed:id=>destroyed.has(id)});
 const{site,point,animal,contact}=destroyedWallPose(world,destroyed),raw=copy(g.serialize());
 // Prepared fixture: a real historical wall has been destroyed; both generated
 // actors retain their existing profiles and no new reward is assigned.
 raw.worldEvolution.structures[site.id]=0;raw.frontier.seen=[site.id];
 raw.frontier.enemies[contact.id]=contact.profile.health-2;
 raw.frontier.tracks[contact.id]={...point,z:0,a:0,mode:'idle',ttl:0,gx:point.x,gy:point.y,cool:0};
 raw.frontier.wildlife165[animal.id]={...point,a:0,hp:animal.profile.health-1,alarm:0,stride:.5};
 assert.equal(g.restoreSave(raw),true);const before=checkpoint(g);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),before);
 const intact=copy(raw);intact.worldEvolution.structures[site.id]=1;const current=g.world;
 assert.throws(()=>g.restoreSave(intact),/Poursuite naturelle|Animal absent/);assert.equal(g.world,current);assert.deepEqual(checkpoint(g),before);
 assert.equal(g.restoreSave(copy(raw)),true);assert.deepEqual(checkpoint(g),before);
 const malformed=copy(raw);malformed.worldEvolution.structures[site.id]=-1;const validWorld=g.world;
 assert.throws(()=>g.restoreSave(malformed));assert.equal(g.world,validWorld);assert.deepEqual(checkpoint(g),before);
});
