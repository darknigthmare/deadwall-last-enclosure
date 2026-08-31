import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { listPackage, statFile, extractFile } from '@electron/asar';
import { getCurrentFuseWire, FuseState, FuseV1Options } from '@electron/fuses';
import { verifyManifestFiles, sourceState, runtimeNotices } from './release-policy.cjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');

export function verifyAppAsar(folder,manifest) {
  const archive=path.join(folder,'resources','app.asar');
  const files=[];
  for (const name of listPackage(archive)) {
    const relative=name.replaceAll('\\','/').replace(/^\/+/,'');
    // ASAR traverses names with the host separator; manifests stay portable POSIX.
    const entry=statFile(archive,path.normalize(relative),false);
    assert.ok(!entry.link&&!entry.unpacked,'Distribution ASAR must not contain external or linked entries: '+relative);
    if (!entry.files) files.push(relative);
  }
  const embedded=JSON.parse(extractFile(archive,'build-manifest.json').toString('utf8'));
  // The release manifest adds archive/executable metadata; the embedded source
  // manifest must be exactly the original source metadata for every own key.
  for (const [key,value] of Object.entries(embedded)) assert.deepEqual(value,manifest[key],'Embedded source manifest differs: '+key);
  assert.deepEqual(Object.keys(embedded).sort(),['game','version','builtAt','sourceRevision','sourceDirty','electron','platform','arch','signed','files'].sort());
  return {...verifyManifestFiles(manifest,files,file=>extractFile(archive,path.normalize(file))),sha256:hash(fs.readFileSync(archive)),embeddedManifest:true};
}

export async function verifyDesktopRelease({folder,manifestPath,archive,expectedRevision}) {
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const current=sourceState(
    spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}),
    spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8',windowsHide:true})
  );
  assert.match(expectedRevision,/^[a-f0-9]{40}$/i,'Provide the full expected source revision.');
  assert.equal(current.sourceRevision,expectedRevision);
  assert.equal(current.sourceDirty,false,'Final distribution verification requires a clean source checkout.');
  assert.equal(manifest.sourceRevision,expectedRevision);
  assert.equal(manifest.sourceDirty,false);
  assert.equal(manifest.platform,'win32');assert.equal(manifest.arch,'x64');
  assert.equal(manifest.signed,false,'This workflow verifies an unsigned portable distribution.');
  const asarIntegrity=verifyAppAsar(folder,manifest);
  assert.deepEqual(asarIntegrity,manifest.asarIntegrity);
  const archiveData=fs.readFileSync(archive);
  assert.equal(archiveData.length,manifest.archiveBytes);
  assert.equal(hash(archiveData),manifest.archiveSha256);
  const executable=path.join(folder,'DEADWALL.exe');
  assert.equal(hash(fs.readFileSync(executable)),manifest.executableSha256);
  const notices=runtimeNotices(folder);
  assert.deepEqual(notices,manifest.runtimeNotices);
  for (const [distributed,source] of [['LICENCE_JEU.md','LICENSE.md'],['NOTICES_TIERS.md','docs/THIRD_PARTY_NOTICES.md']]) {
    assert.deepEqual(fs.readFileSync(path.join(folder,distributed)),fs.readFileSync(path.join(root,source)),distributed+' must match the verified source checkout');
  }
  const fuseWire=await getCurrentFuseWire(executable);
  const fuses=Object.fromEntries(Object.entries(fuseWire).map(([key,value])=>[FuseV1Options[key]||key,FuseState[value]||value]));
  assert.deepEqual(fuses,manifest.fuses);
  return {ok:true,verifiedAt:new Date().toISOString(),sourceRevision:expectedRevision,sourceDirty:false,
    folder,manifestPath,archive,archiveBytes:archiveData.length,archiveSha256:hash(archiveData),
    executableSha256:manifest.executableSha256,asarIntegrity,runtimeNotices:notices,
    gameLicence:true,thirdPartySummary:true,fuses,signed:false};
}

if (process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  function argument(name) {
    const index=process.argv.indexOf(name);
    if(index<0||!process.argv[index+1]||process.argv[index+1].startsWith('--'))throw new Error('Required argument: '+name);
    return process.argv[index+1];
  }
  const report=await verifyDesktopRelease({
    folder:path.resolve(argument('--folder')),manifestPath:path.resolve(argument('--manifest')),
    archive:path.resolve(argument('--archive')),expectedRevision:argument('--revision')
  });
  const output=path.resolve(argument('--output'));
  fs.mkdirSync(output,{recursive:true});
  const directory=fs.mkdtempSync(path.join(output,'integrity-'));
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});
  console.log('DEADWALL portable integrity passed: '+directory);
}
