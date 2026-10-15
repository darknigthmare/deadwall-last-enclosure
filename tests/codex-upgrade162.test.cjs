'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Ops=require('../src/world-pack131.js'),W=require('../src/frontier-world.js'),G=require('../src/frontier-geometry.js');
const {boot127}=require('./helpers/expansions127.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
require('../src/codex-context160.js');
const copy=v=>JSON.parse(JSON.stringify(v));

test('162 depot furnishing: occupied hands and failed restore preserve all state; upgrade and Continue retain budgets and completed works',()=>{
 const ContextOps=require('../src/context-operations160.js'),{game:g}=boot127();Ops.install(g);ContextOps.install(g);
 g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 assert.equal(g.worldOps131.detailUpgradeStatus159(11).ok,false,'G9 or G10 is required');
 assert.equal(g.worldOps131.activateTerritories160().ok,true);
 const site=g.frontier.world().contextSites160().find(p=>p.context160.operations.some(o=>o.kind==='pumpBasin'));
 const op=site.context160.operations.find(o=>o.kind==='pumpBasin'),key=site.id+':160:'+op.key;
 const data=copy(g.serialize());data.frontier.detailVersion=10;data.frontier.seen.push(site.id);data.expansions127.modules.context160={version:1,completed:[key]};
 assert.equal(g.restoreSave(data),true);standAt(g,g.player,g.core());
 const snapshot=()=>{const d=copy(g.serialize());delete d.timestamp;return d;},before=snapshot(),restore=g.restoreSave;
 g.player.reload=1;assert.equal(g.worldOps131.upgradeDetails159(11).ok,false);g.player.reload=0;
 g.restoreSave=()=>false;try{assert.equal(g.worldOps131.upgradeDetails159(11).ok,false);assert.deepEqual(snapshot(),before);}finally{g.restoreSave=restore;}
 const action=g.worldOps131.actions().find(a=>a.id==='furnishing162');assert.ok(action&&!action.disabled);
 const result=action.run();assert.equal(result.ok,true,result.reason);const after=snapshot();assert.equal(after.frontier.detailVersion,11);
 assert.equal(g.frontier.world().contextCompleted160(key),true);after.frontier.detailVersion=10;assert.deepEqual(after,before);
 assert.equal(action.run().ok,false);const continued=copy(g.serialize());assert.equal(g.restoreSave(continued),true);assert.equal(g.frontier.snapshot().detailVersion,11);
 assert.equal(g.frontier.world().contextCompleted160(key),true);
});

test('162 depot furnishing: a saved lamp in a newly proposed solid refuses migration atomically',()=>{
 const {game:g}=boot127();Ops.install(g);g.startNew('standard','17117');standAt(g,g.player,g.core());g.input.keys.clear();g.input.pressed.clear();
 assert.equal(g.worldOps131.activateTerritories160().ok,true);
 const old=W.create(17117,10,{detailVersion:10}),next=W.create(17117,10,{detailVersion:11});let point;
 for(const p of next.contextSites160().filter(p=>!p.context160.profile)){
  for(const o of next.detailAt(p,0).interior.filter(o=>o.solid)){
   const q=G.global(p,o.x+o.w/2,o.y+o.h/2);
   if(!old.blocked(q.x,q.y,.4,0,p.id)&&next.blocked(q.x,q.y,.4,0,p.id)){point={...q,inside:p.id};break;}
  }if(point)break;
 }
 assert.ok(point,'The saved fixture must occupy a genuinely new collider');
 const data=copy(g.serialize());data.frontier.detailVersion=10;data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'placed',left:60,on:false,used:true,domain:'region',...point,z:0,angle:0}]};
 assert.equal(g.restoreSave(data),true);const before=copy(g.serialize());delete before.timestamp;
 const result=g.worldOps131.upgradeDetails159(11);assert.equal(result.ok,false);assert.match(result.reason,/équipement régional/);
 const after=copy(g.serialize());delete after.timestamp;assert.deepEqual(after,before);
});
