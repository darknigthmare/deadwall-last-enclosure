import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel } from './browser-qa-common144.mjs';

const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }, { name: 'mobile-landscape', width: 844, height: 390, touch: true }];
const chosen = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = chosen ? views.filter(view => chosen.includes(view.name)) : views;
const harness = await createHarness('preparations', 'NATIVE INPUT: fresh seed903147, ordinary keyboard/touch movement, Commandement, preparations, doors, sections, maintenance and the two unavailable supply choices through real controls. Reading these menus preserves every saved field and costs no material or RNG. EXPLICIT ADVANCED FIXTURES then restore warning waves10/13 with saved Siege profiles pincer/flank, a finite24-walker wave and four fronts. Ordinary RAF performs spawning and real echelon delays; DOM controls perform pause, preparations and save/reload/Continue. A separate disclosed contact/observer geometry fixture tests a genuinely observed north contact and its immediate disappearance after the physical observer leaves. A final explicit completed-watchtower/carried-bag/free-service-point fixture excludes background workers and starts both supply recipes through real buttons; ordinary RAF pays their bag costs at completion and fills finite local reserves, preserving common wood/scrap/ammo. No organic late-wave, balancing or physical-device claim.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.normalizedFields = [];

const material = page => page.evaluate(() => { const { timestamp, ...saved } = DEADWALL.serialize(); return JSON.stringify(saved); });
async function observeEmissions(page) {
  await page.evaluate(() => {
    const g = DEADWALL;
    if (g.__observeSpawns147) return;
    globalThis.__PREP147_SPAWNS__ = [];
    const spawn = g.spawnZombie.bind(g);
    g.spawnZombie = (...args) => {
      const n = g.dayworks.snapshot().night, stage = n ? Math.min(3, Math.floor(n.emitted * 3 / n.total) + 1) : null;
      const result = spawn(...args);
      if (result === true) {
        const z = g.zombies.at(-1), size = DeadwallCore.WORLD_SIZE;
        const edges = [['north', z.y], ['east', size - z.x], ['south', size - z.y], ['west', z.x]].sort((a, b) => a[1] - b[1]);
        globalThis.__PREP147_SPAWNS__.push({ id: z.id, stage, front: edges[0][0], x: z.x, y: z.y, kind: z.kind });
      }
      return result;
    };
    g.__observeSpawns147 = true;
  });
}
const status = page => page.evaluate(() => {
  const g = DEADWALL, n = g.dayworks.snapshot().night, seen = g.battlefieldUI.snapshot();
  return { phase: g.phase, wave: g.wave, elapsed: g.elapsed, paused: g.paused, spawnTimer: g.spawnTimer, night: n,
    pattern: g.siege.assaultPattern(), pending: { ...g.pendingSpawns }, queue: [...g.spawnQueue], remaining: g.remainingAssault,
    present: seen.contacts, observed: seen.observedContacts, sectors: seen.sectors, incoming: g.spawnQueue.length + DeadwallCore.spawnCount(g.pendingSpawns),
    actors: g.zombies.map(z => ({ id: z.id, x: z.x, y: z.y, health: z.health })), rng: g.random.state,
    text: g.ui.waveIntel.dataset.detail, emitted: [...(globalThis.__PREP147_SPAWNS__ || [])] };
});
async function currentCounters(page) {
  // Wait for the ordinary HUD tick before deliberately stopping simulation.
  // Pausing between its 90ms samples correctly retains the last displayed tick.
  await page.waitForFunction(() => {
    const g = DEADWALL, detail = g.ui.waveIntel.dataset.detail || '', present = g.zombies.filter(z => !z.dead && z.health > 0).length;
    const incoming = g.spawnQueue.length + DeadwallCore.spawnCount(g.pendingSpawns), n = g.dayworks.snapshot().night;
    const echelon = n ? Math.min(3, Math.floor(n.emitted * 3 / n.total) + 1) : null;
    return detail.includes(present + ' présents') && detail.includes(incoming + ' encore à venir') && (!echelon || detail.includes('Échelon ' + echelon + '/3'));
  });
}

async function preparation(page, touch, check, name) {
  await openCommand(page, touch, 'field');
  await activate(page, '#coordinationTab', touch);
  check(name + ': the real preparation menu pauses the simulation and focuses its heading', await page.evaluate(() => DEADWALL.paused && DEADWALL.activeOverlay === DEADWALL.ui.commandModal && document.activeElement.id === 'coordinationHeading143'));
  check(name + ': preparation heading is actually visible in the clipped command body', (await visibleInPanel(page, '#coordinationHeading143', '.command-body')).pass);
  for (const id of ['coordination143Enclosure', 'coordination143Squads', 'coordination147Maintenance']) {
    await page.locator('#' + id).scrollIntoViewIfNeeded();
    const rect = await visibleInPanel(page, '#' + id, '.command-body');
    check(name + ': ' + id + ' is a visible 44-pixel real control', rect.pass && rect.box.height >= 44);
  }
}

async function readSchedule(page, touch) {
  const summary = '#coordination147Director > summary';
  if (!await page.locator('#coordination147Director').evaluate(n => n.open)) await activate(page, summary, touch);
  await page.locator('#coordination147Schedule').scrollIntoViewIfNeeded();
  return page.evaluate(() => ({ title: document.getElementById('coordination147DirectorTitle').textContent,
    stages: [...document.getElementById('coordination147Schedule').children].map(n => ({ number: +n.dataset.echelon, text: n.textContent, current: n.dataset.current === 'true' })),
    briefing: document.getElementById('coordinationBriefing143').textContent, defenses: document.getElementById('coordination147Defenses').textContent }));
}

async function saveContinueExactly(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  assert.ok(await page.locator('#pauseMenu').isVisible(), 'The prepared assault stays deliberately paused');
  await activate(page, '#saveButton', touch);
  const expected = await page.evaluate(() => { const { timestamp, ...data } = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)); return { ok: DEADWALL.lastSaveStatus.ok, data }; });
  assert.ok(expected.ok, 'The real save button succeeds');
  await activate(page, '#quitButton', touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page);
  // Observation and deliberate pause run after the installed restore, before RAF.
  await page.evaluate(() => {
    const g = DEADWALL, restore = g.restoreSave.bind(g);
    g.restoreSave = (...args) => { const result = restore(...args); const { timestamp, ...data } = DeadwallSave.validate(g.serialize()); globalThis.__PREP147_RESTORED__ = data; g.togglePause(true); return result; };
  });
  await activate(page, '#continueButton', touch); await page.waitForFunction(() => DEADWALL.state === 'playing' && DEADWALL.paused);
  return page.evaluate(expected => {
    const restored = globalThis.__PREP147_RESTORED__, keys = new Set([...Object.keys(expected), ...Object.keys(restored || {})]);
    const changedKeys = [...keys].filter(key => JSON.stringify(expected[key]) !== JSON.stringify(restored?.[key]));
    return { pass: changedKeys.length === 0, changedKeys, normalizedFields: [], expectedQueue: expected.spawnQueue, restoredQueue: restored?.spawnQueue,
      expectedPending: expected.pendingSpawns, restoredPending: restored?.pendingSpawns, expectedNight: expected.dayworks.night, restoredNight: restored?.dayworks.night,
      expectedRNG: expected.randomState, restoredRNG: restored?.randomState, profile: restored?.siege?.lastWave };
  }, expected.data);
}

