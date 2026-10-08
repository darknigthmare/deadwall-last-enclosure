import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHarness, recorder, ready, chooseCampaign, activate, openCommand, resumeCommand, holdInput, visibleInPanel } from './browser-qa-common144.mjs';
import { loadedAssets } from './browser-qa-common142.mjs';

const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = selected ? views.filter(view => selected.includes(view.name)) : views;
const scope = 'Bounded 1.52 regression checks in Chromium desktop and mobile profiles. NATIVE INPUT AFTER DECLARED SETUP: real keyboard/pointer or touch controls harvest a finite existing tree despite a refused empty-gun trigger, wait through actual reload, and lock/unlock E deposit around a real paid escort purchased and cancelled through ordinary Commandement buttons. EXPLICIT FIXTURES: validated saves place the actor at free physical accesses, isolate the existing finite tree, set empty ammunition and later eight carried rounds, and provide only the historical specialty prerequisite. A deliberately paused regional encounter separately checks a historically known hidden horde, two actual observed members, and loss of the sole observer. Its normal live HUD is refreshed with paused=false synchronously, then paused=true before returning to RAF; no simulation time or contact movement advances. No fixture is reported as human campaign progression; no simulation method is replaced or synthetic update is called. Heavy saves are read once per fixture/checkpoint, never in frame polling. Browser layout is not physical-device certification.';

// Fixtures are restored transactionally while already paused. Their changed
// fields and source are recorded separately from native input results.
async function fixture(page, name, mutate, fieldView = false) {
  return page.evaluate(({ name, source, fieldView }) => {
    const g = DEADWALL;
    if (!g.paused) throw Error('Fixture requires deliberate Pause');
    if (!g.ui.commandModal.classList.contains('hidden')) g.showCommand(false);
    const data = JSON.parse(JSON.stringify(g.serialize()));
    const description = new Function('g', 'data', 'return (' + source + ')(g, data)')(g, data);
    g.restoreSave(DeadwallSave.validate(data)); g.togglePause(true);
    const material = () => { const { timestamp, ...saved } = g.serialize(); return JSON.stringify(saved); };
    const beforePresentation = material(), elapsed = g.elapsed, playSeconds = g.stats.playSeconds;
    if (fieldView) {
      // The native HUD deliberately hides during Pause. Sample its live
      // presentation synchronously, restoring Pause before the next RAF.
      // No timer, movement, gameplay method or style is overridden.
      g.ui.pauseMenu.classList.add('hidden'); g.paused = false;
      try { g.syncOverlayFocus(); g.updateUI(); g.worldEvolutionUI.refresh(true); }
      finally { g.paused = true; }
      if (g.elapsed !== elapsed) throw Error('Observation fixture advanced simulation time');
    } else { g.updateUI(); g.worldEvolutionUI.refresh(true); }
    g.render();
    const savedFieldsUnchanged = beforePresentation === material();
    if (!savedFieldsUnchanged || g.elapsed !== elapsed || g.stats.playSeconds !== playSeconds) throw Error('Prepared UI/render changed persistent simulation fields');
    return { name, ...description, validatedSave: true, simulationStepsInjected: 0,
      pausedFieldView: fieldView, presentationProof: { savedFieldsUnchanged, elapsedBefore: elapsed, elapsedAfter: g.elapsed, playSecondsBefore: playSeconds, playSecondsAfter: g.stats.playSeconds, includes: ['generator/support records', 'resources', 'fires', 'saved group contacts', 'RNG'] },
      note: 'Explicit prepared scene, not native progression; all production methods remain installed. Paused HUD may be hidden again by later ordinary refresh; its DOM model is read separately from native Pause dossier navigation.' };
  }, { name, source: mutate.toString(), fieldView });
}

async function pause(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await activate(page, '#commandReturn129', touch);
  if (!await page.evaluate(() => DEADWALL.paused)) await activate(page, '#pauseButton', touch);
  await page.waitForFunction(() => DEADWALL.paused);
}

