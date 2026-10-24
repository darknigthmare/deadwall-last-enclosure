'use strict';
// One registry owns compilation, inspection coverage and author provenance.
const SPECS = Object.freeze([
  {name: 'Foundation', path: 'scripts/codex-world-foundations2026.cjs'},
  {name: 'Maritime', path: 'scripts/codex-maritime2026.cjs'},
  {name: 'Agriculture', path: 'scripts/codex-agriculture2026.cjs', proof: 'docs/codex/suivi-monde2026/AGRICULTURE_2026.md'},
  {name: 'Residential', path: 'scripts/codex-residential2026.cjs', proof: 'docs/codex/suivi-monde2026/RESIDENTIEL_2026.md'},
  {name: 'Industrial', path: 'scripts/codex-industrial2026.cjs', proof: 'docs/codex/suivi-monde2026/INDUSTRIE_2026.md'},
  {name: 'Lacustre', path: 'scripts/codex-lacustre2026.cjs', proof: 'docs/codex/suivi-monde2026/LACUSTRE_2026.md'},
  {name: 'Littoral', path: 'scripts/codex-littoral2026.cjs', proof: 'docs/codex/suivi-monde2026/LITTORAL_2026.md'},
  {name: 'Utilities', path: 'scripts/codex-utilities2026.cjs', proof: 'docs/codex/suivi-monde2026/EAU_ENERGIE_2026.md'},
  {name: 'MaritimeSites', path: 'scripts/codex-maritime-sites2026.cjs', proof: 'docs/codex/suivi-monde2026/PORTS_ILES_2026.md'},
  {name: 'CivilNetworks', path: 'scripts/codex-civil-networks2026.cjs', proof: 'docs/codex/suivi-monde2026/PONTS_ECHANGEURS_2026.md'},
  {name: 'UrbanServices', path: 'scripts/codex-urban-services2026.cjs', proof: 'docs/codex/suivi-monde2026/HLM_ASSAINISSEMENT_2026.md'},
  {name: 'Recreation', path: 'scripts/codex-recreation2026.cjs', proof: 'docs/codex/suivi-monde2026/PARCS_SPORTS_2026.md'},
  {name: 'TransportSites', path: 'scripts/codex-transport-sites2026.cjs', proof: 'docs/codex/suivi-monde2026/AEROPORTS_RAIL_2026.md'}
].map(Object.freeze));
const REFERENCES = 'docs/codex/suivi-monde2026/references-metriques2026.json';
const TARGETS = 'docs/codex/suivi-monde2026/OBJECTIFS80.json';
const COMPILATION_SOURCES = Object.freeze([
  'scripts/codex-generators2026.cjs', ...SPECS.map(s => s.path), REFERENCES, TARGETS
]);
const VARIANTS_PER_TYPE = 50;
function generators() {
  const seen = new Set();
  return SPECS.map(spec => {
    const api = require('../' + spec.path);
    const types = api.TYPES || Object.keys(api.PROFILES);
    if (!Array.isArray(types) || !types.length || typeof api.build !== 'function' || typeof api.audit !== 'function') {
      throw Error('Générateur auteur incomplet : ' + spec.path);
    }
    for (const type of types) {
      if (!/^EXT-MONDE-T\d{3}$/.test(type) || seen.has(type)) throw Error('Typologie auteur absente ou dupliquée : ' + type);
      seen.add(type);
    }
    return {...spec, api, types: [...types]};
  });
}
module.exports = {SPECS, REFERENCES, TARGETS, COMPILATION_SOURCES, VARIANTS_PER_TYPE, generators};
