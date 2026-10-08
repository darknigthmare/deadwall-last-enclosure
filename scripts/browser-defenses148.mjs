import assert from 'node:assert/strict';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel } from './browser-qa-common144.mjs';
import { defenseCampFixture, defenseServiceFixture, defensePlanSiteFixture, defenseContactFixture, defenseHeldContactDepartureFixture } from './browser-defenses-fixtures148.mjs';

const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }, { name: 'mobile-landscape', width: 844, height: 390, touch: true }];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = selected ? views.filter(view => selected.includes(view.name)) : views;
const harness = await createHarness('defenses', 'NATIVE: fresh seed903148, real held keyboard/touch travel and actual construction, fortification and armory menus. New plan clicks explain the missing office without a transaction. No native stock, actor, terrain, timer or RNG assignment. ADVANCED EXPLICIT FIXTURES: legal completed office/storage/workshop/spikes and actual built-score tier, finite depot/bag material, physically free service points and separate finite24-contact late-wave scenes. Actual canvas/menu buttons preview, cancel and finance both plans; actual armory and fortification buttons start ordinary RAF jobs with final payment. Real pause/save/reload/Continue tests partial-job cancellation and exact acquired state, including modern queue order. Real field input shoots a shielded infected; ordinary RAF exercises finite trap charges and charger stages. Maps and HUD use real visibility146; hidden new infected never become observed contacts. No organic late-wave progression, endurance, balance, physical-device or certification claim.');
const { browser, base, report, output } = harness;
report.profiles = []; report.normalizedFields = [];
const material = page => page.evaluate(() => { const { timestamp, ...s } = DEADWALL.serialize(); return JSON.stringify(s); });
const economics = page => page.evaluate(() => ({ wood: DEADWALL.resources.wood, scrap: DEADWALL.resources.scrap, ammo: DEADWALL.resources.ammo,
  bag: { ...DEADWALL.player.carry }, armory: DEADWALL.arsenal134.snapshot(), fitting: DEADWALL.fortificationPack.snapshot(),
  job: DEADWALL.fortificationPack.job ? { kind: DEADWALL.fortificationPack.job.kind, elapsed: DEADWALL.fortificationPack.job.elapsed, seconds: DEADWALL.fortificationPack.job.seconds } : null,
  task: DEADWALL.arsenal134.view().task, elapsed: DEADWALL.elapsed }));

async function command(page, touch, tab) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandTab-' + tab, touch);
  else await openCommand(page, touch, tab);
}
async function fortifications(page, touch) {
  await command(page, touch, 'field'); await activate(page, '#expansionFieldTab', touch);
  await activate(page, '#expansionGroup-defense', touch); await activate(page, '#expansionTab-fortification', touch);
}
async function armory(page, touch) {
  await command(page, touch, 'field'); await activate(page, '#expansionFieldTab', touch);
  await activate(page, '#expansionGroup-player', touch); await activate(page, '#expansionTab-arsenal134', touch);
  await activate(page, '#expansionAction-arsenal134-open', touch);
  await page.locator('#arsenal134').waitFor({ state: 'visible' });
}
async function dayworks(page, touch) { await command(page, touch, 'field'); await activate(page, '#dayworksTab', touch); }
async function control(page, selector, container, check, name) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const box = await visibleInPanel(page, selector, container);
  check(name + ': actual control is visible, hit-testable and at least 44px high', box.pass && box.box.height >= 44);
}
async function unpause(page, touch) {
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}
async function saveContinue(page, touch) {
  const camp = await page.evaluate(() => globalThis.__DEFENSE148_CAMP__ || null);
  if (await page.locator('#arsenal134').isVisible()) await activate(page, '#arsenal134 [data-action="close"]', touch);
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  if (!await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseButton', touch);
  await activate(page, '#saveButton', touch);
  const expected = await page.evaluate(() => { const { timestamp, ...data } = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)); return { ok: DEADWALL.lastSaveStatus.ok, data }; });
  assert.ok(expected.ok, 'Real save succeeds');
  await activate(page, '#quitButton', touch); await page.reload({ waitUntil: 'networkidle' }); await ready(page);
  await page.evaluate(() => {
    const g = DEADWALL, restore = g.restoreSave.bind(g);
    g.restoreSave = (...args) => { const result = restore(...args); const { timestamp, ...data } = DeadwallSave.validate(g.serialize());
      globalThis.__DEFENSE148_RESTORED__ = data; g.togglePause(true); return result; };
  });
  await activate(page, '#continueButton', touch); await page.waitForFunction(() => DEADWALL.state === 'playing' && DEADWALL.paused);
  if (camp) await page.evaluate(camp => {
    for (const [type, id] of Object.entries(camp)) if (DEADWALL.world.buildings.get(id)?.type !== type) throw Error('Restored fixture support identity changed');
    globalThis.__DEFENSE148_CAMP__ = camp;
  }, camp);
  return page.evaluate(expected => {
    const actual = globalThis.__DEFENSE148_RESTORED__, keys = new Set([...Object.keys(expected), ...Object.keys(actual || {})]);
    const changedKeys = [...keys].filter(k => JSON.stringify(expected[k]) !== JSON.stringify(actual?.[k]));
    return { pass: changedKeys.length === 0, changedKeys, normalizedFields: [], expectedQueue: expected.spawnQueue, restoredQueue: actual?.spawnQueue,
      expectedPending: expected.pendingSpawns, restoredPending: actual?.pendingSpawns, expectedRNG: expected.randomState, restoredRNG: actual?.randomState,
      zombies: actual?.zombies, armory: DEADWALL.arsenal134.snapshot(), fortification: DEADWALL.fortificationPack.snapshot(), task: DEADWALL.arsenal134.view().task };
  }, expected.data);
}

