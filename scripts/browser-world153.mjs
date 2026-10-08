import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import { createHarness, recorder, ready, chooseCampaign, activate, saveReloadContinue } from './browser-qa-common144.mjs';
import { loadedAssets } from './browser-qa-common142.mjs';

// Examples: --root /tmp/extracted-web, --file /tmp/DEADWALL.html, or --url URL.
// The standalone HTTP adapter serves the exact HTML bytes, with no asset server.
const flags = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i], value = process.argv[i + 1];
  assert.ok(['--root', '--file', '--url', '--profiles'].includes(key) && value && !value.startsWith('--') && !flags.has(key), 'Known unique CLI option with its value');
  flags.set(key, value);
}
assert.ok(!(flags.has('--file') && (flags.has('--root') || flags.has('--url'))), 'Standalone target is independent of web targets');
if (flags.has('--root')) process.env.DEADWALL_QA_ROOT = path.resolve(flags.get('--root'));
if (flags.has('--url')) process.env.DEADWALL_QA_URL = flags.get('--url');
process.env.DEADWALL_QA_OUTPUT ||= path.join(os.tmpdir(), 'deadwall-world153-qa');
const views = [{ name: 'desktop', width: 1366, height: 768 }, { name: 'mobile', width: 390, height: 844, touch: true }];
const requested = (flags.get('--profiles') || process.env.DEADWALL_QA_PROFILES || views.map(v => v.name).join(',')).split(',');
assert.ok(requested.length > 0 && new Set(requested).size === requested.length && requested.every(name => views.some(v => v.name === name)), 'At least one known, non-duplicate browser profile');
const profiles = views.filter(view => requested.includes(view.name));
const repository = fileURLToPath(new URL('..', import.meta.url)), require = createRequire(import.meta.url);
const sourceArt = require('../src/art.js').ASSETS;
const sourceModules = Object.fromEntries(['nature', 'world-props', 'interior'].map(name => [name, require('../src/' + name + '-art153.js')]));
const metadata = (assets, modules) => ({ assets: Object.fromEntries(Object.entries(assets).map(([key, { width, height, matte }]) => [key, { width, height, matte }])),
  families: Object.fromEntries(Object.entries(modules).map(([name, api]) => [name, name === 'interior' ? { furniture: api.FURNITURE, roofs: api.ROOFS, ruins: api.RUINS } : api.FAMILIES])) });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function sourceFreeze() {
  const assets = Object.fromEntries(Object.values(sourceModules).flatMap(api => Object.entries(api.ASSETS)));
  const files = await Promise.all(Object.entries(assets).map(async ([key, spec]) => {
    const bytes = await readFile(path.join(repository, spec.url)); return { key, file: spec.url, bytes: bytes.length, sha256: sha256(bytes) };
  }));
  const sourceFiles = await Promise.all(['src/art.js', 'src/nature-art153.js', 'src/world-props-art153.js', 'src/interior-art153.js', 'src/frontier-art.js', 'src/ground135.js', 'src/game.js', 'src/render-cache153.js', 'src/display-quality153.js'].map(async file => ({ file, sha256: sha256(await readFile(path.join(repository, file))) })));
  const material = metadata(sourceArt, sourceModules), metadataHash = sha256(JSON.stringify(material));
  return { assetCount: Object.keys(sourceArt).length, newAssetCount: files.length, metadataHash, files, sourceFiles, stamp: sha256(JSON.stringify({ metadataHash, files, sourceFiles })), material };
}

