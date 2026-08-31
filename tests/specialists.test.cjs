'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const Save = require('../src/save.js');
const { bootGame } = require('./helpers/browser.cjs');

const closeTo = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, message || `${actual} != ${expected}`);
function fresh() {
  const env = bootGame(); env.game.startNew('standard');
  const Unit = env.game.units[0].constructor; env.game.units = []; env.game.world.nodes = [];
  return { ...env, Unit };
}
function building(game, type, gx, gy, progress = 1, rotation = 0) {
  const result = new (game.core().constructor)(game.nextId++, type, gx, gy, rotation, progress); game.world.add(result); return result;
}
function specialist(game, Unit, kind, x = game.core().x + 160, y = game.core().y) {
  const unit = new Unit(game.nextId++, kind, x, y); game.units.push(unit); return unit;
}
function tick(game, seconds) {
  for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += .05) { game.elapsed += .05; game.updateUnits(.05); }
}
function unlock(game) {
  building(game, 'clinic', 75, 75); building(game, 'workshop', 79, 75); building(game, 'house', 75, 79); game.refreshMetrics(true);
}
function ring(game) {
  for (let x = 58; x <= 70; x++) { building(game, 'woodWall', x, 58); building(game, 'woodWall', x, 70); }
  for (let y = 59; y < 70; y++) { building(game, 'woodWall', 58, y); if (![64,65].includes(y)) building(game, 'woodWall', 70, y); }
  return building(game, 'gate', 70, 64, 1, 1);
}

test('spécialistes : catalogue conserve les anciens profils et refuse les faux rôles', () => {
  const { game, Unit } = fresh();
  assert.equal(new Unit(901, 'worker', 0, 0).maxHealth, 85); assert.equal(new Unit(902, 'soldier', 0, 0).speed, 74);
  assert.equal(new Unit(903, 'medic', 0, 0).maxHealth, 90); assert.equal(new Unit(904, 'engineer', 0, 0).maxHealth, 105);
  assert.equal(game.canRecruit('unknown'), false); assert.equal(game.canRecruit('__proto__'), false); assert.equal(game.canRecruit('toString'), false);
  assert.throws(() => new Unit(905, 'unknown', 0, 0));
  assert.ok(C.NPC_RULES.medicinePerHealth > 0 && C.NPC_RULES.repairScrapPerHealth > 0);
});

test('spécialistes : recrutement exige palier, bâtiment terminé, logement et coût entier', () => {
  const { game } = fresh(); game.refreshMetrics(true);
  const clinic = building(game, 'clinic', 75, 75, .5), workshop = building(game, 'workshop', 79, 75, .5);
  game.tier = C.CITY_TIERS[2]; assert.equal(game.canRecruit('medic'), false); assert.equal(game.canRecruit('engineer'), false);
  clinic.progress = 1; workshop.progress = 1; game.refreshMetrics(true); game.tier = C.CITY_TIERS[1];
  assert.equal(game.canRecruit('medic'), false); assert.equal(game.canRecruit('engineer'), false);
  game.tier = C.CITY_TIERS[2]; game.resources.food = 100; game.resources.scrap = 100; game.resources.medicine = 7;
  const before = { ...game.resources }; assert.equal(game.recruit('medic'), false); assert.deepEqual(game.resources, before);
  game.resources.medicine = 8; assert.equal(game.recruit('medic'), true);
  assert.equal(game.resources.food, 65); assert.equal(game.resources.medicine, 0); assert.equal(game.units[0].kind, 'medic');
  game.tier = C.CITY_TIERS[2]; assert.equal(game.recruit('engineer'), true); assert.equal(game.resources.food, 30); assert.equal(game.resources.scrap, 65);
  game.housing = game.population; const full = { ...game.resources }; assert.equal(game.recruit('engineer'), false); assert.deepEqual(game.resources, full);
});

test('spécialistes : recrutement et repli respectent la pause tactique, les rations et les logements', () => {
  const { game } = fresh(); unlock(game); game.resources.food = 200; game.resources.medicine = 20;
  game.paused = true; assert.equal(game.recruit('medic'), false);
  game.activeOverlay = game.ui.commandModal; assert.equal(game.recruit('medic'), true); assert.equal(game.recruit('engineer'), true);
  assert.equal(game.population, 3); const food = game.resources.food; game.economyTick(1); closeTo(food - game.resources.food, 3 * .0065);
  assert.equal(game.setWorkerOrder('retreat'), true); assert.ok(game.units.every(unit => unit.state === 'flee'));
  game.activeOverlay = game.ui.pauseMenu; assert.equal(game.recruit('worker'), false);
});

