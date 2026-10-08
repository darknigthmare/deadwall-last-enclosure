'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Display = require('../src/display-quality153.js');
const { bootGame } = require('./helpers/browser.cjs');

function frames(policy, milliseconds, duration, context) {
  for (let elapsed = 0; elapsed < duration; elapsed += milliseconds) policy.observe(milliseconds, context);
}

test('affichage153 : charge durable réduit la résolution sans descendre sous une densité de un', () => {
  const quality = Display.create(2);
  quality.observe(100); assert.equal(quality.dpr, 2, 'une seule frame lente ne change rien');
  frames(quality, 100, 1000); assert.equal(quality.dpr, 1.5);
  frames(quality, 100, 4000); assert.equal(quality.dpr, 1);
  frames(quality, 100, 10000); assert.equal(quality.dpr, 1);
});

test('affichage153 : reprise progressive exige une longue cadence stable et respecte le DPR matériel', () => {
  const quality = Display.create(1.75);
  frames(quality, 80, 6000); assert.equal(quality.dpr, 1);
  frames(quality, 16, 14000); assert.equal(quality.dpr, 1);
  frames(quality, 16, 5000); assert.equal(quality.dpr, 1.5);
  frames(quality, 16, 20000); assert.equal(quality.dpr, 1.75);
  frames(quality, 16, 30000); assert.equal(quality.dpr, 1.75);
});

test('affichage153 : pause, onglet caché et interruption longue ne dégradent ni ne restaurent la résolution', () => {
  const quality = Display.create(2);
  frames(quality, 100, 6000); assert.equal(quality.dpr, 1);
  frames(quality, 16, 14000);
  frames(quality, 16, 60000, { active: false });
  frames(quality, 100, 60000, { visible: false });
  for (const invalid of [NaN, Infinity, -16, 0, 5000]) quality.observe(invalid);
  frames(quality, 16, 14000); assert.equal(quality.dpr, 1, 'la pause interrompt la preuve de reprise rapide');
  frames(quality, 16, 5000); assert.equal(quality.dpr, 1.5);
});

test('affichage153 : jitter isolé et cadence intermédiaire évitent les oscillations de qualité', () => {
  const quality = Display.create(2);
  for (let i = 0; i < 200; i++) quality.observe(i % 40 === 0 ? 100 : 16);
  assert.equal(quality.dpr, 2);
  frames(quality, 50, 5000); assert.equal(quality.dpr, 1);
  frames(quality, 22, 60000); assert.equal(quality.dpr, 1);
  assert.equal(quality.reset(3), 2);
  assert.equal(Display.create(1).dpr, 1);
});

test('boucle153 : l’adaptation conserve dimensions CSS, entrées et temps avec des pas physiques plafonnés', () => {
  globalThis.DeadwallDisplayQuality153 = Display;
  const { game: g } = bootGame();
  const oldDpr = globalThis.devicePixelRatio;
  try {
    globalThis.devicePixelRatio = 2; g.settings.quality = 'auto'; g.resize();
    const before = { width: g.width, height: g.height, mouseX: g.input.mouseX, mouseY: g.input.mouseY };
    const steps = [], edges = [], paintings = [];
    g.state = 'playing'; g.paused = false; g.gameOver = false; g.activeOverlay = null; g.lastFrame = 0;
    g.input.pressed.add('KeyE');
    g.update = dt => { steps.push(dt); edges.push(g.input.pressed.has('KeyE')); };
    g.render = () => paintings.push({ dpr: g.dpr, width: g.canvas.width, height: g.canvas.height });
    for (let i = 1; i <= 60; i++) g.loop(i * 100);
    assert.equal(g.dpr, 1); assert.equal(g.canvas.width, g.width); assert.equal(g.canvas.height, g.height);
    assert.deepEqual({ width: g.width, height: g.height, mouseX: g.input.mouseX, mouseY: g.input.mouseY }, before);
    assert.ok(steps.every(dt => dt > 0 && dt <= .04)); assert.equal(steps.length, 180);
    assert.ok(Math.abs(steps.reduce((sum,dt)=>sum+dt,0)-6)<1e-10);
    assert.equal(paintings.length,60);
    assert.equal(edges.filter(Boolean).length, 1); assert.equal(edges[0], true);
    assert.ok(paintings.every(p => p.width === Math.floor(before.width * p.dpr) && p.height === Math.floor(before.height * p.dpr)));
    g.settings.quality = 'high'; g.resize(); assert.equal(g.dpr, 2);
    for (let i = 61; i <= 120; i++) g.loop(i * 100);
    assert.equal(g.dpr, 2);
    g.settings.quality = 'low'; g.resize(); assert.equal(g.dpr, 1);
  } finally { globalThis.devicePixelRatio = oldDpr; }
});

test('résolution153 : changer l’affichage ne modifie ni campagne, ni sauvegarde, ni aléa', () => {
  globalThis.DeadwallDisplayQuality153 = Display;
  const { game: g } = bootGame(); g.startNew('standard', '42');
  const before = g.serialize(), rng = g.random.state;
  frames(g.displayQuality153, 100, 6000);
  g.applyDisplayResolution153(g.displayQuality153.dpr);
  const after = g.serialize();
  // Serialization stamps the current wall clock; rendering must preserve every campaign field.
  after.timestamp = before.timestamp;
  assert.deepEqual(after, before); assert.equal(g.random.state, rng);
  assert.equal(Object.hasOwn(g.serialize(), 'displayQuality153'), false);
});
