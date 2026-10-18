'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('./helpers/vertical177.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const Loadout=require('../src/loadout129.js'),C=H.C,R=C.FortificationPackRules;
const profiles=['runnerCable193','breachClamp193','enduranceRack193','shieldTongs193','quickCable193','siegeBrake193'];
const copy=v=>JSON.parse(JSON.stringify(v));
function add(g,type,x=72,y=72){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}
function fixture(){
 // Advanced age, completed prerequisites and cleared nodes without loot are
 // declared model fixtures. The real backpack remains its native 36 units.
 const g=H.boot();Loadout.install(g);g.units=[];for(const n of g.world.nodes)n.harvest(n.amount);
 add(g,'workshop',82,72);const b=add(g,'spikes');assert.equal(g.player.carryCapacity,36);return{g,b};
}
function supplies(g,cost){
 standAt(g,g.player,g.core());assert.ok(C.bagTotal(cost)<=g.player.carryCapacity,'recipe must fit a real unexpanded backpack');
 for(const[k,n]of Object.entries(cost)){const q=g.loadout.transfer('depot','sac',k,n);assert.ok(q.ok,k+': '+q.reason);assert.equal(q.amount,n);}
}
const fitting=(g,b)=>g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);
const mechanism=(g,b)=>fitting(g,b)?.mechanism;
function rearmCost(g,b){const m=mechanism(g,b),d=R.mechanisms[m.kind];return Object.fromEntries(Object.entries(d.cost).map(([k,n])=>[k,Math.ceil(n*R.mechanismRearmCostFactor*(d.charges-m.charges)/d.charges)]));}
function work(g,seconds){for(let t=0;t<seconds-1e-8;t+=.1)g.fortificationPack.step(Math.min(.1,seconds-t));}
function finish(g){for(let i=0;i<600&&g.fortificationPack.busy();i++)g.fortificationPack.step(.1);assert.equal(g.fortificationPack.busy(),false,g.fortificationPack.overview().summary);}
function install(kind){const f=fixture(),{g,b}=f;supplies(g,R.mechanisms[kind].cost);g.selectBuilding(b);standAt(g,g.player,b);assert.ok(g.fortificationPack.startMechanism(kind,b.id).ok);finish(g);return f;}
function enemy(g,b,kind='walker'){
 assert.ok(g.spawnZombie(kind));const z=g.zombies.at(-1);z.x=b.right+z.radius+R.mechanismContactReach-1;z.y=b.y;z.lastX=z.x;z.lastY=z.y;
 standAt(g,g.player,g.core());g.rebuildBuckets();return z;
}
function fire(f,kind){const z=enemy(f.g,f.b,kind),before=z.health;f.g.updateZombies(.04);f.g.rebuildBuckets();return{z,before};}
function retire(g,z){if(!z.dead)g.killZombie(z,false);g.zombies=g.zombies.filter(e=>!e.dead);g.rebuildBuckets();}
function saved(g){const s=copy(g.serialize());delete s.timestamp;return s;}

for(const kind of profiles)test('193 '+kind+' has a real affordable quote, paid completion and exact persistent charges',()=>{
 const {g,b}=fixture(),d=R.mechanisms[kind];supplies(g,d.cost);g.selectBuilding(b);standAt(g,g.player,b);
 const before=saved(g),bag=copy(g.player.carry),stock=copy(g.resources);
 for(let i=0;i<4;i++)assert.ok(g.fortificationPack.previewMechanism(kind,b.id).ok);assert.deepEqual(saved(g),before);
 assert.ok(g.fortificationPack.startMechanism(kind,b.id).ok);work(g,d.seconds-.2);assert.equal(mechanism(g,b),undefined);assert.deepEqual(g.player.carry,bag);
 finish(g);const m=mechanism(g,b);assert.equal(m.kind,kind);assert.equal(m.charges,d.charges);assert.deepEqual(g.resources,stock);
 for(const[k,n]of Object.entries(d.cost))assert.equal(g.player.carry[k],bag[k]-n);
 const paid=copy(g.player.carry);work(g,5);assert.deepEqual(g.player.carry,paid);assert.equal(g.fortificationPack.startMechanism(kind,b.id).ok,false);
 const raw=g.serialize();assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(raw));assert.ok(g.restoreSave(raw));assert.deepEqual(mechanism(g,g.world.buildings.get(b.id)),m);
});

for(const kind of profiles)test('193 '+kind+' targets its physical profiles, spends once and applies its actual impact or hold',()=>{
 const f=install(kind),d=R.mechanisms[kind];
 if(d.targetKinds){const other=Object.keys(C.ENEMIES).find(k=>!d.targetKinds.includes(k)),z=enemy(f.g,f.b,other),hp=z.health;
  f.g.updateZombies(.04);assert.equal(mechanism(f.g,f.b).charges,d.charges);assert.equal(z.health,hp);retire(f.g,z);
 }
 const kindTarget=d.targetKinds?.[0]||'walker',{z,before}=fire(f,kindTarget);assert.equal(mechanism(f.g,f.b).charges,d.charges-1);assert.equal(z.health,before-d.damage);
 if(d.holdSeconds){assert.ok(z.stagger>0);assert.ok(z.attackCooldown>0);assert.equal(mechanism(f.g,f.b).caught.length,1);}
 else assert.equal(mechanism(f.g,f.b).caught.length,0);
 if(d.damage===0)assert.equal(z.health,before,'the quick cable buys time without granting hidden damage');
});

