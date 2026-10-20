import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHarness, recorder, ready, chooseCampaign} from './browser-qa-common142.mjs';
import {activate, openCommand, resumeCommand, saveReloadContinue} from './browser-qa-common144.mjs';
import {captureSource201, assertSource201, sourceStable201} from './full-check201.mjs';

const repository = fileURLToPath(new URL('..', import.meta.url));
process.env.DEADWALL_QA_ROOT = path.resolve(process.env.DEADWALL_QA_ROOT || 'dist');
const ids = ['returnService201', 'craftCourt201', 'staggeredLines201', 'powerCourt201', 'medicalRecovery201', 'siegeSupply201'];
const expectedHead = process.env.DEADWALL_EXPECTED_HEAD;
const fallbackOutput = path.join(repository, 'artifacts', 'qa', 'continuation201-start-' + new Date().toISOString().replace(/[^0-9A-Za-z_-]/g, '_'));
fs.mkdirSync(fallbackOutput, {recursive: true});
const scope = 'Built player entry without tools/fixture flags, actual mouse/touch notebook controls and canvas anchoring at three viewports. Advanced age, old completed prerequisite infrastructure and supplies are explicitly prepared; six free previews and one paid native ensemble are then exercised. One separate prepared native 12 m rooftop death is photographed on desktop. RAF is stopped after native startup; this is an automated functional/visual inspection, not a human campaign, elapsed progression, animation benchmark or production qualification.';
let h, report = {scope, expectedHead, root: process.env.DEADWALL_QA_ROOT, profiles: [], pass: false, started: new Date().toISOString()};

// Timestamp describes serialization itself. Every persistent gameplay field,
// including the random state, remains part of each read-only comparison.
const material = page => page.evaluate(() => {const {timestamp, ...saved} = DEADWALL.serialize(); return JSON.stringify(saved);});

/** WCAG contrast from the actual rendered solid surfaces, never from theme constants. */
export function textContrasts201(selector) {
  const parse = value => {
    const m = /^rgba?\(([^)]+)\)$/.exec(value);
    if (!m) throw Error('Unsupported computed CSS colour: ' + value);
    const parts = m[1].replace(' / ', ',').split(/[ ,]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(n => !Number.isFinite(n))) throw Error('Invalid computed CSS colour: ' + value);
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255, parts[3] ?? 1];
  };
  const over = (front, back) => {
    const a = front[3] + back[3] * (1 - front[3]);
    return [...[0, 1, 2].map(i => a ? (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / a : 0), a];
  };
  const luminance = rgba => rgba.slice(0, 3).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4)
    .reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
  return [...document.querySelectorAll(selector)].map((node, index) => {
    const result = {selector, index, text: node.textContent.trim(), tag: node.tagName.toLowerCase(), pass: false};
    try {
      if (!node.checkVisibility() || !result.text) throw Error('Expected rendered text is absent');
      const style = getComputedStyle(node); result.computedForeground = style.color;
      let background = [0, 0, 0, 0]; result.backgroundLayers = [];
      for (let parent = node; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent);
        // A gradient, image, opacity group or filter needs pixel sampling instead
        // of a fabricated solid-colour estimate. Refuse to qualify that case.
        if (css.backgroundImage !== 'none') throw Error('Non-solid text backing requires pixel inspection');
        const layer = {tag: parent.tagName.toLowerCase(), id: parent.id, className: parent.className, color: css.backgroundColor};
        result.backgroundLayers.push(layer); background = over(background, parse(css.backgroundColor));
        if (background[3] >= 1) {result.nearestOpaqueSurface = layer; break;}
      }
      if (background[3] < 1) throw Error('No computed opaque backing was found');
      for (let parent = node; parent; parent = parent.parentElement) {
        const css = getComputedStyle(parent);
        if (Number(css.opacity) !== 1 || css.filter !== 'none' || css.mixBlendMode !== 'normal') throw Error('Opacity/filter/blend group requires pixel inspection');
      }
      const foreground = over(parse(style.color), background), a = luminance(foreground), b = luminance(background);
      result.effectiveForegroundRGBA = foreground; result.effectiveBackgroundRGBA = background;
      result.ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05); result.minimum = 4.5;
      result.pass = result.ratio >= result.minimum;
    } catch (error) {result.failure = error.message;}
    return result;
  });
}

