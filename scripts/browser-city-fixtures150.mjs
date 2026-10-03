/** Explicit advanced integration fixture, never presented as human progression.
 * Every injected structure has a legal physical footprint and ordinary completed
 * building data. The physical score derives from those structures; age knowledge is
 * explicitly imported through the legacy save path, without campaign gates. Paid foundations, terrain, nodes, RNG, identity and player health
 * are retained. These prepared structures have not been organically financed.
 */
export function prepareAge150(targetAge) {
  const g = DEADWALL, C = DeadwallCore;
  if (!g.paused || g.state !== 'playing' || !Number.isInteger(targetAge) || targetAge < 2 || targetAge > 10) throw Error('Paused advanced age 2–10 required');
  const before = g.serialize(), rng = g.random.state, added = [], Building = g.core().constructor;
  const threshold = C.CITY_TIERS[targetAge].requiredScore;
  const score = () => C.Urban.score(g.world.buildings.values());
  function put(type) {
    const def = C.BUILDINGS[type]; let found;
    // A ring scan keeps the prepared city near D-17 while preserving occupied
    // and inaccessible geographical cells and the actual entity identities.
    for (let ring = 8; ring < 110 && !found; ring += 2) {
      for (let dy = -ring; dy <= ring && !found; dy += 2) for (let dx = -ring; dx <= ring && !found; dx += 2) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const gx = g.core().gx + dx, gy = g.core().gy + dy;
        if (!g.world.placement(def, gx, gy, 0).valid) continue;
        const b = new Building(g.nextId, type, gx, gy, 0, 1);
        if ([g.player, ...g.units].some(a => a.x + a.radius > b.left && a.x - a.radius < b.right && a.y + a.radius > b.top && a.y - a.radius < b.bottom)) continue;
        if (type === 'spikes' && !g.fieldcraft.service(g.player, b)) continue;
    g.world.add(b); found = b;
      }
    }
    if (!found) throw Error('No legal fixture site for ' + type);
    g.nextId++; added.push({ id: found.id, type, gx: found.gx, gy: found.gy, score: def.score }); return found;
  }
  // At each stage expose at least one actual model of every previously known
  // urban role. Dependencies are physical structures, not a registry grant.
  function requireBuilt(type) {
    if (g.world.has(type)) return;
    const def = C.BUILDINGS[type];
    if (def.requires) requireBuilt(def.requires);
    put(type);
  }
  function requiredScore(type, seen = new Set()) {
    if (g.world.has(type) || seen.has(type)) return 0;
    seen.add(type); const def = C.BUILDINGS[type];
    return def.score + (def.requires ? requiredScore(def.requires, seen) : 0);
  }
  for (const d of Object.values(C.Urban.BUILDINGS).filter(d => d.unlockTier <= targetAge)) {
    if (score() + requiredScore(d.id) <= threshold && !g.world.has(d.id)) requireBuilt(d.id);
  }
  while (score() < threshold) {
    const remaining = threshold - score();
    const choices = Object.values(C.BUILDINGS).filter(d => d.id !== 'core' && !C.CityContent150?.BUILDINGS[d.id] && !d.wall && d.unlockTier < targetAge && (d.score || 0) <= remaining + 1e-7 && (!d.requires || g.world.has(d.requires)));
    choices.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    if (!choices.length || added.length > 250) throw Error('Cannot prepare exact score ' + threshold + ': ' + score());
    put(choices[0].id);
  }
  const raw = g.serialize();
  raw.urban.peakScore = Math.max(before.urban.peakScore, score());
  // Explicit inherited knowledge fixture; these prepared scenes do not meet campaign 1.51 gates.
  delete raw.urban.progression151;
  raw.phase = 'calm'; raw.phaseTime = 300; raw.zombies = []; raw.spawnQueue = []; raw.pendingSpawns = C.normalizeSpawnCounts();
  raw.dayworks.night = null; raw.citadel.baseline = null;
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true); g.updateUI();
  if (g.random.state !== rng || g.tier.id !== targetAge || g.cityScore !== threshold) throw Error('Fixture failed derived exact age or preserved RNG');
  return { kind: 'explicit-physical-city-with-inherited-age-knowledge', targetAge, threshold, currentScore: g.cityScore, added, rngPreserved: true,
    assignedFields: ['buildings[legal completed structures including declared target-age models]', 'nextId', 'urban.peakScore[actual completed score]', 'urban.progression151[omitted to import inherited knowledge]', 'phase', 'phaseTime', 'zombies[earlier synthetic scene only]', 'spawnQueue', 'pendingSpawns', 'dayworks.night', 'citadel.baseline'],
    limitation: 'Prepared completed infrastructure and imported inherited age knowledge; not an organically financed 1.51 campaign, balance trial or elapsed human progression. Stocks, population and crafting possessions are not granted.' };
}

