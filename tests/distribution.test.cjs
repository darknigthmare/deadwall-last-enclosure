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
  // UI illustrations are assigned to img.src at runtime, without an Art atlas entry.
  for(const script of scripts)for(const match of fs.readFileSync(path.join(root,script),'utf8').matchAll(/["'](assets\/[a-zA-Z0-9_./-]+\.(?:png|webp|jpg|jpeg|svg|avif))["']/g))files.push(match[1]);
  return [...new Set(files)].sort();
}

function buildSourceFiles(){
  const catalogues=[
    {file:'codex-3000/originaux/DEADWALL_CODEX_1.22/CATALOGUE_500.json',directory:'codex-3000/originaux/DEADWALL_CODEX_1.22/fiches'},
    {file:'codex-3000/originaux/DEADWALL_CODEX_SUPPLEMENT_1.23/CATALOGUE_501_1000.json',directory:'codex-3000/originaux/DEADWALL_CODEX_SUPPLEMENT_1.23/FICHES_501_1000'}
  ];
  // Build-time source dependencies are uploaded to Vercel, not copied to dist.
  // The compiler reads the authored envelopes from these 1,000 parent records.
  return ['src/codex-furnishing162.js','src/power-network173.js','src/transit-network173.js','src/codex-native173.js','src/site-infrastructure173.js','src/codex-lab173-ui.js','src/codex-packing173.js','src/codex-gardens171.js','src/codex-stations170.js','src/codex-infill169.js','src/codex-infill169-art.js','src/codex-fill168.js','src/codex-coverage167.js','src/codex-ensembles165.js','src/codex-plan165.js','src/codex-quantities164.js','scripts/standalone-inline162.cjs','src/codex-sites162.js','src/codex-anchors160.js','src/codex-dressing160.js','src/codex3000-recipes159.js','scripts/compile-codex3000.mjs','scripts/compile-codex-context160.mjs','codex-3000/addendum-1.60/CONTRATS.json','codex-3000/INDEX_3000.json',
    'codex-3000/addendum-1.58/validation.mjs','codex-3000/addendum-1.58/reader.mjs',...['A','B','C','D'].map(lot=>'codex-3000/addendum-1.58/PROGRAMMES_'+lot+'.json'),
    'codex-3000/source/CONTEXTES.json','codex-3000/source/ETATS.json','codex-3000/source/MODULES.json',
    ...catalogues.flatMap(source=>[source.file,...JSON.parse(fs.readFileSync(path.join(root,source.file),'utf8')).fiches.map(parent=>source.directory+'/'+parent.id+'.md')])];
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
  for(const file of ['package.json','package-lock.json','vercel.json','scripts/build.mjs',...buildSourceFiles(),...publicFiles()])assert.equal(ignored(file),false,file);
});

test('distribution: vrai build public sans node_modules ni installation',t=>{
  const directory=fixture(t),files=publicFiles(),generated=['src/codex3000-live-data.js','src/codex-context160-data.js'];
  // Require real regeneration: copying a previously compiled module would hide
  // missing source inputs in the dependency-free Vercel build fixture.
  for(const file of [...files.filter(file=>!generated.includes(file)),...buildSourceFiles(),'scripts/build.mjs','package.json']){
    const destination=path.join(directory,file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(path.join(root,file),destination);
  }
  assert.equal(fs.existsSync(path.join(directory,'node_modules')),false);
  for(const file of generated)assert.equal(fs.existsSync(path.join(directory,file)),false,file+' doit être réellement régénéré');
  const result=spawnSync(process.execPath,[path.join(directory,'scripts/build.mjs')],{cwd:directory,encoding:'utf8',windowsHide:true,env:{...process.env,NODE_PATH:''}});
  assert.equal(result.status,0,result.stderr||result.stdout);
  assert.equal(fs.existsSync(path.join(directory,'node_modules')),false,'le build ne nécessite ni crée une installation');
  for(const file of generated)assert.deepEqual(fs.readFileSync(path.join(directory,file)),fs.readFileSync(path.join(root,file)),file+' : le vrai compilateur reconstruit les mêmes octets depuis les sources auteur');
  const built=fs.readdirSync(path.join(directory,'dist'),{recursive:true}).filter(file=>fs.statSync(path.join(directory,'dist',file)).isFile()).map(file=>file.replaceAll('\\','/')).sort();
  assert.deepEqual(built,files);
  const standalone=fs.readFileSync(path.join(directory,'DEADWALL_Standalone.html'),'utf8');
  assert.doesNotMatch(standalone,/<script[^>]+src=|<link[^>]+stylesheet|serviceWorker\.register/);
  const variantScripts=[...standalone.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)]
    .map(match=>match[1]).filter(script=>script.includes('root.DeadwallWorldVariants158=api'));
  assert.equal(variantScripts.length,1,'le vrai module de variantes est embarqué exactement une fois');
  const context={};vm.runInNewContext(variantScripts[0],context,{timeout:5000});
  const original=require('../src/world-variants158.js').ASSETS,embedded=context.DeadwallWorldVariants158.ASSETS;
  assert.deepEqual(Object.keys(embedded).sort(),Object.keys(original).sort());
  assert.equal(Object.keys(embedded).length,10);
  assert.ok(Object.isFrozen(embedded));
  for(const [key,definition] of Object.entries(original)){
    const actual=embedded[key];assert.ok(Object.isFrozen(actual),key);
    assert.match(actual.url,/^data:image\/png;base64,/,key+' doit se charger sans fichier voisin');
    assert.deepEqual(Buffer.from(actual.url.slice('data:image/png;base64,'.length),'base64'),
      fs.readFileSync(path.join(directory,definition.url)),key+' conserve exactement les octets PNG');
    for(const field of ['width','height','matte'])assert.equal(actual[field],definition[field],key+' '+field);
  }
  const extensions=[['trap-art159','DeadwallTrapArt159'],['equipment-art159','DeadwallEquipmentArt159'],['actor-actions159','DeadwallActorActions159'],['post-art159','DeadwallPostArt159'],['expedition-sprites159','DeadwallExpeditionSprites159'],['structure-art159','DeadwallStructureArt159'],['context-art160','DeadwallContextArt160']];
  const inlineScripts=[...standalone.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].map(match=>match[1]);
  for(const [file,globalName] of extensions){
    const scripts=inlineScripts.filter(script=>script.includes('root.'+globalName+'=api'));
    assert.equal(scripts.length,1,file+' embarqué une fois');
    const sandbox={};vm.runInNewContext(scripts[0],sandbox,{timeout:5000});
    const expected=require('../src/'+file+'.js').ASSETS,actual=sandbox[globalName].ASSETS;
    assert.ok(Object.isFrozen(actual));assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort());
    for(const [key,definition]of Object.entries(expected)){
      assert.ok(Object.isFrozen(actual[key]),key);assert.match(actual[key].url,/^data:image\/png;base64,/);
      assert.deepEqual(Buffer.from(actual[key].url.slice('data:image/png;base64,'.length),'base64'),fs.readFileSync(path.join(directory,definition.url)),key+' original brut embarqué');
      for(const field of ['width','height','matte','lazy'])assert.equal(actual[key][field],definition[field],key+' '+field);
    }
  }
});