for(const kind of profiles)test('193 '+kind+' exhausts exactly its finite stock and rearming preserves its existing cycle',()=>{
 const f=install(kind),{g,b}=f,d=R.mechanisms[kind],target=d.targetKinds?.[0]||'walker';
 for(let n=0;n<d.charges;n++){
  for(let i=0;i<80&&(mechanism(g,b)?.cooldown||0)>0;i++)g.updateZombies(.25);
  const {z}=fire(f,target);assert.equal(mechanism(g,b).charges,d.charges-n-1);retire(g,z);
 }
 const exhausted=fire(f,target);assert.equal(mechanism(g,b).charges,0);assert.equal(exhausted.z.health,exhausted.before);retire(g,exhausted.z);
 supplies(g,rearmCost(g,b));g.selectBuilding(b);standAt(g,g.player,b);const quote=g.fortificationPack.previewMechanismRearm(b.id);assert.ok(quote.ok,quote.reason);assert.equal(quote.amount,d.charges);
 assert.deepEqual(quote.cost,Object.fromEntries(Object.entries(d.cost).map(([k,n])=>[k,Math.ceil(n*R.mechanismRearmCostFactor)])));
 const before=mechanism(g,b),bag=copy(g.player.carry),stock=copy(g.resources);
 assert.ok(g.fortificationPack.startMechanismRearm(b.id).ok);g.paused=true;work(g,5);assert.equal(g.fortificationPack.job.elapsed,0);assert.deepEqual(g.player.carry,bag);g.paused=false;
 finish(g);const after=mechanism(g,b);assert.equal(after.charges,d.charges);assert.equal(after.cooldown,before.cooldown);assert.deepEqual(after.caught,before.caught);assert.deepEqual(g.resources,stock);
 for(const[k,n]of Object.entries(quote.cost))assert.equal(g.player.carry[k],bag[k]-n);
 work(g,2);assert.equal(g.fortificationPack.startMechanismRearm(b.id).ok,false);const raw=g.serialize();assert.ok(g.restoreSave(raw));assert.deepEqual(mechanism(g,g.world.buildings.get(b.id)),after);
});

test('193 partial rearming charges only missing consumables and never clears a held target',()=>{
 const f=install('runnerCable193'),{g,b}=f,d=R.mechanisms.runnerCable193,{z}=fire(f,'runner');
 g.selectBuilding(b);standAt(g,g.player,b);assert.equal(g.fortificationPack.previewMechanismRearm(b.id).ok,false);retire(g,z);
 supplies(g,rearmCost(g,b));g.selectBuilding(b);standAt(g,g.player,b);const q=g.fortificationPack.previewMechanismRearm(b.id);assert.ok(q.ok);assert.equal(q.amount,1);
 assert.deepEqual(q.cost,Object.fromEntries(Object.entries(d.cost).map(([k,n])=>[k,Math.ceil(n*R.mechanismRearmCostFactor/d.charges)])));
 const before=saved(g);for(let i=0;i<4;i++)g.fortificationPack.previewMechanismRearm(b.id);assert.deepEqual(saved(g),before);
 const action=g.fortificationPack.actions().find(a=>a.id==='rearm-mechanism');assert.equal(action.disabled,false);assert.ok(action.description.includes(C.resourceText(q.cost)));assert.ok(action.run().ok);finish(g);assert.equal(mechanism(g,b).charges,d.charges);
});

for(const cause of ['move','wound','reload','tool','destroy','load','workshop'])test('193 rearming is interrupted by '+cause+' before payment or output',()=>{
 const f=install('enduranceRack193'),{g,b}=f,{z}=fire(f,'walker');retire(g,z);supplies(g,rearmCost(g,b));g.selectBuilding(b);standAt(g,g.player,b);
 assert.ok(g.fortificationPack.startMechanismRearm(b.id).ok);const bag=copy(g.player.carry),charges=mechanism(g,b).charges;
 if(cause==='move')g.player.x+=R.fieldSupplyMoveTolerance+1;if(cause==='wound')g.player.health--;if(cause==='reload')g.player.reload=1;
 if(cause==='tool')g.selectedBuild='woodWall';if(cause==='destroy')g.destroyBuilding(b);if(cause==='load')assert.ok(g.restoreSave(g.serialize()));
 if(cause==='workshop')g.destroyBuilding([...g.world.buildings.values()].find(b=>b.type==='workshop'));
 g.fortificationPack.step(.1);assert.equal(g.fortificationPack.busy(),false);assert.deepEqual(g.player.carry,bag);
 if(cause!=='destroy')assert.equal(mechanism(g,g.world.buildings.get(b.id)).charges,charges);
});

test('193 a genuine elevated contact cannot trigger or spend a ground cable through its floor',()=>{
 const g=H.boot();Loadout.install(g);for(const n of g.world.nodes)n.harvest(n.amount);const wall=H.build(g,'rampart48');
 add(g,'workshop',82,72);const b=add(g,'spikes',wall.gx+wall.w,wall.gy);supplies(g,R.mechanisms.runnerCable193.cost);g.selectBuilding(b);standAt(g,g.player,b);
 assert.ok(g.fortificationPack.startMechanism('runnerCable193',b.id).ok);finish(g);assert.ok(g.spawnZombie('runner'));const id=g.zombies.at(-1).id,raw=copy(g.serialize()),z=raw.zombies.find(z=>z.id===id);
 z.x=wall.right-14;z.y=b.y;raw.expansions127.modules.vertical175.climbers.push({id,site:wall.id,level:0,bridge:null,stair:null,side:0,lane:1,start:0,progress:1,stage:'roof',fallHeight:0});
 assert.ok(g.restoreSave(raw));const restored=g.zombies.find(z=>z.id===id),hp=restored.health,current=g.world.buildings.get(b.id);g.rebuildBuckets();assert.equal(g.vertical175.enemyPose(restored).z,48);
 g.updateZombies(.04);assert.equal(mechanism(g,current).charges,R.mechanisms.runnerCable193.charges);assert.equal(restored.health,hp);
});