/** Advanced scene material and completed supports, not an organically built city. */
export function prepareSupports150({ allModels = false } = {}) {
  const g = DEADWALL, C = DeadwallCore;
  if (!g.paused || g.tier.id !== 10) throw Error('Paused final-age integration scene required');
  const before = g.serialize(), rng = g.random.state, added = [], Building = g.core().constructor;
  function put(type) {
    if (g.world.has(type)) { const existing = [...g.world.buildings.values()].find(b => b.type === type && b.completed && !b.dead && (type !== 'spikes' || g.fieldcraft.service(g.player, b))); if (existing) return existing; }
    const def = C.BUILDINGS[type]; if (!def) throw Error('Unknown legal support ' + type);
    if (def.requires) put(def.requires);
    let found;
    for (let ring = 8; ring < 110 && !found; ring += 2) for (let dy = -ring; dy <= ring && !found; dy += 2) for (let dx = -ring; dx <= ring && !found; dx += 2) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
      const gx = g.core().gx + dx, gy = g.core().gy + dy;
      if (!g.world.placement(def, gx, gy, 0).valid) continue;
      const b = new Building(g.nextId, type, gx, gy, 0, 1);
      if ([g.player, ...g.units].some(a => a.x + a.radius > b.left && a.x - a.radius < b.right && a.y + a.radius > b.top && a.y - a.radius < b.bottom)) continue;
      if (type === 'spikes' && !g.fieldcraft.service(g.player, b)) continue;
    g.world.add(b); found = b;
    }
    if (!found) throw Error('No legal support for ' + type);
    g.nextId++; added.push({ id: found.id, type, gx: found.gx, gy: found.gy }); return found;
  }
  for (const type of ['barracks', 'clinic', 'farm', 'ammoFactory', 'planningOffice', 'roadDepot', 'workshop', 'spikes', 'megaReserve', 'megaPower']) put(type);
  if (allModels) for (const type of Object.keys(C.CityContent150.BUILDINGS)) put(type);
  const raw = g.serialize(); raw.urban.peakScore = Math.max(before.urban.peakScore, C.Urban.score(g.world.buildings.values())); raw.phase = 'calm'; raw.phaseTime = 300;
  raw.dayworks.night = null; raw.citadel.baseline = null;
  if (!allModels) raw.resources = { wood: 2000, scrap: 4000, stone: 3500, food: 500, fuel: 300, ammo: 500, medicine: 200 };
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true); g.updateUI();
  if (g.random.state !== rng || Object.values(g.resources).some(n => n > g.storage)) throw Error('Invalid finite stock or RNG in support scene');
  globalThis.__CITY150_SUPPORTS__ = Object.fromEntries([...g.world.buildings.values()].filter(b => b.completed && !b.dead).map(b => [b.type, b.id]));
  return { kind: 'explicit-completed-supports-and-finite-scene-stock', allModels, added, stock: { ...g.resources }, storage: g.storage, actualScore: g.cityScore,
    assignedFields: ['buildings[legal completed support infrastructure]', 'nextId', 'urban.peakScore[derived completed score]', 'phase', 'phaseTime', 'dayworks.night', 'citadel.baseline', ...(!allModels ? ['resources[finite scene stock]'] : [])],
    rngPreserved: true, limitation: 'Completed supports and finite common material are explicitly prepared. No new model under transaction, fitting, trained exercise or finished road is granted by the first support scene. The final art-only scene declares completed remaining models and does not claim they were naturally financed.' };
}

