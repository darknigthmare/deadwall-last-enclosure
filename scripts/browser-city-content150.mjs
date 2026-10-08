import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel } from './browser-qa-common144.mjs';
import { loadedAssets } from './browser-qa-common142.mjs';
import { prepareAge150, prepareSupports150, prepareService150, prepareRoad150, prepareCompanion150, prepareConstruction150 } from './browser-city-fixtures150.mjs';
async function withHold(page, context, touch, key, selector, action) {
  if (touch) {
    // Wait for the real control after drawers/overlays finish changing layout.
    // CDP touch dispatch does not perform Playwright's normal hit-test checks.
    try {
      await page.waitForFunction(selector => {
        const n = document.querySelector(selector), r = n?.getBoundingClientRect();
        if (!n || !r || n.closest('[inert],.hidden') || !n.checkVisibility({ checkVisibilityCSS: true }) || r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return false;
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return hit === n || n.contains(hit);
      }, selector, { timeout: 10000 });
    } catch (error) {
      error.deadwallTouchTarget = await page.locator(selector).evaluate(n => { const r = n.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { selector: n.dataset.dir || n.id, box: { x: r.x, y: r.y, width: r.width, height: r.height }, hit: hit?.id || hit?.className, visibility: n.checkVisibility({ checkVisibilityCSS: true }), hiddenAncestor: n.closest('[inert],.hidden')?.id, viewport: { width: innerWidth, height: innerHeight } }; });
      throw error;
    }
  }
  return holdInput(page, context, touch, key, selector, action);
}
/** The route reads the same collisions as gameplay; it never writes player position. */
async function planRoute(page, request) {
  return page.evaluate(request => {
    const game = DEADWALL, actor = game.player;
    const target = request.kind === 'node'
      ? game.world.nodes.filter(node => !node.depleted && node.type === request.type && node.amount >= request.amount)
        .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y))[0]
      : game.world.buildings.get(request.id);
    if (!target) throw Error('No live route target: ' + JSON.stringify(request));
    const range = request.range, finishing = Boolean(target.def && !target.completed);
    // Real touch release can arrive several movement frames after a sampled
    // waypoint. Approach unfinished footprints from a wider exterior band.
    const desired = finishing ? Math.min(70, range - 4) : Math.min(36, range * .65), spacing = 16;
    const marginForBody = actor.radius + (finishing ? 32 : 5);
    const start = { x: actor.x, y: actor.y }, targetBox = target.def && {
      left: target.left - marginForBody, right: target.right + marginForBody,
      top: target.top - marginForBody, bottom: target.bottom + marginForBody
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

async function chooseSite(page, type, plannedSite = null) {
  return page.evaluate(({ type, plannedSite }) => {
    const game = DEADWALL, core = game.core(), def = DeadwallCore.BUILDINGS[type], safe = game.hud135.measure(), candidates = [];
    const origin = { gx: Math.floor(game.player.x / 32), gy: Math.floor(game.player.y / 32) };
    for (let gy = origin.gy - 12; gy <= origin.gy + 12; gy++) for (let gx = origin.gx - 12; gx <= origin.gx + 12; gx++) {
      if (plannedSite && (gx !== plannedSite.gx || gy !== plannedSite.gy)) continue;
      if (!game.world.placement(def, gx, gy, 0).valid) continue;
      const left = gx * 32, top = gy * 32, right = (gx + def.size[0]) * 32, bottom = (gy + def.size[1]) * 32;
      if ([game.player, ...game.units].some(actor => actor.x + actor.radius + 5 > left && actor.x - actor.radius - 5 < right && actor.y + actor.radius + 5 > top && actor.y - actor.radius - 5 < bottom)) continue;
      const x = (gx + .5) * 32, y = (gy + .5) * 32;
      const screen = { x: (x - game.camera.x) * game.camera.zoom + game.width / 2, y: (y - game.camera.y) * game.camera.zoom + game.height / 2 };
      if (screen.x < safe.left + 10 || screen.x > safe.right - 10 || screen.y < safe.top + 10 || screen.y > safe.bottom - 10) continue;
      if (document.elementFromPoint(screen.x, screen.y)?.id !== 'game') continue;
      candidates.push({ gx, gy, screen, cost: def.cost, distance: Math.hypot((left + right) / 2 - game.player.x, (top + bottom) / 2 - game.player.y) });
    }
    candidates.sort((a, b) => a.distance - b.distance || a.gy - b.gy || a.gx - b.gx);
    if (!candidates.length) throw Error('No valid visible unoccupied placement for ' + type);
    return candidates[0];
  }, { type, plannedSite });
}

async function exposePlannedSite150(page, context, touch, type, site) {
  const controls = { zoom: [], movements: [] };
  if (touch) {
    if (!await page.locator('#touchCommandDrawer').evaluate(n => n.open)) await activate(page, '#touchCommandDrawer > summary', true);
    for (let i = 0; i < 5 && await page.evaluate(() => DEADWALL.camera.zoom > .53); i++) {
      await activate(page, '#touchCommandDrawer [data-game-command="zoomOut"]', true);
      controls.zoom.push(await page.evaluate(() => DEADWALL.camera.zoom));
    }
    if (await page.locator('#touchCommandDrawer').evaluate(n => n.open)) await activate(page, '#touchCommandDrawer > summary', true);
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.waitForFunction(() => Math.hypot(DEADWALL.camera.x - DEADWALL.player.x, DEADWALL.camera.y - DEADWALL.player.y) < 10);
    try { const placement = await chooseSite(page, type, site); return { ...controls, placement }; }
    catch (error) {
      if (!error.message.includes('No valid visible unoccupied placement')) throw error;
      const movement = await page.evaluate(({ type, site }) => {
        const g = DEADWALL, p = g.player, d = DeadwallCore.BUILDINGS[type], safe = g.hud135.measure();
        const bounds = { left: site.gx * 32, top: site.gy * 32, right: (site.gx + d.size[0]) * 32, bottom: (site.gy + d.size[1]) * 32 };
        const penalty = q => { const x = (site.gx * 32 + 16 - q.x) * g.camera.zoom + g.width / 2, y = (site.gy * 32 + 16 - q.y) * g.camera.zoom + g.height / 2;
          return Math.max(0, safe.left + 10 - x, x - safe.right + 10) + Math.max(0, safe.top + 10 - y, y - safe.bottom + 10); };
        const choices = [['right', 'd', 32, 0], ['down', 's', 0, 32], ['left', 'a', -32, 0], ['up', 'w', 0, -32]].map(([direction, key, dx, dy]) => ({ direction, key, target: { x: p.x + dx, y: p.y + dy }, dx, dy }));
        return choices.filter(c => {
          const q = c.target, closest = { x: Math.max(bounds.left, Math.min(bounds.right, q.x)), y: Math.max(bounds.top, Math.min(bounds.bottom, q.y)) };
          return Math.hypot(q.x - closest.x, q.y - closest.y) > p.radius + 4 && [.25, .5, .75, 1].every(t => g.friendlyPositionClear(p, p.x + c.dx * t, p.y + c.dy * t)) && penalty(q) < penalty(p);
        }).sort((a, b) => penalty(a.target) - penalty(b.target))[0] || null;
      }, { type, site });
      assert.ok(movement, 'Real zoom and collision-free movement must expose the prepared footprint; no hidden/forced canvas click');
      const axis = movement.dx ? 'x' : 'y', sign = (movement.dx || movement.dy) > 0 ? 1 : -1;
      await withHold(page, context, touch, movement.key, '#touchControls [data-dir="' + movement.direction + '"]', () => page.waitForFunction(({ axis, sign, target }) => sign * (DEADWALL.player[axis] - target[axis]) >= -2, { axis, sign, target: movement.target }));
      controls.movements.push({ ...movement, afterRelease: await page.evaluate(() => ({ x: DEADWALL.player.x, y: DEADWALL.player.y, held: [...DEADWALL.input.keys] })) });
    }
  }
  throw Error('Prepared construction site remained outside the actual unobstructed canvas after real view controls');
}

async function placeBuilding(page, context, touch, type, category, plannedSite = null) {
  if (await page.evaluate(() => DEADWALL.buildCollapsed)) await activate(page, '#toggleBuild', touch);
  await activate(page, '#buildCategories [data-category="' + category + '"]', touch);
  await activate(page, '#buildList [data-build-id="' + type + '"]', touch);
  await page.waitForFunction(type => DEADWALL.selectedBuild === type, type);
  const placementView = plannedSite ? await exposePlannedSite150(page, context, touch, type, plannedSite) : null;
  const site = placementView?.placement || await chooseSite(page, type), before = await readEconomy(page);
  await observePayment(page, 'placeOne', type);
  if (touch) await page.touchscreen.tap(site.screen.x, site.screen.y);
  else await page.mouse.click(site.screen.x, site.screen.y);
  await page.waitForFunction(site => [...DEADWALL.world.buildings.values()].some(building => building.type === site.type && building.gx === site.gx && building.gy === site.gy), { ...site, type });
  const building = await page.evaluate(site => {
    const b = [...DEADWALL.world.buildings.values()].find(b => b.type === site.type && b.gx === site.gx && b.gy === site.gy);
    return { id: b.id, type: b.type, gx: b.gx, gy: b.gy, progress: b.progress, completed: b.completed, buildTime: b.def.buildTime };
  }, { ...site, type });
  const after = await readEconomy(page);
  const payment = await page.evaluate(() => globalThis.__CITY150_PAYMENT__);
  assert.ok(payment?.result === true, 'Real canvas dispatch succeeds');
  for (const [key, amount] of Object.entries(site.cost)) assert.ok(Math.abs(payment.before[key] - payment.after[key] - amount) < 1e-6, type + ' pays its real ' + key + ' cost synchronously');
  assert.equal(building.completed, false, 'Placement creates an unfinished worksite');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !DEADWALL.selectedBuild);
  if (!await page.evaluate(() => DEADWALL.buildCollapsed)) await activate(page, '#toggleBuild', touch);
  return { ...building, cost: site.cost, payment, before, after, placementView };
}

async function workManually(page, context, touch, id) {
  const route = await navigate(page, context, touch, { kind: 'building', id, range: 78 });
  const observeWorkPoint = () => page.evaluate(id => {
    const g = DEADWALL, p = g.player, b = g.world.buildings.get(id);
    const closest = { x: Math.max(b.left, Math.min(b.right, p.x)), y: Math.max(b.top, Math.min(b.bottom, p.y)) };
    const clearance = Math.hypot(p.x - closest.x, p.y - closest.y);
    return { x: p.x, y: p.y, radius: p.radius, clearance, bodyOutside: clearance >= p.radius + 4, canWork: g.workerCanWorkAt(p, b, 78), held: [...g.input.keys] };
  }, id);
  route.afterRelease = await observeWorkPoint(); route.physicalCorrections = [];
  for (let attempt = 0; attempt < 3 && (!route.afterRelease.bodyOutside || !route.afterRelease.canWork); attempt++) {
    route.physicalCorrections.push(await navigate(page, context, touch, { kind: 'building', id, range: 78 }));
    route.afterRelease = await observeWorkPoint();
  }
  assert.ok(route.afterRelease.bodyOutside && route.afterRelease.canWork && route.afterRelease.held.length === 0,
    'Actual released player body must remain outside the footprint and within physical work range: ' + JSON.stringify(route.afterRelease));
  route.workStarted = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), id);
  await withHold(page, context, touch, 'e', '#touchAction', () => page.waitForFunction(id => DEADWALL.world.buildings.get(id)?.completed, id, { timeout: 45000 }));
  await page.waitForFunction(() => !DEADWALL.input.keys.has('KeyE'));
  route.workCompleted = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), id);
  route.ordinarySimulationWorkSeconds = route.workCompleted.elapsed - route.workStarted.elapsed;
  return route;
}

