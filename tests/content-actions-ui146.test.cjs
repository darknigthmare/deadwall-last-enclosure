'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
let g,doc,C;
test.before(()=>{({g,doc}=bootDocument134());C=globalThis.DeadwallCore;});
function fresh(){g.startNew('standard','17117');g.campaignIntro132.skip();g.resources.food=g.resources.ammo=g.resources.wood=g.resources.scrap=300;g.world.nodes.forEach(n=>n.depleted=true);standAt(g,g.player,g.core());}
const q=id=>g.expansionUI.section.querySelectorAll('button,p').find(n=>n.id===id);

test('146 actions : le caisson compact est accessible dans le vrai hub, avec prix et réserve finie',()=>{
 fresh();const b=new(g.core().constructor)(g.nextId++,'watchtower',72,72,0,1);g.world.add(b);g.refreshMetrics(true);g.tier=C.CITY_TIERS[1];g.selectBuilding(b);standAt(g,g.player,b);g.expansionUI.open('fortification');
 const button=q('expansionAction-fortification-ammoCompact');assert.equal(button.disabled,false);assert.match(button.textContent,/Caisson compact.*12/);assert.match(q(button.id+'-reason').textContent,/prélevées/);const before={...g.resources};button.click();
 assert.equal(before.ammo-g.resources.ammo,12);assert.equal(before.wood-g.resources.wood,2);assert.equal(before.scrap-g.resources.scrap,2);assert.equal(q(button.id).disabled,true);assert.equal(g.fortificationPack.snapshot().fittings[0].ammo,12);assert.equal(g.serialize().version,20);
});

test('146 actions : la progression des exercices s’explique et un vrai clic engage puis reprend le temps',()=>{
 fresh();g.population=10;assert.equal(g.worldEvolution.assignCompanion('samir'),true);standAt(g,g.player,g.core());g.expansionUI.open('companions');const id='expansionAction-companions-train-samir-escort';assert.equal(q(id).disabled,true);assert.match(q(id+'-reason').textContent,/spécialité/);
 g.expansionUI.close();assert.equal(g.companionsPack.train('samir').ok,true);for(let i=0;i<451;i++)g.companionsPack.update(.1);g.expansionUI.open('companions');const button=q(id);assert.equal(button.disabled,false);assert.match(q(id+'-reason').textContent,/Suivre.*File.*30/);assert.match(button.textContent,/60 s/);const before={...g.resources};button.click();
 assert.equal(g.ui.commandModal.classList.contains('hidden'),true);assert.equal(g.paused,false);assert.equal(before.food-g.resources.food,24);assert.equal(before.scrap-g.resources.scrap,14);assert.equal(g.companionsPack.snapshot().training.left,60);g.companionsPack.update(.1);assert.equal(g.companionsPack.snapshot().training.left,59.9);
});
