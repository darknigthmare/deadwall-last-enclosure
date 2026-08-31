(function initBattlefieldUI() {
  'use strict';
  const game = globalThis.DEADWALL, B = globalThis.DeadwallBattlefield, C = globalThis.DeadwallCore;
  if (!game || !B) return;
  const get = id => document.getElementById(id), cards = new Map();
  const panel = get('battlefieldSectors'), alert = get('innerRingAlert');
  if (!panel || !alert) return;
  let lastWorld = null, sampledAt = -Infinity, alarmAt = -Infinity, lastAlert = '', lastCritical = false;
  const element = (tag, text, className) => {
    const node = document.createElement(tag); if (text !== undefined) node.textContent = text;
    if (className) node.className = className; return node;
  };
  for (const direction of B.DIRECTIONS) {
    const card = element('article', undefined, 'battlefield-sector'), title = element('h4', direction.label);
    const contacts = element('strong'), inner = element('p'), walls = element('small');
    for (const node of [title, contacts, inner, walls]) card.appendChild(node);
    panel.appendChild(card); cards.set(direction.id, { card, contacts, inner, walls });
  }
  function refresh(force = false) {
    if (game.world !== lastWorld) {
      lastWorld = game.world; sampledAt = -Infinity; alarmAt = -Infinity; lastCritical = false; lastAlert = '';
    }
    if (game.state !== 'playing' || game.gameOver) { alert.classList.add('hidden'); return; }
    if (!force && game.elapsed - sampledAt < C.BATTLEFIELD_RULES.refreshSeconds) return;
    sampledAt = game.elapsed;
    const snapshot = B.inspect(game.core(), game.zombies, game.world.buildings.values());
    for (const sector of snapshot.sectors) {
      const view = cards.get(sector.id);
      view.contacts.textContent = sector.contacts + ' contacts actifs';
      view.inner.textContent = sector.innerContacts ? sector.innerContacts + ' près du centre' : 'Aucun contact près du centre';
      view.walls.textContent = sector.fragileWalls + ' remparts fragiles / ' + sector.walls;
      view.card.dataset.alert = String(sector.innerContacts > 0);
    }
    const active = snapshot.sectors.filter(sector => sector.innerContacts).map(sector => sector.label);
    const text = active.length ? 'CONTACTS PROCHES DU CENTRE · ' + active.join(' / ') : '';
    alert.classList.toggle('hidden', !text);
    if (text !== lastAlert) { alert.textContent = text; lastAlert = text; }
    if (text && !lastCritical && !game.paused && game.elapsed - alarmAt >= C.BATTLEFIELD_RULES.alarmCooldownSeconds) {
      // One restrained signal on entry; no looping alarm, RNG use or flashing.
      game.audio.tone(520, .18, 'triangle', .055, -120); alarmAt = game.elapsed;
    }
    lastCritical = Boolean(text);
  }
  function refreshDefeat() {
    const summary = B.debrief(game.stats, game.resources), grid = get('debriefMetrics'), lessons = get('debriefLessons');
    if (!grid || !lessons) return;
    grid.replaceChildren(); lessons.replaceChildren();
    for (const metric of summary.values) {
      const card = element('div', undefined, 'debrief-metric');
      card.appendChild(element('strong', C.formatNumber(metric.value))); card.appendChild(element('span', metric.label)); grid.appendChild(card);
    }
    for (const lesson of summary.lessons) lessons.appendChild(element('li', lesson));
    const scenario = globalThis.DeadwallScenarios?.get(game.scenarioId || 'classic');
    get('debriefCampaign').textContent = (scenario?.name || 'Départ classique') + ' · ' + game.difficulty.label + ' · CARTE ' + game.world.seed;
    get('debriefDuration').textContent = C.formatTime(game.stats.playSeconds) + ' de résistance · centre de commandement détruit';
  }
  game.battlefieldUI = Object.freeze({ refresh, refreshDefeat });
  refresh();
})();
