import path from 'node:path';
import {createHarness, recorder, ready, chooseCampaign} from './browser-qa-common142.mjs';
import {activate, holdInput, saveReloadContinue} from './browser-qa-common144.mjs';

process.env.DEADWALL_QA_ROOT = path.resolve(process.env.DEADWALL_QA_ROOT || 'dist');
const h = await createHarness('forage193', 'Actual desktop and portrait touch controls on the frozen built distribution. Native new campaign, operation buttons, ordinary RAF work, pause/resume, finite backpack payment and save/menu/reload/Continue. Regional approach, backpack capacity and an old save without the new module are explicitly prepared and validated checkpoints. The approach is deliberately quiet and at least 80 m from roads; this does not qualify natural discovery rates or population density. Workers receive their existing retreat order so background job selection does not consume combat RNG. A prepared real wild-horde contact tests danger; one declared call to the regional damage owner tests interruption, without claiming human combat. No forage controller action or time-step is invoked to qualify an operation, and RAF is never replaced.');
const {browser, base, report, output} = h;
report.root = process.env.DEADWALL_QA_ROOT; report.profiles = []; report.pass = false;

function actionSelector(id) { return '[id="expansionAction-forage193-gather:' + id + '"]'; }
async function openForage(page, touch) {
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseCommandButton', touch);
  else {
    if (!await page.locator('#hud135Tools').evaluate(n => n.open)) await activate(page, '#hud135ToolsToggle', touch);
    await activate(page, '#fieldOperations', touch);
  }
  await page.locator('#commandModal').waitFor({state: 'visible'});
  await activate(page, '#commandTab-field', touch);
  await activate(page, '#expansionFieldTab', touch);
  await activate(page, '#expansionGroup-exploration', touch);
  await activate(page, '#expansionTab-forage193', touch);
}
async function resumeForage(page, touch) {
  await activate(page, '#expansionResume', touch);
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}
async function contents(page) {
  return page.evaluate(() => {
    const g = DEADWALL;
    return {bag: {...g.player.carry}, depot: {...g.resources}, rng: g.random.state,
      history: g.forage193.snapshot(), busy: g.forage193.busy(), stamina: g.player.stamina,
      health: g.player.health, elapsed: g.elapsed};
  });
}
async function approach(page, fixture, bag = 'empty') {
  return page.evaluate(({fixture, bag}) => {
    const g = DEADWALL, w = g.frontier.world(), q = DeadwallBiomeForage193.candidate(w, fixture.id);
    if (!q || !DeadwallBiomeForage193.admitted(w, q)) throw Error('The real finite node is no longer admitted.');
    const raw = g.serialize();
    raw.workerOrder = 'retreat'; raw.phase = 'calm'; raw.phaseTime = 9999; raw.dayClock = .42;
    raw.player.stamina = g.player.maxStamina; raw.player.invulnerable = 0;
    if (bag !== 'preserve') {
      raw.player.carry = DeadwallCore.makeBag();
      if (bag === 'full') raw.player.carry.food = g.player.carryCapacity;
    }
    Object.assign(raw.frontier, {active: true, ...fixture.point, z: 0, inside: null, a: 0,
      anchor: {x: raw.player.x, y: raw.player.y}});
    if (g.restoreSave(raw) !== true) throw Error('The declared approach checkpoint was refused.');
    g.releaseInputs();
    return {preparedCheckpoint: true, preparedBackpack: bag, workerOrder: 'retreat', id: q.id,
      position: fixture.point, species: q.species, amount: q.amount, seconds: q.seconds,
      pendingWorkerCargo: g.units.reduce((sum, u) => sum + (u.carry || 0), 0)};
  }, {fixture, bag});
}
async function beginWithButton(page, touch, id) {
  await openForage(page, touch);
  const selector = actionSelector(id), button = page.locator(selector);
  await button.scrollIntoViewIfNeeded();
  if (!await button.isEnabled()) throw Error('Native gather action refused: ' + await button.locator('..').innerText());
  await activate(page, selector, touch);
  await page.waitForFunction(() => DEADWALL.forage193.busy() && !DEADWALL.activeOverlay && !DEADWALL.paused);
}
const gainedNothing = (before, after) => JSON.stringify(before.bag) === JSON.stringify(after.bag) &&
  JSON.stringify(before.history) === JSON.stringify(after.history);

