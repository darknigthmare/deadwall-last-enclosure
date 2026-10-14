"""Resume the verified metric payload. Publish tested game source, never main or workflows."""
import gzip, hashlib, json, os, pathlib, subprocess, sys
ROOT = pathlib.Path.cwd()
BRANCH = 'fix/metric174-scale-frontage'
sha = lambda data: hashlib.sha256(data).hexdigest()
raw = gzip.decompress(b''.join((ROOT / f'scripts/metric174-payload.{i}.gzpart').read_bytes() for i in range(5)))
if len(raw) > 250000 or sha(raw) != 'f40f70f3046e79fc5cf88d5097f1962f3bf9434f721af1ddf680d59a93a6cc10':
    raise SystemExit('Payload fingerprint mismatch')
payload = json.loads(raw)
mode = sys.argv[1]
if mode not in ('apply', 'publish'):
    raise SystemExit('Expected apply or publish')
# First capture the checkpoint written through native Pause/Save. Then detach
# the synchronous Continue observation from mutable owner records such as stats.
for row in payload['files']:
    if row['path'] != 'scripts/browser-metric174.mjs':
        continue
    if row['before'] is not None or len(row['edits']) != 1:
        raise SystemExit('Unexpected browser patch structure')
    text = row['edits'][0][2]
    replacements = [
        ("   await page.reload({waitUntil:'networkidle'});await ready(page);\n", "   // The menu closes into a live simulation; use a fresh native saved checkpoint.\n   if(!await page.locator('#pauseMenu').isVisible())await activate(page,'#pauseButton',view.touch);\n   await activate(page,'#saveButton',view.touch);\n   const checkpoint=await page.evaluate(()=>{const d=DeadwallSave.parse(localStorage.getItem(DeadwallCore.SAVE_KEY));delete d.timestamp;return d;});\n   check('The native paused checkpoint retains the calibrated vehicle',checkpoint.expeditions.vehicle.metric174===1);\n   await page.reload({waitUntil:'networkidle'});await ready(page);\n"),
        ('diff(transaction.stored,restored)', 'diff(checkpoint,restored)'),
        ('const d=g.serialize();delete d.timestamp;globalThis.__metricContinue174=d;', 'const d=JSON.parse(JSON.stringify(g.serialize()));delete d.timestamp;globalThis.__metricContinue174=d;')
    ]
    for before, after in replacements:
        if text.count(before) != 1:
            raise SystemExit('Browser observation anchor mismatch')
        text = text.replace(before, after)
    row['edits'][0][2] = text
    row['after'] = sha(text.encode())
paths, prepared = [], []
for row in payload['files']:
    name = row['path']; relative = pathlib.PurePosixPath(name)
    if relative.is_absolute() or '..' in relative.parts or name in paths or name.startswith(('assets/', '.env', 'package')):
        raise SystemExit('Unsafe or unrelated path: ' + name)
    if relative.parts[0] not in {'src', 'scripts', 'tests', 'docs', '.github', 'index.html', 'sw.js'}:
        raise SystemExit('Path outside declared source scope')
    paths.append(name)
    target = ROOT / name
    if any(p.is_symlink() for p in [target, *target.parents]):
        raise SystemExit('Symlink refused')
    data = target.read_bytes() if target.exists() else None
    expected = row['after'] if mode == 'publish' else row['before']
    if (sha(data) if data is not None else None) != expected:
        raise SystemExit('Concurrent source change: ' + name)
    if mode == 'apply':
        text = data.decode() if data is not None else ''
        limit = len(text) + 1
        for start, end, replacement in reversed(row['edits']):
            if not isinstance(start, int) or not isinstance(end, int) or not 0 <= start <= end < limit:
                raise SystemExit('Overlapping edit')
            text = text[:start] + replacement + text[end:]
            limit = start
        result = text.encode()
        if sha(result) != row['after']:
            raise SystemExit('Result fingerprint mismatch: ' + name)
        prepared.append((target, result))
if mode == 'apply':
    for target, result in prepared:
        target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(result)
    output = ROOT / 'artifacts/qa/metric174'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'applied-source.json').write_text(json.dumps({'base': payload['base'], 'files': [{k: row[k] for k in ('path', 'before', 'after')} for row in payload['files']]}, indent=2))
    print(json.dumps({'applied': len(prepared), 'base': payload['base'], 'fingerprints': 'all verified'}))
else:
    if os.environ.get('GITHUB_REF') != 'refs/heads/' + BRANCH:
        raise SystemExit('Wrong publication branch')
    expected = os.environ['GITHUB_SHA']
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    remote = subprocess.check_output(['git', 'ls-remote', 'origin', 'refs/heads/' + BRANCH], text=True).split()[0]
    if head != expected or remote != expected:
        raise SystemExit('Branch advanced; preserve concurrent work')
    subprocess.run(['git', 'config', 'user.name', 'DEADWALL verification'], check=True)
    subprocess.run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], check=True)
    # No workflow writing permission is requested from the Actions bot.
    subprocess.run(['git', 'add', '--', *[p for p in paths if not p.startswith('.github/')]], check=True)
    subprocess.run(['git', 'commit', '-m', 'fix(metrics): calibrate owned vehicles and share non-crossing frontage across world, GPS and navigation'], check=True)
    subprocess.run(['git', 'push', 'origin', 'HEAD:refs/heads/' + BRANCH], check=True)
    print('Published validated source-only commit: ' + subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip())
