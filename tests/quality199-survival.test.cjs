'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js'),S=require('../src/survival-pack.js');
function fixture(){
 const {game:g}=bootGame();require('../src/night-gear.js').install(g);require('../src/expansion-kit.js').install(g);S.install(g);g.startNew('standard','17117');
 Object.assign(g.player,{x:2400,y:2480,facing:0,health:50,carryCapacity:100});Object.assign(g.player.carry,{food:20,wood:20,scrap:15,medicine:4,fuel:8});
 let z=0;g.vertical175={pose:()=>({z,site:z?987:null,level:z?0:-1}),enemyPose:e=>({z:e.z||0})};
 return {g,elevate:value=>z=value};
}
function prepare(g){
 let q=g.survivalPack.preview('camp');for(let y=2250;y<3000&&!q.ok;y+=80)for(let x=2250;x<3000&&!q.ok;x+=80){g.player.x=x;g.player.y=y;q=g.survivalPack.preview('camp');}
 assert.ok(q.ok,q.reason);assert.ok(g.survivalPack.begin('camp').ok);for(let i=0;i<70;i++)g.survivalPack.step(.1);return g.survivalPack.snapshot().camps[0];
}
test('199 a raised commander cannot use a ground camp or build a ground camp from a deck',()=>{
 const {g,elevate}=fixture();prepare(g);assert.ok(g.survivalPack.preview('rest').ok);const bag={...g.player.carry};elevate(6);
 for(const kind of ['rest','restSheltered','cover','service','camp'])assert.equal(g.survivalPack.preview(kind).ok,false,kind);
 assert.equal(g.survivalPack.dismantle().ok,false);assert.deepEqual(g.player.carry,bag);assert.ok(g.survivalPack.preview('dressing').ok,'a portable bandage is still usable upstairs');
});
test('199 changing altitude interrupts ground work without payment or healing',()=>{
 const {g,elevate}=fixture();prepare(g);assert.ok(g.survivalPack.begin('rest').ok);const bag={...g.player.carry},health=g.player.health;elevate(6);g.survivalPack.step(.1);
 assert.equal(g.survivalPack.busy(),false);assert.deepEqual(g.player.carry,bag);assert.equal(g.player.health,health);
});
test('199 a ground tarp does not cover a torch carried six metres above it',()=>{
 const {g,elevate}=fixture(),camp=prepare(g);assert.ok(g.survivalPack.begin('cover').ok);for(let i=0;i<70;i++)g.survivalPack.step(.1);
 const point={domain:'local',x:g.player.x,y:g.player.y,z:0,inside:null};assert.equal(g.survivalPack.rainProtection({location:'belt'},point),C.SurvivalPackRules.cover.protection);
 elevate(6);assert.equal(g.survivalPack.rainProtection({location:'belt'},point),0);assert.equal(g.survivalPack.rainProtection({...camp,location:'placed'},point),C.SurvivalPackRules.cover.protection,'a lamp actually left beneath the tarp stays covered');
});
test('199 a treatment cannot heal for time beyond its remaining active lifetime',()=>{
 const {g}=fixture(),raw=g.serialize();raw.expansions127.modules.survival.dressing={left:.025,remaining:1};g.restoreSave(raw);g.paused=false;g.activeOverlay=null;const hp=g.player.health;
 g.survivalPack.step(.1);assert.ok(Math.abs(g.player.health-hp-C.SurvivalPackRules.dressing.heal/C.SurvivalPackRules.dressing.duration*.025)<1e-8);
 assert.deepEqual(g.survivalPack.snapshot().dressing,{left:0,remaining:0});
});

test('199 the native stair controller reaches a real paid deck without enabling ground camping there',()=>{
 const H=require('./helpers/vertical177.cjs'),g=H.boot(4),support=H.build(g);
 // The existing advanced fixture supplies materials/completes a paid support;
 // its actual vertical access controller, not a mocked pose, performs the ascent.
 H.ascend(g,support);assert.equal(g.vertical175.pose().z,6);
 for(const [kind,amount]of Object.entries(C.SurvivalPackRules.camp.cost)){g.resources[kind]-=amount;g.player.carry[kind]+=amount;}
 const before=g.serialize(),q=g.survivalPack.preview('camp');assert.equal(q.ok,false);assert.match(q.reason,/sol/);
 const after=g.serialize();delete before.timestamp;delete after.timestamp;assert.deepEqual(after,before,'inspection neither spends nor moves the commander');
 const down=g.vertical175.accessQuote(support.id,-1);assert.ok(down.ok,down.reason);assert.ok(g.vertical175.access(support.id,-1).ok);H.tick(g,down.seconds+.2);
 assert.equal(g.vertical175.pose().z,0);assert.doesNotMatch(g.survivalPack.preview('camp').reason||'',/Redescendez/);
});
