import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, campaignSnapshot, observeRestore } from './browser-qa-common142.mjs';
import { visibleInPanel, persistentRestoreComparison } from './browser-qa-common144.mjs';

const harness = await createHarness('campaign', 'Four fresh Chromium campaigns, seed 17117. Native keyboard or touch input performs personal harvest/deposit, paid placement, manual construction, worker construction, recruitment, gate/squad orders and a natural warning/assault reached through the real finish-day control. No stock, position, actor, timer or simulation fixtures are injected. This is automated input at desktop/mobile viewports, not physical-device or campaign balancing certification.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.normalizedFields = [];
const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844, touch: true },
  { name: 'mobile-landscape', width: 844, height: 390, touch: true }
];
const chosenViews = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = chosenViews ? views.filter(view => chosenViews.includes(view.name)) : views;
assert.ok(profiles.length, 'At least one known QA profile is required');

async function activate(page, selector, touch) {
  const control = page.locator(selector);
  if (touch) await control.tap();
  else await control.click();
}

async function openCommand(page, touch, tab) {
  await activate(page, '#pauseButton', touch);
  await page.locator('#pauseMenu').waitFor({ state: 'visible' });
  await activate(page, '#pauseCommandButton', touch);
  await page.locator('#commandModal').waitFor({ state: 'visible' });
  if (tab) await activate(page, '#commandTab-' + tab, touch);
}

async function closeCommand(page, touch) {
  const closeAccess = await page.locator('#commandClose').evaluate(node => {
    const r = node.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && !!hit?.closest('#commandClose');
  });
  assert.ok(closeAccess, 'Command close is in the viewport and its center receives actual pointer input');
  await activate(page, '#commandClose', touch);
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}

/** Read the 1.45 growth dossier around the same natively paid and built house. */
async function inspectGrowth(page, touch, check, screenshot, completed) {
  await openCommand(page, touch, 'field');
  const before = await page.evaluate(() => { const { timestamp, ...saved } = DEADWALL.serialize(); return JSON.stringify(saved); });
  await activate(page, '#coordinationTab', touch);
  await page.locator('#urbanRemaining').scrollIntoViewIfNeeded();
  const geometry = await visibleInPanel(page, '#urbanRemaining', '.command-body');
  check('Growth: actual remaining-points readout is inside the command scroll area', geometry.pass);
  const growth = await page.evaluate(() => ({ model: DEADWALL.urban.planning(), remaining: document.getElementById('urbanRemaining').textContent,
    potential: document.getElementById('urbanPotential').textContent, models: [...document.querySelectorAll('#urbanNextModels [data-model]')].map(n => n.dataset.model),
    source: JSON.stringify((({ timestamp, ...saved }) => saved)(DEADWALL.serialize())) }));
  check('Growth: consultation does not change the paused saved campaign', growth.source === before);
  delete growth.source;
  check('Growth: points to the next new age use surviving completed structures', growth.model.remaining === growth.model.next.requiredScore - growth.model.currentScore && growth.remaining.includes(growth.model.remaining.toFixed(1)));
  check('Growth: upcoming models are from the actual next age', growth.models.length > 0 && growth.models.every(id => growth.model.nextModels.some(d => d.id === id)));
  if (!completed) {
    check('Growth: financed house remains unfinished while its score is only conditional', growth.model.age.id === 0 && growth.model.pending.length === 1 && growth.model.pending[0].name === 'Dortoir renforcé' && growth.model.pendingScore === 4 && growth.potential.includes('à leur achèvement'));
    check('Growth: the paid foundation covers the next threshold without awarding it', growth.model.potentialAge.id === 1 && growth.model.remainingAfterPending === 0 && growth.model.currentScore === 8);
  } else {
    check('Growth: physical completion reaches the age and removes the pending foundation', growth.model.age.id === 1 && growth.model.currentScore === 12 && growth.model.pending.length === 0);
    check('Growth: completed house satisfies the next housing model prerequisite', growth.model.nextModels.find(d => d.id === 'rowHomes')?.requirementMet === true);
  }
  await screenshot(completed ? 'growth-built' : 'growth-paid-foundation');
  await closeCommand(page, touch);
  return { ...growth, geometry };
}

