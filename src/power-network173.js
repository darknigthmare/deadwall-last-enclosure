(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DeadwallPower173=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

/**
 * Finite radial electricity model for native Codex sites.
 * No mutation, background tick, global world, save ownership or automatic fuel.
 * This model is NOT wired into the historical G8 campaign by loading the module.
 */
const LIMITS = Object.freeze({ nodes: 1024, edges: 1023, dt: 60, fuel: 10000 });
const TYPES = new Set(['source', 'junction', 'breaker', 'load']);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function number(v, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw Error(name + ' invalide');
  return v;
}
function ident(v) {
  if (typeof v !== 'string' || !/^[A-Za-z][A-Za-z0-9:_-]{0,95}$/.test(v) || ['constructor', 'prototype', '__proto__'].includes(v)) throw Error('Identifiant invalide');
  return v;
}
function freeze(v) { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.values(v).forEach(freeze); Object.freeze(v); } return v; }
function compile(spec) {
  if (!spec || !Array.isArray(spec.nodes) || !spec.nodes.length || spec.nodes.length > LIMITS.nodes || !Array.isArray(spec.edges) || spec.edges.length > LIMITS.edges) throw Error('Circuit absent ou trop grand');
  const ids = new Set(), nodes = spec.nodes.map(n => {
    ident(n.id); if (ids.has(n.id) || !TYPES.has(n.kind)) throw Error('Nœud invalide ou répété'); ids.add(n.id);
    const o = { id: n.id, kind: n.kind, level: n.level ?? 0 };
    if (!Number.isSafeInteger(o.level) || Math.abs(o.level) > 32) throw Error('Niveau invalide');
    if (n.kind === 'source') {
      o.capacityW = number(n.capacityW, 'Puissance', 1, 1000000);
      o.fuelPerKWh = number(n.fuelPerKWh, 'Consommation', .001, 1000);
      o.idleFuelPerHour = number(n.idleFuelPerHour ?? 0, 'Consommation à vide', 0, 1000);
      o.tankCapacity = number(n.tankCapacity, 'Réservoir', .001, LIMITS.fuel);
    }
    if (n.kind === 'load') { o.demandW = number(n.demandW, 'Demande', 1, 1000000); o.priority = number(n.priority ?? 0, 'Priorité', 0, 100); }
    return o;
  }).sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map(nodes.map(n => [n.id, n])), incoming = new Map(), edgeIds = new Set();
  const edges = spec.edges.map(e => {
    ident(e.id); if (edgeIds.has(e.id)) throw Error('Câble répété'); edgeIds.add(e.id);
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b || a.id === b.id || a.kind === 'load' || b.kind === 'source' || incoming.has(b.id)) throw Error('Réseau non radial ou borne inconnue');
    if (a.level !== b.level && e.riser !== true) throw Error('Liaison verticale non déclarée');
    const o = { id: e.id, from: a.id, to: b.id, capacityW: number(e.capacityW, 'Capacité du câble', 1, 1000000), riser: e.riser === true };
    incoming.set(b.id, o); return o;
  }).sort((a, b) => a.id.localeCompare(b.id));
  const paths = {};
  for (const n of nodes) {
    const visited = new Set(), route = [], cables = []; let at = n;
    while (at && at.kind !== 'source') {
      if (visited.has(at.id)) throw Error('Boucle électrique interdite'); visited.add(at.id); route.push(at.id);
      const e = incoming.get(at.id); if (!e) break; cables.push(e.id); at = byId.get(e.from);
    }
    if (n.kind === 'load') paths[n.id] = at?.kind === 'source' ? { source: at.id, nodes: route, edges: cables } : null;
  }
  return freeze({ version: 1, id: ident(spec.id), nodes, edges, paths, topology:JSON.stringify([nodes,edges]) });
}
function initial(net) {
  const switches = {}, fuel = {}, intact = {};
  for (const n of net.nodes) { if (n.kind !== 'junction') switches[n.id] = false; if (n.kind === 'source') fuel[n.id] = 0; }
  for (const e of net.edges) intact[e.id] = true;
  return { version: 1, network: net.id, topology:net.topology, switches, fuel, intact };
}
function normalize(net, raw) {
  if (raw === undefined) return initial(net);
  if (!raw || Object.keys(raw).some(k=>!['version','network','topology','switches','fuel','intact'].includes(k)) || raw.version !== 1 || raw.network !== net.id || raw.topology !== net.topology) throw Error('Registre électrique incompatible');
  const out = initial(net);
  for (const key of ['switches', 'fuel', 'intact']) {
    if (!raw[key] || typeof raw[key] !== 'object' || Array.isArray(raw[key]) || Object.keys(raw[key]).length !== Object.keys(out[key]).length || Object.keys(raw[key]).some(k => !own(out[key], k))) throw Error('Registre incomplet ou étranger');
    for (const id of Object.keys(out[key])) {
      if (key === 'fuel') out.fuel[id] = number(raw.fuel[id], 'Carburant', 0, net.nodes.find(n => n.id === id).tankCapacity);
      else { if (typeof raw[key][id] !== 'boolean') throw Error('État non booléen'); out[key][id] = raw[key][id]; }
    }
  }
  return out;
}
function switchNode(net, raw, id, enabled) {
  const out = normalize(net, raw); if (!own(out.switches, id) || typeof enabled !== 'boolean') throw Error('Commande électrique invalide');
  out.switches[id] = enabled; return out;
}
function cableState(net, raw, id, intact) {
  const out = normalize(net, raw); if (!own(out.intact, id) || typeof intact !== 'boolean') throw Error('Câble inconnu');
  out.intact[id] = intact; return out;
}
function transferFuel(net, raw, inventory, sourceId, request) {
  const state = normalize(net, raw), source = net.nodes.find(n => n.id === sourceId && n.kind === 'source');
  if (!source || !inventory || typeof inventory !== 'object' || Array.isArray(inventory)) throw Error('Source de carburant absente');
  const reserve = number(inventory.fuel, 'Réserve transportée', 0), requested = number(request, 'Quantité', 0);
  if (state.switches[sourceId]) throw Error('Éteindre le groupe avant ravitaillement');
  const moved = Math.min(requested, reserve, Math.max(0, source.tankCapacity - state.fuel[sourceId]));
  state.fuel[sourceId] += moved;
  return { state, inventory: { ...inventory, fuel: reserve - moved }, moved };
}
function step(net, raw, dt, options = {}) {
  number(dt, 'Pas électrique', 0, LIMITS.dt); const state = normalize(net, raw);
  const edges = new Map(net.edges.map(e => [e.id, e])), usage = {}, sourceUsage = {}, remaining = {}, consumed = {}, loads = {};
  for (const e of net.edges) usage[e.id] = 0;
  for (const n of net.nodes.filter(n => n.kind === 'source')) { sourceUsage[n.id] = 0; consumed[n.id] = 0; remaining[n.id] = 0; }
  // Pausing must neither consume energy nor claim a new delivered amount.
  if (options.paused === true || dt === 0) return { state, loads, usage, sourceUsage, consumed, energyWh: 0, paused: options.paused === true };
  for (const n of net.nodes.filter(n => n.kind === 'source')) {
    if (!state.switches[n.id]) continue;
    const idle = Math.min(state.fuel[n.id], n.idleFuelPerHour * dt / 3600);
    state.fuel[n.id] -= idle; consumed[n.id] += idle;
    remaining[n.id] = Math.min(n.capacityW, state.fuel[n.id] * 3600000 / (n.fuelPerKWh * dt));
  }
  for (const load of net.nodes.filter(n => n.kind === 'load').sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))) {
    const path = net.paths[load.id]; let reason = null;
    if (!state.switches[load.id]) reason = 'load-off';
    else if (!path) reason = 'no-source';
    else if (!state.switches[path.source]) reason = 'source-off';
    else if (path.nodes.some(id => own(state.switches, id) && !state.switches[id])) reason = 'breaker-open';
    else if (path.edges.some(id => !state.intact[id])) reason = 'cable-broken';
    else if (load.demandW > remaining[path.source] + 1e-9) reason = 'source-capacity-or-fuel';
    else if (path.edges.some(id => usage[id] + load.demandW > edges.get(id).capacityW + 1e-9)) reason = 'cable-capacity';
    const powered = reason === null; loads[load.id] = { powered, watts: powered ? load.demandW : 0, reason };
    if (!powered) continue;
    remaining[path.source] = Math.max(0, remaining[path.source] - load.demandW); sourceUsage[path.source] += load.demandW;
    for (const id of path.edges) usage[id] += load.demandW;
  }
  let energyWh = 0;
  for (const n of net.nodes.filter(n => n.kind === 'source')) {
    const wh = sourceUsage[n.id] * dt / 3600, debit = wh * n.fuelPerKWh / 1000;
    if (debit > state.fuel[n.id] + 1e-8) throw Error('Bilan énergétique incohérent');
    state.fuel[n.id] = Math.max(0, state.fuel[n.id] - debit); consumed[n.id] += debit; energyWh += wh;
  }
  return { state, loads, usage, sourceUsage, consumed, energyWh, paused: false };
}
return Object.freeze({ LIMITS, compile, initial, normalize, switchNode, cableState, transferFuel, step });

});
