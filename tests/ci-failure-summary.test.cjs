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

test('CI browser timeout includes the first verified source line and last passed check without leaking private paths', async () => {
  const {reportFailures,annotationLines}=await helper;
  const summary={failures:reportFailures({pass:false,profiles:[{viewport:{name:'desktop'},pass:false,
    checks:[{name:'Menu and genuine seed loaded',pass:true},{name:'Finite house construction complete',pass:true}],
    failure:'page.waitForFunction: Timeout 30000ms exceeded.\n    at Frame.waitForFunction (/private/runner/hidden/node_modules/playwright/lib/client/frame.js:901:7)\n    at finishConstruction (/private/runner/hidden/project/scripts/browser-city-content150.mjs:419:23)\n    at async /private/runner/hidden/project/scripts/browser-city-content150.mjs:750:9\n    token=private-token https://storage.example/private?sig=secret'
  },{view:{width:390,height:844,touch:true},pass:false,checks:[],
    failure:"locator.tap: Timeout 60000ms exceeded.\nCall log:\n  - waiting for locator('#pauseCommandButton')\n    at activate (/private/runner/hidden/project/scripts/browser-qa-common144.mjs:8:28)\n    at /private/runner/hidden/project/scripts/browser-metric175.mjs:19:10"
  }]},'city/report.json'),warnings:[]};
  assert.match(summary.failures[0].message,/page\.waitForFunction: Timeout 30000ms exceeded/);
  assert.match(summary.failures[0].message,/at scripts\/browser-city-content150\.mjs:419:23/);
  assert.match(summary.failures[0].message,/Last passed: Finite house construction complete/);
  assert.equal(summary.failures[1].profile,'browser 390x844 touch');
  assert.match(summary.failures[1].message,/^locator\.tap: Timeout 60000ms exceeded/);
  assert.match(summary.failures[1].message,/at scripts\/browser-qa-common144\.mjs:8:28/);
  assert.match(summary.failures[1].message,/Target: #pauseCommandButton/);
  assert.ok(!summary.failures[1].message.includes('Last passed:'),'A timeout before the first assertion still identifies its control');
  assert.ok(!summary.failures[1].message.includes('19:10'),'Only the first verified source frame is retained');
  const annotation=annotationLines(summary).join('\n');
  for(const privateText of ['/private/','runner/hidden','node_modules','private-token','storage.example','sig=secret','https://'])assert.ok(!annotation.includes(privateText),privateText);
  assert.ok(!annotation.includes('750:9'),'Only the first verified source location is published');
});

test('CI stack context preserves a failed assertion as the primary diagnostic', async () => {
  const {reportFailures}=await helper;
  const result=reportFailures({pass:false,profiles:[{viewport:{name:'mobile'},pass:false,
    checks:[{name:'Earlier native deposit',pass:true},{name:'Finite stock survives Continue',pass:false}],
    failure:'AssertionError: stocks differ\n    at saveContinue (C:\\private\\project\\tests\\ci-failure-summary.test.cjs:27:11)'
  }]});
  assert.match(result[0].message,/^Failed check: Finite stock survives Continue/);
  assert.match(result[0].message,/at tests\/ci-failure-summary\.test\.cjs:27:11/);
  assert.ok(!result[0].message.includes('C:'));assert.ok(!result[0].message.includes('private'));
  assert.ok(!result[0].message.includes('Last passed:'),'A failed check remains the useful assertion, not the earlier success');
});

test('CI stack context rejects unknown and traversal paths while keeping diagnostics bounded and sanitized', async () => {
  const {reportFailures,annotationLines}=await helper;
  const failures=reportFailures({pass:false,profiles:[{view:{width:844,height:390,touch:true},pass:false,
    checks:[{name:'Last check token=never-publish '+ 'x'.repeat(1000),pass:true}],
    failure:'page.waitForFunction: Timeout\n    at /private/project/scripts/../desktop/../private.cjs:4:2\n    at /private/project/scripts/no-such-ci-source.mjs:5:3\nCall log:\n  - waiting for locator(\'#safe\').getByText(\'private-label\')\n  - waiting for locator(\'[value="private-value"]\')\n  - waiting for locator(\'#safe\') https://storage.example/?sig=signed\n  - waiting for locator(\'#token=private-token\')\n  - waiting for locator(\'getByText("private-text")\')'
  }]});
  assert.equal(failures[0].profile,'browser 844x390 touch');
  assert.ok(!failures[0].message.includes('at scripts/'));assert.ok(!failures[0].message.includes('at desktop/'));
  assert.ok(!failures[0].message.includes('private'));assert.ok(!failures[0].message.includes('never-publish'));
  assert.ok(!failures[0].message.includes('Target:'),'A decorated or non-ID locator is never published');
  assert.ok(failures[0].message.length<=480);assert.ok(annotationLines({failures,warnings:[]})[0].length<900);
  const annotation=annotationLines({failures,warnings:[]}).join('\n');
  for(const text of ['private-label','private-value','private-token','private-text','storage.example','sig=signed','https://'])assert.ok(!annotation.includes(text),text);
  for(const failure of ["Timeout\n  - waiting for locator('#safe')",'Timeout\nCall log:\n  - waiting for locator(\'#'+ 'a'.repeat(65) +'\')','Timeout\n'+ 'x'.repeat(16384) +"\nCall log:\n  - waiting for locator('#safe')"]){
    assert.ok(!reportFailures({profiles:[{pass:false,failure}]})[0].message.includes('Target:'),'Locator context respects its header, ID length and stack scan bounds');
  }
  for(const view of [{width:0,height:844},{width:16385,height:844},{width:390.5,height:844},{width:'390',height:844},{width:390,height:NaN},{width:390,height:844,touch:'secret-value'}]){
    assert.equal(reportFailures({profiles:[{view,pass:false,failure:'Timeout'}]})[0].profile,'browser profile');
  }
  assert.equal(reportFailures({profiles:[{view:{width:1440,height:900,touch:false},pass:false,failure:'Timeout'}]})[0].profile,'browser 1440x900 mouse');
});

test('Native failure diagnostics: spec failure and summary identify one case with a safe source line', async () => {
 const {nativeLogFailures,annotationLines}=await helper;
 const text=['✔ passing case (1.1ms)','\u001b[31m✖ authentic finite stock assertion (3.1ms)\u001b[39m','ℹ tests 4519','ℹ fail 1','✖ failing tests:',
  'test at /private/runner/project/tests/ci-failure-summary.test.cjs:29:1','✖ authentic finite stock assertion (3.1ms)',
  '  AssertionError: token=private-value https://storage.example/private?sig=secret','    at TestContext.<anonymous> (/private/runner/project/tests/ci-failure-summary.test.cjs:31:7)'].join('\n');
 const failures=nativeLogFailures(text,'native/ci-native160.log');assert.equal(failures.length,1);
 assert.equal(failures[0].message,'Failed native test: authentic finite stock assertion — at tests/ci-failure-summary.test.cjs:29:1');
 const annotation=annotationLines({failures,warnings:[]}).join('\n');
 for(const secret of ['/private/','runner/project','private-value','storage.example','sig=secret','https://'])assert.ok(!annotation.includes(secret),secret);
});

test('Native failure diagnostics: TAP comments and successes cannot become failed tests; real stack locations remain', async () => {
 const {nativeLogFailures}=await helper;
 const text=['TAP version 13','# not ok 89 - diagnostic prose','# ✖ quoted failure (1ms)','ok 1 - real passing case',
 'not ok 2 - narrow vehicle corridor preserves finite fuel','  ---',
 "  location: '/private/root/tests/ci-failure-summary.test.cjs:57:1'",'  stack: |-',
 '    at TestContext.<anonymous> (/private/root/scripts/ci-failure-summary.mjs:44:7)','  ...'].join('\n');
 const failures=nativeLogFailures(text);assert.equal(failures.length,1);
 assert.equal(failures[0].message,'Failed native test: narrow vehicle corridor preserves finite fuel — at tests/ci-failure-summary.test.cjs:57:1');
 assert.deepEqual(nativeLogFailures('✔ all real tests passed (1ms)\nℹ fail 0\n# not ok 1 - quoted'),[]);
});

test('Native failure diagnostics: exact log traversal is bounded and ignores other names, links and credential text', async () => {
 const {collectFailureSummaries,nativeLogFailures,annotationLines}=await helper;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-native-log-')),outside=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-native-log-outside-'));
 try {
  fs.mkdirSync(path.join(root,'native'));
  fs.writeFileSync(path.join(root,'ignored.log'),'✖ ignored case (2ms)\n');
  fs.writeFileSync(path.join(root,'native','ci-native160.log'),'x'.repeat(2*1024*1024+20)+'\n✖ bounded final case token=never-publish /private/hidden (2ms)\ntest at /private/root/tests/ci-failure-summary.test.cjs:72:1\n✖ bounded final case token=never-publish /private/hidden (2ms)\n');
  fs.writeFileSync(path.join(outside,'ci-native160.log'),'✖ external linked case (2ms)\n');
  try { fs.symlinkSync(outside,path.join(root,'linked'),'junction'); } catch(error) { if(!['EPERM','EACCES'].includes(error.code))throw error; }
  const result=collectFailureSummaries(root);assert.equal(result.failures.length,1);assert.equal(result.warnings.length,1);assert.match(result.warnings[0],/last 2097152 bytes/);
  assert.match(result.failures[0].message,/at tests\/ci-failure-summary.test\.cjs:72:1/);
  const annotation=annotationLines(result).join('\n');for(const privateText of ['never-publish','/private/','external linked','ignored case'])assert.ok(!annotation.includes(privateText),privateText);
  assert.ok(annotation.length<1500);
  const capped=nativeLogFailures(Array.from({length:80},(_,i)=>'✖ failed native case '+i+' (1ms)').join('\n'));assert.equal(capped.length,24);
 } finally { fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true}); }
});
