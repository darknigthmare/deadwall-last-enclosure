/**
 * Explicit scenario preparation, serializable through page.evaluate.
 * Search does not place trial houses, allocate IDs, consume RNG or clear nodes.
 * The completed starting house and finite stocks are declared fixtures; its
 * destruction and every subsequent reconstruction action use the shipped game.
 */
export function reconstructionFixture() {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (!g?.world || !g.fieldcraft || !g.infrastructure || !g.canIssueCommand()) throw Error('Reconstruction fixture requires an active native campaign');
  const def = g.world.definition('house'), Building = g.core().constructor;
  const anchor = { gx: 74, gy: 70 }, maxRadius = 16, range = C.Infrastructure.RULES.workRange;
  const before = { units: g.units.length, zombies: g.zombies.length, resources: { ...g.resources },
    player: { x: g.player.x, y: g.player.y }, randomState: g.random.state, nextId: g.nextId };
  const nodesBefore = JSON.stringify(g.world.nodes), rejected = [];
  let selected = null, examined = 0;

  // Stable square rings keep the historical anchor first, then ask the same
  // native placement validator about nearby plots. No terrain is rewritten.
  search: for (let radius = 0; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const gx = anchor.gx + dx, gy = anchor.gy + dy;
        examined++;
        const placement = g.world.placement(def, gx, gy, 0);
        if (!placement.valid) { rejected.push({ gx, gy, reason: placement.reason }); continue; }
        const b = new Building(g.nextId, 'house', gx, gy, 0, 1, g.world.cityGeometry202);
        // world.add clears live nodes within this native six-unit reserve;
        // placement has only a four-unit margin. Preserve that entire reserve.
        const node = g.world.nodes.find(n => !n.depleted && n.x + n.radius > b.left - 6 && n.x - n.radius < b.right + 6 && n.y + n.radius > b.top - 6 && n.y - n.radius < b.bottom + 6);
        if (node) { rejected.push({ gx, gy, reason: 'Native world.add node clearance', node: node.id }); continue; }
        const point = g.fieldcraft.service(g.player, b), probe = point && { ...g.player, ...point };
        if (!point || !g.workerCanWorkAt(probe, b, range)) {
          rejected.push({ gx, gy, reason: 'No physically free native exterior service point' }); continue;
        }
        selected = { b, point: { x: point.x, y: point.y } }; break search;
      }
    }
  }
  if (!selected) throw Error('No legal, physically accessible reconstruction house within ' + maxRadius + ' cells: ' + JSON.stringify({ examined, rejected }));
  if (g.random.state !== before.randomState || g.nextId !== before.nextId || JSON.stringify(g.world.nodes) !== nodesBefore) throw Error('Reconstruction plot search changed native campaign state');

  // All declared preparation mutations happen after a complete legal selection.
  const { b, point } = selected;
  g.units = []; g.zombies = []; g.rebuildBuckets();
  g.resources.wood = g.resources.scrap = g.resources.stone = 400;
  g.nextId++; g.world.add(b); g.refreshMetrics(true);
  g.player.x = point.x; g.player.y = point.y;
  if (!g.workerCanWorkAt(g.player, b, range)) throw Error('Selected reconstruction house lost its native exterior access');
  const randomBeforeDestruction = g.random.state;
  g.destroyBuilding(b); g.refreshMetrics(true);
  // Destruction legitimately advances RNG for its ordinary debris particles.
  // Keep that state; never reset it to the value before the fixture.
  const randomAfterDestruction = g.random.state;
  if (JSON.stringify(g.world.nodes) !== nodesBefore) throw Error('Reconstruction preparation changed finite resource nodes');
  const status = g.infrastructure.reconstructionStatus(b.id);
  if (!status.ok) throw Error('Selected ruin cannot be reconstructed through native rules: ' + status.reason);
  globalThis.__DEADWALL_RECONSTRUCTION_FIXTURE__ = { id: b.id, gx: b.gx, gy: b.gy };
  g.infrastructure.open(); g.infrastructureUI.choose('rebuild');
  return {
    injected: true, kind: 'completed-house-destruction', before, exhaustedNodes: 0,
    selection: { anchor, maxRadius, examined, rejected, point, geometryVersion202: b.geometryVersion202,
      randomBeforeSearch: before.randomState, randomBeforeDestruction, randomAfterDestruction },
    after: { units: g.units.length, zombies: g.zombies.length, resources: { ...g.resources },
      player: { x: g.player.x, y: g.player.y }, randomState: g.random.state, nextId: g.nextId },
    id: b.id, type: b.type, gx: b.gx, gy: b.gy, rotation: b.rotation,
    housing: g.housing, housingGain: def.housing, cost: { ...def.cost }, resources: { ...g.resources },
    debris: g.fortificationPack.snapshot().debris,
    reconstructedBefore: g.infrastructure.snapshot().stats.reconstructed,
    notes: 'A deterministic native placement search preserves natural and funded roads and all finite nodes. The completed starting house is explicitly injected without claiming its original cost or work was paid. Destruction uses destroyBuilding, including its normal RNG advancement; finite debris is retained. Commander position and stocks are fixtures, not organically earned state.'
  };
}
