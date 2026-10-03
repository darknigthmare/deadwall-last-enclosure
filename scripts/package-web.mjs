import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sourceState } from './release-policy.cjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const digest = data => createHash('sha256').update(data).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const crcTable = Uint32Array.from({ length:256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

export function crc32(data) {
  let value = 0xffffffff;
  for (const byte of data) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function safeFile(file) {
  if (typeof file !== 'string' || !/^(?:[\p{L}\p{N}\p{M}_. -]+\/)*[\p{L}\p{N}\p{M}_. -]+$/u.test(file) || file.split('/').some(part => part === '.' || part === '..' || part.trim() !== part || part.endsWith('.'))) throw new Error('Chemin de livraison invalide : ' + file);
  return file;
}

export function directoryFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes:true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).flatMap(entry => {
    const file = safeFile(prefix + entry.name);
    if (entry.isDirectory()) return directoryFiles(path.join(directory, entry.name), file + '/');
    if (!entry.isFile()) throw new Error('Les livraisons refusent les liens et fichiers spéciaux : ' + file);
    return [file];
  });
}

export function fileManifest(directory, files = directoryFiles(directory)) {
  return files.map(file => {
    const data = fs.readFileSync(path.join(directory, safeFile(file)));
    return { file, bytes:data.length, sha256:digest(data) };
  });
}

// Classic ZIP is sufficient for this game's assets. Reject ZIP64 limits explicitly;
// fixed UTC dates, ordering and permissions make the same inputs reproducible.
export function writeZip(directory, archive, epoch) {
  const files = directoryFiles(directory);
  if (files.length >= 65535) throw new Error('La livraison dépasse la limite ZIP classique.');
  const date = new Date(epoch * 1000);
  if (!Number.isSafeInteger(epoch) || epoch < 0 || !Number.isFinite(date.getTime()) || date.getUTCFullYear() > 2107) throw new Error('SOURCE_DATE_EPOCH invalide.');
  const zipDate = date.getUTCFullYear() < 1980 ? new Date('1980-01-01T00:00:00Z') : date;
  const dosDate = ((zipDate.getUTCFullYear() - 1980) << 9) | ((zipDate.getUTCMonth() + 1) << 5) | zipDate.getUTCDate();
  const dosTime = (zipDate.getUTCHours() << 11) | (zipDate.getUTCMinutes() << 5) | (zipDate.getUTCSeconds() >> 1);
  const fd = fs.openSync(archive, 'wx');
  let offset = 0;
  const central = [];
  const write = data => { fs.writeFileSync(fd, data); offset += data.length; };
  try {
    for (const file of files) {
      const name = Buffer.from(file, 'utf8');
      const data = fs.readFileSync(path.join(directory, file));
      const compressed = deflateRawSync(data, { level:6 });
      if (data.length >= 0xffffffff || compressed.length >= 0xffffffff || offset + 30 + name.length + compressed.length >= 0xffffffff) throw new Error('La livraison dépasse la limite ZIP classique.');
      const header = Buffer.alloc(30);
      header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8);
      header.writeUInt16LE(dosTime, 10); header.writeUInt16LE(dosDate, 12);
      header.writeUInt32LE(crc32(data), 14); header.writeUInt32LE(compressed.length, 18);
      header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
      const entry = Buffer.alloc(46);
      entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(0x0314, 4);
      header.copy(entry, 6, 4, 30); entry.writeUInt32LE(0x81a40000, 38);
      entry.writeUInt32LE(offset, 42);
      central.push(entry, name);
      write(header); write(name); write(compressed);
    }
    const start = offset;
    for (const entry of central) write(entry);
    if (offset + 22 >= 0xffffffff) throw new Error('La livraison dépasse la limite ZIP classique.');
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10); end.writeUInt32LE(offset - start, 12);
    end.writeUInt32LE(start, 16); write(end);
  } catch (error) {
    fs.closeSync(fd); fs.rmSync(archive, { force:true }); throw error;
  }
  fs.closeSync(fd);
  return { file:path.basename(archive), bytes:fs.statSync(archive).size, sha256:digest(fs.readFileSync(archive)) };
}

