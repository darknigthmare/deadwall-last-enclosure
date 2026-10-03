'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {bootGame}=require('./helpers/browser.cjs');
const terrain=g=>g.world.nodes.map(n=>[n.id,n.type,n.x,n.y]);
function seedControls(env){
  const menu=env.elements.get('mainMenu'),row=document.createElement('div');row.classList.add('seed-controls');
  const input=document.getElementById('mapSeed');input.tagName='INPUT';row.appendChild(input);menu.appendChild(row);
  for(const id of ['startScenario','startScenarioDescription','startScenarioFacts','seedHint'])menu.appendChild(document.getElementById(id));
  delete require.cache[require.resolve('../src/scenario-ui.js')];require('../src/scenario-ui.js');
  return {input,row,hint:document.getElementById('seedHint')};
}
test('135 : deux nouvelles campagnes par défaut produisent des graines et terrains distincts, sans remplir le champ',()=>{
  const env=bootGame(),g=env.game,{input,hint}=seedControls(env),confirm=globalThis.confirm;globalThis.confirm=()=>true;
  try{
    assert.equal(g.requestNewGame(),true);const first=g.world.seed,firstTerrain=terrain(g);g.returnToMenu();
    assert.equal(input.value,'');assert.equal(g.requestNewGame(),true);assert.notEqual(g.world.seed,first);assert.notDeepEqual(terrain(g),firstTerrain);
    assert.equal(input.value,'');assert.ok(hint.textContent.includes('Campagne active : carte '+g.world.seed));
  }finally{globalThis.confirm=confirm;}
});
test('135 : graine explicite reproductible et reprise inchangée, puis retour volontaire au tirage',()=>{
  const env=bootGame(),g=env.game,{input,row}=seedControls(env);input.value='4294967295';input.dispatch('input');
  g.startNew('standard',input.value);const first=terrain(g);g.startNew('standard',input.value);
  assert.equal(g.world.seed,4294967295);assert.deepEqual(terrain(g),first);assert.equal(g.save(false),true);
  g.returnToMenu();assert.equal(g.load(),true);assert.equal(g.world.seed,4294967295);assert.deepEqual(terrain(g),first);
  g.returnToMenu();row.children.find(n=>n.id==='randomEachCampaign135').click();assert.equal(input.value,'');
  g.startNew('standard',input.value);assert.notEqual(g.world.seed,4294967295);
});
test('135 : aperçu aléatoire à usage unique et départ refusé conserve campagne et aperçu',()=>{
  const env=bootGame(),g=env.game;seedControls(env);g.startNew('standard','17117');
  const world=g.world,resources={...g.resources};g.previewMapSeed135=84329;
  assert.equal(g.startNew('standard','invalide'),false);assert.equal(g.world,world);assert.deepEqual(g.resources,resources);assert.equal(g.previewMapSeed135,84329);
  assert.equal(g.startNew('standard','','inconnu'),false);assert.equal(g.world,world);assert.equal(g.previewMapSeed135,84329);
  g.startNew('standard','');assert.equal(g.world.seed,84329);assert.equal(g.previewMapSeed135,null);
  g.startNew('standard','');assert.notEqual(g.world.seed,84329);
});
test('135 : entropie crypto répétée, indisponible ou refusée garde un entier inédit sans casser le départ',()=>{
  const source=fs.readFileSync(require.resolve('../src/profile.js'),'utf8');
  for(const crypto of [{getRandomValues(a){a[0]=0xffffffff;}},{getRandomValues(){throw Error('Denied');}},undefined]){
    const fixedMath=Object.create(Math);fixedMath.random=()=>0;
    const context={crypto,Math:fixedMath,Date:{now:()=>0},Uint32Array};vm.createContext(context);vm.runInContext(source,context);
    const seen=[];for(let i=0;i<4;i++){const seed=context.DeadwallProfile.freshSeed(seen);assert.ok(Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff);assert.ok(!seen.includes(seed));seen.push(seed);}
  }
});
