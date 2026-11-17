#!/usr/bin/env python3
"""Read-only prior audit, then cumulative variants coverage after explicit root freeze.

No repository writes. Finalization writes exactly six reports under resume-art239.
The assembler calls verify_report(workspace, repo, directory) to rebind all report
bytes to the prior Git tree, actual PNGs, frozen documents and SHA-bound reviews.
"""
import argparse
from collections import Counter
from copy import deepcopy
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
from zoneinfo import ZoneInfo

SOURCE = '12e0aa4aa77b9901bd53eb7a8771382a5f753593'
PARENT = '6ebd6707251e675a5b75ded23e91dd28339dfe38'
PARENT_TREE = '33d089eab2bb23f288e66d57c2794f6a38b3ba84'
PRIOR_PATH = 'art-packs/DEADWALL_Art238/coverage/coverage-art222-238.json'
PRIOR_SHA = '0c07c9a4d5d3f8e2f2b1704e9b043170f0e818677fcb996bcab89e54288f351d'
REPORT_NAME = 'coverage-art222-241.json'
REPOSITORY = 'darknigthmare/deadwall-last-enclosure'
ACCEPTED = {'accepted_source_art_proposal', 'accepted-source-art-proposal'}
CONFIG = {
    239: ('fence', 'garden-shed', 'rain-barrel'),
    240: ('compost-bin', 'closed-pool'),
    241: ('touring-caravan', 'abandoned-caravan'),
}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def blob_hash(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def load(path):
    return json.loads(Path(path).read_bytes())


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])


def within(root, path):
    root, path = Path(root).resolve(), Path(path)
    if not path.is_absolute():
        path = root / path
    require(path.resolve().is_relative_to(root), f'Path escapes expected root: {path}')
    require(not path.is_symlink(), f'Symlinked coverage input: {path}')
    return path.resolve()


def file_record(path, name=None):
    data = Path(path).read_bytes()
    return {'path': name or str(path), 'sha256': sha(data), 'bytes': len(data),
            'gitBlobCalculated': blob_hash(data)}


def png_record(path, name=None):
    data = Path(path).read_bytes()
    require(data[:8] == b'\x89PNG\r\n\x1a\n' and len(data) > 33, f'Not a PNG: {path}')
    return {**file_record(path, name), 'width': int.from_bytes(data[16:20], 'big'),
            'height': int.from_bytes(data[20:24], 'big')}


def git_blobs(repo, paths, revision=PARENT):
    raw = git(repo, 'ls-tree', '-r', '-z', revision, '--', *sorted(paths))
    found = {}
    for entry in raw.split(b'\0'):
        if entry:
            header, name = entry.split(b'\t', 1)
            _, kind, oid = header.decode().split()
            require(kind == 'blob', 'Unexpected non-blob in source tree')
            found[name.decode()] = oid
    require(set(found) == set(paths), f'Missing paths at {revision}')
    return found


def parse_sums(raw):
    entries = {}
    for line in raw.decode().splitlines():
        digest, name = line.split('  ', 1)
        require(re.fullmatch('[0-9a-f]{64}', digest) and name not in entries,
                'Invalid or duplicated manifest entry')
        entries[name] = digest
    return entries


