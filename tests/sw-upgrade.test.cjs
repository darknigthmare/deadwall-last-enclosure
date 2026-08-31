'use strict';

const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const added=['index.html','src/core.js','src/game.js','src/save.js','squads.css','finish.css','src/scenarios.js','src/squads.js','src/battlefield.js','src/scenario-ui.js','src/squad-ui.js','src/battlefield-ui.js'];
const previous='deadwall-v1.0.0-r11',current='deadwall-v1.0.0-r12';

// Cache.addAll is deliberately modelled as one deferred atomic operation. These
// tests check SW event/promise orchestration, not a browser Cache implementation.
function workerFixture({failedAsset=null}={}){
  const scope='https://deadwall.example/game/',listeners={},stores=new Map(),trace=[],installed=[];
  let release,skipWaiting=0,claimed=0;
  const gate=new Promise(resolve=>{release=resolve;}),url=value=>new URL(value,scope).href;
  const caches={
    keys:async()=>[...stores.keys()],
    delete:async name=>{trace.push('delete:'+name);return stores.delete(name);},
    open:async name=>{
      if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
      return{
        addAll:async assets=>{
          const files=Array.from(assets);installed.push(...files);trace.push('addAll:start');await gate;
          if(failedAsset&&files.includes(failedAsset)){trace.push('addAll:reject');throw new Error('Unavailable asset: '+failedAsset);}
          for(const file of files)store.set(url(file),'cached:'+file);trace.push('addAll:complete');
        },
        match:async request=>store.get(typeof request==='string'?url(request):request.url),
        put:async(request,response)=>store.set(typeof request==='string'?url(request):request.url,response)
      };
    }
  };
  const context=vm.createContext({
    URL,Response,caches,fetch:async()=>{throw new Error('network not used by installation fixture');},
    self:{registration:{scope},addEventListener(type,callback){listeners[type]=callback;},
      skipWaiting:async()=>{skipWaiting++;trace.push('skipWaiting');},clients:{claim:async()=>{claimed++;trace.push('claim');}}}
  });
  vm.runInContext(source,context);
  async function dispatch(type){
    const work=[];listeners[type]({waitUntil(promise){work.push(promise);}});
    assert.equal(work.length,1,type+' must retain the complete operation');await Promise.all(work);
  }
  return{scope,url,stores,trace,installed,release,dispatch,cacheName:vm.runInContext('CACHE',context),counts:()=>({skipWaiting,claimed})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('PWA upgrade : installation r12 attend toutes les dépendances avant activation et purge sélective',{timeout:3000},async t=>{
  const worker=workerFixture();t.after(()=>worker.release());
  const oldBytes=new Map([[worker.url('index.html'),'old r11 page']]),foreign=new Map([['proof','keep']]);
  worker.stores.set(previous,oldBytes);worker.stores.set('another-game-v11',foreign);worker.stores.set('deadwall-static-v1',new Map([['proof','keep too']]));
  let settled=false;const installing=worker.dispatch('install').then(()=>{settled=true;});
  await flush();
  assert.equal(worker.cacheName,current);assert.equal(settled,false);assert.deepEqual(worker.counts(),{skipWaiting:0,claimed:0});
  assert.equal(worker.stores.get(previous),oldBytes,'ancienne version intacte pendant les téléchargements');
  assert.equal(new Set(worker.installed).size,worker.installed.length,'pas de dépendance dupliquée');
  for(const file of added){assert.ok(worker.installed.includes(file),file);assert.ok(fs.existsSync(path.join(root,file)),file);}
  worker.release();await installing;
  assert.deepEqual(worker.counts(),{skipWaiting:1,claimed:0});
  assert.ok(worker.trace.indexOf('addAll:complete')<worker.trace.indexOf('skipWaiting'));
  for(const file of added)assert.equal(worker.stores.get(current).get(worker.url(file)),'cached:'+file);
  assert.equal(worker.stores.get(previous),oldBytes,'install ne purge pas le cache actif précédent');
  await worker.dispatch('activate');
  assert.equal(worker.stores.has(previous),false);assert.ok(worker.stores.has(current));
  assert.equal(worker.stores.get('another-game-v11'),foreign);assert.equal(worker.stores.has('deadwall-static-v1'),true);
  assert.deepEqual(worker.counts(),{skipWaiting:1,claimed:1});
  assert.ok(worker.trace.indexOf('delete:'+previous)<worker.trace.indexOf('claim'));
});

test('PWA upgrade : échec de chacune des douze dépendances critiques conserve la version précédente',{timeout:3000},async()=>{
  for(const failedAsset of added){
    const worker=workerFixture({failedAsset}),oldBytes=new Map([[worker.url('index.html'),'working r11'],[worker.url('src/game.js'),'old game']]);
    worker.stores.set(previous,oldBytes);worker.stores.set('another-game-v11',new Map([['proof','keep']]));
    const installing=worker.dispatch('install');await flush();worker.release();
    await assert.rejects(installing,new RegExp(failedAsset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.deepEqual(worker.counts(),{skipWaiting:0,claimed:0},failedAsset);
    assert.equal(worker.stores.get(previous),oldBytes,failedAsset);
    assert.equal(worker.stores.get(previous).get(worker.url('index.html')),'working r11');
    assert.equal(worker.stores.get(previous).get(worker.url('src/game.js')),'old game');
    assert.equal(worker.stores.has('another-game-v11'),true);
    assert.equal(worker.trace.some(entry=>entry.startsWith('delete:')),false);
    assert.ok(!worker.trace.includes('addAll:complete'));
    // A rejected install is not dispatched as activate: that transition belongs
    // to the browser lifecycle, not to this local promise/event model.
  }
});