async function waitForExercise150(page, profile) {
  const deadline = Date.now() + 450000; let nextProgress = Date.now();
  while (true) {
    const observation = await page.evaluate(() => { const g = DEADWALL, s = g.companionsPack.snapshot(); return {
      elapsed: g.elapsed, remaining: s.training?.left ?? null, acquired: s.trained.includes('samir:triage'), training: s.training,
      paused: g.paused, overlay: g.activeOverlay?.id || null, health: g.player.health, dead: g.player.dead,
      phase: g.phase, wildNext: g.exploration125.wildNext, wildHordes: g.exploration125.wildHordes,
      livingHostiles: g.zombies.filter(z => !z.dead && z.health > 0).length
    }; });
    profile.exercise.lastObservation = observation;
    if (observation.acquired && !observation.training) return;
    assert.ok(!observation.dead && observation.health > 0, 'Commander must remain alive while the real exercise runs: ' + JSON.stringify(observation));
    assert.ok(!observation.paused && !observation.overlay, 'A real gameplay modal interrupted the exercise: ' + JSON.stringify(observation));
    assert.ok(Date.now() < deadline, 'Ordinary 450-second wall-clock exercise budget exceeded: ' + JSON.stringify(observation));
    if (Date.now() >= nextProgress) { console.log(JSON.stringify({ profile: profile.viewport.name, stage: 'ordinary-training-progress', ...observation })); nextProgress = Date.now() + 30000; }
    await page.waitForTimeout(1000);
  }
}

