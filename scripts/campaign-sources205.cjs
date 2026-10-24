'use strict';
// Shared by the campaign audit producer and the independent tracking reader.
// All delivered scripts and bundled source modules belong to this boundary;
// geometry, ecology and placement cannot be qualified from an adapter alone.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Manifest = require('./public-manifest183.cjs');
const FIXED_FILES = Object.freeze([
  'index.html', 'scripts/public-manifest183.cjs', 'scripts/campaign-sources205.cjs',
  'scripts/audit-campaign-sites205.cjs', 'scripts/codex-residential2026.cjs',
  'scripts/codex-campaign-progress205.cjs',
  'src/codex-campaign205.js',
]);
function sourceNames(root = path.resolve(__dirname, '..')) {
  const entries = Manifest.readPublicEntries(root);
  return [...new Set([...FIXED_FILES, ...entries.scripts, ...Manifest.BUNDLED_MODULES])].sort();
}
function capture(root = path.resolve(__dirname, '..')) {
  const realRoot = fs.realpathSync(root);
  return sourceNames(realRoot).map(name => {
    const filename = path.join(realRoot, name), before = fs.lstatSync(filename);
    if (!before.isFile() || before.isSymbolicLink() || fs.realpathSync(filename) !== filename) throw Error('Source G11 non régulière : ' + name);
    const bytes = fs.readFileSync(filename), after = fs.lstatSync(filename);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.mode !== after.mode || bytes.length !== after.size) throw Error('Source G11 modifiée pendant la capture : ' + name);
    return {path: name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex')};
  });
}
module.exports = {FIXED_FILES, sourceNames, capture};
