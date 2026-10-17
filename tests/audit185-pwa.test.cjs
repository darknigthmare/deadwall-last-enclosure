
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function worker({openFails=false,matchFails=false,putFails=false,offline=false,redirected=false}={}){
 const handlers=new Map(),calls={fetch:0,put:0,open:0},scope='https://example.test/deadwall/';
 const cached=new Response('installed', {status:200});
 const cache={match:async()=>{if(matchFails)throw Error('cache read denied');return undefined;},put:async()=>{calls.put++;if(putFails)throw Error('quota');}};
 const context={URL,Response,caches:{async open(){calls.open++;if(openFails)throw Error('cache unavailable');return cache;}},
  self:{registration:{scope},addEventListener:(n,f)=>handlers.set(n,f)},
  fetch:async()=>{calls.fetch++;if(offline)throw Error('offline');return{ok:true,redirected,clone:()=>new Response('network'),text:async()=>'network'};}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),context);
 const request=async(name='src/game.js',mode='cors',method='GET')=>{
  let promise;handlers.get('fetch')({request:{url:new URL(name,scope).href,method,mode},respondWith:p=>promise=p});
  return promise===undefined?null:await promise;
 };
 return{request,calls,cache,cached};
}
for(const fault of ['openFails','matchFails'])test('185 '+fault+' does not block online allowed assets or write a partial cache',async()=>{
 const w=worker({[fault]:true});assert.equal(await(await w.request()).text(),'network');assert.equal(w.calls.fetch,1);assert.equal(w.calls.put,0);
});
for(const fault of ['openFails','matchFails'])test('185 offline '+fault+' returns a network error response, not an unhandled rejection',async()=>{
 const w=worker({[fault]:true,offline:true}),response=await w.request();assert.equal(response.type,'error');assert.equal(response.status,0);
});
test('185 a cached response needs neither network nor writes',async()=>{
 const w=worker({offline:true});w.cache.match=async()=>w.cached;assert.equal(await(await w.request()).text(),'installed');assert.equal(w.calls.fetch,0);assert.equal(w.calls.put,0);
});
test('185 quota during an optional cache write preserves the successful response',async()=>{
 const w=worker({putFails:true});assert.equal(await(await w.request('assets/art160/civil-rail.png')).text(),'network');assert.equal(w.calls.put,1);
});
test('185 redirect responses never poison an installed asset',async()=>{
 const w=worker({redirected:true});assert.equal(await(await w.request()).text(),'network');assert.equal(w.calls.put,0);
});
test('185 cache fallback keeps the public allowlist and GET boundary',async()=>{
 const w=worker({openFails:true});for(const name of ['https://other.test/src/game.js','secrets.json','../index.html'])assert.equal(await w.request(name),null);
 assert.equal(await w.request('src/game.js','cors','POST'),null);assert.equal(w.calls.open,0);assert.equal(w.calls.fetch,0);
});
