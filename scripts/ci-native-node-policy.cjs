'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function nativeFontNodeOptions() {
  const filename = path.join(__dirname, 'ci-native-fonts-bootstrap.cjs');
  const stat = fs.lstatSync(filename);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Native font bootstrap must be a regular checkout file');
  const canonical = fs.realpathSync(filename);
  assert.ok(!/[\x00-\x1f"]/.test(canonical), 'Unsupported native font bootstrap path');
  return '--require=' + JSON.stringify(canonical);
}

// Exact equality, not option parsing: no extra option, alternate spelling,
// relative/symlink path, second preload or test filter is authorised.
function assertNativeNodeEnvironment(env = process.env) {
  assert.ok(!env.NODE_OPTIONS || env.NODE_OPTIONS === nativeFontNodeOptions(),
    'No inherited Node options except the exact canonical checkout font bootstrap');
  assert.ok(!env.NODE_TEST_CONTEXT && !env.NODE_TEST_NAME_PATTERN && !env.NODE_TEST_SKIP_PATTERN,
    'No nested Node test runner or inherited test filters');
}

module.exports = {nativeFontNodeOptions, assertNativeNodeEnvironment};

if (require.main === module) {
  assert.equal(process.argv.length, 2, 'This command only prints the canonical native font preload');
  assertNativeNodeEnvironment();
  process.stdout.write(nativeFontNodeOptions() + '\n');
}
