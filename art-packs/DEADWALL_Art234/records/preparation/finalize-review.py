from pathlib import Path
import hashlib,json,subprocess
from PIL import Image
import numpy as np

prep=Path(__file__).resolve().parent
repo=prep.parent/'deadwall-art233'
base='f3ba02a5b73a55120c02c21d5703902ea3e901d9'
def sha(b):return hashlib.sha256(b).hexdigest()
def read(name):return json.loads((prep/name).read_text())
def write(name,obj):(prep/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
selection=read('selection-and-prompts.json');final=read('results.json');history=read('history-results.json')
targets={t['key']:t for t in selection['targets']};alpha={(a['key'],a['iteration']):a for a in read('alpha-review.json')}
observations={
 'conveyor':'Vue de dessus sans fuite perspective. Sept rouleaux transversaux sont contenus entre les deux rails ; convoyeur vide et arrêté, aucune charge détachée.',
 'dosingUnit':'Trémie angulaire sur la partie gauche, sortie orientée vers le bas de la référence et carter brun à droite. Unité cohérente, sans contenant rapporté ni activité.',
 'foodMixer':'Cuve circulaire vide à gauche, colonne à droite et bras clair revenant au centre de la cuve. Plaque de base et pieds attachés, machine arrêtée.',
 'heatChamber':'Cadre isolant clair, trappe sombre centrale, deux barres parallèles et petit verrou à droite conservés. Aucun feu, voyant lumineux ou vapeur.',
 'metalSaw':'Grand disque sombre à gauche, guide droit à droite et guide brun au bord inférieur conservés. Scie immobile sans pièce, éclat ni outil détaché. Le halo suggéré par l’aperçu n’est pas un fond opaque : les mesures alpha distinguent les résidus très faibles du corps visible.',
 'lathe':'Mandrin et poupée fixe à gauche, axe et rails horizontaux, chariot avec volant près du bas à droite. Arrangement canonique conservé, aucune pièce usinée ni mouvement.',
 'millingMachine':'Colonne à gauche, traverse claire vers la droite, broche au centre droit et table rainurée en bas. Ensemble complet et inactif, sans copeaux en mouvement.',
 'assemblyStation':'Plateau de bois, petit logement carré à gauche, logement sombre à droite et trois supports attachés au bord inférieur. Aucun stock ou outil détaché ajouté.',
 'inspectionBench':'Boîtier rectangulaire à gauche et grand cadran circulaire à droite sur le même banc. Aiguille fixe, cadran sans texte ni chiffres, aucun éclairage actif.',
 'loom':'Cadre rectangulaire, fils clairs longitudinaux, traverses et rails latéraux conservés ; les brins proches des bords sont partiellement recouverts par les rails. Pièce diagonale au centre, tissu intégré, métier inactif.',
 'sewingStation':'Volant à gauche, bras de machine vers la droite et aiguille descendante près du centre droit ; pièce de tissu sous l’aiguille. Aucun accessoire détaché ni opérateur.',
 'cuttingTable':'Tapis intégré avec cinq guides verticaux et quatre guides horizontaux, bordure claire et bande inférieure simple. Aucune inscription ni lame ajoutée.',
 'materialMixer':'Cuve oxydée à gauche, quatre résidus ocres internes, colonne à droite et bras clair ramené au centre ; petite patte brune au bas à gauche. Aucun sac ou tas extérieur.',
 'formingPress':'Deux montants latéraux, large traverse supérieure, lit transversal inférieur et vérin centré dans une ouverture sombre. Espace de presse vide, machine arrêtée.',
 'curingRack':'Trois bandes de plateau parallèles et deux inserts ovales bruns par bande, six au total, entre les rails latéraux. Aucun plateau supplémentaire ni stock détaché.'
}
assert len(final)==len(targets)==15 and set(observations)==set(targets)
review={}
for row in final:
 key=row['key'];t=targets[key];a=alpha[(key,row['iteration'])];raw=Path(row['generatedSourcePath']).read_bytes()
 assert sha(raw)==a['sha256'] and Path(a['savedCopyPath']).read_bytes()==raw
 assert row['id']==row['artId']=='prop:'+key+':v0'
 if row['iteration']==1:assert row['prompt']==t['prompt'] and row['referenceImages']==t['referenceImages']
 refs=[]
 for path in row['referenceImages']:
  p=Path(path);refs.append({'path':str(p),'sha256':sha(p.read_bytes())})
 canonical=Path(t['referenceImages'][0]);plane=np.array(Image.open(canonical).getchannel('A'));yy,xx=np.where(plane>=128)
 canonical_ratio=float((xx.max()-xx.min()+1)/(yy.max()-yy.min()+1));result_ratio=a['alpha']['foregroundRatio128'];d=t['dimensions'];author_ratio=d['w']/d['h']
 review[key]={
  'artId':row['artId'],'sha256':a['sha256'],'generatedSourcePath':row['generatedSourcePath'],'savedCopyPath':a['savedCopyPath'],'iteration':row['iteration'],
  'decision':'accepted_source_art_proposal','observation':observations[key],
  'reviewer':'publish_missing','reviewedOn':'2026-11-17','visualInspectionPerformed':True,'canonicalReferenceViewedBeforeGeneration':True,'materialAtlasViewedBeforeGeneration':True,
  'actualReferences':refs,'nativeDimensions':a['dimensions'],'nativeBytes':a['bytes'],'rgbaVerified':a['mode']=='RGBA','transparentPixels':a['alpha']['zeroPixels'],
  'borderAlphaMaximum':a['alpha']['edgeMaximum'],'lowAlphaPixels1to15':a['alpha']['alpha1to15'],
  'alphaObservation':'Pixels totalement transparents présents ; quelques résidus très faibles peuvent atteindre le bord (alpha maximal 1). Le corps visible reste entouré de marge. Aucun fond opaque identifié. PNG conservé sans nettoyage ni réencodage.',
  'proportionEvidence':{'authorFootprintRatio':round(author_ratio,6),'canonicalInkBoundsRatioAlpha128':round(canonical_ratio,6),'outputInkBoundsRatioAlpha128':result_ratio,'relativeDifferenceFromCanonicalInkPercent':round(100*(result_ratio/canonical_ratio-1),3),
   'interpretation':'Les retraits des dessins canoniques font différer le rapport de leur encre de celui de l’emprise w/h. Ces mesures décrivent la silhouette visible ; elles ne définissent pas une échelle en mètres et ne certifient pas une fidélité 1:1.'},
  'imageEditingPerformed':False,'runtimeIntegrationPerformed':False,'metricFidelityCertified':False,
  'limitations':['Les dimensions de CATALOGUE sont des choix auteur.','La proposition conserve l’organisation visible sans certifier une superposition pixel pour pixel.','Ancrage, échelle, clipping et états réels nécessitent une intégration séparée.']
 }
write('review.json',review)
verified=[]
for src in selection['sourceFiles']:
 raw=(prep/src['path']).read_bytes();native=subprocess.check_output(['git','-C',str(repo),'show',base+':'+src['repositoryPath']])
 git_blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
 assert raw==native and sha(raw)==src['sha256'] and git_blob==src['gitBlob'] and len(raw)==src['bytes'] and src['revision']==base
 verified.append({**src,'verifiedAgainstGitShow':True,'currentCheckoutBytesAlsoEqual':(repo/src['repositoryPath']).read_bytes()==raw})
write('source-files-verification.json',{'revision':base,'sources':verified,'allExactGitBytes':True,'renderScriptSha256':sha((prep/'prepare.cjs').read_bytes()),'canonicalRenderReceiptSha256':sha((prep/'canonical-render-receipt.json').read_bytes()),'runtimeCodeModified':False})
write('review-summary.json',{'pack':'Art234','finalCount':len(final),'generationCount':len(history),'supersededCount':len(history)-len(final),'totalFinalNativePngBytes':sum(v['nativeBytes'] for v in review.values()),'reviewSha256':sha((prep/'review.json').read_bytes()),'resultsSha256':sha((prep/'results.json').read_bytes()),'alphaReviewSha256':sha((prep/'alpha-review.json').read_bytes()),'allFinalsRgba':True,'allFinalBorderAlphaMaximum':max(r['borderAlphaMaximum'] for r in review.values()),'allOriginalsBytePreserved':True,'runtimeIntegrationPerformed':False,'metricFidelityCertified':False,'independentReviewSeparate':'independent-review-art225.json'})
print(json.dumps({'reviewed':len(review),'finalPngBytes':sum(v['nativeBytes'] for v in review.values()),'reviewSha256':sha((prep/'review.json').read_bytes()),'sourceFilesVerified':len(verified)}))
