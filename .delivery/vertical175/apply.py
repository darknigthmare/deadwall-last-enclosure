"""Apply the reviewed source patch only to its exact known inputs."""
import hashlib
import json
import lzma
import pathlib
import subprocess

root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical175'
manifest = json.loads((here / 'manifest.json').read_text())
if manifest['version'] != 1 or manifest['parts'] != 7:
    raise RuntimeError('Unsupported delivery manifest')
subprocess.run(['git', 'merge-base', '--is-ancestor', manifest['base'], 'HEAD'], check=True)
paths = [item['path'] for item in manifest['files']]
if len(paths) != len(set(paths)) or len(paths) != 20:
    raise RuntimeError('Unexpected path list')
for name in paths:
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name.startswith('.'):
        raise RuntimeError('Unsafe patch target')
    target = root / name
    if target.resolve() != target or target.is_symlink():
        raise RuntimeError('Symlink target refused')

def blob(name):
    p = root / name
    if not p.exists():
        return None
    data = p.read_bytes()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

packed = b''.join((here / ('part%d.xz' % n)).read_bytes() for n in range(manifest['parts']))
if hashlib.sha256(packed).hexdigest() != manifest['xz_sha256']:
    raise RuntimeError('Transport fingerprint mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != manifest['patch_sha256']:
    raise RuntimeError('Patch fingerprint mismatch')
if all(blob(i['path']) == i['after'] for i in manifest['files']):
    print('Reviewed source is already integrated; no mutation.')
else:
    mismatches = [i['path'] for i in manifest['files'] if blob(i['path']) != i['before']]
    if mismatches:
        raise RuntimeError('Inputs changed; refusing overwrite: ' + ', '.join(mismatches))
    subprocess.run(['git', 'apply', '--check', '-'], input=patch, check=True)
    subprocess.run(['git', 'apply', '-'], input=patch, check=True)
    if not all(blob(i['path']) == i['after'] for i in manifest['files']):
        raise RuntimeError('Post-application fingerprint mismatch')
    print('Applied all 20 reviewed source files, fingerprints verified.')
report = pathlib.Path('/tmp/vertical175')
report.mkdir(parents=True, exist_ok=True)
(report / 'verified-manifest.json').write_text(json.dumps(manifest, indent=2))
