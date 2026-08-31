import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = fileURLToPath(new URL('..', import.meta.url));
const publicFiles = new Set(['index.html', 'styles.css', 'settings.css', 'command.css', 'content.css', 'manifest.json', 'sw.js', 'src/core.js', 'src/save.js', 'src/art.js', 'src/tactics.js', 'src/profile.js', 'src/world-content.js', 'src/game.js', 'src/ui.js', 'src/command-ui.js', 'src/content-ui.js']);
const publicAssetTypes = new Set(['.png', '.webp', '.svg', '.jpg', '.jpeg', '.avif', '.woff', '.woff2']);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2'
};
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
};

function publicPath(requestURL) {
  let pathname;
  try {
    pathname = decodeURIComponent((requestURL || '/').split('?')[0]);
  } catch {
    return null;
  }
  if (!pathname.startsWith('/') || pathname.includes('\\')) return null;
  const name = pathname === '/' ? 'index.html' : pathname.slice(1);
  // Reject dot segments and Windows alternate data streams before resolution.
  if (name.split('/').some(segment => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment))) return null;
  return publicFiles.has(name) || (name.startsWith('assets/') && publicAssetTypes.has(extname(name))) ? name : null;
}

export function createGameServer({ rootDirectory = defaultRoot } = {}) {
  const root = resolve(rootDirectory);
  return createServer(async (req, res) => {
    const respond = (status, body, extraHeaders = {}) => {
      res.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extraHeaders });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      respond(405, 'Méthode non autorisée', { Allow: 'GET, HEAD' });
      return;
    }
    const name = publicPath(req.url);
    if (!name) {
      respond(404, '404 — fichier introuvable');
      return;
    }
    try {
      const [resolvedRoot, target] = await Promise.all([realpath(root), realpath(resolve(root, name))]);
      const withinRoot = relative(resolvedRoot, target);
      // realpath also closes escapes through symlinks/junctions in the public asset directory.
      if (isAbsolute(withinRoot) || withinRoot === '..' || withinRoot.startsWith('../') || withinRoot.startsWith('..\\')) {
        respond(404, '404 — fichier introuvable');
        return;
      }
      if (!publicPath('/' + withinRoot.replaceAll('\\', '/'))) {
        respond(404, '404 — fichier introuvable');
        return;
      }
      const info = await stat(target);
      if (!info.isFile()) {
        respond(404, '404 — fichier introuvable');
        return;
      }
      const body = req.method === 'HEAD' ? undefined : await readFile(target);
      respond(200, body, { 'Content-Type': mime[extname(name)], 'Content-Length': info.size });
    } catch {
      respond(404, '404 — fichier introuvable');
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT doit être un entier entre 0 et 65535.');
  const server = createGameServer();
  server.listen(port, '127.0.0.1', () => console.log(`DEADWALL : http://127.0.0.1:${server.address().port}`));
}