export function prepareService150({ type = 'core', bag = null, point: requestedPoint = null } = {}) {
  const g = DEADWALL, C = DeadwallCore;
  if (!g.paused) throw Error('Paused physical service scene required');
  const b = type === 'core' ? g.core() : [...g.world.buildings.values()].find(b => b.type === type && b.completed && !b.dead && g.fieldcraft.service(g.player, b));
  const point = requestedPoint || b && g.fieldcraft.service(g.player, b);
  if (!point || !g.friendlyPositionClear(g.player, point.x, point.y)) throw Error('No legal exterior service point for ' + type);
  const raw = g.serialize(), rng = raw.randomState;
  raw.player.x = point.x; raw.player.y = point.y; raw.phase = 'calm'; raw.phaseTime = 300;
  if (bag) raw.player.carry = { ...Object.fromEntries(C.RESOURCE_KEYS.map(k => [k, 0])), ...bag };
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true); g.selectBuilding(g.world.buildings.get(b.id));
  if (requestedPoint && !g.workerCanWorkAt(g.player, g.world.buildings.get(b.id), 100)) throw Error('Prepared protected point cannot physically work at ' + type);
  if (g.random.state !== rng) throw Error('Physical service scene changed RNG');
  return { kind: 'explicit-free-physical-service-point', support: b.id, type, point, bag: bag && { ...g.player.carry }, rngPreserved: true,
    assignedFields: ['player.x', 'player.y', 'phase', 'phaseTime', ...(bag ? ['player.carry[finite recipe]'] : [])],
    limitation: 'Only a reachable physical position and optional finite supplied bag are prepared. All subsequent paid work uses real controls and ordinary RAF.' };
}

export function prepareRoad150() {
  const g = DEADWALL, C = DeadwallCore;
  if (!g.paused) throw Error('Paused road geometry scene required');
  let point;
  for (let ring = 6; ring < 40 && !point; ring += 2) for (let dy = -ring; dy <= ring && !point; dy++) for (let dx = -ring; dx <= ring && !point; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
    const p = { x: g.core().gx + dx, y: g.core().gy + dy }, x = p.x * C.TILE + C.TILE / 2, y = p.y * C.TILE + C.TILE / 2;
    if (Math.hypot(x - g.core().x, y - g.core().y) < 140 || !g.friendlyPositionClear(g.player, x, y)) continue;
    const blocked = g.world.atCell(p.x, p.y) || g.world.nodes.some(n => !n.depleted && n.amount > 0 && n.x + n.radius > p.x * C.TILE && n.x - n.radius < (p.x + 1) * C.TILE && n.y + n.radius > p.y * C.TILE && n.y - n.radius < (p.y + 1) * C.TILE);
    if (blocked || g.infrastructure.snapshot().roads.some(r => r.x === p.x && r.y === p.y)) continue;
    point = { ...p, player: { x, y } };
  }
  if (!point) throw Error('No free single physical road cell');
  const raw = g.serialize(), rng = raw.randomState; raw.player.x = point.player.x; raw.player.y = point.player.y;
  raw.phase = 'calm'; raw.phaseTime = 300;
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true);
  if (g.random.state !== rng) throw Error('Road viewpoint changed RNG');
  return { kind: 'explicit-free-road-work-point', point, rngPreserved: true, assignedFields: ['player.x', 'player.y', 'phase', 'phaseTime'],
    limitation: 'Only the physically clear exterior player position is supplied. No road, road progress, stock, paid quote or RNG change is prepared.' };
}

