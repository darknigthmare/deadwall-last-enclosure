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

test('CI diagnostic redaction handles synthetic environment names with prefixes and suffixes', async () => {
  const {safeDiagnosticText} = await helper;
  // Every value below is an explicit fixture, never an environment lookup.
  for (const name of ['GITHUB_TOKEN', 'VERCEL_TOKEN', 'AWS_SECRET_ACCESS_KEY', 'API_KEY', 'CI_API_KEY_TEST',
    'NPM_TOKEN_2', 'TOKEN2', 'MY_PASSWORD_BACKUP', 'APP_AUTHORIZATION_HEADER', 'CI_PRIVATE_KEY',
    'service-access-key-prod', 'clientSecret', 'cloudApiKey', 'GITHUBTOKEN']) {
    const actual = safeDiagnosticText('Real stock assertion ' + name + '=FAKE_ONLY_VALUE room=T047');
    assert.doesNotMatch(actual, /FAKE_ONLY_VALUE/, name);
    assert.match(actual, /^Real stock assertion /);
    assert.match(actual, /room=T047$/);
    assert.equal((actual.match(/\[credential removed\]/g) || []).length, 1, name);
  }
});

test('CI diagnostic redaction inspects quoted and nested JSON keys and complete escaped values', async () => {
  const {safeDiagnosticText} = await helper;
  const fixtures = [
    JSON.stringify({payload: {GITHUB_TOKEN: 'FAKE_ONLY_FIRST"FAKE_ONLY_SECOND', API_KEY: 'FAKE_ONLY_THIRD\\FAKE_ONLY_FOURTH'}, site: 'T047', count: 2}),
    "{'VERCEL_TOKEN':'FAKE_ONLY_FIRST\\'FAKE_ONLY_SECOND','site':'T047'}",
    '{"GITHUB_\\u0054OKEN":"FAKE_ONLY_UNICODE","site":"T047"}',
    'payload={"AWS_SECRET_ACCESS_KEY":"FAKE_ONLY_NESTED","site":"T047"}',
    'GITHUB_TOKEN="FAKE_ONLY_UNFINISHED remaining words\nroom=T047'
  ];
  for (const fixture of fixtures) {
    const actual = safeDiagnosticText(fixture);
    assert.doesNotMatch(actual, /FAKE_ONLY|remaining words/, fixture);
    assert.match(actual, /T047/, fixture);
    assert.match(actual, /\[credential removed\]/, fixture);
  }
});

test('CI diagnostic redaction removes complete synthetic raw cookie headers through the line boundary', async () => {
  const {safeDiagnosticText} = await helper;
  for (const name of ['Cookie', 'Cookies', 'rawCookie', 'cOoKiE', 'Set-Cookie', 'sEt-CoOkIe', 'COOKIE_HEADER', 'SESSION_COOKIE', 'Set_Cookie', 'COOKIES2', 'Cookie2_HEADER']) {
    for (const newline of ['\n', '\r\n', '\r']) {
      for (const contents of ['session=FAKE_ONLY_FIRST; refresh=FAKE_ONLY_SECOND', '"session=FAKE_ONLY_FIRST"; refresh=FAKE_ONLY_SECOND', '', '   ', '\t']) {
        const actual = safeDiagnosticText(name + ': ' + contents + newline + 'room=T047');
        assert.equal(actual, '[credential removed] room=T047', name + JSON.stringify({newline, contents}));
      }
    }
  }
});

test('CI diagnostic redaction removes Set-Cookie expiry commas and every synthetic attribute', async () => {
  const {safeDiagnosticText} = await helper;
  const actual = safeDiagnosticText('Failed stock assertion Set-Cookie: session=FAKE_ONLY_FIRST; Expires=Wed, 21 Oct 2037 07:28:00 GMT; Path=/FAKE_ONLY_PATH; HttpOnly; refresh=FAKE_ONLY_SECOND\nsite=T047');
  assert.equal(actual, 'Failed stock assertion [credential removed] site=T047');
});