async function verifyFreeze(page, freeze) {
  const observed = await page.evaluate(async () => {
    const modules = { nature: DeadwallNatureArt153, 'world-props': DeadwallWorldPropsArt153, interior: DeadwallInteriorArt153 };
    const material = { assets: Object.fromEntries(Object.entries(DeadwallArt.ASSETS).map(([key, { width, height, matte }]) => [key, { width, height, matte }])),
      families: Object.fromEntries(Object.entries(modules).map(([name, api]) => [name, name === 'interior' ? { furniture: api.FURNITURE, roofs: api.ROOFS, ruins: api.RUINS } : api.FAMILIES])) };
    const files = await Promise.all(Object.entries(Object.fromEntries(Object.values(modules).flatMap(api => Object.entries(api.ASSETS)))).map(async ([key, spec]) => {
      const response = await fetch(spec.url); if (!response.ok) throw Error('Frozen atlas bytes unavailable: ' + key);
      const bytes = await response.arrayBuffer(), digest = await crypto.subtle.digest('SHA-256', bytes);
      return { key, bytes: bytes.byteLength, sha256: [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('') };
    }));
    return { material, files };
  });
  assert.deepEqual(observed.material, freeze.material, 'Browser atlas/frame metadata matches the source freeze');
  assert.deepEqual(observed.files, freeze.files.map(({ file, ...rest }) => rest), 'Every new browser atlas byte matches the source freeze, including standalone inlined bytes');
  return { assetCount: Object.keys(observed.material.assets).length, metadataHash: sha256(JSON.stringify(observed.material)), verifiedAtlasBytes: observed.files };
}
const scope = 'Chromium world 1.53 validation: all installed ASSETS decode; real Canvas atlas painters produce pixels for every new family/variant at four rotations; interior materials cover basement, ground and upper floors. The installed game renderer is observed at a real regional staircase, without changing stock or seeded RNG. Native settings controls exercise auto/high/low backing resolution, CSS layout and pointer coordinates. Native stairs, ordinary RAF time and Save/Continue exercise exterior migration and individual contact boundaries upstairs. Explicit, validated, bounded setup supplies a discovered medical contract and cleared resident ledger, and places one actual wild contact on physically free visible/hidden accesses; production controllers then test work refusal/cancellation without supplies loss. Fixtures are recorded, never described as earned campaign progression. Only the art blit and restore chain are wrapped to observe their real results; no simulation method is replaced, no synthetic update is injected. Desktop/mobile browser profiles are not physical-device or FPS certification.';

let standaloneServer, standaloneTarget;
if (flags.has('--file')) {
  const file = path.resolve(flags.get('--file')), bytes = await readFile(file);
  standaloneTarget = { file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), transport: 'http', fileSchemeVerified: false };
  standaloneServer = createServer((req, res) => {
    if (req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(bytes); }
    else if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); }
    else { res.writeHead(404); res.end('Standalone QA serves only the original HTML'); }
  });
  await new Promise((resolve, reject) => { standaloneServer.once('error', reject); standaloneServer.listen(0, '127.0.0.1', resolve); });
  process.env.DEADWALL_QA_URL = 'http://127.0.0.1:' + standaloneServer.address().port + '/';
}

async function pause(page, touch) {
  if (!await page.evaluate(() => DEADWALL.paused)) await activate(page, '#pauseButton', touch);
  await page.waitForFunction(() => DEADWALL.paused && !DEADWALL.ui.pauseMenu.classList.contains('hidden'));
}
async function resume(page, touch) {
  await activate(page, '#resumeButton', touch);
  await page.waitForFunction(() => !DEADWALL.paused && !DEADWALL.activeOverlay);
}
async function touchStairs(page, delta) {
  const terrain = page.locator('#fieldDockTerrain');
  if (!await terrain.evaluate(node => node.open)) await activate(page, '#fieldDockTerrain > summary', true);
  await activate(page, delta > 0 ? '#dockUp' : '#dockDown', true);
}

