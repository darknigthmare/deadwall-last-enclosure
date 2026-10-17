'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {createHash} = require('node:crypto'), {spawnSync} = require('node:child_process');
const api = import('../scripts/ci-native186.mjs');
const root = path.resolve(__dirname, '..');
const hash = text => createHash('sha256').update(text).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const inventory = n => Array.from({length:n}, (_,i) => ({path:`tests/case-${i}.test.cjs`, bytes: 11+i*19, sha256: hash(String(i))}));
const counts = {tests:800,suites:0,pass:800,fail:0,cancelled:0,skipped:0,todo:0};
const logFor = values => 'TAP version 13\nok 1 - declared example\n' + Object.entries(values).map(([key,value])=>'# '+key+' '+value).join('\n')+'\n';
async function fixture() {
 const {planShards,commandsFor}=await api,plan=planShards(inventory(30));
 const source={head:'1'.repeat(40),tree:'2'.repeat(40),files:{'tests/example.test.cjs':hash('example')},clean:true};
 source.sha256=hash(JSON.stringify(source.files));
 const evidence=plan.shards.map(shard=>{
  const logs={syntax:'Syntax verified\n',build:'Build complete\n',pretest:'Codex generated\n',tests:logFor(counts)};
  return {logs,receipt:{version:1,kind:'native-shard186',index:shard.index,count:plan.count,plan:plan.sha256,files:shard.files,
   commands:commandsFor(shard.files),sourceBefore:copy(source),sourceAfter:copy(source),soakEnabled:true,filtersAbsent:true,runId:'sample-run',counts:copy(counts),
   results:Object.fromEntries(Object.entries(logs).map(([phase,log])=>[phase,{exitCode:0,signal:null,file:phase==='tests'?'native.log':phase+'.log',sha256:hash(log)}])),accepted:true}};
 });
 return {plan,source,evidence};
}

