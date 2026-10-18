'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core.js'),{boot127}=require('./helpers/expansions127.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),material=g=>{const d=copy(g.serialize());delete d.timestamp;return d;};
function fixture(){
 const {game:g}=boot127();require('../src/world-pack131.js').install(g);const api=require('../src/forage193.js');api.install(g);g.startNew('standard','17117','classic','balanced');
 const F=require('../src/biome-forage193.js'),w=g.frontier.world();let node,point;
 const cx=Math.floor(w.home.x/256),cy=Math.floor(w.home.y/256);
 for(let ring=2;ring<=9&&!node;ring++)for(let dy=-ring;dy<=ring&&!node;dy++)for(let dx=-ring;dx<=ring&&!node;dx++)for(const q of F.chunk(w,cx+dx,cy+dy)){
  for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const p={x:q.x+Math.cos(a),y:q.y+Math.sin(a)};if(!w.blocked(p.x,p.y,.32,0,null)&&w.movementLine(p,q,0,null,null,.05)){node=q;point=p;break;}}
 }
 assert.ok(node,'A real admitted finite node with a physically clear approach exists');
 const raw=copy(g.serialize());Object.assign(raw.frontier,{active:true,anchor:{x:g.player.x,y:g.player.y},...point,z:0,inside:null});assert.equal(g.restoreSave(raw),true);g.togglePause(false);g.releaseInputs();
 assert.equal(g.forage193.quote(node.id).ok,true);return{g,node,api};
}
function finish(g,node){assert.equal(g.forage193.begin(node.id).ok,true);for(let i=0;i<100&&g.forage193.busy();i++)g.forage193.step(.25);assert.equal(g.forage193.busy(),false);}
test('193 finite gathering commits once into the real backpack, keeps depot/RNG unchanged and survives Continue',()=>{
 const {g,node}=fixture(),stocks={...g.resources},rng=g.random.state,bag={...g.player.carry},gathered=g.stats.gathered;
 finish(g,node);assert.equal(g.player.carry[node.resource]-bag[node.resource],node.amount);assert.equal(g.stats.gathered-gathered,node.amount);assert.deepEqual(g.resources,stocks);assert.equal(g.random.state,rng);assert.deepEqual(g.forage193.snapshot().harvested,[node.id]);
 const before=material(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(material(g),before);g.togglePause(false);
 assert.equal(g.forage193.begin(node.id).ok,false);assert.deepEqual(material(g),before,'An exhausted finite node never grants another lot');
 assert.equal(g.startNew('standard','17117','classic','invalid'),false);assert.deepEqual(g.forage193.snapshot(),before.expansions127.modules.forage193,'A rejected new campaign preserves the finite history');
});
test('193 real work refuses a full backpack, a second owner, a higher floor and a physical obstruction atomically',()=>{
 const {g,node}=fixture(),assertUnchanged=action=>{const before=material(g);assert.equal(action().ok,false);assert.deepEqual(material(g),before);};
 g.player.carry.food=g.player.carryCapacity;assertUnchanged(()=>g.forage193.begin(node.id));g.player.carry.food=0;
 const busy=g.expansions.busy;g.expansions=Object.freeze({...g.expansions,busy:except=>except==='forage193'||busy(except)});assertUnchanged(()=>g.forage193.begin(node.id));g.expansions=Object.freeze({...g.expansions,busy});
 const p=g.frontier.position;g.frontier=Object.freeze({...g.frontier,position:()=>({...p(),z:1})});assertUnchanged(()=>g.forage193.begin(node.id));g.frontier=Object.freeze({...g.frontier,position:p});
 const w=g.frontier.world(),line=w.movementLine;w.movementLine=()=>false;try{assertUnchanged(()=>g.forage193.begin(node.id));}finally{w.movementLine=line;}
});
test('193 pause suspends work and movement or a damage immediately followed by healing cancels without any inventory gain',()=>{
 const {g,node}=fixture(),bag={...g.player.carry},stocks={...g.resources};assert.equal(g.forage193.begin(node.id).ok,true);g.togglePause(true);g.forage193.step(100);assert.equal(g.forage193.presentation().progress,0);g.togglePause(false);
 const p=g.frontier.position;g.frontier=Object.freeze({...g.frontier,position:()=>({...p(),x:p().x+1})});g.forage193.step(.25);g.frontier=Object.freeze({...g.frontier,position:p});assert.equal(g.forage193.busy(),false);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.forage193.snapshot().harvested,[]);
 assert.equal(g.forage193.begin(node.id).ok,true);g.player.invulnerable=0;const hp=g.player.health;assert.equal(g.frontier.damage(1),true);g.player.health=hp;assert.equal(g.forage193.busy(),false,'The actual regional damage owner interrupts before a same-frame heal');g.forage193.step(100);assert.deepEqual(g.player.carry,bag);assert.deepEqual(g.resources,stocks);assert.deepEqual(g.forage193.snapshot().harvested,[]);
});
test('193 loading an unfinished task never grants a lot and absent legacy module requires a paid one-time depot activation',()=>{
 const {g,node}=fixture();assert.equal(g.forage193.begin(node.id).ok,true);g.forage193.step(.25);const saved=copy(g.serialize());assert.equal(g.restoreSave(saved),true);assert.equal(g.forage193.busy(),false);assert.deepEqual(g.forage193.snapshot().harvested,[]);
 const old=copy(g.serialize());delete old.expansions127.modules.forage193;assert.equal(g.restoreSave(old),true);assert.equal(g.forage193.active(),false);const outside=material(g);assert.equal(g.forage193.activate().ok,false);assert.deepEqual(material(g),outside);
 const depot=copy(g.serialize()),access=g.fieldcraft.service(g.player,g.core());assert.ok(access);Object.assign(depot.player,access);depot.player.carry.food=4;Object.assign(depot.frontier,{active:false,anchor:null,z:0,inside:null});assert.equal(g.restoreSave(depot),true);g.togglePause(false);const stocks={...g.resources},rng=g.random.state;
 assert.equal(g.forage193.activate().ok,true);assert.equal(g.player.carry.food,0);assert.deepEqual(g.resources,stocks);assert.equal(g.random.state,rng);const activated=material(g);assert.equal(g.forage193.activate().ok,false);assert.deepEqual(material(g),activated,'There is no off/on path that refreshes finite nodes');
});
test('193 strict history rejects malformed, duplicate and absent seeded nodes before replacing the world',()=>{
 const {g,node,api}=fixture();assert.deepEqual(api.validate(undefined),{version:1,enabled:false,harvested:[]});
 for(const raw of [{version:1,enabled:false,harvested:[node.id]},{version:1,enabled:true,harvested:[node.id,node.id]},{version:1,enabled:true,harvested:['F193_99_99_0']},{version:1,enabled:true,harvested:[node.id],stock:{food:1}}]){
  const full=copy(g.serialize());full.expansions127.modules.forage193=raw;const world=g.world,before=material(g);assert.throws(()=>g.restoreSave(full),/cueillette193/);assert.equal(g.world,world);assert.deepEqual(material(g),before);
 }
});
test('193 all added slots2–15 import and Continue as finite identities, while slot16 and noncanonical spellings fail atomically',()=>{
 const {g}=fixture(),F=require('../src/biome-forage193.js'),w=g.frontier.world(),ids=[];
 assert.equal(C.Forage193Rules.candidates,16);
 for(let slot=2;slot<16;slot++){
  let found=null;for(let cy=0;cy<12&&!found;cy++)for(let cx=0;cx<12&&!found;cx++)found=F.candidate(w,'F193_'+cx+'_'+cy+'_'+slot);
  assert.ok(found,'A real generated potential exists in added slot'+slot);ids.push(found.id);
 }
 // Prepared historical ledger only: no inventory, progress or earned harvest is assigned.
 const raw=copy(g.serialize());raw.expansions127.modules.forage193={version:1,enabled:true,harvested:ids};assert.equal(g.restoreSave(raw),true);
 const before=material(g);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(material(g),before);assert.deepEqual(g.forage193.snapshot().harvested,ids);
 for(const id of ['F193_0_0_16','F193_0_0_02','F193_00_0_2','F193_0_0_2junk']){
  const bad=copy(g.serialize());bad.expansions127.modules.forage193.harvested=[id];const world=g.world;assert.throws(()=>g.restoreSave(bad),/cueillette193/);assert.equal(g.world,world);assert.deepEqual(material(g),before);
 }
});
test('193 a recently presented node cannot bypass a fresh physical veto at the transaction owner',()=>{
 const {g,node}=fixture(),w=g.frontier.world(),blocked=w.blocked;assert.ok(g.forage193.visible().some(q=>q.id===node.id));
 w.blocked=(x,y,...rest)=>Math.hypot(x-node.x,y-node.y)<.01||blocked(x,y,...rest);
 try{const before=material(g);assert.equal(g.forage193.begin(node.id).ok,false);assert.deepEqual(material(g),before);assert.deepEqual(g.forage193.snapshot().harvested,[]);}finally{w.blocked=blocked;}
});
