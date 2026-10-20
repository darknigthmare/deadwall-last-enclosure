import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseNativeCounts} from './ci-native-receipt160.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const keys = ['tests', 'suites', 'pass', 'fail', 'cancelled', 'skipped', 'todo'];
export const FULL_CHECK_COMMAND201 = 'DEADWALL_SOAK=1 npm run check';
export const RELEASED_TEST_FLOOR201 = 5191;
export const RELEASED_FILE_FLOOR201 = 480;
const expectedScripts = Object.freeze({check: 'node scripts/check-syntax134.mjs && npm run build && npm test', test: 'node --test --test-concurrency=4 tests/*.test.cjs'});
const testName = name => /^tests\/[^/]+\.test\.cjs$/.test(name);
const hex = (value, length) => typeof value === 'string' && new RegExp('^[a-f0-9]{' + length + '}$').test(value);
const canonical = value => JSON.stringify(value);
function git(directory, args) {
  return execFileSync('git', ['--no-optional-locks', ...args], {cwd: directory, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: {...process.env, GIT_OPTIONAL_LOCKS: '0'}});
}

/** Read real bytes and permissions without invoking a shell; all tracked files use this boundary. */
export function fingerprintFiles201(directory, names) {
  const files = {};
  for (const name of names) {
    assert.ok(!path.isAbsolute(name) && !/[\x00-\x1f]/.test(name) && !name.split('/').some(part => part === '.' || part === '..'), 'Invalid source path');
    const filename = path.join(directory, name), before = fs.lstatSync(filename);
    assert.ok(before.isFile() && !before.isSymbolicLink(), 'Tracked source must be regular: ' + name);
    const bytes = fs.readFileSync(filename), after = fs.lstatSync(filename);
    assert.ok(before.size === after.size && before.mtimeMs === after.mtimeMs && before.mode === after.mode, 'Source changed during capture: ' + name);
    files[name] = {sha256: hash(bytes), bytes: bytes.length, mode: (before.mode & 0o177777).toString(8)};
  }
  return files;
}

/** Fingerprint the complete tracked checkout, including actual permissions and every npm-test input. */
export function captureSource201(directory) {
  const head = git(directory, ['rev-parse', 'HEAD']).trim(), tree = git(directory, ['rev-parse', 'HEAD^{tree}']).trim();
  assert.ok(hex(head, 40) && hex(tree, 40), 'Invalid Git identity');
  const names = [...new Set(git(directory, ['ls-files', '-z']).split('\0').filter(Boolean))].sort();
  const files = fingerprintFiles201(directory, names);
  const testFiles = fs.readdirSync(path.join(directory, 'tests')).filter(name => name.endsWith('.test.cjs')).sort().map(name => 'tests/' + name);
  const scripts = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')).scripts;
  const result = {head, tree, clean: git(directory, ['status', '--porcelain']).trim() === '', files, sha256: hash(canonical(files)),
    testFiles, scripts: {check: scripts.check, test: scripts.test}};
  assert.equal(git(directory, ['rev-parse', 'HEAD']).trim(), head, 'HEAD changed during capture');
  return result;
}