try {
  for (const viewport of [{width: 1366, height: 768, touch: false}, {width: 390, height: 844, touch: true}]) {
    const p = {viewport}; report.profiles.push(p);
    const context = await browser.newContext({viewport: {width: viewport.width, height: viewport.height},
      hasTouch: viewport.touch, isMobile: viewport.touch, serviceWorkers: 'block'});
    const page = await context.newPage(); page.setDefaultTimeout(120000);
    const r = recorder(page, p, output, viewport.width + '-');
    try {
      await page.goto(base, {waitUntil: 'networkidle', timeout: 120000}); await ready(page);
      if (!await page.locator('#campaignMap132').evaluate(n => n.open)) await activate(page, '#campaignMap132 > summary', viewport.touch);
      await page.locator('#worldLandscape189').selectOption('balanced');
      await chooseCampaign(page, '17117'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.waitForFunction(() => DEADWALL.forage193 && !DEADWALL.paused && !DEADWALL.activeOverlay);
      p.newCampaign = await page.evaluate(() => ({seed: DEADWALL.world.seed,
        profile: DEADWALL.frontier.position().landscape189, history: DEADWALL.forage193.snapshot(),
        initialUnits: DEADWALL.units.length, registered: DEADWALL.expansions.entries().some(d => d.id === 'forage193')}));
      r.check('Native new campaign selects the real seed and natural profile', p.newCampaign.seed === 17117 && p.newCampaign.profile === 'balanced');
      r.check('New campaigns start with the real registered finite notebook active', p.newCampaign.registered && p.newCampaign.history.enabled && p.newCampaign.history.harvested.length === 0);

      p.fixture = await page.evaluate(() => {
        const g = DEADWALL, w = g.frontier.world(), F = DeadwallBiomeForage193,
          population = DeadwallBiomePopulation165, cx = Math.floor(w.home.x / 256), cy = Math.floor(w.home.y / 256);
        for (let ring = 2; ring <= 14; ring++) for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
          if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;
          for (const q of F.chunk(w, cx + dx, cy + dy)) {
            if (w.nearestRoad(q).d < 80 || w.nearPOI(q.x, q.y, 130).length ||
                population.around(w, q.x, q.y, 20).contacts.some(n => population.admitted(w, n))) continue;
            for (let i = 0; i < 16; i++) {
              const a = i * Math.PI / 8, point = {x: q.x + Math.cos(a), y: q.y + Math.sin(a)};
              if (!w.blocked(point.x, point.y, .32, 0, null) && w.movementLine(point, q, 0, null, null, .05)) {
                return {id: q.id, species: q.species, name: q.name, amount: q.amount, seconds: q.seconds,
                  resource: q.resource, point, origin: {x: q.x, y: q.y}, preparedCoordinates: true,
                  admitted: F.admitted(w, q), sparseCheckpoint: true};
              }
            }
          }
        }
        throw Error('No real finite forage node has a quiet physical approach.');
      });
      p.initialApproach = await approach(page, p.fixture);
      await page.waitForFunction(() => DEADWALL.units.every(u => u.kind !== 'worker' || u.carry <= 1e-8), null, {timeout: 30000});
      await page.waitForFunction(id => DEADWALL.forage193.visible().some(q => q.id === id), p.fixture.id);
      r.check('The generated node is admitted and visible through the actual runtime', p.fixture.admitted);
      await r.screenshot('real-ground-prop');

      p.fullBackpack = {fixture: await approach(page, p.fixture, 'full')};
      await openForage(page, viewport.touch);
      const full = page.locator(actionSelector(p.fixture.id)); await full.scrollIntoViewIfNeeded();
      p.fullBackpack.before = await contents(page);
      p.fullBackpack.reason = await full.locator('..').innerText();
      r.check('Native action remains visible but refuses an entire lot when the real backpack is full', await full.isVisible() && !await full.isEnabled() && /lot doit tenir dans le sac/i.test(p.fullBackpack.reason));
      p.fullBackpack.after = await contents(page);
      r.check('Reading the refused full-backpack offer spends no node or resource', gainedNothing(p.fullBackpack.before, p.fullBackpack.after) && p.fullBackpack.before.rng === p.fullBackpack.after.rng);
      await r.screenshot('full-backpack-refused'); await resumeForage(page, viewport.touch);

      // The real regional group/individual registries supply this declared danger fixture.
      await approach(page, p.fixture);
      p.threat = await page.evaluate(fixture => {
        const g = DEADWALL, w = g.frontier.world(), point = g.frontier.position(), raw = g.serialize();
        const previous = structuredClone(raw.worldEvolution); let at;
        for (let i = 0; i < 16; i++) {
          const a = i * Math.PI / 8, q = {x: point.x + Math.cos(a) * 6, y: point.y + Math.sin(a) * 6};
          if (!w.blocked(q.x, q.y, .3, 0, null) && w.line(point, q, 0, null, null, .015)) { at = q; break; }
        }
        if (!at) throw Error('No real clear stance for the declared hostile contact.');
        raw.worldEvolution.serial = Math.max(1, raw.worldEvolution.serial);
        raw.worldEvolution.groups = raw.worldEvolution.groups.filter(q => q.id !== 'W0000');
        raw.worldEvolution.groups.unshift({id: 'W0000', kind: 'resting', count: 1, lost: 0, wound: 0,
          fallen: [], injuries: {}, x: at.x, y: at.y, a: 0, seen: false,
          contacts: {'0': {...at, z: 0, a: 0, mode: 'idle', ttl: 0, gx: at.x, gy: at.y, cool: 2}}});
        if (g.restoreSave(raw) !== true) throw Error('The real hostile-register fixture was refused.');
        return {preparedHostileRegistry: true, id: 'W0000:0', point: at, previous, node: fixture.id};
      }, p.fixture);
      await openForage(page, viewport.touch);
      const unsafe = page.locator(actionSelector(p.fixture.id)); await unsafe.scrollIntoViewIfNeeded();
      p.threat.before = await contents(page); p.threat.reason = await unsafe.locator('..').innerText();
      p.threat.actualContact = await page.evaluate(id => DEADWALL.worldEvolution.groupMembers().some(e => e.id === id && e.hp > 0), p.threat.id);
      r.check('A real saved hostile individual in clear range refuses the native gathering offer', p.threat.actualContact && !await unsafe.isEnabled() && /infectés/i.test(p.threat.reason));
      r.check('The unsafe offer gives no lot', !p.threat.before.history.harvested.includes(p.fixture.id));
      await r.screenshot('real-contact-refused'); await resumeForage(page, viewport.touch);
      await page.evaluate(previous => {const raw = DEADWALL.serialize(); raw.worldEvolution = previous;
        if (DEADWALL.restoreSave(raw) !== true) throw Error('Removing the declared hostile fixture failed.');}, p.threat.previous);
      delete p.threat.previous;

      await approach(page, p.fixture); await beginWithButton(page, viewport.touch, p.fixture.id);
      p.movement = {before: await contents(page)};
      if (await page.locator('#hud135Tools').evaluate(n => n.open)) await activate(page, '#hud135ToolsToggle', viewport.touch);
      await holdInput(page, context, viewport.touch, 'd', '#touchControls button[data-dir="right"]', async () => {
        await page.waitForFunction(() => !DEADWALL.forage193.busy(), null, {timeout: 5000});
      });
      p.movement.after = await contents(page);
      r.check('A real keyboard or touch movement cancels the native job without a lot', gainedNothing(p.movement.before, p.movement.after) && !p.movement.after.busy);
      await r.screenshot('movement-cancelled');

      await approach(page, p.fixture); await beginWithButton(page, viewport.touch, p.fixture.id);
      p.injury = {before: await contents(page)};
      p.injury.stimulus = await page.evaluate(() => {
        const g = DEADWALL, before = g.player.health; g.player.invulnerable = 0;
        const applied = g.frontier.damage(1);
        return {declaredRegionalDamage: true, requested: 1, applied, healthBefore: before, healthAfter: g.player.health};
      });
      await page.waitForFunction(() => !DEADWALL.forage193.busy(), null, {timeout: 5000});
      p.injury.after = await contents(page);
      r.check('The actual regional damage owner interrupts the UI-started job without a lot', p.injury.stimulus.applied && p.injury.stimulus.healthAfter < p.injury.stimulus.healthBefore && gainedNothing(p.injury.before, p.injury.after));

      await approach(page, p.fixture); await openForage(page, viewport.touch);
      const selector = actionSelector(p.fixture.id), gather = page.locator(selector); await gather.scrollIntoViewIfNeeded();
      r.check('The real gather control is reachable and enabled on this viewport', await gather.isVisible() && await gather.isEnabled());
      await r.screenshot('gather-offer'); p.completed = {before: await contents(page)};
      await page.evaluate(id => {
        const g = DEADWALL, save = g.save.bind(g); globalThis.__FORAGE193_COMMIT__ = null;
        // Observe the existing commit synchronously, before stamina regeneration on the next RAF.
        g.save = (...args) => {
          if (!globalThis.__FORAGE193_COMMIT__ && g.forage193.snapshot().harvested.includes(id)) {
            globalThis.__FORAGE193_COMMIT__ = {bag: {...g.player.carry}, depot: {...g.resources},
              rng: g.random.state, stamina: g.player.stamina, maxStamina: g.player.maxStamina,
              history: g.forage193.snapshot(), elapsed: g.elapsed};
          }
          return save(...args);
        };
      }, p.fixture.id);
      await activate(page, selector, viewport.touch);
      await page.waitForFunction(() => DEADWALL.forage193.presentation()?.progress > .02 && !DEADWALL.activeOverlay);
      // Pause with one native click before navigating any long mobile dossier.
      await activate(page, '#pauseButton', viewport.touch);
      await openForage(page, viewport.touch);
      p.completed.pause = await page.evaluate(() => ({progress: DEADWALL.forage193.presentation()?.progress,
        elapsed: DEADWALL.elapsed, paused: DEADWALL.paused, overlay: DEADWALL.activeOverlay?.id}));
      await page.waitForTimeout(600);
      const paused = await page.evaluate(() => ({progress: DEADWALL.forage193.presentation()?.progress, elapsed: DEADWALL.elapsed}));
      r.check('The native operation panel pauses real work and the simulation clock', p.completed.pause.paused && p.completed.pause.overlay === 'commandModal' &&
        p.completed.pause.progress > 0 && p.completed.pause.progress < 1 && paused.progress === p.completed.pause.progress && paused.elapsed === p.completed.pause.elapsed);
      await r.screenshot('native-pause-mid-work'); await resumeForage(page, viewport.touch);
      await page.waitForFunction(() => !DEADWALL.forage193.busy() && !!globalThis.__FORAGE193_COMMIT__, null, {timeout: 20000, polling: 100});
      p.completed.commit = await page.evaluate(() => globalThis.__FORAGE193_COMMIT__);
      p.completed.after = await contents(page);
      const commit = p.completed.commit, before = p.completed.before;
      r.check('Ordinary RAF work adds exactly the finite lot to the actual backpack', Math.abs(commit.bag[p.fixture.resource] - before.bag[p.fixture.resource] - p.fixture.amount) < 1e-8 &&
        Object.keys(before.bag).every(k => k === p.fixture.resource || commit.bag[k] === before.bag[k]));
      r.check('The final commit pays four stamina and consumes the node exactly once', Math.abs(commit.stamina - (commit.maxStamina - 4)) < 1e-8 && commit.history.harvested.filter(id => id === p.fixture.id).length === 1);
      r.check('Foraging sends no resources to the remote depot and consumes no combat RNG', Object.keys(before.depot).every(k => commit.depot[k] <= before.depot[k] + 1e-8) && commit.rng === before.rng);
      r.check('The task actually ran through elapsed simulation time', commit.elapsed - before.elapsed >= p.fixture.seconds - .06);
      await r.screenshot('finite-lot-finished');
      p.recovery = await saveReloadContinue(page, viewport.touch);
      r.check('Native Save/menu/reload/Continue preserves every persistent owner', p.recovery.pass);
      await openForage(page, viewport.touch);
      p.exhausted = await page.evaluate(id => ({history: DEADWALL.forage193.snapshot(),
        visible: DEADWALL.forage193.visible().some(q => q.id === id), quote: DEADWALL.forage193.quote(id)}), p.fixture.id);
      r.check('The spent node remains absent and refused after native recovery', p.exhausted.history.harvested.includes(p.fixture.id) && !p.exhausted.visible && !p.exhausted.quote.ok && await page.locator(actionSelector(p.fixture.id)).count() === 0);
      await r.screenshot('spent-after-continue'); await resumeForage(page, viewport.touch);

      p.legacy = await page.evaluate(() => {
        const g = DEADWALL, raw = g.serialize(), point = g.fieldcraft.service(g.player, g.core());
        if (!point) throw Error('No actual accessible depot service point.');
        delete raw.expansions127.modules.forage193;
        Object.assign(raw.frontier, {active: false, anchor: null, z: 0, inside: null});
        Object.assign(raw.player, point); raw.player.carry = DeadwallCore.makeBag(); raw.player.carry.food = 4;
        raw.workerOrder = 'retreat'; raw.phase = 'calm'; raw.phaseTime = 9999;
        if (g.restoreSave(raw) !== true) throw Error('The declared absent-module legacy fixture was refused.');
        return {preparedLegacyMissingModule: true, preparedBackpackFood: 4, servicePoint: point,
          active: g.forage193.active(), history: g.forage193.snapshot()};
      });
      r.check('An absent legacy module restores inactive without free harvested lots', !p.legacy.active && p.legacy.history.harvested.length === 0);
      await openForage(page, viewport.touch);
      const activation = '#expansionAction-forage193-activate';
      await page.locator(activation).scrollIntoViewIfNeeded();
      r.check('A real depot service point and four carried rations enable the native activation', await page.locator(activation).isVisible() && await page.locator(activation).isEnabled());
      p.legacy.before = await contents(page); await r.screenshot('legacy-paid-activation');
      await activate(page, activation, viewport.touch); p.legacy.after = await contents(page);
      r.check('The legacy notebook consumes four real backpack rations once and no depot stock or RNG', p.legacy.after.history.enabled && p.legacy.before.bag.food - p.legacy.after.bag.food === 4 &&
        JSON.stringify(p.legacy.before.depot) === JSON.stringify(p.legacy.after.depot) && p.legacy.before.rng === p.legacy.after.rng);
      r.check('The native UI removes repeat activation and its read-only quote refuses renewal', await page.locator(activation).count() === 0 &&
        await page.evaluate(() => DEADWALL.forage193.activationQuote().ok === false));
      await resumeForage(page, viewport.touch);
      p.legacy.recovery = await saveReloadContinue(page, viewport.touch);
      r.check('Paid legacy activation persists through native Save/reload/Continue', p.legacy.recovery.pass && await page.evaluate(() => DEADWALL.forage193.active() && DEADWALL.player.carry.food === 0));
      r.check('No collected JavaScript, console, HTTP or request error', r.errors() === 0);
      p.pass = true;
    } catch (error) {
      p.pass = false; p.failure = String(error.stack || error); await r.screenshot('failure').catch(() => {}); throw error;
    } finally { await context.close(); }
  }
  report.pass = true;
} catch (error) { report.failure = String(error.stack || error); process.exitCode = 1; }
finally { await h.finish(); await h.close(); console.log(JSON.stringify({pass: report.pass, output, failure: report.failure})); }
