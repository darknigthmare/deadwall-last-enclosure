"""Apply only the exact reviewed source delta to its verified inputs."""
import hashlib
import json
import lzma
import pathlib
import subprocess

root = pathlib.Path.cwd().resolve()
here = root / '.delivery/vertical179'
m = json.loads((here / 'manifest.json').read_text())
if m['version'] != 1 or len(m['files']) != 17 or m['parts'] != 5:
    raise RuntimeError('Unexpected manifest')
subprocess.run(['git', 'merge-base', '--is-ancestor', m['base'], 'HEAD'], check=True)
paths = [i['path'] for i in m['files']]
if len(set(paths)) != len(paths):
    raise RuntimeError('Duplicate paths')
for name in paths:
    p = pathlib.PurePosixPath(name)
    target = root / name
    if p.is_absolute() or '..' in p.parts or name.startswith('.') or target.resolve() != target:
        raise RuntimeError('Unsafe source target')

def blob(name):
    p = root / name
    if not p.exists():
        return None
    data = p.read_bytes()
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

packed = b''.join((here / ('part%d.xz' % i)).read_bytes() for i in range(m['parts']))
if hashlib.sha256(packed).hexdigest() != m['xz_sha256']:
    raise RuntimeError('Transport mismatch')
patch = lzma.decompress(packed)
if hashlib.sha256(patch).hexdigest() != m['patch_sha256']:
    raise RuntimeError('Source patch mismatch')
if not all(blob(i['path']) == i['after'] for i in m['files']):
    mismatch = [i['path'] for i in m['files'] if blob(i['path']) != i['before']]
    if mismatch:
        raise RuntimeError('Concurrent or unexpected inputs refused: ' + ', '.join(mismatch))
    subprocess.run(['git', 'apply', '--check', '-'], input=patch, check=True)
    subprocess.run(['git', 'apply', '-'], input=patch, check=True)
if not all(blob(i['path']) == i['after'] for i in m['files']):
    raise RuntimeError('Output fingerprint mismatch')
report = pathlib.Path('/tmp/vertical179-qa')
report.mkdir(parents=True, exist_ok=True)
(report / 'verified-manifest.json').write_text(json.dumps(m, indent=2))
print('All seventeen reviewed files verified.')
