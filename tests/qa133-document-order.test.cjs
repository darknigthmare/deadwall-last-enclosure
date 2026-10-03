'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument133}=require('./helpers/document133.cjs');

test('QA133 document complet : scripts de distribution, première sauvegarde, introduction, mort puis relève',()=>{
 const e=bootDocument133(),g=e.g;
 assert.equal(g.startupReady,false);assert.equal(g.ui.newGameButton.disabled,true);assert.equal(g.requestNewGame(),false);
 assert.ok(e.files.includes('src/succession133.js'));assert.ok(e.files.includes('src/hero-actions133.js'));
 e.ready();assert.equal(g.startupReady,true);assert.ok(g.successionUI133);assert.ok(g.campaignIntro132);assert.ok(g.heroActions133);
 g.startNew('standard','17117');assert.equal(g.campaignIntro132.isOpen(),true);assert.equal(g.successionUI133.isOpen(),false);
 const C=globalThis.DeadwallCore,stored=globalThis.DeadwallSave.parse(e.storage.get(C.SAVE_KEY));
 assert.equal(stored.exploration125.layoutRevision,3);assert.equal(stored.frontier.generation,7);assert.equal(stored.succession133.pending,false);
 g.campaignIntro132.skip();const run=g.runId,world=g.world,stock={...g.resources},population=g.units.length,elapsed=g.elapsed;
 g.player.carry.wood=12;g.damagePlayer(10000);assert.equal(g.successionUI133.isOpen(),true);assert.equal(g.activeOverlay,g.successionUI133.element);assert.equal(g.ui.hud.inert,true);
 assert.equal(g.succession133.remains()[0].bag.wood,12);assert.equal(g.lastSaveStatus.ok,true);
 assert.equal(g.togglePause(false),false);g.onEscape();g.showCommand(true);g.showHelp(true);assert.equal(g.campaignIntro132.replay(),false);
 for(let i=0;i<15;i++){g.update(.04);g.loop(g.lastFrame+40);}assert.equal(g.elapsed,elapsed);assert.equal(g.activeOverlay,g.successionUI133.element);
 assert.equal(g.successionUI133.choose('builder'),true);assert.equal(g.successionUI133.confirm(),true);
 assert.equal(g.player.dead,false);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.equal(g.ui.hud.inert,false);assert.equal(g.campaignIntro132.isOpen(),false);
 assert.equal(g.world,world);assert.equal(g.runId,run);assert.deepEqual(g.resources,stock);assert.equal(g.units.length,population);assert.equal(g.player.carryCapacity,38);assert.equal(g.player.maxHealth,100);
 assert.equal(Object.values(g.player.magazine).reduce((a,b)=>a+b,0),0);assert.equal(g.save(false),true);
 g.player.invulnerable=0;g.damagePlayer(10000);assert.equal(g.succession133.remains().length,2);g.returnToMenu();assert.equal(g.state,'menu');assert.equal(g.successionUI133.isOpen(),false);
 assert.equal(g.load(),true);assert.equal(g.successionUI133.isOpen(),true);assert.equal(g.activeOverlay,g.successionUI133.element);assert.equal(g.campaignIntro132.isOpen(),false);assert.equal(g.succession133.remains().length,2);assert.equal(g.save(false),true);
});