async function preparedWave(page, id, wave) {
  return page.evaluate(({ id, wave }) => {
    const g = DEADWALL;
    if (!g.paused) throw Error('Fixture requires a real pause');
    const raw = g.serialize(), stocks = JSON.stringify(raw.resources), rng = raw.randomState;
    const composition = Object.fromEntries(Object.keys(DeadwallCore.ENEMIES).map(kind => [kind, kind === 'walker' ? 24 : 0]));
    raw.wave = wave; raw.phase = 'warning'; raw.phaseTime = .05;
    raw.wavePlan = { ...DeadwallCore.wavePlan(wave, g.difficulty, g.signature), total: 24, fronts: 4, spawnInterval: .12, composition };
    raw.fronts = ['north', 'east', 'south', 'west']; raw.zombies = []; raw.spawnQueue = []; raw.pendingSpawns = DeadwallCore.normalizeSpawnCounts(); raw.spawnTimer = 0;
    raw.dayworks.night = null; raw.citadel.baseline = null; raw.siege.lastWave = { wave, id, bonus: 0 };
    g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true);
    if (JSON.stringify(g.resources) !== stocks || g.random.state !== rng) throw Error('Prepared wave unexpectedly changed material or RNG');
    globalThis.__PREP147_SPAWNS__ = [];
    return { type: 'prepared-saved-director', id, wave, total: 24, composition, fronts: [...raw.fronts], phaseTime: .05, spawnInterval: .12,
      assignedFields: ['wave', 'phase', 'phaseTime', 'wavePlan', 'fronts', 'zombies', 'spawnQueue', 'pendingSpawns', 'spawnTimer', 'dayworks.night', 'citadel.baseline', 'siege.lastWave'],
      stockAndRNGPreserved: true, note: 'Validated save fixture; clears only previous synthetic contacts. No stocks, player/worker positions, buildings, elapsed time, health or RNG assigned. Later emissions and timers use ordinary RAF.' };
  }, { id, wave });
}

