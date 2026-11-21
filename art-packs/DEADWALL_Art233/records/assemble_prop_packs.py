#!/usr/bin/env python3
"""Assemble byte-preserved source proposals for existing procedural205 props.

Read-only PNG inspection; never generates, redraws, resizes or edits an image.
Requires complete generation history and a SHA-bound visual review. Outputs
only to a new art-packs/DEADWALL_ArtNNN directory; refuses any changed overwrite.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import struct
import subprocess
from pathlib import Path
from PIL import Image

BASE = 'f3ba02a5b73a55120c02c21d5703902ea3e901d9'
REPO = 'darknigthmare/deadwall-last-enclosure'
KINDS = {
    233: 'singleBunk feedTrough waterTrough fodderRack milkingUnit milkVat nestBox wineVat wineBarrel grapePress veterinaryTable growingBench growingBed'.split(),
    234: 'conveyor dosingUnit foodMixer heatChamber metalSaw lathe millingMachine assemblyStation inspectionBench loom sewingStation cuttingTable materialMixer formingPress curingRack'.split(),
    235: ['touring-caravan', 'abandoned-caravan'],
}
TITLES = {233: 'Mobilier rural, de soins et de repos', 234: 'Mobilier et machines industriels', 235: 'Caravanes fermées'}

def digest(b): return hashlib.sha256(b).hexdigest()
def blob(b): return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def read_json(p): return json.loads(Path(p).read_text(encoding='utf-8'))
def json_bytes(x): return (json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode()
def git(repo,*args): return subprocess.check_output(['git','-C',str(repo),*args])
def safe(rel):
    p=Path(rel)
    if p.is_absolute() or '..' in p.parts or '\\' in rel or not p.parts: raise ValueError('Unsafe relative path: '+rel)
    return p.as_posix()
def absolute(value,prep):
    p=Path(value)
    return p.resolve() if p.is_absolute() else (prep/p).resolve()

def png_audit(path,relative):
    data=path.read_bytes()
    if data[:8]!=b'\x89PNG\r\n\x1a\n': raise ValueError('Not a PNG: '+str(path))
    w,h,bits,color,compression,filtering,interlace=struct.unpack('>IIBBBBB',data[16:29])
    with Image.open(path) as im: im.verify()
    chunks=[];pos=8
    while pos+12<=len(data):
        size=struct.unpack('>I',data[pos:pos+4])[0];kind=data[pos+4:pos+8].decode('ascii')
        if pos+12+size>len(data): raise ValueError('Truncated PNG chunk')
        chunks.append({'type':kind,'bytes':size});pos+=12+size
        if kind=='IEND': break
    if not chunks or chunks[-1]['type']!='IEND': raise ValueError('Missing PNG IEND')
    with Image.open(path) as im:
        im.load()
        if im.mode!='RGBA' or im.size!=(w,h): raise ValueError('Native RGBA required')
        alpha=im.getchannel('A');hist=alpha.histogram();bounds={};margins={}
        for threshold in [1,8,32,128,240]:
            box=alpha.point(lambda value,t=threshold:255 if value>=t else 0).getbbox()
            bounds[str(threshold)]=list(box) if box else None
            margins[str(threshold)]=dict(left=box[0],top=box[1],right=w-box[2],bottom=h-box[3]) if box else None
        if not hist[0] or not bounds['8'] or min(margins['8'].values())<=0: raise ValueError('Visible body or transparent margin missing')
        edges={'top':(0,0,w,1),'bottom':(0,h-1,w,h),'left':(0,0,1,h),'right':(w-1,0,w,h)}
        return {'file':relative,'sha256':digest(data),'bytes':len(data),'width':w,'height':h,'mode':im.mode,
          'pngBitDepth':bits,'pngColorType':color,'pngCompressionMethod':compression,'pngFilterMethod':filtering,'pngInterlaceMethod':interlace,
          'pngChunks':chunks,'pillowVerifyPassed':True,'alphaExtrema':list(alpha.getextrema()),
          'fullyTransparentPixels':hist[0],'fullyTransparentFraction':hist[0]/(w*h),'lowAlphaPixels1to7':sum(hist[1:8]),
          'boundsAlphaAtLeast':bounds,'marginsAlphaAtLeast':margins,
          'borderAlphaMaximum':{k:alpha.crop(box).getextrema()[1] for k,box in edges.items()},
          'nativeBytesPreserved':True,'imageEditingPerformed':False,'geometryCertified':False}

def source_records(selection,prep):
    sources=list(selection.get('sourceFiles',[]))
    index=prep/'references/source-index.json'
    if index.exists():
        j=read_json(index);sources+=j.get('sources',[])+j.get('atlases',[])
    if not sources: raise ValueError('No source index')
    unique={}
    for row in sources:
        p=row.get('preparedPath',row.get('path'));p=safe(p)
        normalized={**row,'preparedPath':p}
        if p in unique and unique[p]!=normalized: raise ValueError('Conflicting source bindings')
        unique[p]=normalized
    return list(unique.values())

def get_dimensions(target):
    spec=target.get('dimensions',target.get('nativeSpec'))
    if not isinstance(spec,dict): raise ValueError('No native dimensions')
    return {k:spec[k] for k in ['w','h','heightM']}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo',type=Path,required=True)
    parser.add_argument('--prep',type=Path,required=True)
    parser.add_argument('--pack',type=int,choices=KINDS,required=True)
    parser.add_argument('--date',required=True)
    parser.add_argument('--coverage-dir',type=Path)
    parser.add_argument('--validate-selection',action='store_true')
    args=parser.parse_args();repo=args.repo.resolve();prep=args.prep.resolve();number=args.pack
    if git(repo,'rev-parse','HEAD').decode().strip()!=BASE: raise ValueError('Checkout must remain at the declared publication base')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',args.date): raise ValueError('Explicit Europe/Paris date required')
    selection=read_json(prep/'selection-and-prompts.json')
    if selection.get('sourceMain',selection.get('sourceBase'))!=BASE: raise ValueError('Wrong selection revision')
    targets={row['key']:row for row in selection['targets']}
    if list(targets)!=KINDS[number] or len(selection['targets'])!=len(targets): raise ValueError('Wrong target order/count or duplicate kind')
    output=repo/'art-packs'/f'DEADWALL_Art{number}'
    if output.resolve()!=output: raise ValueError('Symlinked output not permitted')
    planned={};input_to_pack={}
    def put(rel,data):
        rel=safe(rel)
        if rel in planned and planned[rel]!=data: raise ValueError('Conflicting pack destination: '+rel)
        planned[rel]=data
    def put_json(rel,value): put(rel,json_bytes(value))
    put('records/assemble_prop_packs.py',Path(__file__).read_bytes())
    put('records/verify_canonical_refs.cjs',Path(__file__).with_name('verify_canonical_refs.cjs').read_bytes())
    for path in sorted((prep/'references').rglob('*')):
        if not path.is_file(): continue
        if path.is_symlink(): raise ValueError('Symlinked reference')
        rel=path.relative_to(prep).as_posix();put(rel,path.read_bytes());input_to_pack[str(path.resolve())]=rel
    for path in sorted(prep.iterdir()):
        if path.is_file() and path.suffix in ['.json','.cjs','.mjs','.py','.md','.txt']:
            rel='records/preparation/'+path.name;put(rel,path.read_bytes());input_to_pack[str(path.resolve())]=rel
    if (prep/'generation-records').exists():
        for path in sorted((prep/'generation-records').glob('*.json')): put('records/generation-inputs/'+path.name,path.read_bytes())
    sources=[]
    for row in source_records(selection,prep):
        rel=row['preparedPath'];raw=(prep/rel).read_bytes();repository_path=row.get('repositoryPath')
        if not repository_path or row.get('revision',row.get('sourceRevision'))!=BASE: raise ValueError('Unbound repository source')
        native=git(repo,'show',BASE+':'+repository_path)
        if raw!=native or row['sha256']!=digest(raw) or row['gitBlob']!=blob(raw) or row.get('bytes',len(raw))!=len(raw): raise ValueError('Changed source bytes: '+rel)
        sources.append({**row,'packPath':rel,'exactGitBaseBytesVerified':True})
    catalogue=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./src/codex-furnishings2026.js').CATALOGUE))"],cwd=repo))
    replay=read_json(prep/'root-canonical-replay.json')
    replay_rows={r['id']:r for r in replay['targets']}
    if replay.get('sourceRevision')!=BASE or set(replay_rows)!={t['artId'] for t in targets.values()}: raise ValueError('Incomplete independent canonical replay')
    for kind,target in targets.items():
        ident='prop:'+kind+':v0'
        if target.get('artId')!=ident or target.get('id')!=ident or target.get('kind')!=kind: raise ValueError('Typed prop identity required')
        expected_route='structural205' if number==235 else 'procedural205'
        if target['route']!=expected_route or target.get('canonicalVariant',target.get('variant',0))!=0: raise ValueError('Wrong source route or variant')
        dims=get_dimensions(target)
        expected={k:catalogue[kind][k] for k in dims} if number!=235 else dict(w=2.4,h=6.2,heightM=2.8)
        if dims!=expected: raise ValueError('Author-design dimension mismatch: '+kind)
        filename=target['file']
        if not re.fullmatch(re.escape(kind)+r'_[A-Za-z0-9_-]+\.png',filename): raise ValueError('Filename must preserve the exact prop kind')
        refs=target.get('referenceFiles',[])
        if not refs and target.get('canonicalReference'): refs=[target['canonicalReference'],target['styleReference']]
        if len(refs)<2: raise ValueError('Canonical and material-reference bindings required')
        for ref in refs:
            p=absolute(ref.get('path',ref.get('absolutePath')),prep)
            if digest(p.read_bytes())!=ref['sha256'] or str(p) not in input_to_pack: raise ValueError('Canonical/style reference mismatch or absent from pack')
        replayed=replay_rows[ident]
        if replayed['canonicalSha256']!=refs[0]['sha256'] or replayed.get('replayedBytesIdentical') is not True or replayed.get('nativeFootprintVerified') is not True: raise ValueError('Independent replay differs from canonical input')
    if args.validate_selection:
        print(json.dumps({'pack':number,'targets':len(targets),'sourceFiles':len(sources),'selectionVerified':True,'packWritten':False}));return
    if number==235 and not args.coverage_dir: raise ValueError('Art235 requires the final 99-proposal aggregate')
    final=read_json(prep/'results.json');history=read_json(prep/'history-results.json');reviews=read_json(prep/'review.json')
    if not isinstance(final,list) or not isinstance(history,list): raise ValueError('Generation arrays required')
    finals={r['key']:r for r in final}
    if len(final)!=len(targets) or set(finals)!=set(targets) or set(reviews)!=set(targets): raise ValueError('Incomplete final generations or reviews')
    def fingerprint(row):
        key=row['key']
        if key not in targets or row.get('id')!='prop:'+key+':v0' or row.get('artId')!='prop:'+key+':v0': raise ValueError('Unselected or conflicting generated identity')
        if row.get('promptIsVerbatim') is not True or row.get('transparentBackgroundRequested') is not True or not row.get('prompt'): raise ValueError('Actual prompt and transparent-background request required')
        if row.get('file')!=targets[key]['file'] or type(row.get('iteration'))is not int or row['iteration']<1: raise ValueError('Bad generation filename or iteration')
        p=absolute(row['generatedSourcePath'],prep);data=p.read_bytes()
        if data[:8]!=b'\x89PNG\r\n\x1a\n': raise ValueError('Native PNG output required')
        refs=tuple(digest(absolute(ref,prep).read_bytes()) for ref in row.get('referenceImages',[]))
        if not refs: raise ValueError('Missing actual image references')
        return key,row['iteration'],digest(data),row['prompt'],refs
    selected={key:fingerprint(row) for key,row in finals.items()};seen={};generations=[]
    for row in [*history,*final]:
        fp=fingerprint(row);token=fp[:2];key,iteration=token
        if token in seen:
            if seen[token]!=fp: raise ValueError('Conflicting generation record')
            continue
        seen[token]=fp;p=absolute(row['generatedSourcePath'],prep);chosen=fp==selected[key]
        rel=f'assets/art{number}/props/'+targets[key]['file'] if chosen else f'references/iterations/{key}-iteration-{iteration:02d}.png'
        put(rel,p.read_bytes());input_to_pack[str(p)]=rel
        generations.append({'row':row,'path':rel,'sha256':fp[2],'bytes':p.stat().st_size,'selected':chosen})
    for key in targets:
        iters=sorted(t[1] for t in seen if t[0]==key)
        if iters!=list(range(1,max(iters)+1)): raise ValueError('Generation history has a gap: '+key)
    by_hash={}
    for rel,data in planned.items():
        if Path(rel).suffix.lower() in ['.png','.webp','.jpg','.jpeg']: by_hash.setdefault(digest(data),rel)
    normalized=[]
    for generation in sorted(generations,key=lambda item:(KINDS[number].index(item['row']['key']),item['row']['iteration'])):
        row=generation['row'];refs=[]
        for original in row['referenceImages']:
            p=absolute(original,prep);sha=digest(p.read_bytes());rel=input_to_pack.get(str(p),by_hash.get(sha))
            if not rel or digest(planned[rel])!=sha: raise ValueError('Actual reference missing from archive: '+str(p))
            refs.append({'path':rel,'sha256':sha})
        normalized.append({'key':row['key'],'kind':row['key'],'id':row['id'],'artId':row['artId'],'label':row['label'],
          'iteration':row['iteration'],'prompt':row['prompt'],'promptIsVerbatim':True,'generator':row.get('generator','OpenAI built-in ImageGen'),
          'transparentBackgroundRequested':True,'referenceImages':refs,'output':generation['path'],'sha256':generation['sha256'],
          'bytes':generation['bytes'],'selected':generation['selected'],'nativeBytesPreserved':True,
          **({'editReason':row['editReason']} if row.get('editReason') else {})})
    assets=[];audits=[];source_map=[]
    for key,target in targets.items():
        row=finals[key];p=absolute(row['generatedSourcePath'],prep);sha=digest(p.read_bytes());review=reviews[key]
        if review.get('sha256')!=sha or not review.get('observation') or review.get('decision') not in ['accepted_source_art_proposal','accepted-source-art-proposal']: raise ValueError('Missing accepted SHA-bound review: '+key)
        rel=f'assets/art{number}/props/'+target['file'];audit=png_audit(p,rel);audits.append(audit)
        dims=get_dimensions(target)
        assets.append({'id':target['artId'],'artId':target['artId'],'kind':key,'name':target['label'],'path':rel,'sha256':sha,'bytes':len(p.read_bytes()),
          'iteration':row['iteration'],'dimensionsAuthorDesignMetres':dims,'canonicalVariant':0,'existingRoute':target['route'],
          'status':'dedicated_source_art_proposal_not_runtime_integrated'})
        canonical_ref=target.get('canonicalReference',target.get('referenceFiles',[{}])[0])
        canonical_path=absolute(canonical_ref.get('path'),prep)
        source_map.append({'id':target['artId'],'kind':key,'name':target['label'],'dimensionsAuthorDesignMetres':dims,
          'dimensionsAuthority':'author-design-not-manufacturer-dimension','canonicalVariant':0,'existingRoute':target['route'],
          'canonicalReference':{'path':input_to_pack[str(canonical_path)],'sha256':digest(canonical_path.read_bytes())},
          'sourceId':target.get('sourceId','codex-furnishing:'+key),'sourcePlanId':target.get('sourcePlanId'),
          'sourceObject':target.get('sourceObject'),'catalogueEntry':target.get('catalogueEntry',target.get('nativeSpec')),
          'sourceStatus':target.get('sourceStatus'),'existingState':target.get('existingState'),
          'sourceRevision':BASE,'renderer':'src/campaign-site-art205.js::drawProp → drawPropBase (private)',
          'renderState':'variant 0, stateAlpha false, no game argument: all service/water overlays inactive',
          'runtimeIntegrationPerformed':False,'newGameplayPlacementCreated':False})
    if len({a['sha256'] for a in assets})!=len(assets): raise ValueError('Duplicate final sprite bytes')
    put_json('references/verified-sources.json',sources);put_json('references/SOURCE_MAP.json',source_map)
    put_json('generation-history.json',normalized);put_json('generation-prompts.json',normalized)
    put_json('qa/visual-review-records.json',reviews)
    put_json('qa/image-audit.json',{'pack':f'Art{number}','checkedOn':args.date,'timezone':'Europe/Paris','method':'Read-only PNG decode, chunk inventory, RGBA histogram, alpha thresholds and SHA256.',
       'alphaThresholds':[1,8,32,128,240],'alphaInterpretation':'Transparent pixels and alpha 1–7 are recorded separately; visible margins at alpha>=8 do not imply perfectly zero alpha everywhere or certify geometry.','assets':audits})
    visual=[f'# Art{number} — Revue visuelle', '',f'Revue du {args.date}, liée aux SHA256 des PNG natifs.', '', '| Identité | Observation |', '|---|---|']
    visual += [f"| {targets[k]['artId']} | {reviews[k]['observation']} |" for k in targets]
    visual += ['', 'Les dimensions sont des choix auteur. La revue visuelle ne certifie ni fidélité métrique 1:1, ni identité pixel pour pixel, ni intégration moteur.', '']
    put('qa/visual-review.md','\n'.join(visual).encode())
    coverage=None
    if args.coverage_dir:
        if number!=235: raise ValueError('Aggregate coverage belongs only to Art235')
        put('records/build_coverage.py',Path(__file__).with_name('build_coverage.py').read_bytes())
        report=read_json(args.coverage_dir/'coverage-art222-235.json')
        all_rows=report['assets'];new_rows=[r for r in all_rows if r['scopeGroup']=='new_typed_prop_proposal']
        if len(all_rows)!=99 or len(new_rows)!=30 or len({r['id'] for r in all_rows})!=99 or len({r['sha256'] for r in all_rows})!=99: raise ValueError('Wrong aggregate coverage identities/counts')
        if report.get('ownManifestSha256Included') is not False or report.get('ownOutputCommitShaIncluded') is not False: raise ValueError('Self-referential coverage')
        if report['totalFinalPngBytes']!=sum(r['bytes'] for r in all_rows): raise ValueError('Aggregate byte total mismatch')
        expected={}
        for sibling in [233,234,235]:
            sibling_assets=assets if sibling==number else read_json(repo/'art-packs'/f'DEADWALL_Art{sibling}'/'PROVENANCE.json')['assets']
            for row in sibling_assets: expected[row['id']]=(row['sha256'],row['bytes'],f"art-packs/DEADWALL_Art{sibling}/"+row['path'])
        if expected!={r['id']:(r['sha256'],r['bytes'],r['repositoryAssetPath']) for r in new_rows}: raise ValueError('Aggregate differs from the three actual packs')
        coverage={}
        for name in ['coverage-art222-235.json','coverage-art222-235.md','prior-coverage-art222-232.json']:
            raw=(args.coverage_dir/name).read_bytes();put('coverage/'+name,raw);coverage[name]=digest(raw)
    superseded=len(normalized)-len(assets)
    put_json('PROVENANCE.json',{'schemaVersion':1,'project':'DEADWALL — Last Enclosure','batch':f'Art{number}','title':TITLES[number],
      'assembledOn':args.date,'timezone':'Europe/Paris','referenceRepository':REPO,'publicationBaseRevision':BASE,'publicationBaseIsOutputCommit':False,
      'identityPolicy':'prop:<kind>:v0; exact existing source kind; no DW reassignment',
      'scope':'Dedicated bitmap proposals for typed props already drawn procedurally. Analogous existing atlas cells are not claimed absent.',
      'finalSpriteCount':len(assets),'generationCount':len(normalized),'supersededCandidateCount':superseded,
      'nativeOutputBytesPreserved':True,'imageEditingResizingCroppingPerformed':False,
      'geometryBasis':'Unchanged exported drawProp with source-author dimensions and variant 0; pure canonical render with no live game argument.',
      'integration':{'performed':False,'runtimeSourceChanged':False,'runtimeAssetRegistrationChanged':False,'testsChanged':False,'newWorldPlacementCreated':False,'saveOrWorldIdentityChanged':False},
      'fidelity':{'reviewed':['canonical overhead layout','object identity and components','inactive state','native PNG and transparency','exact reference and prompt history'],
                  'notCertified':['metric or pixel-for-pixel 1:1 fidelity','metres per pixel','runtime anchors and collision alignment','unseen variants or rotations']},
      'sourcesIndex':'references/verified-sources.json','sourceMapping':'references/SOURCE_MAP.json','generationHistory':'generation-history.json',
      'technicalAudit':'qa/image-audit.json','visualReview':'qa/visual-review.md','aggregateCoverage':coverage,
      'validation':{'packTechnicalAudit':'passed','runtimeTests':'not_run_by_assembler','browser':'not_run_by_assembler'},'assets':assets})
    put_json('REPRISE.json',{'schemaVersion':1,'batch':f'Art{number}','savedOn':args.date,'publicationBaseRevision':BASE,
      'completedArtIds':[a['id'] for a in assets],'finalAssets':assets,'supersededCandidates':superseded,'priorPacksRegenerated':False,
      'publicationStatusAtAssembly':'prepared_locally_not_published_by_assembler','runtimeIntegrationPerformed':False,
      'remainingWork':['Review proposal against the exact source fixture before registration.','Calibrate scale, anchors, orientation and clipping on a separate integration commit.','Keep inactive material appearance; preserve service/water state owners.','Do not extrapolate V01 caravan dimensions or v0 furnishings to all variants.']})
    table='\n'.join(f"| `{a['id']}` | {a['name']} | {a['dimensionsAuthorDesignMetres']['w']} × {a['dimensionsAuthorDesignMetres']['h']} | {a['dimensionsAuthorDesignMetres']['heightM']} |" for a in assets)
    previews='\n\n'.join(f"### {a['name']}\n\n`{a['id']}`\n\n| Référence canonique v0 | Proposition source retenue |\n|---|---|\n| ![Référence {a['kind']}]({source_map[i]['canonicalReference']['path']}) | ![{a['name']}]({a['path']}) |" for i,a in enumerate(assets))
    readme=f'''# DEADWALL — Art{number} : {TITLES[number]}

**{len(assets)} PNG finaux et {superseded} sortie(s) remplacée(s)** sont conservés dans leurs octets natifs, avec prompts effectivement envoyés, références, dimensions auteur, historique et empreintes SHA256.

| Identité | Objet | Emprise X × Y (m) | Hauteur auteur (m) |
|---|---|---:|---:|
{table}

## Sources et périmètre

Les objets existent déjà dans les sources de la révision `{BASE}`. Les nouvelles images sont des propositions dédiées à leur type ; leur rendu procédural actuel reste présent. Des images analogues existent dans les atlas génériques. Ce pack ne transforme pas des plans auteur agricoles ou industriels en installations de campagne et n’affirme pas une absence de toute image analogue.

Les références canoniques utilisent l’entrée publique `drawProp`, qui délègue à `drawPropBase` privé, avec variante 0, `stateAlpha:false` et sans objet `game`. Les surimpressions de service et d’eau restent donc inactives. La géométrie et les cotes sont issues du code inchangé ; ce sont des choix auteur, pas des mesures constructeur. Pour les caravanes, seule l’instance parcelle 1 de V01 est représentée : toit et intérieur fermés, axe long Y, attelage vers −Y. La famille complète possède d’autres longueurs.

## Contrôles et contenu

- `assets/art{number}/props/` : images finales natives, sans réencodage.
- `references/iterations/` : sorties remplacées, lorsqu’une correction a été nécessaire.
- `references/` : références canoniques, atlas réellement fourni, sources inchangées et index vérifié contre Git.
- `generation-history.json` : chaque prompt réellement envoyé, ses images de référence et la sortie retenue ou remplacée.
- `records/` : préparation et enregistrements originaux, y compris les scripts de rendu.
- `qa/` : revue visuelle liée au SHA256, décodage PNG, chunks, dimensions et mesures alpha.
- `SHA256SUMS.txt` : tous les fichiers du pack, hors manifeste lui-même.

Les PNG possèdent un canal alpha et des marges autour du corps visible. Les pixels d’alpha très faible sont mesurés séparément ; cette vérification n’affirme pas un alpha strictement nul partout autour du sprite. Toutes les métadonnées natives restent conservées par copie exacte des octets.

**Propositions source uniquement.** La fidélité métrique ou pixel pour pixel 1:1 n’est pas certifiée. Échelle, ancrage, orientation, clipping et apparence en jeu restent à qualifier lors d’une intégration distincte. Aucune source du moteur, identité, sauvegarde, génération, collision, dépendance ou test n’est modifié par ce pack.

## Comparaison visuelle

{previews}
'''
    put('README.md',readme.encode())
    manifest=''.join(f'{digest(data)}  {rel}\n' for rel,data in sorted(planned.items()))
    put('SHA256SUMS.txt',manifest.encode())
    existing={p.relative_to(output).as_posix():p.read_bytes() for p in output.rglob('*') if p.is_file()} if output.exists() else {}
    if existing:
        if existing!=planned: raise ValueError('Refusing to overwrite a different assembled pack')
        written=False
    else:
        for rel,data in planned.items():
            p=output/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
        written=True
    print(json.dumps({'pack':number,'finalSpriteCount':len(assets),'generationCount':len(normalized),'supersededCandidateCount':superseded,'verifiedSourceFiles':len(sources),'files':len(planned),'bytes':sum(map(len,planned.values())),'manifestSha256':digest(planned['SHA256SUMS.txt']),'output':str(output),'written':written},ensure_ascii=False))

if __name__=='__main__': main()
