import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, resumeCommand, holdInput, saveReloadContinue } from './browser-qa-common144.mjs';

const harness = await createHarness('terrain', 'NATIVE TERRAIN JOURNEY: four fresh seed-903145 campaigns. Native keyboard or held touch input leaves D-17, walks outside, and physically returns. Real map, bag, equipment, survival, posture and terrain controls are exercised; ACTION/FEU geometry and pointer targeting are checked. Geometry is measured before automatic scrolling, separately at departure and after the temporary warning ends. Save/reload/Continue compares every validated persistent field. No stock, position, phase, timer, actor, RNG or simulation fixture is injected. This short regression does not repeat the longer native mine/basement audit or certify physical devices, balancing or a complete campaign.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.normalizedFields = [];
const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true },
  { name: 'mobile-landscape', width: 844, height: 390, touch: true }, { name: 'small-landscape', width: 780, height: 360, touch: true }];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = selected ? views.filter(view => selected.includes(view.name)) : views;

async function geometry(page) {
  return page.evaluate(() => {
    const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
    const ids = ['fieldDockMap', 'fieldDockBag', 'fieldDockGear', 'fieldDockVehicle', 'fieldDockPosture'];
    const compact = DEADWALL.isCompactViewport();
    if (compact) ids.push('fieldDockTerrainToggle', 'hud135ToolsToggle');
    if (matchMedia('(pointer:coarse)').matches) ids.push('touchAction', 'touchFire');
    const controls = ids.map(id => {
      const node = document.getElementById(id), r = box(node), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { id, ...r, visible: node.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }), receivesPointer: hit === node || node.contains(hit), disabled: !!node.disabled };
    });
    return { width: innerWidth, height: innerHeight, compact, center: box(document.getElementById('hud135Center')), safe: DEADWALL.hud135.safeFrame(),
      dockParent: document.getElementById('fieldDock').parentElement.id, departureVisible: DEADWALL.departure130.status().visible,
      playerReceivesCanvas: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.id === 'game',
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1, controls };
  });
}

function checkGeometry(check, measured, stage) {
  check(stage + ': regional player center receives the canvas pointer', measured.playerReceivesCanvas);
  check(stage + ': no horizontal document overflow', !measured.horizontalOverflow);
  for (const c of measured.controls) check(stage + ': ' + c.id + ' is visible, within the viewport, and receives pointer input',
    c.visible && c.receivesPointer && c.x >= -1 && c.y >= -1 && c.right <= measured.width + 1 && c.bottom <= measured.height + 1 && c.height >= (measured.compact ? 44 : 40));
  if (!measured.departureVisible && measured.compact) {
    check(stage + ': compact regional center preserves at least 130 px of terrain', measured.center.height >= 130);
    check(stage + ': safe frame has real usable area (short 360 px screen retains 100 px)', measured.safe.bottom - measured.safe.top >= 100);
    check(stage + ': regional dock uses the existing footer shelf', measured.dockParent === 'hud135Auxiliary');
  }
}