test('CI diagnostic cookie redaction preserves fields after complete quoted JSON values', async () => {
  const {safeDiagnosticText} = await helper;
  for (const name of ['Cookie', 'Cookies', 'rawCookie', 'cOoKiE', 'Set-Cookie', 'sEt-CoOkIe', 'COOKIE_HEADER', 'SESSION_COOKIE', 'Set_Cookie', 'COOKIES2', 'Cookie2_HEADER']) {
    const fixture = JSON.stringify({headers: {[name]: 'session=FAKE_ONLY_FIRST; Expires=Wed, 21 Oct 2037 07:28:00 GMT; refresh="FAKE_ONLY_SECOND"'}, site: 'T047', count: 2});
    const actual = safeDiagnosticText(fixture);
    assert.doesNotMatch(actual, /FAKE_ONLY|Expires|2037/);
    assert.match(actual, /"site":"T047","count":2\}$/);
    assert.equal((actual.match(/\[credential removed\]/g) || []).length, 1, name);
  }
});

test('CI native annotations remove complete synthetic cookie headers while retaining the failed assertion', async () => {
  const {nativeLogFailures, annotationLines} = await helper;
  const text = ['not ok 1 - real stock assertion Cookie: session=FAKE_ONLY_TITLE; refresh=FAKE_ONLY_TITLE_TAIL',
    '  ---', '  error: |-', '    AssertionError: Set-Cookie: session=FAKE_ONLY_DETAIL; Expires=Wed, 21 Oct 2037 07:28:00 GMT; refresh=FAKE_ONLY_DETAIL_TAIL',
    '  stack: |-', '    at TestContext.<anonymous> (tests/ci-failure-summary.test.cjs:37:2)', '  ...'].join('\n');
  const failures = nativeLogFailures(text, 'native.log', {details: true});
  assert.equal(failures.length, 1);
  const annotation = annotationLines({failures, warnings: []}).join('\n');
  assert.doesNotMatch(annotation, /FAKE_ONLY|Expires|2037/);
  assert.match(annotation, /real stock assertion/);
  assert.match(annotation, /tests\/ci-failure-summary\.test\.cjs:37:2/);
});

test('CI diagnostic redaction preserves useful test names, source locations and ordinary object fields', async () => {
  const {safeDiagnosticText} = await helper;
  for (const actual of [
    'Real finite stock assertion at tests/ci-failure-summary.test.cjs:37:2 room=T047 biome=wetlands key=door tokenizer=ready passwordless=true secretariat=open',
    '{"site":"T047","tokenizer":"ready","passwordless":true,"secretariat":"open","key":"door"}',
    'Reload then Continue preserves the worker tools and the medical cabinet'
  ]) assert.equal(safeDiagnosticText(actual), actual);
});

test('CI native failure annotations redact synthetic compound credentials from both titles and details', async () => {
  const {nativeLogFailures, annotationLines} = await helper;
  const text = ['not ok 1 - real stock assertion GITHUB_TOKEN=FAKE_ONLY_TITLE', '  ---',
    '  error: |-', '    AssertionError: {"VERCEL_TOKEN":"FAKE_ONLY_DETAIL\\"FAKE_ONLY_TAIL"}', '  stack: |-',
    '    at TestContext.<anonymous> (tests/ci-failure-summary.test.cjs:37:2)', '  ...'].join('\n');
  const failures = nativeLogFailures(text, 'native.log', {details: true});
  assert.equal(failures.length, 1);
  const annotation = annotationLines({failures, warnings: []}).join('\n');
  assert.doesNotMatch(annotation, /FAKE_ONLY/);
  assert.match(annotation, /real stock assertion/);
  assert.match(annotation, /tests\/ci-failure-summary\.test\.cjs:37:2/);
  assert.ok(annotation.length < 900);
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
    fs.writeFileSync(path.join(root,'oversized-report.json'),' '.repeat(2*1024*1024+1));
    fs.writeFileSync(path.join(outside,'report.json'),JSON.stringify({ok:false,failure:'Outside report must not appear'}));
    try {fs.symlinkSync(outside,path.join(root,'linked'),'junction');} catch (error) {if(!['EPERM','EACCES'].includes(error.code))throw error;}
    const result=collectFailureSummaries(root);
    assert.equal(result.failures.length,1);
    assert.equal(result.failures[0].profile,'laptop');
    assert.equal(result.warnings.length,1);
    assert.ok(result.warnings[0].includes('oversized-report.json'));
  } finally {fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true});}
});

