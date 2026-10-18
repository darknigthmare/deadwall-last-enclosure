'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {C,R,clone,tick,boot,build,ascend,equip,snapshot}=require('./helpers/vertical177.cjs');

// Explicit advanced knowledge/supplies and completed-support fixture.
// Modules and lifts still use native paid financing and timed work.
for(const mode of ['off','day','night'])test('193 vertical power: '+mode+' circuit survives complete save and Continue with paid equipment',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'sentry');
 assert.equal(b.def.powerUse,R.modules.sentry.powerUse);
 assert.equal(g.save(false),true);
 const stock=clone(g.resources);
 assert.equal(g.powerGrid.setCircuit(b.id,mode),true);
 assert.deepEqual(g.resources,stock);
 assert.equal(g.save(false),true,'A real completed vertical consumer must remain saveable after circuit scheduling');
 assert.equal(g.load(),true);
 assert.equal(g.powerGrid.circuitMode(b.id),mode);
 assert.equal(g.vertical175.moduleRef(m.id).m.kind,'sentry');
 assert.deepEqual(g.resources,stock);
});

test('193 vertical power: a completed paid lift is a saveable consumer without electrical modules',()=>{
 const g=boot(),b=build(g);ascend(g,b);g.player.x=b.x;g.player.y=b.y;
 const before=clone(g.resources);
 assert.equal(g.vertical175.buildLift(b.id).ok,true);
 tick(g,R.lift.seconds+.2);
 assert.equal(b.def.powerUse,R.liftPower);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before[key]-(R.lift.cost[key]||0));
 assert.equal(g.powerGrid.setCircuit(b.id,'off'),true);
 assert.equal(g.save(false),true,'A completed lift must qualify as an electrical consumer');
 assert.equal(g.load(),true);
 assert.equal(g.powerGrid.circuitMode(b.id),'off');
 assert.equal(g.vertical175.snapshot().sites.find(s=>s.id===b.id).lift,1);
});

function assertCircuitRejected(g,b){
 assert.equal(g.powerGrid.setCircuit(b.id,'off'),false);
 const raw=g.serialize(),before=snapshot(g),world=g.world;
 raw.powerGrid.circuits.push({id:b.id,mode:'off'});
 assert.throws(()=>g.restoreSave(raw),/Circuit sans consommateur achevé/);
 assert.equal(g.world,world);
 assert.deepEqual(snapshot(g),before);
}

test('193 vertical power: an empty completed support cannot acquire an imported circuit',()=>{
 const g=boot(),b=build(g);assert.equal(b.def.powerUse,0);assertCircuitRejected(g,b);
});

test('193 vertical power: a paid unfinished electrical module supplies no valid imported circuit',()=>{
 const g=boot(),b=build(g);ascend(g,b);g.player.x=b.x;g.player.y=b.y;
 assert.equal(g.vertical175.buildModule('sentry',0,b.id).ok,true);tick(g,1);
 assert.equal(b.def.powerUse,0);assertCircuitRejected(g,b);
});

test('193 vertical power: malformed electrical equipment never authorizes a saved circuit',()=>{
 const g=boot(),b=build(g),m=equip(g,b,'sentry'),raw=g.serialize(),before=snapshot(g),world=g.world;
 raw.powerGrid.circuits.push({id:b.id,mode:'off'});
 const module=raw.expansions127.modules.vertical175.sites.find(s=>s.id===b.id).decks[0].modules.find(v=>v.id===m.id);
 module.health=R.modules.sentry.health+1;
 assert.throws(()=>g.restoreSave(raw));assert.equal(g.world,world);assert.deepEqual(snapshot(g),before);
});
