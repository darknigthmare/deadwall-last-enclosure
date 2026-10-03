import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, campaignSnapshot, observeRestore, restoredCampaign } from './browser-qa-common142.mjs';

const harness = await createHarness('tactics', 'Chromium DOM integration of advanced 1.43 branches at desktop/mobile viewports. Each fresh seed-17117 campaign receives EXPLICIT SYNTHETIC FIXTURES: one completed redoubt, one Alpha soldier, one completed house, house objective selected and food filled to capacity. Later fixtures place one ordinary walker and destroy the added supports through the real damage controller. Orders, dossier navigation, food withdrawal, save/continue use real DOM controls; movement, combat and objective delivery use ordinary requestAnimationFrame simulation. This is a fixture-based integration test, not an organically played campaign, balancing certification or physical-device test.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.restoreComparison = { timing: 'Immediately after the complete restore chain, before its first simulation RAF',
  excludedFields: ['timestamp', 'wavePlan'], reason: 'Save timestamps refresh and a missing calm-phase wave plan is reconstructed by the base engine; all other normalized persisted fields are compared exactly.' };
const views = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, touch: true }];
const requested = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = requested ? views.filter(view => requested.includes(view.name)) : views;
assert.ok(profiles.length, 'At least one known QA profile is required');

async function activate(page, selector, touch) {
  const control = page.locator(selector);
  if (touch) await control.tap(); else await control.click();
}
async function pause(page, touch) {
  await activate(page, '#pauseButton', touch);
  await page.locator('#pauseMenu').waitFor({ state: 'visible' });
}
async function command(page, touch, tab = 'field') {
  if (!await page.locator('#pauseMenu').isVisible()) await pause(page, touch);
  await activate(page, '#pauseCommandButton', touch);
  await page.locator('#commandModal').waitFor({ state: 'visible' });
  await activate(page, '#commandTab-' + tab, touch);
}
async function territories(page, touch) {
  await activate(page, '[data-field-view="territories"]', touch);
  await page.locator('#territoryFallback').waitFor({ state: 'visible' });
}
async function resumeCommand(page, touch) {
  await activate(page, '#commandClose', touch);
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}
async function state(page, ids) {
  return page.evaluate(ids => {
    const g = DEADWALL, u = g.units.find(u => u.id === ids.soldierId), b = g.world.buildings.get(ids.redoubtId);
    return { elapsed: g.elapsed, paused: g.paused, position: { x: u.x, y: u.y }, soldierHealth: u.health,
      resources: { ...g.resources }, distance: b ? g.fieldcraft.distance(u, b) : null,
      targetId: g.getSquadSummary()[0].retreatTarget?.id, group: { ...g.squads.groups[0] },
      objectiveIndex: g.objectiveIndex, objectiveReady: g.objectiveReady, food: g.resources.food, storage: g.storage,
      carryFood: g.player.carry.food, retreatRadius: DeadwallCore.SQUAD_RULES.retreatRadius,
      soldierSpeed: u.speed, objectiveText: document.getElementById('objectiveText').textContent };
  }, ids);
}

