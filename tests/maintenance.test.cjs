'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/core.js'),{bootGame}=require('./helpers/browser.cjs');
function fresh(){
  const env=bootGame();env.game.startNew('standard','17117');
  const review=env.elements.get('demolitionReview');
  env.elements.get('rightPanel').appendChild(review);
  for(const id of ['demolitionCancel','demolitionConfirm']){const button=env.elements.get(id);button.tagName='BUTTON';review.appendChild(button);}
  return env;
}
function building(game,type='woodWall',complete=true){
  const b=new (game.core().constructor)(game.nextId++,type,76,76,0,complete?1:.5);game.world.add(b);game.refreshMetrics(true);game.selectBuilding(b);return b;
}
test('entretien : devis de réparation conserve les coûts historiques et débit exact sur tous les bâtiments',()=>{
  for(const type of Object.keys(C.BUILDINGS)){
    const {game,elements}=fresh(),b=type==='core'?game.core():building(game,type);game.selectBuilding(b);b.health=b.maxHealth*.4;
    const ratio=1-b.health/b.maxHealth,expected={scrap:Math.ceil(ratio*b.maxHealth/45),wood:type==='woodWall'?Math.ceil(ratio*12):0,stone:type==='concreteWall'?Math.ceil(ratio*16):0};
    for(const key of C.RESOURCE_KEYS)game.resources[key]=500;
    const before={...game.resources};assert.deepEqual(game.structureActionStatus('repair').cost,expected);game.updateSelectionUI();
    assert.ok(elements.get('selectionRepairQuote').textContent.includes(C.resourceText(expected)));
    assert.equal(game.repairSelected(),true);assert.equal(b.health,b.maxHealth);
    for(const key of C.RESOURCE_KEYS)assert.equal(game.resources[key],before[key]-(expected[key]||0));
    assert.equal(elements.get('repairSelected').disabled,true);
  }
});
test('entretien : pénurie visible ne dépense rien et n’améliore ni ne répare',()=>{
  const {game,elements}=fresh(),b=building(game);b.health/=2;game.tier=C.CITY_TIERS[3];game.resources=C.makeBag();game.updateSelectionUI();
  assert.equal(elements.get('repairSelected').disabled,true);assert.equal(elements.get('upgradeSelected').disabled,true);
  assert.match(elements.get('selectionRepairQuote').textContent,/Réserves insuffisantes/);
  const before=JSON.stringify(game.resources),health=b.health;
  assert.equal(game.repairSelected(),false);assert.equal(game.upgradeSelected(),false);
  assert.equal(b.type,'woodWall');assert.equal(b.health,health);assert.equal(JSON.stringify(game.resources),before);
});
test('entretien : coût amélioration, verrouillage de palier et ratio de dégâts conservés',()=>{
  const {game,elements}=fresh(),b=building(game);b.health/=2;game.updateSelectionUI();
  assert.match(elements.get('selectionUpgradeQuote').textContent,/Palier requis/);
  const expected=C.scaledCost(C.BUILDINGS.steelWall.cost,.72);assert.deepEqual(game.structureActionStatus('upgrade').cost,expected);
  game.tier=C.CITY_TIERS[3];const before={...game.resources};game.upgradeSelected();assert.equal(b.type,'steelWall');assert.equal(b.health,b.maxHealth/2);
  assert.equal(game.resources.scrap,before.scrap-expected.scrap);assert.equal(game.resources.stone,before.stone-expected.stone);
});
test('entretien : réparation collective affiche et facture les seules défenses achevées et vivantes',()=>{
  const {game,elements}=fresh(),wall=building(game);wall.health-=100;
  const incomplete=building(game,'steelWall',false),house=building(game,'house'),dead=building(game,'steelWall');house.health-=50;dead.health=0;dead.dead=true;
  const q=game.emergencyRepairStatus();assert.equal(q.defenses.length,1);assert.equal(q.defenses[0],wall);assert.deepEqual(q.cost,{scrap:2,wood:1,stone:1});
  game.updateSelectionUI();assert.match(elements.get('repairAllQuote').textContent,/1 défense ·/);
  const before={...game.resources},unfinished=incomplete.health;game.repairAll();
  assert.equal(wall.health,wall.maxHealth);assert.equal(incomplete.health,unfinished);assert.equal(house.health,house.maxHealth-50);assert.equal(dead.health,0);
  for(const key of C.RESOURCE_KEYS)assert.equal(game.resources[key],before[key]-(q.cost[key]||0));
});
test('démontage : premier clic sans mutation, annulation et confirmation distinctes',()=>{
  const {game,elements}=fresh(),b=building(game),before=JSON.stringify(game.resources);game.updateSelectionUI();
  elements.get('demolishSelected').click();assert.equal(game.pendingDemolition,b);assert.equal(b.dead,false);assert.equal(JSON.stringify(game.resources),before);
  assert.equal(elements.get('demolishSelected').getAttribute('aria-expanded'),'true');assert.match(elements.get('demolitionSummary').textContent,/ouvrir votre enceinte/);
  elements.get('demolitionCancel').click();assert.equal(game.pendingDemolition,null);assert.equal(b.dead,false);
  elements.get('demolishSelected').click();elements.get('demolitionConfirm').click();assert.equal(b.dead,true);
  const after=JSON.stringify(game.resources);assert.equal(game.confirmDemolition(),false);assert.equal(JSON.stringify(game.resources),after);
});
test('démontage : sélection différente, pause et structure détruite invalident la confirmation',()=>{
  for(const event of ['selection','pause','destroy']){
    const {game}=fresh(),b=building(game);game.requestDemolition();
    if(event==='selection')game.selectBuilding(game.core());
    if(event==='pause')game.togglePause(true);
    if(event==='destroy'){game.world.remove(b);b.dead=true;}
    const before=JSON.stringify(game.resources);assert.equal(game.confirmDemolition(),false);assert.equal(JSON.stringify(game.resources),before);
    if(event!=='destroy')assert.equal(b.dead,false);
  }
});
test('démontage : centre protégé et référence retirée refusée même par appel direct',()=>{
  const {game,elements}=fresh();game.selectBuilding(game.core());game.updateSelectionUI();assert.equal(elements.get('demolishSelected').disabled,true);assert.equal(game.requestDemolition(),false);assert.equal(game.demolishSelected(),false);
  const b=building(game);game.world.remove(b);assert.equal(game.demolishSelected(),false);assert.equal(game.repairSelected(),false);assert.equal(game.upgradeSelected(),false);
});
test('démontage : une amélioration invalide l’ancien devis et rafraîchit la sélection immédiatement',()=>{
  const {game,elements}=fresh(),b=building(game);game.tier=C.CITY_TIERS[3];game.requestDemolition();
  assert.equal(game.upgradeSelected(),true);assert.equal(b.type,'steelWall');assert.equal(game.pendingDemolition,null);
  assert.equal(elements.get('selectionName').textContent,C.BUILDINGS.steelWall.name);
  const before=JSON.stringify(game.resources);assert.equal(game.confirmDemolition(),false);assert.equal(b.dead,false);assert.equal(JSON.stringify(game.resources),before);
});
test('démontage : aucun gain annoncé ni créé à stocks pleins, fractions restituées sans arrondi économique',()=>{
  const {game,elements}=fresh(),b=building(game);for(const key of C.RESOURCE_KEYS)game.resources[key]=game.storage;
  game.requestDemolition();assert.match(elements.get('demolitionSummary').textContent,/aucun matériau/);
  game.resources.wood=game.storage-.25;game.updateSelectionUI();const q=game.structureActionStatus('demolish');
  assert.equal(q.refund.wood,.25);assert.match(elements.get('demolitionSummary').textContent,/≈ 0,25/);game.confirmDemolition();assert.equal(game.resources.wood,game.storage);assert.equal(b.dead,true);
});
test('démontage entrepôt : aperçu de la capacité et pertes, ressources immédiatement sauvegardables',()=>{
  const {game,elements}=fresh(),b=building(game,'warehouse');assert.equal(game.storage,1100);
  game.resources.wood=900;game.resources.scrap=499.5;game.requestDemolition();const q=game.structureActionStatus('demolish');
  assert.equal(q.cap,500);assert.equal(q.lost.wood,400);assert.equal(q.refund.scrap,.5);
  assert.match(elements.get('demolitionSummary').textContent,/Capacité restante : 500/);assert.match(elements.get('demolitionSummary').textContent,/Excédent perdu :/);
  game.confirmDemolition();assert.equal(b.dead,true);assert.equal(game.storage,500);assert.equal(game.resources.wood,500);assert.equal(game.resources.scrap,500);
  assert.equal(game.save(false),true);
});
test('entretien : devis sans mutation, RNG ni nouvelles données de sauvegarde et commandes inactives derrière la pause',()=>{
  const {game}=fresh(),b=building(game);b.health/=2;
  const snapshot=()=>{const data=game.serialize();delete data.timestamp;return JSON.stringify(data);},before=snapshot();
  for(let i=0;i<3;i++){game.updateSelectionUI();game.structureActionStatus('repair');game.structureActionStatus('upgrade');game.structureActionStatus('demolish');game.emergencyRepairStatus();}
  assert.equal(snapshot(),before);game.togglePause(true);
  const stocks=JSON.stringify(game.resources);assert.equal(game.repairSelected(),false);assert.equal(game.upgradeSelected(),false);assert.equal(game.demolishSelected(),false);assert.equal(game.repairAll(),false);assert.equal(JSON.stringify(game.resources),stocks);
});
