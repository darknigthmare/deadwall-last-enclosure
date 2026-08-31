'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function runtimePackage(source) {
  // Packager removes private:true. Omit it at staging so source hashes describe
  // the package.json that is actually distributed inside app.asar.
  return { name:source.name, productName:'DEADWALL', version:source.version,
    description:source.description, author:'Darknigthmare', main:'desktop/main.cjs' };
}

function runtimePackageJson(source) {
  // Packager's sanitizer always writes one final LF, even when no fields change.
  return JSON.stringify(runtimePackage(source), null, 2)+'\n';
}

function verifyManifestFiles(manifest, files, readFile) {
  if (!Array.isArray(manifest.files) || !Array.isArray(files)) throw new Error('Invalid distribution file manifest.');
  const expected=new Set();
  for (const entry of manifest.files) {
    if (!entry || typeof entry.file !== 'string' || !/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/.test(entry.file) || entry.file.split('/').some(part=>part==='.'||part==='..') || entry.file==='build-manifest.json' || expected.has(entry.file)) throw new Error('Invalid or duplicate distribution file path.');
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes<0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error('Invalid distribution file fingerprint: '+entry.file);
    expected.add(entry.file);
    const data=readFile(entry.file);
    if (!Buffer.isBuffer(data) || data.length!==entry.bytes || createHash('sha256').update(data).digest('hex')!==entry.sha256) throw new Error('ASAR file does not match source manifest: '+entry.file);
  }
  expected.add('build-manifest.json');
  if (new Set(files).size!==files.length || files.length!==expected.size || files.some(file=>!expected.has(file))) throw new Error('ASAR file list does not match source manifest.');
  return { sourceFiles:manifest.files.length, archiveFiles:files.length };
}

function sourceState(revision, status) {
  if (revision.status !== 0 || status.status !== 0 || typeof revision.stdout !== 'string' || typeof status.stdout !== 'string' || !/^[a-f0-9]{40}$/i.test(revision.stdout.trim())) {
    throw new Error('Git source provenance is unavailable; refusing to label an unverified tree as clean.');
  }
  return { sourceRevision:revision.stdout.trim(), sourceDirty:Boolean(status.stdout?.trim()) };
}

function runtimeNotices(folder) {
  return ['LICENSE','LICENSES.chromium.html'].map(file => {
    const filename=path.join(folder,file), info=fs.statSync(filename);
    if (!info.isFile() || info.size < 100) throw new Error('Missing or empty third-party runtime notice: '+file);
    const data=fs.readFileSync(filename);
    return {file,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};
  });
}

module.exports = { runtimePackage, runtimePackageJson, verifyManifestFiles, sourceState, runtimeNotices };
