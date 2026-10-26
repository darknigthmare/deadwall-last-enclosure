'use strict';
/* Rebuild generated tracking data without editing any source, save or workbook. */
const fs=require('node:fs'),path=require('node:path');
const {exportCatalogue}=require('./export-codex-tracker2026.cjs'),Targets=require('./codex-tracker-targets2026.cjs');
const Foundation=require('./codex-progress2026.cjs'),Maritime=require('./codex-maritime-progress2026.cjs'),Inspection=require('./codex-inspection-progress2026.cjs'),V=require('./validate-codex-tracker2026.cjs');
const Land=require('./codex-land-progress2026.cjs');
const Campaign=require('./codex-campaign-progress205.cjs');
const Services=require('./codex-campaign-services-progress208.cjs');
function currentData(root=path.resolve(__dirname,'..')){
 const inspected=Inspection.patch(Land.patch(Maritime.patch(Foundation.patch(Targets.generate()).data).data).data,root).data;
 const campaign=Campaign.patch(inspected,root).data;
 return {catalogue:exportCatalogue(root),...Services.optionalPatch(campaign,root).data};
}
function write(root,out){
 const data=currentData(root),summary=V.validate(data);fs.mkdirSync(out,{recursive:true});
 const pairs=[['catalogue','catalogue-existant.json'],['typologies','typologies-cibles.json'],['variants','variantes-a-concevoir.json'],['tasks','chantiers.json'],['campaign205','campagne-g11.json']];
 if(data.campaign208)pairs.push(['campaign208','campagne-services-g11.json']);
 // Refuse to overwrite editable data; separate fresh output directory required.
 for(const[,name]of pairs)if(fs.existsSync(path.join(out,name)))throw Error('Destination déjà présente : '+name);
 for(const[key,name]of pairs)fs.writeFileSync(path.join(out,name),JSON.stringify(data[key],null,2)+'\n');
 fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(summary,null,2)+'\n');return summary;
}
if(require.main===module){const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'artifacts/qa/codex-tracker2026');console.log(JSON.stringify(write(root,out),null,2));}
module.exports={currentData,write};
