import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel } from './browser-qa-common144.mjs';
import { loadedAssets } from './browser-qa-common142.mjs';

// Collision-sampled routes use read-only engine geometry. All native movement,
// harvesting, deposit, placement and construction below use real held input.
const withHold = holdInput;
/** The route reads the same collisions as gameplay; it never writes player position. */
async function planRoute(page, request) {
  return page.evaluate(request => {
    const game = DEADWALL, actor = game.player;
    const target = request.kind === 'node'
      ? game.world.nodes.filter(node => !node.depleted && node.type === request.type && node.amount >= request.amount)
        .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y))[0]
      : game.world.buildings.get(request.id);
    if (!target) throw Error('No live route target: ' + JSON.stringify(request));
    const range = request.range, desired = Math.min(36, range * .65), spacing = 16;
    const start = { x: actor.x, y: actor.y }, targetBox = target.def && {
      left: target.left - actor.radius - 5, right: target.right + actor.radius + 5,
      top: target.top - actor.radius - 5, bottom: target.bottom + actor.radius + 5
    };
    const goal = point => {
      const probe = { ...actor, ...point };
      if (targetBox && point.x >= targetBox.left && point.x <= targetBox.right && point.y >= targetBox.top && point.y <= targetBox.bottom) return false;
      return game.fieldcraft.distance(point, target) <= desired && game.workerCanWorkAt(probe, target, range);
    };
    for (const margin of [128, 256, 512]) {
      const bounds = { left: Math.min(start.x, target.x) - margin, right: Math.max(start.x, target.x) + margin,
        top: Math.min(start.y, target.y) - margin, bottom: Math.max(start.y, target.y) + margin };
      const key = (x, y) => x + ':' + y, queue = [{ x: 0, y: 0 }], parents = new Map([[key(0, 0), null]]), clear = new Map();
      const pointAt = cell => ({ x: start.x + cell.x * spacing, y: start.y + cell.y * spacing });
      const free = cell => {
        const id = key(cell.x, cell.y);
        if (!clear.has(id)) {
          const point = pointAt(cell);
          clear.set(id, point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom && game.friendlyPositionClear(actor, point.x, point.y));
        }
        return clear.get(id);
      };
      let found;
      for (let head = 0; head < queue.length && head < 12000; head++) {
        const current = queue[head], point = pointAt(current);
        if (goal(point)) { found = current; break; }
        for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0], [0, 1]]) {
          const next = { x: current.x + dx, y: current.y + dy }, id = key(next.x, next.y);
          if (parents.has(id) || !free(next)) continue;
          const nextPoint = pointAt(next);
          if (![.25, .5, .75].every(t => game.friendlyPositionClear(actor, point.x + (nextPoint.x - point.x) * t, point.y + (nextPoint.y - point.y) * t))) continue;
          parents.set(id, current); queue.push(next);
        }
      }
      if (!found) continue;
      const cells = [];
      for (let cell = found; cell; cell = parents.get(key(cell.x, cell.y))) cells.push(cell);
      cells.reverse();
      const segments = [];
      for (let i = 1; i < cells.length; i++) {
        const previous = cells[i - 1], cell = cells[i], direction = cell.x > previous.x ? 'right' : cell.x < previous.x ? 'left' : cell.y > previous.y ? 'down' : 'up';
        if (segments.at(-1)?.direction === direction) segments.at(-1).target = pointAt(cell);
        else segments.push({ direction, target: pointAt(cell) });
      }
      return { target: { id: target.id, x: target.x, y: target.y, type: target.type, amount: target.amount }, segments };
    }
    throw Error('No sampled collision-safe route to ' + target.id);
  }, request);
}

async function navigate(page, context, touch, request) {
  const route = await planRoute(page, request);
  const keys = { up: 'w', down: 's', left: 'a', right: 'd' };
  for (const segment of route.segments) {
    const axis = ['left', 'right'].includes(segment.direction) ? 'x' : 'y';
    const sign = ['left', 'up'].includes(segment.direction) ? -1 : 1;
    await withHold(page, context, touch, keys[segment.direction], '#touchControls [data-dir="' + segment.direction + '"]', () =>
      page.waitForFunction(({ axis, sign, target }) => sign * (DEADWALL.player[axis] - target[axis]) >= -2,
        { axis, sign, target: segment.target }, { timeout: 15000 }));
  }
  await page.waitForFunction(() => DEADWALL.input.keys.size === 0);
  return route;
}