async function resume(page, touch) {
  if (await page.locator('#commandModal').isVisible()) await resumeCommand(page, touch);
  else if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}

async function controlPoint(page, selector) {
  await page.waitForFunction(selector => {
    const n = document.querySelector(selector), r = n?.getBoundingClientRect();
    if (!r || !n.checkVisibility({ checkVisibilityCSS: true }) || n.closest('[inert],.hidden') || r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return false;
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return hit === n || n.contains(hit);
  }, selector, { timeout: 10000 });
  const r = await page.locator(selector).boundingBox();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

async function holdHarvest(page, context, touch, fire, action) {
  if (!fire) {
    if (touch) await controlPoint(page, '#touchAction');
    return holdInput(page, context, touch, 'e', '#touchAction', action);
  }
  if (touch) {
    const actionPoint = await controlPoint(page, '#touchAction'), firePoint = await controlPoint(page, '#touchFire');
    const session = await context.newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...actionPoint, id: 1 }, { ...firePoint, id: 2 }] });
      return await action();
    } finally {
      try { await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      finally { await session.detach(); }
    }
  }
  const point = await page.evaluate(() => {
    const safe = DEADWALL.hud135.measure(), x = (safe.left + safe.right) / 2, y = (safe.top + safe.bottom) / 2;
    if (document.elementFromPoint(x, y)?.id !== 'game') throw Error('Native trigger must hit uncovered game canvas');
    return { x, y };
  });
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  try { return await holdInput(page, context, false, 'e', '#touchAction', action); }
  finally { await page.mouse.up(); }
}

async function waitSeconds(page, seconds) {
  const before = await page.evaluate(() => DEADWALL.elapsed);
  await page.waitForFunction(({ before, seconds }) => DEADWALL.elapsed - before >= seconds, { before, seconds }, { timeout: 6000 });
}

async function harvestReadout(page, nodeId) {
  return page.evaluate(nodeId => {
    const g = DEADWALL, n = g.world.nodes.find(n => n.id === nodeId), proxy = g.actorPresentation.player();
    return { elapsed: g.elapsed, nodeId, remaining: n.amount, carry: { ...g.player.carry }, gathered: g.stats.gathered,
      shots: g.stats.shots, reload: g.player.reload, cooldown: g.player.shootCooldown,
      held: [...g.input.keys], trigger: g.input.mouseDown || g.input.touchFire,
      action: g.heroActions133.pose(), renderedAction: proxy.visualAction133, recoil: proxy.visualRecoil,
      ammoLabel: document.getElementById('weaponAmmo').textContent, reloadingClass: document.body.classList.contains('is-reloading') };
  }, nodeId);
}

async function openCompanions(page, touch) {
  await openCommand(page, touch, 'field');
  await activate(page, '#expansionFieldTab', touch);
  await activate(page, '#expansionGroup-player', touch);
  await activate(page, '#expansionTab-companions', touch);
}