export function assertSource201(source, expectedHead) {
  assert.ok(source && hex(expectedHead, 40), 'An explicit expected commit is required');
  assert.equal(source.head, expectedHead, 'Checkout is not the exact requested head');
  assert.ok(hex(source.tree, 40), 'Missing source tree');
  assert.equal(source.clean, true, 'Dirty source checkout');
  assert.ok(source.files && !Array.isArray(source.files) && Object.keys(source.files).length > 4200, 'Incomplete tracked source inventory');
  const names = Object.keys(source.files);
  assert.deepEqual(names, [...names].sort(), 'Source map must be sorted');
  for (const name of names) {
    assert.ok(name && !path.isAbsolute(name) && !/[\x00-\x1f]/.test(name) && !name.split('/').some(part => part === '.' || part === '..'), 'Invalid source path');
    const row = source.files[name];
    assert.ok(row && hex(row.sha256, 64) && Number.isSafeInteger(row.bytes) && row.bytes >= 0 && /^100[0-7]{3}$/.test(row.mode), 'Missing source bytes or regular-file permissions');
  }
  assert.equal(source.sha256, hash(canonical(source.files)), 'Source fingerprint disagrees with its inventory');
  assert.deepEqual(source.testFiles, names.filter(testName), 'Missing, extra, untracked or substituted npm-test file');
  assert.ok(source.testFiles.length >= RELEASED_FILE_FLOOR201, 'Test-file inventory dropped below the released baseline');
  assert.deepEqual(source.scripts, expectedScripts, 'The literal check/test commands changed or were filtered');
  return source;
}
export function sourceStable201(before, after, expectedHead) {
  assertSource201(before, expectedHead); assertSource201(after, expectedHead);
  assert.deepEqual(after, before, 'Tracked source bytes, permissions, inventory or Git tree changed during execution');
  return true;
}

/** Recompute from the original log and source inventories; never trust a claimed accepted flag. */
export function qualifyFullCheck201(receipt, logBytes) {
  assert.ok(receipt && receipt.version === 1 && receipt.kind === 'literal-fullcheck201', 'Unknown full-check receipt');
  assert.equal(receipt.command, FULL_CHECK_COMMAND201, 'A literal full check with endurance is required');
  assert.equal(receipt.soakEnabled, true, 'Endurance was not enabled for both phases');
  assert.equal(receipt.filtersAbsent, true, 'Inherited Node test filters/options are prohibited');
  sourceStable201(receipt.sourceBefore, receipt.sourceAfter, receipt.expectedHead);
  for (const name of ['actualExitCode', 'teeExitCode']) assert.equal(receipt[name], 0, 'Failed actual ' + name);
  assert.equal(receipt.signal, null, 'Interrupted check');
  assert.ok(Buffer.isBuffer(logBytes) && logBytes.length > 0, 'Missing original full-check log');
  assert.equal(receipt.logBytes, logBytes.length, 'Log length disagrees');
  assert.equal(receipt.logSha256, hash(logBytes), 'Original log bytes changed');
  const parsed = parseNativeCounts(logBytes.toString('utf8')), counts = parsed.counts;
  assert.ok(parsed.complete && keys.every(key => Object.hasOwn(counts, key)), 'All seven native footer counters are required');
  assert.ok(!parsed.negativeCase && !parsed.skipOrTodoCase, 'Failed, skipped or todo test case in original log');
  assert.ok(counts.tests >= RELEASED_TEST_FLOOR201 && counts.tests === counts.pass, 'Incomplete or zero-test native run');
  for (const key of ['fail', 'cancelled', 'skipped', 'todo']) assert.equal(counts[key], 0, 'Unqualified test outcome: ' + key);
  assert.deepEqual(receipt.counts, counts, 'Reported counters disagree with original log');
  return {accepted: true, counts, sourceFiles: Object.keys(receipt.sourceBefore.files).length,
    testFiles: receipt.sourceBefore.testFiles.length, gitHead: receipt.expectedHead, sourceTree: receipt.sourceBefore.tree};
}