async function readEconomy(page) {
  return page.evaluate(() => ({ elapsed: DEADWALL.elapsed, resources: { ...DEADWALL.resources }, carry: { ...DEADWALL.player.carry },
    gathered: DEADWALL.stats.gathered, deposited: DEADWALL.depositedResources, prologue: DEADWALL.chronicles131.snapshot().prologue,
    player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, workerOrder: DEADWALL.workerOrder }));
}

async function chooseSite(page, type) {
  return page.evaluate(type => {
    const game = DEADWALL, core = game.core(), def = DeadwallCore.BUILDINGS[type], safe = game.hud135.safeFrame(), candidates = [];
    for (let gy = core.gy - 9; gy <= core.gy + core.h + 9; gy++) for (let gx = core.gx - 9; gx <= core.gx + core.w + 9; gx++) {
      if (!game.world.placement(def, gx, gy, 0).valid) continue;
      const left = gx * 32, top = gy * 32, right = (gx + def.size[0]) * 32, bottom = (gy + def.size[1]) * 32;
      if ([game.player, ...game.units].some(actor => actor.x + actor.radius + 5 > left && actor.x - actor.radius - 5 < right && actor.y + actor.radius + 5 > top && actor.y - actor.radius - 5 < bottom)) continue;
      const x = (gx + .5) * 32, y = (gy + .5) * 32;
      const screen = { x: (x - game.camera.x) * game.camera.zoom + game.width / 2, y: (y - game.camera.y) * game.camera.zoom + game.height / 2 };
      if (screen.x < safe.left + 10 || screen.x > safe.right - 10 || screen.y < safe.top + 10 || screen.y > safe.bottom - 10) continue;
      candidates.push({ gx, gy, screen, cost: def.cost, distance: Math.hypot((left + right) / 2 - game.player.x, (top + bottom) / 2 - game.player.y) });
    }
    candidates.sort((a, b) => a.distance - b.distance || a.gy - b.gy || a.gx - b.gx);
    if (!candidates.length) throw Error('No valid visible unoccupied placement for ' + type);
    return candidates[0];
  }, type);
}

async function placeBuilding(page, touch, type, category) {
  if (await page.evaluate(() => DEADWALL.buildCollapsed)) await activate(page, '#toggleBuild', touch);
  await activate(page, '#buildCategories [data-category="' + category + '"]', touch);
  await activate(page, '#buildList [data-build-id="' + type + '"]', touch);
  await page.waitForFunction(type => DEADWALL.selectedBuild === type, type);
  const site = await chooseSite(page, type), before = await readEconomy(page);
  if (touch) await page.touchscreen.tap(site.screen.x, site.screen.y);
  else await page.mouse.click(site.screen.x, site.screen.y);
  await page.waitForFunction(site => [...DEADWALL.world.buildings.values()].some(building => building.type === site.type && building.gx === site.gx && building.gy === site.gy), { ...site, type });
  const building = await page.evaluate(site => {
    const b = [...DEADWALL.world.buildings.values()].find(b => b.type === site.type && b.gx === site.gx && b.gy === site.gy);
    return { id: b.id, type: b.type, gx: b.gx, gy: b.gy, progress: b.progress, completed: b.completed, buildTime: b.def.buildTime };
  }, { ...site, type });
  const after = await readEconomy(page);
  for (const [key, amount] of Object.entries(site.cost)) assert.ok(Math.abs(before.resources[key] - after.resources[key] - amount) < 1e-6, type + ' pays its real ' + key + ' cost');
  assert.equal(building.completed, false, 'Placement creates an unfinished worksite');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !DEADWALL.selectedBuild);
  return { ...building, cost: site.cost, before, after };
}

