(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DeadwallArt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  // Original OpenAI atlases. Matte decoding is performed once at upload, never per frame.
  const ASSETS = Object.freeze({
    buildings: { url: 'assets/buildings-atlas.webp', width: 1254, height: 1254, matte: 'neutral' },
    props: { url: 'assets/props-atlas.webp', width: 1254, height: 1254, matte: 'magenta' },
    survivors: { url: 'assets/survivors-atlas.webp', width: 1774, height: 887, matte: 'magenta' },
    infected: { url: 'assets/infected-atlas.webp', width: 1774, height: 887, matte: 'magenta' },
    effects: { url: 'assets/vfx-atlas.webp', width: 1254, height: 1254, matte: 'additive' },
    defenses: { url: 'assets/defenses-atlas.webp', width: 1254, height: 1254, matte: 'magenta' },
    ground: { url: 'assets/terrain-earth.webp', width: 1254, height: 1254, matte: 'none' }
  });
  const BUILDINGS = Object.freeze({
    core: [0, 0, 335, 365], house: [350, 0, 255, 365], warehouse: [640, 0, 275, 365],
    barracks: [950, 0, 304, 365], clinic: [0, 385, 315, 300], farm: [335, 385, 280, 300],
    generator: [640, 385, 280, 300], lumber: [930, 385, 324, 300],
    scrapyard: [0, 695, 315, 265], quarry: [335, 695, 280, 265],
    refinery: [635, 695, 285, 265], workshop: [925, 695, 329, 265],
    ammoFactory: [0, 970, 335, 284], watchtower: [345, 970, 265, 284],
    turret: [630, 970, 290, 284], heavyTurret: [930, 970, 324, 284]
  });
  const PROPS = Object.freeze({
    tree: [0, 0, 313, 313], pine: [313, 0, 314, 313], logs: [627, 0, 313, 313], rocks: [940, 0, 314, 313],
    scrap: [0, 313, 313, 314], crops: [313, 313, 314, 314], fuel: [627, 313, 313, 314], supplies: [940, 313, 314, 314],
    sedan: [0, 627, 313, 373], pickup: [313, 627, 314, 373], van: [627, 627, 313, 373], truck: [940, 627, 314, 373],
    woodWall: [0, 1000, 313, 254], steelWall: [313, 1000, 314, 254],
    concreteWall: [627, 1000, 313, 254], gate: [940, 1000, 314, 254]
  });
  const ACTORS = Object.freeze({
    player: ['survivors', 0], worker: ['survivors', 1], soldier: ['survivors', 2], walker: ['survivors', 3],
    runner: ['infected', 0], armored: ['infected', 1], crawler: ['infected', 2], howler: ['infected', 3]
  });
  const DEFENSES = Object.freeze({
    spikes: [0,0,610,627], armoredGate: [610,0,644,627],
    turret: [0,627,627,627], heavyTurret: [627,627,627,627]
  });
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function frameRect(atlas, row, frame, columns = 8, rows = 4) {
    const a = ASSETS[atlas], x = Math.round((frame % columns) * a.width / columns), y = Math.round(row * a.height / rows);
    return [x, y, Math.round(((frame % columns) + 1) * a.width / columns) - x, Math.round((row + 1) * a.height / rows) - y];
  }
  function decodeMatte(pixels, width, height, mode) {
    if (mode === 'magenta') {
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], excess = Math.min(r, b) - g;
        if (excess > 18 && Math.min(r, b) > g * 1.35 + 8) pixels[i + 3] = 0;
        else if (excess > 35 && r > 90 && b > 90) {
          pixels[i + 3] = Math.round(pixels[i + 3] * (1 - clamp((excess - 35) / 65, 0, 1)));
          // Remove the chroma fringe from anti-aliased silhouette edges.
          pixels[i] = Math.min(r, g + 25); pixels[i + 2] = Math.min(b, g + 25);
        }
      }
    } else if (mode === 'neutral') {
      // Only border-connected pale matte is removed. Roof markings stay opaque.
      const seen = new Uint8Array(width * height), queue = new Int32Array(width * height);
      let head = 0, tail = 0;
      function visit(index) {
        if (index < 0 || index >= seen.length || seen[index]) return;
        seen[index] = 1; const i = index * 4;
        const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]), max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        if (min >= 154 && max - min < 22) {
          queue[tail++] = index;
          pixels[i + 3] = Math.round(pixels[i + 3] * clamp((194 - min) / 40, 0, 1));
        }
      }
      for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
      for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
      while (head < tail) {
        const p = queue[head++], x = p % width;
        if (x) visit(p - 1); if (x < width - 1) visit(p + 1);
        visit(p - width); visit(p + width);
      }
    }
    return pixels;
  }
  function tightRect(pixels, width, rect) {
    const [left, top, w, h] = rect;
    let minX = left + w, minY = top + h, maxX = left, maxY = top;
    for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++) {
      if (pixels[(y * width + x) * 4 + 3] < 80) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    return minX > maxX ? rect : [minX, minY, maxX - minX + 1, maxY - minY + 1];
  }
  class Art {
    constructor() {
      this.images = {}; this.rects = {}; this.motion = new WeakMap();
      this.diagnostics = { ready: [], failed: [], draws: {} };
      this.ready = Promise.all(Object.entries(ASSETS).map(([key, spec]) => this.load(key, spec)));
    }
    load(key, spec) {
      return new Promise(resolve => {
        const source = new Image();
        source.onload = () => {
          try {
            if (source.naturalWidth !== spec.width || source.naturalHeight !== spec.height) throw new Error('dimensions');
            if (spec.matte === 'magenta' || spec.matte === 'neutral') {
              const canvas = document.createElement('canvas'); canvas.width = spec.width; canvas.height = spec.height;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              ctx.drawImage(source, 0, 0);
              const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
              decodeMatte(data.data, canvas.width, canvas.height, spec.matte); ctx.putImageData(data, 0, 0);
              this.images[key] = canvas;
              const rects = key === 'buildings' ? BUILDINGS : key === 'props' ? PROPS : key === 'defenses' ? DEFENSES : {};
              for (const [id, rect] of Object.entries(rects)) this.rects[key + ':' + id] = tightRect(data.data, canvas.width, rect);
            } else this.images[key] = source;
            this.diagnostics.ready.push(key);
          } catch { this.diagnostics.failed.push(key); }
          resolve();
        };
        source.onerror = () => { this.diagnostics.failed.push(key); resolve(); };
        source.src = spec.url;
      });
    }
    blit(ctx, atlas, rect, x, y, w, h) {
      const image = this.images[atlas]; if (!image) return false;
      ctx.drawImage(image, ...rect, x, y, w, h);
      this.diagnostics.draws[atlas] = (this.diagnostics.draws[atlas] || 0) + 1;
      return true;
    }
    drawGround(ctx, view, worldSize) {
      const image = this.images.ground; if (!image) return false;
      const size = 512;
      ctx.save(); ctx.globalAlpha = .7;
      for (let y = Math.max(0, Math.floor(view.top / size)); y < Math.min(Math.ceil(worldSize / size), Math.ceil(view.bottom / size)); y++)
        for (let x = Math.max(0, Math.floor(view.left / size)); x < Math.min(Math.ceil(worldSize / size), Math.ceil(view.right / size)); x++)
          this.blit(ctx, 'ground', [0, 0, image.width, image.height], x * size, y * size, size + .5, size + .5);
      ctx.restore(); return true;
    }
    drawBuilding(ctx, b, world) {
      const atlas = b.type === 'spikes' || b.type === 'armoredGate' ? 'defenses' : b.def.wall ? 'props' : 'buildings';
      const id = b.type;
      const rect = this.rects[atlas + ':' + id]; if (!rect) return false;
      let width = b.w * 32, height = b.h * 32, angle = b.rotation % 2 ? Math.PI / 2 : 0;
      if (b.def.wall && !b.def.gate) {
        const up = world.atCell(b.gx, b.gy - 1), down = world.atCell(b.gx, b.gy + 1);
        const left = world.atCell(b.gx - 1, b.gy), right = world.atCell(b.gx + 1, b.gy);
        angle = (Number(Boolean(up?.def.wall)) + Number(Boolean(down?.def.wall))) >
          (Number(Boolean(left?.def.wall)) + Number(Boolean(right?.def.wall))) ? Math.PI / 2 : 0;
        width = 34; height = 30;
      } else if (angle) [width, height] = [height, width];
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(angle);
      ctx.fillStyle = 'rgba(10,15,12,.22)'; ctx.beginPath();ctx.ellipse(0,height*.32,width*.48,height*.22,0,0,Math.PI*2);ctx.fill();
      if (id === 'house' || id === 'barracks') {
        ctx.rotate(Math.PI / 2); this.blit(ctx, atlas, rect, -height / 2, -width / 2, height, width);
      } else this.blit(ctx, atlas, rect, -width / 2 - 2, -height / 2 - 5, width + 4, height + 7);
      ctx.restore();
      if (b.corpseLoad > 4) {
        ctx.fillStyle = 'rgba(64,39,32,.8)';
        for (let i = 0; i < Math.min(8, b.corpseLoad / 3); i++) {
          ctx.beginPath(); ctx.ellipse(b.left + 4 + i * width / 8, b.top + height + 1, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      return true;
    }
    drawNode(ctx, node) {
      const variant = Math.abs(node.variant || 0) % 4;
      const key = node.type === 'wood' ? ['tree', 'pine', 'logs', 'tree'][variant] :
        node.type === 'scrap' ? ['scrap', 'sedan', 'van', 'truck'][variant] :
        node.type === 'fuel' ? (variant % 2 ? 'pickup' : 'fuel') : node.type === 'stone' ? 'rocks' : variant === 3 ? 'supplies' : 'crops';
      const rect = this.rects['props:' + key]; if (!rect) return false;
      const size = node.radius * (key === 'tree' || key === 'pine' ? 3.5 : 2.65);
      const ratio = rect[2] / rect[3], w = ratio > 1 ? size : size * ratio, h = ratio > 1 ? size / ratio : size;
      ctx.save(); ctx.translate(node.x, node.y); ctx.globalAlpha = clamp(node.amount / node.maxAmount, .45, 1);
      if (node.flash > 0) ctx.scale(1.04, 1.04);
      this.blit(ctx, 'props', rect, -w / 2, -h / 2, w, h); ctx.restore(); return true;
    }
    drawActor(ctx, entity, kind, time, reducedMotion, compact) {
      const spec = ACTORS[kind]; if (!spec || !this.images[spec[0]]) return false;
      let previous = this.motion.get(entity);
      if (!previous) { previous = { x: entity.x, y: entity.y, until: 0 }; this.motion.set(entity, previous); }
      if (Math.hypot(entity.x - previous.x, entity.y - previous.y) > .12) previous.until = time + .12;
      previous.x = entity.x; previous.y = entity.y;
      const frame = reducedMotion || previous.until < time ? 0 : Math.floor(time * (kind === 'runner' ? 13 : 9) + (entity.id || 0)) % 8;
      const size = (kind === 'player' ? 57 : kind === 'armored' ? 62 : kind === 'crawler' ? 49 : 55) * (compact ? 1.1 : 1);
      ctx.save(); ctx.translate(entity.x, entity.y);
      if (kind === 'player') { ctx.strokeStyle = '#ddba69'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 3, 16, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.rotate(entity.facing || 0);
      if (kind === 'player' && entity.invulnerable > 0 && Math.floor(entity.invulnerable * 10) % 2 === 0) ctx.globalAlpha = .5;
      this.blit(ctx, spec[0], frameRect(spec[0], spec[1], frame), -size / 2, -size / 2, size, size);
      ctx.restore(); return true;
    }
    drawEffect(ctx, kind, x, y, size, phase = 0, alpha = 1, rotation = 0) {
      if (!this.images.effects) return false;
      const row = { muzzle: 0, spark: 0, dust: 1, fire: 2, smoke: 3 }[kind]; if (row === undefined) return false;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.globalCompositeOperation = 'screen';
      this.blit(ctx, 'effects', frameRect('effects', row, clamp(Math.floor(phase * 4), 0, 3), 4), -size / 2, -size / 2, size, size);
      ctx.restore(); return true;
    }
    drawTurret(ctx, building) {
      const kind = building.type === 'heavyTurret' ? 'heavyTurret' : 'turret';
      const rect = this.rects['defenses:' + kind]; if (!rect) return false;
      const size = kind === 'heavyTurret' ? 66 : building.type === 'watchtower' ? 45 : 57;
      ctx.save();ctx.translate(building.x,building.y-3);ctx.rotate(building.turretAngle||0);
      this.blit(ctx,'defenses',rect,-size*.2,-size*.24,size,size*.48);
      if(building.flash>0)this.drawEffect(ctx,'muzzle',size*.78,0,24,.25,.9);
      ctx.restore();return true;
    }
  }
  return { ASSETS, BUILDINGS, PROPS, DEFENSES, ACTORS, frameRect, decodeMatte, tightRect, create: () => new Art() };
});
