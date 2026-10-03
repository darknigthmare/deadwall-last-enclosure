import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel, saveReloadContinue } from './browser-qa-common144.mjs';

const harness = await createHarness('journey', 'NATIVE JOURNEY: four fresh seed-54831 G7 campaigns. Real DOM controls, keyboard and held touch input inspect biomes and atlas, walk away from and back to the core, test a real preparation refusal, recruit personnel, end the calm with confirmation, and reach the first warning and assault through ordinary RAF. A manual scroll tests tactical HUD clipping before automatic target scrolling. Save/reload/continue compares every validated field. No stocks, positions, actors, phases, timers, RNG or simulation fixtures are injected. This supplements campaign143; it does not repeat its complete harvest/deposit/construction loop or certify physical devices or balancing.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.normalizedFields = [];
const views = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'laptop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844, touch: true }, { name: 'mobile-landscape', width: 844, height: 390, touch: true }];
const chosen = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = chosen ? views.filter(view => chosen.includes(view.name)) : views;
assert.ok(profiles.length, 'At least one known journey QA profile is required');

async function state(page) {
  return page.evaluate(() => ({ state: DEADWALL.state, elapsed: DEADWALL.elapsed, phase: DEADWALL.phase, phaseTime: DEADWALL.phaseTime, paused: DEADWALL.paused,
    player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, resources: { ...DEADWALL.resources },
    position: DEADWALL.frontier.position(), seen: [...DEADWALL.frontier.overview().seen],
    live: DEADWALL.zombies.filter(z => !z.dead && z.health > 0).length, input: [...DEADWALL.input.keys],
    detail: DEADWALL.ui.waveIntel.dataset.detail || DEADWALL.ui.waveIntel.textContent, rightScroll: document.getElementById('hud135Right').scrollTop }));
}

async function scrollSituation(page, context, touch) {
  const box = await page.locator('#hud135Right').boundingBox();
  assert.ok(box && box.height > 70, 'Situation panel has a scroll gesture area');
  const metrics = () => page.locator('#hud135Right').evaluate(node => ({ scrollTop: node.scrollTop, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight,
    touchAction: getComputedStyle(node).touchAction, reading: document.getElementById('hud135Wave').dataset.reading,
    intelOpen: document.getElementById('hud135Intel').open, personnelOpen: document.getElementById('hudPersonnel14').open }));
  const gesture = { method: touch ? 'native-touch-swipe' : 'native-mouse-wheel', before: await metrics() };
  if (!touch) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height - 15);
    await page.mouse.wheel(0, 1200);
  } else {
    const session = await context.newCDPSession(page);
    // Begin on the live readout, a known pointer-receiving node. An objective
    // at the lower clipped edge is a poor gesture origin on very short panes.
    const readout = await page.locator('#waveIntel').boundingBox();
    const x = box.x + box.width / 2, start = readout.y + readout.height / 2, end = Math.max(3, box.y - 40);
    gesture.coordinates = { x, start, end };
    gesture.origin = await page.evaluate(({ x, start }) => {
      const node = document.elementFromPoint(x, start); return { id: node?.id, touchAction: node && getComputedStyle(node).touchAction };
    }, { x, start });
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
      for (let i = 1; i <= 6; i++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * i / 6 }] });
        await page.waitForTimeout(45);
      }
    } finally {
      try { await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      finally { await session.detach(); }
    }
  }
  await page.waitForTimeout(250);
  gesture.after = await metrics();
  return gesture;
}

async function checkTacticalGeometry(page, profile, check, stage) {
  const geometry = profile.geometry[stage] = {};
  const readingWarning = await page.evaluate(() => DEADWALL.phase === 'warning' && document.getElementById('hud135Wave').dataset.reading === 'true');
  for (const id of ['phaseLabel', 'waveIntel', 'hud143Prepare', 'hud143Enclosure', 'hud143Squads']) {
    if (id === 'waveIntel' && readingWarning) {
      check(stage + ': short reading rail preserves phase and actions while full warning detail stays in preparations', await page.locator('#waveIntel').evaluate(node => node.hidden));
      continue;
    }
    geometry[id] = await visibleInPanel(page, '#' + id);
    check(stage + ': ' + id + ' is within the clipped panel before any automatic target scrolling', geometry[id].pass);
    if (id.startsWith('hud143')) check(stage + ': ' + id + ' has at least 42 pixels of height', geometry[id].box.height >= 42);
  }
}

