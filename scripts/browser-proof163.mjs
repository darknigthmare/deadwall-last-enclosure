/** Exact presentation probes; never advance simulation or select an arbitrary atlas. */
export function matchesDeliveryVersion163(expected, footer) {
  if (typeof expected !== 'string' || !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(expected) || typeof footer !== 'string') return false;
  const versions = [...footer.matchAll(/\bVERSION\s+([^\s·]+)/g)];
  return versions.length === 1 && versions[0][1] === expected;
}

// Self-contained so Playwright can execute the same probe in the game page.
export function observeCoreFrame163() {
  const g = globalThis.DEADWALL, registry = globalThis.DeadwallD17Art149, variants = globalThis.DeadwallBuildingVariants157;
  const core = g?.core(), art = g?.art, model = g?.d17Art149?.coreSprite(g.tier.id);
  if (!core || !art || !registry?.SPRITES[model] || typeof art.blit !== 'function') throw Error('Live core painter and registry required');
  const expected = variants?.alternateFor(model, core.id, g.world.seed, art.images) || registry.SPRITES[model];
  const frame = registry.measure(model, core, { rise: 56, sprite: expected });
  const stable = () => { const { timestamp, ...data } = g.serialize(); return JSON.stringify(data); };
  const before = stable(), drawBuilding = art.drawBuilding, blit = art.blit, calls = [];
  let insideCore = 0;
  art.drawBuilding = function (context, building, ...args) {
    if (building !== core) return drawBuilding.call(this, context, building, ...args);
    insideCore++;
    try { return drawBuilding.call(this, context, building, ...args); }
    finally { insideCore--; }
  };
  art.blit = function (context, atlas, source, ...destination) {
    const result = blit.call(this, context, atlas, source, ...destination);
    if (insideCore && result !== false) calls.push({ atlas, source: [...source], destination });
    return result;
  };
  try { g.render(); }
  finally { art.drawBuilding = drawBuilding; art.blit = blit; }
  const same = (a, b) => a.length === b.length && a.every((value, i) => Number.isFinite(value) && Math.abs(value - b[i]) < 1e-8);
  return {
    age: g.tier.id, coreId: core.id, coreSprite: model, atlas: expected.atlas,
    expected: { atlas: expected.atlas, source: [...expected.rect], destination: frame.destination }, calls,
    exactDraw: calls.some(call => call.atlas === expected.atlas && same(call.source, expected.rect) && same(call.destination, frame.destination)),
    savedUnchanged: stable() === before,
    ready: [...art.diagnostics.ready].sort(), failed: [...art.diagnostics.failed],
    declared: Object.keys(globalThis.DeadwallArt.ASSETS).sort()
  };
}
