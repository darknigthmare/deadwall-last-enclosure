'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),P=require('../src/biome-population165.js'),{boot131}=require('./helpers/expansions131.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
function fixture(distance=5){
 const{g}=boot131({generation:8,seed:'17117'}),w=g.frontier.world(),animal=P.candidate(w,'A165_2_0_0'),contact=P.candidate(w,'N165_2_0_0');assert.ok(animal&&contact);assert.ok(P.admitted(w,animal)&&P.admitted(w,contact));
 const d=copy(g.serialize());Object.assign(d.frontier,{active:true,x:animal.x-distance,y:animal.y,z:0,inside:null,a:0,anchor:{x:d.player.x,y:d.player.y}});assert.equal(w.blocked(d.frontier.x,d.frontier.y,.32,0,null),false);
 assert.equal(g.restoreSave(d),true);g.paused=false;g.activeOverlay=null;g.input.keys.clear();g.input.pressed.clear();return{g,animal,contact};
}
const tick=(g,n=1)=>{for(let i=0;i<n;i++)g.update(.1);};

test('165 actual fauna and natural infected spawn on admitted ground; observation cannot populate a campaign',()=>{
 const{g,animal,contact}=fixture(),before=copy(g.frontier.snapshot());assert.deepEqual(g.frontier.wildlife165(),[]);g.frontier.overview();assert.deepEqual(g.frontier.snapshot(),before);
 tick(g);const a=g.frontier.wildlife165().find(q=>q.id===animal.id),n=g.frontier.contacts().find(q=>q.id===contact.id);assert.ok(a&&n);assert.equal(a.species,'roeDeer');assert.equal(n.kind,contact.profile.kind);assert.equal(n.maxHealth,contact.profile.health);
 assert.equal(a.moving,true);assert.ok(a.x>animal.x,'The deer flees the real visible commander');assert.ok(a.stride165>0&&a.stride165<C.BiomePopulation165Rules.maxStride);
 const snapshot=copy(g.frontier.snapshot());for(let i=0;i<3;i++){g.frontier.wildlife165();g.frontier.overview();}assert.deepEqual(g.frontier.snapshot(),snapshot);
});

test('165 natural encounter wounds and deaths survive actual save/menu/Continue without replenishment or loot',()=>{
 const{g,animal,contact}=fixture();tick(g);const carry=copy(g.player.carry),regionalKills=g.frontier.snapshot().kills;
 assert.equal(g.frontier.hitEnemy(animal.id,7),true);assert.equal(g.frontier.hitEnemy(contact.id,5),true);let saved=copy(g.frontier.snapshot());assert.equal(saved.wildlife165[animal.id].hp,animal.profile.health-7);assert.equal(saved.enemies[contact.id],contact.profile.health-5);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(g.frontier.snapshot(),saved);assert.equal(g.frontier.wildlife165().find(q=>q.id===animal.id).hp,animal.profile.health-7);
 tick(g);assert.equal(g.frontier.contacts().find(q=>q.id===contact.id).hp,contact.profile.health-5);assert.equal(g.frontier.hitEnemy(animal.id,100),true);assert.equal(g.frontier.hitEnemy(contact.id,100),true);
 saved=copy(g.frontier.snapshot());assert.equal(saved.wildlife165[animal.id].hp,0);assert.equal(saved.enemies[contact.id],0);assert.equal(saved.kills,regionalKills+1);assert.deepEqual(g.player.carry,carry);
 assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);tick(g,4);assert.equal(g.frontier.wildlife165().some(q=>q.id===animal.id),false);assert.equal(g.frontier.contacts().some(q=>q.id===contact.id),false);
 assert.equal(g.frontier.snapshot().wildlife165[animal.id].hp,0);assert.equal(g.frontier.enemyHealth(contact.id),0);assert.deepEqual(g.player.carry,carry);
});

test('165 actual paid projectiles hit an animal through the finite regional ledger',()=>{
 const{g,animal}=fixture(2),rounds=g.player.magazine.pistol,health=animal.profile.health;assert.ok(rounds>0);assert.equal(g.frontier.shoot(),true);assert.equal(g.player.magazine.pistol,rounds-1);tick(g);
 const record=g.frontier.snapshot().wildlife165[animal.id];assert.ok(record);assert.equal(record.hp,Math.max(0,health-C.WEAPONS.pistol.damage));assert.equal(g.frontier.snapshot().kills,0);assert.equal(g.restoreSave(copy(g.serialize())),true);
});

test('165 alarm and gait remain finite, collisions stay real, and paused reads advance neither position nor phase',()=>{
 const{g,animal}=fixture();tick(g);for(let i=0;i<150;i++){tick(g);const a=g.frontier.wildlife165().find(q=>q.id===animal.id);if(!a)continue;assert.ok(Math.hypot(a.x-animal.x,a.y-animal.y)<=C.BiomePopulation165Rules.animalDrift+1e-6);assert.equal(g.frontier.world().blocked(a.x,a.y,a.radius,0,null),false);assert.ok(a.stride165>=0&&a.stride165<C.BiomePopulation165Rules.maxStride);}
 const before=copy(g.frontier.snapshot());g.paused=true;tick(g,5);g.frontier.wildlife165();assert.deepEqual(g.frontier.snapshot(),before);assert.equal(g.restoreSave(copy(g.serialize())),true);
});

test('165 a small animal fleeing toward the world edge retains a saveable regional pose',()=>{
 const{g}=boot131({generation:8,seed:'17117'}),w=g.frontier.world(),q=P.candidate(w,'A165_67_0_0');assert.ok(q);assert.equal(q.species,'hare');assert.ok(q.radius<WORLD_INSET());assert.ok(P.admitted(w,q));
 const d=copy(g.serialize());Object.assign(d.frontier,{active:true,x:q.x,y:q.y+3,z:0,inside:null,a:-Math.PI/2,anchor:{x:d.player.x,y:d.player.y}});assert.equal(w.blocked(d.frontier.x,d.frontier.y,.32,0,null),false);
 assert.equal(g.restoreSave(d),true);g.paused=false;g.activeOverlay=null;g.input.keys.clear();g.input.pressed.clear();tick(g,80);
 const record=g.frontier.snapshot().wildlife165[q.id];assert.ok(record);assert.ok(record.y>=WORLD_INSET());assert.ok(record.y<q.y);assert.equal(g.restoreSave(copy(g.serialize())),true);
});
function WORLD_INSET(){return require('../src/frontier-world.js').RULES.footRadius;}