test('survivants : les quatre vitesses de profil et le malus de moral résistent aux ticks économiques', () => {
  const { game, Unit } = fresh();
  for (const kind of Object.keys(C.SURVIVORS)) specialist(game, Unit, kind);
  game.morale = 100; game.economyTick(1);
  for (const unit of game.units) closeTo(unit.speed, C.SURVIVORS[unit.kind].speed);
  game.morale = 10; game.economyTick(1);
  for (const unit of game.units) closeTo(unit.speed, C.SURVIVORS[unit.kind].speed * .82);
  game.morale = 50; game.economyTick(1);
  for (const unit of game.units) closeTo(unit.speed, C.SURVIVORS[unit.kind].speed);
});

test('secouriste : soins proches continus et médicaments strictement proportionnels sans sursoin', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'), patient = specialist(game, Unit, 'worker', medic.x + 30, medic.y);
  patient.health = 40; game.resources.medicine = 4; game.updateUnits(.5);
  closeTo(patient.health, 43); closeTo(game.resources.medicine, 4 - 3 * C.NPC_RULES.medicinePerHealth); assert.equal(medic.supportActive, true);
  patient.health = patient.maxHealth - .2; const medicine = game.resources.medicine; game.updateUnits(.5);
  closeTo(patient.health, patient.maxHealth); closeTo(game.resources.medicine, medicine - .2 * C.NPC_RULES.medicinePerHealth);
  game.updateUnits(.1); assert.equal(medic.supportActive, false);
});

test('secouriste : reliquat de médicament consommé au prorata, zéro soin gratuit et aucune résurrection', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'); game.player.x = medic.x + 20; game.player.y = medic.y; game.player.health = 50;
  game.resources.medicine = C.NPC_RULES.medicinePerHealth / 2; game.updateUnits(1);
  closeTo(game.player.health, 50.5); closeTo(game.resources.medicine, 0);
  game.updateUnits(1); closeTo(game.player.health, 50.5); assert.equal(medic.supportActive, false);
  game.player.dead = true; game.player.health = 0; game.player.downTimer = 5; game.resources.medicine = 10;
  tick(game, 1); assert.equal(game.player.health, 0); assert.equal(game.player.downTimer, 5); assert.equal(game.resources.medicine, 10);
  const dead = specialist(game, Unit, 'soldier', medic.x, medic.y); dead.dead = true; dead.health = 0;
  assert.equal(game.healWithMedic(medic, dead, 1), 0); assert.equal(dead.dead, true);
});

test('secouriste : mur fermé interdit les soins, puis le passage réel par la porte débloque le blessé', () => {
  const { game, Unit } = fresh(), gate = ring(game), medic = specialist(game, Unit, 'medic', C.world(69), C.world(63));
  const patient = specialist(game, Unit, 'soldier', C.world(71), C.world(63)); patient.health = 20;
  game.player.x = game.core().x; game.player.y = game.core().y; game.rally = { x: patient.x, y: patient.y }; patient.offset = { x:0, y:0 };
  assert.equal(game.setGateMode('closed', gate), true); const medicine = game.resources.medicine;
  assert.ok(C.dist(medic, patient) <= C.NPC_RULES.healRange); tick(game, 1);
  assert.equal(patient.health, 20); assert.equal(game.resources.medicine, medicine); assert.ok(medic.x < gate.left);
  game.setGateMode('auto', gate); let crossed = false;
  for (let i = 0; i < 400 && patient.health === 20; i++) { game.elapsed += .05; game.updateUnits(.05); if (C.grid(medic.x) === 70 && [64,65].includes(C.grid(medic.y))) crossed = true; }
  assert.ok(crossed, 'le secouriste traverse la porte au lieu de soigner à travers le mur'); assert.ok(patient.health > 20);
});