def audit_previous(repo):
    repo = Path(repo).resolve()
    require(git(repo, 'rev-parse', PARENT+'^{tree}').decode().strip() == PARENT_TREE,
            'Unexpected publication parent tree')
    raw = (repo/PRIOR_PATH).read_bytes()
    require(sha(raw) == PRIOR_SHA and raw == git(repo, 'show', PARENT+':'+PRIOR_PATH),
            'Prior cumulative report changed')
    previous = json.loads(raw)
    rows = previous['assets']
    require(len(rows) == previous['finalSpriteCount'] == 110, 'Unexpected prior final count')
    indexed = {row['repositoryAssetPath']: row for row in rows}
    require(len(indexed) == len(rows), 'Duplicate prior final path')
    physical, manifests, histories, metadata = {}, {}, [], []
    prior_audit_path = repo/'art-packs/DEADWALL_Art238/coverage/prior-files-audit.json'
    prior_measurements = {r['path']:r for r in load(prior_audit_path)['historicalOutputs']}
    metadata.append(file_record(prior_audit_path,str(prior_audit_path.relative_to(repo))))
    for n in range(222, 239):
        pack = repo/f'art-packs/DEADWALL_Art{n}'
        provenance = load(pack/'PROVENANCE.json')
        history = load(pack/'generation-history.json')
        sums = parse_sums((pack/'SHA256SUMS.txt').read_bytes())
        if n == 238:
            require(sums.get('coverage/prior-files-audit.json') == sha(prior_audit_path.read_bytes()),
                    'Committed prior physical audit differs from its pack manifest')
        require(len(provenance['assets']) == provenance['finalSpriteCount'], f'Art{n} final count')
        require(len(history) == provenance['generationCount'], f'Art{n} native history count')
        for name in ('PROVENANCE.json', 'generation-history.json', 'SHA256SUMS.txt'):
            path = pack/name
            item = file_record(path, str(path.relative_to(repo)))
            if name != 'SHA256SUMS.txt':
                require(sums.get(name) == item['sha256'], f'Art{n} metadata manifest mismatch')
            metadata.append(item)
        for row in provenance['assets']:
            path = within(pack, row['path'])
            rel = str(path.relative_to(repo))
            require(rel not in manifests, 'Duplicate prior manifest final')
            manifests[rel] = row
        for path in (pack/'assets').rglob('*.png'):
            physical[str(path.relative_to(repo))] = path
        for row in history:
            output = row.get('output') or row.get('outputInPack') or row.get('packPath')
            require(output, f'Art{n} native output lacks retained pack path')
            path = within(pack, output)
            measured = png_record(path, str(path.relative_to(repo)))
            declaration = row.get('audit') or {}
            declared_sha = row.get('sha256') or declaration.get('sha256')
            declared_bytes = row.get('bytes', declaration.get('bytes'))
            byte_source = 'generation-history-declaration'
            if declared_bytes is None:
                old_measurement = prior_measurements.get(measured['path'],{})
                require(old_measurement.get('sha256') == measured['sha256'],
                        'Missing committed prior size measurement')
                declared_bytes = old_measurement.get('bytes')
                byte_source = 'previous-committed-physical-audit'
            require(measured['sha256'] == declared_sha == sums.get(output),
                    f'Prior PNG SHA or manifest mismatch: {output}')
            require(isinstance(declared_bytes, int) and measured['bytes'] == declared_bytes,
                    f'Prior PNG byte declaration mismatch: {output}')
            histories.append({**measured, 'batch': f'Art{n}', 'key': row.get('key'),
                              'iteration': row['iteration'], 'declaredBytesVerified': True,
                              'byteVerificationSource': byte_source,
                              'selectedFinal': measured['path'] in indexed})
    require(set(physical) == set(manifests) == set(indexed),
            'Physical prior finals, individual manifests and cumulative report disagree')
    require(len({r['path'] for r in histories}) == len(histories), 'Duplicate native history path')
    require(len({r['sha256'] for r in histories}) == len(histories), 'Duplicate native PNG bytes')
    blobs = git_blobs(repo, {r['path'] for r in histories+metadata} | {PRIOR_PATH})
    for row in histories+metadata:
        require(row['gitBlobCalculated'] == blobs[row['path']],
                f'Prior file differs from published parent blob: {row["path"]}')
        row['gitBlobAtPublicationParent'] = blobs[row['path']]
    historical = {r['path']: r for r in histories}
    for path, row in indexed.items():
        measured, manifest = historical[path], manifests[path]
        require(row['sha256'] == manifest['sha256'] == measured['sha256'], f'Prior final SHA: {path}')
        require(row['bytes'] == manifest['bytes'] == measured['bytes'], f'Prior final bytes: {path}')
        require(row['id'] == manifest.get('artId', manifest['id']), f'Prior final identity: {path}')
    categories = Counter(r['coverageCategory'] for r in rows)
    require(dict(categories) == previous['categoryTotals'], 'Prior category totals differ from rows')
    native = [r for r in rows if r['coverageCategory'] == 'exterior' and r.get('nativeType')]
    direct = [r for r in native if r.get('nativePilotMappingVerified') is True]
    unresolved = [r for r in native if r.get('nativePilotMappingVerified') is False]
    kinds = sorted({r['kind'] for r in rows if r['coverageCategory'] == 'prop'})
    require(len(kinds) == categories['prop'] == 35, 'Prior prop families/proposals changed')
    require(len(native) == previous['nativeBuildingTypesWithSourceProposal'] == 62, 'Prior native types changed')
    require(len(direct) == previous['verifiedDirectNativeCodexAssociations'] == 42, 'Prior direct mappings changed')
    require(len(unresolved) == previous['nativeBuildingTypesWithUnresolvedCodexReferences'] == 20,
            'Prior unresolved mappings changed')
    require(len(histories) == previous['retainedGeneratedOutputCount'] == 168, 'Prior output count changed')
    require(sum(r['selectedFinal'] for r in histories) == len(rows), 'Prior selected/history mismatch')
    require(sum(r['bytes'] for r in rows) == previous['totalFinalPngBytes'], 'Prior total PNG bytes changed')
    # The historical runnerCable refusal records are not images and are not regenerated.
    blocked_evidence = []
    for blocked in previous['blockedTargets']:
        require(blocked['selectedPngCount'] == 0 and blocked['retainedGeneratedPngCount'] == 0,
                'Historical blocked target unexpectedly gained an image')
        pack = repo/'art-packs'/('DEADWALL_'+blocked['batch'])
        for failure in blocked['evidence'].get('failureReceipts', []):
            path = within(pack, 'records/'+failure['path'])
            item = file_record(path, str(path.relative_to(repo)))
            require(item['sha256'] == failure['sha256'], 'Historical refusal receipt SHA changed')
            require(item['gitBlobCalculated'] == git_blobs(repo, {item['path']})[item['path']],
                    'Historical refusal receipt differs from publication parent')
            blocked_evidence.append(item)
    summary = {'physicalFinalCount': len(rows), 'physicalHistoricalOutputCount': len(histories),
               'physicalNonfinalOutputCount': len(histories)-len(rows),
               'finalPngBytes': sum(r['bytes'] for r in rows),
               'historicalPngBytes': sum(r['bytes'] for r in histories),
               'categoryTotals': dict(categories), 'propProposalCount': categories['prop'],
               'nativePropFamilyCount': len(kinds), 'nativePropFamilies': kinds,
               'allDeclaredHashesBytesAndManifestEntriesMatch': True,
               'allPriorPngsAndMetadataMatchPublicationParentGitBlobs': True,
               'physicalPathsEqualPriorReportAndIndividualManifests': True,
               'perBatch': dict(Counter(r['batch'] for r in rows))}
    audit = {'publicationParent': PARENT, 'publicationParentTree': PARENT_TREE,
             'sourceMainRevision': SOURCE, 'previousReportSha256': PRIOR_SHA,
             'summary': summary, 'metadataFiles': metadata,
             'finalAssetPaths': sorted(physical), 'historicalOutputs': histories,
             'unchangedBlockedTargetEvidence': blocked_evidence}
    return raw, previous, audit


