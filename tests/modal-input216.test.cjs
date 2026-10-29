'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { bootDocument134 } = require('../scripts/qa-startup134.cjs');
const { prepare } = require('./helpers/city-content150.cjs');
const { legacyAge } = require('./helpers/legacy-city.cjs');

function setup() {
  const env = bootDocument134(), { g } = env;
  g.startNew('standard', '17117'); g.campaignIntro132.skip();
  g.render = () => {};
  g.canvas.focus();
  return env;
}

function material(g) {
  const { timestamp, ...saved } = g.serialize();
  return JSON.stringify(saved);
}

function click(env, id) {
  const button = env.doc.getElementById(id);
  assert.ok(env.doc.body.contains(button), 'contrôle livré : ' + id);
  assert.equal(button.disabled, false);
  assert.ok(!button.closest('[inert], .hidden'), 'contrôle disponible : ' + id);
  button.focus(); button.click();
  return button;
}

function escape(env, repeat = false) {
  const event = env.dispatchWindow('keydown', {
    code: 'Escape', key: 'Escape', repeat, target: env.doc.activeElement
  });
  assert.equal(event.defaultPrevented, true);
  if (!repeat) env.dispatchWindow('keyup', { code: 'Escape', key: 'Escape', target: env.doc.activeElement });
}

function paused(env, overlay, expectedMaterial) {
  const { g, doc } = env;
  assert.equal(g.activeOverlay?.id, overlay.id);
  assert.equal(g.paused, true);
  assert.ok(overlay.contains(doc.activeElement), 'le menu visible garde le focus');
  assert.equal(g.ui.hud.inert, true);
  assert.equal(g.input.pressed.size, 0); assert.equal(g.input.keys.size, 0);
  const elapsed = g.elapsed;
  for (let frame = 0; frame < 3; frame++) g.loop(g.lastFrame + 40);
  assert.equal(g.elapsed, elapsed, 'aucun temps de simulation ajouté par la navigation');
  assert.equal(material(g), expectedMaterial, 'fermer un menu ne modifie pas la campagne');
}

for (const menu of ['settings', 'help']) {
  test('216 Échap ferme ' + menu + ' puis Pause avant de ranger les outils de voirie', () => {
    const env = setup(), { g, doc } = env;
    assert.equal(g.infrastructure.equip(), true);
    assert.equal(g.infrastructure.toolActive(), true);
    const before = material(g), returnFocus = click(env, 'pauseButton');
    const opener = click(env, menu === 'settings' ? 'pauseSettingsButton' : 'helpPauseButton');
    paused(env, menu === 'settings' ? g.ui.settingsModal : g.ui.helpModal, before);

    escape(env);
    paused(env, g.ui.pauseMenu, before);
    assert.equal(doc.activeElement?.id, opener.id);
    assert.equal(g.infrastructure.toolActive(), true, 'le menu ne range pas un outil derrière lui');
    for (let repeat = 0; repeat < 4; repeat++) escape(env, true);
    paused(env, g.ui.pauseMenu, before);
    assert.equal(g.infrastructure.toolActive(), true);

    escape(env);
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(doc.activeElement?.id, returnFocus.id);
    assert.equal(g.infrastructure.toolActive(), true, 'Reprendre conserve le mode de travail');
    assert.equal(material(g), before);
    escape(env);
    assert.equal(g.infrastructure.toolActive(), false, 'sur le terrain, Échap range toujours les outils');
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(material(g), before, 'annuler ne finance ni ne construit une route');
  });
}

for (const menu of ['settings', 'help']) {
  test('216 Échap conserve un placement de programme derrière ' + menu + ' et Pause', () => {
    const env = setup(), { g } = env;
    // Prepared fixture: a completed office at a position accepted by the real
    // placement owner. The preview remains unfunded throughout this scenario.
    prepare(g, 'planningOffice');
    assert.equal(g.dayworks.beginPlan('courtyard'), true);
    assert.deepEqual(g.dayworks.workContext(), { tool: 'none', placing: true, preview: false });
    const before = material(g);
    click(env, 'pauseButton');
    click(env, menu === 'settings' ? 'pauseSettingsButton' : 'helpPauseButton');
    escape(env);
    paused(env, g.ui.pauseMenu, before);
    assert.equal(g.dayworks.workContext().placing, true, 'le projet reste disponible derrière le menu');
    for (let repeat = 0; repeat < 4; repeat++) escape(env, true);
    paused(env, g.ui.pauseMenu, before);
    assert.equal(g.dayworks.workContext().placing, true);
    escape(env);
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(g.dayworks.workContext().placing, true);
    escape(env);
    assert.deepEqual(g.dayworks.workContext(), { tool: 'none', placing: false, preview: false });
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(material(g), before, 'aucun coût ni chantier créé par l’annulation');
  });
}

