'use strict';
const assert=require('node:assert/strict');
const C=require('../../src/core.js'),Services=require('../../src/campaign-services208.js');
const {boot127}=require('./expansions127.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
const checkpoint208=g=>{const value=copy(g.serialize());delete value.timestamp;return value;};
function stepSupport208(g,seconds){for(let elapsed=0;elapsed<seconds-1e-8;elapsed+=C.SurvivalPackRules.maxStep)g.survivalPack.step(Math.min(C.SurvivalPackRules.maxStep,seconds-elapsed));}

// Deliberately prepared controller fixtures: native seeded G11 geometry and
// finite supplies, with one initial placement and prepared nearby contacts.
// They do not claim organic expedition travel or human campaign duration.
function serviceFixture208(action,{typology='EXT-MONDE-T047',supportKind,seed='17117'}={}){
 const g=boot127().game;require('../../src/world-pack131.js').install(g);require('../../src/context-operations160.js').install(g);
 g.startNew('standard',seed,'classic','classic',true);
 const world=g.frontier.world(),site=world.pois.find(p=>p.campaign205?.typology===typology);assert.ok(site,'Actual seeded G11 '+typology);
 const candidates=Services.supportsFor(site,world.plan(site,0),world.detailAt(site,0)).filter(s=>s.action===action&&(!supportKind||s.supportKind===supportKind));
 const support=candidates.find(s=>Services.resolve(world,{active:true,generation:11,...s.anchor,inside:site.id,car:null},s,[site.id],{structureDestroyed:()=>false}).ok);assert.ok(support,'Actual collision-free '+action+' support');
 const data=g.serialize();Object.assign(data.frontier,{active:true,x:support.anchor.x,y:support.anchor.y,z:0,inside:site.id,anchor:{x:g.player.x,y:g.player.y}});
 data.frontier.seen=[site.id];data.player.carry=C.makeBag();Object.assign(data.player.carry,{food:12,wood:4,fuel:8,scrap:8,medicine:4});data.player.health=g.player.maxHealth-45;
 data.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'belt',left:100,on:false,used:true}]};
 for(const p of world.nearPOI(support.anchor.x,support.anchor.y,200))for(let i=0;i<world.threatCount(p);i++)data.frontier.enemies[p.id+':e'+i]=0;
 data.frontier.kills=Object.values(data.frontier.enemies).filter(h=>h===0).length;
 assert.equal(g.restoreSave(data),true);g.input.keys.clear();g.input.pressed.clear();
 const current=g.frontier.world(),p=current.pois.find(p=>p.id===site.id),quote=g.survivalPack.previewAtSupport(action,site.id,support.supportId,action==='service'?1:undefined);assert.equal(quote.ok,true,quote.reason);
 return{g,site:p,support:quote.support,quote,world:current,before:checkpoint208(g),lanternId:1};
}
module.exports={serviceFixture208,stepSupport208,checkpoint208,copy};
