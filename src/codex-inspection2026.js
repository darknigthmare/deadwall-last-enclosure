/* Isolated inspection sessions. No game, inventory, RNG or autosave references. */
(function(root, factory) {
  'use strict';
  const api = factory(root);
  root.DeadwallCodexInspection2026 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis, function(root) {
  'use strict';
  const SCOPE = 'codex-physical-inspection-only';
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  function dependencies() {
    return {
      layouts:root.DeadwallCodexLayouts2026 || require('./codex-layouts2026.js'),
      physical:root.DeadwallCodexPhysical2026 || require('./codex-physical2026.js'),
      furnishings:root.DeadwallCodexFurnishings2026 || require('./codex-furnishings2026.js')
    };
  }
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function visited(scene, pose, previous = []) {
    const ids = new Set(previous);
    for (const r of scene.rooms) if (r.kind !== 'circulation' && r.level === pose.level &&
      pose.x >= r.x && pose.x <= r.x+r.w && pose.y >= r.y && pose.y <= r.y+r.h) ids.add(r.id);
    return [...ids].sort();
  }
  // A change detector, not a security signature. Reconstructed geometry is
  // always revalidated before accepting a position from an inspection snapshot.
  function fingerprint(scene) {
    const text = JSON.stringify([scene.id,scene.version,scene.levels,scene.rooms,scene.surfaces,scene.walls,scene.solids,scene.portals,scene.transitions,scene.entry]);
    let value=2166136261;
    for(let i=0;i<text.length;i++)value=Math.imul(value^text.charCodeAt(i),16777619)>>>0;
    return value.toString(16).padStart(8,'0');
  }
  function create(type, number) {
    const d = dependencies(), author = d.layouts.build(type, number);
    const base = d.physical.build(author), furnishing = d.furnishings.build(author);
    const checked = d.furnishings.audit(author, furnishing);
    if (!checked.ok) throw Error('Aménagement refusé : ' + checked.errors.join(', '));
    const scene = d.physical.withProps(base, furnishing.props);
    const pose = {x:scene.entry.x,y:scene.entry.y,level:scene.entry.level};
    const state = {version:1,scope:SCOPE,planId:author.id,sourceHash:d.layouts.sourceHash,
      geometry:fingerprint(scene),pose,visitedRooms:visited(scene,pose)};
    return freeze({author,scene,furnishing,state,limits:[...scene.limits,
      'Le mobilier est dessiné à son emprise au sol ; les hauteurs ajoutées sont des choix de composition.',
      ...(furnishing.unplaced.length?[furnishing.unplaced.length+' prescriptions de mobilier refusées faute de place ou de dégagement.']:[])]});
  }
  function moved(session, result) {
    if (!result.ok) return {session,blocked:true,reason:result.reason||'Déplacement impossible.'};
    const state = {...session.state,pose:{x:result.pose.x,y:result.pose.y,level:result.pose.level},visitedRooms:visited(session.scene,result.pose,session.state.visitedRooms)};
    return {session:freeze({...session,state}),blocked:!!result.blocked,reason:result.reason||''};
  }
  function move(session, dx, dy) {
    if (!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)>10) throw Error('Pas de déplacement invalide.');
    return moved(session,dependencies().physical.move(session.scene,session.state.pose,dx,dy,.32));
  }
  function transition(session, id) {
    return moved(session,dependencies().physical.transition(session.scene,session.state.pose,id,.32));
  }
  function nearTransitions(session) {
    const p=session.state.pose;
    return session.scene.transitions.filter(t=>[t.a,t.b].some(a=>a.level===p.level&&Math.hypot(a.x-p.x,a.y-p.y)<=t.activationRadiusM));
  }
  function snapshot(session) { return clone(session.state); }
  function restore(type, number, raw) {
    const session=create(type,number), s=raw;
    if (!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).sort().join(',')!=='geometry,planId,pose,scope,sourceHash,version,visitedRooms'||
      s.version!==1||s.scope!==SCOPE||s.planId!==session.author.id||s.sourceHash!==session.state.sourceHash||s.geometry!==session.state.geometry) throw Error('État d’inspection incompatible avec ce plan.');
    const p=s.pose;
    if (!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join(',')!=='level,x,y') throw Error('Position d’inspection obstruée ou invalide.');
    const pose={x:p.x,y:p.y,level:p.level};
    if (![pose.x,pose.y].every(Number.isFinite)||!Number.isInteger(pose.level)||dependencies().physical.blocked(session.scene,pose.x,pose.y,pose.level,.32)) throw Error('Position d’inspection obstruée ou invalide.');
    const rooms=new Set(session.scene.rooms.filter(r=>r.kind!=='circulation').map(r=>r.id));
    const history=Array.isArray(s.visitedRooms)?Array.from(s.visitedRooms):null;
    if (!history||history.length>rooms.size||new Set(history).size!==history.length||history.some(id=>typeof id!=='string'||!rooms.has(id))) throw Error('Historique de pièces invalide.');
    if (own(s,'campaign')||own(s,'fuel')) throw Error('État de campagne refusé.');
    return freeze({...session,state:{...session.state,pose,visitedRooms:visited(session.scene,pose,history)}});
  }
  return Object.freeze({SCOPE,create,move,transition,nearTransitions,snapshot,restore});
});
