import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, visibleInPanel, saveReloadContinue } from './browser-qa-common144.mjs';
import { maximumObservedAssaultFixture } from './browser-assault-fixtures147.mjs';

const harness = await createHarness('assault', 'EXPLICIT SYNTHETIC FIXTURE: a fresh seed-54831 G7 campaign is put at warning wave 8 with 24 contacts, three of each of the eight profiles, and four announced directions. First, real unobserved north contacts must reveal no occupied direction. A declared maximum-layout fixture then repositions five existing contacts, adds four legally placed operational observation posts, zeroes common ammo to prevent defence fire, and updates urban history for those posts. The player position, contact health and arrival budget remain intact; actual visibility146 and LOS determine observed contacts. Real DOM controls and ordinary RAF perform spawning, six-second echelon delays, pause, preparations and save/reload/continue. Modern bounded buffers preserve every validated field and draw order exactly; oversized historical buffers alone may use their declared migration. This is integration/layout evidence, not organically reached wave 8, balancing or physical-device certification.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.normalizedFields = [];
const views = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, touch: true }, { name: 'mobile-landscape', width: 844, height: 390, touch: true }];
const chosen = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = chosen ? views.filter(view => chosen.includes(view.name)) : views;

async function snapshot(page) {
  return page.evaluate(() => {
    const g = DEADWALL, n = g.dayworks.snapshot().night;
    const live = g.zombies.filter(z => !z.dead && z.health > 0), counts = Object.fromEntries(['north', 'east', 'south', 'west'].map(id => [id, 0]));
    for (const z of live) {
      const dx = z.x - g.core().x, dy = z.y - g.core().y;
      counts[Math.abs(dx) > Math.abs(dy) ? dx >= 0 ? 'east' : 'west' : dy >= 0 ? 'south' : 'north']++;
    }
    const observed = g.battlefieldUI.snapshot();
    return { elapsed: g.elapsed, phase: g.phase, paused: g.paused, wave: g.wave, incoming: g.spawnQueue.length + Object.values(g.pendingSpawns).reduce((a, b) => a + b, 0),
      present: live.length, fronts: counts, night: n, spawnTimer: g.spawnTimer, remaining: g.remainingAssault, pending: { ...g.pendingSpawns },
      observed: observed.observedContacts, observedFronts: Object.fromEntries(observed.sectors.map(sector => [sector.id, sector.contacts])), innerObserved: observed.innerContacts,
      queue: [...g.spawnQueue], randomState: g.random.state, zombies: live.map(z => ({ id: z.id, kind: z.kind, x: z.x, y: z.y, health: z.health })),
      text: g.ui.waveIntel.textContent, detail: g.ui.waveIntel.dataset.detail || g.ui.waveIntel.textContent };
  });
}

async function countersMatch(page) {
  await page.waitForFunction(() => {
    const g = DEADWALL, text = g.ui.waveIntel.dataset.detail || g.ui.waveIntel.textContent;
    const present = g.zombies.filter(z => !z.dead && z.health > 0).length;
    const incoming = g.spawnQueue.length + Object.values(g.pendingSpawns).reduce((a, b) => a + b, 0);
    return text.includes(present + ' présents') && text.includes(incoming + ' encore à venir');
  });
}