export function verifyZip(archive, expected) {
  const data = fs.readFileSync(archive);
  const requireCondition = (condition, message) => { if (!condition) throw new Error('Archive invalide : ' + message); };
  requireCondition(data.length >= 22, 'fin ZIP absente');
  const end = data.length - 22;
  requireCondition(data.readUInt32LE(end) === 0x06054b50 && data.readUInt32LE(end + 4) === 0 && data.readUInt16LE(end + 20) === 0, 'fin ZIP non standard');
  requireCondition(data.readUInt16LE(end + 8) === expected.length && data.readUInt16LE(end + 10) === expected.length, 'nombre de fichiers');
  let central = data.readUInt32LE(end + 16), local = 0;
  requireCondition(central + data.readUInt32LE(end + 12) === end, 'taille du répertoire');
  for (const entry of expected) {
    safeFile(entry.file);
    requireCondition(central + 46 <= end && data.readUInt32LE(central) === 0x02014b50, 'entrée centrale');
    const nameLength = data.readUInt16LE(central + 28);
    requireCondition(data.readUInt16LE(central + 30) === 0 && data.readUInt16LE(central + 32) === 0 && data.readUInt16LE(central + 34) === 0, 'métadonnées inattendues');
    const name = data.subarray(central + 46, central + 46 + nameLength).toString('utf8');
    const compressed = data.readUInt32LE(central + 20), bytes = data.readUInt32LE(central + 24);
    requireCondition(name === entry.file && bytes === entry.bytes && data.readUInt32LE(central + 42) === local, 'chemin ou taille');
    requireCondition(data.readUInt16LE(central + 8) === 0x800 && data.readUInt16LE(central + 10) === 8 && data.readUInt32LE(central + 38) === 0x81a40000, 'type de fichier');
    requireCondition(local + 30 + nameLength + compressed <= data.readUInt32LE(end + 16) && data.readUInt32LE(local) === 0x04034b50, 'entrée locale');
    requireCondition(data.subarray(local + 4, local + 30).equals(data.subarray(central + 6, central + 32)), 'en-têtes divergents');
    requireCondition(data.subarray(local + 30, local + 30 + nameLength).toString('utf8') === name, 'nom local');
    const payload = inflateRawSync(data.subarray(local + 30 + nameLength, local + 30 + nameLength + compressed), { maxOutputLength:Math.max(1, bytes + 1) });
    requireCondition(payload.length === bytes && crc32(payload) === data.readUInt32LE(central + 16) && digest(payload) === entry.sha256, 'empreinte ' + name);
    local += 30 + nameLength + compressed;
    central += 46 + nameLength;
  }
  requireCondition(central === end && local === data.readUInt32LE(end + 16), 'fichiers supplémentaires');
  return { files:expected.length, bytes:data.length, sha256:digest(data) };
}