test('secouriste : un blessé inaccessible ne prive pas un autre blessé accessible de soins', () => {
  const { game, Unit } = fresh(), gate = ring(game), medic = specialist(game, Unit, 'medic', C.world(68), C.world(63));
  const outside = specialist(game, Unit, 'soldier', C.world(72), C.world(63)), inside = specialist(game, Unit, 'worker', C.world(67), C.world(63));
  outside.health = 1; inside.health = 20; game.rally = { x: outside.x, y: outside.y }; outside.offset = { x:0, y:0 };
  game.player.x = game.core().x; game.player.y = game.core().y; game.setGateMode('closed', gate); tick(game, 1);
  assert.equal(outside.health, 1); assert.ok(inside.health > 20);
});

test('ingénieur : réparation locale progressive et prélèvement exact des matériaux', () => {
  const { game, Unit } = fresh(), wall = building(game, 'woodWall', 71, 64), engineer = specialist(game, Unit, 'engineer', wall.left - 20, wall.y);
  wall.health -= 100; const health = wall.health, resources = { ...game.resources }; game.updateUnits(.5);
  closeTo(wall.health, health + 7); closeTo(game.resources.scrap, resources.scrap - 7 / 45);
  closeTo(game.resources.wood, resources.wood - 12 * 7 / wall.maxHealth); assert.equal(engineer.supportActive, true); assert.equal(engineer.state, 'repair');
  wall.health = wall.maxHealth - .1; const scrap = game.resources.scrap; game.updateUnits(.5);
  closeTo(wall.health, wall.maxHealth); closeTo(game.resources.scrap, scrap - .1 / 45);
});

test('ingénieur : pénurie plafonne chaque réparation, sans matériau négatif ni cadeau au centre', () => {
  const { game, Unit } = fresh(), wall = building(game, 'concreteWall', 71, 64), engineer = specialist(game, Unit, 'engineer', wall.left - 20, wall.y);
  wall.health -= 100; const health = wall.health; game.resources.scrap = 10; game.resources.stone = 16 / wall.maxHealth * .5;
  game.updateUnits(1); closeTo(wall.health, health + .5); closeTo(game.resources.stone, 0); closeTo(game.resources.scrap, 10 - .5 / 45);
  game.updateUnits(1); closeTo(wall.health, health + .5); assert.equal(engineer.supportActive, false);
  const core = game.core(); core.health -= 100; engineer.x = core.right + 16; engineer.y = core.y; game.resources.scrap = 0;
  assert.equal(game.repairWithEngineer(engineer, core, 1), 0); assert.equal(core.health, core.maxHealth - 100);
  game.resources.scrap = 1; assert.ok(game.repairWithEngineer(engineer, core, 1) > 0); assert.ok(game.resources.scrap < 1);
});

test('ingénieur : distance et mur intermédiaire bloquent la réparation jusqu’à un trajet praticable', () => {
  const { game, Unit } = fresh(), gate = ring(game), target = building(game, 'woodWall', 73, 63);
  const engineer = specialist(game, Unit, 'engineer', C.world(69), C.world(63)); target.health -= 100;
  game.player.x = game.core().x; game.player.y = game.core().y; game.setGateMode('closed', gate); const health = target.health, scrap = game.resources.scrap;
  tick(game, 2); assert.equal(target.health, health); assert.equal(game.resources.scrap, scrap); assert.equal(engineer.supportActive, false);
  game.setGateMode('auto', gate); tick(game, 5); assert.ok(target.health > health); assert.ok(engineer.x > gate.left);
});

test('ingénieur : priorités respectées, aucun soin de chantier ou résurrection de structure détruite', () => {
  const { game, Unit } = fresh(), engineer = specialist(game, Unit, 'engineer');
  const low = building(game, 'woodWall', 70, 64), high = building(game, 'woodWall', 72, 66), site = building(game, 'house', 74, 68, .5);
  low.health -= 100; high.health -= 10; low.priority = 1; high.priority = 3; game.updateUnits(.1); assert.equal(engineer.targetBuilding, high.id);
  assert.equal(game.repairWithEngineer(engineer, site, 1), 0); high.dead = true; game.world.remove(high); engineer.think = 0;
  assert.doesNotThrow(() => game.updateUnits(.1)); assert.equal(engineer.targetBuilding, low.id);
  const before = { ...game.resources }; assert.equal(game.repairWithEngineer(engineer, high, 1), 0); assert.deepEqual(game.resources, before);
});

