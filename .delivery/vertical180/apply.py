"""Apply reviewed 180 source only to exact known inputs. No network or generated code."""
import hashlib, json, lzma, pathlib, subprocess
root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical180'
m = json.loads((here / 'manifest.json').read_text())
if m['version'] != 1 or m['parts'] != 4 or len(m['files']) != 15:
    raise RuntimeError('Unexpected manifest')
subprocess.run(['git','merge-base','--is-ancestor',m['base'],'HEAD'],check=True)
paths = [i['path'] for i in m['files']]
if len(set(paths)) != len(paths):
    raise RuntimeError('Duplicate target')
for name in paths:
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or (root / name).resolve() != root / name:
        raise RuntimeError('Unsafe target')
def blob(name):
    p = root / name
    if not p.exists(): return None
    d = p.read_bytes()
    return hashlib.sha1(b'blob '+str(len(d)).encode()+b'\0'+d).hexdigest()
packed = b''.join((here / ('part%d.xz' % i)).read_bytes() for i in range(m['parts']))
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport fingerprint mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Patch fingerprint mismatch')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    mismatches = [i['path'] for i in m['files'] if blob(i['path']) != i['before']]
    if mismatches: raise RuntimeError('Concurrent changes refused: '+', '.join(mismatches))
    subprocess.run(['git','apply','--check','-'],input=patch,check=True)
    subprocess.run(['git','apply','-'],input=patch,check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Output fingerprint mismatch')
r = pathlib.Path('/tmp/vertical180-qa');r.mkdir(parents=True,exist_ok=True)
(r / 'verified-manifest.json').write_text(json.dumps(m,indent=2))
print('All fifteen reviewed source files verified.')