async function geometryFixture(page, observerPresent) {
  return page.evaluate(observerPresent => {
    const g = DEADWALL, worker = g.units[0];
    if (!g.paused || !worker || worker.dead || worker.health <= 0) throw Error('Real paused, living worker required');
    if (observerPresent) {
      const z = g.zombies[0]; if (!z) throw Error('Use an existing emitted contact');
      const home = { x: worker.x, y: worker.y }, before = { x: z.x, y: z.y };
      let found = false;
      for (let distance = 900; distance <= 1300 && !found; distance += 32) {
        for (const offset of [0, -160, 160, -320, 320]) {
          z.x = g.core().x + offset; z.y = g.core().y - distance; worker.x = z.x + 48; worker.y = z.y;
          const frame = g.visibility.frame();
          found = !g.world.solidForFriendly(worker.x, worker.y) && g.hostileLineClear(worker, z) && frame.canSeeLocal(z) && g.zombies.filter(z => !z.dead && z.health > 0 && frame.canSeeLocal(z)).length === 1;
          if (found) break;
        }
      }
      if (!found) throw Error('No physically observable north fixture corridor');
      globalThis.__PREP147_OBSERVER__ = { id: worker.id, home, contact: z.id };
      g.battlefieldUI.refresh(true); g.updateUI();
      return { type: 'physical-observer-and-existing-contact', worker: worker.id, contact: z.id, before, after: { x: z.x, y: z.y }, home,
        observer: { x: worker.x, y: worker.y }, note: 'Only one existing live contact and one actual worker position assigned. Real visibility146, physical LOS and unchanged health/material/RNG.' };
    }
    const observation = globalThis.__PREP147_OBSERVER__;
    if (!observation || observation.id !== worker.id) throw Error('Observer fixture identity mismatch');
    Object.assign(worker, observation.home); g.battlefieldUI.refresh(true); g.updateUI();
    const z = g.zombies.find(z => z.id === observation.contact);
    return { type: 'physical-observer-return', worker: worker.id, destination: observation.home, contact: z.id, contactAlive: !z.dead && z.health > 0, nowVisible: g.visibility.canSeeLocal(z),
      note: 'Observer alone returns to its pre-fixture position while command pause is retained. Contact remains alive and no position is revealed or remembered.' };
  }, observerPresent);
}