async function workManually(page, context, touch, id) {
  const route = await navigate(page, context, touch, { kind: 'building', id, range: 78 });
  route.workStarted = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), id);
  await withHold(page, context, touch, 'e', '#touchAction', () => page.waitForFunction(id => DEADWALL.world.buildings.get(id)?.completed, id, { timeout: 20000 }));
  await page.waitForFunction(() => !DEADWALL.input.keys.has('KeyE'));
  route.workCompleted = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), id);
  route.ordinarySimulationWorkSeconds = route.workCompleted.elapsed - route.workStarted.elapsed;
  return route;
}

/** Explicit advanced integration fixture, never presented as human progression.
 * Every injected structure has a legal physical footprint and ordinary completed
 * building data. No synthetic tier is assigned: score and age derive from those
 * structures. Paid foundations, terrain, nodes, RNG, identity and player health
 * are retained. These prepared structures have not been organically financed.
 */
function prepareAge149(targetAge) {
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
    const choices = Object.values(C.BUILDINGS).filter(d => d.id !== 'core' && !d.wall && d.unlockTier < targetAge && (d.score || 0) <= remaining + 1e-7 && (!d.requires || g.world.has(d.requires)));
    choices.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    if (!choices.length || added.length > 250) throw Error('Cannot prepare exact score ' + threshold + ': ' + score());
    put(choices[0].id);
  }
  const raw = g.serialize();
  raw.urban.peakScore = Math.max(before.urban.peakScore, score());
  raw.phase = 'calm'; raw.phaseTime = 120; raw.zombies = []; raw.spawnQueue = []; raw.pendingSpawns = C.normalizeSpawnCounts();
  raw.dayworks.night = null; raw.citadel.baseline = null;
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true); g.updateUI();
  if (g.random.state !== rng || g.tier.id !== targetAge || g.cityScore !== threshold) throw Error('Fixture failed derived exact age or preserved RNG');
  return { kind: 'explicit-physical-city-age', targetAge, threshold, currentScore: g.cityScore, added, rngPreserved: true,
    assignedFields: ['buildings[legal completed structures including declared target-age models]', 'nextId', 'urban.peakScore[actual completed score]', 'phase', 'phaseTime', 'zombies[earlier synthetic scene only]', 'spawnQueue', 'pendingSpawns', 'dayworks.night', 'citadel.baseline'],
    limitation: 'Prepared completed infrastructure, not an organically financed campaign, balance trial or elapsed human progression. Stocks, population and crafting possessions are not granted.' };
}

async function saveContinue149(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  if (!await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseButton', touch);
  await activate(page, '#saveButton', touch);
  const expected = await page.evaluate(() => { const { timestamp, ...data } = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)); return { ok: DEADWALL.lastSaveStatus.ok, data }; });
  assert.ok(expected.ok, 'Actual Save button succeeds');
  await activate(page, '#quitButton', touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page);
  await page.evaluate(() => {
    const g = DEADWALL, old = g.restoreSave.bind(g);
    g.restoreSave = (...args) => { const result = old(...args); const { timestamp, ...data } = DeadwallSave.validate(g.serialize()); globalThis.__D17_149_RESTORED__ = data; g.togglePause(true); return result; };
  });
  await activate(page, '#continueButton', touch); await page.waitForFunction(() => DEADWALL.state === 'playing' && DEADWALL.paused);
  return page.evaluate(expected => {
    const actual = globalThis.__D17_149_RESTORED__, keys = new Set([...Object.keys(expected), ...Object.keys(actual || {})]);
    const changedKeys = [...keys].filter(k => JSON.stringify(expected[k]) !== JSON.stringify(actual?.[k]));
    return { pass: changedKeys.length === 0, changedKeys, normalizedFields: [], age: DEADWALL.tier.id, score: DEADWALL.cityScore,
      expectedRNG: expected.randomState, restoredRNG: actual?.randomState, buildings: actual?.buildings.length, urban: actual?.urban };
  }, expected.data);
}