def blocked_rows(data):
    if isinstance(data, list):
        return data
    for key in ('blockedTargets', 'blocked', 'targets', 'backlog', 'excludedTargets'):
        if key in data:
            value = data[key]
            return value if isinstance(value, list) else [{'key': k, **v} for k, v in value.items()]
    if isinstance(data, dict) and all(isinstance(v, dict) for v in data.values()):
        return [{'key': k, **v} for k, v in data.items()]
    raise RuntimeError('Unsupported blocked-targets schema')


def collect_new(workspace, repo, previous):
    workspace, repo = Path(workspace).resolve(), Path(repo).resolve()
    locks, additions, histories, backlog, counts = {}, [], [], [], {}
    old_kinds = {r['kind'] for r in previous['assets'] if r['coverageCategory'] == 'prop'}

    def lock(path, role, digest=None, length=None):
        path = within(workspace, path)
        record = file_record(path, str(path.relative_to(workspace)))
        require(digest is None or record['sha256'] == digest, f'Frozen input SHA changed: {path}')
        require(length is None or record['bytes'] == length, f'Frozen input bytes changed: {path}')
        key = record['path']
        if key in locks:
            require(locks[key]['sha256'] == record['sha256'], f'Input changed while reading: {path}')
            locks[key]['roles'] = sorted(set(locks[key]['roles'] + [role]))
        else:
            locks[key] = {**record, 'roles': [role]}
        return path

    for n, kinds in CONFIG.items():
        prep = workspace/f'art{n}-prep'
        data = {}
        for role, name in {'selection':'selection-and-prompts.json', 'results':'results.json',
                           'history':'history-results.json', 'review':'review.json',
                           'rootReview':'root-review.json', 'replay':'root-canonical-replay.json',
                           'canonical':'canonical-render-receipt.json'}.items():
            data[role] = load(lock(prep/name, f'Art{n}:{role}'))
        selection = data['selection']
        require(selection.get('sourceMain', selection.get('sourceBase', selection.get('sourceRevision'))) == SOURCE,
                f'Art{n} source main differs')
        targets = {r['key']: r for r in selection['targets']}
        planned = {f'{kind}:v{v}' for kind in kinds for v in (1,2)}
        require(len(targets) == len(selection['targets']) and set(targets) == planned,
                f'Art{n} planned identities changed')
        results = {r['key']: r for r in data['results']}
        require(len(results) == len(data['results']) and set(results) <= planned, f'Art{n} bad result inventory')
        frozen_path = lock(prep/'freeze-manifest.json', f'Art{n}:author-freeze-manifest')
        frozen = load(frozen_path)
        frozen_files = frozen.get('authorFiles', frozen.get('files'))
        require(isinstance(frozen_files, list) and frozen_files, f'Art{n} frozen manifest lacks file rows')
        require(len({f['path'] for f in frozen_files}) == len(frozen_files), 'Duplicate author freeze path')
        for record in frozen_files:
            lock(within(prep, record['path']), f'Art{n}:author-frozen-file', record['sha256'], record.get('bytes'))
        if 'fileCount' in frozen:
            require(frozen['fileCount'] == len(frozen_files), f'Art{n} freeze file count')
        if 'totalBytes' in frozen:
            require(frozen['totalBytes'] == sum(r['bytes'] for r in frozen_files), f'Art{n} freeze byte count')
        receipts = []
        for name in ('handoff-receipt.json','delivery-receipt.json'):
            if (prep/name).exists():
                receipt = load(lock(prep/name, f'Art{n}:author-receipt'))
                declared = (receipt.get('manifestSha256') or receipt.get('freezeManifestSha256')
                            or receipt.get('freezeManifest',{}).get('sha256'))
                require(declared is None or declared == sha(frozen_path.read_bytes()), f'Art{n} stale freeze receipt')
                if isinstance(receipt.get('files'), dict):
                    for name, digest in receipt['files'].items():
                        lock(within(prep,name), f'Art{n}:receipt-bound-document', digest)
                receipts.append(receipt)
        require(receipts, f'Art{n} author receipt missing')
        blocks = {}
        if (prep/'blocked-targets.json').exists():
            blocks = {r['key']: r for r in blocked_rows(load(lock(prep/'blocked-targets.json', f'Art{n}:blocked-targets')))}
        require(set(results).isdisjoint(blocks) and set(results) | set(blocks) == planned,
                f'Art{n} each planned target must be accepted or explicitly blocked')
        replay = data['replay']
        require(replay['sourceRevision'] == SOURCE and replay['publicationParent'] == PARENT,
                f'Art{n} canonical replay has wrong source')
        replays = {r['key']: r for r in replay['targets']}
        canonicals = {r['key']: r for r in data['canonical']['targets']}
        require(set(replays) == set(canonicals) == planned, f'Art{n} canonical scope mismatch')
        for key, target in targets.items():
            variant = target['painterVariant']
            require(variant in (1,2) and target['canonicalVariant'] == variant and
                    key == f'{target["kind"]}:v{variant}' and target['id'] == 'prop:'+key and
                    target.get('artId',target['id']) == target['id'], f'Art{n} variant identity mismatch')
            require(target['kind'] in old_kinds and target['route'] == 'structural205', 'New prop family or route invented')
            require(int(target['sourcePlanId'].rsplit('-V',1)[1]) == target['sourcePlanVariant'],
                    'Author plan variant conflated with painter variant')
            require(':' not in target['file'] and target['file'].endswith(f'_v{variant}.png'), 'Unsafe variant filename')
            canonical = canonicals[key]
            path = lock(within(prep,canonical['file']), f'Art{n}:canonical-reference', canonical['sha256'])
            rr = replays[key]
            require(rr['canonicalSha256'] == rr['replaySha256'] == sha(path.read_bytes()) and
                    rr['replayedBytesIdentical'] is True and rr['sourceFixtureAndOptionsUnchanged'] is True and
                    rr['painterVariant'] == variant and rr['sourcePlanVariant'] == target['sourcePlanVariant'],
                    f'Art{n} independent canonical receipt differs')
        for source in selection.get('sourceFiles', []):
            source_path = within(prep, source.get('preparedPath',source['path']))
            lock(source_path, f'Art{n}:verified-source-copy', source['sha256'], source.get('bytes'))
            original = git(repo, 'show', PARENT+':'+source['repositoryPath'])
            require(source_path.read_bytes() == original, f'Art{n} source does not match publication parent')
            if not source['repositoryPath'].startswith('art-packs/'):
                require(original == git(repo,'show',SOURCE+':'+source['repositoryPath']),
                        f'Art{n} gameplay source differs from source main')
        tokens, batch_history = set(), []
        for row in data['history']:
            require(row['key'] in targets and row.get('promptIsVerbatim') is True,
                    f'Art{n} native history has unknown target/nonverbatim prompt')
            path = lock(row['generatedSourcePath'], f'Art{n}:native-output', row.get('sha256'), row.get('bytes'))
            measured = png_record(path)
            token = (row['key'],row['iteration'],measured['sha256'])
            require(token not in tokens, 'Duplicate generation history identity')
            tokens.add(token)
            if row.get('originalGeneratedSourcePath'):
                lock(row['originalGeneratedSourcePath'], f'Art{n}:original-tool-output', measured['sha256'],measured['bytes'])
            reference_entries = row.get('referenceFiles', [])
            for reference in reference_entries:
                ref_path = Path(reference['path'])
                if not ref_path.is_absolute(): ref_path = prep/ref_path
                lock(ref_path, f'Art{n}:actual-generation-reference',reference.get('sha256'))
            for reference in row.get('referenceImages', []):
                ref_path = Path(reference['path'] if isinstance(reference,dict) else reference)
                if not ref_path.is_absolute(): ref_path = prep/ref_path
                lock(ref_path, f'Art{n}:actual-generation-reference', reference.get('sha256') if isinstance(reference,dict) else None)
            batch_history.append({'batch':f'Art{n}','key':row['key'],'iteration':row['iteration'],
                                  'sha256':measured['sha256'],'bytes':measured['bytes'],
                                  'width':measured['width'],'height':measured['height'],
                                  'nativeSourcePath':str(path),'promptIsVerbatim':True})
        selected_tokens = set()
        for key, row in results.items():
            target = targets[key]
            measured = png_record(Path(row['generatedSourcePath']))
            token = (key,row['iteration'],measured['sha256'])
            require(token in tokens, 'Selected image absent from actual native history')
            require(row['id'] == target['id'] and row.get('artId',row['id']) == target['id'],
                    'Selected identity differs from source target')
            for role in ('review','rootReview'):
                decision = data[role].get(key, {})
                require(decision.get('decision') in ACCEPTED and decision.get('sha256') == measured['sha256'] and
                        decision.get('iteration',row['iteration']) == row['iteration'],
                        f'Art{n} {role} does not accept exact selected bytes: {key}')
            selected_tokens.add(token)
            additions.append({'batch':f'Art{n}','key':key,'kind':target['kind'],
                              'id':target['id'],'artId':target['id'],'name':target['label'],
                              'coverageCategory':'prop','scopeGroup':'new_existing_prop_variant_source_proposal',
                              'partition':'structural205_existing_painter_variant',
                              'repositoryAssetPath':f'art-packs/DEADWALL_Art{n}/assets/art{n}/props/{target["file"]}',
                              'repositoryAssetPathStatus':'assembly_destination',
                              'sha256':measured['sha256'],'bytes':measured['bytes'],
                              'width':measured['width'],'height':measured['height'],'iteration':row['iteration'],
                              'sourceRevision':SOURCE,'publicationParentRevision':PARENT,
                              'sourceId':target['sourceId'],'sourcePlanId':target['sourcePlanId'],
                              'sourcePlanVariant':target['sourcePlanVariant'],'painterVariant':target['painterVariant'],
                              'canonicalVariant':target['canonicalVariant'],'sourceVariant':target['painterVariant'],
                              'existingRenderingRoute':target['route'],'dimensionsAuthorDesignMetres':target['dimensions'],
                              'existingFamilyProposalIds':[r['id'] for r in previous['assets'] if r.get('kind') == target['kind'] and r['coverageCategory']=='prop'],
                              'newNativePropFamily':False,'existingRendererPresent':True,
                              'nativeSourcePath':str(Path(row['generatedSourcePath']).resolve()),
                              'byteVerificationSource':'native_PNG_and_exact_author_and_independent_root_reviews',
                              'independentRootReviewShaVerified':True,'reviewDecision':data['rootReview'][key]['decision'],
                              'analogousExistingImagesNotClaimedAbsent':True,
                              'publishedRevision':None,'publicationStatusAtAssembly':'prepared_source_proposal',
                              'metricFidelityCertified':False,'runtimeIntegrationPerformed':False})
        for key, evidence in blocks.items():
            require(data['rootReview'].get(key,{}).get('decision') not in ACCEPTED,
                    'Blocked target is nevertheless accepted by root')
            for receipt in evidence.get('failureReceipts',[]):
                lock(within(prep,receipt['path']), f'Art{n}:failed-service-receipt',receipt['sha256'])
            target = targets[key]
            backlog.append({'batch':f'Art{n}','key':key,'id':target['id'],'name':target['label'],
                            'selectedPngCount':0,'retainedGeneratedPngCount':sum(r['key']==key for r in batch_history),
                            'existingRenderingRoute':target['route'],'existingRendererPresent':True,
                            'status':'backlog_no_accepted_source_png','evidence':evidence})
        for row in batch_history:
            row['selectedFinal'] = (row['key'],row['iteration'],row['sha256']) in selected_tokens
        require(len({r['sha256'] for r in batch_history}) == len(batch_history), 'Duplicate native PNG in new pack')
        for row in data['history']:
            if 'selected' in row:
                require(row['selected'] == ((row['key'],row['iteration'],png_record(Path(row['generatedSourcePath']))['sha256']) in selected_tokens),
                        'History selected flag differs from final selection')
        for document in [frozen]+receipts:
            for field in ('finalImages','finalCount'):
                if field in document: require(document[field] == len(results), f'Art{n} stale {field}')
            for field in ('nativeGenerations','nativeOutputCount'):
                if field in document: require(document[field] == len(batch_history), f'Art{n} stale {field}')
            nested_counts = document.get('counts',{})
            for field in ('selectedFinals','finals'):
                if field in nested_counts: require(nested_counts[field] == len(results), f'Art{n} stale {field}')
            for field in ('nativePng','nativeHistoryPngs'):
                if field in nested_counts: require(nested_counts[field] == len(batch_history), f'Art{n} stale {field}')
            declared_selection = document.get('selected',document.get('finals'))
            if isinstance(declared_selection,list):
                require({(r['key'],r['iteration'],r['sha256']) for r in declared_selection} == selected_tokens,
                        f'Art{n} receipt selection differs from actual accepted files')
        histories.extend(batch_history)
        counts[str(n)] = {'plannedTargets':len(targets),'final':len(selected_tokens),
                          'generatedOutputs':len(batch_history),'nonfinalNativeOutputs':len(batch_history)-len(selected_tokens),
                          'backlogTargetsWithZeroFinalPng':len(blocks),
                          'blockedServiceAttemptCount':sum(len(b.get('failureReceipts',[])) for b in blocks.values())}
    for record in locks.values():
        current = file_record(workspace/record['path'])
        require(current['sha256'] == record['sha256'] and current['bytes'] == record['bytes'],
                'Inputs changed during coverage collection; wait for final freeze')
    return additions, backlog, histories, counts, [locks[k] for k in sorted(locks)]


