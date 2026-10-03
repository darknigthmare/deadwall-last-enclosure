'use strict';
const fs = require('node:fs');
const path = require('node:path');
const packageRoot = path.resolve(__dirname, '..');
const installedRoot = path.resolve(__dirname, '..', '..');
const local = fs.existsSync(path.join(packageRoot, 'manifest.json'));
const root = local ? packageRoot : installedRoot;
const patchDir = local ? path.join(root, 'patches') : path.join(__dirname, 'patches');
const readPatch = (name, stage = 'after') => fs.readFileSync(path.join(patchDir, `${name}.${stage}.txt`), 'utf8');
function slice(source, start, end) {
  const a = source.indexOf(start);
  if (a < 0 || source.indexOf(start, a + 1) >= 0) throw new Error(`Missing or ambiguous method: ${start}`);
  const b = source.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`Missing method boundary: ${end}`);
  return source.slice(a, b).trim();
}
const focusOriginal = `    overlayFocusable(overlay) {
      const candidates = [...overlay.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
        .filter(node => {
          if (node.disabled || node.getAttribute('tabindex') === '-1' || node.closest('[inert], .hidden') || !node.getClientRects().length) return false;
          for (let ancestor = node.parentNode; ancestor && ancestor !== overlay; ancestor = ancestor.parentNode) {
            if (ancestor.tagName !== 'DETAILS' || ancestor.open) continue;
            const summary = [...ancestor.children].find(child => child.tagName === 'SUMMARY');
            if (!summary?.contains(node)) return false;
          }
          return true;
        });
      return candidates.filter(node => {
        if (node.type !== 'radio' || !node.name) return true;
        const group = candidates.filter(candidate => candidate.type === 'radio' && candidate.name === node.name);
        return node === (group.find(candidate => candidate.checked) || group[0]);
      });
    }`;
const focus = focusOriginal.replace(readPatch('focus-targets', 'before'), readPatch('focus-targets')).replace(readPatch('focus-radio-forms', 'before'), readPatch('focus-radio-forms'));
function sources() {
  if (local) return {
    construction: readPatch('construction'), harvest: readPatch('harvest'),
    release: readPatch('release-inputs'), input: readPatch('input-lifecycle'),
    render: readPatch('depth-render'), focus,
    settings: readPatch('save-settings-status'), saveParse: readPatch('save-utf8'),
    wall: readPatch('empty-wall-line')
  };
  const game = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8');
  const save = fs.readFileSync(path.join(root, 'src/save.js'), 'utf8');
  return {
    construction: slice(game, '    work(amount) {', '\n  }\n\n  class ResourceNode'),
    harvest: slice(game, '    harvest(amount) {', '\n  }\n\n  class Unit'),
    release: slice(game, '    releaseInputs() {', '    overlayFocusable('),
    input: slice(game, '    bindEvents() {', '    selectedDifficulty() {'),
    render: slice(game, '    depthEntries(view) {', '    viewBounds(){'),
    focus: slice(game, '    overlayFocusable(overlay) {', '    syncOverlayFocus() {'),
    settings: slice(game, '    saveSettings() {', '    toggleAccessibility(){'),
    saveParse: slice(save, '  function parse(text) {', '  const api='),
    wall: slice(game, '    placeWallLine(type, cells) {', '\n      if (!candidate')
  };
}
const C = { WORLD_SIZE: 4096, SQUAD_RULES: { keys: ['Digit4', 'Digit5', 'Digit6'] } };
function makeClass(environment = {}) {
  const src = sources();
  const fields = {
    C, TILE: 32, WORLD_TILES: 128,
    BUILDINGS: { woodWall: { id: 'woodWall' }, house: { id: 'house' } },
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)), grid: x => Math.floor(x / 32),
    SETTINGS_KEY: 'deadwall-settings-v1', document: {}, localStorage: {}, addEventListener() {},
    ...environment
  };
  return new Function(...Object.keys(fields), `return class QaMethods {\n${[src.construction, src.harvest, src.release, src.input, src.render, src.focus, src.settings].join('\n')}\n}`)(...Object.values(fields));
}
function parseFactory() {
  return new Function('MAX_FILE_BYTES', 'fail', 'validate', `${sources().saveParse}\nreturn parse;`)(8 * 1024 * 1024, message => { throw new Error(message); }, value => value);
}
function wallGuard() {
  return new Function('WORLD_TILES', 'BUILDINGS', `return ({ ${sources().wall}\nreturn candidate;\n} }).placeWallLine;`)(128, { woodWall: { id: 'woodWall' } });
}
module.exports = { local, root, sources, readPatch, makeClass, parseFactory, wallGuard, focusOriginal };
