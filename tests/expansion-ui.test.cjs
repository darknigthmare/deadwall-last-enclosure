'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const UI = require('../src/expansion-ui.js');
const ids = ['exploration', 'survival', 'fortification', 'companions', 'campaign'];

function fixture(beforeInstall) {
  const env = bootGame(), g = env.game, doc = globalThis.document;
  g.startNew('standard', '17117');
  // Reparenting is part of the real DOM contract, absent from the lean simulation fixture.
  const proto = Object.getPrototypeOf(doc.body), baseAppend = proto.appendChild;
  proto.appendChild = function (n) { if (n.parentNode) n.remove(); return baseAppend.call(this, n); };
  const el = (tag, id, cls) => { const n = doc.createElement(tag); if (id) { n.id = id; env.elements.set(id, n); } if (cls) n.classList.add(cls); return n; };
  const body = el('div', 'expansionTestBody', 'command-body');
  const field = el('section', 'commandPanel-field'), nav = el('nav', 'expansionTestNav', 'field-nav');
  const old = el('button', 'oldField'), oldSection = el('section', 'oldSection'); old.textContent = 'Ancien dossier'; old.dataset.fieldView = 'old';
  nav.appendChild(old); field.appendChild(nav); field.appendChild(oldSection); body.appendChild(field); g.ui.commandModal.appendChild(body);
  old.addEventListener('click', () => { oldSection.classList.remove('hidden'); old.setAttribute('aria-pressed', 'true'); });
  let previousPause = false;
  g.showCommand = (show) => {
    if (show) { if (g.activeOverlay && ![g.ui.commandModal, g.ui.pauseMenu].includes(g.activeOverlay)) return; previousPause = g.paused; g.paused = true; g.ui.commandModal.classList.remove('hidden'); field.classList.remove('hidden'); }
    else { g.ui.commandModal.classList.add('hidden'); g.paused = previousPause; }
    g.syncOverlayFocus();
  };
  const drawers = ['essentialQuick', 'nightGearQuick'].map(id => { const n = el('details', id); n.appendChild(el('summary')); doc.body.appendChild(n); return n; });
  const dock = el('section', 'fieldDock', 'field-dock'); doc.body.appendChild(dock);
  g.nightGear = { lights: () => [] }; g.essentialUI = { open() { old.click(); } };
  const actualFrontier = g.frontier;
  let region = false; g.frontier = { active: () => region };
  let calls = 0, count = 0, available = true, dynamic = false, orderCount = 0, reason = 'Approchez du point.';
  const descriptors = ids.map((id, i) => ({ id, title: 'Pack ' + id,
    overview() { calls++; return { summary: 'Résumé concret ' + id, rows: [{ label: 'Mesure', value: count }, { label: 'Position', value: 'D-17' }] }; },
    actions() { return [{ id: 'start', label: 'Intervention · 4 s', description: 'Consomme deux bois du sac.', close: true, disabled: !available, reason: available ? '' : reason, run() { orderCount++; return { ok: true }; } },
      { id: 'order', label: 'Ordre instantané', run() { orderCount++; return { ok: false, reason: 'La situation a changé.' }; } },
      ...(dynamic ? [{ id: 'new', label: 'Nouveau', run: () => true }] : [])]; }
  }));
  g.expansions = { entries: () => descriptors, canAct: () => g.canIssueCommand() && (!g.activeOverlay || g.activeOverlay === g.ui.commandModal) };
  g.updateUI = () => true;
  beforeInstall?.(g, oldSection);
  assert.equal(UI.install(g, doc), true);
  const q = id => g.expansionUI.section.querySelectorAll('button,p,nav,dl').find(n => n.id === id);
  return { ...env, g, doc, field, nav, old, oldSection, body, drawers, dock, descriptors, q, actualFrontier,
    setCount: n => count = n, setAvailable: value => available = value, setDynamic: value => dynamic = value,
    setRegion: value => region = value, calls: () => calls, orders: () => orderCount };
}