async function reachable(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page.locator(selector).evaluate(node => {
    const r = node.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return node.checkVisibility() && r.width > 0 && r.height >= 43 && r.left >= -1 && r.right <= innerWidth + 1 &&
      r.top >= -1 && r.bottom <= innerHeight + 1 && !!hit && (hit === node || node.contains(hit));
  });
}

async function plansNotebook(page, touch) {
  if (!await page.locator('#commandModal').isVisible()) await openCommand(page, touch, 'field');
  else await activate(page, '#commandTab-field', touch);
  for (const selector of ['#notebookDomain-city', '#dayworksTab']) {
    await page.locator(selector).scrollIntoViewIfNeeded(); await activate(page, selector, touch);
  }
  await page.locator('#dayworksPanel').waitFor({state: 'visible'});
}

function advancedFixture(planIds) {
  const g = DEADWALL, C = DeadwallCore, added = [];
  const raw = g.serialize(); raw.urban.peakScore = 2200; raw.urban.progression151 = {version: 1, age: 10};
  if (!g.restoreSave(raw)) throw Error('Advanced knowledge fixture refused');
  const options = {cityGeometry202: g.world.cityGeometry202 || 0}, order = [], required = new Set(), retained = new Set(['megaReserve', 'planningOffice']), exhaustedDeposits = [];
  function requireType(type) {
    if (g.world.has(type) || required.has(type)) return;
    const def = g.world.definition(type); if (!def) throw Error('Unknown prerequisite ' + type);
    required.add(type); if (def.requires) requireType(def.requires); order.push(type);
  }
  requireType('megaReserve'); requireType('planningOffice');
  for (const id of planIds) for (const item of C.Dayworks.footprint(id, 0, 0, options)) {
    const def = g.world.definition(item.type); if (def.requires) {retained.add(def.requires); requireType(def.requires);}
  }
  const omittedSupersededPrerequisites = order.filter(type => !retained.has(type)), infrastructure = order.filter(type => retained.has(type));
  // Plan largest bodies first, then instantiate in prerequisite order. The
  // allocation uses the native validator and reserves real service alleys;
  // Native roads, fixed decor and markers always remain. If a prior support
  // needs a harvested plot, explicitly declare only its finite deposits spent;
  // this fixture grants no claim about harvesting time or natural progression.
  const districts = g.exploration125?.plan?.buildableDistricts202 || [], allocated = new Map();
  const existing = [...g.world.buildings.values()].filter(b => !b.dead).map(b => ({l: b.left, t: b.top, r: b.right, b: b.bottom}));
  const overlaps = (a, b, gap = 0) => a.l < b.r + gap && a.r > b.l - gap && a.t < b.b + gap && a.b > b.t - gap;
  const gap = 2 * C.TILE, actors = [g.player, ...g.units, ...g.zombies].filter(a => !a.dead);
  const rows = [...Array(C.WORLD_TILES - 2).keys()].map(i => i + 1).sort((a, b) => Number(b >= 70) - Number(a >= 70) || a - b);
  const largest = [...infrastructure].sort((a, b) => {const as = g.world.definition(a).size, bs = g.world.definition(b).size; return bs[0] * bs[1] - as[0] * as[1] || a.localeCompare(b);});
  for (const type of largest) {
    const def = g.world.definition(type); let at;
    for (const harvestedPlot of [false, true]) {
     for (const rotation of def.size[0] === def.size[1] ? [0] : [0, 1]) {
      const [w, h] = rotation % 2 ? [def.size[1], def.size[0]] : def.size;
      for (const gy of rows) {
        if (at || gy + h >= C.WORLD_TILES - 1) continue;
        for (let gx = 1; gx + w < C.WORLD_TILES - 1; gx++) {
          const body = {l: gx * C.TILE, t: gy * C.TILE, r: (gx + w) * C.TILE, b: (gy + h) * C.TILE};
          const frame = options.cityGeometry202 ? DeadwallBuildingVariants157.metricFrame202({type, def, gx, gy, rotation, geometryVersion202: 1, w, h, x: (gx + w / 2) * C.TILE, y: (gy + h / 2) * C.TILE}) : null;
          const reserve = frame ? {l: frame.bounds.x, t: frame.bounds.y, r: frame.bounds.x + frame.bounds.w, b: frame.bounds.y + frame.bounds.h} : body;
          if (districts.some(d => overlaps(reserve, {l: d.x, t: d.y, r: d.x + d.w, b: d.y + d.h}, gap)) || existing.some(b => overlaps(body, b, gap))) continue;
          if (actors.some(a => Math.hypot(a.x - Math.max(body.l, Math.min(body.r, a.x)), a.y - Math.max(body.t, Math.min(body.b, a.y))) < (a.radius || 13) + 2)) continue;
          const deposits = g.world.nodes.filter(n => !n.depleted && Number.isFinite(n.amount) && n.amount > 0 && typeof n.harvest === 'function' && C.RESOURCE_KEYS.includes(n.type) &&
            (overlaps(body, g.fieldcraft.rect(n)) || overlaps(body, {l: n.x - n.radius, t: n.y - n.radius, r: n.x + n.radius, b: n.y + n.radius}, 6)));
          if (!harvestedPlot && deposits.length) continue;
          const previous = deposits.map(n => ({node: n, amount: n.amount, depleted: n.depleted}));
          for (const {node} of previous) {node.amount = 0; node.depleted = true;}
          let valid;
          try {valid = g.world.placement(def, gx, gy, rotation).valid;}
          finally {for (const p of previous) {p.node.amount = p.amount; p.node.depleted = p.depleted;}}
          if (!valid) continue;
          for (const {node, amount} of previous) {
            exhaustedDeposits.push({id: node.id, type: node.type, sceneryKind: node.sceneryKind || null, amount, body: g.fieldcraft.rect(node), radius: node.radius, forPreparedSupport: type});
            node.amount = 0; node.depleted = true;
          }
          if (previous.length) {g.world.navigationVersion++; g.world.flowDirty = true;}
          at = {gx, gy, rotation, w, h, reservedVisualBounds: reserve}; existing.push(body); allocated.set(type, at); break;
        }
      }
      if (at) break;
     }
     if (at) break;
    }
    if (!at) throw Error('No legal physical prerequisite footprint outside the expansion district: ' + type + '; allocated=' + JSON.stringify([...allocated]));
  }
  for (const type of infrastructure) {
    const at = allocated.get(type), def = g.world.definition(type);
    if (!g.world.placement(def, at.gx, at.gy, at.rotation).valid) throw Error('Prepared physical allocation changed: ' + type);
    const b = new (g.core().constructor)(g.nextId++, type, at.gx, at.gy, at.rotation, 1);
    g.world.add(b); added.push({id: b.id, type, ...at, geometryVersion202: b.geometryVersion202}); g.refreshMetrics(true);
  }
  g.refreshMetrics(true);
  for (const key of C.RESOURCE_KEYS) g.resources[key] = Math.min(5000, g.storage);
  // Materialize the normal calm-phase plan before exact save comparisons.
  g.prepareWave(); g.refreshMetrics(true); g.updateUI(); g.render();
  return {kind: 'prepared-late-age-city-not-natural-progression', age: g.tier.id + 1, added,
    completedInfrastructure: 'Declared preexisting completed fixture via normal physical building constructors; these older structures are not claimed paid or manually built.',
    omittedSupersededPrerequisites, priorInfrastructureHistory: 'Superseded supports of the old storage chain are omitted from the prepared final city. Their prior construction and later demolition are a declared possible history, not actions played or measured by this scenario. Every direct prerequisite of all six new ensembles remains physically present.',
    grantedSupplies: {...g.resources}, storage: g.storage, rng: g.random.state, cityGeometry202: options.cityGeometry202, preservedExpansionDistricts: districts, exhaustedDeposits,
    harvesting: 'Explicit prior-harvest fixture: listed finite deposits are already exhausted; no harvesting time, carried yield, earned supplies or naturally reached age is claimed. Fixed decor, markers, buildings and roads remain subject to their native validators.',
    assignedFields: ['urban.peakScore=2200', 'urban.progression151.age=10', 'completed legal prerequisite structures', 'nextId', 'listed finite deposits: amount=0,depleted=true; navigation index refreshed', 'resources capped by prepared native storage'],
    nativeNewEnsemble: 'Only the new Relais de service below uses real UI financing and remains unfinished.'};
}

