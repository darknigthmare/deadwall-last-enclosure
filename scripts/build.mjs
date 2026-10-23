import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const compile=spawnSync(process.execPath,[path.join(root,'scripts/compile-codex3000.mjs')],{cwd:root,stdio:'inherit'});
if(compile.status!==0)throw Error('Compilation source Codex 3000 échouée.');
const compileContexts=spawnSync(process.execPath,[path.join(root,'scripts/compile-codex-context160.mjs')],{cwd:root,stdio:'inherit'});
if(compileContexts.status!==0)throw Error('Compilation source des contextes G10 échouée.');
const compileInspection=spawnSync(process.execPath,[path.join(root,'scripts/compile-codex-inspection2026.cjs')],{cwd:root,stdio:'inherit'});
if(compileInspection.status!==0)throw Error('Compilation des plans du Codex mondial échouée.');
const require = createRequire(import.meta.url);
const { ASSETS } = require('../src/art.js');
const {createImageInliner}=require('./standalone-inline162.cjs');
const {stampWorker}=require('./pwa-build184.cjs');
const {readPublicEntries,verifyBundle}=require('./public-manifest183.cjs');
verifyBundle(root);
const {scripts,styles}=readPublicEntries(root);
const images = ['assets/deadwall-keyart-v2.webp','assets/intro-road132.webp','assets/intro-bastion132.webp','assets/command-room132.webp','assets/loadout-character129.png','assets/loadout-items129.png', ...Object.values(ASSETS).map(asset => asset.url)];
const publicFiles = ['index.html',...styles,'manifest.json','sw.js',...scripts,'assets/icon.svg','assets/icon-192.png','assets/icon-512.png',...images];
// Fixed build output, verified inside this repository before recursive replacement.
if (path.dirname(dist) !== root.replace(/[\\/]$/, '') || path.basename(dist) !== 'dist') throw new Error('Répertoire de build invalide.');
fs.rmSync(dist, { recursive: true, force: true });
for (const dir of ['src', 'assets']) fs.mkdirSync(path.join(dist, dir), { recursive: true });
for (const name of publicFiles) {
  fs.mkdirSync(path.dirname(path.join(dist, name)), { recursive: true });
  fs.copyFileSync(path.join(root, name), path.join(dist, name));
}

// A source patch must produce a different worker even when package.version is unchanged.
const worker=stampWorker(root,publicFiles);
fs.writeFileSync(path.join(dist,'sw.js'),worker.source);
console.log('PWA payload: '+worker.fingerprint);

const imageTypes = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const dataURLs = Object.fromEntries(images.map(name => {
  const mime = imageTypes[path.extname(name)];
  if (!mime) throw new Error('Format d’image standalone inconnu : ' + name);
  return [name, 'data:' + mime + ';base64,' + fs.readFileSync(path.join(root, name)).toString('base64')];
}));
const inlineImages=createImageInliner(dataURLs);
function inlineScript(name) {
  let source = fs.readFileSync(path.join(root, name), 'utf8');
  if (name === 'src/world-variants158.js') {
    // This module computes asset paths. Embed its resolved registry instead of
    // relying on literal URL replacement, keeping the web module unchanged.
    const registry = require('../src/world-variants158.js').ASSETS;
    const embedded = Object.fromEntries(Object.entries(registry).map(([key, definition]) => {
      if (!Object.hasOwn(dataURLs, definition.url)) throw new Error('Atlas standalone absent : ' + key);
      return [key, { ...definition, url: dataURLs[definition.url] }];
    }));
    const declaration = /const ASSETS=Object\.freeze\(\{[\s\S]*?\}\);\s*(?=const ACTOR_GROUPS)/g;
    let replacements = 0;
    source = source.replace(declaration, () => {
      replacements++;
      return 'const ASSETS=Object.freeze(Object.fromEntries(Object.entries(' + JSON.stringify(embedded) +
        ').map(([key,value])=>[key,Object.freeze(value)])));\n ';
    });
    if (replacements !== 1) throw new Error('Déclaration des atlas standalone ambiguë : ' + name);
    // Its whole image registry is already embedded; avoid rescanning megabytes
    // of base64 for every other atlas in the game.
    return source;
  }
  if (['src/trap-art159.js','src/equipment-art159.js','src/actor-actions159.js','src/post-art159.js','src/expedition-sprites159.js','src/structure-art159.js'].includes(name)) {
    const registry=require(path.join(root,name)).ASSETS;
    const embedded=Object.fromEntries(Object.entries(registry).map(([key,definition])=>{
      if(!Object.hasOwn(dataURLs,definition.url))throw new Error('Atlas standalone absent : '+key);
      return [key,{...definition,url:dataURLs[definition.url]}];
    }));
    let replacements=0;
    source=source.replace(/const ASSETS\s*=\s*(?:Object\.freeze|freeze)\(\{[\s\S]*?\}\);/g,()=>{
      replacements++;
      return 'const ASSETS=Object.freeze(Object.fromEntries(Object.entries('+JSON.stringify(embedded)+').map(([key,value])=>[key,Object.freeze(value)])));';
    });
    if(replacements!==1)throw new Error('Déclaration des atlas standalone ambiguë : '+name);
    return source;
  }
  return inlineImages(source);
}
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/\s*<link rel="manifest"[^>]+>/, '')
  .replace(/\s*<link rel="icon"[^>]+>/, '')
  .replace(/\s*<script>if \('serviceWorker'[\s\S]*?<\/script>/, '');
// Replace references in a single pass. Sequential replacement rescanned the
// growing standalone (hundreds of MB) for every remaining module.
const styleNames = new Set(styles), scriptNames = new Set(scripts);
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (tag, name) =>
  styleNames.has(name) ? '<style>\n' + inlineImages(fs.readFileSync(path.join(root, name), 'utf8')) + '\n</style>' : tag);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, name) =>
  scriptNames.has(name) ? '<script>\n' + inlineScript(name) + '\n</script>' : tag);
if (/<script[^>]+src=|<link[^>]+stylesheet|url\(\s*["']?assets\//.test(html)) throw new Error('Le standalone contient encore une dépendance externe.');
fs.writeFileSync(path.join(root, 'DEADWALL_Standalone.html'), html);
console.log('dist ready: ' + publicFiles.length + ' fichiers publics, standalone hors ligne intégré.');
