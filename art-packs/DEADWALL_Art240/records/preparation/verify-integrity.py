#!/usr/bin/env python3
"""Read-only Art240 image/source verification; writes only its JSON receipt."""
import datetime, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
repo = root.parent / 'deadwall-art236'
read = lambda name: json.loads((root / name).read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
git = lambda *args: subprocess.check_output(['git', '-C', str(repo), *args])
selection = read('selection-and-prompts.json')
targets = {t['key']: t for t in selection['targets']}
expected = {'compost-bin:v1', 'compost-bin:v2', 'closed-pool:v1', 'closed-pool:v2'}
assert set(targets) == expected and len(selection['targets']) == 4
results, history, reviews = read('results.json'), read('history-results.json'), read('review.json')
audits = {(a['key'], a['iteration']): a for a in read('alpha-audit.json')}
review_history = {(a['key'], a['iteration']): a for a in read('review-history.json')}
assert len(results) == len({r['key'] for r in results}) == 4
assert {r['key'] for r in results} == expected == set(reviews)
assert len(history) == len({(r['key'], r['iteration']) for r in history})
assert len(history) == len(audits) == len(review_history)
assert [r for r in history if r['selected']] == results
sources = []
for src in read('references/sources.json'):
    data = (root / src['preparedPath']).read_bytes()
    blob = git('show', f"{src['revision']}:{src['repositoryPath']}")
    current = (repo / src['repositoryPath']).read_bytes()
    assert data == blob == current
    assert sha(data) == src['sha256'] and len(data) == src['bytes']
    blob_id = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
    assert blob_id == src['gitBlob']
    sources.append({'repositoryPath': src['repositoryPath'], 'sha256': sha(data), 'gitBlob': blob_id, 'exactPinnedAndWorktreeBytes': True})
assert len(sources) == 22
canonical_receipt = read('canonical-render-receipt.json')
replays = {r['key']: r for r in read('root-canonical-replay.json')['targets']}
canonicals = []
for c in canonical_receipt['targets']:
    t = targets[c['key']]
    assert c['sourcePlanVariant'] == t['sourcePlanVariant']
    assert c['painterVariant'] == c['canonicalVariant'] == t['canonicalVariant'] == t['painterVariant']
    assert c['options']['variant'] == t['painterVariant']
    assert c['sourceObject'] == t['sourceObject']
    data = (root / c['file']).read_bytes()
    assert sha(data) == c['sha256'] == t['referenceFiles'][0]['sha256']
    assert replays[c['key']]['replaySha256'] == c['sha256'] and replays[c['key']]['replayedBytesIdentical']
    assert c['fixtureUnchanged'] and c['contextStateRestored'] and c['byteIdenticalSecondRender']
    canonicals.append({'key': c['key'], 'sha256': c['sha256'], 'independentRootReplayMatches': True})
outputs = []
for row in history:
    t = targets[row['key']]
    for field in ['id', 'artId', 'kind', 'canonicalVariant', 'painterVariant', 'sourcePlanVariant', 'sourcePlanId', 'sourceId', 'route']:
        assert row[field] == t[field], (row['key'], field)
    assert row['id'] == row['artId'] == 'prop:' + row['key']
    assert ':' not in row['file'] and row['file'].endswith(f"_v{t['painterVariant']}.png")
    native, copy = Path(row['originalGeneratedSourcePath']), Path(row['generatedSourcePath'])
    data = copy.read_bytes()
    assert data == native.read_bytes() and sha(data) == row['sha256'] and len(data) == row['bytes']
    call, response = read(row['inputCallFile']), read(row['responseCallFile'])
    for field in ['key', 'id', 'artId', 'iteration']:
        assert call[field] == response[field] == row[field]
    assert response['nativeImagePath'] == str(native)
    assert response['status'] == 'native-image-generated'
    assert call['arguments']['prompt'] == row['prompt']
    assert call['arguments']['referenced_image_paths'] == row['referenceImages']
    assert call['arguments']['transparent_background'] is True
    assert call['referenceFiles'] == row['referenceFiles']
    assert [f['path'] for f in row['referenceFiles']] == row['referenceImages']
    for ref in row['referenceFiles']:
        assert sha(Path(ref['path']).read_bytes()) == ref['sha256']
    assert call['inspection']['performed']
    audit = audits[(row['key'], row['iteration'])]
    rh = review_history[(row['key'], row['iteration'])]
    assert audit['sha256'] == rh['sha256'] == row['sha256']
    with Image.open(copy) as im:
        assert im.format == 'PNG' and im.mode == 'RGBA'
        pix = np.asarray(im); alpha = pix[:, :, 3]
        assert [im.width, im.height] == [audit['width'], audit['height']]
        assert [int(alpha.min()), int(alpha.max())] == audit['alphaExtrema'] == [0, 255]
        assert int((alpha == 0).sum()) == audit['fullyTransparentPixels']
        assert int(((alpha > 0) & (alpha < 8)).sum()) == audit['lowAlpha1to7Pixels']
        for threshold in [1, 8, 32, 128, 240]:
            ys, xs = np.where(alpha >= threshold)
            assert [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)] == audit['boundsAlphaAtLeast'][str(threshold)]
    if row['selected']:
        assert reviews[row['key']]['sha256'] == row['sha256']
        assert reviews[row['key']]['iteration'] == row['iteration']
    outputs.append({'key': row['key'], 'iteration': row['iteration'], 'sha256': sha(data), 'bytes': len(data), 'selected': row['selected'], 'nativeCopyByteIdentical': True, 'callPromptAndReferencesExact': True, 'alphaAuditRecomputed': True})
assert {str(p.resolve()) for p in (root / 'outputs').rglob('*.png')} == {r['generatedSourcePath'] for r in history}
prior = json.loads((root.parent / 'art238-prep/results.json').read_text())
for kind in ['compost-bin', 'closed-pool']:
    old = next(r for r in prior if r.get('key') == kind)
    assert sha(Path(old['generatedSourcePath']).read_bytes()) == targets[kind + ':v1']['priorProposal']['selectedSha256']
head = git('rev-parse', 'HEAD').decode().strip()
tree = git('rev-parse', 'HEAD^{tree}').decode().strip()
status = git('status', '--porcelain=v1').decode()
assert tree == selection['checkoutTree'] and not status
receipt = {'schemaVersion': 1, 'status': 'passed', 'observedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceMain': selection['sourceMain'], 'currentCheckoutRevision': head, 'currentCheckoutTree': tree, 'gitStatusPorcelain': status, 'sourceFiles': sources, 'canonicalReferences': canonicals, 'outputs': outputs, 'counts': {'targets': len(targets), 'selected': len(results), 'nativePng': len(history), 'replaced': len(history)-len(results), 'failedImageCalls': 0, 'blockedTargets': 0}, 'priorV0ProposalsBytesUnchanged': True, 'noImageMutation': True, 'rootVisualReviewSeparate': True, 'scriptSha256': sha(Path(__file__).read_bytes())}
(root / 'integrity-receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'counts': receipt['counts'], 'receiptSha256': sha((root / 'integrity-receipt.json').read_bytes()), 'head': head, 'tree': tree}))
