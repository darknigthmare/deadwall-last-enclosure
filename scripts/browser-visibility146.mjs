import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, persistedSnapshot, observePersistentRestore, comparePersistentRestore } from './browser-qa-common144.mjs';

const harness = await createHarness('visibility', 'NATIVE INPUT: fresh seed-903145 campaign, menu, ordinary keyboard/touch movement, local map, Commandement, eleven new operation/plan choices and save/Continue. Disabled choices are inspected, never reported as performed transactions. EXPLICIT ADVANCED FIXTURES then assign two companions solely to inspect the two exercise types, and place existing-format contacts, an ordinary completed palisade and empty risen remains through validated restoreSave. Free physical geometry selects encounter positions; the current day/night model remains authoritative. A separate paused wave-4 blackout fixture exercises unlit contacts. No campaign claims for these prepared encounters. Map reads and Continue must preserve every persistent field, stocks and RNG. Chromium desktop, portrait and landscape are browser/layout evidence, not physical-device certification.');
const { browser, base, report, output } = harness;
report.profiles = [];
report.normalizedFields = [];
const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }, { name: 'mobile-landscape', width: 844, height: 390, touch: true }];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = selected ? views.filter(view => selected.includes(view.name)) : views;

// Observation only: the original native canvas methods still paint each marker.
async function observePaints(page) {
  await page.evaluate(() => {
    if (globalThis.__MAP_PAINT146__) return;
    const records = globalThis.__MAP_PAINT146__ = {}, proto = CanvasRenderingContext2D.prototype;
    const names = new Set(['minimap', 'commandMap129', 'frontierMap']);
    for (const method of ['clearRect', 'setTransform', 'fillRect', 'arc', 'fillText']) {
      const original = proto[method];
      proto[method] = function (...args) {
        const id = this.canvas?.id;
        if (names.has(id)) {
          if (method === 'clearRect' || id === 'minimap' && method === 'setTransform' && args.join(',') === '1,0,0,1,0,0') records[id] = [];
          if (/^#(?:b64f45|aa3934|cb8270)$/i.test(this.fillStyle) && (method === 'arc' || method === 'fillRect') && !(id === 'frontierMap' && method === 'fillRect' && args.join(',') === '16,16,4,4')) {
            (records[id] ||= []).push({ method, color: this.fillStyle, args });
          }
          if (method === 'fillText' && String(args[0]).startsWith('CONTACTS OBSERVÉS')) (records[id] ||= []).push({ method, text: args[0], args });
        }
        return original.apply(this, args);
      };
    }
  });
}

async function painted(page, ids) {
  return page.evaluate(ids => {
    const g = DEADWALL, material = () => { const { timestamp, ...d } = g.serialize(); return JSON.stringify(d); };
    const before = material(), stocks = JSON.stringify(g.resources), randomState = g.random.state;
    g.renderMinimap();
    if (ids.includes('commandMap129')) g.commandPresentation.refresh(true);
    if (ids.includes('frontierMap')) g.frontierUI.atlas.draw(g.frontier.overview());
    return { unchanged: before === material(), stocksUnchanged: stocks === JSON.stringify(g.resources), rngUnchanged: randomState === g.random.state,
      maps: Object.fromEntries(ids.map(id => [id, (globalThis.__MAP_PAINT146__[id] || []).filter(p => p.method !== 'fillText')])),
      legend: (globalThis.__MAP_PAINT146__.frontierMap || []).filter(p => p.method === 'fillText').map(p => p.text), diagnostics: g.visibility.snapshot() };
  }, ids);
}

function checkPaint(check, result, expected, stage) {
  check(stage + ': map drawing preserves the complete persistent state', result.unchanged);
  check(stage + ': map drawing consumes no stock or RNG', result.stocksUnchanged && result.rngUnchanged);
  for (const [id, count] of Object.entries(expected)) check(stage + ': ' + id + ' actually paints exactly ' + count + ' observed contacts', result.maps[id]?.length === count);
}

