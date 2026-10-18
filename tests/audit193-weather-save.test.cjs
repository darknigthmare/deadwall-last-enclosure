'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
test('193 weather target survives save and continuation with identical next rain interpolation',()=>{
 const {game:g}=bootGame();g.startNew('standard','17117');g.phaseTime=999;
 g.weather=.2;g.weatherTarget=.9;
 const raw=g.serialize(),rng=raw.randomState;g.update(.04);const expected=g.weather;
 g.restoreSave(raw);assert.equal(g.weatherTarget,.9);assert.equal(g.random.state,rng);
 g.update(.04);assert.equal(g.weather,expected);
});
test('193 weather target migration keeps historical rain and rejects malformed new targets atomically',()=>{
 const {game:g}=bootGame();g.startNew('standard','17117');g.weather=.4;g.weatherTarget=.8;
 const raw=g.serialize();delete raw.weatherTarget;g.restoreSave(raw);assert.equal(g.weatherTarget,.4);
 for(const bad of [-1,1.01,NaN,Infinity,'0.5',null]){
  const before=g.serialize();assert.throws(()=>g.restoreSave({...before,weatherTarget:bad}),/météo|meteo/);
  assert.equal(g.weather,.4);assert.equal(g.weatherTarget,.4);assert.equal(g.world.seed,17117);
 }
});
