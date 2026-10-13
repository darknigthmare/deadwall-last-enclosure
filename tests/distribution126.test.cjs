'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {pathToFileURL}=require('node:url'),{resolvePublicFile}=require('../desktop/policy.cjs');
const root=path.resolve(__dirname,'..');
test('distribution126 : shell précaché et 143 atlas historiques / 3 optionnels réellement livrés et servis',async t=>{
 const {createGameServer}=await import(pathToFileURL(path.join(root,'scripts/server.mjs')).href),server=createGameServer({rootDirectory:path.join(root,'dist')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const manifests=JSON.parse(vm.runInNewContext(worker+';JSON.stringify({assets:ASSETS,optional:OPTIONAL_ASSETS})',{URL,self:{registration:{scope:'https://deadwall.test/'},addEventListener(){}}},{timeout:1000}));
 const {assets,optional}=manifests;assert.ok(Array.isArray(assets)&&Array.isArray(optional));assert.ok([...assets,...optional].every(name=>typeof name==='string'));const precached=new Set(assets),allowed=new Set([...assets,...optional]);
 const urls=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>/\.(js|css|json|svg)$/.test(x)))];
 for(const name of urls){
  assert.ok(fs.existsSync(path.join(root,'dist',name)),name);
  assert.ok(precached.has(name),name+' absent cache');
  assert.equal(resolvePublicFile(path.join(root,'dist'),'deadwall://game/'+name),path.join(root,'dist',name));
  const response=await new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:server.address().port,path:'/'+name,method:'HEAD'},res=>{res.resume();res.on('end',()=>resolve(res));});req.on('error',reject);req.end();});
  assert.equal(response.statusCode,200,name);
 }
 const definitions=Object.values(require('../src/art.js').ASSETS),eager=definitions.filter(asset=>asset.lazy!==true),lazy=definitions.filter(asset=>asset.lazy===true);
 assert.equal(eager.length,143);assert.equal(lazy.length,3);assert.deepEqual(optional.slice().sort(),lazy.map(asset=>asset.url).sort());
 for(const asset of definitions){
  const name=asset.url;assert.ok(allowed.has(name),name+' autorisé par le worker');assert.equal(precached.has(name),asset.lazy!==true,name+' politique de chargement');
  assert.ok(fs.existsSync(path.join(root,'dist',name)),name+' livré');assert.equal(resolvePublicFile(path.join(root,'dist'),'deadwall://game/'+name),path.join(root,'dist',name));
 }
 for(const asset of lazy){
  const response=await new Promise((resolve,reject)=>{const req=http.get({host:'127.0.0.1',port:server.address().port,path:'/'+asset.url},res=>{const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,mime:res.headers['content-type'],bytes:Buffer.concat(chunks)}));});req.on('error',reject);});
  assert.equal(response.status,200,asset.url);assert.match(response.mime,/^image\/png(?:;|$)/);assert.deepEqual(response.bytes,fs.readFileSync(path.join(root,asset.url)),asset.url+' octets PNG bruts');
 }
 assert.ok(urls.indexOf('src/night-gear.js')<urls.indexOf('src/exploration-125.js'));
 assert.ok(urls.indexOf('src/actor-presentation.js')>urls.indexOf('src/exploration-125.js'));
 for(const kind of ['nature','habitat','activites','systemes'])assert.ok(urls.indexOf('src/world-codex-'+kind+'.js')<urls.indexOf('src/world-codex.js'));
});

test('distribution160 : les trois atlas lazy restent intégrés en PNG brut sans déclencher leur décodage dans le standalone',()=>{
 const html=fs.readFileSync(path.join(root,'DEADWALL_Standalone.html'),'utf8');
 const scripts=[...html.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].map(match=>match[1]).filter(script=>script.includes('root.DeadwallContextArt160=api'));
 assert.equal(scripts.length,1);const sandbox={};vm.runInNewContext(scripts[0],sandbox,{timeout:1000});
 const expected=require('../src/context-art160.js').ASSETS,actual=sandbox.DeadwallContextArt160.ASSETS;
 assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort());assert.equal(Object.keys(actual).length,3);assert.ok(Object.isFrozen(actual));
 for(const [key,definition]of Object.entries(expected)){
  const embedded=actual[key];assert.ok(Object.isFrozen(embedded));assert.equal(embedded.lazy,true);assert.match(embedded.url,/^data:image\/png;base64,/);
  assert.deepEqual(Buffer.from(embedded.url.slice('data:image/png;base64,'.length),'base64'),fs.readFileSync(path.join(root,definition.url)),key+' original brut');
  for(const field of ['width','height','matte'])assert.equal(embedded[field],definition[field],key+' '+field);
 }
});
test('distribution126 : les deux atlas PNG restent intégrés avec le bon MIME dans le standalone',()=>{
 const html=fs.readFileSync(path.join(root,'DEADWALL_Standalone.html'),'utf8');
 assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+stylesheet/);
 for(const key of ['commander','commanderPistol']){
  const match=html.match(new RegExp(key+": \\{ url: 'data:image/png;base64,([^']+)'"));assert.ok(match,key);
  const data=Buffer.from(match[1],'base64');assert.deepEqual([...data.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.ok(data.equals(fs.readFileSync(path.join(root,require('../src/art.js').ASSETS[key].url))));
 }
});
