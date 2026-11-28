'use strict';
// Révision simulée du générateur G12 (D-O4, specs/monde-sans-bord/ouverture.md) : recharge les quatre modules du monde sans
// bord (générateur de cantons, monde régional, lieux, carte locale) sous des règles modifiées, dans le même royaume que le
// jeu (mêmes Uint8Array, mêmes Object), à côté des modules vivants qu'il ne remplace pas. Les autres dépendances (adressage
// des cantons, codex, géométrie) sont celles du jeu. Sert à éprouver une campagne créée sous une autre révision.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const FILES = Object.freeze([['Gen', 'world-canton-gen217.js', 'DeadwallWorldCantonGen217'], ['Open', 'world-open217.js', 'DeadwallWorldOpen217'], ['Sites', 'world-sites217.js', 'DeadwallWorldSites217'], ['Local', 'world-local217.js', 'DeadwallWorldLocal217']]);
const DEPS = Object.freeze(['DeadwallWorldCantons217', 'DeadwallFrontierGeometry', 'DeadwallCodex3000Runtime', 'DeadwallWorldSpawns131', 'DeadwallBiomes135', 'DeadwallFrontage174', 'DeadwallSeedDetail157']);

// Règles de relief de la révision simulée : altitude décalée et agglomérations plus fréquentes (un autre monde, même graine).
function reliefRules(C, change = {}) {
  const R = C.WorldRelief217Rules, f = Object.freeze;
  return f({ ...R, version: change.version ?? R.version - 1, field: f({ ...R.field, offset: change.offset ?? R.field.offset + .12 }), towns: f({ ...R.towns, chance: change.towns ?? .55 }) });
}

// Moteur d'une révision simulée : { revision, Gen, Open, Sites, Local }. `scope` hérite des globales du jeu (dépendances) ;
// les modules rechargés y sont posés comme propriétés propres, sans toucher aux globales vivantes.
function load(change = {}) {
  const live = globalThis.DeadwallCore;
  if (!live) throw Error('Cœur du jeu absent.');
  for (const name of DEPS) if (!globalThis[name]) {
    const file = { DeadwallWorldCantons217: 'world-cantons217.js', DeadwallFrontierGeometry: 'frontier-geometry.js', DeadwallCodex3000Runtime: 'codex3000-runtime.js', DeadwallWorldSpawns131: 'world-spawns131.js', DeadwallBiomes135: 'biomes135.js', DeadwallFrontage174: 'frontage174.js', DeadwallSeedDetail157: 'seed-detail157.js' }[name];
    globalThis[name] = require(path.join(ROOT, 'src', file));
  }
  const core = Object.create(live, { WorldRelief217Rules: { value: reliefRules(live, change), enumerable: true } });
  const scope = Object.create(globalThis, { DeadwallCore: { value: core, enumerable: true } });
  for (const [, , name] of FILES) Object.defineProperty(scope, name, { value: undefined, writable: true, enumerable: true });
  const out = {};
  for (const [key, file, name] of FILES) {
    const source = fs.readFileSync(path.join(ROOT, 'src', file), 'utf8');
    new Function('globalThis', 'module', 'require', 'exports', source + '\n//# sourceURL=revision-simulee/' + file)(scope, undefined, undefined, undefined);
    out[key] = scope[name];
    if (!out[key]) throw Error('Module rechargé absent : ' + file);
  }
  const OW = live.OpenWorld217Rules;
  const revision = { open: OW.revision, canton: out.Gen.RULES.version, relief: core.WorldRelief217Rules.version, sites: core.WorldSites217Rules.version, local: out.Local.RULES.version };
  return Object.freeze({ revision: Object.freeze(revision), ...out, core });
}

// Patch du cœur pour un jeu entier lancé sous la révision simulée (processus enfant : avant tout autre script).
function patchCore(C, change = {}) { C.WorldRelief217Rules = reliefRules(C, change); return C.WorldRelief217Rules; }

module.exports = { load, patchCore, reliefRules };
