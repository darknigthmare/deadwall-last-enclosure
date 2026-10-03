'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGame } = require('./helpers/browser.cjs');
const C = require('../src/core.js');
const Save = require('../src/save.js');

function optionsGame() {
  const env = bootGame();
  delete require.cache[require.resolve('../src/ui.js')];
  require('../src/ui.js');
  env.game.startNew('standard', '17117');
  env.game.showSettings(true);
  const input = env.elements.get('settingsImportFile');
  return {
    ...env,
    read: data => input._listeners.get('change')[0]({ target: { files: [{ size: 100, text: async () => JSON.stringify(data) }] } }),
    confirm: () => env.elements.get('settingsImportConfirm').click(),
    status: () => env.elements.get('settingsStatus').textContent
  };
}

function disableStorage() {
  const original = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  return () => { localStorage.setItem = original; };
}

function withoutConsoleErrors(run) {
  const error = console.error;
  console.error = () => {};
  try { return run(); } finally { console.error = error; }
}

async function exportCopy(env) {
  let downloaded;
  const original = URL.createObjectURL;
  URL.createObjectURL = blob => { downloaded = blob; return original(blob); };
  try { env.elements.get('settingsExport').click(); } finally { URL.createObjectURL = original; }
  assert.ok(downloaded, 'un téléchargement réel est préparé');
  return { blob: downloaded, data: Save.parse(await downloaded.text()) };
}

function largeCampaign(game) {
  const data = structuredClone(game.serialize());
  data.version = 1;
  data.units = Array.from({ length: 10000 }, (_, index) => ({
    id: 100 + index, kind: 'engineer', x: 1234.1234567891234, y: 2234.1234567891234,
    health: 89.1234567891234, carry: 999.1234567891234, carryType: 'medicine', state: 'repair',
    targetNode: 1000000000, targetBuilding: Number.MAX_SAFE_INTEGER, targetUnit: 2147483646,
    fireCooldown: 119.123456789
  }));
  data.nextId = 50000;
  data.nodes = Array.from({ length: 50000 }, (_, index) => [999950000 + index, 1000000000000]);
  let count = 0;
  for (let gy = 0; gy < C.WORLD_TILES && count < 10000; gy++) {
    for (let gx = 0; gx < C.WORLD_TILES && count < 10000; gx++) {
      if (gx >= 62 && gx < 66 && gy >= 62 && gy < 66) continue;
      data.buildings.push({ id: 20000 + count++, type: 'woodWall', gx, gy });
    }
  }
  return Save.validate(data);
}

test('copie portable : une grande cité valide reste importable malgré une présentation JSON de plus de 8 Mio', async () => {
  const env = optionsGame(), data = largeCampaign(env.game);
  assert.equal(data.version, C.SAVE_VERSION);
  assert.ok(Buffer.byteLength(JSON.stringify(data, null, 2)) > Save.MAX_FILE_BYTES, 'reproduit l’export illisible précédent');
  env.game.serialize = () => structuredClone(data);
  const { blob, data: parsed } = await exportCopy(env);
  assert.ok(blob.size <= Save.MAX_FILE_BYTES);
  assert.deepEqual(parsed, Save.validate(data), 'stocks, habitants, structures et registres normalisés sont conservés');
  assert.match(env.status(), /Téléchargement.*Vérifiez/);
});

test('copie portable : les validateurs installés après save.js restent autoritaires pour l’export', () => {
  const env = optionsGame(), original = Save.validate;
  Save.validate = data => { const normalized = original(data); if (data.exportCorrupt) throw new Error('Registre installé invalide'); return normalized; };
  try {
    assert.throws(() => Save.stringify({ ...env.game.serialize(), exportCorrupt: true }), /Registre installé invalide/);
    assert.equal(Save.parse(Save.stringify(env.game.serialize())).version, C.SAVE_VERSION);
  } finally { Save.validate = original; }
});