async function nativeHarvest(page, context, touch, rec, profile, check) {
  await openCommand(page, touch, 'workers'); await activate(page, '[data-worker-order="retreat"]', touch);
  await resumeCommand(page, touch); await pause(page, touch);
  const prepared = await fixture(page, 'finite-tree-empty-gun', (g, data) => {
    const node = g.world.nodes.filter(n => n.type === 'wood' && !n.sceneryKind && n.amount >= 24)
      .find(n => { const p = g.fieldcraft.service(g.player, n); return p && g.workerCanWorkAt({ ...g.player, ...p }, n, 62) && g.fieldcraft.distance(p, g.core()) > 160; });
    if (!node) throw Error('A native finite tree needs a free exterior harvest access away from the depot');
    const point = g.fieldcraft.service(g.player, node); Object.assign(data.player, point);
    data.phaseTime = 999; data.player.carry = DeadwallCore.makeBag(); data.resources.ammo = 0;
    data.player.reload = 0; data.player.shootCooldown = 0; data.player.meleeCooldown = 0;
    const armory = data.expansions127.modules.arsenal134, item = armory.carried.find(i => i.uid === armory.equipped);
    if (!item || DeadwallCore.Arsenal134Rules.catalog[item.id].category !== 'firearm') throw Error('Starting paid firearm expected');
    item.rounds = 0; data.player.magazine[data.player.weapon] = 0;
    data.expansions127.modules.player131.reserve = 0;
    data.nodes = data.nodes.map(([id, amount]) => [id, id === node.id ? amount : 0]);
    return { node: { id: node.id, type: node.type, originalAmount: node.amount }, point,
      changed: ['player physical pose', 'phaseTime', 'empty carry/ammo/magazine/reserve', 'other local nodes depleted'],
      retained: 'The selected existing tree keeps its finite original amount; the original paid firearm remains owned.' };
  });
  profile.fixtures.push(prepared); const id = prepared.node.id;
  await resume(page, touch); const before = await harvestReadout(page, id);
  const during = await holdHarvest(page, context, touch, true, async () => {
    await page.waitForFunction(before => DEADWALL.stats.gathered > before + 1, before.gathered, { timeout: 6000 });
    const result = await harvestReadout(page, id); await rec.screenshot('native-dry-trigger-harvest'); return result;
  });
  check('Native held E harvests the finite tree while an empty-gun trigger is genuinely held', during.held.includes('KeyE') && during.trigger && during.gathered > before.gathered && during.shots === before.shots && during.reload === 0);
  check('Refused native fire retains the actual chopping gesture without recoil', during.action?.kind === 'chop' && during.renderedAction?.kind === 'chop' && !during.recoil);
  check('Finite tree loss equals the actual carried wood gain', Math.abs(before.remaining - during.remaining - (during.carry.wood - before.carry.wood)) < 1e-6);
  profile.nativeHarvest = { before, during, input: touch ? 'CDP native simultaneous ACTION/TIR touch pointers' : 'Real canvas mouse hold plus held keyboard E' };
  await pause(page, touch);
  profile.fixtures.push(await fixture(page, 'finite-reload-supplies', (_g, data) => {
    data.player.carry.ammo = 8;
    return { changed: ['player.carry.ammo=8'], note: 'Explicit eight-round carried supply fixture; reload and subsequent harvest use native controls and real finite consumption.' };
  }));
  await resume(page, touch);
  if (touch) {
    await activate(page, '#touchCommandDrawer > summary', true);
    await activate(page, '[data-game-command="reload"]', true);
    await activate(page, '#touchCommandDrawer > summary', true);
  } else { await page.locator('#game').focus(); await page.keyboard.press('r'); }
  await page.waitForFunction(() => DEADWALL.player.reload > 0, null, { timeout: 3000 });
  const reloadBefore = await harvestReadout(page, id);
  profile.nativeReload = await holdHarvest(page, context, touch, false, async () => {
    await waitSeconds(page, .3); const blocked = await harvestReadout(page, id);
    check('Held native E waits during the actual reload without gaining wood or showing work', blocked.reload > 0 && blocked.gathered === reloadBefore.gathered && blocked.action === null && blocked.reloadingClass);
    await rec.screenshot('native-reload-waits');
    await page.waitForFunction(before => DEADWALL.player.reload === 0 && DEADWALL.stats.gathered > before + 1, reloadBefore.gathered, { timeout: 6000 });
    const resumed = await harvestReadout(page, id);
    check('Native harvest resumes after reload completes and its eight carried rounds are consumed once', resumed.action?.kind === 'chop' && resumed.carry.ammo === 0 && resumed.gathered > reloadBefore.gathered);
    await rec.screenshot('native-reload-harvest-resumes');
    return { before: reloadBefore, blocked, resumed };
  });
}

