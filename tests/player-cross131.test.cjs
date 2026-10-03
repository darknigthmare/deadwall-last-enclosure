'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs'),{standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js');
function fresh(){const{g}=boot131();g.phaseTime=999;standAt(g,g.player,g.core());return g;}
function prepare(g,kind){const q=g.playerOps131.preview(kind);assert.ok(q.ok,q.reason);assert.ok(g.playerOps131.begin(kind).ok);for(let i=0;i<Math.ceil(q.seconds/.04);i++)g.playerOps131.step(.04);assert.equal(g.playerOps131.busy(),false);}
test('joueur croisé 1.31 : préparation exclut manipulations de défense, voyage et récit',()=>{
 const g=fresh(),before={...g.resources};assert.ok(g.playerOps131.begin('vest').ok);
 assert.equal(g.defense131.startMaintenance(g.core().id).ok,false);
 const manifest=Object.keys(C.Travel131Rules.manifests)[0];assert.equal(g.travel131.preview('pack',manifest).ok,false);assert.equal(g.chronicles131.preview().ok,false);assert.equal(g.worldOps131.preview('relay','P0001').ok,false);
 assert.deepEqual(g.resources,before);g.playerOps131.cancel();assert.equal(g.expansions.busy(),false);
});
test('joueur croisé 1.31 : état malformé de chaque nouveau module rejeté avant mutation de toutes les réserves',()=>{
 const g=fresh();prepare(g,'ammo');prepare(g,'vest');const before=g.expansions.snapshot(),stock={...g.resources},world=g.world;
 for(const id of ['defense131','exploration131','player131','world131','lore131']){const raw=g.serialize();raw.expansions127.modules[id].version=99;assert.throws(()=>g.restoreSave(raw));assert.equal(g.world,world);assert.deepEqual(g.resources,stock);assert.deepEqual(g.expansions.snapshot(),before);}
});
test('joueur croisé 1.31 : reprise G5 conserve équipement, compteurs et absence de duplication',()=>{
 const g=fresh();prepare(g,'ammo');prepare(g,'tools');prepare(g,'service');prepare(g,'vest');g.player.invulnerable=0;g.damagePlayer(10);g.player.magazine.pistol=0;g.startReload();
 const before=g.playerOps131.snapshot(),equipment=g.loadout.equipment(),stock={...g.resources},raw=g.serialize();assert.equal(equipment.personal.length,3);assert.ok(equipment.personalWeight>6);g.restoreSave(raw);
 assert.equal(g.frontier.position().generation,5);assert.deepEqual(g.playerOps131.snapshot(),before);assert.deepEqual(g.resources,stock);assert.deepEqual(g.loadout.equipment().personal,equipment.personal);assert.equal(g.player.reload,raw.player.reload);
 g.restoreSave(g.serialize());assert.deepEqual(g.playerOps131.snapshot(),before);assert.deepEqual(g.resources,stock);
});
test('joueur croisé 1.31 : invalidation d’une nouvelle partie ne remet pas les réserves à zéro',()=>{
 const g=fresh();prepare(g,'ammo');const before=g.expansions.snapshot(),world=g.world,stock={...g.resources};assert.equal(g.startNew('standard','not a seed!!'),false);assert.equal(g.world,world);assert.deepEqual(g.expansions.snapshot(),before);assert.deepEqual(g.resources,stock);
});