async function atlasGallery(page) {
  return page.evaluate(() => {
    const g = DEADWALL, N = DeadwallNatureArt153, P = DeadwallWorldPropsArt153, I = DeadwallInteriorArt153;
    if (!g.paused) throw Error('Atlas proof requires Pause');
    const material = () => { const { timestamp, ...s } = g.serialize(); return JSON.stringify(s); };
    const before = material(), elapsed = g.elapsed;
    const descriptors = [], moduleAssets = {};
    for (const [name, api] of [['nature', N], ['props', P], ['interior', I]]) {
      const keys = Object.keys(api.ASSETS); if (!keys.length) throw Error('Missing installed ' + name + ' atlas assets');
      moduleAssets[name] = keys;
      for (const key of keys) {
        const image = g.art.images[key], spec = api.ASSETS[key];
        if (!image || (image.naturalWidth || image.width) !== spec.width || (image.naturalHeight || image.height) !== spec.height) throw Error('Decoded atlas dimensions differ: ' + key);
      }
    }
    for (const [module, families] of [['nature', N.FAMILIES], ['props', P.FAMILIES], ['furniture', I.FURNITURE], ['roof', I.ROOFS], ['ruin', I.RUINS]]) {
      if (!Object.keys(families).length) throw Error('Missing ' + module + ' families');
      for (const [family, frames] of Object.entries(families)) for (let variant = 0; variant < frames.length; variant++) {
        const frame = frames[variant], image = g.art.images[frame.atlas], [x, y, w, h] = frame.rect;
        if (![x, y, w, h].every(Number.isFinite) || x < 0 || y < 0 || w <= 0 || h <= 0 || x + w > (image?.naturalWidth || image?.width || 0) || y + h > (image?.naturalHeight || image?.height || 0)) throw Error('Atlas frame is outside decoded image: ' + family);
        for (let rotation = 0; rotation < 4; rotation++) descriptors.push({ module, family, variant, rotation, floor: [-1, 0, 1, 2][rotation], frame });
      }
    }
    for (const [type, surface] of Object.entries({ house: 'wood', clinic: 'tile', warehouse: 'concrete', gym: 'rubber' })) for (const floor of [-1, 0, 1, 2]) for (let rotation = 0; rotation < 4; rotation++) {
      const expectedSurface = floor < 0 ? 'concrete' : surface;
      if (I.floorFamily({ type }, floor) !== expectedSurface) throw Error('Actual POI floor precondition does not select ' + expectedSurface);
      descriptors.push({ module: 'floor', family: expectedSurface, poiType: type, floor, rotation, variant: 0 });
    }
    const cell = document.createElement('canvas'); cell.width = cell.height = 128;
    const c = cell.getContext('2d', { willReadFrequently: true });
    const sheets = [], cases = []; let sheet, sc;
    const draw = d => {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 128, 128); c.save(); c.translate(64, 64); c.rotate(d.rotation * Math.PI / 2);
      const options = { seed: g.world.seed, variant: d.variant, floor: d.floor };
      let ok;
      if (d.module === 'nature') ok = N.drawSprite(c, g.art, d.family, 'qa153:' + d.family, 0, 0, 78, 78, options);
      else if (d.module === 'props') ok = P.drawSprite(c, g.art, d.family, 'qa153:' + d.family, 0, 0, 78, 78, options);
      else if (d.module === 'ruin') ok = I.drawSceneryRuin(c, g.art, { id: 'qa153:ruin', sceneryKind: d.family, x: 0, y: 0 }, { ...options, size: 78 });
      else {
        c.scale(20, 20); const rect = { x: -1.8, y: -1.2, w: 3.6, h: 2.4 };
        if (d.module === 'furniture') ok = I.drawFurniture(c, g.art, { ...rect, id: 'qa153:furniture', kind: d.family, amount: 1 }, options);
        else if (d.module === 'roof') ok = I.paint(c, g.art, d.frame, rect, { fit: true });
        else ok = I.drawFloor(c, g.art, { type: d.poiType, id: 'qa153:floor' }, rect, options);
      }
      c.restore(); if (!ok) throw Error('Installed painter refused ' + JSON.stringify(d));
      const pixels = c.getImageData(0, 0, 128, 128).data; let nonzero = 0, hash = 2166136261;
      for (let i = 0; i < pixels.length; i++) { hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0; if (i % 4 === 3 && pixels[i]) nonzero++; }
      if (nonzero < 20) throw Error('Installed painter produced no meaningful pixels: ' + JSON.stringify(d));
      return { nonzero, hash };
    };
    descriptors.forEach((d, index) => {
      const first = draw(d), repeated = draw(d);
      if (first.hash !== repeated.hash || first.nonzero !== repeated.nonzero) throw Error('Repeated paused paint changed pixels: ' + d.family);
      if (index % 120 === 0) {
        sheet = document.createElement('canvas'); sheet.width = 1280; sheet.height = Math.ceil(Math.min(120, descriptors.length - index) / 10) * 128;
        sc = sheet.getContext('2d'); sheets.push(sheet);
      }
      sc.drawImage(cell, index % 10 * 128, Math.floor(index % 120 / 10) * 128);
      const { frame, ...identity } = d; cases.push({ ...identity, ...first });
    });
    if (before !== material() || elapsed !== g.elapsed) throw Error('Atlas painters changed RNG, stock or other saved material');
    return { moduleAssets, cases, descriptors: descriptors.length, persistentFieldsUnchanged: true, simulationStepsInjected: 0, sheets: sheets.map(sheet => sheet.toDataURL('image/png')) };
  });
}