test('distribution: PWA précache 143 atlas historiques et sert les trois atlas optionnels avec le protocole PC',()=>{
  const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const {assets,optional}=JSON.parse(vm.runInNewContext(source+';JSON.stringify({assets:ASSETS,optional:OPTIONAL_ASSETS})',{URL,self:{registration:{scope:'https://deadwall.test/'},addEventListener(){}}}));
  const definitions=Object.values(require('../src/art.js').ASSETS),eager=definitions.filter(asset=>asset.lazy!==true),lazy=definitions.filter(asset=>asset.lazy===true);
  assert.equal(eager.length,143);assert.equal(lazy.length,3);
  assert.equal(new Set(assets).size,assets.length,'aucun doublon dans le précache');
  assert.equal(new Set(optional).size,optional.length,'aucun doublon optionnel');
  assert.deepEqual([...optional].sort(),lazy.map(asset=>asset.url).sort(),'seuls les trois PNG lazy sont optionnels');
  for(const asset of eager){assert.ok(assets.includes(asset.url),asset.url+' précaché');assert.ok(!optional.includes(asset.url));}
  for(const asset of lazy)assert.ok(!assets.includes(asset.url),asset.url+' ne bloque pas installation ou démarrage');
  assert.ok(optional.every(file=>!assets.includes(file)),'manifestes disjoints');
  assert.deepEqual([...new Set([...assets,...optional].filter(file=>file!=='./'))].sort(),publicFiles().filter(file=>file!=='sw.js'));
  for(const file of publicFiles().filter(file=>file!=='sw.js'))assert.equal(resolvePublicFile(root,'deadwall://game/'+file),path.join(root,file),file);
  assert.equal(resolvePublicFile(root,'deadwall://game/sw.js'),null);
});

