(function initDeadwallScenarios(global) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./core.js') : global.DeadwallCore;
  if (!C) throw new Error('DeadwallCore introuvable pour les départs.');
  const DEFAULT_ID = 'classic';

  function normalize(id) {
    if (id === undefined) return DEFAULT_ID;
    if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(C.START_SCENARIOS, id)) throw new RangeError('Départ de campagne inconnu.');
    return id;
  }
  function get(id) { return C.START_SCENARIOS[normalize(id)]; }
  function list() { return Object.values(C.START_SCENARIOS); }
  function initialState(id, difficulty = 'standard') {
    const scenario = get(id);
    if (typeof difficulty !== 'string' || !Object.prototype.hasOwnProperty.call(C.DIFFICULTIES, difficulty)) throw new RangeError('Difficulté de campagne inconnue.');
    const resources = C.makeBag(scenario.resources);
    if (difficulty === 'story') C.add(resources, C.START_SCENARIO_STORY_BONUS);
    return {
      id: scenario.id, resources, roster: scenario.roster.slice(),
      coreHealth: C.BUILDINGS.core.health * scenario.coreHealthRatio,
      calmSeconds: scenario.calmSeconds * C.DIFFICULTIES[difficulty].calmTime
    };
  }
  const api = Object.freeze({ DEFAULT_ID, normalize, get, list, initialState });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DeadwallScenarios = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
