'use strict';
// Harnais hors jeu (O8b) : sur une partie dont le monde a été remplacé par une carte de terrain
// (`buildTerrainGame217`), pose une citadelle verticale achevée près d'un point, y monte le commandant par
// l'escalier, construit une sentinelle par les contrôleurs de production et en prend le contrôle (`module: null` :
// commandant laissé sur le palier, sans arme).
// La citadelle est posée achevée (ajout direct au monde, comme le cœur du harnais : un chantier de support prendrait
// plusieurs minutes de jeu) ; depuis le préalable O9 (a), l'annulation de placement et le bilan de la cité sont ceux de
// la partie (ils ne plantent plus sur un monde de terrain) : seul l'âge de la campagne d'origine est gardé (voir plus bas).
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
  // Âge de la campagne : la partie avancée (âge 10) des tests est une partie plate dont le harnais remplace le monde ; le
  // registre urbain, propre au monde, repart à neuf sur le terrain, et une campagne G12 avancée ne se reprend qu'avec le
  // registre régional G12 ouvert (O9). Le bilan de la cité est rafraîchi pour de bon (modules compris) ; seul l'âge déjà
  // atteint par la partie d'origine est gardé le temps de la pose. Aucune autre méthode n'est neutralisée.
  const tier = g.tier, own = Object.getOwnPropertyDescriptor(g, 'refreshMetrics'), refresh = g.refreshMetrics;
  g.refreshMetrics = function (...a) { const r = refresh.apply(this, a); if (this.tier.id < tier.id) this.tier = tier; return r; };
  // Une partie en pause (harnais de navigateur) est rendue active le temps de la pose, d'un seul bloc synchrone.
  const paused = g.paused; g.paused = false;
  try { g.refreshMetrics(true); return arm(); } finally { g.paused = paused; if (own) Object.defineProperty(g, 'refreshMetrics', own); else delete g.refreshMetrics; }
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
