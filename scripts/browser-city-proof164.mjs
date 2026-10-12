/** Observe real model-bound paint calls; no simulation advance or permanent camera change. */
export function observeCityFrames164() {
  const g = globalThis.DEADWALL, registry = globalThis.DeadwallD17Art150;
  const definitions = globalThis.DeadwallCore?.CityContent150?.BUILDINGS;
  const assets = globalThis.DeadwallArt?.ASSETS, art = g?.art;
  if (!definitions || !registry || !assets || !art?.images || typeof art.blit !== 'function') {
    throw Error('Live city renderer, model registry and decoded images required');
  }
  const ids = Object.keys(definitions), live = [...g.world.buildings.values()];
  const models = ids.map(type => live.find(b => b.type === type && b.completed && !b.dead));
  if (models.some(b => !b)) throw Error('Missing live city supports: ' + ids.filter((_, i) => !models[i]).join(', '));
  const expected = models.map(b => {
    // The renderer owns variant selection and metric placement; the probe requires
    // its exact source crop, destination AND live building identity, not just an atlas.
    const frame = registry.measure(b, { seed: g.world.seed, art });
    if (!frame || !art.images[frame.atlas] || !assets[frame.atlas]) throw Error('Undecoded city frame: ' + b.type);
    return { id: b.type, buildingId: b.id, atlas: frame.atlas, source: [...frame.source], destination: [...frame.destination] };
  });
  const stable = () => { const { timestamp, ...saved } = g.serialize(); return JSON.stringify(saved); };
  const before = stable(), drawBuilding = art.drawBuilding, blit = art.blit, stack = [], paints = [];
  const targets = new Set(models);
  art.drawBuilding = function (context, building, ...args) {
    stack.push(targets.has(building) ? building : null);
    try { return drawBuilding.call(this, context, building, ...args); }
    finally { stack.pop(); }
  };
  art.blit = function (context, atlas, source, ...destination) {
    const painted = blit.call(this, context, atlas, source, ...destination), building = stack.at(-1);
    if (building && painted !== false) paints.push({ id: building.type, buildingId: building.id, atlas, source: [...source], destination });
    return painted;
  };
  try { g.render(); }
  finally { art.drawBuilding = drawBuilding; art.blit = blit; }
  const same = (a, b) => a.length === b.length && a.every((n, i) => Number.isFinite(n) && Number.isFinite(b[i]) && Math.abs(n - b[i]) < 1e-8);
  const paintedIds = expected.filter(e => paints.some(p => p.id === e.id && p.buildingId === e.buildingId && p.atlas === e.atlas && same(p.source, e.source) && same(p.destination, e.destination))).map(e => e.id);
  const keys = [...new Set([...Object.keys(registry.ASSETS), ...expected.map(e => e.atlas)])];
  return {
    ids, spriteIds: Object.keys(registry.SPRITES), expected, paints, paintedIds,
    missingIds: ids.filter(id => !paintedIds.includes(id)),
    decoded: keys.map(key => ({ key, width: art.images[key]?.width, height: art.images[key]?.height, expectedWidth: assets[key]?.width, expectedHeight: assets[key]?.height })),
    persistentUnchanged: before === stable()
  };
}