async function growth149(page, touch, check, rec, age, label) {
  if (!await page.locator('#commandModal').isVisible()) await openCommand(page, touch, 'field');
  else await activate(page, '#commandTab-field', touch);
  const before = await page.evaluate(() => { const { timestamp, ...data } = DEADWALL.serialize(); return JSON.stringify(data); });
  await activate(page, '#coordinationTab', touch); await page.locator('#urbanRemaining').scrollIntoViewIfNeeded();
  const geometry = await visibleInPanel(page, '#urbanRemaining', '.command-body');
  check(label + ': actual growth readout remains visible inside its scrolling panel', geometry.pass);
  const result = await page.evaluate(() => {
    const g = DEADWALL, model = g.urban.planning(), { timestamp, ...data } = g.serialize();
    return { model, remainingText: document.getElementById('urbanRemaining').textContent,
      renderedCurrent: [...document.querySelectorAll('#urbanCurrentModels [data-model]')].map(n => n.dataset.model),
      renderedNext: [...document.querySelectorAll('#urbanNextModels [data-model]')].map(n => n.dataset.model),
      reached: [...document.querySelectorAll('.urban-age[data-reached="true"]')].map(n => +n.dataset.age), saved: JSON.stringify(data) };
  });
  check(label + ': consultation preserves all saved fields and RNG', result.saved === before); delete result.saved;
  check(label + ': reached age is backed by completed structure score and remembered peak', result.model.age.id === age && result.reached.length === age + 1);
  check(label + ': current and next catalogues list exactly their declared models', JSON.stringify(result.renderedCurrent) === JSON.stringify(result.model.currentModels.map(d => d.id)) && JSON.stringify(result.renderedNext) === JSON.stringify(result.model.nextModels.map(d => d.id)));
  if (age < 10) check(label + ': remaining points and next threshold agree with completed score', result.model.remaining === Math.max(0, result.model.next.requiredScore - result.model.currentScore) && result.remainingText.includes(result.model.remaining.toFixed(1)));
  else check(label + ': last age has no invented twelfth threshold and keeps construction active', result.model.next === null && result.model.nextModels.length === 0 && result.remainingText.includes('continuent'));
  if ([0, 1, 3, 6, 8, 10].includes(age)) await rec.screenshot(label + '-growth');
  return { ...result, geometry };
}

/** Camera-only visual fixture; does not modify persistent player/world state. */
async function cityView149(page, touch, rec, age) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  const result = await page.evaluate(() => {
    const g = DEADWALL, { timestamp, ...saved } = g.serialize();
    const before = JSON.stringify(saved), buildings = [...g.world.buildings.values()].filter(b => b.completed && !b.dead), core = g.core();
    const left = Math.min(...buildings.map(b => b.left)), right = Math.max(...buildings.map(b => b.right));
    const top = Math.min(...buildings.map(b => b.top - Math.min(130, (b.def.floors || 0) * 4))), bottom = Math.max(...buildings.map(b => b.bottom));
    const original = { x: g.camera.x, y: g.camera.y, zoom: g.camera.zoom };
    const zoom = Math.max(.24, Math.min(.85, g.width / (right - left + 300), g.height / (bottom - top + 240)));
    g.camera.x = (left + right) / 2; g.camera.y = (top + bottom) / 2; g.camera.zoom = zoom;
    // Paused frame rendering uses current camera without gameplay updates.
    g.render();
    const { timestamp: afterTimestamp, ...after } = g.serialize();
    globalThis.__D17_149_CAMERA__ = original;
    return { original, prepared: { x: g.camera.x, y: g.camera.y, zoom }, bounds: { left, right, top, bottom },
      buildingCount: buildings.length, core: { id: core.id, x: core.x, y: core.y }, savedUnchanged: before === JSON.stringify(after),
      limitation: 'Explicit transient overview camera and hidden pause backdrop during screenshot only, not a playable zoom or a grant of regional visibility.' };
  });
  const photograph = await page.addStyleTag({ content: '#pauseMenu { visibility: hidden !important; }' });
  try {
    await rec.screenshot('age-' + age + '-physical-city');
    if (age === 10) {
      result.lateBuildingDetails = [];
      for (const type of ['megaTower', 'megaPower', 'megaReserve']) {
        const detail = await page.evaluate(type => {
          const g = DEADWALL, b = [...g.world.buildings.values()].find(b => b.type === type && b.completed && !b.dead);
          if (!b) throw Error('Final visual model missing: ' + type);
          const visualRise = Math.min(130, (b.def.floors || 0) * 4);
          g.camera.x = b.x; g.camera.y = b.y - visualRise / 2;
          g.camera.zoom = Math.min(1.1, g.width / (b.w * 32 + 100), g.height / (b.h * 32 + visualRise + 100));
          g.render();
          return { id: b.id, type, x: b.x, y: b.y, gx: b.gx, gy: b.gy, zoom: g.camera.zoom,
            camera: { x: g.camera.x, y: g.camera.y }, floors: b.def.floors || 1 };
        }, type);
        result.lateBuildingDetails.push(detail); await rec.screenshot('age-10-' + type + '-physical-detail');
      }
    }
  }
  finally { await photograph.evaluate(node => node.remove()); }
  await page.evaluate(() => { const g = DEADWALL; Object.assign(g.camera, globalThis.__D17_149_CAMERA__); delete globalThis.__D17_149_CAMERA__; });
  return result;
}

