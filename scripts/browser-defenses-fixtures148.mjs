/** Explicit integration fixtures. These functions run inside the real game page
 * and in the Node document harness; transactions are never manufactured here. */
export function defenseCampFixture() {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (!g.paused || g.state !== 'playing') throw Error('Defense fixture requires a living, paused campaign');
  const rng = g.random.state, raw = g.serialize(), added = [], Building = g.core().constructor;
  for (const type of ['planningOffice', 'warehouse', 'workshop', 'spikes']) {
    let found;
    for (let ring = 6; ring < 32 && !found; ring += 2) {
      for (let dy = -ring; dy <= ring && !found; dy += 2) for (let dx = -ring; dx <= ring && !found; dx += 2) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const gx = g.core().gx + dx, gy = g.core().gy + dy;
        if (!g.world.placement(C.BUILDINGS[type], gx, gy, 0).valid) continue;
        const b = new Building(g.nextId, type, gx, gy, 0, 1); g.world.add(b);
        const point = g.fieldcraft.service(g.player, b);
        if (point && g.friendlyPositionClear(g.player, point.x, point.y)) found = b;
        else g.world.remove(b);
      }
    }
    if (!found) throw Error('No legal, physically accessible fixture ' + type);
    g.nextId++; added.push({ id: found.id, type, gx: found.gx, gy: found.gy });
  }
  const current = g.serialize();
  current.urban.peakScore = Math.max(current.urban.peakScore, C.Urban.score(current.buildings));
  // Prepared inherited knowledge keeps this historical content scene outside campaign 1.51 qualification.
  delete current.urban.progression151;
  current.phase = 'calm'; current.phaseTime = 120; current.units = [];
  current.resources = { ...raw.resources, wood: 900, scrap: 900, stone: 300, ammo: 100, fuel: 40 };
  g.restoreSave(globalThis.DeadwallSave.validate(current)); g.togglePause(true);
  if (g.random.state !== rng || g.tier.id < 2) throw Error('Fixture changed RNG or failed its imported inherited tier');
  globalThis.__DEFENSE148_CAMP__ = Object.fromEntries(added.map(b => [b.type, b.id]));
  return { type: 'prepared-physical-defense-camp-with-inherited-knowledge', added, achievedTier: g.tier.id, resources: { ...g.resources }, rngPreserved: true,
    assignedFields: ['buildings[4 completed legal supports]', 'nextId', 'urban.peakScore[actual built score]', 'urban.progression151[omitted to import inherited knowledge]', 'phase', 'phaseTime', 'units', 'resources.wood', 'resources.scrap', 'resources.stone', 'resources.ammo', 'resources.fuel'],
    note: 'Explicit completed infrastructure, inherited age knowledge and finite common material, not a naturally developed 1.51 colony. Background workers are excluded. No crafted item, fitting, mechanism, enemy, player health, RNG, terrain/node or save identity is assigned.' };
}

export function defenseServiceFixture({ type, bag = null }) {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (!g.paused) throw Error('Service fixture requires real pause');
  const b = type === 'core' ? g.core() : g.world.buildings.get(globalThis.__DEFENSE148_CAMP__?.[type]);
  if (!b || !b.completed || b.dead) throw Error('Missing completed service support: ' + type);
  const point = g.fieldcraft.service(g.player, b);
  if (!point || !g.friendlyPositionClear(g.player, point.x, point.y)) throw Error('No real free service point: ' + type);
  const raw = g.serialize(), rng = raw.randomState;
  raw.phase = 'calm'; raw.phaseTime = 120; raw.zombies = []; raw.spawnQueue = []; raw.pendingSpawns = C.normalizeSpawnCounts();
  raw.dayworks.night = null; raw.citadel.baseline = null;
  raw.player.x = point.x; raw.player.y = point.y;
  if (bag) raw.player.carry = { ...Object.fromEntries(C.RESOURCE_KEYS.map(k => [k, 0])), ...bag };
  g.restoreSave(globalThis.DeadwallSave.validate(raw)); g.togglePause(true); g.selectBuilding(g.world.buildings.get(b.id));
  const restored = g.world.buildings.get(b.id);
  if (g.random.state !== rng || !g.workerCanWorkAt(g.player, restored, C.Arsenal134Rules.homeReach)) throw Error('Invalid restored physical service access');
  return { type: 'prepared-service-point', support: b.id, supportType: type, player: { x: g.player.x, y: g.player.y }, bag: bag && { ...g.player.carry }, rngPreserved: true,
    assignedFields: ['phase', 'phaseTime', 'zombies[previous synthetic contacts only]', 'spawnQueue', 'pendingSpawns', 'dayworks.night', 'citadel.baseline', 'player.x', 'player.y', ...(bag ? ['player.carry'] : [])],
    note: 'Player relocation to a genuinely reachable exterior access is explicitly prepared. Paid possessions, fitting charges, common materials and RNG are preserved. Subsequent actions and work use actual DOM input and ordinary RAF.' };
}

