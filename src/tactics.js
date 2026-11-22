(function initDeadwallTactics(global) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : global.DeadwallCore;
  if (!C) throw new Error('DeadwallCore introuvable pour les tactiques.');
  const GATE_MODES = Object.freeze(['auto', 'open', 'closed']);

  function definition(building) { return building?.def || C.CityGeometry202.definition(building?.type, building?.geometryVersion202 ?? 0); }
  function gateMode(building) { return GATE_MODES.includes(building?.gateMode) ? building.gateMode : 'auto'; }
  function operational(building) {
    return Boolean(building && !building.dead && building.health > 0 && (building.completed === undefined ? building.progress >= 1 : building.completed));
  }
  function isGate(building) { return Boolean(definition(building)?.gate); }
  function openGate(building) { return isGate(building) && operational(building) && gateMode(building) === 'open'; }
  function blocksFriendly(building) {
    const def = definition(building);
    return Boolean(operational(building) && def && building.type !== 'spikes' && (!def.gate || gateMode(building) === 'closed'));
  }
  function blocksEnclosure(building) {
    const def = definition(building);
    return Boolean(operational(building) && def?.wall && (!def.gate || gateMode(building) !== 'open'));
  }
  function footprint(building) {
    const def = definition(building); if (!def) return null;
    const [width, height] = Math.abs(building.rotation || 0) % 2 ? [def.size[1], def.size[0]] : def.size;
    return { x: building.gx, y: building.gy, width, height };
  }
  function overlapsBuilding(building, entity, tileSize = C.TILE) {
    if (!entity || entity.dead || !Number.isFinite(entity.x) || !Number.isFinite(entity.y)) return false;
    const cells = footprint(building); if (!cells) return false;
    const left = cells.x * tileSize, top = cells.y * tileSize, right = left + cells.width * tileSize, bottom = top + cells.height * tileSize;
    const metrics=global.DeadwallMetric174,body=metrics?.ownerBody175?.(entity);
    if(body)return metrics.bodyOverlap(body,{x:(left+right)/2,y:(top+bottom)/2,w:right-left,h:bottom-top,a:0});
    const dx = entity.x - Math.max(left, Math.min(right, entity.x));
    const dy = entity.y - Math.max(top, Math.min(bottom, entity.y));
    const radius = Number.isFinite(entity.radius) ? Math.max(0, entity.radius) : 0;
    return dx * dx + dy * dy <= radius * radius;
  }
  function isGateOccupied(building, entities) { return isGate(building) && entities.some(entity => overlapsBuilding(building, entity)); }
  function gateChangeAllowed(building, mode, entities = []) {
    if (!GATE_MODES.includes(mode) || !isGate(building) || !operational(building)) return false;
    const previous = gateMode(building); if (previous === mode) return true;
    // Closing an open passage cannot materialize a barrier around an actor.
    const closing = mode === 'closed' || (mode === 'auto' && previous === 'open');
    return !closing || !isGateOccupied(building, entities);
  }

  // Grille d'arêtes du terrain de génération 12 (O7) : une arête de falaise ou l'eau profonde arrête l'inondation comme
  // un mur indestructible ; une rampe se barre comme une porte (mur posé sur ses cases). `null` sur une carte plate.
  // `step(x, y, nx, ny)` : l'arête du monde (`canStep`) ; `seed(i)` : case du bord d'où une horde peut partir (à sec).
  function terrainGrid217(world) {
    const t = world?.terrain217; if (!t || typeof world.canStep !== 'function') return null;
    return Object.freeze({ tiles: t.tiles, step: (x, y, nx, ny) => world.canStep(x, y, nx, ny), seed: index => !t.deep[index] });
  }
  function analyzeEnclosure({ buildings, target = null, grid = null, width = grid ? grid.tiles : C.LOCAL_MAP217.tiles, height = grid ? grid.tiles : C.LOCAL_MAP217.tiles }) {
    const limit = grid ? Math.max(C.LOCAL_MAP217.tiles, grid.tiles) : C.LOCAL_MAP217.tiles;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > limit || height > limit) throw new RangeError('Grille tactique invalide.');
    const structures = Array.from(buildings), size = width * height, barrier = new Uint8Array(size), exterior = new Uint8Array(size), queue = new Int32Array(size);
    let gates = 0, openGates = 0, wallCount = 0, barrierCells = 0;
    for (const building of structures) {
      const def = definition(building); if (!operational(building) || !def?.wall) continue;
      wallCount++;
      if (def.gate) { gates++; if (gateMode(building) === 'open') openGates++; }
      if (!blocksEnclosure(building)) continue;
      const cells = footprint(building);
      for (let y = Math.max(0, cells.y); y < Math.min(height, cells.y + cells.height); y++) {
        for (let x = Math.max(0, cells.x); x < Math.min(width, cells.x + cells.width); x++) {
          const index = y * width + x; if (!barrier[index]) { barrier[index] = 1; barrierCells++; }
        }
      }
    }
    let head = 0, tail = 0;
    const visit = index => { if (!barrier[index] && !exterior[index]) { exterior[index] = 1; queue[tail++] = index; } };
    if (grid) {
      // Terrain : la horde part des cases à sec du bord et ne passe que les arêtes franchissables.
      const start = index => { if (grid.seed(index)) visit(index); }, edge = (cell, x, y, nx, ny) => { if (grid.step(x, y, nx, ny)) visit(ny * width + nx); };
      for (let x = 0; x < width; x++) { start(x); start((height - 1) * width + x); }
      for (let y = 1; y < height - 1; y++) { start(y * width); start(y * width + width - 1); }
      while (head < tail) {
        const cell = queue[head++], x = cell % width, y = Math.floor(cell / width);
        if (x > 0) edge(cell, x, y, x - 1, y); if (x + 1 < width) edge(cell, x, y, x + 1, y);
        if (y > 0) edge(cell, x, y, x, y - 1); if (y + 1 < height) edge(cell, x, y, x, y + 1);
      }
    } else {
    for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
    for (let y = 1; y < height - 1; y++) { visit(y * width); visit(y * width + width - 1); }
    while (head < tail) {
      const cell = queue[head++], x = cell % width, y = Math.floor(cell / width);
      if (x > 0) visit(cell - 1); if (x + 1 < width) visit(cell + 1);
      if (y > 0) visit(cell - width); if (y + 1 < height) visit(cell + width);
    }
    }
    const core = target || structures.find(building => building.type === 'core' && operational(building));
    const cells = core && operational(core) ? footprint(core) : null;
    const hasCore = Boolean(cells && cells.x >= 0 && cells.y >= 0 && cells.x + cells.width <= width && cells.y + cells.height <= height);
    let coreReachable = !hasCore;
    if (hasCore) for (let y = cells.y; y < cells.y + cells.height; y++) for (let x = cells.x; x < cells.x + cells.width; x++) if (exterior[y * width + x]) coreReachable = true;
    return Object.freeze({ enclosed: hasCore && !coreReachable, hasCore, coreReachable, openGates, gates, wallCount, barrierCells, exteriorCells: tail, interiorCells: size - barrierCells - tail });
  }

  const api = { GATE_MODES, gateMode, operational, isGate, openGate, blocksFriendly, blocksEnclosure, footprint, overlapsBuilding, isGateOccupied, gateChangeAllowed, analyzeEnclosure, terrainGrid217 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DeadwallTactics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
