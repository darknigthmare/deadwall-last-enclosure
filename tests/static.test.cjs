'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('toutes les dépendances statiques et commandes UI existent', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const game = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));
  const clicked = [...game.matchAll(/click\('([^']+)'/g)].map(match => match[1]);
  const direct = [...game.matchAll(/getElementById\('([^']+)'\)/g)].map(match => match[1]);
  for (const id of new Set([...clicked, ...direct])) assert.ok(ids.has(id), `élément HTML manquant: #${id}`);
  assert.ok(fs.existsSync(path.join(root, 'src/core.js')));
  assert.ok(fs.existsSync(path.join(root, 'src/game.js')));
  assert.match(html, /src\/core\.js/);
  assert.match(html, /src\/game\.js/);
  assert.match(game, /Math\.max\(320, innerWidth\)/, 'le canvas mobile doit suivre le viewport');
  assert.match(game, /touchFire/, 'la visée tactile doit être câblée');
  assert.match(game, /hasResearch\('ballistics'\)/);
  assert.match(game, /hasResearch\('fortification'\)/);
  assert.match(game, /hasResearch\('grid'\)/);
});

test('build: la sortie publique n’expose pas les sources de pilotage', () => {
  const dist = path.join(root, 'dist');
  assert.ok(fs.existsSync(dist), 'le build public doit exister avant le test de surface');
  for (const blocked of ['AGENTS.md', 'SOURCE_PROVENANCE.md', 'tests', 'docs', 'scripts']) {
    assert.equal(fs.existsSync(path.join(dist, blocked)), false, `ne doit pas être publié: ${blocked}`);
  }
  assert.ok(fs.existsSync(path.join(dist, 'sw.js')));
  assert.ok(fs.existsSync(path.join(dist, 'assets', 'icon.svg')));
  assert.ok(fs.existsSync(path.join(dist, 'assets', 'icon-192.png')));
  assert.ok(fs.existsSync(path.join(dist, 'assets', 'icon-512.png')));
  const backdrop = fs.readFileSync(path.join(dist, 'assets', 'deadwall-keyart-v2.webp'));
  assert.equal(backdrop.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(backdrop.subarray(8, 12).toString('ascii'), 'WEBP');
  assert.ok(backdrop.length < 700_000, 'le fond de menu doit rester léger');
  const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  assert.match(sw, /assets\/deadwall-keyart-v2\.webp/);
  const standalone = fs.readFileSync(path.join(root, 'DEADWALL_Standalone.html'), 'utf8');
  assert.doesNotMatch(standalone, /href="(?:styles\.css|manifest\.json)/);
  assert.doesNotMatch(standalone, /src="(?:src\/|assets\/)/);
  assert.doesNotMatch(standalone, /serviceWorker\.register/);
  assert.match(standalone, /data:image\/webp;base64/);
  assert.doesNotMatch(standalone, /assets\/deadwall-keyart-v2\.webp/);
  assert.doesNotMatch(standalone, /url\(\s*["']?assets\//);
});