function prepareLostStorage149() {
  const g = DEADWALL, C = DeadwallCore;
  if (!g.paused || g.tier.id !== 10) throw Error('Paused prepared last-age city required');
  const before = g.serialize(), retained = before.buildings.filter(b => ['core', 'house'].includes(b.type)), keep = new Set(retained.map(b => b.id));
  // Only scene infrastructure is removed in this declared reconstruction setup.
  // Completed ages remain saved knowledge; neither occupants nor stock appear.
  for (const b of [...g.world.buildings.values()]) if (!keep.has(b.id)) g.world.remove(b);
  // Serialization uses the existing registries' own reconciliation; e.g. removed
  // empty fixture batteries cannot leave dangling battery IDs in a strict save.
  const raw = g.serialize();
  g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true); g.updateUI();
  if (g.tier.id !== 10 || g.storage !== C.BUILDINGS.core.storage || g.random.state !== before.randomState || JSON.stringify(g.resources) !== JSON.stringify(before.resources)) throw Error('Loss fixture changed age, stock or RNG');
  return { kind: 'explicit-post-loss-storage-scene', retained: retained.map(b => ({ id: b.id, type: b.type })), removed: before.buildings.length - retained.length,
    storage: g.storage, actualScore: g.cityScore, rememberedPeakScore: g.urban.snapshot().peakScore,
    assignedFields: ['buildings[remove only completed synthetic city supports]', 'powerGrid.batteries/circuits[ordinary reconciliation of removed supports]'],
    limitation: 'Prepared loss of advanced scene infrastructure, not an organically survived siege. Native home, house, people, stock, possessions, health, RNG and remembered age are retained.' };
}

async function inspectArtStage149(page, age, check) {
  const art = await page.evaluate(() => {
    const g = DEADWALL; g.render();
    const sprite = g.d17Art149?.coreSprite(g.tier.id), registry = DeadwallD17Art149;
    return { age: g.tier.id, coreSprite: sprite, atlas: sprite && registry.SPRITES[sprite]?.atlas,
      ready: [...g.art.diagnostics.ready].sort(), failed: [...g.art.diagnostics.failed],
      declared: Object.keys(DeadwallArt.ASSETS).sort(), draws: { ...g.art.diagnostics.draws } };
  });
  check('Age' + age + ': current D17 centre sprite belongs to the decoded registry and is physically drawn', art.age === age && !!art.atlas && art.ready.includes(art.atlas) && art.draws[art.atlas] > 0);
  check('Age' + age + ': every current declared texture decodes without a failed resource', art.failed.length === 0 && JSON.stringify(art.ready) === JSON.stringify(art.declared));
  return art;
}