test('186 partition is deterministic, exhaustive and disjoint, including future test files',async()=>{
 const {planShards}=await api;
 for(const size of [6,17,447,448,900]){
  const input=inventory(size),before=copy(input),plan=planShards(input);
  assert.deepEqual(planShards([...input].reverse()),plan);assert.deepEqual(input,before);
  const files=plan.shards.flatMap(s=>s.files);assert.equal(new Set(files).size,size);assert.deepEqual(files.sort(),input.map(x=>x.path).sort());
  assert.ok(plan.shards.every(s=>s.files.length));
  assert.equal(plan.shards.reduce((n,s)=>n+s.bytes,0),input.reduce((n,f)=>n+f.bytes,0));
 }
});
test('186 the actual inventory is exactly the historical npm-test glob, not a subset',async()=>{
 const {inventoryAt,planShards,SHARDS}=await api,list=inventoryAt(root),plan=planShards(list);
 assert.ok(list.length>=447);assert.equal(plan.count,SHARDS);
 assert.deepEqual(list.map(r=>r.path),fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('.test.cjs')).sort().map(n=>'tests/'+n));
 for(const row of list)assert.equal(row.sha256,hash(fs.readFileSync(path.join(root,row.path))));
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json')));assert.equal(pkg.scripts.test,'node --test tests/*.test.cjs');assert.equal(pkg.scripts.check,'node scripts/check-syntax134.mjs && npm run build && npm test');
});
for(const mutate of [rows=>rows.push(rows[0]),rows=>rows[0].path='../outside.test.cjs',rows=>rows[0].path='tests/nested/x.test.cjs',rows=>rows[0].bytes=0,rows=>rows[0].sha256='not-a-hash'])test('186 malformed or duplicated inventory fails closed: '+mutate,async()=>{
 const {planShards}=await api,list=inventory(12);mutate(list);assert.throws(()=>planShards(list));
});
for(const count of [0,-1,1.5,33,NaN])test('186 invalid partition count '+count+' is refused',async()=>{const {planShards}=await api;assert.throws(()=>planShards(inventory(50),count));});
test('186 actual filesystem inventory rejects symlinked test files',async t=>{
 const {inventoryAt}=await api,dir=fs.mkdtempSync(path.join(os.tmpdir(),'native186-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'tests'));fs.writeFileSync(path.join(dir,'outside.cjs'),'hello');fs.symlinkSync('../outside.cjs',path.join(dir,'tests','bad.test.cjs'));assert.throws(()=>inventoryAt(dir),/ordinary/);
});
test('186 a complete six-shard receipt is qualified only from the original logs and source',async()=>{
 const {qualifyAll}=await api,{plan,source,evidence}=await fixture(),result=qualifyAll(evidence,plan,source,'sample-run');
 assert.equal(result.accepted,true);assert.equal(result.counts.tests,4800);assert.equal(result.counts.pass,4800);assert.equal(result.shards,6);assert.equal(result.testFiles,30);
 assert.equal(result.sourceTree,source.tree);assert.equal(result.soakEnabled,true);
});
for(const [name,mutate] of [
 ['missing',e=>e.pop()],['duplicate',e=>e[5]=copy(e[0])],['extra',e=>e.push(copy(e[0]))],
 ['stale plan',e=>e[0].receipt.plan='b'.repeat(64)],['stale commit',e=>e[0].receipt.sourceBefore.head='3'.repeat(40)],
 ['different tree',e=>e[0].receipt.sourceBefore.tree='4'.repeat(40)],['changed source',e=>e[0].receipt.sourceAfter.files['src/core.js']=hash('changed')],
 ['interrupted tests',e=>{e[0].receipt.results.tests.exitCode=255;e[0].receipt.results.tests.signal='SIGTERM';}],
 ['failed build',e=>e[0].receipt.results.build.exitCode=1],['missing syntax',e=>delete e[0].receipt.results.syntax],
 ['missing pretest',e=>delete e[0].logs.pretest],['tampered output',e=>e[0].logs.tests+='tampered\n'],
 ['disabled endurance',e=>e[0].receipt.soakEnabled=false],['filter environment',e=>e[0].receipt.filtersAbsent=false],
 ['CLI test-only',e=>e[0].receipt.commands.tests.splice(2,0,'--test-only')],
 ['foreign run',e=>e[0].receipt.runId='different-run'],['wrong count',e=>e[0].receipt.count=5],
 ['substituted file',e=>e[0].receipt.files[0]='tests/not-tested.test.cjs'],
 ['invented pass count',e=>e[0].receipt.counts.pass=9999],['unsafe evidence path',e=>e[0].receipt.results.tests.file='../foreign.log']
])test('186 aggregate rejects '+name+' even when accepted is claimed true',async()=>{
 const {qualifyAll}=await api,{plan,source,evidence}=await fixture();mutate(evidence);assert.throws(()=>qualifyAll(evidence,plan,source,'sample-run'));
});
for(const [name,alter]of [
 ['failed',c=>{c.fail=1;c.pass--;}],['skipped',c=>{c.skipped=1;c.pass--;}],['todo',c=>{c.todo=1;c.pass--;}],['cancelled',c=>{c.cancelled=1;c.pass--;}],
 ['empty',c=>{c.tests=c.pass=0;}],['below released baseline',c=>{c.tests=c.pass=1;}]
])test('186 '+name+' native output never qualifies',async()=>{
 const {qualifyAll}=await api,{plan,source,evidence}=await fixture();
 for(const item of evidence){alter(item.receipt.counts);item.logs.tests=logFor(item.receipt.counts);item.receipt.results.tests.sha256=hash(item.logs.tests);}
 assert.throws(()=>qualifyAll(evidence,plan,source,'sample-run'));
});
for(const text of ['TAP version 13\nok 1 - truncated\n','# tests 800\n# tests 800\n# pass 800\n',logFor(counts)+'not ok 801 - failure after a positive footer\n',logFor(counts)+'ok 802 - filtered # SKIP\n'])test('186 deceptive or incomplete footer is refused: '+text.slice(-40),async()=>{
 const {qualifyAll}=await api,{plan,source,evidence}=await fixture();evidence[0].logs.tests=text;evidence[0].receipt.results.tests.sha256=hash(text);assert.throws(()=>qualifyAll(evidence,plan,source,'sample-run'));
});
test('186 the CLI plan works without running tests or requiring mutable credentials',async()=>{
 const {planShards,inventoryAt}=await api,result=spawnSync(process.execPath,['scripts/ci-native186.mjs','plan'],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),planShards(inventoryAt(root)));
});
test('186 CLI refuses invalid arguments without writing an accepted receipt',()=>{
 for(const args of [[],['run','0','/tmp/unused'],['run','1'],['aggregate']]){
  const r=spawnSync(process.execPath,['scripts/ci-native186.mjs',...args],{cwd:root,encoding:'utf8'});assert.notEqual(r.status,0);assert.ok(!r.stdout.includes('"accepted": true'));
 }
});
test('186 CI keeps the native/test gate names and cannot turn skipped or failed shards green',()=>{
 const y=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');
 assert.match(y,/shard: \[1, 2, 3, 4, 5, 6\]/);assert.match(y,/fail-fast: false/);assert.match(y,/DEADWALL_SOAK: '1'/);
 assert.match(y,/native:\n    needs: \[native-shard\]\n    if: \$\{\{ always\(\) \}\}/);
 assert.match(y,/process\.env\.SHARD_RESULT !== "success"/);assert.match(y,/pattern: deadwall-native186-shard-\*/);
 assert.match(y,/name: deadwall-native186-aggregate/);assert.match(y,/needs: \[native, browser, windows\]/);
 assert.doesNotMatch(y,/continue-on-error:\s*true/);assert.match(y,/results\[name\]\?\.result !== "success"/);
 assert.match(y,/push:\n    branches: \[main\]\n  pull_request:\n  workflow_dispatch:/);
 const vertical=fs.readFileSync(path.join(root,'.github/workflows/vertical-personnel181.yml'),'utf8');
 assert.match(vertical,/DEADWALL CI \/ native/);assert.match(vertical,/github\.event_name != 'pull_request'/);assert.match(vertical,/npm run check/);
});

