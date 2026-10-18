import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {canonicalSourceMap, parseNativeCounts} from './ci-native-receipt160.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
export const SHARDS = 6;
export const RELEASED_TEST_FLOOR = 4783;
const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b, label) => assert.deepEqual(a, b, label);
const safeTest = name => /^tests\/[A-Za-z0-9][A-Za-z0-9._-]*\.test\.cjs$/.test(name);
const byName = (a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0;

/** Partition the entire npm-test glob exactly once. Sizes balance work, never filter it. */
export function planShards(inventory, count = SHARDS) {
  assert.ok(Number.isSafeInteger(count) && count > 0 && count <= 32, 'Invalid shard count');
  assert.ok(Array.isArray(inventory) && inventory.length >= count, 'Incomplete test inventory');
  const files = inventory.map(row => {
    assert.ok(row && safeTest(row.path) && /^[a-f0-9]{64}$/.test(row.sha256) && Number.isSafeInteger(row.bytes) && row.bytes > 0, 'Invalid test record');
    return {path: row.path, sha256: row.sha256, bytes: row.bytes};
  }).sort(byName);
  assert.equal(new Set(files.map(row => row.path)).size, files.length, 'Duplicate test file');
  const shards = Array.from({length: count}, (_, i) => ({index: i + 1, bytes: 0, files: []}));
  for (const row of [...files].sort((a, b) => b.bytes - a.bytes || byName(a, b))) {
    const shard = [...shards].sort((a, b) => a.bytes - b.bytes || a.index - b.index)[0];
    shard.files.push(row.path); shard.bytes += row.bytes;
  }
  for (const shard of shards) shard.files.sort();
  const plan = {version: 1, count, inventory: files, shards};
  return {...plan, sha256: hash(JSON.stringify(plan))};
}

export function inventoryAt(directory) {
  // Identical complete test-file boundary to npm test; concurrency does not filter cases.
  return fs.readdirSync(path.join(directory, 'tests')).filter(name => name.endsWith('.test.cjs')).sort().map(name => {
    const filename = path.join(directory, 'tests', name), stat = fs.lstatSync(filename);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Tests must be ordinary files');
    const bytes = fs.readFileSync(filename);
    return {path: 'tests/' + name, bytes: bytes.length, sha256: hash(bytes)};
  });
}

function git(directory, args) {
  return execFileSync('git', ['--no-optional-locks', ...args], {cwd: directory, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024});
}
function captureSource(directory) {
  const head = git(directory, ['rev-parse', 'HEAD']).trim();
  const tree = git(directory, ['rev-parse', 'HEAD^{tree}']).trim();
  assert.match(head, /^[a-f0-9]{40}$/); assert.match(tree, /^[a-f0-9]{40}$/);
  const names = git(directory, ['ls-files', '-z']).split('\0').filter(Boolean).sort(), files = {};
  assert.ok(names.length > 4200, 'Full tracked source inventory required');
  for (const name of names) {
    assert.ok(!path.isAbsolute(name) && !name.split('/').some(part => part === '.' || part === '..') && !/[\x00-\x1f]/.test(name), 'Invalid tracked path');
    const filename = path.join(directory, name), before = fs.lstatSync(filename);
    assert.ok(before.isFile() && !before.isSymbolicLink(), 'Tracked file must be regular: ' + name);
    files[name] = hash(fs.readFileSync(filename));
    const after = fs.lstatSync(filename);
    assert.ok(before.size === after.size && before.mtimeMs === after.mtimeMs && before.mode === after.mode, 'Source changed during capture: ' + name);
  }
  return {head, tree, files, sha256: hash(canonicalSourceMap(files)), clean: git(directory, ['status', '--porcelain']).trim() === ''};
}
const logNames = Object.freeze({syntax: 'syntax.log', build: 'build.log', pretest: 'pretest.log', tests: 'native.log'});
export function commandsFor(files) {
  return {
    syntax: ['node', 'scripts/check-syntax134.mjs'],
    build: ['npm', 'run', 'build'],
    pretest: ['npm', 'run', 'pretest'],
    tests: ['node', '--test', '--test-concurrency=2', '--test-reporter=tap', ...files]
  };
}

/** Recompute acceptance; a receipt's claimed `accepted: true` is never sufficient. */
export function qualifyShard(receipt, logs, plan, source, runId = null) {
  assert.ok(receipt && receipt.version === 1 && receipt.kind === 'native-shard186', 'Unknown receipt');
  assert.ok(Number.isSafeInteger(receipt.index) && receipt.index >= 1 && receipt.index <= plan.count, 'Invalid shard index');
  equal(receipt.plan, plan.sha256, 'Stale test plan');
  equal(receipt.count, plan.count, 'Wrong shard count');
  equal(receipt.files, plan.shards[receipt.index - 1].files, 'Incomplete or substituted shard');
  equal(receipt.commands, commandsFor(receipt.files), 'Test command changed or filtered');
  equal(receipt.sourceBefore, source, 'Different source or commit');
  equal(receipt.sourceAfter, source, 'Source changed during execution');
  assert.equal(source.clean, true, 'Dirty source checkout');
  assert.equal(receipt.soakEnabled, true, 'Endurance was not enabled');
  assert.equal(receipt.filtersAbsent, true, 'Test filters are prohibited');
  if (runId !== null) equal(receipt.runId, runId, 'Evidence belongs to a different workflow run');
  equal(Object.keys(receipt.results).sort(), Object.keys(logNames).sort(), 'Missing verification phase');
  for (const key of Object.keys(logNames)) {
    const result = receipt.results[key];
    assert.ok(result && result.exitCode === 0 && result.signal === null, 'Failed or interrupted ' + key);
    equal(result.file, logNames[key], 'Invalid evidence path');
    assert.ok(typeof logs[key] === 'string' && logs[key].length > 0, 'Missing log: ' + key);
    equal(result.sha256, hash(logs[key]), 'Log bytes changed: ' + key);
  }
  const parsed = parseNativeCounts(logs.tests), counts = parsed.counts;
  assert.ok(parsed.complete && !parsed.negativeCase && !parsed.skipOrTodoCase, 'Incomplete, failed or filtered test output');
  assert.ok(counts.tests > 0 && counts.tests === counts.pass, 'Not every native test passed');
  for (const key of ['fail', 'cancelled', 'skipped', 'todo']) equal(counts[key], 0, 'Unqualified test outcome: ' + key);
  equal(receipt.counts, counts, 'Reported counts disagree with the original log');
  return counts;
}

export function qualifyAll(evidence, plan, source, runId = null) {
  assert.ok(Array.isArray(evidence) && evidence.length === plan.count, 'Missing or extra shard evidence');
  const seen = new Set(), executed = [], counts = {tests: 0, suites: 0, pass: 0, fail: 0, cancelled: 0, skipped: 0, todo: 0};
  for (const {receipt, logs} of evidence) {
    assert.ok(!seen.has(receipt.index), 'Duplicate shard evidence'); seen.add(receipt.index);
    const values = qualifyShard(receipt, logs, plan, source, runId);
    executed.push(...receipt.files);
    for (const key of Object.keys(counts)) counts[key] += values[key];
  }
  equal(executed.sort(), plan.inventory.map(row => row.path), 'The full test inventory was not executed exactly once');
  assert.ok(counts.tests >= RELEASED_TEST_FLOOR, 'Test count dropped below the released baseline');
  return {version: 1, kind: 'native-aggregate186', accepted: true, gitHead: source.head, sourceTree: source.tree,
    sourceSHA256: source.sha256, runId, soakEnabled: true, planSHA256: plan.sha256,
    testFiles: executed.length, shards: plan.count, counts,
    scope: 'All native test files, partitioned exactly once, with endurance, syntax, build and pretest on each shard. Not a single monolithic npm run check; browser/Windows remain separate gates.'};
}

function execute(command, directory, filename) {
  const fd = fs.openSync(filename, 'wx');
  let result;
  try {
    // No shell, pipeline, skip pattern, fail-fast or stderr suppression.
    result = spawnSync(command[0] === 'node' ? process.execPath : command[0], command.slice(1), {
      cwd: directory, env: process.env, stdio: ['ignore', fd, fd]
    });
  } finally { fs.closeSync(fd); }
  return {exitCode: result?.status ?? 255, signal: result?.signal ?? null,
    error: result?.error?.message ?? null, file: path.basename(filename), sha256: hash(fs.readFileSync(filename))};
}
function writeNew(filename, value) { fs.writeFileSync(filename, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'}); }
function run(index, directory) {
  const plan = planShards(inventoryAt(root));
  assert.ok(Number.isSafeInteger(index) && index >= 1 && index <= SHARDS, 'Invalid shard index');
  assert.equal(process.env.DEADWALL_SOAK, '1', 'DEADWALL_SOAK=1 is mandatory');
  assert.ok(!process.env.NODE_OPTIONS && !process.env.NODE_TEST_CONTEXT, 'No inherited Node filtering or nested test runner');
  const sourceBefore = captureSource(root); assert.equal(sourceBefore.clean, true, 'Commit source before qualification');
  fs.mkdirSync(directory, {recursive: true});
  const files = plan.shards[index - 1].files, commands = commandsFor(files), results = {};
  const receipt = {version: 1, kind: 'native-shard186', index, count: SHARDS, plan: plan.sha256, files, commands,
    startedAt: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null, node: process.version,
    soakEnabled: true, filtersAbsent: true, sourceBefore, accepted: false};
  writeNew(path.join(directory, 'started.json'), receipt);
  for (const [phase, command] of Object.entries(commands)) {
    console.log('Shard ' + index + '/' + SHARDS + ': ' + phase + ' (' + files.length + ' test files)');
    results[phase] = execute(command, root, path.join(directory, logNames[phase]));
    if (results[phase].exitCode !== 0 || results[phase].signal) break;
  }
  const logs = Object.fromEntries(Object.keys(results).map(key => [key, fs.readFileSync(path.join(directory, logNames[key]), 'utf8')]));
  Object.assign(receipt, {results, sourceAfter: captureSource(root), counts: parseNativeCounts(logs.tests || '').counts, completedAt: new Date().toISOString()});
  try { qualifyShard(receipt, logs, plan, sourceBefore, receipt.runId); receipt.accepted = true; }
  catch (error) { receipt.failure = error.message; }
  writeNew(path.join(directory, 'receipt.json'), receipt);
  console.log(JSON.stringify({index, accepted: receipt.accepted, counts: receipt.counts, failure: receipt.failure}));
  if (!receipt.accepted) process.exitCode = 1;
}
function aggregate(directory, destination) {
  const source = captureSource(root), plan = planShards(inventoryAt(root));
  const folders = fs.readdirSync(directory).filter(name => name.startsWith('deadwall-native186-shard-')).sort();
  equal(folders, Array.from({length: SHARDS}, (_, i) => 'deadwall-native186-shard-' + (i + 1)), 'Incomplete downloaded artifacts');
  const read = (folder, name) => {
    const filename = path.join(directory, folder, name), stat = fs.lstatSync(filename);
    assert.ok(stat.isFile() && !stat.isSymbolicLink(), 'Evidence must be an ordinary file');
    return fs.readFileSync(filename, 'utf8');
  };
  const evidence = folders.map(folder => ({receipt: JSON.parse(read(folder, 'receipt.json')),
    logs: Object.fromEntries(Object.entries(logNames).map(([key, name]) => [key, read(folder, name)]))}));
  const result = qualifyAll(evidence, plan, source, process.env.GITHUB_RUN_ID ?? null);
  fs.mkdirSync(path.dirname(destination), {recursive: true}); writeNew(destination, result);
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## Native qualification\n${result.counts.pass}/${result.counts.tests} tests; ${result.testFiles} files across ${SHARDS} disjoint shards. Endurance enabled, no skips.\n\nSource tree: \`${result.sourceTree}\`.\n`);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'run' && args.length === 2) run(Number(args[0]), path.resolve(args[1]));
    else if (command === 'aggregate' && args.length === 2) aggregate(path.resolve(args[0]), path.resolve(args[1]));
    else if (command === 'plan' && args.length === 0) console.log(JSON.stringify(planShards(inventoryAt(root)), null, 2));
    else throw Error('Expected plan, run INDEX OUTPUT, or aggregate INPUT OUTPUT');
  } catch (error) { console.error(error.stack); process.exitCode = 1; }
}