def render_markdown(report, prior_audit):
    c, rows = report['categoryTotals'], report['newGenerationCounts']
    lines = ['# DEADWALL — propositions source Art222 à Art241', '',
             f"**{report['finalSpriteCount']} PNG finaux distincts**, dont {report['newFinalSpriteCount']} nouvelles variantes acceptées.", '',
             '| Catégorie | Propositions finales | Familles ou portée |','| --- | ---: | --- |',
             f"| Extérieurs | {c['exterior']} | 62 types natifs et 7 autres sites ou variantes |",
             f"| Props | {c['prop']} | {report['nativePropFamilyCount']} familles natives, inchangées |",
             f"| Acteur | {c['actor']} | Dépouille du modèle de survivant partagé |",
             f"| Mécanismes | {c['mechanism']} | Montages existants acceptés, sur support |", '',
             'Les variantes de peinture ne créent pas de nouveaux types. Le numéro du plan auteur et celui du peintre restent deux champs distincts.', '',
             '## Nouveaux lots', '',
             '| Pack | Cibles prévues | PNG finaux | Sorties natives conservées | Non finales | Cibles sans finale |',
             '| --- | ---: | ---: | ---: | ---: | ---: |']
    for n, r in rows.items():
        lines.append(f"| Art{n} | {r['plannedTargets']} | {r['final']} | {r['generatedOutputs']} | {r['nonfinalNativeOutputs']} | {r['backlogTargetsWithZeroFinalPng']} |")
    lines += ['',
              f"Les {report['previousFinalSpriteCount']} anciennes finales et les {report['previousGeneratedOutputs']} sorties natives antérieures ont été relues physiquement, confrontées aux SHA-256, tailles déclarées, manifestes individuels et blobs Git du parent publié `{PARENT}`. Le balayage des dossiers assets retrouve exactement les anciennes finales. Les lignes de l’ancien inventaire restent strictement identiques ; sa copie brute est conservée.", '',
              f"Le cumul contient {report['retainedGeneratedOutputCount']} sorties natives, dont {report['retainedNonfinalOutputCount']} non finales. Les finales représentent {report['totalFinalPngBytes']:,} octets, dont {report['newFinalPngBytes']:,} pour les trois nouveaux lots.", '',
              'Les 42 associations Codex directes et les 20 associations historiques non résolues restent inchangées. Le parent publié contient Art236–238 ; la source gameplay reste main12e. Le rapport ne présente pas les ajouts de la PR comme déjà fusionnés.', '',
              '## Backlog explicite', '',
              '| Pack | Cible | PNG retenu | PNG natifs conservés |','| --- | --- | ---: | ---: |']
    for r in report['blockedTargets']:
        lines.append(f"| {r['batch']} | {r['name']} | {r['selectedPngCount']} | {r['retainedGeneratedPngCount']} |")
    lines += ['',
              'Les deux refus historiques de runnerCable193 restent sans image et sans nouvelle tentative. Une sortie rejetée en revue demeure dans l’historique sans être comptée comme finale. Les canoniques, atlas et copies de références ne sont jamais comptés comme nouvelles générations.', '',
              '## Limites', '',
              'Ces images sont des propositions source. Aucune intégration runtime, calibration de pivot, collision, dimension métrique1:1, animation, rotation ou intérieur n’est certifié par ce comptage. Les rendus procéduraux, états, stocks et services existants demeurent inchangés. Le périmètre ne couvre pas toutes les variantes des 4000 plans auteur ni l’inventaire historique Art221.', '']
    return ('\n'.join(lines)).replace('main12e','main 12e').replace('métrique1:1','métrique 1:1').encode()


