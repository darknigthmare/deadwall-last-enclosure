const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {createHash} = require('node:crypto');
const mod = import('../scripts/full-check201.mjs');
const hash = value => createHash('sha256').update(value).digest('hex');
const head = '1'.repeat(40), tree = '2'.repeat(40);
const footer = overrides => {
  const values = {tests: 5191, suites: 4, pass: 5191, fail: 0, cancelled: 0, skipped: 0, todo: 0, ...overrides};
  return Buffer.from(Object.entries(values).filter(([, value]) => value !== null).map(([key, value]) => '# ' + key + ' ' + value).join('\n') + '\n');
};
function source() {
  const files = Object.fromEntries([...Array.from({length: 3722}, (_, i) => 'src/module-' + String(i).padStart(4, '0') + '.js'),
    ...Array.from({length: 480}, (_, i) => 'tests/case-' + String(i).padStart(3, '0') + '.test.cjs')].sort()
    .map(name => [name, {sha256: hash(name), bytes: name.length, mode: '100644'}]));
  return {head, tree, clean: true, files, sha256: hash(JSON.stringify(files)), testFiles: Object.keys(files).filter(name => name.startsWith('tests/')),
    scripts: {check: 'node scripts/check-syntax134.mjs && npm run build && npm test', test: 'node --test --test-concurrency=4 tests/*.test.cjs'}};
}
function fixture(log = footer()) {
  const before = source();
  return {log, receipt: {version: 1, kind: 'literal-fullcheck201', command: 'DEADWALL_SOAK=1 npm run check', expectedHead: head,
    soakEnabled: true, filtersAbsent: true, sourceBefore: before, sourceAfter: structuredClone(before), actualExitCode: 0,
    teeExitCode: 0, signal: null, logBytes: log.length, logSha256: hash(log), counts: Object.fromEntries([...log.toString().matchAll(/^# (\w+) (\d+)$/gm)].map(m => [m[1], Number(m[2])])), accepted: true}};
}
const rehash = source => { source.sha256 = hash(JSON.stringify(source.files)); };

test('literal full check accepts complete original evidence despite an untrusted claimed result', async () => {
  const {qualifyFullCheck201} = await mod, f = fixture();
  f.receipt.accepted = false;
  const result = qualifyFullCheck201(f.receipt, f.log);
  assert.equal(result.accepted, true); assert.equal(result.testFiles, 480); assert.equal(result.counts.tests, 5191);
  assert.equal(result.sourceFiles, 4202); assert.equal(result.gitHead, head);
});

for (const missing of ['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
  test('rejects incomplete native footer without ' + missing, async () => {
    const {qualifyFullCheck201} = await mod, f = fixture(footer({[missing]: null}));
    assert.throws(() => qualifyFullCheck201(f.receipt, f.log), /seven native footer/);
  });
}
for (const [name, values, expected] of [
  ['zero cases', {tests: 0, pass: 0}, /Incomplete or zero/],
  ['released case regression', {tests: 5190, pass: 5190}, /Incomplete or zero/],
  ['failed native case', {pass: 5190, fail: 1}, /Incomplete or zero/],
  ['skipped native case', {pass: 5191, skipped: 1}, /Unqualified.*skipped/],
  ['cancelled native case', {cancelled: 1}, /Unqualified.*cancelled/],
  ['todo native case', {todo: 1}, /Unqualified.*todo/]
]) test('rejects ' + name + ' despite exit zero', async () => {
  const {qualifyFullCheck201} = await mod, f = fixture(footer(values));
  assert.throws(() => qualifyFullCheck201(f.receipt, f.log), expected);
});
for (const [name, line] of [['TAP failure', 'not ok 17 - real assertion failed\n'], ['spec failure', '✖ failed assertion\n'], ['TAP skip', 'ok 17 - not exercised # SKIP unsupported\n'], ['TAP todo', 'ok 18 - pending # TODO later\n']]) {
  test('rejects a hidden ' + name + ' preceding an apparently green footer', async () => {
    const {qualifyFullCheck201} = await mod, f = fixture(Buffer.concat([Buffer.from(line), footer()]));
    assert.throws(() => qualifyFullCheck201(f.receipt, f.log), /Failed, skipped or todo/);
  });
}
for (const [name, change, expected] of [
  ['nonzero real npm status', r => r.actualExitCode = 1, /actualExitCode/],
  ['failed tee writer', r => r.teeExitCode = 1, /teeExitCode/],
  ['interrupted command', r => r.signal = 'SIGTERM', /Interrupted/],
  ['disabled endurance', r => r.soakEnabled = false, /Endurance/],
  ['test filter', r => r.filtersAbsent = false, /filters/],
  ['substituted command', r => r.command = 'npm test', /literal full check/],
  ['missing expected head', r => r.expectedHead = null, /expected commit/],
  ['merge SHA instead of requested head', r => {r.sourceBefore.head = '3'.repeat(40); r.sourceAfter.head = r.sourceBefore.head;}, /exact requested head/],
  ['dirty source at start', r => r.sourceBefore.clean = false, /Dirty/],
  ['dirty source at finish', r => r.sourceAfter.clean = false, /Dirty/],
  ['changed Git tree', r => r.sourceAfter.tree = '4'.repeat(40), /changed during execution/],
  ['source bytes changed', r => {r.sourceAfter.files['src/module-0000.js'].sha256 = '5'.repeat(64); rehash(r.sourceAfter);}, /changed during execution/],
  ['source permissions changed', r => {r.sourceAfter.files['src/module-0000.js'].mode = '100755'; rehash(r.sourceAfter);}, /changed during execution/],
  ['incomplete hash inventory', r => {delete r.sourceBefore.files['src/module-0000.js'];}, /fingerprint/],
  ['removed test file', r => {r.sourceBefore.testFiles.pop();}, /npm-test file/],
  ['changed npm test script', r => {r.sourceBefore.scripts.test += ' --test-name-pattern=only';}, /commands changed/],
  ['invented footer counters', r => r.counts.tests++, /counters disagree/],
  ['edited log checksum', r => r.logSha256 = '0'.repeat(64), /log bytes changed/],
  ['edited log byte length', r => r.logBytes++, /Log length/]
]) test('rejects ' + name + ' even with accepted=true', async () => {
  const {qualifyFullCheck201} = await mod, f = fixture(); change(f.receipt);
  assert.throws(() => qualifyFullCheck201(f.receipt, f.log), expected);
});

test('fingerprints real bytes and permissions and refuses symlink substitution', async () => {
  const {fingerprintFiles201} = await mod, directory = fs.mkdtempSync(path.join(os.tmpdir(), 'deadwall-fullcheck201-'));
  const name = 'real.test.cjs', filename = path.join(directory, name);
  try {
    fs.writeFileSync(filename, "require('node:assert').ok(true);\n", {mode: 0o644});
    const before = fingerprintFiles201(directory, [name]);
    assert.equal(before[name].bytes, fs.statSync(filename).size);
    assert.equal(before[name].sha256, hash(fs.readFileSync(filename)));
    fs.chmodSync(filename, 0o755);
    const changedMode = fingerprintFiles201(directory, [name]);
    assert.equal(changedMode[name].sha256, before[name].sha256);
    assert.notEqual(changedMode[name].mode, before[name].mode);
    fs.appendFileSync(filename, '// real byte change\n');
    const changedBytes = fingerprintFiles201(directory, [name]);
    assert.notEqual(changedBytes[name].sha256, changedMode[name].sha256);
    assert.ok(changedBytes[name].bytes > changedMode[name].bytes);
    fs.symlinkSync(filename, path.join(directory, 'substitute.test.cjs'));
    assert.throws(() => fingerprintFiles201(directory, ['substitute.test.cjs']), /must be regular/);
    assert.throws(() => fingerprintFiles201(directory, ['..\/escape']), /Invalid source path/);
  } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});

test('CI executes the literal command on the explicit PR head and preserves both exit codes and negative evidence', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/fullcheck201.yml'), 'utf8');
  assert.match(workflow, /timeout-minutes: 90/);
  assert.equal((workflow.match(/ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/g) || []).length, 2);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /DEADWALL_SOAK=1 npm run check 2>&1 \| tee/);
  assert.match(workflow, /check_status=\("\$\{PIPESTATUS\[@\]\}"\)/);
  assert.match(workflow, /finish "\$DEADWALL_FULLCHECK_OUTPUT" "\$\{check_status\[0\]\}" "\$\{check_status\[1\]\}"/);
  assert.equal((workflow.match(/if: always\(\)/g) || []).length, 2);
  assert.doesNotMatch(workflow, /continue-on-error|--test-name-pattern|--test-skip-pattern|--test-only/);
});

for (const reporter of ['spec', 'tap']) test('native diagnostic titles cannot forge test outcomes with the real ' + reporter + ' reporter', async () => {
  const {parseNativeCounts} = await import('../scripts/ci-native-receipt160.mjs');
  const env = {...process.env};
  // Exercise a standalone CLI, not the parent's internal binary child reporter.
  delete env.NODE_TEST_CONTEXT;
  const run = require('node:child_process').spawnSync(process.execPath,
    ['--test', '--test-reporter=' + reporter, 'tests/audit186-ci.test.cjs'],
    {cwd: path.join(__dirname, '..'), env, encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024});
  assert.equal(run.error, undefined);
  assert.equal(run.signal, null);
  assert.equal(run.status, 0, run.stderr);
  const parsed = parseNativeCounts(run.stdout);
  assert.equal(parsed.complete, true);
  assert.ok(parsed.counts.tests >= 49);
  assert.equal(parsed.counts.pass, parsed.counts.tests);
  for (const key of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(parsed.counts[key], 0);
  assert.equal(parsed.negativeCase, false);
  assert.equal(parsed.skipOrTodoCase, false);
  assert.match(run.stdout, /186 deceptive or incomplete footer is refused:/);
});