test('186 source evidence uses NUL-separated UTF-8 names and read-only checkouts never retain credentials',()=>{
 const y=fs.readFileSync(path.join(root,'.github/workflows/vertical-personnel181.yml'),'utf8');
 assert.match(y,/'--name-only','-z','--diff-filter=AM'/);assert.match(y,/decode\('utf-8'\)\.rstrip\('\\0'\)\.split\('\\0'\)/);
 const c=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');assert.match(c,/name: deadwall-native186-aggregate\n\s+overwrite: true/);
 for(const name of ['audit-regressions.yml','ci.yml','source-receipt184.yml']){
  const text=fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');
  const steps=[...text.matchAll(/- uses: actions\/checkout@v4\n([\s\S]*?)(?=\n      -|$)/g)];assert.ok(steps.length>0);
  for(const s of steps)assert.match(s[1],/persist-credentials: false/);
 }
});


test('186 every vertical QA scenario serves and records the selected built distribution',()=>{
 for(let revision=176;revision<=181;revision++){
  const source=fs.readFileSync(path.join(root,'scripts','qa-vertical'+revision+'.mjs'),'utf8');
  assert.ok(source.includes("const rootDirectory=resolve(process.env.DEADWALL_QA_ROOT||fileURLToPath(new URL('..',import.meta.url)));"),'explicit root '+revision);
  assert.ok(source.includes('createGameServer({rootDirectory})'),'server root '+revision);
  assert.ok(source.includes('const report={root:rootDirectory,'),'evidence root '+revision);
  assert.ok(!source.includes('createGameServer()'),'no silent source fallback '+revision);
 }
});
