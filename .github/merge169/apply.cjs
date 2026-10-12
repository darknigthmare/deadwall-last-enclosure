/* One-shot, fail-closed transfer of already tested source bytes. No Git/network writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.cwd(),folder=path.join(root,'.github/merge169'),m=JSON.parse(fs.readFileSync(path.join(folder,'edits.json'),'utf8'));
const check=(ok,why)=>{if(!ok)throw Error('Merge169: '+why);};
const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const files=new Set(),staged=[];
function safe(file){
 check(typeof file==='string'&&/^(?:src\/[A-Za-z0-9.-]+\.js|scripts\/[A-Za-z0-9.-]+\.mjs|tests\/[A-Za-z0-9.-]+\.test\.cjs|tests\/fixtures\/[A-Za-z0-9.-]+\.json|docs\/codex\/[A-Za-z0-9_.-]+\.md|SOURCE_PROVENANCE\.md|sw\.js)$/.test(file),'unexpected target path');
 check(!files.has(file),'duplicate target');files.add(file);
 const parts=file.split('/');let parent=root;
 for(const part of parts.slice(0,-1)){parent=path.join(parent,part);if(fs.existsSync(parent))check(fs.lstatSync(parent).isDirectory()&&!fs.lstatSync(parent).isSymbolicLink(),'unsafe parent');}
}
check(m.base==='f98b3643bdda21592053ea1b8cd1864fe2d1224b'&&m.modified.length===18&&m.added.length===10,'unexpected manifest');
for(const r of m.modified){
 safe(r.path);const full=path.join(root,r.path);check(fs.lstatSync(full).isFile()&&!fs.lstatSync(full).isSymbolicLink(),'not a regular source');
 let b=fs.readFileSync(full);check(sha(b)===r.before,'source drift '+r.path);let end=-1;
 for(const [at,n,text] of r.edits){check(Number.isSafeInteger(at)&&Number.isSafeInteger(n)&&at>=0&&n>=0&&at>=end&&at+n<=b.length&&typeof text==='string','invalid byte edit');end=at+n;}
 for(const [at,n,text] of [...r.edits].reverse())b=Buffer.concat([b.subarray(0,at),Buffer.from(text,'utf8'),b.subarray(at+n)]);
 check(sha(b)===r.after,'output mismatch '+r.path);staged.push({path:r.path,sha:r.after,content:b});
}
for(const r of m.added){
 safe(r.path);check(!fs.existsSync(path.join(root,r.path)),'new file exists '+r.path);
 const input=path.join(folder,'files',r.path);check(fs.lstatSync(input).isFile()&&!fs.lstatSync(input).isSymbolicLink(),'unsafe new file');const b=fs.readFileSync(input);
 check(sha(b)===r.sha,'new file mismatch '+r.path);staged.push({path:r.path,sha:r.sha,content:b});
}
// Every byte and every original file is verified before any source is written.
if(!process.argv.includes('--verify'))for(const r of staged){const full=path.join(root,r.path);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,r.content);}
const dir=path.join(root,'artifacts/qa/merge169');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'verified.json'),JSON.stringify({base:m.base,modified:m.modified.length,added:m.added.length,mode:process.argv.includes('--verify')?'verified-only':'applied',files:staged.map(({path,sha})=>({path,sha}))},null,2)+'\n');
fs.writeFileSync(path.join(dir,'paths.txt'),staged.map(r=>r.path).join('\n')+'\n');
console.log('MERGE169 '+JSON.stringify({base:m.base,files:staged.length,mode:process.argv.includes('--verify')?'verified-only':'applied'}));