test('CI preserves a full visual report above one MiB without publishing its atlas body', async () => {
  const {collectFailureSummaries,annotationLines} = await helper;
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-ci-visual-report-'));
  try {
    // The complete world153 report measured 1,056,606 bytes. Its failing check
    // must remain readable alongside full atlas evidence, not disappear.
    const report = {pass:false,profiles:[{viewport:{name:'mobile'},pass:false,
      checks:[{name:'Prepared exterior event is still pending after the native ascent',pass:false}],
      atlasEvidence:'x'.repeat(1056606)}]};
    fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report));
    const result = collectFailureSummaries(root);
    assert.deepEqual(result.warnings,[]);
    assert.equal(result.failures.length,1);
    assert.equal(result.failures[0].profile,'mobile');
    assert.equal(result.failures[0].message,'Failed check: Prepared exterior event is still pending after the native ascent');
    const lines=annotationLines(result);
    assert.equal(lines.length,1);assert.ok(lines[0].length<900);
    assert.ok(!lines[0].includes('xxxxxxxx'));
  } finally {fs.rmSync(root,{recursive:true,force:true});}
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

// Declared native-shard186 evidence. These fixtures exercise the diagnostic
// reader; they do not represent a successful or failed real CI execution.
const shard186Footer = '# tests 3\n# suites 0\n# pass 2\n# fail 1\n# cancelled 0\n# skipped 0\n# todo 0\n';
const shard186Receipt = () => ({version:1,kind:'native-shard186',index:1,count:6,accepted:false,
  failure:'Failed or interrupted tests',counts:{tests:999999,suites:9,pass:999999,fail:0,cancelled:0,skipped:0,todo:0}});
function shard186Tap(footer = shard186Footer) {
  return ['TAP version 13','ok 1 - first declared passing case',
    'not ok 2 - finite stock survives Continue','  ---','  duration_ms: 3.21',"  type: 'test'",
    "  location: '/private/runner/project/tests/ci-failure-summary.test.cjs:211:1'",
    "  failureType: 'testCodeFailure'",'  error: |-',
    '    Expected values to be strictly equal:',"  code: 'ERR_ASSERTION'",'  stack: |-',
    '    TestContext.<anonymous> (/private/runner/project/tests/ci-failure-summary.test.cjs:244:13)',
    '    Test.runInAsyncScope (node:async_hooks:227:14)',
    '  ...','ok 3 - last declared passing case','1..3',footer].join('\n');
}
function withShard186Directory(run) {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-summary186-'));
  try {return run(directory);} finally {fs.rmSync(directory,{recursive:true,force:true});}
}

test('Native186 exact evidence names expose the Node24 TAP assertion, its source frame and all observed counters', async () => {
  const {collectFailureSummaries,annotationLines}=await helper;
  withShard186Directory(directory=>{
    const shard=path.join(directory,'native186','shard-1');fs.mkdirSync(shard,{recursive:true});
    const log=path.join(shard,'native.log'),receipt=path.join(shard,'receipt.json');
    fs.writeFileSync(log,shard186Tap());fs.writeFileSync(receipt,JSON.stringify(shard186Receipt()));
    const originalLog=fs.readFileSync(log),originalReceipt=fs.readFileSync(receipt);
    const summary=collectFailureSummaries(directory);
    assert.equal(summary.failures.length,2,'The actual native log and failed receipt both remain visible');
    const failure=summary.failures.find(row=>row.source.endsWith('native.log'));
    assert.equal(failure.profile,'native tests');
    assert.equal(failure.message,'Failed native test: finite stock survives Continue — Expected values to be strictly equal: — at tests/ci-failure-summary.test.cjs:244:13');
    assert.ok(!failure.message.includes('211:1'),'Node24 assertion stack takes precedence over the case declaration');
    const reason=summary.failures.find(row=>row.source.endsWith('receipt.json'));
    assert.equal(reason.profile,'native shard 1');assert.equal(reason.message,'Failed or interrupted tests');
    assert.equal(summary.warnings.length,1);
    assert.match(summary.warnings[0],/tests=3, suites=0, pass=2, fail=1, cancelled=0, skipped=0, todo=0/);
    assert.match(summary.warnings[0],/Diagnostic only; original result unchanged/);
    const annotation=annotationLines(summary).join('\n');
    assert.match(annotation,/native186[/\\]shard-1[/\\]native\.log/);
    for(const forbidden of ['999999','/private/','runner/project','::notice::'])assert.ok(!annotation.includes(forbidden),forbidden);
    const child=spawnSync(process.execPath,[helperPath,'--directory',directory],{encoding:'utf8'});
    assert.equal(child.status,0,'Publishing diagnostic text preserves the existing helper exit behaviour');
    assert.match(child.stdout,/Failed native test: finite stock survives Continue/);
    assert.deepEqual(fs.readFileSync(log),originalLog);assert.deepEqual(fs.readFileSync(receipt),originalReceipt);
  });
});