/** Wheel input positions personnel in the actual free area below the sticky rail. */
async function showPersonnelControl(page) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    const target = await page.locator('#recruitWorker').boundingBox(), panel = await page.locator('#hud135Right').boundingBox();
    const wave = await page.locator('#hud135Wave').boundingBox();
    const availableTop = Math.max(panel.y, wave.y + wave.height), wanted = (availableTop + panel.y + panel.height) / 2;
    const geometry = await visibleInPanel(page, '#recruitWorker');
    last = { ...geometry, availableTop, pass: geometry.pass && target.y >= availableTop - 1 && target.y + target.height <= panel.y + panel.height + 1 };
    if (last.pass) return last;
    await page.mouse.move(panel.x + panel.width / 2, panel.y + panel.height - 3);
    await page.mouse.wheel(0, target.y + target.height / 2 - wanted);
    await page.waitForTimeout(120);
  }
  return last;
}

try {
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const profile = { viewport, fixtures: [], geometry: {} }; report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    try {
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await chooseCampaign(page, '54831');
      profile.world = await page.evaluate(() => {
        const w = DEADWALL.frontier.world(); return { seed: w.seed, generation: w.generation, size: w.size, towns: w.towns.length, home: w.home };
      });
      check('A different native seed starts the complete G7 regional world', profile.world.seed === 54831 && profile.world.generation === 7 && profile.world.size === 24576 && profile.world.towns === 34);
      await activate(page, '#campaignIntro132Skip', viewport.touch);
      if (!await page.locator('#hud135Map').evaluate(node => node.open)) await activate(page, '#hud135Map > summary', viewport.touch);
      await activate(page, '#frontierAccess', viewport.touch);
      const atlasBefore = await state(page), initialBounds = await page.locator('#frontierMap').evaluate(node => node.atlas.bounds());
      await activate(page, '.atlas-layers > summary', viewport.touch);
      await page.locator('#atlasLayer-biomes').check();
      await activate(page, '#atlasExpand', viewport.touch);
      await page.locator('#frontierMap').focus(); await page.keyboard.press('ArrowRight');
      const pannedBounds = await page.locator('#frontierMap').evaluate(node => node.atlas.bounds());
      await page.keyboard.press('Home');
      profile.atlas = await page.locator('#frontierMap').evaluate(node => ({ bounds: node.atlas.bounds(), layers: node.atlas.layers(), expanded: !!node.closest('.atlas-expanded') }));
      check('Native atlas keys pan the viewport and restore the full regional centre', pannedBounds.left !== initialBounds.left && Math.abs((profile.atlas.bounds.left + profile.atlas.bounds.right) / 2 - 12288) < .01);
      check('Biome overlay and expanded map are real DOM controls', profile.atlas.layers.biomes && profile.atlas.expanded);
      const mapBox = await page.locator('#frontierMap').boundingBox();
      const point = { position: { x: mapBox.width / 2, y: mapBox.height / 2 } };
      if (viewport.touch) await page.locator('#frontierMap').tap(point); else await page.locator('#frontierMap').click(point);
      profile.atlas.selection = await page.locator('#frontierMap').evaluate(node => node.atlas.selected());
      check('An actual map click or tap inspects terrain and its biome without creating a visited place', profile.atlas.selection?.kind === 'terrain' && (await page.locator('#atlasInspector').innerText()).includes('sol '));
      await screenshot('native-biome-atlas');
      await activate(page, '#frontierEnter', viewport.touch);
      const atlasAfter = await state(page);
      check('Map consultation does not advance time, move the player, consume stocks or reveal places', atlasBefore.paused && atlasAfter.paused && atlasBefore.elapsed === atlasAfter.elapsed &&
        JSON.stringify(atlasBefore.player) === JSON.stringify(atlasAfter.player) && JSON.stringify(atlasBefore.resources) === JSON.stringify(atlasAfter.resources) && JSON.stringify(atlasBefore.seen) === JSON.stringify(atlasAfter.seen));
      check('Entering the region from the city centre is refused without teleportation', !atlasAfter.position.active && await page.locator('#frontierDossier').innerText().then(text => text.includes('Rejoignez un bord de D-17.')));
      await resumeCommand(page, viewport.touch);

      const start = await state(page);
      await holdInput(page, context, viewport.touch, 'd', '#touchControls [data-dir="right"]', () => page.waitForFunction(x => DEADWALL.player.x >= x + 115, start.player.x, { timeout: 10000 }));
      await page.waitForFunction(() => DEADWALL.input.keys.size === 0);
      profile.walkAway = { before: start.player, after: (await state(page)).player };
      check('Native keyboard or held touch physically walks away from the core', profile.walkAway.after.x - profile.walkAway.before.x >= 115);
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#dayworksTab', viewport.touch);
      const refusalBefore = await state(page);
      await activate(page, '#dayworksFinish', viewport.touch);
      check('Far-from-core preparation refuses with the physical approach reason', (await page.locator('#dayworksStatus').innerText()).includes('Revenez près du centre') && !await page.locator('#dayworksFinishConfirm').isVisible());
      profile.refusal = await visibleInPanel(page, '#dayworksStatus', '.command-body');
      check('The real refusal result is focused and in the visible command scroll area', profile.refusal.pass && await page.locator('#dayworksStatus').evaluate(node => document.activeElement === node));
      const refusalAfter = await state(page);
      check('Refused preparation neither charges stocks nor advances the calm', refusalBefore.elapsed === refusalAfter.elapsed && refusalBefore.phaseTime === refusalAfter.phaseTime &&
        JSON.stringify(refusalBefore.resources) === JSON.stringify(refusalAfter.resources) && refusalAfter.phase === 'calm');
      await screenshot('native-preparation-refusal'); await resumeCommand(page, viewport.touch);
      const away = await state(page);
      // The audited seed has a narrow obstacle by the eastern approach. Take
      // its real southern detour instead of assuming movement is reversible.
      profile.immediateInput = await holdInput(page, context, viewport.touch, 's', '#touchControls [data-dir="down"]', async () => {
        await page.waitForFunction(y => DEADWALL.player.y >= y + 100, away.player.y, { timeout: 10000 });
        return page.evaluate(() => ({ held: [...DEADWALL.input.keys], player: { x: DEADWALL.player.x, y: DEADWALL.player.y }, elapsed: DEADWALL.elapsed }));
      });
      check('Immediate fresh held input remains active after restored drawer toggle events', profile.immediateInput.held.includes('KeyS'));
      await holdInput(page, context, viewport.touch, 'a', '#touchControls [data-dir="left"]', () => page.waitForFunction(x => DEADWALL.player.x <= x - 90, away.player.x, { timeout: 10000 }));
      await page.waitForFunction(() => DEADWALL.input.keys.size === 0);
      profile.walkReturn = { before: away.player, after: (await state(page)).player, route: 'south >=100, west >=90 through the physically audited approach' };
      check('Fresh native held input survives immediate command return and really walks back within preparation reach', await page.evaluate(() => DEADWALL.workerCanWorkAt(DEADWALL.player, DEADWALL.core(), 180)));

      if (!await page.locator('#hud135Intel').evaluate(node => node.open)) await activate(page, '#hud135Intel > summary', viewport.touch);
      if (!await page.locator('#hudPersonnel14').evaluate(node => node.open)) await activate(page, '#hudPersonnel14 > summary', viewport.touch);
      await page.evaluate(() => {
        const control = document.getElementById('recruitWorker'); globalThis.__DEADWALL_QA_RECRUIT_144__ = {};
        control.addEventListener('click', () => { globalThis.__DEADWALL_QA_RECRUIT_144__.before = { ...DEADWALL.resources }; }, { once: true, capture: true });
        control.addEventListener('click', () => { globalThis.__DEADWALL_QA_RECRUIT_144__.after = { ...DEADWALL.resources }; }, { once: true });
      });
      const workers = await page.evaluate(() => DEADWALL.units.filter(unit => unit.kind === 'worker' && !unit.dead).length);
      await activate(page, '#recruitWorker', viewport.touch);
      profile.recruit = await page.evaluate(() => ({ payment: globalThis.__DEADWALL_QA_RECRUIT_144__, cost: DeadwallCore.SURVIVORS.worker.cost,
        workers: DEADWALL.units.filter(unit => unit.kind === 'worker' && !unit.dead).length, rightScroll: document.getElementById('hud135Right').scrollTop }));
      check('Personnel recruits one real worker and pays the catalog cost synchronously', profile.recruit.workers === workers + 1 && Object.entries(profile.recruit.cost).every(([key, amount]) =>
        Math.abs(profile.recruit.payment.before[key] - profile.recruit.payment.after[key] - amount) < 1e-6));
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#dayworksTab', viewport.touch); await activate(page, '#dayworksFinish', viewport.touch);
      check('Near-core finishing requires the actual second confirmation', await page.locator('#dayworksFinishConfirm').isVisible());
      await activate(page, '#dayworksFinishConfirm', viewport.touch);
      check('Confirmation requests the end of calm without fast-forwarding paused simulation', await page.evaluate(() => DEADWALL.phase === 'calm' && DEADWALL.phaseTime === 0 && DEADWALL.paused));
      await resumeCommand(page, viewport.touch); await page.waitForFunction(() => DEADWALL.phase === 'warning', null, { timeout: 10000 });
      await page.locator('#hud143Prepare').waitFor({ state: 'visible' });
      await checkTacticalGeometry(page, profile, check, 'warning-after-personnel');
      const gesture = await scrollSituation(page, context, viewport.touch);
      profile.manualScroll = { ...await state(page), gesture };
      check('An actual user gesture scrolls the open personnel dossier during warning', profile.manualScroll.rightScroll > 0);
      await checkTacticalGeometry(page, profile, check, 'warning-after-manual-scroll');
      profile.personnelGeometry = await showPersonnelControl(page);
      check('The real personnel button remains reachable below the tactical reading rail', profile.personnelGeometry.pass);
      const warningWorkers = await page.evaluate(() => DEADWALL.units.filter(unit => unit.kind === 'worker' && !unit.dead).length);
      await activate(page, '#recruitWorker', viewport.touch);
      check('Personnel can recruit through a real click or tap while warning remains active', await page.evaluate(before => DEADWALL.phase === 'warning' && DEADWALL.units.filter(unit => unit.kind === 'worker' && !unit.dead).length === before + 1, warningWorkers));
      await screenshot('native-warning-after-scroll');
      for (const [id, tab] of [['hud143Prepare', 'prepare'], ['hud143Enclosure', 'enclosure'], ['hud143Squads', 'workers']]) {
        await activate(page, '#' + id, viewport.touch);
        const opened = await state(page);
        check('Native ' + id + ' opens the existing paused dossier', await page.evaluate(tab => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'commandModal' &&
          (tab === 'prepare' ? !document.getElementById('coordinationPanel').classList.contains('hidden') : document.getElementById('commandTab-' + tab).getAttribute('aria-selected') === 'true'), tab));
        if (tab === 'prepare') check('Preparations heading is inside the real command body', (await visibleInPanel(page, '#coordinationHeading143', '.command-body')).pass);
        await page.waitForTimeout(200);
        check('The opened tactical dossier freezes ordinary simulation time', (await state(page)).elapsed === opened.elapsed);
        await resumeCommand(page, viewport.touch);
      }
      await page.waitForFunction(() => DEADWALL.phase === 'assault' && DEADWALL.zombies.some(z => !z.dead && z.health > 0), null, { timeout: 30000 });
      await page.waitForFunction(() => {
        const g = DEADWALL, text = g.ui.waveIntel.dataset.detail || g.ui.waveIntel.textContent;
        return text.includes(g.zombies.filter(z => !z.dead && z.health > 0).length + ' présents');
      });
      profile.assault = await state(page);
      check('The first native assault exposes present contacts and incoming arrivals', profile.assault.live > 0 && profile.assault.detail.includes('encore à venir'));
      await checkTacticalGeometry(page, profile, check, 'native-assault');
      await screenshot('native-assault');
      profile.checkpoint = await saveReloadContinue(page, viewport.touch);
      check('Native Continue preserves all validated campaign fields and the exact assault plan and budget', profile.checkpoint.pass);
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.inputFailure = error.deadwallInput; profile.failureState = await state(page).catch(() => null);
      await screenshot('failure').catch(() => {});
    } finally {
      try { await context.close(); } catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.normalizedFields = [...new Set(report.profiles.flatMap(profile => profile.checkpoint?.restoreComparison?.normalizedFields || []))];
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