async function validAnchor(page, id) {
  return page.evaluate(id => {
    const g = DEADWALL, C = DeadwallCore, plan = g.dayworks.plans().find(p => p.id === id), checked = new Set();
    if (!plan) throw Error('Unknown native plan: ' + id);
    const check = (gx, gy) => {
      const key = gx + ':' + gy; if (checked.has(key)) return null; checked.add(key);
      const q = g.dayworks.planStatus(id, gx, gy); if (!q.ok) return null;
      return {gx, gy, cost: q.cost, items: q.items, bodies: q.items.map(item => {const d = g.world.definition(item.type), [w, h] = item.rotation % 2 ? [d.size[1], d.size[0]] : d.size; return {...item, w, h};})};
    };
    for (const area of g.exploration125?.plan?.buildableDistricts202 || []) {
      for (let gy = Math.ceil(area.y / C.TILE); gy <= Math.floor((area.y + area.h) / C.TILE) - plan.h; gy++) for (let gx = Math.ceil(area.x / C.TILE); gx <= Math.floor((area.x + area.w) / C.TILE) - plan.w; gx++) {
        const at = check(gx, gy); if (at) return at;
      }
    }
    for (let gy = 1; gy + plan.h < C.WORLD_TILES - 1; gy++) for (let gx = 1; gx + plan.w < C.WORLD_TILES - 1; gx++) {
      const at = check(gx, gy); if (at) return at;
    }
    throw Error('No valid native ensemble anchor: ' + id);
  }, id);
}

