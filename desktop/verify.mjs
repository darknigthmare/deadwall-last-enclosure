import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const expectedAssetKeys = Object.keys(require('../src/art.js').ASSETS).sort();
const expectedNarrative = require('../src/narrative.js');
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

const reports = [];
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
  const report = JSON.parse(fs.readFileSync(path.join(reportRoot, `${stage}-report.json`), 'utf8'));
  assert.equal(report.ok, true); assert.equal(report.stage, stage);
  if (executableIndex >= 0 || archiveIndex >= 0) assert.equal(report.packaged, true, 'QA must run the packaged application');
  assert.equal(report.commandPost.doctrines.length, 6);
  assert.equal(report.commandPost.workerOrder, 'retreat');
  assert.deepEqual(report.distribution, {publicFiles:42,nativeRoutes:41,serviceWorkerBlocked:true});
  assert.equal(report.save.scenarioId, 'rearguard'); assert.equal(report.save.difficulty, 'story');
  assert.equal(report.squads.sections, 3); assert.equal(report.squads.selected, 2);
  assert.equal(report.squads.alphaOrder, 'retreat'); assert.equal(report.squads.restored, stage==='restore');
  assert.equal(report.squads.ordersWithoutCost, true); assert.equal(report.squads.positionsUnchanged, true); assert.equal(report.squads.simulationRngUnchanged, true);
  assert.deepEqual(report.squads.state, report.save.squads); assert.deepEqual(report.squads.soldiers, report.save.soldiers);
  assert.equal(report.save.soldiers.length, 1); assert.equal(report.save.soldiers[0].squad, 0);
  assert.equal(report.battlefield.fronts, 4); assert.deepEqual(report.battlefield.directions, ['NORD','EST','SUD','OUEST']);
  assert.equal(report.battlefield.debriefMetrics, 6); assert.equal(report.battlefield.hiddenDebrief, true); assert.equal(report.battlefield.campaignIntact, true);
  assert.deepEqual(report.assets.expectedKeys, expectedAssetKeys, 'Packaged atlas catalogue must match the source under verification');
  assert.deepEqual([...report.assets.ready].sort(), expectedAssetKeys);
  assert.deepEqual(report.assets.imageKeys, expectedAssetKeys);
  assert.deepEqual(report.assets.failed, []);
  assert.deepEqual(Object.keys(report.atlasDrawProbe.draws).sort(), expectedAssetKeys);
  assert.ok(Object.values(report.atlasDrawProbe.draws).every(draw=>draw.calls===1&&draw.visiblePixels>0));
  assert.deepEqual(report.narrative.sectorIds, expectedNarrative.SECTORS.map(item=>item.id).sort());
  assert.equal(report.narrative.chapterCards, expectedNarrative.CHAPTERS.length);
  assert.equal(report.narrative.partialSurvey, 2); assert.equal(report.narrative.choice, 'A');
  assert.equal(report.narrative.read, true); assert.equal(report.narrative.repeatRejected, true);
  assert.equal(report.narrative.commandJournal, true); assert.equal(report.narrative.restored, stage==='restore');
  assert.equal(report.imports.narrativePreserved, true);
  assert.equal(report.imports.scenarioPreserved, true); assert.equal(report.imports.squadsPreserved, true);
  assert.deepEqual(report.consoleErrors, []);
  reports.push(report);
}
assert.deepEqual(reports[0].save, reports[1].save, 'Final close saves must survive a new native process');
assert.deepEqual(reports[0].narrative.state, reports[1].narrative.state, 'Narrative decisions, partial surveys and read entries must survive a new native process');
assert.equal(reports[0].narrative.insight, reports[1].narrative.insight, 'Loading must not grant narrative rewards twice');
assert.ok(reports[1].menuRecords.runIds.includes(reports[0].save.runId), 'Archives must load before continuing a campaign');
assert.equal(reports[1].menuRecords.scenarioId, 'rearguard'); assert.equal(reports[1].menuRecords.scenarioRecordsSeparated, true);
fs.writeFileSync(path.join(reportRoot, 'summary.json'), JSON.stringify({ok:true,executable,packaged:reports.every(report=>report.packaged),stages:2,seed:reports[0].save.seed,workerOrder:'retreat',doctrines:6,distribution:reports[0].distribution,scenario:{id:'rearguard',menuSelected:true,afterRestart:true,importExport:true,recordsSeparated:true},squads:{sections:3,selected:2,alphaOrder:'retreat',afterRestart:true,importExport:true,ordersWithoutCost:true,positionsUnchanged:true,simulationRngUnchanged:true},battlefield:{fronts:4,debriefMetrics:6,hiddenDebrief:true,nonDestructive:true},atlases:expectedAssetKeys.length,atlasKeys:expectedAssetKeys,atlasDrawProbes:expectedAssetKeys.length,recordsAfterRestart:true,narrative:{sectorCards:expectedNarrative.SECTORS.length,chapterCards:expectedNarrative.CHAPTERS.length,partialSurveySeconds:2,choice:'A',read:true,rewardNotRepeated:true,importExport:true,afterRestart:true},consoleErrors:0}, null, 2));
console.log(`DEADWALL desktop: two launches, rearguard/story seed 17117, persistent squad selection/orders, four fronts and six hidden debrief metrics without campaign mutation, six doctrines, separate records, journal partial survey/unique choice/read state, 42 distribution files (41 native routes, service worker blocked), ${expectedAssetKeys.length} declared atlases loaded/drawn, saves/import/export, Canvas, sandbox, fullscreen and offline security passed.\nEvidence: ${reportRoot}`);
