'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const Assets=require('../src/assets136.js');
let g,C;
test.before(()=>{({g}=bootDocument134());C=globalThis.DeadwallCore;});
// Full-document DOM fixtures, not Chromium or a naturally played campaign.
function fresh(){g.startNew('standard','17117');g.campaignIntro132.skip();g.units=[];g.world.nodes.forEach(n=>n.depleted=true);standAt(g,g.player,g.core());}
function button(action){return g.arsenalUI134.element.querySelectorAll('button').find(b=>b.dataset.action===action);}
function structure(type,x,y){const b=new(g.core().constructor)(g.nextId++,type,x,y,0,1);g.world.add(b);g.refreshMetrics(true);return b;}
function workshop(){const b=structure('workshop',72,72);for(let i=0;i<5;i++)structure('warehouse',86,60+i*5);standAt(g,g.player,b);assert.ok(g.tier.id>=2);assert.equal(b.powered,true);return b;}
function finish(seconds){for(let i=0;i<seconds*10+1;i++)g.arsenal134.step(.1);}

test('148 armurerie DOM : atelier indisponible explique le refus et le clic refusé ne prélève rien',()=>{
 fresh();assert.equal(g.arsenalUI134.open(),true);button('tab:catalog').click();const b=button('craft:assemblyHammer'),stock={...g.resources};assert.equal(b.disabled,true);const id=b.getAttribute('aria-describedby');assert.ok(id);const reason=g.arsenalUI134.element.querySelectorAll('small').find(n=>n.id===id);assert.match(reason.textContent,/atelier.*achevé.*alimenté.*accessible/);b.click();assert.equal(g.arsenal134.busy(),false);assert.deepEqual(g.resources,stock);g.arsenalUI134.close();
});

test('148 armurerie DOM : vrai clic fabrique puis le retrait conserve coût et focus après Continue',()=>{
 fresh();workshop();assert.equal(g.arsenalUI134.open(),true);button('tab:catalog').click();const b=button('craft:assemblyHammer'),stock={...g.resources};assert.equal(b.disabled,false);assert.match(b.textContent,/7 s/);b.focus();g.arsenalUI134.refresh();assert.equal(globalThis.document.activeElement.dataset.action,'craft:assemblyHammer');button('craft:assemblyHammer').click();assert.equal(g.arsenalUI134.isOpen(),false);assert.equal(g.paused,false);assert.equal(g.arsenal134.busy(),true);finish(7);assert.equal(g.resources.wood,stock.wood-4);assert.equal(g.resources.scrap,stock.scrap-12);const i=g.arsenal134.snapshot().locker.find(i=>i.id==='assemblyHammer');assert.ok(i);assert.equal(i.rounds,0);assert.equal(g.save(false),true);assert.equal(g.load(),true);
 standAt(g,g.player,g.core());const paid={...g.resources};g.arsenalUI134.open();button('tab:locker').click();button('move:'+i.uid).click();assert.equal(g.arsenal134.snapshot().locker.some(v=>v.uid===i.uid),false);button('tab:carried').click();button('equip:'+i.uid).click();assert.equal(button('equip:'+i.uid).getAttribute('aria-pressed'),'true');assert.deepEqual(g.resources,paid);assert.equal(g.arsenal134.visualEquipment().category,'tool');assert.equal(g.arsenal134.visualEquipment().id,'assemblyHammer');g.arsenalUI134.close();
});

test('148 silhouettes : les deux nouveaux outils ont une géométrie tenue distincte et une icône originale',()=>{
 for(const id of ['assemblyHammer','wreckingBar'])assert.ok(Assets.PATHS[id]);assert.notEqual(Assets.PATHS.assemblyHammer,Assets.PATHS.hammer);assert.notEqual(Assets.PATHS.wreckingBar,Assets.PATHS.crowbar);
 function drawing(id){const calls=[],ctx=new Proxy({},{get:(_o,key)=>(...args)=>calls.push([key,...args]),set:()=>true});Assets.drawHeld(ctx,id);return calls;}
 assert.notDeepEqual(drawing('assemblyHammer'),drawing('hammer'));assert.notDeepEqual(drawing('wreckingBar'),drawing('crowbar'));assert.ok(drawing('assemblyHammer').some(c=>c[0]==='fillRect'));assert.ok(drawing('wreckingBar').some(c=>c[0]==='quadraticCurveTo'));
 assert.equal(C.Arsenal134Rules.catalog.singleShot.category,'firearm');assert.equal(C.Arsenal134Rules.catalog.assemblyHammer.category,'tool');assert.equal(C.Arsenal134Rules.catalog.wreckingBar.category,'tool');
});
