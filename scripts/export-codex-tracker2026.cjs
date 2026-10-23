'use strict';
// Read-only extraction. The authoritative catalogue remains the original repository.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function exportCatalogue(root) {
  const R = require(path.join(root, 'src/codex3000-runtime.js'));
  const Coverage = require(path.join(root, 'src/codex-coverage167.js'));
  const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const legacy = read('codex-3000/INDEX_3000.json').entries;
  const extra = read('codex-3000/addendum-1.58/INDEX_1000.json').entries;
  const sources = new Map(legacy.map(e => [e.id, 'codex-3000/' + e.path]));
  extra.forEach(e => sources.set(e.id, 'codex-3000/addendum-1.58/' + e.source));
  const programmes = [], rooms = [], props = [], parentIds = new Set(), sourceFiles = new Map();
  for (const r of R.records) {
    const d = R.describe(r.id), s = Coverage.source(r.id);
    const source = sources.get(r.id);
    if (!source) throw Error('Missing source: ' + r.id);
    if (!sourceFiles.has(source)) sourceFiles.set(source, crypto.createHash('sha256').update(fs.readFileSync(path.join(root,source))).digest('hex'));
    programmes.push({id:r.id,parent:r.parent,name:r.name,family:r.family,
      origin:r.independent?'Parent indépendant 1.58':r.original?'Parent historique':'Composition héritée',
      module:r.module||'',state:r.state||'',generation:s.generation,
      model:s.model,reference:s.reference,source,sourceSha256:sourceFiles.get(source),
      sourceRooms:d.rooms.length,exteriorRooms:d.rooms.filter(x=>x.exterior).length,
      authoredProps:d.rooms.reduce((n,x)=>n+x.authoredProps.length,0),
      authoredSlots:d.rooms.reduce((n,x)=>n+(x.sourceProps158?.length||0),0),
      recipeAvailable:s.recipeAvailable,axes:s.axes,gaps:s.sourceGaps,
      integration:'Catalogue existant',qualification:'À qualifier par lieu',
      boundary:d.implementation});
    if(parentIds.has(r.parent))continue;
    parentIds.add(r.parent);
    for (const [ri,room] of d.rooms.entries()) {
      const key=r.parent+'/room-'+String(ri+1).padStart(3,'0');
      rooms.push({id:key,parent:r.parent,sourceId:room.id,name:room.name,exterior:room.exterior,
        classification:room.classificationSource,levels:room.levels,area:room.area,repeat:room.repeat,
        resource:room.resource,kit:room.kit.id,kitInventory:room.kit.inventory,
        clearance:room.kit.clearance,placement:room.placement,source:sources.get(r.parent)});
      for (const [pi,p] of room.authoredProps.entries()) props.push({
        id:key+'/prop-'+String(pi+1).padStart(3,'0'),parent:r.parent,roomId:key,room:room.name,
        kind:p.asset,name:p.nom,quantity:p.quantite_par_espace,size:p.gabarit_m,
        clearance:p.degagement_min_m,anchor:p.ancrage,rotation:p.rotation,
        lootEligible:p.loot_eligible,origin:'Prescription auteur',source:sources.get(r.parent)});
      for (const [pi,p] of (room.sourceProps158||[]).entries()) props.push({
        id:key+'/slot-'+String(pi+1).padStart(3,'0'),parent:r.parent,roomId:key,room:room.name,
        kind:p.kind,name:p.kind,quantity:null,size:null,clearance:null,anchor:null,rotation:null,
        lootEligible:null,resource:p.resource,origin:'Emplacement auteur ; dimensions non renseignées',source:sources.get(r.parent)});
    }
  }
  return {schemaVersion:1,summary:R.summary(),scope:'source-inventory-not-gameplay-certification',programmes,rooms,props,
    sourceFiles:[...sourceFiles].map(([file,sha256])=>({file,sha256}))};
}
if(require.main===module){
  const root=path.resolve(process.argv[2]||'.'),dest=path.resolve(process.argv[3]||'artifacts/codex-tracker/catalogue.json');
  const data=exportCatalogue(root);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
  console.log(JSON.stringify({programmes:data.programmes.length,parents:data.summary.parents,rooms:data.rooms.length,props:data.props.length,output:dest}));
}
module.exports={exportCatalogue};
