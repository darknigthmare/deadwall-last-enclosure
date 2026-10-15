(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DeadwallTransit173=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

/** Explicit multi-level transit graph. Crossed strokes never create a junction. */
const MODES = new Set(['foot', 'vehicle', 'boat']);
const KINDS = new Set(['road', 'ramp', 'stairs', 'portal', 'water', 'walkway']);
const LEVEL_LINKS = new Set(['ramp', 'stairs', 'portal']);
function finite(v) { return typeof v === 'number' && Number.isFinite(v); }
function id(v) { if (typeof v !== 'string' || !/^[A-Za-z][A-Za-z0-9:_-]{0,95}$/.test(v)) throw Error('Identifiant invalide'); return v; }
function freeze(v) { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
function compile(spec) {
  if (!spec || !Array.isArray(spec.nodes) || !spec.nodes.length || spec.nodes.length > 512 || !Array.isArray(spec.edges) || spec.edges.length > 2048) throw Error('Réseau invalide');
  const ids = new Set(), nodes = spec.nodes.map(n => { id(n.id); if (ids.has(n.id) || ![n.x, n.y].every(finite) || !Number.isInteger(n.level) || Math.abs(n.level) > 32) throw Error('Nœud invalide'); ids.add(n.id); return { id: n.id, x: n.x, y: n.y, level: n.level }; });
  const byId = new Map(nodes.map(n => [n.id, n])), edgeIds = new Set();
  const edges = spec.edges.map(e => {
    id(e.id); if (!KINDS.has(e.kind || 'road') || (e.riseM !== undefined && (!finite(e.riseM) || e.riseM < 0))) throw Error('Type de liaison ou dénivelé invalide'); const a = byId.get(e.from), b = byId.get(e.to);
    if (edgeIds.has(e.id) || !a || !b || a.id === b.id || !Array.isArray(e.modes) || !e.modes.length || e.modes.some(m => !MODES.has(m))) throw Error('Liaison invalide'); edgeIds.add(e.id);
    if (a.level !== b.level && !LEVEL_LINKS.has(e.kind)) throw Error('Changement de niveau non explicite');
    if (e.kind === 'stairs' && e.modes.some(m => m !== 'foot')) throw Error('Escalier non carrossable');
    if (e.kind === 'water' && e.modes.some(m => m !== 'boat')) throw Error('Voie d’eau non carrossable');
    if(e.kind!=='water'&&e.modes.includes('boat'))throw Error('Un bateau exige une voie d’eau.');
    const width=e.width??(e.modes.includes('vehicle')?7:e.modes.includes('boat')?6:2);if(!finite(width)||width<=0||width>100)throw Error('Largeur invalide');
    const points = e.points ? e.points.map(p => { if (!Array.isArray(p) || p.length !== 2 || !p.every(finite)) throw Error('Tracé invalide'); return p.slice(); }) : [[a.x, a.y], [b.x, b.y]];
    if (points.length < 2 || points.length > 128 || Math.hypot(points[0][0] - a.x, points[0][1] - a.y) > 1e-6 || Math.hypot(points.at(-1)[0] - b.x, points.at(-1)[1] - b.y) > 1e-6) throw Error('Extrémités du tracé incohérentes');
    const length = points.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
    if (length <= 0) throw Error('Liaison sans distance physique');
    if (e.kind === 'ramp' && (!finite(e.riseM) || e.riseM <= 0 || e.riseM / length > .10)) throw Error('Pente de rampe non prise en charge');
    return { id: e.id, from: a.id, to: b.id, modes: [...new Set(e.modes)].sort(), kind: e.kind || 'road', points, length, bidirectional: e.bidirectional !== false, riseM: e.riseM ?? 0, width };
  });
  return freeze({ version: 1, id: id(spec.id), nodes, edges, topology:JSON.stringify([nodes,edges]) });
}
function route(net, from, to, mode = 'foot', closed = []) {
  if (!MODES.has(mode) || !net.nodes.some(n => n.id === from) || !net.nodes.some(n => n.id === to) || !Array.isArray(closed) || closed.some(e => !net.edges.some(x => x.id === e))) throw Error('Demande de trajet invalide');
  const banned = new Set(closed), adjacency = new Map(net.nodes.map(n => [n.id, []]));
  for (const e of net.edges) if (!banned.has(e.id) && e.modes.includes(mode)) { adjacency.get(e.from).push({ to: e.to, edge: e, reverse: false }); if (e.bidirectional) adjacency.get(e.to).push({ to: e.from, edge: e, reverse: true }); }
  const distance = new Map([[from, 0]]), prev = new Map(), settled = new Set();
  for (let count = 0; count < net.nodes.length; count++) {
    const next = [...distance].filter(([n]) => !settled.has(n)).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0];
    if (!next) break; const [at, d] = next; settled.add(at); if (at === to) break;
    for (const step of adjacency.get(at).sort((a, b) => a.edge.id.localeCompare(b.edge.id))) { const nd = d + step.edge.length; if (nd < (distance.get(step.to) ?? Infinity) - 1e-9) { distance.set(step.to, nd); prev.set(step.to, { from: at, ...step }); } }
  }
  if (!settled.has(to)) return null;
  const steps = []; let at = to;
  while (at !== from) { const p = prev.get(at); if (!p || steps.length >= net.nodes.length) throw Error('Chaîne de trajet incohérente'); steps.push({ edge: p.edge.id, from: p.from, to: at, kind: p.edge.kind, points: (p.reverse ? p.edge.points.slice().reverse() : p.edge.points).map(p => p.slice()) }); at = p.from; }
  steps.reverse(); return { from, to, mode, length: distance.get(to), steps };
}
function tunnel() {
  return compile({ id: 'tunnel', nodes: [
    { id: 'west', x: -180, y: 0, level: 0 }, { id: 'entry', x: -90, y: 0, level: -1 },
    { id: 'exit', x: 90, y: 0, level: -1 }, { id: 'east', x: 180, y: 0, level: 0 },
    { id: 'refuge', x: 0, y: 8, level: -1 }, { id: 'middle', x: 0, y: 0, level: -1 },
    { id: 'surfaceNorth', x: 0, y: -180, level: 0 }, { id: 'surfaceSouth', x: 0, y: 180, level: 0 }
  ], edges: [
    { id: 'descent', from: 'west', to: 'entry', kind: 'ramp', riseM: 6, modes: ['foot', 'vehicle'] },
    { id: 'galleryWest', from: 'entry', to: 'middle', modes: ['foot', 'vehicle'] },
    { id: 'galleryEast', from: 'middle', to: 'exit', modes: ['foot', 'vehicle'] },
    { id: 'ascent', from: 'exit', to: 'east', kind: 'ramp', riseM: 6, modes: ['foot', 'vehicle'] },
    { id: 'shelterAccess', from: 'middle', to: 'refuge', modes: ['foot'] },
    { id: 'unconnectedSurfaceRoad', from: 'surfaceNorth', to: 'surfaceSouth', modes: ['foot', 'vehicle'] }
  ] });
}
function interchange() {
  const modes = ['vehicle'];
  return compile({ id: 'interchange', nodes: [
    { id: 'west', x: -220, y: 0, level: 0 }, { id: 'westJunction', x: -140, y: 0, level: 0 },
    { id: 'eastJunction', x: 140, y: 0, level: 0 }, { id: 'east', x: 220, y: 0, level: 0 },
    { id: 'north', x: 0, y: -220, level: 1 }, { id: 'northJunction', x: 0, y: -140, level: 1 },
    { id: 'southJunction', x: 0, y: 140, level: 1 }, { id: 'south', x: 0, y: 220, level: 1 }
  ], edges: [
    { id: 'westAccess', from: 'west', to: 'westJunction', modes }, { id: 'lowerDeck', from: 'westJunction', to: 'eastJunction', modes }, { id: 'eastAccess', from: 'eastJunction', to: 'east', modes },
    { id: 'northAccess', from: 'north', to: 'northJunction', modes }, { id: 'upperDeck', from: 'northJunction', to: 'southJunction', modes }, { id: 'southAccess', from: 'southJunction', to: 'south', modes },
    ...[['wn', 'westJunction', 'northJunction', [-140, 0], [-140, -140], [0, -140]], ['ws', 'westJunction', 'southJunction', [-140, 0], [-140, 140], [0, 140]], ['en', 'eastJunction', 'northJunction', [140, 0], [140, -140], [0, -140]], ['es', 'eastJunction', 'southJunction', [140, 0], [140, 140], [0, 140]]].map(([key, from, to, a, c, b]) => ({ id: 'ramp-' + key, from, to, points: [a, c, b], kind: 'ramp', riseM: 6, modes }))
  ] });
}
function port(coast) {
  if (!coast || !Array.isArray(coast.a) || !Array.isArray(coast.b) || coast.a.length !== 2 || coast.b.length !== 2 || ![...coast.a, ...coast.b].every(finite) || !['left', 'right'].includes(coast.waterSide)) throw Error('Côte réelle et côté eau requis');
  const dx = coast.b[0] - coast.a[0], dy = coast.b[1] - coast.a[1], length = Math.hypot(dx, dy); if (length < 200) throw Error('Segment de côte insuffisant');
  const ux = dx / length, uy = dy / length, sign = coast.waterSide === 'left' ? 1 : -1, nx = -uy * sign, ny = ux * sign;
  const pos = (along, depth) => [coast.a[0] + along * ux + depth * nx, coast.a[1] + along * uy + depth * ny];
  const defs = [['gate', 100, -55], ['yard', 100, -25], ['quayWest', 35, -5], ['quayEast', 165, -5], ['waterWest', 35, 35], ['waterEast', 165, 35]];
  const nodes = defs.map(([key, along, depth]) => { const [x, y] = pos(along, depth); return { id: key, x, y, level: 0 }; });
  const graph = compile({ id: 'port', nodes, edges: [
    { id: 'yardAccess', from: 'gate', to: 'yard', modes: ['foot', 'vehicle'] },
    { id: 'westQuayAccess', from: 'yard', to: 'quayWest', modes: ['foot', 'vehicle'] },
    { id: 'eastQuayAccess', from: 'yard', to: 'quayEast', modes: ['foot', 'vehicle'] },
    { id: 'watersideChannel', from: 'waterWest', to: 'waterEast', modes: ['boat'], kind: 'water' }
  ] });
  return freeze({ graph, coastline: { a: coast.a.slice(), b: coast.b.slice(), waterSide: coast.waterSide },
    scope: 'isolated-topology-requires-approved-terrain-and-road-attachment',
    requirements: ['terrain-footprint-validation', 'actual-road-connection', 'quay-and-water-colliders', 'loading-interaction'],
    // Cargo transfer is an interaction, not a free pedestrian edge across water.
    loadingPairs: [{ land: 'quayWest', water: 'waterWest' }, { land: 'quayEast', water: 'waterEast' }] });
}
return Object.freeze({ compile, route, tunnel, interchange, port });

});
