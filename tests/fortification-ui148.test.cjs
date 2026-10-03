'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js'),copy=v=>JSON.parse(JSON.stringify(v));
// The real HTML/module document harness checks callbacks and semantic UI. These
// completed structures and attained tier are declared fixtures, not native play.
function fixture(){const e=bootDocument134();e.g.startNew('standard','903148');e.g.campaignIntro132.skip();e.g.tier=C.CITY_TIERS[2];return e;}
function support(g,type){const Building=g.core().constructor;for(let radius=6;radius<28;radius+=2)for(const[dx,dy]of [[radius,0],[0,radius],[-radius,0],[0,-radius]]){
 const gx=g.core().gx+dx,gy=g.core().gy+dy;if(!g.world.placement(C.BUILDINGS[type],gx,gy,0).valid)continue;const b=new Building(g.nextId,type,gx,gy,0,1),p=g.fieldcraft.service(g.player,b);if(!p||!g.friendlyPositionClear(g.player,p.x,p.y))continue;g.nextId++;g.world.add(b);g.refreshMetrics(true);g.tier=C.CITY_TIERS[2];g.selectBuilding(b);Object.assign(g.player,p);return b;
 }throw Error('Un accès physique au support est requis dans la fixture.');}
function pack(g,cost){standAt(g,g.player,g.core());for(const[key,n]of Object.entries(cost)){const r=g.loadout.transfer('depot','sac',key,n);assert.equal(r.ok,true);assert.equal(r.amount,n);}}
function work(g,n){for(let left=n;left>1e-8;left-=C.FortificationPackRules.maxStep)g.fortificationPack.step(Math.min(left,C.FortificationPackRules.maxStep));}

for(const kind of ['ankle','blades'])test('148 interface '+kind+' : vrai bouton, coût accessible, progression, pause, fin et retrait',()=>{
 const{g,doc}=fixture(),r=C.FortificationPackRules.mechanisms[kind];pack(g,r.cost);if(kind==='blades')support(g,'workshop');const b=support(g,'spikes');g.expansionUI.open('fortification');
 const id='expansionAction-fortification-mechanism-'+kind,button=doc.getElementById(id),description=doc.getElementById(id+'-description');assert.equal(button.disabled,false);assert.match(description.textContent,/dans le sac/);assert.match(description.textContent,new RegExp(r.seconds+' s'));assert.equal(description.hidden,false);assert.ok(button.getAttribute('aria-describedby').split(' ').includes(description.id));
 const stock={...g.resources},carried={...g.player.carry};button.click();assert.equal(g.paused,false);assert.equal(g.expansionUI.isOpen(),false);assert.equal(g.fortificationPack.job.kind,'mechanism');assert.deepEqual(g.player.carry,carried);
 work(g,2);g.updateUI();const tray=doc.getElementById('expansionWork'),label=tray.children[0],progress=tray.children[1];assert.equal(tray.classList.contains('hidden'),false);assert.match(label.textContent,new RegExp(r.name));assert.equal(progress.hidden,false);assert.equal(progress.value,2/r.seconds);
 doc.getElementById('expansionWorkOpen').click();assert.equal(g.expansionUI.isOpen(),true);assert.equal(g.paused,true);const elapsed=g.fortificationPack.job.elapsed;work(g,30);assert.equal(g.fortificationPack.job.elapsed,elapsed);g.updateUI();assert.match(label.textContent,/EN PAUSE/);g.showCommand(false);work(g,r.seconds-2);g.updateUI();
 assert.equal(tray.classList.contains('hidden'),true);const fitting=g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id);assert.equal(fitting.mechanism.charges,6);for(const[key,n]of Object.entries(r.cost))assert.equal(carried[key]-g.player.carry[key],n);assert.deepEqual(g.resources,stock);
 g.expansionUI.open('fortification');const before={...g.player.carry},remove=doc.getElementById('expansionAction-fortification-remove-mechanism');assert.equal(remove.disabled,false);remove.click();assert.equal(g.fortificationPack.snapshot().fittings.find(f=>f.id===b.id),undefined);assert.deepEqual(g.player.carry,before);assert.deepEqual(g.resources,stock);
});

test('148 interface : recettes refusées expliquées, raccourci ordinaire sans fabrication automatique',()=>{
 const{g,doc}=fixture();g.expansionUI.open('fortification');for(const kind of ['ankle','blades']){const id='expansionAction-fortification-mechanism-'+kind;assert.equal(doc.getElementById(id).disabled,true);assert.equal(doc.getElementById(id+'-description').hidden,false);assert.match(doc.getElementById(id+'-reason').textContent,/Hérisson/);}
 const stock={...g.resources},fittings=copy(g.fortificationPack.snapshot()),count=g.world.buildings.size;doc.getElementById('expansionAction-fortification-build-spikes').click();assert.equal(g.selectedBuild,'spikes');assert.equal(g.paused,false);assert.equal(g.expansionUI.isOpen(),false);assert.deepEqual(g.resources,stock);assert.equal(g.world.buildings.size,count);assert.deepEqual(g.fortificationPack.snapshot(),fittings);g.cancelPlacement();assert.equal(g.selectedBuild,null);
});