async function qualityControls(page, touch, check) {
  const results = [];
  for (const mode of ['high', 'low', 'auto']) {
    await pause(page, touch); await activate(page, '#pauseSettingsButton', touch);
    await page.locator('#settingsQuality').selectOption(mode);
    const geometry = await page.evaluate(() => {
      const g = DEADWALL, r = g.canvas.getBoundingClientRect(), control = document.getElementById('settingsQuality'), cr = control.getBoundingClientRect();
      return { mode: g.settings.quality, dpr: g.dpr, width: g.width, height: g.height, backing: [g.canvas.width, g.canvas.height], css: [r.width, r.height], viewport: [innerWidth, innerHeight], controlVisible: control.checkVisibility() && cr.left >= 0 && cr.right <= innerWidth && cr.top >= 0 && cr.bottom <= innerHeight };
    });
    check(mode + ': native quality selection preserves CSS viewport and decoded backing size', geometry.mode === mode && geometry.controlVisible && geometry.css[0] === geometry.width && geometry.css[1] === geometry.height && geometry.backing[0] === Math.floor(geometry.width * geometry.dpr) && geometry.backing[1] === Math.floor(geometry.height * geometry.dpr));
    check(mode + ': display resolution respects its configured DPR boundary', mode === 'low' ? geometry.dpr === 1 : mode === 'high' ? geometry.dpr === 2 : geometry.dpr >= 1 && geometry.dpr <= 2);
    await activate(page, '#settingsClose', touch); await resume(page, touch);
    const point = await page.evaluate(() => {
      const safe = DEADWALL.hud135.measure();
      for (const t of [.3, .5, .7]) {
        const x = safe.left + (safe.right - safe.left) * t, y = safe.top + (safe.bottom - safe.top) * .45;
        if (document.elementFromPoint(x, y)?.id === 'game') return { x, y };
      }
      throw Error('Native pointer needs an uncovered game canvas point');
    });
    await page.mouse.move(point.x, point.y);
    const pointer = await page.evaluate(point => {
      const g = DEADWALL, expected = { x: (point.x - g.width / 2) / g.camera.zoom + g.camera.x, y: (point.y - g.height / 2) / g.camera.zoom + g.camera.y };
      return { point, css: { x: g.input.mouseX, y: g.input.mouseY }, world: { x: g.input.mouseWorldX, y: g.input.mouseWorldY }, expected, dpr: g.dpr, quality: g.settings.quality };
    }, point);
    check(mode + ': real pointer mapping stays in CSS coordinates after resolution changes', Math.abs(pointer.css.x - point.x) < 1 && Math.abs(pointer.css.y - point.y) < 1 && Math.hypot(pointer.world.x - pointer.expected.x, pointer.world.y - pointer.expected.y) < 1);
    results.push({ geometry, pointer });
  }
  await pause(page, touch); return results;
}

