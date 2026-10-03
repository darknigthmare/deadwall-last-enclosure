'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{resolvePublicFile}=require('../desktop/policy.cjs');
const root=path.resolve(__dirname,'..');
test('distribution126 : chaque dépendance de la page est livrée, servie et précachée',async t=>{
 const {createGameServer}=await import(pathToFileURL(path.join(root,'scripts/server.mjs')).href),server=createGameServer({rootDirectory:path.join(root,'dist')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const urls=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>/\.(js|css|json|svg)$/.test(x)))];
 for(const name of urls){
  assert.ok(fs.existsSync(path.join(root,'dist',name)),name);
  assert.ok(worker.includes("'"+name+"'"),name+' absent cache');
  assert.equal(resolvePublicFile(path.join(root,'dist'),'deadwall://game/'+name),path.join(root,'dist',name));
  const response=await new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:server.address().port,path:'/'+name,method:'HEAD'},res=>{res.resume();res.on('end',()=>resolve(res));});req.on('error',reject);req.end();});
  assert.equal(response.statusCode,200,name);
 }
 assert.ok(urls.indexOf('src/night-gear.js')<urls.indexOf('src/exploration-125.js'));
 assert.ok(urls.indexOf('src/actor-presentation.js')>urls.indexOf('src/exploration-125.js'));
 for(const kind of ['nature','habitat','activites','systemes'])assert.ok(urls.indexOf('src/world-codex-'+kind+'.js')<urls.indexOf('src/world-codex.js'));
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
