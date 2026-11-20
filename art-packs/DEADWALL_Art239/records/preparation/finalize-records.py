from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import copy
import hashlib
import json

ROOT = Path(__file__).resolve().parent
NOW = datetime.now(ZoneInfo('Europe/Paris')).isoformat()

def read(name):
    return json.loads((ROOT / name).read_text())

def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

selection = read('selection-and-prompts.json')
initial = read('initial-results.json')
original_reviews = read('pre-correction-records/review.json')
initial_alpha = [copy.deepcopy(original_reviews[r['key']]['alphaAudit']) for r in initial]
original_selection = read('pre-correction-records/selection-and-prompts.json')
original_fence_target = next(t for t in original_selection['targets'] if t['key'] == 'fence:v2')
root_review = read('root-review.json')
assert sha(ROOT / 'root-review.json') == 'c48e1a1365981692dc1c6f64971c941eee4f3f64bfd8f34d3f71d99d9ba60c6e'
targets = {t['key']: t for t in selection['targets']}
fence = targets['fence:v2']
canonical = copy.deepcopy(next(r for r in fence['referenceFiles'] if 'canonical' in r['relativePath']))

history = []
for old in initial:
    row = copy.deepcopy(old)
    target = targets[row['key']]
    row['existingAnalogue'] = target['existingAnalogue']
    row['previousV0AnalogueAudit'] = target['previousV0AnalogueAudit']
    row['selected'] = row['key'] != 'fence:v2'
    row['selectionStatus'] = 'accepted_source_art_proposal' if row['selected'] else 'superseded_after_independent_root_review'
    history.append(row)

for iteration in (2, 3):
    call = read(f'calls/fence_v2-iteration-0{iteration}-input.json')
    audit = read(f'fence-v2-iteration-0{iteration}-alpha.json')
    args = call['arguments']
    row = copy.deepcopy(original_fence_target)
    row['existingAnalogue'] = fence['existingAnalogue']
    row['previousV0AnalogueAudit'] = fence['previousV0AnalogueAudit']
    row.update(iteration=iteration, prompt=args['prompt'], referenceImages=args['referenced_image_paths'],
               generatedSourcePath=audit['path'], originalGeneratedSourcePath=audit['originalGeneratedSourcePath'],
               sha256=audit['sha256'], bytes=audit['bytes'], selected=iteration == 3,
               selectionStatus='accepted_source_art_proposal' if iteration == 3 else 'rejected_source_art_candidate',
               generationDate=NOW[:10], timezone='Europe/Paris', nativeOutputBytesPreserved=True,
               inputRecord=f'calls/fence_v2-iteration-0{iteration}-input.json',
               outputRecord=f'calls/fence_v2-iteration-0{iteration}-output.json')
    refs = []
    for index, image_path in enumerate(args['referenced_image_paths']):
        image_path = Path(image_path)
        refs.append({'path': str(image_path), 'relativePath': image_path.relative_to(ROOT).as_posix(),
                     'sha256': sha(image_path),
                     'role': 'edit target: iteration1 candidate; geometry unchanged' if iteration == 2 and index == 0 else 'authoritative canonical geometry and variant palette'})
    row['referenceFiles'] = refs
    if iteration == 3:
        row['referencePolicy'] = 'Canonical only for final generation; no prior candidate or Art238 v0 style image passed.'
    history.append(row)

finals = []
for target in selection['targets']:
    matches = [r for r in history if r['key'] == target['key'] and r['selected']]
    assert len(matches) == 1
    row = matches[0]
    assert sha(row['generatedSourcePath']) == row['sha256'] == root_review[row['key']]['sha256']
    assert root_review[row['key']]['iteration'] == row['iteration']
    assert root_review[row['key']]['decision'] == 'accepted_source_art_proposal'
    target['selectedIteration'] = row['iteration']
    if target['key'] == 'fence:v2':
        first_call = read('calls/fence_v2-iteration-01-input.json')['arguments']
        target['initialPrompt'] = first_call['prompt']
        target['initialReferenceImages'] = first_call['referenced_image_paths']
        target['initialReferenceFiles'] = copy.deepcopy(original_fence_target['referenceFiles'])
        target['prompt'] = row['prompt']
        target['referenceImages'] = row['referenceImages']
        target['referenceFiles'] = row['referenceFiles']
        target['referencePolicy'] = row['referencePolicy']
    finals.append(row)

