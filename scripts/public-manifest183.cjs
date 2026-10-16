/* Build-time inventory. Not delivered as a runtime script. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const BUNDLED_MODULES=Object.freeze([
  "src/hydrology165.js",
  "src/biome-population165.js",
  "src/water-art165.js",
  "src/wildlife-art165.js",
  "src/hydrology-codex165.js",
  "src/biomes164.js",
  "src/codex-fixtures164.js",
  "src/biomes-codex164.js",
  "src/codex-usage163.js",
  "src/codex-size163.js",
  "src/codex-density163.js",
  "src/codex-architecture163.js",
  "src/codex-furnishing162.js",
  "src/power-network173.js",
  "src/transit-network173.js",
  "src/codex-native173.js",
  "src/site-infrastructure173.js",
  "src/codex-lab173-ui.js",
  "src/codex-packing173.js",
  "src/codex-gardens171.js",
  "src/codex-stations170.js",
  "src/codex-infill169-art.js",
  "src/codex-infill169.js",
  "src/codex-fill168.js",
  "src/codex-coverage167.js",
  "src/codex-ensembles165.js",
  "src/codex-plan165.js",
  "src/codex-quantities164.js",
  "src/codex-sites162.js",
  "src/codex-anchors160.js",
  "src/codex-dressing160.js",
  "src/codex3000-recipes159.js"
]);
function attributes(tag){
 const attrs=new Map();for(const match of tag.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/g)){
  const key=match[1].toLowerCase();if(attrs.has(key))throw Error('Duplicate HTML attribute: '+key);attrs.set(key,match[3]);
 }return attrs;
}
function readPublicEntries(rootDirectory){
 const html=fs.readFileSync(path.join(rootDirectory,'index.html'),'utf8').replace(/<!--[\s\S]*?-->/g,''),scripts=[],styles=[],seen=new Set();
 function add(name,kind){
  const valid=kind==='script'?/^src\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.js$/:/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.css$/;
  if(!valid.test(name)||name.includes('..'))throw Error('Invalid public '+kind+': '+name);
  if(seen.has(name))throw Error('Duplicate public entry: '+name);seen.add(name);(kind==='script'?scripts:styles).push(name);
 }
 for(const match of html.matchAll(/<(script|link)\b[^>]*>/gi)){
  const attrs=attributes(match[0]),type=match[1].toLowerCase();
  if(type==='script'&&/\bsrc\s*=/i.test(match[0])&&!attrs.has('src'))throw Error('Public script src must be quoted');
  if(type==='script'&&attrs.has('src'))add(attrs.get('src'),'script');
  if(type==='link'&&(attrs.get('rel')||'').toLowerCase().split(/\s+/).includes('stylesheet'))add(attrs.get('href')||'','style');
 }
 if(!scripts.length||!styles.length)throw Error('Public script/style inventory is empty');
 for(const name of scripts)if(BUNDLED_MODULES.includes(name))throw Error('Embedded module would execute twice: '+name);
 return Object.freeze({scripts:Object.freeze(scripts),styles:Object.freeze(styles)});
}
function bundledPrefix(rootDirectory){return BUNDLED_MODULES.map(file=>fs.readFileSync(path.join(rootDirectory,file),'utf8')).join('\n')+'\n';}
function verifyBundle(rootDirectory){
 const text=fs.readFileSync(path.join(rootDirectory,'src/codex3000-live-data.js'),'utf8');
 if(!text.startsWith(bundledPrefix(rootDirectory)+'/* Generated from original Codex 3000.'))throw Error('Compiled Codex modules are absent, stale or reordered');
 return true;
}
module.exports=Object.freeze({BUNDLED_MODULES,readPublicEntries,bundledPrefix,verifyBundle});
