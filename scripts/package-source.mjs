import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { sourceState } from './release-policy.cjs';
import { directoryFiles, fileManifest, writeZip, verifyZip } from './package-web.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const json = value => JSON.stringify(value, null, 2) + '\n';
const hash = data => createHash('sha256').update(data).digest('hex');
const legacyFixture = 'reports/1.35.0/legacy-g5-start-save.json';

export function includeSourceFile(file) {
  if (typeof file !== 'string' || !file || file.startsWith('/') || file.includes('\\') || file.includes('\0') || file.split('/').some(part => !part || part === '.' || part === '..' || part.includes(':'))) throw new Error('Chemin source invalide : ' + file);
  if (file === legacyFixture) return true;
  if (file.split('/').some(part => ['.git', 'node_modules', 'dist', 'release', 'artifacts', 'outputs', 'coverage', 'reports', '.qa-tools', '.vercel', '.aws', '.ssh', '.gnupg', '.azure', 'gcloud', '.codex', '.agents', '.npmrc', '.netrc', '.pypirc', 'credentials.json', 'secrets.json'].includes(part) || part.startsWith('.env') || part.startsWith('.deadwall-backup-'))) return false;
  return !/\.(?:zip|exe|log|pem|key|p12|pfx|keystore)$/i.test(file) && !['DEADWALL_Standalone.html', 'MANIFEST_SHA256.json'].includes(file);
}

export function packageSource({ output = path.join(root, 'release', 'source') } = {}) {
  const git = args => spawnSync('git', args, { cwd:root, encoding:'utf8', windowsHide:true });
  const provenance = sourceState(git(['rev-parse', 'HEAD']), git(['status', '--porcelain']));
  const listed = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  if (listed.status !== 0) throw new Error('Impossible de lire la liste Git des sources.');
  const files = [...new Set(listed.stdout.split('\0').filter(Boolean))].filter(includeSourceFile).sort().filter(file => {
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) return false; // Tracked files deleted in this work session are excluded.
    if (!fs.lstatSync(filename).isFile()) throw new Error('La livraison source refuse liens et fichiers spéciaux : ' + file);
    return true;
  });
  for (const required of ['package.json', 'package-lock.json', 'AGENTS.md', 'src/game.js', 'scripts/build.mjs', legacyFixture]) if (!files.includes(required)) throw new Error('Source ou fixture indispensable absente : ' + required);
  const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const commitTime = git(['log', '-1', '--format=%ct']);
  const epochText = process.env.SOURCE_DATE_EPOCH ?? commitTime.stdout?.trim();
  if ((!process.env.SOURCE_DATE_EPOCH && commitTime.status !== 0) || !/^\d+$/.test(epochText || '')) throw new Error('Date source indisponible.');
  const epoch = Number(epochText), builtAt = new Date(epoch * 1000).toISOString();
  fs.mkdirSync(output, { recursive:true });
  const directory = fs.mkdtempSync(path.join(path.resolve(output), 'build-'));
  const staged = path.join(directory, 'sources'); fs.mkdirSync(staged);
  for (const file of files) {
    const destination = path.join(staged, 'DEADWALL', file);
    fs.mkdirSync(path.dirname(destination), { recursive:true }); fs.copyFileSync(path.join(root, file), destination);
  }
  fs.writeFileSync(path.join(staged, 'LIRE_MOI.txt'), `DEADWALL ${packageData.version} — sources de développement\n\nLe dossier DEADWALL/ contient les sources, tests, documents, codex et assets sélectionnés depuis le checkout Git courant. La licence propriétaire est conservée dans DEADWALL/LICENSE.md.\nNode.js ${packageData.engines.node} : npm ci --ignore-scripts puis npm run check. npm start démarre le développement web.\nPour les contrôles navigateur : npx playwright install chromium puis npm run test:browser.\nSous Windows : npm run desktop:setup installe le runtime Electron ; npm run package:desktop fabrique ensuite le portable.\nLes commandes de fabrication d’archives exigent un dépôt Git contenant un commit pour consigner la provenance ; cette archive n’embarque pas .git. npm start/build/check et QA restent utilisables depuis les sources extraites.\nLes dépendances installées, archives, builds, preuves QA générées et fichiers usuels de credentials sont exclus ; la fixture historique nécessaire aux tests est conservée.\nLe manifeste indique l’état Git réel et les empreintes exactes des fichiers. L’archive originale 1.41 reste conservée séparément.\n`);
  const payload = fileManifest(staged);
  const manifest = { schema:1, game:'DEADWALL — La Dernière Enceinte', version:packageData.version, variant:'sources', builtAt, sourceDateEpoch:epoch, ...provenance,
    sourceFingerprint:hash(Buffer.from(json(payload))), originalArchiveModified:false, files:payload };
  fs.writeFileSync(path.join(staged, 'release-manifest.json'), json(manifest));
  const archive = path.join(directory, `DEADWALL-${packageData.version}-Sources.zip`);
  const archiveInfo = writeZip(staged, archive, epoch);
  const verification = verifyZip(archive, fileManifest(staged));
  fs.writeFileSync(path.join(directory, 'release-summary.json'), json({ schema:1, version:packageData.version, builtAt, ...provenance, archive:archiveInfo }));
  fs.writeFileSync(path.join(directory, 'verification.json'), json({ ok:true, checkedAt:new Date().toISOString(), ...verification }));
  return { directory, archive:archiveInfo, sourceFiles:files.length, sourceDirty:provenance.sourceDirty };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--output' || !args[1] || args[1].startsWith('--'))) throw new Error('Usage : node scripts/package-source.mjs [--output DOSSIER]');
  console.log(json(packageSource(args.length ? { output:path.resolve(args[1]) } : {})));
}
