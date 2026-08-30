'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');

test('économie: achat atomique et plafond de stockage', () => {
  const stock = C.makeBag({ wood: 100, scrap: 50, food: 10 });
  assert.equal(C.canAfford(stock, { wood: 80, scrap: 20 }), true);
  assert.equal(C.spend(stock, { wood: 80, scrap: 20 }), true);
  assert.equal(stock.wood, 20);
  assert.equal(stock.scrap, 30);
  assert.equal(C.spend(stock, { wood: 21 }), false);
  assert.equal(stock.wood, 20, 'un achat impossible ne doit rien retirer');
  C.add(stock, { wood: 100, food: 10 }, 75);
  assert.equal(stock.wood, 75);
  assert.equal(stock.food, 20);
});

test('directeur de horde: composition cohérente et croissance infinie', () => {
  const early = C.wavePlan(1, C.DIFFICULTIES.standard, 0);
  const late = C.wavePlan(20, C.DIFFICULTIES.standard, 0);
  const loudCity = C.wavePlan(20, C.DIFFICULTIES.standard, 300);
  const extreme = C.wavePlan(500, C.DIFFICULTIES.standard, 1000);
  const sum = plan => Object.values(plan.composition).reduce((a, b) => a + b, 0);
  assert.equal(sum(early), early.total);
  assert.equal(sum(late), late.total);
  assert.equal(sum(extreme), extreme.total, 'la composition doit rester exacte même aux vagues extrêmes');
  assert.ok(extreme.composition.walker > 0, 'les errants doivent rester la masse principale');
  assert.ok(late.total > early.total);
  assert.ok(loudCity.total > late.total, 'la signature de la cité doit attirer davantage de contacts');
  assert.equal(early.composition.armored, 0);
  assert.ok(late.composition.armored > 0);
  assert.ok(late.fronts >= 4);
});

test('paliers et catalogue de construction', () => {
  assert.equal(C.cityTier(0).name, 'REFUGE');
  assert.equal(C.cityTier(48).name, 'FORTERESSE');
  assert.equal(C.cityTier(500).name, 'MÉGACITÉ');
  assert.ok(Object.keys(C.BUILDINGS).length >= 20);
  assert.equal(C.BUILDINGS.woodWall.upgradeTo, 'steelWall');
  assert.equal(C.BUILDINGS.steelWall.upgradeTo, 'concreteWall');
  assert.equal(C.BUILDINGS.turret.requires, 'workshop');
  assert.ok(C.BUILDINGS.concreteWall.health > C.BUILDINGS.woodWall.health);
});

test('génération déterministe et file de priorité', () => {
  assert.equal(C.seededHash(12, 18, 42), C.seededHash(12, 18, 42));
  const heap = new C.MinHeap();
  heap.push(1, 30); heap.push(2, 10); heap.push(3, 20);
  assert.equal(heap.pop().index, 2);
  assert.equal(heap.pop().index, 3);
  assert.equal(heap.pop().index, 1);
});


test('sauvegardes v2: migration non destructive et état stratégique', () => {
  assert.equal(C.SAVE_VERSION, 2);
  const migrated = C.migrateSaveData({ version: 1, stats: { gathered: 44 }, wave: 3 });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.migratedFrom, 1);
  assert.equal(migrated.depositedResources, 44);
  assert.deepEqual(migrated.research.completed, []);
});

test('enceintes: ligne supercover sans diagonale poreuse', () => {
  const cells = C.wallLine({ x: 10, y: 10 }, { x: 13, y: 13 });
  for (let i = 1; i < cells.length; i += 1) {
    const dx = Math.abs(cells[i].x - cells[i - 1].x);
    const dy = Math.abs(cells[i].y - cells[i - 1].y);
    assert.ok(dx + dy === 1 || (dx === 0 && dy === 0), 'la ligne ne doit pas créer de contact diagonal seul');
  }
  assert.ok(cells.length > 4);
});

test('équilibrage: la santé zombie est plafonnée et les priorités énergie sont stables', () => {
  assert.ok(C.enemyHealthScale(500) < 1.35);
  assert.ok(C.wavePlan(100, C.DIFFICULTIES.standard, 0).total > C.wavePlan(20, C.DIFFICULTIES.standard, 0).total);
  assert.ok(C.powerPriority(C.BUILDINGS.turret) < C.powerPriority(C.BUILDINGS.workshop));
  assert.ok(C.researchById('logistics'));
  assert.ok(C.crisisForWave(5, 17117));
});
