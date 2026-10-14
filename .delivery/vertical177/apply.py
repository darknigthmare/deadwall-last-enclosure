"""Apply only the exact locally tested PR6 source delta; reject concurrent edits."""
import hashlib
import json
import lzma
import pathlib
import subprocess

root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical177'
m = json.loads((here / 'manifest.json').read_text())
if m['version'] != 1 or m['unified'] != 0 or len(m['files']) != 12:
    raise RuntimeError('Unsupported source manifest')
subprocess.run(['git','merge-base','--is-ancestor',m['base'],'HEAD'],check=True)
paths = [i['path'] for i in m['files']]
if len(paths) != len(set(paths)):
    raise RuntimeError('Duplicate paths')
for name in paths:
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or (root/name).resolve() != root/name:
        raise RuntimeError('Unsafe target')

def blob(name):
    p = root/name
    if not p.exists():
        return None
    data = p.read_bytes()
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()

packed = (here/'part0.xz').read_bytes()+(here/'part1.xz').read_bytes()
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport fingerprint mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Patch fingerprint mismatch')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    mismatch = [i['path'] for i in m['files'] if blob(i['path']) != i['before']]
    if mismatch:
        raise RuntimeError('Changed source; no overwrite allowed: '+', '.join(mismatch))
    subprocess.run(['git','apply','--unidiff-zero','--check','-'],input=patch,check=True)
    subprocess.run(['git','apply','--unidiff-zero','-'],input=patch,check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Output fingerprint mismatch')
report = pathlib.Path('/tmp/vertical177-qa')
report.mkdir(parents=True,exist_ok=True)
(report/'verified-manifest.json').write_text(json.dumps(m,indent=2))
print('All twelve reviewed source files verified.')
