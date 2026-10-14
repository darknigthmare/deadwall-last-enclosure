"""Fingerprint-guarded follow-up to the already integrated source, no network."""
import hashlib
import json
import lzma
import pathlib
import subprocess

root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical175'
m = json.loads((here / 'final-manifest.json').read_text())
if m['version'] != 2 or len(m['files']) != 11:
    raise RuntimeError('Unexpected manifest')
subprocess.run(['git', 'merge-base', '--is-ancestor', m['base'], 'HEAD'], check=True)
paths = [i['path'] for i in m['files']]
if len(set(paths)) != len(paths):
    raise RuntimeError('Duplicate paths')
for name in paths:
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or (root / name).resolve() != root / name:
        raise RuntimeError('Unsafe target')

def blob(name):
    data = (root / name).read_bytes()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

packed = (here / 'final.xz').read_bytes()
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Patch mismatch')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    mismatch = [i['path'] for i in m['files'] if blob(i['path']) != i['before']]
    if mismatch:
        raise RuntimeError('Concurrent edits refused: ' + ', '.join(mismatch))
    subprocess.run(['git','apply','--check','-'], input=patch, check=True)
    subprocess.run(['git','apply','-'], input=patch, check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Output mismatch')
report = pathlib.Path('/tmp/vertical175')
report.mkdir(parents=True, exist_ok=True)
(report / 'verified-manifest.json').write_text(json.dumps(m, indent=2))
print('All eleven follow-up source files verified.')
