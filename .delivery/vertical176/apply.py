"""Install only the exact locally tested delta. Refuse concurrent edits."""
import hashlib
import json
import lzma
import pathlib
import subprocess

root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical176'
m = json.loads((here / 'manifest.json').read_text())
if m['version'] != 1 or len(m['files']) != 15:
    raise RuntimeError('Unexpected manifest')
subprocess.run(['git', 'merge-base', '--is-ancestor', m['base'], 'HEAD'], check=True)
paths = [i['path'] for i in m['files']]
if len(set(paths)) != len(paths):
    raise RuntimeError('Duplicate paths')
for name in paths:
    p = pathlib.PurePosixPath(name)
    target = root / name
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or target.resolve() != target:
        raise RuntimeError('Unsafe patch target')

def blob(name):
    p = root / name
    if not p.exists():
        return None
    data = p.read_bytes()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

packed = (here / 'part0.xz').read_bytes() + (here / 'part1.xz').read_bytes()
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport fingerprint mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Patch fingerprint mismatch')
actual = subprocess.check_output(['git','apply','--numstat','--unidiff-zero','-'],input=patch).decode().splitlines()
if sorted(line.split('\t',2)[2] for line in actual) != sorted(paths):
    raise RuntimeError('Patch targets differ from reviewed manifest')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    mismatch = [i['path'] for i in m['files'] if blob(i['path']) != i['before']]
    if mismatch:
        raise RuntimeError('Concurrent or unknown inputs refused: ' + ', '.join(mismatch))
    subprocess.run(['git','apply','--check','--unidiff-zero','-'],input=patch,check=True)
    subprocess.run(['git','apply','--unidiff-zero','-'],input=patch,check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Post-application fingerprint mismatch')
report = pathlib.Path('/tmp/vertical176-qa')
report.mkdir(parents=True,exist_ok=True)
(report / 'verified-manifest.json').write_text(json.dumps(m,indent=2))
print('All fifteen reviewed source files verified; no other source changed.')
