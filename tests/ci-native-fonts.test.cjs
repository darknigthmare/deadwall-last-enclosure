'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {nativeFontNodeOptions} = require('../scripts/ci-native-node-policy.cjs');
const root = path.resolve(__dirname, '..');
const bootstrap = fs.realpathSync(path.join(root, 'scripts/ci-native-fonts-bootstrap.cjs'));
const canonical = '--require=' + JSON.stringify(bootstrap);
const gates = Promise.all([import('../scripts/ci-native186.mjs'), import('../scripts/full-check201.mjs')])
  .then(([native, full]) => [native.assertNativeEnvironment186, full.assertFullCheckEnvironment201]);
const environment = overrides => ({DEADWALL_SOAK: '1', DEADWALL_EXPECTED_HEAD: 'a'.repeat(40), ...overrides});

test('both native gates accept only absent options or the exact checkout font preload', async () => {
  assert.equal(nativeFontNodeOptions(), canonical);
  for (const gate of await gates) {
    for (const NODE_OPTIONS of [undefined, '', canonical]) {
      assert.doesNotThrow(() => gate(environment({NODE_OPTIONS})));
    }
  }
});

for (const [label, options] of [
  ['arbitrary flag', '--no-warnings'],
  ['test name filter', '--test-name-pattern=only'],
  ['test skip filter', '--test-skip-pattern=all'],
  ['test only flag', '--test-only'],
  ['relative preload', '--require=./scripts/ci-native-fonts-bootstrap.cjs'],
  ['another checkout', '--require=' + JSON.stringify(path.join(root, 'other', 'scripts', 'ci-native-fonts-bootstrap.cjs'))],
  ['parent traversal spelling', '--require=' + JSON.stringify(path.dirname(bootstrap) + '/../scripts/ci-native-fonts-bootstrap.cjs')],
  ['alternate preload spelling', '--require ' + JSON.stringify(bootstrap)],
  ['short preload option', '-r ' + JSON.stringify(bootstrap)],
  ['unquoted spelling', '--require=' + bootstrap],
  ['leading whitespace', ' ' + canonical],
  ['trailing whitespace', canonical + ' '],
  ['second preload', canonical + ' ' + canonical],
  ['appended arbitrary flag', canonical + ' --no-warnings'],
  ['prepended arbitrary flag', '--no-warnings ' + canonical],
  ['appended test filter', canonical + ' --test-name-pattern=only'],
  ['newline and flag', canonical + '\n--test-only']
]) test('both native gates reject ' + label, async () => {
  for (const gate of await gates) assert.throws(() => gate(environment({NODE_OPTIONS: options})), /exact canonical checkout font bootstrap/);
});

for (const key of ['NODE_TEST_CONTEXT', 'NODE_TEST_NAME_PATTERN', 'NODE_TEST_SKIP_PATTERN']) {
  test('the font exception never admits ' + key, async () => {
    for (const gate of await gates) {
      for (const NODE_OPTIONS of [undefined, canonical]) {
        assert.throws(() => gate(environment({NODE_OPTIONS, [key]: 'enabled'})), /nested Node test runner|test filters/);
      }
    }
  });
}

test('both native gates still require endurance and full check still requires the explicit head', async () => {
  const [native, full] = await gates;
  for (const gate of [native, full]) {
    for (const DEADWALL_SOAK of [undefined, '', '0']) {
      assert.throws(() => gate(environment({DEADWALL_SOAK, NODE_OPTIONS: canonical})), /DEADWALL_SOAK=1/);
    }
  }
  for (const DEADWALL_EXPECTED_HEAD of [undefined, '', 'main', 'not-a-commit']) {
    assert.throws(() => full(environment({DEADWALL_EXPECTED_HEAD, NODE_OPTIONS: canonical})), /exact checked-out commit/);
  }
});

test('the action-facing selector emits exactly one canonical value without running Canvas', () => {
  const env = {...process.env};
  for (const key of ['NODE_OPTIONS', 'NODE_TEST_CONTEXT', 'NODE_TEST_NAME_PATTERN', 'NODE_TEST_SKIP_PATTERN']) delete env[key];
  const run = spawnSync(process.execPath, ['scripts/ci-native-node-policy.cjs'], {cwd: root, env, encoding: 'utf8', timeout: 10000});
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  assert.equal(run.stdout, canonical + '\n');
});
