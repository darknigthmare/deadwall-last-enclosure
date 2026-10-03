/** Explicit physical integration fixture, shared by the browser and its Node regression. */
export function maximumObservedAssaultFixture() {
  const g = globalThis.DEADWALL, C = globalThis.DeadwallCore, B = globalThis.DeadwallBattlefield;
  const core = g.core(), Building = core.constructor, directions = [[0, -1200], [1200, 0], [0, 1200], [-1200, 0]];
  if (!g.paused || g.zombies.length < 5) throw Error('Layout fixture requires real pause and five existing live contacts');
  const stocks = JSON.stringify(g.resources), rng = g.random.state, urbanPeakBefore = g.urban.snapshot().peakScore;
  const originalAmmo = g.resources.ammo, changed = [], posts = [];
  // These real miradors observe contacts. Zero common ammo prevents their real
  // combat controller from killing the measured contacts after the menu closes.
  g.resources.ammo = 0;
  for (let i = 0; i < directions.length; i++) {
    const z = g.zombies[i], before = { x: z.x, y: z.y }, direction = B.DIRECTIONS[i].id;
    if (z.dead || z.health <= 0) throw Error('Use living contacts emitted by the real assault');
    const gx = Math.floor((core.x + directions[i][0]) / C.TILE) - 1;
    const gy = Math.floor((core.y + directions[i][1]) / C.TILE) - 1;
    let post = null;
    for (let ring = 0; ring <= 8 && !post; ring++) {
      for (let dy = -ring; dy <= ring && !post; dy++) for (let dx = -ring; dx <= ring && !post; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring || !g.world.placement(C.BUILDINGS.watchtower, gx + dx, gy + dy, 0).valid) continue;
        const candidate = new Building(g.nextId, 'watchtower', gx + dx, gy + dy, 0, 1);
        g.world.add(candidate);
        for (const distance of [96, 80, 64, 112]) {
          for (const [ox, oy] of [[0, -distance], [distance, 0], [0, distance], [-distance, 0]]) {
            z.x = candidate.x + ox; z.y = candidate.y + oy;
            if (B.direction(core, z) === direction && !g.world.solidForFriendly(z.x, z.y) && g.visibility.frame().canSeeLocal(z)) { post = candidate; break; }
          }
          if (post) break;
        }
        if (!post) g.world.remove(candidate);
      }
    }
    if (!post) throw Error('No legal physical observation post for ' + direction);
    g.nextId++;
    posts.push({ id: post.id, type: post.type, gx: post.gx, gy: post.gy, x: post.x, y: post.y, completed: post.completed });
    changed.push({ id: z.id, before, after: { x: z.x, y: z.y }, observer: post.id, observed: g.visibility.canSeeLocal(z) });
  }
  const inner = g.zombies[4], before = { x: inner.x, y: inner.y };
  let found = false;
  for (const distance of [64, 80, 96, 112, 48]) {
    for (const [dx, dy] of [[0, -distance], [distance, 0], [0, distance], [-distance, 0]]) {
      inner.x = g.player.x + dx; inner.y = g.player.y + dy;
      if (Math.hypot(inner.x - core.x, inner.y - core.y) <= C.BATTLEFIELD_RULES.innerRadius && !g.world.solidForFriendly(inner.x, inner.y) &&
        g.hostileLineClear(g.player, inner) && g.visibility.canSeeLocal(inner)) { found = true; break; }
    }
    if (found) break;
  }
  if (!found) throw Error('No real player sightline to a contact inside the centre alert radius');
  changed.push({ id: inner.id, before, after: { x: inner.x, y: inner.y }, observer: 'player', observed: true });
  g.refreshMetrics(true);
  // Save validation requires the urban historical high to cover actual buildings.
  g.urban.attain(C.Urban.score(g.world.buildings.values()));
  g.battlefieldUI.refresh(true); g.updateUI();
  if (g.random.state !== rng) throw Error('Observation fixture changed RNG');
  const originalStocks = JSON.parse(stocks), expectedStocks = { ...originalStocks, ammo: 0 };
  if (JSON.stringify(g.resources) !== JSON.stringify(expectedStocks)) throw Error('Observation fixture changed undeclared material');
  return { type: 'synthetic-four-physically-observed-fronts-and-inner-alert', changed, posts, originalAmmo, ammo: g.resources.ammo,
    urbanPeakBefore, urbanPeakAfter: g.urban.snapshot().peakScore, rngPreserved: true,
    assignedFields: ['five-existing-contact-positions', 'four-completed-watchtower-buildings', 'nextId', 'resources.ammo', 'urban.peakScore'],
    notes: 'Five existing living contacts repositioned and four legally placed observation posts added. Common ammo explicitly set to zero to prevent real defence fire during layout/Continue checks. Urban history follows real built score. No enemy added, health changed, arrival budget changed, player moved or perception stubbed.' };
}
