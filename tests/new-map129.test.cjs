'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');

test('carte129 : une horloge figée et une entropie répétée ne rejouent pas deux nouvelles cartes consécutives', () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const now = Date.now, random = Math.random;
  Date.now = () => 1700000000000; Math.random = () => .25;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues(values) { values[0] = 17117; return values; } } });
  try {
    const { game } = bootGame();
    game.startNew('standard', '17117');
    game.startNew('standard', ''); const first = game.world.seed;
    game.startNew('standard', ''); const second = game.world.seed;
    assert.notEqual(first, 17117); assert.notEqual(second, first);
    game.startNew('standard', '17117'); assert.equal(game.world.seed, 17117);
    game.startNew('standard', '0'); assert.equal(game.world.seed, 0);
    game.startNew('standard', '4294967295'); assert.equal(game.world.seed, 4294967295);
  } finally {
    Date.now = now; Math.random = random;
    if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor); else delete globalThis.crypto;
  }
});

test('carte129 : tirer une graine ne remplace pas la campagne et le démarrage reprend exactement le nombre affiché', () => {
  const { game, elements } = bootGame(); game.startNew('standard', '17117');
  const stableSnapshot = () => { const state = game.serialize(); delete state.timestamp; return JSON.stringify(state); };
  const before = stableSnapshot();
  elements.get('randomMapSeedButton').dispatch('click');
  const shown = elements.get('mapSeed').value;
  assert.match(shown, /^\d{1,10}$/); assert.notEqual(shown, '17117');
  assert.equal(stableSnapshot(), before);
  game.startNew('standard', shown); assert.equal(game.world.seed, Number(shown));
});

test('carte129 : repli sans crypto conserve des uint32 distincts malgré horloge et Math.random constants', () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const now = Date.now, random = Math.random;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  Date.now = () => 0; Math.random = () => 0;
  try {
    const { game } = bootGame(); const first = game.freshMapSeed(), second = game.freshMapSeed();
    assert.notEqual(first, second); assert.ok(first >= 0 && first <= 0xffffffff); assert.ok(second >= 0 && second <= 0xffffffff);
  } finally {
    Date.now = now; Math.random = random;
    if (cryptoDescriptor) Object.defineProperty(globalThis, 'crypto', cryptoDescriptor); else delete globalThis.crypto;
  }
});
