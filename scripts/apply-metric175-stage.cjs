'use strict';
// One-shot, hash-checked transport for this exact PR head. Never executes payload
// code: it applies bounded byte edits, verifies all files, then returns to CI.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),cp=require('node:child_process');
const expected='a9c00271222cd2db66221f783a5111c8de205fa7102c21478dfebe2e8380c095';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=zlib.gunzipSync(Buffer.from([0,1].map(i=>fs.readFileSync('scripts/metric175-stage.'+i+'.b64','utf8').trim()).join(''),'base64'),{maxOutputLength:1000000});
if(sha(raw)!==expected)throw Error('Transport checksum mismatch');
const payload=JSON.parse(raw),branch='fix/metric-scale-road-access-174',root=process.cwd();
if(payload.base!=='0288c7ad0b0c9f531723d19e463eb0d264141477'||payload.branch!==branch||payload.files.length!==18)throw Error('Wrong transport target');
const mode=process.argv[2],allowed=new Set(['.github/workflows/metric175.yml','src/barricades134.js','src/core.js','src/expeditions.js','src/exploration-125.js','src/fieldcraft.js','src/frontage174.js','src/frontier-world.js','src/frontier.js','src/metric-contract174.js','src/tactics.js','sw.js','docs/METRIC_RIGID_175.md','scripts/metric175-fixtures.cjs','scripts/browser-metric175.mjs','tests/metric-body175.test.cjs','tests/metric-corridor175.test.cjs','tests/frontage-followup175.test.cjs']);
// Replace only the browser harness after its first native execution exposed an
// invalid paused refuel attempt. Gameplay payload and its hash stay unchanged.
const browserFile='scripts/browser-metric175.mjs',browserSource=fs.readFileSync('scripts/metric175-browser-followup.txt');
if(sha(browserSource)!=='fe8c62fd70e49e7e06f4da87fa84d1dfacb1696224c7af2f2727a57a2027f21c')throw Error('Browser follow-up checksum mismatch');
const browserRow=payload.files.find(f=>f.path===browserFile);
if(browserRow.before!==null||browserRow.edits.length!==1||browserRow.edits[0].start!==0||browserRow.edits[0].end!==0)throw Error('Unexpected browser transport shape');
browserRow.edits[0].insert=browserSource.toString('utf8');browserRow.after=sha(browserSource);
const files=[];
for(const row of payload.files){
 if(!allowed.delete(row.path))throw Error('Unexpected or duplicate path');
 const target=path.resolve(root,row.path);if(!target.startsWith(root+path.sep)||fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw Error('Unsafe file');
 const exists=fs.existsSync(target),before=exists?fs.readFileSync(target):Buffer.alloc(0);
 if(mode==='verify'){if(!exists||sha(before)!==row.after)throw Error('Validated file changed: '+row.path);continue;}
 if(mode!=='stage')throw Error('Expected stage or verify');
 if(row.before===null?exists:!exists||sha(before)!==row.before)throw Error('Concurrent source mismatch: '+row.path);
 let previous=0;for(const e of row.edits){if(!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<previous||e.end<e.start||e.end>before.length||typeof e.insert!=='string')throw Error('Invalid edit');previous=e.end;}
 let data=before;for(const e of [...row.edits].reverse())data=Buffer.concat([data.subarray(0,e.start),Buffer.from(e.insert,'utf8'),data.subarray(e.end)]);
 if(sha(data)!==row.after)throw Error('Result checksum mismatch: '+row.path);files.push({target,data});
}
if(allowed.size)throw Error('Incomplete manifest');
if(mode==='stage'){
 const head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(head!==process.env.GITHUB_SHA||process.env.GITHUB_REF!=='refs/heads/'+branch)throw Error('Not the exact intended branch run');
 for(const f of files){fs.mkdirSync(path.dirname(f.target),{recursive:true});fs.writeFileSync(f.target,f.data);}
}
fs.mkdirSync('artifacts/qa/metric175-stage',{recursive:true});
fs.writeFileSync('artifacts/qa/metric175-stage/source-manifest.json',JSON.stringify({sourceBase:payload.base,stagingCommit:process.env.GITHUB_SHA,files:payload.files.map(({path,before,after})=>({path,before,after}))},null,2)+'\n');
fs.writeFileSync('artifacts/qa/metric175-stage/paths.json',JSON.stringify(payload.files.map(f=>f.path)));
console.log(JSON.stringify({mode,files:payload.files.length,checksum:expected}));
