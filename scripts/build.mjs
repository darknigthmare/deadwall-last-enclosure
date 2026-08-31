import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const backdropRelative = 'assets/deadwall-keyart-v2.webp';
const publicFiles = ['index.html','styles.css','manifest.json','sw.js','src/core.js','src/game.js','assets/icon.svg','assets/icon-192.png','assets/icon-512.png',backdropRelative];
fs.rmSync(dist, { recursive: true, force: true });
for (const dir of ['src', 'assets']) fs.mkdirSync(path.join(dist, dir), { recursive: true });
for (const name of publicFiles) fs.copyFileSync(path.join(root, name), path.join(dist, name));

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const backdropDataUrl = 'data:image/webp;base64,' + fs.readFileSync(path.join(root, backdropRelative)).toString('base64');
const standaloneCss = css.replaceAll('url("' + backdropRelative + '")', 'url("' + backdropDataUrl + '")');
if (standaloneCss.includes(backdropRelative)) throw new Error('Le fond du menu doit être intégré au standalone.');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/\s*<link rel="manifest"[^>]+>/, '')
  .replace(/\s*<link rel="icon"[^>]+>/, '')
  .replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + standaloneCss + '\n</style>')
  .replace('<script src="src/core.js"></script>', '<script>\n' + fs.readFileSync(path.join(root, 'src/core.js'), 'utf8') + '\n</script>')
  .replace('<script src="src/game.js"></script>', '<script>\n' + fs.readFileSync(path.join(root, 'src/game.js'), 'utf8') + '\n</script>')
  .replace(/\s*<script>if \('serviceWorker'[\s\S]*?<\/script>/, '');
if (/url\(\s*["']?assets\//.test(html)) throw new Error('Le standalone contient encore une URL asset externe.');
fs.writeFileSync(path.join(root, 'DEADWALL_Standalone.html'), html);
console.log('dist ready');
