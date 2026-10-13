"""Apply only the exact reviewed source delta on the unchanged PR base."""
import base64, gzip, hashlib, json, pathlib, stat, subprocess
root = pathlib.Path.cwd()
folder = root / '.github/reviewed173'
parts = [f'part-{i:02}.b64' for i in range(13)] + [f'part-{i}{j}.b64' for i in (13, 14, 15) for j in range(4)]
encoded = ''.join((folder / name).read_text().strip() for name in parts)
if len(encoded) != 63112:
    raise ValueError('Reviewed transport length differs')
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != '9242add30facbdae10d51f60d2a10dfa38b1e72ac487e6bdfdd1da246fd4e27b':
    raise ValueError('Reviewed source fingerprint differs')
data = json.loads(gzip.decompress(compressed))
if data.get('base') != 'daaeaa7a582e5444fef7b9c7eb004ffe316b9076' or len(data['files']) != 32:
    raise ValueError('Unexpected reviewed base or file count')
paths = []
for record in data['files']:
    name = record['path']
    p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or '\\' in name or not (name == 'sw.js' or p.parts[0] in {'src', 'scripts', 'tests'} or name.startswith('docs/codex/')):
        raise ValueError('Unapproved source path: ' + name)
    target = root / name
    if target.exists():
        if not stat.S_ISREG(target.lstat().st_mode):
            raise ValueError('Source is not a regular file')
        actual = hashlib.sha256(target.read_bytes()).hexdigest()
    else:
        actual = None
    if actual != record['before']:
        raise ValueError('Source changed before integration: ' + name)
    paths.append(name)
if len(set(paths)) != 32:
    raise ValueError('Duplicate reviewed path')
patch = data['patch'].encode('utf-8')
subprocess.run(['git', 'apply', '--check', '-'], input=patch, check=True)
subprocess.run(['git', 'apply', '-'], input=patch, check=True)
for record in data['files']:
    if hashlib.sha256((root / record['path']).read_bytes()).hexdigest() != record['after']:
        raise ValueError('Applied source differs: ' + record['path'])
changed = subprocess.check_output(['git', 'diff', '--name-only'], text=True).splitlines()
if not set(changed).issubset(set(paths)):
    raise ValueError('Unreviewed tracked change')
out = root / 'artifacts/qa/reviewed173'
out.mkdir(parents=True, exist_ok=True)
(out / 'manifest.json').write_text(json.dumps({'base': data['base'], 'files': data['files']}, indent=2) + '\n')
(out / 'paths.txt').write_text('\n'.join(paths) + '\n')
print('32 reviewed source fingerprints verified and applied; no main or production write')
