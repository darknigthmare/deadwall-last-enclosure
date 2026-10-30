'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {bootGame} = require('./helpers/browser.cjs');

function setup() {
  const env = bootGame();
  env.game.startNew('standard', '17117');
  return env;
}

function campaign(game) {
  const data = game.serialize();
  delete data.timestamp;
  return JSON.stringify(data);
}

for (const [label, stop] of [
  ['Pause', ({game}) => game.togglePause(true)],
  ['window focus loss', env => env.dispatchWindow('blur')],
  ['hidden document', env => { document.hidden = true; env.dispatchDocument('visibilitychange'); }]
]) {
  test('camera feedback keeps the last impact pose during ' + label, () => {
    const env = setup(), game = env.game;
    game.damagePlayer(1);
    game.render();
    assert.ok(game.camera.shake > 0, 'the actual damage event started its visual feedback');
    const pose = {...game.frameShake};
    stop(env);
    const before = campaign(game), elapsed = game.elapsed;
    game.lastFrame = 0;
    try {
      for (let frame = 1; frame <= 30; frame++) {
        game.loop(frame * 16);
        assert.deepEqual(game.frameShake, pose, 'painting a suspended simulation must not move its impact');
      }
      assert.equal(game.elapsed, elapsed);
      assert.equal(campaign(game), before);
    } finally { document.hidden = false; }
  });
}

test('camera feedback follows active time independently of the number of rendered frames', () => {
  const {game} = setup(), saved = structuredClone(game.serialize());
  function run(paints) {
    game.restoreSave(saved);
    game.damagePlayer(1);
    const poses = [];
    for (let step = 0; step < 8; step++) {
      game.update(.02);
      const before = campaign(game);
      for (let paint = 0; paint < paints; paint++) game.render();
      assert.equal(campaign(game), before, 'extra renders do not advance or mutate gameplay');
      assert.ok(Math.abs(game.frameShake.x) <= game.camera.shake / 2);
      assert.ok(Math.abs(game.frameShake.y) <= game.camera.shake / 2);
      poses.push({...game.frameShake});
    }
    assert.ok(new Set(poses.map(pose => JSON.stringify(pose))).size > 1, 'the impact still moves during active play');
    return poses;
  }
  assert.deepEqual(run(1), run(4));
});

test('camera feedback reaches neutral through the existing active-time decay', () => {
  const {game} = setup();
  game.damagePlayer(1);
  const initial = game.camera.shake;
  for (let step = 0; step < 30; step++) game.update(.02);
  game.render();
  assert.ok(initial > 0);
  assert.equal(game.camera.shake, 0);
  assert.deepEqual(game.frameShake, {x: 0, y: 0});
});

test('reduced motion suppresses the camera offset without changing the impact or campaign', () => {
  const {game} = setup();
  game.damagePlayer(1);
  game.render();
  const pose = {...game.frameShake}, amplitude = game.camera.shake, before = campaign(game);
  assert.ok(Math.hypot(pose.x, pose.y) > 0);
  game.settings.reducedMotion = true;
  game.render();
  assert.deepEqual(game.frameShake, {x: 0, y: 0});
  assert.equal(game.camera.shake, amplitude);
  assert.equal(campaign(game), before);
  game.settings.reducedMotion = false;
  game.render();
  assert.deepEqual(game.frameShake, pose);
});

test('new campaigns and Continue discard transient impact offsets before their first paint', () => {
  const {game} = setup();
  game.damagePlayer(1);
  game.render();
  assert.ok(game.camera.shake > 0);
  game.startNew('standard', '84329');
  assert.equal(game.world.seed, 84329);
  assert.equal(game.camera.shake, 0);
  assert.deepEqual(game.frameShake, {x: 0, y: 0});
  assert.equal(game.save(false), true);
  game.damagePlayer(1);
  game.render();
  assert.ok(game.camera.shake > 0);
  assert.equal(game.load(), true, 'the same-document Continue path restores the last saved campaign');
  assert.equal(game.camera.shake, 0);
  assert.deepEqual(game.frameShake, {x: 0, y: 0});
  game.render();
  assert.deepEqual(game.frameShake, {x: 0, y: 0});
});

test('rejected campaign creation or import preserves the current impact and world', () => {
  const {game} = setup();
  game.damagePlayer(1);
  game.render();
  const world = game.world, amplitude = game.camera.shake, pose = {...game.frameShake};
  assert.equal(game.startNew('standard', 'invalid seed'), false);
  assert.throws(() => game.restoreSave({...game.serialize(), version: -1}));
  assert.equal(game.world, world);
  assert.equal(game.camera.shake, amplitude);
  assert.deepEqual(game.frameShake, pose);
});
