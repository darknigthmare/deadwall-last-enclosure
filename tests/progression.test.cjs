'use strict';
const {standAt}=require('./helpers/physical-fixtures.cjs');
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const { bootGame } = require('./helpers/browser.cjs');
const { legacyAge } = require('./helpers/legacy-city.cjs');

function fresh(difficulty = 'standard') { const env = bootGame(); env.game.startNew(difficulty); return env; }
function addBuilding(game, type, gx = 72, gy = 72, progress = 1) {
  const result = new (game.core().constructor)(game.nextId++, type, gx, gy, 0, progress);
  game.world.add(result); return result;
}
function closeTo(actual, expected, label = '') { assert.ok(Math.abs(actual - expected) < 1e-7, `${label}: ${actual} / ${expected}`); }

test('difficulté : stocks, délai, récolte, santé et dégâts appliquent les trois réglages', () => {
  const waveCounts = [];
  for (const difficulty of Object.values(C.DIFFICULTIES)) {
    const { game } = fresh(difficulty.id), bonus = difficulty.id === 'story';
    assert.equal(game.resources.wood, 180 + (bonus ? 50 : 0));
    assert.equal(game.resources.scrap, 120 + (bonus ? 35 : 0));
    assert.equal(game.resources.food, 130 + (bonus ? 50 : 0));
    closeTo(game.phaseTime, C.Dayworks.dayDuration(1, difficulty.calmTime));
    const worker = game.units[0], Node = game.world.nodes[0].constructor;
    const node = new Node(999, 'wood', game.core().x + 350, game.core().y, 100, 20, 0);
    game.world.nodes = [node]; game.units = [worker]; worker.targetNode = node.id; worker.state = 'gather'; worker.think = 5;standAt(game,worker,node);
    game.updateUnits(.1); closeTo(worker.carry, .34 * difficulty.resourceYield, 'rendement');
    game.units = []; game.wave = 12; game.spawnZombie('walker');
    const zombie = game.zombies[0];
    closeTo(zombie.maxHealth, C.ENEMIES.walker.health * difficulty.enemyHealth * C.enemyHealthScale(12), 'santé');
    zombie.x = game.player.x + 10; zombie.y = game.player.y; zombie.attackCooldown = 0;
    game.updateZombies(.01); closeTo(100 - game.player.health, C.ENEMIES.walker.damage * difficulty.enemyDamage, 'dégâts');
    waveCounts.push(C.wavePlan(12, difficulty, 100).total);
  }
  assert.ok(waveCounts[0] < waveCounts[1] && waveCounts[1] < waveCounts[2]);
});

test('progression : les coûts unitaires sont finançables et les doctrines respectent leurs paliers', () => {
  for (const item of [...Object.values(C.BUILDINGS), ...C.RESEARCH]) {
    for (const amount of Object.values(item.cost)) assert.ok(amount <= C.BUILDINGS.core.storage + (item.unlockTier>=7?2*C.BUILDINGS.warehouse.storage:0), item.id);
  }
  const { game } = fresh(); game.research.insight = 100;
  assert.equal(game.currentResearch().id, 'logistics');
  game.launchResearch(); assert.equal(game.currentResearch(), null, 'le palier Refuge ne donne pas les doctrines avancées');
  addBuilding(game, 'house'); game.refreshMetrics(true);
  assert.equal(game.tier.id, 1); assert.equal(game.currentResearch().id, 'fortification');
  for (let i = 0; i < 8; i++) addBuilding(game, 'ammoFactory', 80 + (i % 4) * 4, 80 + Math.floor(i / 4) * 4);
  game.refreshMetrics(true);
  // Historical knowledge isolates doctrine transactions; repeated fixtures do not earn current campaign ages.
  legacyAge(game, C.Urban.score(game.world.buildings.values())); assert.ok(game.tier.id >= 4);
  while (game.currentResearch()) {
    const item = game.currentResearch(); game.resources = C.makeBag(Object.fromEntries(C.RESOURCE_KEYS.map(key => [key, 500])));
    const before = { ...game.resources }, insight = game.research.insight;
    game.launchResearch();
    assert.ok(game.hasResearch(item.id)); assert.equal(game.research.insight, insight - item.insight);
    for (const key of C.RESOURCE_KEYS) closeTo(game.resources[key], before[key] - (item.cost[key] || 0), item.id + ':' + key);
  }
  assert.deepEqual(game.research.completed, C.RESEARCH.map(item => item.id));
  const snapshot = JSON.stringify({ resources: game.resources, research: game.research }); game.launchResearch();
  assert.equal(JSON.stringify({ resources: game.resources, research: game.research }), snapshot, 'une doctrine terminée ne se paie pas deux fois');
});

