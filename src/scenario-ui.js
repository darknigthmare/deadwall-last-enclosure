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

  function refresh() {
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
  game.scenarioUI = Object.freeze({ refresh });
  refresh();
})(typeof globalThis !== 'undefined' ? globalThis : this);