async function closeRunning(page, touch) {
  await resumeCommand(page, touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}

try {
  assert.ok(profiles.length, 'At least one known terrain QA profile is required');
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const profile = { viewport, seed: 903145, fixtures: [], geometry: {} };
    report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    console.log('Terrain profile: ' + viewport.name);
    try {
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page);
      await chooseCampaign(page, '903145'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      check('Fresh campaign uses requested seed and G7', await page.evaluate(() => DEADWALL.world.seed === 903145 && DEADWALL.frontier.position().generation === 7));
      // This seed's eastbound road is clear. An ordinary held movement crosses
      // the seam; no API call or coordinate assignment transports the player.
      await holdInput(page, context, viewport.touch, 'd', '#touchControls [data-dir="right"]', () =>
        page.waitForFunction(() => DEADWALL.frontier.active(), null, { timeout: 180000 }));
      check('Physical eastbound walk enters the region', await page.evaluate(() => DEADWALL.frontier.active() && DEADWALL.player.regionAbsent && DEADWALL.frontier.position().inside === null));
      profile.geometry.departure = await geometry(page);
      checkGeometry(check, profile.geometry.departure, 'Departure');
      await screenshot('region-departure');
      const origin = await page.evaluate(() => DEADWALL.frontier.position());
      profile.regionalOrigin = origin;
      await holdInput(page, context, viewport.touch, 'd', '#touchControls [data-dir="right"]', () =>
        page.waitForFunction(x => DEADWALL.frontier.position().x >= x + 18, origin.x, { timeout: 90000 }));
      check('Native outside movement covers at least 18 m', await page.evaluate(x => DEADWALL.frontier.position().x >= x + 18, origin.x));

      await activate(page, '#fieldDockMap', viewport.touch);
      check('Real CARTE opens the regional dossier in paused command', await page.evaluate(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'commandModal' && !document.getElementById('reconPanel').classList.contains('hidden')));
      check('Atlas view contains the physical regional player', await page.evaluate(() => { const p = DEADWALL.frontier.position(), b = DEADWALL.frontierUI.atlas.bounds(); return p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom; }));
      await screenshot('atlas'); await closeRunning(page, viewport.touch);
      await activate(page, '#fieldDockBag', viewport.touch);
      check('Real SAC opens bag and supply controls', await page.locator('#fieldSupplyPanel').evaluate(n => n.open && n.checkVisibility()));
      await closeRunning(page, viewport.touch);
      await activate(page, '#fieldDockGear', viewport.touch);
      check('Real MATÉRIEL opens essential-services inventory', await page.locator('#essentialPanel').evaluate(n => n.open && n.checkVisibility()));
      await closeRunning(page, viewport.touch);

      const oldPosture = await page.evaluate(() => DEADWALL.worldEvolution.posture().key);
      await activate(page, '#fieldDockPosture', viewport.touch);
      check('Real POSTURE changes the physical movement posture', await page.evaluate(old => DEADWALL.worldEvolution.posture().key !== old, oldPosture));
      for (let i = 0; i < 3 && await page.evaluate(() => DEADWALL.worldEvolution.posture().key !== 'stand'); i++) await activate(page, '#fieldDockPosture', viewport.touch);
      check('Posture cycle returns to standing', await page.evaluate(() => DEADWALL.worldEvolution.posture().key === 'stand'));

      if (viewport.touch) {
        await activate(page, '#fieldDockTerrainToggle', true);
        check('Terrain disclosure retains the complete GPS and interaction message', await page.evaluate(() => document.getElementById('fieldDockTerrain').open && document.getElementById('fieldDockTerrain').contains(document.getElementById('fieldDockGps')) && document.getElementById('fieldDockTerrain').contains(document.getElementById('interactionHint'))));
        await screenshot('terrain-open'); await activate(page, '#fieldDockTerrainToggle', true);
        await activate(page, '#hud135ToolsToggle', true);
      } else {
        if (!await page.locator('#hud135Tools').evaluate(n => n.open)) await activate(page, '#hud135ToolsToggle');
      }
      await activate(page, '#fieldOperations', viewport.touch);
      await activate(page, '#expansionGroup-player', viewport.touch); await activate(page, '#expansionTab-survival', viewport.touch);
      check('The preserved equipment shelf reaches the real SURVIE dossier', await page.locator('#expansionDetail').evaluate(n => n.getAttribute('aria-labelledby') === 'expansionTab-survival' && n.checkVisibility()));
      await screenshot('survival'); await activate(page, '#expansionResume', viewport.touch);
      await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
      if (await page.locator('#hud135Tools').evaluate(n => n.open)) await activate(page, '#hud135ToolsToggle', viewport.touch);
      const afterModal = await page.evaluate(() => DEADWALL.frontier.position().x);
      await holdInput(page, context, viewport.touch, 'd', '#touchControls [data-dir="right"]', () =>
        page.waitForFunction(x => DEADWALL.frontier.position().x >= x + .8, afterModal, { timeout: 15000 }));
      check('Fresh held input immediately after modal closure advances physically', await page.evaluate(x => DEADWALL.frontier.position().x >= x + .8, afterModal));
      await page.waitForFunction(() => !DEADWALL.departure130.status().visible, null, { timeout: 120000 });
      // The notice expires in simulation time; its CSS removal and the HUD's
      // ResizeObserver measurement follow on the normal render/update cycle.
      // Wait for that actual measured area, without writing or invoking measure.
      await page.waitForFunction(() => !document.getElementById('departureWarning130').checkVisibility() &&
        (!DEADWALL.isCompactViewport() || DEADWALL.hud135.safeFrame().bottom - DEADWALL.hud135.safeFrame().top >= 100), null, { timeout: 15000 });
      profile.geometry.permanent = await geometry(page);
      checkGeometry(check, profile.geometry.permanent, 'After departure notice');
      await screenshot('region-permanent');

      const checkpoint = await saveReloadContinue(page, viewport.touch);
      profile.regionalContinue = { pass: checkpoint.pass, comparison: checkpoint.restoreComparison };
      check('Regional save/reload/Continue preserves every validated persistent field', checkpoint.pass);
      check('Continue preserves the physical region and empty carried inventory', await page.evaluate(() => DEADWALL.frontier.active() && DEADWALL.frontier.position().z === 0 && Object.values(DEADWALL.player.carry).every(n => n === 0)));
      // The regional east road returns across the same physical boundary.
      await holdInput(page, context, viewport.touch, 'a', '#touchControls [data-dir="left"]', () =>
        page.waitForFunction(() => !DEADWALL.frontier.active(), null, { timeout: 90000 }));
      check('Native westbound movement physically returns to D-17', await page.evaluate(() => !DEADWALL.frontier.active() && !DEADWALL.player.regionAbsent && DEADWALL.player.x > 4000));
      check('Local HUD regains the original dock/prompt ownership after return', await page.evaluate(() => document.getElementById('fieldDock').parentElement.id === 'hud135Context' && document.getElementById('fieldDock').classList.contains('hidden') && document.getElementById('interactionHint').parentElement.id === 'hud135Context')); 
      await screenshot('returned-d17');
      const returned = await saveReloadContinue(page, viewport.touch);
      profile.localContinue = { pass: returned.pass, comparison: returned.restoreComparison };
      check('Return save/reload/Continue preserves every validated persistent field', returned.pass);
      check('Continued local HUD remains in D-17', await page.evaluate(() => !DEADWALL.frontier.active() && !DEADWALL.player.regionAbsent));
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.inputAtFailure = error.deadwallInput;
      try { await screenshot('failure'); } catch {}
      console.error(viewport.name + ': ' + error.message);
    } finally {
      try { await context.close(); }
      catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; throw error; }
    }
  }
  report.pass = report.profiles.length > 0 && report.profiles.every(profile => profile.pass);
  console.log('Terrain: ' + report.profiles.reduce((sum, p) => sum + p.checks.filter(c => c.pass).length, 0) + ' successful checks');
  if (!report.pass) process.exitCode = 1;
} catch (error) {
  report.pass = false; report.failure = error.stack; process.exitCode = 1;
} finally {
  report.normalizedFields = [...new Set(report.profiles.flatMap(profile => [profile.regionalContinue, profile.localContinue]
    .flatMap(checkpoint => checkpoint?.comparison?.normalizedFields || [])))];
  try { await harness.close(); } finally { await harness.finish(); }
}