export function verifyWebRelease(directory) {
  const summary = JSON.parse(fs.readFileSync(path.join(directory, 'release-summary.json'), 'utf8'));
  if (summary.schema !== 1 || !Array.isArray(summary.archives) || summary.archives.length !== 2 || summary.archives.some(archive => !archive || typeof archive.variant !== 'string' || typeof archive.file !== 'string') || [...new Set(summary.archives.map(archive => archive.variant))].sort().join(',') !== 'standalone,web' || new Set(summary.archives.map(archive => archive.file)).size !== 2) throw new Error('Résumé de livraison invalide.');
  return summary.archives.map(archive => {
    const variant = safeFile(archive.variant);
    if (variant.includes('/') || !['web', 'standalone'].includes(variant)) throw new Error('Variante de livraison invalide.');
    const staged = path.join(directory, variant);
    const manifestData = fs.readFileSync(path.join(staged, 'release-manifest.json'));
    const manifest = JSON.parse(manifestData);
    if (manifest.schema !== 1 || manifest.variant !== variant || manifest.version !== summary.version || !Array.isArray(manifest.files)) throw new Error('Manifeste de livraison invalide.');
    if (!/^[a-f0-9]{40}$/i.test(manifest.sourceRevision) || typeof manifest.sourceDirty !== 'boolean' || manifest.sourceRevision !== summary.sourceRevision || manifest.sourceDirty !== summary.sourceDirty || manifest.builtAt !== summary.builtAt || manifest.payloadFingerprint !== digest(Buffer.from(json(manifest.files)))) throw new Error('Provenance de livraison incohérente.');
    const expected = [...manifest.files, { file:'release-manifest.json', bytes:manifestData.length, sha256:digest(manifestData) }].sort((a,b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0);
    if (JSON.stringify(fileManifest(staged)) !== JSON.stringify(expected)) throw new Error('Les fichiers livrés ont changé : ' + variant);
    const verified = verifyZip(path.join(directory, safeFile(archive.file)), expected);
    if (verified.bytes !== archive.bytes || verified.sha256 !== archive.sha256) throw new Error('Empreinte ZIP incorrecte : ' + variant);
    return { variant, ...verified };
  });
}

function git(args) {
  return spawnSync('git', args, { cwd:root, encoding:'utf8', windowsHide:true });
}

export function deliveryGuide(version) {
  const match = /^(\d+)\.(\d+)\.\d+(?:-[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match) throw new Error('Version de livraison invalide.');
  return `docs/LIVRAISON_${match[1]}_${match[2]}.md`;
}

export function packageWeb({ output = path.join(root, 'release', 'web') } = {}) {
  const built = spawnSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')], { cwd:root, stdio:'inherit', windowsHide:true });
  if (built.error || built.status !== 0) throw built.error || new Error('Le build web a échoué.');
  const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const provenance = sourceState(git(['rev-parse', 'HEAD']), git(['status', '--porcelain']));
  const commitTime = git(['log', '-1', '--format=%ct']);
  const epochText = process.env.SOURCE_DATE_EPOCH ?? commitTime.stdout?.trim();
  if ((!process.env.SOURCE_DATE_EPOCH && commitTime.status !== 0) || !/^\d+$/.test(epochText || '')) throw new Error('Date source indisponible.');
  const epoch = Number(epochText);
  const builtAt = new Date(epoch * 1000).toISOString();
  fs.mkdirSync(output, { recursive:true });
  const directory = fs.mkdtempSync(path.join(path.resolve(output), 'build-'));
  const provenanceFiles = ['docs/ART_PROVENANCE.md', 'docs/GAME_ART_PROVENANCE.md', 'docs/CONTENT_ART_PROVENANCE.md',
    ...directoryFiles(path.join(root, 'assets')).filter(file => /(?:^|\/)(?:PROVENANCE_[A-Za-z0-9_.-]+\.json|PROMPTS\.md)$/.test(file)).map(file => 'assets/' + file)];
  const archives = [];
  for (const variant of ['web', 'standalone']) {
    const staged = path.join(directory, variant);
    fs.mkdirSync(staged);
    if (variant === 'web') fs.cpSync(path.join(root, 'dist'), path.join(staged, 'web'), { recursive:true });
    else fs.copyFileSync(path.join(root, 'DEADWALL_Standalone.html'), path.join(staged, 'DEADWALL_Standalone.html'));
    fs.copyFileSync(path.join(root, 'LICENSE.md'), path.join(staged, 'LICENCE_JEU.md'));
    fs.copyFileSync(path.join(root, 'docs', 'THIRD_PARTY_NOTICES.md'), path.join(staged, 'NOTICES_TIERS.md'));
    const guide = path.join(root, deliveryGuide(packageData.version));
    if (!fs.existsSync(guide)) throw new Error('Guide de livraison absent : ' + deliveryGuide(packageData.version));
    fs.copyFileSync(guide, path.join(staged, 'GUIDE_LIVRAISON.md'));
    for (const file of provenanceFiles) {
      const destination = path.join(staged, 'provenance', file);
      fs.mkdirSync(path.dirname(destination), { recursive:true }); fs.copyFileSync(path.join(root, file), destination);
    }
    fs.writeFileSync(path.join(staged, 'LIRE_MOI.txt'), `DEADWALL — La Dernière Enceinte ${packageData.version}\n\n${variant === 'standalone' ? 'Extraire l’archive puis ouvrir DEADWALL_Standalone.html dans un navigateur récent. Le jeu contient ses images et fonctionne hors connexion.' : 'Le dossier web/ contient la PWA à servir sur HTTPS (ou localhost en développement). Conserver tous les fichiers. L’installation hors ligne demande un premier chargement complet connecté.'}\n\nLes sauvegardes du navigateur dépendent de son profil et de l’origine du jeu. Exporter la campagne depuis les réglages avant de changer de navigateur, de chemin ou de site.\nCette livraison est une version de développement vérifiable ; elle ne certifie pas une publication en boutique, une classification ou les essais matériels.\nLa licence propriétaire du jeu reste applicable. Les notices et la provenance des images sont conservées.\n`);
    const files = fileManifest(staged);
    const manifest = { schema:1, game:'DEADWALL — La Dernière Enceinte', version:packageData.version, variant, builtAt, sourceDateEpoch:epoch, ...provenance,
      payloadFingerprint:digest(Buffer.from(json(files))), buildScriptSha256:digest(fs.readFileSync(path.join(root, 'scripts', 'build.mjs'))), packageLockSha256:digest(fs.readFileSync(path.join(root, 'package-lock.json'))),
      runtime:'browser', nativeWindowsVerified:false, storePublished:false, files };
    fs.writeFileSync(path.join(staged, 'release-manifest.json'), json(manifest));
    const archive = path.join(directory, `DEADWALL-${packageData.version}-${variant === 'web' ? 'Web-PWA' : 'Standalone'}.zip`);
    archives.push({ variant, ...writeZip(staged, archive, epoch) });
  }
  fs.writeFileSync(path.join(directory, 'release-summary.json'), json({ schema:1, version:packageData.version, builtAt, ...provenance, archives }));
  const verification = verifyWebRelease(directory);
  fs.writeFileSync(path.join(directory, 'verification.json'), json({ ok:true, checkedAt:new Date().toISOString(), archives:verification }));
  return { directory, version:packageData.version, sourceDirty:provenance.sourceDirty, archives:verification };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || !['--output', '--verify'].includes(args[0]) || !args[1] || args[1].startsWith('--'))) throw new Error('Usage : node scripts/package-web.mjs [--output DOSSIER | --verify DOSSIER]');
  const result = args[0] === '--verify' ? verifyWebRelease(path.resolve(args[1])) : packageWeb(args[0] === '--output' ? { output:path.resolve(args[1]) } : {});
  console.log(json(result));
}