async function medicalContacts(page) {
  return page.evaluate(() => {
    const g = DEADWALL, C = DeadwallCore;
    if (!g.paused) throw Error('Medical fixture requires Pause');
    const original = g.serialize(), save = JSON.parse(JSON.stringify(original)), w = g.frontier.world();
    const access = g.fieldcraft.service(g.player, g.core()); if (!access) throw Error('Medical setup requires physical depot access');
    Object.assign(save.player, access); save.resources.scrap = 100; save.phaseTime = 999; save.frontier.active = false;
    save.frontier.seen = w.pois.map(p => p.id);
    g.restoreSave(DeadwallSave.validate(save)); g.togglePause(false);
    const transfer = g.loadout.transfer('depot', 'sac', 'scrap', 2); if (transfer.amount !== 2) throw Error('Actual two-unit medical bag transfer failed');
    const start = g.campaignPack.start('medical'); if (!start.ok) throw Error('Actual paid medical start: ' + start.reason);
    const target = g.campaignPack.overview().target, field = g.serialize();
    Object.assign(field.frontier, { active: true, anchor: { x: g.player.x, y: g.player.y }, x: target.x, y: target.y, z: 0, inside: null });
    for (const p of w.nearPOI(target.x, target.y, 130)) for (let i = 0; i < w.threatCount(p); i++) field.frontier.enemies[p.id + ':e' + i] = 0;
    field.frontier.kills = Object.values(field.frontier.enemies).filter(n => n === 0).length;
    const free = (blocked, min, max) => {
      for (let r = min; r <= max; r += .3) for (let a = 0; a < Math.PI * 2; a += .12) {
        const q = { x: target.x + Math.cos(a) * r, y: target.y + Math.sin(a) * r };
        if (!w.blocked(q.x, q.y, C.FrontierTacticsRules.enemyRadius, 0, null) && w.line(target, q, 0, null, null, .015) === !blocked) return q;
      }
      throw Error('A free ' + (blocked ? 'hidden' : 'visible') + ' individual medical contact is required');
    };
    const possessions = () => JSON.stringify({ carry: g.player.carry, resources: g.resources, campaign: g.campaignPack.snapshot(), rng: g.random.state, taken: g.frontier.snapshot().taken });
    const results = [];
    try {
      for (const hidden of [false, true]) {
        const contact = free(hidden, 2, hidden ? 17 : 3), center = hidden ? contact : free(false, 55, 70), s = JSON.parse(JSON.stringify(field));
        s.worldEvolution.serial = 1; s.worldEvolution.nextHorde = 10000;
        s.worldEvolution.groups = [{ id: 'W0000', kind: 'resting', count: 80, lost: 0, wound: 0, ...center, a: 0, seen: false, contacts: { 0: { ...contact, z: 0, a: 0, mode: 'pursuit', ttl: 12, gx: contact.x, gy: contact.y, cool: 1 } } }];
        g.restoreSave(DeadwallSave.validate(s)); g.togglePause(false);
        const member = g.worldEvolution.groupMembers()[0]; if (!member || member.hp <= 0) throw Error('Fixture has no real living wild contact');
        const visible = g.frontier.visibleEnemy(member), before = possessions(), elapsed = g.elapsed;
        const preview = g.campaignPack.previewWork(), begin = g.campaignPack.begin(), busy = g.campaignPack.busy();
        const cancelled = hidden ? g.campaignPack.cancel() : !busy;
        results.push({ hidden, visible, member: { id: member.id, x: member.x, y: member.y, z: member.z }, center, target, preview, begin, busy, cancelled, materialUnchanged: possessions() === before, elapsedUnchanged: elapsed === g.elapsed });
      }
    } finally { g.restoreSave(DeadwallSave.validate(original)); g.togglePause(true); }
    return { changed: ['physical depot then medical access pose', 'discovered POIs', 'depot scrap=100', 'phaseTime=999', 'cleared bounded resident ledger', 'one wild group and one real saved contact'], paidContractStarted: true, simulationStepsInjected: 0, results };
  });
}

async function stairsFixture(page) {
  return page.evaluate(() => {
    const g = DEADWALL, C = DeadwallCore, G = DeadwallFrontierGeometry, w = g.frontier.world();
    if (!g.paused) throw Error('Stair fixture requires Pause'); let scene;
    for (const place of w.pois.filter(p => p.levels.includes(1))) {
      const stairs = w.plan(place, 0).stairs[0]; if (!stairs) continue;
      const point = G.global(place, stairs.x + stairs.w / 2, stairs.y + stairs.h / 2), road = w.nearestRoad(point).road, center = G.nearest(point, road.a, road.b);
      if (center.d < 75 && Math.hypot(center.x - w.home.x, center.y - w.home.y) > C.WorldEvolution.RULES.homeExclusion + 300 && !w.blocked(center.x, center.y, .32, 0, null) && !w.blocked(point.x, point.y, .32, 0, place.id) && !w.blocked(point.x, point.y, .32, 1, place.id)) { scene = { place, point, road, center }; break; }
    }
    if (!scene) throw Error('A real physical stair with two clear landings and nearby exterior road is required');
    const s = g.serialize(); s.phaseTime = 999;
    Object.assign(s.frontier, { active: true, anchor: { x: g.player.x, y: g.player.y }, ...scene.point, z: 0, inside: scene.place.id }); s.frontier.seen = [scene.place.id];
    for (const p of w.nearPOI(scene.point.x, scene.point.y, 150)) for (let i = 0; i < w.threatCount(p); i++) s.frontier.enemies[p.id + ':e' + i] = 0;
    s.frontier.kills = Object.values(s.frontier.enemies).filter(n => n === 0).length;
    const a = Math.atan2(scene.road.b.y - scene.road.a.y, scene.road.b.x - scene.road.a.x);
    Object.assign(s.worldEvolution, { serial: 1, clock: 10, nextHorde: 11.5, groups: [{ id: 'W0000', kind: 'migrating', count: 80, lost: 0, wound: 0, ...scene.center, a, seen: false, contacts: { 0: { ...scene.center, z: 0, a, mode: 'idle', ttl: 0, gx: scene.center.x, gy: scene.center.y, cool: 0 } } }] });
    g.restoreSave(DeadwallSave.validate(s)); g.togglePause(false);
    let up;
    try { up = g.frontier.stairsStatus(1); }
    finally { g.togglePause(true); }
    if (!up.ok) throw Error('Native upward stair unavailable: ' + up.reason);
    return { poi: { id: scene.place.id, type: scene.place.type, levels: scene.place.levels }, point: scene.point, center: scene.center, changed: ['regional physical stair pose', 'phaseTime=999', 'seen stair POI', 'cleared bounded resident ledger', 'one migrating exterior group', 'exterior event due at clock=11.5'], stockAdded: 0, validatedSave: true };
  });
}

