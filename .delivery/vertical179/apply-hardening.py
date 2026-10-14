"""Apply four fingerprint-checked follow-up files; never overwrite concurrent changes."""
import hashlib, json, lzma, pathlib, subprocess
root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical179'
m = json.loads((here / 'hardening.json').read_text())
if m['version'] != 1 or len(m['files']) != 4 or m['parts'] != 1:
    raise RuntimeError('Unexpected manifest')
subprocess.run(['git','merge-base','--is-ancestor',m['base'],'HEAD'], check=True)
paths = [i['path'] for i in m['files']]
if len(set(paths)) != 4:
    raise RuntimeError('Duplicate target')
for name in paths:
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or (root / name).resolve() != root / name:
        raise RuntimeError('Unsafe target')
def blob(name):
    d = (root / name).read_bytes()
    return hashlib.sha1(b'blob '+str(len(d)).encode()+b'\0'+d).hexdigest()
packed = (here / 'hardening.xz').read_bytes()
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Patch mismatch')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    if not all(blob(i['path']) == i['before'] for i in m['files']):
        raise RuntimeError('Concurrent source modification; refusing overwrite')
    subprocess.run(['git','apply','--check','-'],input=patch,check=True)
    subprocess.run(['git','apply','-'],input=patch,check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Output mismatch')
r = pathlib.Path('/tmp/vertical179-qa');r.mkdir(parents=True,exist_ok=True)
(r / 'verified-manifest.json').write_text(json.dumps(m,indent=2))
print('All four follow-up source files verified.')
