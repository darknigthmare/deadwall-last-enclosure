'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Publication = require('../scripts/codex-workbook-metadata2026.cjs');

test('An export without release metadata retains the historical PR16 context', () => {
  const actual = Publication.resolve();
  assert.equal(actual.number, 16);
  assert.equal(actual.url, Publication.GITHUB + '/pull/16');
  assert.equal(actual.label, 'PR #16');
  assert.equal(actual.subtitle, 'Base 1.68 · PR #16 · Suivi actualisé depuis les sources du dépôt');
  assert.equal(actual.integrationChange, 'Inchangée');
  assert.equal(actual.integrationState, 'PR en cours');
});

test('A new release consistently names its own PR instead of the historical PR', () => {
  const actual = Publication.resolve({pullRequest: 18});
  assert.equal(actual.url, Publication.GITHUB + '/pull/18');
  assert.equal(actual.label, 'PR #18');
  for (const key of ['subtitle', 'tracking', 'publication', 'integrationDetail']) {
    assert.ok(actual[key].includes('PR #18'), key);
    assert.ok(!actual[key].includes('PR #16'), key);
  }
});

test('An explicit matching PR URL and supplied integration state are retained', () => {
  const meta = {
    pullRequest: 18,
    pullRequestURL: Publication.GITHUB + '/pull/18',
    integrationChange: 'Nouvelle livraison',
    integrationDetail: 'Fusion et production à vérifier sur le commit final.',
    integrationState: 'Qualification en cours',
  };
  const before = JSON.stringify(meta);
  const actual = Publication.resolve(meta);
  for (const key of ['integrationChange', 'integrationDetail', 'integrationState']) {
    assert.equal(actual[key], meta[key]);
  }
  assert.equal(JSON.stringify(meta), before);
});

test('Publication refuses an invalid or imprecise PR identity', () => {
  for (const pullRequest of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, '18', null, true]) {
    assert.throws(() => Publication.resolve({pullRequest}), /Numéro de PR invalide/);
  }
  for (const pullRequestURL of [
    Publication.GITHUB + '/pull/17',
    'https://github.com/another/repository/pull/18',
    'https://github.com.example.org/darknigthmare/deadwall-last-enclosure/pull/18',
    Publication.GITHUB + '/pull/18?redirect=another',
    Publication.GITHUB + '/pull/18#review',
    18,
  ]) {
    assert.throws(() => Publication.resolve({pullRequest: 18, pullRequestURL}), /URL de PR différente/);
  }
});

test('Publication refuses an empty or non-text integration description', () => {
  for (const key of ['integrationChange', 'integrationDetail', 'integrationState']) {
    for (const value of ['', '   ', 1, null, {}, []]) {
      assert.throws(() => Publication.resolve({[key]: value}), /Métadonnée de publication invalide/);
    }
  }
  for (const value of [null, [], 'PR18']) {
    assert.throws(() => Publication.resolve(value), /Métadonnées de publication invalides/);
  }
});
