import { createHash } from 'node:crypto';
import { createHarness, recorder, ready, chooseCampaign } from './browser-qa-common142.mjs';

const harness = await createHarness('arrival158', 'Native New Game, introduction, Pause/Resume and Continue on desktop and an emulated mobile viewport. Window blur is dispatched explicitly: headless Chromium does not reproduce an operating-system focus change. Observations follow the actual local canvas renderer; they do not substitute regional POI counts for the displayed D-17 scene.');
const { browser, base, version, report } = harness;
const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844, touch: true }
];
const chosen = process.env.DEADWALL_QA_PROFILES?.split(',');
const profiles = chosen ? views.filter(view => chosen.includes(view.name)) : views;
if (!profiles.length) throw Error('At least one known arrival QA profile is required');
report.profiles = [];

async function activate(page, selector, touch) {
  if (touch) await page.locator(selector).tap();
  else await page.locator(selector).click();
}

async function state(page) {
  return page.evaluate(() => ({ state: DEADWALL.state, paused: DEADWALL.paused,
    overlay: DEADWALL.activeOverlay?.id || null, intro: DEADWALL.campaignIntro132.isOpen(),
    pauseVisible: !DEADWALL.ui.pauseMenu.classList.contains('hidden'),
    runId: DEADWALL.runId, seed: DEADWALL.world.seed,
    generation: DEADWALL.frontier.position().generation, ecologyVersion: DEADWALL.frontier.position().ecologyVersion, regional: DEADWALL.frontier.active(),
    focus: document.activeElement?.id, hidden: document.hidden, elapsed: DEADWALL.elapsed }));
}

function isPlaying(snapshot) {
  return snapshot.state === 'playing' && !snapshot.paused && !snapshot.overlay && !snapshot.intro && !snapshot.pauseVisible;
}

function matchesCurrentRegionalEcology(node) {
  return node.generation === 8 && node.ecologyVersion === 1 && node.regionalGeneration === node.generation &&
    node.regionalEcologyVersion === node.ecologyVersion && node.providerEcologyVersion === node.ecologyVersion &&
    node.providerMatchesPaint && node.cachedSpecies === node.expected && node.painted.includes(node.expected);
}

async function geometry(page) {
  const raw = await page.evaluate(() => JSON.stringify({
    seed: DEADWALL.world.seed, generation: DEADWALL.frontier.position().generation,
    nodes: DEADWALL.world.nodes.map(node => [node.id, node.type, node.x, node.y, node.radius]),
    buildings: [...DEADWALL.world.buildings.values()].map(building => [building.id, building.type, building.gx, building.gy, building.rotation]),
    home: DEADWALL.frontier.world().home
  }));
  return createHash('sha256').update(raw).digest('hex');
}

async function campaignHistory(page) {
  return page.evaluate(() => {
    const memory = DEADWALL.profile.get();
    const stored = DeadwallProfile.validate(JSON.parse(localStorage.getItem(DeadwallProfile.PROFILE_KEY)));
    const identities = profile => profile.recentRuns.map(run => ({ runId: run.runId, seed: run.seed }))
      .sort((left, right) => left.runId.localeCompare(right.runId));
    return { memory: identities(memory), stored: identities(stored) };
  });
}

function historyMatches(history, ids) {
  const expected = [...ids].sort();
  return ['memory', 'stored'].every(key => history[key].length === ids.length &&
    history[key].every((run, index) => run.seed === 17117 && run.runId === expected[index]));
}

async function storageContents(page) {
  return page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort(([left], [right]) => left.localeCompare(right))));
}

