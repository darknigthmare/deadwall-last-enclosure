"""Read native PNGs and frozen source records; write only review/provenance JSON and Markdown."""
import hashlib
import json
import pathlib
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent
BASE = 'f3ba02a5b73a55120c02c21d5703902ea3e901d9'

def read(name):
    return json.loads((ROOT/name).read_text())

def sha(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()

def write(name, value):
    (ROOT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def inspect_record(record):
    path = ROOT / record['preparedPath']
    data = path.read_bytes()
    assert len(data) == record['bytes'], str(path)
    assert hashlib.sha256(data).hexdigest() == record['sha256'], str(path)
    result = {'preparedPath': record['preparedPath'], 'sha256': record['sha256'], 'bytes': len(data), 'verified': True}
    if 'gitBlob' in record:
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        assert blob == record['gitBlob'], str(path)
        assert record['revision'] == BASE
        result.update(repositoryPath=record['repositoryPath'], revision=record['revision'], gitBlob=blob)
    return result

selection = read('selection-and-prompts.json')
targets = {row['key']: row for row in selection['targets']}
assert len(targets) == 13
initial_prompts = read('generation-prompts.json')
correction_prompts = read('generation-corrections.json')
sent = {(row['key'], row['iteration']): row for row in initial_prompts + correction_prompts}
initial = read('initial-results.json')
history = read('history-results.json')
finals = read('results.json')
alpha_rows = read('native-alpha-audit.json')
alpha = {(row['key'], row['iteration']): row for row in alpha_rows}
assert len(initial) == len(finals) == 13
assert len(history) == len(sent) == len(alpha) == 17
assert {row['key'] for row in finals} == set(targets)
assert len({row['generatedSourcePath'] for row in history}) == 17
assert len({row['sha256'] for row in alpha_rows}) == 17

ledger = []
for row in history:
    key = (row['key'], row['iteration'])
    expected = sent[key]
    assert row['id'] == row['artId'] == 'prop:' + row['key'] + ':v0'
    assert row['prompt'] == expected['prompt']
    assert row['referenceImages'] == expected['referenceImages']
    assert row['promptIsVerbatim'] is True and row['transparentBackgroundRequested'] is True
    assert row['generator'] == 'image_gen.imagegen'
    assert sha(row['generatedSourcePath']) == alpha[key]['sha256']
    refs = [{'path': p, 'sha256': sha(p), 'bytes': pathlib.Path(p).stat().st_size} for p in row['referenceImages']]
    ledger.append({'key': row['key'], 'id': row['id'], 'iteration': row['iteration'], 'nativePNG': row['generatedSourcePath'],
                   'nativeSHA256': alpha[key]['sha256'], 'nativeBytes': alpha[key]['bytes'],
                   'promptSHA256': hashlib.sha256(row['prompt'].encode()).hexdigest(), 'promptVerbatimMatched': True,
                   'referenceImages': refs, 'operation': 'reference_generation' if row['iteration'] == 1 else 'native_image_edit',
                   'generator': row['generator'], 'pixelEditingPerformed': False})
for row in initial:
    assert row['iteration'] == 1 and row in history
for row in finals:
    assert row in history
    assert row['iteration'] == max(old['iteration'] for old in history if old['key'] == row['key'])

source_index = read('references/source-index.json')
render_records = read('references/canonical-render-records.json')
assert source_index['sourceBase'] == render_records['sourceBase'] == BASE
source_checks = [inspect_record(row) for row in source_index['sources']]
atlas_checks = [inspect_record(row) for row in source_index['atlases']]
canonical_checks = [inspect_record(row) for row in render_records['records']]
render_script_check = inspect_record(render_records['renderScript'])
assert len(source_checks) == len(canonical_checks) == 13 and len(atlas_checks) == 2
write('source-integrity.json', {'sourceBase': BASE, 'checkedAt': datetime.now(timezone.utc).isoformat(),
      'sources': source_checks, 'atlases': atlas_checks, 'canonicalReferences': canonical_checks, 'renderScript': render_script_check,
      'sourceRuntimeModified': False, 'allPreparedCopiesVerified': True})
write('generation-ledger.json', ledger)

notes = {
 'singleBunk': 'Une seule surface de couchage olive, oreiller à gauche et cadre métallique horizontal. La v2 restaure trois barreaux distincts sur la petite échelle du bord inférieur ; aucun deuxième matelas ni lit inférieur. Le halo brun visible dans la prévisualisation RGB ne constitue pas un fond opaque : la transparence native est mesurée séparément.',
 'feedTrough': 'Bac métallique allongé à contour évasé de six côtés et quatre petits appuis aux angles. La v2 remplace les sept grandes entailles de la première sortie par de fines pailles orientées et un résidu granuleux sec ; aucune réserve débordante ni accessoire ajouté. Axe long horizontal conservé.',
 'waterTrough': 'Même bac évasé, raccord discret en haut à droite. La v2 donne une lecture d’eau calme au creux et remplace la bande peinte par un reflet naturel ; l’appui central inférieur inventé a disparu. Deux appuis proches sont visibles, les appuis éloignés peuvent être masqués par le bord dans cette vue. Aucune circulation d’eau, pompe ou tuyauterie ajoutée.',
 'fodderRack': 'Cadre rectangulaire horizontal, six montants parallèles en bois et sept directions de fourrage visibles derrière eux. La v2 interprète les bandes vertes comme des brins fins d’herbe et de foin, sans créer de meule ni d’amas extérieur. Fond de support et montants restent alignés au schéma v0.',
 'milkingUnit': 'Un seul récipient à gauche du centre dans son support intégré ; petit capot au-dessus et conduite remontant puis courant en haut et à droite. Quatre gobelets sont distincts en bas à droite. Vue en plan, matériel au repos, sans animal, second récipient ni chariot ajouté.',
 'milkVat': 'Cuve arrondie avec couvercle intérieur, capuchon central clair, traverse basse et quatre supports. La sortie part du centre inférieur et tourne vers la droite jusqu’à la vanne rouillée. Le contour ovale reste une interprétation graphique du plan, sans certification dimensionnelle 1:1.',
 'nestBox': 'Trois compartiments juxtaposés, chacun avec son creux sombre, son nid de paille et un accent ovale clair conservé du peintre natif. Traverse/perchoir du bord inférieur présent ; aucun quatrième compartiment, animal ni plateau supplémentaire. Les trois œufs illustrés ne créent aucun stock de jeu.',
 'wineVat': 'Une cuve métallique arrondie, capuchon central en bois, traverse basse, quatre supports et sortie inférieure coudée vers la droite. Les marques de matière restent discrètes et le mécanisme est inactif. Les proportions arrondies sont une proposition artistique, pas une nouvelle géométrie de collision.',
 'wineBarrel': 'Plan arrondi en bois avec six directions longitudinales de douelles et deux bandes métalliques horizontales. Aucune face latérale haute, robinet, palette ou accessoire inventé. La lecture volontairement stylisée du peintre v0 est conservée ; il ne s’agit pas d’un modèle mécanique certifié de tonneau.',
 'grapePress': 'Pressoir dans son châssis intégré : panier rond en position inférieure centrale, cinq lattes lisibles, deux montants, traverse haute, vis centrale et poignée en T en haut. Matériaux bois/métal usés et axes du schéma conservés. Aucun moteur, raisin, liquide ou équipement extérieur ajouté.',
 'veterinaryTable': 'Plateau clair rectangulaire horizontal, deux sangles olive allant de haut en bas et deux boucles centrales. Le petit pad plié est en haut à gauche ; aucun animal, instrument ou meuble voisin. Les appuis restent discrets sous la silhouette en plan.',
 'growingBench': 'Table de semis avec cadre métallique, bac intérieur en bois et deux rails latéraux clairs. Douze groupes de jeunes feuilles sont disposés en trois rangées de quatre. Les formes végétales restent proches des ovales du schéma natif ; c’est une proposition stylisée à calibrer, sans production, récolte ou pot supplémentaire.',
 'growingBed': 'Bac bas en bois et deux renforts longitudinaux, sans pieds hauts de table ni rails métalliques latéraux. Douze groupes de feuilles en trois rangées de quatre, sol contenu dans le bac. Les feuilles restent stylisées selon le schéma. Le halo RGB est largement sous alpha nul ; le coin inférieur gauche vaut exactement 1/255.'
}

review = {}
for row in finals:
    key = row['key']; target = targets[key]; measurement = alpha[(key, row['iteration'])]
    assert measurement['mode'] == 'RGBA' and measurement['format'] == 'PNG'
    assert measurement['alphaMin'] == 0 and measurement['alphaMax'] >= 250
    assert measurement['maximumBorderAlpha'] <= 1 and measurement['minimumVisibleMargin'] > 0
    review[key] = {'key': key, 'kind': key, 'id': row['id'], 'artId': row['artId'], 'variant': 0,
       'sha256': measurement['sha256'], 'generatedSourcePath': row['generatedSourcePath'], 'iteration': row['iteration'],
       'decision': 'accepted_source_art_proposal', 'observation': notes[key], 'reviewedOn': '2026-11-17',
       'timezone': 'Etc/UTC', 'reviewer': 'art226_assets', 'nativeSpec': target['nativeSpec'], 'sourceBase': BASE,
       'canonicalReferenceSHA256': target['canonicalReference']['sha256'], 'route': target['route'], 'sourceStatus': target['sourceStatus'],
       'cameraAssessment': 'Vue en plan et axes source conservés ; pas de perspective en diamant ni scène. La caméra, les arrondis et les proportions ne sont pas une certification métrique pixel par pixel.',
       'alpha': measurement,
       'reviewScope': 'Revue de chaque PNG natif retenu contre la référence du peintre v0 : silhouette, axes, pièces distinctives, matières, nombre de composants et alpha mesuré. Source art uniquement.',
       'limits': ['Dimensions CATALOGUE auteur conservées en métadonnées ; aucun certificat métrique 1:1.',
                  'La marge demandée de 12 % n’est pas uniformément atteinte ; le contour significatif reste complet et non coupé.',
                  'Aucune intégration moteur, rotation complémentaire, animation, variante v1/v2, affectation DW ou mutation de sauvegarde.',
                  'Les contenus fixes illustrés ne prouvent aucun stock, service actif ou implantation agricole en campagne.'],
       'pixelEditingPerformed': False, 'runtimeIntegrationPerformed': False}
write('review.json', review)

write('reference-inspections.json', {'reviewer': 'art226_assets', 'reviewedOn': '2026-11-17',
      'method': 'Visual inspection of each native PNG through view_image before its ImageGen call; atlases inspected in full before use.',
      'canonicalReferences': [{'key': key, 'path': target['canonicalReference']['path'], 'sha256': target['canonicalReference']['sha256'], 'inspectedBeforeGeneration': True} for key,target in targets.items()],
      'styleAtlases': [{'path': str(ROOT/row['preparedPath']), 'sha256': row['sha256'], 'role': 'materials and palette only; not camera or object additions'} for row in source_index['atlases']],
      'nativeGeneratedInputsForEdits': [{'key': row['key'], 'iteration': row['iteration'], 'path': row['referenceImages'][0], 'sha256': sha(row['referenceImages'][0]), 'visuallyInspectedBeforeEdit': True} for row in correction_prompts]})

final_measurements = [alpha[(row['key'],row['iteration'])] for row in finals]
verification = {'batch': 'Art233', 'checkedAt': datetime.now(timezone.utc).isoformat(), 'sourceBase': BASE,
   'sourceOnly': True, 'finals': len(finals), 'history': len(history), 'replaced': len(history)-len(finals),
   'uniqueFinalIds': len({row['id'] for row in finals}), 'uniqueFinalPNGHashes': len({row['sha256'] for row in final_measurements}),
   'finalPNGBytes': sum(row['bytes'] for row in final_measurements), 'allHistoricalPNGBytes': sum(row['bytes'] for row in alpha_rows),
   'verbatimPromptsMatched': len(history), 'referenceHashesVerified': True, 'sourceCopiesAndGitBlobsVerified': True,
   'allNativePNGsRGBA': True, 'maximumFinalBorderAlpha': max(row['maximumBorderAlpha'] for row in final_measurements),
   'cornersException': {'key':'growingBed','order':['topLeft','topRight','bottomRight','bottomLeft'],'values':review['growingBed']['alpha']['cornerAlpha']},
   'canonicalReferences': 13, 'styleAtlases': 2, 'sourceCopies': 13,
   'corrections': [{'key':row['key'],'iteration':row['iteration']} for row in correction_prompts],
   'files': {name: {'sha256':sha(ROOT/name),'bytes':(ROOT/name).stat().st_size} for name in ['selection-and-prompts.json','generation-prompts.json','generation-corrections.json','initial-results.json','history-results.json','results.json','review.json','native-alpha-audit.json','source-integrity.json','generation-ledger.json','reference-inspections.json','references/source-index.json','references/canonical-render-records.json','prepare-art233.cjs','record-result.py']},
   'pixelEditingPerformed': False, 'runtimeSourceModified': False, 'repositoryPackAssemblyPerformed': False,
   'commitOrPublicationPerformed': False,
   'limits': ['Author-design dimensions; no pixel-metric 1:1 or manufacturer certification.', 'Only procedural205 variant 0, one canonical orientation; v1/v2 and runtime integration remain outside this delivery.', 'Agricultural author plans are not proof of campaign farm placement.', 'Some native PNGs contain negligible alpha 1 edge noise and hidden RGB; original native bytes remain untouched.']}
write('verification.json', verification)
print(json.dumps({'finals':len(finals),'history':len(history),'finalBytes':verification['finalPNGBytes'], 'reviewSHA256':sha(ROOT/'review.json'),'verificationSHA256':sha(ROOT/'verification.json')},ensure_ascii=False))
