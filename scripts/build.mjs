import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
for (const dir of ['src', 'assets']) fs.mkdirSync(path.join(dist, dir), { recursive: true });
for (const name of ['index.html','styles.css','manifest.json','sw.js','src/core.js','src/game.js','assets/icon.svg','assets/icon-192.png','assets/icon-512.png']) {
  fs.copyFileSync(path.join(root, name), path.join(dist, name));
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/\s*<link rel="manifest"[^>]+>/, '')
  .replace(/\s*<link rel="icon"[^>]+>/, '')
  .replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + fs.readFileSync(path.join(root, 'styles.css'), 'utf8') + '\n</style>')
  .replace('<script src="src/core.js"></script>', '<script>\n' + fs.readFileSync(path.join(root, 'src/core.js'), 'utf8') + '\n</script>')
  .replace('<script src="src/game.js"></script>', '<script>\n' + fs.readFileSync(path.join(root, 'src/game.js'), 'utf8') + '\n</script>')
  .replace(/\s*<script>if \('serviceWorker'[\s\S]*?<\/script>/, '');
fs.writeFileSync(path.join(root, 'DEADWALL_Standalone.html'), html);
console.log('dist ready');
