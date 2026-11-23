'use strict';
/* Banc d'équilibrage 217 : campagne neuve, hors navigateur, jouée par une stratégie scriptée simple et déterministe.
   Il relève par vague ce que font les systèmes livrés en 215–217 (maladie des charniers, brèches, eau, moral,
   vagues menées, abominations du siège, avant-postes) pour éprouver leurs valeurs « non éprouvées en partie réelle ».

   Ce banc ne change rien au jeu : il charge l'ordre HTML livré (scripts/qa-startup134.cjs), démarre une campagne
   neuve et n'agit que par les commandes du joueur (poser, recruter, réparer, ordres des ouvriers, bûcher, fosse,
   touches de déplacement et de tir du Commandant). Aides de banc, toutes déclarées et comptées dans le rapport :
   - hasard hors carte figé : `Math.random` et le générateur de l'équipe (`g.random`) sont semés par la graine, comme
     dans tests/soak.test.cjs, et `Date.now` avance d'une milliseconde par appel. Aucun tirage n'est ajouté au jeu ;
   - présentation espacée : le HUD (`updateUI`) et la carte réduite sont rafraîchis une fois par seconde simulée au
     lieu de 11 fois : ils ne portent aucune règle (contrat des modules de présentation) ;
   - âge « promu » (option `ages: 'promu'`) : l'âge suivant est accordé quand tous ses critères de cité sont remplis
     sauf ceux d'exploration (relevés, lieux récoltés, biomes), que la stratégie, restée à D-17, ne peut pas remplir.
     La promotion passe par la reprise ordinaire d'une sauvegarde, comme les tests des modules (toAge). Avec
     `ages: 'merite'`, l'âge n'avance que par la règle du jeu ;
   - option `aid: 'munitions'` (défaut ; `aid: 'aucune'` pour s'en passer) : munitions remontées à l'alerte,
     ravitaillement en fin de vague (butin de sortie que la stratégie ne rapporte pas), garde de l'enceinte (option
     `guard`, voir la boucle) et clôture des assauts figés. Sans elles, la stratégie tombe vers la vague 3 ou 4,
     avant que les systèmes éprouvés ici n'entrent en jeu.
   Le banc n'est ni une partie humaine ni une mesure de rendu : il dit ce que produisent les règles face à un jeu
   simple et constant. */
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const SEEDS = Object.freeze(['0', '1', '42', '17117', '84329', '967313470', '1947648717', '4294967295']);

// Paramètres de la stratégie scriptée (comportement du joueur simulé, pas des règles du jeu).
const BOT = Object.freeze({
  step: .04,                 // pas physique maximal du jeu (C.SIMULATION_RULES.maxStepSeconds)
  think: 1,                  // une décision par seconde simulée
  uiSeconds: 1, minimapSeconds: 2,
  ring: 7, outside: 16,                  // demi-côté de l'enceinte, en cases, autour du centre de commandement
  ditchGap: 3, ditchHalf: 5, ditchWood: 60, // fossés : à 3 cases devant chaque porte, 11 cases de large
  reserve: Object.freeze({ wood: 30, scrap: 20, food: 45, ammo: 50 }),
  clearAbove: 6,             // corps au pied des murs ou dans les fossés au-delà desquels on fait déblayer
  pyreAbove: 8,              // corps à traiter avant d'allumer le bûcher
  fireRange: 340, guardRange: 300, meleeRange: 46, ammoFloor: 20, huntRange: 220, depotRange: 90,
  ammoAid: Object.freeze({ base: 120, perWave: 15 }),
  lootAid: Object.freeze({ base: Object.freeze({ wood: 120, scrap: 90, stone: 30, fuel: 25 }), perWave: Object.freeze({ wood: 8, scrap: 6, stone: 3, fuel: 2 }) }),
  strayMax: 5, stallSeconds: 90, stallAssault: 900, wallRush: 60, firstModels: 5, homeReplan: 30, homeRecall: 120, repairBelow: .6, repairPerThink: 4,
  maxSimSeconds: 40000
});
// Économie et défense visées, dans l’ordre. Chaque ligne : modèle, nombre voulu.
const PLAN = Object.freeze([
  ['farm', 1], ['house', 1], ['lumber', 1], ['scrapyard', 1], ['watchtower', 1], ['scrapyard', 2], ['barracks', 1], ['watchtower', 2],
  ['warehouse', 1], ['lumber', 2], ['watchtower', 4], ['generator', 1], ['farm', 2], ['warehouse', 2], ['quarry', 1], ['house', 2],
  ['generator', 2], ['clinic', 1], ['fireCistern', 1], ['workshop', 1], ['refinery', 1], ['warehouse', 3], ['turret', 2], ['scrapyard', 3],
  ['house', 3], ['watchtower', 6], ['generator', 3], ['warehouse', 4],
  ['ammoFactory', 1], ['turret', 4], ['farm', 3], ['fireCistern', 2], ['house', 4], ['quarry', 2], ['generator', 2], ['turret', 6],
  ['house', 5], ['rowHomes', 1], ['farm', 4], ['house', 6], ['rowHomes', 2], ['turret', 8], ['ammoFactory', 2], ['rowHomes', 3]
]);
// Ouvrages placés près des portes (un par porte, à tour de rôle) plutôt qu'au plus près du centre.
const AT_GATES = Object.freeze(['watchtower', 'turret']);
const OUTSIDE = Object.freeze(['farm', 'lumber', 'scrapyard', 'quarry', 'refinery']);
const STRATEGIES = Object.freeze({
  // Murs, portes, fossés, recrutement, déblaiement, bûcher et fosse ; le Commandant reste à D-17.
  rempart: Object.freeze({ walls: true, ditches: true, recruit: true, clear: true, pyre: true, pit: true, sortie: false }),
  // Cité négligée : ni bûcher, ni fosse, ni réparation. Les corps déblayés restent à traiter et les murs s'usent
  // jusqu'à tomber (pression maximale sur la maladie et sur les pans menacés).
  negligee: Object.freeze({ walls: true, ditches: true, recruit: true, clear: true, pyre: false, pit: false, sortie: false, repair: false }),
  // Même cité ; avant chaque vague menée, le Commandant sort abattre la Meneuse au bord de la carte.
  sortie: Object.freeze({ walls: true, ditches: true, recruit: true, clear: true, pyre: true, pit: true, sortie: true })
});

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const round = (n, d = 1) => Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : n;