async function nativeTraining(page, context, touch, rec, profile, check) {
  await pause(page, touch);
  profile.fixtures.push(await fixture(page, 'depot-historical-specialty', (g, data) => {
    const point = g.fieldcraft.service(g.player, g.core()); if (!point) throw Error('Free depot service access required');
    Object.assign(data.player, point); data.expansions127.modules.companions.trained = ['samir'];
    return { changed: ['player physical depot pose', 'companions historical specialty=samir'], point,
      note: 'Historical paid specialty is the declared prerequisite fixture. Assignment and escort below are actually purchased through buttons. Carried wood was harvested natively.' };
  }));
  await openCompanions(page, touch); await activate(page, '#expansionTeam', touch);
  const assignmentBefore = await page.evaluate(() => DEADWALL.resources.food);
  await activate(page, '#comp-samir', touch);
  const assignmentAfter = await page.evaluate(() => DEADWALL.resources.food);
  const assignmentCost = await page.evaluate(() => DeadwallCore.WorldEvolution.RULES.companionRules.assignmentFood);
  check('Real team button purchases Samir with the existing assignment cost', Math.abs(assignmentBefore - assignmentAfter - assignmentCost) < 1e-8);
  await activate(page, '#expansionFieldTab', touch); await activate(page, '#expansionGroup-player', touch); await activate(page, '#expansionTab-companions', touch);
  const selector = '#expansionAction-companions-train-samir-escort';
  await page.locator(selector).scrollIntoViewIfNeeded();
  const geometry = await visibleInPanel(page, selector, '.command-body');
  check('Real escort button is readable and hit-testable in this viewport', geometry.pass);
  const before = await page.evaluate(() => ({ resources: { ...DEADWALL.resources }, carry: { ...DEADWALL.player.carry }, deposited: DEADWALL.depositedResources, rule: DeadwallCore.CompanionPackRules.exercises.escort }));
  await activate(page, selector, touch);
  await page.locator('#commandModal').waitFor({ state: 'hidden' });
  const paid = await page.evaluate(() => ({ resources: { ...DEADWALL.resources }, training: DEADWALL.companionsPack.snapshot().training }));
  for (const [key, cost] of Object.entries(before.rule.cost)) check('Real escort button pays exactly ' + cost + ' ' + key, Math.abs(before.resources[key] - paid.resources[key] - cost) < 1e-8);
  await resume(page, touch);
  await page.waitForFunction(() => DEADWALL.expansions.busy());
  const locked = await holdHarvest(page, context, touch, false, async () => {
    await waitSeconds(page, 1.1);
    return page.evaluate(() => {
      const g = DEADWALL; g.expansionUI.refresh(true);
      return { resources: { ...g.resources }, carry: { ...g.player.carry }, deposited: g.depositedResources,
        training: g.companionsPack.snapshot().training, held: [...g.input.keys],
        progress: document.querySelector('#expansionWork progress').value, label: document.querySelector('#expansionWork span').textContent,
        visible: !document.getElementById('expansionWork').classList.contains('hidden') };
    });
  });
  check('Held native E cannot deposit the actually harvested wood while paid training progresses', locked.held.includes('KeyE') && locked.carry.wood > 1 && locked.carry.wood === before.carry.wood && locked.deposited === before.deposited && locked.training.left < paid.training.left);
  check('Browser HUD uses the actual escort duration and a nonnegative work percentage', locked.visible && Math.abs(locked.progress - (1 - locked.training.left / before.rule.seconds)) < 1e-8 && !/-\d+\s*%/.test(locked.label));
  await rec.screenshot('native-paid-escort-progress');
  await activate(page, '#expansionWorkOpen', touch);
  const cancel = '#expansionAction-companions-train-cancel'; await page.locator(cancel).scrollIntoViewIfNeeded();
  const beforeCancel = await page.evaluate(() => ({ scrap: DEADWALL.resources.scrap, medicine: DEADWALL.resources.medicine, food: DEADWALL.resources.food }));
  await activate(page, cancel, touch);
  const afterCancel = await page.evaluate(() => ({ scrap: DEADWALL.resources.scrap, medicine: DEADWALL.resources.medicine, food: DEADWALL.resources.food, training: DEADWALL.companionsPack.snapshot().training }));
  check('Real cancellation button clears the exercise with no refund', afterCancel.training === null && Object.entries(beforeCancel).every(([key, value]) => afterCancel[key] === value));
  await resumeCommand(page, touch);
  const depositBefore = await page.evaluate(() => ({ wood: DEADWALL.resources.wood, carry: DEADWALL.player.carry.wood, deposited: DEADWALL.depositedResources }));
  await holdHarvest(page, context, touch, false, () => page.waitForFunction(() => DEADWALL.player.carry.wood === 0, null, { timeout: 6000 }));
  const depositAfter = await page.evaluate(() => ({ wood: DEADWALL.resources.wood, carry: DEADWALL.player.carry.wood, deposited: DEADWALL.depositedResources, workHidden: document.getElementById('expansionWork').classList.contains('hidden') }));
  check('After native cancellation E deposits the exact real wood once and the HUD clears', depositAfter.carry === 0 && Math.abs(depositAfter.wood - depositBefore.wood - depositBefore.carry) < 1e-8 && Math.abs(depositAfter.deposited - depositBefore.deposited - depositBefore.carry) < 1e-8 && depositAfter.workHidden);
  await rec.screenshot('native-training-cancel-unlocks-deposit');
  profile.nativeTraining = { assignmentBefore, assignmentAfter, assignmentCost, before, paid, locked, beforeCancel, afterCancel, depositBefore, depositAfter, buttonGeometry: geometry };
}

