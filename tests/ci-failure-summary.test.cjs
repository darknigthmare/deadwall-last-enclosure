'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const helperPath = path.resolve(__dirname, '../scripts/ci-failure-summary.mjs');
const helper = import(pathToFileURL(helperPath).href);

test('CI annotations retain the failed browser check and Windows launch stage', async () => {
  const {reportFailures} = await helper;
  const browser = reportFailures({pass:false, profiles:[
    {viewport:{name:'desktop'},pass:true,checks:[{name:'Desktop loaded',pass:true}]},
    {viewport:{name:'mobile'},pass:false,checks:[{name:'Imported campaign restores its finite stocks',pass:false}],failure:'AssertionError: details'}
  ]}, 'browser/report.json');
  const windows = reportFailures({ok:false,stage:'verify-create',error:{name:'AssertionError',message:'Canvas readback rejected a blank frame'}}, 'windows/verification-failure.json');
  assert.deepEqual(browser, [{source:'browser/report.json',profile:'mobile',message:'Failed check: Imported campaign restores its finite stocks'}]);
  assert.equal(windows[0].profile, 'verify-create');
  assert.equal(windows[0].message, 'Canvas readback rejected a blank frame');
});

test('CI diagnostic text removes URLs, credential assignments and authorization values', async () => {
  const {safeDiagnosticText} = await helper;
  const text = safeDiagnosticText('Failure https://storage.example/secret?sig=signed token=abc123 password="private value" Bearer dGVzdA== api_key=xyz cookie=session123');
  for (const forbidden of ['https://', 'storage.example', 'signed', 'abc123', 'private value', 'dGVzdA==', 'xyz', 'session123']) assert.ok(!text.includes(forbidden), forbidden);
  assert.ok(text.startsWith('Failure [URL removed]'));
});

test('Native child assertion remains visible behind the launch wrapper', async () => {
  const {reportFailures} = await helper;
  const result=reportFailures({ok:false,stage:'launch-create',error:{message:'Electron create failed (1)',details:['AssertionError [ERR_ASSERTION]: Native atlas did not decode']}},'windows/verification-failure.json');
  assert.equal(result[0].message,'Electron create failed (1) — AssertionError [ERR_ASSERTION]: Native atlas did not decode');
});

test('CI annotation encoding cannot inject another workflow command or unbounded body', async () => {
  const {annotationLines,reportFailures} = await helper;
  const lines = annotationLines({failures:reportFailures({ok:false,stage:'create,evil:value',failure:'Error: 100% failed\n::notice::injected '+ 'x'.repeat(10000)}),warnings:[]});
  assert.equal(lines.length,1);
  assert.ok(lines[0].includes('100%25 failed'));
  assert.ok(!lines[0].includes('\n'));
  assert.ok(!lines[0].includes('::notice::'));
  assert.ok(lines[0].length < 900);
  assert.ok(!lines[0].includes('create,evil:value'));
});

test('CI report traversal accepts nested evidence and refuses linked or oversized files', async () => {
  const {collectFailureSummaries} = await helper;
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-ci-summary-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-ci-outside-'));
  try {
    fs.mkdirSync(path.join(root,'browser'));
    fs.writeFileSync(path.join(root,'browser','report.json'),JSON.stringify({pass:false,profiles:[{viewport:{name:'laptop'},pass:false,failure:'page.waitForFunction: Timeout exceeded'}]}));
    fs.writeFileSync(path.join(root,'ignored.txt'),JSON.stringify({ok:false,failure:'Should not be scanned'}));
    fs.writeFileSync(path.join(root,'oversized-report.json'),' '.repeat(1024*1024+1));
    fs.writeFileSync(path.join(outside,'report.json'),JSON.stringify({ok:false,failure:'Outside report must not appear'}));
    try {fs.symlinkSync(outside,path.join(root,'linked'),'junction');} catch (error) {if(!['EPERM','EACCES'].includes(error.code))throw error;}
    const result=collectFailureSummaries(root);
    assert.equal(result.failures.length,1);
    assert.equal(result.failures[0].profile,'laptop');
    assert.equal(result.warnings.length,1);
    assert.ok(result.warnings[0].includes('oversized-report.json'));
  } finally {fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true});}
});

test('Missing evidence stays explicit and does not change the existing QA exit code', async () => {
  const directory=path.join(os.tmpdir(),'deadwall-ci-absent-'+Date.now());
  const result=spawnSync(process.execPath,[helperPath,'--directory',directory],{encoding:'utf8'});
  assert.equal(result.status,0);
  assert.match(result.stdout,/directory is unavailable/);
  assert.match(result.stdout,/original failure remains unchanged/);
  assert.ok(!result.stdout.includes('::error'));
});

test('Missing executable leaves native failure evidence while preserving the nonzero result', async () => {
  const {collectFailureSummaries} = await helper;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-ci-native-failure-'));
  try {
    const verify = path.resolve(__dirname,'../desktop/verify.mjs');
    const result = spawnSync(process.execPath,[verify,'--executable',path.join(directory,'missing-DEADWALL.exe'),'--output',directory],{encoding:'utf8',timeout:10000});
    assert.equal(result.status,1);
    assert.match(result.stderr,/ENOENT/);
    const run = fs.readdirSync(directory).find(name=>name.startsWith('run-'));
    assert.ok(run);
    const report=JSON.parse(fs.readFileSync(path.join(directory,run,'verification-failure.json'),'utf8'));
    assert.equal(report.ok,false);
    assert.equal(report.stage,'launch-create');
    assert.equal(report.error.code,'ENOENT');
    assert.deepEqual(report.stagesCompleted,[]);
    const summary=collectFailureSummaries(directory);
    assert.equal(summary.failures.length,1);
    assert.equal(summary.failures[0].profile,'launch-create');
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});

test('CI report summary bounds the number of published failures', async () => {
  const {reportFailures} = await helper;
  const rows=Array.from({length:100},(_,i)=>({viewport:{name:'viewport-'+i},pass:false,failure:'Error: failed'}));
  assert.equal(reportFailures({pass:false,profiles:rows}).length,24);
});
