(function(root, factory) {
  'use strict';
  const api = factory();
  root.DeadwallOperationsArt = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.document && root.DEADWALL) api.install(root.DEADWALL);
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const ASSET = Object.freeze({url: 'assets/operations-atlas.png', width: 1536, height: 1024, matte: 'none'});
  // Measured transparent gutters. The tarp crosses the nominal first column;
  // using uniform cells would cut its guy rope and include it with ammunition.
  const SPRITES = Object.freeze(Object.fromEntries(Object.entries({
    cache: {rect: [50, 133, 312, 345], pivot: [.5, .90]},
    cargo: {rect: [440, 221, 329, 241], pivot: [.5, .80]},
    marker: {rect: [909, 65, 228, 419], pivot: [.125, .98]},
    bedroll: {rect: [1162, 122, 342, 363], pivot: [.5, .57]},
    tarp: {rect: [29, 590, 438, 347], pivot: [.5, .64]},
    ammo: {rect: [503, 616, 263, 284], pivot: [.5, .88]},
    support: {rect: [802, 581, 316, 354], pivot: [.5, .88]},
    casualty: {rect: [1153, 521, 358, 443], pivot: [.5, .56]}
  }).map(([name, value]) => [name, Object.freeze({rect: Object.freeze(value.rect), pivot: Object.freeze(value.pivot)})])));

  function measure(type, x, y, size) {
    const spec = Object.hasOwn(SPRITES, type) ? SPRITES[type] : null;
    if (!spec || ![x, y, size].every(Number.isFinite) || size <= 0) return null;
    const ratio = size / Math.max(spec.rect[2], spec.rect[3]);
    const width = spec.rect[2] * ratio, height = spec.rect[3] * ratio;
    return {source: spec.rect, destination: [x - width * spec.pivot[0], y - height * spec.pivot[1], width, height]};
  }

  function draw(ctx, image, type, x, y, size) {
    if (!image || !ctx || typeof ctx.drawImage !== 'function') return false;
    const frame = measure(type, x, y, size);
    if (!frame) return false;
    // Preserve the caller's current transform, alpha and clipping, including
    // night masks and regional metre-to-screen projection. No per-frame canvas.
    ctx.drawImage(image, ...frame.source, ...frame.destination);
    return true;
  }

  function install(g) {
    if (!g) return null;
    if (g.operationsArt) return g.operationsArt;
    g.operationsArt = Object.freeze({
      draw(ctx, type, x, y, size) {
        const frame = measure(type, x, y, size), art = g.art;
        const props = globalThis.DeadwallWorldPropsArt153;
        if (frame && type !== 'casualty' && props?.drawSprite) {
          const family = props.OPERATIONS[type];
          // A transported parcel keeps its cosmetic identity while moving.
          const identity = type === 'cargo' ? type : type + ':' + x + ':' + y;
          const seed = g.world?.seed ?? 0;
          const variant = type === 'bedroll' ? 0 : undefined;
          const sprite = props.select(family, identity, seed, variant);
          const pivot = type === 'marker' ? (sprite?.variant === 0 ? [.14, .98] : [.5, .98]) : SPRITES[type].pivot;
          if (props.drawSprite(ctx, art, family, identity, x, y, size, size, {seed, variant, pivot})) return true;
        }
        if (!frame || !art?.images?.operations || !ctx || typeof ctx.drawImage !== 'function') return false;
        if (typeof art.blit === 'function') return art.blit(ctx, 'operations', frame.source, ...frame.destination);
        return draw(ctx, art.images.operations, type, x, y, size);
      },
      ready: () => Boolean(g.art?.images?.operations),
      measure
    });
    return g.operationsArt;
  }
  return {ASSET, SPRITES, measure, draw, install};
});