async function anchorByInput(page, id, at, touch) {
  const selector = '#plan-' + id;
  assert.ok(await reachable(page, selector), 'Plan preview button is reachable: ' + id);
  await activate(page, selector, touch);
  await page.waitForFunction(id => DEADWALL.dayworks.overview().placing === id && !DEADWALL.paused && !DEADWALL.activeOverlay, id);
  const target = await page.evaluate(({id, gx, gy}) => {
    const g = DEADWALL, canvas = g.canvas, rect = canvas.getBoundingClientRect(), plan = g.dayworks.plans().find(p => p.id === id);
    // Camera framing is a declared presentation fixture. The anchor itself is
    // chosen by a real canvas mouse/touch event and the shipped input listener.
    for (const fy of [.45, .55, .35, .65, .25]) for (const fx of [.5, .4, .6, .3, .7]) {
      const x = rect.width * fx, y = rect.height * fy, clientX = rect.left + x, clientY = rect.top + y;
      if (document.elementFromPoint(clientX, clientY) !== canvas) continue;
      g.camera.zoom = Math.max(g.world.cityGeometry202 ? DeadwallCore.CityGeometry202.minZoom : .52, Math.min(.75, (g.width - 60) / (plan.w * DeadwallCore.TILE + 60), (g.height - 90) / (plan.h * DeadwallCore.TILE + 60)));
      g.camera.x = (gx + .5) * DeadwallCore.TILE - (x * g.width / rect.width - g.width / 2) / g.camera.zoom;
      g.camera.y = (gy + .5) * DeadwallCore.TILE - (y * g.height / rect.height - g.height / 2) / g.camera.zoom;
      g.render(); return {x, y, clientX, clientY, camera: {...g.camera}};
    }
    throw Error('No unobstructed canvas point for actual native anchoring');
  }, {id, ...at});
  if (touch) await page.touchscreen.tap(target.clientX, target.clientY);
  else await page.locator('#game').click({position: {x: target.x, y: target.y}});
  await page.waitForFunction(({id, gx, gy}) => {
    const p = DEADWALL.dayworks.overview().preview;
    return p?.id === id && p.gx === gx && p.gy === gy && DEADWALL.activeOverlay === DEADWALL.ui.commandModal;
  }, {id, ...at});
  return {kind: touch ? 'native-touch-canvas-anchor' : 'native-mouse-canvas-anchor', cell: {gx: at.gx, gy: at.gy}, framing: target.camera};
}