assert len(finals) == 6 and len(history) == 8
assert len({r['sha256'] for r in history}) == 8
for row in history:
    assert sha(row['generatedSourcePath']) == sha(row['originalGeneratedSourcePath']) == row['sha256']
    assert Path(row['generatedSourcePath']).stat().st_size == row['bytes']
    args = read(row['inputRecord'])['arguments']
    assert row['prompt'] == args['prompt'] and row['referenceImages'] == args['referenced_image_paths']
    assert args['transparent_background'] is True
    for ref in row['referenceFiles']:
        assert sha(ref['path']) == ref['sha256']
assert len(list((ROOT / 'outputs').rglob('*.png'))) == 8

alpha_history = initial_alpha + [read('fence-v2-iteration-02-alpha.json'), read('fence-v2-iteration-03-alpha.json')]
alpha_by = {(a['key'], a['iteration']): a for a in alpha_history}
review = {}
iteration_review = []
for row in history:
    key, iteration = row['key'], row['iteration']
    if key != 'fence:v2':
        item = copy.deepcopy(original_reviews[key])
        item['independentRootReview'] = 'root-review.json, matching SHA and accepted decision verified'
    elif iteration == 1:
        item = copy.deepcopy(original_reviews[key])
        item.update(decision='superseded_after_independent_root_review',
                    observation='Initial author acceptance was superseded by independent root review: material remained too close to timber v0/v1 and the two fine X ties were insufficiently readable. The alpha border was fully transparent; this was not an alpha defect.',
                    initialAuthorReviewSnapshot='pre-correction-records/review.json',
                    independentRootReview='Correction requested; original native output retained.')
    elif iteration == 2:
        item = read('fence-v2-iteration-02-review.json')
    else:
        item = copy.deepcopy(original_reviews[key])
        item.update(iteration=3, sha256=row['sha256'], reviewedAt=NOW,
                    decision='accepted_source_art_proposal',
                    observation='ImageGen preview and independent root inspection show the complete extremely narrow horizontal steel segment, three post caps, two separated grey-olive rails and two continuous fine X ties. The broad low-alpha cloud of iteration2 is absent. Material is more uniformly metallic and the voids are clearer. The final source used the canonical alone; no earlier generated image was passed.',
                    inspectionMethod='Author inspected the ImageGen native preview and decoded native alpha without modifying pixels; root independently viewed the saved candidate and canonical. Author view_image displayed almost no object, an observed viewer discrepancy retained below rather than a claim of corrupted PNG bytes.',
                    independentRootReview='root-review.json, matching iteration3 SHA and accepted decision verified',
                    viewerLimit='Author view_image appeared almost empty for iterations2/3 despite valid nonzero RGB and alpha samples; root saw the native final object clearly. No pixel conversion was performed to resolve or hide the discrepancy.',
                    styleReferenceSha256=None,
                    referencePolicy='One input: authoritative canonical fence_v2.png only.')
        item['limitations'] = [
            'Source-art proposal only; no runtime integration, pivot calibration, metric scale or collision validation.',
            'Fine ties still require later engine-scale legibility review; no readability guarantee at every scale.',
            'Residual very-low-alpha pixels are recorded, including diffuse alpha1 pixels. Exact zero alpha everywhere outside the silhouette is not claimed; borders are alpha0.',
            'No crop, resize, cleanup, compositing or re-encoding. Native bytes preserved.',
            'Surface details and exact proportions are interpretations, not pixel-for-pixel or metric 1:1 certification.'
        ]
    item['key'] = key
    item['iteration'] = iteration
    item['sha256'] = row['sha256']
    item['selected'] = row['selected']
    item['alphaAudit'] = alpha_by[(key, iteration)]
    if row['selected']:
        review[key] = item
    iteration_review.append(item)

write('selection-and-prompts.json', selection)
write('results.json', finals)
write('history-results.json', history)
write('review.json', review)
write('iteration-review.json', iteration_review)
write('alpha-review.json', [alpha_by[(r['key'], r['iteration'])] for r in finals])
write('alpha-history.json', alpha_history)
assert set(review) == set(root_review) == set(targets)

