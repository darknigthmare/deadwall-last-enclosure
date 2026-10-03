import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export { createHarness, recorder, ready, chooseCampaign } from './browser-qa-common142.mjs';

export async function activate(page, selector, touch = false) {
  const control = page.locator(selector);
  if (touch) await control.tap(); else await control.click();
}

export async function openCommand(page, touch, tab = 'field') {
  if (!await page.locator('#pauseMenu').isVisible()) await activate(page, '#pauseButton', touch);
  await activate(page, '#pauseCommandButton', touch);
  await page.locator('#commandModal').waitFor({ state: 'visible' });
  await activate(page, '#commandTab-' + tab, touch);
}

export async function resumeCommand(page, touch) {
  await activate(page, '#commandReturn129', touch);
  if (await page.locator('#pauseMenu').isVisible()) await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}

export async function holdInput(page, context, touch, key, selector, action) {
  let session;
  if (touch) {
    const box = await page.locator(selector).boundingBox();
    assert.ok(box && box.width > 0 && box.height > 0, 'Native touch control has a visible box');
    session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  } else {
    await page.locator('#game').focus();
    await page.keyboard.down(key);
  }
  try { return await action(); }
  catch (error) {
    error.deadwallInput = await page.evaluate(() => ({ held: [...DEADWALL.input.keys], pressed: [...DEADWALL.input.pressed], paused: DEADWALL.paused,
      overlay: DEADWALL.activeOverlay?.id, focus: document.activeElement?.id, player: { x: DEADWALL.player.x, y: DEADWALL.player.y } })).catch(() => null);
    throw error;
  }
  finally {
    if (session) {
      try { await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
      finally { await session.detach(); }
    } else await page.keyboard.up(key);
  }
}

/** Check clipping and hit-testing before Playwright can scroll a target into view. */
export async function visibleInPanel(page, selector, container = '#hud135Right') {
  return page.locator(selector).evaluate((node, container) => {
    const r = node.getBoundingClientRect(), parent = document.querySelector(container).getBoundingClientRect();
    const box = rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right });
    const shown = node.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true });
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const interactive = node.matches('button,summary,input,select,a,[role="button"]');
    return { pass: shown && r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 &&
      r.left >= parent.left - 1 && r.right <= parent.right + 1 && r.top >= parent.top - 1 && r.bottom <= parent.bottom + 1 && (!interactive || !!hit && (hit === node || node.contains(hit))),
      box: box(r), panel: box(parent), hit: hit?.id || hit?.tagName, scrollTop: document.querySelector(container).scrollTop };
  }, container);
}

/** Capture the validated save written by the real save button, excluding its date. */
export async function persistedSnapshot(page) {
  const { material, ...checkpoint } = await page.evaluate(() => {
    const saved = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));
    const { timestamp, ...material } = saved;
    return { ok: DEADWALL.lastSaveStatus.ok, runId: saved.runId, seed: saved.worldSeed, generation: saved.frontier.generation,
      phase: saved.phase, wave: saved.wave, resources: saved.resources, player: saved.player, material: JSON.stringify(material) };
  });
  checkpoint.materialHash = createHash('sha256').update(material).digest('hex');
  Object.defineProperty(checkpoint, 'material', { value: material });
  return checkpoint;
}

/** Observe the installed restore chain synchronously before its first RAF update. */
export async function observePersistentRestore(page) {
  await page.evaluate(() => {
    const game = DEADWALL, restore = game.restoreSave.bind(game);
    globalThis.__DEADWALL_QA_RESTORED_144__ = null;
    game.restoreSave = (...args) => {
      const result = restore(...args);
      const { timestamp, ...material } = DeadwallSave.validate(game.serialize());
      globalThis.__DEADWALL_QA_RESTORED_144__ = material;
      return result;
    };
  });
}

/** Only oversized legacy queues undergo the representation migration in restoreSave. */
export function persistentRestoreComparison({ material, cp, observationKey = '__DEADWALL_QA_RESTORED_144__', wavePlanObservationKey }, runtime = globalThis) {
  const { DeadwallCore, DEADWALL } = runtime;
  const expected = JSON.parse(material), observation = runtime[observationKey];
  if (!observation) return { pass: false, changedKeys: ['restore-observation-missing'], normalizedFields: [] };
  const restored = wavePlanObservationKey ? { ...observation, wavePlan: runtime[wavePlanObservationKey] } : observation;
  const legacyQueueMigration = expected.spawnQueue.length > DeadwallCore.STRATEGY_RULES.spawnBatch;
  const normalize = saved => {
    if (!legacyQueueMigration) return saved;
    const { spawnQueue, pendingSpawns, ...state } = saved;
    return { ...state, spawnQueue: [], pendingSpawns: DeadwallCore.normalizeSpawnCounts(pendingSpawns, spawnQueue) };
  };
  const before = normalize(expected), after = normalize(restored), keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedKeys = [...keys].filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  const remaining = saved => saved.spawnQueue.length + Object.values(saved.pendingSpawns).reduce((total, count) => total + count, 0) + saved.zombies.length;
  const identityPreserved = DEADWALL.runId === cp.runId && (cp.seed === undefined || DEADWALL.world.seed === cp.seed) &&
    (cp.generation === undefined || DEADWALL.frontier.snapshot().generation === cp.generation) &&
    (cp.buildings === undefined || DEADWALL.world.buildings.size === cp.buildings) && !DEADWALL.campaignIntro132.isOpen();
  return { pass: changedKeys.length === 0 && remaining(before) === remaining(after) && identityPreserved,
    changedKeys, normalizedFields: legacyQueueMigration ? ['spawnQueue', 'pendingSpawns'] : [], legacyQueueMigration,
    expectedQueue: expected.spawnQueue, restoredQueue: restored.spawnQueue, expectedPending: before.pendingSpawns, restoredPending: after.pendingSpawns,
    expectedRemaining: remaining(before), restoredRemaining: remaining(after), expectedRNG: before.randomState, restoredRNG: after.randomState,
    wavePlanPreserved: JSON.stringify(before.wavePlan) === JSON.stringify(after.wavePlan), nightPreserved: JSON.stringify(before.dayworks?.night) === JSON.stringify(after.dayworks?.night) };
}

export async function comparePersistentRestore(page, checkpoint) {
  const comparison = await page.evaluate(persistentRestoreComparison, { material: checkpoint.material, cp: checkpoint });
  checkpoint.restoreComparison = comparison;
  return comparison.pass;
}

export async function saveReloadContinue(page, touch) {
  await activate(page, '#pauseButton', touch);
  await activate(page, '#saveButton', touch);
  const checkpoint = await persistedSnapshot(page);
  assert.ok(checkpoint.ok, 'The real local save succeeds');
  await activate(page, '#quitButton', touch);
  await page.reload({ waitUntil: 'networkidle' });
  const { ready } = await import('./browser-qa-common142.mjs');
  await ready(page);
  await observePersistentRestore(page);
  await activate(page, '#continueButton', touch);
  await page.waitForFunction(() => DEADWALL.state === 'playing');
  checkpoint.pass = await comparePersistentRestore(page, checkpoint);
  return checkpoint;
}
