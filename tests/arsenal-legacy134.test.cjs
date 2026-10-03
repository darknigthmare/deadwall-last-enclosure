'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
function copy(v){return JSON.parse(JSON.stringify(v));}
function base(){const {g,doc}=boot131({ui:true});require('../src/succession133.js').install(g);return{g,doc};}
function current(){const e=base();require('../src/arsenal134.js').install(e.g);return e;}
function die(g){g.player.invulnerable=0;g.damagePlayer(1000);return g.succession133.remains().at(-1);}
function armory(g){return g.serialize().expansions127.modules.arsenal134;}

test('1.34 legacy arsenal: old current firearms migrate once with all loaded rounds',()=>{
 const {g}=base(),legacy=g.serialize(),owned=copy(legacy.player.magazine);require('../src/arsenal134.js').install(g);g.restoreSave(legacy);
 const rows=armory(g).carried;assert.equal(rows.length,3);for(const id of Object.keys(owned))assert.equal(rows.find(i=>i.id===id)?.rounds,owned[id],id);
 for(let i=0;i<3;i++)g.restoreSave(g.serialize());assert.equal(armory(g).carried.length,3);assert.equal(armory(g).carried.reduce((n,i)=>n+i.rounds,0),Object.values(owned).reduce((a,b)=>a+b));
});
test('1.34 legacy arsenal: old corpse firearms become usable possessions without disappearing ammunition',()=>{
 const {g}=base(),r=die(g),before=copy(r.magazine);g.succession133.select('porter');const legacy=g.serialize();require('../src/arsenal134.js').install(g);g.restoreSave(legacy);
 Object.assign(g.player,{x:r.point.x,y:r.point.y});assert.equal(g.succession133.loot(r.id),true);const rows=armory(g).carried;assert.equal(rows.length,3);
 for(const id of Object.keys(before))assert.equal(rows.find(i=>i.id===id)?.rounds,before[id],id);g.restoreSave(g.serialize());assert.equal(armory(g).carried.length,3);assert.equal(g.succession133.loot(r.id),false);
});
test('1.34 legacy arsenal: cross-registry corruption is rejected before replacing the world',()=>{
 const {g}=current(),good=g.serialize(),world=g.world;
 for(const mutate of [
  d=>{const a=d.expansions127.modules.arsenal134;a.fallen.push({remains:999,items:[]});},
  d=>{d.player.magazine.pistol--;},
  d=>{d.succession133.current.weapons=d.succession133.current.weapons.filter(k=>k!=='rifle');},
  d=>{const a=d.expansions127.modules.arsenal134;a.equipped=a.carried.find(i=>i.id==='rifle').uid;}
 ]){const d=copy(good);mutate(d);assert.throws(()=>g.restoreSave(d));assert.equal(g.world,world);}
});
test('1.34 equipment: inventory shows carried instances and permits equip with correct magazine in pause',()=>{
 const {g}=current(),data=g.serialize(),a=data.expansions127.modules.arsenal134;
 a.carried.push({uid:a.next++,id:'revolver',condition:73,rounds:4});g.restoreSave(data);const eq=g.loadout.equipment(),revolver=eq.weapons.find(w=>w.catalogId==='revolver');assert.ok(revolver);assert.equal(revolver.name,'Revolver de patrouille');assert.equal(revolver.magazine,6);assert.equal(revolver.rounds,4);assert.equal(revolver.condition,73);assert.ok(eq.armamentWeight>0);
 assert.equal(g.loadoutUI.open(),true);assert.equal(g.paused,true);assert.equal(g.loadout.equipWeapon(revolver.id).ok,true);assert.equal(g.arsenal134.weaponSpec().id,'revolver');assert.equal(g.player.magazine.pistol,4);
 g.loadoutUI.refresh(true);const card=g.loadoutUI.overlay.querySelectorAll('button').find(b=>b.dataset.action==='weapon:'+revolver.id);assert.ok(card);assert.equal(card.getAttribute('aria-pressed'),'true');assert.ok(card.querySelectorAll('span').some(n=>n.textContent.includes('4 / 6 cartouches')));g.loadoutUI.close();assert.equal(g.paused,false);
});

test('1.34 legacy arsenal: overweight old corpse weapons stay physically recoverable',()=>{
 const {g}=base(),r=die(g);g.succession133.select('porter');const legacy=g.serialize();require('../src/arsenal134.js').install(g);g.restoreSave(legacy);const full=g.serialize(),a=full.expansions127.modules.arsenal134;
 for(let i=0;i<3;i++)a.carried.push({uid:a.next++,id:'support',condition:100,rounds:0});full.succession133.current.weapons=['rifle'];g.restoreSave(full);Object.assign(g.player,{x:r.point.x,y:r.point.y});
 const before=g.succession133.remains()[0],total=armory(g).carried.length;assert.equal(g.succession133.loot(r.id),false);assert.equal(armory(g).carried.length,total);assert.deepEqual(g.succession133.remains()[0].weapons,before.weapons);assert.deepEqual(g.succession133.remains()[0].magazine,before.magazine);assert.doesNotThrow(()=>globalThis.DeadwallSave.validate(g.serialize()));
});
test('1.34 legacy arsenal: ammunition-only corpse remainder keeps resource cost and stays finite',()=>{
 const {g}=base(),r=die(g);g.succession133.select('porter');const legacy=g.serialize(),remains=legacy.succession133.remains[0];remains.weapons=[];remains.magazine={pistol:2,rifle:3,shotgun:4};require('../src/arsenal134.js').install(g);g.restoreSave(legacy);Object.assign(g.player,{x:r.point.x,y:r.point.y});
 assert.equal(g.succession133.loot(r.id),true);assert.equal(g.player.carry.ammo,13);assert.equal(armory(g).carried.length,0);assert.deepEqual(g.succession133.remains()[0].magazine,{pistol:0,rifle:0,shotgun:0});assert.equal(g.succession133.loot(r.id),false);g.restoreSave(g.serialize());assert.equal(g.player.carry.ammo,13);
});

test('1.34 legacy upkeep: reload cleaning needs an actual firearm and is distinct from durability repair',()=>{
 const {g}=current();assert.equal(g.playerOps131.preview('service').ok,true);const raw=g.serialize(),a=raw.expansions127.modules.arsenal134;a.carried.push({uid:a.next++,id:'plank',condition:65,rounds:0});g.restoreSave(raw);const plank=armory(g).carried.find(i=>i.id==='plank');assert.equal(g.arsenal134.equip(plank.uid).ok,true);const stock=copy(g.resources),gear=g.playerOps131.snapshot();assert.equal(g.playerOps131.begin('service').ok,false);assert.deepEqual(g.resources,stock);assert.deepEqual(g.playerOps131.snapshot(),gear);assert.equal(armory(g).carried.find(i=>i.uid===plank.uid).condition,65);assert.ok(g.playerOps131.actions().find(a=>a.id==='service').label.includes('Nettoyer'));
 assert.equal(g.arsenal134.transfer(plank.uid,'locker').ok,true);assert.equal(g.playerOps131.preview('service').ok,false);
});