try {
  assert.ok(profiles.length, 'At least one known assault QA profile is required');
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const profile = { viewport, fixtures: [] }; report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    try {
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await chooseCampaign(page, '54831');
      await activate(page, '#campaignIntro132Skip', viewport.touch);
      await openCommand(page, viewport.touch, 'workers'); await activate(page, '[data-worker-order="retreat"]', viewport.touch);
      profile.fixtures.push(await page.evaluate(() => {
        const g = DEADWALL, composition = Object.fromEntries(Object.entries(DeadwallCore.ENEMIES).map(([kind,def]) => [kind, def.unlockWave<=8?3:0]));
        if (!g.paused || g.zombies.length) throw Error('Fixture requires a fresh, paused campaign');
        g.wave = 8; g.phase = 'warning'; g.phaseTime = .05;
        g.wavePlan = { ...DeadwallCore.wavePlan(8, g.difficulty, g.signature), total: 24, fronts: 4, composition };
        g.fronts = ['north', 'east', 'south', 'west'];
        g.updateUI();
        return { type: 'synthetic-warning-wave8', wave: 8, phaseTime: .05, total: 24, composition, fronts: [...g.fronts],
          notes: 'Wave/time/plan/fronts fixture only. No stocks, buildings, player position, elapsed time or RNG assigned.' };
      }));
      check('Advanced wave/time fixture records eight unlocked profiles and zero future arrivals', profile.fixtures[0].total === 24 &&
        Object.values(profile.fixtures[0].composition).filter(n=>n===3).length === 8 && Object.values(profile.fixtures[0].composition).reduce((a,b)=>a+b,0)===24);
      await resumeCommand(page, viewport.touch);
      await page.waitForFunction(() => DEADWALL.phase === 'assault' && DEADWALL.dayworks.snapshot().night?.pauses === 1, null, { timeout: 20000 });
      await countersMatch(page);
      await activate(page, '#pauseButton', viewport.touch);
      profile.firstPause = await snapshot(page);
      const first = profile.firstPause;
      check('RAF emits the first eight contacts and preserves sixteen incoming contacts', first.phase === 'assault' && first.night.emitted === 8 && first.present === 8 && first.incoming === 16 && first.remaining === 24);
      check('Real Dayworks adds its six-second echelon pause', first.night.pauses === 1 && first.spawnTimer > 5 && first.spawnTimer <= 6.5);
      check('Unobserved north contacts reveal no occupied front while announced east remains explicit', first.fronts.north === 8 && first.observed === 0 &&
        Object.values(first.observedFronts).every(n => n === 0) && first.detail.includes('Aucun contact actuellement observé.') &&
        !first.detail.includes('NORD') && first.detail.includes('Arrivées annoncées : EST.'));
      check('The pause is explicitly a pause in arrivals during a live assault', first.detail.includes('reprise des arrivées') && first.detail.includes('assaut toujours actif') && first.detail.includes('Échelon 2/3'));
      await screenshot('unobserved-first-echelon');
      profile.fixtures.push(await page.evaluate(maximumObservedAssaultFixture));
      await activate(page, '#resumeButton', viewport.touch);
      await countersMatch(page);
      profile.maximum = await snapshot(page);
      check('Four genuinely observed contact directions and the observed centre alert appear in the full briefing', profile.maximum.observed >= 5 && profile.maximum.innerObserved > 0 &&
        Object.values(profile.maximum.observedFronts).every(n => n > 0) && profile.maximum.detail.includes('Contacts observés :') &&
        ['NORD', 'EST', 'SUD', 'OUEST'].every(label => profile.maximum.detail.includes(label)));
      profile.geometry = {};
      for (const id of ['phaseLabel', 'waveIntel', 'innerRingAlert', 'hud143Prepare', 'hud143Enclosure', 'hud143Squads']) {
        profile.geometry[id] = await visibleInPanel(page, '#' + id);
        check('Maximum assault ' + id + ' is visible within its clipped panel before any automatic scrolling', profile.geometry[id].pass);
        if (id.startsWith('hud143')) check(id + ' preserves a 42-pixel real control', profile.geometry[id].box.height >= 42);
      }
      await screenshot('four-fronts-echelon');
      await activate(page, '#hud143Prepare', viewport.touch);
      const briefing = await page.locator('#coordinationPanel').innerText();
      check('Real preparations retain the complete observed four-front assault detail', ['présents', 'encore à venir', 'Contacts observés', 'NORD', 'EST', 'SUD', 'OUEST', 'reprise des arrivées', 'assaut toujours actif'].every(text => briefing.includes(text)));
      const paused = await snapshot(page); await page.waitForTimeout(1200); const frozen = await snapshot(page);
      check('Real command pause freezes clock, arrival delay and physical contacts', paused.elapsed === frozen.elapsed && paused.spawnTimer === frozen.spawnTimer &&
        paused.night.emitted === frozen.night.emitted && JSON.stringify(paused.zombies) === JSON.stringify(frozen.zombies));
      await resumeCommand(page, viewport.touch);
      profile.checkpoint = await saveReloadContinue(page, viewport.touch);
      check('Continue preserves every validated field, exact night, wave plan, RNG, actors and canonical arrival budgets', profile.checkpoint.pass);
      check('The modern bounded spawn buffer is compared exactly without normalization', profile.checkpoint.restoreComparison.normalizedFields.length === 0 &&
        JSON.stringify(profile.checkpoint.restoreComparison.expectedQueue) === JSON.stringify(profile.checkpoint.restoreComparison.restoredQueue));
      await activate(page, '#pauseButton', viewport.touch);
      const restored = await snapshot(page); await page.waitForTimeout(1000); const restoredFrozen = await snapshot(page);
      check('Restored assault stays paused with its first echelon pending', restored.night.emitted === 8 && restored.night.pauses === 1 && restored.incoming === 16 &&
        restored.elapsed === restoredFrozen.elapsed && restored.spawnTimer === restoredFrozen.spawnTimer);
      await activate(page, '#resumeButton', viewport.touch);
      const resumed = await snapshot(page);
      await page.waitForFunction(() => DEADWALL.dayworks.snapshot().night.emitted > 8, null, { timeout: 15000 });
      const next = await snapshot(page);
      check('Arrival resumes only after the actual saved residual delay expires', next.elapsed - resumed.elapsed >= resumed.spawnTimer - .15 && next.phase === 'assault');
      await page.waitForFunction(() => DEADWALL.dayworks.snapshot().night.pauses === 2, null, { timeout: 15000 });
      await countersMatch(page); await activate(page, '#pauseButton', viewport.touch);
      profile.secondPause = await snapshot(page);
      check('Second natural echelon has eight arrivals left without ending assault', profile.secondPause.night.emitted === 16 && profile.secondPause.incoming === 8 && profile.secondPause.phase === 'assault');
      check('Final advertised group follows the actual Dayworks south/west group', profile.secondPause.detail.includes('Arrivées annoncées : SUD / OUEST.'));
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.failureState = await snapshot(page).catch(() => null);
      await screenshot('failure').catch(() => {});
    } finally {
      try { await context.close(); } catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.normalizedFields = [...new Set(report.profiles.flatMap(profile => profile.checkpoint?.restoreComparison?.normalizedFields || []))];
  report.pass = profiles.length > 0 && report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