function runSoak(options = {}) {
  const seed = String(options.seed ?? '17117'), waves = options.waves ?? 25, strategyId = options.strategy || 'rempart';
  const S = STRATEGIES[strategyId]; if (!S) throw Error('Stratégie inconnue : ' + strategyId);
  const ages = options.ages || 'promu', aid = options.aid ?? 'munitions', guard = options.guard || 'corps', difficulty = options.difficulty || 'standard';
  const maxSim = options.maxSimSeconds ?? BOT.maxSimSeconds, onWave = options.onWave || null;
  const started = Date.now(), realNow = Date.now, realRandom = Math.random;
  const numeric = Number(seed) >>> 0;
  Math.random = mulberry32(numeric ^ 0x5eed217);
  let calls = 0; const BASE = 1.8e12; Date.now = () => BASE + (++calls);
  const wall = () => realNow();
  try {
    const { bootDocument134 } = require(path.join(ROOT, 'scripts/qa-startup134.cjs'));
    const { g, doc } = bootDocument134();
    // Accélération du DOM factice : `getElementById` y parcourt tout l'arbre à chaque appel. Le banc garde le nœud
    // trouvé tant qu'il reste rattaché au document ; sinon la recherche d'origine reprend. Rien du jeu n'est touché.
    const lookup = doc.getElementById, found = new Map();
    const attached = n => { for (let p = n; p; p = p.parentNode) if (p === doc.body) return true; return false; };
    doc.getElementById = id => { const n = found.get(id); if (n && n.id === id && attached(n)) return n; const m = lookup(id); if (m && attached(m)) found.set(id, m); return m; };
    const C = globalThis.DeadwallCore;
    if (g.startNew(difficulty, seed) === false) throw Error('Campagne refusée pour la graine ' + seed);
    g.campaignIntro132?.skip?.();
    g.random = new C.Random(numeric || 1);
    g.units.forEach((u, i) => { u.offset = { x: 80 + i * 6, y: 10 + i * 6 }; });
    return play(g, C);
  } finally { Math.random = realRandom; Date.now = realNow; }

  function play(g, C) {
    const TILE = C.TILE, T = globalThis.DeadwallTactics, Breach = C.Breach217Rules, LC = C.LINECARE_RULES;
    const core0 = g.core(), fp = T.footprint(core0);
    const cx0 = fp.x, cy0 = fp.y, cx1 = fp.x + fp.width - 1, cy1 = fp.y + fp.height - 1;
    const R = BOT.ring, x0 = cx0 - R, x1 = cx1 + R, y0 = cy0 - R, y1 = cy1 + R;
    const midX = Math.floor((x0 + x1) / 2), midY = Math.floor((y0 + y1) / 2);
    // Portes au milieu de chaque côté (2 × 1 couchée au nord et au sud, debout à l'est et à l'ouest).
    const gates = [{ side: 'north', x: midX, y: y0, rot: 0 }, { side: 'south', x: midX, y: y1, rot: 0 },
      { side: 'west', x: x0, y: midY, rot: 1 }, { side: 'east', x: x1, y: midY, rot: 1 }];
    const gateCells = new Set();
    for (const gt of gates) for (let i = 0; i < 2; i++) gateCells.add(gt.rot ? gt.x + ',' + (gt.y + i) : (gt.x + i) + ',' + gt.y);
    const ring = [];
    for (let x = x0; x <= x1; x++) { ring.push({ x, y: y0 }, { x, y: y1 }); }
    for (let y = y0 + 1; y < y1; y++) { ring.push({ x: x0, y }, { x: x1, y }); }
    const wallCells = ring.filter(c => !gateCells.has(c.x + ',' + c.y));
    // Fossés en travers de l'approche de chaque porte, à `ditchGap` cases dehors.
    const ditchLines = gates.map(gt => gt.rot
      ? { a: { x: gt.x + (gt.side === 'west' ? -BOT.ditchGap : BOT.ditchGap), y: gt.y - BOT.ditchHalf }, b: { x: gt.x + (gt.side === 'west' ? -BOT.ditchGap : BOT.ditchGap), y: gt.y + 1 + BOT.ditchHalf } }
      : { a: { x: gt.x - BOT.ditchHalf, y: gt.y + (gt.side === 'north' ? -BOT.ditchGap : BOT.ditchGap) }, b: { x: gt.x + 1 + BOT.ditchHalf, y: gt.y + (gt.side === 'north' ? -BOT.ditchGap : BOT.ditchGap) } });

    const live = u => u && !u.dead && u.health > 0;
    const notes = [];
    const notify = g.notify;
    g.notify = function (text, tone, ...rest) { notes.push({ wave: g.wave, phase: g.phase, t: g.elapsed, text: String(text), tone }); return notify.call(this, text, tone, ...rest); };
    const records = [], counters = { overlays: {}, orders: 0, builds: 0, walls: 0, ditches: 0, recruits: {}, repairs: 0, pyres: 0, pits: 0, promotions: [], sorties: 0, deaths: 0, recalls: 0, strayKills: 0, ammoAid: 0, lootAid: {}, guardKills: 0 };
    let wave = null;
    const startWave = () => {
      wave = { wave: g.wave, phases: { calm: 0, warning: 0, assault: 0, aftermath: 0 }, moraleMin: g.morale, sickMax: 0, leftMax: 0, countedMax: 0, wallLoadMax: 0,
        pansMax: 0, rampWalls: 0, ruptures: 0, rupturedWorks: 0, threatNotes: 0, waterStageMax: 0, zombiesMax: 0, escortWokenPhase: null, dragLoad: null,
        startNotes: notes.length, startStats: { ...g.stats }, startUnits: unitCounts() };
    };
    function unitCounts() { const c = { worker: 0, soldier: 0, medic: 0, engineer: 0 }; for (const u of g.units) if (live(u) && c[u.kind] !== undefined) c[u.kind]++; return c; }
    const mod = id => { try { return g.expansions.get(id)?.snapshot?.() ?? null; } catch (error) { return null; } };
    function wallLoad() { let n = 0, ramps = 0; for (const b of g.world.buildings.values()) if (!b.dead && b.completed && b.def?.wall && b.corpseLoad > 0) { n += b.corpseLoad; if (b.corpseLoad >= LC.rampMin) ramps++; } return { n, ramps }; }
    function ditchBodies() { try { return (g.earthworks217?.list?.() || []).reduce((n, d) => n + (d.fill || 0), 0); } catch (error) { return 0; } }

    function finishWave(outcome) {
      const W = wave, cc = mod('corpseChain217'), water = mod('cityWater215'), bal = mod('balance217'), ab = mod('abominations217');
      const out = mod('outposts217'), laws = mod('cityLaws217'), load = wallLoad();
      const text = notes.slice(W.startNotes).map(n => n.text);
      const rec = {
        wave: W.wave, outcome, tier: g.tier?.id ?? 0,
        phases: Object.fromEntries(Object.entries(W.phases).map(([k, v]) => [k, round(v)])),
        population: g.population, housing: g.housing, units: unitCounts(),
        morale: round(g.morale), moraleMin: round(W.moraleMin),
        sickness: cc ? { stageMax: W.sickMax, exposure: round(cc.exposure), ill: cc.ill, died: cc.died, saved: cc.saved, pending: round(cc.pending), burned: round(cc.burned), buried: round(cc.buried),
          leftMax: round(W.leftMax), countedMax: round(W.countedMax), threshold: g.corpseChain217?.open?.() ? round(g.corpseChain217.threshold()) : null, open: Boolean(g.corpseChain217?.open?.()) } : null,
        walls: { loadEnd: round(load.n), loadMax: round(W.wallLoadMax), ramps: load.ramps, rampWallsMax: W.rampWalls, ditchBodies: round(ditchBodies()), standing: countWalls(), pansMax: W.pansMax,
          threatNotes: text.filter(t => /menace de céder/.test(t)).length, ruptures: text.filter(t => /^Rupture au/.test(t)).length,
          rupturedWorks: text.map(t => /^Rupture au \S+ : (\d+) ouvrage/.exec(t)).filter(Boolean).reduce((n, m) => n + Number(m[1]), 0),
          destroyed: text.filter(t => /détruit — le secteur est ouvert/.test(t)).length },
        water: water ? { active: water.active, stageMax: W.waterStageMax, dry: round(water.dry), left: water.left, died: water.died, reserve: round(g.cityWater215?.reserve?.()?.water ?? 0) } : null,
        balance: bal ? { departs: bal.departs, low: round(bal.low), signature: round(g.signature), attraction: round(g.balance217?.attraction?.() ?? 0, 3) } : null,
        plan: g.wavePlan ? { total: g.wavePlan.total, fronts: g.wavePlan.fronts } : null,
        led: ab?.led && ab.led.wave === W.wave ? { status: ab.led.status, delta: ab.led.delta, escort: ab.escort ? ab.escort.ids.length : 0, woken: Boolean(ab.escort?.woken), wokenPhase: W.escortWokenPhase,
          roused: notes.slice(W.startNotes).filter(n => /^(Meneuse dérangée|L’escorte de la Meneuse se réveille)/.test(n.text)).map(n => n.phase + '@' + Math.round(n.t)) } : null,
        nextMissing: g.tier.id < C.CITY_TIERS.length - 1 ? C.Balance151.requirements(g.tier.id + 1, { ...g.urban.facts(), surveys: 1e6, pois: 1e6, biomes: 1e6 }).missing.map(m => m.id + ':' + round(m.current) + '/' + m.required) : [],
        siege: W.siege ? { ...W.siege, wallLoadAtDrop: W.dragLoad, rampAtDrop: W.dragLoad === null ? null : W.dragLoad >= LC.rampMin, loadBeforeDrop: W.dragLoad === null ? null : round(W.dragLoad - C.Abominations217Rules.dragger.load) } : null,
        stalled: W.stalled || null,
        outposts: out ? { posts: out.posts?.length || 0, fallen: out.fallen?.length || 0 } : null,
        laws: laws ? { active: laws.active, open: Boolean(g.cityLaws217?.open?.()), engaged: g.cityLaws217?.engaged?.() || [] } : null,
        guardKills: W.guardKills || 0, ammoAid: Math.round(W.ammoAid || 0), lootAid: W.lootAid || null, zombiesMax: W.zombiesMax, kills: (g.stats.kills || 0) - (W.startStats.kills || 0),
        losses: lossesSince(W.startUnits),
        stock: Object.fromEntries(Object.entries(g.resources).map(([k, v]) => [k, Math.round(v)])),
        notes: { sickness: text.filter(t => /^(Salubrité|Maladie)/.test(t)).length, water: text.filter(t => /^(Pénurie d’eau|Eau de cité)/.test(t)).length, morale: text.filter(t => /moral/i.test(t)).length }
      };
      records.push(rec); if (onWave) onWave(rec);
    }
    function lossesSince(before) { const now = unitCounts(); return Object.fromEntries(Object.keys(before).map(k => [k, before[k] - now[k]])); }
    function countWalls() { let n = 0; for (const b of g.world.buildings.values()) if (!b.dead && b.completed && b.def?.wall && b.type !== 'core') n++; return n; }

    // ---- Commandes du joueur simulé ----
    const keys = g.input.keys;
    function steer(target, near = 24) {
      for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) keys.delete(k);
      if (!target) return true;
      const p = g.player; let dx = target.x - p.x, dy = target.y - p.y;
      if (Math.hypot(dx, dy) <= near) { nav.t = g.elapsed; nav.x = p.x; nav.y = p.y; return true; }
      // Contournement : sans progrès d'une seconde, on longe l'obstacle (perpendiculaire, sens alterné) pendant 1,5 s.
      if (g.elapsed - nav.t >= 1) { if (Math.hypot(p.x - nav.x, p.y - nav.y) < 12 && g.elapsed >= nav.detour) { nav.detour = g.elapsed + 1.5; nav.side = -nav.side; } nav.t = g.elapsed; nav.x = p.x; nav.y = p.y; }
      if (g.elapsed < nav.detour) { const rx = -dy * nav.side, ry = dx * nav.side; dx = rx; dy = ry; }
      const n = Math.hypot(dx, dy) || 1;
      if (dx / n > .38) keys.add('KeyD'); else if (dx / n < -.38) keys.add('KeyA');
      if (dy / n > .38) keys.add('KeyS'); else if (dy / n < -.38) keys.add('KeyW');
      return false;
    }
    const nav = { x: 0, y: 0, t: 0, detour: 0, side: 1 };
    function nearestZombie(from, range) { let best = null, d2 = range * range; for (const z of g.zombies) { if (z.dead) continue; const d = (z.x - from.x) ** 2 + (z.y - from.y) ** 2; if (d < d2) { d2 = d; best = z; } } return best; }
    let route = [];
    // Itinéraire à pied du Commandant : parcours en largeur sur les cases, praticables selon le jeu lui-même
    // (`g.friendlyPositionClear` au centre de la case). Une case sur deux devient un point de passage ; le dernier point
    // est la cible elle-même (objet vivant suivi).
    function pathTo(target) {
      const N = g.local?.tiles || C.LOCAL_MAP217.tiles, p = g.player, cell = v => Math.max(0, Math.min(N - 1, Math.floor(v / TILE)));
      const start = cell(p.y) * N + cell(p.x), goal = cell(target.y) * N + cell(target.x), prev = new Int32Array(N * N).fill(-1), open = new Uint8Array(N * N);
      const ok = i => { if (open[i]) return open[i] === 1; const r = g.friendlyPositionClear(p, (i % N + .5) * TILE, (Math.floor(i / N) + .5) * TILE) ? 1 : 2; open[i] = r; return r === 1; };
      const queue = [start]; prev[start] = start;
      for (let head = 0; head < queue.length && prev[goal] < 0; head++) {
        const i = queue[head], x = i % N, y = Math.floor(i / N);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          const j = ny * N + nx; if (prev[j] >= 0) continue;
          if (j !== goal && !ok(j)) continue;
          if (dx && dy && (!ok(y * N + nx) || !ok(ny * N + x))) continue;
          prev[j] = i; queue.push(j);
        }
      }
      if (prev[goal] < 0) return [target];
      const cells = []; for (let i = goal; i !== start; i = prev[i]) cells.push(i); cells.reverse();
      const points = cells.filter((_, k) => k % 2 === 1).map(i => ({ x: (i % N + .5) * TILE, y: (Math.floor(i / N) + .5) * TILE }));
      return [...points.slice(0, -1), target];
    }
    function place(type, test = () => true) {
      const def = C.BUILDINGS[type]; if (!def || def.unlockTier > g.tier.id || def.requires && !g.world.has(def.requires) || !C.canAfford(g.resources, def.cost)) return false;
      const [w, h] = def.size || [1, 1];
      // Intérieur de l'enceinte, une case de marge contre le mur et autour du centre ; recherche en spirale carrée.
      let cx = (cx0 + cx1) / 2, cy = (cy0 + cy1) / 2;
      if (AT_GATES.includes(type)) { const gt = gates[count(type) % gates.length]; cx = gt.x + (gt.rot ? 0 : 1); cy = gt.y + (gt.rot ? 1 : 0); }
      const cells = [];
      for (let y = y0 + 2; y + h - 1 <= y1 - 2; y++) for (let x = x0 + 2; x + w - 1 <= x1 - 2; x++) cells.push({ x, y, d: Math.max(Math.abs(x + w / 2 - cx), Math.abs(y + h / 2 - cy)) * 100 + Math.abs(x - cx) + Math.abs(y - cy) });
      // À défaut de place dedans, au-delà des fossés (la production de plein air d'abord, le reste aussi s'il le faut).
      {
        const gap = BOT.ditchGap + 2, o = BOT.outside;
        for (let y = y0 - o; y <= y1 + o; y++) for (let x = x0 - o; x <= x1 + o; x++) {
          const out = Math.max(x0 - (x + w - 1), x - x1, y0 - (y + h - 1), y - y1);
          if (out >= gap) cells.push({ x, y, d: (OUTSIDE.includes(type) ? 1e6 : 2e6) + out * 100 + Math.abs(x - cx) + Math.abs(y - cy) });
        }
      }
      cells.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
      for (const c of cells) {
        if (!test(c)) continue;
        // Une case libre tout autour : les allées restent ouvertes.
        let roomy = true;
        for (let yy = c.y - 1; yy <= c.y + h && roomy; yy++) for (let xx = c.x - 1; xx <= c.x + w && roomy; xx++) if (g.world.atCell(xx, yy)) roomy = false;
        if (!roomy || !g.world.placement(def, c.x, c.y, 0).valid) continue;
        if (g.placeOne(type, c.x, c.y, 0)) { counters.builds++; return true; }
      }
      return false;
    }
    const count = type => { let n = 0; for (const b of g.world.buildings.values()) if (!b.dead && b.type === type) n++; return n; };
    const spare = (key, extra = 0) => (g.resources[key] || 0) - (BOT.reserve[key] || 0) - extra;
    function buildWalls(budget, hold = 0) {
      let placed = 0;
      for (const gt of gates) {
        if (placed >= budget) break;
        const at = g.world.atCell(gt.x, gt.y); if (at) continue;
        if (spare('wood', 25 + hold) < 0 || spare('scrap', 25) < 0) break;
        if (g.world.placement(C.BUILDINGS.gate, gt.x, gt.y, gt.rot).valid && g.placeOne('gate', gt.x, gt.y, gt.rot)) { const b = g.world.atCell(gt.x, gt.y); if (b) g.setGateMode?.('auto', b); placed++; counters.walls++; }
      }
      for (const c of wallCells) {
        if (placed >= budget || spare('wood', 8 + hold) < 0) break;
        if (g.world.atCell(c.x, c.y)) continue;
        if (!g.world.placement(C.BUILDINGS.woodWall, c.x, c.y, 0).valid) continue;
        if (g.placeOne('woodWall', c.x, c.y, 0)) { placed++; counters.walls++; }
      }
      return placed;
    }
    function digDitches() {
      const E = g.earthworks217; if (!E?.active?.() || !E.unlocked?.()) return 0;
      let laid = 0;
      for (const line of ditchLines) {
        if (spare('wood', 4 * 12) < 0) break;
        const p = E.plan(E.ID, [line.a, line.b]); if (!p.placeable) continue;
        if (E.placeLine(E.ID, [line.a, line.b])) { laid += p.placeable; counters.ditches += p.placeable; }
      }
      return laid;
    }
    function growCity() {
      let first = null;
      for (const [type, want] of PLAN) {
        if (count(type) >= want) continue;
        const def = C.BUILDINGS[type]; if (!def || def.unlockTier > g.tier.id || def.requires && !g.world.has(def.requires)) continue;
        // Garder la réserve de défense : ne construire qu'avec ce qui dépasse.
        // Modèle hors de portée du stock (réserve de défense gardée) ou sans emplacement libre : passer au suivant,
        // en retenant le bois du premier modèle voulu.
        if (Object.entries(def.cost).some(([k, v]) => (g.resources[k] || 0) - (BOT.reserve[k] || 0) < v)) { first = first || def.cost; continue; }
        if (place(type)) return first;
      }
      return first;
    }
    function recruit() {
      if (!S.recruit || g.population >= g.housing) return false;
      const u = unitCounts(), soldiers = Math.max(2, Math.floor(u.worker * .8)), workers = 5 + 2 * g.tier.id;
      const specialists = u.medic + u.engineer, wantSpecialists = Math.max(0, g.tier.id - 1);
      const kind = g.world.has('barracks') && u.soldier < soldiers && g.canRecruit('soldier') && spare('ammo', 40) >= 0 ? 'soldier'
        : specialists < wantSpecialists && u.medic <= u.engineer && g.canRecruit('medic') ? 'medic'
        : specialists < wantSpecialists && g.canRecruit('engineer') && spare('scrap', 35) >= 0 ? 'engineer'
        : u.worker < workers && (u.soldier >= 2 || !g.world.has('barracks')) && g.canRecruit('worker') && spare('food', 25) >= 0 ? 'worker' : null;
      if (!kind) return false;
      if (g.recruit(kind)) { counters.recruits[kind] = (counters.recruits[kind] || 0) + 1; return true; }
      return false;
    }
    // Réparation à l'unité (fiche de l'ouvrage, « Réparer »), des ouvrages de mur les plus abîmés sous `repairBelow`.
    function repairWalls(budget) {
      const hurt = [...g.world.buildings.values()].filter(b => !b.dead && b.completed && b.def?.wall && b.health < b.maxHealth * BOT.repairBelow)
        .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth || a.id - b.id);
      let done = 0;
      for (const b of hurt) {
        if (done >= budget || spare('scrap', 10) < 0 || spare('wood', 10) < 0) break;
        const q = g.structureActionStatus('repair', b); if (!q?.ok) continue;
        g.selectBuilding(b); if (g.repairSelected() !== false && b.health >= b.maxHealth - 1e-6) { done++; counters.repairs++; }
      }
      if (done) g.selectBuilding(null);
      return done;
    }
    function workerOrder() {
      const siege = g.phase === 'warning' || g.phase === 'assault';
      const want = siege ? 'retreat' : S.clear && (wallLoad().n + ditchBodies()) > BOT.clearAbove ? 'clear' : 'auto';
      if (g.workerOrder !== want && g.setWorkerOrder(want)) counters.orders++;
    }
    function corpseWork(atDepot) {
      const K = g.corpseChain217; if (!K?.open?.() || !atDepot) return;
      if (S.pyre && !K.burning() && K.pending() >= BOT.pyreAbove) {
        const fuel = spare('wood', 20) >= 0 ? 'wood' : (g.resources.fuel || 0) > 10 ? 'fuel' : null;
        if (fuel && K.light(fuel).ok) counters.pyres++;
      }
      if (S.pit && g.phase === 'calm') { const pit = K.pit(); if (!pit.digging && !pit.open && spare('wood', 20) >= 0 && K.openPit().ok) counters.pits++; }
    }
    function promote() {
      if (ages !== 'promu' || g.phase !== 'calm') return;
      const D = C.Balance151, age = g.tier.id; if (age >= C.CITY_TIERS.length - 1) return;
      const facts = g.urban.facts(), relaxed = { ...facts, surveys: 1e6, pois: 1e6, biomes: 1e6 };
      if (!D.requirements(age + 1, relaxed).met) return;
      const data = g.serialize();
      data.urban.peakScore = Math.max(data.urban.peakScore, C.CITY_TIERS[age + 1].requiredScore);
      data.urban.progression151 = { version: 1, age: age + 1 };
      const random = g.random;
      if (g.restoreSave(data)) { g.random = random; g.refreshMetrics(true); counters.promotions.push({ wave: g.wave, age: age + 1, at: round(g.elapsed) }); }
    }
    function overlays() {
      if (g.successionUI133?.isOpen?.()) { counters.deaths++; g.successionUI133.choose('builder'); g.successionUI133.confirm(); }
      if (g.campaignIntro132?.isOpen?.()) g.campaignIntro132.skip();
      if (g.loadoutUI?.isOpen?.()) g.loadoutUI.dismiss?.();
      if (g.activeOverlay || g.paused) {
        const id = g.activeOverlay?.id || (g.paused ? 'pause' : 'autre'); counters.overlays[id] = (counters.overlays[id] || 0) + 1;
        try { g.showCommand?.(false); } catch (error) { /* rien */ }
        if (g.paused) g.togglePause(false);
        if (g.activeOverlay && typeof g.closeOverlay === 'function') g.closeOverlay();
      }
    }
    let hunting = false, home = null, replans = 0;
    function commandant() {
      const p = g.player, core = g.core(); if (!core || !live(p)) { g.input.touchFire = g.input.mouseDown = false; steer(null); return false; }
      const siege = g.phase === 'warning' || g.phase === 'assault';
      // Sortie : avant une vague menée, aller abattre la Meneuse (au bord de la carte), par la porte la plus proche.
      const led = S.sortie && g.phase === 'calm' ? g.abominations217?.leader?.() : null;
      if (S.sortie && !siege && led && !hunting && g.phaseTime > 25) {
        const z = g.zombies.find(o => o.id === led.id && !o.dead);
        if (z) { route = pathTo(z); hunting = true; counters.sorties++; }
      }
      if (hunting && (siege || !led || g.phaseTime < 15)) { hunting = false; route = pathTo(core); }
      let atDepot = false;
      // « Au dépôt » : la portée de travail du jeu autour du centre (celle que lisent le bûcher, la fosse, l'eau, les lois).
      const depot = () => g.workerCanWorkAt(p, core, BOT.depotRange);
      if (route.length && route[route.length - 1] === core && depot()) route = [];
      // Retour au dépôt : itinéraire recalculé toutes les `homeReplan` s (une porte a pu s'ouvrir) ; au-delà de
      // `homeRecall` s, aide de banc déclarée : le Commandant est remis au dépôt par la position d'arrivée du jeu.
      if (!hunting && !depot()) {
        if (home === null) home = g.elapsed;
        else if (g.elapsed - home > BOT.homeRecall) { Object.assign(p, g.coreArrivalPosition(p, { x: core.x + 80, y: core.y })); route = []; home = null; counters.recalls++; }
        else if (g.elapsed - home > BOT.homeReplan * (1 + replans)) { route = pathTo(core); replans++; }
      } else { home = null; replans = 0; }
      if (route.length) {
        // En chasse, le dernier point est la Meneuse elle-même : on s'en approche à portée de pistolet et on y reste.
        const target = route[0], last = route.length === 1 && target !== core;
        if (steer(target, last ? BOT.huntRange : 30) && !last) route.shift();
      } else if (!depot()) route = pathTo(core);
      else { steer(null); atDepot = true; }
      const range = hunting ? BOT.fireRange : siege ? BOT.fireRange : BOT.guardRange, z = nearestZombie(p, range);
      // Corps à corps au contact (touche Espace) ; le tir seulement s'il reste des munitions au-delà de la réserve.
      const close = nearestZombie(p, BOT.meleeRange);
      if (close) { p.facing = Math.atan2(close.y - p.y, close.x - p.x); g.input.pressed.add('Space'); }
      g.input.touchFire = g.input.mouseDown = Boolean(z) && !close && ((g.resources.ammo || 0) > BOT.ammoFloor || p.magazine[p.weapon] > 0);
      return atDepot && !z && !(p.reload > 0);
    }

    // ---- Boucle ----
    startWave();
    const stall = { n: 0, t: 0 };
    let think = 0, lastPhase = g.phase, wallStarted = wall(), simStart = g.elapsed;
    const uiBefore = () => [g.uiTimer, g.minimapTimer];
    while (!g.gameOver && g.wave <= waves && g.elapsed - simStart < maxSim) {
      overlays();
      think -= BOT.step;
      if (think <= 0) {
        think += BOT.think;
        const atDepot = commandant();
        workerOrder();
        if (g.phase === 'calm' || g.phase === 'aftermath') {
          promote();
          // Les premiers ateliers de production, puis l'enceinte fermée, puis le reste : le mur prend le bois qui dépasse
          // le prochain modèle voulu, et tout le bois tant que l'enceinte n'est pas fermée ou à l'approche de la vague.
          const closed = S.walls && wallCells.every(c => g.world.atCell(c.x, c.y)) && gates.every(gt => g.world.atCell(gt.x, gt.y));
          const early = PLAN.slice(0, BOT.firstModels).some(([type, n]) => count(type) < n && C.BUILDINGS[type].unlockTier <= g.tier.id);
          const want = !S.walls || closed || early ? growCity() : null, hold = early ? (want?.wood || 0) : !closed || g.phase === 'calm' && g.phaseTime < BOT.wallRush ? 0 : (want?.wood || 0);
          if (S.walls) buildWalls(g.phase === 'calm' ? 12 : 0, hold);
          if (S.ditches && closed && spare('wood', BOT.ditchWood) >= 0) digDitches();
          recruit();
          if (g.phase === 'calm' && S.repair !== false) repairWalls(BOT.repairPerThink);
        }
        corpseWork(atDepot);
      } else commandant();
      if (options.progress && Math.floor(g.elapsed / options.progress) !== Math.floor((g.elapsed + BOT.step) / options.progress))
        process.stderr.write(['t=' + Math.round(g.elapsed), 'v' + g.wave, g.phase, 'z' + g.zombies.length, 'pop' + g.population, 'âge' + g.tier.id, 'bât' + g.world.buildings.size, 'mur' + count('woodWall'), 'bois' + Math.round(g.resources.wood), 'mun' + Math.round(g.resources.ammo), 'cœur' + Math.round(g.core()?.health || 0), 'cdt' + (g.player.dead ? 'mort' : Math.round(g.player.health) + '@' + Math.round(C.dist(g.player, g.core() || g.player))), (wall() - wallStarted) + ' ms', hunting ? 'chasse→' + JSON.stringify(route.map(r => [Math.round(r.x), Math.round(r.y)])) + ' p' + Math.round(g.player.x) + ',' + Math.round(g.player.y) : '',
          g.zombies.length <= 2 ? g.zombies.map(z => z.kind + '@' + Math.round(z.x) + ',' + Math.round(z.y) + (z.dead ? '†' : '') + (z.regionAbsent ? 'abs' : '')).join(' ') : ''].join(' ') + '\n');
      // Aide de banc déclarée : un assaut bloqué par quelques infectés égarés (coincés dans le décor, au plus `strayMax`)
      // est clos après `stallSeconds` sans changement, comme le soak technique retire ses ennemis. Compté au rapport.
      if (g.phase === 'assault' && !g.spawnQueue.length && !C.spawnCount(g.pendingSpawns)) {
        const alive = g.zombies.filter(z => !z.dead);
        // Assaut figé : effectif inchangé depuis `stallSeconds`, soit avec au plus `strayMax` égarés, soit quel que soit
        // l'effectif quand l'assaut dure depuis plus de `stallAssault` s (masse coincée hors de portée des défenses).
        const long = wave.phases.assault > BOT.stallAssault;
        if (alive.length && (alive.length <= BOT.strayMax || long) && alive.length === stall.n) stall.t += BOT.step; else { stall.n = alive.length; stall.t = 0; }
        if (stall.t >= BOT.stallSeconds) {
          const core = g.core(); wave.stalled = { n: alive.length, near: core ? alive.filter(z => C.dist(z, core) < 700).length : 0, giants: Boolean(g.vertical175?.hasActiveSiege?.()), at: round(wave.phases.assault) };
          for (const z of alive) g.killZombie(z, false); counters.strayKills += alive.length; stall.t = 0;
        }
      } else stall.t = 0;
      // Garde de banc déclarée (même option) : un infecté entré dans l'enceinte en est retiré. Le centre ne tombe donc
      // pas : le banc mesure la pression sur l'enceinte et la cité (corps, pans, brèches, maladie, eau, moral), pas la
      // survie. `guard: 'corps'` (défaut) l'abat par `g.killZombie`, à la brèche, comme un défenseur : son corps compte
      // au pied du mur voisin (borne haute de la pression des corps). `guard: 'sans'` le retire sans corps (borne basse).
      if (aid === 'munitions') for (const z of g.zombies) {
        if (z.dead) continue; const tx = z.x / TILE, ty = z.y / TILE;
        if (tx > x0 + 1 && tx < x1 && ty > y0 + 1 && ty < y1) { if (guard === 'corps') g.killZombie(z, false); else { z.dead = true; z.health = 0; } wave.guardKills = (wave.guardKills || 0) + 1; counters.guardKills++; }
      }
      const [u0, m0] = uiBefore();
      g.update(BOT.step); g.input.pressed.clear();
      if (g.uiTimer > u0) g.uiTimer = BOT.uiSeconds;
      if (g.minimapTimer > m0) g.minimapTimer = BOT.minimapSeconds;
      // Relevés continus de la vague en cours.
      const W = wave; W.phases[lastPhase] = (W.phases[lastPhase] || 0) + BOT.step;
      W.moraleMin = Math.min(W.moraleMin, g.morale);
      const K = g.corpseChain217; if (K?.open?.()) { W.sickMax = Math.max(W.sickMax, K.stage()); W.leftMax = Math.max(W.leftMax, K.left()); W.countedMax = Math.max(W.countedMax, K.counted()); }
      const L = wallLoad(); W.wallLoadMax = Math.max(W.wallLoadMax, L.n); W.rampWalls = Math.max(W.rampWalls, L.ramps);
      W.pansMax = Math.max(W.pansMax, g.breach217?.threatened?.()?.length || 0);
      if (g.cityWater215?.needed?.()) W.waterStageMax = Math.max(W.waterStageMax, g.cityWater215.stage());
      W.zombiesMax = Math.max(W.zombiesMax, g.zombies.length);
      const esc = g.abominations217?.escort?.(); if (esc && esc.woken && W.escortWokenPhase === null && esc.wave === W.wave) W.escortWokenPhase = g.phase;
      const sc = g.abominationsSiege217?.current?.(); if (sc && sc.wave === W.wave) W.siege = { kind: sc.kind, status: sc.status, count: sc.count }; if (sc && sc.kind === 'drag' && sc.count === 1 && W.dragLoad === null) { const b = g.world.buildings.get(sc.wall); W.dragLoad = b ? round(b.corpseLoad) : null; }
      if (g.phase !== lastPhase) {
        // Aide de banc déclarée (option `aid`, « munitions » par défaut) : à l'alerte, la réserve de munitions est
        // remontée à `ammoAid.base + ammoAid.perWave × vague` (plafond de stockage). La stratégie n'a pas d'usine de
        // munitions avant l'âge Forteresse ; sans cette aide, la cité tombe faute de tir vers la vague 3, avant que les
        // systèmes éprouvés ici n'entrent en jeu. Quantité donnée comptée par vague et au total.
        if (g.phase === 'warning' && aid === 'munitions') {
          const want = Math.min(g.storage, BOT.ammoAid.base + BOT.ammoAid.perWave * g.wave), given = Math.max(0, want - (g.resources.ammo || 0));
          if (given > 0) { g.resources.ammo += given; W.ammoAid = (W.ammoAid || 0) + given; counters.ammoAid += given; }
        }
        // Ravitaillement de banc (même option) : à la fin de chaque vague repoussée, l'équivalent du butin de sortie que
        // la stratégie, restée à D-17, ne rapporte pas : `lootAid` par ressource, plus `perWave` × vague.
        if (lastPhase === 'aftermath' && g.phase === 'calm' && aid === 'munitions') {
          for (const [key, n] of Object.entries(BOT.lootAid.base)) {
            const before = g.resources[key] || 0, after = Math.min(g.storage, before + n + BOT.lootAid.perWave[key] * W.wave);
            g.resources[key] = after; W.lootAid = W.lootAid || {}; W.lootAid[key] = Math.round(after - before); counters.lootAid[key] = (counters.lootAid[key] || 0) + after - before;
          }
        }
        if (lastPhase === 'aftermath' && g.phase === 'calm') { finishWave('repoussée'); startWave(); }
        lastPhase = g.phase;
      }
    }
    if (g.gameOver) finishWave('chute');
    else if (g.wave <= waves) finishWave('inachevée');
    for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) keys.delete(k);
    return {
      seed, strategy: strategyId, ages, aid, guard, difficulty, wavesAsked: waves, reached: records.filter(r => r.outcome === 'repoussée').length,
      fell: Boolean(g.gameOver), simulatedSeconds: round(g.elapsed - simStart), wallSeconds: round((wall() - wallStarted) / 1000),
      counters, records, layout: { ring: R, gates: gates.length, wallCells: wallCells.length, ditchCells: ditchLines.length * (BOT.ditchHalf * 2 + 2) }
    };
  }
}