const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }, { name: 'mobile-landscape', width: 844, height: 390, touch: true }];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = selected ? views.filter(v => selected.includes(v.name)) : views;
const harness = await createHarness('d17-progression149', 'NATIVE: fresh standard seed17117 campaign, actual menu, held keyboard/touch movement, personal harvest/deposit, finite paid house foundation and genuine manual construction through RAF. ADVANCED EXPLICIT FIXTURES: completed legally placed urban models and required supports, plus ordinary previously unlocked fillers to derive each exact city threshold24→1850 from real buildings. No forged tier, population, inventory, resource, health, terrain, node or RNG assignment. Growth readouts and all eleven model catalogues are observed through real DOM navigation. Save/reload/Continue compares every saved field synchronously before first update, with no normalized fields. Physical-city overview uses a declared transient camera only. These prepared thresholds do not establish organic campaign feasibility, human time to Mégaville III, balance, endurance or physical-device certification.');
const { browser, base, report, output } = harness; report.profiles = []; report.normalizedFields = [];
try {
  assert.ok(profiles.length, 'At least one known D17 profile required');
  for (const viewport of profiles) {
    const profile = { viewport, nativeChecks: [], advancedChecks: [], fixtures: [], ages: [], checkpoints: [], artStages: [], timing: {} }; report.profiles.push(profile);
    let context, page, rec;
    try {
      context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
      page = await context.newPage(); page.setDefaultTimeout(30000); rec = recorder(page, profile, output, viewport.name + '-');
      const check = (scope, name, pass) => { scope.push({ name, pass: !!pass }); rec.check(name, pass); };
      const native = (name, pass) => check(profile.nativeChecks, name, pass), advanced = (name, pass) => check(profile.advancedChecks, name, pass);
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); profile.loadedArt = await loadedAssets(page, harness.assetKeys);
      native('All declared atlases and textures load and decode without fallback failures', profile.loadedArt.failed.length === 0);
      await rec.screenshot('menu'); await chooseCampaign(page, '17117'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
      const start = await readEconomy(page); profile.timing.nativeStart = start;
      native('Fresh D17 starts at Refuge with G7 first gestures and actual score8', await page.evaluate(() => DEADWALL.tier.id === 0 && DEADWALL.cityScore === 8 && DEADWALL.chronicles131.snapshot().prologue.status === 'active'));
      await rec.screenshot('native-refuge');
      profile.ages.push(await growth149(page, viewport.touch, native, rec, 0, 'native-age-0'));
      profile.artStages.push(await inspectArtStage149(page, 0, native));
      await activate(page, '#commandTab-workers', viewport.touch); await activate(page, '[data-worker-order="retreat"]', viewport.touch); await resumeCommand(page, viewport.touch);
      profile.harvestRoute = await navigate(page, context, viewport.touch, { kind: 'node', type: 'scrap', amount: 24, range: 62 });
      const beforeHarvest = await readEconomy(page);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(() => DEADWALL.player.carry.scrap >= 16, null, { timeout: 10000 }));
      const afterHarvest = await readEconomy(page); profile.harvest = { before: beforeHarvest, after: afterHarvest };
      native('Actual held input moves the living character and gathers finite scrap into the bag', Math.hypot(afterHarvest.player.x - start.player.x, afterHarvest.player.y - start.player.y) > 20 && afterHarvest.carry.scrap >= 16 && afterHarvest.gathered > beforeHarvest.gathered && afterHarvest.resources.scrap === beforeHarvest.resources.scrap);
      const coreId = await page.evaluate(() => DEADWALL.core().id);
      profile.depositRoute = await navigate(page, context, viewport.touch, { kind: 'building', id: coreId, range: 100 });
      const beforeDeposit = await readEconomy(page);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(() => DEADWALL.player.carry.scrap < .01, null, { timeout: 10000 }));
      const afterDeposit = await readEconomy(page); profile.deposit = { before: beforeDeposit, after: afterDeposit };
      native('Personal deposit transfers exactly accepted finite scrap and advances first gestures', Math.abs(afterDeposit.resources.scrap - beforeDeposit.resources.scrap - beforeDeposit.carry.scrap) < 1e-6 && afterDeposit.prologue.stage >= 2);
      profile.house = await placeBuilding(page, viewport.touch, 'house', 'colony');
      native('Native paid foundation actually draws the decoded D17 construction atlas', await page.evaluate(() => { DEADWALL.render(); return DEADWALL.art.diagnostics.draws.d17Construction149 > 0; }));
      await rec.screenshot('native-paid-foundation');
      await openCommand(page, viewport.touch, 'field');
      const pending = await page.evaluate(() => DEADWALL.urban.planning());
      native('Paid house is an ordinary visible foundation and only contributes conditional score', !profile.house.completed && pending.age.id === 0 && pending.pendingScore === 4 && pending.potentialAge.id === 1 && pending.currentScore === 8);
      await resumeCommand(page, viewport.touch);
      profile.house.workRoute = await workManually(page, context, viewport.touch, profile.house.id);
      await page.waitForFunction(() => DEADWALL.tier.id === 1 && DEADWALL.chronicles131.snapshot().prologue.status === 'done');
      profile.timing.nativeCompletion = await readEconomy(page);
      native('Manual E/ACTION completes the paid house, reaches score12 and Camp fortifié', await page.evaluate(id => DEADWALL.world.buildings.get(id)?.completed && DEADWALL.tier.id === 1 && DEADWALL.cityScore === 12 && DEADWALL.workerOrder === 'retreat', profile.house.id));
      await rec.screenshot('native-built-camp'); profile.ages.push(await growth149(page, viewport.touch, native, rec, 1, 'native-age-1'));
      profile.artStages.push(await inspectArtStage149(page, 1, native));
      profile.checkpoints.push(await saveContinue149(page, viewport.touch)); native('Native Save/Continue preserves every saved field, actual age, identity and RNG', profile.checkpoints.at(-1).pass);
      console.log(JSON.stringify({ viewport: viewport.name, step: 'native-complete', elapsedSimulationSeconds: profile.timing.nativeCompletion.elapsed - start.elapsed }));
      for (let age = 2; age <= 10; age++) {
        profile.fixtures.push(await page.evaluate(prepareAge149, age));
        advanced('Prepared age' + age + ': all knowledge derives from its exact completed physical threshold', profile.fixtures.at(-1).currentScore === profile.fixtures.at(-1).threshold && profile.fixtures.at(-1).rngPreserved);
        profile.ages.push(await growth149(page, viewport.touch, advanced, rec, age, 'prepared-age-' + age));
        profile.artStages.push(await inspectArtStage149(page, age, advanced));
        if ([3, 6, 8, 10].includes(age)) {
          const visual = await cityView149(page, viewport.touch, rec, age); (profile.cityViews ||= []).push({ age, ...visual });
          advanced('Age' + age + ': transient visual overview grants no saved state', visual.savedUnchanged);
        }
        profile.checkpoints.push(await saveContinue149(page, viewport.touch));
        advanced('Age' + age + ': Save/Continue preserves all physical city, score, knowledge, stocks, identity and RNG', profile.checkpoints.at(-1).pass && profile.checkpoints.at(-1).age === age);
        console.log(JSON.stringify({ viewport: viewport.name, step: 'advanced-age-' + age, buildings: profile.checkpoints.at(-1).buildings }));
      }
      profile.fixtures.push(await page.evaluate(prepareLostStorage149));
      const beforeLostRead = await page.evaluate(() => { const { timestamp, ...saved } = DEADWALL.serialize(); return JSON.stringify(saved); });
      await growth149(page, viewport.touch, advanced, rec, 10, 'prepared-post-loss-age-10');
      const warning = page.locator('#urbanCurrentModels [data-storage-warning="megaReserve"]');
      await warning.scrollIntoViewIfNeeded(); const warningGeometry = await visibleInPanel(page, '#urbanCurrentModels [data-storage-warning="megaReserve"]', '.command-body');
      profile.storageLoss = await page.evaluate(() => {
        const g = DEADWALL, model = g.urban.planning().currentModels.find(d => d.id === 'megaReserve'), { timestamp, ...saved } = g.serialize();
        const text = document.querySelector('#urbanCurrentModels [data-storage-warning="megaReserve"]')?.textContent;
        return { model, actualStorage: g.storage, text, saved: JSON.stringify(saved) };
      });
      advanced('Prepared loss: costly final reserve explains its real 1500-per-resource requirement versus surviving 500 capacity', profile.storageLoss.model.minimumStorage === Math.max(...Object.values(profile.storageLoss.model.cost)) && profile.storageLoss.model.storageShortfall === profile.storageLoss.model.minimumStorage - profile.storageLoss.actualStorage && profile.storageLoss.text.includes(String(profile.storageLoss.model.minimumStorage)) && profile.storageLoss.text.includes(String(profile.storageLoss.actualStorage)));
      advanced('Prepared loss: insufficient-capacity warning is actually visible and unmet depot prerequisite remains unmet', warningGeometry.pass && !profile.storageLoss.model.requirementMet);
      advanced('Prepared loss: growth and capacity consultation preserve all saved fields, stock and RNG', profile.storageLoss.saved === beforeLostRead); delete profile.storageLoss.saved;
      await rec.screenshot('prepared-post-loss-storage-warning');
      profile.storageRebuilding = [];
      // Surviving native stock can pay exactly two common warehouses. Every
      // foundation is financed through the real menu and completed with normal
      // held E/ACTION work; no resource or progress fixture is added here.
      for (let depot = 1; depot <= 2; depot++) {
        await resumeCommand(page, viewport.touch);
        const before = await page.evaluate(() => ({ storage: DEADWALL.storage, score: DEADWALL.cityScore, stock: { ...DEADWALL.resources } }));
        const building = await placeBuilding(page, viewport.touch, 'warehouse', 'colony');
        await growth149(page, viewport.touch, advanced, rec, 10, 'post-loss-paid-depot-' + depot);
        const pending = await page.evaluate(() => ({ storage: DEADWALL.storage, model: DEADWALL.urban.planning().currentModels.find(d => d.id === 'megaReserve'), progress: [...DEADWALL.world.buildings.values()].filter(b => !b.completed).map(b => ({ id: b.id, progress: b.progress })) }));
        advanced('Post-loss depot' + depot + ': real payment creates a foundation without granting storage or finished score', !building.completed && pending.storage === before.storage && pending.model.storageShortfall === Math.max(0, pending.model.minimumStorage - before.storage));
        await resumeCommand(page, viewport.touch); building.workRoute = await workManually(page, context, viewport.touch, building.id);
        await growth149(page, viewport.touch, advanced, rec, 10, 'post-loss-built-depot-' + depot);
        const completed = await page.evaluate(() => ({ storage: DEADWALL.storage, score: DEADWALL.cityScore, model: DEADWALL.urban.planning().currentModels.find(d => d.id === 'megaReserve'), stock: { ...DEADWALL.resources }, warning: document.querySelector('#urbanCurrentModels [data-storage-warning="megaReserve"]')?.textContent || null }));
        const warehouseStorage = await page.evaluate(() => DeadwallCore.BUILDINGS.warehouse.storage);
        advanced('Post-loss depot' + depot + ': only actual physical completion adds its declared storage and updates the live warning', completed.storage === before.storage + warehouseStorage && completed.model.storageShortfall === Math.max(0, completed.model.minimumStorage - completed.storage) && !!completed.warning === (completed.model.storageShortfall > 0));
        advanced('Post-loss depot' + depot + ': restoring capacity never grants the absent final logistics prerequisite', !completed.model.requirementMet);
        profile.storageRebuilding.push({ before, building, pending, completed });
      }
      await page.locator('#urbanCurrentModels [data-model="megaReserve"]').scrollIntoViewIfNeeded(); await rec.screenshot('post-loss-real-storage-rebuilt');
      profile.checkpoints.push(await saveContinue149(page, viewport.touch));
      advanced('Prepared loss: Save/Continue retains historical last age and actually rebuilt storage exactly', profile.checkpoints.at(-1).pass && profile.checkpoints.at(-1).age === 10);
      native('All four runtime error collectors remain empty', rec.errors() === 0); profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.inputFailure = error.deadwallInput || null;
      profile.failureState = await page?.evaluate(() => DEADWALL ? { phase: DEADWALL.phase, state: DEADWALL.state, age: DEADWALL.tier.id, score: DEADWALL.cityScore, paused: DEADWALL.paused, overlay: DEADWALL.activeOverlay?.id, player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, notifications: DEADWALL.notifications.map(n => n.text) } : null).catch(() => null);
      await rec?.screenshot('failure').catch(() => {});
    } finally { await context?.close(); }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks?.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.pass = report.profiles.length === profiles.length && report.profiles.every(p => p.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
