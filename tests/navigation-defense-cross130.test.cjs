'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const{fixture}=require('./helpers/navigation130.cjs');
const{boot127}=require('./helpers/expansions127.cjs');
test('QA croisée navigation/défense 1.30 : ouvrir le GPS masque le préavis sans faire avancer son échéance',()=>{
 const{g}=fixture({ui:true});require('../src/departure130.js').install(g);g.player.x=4070;g.player.y=2048;assert.ok(g.frontier.enter());const before=g.departure130.status(),box=g.ui.hud.children.find(x=>x.id==='departureWarning130');assert.equal(box.classList.contains('hidden'),false);
 assert.ok(g.frontierUI.open());g.departure130.refresh();assert.equal(box.classList.contains('hidden'),true);assert.equal(g.paused,true);const route=g.frontierUI.atlas.position();assert.equal(route.x,g.frontier.position().x);assert.equal(g.departure130.status().until,before.until);
 g.showCommand(false);g.departure130.refresh();assert.equal(g.paused,false);assert.equal(box.classList.contains('hidden'),false);assert.equal(g.departure130.status().until,before.until);
});
test('QA croisée navigation/défense 1.30 : le préavis local ne construit pas le modèle régional',()=>{
 const{game:g}=boot127();require('../src/departure130.js').install(g);g.startNew('standard','628');g.player.x=3700;g.player.y=2048;g.input.keys.add('KeyD');const W=globalThis.DeadwallFrontierWorld,original=W.create;let creates=0;W.create=(...a)=>{creates++;return original(...a);};try{for(let i=0;i<15;i++)g.departure130.approach();assert.equal(g.frontier.active(),false);assert.equal(g.departure130.status().visible,true);assert.equal(creates,0);}finally{W.create=original;}
});