test('opérations : une installation, domaines compacts, pause partagée et anciens dossiers accessibles', () => {
  const { g, doc, nav, old, oldSection, q } = fixture();
  assert.equal(UI.install(g, doc), false);
  assert.equal(g.expansionUI.open('survival'), true); assert.equal(g.activeOverlay, g.ui.commandModal); assert.equal(g.paused, true);
  assert.equal(q('expansionTab-survival').getAttribute('aria-selected'), 'true'); assert.equal(oldSection.classList.contains('hidden'), true);
  assert.equal(g.expansionUI.section.querySelectorAll('button').filter(n => n.getAttribute('role') === 'tab').length, 2);
  old.click(); assert.equal(g.expansionUI.isOpen(), false); assert.equal(oldSection.classList.contains('hidden'), false);
  nav.children.find(n => n.dataset.fieldView === 'expansions').click(); assert.equal(g.expansionUI.isOpen(), true);
  assert.equal(g.expansionUI.close(), true); assert.equal(g.paused, false); assert.equal(g.activeOverlay, null);
});

test('opérations : clavier, rôles et état sélectionné cohérents', () => {
  const { g, q, doc } = fixture(); g.expansionUI.open('survival');
  q('expansionTab-survival').dispatch('keydown', { code: 'ArrowRight' });
  assert.equal(q('expansionTab-companions').getAttribute('aria-selected'), 'true'); assert.equal(doc.activeElement, q('expansionTab-companions'));
  assert.equal(q('expansionTab-companions').tabIndex, 0); assert.equal(q('expansionTab-survival').tabIndex, -1);
  q('expansionTab-companions').dispatch('keydown', { code: 'Home' }); assert.equal(doc.activeElement, q('expansionTab-survival'));
  q('expansionTab-survival').dispatch('keydown', { code: 'End' }); assert.equal(doc.activeElement, q('expansionTab-companions'));
  q('expansionGroup-exploration').click(); assert.equal(doc.activeElement, q('expansionTab-exploration'));
  assert.equal(q('expansionAction-exploration-start').getAttribute('aria-describedby'), 'expansionAction-exploration-start-reason');
});

test('opérations : raisons lisibles, garde relue au clic et retour de refus', () => {
  const f = fixture(), { g, q } = f; g.expansionUI.open();
  const b = q('expansionAction-exploration-start'); f.setAvailable(false); b.click();
  assert.equal(f.orders(), 0); assert.equal(b.disabled, true); assert.match(q('expansionAction-exploration-start-reason').textContent, /Approchez/);
  f.setAvailable(true); g.expansionUI.refresh(true); q('expansionAction-exploration-order').click();
  assert.equal(f.orders(), 1); assert.equal(g.expansionUI.isOpen(), true); assert.match(q('expansionNotice').textContent, /situation a changé/);
  g.player.dead = true; b.click(); assert.equal(f.orders(), 1); assert.equal(b.disabled, true);
});

test('opérations : un départ réussi ferme le poste, un ordre refusé conserve la pause', () => {
  const f = fixture(), { g, q } = f; g.expansionUI.open();
  q('expansionAction-exploration-start').click(); assert.equal(f.orders(), 1); assert.equal(g.expansionUI.isOpen(), false); assert.equal(g.paused, false);
  assert.equal(g.activeOverlay, null); assert.equal(g.expansionUI.tray.inert, false);
});

test('opérations : changements numériques conservent les nœuds, le focus et le défilement', () => {
  const { g, q, doc, body, setCount } = fixture(); g.expansionUI.open();
  const button = q('expansionAction-exploration-order'), metric = g.expansionUI.section.querySelectorAll('dd')[0];
  button.focus(); body.scrollTop = 316; const nodes = g.expansionUI.section.querySelectorAll('button,p,article,dd').length;
  for (let i = 0; i < 500; i++) { setCount(i); g.expansionUI.refresh(true); }
  assert.equal(q('expansionAction-exploration-order'), button); assert.equal(g.expansionUI.section.querySelectorAll('dd')[0], metric);
  assert.equal(metric.textContent, '499'); assert.equal(doc.activeElement, button); assert.equal(body.scrollTop, 316);
  assert.equal(g.expansionUI.section.querySelectorAll('button,p,article,dd').length, nodes);
  assert.equal(button._listeners.get('click').length, 1);
});

