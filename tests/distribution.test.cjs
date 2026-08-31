'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {runtimePackage,runtimePackageJson,verifyManifestFiles,sourceState,runtimeNotices}=require('../scripts/release-policy.cjs');
const {createHash}=require('node:crypto');
const {resolvePublicFile}=require('../desktop/policy.cjs');
const root=path.resolve(__dirname,'..');

function publicFiles(){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(match=>match[1]);
  const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match=>match[1]);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  const files=['index.html','manifest.json','sw.js',...scripts,...styles,...manifest.icons.map(icon=>icon.src),...Object.values(require('../src/art.js').ASSETS).map(asset=>asset.url)];
  for(const style of styles)for(const match of fs.readFileSync(path.join(root,style),'utf8').matchAll(/url\(["']?(assets\/[^)"']+)/g))files.push(match[1]);
  return [...new Set(files)].sort();
}

function fixture(t){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-distribution-'));
  t.after(()=>{
    const relative=path.relative(path.resolve(os.tmpdir()),path.resolve(directory));
    assert.ok(relative.startsWith('deadwall-distribution-')&&!relative.includes(path.sep));
    fs.rmSync(directory,{recursive:true,force:true});
  });
  return directory;
}

test('distribution: métadonnées runtime stables, sans champs supprimés par Packager',()=>{
  const source={name:'deadwall',version:'1.0.0',description:'Jeu',private:true,devDependencies:{secret:'not-shipped'},scripts:{build:'not-shipped'}};
  assert.deepEqual(runtimePackage(source),{name:'deadwall',productName:'DEADWALL',version:'1.0.0',description:'Jeu',author:'Darknigthmare',main:'desktop/main.cjs'});
  assert.equal(source.private,true,'aucune mutation du package de développement');
  assert.equal(runtimePackageJson(source),JSON.stringify(runtimePackage(source),null,2)+'\n','LF final identique au sanitizer Packager');
});

test('distribution: empreintes des vrais fichiers ASAR, liste exacte et chemins sûrs',()=>{
  const data=Buffer.from('runtime\n'),fingerprint={file:'package.json',bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};
  const manifest={files:[fingerprint]},files=['package.json','build-manifest.json'];
  assert.deepEqual(verifyManifestFiles(manifest,files,()=>data),{sourceFiles:1,archiveFiles:2});
  assert.throws(()=>verifyManifestFiles(manifest,files,()=>Buffer.from('runtime')),/ASAR file/,'un seul LF manquant doit échouer');
  for(const list of [['package.json'],[...files,'secret.json'],[...files,'package.json']])assert.throws(()=>verifyManifestFiles(manifest,list,()=>data),/file list/);
  for(const file of ['../secret','/absolute','a/../../secret','a\\secret','build-manifest.json'])assert.throws(()=>verifyManifestFiles({files:[{...fingerprint,file}]},files,()=>data),/file path/);
  assert.throws(()=>verifyManifestFiles({files:[fingerprint,fingerprint]},files,()=>data),/file path/);
});

test('distribution: Git indisponible ne peut jamais produire sourceDirty false',()=>{
  const revision={status:0,stdout:'a'.repeat(40)+'\n'},clean={status:0,stdout:''};
  assert.deepEqual(sourceState(revision,clean),{sourceRevision:'a'.repeat(40),sourceDirty:false});
  assert.equal(sourceState(revision,{status:0,stdout:' M src/game.js\n'}).sourceDirty,true);
  for(const pair of [[{status:1,stdout:''},clean],[revision,{status:1,stdout:''}],[revision,{status:0}],[{status:null,error:new Error('git missing')},clean],[{status:0,stdout:'not-a-revision'},clean]])assert.throws(()=>sourceState(...pair),/provenance/);
});

test('distribution: notices Electron/Chromium exigées et empreintes calculées',t=>{
  const directory=fixture(t);
  assert.throws(()=>runtimeNotices(directory));
  fs.writeFileSync(path.join(directory,'LICENSE'),'notice'.repeat(50));
  fs.writeFileSync(path.join(directory,'LICENSES.chromium.html'),'third-party notice'.repeat(50));
  const notices=runtimeNotices(directory);
  assert.deepEqual(notices.map(notice=>notice.file),['LICENSE','LICENSES.chromium.html']);
  assert.ok(notices.every(notice=>notice.bytes>=100&&/^[a-f0-9]{64}$/.test(notice.sha256)));
  fs.writeFileSync(path.join(directory,'LICENSE'),'');
  assert.throws(()=>runtimeNotices(directory),/notice/);
});

test('distribution: exclusions Vercel ciblées, build et données publiques conservés',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
  assert.equal(config.installCommand,'');assert.equal(config.buildCommand,'npm run build');assert.equal(config.outputDirectory,'dist');
  const patterns=fs.readFileSync(path.join(root,'.vercelignore'),'utf8').split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith('#'));
  // Deliberately limited to this file's simple root-relative exclusions; not a
  // substitute for the Vercel CLI's own upload-manifest validation.
  const ignored=filename=>patterns.some(pattern=>{
    const expression=pattern.replace(/\/$/,'').split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
    return new RegExp('^'+expression+'(?:/|$)').test(filename);
  });
  for(const file of ['artifacts/content-qa/save.json','outputs/screenshot.png','desktop/main.cjs','tests/server.test.cjs','docs/ORIGINAL_BRIEF.txt','release/game.exe','.env','.env.production','build.log'])assert.equal(ignored(file),true,file);
  for(const file of ['package.json','package-lock.json','vercel.json','scripts/build.mjs',...publicFiles()])assert.equal(ignored(file),false,file);
});

test('distribution: vrai build public sans node_modules ni installation',t=>{
  const directory=fixture(t),files=publicFiles();
  for(const file of [...files,'scripts/build.mjs','package.json']){
    const destination=path.join(directory,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(root,file),destination);
  }
  assert.equal(fs.existsSync(path.join(directory,'node_modules')),false);
  const result=spawnSync(process.execPath,[path.join(directory,'scripts/build.mjs')],{cwd:directory,encoding:'utf8',windowsHide:true,env:{...process.env,NODE_PATH:''}});
  assert.equal(result.status,0,result.stderr||result.stdout);
  const built=fs.readdirSync(path.join(directory,'dist'),{recursive:true}).filter(file=>fs.statSync(path.join(directory,'dist',file)).isFile()).map(file=>file.replaceAll('\\','/')).sort();
  assert.deepEqual(built,files);
  const standalone=fs.readFileSync(path.join(directory,'DEADWALL_Standalone.html'),'utf8');
  assert.doesNotMatch(standalone,/<script[^>]+src=|<link[^>]+stylesheet|serviceWorker\.register/);
});

test('distribution: PWA et protocole PC couvrent tout le contrat public actuel',()=>{
  const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const assets=JSON.parse(vm.runInNewContext(source+';JSON.stringify(ASSETS)',{URL,self:{registration:{scope:'https://deadwall.test/'},addEventListener(){}}}));
  assert.deepEqual([...new Set(assets.filter(file=>file!=='./'))].sort(),publicFiles().filter(file=>file!=='sw.js'));
  for(const file of publicFiles().filter(file=>file!=='sw.js'))assert.equal(resolvePublicFile(root,'deadwall://game/'+file),path.join(root,file),file);
  assert.equal(resolvePublicFile(root,'deadwall://game/sw.js'),null);
});
