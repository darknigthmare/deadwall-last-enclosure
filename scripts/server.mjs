import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = fileURLToPath(new URL('..', import.meta.url));
const publicFiles = new Set(['index.html', 'styles.css', 'settings.css', 'command.css', 'content.css', 'narrative.css', 'squads.css', 'finish.css', 'exploration-125.css','night-gear.css','world-codex.css','expansion-ui.css','loadout129.css','command-presentation129.css','departure130.css','chronicles131.css','campaign-intro132.css','presentation132.css','succession-ui133.css','arsenal134.css','interventions134.css','barricades134.css','hud135.css','city-catalogue150.css', 'manifest.json', 'sw.js', 'src/frontier-specialists.js','src/frontier-places.js','src/settlement-plans.js','src/frontier-geometry.js','src/region-roadkit.js','src/region-settlements.js','src/frontier-world.js','src/frontier-state.js','src/frontier-logistics.js','src/field-atlas-state.js','src/essential-content.js','src/essential-state.js','src/world-evolution-state.js','src/core.js','src/biomes135.js','src/geography135.js','src/world-spawns131.js','src/world-stream131.js', 'src/scenarios.js', 'src/squads.js', 'src/battlefield.js', 'src/narrative.js', 'src/save.js', 'src/assets136.js','src/d17-art149.js','src/d17-art150.js','src/d17-art152.js','src/vehicle-art152.js','src/render-cache153.js','src/display-quality153.js','src/nature-art153.js','src/world-props-art153.js','src/interior-art153.js','src/art.js', 'src/tactics.js', 'src/profile.js', 'src/world-content.js', 'src/salvage.js','src/urban.js','src/urban-art.js','src/nightwatch.js','src/power-grid.js','src/power-grid-art.js','src/expeditions.js','src/expedition-art.js','src/fieldcraft.js','src/atlas-projection.js','src/field-atlas-art.js','src/atlas-render.js','src/frontier-routing.js','src/frontier-survey.js','src/frontier.js','src/ground135.js','src/frontier-art.js','src/frontier-care.js','src/return-routes.js','src/field-atlas.js','src/essential-ops.js','src/essential-art.js','src/world-evolution.js','src/world-evolution-art.js','src/coop.js','src/game.js', 'src/ui.js', 'src/command-ui.js', 'src/content-ui.js', 'src/narrative-ui.js', 'src/scenario-ui.js', 'src/squad-ui.js', 'src/battlefield-ui.js','src/coordination.js','src/coordination-ui.js','src/linecare.js','src/linecare-ui.js','src/recon-art.js','src/recon.js','src/recon-ui.js','src/salvage-ui.js','src/urban-ui.js','src/city-catalogue150.js','src/city-catalogue-ui150.js','src/power-grid-ui.js','src/expeditions-ui.js','src/fieldcraft-ui.js','src/atlas-view.js','src/frontier-ui.js','src/frontier-care-ui.js','src/return-routes-ui.js','src/field-atlas-ui.js','src/essential-ui.js','src/world-evolution-ui.js','src/night-gear.js','src/exploration-125.js','src/visibility146.js','src/actor-presentation.js','src/operations-art.js','src/world-codex-nature.js','src/world-codex-habitat.js','src/road-profiles133.js','src/world-codex-activites.js','src/world-codex-systemes.js','src/equipment-codex134.js','src/biomes-codex135.js','src/world-codex.js','src/expansion-kit.js','src/exploration-pack.js','src/survival-pack.js','src/fortification-pack.js','src/companions-pack.js','src/campaign-pack.js','src/defense-pack131.js','src/exploration-pack131.js','src/player-pack131.js','src/world-pack131.js','src/chronicles131-data.js','src/chronicles131.js','src/chronicles131-ui.js','src/expansion-ui.js','src/loadout129.js','src/loadout-ui129.js','src/command-presentation129.js','src/departure130.js','src/campaign-intro132.js','src/presentation132.js','src/hero-actions133.js','src/succession133.js','src/succession-ui133.js','src/arsenal134.js','src/arsenal-ui134.js','src/interventions134.js','src/interventions-ui134.js','src/barricades134.js','src/barricades-ui134.js','src/hud135.js']);
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