test('opérations : ajout/retrait contextuel conserve le focus ou le rend à la famille', () => {
  const { g, q, doc, body, setDynamic } = fixture(); g.expansionUI.open();
  q('expansionAction-exploration-order').focus(); body.scrollTop = 225; setDynamic(true); g.expansionUI.refresh(true);
  assert.equal(doc.activeElement, q('expansionAction-exploration-order')); assert.equal(body.scrollTop, 225);
  q('expansionAction-exploration-new').focus(); setDynamic(false); g.expansionUI.refresh(true); assert.equal(doc.activeElement, q('expansionTab-exploration'));
});

test('opérations : aucun calcul du panneau fermé et rafraîchissement borné sans nouveau timer', () => {
  const { g, calls } = fixture(); const before = calls();
  for (let i = 0; i < 1000; i++) g.updateUI(); assert.equal(calls(), before);
  g.expansionUI.open(); const open = calls();
  for (let i = 0; i < 1000; i++) g.updateUI(); assert.ok(calls() - open < 3);
});

test('matériel : tiroirs conservés, un seul ouvert, dock régional et inertie des modales', () => {
  const { g, drawers, dock, setRegion } = fixture(); const tray = g.expansionUI.tray;
  assert.ok(drawers.every(d => d.parentNode === tray));
  drawers[0].open = true; drawers[1].open = true; drawers[1].dispatch('toggle'); assert.equal(drawers[0].open, false);
  setRegion(true); g.expansionUI.refresh(true); assert.equal(tray.parentNode, dock);
  g.expansionUI.open(); assert.equal(tray.inert, true); g.expansionUI.close(); assert.equal(tray.inert, false);
  setRegion(false); g.expansionUI.refresh(true); assert.equal(tray.parentNode, g.ui.hud);
  g.state = 'menu'; g.expansionUI.refresh(true); assert.equal(tray.classList.contains('hidden'), true); assert.equal(drawers[1].open, false);
});

test('éclairage : raccourci ferme le commandement avant un tiroir vivant, sans autre modale', () => {
  const { g, q, drawers, doc } = fixture(); g.expansionUI.open('survival'); q('expansionLighting').click();
  assert.equal(g.activeOverlay, null); assert.equal(g.paused, false); assert.equal(drawers[1].open, true);
  assert.equal(doc.activeElement, drawers[1].querySelector('summary'));
});

test('opérations : une modale prioritaire refuse toute ouverture et mutation', () => {
  const { g } = fixture(); g.ui.helpModal.classList.remove('hidden'); g.syncOverlayFocus();
  assert.equal(g.expansionUI.open(), false); assert.equal(g.expansionUI.tray.inert, true);
});

test('HUD : une intervention active reste lisible sur le terrain et indique la pause sans notifications répétées', () => {
  const { g } = fixture(); let active = true, fraction = .35, notifications = 0;
  g.notify = () => notifications++;
  g.survivalPack = { busy: () => active, overview: () => ({ task: { kind: 'rest', progress: fraction } }) };
  g.expansionUI.refresh(true);
  const work = g.expansionUI.tray.children.find(n => n.id === 'expansionWork'), p = work.querySelector('progress');
  assert.equal(work.classList.contains('hidden'), false); assert.equal(p.value, .35);
  assert.match(work.querySelector('span').textContent, /35 %/);
  g.expansionUI.open(); assert.match(work.querySelector('span').textContent, /EN PAUSE/);
  g.expansionUI.close(); fraction = .8; g.expansionUI.refresh(true); assert.equal(p.value, .8);
  assert.equal(notifications, 0); active = false; g.expansionUI.refresh(true); assert.equal(work.classList.contains('hidden'), true);
});

