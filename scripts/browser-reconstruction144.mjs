import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign } from './browser-qa-common142.mjs';

const harness = await createHarness('reconstruction', 'Chromium DOM integration of the existing D-17 reconstruction controller at desktop/mobile viewports. EXPLICIT SYNTHETIC FIXTURES exhaust local resource nodes, remove initial units and zombies, set wood/scrap/stone stocks to 400, add and destroy one completed house, and arrange the commander at its real exterior service point. A temporary reload fixture tests confirmation revalidation. requestAnimationFrame is disabled before boot; held ACTION construction is explicitly stepped through updateInteraction(0.1). Devis, cancel, confirmation, menu, introduction and Continue use real DOM controls. No native campaign progression, organic movement, balancing, performance or physical-device certification is claimed. No phase clock is injected.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.restoreComparison = { excludedFields: ['timestamp'], timing: 'After Continue completes, with simulation RAF disabled', reason: 'Every other persisted field must restore exactly, including the day clock, stocks, construction, debris and reconstructed counter.' };
const views = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, touch: true }];
const requested = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = requested ? views.filter(view => requested.includes(view.name)) : views;

async function activate(page, selector, touch) {
  if (touch) await page.locator(selector).tap(); else await page.locator(selector).click();
}

/** Existing construction and collision methods operate on explicitly arranged advanced state. */
async function reconstructionFixture(page) {
  return page.evaluate(() => {
    const g = DEADWALL, C = DeadwallCore;
    const before = { units: g.units.length, zombies: g.zombies.length, resources: { ...g.resources }, player: { x: g.player.x, y: g.player.y } };
    let exhaustedNodes = 0;
    for (const node of g.world.nodes) { if (node.amount > 0) exhaustedNodes++; node.amount = 0; node.depleted = true; }
    g.units = []; g.zombies = [];
    g.resources.wood = g.resources.scrap = g.resources.stone = 400;
    const b = new (g.core().constructor)(g.nextId++, 'house', 74, 70, 0, 1);
    const placement = g.world.placement(C.BUILDINGS.house, b.gx, b.gy, b.rotation);
    if (!placement.valid) throw Error('The declared house fixture has no valid footprint: ' + placement.reason);
    g.world.add(b); g.refreshMetrics(true);
    const point = g.fieldcraft.service(g.player, b);
    if (!point || !g.friendlyPositionClear(g.player, point.x, point.y)) throw Error('The declared house fixture has no physically free exterior approach');
    g.player.x = point.x; g.player.y = point.y;
    g.destroyBuilding(b); g.refreshMetrics(true);
    globalThis.__DEADWALL_RECONSTRUCTION_FIXTURE__ = { id: b.id, gx: b.gx, gy: b.gy };
    g.infrastructure.open(); g.infrastructureUI.choose('rebuild');
    return { injected: true, kind: 'completed-house-destruction', before, exhaustedNodes,
      after: { units: g.units.length, zombies: g.zombies.length, resources: { ...g.resources }, player: { x: g.player.x, y: g.player.y } },
      id: b.id, type: b.type, gx: b.gx, gy: b.gy, rotation: b.rotation,
      housing: g.housing, housingGain: C.BUILDINGS.house.housing, cost: { ...C.BUILDINGS.house.cost },
      resources: { ...g.resources }, debris: g.fortificationPack.snapshot().debris,
      reconstructedBefore: g.infrastructure.snapshot().stats.reconstructed,
      notes: 'The completed house was injected without claiming its original cost or work was paid. Destruction uses destroyBuilding; finite debris is retained. Commander position and stocks are fixtures, not organically earned state.' };
  });
}

