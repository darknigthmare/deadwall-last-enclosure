'use strict';
const assert=require('node:assert/strict');
const R=require('../src/codex3000-runtime.js'),C=require('../src/codex-coverage167.js'),X=require('../src/codex-context160.js');
const groupFor=r=>r.independent?'independent':'historical';
const empty=()=>({historical:{programmes:0,catalogueCompatible:0,compatible:0,floors:0},independent:{programmes:0,catalogueCompatible:0,compatible:0,floors:0}});
function createAuditScope(argv=process.argv.slice(2),{includeContext=false,allowAllModels=false}={}){
 const ids=[],flags=new Set();
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--programme'){
   const id=argv[++i];if(!/^DW-\d{4}$/.test(id||'')||!R.get(id))throw Error('Programme connu requis après --programme.');
   if(ids.includes(id))throw Error('Programme demandé deux fois : '+id);ids.push(id);
  }else if(argv[i]==='--all-models'&&allowAllModels){
   if(flags.has(argv[i]))throw Error('Option répétée : '+argv[i]);flags.add(argv[i]);
  }else throw Error('Option inconnue : '+argv[i]);
 }
 const selected=ids.length?ids.map(id=>R.get(id)):[...R.records],capabilities=new Map(),levels=new Map();
 for(const r of R.records){
  const contextual=X.has(r.id),available=C.source(r.id).contextCompatible;
  capabilities.set(r.id,{available,eligible:available&&(includeContext||!contextual),contextual});
  levels.set(r.id,contextual?[...X.get(r.id).levels]:[...R.template(r.id).levels]);
 }
 const describe=records=>{const groups=empty();for(const r of records){const g=groups[groupFor(r)],c=capabilities.get(r.id);g.programmes++;if(c.available)g.catalogueCompatible++;if(c.eligible){g.compatible++;g.floors+=levels.get(r.id).length;}}return groups;};
 const expectedGroups=describe(selected),auditedGroups=empty(),catalogueGroups=describe(R.records),visited=new Set(),floorKeys=new Set(),selectedIds=new Set(selected.map(r=>r.id));
 const total=groups=>Object.fromEntries(['programmes','catalogueCompatible','compatible','floors'].map(k=>[k,Object.values(groups).reduce((n,g)=>n+g[k],0)]));
 const expected=total(expectedGroups);
 function visit(rec){
  assert.ok(selectedIds.has(rec.id),'Programme hors sélection');assert.ok(!visited.has(rec.id),'Programme audité deux fois');visited.add(rec.id);
  const g=auditedGroups[groupFor(rec)],c=capabilities.get(rec.id);g.programmes++;if(c.available)g.catalogueCompatible++;if(c.eligible)g.compatible++;return c.eligible;
 }
 function floor(rec,z){
  assert.ok(visited.has(rec.id)&&capabilities.get(rec.id).eligible,'Étage sans programme éligible visité');assert.ok(levels.get(rec.id).includes(z),'Étage absent du vrai modèle');
  const key=rec.id+':'+z;assert.ok(!floorKeys.has(key),'Étage audité deux fois');floorKeys.add(key);auditedGroups[groupFor(rec)].floors++;
 }
 function finish(actual,{sampledModels=false}={}){
  const observed=total(auditedGroups);
  assert.deepEqual({programmes:actual.programmes,compatible:actual.compatible,floors:actual.floors},{programmes:observed.programmes,compatible:observed.compatible,floors:observed.floors},'Compteurs du rapport divergents des modèles parcourus');
  for(const kind of ['historical','independent'])for(const k of ['programmes','catalogueCompatible','compatible','floors']){
   if(k==='floors'&&sampledModels)assert.ok(auditedGroups[kind][k]<=expectedGroups[kind][k]);
   else assert.equal(auditedGroups[kind][k],expectedGroups[kind][k],kind+' '+k+' incomplet');
  }
  return {selection:ids.length?'explicit-programmes':'complete-catalogue',requestedProgrammes:ids,includeContext,allModels:!sampledModels,
   catalogueGroups,expectedGroups,auditedGroups,catalogueProgrammes:R.records.length,
   excludedContextualProgrammes:selected.filter(r=>capabilities.get(r.id).contextual&&!includeContext).map(r=>r.id),
   exclusionReason:includeContext?null:'G10 contextual furnishing starts at detail revision11; earlier layer audits retain the native recipes only.'};
 }
 return {records:selected,flags,expected,levelsFor:rec=>levels.get(rec.id),visit,floor,finish};
}
module.exports={createAuditScope};
