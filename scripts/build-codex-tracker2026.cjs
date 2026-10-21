'use strict';
/* Rebuild generated tracking data without editing any source, save or workbook. */
const fs=require('node:fs'),path=require('node:path');
const {exportCatalogue}=require('./export-codex-tracker2026.cjs'),Targets=require('./codex-tracker-targets2026.cjs');
const Foundation=require('./codex-progress2026.cjs'),Maritime=require('./codex-maritime-progress2026.cjs'),V=require('./validate-codex-tracker2026.cjs');
function currentData(root){return {catalogue:exportCatalogue(root),...Maritime.patch(Foundation.patch(Targets.generate()).data).data};}
function write(root,out){
 const data=currentData(root),summary=V.validate(data);fs.mkdirSync(out,{recursive:true});
 const pairs=[['catalogue','catalogue-existant.json'],['typologies','typologies-cibles.json'],['variants','variantes-a-concevoir.json'],['tasks','chantiers.json']];
 // Refuse to overwrite editable data; separate fresh output directory required.
 for(const[,name]of pairs)if(fs.existsSync(path.join(out,name)))throw Error('Destination déjà présente : '+name);
 for(const[key,name]of pairs)fs.writeFileSync(path.join(out,name),JSON.stringify(data[key],null,2)+'\n');
 fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(summary,null,2)+'\n');return summary;
}
if(require.main===module){const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'artifacts/qa/codex-tracker2026');console.log(JSON.stringify(write(root,out),null,2));}
module.exports={currentData,write};
