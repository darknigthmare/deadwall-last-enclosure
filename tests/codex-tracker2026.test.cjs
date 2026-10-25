'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {validate,load}=require('../scripts/validate-codex-tracker2026.cjs');
const root=path.resolve(__dirname,'..');
const {currentData}=require('../scripts/build-codex-tracker2026.cjs');
const snapshot=currentData(root),clean=()=>JSON.parse(JSON.stringify(snapshot));
test('les JSON publiés relisent leur couverture G11 et refusent une preuve orpheline',()=>{
 const fs=require('node:fs'),os=require('node:os'),folder=fs.mkdtempSync(path.join(os.tmpdir(),'deadwall-tracker-load205-'));
 try{
  const target=path.join(folder,'docs/codex/suivi-monde2026');fs.mkdirSync(target,{recursive:true});
  for(const[key,name]of [['catalogue','catalogue-existant.json'],['typologies','typologies-cibles.json'],['variants','variantes-a-concevoir.json'],['tasks','chantiers.json'],['campaign205','campagne-g11.json']])fs.writeFileSync(path.join(target,name),JSON.stringify(snapshot[key]));
  const loaded=load(folder);assert.deepEqual(loaded.campaign205,snapshot.campaign205);assert.equal(validate(loaded).campaignEligibleVariants,200);
  fs.unlinkSync(path.join(target,'campagne-g11.json'));assert.throws(()=>validate(load(folder)),/orphelines/);
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
test('catalogue complet et 80 × 50 objectifs, sans prétention de jouabilité',()=>{const r=validate(clean());assert.equal(r.programmes,4000);assert.equal(r.parents,2000);assert.equal(r.spaces,12060);assert.equal(r.objectReferences,13539);assert.equal(r.variantTargets,4000);assert.equal(r.variantsDesigned,0);assert.equal(r.variantsInspectable,4000);assert.equal(r.variantsPlayable,0);assert.equal(r.validatedTasks,3);const closed=clean().tasks.filter(t=>t.status==='Validé');assert.deepEqual(closed.map(t=>t.id).sort(),['EXT-MONDE-T060/dimensions','EXT-MONDE-T065/dimensions','EXT-MONDE-T066/dimensions']);assert.ok(closed.every(t=>t.evidence.includes('FONDATIONS_METRIQUES_2026.md#dimensions-auteur-validees')));assert.equal(clean().tasks.filter(t=>t.status==='En cours').length,405);assert.equal(clean().tasks.filter(t=>t.status==='À faire').length,392);assert.equal(r.campaignEligibleVariants,200);assert.ok(r.campaignObservedSites>0);assert.equal(r.published,false);});
test('la validation ne modifie pas ses entrées',()=>{const d=clean(),before=JSON.stringify(d);validate(d);assert.equal(JSON.stringify(d),before);});
test('parent existant manquant refusé',()=>{const d=clean();d.catalogue.programmes[0].parent='DW-9999';assert.throws(()=>validate(d),/parent absent/);});
test('identifiant de programme dupliqué refusé',()=>{const d=clean();d.catalogue.programmes[1].id=d.catalogue.programmes[0].id;assert.throws(()=>validate(d),/doublon/);});
test('espace orphelin refusé',()=>{const d=clean();d.catalogue.rooms[0].parent='DW-9999';assert.throws(()=>validate(d),/espace orphelin/);});
test('dimensions négatives refusées, valeurs non renseignées conservées',()=>{const d=clean();d.catalogue.props[0].size.longueur=-1;assert.throws(()=>validate(d),/dimension objet/);assert.ok(clean().catalogue.props.some(p=>p.size===null));});
test('fourchette de quantité inversée refusée',()=>{const d=clean();d.catalogue.props[0].quantity=[3,1];assert.throws(()=>validate(d),/quantité/);});
test('numéro de variante répété refusé',()=>{const d=clean();d.variants[1].number=1;assert.throws(()=>validate(d),/numéro variante/);});
test('une cible de variante ne peut pas être annoncée jouable',()=>{const d=clean();d.variants[0].playable=true;assert.throws(()=>validate(d),/jouabilité sans preuve/);});
test('une tâche validée doit citer sa preuve',()=>{const d=clean();d.tasks[0].status='Validé';d.tasks[0].evidence='';assert.throws(()=>validate(d),/validation sans preuve/);});
test('chaque type doit conserver dix étapes distinctes',()=>{const d=clean();d.tasks[1].stage=d.tasks[0].stage;assert.throws(()=>validate(d),/étapes/);});
test('une source doit avoir une empreinte',()=>{const d=clean();d.catalogue.programmes[0].sourceSha256='inconnue';assert.throws(()=>validate(d),/provenance/);});
test('une inspection partielle ne certifie ni architecture complète ni implantation',()=>{for(const field of ['architecture','spawnWeight','playable','inspection']){const d=clean(),v=d.variants.find(v=>v.status==='Inspection physique');v[field]=field==='architecture'?{}:field==='spawnWeight'?1:field==='playable'?true:null;assert.throws(()=>validate(d),/inspection|jouabilité/);}});

test('les preuves G11 ne deviennent ni 200 sites par graine ni une validation globale',()=>{
 const d=clean();assert.equal(d.campaign205.records.length,200);assert.equal(d.campaign205.summary.guaranteedSitesPerSeed,0);
 assert.ok(d.variants.filter(v=>v.campaign205).every(v=>v.playable===false&&v.architecture===null&&v.spawnWeight===null));
 for(const change of [x=>{x.campaign205.summary.observedSites++;},x=>{x.variants.find(v=>v.campaign205).campaign205.eligible=false;},x=>{x.tasks.find(t=>t.id==='EXT-MONDE-T045/seed').status='Validé';}]){
  const changed=clean();change(changed);assert.throws(()=>validate(changed),/campagne|variante|totaux/);
 }
});