async function observeLocalPainting(page) {
  await page.evaluate(() => {
    const game = DEADWALL, art = game.art, families = new Map();
    for (const [family, sprites] of Object.entries(DeadwallNatureArt153.FAMILIES)) {
      for (const sprite of sprites) families.set(sprite.atlas + ':' + sprite.rect.join(','), family);
    }
    const observed = globalThis.__DEADWALL_ARRIVAL158__ = {
      world: game.world, canvas: game.canvas, nodes: new Map(), groundPasses: 0, featureEntries: 0,
      clear() { this.nodes.clear(); this.groundPasses = 0; this.featureEntries = 0; }
    };
    const drawNode = art.drawNode.bind(art), blit = art.blit.bind(art);
    let currentNode = null;
    art.drawNode = (context, node, owner) => {
      const variant = Math.abs(node.variant || 0) % 4;
      const eligible = !node.sceneryKind && (node.type === 'stone' || node.type === 'wood' && variant !== 2);
      const projected = context.getTransform().transformPoint({ x: node.x, y: node.y });
      const onCanvas = projected.x >= 0 && projected.y >= 0 && projected.x < game.canvas.width && projected.y < game.canvas.height;
      if (context === game.ctx && !game.frontier.active() && eligible && onCanvas) {
        let entry = observed.nodes.get(node.id);
        if (!entry) {
          const position = DeadwallAtlasProjection.toRegion(node.x, node.y, game), pose = game.frontier.position(),
            generation = pose.generation, regional = game.frontier.world(), provider = regional.biomes;
          if (!provider || regional.seed !== game.world.seed) throw Error('Actual regional ecology provider missing or on another seed');
          const pick = node.type === 'wood' ? provider.pickTree : provider.pickRock;
          entry = { id: node.id, type: node.type, x: node.x, y: node.y, generation, ecologyVersion: pose.ecologyVersion,
            regionalGeneration: regional.generation, regionalEcologyVersion: regional.ecologyVersion,
            providerEcologyVersion: provider.ecologyVersion ?? 0,
            expected: pick(game.world.seed, position.x, position.y, 'local:' + node.id, { generation }).species,
            painted: new Set() };
          observed.nodes.set(node.id, entry);
        }
        currentNode = entry;
      }
      try { return drawNode(context, node, owner); }
      finally { currentNode = null; }
    };
    art.blit = (context, atlas, rect, ...destination) => {
      const result = blit(context, atlas, rect, ...destination);
      const family = families.get(atlas + ':' + rect.join(','));
      if (result && currentNode && context === game.ctx && family) currentNode.painted.add(family);
      return result;
    };
    const ground = game.drawGround.bind(game), depth = game.depthEntries.bind(game);
    game.drawGround = (context, view) => {
      const result = ground(context, view);
      if (context === game.ctx && !game.frontier.active()) observed.groundPasses++;
      return result;
    };
    game.depthEntries = view => {
      const entries = depth(view);
      if (!game.frontier.active()) observed.featureEntries = Math.max(observed.featureEntries,
        entries.filter(entry => typeof entry.entity?.__exploration125Draw === 'function').length);
      return entries;
    };
  });
}

async function localPainting(page) {
  return page.evaluate(() => {
    const observed = __DEADWALL_ARRIVAL158__, canvas = DEADWALL.canvas;
    const pixels = DEADWALL.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set();
    let samples = 0, opaque = 0;
    const step = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 40));
    for (let y = 0; y < canvas.height; y += step) for (let x = 0; x < canvas.width; x += step) {
      const offset = (y * canvas.width + x) * 4;
      samples++; if (pixels[offset + 3] > 240) opaque++;
      colors.add([pixels[offset] >> 3, pixels[offset + 1] >> 3, pixels[offset + 2] >> 3].join(','));
    }
    return { groundPasses: observed.groundPasses, featureEntries: observed.featureEntries,
      pixels: { samples, opaque, colors: colors.size },
      nodes: [...observed.nodes.values()].map(node => {
        const source = DEADWALL.world.nodes.find(source => source.id === node.id), selected = source && DEADWALL.art.nodeSpecies?.get(source);
        return { ...node, painted: [...node.painted], providerMatchesPaint: selected?.biomes === DEADWALL.frontier.world().biomes,
          cachedSpecies: selected?.species };
      }) };
  });
}

async function dispatchIntroBlur(page) {
  return page.evaluate(() => {
    const before = DEADWALL.elapsed;
    window.dispatchEvent(new Event('blur'));
    return { kind: 'explicit DOM window blur', hidden: document.hidden, before, after: DEADWALL.elapsed,
      intro: DEADWALL.campaignIntro132.isOpen(), overlay: DEADWALL.activeOverlay?.id, paused: DEADWALL.paused };
  });
}

async function zoomOut(page, touch) {
  if (touch) {
    if (!await page.locator('#touchCommandDrawer').evaluate(node => node.open)) await activate(page, '#touchCommandDrawer > summary', true);
    for (let index = 0; index < 8; index++) await activate(page, '[data-game-command="zoomOut"]', true);
    await activate(page, '#touchCommandDrawer > summary', true);
  } else {
    const safe = await page.evaluate(() => DEADWALL.hud135.safeFrame());
    await page.mouse.move((safe.left + safe.right) / 2, (safe.top + safe.bottom) / 2);
    for (let index = 0; index < 8; index++) await page.mouse.wheel(0, 160);
  }
  await page.waitForFunction(() => DEADWALL.camera.zoom <= .53);
}