test('distribution: le vrai worker installe le shell seul puis met en cache un PNG lazy uniquement à sa demande',async()=>{
  const source=fs.readFileSync(path.join(root,'sw.js'),'utf8'),scope='https://deadwall.test/',handlers={},stores=new Map(),installed=[];
  let networkCalls=0,offline=false;
  const url=value=>new URL(typeof value==='string'?value:value.url,scope).href;
  const caches={
    async open(name){
      if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
      return{
        async addAll(files){installed.push(...files);for(const file of files)store.set(url(file),new Response('shell:'+file));},
        async match(request){return store.get(url(request))?.clone();},
        async put(request,response){store.set(url(request),response.clone());}
      };
    },
    async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}
  };
  const sandbox={URL,Response,caches,self:{registration:{scope},clients:{async claim(){}},async skipWaiting(){},addEventListener(type,handler){handlers[type]=handler;}},
    async fetch(request){networkCalls++;if(offline)throw Error('offline');return new Response(fs.readFileSync(path.join(root,new URL(request.url).pathname.slice(1))),{headers:{'Content-Type':'image/png'}});}};
  const contract=JSON.parse(vm.runInNewContext(source+';JSON.stringify({cache:CACHE,assets:ASSETS,optional:OPTIONAL_ASSETS})',sandbox));
  let installing;handlers.install({waitUntil(value){installing=value;}});await installing;
  assert.deepEqual(installed,contract.assets,'addAll reçoit seulement ASSETS');
  const store=stores.get(contract.cache);
  for(const file of contract.optional)assert.equal(store.has(url(file)),false,file+' absent avant visite');
  const request=file=>({url:url(file),method:'GET',mode:'cors'});
  const fetchEvent=async file=>{let response;handlers.fetch({request:request(file),respondWith(value){response=value;}});assert.ok(response);return await response;};
  const file=contract.optional[0],expected=fs.readFileSync(path.join(root,file)),online=await fetchEvent(file);
  assert.equal(online.status,200);assert.deepEqual(Buffer.from(await online.arrayBuffer()),expected);assert.equal(networkCalls,1);
  assert.ok(store.has(url(file)),'la première vraie réponse remplit le cache optionnel');
  offline=true;const cached=await fetchEvent(file);
  assert.deepEqual(Buffer.from(await cached.arrayBuffer()),expected);assert.equal(networkCalls,1,'la revisite hors ligne ne relance pas le réseau');
  const failure=await fetchEvent(contract.optional[1]);assert.equal(failure.type,'error');assert.equal(networkCalls,2);
  assert.equal(store.has(url(contract.optional[1])),false,'un échec optionnel ne crée pas de fausse réponse');
  for(const shell of contract.assets)assert.ok(store.has(url(shell)),shell+' demeure disponible après cet échec');
});