/** A legal empty construction site and exterior actor position; no foundation. */
export function prepareConstruction150(request) {
  const { type, protectCore = false } = typeof request === 'string' ? { type: request } : request;
  const g = DEADWALL, C = DeadwallCore, def = C.CityContent150.BUILDINGS[type];
  if (!g.paused || !def) throw Error('Paused new-model construction viewpoint required');
  const protectedPoint = protectCore ? g.fieldcraft.service(g.player, g.core()) : null;
  if (protectCore && (!protectedPoint || !g.friendlyPositionClear(g.player, protectedPoint.x, protectedPoint.y) || !def.range)) throw Error('No physical core work point to defend');
  const Building = g.core().constructor; let point, site;
  for (let ring = 6; ring < 110 && !point; ring += 2) for (let dy = -ring; dy <= ring && !point; dy += 2) for (let dx = -ring; dx <= ring && !point; dx += 2) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
    const gx = g.core().gx + dx, gy = g.core().gy + dy;
    if (!g.world.placement(def, gx, gy, 0).valid) continue;
    const candidate = new Building(g.nextId, type, gx, gy, 0, 0);
    if ([g.player, ...g.units].some(a => a.x + a.radius > candidate.left && a.x - a.radius < candidate.right && a.y + a.radius > candidate.top && a.y - a.radius < candidate.bottom)) continue;
    // A paid autonomous defence protects the actual later training position.
    // Keep a margin for an attacker at melee distance; retain all wild hordes,
    // their schedule, ordinary ammunition and the player's current health.
    if (protectedPoint && (Math.hypot(candidate.x - protectedPoint.x, candidate.y - protectedPoint.y) > def.range - 80 || !g.hostileLineClear(candidate, protectedPoint))) continue;
    if (protectedPoint && protectedPoint.x + g.player.radius > candidate.left && protectedPoint.x - g.player.radius < candidate.right && protectedPoint.y + g.player.radius > candidate.top && protectedPoint.y - g.player.radius < candidate.bottom) continue;
    const service = g.fieldcraft.service(g.player, candidate);
    if (!service || !g.friendlyPositionClear(g.player, service.x, service.y)) continue;
    point = service; site = { gx, gy, type };
  }
  if (!point) throw Error('No legal empty physical site for ' + type);
  const raw = g.serialize(), rng = raw.randomState, buildings = raw.buildings.length;
  raw.player.x = point.x; raw.player.y = point.y; raw.phase = 'calm'; raw.phaseTime = 300;
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true);
  if (g.random.state !== rng || g.world.buildings.size !== buildings) throw Error('Construction viewpoint changed RNG or buildings');
  return { kind: 'explicit-empty-construction-site-viewpoint', point, site, protectedPoint, rngPreserved: true,
    assignedFields: ['player.x', 'player.y', 'phase', 'phaseTime'],
    limitation: 'The advanced actor starts at a free exterior position beside an empty legally buildable footprint. An optional defended core point is derived from real range and line of sight. No foundation, stock, progress, terrain clearance, wild-horde schedule or RNG is granted. Payment, placement and work use ordinary real controls.' };
}

export function prepareCompanion150() {
  const g = DEADWALL;
  if (!g.paused || g.tier.id < 4 || g.population < DeadwallCore.WorldEvolution.RULES.companionRules.minimumPopulation) throw Error('Paid-assignment-eligible living camp required');
  const rng = g.random.state, before = { ...g.resources }, assigned = g.worldEvolution.assignCompanion('samir');
  if (!assigned && !g.worldEvolution.overview().companions.some(c => c.id === 'samir')) throw Error('Actual finite Samir assignment refused');
  const afterAssignment = { ...g.resources }, raw = g.serialize(), state = g.companionsPack.snapshot();
  state.trained = ['samir', 'samir:escort', 'samir:support']; state.training = null;
  raw.expansions127.modules.companions = state;
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true);
  if (g.random.state !== rng) throw Error('Prepared earlier companion skills changed RNG');
  return { kind: 'actual-paid-companion-assignment-and-explicit-earlier-skills', assigned, before, afterAssignment,
    trained: [...state.trained], rngPreserved: true, assignedFields: ['worldEvolution.companions[actual paid assignment]', 'resources.food[actual assignment payment]', 'expansions127.modules.companions.trained[three explicitly prepared earlier skills]'],
    limitation: 'Companion assignment uses the ordinary owner and pays actual food. Earlier specialty/escort/support are explicitly prepared; the new triage exercise is not granted, shortened or timed synthetically.' };
}
