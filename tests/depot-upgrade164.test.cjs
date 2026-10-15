'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/core.js');
require('../src/codex-context160.js');
const Ops=require('../src/world-pack131.js'),ContextOps=require('../src/context-operations160.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const copy=value=>JSON.parse(JSON.stringify(value)),checkpoint=g=>{const d=copy(g.serialize());delete d.timestamp;return d;};
function campaign(){const {game:g}=boot127();Ops.install(g);ContextOps.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();const activation=g.worldOps131.activateTerritories160();assert.equal(activation.ok,true,activation.reason);return g;}

test('164 sanitation activation explicitly requires composition revision twelve and a loaded fixtures module',()=>{
 const g=campaign(),before=checkpoint(g),action=g.worldOps131.actions().find(a=>a.id==='sanitationMedical164');
 assert.ok(action);assert.equal(action.disabled,true);assert.match(action.reason,/révision 12/);assert.equal(action.run().ok,false);assert.deepEqual(checkpoint(g),before);
 assert.equal(g.worldOps131.upgradeDetails159(12).ok,true);
 const module=globalThis.DeadwallCodexFixtures164;delete globalThis.DeadwallCodexFixtures164;
 try{const q=g.worldOps131.detailUpgradeStatus159(13);assert.equal(q.ok,false);assert.match(q.reason,/chargés/);}finally{globalThis.DeadwallCodexFixtures164=module;}
});

test('164 sanitation upgrade is atomic and preserves campaign stocks ecology completed works and Continue',()=>{
 const g=campaign();assert.equal(g.worldOps131.upgradeDetails159(12).ok,true);
 const site=g.frontier.world().contextSites160().find(p=>p.context160.operations.some(o=>o.kind==='pumpBasin'));
 const operation=site.context160.operations.find(o=>o.kind==='pumpBasin'),key=site.id+':160:'+operation.key;
 const data=copy(g.serialize());data.frontier.seen.push(site.id);data.expansions127.modules.context160={version:1,completed:[key]};
 const container=g.frontier.world().plan(site,0).objects.find(o=>o.amount>0);assert.ok(container);data.frontier.taken[container.id]=container.amount;
 data.worldEvolution.structures[site.id]=.7;assert.equal(g.restoreSave(data),true);
 const before=checkpoint(g),home=g.world,region=g.frontier.world(),restore=g.restoreSave;
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(13).ok,false);g.player.reload=0;
 g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(13).ok,false);assert.equal(g.world,home);assert.equal(g.frontier.world(),region);assert.deepEqual(checkpoint(g),before);}finally{g.restoreSave=restore;}
 const action=g.worldOps131.actions().find(a=>a.id==='sanitationMedical164');assert.equal(action.disabled,false);assert.equal(action.run().ok,true);
 const expected=copy(before);expected.frontier.detailVersion=13;assert.deepEqual(checkpoint(g),expected);
 assert.equal(g.frontier.world().ecologyVersion,1);assert.equal(g.frontier.world().contextCompleted160(key),true);
 assert.equal(g.frontier.takenAmount(container.id),container.amount);assert.equal(g.save(false),true);g.returnToMenu();assert.equal(g.load(),true);assert.deepEqual(checkpoint(g),expected);
 assert.equal(g.worldOps131.upgradeDetails159(13).ok,false);assert.equal(g.worldOps131.upgradeDetails159(14).ok,false);
});