async function observedHud(page, touch) {
  return page.evaluate(() => {
    const g = DEADWALL; g.worldEvolutionUI.refresh(true);
    const contacts = g.worldEvolution.groupMembers();
    return { status: document.querySelector('#fieldDock .field-dock-status').textContent,
      scope: 'Prepared HUD DOM read while paused; no claim that native paused HUD controls are interactive',
      physicallyVisible: document.querySelector('#fieldDock .field-dock-status').checkVisibility({ checkVisibilityCSS: true }),
      count: g.worldEvolution.snapshot().groups[0].count,
      contacts: contacts.map(c => ({ x: c.x, y: c.y, seen: g.visibility.canSeeRegional(c) })), paused: g.paused };
  });
}

async function worldCards(page, touch) {
  // Return the prepared scene to its normal Pause presentation. The dossier
  // then opens through ordinary visible Pause/Commandement/Recon buttons.
  await page.evaluate(() => DEADWALL.togglePause(true));
  await openCommand(page, touch, 'field'); await activate(page, '#reconTab', touch);
  if (!await page.locator('#evolutionPanel').evaluate(n => n.open)) await activate(page, '#evolutionPanel > summary', touch);
  await activate(page, '#evoTab-world', touch); await page.locator('#evolutionPanel').scrollIntoViewIfNeeded();
  return page.locator('#evolutionPanel .evo-card').allTextContents();
}

