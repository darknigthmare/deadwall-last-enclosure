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
  for (const id of Object.keys(Core.SURVIVORS)) assert.ok(Art.ACTORS[id], id);
  for (const id of Object.keys(Core.SCENERY_DEFS||{})) assert.ok(Art.DISTRICT_PROPS[id], id);
  for (const spec of Object.values(Art.ASSETS)) {
    assert.ok(fs.statSync(path.join(__dirname, '..', spec.url)).size > 1000);
    const sw = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
    assert.ok(sw.includes(spec.url), spec.url + ' hors cache PWA');
  }
});
test('art: cellules et toutes les poses animées restent dans leurs atlas sans dépasser', () => {
  for (const [atlas, rects] of [['buildings', Art.BUILDINGS], ['props', Art.PROPS], ['defenses', Art.DEFENSES], ['districtProps',Art.DISTRICT_PROPS]]) {
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
test('art: variantes cosmétiques stables sans modifier le rôle ni remplacer les spécialistes',()=>{
  for(const kind of ['worker','soldier','walker']){
    assert.equal(Art.actorVariant(kind,1),kind+'Alt');assert.equal(Art.actorVariant(kind,2),kind);
    assert.equal(Art.actorVariant(kind,4),kind+'Alt');assert.ok(Art.ACTORS[Art.actorVariant(kind,1)]);
  }
  for(const kind of ['medic','engineer','breacher','stalker','bloated','player'])assert.equal(Art.actorVariant(kind,1),kind);
});
test('art: découpes de quartiers suivent les silhouettes observées sans fragment voisin',()=>{
  assert.deepEqual(Art.DISTRICT_PROPS.warehouseShell,[620,0,356,314]);
  assert.deepEqual(Art.DISTRICT_PROPS.guardBooth,[976,0,278,314]);
  assert.deepEqual(Art.DISTRICT_PROPS.burntTree,[326,920,268,334]);
  assert.deepEqual(Art.DISTRICT_PROPS.rubble,[596,940,344,314]);
  assert.equal(Object.keys(Art.DISTRICT_PROPS).length,16);
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