test('import sans stockage : export de la campagne exacte et nouvelle confirmation nécessaires avant remplacement', async () => {
  const env = optionsGame(), imported = structuredClone(env.game.serialize()), world = env.game.world;
  imported.worldSeed = 42;
  imported.resources.wood = 23;
  env.game.resources.wood = 17;
  const primary = env.storage.get(C.SAVE_KEY), backup = env.storage.get(C.SAVE_BACKUP_KEY);
  const restoreStorage = disableStorage();
  try {
    await env.read(imported);
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world, world);
    assert.match(env.status(), /Exportez la partie actuelle/);
    const exported = await exportCopy(env);
    assert.equal(exported.data.resources.wood, 17, 'copie des dernières actions en mémoire');
    const originalNow = Date.now;
    Date.now = () => originalNow() + 60000;
    try { withoutConsoleErrors(env.confirm); } finally { Date.now = originalNow; }
    assert.equal(env.game.world, world, 'première confirmation ne remplace rien après le refus du stockage');
    assert.equal(env.elements.get('settingsImportConfirm').textContent, 'REMPLACER SANS COPIE LOCALE DE SECOURS');
    assert.match(env.elements.get('settingsImportSummary').textContent, /Copie locale de secours indisponible.*fichier exporté.*avant le remplacement/);
    assert.match(env.status(), /Vérifiez votre copie exportée.*confirmez de nouveau/);
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world.seed, 42);
    assert.equal(env.game.resources.wood, 23);
    assert.equal(env.storage.get(C.SAVE_KEY), primary, 'le disque reste inchangé si le quota persiste');
    assert.equal(env.storage.get(C.SAVE_BACKUP_KEY), backup);
    assert.equal(env.game.lastSaveStatus.ok, false);
    assert.equal(env.game.ui.settingsModal.classList.contains('hidden'), true);
    assert.equal(env.game.paused, false);
  } finally { restoreStorage(); }
});

test('import sans stockage : une modification après export interdit d’utiliser une copie obsolète', async () => {
  const env = optionsGame(), world = env.game.world, imported = structuredClone(env.game.serialize());
  imported.worldSeed = 42;
  const restoreStorage = disableStorage();
  try {
    await env.read(imported);
    await exportCopy(env);
    withoutConsoleErrors(env.confirm);
    env.game.player.carry.wood = 1;
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world, world);
    assert.equal(env.game.player.carry.wood, 1);
    assert.match(env.status(), /Exportez la partie actuelle/);
    assert.notEqual(env.elements.get('settingsImportConfirm').textContent, 'REMPLACER SANS COPIE LOCALE DE SECOURS');
    assert.doesNotMatch(env.elements.get('settingsImportSummary').textContent, /Copie locale de secours indisponible/);
    await exportCopy(env);
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world, world, 'la nouvelle copie exige à nouveau la confirmation supplémentaire');
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world.seed, 42);
  } finally { restoreStorage(); }
});

for (const cancel of ['close', 'cancel']) {
  test('import sans stockage : ' + cancel + ' invalide la copie et la confirmation préparées', async () => {
    const env = optionsGame(), world = env.game.world, imported = structuredClone(env.game.serialize());
    imported.worldSeed = 42;
    const restoreStorage = disableStorage();
    try {
      await env.read(imported);
      await exportCopy(env);
      withoutConsoleErrors(env.confirm);
      if (cancel === 'close') {
        env.game.showSettings(false);
        withoutConsoleErrors(() => env.game.showSettings(true));
      } else env.elements.get('settingsImportCancel').click();
      await env.read(imported);
      withoutConsoleErrors(env.confirm);
      assert.equal(env.game.world, world);
      assert.match(env.status(), /Exportez la partie actuelle/);
    } finally { restoreStorage(); }
  });
}

test('import sans stockage : téléchargement refusé ne permet pas de remplacer la cité en mémoire', async () => {
  const env = optionsGame(), world = env.game.world, imported = structuredClone(env.game.serialize());
  imported.worldSeed = 42;
  const restoreStorage = disableStorage(), create = URL.createObjectURL;
  URL.createObjectURL = () => { throw new Error('Téléchargement indisponible'); };
  try {
    await env.read(imported);
    env.elements.get('settingsExport').click();
    assert.match(env.status(), /Téléchargement indisponible/);
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world, world);
    assert.match(env.status(), /Exportez la partie actuelle/);
  } finally { URL.createObjectURL = create; restoreStorage(); }
});

