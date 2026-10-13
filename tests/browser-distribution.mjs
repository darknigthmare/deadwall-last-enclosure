import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createHarness, recorder, ready, loadedAssets, chooseCampaign } from '../scripts/browser-qa-common142.mjs';

// Preserve the older invocation aliases while using the maintained browser harness.
if (!process.env.DEADWALL_QA_URL && process.env.DEADWALL_TEST_URL) process.env.DEADWALL_QA_URL = process.env.DEADWALL_TEST_URL;
if (!process.env.CHROMIUM_EXECUTABLE_PATH && process.env.DEADWALL_CHROMIUM) process.env.CHROMIUM_EXECUTABLE_PATH = process.env.DEADWALL_CHROMIUM;
const require = createRequire(import.meta.url), root = fileURLToPath(new URL('..', import.meta.url));
const harness = await createHarness('distribution', 'Real shell precache and first-request optional caching, offline G8, native export, exact standalone file opened offline, invalid import and confirmed web-to-file transfer. No simulation or animation-frame replacement.');
const { browser, base, output, version } = harness;
harness.report.profiles = [];
let exported, exportedIdentity;

async function startup(page, check) {
  await ready(page);
  const result = await page.evaluate(() => ({
    declared: Object.keys(DeadwallArt.ASSETS).sort(),
    eager: Object.keys(DeadwallArt.ASSETS).filter(key => DeadwallArt.ASSETS[key].lazy !== true).sort(),
    lazy: Object.keys(DeadwallArt.ASSETS).filter(key => DeadwallArt.ASSETS[key].lazy === true).sort(),
    ready: [...DEADWALL.art.diagnostics.ready].sort(), failed: [...DEADWALL.art.diagnostics.failed]
  }));
  assert.deepEqual(result.declared, harness.assetKeys);
  check('Current menu starts with 143 eager atlases and three undecoded optional atlases', result.eager.length === 143 && result.lazy.length === 3 &&
    JSON.stringify(result.ready) === JSON.stringify(result.eager) && result.failed.length === 0);
  return result;
}
async function cachedURLs(page, cache) {
  return page.evaluate(async name => (await (await caches.open(name)).keys()).map(request => request.url).sort(), cache);
}
async function startPlaying(page, seed, check) {
  await chooseCampaign(page, seed);
  check('Fresh campaign intro pauses the native initial timer', await page.evaluate(() => DEADWALL.paused && DEADWALL.phaseTime === 210));
  await page.locator('#campaignIntro132Skip').click();
  await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
  check('Native campaign starts with the requested seed and G8 generation', await page.evaluate(expected => DEADWALL.world.seed === Number(expected) && DEADWALL.frontier.world().generation === 8 &&
    DEADWALL.phaseTime > 0 && DEADWALL.phaseTime <= 210, seed));
}
async function settingsFromGame(page) {
  await page.locator('#pauseButton').click();
  await page.locator('#pauseMenu').waitFor({ state: 'visible' });
  await page.locator('#pauseSettingsButton').click();
  await page.locator('#settingsModal').waitFor({ state: 'visible' });
}
async function profile(name, options, run) {
  const report = { name };harness.report.profiles.push(report);
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...options });
  const page = await context.newPage();page.setDefaultTimeout(120000);
  const checks = recorder(page, report, output, name + '-');
  try { await run(context, page, report, checks);checks.check('No JavaScript, console, HTTP or request failures', checks.errors() === 0);report.pass = true; }
  catch (error) { report.pass = false;report.failure = error.stack;await checks.screenshot('failure').catch(() => {}); }
  finally {
    try { await context.close(); } catch (error) { report.pass = false;report.cleanupFailure = error.stack; }
    console.log(JSON.stringify({ name, pass: report.pass, checks: report.checks.length, failure: report.failure?.split('\n')[0] }));
  }
}