def compute_reports(workspace, repo, report_date=None):
    raw, previous, prior_audit = audit_previous(repo)
    new, backlog, histories, counts, locks = collect_new(workspace,repo,previous)
    new_history_hashes = {r['sha256'] for r in histories}
    require(len(new_history_hashes) == len(histories), 'Native history bytes duplicated across new packs')
    require(new_history_hashes.isdisjoint(r['sha256'] for r in prior_audit['historicalOutputs']),
            'An old output or reference was counted as a new generation')
    assets = deepcopy(previous['assets']) + new
    require(assets[:len(previous['assets'])] == previous['assets'], 'Historical row metadata mutated')
    require(len({r['id'] for r in assets}) == len(assets), 'Duplicate cumulative identity')
    require(len({r['sha256'] for r in assets}) == len(assets), 'Duplicate cumulative final PNG')
    require(len({r['repositoryAssetPath'] for r in assets}) == len(assets), 'Duplicate cumulative final path')
    categories = Counter(r['coverageCategory'] for r in assets)
    old_families = {r['kind'] for r in previous['assets'] if r['coverageCategory']=='prop'}
    families = {r['kind'] for r in assets if r['coverageCategory']=='prop'}
    require(families == old_families, 'Variant expansion must not create a native prop family')
    generated = prior_audit['summary']['physicalHistoricalOutputCount'] + len(histories)
    report = {'schemaVersion':3,'project':'DEADWALL — Last Enclosure',
              'reportDate':report_date or datetime.now(ZoneInfo('Europe/Paris')).date().isoformat(),'timezone':'Europe/Paris',
              'sourceMainRevision':SOURCE,'publicationParentRevision':PARENT,'publicationParentTree':PARENT_TREE,
              'scopeStatus':'accepted_source_variants_after_explicit_root_freeze',
              'previousCoverageReport':{'path':PRIOR_PATH,'sha256':PRIOR_SHA,'presentAtPublicationParent':PARENT,
                                        'url':f'https://github.com/{REPOSITORY}/blob/{PARENT}/{PRIOR_PATH}',
                                        'unchangedCopy':'prior-coverage-art222-238.json'},
              'finalSpriteCount':len(assets),'previousFinalSpriteCount':len(previous['assets']),
              'newFinalSpriteCount':len(new),'categoryTotals':dict(categories),
              'propProposalCount':categories['prop'],'previousPropProposalCount':previous['categoryTotals']['prop'],
              'newPropVariantProposalCount':len(new),'nativePropFamilyCount':len(families),
              'newNativePropFamilyCount':0,'nativePropFamilies':sorted(families),
              'nativeBuildingTypesWithSourceProposal':previous['nativeBuildingTypesWithSourceProposal'],
              'otherExteriorSitesOrVariants':previous['otherExteriorSitesOrVariants'],
              'verifiedDirectNativeCodexAssociations':previous['verifiedDirectNativeCodexAssociations'],
              'nativeBuildingTypesWithUnresolvedCodexReferences':previous['nativeBuildingTypesWithUnresolvedCodexReferences'],
              'historicalCodexAssociationsChanged':False,'historicalAssetRowsPreservedExactly':True,
              'previousGeneratedOutputs':previous['retainedGeneratedOutputCount'],
              'previousSupersededOutputs':previous['retainedNonfinalOutputCount'],
              'newGenerationCounts':counts,'retainedGeneratedOutputCount':generated,
              'retainedNonfinalOutputCount':generated-len(assets),
              'totalFinalPngBytes':sum(r['bytes'] for r in assets),'newFinalPngBytes':sum(r['bytes'] for r in new),
              'allFinalByteInputsVerified':True,'priorFinalsHistoryAndMetadataMatchPublicationParentGitBlobs':True,
              'newFinalsBoundToAuthorAndIndependentRootReviews':True,
              'blockedTargetCount':len(previous['blockedTargets'])+len(backlog),'blockedTargetsFinalPngCount':0,
              'blockedTargets':deepcopy(previous['blockedTargets'])+backlog,
              'historicalBlockedTargetsUnchanged':True,'runtimeIntegrationPerformed':False,
              'gameplaySourcesModified':False,'metricProjectionCertified':False,'historicalArt221InventoryRecovered':False,
              'ownManifestSha256Included':False,'ownOutputCommitShaIncluded':False,
              'coverageBuilderSha256':sha(Path(__file__).read_bytes()),
              'knownBacklog':deepcopy(previous['knownBacklog']),
              'scopeLimit':'Source proposals, not runtime integration, all variants, rotations, animations, accessible interiors or a count of native prop families. Painter variants and author plan variants are independent axes.',
              'assets':assets}
    snapshot = {'sourceMainRevision':SOURCE,'publicationParent':PARENT,'publicationParentTree':PARENT_TREE,
                'inputs':locks,'nativeOutputs':histories,'newFinalCount':len(new),
                'newNativeOutputCount':len(histories),'newBlockedTargets':backlog}
    files = {'prior-coverage-art222-238.json':raw,'prior-files-audit.json':encoded(prior_audit),
             'new-inputs-snapshot.json':encoded(snapshot),REPORT_NAME:encoded(report),
             'coverage-art222-241.md':render_markdown(report,prior_audit)}
    files['SHA256SUMS.txt'] = ''.join(f'{sha(files[name])}  {name}\n' for name in sorted(files)).encode()
    return report,files