test('import : un quota qui se libère après l’avertissement utilise la sauvegarde normale', async () => {
  const env = optionsGame(), world = env.game.world, imported = structuredClone(env.game.serialize());
  imported.worldSeed = 42;
  const restoreStorage = disableStorage();
  try {
    await env.read(imported);
    const exported = await exportCopy(env);
    withoutConsoleErrors(env.confirm);
    assert.equal(env.game.world, world);
    restoreStorage();
    env.confirm();
    assert.equal(env.game.world.seed, 42);
    assert.equal(env.game.lastSaveStatus.ok, true);
    assert.equal(Save.parse(env.storage.get(C.SAVE_BACKUP_KEY)).runId, exported.data.runId);
    assert.equal(Save.parse(env.storage.get(C.SAVE_BACKUP_KEY)).worldSeed, 17117);
    assert.equal(Save.parse(env.storage.get(C.SAVE_KEY)).worldSeed, 42);
  } finally { restoreStorage(); }
});

test('sauvegarde : quota de la copie de secours signale le risque tout en conservant la nouvelle partie valide', () => {
  const env = optionsGame(), previous = env.storage.get(C.SAVE_KEY), backup = env.storage.get(C.SAVE_BACKUP_KEY);
  const write = localStorage.setItem;
  localStorage.setItem = (key, value) => { if (key === C.SAVE_BACKUP_KEY) throw new Error('QuotaExceededError'); return write(key, value); };
  let alerts = 0;
  const notify = env.game.notify;
  env.game.notify = (message, ...args) => { if (message.includes('Copie de secours indisponible')) alerts++; return notify.call(env.game, message, ...args); };
  try {
    env.game.resources.wood = 17;
    assert.equal(env.game.save(false), true, 'la primaire confirmée reste une sauvegarde réussie');
    assert.equal(Save.parse(env.storage.get(C.SAVE_KEY)).resources.wood, 17);
    assert.equal(env.storage.get(C.SAVE_BACKUP_KEY), backup);
    assert.equal(env.game.lastSaveStatus.ok, true);
    assert.equal(env.game.lastSaveStatus.backupOk, false);
    assert.equal(env.game.lastSaveStatus.code, 'backup-unavailable');
    assert.match(env.game.lastSaveStatus.message, /exportez une copie/);
    assert.equal(env.game.save(false), true);
    assert.equal(alerts, 1, 'une seule alerte pendant une panne répétée du secours');
    localStorage.setItem = write;
    env.game.resources.wood = 18;
    assert.equal(env.game.save(false), true);
    assert.equal(env.game.lastSaveStatus.backupOk, true);
    assert.equal(Save.parse(env.storage.get(C.SAVE_BACKUP_KEY)).resources.wood, 17);
    assert.notEqual(env.storage.get(C.SAVE_KEY), previous);
  } finally { localStorage.setItem = write; }
});

test('sauvegarde : une écriture primaire non confirmée ne remplace jamais la copie de secours', () => {
  const env = optionsGame(), world = env.game.world;
  const primary = env.storage.get(C.SAVE_KEY), backup = env.storage.get(C.SAVE_BACKUP_KEY);
  const write = localStorage.setItem;
  for (const fault of ['discard', 'truncate']) {
    localStorage.setItem = (key, value) => {
      if (key !== C.SAVE_KEY) return write(key, value);
      if (fault === 'truncate') return write(key, String(value).slice(0, 20));
    };
    try {
      env.game.resources.wood = 17;
      assert.equal(withoutConsoleErrors(() => env.game.save(false)), false);
      assert.equal(env.game.lastSaveStatus.code, 'write-unconfirmed');
      assert.equal(env.game.world, world);
      assert.equal(env.game.resources.wood, 17);
      assert.equal(env.storage.get(C.SAVE_BACKUP_KEY), backup);
      if (fault === 'discard') assert.equal(env.storage.get(C.SAVE_KEY), primary);
      else assert.throws(() => Save.parse(env.storage.get(C.SAVE_KEY)));
    } finally { localStorage.setItem = write; env.storage.set(C.SAVE_KEY, primary); }
  }
});