async function rendererProof(page, local = false) {
  return page.evaluate(local => {
    const g = DEADWALL; if (!g.paused) throw Error('Renderer purity proof requires Pause');
    const material = () => { const { timestamp, ...s } = g.serialize(); return JSON.stringify(s); }, before = material(), elapsed = g.elapsed;
    const calls = {}, blit = g.art.blit, camera = { ...g.camera }, views = [];
    g.art.blit = function (c, key, ...args) { const result = blit.call(this, c, key, ...args); if (result) calls[key] = (calls[key] || 0) + 1; return result; };
    try {
      const targets = local ? [g.core(), g.world.nodes.find(n => n.amount > 0 && n.type === 'wood'), g.world.nodes.find(n => n.amount > 0 && DeadwallWorldPropsArt153.resourceFamily(n))] : [null];
      for (const target of targets) {
        if (target) { g.camera.x = target.x; g.camera.y = target.y; }
        g.render(); views.push({ camera: { x: g.camera.x, y: g.camera.y }, targetId: target?.id, png: g.canvas.toDataURL('image/png') });
      }
    } finally { g.art.blit = blit; Object.assign(g.camera, camera); }
    return { floor: g.frontier.position().z, calls, persistentFieldsUnchanged: before === material(), elapsedUnchanged: elapsed === g.elapsed, simulationStepsInjected: 0, cameraOnlyProbe: local, views };
  }, local);
}

async function retainCanvasProof(proof, output, profile, stem) {
  for (let i = 0; i < proof.views.length; i++) {
    const view = proof.views[i], file = profile.name + '-' + stem + '-' + i + '.png';
    await writeFile(path.join(output, file), Buffer.from(view.png.split(',')[1], 'base64'));
    delete view.png; view.file = file; profile.screenshots.push(file);
  }
}

const floorReadout = page => page.evaluate(() => ({ position: DEADWALL.frontier.position(), evolution: DEADWALL.worldEvolution.snapshot(), contacts: DEADWALL.worldEvolution.groupMembers().map(e => ({ id: e.id, z: e.z })), health: DEADWALL.player.health, carry: { ...DEADWALL.player.carry }, taken: DEADWALL.frontier.snapshot().taken, elapsed: DEADWALL.elapsed, quality: DEADWALL.settings.quality }));