test('recherche : ressources ou insight insuffisants ne consomment rien', () => {
  const { game } = fresh();
  const before = JSON.stringify(game.resources); game.launchResearch();
  assert.equal(JSON.stringify(game.resources), before); assert.deepEqual(game.research.completed, []);
  game.research.insight = 10; game.resources.scrap = 1; const scarce = JSON.stringify(game.resources);
  game.launchResearch(); assert.equal(JSON.stringify(game.resources), scarce); assert.equal(game.research.insight, 10);
});

test('doctrines : logistique accélère collecte et construction, balistique augmente les deux défenses', () => {
  const { game } = fresh(), worker = game.units[0], Unit = worker.constructor, Node = game.world.nodes[0].constructor;
  const node = new Node(999, 'wood', game.core().x + 350, game.core().y, 100, 20, 0);
  game.units = [worker]; game.world.nodes = [node]; worker.state = 'gather'; worker.targetNode = node.id; worker.think = 20;standAt(game,worker,node);
  game.updateUnits(.25); const basicHarvest = worker.carry; worker.carry = 0; game.research.completed.push('logistics');
  game.updateUnits(.25); closeTo(worker.carry, basicHarvest * 1.18);
  const site = addBuilding(game, 'house', 72, 72, 0); worker.carry = 0; worker.state = 'build'; worker.targetBuilding = site.id; standAt(game,worker,site);
  game.updateUnits(1); closeTo(site.progress, 1.22 / site.def.buildTime);
  game.research.completed = []; site.progress = 0; game.updateUnits(1); closeTo(site.progress, 1.05 / site.def.buildTime);

  const tower = addBuilding(game, 'watchtower', 80, 80), soldier = new Unit(game.nextId++, 'soldier', tower.x, tower.y);
  game.units = [soldier]; game.spawnZombie('walker'); const zombie = game.zombies[0]; zombie.x = tower.x + 100; zombie.y = tower.y; game.rebuildBuckets();
  game.updateBuildings(.01); closeTo(game.projectiles.at(-1).damage, 38);
  game.updateUnits(.01); closeTo(game.projectiles.at(-1).damage, 31);
  game.research.completed.push('ballistics'); tower.fireCooldown = 0; soldier.fireCooldown = 0; const ammo = game.resources.ammo;
  game.updateBuildings(.01); closeTo(game.projectiles.at(-1).damage, 38 * 1.12);
  game.updateUnits(.01); closeTo(game.projectiles.at(-1).damage, 35);
  assert.equal(game.resources.ammo, ammo - 2, 'deux tirs gardent leur consommation unitaire');
});

test('doctrines : sanitaire réduit les corps, réseau économise le carburant et améliore le délestage', () => {
  const { game } = fresh(), wall = addBuilding(game, 'woodWall');
  const corpsePressure = researched => {
    game.research.completed = researched ? ['sanitation'] : []; game.spawnZombie('armored'); const zombie = game.zombies.at(-1);
    zombie.x = wall.x; zombie.y = wall.y; wall.corpseLoad = 0; game.killZombie(zombie, false); return wall.corpseLoad;
  };
  closeTo(corpsePressure(false), 2.2); closeTo(corpsePressure(true), .65);
  addBuilding(game, 'generator', 78, 78); const lumber = addBuilding(game, 'lumber', 82, 82);
  const production = researched => {
    game.research.completed = researched ? ['grid'] : []; game.resources.fuel = 100; game.resources.wood = 100;
    lumber.powered = false; lumber.powerShare = .5; game.economyTick(1);
    return { fuel: 100 - game.resources.fuel, wood: game.resources.wood - 100 };
  };
  const normal = production(false), improved = production(true);
  closeTo(improved.fuel, normal.fuel * .75); closeTo(improved.wood, normal.wood * 2);
});

