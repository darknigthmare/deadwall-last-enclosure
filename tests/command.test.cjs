'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bootGame}=require('./helpers/browser.cjs'),C=require('../src/core.js'),Save=require('../src/save.js');
test('campagne : graine volontaire, nouvelle identité et remise à zéro des ordres',()=>{
  const {game}=bootGame();game.startNew('standard','17117');const first=game.runId;
  const terrain=game.world.nodes.map(node=>[node.type,node.x,node.y,node.amount]);
  game.workerOrder='clear';game.startNew('standard','17117');
  assert.equal(game.world.seed,17117);assert.notEqual(game.runId,first);assert.equal(game.workerOrder,'auto');
  assert.deepEqual(game.world.nodes.map(node=>[node.type,node.x,node.y,node.amount]),terrain);
  const world=game.world;assert.equal(game.startNew('brutal','bad'),false);assert.equal(game.world,world);assert.equal(game.difficulty.id,'standard');
  for(const seed of [0,4000000000,4294967295]){game.startNew('standard',String(seed));assert.equal(game.world.seed,seed);assert.equal(Save.validate(game.serialize()).worldSeed,seed);}
});
test('campagne : sauvegarde compatible, identifiant stable et ordre conservé',()=>{
  const {game}=bootGame();game.startNew('story','123456');game.workerOrder='retreat';
  const data=Save.validate(game.serialize()),runId=game.runId;game.restoreSave(data);
  assert.equal(game.workerOrder,'retreat');assert.equal(game.runId,runId);
  delete data.runId;delete data.workerOrder;const legacy=Save.validate(data);
  assert.equal(legacy.workerOrder,'auto');assert.equal(legacy.runId,'legacy:story:123456');
  game.restoreSave(legacy);assert.equal(game.runId,'legacy:story:123456');
});
test('campagne : records de vagues survivées, pics et fin persistent sans dupliquer un chargement',()=>{
  const {game}=bootGame();game.startNew('standard','7234');game.stats.wavesSurvived=3;game.wave=4;
  game.stats.peakPopulation=14;game.stats.peakBuildings=24;game.stats.kills=55;game.save();
  const copy=game.serialize();game.restoreSave(copy);game.save();
  let profile=game.profile.get();assert.equal(profile.recentRuns.length,1);assert.equal(profile.byDifficulty.standard.wavesSurvived,3);
  assert.equal(profile.byDifficulty.standard.peakPopulation,14);assert.equal(profile.byDifficulty.standard.peakBuildings,24);
  game.triggerGameOver();profile=game.profile.get();assert.equal(profile.recentRuns[0].ended,true);assert.equal(profile.recentRuns.length,1);
});
test('doctrines : choix libre du palier, coût atomique, sauvegarde et commandes bornées à la bonne modale',()=>{
  const {game}=bootGame();game.startNew();game.tier=C.CITY_TIERS[2];game.research.insight=20;
  for(const key of C.RESOURCE_KEYS)game.resources[key]=500;
  const before={...game.resources};game.paused=true;game.activeOverlay=game.ui.pauseMenu;
  assert.equal(game.launchResearch('sanitation'),false);assert.deepEqual(game.resources,before);
  game.activeOverlay=game.ui.commandModal;assert.equal(game.launchResearch('sanitation'),true);
  assert.equal(game.hasResearch('logistics'),false);assert.equal(game.resources.medicine,before.medicine-8);
  assert.equal(game.research.insight,18);assert.equal(game.launchResearch('sanitation'),false);
  assert.ok(Save.parse(localStorage.getItem(C.SAVE_KEY)).research.completed.includes('sanitation'));
  assert.equal(game.launchResearch('recon'),false);assert.equal(game.launchResearch('__proto__'),false);
});
test('commandement : chaque identifiant DOM référencé existe et les modules sont hors ligne',()=>{
  const fs=require('node:fs'),path=require('node:path'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const code=fs.readFileSync(path.join(__dirname,'../src/command-ui.js'),'utf8');
  for(const match of code.matchAll(/(?:get|bind)\('([^']+)'\)/g)){
    if(match[1].endsWith('-'))continue;assert.ok(html.includes('id="'+match[1]+'"'),match[1]);
  }
  for(const name of ['tactics','profile','command-ui'])assert.ok(html.includes('src/'+name+'.js'));
  assert.ok(!/https?:\/\//.test(code));
});
