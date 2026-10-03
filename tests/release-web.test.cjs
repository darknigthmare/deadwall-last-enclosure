'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const release = import(pathToFileURL(path.resolve(__dirname, '../scripts/package-web.mjs')).href);

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'deadwall-web-release-'));
  t.after(() => fs.rmSync(directory, { recursive:true, force:true }));
  const staged = path.join(directory, 'staged'); fs.mkdirSync(staged);
  return { directory, staged };
}

test('release web: CRC-32 compatible ZIP et compression déterministe', async t => {
  const { crc32, fileManifest, writeZip, verifyZip } = await release;
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  assert.equal(crc32(Buffer.alloc(0)), 0);
  const { directory, staged } = fixture(t);
  fs.mkdirSync(path.join(staged, 'web'));
  fs.writeFileSync(path.join(staged, 'web', 'index.html'), '<!doctype html><p>DEADWALL</p>');
  fs.writeFileSync(path.join(staged, 'LIRE_MOI.txt'), 'Jeu français : récolte → défense.\n');
  fs.mkdirSync(path.join(staged, 'Forêts et récoltes'));
  fs.writeFileSync(path.join(staged, 'Forêts et récoltes', 'État.md'), 'Codex original conservé.');
  fs.writeFileSync(path.join(staged, 'empty.txt'), '');
  const manifest = fileManifest(staged), epoch = 1790899200;
  const first = path.join(directory, 'first.zip'), second = path.join(directory, 'second.zip');
  writeZip(staged, first, epoch);
  fs.utimesSync(path.join(staged, 'LIRE_MOI.txt'), new Date(0), new Date());
  writeZip(staged, second, epoch);
  assert.deepEqual(fs.readFileSync(first), fs.readFileSync(second), 'les dates des fichiers ne modifient pas le livrable');
  assert.equal(verifyZip(first, manifest).files, 4);
  assert.throws(() => writeZip(staged, first, epoch), /EEXIST/, 'une archive existante est préservée');
  assert.throws(() => writeZip(staged, path.join(directory, 'invalid.zip'), -1), /EPOCH/);
});

test('release source: Git courant filtré sans secrets, builds ni perte de fixture historique', async () => {
  const { includeSourceFile } = await import(pathToFileURL(path.resolve(__dirname, '../scripts/package-source.mjs')).href);
  for (const file of ['AGENTS.md', 'src/game.js', 'package-lock.json', '.github/workflows/check.yml', 'codex-3000/Forêts et récoltes/État.md', 'reports/1.35.0/legacy-g5-start-save.json']) assert.equal(includeSourceFile(file), true, file);
  const sourceRoot = path.resolve(__dirname, '..');
  const commands = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8')).scripts;
  for (const [command, file] of [['test:journey', 'scripts/browser-journey144.mjs'], ['test:assault', 'scripts/browser-assault144.mjs'], ['test:reconstruction', 'scripts/browser-reconstruction144.mjs'], ['test:terrain', 'scripts/browser-terrain145.mjs']]) {
    assert.equal(commands[command], 'node ' + file, 'la commande QA livrée doit pointer vers son script');
    assert.equal(includeSourceFile(file), true, file);
    assert.ok(fs.statSync(path.join(sourceRoot, file)).isFile(), 'le script QA doit exister dans les sources : ' + file);
  }
  for (const file of ['scripts/browser-qa-common142.mjs', 'scripts/browser-qa-common144.mjs']) {
    assert.equal(includeSourceFile(file), true, file);
    assert.ok(fs.statSync(path.join(sourceRoot, file)).isFile(), 'le helper QA doit exister dans les sources : ' + file);
  }
  for (const file of ['node_modules/ws/index.js', 'dist/index.html', 'release/game.zip', '.env', '.env.production', 'config/.env.secret', '.aws/config', '.git/config', '.qa-tools/index.js', 'reports/1.42.0/save.json', 'DEADWALL_Standalone.html', 'MANIFEST_SHA256.json', 'debug.log', '.npmrc', '.netrc', '.ssh/id_rsa', '.gnupg/private-keys-v1.d/key', 'config/credentials.json', 'publisher.pfx', 'private.pem']) assert.equal(includeSourceFile(file), false, file);
  for (const file of ['/absolute', '../escape', 'a/../escape', 'a\\escape', 'C:/file', 'a\0b']) assert.throws(() => includeSourceFile(file), /Chemin source/, file);
});