async function withHold(page, context, touch, code, selector, action) {
  let session;
  if (touch) {
    const box = await page.locator(selector).boundingBox();
    assert.ok(box, 'Held touch control has a visible box');
    session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  } else {
    await page.locator('#game').focus();
    await page.keyboard.down(code);
  }
  try { return await action(); }
  finally {
    if (session) {
      try { await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      finally { await session.detach(); }
    } else await page.keyboard.up(code);
  }
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
  await withHold(page, context, touch, 'e', '#touchAction', () => page.waitForFunction(id => DEADWALL.world.buildings.get(id)?.completed, id, { timeout: 20000 }));
  await page.waitForFunction(() => !DEADWALL.input.keys.has('KeyE'));
  return route;
}

async function restoredAssault(page, checkpoint) {
  // The calm 142 recorder omits an optionally regenerated plan. The separately
  // observed assault plan is still compared exactly alongside every saved field.
  const comparison = await page.evaluate(persistentRestoreComparison, {
    material: JSON.stringify({ ...JSON.parse(checkpoint.material), wavePlan: checkpoint.wavePlan }), cp: checkpoint,
    observationKey: '__DEADWALL_QA_RESTORED__', wavePlanObservationKey: '__DEADWALL_QA_RESTORED_WAVE_PLAN__'
  });
  checkpoint.restoreComparison = comparison;
  return comparison.pass;
}

try {
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const profile = { viewport, fixtures: [], steps: [] };
    report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    const step = name => { profile.steps.push({ name, at: new Date().toISOString() }); console.log(JSON.stringify({ viewport: viewport.name, step: name })); };
    try {
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await chooseCampaign(page);
      await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
      check('Fresh campaign starts with the real G7 prologue', await page.evaluate(() => DEADWALL.frontier.snapshot().generation === 7 && DEADWALL.chronicles131.snapshot().prologue.status === 'active'));
      await screenshot('start');
      await openCommand(page, viewport.touch, 'workers');
      await activate(page, '[data-worker-order="retreat"]', viewport.touch);
      check('Real worker retreat command prevents automatic harvest during the personal loop', await page.evaluate(() => DEADWALL.workerOrder === 'retreat'));
      await closeCommand(page, viewport.touch);

      profile.harvestRoute = await navigate(page, context, viewport.touch, { kind: 'node', type: 'scrap', amount: 24, range: 62 });
      const beforeHarvest = await readEconomy(page);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(() => DEADWALL.player.carry.scrap >= 16, null, { timeout: 10000 }));
      const afterHarvest = await readEconomy(page);
      profile.harvest = { before: beforeHarvest, after: afterHarvest };
      check('Personal E/ACTION hold transfers finite scrap into the bag', afterHarvest.carry.scrap >= 16 && afterHarvest.gathered > beforeHarvest.gathered && afterHarvest.resources.scrap === beforeHarvest.resources.scrap);
      await page.waitForFunction(() => DEADWALL.chronicles131.snapshot().prologue.stage >= 1);
      check('Real harvest advances the saved first-gestures objective'); step('personal-harvest');
      await screenshot('harvest');

      const coreId = await page.evaluate(() => DEADWALL.core().id);
      profile.depositRoute = await navigate(page, context, viewport.touch, { kind: 'building', id: coreId, range: 100 });
      const beforeDeposit = await readEconomy(page);
      await withHold(page, context, viewport.touch, 'e', '#touchAction', () => page.waitForFunction(() => DEADWALL.player.carry.scrap < .01, null, { timeout: 10000 }));
      const afterDeposit = await readEconomy(page);
      profile.deposit = { before: beforeDeposit, after: afterDeposit };
      check('Personal deposit conserves scrap and counts only accepted materials', Math.abs(afterDeposit.resources.scrap - beforeDeposit.resources.scrap - beforeDeposit.carry.scrap) < 1e-6 &&
        Math.abs(afterDeposit.deposited - beforeDeposit.deposited - beforeDeposit.carry.scrap) < 1e-6);
      await page.waitForFunction(() => DEADWALL.chronicles131.snapshot().prologue.stage >= 2);
      check('Accepted personal deposit advances the saved prologue'); step('personal-deposit');

      profile.house = await placeBuilding(page, viewport.touch, 'house', 'colony');
      check('Real catalogue and ground input finance a new unfinished house');
      profile.growthPaid = await inspectGrowth(page, viewport.touch, check, screenshot, false);
      profile.house.workRoute = await workManually(page, context, viewport.touch, profile.house.id);
      check('Personal E/ACTION builds the house without free completion', await page.evaluate(id => DEADWALL.world.buildings.get(id).completed && DEADWALL.workerOrder === 'retreat', profile.house.id));
      await page.waitForFunction(() => DEADWALL.chronicles131.snapshot().prologue.status === 'done');
      check('Harvest, deposit and actual construction complete all three saved first gestures'); step('manual-house-complete');
      profile.growthBuilt = await inspectGrowth(page, viewport.touch, check, screenshot, true);
      await screenshot('house');

      profile.gate = await placeBuilding(page, viewport.touch, 'gate', 'defense');
      profile.gate.workRoute = await workManually(page, context, viewport.touch, profile.gate.id);
      check('A separately paid defensive gate is built manually');
      profile.barracks = await placeBuilding(page, viewport.touch, 'barracks', 'colony');
      await openCommand(page, viewport.touch, 'workers');
      await activate(page, '[data-worker-order="build"]', viewport.touch);
      check('Real construction order assigns existing workers', await page.evaluate(() => DEADWALL.workerOrder === 'build'));
      await closeCommand(page, viewport.touch);
      const automationStart = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), profile.barracks.id);
      await page.waitForFunction(id => DEADWALL.units.some(unit => unit.kind === 'worker' && unit.state === 'build' && unit.targetBuilding === id &&
        DEADWALL.workerCanWorkAt(unit, DEADWALL.world.buildings.get(id), 62)), profile.barracks.id, { timeout: 20000 });
      check('Actual workers physically reach and work at the paid barracks');
      await page.waitForFunction(id => DEADWALL.world.buildings.get(id).completed, profile.barracks.id, { timeout: 60000 });
      profile.barracks.automation = await page.evaluate(id => ({ elapsed: DEADWALL.elapsed, progress: DEADWALL.world.buildings.get(id).progress }), profile.barracks.id);
      check('Workers complete the worksite faster than passive construction could', profile.barracks.automation.elapsed - automationStart.elapsed < (1 - automationStart.progress) * profile.barracks.buildTime / .075);
      step('worker-barracks-complete');

      if (!await page.locator('#hud135Intel').evaluate(node => node.open)) await activate(page, '#hud135Intel > summary', viewport.touch);
      if (!await page.locator('#hudPersonnel14').evaluate(node => node.open)) await activate(page, '#hudPersonnel14 > summary', viewport.touch);
      await page.evaluate(() => {
        const button = document.getElementById('recruitSoldier');
        button.addEventListener('click', () => { globalThis.__DEADWALL_QA_RECRUIT_PAYMENT__ = { before: { ...DEADWALL.resources } }; }, { capture: true, once: true });
        button.addEventListener('click', () => { globalThis.__DEADWALL_QA_RECRUIT_PAYMENT__.after = { ...DEADWALL.resources }; }, { once: true });
      });
      const beforeRecruit = await readEconomy(page);
      await activate(page, '#recruitSoldier', viewport.touch);
      await page.waitForFunction(() => DEADWALL.units.some(unit => unit.kind === 'soldier' && !unit.dead));
      const afterRecruit = await readEconomy(page);
      const payment = await page.evaluate(() => globalThis.__DEADWALL_QA_RECRUIT_PAYMENT__);
      profile.recruit = { before: beforeRecruit, after: afterRecruit, payment };
      const recruitCost = await page.evaluate(() => DeadwallCore.SURVIVORS.soldier.cost);
      check('Recruit button pays real scrap, ammunition and rations', Object.entries(recruitCost).every(([key, amount]) => Math.abs(payment.before[key] - payment.after[key] - amount) < 1e-6));

      await openCommand(page, viewport.touch, 'enclosure');
      const tacticalClock = await page.evaluate(() => DEADWALL.elapsed);
      if (!await page.locator('#commandDefense129').evaluate(node => node.open)) await activate(page, '#commandDefense129 > summary', viewport.touch);
      await page.locator('#commandGate').selectOption(String(profile.gate.id));
      for (const mode of ['closed', 'open', 'auto']) {
        const before = await page.evaluate(({ id, mode }) => {
          const gate = DEADWALL.world.buildings.get(id);
          return { mode: gate.gateMode, allowed: DeadwallTactics.gateChangeAllowed(gate, mode, [DEADWALL.player, ...DEADWALL.units, ...DEADWALL.zombies]) };
        }, { id: profile.gate.id, mode });
        await activate(page, '#gateMode-' + mode, viewport.touch);
        const actual = await page.evaluate(id => DEADWALL.world.buildings.get(id).gateMode, profile.gate.id);
        (profile.gate.modeChanges ||= []).push({ requested: mode, previous: before.mode, allowed: before.allowed, actual });
        check(before.allowed ? 'Real gate control applies ' + mode + ' mode' : 'Occupied gate correctly refuses ' + mode + ' mode', actual === (before.allowed ? mode : before.mode));
      }
      await activate(page, '#commandTab-workers', viewport.touch);
      await activate(page, '[data-squad-select="0"]', viewport.touch);
      await activate(page, '[data-squad-action="here"][data-squad-index="0"]', viewport.touch);
      check('Real section rally command records the player position', await page.evaluate(() => DEADWALL.squads.groups[0].order === 'rally' && DEADWALL.squads.groups[0].rally.x === DEADWALL.player.x && DEADWALL.squads.groups[0].rally.y === DEADWALL.player.y));
      await activate(page, '[data-squad-action="retreat"][data-squad-index="0"]', viewport.touch);
      check('Real section retreat command changes the recruited soldier section', await page.evaluate(() => DEADWALL.units.some(unit => unit.kind === 'soldier' && unit.squad === 0) && DEADWALL.squads.groups[0].order === 'retreat'));
      await activate(page, '[data-worker-order="retreat"]', viewport.touch);
      check('Tactical commands preserve the paused simulation clock', await page.evaluate(before => DEADWALL.elapsed === before && DEADWALL.paused, tacticalClock));
      await closeCommand(page, viewport.touch); step('gate-worker-squad-orders');

      await navigate(page, context, viewport.touch, { kind: 'building', id: coreId, range: 100 });
      await openCommand(page, viewport.touch, 'field');
      await activate(page, '#dayworksTab', viewport.touch);
      await activate(page, '#dayworksFinish', viewport.touch);
      check('Ending preparation asks for the real second confirmation', await page.locator('#dayworksFinishConfirm').isVisible());
      await activate(page, '#dayworksFinishConfirm', viewport.touch);
      check('Finish-day action ends preparation without completing work or advancing simulation', await page.evaluate(() => DEADWALL.phase === 'calm' && DEADWALL.phaseTime === 0 && DEADWALL.paused));
      await closeCommand(page, viewport.touch);
      await page.waitForFunction(() => DEADWALL.phase === 'warning', null, { timeout: 10000 });
      await page.locator('#waveIntel').waitFor({ state: 'visible' });
      check('Normal simulation transitions to the first real warning');
      check('Warning intelligence is visible without opening Situation', await page.locator('#waveIntel').isVisible() && await page.evaluate(() => document.getElementById('waveIntel').parentNode.id === 'hud135Wave'));
      await screenshot('warning');
      for (const [control, destination] of [['hud143Prepare', 'prepare'], ['hud143Enclosure', 'enclosure'], ['hud143Squads', 'workers']]) {
        await activate(page, '#' + control, viewport.touch);
        const before = await page.evaluate(() => DEADWALL.elapsed);
        check('Warning shortcut opens the real ' + destination + ' dossier', await page.evaluate(destination => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'commandModal' &&
          (destination === 'prepare' ? !document.getElementById('coordinationPanel').classList.contains('hidden') : document.getElementById('commandTab-' + destination).getAttribute('aria-selected') === 'true'), destination));
        if (destination === 'prepare') {
          check('Preparation heading is visible in the real viewport', await page.evaluate(() => {
            const r = document.getElementById('coordinationHeading143').getBoundingClientRect();
            return r.width > 0 && r.height > 0 && r.y >= 0 && r.bottom <= innerHeight;
          }));
        }
        check('Warning dossier keeps the simulation clock frozen', await page.evaluate(before => DEADWALL.elapsed === before, before));
        await activate(page, '#commandReturn129', viewport.touch);
        check('Returning from warning dossier resumes real play', await page.evaluate(before => DEADWALL.elapsed >= before && !DEADWALL.paused && !DEADWALL.activeOverlay, before));
      }
      await page.waitForFunction(() => DEADWALL.phase === 'assault' && DEADWALL.zombies.some(zombie => !zombie.dead), null, { timeout: 30000 });
      const firstContact = await page.evaluate(() => { const z = DEADWALL.zombies.find(z => !z.dead); return { id: z.id, x: z.x, y: z.y }; });
      await page.waitForFunction(contact => { const z = DEADWALL.zombies.find(z => z.id === contact.id); return z && Math.hypot(z.x - contact.x, z.y - contact.y) > 5; }, firstContact, { timeout: 15000 });
      profile.assault = await page.evaluate(() => ({ phase: DEADWALL.phase, wave: DEADWALL.wave, active: DEADWALL.zombies.filter(z => !z.dead).length, pending: { ...DEADWALL.pendingSpawns }, wavePlan: DEADWALL.wavePlan, coreHealth: DEADWALL.core().health }));
      check('Real first-wave contacts spawn and physically move toward the colony', profile.assault.phase === 'assault' && profile.assault.active > 0 && profile.assault.coreHealth > 0);
      await screenshot('assault'); step('natural-first-assault');

      await activate(page, '#pauseButton', viewport.touch); await activate(page, '#saveButton', viewport.touch);
      const checkpoint = profile.checkpoint = await campaignSnapshot(page);
      checkpoint.wavePlan = await page.evaluate(() => DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).wavePlan);
      assert.ok(checkpoint.wavePlan, 'An assault has a persisted wave plan');
      await activate(page, '#quitButton', viewport.touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page);
      await observeRestore(page);
      await page.evaluate(() => {
        const game = DEADWALL, restore = game.restoreSave.bind(game);
        globalThis.__DEADWALL_QA_RESTORED_WAVE_PLAN__ = null;
        game.restoreSave = (...args) => {
          const result = restore(...args);
          globalThis.__DEADWALL_QA_RESTORED_WAVE_PLAN__ = DeadwallSave.validate(game.serialize()).wavePlan;
          return result;
        };
      });
      await activate(page, '#continueButton', viewport.touch);
      await page.waitForFunction(() => DEADWALL.state === 'playing');
      check('Campaign restores every persisted field and exact pending enemy counts after construction and assault', await restoredAssault(page, checkpoint));
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack;
      profile.failureState = await page.evaluate(() => globalThis.DEADWALL ? { state: DEADWALL.state, phase: DEADWALL.phase, elapsed: DEADWALL.elapsed, paused: DEADWALL.paused,
        overlay: DEADWALL.activeOverlay?.id, player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, input: [...DEADWALL.input.keys], interaction: DEADWALL.interactionText, notifications: DEADWALL.notifications.map(n => n.text) } : null).catch(() => null);
      await screenshot('failure').catch(() => {});
    } finally {
      try { await context.close(); }
      catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.normalizedFields = [...new Set(report.profiles.flatMap(profile => profile.checkpoint?.restoreComparison?.normalizedFields || []))];
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); }
  finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
