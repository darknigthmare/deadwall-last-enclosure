"""Apply only the reviewed source delta, after validating every original and result."""
from pathlib import Path, PurePosixPath
import base64, gzip, hashlib, json
root = Path(__file__).resolve().parents[2]
encoded = b''.join((root / f'.github/ship171/reviewed{n}.b64').read_bytes() for n in ('1', '2a', '2b', '2c', '3a', '3b', '3c'))
if len(encoded) > 100000:
    raise ValueError('Oversized source transport')
raw = gzip.decompress(base64.b64decode(b''.join(encoded.split()), validate=True))
if len(raw) > 150000 or hashlib.sha256(raw).hexdigest() != 'd17600092001c1cbabc87917f8774d8ceada8415bf0a1db2e82f36c8a9bbfccc':
    raise ValueError('Unreviewed source transport')
payload = json.loads(raw)
manifest = payload['manifest']
prepared = []
for record in manifest['files']:
    name = record['path']
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or not (path.parts[0] in {'src', 'scripts', 'tests', 'docs'} or name == 'sw.js'):
        raise ValueError('Unapproved source path: ' + name)
    destination = root / name
    if destination.resolve() != destination or any(p.is_symlink() for p in destination.parents):
        raise ValueError('Source symlink is not allowed: ' + name)
    if record['before'] is None:
        if destination.exists():
            raise ValueError('New source already exists: ' + name)
        data = payload['newFiles'][name].encode('utf-8')
    else:
        original = destination.read_bytes()
        if hashlib.sha256(original).hexdigest() != record['before']:
            raise ValueError('Source diverged: ' + name)
        text = original.decode('utf-8')
        previous_end = 0
        for edit in record['edits']:
            if not previous_end <= edit['start'] <= edit['end'] <= len(text):
                raise ValueError('Overlapping or invalid source delta')
            previous_end = edit['end']
        for edit in reversed(record['edits']):
            text = text[:edit['start']] + edit['text'] + text[edit['end']:]
        data = text.encode('utf-8')
    if hashlib.sha256(data).hexdigest() != record['after']:
        raise ValueError('Unexpected resulting bytes: ' + name)
    prepared.append((destination, data))
if len({p for p, _ in prepared}) != len(prepared):
    raise ValueError('Duplicate target path')
for destination, data in prepared:
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
output = root / 'artifacts/qa/ship171'
output.mkdir(parents=True, exist_ok=True)
(output / 'applied.json').write_text(json.dumps({'base': manifest['base'], 'files': [{k: r[k] for k in ['path', 'before', 'after']} for r in manifest['files']]}, indent=2))
print('Verified and applied', len(prepared), 'source files; no workflow, dependency or asset changed.')