let harness;
try {
  const freeze = await sourceFreeze();
  harness = await createHarness('world153', scope);
  const { report, output, browser, base, assetKeys } = harness;
  report.target = standaloneTarget || { root: process.env.DEADWALL_QA_ROOT || 'repository', url: base }; report.profiles = [];
  const { material: frozenMaterial, ...stamp } = freeze; report.sourceFreeze = stamp;
  for (const view of profiles) {
    const profile = { name: view.name, viewport: { width: view.width, height: view.height }, touch: !!view.touch, fixtures: [], externalRequests: [] }; report.profiles.push(profile);
    const context = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: 2, isMobile: !!view.touch, hasTouch: !!view.touch, serviceWorkers: 'block' });
    const page = await context.newPage(), rec = recorder(page, profile, output, view.name + '-'), check = (name, pass) => rec.check(name, pass);
    if (standaloneTarget) page.on('request', req => { if (/^https?:|^wss?:/.test(req.url()) && req.url() !== base && req.url() !== new URL('favicon.ico', base).href) profile.externalRequests.push(req.url()); });
    try {
      await page.goto(base, { waitUntil: 'networkidle' }); await ready(page);
      profile.assets = await loadedAssets(page, assetKeys); check('Every installed declared atlas decodes with no fallback failure', profile.assets.loaded.length === assetKeys.length && assetKeys.length > 0);
      profile.sourceFreeze = await verifyFreeze(page, freeze);
      check('Decoded atlas metadata and all new sprite source bytes match the recorded source freeze', profile.sourceFreeze.assetCount === freeze.assetCount && profile.sourceFreeze.metadataHash === freeze.metadataHash && profile.sourceFreeze.verifiedAtlasBytes.length === freeze.newAssetCount && freeze.newAssetCount > 0);
      await chooseCampaign(page, '17117'); await activate(page, '#campaignIntro132Skip', !!view.touch); await pause(page, !!view.touch);
      const gallery = await atlasGallery(page);
      for (let i = 0; i < gallery.sheets.length; i++) {
        const file = view.name + '-atlas-paints-' + i + '.png'; await writeFile(path.join(output, file), Buffer.from(gallery.sheets[i].split(',')[1], 'base64')); profile.screenshots.push(file);
      }
      delete gallery.sheets; profile.gallery = gallery;
      check('All new atlas families and variants draw actual, repeatable Canvas pixels at four rotations', gallery.cases.length > 0 && ['nature', 'props', 'furniture', 'roof', 'ruin', 'floor'].every(module => gallery.cases.some(c => c.module === module)) && gallery.cases.every(c => c.nonzero >= 20));
      check('Basement, ground and upper-floor material painters retain stock, RNG and save material', [-1, 0, 1, 2].every(floor => gallery.cases.some(c => c.module === 'floor' && c.floor === floor)) && gallery.persistentFieldsUnchanged);
      profile.localRender = await rendererProof(page, true);
      check('Installed local renderer actually paints new nature and scenery sprites at existing world objects', Object.keys(profile.localRender.calls).some(key => key.startsWith('nature')) && Object.keys(profile.localRender.calls).some(key => key.startsWith('worldProps')) && profile.localRender.persistentFieldsUnchanged && profile.localRender.elapsedUnchanged);
      await retainCanvasProof(profile.localRender, output, profile, 'real-local-canvas');
      profile.quality = await qualityControls(page, !!view.touch, check);
      profile.medical = await medicalContacts(page); profile.fixtures.push({ name: 'actual-medical-contact-boundaries', ...profile.medical, results: undefined });
      const [visible, hidden] = profile.medical.results;
      check('Real visible individual blocks paid medical work even with a remote horde centre', visible.visible && !visible.preview.ok && !visible.begin.ok && !visible.busy && visible.materialUnchanged && visible.elapsedUnchanged);
      check('Real facade hides an individual without a phantom work refusal or cancellation charge', !hidden.visible && hidden.preview.ok && hidden.begin.ok && hidden.busy && hidden.cancelled && hidden.materialUnchanged && hidden.elapsedUnchanged);
      profile.fixtures.push({ name: 'physical-regional-stairs', ...await stairsFixture(page) });
      profile.groundRender = await rendererProof(page);
      check('Installed ground-floor renderer actually uses the new interior atlas without mutating gameplay', Object.keys(profile.groundRender.calls).some(key => key.startsWith('interior')) && profile.groundRender.persistentFieldsUnchanged && profile.groundRender.elapsedUnchanged);
      await retainCanvasProof(profile.groundRender, output, profile, 'real-ground-canvas');
      await rec.screenshot('real-ground-interior-paused');
      await resume(page, !!view.touch);
      if (view.touch) await touchStairs(page, 1); else { await page.locator('#game').focus(); await page.keyboard.press('PageUp'); }
      await page.waitForFunction(() => DEADWALL.frontier.position().z === 1, null, { timeout: 5000 });
      const before = await floorReadout(page);
      check('Prepared exterior event is still pending after the native ascent', before.evolution.groups.length === 1 && before.evolution.clock < before.evolution.nextHorde);
      await page.waitForFunction(target => DEADWALL.worldEvolution.snapshot().clock >= target, Math.max(before.evolution.nextHorde + .15, before.evolution.clock + .6), { timeout: 10000 });
      await pause(page, !!view.touch); const upstairs = await floorReadout(page); profile.upstairs = { before, after: upstairs };
      check('Native upper stair leaves the exterior clock and migration moving with ordinary RAF', upstairs.position.z === 1 && upstairs.evolution.clock - before.evolution.clock >= .6 && Math.hypot(upstairs.evolution.groups[0].x - before.evolution.groups[0].x, upstairs.evolution.groups[0].y - before.evolution.groups[0].y) > .3);
      check('Due exterior horde event stays outdoors while the upper-floor actor receives no contacts or damage', upstairs.evolution.groups.length === 2 && upstairs.evolution.serial === 2 && upstairs.evolution.nextHorde > upstairs.evolution.clock && upstairs.contacts.length === 0 && upstairs.health === before.health && JSON.stringify(upstairs.carry) === JSON.stringify(before.carry) && JSON.stringify(upstairs.taken) === JSON.stringify(before.taken));
      profile.upperRender = await rendererProof(page);
      check('Installed upper-floor renderer draws real interior sprites without consuming RNG or stock', Object.keys(profile.upperRender.calls).some(key => key.startsWith('interior')) && profile.upperRender.persistentFieldsUnchanged && profile.upperRender.elapsedUnchanged);
      await retainCanvasProof(profile.upperRender, output, profile, 'real-upper-canvas');
      await rec.screenshot('real-upper-interior-paused');
      const pausedClock = upstairs.evolution.clock; await page.waitForTimeout(180);
      check('Ordinary Pause freezes the exterior migration clock upstairs', (await floorReadout(page)).evolution.clock === pausedClock);
      await resume(page, !!view.touch); profile.restore = await saveReloadContinue(page, !!view.touch);
      check('Native Save/reload/Continue restores complete material and seeded RNG upstairs', profile.restore.pass && profile.restore.restoreComparison.expectedRNG === profile.restore.restoreComparison.restoredRNG && await page.evaluate(() => DEADWALL.frontier.position().z === 1));
      check('Native Continue retains the selected automatic display quality', await page.evaluate(() => DEADWALL.settings.quality === 'auto' && document.getElementById('settingsQuality').value === 'auto'));
      await rec.screenshot('continued-upper-floor');
      if (view.touch) await touchStairs(page, -1); else { await page.locator('#game').focus(); await page.keyboard.press('PageDown'); }
      await page.waitForFunction(() => DEADWALL.frontier.position().z === 0 && DEADWALL.worldEvolution.groupMembers().length > 0, null, { timeout: 5000 });
      await pause(page, !!view.touch); profile.returned = await floorReadout(page);
      check('Native descent restores actual outdoor individuals exclusively on ground level', profile.returned.contacts.length > 0 && profile.returned.contacts.every(e => e.z === 0) && JSON.stringify(profile.returned.carry) === JSON.stringify(upstairs.carry) && JSON.stringify(profile.returned.taken) === JSON.stringify(upstairs.taken));
      if (standaloneTarget) check('Standalone HTML issues no external asset request', profile.externalRequests.length === 0);
      check('World verification produces a non-empty set of meaningful checks with no browser error', profile.checks.length >= 20 && rec.errors() === 0);
      profile.pass = true;
    } catch (error) { profile.pass = false; profile.failure = error.stack; await rec.screenshot('failure').catch(() => {}); }
    finally { await context.close(); }
  }
  report.pass = report.profiles.length > 0 && report.profiles.every(profile => profile.pass && profile.checks.length >= 20);
} catch (error) {
  if (harness) { harness.report.pass = false; harness.report.failure = error.stack; }
  else throw error;
} finally {
  try { await harness?.close(); }
  finally {
    if (standaloneServer) { standaloneServer.closeAllConnections(); await new Promise((resolve, reject) => standaloneServer.close(error => error ? reject(error) : resolve())); }
    if (harness) await harness.finish();
  }
}
if (!harness?.report.pass) process.exitCode = 1;