/** Adds advanced state explicitly, without deleting resources or bypassing collisions. */
async function advancedFixture(page) {
  return page.evaluate(() => {
    const g = DEADWALL, C = DeadwallCore, Building = g.core().constructor, Unit = g.units[0].constructor;
    if (!g.paused) throw Error('Fixture injection requires the real paused command dossier');
    const probe = { radius: C.SURVIVORS.soldier.radius }, core = g.core();
    let redoubt, position, away;
    search: for (let gy = core.gy - 12; gy <= core.gy + 16; gy += 2) for (let gx = core.gx + 6; gx <= core.gx + 22; gx += 2) {
      if (!g.world.placement(C.BUILDINGS.fallbackRedoubt, gx, gy).valid) continue;
      const candidate = new Building(g.nextId, 'fallbackRedoubt', gx, gy, 0, 1);
      if ([g.player, ...g.units].some(u => candidate.contains(u.x, u.y, u.radius))) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const edge = { x: candidate.x + dx * candidate.w * 16, y: candidate.y + dy * candidate.h * 16 };
        const point = { x: edge.x + dx * 190, y: edge.y + dy * 190 };
        if (!Array.from({ length: 37 }, (_, i) => 28 + i * 8).every(d => g.friendlyPositionClear(probe, edge.x + dx * d, edge.y + dy * d))) continue;
        redoubt = candidate; position = point; away = { x: dx, y: dy }; break search;
      }
    }
    if (!redoubt) throw Error('No physically clear advanced retreat fixture position');
    g.nextId++; g.world.add(redoubt);
    const soldier = new Unit(g.nextId++, 'soldier', position.x, position.y); soldier.squad = 0; soldier.offset = { x: 0, y: 0 }; g.units.push(soldier);
    let house;
    search: for (let gy = core.gy - 10; gy <= core.gy + 16; gy += 2) for (let gx = core.gx - 12; gx <= core.gx + 20; gx += 2) {
      if (!g.world.placement(C.BUILDINGS.house, gx, gy).valid) continue;
      const b = new Building(g.nextId, 'house', gx, gy, 0, 1);
      if ([g.player, ...g.units].some(u => b.contains(u.x, u.y, u.radius))) continue;
      house = b; break search;
    }
    if (!house) throw Error('No physically valid house fixture position');
    g.nextId++; g.world.add(house); g.refreshMetrics(true);
    const beforeFood = g.resources.food;
    g.objectiveIndex = 1; g.objectiveProgress = 0; g.objectiveReady = false; g.resources.food = g.storage; g.metricsTimer = 0;
    g.updateUI();
    return { injected: true, redoubtId: redoubt.id, soldierId: soldier.id, houseId: house.id, coreId: core.id,
      redoubt: { gx: redoubt.gx, gy: redoubt.gy, progress: 1 }, soldier: { ...position, squad: 0 }, away,
      house: { gx: house.gx, gy: house.gy, progress: 1 }, foodBefore: beforeFood, foodAfter: g.resources.food,
      objectiveIndexBefore: 0, objectiveIndexAfter: 1, objectiveReady: false, metricsTimer: 0,
      notes: 'Synthetic completed supports and soldier; food filled and house objective selected. Existing actors, resources and collision systems remain active. No placement/recruitment cost is claimed to have been paid.' };
  });
}

/** Passive per-frame observation; does not replace or call simulation methods. */
async function observeMovement(page, ids) {
  await page.evaluate(ids => {
    globalThis.__DEADWALL_TACTICS_FRAMES__ = [];
    globalThis.__DEADWALL_TACTICS_OBSERVE__ = true;
    const sample = () => {
      const g = DEADWALL, u = g.units.find(u => u.id === ids.soldierId);
      if (u && globalThis.__DEADWALL_TACTICS_FRAMES__.length < 2000) globalThis.__DEADWALL_TACTICS_FRAMES__.push({ x: u.x, y: u.y, elapsed: g.elapsed, clear: g.friendlyPositionClear(u, u.x, u.y) });
      if (globalThis.__DEADWALL_TACTICS_OBSERVE__) requestAnimationFrame(sample);
    };
    sample();
  }, ids);
}