def verify_report(workspace, repo, directory):
    """No writes: validate all six report files against physical and frozen inputs."""
    workspace,repo,directory = Path(workspace).resolve(),Path(repo).resolve(),Path(directory).resolve()
    saved = load(directory/REPORT_NAME)
    require(re.fullmatch(r'\d{4}-\d{2}-\d{2}',saved['reportDate']), 'Malformed coverage date')
    report,expected = compute_reports(workspace,repo,saved['reportDate'])
    require({p.name for p in directory.iterdir() if p.is_file()} == set(expected), 'Coverage directory inventory differs')
    for name,data in expected.items():
        require((directory/name).read_bytes() == data, f'Coverage output is stale or edited: {name}')
    # Once a destination exists, it must contain the same native bytes; this does
    # not change the report depending on assembly order.
    for row in report['assets'][report['previousFinalSpriteCount']:]:
        destination = within(repo,row['repositoryAssetPath'])
        if destination.exists():
            measured = png_record(destination)
            require(measured['sha256'] == row['sha256'] and measured['bytes'] == row['bytes'],
                    f'Assembled final differs from frozen source: {destination}')
    return {'verified':True,'finals':report['finalSpriteCount'],'newFinals':report['newFinalSpriteCount'],
            'nativeOutputs':report['retainedGeneratedOutputCount'],'propProposals':report['propProposalCount'],
            'nativePropFamilies':report['nativePropFamilyCount'],'coverageSha256':sha(expected[REPORT_NAME])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workspace',type=Path,default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--repo',type=Path)
    parser.add_argument('--directory',type=Path)
    mode=parser.add_mutually_exclusive_group()
    mode.add_argument('--verify-prior',action='store_true')
    mode.add_argument('--verify-report',action='store_true')
    mode.add_argument('--finalize',action='store_true')
    parser.add_argument('--root-frozen',action='store_true',help='Use only after explicit coordinating-agent freeze')
    args=parser.parse_args()
    workspace=args.workspace.resolve();repo=(args.repo or workspace/'deadwall-art236').resolve()
    directory=(args.directory or workspace/'resume-art239/coverage').resolve()
    if args.verify_report:
        result=verify_report(workspace,repo,directory)
    elif args.finalize:
        require(args.root_frozen,'Finalization requires the explicit root freeze')
        require(directory.is_relative_to(workspace/'resume-art239'), 'Report output must remain outside the repository')
        report,files=compute_reports(workspace,repo)
        directory.mkdir(parents=True,exist_ok=True)
        require(not ({p.name for p in directory.iterdir()}-set(files)), 'Unexpected existing coverage files')
        for name,data in files.items(): (directory/name).write_bytes(data)
        result=verify_report(workspace,repo,directory)
        result['output']=str(directory)
    else:
        _,_,audit=audit_previous(repo)
        result={'mode':'prior_audit_only','newTotalNotComputed':True,**audit['summary']}
    print(json.dumps(result,ensure_ascii=False))


if __name__=='__main__':
    main()
