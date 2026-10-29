import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createGameServer} from './server.mjs';
import {ready, chooseCampaign, recorder} from './browser-qa-common142.mjs';
import {activate} from './browser-qa-common144.mjs';

const require = createRequire(import.meta.url), repository = fileURLToPath(new URL('..', import.meta.url));
const Sources = require('./campaign-sources205.cjs'), Manifest = require('./public-manifest183.cjs');
const root = path.resolve(process.env.DEADWALL_QA_ROOT || path.join(repository, 'dist'));
const output = path.resolve(process.env.DEADWALL_QA_OUTPUT || path.join(repository, 'artifacts/qa'),
  'feedback215-' + new Date().toISOString().replace(/[^0-9A-Za-z_-]/g, '_'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const views = [{name: 'desktop', width: 1366, height: 900}, {name: 'touch', width: 390, height: 844, touch: true}];
const selected = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = selected ? views.filter(view => selected.includes(view.name)) : views;
assert.ok(profiles.length, 'At least one known browser profile is required');
await mkdir(output, {recursive: true});
const report = {startedUtc: new Date().toISOString(), root, profiles: [], pass: false,
  scope: 'Current player title and G11 campaign, seed17117 entered through native controls. Desktop I, Enter, NumpadEnter and Escape, plus touch inventory navigation, use native browser input. Explicit roadwork fixture on desktop: equip the existing roadwork tool through its real owner, then navigate Pause/Settings/Escape without injected simulation steps. Explicit camera fixture: one point of damage through the real damage owner followed immediately by ordinary Pause, without an injected simulation step. Explicit audio interruption: suspend the real browser AudioContext, submit120 diagnostic tone/noise requests while paused, then resume through the native mute setting. No physical phone/audio-device listening, human campaign or GPU performance claim.',
  sourcesBefore: Sources.capture(repository), scriptSha256: hash(await readFile(fileURLToPath(import.meta.url)))};
let browser, server;

async function pausedFrameSamples(page, count = 8) {
  return page.evaluate(async count => {
    const g = DEADWALL, material = () => {const {timestamp, ...save} = g.serialize(); return JSON.stringify(save);};
    const before = material(), elapsed = g.elapsed, amplitude = g.camera.shake, samples = [];
    if (!g.paused || !g.activeOverlay) throw Error('Frame observation requires an actual modal pause');
    for (let n = 0; n < count; n++) {
      await new Promise(requestAnimationFrame);
      samples.push({...g.frameShake});
    }
    return {elapsed, elapsedAfter: g.elapsed, amplitude, samples,
      unchanged: before === material(), paused: g.paused, overlay: g.activeOverlay?.id};
  }, count);
}

async function heldMenuActivation(page, rec, profile) {
  profile.menuActivation = [];
  for (const key of ['Enter', 'NumpadEnter']) for (const menu of [
    {name: 'Pause', opener: 'pauseButton', overlay: 'pauseMenu', closer: '#resumeButton'},
    {name: 'Bag', opener: 'carryIndicator', overlay: 'loadout129', closer: '#loadout129 .loadout-close'},
    {name: 'Settings', opener: 'pauseSettingsButton', overlay: 'settingsModal', closer: '#settingsClose', fromPause: true}
  ]) {
    if (menu.fromPause) await page.locator('#pauseButton').click();
    await page.locator('#' + menu.opener).focus();
    await page.evaluate(() => { __feedback216Keys = []; });
    const result = {key, menu: menu.name, repeats: []}; profile.menuActivation.push(result);
    try {
      await page.keyboard.down(key);
      result.opened = await page.evaluate(({overlay, closer}) => ({
        overlay: DEADWALL.activeOverlay?.id || null, paused: DEADWALL.paused, elapsed: DEADWALL.elapsed,
        focus: document.activeElement.id || document.activeElement.className,
        focusOnClose: document.activeElement === document.querySelector(closer),
        expectedOverlay: DEADWALL.activeOverlay === document.getElementById(overlay)
      }), menu);
      rec.check(key + ' first press opens ' + menu.name + ' and focuses its ordinary close control',
        result.opened.expectedOverlay && result.opened.paused && result.opened.focusOnClose);
      for (let n = 0; n < 4; n++) {
        await page.keyboard.down(key);
        result.repeats.push(await page.evaluate(() => ({
          overlay: DEADWALL.activeOverlay?.id || null, paused: DEADWALL.paused,
          elapsed: DEADWALL.elapsed, focus: document.activeElement.id || document.activeElement.className
        })));
      }
      result.events = await page.evaluate(() => __feedback216Keys);
      result.frames = await pausedFrameSamples(page, 4);
      rec.check(key + ' native repeats preserve ' + menu.name + ', its focus and the paused campaign',
        result.repeats.every(s => s.overlay === menu.overlay && s.paused &&
          s.elapsed === result.opened.elapsed && s.focus === result.opened.focus) && result.frames.unchanged &&
        result.events.length === 5 && result.events.every(e => e.trusted && e.code === key) &&
        !result.events[0].repeat && result.events.slice(1).every(e => e.repeat));
    } finally {await page.keyboard.up(key);}
    await page.keyboard.press(key);
    result.closed = await page.evaluate(() => ({overlay: DEADWALL.activeOverlay?.id || null,
      paused: DEADWALL.paused, focus: document.activeElement.id}));
    rec.check('A fresh ' + key + ' press closes ' + menu.name + ' and restores its originating screen',
      result.closed.overlay === (menu.fromPause ? 'pauseMenu' : null) &&
      result.closed.paused === !!menu.fromPause && result.closed.focus === menu.opener);
    if (menu.fromPause) await page.locator('#resumeButton').click();
  }
}

async function roadworkEscape(page, rec, profile) {
  profile.roadworkFixture = await page.evaluate(() => {
    const elapsed = DEADWALL.elapsed, equipped = DEADWALL.infrastructure.equip();
    return {method: 'DEADWALL.infrastructure.equip()', equipped, tool: DEADWALL.infrastructure.toolActive(),
      elapsedBefore: elapsed, elapsedAfter: DEADWALL.elapsed, injectedSteps: 0};
  });
  const fixture = profile.roadworkFixture;
  rec.check('The declared roadwork fixture equips the existing tool without advancing simulation',
    fixture.equipped && fixture.tool && fixture.elapsedBefore === fixture.elapsedAfter);
  await page.locator('#pauseButton').click();
  await page.locator('#pauseSettingsButton').click();
  const sample = () => page.evaluate(() => ({overlay: DEADWALL.activeOverlay?.id || null,
    paused: DEADWALL.paused, tool: DEADWALL.infrastructure.toolActive(), elapsed: DEADWALL.elapsed}));
  const before = await sample();
  await page.keyboard.press('Escape');
  profile.roadworkSettingsEscape = await sample();
  const settings = profile.roadworkSettingsEscape;
  rec.check('Escape closes Settings while Pause retains the roadwork tool and simulation time',
    before.overlay === 'settingsModal' && settings.overlay === 'pauseMenu' && settings.paused &&
    settings.tool && settings.elapsed === before.elapsed);
  await page.keyboard.press('Escape');
  profile.roadworkPauseEscape = await sample();
  const pause = profile.roadworkPauseEscape;
  rec.check('A fresh Escape resumes from Pause with the roadwork tool still equipped',
    pause.overlay === null && !pause.paused && pause.tool);
  await page.keyboard.press('Escape');
  profile.roadworkFieldEscape = await sample();
  const field = profile.roadworkFieldEscape;
  rec.check('Escape on the playable field puts away the roadwork tool without opening Pause',
    field.overlay === null && !field.paused && !field.tool);
}

try {
  // Browser assertions must exercise the built bytes of this source checkout.
  const publicScripts = Manifest.readPublicEntries(repository).scripts;
  for (const name of publicScripts) assert.equal(hash(await readFile(path.join(root, name))),
    hash(await readFile(path.join(repository, name))), 'Stale distributed script: ' + name);
  report.distributionScripts = publicScripts.length;
  server = createGameServer({rootDirectory: root});
  await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
  const base = 'http://127.0.0.1:' + server.address().port + '/'; report.base = base;
  browser = await chromium.launch({headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {})});
  report.browserVersion = browser.version();
  for (const view of profiles) {
    const profile = {viewport: view, pass: false}; report.profiles.push(profile);
    const context = await browser.newContext({viewport: {width: view.width, height: view.height},
      hasTouch: !!view.touch, isMobile: !!view.touch, serviceWorkers: 'block'});
    const page = await context.newPage(); page.setDefaultTimeout(120000);
    const rec = recorder(page, profile, output, view.name + '-');
    try {
      if (!view.touch) await page.addInitScript(() => {
        // Observe native repeat events before the game's capture/bubble guards consume them.
        globalThis.__feedback216Keys = [];
        window.addEventListener('keydown', event => {
          if (['Enter', 'NumpadEnter'].includes(event.code)) __feedback216Keys.push({
            code: event.code, repeat: event.repeat, trusted: event.isTrusted,
            target: event.target.id || event.target.className
          });
        }, true);
      });
      await page.goto(base, {waitUntil: 'networkidle', timeout: 120000}); await ready(page);
      await chooseCampaign(page, '17117'); await activate(page, '#campaignIntro132Skip', view.touch);
      await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
      page.setDefaultTimeout(15000);
      rec.check('The normal player entry starts a current G11 campaign', await page.evaluate(() =>
        DEADWALL.playerMenus194.mode === 'player' && DEADWALL.frontier.position().generation === 11));

      if (!view.touch) {
        await page.evaluate(() => {
          globalThis.__feedback215Keys = [];
          document.addEventListener('keydown', e => {
            if (e.code === 'KeyI') __feedback215Keys.push({repeat: e.repeat, trusted: e.isTrusted});
          }, true);
        });
        await page.locator('#game').focus();
        await page.keyboard.down('i');
        try {
          await page.locator('#loadout129').waitFor({state: 'visible'});
          const elapsed = await page.evaluate(() => DEADWALL.elapsed);
          for (let n = 0; n < 4; n++) await page.keyboard.down('i');
          profile.inventoryRepeat = await page.evaluate(elapsed => ({
            open: DEADWALL.loadoutUI.isOpen(), paused: DEADWALL.paused,
            frozen: DEADWALL.elapsed === elapsed, focusInside: DEADWALL.loadoutUI.overlay.contains(document.activeElement),
            events: __feedback215Keys}), elapsed);
          const q = profile.inventoryRepeat;
          rec.check('Native held I generates repeat events without closing the bag or resuming gameplay',
            q.open && q.paused && q.frozen && q.focusInside && q.events.length === 5 &&
            q.events.every(e => e.trusted) && !q.events[0].repeat && q.events.slice(1).every(e => e.repeat));
          await rec.screenshot('held-inventory');
        } finally {await page.keyboard.up('i');}
        await page.keyboard.press('i');
        rec.check('A fresh I press closes the bag and restores the playable field', await page.evaluate(() =>
          !DEADWALL.loadoutUI.isOpen() && !DEADWALL.paused && !DEADWALL.activeOverlay));
      } else {
        await activate(page, '#carryIndicator', true);
        rec.check('The native touch bag control opens the modal and owns focus', await page.evaluate(() =>
          DEADWALL.loadoutUI.isOpen() && DEADWALL.paused && DEADWALL.loadoutUI.overlay.contains(document.activeElement)));
        await rec.screenshot('touch-inventory');
        await activate(page, '#loadout129 .loadout-close', true);
        rec.check('The native touch close restores gameplay', await page.evaluate(() =>
          !DEADWALL.loadoutUI.isOpen() && !DEADWALL.paused && !DEADWALL.activeOverlay));
      }

      if (!view.touch) {
        await heldMenuActivation(page, rec, profile);
        await roadworkEscape(page, rec, profile);
      }

      await page.waitForFunction(() => DEADWALL.player.invulnerable <= 0 && !DEADWALL.paused);
      profile.cameraFixture = await page.evaluate(() => {
        const g = DEADWALL, before = g.player.health, elapsed = g.elapsed;
        g.damagePlayer(1); g.togglePause(true);
        return {declaredDamage: 1, healthBefore: before, healthAfter: g.player.health,
          elapsedBefore: elapsed, elapsedAfter: g.elapsed, shake: g.camera.shake, injectedSteps: 0};
      });
      const fixture = profile.cameraFixture;
      rec.check('The declared damage fixture uses the real owner and pauses without advancing simulation',
        fixture.healthBefore - fixture.healthAfter === 1 && fixture.shake > 0 && fixture.elapsedBefore === fixture.elapsedAfter);
      profile.pausedFrames = await pausedFrameSamples(page);
      const paused = profile.pausedFrames;
      rec.check('Repeated real RAF paints keep the same camera offset and complete saved state during Pause',
        paused.unchanged && paused.elapsed === paused.elapsedAfter && paused.paused &&
        paused.samples.every(s => JSON.stringify(s) === JSON.stringify(paused.samples[0])) &&
        paused.samples.every(s => Math.abs(s.x) <= paused.amplitude / 2 && Math.abs(s.y) <= paused.amplitude / 2));
      await rec.screenshot('paused-impact');

      await page.waitForFunction(() => DEADWALL.audio.ctx?.state === 'running' && DEADWALL.audio.voices === 0);
      profile.suspendedAudio = await page.evaluate(async () => {
        const g = DEADWALL, audio = g.audio, ctx = audio.ctx;
        await ctx.suspend();
        const material = () => {const {timestamp, ...save} = g.serialize(); return JSON.stringify(save);};
        const before = material(), nodes = [], methods = ['createOscillator', 'createGain', 'createBufferSource', 'createBiquadFilter', 'createBuffer'];
        const originals = new Map(methods.map(name => [name, {own: Object.getOwnPropertyDescriptor(ctx, name), call: ctx[name]}]));
        let accepted = 0;
        try {
          for (const name of methods) ctx[name] = (...args) => {nodes.push(name); return originals.get(name).call.apply(ctx, args);};
          for (let n = 0; n < 60; n++) {accepted += Number(audio.tone(440, .1)); accepted += Number(audio.noise(.1));}
          return {state: ctx.state, requests: 120, accepted, allocations: nodes.length, voices: audio.voices,
            unchanged: before === material(), paused: g.paused};
        } finally {
          for (const [name, original] of originals) {
            if (original.own) Object.defineProperty(ctx, name, original.own); else delete ctx[name];
          }
        }
      });
      const audio = profile.suspendedAudio;
      rec.check('A real suspended AudioContext refuses120 stale events without allocating nodes or changing the campaign',
        audio.state === 'suspended' && audio.accepted === 0 && audio.allocations === 0 && audio.voices === 0 && audio.unchanged && audio.paused);
      await activate(page, '#pauseSettingsButton', view.touch);
      await activate(page, '#settingsMuted', view.touch);
      await page.waitForFunction(() => DEADWALL.audio.ctx.state === 'running');
      rec.check('A native settings gesture resumes the real audio context while mute still refuses sounds',
        await page.evaluate(() => DEADWALL.settings.muted && DEADWALL.audio.voices === 0 && !DEADWALL.audio.tone(440, .1)));
      await activate(page, '#settingsMuted', view.touch);
      rec.check('After native unmute, only fresh diagnostic sounds enter the voice budget', await page.evaluate(() =>
        !DEADWALL.settings.muted && DEADWALL.audio.tone(440, .1) && DEADWALL.audio.noise(.1) && DEADWALL.audio.voices === 2));
      await page.waitForFunction(() => DEADWALL.audio.voices === 0);
      rec.check('The two new voices release their real browser resources', true);

      await activate(page, '#settingsMotion', view.touch);
      profile.reducedFrames = await pausedFrameSamples(page);
      rec.check('The native reduced-motion option removes camera displacement while preserving the paused campaign',
        profile.reducedFrames.unchanged && profile.reducedFrames.samples.every(s => s.x === 0 && s.y === 0));
      await activate(page, '#settingsMotion', view.touch);
      await activate(page, '#settingsClose', view.touch);
      rec.check('Leaving settings keeps the player’s deliberate pause', await page.evaluate(() =>
        DEADWALL.paused && DEADWALL.activeOverlay === DEADWALL.ui.pauseMenu));
      await activate(page, '#resumeButton', view.touch);
      await page.waitForFunction(() => DEADWALL.camera.shake === 0 && DEADWALL.frameShake.x === 0 && DEADWALL.frameShake.y === 0);
      rec.check('Resuming active simulation lets the camera effect return to rest', true);
      rec.check('Page, console, HTTP and request collectors remain empty', rec.errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.failure = error.stack;
      await rec.screenshot('failure').catch(() => {});
      console.error(JSON.stringify({profile: view.name, failure: profile.failure}));
    } finally {
      for (const key of ['i', 'Enter', 'NumpadEnter', 'Escape']) await page.keyboard.up(key).catch(() => {});
      await context.close();
    }
    console.log(JSON.stringify({profile: view.name, pass: profile.pass, checks: profile.checks.length}));
  }
  report.sourcesAfter = Sources.capture(repository);
  assert.deepEqual(report.sourcesAfter, report.sourcesBefore, 'Runtime sources changed during browser qualification');
  report.sourceStable = true;
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
} catch (error) {report.failure = error.stack;}
finally {
  try {await browser?.close();}
  finally {
    if (server?.listening) {server.closeAllConnections(); await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));}
    report.completedUtc = new Date().toISOString();
    await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('Report: ' + path.join(output, 'report.json'));
  }
}
if (!report.pass) process.exitCode = 1;
