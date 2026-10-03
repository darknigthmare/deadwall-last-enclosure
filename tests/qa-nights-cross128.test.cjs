'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot127}=require('./helpers/expansions127.cjs');

test('QA croisée 1.28 : une réanimation instantanée annule le bivouac au même emplacement',()=>{
 const {game:g}=boot127();g.startNew('standard','17117');g.phaseTime=9999;g.units=[];
 const core=g.core(),arrival=g.coreArrivalPosition(g.player,{x:core.x+80,y:core.y});
 Object.assign(g.player,arrival,{facing:0});Object.assign(g.player.carry,{wood:30,scrap:20});
 assert.ok(g.survivalPack.begin('camp').ok);g.update(.04);
 g.player.dead=true;g.player.health=0;g.player.downTimer=0;g.update(.04);
 assert.equal(g.player.dead,false);
 assert.equal(g.player.x,arrival.x);assert.equal(g.player.y,arrival.y);
 assert.equal(g.survivalPack.busy(),false);
 for(let i=0;i<200;i++)g.update(.04);
 assert.equal(g.survivalPack.snapshot().camps.length,0);
 assert.equal(g.player.carry.wood,15);assert.equal(g.player.carry.scrap,10);
});

test('QA croisée 1.28 : les passages répétés du contrôle de décès ne déplacent ni ne copient les lampes',()=>{
 const {game:g}=boot127();g.startNew('standard','17117');g.phaseTime=9999;
 const raw=g.serialize();raw.nightGear={version:1,serial:2,devices:[{id:1,kind:'lantern',location:'belt',left:300,on:false,used:true}]};g.restoreSave(raw);
 g.player.x=4058;g.player.y=2048;assert.ok(g.frontier.enter());
 const point=g.frontier.position();g.player.invulnerable=0;g.frontier.damage(1000);
 const dropped=g.nightGear.snapshot();assert.equal(dropped.devices.length,1);assert.equal(dropped.devices[0].domain,'region');assert.equal(dropped.devices[0].x,point.x);assert.equal(dropped.devices[0].y,point.y);
 assert.equal(g.nightGear.dropOnDeath(),false);
 for(let i=0;i<20;i++)g.update(.04);
 assert.deepEqual(g.nightGear.snapshot(),dropped);
 assert.ok(g.save(false));assert.ok(g.load());
 assert.deepEqual(g.nightGear.snapshot(),dropped);
});
