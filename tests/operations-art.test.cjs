'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const A = require('../src/operations-art.js');

test('operations art: eight measured silhouettes remain isolated in the source atlas', () => {
  assert.equal(Object.keys(A.SPRITES).length, 8);
  for (const {rect, pivot} of Object.values(A.SPRITES)) {
    const [x, y, w, h] = rect;
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0);
    assert.ok(x + w <= A.ASSET.width && y + h <= A.ASSET.height);
    assert.ok(pivot.every(n => n >= 0 && n <= 1));
    for (const other of Object.values(A.SPRITES)) {
      if (other.rect === rect) continue;
      const [a, b, c, d] = other.rect;
      assert.ok(x + w <= a || a + c <= x || y + h <= b || b + d <= y);
    }
  }
  assert.ok(A.SPRITES.tarp.rect[0] + A.SPRITES.tarp.rect[2] > 384, 'the complete rope extends beyond the nominal grid');
});

test('operations art: absent textures and invalid coordinates retain the existing painter', () => {
  const g = {}, installed = A.install(g), ctx = {drawImage() {assert.fail('nothing should draw');}};
  assert.equal(A.install(g), installed);
  assert.equal(installed.ready(), false);
  assert.equal(installed.draw(ctx, 'cache', 10, 20, 32), false);
  g.art = {images: {operations: {}}};
  assert.equal(installed.ready(), true);
  for (const args of [['unknown', 0, 0, 32], ['constructor', 0, 0, 32], ['cache', NaN, 0, 32], ['cache', 0, Infinity, 32], ['cache', 0, 0, 0], ['cache', 0, 0, -2]])
    assert.equal(installed.draw(ctx, ...args), false);
});

test('operations art: metre and local projections share geometry and preserve alpha', () => {
  const image = {}, calls = [], ctx = {globalAlpha: .37, drawImage(...args) {calls.push(args);}};
  const g = {art: {images: {operations: image}}}, renderer = A.install(g);
  for (const type of Object.keys(A.SPRITES)) {
    assert.equal(renderer.draw(ctx, type, 12, 15, 2), true);
    const metric = calls.at(-1);
    assert.equal(renderer.draw(ctx, type, 384, 480, 64), true);
    const local = calls.at(-1);
    assert.equal(metric[0], image);
    assert.deepEqual(metric.slice(1, 5), local.slice(1, 5));
    local.slice(5).forEach((n, i) => assert.equal(n, metric[i + 5] * 32));
  }
  assert.equal(ctx.globalAlpha, .37);
});

test('operations art: production renderer uses atlas diagnostics without touching simulation', () => {
  const calls = [], image = {}, game = {player: {x: 4, y: 7}, art: {images: {operations: image}, blit(...args) {calls.push(args);return true;}}};
  const before = JSON.stringify(game.player), ctx = {drawImage() {}};
  assert.equal(A.install(game).draw(ctx, 'marker', 30, 40, 26), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'operations');
  assert.equal(JSON.stringify(game.player), before);
});

test('operations art: unchanged generated PNG has alpha, expected dimensions and tracked provenance', () => {
  const meta = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/operations-atlas.json'), 'utf8'));
  const png = fs.readFileSync(path.join(__dirname, '..', A.ASSET.url));
  assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), A.ASSET.width);
  assert.equal(png.readUInt32BE(20), A.ASSET.height);
  assert.equal(png[25], 6, 'RGBA PNG');
  assert.equal(crypto.createHash('sha256').update(png).digest('hex'), meta.sha256);
  assert.deepEqual(meta.sprites, A.SPRITES);
  assert.equal(meta.pixelEdits, false);
});
