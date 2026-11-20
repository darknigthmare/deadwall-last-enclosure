from pathlib import Path
import json, hashlib, subprocess

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent/'deadwall-art236'
BASE = '12e0aa4aa77b9901bd53eb7a8771382a5f753593'
PUBLISHED_PARENT = '6ebd6707251e675a5b75ded23e91dd28339dfe38'
def sha(data): return hashlib.sha256(data).hexdigest()
def load(name): return json.loads((ROOT/name).read_text())
def save(name, value): (ROOT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

selection, results, history, alpha = (load(f) for f in ('selection-and-prompts.json','results.json','history-results.json','alpha-review.json'))
assert len(results) == 4 and len(history) == 7
assert len({row['key'] for row in results}) == 4
calls = load('generation-prompts.json')
assert len(calls) == len(history)
for row in history:
    data = Path(row['generatedSourcePath']).read_bytes()
    assert sha(data) == row['sha256'] and len(data) == row['bytes']
    assert data == Path(row['originalGeneratedSourcePath']).read_bytes()
    call = next(c for c in calls if (c['key'],c['iteration']) == (row['key'],row['iteration']))
    assert call['arguments']['prompt'] == row['prompt']
    assert call['arguments']['referenced_image_paths'] == row['referenceImages']
    assert call['arguments']['transparent_background'] is True
    for reference in row['referenceFiles']:
        assert sha(Path(reference['path']).read_bytes()) == reference['sha256']
    assert row['selected'] == any((r['key'],r['iteration'],r['sha256']) == (row['key'],row['iteration'],row['sha256']) for r in results)
for source in selection['sourceFiles']:
    data = (ROOT/source['preparedPath']).read_bytes()
    assert sha(data) == source['sha256'] and len(data) == source['bytes']
    for revision in (BASE, PUBLISHED_PARENT):
        assert data == subprocess.check_output(['git','-C',str(REPO),'show',revision+':'+source['repositoryPath']])
    assert data == (REPO/source['repositoryPath']).read_bytes()

notes = {
 'touring-caravan:v1': 'Canonique et sortie comparés : coque fermée et inoccupée en vue zénithale, axe long vertical et attelage vers le haut. Quatre roues visibles à deux positions espacées. Deux panneaux de toit fermés et grand cadre central avec deux lignes claires intérieures conservés ; palette froide crème et gris bleuté. Aucun intérieur ou signe de fonctionnement.',
 'touring-caravan:v2': 'Canonique et sortie comparés : coque fermée en vue zénithale, quatre roues espacées, attelage complet. Un panneau fermé central, une bande métallique longitudinale à gauche remontant au-dessus du panneau et un patch de bois rectangulaire avec diagonale en partie basse droite. Les trois éléments distinguent la variante 2 de la v0 et de la v1 ; aucune charge mobile ajoutée.',
 'abandoned-caravan:v1': 'Itération 2 retenue après correction ciblée : les anciennes barres en zigzag sont devenues des fissures fines de surface et les pièces brunes sont devenues des plages irrégulières de corrosion sur le toit. Les deux panneaux fermés, le cadre central, les quatre roues et l’attelage restent lisibles, dans la palette froide du canonique. La coque évacuée reste complète et fermée.',
 'abandoned-caravan:v2': 'Itération 3 retenue : corrosion et fissures sont des marques superficielles, pas des accessoires rapportés. La bande métallique gauche remonte désormais nettement au-dessus du panneau central, selon le canonique. Le patch de bois inférieur droit et sa diagonale restent présents, ainsi que les quatre roues espacées et l’attelage haut. Palette gris olive ; aucune ouverture ou activité ajoutée.'
}
limitations = [
 'Proposition source uniquement : aucune intégration runtime, calibration de pivot ou échelle raster réalisée.',
 'Les cotes 2,4 × 6,2 m et hauteur 2,8 m sont des enveloppes auteur ; aucune certification métrique 1:1 ou égalité pixel à pixel.',
 'Les trois variantes du peintre sont distinctes de la variante V01 du plan résidentiel. Ces quatre images ajoutent des variantes de deux familles existantes, pas de nouveaux types.',
 'Les marges natives au seuil alpha≥8 mesurent au moins 10,7 % verticalement, malgré la demande initiale 12 %. Les silhouettes et pièces ne sont pas coupées. Des pixels d’alpha 1/255 touchent certains bords ; aucun nettoyage, recadrage ni réencodage local.',
 'Le relief subtil, le grain et les reflets sont des interprétations de matière. Les fissures et la rouille des caravanes abandonnées décrivent une usure décorative sans nouvelle collision ni état sauvegardé.'
]
reviews={}
for row in results:
    a=next(x for x in alpha if (x['key'],x['iteration'],x['sha256']) == (row['key'],row['iteration'],row['sha256']))
    t=next(t for t in selection['targets'] if t['key']==row['key'])
    reviews[row['key']]={'decision':'accepted_source_art_proposal','sha256':row['sha256'],'iteration':row['iteration'],'reviewedBy':'prepare_main236 — inspection visuelle des canoniques, des références Art235 et des sorties natives','reviewedOn':'2026-11-17','timezone':'Europe/Paris','kind':row['kind'],'id':row['id'],'artId':row['artId'],'canonicalVariant':row['canonicalVariant'],'painterVariant':row['painterVariant'],'sourcePlanVariant':row['sourcePlanVariant'],'sourceId':t['sourceId'],'observation':notes[row['key']],'alphaAudit':a,'limitations':limitations,'canonicalReplayFile':'root-canonical-replay.json','notRuntimeIntegrated':True,'pixelEditingPerformed':False,'rootApprovalRequiredBeforeAssembly':True}
save('review.json',reviews)
rejected = {
 ('abandoned-caravan:v1',1): 'Refus visuel auteur : les marques canoniques de fissure et de rouille sont interprétées comme barres en relief et morceaux rapportés.',
 ('abandoned-caravan:v2',1): 'Refus visuel auteur : certaines plages de rouille sont matérialisées en plaques ; partie supérieure du renfort métallique trop courte.',
 ('abandoned-caravan:v2',2): 'Correction de surface réussie, puis non-retenue : le renfort longitudinal gauche doit encore remonter au-dessus du panneau central.'
}
save('iteration-review.json',[{'key':r['key'],'iteration':r['iteration'],'sha256':r['sha256'],'decision':'accepted_source_art_proposal' if r['selected'] else 'superseded_not_selected','observation':notes[r['key']] if r['selected'] else rejected[(r['key'],r['iteration'])],'nativeOutputRetained':True} for r in history])
save('source-verification-final.json',{'sourceMain':BASE,'publishedParent':PUBLISHED_PARENT,'sourceFilesVerified':len(selection['sourceFiles']),'allSourceCopiesMatchMainAndPublishedParentAndCheckout':True,'nativeGeneratedOutputs':len(history),'selectedFinals':len(results),'allToolArgumentsMatchVerbatimHistory':True,'allGenerationReferenceHashesVerified':True,'allRawOutputCopiesMatchOriginalNativeFiles':True,'imagePixelEditingPerformed':False})
entries=[]
for file in sorted(ROOT.rglob('*')):
    if file.is_file() and file.name not in {'freeze-manifest.json','delivery-receipt.json','root-review.json','root-alpha-audit.json'} and '__pycache__' not in file.parts:
        data=file.read_bytes();entries.append({'path':str(file.relative_to(ROOT)),'sha256':sha(data),'bytes':len(data)})
save('freeze-manifest.json',{'pack':'Art241','sourceMain':BASE,'publishedParent':PUBLISHED_PARENT,'authorFiles':entries,'fileCount':len(entries),'totalBytes':sum(e['bytes'] for e in entries),'finalCount':len(results),'nativeOutputCount':len(history),'retainedNonfinalOutputCount':len(history)-len(results),'rootReviewMayBeAddedSeparately':True})
save('delivery-receipt.json',{'pack':'Art241','status':'author-frozen-awaiting-root-review','sourceMain':BASE,'publishedParent':PUBLISHED_PARENT,'freezeManifestSha256':sha((ROOT/'freeze-manifest.json').read_bytes()),'fileCount':len(entries),'totalBytes':sum(e['bytes'] for e in entries),'finalCount':len(results),'nativeOutputCount':len(history),'retainedNonfinalOutputCount':len(history)-len(results),'finals':[{'key':r['key'],'iteration':r['iteration'],'file':str(Path(r['generatedSourcePath']).relative_to(ROOT)),'sha256':r['sha256'],'bytes':r['bytes']} for r in results]})
print(json.dumps({'files':len(entries),'bytes':sum(e['bytes'] for e in entries),'finals':len(results),'outputs':len(history),'deliveryReceiptSha256':sha((ROOT/'delivery-receipt.json').read_bytes())}))
