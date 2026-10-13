import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { createHarness, recorder, ready, loadedAssets, chooseCampaign, worldSnapshot, hasCurrentProgrammes, campaignSnapshot, observeRestore, restoredCampaign } from './browser-qa-common142.mjs';

const harness = await createHarness('pwa', 'Fresh Chromium service worker, exact shell precache, explicit on-demand warming of three optional atlases, offline reload, new G8 campaign and offline save/continue. This checks local browser offline behavior; it does not certify a production origin or physical mobile device.');
const { browser, base, version, output } = harness;
harness.report.profiles = [];
async function runProfile(viewport) {
  const report = { viewport };
  harness.report.profiles.push(report);
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'allow' });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const { check, screenshot, errors } = recorder(page, report, output, viewport.name + '-');
  try {
    const worker = await context.request.get(new URL('sw.js', base).href);
    check('Served service worker HTTP 200', worker.status() === 200);
    const script = await worker.text();
    const cache = script.match(/const CACHE\s*=\s*['"]([^'"]+)['"]\s*;/)?.[1];
    const expression = script.match(/const ASSETS\s*=\s*(\[[\s\S]*?\])\s*;/)?.[1];
    const optionalExpression = script.match(/const OPTIONAL_ASSETS\s*=\s*(\[[\s\S]*?\])\s*;/)?.[1];
    assert.ok(cache && expression && optionalExpression, 'Service worker exposes its exact cache and both asset manifests');
    // Only the literal array is evaluated, without host objects, imports or worker execution.
    const declared = runInNewContext(expression, Object.create(null), { timeout: 100 });
    const optionalDeclared = runInNewContext(optionalExpression, Object.create(null), { timeout: 100 });
    assert.ok(Array.isArray(declared) && declared.every(asset => typeof asset === 'string'), 'Asset manifest is a string array');
    assert.ok(Array.isArray(optionalDeclared) && optionalDeclared.every(asset => typeof asset === 'string'), 'Optional manifest is a string array');
    const assets = declared.map(asset => new URL(asset, base).href);
    const optional = optionalDeclared.map(asset => new URL(asset, base).href), allAssets = [...assets, ...optional];
    report.expected = { cache, precached: assets.length, optional: optional.length, all: allAssets.length };
    check('Worker cache belongs to the current package version', cache.startsWith('deadwall-v' + version + '-') && assets.length > harness.assetKeys.length);
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    check('Online document HTTP 200', response?.status() === 200);
    await ready(page);
    report.initialArt = await page.evaluate(() => ({
      eager: Object.keys(DeadwallArt.ASSETS).filter(key => DeadwallArt.ASSETS[key].lazy !== true).sort(),
      lazy: Object.keys(DeadwallArt.ASSETS).filter(key => DeadwallArt.ASSETS[key].lazy === true).sort(),
      loaded: [...DEADWALL.art.diagnostics.ready].sort(), failed: [...DEADWALL.art.diagnostics.failed]
    }));
    check('Fresh startup decodes exactly 143 eager atlases and leaves three optional sheets unrequested', report.initialArt.eager.length === 143 && report.initialArt.lazy.length === 3 &&
      JSON.stringify(report.initialArt.loaded) === JSON.stringify(report.initialArt.eager) && report.initialArt.failed.length === 0);
    const requiredURLs = await page.evaluate(() => ({ precache: [
      ...Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"],link[rel="manifest"],link[rel="icon"]'), node => node.src || node.href),
      ...Object.values(DeadwallArt.ASSETS).filter(asset => asset.lazy !== true).map(asset => new URL(asset.url, location.href).href),
      ...DeadwallCampaignIntro132.SHOTS.map(shot => new URL(shot.image, location.href).href)
    ], optional: Object.values(DeadwallArt.ASSETS).filter(asset => asset.lazy === true).map(asset => new URL(asset.url, location.href).href) }));
    report.cacheClosure = { required: new Set([...requiredURLs.precache, ...requiredURLs.optional]).size,
      missing: requiredURLs.precache.filter(url => !assets.includes(url)), optionalMissing: requiredURLs.optional.filter(url => !optional.includes(url)) };
    check('Shell precache covers scripts, styles, icons, eager art and introduction images', report.cacheClosure.missing.length === 0);
    check('Only the three lazy PNGs are optional, disjoint from the shell cache', optional.length === 3 && new Set(allAssets).size === allAssets.length &&
      report.cacheClosure.optionalMissing.length === 0 && requiredURLs.optional.every(url => !assets.includes(url)));
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 120000 });
    check('Installed service worker controls the page');
    await page.waitForFunction(async ({ cache, assets }) => {
      const store = await caches.open(cache);
      return (await Promise.all(assets.map(url => store.match(url)))).every(Boolean);
    }, { cache, assets }, { timeout: 120000 });
    report.cache = await page.evaluate(async ({ cache, assets, optional }) => {
      const store = await caches.open(cache), keys = await store.keys();
      return { keys: keys.length, missing: (await Promise.all(assets.map(async url => await store.match(url) ? null : url))).filter(Boolean),
        optionalPresent: (await Promise.all(optional.map(async url => await store.match(url) ? url : null))).filter(Boolean),
        controller: navigator.serviceWorker.controller.scriptURL };
    }, { cache, assets, optional });
    check('Install caches exactly the shell, with zero optional PNG downloads', report.cache.missing.length === 0 && report.cache.keys === new Set(assets).size && report.cache.optionalPresent.length === 0);
    report.onlineAssets = await loadedAssets(page, harness.assetKeys);
    check('Explicit optional requests decode all 146 declared atlases', report.onlineAssets.loaded.length === 146 && report.onlineAssets.preparation.lazyRequested.length === 3);
    await page.waitForFunction(async ({ cache, allAssets }) => {
      const store = await caches.open(cache), keys = await store.keys();
      return keys.length === new Set(allAssets).size && (await Promise.all(allAssets.map(url => store.match(url)))).every(Boolean);
    }, { cache, allAssets }, { timeout: 120000 });
    check('First explicit visits persist the three optional PNGs alongside the intact shell');
    await screenshot('online-menu');
    await context.setOffline(true);
    report.offlineStarted = new Date().toISOString();
    const offlineResponse = await page.reload({ waitUntil: 'load' });
    check('Offline document comes from the service worker', offlineResponse?.status() === 200 && offlineResponse.fromServiceWorker());
    await ready(page);
    check('Current menu and G8 controllers load offline', await page.locator('#mainMenu').isVisible() && (await page.locator('#mainMenu').innerText()).includes('VERSION ' + version) &&
      await page.evaluate(() => !!DeadwallCore.GeographyRules141 && !!DeadwallCore.EcologyRules141 && !!globalThis.DeadwallCodex3000Runtime && !!DEADWALL.frontier));
    report.offlineAssets = await loadedAssets(page, harness.assetKeys);
    check('All 146 atlases decode offline after their real online first requests', report.offlineAssets.loaded.length === 146 &&
      report.offlineAssets.preparation.initial.length === 143 && report.offlineAssets.preparation.lazyRequested.length === 3);
    await chooseCampaign(page);
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(() => document.querySelector('#campaignIntro132 img').complete && document.querySelector('#campaignIntro132 img').naturalWidth > 0);
      await page.locator('#campaignIntro132Next').click();
    }
    await page.waitForFunction(() => document.querySelector('#campaignIntro132 img').complete && document.querySelector('#campaignIntro132 img').naturalWidth > 0);
    check('All introduction tableaux display their images offline');
    await page.locator('#campaignIntro132Next').click();
    await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
    report.offlineWorld = await worldSnapshot(page);
    check('Offline new campaign generates the requested G8 territory', report.offlineWorld.seed === 17117 && report.offlineWorld.generation === 8 && report.offlineWorld.size === 24576 && report.offlineWorld.towns === 34);
    check('Offline generation installs real Codex 3000 places with rooms, resources and road access', hasCurrentProgrammes(report.offlineWorld));
    await screenshot('offline-g8');
    await page.locator('#pauseButton').click();
    await page.locator('#saveButton').click();
    const checkpoint = report.checkpoint = await campaignSnapshot(page);
    check('Offline save button stores a valid identified campaign', checkpoint.ok && !!checkpoint.runId && checkpoint.generation === 8);
    await page.locator('#quitButton').click();
    const continuedResponse = await page.reload({ waitUntil: 'load' });
    check('Second offline reload comes from service worker', continuedResponse?.fromServiceWorker() === true);
  await ready(page);
  await page.waitForFunction(() => !document.getElementById('continueButton').disabled);
  await observeRestore(page);
    await page.locator('#continueButton').click();
    await page.waitForFunction(() => DEADWALL.state === 'playing');
    check('Offline continue restores the same campaign', await restoredCampaign(page, checkpoint));
    report.continuedWorld = await worldSnapshot(page);
    check('Offline continue rebuilds the same current Codex 3000 places and plans', hasCurrentProgrammes(report.continuedWorld) &&
      JSON.stringify(report.continuedWorld.programmes) === JSON.stringify(report.offlineWorld.programmes));
    await screenshot('offline-continued');
    check('No page, console, HTTP or request failures', errors() === 0);
    report.pass = true;
  } catch (error) {
    report.pass = false;
    report.failure = error.stack;
    await screenshot('failure').catch(() => {});
  } finally {
    try { await context.close(); }
    catch (error) { report.pass = false; report.cleanupFailure = error.stack; }
    console.log(JSON.stringify({ viewport: viewport.name, pass: report.pass, checks: report.checks.length, expected: report.expected, failure: report.failure?.split('\n')[0] }));
  }
}
try {
  await runProfile({ name: 'desktop', width: 1280, height: 900 });
  await runProfile({ name: 'mobile', width: 390, height: 844, touch: true });
} finally {
  harness.report.pass = harness.report.profiles.length === 2 && harness.report.profiles.every(profile => profile.pass);
  try { await harness.close(); }
  finally { await harness.finish(); }
}
if (!harness.report.pass) process.exitCode = 1;