// ---- Résumés et ligne de commande ----
function summarize(report) {
  const r = report.records, last = r[r.length - 1] || {};
  const max = (f) => r.reduce((n, x) => Math.max(n, f(x) ?? 0), 0), sum = f => r.reduce((n, x) => n + (f(x) || 0), 0);
  const firstSick = r.find(x => (x.sickness?.stageMax || 0) >= 2);
  return {
    seed: report.seed, strategy: report.strategy, guard: report.guard, reached: report.reached, fell: report.fell, lastWave: last.wave, tier: last.tier,
    population: last.population, moraleEnd: last.morale, moraleMin: Math.min(...r.map(x => x.moraleMin)),
    sickFirstWave: firstSick ? firstSick.wave : null, sickStageMax: max(x => x.sickness?.stageMax), sickWaves: r.filter(x => (x.sickness?.stageMax || 0) >= 2).length,
    ill: last.sickness?.ill ?? 0, sickDeaths: last.sickness?.died ?? 0, leftMax: max(x => x.sickness?.leftMax), countedMax: max(x => x.sickness?.countedMax), thresholdEnd: last.sickness?.threshold ?? null,
    ruptures: sum(x => x.walls.ruptures), rupturedWorks: sum(x => x.walls.rupturedWorks), ruptureWaves: r.filter(x => x.walls.ruptures > 0).length, pansMax: max(x => x.walls.pansMax),
    destroyed: sum(x => x.walls.destroyed), waterStageMax: max(x => x.water?.stageMax), departs: last.balance?.departs ?? 0, attractionEnd: last.balance?.attraction ?? 0,
    led: r.filter(x => x.led).map(x => x.wave + ':' + x.led.status + (x.led.woken ? '/réveil-' + x.led.wokenPhase : '')).join(' '),
    siege: r.filter(x => x.siege).map(x => x.wave + ':' + x.siege.kind + ':' + x.siege.status + (x.siege.kind === 'drag' && x.siege.count ? '@' + x.siege.wallLoadAtDrop : '')).join(' '),
    stalls: r.filter(x => x.stalled).length, leak: round(sum(x => x.guardKills) / Math.max(1, sum(x => x.plan?.total)), 2), ammoAid: Math.round(sum(x => x.ammoAid)),
    fallenOutposts: last.outposts?.fallen ?? 0, simulatedSeconds: report.simulatedSeconds, wallSeconds: report.wallSeconds
  };
}

