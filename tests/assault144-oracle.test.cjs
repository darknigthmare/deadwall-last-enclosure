'use strict';

const test = require('node:test'), assert = require('node:assert/strict');
const { positionFrontCounts, unobservedEchelonTerms } = require('../scripts/assault144-oracle.cjs');
const { direction } = require('../src/battlefield.js');
const core = { x: 2048, y: 2048 };

test('assault QA derives current sectors from bearings, including diagonal ties and the centre', () => {
  assert.deepEqual(positionFrontCounts(core, [
    { x: 2048, y: 18 }, { x: 3000, y: 1096 }, { x: 1096, y: 1096 },
    { x: 4078, y: 2048 }, { x: 2048, y: 4078 }, { x: 3000, y: 3000 },
    { x: 1096, y: 3000 }, { x: 18, y: 2048 }, { ...core }
  ]), { north: 3, east: 1, south: 4, west: 1 });
  assert.equal(positionFrontCounts(core, [{ x: Infinity, y: 18 }]), null);
  assert.equal(positionFrontCounts(null, []), null);
});

test('assault QA bearings agree with the current sector contract on both sides of each diagonal', () => {
  for (const origin of [core, { x: 1.125, y: -3.75 }]) {
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const offset of [-1e-7, 0, 1e-7]) {
      const point = { x: origin.x + sx * (100 + offset), y: origin.y + sy * 100 };
      const expected = { north: 0, east: 0, south: 0, west: 0 }; expected[direction(origin, point)] = 1;
      assert.deepEqual(positionFrontCounts(origin, [point]), expected, JSON.stringify({ origin, point }));
    }
    for (const [dx, dy] of [[0, -100], [100, 0], [0, 100], [-100, 0], [0, 0]]) {
      const point = { x: origin.x + dx, y: origin.y + dy };
      const expected = { north: 0, east: 0, south: 0, west: 0 }; expected[direction(origin, point)] = 1;
      assert.deepEqual(positionFrontCounts(origin, [point]), expected);
    }
  }
  const point = { x: 247.99999999999955, y: 248 };
  assert.equal(direction(core, point), 'west');
  assert.deepEqual(positionFrontCounts(core, [point]), { north: 0, east: 0, south: 0, west: 1 }, 'A bearing rounded onto a diagonal retains its physical side');
});

function firstPause() {
  // A contact that arrived near the northwest corner can be west of the
  // diagonal after moving south; the hidden contact still reveals no sector.
  const zombies = Array.from({ length: 7 }, (_, i) => ({ x: 1000 + i * 100, y: 18 }));
  zombies.push({ x: 80, y: 120 });
  return { core, zombies, fronts: { north: 7, east: 0, south: 0, west: 1 }, observed: 0,
    observedFronts: { north: 0, east: 0, south: 0, west: 0 },
    detail: '8 présents · 16 encore à venir. Aucun contact actuellement observé. Arrivées annoncées : EST.' };
}

test('assault QA checks all eight actual positions without confusing an arrival edge with current sectors', () => {
  const snapshot = firstPause();
  assert.ok(Object.values(unobservedEchelonTerms(snapshot)).every(Boolean));
  snapshot.fronts = { north: 8, east: 0, south: 0, west: 0 };
  assert.equal(unobservedEchelonTerms(snapshot).exactCurrentSectors, false);
  snapshot.zombies.pop();
  assert.equal(unobservedEchelonTerms(snapshot).eightPositionedContacts, false);
});

test('assault QA retains every observation and announced-arrival assertion with named diagnostics', () => {
  for (const [term, mutate] of [
    ['noObservedContacts', s => { s.observed = 1; }],
    ['noObservedSectors', s => { s.observedFronts.west = 1; }],
    ['noObservedSectors', s => { delete s.observedFronts.north; }],
    ['noObservedSectors', s => { s.observedFronts.unexpected = 1; }],
    ['emptyObservationLabel', s => { s.detail = s.detail.replace('Aucun contact actuellement observé.', ''); }],
    ['noNorthDisclosure', s => { s.detail += ' NORD'; }],
    ['eastArrivalLabel', s => { s.detail = s.detail.replace('Arrivées annoncées : EST.', 'Arrivées annoncées : SUD.'); }]
  ]) {
    const snapshot = firstPause(); mutate(snapshot);
    assert.equal(unobservedEchelonTerms(snapshot)[term], false, term);
  }
});