export function defensePlanSiteFixture(id) {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (!g.paused) throw Error('Plan site fixture requires pause');
  let site;
  for (let gy = 10; gy < 108 && !site; gy += 2) for (let gx = 10; gx < 108 && !site; gx += 2) {
    const quote = g.dayworks.planStatus(id, gx, gy);
    if (!quote.ok) continue;
    // Outside the future footprint, with the anchor above the player: this
    // keeps the real click inside the short landscape terrain instead of its footer.
    for (const [dx, dy] of [[-40, 40], [-40, 56], [16, -40]]) {
      const x = gx * C.TILE + dx, y = gy * C.TILE + dy;
      if (g.friendlyPositionClear(g.player, x, y)) { site = { gx, gy, x, y, cost: quote.cost, items: quote.items }; break; }
    }
  }
  if (!site) throw Error('No legal, fully affordable plan site for ' + id);
  g.player.x = site.x; g.player.y = site.y;
  // Match the engine's ordinary camera edge clamp before deriving an input point.
  // Otherwise its first RAF changes the camera while the real pointer is in flight.
  const halfW = g.width / g.camera.zoom / 2, halfH = g.height / g.camera.zoom / 2;
  g.camera.x = Math.max(halfW, Math.min(C.WORLD_SIZE - halfW, site.x));
  g.camera.y = Math.max(halfH, Math.min(C.WORLD_SIZE - halfH, site.y));
  return { type: 'prepared-plan-viewpoint', id, site,
    assignedFields: ['player.x', 'player.y', 'camera.x[transient]', 'camera.y[transient]'],
    note: 'Only a free physical player point and its camera are prepared; preview and finance require real canvas/menu clicks. Site footprint and total cost come from actual dayworks.planStatus.' };
}

export function defenseContactFixture({ kind, trap = false, count = 1, hidden = false }) {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (!g.paused || !Object.hasOwn(C.ENEMIES, kind) || !Number.isInteger(count) || count < 1 || count > 22) throw Error('Paused real enemy fixture with finite count1–22 required');
  const raw = g.serialize(), rng = raw.randomState, def = C.ENEMIES[kind];
  const support = trap ? g.world.buildings.get(globalThis.__DEFENSE148_CAMP__.spikes) : null;
  const playerContact = kind === 'shielded' && !hidden && !trap;
  if (playerContact && (count !== 1 || g.player.dead || !(g.player.health > 0) || g.player.regionAbsent || g.frontier.active() || g.units.some(u => !u.dead && u.health > 0))) {
    throw Error('Frontal shield scene requires one contact and a living local player without competing units');
  }
  let point;
  const candidates = [];
  if (support) {
    const reach = def.radius + C.FortificationPackRules.mechanismContactReach - 1;
    candidates.push([support.right + reach, support.y], [support.left - reach, support.y], [support.x, support.bottom + reach], [support.x, support.top - reach]);
  } else if (playerContact) {
    // The actual victim branch (<34) owns the enemy's facing during reload.
    // Each candidate keeps the bodies separate; no later AI/facing override.
    const distance = 30, angle = Math.atan2(g.player.y - g.core().y, g.player.x - g.core().x);
    for (let i = 0; i < 8; i++) candidates.push([g.player.x + Math.cos(angle + i * Math.PI / 4) * distance, g.player.y + Math.sin(angle + i * Math.PI / 4) * distance]);
  } else {
    const distance = hidden ? 1100 : 150;
    const angle = Math.atan2(g.player.y - g.core().y, g.player.x - g.core().x);
    candidates.push([g.player.x + Math.cos(angle) * distance, g.player.y + Math.sin(angle) * distance]);
    for (let offset = 0; offset < 256; offset += 32) for (const [dx, dy] of [[distance, offset], [-distance, offset], [offset, distance], [offset, -distance]]) candidates.push([g.player.x + dx, g.player.y + dy]);
  }
  for (const [x, y] of candidates) {
    const contact = { x, y, health: def.health, radius: def.radius };
    if (playerContact) {
      const distance = Math.hypot(x - g.player.x, y - g.player.y);
      if (distance <= g.player.radius + def.radius || distance >= 34) continue;
    }
    if (!g.hostilePositionClear(contact, x, y)) continue;
    if (!hidden && !support && !g.hostileLineClear(g.player, contact)) continue;
    if (kind === 'charger' && !hidden && !support) {
      const angle = Math.atan2(g.core().y - y, g.core().x - x);
      if (!g.zombieChargeClear(contact, { x: Math.cos(angle), y: Math.sin(angle) }, C.ENEMIES.charger.speed * C.ENEMY_RULES.charge.rushSpeed * C.ENEMY_RULES.charge.rushSeconds + 12)) continue;
    }
    if (support && !g.hostileLineClear(contact, { x: Math.max(support.left, Math.min(support.right, x)), y: Math.max(support.top, Math.min(support.bottom, y)) }, false, support)) continue;
    if (!support && g.visibility.frame().canSeeLocal(contact) === hidden) continue;
    point = { x, y }; break;
  }
  if (!point) throw Error('No physically valid ' + (hidden ? 'hidden' : 'visible') + ' contact geometry: ' + kind);
  raw.wave = Math.max(11, def.unlockWave); raw.phase = 'assault'; raw.phaseTime = 0;
  raw.fronts = ['north', 'east', 'south', 'west'];
  raw.wavePlan = { ...C.wavePlan(raw.wave, g.difficulty, g.signature), total: 24, fronts: 4,
    composition: Object.fromEntries(Object.keys(C.ENEMIES).map(k => [k, k === 'walker' ? kind === 'walker' ? 24 : 24 - count : k === kind ? count : 0])) };
  raw.zombies = Array.from({ length: count }, (_, i) => ({ id: raw.nextId++, kind, ...point, health: def.health, attackCooldown: 0,
    ...(kind === 'shielded' || kind === 'charger' ? { facing: Math.atan2(g.player.y - point.y, g.player.x - point.x), stagger: 0, rage: 0 } : {}),
    ...(kind === 'charger' ? { charge: { stage: trap ? 'rush' : 'ready', timer: trap ? C.ENEMY_RULES.charge.rushSeconds : 0,
      angle: Math.atan2((support?.y ?? g.player.y) - point.y, (support?.x ?? g.player.x) - point.x) } } : {}) }));
  raw.spawnQueue = ['walker', 'walker']; raw.pendingSpawns = C.normalizeSpawnCounts({ walker: 24 - count - 2 }); raw.spawnTimer = 90;
  raw.dayworks.night = null; raw.citadel.baseline = null;
  g.restoreSave(globalThis.DeadwallSave.validate(raw)); g.togglePause(true); g.rebuildBuckets(); g.updateUI();
  if (g.random.state !== rng) throw Error('Contact fixture consumed RNG');
  return { type: 'prepared-physical-contacts', kind, count, point, support: support?.id, hidden, initialCharge: raw.zombies[0]?.charge || null, ids: raw.zombies.map(z => z.id), observed: g.zombies.filter(z => g.visibility.frame().canSeeLocal(z)).length,
    ...(playerContact ? { playerContact: { distance: Math.hypot(point.x - g.player.x, point.y - g.player.y), bodySeparation: Math.hypot(point.x - g.player.x, point.y - g.player.y) - g.player.radius - def.radius, competingUnits: 0 } } : {}),
    assignedFields: ['wave', 'phase', 'phaseTime', 'fronts', 'wavePlan', 'zombies', 'nextId', 'spawnQueue', 'pendingSpawns', 'spawnTimer', 'dayworks.night', 'citadel.baseline'],
    note: 'Explicit finite24-contact assault, valid ordinary enemy health/rules, physical positions and 90s arrival timer; null night uses supported legacy continuous mode. A visible shield outside a trap is a single nonoverlapping contact30 units from the living local player, with no competing unit; ordinary victim AI must maintain its actual frontal orientation. Charger at a trap starts in a declared .7s rush directed at the actual support, to test interruption; its separate free-field scene starts ready. No simulated late-wave progression, AI/vision/RNG override, resource, fitted trap, weapon or player-health assignment.' };
}

