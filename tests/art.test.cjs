'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Art = require('../src/art.js');
const Core = require('../src/core.js');

test('art: tous les bâtiments et infectés ont un atlas ou un effet géométrique déclaré', () => {
  for (const [id, def] of Object.entries(Core.BUILDINGS))
    assert.ok(Art.BUILDINGS[id] || Art.PROPS[id] || Art.DEFENSES[id], id);
  for (const id of Object.keys(Core.ENEMIES)) assert.ok(Art.ACTORS[id], id);
  for (const spec of Object.values(Art.ASSETS)) {
    assert.ok(fs.statSync(path.join(__dirname, '..', spec.url)).size > 1000);
    const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
    assert.ok(sw.includes(spec.url), spec.url + ' hors cache PWA');
  }
});
test('art: cellules et 64 poses animées restent dans leurs atlas sans dépasser', () => {
  for (const [atlas, rects] of [['buildings', Art.BUILDINGS], ['props', Art.PROPS], ['defenses', Art.DEFENSES]]) {
    const spec = Art.ASSETS[atlas];
    for (const rect of Object.values(rects)) {
      assert.ok(rect[0] >= 0 && rect[1] >= 0 && rect[2] > 0 && rect[3] > 0);
      assert.ok(rect[0] + rect[2] <= spec.width && rect[1] + rect[3] <= spec.height);
    }
  }
  for (const [atlas, row] of Object.values(Art.ACTORS)) for (let frame = 0; frame < 8; frame++) {
    const [x, y, w, h] = Art.frameRect(atlas, row, frame);
    assert.ok(x >= 0 && y >= 0 && x + w <= Art.ASSETS[atlas].width && y + h <= Art.ASSETS[atlas].height);
  }
});
test('art: import du chroma et du damier sans effacer les marques claires isolées', () => {
  const magenta = new Uint8ClampedArray([255, 0, 255, 255, 80, 70, 50, 255]);
  Art.decodeMatte(magenta, 2, 1, 'magenta');
  assert.equal(magenta[3], 0); assert.equal(magenta[7], 255);
  const neutral = new Uint8ClampedArray(5 * 5 * 4);
  for (let i = 0; i < 25; i++) neutral.set([240, 240, 240, 255], i * 4);
  for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) neutral.set([80, 80, 70, 255], (y * 5 + x) * 4);
  neutral.set([240, 240, 240, 255], 12 * 4);
  Art.decodeMatte(neutral, 5, 5, 'neutral');
  assert.equal(neutral[3], 0); assert.equal(neutral[12 * 4 + 3], 255);
  assert.deepEqual(Art.tightRect(neutral, 5, [0, 0, 5, 5]), [1, 1, 3, 3]);
});