readme = '''# DEADWALL Art239 — variantes structurelles choisies

Six propositions de source graphique sont retenues après revue d’auteur et revue indépendante du parent. Huit sorties natives sont archivées : les six premières générations et deux reprises de la clôture métallique. Sa troisième itération est retenue ; les deux premières restent disponibles avec leurs motifs d’écartement. Aucun PNG n’a été recadré, redimensionné, recomposé, nettoyé ou réencodé.

## Identité et portée

Le propriétaire reste `src/campaign-site-art205.js`, route `structural205`, API publique `drawProp`. Les clés `kind:vN` désignent une couverture graphique. Le `kind`, l’ID d’instance du monde et le plan auteur restent inchangés. Ces propositions étendent des variantes de forme et de matière déjà définies ; elles ne prouvent aucune absence de rendu Canvas et ne créent pas de type runtime.

Toutes les instances sont celles du plan `EXT-MONDE-T045-V01` utilisé pour Art238. Le numéro du plan est indépendant de la variante 1 ou 2 passée au peintre. Les enveloppes auteur sont : clôtures 3 × 0,15 m, hauteur 1,2 m ; abris 3,4 × 3,3 m, hauteur 2,4 m ; tonneaux 0,7 × 0,7 m, hauteur 1 m. Ces dimensions documentent les sources sans certifier l’échelle métrique des PNG.

| Clé | Construction native retenue | Itération finale |
| --- | --- | ---: |
| `fence:v1` | Deux diagonales bois de même pente, trois poteaux et deux rails. | 1 |
| `fence:v2` | Acier mat gris-olive, trois poteaux, deux rails séparés et deux croisillons fins. | 3 |
| `garden-shed:v1` | Toit métal, traverse horizontale centrale et six joints verticaux. | 1 |
| `garden-shed:v2` | Toit bois, grande plaque à deux fixations et petit panneau inférieur droit. | 1 |
| `rain-barrel:v1` | Couronne et disque métalliques, courte poignée et deux fixations latérales. | 1 |
| `rain-barrel:v2` | Couvercle métallique, traverse diagonale et deux bondes inégales. | 1 |

## Références et provenance

Le script historique `prepare.cjs` a extrait les références sur le HEAD local `e728993ee81f50b1bcc241ffe9503304a19e6ae0`, arbre `33d089eab2bb23f288e66d57c2794f6a38b3ba84`. Les 24 sources de base ont les mêmes blobs Git et les mêmes octets entre main `12e0aa4aa77b9901bd53eb7a8771382a5f753593` et ce checkout. Les sept documents obligatoires déjà lus lors de la préparation précédente sont inchangés et archivés avec leurs empreintes.

Le parent a ensuite récupéré et sélectionné le vrai commit distant `6ebd6707251e675a5b75ded23e91dd28339dfe38`, de même arbre. `references/provenance/late-direct-remote-commit-check.json` vérifie directement les 24 sources et les trois images de style Art238 à cette révision. Les reçus historiques conservent la révision réellement employée. Cet agent n’a modifié aucune référence Git.

Les canoniques passent par l’API publique inchangée avec Canvas 0.1.100, `seed:0`, `floor:0`, indice de variante explicite et `stateAlpha:false`. Aucun argument de jeu n’est fourni : aucun service ni overlay d’eau actif n’est incorporé. Les dimensions de canevas, l’origine et le facteur pixels/mètre sont ceux d’Art238. Les trois replays v0 sont identiques en octets aux anciens canoniques. `replay-canonicals.cjs` compare les buffers aux neuf fichiers archivés sans écrire de PNG ; le script d’extraction historique reste lié à son checkout initial.

Les neuf fichiers de référence distincts ont été inspectés avec `view_image` avant les premiers appels. Ceux-ci recevaient le canonique de la variante et l’image Art238 v0 du même objet pour sa finition seulement. La dernière génération de `fence:v2` reçoit **le canonique seul**. Les fichiers `calls/` et les champs de chaque résultat/historique enregistrent les références effectivement passées, dans leur ordre exact. Le champ `existingAnalogue` actuel distingue la variante choisie de l’audit v0 historique conservé sous `previousV0AnalogueAudit`.

## Reprises de la clôture métallique

L’itération 1 avait un bord entièrement transparent mais une matière trop proche du bois et des X peu lisibles. Son acceptation initiale d’auteur a été annulée par la revue indépendante ; le snapshot initial est conservé dans `pre-correction-records/`.

L’itération 2 a gardé des rails presque joints et des X peu distincts. Un large nuage gris apparaît dans l’aperçu. Le fichier comporte 502 668 pixels alpha1–7 autour de la silhouette ; son bord a un maximum de 1/255. Cette sortie est rejetée et conservée sans nettoyage. L’auteur voyait un aperçu `view_image` presque vide malgré des pixels RGB valides et 32 453 pixels alpha≥128 ; ce décalage observé n’est pas présenté comme une corruption du PNG.

L’itération 3, issue du canonique seul, a été retenue par le parent après inspection du fichier et de sa référence. Les rails séparés, trois poteaux et deux X sont lisibles, avec une matière gris-olive plus clairement métallique. Le grand nuage est absent de son aperçu. Elle garde 17 952 pixels alpha1–7 et quelques alpha1 diffus ; son bord est alpha0. L’auteur a encore observé le décalage de son aperçu `view_image`, tandis que le parent voyait l’objet natif. Aucune conversion de pixels n’a été utilisée pour masquer ce comportement d’affichage.

## Contrôles et limites

`results.json` contient les six finales, `history-results.json` les huit sorties et `iteration-review.json` les huit évaluations. `review.json` lie les six décisions aux SHA des images. `root-review.json` constitue la revue indépendante, conservée sans modification. `alpha-review.json` couvre les six finales et `alpha-history.json` les huit sorties. Chaque fichier retenu est identique en octets à sa sortie native originale et au SHA des deux revues.

Les faibles valeurs alpha restent natives. La silhouette visible demeure intérieure au canevas ; aucune transparence exactement nulle de tous les pixels extérieurs n’est revendiquée. Les marges mesurées sont publiées et ne sont pas présentées comme une conformité parfaite aux marges demandées dans les prompts.

Ces livrables restent des propositions de sources. Aucune intégration moteur, calibration de pivot, collision, lisibilité à toutes les échelles ou identité pixel/métrique 1:1 n’est certifiée. Les fines attaches devront être inspectées à taille moteur lors d’une intégration ultérieure. Les détails de matière, chanfreins et petits rivets sont interprétés.

Les 110 propositions précédentes et les fichiers du moteur sont inchangés. Aucun contrôle global supplémentaire n’a été lancé pour ce lot ; la validation de publication relève du parent. Aucun nouveau stock, objet de gameplay, faction, abomination ni nouvelle tentative du mécanisme bloqué n’a été introduit.
'''
(ROOT / 'README.md').write_text(readme)

