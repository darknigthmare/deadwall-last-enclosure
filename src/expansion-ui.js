(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.DeadwallExpansionUI = api;
    const mount = () => api.install(root.DEADWALL, root.document);
    if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ORDER = ['arsenal134','interventions134','barricades134','defense131','fortification','exploration131','exploration','player131','survival','companions','world131','campaign','lore131'];
  const GROUPS=[{id:'defense',name:'D-17',ids:['defense131','fortification','barricades134']},{id:'exploration',name:'EXPÉDITIONS',ids:['exploration131','exploration']},{id:'player',name:'ÉQUIPEMENT',ids:['arsenal134','player131','survival','companions']},{id:'world',name:'RÉGION',ids:['interventions134','world131','campaign']},{id:'lore',name:'ARCHIVES',ids:['lore131']}];
  const API_NAMES={arsenal134:'arsenal134',interventions134:'interventions134',barricades134:'barricades134',defense131:'defense131',exploration131:'travel131',player131:'playerOps131',world131:'worldOps131',lore131:'chronicles131'};
  const LABELS = { arsenal134:'Armurerie',interventions134:'Interventions',barricades134:'Ouvertures', exploration: 'Exploration', survival: 'Survie', fortification: 'Fortifications', companions: 'Équipe', campaign: 'Missions', defense131:'Préparatifs',exploration131:'Longs trajets',player131:'Commandant',world131:'Relais lointains',lore131:'Chroniques' };
  function install(g, doc) {
    if (!g?.expansions || !doc || g.expansionUI) return false;
    const field = doc.getElementById('commandPanel-field'), modal = g.ui.commandModal;
    const nav = field?.querySelector('.field-nav');
    if (!field || !nav || !modal) return false;
    const el = (tag, text, cls) => {
      const n = doc.createElement(tag);
      if (text !== undefined) n.textContent = text;
      if (cls) n.classList.add(...cls.split(' '));
      return n;
    };
    const add = (parent, ...nodes) => { for (const node of nodes) parent.appendChild(node); return parent; };
    const write = (n, value) => { const text = String(value ?? ''); if (n.textContent !== text) n.textContent = text; };
    const makeButton = (label, id, fn) => {
      const b = el('button', label); b.type = 'button'; b.id = id;
      b.addEventListener('click', () => { if (!b.disabled && !b.closest('[inert]')) fn(); });
      return b;
    };
    const section = el('section', undefined, 'expansion-hub hidden'); section.id = 'field-expansions';
    const tab = makeButton('OPÉRATIONS', 'expansionFieldTab', () => chooseField());
    tab.dataset.fieldView = 'expansions'; tab.setAttribute('aria-controls', section.id); tab.setAttribute('aria-pressed', 'false');
    const head = el('header', undefined, 'expansion-heading');
    const title = el('h2', 'Préparer. Agir. Revenir.'); title.id = 'expansionTitle'; section.setAttribute('aria-labelledby', title.id);
    const location = el('p', '', 'expansion-context');
    add(head, el('small', 'POSTE DE COMMANDEMENT / D-17'), title, location);
    const onboarding = el('div', undefined, 'expansion-onboarding'); onboarding.hidden = true;
    const firstSteps = makeButton('PREMIERS GESTES', 'expansionFirstSteps', () => open('lore131'));
    const firstStepsHint = el('span', 'Récolter, déposer, bâtir · guide facultatif.'); firstStepsHint.id = 'expansionFirstStepsHint'; firstSteps.setAttribute('aria-describedby', firstStepsHint.id);
    add(onboarding, firstSteps, firstStepsHint); head.appendChild(onboarding);
    const groups=el('nav',undefined,'expansion-groups');groups.setAttribute('aria-label','Domaines d’opérations');
    const groupNodes=new Map();for(const group of GROUPS){const b=makeButton(group.name,'expansionGroup-'+group.id,()=>{const candidate=group.ids.find(id=>entries().some(d=>d.id===id));if(candidate)select(candidate,true);});groups.appendChild(b);groupNodes.set(group.id,b);}
    const subnav = el('nav', undefined, 'expansion-tabs'); subnav.setAttribute('aria-label', 'Familles d’opérations'); subnav.setAttribute('role', 'tablist');
    const detail = el('section', undefined, 'expansion-detail'); detail.id = 'expansionDetail'; detail.setAttribute('role', 'tabpanel');
    const packTitle = el('h3'), summary = el('p', '', 'expansion-summary'), metrics = el('dl', undefined, 'expansion-metrics');
    const actionHeading = el('h4', 'Sur place'), actions = el('div', undefined, 'expansion-actions');
    const resourceMeta = globalThis.DeadwallCore?.RESOURCE_META || {};
    const costKey = el('p', 'Coûts : ' + Object.values(resourceMeta).map(r => r.short + ' ' + r.label.toLowerCase()).join(' · '), 'expansion-cost-key');
    costKey.hidden = !Object.keys(resourceMeta).length;
    const notice = el('p', '', 'expansion-notice'); notice.id = 'expansionNotice'; notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite'); notice.setAttribute('aria-atomic', 'true');
    add(detail, packTitle, summary, metrics, actionHeading, costKey, actions);
    const tools = el('div', undefined, 'expansion-links');
    const teamLink = makeButton('AFFECTER L’ÉQUIPE', 'expansionTeam', () => g.worldEvolutionUI?.open('people')); teamLink.hidden = true;
    const lightLink = makeButton('ÉCLAIRAGE · RETOUR AU TERRAIN', 'expansionLighting', () => openLighting());
    const suppliesLink = makeButton('CARTE & SERVICES ESSENTIELS', 'expansionEssentials', () => g.essentialUI?.open());
    add(tools, teamLink, lightLink, suppliesLink, makeButton('REPRENDRE', 'expansionResume', () => close()));
    const help=el('details',undefined,'expansion-help');add(help,el('summary','Préparer une intervention'),el('p','Choisissez un ordre en pause. Une intervention chronométrée reprend sur le terrain ; rejoignez le lieu indiqué avec les fournitures nécessaires.'));
    add(section, head, groups, subnav, detail, notice, tools,help);
    const hideHub = () => { section.classList.add('hidden'); tab.setAttribute('aria-pressed', 'false'); };
    const oldButtons = [...nav.querySelectorAll('button')];
    for (const b of oldButtons) b.addEventListener('click', hideHub);
    // Early dossiers captured their sibling list before this section existed.
    // Their direct HUD/API shortcuts must also leave the new section.
    for (const name of ['worldCodex', 'fieldOperations']) if (g[name]?.open) {
      const api = g[name], previous = api.open.bind(api);
      g[name] = Object.freeze({ ...api, open: (...args) => { hideHub(); return previous(...args); } });
    }
    for (const id of ['specialistCommandButton', 'fieldOperationsButton']) doc.getElementById(id)?.addEventListener('click', hideHub);
    nav.prepend(tab); field.appendChild(section);
    nav.classList.add('expansion-field-nav');
    let current = 'exploration', last = -Infinity, tabKey = '', actionKey = '', rowKey = '', returnFocus = null;
    let descriptors = [], rowNodes = [], actionNodes = new Map(), tabNodes = new Map();
    const now = () => globalThis.performance?.now?.() ?? Date.now();
    function entries() {
      const value = g.expansions.entries();
      return [...value].filter(d => d && typeof d.id === 'string').sort((a, b) => {
        const ai = ORDER.indexOf(a.id), bi = ORDER.indexOf(b.id);
        return (ai < 0 ? ORDER.length : ai) - (bi < 0 ? ORDER.length : bi);
      });
    }
    function isOpen() { return !modal.classList.contains('hidden') && !field.classList.contains('hidden') && !section.classList.contains('hidden'); }
    function canAct() { return !!g.expansions.canAct() && !g.player?.dead && g.player?.health > 0; }
    function chooseField() {
      for (const n of field.children) if (n.tagName === 'SECTION') n.classList.toggle('hidden', n !== section);
      for (const b of nav.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b === tab));
      refresh(true);
    }
    function open(id) {
      if (!isOpen()) returnFocus = tray?.contains(doc.activeElement) ? doc.activeElement : null;
      g.showCommand?.(true, 'field');
      if (modal.classList.contains('hidden') || g.activeOverlay !== modal) return false;
      for (const drawer of drawers) drawer.open = false;
      if (id && entries().some(d => d.id === id)) current = id;
      chooseField(); tabNodes.get(current)?.focus({ preventScroll: true });
      return true;
    }
    function close() {
      if (!isOpen()) return false; g.showCommand?.(false);
      return true;
    }
    function restoreTrayFocus() {
      if (!returnFocus || !modal.classList.contains('hidden')) return;
      const target = returnFocus; returnFocus = null;
      // The regional dock is outside the historical HUD focus boundary.
      // Run after every command close, including Escape and the shared close button.
      if (g.state === 'playing' && !g.gameOver && !g.activeOverlay && !g.paused && !target.disabled &&
          doc.body.contains(target) && !target.closest('[inert], .hidden') && target.getClientRects().length) target.focus({ preventScroll: true });
    }
    function select(id, focus = false) {
      if (!entries().some(d => d.id === id)) return false;
      if (id !== current) { current = id; actionKey = rowKey = ''; write(notice, ''); }
      refresh(true); if (focus) tabNodes.get(current)?.focus({ preventScroll: true }); return true;
    }
    function chooseByKey(event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.code)) return;
      event.preventDefault(); event.stopPropagation();
      const ids = [...tabNodes.keys()], i = ids.indexOf(current);
      const id = event.code === 'Home' ? ids[0] : event.code === 'End' ? ids.at(-1) : ids[(i + (event.code === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length];
      if (id) select(id, true);
    }
    function rebuildTabs() {
      const group=GROUPS.find(group=>group.ids.includes(current)),visible=descriptors.filter(d=>!group||group.ids.includes(d.id));
      for(const item of GROUPS){const b=groupNodes.get(item.id);b.hidden=!descriptors.some(d=>item.ids.includes(d.id));b.setAttribute('aria-pressed',String(item===group));}
      section.dataset.domain=group?.id||'exploration';
      const key = visible.map(d => d.id + ':' + d.title).join('|'); if (key === tabKey) return;
      tabKey = key; subnav.replaceChildren(); tabNodes = new Map();
      for (const d of visible) {
        const b = makeButton(LABELS[d.id] || d.title, 'expansionTab-' + d.id, () => select(d.id));
        b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', detail.id); b.addEventListener('keydown', chooseByKey);
        subnav.appendChild(b); tabNodes.set(d.id, b);
      }
    }
    function paintRows(rows) {
      const key = JSON.stringify(rows.map(r => r.label));
      if (rowKey !== key) {
        rowKey = key; metrics.replaceChildren(); rowNodes = [];
        for (const row of rows) { const group = el('div'), label = el('dt', row.label), value = el('dd'); add(group, label, value); metrics.appendChild(group); rowNodes.push(value); }
      }
      for (let i = 0; i < rows.length; i++) write(rowNodes[i], rows[i].value);
      metrics.hidden = !rows.length;
    }
    function invoke(id) {
      if (!isOpen() || !canAct()) { write(notice, 'Cet ordre nécessite une campagne active et un commandant debout.'); refresh(true); return; }
      const d = entries().find(item => item.id === current), action = d?.actions().find(item => item.id === id);
      if (!action || action.disabled || typeof action.run !== 'function') { write(notice, action?.reason || 'Cette action n’est plus disponible ici.'); refresh(true); return; }
      const result = action.run(), ok = result === true || result?.ok === true;
      write(notice, result?.message || result?.reason || (ok ? 'Ordre transmis. ' + action.label : 'L’action n’a pas été engagée. Vérifiez les conditions sur place.'));
      refresh(true);
      if (ok && action.close) close();
    }
    function paintActions(items) {
      const unique = [], ids = new Set();
      for (const item of items) if (item && typeof item.id === 'string' && !ids.has(item.id)) { ids.add(item.id); unique.push(item); }
      const key = current + ':' + unique.map(a => a.id).join('|');
      if (key !== actionKey) {
        const focused = actions.contains(doc.activeElement) ? doc.activeElement.id : null;
        const scrollHost = section.closest('.command-body'), scroll = scrollHost?.scrollTop;
        actionKey = key; actions.replaceChildren(); actionNodes = new Map();
        for (const action of unique) {
          const card = el('article', undefined, 'expansion-action'), button = makeButton(action.label, 'expansionAction-' + current + '-' + action.id, () => invoke(action.id));
          const description = el('p'), reason = el('p', '', 'expansion-reason'); description.id = button.id + '-description'; reason.id = button.id + '-reason'; button.setAttribute('aria-describedby', reason.id);
          add(card, button, description, reason); actions.appendChild(card); actionNodes.set(action.id, { card, button, description, reason });
        }
        if (!unique.length) actions.appendChild(el('p', 'Aucune intervention disponible dans cette situation.', 'expansion-empty'));
        if (focused) (Array.from(actionNodes.values()).find(n => n.button.id === focused)?.button || tabNodes.get(current))?.focus({ preventScroll: true });
        if (scrollHost && scroll !== undefined) scrollHost.scrollTop = scroll;
      }
      for (const action of unique) {
        const n = actionNodes.get(action.id), allowed = canAct(), disabled = !allowed || !!action.disabled;
        const losesFocus = disabled && doc.activeElement === n.button;
        write(n.button, action.label); n.button.disabled = disabled;
        write(n.description, action.description || action.detail || ''); n.description.hidden = !n.description.textContent;
        n.button.setAttribute('aria-describedby', action.describeDetails ? n.description.id + ' ' + n.reason.id : n.reason.id);
        write(n.reason, !allowed ? 'Lancez ou reprenez une campagne avec un commandant debout.' : action.reason || (disabled ? 'Action indisponible dans cette situation.' : action.close ? 'Démarre sur le terrain et ferme le commandement.' : 'Ordre appliqué pendant la préparation.'));
        n.card.dataset.available = String(!disabled);
        if (losesFocus) tabNodes.get(current)?.focus({ preventScroll: true });
      }
    }
    function refresh(force = false) {
      refreshTray();
      if (!isOpen()) return;
      if (!force && now() - last < 250) return; last = now();
      descriptors = entries(); if (!descriptors.some(d => d.id === current)) current = descriptors[0]?.id || '';
      rebuildTabs();
      for (const [id, b] of tabNodes) { b.setAttribute('aria-selected', String(id === current)); b.tabIndex = id === current ? 0 : -1; }
      detail.setAttribute('aria-labelledby', 'expansionTab-' + current);
      const d = descriptors.find(item => item.id === current), data = d?.overview?.() || {};
      write(packTitle, d?.title || 'Aucune opération'); write(summary, data.summary || 'Les opérations seront visibles au chargement des modules.');
      write(location, (g.frontier?.active?.() ? 'RÉGION' : 'D-17') + ' · VAGUE ' + (g.wave || 0) + ' · TEMPS SUSPENDU');
      onboarding.hidden = g.chronicles131?.snapshot().prologue.status !== 'available';
      paintRows(Array.isArray(data.rows) ? data.rows : []); paintActions(d?.actions?.() || []);
      const pauseBehind = !g.ui.pauseMenu.classList.contains('hidden');
      lightLink.disabled = !g.nightGear || g.state !== 'playing' || g.gameOver || pauseBehind;
      lightLink.title = pauseBehind ? 'Reprenez la partie pour manipuler les lampes sur le terrain.' : 'Le tiroir d’éclairage s’ouvre sur le terrain, où le temps avance.';
      write(lightLink, pauseBehind ? 'ÉCLAIRAGE · REPRENEZ LA PARTIE' : 'ÉCLAIRAGE · RETOUR AU TERRAIN');
      suppliesLink.disabled = !g.essentialUI;
      teamLink.hidden = current !== 'companions'; teamLink.disabled = !g.worldEvolutionUI;
    }
    function openLighting() {
      const panel = doc.getElementById('nightGearQuick');
      if (!g.nightGear || !panel || g.state !== 'playing' || g.gameOver) return false;
      close();
      if (g.activeOverlay || g.paused) return false;
      panel.inert = false; panel.open = true; g.releaseInputs?.();
      panel.querySelector('summary')?.focus({ preventScroll: true }); return true;
    }

    // Existing drawers keep their controls and simulation hooks; only their shared dock changes.
    const tray = el('div', undefined, 'field-utility-tray hidden'); tray.id = 'fieldUtilityTray'; tray.setAttribute('aria-label', 'Matériel et opérations');
    const work = el('div', undefined, 'expansion-work hidden'), workLabel = el('span'), progress = el('progress');
    let workingId = '';
    work.id = 'expansionWork'; progress.max = 1; progress.setAttribute('aria-label', 'Avancement de l’intervention');
    add(work, workLabel, progress, makeButton('VOIR / INTERROMPRE', 'expansionWorkOpen', () => open(workingId))); tray.appendChild(work);
    const openButton = makeButton('OPÉRATIONS', 'fieldOperations', () => open()); openButton.setAttribute('aria-haspopup', 'dialog'); openButton.setAttribute('aria-controls', 'commandModal');
    tray.appendChild(openButton);
    const drawers = ['essentialQuick', 'nightGearQuick'].map(id => doc.getElementById(id)).filter(n => n?.tagName === 'DETAILS');
    for (const drawer of drawers) {
      tray.appendChild(drawer);
      drawer.addEventListener('toggle', () => { if (drawer.open) { for (const other of drawers) if (other !== drawer) other.open = false; g.releaseInputs?.(); } });
    }
    g.ui.hud.appendChild(tray);
    function refreshWork() {
      const id = ORDER.find(id => (g[API_NAMES[id]] || g[id + 'Pack'] || (id === 'fortification' ? g.defensePack : null))?.busy?.());
      work.classList.toggle('hidden', !id); workingId = id || ''; if (!id) return;
      const api = g[API_NAMES[id]] || g[id + 'Pack'] || g.defensePack;
      let fraction = null, label = LABELS[id];
      if (id === 'companions') {
        const task = api.snapshot().training, rules = globalThis.DeadwallCore?.CompanionPackRules;
        const duration = task?.exercise ? rules?.exercises?.[task.exercise]?.seconds : rules?.training?.seconds;
        if (task && duration > 0) fraction = 1 - task.left / duration;
        label = 'Entraînement de l’équipe';
      } else if (id === 'fortification') {
        const job = api.job;
        if (job?.kind === 'supply' || job?.kind === 'mechanism') {
          const rules = globalThis.DeadwallCore?.FortificationPackRules;
          label = (job.kind === 'mechanism' ? rules?.mechanisms?.[job.slot] : rules?.fieldSupply?.[job.slot])?.name || 'Préparation de défense';
          fraction = job.seconds > 0 ? job.elapsed / job.seconds : null;
        } else label = job?.kind === 'repair' ? 'Réparation manuelle' : 'Tri des débris';
      }
      else {
        const task = id === 'survival' && typeof api.activity === 'function' ? api.activity() : api.overview().task; fraction = task?.progress ?? null;
        label = API_NAMES[id] ? LABELS[id] : id === 'survival' ? (globalThis.DeadwallCore?.SurvivalPackRules?.[task?.kind]?.name || 'Préparation de terrain') : id === 'campaign' ? 'Intervention de campagne' : ({ survey: 'Relevé du gisement', cache: 'Cache de ravitaillement', marker: 'Piquet de retour', extract: 'Extraction du ballot', deliver: 'Dépôt du ballot', recover: 'Récupération du ballot' }[task?.kind] || 'Intervention de terrain');
      }
      const paused = g.paused || !!g.activeOverlay;
      write(workLabel, label + (paused ? ' · EN PAUSE' : Number.isFinite(fraction) ? ' · ' + Math.floor(fraction * 100) + ' %' : ' · EN COURS'));
      progress.hidden = !Number.isFinite(fraction);
      if (Number.isFinite(fraction)) progress.value = Math.max(0, Math.min(1, fraction));
    }
    function refreshTray() {
      const playing = g.state === 'playing' && !g.gameOver;
      tray.classList.toggle('hidden', !playing); tray.inert = Boolean(g.activeOverlay) || g.paused;
      if (!playing) for (const drawer of drawers) drawer.open = false;
      const dock = doc.getElementById('fieldDock');
      const unified = doc.getElementById('hud135UtilityHost');
      const parent = unified?.classList.contains('hud135-utility-host') ? unified : g.frontier?.active?.() && dock?.classList.contains('field-dock') ? dock : g.ui.hud;
      if (tray.parentNode !== parent) parent.appendChild(tray);
      if (playing) refreshWork();
    }
    const oldUpdate = g.updateUI.bind(g); g.updateUI = (...args) => { const r = oldUpdate(...args); refresh(); return r; };
    const oldFocus = g.syncOverlayFocus.bind(g); g.syncOverlayFocus = (...args) => { const r = oldFocus(...args); refreshTray(); restoreTrayFocus(); return r; };
    g.expansionUI = Object.freeze({ open, close, isOpen, refresh, select, section, tray });
    refreshTray(); return true;
  }
  return Object.freeze({ install });
});
