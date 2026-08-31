import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const executableIndex = process.argv.indexOf('--executable');
const archiveIndex = process.argv.indexOf('--archive');
if (executableIndex >= 0 && archiveIndex >= 0) throw new Error('Choose either --executable or --archive, not both.');
const outputIndex = process.argv.indexOf('--output');
const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : fs.mkdtempSync(path.join(os.tmpdir(), 'deadwall-desktop-qa-'));
fs.mkdirSync(outputRoot, { recursive:true });
const reportRoot = fs.mkdtempSync(path.join(outputRoot, 'run-'));
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
delete env.NODE_OPTIONS;
delete env.NODE_EXTRA_CA_CERTS;

let executable;
if (archiveIndex >= 0) {
  if (process.platform !== 'win32') throw new Error('Windows archive verification must run on Windows.');
  const archive = path.resolve(process.argv[archiveIndex + 1]);
  const unpacked = path.join(reportRoot, 'unpacked');
  await new Promise((resolve,reject) => {
    const child = spawn('powershell.exe', ['-NoProfile','-NonInteractive','-Command','Expand-Archive -LiteralPath $env:DEADWALL_VERIFY_ARCHIVE -DestinationPath $env:DEADWALL_VERIFY_DESTINATION'], { env:{...env,DEADWALL_VERIFY_ARCHIVE:archive,DEADWALL_VERIFY_DESTINATION:unpacked}, windowsHide:true, stdio:'inherit' });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Archive extraction failed (${code})`)));
  });
  executable = path.join(unpacked, 'DEADWALL-win32-x64', 'DEADWALL.exe');
  if (!fs.existsSync(executable)) throw new Error('The archive does not contain the complete DEADWALL Windows distribution.');
} else executable = executableIndex >= 0 ? path.resolve(process.argv[executableIndex + 1]) : require('electron');

for (const stage of ['create','restore']) {
  const args = [...(executableIndex >= 0 || archiveIndex >= 0 ? [] : [root]), '--desktop-smoke', reportRoot, stage];
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd:root, env, windowsHide:true, stdio:['ignore','pipe','pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    const timeout = setTimeout(() => { child.kill(); reject(new Error(`Electron ${stage} timed out after 60s`)); }, 60000);
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('close', code => {
      clearTimeout(timeout);
      fs.writeFileSync(path.join(reportRoot, `${stage}-process.log`), stdout + stderr);
      if (code !== 0 || !fs.existsSync(path.join(reportRoot, `${stage}-report.json`))) reject(new Error(`Electron ${stage} failed (${code})\n${stdout}${stderr}`));
      else resolve();
    });
  });
}
console.log(`DEADWALL desktop: two launches, persistent save, Canvas, sandbox, fullscreen, offline security passed.\nEvidence: ${reportRoot}`);