async function visibilityFixtures(page, touch, rec, profile, check) {
  await pause(page, touch);
  profile.fixtures.push(await fixture(page, 'historic-hidden-horde', (g, data) => {
    const w = g.frontier.world(); let point;
    for (const road of w.roads) {
      const p = { x: (road.a.x + road.b.x) / 2, y: (road.a.y + road.b.y) / 2 };
      if (Math.hypot(p.x - w.home.x, p.y - w.home.y) < 600) continue;
      if ([0, 3, 8, 80].every(d => !w.blocked(p.x + d, p.y, .4, 0, null)) && [3, 8].every(d => w.line(p, { x: p.x + d, y: p.y }, 0, null, null, .015))) { point = p; break; }
    }
    if (!point) throw Error('Free regional road for physical visibility fixture required');
    const contact = d => ({ x: point.x + d, y: point.y, z: 0, a: 0, mode: 'idle', ttl: 0, gx: point.x + d, gy: point.y, cool: 0 });
    Object.assign(data.frontier, point, { active: true, anchor: { x: data.player.x, y: data.player.y }, z: 0, inside: null, car: null });
    data.dayClock = .5; data.worldEvolution.companions = []; data.worldEvolution.serial = 1;
    data.worldEvolution.groups = [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0, x: point.x + 80, y: point.y, a: 0, seen: true, fallen: [], injuries: {}, contacts: { 0: contact(80) } }];
    return { changed: ['regional actor pose/domain', 'noon dayClock', 'remove regional companion observers', 'one historic 80-member group with one distant saved member'], point,
      note: 'Paused prepared encounter. Current physical observers determine visibility; historic seen=true supplies no live count or position. Live HUD refresh occurs synchronously before Pause is restored, without a simulation tick.' };
  }, true));
  const hidden = await observedHud(page, touch); await rec.screenshot('fixture-historic-horde-field-scene');
  check('Prepared historic horde remains absent from the current HUD DOM model', hidden.paused && hidden.count === 80 && !/HORDE|CONTACTS/.test(hidden.status) && hidden.contacts.every(c => !c.seen), 'fixture');
  const hiddenCards = await worldCards(page, touch); check('Ordinary World dossier hides the historic out-of-view group', hiddenCards.length === 0, 'fixture');
  await rec.screenshot('fixture-historic-horde-hidden-dossier');
  profile.fixtures.push(await fixture(page, 'two-observed-members', (_g, data) => {
    const p = data.frontier, h = data.worldEvolution.groups[0]; h.seen = false;
    h.contacts = Object.fromEntries([3, 8, 80].map((d, i) => [i, { x: p.x + d, y: p.y, z: 0, a: 0, mode: 'idle', ttl: 0, gx: p.x + d, gy: p.y, cool: 0 }]));
    return { changed: ['historic seen=false', 'three saved physical contacts at 3, 8 and 80 metres'], note: 'Same original 80-member group; no discovery flag is required to see present physical contacts.' };
  }, true));
  const visible = await observedHud(page, touch); await rec.screenshot('fixture-two-observed-field-scene');
  check('Prepared HUD DOM reports exactly two observed individuals at the nearest real three-metre position', /CONTACTS 2 à 3 m/.test(visible.status) && !/80/.test(visible.status) && visible.contacts.filter(c => c.seen).length === 2, 'fixture');
  const stableBefore = await page.evaluate(() => { const { timestamp, ...data } = DEADWALL.serialize(); return JSON.stringify(data); });
  const visibleCards = await worldCards(page, touch);
  check('World dossier reports two observed contacts without revealing all eighty members', visibleCards.length === 1 && /2 contacts observés/.test(visibleCards[0]) && !/80/.test(visibleCards[0]), 'fixture');
  const stableAfter = await page.evaluate(() => { const { timestamp, ...data } = DEADWALL.serialize(); return JSON.stringify(data); });
  check('Native paused dossier consultation leaves the complete prepared saved state unchanged', stableAfter === stableBefore, 'fixture');
  await rec.screenshot('fixture-two-observed-dossier');
  profile.fixtures.push(await page.evaluate(() => {
    const g = DEADWALL;
    if (!g.paused || g.activeOverlay !== g.ui.commandModal) throw Error('Observer probe requires the already natively opened paused dossier');
    const material = () => { const { timestamp, ...saved } = g.serialize(); return JSON.stringify(saved); };
    const elapsed = g.elapsed, before = material();
    g.player.health = 0; const prepared = material();
    g.worldEvolutionUI.refresh(true); g.render();
    if (material() !== prepared || g.elapsed !== elapsed) throw Error('Observer refresh changed the prepared state');
    return { name: 'runtime-observer-health-zero', changed: ['player.health=0'], simulationStepsInjected: 0,
      restoredOrSaved: false, presentationProof: { savedFieldsUnchanged: true, elapsedBefore: elapsed, elapsedAfter: g.elapsed },
      note: 'Runtime visibility probe in an already natively opened paused dossier. It is not a coherent death save or a simulated succession: no save/load, death flag, inventory transfer, pause action or new dossier navigation occurs. Restoring health reproduces the exact original saved state.',
      recoveryState: before };
  }));
  const dead = await observedHud(page, touch);
  const deadCards = await page.locator('#evolutionPanel .evo-card').allTextContents();
  check('Loss of the sole live observer removes group information on the next HUD and dossier refresh', !/HORDE|CONTACTS/.test(dead.status) && deadCards.length === 0 && dead.contacts.every(c => !c.seen), 'fixture');
  await rec.screenshot('fixture-observer-lost-dossier');
  const probe = profile.fixtures.at(-1);
  const restored = await page.evaluate(before => {
    const g = DEADWALL, original = JSON.parse(before); g.player.health = original.player.health;
    g.worldEvolutionUI.refresh(true);
    const { timestamp, ...saved } = g.serialize(); return JSON.stringify(saved) === before;
  }, probe.recoveryState);
  delete probe.recoveryState;
  check('Ending the observer probe restores every original saved field without touching paid gear', restored, 'fixture');
  probe.originalStateRestored = restored;
  profile.preparedVisibility = { hidden, hiddenCards, visible, visibleCards, dead, deadCards, consultationPreservesSave: stableAfter === stableBefore };
}