test('spécialistes : repli, fuite et absence de cible ne déclenchent ni tirs ni dépenses de soutien', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'), engineer = specialist(game, Unit, 'engineer', medic.x, medic.y + 20);
  const wall = building(game, 'woodWall', 71, 64); wall.health -= 100; game.player.x = medic.x; game.player.y = medic.y; game.player.health = 50;
  game.setWorkerOrder('retreat'); const before = { ...game.resources }, health = wall.health; tick(game, 1);
  assert.deepEqual(game.resources, before); assert.equal(wall.health, health); assert.equal(game.player.health, 50); assert.equal(medic.state, 'flee'); assert.equal(engineer.state, 'flee');
  game.setWorkerOrder('auto'); const nearest = game.nearestZombie; game.nearestZombie = () => ({ x: medic.x + 20, y: medic.y }); game.updateUnits(.1);
  assert.deepEqual(game.resources, before); assert.equal(game.projectiles.length, 0); assert.equal(medic.supportActive, false); assert.equal(engineer.supportActive, false);
  game.nearestZombie = nearest; game.player.health = 100; wall.health = wall.maxHealth; medic.think = 0; engineer.think = 0;
  game.rally = { x: game.core().x + 300, y: game.core().y + 100 }; const distance = C.dist(medic, game.rally); tick(game, 1);
  assert.equal(medic.state, 'idle'); assert.ok(C.dist(medic, game.rally) < distance);
});

test('spécialistes : décès unique, logements/rations libérés et rôle correctement annoncé', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'), engineer = specialist(game, Unit, 'engineer'); game.refreshMetrics(true);
  assert.equal(game.population, 3); game.damageUnit(medic, 1000); game.damageUnit(medic, 1000); game.damageUnit(engineer, 1000); game.updateUnits(.1); game.refreshMetrics(true);
  assert.equal(game.stats.unitsLost, 2); assert.equal(game.population, 1); assert.equal(game.units.length, 0);
  assert.ok(game.notifications.some(item => item.text.includes('secouriste'))); assert.ok(game.notifications.some(item => item.text.includes('ingénieur')));
  const food = game.resources.food; game.economyTick(1); closeTo(food - game.resources.food, .0065);
});

test('spécialistes : les recherches sans cible respectent leur cadence plutôt que chaque frame', () => {
  const { game, Unit } = fresh(); specialist(game, Unit, 'medic'); specialist(game, Unit, 'engineer');
  const medicSearch = game.findMedicTarget, engineerSearch = game.findEngineerTarget; let medicines = 0, repairs = 0;
  game.findMedicTarget = function(unit) { medicines++; return medicSearch.call(this, unit); };
  game.findEngineerTarget = function(unit) { repairs++; return engineerSearch.call(this, unit); };
  tick(game, 2);
  assert.ok(medicines >= 3 && medicines <= 4, `recherche médicale bornée : ${medicines}`);
  assert.ok(repairs >= 3 && repairs <= 4, `recherche de réparation bornée : ${repairs}`);
});

test('spécialistes : les groupes bloqués partagent le budget A* sans priver les derniers de trajet', () => {
  const { game, Unit } = fresh(), gate = ring(game), wall = building(game, 'woodWall', 73, 63);
  wall.health -= 100; game.player.x = C.world(72); game.player.y = C.world(63); game.player.health = 10;
  for (let i = 0; i < 20; i++) specialist(game, Unit, i % 2 ? 'engineer' : 'medic', C.world(68), C.world(63));
  game.setGateMode('closed', gate); const health = wall.health, medicine = game.resources.medicine, scrap = game.resources.scrap;
  for (let step = 0; step < Math.ceil(game.units.length / C.STRATEGY_RULES.pathQueriesPerUpdate); step++) {
    game.elapsed += .05; game.updateUnits(.05); assert.ok(game.navigationBudget >= 0);
  }
  assert.ok(game.units.every(unit => unit.blockedJobs?.size > 0), 'chaque spécialiste accède au budget de recherche');
  assert.equal(game.player.health, 10); assert.equal(wall.health, health); assert.equal(game.resources.medicine, medicine); assert.equal(game.resources.scrap, scrap);
});

