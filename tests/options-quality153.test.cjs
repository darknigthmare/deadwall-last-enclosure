'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs');
const C=require('../src/core.js');

function options(){const env=bootGame();delete require.cache[require.resolve('../src/ui.js')];require('../src/ui.js');env.game.showSettings(true);return env;}
function select(env,value){const input=env.elements.get('settingsQuality');input.value=value;input.dispatch('change');}
function campaign(g){const data=structuredClone(g.serialize());delete data.timestamp;return data;}

test('153 qualité : choix HTML élevé, économique et auto persistés puis relus sans perdre les autres préférences',()=>{
 const env=options(),g=env.game;globalThis.devicePixelRatio=3;Object.assign(g.settings,{volume:.25,muted:true,reducedMotion:true,highContrast:true});
 for(const quality of ['high','low','auto']){select(env,quality);assert.equal(g.settings.quality,quality);const saved=JSON.parse(localStorage.getItem(C.SETTINGS_KEY));assert.deepEqual(saved,g.settings);assert.deepEqual(g.loadSettings(),saved);assert.equal(saved.volume,.25);assert.equal(saved.reducedMotion,true);assert.equal(saved.highContrast,true);assert.equal(saved.muted,true);if(quality==='high')assert.equal(g.dpr,2);if(quality==='low')assert.equal(g.dpr,1);if(quality==='auto')assert.ok(g.dpr>=1&&g.dpr<=2);g.showSettings(false);g.showSettings(true);assert.equal(env.elements.get('settingsQuality').value,quality);}
});

test('153 qualité : changement de rendu garde intégralement campagne, stocks et RNG; valeur inconnue revient à auto',()=>{
 const env=options(),g=env.game;g.showSettings(false);g.startNew('standard','17117');g.showSettings(true);globalThis.devicePixelRatio=2;const before=campaign(g),rng=g.random.state;
 for(const quality of ['high','low','auto','unknown']){select(env,quality);assert.deepEqual(campaign(g),before);assert.equal(g.random.state,rng);assert.equal(g.settings.quality,quality==='unknown'?'auto':quality);}
 localStorage.setItem(C.SETTINGS_KEY,JSON.stringify({quality:'unknown',volume:.4,muted:true}));const restored=g.loadSettings();assert.equal(restored.quality,'auto');assert.equal(restored.volume,.4);assert.equal(restored.muted,true);assert.equal(restored.highContrast,false);
});
