import pathlib, hashlib, json, subprocess

root = pathlib.Path.cwd()
source = root / '.github/metric174/review.json'
review = json.loads(source.read_text())
if review['base'] != '77f2b594358744eb865c387e50c683489f51f7b2':
    raise ValueError('Unexpected reviewed base')
subprocess.run(['git', 'merge-base', '--is-ancestor', review['base'], 'HEAD'], check=True)
allowed_roots = {'src', 'tests', 'scripts', 'docs'}
results = []
for row in review['files']:
    relative = pathlib.PurePosixPath(row['path'])
    if relative.is_absolute() or '..' in relative.parts or (relative.parts[0] not in allowed_roots and row['path'] != 'sw.js'):
        raise ValueError('Unreviewed output path')
    target = root / row['path']
    old = target.read_bytes() if target.exists() else None
    digest = hashlib.sha256(old).hexdigest() if old is not None else None
    if digest != row['before']:
        raise ValueError('Source changed: ' + row['path'])
    lines = (old or b'').decode('utf-8').splitlines(keepends=True)
    for edit in reversed(row['ops']):
        start, count = edit['at'], edit['delete']
        if not isinstance(start, int) or not isinstance(count, int) or start < 0 or count < 0 or start + count > len(lines):
            raise ValueError('Invalid edit interval')
        lines[start:start + count] = edit['lines']
    data = ''.join(lines).encode('utf-8')
    if hashlib.sha256(data).hexdigest() != row['after']:
        raise ValueError('Output mismatch: ' + row['path'])
    results.append((target, data))
# Validate every input and output before writing anything.
for target, data in results:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
output = root / 'artifacts/qa/metric174'
output.mkdir(parents=True, exist_ok=True)
(output / 'reviewed-files.json').write_text(json.dumps({'base': review['base'], 'files': [{k: v for k, v in row.items() if k != 'ops'} for row in review['files']]}, indent=2))
print('Applied', len(results), 'reviewed source files; no workflows or unlisted files modified.')
