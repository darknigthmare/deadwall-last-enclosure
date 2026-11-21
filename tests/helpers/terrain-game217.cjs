'use strict';
// Harnais hors jeu (O8a) : remplace le monde d'une partie lancée par une carte de 192 m née de la description
// locale de génération 12 (`describe(graine)`), avec un cœur au centre du site, le commandant et l'équipe autour.
// Aucune option de menu, aucune sauvegarde : la génération 12 reste refusée par le jeu.
// Fonction autonome (aucune fermeture) : le harnais de navigateur l'évalue telle quelle dans la page.
function buildTerrainGame217(g, describe, seed, options) {
  const C = globalThis.DeadwallCore, T = C.TILE, map = C.localMap217(192), d = describe(seed);
  const World = g.world.constructor, Building = g.core().constructor, Flow = g.flow.constructor;
  const w = new World(seed, g.world.cityGeometry202, map, d), size = w.definition('core').size;
  const cx = Math.floor(d.centre.x - size[0] / 2), cy = Math.floor(d.centre.y - size[1] / 2);
  const core = new Building(g.nextId++, 'core', cx, cy, 0, 1, w.cityGeometry202); core.health = core.maxHealth; w.add(core);
  g.world = w; g.flow = new Flow(); g.flow.rebuild(w, core);
  g.player.x = core.x + 20; g.player.y = core.bottom + 70;
  for (const [k, u] of g.units.entries()) { u.x = core.x - 40 + k * 40; u.y = core.bottom + 50; }
  g.zombies.length = 0; g.projectiles.length = 0; g.corpses.length = 0; g.particles.length = 0;
  g.rally = { x: core.x, y: core.bottom + 120 };
  const at = options?.camera || { x: g.player.x, y: g.player.y };
  Object.assign(g.camera, { x: at.x, y: at.y, zoom: options?.zoom ?? g.camera.zoom, shake: 0 });
  g.visibility?.invalidate?.();
  return { world: w, core, description: d };
}
module.exports = { buildTerrainGame217 };
