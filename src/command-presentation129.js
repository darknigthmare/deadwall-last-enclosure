(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.DeadwallCommandPresentation = api;
    const mount = () => api.install(root.DEADWALL, root.document);
    if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NAV = [
    ['enclosure', 'Situation', 'La cité et ses défenses', 'core'],
    ['workers', 'Personnel', 'Ouvriers et sections', 'barracks'],
    ['research', 'Doctrines', 'Développer les savoirs', 'workshop'],
    ['records', 'Archives', 'Campagnes et records', 'warehouse'],
    ['field', 'Opérations', 'Terrain, matériel et atlas', 'watchtower'],
    ['journal', 'Journal', 'Les traces de D-17', 'house']
  ];
  const DOCTRINE_ART = { logistics: 'warehouse', fortification: 'watchtower', ballistics: 'turret', sanitation: 'clinic', grid: 'generator', recon: 'barracks' };
  const ORDER_ART = { auto: 'core', harvest: 'lumber', build: 'workshop', clear: 'clinic', retreat: 'house' };
  const number = n => Math.max(0, Math.floor(Number(n) || 0));
  function status(g) {
    const core = g.core?.(), health = core?.maxHealth > 0 ? Math.max(0, Math.min(1, core.health / core.maxHealth)) : 0;
    const supply = (g.powerGenerated || 0) + (g.powerBatteryOutput || 0);
    return {
      health, population: number(g.population), housing: number(g.housing), power: Math.floor(supply), demand: Math.ceil(g.powerUsed || 0),
      morale: number(g.morale), seed: g.world?.seed ?? '', tier: g.tier?.name || 'Refuge',
      phase: ({ calm: 'Préparation', warning: 'Alerte', assault: 'Assaut', aftermath: 'Sécurisation' })[g.phase] || 'En opération',
      seconds: number(g.phaseTime), wave: number(g.wave),
      warning: health <= .3 ? 'Centre gravement endommagé' : g.resources?.food <= .01 ? 'Réserve de nourriture épuisée' : g.resources?.ammo <= .01 ? 'Réserve de munitions épuisée' : supply < g.powerUsed ? 'Réseau électrique insuffisant' : 'Aucune pénurie immédiate',
      danger: health <= .3 || g.resources?.food <= .01 || g.resources?.ammo <= .01 || supply < g.powerUsed
    };
  }
  function drawIllustration(g, canvas, kind) {
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    if (!ctx) return false;
    ctx.clearRect(0, 0, w, h);
    const rect = g.art?.rects?.['buildings:' + kind] || globalThis.DeadwallArt?.BUILDINGS?.[kind];
    if (!rect || !g.art?.blit) return false;
    const scale = Math.min((w - 12) / rect[2], (h - 12) / rect[3]);
    return g.art.blit(ctx, 'buildings', rect, (w - rect[2] * scale) / 2, (h - rect[3] * scale) / 2, rect[2] * scale, rect[3] * scale);
  }
  function install(g, doc) {
    if (!g?.commandUI || !doc || g.commandPresentation) return false;
    const modal = doc.getElementById('commandModal'), post = modal?.querySelector('.command-post');
    const enclosure = doc.getElementById('commandPanel-enclosure');
    if (!post || !enclosure) return false;
    const el = (tag, text, cls) => {
      const n = doc.createElement(tag);
      if (text !== undefined) n.textContent = text;
      const tokens = cls?.match(/\S+/g);
      if (tokens) n.classList.add(...tokens);
      return n;
    };
    const add = (parent, ...nodes) => { for (const n of nodes) if (n) parent.appendChild(n); return parent; };
    const write = (node, value) => { const text = String(value ?? ''); if (node.textContent !== text) node.textContent = text; };
    const button = (text, id, fn) => { const n = el('button', text); n.id = id; n.type = 'button'; n.addEventListener('click', () => { if (!n.disabled && !n.closest('[inert]')) fn(); }); return n; };
    const illustrations = [], art = (kind, cls = '') => { const canvas = el('canvas', undefined, 'command-art129 ' + cls); canvas.width = 192; canvas.height = 132; canvas.setAttribute('aria-hidden', 'true'); illustrations.push({ canvas, kind }); return canvas; };
    modal.classList.add('command129');
    for (const [id, title, subtitle, kind] of NAV) {
      const tab = doc.getElementById('commandTab-' + id), copy = el('span', undefined, 'command-nav-copy129');
      add(copy, el('strong', title), el('small', subtitle)); tab.replaceChildren(art(kind), copy);
      tab.setAttribute('aria-label', title + ' — ' + subtitle);
    }
    write(doc.getElementById('commandTitle'), 'D-17 / COMMANDER');
    const heading = post.querySelector('.command-heading'), ribbon = el('div', undefined, 'command-ribbon129');
    const phase = el('strong'), tier = el('span'), clock = el('span', 'TEMPS SUSPENDU');
    add(ribbon, phase, tier, clock); heading.appendChild(ribbon);
    const dashboard = el('section', undefined, 'command-dashboard129'); dashboard.id = 'commandDashboard129'; dashboard.setAttribute('aria-label', 'Situation de la campagne');
    const mapFigure = el('figure', undefined, 'command-map129'), mapCanvas = el('canvas'), mapCaption = el('figcaption');
    mapCanvas.id = 'commandMap129'; mapCanvas.width = 640; mapCanvas.height = 640; mapCanvas.setAttribute('role', 'img');
    add(mapFigure, mapCanvas, mapCaption);
    const summary = el('section', undefined, 'command-city129'), crest = el('div', undefined, 'command-city-crest129');
    const cityName = el('h3', 'Dépôt D-17'), stateLabel = el('p', '', 'command-city-state129'), cityMeter = el('progress'); cityMeter.max = 1; cityMeter.setAttribute('aria-label', 'Intégrité du centre de commandement');
    add(crest, art('core'), add(el('div'), el('small', 'CENTRE DE COMMANDEMENT'), cityName, stateLabel));
    const metrics = el('dl', undefined, 'command-vitals129'), values = {};
    for (const [id, label] of [['people', 'Population'], ['power', 'Énergie'], ['morale', 'Moral'], ['integrity', 'Intégrité']]) { const value = el('dd'); values[id] = value; add(metrics, add(el('div'), el('dt', label), value)); }
    const warning = el('p', '', 'command-warning129'); warning.setAttribute('role', 'status');
    const stock = el('div', undefined, 'command-stock129'), stockValues = new Map();
    for (const [id, meta] of Object.entries(globalThis.DeadwallCore.RESOURCE_META)) { const amount = el('strong'), row = add(el('div'), el('span', meta.label), amount); stock.appendChild(row); stockValues.set(id, amount); }
    add(summary, crest, cityMeter, metrics, warning, el('h4', 'Réserves de la cité'), stock);
    add(dashboard, mapFigure, summary);
    const links = el('div', undefined, 'command-missions129');
    for (const [id, title, detail, kind, run] of [
      ['defense', 'Tenir la ligne', 'Portes, fronts et intégrité', 'watchtower', () => { defenses.open = true; defenses.querySelector('summary').focus({ preventScroll: true }); defenses.scrollIntoView?.({ block: 'nearest' }); }],
      ['field', 'Préparer une sortie', 'Cinq dossiers d’opérations', 'warehouse', () => g.expansionUI ? g.expansionUI.open() : g.showCommand(true, 'field')],
      ['crew', 'Donner les ordres', 'Ouvriers et sections de fusiliers', 'barracks', () => g.showCommand(true, 'workers')]
    ]) { const b = button('', 'commandQuick-' + id, run), copy = el('span'); b.classList.add('command-mission129'); add(copy, el('strong', title), el('small', detail)); add(b, art(kind), copy, el('span', '›', 'command-chevron129')); links.appendChild(b); }
    const crisis = doc.getElementById('commandCrisisCard');
    const defenses = el('details', undefined, 'command-defense129'); defenses.id = 'commandDefense129';
    const defenseSummary = el('summary', 'Ligne de défense · Portes et situation par front'); defenses.appendChild(defenseSummary);
    // Move existing controls with their listeners; their IDs, costs and authorization stay intact.
    for (const node of [...enclosure.children]) if (node !== crisis) defenses.appendChild(node);
    enclosure.replaceChildren(); add(enclosure, crisis, dashboard, links, defenses);
    const instructional = [];
    for (const id of ['workers', 'research', 'records']) {
      const panel = doc.getElementById('commandPanel-' + id);
      for (const node of [...panel.children]) if (node.tagName === 'P' && node.classList.contains('command-note') && !node.id) instructional.push([panel, node]);
    }
    for (const [panel, node] of instructional) { const details = el('details', undefined, 'command-help129'); add(details, el('summary', panel.id.endsWith('workers') ? 'Comment ces ordres sont appliqués' : panel.id.endsWith('research') ? 'Débloquer et financer une doctrine' : 'À propos de ces archives'), node); panel.appendChild(details); }
    for (const card of doc.getElementById('workerOrders').children) { if (ORDER_ART[card.dataset.workerOrder]) card.prepend(art(ORDER_ART[card.dataset.workerOrder])); }
    for (const card of doc.getElementById('researchLibrary').children) { if (DOCTRINE_ART[card.dataset.researchId]) card.prepend(art(DOCTRINE_ART[card.dataset.researchId])); }
    const footer = el('div', undefined, 'command-footer129');
    const footerSeed = el('span'), resume = button('RETOUR AU TERRAIN', 'commandReturn129', () => g.showCommand(false));
    add(footer, footerSeed, resume); post.appendChild(footer);
    let last = -Infinity, artReady = false;
    const now = () => globalThis.performance?.now?.() ?? Date.now();
    function refresh(force = false) {
      if (modal.classList.contains('hidden')) return;
      if (!force && now() - last < 400) return; last = now();
      const data = status(g), playing = g.state === 'playing' && !g.gameOver;
      write(phase, playing ? data.phase.toUpperCase() + ' / VAGUE ' + data.wave : 'ARCHIVES DE CAMPAGNE');
      write(tier, playing ? data.tier : 'D-17');
      write(clock, playing ? 'TEMPS SUSPENDU' : 'CONSULTATION');
      write(footerSeed, playing ? 'CARTE ' + data.seed + ' · ' + (g.difficulty?.label || '') : 'Archives conservées sur cet appareil');
      write(resume, g.ui.pauseMenu && !g.ui.pauseMenu.classList.contains('hidden') ? 'RETOUR À LA PAUSE' : playing ? 'RETOUR AU TERRAIN' : 'RETOUR AU MENU');
      if (!artReady) artReady = illustrations.map(({ canvas, kind }) => drawIllustration(g, canvas, kind)).every(Boolean);
      if (!playing || enclosure.classList.contains('hidden')) return;
      write(cityName, data.tier + ' / D-17'); write(stateLabel, 'Vague ' + data.wave + ' · ' + data.phase.toLowerCase()); cityMeter.value = data.health;
      write(values.people, data.population + ' / ' + data.housing); write(values.power, data.power + ' / ' + data.demand); write(values.morale, data.morale + ' %'); write(values.integrity, Math.round(data.health * 100) + ' %');
      write(warning, data.warning); warning.dataset.danger = String(data.danger);
      for (const [id, node] of stockValues) write(node, number(g.resources?.[id]).toLocaleString('fr-FR'));
      const regional = !!g.frontier?.active?.();
      const domain = regional ? 'D-17 · Commandant en région' : 'D-17';
      write(mapCaption, domain + ' · Carte ' + data.seed + ' · Contacts actuellement observés'); mapCanvas.setAttribute('aria-label', domain + ', carte ' + data.seed + '. Bâtiments, ressources et contacts actuellement observés par le joueur, les alliés ou les postes en activité.');
      const ctx = mapCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
        if (g.exploration125?.renderMap) {
          g.exploration125.renderMap(ctx, mapCanvas.width, mapCanvas.height);
          const scale = mapCanvas.width / globalThis.DeadwallCore.WORLD_SIZE;
          ctx.fillStyle = '#aa3934';
          const vision = g.visibility?.frame?.();
          for (const z of g.zombies || []) if (vision?.canSeeLocal(z)) ctx.fillRect(z.x * scale - 1.5, z.y * scale - 1.5, 3, 3);
          ctx.fillStyle = '#28724f';
          for (const u of g.units || []) if (!u.dead) ctx.fillRect(u.x * scale - 1.5, u.y * scale - 1.5, 3, 3);
        }
        else {
          // Minimal local fallback if the map module has not loaded. Never substitute a regional map.
          ctx.fillStyle = '#162119'; ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
          const scale = mapCanvas.width / globalThis.DeadwallCore.WORLD_SIZE;
          for (const b of g.world.buildings.values()) if (!b.dead) { ctx.fillStyle = b.type === 'core' ? '#dcca88' : '#7c9277'; ctx.fillRect(b.left * scale, b.top * scale, Math.max(2,b.w * 32 * scale), Math.max(2,b.h * 32 * scale)); }
          if (!regional) { ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.arc(g.player.x * scale, g.player.y * scale, 4, 0, Math.PI * 2); ctx.fill(); }
        }
      }
      write(defenseSummary, 'Ligne de défense · ' + doc.getElementById('perimeterResult').textContent.toLowerCase() + ' · Portes et fronts');
    }
    g.commandPresentation = Object.freeze({ refresh, dashboard, map: mapCanvas, defenses, status: () => status(g) });
    const previousUpdate = g.updateUI.bind(g); g.updateUI = (...args) => { const value = previousUpdate(...args); refresh(); return value; };
    g.art?.ready?.then?.(() => { artReady = false; refresh(true); });
    refresh(true); return true;
  }
  return Object.freeze({ install, status, drawIllustration });
});
