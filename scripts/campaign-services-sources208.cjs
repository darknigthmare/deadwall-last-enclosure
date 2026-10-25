'use strict';
// One source boundary for the model-service, visual and tracking evidence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Campaign = require('./campaign-sources205.cjs');
const FIXED_FILES = Object.freeze([
  'scripts/campaign-services-sources208.cjs',
  'scripts/audit-campaign-services208.cjs',
  'scripts/audit-service-art208.cjs',
  'scripts/codex-campaign-services-progress208.cjs',
  'scripts/build-codex-tracker2026.cjs',
  'scripts/validate-codex-tracker2026.cjs',
  'tests/codex-tracker2026.test.cjs',
  'src/campaign-services208.js',
  'tests/campaign-services208.test.cjs',
  'tests/campaign-survival208.test.cjs',
  'tests/campaign-medical208.test.cjs',
  'tests/campaign-services208-world.test.cjs',
  'tests/campaign-service-art208.test.cjs',
  'tests/hero-services208.test.cjs',
  'tests/helpers/campaign-services208.cjs',
  'tests/codex-campaign-services-progress208.test.cjs',
  'tests/fixtures/campaign-services208-g11-M-golden.json',
  'tests/fixtures/campaign208-idle-art.json',
]);
function sourceNames(root = path.resolve(__dirname, '..')) {
  return [...new Set([...Campaign.sourceNames(root), ...FIXED_FILES])].sort();
}
function capture(root = path.resolve(__dirname, '..')) {
  const realRoot = fs.realpathSync(root);
  return sourceNames(realRoot).map(name => {
    const filename = path.join(realRoot, name), before = fs.lstatSync(filename);
    if (!before.isFile() || before.isSymbolicLink() || fs.realpathSync(filename) !== filename) throw Error('Source de services G11 non régulière : ' + name);
    const bytes = fs.readFileSync(filename), after = fs.lstatSync(filename);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.mode !== after.mode || bytes.length !== after.size) throw Error('Source de services G11 modifiée pendant la capture : ' + name);
    return {path: name, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex')};
  });
}
module.exports = {FIXED_FILES, sourceNames, capture};