try {
  for (const viewport of profiles) {
    const profile = { viewport, fixtures: [], steps: [] }; report.profiles.push(profile);
    const step = name => { profile.steps.push(name); console.log(viewport.name + ': ' + name); };
    const context = await browser.newContext({ viewport, isMobile: !!viewport.touch, hasTouch: !!viewport.touch, deviceScaleFactor: 1 });
    const page = await context.newPage(), { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    try {
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await chooseCampaign(page);
      await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.waitForFunction(() => !DEADWALL.campaignIntro132.isOpen() && !DEADWALL.paused);
      step('fresh-campaign');
      await command(page, viewport.touch); const ids = profile.advancedFixture = await advancedFixture(page); profile.fixtures.push(ids);
      await territories(page, viewport.touch);
      await page.locator('#territoryFallback').selectOption(String(ids.redoubtId));
      const beforeOrder = await state(page, ids);
      await activate(page, '[data-retreat-squad="0"]', viewport.touch);
      const ordered = profile.ordered = await state(page, ids);
      check('Real Quartiers select and REPLI ALPHA button persist the selected redoubt', ordered.group.order === 'retreat' && ordered.group.retreatBuildingId === ids.redoubtId && ordered.targetId === ids.redoubtId);
      check('Issuing the order neither teleports nor grants resources or advances paused time', JSON.stringify(ordered.position) === JSON.stringify(beforeOrder.position) && JSON.stringify(ordered.resources) === JSON.stringify(beforeOrder.resources) && ordered.elapsed === beforeOrder.elapsed && ordered.paused);
      await activate(page, '#commandTab-workers', viewport.touch);
      check('Existing Alpha card displays its actual redoubt and withdrawal policy', (await page.locator('.squad-card[data-squad="0"] .squad-order').innerText()).includes('REDOUTE #' + ids.redoubtId) && (await page.locator('.squad-card[data-squad="0"] .squad-access').innerText()).includes('aucune poursuite'));
      await screenshot('redoubt-order');
      step('real-redoubt-order-and-section-card');
      await observeMovement(page, ids); await resumeCommand(page, viewport.touch);
      await page.waitForFunction(ids => DEADWALL.objectiveReady && DEADWALL.fieldcraft.distance(DEADWALL.units.find(u => u.id === ids.soldierId), DEADWALL.world.buildings.get(ids.redoubtId)) < 145, ids, { timeout: 15000 });
      await page.waitForFunction(() => document.getElementById('objectiveText').textContent.includes('récompense réservée'));
      profile.reservedObjectiveVisibility = await page.locator('#objectiveText').evaluate(node => {
        const r = node.getBoundingClientRect();
        return { visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && !DEADWALL.paused && !DEADWALL.activeOverlay,
          text: node.textContent, x: r.x, y: r.y, width: r.width, height: r.height };
      });
      check('Reserved reward instructions are visible in the real gameplay viewport', await page.locator('#objectiveText').isVisible() && profile.reservedObjectiveVisibility.visible);
      await screenshot('reserved-objective-live');
      await pause(page, viewport.touch);
      const moved = profile.moved = await state(page, ids);
      check('Normal RAF moves the withdrawing soldier physically toward the redoubt', moved.distance < ordered.distance - 35 && moved.distance > moved.retreatRadius);
      check('Full food storage reserves the earned house reward without advancing the objective', moved.objectiveIndex === 1 && moved.objectiveReady && moved.food <= moved.storage && moved.food > moved.storage - 1 && moved.objectiveText.includes('récompense réservée') && moved.objectiveText.includes('Place manquante'));
      step('physical-retreat-and-reserved-objective');
      profile.initialMovement = await page.evaluate(() => { globalThis.__DEADWALL_TACTICS_OBSERVE__ = false; return globalThis.__DEADWALL_TACTICS_FRAMES__; });

      // Destruction is a fixture action through the real controller, not simulated player combat.
      profile.fixtures.push(await page.evaluate(ids => { const b = DEADWALL.world.buildings.get(ids.houseId); DEADWALL.damageBuilding(b, b.health); DEADWALL.updateUI(); return { injected: true, action: 'damageBuilding destroys fixture house after objective was earned', buildingId: ids.houseId }; }, ids));
      await activate(page, '#saveButton', viewport.touch); const checkpoint = profile.checkpoint = await campaignSnapshot(page);
      check('Save contains both the live redoubt withdrawal and reserved reward after house loss', await page.evaluate(ids => { const s = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)); return s.squads.groups[0].retreatBuildingId === ids.redoubtId && s.objectiveReady && s.objectiveIndex === 1 && !s.buildings.some(b => b.id === ids.houseId); }, ids));
      await activate(page, '#quitButton', viewport.touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page);
      await observeRestore(page); await activate(page, '#continueButton', viewport.touch); await page.waitForFunction(() => DEADWALL.state === 'playing');
      check('Real continue restores every compared persisted field before RAF (excluding timestamp and reconstructed wavePlan)', await restoredCampaign(page, checkpoint));
      step('exact-reserved-reward-and-redoubt-restore');
      await command(page, viewport.touch); await territories(page, viewport.touch);
      const beforeWithdrawal = await state(page, ids);
      for (let n = 0; n < 3; n++) await activate(page, '#territoryTakeFood', viewport.touch);
      const withdrawn = profile.withdrawn = await state(page, ids);
      check('Real food withdrawal moves 36 existing rations into the player bag while paused', Math.abs(beforeWithdrawal.food - withdrawn.food - 36) < 1e-7 && Math.abs(withdrawn.carryFood - beforeWithdrawal.carryFood - 36) < 1e-7 && withdrawn.objectiveReady && withdrawn.objectiveIndex === 1);
      await resumeCommand(page, viewport.touch); await page.waitForFunction(() => DEADWALL.objectiveIndex === 2, null, { timeout: 10000 });
      await pause(page, viewport.touch); const rewarded = profile.rewarded = await state(page, ids);
      check('Ordinary simulation pays the reserved reward once despite loss of the qualifying house', !rewarded.objectiveReady && rewarded.objectiveIndex === 2 && rewarded.food <= rewarded.storage && rewarded.food > withdrawn.food + 34 && rewarded.food <= withdrawn.food + 35);
      step('real-food-withdrawal-and-automatic-reward');

      // Explicit combat fixture puts one walker on the side opposite the support.
      profile.fixtures.push(await page.evaluate(ids => {
        const g = DEADWALL, u = g.units.find(u => u.id === ids.soldierId);
        if (!g.friendlyPositionClear(u, ids.soldier.x, ids.soldier.y)) throw Error('Original soldier fixture position is no longer free');
        u.x = ids.soldier.x; u.y = ids.soldier.y; u.navigation = null;
        g.spawnZombie('walker'); const z = g.zombies.at(-1);
        z.x = u.x + ids.away.x * 100; z.y = u.y + ids.away.y * 100; z.lastX = z.x; z.lastY = z.y; u.fireCooldown = 0;
        const b = g.world.buildings.get(ids.redoubtId); b.fireCooldown = 10; g.rebuildBuckets();
        return { injected: true, action: 'soldier reset to original clear fixture position; one normal walker placed 100 units opposite redoubt; redoubt cooldown set to 10s to isolate soldier fire', enemyId: z.id, x: z.x, y: z.y, redoubtFireCooldown: 10, ammoBefore: g.resources.ammo, soldierBefore: { x: u.x, y: u.y }, distanceBefore: g.fieldcraft.distance(u, b) };
      }, ids));
      const combat = profile.fixtures.at(-1);
      await observeMovement(page, ids);
      await activate(page, '#resumeButton', viewport.touch);
      await page.waitForFunction(ammo => DEADWALL.resources.ammo < ammo, combat.ammoBefore, { timeout: 10000 });
      await pause(page, viewport.touch); const riposte = profile.riposte = await state(page, ids);
      check('Withdrawal keeps ordinary paid riposte while continuing toward the support', riposte.resources.ammo < combat.ammoBefore && riposte.distance < combat.distanceBefore && Math.hypot(riposte.position.x - combat.soldierBefore.x, riposte.position.y - combat.soldierBefore.y) > 0);
      profile.fixtures.push(await page.evaluate(({ ids, enemyId }) => {
        const g = DEADWALL, u = g.units.find(u => u.id === ids.soldierId), z = g.zombies.find(z => z.id === enemyId);
        if (!z) throw Error('Walker fixture died before distant-contact scenario');
        const candidates = [0, .2, -.2, .4, -.4].map(a => { const theta = Math.atan2(ids.away.y, ids.away.x) + a; return { x: u.x + Math.cos(theta) * 330, y: u.y + Math.sin(theta) * 330 }; });
        const point = candidates.find(p => g.friendlyPositionClear(z, p.x, p.y)); if (!point) throw Error('No free distant walker fixture position');
        z.x = point.x; z.y = point.y; z.lastX = z.x; z.lastY = z.y; g.rebuildBuckets();
        return { injected: true, action: 'same walker repositioned to 330-unit distant contact opposite support', enemyId: z.id, ...point, elapsed: g.elapsed, soldierBefore: { x: u.x, y: u.y }, distanceBefore: g.fieldcraft.distance(u, g.world.buildings.get(ids.redoubtId)) };
      }, { ids, enemyId: combat.enemyId }));
      const distant = profile.fixtures.at(-1);
      await activate(page, '#resumeButton', viewport.touch); await page.waitForFunction(elapsed => DEADWALL.elapsed > elapsed + .35, distant.elapsed, { timeout: 10000 });
      await pause(page, viewport.touch); const noChase = profile.noChase = await state(page, ids);
      const towardsEnemy = (noChase.position.x - distant.soldierBefore.x) * (distant.x - distant.soldierBefore.x) + (noChase.position.y - distant.soldierBefore.y) * (distant.y - distant.soldierBefore.y);
      check('The retreating section moves away from a distant contact instead of pursuing it', noChase.distance < distant.distanceBefore && towardsEnemy < 0);
      step('paid-riposte-without-pursuit');

      profile.fixtures.push(await page.evaluate(ids => { const g = DEADWALL, u = g.units.find(u => u.id === ids.soldierId), b = g.world.buildings.get(ids.redoubtId), position = { x: u.x, y: u.y }; g.damageBuilding(b, b.health); const s = g.serialize(); g.updateUI(); return { injected: true, action: 'damageBuilding destroys fixture redoubt; normal serialize reconciles destination', redoubtId: ids.redoubtId, soldierBefore: position, soldierAfter: { x: u.x, y: u.y }, group: s.squads.groups[0], coreDistanceBefore: g.fieldcraft.distance(u, g.core()) }; }, ids));
      const lost = profile.fixtures.at(-1);
      check('Redoubt loss safely clears the reference without teleportation', lost.group.order === 'retreat' && lost.group.retreatBuildingId === undefined && JSON.stringify(lost.soldierBefore) === JSON.stringify(lost.soldierAfter));
      await command(page, viewport.touch, 'workers');
      check('Existing Alpha card updates to centre retreat after redoubt destruction', (await page.locator('.squad-card[data-squad="0"] .squad-order').innerText()).includes('AU CENTRE') && (await state(page, ids)).targetId === ids.coreId);
      await screenshot('centre-fallback'); await resumeCommand(page, viewport.touch);
      await page.waitForFunction(({ ids, distance }) => DEADWALL.fieldcraft.distance(DEADWALL.units.find(u => u.id === ids.soldierId), DEADWALL.core()) < distance - 10, { ids, distance: lost.coreDistanceBefore }, { timeout: 15000 });
      await pause(page, viewport.touch); await page.evaluate(() => { globalThis.__DEADWALL_TACTICS_OBSERVE__ = false; });
      profile.movement = await page.evaluate(() => ({ frames: globalThis.__DEADWALL_TACTICS_FRAMES__ }));
      const frames = profile.movement.frames;
      profile.movement.maxStep = Math.max(...frames.slice(1).map((p, i) => Math.hypot(p.x - frames[i].x, p.y - frames[i].y)));
      check('Observed RAF positions stay collision-free and move at ordinary soldier speed', [profile.initialMovement, frames].every(samples => samples.length > 10 && samples.every(p => p.clear) && samples.slice(1).every((p, i) => Math.hypot(p.x - samples[i].x, p.y - samples[i].y) <= moved.soldierSpeed * Math.max(0, p.elapsed - samples[i].elapsed) + 1e-5)));
      await activate(page, '#saveButton', viewport.touch); const fallbackCheckpoint = profile.fallbackCheckpoint = await campaignSnapshot(page);
      await activate(page, '#quitButton', viewport.touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page); await observeRestore(page);
      await activate(page, '#continueButton', viewport.touch); await page.waitForFunction(() => DEADWALL.state === 'playing');
      check('Centre fallback and delivered objective restore exactly before RAF (excluding timestamp and reconstructed wavePlan)', await restoredCampaign(page, fallbackCheckpoint));
      step('physical-centre-fallback-and-exact-restore');
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack;
      profile.failureState = await page.evaluate(() => globalThis.DEADWALL ? { state: DEADWALL.state, phase: DEADWALL.phase, paused: DEADWALL.paused, elapsed: DEADWALL.elapsed, overlay: DEADWALL.activeOverlay?.id, objectiveIndex: DEADWALL.objectiveIndex, objectiveReady: DEADWALL.objectiveReady, squads: DEADWALL.squads, notifications: DEADWALL.notifications.map(n => n.text) } : null).catch(() => null);
      await screenshot('failure').catch(() => {});
    } finally { await context.close(); }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
