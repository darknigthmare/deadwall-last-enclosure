import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { packager } from '@electron/packager';
import { flipFuses, getCurrentFuseWire, FuseState, FuseVersion, FuseV1Options } from '@electron/fuses';
import { runtimePackageJson, sourceState, runtimeNotices } from './release-policy.cjs';
import { verifyAppAsar } from './verify-desktop-integrity.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const outputIndex = process.argv.indexOf('--output');
const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.join(root, 'release', 'desktop');
if (process.platform !== 'win32') throw new Error('This Windows portable release command must run on Windows.');
fs.mkdirSync(outputRoot, { recursive:true });
// Every build has its own directory. Existing releases and user data are never overwritten.
const runRoot = fs.mkdtempSync(path.join(outputRoot, 'build-'));
const staging = path.join(runRoot, 'source');
fs.mkdirSync(staging, { recursive:true });

async function run(command, args, env = process.env) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd:root, env, stdio:'inherit', windowsHide:true });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} failed (${code})`)));
  });
}

await run(process.execPath, [path.join(root, 'scripts', 'build.mjs')]);
fs.cpSync(path.join(root, 'dist'), path.join(staging, 'dist'), { recursive:true });
fs.mkdirSync(path.join(staging, 'desktop'));
for (const filename of ['main.cjs','policy.cjs','preload.cjs','smoke.cjs']) fs.copyFileSync(path.join(root, 'desktop', filename), path.join(staging, 'desktop', filename));
fs.copyFileSync(path.join(root, 'LICENSE.md'), path.join(staging, 'LICENSE.md'));
fs.writeFileSync(path.join(staging, 'package.json'), runtimePackageJson(packageData));

// ICO supports a PNG payload. Reuse the project's original icon without a conversion dependency.
const png = fs.readFileSync(path.join(root, 'assets', 'icon-192.png'));
const iconHeader = Buffer.alloc(22);
iconHeader.writeUInt16LE(1, 2); iconHeader.writeUInt16LE(1, 4);
iconHeader[6] = 192; iconHeader[7] = 192;
iconHeader.writeUInt16LE(1, 10); iconHeader.writeUInt16LE(32, 12);
iconHeader.writeUInt32LE(png.length, 14); iconHeader.writeUInt32LE(22, 18);
const icon = path.join(runRoot, 'deadwall.ico');
fs.writeFileSync(icon, Buffer.concat([iconHeader, png]));

function fileHashes(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes:true }).sort((a,b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const relative = `${prefix}${entry.name}`;
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? fileHashes(filename, `${relative}/`) : [{ file:relative, bytes:fs.statSync(filename).size, sha256:createHash('sha256').update(fs.readFileSync(filename)).digest('hex') }];
  });
}
const provenance = sourceState(spawnSync('git', ['rev-parse','HEAD'], { cwd:root, encoding:'utf8', windowsHide:true }), spawnSync('git', ['status','--porcelain'], { cwd:root, encoding:'utf8', windowsHide:true }));
const sourceManifest = { game:'DEADWALL — La Dernière Enceinte', version:packageData.version, builtAt:new Date().toISOString(), ...provenance, electron:packageData.devDependencies.electron, platform:'win32', arch:'x64', signed:false, files:fileHashes(staging) };
fs.writeFileSync(path.join(staging, 'build-manifest.json'), JSON.stringify(sourceManifest, null, 2));

const [folder] = await packager({
  dir:staging, out:runRoot, name:'DEADWALL', executableName:'DEADWALL',
  platform:'win32', arch:'x64', electronVersion:packageData.devDependencies.electron,
  appVersion:packageData.version, buildVersion:packageData.version, appBundleId:'com.darknigthmare.deadwall',
  icon, asar:true, asarIntegrityDigest:true, prune:false, overwrite:false,
  appCopyright:'Copyright Darknigthmare. All rights reserved.',
  win32metadata:{ CompanyName:'Darknigthmare', FileDescription:'DEADWALL — La Dernière Enceinte', ProductName:'DEADWALL', InternalName:'DEADWALL', OriginalFilename:'DEADWALL.exe' }
});
// Check the bytes that will ship, not only the pre-packager staging directory.
const asarIntegrity = verifyAppAsar(folder, sourceManifest);
const executable = path.join(folder, 'DEADWALL.exe');
const fusePolicy = {
  version:FuseVersion.V1,
  [FuseV1Options.RunAsNode]:false,
  [FuseV1Options.EnableCookieEncryption]:true,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]:false,
  [FuseV1Options.EnableNodeCliInspectArguments]:false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]:true,
  [FuseV1Options.OnlyLoadAppFromAsar]:true,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]:false
};
await flipFuses(executable, fusePolicy);
const fuseWire = await getCurrentFuseWire(executable);
for (const [key, enabled] of Object.entries(fusePolicy)) if (key !== 'version' && fuseWire[key] !== (enabled ? FuseState.ENABLE : FuseState.DISABLE)) throw new Error(`Electron fuse did not apply: ${FuseV1Options[key]}`);
const fuses = Object.fromEntries(Object.entries(fuseWire).map(([key,value]) => [FuseV1Options[key] || key, FuseState[value] || value]));
fs.writeFileSync(path.join(folder, 'LIRE_MOI.txt'), `DEADWALL — La Dernière Enceinte ${packageData.version}\r\n\r\nExtraire TOUT le dossier avant de lancer DEADWALL.exe. Ne pas déplacer le seul .exe.\r\nWindows 10/11 64 bits. Aucun navigateur, Node.js, compte ou réseau requis pour jouer.\r\nF11 ou Alt+Entrée : plein écran. Échap : pause. Alt+F4 : sauvegarder et quitter.\r\nLa perte du focus met la partie en pause.\r\nSauvegardes et réglages : %APPDATA%\\DEADWALL. Ne supprimez pas ce dossier pour mettre à jour le jeu.\r\nL'édition Windows a son propre profil, distinct des sauvegardes du navigateur.\r\n\r\nCette archive locale n'est pas signée numériquement. Windows peut afficher SmartScreen.\r\nUne signature éditeur et la validation matérielle étendue restent nécessaires avant distribution commerciale publique.\r\nLe moteur existant est Canvas 2D/2.5D, distribué dans une application desktop Electron sécurisée.\r\nIl ne s'agit pas d'un port Unreal/Godot ni d'un installateur système.\r\n`);
fs.copyFileSync(path.join(root, 'LICENSE.md'), path.join(folder, 'LICENCE_JEU.md'));
fs.copyFileSync(path.join(root, 'docs', 'THIRD_PARTY_NOTICES.md'), path.join(folder, 'NOTICES_TIERS.md'));
const notices = runtimeNotices(folder);
const zip = path.join(runRoot, `DEADWALL-${packageData.version}-Windows-x64-portable.zip`);
console.log(`Executable packaged: ${executable}\nCreating portable archive…`);
await run('powershell.exe', ['-NoProfile','-NonInteractive','-Command','Compress-Archive -LiteralPath $env:DEADWALL_PACKAGE_FOLDER -DestinationPath $env:DEADWALL_PACKAGE_ARCHIVE -CompressionLevel Optimal'], { ...process.env, DEADWALL_PACKAGE_FOLDER:folder, DEADWALL_PACKAGE_ARCHIVE:zip });
const release = { ...sourceManifest, asarIntegrity, fuses, runtimeNotices:notices, executable, archive:zip, archiveBytes:fs.statSync(zip).size, archiveSha256:createHash('sha256').update(fs.readFileSync(zip)).digest('hex'), executableSha256:createHash('sha256').update(fs.readFileSync(executable)).digest('hex') };
const manifest = path.join(runRoot, 'release-manifest.json');
fs.writeFileSync(manifest, JSON.stringify(release, null, 2));
console.log(`Windows portable ready (unsigned): ${zip}\nManifest: ${manifest}`);
