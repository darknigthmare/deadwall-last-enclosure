'use strict';

const test=require('node:test'),assert=require('node:assert/strict');
const {ready,arrive,dead,clone}=require('./helpers/wildlife190.cjs');

for(const kind of ['harvest','fish'])test('192 '+kind+' interrupts on actual damage even when health is restored before the next step',()=>{
 const {g}=ready(),animal=kind==='fish'?arrive(g,'fish'):dead(g),harvest=g.wildHarvest190;
 assert.equal(harvest.begin(kind,animal.id).ok,true);
 const paid=clone(g.player.carry),health=g.player.health,animalHealth=g.frontier.wildlifeStatus165(animal.id).hp;
 g.player.invulnerable=1;
 g.frontier.damage(1);
 assert.equal(g.player.health,health,'an absorbed hit causes no wound');
 assert.equal(harvest.busy(),true,'an ineffective hit does not interrupt work');
 g.player.invulnerable=0;
 g.frontier.damage(1);
 assert.ok(g.player.health<health,'the regional combat owner really applied damage');
 g.player.health=health;
 harvest.step(.1);
 assert.equal(harvest.busy(),false,'healing cannot erase the interruption caused by a wound');
 assert.equal(harvest.taken(animal.id),0);
 assert.deepEqual(g.player.carry,paid,'paid fishing inputs remain consumed without an output or refund');
 assert.equal(g.frontier.wildlifeStatus165(animal.id).hp,animalHealth);
});
