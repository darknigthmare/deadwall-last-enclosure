'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {bootGame} = require('./helpers/browser.cjs');
const AudioSystem = bootGame().game.audio.constructor;

function fixture(fail = '') {
  const audio = new AudioSystem(), nodes = [], events = [];
  let failed = false;
  function checkpoint(name) {
    events.push(name);
    if (name === fail && !failed) { failed = true; throw new Error('Injected audio failure: ' + name); }
  }
  function node(kind) {
    checkpoint('create:' + kind);
    const n = {kind, disconnected: 0, onended: null,
      connect() { checkpoint('connect:' + kind); },
      disconnect() { this.disconnected++; },
      start() { checkpoint('start:' + kind); },
      stop() { checkpoint('stop:' + kind); },
      frequency: {setValueAtTime() { checkpoint('frequency'); }, exponentialRampToValueAtTime() { checkpoint('slide'); }},
      gain: {setValueAtTime() { checkpoint('gain'); }, exponentialRampToValueAtTime() { checkpoint('envelope'); }}
    };
    nodes.push(n); return n;
  }
  audio.ctx = {state:'running', currentTime: 4, sampleRate: 48000,
    createOscillator: () => node('oscillator'), createGain: () => node('gain'),
    createBufferSource: () => node('source'), createBiquadFilter: () => node('filter'),
    createBuffer(channels, length) { checkpoint('create:buffer'); return {getChannelData: () => new Float32Array(length)}; }
  };
  audio.master = {};
  return {audio, nodes, events};
}
for (const fault of ['create:oscillator','create:gain','frequency','slide','gain','envelope','connect:oscillator','connect:gain','start:oscillator','stop:oscillator']) {
  test('199 tone resource failure is isolated and cleaned: ' + fault, () => {
    const f=fixture(fault);
    assert.doesNotThrow(() => f.audio.tone(220,.1,'sine',.05,40));
    assert.equal(f.audio.voices,0);
    assert.ok(f.nodes.every(n => n.disconnected === 1));
    assert.doesNotThrow(() => f.audio.tone(220,.1,'sine',.05,40), 'a transient failure does not disable later sound');
    assert.equal(f.audio.voices,1);
  });
}
for (const fault of ['create:buffer','create:source','create:filter','create:gain','connect:source','connect:filter','connect:gain','start:source']) {
  test('199 noise resource failure is isolated and cleaned: ' + fault, () => {
    const f=fixture(fault);
    assert.doesNotThrow(() => f.audio.noise(.1,.1,1200));
    assert.equal(f.audio.voices,0); assert.ok(f.nodes.every(n => n.disconnected===1));
    assert.doesNotThrow(() => f.audio.noise(.1,.1,1200)); assert.equal(f.audio.voices,1);
  });
}
test('199 voice completion is idempotent and frees its actual nodes', () => {
  for (const kind of ['tone','noise']) {
    const f=fixture();kind==='tone'?f.audio.tone(220,.1):f.audio.noise(.1);
    assert.equal(f.audio.voices,1); const source=f.nodes.find(n=>['oscillator','source'].includes(n.kind)),end=source.onended;
    end();end();assert.equal(f.audio.voices,0);assert.ok(f.nodes.every(n=>n.disconnected===1));
  }
});
test('199 invalid audio values, a closed context, mute and the voice cap allocate nothing', () => {
  for (const call of [a=>a.tone(NaN,.1),a=>a.tone(220,-1),a=>a.tone(220,Infinity),a=>a.tone(220,.1,'sine',NaN),a=>a.noise(-1),a=>a.noise(Infinity),a=>a.noise(.1,NaN),a=>a.noise(.1,.1,NaN)]) {
    const f=fixture();assert.doesNotThrow(()=>call(f.audio));assert.equal(f.nodes.length,0);assert.equal(f.events.length,0);
  }
  for (const set of [a=>a.ctx.state='closed',a=>a.muted=true,a=>a.volume=0,a=>a.voices=48]) {
    const f=fixture();set(f.audio);const voices=f.audio.voices;f.audio.tone(220,.1);f.audio.noise(.1);
    assert.equal(f.nodes.length,0);assert.equal(f.audio.voices,voices);
  }
});

test('199 an actual paid construction still completes its bookkeeping and saves when the audio device fails',()=>{
 const {game:g}=bootGame(),C=require('../src/core.js');g.startNew('standard','17117');const f=fixture('create:oscillator');g.audio=f.audio;
 const type='woodWall',def=C.BUILDINGS[type];let spot=null;
 for(let y=35;y<85&&!spot;y+=2)for(let x=35;x<85&&!spot;x+=2)if(g.world.placement(def,x,y,0).valid)spot={x,y};assert.ok(spot);
 const before={...g.resources},count=g.world.buildings.size,stats=g.stats.buildingsPlaced;
 assert.doesNotThrow(()=>assert.equal(g.placeOne(type,spot.x,spot.y),true));assert.equal(g.world.buildings.size,count+1);assert.equal(g.stats.buildingsPlaced,stats+1);
 for(const key of C.RESOURCE_KEYS)assert.equal(g.resources[key],before[key]-(def.cost[key]||0),key);
 assert.equal(g.audio.voices,0);assert.equal(g.placeOne(type,spot.x,spot.y),false);assert.equal(g.world.buildings.size,count+1);assert.equal(g.save(false),true);
 const saved=g.serialize();assert.equal(g.restoreSave(saved),true);assert.equal(g.world.buildings.size,count+1);assert.equal(g.stats.buildingsPlaced,stats+1);
});
