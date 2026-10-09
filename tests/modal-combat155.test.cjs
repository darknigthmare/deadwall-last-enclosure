'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootDocument134}=require('../scripts/qa-startup134.cjs');

function fixture(health=100){
 const env=bootDocument134(),g=env.g,C=globalThis.DeadwallCore;
 g.startNew('standard','17117');g.campaignIntro132.skip();g.units=[];g.phaseTime=999;
 const core=g.core();Object.assign(g.player,{x:core.right+28,y:core.y,health,invulnerable:0});
 assert.ok(g.friendlyPositionClear(g.player,g.player.x,g.player.y));assert.equal(g.fieldcraft.nearby(),core);
 assert.equal(g.spawnZombie('walker'),true);const z=g.zombies.at(-1);
 Object.assign(z,{x:g.player.x+30,y:g.player.y,attackCooldown:0});g.rebuildBuckets();
 assert.ok(g.hostilePositionClear(z,z.x,z.y));assert.ok(g.hostileLineClear(z,g.player));
 assert.ok(C.dist(z,g.player)>z.radius+g.player.radius,'physical contact starts without overlapping bodies');
 function state(){return structuredClone({health:g.player.health,dead:g.player.dead,phaseTime:g.phaseTime,
  resources:g.resources,stats:g.stats,economyTimer:g.economyTimer,
  enemies:g.zombies.map(e=>({id:e.id,x:e.x,y:e.y,health:e.health,attackCooldown:e.attackCooldown})),
  projectiles:g.projectiles.map(p=>({id:p.id,x:p.x,y:p.y,travelled:p.travelled})),
  remains:g.succession133.snapshot().remains});}
 let atOpen;const show=g.showCommand;
 g.showCommand=(...args)=>{const result=show(...args);if(args[0])atOpen=state();return result;};
 function open(milliseconds=40){env.dispatchWindow('keydown',{code:'KeyO',target:document.body});
  assert.ok(g.input.pressed.has('KeyO'),'actual window handler queues orientation');g.loop(g.lastFrame+milliseconds);
  assert.equal(g.activeOverlay,g.ui.commandModal);assert.equal(g.paused,true);assert.ok(atOpen);
  return atOpen;}
 return{...env,g,C,z,state,open};
}

test('modal155: opening a native orientation dossier stops a normal or fatal contact within that update',()=>{
 for(const [health,milliseconds]of [[100,40],[10,100]]){
  const f=fixture(health),atOpen=f.open(milliseconds);
  assert.equal(atOpen.health,health);assert.equal(atOpen.dead,false);
  assert.deepEqual(f.state(),atOpen,'no damage, death, ammunition, movement or countdown after the pause opens');
  const stored=globalThis.DeadwallSave.parse(localStorage.getItem(f.C.SAVE_KEY));
  assert.equal(stored.player.health,health);assert.equal(stored.player.dead,false);
  assert.equal(stored.phaseTime,f.g.phaseTime,'pause save and living game share the same assault countdown');
 }
});

test('modal155: a paused contact stays frozen, then resumes its normal damage and survives Continue',()=>{
 const f=fixture(),atOpen=f.open();
 for(let i=0;i<5;i++)f.g.loop(f.g.lastFrame+40);
 assert.deepEqual(f.state(),atOpen);
 f.dispatchWindow('keyup',{code:'KeyO',target:document.body});f.g.showCommand(false);
 assert.equal(f.g.paused,false);assert.equal(f.g.activeOverlay,null);
 f.g.loop(f.g.lastFrame+40);
 assert.equal(f.g.player.health,100-f.C.ENEMIES.walker.damage*f.g.difficulty.enemyDamage);
 assert.ok(f.z.attackCooldown>0);assert.ok(Math.abs(f.g.phaseTime-(atOpen.phaseTime-.04))<1e-8);
 const health=f.g.player.health,cooldown=f.z.attackCooldown,id=f.z.id;
 assert.equal(f.g.save(false),true);assert.equal(f.g.load(),true);
 assert.equal(f.g.player.health,health);assert.equal(f.g.zombies.find(z=>z.id===id).attackCooldown,cooldown);
});