async function visibleAtlasLegend(page) {
  // Canvas focus centres a tall map in the scrollable dossier. Bring its top
  // strip into view separately, as a player can, before claiming visibility.
  return page.locator('#frontierMap').evaluate(node => {
    node.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    const r = node.getBoundingClientRect(), panel = node.closest('.command-body').getBoundingClientRect();
    const position = DEADWALL.frontierUI.atlas.position(), scale = r.width / position.width;
    const bounds = { x: r.x + 10 * scale, y: r.y + 8 * scale, width: Math.min(234, position.width - 78) * scale, height: 20 * scale };
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return { bounds, panel: { x: panel.x, y: panel.y, width: panel.width, height: panel.height },
      visible: bounds.x >= Math.max(0, panel.left) && bounds.x + bounds.width <= Math.min(innerWidth, panel.right) && bounds.y >= Math.max(0, panel.top) && bounds.y + bounds.height <= Math.min(innerHeight, panel.bottom) && hit?.closest('#frontierMap') === node };
  });
}

async function readAction(page, selector) {
  const control = page.locator(selector); await control.scrollIntoViewIfNeeded();
  return control.evaluate(node => {
    const r = node.getBoundingClientRect(), panel = node.closest('.command-body').getBoundingClientRect(), card = node.closest('.expansion-action') || node.closest('.dw14-plan');
    const reason = document.getElementById(node.getAttribute('aria-describedby'))?.textContent || '';
    const description = [...card.querySelectorAll('p')].map(p => p.textContent).join(' ');
    return { id: node.id, label: node.textContent, description, reason, disabled: node.disabled, cardText: card.textContent,
      bounds: { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right },
      visible: node.checkVisibility() && r.left >= -1 && r.right <= innerWidth + 1 && r.top >= panel.top - 1 && r.bottom <= panel.bottom + 1,
      selectedTab: document.getElementById('expansionDetail')?.getAttribute('aria-labelledby'), focus: document.activeElement?.id };
  });
}

async function readOperations(page, touch, check, scope, families) {
  const before = await page.evaluate(() => { const { timestamp, ...d } = DEADWALL.serialize(); return JSON.stringify(d); });
  await activate(page, '#expansionFieldTab', touch);
  scope.operations = [];
  for (const family of families) {
    await activate(page, '#expansionGroup-' + family.group, touch); await activate(page, '#expansionTab-' + family.id, touch);
    check('Real ' + family.id + ' tab selects its existing accessible dossier', await page.locator('#expansionTab-' + family.id).evaluate((n, id) => n.getAttribute('aria-selected') === 'true' && document.getElementById('expansionDetail').getAttribute('aria-labelledby') === n.id && document.activeElement === n, family.id));
    for (const action of family.actions) {
      const readout = await readAction(page, '#expansionAction-' + family.id + '-' + action.id); scope.operations.push(readout);
      check('Choice ' + readout.id + ' has readable name, conditions and a visible standard target', readout.visible && readout.bounds.height >= 42 && !!readout.reason && readout.label.includes(action.label));
      check('Choice ' + readout.id + ' exposes its actual cost or finite transfer description', action.tokens.every(token => (readout.label + ' ' + readout.description + ' ' + readout.reason).includes(token)));
      check('Fresh unprepared choice ' + readout.id + ' honestly remains unavailable', readout.disabled);
    }
  }
  scope.menuReadsPreserveState = before === await page.evaluate(() => { const { timestamp, ...d } = DEADWALL.serialize(); return JSON.stringify(d); });
  check('Reading these operation dossiers spends no resources or simulation state', scope.menuReadsPreserveState);
}

async function restoreFixture(page, name, mutate) {
  return page.evaluate(({ name, source }) => {
    const g = DEADWALL;
    if (!g.paused) throw Error('A real pause is required before preparing a fixture');
    const data = g.serialize(), stocks = JSON.stringify(data.resources), rng = data.randomState;
    const description = new Function('g', 'data', 'return (' + source + ')(g, data)')(g, data);
    const validated = DeadwallSave.validate(data);
    g.restoreSave(validated); g.togglePause(true);
    if (JSON.stringify(g.resources) !== stocks || g.random.state !== rng) throw Error('Fixture unexpectedly changed stock or RNG');
    return { type: name, ...description, validatedSave: true, stockAndRNGPreserved: true, note: 'Explicit state/geometry fixture. Restore and deliberate pause run synchronously before RAF; no simulation step is injected.' };
  }, { name, source: mutate.toString() });
}

