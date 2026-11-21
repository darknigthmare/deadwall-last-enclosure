'use strict';
// Harnais hors jeu (O8b) : sur une partie dont le monde a été remplacé par une carte de terrain
// (`buildTerrainGame217`), pose une citadelle verticale achevée près d'un point, y monte le commandant par
// l'escalier, construit une sentinelle par les contrôleurs de production et en prend le contrôle (`module: null` :
// commandant laissé sur le palier, sans arme).
// Les quartiers et le bilan de la cité ne lisent pas encore un monde de terrain (moteur de quartiers) : la pose
// contourne `placeOne` et `refreshMetrics` en ajoutant le bâtiment directement au monde, comme le cœur du harnais.
// Fonction autonome (aucune fermeture) : le harnais de navigateur l'évalue telle quelle dans la page.
function armTerrainCitadel217(g, near, options) {
  const C = globalThis.DeadwallCore, R = C.VerticalCitadel175, S = globalThis.DeadwallVertical175State, V = g.vertical175;
  const type = options?.type || 'verticalFoundation6', w = g.world, def = w.definition(type), t = w.terrain217, N = t.tiles;
  const Building = g.core().constructor, cx = Math.round(near.x), cy = Math.round(near.y), wanted = options?.level;
  // Emprise la plus proche du point voulu : valide pour le terrain (un seul palier, à sec, hors rampe), palier imposé si demandé.
  const spots = [];
  for (let y = 2; y < N - def.size[1] - 2; y++) for (let x = 2; x < N - def.size[0] - 2; x++) {
    const d = (x + def.size[0] / 2 - cx) ** 2 + (y + def.size[1] / 2 - cy) ** 2; if (d < (options?.radius || 60) ** 2) spots.push({ x, y, d });
  }
  spots.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
  let b = null;
  for (const s of spots) {
    if (wanted !== undefined && t.levels[s.y * N + s.x] !== wanted) continue;
    if (!w.placement(def, s.x, s.y, 0).valid) continue;
    // Entrée sur le même palier que l'emprise (sortie par l'escalier possible sans franchir la falaise).
    const probe = new Building(g.nextId, type, s.x, s.y, 0, 1, w.cityGeometry202), door = S.entrance(probe);
    if (!w.stepClear217(probe.x, probe.y, door.x, door.y) || !g.friendlyPositionClear(g.player, door.x, door.y)) continue;
    b = new Building(g.nextId++, type, s.x, s.y, 0, 1, w.cityGeometry202); b.health = b.maxHealth; w.add(b); break;
  }
  if (!b) throw Error('Aucune emprise de citadelle sur ce terrain près du point demandé.');
  g.flow.rebuild(w, g.core());
  // Quartiers et bilan de la cité laissés de côté pendant la pose (ils plantent sur un monde de terrain) : l'annulation
  // de placement (menu de construction des quartiers) et le bilan sont neutralisés, puis rendus à la partie.
  const own = ['cancelPlacement', 'refreshMetrics'].map(k => [k, Object.getOwnPropertyDescriptor(g, k)]);
  // Une partie en pause (harnais de navigateur) est rendue active le temps de la pose, d'un seul bloc synchrone.
  const paused = g.paused; g.cancelPlacement = () => {}; g.refreshMetrics = () => {}; g.paused = false;
  try { return arm(); } finally { g.paused = paused; for (const [k, o] of own) { if (o) Object.defineProperty(g, k, o); else delete g[k]; } }
  function arm() {
  const step = s => { for (let n = 0; n < s - 1e-6; n += .1) V.step(Math.min(.1, s - n)); };
  const door = V.entrance(b); g.player.x = door.x; g.player.y = door.y; g.player.reload = 0; V.step(.1);
  const q = V.accessQuote(b.id, 0); if (!q.ok) throw Error('Accès refusé : ' + q.reason);
  V.access(b.id, 0); step(q.seconds + .2);
  g.player.x = b.x; g.player.y = b.y;
  if (options?.module === null) return { building: b, module: null };
  const kind = options?.module || 'sentry', built = V.buildModule(kind, 0); if (!built.ok) throw Error('Module refusé : ' + built.reason);
  step(R.modules[kind].seconds + .2);
  const m = V.snapshot().sites.find(s => s.id === b.id).decks[V.pose().level].modules.find(m => m.slot === 0), p = S.slots(b)[0], d = R.modules[kind];
  g.player.x = p.x * R.tile + (d.size[0] / 2) * R.tile + 13; g.player.y = p.y * R.tile;
  const held = V.possess(m.id); if (!held.ok) throw Error('Contrôle refusé : ' + held.reason);
  return { building: b, module: m.id };
  }
}
// Oriente l'arme possédée vers un point de la carte (cases, mètres ; hauteur absolue du relief) depuis l'œil de la vue.
function aimTerrainFps217(g, at, z) {
  const V = g.vertical175, S = globalThis.DeadwallVertical175State, F = globalThis.DeadwallTerrainFPS217;
  const q = V.moduleRef(V.presentation().controlled), eye = F.eye(g.world, V.muzzle(q), q.b);
  const a = S.lookAt(eye, { x: at.x, y: at.y, z }); V.aim(a.yaw, a.pitch); return a;
}
module.exports = { armTerrainCitadel217, aimTerrainFps217 };