async function maps(page, touch, check, expected, capture) {
  await command(page, touch, 'enclosure');
  const map = page.locator('#commandMap129');
  const summary = await map.evaluate(node => { const d = node.closest('details'); if (!d) return null; d.dataset.qaDefense148Map = 'true'; return !!d.open; });
  if (summary === false) await activate(page, '[data-qa-defense148-map] > summary', touch);
  await map.scrollIntoViewIfNeeded();
  check('Map: actual disclosed canvas is inside the clipped command body', (await visibleInPanel(page, '#commandMap129', '.command-body')).pass);
  const measured = await page.evaluate(() => {
    const g = DEADWALL, material = () => { const { timestamp, ...s } = g.serialize(); return JSON.stringify(s); }, before = material();
    const proto = CanvasRenderingContext2D.prototype, originals = {}, markers = { minimap: 0, commandMap129: 0 };
    for (const method of ['fillRect', 'arc']) { originals[method] = proto[method]; proto[method] = function (...args) {
      if (Object.hasOwn(markers, this.canvas?.id) && /^#(?:b64f45|aa3934|cb8270)$/i.test(this.fillStyle)) markers[this.canvas.id]++;
      return originals[method].apply(this, args);
    }; }
    try { g.renderMinimap(); g.commandPresentation.refresh(true); }
    finally { for (const method of Object.keys(originals)) proto[method] = originals[method]; }
    const frame = g.visibility.frame(), observed = g.zombies.filter(z => !z.dead && z.health > 0 && frame.canSeeLocal(z)).length;
    return { markers, observed, unchanged: before === material(), actors: g.zombies.filter(z => !z.dead && z.health > 0).length, hud: g.battlefieldUI.snapshot().observedContacts };
  });
  check('Map: HUD and both painted maps agree with real current visibility for new enemies', measured.observed === expected && measured.hud === expected && measured.markers.minimap === expected && measured.markers.commandMap129 === expected);
  check('Map: reading contacts changes no persisted field or RNG', measured.unchanged);
  if (capture) await capture();
  return measured;
}

async function planPreview(page, touch, id, site) {
  await dayworks(page, touch); await activate(page, '#plan-' + id, touch); await page.waitForFunction(() => DEADWALL.dayworks.workContext().placing && !DEADWALL.paused);
  await page.waitForFunction(() => { const g = DEADWALL, targetX = Math.max(g.width / g.camera.zoom / 2, Math.min(DeadwallCore.WORLD_SIZE - g.width / g.camera.zoom / 2, g.player.x)),
    targetY = Math.max(g.height / g.camera.zoom / 2, Math.min(DeadwallCore.WORLD_SIZE - g.height / g.camera.zoom / 2, g.player.y));
    return Math.abs(g.camera.x - targetX) < .05 && Math.abs(g.camera.y - targetY) < .05; });
  const point = await page.evaluate(site => { const g = DEADWALL, r = document.getElementById('game').getBoundingClientRect();
    const x = ((site.gx + .5) * DeadwallCore.TILE - g.camera.x) * g.camera.zoom + g.width / 2;
    const y = ((site.gy + .5) * DeadwallCore.TILE - g.camera.y) * g.camera.zoom + g.height / 2;
    const px = r.x + x * r.width / g.width, py = r.y + y * r.height / g.height;
    return { x: px, y: py, hit: document.elementFromPoint(px, py)?.id, safe: g.hud135.safeFrame() }; }, site);
  assert.equal(point.hit, 'game', 'Actual plan anchor is a free canvas point before input');
  if (touch) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
  await page.locator('#dayworksCommit').waitFor({ state: 'visible' });
  const actual = await page.evaluate(() => DEADWALL.dayworks.overview().preview);
  assert.ok(actual?.id === id && actual.gx === site.gx && actual.gy === site.gy && actual.quote?.ok,
    'Real canvas click anchors exactly the legally quoted plan: ' + JSON.stringify({ intended: { id, gx: site.gx, gy: site.gy }, actual, point }));
  return { intended: { id, gx: site.gx, gy: site.gy }, actual, point };
}

async function expireHeldContacts(page, touch, profile, check) {
  const before = await page.evaluate(() => DEADWALL.fortificationPack.snapshot().fittings.find(f => f.id === globalThis.__DEFENSE148_CAMP__.spikes).mechanism);
  if (!before.caught.length) return;
  profile.fixtures.push(await page.evaluate(defenseHeldContactDepartureFixture));
  await activate(page, '#resumeButton', touch); await page.waitForFunction(() => DEADWALL.fortificationPack.snapshot().fittings.every(f => !f.mechanism?.caught.length)); await activate(page, '#pauseButton', touch);
  check('Actual RAF expires the saved hold after physical contact departure without charging another trigger', await page.evaluate(before => { const m = DEADWALL.fortificationPack.snapshot().fittings.find(f => f.id === globalThis.__DEFENSE148_CAMP__.spikes).mechanism; return m.caught.length === 0 && m.charges === before.charges; }, before));
}

try {
  assert.ok(profiles.length, 'At least one known defense QA profile is required');
  for (const viewport of profiles) {
    const profile = { viewport, native: { fixtures: [], checks: [], pass: false }, fixtures: [], fixtureChecks: [], checkpoints: [] }; report.profiles.push(profile);
    let context, page;
    try {
      context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
      page = await context.newPage(); page.setDefaultTimeout(30000);
      const rec = recorder(page, profile, output, viewport.name + '-');
      const scoped = (scope, name, pass = true) => { scope.push({ name, pass: !!pass }); rec.check(name, pass); };
      const native = (name, pass) => scoped(profile.native.checks, name, pass), advanced = (name, pass) => scoped(profile.fixtureChecks, name, pass);
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page); await chooseCampaign(page, '903148'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      const start = await page.evaluate(() => ({ x: DEADWALL.player.x, y: DEADWALL.player.y }));
      await holdInput(page, context, viewport.touch, 'KeyD', '#touchControls [data-dir="right"]', () => page.waitForTimeout(400));
      native('Native fresh campaign responds to genuine held keyboard/touch travel', await page.evaluate(p => Math.hypot(DEADWALL.player.x - p.x, DEADWALL.player.y - p.y) > 20, start));
      await dayworks(page, viewport.touch);
      for (const [id, count] of [['spikedApproach', 17], ['maintenanceRedoubt', 27]]) {
        const selector = '#plan-' + id; await control(page, selector, '.command-body', native, 'Native ' + id);
        native('Native ' + id + ' explains its partial sides and ordinary construction', await page.locator(selector).evaluate((n, count) => n.closest('.dw14-plan')?.textContent.includes(String(count)) || n.parentElement.textContent.includes('côtés') || n.parentElement.textContent.includes('Côtés'), count));
        const before = await material(page); await activate(page, selector, viewport.touch);
        native('Native ' + id + ' click explains the missing construction office', (await page.locator('#dayworksStatus').innerText()).includes('Bureau de chantier achevé requis'));
        native('Native refused ' + id + ' preserves every persisted field and RNG', before === await material(page));
      }
      await rec.screenshot('native-plan-prerequisites');
      await activate(page, '#expansionFieldTab', viewport.touch); await activate(page, '#expansionGroup-defense', viewport.touch); await activate(page, '#expansionTab-fortification', viewport.touch);
      const nativeBefore = await material(page);
      for (const kind of ['ankle', 'blades']) {
        const selector = '#expansionAction-fortification-mechanism-' + kind; await control(page, selector, '.command-body', native, 'Native ' + kind);
        const details = page.locator(selector).locator('xpath=..').locator('details');
        if (await details.count() && !await details.evaluate(n => n.open)) {
          const summary = details.locator('summary'); if (viewport.touch) await summary.tap(); else await summary.click();
        }
        const choice = await page.locator(selector).evaluate(n => ({ disabled: n.disabled, card: n.closest('.expansion-action').textContent, reason: document.getElementById(n.id + '-reason')?.textContent }));
        native('Native ' + kind + ' exposes finite uses, bag cost and an honest unavailable reason', choice.disabled && !!choice.reason && choice.card.includes('6') && choice.card.includes('dans le sac'));
      }
      native('Native fortification menu creates no fitting, stock or RNG', nativeBefore === await material(page));
      await armory(page, viewport.touch); await activate(page, '#arsenal134 [data-action="tab:catalog"]', viewport.touch);
      const catalogBefore = await material(page);
      for (const id of ['assemblyHammer', 'wreckingBar', 'singleShot']) {
        const selector = '#arsenal134 [data-action="craft:' + id + '"]'; await control(page, selector, '.arsenal134-grid', native, 'Native ' + id);
        native('Native ' + id + ' presents actual material, mass and physical crafting prerequisite', await page.locator(selector).evaluate(n => { const card = n.closest('.arsenal134-card'); return card.textContent.includes('kg') && card.querySelector('.arsenal134-cost').textContent.includes('palier') && !!card.querySelector('.arsenal134-reason').textContent; }));
      }
      native('Native catalog reads preserve every persisted field including ammunition', catalogBefore === await material(page)); await rec.screenshot('native-new-crafting');
      profile.checkpoints.push(await saveContinue(page, viewport.touch)); native('Native Save/Continue preserves the entire campaign before first RAF', profile.checkpoints.at(-1).pass);
      profile.native.pass = profile.native.checks.every(c => c.pass);

      const campFixture = await page.evaluate(defenseCampFixture); profile.fixtures.push(campFixture);
      advanced('Prepared camp derives tier2 from real completed buildings and gives no crafted item or trap', await page.evaluate(() => DEADWALL.tier.id >= 2 && DEADWALL.fortificationPack.snapshot().fittings.length === 0 && !DEADWALL.arsenal134.snapshot().locker.length));
      for (const [id, count] of [['spikedApproach', 17], ['maintenanceRedoubt', 27]]) {
        await dayworks(page, viewport.touch);
        const fixture = await page.evaluate(defensePlanSiteFixture, id); profile.fixtures.push(fixture);
        const unplaced = await page.evaluate(() => ({ resources: { ...DEADWALL.resources }, ids: [...DEADWALL.world.buildings.keys()] }));
        (profile.previews ||= []).push(await planPreview(page, viewport.touch, id, fixture.site));
        const preview = await page.evaluate(() => ({ resources: { ...DEADWALL.resources }, ids: [...DEADWALL.world.buildings.keys()], rng: DEADWALL.random.state }));
        advanced(id + ': actual correctly anchored preview allocates no foundation and debits no recipe material', JSON.stringify(preview.ids) === JSON.stringify(unplaced.ids) && Object.keys(fixture.site.cost).every(k => preview.resources[k] === unplaced.resources[k]));
        await control(page, '#dayworksCancel', '.command-body', advanced, id + ' cancellation'); await activate(page, '#dayworksCancel', viewport.touch);
        advanced(id + ': real cancel retains all buildings, material and RNG', await page.evaluate(b => JSON.stringify(b.resources) === JSON.stringify(DEADWALL.resources) && JSON.stringify(b.ids) === JSON.stringify([...DEADWALL.world.buildings.keys()]) && b.rng === DEADWALL.random.state, preview));
        profile.previews.push(await planPreview(page, viewport.touch, id, fixture.site)); await control(page, '#dayworksCommit', '.command-body', advanced, id + ' funding');
        const before = await page.evaluate(() => ({ resources: { ...DEADWALL.resources }, ids: [...DEADWALL.world.buildings.keys()], rng: DEADWALL.random.state }));
        await activate(page, '#dayworksCommit', viewport.touch);
        const after = await page.evaluate(before => ({ resources: { ...DEADWALL.resources }, rng: DEADWALL.random.state,
          placed: [...DEADWALL.world.buildings.values()].filter(b => !before.ids.includes(b.id)).map(b => ({ id: b.id, type: b.type, progress: b.progress, corpseLoad: b.corpseLoad })), fittings: DEADWALL.fortificationPack.snapshot().fittings }), before);
        advanced(id + ': real finance creates exactly the paid unfinished foundations', after.placed.length === count && after.placed.every(b => b.progress === 0 && b.corpseLoad === 0));
        advanced(id + ': full derived material cost is paid once without RNG or free equipment', Object.keys(before.resources).every(k => after.resources[k] === before.resources[k] - (fixture.site.cost[k] || 0)) && before.rng === after.rng && after.fittings.length === 0);
        profile[id] = { fixture, before, after }; await rec.screenshot('paid-' + id);
      }
      profile.checkpoints.push(await saveContinue(page, viewport.touch)); advanced('Continue keeps both paid plans as foundations, with full material and modern queue equality', profile.checkpoints.at(-1).pass);

      profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'workshop' }));
      await armory(page, viewport.touch); await activate(page, '#arsenal134 [data-action="tab:catalog"]', viewport.touch);
      const partialBefore = await economics(page); await activate(page, '#arsenal134 [data-action="craft:assemblyHammer"]', viewport.touch);
      await page.waitForFunction(() => DEADWALL.arsenal134.view().task?.elapsed > .25 && !DEADWALL.paused);
      await activate(page, '#pauseButton', viewport.touch); const paused = await economics(page); await page.waitForTimeout(450);
      advanced('Real Pause freezes an unfinished workshop assembly without advance payment', JSON.stringify(paused) === JSON.stringify(await economics(page)) && paused.wood === partialBefore.wood && paused.scrap === partialBefore.scrap && paused.armory.locker.length === partialBefore.armory.locker.length);
      profile.checkpoints.push(await saveContinue(page, viewport.touch)); const cancelled = await economics(page);
      advanced('Continue cancels only the transient unfinished assembly, preserving all saved material and acquired possessions', profile.checkpoints.at(-1).pass && cancelled.task === null && cancelled.wood === partialBefore.wood && cancelled.scrap === partialBefore.scrap && JSON.stringify(cancelled.armory) === JSON.stringify(partialBefore.armory));
      for (const id of ['assemblyHammer', 'wreckingBar', 'singleShot']) {
        profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: id === 'singleShot' ? 'core' : 'workshop' }));
        await armory(page, viewport.touch); await activate(page, '#arsenal134 [data-action="tab:catalog"]', viewport.touch);
        const selector = '#arsenal134 [data-action="craft:' + id + '"]'; await control(page, selector, '.arsenal134-grid', advanced, 'Paid ' + id);
        const before = await economics(page), quote = await page.evaluate(id => DEADWALL.arsenal134.preview('craft', id), id);
        advanced(id + ': preview proves its real operational physical support', quote.ok && (id === 'singleShot' || quote.station?.id === await page.evaluate(() => globalThis.__DEFENSE148_CAMP__.workshop)));
        await activate(page, selector, viewport.touch); await page.waitForFunction(() => DEADWALL.arsenal134.view().task?.elapsed > .1);
        const started = await economics(page); advanced(id + ': actual button closes its modal and starts unpaid timed assembly', !(await page.locator('#arsenal134').isVisible()) && started.wood === before.wood && started.scrap === before.scrap);
        await page.waitForFunction(() => !DEADWALL.arsenal134.busy(), null, { timeout: 15000 }); await activate(page, '#pauseButton', viewport.touch);
        const finished = await economics(page), made = finished.armory.locker.filter(item => !before.armory.locker.some(old => old.uid === item.uid));
        advanced(id + ': ordinary RAF pays only the exact final recipe and adds one empty ready item', finished.wood === before.wood - quote.cost.wood && finished.scrap === before.scrap - quote.cost.scrap && finished.ammo === before.ammo && made.length === 1 && made[0].id === id && made[0].rounds === 0 && made[0].condition === 100);
        (profile.crafted ||= []).push({ id, quote, before, finished, item: made[0] });
        if (id === 'assemblyHammer') {
          await armory(page, viewport.touch); await activate(page, '#arsenal134 [data-action="tab:locker"]', viewport.touch);
          advanced('A physically completed workshop gives no remote withdrawal from the depot', await page.locator('#arsenal134 [data-action="move:' + made[0].uid + '"]').isDisabled());
          await rec.screenshot('paid-workshop-item'); await activate(page, '#arsenal134 [data-action="close"]', viewport.touch);
        }
      }
      await armory(page, viewport.touch); await activate(page, '#arsenal134 [data-action="tab:locker"]', viewport.touch); const beforeTake = await economics(page);
      for (const crafted of profile.crafted) await activate(page, '#arsenal134 [data-action="move:' + crafted.item.uid + '"]', viewport.touch);
      await activate(page, '#arsenal134 [data-action="tab:carried"]', viewport.touch); const gun = profile.crafted.find(item => item.id === 'singleShot').item;
      await activate(page, '#arsenal134 [data-action="equip:' + gun.uid + '"]', viewport.touch); const taken = await economics(page);
      advanced('Real depot withdrawal and equip preserve recipe material, keep empty one-round carbine and obey 22kg cap', taken.wood === beforeTake.wood && taken.scrap === beforeTake.scrap && taken.ammo === beforeTake.ammo && profile.crafted.every(item => taken.armory.carried.some(i => i.uid === item.item.uid)) && taken.armory.equipped === gun.uid && await page.evaluate(() => DEADWALL.arsenal134.view().weight <= DeadwallCore.Arsenal134Rules.carryKg && DEADWALL.arsenal134.weaponSpec().magazine === 1));
      await rec.screenshot('paid-empty-carbine'); profile.checkpoints.push(await saveContinue(page, viewport.touch)); advanced('Continue exactly preserves all three paid possessions, equipped carbine and empty magazine', profile.checkpoints.at(-1).pass);

      for (const kind of ['ankle', 'blades']) {
        const recipe = await page.evaluate(kind => DeadwallCore.FortificationPackRules.mechanisms[kind], kind);
        profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'spikes', bag: recipe.cost })); await fortifications(page, viewport.touch);
        if (kind === 'blades') { await activate(page, '#expansionAction-fortification-remove-mechanism', viewport.touch); }
        const selector = '#expansionAction-fortification-mechanism-' + kind; await control(page, selector, '.command-body', advanced, 'Paid ' + kind);
        const before = await economics(page); advanced(kind + ': real finite bag and physical support make the action eligible', await page.locator(selector).isEnabled());
        await activate(page, selector, viewport.touch); await unpause(page, viewport.touch);
        await page.waitForFunction(() => DEADWALL.fortificationPack.job?.elapsed > .2); const started = await economics(page);
        advanced(kind + ': work begins with real tray progress, no advance bag or depot payment', started.job.kind === 'mechanism' && JSON.stringify(started.bag) === JSON.stringify(before.bag) && started.wood === before.wood && started.scrap === before.scrap && (await page.locator('#expansionWork').innerText()).includes(recipe.name));
        await page.waitForFunction(() => !DEADWALL.fortificationPack.busy(), null, { timeout: 18000 }); await activate(page, '#pauseButton', viewport.touch); const finished = await economics(page);
        const mechanism = finished.fitting.fittings.find(f => f.id === profile.fixtures.at(-1).support)?.mechanism;
        advanced(kind + ': ordinary RAF pays exactly once from the bag and installs six finite charges', mechanism?.kind === kind && mechanism.charges === 6 && Object.entries(recipe.cost).every(([k, n]) => finished.bag[k] === before.bag[k] - n) && finished.wood === before.wood && finished.scrap === before.scrap && finished.ammo === before.ammo);
        await fortifications(page, viewport.touch); advanced(kind + ': an installed charged mechanism prevents a free duplicate', await page.locator(selector).isDisabled());
        await page.locator(selector).scrollIntoViewIfNeeded(); await rec.screenshot('paid-' + kind); await activate(page, '#commandReturn129', viewport.touch);
        profile.fixtures.push(await page.evaluate(defenseContactFixture, { kind: kind === 'ankle' ? 'charger' : 'shielded', trap: true }));
        const contact = profile.fixtures.at(-1), healthBefore = await page.evaluate(id => DEADWALL.zombies.find(z => z.id === id).health, contact.ids[0]);
        await activate(page, '#resumeButton', viewport.touch);
        await page.waitForFunction(() => DEADWALL.fortificationPack.snapshot().fittings.some(f => f.mechanism?.charges === 5)); await activate(page, '#pauseButton', viewport.touch);
        const effect = await page.evaluate(id => { const z = DEADWALL.zombies.find(z => z.id === id), m = DEADWALL.fortificationPack.snapshot().fittings.find(f => f.id === globalThis.__DEFENSE148_CAMP__.spikes).mechanism;
          return { health: z.health, stagger: z.stagger, charge: z.charge, mechanism: m }; }, contact.ids[0]);
        (profile.mechanismEffects ||= []).push({ kind, healthBefore, effect, contact });
        advanced(kind + ': real contact consumes one charge and damages the special infected with normal trap damage', effect.mechanism.charges === 5 && healthBefore - effect.health >= recipe.damage && healthBefore - effect.health < recipe.damage + 8);
        if (kind === 'ankle') advanced('Actual ankle contact interrupts a charger and holds finite saved stagger/attack delay', effect.charge.stage === 'recover' && effect.stagger > 2 && effect.mechanism.caught.some(c => c.id === contact.ids[0]));
        profile.checkpoints.push(await saveContinue(page, viewport.touch)); advanced(kind + ': Continue preserves charge, caught hold, special facing/state and all saved fields exactly', profile.checkpoints.at(-1).pass);
        // Retain the fixture identities as evidence; only actual saved supports are selected.
        await page.evaluate(camp => { globalThis.__DEFENSE148_CAMP__ = Object.fromEntries(camp.added.map(b => [b.type, b.id])); }, campFixture);
        if (kind === 'ankle') {
          await expireHeldContacts(page, viewport.touch, profile, advanced);
          profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'core' })); profile.fixtures.push(await page.evaluate(defenseContactFixture, { kind: 'armored', trap: true, count: 6 }));
          await activate(page, '#resumeButton', viewport.touch); await page.waitForFunction(() => DEADWALL.fortificationPack.snapshot().fittings.some(f => f.mechanism?.charges === 0), null, { timeout: 18000 }); await activate(page, '#pauseButton', viewport.touch);
          advanced('Remaining finite ankle charges actually exhaust against ordinary-health physical contacts', await page.evaluate(() => DEADWALL.fortificationPack.snapshot().fittings.find(f => f.id === globalThis.__DEFENSE148_CAMP__.spikes).mechanism.charges === 0));
          await expireHeldContacts(page, viewport.touch, profile, advanced);
          profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'spikes', bag: recipe.cost })); await fortifications(page, viewport.touch);
          advanced('An exhausted mount can be renewed only with another real bag cost and no held contact', await page.locator(selector).isEnabled());
          await activate(page, selector, viewport.touch); await unpause(page, viewport.touch); await page.waitForFunction(() => !DEADWALL.fortificationPack.busy(), null, { timeout: 15000 }); await activate(page, '#pauseButton', viewport.touch);
          advanced('Paid renewal restores the fixed cap6 and consumes its entire second bag', await page.evaluate(() => { const g = DEADWALL, m = g.fortificationPack.snapshot().fittings.find(f => f.id === globalThis.__DEFENSE148_CAMP__.spikes).mechanism; return m.charges === 6 && DeadwallCore.bagTotal(g.player.carry) === 0; }));
        }
      }

      profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'core' }));
      for (const kind of ['shielded', 'charger']) {
        profile.fixtures.push(await page.evaluate(defenseContactFixture, { kind, hidden: true })); profile['hidden-' + kind] = await maps(page, viewport.touch, advanced, 0, () => rec.screenshot('hidden-' + kind));
        advanced(kind + ': a living unseen special remains part of global pressure without revealing its direction or marker', profile['hidden-' + kind].actors === 1);
        profile.checkpoints.push(await saveContinue(page, viewport.touch)); advanced(kind + ': hidden contact and queued types survive Continue with exact RNG and positions', profile.checkpoints.at(-1).pass);
        await page.evaluate(camp => { globalThis.__DEFENSE148_CAMP__ = Object.fromEntries(camp.added.map(b => [b.type, b.id])); }, campFixture);
      }
      profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'core' })); profile.fixtures.push(await page.evaluate(defenseContactFixture, { kind: 'shielded' }));
      profile.visibleShield = await maps(page, viewport.touch, advanced, 1, () => rec.screenshot('observed-shielded')); await resumeCommand(page, viewport.touch);
      if (viewport.touch) { if (!await page.locator('#touchCommandDrawer').evaluate(n => n.open)) await activate(page, '#touchCommandDrawer > summary', true); await activate(page, '#touchCommandDrawer [data-game-command="reload"]', true); if (await page.locator('#touchCommandDrawer').evaluate(n => n.open)) await activate(page, '#touchCommandDrawer > summary', true); }
      else await page.keyboard.press('KeyR');
      await page.waitForFunction(() => DEADWALL.player.magazine.rifle === 1 && DEADWALL.player.reload === 0);
      profile.projectile = { before: await page.evaluate(() => ({ rounds: DEADWALL.player.magazine.rifle, elapsed: DEADWALL.elapsed, reload: DEADWALL.player.reload,
        player: { x: DEADWALL.player.x, y: DEADWALL.player.y, health: DEADWALL.player.health, dead: DEADWALL.player.dead }, owned: DEADWALL.arsenal134.snapshot() })) };
      await page.evaluate(() => { const g = DEADWALL, hit = g.zombieBulletDamage.bind(g); globalThis.__DEFENSE148_SHOTS__ = []; g.zombieBulletDamage = (z, damage, from) => {
        const actual = hit(z, damage, from), dx = from.x - z.x, dy = from.y - z.y, length = Math.hypot(dx, dy);
        globalThis.__DEFENSE148_SHOTS__.push({ kind: z.kind, damage, actual, from: { ...from }, facing: z.facing, position: { x: z.x, y: z.y }, id: z.id,
          healthBefore: z.health, elapsed: g.elapsed, dot: length ? (dx * Math.cos(z.facing) + dy * Math.sin(z.facing)) / length : null,
          frontalThreshold: Math.cos(DeadwallCore.ENEMY_RULES.shield.halfAngle), rounds: g.player.magazine.rifle, reload: g.player.reload,
          player: { x: g.player.x, y: g.player.y, health: g.player.health, dead: g.player.dead } }); return actual; }; });
      if (viewport.touch) await holdInput(page, context, true, null, '#touchFire', () => page.waitForFunction(() => globalThis.__DEFENSE148_SHOTS__.some(hit => hit.kind === 'shielded')));
      else {
        const aim = await page.evaluate(() => { const g = DEADWALL, z = g.zombies.find(z => z.kind === 'shielded'), r = document.getElementById('game').getBoundingClientRect();
          const x = r.x + ((z.x - g.camera.x) * g.camera.zoom + g.width / 2) * r.width / g.width, y = r.y + ((z.y - g.camera.y) * g.camera.zoom + g.height / 2) * r.height / g.height;
          return { x, y, hit: document.elementFromPoint(x, y)?.id }; });
        assert.equal(aim.hit, 'game', 'The real aimed projectile receives free canvas input before any automatic pointer scroll');
        await page.mouse.move(aim.x, aim.y); await page.mouse.down(); try { await page.waitForFunction(() => globalThis.__DEFENSE148_SHOTS__.some(hit => hit.kind === 'shielded')); } finally { await page.mouse.up(); }
      }
      Object.assign(profile.projectile, await page.evaluate(() => ({ hits: globalThis.__DEFENSE148_SHOTS__, rounds: DEADWALL.player.magazine.rifle,
        elapsed: DEADWALL.elapsed, reload: DEADWALL.player.reload, playerHealth: DEADWALL.player.health, owned: DEADWALL.arsenal134.snapshot() })));
      await rec.screenshot('actual-carbine-shield-impact'); await activate(page, '#pauseButton', viewport.touch);
      profile.projectile.afterPause = await page.evaluate(() => ({ rounds: DEADWALL.player.magazine.rifle, elapsed: DEADWALL.elapsed, reload: DEADWALL.player.reload,
        playerHealth: DEADWALL.player.health, owned: DEADWALL.arsenal134.snapshot() }));
      const shot = profile.projectile;
      const shieldScale = await page.evaluate(() => DeadwallCore.ENEMY_RULES.shield.damageMultiplier);
      advanced('Real paid carbine input spends its one loaded round and a physical frontal shield reduces that projectile to35%',
        shot.before.rounds === 1 && !shot.before.player.dead && shot.before.player.health > 0 && shot.rounds === 0 && shot.hits.some(hit => hit.kind === 'shielded' &&
          hit.player.health > 0 && !hit.player.dead && hit.rounds === 0 && hit.dot !== null && hit.dot >= hit.frontalThreshold && Math.abs(hit.actual - hit.damage * shieldScale) < 1e-7));

      profile.fixtures.push(await page.evaluate(defenseServiceFixture, { type: 'core' })); profile.fixtures.push(await page.evaluate(defenseContactFixture, { kind: 'charger' }));
      await page.evaluate(() => { const g = DEADWALL, update = g.updateZombieCharge.bind(g); globalThis.__DEFENSE148_CHARGE__ = []; g.updateZombieCharge = (z, ...args) => { const before = z.charge.stage, result = update(z, ...args); if (z.charge.stage !== before) globalThis.__DEFENSE148_CHARGE__.push({ stage: z.charge.stage, timer: z.charge.timer, angle: z.charge.angle, x: z.x, y: z.y }); return result; }; });
      await activate(page, '#resumeButton', viewport.touch); await page.waitForFunction(() => globalThis.__DEFENSE148_CHARGE__.some(c => c.stage === 'recover')); await activate(page, '#pauseButton', viewport.touch);
      const stages = await page.evaluate(() => globalThis.__DEFENSE148_CHARGE__); profile.charger = stages;
      advanced('Ordinary RAF exposes actual windup, straight finite rush and recovery in order', ['windup', 'rush', 'recover'].every((stage, index) => stages[index]?.stage === stage));
      advanced('The real charger keeps its initial locked direction throughout preparation and rush', Math.abs(stages[0].angle - stages[1].angle) < 1e-7 && Math.hypot(stages[2].x - stages[1].x, stages[2].y - stages[1].y) > 5);
      profile.checkpoints.push(await saveContinue(page, viewport.touch)); advanced('Continue exactly preserves real recovery timer/facing and strict modern queue order', profile.checkpoints.at(-1).pass);
      advanced('All four page, console, HTTP and request collectors remain empty', rec.errors() === 0);
      profile.pass = profile.native.pass && profile.fixtureChecks.every(c => c.pass);
    } catch (error) {
      profile.pass = false; profile.failure = error.stack;
      if (page) { profile.failureState = await economics(page).catch(() => null); profile.failurePlan = await page.evaluate(() => DEADWALL.dayworks.overview().preview).catch(() => null);
        if (profile.projectile) Object.assign(profile.projectile, await page.evaluate(() => ({ hits: globalThis.__DEFENSE148_SHOTS__ || [],
          failureObservation: { rounds: DEADWALL.player.magazine.rifle, elapsed: DEADWALL.elapsed, reload: DEADWALL.player.reload, playerHealth: DEADWALL.player.health } }))
          .catch(error => ({ telemetryFailure: error.stack })));
        const file = viewport.name + '-failure.png'; await page.screenshot({ path: output + '/' + file }).then(() => profile.screenshots.push(file)).catch(() => {}); }
    } finally {
      try { await context?.close(); } catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, native: profile.native.checks.length, advanced: profile.fixtureChecks.length, failure: profile.failure?.split('\n')[0] }));
    if (!profile.pass) break;
  }
} finally {
  report.pass = profiles.length > 0 && report.profiles.length === profiles.length && report.profiles.every(p => p.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
