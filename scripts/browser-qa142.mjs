import fs from 'node:fs/promises';
import path from 'node:path';
import { createHarness, recorder, ready, loadedAssets, chooseCampaign, worldSnapshot, campaignSnapshot, observeRestore, restoredCampaign } from './browser-qa-common142.mjs';
import { openCommand as openGrowthCommand, activate as activateGrowth, visibleInPanel } from './browser-qa-common144.mjs';

const harness = await createHarness('browser', 'Real Chromium desktop, laptop and touch viewport input; menu, introduction, HUD, firing, atlas, export/import preview and save/reload/continue. Emulated mobile input does not certify physical devices, audio, performance or accessibility.');
const { browser, base, version, report, output } = harness;
report.profiles = [];
const profiles = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844, touch: true },
  { name: 'mobile-landscape', width: 844, height: 390, touch: true }
];

async function movePlayer(page, context, touch) {
  const before = await page.evaluate(() => ({ x: DEADWALL.player.x, y: DEADWALL.player.y }));
  if (touch) {
    const box = await page.locator('#touchControls [data-dir="right"]').boundingBox();
    if (!box) throw new Error('Touch movement button is missing');
    const session = await context.newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
      await page.waitForFunction(p => Math.hypot(DEADWALL.player.x - p.x, DEADWALL.player.y - p.y) > 5, before);
    } finally {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    }
  } else {
    await page.locator('#game').focus();
    await page.keyboard.down('d');
    try { await page.waitForFunction(p => DEADWALL.player.x - p.x > 5, before); }
    finally { await page.keyboard.up('d'); }
  }
  await page.waitForFunction(() => DEADWALL.input.keys.size === 0);
  return page.evaluate(p => ({ before: p, after: { x: DEADWALL.player.x, y: DEADWALL.player.y } }), before);
}

async function stableCampaign(page) {
  return page.evaluate(() => JSON.stringify({ resources: DEADWALL.resources, player: { x: DEADWALL.player.x, y: DEADWALL.player.y, carry: DEADWALL.player.carry },
    frontier: { seen: DEADWALL.frontier.snapshot().seen, taken: DEADWALL.frontier.snapshot().taken }, elapsed: DEADWALL.elapsed }));
}

async function firePlayer(page, context, touch) {
  const before = await page.evaluate(() => ({ weapon: DEADWALL.player.weapon, magazine: DEADWALL.player.magazine[DEADWALL.player.weapon] }));
  let session;
  try {
    if (touch) {
      const box = await page.locator('#touchFire').boundingBox();
      if (!box) throw new Error('Touch fire button is missing');
      session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
    } else {
      const safe = await page.evaluate(() => DEADWALL.hud135.safeFrame());
      await page.mouse.move((safe.left + safe.right) / 2, (safe.top + safe.bottom) / 2);
      await page.mouse.down();
    }
    await page.waitForFunction(initial => DEADWALL.player.magazine[initial.weapon] < initial.magazine, before);
  } finally {
    if (session) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    } else await page.mouse.up();
  }
  await page.waitForFunction(() => !DEADWALL.input.mouseDown && !DEADWALL.input.touchFire);
  return page.evaluate(initial => ({ before: initial, after: DEADWALL.player.magazine[initial.weapon] }), before);
}

async function stableSave(page) {
  return page.evaluate(() => { const { timestamp, ...saved } = DEADWALL.serialize(); return JSON.stringify(saved); });
}

async function selectImport(page, file) {
  const chooser = page.waitForEvent('filechooser');
  await page.locator('#settingsImport').click();
  await (await chooser).setFiles(file);
}

