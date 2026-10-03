'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');

function fixture() {
  const env = bootDocument134(), { g, doc } = env;
  // Extend the deliberately limited DOM fixture with native variadic prepend
  // semantics; this fixture does not claim to measure CSS or physical gameplay.
  Object.getPrototypeOf(doc.body).prepend = function (...nodes) { for (let i = nodes.length - 1; i >= 0; i--) { nodes[i].remove(); nodes[i].parentNode = this; this.children.unshift(nodes[i]); } };
  g.startNew('standard', '903145'); g.campaignIntro132.skip();
  let compact = true; g.isCompactViewport = () => compact; g.height = 390;
  g.player.x = 4058; g.player.y = 2068;
  assert.equal(g.frontier.enter(), true, 'Explicit physical-boundary state fixture enters the existing region');
  g.worldEvolutionUI.refresh(true); g.hud135.refresh();
  return { ...env, compact(value) { compact = value; g.worldEvolutionUI.refresh(true); g.hud135.refresh(); } };
}

test('Ruban régional145 : redimensionner conserve les vrais nœuds et rend leurs propriétaires locaux au retour', () => {
  const { g, doc, compact } = fixture(), get = id => doc.getElementById(id);
  const ids = ['fieldDock', 'fieldDockMap', 'fieldDockBag', 'fieldDockGear', 'fieldDockPosture', 'interactionHint', 'hud135RegionTools', 'frontierCargo', 'frontierFuel'];
  const nodes = ids.map(get), before = g.serialize();
  assert.equal(get('fieldDock').parentNode.id, 'hud135Auxiliary');
  assert.ok(get('fieldDockTerrain').contains(get('interactionHint')));
  assert.ok(get('fieldDockTerrain').contains(get('hud135RegionTools')));
  for (let i = 0; i < 4; i++) { compact(false); assert.equal(get('fieldDock').parentNode.id, 'hud135Context'); assert.equal(get('interactionHint').parentNode.id, 'hud135Context'); compact(true); }
  for (let i = 0; i < ids.length; i++) { assert.equal(get(ids[i]), nodes[i]); assert.equal(doc.body.querySelectorAll('#' + ids[i]).length, 1, ids[i]); }
  const after = g.serialize(); assert.deepEqual(after.resources, before.resources); assert.deepEqual(after.player, before.player); assert.deepEqual(after.frontier, before.frontier); assert.equal(after.elapsed, before.elapsed);
  g.frontier = { ...g.frontier, active: () => false }; g.worldEvolutionUI.refresh(true);
  assert.equal(get('fieldDock').parentNode.id, 'hud135Context'); assert.equal(get('interactionHint').parentNode.id, 'hud135Context'); assert.equal(get('fieldDockTerrain').open, false);
});

test('Ruban régional145 : rafraîchir ne retire pas une nouvelle entrée et les volets explicites restent exclusifs', () => {
  const { g, doc } = fixture(), get = id => doc.getElementById(id), terrain = get('fieldDockTerrain');
  g.input.keys.add('KeyD'); for (let i = 0; i < 12; i++) g.worldEvolutionUI.refresh(true);
  assert.ok(g.input.keys.has('KeyD'), 'Rendering and node ownership preserve a new held movement');
  get('hud135Tools').open = true; get('touchCommandDrawer').open = true;
  get('fieldDockTerrainToggle').click(); assert.equal(g.input.keys.size, 0); assert.equal(get('hud135Tools').open, false); assert.equal(get('touchCommandDrawer').open, false);
  terrain.open = true; g.input.keys.add('KeyD'); g.worldEvolutionUI.refresh(true); assert.ok(g.input.keys.has('KeyD'), 'Programmatic details state does not cancel movement');
  get('hud135ToolsToggle').click(); assert.equal(terrain.open, false);
});

test('Ruban régional145 : la cible et le niveau sont visibles dans le résumé, le message complet reste conservé', () => {
  const { g, doc } = fixture();
  g.interactionText = 'Rayonnage de matériel · Ferraille · 22.0 restant · T cible suivante'; g.worldEvolutionUI.refresh(true);
  assert.equal(doc.getElementById('fieldDockTerrainToggle').querySelector('.field-dock-target').textContent, 'Rayonnage de matériel');
  assert.match(doc.getElementById('fieldDockTerrainToggle').getAttribute('aria-label'), /22\.0 restant/);
  const original = g.frontier.position; g.frontier = { ...g.frontier, position: () => ({ ...original(), z: -1 }) }; g.worldEvolutionUI.refresh(true);
  assert.match(doc.getElementById('fieldDockTerrainToggle').querySelector('.field-dock-caption').textContent, /SOUS-SOL/);
  g.interactionText = 'RÉGION · E fouiller · C marche prudente · T changer de cible'; g.worldEvolutionUI.refresh(true);
  assert.equal(doc.getElementById('fieldDockTerrainToggle').querySelector('.field-dock-target').hidden, true);
});