try {
  await profile('pwa', { serviceWorkers: 'allow' }, async (context, page, report, { check, screenshot }) => {
    const response = await page.goto(base, { waitUntil: 'load' });check('Online document HTTP 200', response?.status() === 200);
    report.initialArt = await startup(page, check);
    const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.src));
    for (const url of scripts) assert.equal((await context.request.get(url)).status(), 200, url);
    for (const name of ['package.json', 'reports/private-audit.log']) assert.equal((await context.request.get(new URL(name, base).href)).status(), 404, name);
    check('Every current runtime script is served; development metadata and reports are refused', scripts.length > 49);
    const worker = await context.request.get(new URL('sw.js', base).href);assert.equal(worker.status(), 200);
    const source = await worker.text(), cache = source.match(/const CACHE\s*=\s*['"]([^'"]+)['"]\s*;/)?.[1];
    const literal = name => { const expression = source.match(new RegExp('const ' + name + '\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;'))?.[1];assert.ok(expression, name);return runInNewContext(expression, Object.create(null), { timeout: 100 }); };
    const shell = literal('ASSETS').map(file => new URL(file, base).href), optional = literal('OPTIONAL_ASSETS').map(file => new URL(file, base).href);
    check('Versioned shell and optional manifests are disjoint', cache?.startsWith('deadwall-v' + version + '-') && optional.length === 3 && new Set([...shell, ...optional]).size === shell.length + optional.length);
    report.worker = { cache, shell: shell.length, optional: optional.length };
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.waitForFunction(async ({ cache, shell }) => {
      const store = await caches.open(cache);return (await Promise.all(shell.map(url => store.match(url)))).every(Boolean);
    }, { cache, shell });
    report.installedURLs = await cachedURLs(page, cache);assert.deepEqual(report.installedURLs, [...new Set(shell)].sort());
    check('Real PWA installation caches exactly ASSETS, without the three optional PNGs');
    report.onlineAssets = await loadedAssets(page, harness.assetKeys);check('Explicit optional requests decode all 146 declared atlases', report.onlineAssets.loaded.length === 146);
    await page.waitForFunction(async ({ cache, optional }) => (await Promise.all(optional.map(async url => (await caches.open(cache)).match(url)))).every(Boolean), { cache, optional });
    report.warmedURLs = await cachedURLs(page, cache);assert.deepEqual(report.warmedURLs, [...new Set([...shell, ...optional])].sort());
    check('Real first requests append exactly three optional cache entries');
    await context.setOffline(true);const offlineResponse = await page.reload({ waitUntil: 'load' });
    check('Actual offline reload is served by the service worker', offlineResponse?.status() === 200 && offlineResponse.fromServiceWorker());
    report.offlineInitialArt = await startup(page, check);report.offlineAssets = await loadedAssets(page, harness.assetKeys);
    check('All 146 atlas images decode offline from the visited cache', report.offlineAssets.loaded.length === 146 && report.offlineAssets.failed.length === 0);
    await startPlaying(page, '17117', check);
    await page.locator('#pauseButton').click();await page.locator('#saveButton').click();
    check('Offline save control writes a valid current campaign', await page.evaluate(() => DEADWALL.lastSaveStatus.ok && DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY)).version === 20));
    await page.locator('#pauseSettingsButton').click();await page.locator('#settingsModal').waitFor({ state: 'visible' });
    const pending = page.waitForEvent('download');await page.locator('#settingsExport').click();const download = await pending;
    const destination = path.join(output, 'exported-save.json');await download.saveAs(destination);exported = await fs.readFile(destination);
    const data = require('../src/save.js').parse(exported.toString('utf8'));
    exportedIdentity = { version: data.version, runId: data.runId, seed: data.worldSeed, generation: data.frontier.generation };
    check('Native JSON export is validated and preserves the G8 campaign identity', data.version === 20 && data.worldSeed === 17117 && data.frontier.generation === 8 &&
      await page.evaluate(runId => DEADWALL.runId === runId, data.runId));
    report.export = { ...exportedIdentity, bytes: exported.length };await screenshot('offline-export');
  });
  await profile('standalone', { serviceWorkers: 'block' }, async (context, page, report, { check, screenshot }) => {
    report.externalRequests = [];page.on('request', request => { if (/^https?:|^wss?:/i.test(request.url())) report.externalRequests.push(request.url()); });
    await context.setOffline(true);const file = path.resolve(process.env.DEADWALL_STANDALONE_FILE || path.join(root, 'DEADWALL_Standalone.html'));
    report.file = file;await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });report.initialArt = await startup(page, check);
    check('Standalone opens the current exact version with no network', (await page.locator('#mainMenu').innerText()).includes('VERSION ' + version) && report.externalRequests.length === 0);
    report.assets = await loadedAssets(page, harness.assetKeys);check('All 146 PNGs decode from embedded data, with optional loading on demand', report.assets.loaded.length === 146 &&
      await page.evaluate(() => Object.values(DeadwallArt.ASSETS).every(asset => /^data:image\//.test(asset.url))));
    await startPlaying(page, '99', check);
    check('Existing command, frontier, routing, supplies, recon and salvage controllers remain installed', await page.evaluate(() => !!DEADWALL.essentials && !!DEADWALL.essentialUI &&
      !!DEADWALL.fieldAtlas && !!DEADWALL.fieldAtlasUI && !!DEADWALL.returnRoutes && !!DEADWALL.returnRoutesUI && !!DEADWALL.frontierUI.atlas && !!DEADWALL.fieldSupplies &&
      !!DEADWALL.fieldSuppliesUI && !!DEADWALL.frontier && !!DEADWALL.frontier.quiet && !!DeadwallFrontierSpecialists && !!DeadwallFrontierPlaces && !!DeadwallFrontierRouting &&
      DeadwallCore.SAVE_VERSION === 20 && !!DEADWALL.recon && !!DEADWALL.reconUI && !!DeadwallReconArt && !!DEADWALL.salvage && !!DEADWALL.salvageUI));
    await settingsFromGame(page);await page.evaluate(() => { globalThis.__DISTRIBUTION_WORLD_BEFORE_IMPORT__ = DEADWALL.world; });
    await page.locator('#settingsImportFile').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{invalid') });
    await page.waitForFunction(() => document.getElementById('settingsStatus').textContent.includes('Import refusé'));
    check('Malformed import leaves the same native campaign untouched and shows no confirmation', await page.evaluate(() => DEADWALL.world === globalThis.__DISTRIBUTION_WORLD_BEFORE_IMPORT__) && !await page.locator('#settingsImportReview').isVisible());
    assert.ok(exported && exportedIdentity, 'The actual web export must have succeeded before transfer');
    await page.locator('#settingsImportFile').setInputFiles({ name: 'DEADWALL-transfer.json', mimeType: 'application/json', buffer: exported });
    await page.locator('#settingsImportReview').waitFor({ state: 'visible' });
    check('Valid import preview does not replace the current seed or world', await page.evaluate(() => DEADWALL.world.seed === 99 && DEADWALL.world === globalThis.__DISTRIBUTION_WORLD_BEFORE_IMPORT__));
    await page.locator('#settingsImportConfirm').click();
    await page.waitForFunction(identity => DEADWALL.state === 'playing' && DEADWALL.runId === identity.runId && DEADWALL.world.seed === identity.seed, exportedIdentity);
    report.import = await page.evaluate(() => { const data = DeadwallSave.validate(DEADWALL.serialize());return { version: data.version, runId: data.runId, seed: data.worldSeed, generation: data.frontier.generation }; });
    assert.deepEqual(report.import, exportedIdentity);check('Confirmed web-to-file import restores the same validated campaign identity');
    check('Standalone never requests external HTTP or websocket resources', report.externalRequests.length === 0);
    await page.locator('#reconMapButton').click();await screenshot('transferred-campaign');
  });
} finally {
  harness.report.pass = harness.report.profiles.length === 2 && harness.report.profiles.every(report => report.pass);
  try { await harness.close(); } finally { await harness.finish(); }
}
if (!harness.report.pass) process.exitCode = 1;