test('reconnaissance : annonce quinze secondes, moins de crises ; insight gagné une fois par vague', () => {
  const { game } = fresh(); game.research.completed.push('recon'); game.wave = 5; game.phaseTime = 0;
  let chance = null; game.random.chance = value => { chance = value; return false; };
  game.updateDirector(.1); assert.equal(game.phase, 'warning'); assert.equal(game.phaseTime, 15); closeTo(chance, .14);
  game.phase = 'assault'; game.spawnQueue = []; game.pendingSpawns = C.normalizeSpawnCounts(); game.zombies = [];
  game.updateDirector(.1); assert.equal(game.phase, 'aftermath'); assert.equal(game.research.insight, 2); assert.equal(game.stats.wavesSurvived, 1);
  game.updateDirector(.1); assert.equal(game.research.insight, 2); assert.equal(game.stats.wavesSurvived, 1);
});

test('commandement : caserne, ressources et logements conditionnent le recrutement sans débit partiel', () => {
  const { game, elements } = fresh(), startingPopulation = game.population;
  assert.equal(game.canRecruit('soldier'), false);
  addBuilding(game, 'barracks'); game.refreshMetrics(true); game.resources.scrap = 9;
  const before = JSON.stringify(game.resources); game.recruit('soldier');
  assert.equal(JSON.stringify(game.resources), before); assert.equal(game.population, startingPopulation);
  game.resources.scrap = 10; game.resources.ammo = 20; game.resources.food = 15; game.updateUI(); elements.get('recruitSoldier').click();
  assert.equal(game.population, startingPopulation + 1); assert.equal(game.units.at(-1).kind, 'soldier');
  assert.equal(game.resources.scrap, 0); assert.equal(game.resources.ammo, 0); assert.equal(game.resources.food, 0);
  game.housing = game.population; game.resources.food = 100; game.recruit('worker'); assert.equal(game.resources.food, 100);
});

test('commandement : améliorer préserve les dégâts ; réparer et démolir le mur fonctionnent', () => {
  const { game, elements } = fresh(); let wall = addBuilding(game, 'woodWall');
  for (let i = 0; i < 5; i++) addBuilding(game, 'house', 78 + i * 3, 78);
  game.refreshMetrics(true);
  // Historical knowledge isolates upgrade payments and damage preservation, not current campaign progression.
  legacyAge(game, C.Urban.score(game.world.buildings.values())); wall = game.world.buildings.get(wall.id);
  wall.health = wall.maxHealth / 2; game.selectBuilding(wall); game.updateUI();
  const before = { ...game.resources }, cost = C.scaledCost(C.BUILDINGS.steelWall.cost, .72);
  elements.get('upgradeSelected').click(); assert.equal(wall.type, 'steelWall'); closeTo(wall.health, wall.maxHealth / 2);
  assert.equal(game.resources.scrap, before.scrap - cost.scrap); assert.equal(game.resources.stone, before.stone - cost.stone);
  game.updateUI(); elements.get('repairSelected').click(); assert.equal(wall.health, wall.maxHealth);
  elements.get('demolishSelected').click(); assert.equal(wall.dead, false, 'aperçu sans démontage');
  elements.get('demolitionConfirm').click(); assert.equal(wall.dead, true); assert.equal(game.world.buildings.has(wall.id), false);
  game.selectBuilding(game.core()); elements.get('demolishSelected').click(); assert.ok(game.core(), 'le commandement ne se démolit pas');
});

test('interface stratégique : doctrines verrouillées distinctes des doctrines terminées et menace toujours bornée', () => {
  const { game } = fresh(); game.research.completed = ['logistics']; game.updateUI();
  assert.match(game.ui.researchName.textContent, /CAMP FORTIFIÉ/); assert.match(game.ui.researchInsight.textContent, /1\/6 doctrines/);
  assert.equal(game.ui.researchButton.disabled, false, 'la bibliothèque reste consultable même sans doctrine finançable'); assert.match(game.ui.researchButton.title, /Chaînage/);
  game.research.completed = C.RESEARCH.map(item => item.id); game.updateUI(); assert.equal(game.ui.researchName.textContent, 'Doctrines complètes');
  game.phase = 'warning';
  for (const [time, width] of [[15,'0%'], [12,'20%'], [7.5,'50%'], [0,'100%'], [-1,'100%']]) {
    game.phaseTime = time; game.updateUI(); assert.equal(game.ui.threatFill.style.width, width);
  }
  const html = require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../index.html'), 'utf8');
  assert.match(html, /id="recruitSoldier"[^]*?15 nourriture · 20 munitions · 10 ferraille<\/small>/);
});

