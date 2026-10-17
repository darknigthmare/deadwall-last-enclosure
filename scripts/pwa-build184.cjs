/* Deterministic release identity, independent of Git, timestamps and checkout paths. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
function stampWorker(rootDirectory,publicFiles){
 const template=fs.readFileSync(path.join(rootDirectory,'sw.js'),'utf8');
 const declaration=/^const CACHE = '([^']+)';/m,match=declaration.exec(template);
 if(!match||!match[1].startsWith('deadwall-v'))throw Error('Unrecognized PWA cache declaration');
 const files=[...new Set(publicFiles)].sort(),hash=createHash('sha256');
 if(!files.includes('index.html')||!files.includes('sw.js'))throw Error('Incomplete PWA payload');
 hash.update('DEADWALL public payload v1\0');
 for(const name of files){
  if(typeof name!=='string'||!name||name.includes('\\')||name.split('/').some(s=>!s||s==='.'||s==='..')||path.isAbsolute(name))throw Error('Invalid PWA payload path');
  const data=fs.readFileSync(path.join(rootDirectory,name));
  // Hash file identity and length as well as its digest, including optional images and the worker template.
  hash.update(JSON.stringify([name,data.length,createHash('sha256').update(data).digest('hex')])+'\n');
 }
 const fingerprint=hash.digest('hex'),cache=match[1]+'-'+fingerprint.slice(0,24);
 return {source:template.replace(declaration,"const CACHE = '"+cache+"';"),cache,fingerprint,files:files.length};
}
module.exports=Object.freeze({stampWorker});