async function saveContinue150(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  if (!await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseButton', touch);
  await activate(page, '#saveButton', touch);
  const expected = await page.evaluate(() => { const text = localStorage.getItem(DeadwallCore.SAVE_KEY), { timestamp, ...data } = JSON.parse(text), { timestamp: checkedTimestamp, ...validated } = DeadwallSave.parse(text); return { ok: DEADWALL.lastSaveStatus.ok, data, validated }; });
  assert.ok(expected.ok, 'Actual Save button succeeds');
  await activate(page, '#quitButton', touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page);
  await page.evaluate(() => {
    const g = DEADWALL, old = g.restoreSave.bind(g);
    g.restoreSave = (...args) => { const result = old(...args); const serialized = g.serialize(), { timestamp, ...raw } = serialized, { timestamp: checkedTimestamp, ...validated } = DeadwallSave.validate(serialized); globalThis.__CITY150_RESTORED__ = { raw, validated }; g.togglePause(true); return result; };
  });
  await activate(page, '#continueButton', touch); await page.waitForFunction(() => DEADWALL.state === 'playing' && DEADWALL.paused);
  return page.evaluate(({ data: expected, validated: expectedValidated }) => {
    const observation = globalThis.__CITY150_RESTORED__, actual = observation?.raw;
    // Objects compare by their actual key sets and values, independently of
    // insertion order. Arrays retain index order; no field/value is normalized.
    function compare(left, right) {
      const missingKeys = [], extraKeys = [], valueDiffs = [];
      function visit(a, b, path) {
        if (Object.is(a, b)) return;
        if (a === null || b === null || typeof a !== typeof b || typeof a !== 'object' || Array.isArray(a) !== Array.isArray(b)) { valueDiffs.push({ path, expected: a, actual: b }); return; }
        if (Array.isArray(a)) { if (a.length !== b.length) valueDiffs.push({ path: path + '.length', expected: a.length, actual: b.length }); for (let i = 0; i < Math.min(a.length, b.length); i++) visit(a[i], b[i], path + '[' + i + ']'); return; }
        for (const key of Object.keys(a)) { if (!Object.hasOwn(b, key)) missingKeys.push(path + '.' + key); else visit(a[key], b[key], path + '.' + key); }
        for (const key of Object.keys(b)) if (!Object.hasOwn(a, key)) extraKeys.push(path + '.' + key);
      }
      visit(left, right, '$'); return { pass: !missingKeys.length && !extraKeys.length && !valueDiffs.length, missingKeys, extraKeys, valueDiffs };
    }
    const rawComparison = compare(expected, actual), validatedComparison = compare(expectedValidated, observation?.validated);
    const changedKeys = [...new Set([...rawComparison.missingKeys, ...rawComparison.extraKeys, ...rawComparison.valueDiffs.map(d => d.path)].map(p => p.split(/[.[]/)[1]).filter(Boolean))];
    return { pass: rawComparison.pass && validatedComparison.pass, changedKeys, rawChangedKeys: changedKeys, rawComparison, validatedComparison,
      rawPlayer: { expected: expected.player, actual: actual?.player }, normalizedFields: [], age: DEADWALL.tier.id, score: DEADWALL.cityScore,
      expectedRNG: expected.randomState, restoredRNG: actual?.randomState, buildings: actual?.buildings.length, urban: actual?.urban };
  }, expected);
}

/** Observation wraps the real owner without modifying its arguments or result. */
async function observePayment(page, method, type) {
  await page.evaluate(({ method, type }) => {
    const g = DEADWALL, original = g[method]; globalThis.__CITY150_PAYMENT__ = null;
    g[method] = function (...args) {
      const before = { ...g.resources }, rng = g.random.state, result = original.apply(this, args);
      if (!type || args[0] === type) { globalThis.__CITY150_PAYMENT__ = { before, after: { ...g.resources }, rng, afterRNG: g.random.state, result }; g[method] = original; }
      return result;
    };
  }, { method, type });
}

/** Capture and bubbling listeners bracket existing UI handlers in the same event. */
async function observeControlPayment(page, selector) {
  await page.locator(selector).evaluate(n => {
    const read = () => ({ resources: { ...DEADWALL.resources }, carry: { ...DEADWALL.player.carry }, rng: DEADWALL.random.state });
    n.addEventListener('click', () => { globalThis.__CITY150_CONTROL_PAYMENT__ = { before: read() }; }, { capture: true, once: true });
    n.addEventListener('click', () => { globalThis.__CITY150_CONTROL_PAYMENT__.after = read(); }, { once: true });
  });
}

async function openCatalogue(page, touch) {
  if (!await page.locator('#commandModal').isVisible()) await openCommand(page, touch, 'field');
  else await activate(page, '#commandTab-field', touch);
  await activate(page, '#coordinationTab', touch);
  await page.locator('#cityCatalogueAge150').scrollIntoViewIfNeeded();
}

async function inspectCatalogue(page, touch, check, rec, age) {
  await openCatalogue(page, touch);
  const before = await page.evaluate(() => { const { timestamp, ...s } = DEADWALL.serialize(); return JSON.stringify(s); });
  await page.locator('#cityCatalogueAge150').selectOption(String(age));
  await page.locator('#cityCatalogueAge150').focus();
  const geometry = await visibleInPanel(page, '#cityCatalogueAge150', '.command-body');
  check('Age ' + age + ': labelled native age selector is visible and focus has no hidden ancestor', geometry.pass && await page.locator('#cityCatalogueAge150').evaluate(n => n.labels.length === 1 && document.activeElement === n && !n.closest('.hidden,[inert]')));
  const result = await page.evaluate(age => {
    const g = DEADWALL, catalogue = g.cityCatalogueUI150.catalogue, expected = catalogue.forAge(age), cards = [...document.querySelectorAll('#cityCatalogueGroups150 article[data-choice]')];
    const { timestamp, ...saved } = g.serialize();
    return { age, attained: g.tier.id, optionCount: document.getElementById('cityCatalogueAge150').options.length,
      expected: expected.map(i => i.key), rendered: cards.map(n => n.dataset.choice), known: cards.map(n => n.dataset.known),
      rows: cards.map(n => ({ key: n.dataset.choice, cost: n.querySelector('.city-catalogue-cost150').textContent, text: n.textContent })),
      costsAgree: cards.every(n => n.querySelector('.city-catalogue-cost150').textContent.endsWith(DeadwallCore.resourceText(expected.find(i => i.key === n.dataset.choice).cost))),
      summary: document.getElementById('cityCatalogueSummary150').textContent, saved: JSON.stringify(saved) };
  }, age);
  check('Age ' + age + ': exact derived choices and their actual costs are rendered', JSON.stringify(result.expected) === JSON.stringify(result.rendered) && result.costsAgree && result.optionCount === 11);
  check('Age ' + age + ': inspection preserves every saved field and RNG', result.saved === before); delete result.saved;
  check('Age ' + age + ': known status follows attained history', result.known.every(k => k === String(age <= result.attained)));
  const group = page.locator('#cityCatalogueGroups150 details').first();
  if (await group.count()) {
    if (!await group.evaluate(n => n.open)) await group.locator('summary').click();
    const button = group.locator('[data-catalogue-action]').first();
    await button.scrollIntoViewIfNeeded(); await button.focus();
    check('Age ' + age + ': expanded option action is accessible and focus is visible', await button.evaluate(n => n.checkVisibility({ checkVisibilityCSS: true }) && !n.closest('.hidden,[inert]') && document.activeElement === n));
  }
  if ([0, 4, 7, 10].includes(age)) await rec.screenshot('catalogue-attained-' + result.attained + '-age-' + age);
  return { ...result, geometry };
}

async function resume(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await resumeCommand(page, touch);
  else if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}

async function openExpansion(page, touch, pack, group) {
  await openCommand(page, touch, 'field');
  await activate(page, '#expansionFieldTab', touch);
  await activate(page, '#expansionGroup-' + group, touch);
  await activate(page, '#expansionTab-' + pack, touch);
}

async function roadPlan(page, touch, point, surface, mode) {
  await openCommand(page, touch, 'field'); await activate(page, '#infrastructureTab', touch);
  await activate(page, '#infraSurface-' + surface, touch); await activate(page, '#infraMode-' + mode, touch);
  for (const [id, value] of Object.entries({ x1: point.x, y1: point.y, x2: point.x, y2: point.y })) await page.locator('#infra-' + id).fill(String(value));
  await activate(page, '#infraPreview', touch);
  const quote = await page.evaluate(() => DEADWALL.infrastructure.overview().preview);
  assert.ok(quote?.ok, 'Actual road UI produces an eligible quote');
  await observeControlPayment(page, '#infraCommit'); await activate(page, '#infraCommit', touch);
  const payment = await page.evaluate(() => globalThis.__CITY150_CONTROL_PAYMENT__);
  for (const [key, amount] of Object.entries(quote.cost)) assert.ok(Math.abs(payment.before.resources[key] - payment.after.resources[key] - amount) < 1e-7, 'Road pays exact ' + key);
  await activate(page, '#infraEquip', touch);
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
  return { quote, payment };
}

async function artScene150(page, touch, rec) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  if (!await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseButton', touch);
  const fixture = await page.evaluate(prepareSupports150, { allModels: true });
  const observation = await page.evaluate(() => {
    const g = DEADWALL, A = DeadwallD17Art150, ids = Object.keys(DeadwallCore.CityContent150.BUILDINGS), original = { ...g.camera }, persistent = () => { const { timestamp, ...s } = g.serialize(); return JSON.stringify(s); }, before = persistent(), paints = [], blit = g.art.blit;
    g.art.blit = function (ctx, key, rect, ...args) { if (Object.hasOwn(A.ASSETS, key)) paints.push({ key, rect: [...rect] }); return blit.call(this, ctx, key, rect, ...args); };
    globalThis.__CITY150_PHOTO__ = original;
    const models = ids.map(type => [...g.world.buildings.values()].find(b => b.type === type && b.completed && !b.dead));
    const bounds = { left: Math.min(...models.map(b => b.left)), right: Math.max(...models.map(b => b.right)), top: Math.min(...models.map(b => b.top - 120)), bottom: Math.max(...models.map(b => b.bottom)) };
    g.camera.x = (bounds.left + bounds.right) / 2; g.camera.y = (bounds.top + bounds.bottom) / 2; g.camera.zoom = Math.min(.55, g.width / (bounds.right - bounds.left + 120), g.height / (bounds.bottom - bounds.top + 180)); g.render();
    g.art.blit = blit;
    return { fixture: 'Transient camera only; paused backdrop hidden only during photographs. No grant of visibility or gameplay zoom.', ids,
      spriteIds: Object.keys(A.SPRITES), paints, bounds, decoded: Object.entries(A.ASSETS).map(([key, spec]) => ({ key, width: g.art.images[key]?.width, height: g.art.images[key]?.height, expectedWidth: spec.width, expectedHeight: spec.height })),
      paintedIds: ids.filter(id => paints.some(p => p.key === A.SPRITES[id].atlas && JSON.stringify(p.rect) === JSON.stringify(A.SPRITES[id].rect))),
      persistentUnchanged: before === persistent() };
  });
  const style = await page.addStyleTag({ content: '#pauseMenu { visibility:hidden!important; }' });
  try {
    await rec.screenshot('city-20-native-models');
    for (const type of ['casemate150', 'gateStore150', 'electricCannery150', 'continuityArsenal150', 'frontBattery150']) {
      await page.evaluate(type => { const g = DEADWALL, b = [...g.world.buildings.values()].find(b => b.type === type && b.completed && !b.dead); g.camera.x = b.x; g.camera.y = b.y - 18; g.camera.zoom = Math.min(1.7, g.width / (b.w * 32 + 160), g.height / (b.h * 32 + 210)); g.render(); }, type);
      await rec.screenshot('native-model-' + type);
    }
  } finally { await style.evaluate(n => n.remove()); await page.evaluate(() => { Object.assign(DEADWALL.camera, globalThis.__CITY150_PHOTO__); DEADWALL.render(); }); }
  return { fixture, ...observation };
}

const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }];
const selected = process.env.DEADWALL_QA_PROFILES?.split(','), profiles = selected ? views.filter(v => selected.includes(v.name)) : views;
const harness = await createHarness('city-content150', 'Native fresh seed17117: genuine menu, movement, harvesting, deposit and paid house construction. Advanced scenes explicitly prepare legally completed infrastructure, derived ages 2–10, finite common stock, free physical exterior player positions, one finite recipe bag and earlier Samir skills. Four new buildings, including an autonomous casemate guarding the real core work point, are then actually financed and manually completed. Wild hordes and their clocks remain ordinary. Gravel and paving are actually paid and physically finished; guideRail consumes its finite recipe only after ordinary 14 seconds; Samir triage pays real stock and completes 90 seconds through ordinary RAF. Catalogue reads and refusals preserve stock and RNG; Save/menu/reload/Continue compares every saved field before first resumed RAF without normalization. Final 20-model art scene prepares remaining completed models and a transient photo camera. No claim of organically financed late campaign, human time to city age, endurance balance, file transport or hardware-device certification.');
const { browser, base, report, output } = harness; report.profiles = []; report.normalizedFields = [];
try {
  assert.ok(profiles.length, 'Known city QA profile required');
  for (const viewport of profiles) {
    const profile = { viewport, fixtures: [], ages: [], checkpoints: [], transactions: [], nativeChecks: [], advancedChecks: [] }; report.profiles.push(profile);
    let context, page, rec;
    try {
      context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
      page = await context.newPage(); page.setDefaultTimeout(30000); rec = recorder(page, profile, output, viewport.name + '-');
      const check = (list, name, pass) => { list.push({ name, pass: !!pass }); rec.check(name, pass); };
      const native = (name, pass) => check(profile.nativeChecks, name, pass), advanced = (name, pass) => check(profile.advancedChecks, name, pass);
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await page.waitForFunction(() => DEADWALL.cityCatalogueUI150 && DEADWALL.d17Art150);
      profile.loadedArt = await loadedAssets(page, harness.assetKeys); native('Every declared asset decodes with the exact runtime registry', profile.loadedArt.failed.length === 0);
      native('Runtime package and menu expose delivery version 1.53', harness.version.startsWith('1.53.') && await page.locator('#mainMenu footer').textContent().then(t => t.includes(harness.version)));
      await chooseCampaign(page, '17117'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
      const systemsDevelopment = process.env.DEADWALL_QA_SMOKE === 'systems';
      if (!systemsDevelopment) {
      const start = await readEconomy(page); native('Native refuge starts with actual score 8 and living player', await page.evaluate(() => DEADWALL.cityScore === 8 && DEADWALL.tier.id === 0 && !DEADWALL.player.dead));
      profile.ages.push(await inspectCatalogue(page, viewport.touch, native, rec, 0));
      // Inspect a future final age while still a fresh refuge; owner APIs must refuse.
      profile.futureCatalogue = await inspectCatalogue(page, viewport.touch, native, rec, 10);
      const futureAction = '[data-catalogue-action="building:continuityArsenal150"]';
      await observeControlPayment(page, futureAction); await activate(page, futureAction, viewport.touch);
      profile.futureNavigation = await page.evaluate(() => ({ payment: globalThis.__CITY150_CONTROL_PAYMENT__, paused: DEADWALL.paused, overlay: DEADWALL.activeOverlay?.id, focus: document.activeElement?.id }));
      native('Actual catalogue navigation debits no material and consumes no RNG', JSON.stringify(profile.futureNavigation.payment.before.resources) === JSON.stringify(profile.futureNavigation.payment.after.resources) && profile.futureNavigation.payment.before.rng === profile.futureNavigation.payment.after.rng);
      if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', viewport.touch);
      native('Real future catalogue navigation reaches its owner with visible focus and keeps future construction unavailable', await page.evaluate(() => !DEADWALL.paused && DEADWALL.currentCategory === 'industry' && !document.querySelector('#buildList [data-build-id="continuityArsenal150"]') && !document.activeElement.closest('.hidden,[inert]')));
      if (!await page.evaluate(() => DEADWALL.buildCollapsed)) await activate(page, '#toggleBuild', viewport.touch);
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#coordinationTab', viewport.touch);
      const refusal = await page.evaluate(() => {
        const g = DEADWALL, before = JSON.stringify(g.resources), rng = g.random.state, def = DeadwallCore.BUILDINGS.casemate150; let point;
        for (let y = g.core().gy - 10; y < g.core().gy + 10 && !point; y++) for (let x = g.core().gx - 10; x < g.core().gx + 10 && !point; x++) if (g.world.placement(def, x, y, 0).valid) point = { x, y };
        if (!point) throw Error('No refusal location');
        const results = { building: g.placeOne('casemate150', point.x, point.y), road: g.infrastructure.chooseSurface('paving'), mechanism: g.fortificationPack.startMechanism('guideRail', g.core().id), exercise: g.companionsPack.train('samir', 'triage') };
        return { results, noDebit: before === JSON.stringify(g.resources), noRNG: rng === g.random.state, reasons: g.infrastructure.overview().notice };
      }); profile.refusal = refusal;
      native('Declared authoritative future-age refusals debit nothing and consume no RNG', refusal.noDebit && refusal.noRNG && refusal.results.building === false && refusal.results.road.ok === false && refusal.results.mechanism.ok === false && refusal.results.exercise.ok === false);
      native('Future catalogue clearly exposes missing age, support, materials and storage reasons', profile.futureCatalogue.rows.some(r => r.text.includes('Âge à atteindre') && r.text.includes('À construire et achever') && r.text.includes('Manque') && r.text.includes('Capacité nécessaire')));
      await activate(page, '#commandTab-workers', viewport.touch); await activate(page, '[data-worker-order="retreat"]', viewport.touch); await resumeCommand(page, viewport.touch);
      profile.harvestRoute = await navigate(page, context, viewport.touch, { kind: 'node', type: 'scrap', amount: 24, range: 62 });
      const beforeHarvest = await readEconomy(page);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(() => DEADWALL.player.carry.scrap >= 16, null, { timeout: 10000 }));
      const afterHarvest = await readEconomy(page);
      native('Genuine held input moves, harvests finite scrap into bag and preserves depot scrap', Math.hypot(afterHarvest.player.x - start.player.x, afterHarvest.player.y - start.player.y) > 20 && afterHarvest.carry.scrap >= 16 && afterHarvest.gathered > beforeHarvest.gathered && afterHarvest.resources.scrap === beforeHarvest.resources.scrap);
      profile.depositRoute = await navigate(page, context, viewport.touch, { kind: 'building', id: await page.evaluate(() => DEADWALL.core().id), range: 100 });
      const beforeDeposit = await readEconomy(page);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(() => DEADWALL.player.carry.scrap < .01, null, { timeout: 10000 }));
      const afterDeposit = await readEconomy(page);
      native('Real personal deposit transfers exactly the finite bag', Math.abs(afterDeposit.resources.scrap - beforeDeposit.resources.scrap - beforeDeposit.carry.scrap) < 1e-6);
      profile.house = await placeBuilding(page, context, viewport.touch, 'house', 'colony'); native('Native house pays once and begins as physical unfinished foundation', !profile.house.completed && profile.house.payment.result === true);
      profile.house.work = await workManually(page, context, viewport.touch, profile.house.id);
      await page.waitForFunction(() => DEADWALL.tier.id === 1);
      native('Actual manual construction reaches fortified camp score 12', await page.evaluate(() => DEADWALL.cityScore === 12 && DEADWALL.chronicles131.snapshot().prologue.status === 'done'));
      profile.nativeElapsed = await page.evaluate(start => DEADWALL.elapsed - start, start.elapsed);
      profile.ages.push(await inspectCatalogue(page, viewport.touch, native, rec, 1));
      await activate(page, '#commandReturn129', viewport.touch);
      for (let age = 2; age <= 10; age++) {
        profile.fixtures.push(await page.evaluate(prepareAge150, age));
        advanced('Prepared age ' + age + ': exact completed threshold determines knowledge without RNG changes', profile.fixtures.at(-1).currentScore === profile.fixtures.at(-1).threshold && profile.fixtures.at(-1).rngPreserved);
        profile.ages.push(await inspectCatalogue(page, viewport.touch, advanced, rec, age));
        await activate(page, '#commandReturn129', viewport.touch);
      }
      console.log(JSON.stringify({ profile: viewport.name, stage: 'native-and-eleven-catalogues', checks: profile.checks.length, nativeElapsed: profile.nativeElapsed }));
      if (process.env.DEADWALL_QA_SMOKE === '1') { profile.smokeOnly = true; profile.pass = rec.errors() === 0; continue; }
      } else { await activate(page, '#pauseButton', viewport.touch); profile.fixtures.push(await page.evaluate(prepareAge150, 10)); }
      profile.fixtures.push(await page.evaluate(prepareSupports150));
      advanced('Advanced supports have finite capacity-valid stocks and preserve RNG', profile.fixtures.at(-1).rngPreserved);
      profile.contentRegistry = await page.evaluate(() => {
        const C = DeadwallCore, items = DEADWALL.cityCatalogueUI150.catalogue.items;
        return { models: Object.keys(C.CityContent150.BUILDINGS), upgrades: { ...C.CityContent150.UPGRADES }, plans: C.CityContent150.PLANS.map(p => p.id),
          modelConditionsAgree: Object.values(C.CityContent150.BUILDINGS).every(d => items.some(i => i.key === 'building:' + d.id && i.tier === d.unlockTier && JSON.stringify(i.cost) === JSON.stringify(d.cost) && (!d.requires || i.conditions.some(c => c.kind === 'building' && c.id === d.requires)))),
          roads: Object.values(C.Infrastructure.SURFACES).map(s => ({ id: s.id, tier: s.unlockTier, cost: s.cost, work: s.workSeconds })),
          mechanisms: Object.entries(C.FortificationPackRules.mechanisms).filter(([,r]) => r.strictTier).map(([id, r]) => ({ id, tier: r.tier, cost: r.cost, seconds: r.seconds })),
          exercises: Object.entries(C.CompanionPackRules.exercises).filter(([,r]) => r.tier !== undefined).map(([id,r]) => ({ id, tier: r.tier, cost: r.cost, seconds: r.seconds, companions: r.allowedCompanions })) };
      });
      advanced('All twenty new model costs, physical support prerequisites and attained tiers agree with authoritative definitions', profile.contentRegistry.models.length === 20 && profile.contentRegistry.modelConditionsAgree);
      for (const type of systemsDevelopment ? [] : ['casemate150', 'gateStore150', 'electricCannery150', 'continuityArsenal150']) {
        const fixture = await page.evaluate(prepareConstruction150, type === 'casemate150' ? { type, protectCore: true } : type);
        profile.fixtures.push(fixture);
        await resume(page, viewport.touch);
        await page.waitForFunction(() => Math.hypot(DEADWALL.camera.x - DEADWALL.player.x, DEADWALL.camera.y - DEADWALL.player.y) < 10);
        const capacity = await page.evaluate(() => DEADWALL.storage);
        const transaction = await placeBuilding(page, context, viewport.touch, type, await page.evaluate(type => DeadwallCore.BUILDINGS[type].category, type), fixture.site);
        advanced(type + ': real canvas pays the declared cost exactly once, without RNG', transaction.payment.rng === transaction.payment.afterRNG);
        advanced(type + ': paid foundation does not grant completed benefits', await page.evaluate(({ id, capacity }) => !DEADWALL.world.buildings.get(id).completed && DEADWALL.storage === capacity, { id: transaction.id, capacity }));
        transaction.work = await workManually(page, context, viewport.touch, transaction.id);
        advanced(type + ': held manual work completes the genuine paid foundation', await page.evaluate(id => DEADWALL.world.buildings.get(id).completed, transaction.id));
        if (type === 'casemate150') {
          transaction.protection = await page.evaluate(({ id, point }) => { const g = DEADWALL, b = g.world.buildings.get(id); return { id, point, distance: Math.hypot(b.x - point.x, b.y - point.y), range: b.def.range, observerRange: b.def.observerRange150, clear: g.hostileLineClear(b, point), completed: b.completed, autonomous: !b.def.powerUse, ammoPerShot: b.def.ammoPerShot }; }, { id: transaction.id, point: fixture.protectedPoint });
          advanced('Paid completed casemate covers the real core service point with line of sight, finite ammunition and no electric demand', transaction.protection.completed && transaction.protection.clear && transaction.protection.distance <= transaction.protection.range - 80 && transaction.protection.autonomous && transaction.protection.ammoPerShot === 1);
          profile.protection = transaction.protection;
        } else if (type === 'gateStore150') advanced('New gate store adds its actual 450 storage only on completion', await page.evaluate(capacity => DEADWALL.storage === capacity + DeadwallCore.BUILDINGS.gateStore150.storage, capacity));
        else {
          await page.evaluate(id => { const g = DEADWALL, original = g.powerGrid; globalThis.__CITY150_PRODUCTION__ = []; g.powerGrid = Object.freeze({ ...original, productionSeconds: (...args) => { const result = original.productionSeconds(...args); if (args[0].id === id) globalThis.__CITY150_PRODUCTION__.push({ seconds: result, elapsed: g.elapsed, powered: args[0].powered, inputs: { ...g.resources } }); return result; } }); globalThis.__CITY150_POWER_OWNER__ = original; }, transaction.id);
          await page.waitForFunction(() => globalThis.__CITY150_PRODUCTION__.some(p => p.seconds > 0), null, { timeout: 5000 });
          transaction.production = await page.evaluate(id => { const g = DEADWALL, b = g.world.buildings.get(id); const result = { windows: globalThis.__CITY150_PRODUCTION__, production: b.def.production, consumes: b.def.consumes, powerUse: b.def.powerUse }; g.powerGrid = globalThis.__CITY150_POWER_OWNER__; return result; }, transaction.id);
          advanced(type + ': ordinary economy dispatch produces with real supplied power and configured finite inputs', transaction.production.windows.some(w => w.seconds > 0 && w.powered) && transaction.production.powerUse > 0 && !transaction.production.consumes.fuel);
        }
        profile.transactions.push(transaction); await rec.screenshot('actually-built-' + type);
        console.log(JSON.stringify({ profile: viewport.name, stage: 'actually-built', type, manualSimulationSeconds: transaction.work.ordinarySimulationWorkSeconds }));
        await activate(page, '#pauseButton', viewport.touch);
      }
      const roadFixture = await page.evaluate(prepareRoad150); profile.fixtures.push(roadFixture); const point = roadFixture.point;
      profile.gravel = await roadPlan(page, viewport.touch, point, 'gravel', 'new');
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(point => DEADWALL.infrastructure.snapshot().roads.some(r => r.x === point.x && r.y === point.y && r.progress === 1), point));
      advanced('First road is really paid and completed on site; default gravel uses legacy format', await page.evaluate(point => { const r = DEADWALL.infrastructure.snapshot().roads.find(r => r.x === point.x && r.y === point.y); return r.progress === 1 && !Object.hasOwn(r, 'surface') && DEADWALL.infrastructure.speed(point.player.x, point.player.y, 'friendly') === DeadwallCore.Infrastructure.SURFACES.gravel.friendlySpeed; }, point));
      profile.paving = await roadPlan(page, viewport.touch, point, 'paving', 'upgrade');
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(point => DEADWALL.infrastructure.snapshot().roads.find(r => r.x === point.x && r.y === point.y)?.upgrade?.progress > .1, point));
      await activate(page, '#pauseButton', viewport.touch);
      profile.partialRoad = await page.evaluate(point => ({ road: DEADWALL.infrastructure.snapshot().roads.find(r => r.x === point.x && r.y === point.y), speed: DEADWALL.infrastructure.speed(point.player.x, point.player.y, 'friendly') }), point);
      advanced('Paving pays only material differences; partial upgrade retains old gravel speed', profile.paving.quote.cost.stone === 3 && profile.paving.quote.cost.scrap === 1 && profile.partialRoad.road.upgrade.progress < 1 && profile.partialRoad.speed === 1.18);
      profile.checkpoints.push(await saveContinue150(page, viewport.touch)); advanced('Partial paid road Save/menu/Continue restores all fields and RNG exactly', profile.checkpoints.at(-1).pass);
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#infrastructureTab', viewport.touch); await activate(page, '#infraEquip', viewport.touch);
      if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', viewport.touch);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(point => DEADWALL.infrastructure.snapshot().roads.find(r => r.x === point.x && r.y === point.y)?.surface === 'paving', point));
      advanced('Physical renovation promotes the surface and actual ally/truck/hostile speed only after completion', await page.evaluate(point => { const g = DEADWALL, r = g.infrastructure.snapshot().roads.find(r => r.x === point.x && r.y === point.y), s = DeadwallCore.Infrastructure.SURFACES.paving; return !r.upgrade && ['friendly', 'truck', 'hostile'].every(kind => g.infrastructure.speed(point.player.x, point.player.y, kind) === s[kind + 'Speed']); }, point));
      await activate(page, '#pauseButton', viewport.touch);
      const recipe = await page.evaluate(() => DeadwallCore.FortificationPackRules.mechanisms.guideRail);
      profile.fixtures.push(await page.evaluate(prepareService150, { type: 'spikes', bag: recipe.cost }));
      await openExpansion(page, viewport.touch, 'fortification', 'defense');
      const mechanismSelector = '#expansionAction-fortification-mechanism-guideRail'; await observeControlPayment(page, mechanismSelector); await activate(page, mechanismSelector, viewport.touch);
      if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', viewport.touch);
      profile.mechanism = await page.evaluate(() => ({ payment: globalThis.__CITY150_CONTROL_PAYMENT__, start: DEADWALL.elapsed, job: { ...DEADWALL.fortificationPack.job } }));
      advanced('Physical guide rail starts a 14-second job and does not debit its recipe early', profile.mechanism.job.seconds === recipe.seconds && JSON.stringify(profile.mechanism.payment.before.carry) === JSON.stringify(profile.mechanism.payment.after.carry));
      await page.waitForFunction(() => !DEADWALL.fortificationPack.busy(), null, { timeout: Math.max(60000, recipe.seconds * 5000) });
      profile.mechanism.completed = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, bag: { ...DEADWALL.player.carry }, state: DEADWALL.fortificationPack.snapshot(), id }), profile.mechanism.job.building);
      const fitting = profile.mechanism.completed.state.fittings.find(f => f.id === profile.mechanism.job.building);
      advanced('Real guide rail finishes with finite 8 charges and consumes its bag recipe once', fitting?.mechanism?.kind === 'guideRail' && fitting.mechanism.charges === recipe.charges && Object.entries(recipe.cost).every(([k, v]) => Math.abs(profile.mechanism.payment.before.carry[k] - profile.mechanism.completed.bag[k] - v) < 1e-7));
      advanced('Mechanism is not completed by a synthetic timer or save normalization', profile.mechanism.completed.elapsed - profile.mechanism.start >= recipe.seconds - .2);
      profile.checkpoints.push(await saveContinue150(page, viewport.touch)); advanced('Completed finite fitting and paid road survive exact Save/menu/Continue', profile.checkpoints.at(-1).pass);
      profile.fixtures.push(await page.evaluate(prepareService150, { point: profile.protection?.point })); await openCommand(page, viewport.touch, 'field'); profile.fixtures.push(await page.evaluate(prepareCompanion150));
      await openExpansion(page, viewport.touch, 'companions', 'player');
      const trainingSelector = '#expansionAction-companions-train-samir-triage'; await observeControlPayment(page, trainingSelector); await activate(page, trainingSelector, viewport.touch);
      if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', viewport.touch);
      profile.exercise = await page.evaluate(() => ({ payment: globalThis.__CITY150_CONTROL_PAYMENT__, start: DEADWALL.elapsed, training: DEADWALL.companionsPack.snapshot().training, rule: DeadwallCore.CompanionPackRules.exercises.triage }));
      advanced('Triage starts the genuine 90-second exercise with exact depot payment', profile.exercise.training?.exercise === 'triage' && profile.exercise.training.left <= 90 && profile.exercise.payment.before.resources.food - profile.exercise.payment.after.resources.food === 36 && profile.exercise.payment.before.resources.scrap - profile.exercise.payment.after.resources.scrap === 18 && profile.exercise.payment.before.resources.medicine - profile.exercise.payment.after.resources.medicine === 4);
      await page.waitForFunction(() => DEADWALL.companionsPack.snapshot().training?.left < 89.5); await activate(page, '#pauseButton', viewport.touch);
      profile.exercise.partial = await page.evaluate(() => DEADWALL.companionsPack.snapshot());
      profile.checkpoints.push(await saveContinue150(page, viewport.touch)); advanced('Active triage remaining duration, finite payment, fitting, buildings and RNG restore exactly', profile.checkpoints.at(-1).pass);
      console.log(JSON.stringify({ profile: viewport.name, stage: 'paid-physical-systems-and-exact-restores', checks: profile.checks.length, triageRemaining: profile.exercise.partial.training.left }));
      if (['transactions', 'systems'].includes(process.env.DEADWALL_QA_SMOKE)) { profile.art = await artScene150(page, viewport.touch, rec); advanced('Development scene paints all twenty native sprites', profile.art.paintedIds.length === profile.art.ids.length && profile.art.persistentUnchanged); profile.smokeOnly = true; profile.pass = rec.errors() === 0; continue; }
      await resume(page, viewport.touch);
      await waitForExercise150(page, profile);
      profile.exercise.completed = await page.evaluate(() => ({ elapsed: DEADWALL.elapsed, state: DEADWALL.companionsPack.snapshot(), overview: DEADWALL.companionsPack.overview(), duplicate: DEADWALL.companionsPack.actions().find(a => a.id === 'train-samir-triage') }));
      advanced('Ordinary resumed RAF completes the acquired triage skill after its actual remaining work', profile.exercise.completed.elapsed - profile.exercise.start >= 89.8 && profile.exercise.completed.state.trained.includes('samir:triage'));
      advanced('The commander remains alive while the paid autonomous defence and ordinary wild-horde clock stay active', await page.evaluate(id => { const g = DEADWALL, b = g.world.buildings.get(id); return g.player.health > 0 && !g.player.dead && b?.completed && !b.dead && g.exploration125.wildNext > 0; }, profile.protection.id));
      advanced('Completed exercise refuses duplicate purchase with an explicit reason', profile.exercise.completed.duplicate.disabled && profile.exercise.completed.duplicate.reason.includes('déjà acquis'));
      await activate(page, '#pauseButton', viewport.touch);
      profile.art = await artScene150(page, viewport.touch, rec); profile.fixtures.push(profile.art.fixture);
      advanced('Twenty new physical support IDs map one-to-one to native decoded atlas sprites', profile.art.ids.length === 20 && JSON.stringify(profile.art.ids.slice().sort()) === JSON.stringify(profile.art.spriteIds.slice().sort()) && profile.art.decoded.every(i => i.width === i.expectedWidth && i.height === i.expectedHeight));
      advanced('Actual city renderer paints every one of the twenty native sprites without persistent changes', profile.art.paintedIds.length === profile.art.ids.length && profile.art.persistentUnchanged);
      profile.finalArt = await loadedAssets(page, harness.assetKeys); advanced('Final registry remains entirely decoded with no failed asset', profile.finalArt.failed.length === 0);
      profile.checkpoints.push(await saveContinue150(page, viewport.touch)); advanced('All new city objects, road, mechanism and learned exercise survive final exact Save/menu/Continue', profile.checkpoints.at(-1).pass);
      advanced('All four browser error collectors are empty', rec.errors() === 0);
      profile.pass = true;
      console.log(JSON.stringify({ profile: viewport.name, stage: 'complete', checks: profile.checks.length, nativeChecks: profile.nativeChecks.length, advancedChecks: profile.advancedChecks.length, checkpoints: profile.checkpoints.length, errors: rec.errors() }));
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.inputFailure = error.deadwallInput; profile.touchTargetFailure = error.deadwallTouchTarget;
      if (page) {
        const diagnostic = await page.evaluate(() => { const g = DEADWALL; return {
          state: g.state, paused: g.paused, overlay: g.activeOverlay?.id, elapsed: g.elapsed, age: g.tier.id, phase: g.phase,
          command: document.querySelector('#commandModal')?.className, raw: g.serialize(), persistedText: localStorage.getItem(DeadwallCore.SAVE_KEY),
          camera: { ...g.camera }, viewport: { width: g.width, height: g.height }, safeFrame: g.hud135.measure(), selectedBuild: g.selectedBuild, selectedBuilding: g.selectedBuilding?.id,
          player: { ...g.player }, training: g.companionsPack.snapshot().training,
          exploration: { wildNext: g.exploration125.wildNext, wildHordes: g.exploration125.wildHordes },
          hostiles: g.zombies.map(z => ({ id: z.id, kind: z.kind, x: z.x, y: z.y, health: z.health, dead: z.dead, attackCooldown: z.attackCooldown, distance: Math.hypot(z.x - g.player.x, z.y - g.player.y) })),
          notifications: g.notifications.map(n => ({ text: n.text, tone: n.tone }))
        }; }).catch(() => null);
        if (diagnostic) {
          const { raw, persistedText, ...state } = diagnostic; profile.failureState = state;
          const file = path.join(output, viewport.name + '-failure-raw.json');
          try { await writeFile(file, JSON.stringify({ capturedAt: new Date().toISOString(), capture: 'Actual serialize and exact persisted JSON string; no Save.validate or value normalization', ...diagnostic }, null, 2) + '\n'); profile.failureDiagnostic = file; }
          catch (writeError) { profile.failureDiagnosticWriteFailure = writeError.stack; }
        }
      }
      if (rec) await rec.screenshot('failure').catch(() => {}); throw error;
    }
    finally { await context?.close(); }
  }
  report.pass = report.profiles.length === profiles.length && report.profiles.every(p => p.pass);
} catch (error) { report.pass = false; report.failure = error.stack; throw error; }
finally { try { await harness.close(); } finally { await harness.finish(); } }
