import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
const require = createRequire(import.meta.url);
const { ASSETS } = require('../src/art.js');
const scripts = ['src/frontier-specialists.js','src/frontier-places.js','src/settlement-plans.js','src/frontier-geometry.js','src/region-roadkit.js','src/region-settlements.js','src/frontier-world.js','src/frontier-state.js','src/frontier-logistics.js','src/field-atlas-state.js','src/essential-content.js','src/essential-state.js','src/world-evolution-state.js','src/core.js','src/biomes135.js','src/geography135.js','src/world-spawns131.js','src/world-stream131.js','src/scenarios.js','src/squads.js','src/battlefield.js','src/narrative.js','src/save.js','src/tactics.js','src/profile.js','src/assets136.js','src/d17-art149.js','src/d17-art150.js','src/art.js','src/world-content.js','src/salvage.js','src/urban.js','src/urban-art.js','src/nightwatch.js','src/power-grid.js','src/power-grid-art.js','src/expeditions.js','src/expedition-art.js','src/fieldcraft.js','src/atlas-projection.js','src/field-atlas-art.js','src/atlas-render.js','src/frontier-routing.js','src/frontier-survey.js','src/frontier.js','src/ground135.js','src/frontier-art.js','src/frontier-care.js','src/return-routes.js','src/field-atlas.js','src/essential-ops.js','src/essential-art.js','src/world-evolution.js','src/world-evolution-art.js','src/coop.js','src/game.js','src/ui.js','src/command-ui.js','src/content-ui.js','src/narrative-ui.js','src/scenario-ui.js','src/squad-ui.js','src/battlefield-ui.js','src/coordination.js','src/coordination-ui.js','src/linecare.js','src/linecare-ui.js','src/recon-art.js','src/recon.js','src/recon-ui.js','src/salvage-ui.js','src/urban-ui.js','src/city-catalogue150.js','src/city-catalogue-ui150.js','src/power-grid-ui.js','src/expeditions-ui.js','src/fieldcraft-ui.js','src/atlas-view.js','src/frontier-ui.js','src/frontier-care-ui.js','src/return-routes-ui.js','src/field-atlas-ui.js','src/essential-ui.js','src/world-evolution-ui.js','src/night-gear.js','src/exploration-125.js','src/visibility146.js','src/actor-presentation.js','src/operations-art.js','src/world-codex-nature.js','src/world-codex-habitat.js','src/road-profiles133.js','src/world-codex-activites.js','src/world-codex-systemes.js','src/equipment-codex134.js','src/biomes-codex135.js','src/world-codex.js','src/expansion-kit.js','src/exploration-pack.js','src/survival-pack.js','src/fortification-pack.js','src/companions-pack.js','src/campaign-pack.js','src/defense-pack131.js','src/exploration-pack131.js','src/player-pack131.js','src/world-pack131.js','src/chronicles131-data.js','src/chronicles131.js','src/chronicles131-ui.js','src/expansion-ui.js','src/loadout129.js','src/loadout-ui129.js','src/command-presentation129.js','src/departure130.js','src/campaign-intro132.js','src/presentation132.js','src/hero-actions133.js','src/succession133.js','src/succession-ui133.js','src/arsenal134.js','src/arsenal-ui134.js','src/interventions134.js','src/interventions-ui134.js','src/barricades134.js','src/barricades-ui134.js','src/hud135.js'];
const styles = ['styles.css','settings.css','command.css','content.css','narrative.css','squads.css','finish.css','exploration-125.css','night-gear.css','world-codex.css','expansion-ui.css','loadout129.css','command-presentation129.css','departure130.css','chronicles131.css','campaign-intro132.css','presentation132.css','succession-ui133.css','arsenal134.css','interventions134.css','barricades134.css','hud135.css','city-catalogue150.css'];
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

const dataURLs = Object.fromEntries(images.map(name => [name, 'data:image/' + (name.endsWith('.png') ? 'png' : 'webp') + ';base64,' + fs.readFileSync(path.join(root, name)).toString('base64')]));
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
