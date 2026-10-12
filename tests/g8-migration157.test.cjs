'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');
const G=require('../src/frontier-geometry.js');
const W=require('../src/frontier-world.js');
const S=require('../src/frontier-state.js');
const D=require('../src/seed-detail157.js');
const R=require('../src/codex3000-runtime.js');
const Ops=require('../src/world-pack131.js');
const {boot127}=require('./helpers/expansions127.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
// Serialization stamps wall-clock time on every read; all persisted game data
// must remain identical independently of that metadata.
const checkpoint=g=>{const d=g.serialize();delete d.timestamp;return d;};
let oldWorld,newWorld;
const worlds=()=>({old:oldWorld||(oldWorld=W.create(17117,7)),next:newWorld||(newWorld=W.create(17117,8))});

test('G8 migration keeps harvested G7 resource identities as finite cleared records',()=>{
 const {old,next}=worlds(),before=old.chunk(69,31),after=next.chunk(69,31);
 const tree=before.trees.find(o=>o.id==='T69_31_126');assert.ok(tree);
 const state=S.initial();Object.assign(state,{generation:7,x:old.home.maxX+2,y:old.home.y});state.taken[tree.id]=1;
 assert.equal(S.validate(state,{worldSeed:17117}).taken[tree.id],1);
 state.generation=8;
 assert.equal(S.validate(state,{worldSeed:17117}).taken[tree.id],1);
 assert.ok(![...after.trees,...after.rocks].some(o=>o.id===tree.id),'cleared tree must not remain harvestable');
 assert.deepEqual(after.cleared.find(o=>o.id===tree.id),tree);
 const forged=copy(state);forged.taken[tree.id]=tree.amount+.01;
 assert.throws(()=>S.validate(forged,{worldSeed:17117}),/Prélèvement supérieur/);
});

test('G8 plots retain every previous finite scatter budget without creating replacement resources',()=>{
 const {old,next}=worlds();
 for(const [x,y] of [[69,31],[9,1],[48,48],[62,37]]){
  const a=old.chunk(x,y),b=next.chunk(x,y),sort=items=>items.slice().sort((u,v)=>u.id.localeCompare(v.id));
  assert.deepEqual(sort([...b.trees,...b.rocks,...(b.cleared||[])]),sort([...a.trees,...a.rocks]),'historical scatter '+x+','+y);
  const ids=[...b.trees,...b.rocks,...(b.cleared||[])].map(o=>o.id);
  assert.equal(ids.length,new Set(ids).size,'resource copied into two budgets');
 }
 const initial=copy(next.chunk(69,31));for(let i=0;i<35;i++)next.chunk(i,80);
 assert.deepEqual(next.chunk(69,31),initial,'stream eviction changed the cleared stock');
});

test('Programme-native details use their actual family for variants, fences and room furniture',()=>{
 const p={id:'P1267',type:'codex3000-0001',x:400,y:400,a:0,w:40,h:40,levels:[0],parking:[],outdoor:[]};
 const plan={objects:[],walls:[],stairs:[],rooms:[{name:'Salle principale',x:2,y:2,w:36,h:36}]};
 let fences=0;
 for(const family of ['residence','medical','education','industrie'])for(let seed=0;seed<16;seed++){
  const d=D.make(seed,p,0,plan,{family});assert.equal(d.family,family);
  assert.ok(D.profiles[family].variants.includes(d.variant),family+' chose '+d.variant);
  assert.ok(d.interior.every(o=>D.profiles[family].interior.includes(o.kind)),family+' mismatched furniture');
  if(family==='residence')fences+=d.outdoor.filter(o=>o.kind==='fence'||o.kind==='hedge'&&o.w>10).length;
  assert.ok([...d.interior,...d.outdoor].every(o=>o.amount===undefined));
 }
 assert.ok(fences>0,'residential programme has no garden boundary');
 const {next}=worlds(),home=next.pois.find(q=>q.programme3000==='DW-0001');assert.ok(home);
 const detail=next.detailAt(home,0);assert.equal(R.detailFamily(R.get(home.codex).family),'residence');
 assert.ok(D.profiles.residence.variants.includes(detail.variant));
});

function campaign(){
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');
 require('./helpers/generation141.cjs').legacy(g,7);
 assert.equal(g.frontier.position().generation,7,'Manual extension scenarios start from an explicitly preserved G7 campaign');
 standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();return g;
}
const activate=g=>g.worldOps131.actions().find(a=>a.id==='expandCodex3000').run();

test('G8 extension control reports the same reload restriction as its actual action',()=>{
 const g=campaign();g.player.reload=1;const before=checkpoint(g),action=g.worldOps131.actions().find(a=>a.id==='expandCodex3000');
 assert.equal(action.disabled,true);assert.match(action.reason,/rechargement/i);
 const result=action.run();assert.equal(result.ok,false);assert.equal(result.reason,action.reason);assert.deepEqual(checkpoint(g),before);
 g.player.reload=0;assert.equal(g.worldOps131.actions().find(a=>a.id==='expandCodex3000').disabled,false);
});

test('G8 activation preserves paid sector surveys, harvested stock and the complete local campaign',()=>{
 const g=campaign(),{old,next}=worlds(),sector=old.sectors.find(s=>s.id==='S9_1');
 assert.ok(sector.sites.length&&next.sectors.find(s=>s.id===sector.id).sites.length>sector.sites.length);
 const data=g.serialize();data.frontier.seen=sector.sites.slice();data.frontier.taken.T69_31_126=1;
 data.expansions127.modules.world131.surveyed=[sector.id];assert.equal(g.restoreSave(data),true);
 const before=g.serialize(),result=activate(g);assert.equal(result.ok,true,result.reason);
 const after=g.serialize();assert.equal(after.frontier.generation,8);
 assert.deepEqual(after.expansions127.modules.world131,before.expansions127.modules.world131);
 assert.deepEqual(after.frontier.taken,before.frontier.taken);
 assert.deepEqual(after.resources,before.resources);assert.deepEqual(after.nodes,before.nodes);
 assert.deepEqual(after.player,before.player);assert.equal(after.randomState,before.randomState);
 assert.ok(next.sectors.find(s=>s.id===sector.id).sites.every(id=>after.frontier.seen.includes(id)));
 assert.ok(after.frontier.seen.every(id=>before.frontier.seen.includes(id)||next.sectors.find(s=>s.id===sector.id).sites.includes(id)),'unpaid sector revealed');
 assert.equal(g.restoreSave(after),true);const restored=g.serialize();delete restored.timestamp;const expected=copy(after);delete expected.timestamp;assert.deepEqual(restored,expected);
});

test('G8 activation refuses to overwrite a placed camp and keeps the entire save intact',()=>{
 const g=campaign(),{old,next}=worlds(),point={x:17801.45576276306,y:8060.641223334575};
 assert.equal(old.blocked(point.x,point.y,C.SurvivalPackRules.campRadius),false);
 assert.equal(next.blocked(point.x,point.y,C.SurvivalPackRules.campRadius),true);
 const data=g.serialize(),survival=data.expansions127.modules.survival;
 survival.serial=2;survival.camps=[{id:1,domain:'region',...point,z:0,inside:null,left:300,cover:0}];
 assert.equal(g.restoreSave(data),true);const before=checkpoint(g),result=activate(g);
 assert.equal(result.ok,false);assert.match(result.reason,/bivouac/i);assert.deepEqual(checkpoint(g),before);
 const atCamp=g.serialize();Object.assign(atCamp.frontier,{active:true,...point,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 assert.equal(g.restoreSave(atCamp),true);assert.equal(g.survivalPack.dismantle().ok,true);
 const home=g.serialize();Object.assign(home.frontier,{active:false,anchor:null});assert.equal(g.restoreSave(home),true);
 const supplies=copy(g.resources);assert.equal(activate(g).ok,true);assert.deepEqual(g.resources,supplies);
 assert.equal(g.survivalPack.snapshot().camps.length,0);
});

test('G8 activation refuses to overwrite an existing placed light',()=>{
 const g=campaign(),point={x:17801.45576276306,y:8060.641223334575},data=g.serialize();
 data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:60,on:false,used:true,domain:'region',...point,z:0,inside:null,angle:0}]};
 assert.equal(g.restoreSave(data),true);const before=checkpoint(g),result=activate(g);
 assert.equal(result.ok,false);assert.match(result.reason,/éclairage/i);assert.deepEqual(checkpoint(g),before);
 const atLight=g.serialize();Object.assign(atLight.frontier,{active:true,...point,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 assert.equal(g.restoreSave(atLight),true);assert.equal(g.nightGear.pickup(1).ok,true);
 const home=g.serialize();Object.assign(home.frontier,{active:false,anchor:null});assert.equal(g.restoreSave(home),true);
 const supplies=copy(g.resources);assert.equal(activate(g).ok,true);assert.deepEqual(g.resources,supplies);
 assert.equal(g.nightGear.snapshot().devices[0].location,'belt');assert.equal(g.nightGear.snapshot().devices[0].left,60);
});

test('G8 activation protects the parked paid vehicle and preserves its cargo, fuel and identity',()=>{
 const g=campaign(),{old,next}=worlds(),core=g.core();let garage;
 for(let x=67;x<82&&!garage;x++)for(let y=59;y<77&&!garage;y++)if(g.world.placement(C.BUILDINGS.expeditionGarage,x,y,0).valid){garage=new(core.constructor)(g.nextId++,'expeditionGarage',x,y,0,1);g.world.add(garage);}
 assert.ok(garage,'prepared completed garage fixture');g.refreshMetrics(true);standAt(g,g.player,g.core());
 assert.equal(g.expeditions.buildCar().ok,true,'vehicle must be paid through actual controller');
 const p=next.pois.find(q=>q.programme3000==='DW-0001'),profile=g.worldEvolution.vehicleProfile();let point;
 for(let y=0;y<=p.h&&!point;y+=.5){const q=G.global(p,0,y);if(old.vehicleClear(q.x,q.y,0,profile.w,profile.h)&&!next.vehicleClear(q.x,q.y,0,profile.w,profile.h))point=q;}
 assert.ok(point,'new wall covers a previously clear parked vehicle');
 const data=g.serialize(),v=data.expeditions.vehicle;v.fuel=3;v.cargo.scrap=4;
 data.frontier.car={id:v.id,...point,a:0,driving:false};assert.equal(g.restoreSave(data),true);
 const before=checkpoint(g),result=activate(g);assert.equal(result.ok,false);assert.match(result.reason,/voiture/i);assert.deepEqual(checkpoint(g),before);
});

test('Absent legacy detail flags retain traversable saved positions while new campaigns opt in',()=>{
 const {old}=worlds(),p=old.pois.find(q=>q.type==='house'),detail=old.detailAt(p,0);
 const item=detail.outdoor.find(o=>o.kind==='fence'||D.objects[o.kind]?.[2]);assert.ok(item);
 const point=G.global(p,item.x+item.w/2,item.y+item.h/2);
 const g=campaign();assert.equal(g.frontier.snapshot().detailVersion,1);
 const data=g.serialize();delete data.frontier.detailVersion;
 Object.assign(data.frontier,{active:true,...point,z:0,inside:null,anchor:{x:g.player.x,y:g.player.y}});
 assert.equal(S.normalize(data.frontier).detailVersion,0);
 assert.equal(g.restoreSave(data),true);assert.equal(g.frontier.snapshot().detailVersion,0);
 assert.equal(g.frontier.world().blocked(point.x,point.y,.32),false,'old save was trapped inside a new prop');
 const before=g.frontier.position();g.input.keys.add('KeyD');for(let i=0;i<10;i++)g.update(.04);g.input.keys.clear();
 assert.ok(Math.hypot(g.frontier.position().x-before.x,g.frontier.position().y-before.y)>.05,'saved actor cannot move');
 const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.equal(g.frontier.snapshot().detailVersion,0);
 for(const value of [-1,2,'1',true,null])assert.throws(()=>S.normalize({...saved.frontier,detailVersion:value}),/Détail/);
});
