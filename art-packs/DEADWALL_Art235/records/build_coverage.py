#!/usr/bin/env python3
"""Build the 99-proposal inventory only after all 30 selected PNGs exist."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
BASE='f3ba02a5b73a55120c02c21d5703902ea3e901d9'
PRIOR_COMMIT='5b2ce44c6904498b3d5572e8b1acfb84a0106b02'
PRIOR_PATH='art-packs/DEADWALL_Art232/coverage/coverage-art222-232.json'
PRIOR_SHA='4b78dde9619601992c7461836b20ee829de8a403a35e1afda963be9d543165ac'
REPO='darknigthmare/deadwall-last-enclosure'
WORKTREES={222:Path('/workspace/scratch/55dad3ac334d/deadwall-art-publication'),223:ROOT/'deadwall-art223',224:ROOT/'deadwall-art224',225:ROOT/'deadwall-art225',226:ROOT/'deadwall-art225',227:ROOT/'deadwall-art227',228:ROOT/'deadwall-art227',229:ROOT/'deadwall-art227',230:ROOT/'deadwall-art230',231:ROOT/'deadwall-art230',232:ROOT/'deadwall-art230'}
PUBLISHED={222:(27,'f76b216a9b98c1d4ebd5a6c53dc1fc07142c9114'),223:(28,'e16e501e3ad18ea5f1088ffd4ba8cbab38f0e149'),224:(29,'384f6ebaa5c573dfdedf5621a85f2a36be95b046'),225:(30,'bb14d13aae1619e79fab6b5c4b8d2329aff1c2c6'),226:(30,'bb14d13aae1619e79fab6b5c4b8d2329aff1c2c6'),227:(31,'5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf'),228:(31,'5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf'),229:(31,'5cc184d4cfeb6d62ddf4f5ae043c1dd6b852ffaf'),230:(33,PRIOR_COMMIT),231:(33,PRIOR_COMMIT),232:(33,PRIOR_COMMIT)}
def sha(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads(p.read_text())
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')

def main():
 raw=(ROOT/'deadwall-art230'/PRIOR_PATH).read_bytes()
 assert sha(raw)==PRIOR_SHA
 previous=json.loads(raw);assets=[];new=[];generation_counts={}
 assert len(previous['assets'])==69 and previous['finalSpriteCount']==69
 for row in previous['assets']:
  n=int(row['batch'][3:]);data=(WORKTREES[n]/row['repositoryAssetPath']).read_bytes()
  assert sha(data)==row['sha256'] and len(data)==row['bytes'],row['id']
  pr,head=PUBLISHED[n]
  assets.append({**row,'scopeGroup':'previous_exterior_proposal','publishedPullRequest':pr,'publishedRevision':head,'publicationUrl':f'https://github.com/{REPO}/pull/{pr}','byteVerificationThisReport':True})
 for n,count in [(233,13),(234,15),(235,2)]:
  prep=ROOT/f'art{n}-prep';selection=read(prep/'selection-and-prompts.json');targets={t['key']:t for t in selection['targets']};results=read(prep/'results.json');reviews=read(prep/'review.json');history=read(prep/'history-results.json')
  replay=read(prep/'root-canonical-replay.json');replayed={r['id']:r for r in replay['targets']}
  assert selection.get('sourceMain',selection.get('sourceBase'))==BASE and replay['sourceRevision']==BASE
  assert set(replayed)=={t['artId'] for t in targets.values()}
  assert len(results)==len(targets)==count and len({r['key'] for r in results})==count
  distinct={(r['key'],r['iteration'],sha(Path(r['generatedSourcePath']).read_bytes())) for r in history+results}
  generation_counts[str(n)]={'final':count,'generatedOutputs':len(distinct),'superseded':len(distinct)-count}
  for row in results:
   target=targets[row['key']];data=Path(row['generatedSourcePath']).read_bytes();digest=sha(data)
   assert row['artId']==f"prop:{row['key']}:v0" and reviews[row['key']]['sha256']==digest
   assert reviews[row['key']]['decision'] in ['accepted_source_art_proposal','accepted-source-art-proposal']
   canonical=target.get('canonicalReference',target.get('referenceFiles',[{}])[0]);canonical_path=Path(canonical['path'])
   if not canonical_path.is_absolute():canonical_path=prep/canonical_path
   canonical_sha=sha(canonical_path.read_bytes());receipt=replayed[row['artId']]
   assert canonical_sha==canonical['sha256']==receipt['canonicalSha256']
   assert receipt.get('replayedBytesIdentical') is True and receipt.get('nativeFootprintVerified') is True
   dims=target.get('dimensions',target.get('nativeSpec'));dims={k:dims[k] for k in ['w','h','heightM']}
   addition={'batch':f'Art{n}','id':row['artId'],'kind':row['key'],'name':row['label'],'scopeGroup':'new_typed_prop_proposal',
    'partition':'structural_caravan_v01_variant0' if n==235 else 'specialised_procedural205_variant0',
    'repositoryAssetPath':f"art-packs/DEADWALL_Art{n}/assets/art{n}/props/{target['file']}",'sha256':digest,'bytes':len(data),
    'sourceRevision':BASE,'sourceId':target.get('sourceId','codex-furnishing:'+row['key']),'sourcePlanId':target.get('sourcePlanId'),
    'dimensionsAuthorDesignMetres':dims,'existingRenderingRoute':target['route'],'sourceVariant':0,'iteration':row['iteration'],
    'byteVerificationSource':'native_imagegen_file_and_sha_bound_visual_review','sourceCanonicalReplayVerified':True,
    'existingProceduralRendererPresent':True,'analogousExistingImagesNotClaimedAbsent':True,
    'publishedRevision':None,'publicationStatusAtAssembly':'new_branch_prepared_for_draft_PR','metricFidelityCertified':False,'runtimeIntegrationPerformed':False}
   new.append(addition)
 assets+=new
 assert len(assets)==99 and len({a['id'] for a in assets})==99 and len({a['sha256'] for a in assets})==99
 total=sum(a['bytes'] for a in assets);new_bytes=sum(a['bytes'] for a in new);new_generated=sum(c['generatedOutputs'] for c in generation_counts.values())
 report={'project':'DEADWALL — Last Enclosure','reportDate':'2026-11-17','timezone':'Europe/Paris','sourceMainRevision':BASE,
  'previousCoverageReport':{'path':PRIOR_PATH,'sha256':PRIOR_SHA,'publishedRevision':PRIOR_COMMIT,'url':f'https://github.com/{REPO}/blob/{PRIOR_COMMIT}/{PRIOR_PATH}','unchanged':True},
  'finalSpriteCount':99,'previousFinalSpriteCount':69,'newFinalSpriteCount':30,'previousExteriorCount':69,'newTypedPropCount':30,
  'newProcedural205Families':28,'newStructuralCaravanKinds':2,'nativeBuildingTypesWithSourceProposal':62,'otherExteriorSitesOrVariants':7,
  'verifiedDirectNativeCodexAssociations':42,'nativeBuildingTypesWithUnresolvedCodexReferences':20,
  'previousSupersededOutputs':49,'previousGeneratedOutputs':118,'newGenerationCounts':generation_counts,
  'retainedGeneratedOutputCount':118+new_generated,'retainedSupersededOutputCount':49+new_generated-30,
  'allFinalByteInputsVerified':True,'totalFinalPngBytes':total,'newFinalPngBytes':new_bytes,
  'ownManifestSha256Included':False,'ownOutputCommitShaIncluded':False,'runtimeIntegrationPerformed':False,'gameplaySourcesModified':False,'historicalCodexAssociationsChanged':False,
  'metricProjectionCertified':False,'historicalArt221InventoryRecovered':False,
  'scopeLimit':'99 selected source proposals = 69 existing exterior proposals + 30 new typed props. This is not 99 building types, not all 4000 author plans, not runtime integration, and not every variant, rotation, animation, interior or historical Art221 output.',
  'knownBacklog':['Persistent fallen-survivor picture: missing drawFallen133 implementation; source rig/action references must be evaluated before proposing an asset.','Six D17 mechanisms already use shared Art159 pieces and Canvas; a dedicated full sprite would be enrichment, not a missing renderer.','Calibrate and register selected source proposals in a separately verified integration.'],
  'assets':assets}
 out=ROOT/'aggregate-art222-235';out.mkdir(exist_ok=True)
 (out/'prior-coverage-art222-232.json').write_bytes(raw);dump(out/'coverage-art222-235.json',report)
 lines=['# DEADWALL — inventaire des propositions source Art222 à Art235','', '**99 images finales distinctes : 69 extérieurs déjà publiés et 30 nouveaux objets dédiés.**','',
  '| Ensemble | Nombre | Portée |','|---|---:|---|','| Art222–232 | 69 | 62 types natifs de bâtiments et 7 autres sites/variantes |','| Art233 | 13 | Mobilier rural, de soins et de repos, variante 0 |','| Art234 | 15 | Machines et mobilier industriels, variante 0 |','| Art235 | 2 | Caravanes fermées des instances parcelle 1 de V01, variante 0 |','',
  f"Les 69 fichiers précédents ont été relus et comparés à leurs empreintes, sans modification. Leur [inventaire publié](https://github.com/{REPO}/blob/{PRIOR_COMMIT}/{PRIOR_PATH}) est conservé à l’identique dans `prior-coverage-art222-232.json`.",'',
  'Les 28 familles spécialisées possèdent déjà un rendu procedural205. Les deux caravanes possèdent un rendu structural205. Des silhouettes analogues se trouvent dans des atlas génériques : le manque traité ici est celui de bitmaps dédiés à ces types, et non une absence de tout rendu. Les cotes sont celles du code auteur. Les 30 références canoniques ont été rejouées indépendamment et comparées octet par octet.','',
  f"Les nouvelles générations conservent {new_generated} sorties natives, dont {new_generated-30} remplacées après revue. Le cumul archivé atteint {118+new_generated} sorties, dont {49+new_generated-30} remplacées. Les PNG finaux représentent {total:,} octets, dont {new_bytes:,} pour ce lot.",'',
  '**Aucune intégration moteur ni certification métrique ou pixel pour pixel 1:1.** Le périmètre ne couvre pas toutes les rotations, animations, pièces intérieures ou 4 000 fiches auteur. Les 20 associations Codex contradictoires des extérieurs natifs restent documentées et non réaffectées. Les plans agricoles et industriels ne sont pas présentés comme des sites de campagne nouvellement implantés.','',
  '## Nouveaux objets','', '| Pack | Identité | Objet | Dimensions auteur X × Y × H (m) |','|---|---|---|---:|']
 for a in new:
  d=a['dimensionsAuthorDesignMetres'];lines.append(f"| {a['batch']} | `{a['id']}` | {a['name']} | {d['w']} × {d['h']} × {d['heightM']} |")
 lines += ['', '## Suite identifiée', '', 'La dépouille persistante du survivant reste une cible distincte à préparer depuis son rig et ses actions. Les six mécanismes D17 disposent déjà d’un dessin composite ; de nouveaux sprites complets relèveraient d’un enrichissement. Le raccord au moteur exige encore le contrôle de l’échelle, de l’ancrage, des accès, des collisions et des états de service.', '']
 (out/'coverage-art222-235.md').write_text('\n'.join(lines));print(json.dumps({'finals':99,'newFinals':30,'newGeneratedOutputs':new_generated,'nativeFinalBytes':total,'coverageSha256':sha((out/'coverage-art222-235.json').read_bytes())}))

if __name__=='__main__':main()