function parse(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2), v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true'; o[k] = v; } }
  return o;
}
async function cli() {
  const o = parse(process.argv.slice(2));
  if (o.child) {
    const job = JSON.parse(o.child), report = runSoak(job);
    process.stdout.write('\n@@SOAK217@@' + JSON.stringify(report) + '\n'); return;
  }
  const seeds = o.seeds ? o.seeds.split(',') : SEEDS.slice(), strategies = o.strategies ? o.strategies.split(',') : Object.keys(STRATEGIES);
  const waves = Number(o.waves || 25), jobs = Math.min(2, Math.max(1, Number(o.jobs || 2))), ages = o.ages || 'promu';
  const guard = o.guard || 'corps', queue = []; for (const strategy of strategies) for (const seed of seeds) queue.push({ seed, strategy, waves, ages, guard, maxSimSeconds: Number(o['max-sim'] || BOT.maxSimSeconds) });
  const { spawn } = require('node:child_process'), fs = require('node:fs'), results = [];
  async function worker() {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const report = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [__filename, '--child', JSON.stringify(job)], { stdio: ['ignore', 'pipe', 'inherit'] });
        let out = ''; child.stdout.on('data', d => { out += d; });
        child.on('exit', code => { const at = out.lastIndexOf('@@SOAK217@@'); if (at < 0) reject(Error('Banc interrompu (' + code + ') pour ' + JSON.stringify(job))); else resolve(JSON.parse(out.slice(at + 11))); });
      });
      results.push(report); const s = summarize(report);
      process.stderr.write(JSON.stringify(s) + '\n');
      if (o.out) fs.writeFileSync(o.out, JSON.stringify(results, null, 1));
    }
  }
  await Promise.all(Array.from({ length: jobs }, worker));
  if (o.out) fs.writeFileSync(o.out, JSON.stringify(results, null, 1));
  console.table(results.map(summarize));
}
module.exports = { runSoak, summarize, SEEDS, STRATEGIES, BOT, PLAN };
if (require.main === module) cli().catch(error => { console.error(error); process.exitCode = 1; });
