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
});