try {
  for (const viewport of profiles) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height },
      hasTouch: !!viewport.touch, isMobile: !!viewport.touch, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    const profile = { viewport };
    report.profiles.push(profile);
    const { check, screenshot, errors } = recorder(page, profile, harness.output, viewport.name + '-');
    try {
      const response = await page.goto(base, { waitUntil: 'networkidle' });
      check('Document HTTP 200', response?.status() === 200);
      await ready(page);
      check('Current version appears in the main menu', (await page.locator('#mainMenu').innerText()).includes('VERSION ' + version));
      await chooseCampaign(page, '17117');
      profile.arrival = await state(page);
      check('New Game opens the introduction without a Pause menu underneath', profile.arrival.intro && profile.arrival.overlay === 'campaignIntro132' && profile.arrival.paused && !profile.arrival.pauseVisible);
      check('Fresh campaign starts at local D-17 in the current generation', profile.arrival.seed === 17117 && profile.arrival.generation === 8 && profile.arrival.ecologyVersion === 1 && !profile.arrival.regional);
      profile.arrivalHistory = await campaignHistory(page);
      check('All startup autosaves produce exactly one persisted campaign archive', historyMatches(profile.arrivalHistory, [profile.arrival.runId]));
      profile.geometry = await geometry(page);
      await observeLocalPainting(page);
      profile.blurBeforeTakeShift = await dispatchIntroBlur(page);
      check('Focus-loss event keeps the introduction and simulation suspended', profile.blurBeforeTakeShift.intro && profile.blurBeforeTakeShift.paused && profile.blurBeforeTakeShift.overlay === 'campaignIntro132' && profile.blurBeforeTakeShift.before === profile.blurBeforeTakeShift.after);
      for (let index = 0; index < 3; index++) await activate(page, '#campaignIntro132Next', viewport.touch);
      check('The final introduction action explicitly starts the first shift', (await page.locator('#campaignIntro132Next').innerText()).includes('PRENDRE MON QUART'));
      await activate(page, '#campaignIntro132Next', viewport.touch);
      profile.started = await state(page);
      check('Taking the shift after focus loss starts play without another Resume', isPlaying(profile.started) && profile.started.focus === 'game');
      check('Taking the shift keeps the new campaign and geometry', profile.started.runId === profile.arrival.runId && await geometry(page) === profile.geometry);
      await screenshot('first-shift');
      await zoomOut(page, viewport.touch);
      await page.waitForFunction(() => __DEADWALL_ARRIVAL158__.nodes.size >= 2 && __DEADWALL_ARRIVAL158__.featureEntries > 0);
      profile.painting = await localPainting(page);
      check('The visible canvas contains painted D-17 terrain and local structures', profile.painting.groundPasses > 0 && profile.painting.featureEntries > 0 && profile.painting.pixels.opaque / profile.painting.pixels.samples > .99 && profile.painting.pixels.colors > 25);
      check('Visible trees and rocks use the current regional ecology in actual sprite draws', ['wood', 'stone'].every(type => profile.painting.nodes.some(node => node.type === type)) && profile.painting.nodes.every(matchesCurrentRegionalEcology));
      await screenshot('current-local-world');
      await activate(page, '#pauseButton', viewport.touch);
      check('A deliberate Pause opens the real Pause menu', (await state(page)).overlay === 'pauseMenu');
      await page.evaluate(() => __DEADWALL_ARRIVAL158__.clear());
      await activate(page, '#resumeButton', viewport.touch);
      profile.resumed = await state(page);
      check('Resume preserves the exact new local world and canvas', isPlaying(profile.resumed) && profile.resumed.runId === profile.arrival.runId && await page.evaluate(() => DEADWALL.world === __DEADWALL_ARRIVAL158__.world && DEADWALL.canvas === __DEADWALL_ARRIVAL158__.canvas) && await geometry(page) === profile.geometry);
      await page.waitForFunction(() => __DEADWALL_ARRIVAL158__.groundPasses > 0 && __DEADWALL_ARRIVAL158__.nodes.size >= 2);
      profile.resumePainting = await localPainting(page);
      check('Resume continues to render the current ecological sprites', profile.resumePainting.nodes.every(matchesCurrentRegionalEcology));
      await activate(page, '#pauseButton', viewport.touch);
      await activate(page, '#replayIntro132', viewport.touch);
      await dispatchIntroBlur(page);
      await activate(page, '#campaignIntro132Skip', viewport.touch);
      check('Closing a replay preserves the user’s deliberate Pause', (await state(page)).overlay === 'pauseMenu' && (await state(page)).paused);
      await activate(page, '#quitButton', viewport.touch);
      await activate(page, '#menuRecordsButton', viewport.touch);
      check('The campaign records show one archive for the first game', await page.locator('#commandPanel-records').isVisible() && await page.locator('#recentCampaigns > li').count() === 1);
      await activate(page, '#commandClose', viewport.touch);
      await activate(page, '#continueButton', viewport.touch);
      profile.continued = await state(page);
      check('Continue restores this campaign without introduction or stale geometry', isPlaying(profile.continued) && profile.continued.runId === profile.arrival.runId && profile.continued.generation === 8 && profile.continued.ecologyVersion === 1 && await geometry(page) === profile.geometry);
      profile.continuedHistory = await campaignHistory(page);
      check('Continue keeps one campaign archive with the original identity', historyMatches(profile.continuedHistory, [profile.arrival.runId]));
      await activate(page, '#pauseButton', viewport.touch);
      await activate(page, '#quitButton', viewport.touch);
      const beforeCancel = await storageContents(page);
      await page.evaluate(() => { globalThis.__DEADWALL_CANCELLED_WORLD158__ = DEADWALL.world; });
      page.once('dialog', dialog => { profile.cancelledDialog = { type: dialog.type(), text: dialog.message() }; return dialog.dismiss(); });
      await activate(page, '#newGameButton', viewport.touch);
      profile.cancelled = await state(page);
      profile.cancelledHistory = await campaignHistory(page);
      check('Cancelling replacement preserves all storage, the world and the single archive', profile.cancelledDialog?.type === 'confirm' &&
        profile.cancelled.state === 'menu' && profile.cancelled.runId === profile.arrival.runId &&
        await page.evaluate(() => DEADWALL.world === __DEADWALL_CANCELLED_WORLD158__) &&
        await storageContents(page) === beforeCancel && historyMatches(profile.cancelledHistory, [profile.arrival.runId]));
      page.once('dialog', dialog => { profile.replacementDialog = { type: dialog.type(), text: dialog.message() }; return dialog.accept(); });
      await chooseCampaign(page, '17117');
      profile.replacement = await state(page);
      check('Confirmed New Game replaces the campaign and opens its introduction', profile.replacementDialog?.type === 'confirm' && profile.replacement.runId !== profile.arrival.runId && profile.replacement.intro && !profile.replacement.pauseVisible);
      profile.blurBeforeSkip = await dispatchIntroBlur(page);
      await activate(page, '#campaignIntro132Skip', viewport.touch);
      profile.skipped = await state(page);
      check('Skipping a new introduction after focus loss starts directly', isPlaying(profile.skipped) && profile.skipped.runId === profile.replacement.runId && profile.skipped.generation === 8 && profile.skipped.ecologyVersion === 1);
      check('Replacement with the same seed preserves generated geometry', await geometry(page) === profile.geometry);
      profile.replacementHistory = await campaignHistory(page);
      check('Two actual games on the same seed produce exactly two distinct archives', historyMatches(profile.replacementHistory, [profile.arrival.runId, profile.replacement.runId]));
      await activate(page, '#pauseButton', viewport.touch);
      await activate(page, '#quitButton', viewport.touch);
      await activate(page, '#menuRecordsButton', viewport.touch);
      check('The campaign records show the two actual campaigns', await page.locator('#commandPanel-records').isVisible() && await page.locator('#recentCampaigns > li').count() === 2);
      check('The actual startup and resume paths have no browser errors', errors() === 0);
      profile.pass = true;
    } catch (error) {
      profile.pass = false;
      profile.failure = error.stack;
      await screenshot('failure').catch(() => {});
    } finally {
      await context.close();
    }
    console.log(JSON.stringify({ viewport: viewport.name, pass: profile.pass, checks: profile.checks.length, failure: profile.failure?.split('\n')[0] }));
  }
} finally {
  report.pass = report.profiles.length === profiles.length && report.profiles.every(profile => profile.pass);
  try { await harness.close(); }
  finally { await harness.finish(); }
}
if (!report.pass) process.exitCode = 1;
