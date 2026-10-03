(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.DeadwallPresentation132 = api;
    const mount = () => api.install(root.DEADWALL, root.document);
    if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Original single-stroke pictograms. Decorative: the existing text remains the accessible name.
  const GLYPHS = Object.freeze({
    bastion: 'M3 20V8h4V4h4v4h2V4h4v4h4v12H3Zm7 0v-6h4v6M3 11h18',
    route: 'M4 19h5l6-14h5M4 5h3m10 14h3M10 5h3M11 19h3M4 3v4M20 17v4',
    people: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9v-3c0-3 12-3 12 0v3M16 5a3 3 0 0 1 0 6M17 15c3 0 5 1 5 3v3',
    dossier: 'M4 4h7l3 3h6v14H4V4Zm4 8h8M8 16h8',
    compass: 'M12 2v3m0 14v3M2 12h3m14 0h3M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm3 4-2 4-4 2 2-4 4-2Z',
    tools: 'm4 20 7-7M14 10l6-6M15 3l6 6M3 4l3-1 14 14-3 3L3 6V4Z',
    pack: 'M8 6V3h8v3M6 6h12l2 4v11H4V10l2-4Zm0 9h12M8 12h8v6H8v-6Z',
    settings: 'M4 4v16m8-16v16m8-16v16M1 8h6m2 8h6m2-9h6',
    pause: 'M8 4v16M16 4v16',
    resume: 'm8 4 12 8-12 8V4ZM3 4v16',
    book: 'M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15',
    archive: 'M3 4h18v5H3V4Zm2 5v12h14V9M9 13h6',
    radio: 'M4 9h16v12H4V9Zm2-4 12-3M8 17h1m3 0h5M8 12h8M6 5v4',
    exit: 'M10 3H3v18h7M8 12h13m-4-4 4 4-4 4',
    save: 'M4 3h13l4 4v14H3V3h1Zm3 0v6h9V3M7 21v-8h10v8',
    lantern: 'M9 6V3h6v3M7 7h10l2 13H5L7 7Zm-3 14h16M12 10v7',
    target: 'M12 2v5m0 10v5M2 12h5m10 0h5M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z'
  });
  const NAV = Object.freeze({ enclosure: 'bastion', workers: 'people', research: 'tools', records: 'archive', field: 'compass', journal: 'book' });
  const SCENES = Object.freeze({
    classic: ['D-17 · LE DÉPÔT', 'Une enceinte commence par un refuge.', 'bastion'],
    convoy: ['D-17 · CONVOI CIVIL', 'Le convoi s’arrête. La reconstruction commence.', 'route'],
    reconstruction: ['D-17 · RECONSTRUCTION', 'Les murs ont cédé. Le dépôt tient encore.', 'tools'],
    rearguard: ['D-17 · ARRIÈRE-GARDE', 'Tenir ce point. Donner une chance aux autres.', 'target']
  });
  function icon(doc, kind) {
    const create = tag => doc.createElementNS ? doc.createElementNS('http://www.w3.org/2000/svg', tag) : doc.createElement(tag);
    const svg = create('svg'), path = create('path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'square'); svg.setAttribute('stroke-linejoin', 'miter');
    svg.classList.add('dw-glyph132'); path.setAttribute('d', GLYPHS[kind] || GLYPHS.dossier); svg.appendChild(path); return svg;
  }
  function install(g, doc) {
    if (!g || !doc?.body || g.presentation132) return false;
    const get = id => doc.getElementById(id), menu = get('mainMenu'), card = menu?.querySelector('.menu-card');
    if (!menu || !card || !card.parentNode) return false;
    const el = (tag, text, cls) => { const n = doc.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.classList.add(...cls.split(' ')); return n; };
    const append = (parent, ...nodes) => { for (const n of nodes) if (n) parent.appendChild(n); return parent; };
    const disclose = (id, label, ...nodes) => { const details = el('details', undefined, 'dw-disclosure132'); details.id = id; append(details, el('summary', label), ...nodes); return details; };
    function adorn(node, kind) {
      if (!node || node.dataset.glyph132) return;
      node.dataset.glyph132 = kind; node.classList.add('dw-icon-action132'); node.prepend(icon(doc, kind));
    }
    doc.body.classList.add('presentation132');
    menu.classList.add('title132');
    const identity = el('section', undefined, 'title-identity132'), brief = el('section', undefined, 'title-brief132');
    brief.setAttribute('aria-labelledby', 'titleBriefHeading132');
    // Move, never clone, the live controls. Their original handlers and save checks remain authoritative.
    const actions = card.querySelector('.menu-actions'), footer = card.querySelector('footer');
    for (const selector of ['.eyebrow', 'h1', '.subtitle', '.pitch', '.menu-status']) append(identity, card.querySelector(selector));
    append(identity, actions);
    const originalPitch = identity.querySelector('.pitch');
    if (originalPitch?.parentNode) originalPitch.textContent = 'Un dépôt. Quelques survivants. La nuit approche. Faites de ce refuge une cité capable de tenir.';
    const dispatch = el('div', undefined, 'title-transmission132');
    append(dispatch, icon(doc, 'radio'), append(el('div'), el('small', 'TRANSMISSION D’OUVERTURE'), el('p', 'D-17 appelle les survivants. Rejoignez le dépôt avant la nuit.')));
    append(identity, dispatch);
    const portrait = el('div', undefined, 'title-portrait132'); portrait.setAttribute('aria-hidden', 'true');
    const stamp = el('span', 'D-17', 'title-stamp132');
    const sceneLabel = el('small'), sceneLine = el('p'), sceneGlyph = el('span', undefined, 'title-scene-glyph132');
    append(portrait, stamp, append(el('div', undefined, 'title-scene-copy132'), sceneLabel, sceneLine), sceneGlyph);
    append(brief, portrait, el('h2', 'DOSSIER DE DÉPART', 'title-brief-heading132')); brief.lastElementChild.id = 'titleBriefHeading132';
    const scenario = card.querySelector('.scenario-picker'), difficulty = card.querySelector('.difficulty-row');
    const facts = get('startScenarioFacts');
    if (scenario?.parentNode && facts?.parentNode) scenario.appendChild(disclose('scenarioSupply132', 'Personnel et ravitaillement initial', facts));
    append(brief, scenario, difficulty);
    const seed = card.querySelector('.seed-controls'), hint = get('seedHint'), saveNote = get('campaignSaveNote');
    if (seed?.parentNode) append(brief, disclose('campaignMap132', 'Carte personnalisée et bilans', seed, hint));
    if (saveNote?.parentNode) append(brief, disclose('campaignStorage132', 'Sauvegarde locale · une campagne active', saveNote));
    append(card, identity, brief, footer);
    const caption = menu.querySelector('.menu-scene-caption'); if (caption?.parentNode) caption.hidden = true;
    for (const [id, kind] of Object.entries({ newGameButton: 'bastion', continueButton: 'resume', howToButton: 'book', menuSettingsButton: 'settings', randomMapSeedButton: 'compass', resumeButton: 'resume', saveButton: 'save', pauseCommandButton: 'bastion', helpPauseButton: 'book', pauseSettingsButton: 'settings', quitButton: 'exit', cityCommandButton: 'bastion', journalCommandButton: 'book', specialistCommandButton: 'people', squadCommandButton: 'people' })) adorn(get(id), kind);
    // Use drawn symbols for icon-only controls: the pause Unicode glyph is missing
    // from some platform fonts. Keep the original buttons and their accessible names.
    for (const [id, kind] of Object.entries({ pauseButton: 'pause', hudSettings14: 'settings' })) {
      const node = get(id); if (!node) continue;
      node.textContent = ''; adorn(node, kind);
    }
    const oldSettings = get('settingsToggle');
    if (oldSettings && get('pauseSettingsButton') && typeof g.showSettings === 'function') oldSettings.hidden = true;
    const pauseCard = get('resumeButton')?.parentNode;
    if (pauseCard) {
      const replay = el('button', 'REVOIR L’INTRODUCTION', 'intro-replay132');
      replay.id = 'replayIntro132'; replay.type = 'button'; replay.disabled = !g.campaignIntro132;
      replay.setAttribute('aria-haspopup', 'dialog'); replay.setAttribute('aria-controls', 'campaignIntro132');
      replay.addEventListener('click', () => { if (!replay.disabled && !replay.closest('[inert]')) g.campaignIntro132?.replay(); });
      pauseCard.insertBefore(replay, get('quitButton')); adorn(replay, 'book');
    }
    const scenarioSelect = get('startScenario'), mapInput = get('mapSeed');
    let lastSeed = mapInput?.value || '';
    mapInput?.addEventListener('invalid', () => { get('campaignMap132').open = true; });
    function refreshScenario() {
      if (mapInput && mapInput.value !== lastSeed) {
        if (g.state === 'menu') get('campaignMap132').open = true;
        lastSeed = mapInput.value;
      }
      const id = Object.hasOwn(SCENES, scenarioSelect?.value) ? scenarioSelect.value : 'classic', [label, line, glyph] = SCENES[id];
      if (portrait.dataset.scenario === id) return;
      portrait.dataset.scenario = id; sceneLabel.textContent = label; sceneLine.textContent = line;
      sceneGlyph.replaceChildren(icon(doc, glyph));
    }
    scenarioSelect?.addEventListener('change', refreshScenario); refreshScenario();
    if (g.scenarioUI?.refresh) {
      const previous = g.scenarioUI, refresh = previous.refresh.bind(previous);
      g.scenarioUI = Object.freeze({ ...previous, refresh: (...args) => { const result = refresh(...args); refreshScenario(); return result; } });
    }
    // Radio IDs are not guaranteed in the HTML. Refresh from the actual radio nodes.
    for (const radio of menu.querySelectorAll('input')) if (radio.name === 'difficulty') radio.addEventListener('change', () => g.scenarioUI?.refresh());
    const records = get('commandTab-records');
    const recordTitle = records?.querySelector('strong');
    if (recordTitle?.parentNode) recordTitle.textContent = 'Campagnes';
    records?.setAttribute('aria-label', 'Campagnes — bilans et records');
    const recordsButton = get('menuRecordsButton');
    if (recordsButton) { recordsButton.textContent = 'BILANS DE CAMPAGNE'; adorn(recordsButton, 'archive'); }
    const fieldCopy = get('commandQuick-field')?.querySelector('small');
    if (fieldCopy?.parentNode) fieldCopy.textContent = 'Matériel, itinéraires et expéditions';
    for (const [id, kind] of Object.entries(NAV)) adorn(get('commandTab-' + id), kind);
    const groupKinds = { defense: 'bastion', exploration: 'route', player: 'pack', world: 'compass', lore: 'book' };
    for (const [id, kind] of Object.entries(groupKinds)) adorn(get('expansionGroup-' + id), kind);
    const fieldNav = get('commandPanel-field')?.querySelector('.field-nav');
    const fieldKinds = { expansions: 'compass', infected: 'target', crew: 'people', sectors: 'bastion', recon: 'route', supplies: 'pack', depth: 'book', world: 'compass' };
    for (const b of fieldNav?.querySelectorAll('button') || []) adorn(b, fieldKinds[b.dataset.fieldView] || 'dossier');
    g.presentation132 = Object.freeze({ refreshScenario, icon: kind => icon(doc, kind), menu: card });
    return true;
  }
  return Object.freeze({ install, icon, GLYPHS, SCENES });
});
