"""One-time, hash-guarded source application. No main, reset, dependency or asset writes."""
import gzip, hashlib, json, os, pathlib, subprocess, sys
ROOT = pathlib.Path.cwd()
BRANCH = 'fix/metric174-scale-frontage'
EXPECTED = 'f40f70f3046e79fc5cf88d5097f1962f3bf9434f721af1ddf680d59a93a6cc10'
compressed = b''.join((ROOT / ('scripts/metric174-payload.' + str(i) + '.gzpart')).read_bytes() for i in range(5))
raw = gzip.decompress(compressed)
if len(raw) > 250000 or hashlib.sha256(raw).hexdigest() != EXPECTED:
    raise SystemExit('Payload fingerprint mismatch')
payload = json.loads(raw)

# The first real browser run revealed normal simulation advancement after the
# depot modal closes. Observe a fresh native pause/save checkpoint for Continue.
QA_FIX = {'path': 'scripts/browser-metric174.mjs', 'before': 'e626aeda6f6bc874d6175e1d200dfebf8a1f60c9b48226c8130986234d438178', 'after': '24960d37d26aa648e871537debf4ebcfd5f3f9150593c5cff96cc1be5cc8c4cc', 'old': "   await page.reload({waitUntil:'networkidle'});await ready(page);\n", 'new': "   // Closing the depot action resumes the real simulation. Save a new native\n   // paused checkpoint after the read-only probes, not the earlier action time.\n   if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',view.touch);\n   await activate(page,'#saveButton',view.touch);\n   const checkpoint=await page.evaluate(()=>{const d=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));delete d.timestamp;return d;});\n   check('The native paused checkpoint retains the calibrated vehicle',checkpoint.expeditions.vehicle.metric174===1);\n   await page.reload({waitUntil:'networkidle'});await ready(page);\n", 'oldDiff': 'diff(transaction.stored,restored)', 'newDiff': 'diff(checkpoint,restored)'}
for row in payload['files']:
    if row['path'] == QA_FIX['path']:
        if row['before'] is not None or len(row['edits']) != 1 or row['after'] != QA_FIX['before']:
            raise SystemExit('Unexpected browser source before checkpoint correction')
        original = row['edits'][0][2]
        if original.count(QA_FIX['old']) != 1 or original.count(QA_FIX['oldDiff']) != 1:
            raise SystemExit('Browser checkpoint anchor mismatch')
        changed = original.replace(QA_FIX['old'], QA_FIX['new']).replace(QA_FIX['oldDiff'], QA_FIX['newDiff'])
        if hashlib.sha256(changed.encode()).hexdigest() != QA_FIX['after']:
            raise SystemExit('Browser checkpoint result mismatch')
        row['edits'][0][2] = changed
        row['after'] = QA_FIX['after']
paths = []
prepared = []
for row in payload['files']:
    name = row['path']; p = pathlib.PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or name in paths or name.startswith(('assets/', '.env', 'package')):
        raise SystemExit('Unsafe or unrelated path: ' + name)
    if p.parts[0] not in {'src', 'scripts', 'tests', 'docs', '.github', 'index.html', 'sw.js'}:
        raise SystemExit('Path outside declared source scope')
    paths.append(name)
    target = ROOT / name
    if any(parent.is_symlink() for parent in [target, *target.parents] if parent != ROOT.parent):
        raise SystemExit('Symlink refused')
    data = target.read_bytes() if target.exists() else None
    required = row['after'] if sys.argv[1] == 'publish' else row['before']
    actual = hashlib.sha256(data).hexdigest() if data is not None else None
    if actual != required:
        raise SystemExit('Concurrent source change: ' + name)
    if sys.argv[1] == 'apply':
        text = data.decode('utf-8') if data is not None else ''
        last = len(text) + 1
        for start, end, replacement in reversed(row['edits']):
            if not isinstance(start, int) or not isinstance(end, int) or not 0 <= start <= end < last:
                raise SystemExit('Overlapping edit')
            text = text[:start] + replacement + text[end:]; last = start
        result = text.encode('utf-8')
        if hashlib.sha256(result).hexdigest() != row['after']:
            raise SystemExit('Result fingerprint mismatch: ' + name)
        prepared.append((target, result))
if sys.argv[1] == 'apply':
    for target, result in prepared:
        target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(result)
    print(json.dumps({'applied': len(prepared), 'base': payload['base'], 'fingerprints': 'all verified'}))
elif sys.argv[1] == 'publish':
    if os.environ.get('GITHUB_REF') != 'refs/heads/' + BRANCH:
        raise SystemExit('Wrong publication branch')
    expected = os.environ['GITHUB_SHA']
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    remote = subprocess.check_output(['git', 'ls-remote', 'origin', 'refs/heads/' + BRANCH], text=True).split()[0]
    if head != expected or remote != expected:
        raise SystemExit('Branch advanced; preserve concurrent work')
    subprocess.run(['git', 'config', 'user.name', 'DEADWALL verification'], check=True)
    subprocess.run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], check=True)
    subprocess.run(['git', 'add', '--', *paths], check=True)
    subprocess.run(['git', 'commit', '-m', 'fix(metrics): calibrate owned vehicles and share non-crossing frontage across world, GPS and navigation'], check=True)
    subprocess.run(['git', 'push', 'origin', 'HEAD:refs/heads/' + BRANCH], check=True)
    print('Published validated source-only commit: ' + subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip())
else:
    raise SystemExit('Expected apply or publish')