function roofFixture() {
  const g = DEADWALL, C = DeadwallCore, R = C.VerticalCitadel175, Q = C.VerticalSiege176;
  // Separate isolated native scene, after the ensemble recovery checks.
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  const raw = g.serialize(); raw.urban.peakScore = 2200; raw.urban.progression151 = {version: 1, age: 10};
  raw.resources = {wood: 3000, scrap: 3000, stone: 3000, food: 3000, fuel: 2000, ammo: 3000, medicine: 50};
  if (!g.restoreSave(raw)) throw Error('Roof scene fixture refused');
  g.showCommand(false); g.togglePause(false);
  let b;
  for (let x = 38; x < 85 && !b; x += 2) for (let y = 38; y < 85 && !b; y += 2) {
    if (!g.world.placement(C.BUILDINGS.rampart12, x, y, 0).valid) continue;
    if (!g.placeOne('rampart12', x, y)) throw Error('Native paid roof support refused');
    b = g.world.atCell(x, y); b.progress = 1; b.health = b.maxHealth; g.refreshMetrics(true);
  }
  if (!b) throw Error('No legal native roof support footprint');
  g.spawnZombie('runner'); const z = g.zombies.at(-1);
  z.x = b.x; z.y = b.top - R.tile; z.lastX = z.x; z.lastY = z.y; g.rebuildBuckets();
  b.corpseLoad = R.bases[b.type].height * Q.loadPerMetre / Q.corpseFaceShare + 100;
  for (let n = 0; n < 100; n++) {g.updateZombies(.1); g.rebuildBuckets();}
  const pose = g.vertical175.enemyPose(z), load = b.corpseLoad, kills = g.stats.kills;
  if (pose.stage !== 'roof' || pose.z !== 12 || z.dead) throw Error('Native runner did not reach the 12 m roof');
  g.killZombie(z, false); const corpse = g.corpses.at(-1);
  g.camera.x = b.x; g.camera.y = b.y - 12 * R.projectedHeight / 2; g.camera.zoom = 1;
  g.dayClock = .4; g.updateUI(); g.render();
  return {kind: 'separate-prepared-roof-scene', support: b.id, supportPaidNatively: true, supportCompletion: 'explicit fixture',
    suppliedResources: raw.resources, corpsePressure: 'explicit fixture sufficient for the ordinary native runner climb',
    timeInjected: '100 ordinary updateZombies(.1) calls and bucket rebuilds', before: {pose, load, kills},
    after: {corpse: {...corpse}, load: b.corpseLoad, kills: g.stats.kills, climbers: g.vertical175.snapshot().climbers.length,
      projectedEntry: g.depthEntries(g.viewBounds()).some(entry => entry.entity === corpse), depth: g.vertical175.corpseDepth(corpse)},
    presentation: 'Camera frames the roof; dayClock=.4 is a declared lighting fixture. No displacement, loot or ground-pressure grant is attributed to viewing.'};
}