export function defenseHeldContactDepartureFixture() {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore;
  if (!g.paused) throw Error('Held-contact departure requires real pause');
  const before = g.fortificationPack.snapshot(), fitting = before.fittings.find(f => f.id === globalThis.__DEFENSE148_CAMP__.spikes), support = g.world.buildings.get(fitting?.id);
  if (!support || !fitting.mechanism) throw Error('Existing paid physical mount required');
  const rng = g.random.state, moves = [];
  for (const caught of fitting.mechanism.caught) {
    const z = g.zombies.find(z => z.id === caught.id); if (!z || z.dead) throw Error('Held live contact identity required');
    let point;
    for (const distance of [400, 480, 560]) for (const [dx, dy] of [[distance, 0], [-distance, 0], [0, distance], [0, -distance]]) {
      const x = support.x + dx, y = support.y + dy;
      if (!point && g.hostilePositionClear(z, x, y)) point = { x, y };
    }
    if (!point) throw Error('No physical departure point outside mount reach');
    moves.push({ id: z.id, from: { x: z.x, y: z.y }, to: point, health: z.health, holdRemaining: caught.left });
    z.x = point.x; z.y = point.y;
  }
  g.rebuildBuckets();
  if (g.random.state !== rng || JSON.stringify(g.fortificationPack.snapshot()) !== JSON.stringify(before)) throw Error('Departure changed the paid mount or RNG');
  return { type: 'prepared-held-contact-departure', moves, assignedFields: moves.map(z => 'zombies[' + z.id + '].x/y'),
    note: 'Only the existing synthetic held contact position is relocated to genuinely free ground at least400 game units away. Health, saved hold, recovery timer, identity, mount/charge count, material and RNG stay intact. Ordinary RAF must expire the real hold before the scene may retire its contact.' };
}
