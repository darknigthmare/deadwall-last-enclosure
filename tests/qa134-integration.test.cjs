'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

function scenario(name) {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/qa-startup134.cjs'), name], {
    encoding: 'utf8', timeout: 90000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout.trim());
  assert.equal(report.scenario, name);
  assert.equal(report.browser, false);
  return report;
}

test('QA 134 intégration : chargement HTML complet, première sauvegarde, modales, mort et relève', () => {
  const report = scenario('campaign');
  assert.equal(report.status, 'passed');
});

test('QA 134 intégration : boutons de réparation, temps actif, consommables et reprise interrompue', () => {
  assert.equal(scenario('interventions').status, 'passed');
});

test('QA 134 intégration : barricade et poste payés, vrai rendu local/projeté et reprise', () => {
  assert.equal(scenario('render').status, 'passed');
});

test('QA 134 intégration : assemblage par UI, vrais chargeurs, décès, relève et récupération', () => {
  assert.equal(scenario('arsenal').status, 'passed');
});

test('QA 134 intégration : barricade et crochetage en région lointaine, étage et streaming conservés', () => {
  assert.equal(scenario('region').status, 'passed');
});