async function fieldSupplyFixture(page) {
  return page.evaluate(() => {
    const g = DEADWALL;
    if (!g.paused) throw Error('Supply fixture requires real pause');
    const raw = g.serialize(), def = DeadwallCore.BUILDINGS.watchtower, Building = g.core().constructor;
    let tower, point;
    for (let radius = 6; radius < 24 && !point; radius += 2) {
      for (const [dx, dy] of [[radius, 0], [0, radius], [-radius, 0], [0, -radius]]) {
        const gx = g.core().gx + dx, gy = g.core().gy + dy;
        if (!g.world.placement(def, gx, gy, 0).valid) continue;
        const candidate = new Building(raw.nextId, 'watchtower', gx, gy, 0, 1), access = g.fieldcraft.service(g.player, candidate);
        if (access && g.friendlyPositionClear(g.player, access.x, access.y)) { tower = candidate; point = access; break; }
      }
    }
    if (!point) throw Error('No legal completed tower and physical supply access');
    raw.buildings.push({ id: raw.nextId++, type: tower.type, gx: tower.gx, gy: tower.gy, rotation: 0, progress: 1, health: def.health, corpseLoad: 0, priority: 1 });
    raw.urban.peakScore = Math.max(raw.urban.peakScore, DeadwallCore.Urban.score(raw.buildings));
    raw.phase = 'calm'; raw.phaseTime = 120; raw.zombies = []; raw.spawnQueue = []; raw.pendingSpawns = DeadwallCore.normalizeSpawnCounts(); raw.dayworks.night = null; raw.citadel.baseline = null;
    raw.player.x = point.x; raw.player.y = point.y;
    raw.player.carry = { ...Object.fromEntries(DeadwallCore.RESOURCE_KEYS.map(key => [key, 0])), wood: 3, scrap: 5, ammo: 6 };
    // The prepared scene excludes background harvesting to make bag/depot proof exact.
    raw.units = [];
    g.restoreSave(DeadwallSave.validate(raw)); g.togglePause(true); g.selectBuilding(g.world.buildings.get(tower.id));
    if (!g.friendlyPositionClear(g.player, g.player.x, g.player.y)) throw Error('Restored service point is physically obstructed');
    globalThis.__PREP147_SUPPLY_SUPPORT__ = tower.id;
    return { type: 'prepared-physical-field-supplies', support: { id: tower.id, type: tower.type, gx: tower.gx, gy: tower.gy }, player: { x: g.player.x, y: g.player.y }, bag: { ...g.player.carry },
      assignedFields: ['buildings[completed watchtower]', 'nextId', 'urban.peakScore[actual fixture built score]', 'phase', 'phaseTime', 'zombies', 'spawnQueue', 'pendingSpawns', 'dayworks.night', 'citadel.baseline', 'player.x', 'player.y', 'player.carry', 'units'],
      transientSelection: tower.id, note: 'Legal footprint and genuinely free exterior service point. Completed tower, carried bag and absence of background harvesting are explicit fixtures; no common depot stock or RNG assigned. Later jobs use actual buttons and ordinary RAF.' };
  });
}

async function openFortifications(page, touch) {
  await openCommand(page, touch, 'field'); await activate(page, '#expansionFieldTab', touch);
  await activate(page, '#expansionGroup-defense', touch); await activate(page, '#expansionTab-fortification', touch);
}

async function supplyState(page) {
  return page.evaluate(() => ({ elapsed: DEADWALL.elapsed, job: DEADWALL.fortificationPack.job ? { kind: DEADWALL.fortificationPack.job.kind, elapsed: DEADWALL.fortificationPack.job.elapsed, seconds: DEADWALL.fortificationPack.job.seconds } : null,
    bag: { ...DEADWALL.player.carry }, depot: { wood: DEADWALL.resources.wood, scrap: DEADWALL.resources.scrap, ammo: DEADWALL.resources.ammo },
    fitting: DEADWALL.fortificationPack.snapshot().fittings.find(f => f.id === globalThis.__PREP147_SUPPLY_SUPPORT__) || { ammo: 0, repair: 0 }, player: { x: DEADWALL.player.x, y: DEADWALL.player.y } }));
}