for (const action of ['construction', 'ralliement']) {
  test('216 Échap reprend Pause avant d’annuler le placement de ' + action, () => {
    const env = setup(), { g } = env;
    if (action === 'construction') g.selectBuild('house');
    else assert.equal(g.beginSquadRally(1), true);
    const pending = () => action === 'construction' ? g.selectedBuild : g.rallyPlacement;
    const selected = JSON.stringify(pending()), before = material(g);
    assert.ok(pending());
    click(env, 'pauseButton');
    paused(env, g.ui.pauseMenu, before);
    escape(env);
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(JSON.stringify(pending()), selected, 'le placement reste choisi à la reprise');
    for (let repeat = 0; repeat < 4; repeat++) escape(env, true);
    assert.equal(JSON.stringify(pending()), selected);
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    escape(env);
    assert.ok(!pending(), 'sur le terrain, Échap annule toujours le placement');
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(material(g), before, 'pas de construction, de paiement ni d’ordre de déplacement');
  });
}

for (const owner of ['dayworks', 'infrastructure']) {
  test('216 Échap annule l’aperçu de ' + owner + ' seulement dans son panneau visible', () => {
    const env = setup(), { g, doc } = env;
    // Prepared fixture grants a completed office and the existing Camp age.
    // These unfunded drafts may still have blocked cells or insufficient stock;
    // dismissal must work without paying or pretending the plan is buildable.
    prepare(g, 'planningOffice'); legacyAge(g, 10);
    const api = g[owner], panel = doc.getElementById(owner === 'dayworks' ? 'dayworksPanel' : 'infrastructurePanel');
    const draft = () => {
      if (owner === 'dayworks') api.anchorPlan('courtyard', 10, 10);
      else api.plan({ x: 10, y: 10 }, { x: 11, y: 10 });
      assert.ok(api.overview().preview, 'le propriétaire conserve un véritable aperçu');
    };
    const before = material(g);
    draft(); api.open();
    assert.equal(g.activeOverlay?.id, g.ui.commandModal.id);
    assert.ok(!panel.closest('[inert], .hidden'), 'le panneau propriétaire est visible');
    escape(env);
    assert.equal(api.overview().preview, null, 'Échap conserve son annulation dans le panneau du projet');
    paused(env, g.ui.commandModal, before);

    draft(); g.showSettings(true);
    escape(env);
    paused(env, g.ui.commandModal, before);
    assert.ok(api.overview().preview, 'Paramètres se ferme sans annuler le projet derrière');
    for (let repeat = 0; repeat < 4; repeat++) escape(env, true);
    assert.ok(api.overview().preview);
    escape(env);
    assert.equal(api.overview().preview, null);
    paused(env, g.ui.commandModal, before);

    draft(); click(env, 'commandTab-workers');
    assert.ok(panel.closest('[inert], .hidden'), 'le projet est masqué derrière un autre onglet');
    escape(env);
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.ok(api.overview().preview, 'fermer un autre onglet n’annule pas le projet masqué');
    escape(env);
    assert.equal(api.overview().preview, null, 'sur le terrain, Échap annule encore l’aperçu');
    assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
    assert.equal(material(g), before, 'les aperçus et leur annulation ne créent aucune dépense');

    if (owner === 'infrastructure') {
      draft(); api.open(); click(env, 'infra-sub-rebuild');
      assert.ok(doc.getElementById('infraCancel').closest('[inert], .hidden'), 'le sous-onglet reconstruction masque l’aperçu routier');
      escape(env);
      assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
      assert.ok(api.overview().preview, 'Échap ne supprime pas la route cachée derrière Reconstruction');
      escape(env);
      assert.equal(api.overview().preview, null);
      assert.ok(!g.activeOverlay); assert.equal(g.paused, false);
      assert.equal(material(g), before);
    }
  });
}

for (const code of ['Enter', 'NumpadEnter']) {
  test('216 ' + code + ' répété ne réactive pas les boutons, les autres entrées restent natives', () => {
    const env = setup(), { g, doc, dispatchWindow } = env;
    click(env, 'pauseButton'); click(env, 'pauseSettingsButton');
    const button = doc.getElementById('settingsClose'), before = material(g);
    const key = (code, repeat, target = button) => dispatchWindow('keydown', { code, key: code === 'NumpadEnter' ? 'Enter' : code, repeat, target });
    assert.equal(key(code, false).defaultPrevented, false, 'le premier appui garde l’activation native');
    for (let repeat = 0; repeat < 4; repeat++) assert.equal(key(code, true).defaultPrevented, true);
    paused(env, g.ui.settingsModal, before);
    assert.equal(key('Space', true).defaultPrevented, false, 'Espace garde son activation native au relâchement');
    assert.equal(key('ArrowRight', true, doc.getElementById('settingsVolume')).defaultPrevented, false, 'le curseur de volume conserve les flèches répétées');
    const text = doc.createElement('textarea'); g.ui.settingsModal.append(text); text.focus();
    assert.equal(key(code, true, text).defaultPrevented, false, 'les champs de texte conservent leurs touches');
    dispatchWindow('keyup', { code, key: 'Enter', target: button });
    assert.equal(key(code, false).defaultPrevented, false, 'un nouvel appui reste disponible');
    assert.equal(material(g), before);
    // The DOM fixture does not synthesize browser keydown-to-click default
    // actions; the native Chromium scenario covers the actual focus transfer.
  });
}
