import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createGameServer } from './server.mjs';

const require = createRequire(import.meta.url);
const repository = fileURLToPath(new URL('..', import.meta.url));
const { version } = require('../package.json');
const assetKeys = Object.keys(require('../src/art.js').ASSETS).sort();

/** Fresh profiles and an ephemeral local server keep QA independent of developer state. */
export async function createHarness(kind, scope) {
  const output = path.resolve(process.env.DEADWALL_QA_OUTPUT || path.join(repository, 'artifacts', 'qa'),
    kind + '-' + new Date().toISOString().replace(/[^0-9A-Za-z_-]/g, '_'));
  await fs.mkdir(output, { recursive: true });
  let server;
  let base = process.env.DEADWALL_QA_URL;
  if (!base) {
    server = createGameServer({ rootDirectory: process.env.DEADWALL_QA_ROOT || repository });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    base = 'http://127.0.0.1:' + server.address().port;
  }
  base = new URL(base).href;
  const report = { started: new Date().toISOString(), version, base, output, scope };
  let browser;
  const close = async () => {
    try {
      try { await browser?.close(); }
      finally {
        if (server) {
          server.closeAllConnections();
          await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        }
      }
    } catch (error) {
      report.pass = false;
      report.cleanupFailure = error.stack;
      throw error;
    }
  };
  try {
    const { chromium } = require('playwright');
    const launch = { headless: true };
    if (process.env.CHROMIUM_EXECUTABLE_PATH) launch.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
    browser = await chromium.launch(launch);
    report.browserVersion = browser.version();
  } catch (error) {
    await close();
    throw error;
  }
  return {
    browser, base, version, assetKeys, report, output, close,
    async finish() {
      report.completed = new Date().toISOString();
      const file = path.join(output, 'report.json');
      await fs.writeFile(file, JSON.stringify(report, null, 2) + '\n');
      console.log('Report: ' + file);
    }
  };
}

export function recorder(page, report, output, prefix = '') {
  Object.assign(report, { checks: [], pageErrors: [], consoleErrors: [], httpErrors: [], requestFailures: [], screenshots: [] });
  page.on('pageerror', error => report.pageErrors.push({ message: error.message, stack: error.stack }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('response', response => {
    if (response.status() >= 400) report.httpErrors.push({ status: response.status(), url: response.url() });
  });
  page.on('requestfailed', request => report.requestFailures.push({ url: request.url(), failure: request.failure()?.errorText }));
  return {
    check(name, condition = true) {
      report.checks.push({ name, pass: !!condition });
      assert.ok(condition, name);
    },
    async screenshot(name) {
      const file = prefix + name + '.png';
      await page.screenshot({ path: path.join(output, file) });
      report.screenshots.push(file);
    },
    errors() {
      return report.pageErrors.length + report.consoleErrors.length + report.httpErrors.length + report.requestFailures.length;
    }
  };
}

export async function ready(page) {
  await page.waitForFunction(() => globalThis.DEADWALL?.campaignIntro132 && DEADWALL.frontierUI && DEADWALL.fieldAtlasUI && !document.getElementById('newGameButton').disabled,
    null, { timeout: 120000 });
  await page.evaluate(() => DEADWALL.art.ready);
}

export async function loadedAssets(page, expected) {
  const result = await page.evaluate(() => ({
    declared: Object.keys(DeadwallArt.ASSETS).sort(),
    loaded: [...DEADWALL.art.diagnostics.ready].sort(),
    failed: DEADWALL.art.diagnostics.failed
  }));
  assert.deepEqual(result.declared, expected, 'Browser and source declare the same art assets');
  assert.deepEqual(result.loaded, expected, 'Every declared art asset loads and decodes');
  assert.deepEqual(result.failed, [], 'No art decoding failures');
  return result;
}

export async function chooseCampaign(page, seed = '17117') {
  if (!await page.locator('#campaignMap132').evaluate(node => node.open)) await page.locator('#campaignMap132 > summary').click();
  await page.locator('#mapSeed').fill(seed);
  await page.locator('#newGameButton').click();
  await page.waitForFunction(() => DEADWALL.state === 'playing' && DEADWALL.campaignIntro132.isOpen(), null, { timeout: 120000 });
}

export async function worldSnapshot(page) {
  return page.evaluate(() => {
    const w = DEADWALL.frontier.world();
    return { seed: w.seed, generation: w.generation, size: w.size, towns: w.towns.length, home: w.home };
  });
}

export async function campaignSnapshot(page) {
  const { material, ...checkpoint } = await page.evaluate(() => {
    const saved = DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));
    // The base engine recomputes a missing calm-phase wave plan on restoration.
    const { timestamp, wavePlan, ...material } = saved;
    return { ok: DEADWALL.lastSaveStatus.ok, version: saved.version, runId: saved.runId, generation: saved.frontier.generation,
      seed: saved.worldSeed, buildings: saved.buildings.length, resources: saved.resources, player: saved.player, material: JSON.stringify(material) };
  });
  checkpoint.materialHash = createHash('sha256').update(material).digest('hex');
  Object.defineProperty(checkpoint, 'material', { value: material });
  return checkpoint;
}

export async function observeRestore(page) {
  // This observes the fully installed restore chain before its first simulation frame.
  // A live read after a click would miss corruption behind normal economy/movement.
  await page.evaluate(() => {
    const game = DEADWALL, restore = game.restoreSave.bind(game);
    globalThis.__DEADWALL_QA_RESTORED__ = null;
    game.restoreSave = (...args) => {
      const result = restore(...args);
      const { timestamp, wavePlan, ...material } = DeadwallSave.validate(game.serialize());
      globalThis.__DEADWALL_QA_RESTORED__ = material;
      return result;
    };
  });
}

export async function restoredCampaign(page, checkpoint) {
  checkpoint.restoreComparison = await page.evaluate(({ cp, material }) => {
    const restored = globalThis.__DEADWALL_QA_RESTORED__;
    if (!restored) return { pass: false, changedKeys: ['restore-observation-missing'] };
    const expected = JSON.parse(material), keys = new Set([...Object.keys(expected), ...Object.keys(restored)]);
    const changedKeys = [...keys].filter(key => JSON.stringify(expected[key]) !== JSON.stringify(restored[key]));
    return { pass: changedKeys.length === 0 && DEADWALL.world.seed === cp.seed && DEADWALL.frontier.snapshot().generation === cp.generation &&
      DEADWALL.runId === cp.runId && !DEADWALL.campaignIntro132.isOpen() && DEADWALL.world.buildings.size === cp.buildings, changedKeys };
  }, { cp: checkpoint, material: checkpoint.material });
  return checkpoint.restoreComparison.pass;
}