try {
  assert.ok(profiles.length, 'At least one known preparation QA profile is required');
  for (const viewport of profiles) {
    const profile = { viewport, native: { fixtures: [], checks: [], pass: false }, fixtures: [], fixtureChecks: [] }; report.profiles.push(profile);
    let context, page;
    try {
      context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
      page = await context.newPage(); page.setDefaultTimeout(30000);
      const rec = recorder(page, profile, output, viewport.name + '-');
      const scoped = (scope, name, pass = true) => { const check = { name, pass: !!pass }; scope.push(check); rec.check(name, pass); };
      const native = (name, pass) => scoped(profile.native.checks, name, pass), advanced = (name, pass) => scoped(profile.fixtureChecks, name, pass);
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await chooseCampaign(page, '903147'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      const start = await page.evaluate(() => ({ x: DEADWALL.player.x, y: DEADWALL.player.y }));
      await holdInput(page, context, viewport.touch, 'KeyD', '#touchControls [data-dir="right"]', () => page.waitForTimeout(500));
      const travel = await page.evaluate(p => Math.hypot(DEADWALL.player.x - p.x, DEADWALL.player.y - p.y), start);
      native('Fresh campaign moves through genuine held keyboard/touch input', travel > 20);
      await preparation(page, viewport.touch, native, 'Native');
      const before = await material(page);
      await activate(page, '#coordination147Director > summary', viewport.touch); await page.locator('#coordination147Defenses').scrollIntoViewIfNeeded();
      native('Native preparations show a visible friendly-rempart diagnosis', (await visibleInPanel(page, '#coordination147Defenses', '.command-body')).pass && (await page.locator('#coordination147Defenses').innerText()).includes('amas permettant le franchissement'));
      await rec.screenshot('native-preparations');
      for (const [id, target] of [['coordination143Enclosure', '#commandPanel-enclosure'], ['coordination143Squads', '#commandPanel-workers'], ['coordination147Maintenance', '#linecarePanel']]) {
        await activate(page, '#commandTab-field', viewport.touch); await activate(page, '#coordinationTab', viewport.touch); await activate(page, '#' + id, viewport.touch);
        native('Native ' + id + ' opens its existing paused dossier', await page.locator(target).isVisible() && await page.evaluate(() => DEADWALL.paused));
      }
      native('Native menu reads and navigation preserve every persistent field', before === await material(page));
      await activate(page, '#expansionFieldTab', viewport.touch); await activate(page, '#expansionGroup-defense', viewport.touch); await activate(page, '#expansionTab-fortification', viewport.touch);
      for (const [kind, seconds, capacity] of [['ammo', 6, 24], ['repair', 8, 200]]) {
        const button = page.locator('#expansionAction-fortification-field-' + kind); await button.scrollIntoViewIfNeeded();
        const choice = await button.evaluate(node => ({ disabled: node.disabled, text: node.closest('.expansion-action').textContent,
          reason: document.getElementById(node.getAttribute('aria-describedby'))?.textContent }));
        const rect = await visibleInPanel(page, '#expansionAction-fortification-field-' + kind, '.command-body');
        native('Native field-' + kind + ' exposes a readable unavailable choice with real bag cost, time and capacity', choice.disabled && !!choice.reason && choice.text.includes('dans le sac') && choice.text.includes(seconds + ' s') && choice.text.includes(String(capacity)) && rect.pass && rect.box.height >= 42);
      }
      native('Reading the new supply choices spends no stock, bag or RNG', before === await material(page));
      profile.native.pass = true;

      await activate(page, '#commandTab-workers', viewport.touch); await activate(page, '[data-worker-order="retreat"]', viewport.touch);
      advanced('Existing worker recall is issued through its actual command before the prepared assaults', await page.evaluate(() => DEADWALL.workerOrder === 'retreat'));

      for (const [id, wave, expected] of [['pincer', 10, [['north', 'south'], ['east', 'west'], ['north', 'east', 'south', 'west']]], ['flank', 13, [['north'], ['east', 'west'], ['south']]]]) {
        profile.fixtures.push(await preparedWave(page, id, wave));
        await preparation(page, viewport.touch, advanced, id + ' warning');
        const beforeRead = await material(page), forecast = await readSchedule(page, viewport.touch);
        advanced(id + ': the predicted schedule is actually visible inside the clipped dossier', (await visibleInPanel(page, '#coordination147Schedule', '.command-body')).pass);
        const labels = { north: 'NORD', east: 'EST', south: 'SUD', west: 'OUEST' };
        for (let i = 0; i < 3; i++) advanced(id + ': predicted echelon ' + (i + 1) + ' matches its actual director group', expected[i].every(d => forecast.stages[i].text.includes(labels[d])) && Object.entries(labels).filter(([d]) => !expected[i].includes(d)).every(([, label]) => !forecast.stages[i].text.includes(label)));
        advanced(id + ': forecast is explicitly planned, not already observed', forecast.stages.every(s => s.text.includes('prévu')) && forecast.briefing.includes('Aucun contact actuellement observé'));
        advanced(id + ': forecast reads preserve the full saved state and RNG', beforeRead === await material(page));
        await rec.screenshot(id + '-forecast');
        await observeEmissions(page);
        await resumeCommand(page, viewport.touch);
        await page.waitForFunction(() => DEADWALL.dayworks.snapshot().night?.pauses === 1, null, { timeout: 20000 });
        await currentCounters(page);
        await activate(page, '#pauseButton', viewport.touch);
        const first = await status(page);
        advanced(id + ': ordinary RAF emits exactly eight contacts with sixteen remaining', first.night.emitted === 8 && first.present === 8 && first.incoming === 16 && first.remaining === 24);
        advanced(id + ': first actual spawn positions obey the selected saved profile', first.emitted.length === 8 && first.emitted.every(z => z.stage === 1 && expected[0].includes(z.front)));
        advanced(id + ': the true echelon delay remains an active assault', first.phase === 'assault' && first.spawnTimer > 5 && first.text.includes('reprise des arrivées') && first.text.includes('assaut toujours actif'));
        advanced(id + ': distant unseen contacts expose no direction', first.observed === 0 && first.sectors.every(s => s.contacts === 0) && !first.text.includes('Contacts observés :'));
        await preparation(page, viewport.touch, advanced, id + ' assault');
        const pausedBefore = await material(page); await page.waitForTimeout(800);
        advanced(id + ': real command pause freezes all persisted actors, timers, buffers, stocks and RNG', pausedBefore === await material(page));
        await readSchedule(page, viewport.touch); await rec.screenshot(id + '-echelon-pause');
        const checkpoint = await saveContinueExactly(page, viewport.touch);
        (profile.checkpoints ||= []).push(checkpoint);
        advanced(id + ': Continue preserves every field, exact queue order, night, RNG and saved profile', checkpoint.pass && checkpoint.profile.id === id && checkpoint.normalizedFields.length === 0);
        await observeEmissions(page);
        const resumed = await status(page); await activate(page, '#resumeButton', viewport.touch);
        await page.waitForFunction(() => DEADWALL.dayworks.snapshot().night.emitted > 8, null, { timeout: 15000 });
        const after = await status(page);
        advanced(id + ': arrivals resume only after the exact restored residual delay', after.elapsed - resumed.elapsed >= resumed.spawnTimer - .15 && after.phase === 'assault');
        await page.waitForFunction(() => DEADWALL.dayworks.snapshot().night.pauses === 2, null, { timeout: 15000 }); await currentCounters(page); await activate(page, '#pauseButton', viewport.touch);
        const second = await status(page);
        advanced(id + ': the second echelon leaves eight real contacts pending', second.night.emitted === 16 && second.incoming === 8 && second.remaining === 24);
        advanced(id + ': second actual spawn positions obey the lateral group after Continue', second.emitted.length === 8 && second.emitted.every(z => z.stage === 2 && expected[1].includes(z.front)));
        await preparation(page, viewport.touch, advanced, id + ' final stage');
        const final = await readSchedule(page, viewport.touch);
        advanced(id + ': the current final echelon retains exactly its announced fronts', final.stages[2].current && expected[2].every(d => final.briefing.includes(labels[d])));
        if (id === 'flank') {
          profile.fixtures.push(await geometryFixture(page, true));
          await activate(page, '#coordinationTab', viewport.touch);
          let observed = await status(page);
          advanced('Real physical observer exposes exactly one north contact while all other directions stay unobserved', observed.observed === 1 && observed.sectors.find(s => s.id === 'north').contacts === 1 && observed.sectors.filter(s => s.id !== 'north').every(s => s.contacts === 0));
          await page.locator('#coordinationBriefing143').scrollIntoViewIfNeeded();
          advanced('Observed north is visible in the dossier separately from future south arrivals', (await visibleInPanel(page, '#coordinationBriefing143', '.command-body')).pass && (await page.locator('#coordinationBriefing143').innerText()).includes('Contacts observés : NORD 1') && (await page.locator('#coordinationBriefing143').innerText()).includes('Arrivées annoncées : SUD'));
          await rec.screenshot('observed-north-announced-south');
          profile.fixtures.push(await geometryFixture(page, false)); await activate(page, '#coordinationTab', viewport.touch);
          observed = await status(page);
          advanced('Observer departure immediately removes the north direction in the same paused world', observed.observed === 0 && observed.present === 16 && observed.sectors.every(s => s.contacts === 0) && !(await page.locator('#coordinationBriefing143').innerText()).includes('NORD'));
          await rec.screenshot('observer-departed');
        }
        await resumeCommand(page, viewport.touch);
        await page.waitForFunction(() => DEADWALL.dayworks.snapshot().night.emitted === 24, null, { timeout: 15000 }); await currentCounters(page); await activate(page, '#pauseButton', viewport.touch);
        const complete = await status(page), last = complete.emitted.filter(z => z.stage === 3);
        advanced(id + ': third actual spawn positions obey the final advertised group', last.length === 8 && last.every(z => expected[2].includes(z.front)));
        advanced(id + ': emitted contacts keep the assault active with zero invented future arrivals', complete.phase === 'assault' && complete.present === 24 && complete.incoming === 0 && complete.remaining === 24 && !complete.text.includes('Arrivées annoncées'));
        (profile.scenarios ||= []).push({ id, wave, first, second, complete });
      }
      profile.fixtures.push(await fieldSupplyFixture(page));
      for (const [kind, amount, seconds, cost] of [['ammo', 6, 6, { ammo: 6, wood: 1, scrap: 1 }], ['repair', 80, 8, { wood: 2, scrap: 4 }]]) {
        await openFortifications(page, viewport.touch);
        const selector = '#expansionAction-fortification-field-' + kind;
        await page.locator(selector).scrollIntoViewIfNeeded();
        const control = await visibleInPanel(page, selector, '.command-body');
        advanced('Prepared field-' + kind + ' is physically eligible and genuinely clickable', await page.locator(selector).isEnabled() && control.pass && control.box.height >= 42);
        const beforeJob = await supplyState(page); await activate(page, selector, viewport.touch);
        await page.waitForFunction(() => DEADWALL.fortificationPack.busy() && document.getElementById('commandModal').classList.contains('hidden'));
        const started = await supplyState(page);
        advanced('Actual field-' + kind + ' button closes Commandement and starts its ordinary timed preparation without advance payment', started.job.seconds === seconds && JSON.stringify(started.bag) === JSON.stringify(beforeJob.bag) && started.fitting[kind] === beforeJob.fitting[kind]);
        // The menu retains its real prior pause state; only the native Resume control releases it.
        if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', viewport.touch);
        await page.waitForFunction(() => DEADWALL.fortificationPack.busy() && !DEADWALL.paused && !DEADWALL.activeOverlay);
        advanced('The real work tray names the current supply and exposes its actual progress', await page.locator('#expansionWork').evaluate((node, kind) => {
          const progress = node.querySelector('progress'), name = DeadwallCore.FortificationPackRules.fieldSupply[kind].name;
          return node.checkVisibility() && node.textContent.includes(name) && progress && !progress.hidden && progress.value >= 0 && progress.value < 1;
        }, kind));
        advanced('The supply name and progress are actually visible within the viewport', (await visibleInPanel(page, '#expansionWork', '#hud')).pass);
        if (kind === 'ammo') {
          await activate(page, '#pauseButton', viewport.touch);
          const paused = await supplyState(page); await page.waitForTimeout(700); const frozen = await supplyState(page);
          advanced('Real Pause suspends the supply timer, bag and finite fitting without cancelling the job', !!frozen.job && JSON.stringify(paused) === JSON.stringify(frozen));
          await activate(page, '#resumeButton', viewport.touch);
        }
        await page.waitForFunction(() => !DEADWALL.fortificationPack.busy(), null, { timeout: 15000 });
        await activate(page, '#pauseButton', viewport.touch); const finished = await supplyState(page);
        (profile.supplyJobs ||= []).push({ kind, before: beforeJob, started, finished, cost, amount });
        advanced('RAF field-' + kind + ' finishes after its real duration and increases only its finite local reserve', finished.elapsed - beforeJob.elapsed >= seconds - .1 && finished.fitting[kind] === beforeJob.fitting[kind] + amount);
        advanced('Field-' + kind + ' pays its exact material cost from the physical bag only', Object.entries(cost).every(([key, n]) => finished.bag[key] === beforeJob.bag[key] - n) && Object.keys(beforeJob.bag).filter(key => !(key in cost)).every(key => finished.bag[key] === beforeJob.bag[key]));
        advanced('Field-' + kind + ' consumes no shared wood, scrap or ammunition stock and retains the real service point', JSON.stringify(finished.depot) === JSON.stringify(beforeJob.depot) && JSON.stringify(finished.player) === JSON.stringify(beforeJob.player));
      }
      await openFortifications(page, viewport.touch); await page.locator('#expansionAction-fortification-field-repair').scrollIntoViewIfNeeded(); await rec.screenshot('paid-field-supplies');
      const suppliesCheckpoint = await saveContinueExactly(page, viewport.touch); (profile.checkpoints ||= []).push(suppliesCheckpoint);
      advanced('Continue preserves both paid finite supplies, remaining bag and every persisted field exactly', suppliesCheckpoint.pass);
      advanced('No page, console, HTTP or request errors', rec.errors() === 0);
      profile.pass = profile.native.pass && profile.fixtureChecks.every(check => check.pass);
    } catch (error) {
      profile.pass = false; profile.failure = error.stack;
      if (page) {
        profile.failureState = await status(page).catch(() => null);
        const file = viewport.name + '-failure.png'; await page.screenshot({ path: output + '/' + file }).then(() => profile.screenshots.push(file)).catch(() => {});
      }
    } finally {
      try { await context?.close(); } catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, native: profile.native.checks.length, advanced: profile.fixtureChecks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.pass = profiles.length > 0 && report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