test('spécialistes : rôles, santé et cibles survivent au chargement sans soins gratuits', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'), engineer = specialist(game, Unit, 'engineer');
  const patient = specialist(game, Unit, 'worker', medic.x + 10, medic.y), wall = building(game, 'woodWall', 71, 64);
  patient.health = 20; medic.health = 87; engineer.health = 101; wall.health -= 100;
  medic.state = 'repair'; medic.targetUnit = patient.id; engineer.state = 'repair'; engineer.targetBuilding = wall.id;
  const medicine = game.resources.medicine, pressure = wall.health;
  assert.equal(game.save(false), true); assert.equal(game.load(), true);
  const restoredMedic = game.units.find(unit => unit.id === medic.id), restoredEngineer = game.units.find(unit => unit.id === engineer.id);
  assert.equal(restoredMedic.kind, 'medic'); assert.equal(restoredMedic.health, 87); assert.equal(restoredMedic.targetUnit, patient.id);
  assert.equal(restoredEngineer.maxHealth, 105); assert.equal(restoredEngineer.health, 101); assert.equal(restoredEngineer.targetBuilding, wall.id);
  assert.equal(game.resources.medicine, medicine); assert.equal(game.world.buildings.get(wall.id).health, pressure);
  restoredMedic.targetUnit = 0; game.player.health = 50; game.save(false); game.load(); assert.equal(game.units.find(unit => unit.id === medic.id).targetUnit, 0);
});

test('spécialistes : validation conserve les anciennes sauvegardes et refuse santé ou cibles hors bornes', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'), engineer = specialist(game, Unit, 'engineer');
  const data = game.serialize(), raw = data.units[0];
  const legacy = { ...raw }; delete legacy.targetUnit; delete legacy.health;
  assert.equal(Save.validate({ ...data, units: [legacy] }).units[0].targetUnit, -1);
  assert.equal(Save.validate({ ...data, units: [legacy] }).units[0].health, C.SURVIVORS.medic.health);
  for (const invalid of [-2, .5, NaN, Infinity, 0x7fffffff, '0']) assert.throws(() => Save.validate({ ...data, units: [{ ...raw, targetUnit: invalid }] }), /cible soins/);
  for (const invalid of [0, -1, 90.1, NaN, Infinity]) assert.throws(() => Save.validate({ ...data, units: [{ ...raw, health: invalid }] }), /santé survivant/);
  for (const kind of ['__proto__', 'constructor', 'toString']) assert.throws(() => Save.validate({ ...data, units: [{ ...raw, kind }] }), /type de survivant/);
  assert.throws(() => Save.validate({ ...data, units: [{ ...data.units[1], health: 105.1 }] }), /santé survivant/);
  medic.targetUnit = 123456; medic.state = 'repair'; engineer.targetBuilding = 123457; engineer.state = 'repair';
  assert.equal(game.save(false), true); assert.equal(game.load(), true); assert.doesNotThrow(() => game.updateUnits(.1));
  assert.equal(game.units.find(unit => unit.kind === 'medic').targetUnit, -1); assert.equal(game.units.find(unit => unit.kind === 'engineer').targetBuilding, -1);
});

test('spécialistes : le contour et les étincelles représentent un soutien payé, sans animation en mouvement réduit', () => {
  const { game, Unit } = fresh(), medic = specialist(game, Unit, 'medic'), engineer = specialist(game, Unit, 'engineer');
  const ctx = game.canvas.getContext('2d'), originalArc = ctx.arc; let circles = 0, sparks = 0;
  ctx.arc = (...args) => { if (args[2] === 21) circles++; originalArc(...args); };
  game.art = { drawActor: () => true, drawEffect: (_ctx, effect) => { if (effect === 'spark') sparks++; return true; } };
  medic.state = engineer.state = 'repair'; game.drawUnit(ctx, medic); game.drawUnit(ctx, engineer);
  assert.equal(circles, 0); assert.equal(sparks, 0, 'un trajet ne produit pas de soutien visuel');
  medic.supportActive = engineer.supportActive = true; game.settings.reducedMotion = false;
  game.drawUnit(ctx, medic); game.drawUnit(ctx, engineer); assert.equal(circles, 2); assert.equal(sparks, 1);
  game.settings.reducedMotion = true; game.drawUnit(ctx, engineer); assert.equal(circles, 3); assert.equal(sparks, 1);
  game.setWorkerOrder('retreat'); game.drawUnit(ctx, medic); game.drawUnit(ctx, engineer); assert.equal(circles, 3);
});
