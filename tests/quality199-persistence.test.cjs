'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),C=require('../src/core.js');
function fixture(t) {
  const env=bootGame(),g=env.game;g.startNew('standard','17117');g.save(false);
  const notices=[];g.notify=(text,kind)=>notices.push({text,kind});const error=console.error;console.error=()=>{};t.after(()=>console.error=error);
  return {...env,g,notices};
}
test('199 autosave storage outage alerts once, preserves last copies and announces recovery',t=>{
  const {g,storage,notices}=fixture(t),primary=storage.get(C.SAVE_KEY),backup=storage.get(C.SAVE_BACKUP_KEY),put=localStorage.setItem;
  localStorage.setItem=()=>{throw Error('QuotaExceededError');};t.after(()=>localStorage.setItem=put);
  const before=g.serialize();for(let i=0;i<4;i++)assert.equal(g.save(false),false);
  assert.equal(notices.length,1);assert.equal(notices[0].kind,'danger');assert.match(notices[0].text,/export/i);
  assert.equal(storage.get(C.SAVE_KEY),primary);assert.equal(storage.get(C.SAVE_BACKUP_KEY),backup);
  const after=g.serialize();delete before.timestamp;delete after.timestamp;assert.deepEqual(after,before);
  localStorage.setItem=put;assert.equal(g.save(false),true);assert.equal(notices.length,2);assert.equal(notices[1].kind,'good');assert.match(notices[1].text,/rétablie/i);
  g.save(false);assert.equal(notices.length,2,'normal autosaves are silent');
});
test('199 validation failure alerts automatically without replacing a healthy save; a changed failure stays visible',t=>{
  const {g,storage,notices}=fixture(t),primary=storage.get(C.SAVE_KEY),serialize=g.serialize.bind(g);
  g.serialize=()=>({...serialize(),worldSeed:NaN});assert.equal(g.save(false),false);assert.equal(g.lastSaveStatus.code,'invalid-state');
  g.save(false);assert.equal(notices.length,1);assert.equal(storage.get(C.SAVE_KEY),primary);
  g.serialize=serialize;const put=localStorage.setItem;localStorage.setItem=()=>{throw Error('Denied');};t.after(()=>localStorage.setItem=put);
  g.save(false);assert.equal(notices.length,2);assert.equal(g.lastSaveStatus.code,'storage-unavailable');
  g.save(true);assert.equal(notices.length,3,'an explicit retry always receives its result');
});