test('Native186 spec diagnostics retain the first assertion and source while suppressing private and injected text', async () => {
  const {collectFailureSummaries,annotationLines}=await helper;
  withShard186Directory(directory=>{
    const text=['test at /private/runner/project/tests/ci-failure-summary.test.cjs:211:1',
      '✖ paid action refuses a hidden target token=fixture-private-value (2.5ms)',
      '  AssertionError [ERR_ASSERTION]: expected a blocked service https://signed.example/private?sig=fixture-signed-value',
      '    at TestContext.<anonymous> (/private/runner/project/tests/ci-failure-summary.test.cjs:244:13)',
      '    at nextFrame (/private/runner/project/scripts/browser-metric175.mjs:75:3)',
      '::notice::untrusted',...shard186Footer.trimEnd().split('\n').map(line=>line.replace(/^# /,'ℹ '))].join('\r\n');
    fs.writeFileSync(path.join(directory,'native.log'),text);
    const summary=collectFailureSummaries(directory),annotation=annotationLines(summary).join('\n');
    assert.equal(summary.failures.length,1);
    assert.match(summary.failures[0].message,/AssertionError \[ERR_ASSERTION\]: expected a blocked service/);
    assert.match(summary.failures[0].message,/at tests\/ci-failure-summary\.test\.cjs:244:13/);
    assert.match(annotation,/tests=3, suites=0, pass=2, fail=1, cancelled=0, skipped=0, todo=0/);
    for(const forbidden of ['fixture-private-value','signed.example','fixture-signed-value','/private/','runner/project','75:3','::notice::'])assert.ok(!annotation.includes(forbidden),forbidden);
    assert.ok(annotation.length<1500);
  });
});

test('Native186 incomplete and unsafe footers never inherit counters claimed by a receipt', async () => {
  const {collectFailureSummaries,annotationLines}=await helper;
  const lines=shard186Footer.trimEnd().split('\n');
  const incomplete=lines.map((_,missing)=>lines.filter((_,index)=>index!==missing).join('\n')+'\n');
  const unsafe=[shard186Footer.replace('# tests 3','# tests 9007199254740992'),
    shard186Footer.replace('# pass 2','# pass 2\n# pass 2'),
    shard186Footer+'# tests 3\n# fail 1\n'];
  withShard186Directory(directory=>{
    fs.writeFileSync(path.join(directory,'receipt.json'),JSON.stringify(shard186Receipt()));
    for(const footer of [...incomplete,...unsafe,'']){
      fs.writeFileSync(path.join(directory,'native.log'),shard186Tap(footer));
      const summary=collectFailureSummaries(directory),annotation=annotationLines(summary).join('\n');
      assert.equal(summary.failures.length,2);
      assert.equal(summary.warnings.length,1);assert.match(summary.warnings[0],/footer is incomplete/);
      assert.match(summary.warnings[0],/Counters are not inferred; original result unchanged/);
      assert.ok(!annotation.includes('tests='),'No complete footer means no reported test totals');
      assert.ok(!annotation.includes('999999'),'Receipt-declared totals are not observed log totals');
      assert.match(annotation,/finite stock survives Continue/);assert.match(annotation,/Failed or interrupted tests/);
    }
  });
});

test('Native186 receipt alone retains a failed phase without fabricating test totals', async () => {
  const {collectFailureSummaries,annotationLines}=await helper;
  withShard186Directory(directory=>{
    fs.writeFileSync(path.join(directory,'receipt.json'),JSON.stringify(shard186Receipt()));
    const summary=collectFailureSummaries(directory),annotation=annotationLines(summary).join('\n');
    assert.deepEqual(summary.failures,[{source:'receipt.json',profile:'native shard 1',message:'Failed or interrupted tests'}]);
    assert.deepEqual(summary.warnings,[]);assert.match(annotation,/::error title=DEADWALL native shard 1/);
    assert.ok(!annotation.includes('tests='));assert.ok(!annotation.includes('999999'));
  });
});

test('Native186 receipt recognition requires an explicit failed native shard contract', async () => {
  const {collectFailureSummaries}=await helper;
  withShard186Directory(directory=>{
    const file=path.join(directory,'receipt.json'),record=shard186Receipt();
    for(const invalid of [null,[],{...record,version:2},{...record,kind:'unrelated'},
      {...record,accepted:true},{...record,accepted:undefined},{...record,failure:undefined},{...record,failure:{message:'not a text reason'}}]){
      fs.writeFileSync(file,JSON.stringify(invalid));assert.deepEqual(collectFailureSummaries(directory).failures,[]);
    }
    fs.writeFileSync(file,JSON.stringify(record));assert.equal(collectFailureSummaries(directory).failures.length,1);
  });
});

test('Native186 new log names retain truncation, link and report-size safeguards', async () => {
  const {collectFailureSummaries,annotationLines}=await helper;
  withShard186Directory(directory=>withShard186Directory(outside=>{
    fs.writeFileSync(path.join(directory,'native.log'),'x'.repeat(2*1024*1024+20)+'\n'+shard186Tap());
    fs.writeFileSync(path.join(directory,'ignored.log'),'not ok 7 - ignored arbitrary log\n');
    fs.writeFileSync(path.join(directory,'receipt.json'),'x'.repeat(2*1024*1024+1));
    fs.writeFileSync(path.join(outside,'native.log'),'not ok 9 - external linked native log\n');
    try {fs.symlinkSync(outside,path.join(directory,'linked'),'junction');} catch(error) {if(!['EPERM','EACCES'].includes(error.code))throw error;}
    const summary=collectFailureSummaries(directory),annotation=annotationLines(summary).join('\n');
    assert.equal(summary.failures.length,1);assert.equal(summary.warnings.length,3);
    assert.ok(summary.warnings.some(line=>/last 2097152 bytes/.test(line)));
    assert.ok(summary.warnings.some(line=>/oversized QA report: receipt\.json/.test(line)));
    assert.ok(summary.warnings.some(line=>/tests=3, suites=0, pass=2, fail=1, cancelled=0, skipped=0, todo=0/.test(line)));
    assert.ok(!annotation.includes('ignored arbitrary log'));assert.ok(!annotation.includes('external linked native log'));
    assert.match(annotation,/finite stock survives Continue/);
  }));
});

test('Native186 a complete zero-failure footer remains diagnostic and cannot qualify an otherwise failed step', async () => {
  const {collectFailureSummaries,annotationLines}=await helper;
  withShard186Directory(directory=>{
    fs.writeFileSync(path.join(directory,'native.log'),shard186Footer.replace('# pass 2','# pass 3').replace('# fail 1','# fail 0'));
    const summary=collectFailureSummaries(directory),lines=annotationLines(summary),annotation=lines.join('\n');
    assert.deepEqual(summary.failures,[]);assert.equal(lines.length,2);
    assert.match(annotation,/tests=3, suites=0, pass=3, fail=0, cancelled=0, skipped=0, todo=0/);
    assert.match(annotation,/Diagnostic only; original result unchanged/);
    assert.match(annotation,/original failure remains unchanged/);
    assert.ok(lines.every(line=>line.startsWith('::warning::')));
    assert.ok(!annotation.includes('accepted'));assert.ok(!annotation.includes('qualified'));
  });
});