test('tutoriel : électrifier exige un générateur terminé et une réserve réelle, récompense unique', () => {
  const { game } = fresh(); game.objectiveIndex = C.OBJECTIVES.findIndex(objective => objective.id === 'power');
  const index = game.objectiveIndex, generator = addBuilding(game, 'generator', 72, 72, .5);
  game.resources.fuel = 10; game.updateObjective(); assert.equal(game.objectiveIndex, index);
  generator.progress = 1; game.resources.fuel = 0; game.updateObjective(); assert.equal(game.objectiveIndex, index);
  game.resources.fuel = .1; game.updateObjective(); assert.equal(game.objectiveIndex, index + 1); closeTo(game.resources.fuel, 20.1);
  game.updateObjective(); closeTo(game.resources.fuel, 20.1, 'aucune récompense répétée');
});

test('défense : un piège usé qui tue son dernier infecté est effectivement détruit', () => {
  const { game } = fresh();
  // This isolates trap wear: the forced incoming actor must not start inside a physical prop.
  let cell=null;for(let y=56;y<75&&!cell;y++)for(let x=56;x<78;x++)if(game.world.placement(C.BUILDINGS.spikes,x,y).valid&&game.friendlyPositionClear({radius:11},x*32-10,y*32+16)){cell={x,y};break;}
  assert.ok(cell,'fixture avec accès libre au piège');const trap=addBuilding(game,'spikes',cell.x,cell.y);
  trap.health = .1; game.units = []; game.player.dead = true; game.spawnZombie('walker');
  const zombie = game.zombies[0]; Object.assign(zombie, { x: trap.left - 10, y: trap.y, health: .1, attackCooldown: 1 });
  game.flow.direction = () => ({ x: 1, y: 0 }); game.updateZombies(.1);
  assert.equal(zombie.dead, true); assert.equal(trap.dead, true); assert.equal(game.world.buildings.has(trap.id), false);
  assert.equal(game.stats.buildingsLost, 1); assert.equal(game.stats.kills, 1);
});

test('objectif : un dépôt plein réserve toute la récompense sans perdre le critère accompli', () => {
  const { game } = fresh(), index = C.OBJECTIVES.findIndex(obj => obj.id === 'house');
  game.objectiveIndex = index;
  const house = addBuilding(game, 'house'); game.refreshMetrics(true);
  game.resources.food = game.storage;
  const before = { ...game.resources };
  game.updateObjective();
  assert.equal(game.objectiveIndex, index);
  assert.equal(game.objectiveReady, true);
  assert.equal(game.objectiveProgress, C.OBJECTIVES[index].target);
  assert.deepEqual(game.resources, before, 'aucune partie de la récompense ne disparaît dans le plafond');
  game.destroyBuilding(house); game.updateObjective(); game.updateUI();
  assert.equal(game.objectiveReady, true, 'le dortoir détruit ne retire pas une récompense déjà acquise');
  assert.equal(game.objectiveProgress, 1);
  assert.match(game.ui.objectiveText.textContent, /Objectif rempli.*récompense réservée/i);
  assert.match(game.ui.objectiveText.textContent, /35.*nourriture/i);
  game.resources.food -= 35;
  game.updateObjective();
  assert.equal(game.resources.food, game.storage);
  assert.equal(game.objectiveIndex, index + 1);
  assert.equal(game.objectiveReady, false);
  assert.equal(game.objectiveProgress, 0);
  game.updateObjective();
  assert.equal(game.resources.food, game.storage, 'le versement ne peut être répété');
});

test('objectif : une seule place manquante empêche le versement partiel de plusieurs ressources', () => {
  const { game } = fresh(), index = C.OBJECTIVES.findIndex(obj => obj.id === 'gather');
  game.objectiveIndex = index; game.depositedResources = 30;
  game.resources.wood = game.storage - 35; game.resources.scrap = game.storage - 19;
  const before = { ...game.resources };
  for (let tick = 0; tick < 3; tick++) game.updateObjective();
  assert.equal(game.notifications.filter(n => /Récompense réservée/.test(n.text)).length, 1, 'une seule annonce pendant l’attente');
  assert.equal(game.objectiveIndex, index);
  assert.equal(game.objectiveReady, true);
  assert.deepEqual(game.resources, before, 'ni bois versé seul, ni ferraille écrêtée');
  game.updateUI();
  assert.match(game.ui.objectiveText.textContent, /1.*ferraille/i);
  assert.match(game.ui.objectiveCounter.textContent, /30 \/ 30/);
  game.resources.scrap -= 1;
  game.updateObjective();
  assert.equal(game.objectiveIndex, index + 1);
  assert.equal(game.resources.wood, game.storage);
  assert.equal(game.resources.scrap, game.storage);
  assert.equal(game.notifications.filter(n => /Récompense reçue/.test(n.text)).length, 1);
  assert.ok(C.RESOURCE_KEYS.every(key => game.resources[key] <= game.storage));
  game.updateObjective();
  assert.equal(game.resources.wood, game.storage);
  assert.equal(game.resources.scrap, game.storage);
});

