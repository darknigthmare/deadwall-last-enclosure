'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js');
const {bootGame}=require('./helpers/browser.cjs');

function fresh(){
  const {game:g}=bootGame();g.startNew('standard','17117');g.units=[];g.player.dead=true;
  g.flow.direction=()=>({x:1,y:0});g.random.chance=()=>false;g.daylight=()=>1;g.weather=0;
  return g;
}
function spawn(g,kind,x=1000,y=1000){assert.equal(g.spawnZombie(kind),true);const z=g.zombies.at(-1);Object.assign(z,{x,y,lastX:x,lastY:y});return z;}
function resume(g,saved){g.restoreSave(structuredClone(saved));g.flow.direction=()=>({x:1,y:0});g.random.chance=()=>false;g.daylight=()=>1;g.weather=0;g.rebuildBuckets();}

test('combat : les dix profils conservent ralentissement et agitation à la reprise',()=>{
  const g=fresh();for(const kind of Object.keys(C.ENEMIES))Object.assign(spawn(g,kind),{stagger:.35,rage:2.6});
  const saved=g.serialize();resume(g,saved);
  assert.deepEqual(g.serialize().zombies,saved.zombies);
  for(const z of g.zombies){assert.equal(z.stagger,.35);assert.equal(z.rage,2.6);}
});

test('combat : une entrave de mêlée garde la même durée et vitesse après chargement',()=>{
  const g=fresh(),z=spawn(g,'walker');z.stagger=.35;z.rage=2;
  const saved=structuredClone(g.serialize());g.updateZombies(.04);
  const expected={x:z.x,y:z.y,stagger:z.stagger,rage:z.rage};
  resume(g,saved);g.updateZombies(.04);const restored=g.zombies[0];
  assert.deepEqual({x:restored.x,y:restored.y,stagger:restored.stagger,rage:restored.rage},expected);
});

test('combat : le cri imminent du hurleur conserve son échéance et son effet de groupe',()=>{
  const g=fresh(),howler=spawn(g,'howler'),walker=spawn(g,'walker',1100,1000);howler.howl=.06;
  const saved=structuredClone(g.serialize());resume(g,saved);
  const h=g.zombies.find(z=>z.id===howler.id),w=g.zombies.find(z=>z.id===walker.id);
  g.updateZombies(.04);assert.ok(h.howl>0);assert.equal(w.rage,0);
  g.rebuildBuckets();g.updateZombies(.04);assert.ok(h.howl>=8&&h.howl<=11);assert.ok(w.rage>2.9);
  assert.ok(g.particles.length>=10);
});

test('combat : les sauvegardes historiques sans ces champs restent lisibles sans bonus',()=>{
  const g=fresh();for(const kind of Object.keys(C.ENEMIES))spawn(g,kind);
  const saved=structuredClone(g.serialize());for(const z of saved.zombies){delete z.stagger;delete z.rage;delete z.howl;}
  resume(g,saved);for(const z of g.zombies){assert.equal(z.stagger,0);assert.equal(z.rage,0);}
  const h=g.zombies.find(z=>z.kind==='howler');assert.ok(h.howl>=2&&h.howl<=9);
  assert.equal(g.random.state,saved.randomState);assert.deepEqual(g.resources,saved.resources);
});

test('combat : les nouveaux champs invalides sont refusés avant de remplacer la partie',()=>{
  const g=fresh();spawn(g,'howler');const saved=structuredClone(g.serialize()),world=g.world;
  for(const [field,value] of [['stagger',-1],['stagger',Infinity],['rage','3'],['rage',121],['howl',null],['howl',NaN],['howl',-1]]){
    const bad=structuredClone(saved);bad.zombies[0][field]=value;
    assert.throws(()=>g.restoreSave(bad),/Sauvegarde invalide/);assert.equal(g.world,world);
    assert.deepEqual(g.serialize().zombies,saved.zombies);assert.equal(g.random.state,saved.randomState);
  }
});

test('combat : un cri déjà dû reste dû au prochain pas de simulation',()=>{
  const g=fresh(),h=spawn(g,'howler');h.howl=-.01;const saved=g.serialize();assert.equal(saved.zombies[0].howl,0);
  resume(g,saved);g.updateZombies(.04);assert.ok(g.zombies[0].howl>=8);assert.ok(g.particles.length>=10);
});
