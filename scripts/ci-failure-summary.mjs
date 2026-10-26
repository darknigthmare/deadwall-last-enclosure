import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNativeCounts } from './ci-native-receipt160.mjs';

const MAX_FILES = 2048;
const MAX_REPORT_BYTES = 2 * 1024 * 1024;
const MAX_FAILURES = 24;
const MAX_NATIVE_LOG_BYTES = 2 * 1024 * 1024;

/** CI annotations contain diagnostic text only, never report bodies or signed URLs. */
export function safeDiagnosticText(value, limit = 480) {
  const text = String(value ?? '')
    .replace(/(?:[a-z][a-z0-9+.-]*:\/\/|\bdata:|\bblob:)[^\s<>"']*/gi, '[URL removed]')
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/_.=-]+/gi, '[credential removed]');
  const assignment = /(?:(['"])([A-Za-z_\\][A-Za-z0-9_.\\-]*)\1|(\b[A-Za-z_][A-Za-z0-9_-]*))\s*[:=]\s*/g;
  let cleaned = '', cursor = 0, match;
  while ((match = assignment.exec(text))) {
    const name = (match[2] ?? match[3]).replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').replace(/[^A-Za-z0-9_]/g, '_');
    const sensitive = /(?:^|_)(?:token|secret|password|authorization|cookies?|credentials?|(?:api|access|private|signing|encryption|ssh)_?key)\d*(?:_|$)/i.test(name)
      || /^[A-Z_][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|APIKEY|ACCESSKEY|PRIVATEKEY)\d*$/.test(name);
    if (!sensitive) continue;
    const tail = text.slice(assignment.lastIndex), quoted = tail[0] === '"' || tail[0] === "'";
    const contents = (quoted ? /^(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')/ : /^[^\s,;]+/).exec(tail);
    // A cut-off quoted value must not expose its remaining words. Other keys
    // consume only their header so nested JSON assignments are still inspected.
    const length = contents?.[0].length ?? (quoted ? tail.search(/[\r\n]/) < 0 ? tail.length : tail.search(/[\r\n]/) : 0);
    if (!length) continue;
    cleaned += text.slice(cursor, match.index) + '[credential removed]';
    cursor = assignment.lastIndex + length; assignment.lastIndex = cursor;
  }
  return (cleaned + text.slice(cursor))
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function firstLine(value) {
  return String(value ?? '').split(/\r?\n/, 1)[0];
}

function boundedStack(item) {
  return [item.failure, item.error?.stack, item.cleanupFailure, ...(Array.isArray(item.error?.details) ? item.error.details : [])]
    .filter(value => typeof value === 'string').join('\n').slice(0, 16384);
}

function browserProfile(profile) {
  if (profile?.viewport?.name || profile?.stage) return profile.viewport?.name || profile.stage;
  const view = profile?.view;
  const dimension = value => Number.isSafeInteger(value) && value >= 1 && value <= 16384;
  if (!view || !dimension(view.width) || !dimension(view.height) || view.touch !== undefined && typeof view.touch !== 'boolean') return 'browser profile';
  return 'browser ' + view.width + 'x' + view.height + (view.touch ? ' touch' : ' mouse');
}

// Accept only a complete literal CSS ID line, never locator text or its arguments.
function locatorTarget(item) {
  const stack = boundedStack(item), header = /^Call log:[ \t]*\r?$/m.exec(stack);
  if (!header) return '';
  return /^[ \t]*(?:-[ \t]*)?waiting for locator\((['"])(#[A-Za-z_][A-Za-z0-9_-]{0,63})\1\)[ \t]*\r?$/m.exec(stack.slice(header.index + header[0].length))?.[2] || '';
}

// Publish one repository-relative source frame, never a raw stack or its host path.
function sourceFrame(item) {
  const stack = boundedStack(item).replace(/\\/g, '/');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const frames = /(?:^|[\s/(])((?:scripts|tests|desktop)\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.[cm]?js):([1-9]\d{0,7}):([1-9]\d{0,7})(?=$|[\s)])/gm;
  for (const match of stack.matchAll(frames)) {
    const relative = match[1];
    if (relative.length > 160 || relative.split('/').some(part => part === '.' || part === '..')) continue;
    try {
      const stat = fs.lstatSync(path.join(root, relative));
      if (stat.isFile() && !stat.isSymbolicLink()) return relative + ':' + match[2] + ':' + match[3];
    } catch { /* An unknown source frame is not useful evidence. */ }
  }
  return '';
}

export function reportFailures(report, source = 'report.json') {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return [];
  const failures = [];
  const append = (item, label) => {
    if (!item || typeof item !== 'object') return;
    const failedCheck = Array.isArray(item.checks) ? item.checks.find(check => check?.pass === false) : null;
    const failed = item.pass === false || item.ok === false || item.failure || item.cleanupFailure || failedCheck;
    if (!failed) return;
    const childDetail = Array.isArray(item.error?.details) ? item.error.details.find(line => /AssertionError|\b[A-Za-z]*Error:|ERR_[A-Z_]+/.test(line)) : null;
    const message = failedCheck?.name
      ? 'Failed check: ' + failedCheck.name
      : childDetail
      ? firstLine(item.error.message || 'Native launch failed') + ' — ' + firstLine(childDetail)
      : firstLine(item.failure || item.error?.message || item.cleanupFailure || 'Verification failed without a structured assertion.');
    const location = sourceFrame(item);
    const target = locatorTarget(item);
    const lastPassed = !failedCheck && Array.isArray(item.checks) ? item.checks.findLast(check => check?.pass === true && typeof check.name === 'string')?.name : null;
    const context = [location ? 'at ' + location : '', target ? 'Target: ' + target : '', lastPassed ? 'Last passed: ' + safeDiagnosticText(lastPassed, 80) : ''].filter(Boolean);
    const contextText = context.join(' — '), messageLimit = Math.min(220, 480 - contextText.length - 3);
    failures.push({
      source: safeDiagnosticText(source, 160),
      profile: safeDiagnosticText(label || item.stage || 'verification', 80),
      message: safeDiagnosticText(context.length ? safeDiagnosticText(message, messageLimit) + ' — ' + contextText : message)
    });
  };
  if (Array.isArray(report.profiles)) {
    for (const profile of report.profiles) append(profile, browserProfile(profile));
  }
  if (!failures.length || report.cleanupFailure) append(report, report.stage || 'verification');
  return failures.slice(0, MAX_FAILURES);
}

const nativeText = (value, limit = 260) => safeDiagnosticText(value, limit * 2)
  .replace(/(^|[\s(])(?:[A-Za-z]:[\\/]|\/)[^\s)]+/g, '$1[path removed]')
  .slice(0, limit);

/** Diagnostic only: extract real spec/TAP failures, never infer test success. */
export function nativeLogFailures(value, source = 'ci-native160.log', { details = false } = {}) {
  const text = String(value ?? '').slice(-MAX_NATIVE_LOG_BYTES).replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');
  const records = []; let current = null, pendingLocation = '';
  for (const line of text.split(/\r?\n/)) {
    if (/^test at /.test(line)) {
      pendingLocation = sourceFrame({failure:line}); current = null; continue;
    }
    const failure = /^\s*✖\s+(.+?)\s+\(\d+(?:\.\d+)?(?:ms|s)\)\s*$/.exec(line)
      || /^\s*not ok \d+(?:\s+-\s+(.+))?\s*$/.exec(line);
    if (failure) {
      const name = nativeText(failure[1] || 'Unnamed native test failed', details ? 120 : 260);
      current = records.find(record => record.name === name && (!pendingLocation || !record.location || record.location === pendingLocation));
      if (!current && records.length < MAX_FAILURES) { current = {name, location:''}; records.push(current); }
      if (current && pendingLocation) current.location ||= pendingLocation;
      pendingLocation = ''; continue;
    }
    if (/^\s*(?:✔|ℹ|ok \d+\b|# Subtest:)/.test(line)) current = null;
    if (current && details && !current.diagnostic) {
      const error = /^\s*(?:error:\s*|([A-Za-z]*Error(?:\s*\[[A-Z_]+\])?:\s*))(.*)$/.exec(line);
      if (error) {
        const message = ((error[1] || '') + error[2]).replace(/^(['"])(.*)\1$/, '$2');
        if (/^\|[-+]?\s*$/.test(message)) current.errorBlock = true;
        else current.diagnostic = nativeText(message, 140);
      } else if (current.errorBlock && /^\s{4,}\S/.test(line)) {
        current.diagnostic = nativeText(line, 140);
      }
    }
    if (current && details && /^\s*stack:\s*\|[-+]?\s*$/.test(line)) current.inStack = true;
    if (current && details && !current.assertionFrame && (current.inStack || /^\s*at\s/.test(line))) {
      const frame = sourceFrame({failure:line});
      if (frame) { current.location = frame; current.assertionFrame = true; }
    }
    if (current && !current.location && /(?:scripts|tests|desktop)[\\/]/.test(line)) {
      current.location = sourceFrame({failure:line.replace(/["']\s*$/, '')});
    }
  }
  return records.map(record => ({source:nativeText(source,160), profile:'native tests',
    message:safeDiagnosticText('Failed native test: '+record.name+(record.diagnostic?' — '+record.diagnostic:'')+(record.location?' — at '+record.location:''))}));
}

function boundedNativeLog(filename, size) {
  const start = Math.max(0, size - MAX_NATIVE_LOG_BYTES), buffer = Buffer.alloc(Math.min(size, MAX_NATIVE_LOG_BYTES));
  const descriptor = fs.openSync(filename,'r'); let used = 0;
  try { while (used < buffer.length) { const read = fs.readSync(descriptor,buffer,used,buffer.length-used,start+used); if (!read) break; used += read; } }
  finally { fs.closeSync(descriptor); }
  const text = buffer.subarray(0,used).toString('utf8');
  return start ? text.slice(text.indexOf('\n') + 1) : text;
}

/** Read bounded JSON and the exact native CI log inside QA; do not follow links. */
export function collectFailureSummaries(directory) {
  const root = path.resolve(directory), failures = [], warnings = [];
  let inspected = 0;
  const visit = current => {
    if (inspected >= MAX_FILES || failures.length >= MAX_FAILURES) return;
    for (const item of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (++inspected > MAX_FILES || failures.length >= MAX_FAILURES) break;
      const filename = path.join(current, item.name);
      if (item.isSymbolicLink()) continue;
      if (item.isDirectory()) { visit(filename); continue; }
      if (!item.isFile()) continue;
      const relative = path.relative(root, filename);
      if (item.name === 'ci-native160.log' || item.name === 'native.log') {
        try {
          const size = fs.statSync(filename).size;
          if (size > MAX_NATIVE_LOG_BYTES) warnings.push('Native failure diagnostics read only the last '+MAX_NATIVE_LOG_BYTES+' bytes: '+nativeText(relative,160));
          const text = boundedNativeLog(filename,size), details = item.name === 'native.log';
          failures.push(...nativeLogFailures(text,relative,{details}).slice(0,MAX_FAILURES-failures.length));
          if (details) {
            const parsed = parseNativeCounts(text);
            warnings.push(parsed.complete
              ? 'Observed native log footer '+nativeText(relative,160)+': '+Object.entries(parsed.counts).map(([key,n])=>key+'='+n).join(', ')+'. Diagnostic only; original result unchanged.'
              : 'Native log footer is incomplete: '+nativeText(relative,160)+'. Counters are not inferred; original result unchanged.');
          }
        } catch { warnings.push('Unreadable native QA log: '+nativeText(relative,160)); }
        continue;
      }
      if (item.name !== 'receipt.json' && !/(?:^|[-_])(?:report|summary|failure)\.json$/.test(item.name)) continue;
      if (fs.statSync(filename).size > MAX_REPORT_BYTES) {
        warnings.push('Skipped oversized QA report: ' + safeDiagnosticText(relative, 160));
        continue;
      }
      try {
        let report = JSON.parse(fs.readFileSync(filename, 'utf8'));
        if (item.name === 'receipt.json') {
          if (report?.version !== 1 || report.kind !== 'native-shard186' || report.accepted !== false || typeof report.failure !== 'string') continue;
          const index = Number.isSafeInteger(report.index) && report.index >= 1 && report.index <= 32 ? report.index : '?';
          report = {pass:false,stage:'native shard '+index,failure:report.failure};
        }
        failures.push(...reportFailures(report, relative).slice(0, MAX_FAILURES - failures.length));
      } catch {
        warnings.push('Unreadable QA report: ' + safeDiagnosticText(relative, 160));
      }
    }
  };
  try {
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) warnings.push('QA report directory is unavailable.');
    else visit(root);
  } catch {
    warnings.push('QA report directory is unavailable.');
  }
  if (inspected >= MAX_FILES) warnings.push('QA report scan reached its file limit.');
  return { failures, warnings: warnings.slice(0, MAX_FAILURES), inspected };
}

const escapeCommand = value => value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
export function annotationLines(summary) {
  const lines = [];
  for (const failure of summary.failures) {
    const title = escapeCommand(safeDiagnosticText(failure.profile, 80).replace(/[:,]/g, ' '));
    const body = escapeCommand(safeDiagnosticText(failure.source + ' — ' + failure.message, 680));
    lines.push('::error title=DEADWALL ' + title + '::' + body);
  }
  for (const warning of summary.warnings) lines.push('::warning::' + escapeCommand(safeDiagnosticText(warning)));
  if (!summary.failures.length) lines.push('::warning::The failed QA step did not leave an accessible structured failure report; its original failure remains unchanged.');
  return lines;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directoryIndex = process.argv.indexOf('--directory');
  const directory = directoryIndex >= 0 ? process.argv[directoryIndex + 1] : 'artifacts/qa';
  for (const line of annotationLines(collectFailureSummaries(directory || 'artifacts/qa'))) console.log(line);
}
