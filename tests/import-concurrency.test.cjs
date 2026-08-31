'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const C = require('../src/core.js');

function bootImports() {
  const env = bootGame();
  delete require.cache[require.resolve('../src/ui.js')];
  require('../src/ui.js');
  env.game.startNew('standard', '17117');
  env.game.showSettings(true);
  const input = env.elements.get('settingsImportFile');
  const change = input._listeners.get('change')[0];
  const snapshot = JSON.parse(JSON.stringify(env.game.serialize()));
  return {
    ...env, input,
    read: file => { input.files = file ? [file] : []; input.value = file?.name || ''; return change({ target: input }); },
    payload: wave => JSON.stringify({ ...snapshot, wave }),
    get: id => env.elements.get(id)
  };
}

function deferredFile(name = 'delayed.json') {
  let resolve, reject;
  const promise = new Promise((accept, refuse) => { resolve = accept; reject = refuse; });
  return { file: { name, size: 100, text: () => promise }, resolve, reject };
}

test('import concurrent : le dernier fichier choisi gagne même si le premier termine après', async () => {
  const env = bootImports(), old = deferredFile(), latest = deferredFile('latest.json');
  const world = env.game.world, primary = env.storage.get(C.SAVE_KEY);
  const firstRead = env.read(old.file), latestRead = env.read(latest.file);
  assert.equal(env.input.value, '', 'le sélecteur est vidé dès capture du File, avant toute lecture');
  latest.resolve(env.payload(9)); await latestRead;
  assert.match(env.get('settingsImportSummary').textContent, /^Vague 9 /);
  assert.equal(document.activeElement, env.get('settingsImportConfirm'));
  old.resolve(env.payload(3)); await firstRead;
  assert.match(env.get('settingsImportSummary').textContent, /^Vague 9 /);
  assert.equal(document.activeElement, env.get('settingsImportConfirm'));
  assert.equal(env.game.world, world);
  assert.equal(env.storage.get(C.SAVE_KEY), primary, 'aucune écriture avant confirmation');
  env.get('settingsImportConfirm').click();
  assert.equal(env.game.wave, 9);
  assert.equal(JSON.parse(env.storage.get(C.SAVE_KEY)).wave, 9);
  assert.equal(env.game.paused, false);
});

test('import concurrent : une erreur ancienne ne remplace pas la confirmation du dernier fichier', async () => {
  const env = bootImports(), old = deferredFile();
  const oldRead = env.read(old.file);
  await env.read({ size: 100, text: async () => env.payload(9) });
  const message = env.get('settingsStatus').textContent;
  old.reject(new Error('lecture ancienne échouée')); await oldRead;
  assert.equal(env.get('settingsStatus').textContent, message);
  assert.match(env.get('settingsImportSummary').textContent, /^Vague 9 /);
  assert.equal(document.activeElement, env.get('settingsImportConfirm'));
  env.get('settingsImportConfirm').click();
  assert.equal(env.game.wave, 9);
});

test('import concurrent : fermer puis rouvrir invalide lectures réussies et erreurs tardives', async () => {
  for (const failure of [false, true]) {
    const env = bootImports(), pending = deferredFile(), read = env.read(pending.file);
    const world = env.game.world;
    env.get('settingsClose').click();
    assert.equal(env.input.value, '', 'fermer ne laisse aucun fichier sélectionné');
    assert.equal(env.game.paused, false);
    env.game.showSettings(true);
    const message = env.get('settingsStatus').textContent, focus = document.activeElement;
    if (failure) pending.reject(new Error('fichier fermé')); else pending.resolve(env.payload(8));
    await read;
    assert.equal(env.input.value, '', 'une fin tardive ne rétablit pas la sélection');
    assert.equal(env.get('settingsImportReview').classList.contains('hidden'), true);
    assert.equal(env.get('settingsStatus').textContent, message);
    assert.equal(document.activeElement, focus, 'aucun vol de focus après réouverture');
    env.get('settingsImportConfirm').dispatch('click');
    assert.equal(env.game.world, world);
    assert.equal(env.game.wave, 1);
  }
});

test('import concurrent : annuler le dernier aperçu invalide aussi une lecture ancienne en attente', async () => {
  const env = bootImports(), old = deferredFile(), oldRead = env.read(old.file);
  const world = env.game.world, primary = env.storage.get(C.SAVE_KEY);
  await env.read({ size: 100, text: async () => env.payload(9) });
  env.get('settingsImportCancel').click();
  assert.equal(env.input.value, '', 'annuler permet de resélectionner le même fichier');
  assert.equal(document.activeElement, env.get('settingsImport'));
  old.resolve(env.payload(3)); await oldRead;
  assert.equal(env.input.value, '');
  assert.equal(env.get('settingsImportReview').classList.contains('hidden'), true);
  assert.equal(env.get('settingsStatus').textContent, 'Import annulé.');
  assert.equal(document.activeElement, env.get('settingsImport'));
  env.get('settingsImportConfirm').dispatch('click');
  assert.equal(env.game.world, world);
  assert.equal(env.storage.get(C.SAVE_KEY), primary);
});

test('import concurrent : nouvelle sélection vide ou invalide interdit le retour du fichier précédent', async () => {
  for (const invalid of [null, { size: 100, text: async () => '{cassé' }]) {
    const env = bootImports(), old = deferredFile(), oldRead = env.read(old.file);
    await env.read(invalid);
    const message = env.get('settingsStatus').textContent;
    old.resolve(env.payload(3)); await oldRead;
    assert.equal(env.get('settingsImportReview').classList.contains('hidden'), true);
    assert.equal(env.get('settingsStatus').textContent, message);
    env.get('settingsImportConfirm').dispatch('click');
    assert.equal(env.game.wave, 1);
  }
});

test('import concurrent : fin ancienne après confirmation ne rouvre ni aperçu ni interface', async () => {
  const env = bootImports(), old = deferredFile(), oldRead = env.read(old.file);
  await env.read({ size: 100, text: async () => env.payload(9) });
  env.get('settingsImportConfirm').click();
  const world = env.game.world, primary = env.storage.get(C.SAVE_KEY), focus = document.activeElement;
  old.resolve(env.payload(3)); await oldRead;
  assert.equal(env.game.wave, 9);
  assert.equal(env.game.world, world);
  assert.equal(env.storage.get(C.SAVE_KEY), primary);
  assert.equal(env.get('settingsImportReview').classList.contains('hidden'), true);
  assert.equal(env.game.ui.settingsModal.classList.contains('hidden'), true);
  assert.equal(document.activeElement, focus);
});

test('import concurrent : fermer une lecture permet de resélectionner immédiatement le même nom', async () => {
  const env = bootImports(), first = deferredFile('same.json'), firstRead = env.read(first.file);
  assert.equal(env.input.value, '');
  env.get('settingsClose').click();
  assert.equal(env.input.value, '');
  env.game.showSettings(true);
  const second = deferredFile('same.json'), secondRead = env.read(second.file);
  assert.equal(env.input.value, '');
  second.resolve(env.payload(9)); await secondRead;
  first.resolve(env.payload(3)); await firstRead;
  assert.equal(env.input.value, '');
  assert.match(env.get('settingsImportSummary').textContent, /^Vague 9 /);
  env.get('settingsImportConfirm').click();
  assert.equal(env.game.wave, 9);
});
