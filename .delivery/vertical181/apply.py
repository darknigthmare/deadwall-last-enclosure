"""Apply only the exact reviewed source delta; refuse concurrent input changes."""
import hashlib, json, lzma, pathlib, subprocess
root = pathlib.Path.cwd().resolve()
folder = root / '.delivery/vertical181'
m = json.loads((folder / 'manifest.json').read_text())
if m['version'] != 1 or m['parts'] != 3 or len(m['files']) != 22 or m['unified'] != 0:
    raise RuntimeError('Unsupported manifest')
subprocess.run(['git', 'merge-base', '--is-ancestor', m['base'], 'HEAD'], check=True)
paths = [i['path'] for i in m['files']]
if len(set(paths)) != len(paths):
    raise RuntimeError('Duplicate path')
for name in paths:
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or (root / name).resolve() != root / name:
        raise RuntimeError('Unsafe source path')
def blob(name):
    p = root / name
    if not p.exists(): return None
    data = p.read_bytes()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
packed = b''.join((folder / ('part%d.xz' % n)).read_bytes() for n in range(m['parts']))
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport fingerprint mismatch')
patch = lzma.decompress(packed)
if len(patch) > 2000000 or hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Source patch fingerprint mismatch')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    changed = [i['path'] for i in m['files'] if blob(i['path']) != i['before']]
    if changed: raise RuntimeError('Refusing concurrent overwrite: ' + ', '.join(changed))
    subprocess.run(['git', 'apply', '--check', '--unidiff-zero', '-'], input=patch, check=True)
    subprocess.run(['git', 'apply', '--unidiff-zero', '-'], input=patch, check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Output fingerprint mismatch')
r = pathlib.Path('/tmp/vertical181-qa'); r.mkdir(parents=True, exist_ok=True)
(r / 'verified-manifest.json').write_text(json.dumps(m, indent=2))
(r / 'reviewed-source.patch').write_bytes(patch)
print('All twenty-two reviewed source files verified.')