function writeNew(filename, record) { fs.writeFileSync(filename, JSON.stringify(record, null, 2) + '\n', {flag: 'wx'}); }
function environment() {
  assert.equal(process.env.DEADWALL_SOAK, '1', 'DEADWALL_SOAK=1 is mandatory');
  assert.ok(hex(process.env.DEADWALL_EXPECTED_HEAD, 40), 'DEADWALL_EXPECTED_HEAD must name the exact checked-out commit');
  assert.ok(!process.env.NODE_OPTIONS && !process.env.NODE_TEST_CONTEXT && !process.env.NODE_TEST_NAME_PATTERN && !process.env.NODE_TEST_SKIP_PATTERN,
    'No inherited Node options, nested runner or test filters');
}
function main(argv) {
  const [phase, relative, npmCode, teeCode] = argv;
  assert.ok(['start', 'finish'].includes(phase) && (phase === 'start' ? argv.length === 2 : argv.length === 4), 'Expected start OUTPUT or finish OUTPUT NPM_EXIT TEE_EXIT');
  assert.ok(/^artifacts\/qa\/fullcheck201\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(relative || ''), 'Use a unique artifacts/qa/fullcheck201/RUN directory');
  const directory = path.join(root, relative), journal = path.join(directory, 'started.json'), receiptFile = path.join(directory, 'receipt.json');
  fs.mkdirSync(directory, {recursive: true});
  assert.ok(!fs.existsSync(receiptFile), 'Preserve previous receipts; choose a new run directory');
  if (phase === 'start') {
    // A rejected start is evidence too; never launch the expensive command after rejection.
    const record = {version: 1, kind: 'literal-fullcheck201', command: FULL_CHECK_COMMAND201, expectedHead: process.env.DEADWALL_EXPECTED_HEAD ?? null,
      startedAt: new Date().toISOString(), node: process.version, npm: null, runId: process.env.GITHUB_RUN_ID ?? null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null, scope: 'One literal complete npm run check with endurance on the exact requested Git head; no browser, Windows, human campaign, frame-rate or production claim is inferred.', soakEnabled: process.env.DEADWALL_SOAK === '1', filtersAbsent: false, accepted: false};
    try {
      environment(); record.filtersAbsent = true;
      record.npm = execFileSync('npm', ['--version'], {cwd: root, encoding: 'utf8'}).trim();
      record.sourceBefore = captureSource201(root);
      assertSource201(record.sourceBefore, record.expectedHead);
      writeNew(journal, record);
    } catch (error) {
      record.failure = error.message; writeNew(path.join(directory, 'rejected-start.json'), record); throw error;
    }
    console.log('Started literal full check on ' + record.expectedHead + ': ' + record.sourceBefore.testFiles.length + ' test files');
    return;
  }
  const record = JSON.parse(fs.readFileSync(journal, 'utf8'));
  Object.assign(record, {completedAt: new Date().toISOString(), accepted: false, actualExitCode: null, teeExitCode: null, signal: null});
  try {
    for (const value of [npmCode, teeCode]) assert.ok(/^(?:0|[1-9]\d{0,2})$/.test(value || '') && Number(value) <= 255, 'Actual npm and tee exit statuses are required');
    record.actualExitCode = Number(npmCode); record.teeExitCode = Number(teeCode);
    record.signal = record.actualExitCode > 128 ? 'shell-status-' + record.actualExitCode : null;
    record.sourceAfter = captureSource201(root);
    const bytes = fs.readFileSync(path.join(directory, 'native.log'));
    record.logBytes = bytes.length; record.logSha256 = hash(bytes); record.counts = parseNativeCounts(bytes.toString('utf8')).counts;
    record.soakEnabled = record.soakEnabled === true && process.env.DEADWALL_SOAK === '1';
    environment(); assert.equal(process.env.DEADWALL_EXPECTED_HEAD, record.expectedHead, 'Expected commit changed between phases');
    const result = qualifyFullCheck201(record, bytes); record.accepted = result.accepted;
  } catch (error) { record.failure = error.message; }
  writeNew(receiptFile, record);
  const notice = {accepted: record.accepted, gitHead: record.expectedHead, sourceTree: record.sourceBefore?.tree, counts: record.counts,
    actualExitCode: record.actualExitCode, teeExitCode: record.teeExitCode, failure: record.failure,
    receiptSha256: hash(fs.readFileSync(receiptFile))};
  console.log(JSON.stringify(notice));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    'Literal full check: **' + (record.accepted ? 'PASS' : 'FAIL') + '**\n\n`' + FULL_CHECK_COMMAND201 + '` on `' + record.expectedHead + '`; npm exit ' + record.actualExitCode + ', tee exit ' + record.teeExitCode + '.\n\nSeven native counters: `' + JSON.stringify(record.counts ?? {}) + '`.\n');
  if (!record.accepted) process.exitCode = 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.stack); process.exitCode = 1; }
}