try {
  assert.ok(profiles.length, 'At least one known QA profile is required');
  for (const viewport of profiles) {
    const profile = { viewport, fixtures: [] }; report.profiles.push(profile);
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height },
      isMobile: !!viewport.touch, hasTouch: !!viewport.touch, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const page = await context.newPage(), { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    const verify = async (name, action) => {
      try { await action(); check(name); }
      catch (error) { if (!profile.checks.some(item => item.name === name)) profile.checks.push({ name, pass: false }); throw error; }
    };
    try {
      page.setDefaultTimeout(10000);
      await page.addInitScript(() => { globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {}; });
      await page.goto(base); await ready(page); await chooseCampaign(page);
      for (let n = 0; n < 4; n++) await activate(page, '#campaignIntro132Next', viewport.touch);
      await page.waitForFunction(() => !DEADWALL.activeOverlay && !DEADWALL.paused);
      const fixture = await reconstructionFixture(page); profile.fixtures.push(fixture);

      await activate(page, '#infraRebuild-' + fixture.id, viewport.touch);
      await verify('Real UI preview exposes the full cost, unfinished capacity and finite debris without mutation', async () => {
        assert.equal(await page.locator('#infraConfirmRemove').innerText(), 'CONFIRMER LE CHANTIER');
        assert.match(await page.locator('#infrastructureConfirmationText').innerText(), /Coût intégral.*débris/s);
        assert.deepEqual(await page.evaluate(() => DEADWALL.resources), fixture.resources);
        assert.equal(await page.evaluate(() => DEADWALL.housing), fixture.housing);
        assert.equal(await page.evaluate(({ gx, gy }) => DEADWALL.world.atCell(gx, gy), fixture), null);
      });
      await verify('Confirmation receives keyboard focus', async () => assert.equal(await page.evaluate(() => document.activeElement.id), 'infraConfirmRemove'));
      await screenshot('devis');

      await activate(page, '#infraKeep', viewport.touch);
      await verify('Real cancel preserves all stocks and housing', async () => {
        assert.equal(await page.locator('#infrastructureConfirmation').isVisible(), false);
        assert.deepEqual(await page.evaluate(() => DEADWALL.resources), fixture.resources);
        assert.equal(await page.evaluate(() => DEADWALL.housing), fixture.housing);
      });

      await activate(page, '#infraRebuild-' + fixture.id, viewport.touch);
      profile.fixtures.push(await page.evaluate(() => {
        const before = DEADWALL.player.reload; DEADWALL.player.reload = 1; DEADWALL.infrastructureUI.refresh(true);
        return { injected: true, kind: 'temporary-pending-reload', before, after: 1, notes: 'A synthetic reload value tests revalidation; no real reload payment or elapsed time is claimed. It is cleared before financing.' };
      }));
      await verify('An explicit pending reload blocks confirmation with a concrete reason and no debit', async () => {
        assert.equal(await page.locator('#infraConfirmRemove').isDisabled(), true);
        assert.match(await page.locator('#infrastructureConfirmationText').innerText(), /rechargement/);
        assert.deepEqual(await page.evaluate(() => DEADWALL.resources), fixture.resources);
      });
      await page.evaluate(() => { DEADWALL.player.reload = 0; DEADWALL.infrastructureUI.refresh(true); });
      await activate(page, '#infraConfirmRemove', viewport.touch);
      await verify('Real confirmation creates one ordinary paid foundation in high priority; finite original debris survives', async () => {
        const placed = profile.placed = await page.evaluate(() => {
          const g = DEADWALL, s = globalThis.__DEADWALL_RECONSTRUCTION_FIXTURE__, b = g.world.atCell(s.gx, s.gy);
          return { id: b.id, type: b.type, gx: b.gx, gy: b.gy, rotation: b.rotation, progress: b.progress,
            priority: b.priority, housing: g.housing, resources: { ...g.resources },
            debris: g.fortificationPack.snapshot().debris, stats: g.infrastructure.snapshot().stats };
        });
        assert.notEqual(placed.id, fixture.id); assert.equal(placed.type, fixture.type);
        assert.equal(placed.gx, fixture.gx); assert.equal(placed.gy, fixture.gy); assert.equal(placed.rotation, fixture.rotation);
        assert.equal(placed.progress, 0); assert.equal(placed.priority, 3); assert.equal(placed.housing, fixture.housing);
        for (const [key, amount] of Object.entries(fixture.resources)) assert.equal(placed.resources[key], amount - (fixture.cost[key] || 0));
        assert.equal(placed.stats.reconstructed, fixture.reconstructedBefore + 1); assert.deepEqual(placed.debris, fixture.debris);
      });
      await screenshot('financed-foundation');

      profile.fixtures.push(await page.evaluate(() => {
        const g = DEADWALL, s = globalThis.__DEADWALL_RECONSTRUCTION_FIXTURE__, b = g.world.atCell(s.gx, s.gy);
        g.showCommand(false); const point = g.fieldcraft.service(g.player, b);
        if (!point || !g.friendlyPositionClear(g.player, point.x, point.y)) throw Error('Foundation has no physically free work approach');
        const before = { x: g.player.x, y: g.player.y }; g.player.x = point.x; g.player.y = point.y;
        g.input.keys.add('KeyE'); let steps = 0;
        try { while (steps < 500 && !b.completed) { g.updateInteraction(.1); steps++; } }
        finally { g.input.keys.clear(); }
        return { injected: true, kind: 'controlled-action-construction', before, after: point, steps, dt: .1,
          completed: b.completed, progress: b.progress, housing: g.housing,
          notes: 'Exterior position is explicitly arranged. Ordinary held ACTION and construction methods are stepped directly; no native walking, wall-clock completion time or balancing is claimed.' };
      }));
      await verify('Physical ACTION construction restores housing only at ordinary completion', async () => {
        const built = profile.fixtures.at(-1); assert.equal(built.completed, true); assert.equal(built.progress, 1);
        assert.equal(built.housing, fixture.housing + fixture.housingGain);
      });

      const saved = profile.checkpoint = await page.evaluate(() => {
        if (!DEADWALL.save(false)) throw Error('The reconstruction checkpoint did not save');
        const data = DEADWALL.serialize(); delete data.timestamp; return data;
      });
      await page.reload(); await ready(page); await activate(page, '#continueButton', viewport.touch);
      await verify('Real reload/Continue restores every normalized persisted field except timestamp', async () => {
        const restored = await page.evaluate(() => { const data = DEADWALL.serialize(); delete data.timestamp; return data; });
        assert.deepEqual(restored, saved);
      });
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack;
      await screenshot('failure').catch(() => {});
    } finally {
      try { await context.close(); }
      catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; throw error; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length,
      errors: profile.pageErrors.length + profile.consoleErrors.length + profile.httpErrors.length + profile.requestFailures.length,
      failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.pass = profiles.length > 0 && report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