try {
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const profile = { viewport };
    report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, output, viewport.name + '-');
    try {
      const response = await page.goto(base, { waitUntil: 'networkidle' });
      check('Document HTTP 200', response?.status() === 200);
      await ready(page);
      check('Current menu version is visible', await page.locator('#mainMenu').isVisible() && (await page.locator('#mainMenu').innerText()).includes('VERSION ' + version));
      check('Command dashboard and all six illustrated tabs install', await page.evaluate(() => !!DEADWALL.commandPresentation &&
        DEADWALL.commandPresentation.map.id === 'commandMap129' && document.getElementById('commandDashboard129').parentNode.id === 'commandPanel-enclosure' &&
        document.querySelectorAll('.command-tabs [role="tab"] canvas.command-art129').length === 6));
      profile.assets = await loadedAssets(page, harness.assetKeys);
      check('Every declared art image loads and decodes');
      await screenshot('menu');
      await chooseCampaign(page);
      check('New campaign introduction pauses the world', await page.evaluate(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'campaignIntro132'));
      await page.keyboard.press('Shift+Tab');
      check('Backward tab stays inside introduction', await page.evaluate(() => document.getElementById('campaignIntro132').contains(document.activeElement)));
      for (let i = 0; i < 3; i++) await page.locator('#campaignIntro132Next').click();
      check('Final introduction tableau teaches four real controls', await page.locator('#campaignIntro132Basics').isVisible() && await page.locator('#campaignIntro132Basics dt').count() === 4);
      await screenshot('introduction');
      await page.locator('#campaignIntro132Next').click();
      await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
      check('Taking the first watch resumes play');
      profile.world = await worldSnapshot(page);
      check('Requested seed starts a complete G7 region', profile.world.seed === 17117 && profile.world.generation === 7 && profile.world.size === 24576 && profile.world.towns === 34);
      profile.geometry = await page.evaluate(() => {
        const box = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
        return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
          resources: box('resources'), pause: box('pauseButton'), settings: box('hudSettings14'), objective: box('hud135Objective'),
          objectiveOwner: document.getElementById('hud135Objective').parentNode.id, center: box('hud135Center'),
          touchControls: Array.from(document.querySelectorAll('#touchControls button'), button => {
            const r = button.getBoundingClientRect();
            return { name: button.getAttribute('aria-label') || button.textContent, x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
          }) };
      });
      const geometry = profile.geometry;
      const withinWidth = box => box.width > 0 && box.x >= -1 && box.right <= geometry.width + 1;
      check('HUD resource strip, settings and pause stay inside viewport', withinWidth(geometry.resources) && withinWidth(geometry.settings) && withinWidth(geometry.pause));
      check('HUD creates no horizontal document overflow', geometry.documentWidth <= geometry.width + 1);
      check('First objective is visible outside the situation drawer', geometry.objectiveOwner === 'hud135Right' && await page.locator('#hud135Objective').isVisible() &&
        geometry.objective.y >= 0 && geometry.objective.bottom <= geometry.height);
      if (viewport.touch) {
        check('All touch controls remain inside the viewport', geometry.touchControls.length >= 6 && geometry.touchControls.every(box => withinWidth(box) && box.height > 0 && box.y >= -1 && box.bottom <= geometry.height + 1));
        check('Touch HUD preserves at least 130 pixels of field height', geometry.center.height >= 130);
      }
      if (!await page.locator('#hud135ObjectiveInstructions').evaluate(node => node.open)) {
        await page.locator('#hud135ObjectiveInstructions > summary').click();
        check('Short viewport objective instructions open through their real control', await page.locator('#objectiveText').isVisible());
        await page.locator('#hud135ObjectiveInstructions > summary').click();
      }
      profile.movement = await movePlayer(page, context, viewport.touch);
      check(viewport.touch ? 'Native browser touch hold moves player and releases input' : 'Real keyboard hold moves player and releases input');
      profile.shot = await firePlayer(page, context, viewport.touch);
      check(viewport.touch ? 'Native browser touch fire spends a round and releases input' : 'Real mouse fire spends a round and releases input');
      await screenshot('game');

      await page.locator('#pauseButton').click();
      await page.waitForFunction(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'pauseMenu');
      check('One pause button opens the pause menu', await page.locator('#pauseButton').count() === 1);
      check('Pause exposes one visible settings action', await page.locator('#pauseSettingsButton').isVisible() && !await page.locator('#settingsToggle').isVisible());
      await page.locator('#pauseSettingsButton').click();
      await page.locator('#settingsModal').waitFor({ state: 'visible' });
      check('Real settings action opens the settings dialog', await page.evaluate(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'settingsModal'));
      const downloadEvent = page.waitForEvent('download');
      await page.locator('#settingsExport').click();
      const download = await downloadEvent;
      const exportedFile = viewport.name + '-export.json';
      await download.saveAs(path.join(output, exportedFile));
      const payload = await fs.readFile(path.join(output, exportedFile), 'utf8');
      profile.export = await page.evaluate(raw => {
        const saved = DeadwallSave.parse(raw);
        return { runId: saved.runId, seed: saved.worldSeed, bytes: new TextEncoder().encode(raw).length, limit: DeadwallSave.MAX_FILE_BYTES };
      }, payload);
      profile.export.file = exportedFile;
      check('Real exported download is a bounded importable copy of this campaign', profile.export.bytes <= profile.export.limit && profile.export.seed === 17117 &&
        await page.evaluate(runId => DEADWALL.runId === runId, profile.export.runId));
      const beforeImport = await stableSave(page);
      await selectImport(page, { name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":20}') });
      await page.waitForFunction(() => document.getElementById('settingsStatus').textContent.startsWith('Import refusé.'));
      check('Invalid imported file preserves the live campaign without confirmation', !await page.locator('#settingsImportReview').isVisible() && await stableSave(page) === beforeImport);
      await selectImport(page, path.join(output, exportedFile));
      await page.locator('#settingsImportReview').waitFor({ state: 'visible' });
      check('Valid imported copy is only previewed before confirmation', await stableSave(page) === beforeImport);
      await page.locator('#settingsImportCancel').click();
      check('Cancelling import preserves the campaign', !await page.locator('#settingsImportReview').isVisible() && await stableSave(page) === beforeImport);
      await page.locator('#settingsClose').click();
      await page.waitForFunction(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'pauseMenu');
      check('Closing settings returns to the deliberate pause');
      await page.locator('#replayIntro132').click();
      await page.locator('#campaignIntro132Skip').click();
      check('Skipping replay returns to the deliberate pause', await page.evaluate(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'pauseMenu'));
      await page.locator('#resumeButton').click();
      await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);

      if (!await page.locator('#hud135Map').evaluate(node => node.open)) await page.locator('#hud135Map > summary').click();
      await page.locator('#frontierAccess').click();
      await page.locator('#frontierMap').waitFor({ state: 'visible' });
      check('Real map access opens a paused dossier', await page.evaluate(() => DEADWALL.paused && DEADWALL.activeOverlay?.id === 'commandModal'));
      profile.atlas = await page.evaluate(() => ({ position: DEADWALL.frontierUI.atlas.position(), bounds: DEADWALL.frontierUI.atlas.bounds(), provenance: document.getElementById('atlasWorld').textContent }));
      const pos = profile.atlas.position, bounds = profile.atlas.bounds, size = profile.world.size;
      check('Initial atlas covers and centers the complete region', pos.x === size / 2 && pos.y === size / 2 && bounds.left <= 0 && bounds.top <= 0 && bounds.right >= size && bounds.bottom >= size);
      check('Atlas provenance matches the actual world', profile.atlas.provenance.includes('Graine 17117') && profile.atlas.provenance.includes('G7') && profile.atlas.provenance.includes('24.576'));
      const before = await stableCampaign(page);
      await page.locator('#frontierMap').scrollIntoViewIfNeeded();
      const point = await page.evaluate(() => {
        const w = DEADWALL.frontier.world(), atlas = DEADWALL.frontierUI.atlas, box = document.getElementById('frontierMap').getBoundingClientRect(), pos = atlas.position();
        const x = w.size * .9, y = w.size * .84, screen = atlas.screen(x, y);
        return { x: screen.x * box.width / pos.width, y: screen.y * box.height / pos.height, biome: w.biomeAt(x, y).name };
      });
      await page.locator('#frontierMap').click({ position: { x: point.x, y: point.y } });
      check('Clicking atlas terrain inspects the real biome', await page.evaluate(biome => DEADWALL.frontierUI.atlas.selected()?.kind === 'terrain' && document.getElementById('atlasInspector').textContent.includes(biome), point.biome));
      check('Atlas inspection preserves campaign actors, resources and time', await stableCampaign(page) === before);
      await page.locator('.atlas-layers > summary').click();
      await page.locator('#atlasLayer-biomes').check();
      check('Real checkbox updates biome map layer', await page.evaluate(() => DEADWALL.frontierUI.atlas.layers().biomes === true));
      check('Map layer selection preserves campaign state', await stableCampaign(page) === before);
      await page.locator('#fieldAtlasPanel > summary').click();
      await page.waitForFunction(() => document.getElementById('fieldAtlasBiome').disabled && document.getElementById('fieldAtlasBiomeAdd').disabled);
      check('Tour controls refuse undiscovered destinations', await page.locator('#fieldAtlasBiome').isDisabled() && await page.locator('#fieldAtlasBiomeAdd').isDisabled() &&
        await page.evaluate(() => DEADWALL.fieldAtlas.biomeChoices().length === 0 && DEADWALL.fieldAtlas.snapshot().tour.stops.length === 0));
      await page.locator('#atlasWorld').scrollIntoViewIfNeeded();
      await screenshot('atlas');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !DEADWALL.activeOverlay && !DEADWALL.paused);
      await page.locator('#pauseButton').click();
      await page.locator('#saveButton').click();
      const checkpoint = profile.checkpoint = await campaignSnapshot(page);
      check('Real save button writes a valid identified G7 campaign', checkpoint.ok && checkpoint.generation === 7 && checkpoint.seed === 17117 && !!checkpoint.runId);
      await page.locator('#quitButton').click();
      await page.reload({ waitUntil: 'networkidle' });
      await ready(page);
      await page.waitForFunction(() => !document.getElementById('continueButton').disabled);
      await observeRestore(page);
      await page.locator('#continueButton').click();
      await page.waitForFunction(() => DEADWALL.state === 'playing');
      check('Continue restores every validated campaign field except timestamp and recomputed wave plan', await restoredCampaign(page, checkpoint));
      await screenshot('continued');
      await openGrowthCommand(page, viewport.touch, 'field');
      await activateGrowth(page, '#coordinationTab', viewport.touch);
      await page.locator('#urbanManageJobs').scrollIntoViewIfNeeded();
      profile.growthAction = await visibleInPanel(page, '#urbanManageJobs', '.command-body');
      check('Growth worksite action is visible and has a 44-pixel touch target', profile.growthAction.pass && profile.growthAction.box.height >= 44);
      const growthBefore = await stableSave(page);
      await activateGrowth(page, '#urbanManageJobs', viewport.touch);
      check('Growth action opens the actual worksite tab and restores keyboard focus', await page.evaluate(() => !document.getElementById('citadel-view-works').classList.contains('hidden') &&
        document.getElementById('citadel-sub-works').getAttribute('aria-selected') === 'true' && document.activeElement.id === 'citadel-sub-works'));
      profile.growthDestination = await visibleInPanel(page, '#citadel-sub-works', '.command-body');
      check('Growth destination focus is inside the visible command scroll area', profile.growthDestination.pass);
      check('Opening worksite management does not create an order, stock or construction', await stableSave(page) === growthBefore);
      await screenshot('growth-worksites');
      check('No page, console, HTTP or request errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false;
      profile.failure = error.stack;
      await screenshot('failure').catch(() => {});
    } finally {
      try { await context.close(); }
      catch (error) { profile.pass = false; profile.cleanupFailure = error.stack; }
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); }
  finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
await import('./browser-pwa142.mjs');