test('release web: corruption, fichiers supplémentaires et liens sont refusés', async t => {
  const { fileManifest, directoryFiles, writeZip, verifyZip } = await release;
  const { directory, staged } = fixture(t);
  fs.writeFileSync(path.join(staged, 'index.html'), 'DEADWALL'.repeat(100));
  const expected = fileManifest(staged), archive = path.join(directory, 'game.zip');
  writeZip(staged, archive, 1790899200);
  const data = fs.readFileSync(archive);
  fs.writeFileSync(path.join(directory, 'truncated.zip'), data.subarray(0, data.length - 1));
  assert.throws(() => verifyZip(path.join(directory, 'truncated.zip'), expected));
  data[30 + Buffer.byteLength('index.html') + 3] ^= 255;
  fs.writeFileSync(path.join(directory, 'corrupt.zip'), data);
  assert.throws(() => verifyZip(path.join(directory, 'corrupt.zip'), expected));
  fs.writeFileSync(path.join(staged, 'private.txt'), 'un fichier en trop');
  const extra = path.join(directory, 'extra.zip'); writeZip(staged, extra, 1790899200);
  assert.throws(() => verifyZip(extra, expected), /nombre/);
  assert.throws(() => verifyZip(archive, [{ ...expected[0], file:'../index.html' }]), /Chemin/);
  fs.symlinkSync(staged, path.join(directory, 'linked'), 'junction');
  assert.throws(() => directoryFiles(directory), /liens/);
});

test('release web: versions exactes et outils QA présents dans le lockfile', () => {
  const source = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package-lock.json'), 'utf8'));
  assert.equal(lock.version, source.version); assert.equal(lock.packages[''].version, source.version);
  for (const name of ['@napi-rs/canvas', 'playwright']) {
    assert.match(source.devDependencies[name], /^\d+\.\d+\.\d+$/);
    assert.equal(lock.packages['node_modules/' + name].version, source.devDependencies[name]);
    assert.match(lock.packages['node_modules/' + name].integrity, /^sha512-/);
  }
});

test('release web: version publique et guide livré correspondent au package courant', async () => {
  const { deliveryGuide } = await release;
  const sourceRoot = path.resolve(__dirname, '..');
  const source = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'package.json'), 'utf8'));
  const guide = fs.readFileSync(path.join(sourceRoot, deliveryGuide(source.version)), 'utf8');
  assert.ok(guide.startsWith('# DEADWALL ' + source.version.split('.').slice(0, 2).join('.') + ' —'));
  assert.equal(require('../src/coordination.js').VERSION, source.version);
  assert.ok(fs.readFileSync(path.join(sourceRoot, 'index.html'), 'utf8').includes('VERSION ' + source.version));
  const worker = fs.readFileSync(path.join(sourceRoot, 'sw.js'), 'utf8');
  assert.ok(worker.includes("const CACHE = 'deadwall-v" + source.version + '-'));
  for (const invalid of ['../../private', '1.43/secret', '', null]) assert.throws(() => deliveryGuide(invalid), /Version de livraison invalide/);
});

test('release web: le contrôle final relit archives et fichiers livrés', async t => {
  const { fileManifest, writeZip, verifyWebRelease } = await release;
  const { directory } = fixture(t), archives = [];
  const provenance = { sourceRevision:'a'.repeat(40), sourceDirty:true, builtAt:'2026-10-02T00:00:00.000Z' };
  for (const variant of ['web', 'standalone']) {
    const staged = path.join(directory, variant); fs.mkdirSync(staged);
    fs.writeFileSync(path.join(staged, 'index.html'), 'DEADWALL ' + variant);
    const files = fileManifest(staged);
    const manifest = { schema:1, version:'1.42.0', variant, ...provenance, payloadFingerprint:createHash('sha256').update(JSON.stringify(files, null, 2) + '\n').digest('hex'), files };
    fs.writeFileSync(path.join(staged, 'release-manifest.json'), JSON.stringify(manifest));
    archives.push({ variant, ...writeZip(staged, path.join(directory, variant + '.zip'), 1790899200) });
  }
  fs.writeFileSync(path.join(directory, 'release-summary.json'), JSON.stringify({ schema:1, version:'1.42.0', ...provenance, archives }));
  assert.equal(verifyWebRelease(directory).length, 2);
  fs.writeFileSync(path.join(directory, 'release-summary.json'), JSON.stringify({ schema:1, version:'1.42.0', ...provenance, archives:[archives[0], archives[0]] }));
  assert.throws(() => verifyWebRelease(directory), /Résumé de livraison invalide/, 'chaque variante doit être vérifiée exactement une fois');
  fs.writeFileSync(path.join(directory, 'release-summary.json'), JSON.stringify({ schema:1, version:'1.42.0', ...provenance, sourceDirty:false, archives }));
  assert.throws(() => verifyWebRelease(directory), /Provenance de livraison incohérente/, 'un résumé ne peut pas déclarer propre une livraison modifiée');
  fs.writeFileSync(path.join(directory, 'release-summary.json'), JSON.stringify({ schema:1, version:'1.42.0', ...provenance, archives }));
  fs.writeFileSync(path.join(directory, 'web', 'index.html'), 'contenu modifié après fabrication');
  assert.throws(() => verifyWebRelease(directory), /fichiers livrés ont changé/);
});