test('hub intégré : les cinq vrais modules fournissent leurs actions et une préparation réelle reprend dans le HUD', () => {
  const { g, q, actualFrontier } = fixture(); g.frontier = actualFrontier;
  delete g.expansions; require('../src/expansion-kit.js').install(g);
  delete g.nightGear; require('../src/night-gear.js').install(g);
  for (const name of ['exploration', 'survival', 'fortification', 'companions', 'campaign']) require('../src/' + name + '-pack.js').install(g);
  assert.equal(g.expansions.entries().length, 5);
  for (const id of ids) {
    assert.equal(g.expansionUI.open(id), true);
    assert.ok(g.expansionUI.section.querySelectorAll('article').length > 0, id);
    assert.ok(g.expansionUI.section.querySelectorAll('dd').length > 0, id);
    assert.ok(g.expansionUI.section.querySelectorAll('button').filter(n => n.id.startsWith('expansionAction-')).every(n => n.textContent.length > 2));
    g.expansionUI.close();
  }
  g.player.health = 45; g.player.carry.medicine = 4;
  g.expansionUI.open('survival');
  const dressing = g.expansionUI.section.querySelectorAll('button').find(n => n.id.startsWith('expansionAction-') && n.textContent.includes('pansement'));
  assert.ok(dressing); assert.equal(dressing.disabled, false); dressing.click();
  assert.equal(g.survivalPack.busy(), true); assert.equal(g.expansionUI.isOpen(), false); assert.equal(g.paused, false);
  g.survivalPack.step(.1); g.expansionUI.refresh(true);
  const work = g.expansionUI.tray.children.find(n => n.id === 'expansionWork');
  assert.equal(work.classList.contains('hidden'), false); assert.ok(work.querySelector('progress').value > 0);
});

test('anciens dossiers : panneau masqué sans reconstruction et rafraîchissement automatique plafonné', () => {
  const { g, doc, actualFrontier, elements } = fixture(); g.frontier = actualFrontier;
  const proto = Object.getPrototypeOf(doc.body); proto.append = function (...nodes) { for (const node of nodes) this.appendChild(node); };
  const originalGet = doc.getElementById.bind(doc); doc.getElementById = id => doc.body.querySelectorAll('#' + id)[0] || originalGet(id);
  const host = doc.createElement('section'); host.id = 'frontierDossier'; doc.body.appendChild(host); elements.set(host.id, host);
  g.frontierUI = { open() { host.classList.remove('hidden'); return true; } };
  const original = g.worldEvolution.overview; let reads = 0;
  g.worldEvolution = { ...g.worldEvolution, overview() { reads++; return original(); } };
  doc.readyState = 'complete'; const path = require.resolve('../src/world-evolution-ui.js'); delete require.cache[path]; require(path);
  g.worldEvolutionUI.open('people');
  const panel = doc.getElementById('evolutionPanel'); assert.equal(panel.open, true); assert.ok(doc.getElementById('comp-lea'));
  host.classList.add('hidden'); const beforeHidden = reads;
  for (let i = 0; i < 100; i++) g.worldEvolutionUI.refresh(); assert.equal(reads, beforeHidden);
  host.classList.remove('hidden'); g.worldEvolutionUI.refresh(); const beforeAutomatic = reads;
  for (let i = 0; i < 1000; i++) g.updateUI(); assert.ok(reads - beforeAutomatic < 3);
  const beforeExplicit = reads; g.worldEvolutionUI.refresh(); assert.equal(reads, beforeExplicit + 1);
});

test('retour : le bouton du dock régional retrouve le focus et la pause préalable reste explicite', () => {
  const { g, q, doc, setRegion } = fixture(); setRegion(true); g.expansionUI.refresh(true);
  const origin = g.expansionUI.tray.children.find(n => n.id === 'fieldOperations'); origin.focus(); origin.click();
  assert.equal(g.expansionUI.isOpen(), true); g.expansionUI.close(); assert.equal(doc.activeElement, origin);
  g.togglePause(true); g.expansionUI.open('survival');
  assert.equal(q('expansionLighting').disabled, true); assert.match(q('expansionLighting').textContent, /REPRENEZ/);
  q('expansionAction-survival-start').click(); assert.equal(g.paused, true); assert.equal(g.activeOverlay, g.ui.pauseMenu);
});

