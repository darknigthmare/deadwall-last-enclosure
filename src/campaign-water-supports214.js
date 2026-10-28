/* Pure access to the rain collectors already present in G11 compounds.
 * Geometry is cached; discovery, destruction and physical permission are not. */
(function(root, factory) {
  'use strict';
  const api = factory(root);
  root.DeadwallCampaignWaterSupports214 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function(root) {
  'use strict';

  const dependency = (name, file) => root[name] || (typeof require === 'function' ? require(file) : null);
  const rules = () => dependency('DeadwallCore', './core.js').CampaignWater214Rules;
  const geometry = () => dependency('DeadwallFrontierGeometry', './frontier-geometry.js');
  const adapter = () => dependency('DeadwallCodexCampaign205', './codex-campaign205.js');
  const caches = new WeakMap();
  const siteIdPattern = /^P\d{4}$/;
  const supportIdPattern = /^P\d{4}:205:static:(0|[1-9]\d*)$/;
  const provenanceKeys = ['version', 'typology', 'variant', 'authorPlanId'];
  const rect = value => !!value && ['x', 'y', 'w', 'h'].every(key => Number.isFinite(value[key])) && value.w > 0 && value.h > 0;
  const sameProvenance = (a, b) => !!a && !!b && provenanceKeys.every(key => a[key] === b[key]);
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };

  function validSite(p) {
    if (!p || p.generation !== rules().generation || typeof p.id !== 'string' || !siteIdPattern.test(p.id) || !rect(p) || !Number.isFinite(p.a)) return false;
    const identity = adapter().identity(p.type), source = p.campaign205;
    return !!identity && source?.version === 1 && source.typology === identity.typology && source.variant === identity.number &&
      source.authorPlanId === identity.typology + '-V' + String(identity.number).padStart(2, '0');
  }

  function staticSignature(o) {
    return JSON.stringify([o.kind, o.x, o.y, o.w, o.h, o.z, o.level, o.rotationRad ?? 0,
      o.solid, o.campaign205, o.campaign205Structural, o.name]);
  }

  function supportsFor(p, plan, details) {
    if (!validSite(p) || !sameProvenance(p.campaign205, plan?.campaign205) ||
        !sameProvenance(p.campaign205, details?.campaign205) || plan.w !== p.w || plan.h !== p.h || plan.z !== 0 ||
        !Array.isArray(plan.static205) || !Array.isArray(details.outdoor)) return freeze([]);
    const source = new Map(), conflicts = new Set(), result = [], R = rules(), G = geometry();
    for (const [index, objects] of [plan.static205, details.outdoor].entries()) for (const o of objects) {
      if (!o || typeof o.id !== 'string' || !supportIdPattern.test(o.id) || !o.id.startsWith(p.id + ':205:static:')) continue;
      const signature = staticSignature(o), previous = source.get(o.id), presence = 1 << index;
      if (previous && previous.signature !== signature) conflicts.add(o.id);
      else if (previous) previous.presence |= presence;
      else source.set(o.id, {object: o, signature, presence});
    }
    for (const [id, {object: o, presence}] of source) {
      if (presence !== 3 || conflicts.has(id) || o.kind !== 'rain-barrel' || o.campaign205 !== true || o.campaign205Structural !== true ||
          o.solid !== true || o.z !== 0 || (o.level !== undefined && o.level !== 0) || !rect(o) || (o.rotationRad ?? 0) !== 0 ||
          o.x < 0 || o.y < 0 || o.x + o.w > p.w || o.y + o.h > p.h) continue;
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2, pad = R.actorRadius + R.approachClearance;
      const point = (x, y) => ({...G.global(p, x, y), z: 0});
      const face = (name, ax, ay, tx, ty) => ({face: name, anchor: point(ax, ay), workTarget: point(tx, ty)});
      result.push(freeze({siteId: p.id, siteName: typeof p.name === 'string' && p.name ? p.name : p.id, supportId: id, supportKind: o.kind,
        supportLabel: typeof o.name === 'string' && o.name ? o.name : 'Récupérateur de pluie',
        localRect: {x: o.x, y: o.y, w: o.w, h: o.h}, center: point(cx, cy), approaches: [
          face('south', cx, o.y + o.h + pad, cx, o.y + o.h),
          face('east', o.x + o.w + pad, cy, o.x + o.w, cy),
          face('north', cx, o.y - pad, cx, o.y),
          face('west', o.x - pad, cy, o.x, cy)
        ]}));
    }
    return freeze(result.sort((a, b) => a.supportId.localeCompare(b.supportId)));
  }

  function descriptors(world, p) {
    const plan = world.plan(p, 0), details = world.detailAt(p, 0);
    // Actual adapter geometry is immutable. Mutable test/custom readers are
    // re-read rather than granting stale access after an in-place change.
    const immutable = plan && details && Array.isArray(plan.static205) && Array.isArray(details.outdoor) && Object.isFrozen(plan) && Object.isFrozen(details) &&
      Object.isFrozen(plan.campaign205) && Object.isFrozen(details.campaign205) &&
      Object.isFrozen(plan.static205) && Object.isFrozen(details.outdoor) &&
      plan.static205.every(Object.isFrozen) && details.outdoor.every(Object.isFrozen);
    if (!immutable) return supportsFor(p, plan, details);
    let cache = caches.get(world);
    if (!cache) { cache = new Map(); caches.set(world, cache); }
    const signature = JSON.stringify([p.x, p.y, p.w, p.h, p.a, p.type, typeof p.name === 'string' ? p.name : null,
      ...provenanceKeys.map(key => p.campaign205?.[key])]);
    const previous = cache.get(p.id);
    if (previous?.site === p && previous.plan === plan && previous.details === details && previous.signature === signature) return previous.supports;
    const supports = supportsFor(p, plan, details);
    cache.delete(p.id);
    cache.set(p.id, {site: p, plan, details, signature, supports});
    if (cache.size > rules().planCache) cache.delete(cache.keys().next().value);
    return supports;
  }

  function available(world, pose) {
    return !!world && world.generation === rules().generation && Array.isArray(world.pois) &&
      typeof world.plan === 'function' && typeof world.detailAt === 'function' && pose?.active === true &&
      pose.generation === rules().generation && Number.isFinite(pose.x) && Number.isFinite(pose.y);
  }
  const refused = (reason, support) => freeze({...support, ok: false, reason});

  function insideParcel(p, point, radius) {
    const q = geometry().local(p, point.x, point.y);
    return q.x >= radius && q.y >= radius && q.x <= p.w - radius && q.y <= p.h - radius;
  }

  function canonicalApproach(world, p, support) {
    const radius = rules().actorRadius;
    // The selected face depends only on current physical geometry, never on
    // the caller's pose. The owner can retain one stable work point per barrel.
    return support.approaches.find(face => insideParcel(p, face.anchor, radius) &&
      !world.blocked(face.anchor.x, face.anchor.y, radius, 0, null) &&
      world.movementLine(face.anchor, face.workTarget, 0, null, support.supportId, radius)) || null;
  }

  function resolve(world, pose, request, discoveries, options = {}) {
    if (!available(world, pose)) return refused('Rejoignez à pied un récupérateur résidentiel G11.');
    if (!request || typeof request.siteId !== 'string' || !siteIdPattern.test(request.siteId) || typeof request.supportId !== 'string' ||
        !supportIdPattern.test(request.supportId) || !request.supportId.startsWith(request.siteId + ':205:static:')) {
      return refused('Récupérateur inconnu.');
    }
    const p = world.pois.find(p => p.id === request.siteId);
    if (!validSite(p)) return refused('Ce lieu ne possède pas ce récupérateur.');
    if (!Array.isArray(discoveries) || !discoveries.includes(p.id)) return refused('Repérez ce site sur place avant de l’utiliser.');
    if (typeof options?.structureDestroyed !== 'function') return refused('État du support indisponible.');
    const destroyed = options.structureDestroyed(p.id);
    if (destroyed !== false) return refused(destroyed === true ? 'Le bâtiment support a été détruit.' : 'État du support indisponible.');
    if (pose.car?.driving || pose.z !== 0) return refused('Rejoignez à pied le récupérateur au rez-de-chaussée.');
    if (typeof world.blocked !== 'function' || typeof world.movementLine !== 'function') return refused('Accès physique au récupérateur indisponible.');
    const support = descriptors(world, p).find(s => s.supportId === request.supportId);
    if (!support) return refused('Ce lieu ne possède pas ce récupérateur.');
    const approach = canonicalApproach(world, p, support);
    if (!approach) return refused('Aucune face de travail praticable auprès du récupérateur.', support);
    const selected = freeze({...support, ...approach}), R = rules();
    if (Math.hypot(pose.x - selected.anchor.x, pose.y - selected.anchor.y) > R.reach) return refused('Approchez du point de travail du récupérateur.', selected);
    if (world.blocked(pose.x, pose.y, R.actorRadius, 0, pose.inside ?? null) ||
        !world.movementLine(pose, selected.anchor, 0, pose.inside ?? null, null, R.actorRadius)) {
      return refused('Le passage vers le récupérateur est bloqué.', selected);
    }
    return freeze({...selected, ok: true});
  }

  function distanceToParcel(p, point) {
    const q = geometry().local(p, point.x, point.y);
    return Math.hypot(Math.max(0, -q.x, q.x - p.w), Math.max(0, -q.y, q.y - p.h));
  }

  function list(world, pose, discoveries, options = {}) {
    if (!available(world, pose)) return freeze([]);
    const R = rules(), seen = new Set(Array.isArray(discoveries) ? discoveries : []);
    const candidates = typeof world.nearPOI === 'function' ? world.nearPOI(pose.x, pose.y, R.nearbyRadius) : world.pois;
    const sites = [...new Set(candidates)].filter(p => validSite(p) && world.pois.includes(p) && seen.has(p.id) &&
      distanceToParcel(p, pose) <= R.nearbyRadius)
      .sort((a, b) => distanceToParcel(a, pose) - distanceToParcel(b, pose) || a.id.localeCompare(b.id)).slice(0, R.maxSites);
    const offered = [];
    for (const p of sites) for (const support of descriptors(world, p)) {
      if (Math.min(...support.approaches.map(face => Math.hypot(face.anchor.x - pose.x, face.anchor.y - pose.y))) <= R.nearbyRadius) offered.push(support);
    }
    return freeze(offered.sort((a, b) => Math.hypot(a.center.x - pose.x, a.center.y - pose.y) -
      Math.hypot(b.center.x - pose.x, b.center.y - pose.y) || a.supportId.localeCompare(b.supportId))
      .slice(0, R.maxActions).map(support => ({...support, ...resolve(world, pose, support, discoveries, options)}))
      .filter(support => Math.hypot((support.anchor || support.center).x - pose.x,
        (support.anchor || support.center).y - pose.y) <= R.nearbyRadius));
  }

  return Object.freeze({version: 1, supportsFor, list, resolve});
});