try {
  report.sourceBefore = captureSource201(repository); assertSource201(report.sourceBefore, expectedHead);
  h = await createHarness('continuation201', scope);
  Object.assign(h.report, report); report = h.report;
  const playerURL = new URL(h.base); playerURL.search = ''; const base = playerURL.href;
  report.base = base; report.surface = 'Current player notebook; URL has no author tools or historical fixture flags.';
  for (const viewport of [{name: 'desktop', width: 1366, height: 768, touch: false}, {name: 'portrait', width: 390, height: 844, touch: true}, {name: 'landscape', width: 844, height: 390, touch: true}]) {
    const profile = {viewport, pass: false}; report.profiles.push(profile);
    const context = await h.browser.newContext({viewport: {width: viewport.width, height: viewport.height}, hasTouch: viewport.touch, isMobile: viewport.touch, serviceWorkers: 'block'});
    const page = await context.newPage(); page.setDefaultTimeout(120000);
    const r = recorder(page, profile, h.output, viewport.name + '-');
    try {
      await page.goto(base, {waitUntil: 'networkidle', timeout: 120000}); await ready(page);
      await page.waitForFunction(() => DEADWALL.playerMenus194?.mode === 'player');
      profile.entryURL = page.url();
      r.check('Normal player entry without author or historical URL flags', new URL(page.url()).search === '');
      await r.screenshot('player-title');
      await chooseCampaign(page, '17117'); await activate(page, '#campaignIntro132Skip', viewport.touch);
      await page.evaluate(() => {window.requestAnimationFrame = () => 0;}); await page.waitForTimeout(150);
      profile.framePolicy = 'RAF explicitly stopped after native campaign startup; no animation-rate claim.';
      await openCommand(page, viewport.touch, 'enclosure');
      const beforeFirstRead = await material(page);
      r.check('Native notebook title and current objective are visible', await page.locator('#commandTitle').textContent() === 'CARNET DU COMMANDANT' && await page.locator('#playerObjectiveTitle194').isVisible());
      await page.locator('.command-body').evaluate(node => {node.scrollTop = 0;}); await r.screenshot('native-notebook');
      await plansNotebook(page, viewport.touch);
      r.check('All six new ensemble cards are present in the player notebook', await page.evaluate(ids => ids.every(id => !!document.getElementById('plan-' + id)), ids));
      r.check('Reading the native notebook preserves all persistent owners and RNG', await material(page) === beforeFirstRead);
      await resumeCommand(page, viewport.touch);
      profile.fixture = await page.evaluate(advancedFixture, ids);
      r.check('Late-age fixture has real storage, completed office and sufficient native stock', profile.fixture.age === 11 && profile.fixture.storage >= 5000 && Object.values(profile.fixture.grantedSupplies).every(n => n === 5000));
      await plansNotebook(page, viewport.touch);
      const beforePreviews = await material(page); profile.plans = [];
      for (const id of ids) {
        const at = await validAnchor(page, id), entry = {id, quote: at}; profile.plans.push(entry);
        r.check(id + ': preview control is visible, enabled and hit-testable', await reachable(page, '#plan-' + id) && await page.locator('#plan-' + id).isEnabled());
        // The preview button identifies its native card; inspect the text siblings.
        entry.cardContrast = await page.evaluate(textContrasts201, '.dw14-plan:has(#plan-' + id + ') :is(p,strong,small)');
        r.check(id + ': every actual card paragraph, title and caption has at least 4.5:1 contrast', entry.cardContrast.length === 3 && entry.cardContrast.every(row => row.pass));
        await r.screenshot(id + '-card'); entry.input = await anchorByInput(page, id, at, viewport.touch);
        r.check(id + ': canvas anchoring grants no material, RNG, progress or persistent data', await material(page) === beforePreviews);
        r.check(id + ': explicit financing control is reachable and enabled', await reachable(page, '#dayworksCommit') && await page.locator('#dayworksCommit').isEnabled());
        r.check(id + ': canvas touch does not accidentally finance its new preview', await page.evaluate(() => DEADWALL.dayworks.overview().preview !== null));
        entry.previewContrast = await page.evaluate(textContrasts201, '.dw14-preview:not(.hidden) p');
        r.check(id + ': the visible native quote has at least 4.5:1 contrast', entry.previewContrast.length > 0 && entry.previewContrast.every(row => row.pass));
        await r.screenshot(id + '-unpaid-preview');
        await page.locator('#dayworksCancel').scrollIntoViewIfNeeded(); await activate(page, '#dayworksCancel', viewport.touch);
        r.check(id + ': cancelling leaves every persistent owner unchanged', await material(page) === beforePreviews);
      }
      r.check('Notebook fits the viewport without horizontal document overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.getElementById('commandModal').getBoundingClientRect().right <= innerWidth + 1));
      const id = ids[0], at = await validAnchor(page, id); await anchorByInput(page, id, at, viewport.touch);
      const before = await page.evaluate(() => {const g = DEADWALL; return {stock: {...g.resources}, ids: [...g.world.buildings.keys()], rng: g.random.state, stats: g.dayworks.snapshot().stats,
        capacity: {storage: g.storage, housing: g.housing, score: g.cityScore, power: g.powerGenerated}, health: g.player.health, units: g.units.length};});
      await page.locator('#dayworksCommit').scrollIntoViewIfNeeded(); await activate(page, '#dayworksCommit', viewport.touch);
      const after = await page.evaluate(oldIds => {const g = DEADWALL, old = new Set(oldIds); return {stock: {...g.resources}, rng: g.random.state, stats: g.dayworks.snapshot().stats,
        jobs: [...g.world.buildings.values()].filter(b => !old.has(b.id)).map(b => ({id: b.id, type: b.type, gx: b.gx, gy: b.gy, rotation: b.rotation, w: b.w, h: b.h, geometryVersion202: b.geometryVersion202, progress: b.progress, completed: b.completed})),
        capacity: {storage: g.storage, housing: g.housing, score: g.cityScore, power: g.powerGenerated}, health: g.player.health, units: g.units.length,
        preview: g.dayworks.overview().preview, saved: g.lastSaveStatus.ok};}, before.ids);
      profile.funding = {id, quote: at, before, after};
      r.check('Real funding pays exactly the quoted native foundation costs', Object.keys(before.stock).every(key => after.stock[key] === before.stock[key] - (at.cost[key] || 0)));
      r.check('Real funding creates exactly four unfinished foundations at their quoted geometry', after.jobs.length === 4 && after.jobs.every(b => b.progress === 0 && b.completed === false) &&
        JSON.stringify(after.jobs.map(({type, gx, gy, rotation}) => ({type, gx, gy, rotation}))) === JSON.stringify(at.items.map(({type, gx, gy, rotation}) => ({type, gx, gy, rotation}))));
      r.check('Funded bodies use the actual campaign dimensions and rotation', after.jobs.every((b, i) => b.w === at.bodies[i].w && b.h === at.bodies[i].h && b.geometryVersion202 === profile.fixture.cityGeometry202));
      r.check('Funding gives no completed capacity, health, units or RNG and records one plan', JSON.stringify(before.capacity) === JSON.stringify(after.capacity) && before.health === after.health && before.units === after.units && before.rng === after.rng && after.stats.plans === before.stats.plans + 1 && after.preview === null && after.saved);
      await page.locator('#dayworksStatus').scrollIntoViewIfNeeded(); await r.screenshot('native-funding-receipt');
      await resumeCommand(page, viewport.touch);
      profile.funding.presentation = await page.evaluate(({id, gx, gy}) => {
        const g = DEADWALL, p = g.dayworks.plans().find(p => p.id === id);
        g.camera.x = (gx + p.w / 2) * DeadwallCore.TILE; g.camera.y = (gy + p.h / 2) * DeadwallCore.TILE;
        g.camera.zoom = Math.max(g.world.cityGeometry202 ? DeadwallCore.CityGeometry202.minZoom : .52, Math.min(.75, (g.width - 60) / (p.w * DeadwallCore.TILE + 60), (g.height - 90) / (p.h * DeadwallCore.TILE + 60)));
        g.render(); return {kind: 'declared-camera-framing-only', camera: {...g.camera}};
      }, {id, ...at});
      await r.screenshot('paid-unfinished-foundations');
      profile.recovery = await saveReloadContinue(page, viewport.touch);
      r.check('Native save/menu/reload/Continue preserves all persistent owners including paid foundations', profile.recovery.pass);
      r.check('Continue retains the four actual foundation identities', await page.evaluate(ids => ids.every(id => DEADWALL.world.buildings.has(id)), after.jobs.map(b => b.id)));
      if (!viewport.touch) {
        await page.evaluate(() => {window.requestAnimationFrame = () => 0;}); await page.waitForTimeout(150);
        profile.roof = await page.evaluate(roofFixture); const {before: roofBefore, after: roofAfter} = profile.roof;
        r.check('Native roof death retains the true 12 m pose and leaves ground corpse pressure unchanged', roofAfter.corpse.altitude === 12 && roofAfter.corpse.site === profile.roof.support && roofAfter.corpse.level === 0 && roofAfter.corpse.bridge === null && roofAfter.load === roofBefore.load);
        r.check('The elevated body enters the actual projected depth queue once after a single native kill', roofAfter.projectedEntry && Number.isFinite(roofAfter.depth) && roofAfter.kills === roofBefore.kills + 1 && roofAfter.climbers === 0);
        await r.screenshot('native-rooftop-corpse-12m');
      }
      r.check('No collected JavaScript, console, HTTP or request failure', r.errors() === 0); profile.pass = true;
    } catch (error) {
      profile.failure = String(error.stack || error); await r.screenshot('failure').catch(() => {});
      if (/ERR_BLOCKED_BY_ADMINISTRATOR/.test(profile.failure)) throw error;
    } finally {await context.close();}
  }
  assert.ok(report.profiles.length === 3 && report.profiles.every(profile => profile.pass), 'Every viewport must pass; inspect retained individual failures');
  report.pass = true;
} catch (error) {report.failure = String(error.stack || error); report.pass = false; process.exitCode = 1;}
finally {
  try {
    report.sourceAfter = captureSource201(repository);
    report.sourceStable = sourceStable201(report.sourceBefore, report.sourceAfter, expectedHead);
  } catch (error) {report.sourceFailure = String(error.stack || error); report.sourceStable = false; report.pass = false; process.exitCode = 1;}
  if (h) {
    try {await h.close();}
    catch (error) {report.cleanupFailure = String(error.stack || error); report.pass = false; process.exitCode = 1;}
  }
  report.completed = new Date().toISOString();
  // Retain a negative source-bound receipt even when Chromium fails to launch.
  fs.writeFileSync(path.join(fallbackOutput, 'attempt.json'), JSON.stringify(report, null, 2) + '\n', {flag: 'wx'});
  if (h) await h.finish();
  console.log(JSON.stringify({pass: report.pass, output: h?.output || fallbackOutput, fallbackOutput, sourceStable: report.sourceStable, failure: report.failure, sourceFailure: report.sourceFailure}));
}
