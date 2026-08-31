import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const require = createRequire(import.meta.url);
const { ASSETS } = require('../src/art.js');
const scripts = ['src/core.js','src/save.js','src/art.js','src/game.js','src/ui.js'];
const styles = ['styles.css','settings.css'];
const images = ['assets/deadwall-keyart-v2.webp', ...Object.values(ASSETS).map(asset => asset.url)];
const publicFiles = ['index.html',...styles,'manifest.json','sw.js',...scripts,'assets/icon.svg','assets/icon-192.png','assets/icon-512.png',...images];
// Fixed build output, verified inside this repository before recursive replacement.
if (path.dirname(dist) !== root.replace(/[\\/]$/, '') || path.basename(dist) !== 'dist') throw new Error('Répertoire de build invalide.');
fs.rmSync(dist, { recursive: true, force: true });
for (const dir of ['src', 'assets']) fs.mkdirSync(path.join(dist, dir), { recursive: true });
for (const name of publicFiles) fs.copyFileSync(path.join(root, name), path.join(dist, name));

const dataURLs = Object.fromEntries(images.map(name => [name, 'data:image/webp;base64,' + fs.readFileSync(path.join(root, name)).toString('base64')]));
function inlineImages(text) {
  for (const [name, url] of Object.entries(dataURLs)) text = text.replaceAll(name, url);
  return text;
}
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/\s*<link rel="manifest"[^>]+>/, '')
  .replace(/\s*<link rel="icon"[^>]+>/, '')
  .replace(/\s*<script>if \('serviceWorker'[\s\S]*?<\/script>/, '');
for (const name of styles) {
  html = html.replace('<link rel="stylesheet" href="' + name + '">', () => '<style>\n' + inlineImages(fs.readFileSync(path.join(root, name), 'utf8')) + '\n</style>');
}
for (const name of scripts) {
  html = html.replace('<script src="' + name + '"></script>', () => '<script>\n' + inlineImages(fs.readFileSync(path.join(root, name), 'utf8')) + '\n</script>');
}
if (/<script[^>]+src=|<link[^>]+stylesheet|url\(\s*["']?assets\//.test(html)) throw new Error('Le standalone contient encore une dépendance externe.');
fs.writeFileSync(path.join(root, 'DEADWALL_Standalone.html'), html);
console.log('dist ready: ' + publicFiles.length + ' fichiers publics, standalone hors ligne intégré.');
