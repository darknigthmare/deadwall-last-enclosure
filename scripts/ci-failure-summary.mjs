import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_FILES = 2048;
const MAX_REPORT_BYTES = 1024 * 1024;
const MAX_FAILURES = 24;

/** CI annotations contain diagnostic text only, never report bodies or signed URLs. */
export function safeDiagnosticText(value, limit = 480) {
  return String(value ?? '')
    .replace(/(?:[a-z][a-z0-9+.-]*:\/\/|\bdata:|\bblob:)[^\s<>"']*/gi, '[URL removed]')
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/_.=-]+/gi, '[credential removed]')
    .replace(/\b(?:access[_-]?token|refresh[_-]?token|token|secret|password|authorization|cookie|api[_-]?key|credential)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, '[credential removed]')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function firstLine(value) {
  return String(value ?? '').split(/\r?\n/, 1)[0];
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
    failures.push({
      source: safeDiagnosticText(source, 160),
      profile: safeDiagnosticText(label || item.stage || 'verification', 80),
      message: safeDiagnosticText(message)
    });
  };
  if (Array.isArray(report.profiles)) {
    for (const profile of report.profiles) append(profile, profile?.viewport?.name || profile?.stage || 'browser profile');
  }
  if (!failures.length || report.cleanupFailure) append(report, report.stage || 'verification');
  return failures.slice(0, MAX_FAILURES);
}

/** Read only bounded JSON reports inside the QA directory; do not follow links. */
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
      if (!item.isFile() || !/(?:^|[-_])(?:report|summary|failure)\.json$/.test(item.name)) continue;
      const relative = path.relative(root, filename);
      if (fs.statSync(filename).size > MAX_REPORT_BYTES) {
        warnings.push('Skipped oversized QA report: ' + safeDiagnosticText(relative, 160));
        continue;
      }
      try {
        failures.push(...reportFailures(JSON.parse(fs.readFileSync(filename, 'utf8')), relative).slice(0, MAX_FAILURES - failures.length));
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