const harness = await createHarness('quality152', scope), { browser, base, report, output } = harness;
report.profiles = [];
try {
  assert.ok(profiles.length, 'At least one known QA profile is required');
  for (const viewport of profiles) {
    const profile = { viewport, nativeChecks: [], fixtureChecks: [], fixtures: [] }; report.profiles.push(profile);
    let context, page, rec;
    try {
      context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
      page = await context.newPage(); page.setDefaultTimeout(15000);
      rec = recorder(page, profile, output, viewport.name + '-');
      const check = (name, pass, kind = 'native') => { profile[kind === 'fixture' ? 'fixtureChecks' : 'nativeChecks'].push({ name, pass: !!pass }); rec.check(name, pass); };
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page);
      profile.assets = await loadedAssets(page, harness.assetKeys);
      await chooseCampaign(page, '903145'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
      await nativeHarvest(page, context, viewport.touch, rec, profile, check);
      await nativeTraining(page, context, viewport.touch, rec, profile, check);
      await visibilityFixtures(page, viewport.touch, rec, profile, check);
      rec.check('Page, console, HTTP and request error collectors are empty', rec.errors() === 0);
      profile.pass = true;
      console.log(JSON.stringify({ profile: viewport.name, pass: true, checks: profile.checks.length, nativeChecks: profile.nativeChecks.length, fixtureChecks: profile.fixtureChecks.length, screenshots: profile.screenshots.length }));
    } catch (error) {
      profile.pass = false; profile.failure = error.stack; profile.inputFailure = error.deadwallInput;
      if (page) {
        const diagnostic = await page.evaluate(() => { const g = globalThis.DEADWALL; return g ? { raw: g.serialize(), state: g.state, paused: g.paused, overlay: g.activeOverlay?.id, held: [...g.input.keys], elapsed: g.elapsed, notifications: g.notifications.map(n => n.text) } : null; }).catch(() => null);
        if (diagnostic) { const file = viewport.name + '-failure-raw.json'; await writeFile(path.join(output, file), JSON.stringify(diagnostic, null, 2) + '\n'); profile.failureDiagnostic = file; }
      }
      await rec?.screenshot('failure').catch(() => {});
      console.error(JSON.stringify({ profile: viewport.name, failure: profile.failure }));
    } finally { await context?.close(); }
  }
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  if (!report.pass) process.exitCode = 1;
} catch (error) { report.pass = false; report.failure = error.stack; process.exitCode = 1; }
finally { try { await harness.close(); } finally { await harness.finish(); } }
