import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import Stamp from './pwa-build184.cjs';
const output=path.resolve(process.env.DEADWALL_QA_OUTPUT||'artifacts/qa','pwa184');await mkdir(output,{recursive:true});
const report={scope:'Real Chromium service-worker lifecycle using the production worker handlers and build fingerprint on a declared tiny fixture (index and one script). It does not download or play the entire game. Negative installation deliberately returns HTTP 503 for its required script. Tests cache isolation, rollback and offline restart, not device storage quotas.',checks:[],pass:false};
const root=await mkdtemp(path.join(os.tmpdir(),'deadwall-pwa184-'));let browser,server,revision='A',failAsset=false;
const builds={};
try{
 await mkdir(path.join(root,'src'));
 const template=(await readFile(new URL('../sw.js',import.meta.url),'utf8')).replace(/^const ASSETS = .*;$/m,'const ASSETS = ["./","index.html","src/game.js"];').replace(/^const OPTIONAL_ASSETS = .*;$/m,'const OPTIONAL_ASSETS = [];');
 for(const id of ['A','B']){
  const files={'index.html':'<!doctype html><title>Cache fixture '+id+'</title><script src="src/game.js"></script>', 'src/game.js':'globalThis.fixtureVersion='+JSON.stringify(id)+';', 'sw.js':template};
  for(const [name,data]of Object.entries(files))await writeFile(path.join(root,name),data);
  const stamp=Stamp.stampWorker(root,Object.keys(files));builds[id]={files:{...files,'sw.js':stamp.source},cache:stamp.cache};
 }
 assert.notEqual(builds.A.cache,builds.B.cache);report.caches={A:builds.A.cache,B:builds.B.cache};
 server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1),body=builds[revision].files[name];
  if(body===undefined||failAsset&&name==='src/game.js'){res.writeHead(503,{'Cache-Control':'no-store'});res.end('Deliberate failed fixture asset');return;}
  res.writeHead(200,{'Content-Type':name.endsWith('.js')?'text/javascript':'text/html','Cache-Control':'no-store','Service-Worker-Allowed':'/'});res.end(body);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();page.setDefaultTimeout(90000);
 const base='http://127.0.0.1:'+server.address().port+'/';report.browser=browser.version();
 await page.goto(base);
 await page.evaluate(async()=>{localStorage.setItem('campaign-fixture','untouched');await (await caches.open('other-application')).put('/foreign',new Response('preserve'));await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;});
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await page.reload();assert.equal(await page.evaluate(()=>fixtureVersion),'A');report.checks.push('A installed and serves its complete payload');
 async function update(){return page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return new Promise((resolve,reject)=>{
   let observed=null,done=false;
   const finish=(state,error)=>{if(done)return;done=true;clearTimeout(timer);registration.removeEventListener('updatefound',found);observed?.removeEventListener('statechange',changed);error?reject(error):resolve(state);};
   const changed=()=>{if(['activated','redundant'].includes(observed?.state))finish(observed.state);};
   const found=()=>{observed=registration.installing;if(observed){observed.addEventListener('statechange',changed);changed();}};
   const timer=setTimeout(()=>finish(null,new Error('No terminal worker state')),80000);
   registration.addEventListener('updatefound',found);registration.update().then(()=>{if(registration.installing)found();}).catch(error=>finish(null,error));
  });
 });}
 revision='B';failAsset=true;assert.equal(await update(),'redundant');await page.reload();
 assert.equal(await page.evaluate(()=>fixtureVersion),'A');assert.equal(await page.evaluate(name=>caches.has(name),builds.A.cache),true);report.checks.push('Failed B install leaves complete A playable');
 failAsset=false;assert.equal(await update(),'activated');await page.reload();assert.equal(await page.evaluate(()=>fixtureVersion),'B');
 assert.equal(await page.evaluate(name=>caches.has(name),builds.A.cache),false);report.checks.push('Complete B activates and removes only old DEADWALL caches');
 await context.setOffline(true);await page.reload({waitUntil:'load'});assert.equal(await page.evaluate(()=>fixtureVersion),'B');
 const preserved=await page.evaluate(async()=>({campaign:localStorage.getItem('campaign-fixture'),foreign:await (await (await caches.open('other-application')).match('/foreign')).text()}));
 assert.deepEqual(preserved,{campaign:'untouched',foreign:'preserve'});report.preserved=preserved;report.checks.push('Offline B restart preserves campaign storage and unrelated caches');
 await page.screenshot({path:path.join(output,'offline-updated-fixture.png')});report.pass=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{
 await browser?.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}await rm(root,{recursive:true,force:true});
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
