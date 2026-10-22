/* Metre-based inspection geometry for authored 2026 sites. No campaign registration. */
(function (root, factory) {
  'use strict';
  const api = factory();
  root.DeadwallCodexPhysical2026 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const EPS = 1e-8;
  const DEFAULT_RADIUS = .32;
  const MAX_MOVE = 1000;
  const SCOPE = 'physical-inspection-not-campaign';
  const finite = (...values) => values.every(Number.isFinite);
  const rect = value => value && finite(value.x, value.y, value.w, value.h) && value.w > 0 && value.h > 0;
  const clone = value => JSON.parse(JSON.stringify(value));
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const inside = (box, x, y) => x >= box.x - EPS && y >= box.y - EPS && x <= box.x + box.w + EPS && y <= box.y + box.h + EPS;
  const overlaps = (a, b) => a.x < b.x + b.w - EPS && a.x + a.w > b.x + EPS && a.y < b.y + b.h - EPS && a.y + a.h > b.y + EPS;
  const contains = (a, b) => inside(a, b.x, b.y) && inside(a, b.x + b.w, b.y + b.h);

  function pointSegmentDistance2(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
    const t = length2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2)) : 0;
    return (p.x - a.x - t * dx) ** 2 + (p.y - a.y - t * dy) ** 2;
  }
  function pointRectDistance2(p, box) {
    return Math.max(box.x - p.x, 0, p.x - box.x - box.w) ** 2 + Math.max(box.y - p.y, 0, p.y - box.y - box.h) ** 2;
  }
  function segmentIntersectsRect(a, b, box) {
    let low = 0, high = 1;
    for (const [start, delta, min, max] of [[a.x, b.x - a.x, box.x, box.x + box.w], [a.y, b.y - a.y, box.y, box.y + box.h]]) {
      if (Math.abs(delta) < EPS) { if (start < min || start > max) return false; }
      else {
        const first = (min - start) / delta, last = (max - start) / delta;
        low = Math.max(low, Math.min(first, last)); high = Math.min(high, Math.max(first, last));
        if (low > high) return false;
      }
    }
    return true;
  }
  function segmentRectDistance2(a, b, box) {
    if (segmentIntersectsRect(a, b, box)) return 0;
    return Math.min(pointRectDistance2(a, box), pointRectDistance2(b, box),
      ...[[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]]
        .map(([x, y]) => pointSegmentDistance2({ x, y }, a, b)));
  }

  // Partition the support union exactly at rectangle boundaries. Testing the
  // swept disc against uncovered cells also catches narrow unsupported gaps.
  function supportedSweep(scene, a, b, level, radius) {
    const region = { x: Math.min(a.x, b.x) - radius, y: Math.min(a.y, b.y) - radius,
      w: Math.abs(a.x - b.x) + radius * 2, h: Math.abs(a.y - b.y) + radius * 2 };
    if (!contains(scene.bounds, region)) return false;
    const surfaces = scene.surfaces.filter(s => s.level === level && overlaps(s, region));
    if (!surfaces.length) return false;
    if (surfaces.some(s => contains(s, region))) return true;
    const xs = [...new Set([region.x, region.x + region.w, ...surfaces.flatMap(s => [s.x, s.x + s.w]).filter(x => x > region.x && x < region.x + region.w)])].sort((x, y) => x - y);
    const ys = [...new Set([region.y, region.y + region.h, ...surfaces.flatMap(s => [s.y, s.y + s.h]).filter(y => y > region.y && y < region.y + region.h)])].sort((x, y) => x - y);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const cell = { x: xs[i], y: ys[j], w: xs[i + 1] - xs[i], h: ys[j + 1] - ys[j] };
      if (surfaces.some(s => inside(s, cell.x + cell.w / 2, cell.y + cell.h / 2))) continue;
      if (segmentRectDistance2(a, b, cell) < radius * radius - EPS) return false;
    }
    return true;
  }
  function segmentClear(scene, a, b, level, radius = DEFAULT_RADIUS) {
    if (!scene || !finite(a?.x, a?.y, b?.x, b?.y, radius) || radius <= 0 || radius > 10 || !Number.isInteger(level) || !scene.levels.some(l => l.index === level)) return false;
    if (!supportedSweep(scene, a, b, level, radius)) return false;
    return ![...scene.walls, ...scene.solids].some(s => s.level === level && segmentRectDistance2(a, b, s) < radius * radius - EPS);
  }
  function blocked(scene, x, y, level, radius = DEFAULT_RADIUS) {
    try { return !segmentClear(scene, { x, y }, { x, y }, level, radius); } catch { return true; }
  }

  function build(author) {
    if (!author || author.playable !== false || author.units !== 'm' || typeof author.id !== 'string') throw Error('Plan auteur métrique requis.');
    const maritime = author.scope === 'author-maritime-layout-not-live-world';
    if (!maritime && author.scope !== 'author-metric-layout-not-live-world') throw Error('Type de plan auteur inconnu.');
    const bounds = clone(maritime ? author.hull : author.bounds);
    if (!rect(bounds)) throw Error('Emprise physique invalide.');
    const scene = { version: 1, id: author.id, scope: SCOPE, playable: false, units: 'm', sourceScope: author.scope,
      bounds: { x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h }, levels: [], rooms: [], surfaces: [], walls: [], solids: [],
      portals: [], transitions: [], reservations: [], areas: [], nodes: [], edges: [], entry: null, adaptations: [],
      limits: ['Inspection isolée : aucune implantation dans le seed ni modification de campagne.',
        'Butin, rencontres, services et graphismes définitifs restent des chantiers distincts.'] };
    const nodeMap = new Map(), roomMap = new Map();
    function addLevel(id, elevationM, clearHeightM) {
      if (typeof id !== 'string' || !finite(elevationM, clearHeightM) || clearHeightM <= 0 || scene.levels.some(l => l.id === id)) throw Error('Niveau physique invalide.');
      const value = { id, index: scene.levels.length, elevationM, clearHeightM };
      scene.levels.push(value); return value;
    }
    function addNode(id, x, y, level) {
      if (typeof id !== 'string' || nodeMap.has(id) || !finite(x, y) || !scene.levels.some(l => l.index === level)) throw Error('Borne physique invalide.');
      const value = { id, x, y, level }; nodeMap.set(id, value); scene.nodes.push(value); return value;
    }
    function addEdge(id, from, to, kind = 'walk', widthM = 1.2) {
      if (!nodeMap.has(from) || !nodeMap.has(to) || from === to || !finite(widthM) || widthM <= 0 || scene.edges.some(e => e.id === id)) throw Error('Liaison physique invalide.');
      scene.edges.push({ id, from, to, kind, widthM, modes: ['pedestrian'] });
    }
    function addSurface(id, box, level, kind) {
      if (!rect(box)) throw Error('Surface sans emprise.');
      scene.surfaces.push({ id, x: box.x, y: box.y, w: box.w, h: box.h, level, kind });
    }
    function addRoom(room, level, offset = { x: 0, y: 0 }) {
      if (!rect(room) || typeof room.id !== 'string' || roomMap.has(room.id)) throw Error('Pièce physique invalide.');
      const value = { id: room.id, name: room.name, kind: room.kind || (room.name === 'circulation' ? 'circulation' : 'compartment'),
        x: offset.x + room.x, y: offset.y + room.y, w: room.w, h: room.h,
        level: level.index, sourceLevel: level.id, elevationM: level.elevationM, clearHeightM: room.clearHeightM || level.clearHeightM };
      if (!contains(scene.bounds, value)) throw Error('Pièce hors emprise.');
      scene.rooms.push(value); roomMap.set(value.id, value); addSurface(value.id + ':floor', value, value.level, 'room'); return value;
    }
    function addWall(id, box, level) {
      if (box.w > EPS && box.h > EPS) scene.walls.push({ id, ...box, level, kind: 'wall', solid: true });
    }
    function perimeter(box, level, openings, thickness, prefix, faces = ['north', 'south', 'west', 'east'], inward = false) {
      for (const face of faces) {
        const horizontal = face === 'north' || face === 'south', start = horizontal ? box.x : box.y, length = horizontal ? box.w : box.h;
        const selected = openings.filter(o => o.face === face).map(o => [o.at - o.widthM / 2, o.at + o.widthM / 2]).sort((a, b) => a[0] - b[0]);
        let cursor = start, count = 0;
        for (const interval of [...selected, [start + length, start + length]]) {
          if (interval[0] < start - EPS || interval[1] > start + length + EPS || interval[0] < cursor - EPS) throw Error('Ouverture hors mur ou chevauchée.');
          const span = interval[0] - cursor;
          const x = horizontal ? cursor : face === 'west' ? box.x + (inward ? 0 : -thickness) : box.x + box.w - (inward ? thickness : 0);
          const y = horizontal ? face === 'north' ? box.y + (inward ? 0 : -thickness) : box.y + box.h - (inward ? thickness : 0) : cursor;
          addWall(prefix + ':' + face + ':' + count++, { x, y, w: horizontal ? span : thickness, h: horizontal ? thickness : span }, level);
          cursor = interval[1];
        }
      }
    }
    function portal(source, offset = { x: 0, y: 0 }) {
      const from = roomMap.get(source.from), to = roomMap.get(source.to);
      if (!from || !to || from.level !== to.level || !finite(source.x, source.y, source.widthM) || source.widthM < .64 || !['x', 'y'].includes(source.axis)) throw Error('Porte physique invalide.');
      const d = { id: source.id, from: from.id, to: to.id, x: offset.x + source.x, y: offset.y + source.y, axis: source.axis, widthM: source.widthM, level: from.level };
      const horizontal = d.axis === 'x', roomBefore = horizontal ? to.y + to.h / 2 < from.y + from.h / 2 : to.x + to.w / 2 < from.x + from.w / 2;
      d.fromFace = horizontal ? roomBefore ? 'north' : 'south' : roomBefore ? 'west' : 'east';
      d.toFace = horizontal ? roomBefore ? 'south' : 'north' : roomBefore ? 'east' : 'west';
      const a = horizontal ? (roomBefore ? to.y + to.h : from.y + from.h) : (roomBefore ? to.x + to.w : from.x + from.w);
      const b = horizontal ? (roomBefore ? from.y : to.y) : (roomBefore ? from.x : to.x);
      if (b < a - EPS || b - a > .5) throw Error('Porte sans pièces adjacentes.');
      d.threshold = horizontal ? { x: d.x - d.widthM / 2, y: a - EPS, w: d.widthM, h: b - a + EPS * 2 } : { x: a - EPS, y: d.y - d.widthM / 2, w: b - a + EPS * 2, h: d.widthM };
      const roomFace = horizontal ? d.toFace === 'north' ? to.y : to.y + to.h : d.toFace === 'west' ? to.x : to.x + to.w;
      const corridorFace = horizontal ? d.fromFace === 'north' ? from.y : from.y + from.h : d.fromFace === 'west' ? from.x : from.x + from.w;
      const coordinate = horizontal ? d.y : d.x;
      if (Math.min(Math.abs(coordinate - roomFace), Math.abs(coordinate - corridorFace)) > EPS) throw Error('Porte éloignée de sa face.');
      scene.portals.push(d); addSurface(d.id + ':threshold', d.threshold, d.level, 'threshold'); return d;
    }
    function roomWalls(room, thickness, faces) {
      const openings = scene.portals.filter(d => d.from === room.id || d.to === room.id).map(d => ({ face: d.from === room.id ? d.fromFace : d.toFace, at: d.axis === 'x' ? d.x : d.y, widthM: d.widthM }));
      perimeter(room, room.level, openings, thickness, room.id + ':wall', faces);
    }

    if (maritime) {
      if (!Array.isArray(author.levels) || !Array.isArray(author.rooms) || !Array.isArray(author.portals) || !Array.isArray(author.nodes) || !Array.isArray(author.links) || !Array.isArray(author.reservations) || !Array.isArray(author.boarding)) throw Error('Schéma maritime incomplet.');
      for (const source of author.levels) addLevel(source.id, source.elevationM, source.clearHeightM);
      for (const source of author.rooms) {
        const level = scene.levels.find(l => l.id === source.level);
        if (!level || Math.abs(source.z - level.elevationM) > EPS) throw Error('Étage et élévation maritime incohérents.');
        addRoom(source, level);
      }
      for (const source of author.portals) portal(source);
      for (const room of scene.rooms) roomWalls(room, .18);
      for (const source of author.nodes) {
        if (!finite(source.x, source.y, source.z)) throw Error('Borne maritime invalide.');
        let level = scene.levels.find(l => Math.abs(l.elevationM - source.z) < EPS);
        if (!level) {
          if (!author.boarding.some(b => b.node === source.id && b.mode === 'hatch') || Math.abs(source.z - author.mainDeck.elevationM) > EPS) throw Error('Borne sans pont déclaré.');
          level = addLevel('boarding-hatch', source.z, 2.1);
          addSurface(source.id + ':landing', { x: source.x - .6, y: source.y - .6, w: 1.2, h: 1.2 }, level.index, 'hatch-landing');
          scene.adaptations.push({ kind: 'limited-hatch-landing', source: source.id, note: 'Seul le palier du panneau est accessible ; le pont extérieur complet reste à réaliser.' });
        }
        addNode(source.id, source.x, source.y, level.index);
      }
      for (const source of author.links) {
        if (!Array.isArray(source.modes) || source.modes.some(m => m !== 'pedestrian') || !['corridor', 'door', 'stairs', 'ladder'].includes(source.kind)) throw Error('Mode de liaison maritime invalide.');
        const from = nodeMap.get(source.from), to = nodeMap.get(source.to);
        if (!from || !to) throw Error('Extrémité maritime absente.');
        if (['stairs', 'ladder'].includes(source.kind)) {
          if (from.level === to.level || Math.abs(from.x - to.x) > EPS || Math.abs(from.y - to.y) > EPS) throw Error('Transition maritime non alignée.');
          scene.transitions.push({ id: source.id, kind: source.kind, from: from.level, to: to.level, widthM: source.widthM,
            a: { x: from.x, y: from.y, level: from.level }, b: { x: to.x, y: to.y, level: to.level }, nodeFrom: from.id, nodeTo: to.id, activationRadiusM: .9, modes: ['pedestrian'] });
        } else if (from.level !== to.level) throw Error('Passage horizontal entre deux ponts.');
        addEdge(source.id, source.from, source.to, ['stairs', 'ladder'].includes(source.kind) ? source.kind : 'walk', source.widthM);
      }
      for (const reservation of author.reservations) {
        if (!rect(reservation) || reservation.walkable !== false || reservation.connected !== false) throw Error('Réserve maritime invalide.');
        scene.reservations.push(clone(reservation));
        for (const level of scene.levels) if (Math.abs(level.elevationM - reservation.z) < EPS || reservation.clearHeightM !== null && level.elevationM >= reservation.z && level.elevationM < reservation.z + reservation.clearHeightM) {
          scene.solids.push({ id: reservation.id + ':closed:' + level.index, x: reservation.x, y: reservation.y, w: reservation.w, h: reservation.h, level: level.index, kind: reservation.kind, solid: true, accessible: false });
        }
      }
      if (!author.boarding.length || author.boarding.some(b => b.connectedToWorld !== false || !nodeMap.has(b.node))) throw Error('Raccord maritime extérieur non pris en charge.');
      const entryNode = nodeMap.get(author.boarding[0].node);
      scene.entry = { x: entryNode.x, y: entryNode.y, level: entryNode.level, node: entryNode.id, kind: author.boarding[0].mode, connectedToWorld: false };
      scene.limits.push('La coque est une enveloppe auteur. Cales, citernes et ponts réservés restent fermés.', 'Le point d’embarquement ne crée aucun passage sur la mer.');
    } else {
      if (!Array.isArray(author.buildings) || !Array.isArray(author.structures) || !Array.isArray(author.reservedAreas) || !Array.isArray(author.network?.nodes) || !Array.isArray(author.network?.edges) || !Array.isArray(author.network?.externalPorts)) throw Error('Schéma de site incomplet.');
      const ground = addLevel('ground', 0, Math.max(2.8, author.maxHeightM || 2.8));
      addSurface(author.id + ':ground', bounds, 0, 'ground');
      // Outdoor composition is a visible part of the same plot. Ground remains
      // the physical support; a planted area does not create a resource owner.
      const areaIds = new Set();
      if (author.outdoorAreas !== undefined && !Array.isArray(author.outdoorAreas)) throw Error('Espaces extérieurs invalides.');
      for (const source of [...author.reservedAreas, ...(author.outdoorAreas || [])]) {
        if (!rect(source) || !contains(bounds, source) || typeof source.id !== 'string' || areaIds.has(source.id) ||
            typeof source.kind !== 'string' || source.level !== 0) throw Error('Espace extérieur hors emprise ou répété.');
        areaIds.add(source.id);
        scene.areas.push({...clone(source), name: source.name || source.kind, level: 0, inspectionOnly: true});
      }
      for (const structure of author.structures) {
        if (!rect(structure) || !contains(bounds, structure)) throw Error('Structure hors emprise.');
        scene.solids.push({ id: structure.id, x: structure.x, y: structure.y, w: structure.w, h: structure.h, level: 0, kind: structure.kind, solid: true, accessible: false });
        scene.reservations.push({ ...clone(structure), walkable: false, connected: false });
      }
      for (const source of author.network.nodes) {
        if (source.z !== 0) throw Error('Niveau du réseau de site non pris en charge.');
        const structure = author.structures.find(s => s.id === source.id && s.kind === 'wind-turbine');
        let x = source.x, y = structure && Math.abs(source.y - structure.y) < EPS ? source.y - .5 : source.y;
        if (author.network.externalPorts.some(port => port.node === source.id)) {
          if (Math.abs(x - bounds.x) < EPS) x += .5;
          else if (Math.abs(x - bounds.x - bounds.w) < EPS) x -= .5;
          if (Math.abs(y - bounds.y) < EPS) y += .5;
          else if (Math.abs(y - bounds.y - bounds.h) < EPS) y -= .5;
          if (x !== source.x || y !== source.y) scene.adaptations.push({kind: 'external-port-inside-boundary', node: source.id, sourcePosition: {x: source.x, y: source.y}, offsetM: .5});
        }
        addNode(source.id, x, y, 0);
        if (structure && y !== source.y) scene.adaptations.push({ kind: 'service-stop-clearance', node: source.id, sourcePosition: { x: source.x, y: source.y }, offsetM: .5 });
      }
      for (const source of author.network.edges) {
        if (source.level !== 0) throw Error('Changement de niveau routier implicite.');
        addEdge(source.id, source.from, source.to, 'walk', source.widthM);
      }
      for (const building of author.buildings) {
        if (!rect(building) || building.rotationRad !== 0 || !Array.isArray(building.rooms) || !Array.isArray(building.portals) || !rect({ x: 0, y: 0, w: building.w, h: building.h }) || !contains(bounds, building)) throw Error('Bâtiment auteur invalide.');
        const rooms = building.rooms.map(r => addRoom(r, ground, building));
        for (const d of building.portals) portal(d, building);
        for (const r of rooms) roomWalls(r, .18, r.kind === 'circulation' ? ['west', 'east'] : undefined);
        const e = building.entry;
        if (!e || e.level !== 0 || !finite(e.x, e.y, e.widthM) || e.widthM < .64 || !['north', 'south'].includes(building.entrySide) || e.y !== (building.entrySide === 'north' ? 0 : building.h)) throw Error('Entrée du bâtiment invalide.');
        perimeter(building, 0, [{ face: building.entrySide, at: building.x + e.x, widthM: e.widthM }], .18, building.id + ':outer', undefined, true);
        const corridor = rooms.find(r => r.kind === 'circulation');
        if (!corridor) throw Error('Bâtiment sans circulation.');
        const centre = addNode(corridor.id + ':physical-center', corridor.x + corridor.w / 2, corridor.y + corridor.h / 2, 0);
        const entry = scene.nodes.find(n => Math.abs(n.x - building.x - e.x) < EPS && Math.abs(n.y - building.y - e.y) < EPS);
        if (!entry) throw Error('Entrée sans réseau de site.');
        addEdge(building.id + ':entry-link', entry.id, centre.id, 'walk', e.widthM);
        for (const d of scene.portals.filter(p => p.from === corridor.id)) {
          const r = roomMap.get(d.to), approach = addNode(d.id + ':approach', centre.x, d.y, 0), target = addNode(r.id + ':center', r.x + r.w / 2, r.y + r.h / 2, 0);
          addEdge(d.id + ':corridor-link', centre.id, approach.id, 'walk', corridor.w);
          addEdge(d.id + ':room-link', approach.id, target.id, 'walk', d.widthM);
        }
      }
      // Enter the football field through the genuine gap between two stands.
      const safe = author.reservedAreas.find(a => a.kind === 'clear-pitch'), field = author.reservedAreas.find(a => a.kind === 'field-of-play');
      if (safe && field) {
        const nw = scene.nodes.find(n => n.id === author.id + ':nw');
        if (!nw) throw Error('Accès extérieur du stade absent.');
        const a = addNode(author.id + ':pitch-approach', nw.x, safe.y - 1, 0);
        const b = addNode(author.id + ':pitch-gap', safe.x - 1, safe.y - 1, 0);
        const c = addNode(author.id + ':pitch-centre', field.x + field.w / 2, field.y + field.h / 2, 0);
        addEdge(author.id + ':pitch-access-0', nw.id, a.id, 'walk', 1.2);
        addEdge(author.id + ':pitch-access-1', a.id, b.id, 'walk', 1.2);
        addEdge(author.id + ':pitch-access-2', b.id, c.id, 'walk', 1.2);
      }
      if (!author.network.externalPorts.length || author.network.externalPorts.some(p => p.connectedToWorld !== false || !nodeMap.has(p.node))) throw Error('Raccord extérieur de site non pris en charge.');
      const entryNode = nodeMap.get(author.network.externalPorts[0].node);
      // The author gate lies exactly on the plot edge. Start just inside it.
      let x = entryNode.x, y = entryNode.y;
      if (Math.abs(y - bounds.y) < EPS) y += .5;
      else if (Math.abs(y - bounds.y - bounds.h) < EPS) y -= .5;
      else if (Math.abs(x - bounds.x) < EPS) x += .5;
      else if (Math.abs(x - bounds.x - bounds.w) < EPS) x -= .5;
      scene.entry = { x, y, level: 0, node: entryNode.id, kind: 'site-gate', connectedToWorld: false };
      if (x !== entryNode.x || y !== entryNode.y) { entryNode.x = x; entryNode.y = y; scene.adaptations.push({ kind: 'entry-inside-boundary', offsetM: .5 }); }
      if (author.structures.some(s => ['stand', 'wind-turbine'].includes(s.kind))) scene.limits.push('Les tribunes et les fûts d’éoliennes sont des volumes fermés ; leurs intérieurs ne sont pas réalisés.');
      if (scene.areas.length && !safe) scene.limits.push('Les jardins, cultures et cours décrivent un aménagement auteur ; aucune récolte ni production n’est créée.');
      scene.limits.push('Les voies de service sont inspectées à pied ; ce module ne qualifie aucun gabarit de véhicule.');
    }
    for (const room of scene.rooms) if (room.kind !== 'circulation' && !scene.portals.some(p => p.to === room.id)) throw Error('Pièce sans ouverture physique.');
    return freeze(scene);
  }

  function move(scene, pose, dx, dy, radius = DEFAULT_RADIUS) {
    const unchanged = () => ({ ok: false, pose: pose && { ...pose }, moved: 0, blocked: true, reason: 'invalid-movement' });
    if (!pose || !finite(pose.x, pose.y, dx, dy, radius) || radius <= 0 || radius > 10 || Math.hypot(dx, dy) > MAX_MOVE || blocked(scene, pose.x, pose.y, pose.level, radius)) return unchanged();
    const result = { ...pose }, count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(.02, Math.min(.16, radius / 2))));
    let obstructed = false;
    for (let i = 0; i < count; i++) {
      const stepX = dx / count, stepY = dy / count, end = { x: result.x + stepX, y: result.y + stepY };
      if (segmentClear(scene, result, end, result.level, radius)) { result.x = end.x; result.y = end.y; continue; }
      obstructed = true;
      const xOnly = { x: result.x + stepX, y: result.y };
      if (stepX && segmentClear(scene, result, xOnly, result.level, radius)) result.x = xOnly.x;
      const yOnly = { x: result.x, y: result.y + stepY };
      if (stepY && segmentClear(scene, result, yOnly, result.level, radius)) result.y = yOnly.y;
    }
    return { ok: true, pose: result, moved: Math.hypot(result.x - pose.x, result.y - pose.y), blocked: obstructed, reason: obstructed ? 'physical-obstacle' : null };
  }
  function transition(scene, pose, transitionId, radius = DEFAULT_RADIUS) {
    const no = reason => ({ ok: false, pose: pose && { ...pose }, reason });
    const edge = scene?.transitions?.find(e => e.id === transitionId);
    if (!edge || !pose || !finite(pose.x, pose.y, radius) || radius <= 0 || radius > 10 || ![edge.from, edge.to].includes(pose.level)) return no('unknown-transition-or-level');
    if (pose.mode && !['foot', 'pedestrian'].includes(pose.mode)) return no('pedestrian-only');
    if (edge.widthM < radius * 2 + EPS) return no('transition-too-narrow');
    const from = pose.level === edge.from ? edge.a : edge.b, to = pose.level === edge.from ? edge.b : edge.a;
    if (Math.hypot(pose.x - from.x, pose.y - from.y) > edge.activationRadiusM || !segmentClear(scene, pose, from, from.level, radius)) return no('landing-out-of-reach');
    if (blocked(scene, to.x, to.y, to.level, radius)) return no('destination-blocked');
    return { ok: true, pose: { ...pose, x: to.x, y: to.y, level: to.level }, reason: null };
  }

  function withProps(scene, props) {
    if (!Array.isArray(props) || props.length > 5000 || !audit(scene).ok) throw Error('Scène physique ou mobilier invalide.');
    const ids = new Set([...scene.walls, ...scene.solids].map(o => o.id)), additions = [], copied = [];
    for (const source of props) {
      const room = scene.rooms.find(r => r.id === source?.roomId);
      if (!rect(source) || typeof source.id !== 'string' || ids.has(source.id) || !room || source.level !== room.level || !contains(room, source) || typeof source.solid !== 'boolean') throw Error('Mobilier hors pièce, répété ou sans niveau : ' + source?.id);
      ids.add(source.id);
      const prop = clone(source); copied.push(prop);
      if (!prop.solid) continue;
      if ([...scene.walls, ...scene.solids, ...additions].some(s => s.level === prop.level && overlaps(s, prop))) throw Error('Chevauchement de mobilier : ' + prop.id);
      additions.push({ id: prop.id, roomId: prop.roomId, kind: prop.kind, x: prop.x, y: prop.y, w: prop.w, h: prop.h, level: prop.level, solid: true });
    }
    const result = { ...scene, solids: [...scene.solids, ...additions], props: copied };
    const check = audit(result);
    if (!check.ok) throw Error('Mobilier bloquant un accès physique : ' + check.errors[0].id);
    for (const prop of copied) if (prop.access) {
      const room = scene.rooms.find(r => r.id === prop.roomId), access = prop.access;
      if (!rect(access) || !contains(room, access) || blocked(result, access.x + access.w / 2, access.y + access.h / 2, prop.level)) throw Error('Face de service inaccessible : ' + prop.id);
    }
    return freeze(result);
  }

  function audit(scene, radius = DEFAULT_RADIUS) {
    const errors = [], reject = (code, id) => errors.push({ code, id });
    try {
      if (!scene || scene.version !== 1 || scene.scope !== SCOPE || scene.playable !== false || scene.units !== 'm' || !rect(scene.bounds) || !finite(radius) || radius <= 0 || !['levels', 'rooms', 'surfaces', 'walls', 'solids', 'portals', 'transitions', 'nodes', 'edges', 'reservations'].every(k => Array.isArray(scene[k]))) throw Error('schema');
      const levelIds = new Set(), indices = new Set(), nodeIds = new Set();
      for (const level of scene.levels) {
        if (levelIds.has(level.id) || indices.has(level.index) || !Number.isInteger(level.index) || !finite(level.elevationM, level.clearHeightM) || level.clearHeightM <= 0) reject('invalid-level', level.id);
        levelIds.add(level.id); indices.add(level.index);
      }
      const shapeIds = new Set();
      for (const box of [...scene.rooms, ...scene.surfaces, ...scene.walls, ...scene.solids]) {
        if (!rect(box) || !indices.has(box.level) || !contains(scene.bounds, box) || typeof box.id !== 'string' || shapeIds.has(box.id)) reject('invalid-box', box.id);
        shapeIds.add(box.id);
      }
      const areaIds = new Set();
      if (scene.areas !== undefined && !Array.isArray(scene.areas)) reject('invalid-outdoor-areas', scene.id);
      for (const area of scene.areas || []) {
        if (!rect(area) || !contains(scene.bounds, area) || !indices.has(area.level) || typeof area.id !== 'string' ||
            areaIds.has(area.id) || typeof area.kind !== 'string' || area.inspectionOnly !== true) reject('invalid-outdoor-area', area?.id);
        areaIds.add(area.id);
      }
      for (let i = 0; i < scene.rooms.length; i++) for (let j = i + 1; j < scene.rooms.length; j++) if (scene.rooms[i].level === scene.rooms[j].level && overlaps(scene.rooms[i], scene.rooms[j])) reject('overlapping-rooms', scene.rooms[i].id);
      for (const r of scene.rooms) if (blocked(scene, r.x + r.w / 2, r.y + r.h / 2, r.level, radius)) reject('room-centre-blocked', r.id);
      for (const s of scene.reservations) if (s.walkable !== false || s.connected !== false) reject('reservation-open', s.id);
      const portalIds = new Set();
      for (const p of scene.portals) {
        const a = scene.rooms.find(r => r.id === p.from), b = scene.rooms.find(r => r.id === p.to);
        if (portalIds.has(p.id) || !a || !b || a.level !== p.level || b.level !== p.level || !['x', 'y'].includes(p.axis) || p.widthM < radius * 2 || !rect(p.threshold) || blocked(scene, p.x, p.y, p.level, radius)) reject('invalid-portal', p.id);
        portalIds.add(p.id);
      }
      const transitionIds = new Set();
      for (const t of scene.transitions) {
        const a = scene.levels.find(l => l.index === t.from), b = scene.levels.find(l => l.index === t.to);
        if (transitionIds.has(t.id) || !a || !b || a.index === b.index || !finite(t.a?.x, t.a?.y, t.b?.x, t.b?.y) || t.a.level !== t.from || t.b.level !== t.to || Math.abs(t.a.x - t.b.x) > EPS || Math.abs(t.a.y - t.b.y) > EPS || Math.abs(a.elevationM - b.elevationM) > 4.8 || t.widthM < radius * 2 || !['stairs', 'ladder'].includes(t.kind)) reject('invalid-transition', t.id);
        transitionIds.add(t.id);
      }
      const nodes = new Map(), adjacency = new Map();
      for (const n of scene.nodes) {
        if (nodeIds.has(n.id) || blocked(scene, n.x, n.y, n.level, radius)) reject('node-blocked-or-duplicate', n.id);
        nodeIds.add(n.id); nodes.set(n.id, n); adjacency.set(n.id, []);
      }
      const edgeIds = new Set();
      for (const e of scene.edges) {
        const a = nodes.get(e.from), b = nodes.get(e.to);
        if (edgeIds.has(e.id) || !a || !b || e.widthM < 2 * radius || !['walk', 'stairs', 'ladder'].includes(e.kind)) { reject('invalid-edge', e.id); continue; }
        edgeIds.add(e.id);
        let valid = false;
        if (e.kind === 'walk') valid = a.level === b.level && segmentClear(scene, a, b, a.level, radius);
        else {
          const forward = transition(scene, a, e.id, radius), reverse = transition(scene, b, e.id, radius);
          valid = forward.ok && reverse.ok && forward.pose.level === b.level && reverse.pose.level === a.level && Math.hypot(forward.pose.x - b.x, forward.pose.y - b.y) < EPS && Math.hypot(reverse.pose.x - a.x, reverse.pose.y - a.y) < EPS;
        }
        if (!valid) reject('edge-not-traversable', e.id);
        else { adjacency.get(a.id).push(b.id); adjacency.get(b.id).push(a.id); }
      }
      if (!scene.entry || blocked(scene, scene.entry.x, scene.entry.y, scene.entry.level, radius) || !nodes.has(scene.entry.node) || scene.entry.connectedToWorld !== false) reject('invalid-entry', scene.id);
      const seen = new Set(nodes.has(scene.entry?.node) ? [scene.entry.node] : []), queue = [...seen];
      for (let i = 0; i < queue.length; i++) for (const next of adjacency.get(queue[i]) || []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
      for (const n of scene.nodes) if (!seen.has(n.id)) reject('disconnected-node', n.id);
      for (const r of scene.rooms.filter(r => r.kind !== 'circulation')) if (!scene.portals.some(p => p.to === r.id)) reject('room-without-portal', r.id);
    } catch (error) { reject('schema', String(error.message)); }
    return { ok: errors.length === 0, scope: SCOPE, playable: false, errors, rooms: scene?.rooms?.filter(r => r.kind !== 'circulation').length || 0,
      levels: scene?.levels?.length || 0, walls: scene?.walls?.length || 0, transitions: scene?.transitions?.length || 0, radiusM: radius };
  }
  return Object.freeze({ build, blocked, move, transition, withProps, audit, segmentClear, DEFAULT_RADIUS });
});
