import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { ready, loadedAssets, chooseCampaign, worldSnapshot, recorder } from './browser-qa-common142.mjs';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
let selectedFile, transport = 'file';
for (let i = 0; i < args.length; i += 2) {
  if (!args[i + 1] || !['--file', '--transport'].includes(args[i])) throw Error('Usage : node scripts/browser-standalone142.mjs [--file HTML] [--transport file|http]');
  if (args[i] === '--file') selectedFile = args[i + 1];
  else transport = args[i + 1];
}
if (!['file', 'http'].includes(transport)) throw Error('Transport autonome inconnu.');
const file = path.resolve(selectedFile || path.join(root, 'DEADWALL_Standalone.html'));
const bytes = await fs.readFile(file);
const { version } = require('../package.json');
const expectedAssets = Object.keys(require('../src/art.js').ASSETS).sort();
const output = path.join(path.resolve(process.env.DEADWALL_QA_OUTPUT || path.join(root, 'artifacts', 'qa')), 'standalone-' + new Date().toISOString().replace(/[^0-9A-Za-z_-]/g, '_'));
await fs.mkdir(output, { recursive: true });
const report = { started: new Date().toISOString(), version, file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
  transport, fileSchemeVerified: false,
  scope: 'Actual Chromium launch of the exact standalone bytes, all embedded images decoded, fresh G7, real save/export controls. HTTP mode serves only this HTML and does not certify file:// storage or native Windows.' };
let browser, checks, server;
try {
  let documentURL = pathToFileURL(file).href;
  if (transport === 'http') {
    server = createServer((request, response) => {
      if (request.url === '/' && request.method === 'GET') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(bytes); }
      else { response.writeHead(request.url === '/favicon.ico' ? 204 : 404); response.end(); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    documentURL = 'http://127.0.0.1:' + server.address().port + '/';
  }
  const { chromium } = require('playwright');
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  checks = recorder(page, report, output);
  report.externalRequests = [];
  page.on('request', request => { if (/^https?:|^wss?:/i.test(request.url()) && request.url() !== documentURL && request.url() !== new URL('favicon.ico', documentURL).href) report.externalRequests.push(request.url()); });
  await page.goto(documentURL, { waitUntil: 'load' });
  await ready(page);
  checks.check('Current standalone menu visible', await page.locator('#mainMenu').isVisible() && (await page.locator('#mainMenu').innerText()).includes('VERSION ' + version));
  report.assets = await loadedAssets(page, expectedAssets);
  checks.check('Every declared image decodes from embedded data', report.assets.loaded.length === expectedAssets.length);
  checks.check('Complete command dashboard installed', await page.evaluate(() => !!DEADWALL.commandPresentation && document.getElementById('commandDashboard129')?.parentNode.id === 'commandPanel-enclosure'));
  await checks.screenshot('menu');
  await chooseCampaign(page);
  await page.locator('#campaignIntro132Skip').click();
  await page.waitForFunction(() => DEADWALL.state === 'playing' && !DEADWALL.paused && !DEADWALL.activeOverlay);
  report.world = await worldSnapshot(page);
  checks.check('Fresh requested G7 world generated entirely offline', report.world.seed === 17117 && report.world.generation === 7 && report.world.size === 24576 && report.world.towns === 34);
  await checks.screenshot('game');
  await page.locator('#pauseButton').click();
  await page.locator('#saveButton').click();
  const checkpoint = await page.evaluate(() => {
    const data = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));
    return { ok: DEADWALL.lastSaveStatus.ok, version: data.version, runId: data.runId, seed: data.worldSeed, generation: data.frontier.generation };
  });
  checks.check('Real save control writes a validated v20 G7 snapshot', checkpoint.ok && checkpoint.version === 20 && checkpoint.generation === 7 && checkpoint.seed === 17117);
  await page.locator('#pauseSettingsButton').click();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#settingsExport').click();
  const download = await downloadEvent;
  const exportedFile = path.join(output, 'portable-save.json');
  await download.saveAs(exportedFile);
  const exported = await fs.readFile(exportedFile, 'utf8');
  const imported = await page.evaluate(text => {
    const data = DeadwallSave.parse(text);
    return { version: data.version, runId: data.runId, seed: data.worldSeed, generation: data.frontier.generation, maxBytes: DeadwallSave.MAX_FILE_BYTES };
  }, exported);
  report.export = { bytes: Buffer.byteLength(exported), sha256: createHash('sha256').update(exported).digest('hex') };
  checks.check('Completed portable download is importable and keeps campaign identity', imported.version === 20 && imported.runId === checkpoint.runId && imported.seed === checkpoint.seed && imported.generation === checkpoint.generation && report.export.bytes <= imported.maxBytes);
  checks.check('No external network dependency requested from standalone', report.externalRequests.length === 0);
  checks.check('No runtime, console or loading errors', checks.errors() === 0);
  report.pass = true;
  report.fileSchemeVerified = transport === 'file';
} catch (error) {
  report.pass = false;
  report.failure = error.stack;
  await checks?.screenshot('failure').catch(() => {});
} finally {
  try { await browser?.close(); } catch (error) { report.pass = false; report.cleanupFailure = error.stack; }
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  report.completed = new Date().toISOString();
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ pass: report.pass, checks: report.checks?.length, failure: report.failure?.split('\n')[0], report: path.join(output, 'report.json') }));
}
assert.ok(report.pass, 'Standalone Chromium QA failed; see report');