files = []
for path in sorted(ROOT.rglob('*')):
    if path.is_file() and path.relative_to(ROOT).as_posix() not in ('freeze-manifest.json', 'handoff-receipt.json'):
        files.append({'path': path.relative_to(ROOT).as_posix(), 'bytes': path.stat().st_size, 'sha256': sha(path)})
manifest = {'kind': 'art239-final-freeze-manifest', 'createdAt': NOW, 'timezone': 'Europe/Paris',
            'finalImages': 6, 'nativeGenerations': 8, 'supersededImages': 2, 'files': files,
            'rootReviewIncludedUnmodified': True}
write('freeze-manifest.json', manifest)
receipt = {'kind': 'art239-source-proposals-handoff', 'status': 'frozen_after_independent_root_review',
           'createdAt': NOW, 'timezone': 'Europe/Paris', 'baseMain': selection['sourceMain'],
           'verifiedRemoteHead': selection['sourceRemoteHead'], 'sourceTree': selection['sourceTree'],
           'finalImages': 6, 'nativeGenerations': 8, 'supersededImages': 2,
           'bytesFinalImages': sum(r['bytes'] for r in finals), 'bytesNativeGenerations': sum(r['bytes'] for r in history),
           'pixelEdits': False, 'runtimeIntegrated': False, 'resultsFile': 'results.json',
           'historyFile': 'history-results.json', 'reviewFile': 'review.json', 'rootReviewFile': 'root-review.json',
           'manifestFile': 'freeze-manifest.json', 'manifestSha256': sha(ROOT / 'freeze-manifest.json'),
           'files': {name: sha(ROOT / name) for name in ['selection-and-prompts.json', 'canonical-render-receipt.json', 'geometry-audit.json', 'results.json', 'history-results.json', 'review.json', 'root-review.json', 'iteration-review.json', 'alpha-review.json', 'alpha-history.json', 'README.md']},
           'finalSelection': [{'key': r['key'], 'iteration': r['iteration'], 'sha256': r['sha256']} for r in finals],
           'notes': ['Both failed fence:v2 candidates and all exact calls are archived.', 'The final fence:v2 used only its canonical image as input.', 'Residual alpha noise and author viewer discrepancy are disclosed.', 'No previously accepted image or runtime file was modified.']}
write('handoff-receipt.json', receipt)
print(json.dumps({'handoffSha256': sha(ROOT / 'handoff-receipt.json'), 'freezeManifestSha256': receipt['manifestSha256'],
                  'rootReviewSha256': receipt['files']['root-review.json'], 'finalImages': 6, 'nativeGenerations': 8,
                  'supersededImages': 2, 'bytesFinalImages': receipt['bytesFinalImages'], 'bytesNativeGenerations': receipt['bytesNativeGenerations'],
                  'filesInFreeze': len(files)}, indent=2))
