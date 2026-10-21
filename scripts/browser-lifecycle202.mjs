import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {WebSocketServer} from 'ws';
import {createCoopRelay} from './coop-server.mjs';

const out=resolve(process.env.LIFECYCLE202_QA_OUT||'artifacts/qa/lifecycle202');
const root=resolve(process.env.COOP_QA_ROOT||'.');
await mkdir(out,{recursive:true});
const source=await readFile(resolve(root,'src/coop.js'));
const report={scope:'Real Chromium and WebSocket transports with an isolated paused-game fixture. No game rendering, campaign, physical device or performance qualification.',root,sourceSha256:createHash('sha256').update(source).digest('hex'),checks:[],errors:[]};
let browser,http,relay,silent;
async function listen(server){if(server.listening||server.address())return;await once(server,'listening');}
async function stop(server){if(!server)return;for(const socket of server.clients||[])socket.terminate();await new Promise(done=>server.close(done));}
try{
 relay=createCoopRelay({port:0,host:'127.0.0.1'});await listen(relay);
 silent=new WebSocketServer({port:0,host:'127.0.0.1'});await listen(silent);
 let incoming=0;relay.on('connection',socket=>socket.on('message',()=>incoming++));
 const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Banc de protocole DEADWALL — pas le jeu</title><body><p>Fixture de réseau isolée, simulation volontairement en pause.</p><script src="/coop.js"></script><script>
 window.pose={active:true,x:12,y:18,a:0,z:0,inside:null,generation:10,detailVersion:13,ecologyVersion:1,hydrologyVersion:1,landscape189:'balanced'};
 window.game={world:{seed:17117},state:'playing',paused:true,steps:0,resources:{food:17,ammo:9},update(){this.steps++;},frontier:{position:()=>({...pose}),active:()=>pose.active}};
 window.api=DeadwallCoop.install(game);
 </script></body></html>`;
 http=createServer((req,res)=>{if(req.url==='/coop.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(source);}else if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);}else{res.writeHead(404);res.end();}});
 http.listen(0,'127.0.0.1');await once(http,'listening');
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}: {})});
 const page=await browser.newPage();page.on('pageerror',error=>report.errors.push(String(error)));
 await page.goto(`http://127.0.0.1:${http.address().port}/`,{waitUntil:'load'});
 assert.equal(await page.evaluate(url=>api.connect(url,'audit','Alice'),`ws://127.0.0.1:${relay.address().port}`),true);
 await page.waitForFunction(()=>api.overview().compatible);
 assert.equal(await page.evaluate(()=>game.steps),0);report.checks.push('Matching relay verifies while simulation remains paused.');
 const count=incoming;await page.evaluate(()=>{for(let i=0;i<100;i++)api.overview();});assert.equal(incoming,count);report.checks.push('Reading connection status sends no packets.');
 await page.evaluate(()=>{pose.z=1;});assert.equal(await page.evaluate(()=>api.overview().compatible),false);
 await page.evaluate(()=>api.update(.1));await page.waitForFunction(()=>api.overview().compatible);report.checks.push('Floor change hides the previous identity and verifies the new scope.');
 for(const socket of relay.clients)socket.close(1000,'fixture close');
 await page.waitForFunction(()=>!api.overview().connected);assert.equal(await page.evaluate(()=>api.overview().compatible),false);report.checks.push('Real socket closure clears compatibility.');
 assert.equal(await page.evaluate(url=>api.connect(url,'audit','Alice'),`ws://127.0.0.1:${silent.address().port}`),true);
 await page.waitForFunction(()=>api.overview().connected);
 await page.waitForFunction(()=>!api.overview().connected&&/confirmation/.test(api.overview().notice),null,{timeout:18000});
 assert.equal(await page.evaluate(()=>game.steps),0);report.checks.push('Silent relay expires using real wall time while gameplay remains paused.');
 await page.evaluate(url=>api.connect(url,'audit','Alice'),`ws://127.0.0.1:${relay.address().port}`);await page.waitForFunction(()=>api.overview().compatible);report.checks.push('Manual reconnect succeeds after timeout.');
 const state=await page.evaluate(()=>({steps:game.steps,resources:game.resources}));assert.deepEqual(state,{steps:0,resources:{food:17,ammo:9}});report.checks.push('All persistent fixture owners remain unchanged.');
 await page.evaluate(()=>api.disconnect());assert.equal(await page.evaluate(()=>api.overview().compatible),false);assert.deepEqual(report.errors,[]);report.checks.push('Manual disconnect cleans up without page errors.');
 report.status='passed';
}catch(error){report.status='failed';report.failure=String(error.stack||error);process.exitCode=1;}
finally{await browser?.close();await stop(relay);await stop(silent);await stop(http);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