test('objectif : récompense réservée et bâtiment perdu persistent jusqu’à un versement unique après reprise', () => {
  const { game } = fresh(), index = C.OBJECTIVES.findIndex(obj => obj.id === 'house');
  game.objectiveIndex = index;
  const house = addBuilding(game, 'house'); game.refreshMetrics(true);
  game.resources.food = game.storage; game.updateObjective(); game.destroyBuilding(house);
  assert.equal(game.save(false), true);
  assert.equal(game.load(), true);
  assert.equal(game.objectiveIndex, index); assert.equal(game.objectiveReady, true);
  assert.equal(game.objectiveProgress, 1);
  assert.equal([...game.world.buildings.values()].some(b => b.type === 'house'), false);
  game.updateObjective(); assert.equal(game.objectiveIndex, index);
  game.resources.food -= 35; game.updateObjective();
  assert.equal(game.resources.food, game.storage);
  assert.equal(game.objectiveIndex, index + 1); assert.equal(game.objectiveReady, false);
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  game.updateObjective();
  assert.equal(game.resources.food, game.storage);
  assert.equal(game.objectiveIndex, index + 1, 'la reprise ne réattribue pas la récompense du dortoir');
});

test('objectif : sauvegardes sans attente et nouvelle campagne ne reçoivent aucune récompense héritée', () => {
  const { game } = fresh(), Save = require('../src/save.js');
  assert.equal(game.objectiveReady, false);
  const old = structuredClone(game.serialize()); delete old.objectiveReady;
  assert.equal(Save.validate(old).objectiveReady, false);
  assert.equal(game.restoreSave(old), true); assert.equal(game.objectiveReady, false);
  game.depositedResources = 30; game.resources.wood = game.storage; game.updateObjective();
  assert.equal(game.objectiveReady, true);
  game.startNew('standard', '71717');
  assert.equal(game.objectiveReady, false); assert.equal(game.objectiveIndex, 0); assert.equal(game.objectiveProgress, 0);
  assert.equal(game.resources.wood, 180);
});

test('objectif : les attentes malformées sont refusées avant toute mutation de la campagne', () => {
  const { game } = fresh(), Save = require('../src/save.js'), raw = structuredClone(game.serialize()), world = game.world;
  const before = { ...game.resources };
  for (const objectiveReady of [null, 0, 1, 'true', {}, []]) {
    const invalid = { ...raw, objectiveReady };
    assert.throws(() => Save.validate(invalid), /objectif/i);
    assert.throws(() => game.restoreSave(invalid), /objectif/i);
  }
  for (const invalid of [
    { ...raw, objectiveReady: true, objectiveProgress: 29 },
    { ...raw, objectiveReady: true, objectiveIndex: C.OBJECTIVES.length, objectiveProgress: 30 }
  ]) {
    assert.throws(() => Save.validate(invalid), /objectif/i);
    assert.throws(() => game.restoreSave(invalid), /objectif/i);
  }
  assert.equal(Save.validate({ ...raw, objectiveReady: true, objectiveProgress: 30 }).objectiveReady, true);
  assert.equal(Save.validate({ ...raw, objectiveReady: true, objectiveProgress: 50 }).objectiveProgress, 30, 'une attente valide est figée sur la cible');
  assert.equal(game.world, world); assert.deepEqual(game.resources, before);
});

test('objectif : un versement immédiat ne présente pas de fausse attente et ne se répète pas', () => {
  const { game } = fresh(); game.depositedResources = 30;
  const before = { ...game.resources };
  game.updateObjective(); game.updateObjective();
  assert.equal(game.objectiveIndex, 1); assert.equal(game.objectiveReady, false);
  assert.equal(game.resources.wood, before.wood + 35); assert.equal(game.resources.scrap, before.scrap + 20);
  assert.equal(game.notifications.filter(n => /Récompense reçue/.test(n.text)).length, 1);
  assert.equal(game.notifications.filter(n => /Récompense réservée/.test(n.text)).length, 0);
});
