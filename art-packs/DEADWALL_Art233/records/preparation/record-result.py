"""Record native ImageGen results without opening, rewriting or copying PNG bytes."""
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent
row = json.loads(sys.argv[1])
assert pathlib.Path(row['generatedSourcePath']).is_file()
assert row['id'] == row['artId'] == 'prop:' + row['key'] + ':v0'
assert row['promptIsVerbatim'] is True
for name in ['initial-results.json', 'history-results.json', 'results.json']:
    if name == 'initial-results.json' and row['iteration'] != 1:
        continue
    path = root / name
    rows = json.loads(path.read_text()) if path.exists() else []
    if name == 'results.json':
        rows = [old for old in rows if old['key'] != row['key']]
    else:
        rows = [old for old in rows if not (old['key'] == row['key'] and old['iteration'] == row['iteration'])]
    rows.append(row)
    order = {target['key']: i for i, target in enumerate(json.loads((root/'generation-prompts.json').read_text()))}
    rows.sort(key=lambda item: (order[item['key']], item['iteration']))
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'saved': row['key'], 'iteration': row['iteration'], 'source': row['generatedSourcePath']}))
