'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const Intro=require('../src/campaign-intro132.js'),Profile=require('../src/profile.js');
function fixture(){const e=boot131({ui:true,generation:7});const store=new Map();e.g.profile=Profile.create({getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)});e.g.profile.load();Intro.install(e.g,e.doc);return {...e,store};}
const saved=g=>{const s=g.serialize();delete s.timestamp;return JSON.stringify(s);};
test('161: one completed identity per new campaign; repeated saves, pause and restore never fork the history',()=>{
 const {g}=fixture();g.startNew('story','17117','rearguard');const id=g.runId;
 // Main 1.57.2 preserves the initial identity instead of appending a generation suffix.
 // The historical suffixed IDs remain covered by campaign-identity.test.cjs.
 assert.match(id,/^run:.+/);assert.doesNotMatch(id,/:g4$/);assert.equal(g.profile.get().recentRuns.length,1);assert.equal(g.profile.get().recentRuns[0].runId,id);
 assert.equal(g.profile.get().recentRuns[0].scenarioId,'rearguard');assert.equal(g.profile.get().recentRuns[0].peakPopulation,4);
 g.campaignIntro132.skip();g.togglePause(true);for(let n=0;n<4;n++)assert.notEqual(g.save(false),false);
 const data=g.serialize(),before=JSON.stringify(g.profile.get());g.restoreSave(data);g.save(false);
 assert.equal(g.runId,id);assert.equal(JSON.stringify(g.profile.get()),before);
 g.startNew('story','17117','rearguard');assert.notEqual(g.runId,id);assert.equal(g.profile.get().recentRuns.length,2);
 assert.ok(g.profile.get().recentRuns.some(r=>r.runId===id));
});
test('161: rejected starts do not add records or change the open introduction and campaign',()=>{
 const {g}=fixture();g.startNew('standard','17118');g.campaignIntro132.next();
 const before=saved(g),history=JSON.stringify(g.profile.get()),view=g.campaignIntro132.view();
 assert.equal(g.startNew('standard','invalid','classic'),false);assert.equal(saved(g),before);
 assert.equal(JSON.stringify(g.profile.get()),history);assert.deepEqual(g.campaignIntro132.view(),view);
 g.startNew('standard','17119');assert.equal(g.profile.get().recentRuns.length,2);
});
test('161: an initializer exception releases the record gate and publishes no partial identity',()=>{
 const e=boot131({ui:true,generation:7}),g=e.g;const original=g.startNew.bind(g),record=g.recordCampaign.bind(g);let writes=0;
 g.recordCampaign=(...args)=>{writes++;return record(...args);};
 g.startNew=()=>{g.recordCampaign(false);throw new Error('fixture initialization failed');};Intro.install(g,e.doc);
 assert.throws(()=>g.startNew(),/fixture initialization failed/);assert.equal(writes,0);
 g.recordCampaign(false);assert.equal(writes,1);
});