async function continuePaused(page, touch) {
  // Returning to deliberate Pause avoids resuming the prepared encounter.
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  assert.ok(await page.locator('#pauseMenu').isVisible(), 'Prepared state remains deliberately paused');
  await activate(page, '#saveButton', touch);
  const checkpoint = await persistedSnapshot(page);
  assert.ok(checkpoint.ok);
  await activate(page, '#quitButton', touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page); await observePaints(page);
  await observePersistentRestore(page);
  // Observe contacts before the first resumed frame, using the existing restore.
  await page.evaluate(() => {
    const g = DEADWALL, restore = g.restoreSave.bind(g);
    g.restoreSave = (...args) => {
      const value = restore(...args);
      g.togglePause(true);
      g.renderMinimap();
      globalThis.__MAP_RESTORE146__ = { markers: [...(globalThis.__MAP_PAINT146__.minimap || [])], diagnostics: g.visibility.snapshot() };
      return value;
    };
  });
  await activate(page, '#continueButton', touch); await page.waitForFunction(() => DEADWALL.state === 'playing');
  checkpoint.pass = await comparePersistentRestore(page, checkpoint);
  checkpoint.observedContacts = await page.evaluate(() => globalThis.__MAP_RESTORE146__);
  return checkpoint;
}

try {
  assert.ok(profiles.length, 'At least one known visibility QA profile is required');
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const profile = { viewport, seed: 903145, native: { fixtures: [], checks: [], pass: false }, fixtures: [], fixtureChecks: [], paints: {} }; report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    try {
      console.log('Visibility profile: ' + viewport.name);
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await observePaints(page);
      await chooseCampaign(page, '903145'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      check('Fresh native campaign has the current visibility service and requested seed', await page.evaluate(() => !!DEADWALL.visibility && DEADWALL.world.seed === 903145));
      const start = await page.evaluate(() => ({ x: DEADWALL.player.x, y: DEADWALL.player.y }));
      await holdInput(page, context, viewport.touch, 'd', '#touchControls [data-dir="right"]', () => page.waitForFunction(x => DEADWALL.player.x > x + 40, start.x));
      profile.native.movement = await page.evaluate(start => ({ start, end: { x: DEADWALL.player.x, y: DEADWALL.player.y }, elapsed: DEADWALL.elapsed }), start);
      check('Native keyboard or held touch advances the physical player', profile.native.movement.end.x > start.x + 40);
      if (viewport.touch) {
        if (!await page.locator('#hud135Map').evaluate(node => node.open)) await activate(page, '#hud135Map > summary', true);
        await activate(page, '#minimapWrap', true);
      } else { await page.locator('#game').focus(); await page.keyboard.press('m'); }
      await page.locator('#deadwall125-map').waitFor({ state: 'visible' });
      check('Real keyboard or map tap opens the historical local map and pauses simulation', await page.evaluate(() => DEADWALL.paused && DEADWALL.exploration125.overlayOpen()));
      await screenshot('native-local-map'); await page.keyboard.press('Escape');
      await openCommand(page, viewport.touch, 'enclosure');
      check('Real Commandement map identifies currently observed contacts', await page.locator('#commandMap129').evaluate(n => n.getAttribute('aria-label').includes('actuellement observés')));
      profile.paints.native = await painted(page, ['minimap', 'commandMap129']); checkPaint(check, profile.paints.native, { minimap: 0, commandMap129: 0 }, 'Native start');
      await screenshot('native-command-map');
      await activate(page, '#commandTab-field', viewport.touch);
      await readOperations(page, viewport.touch, check, profile.native, [
        { group: 'player', id: 'survival', actions: [{ id: 'ration', label: 'ration', tokens: ['2 nourriture', '30'] }, { id: 'restSheltered', label: 'abritée', tokens: ['6 nourriture', '1 médicaments', '20 s'] }, { id: 'dressingLight', label: 'léger', tokens: ['1 médicaments', '3 s', '9'] }] },
        { group: 'exploration', id: 'exploration', actions: [{ id: 'extract-compact', label: 'compact', tokens: ['1 bois', '1 ferraille', '12', '86 %'] }, { id: 'stash', label: 'cache', tokens: ['3 s', '54', 'reliquat'] }] },
        { group: 'defense', id: 'fortification', actions: [{ id: 'ammoCompact', label: 'compact', tokens: ['12', '2'] }, { id: 'netWide', label: 'large', tokens: ['24', '26', '16'] }] },
        { group: 'world', id: 'campaign', actions: [{ id: 'start-medical', label: 'Relais sanitaire', tokens: ['6 nourriture', '6 médicaments', '12 s', '2 ferraille'] }, { id: 'start-recovery', label: 'Retour de réserve', tokens: ['8 nourriture', '14 s', '5 ferraille', '18 munitions'] }] }
      ]);
      await activate(page, '#dayworksTab', viewport.touch);
      profile.native.plans = [];
      for (const id of ['observationRelay', 'careCourt']) {
        const readout = await readAction(page, '#plan-' + id); profile.native.plans.push(readout);
        check('Native plan ' + id + ' has a real visible control and readable design description', readout.visible && readout.bounds.height >= 42 && readout.description.length > 30 && !readout.disabled && readout.label === 'PLACER UN APERÇU');
        const before = await page.evaluate(() => { const { timestamp, ...d } = DEADWALL.serialize(); return JSON.stringify(d); });
        await activate(page, '#plan-' + id, viewport.touch);
        check('Real plan ' + id + ' click explains the absent construction office', await page.locator('#dayworksStatus').evaluate(node => node.textContent.includes('Bureau de chantier achevé requis.')));
        check('Refused plan ' + id + ' click preserves the complete persistent state', before === await page.evaluate(() => { const { timestamp, ...d } = DEADWALL.serialize(); return JSON.stringify(d); }));
      }
      await screenshot('native-new-plans');
      profile.native.continue = await continuePaused(page, viewport.touch);
      check('Native save/Continue preserves every validated field before RAF', profile.native.continue.pass);
      profile.native.checks = [...profile.checks]; profile.native.pass = profile.native.checks.every(item => item.pass);

      profile.fixtures.push(await restoreFixture(page, 'two-companions-for-exercise-ui-only', (g, d) => {
        d.worldEvolution.companions = [{ id: 'lea', health: 100, order: 'follow' }, { id: 'samir', health: 100, order: 'follow' }];
        return { companions: ['lea', 'samir'], changed: ['worldEvolution.companions(two assigned allies)'], note: 'Advanced UI roster fixture; no training skill, reserve, stock, position or RNG is supplied.' };
      }));
      await openCommand(page, viewport.touch, 'field'); profile.exerciseUI = {};
      await readOperations(page, viewport.touch, check, profile.exerciseUI, [{ group: 'player', id: 'companions', actions: [{ id: 'train-lea-escort', label: 'escorte', tokens: ['60 s', '24', '14'] }, { id: 'train-lea-support', label: 'appui', tokens: ['75 s', '30', '20', '8'] }] }]);
      await screenshot('fixture-new-exercises');

      profile.fixtures.push(await restoreFixture(page, 'local-wall-range', (g, d) => {
        const C = DeadwallCore, tile = C.TILE, radius = g.player.radius;
        let location;
        for (let gy = 24; gy < 48 && !location; gy++) for (let gx = 24; gx < 48; gx++) {
          const wall = { gx, gy, x: (gx + .5) * tile, y: (gy + .5) * tile }, p = { x: wall.x - 96, y: wall.y }, e = { x: wall.x + 96, y: wall.y };
          if (!g.world.placement(C.BUILDINGS.woodWall, gx, gy).valid || !g.friendlyPositionClear({ radius }, p.x, p.y) || !g.friendlyPositionClear({ radius }, e.x, e.y) || !g.hostileLineClear(p, e)) continue;
          if ([g.core(), ...g.units].some(u => Math.hypot(u.x - e.x, u.y - e.y) < 700)) continue;
          location = { wall, player: p, hidden: e }; break;
        }
        if (!location) throw Error('A free physical palisade corridor is required');
        Object.assign(d.player, location.player);
        const id = d.nextId++, observed = { id: d.nextId++, kind: 'walker', x: location.player.x - 64, y: location.player.y, health: 40, attackCooldown: 0 }, hidden = { id: d.nextId++, kind: 'walker', ...location.hidden, health: 40, attackCooldown: 0 };
        d.buildings.push({ id, type: 'woodWall', gx: location.wall.gx, gy: location.wall.gy, rotation: 0, progress: 1, health: C.BUILDINGS.woodWall.health, corpseLoad: 0 });
        d.urban.peakScore = Math.max(d.urban.peakScore, C.Urban.score(d.buildings));
        d.zombies = [observed, hidden];
        globalThis.__VIS_FIXTURE146__ = { wallId: id, observedId: observed.id, hiddenId: hidden.id, location };
        return { wallId: id, contacts: [observed, hidden], player: location.player, changed: ['player.x', 'player.y', 'nextId', 'buildings(+palissade)', 'urban.peakScore(consistent fixture structure score)', 'zombies(two prepared walkers)'] };
      }));
      await openCommand(page, viewport.touch, 'enclosure');
      profile.paints.wall = await painted(page, ['minimap', 'commandMap129']); checkPaint(check, profile.paints.wall, { minimap: 1, commandMap129: 1 }, 'Real palisade occlusion');
      check('Physical wall actually blocks the prepared hidden contact', await page.evaluate(() => { const f = __VIS_FIXTURE146__, e = DEADWALL.zombies.find(z => z.id === f.hiddenId); return !DEADWALL.hostileLineClear(DEADWALL.player, e) && !DEADWALL.visibility.canSeeLocal(e); }));
      await screenshot('fixture-wall-command'); profile.wallContinue = await continuePaused(page, viewport.touch);
      check('Continue preserves the wall, contacts, RNG and all possessions', profile.wallContinue.pass && profile.wallContinue.observedContacts.markers.length === 1);
      profile.fixtures.push(await restoreFixture(page, 'remove-fixture-palisade', (g, d) => { const id = d.buildings.find(b => b.type === 'woodWall' && b.gx >= 24 && b.gx < 48 && b.gy >= 24 && b.gy < 48)?.id; if (!id) throw Error('Prepared wall missing'); d.buildings = d.buildings.filter(b => b.id !== id); return { removedWallId: id, changed: ['buildings(remove fixture wall)'] }; }));
      await openCommand(page, viewport.touch, 'enclosure'); profile.paints.open = await painted(page, ['minimap', 'commandMap129']); checkPaint(check, profile.paints.open, { minimap: 2, commandMap129: 2 }, 'Open physical line');
      profile.fixtures.push(await restoreFixture(page, 'observer-out-of-range', (g, d) => { const p = { x: 200, y: 200 }; if (!g.friendlyPositionClear(g.player, p.x, p.y)) throw Error('Observer departure fixture must be physically free'); Object.assign(d.player, p); return { player: p, changed: ['player.x', 'player.y'] }; }));
      await openCommand(page, viewport.touch, 'enclosure'); profile.paints.away = await painted(page, ['minimap', 'commandMap129']); checkPaint(check, profile.paints.away, { minimap: 0, commandMap129: 0 }, 'Observer departed');
      await screenshot('fixture-observer-away');

      profile.fixtures.push(await restoreFixture(page, 'regional-members-and-risen', (g, d) => {
        const w = g.frontier.world(), h = DeadwallAtlasProjection.home(g); let p;
        for (const road of w.roads) {
          const q = { x: (road.a.x + road.b.x) / 2, y: (road.a.y + road.b.y) / 2 };
          if (Math.hypot(q.x - h.x, q.y - h.y) < 300 || w.nearPOI(q.x, q.y, 90).length) continue;
          if ([0, 6, 9, 50].some(dx => w.blocked(q.x + dx, q.y, .4, 0, null)) || !w.line(q, { x: q.x + 50, y: q.y }, 0, null, null, .015)) continue;
          p = q; break;
        }
        if (!p) throw Error('Free regional road required');
        Object.assign(d.frontier, { active: true, anchor: { x: d.player.x, y: d.player.y }, ...p, z: 0, inside: null, car: null }); d.worldEvolution.companions = [];
        const contact = dx => ({ x: p.x + dx, y: p.y, z: 0, a: 0, mode: 'idle', ttl: 0, gx: p.x + dx, gy: p.y, cool: 0 });
        d.worldEvolution.serial = 1; d.worldEvolution.groups = [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0, x: p.x + 6, y: p.y, a: 0, seen: true, fallen: [], injuries: {}, contacts: { 0: contact(6), 1: contact(50) } }];
        d.succession133.serial = 2; d.succession133.current.number = 2;
        d.succession133.remains = [{ id: 1, profile: 'commander', point: { domain: 'region', x: p.x + 9, y: p.y, z: 0, inside: null, angle: 0 }, bag: DeadwallCore.makeBag(), magazine: Object.fromEntries(Object.keys(DeadwallCore.WEAPONS).map(k => [k, 0])), weapons: [], gear: DeadwallPlayerPack131.initial(), kits: { light: 0, aid: 0, brace: 0, decoy: 0 }, body: { phase: 'risen', left: 0, roll: 0, x: p.x + 9, y: p.y, health: DeadwallCore.SuccessionRules.health, zombieId: null }, time: d.elapsed }];
        return { player: p, groupCount: 80, savedMemberPositions: [contact(6), contact(50)], risen: { x: p.x + 9, y: p.y, z: 0 }, changed: ['frontier pose/domain', 'worldEvolution.companions(remove UI fixture roster)', 'worldEvolution one group/two saved contacts', 'succession133 one empty risen body/serial/current.number'] };
      }));
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#reconTab', viewport.touch);
      await page.locator('#frontierMap').waitFor({ state: 'visible' }); await activate(page, '#atlasHome', viewport.touch); await page.locator('#frontierMap').focus(); await page.keyboard.press('3');
      profile.paints.region = await painted(page, ['minimap', 'frontierMap']); checkPaint(check, profile.paints.region, { minimap: 2, frontierMap: 2 }, 'Regional current contacts');
      check('Atlas visibly labels its current ground-floor contacts', profile.paints.region.legend.includes('CONTACTS OBSERVÉS · RDC'));
      check('A known group of eighty reveals only its one observed streamed member', await page.evaluate(() => { const m = DEADWALL.worldEvolution.groupMembers(); return m.length === 2 && DEADWALL.visibility.canSeeRegional(m[0]) && !DEADWALL.visibility.canSeeRegional(m[1]) && DEADWALL.worldEvolution.snapshot().groups[0].count === 80; }));
      await screenshot('fixture-regional-observed');
      profile.paints.region.legendViewport = await visibleAtlasLegend(page);
      check('Regional legend is genuinely readable in the dossier viewport after ordinary scrolling', profile.paints.region.legendViewport.visible);
      await screenshot('fixture-regional-legend');
      profile.regionalContinue = await continuePaused(page, viewport.touch);
      check('Regional Continue preserves every field and immediately paints current contacts', profile.regionalContinue.pass && profile.regionalContinue.observedContacts.markers.length === 2);
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#reconTab', viewport.touch); await page.locator('#frontierMap').focus(); await page.keyboard.press('3');
      profile.fixtures.push(await page.evaluate(() => { const g = DEADWALL; if (!g.paused || g.urban.lightingState().flashlight || g.frontier.position().car) throw Error('Blackout scene requires a paused unlit pedestrian'); globalThis.__BEFORE_BLACKOUT146__ = g.serialize(); g.wave = 4; g.phase = 'assault'; return { type: 'paused-blackout-wave4', changed: ['wave=4', 'phase=assault'], note: 'Temporary read-only visibility scene; no update/time/spawn is injected, and the previous validated scene is restored afterwards.' }; }));
      profile.paints.blackout = await painted(page, ['minimap', 'frontierMap']); checkPaint(check, profile.paints.blackout, { minimap: 0, frontierMap: 0 }, 'Unlit blackout');
      check('Blackout uses the existing night schedule and narrows unlit observation', profile.paints.blackout.diagnostics.blackout && profile.paints.blackout.diagnostics.ambient === await page.evaluate(() => DeadwallCore.VisibilityRules146.nightFloor));
      await screenshot('fixture-blackout');
      await page.evaluate(() => { DEADWALL.restoreSave(__BEFORE_BLACKOUT146__); DEADWALL.togglePause(true); });

      profile.fixtures.push(await restoreFixture(page, 'physical-upper-floor', (g, d) => {
        const w = g.frontier.world(), G = DeadwallFrontierGeometry; let p, poi, e;
        for (const candidate of w.pois.filter(p => p.levels.includes(1))) {
          const stairs = w.plan(candidate, 1).stairs[0]; if (!stairs) continue;
          const from = G.global(candidate, stairs.x + stairs.w / 2, stairs.y + stairs.h / 2);
          if (w.blocked(from.x, from.y, .4, 1, candidate.id)) continue;
          for (let a = 0; a < Math.PI * 2; a += .2) { const to = { x: from.x + Math.cos(a) * 2.4, y: from.y + Math.sin(a) * 2.4 }, local = G.local(candidate, to.x, to.y); if (local.x < .4 || local.y < .4 || local.x > candidate.w - .4 || local.y > candidate.h - .4 || w.blocked(to.x, to.y, .3, 1, candidate.id) || !w.line(from, to, 1, candidate.id, null, .015)) continue; p = from; e = to; poi = candidate; break; }
          if (p) break;
        }
        if (!p) throw Error('Free upper-floor stair geometry required');
        Object.assign(d.frontier, { ...p, z: 1, inside: poi.id }); const r = d.succession133.remains[0]; Object.assign(r.point, e, { z: 1, inside: poi.id }); Object.assign(r.body, e);
        return { player: { ...p, z: 1, inside: poi.id }, risen: { ...e, z: 1, inside: poi.id }, changed: ['frontier pose/level/inside', 'existing risen body point/pose/level'] };
      }));
      await openCommand(page, viewport.touch, 'field'); await activate(page, '#reconTab', viewport.touch); await page.locator('#frontierMap').focus(); await page.keyboard.press('3');
      profile.paints.upper = await painted(page, ['minimap', 'frontierMap']); checkPaint(check, profile.paints.upper, { minimap: 1, frontierMap: 1 }, 'Current upper floor');
      check('Atlas displays its real upper-floor legend and excludes ground contacts', profile.paints.upper.legend.includes('CONTACTS OBSERVÉS · ÉTAGE 1'));
      await screenshot('fixture-upper-floor');
      profile.paints.upper.legendViewport = await visibleAtlasLegend(page);
      check('Upper-floor legend is genuinely readable in the dossier viewport after ordinary scrolling', profile.paints.upper.legendViewport.visible);
      await screenshot('fixture-upper-floor-legend');
      check('Browser/page/HTTP/request collectors contain no errors', errors() === 0);
      profile.fixtureChecks = profile.checks.slice(profile.native.checks.length);
      profile.pass = true;
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.inputFailure = error.deadwallInput;
      await screenshot('failure').catch(() => {}); throw error;
    } finally {
      try { await context.close(); } catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; throw error; }
    }
  }
  report.pass = report.profiles.length > 0 && report.profiles.every(profile => profile.pass);
} catch (error) { report.pass = false; report.failure = error.stack; process.exitCode = 1; }
finally {
  report.normalizedFields = [...new Set(report.profiles.flatMap(profile => [profile.native?.continue, profile.wallContinue, profile.regionalContinue]
    .flatMap(checkpoint => checkpoint?.restoreComparison?.normalizedFields || [])))];
  try { await harness.close(); } finally { await harness.finish(); }
}
