'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

function setup() {
  const env = bootDocument134(), g = env.g;
  g.startNew('standard', '17117');
  g.campaignIntro132.skip();
  g.render = () => {};
  g.canvas.focus();
  return env;
}

function inventoryKey(env, code, repeat) {
  let prevented = false, stopped = false;
  env.g.loadoutUI.overlay.dispatch('keydown', {
    code, key: code === 'KeyI' ? 'i' : 'Escape', repeat, target: env.doc.activeElement,
    preventDefault() { prevented = true; }, stopPropagation() { stopped = true; }
  });
  return { prevented, stopped };
}

for (const origin of ['terrain', 'pause', 'commandement', 'carte']) {
  test('sac clavier : maintenir I conserve la pause depuis ' + origin, () => {
    const env = setup(), { g, doc } = env;
    let expectedOverlay = null, expectedPause = false, returnFocus = g.canvas;
    if (origin === 'pause') {
      g.togglePause(true); expectedOverlay = g.ui.pauseMenu; expectedPause = true;
      returnFocus = doc.getElementById('resumeButton'); returnFocus.focus();
    } else if (origin === 'commandement') {
      g.showCommand(true, 'workers'); expectedOverlay = g.ui.commandModal; expectedPause = true;
      returnFocus = doc.getElementById('commandClose'); returnFocus.focus();
    } else if (origin === 'carte') {
      g.exploration125.openMap();
      assert.equal(g.exploration125.overlayOpen(), true);
    }

    env.dispatchDocument('keydown', { code: 'KeyI', key: 'i', repeat: false, target: doc.activeElement });
    assert.equal(g.loadoutUI.isOpen(), true);
    assert.equal(g.exploration125.overlayOpen(), false, 'la carte ne reste pas derrière le sac');
    assert.equal(g.activeOverlay, g.loadoutUI.overlay);
    assert.equal(g.paused, true);
    const focus = doc.activeElement;
    assert.ok(g.loadoutUI.overlay.contains(focus));
    const before = JSON.stringify({ elapsed: g.elapsed, phaseTime: g.phaseTime, carry: g.player.carry, resources: g.resources });

    for (const code of ['KeyI', 'Escape']) for (let held = 0; held < 4; held++) {
      assert.deepEqual(inventoryKey(env, code, true), { prevented: true, stopped: true });
      assert.equal(g.loadoutUI.isOpen(), true, 'une répétition ne constitue pas une fermeture volontaire');
      assert.equal(g.activeOverlay, g.loadoutUI.overlay);
      assert.equal(g.paused, true);
      assert.equal(doc.activeElement, focus);
      g.loop(g.lastFrame + 40);
    }
    assert.equal(JSON.stringify({ elapsed: g.elapsed, phaseTime: g.phaseTime, carry: g.player.carry, resources: g.resources }), before);
    assert.equal(g.input.pressed.size, 0); assert.equal(g.input.keys.size, 0);

    env.dispatchWindow('keyup', { code: 'KeyI', key: 'i', target: focus });
    assert.deepEqual(inventoryKey(env, 'KeyI', false), { prevented: true, stopped: true });
    assert.equal(g.loadoutUI.isOpen(), false, 'le second appui volontaire ferme le sac');
    assert.equal(g.activeOverlay, expectedOverlay);
    assert.equal(g.paused, expectedPause);
    assert.equal(doc.activeElement, returnFocus);
    if (origin === 'commandement') {
      g.showCommand(false);
      assert.equal(g.paused, false);
      assert.equal(g.activeOverlay, null);
    }
  });
}

test('sac clavier : Échap ferme sur un nouvel appui et I reste sans effet dans le menu', () => {
  const env = setup(), { g, doc } = env;
  env.dispatchDocument('keydown', { code: 'KeyI', key: 'i', repeat: false, target: doc.activeElement });
  assert.equal(g.loadoutUI.isOpen(), true);
  assert.deepEqual(inventoryKey(env, 'Escape', false), { prevented: true, stopped: true });
  assert.equal(g.loadoutUI.isOpen(), false); assert.equal(g.paused, false);
  assert.equal(doc.activeElement, g.canvas);

  g.returnToMenu();
  const world = g.world, focus = doc.activeElement;
  for (const repeat of [false, true]) env.dispatchDocument('keydown', { code: 'KeyI', key: 'i', repeat, target: focus });
  assert.equal(g.loadoutUI.isOpen(), false);
  assert.equal(g.activeOverlay, g.ui.mainMenu); assert.equal(g.state, 'menu');
  assert.equal(g.world, world); assert.equal(doc.activeElement, focus);
});
