(function initScenarioMenu(global) {
  'use strict';
  const game = global.DEADWALL, C = global.DeadwallCore, S = global.DeadwallScenarios;
  if (!game || !C || !S) return;
  const select = document.getElementById('startScenario');
  const description = document.getElementById('startScenarioDescription');
  const facts = document.getElementById('startScenarioFacts');
  if (!select || !description || !facts) return;
  const previous = select.value;
  select.replaceChildren();
  for (const scenario of S.list()) {
    const option = document.createElement('option');
    option.value = scenario.id; option.textContent = scenario.name;
    select.appendChild(option);
  }
  select.value = S.list().some(scenario => scenario.id === previous) ? previous : S.DEFAULT_ID;
  select.setAttribute('aria-describedby', 'startScenarioDescription startScenarioFacts');

  const seedInput = document.getElementById('mapSeed'), seedHint = document.getElementById('seedHint');
  function refreshSeed() {
    if (!seedHint) return;
    let chosen;
    try { chosen = global.DeadwallProfile.normalizeSeed(seedInput?.value || ''); } catch { chosen = 'invalid'; }
    const next = chosen === 'invalid' ? 'Entrez un entier de 0 à 4 294 967 295, ou effacez le champ.' :
      chosen !== null ? 'Prochain départ : carte ' + chosen + '. Cette graine est conservée tant que le champ reste rempli.' :
      game.previewMapSeed135 != null ? 'Prochain départ : carte ' + game.previewMapSeed135 + ' préparée par l’aperçu. Le départ suivant sera aléatoire.' :
      'Prochain départ : nouvelle carte aléatoire.';
    seedHint.textContent = next + ' Une même graine reproduit le terrain, les biomes et la position de D-17 dans cette version du générateur.' +
      (game.runId && game.world ? ' Campagne active : carte ' + game.world.seed + '.' : '');
  }
  seedInput?.addEventListener('input', () => { game.previewMapSeed135 = null; seedInput.setCustomValidity?.(''); refreshSeed(); });
  const seedControls = seedInput?.closest?.('.seed-controls');
  if (seedControls) {
    const random = document.createElement('button'); random.id = 'randomEachCampaign135'; random.type = 'button';
    random.textContent = 'ALÉATOIRE À CHAQUE DÉPART'; random.setAttribute('aria-describedby', 'seedHint');
    random.addEventListener('click', () => { seedInput.value = ''; seedInput.setCustomValidity?.(''); game.previewMapSeed135 = null; refreshSeed(); });
    seedControls.appendChild(random);
  }
  for (const name of ['startNew', 'restoreSave', 'returnToMenu']) {
    const prior = game[name]?.bind(game); if (!prior) continue;
    game[name] = (...args) => { const result = prior(...args); if (name === 'restoreSave' && result !== false) game.previewMapSeed135 = null; refreshSeed(); return result; };
  }

  function refresh() {
    refreshSeed();
    let definition;
    try { definition = S.get(select.value); }
    catch { select.value = S.DEFAULT_ID; definition = S.get(S.DEFAULT_ID); }
    const state = S.initialState(definition.id, game.selectedDifficulty());
    description.textContent = definition.description + ' ' + definition.advantage + ' ' + definition.tradeoff;
    const workers = state.roster.filter(kind => kind === 'worker').length;
    const soldiers = state.roster.filter(kind => kind === 'soldier').length;
    const team = workers + ' ouvriers' + (soldiers ? ' · ' + soldiers + ' fusilier' : '');
    const stocks = C.RESOURCE_KEYS.map(key => C.RESOURCE_META[key].label.toLowerCase() + ' ' + C.formatNumber(state.resources[key])).join(' · ');
    facts.textContent = team + ' · Centre ' + C.formatNumber(state.coreHealth) + ' / ' + C.formatNumber(C.BUILDINGS.core.health) + ' PV · Calme initial ' + C.formatTime(state.calmSeconds) + '. Réserves : ' + stocks + '. Les records sont séparés par départ et difficulté.';
  }
  select.addEventListener('change', refresh);
  for (const id of ['difficultyStory', 'difficultyStandard', 'difficultyBrutal']) document.getElementById(id)?.addEventListener('change', refresh);
  game.scenarioUI = Object.freeze({ refresh, refreshSeed });
  refresh(); refreshSeed();
})(typeof globalThis !== 'undefined' ? globalThis : this);
