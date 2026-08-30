import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('..', import.meta.url))));
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml'
};

createServer(async (req, res) => {
  try {
    const clean = decodeURIComponent((req.url || '/').split('?')[0]);
    const relative = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
    const path = normalize(join(root, relative));
    if (!path.startsWith(root)) throw new Error('blocked');
    const info = await stat(path);
    const target = info.isDirectory() ? join(path, 'index.html') : path;
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 — fichier introuvable');
  }
}).listen(port, '0.0.0.0', () => console.log(`DEADWALL : http://localhost:${port}`));