test('raccourcis historiques : guide et sorties quittent le hub même sans clic dans le ruban', () => {
  const { g, oldSection } = fixture((g, section) => {
    g.worldCodex = Object.freeze({ open: () => section.classList.remove('hidden') });
    g.fieldOperations = Object.freeze({ open: () => section.classList.remove('hidden') });
  });
  for (const key of ['worldCodex', 'fieldOperations']) {
    g.expansionUI.open(); assert.equal(oldSection.classList.contains('hidden'), true);
    g[key].open(); assert.equal(g.expansionUI.isOpen(), false); assert.equal(oldSection.classList.contains('hidden'), false);
  }
});

test('retour régional : Échap et la fermeture historique rendent le focus au déclencheur du dock', () => {
  for (const method of ['escape', 'command-close']) {
    const { g, doc, setRegion, dispatchWindow } = fixture();
    setRegion(true); g.expansionUI.refresh(true);
    const origin = g.expansionUI.tray.children.find(n => n.id === 'fieldOperations');
    origin.focus(); origin.click();
    if (method === 'escape') dispatchWindow('keydown', { code: 'Escape', repeat: false });
    else g.showCommand(false);
    assert.equal(g.activeOverlay, null, method); assert.equal(g.paused, false, method);
    assert.equal(doc.activeElement, origin, method);
  }
});

test('actions : une condition qui change rend le focus à la famille et explique le refus sans survol', () => {
  const { g, doc, q, setAvailable } = fixture(); g.expansionUI.open();
  const button = q('expansionAction-exploration-start'); button.focus();
  setAvailable(false); g.expansionUI.refresh(true);
  assert.equal(button.disabled, true); assert.equal(doc.activeElement, q('expansionTab-exploration'));
  const reason = q(button.getAttribute('aria-describedby'));
  assert.match(reason.textContent, /Approchez/); assert.notEqual(reason.hidden, true);
  assert.equal(reason.closest('.hidden'), null);
});

test('actions : un refus sans raison ne promet pas le lancement de l’intervention', () => {
  const { g, q, descriptors } = fixture();
  descriptors[0].actions = () => [{ id: 'blocked', label: 'Intervention', disabled: true, close: true, run: () => true }];
  g.expansionUI.open();
  assert.equal(q('expansionAction-exploration-blocked').disabled, true);
  assert.match(q('expansionAction-exploration-blocked-reason').textContent, /indisponible/i);
  assert.doesNotMatch(q('expansionAction-exploration-blocked-reason').textContent, /Démarre/);
});

test('opérations : déplacement, tir et commandes clavier restent bloqués derrière le poste et l’aide', () => {
  const { g, doc, q, dispatchWindow } = fixture();
  g.expansionUI.open();
  const position = [g.player.x, g.player.y], stocks = JSON.stringify(g.resources);
  for (const extra of [{ target: q('expansionAction-exploration-start') }, { target: doc.body }]) {
    for (const code of ['KeyW', 'KeyZ', 'KeyA', 'KeyQ', 'KeyS', 'KeyD', 'KeyE', 'KeyR', 'KeyF', 'Space', 'Digit1', 'Digit4', 'KeyG', 'KeyT']) dispatchWindow('keydown', { code, ...extra });
    assert.equal(g.input.keys.size, 0); assert.equal(g.input.pressed.size, 0);
    g.canvas.dispatch('mousedown', { button: 0, clientX: 50, clientY: 50 }); assert.equal(g.input.mouseDown, false);
  }
  g.ui.helpModal.classList.remove('hidden'); g.syncOverlayFocus();
  dispatchWindow('keydown', { code: 'KeyE', target: doc.body });
  q('expansionAction-exploration-start').dispatch('click');
  assert.equal(g.input.keys.size, 0); assert.equal(g.input.pressed.size, 0);
  assert.equal(g.activeOverlay, g.ui.helpModal); assert.deepEqual([g.player.x, g.player.y], position);
  assert.equal(JSON.stringify(g.resources), stocks);
});