test('sauvegarde : une écriture de secours non confirmée garde la primaire à jour et avertit', () => {
  const env = optionsGame(), write = localStorage.setItem;
  localStorage.setItem = (key, value) => key === C.SAVE_BACKUP_KEY ? write(key, '{tronqué') : write(key, value);
  try {
    env.game.resources.wood = 17;
    assert.equal(env.game.save(false), true);
    assert.equal(env.game.lastSaveStatus.backupOk, false);
    assert.equal(Save.parse(env.storage.get(C.SAVE_KEY)).resources.wood, 17);
    assert.throws(() => Save.parse(env.storage.get(C.SAVE_BACKUP_KEY)));
  } finally { localStorage.setItem = write; }
});

test('sauvegarde : une primaire corrompue ne remplace pas le secours à la prochaine sauvegarde saine', () => {
  const env = optionsGame(), backup = env.storage.get(C.SAVE_BACKUP_KEY);
  env.storage.set(C.SAVE_KEY, '{tronqué');
  env.game.resources.wood = 17;
  assert.equal(env.game.save(false), true);
  assert.equal(env.storage.get(C.SAVE_BACKUP_KEY), backup);
  assert.equal(Save.parse(env.storage.get(C.SAVE_KEY)).resources.wood, 17);
});

test('import : la dernière campagne exacte est protégée avant une panne du secours après remplacement', async () => {
  const env = optionsGame(), world = env.game.world, imported = structuredClone(env.game.serialize());
  imported.worldSeed = 42;
  imported.resources.wood = 23;
  env.game.resources.wood = 17;
  const write = localStorage.setItem;
  localStorage.setItem = (key, value) => {
    if (key === C.SAVE_BACKUP_KEY && env.game.world !== world) throw new Error('QuotaExceededError');
    return write(key, value);
  };
  try {
    await env.read(imported);
    env.confirm();
    assert.equal(env.game.world.seed, 42);
    assert.equal(env.game.lastSaveStatus.ok, true);
    assert.equal(env.game.lastSaveStatus.backupOk, false);
    const protectedCampaign = Save.parse(env.storage.get(C.SAVE_BACKUP_KEY));
    assert.equal(protectedCampaign.worldSeed, 17117);
    assert.equal(protectedCampaign.resources.wood, 17, 'les dernières actions sont protégées, pas seulement l’ancienne autosauvegarde');
    assert.equal(Save.parse(env.storage.get(C.SAVE_KEY)).resources.wood, 23);
  } finally { localStorage.setItem = write; }
});

test('import depuis le menu : un secours refusé exige l’export de la sauvegarde présente et une seconde confirmation', async () => {
  const env = optionsGame(), imported = structuredClone(env.game.serialize());
  imported.worldSeed = 42;
  env.game.showSettings(false);
  env.game.resources.wood = 17;
  env.game.returnToMenu();
  env.game.showSettings(true);
  const primary = env.storage.get(C.SAVE_KEY), world = env.game.world, write = localStorage.setItem;
  localStorage.setItem = (key, value) => { if (key === C.SAVE_BACKUP_KEY) throw new Error('QuotaExceededError'); return write(key, value); };
  try {
    await env.read(imported);
    env.confirm();
    assert.equal(env.game.state, 'menu');
    assert.equal(env.game.world, world);
    assert.equal(env.storage.get(C.SAVE_KEY), primary);
    assert.match(env.status(), /Exportez la partie actuelle/);
    const exported = await exportCopy(env);
    assert.equal(exported.data.resources.wood, 17);
    env.confirm();
    assert.equal(env.game.state, 'menu', 'le menu ne saute pas la confirmation du risque');
    env.confirm();
    assert.equal(env.game.state, 'playing');
    assert.equal(env.game.world.seed, 42);
  } finally { localStorage.setItem = write; }
});
