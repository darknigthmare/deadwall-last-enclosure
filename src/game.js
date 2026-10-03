(function initDeadwall() {
  'use strict';
  const C = globalThis.DeadwallCore;
  if (!C) throw new Error('DeadwallCore introuvable.');
  const T = globalThis.DeadwallTactics;
  if (!T) throw new Error('DeadwallTactics introuvable.');
  const {
    TILE, WORLD_TILES, WORLD_SIZE, SAVE_KEY, LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SETTINGS_KEY, SAVE_VERSION,
    RESOURCE_KEYS, RESOURCE_META, DIFFICULTIES, CITY_TIERS, BUILDINGS, ENEMIES, WEAPONS, OBJECTIVES,
    RESEARCH, CRISES, PERFORMANCE_LIMITS, STRATEGY_RULES,
    clamp, lerp, dist, distSq, grid, world, index, makeBag, bagTotal, canAfford, spend, add,
    scaledCost, resourceText, formatNumber, formatTime, seededHash, cityTier, buildingList,
    enemyHealthScale, wallLine, powerPriority, crisisForWave, normalizeResearch, migrateSaveData,
    normalizeCrisis, normalizeSpawnCounts, spawnCount, takeSpawnKind, productionFraction, findFriendlyPath,
    wavePlan, createStats, Random, MinHeap
  } = C;

  const now = () => performance.now() / 1000;
  const rotateSize = (def, rotation) => Math.abs(rotation) % 2 ? [def.size[1], def.size[0]] : def.size;

  class Building {
    constructor(id, type, gx, gy, rotation = 0, progress = 0) {
      this.id = id; this.type = type; this.gx = gx; this.gy = gy; this.rotation = rotation;
      this.progress = progress; this.dead = false; this.fireCooldown = 0; this.turretAngle = -Math.PI / 2;
      this.flash = 0; this.powered = true; this.powerShare = 1; this.priority = 2; this.gateMode = 'auto';
      this.underAttack = 0; this.corpseLoad = 0;
      this.health = Math.max(40, this.def.health * (progress >= 1 ? 1 : 0.12 + progress * 0.65));
    }
    get def() { return BUILDINGS[this.type]; }
    get size() { return rotateSize(this.def, this.rotation); }
    get w() { return this.size[0]; }
    get h() { return this.size[1]; }
    get x() { return (this.gx + this.w / 2) * TILE; }
    get y() { return (this.gy + this.h / 2) * TILE; }
    get left() { return this.gx * TILE; }
    get top() { return this.gy * TILE; }
    get right() { return (this.gx + this.w) * TILE; }
    get bottom() { return (this.gy + this.h) * TILE; }
    get completed() { return this.progress >= 1; }
    get maxHealth() { return this.def.health; }
    contains(x, y, pad = 0) { return x >= this.left - pad && x <= this.right + pad && y >= this.top - pad && y <= this.bottom + pad; }
    work(amount) {
      if (this.dead || this.health <= 0 || this.completed || !Number.isFinite(amount) || amount <= 0) return false;
      const before = this.progress;
      this.progress = clamp(this.progress + amount / Math.max(1, this.def.buildTime), 0, 1);
      // Construction adds only the integrity of the work actually completed.
      // Existing combat damage must not disappear at every worker tick.
      this.health = Math.min(this.maxHealth, this.health + (this.progress - before) * this.maxHealth * 0.88);
      return before < 1 && this.completed;
    }
  }

  class ResourceNode {
    constructor(id, type, x, y, amount, radius, variant) {
      this.id = id; this.type = type; this.x = x; this.y = y; this.amount = amount; this.maxAmount = amount;
      this.radius = radius; this.variant = variant; this.depleted = false; this.flash = 0;
    }
    harvest(amount) {
      if (this.depleted || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(this.amount) || this.amount <= 0) return 0;
      const value = Math.min(this.amount, amount);
      this.amount -= value; this.flash = 0.14;
      if (this.amount <= 0.01) { this.amount = 0; this.depleted = true; }
      return value;
    }
  }

  class Unit {
    constructor(id, kind, x, y) {
      const def=Object.prototype.hasOwnProperty.call(C.SURVIVORS,kind)?C.SURVIVORS[kind]:null;
      if(!def)throw new Error('Profil de survivant inconnu.');
      this.id = id; this.kind = kind; this.x = x; this.y = y; this.dead = false;
      this.maxHealth = def.health; this.health = this.maxHealth;
      this.radius = def.radius; this.speed = def.speed;
      this.state = 'idle'; this.targetNode = -1; this.targetBuilding = -1; this.think = 0;
      this.targetUnit = -1; this.supportActive = false;
      this.squad = null;
      this.fireCooldown = 0; this.facing = 0; this.carryType = null; this.carry = 0; this.maxCarry = C.WORKER_RULES.carryCapacity;
      const a = Math.random() * Math.PI * 2, r = 35 + Math.random() * 70;
      this.offset = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    }
  }

  class Zombie {
    constructor(id, kind, x, y, difficulty, waveNumber) {
      if (!Object.hasOwn(ENEMIES, kind)) throw new RangeError('Profil infecté inconnu.');
      const def = ENEMIES[kind];
      this.id = id; this.kind = kind; this.x = x; this.y = y; this.dead = false;
      this.radius = def.radius; this.maxHealth = def.health * difficulty.enemyHealth * enemyHealthScale(waveNumber);
      this.health = this.maxHealth; this.attackCooldown = 0; this.facing = 0; this.stagger = 0;
      this.howl = 2 + Math.random() * 7; this.bias = Math.random() * 1000; this.anim = Math.random() * 10;
      this.rage = 0; this.stuck = 0; this.lastX = x; this.lastY = y;
      this.prey = null; this.huntThink = Math.random() * C.ENEMY_RULES.stalkThinkSeconds;
      if(kind==='shielded'||kind==='charger')this.facing=Math.atan2(WORLD_SIZE/2-y,WORLD_SIZE/2-x);
      if(kind==='charger')this.charge={stage:'ready',timer:0,angle:this.facing};
    }
  }

  class Projectile {
    constructor(id, x, y, vx, vy, damage, range, owner, color = '#ffe09a', radius = 2, headshotChance = 0, headshotMultiplier = 1) {
      this.id = id; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.damage = damage;
      this.range = range; this.owner = owner; this.color = color; this.radius = radius; this.travelled = 0; this.dead = false;
      // Capture the firing weapon's values: switching weapons cannot alter a shot in flight.
      this.headshotChance = headshotChance; this.headshotMultiplier = headshotMultiplier;
    }
  }

  class Particle {
    constructor(x, y, vx, vy, life, size, color, kind = 'dust') {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life;
      this.size = size; this.color = color; this.kind = kind; this.rotation = Math.random() * Math.PI * 2;
    }
  }

  class AudioSystem {
    constructor() { this.ctx = null; this.master = null; this.enabled = true; this.muted = false; this.volume = .7; this.lastGroan = 0; this.noiseBuffers = new Map(); this.voices = 0; }
    unlock() {
      if (!this.enabled) return false;
      try {
        if(!this.ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC){this.enabled=false;return false;}this.ctx=new AC();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.setMuted(this.muted);}
        if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')this.ctx.resume()?.catch?.(()=>{});
        return true;
      }catch{this.enabled=false;return false;}
    }
    setMuted(muted) { this.muted = Boolean(muted); if (this.master) this.master.gain.value = this.muted ? 0 : 0.15 * this.volume; }
    setVolume(value) { this.volume=clamp(Number(value)||0,0,1);this.setMuted(this.muted); }
    tone(freq, duration, type = 'square', volume = 0.08, slide = 0) {
      if (!this.ctx || !this.master || !this.enabled || this.muted || this.volume<=0 || this.voices>=48) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + duration);
      g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      o.connect(g); g.connect(this.master);this.voices++;o.onended=()=>{this.voices=Math.max(0,this.voices-1);o.disconnect();g.disconnect();}; o.start(t); o.stop(t + duration);
    }
    noise(duration = 0.08, volume = 0.12, lowpass = 1800) {
      if (!this.ctx || !this.master || !this.enabled || this.muted || this.volume<=0 || this.voices>=48) return;
      const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      let buffer=this.noiseBuffers.get(length);if(!buffer){buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);if(this.noiseBuffers.size<12)this.noiseBuffers.set(length,buffer);}
      const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain();
      filter.type = 'lowpass'; filter.frequency.value = lowpass; gain.gain.value = volume;
      source.buffer = buffer; source.connect(filter); filter.connect(gain); gain.connect(this.master);this.voices++;source.onended=()=>{this.voices=Math.max(0,this.voices-1);source.disconnect();filter.disconnect();gain.disconnect();}; source.start();
    }
    shot(weapon) {
      if (weapon === 'shotgun') { this.noise(.18, .25, 900); this.tone(70, .14, 'sawtooth', .11, -35); }
      else if (weapon === 'rifle') { this.noise(.065, .13, 1600); this.tone(110, .055, 'square', .07, -50); }
      else { this.noise(.09, .13, 1350); this.tone(135, .08, 'square', .06, -70); }
    }
    build() { this.tone(520, .08, 'square', .05, 130); }
    hit() { this.noise(.045, .05, 700); }
    siren() { this.tone(210, .7, 'sawtooth', .07, 160); setTimeout(() => this.tone(360, .7, 'sawtooth', .06, -150), 750); }
    ui() { this.tone(440, .04, 'square', .025, 70); }
  }

  class WorldMap {
    constructor(seed = 17117) {
      this.seed = seed; this.occupancy = new Int32Array(WORLD_TILES * WORLD_TILES);
      this.buildings = new Map(); this.nodes = []; this.nodeId = 1; this.flowDirty = true; this.navigationVersion = 0;
      this.generateNodes();
      const content=globalThis.DeadwallWorldContent?.generate(this.seed);
      this.sites=content?.sites||[];
      for(const prop of content?.props||[])this.nodes.push(Object.assign(new ResourceNode(this.nodeId++,prop.type,prop.x,prop.y,prop.amount,prop.radius,0),{sceneryKind:prop.sceneryKind,siteId:prop.siteId,renderSize:prop.renderSize}));
    }
    cells(building) {
      const out = [];
      for (let y = 0; y < building.h; y++) for (let x = 0; x < building.w; x++) out.push({ x: building.gx + x, y: building.gy + y });
      return out;
    }
    add(building) {
      this.navigationVersion++;
      this.buildings.set(building.id, building);
      for (const cell of this.cells(building)) this.occupancy[index(cell.x, cell.y)] = building.id;
      for (const node of this.nodes) if (!node.depleted && node.x + node.radius > building.left - 6 && node.x - node.radius < building.right + 6 && node.y + node.radius > building.top - 6 && node.y - node.radius < building.bottom + 6) { node.depleted = true; node.amount = 0; }
      this.flowDirty = true;
    }
    remove(building) {
      this.navigationVersion++;
      for (const cell of this.cells(building)) if (this.occupancy[index(cell.x, cell.y)] === building.id) this.occupancy[index(cell.x, cell.y)] = 0;
      this.buildings.delete(building.id); this.flowDirty = true;
    }
    rewrite(building, oldCells) {
      this.navigationVersion++;
      for (const cell of oldCells) if (this.occupancy[index(cell.x, cell.y)] === building.id) this.occupancy[index(cell.x, cell.y)] = 0;
      for (const cell of this.cells(building)) this.occupancy[index(cell.x, cell.y)] = building.id;
      this.flowDirty = true;
    }
    atCell(gx, gy) {
      if (gx < 0 || gy < 0 || gx >= WORLD_TILES || gy >= WORLD_TILES) return null;
      return this.buildings.get(this.occupancy[index(gx, gy)]) || null;
    }
    at(x, y) { return this.atCell(grid(x), grid(y)); }
    placement(def, gx, gy, rotation = 0, ignoreId = 0) {
      const [w, h] = rotateSize(def, rotation);
      if (gx < 1 || gy < 1 || gx + w >= WORLD_TILES - 1 || gy + h >= WORLD_TILES - 1) return { valid: false, reason: 'Hors de la zone' };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const id = this.occupancy[index(gx + x, gy + y)];
        if (id && id !== ignoreId) return { valid: false, reason: 'Emplacement occupé' };
      }
      const l = gx * TILE - 4, t = gy * TILE - 4, r = (gx + w) * TILE + 4, b = (gy + h) * TILE + 4;
      for (const node of this.nodes) if (!node.depleted && node.x + node.radius > l && node.x - node.radius < r && node.y + node.radius > t && node.y - node.radius < b) return { valid: false, reason: 'Ressource à déblayer' };
      return { valid: true, reason: '' };
    }
    line(a, b) { return wallLine(a, b); }
    nearestNode(x, y, max = 1000, type = null) {
      let result = null, best = max * max;
      for (const node of this.nodes) { if (node.depleted || (type && node.type !== type)) continue; const d = (node.x - x) ** 2 + (node.y - y) ** 2; if (d < best) { best = d; result = node; } }
      return result;
    }
    nearestStorage(x, y) {
      let result = null, best = Infinity;
      for (const b of this.buildings.values()) if (!b.dead && b.completed && (b.type === 'core' || b.type === 'warehouse' || b.def.storageDepot)) { const d = (b.x - x) ** 2 + (b.y - y) ** 2; if (d < best) { best = d; result = b; } }
      return result;
    }
    has(type) { for (const b of this.buildings.values()) if (!b.dead && b.completed && b.type === type) return true; return false; }
    incomplete() { return [...this.buildings.values()].filter(b => !b.dead && !b.completed); }
    solidForFriendly(x, y) { const b = this.at(x, y); return T.blocksFriendly(b) ? b : null; }
    movementCost(gx, gy) {
      const b = this.atCell(gx, gy); if (!b || b.dead) return 10; if (!b.completed) return 24; if (b.type === 'core') return 8;
      if (b.def.gate) return T.openGate(b) ? 10 : b.type === 'armoredGate' ? 72 : 48;
      if (b.type === 'woodWall') return 105; if (b.type === 'steelWall') return 155; if (b.type === 'concreteWall') return 225;
      if (b.def.wall) return 130; if (b.def.defense) return 185; return 245;
    }
    generateNodes() {
      const rnd = new Random(this.seed), center = WORLD_SIZE / 2;
      const addCluster = (type, cx, cy, count, spread) => {
        const amountBase = { wood: 85, scrap: 70, stone: 100, food: 55, fuel: 45 }, size = { wood: 22, scrap: 20, stone: 24, food: 17, fuel: 18 };
        for (let i = 0; i < count; i++) {
          const a = rnd.range(0, Math.PI * 2), rr = Math.sqrt(rnd.next()) * spread;
          const x = clamp(cx + Math.cos(a) * rr, 70, WORLD_SIZE - 70), y = clamp(cy + Math.sin(a) * rr, 70, WORLD_SIZE - 70);
          if (Math.hypot(x - center, y - center) < 260) continue;
          const amount = amountBase[type] * rnd.range(.72, 1.35);
          this.nodes.push(new ResourceNode(this.nodeId++, type, x, y, amount, size[type] * rnd.range(.8, 1.2), rnd.int(0, 4)));
        }
      };
      const clusters = { wood: 26, scrap: 22, stone: 18, food: 17, fuel: 12 };
      for (const type of Object.keys(clusters)) for (let c = 0; c < clusters[type]; c++) {
        const a = rnd.range(0, Math.PI * 2), r = rnd.range(350, WORLD_SIZE * .64), cx = clamp(center + Math.cos(a) * r, 120, WORLD_SIZE - 120), cy = clamp(center + Math.sin(a) * r, 120, WORLD_SIZE - 120);
        addCluster(type, cx, cy, type === 'wood' ? rnd.int(4, 9) : rnd.int(2, 6), type === 'wood' ? 105 : 75);
      }
      const starter = [['wood',-330,-170],['wood',330,120],['scrap',-250,290],['scrap',290,-300],['stone',430,30],['food',-100,420],['fuel',120,-430]];
      for (const [type, ox, oy] of starter) addCluster(type, center + ox, center + oy, type === 'wood' ? 6 : 4, 58);
    }
  }

  class FlowField {
    constructor() { this.values = new Int32Array(WORLD_TILES * WORLD_TILES); this.heap = new MinHeap(); }
    rebuild(map, target) {
      this.values.fill(0x3fffffff); this.heap.clear();
      const tx = grid(target.x), ty = grid(target.y), start = index(tx, ty); this.values[start] = 0; this.heap.push(start, 0);
      const dirs = [[-1,0,10],[1,0,10],[0,-1,10],[0,1,10]];
      while (this.heap.size) {
        const current = this.heap.pop(); if (!current || current.priority !== this.values[current.index]) continue;
        const x = current.index % WORLD_TILES, y = Math.floor(current.index / WORLD_TILES);
        for (const [dx, dy, step] of dirs) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
          const i = index(nx, ny), cost = current.priority + step + map.movementCost(nx, ny);
          if (cost < this.values[i]) { this.values[i] = cost; this.heap.push(i, cost); }
        }
      }
      map.flowDirty = false;
    }
    direction(x, y, bias, time) {
      const gx = grid(x), gy = grid(y), dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      let bx = gx, by = gy, best = this.values[index(gx, gy)];
      for (let i = 0; i < dirs.length; i++) {
        const nx = gx + dirs[i][0], ny = gy + dirs[i][1]; if (nx < 0 || ny < 0 || nx >= WORLD_TILES || ny >= WORLD_TILES) continue;
        const score = this.values[index(nx, ny)] + Math.sin(bias + i * 4.17 + time * .3) * 2.5;
        if (score < best) { best = score; bx = nx; by = ny; }
      }
      const dx = world(bx) - x, dy = world(by) - y, l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l };
    }
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById('game'); this.ctx = this.canvas.getContext('2d', { alpha: false });
      this.minimap = document.getElementById('minimap'); this.mctx = this.minimap.getContext('2d');
      if (!this.ctx || !this.mctx) throw new Error('Canvas 2D indisponible.');
      this.audio = new AudioSystem(); this.state = 'menu'; document.body.dataset.phase = 'menu'; this.paused = false; this.gameOver = false;
      this.dpr = 1; this.width = innerWidth; this.height = innerHeight; this.lastFrame = performance.now(); this.nextId = 1;
      this.input = { keys: new Set(), pressed: new Set(), mouseX: this.width / 2, mouseY: this.height / 2, mouseWorldX: WORLD_SIZE / 2, mouseWorldY: WORLD_SIZE / 2, mouseDown: false, touchFire: false };
      this.camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, zoom: 1, shake: 0 };
      this.random = new Random(Date.now()); this.world = new WorldMap(17117); this.flow = new FlowField();
      this.resources = makeBag(); this.player = this.makePlayer(); this.units = []; this.zombies = []; this.projectiles = []; this.particles = []; this.corpses = []; this.floaters = [];
      this.buckets = new Map(); this.bucketSize = 160; this.notifications = []; this.notificationId = 1;
      this.difficulty = DIFFICULTIES.standard; this.wave = 1; this.phase = 'calm'; this.phaseTime = 80; this.spawnQueue = []; this.pendingSpawns = normalizeSpawnCounts(); this.spawnTimer = 0; this.fronts = []; this.wavePlan = null;
      this.elapsed = 0; this.dayClock = .24; this.weather = 0; this.weatherTarget = 0; this.morale = 100; this.damageFlash = 0;
      this.cityScore = 0; this.tier = CITY_TIERS[0]; this.housing = 0; this.population = 1; this.storage = 500; this.powerGenerated = 0; this.powerUsed = 0; this.powerRatio = 1; this.signature = 0;
      this.research = normalizeResearch(); this.activeCrisis = null; this.depositedResources = 0; this.settings = this.loadSettings(); this.audio.setMuted(this.settings.muted);
      this.workerOrder = 'auto'; this.runId = null; this.scenarioId = 'classic'; this.narrative=globalThis.DeadwallNarrative.create();
      this.profile = globalThis.DeadwallProfile?.create({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) });
      this.profileStatus = this.profile?.load();
      this.audio.setVolume(this.settings.volume);
      this.rally = { x: WORLD_SIZE / 2 + 110, y: WORLD_SIZE / 2 }; this.rallyPlacement = false;
      this.selectedBuild = null; this.buildRotation = 0; this.wallStart = null; this.wallPreview = []; this.selectedBuilding = null;
      this.interactionText = ''; this.stats = createStats(); this.objectiveIndex = 0; this.objectiveProgress = 0; this.objectiveReady = false;
      this.economyTimer = 0; this.metricsTimer = 0; this.uiTimer = 0; this.minimapTimer = 0; this.saveTimer = 0; this.flowTimer = 0;
      this.ui = {}; this.currentCategory = 'colony'; this.lastBuildTier = -1; this.lastBuildSelection = ''; this.buildCollapsed = false;
      this.compactMediaQuery = globalThis.matchMedia?.('(pointer: coarse), (max-width: 720px)') || null; this.compactViewport = null;
      this.activeOverlay = null; this.overlayFocusTargets = new Map(); this.gameplayFocusTarget = null; this.helpWasPaused = null;
      // Classic document scripts can still be downloading after the engine is
      // constructed. Let every extension install before a campaign can begin.
      const loadingDocument = document.readyState === 'loading' && Boolean(document.currentScript);
      this.startupReady = !loadingDocument;
      document.body.classList.toggle('high-contrast', this.settings.highContrast);
      this.cacheUI(); this.createResourceUI(); this.createCategoryUI(); this.bindEvents(); this.resize(); this.refreshContinue(); this.syncOverlayFocus();
      const params = new URLSearchParams(location.search);
      let startupCompleted = false;
      const finishStartup = () => {
        if (startupCompleted) return; startupCompleted = true;
        this.startupReady = true; this.refreshContinue();
        // The timer runs after the remaining DOMContentLoaded installers,
        // including the command presentation and illustrated campaign entry.
        if (params.get('autostart') === '1') setTimeout(() => {
          if (this.state === 'menu' && this.activeOverlay === this.ui.mainMenu) this.startNew(params.get('difficulty') || 'standard');
        }, 50);
      };
      if (loadingDocument) document.addEventListener('DOMContentLoaded', finishStartup, { once: true });
      else finishStartup();
      requestAnimationFrame(t => this.loop(t));
    }

    makePlayer(id = this.nextId++) {
      return {
        id, x: WORLD_SIZE / 2 + 130, y: WORLD_SIZE / 2, radius: 13,
        health: 100, maxHealth: 100, dead: false, downTimer: 0, invulnerable: 0,
        facing: 0, vx: 0, vy: 0, stamina: 100, maxStamina: 100,
        weapon: 'pistol', magazine: { pistol: 12, rifle: 30, shotgun: 8 },
        reload: 0, reloadTotal: 0, shootCooldown: 0, meleeCooldown: 0,
        carry: makeBag(), carryCapacity: 36, interactionProgress: 0
      };
    }

    cacheUI() {
      const ids = ['hud','rightPanel','mainMenu','pauseMenu','helpModal','gameOver','newGameButton','continueButton','resources','buildCategories','buildList','leftPanel','cityTier','populationValue','powerValue','moraleValue','phaseLabel','waveNumber','waveTimer','threatFill','waveIntel','objectiveTitle','objectiveText','objectiveFill','objectiveCounter','interactionHint','weaponName','weaponAmmo','reloadBar','notifications','damageVignette','carryValue','selectionCard','selectionName','selectionDescription','selectionHealthFill','selectionStats','gameOverStats','recruitWorker','recruitSoldier','repairSelected','upgradeSelected','prioritySelected','researchButton','researchName','researchInsight','settingsToggle','soundToggle','soundStatus','touchControls','touchAction','touchFire','toggleBuild'];
      for (const id of ids) this.ui[id] = document.getElementById(id);
      this.ui.settingsModal = document.getElementById('settingsModal');
      this.ui.commandModal = document.getElementById('commandModal');
    }

    createResourceUI() {
      this.ui.resources.replaceChildren(); this.resourceEls = {}; this.resourceItems = {};
      for (const key of RESOURCE_KEYS) {
        const meta = RESOURCE_META[key], item = document.createElement('div'); item.className = 'resource-item'; item.dataset.resource = key;
        item.innerHTML = `<small><i class="resource-dot" style="background:${meta.color}"></i>${meta.label}</small><strong>0</strong>`;
        this.resourceEls[key] = item.querySelector('strong'); this.resourceItems[key] = item; this.ui.resources.appendChild(item);
      }
    }

    createCategoryUI() {
      this.ui.buildCategories.replaceChildren();
      for (const [id, label] of [['colony','COLONIE'],['industry','INDUSTRIE'],['defense','DÉFENSE']]) {
        const button = document.createElement('button'); button.textContent = label; button.dataset.category = id; button.classList.toggle('active', id === this.currentCategory);
        button.addEventListener('click', () => { this.audio.ui(); this.currentCategory = id; [...this.ui.buildCategories.children].forEach(n => n.classList.remove('active')); button.classList.add('active'); this.refreshBuildMenu(true); });
        this.ui.buildCategories.appendChild(button);
      }
    }

    bindEvents() {
      const playable = () => this.state === 'playing' && !this.paused && !this.gameOver && !this.activeOverlay;
      const hardwareKeys = new Set(), controls = new Set();
      const pointerHolds = code => [...controls].some(control => control.code === code && control.pointers.size > 0);
      const syncHeld = code => {
        if (code === 'fire') {
          this.input.touchFire = pointerHolds('fire');
          this.input.mouseDown = Boolean(this.mouseFireHeld || this.input.touchFire);
        } else if (hardwareKeys.has(code) || pointerHolds(code)) this.input.keys.add(code);
        else this.input.keys.delete(code);
      };
      this.clearHeldControls = () => {
        hardwareKeys.clear();
        for (const control of controls) {
          const ids = [...control.pointers]; control.pointers.clear();
          for (const id of ids) if (control.button.hasPointerCapture?.(id)) {
            try { control.button.releasePointerCapture(id); } catch {}
          }
        }
      };
      this.bindHeldControl = (button, code) => {
        if (!button) return;
        const control = { button, code, pointers: new Set() }; controls.add(control);
        button.addEventListener('pointerdown', event => {
          if (!playable() || button.disabled || button.closest('[inert]') || event.button !== 0 || control.pointers.has(event.pointerId)) return;
          event.preventDefault(); this.audio.unlock(); control.pointers.add(event.pointerId);
          try { button.setPointerCapture?.(event.pointerId); } catch {}
          syncHeld(code);
        });
        const release = event => {
          if (!control.pointers.delete(event.pointerId)) return;
          if (event.cancelable) event.preventDefault();
          syncHeld(code);
        };
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release);
        // A release outside the button also completes the gesture if capture is unavailable.
        addEventListener('pointerup', release); addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', event => {
          if (!button.hasPointerCapture?.(event.pointerId)) release(event);
        });
      };
      const mousePosition = event => {
        this.input.mouseX = event.clientX; this.input.mouseY = event.clientY; this.updateMouseWorld();
      };
      const cancelWallDrag = () => { this.wallStart = null; this.wallPreview = []; };
      const cancelCanvasPointer = event => {
        if (event.pointerId !== this.canvasPointerId) return;
        this.canvasPointerId = null; cancelWallDrag();
      };
      addEventListener('resize', () => this.resize());
      this.compactMediaQuery?.addEventListener?.('change', () => this.resize());
      addEventListener('blur', () => this.suspendForFocusLoss());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.suspendForFocusLoss(); });
      addEventListener('keydown', event => {
        if (event.code === 'Escape') { event.preventDefault(); if (!event.repeat) this.onEscape(); return; }
        if (event.code === 'Tab' && this.activeOverlay) { this.trapOverlayFocus(event); return; }
        if (!playable()) return;
        if (event.target?.closest?.('#resources')) return;
        if (event.target?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
        // Browser/OS shortcuts must not move, reload or command the colony.
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.target?.closest?.('button, summary, a[href], [role="button"]') && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(event.code)) return;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
        if (!event.repeat) this.input.pressed.add(event.code);
        hardwareKeys.add(event.code); this.input.keys.add(event.code);
      });
      addEventListener('keyup', event => { hardwareKeys.delete(event.code); syncHeld(event.code); });
      this.canvas.addEventListener('mousemove', event => { if (this.canvasPointerId == null) mousePosition(event); });
      this.canvas.addEventListener('mousedown', event => {
        if (this.canvasPointerId != null || event.sourceCapabilities?.firesTouchEvents) return;
        this.audio.unlock(); mousePosition(event);
        if (!playable()) return;
        if (event.button === 0) {
          if (this.rallyPlacement) { this.placeSquadRally({ x: this.input.mouseWorldX, y: this.input.mouseWorldY }); return; }
          if (this.selectedBuild) {
            const def = BUILDINGS[this.selectedBuild];
            if (this.isLineWall(def)) { this.wallStart = { x: grid(this.input.mouseWorldX), y: grid(this.input.mouseWorldY) }; this.wallPreview = [this.wallStart]; }
            else this.placeOne(this.selectedBuild, grid(this.input.mouseWorldX), grid(this.input.mouseWorldY), this.buildRotation);
            return;
          }
          this.mouseFireHeld = true; syncHeld('fire');
        } else if (event.button === 2) {
          event.preventDefault();
          if (this.selectedBuild || this.rallyPlacement) this.cancelPlacement();
          else this.selectBuilding(this.world.at(this.input.mouseWorldX, this.input.mouseWorldY));
        }
      });
      this.canvas.addEventListener('mouseup', event => {
        if (event.button !== 0 || this.canvasPointerId != null || event.sourceCapabilities?.firesTouchEvents) return;
        this.mouseFireHeld = false; syncHeld('fire'); mousePosition(event);
        const type = this.selectedBuild, cells = this.wallStart ? [...this.wallPreview] : [];
        cancelWallDrag();
        if (playable() && type && cells.length) this.placeWallLine(type, cells);
      });
      addEventListener('mouseup', event => {
        if (event.button !== 0 || this.canvasPointerId != null) return;
        this.mouseFireHeld = false; syncHeld('fire');
        if (event.target !== this.canvas) cancelWallDrag();
      });
      this.canvas.addEventListener('mouseleave', () => { if (this.canvasPointerId != null) return; this.mouseFireHeld = false; syncHeld('fire'); cancelWallDrag(); });
      this.canvas.addEventListener('contextmenu', event => event.preventDefault());
      this.canvas.addEventListener('wheel', event => {
        event.preventDefault(); if (!playable()) return;
        this.zoomView(event.deltaY > 0 ? .9 : 1.1); mousePosition(event);
      }, { passive: false });
      this.canvas.style.touchAction = 'none';
      this.canvas.addEventListener('pointerdown', event => {
        if (!event.pointerType || event.pointerType === 'mouse' || !playable() || this.canvasPointerId != null || event.button !== 0) return;
        event.preventDefault(); this.audio.unlock(); this.canvasPointerId = event.pointerId;
        try { this.canvas.setPointerCapture?.(event.pointerId); } catch {}
        mousePosition(event);
        if (this.rallyPlacement) this.placeSquadRally({ x: this.input.mouseWorldX, y: this.input.mouseWorldY });
        else if (this.selectedBuild) {
          if (this.isLineWall(BUILDINGS[this.selectedBuild])) { this.wallStart = { x: grid(this.input.mouseWorldX), y: grid(this.input.mouseWorldY) }; this.updateWallPreview(); }
          else this.placeOne(this.selectedBuild, grid(this.input.mouseWorldX), grid(this.input.mouseWorldY), this.buildRotation);
        } else this.selectBuilding(this.world.at(this.input.mouseWorldX, this.input.mouseWorldY));
      });
      this.canvas.addEventListener('pointermove', event => {
        if (event.pointerId !== this.canvasPointerId) return;
        event.preventDefault(); mousePosition(event);
      });
      this.canvas.addEventListener('pointerup', event => {
        if (event.pointerId !== this.canvasPointerId) return;
        event.preventDefault(); mousePosition(event);
        const type = this.selectedBuild, cells = this.wallStart ? [...this.wallPreview] : [];
        this.canvasPointerId = null; cancelWallDrag();
        if (this.canvas.hasPointerCapture?.(event.pointerId)) {
          try { this.canvas.releasePointerCapture(event.pointerId); } catch {}
        }
        if (playable() && type && cells.length) this.placeWallLine(type, cells);
      });
      this.canvas.addEventListener('pointercancel', cancelCanvasPointer);
      this.canvas.addEventListener('lostpointercapture', cancelCanvasPointer);
      const touchMap = { up: 'KeyW', left: 'KeyA', right: 'KeyD', down: 'KeyS' };
      for (const button of document.querySelectorAll('#touchControls button[data-dir]')) {
        const code = touchMap[button.dataset.dir]; if (code) this.bindHeldControl(button, code);
      }
      this.bindHeldControl(this.ui.touchAction, 'KeyE'); this.bindHeldControl(this.ui.touchFire, 'fire');

      const click = (id, fn) => { const button = document.getElementById(id); button.addEventListener('click', event => { if (!button.disabled && !button.closest('[inert]')) fn(event); }); };
      click('newGameButton', () => this.requestNewGame());
      click('randomMapSeedButton', () => {
        const input = document.getElementById('mapSeed');
        input.value = String(this.freshMapSeed()); input.setCustomValidity?.('');
        input.dispatchEvent?.(new Event('input', { bubbles: true }));
      });
      click('continueButton', () => this.load());
      click('howToButton', () => this.showHelp(true)); click('helpPauseButton', () => this.showHelp(true)); click('closeHelp', () => this.showHelp(false));
      click('pauseButton', () => this.togglePause()); click('resumeButton', () => this.togglePause(false)); click('saveButton', () => this.save(true));
      click('quitButton', () => this.returnToMenu()); click('restartButton', () => this.startNew(this.difficulty.id, String(this.world.seed), this.scenarioId)); click('gameOverMenuButton', () => this.returnToMenu());
      click('gameOverNewMapButton', () => this.startNew(this.difficulty.id, '', this.scenarioId));
      click('toggleBuild', () => this.setBuildCollapsed(!this.buildCollapsed));
      click('closeSelection', () => this.selectBuilding(null)); click('repairSelected', () => this.repairSelected()); click('upgradeSelected', () => this.upgradeSelected()); click('demolishSelected', () => this.requestDemolition());
      click('demolitionCancel', () => this.cancelDemolition(true)); click('demolitionConfirm', () => this.confirmDemolition());
      click('recruitWorker', () => this.recruit('worker')); click('recruitSoldier', () => this.recruit('soldier')); click('setRally', () => this.beginSquadRally(null));
      click('repairAll', () => this.repairAll());
      if (this.ui.prioritySelected) click('prioritySelected', () => this.cyclePriority());
      if (this.ui.researchButton) click('researchButton', () => this.showCommand ? this.showCommand(true, 'research') : this.launchResearch());
      if (this.ui.settingsToggle) click('settingsToggle', () => this.showSettings ? this.showSettings(true) : this.toggleAccessibility());
      if (this.ui.soundToggle) click('soundToggle', () => this.toggleSound());
      for (const id of ['mainMenu','pauseMenu','helpModal','gameOver']) document.getElementById(id).addEventListener('mousedown', event => event.stopPropagation());
    }

    selectedDifficulty() {
      const value = document.querySelector('input[name="difficulty"]:checked')?.value;
      return value === 'story' || value === 'brutal' ? value : 'standard';
    }

    resize() {
      this.width = Math.max(320, innerWidth); this.height = Math.max(360, innerHeight); this.dpr = Math.min(this.settings.quality==='low'?1:2, Math.max(1, devicePixelRatio || 1));
      this.canvas.width = Math.floor(this.width * this.dpr); this.canvas.height = Math.floor(this.height * this.dpr); this.canvas.style.width = `${this.width}px`; this.canvas.style.height = `${this.height}px`;
      const compact = this.isCompactViewport();
      if (compact && this.compactViewport !== compact) this.buildCollapsed = true;
      this.compactViewport = compact; this.setBuildCollapsed(this.buildCollapsed);
    }

    isCompactViewport() { return this.compactMediaQuery ? this.compactMediaQuery.matches : innerWidth <= 720; }

    releaseInputs() {
      this.clearHeldControls?.();
      this.input.keys.clear(); this.input.pressed.clear(); this.input.mouseDown = false; this.input.touchFire = false;
      this.mouseFireHeld = false;
      const pointerId = this.canvasPointerId;
      this.canvasPointerId = null;
      this.wallStart = null; this.wallPreview = [];
      if (pointerId != null && this.canvas.hasPointerCapture?.(pointerId)) {
        try { this.canvas.releasePointerCapture(pointerId); } catch {}
      }
    }

    suspendForFocusLoss() {
      this.releaseInputs();
      // Never auto-resume: returning to the window must be a deliberate action.
      if (this.helpWasPaused === false && this.state === 'playing' && !this.gameOver) { this.helpWasPaused = true; this.ui.pauseMenu.classList.remove('hidden'); }
      if (this.state === 'playing' && !this.gameOver && !this.paused) this.togglePause(true);
    }

    overlayFocusable(overlay) {
      const candidates = [...overlay.querySelectorAll('button, input, select, textarea, summary, a[href], [contenteditable="true"], [tabindex]')]
        .filter(node => {
          if (node.disabled || node.getAttribute('tabindex') === '-1' || node.closest('[inert], .hidden') || !node.getClientRects().length) return false;
          // Chromium can retain layout rectangles for the non-focusable content of closed details.
          for (let ancestor = node.parentNode; ancestor && ancestor !== overlay; ancestor = ancestor.parentNode) {
            if (ancestor.tagName !== 'DETAILS' || ancestor.open) continue;
            const summary = [...ancestor.children].find(child => child.tagName === 'SUMMARY');
            if (!summary?.contains(node)) return false;
          }
          return true;
        });
      // A radio group is one Tab stop; arrow keys keep their native selection behavior.
      return candidates.filter(node => {
        if (node.type !== 'radio' || !node.name) return true;
        const group = candidates.filter(candidate => candidate.type === 'radio' && candidate.name === node.name && candidate.form === node.form);
        return node === (group.find(candidate => candidate.checked) || group[0]);
      });
    }

    syncOverlayFocus() {
      const overlays = [this.ui.settingsModal, this.ui.helpModal, this.ui.gameOver, this.ui.commandModal, this.ui.pauseMenu, this.ui.mainMenu].filter(Boolean);
      const next = overlays.find(node => !node.classList.contains('hidden')) || null;
      const previous = this.activeOverlay, focused = document.activeElement;
      if (previous && previous.contains(focused)) this.overlayFocusTargets.set(previous, focused);
      if (!previous && next) this.gameplayFocusTarget = focused;
      this.ui.hud.inert = Boolean(next);
      for (const overlay of overlays) overlay.inert = overlay !== next;
      this.activeOverlay = next;
      if (next === previous) return;
      if (next) this.cancelDemolition();
      this.releaseInputs();
      if (next) {
        const candidates = this.overlayFocusable(next), remembered = this.overlayFocusTargets.get(next);
        const target = candidates.includes(remembered) ? remembered : candidates[0] || next;
        if (target === next) next.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      } else {
        const target = this.gameplayFocusTarget;
        this.canvas.setAttribute('tabindex', '-1');
        if (target && (this.ui.hud.contains(target) || target === this.canvas) && !target.closest?.('[inert], .hidden') && target.getClientRects?.().length) target.focus({ preventScroll: true });
        else this.canvas.focus({ preventScroll: true });
        this.gameplayFocusTarget = null;
      }
    }

    trapOverlayFocus(event) {
      const candidates = this.overlayFocusable(this.activeOverlay), first = candidates[0], last = candidates[candidates.length - 1];
      if (!first) { event.preventDefault(); this.activeOverlay.focus({ preventScroll: true }); return; }
      const focused = document.activeElement;
      if (!candidates.includes(focused) || (!event.shiftKey && focused === last) || (event.shiftKey && focused === first)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    }

    updateMouseWorld() {
      this.input.mouseWorldX = (this.input.mouseX - this.width / 2) / this.camera.zoom + this.camera.x;
      this.input.mouseWorldY = (this.input.mouseY - this.height / 2) / this.camera.zoom + this.camera.y;
      if (this.wallStart) this.updateWallPreview();
    }

    updateWallPreview() {
      if (!this.wallStart) return;
      this.wallPreview = this.world.line(this.wallStart, { x: grid(this.input.mouseWorldX), y: grid(this.input.mouseWorldY) });
    }

    isLineWall(def) { return ['woodWall','steelWall','concreteWall'].includes(def.id); }

    requestNewGame() {
      if(this.startupReady===false||this.state!=='menu'||this.activeOverlay!==this.ui.mainMenu)return false;
      this.refreshContinue();
      if(!this.ui.continueButton.disabled){
        const accepted=globalThis.confirm?.('Remplacer la campagne active ? Ses dernières actions seront remplacées. Exportez une copie depuis les paramètres pour la conserver. Annuler ne change rien.');
        if(accepted!==true)return false;
      }
      return this.startNew(this.selectedDifficulty(),document.getElementById('mapSeed')?.value||'',document.getElementById('startScenario')?.value||'classic')!==false;
    }

    freshMapSeed() {
      const seed = globalThis.DeadwallProfile.freshSeed([this.world?.seed, this.lastGeneratedMapSeed]);
      this.lastGeneratedMapSeed = seed;
      return seed;
    }

    startNew(id = 'standard', seedText = '', scenarioId = 'classic') {
      let seed;
      try { seed = globalThis.DeadwallProfile?.normalizeSeed(seedText) ?? null; }
      catch (error) { const input=document.getElementById('mapSeed'); input?.setCustomValidity?.(error.message); input?.reportValidity?.(); return false; }
      document.getElementById('mapSeed')?.setCustomValidity?.('');
      id = typeof id === 'string' && Object.hasOwn(DIFFICULTIES, id) ? id : 'standard';
      let scenario;
      try { scenario = globalThis.DeadwallScenarios.initialState(scenarioId, id); }
      catch (error) { this.notify(error.message, 'danger'); return false; }
      this.scenarioId = scenario.id;
      this.audio.unlock(); this.difficulty = DIFFICULTIES[id]; this.random = new Random(Date.now()); this.nextId = 1;
      this.world = new WorldMap(seed ?? this.previewMapSeed135 ?? this.freshMapSeed()); this.previewMapSeed135 = null; this.flow = new FlowField(); this.units = []; this.zombies = []; this.projectiles = []; this.particles = []; this.corpses = []; this.floaters = []; this.buckets.clear();
      this.fieldMarker=null;this.narrative=globalThis.DeadwallNarrative.create();this.workerOrder = 'auto'; this.runId = 'run:' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + ':' + Math.random().toString(36).slice(2));
      this.resources = makeBag({ wood: 180, scrap: 120, stone: 70, food: 130, fuel: 45, ammo: 180, medicine: 12 });
      if (id === 'story') add(this.resources, { wood: 50, scrap: 35, food: 50, ammo: 50 });
      if (scenario.id !== 'classic') this.resources = scenario.resources;
      this.player = this.makePlayer(); const center = WORLD_TILES / 2; const core = new Building(this.nextId++, 'core', center - 2, center - 2, 0, 1); core.health = core.maxHealth; this.world.add(core);
      if (scenario.id !== 'classic') core.health = scenario.coreHealth;
      this.player.x = core.x + 135; this.player.y = core.y + 20;
      if (scenario.id === 'classic') {
        for (let i = 0; i < 3; i++) this.units.push(new Unit(this.nextId++, 'worker', core.x + this.random.range(-50, 50), core.y + this.random.range(-50, 50)));
      } else {
        for (const kind of scenario.roster) this.units.push(new Unit(this.nextId++, kind, core.x + this.random.range(-50, 50), core.y + this.random.range(-50, 50)));
      }
      this.wave = 1; this.phase = 'calm'; this.phaseTime = 82 * this.difficulty.calmTime; this.spawnQueue = []; this.pendingSpawns = normalizeSpawnCounts(); this.spawnTimer = 0; this.fronts = []; this.wavePlan = null;
      if (scenario.id !== 'classic') this.phaseTime = scenario.calmSeconds;
      this.elapsed = 0; this.dayClock = .24; this.weather = 0; this.weatherTarget = 0; this.morale = 100; this.damageFlash = 0; this.stats = createStats();
      this.research = normalizeResearch(); this.activeCrisis = null; this.depositedResources = 0;
      this.objectiveIndex = 0; this.objectiveProgress = 0; this.objectiveReady = false; this.rally = { x: core.x + 120, y: core.y }; this.gameOver = false; this.paused = false;
      this.squads = globalThis.DeadwallSquads.create(this.rally);
      this.ensureSquads();
      this.cancelPlacement(); this.selectBuilding(null); this.refreshMetrics(true); this.flow.rebuild(this.world, core); this.camera.x = this.player.x; this.camera.y = this.player.y; this.camera.zoom = 1;
      this.ui.commandModal?.classList.add('hidden'); this.state = 'playing'; this.helpWasPaused = null; this.ui.mainMenu.classList.add('hidden'); this.ui.pauseMenu.classList.add('hidden'); this.ui.helpModal.classList.add('hidden'); this.ui.gameOver.classList.add('hidden'); this.ui.hud.classList.remove('hidden'); this.syncOverlayFocus();
      this.notify(`Protocole lancé — difficulté ${this.difficulty.label}.`, 'good'); this.notify('Récoltez puis rapportez les matériaux au centre.'); this.refreshBuildMenu(true); this.updateUI(); this.save(false);
      if (scenario.id !== 'classic') this.notify(globalThis.DeadwallScenarios.get(scenario.id).name + ' — ' + globalThis.DeadwallScenarios.get(scenario.id).tradeoff);
    }

    serialize() {
      this.ensureSquads();
      return {
        version: SAVE_VERSION, timestamp: Date.now(), difficulty: this.difficulty.id, worldSeed: this.world.seed,
        scenarioId: this.scenarioId, squads: this.squads,
        workerOrder: this.workerOrder, runId: this.runId, narrative:this.narrative,
        resources: this.resources, player: { x: this.player.x, y: this.player.y, health: this.player.health, weapon: this.player.weapon, magazine: this.player.magazine, carry: this.player.carry,
          dead: this.player.dead, downTimer: this.player.downTimer, stamina: this.player.stamina, invulnerable: this.player.invulnerable,
          reload: this.player.reload, reloadTotal: this.player.reloadTotal, shootCooldown: this.player.shootCooldown, meleeCooldown: this.player.meleeCooldown },
        buildings: [...this.world.buildings.values()].map(b => ({ id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation,progress:b.progress,health:b.health,corpseLoad:b.corpseLoad,priority:b.priority,gateMode:b.gateMode })),
        units: this.units.filter(u => !u.dead).map(u => ({ id:u.id,kind:u.kind,squad:u.squad,x:u.x,y:u.y,health:u.health,carry:u.carry,carryType:u.carryType,state:u.state,targetNode:u.targetNode,targetBuilding:u.targetBuilding,targetUnit:u.targetUnit,fireCooldown:u.fireCooldown })),
        zombies: this.zombies.filter(z => !z.dead).map(z => ({ id:z.id,kind:z.kind,x:z.x,y:z.y,health:z.health,attackCooldown:z.attackCooldown,
          ...(z.kind==='shielded'||z.kind==='charger'?{facing:z.facing,stagger:z.stagger,rage:z.rage}:{}),...(z.kind==='charger'?{charge:{...z.charge}}:{}) })),
        nodes: this.world.nodes.map(n => [n.id, n.amount]), wave:this.wave, phase:this.phase, phaseTime:this.phaseTime, spawnQueue:this.spawnQueue, pendingSpawns:this.pendingSpawns, fronts:this.fronts, wavePlan:this.wavePlan, spawnTimer:this.spawnTimer,
        elapsed:this.elapsed, dayClock:this.dayClock, weather:this.weather, morale:this.morale, rally:this.rally, stats:this.stats, objectiveIndex:this.objectiveIndex, objectiveProgress:this.objectiveProgress, objectiveReady:this.objectiveReady, nextId:this.nextId,
        randomState:this.random.state, research:this.research, activeCrisis:this.activeCrisis, depositedResources:this.depositedResources
      };
    }

    save(manual = false) {
      if (this.state !== 'playing' || this.gameOver) return false;
      let payload;
      try {
        payload = JSON.stringify(this.serialize()); globalThis.DeadwallSave.parse(payload);
      } catch (error) {
        this.lastSaveStatus={ok:false,code:'invalid-state',time:Date.now(),message:'Sauvegarde refusée : état de campagne incohérent. La dernière copie valide est conservée.'};
        console.error('DEADWALL — validation de sauvegarde', error);
        if(manual)this.notify(this.lastSaveStatus.message,'danger');
        return false;
      }
      try {
        let previous = null;
        try { const raw=localStorage.getItem(SAVE_KEY); if(raw){globalThis.DeadwallSave.parse(raw);previous=raw;} } catch {}
        // Never replace a valid backup with corrupt bytes, and never discard it on a failed primary write.
        localStorage.setItem(SAVE_KEY, payload);
        if(localStorage.getItem(SAVE_KEY)!==payload){const error=new Error('Écriture de sauvegarde non confirmée.');error.code='write-unconfirmed';throw error;}
        const backupFailedBefore=this.lastSaveStatus?.backupOk===false;
        let backupOk=null;
        if(previous){backupOk=false;try{localStorage.setItem(SAVE_BACKUP_KEY,previous);backupOk=localStorage.getItem(SAVE_BACKUP_KEY)===previous;}catch{}}
        this.lastSaveStatus={ok:true,backupOk,time:Date.now(),message:backupOk===false?'Partie sauvegardée. Copie de secours indisponible : exportez une copie depuis les paramètres.':'Sauvegarde locale à jour.'};
        if(backupOk===false)this.lastSaveStatus.code='backup-unavailable';
        this.recordCampaign(false); this.refreshContinue();
        if(manual)this.notify(backupOk===false?this.lastSaveStatus.message:'Partie sauvegardée.',backupOk===false?'danger':'good');
        else if(backupOk===false&&!backupFailedBefore)this.notify(this.lastSaveStatus.message,'danger');
        return true;
      } catch (error) {
        this.lastSaveStatus={ok:false,code:error.code==='write-unconfirmed'?'write-unconfirmed':'storage-unavailable',time:Date.now(),message:error.code==='write-unconfirmed'?'L’écriture locale n’a pas pu être vérifiée. Exportez une copie depuis les paramètres.':'Stockage indisponible. Exportez une copie depuis les paramètres.'};
        console.error(error); if(manual)this.notify(this.lastSaveStatus.message,'danger'); return false;
      }
    }

    restoreSave(input) {
      const data=globalThis.DeadwallSave.validate(input), difficulty=DIFFICULTIES[data.difficulty], nextWorld=new WorldMap(data.worldSeed), nextFlow=new FlowField();
      const savedPositions=new Map((data.fieldcraft?.nodes||[]).map(p=>[p[0],p]));for(const node of nextWorld.nodes){const p=savedPositions.get(node.id);if(p){node.x=p[1];node.y=p[2];}}
      const amounts=new Map(data.nodes);for(const node of nextWorld.nodes)if(amounts.has(node.id)){node.amount=amounts.get(node.id);node.depleted=node.amount<=.01;}
      for(const raw of data.buildings){const b=new Building(raw.id,raw.type,raw.gx,raw.gy,raw.rotation,raw.progress);Object.assign(b,{health:raw.health,corpseLoad:raw.corpseLoad,priority:raw.priority,gateMode:raw.gateMode});nextWorld.add(b);}
      const nextCore=[...nextWorld.buildings.values()].find(b=>b.type==='core');if(!nextCore)throw new Error('Centre absent');
      const nextUnits=data.units.map(raw=>{const unit=new Unit(raw.id,raw.kind,raw.x,raw.y);Object.assign(unit,raw);if(unit.state==='gather'){const node=nextWorld.nodes.find(item=>item.id===unit.targetNode);if(!node||node.depleted||(unit.carry>0&&unit.carryType!==node.type)){unit.state=unit.carry>0?'return':'idle';unit.targetNode=-1;}else unit.think=.3;}return unit;});
      const nextZombies=data.zombies.map(raw=>{const zombie=new Zombie(raw.id,raw.kind,raw.x,raw.y,difficulty,data.wave);zombie.health=Math.min(zombie.maxHealth,raw.health);zombie.attackCooldown=raw.attackCooldown;
        if(raw.kind==='shielded'||raw.kind==='charger'){zombie.facing=raw.facing;zombie.stagger=raw.stagger;zombie.rage=raw.rage;}if(raw.kind==='charger')zombie.charge={...raw.charge};return zombie;});
      // The player is not an allocated save entity; support orders already use
      // the reserved target 0. Loading must not consume a future entity ID.
      const nextPlayer={...this.makePlayer(0),...data.player};nextFlow.rebuild(nextWorld,nextCore);
      // Keep bounded draws in their saved order; compact only large historical queues.
      const buffered=data.spawnQueue.length<=STRATEGY_RULES.spawnBatch?data.spawnQueue.slice():null,pending=C.normalizeSpawnCounts?C.normalizeSpawnCounts(data.pendingSpawns,buffered?[]:data.spawnQueue):null;
      const rebuiltPlan=data.wavePlan||wavePlan(data.wave,difficulty,0);
      // Commit only after the complete candidate world, entities and navigation have been constructed.
      Object.assign(this,{difficulty,nextId:data.nextId,random:new Random(data.randomState),world:nextWorld,flow:nextFlow,resources:data.resources,player:nextPlayer,units:nextUnits,zombies:nextZombies,projectiles:[],particles:[],corpses:[],floaters:[],wave:data.wave,phase:data.phase,phaseTime:data.phaseTime,spawnQueue:pending?(buffered||[]):data.spawnQueue,pendingSpawns:pending||{},fronts:data.fronts,wavePlan:rebuiltPlan,spawnTimer:data.spawnTimer,elapsed:data.elapsed,dayClock:data.dayClock,weather:data.weather,weatherTarget:data.weather,morale:data.morale,rally:data.rally,stats:data.stats,objectiveIndex:data.objectiveIndex,objectiveProgress:data.objectiveProgress,objectiveReady:data.objectiveReady,research:data.research,activeCrisis:data.activeCrisis,depositedResources:data.depositedResources,gameOver:false,paused:false,saveTimer:0,helpWasPaused:null});
      this.fieldMarker=null;this.narrative=data.narrative;this.workerOrder=data.workerOrder;this.runId=data.runId;this.ui.commandModal?.classList.add('hidden');
      this.scenarioId = data.scenarioId; this.squads = data.squads;
      this.buckets.clear();this.cancelPlacement();this.selectBuilding(null);this.refreshMetrics(true);this.camera.x=this.player.x;this.camera.y=this.player.y;
      this.state='playing';for(const node of [this.ui.mainMenu,this.ui.pauseMenu,this.ui.helpModal,this.ui.gameOver,this.ui.settingsModal])node?.classList.add('hidden');this.ui.hud.classList.remove('hidden');this.syncOverlayFocus();this.refreshBuildMenu(true);this.updateUI();this.audio.unlock();return true;
    }

    load() {
      for(const key of [SAVE_KEY,SAVE_BACKUP_KEY,...LEGACY_SAVE_KEYS]){
        try{const raw=localStorage.getItem(key);if(!raw)continue;this.restoreSave(globalThis.DeadwallSave.parse(raw));this.notify(key===SAVE_KEY?'Sauvegarde restaurée.':'Copie de secours restaurée.','good');return true;}
        catch(error){console.warn(`Sauvegarde ignorée (${key})`,error);}
      }
      this.refreshContinue();this.notify('Aucune sauvegarde lisible. La partie actuelle reste intacte.','danger');return false;
    }

    returnToMenu() {
      if (this.state === 'playing' && !this.gameOver && !this.save(false)) {
        this.paused = true; this.releaseInputs(); this.ui.pauseMenu.classList.remove('hidden'); this.syncOverlayFocus();
        this.notify('Sauvegarde impossible : exportez votre partie depuis les paramètres avant de quitter.', 'danger');
        return false;
      }
      this.ui.commandModal?.classList.add('hidden'); this.state = 'menu'; this.paused = false; this.helpWasPaused = null; this.ui.hud.classList.add('hidden'); this.ui.pauseMenu.classList.add('hidden'); this.ui.helpModal.classList.add('hidden'); this.ui.gameOver.classList.add('hidden'); this.ui.mainMenu.classList.remove('hidden');
      document.body.dataset.phase = 'menu'; this.ui.hud.dataset.phase = 'menu'; document.body.classList.remove('morale-critical','power-critical','player-critical','crisis-active','carry-full','is-reloading');
      this.refreshContinue(); this.syncOverlayFocus();
    }

    refreshContinue() {
      this.ui.newGameButton.disabled = this.startupReady === false;
      try{this.ui.continueButton.disabled = this.startupReady === false || !(localStorage.getItem(SAVE_KEY) || LEGACY_SAVE_KEYS.some(key => localStorage.getItem(key)) || localStorage.getItem(SAVE_BACKUP_KEY));}catch{this.ui.continueButton.disabled=true;}
    }
    showHelp(show) {
      const visible = !this.ui.helpModal.classList.contains('hidden'); if (visible === Boolean(show)) return;
      if (show) {
        this.helpWasPaused = this.state === 'playing' && !this.gameOver ? this.paused : null;
        if (this.helpWasPaused !== null) { this.paused = true; this.save(false); }
      } else {
        if (this.helpWasPaused !== null && this.state === 'playing' && !this.gameOver) { this.paused = this.helpWasPaused; this.ui.pauseMenu.classList.toggle('hidden', !this.paused); }
        this.helpWasPaused = null;
      }
      this.ui.helpModal.classList.toggle('hidden', !show); this.syncOverlayFocus();
    }
    onEscape() {
      if(this.ui.settingsModal&&!this.ui.settingsModal.classList.contains('hidden')){this.showSettings?.(false);return;}
      if (!this.ui.helpModal.classList.contains('hidden')) { this.showHelp(false); return; }
      if(this.ui.commandModal&&!this.ui.commandModal.classList.contains('hidden')){this.showCommand?.(false);return;}
      if (this.state !== 'playing' || this.gameOver) return;
      if (this.selectedBuild || this.rallyPlacement) { this.cancelPlacement(); return; }
      this.togglePause();
    }
    togglePause(force) {
      if (this.state !== 'playing' || this.gameOver) return; this.paused = typeof force === 'boolean' ? force : !this.paused; this.releaseInputs(); this.ui.pauseMenu.classList.toggle('hidden', !this.paused); if (this.paused) this.save(false); this.syncOverlayFocus();
    }
    setBuildCollapsed(collapsed){
      this.buildCollapsed=Boolean(collapsed);this.ui.leftPanel.style.transform='';this.ui.leftPanel.classList.toggle('is-collapsed',this.buildCollapsed);
      for (const region of [this.ui.buildCategories, this.ui.buildList, this.ui.leftPanel.querySelector('.build-help')]) {
        if (!region) continue; region.inert = this.buildCollapsed;
        if (this.buildCollapsed && region.contains(document.activeElement)) this.ui.toggleBuild?.focus({ preventScroll: true });
      }
      if(this.ui.toggleBuild){this.ui.toggleBuild.textContent=this.buildCollapsed?'›':'‹';this.ui.toggleBuild.setAttribute('aria-expanded',String(!this.buildCollapsed));this.ui.toggleBuild.setAttribute('aria-label',this.buildCollapsed?'Ouvrir le catalogue':'Replier le catalogue');}
      if(this.ui.rightPanel)this.ui.rightPanel.classList.toggle('hidden',this.isCompactViewport()&&!this.buildCollapsed);
    }
    cancelPlacement() { this.selectedBuild = null; this.wallStart = null; this.wallPreview = []; this.rallyPlacement = false; this.buildRotation = 0; this.refreshBuildMenu(true); }
    selectBuild(id) { this.audio.ui(); this.rallyPlacement = false; this.selectedBuild = this.selectedBuild === id ? null : id; this.wallStart = null; this.wallPreview = []; this.selectBuilding(null); this.refreshBuildMenu(true); if(this.isCompactViewport()&&this.selectedBuild)this.setBuildCollapsed(true); }
    selectBuilding(building) { this.cancelDemolition(); if (this.selectedBuilding) this.selectedBuilding.selected = false; this.selectedBuilding = building && !building.dead ? building : null; if (this.selectedBuilding) this.selectedBuilding.selected = true; }

    placeOne(type, gx, gy, rotation = 0) {
      const def = BUILDINGS[type], check = this.world.placement(def, gx, gy, rotation);
      if (!check.valid) { this.notify(check.reason, 'danger'); return false; }
      if (!canAfford(this.resources, def.cost)) { this.notify('Ressources insuffisantes.', 'danger'); return false; }
      if (def.unlockTier > this.tier.id || (def.requires && !this.world.has(def.requires))) { this.notify('Technologie non disponible.', 'danger'); return false; }
      spend(this.resources, def.cost); const b = new Building(this.nextId++, type, gx, gy, rotation, 0); this.world.add(b); this.stats.buildingsPlaced++; this.audio.build(); this.floaters.push({ x:b.x,y:b.y-20,text:'CHANTIER',color:'#d2a84a',life:1,maxLife:1 }); this.refreshMetrics(true); return true;
    }

    placeWallLine(type, cells) {
      if (!Array.isArray(cells) || cells.length === 0 || cells.some(cell => !cell || !Number.isInteger(cell.x) || !Number.isInteger(cell.y) || cell.x < 0 || cell.y < 0 || cell.x >= WORLD_TILES || cell.y >= WORLD_TILES)) return false;
      const candidate = Object.hasOwn(BUILDINGS, type) ? BUILDINGS[type] : null;
      if (!candidate || !this.isLineWall(candidate) || candidate.unlockTier > this.tier.id || (candidate.requires && !this.world.has(candidate.requires))) { this.notify('Technologie non disponible.', 'danger'); return; }
      const def = BUILDINGS[type], unique = wallLine(cells[0] || { x:0, y:0 }, cells[cells.length - 1] || { x:0, y:0 });
      const cost = scaledCost(def.cost, unique.length);
      if (!canAfford(this.resources, cost)) { this.notify(`Ligne complète impossible : ${resourceText(cost)} requis.`, 'danger'); return; }
      for (const cell of unique) {
        const check = this.world.placement(def, cell.x, cell.y, this.buildRotation);
        if (!check.valid) { this.notify(`Ligne interrompue : ${check.reason}.`, 'danger'); return; }
      }
      spend(this.resources, cost);
      for (const cell of unique) { const b = new Building(this.nextId++, type, cell.x, cell.y, this.buildRotation, 0); this.world.add(b); this.stats.buildingsPlaced++; }
      this.audio.build(); this.notify(`${unique.length} segments planifiés sans trou.`, 'good'); this.refreshMetrics(true);
    }

    structureActionStatus(action, b = this.selectedBuilding) {
      const rules=C.MAINTENANCE_RULES;
      if(!b||b.dead||this.world.buildings.get(b.id)!==b)return{ok:false,cost:{},reason:'Sélectionnez une structure existante.'};
      let cost={},reason='';
      if(action==='repair'){
        const ratio=clamp(1-b.health/b.maxHealth,0,1);
        cost={scrap:Math.ceil(ratio*b.maxHealth/rules.repairHealthPerScrap),wood:b.type==='woodWall'?Math.ceil(ratio*rules.repairWoodPerWall):0,stone:b.type==='concreteWall'?Math.ceil(ratio*rules.repairStonePerWall):0};
        if(!b.completed)reason='Terminez le chantier.';
        else if(b.health>=b.maxHealth)reason='Intégrité complète.';
      }else if(action==='upgrade'){
        const next=BUILDINGS[b.def.upgradeTo];
        if(!next)reason='Aucune amélioration disponible.';
        else{
          cost=scaledCost(next.cost,rules.upgradeFactor);
          if(!b.completed)reason='Terminez le chantier.';
          else if(next.unlockTier>this.tier.id)reason=`Palier requis : ${CITY_TIERS[next.unlockTier].name}.`;
          else if(next.requires&&!this.world.has(next.requires))reason=`${BUILDINGS[next.requires].name} terminé requis.`;
        }
      }else if(action==='demolish'){
        if(b.type==='core')reason='Le centre de commandement ne peut pas être démonté.';
        const cap=Math.max(100,this.storage-(b.completed?(b.def.storage||0):0)),requested=scaledCost(b.def.cost,rules.salvageFactor),refund={},lost={};
        for(const key of RESOURCE_KEYS){refund[key]=Math.min(requested[key]||0,Math.max(0,cap-this.resources[key]));lost[key]=Math.max(0,this.resources[key]-cap);}
        return{ok:!reason&&this.canIssueCommand(),reason:reason||(!this.canIssueCommand()?'Reprenez la partie pour agir.':''),cost,cap,refund,lost};
      }else return{ok:false,cost,reason:'Action inconnue.'};
      if(!reason&&!canAfford(this.resources,cost))reason='Réserves insuffisantes.';
      if(!reason&&!this.canIssueCommand())reason='Reprenez la partie pour agir.';
      return{ok:!reason,cost,reason};
    }
    maintenanceAmounts(bag) {
      return RESOURCE_KEYS.filter(key=>bag[key]>0).map(key=>{
        const value=bag[key],amount=Number.isInteger(value)?String(value):value<.01?'< 0,01':'≈ '+value.toLocaleString('fr-FR',{maximumFractionDigits:2});
        return RESOURCE_META[key].short+' '+amount;
      }).join(' · ')||'aucun matériau';
    }
    repairSelected() {
      const b=this.selectedBuilding,quote=this.structureActionStatus('repair',b);
      if(!quote.ok){this.notify(quote.reason,'danger');return false;}
      if(!spend(this.resources,quote.cost))return false;
      b.health=b.maxHealth;b.underAttack=0;this.audio.build();this.notify(`${b.def.name} réparé.`,'good');this.updateSelectionUI();return true;
    }

    upgradeSelected() {
      const b=this.selectedBuilding,quote=this.structureActionStatus('upgrade',b);
      if(!quote.ok){this.notify(quote.reason,'danger');return false;}
      const next=BUILDINGS[b.def.upgradeTo];if(!spend(this.resources,quote.cost))return false;
      this.cancelDemolition();
      const oldCells = this.world.cells(b), ratio = b.health / b.maxHealth; b.type = next.id; b.health = Math.max(1, next.health * ratio); this.world.rewrite(b, oldCells); this.audio.build(); this.notify(`${next.name} opérationnel.`, 'good'); this.refreshMetrics(true);this.updateSelectionUI();return true;
    }

    demolishSelected() {
      const b=this.selectedBuilding,quote=this.structureActionStatus('demolish',b);
      if(!quote.ok){this.notify(quote.reason,'danger');return false;}
      // The quote includes capacity lost with a warehouse, not an impossible refund.
      for(const key of RESOURCE_KEYS)this.resources[key]=Math.min(quote.cap,this.resources[key]+quote.refund[key]);
      this.world.remove(b);b.dead=true;this.selectBuilding(null);this.notify('Structure démontée. Récupération : '+this.maintenanceAmounts(quote.refund)+'.');this.audio.build();this.refreshMetrics(true);return true;
    }
    requestDemolition(){
      const quote=this.structureActionStatus('demolish');if(!quote.ok)return false;
      this.pendingDemolition=this.selectedBuilding;this.updateSelectionUI();document.getElementById('demolitionCancel')?.focus();return true;
    }
    cancelDemolition(focus=false){
      this.pendingDemolition=null;document.getElementById('demolitionReview')?.classList.add('hidden');
      const button=document.getElementById('demolishSelected');button?.setAttribute('aria-expanded','false');if(focus)button?.focus();
    }
    confirmDemolition(){
      if(!this.pendingDemolition||this.pendingDemolition!==this.selectedBuilding){this.cancelDemolition();return false;}
      const result=this.demolishSelected();if(!result)this.cancelDemolition(true);else this.canvas.focus({preventScroll:true});return result;
    }
    emergencyRepairStatus(){
      const rules=C.MAINTENANCE_RULES,defenses=[...this.world.buildings.values()].filter(b=>!b.dead&&b.completed&&b.def.defense&&b.health<b.maxHealth);
      const missing=defenses.reduce((sum,b)=>sum+b.maxHealth-b.health,0),cost={scrap:Math.ceil(missing/rules.emergencyHealthPerScrap),wood:Math.ceil(missing/rules.emergencyHealthPerWood),stone:Math.ceil(missing/rules.emergencyHealthPerStone)};
      return{defenses,cost,ok:this.canIssueCommand()&&defenses.length>0&&canAfford(this.resources,cost)};
    }

    repairAll() {
      if(!this.canIssueCommand())return false;
      const {defenses,cost}=this.emergencyRepairStatus();
      if (!defenses.length) { this.notify('Les défenses sont déjà intactes.'); return; }
      if (!spend(this.resources, cost)) { this.notify(`Réparation : ${resourceText(cost)} requis.`, 'danger'); return; }
      for (const b of defenses) b.health = b.maxHealth; this.audio.build(); this.notify(`${defenses.length} défenses remises en état.`, 'good');
    }

    canRecruit(kind) {
      const def=Object.prototype.hasOwnProperty.call(C.SURVIVORS,kind)?C.SURVIVORS[kind]:null;
      return Boolean(def&&this.canIssueCommand()&&this.core()&&this.population<this.housing&&this.tier.id>=def.tier&&(!def.requires||this.world.has(def.requires))&&canAfford(this.resources,def.cost));
    }
    recruit(kind) {
      if(!Object.prototype.hasOwnProperty.call(C.SURVIVORS,kind)||!this.canIssueCommand())return false;
      const def=C.SURVIVORS[kind];
      if(!this.canRecruit(kind)){const reason=def.requires&&!this.world.has(def.requires)?`${BUILDINGS[def.requires].name} terminé requis.`:this.tier.id<def.tier?`Nécessite le palier ${CITY_TIERS[def.tier].name}.`:this.population>=this.housing?'Logements insuffisants.':`Recrutement : ${resourceText(def.cost)} requis.`;this.notify(reason,'danger');return false;}
      if(!spend(this.resources,def.cost))return false;
      const core=this.core(),unit=new Unit(this.nextId++,kind,core.x+this.random.range(-35,35),core.y+this.random.range(-35,35));
      if(kind==='soldier'){this.ensureSquads();unit.squad=globalThis.DeadwallSquads.nextGroup(this.units);}
      if(this.workerOrder==='retreat'&&(kind==='worker'||def.specialist))unit.state='flee';
      this.units.push(unit);this.refreshMetrics(true);this.audio.ui();this.notify(`${def.name} prêt à intervenir.`,'good');return true;
    }

    core() { for (const b of this.world.buildings.values()) if (b.type === 'core' && !b.dead) return b; return null; }

    ensureSquads() {
      const Q=globalThis.DeadwallSquads;if(!this.squads)this.squads=Q.create(this.rally);
      const missing=this.units.some(unit=>unit.kind==='soldier'&&!unit.dead&&!Q.validIndex(unit.squad));
      if(missing){const assignments=Q.assignments(this.units);for(const unit of this.units)if(assignments.has(unit.id))unit.squad=assignments.get(unit.id);}
      for(let index=0;index<this.squads.groups.length;index++){
        const group=this.squads.groups[index];if(group.retreatBuildingId===undefined)continue;
        const building=this.world.buildings.get(group.retreatBuildingId);
        if(!building||building.dead||building.health<=0||!building.completed||building.type!=='fallbackRedoubt'){
          delete group.retreatBuildingId;
          for(const unit of this.units)if(unit.kind==='soldier'&&unit.squad===index)unit.navigation=null;
        }
      }
      return this.squads;
    }
    squadRetreatTarget(group) {
      const building=this.world.buildings.get(group?.retreatBuildingId);
      return building&&!building.dead&&building.health>0&&building.completed&&building.type==='fallbackRedoubt'?building:this.core();
    }
    canCommandSquads(){return this.canIssueCommand()&&(!this.activeOverlay||this.activeOverlay===this.ui.commandModal);}
    selectSquad(index) {
      if(!this.canCommandSquads()||!globalThis.DeadwallSquads.validIndex(index))return false;
      this.ensureSquads();if(this.rallyPlacement&&this.rallyPlacement.squad!==index)this.rallyPlacement=false;
      this.squads.selected=index;this.squadUI?.refresh();return true;
    }
    squadRallyStatus(point) {
      const radius=C.SURVIVORS.soldier.radius,margin=radius+4;
      if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<margin||point.y<margin||point.x>WORLD_SIZE-margin||point.y>WORLD_SIZE-margin)return{ok:false,reason:'Choisissez un point à l’intérieur de la carte.'};
      const probe={...point,radius};
      if([...this.world.buildings.values()].some(b=>T.blocksFriendly(b)&&T.overlapsBuilding(b,probe)))return{ok:false,reason:'Ce point est bloqué par un rempart ou une porte verrouillée.'};
      return{ok:true,reason:''};
    }
    squadFormationTarget(unit,group) {
      const radius=unit.radius,margin=radius+4;
      const preferred={x:group.rally.x+unit.offset.x*C.SQUAD_RULES.formationScale,y:group.rally.y+unit.offset.y*C.SQUAD_RULES.formationScale};
      // A valid rally can have an obstructed formation offset, including after a gate closes.
      // Check only nearby footprints, with the full radius and touching cell boundaries.
      for(const point of [preferred,group.rally]){
        if(!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<margin||point.y<margin||point.x>WORLD_SIZE-margin||point.y>WORLD_SIZE-margin)continue;
        const probe={...point,radius};let blocked=false;
        for(let y=Math.ceil((point.y-radius)/TILE)-1;y<=grid(point.y+radius)&&!blocked;y++)for(let x=Math.ceil((point.x-radius)/TILE)-1;x<=grid(point.x+radius);x++){
          const b=this.world.atCell(x,y);if(T.blocksFriendly(b)&&T.overlapsBuilding(b,probe)){blocked=true;break;}
        }
        if(!blocked)return{x:point.x,y:point.y};
      }
      return null;
    }
    setSquadRally(index, point) {
      const Q=globalThis.DeadwallSquads;if(!this.canCommandSquads()||(index!==null&&!Q.validIndex(index)))return false;
      const status=this.squadRallyStatus(point);if(!status.ok){this.notify(status.reason,'danger');this.squadUI?.announce(status.reason);return false;}
      this.ensureSquads();
      if(index===null){this.rally={x:point.x,y:point.y};for(let group=0;group<C.SQUAD_RULES.count;group++)this.squads=Q.withOrder(this.squads,group,'rally',point);}
      else this.squads=Q.withOrder(this.squads,index,'rally',point);
      for(const unit of this.units)if(unit.kind==='soldier'&&(index===null||unit.squad===index))unit.navigation=null;
      const message=index===null?'Ralliement général transmis aux trois sections.':'Section '+C.SQUAD_RULES.labels[index]+' : point de ralliement transmis.';
      this.notify(message,'good');this.squadUI?.announce(message);this.audio.ui();this.save(false);this.squadUI?.refresh();return true;
    }
    retreatSquad(index=this.squads?.selected??0,destination=this.core()) {
      const Q=globalThis.DeadwallSquads;if(!this.canCommandSquads()||!Q.validIndex(index)||!this.core()||!destination||this.world.buildings.get(destination.id)!==destination||destination.dead||destination.health<=0||!destination.completed||!['core','fallbackRedoubt'].includes(destination.type))return false;
      const redoubt=destination.type==='fallbackRedoubt';
      this.ensureSquads();this.squads=Q.withOrder(this.squads,index,'retreat',undefined,redoubt?destination.id:undefined);
      for(const unit of this.units)if(unit.kind==='soldier'&&unit.squad===index)unit.navigation=null;
      if(this.rallyPlacement&&this.rallyPlacement.squad===index)this.rallyPlacement=false;
      const message='Section '+C.SQUAD_RULES.labels[index]+' : repli vers '+(redoubt?'la redoute #'+destination.id:'le centre')+', par les accès ouverts. Riposte conservée, aucune poursuite.';
      this.notify(message);this.squadUI?.announce(message);this.audio.ui();this.save(false);this.squadUI?.refresh();return true;
    }
    beginSquadRally(index=this.squads?.selected??0) {
      if(!this.canCommandSquads()||(index!==null&&!globalThis.DeadwallSquads.validIndex(index)))return false;
      this.ensureSquads();this.cancelPlacement();
      if(this.activeOverlay===this.ui.commandModal)this.showCommand?.(false);
      if(this.paused)this.togglePause(false);
      this.rallyPlacement={squad:index};this.releaseInputs();this.canvas.focus();
      const message=index===null?'Cliquez au sol pour le ralliement général. Échap annule.':'Section '+C.SQUAD_RULES.labels[index]+' : cliquez au sol. Échap annule.';
      this.notify(message);this.squadUI?.announce(message);return true;
    }
    placeSquadRally(point) {
      if(this.state!=='playing'||this.paused||this.gameOver||this.activeOverlay||!this.rallyPlacement)return false;
      const index=this.rallyPlacement===true?null:this.rallyPlacement.squad;
      if(!this.setSquadRally(index,point))return false;
      this.rallyPlacement=false;this.input.mouseDown=false;return true;
    }
    getSquadSummary() {
      const state=this.ensureSquads();
      return state.groups.map((group,index)=>{
        const units=this.units.filter(u=>u.kind==='soldier'&&!u.dead&&u.health>0&&u.squad===index),retreat=group.order==='retreat',destination=retreat?this.squadRetreatTarget(group):null;
        return{index,label:C.SQUAD_RULES.labels[index],order:group.order,rally:{...group.rally},retreatTarget:destination?{id:destination.id,type:destination.type,x:destination.x,y:destination.y}:null,count:units.length,selected:state.selected===index,
          blocked:units.filter(u=>{const target=retreat?destination:this.squadFormationTarget(u,group),arrived=target&&(retreat?this.workerCanWorkAt(u,target,C.SQUAD_RULES.retreatRadius):dist(u,target)<=C.SQUAD_RULES.rallyRadius);return !target||(u.navigation?.cells===null&&!arrived);}).length};
      });
    }

    createProtectedSurvivor(kind, x, y) {
      if (!Object.hasOwn(C.SURVIVORS, kind) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isSafeInteger(this.nextId) || this.nextId < 1 || this.nextId >= 0x7ffffffd) throw new RangeError('Survivant ou compteur invalide.');
      const unit = new Unit(this.nextId, kind, x, y);
      if (x < unit.radius + 4 || y < unit.radius + 4 || x > WORLD_SIZE - unit.radius - 4 || y > WORLD_SIZE - unit.radius - 4 || !this.friendlyPositionClear(unit, x, y)) return null;
      if (kind === 'soldier') unit.squad = globalThis.DeadwallSquads.nextGroup(this.units);
      this.nextId++; this.units.push(unit); return unit;
    }

    coreArrivalPosition(entity, preferred) {
      const core = this.core(); if (!core) return null;
      const margin = entity.radius + 4, probe = { x: preferred.x, y: preferred.y, radius: entity.radius };
      const clear = preferred.x >= margin && preferred.y >= margin && preferred.x <= WORLD_SIZE - margin && preferred.y <= WORLD_SIZE - margin
        && ![...this.world.buildings.values()].some(building => T.blocksFriendly(building) && T.overlapsBuilding(building, probe));
      // The command centre is passable and its footprint cannot overlap a wall.
      // Fall back inside it, never search for an arrival beyond a closed enclosure.
      return clear ? { x: preferred.x, y: preferred.y } : { x: core.x, y: core.y };
    }

    setGateMode(mode, building = this.selectedBuilding) {
      if (!this.canIssueCommand() || !building || this.world.buildings.get(building.id) !== building) return false;
      if (!T.GATE_MODES.includes(mode) || !T.isGate(building) || !T.operational(building)) return false;
      const actors = [this.player, ...this.units, ...this.zombies];
      if (!T.gateChangeAllowed(building, mode, actors)) { this.notify('Passage occupé : éloignez les unités avant de fermer la porte.', 'danger'); return false; }
      if (T.gateMode(building) === mode) return true;
      building.gateMode = mode; this.world.navigationVersion++; this.world.flowDirty = true; this.flowTimer = 0;
      const labels = { auto: 'automatique — passage allié', open: 'ouverte — passage pour tous', closed: 'fermée — passage bloqué' };
      this.audio.ui(); this.notify(`${building.def.name} : ${labels[mode]}.`, mode === 'open' ? 'danger' : 'good');
      this.updateSelectionUI(); this.save(false); return true;
    }

    getEnclosureStatus() {
      const cached = this.enclosureCache;
      if (cached?.world === this.world && cached.version === this.world.navigationVersion) return cached.status;
      const status = T.analyzeEnclosure({ buildings: this.world.buildings.values(), target: this.core() });
      this.enclosureCache = { world: this.world, version: this.world.navigationVersion, status }; return status;
    }

    refreshBuildMenu(force = false) {
      if (!force && this.lastBuildTier === this.tier.id && this.lastBuildSelection === this.selectedBuild) return;
      this.lastBuildTier = this.tier.id; this.lastBuildSelection = this.selectedBuild; this.ui.buildList.replaceChildren();
      for (const def of buildingList(this.currentCategory)) {
        if(def.unlockTier>this.tier.id)continue;
        const lockedTier = def.unlockTier > this.tier.id, lockedReq = !!(def.requires && !this.world.has(def.requires)), locked = lockedTier || lockedReq;
        const button = document.createElement('button'); button.dataset.buildId = def.id; button.className = `build-item${this.selectedBuild === def.id ? ' selected' : ''}${locked ? ' locked' : ''}${!locked && canAfford(this.resources,def.cost) ? ' is-affordable' : ''}`; button.disabled = locked;
        const requirement = lockedReq ? `Nécessite ${BUILDINGS[def.requires].name}` : `Palier ${CITY_TIERS[def.unlockTier].name}`;
        button.innerHTML = `<span class="build-icon">${def.icon}</span><span class="build-copy"><strong>${def.name}</strong><small>${def.description}</small><span class="build-cost">${resourceText(def.cost)}</span></span>${locked?`<span class="lock-label">${requirement}</span>`:''}`;
        button.addEventListener('click', () => this.selectBuild(def.id)); this.ui.buildList.appendChild(button);
      }
    }

    refreshBuildAffordability() {
      for (const button of this.ui.buildList.children) {
        const def = BUILDINGS[button.dataset.buildId]; if (!def || button.disabled) continue;
        button.classList.toggle('is-affordable', canAfford(this.resources, def.cost));
      }
    }

    notify(text, tone = 'normal') {
      const item = { id:this.notificationId++, text, tone, expires:now()+5.2 }; this.notifications.push(item);
      const node = document.createElement('div'); node.className = `notification ${tone === 'normal' ? '' : tone}`; node.dataset.id = item.id; node.dataset.tone = tone; node.textContent = text; this.ui.notifications.prepend(node);
      while (this.ui.notifications.children.length > 4) this.ui.notifications.lastElementChild.remove();
    }

    loop(timestamp) {
      const dt = Math.min(.04, Math.max(0, (timestamp - this.lastFrame) / 1000)); this.lastFrame = timestamp;
      if (this.state === 'playing' && !this.paused && !this.gameOver) this.update(dt);
      this.render(); this.input.pressed.clear(); requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
      if (this.gameOver) return;
      this.elapsed += dt; this.stats.playSeconds += dt; this.dayClock = (this.dayClock + dt / 260) % 1;
      this.updateCrisis(dt);
      this.weather = lerp(this.weather, this.weatherTarget, clamp(dt * .04, 0, 1)); this.damageFlash = Math.max(0, this.damageFlash - dt * 2.8); this.camera.shake = Math.max(0, this.camera.shake - dt * 22);
      if (Math.floor(this.elapsed) > 0 && Math.floor(this.elapsed) % 95 === 0 && Math.floor(this.elapsed - dt) % 95 !== 0) this.weatherTarget = this.random.chance(.42) ? this.random.range(.35, 1) : 0;
      this.handlePressed(); this.updateMouseWorld(); this.updateDirector(dt); this.powerGrid?.step(dt,true);
      if (this.world.flowDirty) { this.flowTimer -= dt; if (this.flowTimer <= 0) { const core = this.core(); if (core) this.flow.rebuild(this.world, core); this.flowTimer = .22; } }
      this.rebuildBuckets(); this.updatePlayer(dt); if (this.gameOver) return;
      this.updateBuildings(dt); if (this.gameOver) return;
      this.updateUnits(dt); if (this.gameOver) return;
      this.updateZombies(dt); if (this.gameOver) return;
      this.rebuildBuckets(); this.updateProjectiles(dt); if (this.gameOver) return;
      this.updateEffects(dt); if (this.gameOver) return;
      this.economyTimer += dt; if (this.economyTimer >= .25) { this.economyTick(this.economyTimer); this.economyTimer = 0; }
      this.metricsTimer -= dt; if (this.metricsTimer <= 0) { this.refreshMetrics(); this.updateObjective(); this.updateNarrative(); this.metricsTimer = .45; }
      this.saveTimer += dt; if (this.saveTimer >= 30) { this.save(false); this.saveTimer = 0; }
      this.uiTimer -= dt; if (this.uiTimer <= 0) { this.updateUI(); this.uiTimer = .09; }
      this.minimapTimer -= dt; if (this.minimapTimer <= 0) { this.renderMinimap(); this.minimapTimer = .22; }
      this.camera.x = lerp(this.camera.x, this.player.x, clamp(dt * 5.2, 0, 1)); this.camera.y = lerp(this.camera.y, this.player.y, clamp(dt * 5.2, 0, 1));
      this.camera.x = clamp(this.camera.x, this.width / this.camera.zoom / 2, WORLD_SIZE - this.width / this.camera.zoom / 2); this.camera.y = clamp(this.camera.y, this.height / this.camera.zoom / 2, WORLD_SIZE - this.height / this.camera.zoom / 2);
      const time = now(); this.notifications = this.notifications.filter(n => n.expires > time); for (const child of [...this.ui.notifications.children]) if (!this.notifications.some(n => String(n.id) === child.dataset.id)) child.remove();
    }

    handlePressed() {
      if (this.input.pressed.has('Digit1')) this.switchWeapon('pistol');
      if (this.input.pressed.has('Digit2')) this.switchWeapon('rifle');
      if (this.input.pressed.has('Digit3')) this.switchWeapon('shotgun');
      if(this.state==='playing'&&!this.paused&&!this.activeOverlay&&!this.gameOver){
        C.SQUAD_RULES.keys.forEach((key,index)=>{if(this.input.pressed.has(key))this.selectSquad(index);});
        if(this.input.pressed.has('KeyG'))this.beginSquadRally();
        if(this.input.pressed.has('KeyT'))this.retreatSquad();
      }
      if (this.input.pressed.has('KeyR')) { if (this.selectedBuild && !this.isLineWall(BUILDINGS[this.selectedBuild])) this.buildRotation = (this.buildRotation + 1) % 4; else this.startReload(); }
      if (this.input.pressed.has('Space')) this.melee();
      if (this.input.pressed.has('KeyB')) this.setBuildCollapsed(!this.buildCollapsed);
    }

    switchWeapon(id) {
      if (WEAPONS[id].tier > this.tier.id) { this.notify(`Arme disponible au palier ${CITY_TIERS[WEAPONS[id].tier].name}.`, 'danger'); return; }
      if (this.player.reload > 0) return; this.player.weapon = id; this.audio.ui();
    }

    startReload() {
      const p = this.player, w = this.arsenal134?.weaponSpec() || WEAPONS[p.weapon]; if (p.dead || p.reload > 0 || p.magazine[p.weapon] >= w.magazine || (this.playerOps131?.reloadAvailable() ?? this.resources.ammo) < w.ammoPerReload) return;
      p.reload = w.reload; p.reloadTotal = w.reload;
    }

    finishReload() {
      const p = this.player, w = this.arsenal134?.weaponSpec() || WEAPONS[p.weapon], missing = w.magazine - p.magazine[p.weapon], possible = Math.min(missing, Math.floor((this.playerOps131?.reloadAvailable() ?? this.resources.ammo) / w.ammoPerReload));
      if (possible > 0) { if (this.playerOps131) { if (!this.playerOps131.spendReload(possible * w.ammoPerReload)) return; } else this.resources.ammo -= possible * w.ammoPerReload; p.magazine[p.weapon] += possible; }
    }

    updatePlayer(dt) {
      const p = this.player; p.shootCooldown = Math.max(0, p.shootCooldown - dt); p.meleeCooldown = Math.max(0, p.meleeCooldown - dt); p.invulnerable = Math.max(0, p.invulnerable - dt);
      if (p.dead) {
        p.downTimer = Math.max(0, p.downTimer - dt); this.interactionText = `Réanimation dans ${Math.ceil(p.downTimer)} s`;
        if (p.downTimer <= 0) { const core = this.core(); if (core) { const arrival = this.coreArrivalPosition(p, { x: core.x + 80, y: core.y }); p.dead = false; p.health = p.maxHealth; p.x = arrival.x; p.y = arrival.y; p.invulnerable = 3; for (const key of RESOURCE_KEYS) p.carry[key] *= .5; this.notify('Vous êtes de nouveau opérationnel.', 'good'); } }
        return;
      }
      if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.reload = 0; this.finishReload(); } }
      const up = this.input.keys.has('KeyW') || this.input.keys.has('KeyZ') || this.input.keys.has('ArrowUp');
      const down = this.input.keys.has('KeyS') || this.input.keys.has('ArrowDown'); const left = this.input.keys.has('KeyA') || this.input.keys.has('KeyQ') || this.input.keys.has('ArrowLeft'); const right = this.input.keys.has('KeyD') || this.input.keys.has('ArrowRight');
      let dx = (right ? 1 : 0) - (left ? 1 : 0), dy = (down ? 1 : 0) - (up ? 1 : 0), len = Math.hypot(dx, dy); if (len) { dx /= len; dy /= len; }
      const sprint = !this.essentials?.carrying() && !this.campaignPack?.carrying() && this.input.keys.has('ShiftLeft') && p.stamina > 2 && len > 0; const speed = (sprint ? 205 : 136) * (this.essentials?.carrying()?C.Essentials.RULES.packSpeed:1) * (this.campaignPack?.movementFactor?.()??1);
      if (sprint) p.stamina = Math.max(0, p.stamina - dt * 25); else p.stamina = Math.min(p.maxStamina, p.stamina + dt * 17);
      p.vx = dx * speed; p.vy = dy * speed; this.moveFriendly(p, p.vx * dt, p.vy * dt);
      if(this.input.touchFire){if(this.nightwatch?.isBlackout())p.facing=Math.atan2(this.input.mouseWorldY-p.y,this.input.mouseWorldX-p.x);const target=this.nightwatch?this.nightwatch.target(p.x,p.y,720):this.nearestZombie(p.x,p.y,720);if(target)p.facing=Math.atan2(target.y-p.y,target.x-p.x);}else p.facing = Math.atan2(this.input.mouseWorldY - p.y, this.input.mouseWorldX - p.x);
      if (this.input.mouseDown && !this.selectedBuild && !this.rallyPlacement) this.shootPlayer();
      // E passes through several legacy owners before the base handler. Gate
      // their common player entry so none can work while the weapon reloads.
      if (p.reload > 0) this.interactionText = 'Rechargement en cours : attendez avant de manipuler le matériel.';
      else this.updateInteraction(dt);
    }

    friendlyPositionClear(entity, x, y) {
      const r = entity.radius * .78;
      return !this.world.solidForFriendly(x-r,y) && !this.world.solidForFriendly(x+r,y) && !this.world.solidForFriendly(x,y-r) && !this.world.solidForFriendly(x,y+r);
    }

    moveFriendly(entity, dx, dy) {
      if(this.infrastructure){const boost=this.infrastructure.speed(entity.x,entity.y);dx*=boost;dy*=boost;}
      const nx = clamp(entity.x + dx, entity.radius + 4, WORLD_SIZE - entity.radius - 4); if (this.friendlyPositionClear(entity, nx, entity.y)) entity.x = nx;
      const ny = clamp(entity.y + dy, entity.radius + 4, WORLD_SIZE - entity.radius - 4); if (this.friendlyPositionClear(entity, entity.x, ny)) entity.y = ny;
    }

    moveUnitToward(unit, target, dt, speed = unit.speed) {
      if (dist(unit, target) < 2) return true;
      const goalX = grid(target.x), goalY = grid(target.y), version = this.world.navigationVersion;
      let route = unit.navigation;
      if (!route || route.goalX !== goalX || route.goalY !== goalY || route.version !== version || (route.retryAt && this.elapsed >= route.retryAt)) {
        const steps = Math.max(1, Math.ceil(dist(unit, target) / (TILE / 3)));
        let direct = true;
        for (let i = 1; i <= steps; i++) if (!this.friendlyPositionClear(unit, lerp(unit.x, target.x, i / steps), lerp(unit.y, target.y, i / steps))) { direct = false; break; }
        if (!direct && this.navigationBudget === 0) return false;
        if (!direct && Number.isFinite(this.navigationBudget)) this.navigationBudget--;
        const cells = direct ? [] : findFriendlyPath({ x: grid(unit.x), y: grid(unit.y) }, { x: goalX, y: goalY }, (x, y) => !this.friendlyPositionClear(unit,world(x),world(y)));
        route = unit.navigation = { goalX, goalY, version, cells, next: 0, direct, retryAt: cells === null ? this.elapsed + STRATEGY_RULES.pathRetrySeconds : 0 };
      }
      if (route.cells === null) return false;
      while (route.next < route.cells.length && Math.hypot(world(route.cells[route.next].x) - unit.x, world(route.cells[route.next].y) - unit.y) < 5) route.next++;
      const cell = route.cells[route.next], waypoint = cell ? { x: world(cell.x), y: world(cell.y) } : target;
      const dx = waypoint.x - unit.x, dy = waypoint.y - unit.y, length = Math.hypot(dx, dy);
      if (!length) return dist(unit, target) < 18;
      unit.facing = Math.atan2(dy, dx);
      const step = Math.min(length, speed * dt), ox = unit.x, oy = unit.y;
      this.moveFriendly(unit, dx / length * step, dy / length * step);
      if (Math.hypot(unit.x - ox, unit.y - oy) < step * .1 && !route.retryAt) route.retryAt = this.elapsed + STRATEGY_RULES.pathRetrySeconds;
      return dist(unit, target) < 18;
    }

    updateInteraction(dt) {
      const p = this.player;
      if (this.state !== 'playing' || this.paused || this.gameOver || p.dead || !(dt > 0) || !Number.isFinite(dt)) { this.interactionText = ''; return; }
      if (p.reload > 0) { this.interactionText = 'Rechargement en cours : attendez avant de manipuler le matériel.'; return; }
      const carried = bagTotal(p.carry);
      const depositable = RESOURCE_KEYS.reduce((total, key) => total + Math.min(p.carry[key], Math.max(0, this.storage - this.resources[key])), 0);
      let storage = null, storageD = 100 * 100, incomplete = null, incompleteD = 78 * 78, node = null, nodeD = 62 * 62;
      // Choose the nearest usable target: a wall must not hide a second, reachable action.
      for (const b of this.world.buildings.values()) {
        if (b.dead) continue;
        const d = this.fieldcraft?this.fieldcraft.distance(p,b)**2:distSq(p,b);
        if (!b.completed && d < incompleteD && this.workerCanWorkAt(p, b, 78)) { incompleteD = d; incomplete = b; }
        if (carried > .01 && b.completed && (b.type === 'core' || b.type === 'warehouse' || b.def.storageDepot) && d < storageD && this.workerCanWorkAt(p, b, 100)) { storageD = d; storage = b; }
      }
      if (carried < p.carryCapacity) for (const candidate of this.world.nodes) {
        if (candidate.depleted) continue;
        const d = this.fieldcraft?this.fieldcraft.distance(p,candidate)**2:distSq(p,candidate);
        if (d < nodeD && this.workerCanWorkAt(p, candidate, 62)) { nodeD = d; node = candidate; }
      }
      let action = null;
      if (storage && depositable > 0 && this.workerCanWorkAt(p,storage,100)) {
        const amount = Math.floor(depositable);
        this.interactionText = amount > 0 ? `Déposer ${amount} unité${amount > 1 ? 's' : ''}` : 'Déposer moins d’une unité';
        action = 'deposit';
      }
      else if (incomplete) { this.interactionText = `Construire ${incomplete.def.name} — ${Math.floor(incomplete.progress*100)} %`; action = 'build'; }
      else if (node && bagTotal(p.carry) < p.carryCapacity) { this.interactionText = node.sceneryKind ? `Fouiller ${C.SCENERY_DEFS[node.sceneryKind].name} · ${RESOURCE_META[node.type].label.toLowerCase()}` : `Récolter ${RESOURCE_META[node.type].label.toLowerCase()}`; action = 'harvest'; }
      else this.interactionText = storage ? 'Stockage plein : dépensez les réserves ou terminez un entrepôt.' : '';
      if (!action) { this.updateNarrativeSurvey?.(dt); return; }
      if (!this.input.keys.has('KeyE')) return;
      if (action === 'deposit') {
        let deposited=0;for (const key of RESOURCE_KEYS) { const room = Math.max(0, this.storage - this.resources[key]), moved = Math.min(room, p.carry[key]); this.resources[key] += moved; p.carry[key] -= moved; deposited+=moved; }this.depositedResources+=deposited;
      } else if (action === 'build') {
        if (incomplete.work(dt * 3.7 * (this.playerOps131?.constructionFactor(dt) ?? 1))) this.completeBuilding(incomplete);
        if (this.random.chance(dt * 8)) this.particles.push(new Particle(incomplete.x+this.random.range(-20,20),incomplete.y+this.random.range(-15,15),this.random.range(-8,8),-18,.6,3,'#c9a05a','spark'));
      } else {
        const room = p.carryCapacity - bagTotal(p.carry), amount = node.harvest(Math.min(room, dt * 10 * this.difficulty.resourceYield * (this.arsenal134?.toolFactor(node.type) ?? 1))); p.carry[node.type] += amount; this.stats.gathered += amount;
        if (amount > 0) this.arsenal134?.wearTool(node.type, dt);
        if (this.random.chance(dt * 8)) this.particles.push(new Particle(node.x+this.random.range(-8,8),node.y+this.random.range(-8,8),this.random.range(-10,10),this.random.range(-20,-5),.5,3,RESOURCE_META[node.type].color,'debris'));
      }
    }

    projectileOrigin(x,y,angle,offset,radius) {
      const source={x,y},muzzle={x:x+Math.cos(angle)*offset,y:y+Math.sin(angle)*offset};
      // A close barrier can lie entirely before the rendered weapon muzzle.
      // Start the sweep at the shooter in that case, so the normal collision
      // resolver applies the impact, including damage to a barricade.
      return this.exploration125?.firstObstruction?.(source,muzzle,radius,true)||this.barricades134?.firstObstruction?.(source,muzzle,radius)?source:muzzle;
    }

    shootPlayer() {
      const p = this.player, w = this.arsenal134?.weaponSpec() || WEAPONS[p.weapon]; if (p.dead || p.reload > 0 || p.shootCooldown > 0) return;
      if (this.arsenal134 && !this.arsenal134.beforeShot()) return;
      if (p.magazine[p.weapon] <= 0) { this.startReload(); return; }
      p.magazine[p.weapon]--; this.arsenal134?.afterShot(); p.shootCooldown = 1 / w.fireRate; this.stats.shots++; this.audio.shot(p.weapon); this.camera.shake = Math.max(this.camera.shake, p.weapon === 'shotgun' ? 8 : p.weapon === 'rifle' ? 3 : 4);
      for (let i = 0; i < w.pellets; i++) {
        const angle = p.facing + this.random.range(-w.spread, w.spread), speed = 970;
        const radius=p.weapon==='shotgun'?1.4:2,origin=this.projectileOrigin(p.x,p.y,angle,22,radius);
        this.projectiles.push(new Projectile(this.nextId++, origin.x, origin.y, Math.cos(angle)*speed, Math.sin(angle)*speed, w.damage, w.range, 'player', '#ffe2a0', radius, w.headshotChance, w.headshotMultiplier));
      }
      for (let i=0;i<3;i++) this.particles.push(new Particle(p.x+Math.cos(p.facing)*25,p.y+Math.sin(p.facing)*25,Math.cos(p.facing)*this.random.range(50,110)+this.random.range(-20,20),Math.sin(p.facing)*this.random.range(50,110)+this.random.range(-20,20),.1,this.random.range(2,4),'#ffd070','muzzle'));
      if (p.magazine[p.weapon] <= 0) this.startReload();
    }

    melee() {
      const p = this.player; if (this.state !== 'playing' || this.paused || this.gameOver || p.dead || p.meleeCooldown > 0) return;
      if (this.arsenal134?.melee()) return;
      p.meleeCooldown = .65; let hit = false;
      for (const z of this.nearbyZombies(p.x, p.y, 55)) {
        const a = Math.atan2(z.y - p.y, z.x - p.x), delta = Math.atan2(Math.sin(a - p.facing), Math.cos(a - p.facing));
        if (z.dead || Math.abs(delta) >= 1.15 || !this.hostileLineClear(p, z)) continue;
        z.health -= this.succession133?.meleeDamage?.() ?? 36; z.stagger = .35; hit = true;
        // Preserve the 20px shove, stopping each short step before a physical obstacle.
        for (let step = 0; step < 5; step++) {
          const nx = clamp(z.x + Math.cos(a) * 4, z.radius + 3, WORLD_SIZE - z.radius - 3);
          const ny = clamp(z.y + Math.sin(a) * 4, z.radius + 3, WORLD_SIZE - z.radius - 3);
          if (!this.hostilePositionClear(z, nx, ny)) break;
          z.x = nx; z.y = ny;
        }
        if (z.health <= 0) this.killZombie(z, false);
      }
      this.audio.tone(hit?90:160,.08,'square',.05,-40); this.camera.shake=Math.max(this.camera.shake,3);
    }

    damagePlayer(amount) {
      const p=this.player;if(p.dead||p.invulnerable>0)return;amount=this.playerOps131?.absorbDamage(amount)??amount;p.health-=amount;this.damageFlash=.32;this.camera.shake=Math.max(this.camera.shake,5);
      if(p.health<=0){p.health=0;p.dead=true;p.downTimer=8;this.input.mouseDown=false;this.notify(this.succession133?'Le survivant est mort. Son équipement reste sur place.':'Commandant à terre — évacuation médicale en cours.','danger');}
    }

    updateBuildings(dt) {
      for (const b of [...this.world.buildings.values()]) {
        if (b.dead) continue; b.fireCooldown=Math.max(0,b.fireCooldown-dt);b.flash=Math.max(0,b.flash-dt);b.underAttack=Math.max(0,b.underAttack-dt);b.corpseLoad=Math.max(0,b.corpseLoad-dt*C.WORKER_RULES.passiveDecayPerSecond);
        if(!b.completed){if(b.work(dt*.075))this.completeBuilding(b);continue;}
        if(b.def.range&&b.powered&&this.resources.ammo>=(b.def.ammoPerShot||1)&&(!this.citadel||this.citadel.canFire(b.def.ammoPerShot||1))&&b.fireCooldown<=0){const target=this.nightwatch?this.nightwatch.target(b.x,b.y,b.def.range):this.nearestZombie(b.x,b.y,b.def.range);if(target){b.turretAngle=Math.atan2(target.y-b.y,target.x-b.x);b.fireCooldown=1/b.def.fireRate;this.resources.ammo-=b.def.ammoPerShot||1;b.flash=.06;this.fireFriendly(b.x,b.y-3,b.turretAngle,b.def.damage*(this.hasResearch('ballistics')?1.12:1),b.def.range,b.type==='heavyTurret'?'#ffc56e':'#ffe4a1');}}
        if(b.type==='clinic'&&b.powered){for(const u of this.units)if(!u.dead&&u.health>0&&distSq(u,b)<130*130&&this.workerCanWorkAt(u,b,130))u.health=Math.min(u.maxHealth,u.health+dt*2.2);if(!this.player.dead&&this.player.health>0&&distSq(this.player,b)<130*130&&this.workerCanWorkAt(this.player,b,130))this.player.health=Math.min(this.player.maxHealth,this.player.health+dt*1.6);}
      }
    }

    completeBuilding(b) {
      if (!b || b.dead) return false;
      const mode = b.def.gate ? T.gateMode(b) : null;
      if (b.def.wall && mode !== 'open') {
        const actors = mode === 'auto' ? this.zombies : [this.player, ...this.units, ...this.zombies];
        if (actors.some(actor => T.overlapsBuilding(b, actor))) {
          // work() has already reached one: keep the footprint non-solid until its occupants leave.
          const haltedProgress=Math.min(b.progress,.999); b.health=Math.max(.001,b.health-(b.progress-haltedProgress)*b.maxHealth*.88); b.progress=haltedProgress;
          if (!b.completionBlocked) this.notify('Chantier bloqué : libérez le passage pour terminer le rempart.', 'danger');
          b.completionBlocked = true; return false;
        }
      }
      b.completionBlocked = false; b.progress=1;b.health=Math.min(b.health,b.maxHealth);this.world.flowDirty=true;this.world.navigationVersion++;this.audio.build();this.notify(`${b.def.name} mis en service.`,'good');this.floaters.push({x:b.x,y:b.y-22,text:'OPÉRATIONNEL',color:'#8fb47e',life:1.2,maxLife:1.2});this.refreshMetrics(true);return true;
    }

    fireFriendly(x,y,angle,damage,range,color) { const speed=900,origin=this.projectileOrigin(x,y,angle,18,2);this.projectiles.push(new Projectile(this.nextId++,origin.x,origin.y,Math.cos(angle)*speed,Math.sin(angle)*speed,damage,range,'friendly',color,2));this.audio.noise(.035,.025,1600); }

    updateUnits(dt) {
      const core=this.core();if(!core)return;
      this.ensureSquads();
      this.navigationBudget=STRATEGY_RULES.pathQueriesPerUpdate;
      const order=this.workerOrder||'auto';
      const unitCount=this.units.length,firstUnit=(this.unitUpdateOffset||0)%Math.max(1,unitCount);
      // Rotate the first claimant so unreachable jobs cannot starve later workers or soldiers of A*.
      this.unitUpdateOffset=(firstUnit+STRATEGY_RULES.pathQueriesPerUpdate)%Math.max(1,unitCount);
      for(let turn=0;turn<unitCount;turn++){const u=this.units[(firstUnit+turn)%unitCount];if(u.dead)continue;u.fireCooldown=Math.max(0,u.fireCooldown-dt);u.think-=dt;
        if(this.expeditions?.updateAssignedUnit(u,dt))continue;
        if(this.salvage?.updateAssignedUnit(u,dt))continue;
        if(this.infrastructure?.updateAssignedUnit(u,dt))continue;
        if(this.citadel?.updateEscort(u,dt))continue;
        if(this.siege?.updateAssignedUnit(u,dt))continue;
        if(this.territories?.updateAssignedUnit(u,dt))continue;
        const danger=this.nearestZombie(u.x,u.y,C.SURVIVORS[u.kind]?.specialist?C.NPC_RULES.dangerRange:105);
        if(u.kind==='worker'){
          if(danger){u.state='flee';this.moveUnitToward(u,core,dt,u.speed*1.25);continue;}
          if(order==='retreat'){this.retreatWorker(u,core,dt);continue;}
          if(u.carry>0&&u.carryType&&(u.state!=='gather'||u.carry>=u.maxCarry-.01))u.state='return';
          if(u.think<=0&&u.state!=='return'){
            u.think=.7+this.random.range(0,.5);
            const currentNode=this.world.nodes.find(n=>n.id===u.targetNode),currentBuilding=this.world.buildings.get(u.targetBuilding);
            const buildWaiting=order==='build'&&this.world.incomplete().some(b=>this.workerJobAvailable(u,`build:${b.id}`));
            const continuing=(u.state==='gather'&&order!=='clear'&&!buildWaiting&&currentNode&&!currentNode.depleted&&this.resources[currentNode.type]<this.storage-.01)||(u.state==='build'&&order==='auto'&&currentBuilding&&!currentBuilding.completed&&!currentBuilding.dead)||(u.state==='clear'&&order==='clear'&&currentBuilding&&currentBuilding.completed&&!currentBuilding.dead&&currentBuilding.corpseLoad>0);
            if(!continuing){
              if(u.carry>0){u.state='return';}
              else{
                const jobs=order==='clear'?[]:this.world.incomplete().filter(b=>this.workerJobAvailable(u,`build:${b.id}`)).sort((a,b)=>(b.priority||2)-(a.priority||2)||distSq(u,a)-distSq(u,b));
                const node=order!=='clear'&&(order==='harvest'||!jobs.length)?this.workerResourceTarget(u):null;
                const cleanup=order==='clear'?this.workerCleanupTarget(u):null;
                if(cleanup){u.targetBuilding=cleanup.id;u.state='clear';}
                else if(node){u.targetNode=node.id;u.state='gather';}
                else if(jobs.length){u.targetBuilding=jobs[0].id;u.state='build';}
                else u.state='idle';
              }
            }
          }
          if(u.state==='build'){
            const b=this.world.buildings.get(u.targetBuilding);
            if(!b||b.completed||b.dead){u.state='idle';u.think=0;}
            else if(T.overlapsBuilding(b,u)){const point=this.workerBuildExit(u,b);if(point)this.moveWorkerToJob(u,point,dt,point.key);}
            else if(!this.workerCanWorkAt(u,b,62))this.moveWorkerToJob(u,b,dt,`build:${b.id}`);
            else if(b.work(dt*(this.hasResearch('logistics')?1.22:1.05)))this.completeBuilding(b);
          }
          else if(u.state==='gather'){const node=this.world.nodes.find(n=>n.id===u.targetNode);if(!node||node.depleted){u.state=u.carry>0?'return':'idle';u.think=0;}else if(!this.workerCanWorkAt(u,node,node.radius+12))this.moveWorkerToJob(u,node,dt,`gather:${node.id}`);else{const room=Math.max(0,u.maxCarry-u.carry),amount=node.harvest(Math.min(room,dt*3.4*this.difficulty.resourceYield*(this.hasResearch('logistics')?1.18:1)));u.carry+=amount;u.carryType=node.type;if(u.carry>=u.maxCarry-.1||node.depleted)u.state='return';}}
          else if(u.state==='clear'){const b=this.world.buildings.get(u.targetBuilding);if(!b||b.dead||!b.completed||!b.def.wall||b.corpseLoad<=0){u.state='idle';u.think=0;}else{const point=this.workerCleanupPoint(u,b);if(this.workerCanWorkAt(u,point,C.WORKER_RULES.cleanupRange))this.clearCorpsesWithWorker(u,b,dt);else this.moveWorkerToJob(u,point,dt,`clear:${b.id}`);}}
          else if(u.state==='return'){const storage=[...this.world.buildings.values()].filter(b=>!b.dead&&b.completed&&(b.type==='core'||b.type==='warehouse'||b.def.storageDepot)&&this.workerJobAvailable(u,`return:${b.id}`)).sort((a,b)=>distSq(u,a)-distSq(u,b))[0];if(storage)this.depositWorker(u,storage,dt);}
          else{const target={x:core.x+u.offset.x,y:core.y+u.offset.y};if(dist(u,target)>35)this.moveUnitToward(u,target,dt,u.speed*.6);}
        } else if(C.SURVIVORS[u.kind]?.specialist){
          this.updateSpecialist(u,dt,danger,core);
        } else if(u.kind==='soldier') {
          const rules=C.SQUAD_RULES,group=this.squads.groups[u.squad],retreat=group.order==='retreat';
          const target=this.nightwatch?this.nightwatch.target(u.x,u.y,rules.range):this.nearestZombie(u.x,u.y,rules.range);
          if(target){const d=dist(u,target);u.facing=Math.atan2(target.y-u.y,target.x-u.x);
            if(d>rules.advanceRange){if(!retreat){if(this.citadel?.isHolding(u)){const post=this.squadFormationTarget(u,group);if(post&&dist(u,post)>rules.rallyRadius)this.moveUnitToward(u,post,dt);}else this.moveUnitToward(u,target,dt,u.speed*rules.pursuitSpeed);}}
            else if(u.fireCooldown<=0&&this.resources.ammo>=1&&(!this.citadel||this.citadel.canFire(1))){u.fireCooldown=rules.fireCooldown;this.resources.ammo-=1;this.fireFriendly(u.x,u.y,u.facing,this.hasResearch('ballistics')?rules.researchedDamage:rules.damage,rules.projectileRange,'#ffe0a0');}
            else if(d<rules.meleeRange&&u.fireCooldown<=0&&this.hostileLineClear(u,target)){u.fireCooldown=rules.meleeCooldown;target.health-=rules.meleeDamage;if(target.health<=0)this.killZombie(target,false);}
          }
          // Being within range across a wreck or wall is not a physical arrival.
          if(retreat){u.state='flee';const destination=this.squadRetreatTarget(group);if(destination&&!this.workerCanWorkAt(u,destination,rules.retreatRadius))this.moveUnitToward(u,destination,dt);}
          else if(!target){u.state='move';const targetPoint=this.squadFormationTarget(u,group);if(targetPoint&&dist(u,targetPoint)>rules.rallyRadius)this.moveUnitToward(u,targetPoint,dt);}
        }
      }
      this.units=this.units.filter(u=>!u.dead);
    }

    updateSpecialist(unit, dt, danger, core) {
      unit.supportActive=false;
      if(danger){unit.state='flee';unit.targetUnit=-1;unit.targetBuilding=-1;this.moveUnitToward(unit,core,dt,unit.speed*C.NPC_RULES.fleeSpeedMultiplier);return;}
      if(this.workerOrder==='retreat'){unit.targetUnit=-1;this.retreatWorker(unit,core,dt);return;}
      if(unit.carry>0){unit.state='return';this.depositWorker(unit,core,dt);return;}
      if(unit.kind==='medic'){
        let target=unit.targetUnit===0?this.player:this.units.find(candidate=>candidate.id===unit.targetUnit);
        if(unit.think<=0||unit.targetUnit!==-1&&!this.medicTargetValid(unit,target)){
          unit.think=C.NPC_RULES.rethinkSeconds;target=this.findMedicTarget(unit);unit.targetUnit=target?(target===this.player?0:target.id):-1;
        }
        if(target){unit.state='repair';if(this.workerCanWorkAt(unit,target,C.NPC_RULES.healRange)){unit.facing=Math.atan2(target.y-unit.y,target.x-unit.x);unit.supportActive=this.healWithMedic(unit,target,dt)>0;}else this.moveWorkerToJob(unit,target,dt,`medic:${unit.targetUnit}`);return;}
      }else{
        let building=this.world.buildings.get(unit.targetBuilding);
        if(unit.think<=0||unit.targetBuilding!==-1&&!this.engineerTargetValid(unit,building)){
          unit.think=C.NPC_RULES.rethinkSeconds;building=this.findEngineerTarget(unit);unit.targetBuilding=building?.id??-1;
        }
        if(building){const point=this.workerBuildExit(unit,building,'repair');if(point){unit.state='repair';if(this.workerCanWorkAt(unit,point,C.NPC_RULES.repairRange)){unit.facing=Math.atan2(building.y-unit.y,building.x-unit.x);unit.supportActive=this.repairWithEngineer(unit,building,dt,point)>0;}else this.moveWorkerToJob(unit,point,dt,point.key);return;}}
      }
      unit.state='idle';const target={x:this.rally.x+unit.offset.x*.35,y:this.rally.y+unit.offset.y*.35};
      if(dist(unit,target)>C.NPC_RULES.rallyRadius)this.moveUnitToward(unit,target,dt);
    }

    medicTargetValid(unit, target) {
      if(!target||target.regionAbsent||target.dead||target.health<=0||target.health>=target.maxHealth||this.resources.medicine<=0||distSq(unit,target)>C.NPC_RULES.searchRadius**2)return false;
      return this.workerJobAvailable(unit,`medic:${target===this.player?0:target.id}`);
    }

    findMedicTarget(unit) {
      return [this.player,...this.units].filter(target=>this.medicTargetValid(unit,target)).sort((a,b)=>a.health/a.maxHealth-b.health/b.maxHealth||distSq(unit,a)-distSq(unit,b))[0]||null;
    }

    healWithMedic(unit, target, dt) {
      if(unit.kind!=='medic'||unit.dead||unit.health<=0||this.workerOrder==='retreat'||!(dt>0)||!target||target.dead||target.health<=0||!this.workerCanWorkAt(unit,target,C.NPC_RULES.healRange))return 0;
      const amount=Math.max(0,Math.min(target.maxHealth-target.health,dt*C.NPC_RULES.healPerSecond,(this.resources.medicine||0)/C.NPC_RULES.medicinePerHealth));
      if(amount>0){this.resources.medicine=Math.max(0,this.resources.medicine-amount*C.NPC_RULES.medicinePerHealth);target.health=Math.min(target.maxHealth,target.health+amount);}
      return amount;
    }

    engineerRepairRates(building) {
      return {scrap:C.NPC_RULES.repairScrapPerHealth,wood:building.type==='woodWall'?C.NPC_RULES.repairWoodPerFullWall/building.maxHealth:0,stone:building.type==='concreteWall'?C.NPC_RULES.repairStonePerFullWall/building.maxHealth:0};
    }

    engineerTargetValid(unit, building) {
      if(!building||building.dead||!building.completed||building.health<=0||building.health>=building.maxHealth||distSq(unit,building)>C.NPC_RULES.searchRadius**2)return false;
      if(Object.entries(this.engineerRepairRates(building)).some(([key,rate])=>rate>0&&!(this.resources[key]>0)))return false;
      return Boolean(this.workerBuildExit(unit,building,'repair'));
    }

    findEngineerTarget(unit) {
      return [...this.world.buildings.values()].filter(building=>this.engineerTargetValid(unit,building)).sort((a,b)=>(b.priority||2)-(a.priority||2)||a.health/a.maxHealth-b.health/b.maxHealth||distSq(unit,a)-distSq(unit,b))[0]||null;
    }

    repairWithEngineer(unit, building, dt, point=null) {
      if(unit.kind!=='engineer'||unit.dead||unit.health<=0||this.workerOrder==='retreat'||!(dt>0)||!building||building.dead||!building.completed||building.health<=0||this.world.buildings.get(building.id)!==building)return 0;
      point=point||this.workerBuildExit(unit,building,'repair');
      if(!point||!this.workerCanWorkAt(unit,point,C.NPC_RULES.repairRange))return 0;
      const rates=this.engineerRepairRates(building);let amount=Math.max(0,Math.min(building.maxHealth-building.health,dt*C.NPC_RULES.repairPerSecond));
      for(const [key,rate]of Object.entries(rates))if(rate>0)amount=Math.min(amount,Math.max(0,this.resources[key]||0)/rate);
      if(amount>0){for(const [key,rate]of Object.entries(rates))if(rate>0)this.resources[key]=Math.max(0,this.resources[key]-amount*rate);building.health=Math.min(building.maxHealth,building.health+amount);}
      return amount;
    }

    workerResourceTarget(unit) {
      const types=['wood','scrap','stone','food','fuel'],preferred=types[unit.id%types.length];
      let nearest=null,best=Infinity;
      for(const node of this.world.nodes){
        if(node.depleted||this.resources[node.type]>=this.storage-.01||!this.workerJobAvailable(unit,`gather:${node.id}`))continue;
        const distance=distSq(unit,node);if(distance>1150*1150)continue;
        const score=distance*(node.type===preferred?.8:1)*(1+(this.resources[node.type]||0)/Math.max(1,this.storage));
        if(score<best){best=score;nearest=node;}
      }
      return nearest;
    }

    setWorkerOrder(order) {
      if(!this.canIssueCommand()||!['auto','harvest','build','clear','retreat'].includes(order))return false;
      if(this.workerOrder===order)return true;
      const previous=this.workerOrder;
      this.workerOrder=order;
      for(const unit of this.units)if(!unit.dead&&(unit.kind==='worker'||C.SURVIVORS[unit.kind]?.specialist&&(order==='retreat'||previous==='retreat'))){
        unit.state=order==='retreat'?'flee':unit.carry>0?'return':'idle';unit.think=0;unit.targetNode=-1;unit.targetBuilding=-1;unit.targetUnit=-1;unit.navigation=null;unit.supportActive=false;
      }
      this.audio.ui();this.save(false);return true;
    }

    getWorkerSummary() {
      const summary={order:this.workerOrder||'auto',total:0,busy:0,carrying:0,clearing:0,assignedClear:0,retreating:0,gathering:0,building:0,returning:0,idle:0,blocked:0};
      for(const unit of this.units)if(!unit.dead&&unit.kind==='worker'){
        summary.total++;if(unit.carry>0)summary.carrying++;
        if(unit.state==='idle')summary.idle++;else summary.busy++;
        if(unit.state==='flee'||summary.order==='retreat')summary.retreating++;
        if(unit.state==='gather')summary.gathering++;if(unit.state==='build')summary.building++;if(unit.state==='return')summary.returning++;
        if(unit.navigation?.cells===null)summary.blocked++;
        if(unit.state==='clear'){summary.assignedClear++;const wall=this.world.buildings.get(unit.targetBuilding);if(wall&&!wall.dead&&wall.corpseLoad>0&&this.workerCanWorkAt(unit,this.workerCleanupPoint(unit,wall),C.WORKER_RULES.cleanupRange))summary.clearing++;}
      }
      return summary;
    }

    workerCanWorkAt(unit, target, range) {
      const distance=dist(unit,target);if(distance>range)return false;
      const steps=Math.max(1,Math.ceil(distance/(TILE/3)));
      for(let i=0;i<=steps;i++)if(!this.friendlyPositionClear(unit,lerp(unit.x,target.x,i/steps),lerp(unit.y,target.y,i/steps)))return false;
      return true;
    }

    workerBuildExit(unit, building, keyPrefix='exit') {
      // Leave the future collision footprint by walking before finishing a wall around ourselves.
      const offset=Math.max(TILE/2,unit.radius+4),x=clamp(unit.x,building.left+TILE/2,building.right-TILE/2),y=clamp(unit.y,building.top+TILE/2,building.bottom-TILE/2);
      const points=[{x:building.left-offset,y},{x:building.right+offset,y},{x,y:building.top-offset},{x,y:building.bottom+offset}];
      return points.map((point,i)=>({...point,key:`${keyPrefix}:${building.id}:${i}`})).filter(point=>point.x>=offset&&point.y>=offset&&point.x<=WORLD_SIZE-offset&&point.y<=WORLD_SIZE-offset&&this.friendlyPositionClear(unit,point.x,point.y)&&this.workerJobAvailable(unit,point.key)).sort((a,b)=>distSq(unit,a)-distSq(unit,b))[0]||null;
    }

    workerJobAvailable(unit, key) {
      const failure=unit.blockedJobs?.get(key);
      if(!failure)return true;
      if(failure.version!==this.world.navigationVersion||this.elapsed>=failure.until){unit.blockedJobs.delete(key);return true;}
      return false;
    }

    moveWorkerToJob(unit, target, dt, key) {
      this.moveUnitToward(unit,target,dt);
      const route=unit.navigation;
      if(route?.cells===null&&((route.goalX===grid(target.x)&&route.goalY===grid(target.y))||(route.requestX===grid(target.x)&&route.requestY===grid(target.y)))&&route.version===this.world.navigationVersion){
        // Remember failed jobs briefly so one inaccessible target cannot monopolize the A* budget.
        if(!unit.blockedJobs)unit.blockedJobs=new Map();
        if(unit.blockedJobs.size>=32)unit.blockedJobs.delete(unit.blockedJobs.keys().next().value);
        unit.blockedJobs.set(key,{version:this.world.navigationVersion,until:this.elapsed+STRATEGY_RULES.pathRetrySeconds});
        if(unit.state!=='return'){unit.state=unit.carry>0?'return':'idle';unit.think=0;}
      }
    }

    depositWorker(unit, storage, dt) {
      if(!this.workerCanWorkAt(unit,storage,65)){this.moveWorkerToJob(unit,storage,dt,`return:${storage.id}`);return;}
      if(unit.carryType){const room=Math.max(0,this.storage-(this.resources[unit.carryType]||0)),moved=Math.min(room,unit.carry);this.resources[unit.carryType]+=moved;unit.carry-=moved;this.depositedResources+=moved;}
      if(unit.carry<=0){unit.carry=0;unit.carryType=null;unit.state='idle';unit.think=0;}
    }

    retreatWorker(unit, core, dt) {
      unit.state='flee';unit.targetNode=-1;unit.targetBuilding=-1;
      if(unit.carry>0){this.depositWorker(unit,core,dt);unit.state='flee';}
      else if(!this.workerCanWorkAt(unit,core,C.WORKER_RULES.retreatRadius))this.moveUnitToward(unit,core,dt);
    }

    workerCleanupPoint(unit, wall) {
      // Corpse pressure has no saved side; always service the face away from the command centre.
      const core=this.core()||{x:WORLD_SIZE/2,y:WORLD_SIZE/2},dx=wall.x-core.x,dy=wall.y-core.y,offset=Math.max(TILE/2,unit.radius+4);
      return Math.abs(dx)>Math.abs(dy)?{x:dx>=0?wall.right+offset:wall.left-offset,y:wall.y}:{x:wall.x,y:dy>=0?wall.bottom+offset:wall.top-offset};
    }

    workerCleanupTarget(unit) {
      let result=null,best=Infinity;
      for(const wall of this.world.buildings.values()){
        if(wall.dead||!wall.completed||!wall.def.wall||wall.corpseLoad<=0||!this.workerJobAvailable(unit,`clear:${wall.id}`))continue;
        const point=this.workerCleanupPoint(unit,wall);if(!this.friendlyPositionClear(unit,point.x,point.y))continue;
        const score=distSq(unit,point)/Math.max(1,wall.corpseLoad)*(4-(wall.priority||2));if(score<best){best=score;result=wall;}
      }
      return result;
    }

    clearCorpsesWithWorker(unit, wall, dt) {
      if(!unit||!wall||!Number.isFinite(dt)||!(dt>0))return 0;
      const point=this.workerCleanupPoint(unit,wall);
      if(unit.dead||wall.dead||!wall.completed||!wall.def.wall||!this.workerCanWorkAt(unit,point,C.WORKER_RULES.cleanupRange))return 0;
      const before=wall.corpseLoad,amount=Math.min(before,dt*C.WORKER_RULES.cleanupPerSecond);wall.corpseLoad=Math.max(0,before-amount);
      let removed=Math.ceil(before)-Math.ceil(wall.corpseLoad);
      for(let i=this.corpses.length-1;i>=0&&removed>0;i--)if(distSq(this.corpses[i],wall)<=52*52){this.corpses.splice(i,1);removed--;}
      return amount;
    }

    updateDirector(dt) {
      this.phaseTime-=dt;
      if(this.phase==='calm'&&this.phaseTime<=0){this.phase='warning';this.phaseTime=10+(this.hasResearch('recon')?5:0);this.prepareWave();this.triggerCrisis();this.notify(`Migration détectée — ${this.wavePlan.total} contacts estimés.`,'danger');this.audio.siren();}
      else if(this.phase==='warning'&&this.phaseTime<=0){this.phase='assault';this.phaseTime=0;this.startAssault();this.notify('ASSAUT : toutes les unités aux remparts !','danger');}
      else if(this.phase==='assault'){
        this.spawnTimer-=dt;
        // Capacity delays arrivals; it must not bank a burst of overdue spawns.
        if(this.zombies.length>=PERFORMANCE_LIMITS.zombies)this.spawnTimer=Math.max(0,this.spawnTimer);
        while((this.spawnQueue.length||spawnCount(this.pendingSpawns))&&this.spawnTimer<=0&&this.zombies.length<PERFORMANCE_LIMITS.zombies){this.refillSpawnQueue();this.spawnZombie(this.spawnQueue.pop());this.spawnTimer+=this.wavePlan?.spawnInterval||.3;}
        if(this.zombies.length>=PERFORMANCE_LIMITS.zombies)this.spawnTimer=Math.max(0,this.spawnTimer);
        if(!this.spawnQueue.length&&!spawnCount(this.pendingSpawns)&&!this.zombies.some(z=>!z.dead)){this.phase='aftermath';this.phaseTime=8;this.stats.wavesSurvived++;this.research.insight=Math.min(C.RESEARCH_INSIGHT_MAX,this.research.insight+1+(this.wave%5===0?1:0));this.notify(`Vague ${this.wave} repoussée. Sécurisation du périmètre.`,'good');this.save(false);}
      }else if(this.phase==='aftermath'&&this.phaseTime<=0){const completed=this.wave;this.wave++;this.phase='calm';this.phaseTime=Math.max(38,84-this.wave*1.15)*this.difficulty.calmTime;add(this.resources,{food:10+completed*1.5,ammo:12+completed*2,scrap:5+completed},this.storage);if(completed%2===0&&this.population<this.housing){const core=this.core();this.units.push(new Unit(this.nextId++,'worker',core.x+this.random.range(-40,40),core.y+this.random.range(-40,40)));this.notify('Des survivants ont rejoint la cité.','good');}if(this.random.chance(.35))this.weatherTarget=this.random.range(.3,1);this.refreshMetrics(true);}
    }

    prepareWave() {
      this.wavePlan=wavePlan(this.wave,this.difficulty,this.signature);const dirs=['north','east','south','west'];this.random.shuffle(dirs);this.fronts=dirs.slice(0,this.wavePlan.fronts);
    }
    triggerCrisis(){
      if(this.wave<2||this.activeCrisis||!this.random.chance(.22-(this.hasResearch('recon')?.08:0)))return;
      const crisis=crisisForWave(this.wave,this.world.seed);if(!crisis)return;
      const wall=crisis.id==='breach'?this.nearestWall(WORLD_SIZE/2,WORLD_SIZE/2,WORLD_SIZE):null;
      if(crisis.id==='breach'&&!wall)return;
      this.activeCrisis={id:crisis.id,wave:this.wave,status:'pending',remaining:STRATEGY_RULES.crisisDecisionSeconds,targetId:wall?.id||0,choice:null};
      this.notify(`${crisis.title} — choisissez une réponse dans le commandement.`,'danger');this.updateCrisisUI();
    }
    crisisDefinition(){return CRISES.find(crisis=>crisis.id===this.activeCrisis?.id)||null;}
    canResolveCrisis(choice){
      if(choice!=='A'&&choice!=='B')return false;
      const definition=this.crisisDefinition(),option=definition?.choices?.[choice];
      if(!option||this.activeCrisis.status!=='pending'||!canAfford(this.resources,option.cost))return false;
      if(option.effects.workers&&this.population+option.effects.workers>this.housing)return false;
      if(option.effects.wallRepair&&!this.world.buildings.has(this.activeCrisis.targetId))return false;
      return true;
    }
    resolveCrisis(choice,automatic=false){
      if(this.state!=='playing'||this.gameOver||(automatic?this.paused:!this.canIssueCommand())||!this.canResolveCrisis(choice))return false;
      const crisis=this.activeCrisis,definition=this.crisisDefinition(),option=definition.choices[choice];
      if(!spend(this.resources,option.cost))return false;
      const effect=option.effects;
      if(effect.morale)this.morale=clamp(this.morale+effect.morale,0,100);
      if(effect.ammo)this.resources.ammo=clamp(this.resources.ammo+effect.ammo,0,this.storage);
      if(effect.workers){const core=this.core();for(let i=0;i<effect.workers;i++){const unit=new Unit(this.nextId++,'worker',core.x+70,core.y+this.random.range(-25,25));Object.assign(unit,this.coreArrivalPosition(unit,unit));this.units.push(unit);}}
      const wall=this.world.buildings.get(crisis.targetId);
      if(wall&&!wall.dead){if(effect.wallRepair)wall.health=Math.min(wall.maxHealth,wall.health+wall.maxHealth*effect.wallRepair);if(effect.wallDamage)wall.health=Math.max(1,wall.health-wall.maxHealth*effect.wallDamage);if(effect.corpseCleanup)wall.corpseLoad=Math.max(0,wall.corpseLoad-effect.corpseCleanup);}
      crisis.status='resolved';crisis.choice=choice;crisis.remaining=effect.duration||0;
      this.stats.crisesResolved=(this.stats.crisesResolved||0)+1;
      this.notify(`${definition.title} : ${option.label}${automatic?' (délai écoulé)':''}. ${option.description}`,choice==='A'?'good':'normal');
      if(!crisis.remaining)this.activeCrisis=null;
      this.refreshMetrics(true);this.updateCrisisUI();this.save(false);return true;
    }
    updateCrisis(dt){
      if(this.state!=='playing'||this.paused||this.gameOver||!(dt>0)||!Number.isFinite(dt))return;
      const crisis=this.activeCrisis;if(!crisis)return;
      crisis.remaining=Math.max(0,crisis.remaining-dt);
      if(crisis.remaining>0)return;
      if(crisis.status==='pending')this.resolveCrisis('B',true);else this.activeCrisis=null;
    }
    updateCrisisUI(){
      const card=document.getElementById('crisisCard');if(!card)return;
      const definition=this.crisisDefinition(),crisis=this.activeCrisis;
      card.classList.toggle('hidden',!definition);if(!definition)return;
      const title=document.getElementById('crisisTitle'),description=document.getElementById('crisisText'),timer=document.getElementById('crisisTimer');
      if(title)title.textContent=definition.title;
      if(description)description.textContent=crisis.status==='pending'?definition.text:definition.choices[crisis.choice].description;
      if(timer)timer.textContent=crisis.status==='pending'?`Décision : ${Math.ceil(crisis.remaining)} s · sans ordre, réponse B`:`Retour à la normale : ${Math.ceil(crisis.remaining)} s`;
      for(const choice of ['A','B']){
        const button=document.getElementById(`crisisChoice${choice}`);if(!button)continue;
        const option=definition.choices[choice];button.classList.toggle('hidden',crisis.status!=='pending');button.disabled=!this.canResolveCrisis(choice);
        button.textContent=`${option.label} — ${resourceText(option.cost)||'Sans coût matériel'}. ${option.description}`;
        if(!button.dataset.crisisBound){button.dataset.crisisBound='true';button.addEventListener('click',()=>{if(!button.disabled&&!button.closest('[inert]'))this.resolveCrisis(choice);});}
      }
    }
    startAssault() {
      if(!this.wavePlan)this.prepareWave();this.spawnQueue=[];this.pendingSpawns=normalizeSpawnCounts(this.wavePlan.composition);this.refillSpawnQueue();this.spawnTimer=.2;
    }
    refillSpawnQueue(){
      while(this.spawnQueue.length<STRATEGY_RULES.spawnBatch&&spawnCount(this.pendingSpawns)){const kind=takeSpawnKind(this.pendingSpawns,this.random.next());if(!kind)break;this.spawnQueue.push(kind);}
    }
    spawnZombie(kind) {
      if(!Object.hasOwn(ENEMIES,kind))return false;
      const front=this.random.pick(this.fronts.length?this.fronts:['north']),margin=18;let x,y;
      if(front==='north'){x=this.random.range(80,WORLD_SIZE-80);y=margin;}else if(front==='south'){x=this.random.range(80,WORLD_SIZE-80);y=WORLD_SIZE-margin;}else if(front==='east'){x=WORLD_SIZE-margin;y=this.random.range(80,WORLD_SIZE-80);}else{x=margin;y=this.random.range(80,WORLD_SIZE-80);}
      x+=this.random.range(-22,22);y+=this.random.range(-22,22);this.zombies.push(new Zombie(this.nextId++,kind,x,y,this.difficulty,this.wave));return true;
    }

    get remainingAssault(){return this.spawnQueue.length+spawnCount(this.pendingSpawns)+this.zombies.filter(z=>!z.dead).length;}

    stalkerScanClaims(dt){
      const claims=new Set(),count=this.zombies.length,first=(this.stalkerScanOffset||0)%Math.max(1,count);
      // Rotate only scan rights: ordinary movement and attack ordering stay unchanged.
      for(let turn=0;turn<count&&claims.size<C.ENEMY_RULES.stalkQueriesPerUpdate;turn++){
        const index=(first+turn)%count,z=this.zombies[index];this.stalkerScanOffset=(index+1)%count;
        if(!z.dead&&z.kind==='stalker'&&z.huntThink<=dt)claims.add(z.id);
      }
      return claims;
    }
    isolatedStalkerTargets(){
      // One spatial index per scan batch avoids an all-pairs search in large colonies.
      const allies=[this.player,...this.units].filter(actor=>!actor.dead&&!actor.regionAbsent),size=C.ENEMY_RULES.stalkIsolation,buckets=new Map();
      const key=(x,y)=>x+','+y;
      for(const actor of allies){const cell=key(Math.floor(actor.x/size),Math.floor(actor.y/size));if(!buckets.has(cell))buckets.set(cell,[]);buckets.get(cell).push(actor);}
      return allies.filter(actor=>{
        const cx=Math.floor(actor.x/size),cy=Math.floor(actor.y/size);
        for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)for(const other of buckets.get(key(x,y))||[])
          if(other!==actor&&distSq(actor,other)<=size*size)return false;
        return true;
      });
    }
    hostilePositionClear(entity,x,y){
      const radius=entity.radius||0,probe={x,y,radius,dead:false};
      for(let gy=grid(y-radius);gy<=grid(y+radius);gy++)for(let gx=grid(x-radius);gx<=grid(x+radius);gx++){
        const building=this.world.at(world(gx),world(gy));
        if(building&&!building.dead&&!T.openGate(building)&&T.overlapsBuilding(building,probe))return false;
      }
      return true;
    }
    stalkerCorridorClear(z,target){
      const steps=Math.max(1,Math.ceil(dist(z,target)/(TILE/3)));
      for(let i=1;i<=steps;i++)if(!this.hostilePositionClear(z,lerp(z.x,target.x,i/steps),lerp(z.y,target.y,i/steps)))return false;
      return true;
    }
    findStalkerPrey(z,candidates){
      let prey=null,best=C.ENEMY_RULES.stalkRange**2;
      for(const target of candidates){const distance=distSq(z,target);if(distance<=best&&this.hostileLineClear(z,target)&&this.stalkerCorridorClear(z,target)){best=distance;prey=target;}}
      return prey;
    }
    hostileLineClear(from,to,barriersOnly=true,ignored=null){
      // Exact segment/rectangle clipping also catches the thin edge of a wall corner.
      const seen=new Set();
      for(let gy=grid(Math.min(from.y,to.y));gy<=grid(Math.max(from.y,to.y));gy++)for(let gx=grid(Math.min(from.x,to.x));gx<=grid(Math.max(from.x,to.x));gx++){
        const building=this.world.at(world(gx),world(gy));
        if(!building||building===ignored||seen.has(building)||building.dead||T.openGate(building)||(barriersOnly&&!T.blocksEnclosure(building)))continue;
        seen.add(building);let near=0,far=1,intersects=true;
        for(const [origin,delta,low,high]of [[from.x,to.x-from.x,building.left,building.right],[from.y,to.y-from.y,building.top,building.bottom]]){
          if(Math.abs(delta)<1e-9){if(origin<low||origin>high){intersects=false;break;}}
          else{const a=(low-origin)/delta,b=(high-origin)/delta;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));if(near>far){intersects=false;break;}}
        }
        if(intersects)return false;
      }
      return true;
    }
    damageZombieBuilding(z,building,amount){
      if(!building||building.dead||T.openGate(building))return false;
      const target={x:clamp(z.x,building.left,building.right),y:clamp(z.y,building.top,building.bottom)};
      const distance=dist(z,target);if(distance>z.radius+C.ENEMY_RULES.structureReach)return false;
      // A blocked local approach cannot damage the next structure behind the first.
      if(!this.hostileLineClear(z,target,false,building))return false;
      this.damageBuilding(building,amount*(ENEMIES[z.kind].structureDamage||1));return true;
    }

    zombieBulletDamage(z,damage,from){
      if(z.kind!=='shielded')return damage;
      const dx=from.x-z.x,dy=from.y-z.y,length=Math.hypot(dx,dy),r=C.ENEMY_RULES.shield;
      if(length>0&&(dx*Math.cos(z.facing)+dy*Math.sin(z.facing))/length>=Math.cos(r.halfAngle))return damage*r.damageMultiplier;
      return damage;
    }
    endZombieCharge(z){
      if(z.kind==='charger'&&(z.charge.stage==='windup'||z.charge.stage==='rush')){z.charge.stage='recover';z.charge.timer=C.ENEMY_RULES.charge.recoverySeconds;}
    }
    zombieChargeClear(z,dir,distance){
      const steps=Math.max(1,Math.ceil(distance/C.ENEMY_RULES.charge.moveStep));
      for(let i=1;i<=steps;i++)if(!this.hostilePositionClear(z,z.x+dir.x*distance*i/steps,z.y+dir.y*distance*i/steps))return false;
      return true;
    }
    updateZombieCharge(z,dir,dt,staggered){
      const c=z.charge,r=C.ENEMY_RULES.charge;
      if(staggered)this.endZombieCharge(z);
      if(c.stage==='windup'&&!this.zombieChargeClear(z,{x:Math.cos(c.angle),y:Math.sin(c.angle)},r.probeDistance))this.endZombieCharge(z);
      if(c.stage==='ready'){
        if(!staggered&&Math.hypot(dir.x,dir.y)>0&&this.zombieChargeClear(z,dir,r.probeDistance)){c.stage='windup';c.timer=r.windupSeconds;c.angle=Math.atan2(dir.y,dir.x);}
      }else{
        c.timer=Math.max(0,c.timer-dt);
        if(c.timer<=0){if(c.stage==='windup'){c.stage='rush';c.timer=r.rushSeconds;}else if(c.stage==='rush'){c.stage='recover';c.timer=r.recoverySeconds;}else{c.stage='ready';c.timer=0;}}
      }
      return{dir:c.stage==='windup'||c.stage==='rush'?{x:Math.cos(c.angle),y:Math.sin(c.angle)}:dir,
        speed:c.stage==='windup'?0:c.stage==='rush'?r.rushSpeed:c.stage==='recover'?r.recoverySpeed:1};
    }
    moveChargingZombie(z,dir,distance){
      const steps=Math.max(1,Math.ceil(distance/C.ENEMY_RULES.charge.moveStep)),dx=dir.x*distance/steps,dy=dir.y*distance/steps;
      for(let i=0;i<steps;i++){const x=clamp(z.x+dx,3,WORLD_SIZE-3),y=clamp(z.y+dy,3,WORLD_SIZE-3);if(!this.hostilePositionClear(z,x,y)){this.endZombieCharge(z);return false;}z.x=x;z.y=y;}
      return true;
    }

    updateZombies(dt) {
      const core=this.core();if(!core)return;const night=1+(1-this.daylight())*.1;
      const stalkClaims=this.stalkerScanClaims(dt);let stalkCandidates=null;
      for(const z of this.zombies){if(this.gameOver)break;if(z.dead)continue;const def=ENEMIES[z.kind],staggered=z.stagger>0;z.attackCooldown=Math.max(0,z.attackCooldown-dt);z.stagger=Math.max(0,z.stagger-dt);z.rage=Math.max(0,z.rage-dt);z.howl-=dt;if(z.kind==='shielded')z.shieldImpact=Math.max(0,(z.shieldImpact||0)-dt);
        if(z.kind==='howler'&&z.howl<=0){z.howl=9+this.random.range(-1,2);for(const other of this.nearbyZombies(z.x,z.y,190))other.rage=Math.max(other.rage,3);for(let i=0;i<10;i++){const a=this.random.range(0,Math.PI*2);this.particles.push(new Particle(z.x,z.y,Math.cos(a)*this.random.range(20,90),Math.sin(a)*this.random.range(20,90),.7,2,'#9d554d','dust'));}}
        let dir=this.flow.direction(z.x,z.y,z.bias,this.elapsed),speed=def.speed*night*(z.rage>0?1.18:1)*(z.stagger>0?.35:1)*(1-this.weather*.05)*(this.infrastructure?this.infrastructure.speed(z.x,z.y,'hostile'):1);const look=z.radius+13;
        if(z.kind==='stalker'){
          z.huntThink-=dt;
          if(z.prey&&(z.prey.dead||z.prey.regionAbsent||distSq(z,z.prey)>C.ENEMY_RULES.stalkRange**2||!this.hostileLineClear(z,z.prey))){z.prey=null;z.huntThink=0;}
          if(z.huntThink<=0&&stalkClaims.has(z.id)){if(stalkCandidates===null)stalkCandidates=this.isolatedStalkerTargets();z.prey=this.findStalkerPrey(z,stalkCandidates);z.huntThink=C.ENEMY_RULES.stalkThinkSeconds;}
          if(z.prey){const distance=dist(z,z.prey);if(distance>0){const hunt={x:(z.prey.x-z.x)/distance,y:(z.prey.y-z.y)/distance};
            if(this.hostilePositionClear(z,z.x+hunt.x*speed*dt,z.y+hunt.y*speed*dt))dir=hunt;else{z.prey=null;z.huntThink=0;}
          }}
        }
        if(z.kind==='charger'){const charge=this.updateZombieCharge(z,dir,dt,staggered);dir=charge.dir;speed*=charge.speed;z.facing=Math.atan2(dir.y,dir.x);}
        if(this.fieldcraft&&(z.kind!=='charger'||z.charge.stage!=='rush'))dir=this.fieldcraft.steerZombie(z,dir,speed*dt);
        let victim=null,best=34*34;if(!this.player.dead&&!this.player.regionAbsent){const d=distSq(z,this.player);if(d<best&&this.hostileLineClear(z,this.player)){best=d;victim=this.player;}}for(const u of this.units){if(u.dead)continue;const d=distSq(z,u);if(d<best&&this.hostileLineClear(z,u)){best=d;victim=u;}}
        if(victim){this.endZombieCharge(z);if(z.kind==='shielded')z.facing=Math.atan2(victim.y-z.y,victim.x-z.x);if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;if(victim===this.player)this.damagePlayer(def.damage*this.difficulty.enemyDamage);else this.damageUnit(victim,def.damage*this.difficulty.enemyDamage);}continue;}
        let blocker=this.world.at(z.x+dir.x*look,z.y+dir.y*look);if(T.openGate(blocker))blocker=null;
        if(blocker&&!blocker.dead&&blocker.type!=='core'){
          if(blocker.type==='spikes'){z.health-=blocker.def.trapDamage*dt;this.damageZombieBuilding(z,blocker,def.damage*dt*.13);if(z.health<=0){this.killZombie(z,false);continue;}}
          const ramp=blocker.def.wall&&blocker.corpseLoad>15+(z.id%18)&&(z.kind==='runner'||z.kind==='crawler');
          if(!ramp){this.endZombieCharge(z);if(z.kind==='shielded')z.facing=Math.atan2(dir.y,dir.x);if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;this.damageZombieBuilding(z,blocker,def.damage*this.difficulty.enemyDamage);}continue;}
        }else if(blocker&&blocker.type==='core'){this.endZombieCharge(z);if(z.kind==='shielded')z.facing=Math.atan2(dir.y,dir.x);if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;this.damageZombieBuilding(z,blocker,def.damage*this.difficulty.enemyDamage);}continue;}
        z.facing=Math.atan2(dir.y,dir.x);if(z.kind==='charger')this.moveChargingZombie(z,dir,speed*dt);else{z.x=clamp(z.x+dir.x*speed*dt,3,WORLD_SIZE-3);z.y=clamp(z.y+dir.y*speed*dt,3,WORLD_SIZE-3);}
        if(this.random.chance(dt*.45)){const nearby=this.nearbyZombies(z.x,z.y,22);for(const o of nearby){if(o===z)continue;const dx=z.x-o.x,dy=z.y-o.y,l=Math.hypot(dx,dy)||1,x=z.x+dx/l*.15,y=z.y+dy/l*.15;if(z.kind!=='charger'||this.hostilePositionClear(z,x,y)){z.x=x;z.y=y;}break;}}
        const moved=Math.hypot(z.x-z.lastX,z.y-z.lastY);if(moved<.2)z.stuck+=dt;else z.stuck=Math.max(0,z.stuck-dt);z.lastX=z.x;z.lastY=z.y;
        if(z.stuck>2.5){const near=this.world.at(z.x+dir.x*30,z.y+dir.y*30)||this.nearestBuilding(z.x,z.y,48);if(near&&!T.openGate(near)&&z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;this.damageZombieBuilding(z,near,def.damage*this.difficulty.enemyDamage);}}
      }
      this.zombies=this.zombies.filter(z=>!z.dead);
    }

    nearestBuilding(x,y,range){let result=null,best=range*range;for(const b of this.world.buildings.values()){if(b.dead)continue;const d=(b.x-x)**2+(b.y-y)**2;if(d<best){best=d;result=b;}}return result;}
    hasLineOfSight(a,b){const steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/18);for(let i=1;i<steps;i++){const t=i/steps,hit=this.world.at(lerp(a.x,b.x,t),lerp(a.y,b.y,t));if(T.blocksEnclosure(hit))return false;}return true;}
    damageUnit(unit,amount){if(!unit||unit.dead||!(amount>0))return;unit.health=Math.max(0,unit.health-amount);if(unit.health<=0){unit.dead=true;unit.supportActive=false;this.stats.unitsLost++;this.notify(`Un ${(C.SURVIVORS[unit.kind]?.name||'survivant').toLowerCase()} a été perdu.`,'danger');for(let i=0;i<8;i++)this.particles.push(new Particle(unit.x,unit.y,this.random.range(-30,30),this.random.range(-35,15),.7,3,'#6f302e','blood'));}}
    damageBuilding(b,amount){if(b.dead)return;if(b.def.wall&&this.hasResearch('fortification'))amount*=.88;b.health-=amount;b.underAttack=.5;if(b.health<=0)this.destroyBuilding(b);}
    destroyBuilding(b){if(b.dead)return;b.dead=true;const def=b.def;this.world.remove(b);this.stats.buildingsLost++;this.camera.shake=Math.max(this.camera.shake,def.explosive?18:10);for(let i=0;i<(def.explosive?45:20);i++)this.particles.push(new Particle(b.x+this.random.range(-b.w*TILE/2,b.w*TILE/2),b.y+this.random.range(-b.h*TILE/2,b.h*TILE/2),this.random.range(-90,90),this.random.range(-100,60),this.random.range(.6,1.4),this.random.range(2,7),i%3?'#5c5a51':'#b87948',i%3?'debris':'spark'));
      if(def.explosive){for(const z of this.nearbyZombies(b.x,b.y,def.explosive)){z.health-=120*(1-dist(z,b)/def.explosive);if(z.health<=0)this.killZombie(z,false);}for(const other of [...this.world.buildings.values()])if(other!==b&&dist(other,b)<def.explosive)this.damageBuilding(other,45*(1-dist(other,b)/def.explosive));}
      if(b===this.selectedBuilding)this.selectBuilding(null);if(def.id==='core'){this.triggerGameOver();return;}this.notify(`${def.name} détruit — le secteur est ouvert !`,'danger');this.refreshMetrics(true);}

    triggerGameOver(){
      this.recordCampaign(true);this.gameOver=true;this.releaseInputs();
      for(const key of [SAVE_KEY,SAVE_BACKUP_KEY,...LEGACY_SAVE_KEYS])try{localStorage.removeItem(key);}catch{}
      this.refreshContinue();
      this.ui.gameOverStats.textContent=`Vague ${this.wave} · ${formatNumber(this.stats.kills)} infectés éliminés · ${formatTime(this.stats.playSeconds)} de résistance · ${this.stats.buildingsPlaced} structures construites.`;
      this.battlefieldUI?.refreshDefeat();this.battlefieldUI?.refresh(true);
      this.ui.gameOver.classList.remove('hidden');this.syncOverlayFocus();
    }

    rebuildBuckets(){this.buckets.clear();for(const z of this.zombies){if(z.dead)continue;const bx=Math.floor(z.x/this.bucketSize),by=Math.floor(z.y/this.bucketSize),key=bx+by*1000;if(!this.buckets.has(key))this.buckets.set(key,[]);this.buckets.get(key).push(z);}}
    nearbyZombies(x,y,range){const out=[],minX=Math.floor((x-range)/this.bucketSize),maxX=Math.floor((x+range)/this.bucketSize),minY=Math.floor((y-range)/this.bucketSize),maxY=Math.floor((y+range)/this.bucketSize),r2=range*range;for(let by=minY;by<=maxY;by++)for(let bx=minX;bx<=maxX;bx++){const bucket=this.buckets.get(bx+by*1000);if(bucket)for(const z of bucket)if(!z.dead&&(z.x-x)**2+(z.y-y)**2<=r2)out.push(z);}return out;}
    nearestZombie(x,y,range){let result=null,best=range*range;for(const z of this.nearbyZombies(x,y,range)){const d=(z.x-x)**2+(z.y-y)**2;if(d<best){best=d;result=z;}}return result;}

    updateProjectiles(dt) {
      if (!(dt > 0) || !Number.isFinite(dt)) return;
      const maxRadius = Math.max(...Object.values(ENEMIES).map(enemy => enemy.radius));
      for (const p of this.projectiles) {
        if (p.dead) continue;
        const fullDx = p.vx * dt, fullDy = p.vy * dt, fullLength = Math.hypot(fullDx, fullDy), remaining = p.range - p.travelled;
        if (!(fullLength > 0) || !(remaining > 0) || p.x < 0 || p.y < 0 || p.x > WORLD_SIZE || p.y > WORLD_SIZE) { p.dead = true; continue; }
        let fraction = Math.min(1, remaining / fullLength);
        if (fullDx > 0) fraction = Math.min(fraction, (WORLD_SIZE - p.x) / fullDx);
        else if (fullDx < 0) fraction = Math.min(fraction, -p.x / fullDx);
        if (fullDy > 0) fraction = Math.min(fraction, (WORLD_SIZE - p.y) / fullDy);
        else if (fullDy < 0) fraction = Math.min(fraction, -p.y / fullDy);
        const dx = fullDx * fraction, dy = fullDy * fraction, length = fullLength * fraction, lengthSq = dx * dx + dy * dy;
        const endpoint = {x:p.x+dx,y:p.y+dy};
        const obstructions = [this.exploration125?.firstObstruction?.(p,endpoint,p.radius,true),this.barricades134?.firstObstruction?.(p,endpoint,p.radius)].filter(Boolean);
        const obstruction = obstructions.sort((a,b)=>a.fraction-b.fraction)[0] || null;
        const barrierImpact = obstruction?.fraction ?? Infinity;
        let target = null, impact = barrierImpact;
        // Generated buildings and opening reinforcements stop shots at their first surface.
        // The established low fortification firing rules remain separate.
        for (const z of this.nearbyZombies(p.x + dx / 2, p.y + dy / 2, length / 2 + maxRadius + p.radius + 3)) {
          if (z.dead) continue;
          const ox = p.x - z.x, oy = p.y - z.y, radius = z.radius + p.radius + 3, c = ox * ox + oy * oy - radius * radius;
          let time = 0;
          if (c > 0) {
            const b = ox * dx + oy * dy, discriminant = b * b - lengthSq * c;
            if (!lengthSq || discriminant < 0) continue;
            time = (-b - Math.sqrt(discriminant)) / lengthSq;
            if (time < 0 || time > 1) continue;
          }
          if (time < impact || (time === impact && target && z.id < target.id)) { target = z; impact = time; }
        }
        const travel = target ? impact : Math.min(1,barrierImpact);
        p.x += dx * travel; p.y += dy * travel; p.travelled = Math.min(p.range, p.travelled + length * travel);
        if (target) {
          let damage = p.damage, head = false;
          if (p.owner === 'player' && this.random.chance(p.headshotChance)) { damage *= p.headshotMultiplier; head = true; this.stats.headshots++; }
          const bulletDamage=this.zombieBulletDamage(target,damage,{x:target.x-p.vx,y:target.y-p.vy}),shielded=bulletDamage<damage;damage=bulletDamage;if(shielded)target.shieldImpact=.12;
          target.health -= damage; target.stagger = Math.max(target.stagger, .08); p.dead = true; this.audio.hit();
          for (let i = 0; i < 4; i++) this.particles.push(new Particle(target.x, target.y, this.random.range(-45,45), this.random.range(-45,45), .45, 2.5, shielded?'#b4b8ae':'#6d2928', shielded?'spark':'blood'));
          if (head) this.floaters.push({x:target.x,y:target.y-16,text:'TÊTE',color:'#d9b56a',life:.75,maxLife:.75});
          if (target.health <= 0) this.killZombie(target, head);
        } else if (barrierImpact <= 1) {
          p.dead = true;
          if (obstruction.barricade) this.barricades134.damage(obstruction.barricade,p.damage);
        } else if (fraction < 1 || p.travelled >= p.range || p.x <= 0 || p.y <= 0 || p.x >= WORLD_SIZE || p.y >= WORLD_SIZE) p.dead = true;
      }
      this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    killZombie(z,headshot){if(z.dead)return;z.dead=true;this.stats.kills++;this.corpses.push({x:z.x,y:z.y,kind:z.kind,age:0,rotation:this.random.range(0,Math.PI*2),scale:this.random.range(.8,1.2)});if(this.corpses.length>PERFORMANCE_LIMITS.corpses)this.corpses.shift();const wall=this.nearestWall(z.x,z.y,52);if(wall)wall.corpseLoad+=this.hasResearch('sanitation')?C.ENEMY_RULES.sanitizedCorpseLoad:ENEMIES[z.kind].corpseLoad;const drop=this.random.next();if(drop<.06)this.resources.ammo=Math.min(this.storage,this.resources.ammo+1);else if(drop<.075)this.resources.medicine=Math.min(this.storage,this.resources.medicine+.5);if(z.kind==='armored')this.resources.scrap=Math.min(this.storage,this.resources.scrap+.7);if(z.kind==='howler')this.resources.medicine=Math.min(this.storage,this.resources.medicine+.35);if(headshot&&this.random.chance(.35))this.resources.ammo=Math.min(this.storage,this.resources.ammo+1);}
    nearestWall(x,y,range){let result=null,best=range*range;for(const b of this.world.buildings.values())if(!b.dead&&b.completed&&b.def.wall){const d=(b.x-x)**2+(b.y-y)**2;if(d<best){best=d;result=b;}}return result;}

    updateEffects(dt){for(const node of this.world.nodes)node.flash=Math.max(0,node.flash-dt);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy+=p.kind==='debris'||p.kind==='blood'?65*dt:-4*dt;p.rotation+=dt*4;}this.particles=this.particles.filter(p=>p.life>0);if(this.particles.length>PERFORMANCE_LIMITS.particles)this.particles.splice(0,this.particles.length-PERFORMANCE_LIMITS.particles);for(const c of this.corpses)c.age+=dt;this.corpses=this.corpses.filter(c=>c.age<100);for(const f of this.floaters){f.life-=dt;f.y-=dt*18;}this.floaters=this.floaters.filter(f=>f.life>0);}

    economyTick(dt){let foodUse=this.population*.0065*dt;this.resources.food=Math.max(0,this.resources.food-foodUse);if(this.resources.food<=.01)this.morale=Math.max(0,this.morale-dt*.7);else this.morale=Math.min(100,this.morale+dt*.08);
      for(const b of this.world.buildings.values())if(!b.dead&&b.completed&&!b.siegeOffline&&!b.territoryOffline&&(b.type==='generator'||b.def.generatorFuel)&&this.resources.fuel>0)this.resources.fuel=Math.max(0,this.resources.fuel-dt*(b.def.generatorFuel||.018)*(this.hasResearch('grid')?.75:1));
      for(const b of this.world.buildings.values()){
        if(b.dead||!b.completed||(b.gridOffline&&!this.powerGrid?.hasProduction(b.id))||b.territoryOffline||b.siegeOffline||b.dayOffline||!b.def.production)continue;
        const crisisFactor=b.def.powerUse&&this.activeCrisis?.id==='blackout'&&this.activeCrisis.status==='resolved'&&this.activeCrisis.choice==='B'?.5:1;
        const powerFactor=b.def.powerUse?(b.powered?1:b.powerShare*(this.hasResearch('grid')?.7:.35)):1;
        if(powerFactor<=.05&&!this.powerGrid?.hasProduction(b.id))continue;
        const seconds=this.powerGrid?this.powerGrid.productionSeconds(b,dt,powerFactor,crisisFactor):dt*powerFactor*crisisFactor,fraction=productionFraction(this.resources,b.def.production,b.def.consumes,this.storage,seconds);
        if(fraction<=0)continue;
        for(const [key,rate]of Object.entries(b.def.consumes||{}))this.resources[key]-=rate*seconds*fraction;
        for(const [key,rate]of Object.entries(b.def.production))this.resources[key]=Math.min(this.storage,this.resources[key]+rate*seconds*fraction);
      }
      for(const unit of this.units)unit.speed=(C.SURVIVORS[unit.kind]?.speed||60)*(this.morale<20?.82:1);
      for(const key of RESOURCE_KEYS)this.resources[key]=clamp(this.resources[key],0,this.storage);
    }

    refreshMetrics(force=false){let score=0,housing=0,storage=0,powerGen=0,powerUse=0;for(const b of this.world.buildings.values()){if(b.dead||!b.completed)continue;score+=b.def.score||0;housing+=b.def.housing||0;storage+=b.def.storage||0;if(b.def.powerGen&&!b.siegeOffline&&!b.territoryOffline)powerGen+=((b.type==='generator'||b.def.generatorFuel)&&this.resources.fuel<=0||b.def.solar&&this.phase!=='calm')?0:b.def.powerGen;powerUse+=b.def.powerUse||0;}this.cityScore=score;const oldTier=this.tier;this.tier=this.urban?this.urban.attain(score):cityTier(score);this.housing=Math.max(1,housing);this.population=1+this.units.filter(u=>!u.dead).length;this.stats.peakPopulation=Math.max(this.stats.peakPopulation||0,this.population);this.stats.peakBuildings=Math.max(this.stats.peakBuildings||0,[...this.world.buildings.values()].filter(b=>!b.dead&&b.completed).length);this.storage=Math.max(100,storage);this.powerGenerated=powerGen;this.powerUsed=powerUse;this.powerRatio=powerUse>0?clamp(powerGen/powerUse,0,1):1;this.signature=score+this.population*2+powerUse*2+this.world.buildings.size*.35;
      this.allocatePower(powerGen);
      if(oldTier&&this.tier.id>oldTier.id){this.notify(`La colonie devient : ${this.tier.name}.`,'good');this.audio.siren();this.refreshBuildMenu(true);}else if(force)this.refreshBuildMenu(true);
    }

    objectiveRewardSpace(objective = OBJECTIVES[this.objectiveIndex]) {
      if (!objective) return {};
      const missing = {};
      for (const [key, amount] of Object.entries(objective.reward)) {
        const needed = Math.max(0, this.resources[key] + amount - this.storage);
        if (needed > 0) missing[key] = needed;
      }
      return missing;
    }

    updateObjective() {
      const obj = OBJECTIVES[this.objectiveIndex]; if (!obj) return;
      const newlyReady = !this.objectiveReady;
      if (!this.objectiveReady) {
        if (obj.id === 'gather') this.objectiveProgress = this.depositedResources;
        else if (obj.id === 'house') this.objectiveProgress = [...this.world.buildings.values()].filter(b => b.completed && b.type === 'house').length;
        else if (obj.id === 'farm') this.objectiveProgress = [...this.world.buildings.values()].filter(b => b.completed && b.type === 'farm').length;
        else if (obj.id === 'walls') this.objectiveProgress = [...this.world.buildings.values()].filter(b => b.completed && b.def.wall).length;
        else if (obj.id === 'power') this.objectiveProgress = this.resources.fuel > 0 ? [...this.world.buildings.values()].filter(b => b.completed && b.type === 'generator').length : 0;
        else if (obj.id === 'defense') this.objectiveProgress = [...this.world.buildings.values()].filter(b => b.completed && ['watchtower','turret','heavyTurret'].includes(b.type)).length;
        else if (obj.id === 'research') this.objectiveProgress = this.research.completed.length;
        else if (obj.id === 'wave') this.objectiveProgress = this.stats.wavesSurvived;
        if (this.objectiveProgress < obj.target) return;
        this.objectiveReady = true;
      }
      // Earning the reward survives the loss of a building while storage is full.
      this.objectiveProgress = obj.target;
      if (Object.keys(this.objectiveRewardSpace(obj)).length) {
        if (newlyReady) this.notify(`Objectif rempli : ${obj.title}. Récompense réservée jusqu’à ce que le dépôt puisse la recevoir.`, 'good');
        return;
      }
      for (const [key, amount] of Object.entries(obj.reward)) this.resources[key] += amount;
      this.notify(`Récompense reçue : ${obj.title}.`, 'good');
      this.objectiveIndex++; this.objectiveProgress = 0; this.objectiveReady = false; this.audio.build();
    }

    updateNarrativeSurvey(dt) {
      if(this.state!=='playing'||this.paused||this.gameOver||this.player.dead||this.player.health<=0)return false;
      const N=globalThis.DeadwallNarrative,rules=C.NARRATIVE_RULES;
      const site=(this.world.sites||[]).find(site=>distSq(this.player,site)<=rules.surveyRadius**2);
      if(!site)return false;
      const record=this.narrative.sectors[site.theme];
      // Survey the surrounding area from a standable position, not a fictional object
      // at its exact centre. Existing saves may already contain a wall on that point.
      if(!record||record.survey>=rules.surveySeconds||!this.friendlyPositionClear(this.player,this.player.x,this.player.y))return false;
      this.interactionText='Relever les traces · '+site.name+' · '+Math.floor(record.survey)+' / '+rules.surveySeconds+' s';
      if(!this.input.keys.has('KeyE')||!Number.isFinite(dt)||dt<=0)return false;
      record.survey=Math.min(rules.surveySeconds,record.survey+Math.min(dt,rules.maxStep));
      if(record.survey>=rules.surveySeconds-1e-8){
        record.survey=rules.surveySeconds;this.narrative.unread.push('sector:'+site.theme);
        const definition=N.SECTORS.find(item=>item.id===site.theme);
        this.notify('Trace relevée : '+definition.title+'. Retournez au dépôt pour décider.','good');
        this.audio.ui();this.updateNarrative();this.save(false);
      }
      return true;
    }

    updateNarrative() {
      if(this.state!=='playing'||this.gameOver)return;
      const N=globalThis.DeadwallNarrative;
      for(const id of N.chaptersFor(this.narrative,{objectiveIndex:this.objectiveIndex,wavesSurvived:this.stats.wavesSurvived})){
        this.narrative.chapters.push(id);this.narrative.unread.push('chapter:'+id);
        this.notify('Registre D-17 : '+N.CHAPTERS.find(item=>item.id===id).title+'.','good');
      }
      this.narrativeUI?.refresh();
    }

    narrativeStatus(theme,choice) {
      const def=globalThis.DeadwallNarrative.SECTORS.find(item=>item.id===theme);
      if(!def)return {ok:false,reason:'Dossier inconnu.'};
      if(!this.canIssueCommand())return {ok:false,reason:'Disponible pendant la campagne, depuis le commandement.'};
      if(this.player.dead||this.player.health<=0)return {ok:false,reason:'Le commandant doit être debout.'};
      const record=this.narrative.sectors[theme];
      if(record.choice!==null)return {ok:false,reason:'Décision déjà consignée pour cette campagne.'};
      if(record.survey<C.NARRATIVE_RULES.surveySeconds)return {ok:false,reason:'Rejoignez le centre du secteur et maintenez ACTION / E pendant huit secondes, hors collecte ou chantier.'};
      const core=this.core();
      if(!core||!this.workerCanWorkAt(this.player,core,C.NARRATIVE_RULES.debriefRadius))return {ok:false,reason:'Retournez près du centre de commandement, par un accès ouvert.'};
      if(choice!==undefined&&!['A','B'].includes(choice))return {ok:false,reason:'Décision inconnue.'};
      if(choice!==undefined&&this.research.insight+def.choices[choice].reward.insight>C.RESEARCH_INSIGHT_MAX)return {ok:false,reason:'Réserve d’insight maximale. Dépensez de l’insight ou choisissez le partage.'};
      if(choice==='B'&&!this.units.some(unit=>!unit.dead&&unit.health>0))return {ok:false,reason:'Recrutez au moins un survivant pour partager ce moment avec l’équipe.'};
      if(choice!==undefined&&!canAfford(this.resources,def.choices[choice].cost))return {ok:false,reason:'Réserves insuffisantes ; aucun stock ne sera débité.'};
      return {ok:true,reason:'Décision unique ; coût prélevé dans les réserves du dépôt.'};
    }

    resolveNarrative(theme,choice) {
      if(!['A','B'].includes(choice)||!this.narrativeStatus(theme,choice).ok)return false;
      const option=globalThis.DeadwallNarrative.SECTORS.find(item=>item.id===theme).choices[choice];
      // Commit once, synchronously: no reward is ever granted during load, rendering or reading.
      if(!spend(this.resources,option.cost))return false;
      this.narrative.sectors[theme].choice=choice;
      this.research.insight+=option.reward.insight;
      this.morale=clamp(this.morale+option.reward.morale,0,100);
      this.notify(option.label+' : décision consignée.','good');this.audio.ui();
      this.updateNarrative();this.updateUI();this.save(false);return true;
    }

    markNarrativeRead() {
      if(this.state!=='playing'||this.gameOver)return false;
      this.narrative.unread=[];this.narrativeUI?.refresh();this.save(false);return true;
    }

    hasResearch(id){return this.research.completed.includes(id);}
    currentResearch(){return RESEARCH.find(item=>!this.hasResearch(item.id)&&item.tier<=this.tier.id)||null;}
    canIssueCommand(){return this.state==='playing'&&!this.gameOver&&(!this.paused||Boolean(this.ui.commandModal&&this.activeOverlay===this.ui.commandModal));}
    launchResearch(id = this.currentResearch()?.id){
      const item=RESEARCH.find(candidate=>candidate.id===id);
      if(!this.canIssueCommand()||!item||this.hasResearch(id)||item.tier>this.tier.id)return false;
      if(this.research.insight<item.insight||!canAfford(this.resources,item.cost))return false;
      spend(this.resources,item.cost);this.research.insight-=item.insight;this.research.completed.push(item.id);
      this.notify(item.name+' validée.','good');this.refreshMetrics(true);this.updateObjective();this.updateUI();this.save(false);return true;
    }
    recordCampaign(ended=false){
      if(!this.profile||!this.runId)return;
      this.profileStatus=this.profile.record({runId:this.runId,seed:this.world.seed,difficulty:this.difficulty.id,scenarioId:this.scenarioId,
        wavesSurvived:Math.floor(this.stats.wavesSurvived),kills:Math.floor(this.stats.kills),playSeconds:this.stats.playSeconds,
        population:Math.max(this.stats.peakPopulation||0,this.population),buildings:Math.max(this.stats.peakBuildings||0,[...this.world.buildings.values()].filter(b=>!b.dead&&b.completed).length),ended});
    }
    updateEnclosureIntel(){
      const status=this.getEnclosureStatus(),previous=this.enclosureIntel;
      if(previous?.world===this.world&&previous.enclosed&&!status.enclosed&&this.state==='playing'&&!this.gameOver)
        this.notify('Périmètre ouvert : une brèche ou une porte expose le centre.','danger');
      this.enclosureIntel={world:this.world,enclosed:status.enclosed};
      const label=document.getElementById('enclosureStatus');
      if(label){label.textContent=status.enclosed?'ENCEINTE FERMÉE':'PÉRIMÈTRE OUVERT';label.dataset.closed=String(status.enclosed);}
    }
    cyclePriority(){const b=this.selectedBuilding;if(!b||b.dead)return;b.priority=b.priority>=3?1:b.priority+1;this.notify(`${b.def.name} : priorité ${['','basse','normale','haute'][b.priority]}.`,'good');this.updateSelectionUI();}
    allocatePower(available){const powered=[...this.world.buildings.values()].filter(b=>!b.dead&&b.completed&&b.def.powerUse).sort((a,b)=>powerPriority(a.def)-powerPriority(b.def)||(b.priority||2)-(a.priority||2));let remaining=available;for(const b of powered){const need=b.def.powerUse||0;if(remaining>=need){b.powered=true;b.powerShare=1;remaining-=need;}else{b.powered=false;b.powerShare=b.def.production?clamp(remaining/Math.max(1,need),0,1):0;if(b.powerShare>0)remaining=0;}}}
    loadSettings(){const reducedMotion=Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches),defaults={reducedMotion,highContrast:false,muted:false,volume:.7,quality:'auto'};try{const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');if(!raw||typeof raw!=='object')return defaults;return{reducedMotion:typeof raw.reducedMotion==='boolean'?raw.reducedMotion:reducedMotion,highContrast:raw.highContrast===true,muted:raw.muted===true,volume:typeof raw.volume==='number'&&Number.isFinite(raw.volume)?clamp(raw.volume,0,1):.7,quality:raw.quality==='low'?'low':'auto'}}catch{return defaults}}
    saveSettings() {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); return true; }
      catch {
        const status = document.getElementById('settingsStatus');
        if (status) status.textContent = 'Options appliquées pour cette session seulement : stockage indisponible.';
        return false;
      }
    }
    toggleAccessibility(){this.settings.highContrast=!this.settings.highContrast;document.body.classList.toggle('high-contrast',this.settings.highContrast);this.saveSettings();this.notify(this.settings.highContrast?'Contraste élevé activé.':'Contraste élevé désactivé.');}
    toggleSound(){this.settings.muted=!this.settings.muted;this.audio.setMuted(this.settings.muted);this.saveSettings();this.notify(this.settings.muted?'Son coupé.':'Son activé.');this.updateUI();}
    daylight(){const angle=this.dayClock*Math.PI*2;return clamp(.5+Math.sin(angle-Math.PI/2)*.62,.08,1);}

    updateUI(){
      this.updateCrisisUI();
      this.squadUI?.refresh();
      this.battlefieldUI?.refresh();
      this.updateEnclosureIntel();this.commandUI?.refresh();
      for(const key of RESOURCE_KEYS){
        this.resourceEls[key].textContent=formatNumber(this.resources[key]);
        const lowThreshold=key==='medicine'?4:(key==='fuel'?8:12);this.resourceItems[key]?.classList.toggle('is-low',this.resources[key]<lowThreshold);
      }
      document.body.dataset.phase=this.phase;this.ui.hud.dataset.phase=this.phase;
      document.body.classList.toggle('morale-critical',this.morale<35);
      document.body.classList.toggle('power-critical',this.powerUsed>0&&this.powerGenerated+(this.powerBatteryOutput||0)+.01<this.powerUsed);
      document.body.classList.toggle('player-critical',this.player.health<35);
      document.body.classList.toggle('crisis-active',Boolean(this.activeCrisis));
      document.body.classList.toggle('carry-full',bagTotal(this.player.carry)>=this.player.carryCapacity*.9);
      this.refreshBuildAffordability();this.ui.cityTier.textContent=this.tier.name;this.ui.populationValue.textContent=`${this.population}/${this.housing}`;this.ui.powerValue.textContent=`${Math.floor(this.powerGenerated+(this.powerBatteryOutput||0))}/${Math.ceil(this.powerUsed)}`;this.ui.moraleValue.textContent=`${Math.floor(this.morale)}%`;this.ui.moraleValue.style.color=this.morale<35?'#d7867f':'';this.ui.waveNumber.textContent=this.wave;
      const labels={calm:'CALME RELATIF',warning:'MIGRATION DÉTECTÉE',assault:'ASSAUT EN COURS',aftermath:'SÉCURISATION'};this.ui.phaseLabel.textContent=labels[this.phase];this.ui.waveTimer.textContent=this.phase==='assault'?formatNumber(this.remainingAssault):formatTime(this.phaseTime);
      let threat=0;if(this.phase==='warning')threat=clamp(1-this.phaseTime/(this.hasResearch('recon')?15:10),0,1);else if(this.phase==='assault')threat=clamp(.4+this.remainingAssault/Math.max(1,this.wavePlan?.total||this.remainingAssault)*.6,0,1);else if(this.phase==='aftermath')threat=.15;this.ui.threatFill.style.width=`${Math.round(threat*100)}%`;
      delete this.ui.waveIntel.dataset.detail;
      delete this.ui.waveIntel.dataset.compact;
      delete this.ui.waveIntel.dataset.counts;
      if(this.phase==='warning')this.ui.waveIntel.textContent=`Approche par ${this.fronts.map(f=>({north:'le nord',south:'le sud',east:'l’est',west:'l’ouest'})[f]).join(' et ')}. Préparez les portes.`;
      else if(this.phase==='assault'){
        const B=globalThis.DeadwallBattlefield;
        const sample=this.battlefieldUI?.snapshot()||B.inspect(this.core(),this.zombies,this.world.buildings.values());
        const savedNight=this.dayworks?.snapshot().night,night=savedNight?.wave===this.wave?savedNight:null;
        const status=B.assaultStatus(sample,this.spawnQueue.length+spawnCount(this.pendingSpawns),this.fronts,night,this.spawnTimer,this.siege?.assaultPattern());
        this.ui.waveIntel.dataset.detail=B.assaultText(status);
        this.ui.waveIntel.dataset.compact=B.assaultCompactText(status);
        this.ui.waveIntel.dataset.counts=B.assaultCountsText(status);
        this.ui.waveIntel.textContent=this.isCompactViewport?.()&&this.height<=500?this.ui.waveIntel.dataset.compact:this.ui.waveIntel.dataset.detail;
      }else if(this.phase==='aftermath')this.ui.waveIntel.textContent='Nettoyage, réparations et récupération avant la prochaine migration.';
      else this.ui.waveIntel.textContent=this.crisisDefinition()?`${this.crisisDefinition().title} : ${this.crisisDefinition().text}`:`Signature de cité : ${Math.floor(this.signature)}. Plus la colonie grossit, plus les hordes sont attirées.`;
      const obj = OBJECTIVES[this.objectiveIndex];
      if (obj) {
        this.ui.objectiveTitle.textContent = obj.title;
        const missing = this.objectiveReady ? this.objectiveRewardSpace(obj) : {};
        const space = Object.entries(missing).map(([key, amount]) => `${Math.ceil(amount)} ${RESOURCE_META[key].label.toLowerCase()}`).join(' · ');
        this.ui.objectiveText.textContent = this.objectiveReady
          ? `Objectif rempli — récompense réservée : ${resourceText(obj.reward)}. ${space ? `Place manquante au dépôt : ${space}. Dépensez des stocks ou augmentez le stockage ; toute la récompense sera versée automatiquement.` : 'Le dépôt peut recevoir toute la récompense ; versement automatique à la reprise de la simulation.'}`
          : obj.text;
        this.ui.objectiveFill.style.width = `${Math.min(100,this.objectiveProgress/obj.target*100)}%`;
        this.ui.objectiveCounter.textContent = `${Math.floor(Math.min(obj.target,this.objectiveProgress))} / ${obj.target}${this.objectiveReady ? ' · RÉCOMPENSE RÉSERVÉE' : ''}`;
      } else {
        this.ui.objectiveTitle.textContent = 'Développer la citadelle'; this.ui.objectiveText.textContent = 'La campagne d’introduction est terminée. Construisez librement et survivez sans limite.';
        this.ui.objectiveFill.style.width = '100%'; this.ui.objectiveCounter.textContent = 'MODE INFINI';
      }
      this.ui.interactionHint.classList.toggle('hidden',!this.interactionText);if(this.interactionText)this.ui.interactionHint.querySelector('span').textContent=this.interactionText;const w=this.arsenal134?.weaponSpec()||WEAPONS[this.player.weapon];this.ui.weaponName.textContent=w.name;this.ui.weaponAmmo.textContent=`${this.player.magazine[this.player.weapon]} / ${Math.floor(this.playerOps131?.reloadAvailable() ?? this.resources.ammo)}`;this.ui.reloadBar.querySelector('span').style.width=this.player.reload>0?`${100-this.player.reload/Math.max(.01,this.player.reloadTotal)*100}%`:'0%';this.ui.carryValue.textContent=`${Math.floor(bagTotal(this.player.carry))}/${this.player.carryCapacity}`;this.ui.damageVignette.style.opacity=this.settings.reducedMotion?0:clamp((1-this.player.health/this.player.maxHealth)*.72+this.damageFlash,0,.8);document.body.classList.toggle('is-reloading',this.player.reload>0);
      const research=this.currentResearch(),lockedResearch=research?null:RESEARCH.find(item=>!this.hasResearch(item.id));if(this.ui.researchName)this.ui.researchName.textContent=research?'DOCTRINES · CHOISIR':lockedResearch?`Palier requis : ${CITY_TIERS[lockedResearch.tier].name}`:'Doctrines complètes';if(this.ui.researchInsight)this.ui.researchInsight.textContent=research?`${this.research.insight}/${research.insight} insight · ${resourceText(research.cost)}`:`${this.research.insight} insight · ${this.research.completed.length}/${RESEARCH.length} doctrines`;if(this.ui.researchButton){this.ui.researchButton.disabled=false;this.ui.researchButton.title=research?`${research.description} — ${resourceText(research.cost)}`:lockedResearch?`${lockedResearch.name} nécessite le palier ${CITY_TIERS[lockedResearch.tier].name}.`:'Toutes les doctrines sont terminées.';}
      if(this.ui.soundStatus)this.ui.soundStatus.textContent=this.settings.muted?'coupé':'activé';if(this.ui.soundToggle)this.ui.soundToggle.setAttribute('aria-pressed',String(!this.settings.muted));if(this.ui.settingsToggle){this.ui.settingsToggle.setAttribute('aria-haspopup','dialog');this.ui.settingsToggle.setAttribute('aria-controls','settingsModal');}this.ui.recruitWorker.disabled=!this.canRecruit('worker');this.ui.recruitSoldier.disabled=!this.canRecruit('soldier');this.updateSelectionUI();}

    updateSelectionUI(){
      const get=id=>document.getElementById(id),emergency=this.emergencyRepairStatus();
      get('repairAll').disabled=!emergency.ok;
      get('repairAllQuote').textContent=emergency.defenses.length?emergency.defenses.length+' défense'+(emergency.defenses.length>1?'s':'')+' · '+resourceText(emergency.cost)+(canAfford(this.resources,emergency.cost)?'':' · stocks insuffisants'):'Défenses intactes';
      const b=this.selectedBuilding;
      if(!b||b.dead||this.world.buildings.get(b.id)!==b){this.ui.selectionCard.classList.add('hidden');this.cancelDemolition();return;}
      this.ui.selectionCard.classList.remove('hidden');this.ui.selectionCard.dataset.state=!b.completed?'construction':b.health/b.maxHealth<.35?'critical':b.def.powerUse&&!b.powered?'unpowered':'operational';this.ui.selectionCard.dataset.priority=String(b.priority||2);
      this.ui.selectionName.textContent=b.def.name;this.ui.selectionDescription.textContent=b.completed?b.def.description:`Chantier à ${Math.floor(b.progress*100)} %. Maintenez E à proximité ou assignez des ouvriers.`;
      this.ui.selectionHealthFill.style.width=`${b.health/b.maxHealth*100}%`;this.ui.selectionHealthFill.style.background=b.health/b.maxHealth<.35?'#b94d43':'#7da46e';
      this.ui.selectionStats.innerHTML=`<span>Intégrité <strong>${Math.ceil(b.health)} / ${b.maxHealth}</strong></span><span>Énergie <strong>${b.def.powerUse?(b.powered?'Oui':'Non'):'—'}</strong></span><span>Construction <strong>${Math.floor(b.progress*100)}%</strong></span><span>Pression corps <strong>${b.def.wall?Math.floor(b.corpseLoad):0}</strong></span>`;
      for(const [action,label,id]of [['repair','Réparation','selectionRepairQuote'],['upgrade','Amélioration','selectionUpgradeQuote']]){
        const quote=this.structureActionStatus(action,b),cost=resourceText(quote.cost);
        this.ui[action==='repair'?'repairSelected':'upgradeSelected'].disabled=!quote.ok;
        get(id).textContent=label+' : '+(cost?cost+(quote.reason?' — '+quote.reason:''):quote.reason);
      }
      const demolition=this.structureActionStatus('demolish',b),pending=this.pendingDemolition===b&&demolition.ok;
      get('demolishSelected').disabled=!demolition.ok;get('demolishSelected').title=demolition.reason||'Vérifier les matériaux récupérables avant de démonter.';
      get('demolishSelected').setAttribute('aria-expanded',String(pending));get('demolitionReview').classList.toggle('hidden',!pending);
      if(pending){
        const warnings=[];
        if(b.def.wall)warnings.push('Ce démontage peut ouvrir votre enceinte.');
        if(b.completed&&b.def.storage)warnings.push('Capacité restante : '+demolition.cap+' par ressource.');
        if(bagTotal(demolition.lost)>0)warnings.push('Excédent perdu : '+this.maintenanceAmounts(demolition.lost)+'.');
        if(b.completed&&b.def.housing)warnings.push('Logements retirés : '+b.def.housing+'.');
        if(b.completed&&b.def.powerGen)warnings.push('Production électrique retirée : '+b.def.powerGen+'.');
        get('demolitionSummary').textContent=b.def.name+' — récupération possible maintenant : '+this.maintenanceAmounts(demolition.refund)+'. '+warnings.join(' ')+' Cette action est irréversible.';
      }
      if(this.ui.prioritySelected)this.ui.prioritySelected.textContent=`PRIORITÉ ${['','BASSE','NORMALE','HAUTE'][b.priority||2]}`;
    }

    depthEntries(view) {
      const entries = this.depthQueue || (this.depthQueue = []); entries.length = 0;
      const push = (kind, entity, radius, depth = entity.y) => {
        if (entity.dead || !this.visible(entity.x, entity.y, radius, view)) return;
        entries.push({ kind, entity, depth, id: entity.id || 0, order: entries.length });
      };
      for (const node of this.world.nodes) if (!node.depleted) push(0, node, Math.max(node.radius + 20, (node.renderSize || 0) / 2 + 10));
      for (const building of this.world.buildings.values()) push(1, building, Math.max(building.w, building.h) * TILE + 40, building.bottom);
      for (const unit of this.units) push(2, unit, 28);
      for (const zombie of this.zombies) push(3, zombie, 28);
      push(4, this.player, 28);
      for (const truck of this.territories?.truckEntities() || []) push(5, truck, 38);
      if(this.expeditions?.car()&&!this.expeditions.car().regionAway)push(6,this.expeditions.car(),40);
      entries.sort((a, b) => a.depth - b.depth || a.kind - b.kind || a.id - b.id || a.order - b.order);
      return entries;
    }

    render() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); ctx.fillStyle = '#171c18'; ctx.fillRect(0, 0, this.width, this.height);
      const shakeX = this.camera.shake && !this.settings.reducedMotion ? (Math.random() - .5) * this.camera.shake : 0;
      const shakeY = this.camera.shake && !this.settings.reducedMotion ? (Math.random() - .5) * this.camera.shake : 0;
      this.frameShake={x:shakeX,y:shakeY};
      ctx.save(); ctx.translate(this.width / 2 + shakeX, this.height / 2 + shakeY); ctx.scale(this.camera.zoom, this.camera.zoom); ctx.translate(-this.camera.x, -this.camera.y);
      const view = this.viewBounds();
      this.crowdDetail = this.width > 720 && this.camera.zoom > .72 && this.zombies.length < 320;
      this.drawGround(ctx, view); this.contentUI?.drawMarker(ctx, view);
      for (const corpse of this.corpses) if (this.visible(corpse.x, corpse.y, 25, view)) this.drawCorpse(ctx, corpse);
      // One common ground-depth queue: no faction is always painted on top.
      for (const entry of this.depthEntries(view)) {
        if (typeof entry.draw === 'function') entry.draw(ctx);
        else if (entry.kind === 0) this.drawNode(ctx, entry.entity);
        else if (entry.kind === 1) this.drawBuilding(ctx, entry.entity);
        else if (entry.kind === 2) this.drawUnit(ctx, entry.entity);
        else if (entry.kind === 3) this.drawZombie(ctx, entry.entity);
        else if (entry.kind === 5) this.territories?.drawTruck(ctx, entry.entity);
        else if(entry.kind === 6)globalThis.DeadwallExpeditionArt?.car(ctx,entry.entity);
        else this.drawPlayer(ctx);
      }
      for (const particle of this.particles) if (this.visible(particle.x, particle.y, 20, view)) this.drawParticle(ctx, particle);
      for (const projectile of this.projectiles) if (!projectile.dead && this.visible(projectile.x, projectile.y, 20, view)) this.drawProjectile(ctx, projectile);
      for (const floater of this.floaters) if (this.visible(floater.x, floater.y, 80, view)) this.drawFloater(ctx, floater);
      this.drawRally(ctx); this.drawPlacement(ctx); ctx.restore();
      this.drawRain(ctx); this.drawNight(ctx); this.drawThreatArrows(ctx); this.drawCrosshair(ctx);
    }

    zoomView(factor){
      if(!Number.isFinite(factor)||factor<=0)return;
      if(this.frontier?.active())this.frontier.scale(this.frontier.scale()*factor);
      else this.camera.zoom=clamp(this.camera.zoom*factor,.52,1.65);
    }
    viewBounds(){const hw=this.width/this.camera.zoom/2+120,hh=this.height/this.camera.zoom/2+120;return{left:this.camera.x-hw,right:this.camera.x+hw,top:this.camera.y-hh,bottom:this.camera.y+hh};}
    visible(x,y,r,v){return x+r>=v.left&&x-r<=v.right&&y+r>=v.top&&y-r<=v.bottom;}

    drawGround(ctx,v){
      const pose=this.frontier?.position(),biomeGround=pose?.generation>=6&&globalThis.DeadwallGround135;
      if(biomeGround){
        const h=globalThis.DeadwallAtlasProjection.home(this),regionView={left:h.minX+Math.max(0,v.left)/32,right:h.minX+Math.min(WORLD_SIZE,v.right)/32,top:h.minY+Math.max(0,v.top)/32,bottom:h.minY+Math.min(WORLD_SIZE,v.bottom)/32};
        ctx.save();ctx.scale(32,32);ctx.translate(-h.minX,-h.minY);biomeGround.draw(ctx,{seed:this.world.seed,generation:pose.generation},regionView,{scale:this.camera.zoom*32});ctx.restore();
      }else{
      const tile=96,minX=Math.max(0,Math.floor(v.left/tile)),maxX=Math.min(Math.ceil(WORLD_SIZE/tile),Math.ceil(v.right/tile)),minY=Math.max(0,Math.floor(v.top/tile)),maxY=Math.min(Math.ceil(WORLD_SIZE/tile),Math.ceil(v.bottom/tile));
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const n=seededHash(x,y,this.world.seed),r=Math.floor(25+n*7),g=Math.floor(31+n*8),b=Math.floor(27+n*5);ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(x*tile,y*tile,tile+1,tile+1);
        if(n>.74){ctx.fillStyle='rgba(150,135,95,.045)';ctx.beginPath();ctx.arc(x*tile+n*tile,y*tile+seededHash(y,x,3)*tile,6+n*8,0,Math.PI*2);ctx.fill();}
      }
      this.art?.drawGround(ctx,v,WORLD_SIZE);
      }
      const c=WORLD_SIZE/2;
      if(this.exploration125?.layoutRevision!==3){
      ctx.fillStyle='#242a28';ctx.fillRect(0,c-66,WORLD_SIZE,132);ctx.fillRect(c-66,0,132,WORLD_SIZE);
      ctx.fillStyle='rgba(7,10,9,.28)';ctx.fillRect(0,c-70,WORLD_SIZE,4);ctx.fillRect(0,c+66,WORLD_SIZE,4);ctx.fillRect(c-70,0,4,WORLD_SIZE);ctx.fillRect(c+66,0,4,WORLD_SIZE);
      }
      if(v.right>c-620&&v.left<c+620&&v.bottom>c-520&&v.top<c+520){
        const yard=ctx.createRadialGradient(c,c,70,c,c,560);yard.addColorStop(0,'rgba(55,62,58,.95)');yard.addColorStop(.52,'rgba(45,52,49,.72)');yard.addColorStop(.82,'rgba(38,44,41,.25)');yard.addColorStop(1,'rgba(35,41,38,0)');ctx.fillStyle=yard;ctx.fillRect(c-580,c-500,1160,1000);
        for(let i=0;i<18;i++){const a=seededHash(i,this.world.seed,71)*Math.PI*2,rad=90+seededHash(i,12,this.world.seed)*410,x=c+Math.cos(a)*rad,y=c+Math.sin(a)*rad*.72,w=34+seededHash(i,22,9)*82,h=15+seededHash(i,41,3)*34;ctx.save();ctx.translate(x,y);ctx.rotate((seededHash(i,7,13)-.5)*.55);ctx.fillStyle=`rgba(112,117,108,${.018+seededHash(i,44,2)*.035})`;ctx.fillRect(-w/2,-h/2,w,h);ctx.restore();}
        ctx.strokeStyle='rgba(216,190,112,.055)';ctx.lineWidth=2;for(const radius of [225,355,490]){ctx.beginPath();ctx.ellipse(c,c,radius,radius*.72,0,0,Math.PI*2);ctx.stroke();}
      }
      if(this.exploration125?.layoutRevision!==3){ctx.strokeStyle='rgba(208,196,142,.13)';ctx.lineWidth=3;ctx.setLineDash([38,32]);ctx.beginPath();ctx.moveTo(0,c);ctx.lineTo(WORLD_SIZE,c);ctx.moveTo(c,0);ctx.lineTo(c,WORLD_SIZE);ctx.stroke();ctx.setLineDash([]);}
      ctx.strokeStyle='rgba(220,225,215,.09)';ctx.lineWidth=5;ctx.strokeRect(3,3,WORLD_SIZE-6,WORLD_SIZE-6);
      this.infrastructure?.drawRoads(ctx,v);
      if(this.selectedBuild||this.rallyPlacement){const minGX=Math.max(0,Math.floor(v.left/TILE)),maxGX=Math.min(WORLD_TILES,Math.ceil(v.right/TILE)),minGY=Math.max(0,Math.floor(v.top/TILE)),maxGY=Math.min(WORLD_TILES,Math.ceil(v.bottom/TILE));ctx.strokeStyle='rgba(210,220,210,.055)';ctx.lineWidth=1/this.camera.zoom;ctx.beginPath();for(let x=minGX;x<=maxGX;x++){ctx.moveTo(x*TILE,minGY*TILE);ctx.lineTo(x*TILE,maxGY*TILE);}for(let y=minGY;y<=maxGY;y++){ctx.moveTo(minGX*TILE,y*TILE);ctx.lineTo(maxGX*TILE,y*TILE);}ctx.stroke();}
    }



    drawNode(ctx,node){if(this.art?.drawNode(ctx,node,this))return;ctx.save();ctx.translate(node.x,node.y);ctx.scale(node.flash>0?1.08:1,node.flash>0?1.08:1);ctx.globalAlpha=clamp(node.amount/node.maxAmount,.35,1);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(5,8,node.radius*1.05,node.radius*.48,0,0,Math.PI*2);ctx.fill();if(node.type==='wood'){ctx.fillStyle='#4c3927';ctx.fillRect(-4,-3,8,node.radius+8);const colors=['#344631','#3d5036','#46593c'];for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.fillStyle=colors[(i+node.variant)%3];ctx.beginPath();ctx.arc(Math.cos(a)*node.radius*.45,Math.sin(a)*node.radius*.28-node.radius*.52,node.radius*.52,0,Math.PI*2);ctx.fill();}}else if(node.type==='scrap'){const colors=['#626967','#77766c','#4f5859','#805f48'];for(let i=0;i<7;i++){ctx.save();ctx.rotate((i*1.7+node.variant)*.45);ctx.fillStyle=colors[(i+node.variant)%4];ctx.fillRect(-node.radius*.65+i*2,-8+(i%3)*5,node.radius*.8,7);ctx.restore();}ctx.strokeStyle='#383d3c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(5,1,node.radius*.38,0,Math.PI*2);ctx.stroke();}else if(node.type==='stone'){const colors=['#67665f','#7a786e','#565750'];for(let i=0;i<5;i++){const a=i/5*Math.PI*2,r=node.radius*(i? .45:.15);ctx.fillStyle=colors[(i+node.variant)%3];ctx.beginPath();ctx.moveTo(Math.cos(a)*r-8,Math.sin(a)*r+5);ctx.lineTo(Math.cos(a)*r+9,Math.sin(a)*r+3);ctx.lineTo(Math.cos(a)*r+4,Math.sin(a)*r-13);ctx.lineTo(Math.cos(a)*r-9,Math.sin(a)*r-7);ctx.closePath();ctx.fill();}}else if(node.type==='food'){ctx.fillStyle='#3f5035';ctx.fillRect(-node.radius,-node.radius*.55,node.radius*2,node.radius*1.1);ctx.strokeStyle='#718153';ctx.lineWidth=2;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*5,9);ctx.lineTo(i*6+Math.sin(i+this.elapsed)*2,-12);ctx.stroke();}ctx.fillStyle='#7f6b43';ctx.fillRect(-8,-2,16,12);}else{for(let i=-1;i<=1;i++){ctx.fillStyle='#444c49';ctx.fillRect(i*12-5,-8+Math.abs(i)*3,10,18);ctx.fillStyle='#9a723c';ctx.fillRect(i*12-5,-8+Math.abs(i)*3,10,4);}}ctx.restore();}

    drawBuilding(ctx,b){const d=b.def,l=b.left,t=b.top,w=b.w*TILE,h=b.h*TILE;ctx.save();if(!b.completed){ctx.fillStyle='rgba(210,168,74,.07)';ctx.strokeStyle='rgba(232,203,126,.8)';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.fillRect(l+2,t+2,w-4,h-4);ctx.strokeRect(l+2,t+2,w-4,h-4);ctx.setLineDash([]);ctx.strokeStyle='rgba(232,203,126,.3)';ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(l+w,t+h);ctx.moveTo(l+w,t);ctx.lineTo(l,t+h);ctx.stroke();ctx.fillStyle='#7a6040';for(let i=0;i<Math.floor(b.progress*6);i++)ctx.fillRect(l+7+(i%3)*14,t+h-12-Math.floor(i/3)*10,11,8);ctx.fillStyle='#d2a84a';ctx.fillRect(l,t+h+4,w*b.progress,3);ctx.restore();return;}
      if(this.art?.drawBuilding(ctx,b,this.world)){
        if(b.def.production&&b.powered&&!this.settings.reducedMotion)this.art.drawEffect(ctx,'smoke',b.x+w*.25,t-6,28,((this.elapsed*.55+b.id)%1),.35);
      }
      else if(d.gate&&b.gateMode==='open'){
        ctx.save();ctx.translate(b.x,b.y);if(b.rotation%2)ctx.rotate(Math.PI/2);
        const gw=b.rotation%2?h:w,gh=b.rotation%2?w:h;
        ctx.fillStyle=d.color;ctx.fillRect(-gw/2,-gh/2,gw*.22,gh);ctx.fillRect(gw*.28,-gh/2,gw*.22,gh);
        ctx.strokeStyle='#dfb06e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-gh*.4);ctx.lineTo(0,gh*.4);ctx.stroke();ctx.restore();
      }
      else if(d.id==='core'||b.type==='core'){
        ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(l+9,t+12,w-1,h-2);
        ctx.fillStyle='#252d29';ctx.fillRect(l+2,t+7,w-4,h-9);
        ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(l+7,t+6);ctx.lineTo(l+w-7,t+6);ctx.lineTo(l+w-2,t+13);ctx.lineTo(l+w-2,t+h-5);ctx.lineTo(l+2,t+h-5);ctx.lineTo(l+2,t+13);ctx.closePath();ctx.fill();
        ctx.fillStyle=d.roof;ctx.beginPath();ctx.moveTo(l+12,t+3);ctx.lineTo(l+w-12,t+3);ctx.lineTo(l+w-5,t+12);ctx.lineTo(l+w-9,t+h*.7);ctx.lineTo(l+9,t+h*.7);ctx.lineTo(l+5,t+12);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(238,222,174,.18)';ctx.lineWidth=2;ctx.strokeRect(l+10,t+10,w-20,h*.56);
        for(const [cx,cy] of [[l+10,t+12],[l+w-10,t+12],[l+10,t+h-12],[l+w-10,t+h-12]]){ctx.fillStyle='#313a36';ctx.beginPath();ctx.arc(cx,cy,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6f776f';ctx.stroke();}
        ctx.fillStyle='#161d1a';ctx.fillRect(b.x-16,b.y-16,32,30);ctx.fillStyle='#3b4540';ctx.fillRect(b.x-11,b.y-21,22,28);ctx.fillStyle='#8f7742';ctx.fillRect(b.x-7,b.y-17,14,5);
        ctx.strokeStyle='#8f9890';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y-21);ctx.lineTo(b.x,b.y-38);ctx.moveTo(b.x,b.y-34);ctx.lineTo(b.x+8,b.y-30);ctx.stroke();
        const pulse=this.settings.reducedMotion?.2:(.18+Math.sin(this.elapsed*2+b.id)*.08);ctx.strokeStyle=`rgba(232,190,86,${pulse})`;ctx.beginPath();ctx.arc(b.x,b.y-38,5,0,Math.PI*2);ctx.stroke();
      }
      else if(d.id==='spikes'){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(l+3,t+10,w-2,h-6);ctx.strokeStyle='#85877f';ctx.lineWidth=3;for(let i=3;i<w;i+=8){ctx.beginPath();ctx.moveTo(l+i,t+h-4);ctx.lineTo(l+i+6,t+5);ctx.moveTo(l+i+7,t+h-4);ctx.lineTo(l+i+1,t+5);ctx.stroke();}}
      else if(d.wall){ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(l+5,t+7,w,h);ctx.fillStyle=d.color;ctx.fillRect(l+1,t+3,w-2,h-4);ctx.fillStyle=d.roof;ctx.fillRect(l+2,t+2,w-4,Math.max(6,h*.28));ctx.strokeStyle='rgba(0,0,0,.32)';ctx.lineWidth=1;for(let i=1;i<Math.max(1,b.w*2);i++){const x=l+i/(b.w*2)*w;ctx.beginPath();ctx.moveTo(x,t+3);ctx.lineTo(x,t+h-2);ctx.stroke();}if(d.gate){ctx.fillStyle='#242b29';ctx.fillRect(l+w*.22,t+h*.25,w*.56,h*.72);ctx.strokeStyle='#9b8b64';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(l+w/2,t+h*.28);ctx.lineTo(l+w/2,t+h-2);ctx.stroke();}if(b.corpseLoad>4){ctx.fillStyle='rgba(63,45,39,.8)';const piles=Math.min(8,Math.floor(b.corpseLoad/3));for(let i=0;i<piles;i++){ctx.beginPath();ctx.ellipse(l+5+(i/Math.max(1,piles-1))*(w-10),t+h+2,8,4+i*.35,0,0,Math.PI*2);ctx.fill();}}}
      else{ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(l+7,t+9,w,h);ctx.fillStyle=d.color;ctx.fillRect(l+1,t+7,w-2,h-8);ctx.fillStyle=d.roof;ctx.fillRect(l+3,t+2,w-6,h*.68);ctx.strokeStyle='rgba(255,255,255,.11)';ctx.strokeRect(l+3,t+2,w-6,h*.68);ctx.fillStyle='rgba(15,20,18,.55)';for(let x=l+10;x<l+w-8;x+=19)ctx.fillRect(x,t+h*.76,9,6);ctx.fillStyle='rgba(235,221,165,.8)';ctx.font=`bold ${Math.max(11,Math.min(18,w*.22))}px Bahnschrift,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.symbol||'',l+w/2,t+h*.38);if(d.production){ctx.strokeStyle='rgba(20,23,20,.55)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(l+w*.75,t+4);ctx.lineTo(l+w*.75,t-11);ctx.stroke();ctx.fillStyle='rgba(90,96,89,.38)';ctx.beginPath();ctx.arc(l+w*.75,t-16,7+Math.sin(this.elapsed*1.2+b.id)*2,0,Math.PI*2);ctx.fill();}}
      if(d.range&&!this.art?.drawTurret(ctx,b)){ctx.save();ctx.translate(b.x,b.y-3);ctx.rotate(b.turretAngle);ctx.fillStyle='#232a2a';ctx.fillRect(-6,-6,d.id==='heavyTurret'?30:23,12);ctx.fillStyle='#7d8581';ctx.fillRect(7,-2,d.id==='heavyTurret'?27:20,4);if(b.flash>0){ctx.fillStyle='#ffd06f';ctx.beginPath();ctx.moveTo(33,0);ctx.lineTo(45,-6);ctx.lineTo(42,0);ctx.lineTo(45,6);ctx.closePath();ctx.fill();}ctx.restore();}
      if(b.selected){ctx.strokeStyle='#e3be60';ctx.lineWidth=2;ctx.setLineDash([8,5]);ctx.strokeRect(l-4,t-4,w+8,h+8);ctx.setLineDash([]);}if(b.health<b.maxHealth||b.underAttack>0||b.selected){const ratio=b.health/b.maxHealth;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(l,t-9,w,5);ctx.fillStyle=ratio<.35?'#b94d43':ratio<.7?'#c49b4b':'#76966a';ctx.fillRect(l+1,t-8,(w-2)*ratio,3);}if(d.powerUse&&!b.powered){ctx.fillStyle='rgba(20,22,20,.7)';ctx.fillRect(l,t,w,h);ctx.fillStyle='#c8944a';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('⚡',b.x,b.y);}
      const integrity=b.health/b.maxHealth;if(integrity<.72){ctx.strokeStyle=integrity<.35?'rgba(201,82,69,.72)':'rgba(20,24,21,.58)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(l+w*.2,t+h*.24);ctx.lineTo(l+w*.32,t+h*.39);ctx.lineTo(l+w*.25,t+h*.56);ctx.moveTo(l+w*.78,t+h*.34);ctx.lineTo(l+w*.66,t+h*.47);ctx.lineTo(l+w*.73,t+h*.62);ctx.stroke();}
      if(integrity<.35&&!this.settings.reducedMotion&&this.art?.drawEffect(ctx,'fire',b.x,b.y-8,Math.max(38,w*.6),(this.elapsed*.7+b.id)%1,.85)){}else if(integrity<.35&&!this.settings.reducedMotion){ctx.fillStyle=`rgba(214,104,48,${.5+Math.sin(this.elapsed*9+b.id)*.22})`;ctx.beginPath();ctx.moveTo(l+w*.7,t+h*.2);ctx.lineTo(l+w*.64,t+h*.04);ctx.lineTo(l+w*.76,t+h*.14);ctx.lineTo(l+w*.8,t+h*.02);ctx.lineTo(l+w*.84,t+h*.24);ctx.closePath();ctx.fill();}
      if(b.underAttack>0){ctx.strokeStyle=`rgba(197,83,73,${.45+Math.sin(this.elapsed*10)*.25})`;ctx.lineWidth=3;ctx.strokeRect(l-2,t-2,w+4,h+4);}ctx.restore();}

    drawUnit(ctx,u){
      if(u.kind==='medic'||u.kind==='engineer'){
        ctx.save();ctx.strokeStyle=u.kind==='medic'?'#a8dad0':'#e0b666';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1.5;
        // Shape and colour both identify the support role; no motion is needed to read it.
        if(u.kind==='medic'){ctx.fillRect(u.x-4,u.y-30,8,3);ctx.fillRect(u.x-1.5,u.y-33,3,9);}
        else{ctx.strokeRect(u.x-4,u.y-32,8,7);ctx.beginPath();ctx.moveTo(u.x-2,u.y-34);ctx.lineTo(u.x+2,u.y-34);ctx.stroke();}
        if(u.supportActive){ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(u.x,u.y,21,0,Math.PI*2);ctx.stroke();
          if(!this.settings.reducedMotion&&u.kind==='engineer')this.art?.drawEffect(ctx,'spark',u.x+12,u.y,19,(this.elapsed+u.id)%1,.4);}
        ctx.restore();
      }
      if(u.state==='clear'){
        ctx.strokeStyle='#a9c7b0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(u.x-4,u.y-24);ctx.lineTo(u.x+4,u.y-30);ctx.moveTo(u.x-6,u.y-24);ctx.lineTo(u.x,u.y-19);ctx.stroke();
        const wall=this.world.buildings.get(u.targetBuilding);
        if(!this.settings.reducedMotion&&wall&&!wall.dead&&wall.corpseLoad>0&&this.workerCanWorkAt(u,this.workerCleanupPoint(u,wall),C.WORKER_RULES.cleanupRange))
          this.art?.drawEffect(ctx,'dust',u.x,u.y+12,23,(this.elapsed*.7+u.id)%1,.3);
      }
      if(this.art?.drawActor(ctx,u,u.kind,this.elapsed,this.settings.reducedMotion,this.width<=720)){
        this.drawActorBars(ctx,u,false);
        if(u.carry>0){ctx.fillStyle='#d2a84a';ctx.fillRect(u.x-6,u.y+20,12*Math.min(1,u.carry/u.maxCarry),3);}
        if(u.state==='build'){ctx.fillStyle='#d2a84a';ctx.fillRect(u.x-2,u.y-28,4,6);}
        return;
      }
      ctx.save();ctx.translate(u.x,u.y);const scale=this.width<=720?1.22:1.08;ctx.scale(scale,scale);ctx.rotate(u.facing);const moving=u.state==='move'||u.state==='haul',stride=this.settings.reducedMotion?0:Math.sin(this.elapsed*(moving?9:3)+u.id)*2;
      ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(1,6,u.radius*1.15,u.radius*.68,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=u.kind==='soldier'?'#38483b':'#66533a';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-4,2);ctx.lineTo(-12,6+stride);ctx.moveTo(-4,-2);ctx.lineTo(-12,-6-stride);ctx.stroke();
      ctx.fillStyle=u.kind==='soldier'?'#5f765e':'#8b7047';ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(6,-8);ctx.lineTo(11,-3);ctx.lineTo(9,6);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();
      ctx.fillStyle=u.kind==='soldier'?'#2c3830':'#a88c56';ctx.beginPath();ctx.arc(10,0,u.radius*.45,0,Math.PI*2);ctx.fill();
      if(u.kind==='soldier'){ctx.strokeStyle='#303a34';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(2,-5);ctx.lineTo(14,-4);ctx.moveTo(2,5);ctx.lineTo(14,3);ctx.stroke();ctx.fillStyle='#202725';ctx.fillRect(8,-3,20,6);ctx.fillStyle='#a3aaa3';ctx.fillRect(21,-1,12,2);}else if(u.carry>0){ctx.fillStyle='#6e5537';ctx.fillRect(-10,-9,9,18);ctx.strokeStyle='#b19157';ctx.lineWidth=1;ctx.strokeRect(-10,-9,9,18);}
      ctx.rotate(-u.facing);if(u.health<u.maxHealth){ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(-13,-21,26,3);ctx.fillStyle=u.health/u.maxHealth<.35?'#b94d43':'#7da46e';ctx.fillRect(-13,-21,26*u.health/u.maxHealth,3);}if(u.state==='build'){ctx.fillStyle=`rgba(210,168,74,${.45+Math.sin(this.elapsed*6+u.id)*.2})`;ctx.fillRect(-2,-27,4,6);}ctx.restore();
    }

    drawZombie(ctx,z){
      if(this.art?.drawActor(ctx,z,z.kind,this.elapsed,this.settings.reducedMotion,this.width<=720)){
        if(z.health/z.maxHealth<.55||['armored','howler','shielded','charger'].includes(z.kind))this.drawActorBars(ctx,z,true);
        if(z.rage>0){ctx.strokeStyle='rgba(198,77,62,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(z.x,z.y,17,0,Math.PI*2);ctx.stroke();}
        return;
      }
      const d=ENEMIES[z.kind],detail=this.crowdDetail;ctx.save();ctx.translate(z.x,z.y);const scale=this.width<=720?1.28:1.12;ctx.scale(scale,scale);ctx.rotate(z.facing);const stride=this.settings.reducedMotion?0:Math.sin(this.elapsed*d.speed*.15+z.anim)*3,asym=(z.id%3-1)*1.4;
      ctx.fillStyle='rgba(0,0,0,.36)';ctx.beginPath();ctx.ellipse(-1,6,z.radius*1.25,z.radius*.68,0,0,Math.PI*2);ctx.fill();
      if(z.kind==='crawler'){
        ctx.fillStyle=d.color;ctx.beginPath();ctx.ellipse(1,0,z.radius*1.45,z.radius*.62,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#71685e';ctx.beginPath();ctx.arc(z.radius*1.18,-1,z.radius*.42,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4f4038';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(3,-4);ctx.lineTo(14,-13-stride);ctx.moveTo(3,4);ctx.lineTo(14,13+stride);ctx.moveTo(-7,-4);ctx.lineTo(-16,-11+stride);ctx.moveTo(-7,4);ctx.lineTo(-16,11-stride);ctx.stroke();
      }else{
        const armored=z.kind==='armored',runner=z.kind==='runner',howler=z.kind==='howler',lean=runner?4:howler?1:0;
        if(detail){ctx.strokeStyle=armored?'#303b3e':'#3c3e38';ctx.lineWidth=armored?5:4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,-3);ctx.lineTo(-14,-8-stride+asym);ctx.moveTo(-5,3);ctx.lineTo(-15,8+stride);ctx.moveTo(1,-5);ctx.lineTo(10+lean,-12+asym);ctx.moveTo(0,5);ctx.lineTo(8+lean,13-asym);ctx.stroke();}
        ctx.fillStyle=d.color;ctx.beginPath();ctx.ellipse(lean,0,z.radius*(armored?1.05:.92),z.radius*(armored?.88:.72),0,0,Math.PI*2);ctx.fill();
        if(armored){ctx.fillStyle='#354247';ctx.beginPath();ctx.moveTo(-6,-10);ctx.lineTo(10,-9);ctx.lineTo(15,-4);ctx.lineTo(13,7);ctx.lineTo(-5,9);ctx.closePath();ctx.fill();ctx.strokeStyle='#7a8789';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,-4);ctx.lineTo(12,-4);ctx.stroke();}
        ctx.fillStyle=armored?'#293438':'#777065';ctx.beginPath();ctx.arc(z.radius*.92+lean,asym,z.radius*(howler?.56:.47),0,Math.PI*2);ctx.fill();
        if(howler){ctx.fillStyle='#713c35';ctx.beginPath();ctx.ellipse(z.radius*1.2+lean,asym,z.radius*.34,z.radius*.23,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(190,79,65,.72)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.radius*1.1+lean,asym,6+(this.settings.reducedMotion?0:Math.sin(this.elapsed*8+z.id)*1.5),0,Math.PI*2);ctx.stroke();}
      }
      if(z.kind==='shielded'){ctx.fillStyle=z.shieldImpact>0?'#bcc1b9':'#536169';ctx.strokeStyle='#a0aba9';ctx.lineWidth=1.5;ctx.fillRect(13,-13,6,26);ctx.strokeRect(13,-13,6,26);}
      if(z.kind==='charger'){ctx.strokeStyle='#cab6a0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(8,-8);ctx.moveTo(-6,8);ctx.lineTo(8,8);if(z.charge.stage==='windup'){ctx.moveTo(19,-6);ctx.lineTo(25,0);ctx.lineTo(19,6);}ctx.stroke();}
      ctx.rotate(-z.facing);const ratio=z.health/z.maxHealth;if(ratio<.55||['armored','howler','shielded','charger'].includes(z.kind)){ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(-11,-24,22,3);ctx.fillStyle='#a84d43';ctx.fillRect(-11,-24,22*ratio,3);}ctx.restore();
    }

    drawPlayer(ctx){
      if(this.art?.drawActor(ctx,this.player,'player',this.elapsed,this.settings.reducedMotion,this.width<=720)){
        this.drawActorBars(ctx,this.player,false,true);return;
      }
      const p=this.player;ctx.save();ctx.translate(p.x,p.y);const scale=this.width<=720?1.2:1.1;ctx.scale(scale,scale);ctx.rotate(p.facing);const moving=Math.hypot(p.vx,p.vy)>1,stride=this.settings.reducedMotion?0:Math.sin(this.elapsed*(moving?10:3))*(moving?2.2:.25),flash=p.invulnerable>0&&Math.floor(p.invulnerable*10)%2===0;
      ctx.fillStyle='rgba(0,0,0,.42)';ctx.beginPath();ctx.ellipse(0,7,16,9,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3a413d';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,-2);ctx.lineTo(-13,-7-stride);ctx.moveTo(-5,2);ctx.lineTo(-13,7+stride);ctx.stroke();
      ctx.fillStyle=flash?'#c5c8b5':'#9b895e';ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(7,-9);ctx.lineTo(12,-4);ctx.lineTo(10,7);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();
      ctx.fillStyle='#303734';ctx.beginPath();ctx.moveTo(-5,-7);ctx.lineTo(6,-7);ctx.lineTo(10,-3);ctx.lineTo(8,6);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();
      ctx.fillStyle=flash?'#b7baa8':'#b09a6b';ctx.beginPath();ctx.arc(11,-1,5.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#4a4f49';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(2,-5);ctx.lineTo(15,-4);ctx.moveTo(1,5);ctx.lineTo(14,3);ctx.stroke();
      const length=p.weapon==='shotgun'?32:p.weapon==='rifle'?30:23;ctx.fillStyle='#1c2320';ctx.fillRect(8,-3,length,6);ctx.fillStyle='#969b95';ctx.fillRect(20,-1,length-10,2);ctx.fillStyle='#46372a';ctx.fillRect(6,3,10,5);
      ctx.rotate(-p.facing);ctx.fillStyle='rgba(0,0,0,.68)';ctx.fillRect(-20,-31,40,4);ctx.fillStyle=p.health<35?'#c55349':'#82ad78';ctx.fillRect(-20,-31,40*p.health/p.maxHealth,4);ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(-20,-24,40,3);ctx.fillStyle='#d8ad4d';ctx.fillRect(-20,-24,40*p.stamina/p.maxStamina,3);ctx.restore();
    }

    drawActorBars(ctx,actor,hostile=false,player=false){
      const w=player?40:26,x=actor.x-w/2,y=actor.y-(player?32:26),ratio=clamp(actor.health/actor.maxHealth,0,1);
      if(player||hostile||ratio<1){ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(x,y,w,4);ctx.fillStyle=hostile||ratio<.35?'#cb685b':'#97c37f';ctx.fillRect(x,y,w*ratio,3);}
      if(player){ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(x,y+7,w,3);ctx.fillStyle='#d8ad4d';ctx.fillRect(x,y+7,w*clamp(actor.stamina/actor.maxStamina,0,1),3);}
    }
    drawProjectile(ctx,p){const speed=Math.hypot(p.vx,p.vy)||1,nx=p.vx/speed,ny=p.vy/speed;ctx.strokeStyle=p.color;ctx.lineWidth=p.radius;ctx.globalAlpha=.78;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-nx*18,p.y-ny*18);ctx.stroke();ctx.globalAlpha=1;}
    drawParticle(ctx,p){const ratio=clamp(p.life/p.maxLife,0,1);if(this.art?.drawEffect(ctx,p.kind,p.x,p.y,Math.max(15,p.size*9),1-ratio,ratio,p.rotation))return;ctx.save();ctx.globalAlpha=ratio;ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;if(p.kind==='dust'||p.kind==='smoke'){ctx.beginPath();ctx.arc(0,0,p.size*(1.4-ratio*.35),0,Math.PI*2);ctx.fill();}else if(p.kind==='spark'||p.kind==='muzzle')ctx.fillRect(-p.size*1.8,-p.size*.25,p.size*3.6,p.size*.5);else ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.7);ctx.restore();}
    drawCorpse(ctx,c){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rotation);ctx.scale(c.scale,c.scale);ctx.globalAlpha=clamp(1-Math.max(0,c.age-70)/25,0,.65);ctx.fillStyle='#3f3630';ctx.beginPath();ctx.ellipse(0,0,13,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#512f2b';ctx.beginPath();ctx.ellipse(4,3,11,4,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    drawFloater(ctx,f){ctx.save();ctx.globalAlpha=clamp(f.life/f.maxLife,0,1);ctx.font='bold 13px Bahnschrift,sans-serif';ctx.textAlign='center';ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=3;ctx.strokeText(f.text,f.x,f.y);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);ctx.restore();}

    drawRally(ctx){ctx.save();ctx.translate(this.rally.x,this.rally.y);ctx.strokeStyle='rgba(125,169,113,.7)';ctx.fillStyle='rgba(125,169,113,.08)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,34+(this.settings.reducedMotion?0:Math.sin(this.elapsed*2)*3),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();ctx.restore();this.squadUI?.drawMarkers(ctx,this.viewBounds());}

    drawPlacement(ctx){if(this.rallyPlacement){ctx.save();ctx.translate(this.input.mouseWorldX,this.input.mouseWorldY);ctx.strokeStyle='#8db57f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.stroke();ctx.restore();return;}if(!this.selectedBuild)return;const d=BUILDINGS[this.selectedBuild],cells=this.isLineWall(d)?(this.wallPreview.length?this.wallPreview:[{x:grid(this.input.mouseWorldX),y:grid(this.input.mouseWorldY)}]):[{x:grid(this.input.mouseWorldX),y:grid(this.input.mouseWorldY)}];ctx.save();ctx.globalAlpha=.58;for(const cell of cells){const valid=this.world.placement(d,cell.x,cell.y,this.buildRotation).valid&&canAfford(this.resources,d.cost),size=rotateSize(d,this.buildRotation);ctx.fillStyle=valid?'rgba(111,164,102,.55)':'rgba(183,71,62,.55)';ctx.fillRect(cell.x*TILE+2,cell.y*TILE+2,size[0]*TILE-4,size[1]*TILE-4);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.strokeRect(cell.x*TILE+2,cell.y*TILE+2,size[0]*TILE-4,size[1]*TILE-4);}ctx.restore();}

    drawNight(ctx){const darkness=clamp(1-this.daylight(),0,1)*.72;if(darkness<=.02)return;ctx.save();ctx.fillStyle=`rgba(4,8,12,${darkness})`;ctx.fillRect(0,0,this.width,this.height);ctx.globalCompositeOperation='screen';const lights=[{x:this.player.x,y:this.player.y,r:145,s:.2}];for(const b of this.world.buildings.values()){if(!b.completed||b.dead||!b.powered||!b.def.light||lights.length>=PERFORMANCE_LIMITS.lights)continue;lights.push({x:b.x,y:b.y,r:b.def.light,s:.18});}for(const l of lights){const sx=(l.x-this.camera.x)*this.camera.zoom+this.width/2,sy=(l.y-this.camera.y)*this.camera.zoom+this.height/2,r=l.r*this.camera.zoom;if(sx+r<0||sx-r>this.width||sy+r<0||sy-r>this.height)continue;const g=ctx.createRadialGradient(sx,sy,0,sx,sy,r);g.addColorStop(0,`rgba(255,218,143,${l.s})`);g.addColorStop(.5,`rgba(186,164,112,${l.s*.5})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();}ctx.restore();}

    drawRain(ctx){if(this.weather<.02)return;ctx.save();ctx.strokeStyle=`rgba(180,195,196,${.08+this.weather*.12})`;ctx.lineWidth=1;const count=Math.floor(45+this.weather*90);for(let i=0;i<count;i++){const x=(seededHash(i,Math.floor(this.elapsed*3),22)*(this.width+200)-100+this.elapsed*110)%(this.width+200)-100,y=(seededHash(i,5,31)*this.height+this.elapsed*(260+i%70))%this.height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+17);ctx.stroke();}ctx.restore();}

    drawThreatArrows(ctx){
      if(!this.zombies.length)return;const vision=this.visibility?.frame?.(),sectors=[0,0,0,0],step=Math.max(1,Math.floor(this.zombies.length/300));for(let i=0;i<this.zombies.length;i+=step){const z=this.zombies[i];if(!vision?.canSeeLocal(z))continue;const dx=z.x-this.camera.x,dy=z.y-this.camera.y;if(Math.abs(dx)<this.width/this.camera.zoom/2&&Math.abs(dy)<this.height/this.camera.zoom/2)continue;if(Math.abs(dx)>Math.abs(dy))sectors[dx>0?1:3]++;else sectors[dy>0?2:0]++;}
      const compact=this.isCompactViewport(),markerRadius=14,clearance=10,centerX=this.width/2;
      const hudSafe=this.hud135?.safeFrame?.(),topbarBottom=hudSafe?hudSafe.top-markerRadius-clearance:document.getElementById('topbar').getBoundingClientRect().bottom || (compact?88:72);
      let top=topbarBottom+markerRadius+clearance;
      // Keep the north marker outside the actual HUD, including safe areas and expanded touch panels.
      for(const panel of hudSafe?[]:[this.ui.leftPanel,this.ui.rightPanel]){
        if(panel.classList.contains('hidden'))continue;const rect=panel.getBoundingClientRect();
        if(rect.left<centerX+markerRadius&&rect.right>centerX-markerRadius&&rect.top<top+markerRadius)top=Math.max(top,rect.bottom+markerRadius+clearance);
      }
      top=Math.min(top,this.height-markerRadius-clearance);
      const safe=this.hud135?.safeFrame?.(),left=safe?.left??(compact?24:Math.min(312,this.width*.22)),right=safe?.right??(compact?this.width-24:this.width-Math.min(325,this.width*.23)),bottom=safe?.bottom??(compact?this.height-176:this.height-78),middleX=safe?(left+right)/2:centerX,middleY=safe?(safe.top+bottom)/2:this.height/2,pos=[{x:middleX,y:safe?.top??top,r:-Math.PI/2},{x:right,y:middleY,r:0},{x:middleX,y:bottom,r:Math.PI/2},{x:left,y:middleY,r:Math.PI}];ctx.save();for(let i=0;i<4;i++){if(!sectors[i])continue;ctx.save();ctx.translate(pos[i].x,pos[i].y);ctx.rotate(pos[i].r);ctx.fillStyle='rgba(197,83,73,.9)';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-5,0);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();
    }

    drawCrosshair(ctx){
      if(this.state!=='playing'||this.selectedBuild||this.rallyPlacement||globalThis.matchMedia?.('(pointer: coarse)')?.matches)return;const x=this.input.mouseX,y=this.input.mouseY,gap=this.player.weapon==='shotgun'?8:5;ctx.save();ctx.strokeStyle=this.player.reload>0?'rgba(216,173,77,.78)':'rgba(235,240,235,.88)';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(x-gap-8,y);ctx.lineTo(x-gap,y);ctx.moveTo(x+gap,y);ctx.lineTo(x+gap+8,y);ctx.moveTo(x,y-gap-8);ctx.lineTo(x,y-gap);ctx.moveTo(x,y+gap);ctx.lineTo(x,y+gap+8);ctx.stroke();ctx.fillStyle=this.player.reload>0?'#d8ad4d':'#edf1ec';ctx.fillRect(x-1,y-1,2,2);ctx.restore();
    }

    renderMinimap(){if(this.state!=='playing')return;const ctx=this.mctx,w=this.minimap.width,h=this.minimap.height,sx=w/WORLD_SIZE,sy=h/WORLD_SIZE;ctx.clearRect(0,0,w,h);ctx.fillStyle='#151b17';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.035)';for(let i=0;i<=8;i++){const x=i/8*w,y=i/8*h;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.fillStyle='rgba(125,130,120,.08)';ctx.fillRect((WORLD_SIZE/2-430)*sx,(WORLD_SIZE/2-320)*sy,860*sx,640*sy);for(const b of this.world.buildings.values()){if(b.dead)continue;ctx.fillStyle=b.type==='core'?'#d2a84a':b.def.defense?'#89958f':'#687a68';ctx.fillRect(b.left*sx,b.top*sy,Math.max(1,b.w*TILE*sx),Math.max(1,b.h*TILE*sy));}this.contentUI?.drawMinimap(ctx,sx,sy);ctx.fillStyle='#b64f45';const vision=this.visibility?.frame?.(),step=this.zombies.length>400?2:1;for(let i=0;i<this.zombies.length;i+=step){const z=this.zombies[i];if(vision?.canSeeLocal(z))ctx.fillRect(z.x*sx,z.y*sy,1.5,1.5);}ctx.fillStyle='#85a975';for(const u of this.units)if(!u.dead)ctx.fillRect(u.x*sx-1,u.y*sy-1,2,2);ctx.fillStyle='#f2d16d';ctx.beginPath();ctx.arc(this.player.x*sx,this.player.y*sy,3,0,Math.PI*2);ctx.fill();const hw=this.width/this.camera.zoom/2,hh=this.height/this.camera.zoom/2;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.strokeRect((this.camera.x-hw)*sx,(this.camera.y-hh)*sy,hw*2*sx,hh*2*sy);}
  }

  try {
    const game = new Game();
    game.art = globalThis.DeadwallArt?.create();
    globalThis.DEADWALL = game;
  } catch (error) {
    console.error('DEADWALL failed to start:', error);
    const panel = document.createElement('pre');
    panel.style.cssText = 'position:fixed;inset:20px;z-index:9999;overflow:auto;padding:24px;background:#170e0d;color:#ffd5cf;border:1px solid #8f4038;white-space:pre-wrap;font:14px/1.5 monospace';
    panel.textContent = `ERREUR DE DÉMARRAGE DEADWALL\n\n${error && error.stack ? error.stack : String(error)}`;
    document.body.appendChild(panel);
  }
})();


/* DEADWALL OPERATIONS 1.1 — BEGIN */
/* Appended to src/game.js. Hooks retain the original simulation and all UI modules. */
(function installOperationsRuntime(root){
  'use strict';
  const g=root.DEADWALL,C=root.DeadwallCore,O=root.DeadwallOperations;
  if(!g||!C||!O)throw new Error('Le moteur DEADWALL doit être chargé avant les sorties.');
  if(g.fieldOperations)return;
  let worldRef=g.world,pendingRestore=null,engine=new O.Engine(),capacityPlayer=null,baseCapacity=36,lastCapacity=null;
  let ui=null,pendingAbort=null;
  const wrap=(name,fn)=>{const original=g[name];if(typeof original!=='function')throw new Error('Interface DEADWALL absente : '+name);g[name]=function(...args){return fn.call(this,original.bind(this),...args);};};
  const sectorNames={housing:'MAISONS',market:'ARCADES',aid:'CAMP DES VEILLEURS',industry:'COUR DES CITERNES',transit:'TERMINUS',checkpoint:'BARRAGE'};
  const tierName=tier=>C.CITY_TIERS[tier]?.name||String(tier);
  const text=(node,value)=>{if(node&&node.textContent!==String(value))node.textContent=String(value);};
  const message=result=>{
    if(!result?.event)return result;
    g.notify(result.reason,result.event==='failed'?'danger':'good');
    if(result.event!=='failed')g.audio?.ui();
    if(ui)text(ui.status,result.reason);
    if(result.event==='loaded'&&g.stats&&Number.isFinite(g.stats.gathered))g.stats.gathered=Math.min(1e15,g.stats.gathered+O.sum(O.get(result.id).cargo));
    if(result.event==='delivered'){
      g.research.insight=result.insight;g.morale=result.morale;
      if(Number.isFinite(g.depositedResources))g.depositedResources=Math.min(1e12,g.depositedResources+O.sum(O.get(result.id).cargo));
      g.refreshMetrics(true);
    }
    syncCapacity();
    if(result.event==='started'||result.event==='failed'||result.event==='loaded'||result.event==='delivered')g.save(false);
    return result;
  };
  function ensure(){
    if(worldRef!==g.world){worldRef=g.world;engine=new O.Engine(pendingRestore||undefined);pendingRestore=null;capacityPlayer=null;lastCapacity=null;pendingAbort=null;}
    syncCapacity();return engine;
  }
  function syncCapacity(){
    const p=g.player;if(!p)return;
    if(capacityPlayer!==p){capacityPlayer=p;baseCapacity=Number.isFinite(p.carryCapacity)?p.carryCapacity:36;lastCapacity=null;}
    else if(lastCapacity!==null&&p.carryCapacity!==lastCapacity)baseCapacity=p.carryCapacity;
    const cargo=engine.cargoMass();p.carryCapacity=Math.max(0,baseCapacity-cargo);lastCapacity=p.carryCapacity;
  }
  function siteFor(item){return item?(g.world.sites||[]).find(site=>site.theme===item.theme)||null:null;}
  function clearLine(from,to){
    const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/12));
    for(let i=1;i<=steps;i++){
      const x=from.x+(to.x-from.x)*i/steps,y=from.y+(to.y-from.y)*i/steps;
      if(!g.friendlyPositionClear(from,x,y))return false;
    }
    return true;
  }
  function context(item=ensure().current()){
    ensure();const p=g.player,core=g.core(),site=siteFor(item),playing=g.state==='playing'&&!g.gameOver;
    let atSite=false,accessible=false;
    if(site){
      // The dossier remains interactable around its centre even after a building covers the marker.
      const points=[site,...Array.from({length:8},(_,i)=>({x:site.x+Math.cos(i*Math.PI/4)*56,y:site.y+Math.sin(i*Math.PI/4)*56}))];
      atSite=Math.hypot(p.x-site.x,p.y-site.y)<=O.RULES.radius+56;
      accessible=atSite&&points.some(point=>Math.hypot(p.x-point.x,p.y-point.y)<=O.RULES.radius&&clearLine(p,point));
    }
    return {
      resources:g.resources,storage:g.storage,insight:g.research.insight,insightMax:C.RESEARCH_INSIGHT_MAX,morale:g.morale,
      tier:g.tier.id,wave:g.wave,dead:p.dead||p.health<=0,canCommand:playing&&g.canIssueCommand(),running:playing&&!g.paused&&!g.activeOverlay,
      atBase:Boolean(core&&g.workerCanWorkAt(p,core,O.RULES.baseRadius)),siteAvailable:Boolean(site),atSite,accessible,
      secure:Boolean(site&&!g.zombies.some(z=>!z.dead&&z.health>0&&(Math.hypot(z.x-site.x,z.y-site.y)<=O.RULES.safeRadius||Math.hypot(z.x-p.x,z.y-p.y)<=O.RULES.safeRadius))),
      hasBuilding:id=>g.world.has(id),capacity:baseCapacity,normalCarry:C.bagTotal(p.carry),action:g.input.keys.has('KeyE'),site
    };
  }
  function buildLocks(){
    ensure();if(!g.ui.buildList)return;
    for(const button of g.ui.buildList.children){
      const id=button.dataset.buildId;if(!Object.hasOwn(O.BLUEPRINTS,id))continue;
      const def=C.BUILDINGS[id],available=engine.canBuild(id);
      button.disabled=!available||def.unlockTier>g.tier.id||Boolean(def.requires&&!g.world.has(def.requires));
      button.dataset.fieldOpsLocked=String(!available);
      button.title=available?def.description:'Plan requis : terminez « '+O.get(O.BLUEPRINTS[id]).name+' ».';
    }
  }
  wrap('serialize',(original,...args)=>{ensure();return {...original(...args),fieldOps:engine.snapshot()};});
  wrap('restoreSave',(original,input)=>{
    const data=root.DeadwallSave.validate(input),before=g.world;
    pendingRestore=O.normalize(data.fieldOps);
    try{return original(data);}finally{if(g.world!==before)ensure();pendingRestore=null;}
  });
  wrap('startNew',(original,...args)=>{const result=original(...args);ensure();refreshUI();return result;});
  wrap('update',(original,dt)=>{
    ensure();if(Number.isFinite(dt)&&dt>0)message(engine.tick(Math.min(dt,O.RULES.maxStep),context()));
    const result=original(dt);
    if(engine.current()&&(g.player.dead||g.player.health<=0))message(engine.fail('downed'));
    syncCapacity();return result;
  });
  wrap('updateInteraction',(original,dt)=>{
    ensure();const item=engine.current(),ctx=context(item);
    if(!item||!ctx.running||ctx.dead||g.selectedBuild||g.rallyPlacement)return original(dt);
    const a=engine.state.active;
    if(a.phase==='returning'&&ctx.atBase){
      const status=engine.deliveryStatus(ctx);g.interactionText=status.reason;
      if(ctx.action&&status.ok)message(engine.deliver(ctx));
      return;
    }
    if(a.phase!=='returning'&&ctx.atSite){
      const status=engine.workStatus(ctx);g.interactionText=status.reason+(status.ok?' '+Math.floor(a.work)+' / '+item.seconds+' s':'');
      if(ctx.action&&status.ok&&Number.isFinite(dt)&&dt>0)message(engine.work(Math.min(dt,O.RULES.maxStep),ctx));
      return;
    }
    return original(dt);
  });
  wrap('placeOne',(original,type,...args)=>{
    ensure();if(!engine.canBuild(type)){g.notify('Plan requis : '+O.get(O.BLUEPRINTS[type]).name+'.','danger');return false;}
    return original(type,...args);
  });
  wrap('refreshBuildMenu',(original,...args)=>{const result=original(...args);buildLocks();return result;});
  wrap('refreshBuildAffordability',(original,...args)=>{const result=original(...args);buildLocks();return result;});
  wrap('updateUI',(original,...args)=>{ensure();const result=original(...args);refreshUI();return result;});
  wrap('drawGround',(original,ctx,view)=>{
    const result=original(ctx,view);ensure();const item=engine.current(),site=siteFor(item);
    if(!site||engine.state.active.phase==='returning'||g.state!=='playing')return result;
    const radius=O.RULES.radius;
    if(site.x+radius<view.left||site.x-radius>view.right||site.y+radius<view.top||site.y-radius>view.bottom)return result;
    ctx.save();ctx.strokeStyle='#dabb70';ctx.lineWidth=2/g.camera.zoom;ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(site.x,site.y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(204,163,77,.10)';ctx.fill();ctx.fillStyle='#f3d995';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    ctx.fillText('SORTIE D-17',site.x,site.y-radius-9);ctx.restore();return result;
  });
  wrap('drawThreatArrows',(original,...args)=>{
    const result=original(...args);ensure();const item=engine.current();if(!item||g.state!=='playing'||g.paused||g.gameOver)return result;
    const point=engine.state.active.phase==='returning'?g.core():siteFor(item);if(!point)return result;
    const sx=(point.x-g.camera.x)*g.camera.zoom+g.width/2,sy=(point.y-g.camera.y)*g.camera.zoom+g.height/2;
    if(sx>64&&sx<g.width-64&&sy>115&&sy<g.height-100)return result;
    const dx=sx-g.width/2,dy=sy-g.height/2,margin=70;
    const scale=Math.min((g.width/2-margin)/Math.max(1,Math.abs(dx)),(g.height/2-120)/Math.max(1,Math.abs(dy)),1);
    if(scale<=0)return result;
    const x=g.width/2+dx*scale,y=g.height/2+dy*scale,ctx=g.ctx;
    ctx.save();ctx.setTransform(g.dpr,0,0,g.dpr,0,0);ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle='#e4c982';
    ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-8,-7);ctx.lineTo(-5,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.restore();return result;
  });
  if(g.art?.drawBuilding){
    const draw=g.art.drawBuilding.bind(g.art);
    g.art.drawBuilding=function(ctx,b,world){
      if(!Object.hasOwn(O.BUILDINGS,b.type))return draw(ctx,b,world);
      const d=b.def,w=b.w*32,h=b.h*32;
      ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(-w/2+5,-h/2+9,w,h);
      if(b.type==='perimeterLight'){
        ctx.fillStyle='#444d48';ctx.fillRect(-11,0,22,12);ctx.fillStyle='#95988a';ctx.fillRect(-3,-22,6,30);
        ctx.fillStyle='#363f3c';ctx.fillRect(-13,-31,26,14);ctx.fillStyle=b.powered?'#eadfb3':'#747973';ctx.fillRect(-10,-28,20,8);
      }else{
        ctx.fillStyle=d.color;ctx.fillRect(-w/2,-h/2+6,w,h);ctx.fillStyle=d.roof;ctx.fillRect(-w/2-2,-h/2,w+4,h-7);
        ctx.strokeStyle='rgba(20,30,26,.4)';ctx.lineWidth=2;for(let y=-h/2+8;y<h/2-8;y+=10){ctx.beginPath();ctx.moveTo(-w/2,y);ctx.lineTo(w/2,y);ctx.stroke();}
        if(b.type==='fieldKitchen'){ctx.fillStyle='#3e4944';ctx.fillRect(-w*.25,-h*.28,w*.5,h*.38);ctx.fillStyle='#bc9767';ctx.fillRect(-w*.23,-h*.25,w*.46,5);ctx.fillStyle='#434d47';ctx.fillRect(w*.23,-h*.55,11,22);}
        if(b.type==='dressingWorkshop'){ctx.fillStyle='#e5ddd0';ctx.fillRect(-6,-22,12,35);ctx.fillRect(-18,-11,36,12);}
        if(b.type==='recoveryBench'){ctx.fillStyle='#414b48';ctx.fillRect(-w*.32,-h*.25,w*.65,h*.43);ctx.strokeStyle='#d0b96e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-w*.27,-h*.15);ctx.lineTo(w*.2,h*.08);ctx.stroke();}
        ctx.fillStyle='#283631';ctx.fillRect(-w/2+5,h/2-9,20,10);
      }
      ctx.restore();return true;
    };
  }
  function start(id){
    const item=O.get(id),ctx=context(item),result=engine.start(id,ctx);pendingAbort=null;
    if(!result.ok&&ui)text(ui.status,result.reason);
    message(result);buildLocks();refreshUI();return result;
  }
  function abort(id){const result=engine.abort(id,context());pendingAbort=null;message(result);refreshUI();return result;}
  function openBoard(){g.showCommand?.(true,'field');ui?.show('operations');}
  function refreshUI(){
    if(!ui)return;ensure();const item=engine.current(),active=engine.state.active,playing=g.state==='playing'&&!g.gameOver;
    ui.hud.classList.toggle('hidden',!playing);ui.active.classList.toggle('hidden',!item);ui.empty.classList.toggle('hidden',Boolean(item));
    const ordinary=C.bagTotal(g.player.carry),mass=engine.cargoMass();
    if(g.ui.carryValue&&mass)text(g.ui.carryValue,Math.floor(ordinary+mass)+'/'+baseCapacity+' · sortie '+mass);
    if(item){
      const point=active.phase==='returning'?g.core():siteFor(item),distance=point?Math.ceil(Math.hypot(point.x-g.player.x,point.y-g.player.y)):0;
      const phase=active.phase==='returning'?'RETOUR AU CENTRE':active.phase==='working'?'PRÉPARATION':'REJOINDRE LE SITE';
      text(ui.hudTitle,item.name);text(ui.hudDetail,phase+' · '+distance+' u · '+C.formatTime(active.remaining));
      text(ui.activeTitle,item.name);text(ui.activeDetail,phase+' — '+Math.floor(active.work)+' / '+item.seconds+' s — '+C.formatTime(active.remaining)+' restantes');
      ui.progress.max=item.seconds;ui.progress.value=active.work;
      text(ui.cargo,active.phase==='returning'?'Cargaison portée : '+C.resourceText(item.cargo)+' · '+mass+' places dans le sac.':'Gardez '+O.sum(item.cargo)+' places libres dans le sac.');
    }else{text(ui.hudTitle,'Opérations extérieures');text(ui.hudDetail,engine.state.completed.length+' / '+O.CONTRACTS.length+' livraisons');}
    if(pendingAbort&&(g.activeOverlay!==g.ui.commandModal||ui.panel.classList.contains('hidden')))pendingAbort=null;
    ui.abortReview.classList.toggle('hidden',!pendingAbort||pendingAbort!==active?.id);
    ui.abortButton.setAttribute('aria-expanded',String(Boolean(pendingAbort&&pendingAbort===active?.id)));
    if(!ui.panel.classList.contains('hidden')){
      for(const def of O.CONTRACTS){
        const card=ui.cards.get(def.id),completed=engine.state.completed.includes(def.id),status=engine.availability(def.id,context(def));
        card.card.dataset.status=completed?'complete':active?.id===def.id?'active':status.ok?'available':'locked';
        card.button.disabled=!status.ok;card.button.title=status.reason;
        text(card.button,completed?'LIVRAISON TERMINÉE':active?.id===def.id?'EN COURS':'ENGAGER LA SORTIE');
        let reason=status.reason.replace('Palier '+def.tier+' requis.','Palier '+tierName(def.tier)+' requis.');if(def.requires)reason=reason.replace(def.requires,C.BUILDINGS[def.requires]?.name||def.requires);
        text(card.reason,reason);text(card.attempts,(engine.state.failures[def.id]||0)+' échec(s) · livraison unique');
      }
      text(ui.summary,engine.state.completed.length+' / '+O.CONTRACTS.length+' contrats livrés · '+Object.keys(O.BLUEPRINTS).filter(id=>engine.canBuild(id)).length+' / 4 plans récupérés');
    }
    if(!ui.logisticsPanel.classList.contains('hidden')){
      const report=O.logistics({resources:g.resources,storage:g.storage,population:g.population,buildings:[...g.world.buildings.values()],hasResearch:id=>g.hasResearch(id),activeCrisis:g.activeCrisis,siegeFuelUse:g.siege?.pumpFuelPerMinute()||0});
      for(const row of report.rows){const cells=ui.rows.get(row.key);text(cells[0],Math.floor(row.stock)+' / '+row.capacity);text(cells[1],row.production.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}));text(cells[2],row.consumption.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}));text(cells[3],(row.net>=0?'+':'')+row.net.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}));cells[3].dataset.negative=String(row.net<0);}
      text(ui.logisticsStatus,report.unpowered+' équipement(s) sans allocation complète · '+report.pausedIndustry+' industrie(s) arrêtée(s). Les tirs, récoltes, chantiers et variations futures de stocks ne sont pas projetés.');
    }
  }
  function mount(){
    if(ui||!root.document)return;
    const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
    const element=(tag,content,cls)=>{const node=document.createElement(tag);if(content!==undefined)node.textContent=content;if(cls)node.className=cls;return node;};
    const button=(label,fn)=>{const b=element('button',label);b.type='button';b.addEventListener('click',fn);return b;};
    const style=element('style');style.textContent=`
      .ops-board{max-width:1100px;margin:0 auto}.ops-intro{color:#bccbc1;line-height:1.55;max-width:850px}.ops-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,285px),1fr));gap:12px;margin-top:16px}.ops-card{border:1px solid #45584d;background:linear-gradient(140deg,#172920,#101b16);padding:17px;border-radius:8px;min-width:0;display:flex;flex-direction:column;gap:10px}.ops-card h3{font-size:18px;margin:0;color:#ece5cf}.ops-card p{margin:0;line-height:1.5}.ops-card small{color:#b4c6b9;letter-spacing:.06em}.ops-card button{margin-top:auto;min-height:42px}.ops-card[data-status=complete]{border-color:#7fac8c}.ops-card[data-status=active]{border-color:#d2b66c}.ops-card details{border-top:1px solid #43564a;padding-top:8px}.ops-card summary{cursor:pointer;color:#dcc992;min-height:30px}.ops-card details p{padding-top:8px;color:#bdc9c1}.ops-reward{color:#dfc789}.ops-note{font-size:12px;color:#b9c9be}.ops-active{padding:18px;border:1px solid #c6aa68;background:#223027;border-radius:8px;margin:14px 0}.ops-active h3{margin:0 0 8px}.ops-active progress{width:100%;height:12px;margin:10px 0;accent-color:#d1b771}.ops-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ops-actions button{min-height:40px}.ops-abort{margin-top:10px;border-left:3px solid #d09076;padding:10px}.ops-abort p{margin:0 0 8px}.ops-live{min-height:22px;color:#ead191;margin:12px 0}.ops-hud{pointer-events:auto;border:1px solid #67785f;background:rgba(14,26,20,.94);padding:9px 11px;margin:8px 0;border-radius:5px}.ops-hud button{border:0;background:none;padding:0;font:inherit;color:#ded3af;text-align:left;width:100%;cursor:pointer}.ops-hud small{display:block;margin-top:5px;color:#bcccba;font-size:11px}.ops-ledger{overflow-x:auto}.ops-ledger table{border-collapse:collapse;width:100%;min-width:470px;font-size:14px}.ops-ledger td,.ops-ledger th{border-bottom:1px solid #415447;padding:12px 9px;text-align:right}.ops-ledger th:first-child,.ops-ledger td:first-child{text-align:left}.ops-ledger th{color:#d8cb9c}.ops-ledger [data-negative=true]{color:#efb196}.ops-ledger [data-negative=false]{color:#b4d5af}.ops-board button:focus-visible,.ops-hud button:focus-visible,.ops-board summary:focus-visible{outline:3px solid #f2d984;outline-offset:3px}.high-contrast .ops-card{background:#0a170f;color:#fff}.ops-board .hidden,.ops-hud.hidden{display:none!important}@media(max-width:600px){.ops-card{padding:13px}.ops-hud{padding:7px;margin:5px 0}.ops-hud small{font-size:10px}.ops-ledger td,.ops-ledger th{padding:9px 6px}}
    `;document.head.appendChild(style);
    const panel=element('section',undefined,'ops-board hidden'),logisticsPanel=element('section',undefined,'ops-board hidden');panel.id='field-operations';logisticsPanel.id='field-logistics';field.append(panel,logisticsPanel);
    const oldSections=[...field.children].filter(n=>n.tagName==='SECTION'&&n!==panel&&n!==logisticsPanel);
    const show=id=>{
      for(const section of oldSections)section.classList.add('hidden');panel.classList.toggle('hidden',id!=='operations');logisticsPanel.classList.toggle('hidden',id!=='logistics');
      for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.fieldView===id));
      refreshUI();
    };
    const opButton=button('SORTIES',()=>show('operations')),logButton=button('LOGISTIQUE',()=>show('logistics'));opButton.dataset.fieldView='operations';logButton.dataset.fieldView='logistics';
    opButton.setAttribute('aria-controls',panel.id);logButton.setAttribute('aria-controls',logisticsPanel.id);opButton.setAttribute('aria-pressed','false');logButton.setAttribute('aria-pressed','false');nav.append(opButton,logButton);
    for(const b of nav.querySelectorAll('button'))if(!['operations','logistics'].includes(b.dataset.fieldView))b.addEventListener('click',()=>{panel.classList.add('hidden');logisticsPanel.classList.add('hidden');opButton.setAttribute('aria-pressed','false');logButton.setAttribute('aria-pressed','false');});
    panel.append(element('small','D-17 / AU-DELÀ DES ENCEINTES'),element('h2','Sorties de ravitaillement'),element('p','Préparez une seule sortie à la fois au centre. Rejoignez le secteur, sécurisez le marqueur, maintenez ACTION / E, puis rapportez le lot. La préparation est payée au départ. Une chute du commandant, un abandon ou un retour trop tardif fait perdre le matériel engagé.','ops-intro'));
    const summary=element('p','','ops-reward'),status=element('p','','ops-live');status.id='opsStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(summary,status);
    const empty=element('p','Aucune sortie active. Choisissez un contrat accessible ci-dessous.','ops-intro');panel.appendChild(empty);
    const active=element('article',undefined,'ops-active hidden'),activeTitle=element('h3'),activeDetail=element('p'),progress=element('progress'),cargo=element('p');progress.setAttribute('aria-label','Préparation de la cargaison');
    const actions=element('div',undefined,'ops-actions'),abortReview=element('div',undefined,'ops-abort hidden');
    const cancel=button('ABANDONNER…',()=>{pendingAbort=ensure().state.active?.id||null;refreshUI();ui.abortConfirm.focus();});cancel.id='opsAbort';cancel.setAttribute('aria-controls','opsAbortReview');
    actions.append(button('RETOURNER SUR LE TERRAIN',()=>g.showCommand?.(false)),cancel);
    abortReview.id='opsAbortReview';abortReview.append(element('p','Le coût de préparation et la cargaison éventuelle seront perdus. Aucun bâtiment ni autre stock ne sera supprimé.'));
    const abortConfirm=button('CONFIRMER LA PERTE',()=>{const id=pendingAbort;if(id)abort(id);cancel.focus();});abortConfirm.id='opsAbortConfirm';
    abortReview.append(abortConfirm,button('GARDER LA SORTIE',()=>{pendingAbort=null;refreshUI();cancel.focus();}));active.append(activeTitle,activeDetail,progress,cargo,actions,abortReview);panel.appendChild(active);
    const grid=element('div',undefined,'ops-grid'),cards=new Map();panel.appendChild(grid);
    for(const item of O.CONTRACTS){
      const card=element('article',undefined,'ops-card');card.dataset.contract=item.id;
      card.append(element('small',sectorNames[item.theme]+' · VAGUE '+item.wave+' · '+tierName(item.tier)),element('h3',item.name));
      const details=element('details'),summaryEl=element('summary','Lire le briefing');details.append(summaryEl,element('p',item.briefing));card.appendChild(details);
      card.append(element('p','PRÉPARATION · '+C.resourceText(item.cost),'ops-note'),element('p',item.seconds+' s de travail · retour avant '+C.formatTime(item.timeLimit)+' · '+O.sum(item.cargo)+' places de sac','ops-note'));
      card.append(element('p','LIVRAISON · '+C.resourceText(item.cargo)+' · +'+item.insight+' analyse · +'+item.morale+' moral','ops-reward'));
      if(item.unlock)card.append(element('p','PLAN RÉCUPÉRÉ · '+O.BUILDINGS[item.unlock].name,'ops-reward'));
      const reason=element('p','','ops-note'),attempts=element('small'),b=button('ENGAGER LA SORTIE',()=>start(item.id));b.dataset.startContract=item.id;card.append(reason,attempts,b);grid.appendChild(card);cards.set(item.id,{card,reason,attempts,button:b});
    }
    logisticsPanel.append(element('small','D-17 / SERVICES URBAINS'),element('h2','Bilan de production'),element('p','Débits instantanés convertis par minute, avec l’allocation électrique et les stocks actuels. Il ne s’agit pas d’une prédiction à une minute : une réserve peut saturer ou s’épuiser, et plusieurs industries peuvent partager les mêmes intrants.','ops-intro'));
    const ledger=element('div',undefined,'ops-ledger'),table=element('table'),thead=element('thead'),tr=element('tr');for(const label of ['Ressource','Stock','Produit/min','Consommé/min','Solde/min'])tr.appendChild(element('th',label));thead.appendChild(tr);table.appendChild(thead);
    const tbody=element('tbody'),rows=new Map();for(const key of O.KEYS){const row=element('tr'),heading=element('th',C.RESOURCE_META[key].label);heading.scope='row';row.appendChild(heading);const cells=Array.from({length:4},()=>element('td'));row.append(...cells);tbody.appendChild(row);rows.set(key,cells);}table.appendChild(tbody);ledger.appendChild(table);logisticsPanel.appendChild(ledger);
    const logisticsStatus=element('p','','ops-intro');logisticsPanel.appendChild(logisticsStatus);
    const hud=element('section',undefined,'ops-hud hidden'),hudTitle=element('strong'),hudDetail=element('small'),hudButton=button('',openBoard);hudButton.id='fieldOperationsButton';hudButton.append(hudTitle,hudDetail);hud.appendChild(hudButton);g.ui.rightPanel?.appendChild(hud);
    ui={panel,logisticsPanel,show,cards,status,summary,active,empty,activeTitle,activeDetail,progress,cargo,abortReview,abortConfirm,abortButton:cancel,hud,hudTitle,hudDetail,rows,logisticsStatus};
    refreshUI();buildLocks();
  }
  g.fieldOperations=Object.freeze({start,abort,playerDown:()=>{ensure();const result=engine.fail('downed');syncCapacity();return result;},context,snapshot:()=>ensure().snapshot(),canBuild:id=>ensure().canBuild(id),open:openBoard,refresh:refreshUI,catalogue:O.CONTRACTS,version:'1.1.0-candidate.1'});
  ensure();
  if(root.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL OPERATIONS 1.1 — END */


/* DEADWALL TERRITORIES 1.2 — BEGIN */
/* Appended after the 1.1 adapter. The original game remains the host simulation. */
(function installTerritoryRuntime(root){
 'use strict';
 const g=root.DEADWALL,C=root.DeadwallCore,T=root.DeadwallTerritories,R=T?.RULES;
 if(!g||!C||!T)throw new Error('DEADWALL et le catalogue des territoires sont requis.');
 if(g.territories)return;
 let engine=new T.Engine(),worldRef=g.world,pendingRestore=null,selected='housing',ui=null,pendingEvacuation=null;
 let routes=new Map(),repathBudget=R.routeBudget,inspectionTimer=0,supplyCooldown=0,autoCursor=0;
 let reports=new Map(),contexts=new Map(),commandMessage='',showMarker=false;
 const wrap=(name,fn)=>{if(typeof g[name]!=='function')throw new Error('Interface de territoires absente : '+name);const original=g[name];g[name]=function(...args){return fn.call(this,original.bind(this),...args);};};
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const live=b=>Boolean(b&&!b.dead&&b.health>0);
 const running=()=>g.state==='playing'&&!g.gameOver&&!g.paused&&!g.activeOverlay;
 const notify=r=>{
   if(!r)return r;
   if(r.reason)commandMessage=r.reason;
   if(r.event){g.notify(r.reason,['lost','evacuated','truckLost'].includes(r.event)?'danger':'good');g.audio?.ui();}
   return r;
 };
 function site(id){return (g.world.sites||[]).find(s=>s.theme===id)||null;}
 function post(id){const s=engine.sector(id);const b=s?g.world.buildings.get(s.postId):null;return live(b)&&b.completed&&b.type==='sectorPost'?b:null;}
 function ensure(){
   if(worldRef!==g.world){worldRef=g.world;engine=new T.Engine(pendingRestore||undefined);pendingRestore=null;routes.clear();reports.clear();contexts.clear();inspectionTimer=0;supplyCooldown=0;pendingEvacuation=null;selected='housing';showMarker=false;}
   return engine;
 }
 function nearSite(point,max=R.buildRadius){let best=null,dist=max;for(const candidate of g.world.sites||[]){const d=distance(point,candidate);if(d<=dist&&Object.hasOwn(T.BY_ID,candidate.theme)){best=candidate;dist=d;}}return best;}
 function straight(entity,target){
   const n=Math.max(1,Math.ceil(distance(entity,target)/7));
   for(let i=1;i<=n;i++)if(!g.friendlyPositionClear(entity,entity.x+(target.x-entity.x)*i/n,entity.y+(target.y-entity.y)*i/n))return false;
   return true;
 }
 function accessible(entity,b,radius=R.interactionRadius){return Boolean(b&&distance(entity,b)<=radius&&g.workerCanWorkAt(entity,b,radius));}
 function fallback(){const b=g.world.buildings.get(engine.state.fallbackId);return live(b)&&b.completed&&b.type==='fallbackRedoubt'?b:g.core();}
 function reconcile(){
   ensure();
   const found=new Map();
   for(const b of g.world.buildings.values())if(live(b)&&b.type==='sectorPost'){
     const target=nearSite(b);if(target&&(!found.has(target.theme)||b.id<found.get(target.theme).id))found.set(target.theme,b);
   }
   for(const d of T.SECTORS){
     const s=engine.sector(d.id),b=found.get(d.id);
     if(s.postId!==null&&s.postId!==(b?.id??null)&&['held','contested'].includes(s.status))notify(engine.lose(d.id));
     engine.post(d.id,b?.id??null);
     const worker=g.units.find(u=>u.id===s.workerId);
     if(s.workerId!==null&&(!live(worker)||worker.kind!=='worker'))s.workerId=null;
   }
   engine.state.withdrawing=engine.state.withdrawing.filter(id=>g.units.some(u=>u.id===id&&live(u)&&u.kind==='worker'));
   const redoubt=g.world.buildings.get(engine.state.fallbackId);if(engine.state.fallbackId!==null&&(!live(redoubt)||!redoubt.completed||redoubt.type!=='fallbackRedoubt'))engine.state.fallbackId=null;
 }
 function context(id){
   const point=site(id),b=post(id),p=g.player,s=engine.sector(id);let enemies=0,innerEnemies=0,defenders=0;
   if(point){
     for(const z of g.zombies)if(live(z)){
       if(distance(z,b||point)<=R.hostileRadius)enemies++;
       if(distance(z,b||point)<=R.innerRadius&&(!g.hostileLineClear||g.hostileLineClear(z,b||point)))innerEnemies++;
     }
     if(live(p)&&accessible(p,b||point,R.innerRadius))defenders++;
     for(const u of g.units)if(live(u)&&u.kind==='soldier'&&accessible(u,b||point,R.innerRadius))defenders++;
   }
   const worker=g.units.find(u=>u.id===s?.workerId);
   return{running:running(),canCommand:g.canIssueCommand(),dead:!live(p),carry:p.carry,
     resources:g.resources,storage:g.storage,atPost:accessible(p,b),accessible:accessible(p,b),
     operational:Boolean(b),powered:Boolean(b?.powered),secure:enemies===0,enemies,innerEnemies,defenders,
     workerPresent:Boolean(g.workerOrder!=='retreat'&&live(worker)&&accessible(worker,b,R.workerRadius)),post:b,site:point};
 }
 function markOffline(){
   for(const b of g.world.buildings.values()){
     const near=nearSite(b,R.radius),s=near?engine.sector(near.theme):null;
     // Existing production is only suspended after the first real capture of that district.
     // Walls, housing, storage and defensive fire are not removed by a UI state.
     b.territoryOffline=Boolean(b.def?.production&&s?.everHeld&&['lost','evacuated'].includes(s.status));
   }
 }
 function updateAssignedUnit(u,dt){
   ensure();if(u.kind!=='worker'||!live(u))return false;
   let target=null,evacuating=engine.state.withdrawing.includes(u.id);
   const def=T.SECTORS.find(d=>engine.sector(d.id).workerId===u.id);
   if(!def&&!evacuating)return false;
   if(def&&g.workerOrder==='retreat'){engine.unassign(def.id);evacuating=true;}
   if(evacuating){target=fallback();u.state='flee';}
   else{
     const b=post(def.id);if(!b){engine.unassign(def.id);target=fallback();evacuating=true;}
     else{
       const danger=g.nearestZombie?.(u.x,u.y,105);
       target=danger?fallback():b;u.state=danger?'flee':'move';
     }
   }
   if(!target)return true;
   // Use the real worker navigation and storage rules. No teleport and no removal from g.units.
   if(u.carry>0&&u.carryType){const core=g.core();if(core)g.depositWorker(u,core,dt);return true;}
   const radius=evacuating?42:54;
   if(!accessible(u,target,radius))g.moveUnitToward(u,target,dt,u.speed*(evacuating?1.15:1));
   else if(evacuating)engine.state.withdrawing=engine.state.withdrawing.filter(id=>id!==u.id);
   else u.state='idle';
   return true;
 }
 function routeFor(truck,target,force=false){
   if(!target)return null;
   const destination=g.fieldcraft?g.fieldcraft.service({x:truck.x,y:truck.y,radius:R.truckRadius},target):target;if(!destination)return null;
   let route=routes.get(truck.id),revision=g.world.navigationVersion||0;
   const targetKey=Math.floor(target.x/32)+':'+Math.floor(target.y/32)+':'+truck.phase;
   if(route&&route.version===revision&&route.key===targetKey&&!force){if(route.wait>0||route.cells)return route;}
   if(repathBudget<=0)return route||null;
   repathBudget--;
   const blocked=(x,y)=>!g.friendlyPositionClear({radius:R.truckRadius},x*32+16,y*32+16);
   const start={x:Math.floor(truck.x/32),y:Math.floor(truck.y/32)},goal={x:Math.floor(destination.x/32),y:Math.floor(destination.y/32)};
   let cells=null;
   if(g.infrastructure)cells=g.infrastructure.findPath(start,goal,blocked,128,128,R.maxPathExpanded,'truck');else if(typeof C.findFriendlyPath==='function')cells=C.findFriendlyPath(start,goal,blocked,128,128,R.maxPathExpanded);
   route={cells:cells?.map(cell=>({x:cell.x*32+16,y:cell.y*32+16}))||null,endpoint:destination,index:0,version:revision,key:targetKey,wait:R.repathSeconds};
   routes.set(truck.id,route);return route;
 }
 function canRoute(target){
   const core=g.core();if(!core||!target)return false;
   const origin=g.fieldcraft?g.fieldcraft.service({x:core.x+170,y:core.y,radius:R.truckRadius},core):core;if(!origin)return false;
   const fake={id:-1,x:origin.x,y:origin.y,phase:'outbound'};
   const before=repathBudget;repathBudget=1;const route=routeFor(fake,target,true);routes.delete(-1);repathBudget=before;
   return route?.cells!==null&&Boolean(route);
 }
 function garage(){return [...g.world.buildings.values()].some(b=>live(b)&&b.completed&&b.type==='logisticsGarage'&&b.powered);}
 function dispatch(id,automatic=false){
   reconcile();const b=post(id),ctx=context(id);
   if(automatic&&!running())return{ok:false};
   const core=g.core(),origin=g.fieldcraft?g.fieldcraft.service({x:core.x+170,y:core.y,radius:R.truckRadius},core):core;
   const result=engine.dispatch(id,{...ctx,garage:garage(),origin,reachable:Boolean(origin)&&canRoute(b)});
   notify(result);if(result.ok){routes.delete(result.truck.id);g.save(false);}refresh();return result;
 }
 function updateTrucks(dt){
   repathBudget=R.routeBudget;
   for(const route of routes.values())route.wait=Math.max(0,route.wait-dt);
   for(const truck of [...engine.state.trucks]){
     let contacts=0;
     for(const z of g.zombies){
       if(!live(z)||distance(z,truck)>R.truckContactRadius)continue;
       // Test the segment with the same hostile line rule when available: no damage through a gate.
       if(typeof g.hostileLineClear==='function'&&!g.hostileLineClear(z,truck))continue;
       if(++contacts>=R.truckMaxContacts)break;
     }
     const destruction=contacts?engine.damage(truck.id,contacts*R.truckDamagePerContactSecond*dt):null;
     if(destruction){notify(destruction);routes.delete(truck.id);reports.delete(truck.id);continue;}
     if(truck.phase==='outbound'&&!['held','contested'].includes(engine.sector(truck.theme).status)){engine.recall(truck.id);routes.delete(truck.id);}
     const target=truck.phase==='outbound'?post(truck.theme):g.core();
     if(!target){reports.set(truck.id,{blocked:true,reason:'Destination indisponible'});continue;}
     if(g.fieldcraft?g.workerCanWorkAt({x:truck.x,y:truck.y,radius:R.truckRadius},target,62):distance(truck,target)<24&&straight({x:truck.x,y:truck.y,radius:R.truckRadius},target)){
       const r=truck.phase==='outbound'?engine.arrivePost(truck,{arrived:true,operational:Boolean(post(truck.theme))}):engine.unload(truck,{arrived:true,resources:g.resources,storage:g.storage});
       if(r.event==='returned')notify(r);
       reports.set(truck.id,{blocked:false,waiting:Boolean(r.waiting),reason:r.waiting?'Dépôt plein : cargaison conservée':truck.phase==='returning'?'Retour au dépôt':'Chargement'});routes.delete(truck.id);continue;
     }
     const route=routeFor(truck,target);
     if(!route?.cells){reports.set(truck.id,{blocked:true,reason:'Itinéraire bloqué — ouvrez une porte'});continue;}
     let budget=R.truckSpeed*dt,moved=false;
     while(budget>R.epsilon){
       const next=route.cells[route.index]||route.endpoint||target,dist=distance(truck,next);
       if(dist<1){if(route.index<route.cells.length){route.index++;continue;}break;}
       const boost=g.infrastructure?.speed(truck.x,truck.y,'truck')||1;
       const step=Math.min(7,budget*boost,dist),dx=(next.x-truck.x)/dist,dy=(next.y-truck.y)/dist;
       const x=truck.x+dx*step,y=truck.y+dy*step;
       if(!g.friendlyPositionClear({radius:R.truckRadius},x,y)){
         route.cells=null;route.wait=R.repathSeconds;reports.set(truck.id,{blocked:true,reason:'Passage fermé pendant le trajet'});break;
       }
       truck.x=x;truck.y=y;truck.angle=Math.atan2(dy,dx);budget-=step/boost;moved=true;
     }
     if(moved)reports.set(truck.id,{blocked:false,reason:truck.phase==='outbound'?'Ravitaillement en route':'Retour chargé'});
   }
   for(const id of routes.keys())if(!engine.state.trucks.some(t=>t.id===id))routes.delete(id);
   for(const id of reports.keys())if(!engine.state.trucks.some(t=>t.id===id))reports.delete(id);
 }
 function step(dt){
   if(!running()||!Number.isFinite(dt)||dt<=0)return;
   const seconds=Math.min(dt,R.maxStep);supplyCooldown=Math.max(0,supplyCooldown-seconds);
   reconcile();contexts.clear();
   for(const def of T.SECTORS){const ctx=context(def.id);contexts.set(def.id,ctx);notify(engine.tick(def.id,seconds,ctx));}
   markOffline();updateTrucks(seconds);
   inspectionTimer-=seconds;
   if(inspectionTimer<=0){
     inspectionTimer=1.5;
     const def=T.SECTORS[autoCursor++%T.SECTORS.length],s=engine.sector(def.id);
     if(s.automatic&&s.status==='held'&&s.nextDispatch<=0&&(s.stock>=R.truckCapacity*.75||s.supplies<R.supplyPack)&&!engine.state.trucks.some(t=>t.theme===def.id)){
       const r=dispatch(def.id,true);if(!r.ok)s.nextDispatch=R.autoInterval;
     }
   }
 }
 function takeFood(){
   if(!g.canIssueCommand()||!live(g.player)||!accessible(g.player,g.core(),180))return notify({ok:false,reason:'Prenez les rations près du centre, par un accès libre.'});
   const room=Math.max(0,g.player.carryCapacity-C.bagTotal(g.player.carry)),amount=Math.min(R.takeFood,room,g.resources.food);
   if(amount<=R.epsilon)return notify({ok:false,reason:'Sac plein ou réserve de nourriture vide.'});
   g.resources.food-=amount;g.player.carry.food+=amount;g.save(false);refresh();return notify({ok:true,reason:amount.toFixed(1)+' rations placées dans le sac. Rejoignez le poste sélectionné.'});
 }
 function assign(id){
   if(g.workerOrder==='retreat')return notify({ok:false,reason:'Le repli général est actif. Rétablissez un ordre de travail avant de détacher une équipe.'});
   reconcile();const b=post(id),used=new Set([...Object.values(engine.state.sectors).map(s=>s.workerId),...engine.state.withdrawing]);
   const worker=g.units.filter(u=>live(u)&&u.kind==='worker'&&!used.has(u.id)&&!g.siege?.isAssigned(u.id)&&!g.citadel?.isEscort(u.id)&&!g.infrastructure?.isAssigned(u.id)&&!g.salvage?.isAssigned(u.id)&&!g.expeditions?.isAssigned(u.id)).sort((a,c)=>distance(a,b||g.player)-distance(c,b||g.player)||a.id-c.id)[0];
   const r=engine.assign(id,worker?.id,{canCommand:g.canIssueCommand(),workerAvailable:Boolean(worker)});notify(r);if(r.ok){worker.navigation=null;g.save(false);}refresh();return r;
 }
 function evacuate(id,confirmed=false){
   if(!g.canIssueCommand())return {ok:false,reason:'Commandement indisponible.'};
   if(!confirmed){pendingEvacuation=id;refresh();return {ok:false,confirmation:true};}
   if(pendingEvacuation!==id)return{ok:false,reason:'Confirmation périmée.'};
   pendingEvacuation=null;const r=notify(engine.lose(id,'evacuated'));markOffline();if(r.ok)g.save(false);refresh();return r;
 }
 function chooseFallback(id){
   if(!g.canIssueCommand())return false;
   const b=id===null?g.core():g.world.buildings.get(id);if(!live(b)||!b.completed||id!==null&&b.type!=='fallbackRedoubt')return false;
   engine.state.fallbackId=id;g.save(false);refresh();return true;
 }
 function rallySquad(index){
   if(!g.canIssueCommand())return false;const dest=fallback();
   if(!dest||typeof g.retreatSquad!=='function')return false;
   const r=g.retreatSquad(index,dest);if(r)commandMessage='Section en repli vers '+(dest.type==='core'?'le centre.':'la redoute #'+dest.id+'.')+' Riposte conservée, aucune poursuite.';return r;
 }
 function mark(id){if(!Object.hasOwn(T.BY_ID,id))return;selected=id;showMarker=true;pendingEvacuation=null;g.showCommand?.(false);g.notify('Quartier marqué : '+T.BY_ID[id].name+'. Sélectionnez son poste ou maintenez ACTION près de lui.');}
 function open(){g.showCommand?.(true,'field');if(ui)showBoard();}
 function showBoard(){
   const field=document.getElementById('commandPanel-field');if(!field||!ui)return;
   for(const s of field.children)if(s.tagName==='SECTION')s.classList.toggle('hidden',s!==ui.panel);
   for(const b of field.querySelectorAll('.field-nav button'))b.setAttribute('aria-pressed',String(b===ui.navButton));
   refresh();
 }
 wrap('serialize',(original,...args)=>{reconcile();return{...original(...args),territories:engine.snapshot()};});
 wrap('restoreSave',(original,input)=>{
   const data=root.DeadwallSave.validate(input),before=g.world;pendingRestore=T.normalize(data.territories);
   try{return original(data);}finally{if(g.world!==before){ensure();reconcile();markOffline();}pendingRestore=null;}
 });
 wrap('startNew',(original,...args)=>{const r=original(...args);ensure();reconcile();markOffline();refresh();return r;});
 wrap('update',(original,dt)=>{ensure();const r=original(dt);step(dt);return r;});
 wrap('updateUI',(original,...args)=>{ensure();const r=original(...args);refresh();return r;});
 // New vehicles participate in passage occupancy, not just in route finding.
 function truckOccupies(b){
   if(!b)return false;
   const left=Number.isFinite(b.left)?b.left:b.x-b.w*16,right=Number.isFinite(b.right)?b.right:b.x+b.w*16;
   const top=Number.isFinite(b.top)?b.top:b.y-b.h*16,bottom=Number.isFinite(b.bottom)?b.bottom:b.y+b.h*16;
   return engine.state.trucks.some(t=>t.health>0&&t.x+R.truckRadius>left&&t.x-R.truckRadius<right&&t.y+R.truckRadius>top&&t.y-R.truckRadius<bottom);
 }
 if(typeof g.setGateMode==='function')wrap('setGateMode',(original,mode,b=g.selectedBuilding)=>{
   if(mode==='closed'&&b?.def?.gate&&truckOccupies(b)){g.notify('Passage occupé par un fourgon : laissez-le sortir avant de verrouiller.','danger');return false;}
   return original(mode,b);
 });
 if(typeof g.completeBuilding==='function')wrap('completeBuilding',(original,b)=>{
   if(b&&!b.dead&&b.def?.wall&&(!b.def.gate||b.gateMode==='closed')&&truckOccupies(b)){
     const haltedProgress=Math.min(b.progress,.999);b.health=Math.max(.001,b.health-(b.progress-haltedProgress)*b.maxHealth*.88);b.progress=haltedProgress;b.completionBlocked=true;
     if(!b.truckCompletionNotice){g.notify('Chantier suspendu : un fourgon occupe encore le passage.','danger');b.truckCompletionNotice=true;}
     return false;
   }
   if(b)b.truckCompletionNotice=false;return original(b);
 });
 wrap('placeOne',(original,type,gx,gy,rotation=0)=>{
   if(type==='sectorPost'){
     if(!g.canIssueCommand()||![gx,gy,rotation].every(Number.isInteger))return false;
     const d=C.BUILDINGS[type],w=rotation%2?d.size[1]:d.size[0],h=rotation%2?d.size[0]:d.size[1],point={x:(gx+w/2)*32,y:(gy+h/2)*32},target=nearSite(point);
     reconcile();
     if(!target){g.notify('Placez le poste à moins de '+R.buildRadius+' unités du centre d’un site de récupération.','danger');return false;}
     if([...g.world.buildings.values()].some(b=>live(b)&&b.type==='sectorPost'&&nearSite(b)?.theme===target.theme)){g.notify('Un poste ou un chantier dessert déjà ce quartier.','danger');return false;}
   }
   return original(type,gx,gy,rotation);
 });
 wrap('updateInteraction',(original,dt)=>{
   ensure();if(!running()||!live(g.player)||g.selectedBuild||g.rallyPlacement)return original(dt);
   // An active 1.1 recovery objective owns E in its own interaction area.
   const operation=g.fieldOperations?.snapshot().active,opCtx=operation?g.fieldOperations.context():null;
   if(operation&&(operation.phase==='returning'?opCtx.atBase:opCtx.atSite))return original(dt);
   let id=selected;
   if(g.selectedBuilding?.type==='sectorPost')id=nearSite(g.selectedBuilding)?.theme||id;
   const b=post(id),ctx=context(id);if(!b||!ctx.atPost)return original(dt);
   const s=engine.sector(id),claim=!['held','contested'].includes(s.status);
   const status=claim?engine.claimStatus(id,ctx):{ok:ctx.secure,reason:ctx.secure?'ACTION / E : remettre les rations du sac au poste.':'Infectés proches : sécurisez le poste.'};
   const target=s.everHeld?R.reclaimSeconds:R.claimSeconds;
   g.interactionText=status.reason+(claim&&status.ok?' '+Math.floor(s.control)+' / '+target+' s':'');
   if(g.input.keys.has('KeyE')&&status.ok&&Number.isFinite(dt)&&dt>0){
     const r=claim?engine.claim(id,Math.min(R.maxStep,dt),ctx):supplyCooldown<=0?engine.supply(id,ctx):null;
     if(r?.event){notify(r);supplyCooldown=1;g.save(false);}
   }
 });
 // A hook in the original updateUnits loop calls this function before choosing an ordinary worker task.
 g.territories=Object.freeze({version:'1.2.0-candidate.1',snapshot:()=>{ensure();reconcile();return engine.snapshot();},overview:()=>engine.overview(),
   assign,unassign:id=>{if(!g.canIssueCommand())return false;const r=engine.unassign(id);if(r)g.save(false);refresh();return r;},
   dispatch,takeFood,evacuate,chooseFallback,rallySquad,mark,open,refresh,context,updateAssignedUnit,
   recall:id=>{if(!g.canIssueCommand())return{ok:false};const r=notify(engine.recall(id));if(r.ok)g.save(false);refresh();return r;},
   repair:id=>{const t=engine.state.trucks.find(t=>t.id===id);if(!t)return{ok:false};const r=engine.repair(id,{canCommand:g.canIssueCommand(),atTruck:accessible(g.player,t,R.repairRadius),secure:!g.zombies.some(z=>live(z)&&distance(z,t)<R.hostileRadius),resources:g.resources});notify(r);if(r.ok)g.save(false);refresh();return r;},
   automatic:(id,value)=>{const s=engine.sector(id);if(!s||!g.canIssueCommand()||s.status!=='held'||typeof value!=='boolean')return false;s.automatic=value;g.save(false);refresh();return true;},
   drawTruck,drawDistricts,truckEntities:()=>engine.state.trucks,truckReport:id=>reports.get(id)||{reason:'Itinéraire recalculé à la reprise'},offline:id=>Boolean(g.world.buildings.get(id)?.territoryOffline)});
 // Rendering hooks are installed below. The common depth queue gets truck entries through a small source patch.
 wrap('drawGround',(original,ctx,view)=>{const r=original(ctx,view);drawDistricts(ctx,view);return r;});
 wrap('drawThreatArrows',(original,...args)=>{
   const result=original(...args);if(!showMarker||!running()||g.fieldOperations?.snapshot().active)return result;
   const target=site(selected);if(!target)return result;
   const dx=(target.x-g.camera.x)*g.camera.zoom,dy=(target.y-g.camera.y)*g.camera.zoom;
   const halfW=g.width/2-75,halfH=g.height/2-135;
   if(halfW<1||halfH<1||Math.abs(dx)<halfW&&Math.abs(dy)<halfH)return result;
   const scale=Math.min(halfW/Math.max(1,Math.abs(dx)),halfH/Math.max(1,Math.abs(dy)));
   const ctx=g.ctx;ctx.save();ctx.setTransform(g.dpr,0,0,g.dpr,0,0);ctx.translate(g.width/2+dx*scale,g.height/2+dy*scale);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle='#c1d1aa';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-8,-7);ctx.lineTo(-4,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.restore();return result;
 });
 if(g.art?.drawBuilding){const old=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(ctx,b,world)=>Object.hasOwn(T.BUILDINGS,b.type)?drawTerritoryBuilding(ctx,b):old(ctx,b,world);}
 function drawDistricts(ctx,v){
   if(g.state!=='playing')return;
   for(const def of T.SECTORS){
     const point=site(def.id),s=engine.sector(def.id);if(!point||point.x+R.radius<v.left||point.x-R.radius>v.right||point.y+R.radius<v.top||point.y-R.radius>v.bottom)continue;
     if(!s.everHeld&&def.id!==selected)continue;
     const color=s.status==='held'?'#9fb99b':s.status==='contested'?'#e5b264':['lost','evacuated'].includes(s.status)?'#cc8878':'#9aabac';
     ctx.save();ctx.strokeStyle=color;ctx.globalAlpha=.7;ctx.lineWidth=1.5/Math.max(.2,g.camera.zoom);ctx.setLineDash([9,10]);ctx.beginPath();ctx.arc(point.x,point.y,R.radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.fillStyle=color;ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(def.short+' · '+statusLabel(s.status),point.x,point.y-R.radius-10);ctx.restore();
   }
 }
 function drawTruck(ctx,t){
   ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.angle);
   ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(-23,-10,49,24);ctx.fillStyle='#222823';ctx.fillRect(-16,-15,10,5);ctx.fillRect(-16,10,10,5);ctx.fillRect(10,-15,8,5);ctx.fillRect(10,10,8,5);
   ctx.fillStyle='#808877';ctx.fillRect(-23,-11,30,22);ctx.fillStyle='#b3b5a0';ctx.fillRect(7,-10,16,20);ctx.fillStyle='#283e42';ctx.fillRect(9,-8,7,16);
   ctx.strokeStyle='#45534b';ctx.lineWidth=1;for(let x=-18;x<4;x+=6){ctx.beginPath();ctx.moveTo(x,-9);ctx.lineTo(x,9);ctx.stroke();}
   ctx.fillStyle='#e7d79d';ctx.fillRect(23,-9,3,5);ctx.fillRect(23,4,3,5);ctx.fillStyle=t.phase==='outbound'?'#d9c38e':'#a7c59d';ctx.fillRect(-16,-3,12,6);ctx.restore();
   ctx.save();ctx.fillStyle='#161e19';ctx.fillRect(t.x-23,t.y-23,46,4);ctx.fillStyle=t.health<R.truckHealth*.35?'#dc957c':'#a8c197';ctx.fillRect(t.x-23,t.y-23,46*t.health/R.truckHealth,4);ctx.restore();
 }
 function drawTerritoryBuilding(ctx,b){
   const w=b.w*32,h=b.h*32;ctx.save();ctx.translate(b.x,b.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-w/2+6,-h/2+10,w,h);ctx.fillStyle=b.def.color;ctx.fillRect(-w/2,-h/2+5,w,h);ctx.fillStyle=b.def.roof;ctx.fillRect(-w/2-2,-h/2,w+4,h-6);
   if(b.type==='sectorPost'){
     ctx.fillStyle='#53685c';ctx.fillRect(-w*.35,-h*.30,w*.70,h*.45);ctx.strokeStyle='#dad2b5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12,12);ctx.lineTo(12,-49);ctx.stroke();ctx.fillStyle='#c5b479';ctx.beginPath();ctx.moveTo(13,-48);ctx.lineTo(32,-41);ctx.lineTo(13,-34);ctx.closePath();ctx.fill();
     const id=nearSite(b)?.theme,s=engine.sector(id);ctx.fillStyle=s&&['held','contested'].includes(s.status)?'#a6bb92':'#bc9a7b';ctx.fillRect(-24,13,45,7);
   }else if(b.type==='logisticsGarage'){
     ctx.fillStyle='#333e37';ctx.fillRect(-w*.42,-h*.08,w*.36,h*.40);ctx.fillRect(w*.07,-h*.08,w*.36,h*.40);ctx.strokeStyle='#a8a99a';ctx.lineWidth=2;for(let y=-h*.04;y<h*.32;y+=7){ctx.beginPath();ctx.moveTo(-w*.40,y);ctx.lineTo(-w*.08,y);ctx.moveTo(w*.09,y);ctx.lineTo(w*.40,y);ctx.stroke();}ctx.fillStyle='#c5b479';ctx.fillRect(-w*.42,-h*.32,w*.84,9);
   }else{
     ctx.fillStyle='#535d52';ctx.fillRect(-w*.36,-h*.34,w*.72,h*.68);ctx.strokeStyle='#a5a58e';ctx.lineWidth=7;ctx.strokeRect(-w*.39,-h*.37,w*.78,h*.74);ctx.fillStyle='#282f2b';ctx.fillRect(-14,-18,28,20);ctx.strokeStyle='#363e37';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(Math.cos(b.turretAngle||0)*35,Math.sin(b.turretAngle||0)*35-8);ctx.stroke();
   }
   ctx.restore();return true;
 }
 function statusLabel(status){return {neutral:'À ÉTABLIR',held:'TENU',contested:'CONTESTÉ',lost:'PERDU',evacuated:'ÉVACUÉ'}[status]||status;}
 function text(node,value){if(node&&node.textContent!==String(value))node.textContent=String(value);}
 function refresh(){
   if(!ui)return;ensure();const summary=engine.overview();
   ui.hud.classList.toggle('hidden',g.state!=='playing'||g.gameOver);
   text(ui.hudTitle,'QUARTIERS TENUS · '+summary.held+' / '+T.SECTORS.length);text(ui.hudDetail,summary.contested+' contestés · '+summary.convoys+' convois · '+summary.convoysLost+' perdus');
   if(ui.panel.closest('.hidden'))return;
   reconcile();text(ui.status,commandMessage);text(ui.summary,'Quartiers tenus : '+summary.held+' · Ouvriers détachés : '+summary.staffed+' · Matériaux rapportés : '+Math.floor(summary.delivered)+' · Reconquêtes : '+summary.reclaimed);
   const allowed=g.canIssueCommand();ui.take.disabled=!allowed||!accessible(g.player,g.core(),180)||!live(g.player)||g.resources.food<=0||C.bagTotal(g.player.carry)>=g.player.carryCapacity;
   for(const def of T.SECTORS){
     const s=engine.sector(def.id),ctx=context(def.id),card=ui.cards.get(def.id),worker=g.units.find(u=>u.id===s.workerId);
     card.root.dataset.status=s.status;text(card.status,statusLabel(s.status));text(card.stock,Math.floor(s.stock)+' / '+R.stockCapacity+' '+C.RESOURCE_META[def.resource].label.toLowerCase()+' sur place');
     text(card.details,'Rations '+s.supplies.toFixed(1)+' / '+R.supplyCapacity+' · Réserve restante '+Math.floor(s.remaining)+' · Rapporté '+Math.floor(s.exported));
     text(card.worker,s.workerId===null?'Aucun ouvrier affecté':!live(worker)?'Équipe perdue':ctx.workerPresent?(ctx.powered?'Ouvrier sur place':'Poste sans électricité'):'Ouvrier en déplacement');
     card.progress.value=s.pressure;card.progress.max=R.occupationSeconds;card.progress.setAttribute('aria-label','Pression d’occupation de '+def.name);
     text(card.reason,!post(def.id)?'Construisez un poste dans le cercle marqué.':!s.everHeld||['lost','evacuated'].includes(s.status)?'Sur place : 6 rations dans le sac, ACTION / E pendant '+(s.everHeld?R.reclaimSeconds:R.claimSeconds)+' s.':s.status==='contested'?'Production arrêtée. Défendez le poste.':s.remaining<=R.epsilon?'Réserve épuisée : rapatriez le dernier lot.':s.supplies<=0?'Plus de rations : le tri est arrêté.':s.stock>=R.stockCapacity-R.epsilon?'Stock local plein : envoyez un convoi.':s.workerId===null?'Affectez un ouvrier pour commencer la récupération.':'La production locale exige calme, électricité et présence de l’ouvrier.');
     card.assign.disabled=!allowed||g.workerOrder==='retreat'||s.status!=='held'||s.workerId!==null;card.release.disabled=!allowed||s.workerId===null;
     const busy=engine.state.trucks.some(t=>t.theme===def.id);card.dispatch.disabled=!allowed||!ctx.operational||s.status!=='held'||!garage()||busy||g.resources.food<12||g.resources.fuel<6;
     card.auto.disabled=!allowed||s.status!=='held';card.auto.setAttribute('aria-pressed',String(s.automatic));text(card.auto,s.automatic?'DESSERTE AUTO · ACTIVE':'DESSERTE AUTO · ARRÊT');
     card.evacuate.disabled=!allowed||!['held','contested'].includes(s.status);card.mark.disabled=!site(def.id);
   }
   ui.confirm.classList.toggle('hidden',pendingEvacuation===null);text(ui.confirmText,pendingEvacuation?'Évacuer « '+T.BY_ID[pendingEvacuation].name+' » ? Le stock local et les rations sur place seront abandonnés. L’ouvrier se repliera par les accès ouverts.':'');
   const redoubts=[...g.world.buildings.values()].filter(b=>live(b)&&b.completed&&b.type==='fallbackRedoubt'),fallbackKey=redoubts.map(b=>b.id).join(',');
   if(ui.fallbackKey!==fallbackKey){ui.fallbackKey=fallbackKey;ui.fallback.replaceChildren();const opt=document.createElement('option');opt.value='';opt.textContent='Centre de commandement';ui.fallback.appendChild(opt);for(const b of redoubts){const option=document.createElement('option');option.value=String(b.id);option.textContent=b.def.name+' #'+b.id;ui.fallback.appendChild(option);}}
   ui.fallback.value=engine.state.fallbackId===null?'':String(engine.state.fallbackId);ui.fallback.disabled=!allowed;for(const b of ui.squadButtons)b.disabled=!allowed;
   updateTruckCards();
   const list=engine.state.events.slice(-6).reverse().map(e=>({captured:'Poste établi',reclaimed:'Quartier reconquis',lost:'Quartier perdu',evacuated:'Poste évacué',dispatched:'Convoi engagé',returned:'Convoi rentré',truckLost:'Convoi détruit',supplied:'Rations remises',assigned:'Ouvrier affecté',recalled:'Convoi rappelé'}[e.type])+' — '+T.BY_ID[e.theme].name);
   text(ui.journal,list.length?list.join('\n'):'Aucun événement. Les anciens secteurs restent inchangés jusqu’à votre première capture.');
 }
 function updateTruckCards(){
   const valid=new Set(engine.state.trucks.map(t=>t.id));for(const [id,card]of ui.trucks)if(!valid.has(id)){card.root.remove();ui.trucks.delete(id);}
   ui.noTrucks.classList.toggle('hidden',valid.size>0);
   for(const truck of engine.state.trucks){
     let card=ui.trucks.get(truck.id);
     if(!card){const root=ui.element('article',undefined,'territory-truck'),title=ui.element('h4'),detail=ui.element('p'),status=ui.element('p'),recall=ui.button('RAPPELER',()=>g.territories.recall(truck.id)),repair=ui.button('RÉPARER · 8 FERRAILLES',()=>g.territories.repair(truck.id));root.append(title,detail,status,recall,repair);ui.truckList.appendChild(root);card={root,title,detail,status,recall,repair};ui.trucks.set(truck.id,card);}
     text(card.title,'FOURGON '+truck.id+' · '+T.BY_ID[truck.theme].short);text(card.detail,(truck.phase==='outbound'?'ALLER':'RETOUR')+' · Intégrité '+Math.ceil(truck.health)+' / '+R.truckHealth+' · '+truck.food.toFixed(1)+' rations · '+truck.cargo.toFixed(1)+' '+C.RESOURCE_META[T.BY_ID[truck.theme].resource].label.toLowerCase());
     text(card.status,reports.get(truck.id)?.reason||'Trajet à reprendre');card.recall.disabled=!g.canIssueCommand()||truck.phase!=='outbound';card.repair.disabled=!g.canIssueCommand()||truck.health>=R.truckHealth||!accessible(g.player,truck,R.repairRadius)||g.resources.scrap<8;
   }
 }
 function mount(){
   if(ui||!root.document)return;
   const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
   const element=(tag,content,cls)=>{const e=document.createElement(tag);if(content!==undefined)e.textContent=content;if(cls)e.className=cls;return e;};
   const button=(label,fn)=>{const b=element('button',label);b.type='button';b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]'))fn();});return b;};
   const css=element('style');css.textContent=`
   .territory-board{max-width:1120px;margin:auto;color:#dce2d7}.territory-board h2{font-size:clamp(24px,4vw,38px);margin:8px 0 14px}.territory-intro{line-height:1.65;max-width:900px;color:#bfcabe}.territory-bar,.territory-fallback{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:14px 0}.territory-live{min-height:24px;color:#ead29e}.territory-summary{color:#dccc9e;letter-spacing:.035em}.territory-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:14px}.territory-card{border:1px solid #596455;background:linear-gradient(145deg,#243128,#141f19);padding:18px;border-radius:8px;min-width:0;display:flex;flex-direction:column;gap:9px}.territory-card h3{font-size:19px;color:#eee3c9;line-height:1.3;margin:0}.territory-card p{margin:0;line-height:1.5}.territory-card small{font-size:11px;letter-spacing:.07em;color:#c9c2a5}.territory-card[data-status=held]{border-top:3px solid #9fb99b}.territory-card[data-status=contested]{border-top:3px solid #e5b264}.territory-card[data-status=lost],.territory-card[data-status=evacuated]{border-top:3px solid #cc8878}.territory-card details{border-top:1px solid #48574a;padding-top:10px}.territory-card summary{min-height:30px;cursor:pointer;color:#d8c795}.territory-card details p{padding-top:8px;color:#bdc9bc}.territory-card progress{width:100%;height:7px;accent-color:#ce9976}.territory-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:auto;padding-top:6px}.territory-actions button{min-height:40px;font-size:11px;letter-spacing:.02em;padding:8px}.territory-actions .wide{grid-column:1/-1}.territory-card button,.territory-board button{border:1px solid #6f7966;border-radius:4px;background:#303e31;color:#ece9d9;cursor:pointer}.territory-board button:disabled{opacity:.48;cursor:default}.territory-board button[aria-pressed=true]{background:#57674b;color:#fff}.territory-board button:focus-visible,.territory-board summary:focus-visible,.territory-board select:focus-visible{outline:3px solid #f0d58e;outline-offset:3px}.territory-board .danger{border-color:#b68370;color:#edc1af}.territory-confirm{padding:18px;border:2px solid #c3957c;margin:16px 0;background:#382d25}.territory-confirm p{line-height:1.5}.territory-confirm button{min-height:42px;padding:8px 14px;margin:8px}.territory-trucks{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:10px}.territory-truck{border:1px solid #687560;background:#1b2921;padding:15px;border-radius:6px}.territory-truck h4{margin:0 0 10px;color:#e2d2a7}.territory-truck p{line-height:1.5}.territory-truck button{margin:5px;min-height:38px;padding:7px}.territory-journal{white-space:pre-line;line-height:1.8;color:#bbc8b9;padding:16px;border-left:2px solid #938460}.territory-hud{pointer-events:auto;margin-top:7px;border:1px solid #7a8269;background:rgba(19,29,23,.95);border-radius:5px;padding:8px 11px}.territory-hud button{background:none;border:0;color:#d8d6b5;font:inherit;cursor:pointer;text-align:left;width:100%;padding:0}.territory-hud small{display:block;font-size:11px;color:#bcc8b7;margin-top:4px}.territory-fallback select{max-width:100%;min-height:40px;background:#263529;color:#ede9d4;border:1px solid #8a927c;padding:8px}.territory-board .hidden{display:none!important}.high-contrast .territory-card{background:#0d160e;color:#fff}.territory-board,.territory-card,.territory-truck{box-sizing:border-box}@media(max-width:600px){.territory-card{padding:13px}.territory-hud{font-size:11px;padding:6px}.territory-board h2{font-size:26px}.territory-grid{gap:10px}}
   `;document.head.appendChild(css);
   const panel=element('section',undefined,'territory-board hidden');panel.id='field-territories';field.appendChild(panel);
   const navButton=button('QUARTIERS',showBoard);navButton.dataset.fieldView='territories';navButton.setAttribute('aria-controls',panel.id);navButton.setAttribute('aria-pressed','false');nav.appendChild(navButton);
   // Capture delegation runs after the other modules mounted, including future 1.1 buttons.
   nav.addEventListener('click',event=>{const b=event.target.closest('button');if(!b||b===navButton)return;panel.classList.add('hidden');navButton.setAttribute('aria-pressed','false');});
   panel.append(element('small','D-17 / EXTENSION 1.2'),element('h2','Les Quartiers reconquis'),element('p','Établissez un poste dans un site de récupération. Rapportez six rations à pied, sécurisez les abords, puis affectez un ouvrier. Les matériaux restent au poste jusqu’au passage d’un fourgon. Perdre un quartier arrête ses industries locales et abandonne ses stocks ; seule la destruction du centre termine la campagne.','territory-intro'));
   const summary=element('p','','territory-summary'),status=element('p','','territory-live');status.id='territoryStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(summary,status);
   const bar=element('div',undefined,'territory-bar'),take=button('PRENDRE 12 RATIONS AU CENTRE',()=>{takeFood();refresh();});take.id='territoryTakeFood';bar.append(take,element('span','Le prélèvement remplit votre vrai sac, sans dépasser sa capacité.'));panel.appendChild(bar);
   const fallbackRow=element('div',undefined,'territory-fallback'),fallbackSelect=element('select'),fallbackLabel=element('label','POINT DE REPLI');fallbackSelect.id='territoryFallback';fallbackLabel.htmlFor=fallbackSelect.id;fallbackRow.append(fallbackLabel,fallbackSelect);fallbackSelect.addEventListener('change',()=>chooseFallback(fallbackSelect.value===''?null:Number(fallbackSelect.value)));
   const squadButtons=[];for(let i=0;i<3;i++){const b=button('REPLI '+['ALPHA','BRAVO','CHARLIE'][i],()=>{rallySquad(i);refresh();});b.dataset.retreatSquad=String(i);squadButtons.push(b);fallbackRow.appendChild(b);}panel.appendChild(fallbackRow);
   const confirm=element('div',undefined,'territory-confirm hidden'),confirmText=element('p'),confirmYes=button('CONFIRMER L’ÉVACUATION',()=>evacuate(pendingEvacuation,true)),confirmNo=button('GARDER LE POSTE',()=>{pendingEvacuation=null;refresh();});confirm.id='territoryEvacuation';confirmYes.id='territoryEvacuateConfirm';confirm.append(confirmText,confirmYes,confirmNo);panel.appendChild(confirm);
   const grid=element('div',undefined,'territory-grid'),cards=new Map();panel.appendChild(grid);
   for(const def of T.SECTORS){
     const card=element('article',undefined,'territory-card');card.dataset.territory=def.id;
     const state=element('small'),stock=element('p'),details=element('p'),worker=element('p'),reason=element('p'),progress=element('progress');
     card.append(state,element('h3',def.name),stock,details,worker,progress,reason);
     const more=element('details');more.append(element('summary','Briefing de secteur'),element('p',def.briefing),element('p','Réserve initiale : '+def.reserve+' '+C.RESOURCE_META[def.resource].label.toLowerCase()+' · Tri maximal '+(def.rate*60).toFixed(1)+'/min. La réserve ne se régénère pas à la reconquête.'));card.appendChild(more);
     const actions=element('div',undefined,'territory-actions');
     const markButton=button('MARQUER SUR LA CARTE',()=>mark(def.id)),assignButton=button('AFFECTER UN OUVRIER',()=>assign(def.id)),release=button('RAPPELER L’OUVRIER',()=>g.territories.unassign(def.id)),dispatchButton=button('CONVOI · 12 N / 6 C',()=>dispatch(def.id)),auto=button('DESSERTE AUTO · ARRÊT',()=>g.territories.automatic(def.id,!engine.sector(def.id).automatic)),evacuateButton=button('ÉVACUER…',()=>{evacuate(def.id);confirm.scrollIntoView({block:'nearest'});confirmYes.focus();});
     for(const [b,act]of [[markButton,'mark'],[assignButton,'assign'],[release,'release'],[dispatchButton,'dispatch'],[auto,'auto'],[evacuateButton,'evacuate']]){b.dataset.territoryAction=act;b.dataset.theme=def.id;}
     auto.className='wide';evacuateButton.className='wide danger';auto.setAttribute('aria-pressed','false');evacuateButton.setAttribute('aria-controls',confirm.id);actions.append(markButton,assignButton,release,dispatchButton,auto,evacuateButton);card.appendChild(actions);grid.appendChild(card);
     cards.set(def.id,{root:card,status:state,stock,details,worker,reason,progress,mark:markButton,assign:assignButton,release,dispatch:dispatchButton,auto,evacuate:evacuateButton});
   }
   panel.append(element('h3','Convois sur le terrain'),element('p','Les fourgons roulent automatiquement : ils ne sont ni pilotables ni armés. Une porte fermée les bloque. Au retour, un dépôt plein les fait attendre avec le reliquat ; ils ne jettent pas la cargaison.','territory-intro'));
   const noTrucks=element('p','Aucun fourgon en route.'),truckList=element('div',undefined,'territory-trucks');panel.append(noTrucks,truckList);
   panel.append(element('h3','Journal de la reconquête'));const journal=element('p','','territory-journal');panel.appendChild(journal);
   const hud=element('section',undefined,'territory-hud hidden'),hudButton=button('',open),hudTitle=element('strong'),hudDetail=element('small');hudButton.id='territoryHudButton';hudButton.append(hudTitle,hudDetail);hud.appendChild(hudButton);g.ui.rightPanel?.appendChild(hud);
   ui={element,button,panel,navButton,summary,status,take,cards,confirm,confirmText,fallback:fallbackSelect,fallbackKey:null,squadButtons,truckList,noTrucks,trucks:new Map(),journal,hud,hudTitle,hudDetail};refresh();
 }
 ensure();
 if(root.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();}
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL TERRITORIES 1.2 — END */


/* DEADWALL SIEGE 1.3 — BEGIN */
/* Real host adapter. Simulation hooks retain the prior content and its resource ownership. */
(function installSiegeRuntime(root){
  'use strict';
  const g=root.DEADWALL,C=root.DeadwallCore,F=root.DeadwallSiege,R=F?.RULES;
  if(!g||!C||!F)throw new Error('Moteur et catalogue du siège absents.');if(g.siege)return;
  let engine=new F.Engine(),worldRef=g.world,pending=null,fireDamage=false,tool=false,notice='',jobs=new Map(),dousing=new Set(),seenIgnitions=0;
  const wrap=(name,fn)=>{const original=g[name];if(typeof original!=='function')throw new Error('Interface du siège absente : '+name);g[name]=function(...args){return fn(original.bind(g),...args);};};
  const live=b=>Boolean(b&&!b.dead&&b.health>0),operational=b=>live(b)&&(b.completed===true||b.progress>=1);
  const buildings=()=>[...g.world.buildings.values()];
  const playing=()=>g.state==='playing'&&!g.gameOver;
  const running=()=>playing()&&!g.paused&&!g.activeOverlay;
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const announce=text=>{notice=text;g.siegeUI?.refresh();return text;};
  function ensure(){if(worldRef!==g.world){worldRef=g.world;engine=new F.Engine(pending||undefined);pending=null;tool=false;jobs.clear();dousing.clear();seenIgnitions=engine.state.stats.ignitions;}return engine;}
  function reconcile(){ensure();engine.reconcile(buildings(),g.units);if(!live(g.player))engine.playerDown();}
  function mark(){for(const b of g.world.buildings.values())b.siegeOffline=Boolean(engine.fire(b.id));}
  const freeSlots=()=>Math.min(R.maxCrew,buildings().filter(b=>operational(b)&&b.type==='fireStation'&&b.powered&&!engine.fire(b.id)).length*R.crewPerStation);
  function isDetached(id){const t=g.territories?.snapshot();return Boolean(t&&(t.withdrawing.includes(id)||Object.values(t.sectors).some(s=>s.workerId===id)));}
  function service(u,b){
    if(!operational(b))return null;const r=F.rect(b),m=(u.radius||12)+6;
    const cx=Math.max(r.left+m,Math.min(r.right-m,u.x)),cy=Math.max(r.top+m,Math.min(r.bottom-m,u.y));
    const points=[{x:r.left-m,y:cy},{x:r.right+m,y:cy},{x:cx,y:r.top-m},{x:cx,y:r.bottom+m}];
    const point=points.filter(p=>p.x>=16&&p.y>=16&&p.x<=4080&&p.y<=4080&&g.friendlyPositionClear(u,p.x,p.y)).sort((a,b)=>dist(u,a)-dist(u,b))[0];
    if(!point)return null;
    const aim={x:Math.max(r.left,Math.min(r.right,u.x)),y:Math.max(r.top,Math.min(r.bottom,u.y))};
    const line=typeof g.hostileLineClear!=='function'||g.hostileLineClear(u,aim,false,b);
    return{...point,key:'fire-service:'+b.id,at:dist(u,point)<=R.workRange&&g.workerCanWorkAt(u,point,R.workRange)&&line};
  }
  function secure(u,b){return !g.zombies.some(z=>live(z)&&(dist(z,u)<R.dangerRadius||dist(z,b)<R.dangerRadius));}
  function near(type,u){return buildings().filter(b=>operational(b)&&(type==='fire'?engine.fire(b.id):b.type==='fireCistern'&&engine.tank(b.id)?.water>0)).map(b=>({b,p:service(u,b)})).filter(v=>v.p).sort((a,b)=>dist(u,a.p)-dist(u,b.p)||a.b.id-b.b.id);}
  function chooseCrewTarget(u,stage){
    const list=near(stage,u);return list.find(v=>!g.workerJobAvailable||g.workerJobAvailable(u,v.p.key))||null;
  }
  function move(u,p,dt){if(typeof g.moveWorkerToJob==='function')g.moveWorkerToJob(u,p,dt,p.key);else g.moveUnitToward(u,p,dt);}
  function updateAssignedUnit(u,dt){
    ensure();const member=engine.member(u.id);if(!member||!live(u)||u.kind!=='worker')return false;
    if(!Number.isFinite(dt)||dt<=0||!running())return true;dt=Math.min(dt,R.maxStep);
    if(g.workerOrder==='retreat'||freeSlots()<engine.state.crew.filter(c=>!c.release).length)member.release=true;
    const core=g.core();if(!core)return true;
    if(u.carry>0&&u.carryType){u.state='return';g.depositWorker(u,core,dt);jobs.set(u.id,{state:'Rapporter le sac de collecte'});return true;}
    if(member.release||g.nearestZombie?.(u.x,u.y,R.dangerRadius)){
      u.state='flee';jobs.set(u.id,{state:member.release?'Repli avant réaffectation':'Menace proche : retrait'});
      if(g.workerCanWorkAt(u,core,60)){if(member.release)engine.arriveHome(u.id);}else g.moveUnitToward(u,core,dt);
      return true;
    }
    if(!engine.state.fires.length){u.state='idle';jobs.set(u.id,{state:'En veille — aucun foyer'});return true;}
    const previousJob=jobs.get(u.id),filling=previousJob?.filling&&member.water<R.crewCapacity-1e-7&&engine.tank(previousJob.target)?.water>1e-7;
    const stage=member.water<=1e-7||filling?'tank':'fire',choice=chooseCrewTarget(u,stage);
    if(!choice){u.state='idle';jobs.set(u.id,{state:stage==='tank'?'Attente d’eau ou accès bloqué':'Aucun foyer accessible'});return true;}
    const {b,p}=choice;u.state=stage==='tank'?'return':'repair';jobs.set(u.id,{state:stage==='tank'?'Prise d’eau en citerne':'Intervention sur le foyer',target:b.id,filling:stage==='tank'});
    if(!p.at){move(u,p,dt);return true;}
    if(stage==='tank')engine.fill(b.id,u.id,dt,{running:true,accessible:true,dead:false});
    else if(engine.suppress(b.id,u.id,dt,{running:true,accessible:true,secure:secure(u,b),dead:false,at:g.elapsed}))dousing.add(u.id);
    return true;
  }
  function assign(){
    reconcile();if(!g.canIssueCommand()||g.workerOrder==='retreat')return{ok:false,reason:announce('Reprenez le travail des équipes avant une affectation.')};
    const u=g.units.filter(u=>live(u)&&u.kind==='worker'&&!engine.member(u.id)&&!isDetached(u.id)&&!g.citadel?.isEscort(u.id)&&!g.infrastructure?.isAssigned(u.id)&&!g.salvage?.isAssigned(u.id)&&!g.expeditions?.isAssigned(u.id)).sort((a,b)=>a.id-b.id)[0];
    const ok=engine.assign(u?.id,{canCommand:true,available:Boolean(u),slots:freeSlots()});
    if(ok){u.navigation=null;g.save(false);g.audio?.ui();}
    return {ok,reason:announce(ok?'Ouvrier affecté : la collecte ordinaire cède la place aux secours.':'Ouvrier libre et poste de secours alimenté requis (deux places par poste).')};
  }
  function release(id){if(!g.canIssueCommand())return false;const ok=engine.release(id);if(ok){g.save(false);announce('L’ouvrier rejoint le centre avant de reprendre ses tâches. L’eau restante sera abandonnée.');}return ok;}
  function toggleTool(){if(!playing()||!live(g.player))return false;tool=!tool;g.input.mouseDown=false;g.input.touchFire=false;g.player.reload=0;announce(tool?'Seau équipé : ACTION remplit ou arrose. Le tir et la crosse sont désactivés.':'Seau rangé : armes et interactions ordinaires disponibles.');return tool;}
  function selectBuilding(id){const b=g.world.buildings.get(id);if(!b||!g.canIssueCommand())return false;g.selectBuilding?.(b);g.showCommand?.(false);tool=true;announce('Rejoignez '+b.def.name+' et maintenez ACTION / E.');return true;}
  function alarm(){return buildings().some(b=>operational(b)&&b.type==='alarmTower'&&b.powered&&!engine.fire(b.id));}
  wrap('placeOne',(original,type,...args)=>{
    if(type==='fireCistern'&&buildings().filter(b=>live(b)&&b.type==='fireCistern').length>=R.maxTanks){g.notify('Réseau de secours complet : 128 citernes maximum.','danger');return false;}
    return original(type,...args);
  });
  wrap('prepareWave',(original,...args)=>{
    ensure();const result=original(...args),adapted=F.adaptPlan(g.wavePlan,C.ENEMIES,g.world.seed);
    if(adapted.profile){g.wavePlan=adapted.plan;const previous=engine.state.lastWave,already=previous?.wave===g.wave,bonus=!already&&g.phase==='warning'&&alarm()?R.warningBonus:0;if(bonus)g.phaseTime+=bonus;engine.state.lastWave={wave:g.wave,id:adapted.profile.id,bonus:already?previous.bonus:bonus};engine.log('wave',0,g.elapsed);g.notify(adapted.profile.name+' — '+adapted.profile.advice);}
    else engine.state.lastWave=null;
    return result;
  });
  wrap('damageBuilding',(original,b,amount)=>{
    const result=original(b,amount);if(running()&&!fireDamage&&amount>0&&live(b)){ensure();if(engine.ignite(b,'machinery',g.elapsed)){b.siegeOffline=true;g.refreshMetrics(true);g.notify('Départ de feu : '+b.def.name+'.','danger');}}return result;
  });
  wrap('destroyBuilding',(original,b)=>{
    const explosive=b&&!b.dead&&(b.completed||b.progress>=1)&&b.def?.explosive;const result=original(b);
    if(explosive&&playing()){ensure();const count=engine.explosion(b,buildings(),g.elapsed);if(count)g.notify('L’explosion a embrasé '+count+' structure'+(count>1?'s':'')+' voisine'+(count>1?'s':'')+'.','danger');}
    reconcile();mark();return result;
  });
  wrap('serialize',(original,...args)=>{reconcile();return{...original(...args),siege:engine.snapshot()};});
  wrap('restoreSave',(original,input)=>{
    const data=root.DeadwallSave.validate(input),before=g.world;pending=F.normalize(data.siege);
    try{return original(data);}finally{if(g.world!==before){ensure();reconcile();mark();g.refreshMetrics(true);}pending=null;}
  });
  wrap('startNew',(original,...args)=>{const result=original(...args);ensure();reconcile();mark();g.siegeUI?.refresh();return result;});
  wrap('update',(original,dt)=>{
    ensure();dousing.clear();mark();const result=original(dt);
    if(running()&&Number.isFinite(dt)&&dt>0){
      const before=engine.state.fires.length;fireDamage=true;
      try{engine.step(Math.min(dt,R.maxStep),{buildings:buildings(),resources:g.resources,weather:g.weather,running:true,damage:(b,n)=>{g.damageBuilding(b,n);return !g.gameOver;},units:g.units,at:g.elapsed});}finally{fireDamage=false;}
      if(g.gameOver)return result;
      if(!live(g.player))engine.playerDown();mark();
      if(engine.state.fires.length!==before)g.refreshMetrics(true);
      if(engine.state.stats.ignitions>seenIgnitions){seenIgnitions=engine.state.stats.ignitions;g.siegeUI?.refresh();}
    }
    return result;
  });
  wrap('updateUI',(original,...args)=>{ensure();const result=original(...args);g.siegeUI?.refresh();return result;});
  // Manual tool has explicit ownership of E. The existing sorties and territory actions regain it when put away.
  wrap('updateInteraction',(original,dt)=>{
    if(!tool||!running()||!live(g.player)||g.selectedBuild||g.rallyPlacement)return original(dt);
    const selected=g.selectedBuilding,manualTarget=selected&&operational(selected)&&(engine.fire(selected.id)||selected.type==='fireCistern')?{b:selected,p:service(g.player,selected)}:null;
    const targets=[...near('fire',g.player),...near('tank',g.player)].filter(v=>v.p?.at).sort((a,b)=>dist(g.player,a.p)-dist(g.player,b.p));
    const target=manualTarget?.p?.at?manualTarget:targets[0];
    if(!target){g.interactionText='Seau : rejoignez une citerne ou un foyer. V / bouton SEAU pour reprendre les interactions normales.';return;}
    const {b,p}=target,isFire=Boolean(engine.fire(b.id)),safe=secure(g.player,b);
    g.interactionText=isFire?(safe?'ACTION / E : arroser '+b.def.name+' · eau '+engine.state.playerWater.toFixed(1)+'/8':'Infectés proches : sécurisez les abords avant d’arroser.'):'ACTION / E : remplir le seau · '+engine.state.playerWater.toFixed(1)+'/8';
    if(g.input.keys.has('KeyE')&&Number.isFinite(dt)&&dt>0){const ctx={running:true,accessible:p.at,secure:safe,dead:false,at:g.elapsed};const n=isFire?engine.suppress(b.id,0,Math.min(dt,R.maxStep),ctx):engine.fill(b.id,0,Math.min(dt,R.maxStep),ctx);if(isFire&&n)dousing.add(0);mark();}
  });
  for(const name of ['shootPlayer','melee','startReload'])if(typeof g[name]==='function')wrap(name,(original,...args)=>tool?false:original(...args));
  if(typeof g.drawBuilding==='function')wrap('drawBuilding',(original,ctx,b,...args)=>{const result=original(ctx,b,...args);drawFire(ctx,b);return result;});
  if(typeof g.drawUnit==='function')wrap('drawUnit',(original,ctx,u,...args)=>{const result=original(ctx,u,...args);if(engine.member(u.id)){ctx.save();ctx.fillStyle=dousing.has(u.id)?'#a6d6df':'#d6a16f';ctx.fillRect(u.x+9,u.y-8,6,8);ctx.restore();}return result;});
  function drawFire(ctx,b){const f=engine.fire(b.id);if(!f||!live(b))return;const r=F.rect(b),width=Math.min(130,r.right-r.left),n=Math.min(7,Math.max(3,Math.ceil(width/20))),t=g.settings?.reducedMotion?0:g.elapsed;
    ctx.save();ctx.translate(b.x,b.y);for(let i=0;i<n;i++){const x=(i/(n-1)-.5)*width*.8,h=17+f.heat*.25+Math.sin(t*5+i*1.9)*5;ctx.fillStyle=i%2?'rgba(224,117,47,.84)':'rgba(245,172,76,.8)';ctx.beginPath();ctx.moveTo(x-9,6);ctx.quadraticCurveTo(x-14,-h*.55,x+Math.sin(t+i)*6,-h);ctx.quadraticCurveTo(x+12,-h*.4,x+8,6);ctx.fill();ctx.fillStyle='rgba(47,44,40,.34)';ctx.beginPath();ctx.ellipse(x+Math.sin(t*.6+i)*10,-h-15,14,20,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#ffe3b1';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('FEU · '+Math.ceil(f.heat),0,19);ctx.restore();
  }
  if(g.art?.drawBuilding){const prior=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(ctx,b,world)=>{
    if(!Object.hasOwn(F.BUILDINGS,b.type))return prior(ctx,b,world);
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.rotation||0)*Math.PI/2);const w=b.def.size[0]*32,h=b.def.size[1]*32;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-w/2+5,-h/2+7,w,h);
    if(b.type==='fireCistern'){ctx.fillStyle='#566f70';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#a8b4a8';ctx.beginPath();ctx.ellipse(-12,0,26,24,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#3e5757';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#799fb0';ctx.fillRect(22,-22,10,44);ctx.fillStyle='#c5e2d9';ctx.fillRect(23,21-(engine.tank(b.id)?.water||0)/R.waterCapacity*42,8,(engine.tank(b.id)?.water||0)/R.waterCapacity*42);}
    else if(b.type==='fireScreen'){ctx.fillStyle='#b4b8ad';ctx.fillRect(-16,-16,32,32);ctx.fillStyle='#686e66';ctx.fillRect(-16,-5,32,10);ctx.fillStyle='#d4b370';ctx.fillRect(-12,-3,24,3);}
    else if(b.type==='alarmTower'){ctx.fillStyle='#59635b';ctx.fillRect(-24,-24,48,48);ctx.strokeStyle='#9a9b86';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-20,22);ctx.lineTo(0,-28);ctx.lineTo(20,22);ctx.stroke();ctx.fillStyle=b.powered?'#edd7a1':'#8a8d7d';ctx.beginPath();ctx.arc(0,-24,11,0,Math.PI*2);ctx.fill();}
    else{ctx.fillStyle='#79584a';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#adab96';ctx.fillRect(-w/2-2,-h/2-3,w+4,h*.65);ctx.fillStyle='#43534c';ctx.fillRect(-w/2+8,6,w-16,h/2-10);ctx.fillStyle='#d8b9a0';ctx.fillRect(-4,-36,8,26);ctx.fillRect(-13,-27,26,8);}
    ctx.restore();return true;
  };}
  function pumpFuelPerMinute(){
    ensure();let fuel=g.resources.fuel,cost=0;
    for(const t of engine.state.tanks){const b=g.world.buildings.get(t.id);if(!operational(b))continue;
      const flow=F.waterFlow(t.water,{powered:b.powered&&!engine.fire(b.id),weather:g.weather||0,fuel},R.maxStep);fuel=Math.max(0,fuel-flow.cost);cost+=flow.cost;
    }return cost/R.maxStep*60;
  }
  function overview(){reconcile();const bs=buildings(),list=engine.state.fires.map(f=>{const b=g.world.buildings.get(f.id);return{...f,name:b?.def.name||'Structure',health:b?.health||0};});
    return{fires:list,water:engine.state.tanks.reduce((n,t)=>n+t.water,0),tanks:engine.state.tanks.map(t=>({...t,name:g.world.buildings.get(t.id)?.def.name||'Citerne'})),crew:engine.state.crew.map(c=>({...c,job:jobs.get(c.id)?.state||'Prise de poste'})),slots:freeSlots(),tool,playerWater:engine.state.playerWater,lastWave:engine.state.lastWave,history:engine.state.history,stats:{...engine.state.stats},notice,
      vulnerable:bs.filter(b=>operational(b)&&b.def.wall&&(b.health/b.maxHealth<.35||b.corpseLoad>15)).length};}
  function assaultPattern(){ensure();const profile=engine.state.lastWave;return profile?.wave===g.wave?F.PROFILE_BY_ID[profile.id]?.frontPattern:undefined;}
  g.siege=Object.freeze({version:'1.3.0-candidate.1',playerDown:()=>{ensure();engine.playerDown();tool=false;},snapshot:()=>{reconcile();return engine.snapshot();},overview,assaultPattern,assign,release,toggleTool,selectBuilding,updateAssignedUnit,
    isAssigned:id=>Boolean(engine.member(id)),toolActive:()=>tool,pumpFuelPerMinute,drawFire,markOffline:mark,service,
    open:()=>{g.showCommand?.(true,'field');g.siegeUI?.open();}});
  ensure();reconcile();mark();
  if(root.document)document.addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&running()&&!e.target?.closest?.('input,textarea,select,[contenteditable],button,summary')){e.preventDefault();toggleTool();}});
})(typeof globalThis!=='undefined'?globalThis:this);

/* Installs inside the existing command post, not a separate game or debug overlay. */
(function mountSiegeUI(root){
 'use strict';
 const g=root.DEADWALL,F=root.DeadwallSiege,C=root.DeadwallCore;
 if(!g?.siege||!root.document) return;
 function mount(){
  const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
  const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;};
  const text=(n,s)=>{s=String(s);if(n.textContent!==s)n.textContent=s;};
  const button=(txt,fn)=>{const b=el('button',txt);b.type='button';b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]'))fn();});return b;};
  const css=el('style');css.textContent=`
   .siege-panel{--siege-ink:#e5e5d6;--siege-muted:#b4bdb0;--siege-line:#52605a;color:var(--siege-ink);padding:6px 2px 18px;max-width:100%;box-sizing:border-box}
   .siege-hero{display:grid;grid-template-columns:1.6fr 1fr;gap:20px;align-items:center;padding:24px;border:1px solid var(--siege-line);background:linear-gradient(120deg,#26342f,#18241f);border-radius:10px;margin-bottom:18px}
   .siege-panel small{color:#d3b481;letter-spacing:.1em;font-size:11px}.siege-panel h2{font-size:32px;margin:8px 0;letter-spacing:-.025em}.siege-panel h3{font-size:18px;margin:0 0 10px}.siege-panel p{line-height:1.55;margin:8px 0;color:var(--siege-muted);font-size:13px}.siege-panel strong{color:var(--siege-ink)}
   .siege-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.siege-kpi{border:1px solid #596657;border-radius:6px;padding:12px;background:#17231e}.siege-kpi b{font-size:23px;display:block;font-variant-numeric:tabular-nums}.siege-kpi span{font-size:10px;letter-spacing:.05em;color:#b8c2b4}
   .siege-columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}.siege-block{background:#202e26;border:1px solid var(--siege-line);border-radius:8px;padding:18px;min-width:0}.siege-full{margin-top:16px}.siege-panel button{border:1px solid #7a886e;background:#324237;color:#eee9d8;border-radius:5px;padding:10px 12px;min-height:42px;font:600 12px system-ui;cursor:pointer;white-space:normal;max-width:100%}.siege-panel button:hover:not(:disabled){background:#495b40}.siege-panel button:disabled{opacity:.48;cursor:default}.siege-panel button[aria-pressed=true]{border-color:#e7b774;background:#5a4933}.siege-panel button:focus-visible,.siege-panel summary:focus-visible{outline:3px solid #f1d39b;outline-offset:3px}
   .siege-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:12px 0}.siege-status{min-height:23px;padding:10px 12px;border-left:3px solid #d4ac6e;background:#2f362b}.siege-row{padding:12px 0;border-top:1px solid #47574b;display:flex;align-items:center;justify-content:space-between;gap:10px}.siege-row div{min-width:0}.siege-row b{font-size:13px}.siege-row small{display:block;color:#bcc5b5;letter-spacing:0;margin-top:5px}.siege-row button{flex-shrink:0}
   .siege-patterns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.siege-profile{padding:14px;border:1px solid #485b4c;border-radius:6px;background:#19281f}.siege-profile[data-current=true]{border-color:#d7b175;background:#34382a}.siege-profile summary{cursor:pointer;line-height:1.4}.siege-profile small{display:block;margin-bottom:8px}.siege-help{border-top:1px solid #485b4c;padding:12px 0}.siege-log{padding:0;list-style:none;max-height:180px;overflow:auto}.siege-log li{font-size:12px;padding:6px 0;border-bottom:1px solid #3e5043;color:#c1cbb9}
   .siege-hud{background:#202d23;border:1px solid #596c54;border-radius:7px;padding:7px;margin-top:8px}.siege-hud-row{display:flex;gap:6px}.siege-hud button{background:#314630;color:#e9e7d2;border:1px solid #718166;border-radius:4px;padding:8px 9px;cursor:pointer;font-size:11px;min-height:37px}.siege-hud button:first-child{flex:1;text-align:left}.siege-hud b,.siege-hud small{display:block}.siege-hud small{font-size:10px;color:#c2c9b1;line-height:1.4;margin-top:4px}.siege-panel .hidden{display:none!important}.siege-hidden{display:none!important}
   @media(max-width:650px){.siege-hero,.siege-columns,.siege-patterns{grid-template-columns:1fr}.siege-hero{padding:16px;gap:12px}.siege-panel h2{font-size:27px}.siege-row{align-items:flex-start}.siege-row button{max-width:45%}.siege-block{padding:13px}.siege-hud{margin-top:6px}}
   .high-contrast .siege-block,.high-contrast .siege-profile,.high-contrast .siege-hero{background:#0c1710;color:#fff;border-color:#bbcbb5}.high-contrast .siege-panel p{color:#e2e8da}
  `;document.head.appendChild(css);
  const panel=el('section',undefined,'siege-panel hidden');panel.id='field-siege';field.appendChild(panel);
  const navButton=button('SIÈGE & SECOURS',open);navButton.dataset.fieldView='siege';navButton.setAttribute('aria-controls',panel.id);navButton.setAttribute('aria-pressed','false');nav.appendChild(navButton);
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b!==navButton){panel.classList.add('hidden');navButton.setAttribute('aria-pressed','false');}});
  const hero=el('div',undefined,'siege-hero'),intro=el('div');intro.append(el('small','D-17 / EXTENSION 1.3'),el('h2','Les Nuits de siège'),el('p','La ligne doit tenir, mais la cité ne doit pas brûler derrière elle. Préparez l’eau, détachez des secours et gardez une issue vers les enceintes intérieures.'));hero.appendChild(intro);
  const kpis=el('div',undefined,'siege-kpis'),stats={};for(const [id,label]of [['fires','FOYERS'],['water','EAU EN CITERNE'],['crew','SECOURISTES']]){const cell=el('div',undefined,'siege-kpi'),value=el('b','0');value.id='siege-kpi-'+id;cell.append(value,el('span',label));stats[id]=value;kpis.appendChild(cell);}hero.appendChild(kpis);panel.appendChild(hero);
  const status=el('p','','siege-status');status.id='siegeStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.appendChild(status);
  const cols=el('div',undefined,'siege-columns'),left=el('article',undefined,'siege-block'),right=el('article',undefined,'siege-block');cols.append(left,right);panel.appendChild(cols);
  const waveName=el('h3'),waveText=el('p'),waveAdvice=el('p'),wallRisk=el('p');left.append(el('small','MIGRATION EN COURS'),waveName,waveText,waveAdvice,wallRisk);
  const tools=el('div',undefined,'siege-actions'),tool=button('ÉQUIPER LE SEAU',()=>g.siege.toggleTool());tool.id='siegeTool';tool.setAttribute('aria-pressed','false');tools.appendChild(tool);left.append(tools,el('p','V bascule le seau en partie. Avec le seau équipé, ACTION / E prend l’eau en citerne ou refroidit un foyer proche. Le tir, la crosse et le rechargement sont indisponibles. Le seau utilise un emplacement dédié, pas le sac de récupération.'));
  const bucket=el('p');bucket.id='siegeBucket';left.appendChild(bucket);
  right.append(el('small','MAIN-D’ŒUVRE EXISTANTE'),el('h3','Équipes de secours'),el('p','Deux places par poste alimenté. L’ouvrier rapporte son sac avant son affectation, puis rejoint les citernes et les foyers par les accès praticables. Une menace proche le fait reculer.'));
  const assign=button('AFFECTER UN OUVRIER LIBRE',()=>{const r=g.siege.assign();text(status,r.reason);});assign.id='siegeAssign';right.appendChild(assign);const crews=el('div');right.appendChild(crews);
  const infra=el('div',undefined,'siege-columns siege-full'),firesBlock=el('article',undefined,'siege-block'),waterBlock=el('article',undefined,'siege-block');firesBlock.append(el('h3','Foyers à traiter'),el('p','L’extinction stoppe les dégâts, elle ne répare pas la structure. Les murs coupe-feu, d’acier et de béton interrompent une propagation directe.'));waterBlock.append(el('h3','Réserve de secours'),el('p','Les citernes commencent vides. La pompe utilise électricité et carburant ; la pluie les alimente lentement. Une citerne détruite perd son eau.'));const fires=el('div'),tanks=el('div');firesBlock.appendChild(fires);waterBlock.appendChild(tanks);infra.append(firesBlock,waterBlock);panel.appendChild(infra);
  const book=el('article',undefined,'siege-block siege-full');book.append(el('h3',F.PROFILES.length+' formes de migration'),el('p','À partir de la vague 3, le profil varie selon la carte et la vague. Certains profils déplacent les arrivées entre les côtés de la cité. Le total d’ennemis, leurs points de vie et le plafond simultané restent ceux du jeu. Un assaut déjà sauvegardé ne sera pas remanié à la reprise.'));
  const patterns=el('div',undefined,'siege-patterns'),profileCards=new Map();for(const p of F.PROFILES){const card=el('details',undefined,'siege-profile'),summary=el('summary');summary.append(el('small','À PARTIR DE LA VAGUE '+p.minWave),el('strong',p.name));card.append(summary,el('p',p.brief),el('p',p.advice));patterns.appendChild(card);profileCards.set(p.id,card);}book.appendChild(patterns);panel.appendChild(book);
  const help=el('details',undefined,'siege-help');help.append(el('summary','Préparer les secours avant le premier incendie'),el('p','Construisez une citerne (Camp fortifié), puis un poste de secours près de vos installations à risque (Avant-poste + atelier militaire). Maintenez un trajet ouvert pour les porteurs d’eau. Écartez les entrepôts en bois des générateurs, raffineries et manufactures. Une vigie alimentée prolonge une nouvelle alerte de sept secondes, sans cumul entre vigies. Le repli général prime sur les interventions incendie.'));panel.appendChild(help);
  const log=el('ul',undefined,'siege-log');panel.append(el('h3','Journal des secours'),log);
  const hud=el('section',undefined,'siege-hud'),hudRow=el('div',undefined,'siege-hud-row'),openButton=button('',()=>g.siege.open()),hudTitle=el('b'),hudSubtitle=el('small'),hudTool=button('SEAU',()=>g.siege.toggleTool());openButton.id='siegeHudButton';hudTool.id='siegeHudTool';hudTool.setAttribute('aria-pressed','false');openButton.append(hudTitle,hudSubtitle);hudRow.append(openButton,hudTool);hud.appendChild(hudRow);g.ui.rightPanel?.appendChild(hud);
  let listKey='',historyKey='';
  function renderRows(container,rows,empty,fn){container.replaceChildren();if(!rows.length){container.appendChild(el('p',empty));return;}for(const row of rows)container.appendChild(fn(row));}
  function row(title,detail,label,action){const n=el('div',undefined,'siege-row'),copy=el('div');copy.append(el('b',title),el('small',detail));n.appendChild(copy);if(action)n.appendChild(button(label,action));return n;}
  function open(){for(const s of field.children)if(s.tagName==='SECTION')s.classList.toggle('hidden',s!==panel);for(const b of nav.children)b.setAttribute('aria-pressed',String(b===navButton));refresh();}
  function refresh(){
    const v=g.siege.overview(),playing=g.state==='playing'&&!g.gameOver,can=g.canIssueCommand();hud.classList.toggle('hidden',!playing);
    text(hudTitle,v.fires.length?'INCENDIE · '+v.fires.length+' foyer'+(v.fires.length>1?'s':''):'SIÈGE & SECOURS');text(hudSubtitle,Math.floor(v.water)+' eau · '+v.crew.length+' équipier'+(v.crew.length>1?'s':'')+' · seau '+v.playerWater.toFixed(1)+'/8');hudTool.setAttribute('aria-pressed',String(v.tool));hudTool.disabled=!playing||g.player.dead;
    if(panel.classList.contains('hidden'))return;
    text(stats.fires,v.fires.length);text(stats.water,Math.floor(v.water));text(stats.crew,v.crew.length+'/'+v.slots);text(status,v.notice||'Les bâtiments dangereux endommagés et les explosions peuvent provoquer des départs de feu.');
    const profile=v.lastWave&&v.lastWave.wave===g.wave?F.PROFILE_BY_ID[v.lastWave.id]:null;
    text(waveName,profile?profile.name:'Observation des approches');text(waveText,profile?profile.brief:'Le profil sera déterminé au déclenchement d’une nouvelle alerte. Les deux premières vagues restent inchangées.');text(waveAdvice,profile?profile.advice+(v.lastWave.bonus?' Vigie : +7 s accordées au déclenchement de l’alerte.':''):'Préparez vos enceintes et votre réseau de secours.');text(wallRisk,v.vulnerable+' rempart'+(v.vulnerable>1?'s':'')+' fragilisé'+(v.vulnerable>1?'s':'')+' ou chargé de corps. Le déblaiement reste une mission distincte.');
    text(tool,v.tool?'RANGER LE SEAU':'ÉQUIPER LE SEAU');tool.setAttribute('aria-pressed',String(v.tool));tool.disabled=!playing||g.player.dead;text(bucket,'Seau : '+v.playerWater.toFixed(1)+' / 8 unités d’eau.');assign.disabled=!can||v.crew.length>=v.slots||g.workerOrder==='retreat';
    // Preserve focus while quantities change: rebuild only when membership/state labels change.
    const key=JSON.stringify([can,v.fires.map(f=>f.id),v.tanks.map(t=>t.id),v.crew.map(c=>[c.id,c.release,c.job])]);
    if(key!==listKey){listKey=key;
      renderRows(fires,v.fires,'Aucun foyer actif.',f=>{const n=row(f.name+' #'+f.id,'','REJOINDRE',()=>g.siege.selectBuilding(f.id));n.dataset.fireRow=f.id;n.querySelector('button').disabled=!can;return n;});
      renderRows(tanks,v.tanks,'Construisez une citerne pour préparer la réserve.',t=>{const n=row(t.name+' #'+t.id,'','PRENDRE DE L’EAU',()=>g.siege.selectBuilding(t.id));n.dataset.tankRow=t.id;n.querySelector('button').disabled=!can;return n;});
      renderRows(crews,v.crew,'Aucun ouvrier détaché aux secours.',c=>{const n=row('Équipier #'+c.id,'',c.release?'REPLI EN COURS':'RAPPELER',()=>g.siege.release(c.id));n.dataset.crewRow=c.id;n.querySelector('button').disabled=!can||c.release;return n;});
    }
    for(const f of v.fires)text(fires.querySelector(`[data-fire-row="${f.id}"] small`),'Chaleur '+Math.ceil(f.heat)+' · intégrité '+Math.ceil(f.health));
    for(const t of v.tanks)text(tanks.querySelector(`[data-tank-row="${t.id}"] small`),t.water.toFixed(1)+' / 120 unités');
    for(const c of v.crew)text(crews.querySelector(`[data-crew-row="${c.id}"] small`),c.job+' · eau '+c.water.toFixed(1)+'/12');
    for(const [id,card]of profileCards)card.dataset.current=String(id===profile?.id);
    const h=JSON.stringify(v.history);if(h!==historyKey){historyKey=h;log.replaceChildren();const names={ignited:'Départ de feu',extinguished:'Foyer éteint',burnedOut:'Combustible épuisé',destroyed:'Structure incendiée détruite',assigned:'Secouriste affecté',released:'Secouriste revenu au centre',crewLost:'Secouriste perdu',wave:'Nouvelle migration annoncée'};for(const r of [...v.history].reverse())log.appendChild(el('li',(names[r.type]||r.type)+(r.id?' · #'+r.id:'')));if(!v.history.length)log.appendChild(el('li','Aucune intervention consignée.'));}
  }
  g.siegeUI=Object.freeze({open,refresh});refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL SIEGE 1.3 — END */


/* DEADWALL DAYWORKS 1.4 — BEGIN */
/* Host integration. No timers outside the simulation and no extra save slots. */
(function installDayworksRuntime(root){
 'use strict';
 const g=root.DEADWALL,C=root.DeadwallCore,D=root.DeadwallDayworks,R=D?.RULES;
 if(!g||!C||!D)throw new Error('Moteur Aube & Bastions absent.');if(g.dayworks)return;
 let engine=new D.Engine(),worldRef=null,pending=null,tool='none',selectedSite=null,notice='',preview=null,placing=null,braceHit=null,committing=false,passiveWork=false,yards=[],anchorClick=null;
 const wrappedWork=new WeakSet(),wrappedWorld=new WeakSet();
 const live=b=>Boolean(b&&!b.dead&&b.health>0),op=b=>live(b)&&(b.completed===true||b.progress>=1),list=()=>[...g.world.buildings.values()];
 const running=()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay;
 const day=()=>g.phase==='calm',distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const canSpend=cost=>Object.entries(cost).every(([k,n])=>(g.resources[k]||0)>=n),atCore=()=>live(g.player)&&g.core()&&g.workerCanWorkAt(g.player,g.core(),180);
 const wrap=(name,fn)=>{const original=g[name];if(typeof original!=='function')throw new Error('Interface de reconstruction absente : '+name);g[name]=function(...args){return fn(original.bind(g),...args);};};
 const tell=text=>{notice=text;g.dayworksUI?.refresh();return text;};
 function clearLocation(x,y){if(list().some(b=>live(b)&&Math.abs(x-b.x)<b.w*16+R.siteClearance&&Math.abs(y-b.y)<b.h*16+R.siteClearance))return false;
  return !(g.world.nodes||[]).some(n=>!n.depleted&&Math.hypot(n.x-x,n.y-y)<(n.radius||20)+R.siteClearance);
 }
 function ensure(){if(worldRef!==g.world){worldRef=g.world;engine=new D.Engine(pending||undefined);pending=null;tool='none';preview=null;placing=null;selectedSite=null;anchorClick=null;
   engine.initialize(g.world.seed,g.world.sites,clearLocation);
   if(!engine.state.day.wave)engine.state.day={wave:g.wave||1,duration:Math.max(0,Number.isFinite(g.phaseTime)?g.phaseTime:0)};
   installPlacement();wireWork();
  }return engine;}
 function reconcile(){ensure();engine.state.braces=engine.state.braces.filter(b=>op(g.world.buildings.get(b.id))&&g.world.buildings.get(b.id).def.gate&&b.wave===g.wave);if(engine.state.night?.wave!==g.wave)engine.state.night=null;}
 function installPlacement(){if(wrappedWorld.has(g.world))return;const world=g.world,original=world.placement;if(typeof original!=='function')throw new Error('Validation de placement absente.');
  world.placement=function(def,gx,gy,rotation=0,...args){const result=original.call(world,def,gx,gy,rotation,...args);if(!result.valid)return result;
   const w=rotation%2?def.size[1]:def.size[0],h=rotation%2?def.size[0]:def.size[1];
   const blocked=engine.state.sites.find(s=>(s.survey<R.surveySeconds||s.remaining>.001)&&s.x+18>gx*32&&s.x-18<(gx+w)*32&&s.y+18>gy*32&&s.y-18<(gy+h)*32);
   return blocked?{valid:false,reason:'Point de terrain à relever et récupérer avant construction.'}:result;
  };wrappedWorld.add(world);
 }
 function mark(){for(const b of list())b.dayOffline=b.type==='dayGreenhouse'&&!day();}
 function secure(point){return !g.zombies.some(z=>live(z)&&distance(z,point)<R.dangerRadius);}
 function accessible(point,range=R.surveyRange){return distance(g.player,point)<=range&&g.workerCanWorkAt(g.player,point,range);}
 function wireWork(){const structures=list();yards=structures.filter(p=>op(p)&&p.type==='prefabYard'&&p.powered&&!p.siegeOffline&&!p.territoryOffline);for(const b of structures){if(wrappedWork.has(b)||typeof b.work!=='function')continue;const old=b.work;b.work=function(amount){
    if(!Number.isFinite(amount)||amount<=0)return old.call(b,amount);
    let extra=0;
    if(!passiveWork&&running()&&day()&&!b.dead&&b.progress<1&&yards.some(p=>p!==b&&distance(p,b)<=R.prefabRadius)){
     const remaining=Math.max(0,(1-b.progress)*Math.max(1,b.def.buildTime)-amount);
     extra=Math.min(amount*R.prefabBonus,remaining,(g.resources.scrap||0)/R.scrapPerWork,(g.resources.fuel||0)/R.fuelPerWork);
    }
    const before=b.progress,result=old.call(b,amount+extra),done=Math.max(0,(b.progress-before)*Math.max(1,b.def.buildTime));
    const paid=Math.max(0,Math.min(extra,done-amount));if(paid){g.resources.scrap=Math.max(0,g.resources.scrap-paid*R.scrapPerWork);g.resources.fuel=Math.max(0,g.resources.fuel-paid*R.fuelPerWork);engine.state.stats.bonusWork+=paid;}return result;
   };wrappedWork.add(b);}}
 function toolActive(){return tool!=='none'&&!g.siege?.toolActive();}
 function setTool(value='survey'){anchorClick=null;if(!['none','survey','brace'].includes(value)||g.state!=='playing'||g.gameOver||!live(g.player))return false;
  tool=tool===value?'none':value;if(tool!=='none')g.cancelPlacement?.();if(tool!=='none'&&g.siege?.toolActive())g.siege.toggleTool();g.releaseInputs?.();if(g.player)g.player.reload=0;
  tell(tool==='survey'?'Carnet équipé : ACTION relève puis récupère. Rangez-le pour récolter ou construire normalement.':tool==='brace'?'Étais équipés : sélectionnez une porte achevée et maintenez ACTION pendant le calme.':'Outils rangés : interactions ordinaires rétablies.');return true;}
 function focusSite(id){const s=engine.state.sites.find(s=>s.id===id&&s.seen);if(!s||!g.canIssueCommand())return false;selectedSite=id;if(tool!=='survey')setTool('survey');g.showCommand?.(false);tell('Rejoignez '+D.BY_ID[id].name+'. Le relevé se fait sur place.');return true;}
 function syncClock(){g.dayClock=D.clock(g.phase,g.phaseTime,engine.state.day.duration,engine.state.night?engine.state.night.emitted/engine.state.night.total:0);}
 function beginDay(){engine.state.day={wave:g.wave,duration:D.dayDuration(g.wave,g.difficulty?.calmTime||1,C.START_SCENARIOS?.[g.scenarioId]?.calmSeconds??82)};g.phaseTime=engine.state.day.duration;engine.state.night=null;engine.state.braces=engine.state.braces.filter(b=>b.wave===g.wave);syncClock();}
 function finishDay(confirm=false){if(!g.canIssueCommand()||!day()||!atCore())return {ok:false,reason:tell('Revenez près du centre pendant le calme.')};
  const concerns=[];if(g.fieldOperations?.snapshot?.().active)concerns.push('une sortie en cours');if(g.siege?.snapshot().fires.length)concerns.push('un incendie actif');if(g.salvage?.snapshot().crews.length)concerns.push('des récupérateurs encore affectés');if(g.territories?.snapshot().trucks.length)concerns.push('des convois en trajet');if(g.citadel?.overview().active)concerns.push('des escortes en cours');
  if(!confirm)return {ok:false,confirm:true,reason:'Déclencher le crépuscule maintenant ? Aucun chantier ni trajet ne sera terminé à votre place'+(concerns.length?' ; '+concerns.join(', '):'')+'.'};
  g.phaseTime=0;g.save(false);tell('Préparation close : l’alerte débutera à la reprise de la simulation.');return {ok:true};
 }
 function planStatus(id,gx,gy){const p=D.PLANS.find(p=>p.id===id);if(!p)return{ok:false,reason:'Plan inconnu.',cost:{}};
  if(!day()||!g.canIssueCommand())return{ok:false,reason:'Planification réservée au calme diurne.',cost:{}};
  if(!list().some(b=>op(b)&&b.type==='planningOffice'))return{ok:false,reason:'Bureau de chantier achevé requis.',cost:{}};
  if(p.unlock&&!engine.unlocked(p.unlock))return{ok:false,reason:'Croquis de terrain à découvrir.',cost:{}};
  let items;try{items=D.footprint(id,gx,gy);}catch{return{ok:false,reason:'Position invalide.',cost:{}};}
  const result=D.quote(items,C.BUILDINGS,(...args)=>g.world.placement(...args),g.tier.id,type=>g.world.has(type));
  if(result.ok&&!canSpend(result.cost))return{...result,ok:false,items,reason:'Matériaux insuffisants pour financer tout l’ensemble.'};return{...result,items};
 }
 function beginPlan(id){anchorClick=null;const p=D.PLANS.find(p=>p.id===id);if(!p||!g.canIssueCommand()||!day())return false;
  if(!list().some(b=>op(b)&&b.type==='planningOffice')){tell('Bureau de chantier achevé requis.');return false;}
  if(p.unlock&&!engine.unlocked(p.unlock)){tell('Croquis de terrain à découvrir.');return false;}
  g.cancelPlacement?.();tool='none';placing=id;preview=null;g.showCommand?.(false);if(g.paused)g.togglePause?.(false);g.releaseInputs?.();tell('Cliquez au sol pour poser uniquement l’aperçu ; confirmez ensuite le financement dans le carnet. Échap annule.');return true;
 }
 function anchorPlan(id,gx,gy){if(!D.PLANS.some(p=>p.id===id)||!g.canIssueCommand()||!day())return false;anchorClick=null;preview={id,gx,gy};placing=null;const q=planStatus(id,gx,gy);tell(q.ok?'Aperçu valide. Le financement reste à confirmer.':q.reason);return q;}
 function commitPlan(){if(!preview||committing)return false;const q=planStatus(preview.id,preview.gx,preview.gy);if(!q.ok){tell(q.reason);return false;}
  const resources={...g.resources},ids=new Set(g.world.buildings.keys()),stats=structuredClone(g.stats),nextId=g.nextId,nodeStates=(g.world.nodes||[]).map(n=>[n,n.amount,n.depleted]);
  const counts={floaters:g.floaters?.length,particles:g.particles?.length};committing=true;let ok=false;
  try{for(const p of q.items)if(g.placeOne(p.type,p.gx,p.gy,p.rotation)!==true)throw new Error('Un emplacement a changé.');ok=true;}
  catch(error){for(const [id,b]of [...g.world.buildings])if(!ids.has(id))g.world.remove(b);Object.assign(g.resources,resources);g.nextId=nextId;g.stats=stats;for(const [n,a,d]of nodeStates){n.amount=a;n.depleted=d;}for(const [k,n]of Object.entries(counts))if(n!==undefined)g[k].length=n;g.refreshMetrics(true);tell('Financement annulé ; ressources et chantiers restaurés. '+error.message);}
  finally{committing=false;}
  if(ok){engine.state.stats.plans++;const count=q.items.length;preview=null;wireWork();g.save(false);g.audio.build?.();tell(count+' chantiers financés. Joueur et ouvriers doivent les construire ; les passages occupés restent protégés.');}return ok;
 }
 if(typeof g.cancelPlacement==='function')wrap('cancelPlacement',(original,...args)=>{anchorClick=null;placing=null;preview=null;return original(...args);});
 if(typeof g.selectBuild==='function')wrap('selectBuild',(original,...args)=>{anchorClick=null;placing=null;preview=null;tool='none';return original(...args);});
 function buildLocks(){for(const b of g.ui.buildList?.children||[]){const id=b.dataset.buildId;if(!['dayGreenhouse','prefabYard'].includes(id))continue;if(!engine.unlocked(id)){b.disabled=true;b.title='Carnet de terrain requis : '+D.SITES.find(s=>s.unlock===id).name;}}}
 wrap('updateBuildings',(original,...args)=>{const previous=passiveWork;passiveWork=true;try{return original(...args);}finally{passiveWork=previous;}});
 wrap('placeOne',(original,type,...args)=>{ensure();if(['dayGreenhouse','prefabYard'].includes(type)&&!engine.unlocked(type)){g.notify('Relevé de terrain requis.','danger');return false;}const result=original(type,...args);if(result)wireWork();return result;});
 wrap('refreshBuildMenu',(original,...args)=>{ensure();const result=original(...args);buildLocks();return result;});
 wrap('refreshBuildAffordability',(original,...args)=>{const result=original(...args);buildLocks();return result;});
 wrap('updateDirector',(original,dt)=>{ensure();const prior=g.phase,wave=g.wave,result=original(dt);if(prior==='aftermath'&&g.phase==='calm'&&g.wave!==wave)beginDay();if(prior==='calm'&&g.phase==='warning'){if(tool!=='none'||placing||preview){anchorClick=null;tool='none';placing=null;preview=null;g.input.keys.delete('KeyE');g.input.mouseDown=false;g.input.touchFire=false;g.notify('Crépuscule : outils de journée rangés, armes disponibles.');}}mark();syncClock();return result;});
 wrap('startAssault',(original,...args)=>{ensure();const result=original(...args);engine.state.night=D.beginNight(g.wave,g.wavePlan.total,g.fronts.slice());return result;});
 wrap('spawnZombie',(original,kind)=>{ensure();const n=engine.state.night;if(!n||n.wave!==g.wave||g.phase!=='assault')return original(kind);const fronts=g.fronts;let result;
  try{g.fronts=D.frontGroup(n,g.siege?.assaultPattern());result=original(kind);}finally{g.fronts=fronts;}
  if(result===true&&D.emitted(n)){g.spawnTimer=Math.max(0,g.spawnTimer)+R.echelonPause;g.notify('Une accalmie dans les arrivées, pas la fin de l’assaut : restez aux lignes.');}return result;
 });
 wrap('damageZombieBuilding',(original,z,b,amount)=>{const previous=braceHit;braceHit=b;try{return original(z,b,amount);}finally{braceHit=previous;}});
 wrap('damageBuilding',(original,b,amount)=>original(b,braceHit===b?engine.absorb(b.id,g.wave,amount):amount));
 wrap('destroyBuilding',(original,...args)=>{const result=original(...args);reconcile();return result;});
 wrap('serialize',(original,...args)=>{reconcile();return {...original(...args),dayworks:engine.snapshot()};});
 wrap('restoreSave',(original,input)=>{anchorClick=null;const data=root.DeadwallSave.validate(input),before=g.world;pending=D.normalize(data.dayworks);try{return original(data);}finally{if(g.world!==before){ensure();reconcile();mark();syncClock();}pending=null;}});
 wrap('startNew',(original,...args)=>{anchorClick=null;const before=g.world,result=original(...args);if(g.world!==before){ensure();beginDay();mark();g.save(false);g.dayworksUI?.refresh();}return result;});
 wrap('damagePlayer',(original,...args)=>{const result=original(...args);if(!live(g.player))anchorClick=null;return result;});
 wrap('triggerGameOver',(original,...args)=>{anchorClick=null;return original(...args);});
 wrap('returnToMenu',(original,...args)=>{anchorClick=null;return original(...args);});
 wrap('update',(original,dt)=>{if(g.state!=='playing'||g.gameOver||!live(g.player))anchorClick=null;ensure();wireWork();mark();const result=original(dt);if(!live(g.player))anchorClick=null;if(!running()||!Number.isFinite(dt)||dt<=0)return result;dt=Math.min(dt,R.maxStep);
  if(live(g.player)){
   const found=engine.discover(g.player,s=>g.hostileLineClear(g.player,s));if(found)g.notify(found+' point'+(found>1?'s':'')+' de terrain repéré'+(found>1?'s':'')+'. Consultez le carnet.');
   if(day()&&secure(g.player)&&list().some(b=>op(b)&&b.type==='restShelter'&&!b.siegeOffline&&!b.territoryOffline&&accessible(b,R.restRadius))){
    const hp=Math.min(Math.max(0,(g.player.maxHealth||100)-g.player.health),dt*R.restHeal,(g.resources.food||0)/R.foodPerHealth);g.player.health+=hp;g.resources.food=Math.max(0,g.resources.food-hp*R.foodPerHealth);engine.state.stats.foodSpent+=hp*R.foodPerHealth;
    g.player.stamina=Math.min(g.player.maxStamina||100,(g.player.stamina??100)+dt*R.restStamina);
   }
  }else tool='none';
  reconcile();mark();syncClock();return result;
 });
 wrap('updateUI',(original,...args)=>{ensure();const result=original(...args);g.dayworksUI?.refresh();return result;});
 wrap('updateInteraction',(original,dt)=>{
  if(!toolActive()||!running()||!live(g.player)||g.selectedBuild||g.rallyPlacement)return original(dt);
  if(!day()){g.interactionText='Le relevé et les étais se préparent au calme. Rangez l’outil pour combattre.';return;}
  if(tool==='brace'){
   const b=g.selectedBuilding;if(!op(b)||!b.def.gate){g.interactionText='Sélectionnez une porte achevée pour préparer ses étais.';return;}
   const point=g.siege?.service(g.player,b),near=point?.at;
   g.interactionText=!near?'Rejoignez la face accessible de la porte.':!secure(b)?'Infectés proches : sécurisez le chantier.':!canSpend(R.braceCost)?'Étais : 12 bois et 8 ferraille requis.':'ACTION / E : étayer la porte (8 s), pour la prochaine nuit uniquement.';
   if(g.input.keys.has('KeyE')&&engine.reinforce(b.id,g.wave,Math.min(dt,R.maxStep),{running:true,day:true,accessible:near,secure:secure(b),resources:g.resources,dead:false})){g.notify('Porte étayée : absorption de 20 % des coups, réserve de 120 dégâts pour cette nuit.','good');g.save(false);}return;
  }
  const choices=engine.state.sites.filter(s=>s.seen&&(s.survey<R.surveySeconds||s.remaining>.001)&&accessible(s)).sort((a,b)=>distance(g.player,a)-distance(g.player,b));
  const s=choices.find(s=>s.id===selectedSite)||choices[0];if(!s){g.interactionText='Carnet : rejoignez un point repéré. Rangez le carnet pour les actions ordinaires.';return;}
  const spec=D.BY_ID[s.id];g.interactionText=!secure(s)?'Infectés proches : sécurisez les abords.':s.survey<R.surveySeconds?'ACTION / E : relever '+spec.name+' · '+s.survey.toFixed(1)+'/6 s':'ACTION / E : récupérer '+spec.name+' · '+s.remaining.toFixed(1)+' '+C.RESOURCE_META[spec.resource].label.toLowerCase();
  if(g.input.keys.has('KeyE')){const r=engine.explore(s.id,Math.min(dt,R.maxStep),{running:true,day:true,accessible:true,secure:secure(s),dead:false,bag:g.player.carry,capacity:g.player.carryCapacity});if(r.completed){g.notify(r.unlock?'Relevé terminé : nouveau plan disponible.':'Relevé terminé : les fournitures peuvent être récupérées.','good');g.refreshBuildMenu(true);g.save(false);}if(r.taken)g.stats.gathered+=r.taken;}
 });
 for(const name of ['shootPlayer','melee','startReload'])wrap(name,(original,...args)=>toolActive()?false:original(...args));
 if(typeof g.onEscape==='function')wrap('onEscape',(original,...args)=>{anchorClick=null;if(placing||preview){placing=null;preview=null;tell('Projet annulé sans dépense.');return;}return original(...args);});
 function drawSites(ctx){const view=g.viewBounds();for(const s of engine.state.sites){if(!s.seen||!g.visible(s.x,s.y,40,view))continue;const found=s.survey>=6;
   if(root.DeadwallReconArt){const overlap=[[-18,-18],[18,-18],[-18,18],[18,18],[0,0]].some(([x,y])=>{const b=g.world.at(s.x+x,s.y+y);return b&&!b.dead;});if(!overlap)root.DeadwallReconArt.draw(ctx,s,{selected:selectedSite===s.id,label:selectedSite===s.id});continue;}
   if(found&&s.remaining<=.001)continue;
   ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=found?'#8e9f74':'#b9ab7b';ctx.fillRect(-12,-9,24,18);ctx.strokeStyle='#343e34';ctx.lineWidth=2;ctx.strokeRect(-12,-9,24,18);ctx.beginPath();ctx.moveTo(-8,-9);ctx.lineTo(-8,9);ctx.moveTo(8,-9);ctx.lineTo(8,9);ctx.stroke();
   ctx.strokeStyle=selectedSite===s.id?'#ffe3a1':'rgba(210,212,175,.5)';ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.font='bold 10px sans-serif';ctx.fillStyle='#f1e6bb';ctx.textAlign='center';ctx.fillText(found?C.RESOURCE_META[D.BY_ID[s.id].resource].label:'RELEVÉ',0,-34);ctx.restore();
  }}
 function drawPlan(ctx){const p=preview||(placing?{id:placing,gx:Math.floor(g.input.mouseWorldX/32),gy:Math.floor(g.input.mouseWorldY/32)}:null);if(!p)return;let items;try{items=D.footprint(p.id,p.gx,p.gy);}catch{return;}ctx.save();for(const i of items){const d=C.BUILDINGS[i.type];if(!d)continue;ctx.fillStyle=i.type==='gate'?'rgba(122,192,183,.4)':'rgba(218,190,111,.25)';ctx.strokeStyle='#d8c18a';ctx.lineWidth=1;ctx.fillRect(i.gx*32,i.gy*32,d.size[0]*32,d.size[1]*32);ctx.strokeRect(i.gx*32,i.gy*32,d.size[0]*32,d.size[1]*32);}ctx.restore();}
 if(typeof g.drawGround==='function')wrap('drawGround',(original,ctx,...args)=>{const result=original(ctx,...args);drawSites(ctx);drawPlan(ctx);return result;});
 if(typeof g.drawBuilding==='function')wrap('drawBuilding',(original,ctx,b,...args)=>{const result=original(ctx,b,...args),brace=engine.state.braces.find(r=>r.id===b.id&&r.hp>0);if(brace){ctx.save();ctx.strokeStyle='#d5b775';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(b.x-20,b.y-12);ctx.lineTo(b.x+20,b.y+12);ctx.moveTo(b.x+20,b.y-12);ctx.lineTo(b.x-20,b.y+12);ctx.stroke();ctx.restore();}return result;});
 if(g.art?.drawBuilding){const prior=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(ctx,b,world)=>{if(!D.BUILDINGS[b.type])return prior(ctx,b,world);const w=b.def.size[0]*32,h=b.def.size[1]*32;ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.rotation||0)*Math.PI/2);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-w/2+5,-h/2+6,w,h);
   if(b.type==='dayGreenhouse'){ctx.fillStyle=b.dayOffline?'#354a42':'#668d75';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#bbcabc';ctx.lineWidth=3;for(let i=0;i<5;i++)ctx.strokeRect(-w/2+i*w/5,-h/2,w/5,h);ctx.fillStyle='#335b36';for(let i=0;i<4;i++)ctx.fillRect(-w/2+9,-h/2+10+i*20,w-18,9);}
   else if(b.type==='prefabYard'){ctx.fillStyle='#686b5b';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#b1976b';for(let i=0;i<4;i++)ctx.fillRect(-w/2+8,7+i*8,w-24,5);ctx.strokeStyle='#d3bd78';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-w/2+10,h/2);ctx.lineTo(-w/2+10,-h/2);ctx.lineTo(w/2-10,-h/2);ctx.lineTo(w/2-10,h/2);ctx.stroke();}
   else if(b.type==='restShelter'){ctx.fillStyle='#7c8662';ctx.beginPath();ctx.moveTo(-w/2,h/2);ctx.lineTo(0,-h/2-12);ctx.lineTo(w/2,h/2);ctx.fill();ctx.fillStyle='#303f32';ctx.fillRect(-12,0,24,h/2);ctx.strokeStyle='#cab889';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-h/2-12);ctx.lineTo(-w/2,h/2);ctx.lineTo(w/2,h/2);ctx.closePath();ctx.stroke();}
   else{ctx.fillStyle='#78806b';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#c4be9c';ctx.fillRect(-w/2+10,-h/2+10,w-20,h-20);ctx.strokeStyle='#4e6660';ctx.lineWidth=1;for(let i=0;i<4;i++)ctx.strokeRect(-w/2+16+i*15,-h/2+15,12,h-30);}
   ctx.restore();return true;};}
 if(typeof g.drawThreatArrows==='function')wrap('drawThreatArrows',(original,...args)=>{const result=original(...args),s=engine.state.sites.find(s=>s.id===selectedSite&&s.seen);if(!s||!live(g.player)||distance(g.player,s)<100)return result;const ctx=g.ctx,dx=(s.x-g.camera.x)*g.camera.zoom,dy=(s.y-g.camera.y)*g.camera.zoom,halfW=Math.max(1,g.width/2-70),halfH=Math.max(1,g.height/2-100),scale=Math.min(1,halfW/Math.max(1,Math.abs(dx)),halfH/Math.max(1,Math.abs(dy)));if(scale===1)return result;const x=g.width/2+dx*scale,y=g.height/2+dy*scale;ctx.save();ctx.setTransform(g.dpr||1,0,0,g.dpr||1,0,0);ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.fillStyle='#e1c57d';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-7);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.rotate(-Math.atan2(dy,dx));ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('RELEVÉ · '+Math.round(distance(g.player,s)),0,23);ctx.restore();return result;});
 function overview(){reconcile();return {day:day(),phase:g.phase,remaining:g.phaseTime,duration:engine.state.day.duration,sites:engine.state.sites.filter(s=>s.seen).map(s=>({...s,...D.BY_ID[s.id],distance:distance(g.player,s)})),known:engine.state.sites.filter(s=>s.seen).length,total:18,tool,preview:preview?{...preview,quote:planStatus(preview.id,preview.gx,preview.gy)}:null,placing,braces:engine.state.braces.map(b=>({...b,name:g.world.buildings.get(b.id)?.def.name})),night:engine.state.night,stats:{...engine.state.stats},notice,unlocked:D.PLANS.filter(p=>!p.unlock||engine.unlocked(p.unlock)).map(p=>p.id)};}
 function recoverForWorker(u,id,dt){
  ensure();const s=engine.state.sites.find(s=>s.id===id),spec=D.BY_ID[id];
  if(!s||!spec||s.survey!==R.surveySeconds||!s.seen||!running()||!day()||!live(u)||u.kind!=='worker'||!g.units.includes(u)||!g.salvage?.snapshot().crews.some(c=>c.id===u.id&&c.site===id&&!c.returning)||!Number.isFinite(u.carry)||!Number.isFinite(dt)||dt<=0||dt>C.Salvage.RULES.maxStep)return 0;
  if(!g.workerCanWorkAt(u,s,C.Salvage.RULES.range)||g.zombies.some(z=>live(z)&&((distance(z,u)<C.Salvage.RULES.dangerRadius&&g.hostileLineClear(z,u))||(distance(z,s)<C.Salvage.RULES.dangerRadius&&g.hostileLineClear(z,s))))||u.carry>0&&u.carryType!==spec.resource)return 0;
  const n=Math.min(s.remaining,Math.max(0,u.maxCarry-u.carry),dt*C.Salvage.RULES.rate);if(!(n>0))return 0;
  s.remaining=Math.max(0,s.remaining-n);u.carry+=n;u.carryType=spec.resource;engine.state.stats.salvaged+=n;return n;
 }
 g.dayworks=Object.freeze({version:'1.4.0-candidate.1',snapshot:()=>{reconcile();return engine.snapshot();},recoverForWorker,overview,workContext:()=>({tool,placing:Boolean(placing),preview:Boolean(preview)}),setTool,focusSite,beginPlan,anchorPlan,planStatus,commitPlan,cancelPlan:()=>{anchorClick=null;preview=null;placing=null;tell('Projet annulé sans dépense.');},finishDay,open:()=>{g.showCommand?.(true,'field');g.dayworksUI?.open();},drawSites,drawPlan});
 const canvas=g.canvas||g.ctx?.canvas;
 const doc=canvas?.ownerDocument||root.document;
 if(doc){
  doc.addEventListener('pointerdown',()=>{anchorClick=null;},true);
  doc.addEventListener('pointercancel',event=>{if(anchorClick?.pointerId===event.pointerId)anchorClick=null;},true);
  doc.addEventListener('click',event=>{
   const gesture=anchorClick;if(!gesture||event.detail===0)return;anchorClick=null;
   // The finger can finish on a control that appeared after its canvas down.
   // Consume only that gesture's click, including a retargeted finance button.
   if(event.pointerId!==gesture.pointerId||event.pointerType!==gesture.pointerType||gesture.world!==g.world||gesture.preview!==preview||g.state!=='playing'||g.gameOver||!live(g.player))return;
   event.preventDefault();event.stopImmediatePropagation();
  },true);
 }
 if(canvas)for(const eventName of ['mousedown','pointerdown'])canvas.addEventListener(eventName,event=>{
  if(!placing||!running()||eventName==='pointerdown'&&event.pointerType==='mouse')return;if(eventName==='mousedown'&&event.button===2){event.preventDefault();event.stopImmediatePropagation();placing=null;preview=null;tell('Aperçu annulé sans dépense.');return;}if(eventName==='mousedown'&&event.button!==0)return;
  event.preventDefault();event.stopImmediatePropagation();g.input.mouseDown=false;
  const rect=canvas.getBoundingClientRect(),px=(event.clientX-rect.left)*g.width/Math.max(1,rect.width),py=(event.clientY-rect.top)*g.height/Math.max(1,rect.height);const x=(px-g.width/2)/g.camera.zoom+g.camera.x,y=(py-g.height/2)/g.camera.zoom+g.camera.y;
  anchorPlan(placing,Math.floor(x/32),Math.floor(y/32));
  if(preview&&live(g.player)&&eventName==='pointerdown'&&['touch','pen'].includes(event.pointerType)&&Number.isInteger(event.pointerId))anchorClick={pointerId:event.pointerId,pointerType:event.pointerType,world:g.world,preview};
  g.dayworks.open();
 },true);
 ensure();mark();syncClock();
})(typeof globalThis!=='undefined'?globalThis:this);

(function mountDayworksUI(root){
 'use strict';const g=root.DEADWALL,D=root.DeadwallDayworks,C=root.DeadwallCore;if(!g?.dayworks||!root.document)return;
 function mount(){const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
  const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;},text=(n,s)=>{if(n.textContent!==String(s))n.textContent=String(s);};
  const button=(label,fn,id)=>{const b=el('button',label);b.type='button';if(id)b.id=id;b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]'))fn();});return b;};
  const style=el('style');style.textContent=`
  .dw14{--ink:#e9e5d4;--muted:#bac4b3;--edge:#526455;color:var(--ink);padding:10px 2px 24px;box-sizing:border-box;max-width:100%}.dw14 *{box-sizing:border-box}.dw14 h2{font-size:32px;letter-spacing:-.02em;margin:9px 0}.dw14 h3{font-size:18px;margin:0 0 10px}.dw14 p{font-size:13px;line-height:1.6;color:var(--muted);margin:8px 0}.dw14 small{font-size:11px;color:#d8bd7c;letter-spacing:.04em}.dw14-hero{display:grid;grid-template-columns:1.7fr 1fr;gap:18px;padding:24px;border:1px solid #8c875e;border-radius:12px;background:linear-gradient(125deg,#3b4532,#192c27);margin-bottom:16px}.dw14[data-night=true] .dw14-hero{background:linear-gradient(125deg,#28313b,#192624);border-color:#5c7580}.dw14-kpi{display:flex;gap:10px;align-items:stretch}.dw14-kpi div{padding:12px;border:1px solid #5c6a55;border-radius:8px;flex:1}.dw14-kpi strong{display:block;font-size:26px}.dw14-time{height:6px;background:#101e18;border-radius:4px;margin-top:14px;overflow:hidden}.dw14-time i{display:block;background:#d2b574;height:100%;width:0}.dw14-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.dw14-box{padding:19px;border:1px solid var(--edge);border-radius:9px;background:#1a2a23;min-width:0}.dw14-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.dw14 button{border:1px solid #687a60;background:#2c4032;color:#f0e8cc;min-height:44px;border-radius:5px;padding:9px 12px;font-size:12px;cursor:pointer}.dw14 button:disabled{opacity:.48;cursor:not-allowed}.dw14 button[aria-pressed=true]{border-color:#dbbc72;background:#52613d}.dw14 button:focus-visible,.dw14 summary:focus-visible{outline:3px solid #e1c77d;outline-offset:3px}.dw14-plans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}.dw14-plan{border:1px solid var(--edge);padding:15px;border-radius:8px;min-width:0}.dw14-plan strong{display:block;margin:6px 0}.dw14-plan button{width:100%;margin-top:8px}.dw14-wide{grid-column:1/-1}.dw14-preview{padding:15px;background:#33412c;border:1px solid #c2ad6e;border-radius:7px;margin:12px 0}.dw14-preview p{color:#e2d4b0}.dw14-discoveries{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.dw14-site{padding:16px;border:1px solid var(--edge);border-radius:7px;background:#1c2b24}.dw14-site[data-complete=true]{border-color:#7c9b71}.dw14-site strong{display:block;font-size:15px;margin:5px 0}.dw14-site button{margin-top:10px}.dw14-row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #475744;padding:12px 0;font-size:13px}.dw14-status{border-left:3px solid #cfb773;padding:10px 14px;background:#27392c;color:#e2dfc9!important;min-height:44px}.dw14 details{border:1px solid var(--edge);padding:14px;border-radius:7px;margin:12px 0}.dw14 summary{cursor:pointer;color:#e5d6ad;font-size:13px}.dw14-confirm{border-color:#c99464!important}.dw14-hud{width:100%;text-align:left;background:#30422c;color:#ece5c9;border:1px solid #8b8a5e;padding:9px 12px;border-radius:5px;cursor:pointer;margin-top:6px;min-height:46px}.dw14-hud strong,.dw14-hud small{display:block}.dw14-hud small{font-size:10px;opacity:.9;margin-top:4px}.dw14 .hidden{display:none!important}@media(max-width:720px){.dw14-hero,.dw14-grid,.dw14-plans,.dw14-discoveries{grid-template-columns:1fr}.dw14-hero{padding:18px}.dw14 h2{font-size:25px}.dw14 button{min-height:46px}.dw14-wide{grid-column:auto}.dw14-box{padding:15px}}`;
  document.head.appendChild(style);
  const panel=el('section',undefined,'dw14 hidden');panel.id='dayworksPanel';const tab=button('JOURNÉE & BASTIONS',()=>open(),'dayworksTab');tab.setAttribute('aria-pressed','false');nav.appendChild(tab);field.appendChild(panel);
  const hero=el('header',undefined,'dw14-hero'),copy=el('div'),eyebrow=el('small','D-17 / AUBE & BASTIONS'),title=el('h2','Bâtir avant la nuit'),subtitle=el('p','Explorez les abords, ramenez les matériaux et préparez plusieurs lignes. Chaque nouveau chantier reste une dépense et un travail réel.');copy.append(eyebrow,title,subtitle);hero.appendChild(copy);
  const metrics=el('div'),kpi=el('div',undefined,'dw14-kpi'),timeBlock=el('div'),foundBlock=el('div'),timer=el('strong'),found=el('strong');timeBlock.append(el('small','CALME RESTANT'),timer);foundBlock.append(el('small','POINTS REPÉRÉS'),found);kpi.append(timeBlock,foundBlock);const progress=el('div',undefined,'dw14-time'),fill=el('i');progress.appendChild(fill);metrics.append(kpi,progress);hero.appendChild(metrics);panel.appendChild(hero);
  const status=el('p',undefined,'dw14-status');status.id='dayworksStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.appendChild(status);
  const grid=el('div',undefined,'dw14-grid'),tools=el('article',undefined,'dw14-box'),schedule=el('article',undefined,'dw14-box');grid.append(tools,schedule);panel.appendChild(grid);
  tools.append(el('h3','Sur le terrain'),el('p','Le carnet prend la main sur ACTION. Les outils restent distincts du sac et du seau incendie ; rangez-les pour les interactions ordinaires.'));
  const actions=el('div',undefined,'dw14-actions'),survey=button('ÉQUIPER LE CARNET',()=>g.dayworks.setTool('survey'),'dayworksSurvey'),brace=button('PRÉPARER DES ÉTAIS',()=>g.dayworks.setTool('brace'),'dayworksBrace'),stow=button('RANGER LES OUTILS',()=>g.dayworks.setTool('none'),'dayworksStow');actions.append(survey,brace,stow);tools.appendChild(actions);const toolNotice=el('p');tools.appendChild(toolNotice);
  schedule.append(el('h3','Clore la préparation'),el('p','La journée donne du temps pour sortir et construire. Une fin anticipée déclenche l’alerte à la reprise ; elle ne termine ni les chantiers ni les transports.'));
  const finish=button('PRÉPARER LE CRÉPUSCULE',()=>{const r=g.dayworks.finishDay();text(status,r.reason);confirm.classList.toggle('hidden',!r.confirm);},'dayworksFinish');
  const confirm=button('CONFIRMER · METTRE FIN AU CALME',()=>{const r=g.dayworks.finishDay(true);text(status,r.reason||'Crépuscule engagé. Fermez le commandement pour reprendre.');confirm.classList.add('hidden');refresh();},'dayworksFinishConfirm');confirm.className='hidden dw14-confirm';schedule.append(finish,confirm);
  const project=el('article',undefined,'dw14-box dw14-wide');project.append(el('small','BUREAU DE CHANTIER'),el('h3','Préparer une nouvelle ligne'),el('p','L’aperçu ne prélève rien. La validation contrôle chaque cellule, tous les coûts et les prérequis avant de financer les chantiers. Les enceintes ne sont jamais construites d’un clic.'));
  const plans=el('div',undefined,'dw14-plans'),planButtons=new Map();for(const p of D.PLANS){const card=el('div',undefined,'dw14-plan');card.append(el('small',p.w+' × '+p.h+' CELLULES'),el('strong',p.name),el('p',p.description));const b=button('PLACER UN APERÇU',()=>g.dayworks.beginPlan(p.id),'plan-'+p.id);card.appendChild(b);plans.appendChild(card);planButtons.set(p.id,b);}project.appendChild(plans);
  const preview=el('div',undefined,'dw14-preview hidden'),previewText=el('p'),buy=button('FINANCER TOUS LES CHANTIERS',()=>g.dayworks.commitPlan(),'dayworksCommit'),cancel=button('ANNULER L’APERÇU',()=>g.dayworks.cancelPlan(),'dayworksCancel');preview.append(previewText,buy,cancel);project.appendChild(preview);grid.appendChild(project);
  const briefing=el('details',undefined,'dw14-wide');briefing.append(el('summary','Ce que les quatre bâtiments ajoutent à la journée'),el('p','Bureau de chantier : ensembles à financer. Halte : soins lents sur place contre nourriture, et récupération d’endurance hors danger. Serre : production au calme, arrêt à l’alerte et la nuit. Aire de préfabrication : +25 % sur le travail manuel ou ouvrier des chantiers proches, contre ferraille et carburant ; aucun bonus sur la progression passive. La serre et l’aire demandent leurs relevés de terrain.'));grid.appendChild(briefing);
  const night=el('article',undefined,'dw14-box dw14-wide');night.append(el('small','TENIR APRÈS LE CRÉPUSCULE'),el('h3','Étais et échelons nocturnes'));const nightText=el('p'),braceList=el('div');night.append(nightText,el('p','Une porte étayée pendant le jour absorbe 20 % des coups d’infectés, jusqu’à 120 dégâts pour cette nuit. Huit secondes de travail et 12 bois + 8 ferraille sont requis. Ni les incendies ni les explosions ne sont absorbés. Les étais expirent à la prochaine aube.'),braceList);grid.appendChild(night);
  const discovery=el('article',undefined,'dw14-box dw14-wide');discovery.append(el('small','EXPLORATION LOCALE'),el('h3','Les traces du jour'),el('p','Approchez les six quartiers pour repérer dix-huit petits lieux. Relever prend six secondes actives, puis les matériaux passent dans le véritable sac. Un dépôt au centre ou à l’entrepôt reste nécessaire. Aucun stock ne réapparaît à l’aube.'));
  const sites=el('div',undefined,'dw14-discoveries');discovery.appendChild(sites);grid.appendChild(discovery);
  const hud=button('',()=>g.dayworks.open(),'dayworksHud');hud.className='dw14-hud';const hudTitle=el('strong'),hudInfo=el('small');hud.append(hudTitle,hudInfo);g.ui.rightPanel?.appendChild(hud);
  let members='',bracesKey='';const siteRows=new Map();
  function open(){for(const s of field.children)if(s.tagName==='SECTION')s.classList.toggle('hidden',s!==panel);for(const b of nav.children)b.setAttribute('aria-pressed',String(b===tab));confirm.classList.add('hidden');refresh();}
  function refresh(){const v=g.dayworks.overview(),playing=g.state==='playing'&&!g.gameOver,can=g.canIssueCommand();hud.classList.toggle('hidden',!playing);
   text(hudTitle,v.day?'JOUR · '+C.formatTime(v.remaining):v.phase==='warning'?'CRÉPUSCULE':'NUIT · TENIR LES LIGNES');text(hudInfo,v.known+'/18 traces · '+v.braces.filter(b=>b.hp>0).length+' portes étayées');
   if(panel.classList.contains('hidden'))return;panel.dataset.night=String(!v.day);text(title,v.day?'Bâtir avant la nuit':'Tenir jusqu’à l’aube');text(timer,v.day?C.formatTime(v.remaining):'—');text(found,v.known+'/18');fill.style.width=(v.day?clamp(v.remaining/Math.max(1,v.duration)*100):0)+'%';text(status,v.notice||'Le calme ne dure pas indéfiniment. Ramenez les équipes avant le soir.');
   survey.disabled=brace.disabled=stow.disabled=!playing||g.player.dead;survey.setAttribute('aria-pressed',String(v.tool==='survey'));brace.setAttribute('aria-pressed',String(v.tool==='brace'));text(toolNotice,v.tool==='survey'?'CARNET : ACTION / E relève et récupère sur place.':v.tool==='brace'?'ÉTAIS : sélectionnez une porte achevée, rejoignez sa face accessible et maintenez ACTION.':'Les armes et actions habituelles sont disponibles.');finish.disabled=!can||!v.day;confirm.disabled=!can||!v.day;
   for(const [id,b]of planButtons){b.disabled=!can||!v.day||!v.unlocked.includes(id);text(b,v.unlocked.includes(id)?'PLACER UN APERÇU':'CROQUIS À DÉCOUVRIR');}
   preview.classList.toggle('hidden',!v.preview);if(v.preview){const q=v.preview.quote;text(previewText,D.PLANS.find(p=>p.id===v.preview.id).name+' · '+(q.items?.length||0)+' chantiers · '+C.resourceText(q.cost)+(q.ok?' — prêt à financer.':' — '+q.reason));buy.disabled=!q.ok||!can;cancel.disabled=!can;}
   const n=v.night;text(nightText,n?'Échelon '+Math.min(3,Math.floor(n.emitted*3/n.total)+1)+'/3 · '+n.emitted+'/'+n.total+' arrivées. Les infectés déjà présents restent actifs pendant les six secondes entre échelons.':'À partir de la vague 4, les arrivées se distribuent en trois échelons utilisant les fronts annoncés. Six secondes séparent leurs départs ; le total, les points de vie et le plafond des hordes restent inchangés.');
   const bk=JSON.stringify(v.braces.map(b=>[b.id,Math.ceil(b.hp),Math.ceil(b.work)]));if(bk!==bracesKey){bracesKey=bk;braceList.replaceChildren();for(const b of v.braces){const r=el('div',undefined,'dw14-row');r.append(el('strong',b.name+' #'+b.id),el('span',b.work<8?'Montage '+b.work.toFixed(1)+'/8 s':Math.ceil(b.hp)+'/120 absorption'));braceList.appendChild(r);}}
   const key=v.sites.map(s=>s.id).join(',');if(key!==members){members=key;sites.replaceChildren();siteRows.clear();if(!v.sites.length)sites.appendChild(el('p','Aucun lieu repéré. Explorez les abords des quartiers ; aucun déplacement instantané n’est proposé.'));
    for(const s of v.sites){const row=el('div',undefined,'dw14-site'),name=el('strong',s.name),detail=el('p'),go=button('REJOINDRE À PIED',()=>g.dayworks.focusSite(s.id),'site-'+s.id);row.append(el('small',s.theme.toUpperCase()),name,el('p',s.text),detail,go);sites.appendChild(row);siteRows.set(s.id,{row,detail,go});}
   }
   for(const s of v.sites){const r=siteRows.get(s.id);r.row.dataset.complete=String(s.survey>=6);text(r.detail,Math.round(s.distance)+' unités · '+(s.survey<6?'Relevé '+s.survey.toFixed(1)+'/6 s':s.remaining.toFixed(1)+' '+C.RESOURCE_META[s.resource].label.toLowerCase()+' à rapporter'));r.go.disabled=!can||s.survey>=6&&s.remaining<=.001;}
  }
  const clamp=v=>Math.max(0,Math.min(100,v));g.dayworksUI=Object.freeze({open,refresh});refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL DAYWORKS 1.4 — END */


/* DEADWALL CITADEL 1.5 — BEGIN */
/* Runtime adapters use real host units, movement, damage, buildings and resource ownership. */
(function installCitadelRuntime(root){
  'use strict';
  const g=root.DEADWALL,C=root.DeadwallCore,D=root.DeadwallCitadel,R=D?.RULES;
  if(!g||!C||!D)throw Error('Moteur de cité absent.');if(g.citadel)return;
  let engine=new D.Engine(),worldRef=null,pending=null,inspection=0,notice='',selected=null,enlisting=false;
  const wiredWorlds=new WeakSet(),wiredBuildings=new WeakSet();
  const live=o=>Boolean(o&&!o.dead&&o.health>0),op=b=>live(b)&&(b.completed||b.progress>=1);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const structures=()=>[...g.world.buildings.values()];
  const running=()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay;
  const wrap=(name,fn)=>{const old=g[name];if(typeof old!=='function')throw Error('Interface de cité absente : '+name);g[name]=function(...args){return fn(old.bind(g),...args);};};
  const tell=(message,tone=null)=>{notice=message;if(tone){g.notify(message,tone);g.audio?.ui();}g.citadelUI?.refresh(true);return message;};
  function ensure(){
    if(worldRef!==g.world){worldRef=g.world;engine=new D.Engine(pending||undefined);pending=null;inspection=0;selected=null;notice='';wireWork();}
    return engine;
  }
  function isEscort(id){ensure();return engine.state.calls.some(s=>D.ACTIVE.includes(s.status)&&s.unitId===id);}
  function reconcile(){ensure();
    for(const s of engine.state.calls)if(D.ACTIVE.includes(s.status)&&!live(g.units.find(u=>u.id===s.unitId)))engine.finish(s.id,false,g.elapsed);
    engine.state.suspended=engine.state.suspended.filter(id=>{const b=g.world.buildings.get(id);return live(b)&&!b.completed&&b.progress<1;});
  }
  function wireWork(){
    const w=g.world;
    if(!wiredWorlds.has(w)&&typeof w.incomplete==='function'){
      const old=w.incomplete;w.incomplete=function(){return old.call(w).filter(b=>!engine.state.suspended.includes(b.id));};wiredWorlds.add(w);
    }
    for(const b of structures())if(typeof b.work==='function'&&!wiredBuildings.has(b)){
      const old=b.work;b.work=function(amount){if(engine.state.suspended.includes(b.id))return false;return old.call(b,amount);};wiredBuildings.add(b);
    }
  }
  function signal(id){const site=(g.world.sites||[]).find(s=>s.theme===id);return site?{x:site.x,y:site.y}:null;}
  function spawnPoint(id){const s=signal(id);if(!s)return null;const radius=C.SURVIVORS?.[D.BY_ID[id]?.kind]?.radius||11;
    for(const r of [0,32,64,96])for(let i=0;i<(r?8:1);i++){const p={x:s.x+Math.cos(i*Math.PI/4)*r,y:s.y+Math.sin(i*Math.PI/4)*r};
      if(p.x<radius+4||p.y<radius+4||p.x>4096-radius-4||p.y>4096-radius-4)continue;
      if(g.friendlyPositionClear({radius},p.x,p.y)&&g.workerCanWorkAt(g.player,p,R.contactRange))return p;
    }return null;
  }
  function secure(point){return !g.zombies.some(z=>live(z)&&distance(z,point)<R.dangerRange&&g.hostileLineClear(z,point));}
  function context(id){const p=spawnPoint(id),point=signal(id);
    return{command:g.canIssueCommand(),day:g.phase==='calm',dead:!live(g.player),accessible:Boolean(p&&point&&distance(g.player,point)<=R.contactRange),
      secure:Boolean(point&&secure(point)&&secure(g.player)),tier:g.tier.id,has:type=>g.world.has(type),population:1+g.units.filter(live).length,housing:g.housing,
      resources:g.resources,point:p};
  }
  function status(id){ensure();return D.enlistStatus(engine.state,id,context(id));}
  function enlist(id){
    reconcile();const ctx=context(id),check=D.enlistStatus(engine.state,id,ctx);if(!check.ok)return{...check,reason:tell(check.reason)};
    if(enlisting)return{ok:false,reason:'Prise en charge déjà engagée.'};
    if(typeof g.createProtectedSurvivor!=='function')return{ok:false,reason:tell('Fabrique de survivants absente : installation incomplète.')};
    const beforeResources={...g.resources},ids=new Set(g.units.map(u=>u.id)),nextId=g.nextId,beforeState=engine.snapshot();enlisting=true;
    try{
      const unit=g.createProtectedSurvivor(D.BY_ID[id].kind,ctx.point.x,ctx.point.y);
      if(!unit||!g.units.includes(unit))throw Error('Aucun point de départ praticable.');
      const result=engine.enlist(id,unit.id,ctx,g.elapsed);if(!result.ok)throw Error(result.reason);
      unit.state='move';unit.navigation=null;g.refreshMetrics(true);g.save(false);
      return{ok:true,reason:tell(D.BY_ID[id].name+' est sous protection. Le logement est occupé ; accompagnez cette personne jusqu’au centre.','good')};
    }catch(error){
      g.units=g.units.filter(u=>ids.has(u.id));g.nextId=nextId;Object.assign(g.resources,beforeResources);engine=new D.Engine(beforeState);g.refreshMetrics(true);
      return{ok:false,reason:tell('Prise en charge annulée sans dépense : '+error.message)};
    }finally{enlisting=false;}
  }
  function order(id,value){if(!g.canIssueCommand())return false;ensure();const ok=engine.order(id,value,g.elapsed);if(ok){const u=g.units.find(u=>u.id===engine.call(id).unitId);if(u)u.navigation=null;g.save(false);tell('Ordre transmis à '+D.BY_ID[id].name+' : '+({follow:'suivre le commandant',hold:'attendre ici',return:'regagner le centre'}[value])+'.');}return ok;}
  function updateEscort(u,dt){
    ensure();const call=engine.state.calls.find(s=>D.ACTIVE.includes(s.status)&&s.unitId===u.id);if(!call)return false;
    if(!live(u)){engine.finish(call.id,false,g.elapsed);return true;}
    if(!running()||!Number.isFinite(dt)||dt<=0)return true;dt=Math.min(dt,R.maxStep);
    const home=g.core();if(!home||!live(home))return true;
    if((!live(g.player)||g.workerOrder==='retreat')&&call.status!=='return'){call.status='return';u.navigation=null;}
    const threat=g.nearestZombie(u.x,u.y,90);if(threat&&g.hostileLineClear(threat,u)&&call.status!=='return'){call.status='return';u.navigation=null;}
    if(secure(home)&&g.workerCanWorkAt(u,home,R.homeRange)){
      engine.finish(call.id,true,g.elapsed);u.state='idle';u.think=0;u.targetNode=-1;u.targetBuilding=-1;u.targetUnit=-1;u.navigation=null;
      tell(D.BY_ID[call.id].arrival,'good');return true;
    }
    if(call.status==='hold'){u.state='idle';return true;}
    const target=call.status==='return'?home:g.player,range=call.status==='return'?R.homeRange:R.followDistance;
    u.state=call.status==='return'?'flee':'move';
    if(!g.workerCanWorkAt(u,target,range))g.moveUnitToward(u,target,dt,u.speed);
    else u.state='idle';
    return true;
  }
  function suspend(id,value){ensure();const b=g.world.buildings.get(id);
    if(!g.canIssueCommand()||!live(b)||b.completed||b.progress>=1||b.type==='core')return false;
    if(!engine.suspend(id,value,g.elapsed))return false;
    for(const u of g.units)if(u.kind==='worker'&&u.targetBuilding===id&&!isEscort(u.id)){u.targetBuilding=-1;u.state=u.carry>0?'return':'idle';u.think=0;u.navigation=null;}
    wireWork();g.save(false);tell(value?'Chantier suspendu. Matériaux engagés et dégâts conservés ; ouvriers libérés.':'Chantier repris. Aucun matériau supplémentaire débité.');return true;
  }
  function prioritize(id){const b=g.world.buildings.get(id);if(!g.canIssueCommand()||!live(b)||b.completed)return false;b.priority=3;
    for(const u of g.units)if(u.kind==='worker'&&!isEscort(u.id))u.think=0;
    g.save(false);tell('Priorité haute transmise. Les trajets et le travail restent nécessaires.');return true;
  }
  function configure(key,value){ensure();if(!g.canIssueCommand())return false;
    if(key==='reserve'&&Number.isInteger(value)&&value>=0&&value<=R.maxReserve)engine.state.reserve=value;
    else if(key==='recallAtDusk'&&typeof value==='boolean')engine.state.recallAtDusk=value;
    else return false;g.save(false);tell(key==='reserve'?'Réserve du commandant : '+value+' munitions soustraites aux tirs automatiques, pas aux autres dépenses.':'Rappel des escortes au crépuscule '+(value?'activé.':'désactivé.'));return true;
  }
  function stance(index,value){ensure();if(!g.canIssueCommand()||!Number.isInteger(index)||index<0||index>2||!['mobile','hold'].includes(value))return false;
    engine.state.stances[index]=value;g.save(false);tell('Section '+['ALPHA','BRAVO','CHARLIE'][index]+' : '+(value==='hold'?'tenir le point, sans poursuite.':'mobilité habituelle rétablie.'));return true;}
  function metrics(){const f=g.siege?.snapshot()?.stats||{};return D.counters({...g.stats,...engine.state.stats,ignitions:f.ignitions||0,extinguished:f.extinguished||0});}
  function discover(){if(!live(g.player))return;const relays=structures().filter(b=>op(b)&&b.type==='radioRelay'&&b.powered&&!b.siegeOffline);
    for(const s of engine.state.calls)if(!s.seen){const point=signal(s.id);if(!point)continue;
      if(distance(g.player,point)<=R.discoverRange&&g.hostileLineClear(g.player,point)||relays.some(b=>distance(b,point)<=R.radioRange)){
        engine.reveal(s.id,g.elapsed);tell('Signal reçu : '+D.BY_ID[s.id].name+'. Le trajet n’est pas sécurisé.','good');
      }
    }
  }
  function checkPhase(before){
    if(['warning','assault'].includes(g.phase)&&!engine.state.baseline&&!engine.state.history.some(h=>h.wave===g.wave))engine.beginNight(g.wave,g.elapsed,metrics(),before!=='calm');
    if(before==='calm'&&g.phase==='warning'&&engine.state.recallAtDusk){let count=0;for(const s of engine.state.calls)if(D.ACTIVE.includes(s.status)){engine.order(s.id,'return',g.elapsed);count++;}
      if(count){engine.log('dusk',String(count),g.elapsed);tell('Crépuscule : '+count+' escorte(s) rappelée(s). Les portes restent sous vos ordres.','normal');}}
    if(g.phase==='aftermath'&&engine.state.baseline?.wave===g.wave)engine.endNight(g.wave,g.elapsed,metrics(),'secured');
  }
  wrap('serialize',(old,...args)=>{reconcile();return{...old(...args),citadel:engine.snapshot()};});
  wrap('restoreSave',(old,input)=>{const data=root.DeadwallSave.validate(input),before=g.world;pending=D.normalize(data.citadel);try{return old(data);}finally{if(g.world!==before){ensure();wireWork();reconcile();}pending=null;}});
  wrap('startNew',(old,...args)=>{const before=g.world,result=old(...args);if(g.world!==before){ensure();wireWork();g.save(false);}return result;});
  wrap('placeOne',(old,...args)=>{const result=old(...args);if(result)wireWork();return result;});
  wrap('update',(old,dt)=>{ensure();wireWork();const result=old(dt);if(!running()||!Number.isFinite(dt)||dt<=0)return result;
    inspection-=dt;if(inspection<=0){inspection=R.inspectionSeconds;reconcile();discover();}return result;});
  wrap('updateDirector',(old,dt)=>{ensure();const before=g.phase;checkPhase(before);const result=old(dt);checkPhase(before);return result;});
  wrap('updateUI',(old,...args)=>{const result=old(...args);g.citadelUI?.refresh();return result;});
  if(typeof g.damageUnit==='function')wrap('damageUnit',(old,u,amount)=>{const result=old(u,amount);if(!live(u)){const s=engine.state.calls.find(s=>s.unitId===u.id);if(s&&engine.finish(s.id,false,g.elapsed))tell('L’escorte de '+D.BY_ID[s.id].name+' a été perdue.','danger');}return result;});
  if(typeof g.triggerGameOver==='function')wrap('triggerGameOver',(old,...args)=>{ensure();if(engine.state.baseline)engine.endNight(g.wave,g.elapsed,metrics(),'fallen');return old(...args);});
  function open(){g.showCommand?.(true,'field');g.citadelUI?.open();}
  function mark(id){ensure();if(!g.canIssueCommand()||!engine.call(id)?.seen||!signal(id))return false;selected=id;g.showCommand?.(false);tell('Appel marqué : '+D.BY_ID[id].name+'. Rejoignez le lieu à pied.');return true;}
  function overview(){reconcile();const e=engine.state;
    return{calls:e.calls.filter(s=>s.seen).map(s=>{const p=signal(s.id),u=g.units.find(u=>u.id===s.unitId);return{...s,...D.BY_ID[s.id],distance:p?distance(g.player,p):null,health:u?.health,maxHealth:u?.maxHealth,memberAlive:live(g.units.find(u=>u.id===s.citizenId)),blocked:Boolean(u?.navigation?.cells===null),check:s.status==='waiting'?status(s.id):null};}),
      known:e.calls.filter(s=>s.seen).length,active:e.calls.filter(s=>D.ACTIVE.includes(s.status)).length,stats:{...e.stats},reserve:e.reserve,stances:e.stances.slice(),recallAtDusk:e.recallAtDusk,
      jobs:structures().filter(b=>live(b)&&!b.completed&&b.progress<1).map(b=>({id:b.id,name:b.def.name,progress:b.progress,health:b.health,maxHealth:b.maxHealth,priority:b.priority,paused:e.suspended.includes(b.id),remainingWork:(1-b.progress)*Math.max(1,b.def.buildTime)})),
      history:e.history,events:e.events,notice,alerts:[g.resources.food<=.01?'Rations épuisées.':null,1+g.units.filter(live).length>=g.housing?'Logements pleins.':null,g.resources.ammo<=e.reserve&&e.reserve>0?'Réserve protégée atteinte : tirs automatiques arrêtés.':null,g.powerUsed>g.powerGenerated+(g.powerBatteryOutput||0)?'Puissance électrique insuffisante.':null].filter(Boolean)};
  }
  function drawSignals(ctx){for(const s of engine.state.calls){if(!s.seen||s.status!=='waiting')continue;const p=signal(s.id);if(!p)continue;
    if(g.viewBounds&&g.visible&&!g.visible(p.x,p.y,60,g.viewBounds()))continue;
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=selected===s.id?'#f3cf84':'#84b8ad';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#173632';ctx.fillRect(-11,-14,22,28);ctx.strokeRect(-11,-14,22,28);ctx.fillStyle='#d6e9d4';ctx.fillRect(-5,-7,10,5);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('APPEL · '+D.BY_ID[s.id].name,0,-38);ctx.restore();
  }}
  if(typeof g.drawGround==='function')wrap('drawGround',(old,ctx,...args)=>{const result=old(ctx,...args);drawSignals(ctx);return result;});
  if(typeof g.drawUnit==='function')wrap('drawUnit',(old,ctx,u,...args)=>{const result=old(ctx,u,...args),call=engine.state.calls.find(s=>s.unitId===u.id);if(call){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#bfe5d4';ctx.fillText(D.BY_ID[call.id].name,u.x,u.y-24);ctx.restore();}return result;});
  if(g.art?.drawBuilding){const old=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(ctx,b,world)=>{if(!D.BUILDINGS[b.type])return old(ctx,b,world);
    const w=b.def.size[0]*32,h=b.def.size[1]*32;ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.rotation||0)*Math.PI/2);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-w/2+7,-h/2+8,w,h);
    ctx.fillStyle=b.type==='radioRelay'?'#4b665f':'#7c8069';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#c8c8a6';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h/2,w,h);
    if(b.type==='radioRelay'){ctx.strokeStyle='#c6d5cf';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-15,20);ctx.lineTo(0,-36);ctx.lineTo(15,20);ctx.moveTo(-18,-16);ctx.lineTo(18,-16);ctx.stroke();ctx.fillStyle=b.powered?'#a9d9bc':'#596c62';ctx.beginPath();ctx.arc(0,-36,4,0,Math.PI*2);ctx.fill();}
    else{ctx.fillStyle='#b2b38f';ctx.fillRect(-w/2+8,-h/2+8,w-16,h-16);ctx.fillStyle='#344c44';for(let i=0;i<4;i++)ctx.fillRect(-w/2+16+i*26,-h/2+20,15,16);ctx.fillRect(-12,h/2-28,24,28);ctx.fillStyle='#e0ca91';ctx.fillRect(-w/2+12,7,32,6);}
    ctx.restore();return true;};}
  g.citadel=Object.freeze({version:D.VERSION,snapshot:()=>{reconcile();return engine.snapshot();},overview,isEscort,updateEscort,status,enlist,order,suspend,prioritize,configure,stance,mark,open,
    canFire:cost=>{ensure();return D.canFire(g.resources.ammo,cost,engine.state.reserve);},isHolding:u=>{ensure();return engine.state.stances[u.squad]==='hold';},drawSignals});
  ensure();wireWork();
})(typeof globalThis!=='undefined'?globalThis:this);

(function mountCitadelUI(root){
 'use strict';const g=root.DEADWALL,D=root.DeadwallCitadel,C=root.DeadwallCore;if(!root.document||!g?.citadel)return;
 function mount(){const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
  const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!==undefined)n.textContent=txt;if(cls)n.className=cls;return n;};
  const text=(n,t)=>{if(n.textContent!==String(t))n.textContent=String(t);};
  const btn=(label,id,action)=>{const b=el('button',label);b.type='button';if(id)b.id=id;b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]')){action();refresh(true);}});return b;};
  const css=el('style');css.textContent=`
  .cit15{color:#e8ebdf;max-width:100%;padding:8px 0 22px;--edge:#49655e;--muted:#b0c4bc}.cit15 *{box-sizing:border-box}.cit15 p{font-size:13px;line-height:1.65;color:var(--muted);margin:8px 0}.cit15 h2{font-size:32px;letter-spacing:-.03em;line-height:1.1;margin:12px 0}.cit15 h3{font-size:17px;line-height:1.3;margin:8px 0}.cit15 small{font-size:10px;letter-spacing:.08em;color:#dcbd80}.cit15 button,.cit15 select{min-height:40px;background:#253e37;color:#eff2de;border:1px solid #668377;border-radius:6px;padding:9px 12px;font:inherit;font-size:12px;cursor:pointer}.cit15 button:disabled{opacity:.45;cursor:not-allowed}.cit15 button:focus-visible,.cit15 input:focus-visible,.cit15 select:focus-visible{outline:3px solid #f1cc7c;outline-offset:3px}.cit15 button[aria-selected=true],.cit15 button[aria-pressed=true]{background:#48644b;border-color:#d9bf81}.cit15-hero{border:1px solid #8a9c76;border-radius:12px;padding:24px;display:grid;grid-template-columns:1.6fr 1fr;gap:20px;background:linear-gradient(125deg,#304b3f,#17292c);position:relative;overflow:hidden}.cit15-kpis{display:grid;grid-template-columns:1fr 1fr;gap:9px}.cit15-kpis div{border:1px solid #668170;border-radius:6px;padding:12px}.cit15-kpis strong{display:block;font-size:27px}.cit15-tabs{display:flex;flex-wrap:wrap;gap:7px;margin:16px 0}.cit15-status{border-left:3px solid #d5bc7f;background:#223d35;padding:11px 14px;min-height:45px}.cit15-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cit15-card{padding:19px;border-radius:9px;border:1px solid var(--edge);background:#172f29;min-width:0}.cit15-card[data-state=lost]{border-color:#9e7560}.cit15-card[data-state=delivered]{border-color:#85aa78}.cit15-portrait{font-size:22px;letter-spacing:.1em;color:#d6d3a5;border:1px solid #627d68;background:#2e493a;border-radius:5px;display:inline-grid;place-items:center;width:52px;height:52px;float:right;margin-left:10px}.cit15-row{display:flex;justify-content:space-between;align-items:center;gap:10px}.cit15-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.cit15-card progress{width:100%;height:7px;accent-color:#8fbd98}.cit15-empty{border:1px dashed var(--edge);padding:25px;margin:8px 0;border-radius:9px}.cit15-squad{border-top:1px solid var(--edge);padding:16px 0;display:flex;justify-content:space-between;align-items:center;gap:14px}.cit15 table{width:100%;border-collapse:collapse;font-size:12px}.cit15 td,.cit15 th{text-align:left;padding:11px 7px;border-bottom:1px solid #39584d}.cit15 th{color:#c6d7c1}.cit15 details{margin-top:12px;border:1px solid var(--edge);padding:14px;border-radius:7px}.cit15 summary{cursor:pointer}.cit15-log{font-size:12px;line-height:1.6;color:#b9c7b9;padding-left:20px}.cit15-warning{color:#f2cc9b!important}.cit15 input[type=range]{width:100%;accent-color:#d7c488}.cit15 label{display:block;font-size:13px;line-height:1.6}.cit15 input[type=checkbox]{margin-right:9px}.cit15-pager{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:13px}.cit15-hud{background:#244138;border:1px solid #819876;color:#e7edcf;padding:9px 12px;border-radius:5px;text-align:left;width:100%;margin-top:6px;min-height:45px;cursor:pointer}.cit15-hud small{display:block;color:#c4d2bf;font-size:10px;margin-top:4px}.cit15 .hidden{display:none!important}@media(max-width:720px){.cit15-hero,.cit15-cards{grid-template-columns:1fr}.cit15-hero{padding:18px}.cit15 h2{font-size:27px}.cit15-tabs{display:grid;grid-template-columns:1fr 1fr}.cit15 button,.cit15 select{min-height:46px}.cit15-squad{align-items:flex-start;flex-direction:column}.cit15-portrait{width:42px;height:42px}.cit15-row{align-items:flex-start;flex-wrap:wrap}}
  `;document.head.appendChild(css);
  const panel=el('section',undefined,'cit15 hidden');panel.id='citadelPanel';field.appendChild(panel);
  const navButton=btn('CITÉ & SURVIVANTS','citadelTab',()=>open());navButton.setAttribute('aria-pressed','false');nav.appendChild(navButton);
  const hero=el('header',undefined,'cit15-hero'),heroCopy=el('div');heroCopy.append(el('small','D-17 / RÉSEAU DE LA CITÉ'),el('h2','Personne ne rentre seul.'),el('p','Retrouver les vivants. Garder les chantiers utiles. Donner aux sections une ligne à tenir, puis comprendre ce que la nuit a coûté.'));hero.appendChild(heroCopy);
  const kpis=el('div',undefined,'cit15-kpis'),values={};for(const [id,label]of [['home','REVENUS AU REFUGE'],['escort','SOUS PROTECTION'],['jobs','CHANTIERS OUVERTS'],['night','BILANS CONSIGNÉS']]){const box=el('div'),n=el('strong','0');box.append(el('small',label),n);kpis.appendChild(box);values[id]=n;}hero.appendChild(kpis);panel.appendChild(hero);
  const status=el('p',undefined,'cit15-status');status.id='citadelStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.appendChild(status);
  const subnav=el('nav',undefined,'cit15-tabs');subnav.setAttribute('role','tablist');subnav.setAttribute('aria-label','Gestion de la cité');panel.appendChild(subnav);
  const sections={},tabs={},names={rescue:'LES APPELS',works:'LES CHANTIERS',defense:'LES CONSIGNES',review:'LE BILAN'};let active='rescue',page=0,lastRefresh=-Infinity;
  function choose(id,focus=false){active=id;for(const key of Object.keys(names)){sections[key].classList.toggle('hidden',key!==id);tabs[key].setAttribute('aria-selected',String(key===id));tabs[key].tabIndex=key===id?0:-1;}if(focus)tabs[id].focus();refresh(true);}
  for(const [id,label]of Object.entries(names)){const b=btn(label,'citadel-sub-'+id,()=>choose(id));b.setAttribute('role','tab');b.setAttribute('aria-controls','citadel-view-'+id);subnav.appendChild(b);tabs[id]=b;const s=el('section');s.id='citadel-view-'+id;s.setAttribute('role','tabpanel');s.setAttribute('aria-labelledby',b.id);sections[id]=s;panel.appendChild(s);
   b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.code))return;e.preventDefault();const keys=Object.keys(names),i=keys.indexOf(active);choose(e.code==='Home'?keys[0]:e.code==='End'?keys.at(-1):keys[(i+(e.code==='ArrowRight'?1:-1)+keys.length)%keys.length],true);});}
  sections.rescue.append(el('h3','Des signaux, pas des renforts instantanés'),el('p','Les appels se repèrent en exploration ou avec un relais alimenté. La prise en charge se fait près du signal, pendant le calme, avec un logement et les réserves du rôle. L’escorte n’exerce pas son métier et ne tire pas avant son retour.'));
  const rescueCards=el('div',undefined,'cit15-cards'),empty=el('p','Aucun appel connu. Explorez les quartiers ; un relais radio peut repérer les signaux proches, sans révéler les ennemis.','cit15-empty');sections.rescue.append(empty,rescueCards);const rescueRows=new Map();
  sections.works.append(el('h3','Concentrer le travail là où il compte'),el('p','Suspendre arrête le travail actif et passif sans rembourser les matériaux. Le chantier reste dans le monde, vulnérable et réservable. Reprendre ne répare rien et ne prélève pas de nouveau coût.'));
  const works=el('div',undefined,'cit15-cards'),worksNote=el('p');sections.works.append(worksNote,works);let workKey='';
  const pager=el('div',undefined,'cit15-pager'),previous=btn('PRÉCÉDENTS','citadelJobsPrevious',()=>{page=Math.max(0,page-1);}),pageLabel=el('span'),next=btn('SUIVANTS','citadelJobsNext',()=>{page++;});pager.append(previous,pageLabel,next);sections.works.appendChild(pager);
  sections.defense.append(el('h3','Tenir les lignes, préserver une réserve'),el('p','Ces consignes ne changent ni les dégâts ni les points de vie. La réserve protège seulement des tirs automatiques : le joueur, les recrutements et les constructions peuvent encore dépenser des munitions.'));
  const defCards=el('div',undefined,'cit15-cards'),reserveBox=el('article',undefined,'cit15-card'),reserveLabel=el('label','Réserve du commandant : '),reserveValue=el('strong','0'),reserve=el('input');reserve.type='range';reserve.min='0';reserve.max='200';reserve.step='1';reserve.value='0';reserve.id='citadelReserve';reserveLabel.htmlFor=reserve.id;reserveLabel.appendChild(reserveValue);reserve.addEventListener('input',()=>text(reserveValue,reserve.value));reserve.addEventListener('change',()=>{g.citadel.configure('reserve',Number(reserve.value));refresh(true);});reserveBox.append(reserveLabel,reserve,el('p','Au seuil choisi, miradors, redoutes, tourelles et fusiliers cessent de tirer. La crosse reste disponible à portée.'));
  const recallBox=el('article',undefined,'cit15-card'),recallLabel=el('label'),recall=el('input');recall.id='citadelDuskRecall';recall.type='checkbox';recallLabel.append(recall,document.createTextNode('Rappeler les escortes au crépuscule'));recall.addEventListener('change',()=>{g.citadel.configure('recallAtDusk',recall.checked);refresh(true);});recallBox.append(recallLabel,el('p','Cet ordre vise seulement les personnes sous protection. Il ne ferme aucune porte et ne rappelle pas à lui seul les ouvriers, les pompiers ou les convois.'));defCards.append(reserveBox,recallBox);sections.defense.appendChild(defCards);
  const squadSelect=[];for(let i=0;i<3;i++){const row=el('div',undefined,'cit15-squad'),label=el('label','Section '+['ALPHA','BRAVO','CHARLIE'][i]),select=el('select');select.id='citadelStance'+i;label.htmlFor=select.id;for(const [v,t]of [['mobile','Mobilité habituelle'],['hold','Tenir le point · sans poursuite']]){const o=el('option',t);o.value=v;select.appendChild(o);}select.addEventListener('change',()=>{g.citadel.stance(i,select.value);refresh(true);});row.append(label,select);sections.defense.appendChild(row);squadSelect.push(select);}
  sections.review.append(el('h3','Ce que cette nuit a coûté'),el('p','Écarts observés entre l’alerte et la sécurisation. Les reprises au milieu d’une ancienne nuit sont marquées « partiel ». Aucun bilan ne donne de récompense supplémentaire.'));
  const reviews=el('div'),eventDetails=el('details'),eventList=el('ol',undefined,'cit15-log');eventDetails.append(el('summary','Journal des dernières décisions'),eventList);sections.review.append(reviews,eventDetails);
  const hud=btn('RÉSEAU DE LA CITÉ','citadelHud',()=>g.citadel.open());hud.className='cit15-hud';const hudText=el('small');hud.appendChild(hudText);g.ui.rightPanel?.appendChild(hud);
  function open(){for(const s of field.children)if(s.tagName==='SECTION')s.classList.toggle('hidden',s!==panel);for(const b of nav.children)b.setAttribute('aria-pressed',String(b===navButton));choose(active);}
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b!==navButton){panel.classList.add('hidden');navButton.setAttribute('aria-pressed','false');}});
  let reviewKey='',eventKey='';
  function refresh(force=false){const now=performance.now();if(!force&&now-lastRefresh<500)return;lastRefresh=now;
    const v=g.citadel.overview(),playing=g.state==='playing'&&!g.gameOver,can=g.canIssueCommand();hud.disabled=!playing;text(hudText,v.active+' escorte(s) · '+v.jobs.filter(j=>j.paused).length+' chantier(s) suspendu(s)');if(panel.classList.contains('hidden'))return;
    text(values.home,v.stats.rescued+'/6');text(values.escort,v.active);text(values.jobs,v.jobs.length);text(values.night,v.history.length);text(status,v.notice||v.alerts.join(' ')||'Aucune urgence signalée par le réseau. Les trajectoires et le terrain restent à surveiller.');
    empty.classList.toggle('hidden',v.calls.length>0);
    // A new campaign or a different imported map must not retain previous contact cards.
    const known=new Set(v.calls.map(s=>s.id));for(const [id,row] of rescueRows)if(!known.has(id)){row.card.remove();rescueRows.delete(id);}
    for(const s of v.calls){let r=rescueRows.get(s.id);if(!r){const card=el('article',undefined,'cit15-card'),initials=el('span',s.name.split(' ').map(n=>n[0]).join('').slice(0,2),'cit15-portrait');initials.setAttribute('aria-hidden','true');const name=el('h3',s.name),line=el('p'),detail=el('p'),actions=el('div',undefined,'cit15-actions');card.append(initials,el('small',s.role.toUpperCase()),name,el('p',s.brief),line,detail,actions);
      const mark=btn('SUIVRE LE SIGNAL','citadelMark-'+s.id,()=>g.citadel.mark(s.id)),take=btn('PRENDRE SOUS PROTECTION','citadelEnlist-'+s.id,()=>g.citadel.enlist(s.id)),orders={};actions.append(mark,take);for(const [mode,title]of [['follow','SUIVRE'],['hold','ATTENDRE'],['return','RENTRER']]){orders[mode]=btn(title,'citadelOrder-'+s.id+'-'+mode,()=>g.citadel.order(s.id,mode));actions.appendChild(orders[mode]);}rescueCards.appendChild(card);r={card,line,detail,mark,take,orders};rescueRows.set(s.id,r);}
      r.card.dataset.state=s.status;const activeEscort=D.ACTIVE.includes(s.status);text(r.line,s.status==='waiting'?'À '+Math.round(s.distance||0)+' unités · '+C.resourceText(s.cost):s.status==='delivered'?(s.memberAlive?'Revenu au refuge · rôle opérationnel':'Revenu au refuge · absent des effectifs actuels'):s.status==='lost'?'Escorte perdue pour cette campagne':({follow:'Suit le commandant',hold:'Attend sur place',return:'Regagne le centre'}[s.status])+' · intégrité '+Math.ceil(s.health||0)+'/'+s.maxHealth+(s.blocked?' · trajet bloqué':''));
      text(r.detail,s.status==='waiting'?s.check.reason:s.status==='delivered'?s.arrival:s.status==='lost'?'Les pertes ne sont pas annulées à la prochaine aube.':'Cette personne occupe déjà un logement et consomme des rations.');r.mark.classList.toggle('hidden',s.status!=='waiting');r.take.classList.toggle('hidden',s.status!=='waiting');r.mark.disabled=!can;r.take.disabled=!can||!s.check?.ok;for(const [k,b]of Object.entries(r.orders)){b.classList.toggle('hidden',!activeEscort);b.disabled=!can;b.setAttribute('aria-pressed',String(s.status===k));}
    }
    const jobs=v.jobs.slice().sort((a,b)=>b.priority-a.priority||a.id-b.id),pages=Math.max(1,Math.ceil(jobs.length/12));page=Math.min(page,pages-1);const show=jobs.slice(page*12,page*12+12),wk=show.map(j=>[j.id,j.paused,j.priority,Math.floor(j.progress*100),Math.ceil(j.health)].join(':')).join('|');
    text(worksNote,jobs.length?jobs.length+' chantier(s) · '+jobs.filter(j=>j.paused).length+' suspendu(s). Tri par priorité, puis identifiant.':'Aucun chantier en attente. Les ensembles diurnes restent accessibles dans Journée & Bastions.');
    if(wk!==workKey){workKey=wk;const focus=document.activeElement?.id;works.replaceChildren();for(const j of show){const card=el('article',undefined,'cit15-card'),bar=el('progress');bar.max=1;bar.value=j.progress;bar.setAttribute('aria-label','Construction '+j.name);card.append(el('small','#'+j.id+' / '+(j.paused?'SUSPENDU':'EN COURS')),el('h3',j.name),bar,el('p',Math.floor(j.progress*100)+' % · intégrité '+Math.ceil(j.health)+'/'+j.maxHealth),el('p','Travail restant : '+j.remainingWork.toFixed(1)+' unités. Ce nombre n’est pas un délai garanti.'));const actions=el('div',undefined,'cit15-actions'),pause=btn(j.paused?'REPRENDRE':'SUSPENDRE','citadelPause-'+j.id,()=>g.citadel.suspend(j.id,!j.paused)),priority=btn('PRIORITÉ HAUTE','citadelPriority-'+j.id,()=>g.citadel.prioritize(j.id));pause.disabled=priority.disabled=!can;actions.append(pause,priority);card.appendChild(actions);works.appendChild(card);}if(focus?.startsWith('citadelPause-')||focus?.startsWith('citadelPriority-'))document.getElementById(focus)?.focus({preventScroll:true});}
    for(const b of works.querySelectorAll('button'))b.disabled=!can;previous.disabled=page===0;next.disabled=page>=pages-1;text(pageLabel,(page+1)+' / '+pages);
    if(document.activeElement!==reserve)reserve.value=String(v.reserve);text(reserveValue,reserve.value);reserve.disabled=recall.disabled=!can;recall.checked=v.recallAtDusk;for(let i=0;i<3;i++){squadSelect[i].value=v.stances[i];squadSelect[i].disabled=!can;}
    const rk=JSON.stringify(v.history);if(rk!==reviewKey){reviewKey=rk;reviews.replaceChildren();if(!v.history.length)reviews.appendChild(el('p','Le premier bilan apparaîtra après une sécurisation.','cit15-empty'));
      for(const h of v.history.slice().reverse()){const card=el('article',undefined,'cit15-card');card.append(el('small','VAGUE '+h.wave+' · '+(h.outcome==='secured'?'SÉCURISÉE':'CITÉ TOMBÉE')+(h.partial?' · PARTIEL':'')),el('h3',C.formatTime(h.seconds)+' observées'));const lines=[['Infectés éliminés',h.metrics.kills],['Équipiers perdus',h.metrics.unitsLost],['Structures perdues',h.metrics.buildingsLost],['Tirs du commandant',h.metrics.shots],['Personnes rentrées',h.metrics.rescued],['Escortes perdues',h.metrics.escortLosses],['Départs de feu',h.metrics.ignitions],['Foyers éteints',h.metrics.extinguished]];const table=el('table');for(const [label,n]of lines){const tr=el('tr'),th=el('th',label);th.scope='row';tr.append(th,el('td',n));table.appendChild(tr);}card.appendChild(table);reviews.appendChild(card);}}
    const ek=JSON.stringify(v.events);if(ek!==eventKey){eventKey=ek;eventList.replaceChildren();const labels={found:'Appel repéré',joined:'Prise en charge',arrived:'Arrivée au refuge',lost:'Escorte perdue',dusk:'Rappel au crépuscule',order:'Ordre d’escorte',suspend:'Chantier suspendu',resume:'Chantier repris'};for(const e of v.events.slice().reverse())eventList.appendChild(el('li',C.formatTime(e.at)+' · '+labels[e.type]+' · '+(D.BY_ID[e.subject]?.name||e.subject)));}
  }
  g.citadelUI=Object.freeze({open,refresh,choose});choose('rescue');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL CITADEL 1.5 — END */


/* DEADWALL INFRASTRUCTURE 1.6 — BEGIN */
/* Real-host adapters. Test fixtures are never appended to the game. */
(function installInfrastructureRuntime(root){
  'use strict';
  const g=root.DEADWALL,C=root.DeadwallCore,D=root.DeadwallInfrastructure,R=D?.RULES;
  if(!g||!C||!D)throw Error('Dépendances du réseau routier absentes.');if(g.infrastructure)return;
  let engine=new D.Engine(),worldRef=null,pending=null,tool='none',preview=null,anchor=null,notice='',marked=null,buildingAgain=false,rebuildPreview=null,selectedSurface='gravel',roadMode='new';
  const assignments=new Map();let nextInspection=0,rebuildCloseHook=false;
  const live=u=>Boolean(u&&!u.dead&&u.health>0),op=b=>live(b)&&(b.completed===true||b.progress>=1);
  const buildings=()=>[...g.world.buildings.values()],distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const running=()=>g.state==='playing'&&!g.paused&&!g.gameOver&&!g.activeOverlay;
  const activeDay=()=>running()&&g.phase==='calm';
  const wrap=(name,fn)=>{const old=g[name];if(typeof old!=='function')throw Error('Interface de voirie absente : '+name);g[name]=function(...args){return fn(old.bind(g),...args);};};
  function ensure(){if(worldRef!==g.world){worldRef=g.world;engine=new D.Engine(pending||undefined);pending=null;tool='none';preview=null;anchor=null;notice='';marked=null;buildingAgain=false;rebuildPreview=null;selectedSurface='gravel';roadMode='new';assignments.clear();nextInspection=0;}return engine;}
  const tell=(text,tone=null)=>{notice=text;if(tone){g.notify(text,tone);g.audio?.ui();}g.infrastructureUI?.refresh(true);return text;};
  const depots=()=>buildings().filter(b=>op(b)&&b.type==='roadDepot'&&b.powered&&!b.siegeOffline&&!b.territoryOffline);
  const slots=()=>Math.min(R.maxCrew,depots().length*R.crewPerDepot);
  const secure=p=>!g.zombies.some(z=>live(z)&&distance(z,p)<=R.dangerRange&&g.hostileLineClear(z,p));
  const point=p=>({x:p.x*32+16,y:p.y*32+16});
  function isAssigned(id){ensure();return engine.state.crew.some(u=>u.id===id);}
  function unavailable(id){
    const t=g.territories?.snapshot();
    return isAssigned(id)||Boolean(t?.withdrawing?.includes(id)||Object.values(t?.sectors||{}).some(s=>s.workerId===id)||g.siege?.isAssigned(id)||g.citadel?.isEscort(id)||g.salvage?.isAssigned(id)||g.expeditions?.isAssigned(id));
  }
  function reconcile(){ensure();engine.state.crew=engine.state.crew.filter(c=>live(g.units.find(u=>u.id===c.id)));
    let active=0;const cap=slots();for(const c of engine.state.crew)if(!c.returning&&(g.phase!=='calm'||g.workerOrder==='retreat'||++active>cap))c.returning=true;
    const valid=new Set(engine.state.crew.map(c=>c.id));for(const id of assignments.keys())if(!valid.has(id))assignments.delete(id);
    if(!buildingAgain)engine.state.ruins=engine.state.ruins.filter(r=>!buildings().some(b=>live(b)&&b.type===r.type&&b.gx===r.gx&&b.gy===r.gy&&(b.rotation||0)===r.rotation));
  }
  function blocked(x,y){
    const b=typeof g.world.atCell==='function'?g.world.atCell(x,y):buildings().find(b=>x>=b.gx&&y>=b.gy&&x<b.gx+b.w&&y<b.gy+b.h);
    if(live(b)&&!b.def.gate)return true;
    return(g.world.nodes||[]).some(n=>!n.depleted&&n.amount>0&&n.x+(n.radius||0)>x*32&&n.x-(n.radius||0)<(x+1)*32&&n.y+(n.radius||0)>y*32&&n.y-(n.radius||0)<(y+1)*32);
  }
  function clearOtherTools(){const t=g.dayworks?.overview()?.tool;if(t&&t!=='none')g.dayworks.setTool(t);if(g.siege?.toolActive())g.siege.toggleTool();g.releaseInputs?.();if(g.player)g.player.reload=0;}
  function available(){return g.canIssueCommand()&&live(g.player)&&g.phase==='calm';}
  const roadOptions=()=>({surface:selectedSurface,mode:roadMode,tier:g.tier.id,has:type=>g.world.has(type)});
  function roadStatus(){if(!available()||!g.world.has('planningOffice'))return{ok:false,reason:'Bureau de chantier terminé et journée calme requis.'};return D.surfaceStatus(selectedSurface,g.tier.id,type=>g.world.has(type));}
  function chooseSurface(id,mode=roadMode){ensure();if(!Object.hasOwn(D.SURFACES,id)||!['new','upgrade'].includes(mode)||!g.canIssueCommand())return{ok:false,reason:tell('Revêtement ou mode de travaux indisponible.')};
    selectedSurface=id;roadMode=mode;preview=null;anchor=null;tool='none';g.releaseInputs?.();const q=roadStatus();tell(q.ok?D.SURFACES[id].name+' sélectionné : '+(mode==='upgrade'?'améliorer les voies achevées.':'financer une nouvelle trace.'):q.reason);return q;
  }
  function beginTrace(){ensure();rebuildPreview=null;const status=roadStatus();if(!status.ok)return{ok:false,reason:tell(status.reason)};
    g.cancelPlacement?.();clearOtherTools();tool='trace';anchor=null;preview=null;g.showCommand?.(false);if(g.paused)g.togglePause?.(false);
    tell('Choisissez le départ puis l’arrivée. Le coude suit d’abord l’axe horizontal ; le financement sera confirmé séparément.');return{ok:true};
  }
  function plan(a,b){ensure();rebuildPreview=null;preview=null;anchor=null;tool='none';const status=roadStatus();if(!status.ok)return{ok:false,reason:tell(status.reason)};
    const cells=D.line(a,b);if(!cells)return{ok:false,reason:tell('Trace hors carte ou trop longue : 64 cellules maximum.')};
    preview=cells;anchor=null;tool='none';const q=D.quote(engine.state,cells,g.resources,blocked,roadOptions());tell(q.reason);return q;
  }
  function commit(){ensure();if(!available()||!g.world.has('planningOffice')||!preview)return{ok:false,reason:tell('Aucun projet finançable pendant cette phase.')};
    const q=engine.commit(preview,g.resources,blocked,roadOptions());if(!q.ok){tell(q.reason);return q;}
    preview=null;anchor=null;tool='none';g.save(false);tell(q.cells.length+' cellules financées. Rejoignez-les avec les outils, ou affectez des ouvriers.','good');return q;
  }
  function cancel(){preview=null;anchor=null;if(tool==='trace')tool='none';g.releaseInputs?.();tell('Aperçu annulé. Aucun matériau débité.');}
  function equip(){ensure();rebuildPreview=null;if(!available())return false;
    const next=tool==='work'?'none':'work';g.cancelPlacement?.();clearOtherTools();tool=next;preview=null;anchor=null;g.showCommand?.(false);
    tell(tool==='work'?'Outils de voirie équipés : ACTION / E travaille la cellule accessible la plus proche. Armes rangées.':'Outils rangés ; armes et interactions ordinaires disponibles.');return true;
  }
  function activeTool(){return tool==='work'&&!g.siege?.toolActive()&&(!g.dayworks||g.dayworks.overview().tool==='none');}
  function nearestJob(u){
    let result=null,best=Infinity;
    for(const p of engine.state.roads)if(D.unfinished(p)){
      const target=point(p),d=distance(u,target);if(d<best&&d<=1400&&g.workerJobAvailable?.(u,'road:'+p.x+':'+p.y)!==false&&!blocked(p.x,p.y)){best=d;result=p;}
    }return result;
  }
  function assign(id){reconcile();if(!available()||g.workerOrder==='retreat'||engine.state.crew.length>=slots())return{ok:false,reason:tell('Atelier alimenté, place d’équipe et absence d’ordre de repli requis.')};
    const u=id===undefined?g.units.find(u=>live(u)&&u.kind==='worker'&&!unavailable(u.id)):g.units.find(u=>u.id===id&&live(u)&&u.kind==='worker'&&!unavailable(u.id));
    if(!u||!engine.assign(u.id))return{ok:false,reason:tell('Aucun ouvrier libre : les quartiers, secours et escortes gardent leurs équipes.')};
    u.navigation=null;u.targetNode=-1;u.targetBuilding=-1;u.state=u.carry>0?'return':'move';g.save(false);tell('Ouvrier #'+u.id+' détaché. Son sac éventuel sera déposé avant les travaux.');return{ok:true,id:u.id};
  }
  function recall(id){if(!g.canIssueCommand())return false;ensure();if(!engine.recall(id))return false;g.save(false);tell('Rappel transmis. Le retour et le dépôt du sac restent physiques.');return true;}
  function updateAssignedUnit(u,dt){
    ensure();const c=engine.state.crew.find(c=>c.id===u.id);if(!c)return false;
    if(!live(u)){reconcile();return true;}
    if(!running()||!Number.isFinite(dt)||dt<=0)return true;dt=Math.min(dt,R.maxStep);
    const home=g.core();if(!live(home))return true;
    if(g.phase!=='calm'||g.workerOrder==='retreat'||!depots().length||!secure(u))c.returning=true;
    u.supportActive=false;u.targetNode=-1;u.targetBuilding=-1;
    if(u.carry>0){u.state='return';g.depositWorker(u,home,dt);assignments.set(u.id,'Dépôt de la cargaison');return true;}
    if(c.returning){u.state='flee';assignments.set(u.id,'Retour au centre');
      if(g.workerCanWorkAt(u,home,R.homeRange)){engine.state.crew=engine.state.crew.filter(member=>member!==c);assignments.delete(u.id);u.state='idle';u.think=0;u.navigation=null;}
      else g.moveUnitToward(u,home,dt,u.speed);return true;
    }
    const p=nearestJob(u);if(!p){u.state='idle';assignments.set(u.id,'En attente de piste financée');return true;}
    const target=point(p);u.state='build';assignments.set(u.id,'Piste '+p.x+', '+p.y);
    if(!secure(target)){u.state='idle';assignments.set(u.id,'Travaux suspendus : infectés proches');return true;}
    if(!g.workerCanWorkAt(u,target,R.workRange))g.moveWorkerToJob?g.moveWorkerToJob(u,target,dt,'road:'+p.x+':'+p.y):g.moveUnitToward(u,target,dt,u.speed);
    else if(engine.work(p.x,p.y,dt*R.workerWork))changed();return true;
  }
  function changed(){g.world.navigationVersion=(g.world.navigationVersion||0)+1;g.audio?.build();}
  function reconstructionStatus(id){ensure();const r=engine.state.ruins.find(b=>b.id===id),def=r&&C.BUILDINGS[r.type];
    if(!r||!def||r.type==='core')return{ok:false,reason:'Empreinte absente.'};
    const cost={...def.cost},refuse=reason=>({ok:false,cost,reason});
    if(!g.canIssueCommand()||!live(g.player))return refuse('Reprenez la campagne avec un commandant debout.');
    if(g.frontier?.active()||g.expeditions?.driving()||g.player.regionAbsent)return refuse('Rejoignez les ruines à pied dans D-17.');
    if(!['calm','aftermath'].includes(g.phase))return refuse('Attendez le calme ou la sécurisation avant de remettre en chantier.');
    const context=g.fieldcraft?.context();
    if(g.player.reload>0||context?.mounted)return refuse('Terminez le rechargement et quittez le poste de tir manuel.');
    if(g.expansions?.busy()||context?.moving||context?.quote||tool!=='none'||preview||anchor||g.siege?.toolActive()||g.linecare?.toolActive()||(g.dayworks?.overview().tool||'none')!=='none')return refuse('Terminez l’activité en cours et rangez les outils avant la reconstruction.');
    if(def.unlockTier>g.tier.id||def.requires&&!g.world.has(def.requires))return refuse('Palier ou bâtiment requis à rétablir.');
    const q=g.world.placement(def,r.gx,r.gy,r.rotation);if(!q.valid)return refuse(q.reason);
    if(!C.canAfford(g.resources,cost))return refuse('Coût intégral du nouveau chantier insuffisant.');
    if(g.fieldOperations?.canBuild(r.type)===false)return refuse('Plan de terrain requis avant de reconstruire.');
    if(['dayGreenhouse','prefabYard'].includes(r.type)&&!C.Dayworks.unlocked(g.dayworks.snapshot(),r.type))return refuse('Croquis de terrain requis avant de reconstruire.');
    const [w,h]=r.rotation%2?[def.size[1],def.size[0]]:def.size,target={def,completed:true,x:(r.gx+w/2)*C.TILE,y:(r.gy+h/2)*C.TILE,left:r.gx*C.TILE,top:r.gy*C.TILE,right:(r.gx+w)*C.TILE,bottom:(r.gy+h)*C.TILE};
    const access=g.fieldcraft?.service(g.player,target);
    if(!access||!g.workerCanWorkAt(g.player,target,R.workRange)||!g.workerCanWorkAt(g.player,access,R.workRange))return refuse('Approchez le contour de la ruine par un accès libre.');
    if(!secure(g.player)||!secure(access)||!secure(target))return refuse('Éloignez les infectés des ruines avant de reconstruire.');
    const debris=g.fortificationPack?.snapshot().debris.find(d=>d.id===id),salvage={...(debris?.remaining||{})};
    const reason=def.name+' · emplacement '+r.gx+', '+r.gy+' · rotation '+r.rotation+'. Coût intégral : '+C.resourceText(cost)+'. Nouveau chantier de priorité haute, à achever sur place par le joueur ou les ouvriers ; aucun logement, stockage, énergie ou tir avant sa mise en service. Libérez son emprise pour l’achever. '+(C.bagTotal(salvage)>0?'Les débris existants restent récupérables : '+C.resourceText(salvage)+', à trier puis déposer physiquement ; aucun matériau livré automatiquement.':'Aucun matériau livré automatiquement ; les débris éventuels restent finis.');
    return{ok:true,id,ruin:{...r},cost,salvage,reason};
  }
  const reconstructionStamp=q=>JSON.stringify([q.ruin,q.cost,q.salvage]);
  function rebuild(id){ensure();rebuildPreview=null;const q=reconstructionStatus(id);if(!q.ok){tell(q.reason);return q;}
    if(!rebuildCloseHook&&typeof g.showCommand==='function'){wrap('showCommand',(old,show,...args)=>{if(!show)rebuildPreview=null;return old(show,...args);});rebuildCloseHook=true;}
    rebuildPreview={world:g.world,id,stamp:reconstructionStamp(q),quote:q};tell(q.reason);return{...q,confirm:true};
  }
  function confirmRebuild(id=rebuildPreview?.id){ensure();const p=rebuildPreview;rebuildPreview=null;
    if(!p||p.world!==g.world||p.id!==id)return{ok:false,reason:tell('Prévisualisez ce chantier avant de le confirmer. Aucun matériau débité.')};
    const q=reconstructionStatus(id);if(!q.ok){tell(q.reason);return q;}
    if(reconstructionStamp(q)!==p.stamp)return{ok:false,reason:tell('Le devis a changé. Prévisualisez à nouveau : aucun matériau débité.')};
    const r=q.ruin;buildingAgain=true;let result;
    try{result=g.placeOne(r.type,r.gx,r.gy,r.rotation);}finally{buildingAgain=false;}
    if(!result)return{ok:false,reason:tell('Reconstruction refusée par le placement du jeu. Empreinte et matériaux conservés.')};
    const b=g.world.atCell(r.gx,r.gy);b.priority=3;engine.forget(id,true);g.refreshMetrics(true);const saved=g.save(false);
    const reason=C.BUILDINGS[r.type].name+' : chantier financé au coût intégral, priorité haute. Construisez-le pour le mettre en service. Débris conservés, aucun matériau livré.'+(saved?'':' Sauvegarde locale non effectuée.');tell(reason,saved?'good':'danger');return{ok:true,id:b.id,saved,reason};
  }
  function cancelRebuild(){const had=Boolean(rebuildPreview);rebuildPreview=null;tell('Devis de reconstruction annulé. Aucun matériau débité.');return had;}
  function forget(id,confirmed=false){ensure();if(!g.canIssueCommand()||!engine.state.ruins.some(r=>r.id===id))return{ok:false};
    if(!confirmed)return{ok:false,confirm:true,reason:'Effacer ce repère uniquement ? Aucun bâtiment ni matériau ne sera modifié.'};
    engine.forget(id);if(rebuildPreview?.id===id)rebuildPreview=null;g.save(false);tell('Repère effacé. Aucun remboursement ni changement du terrain.');return{ok:true};
  }
  function removeRoad(x,y,confirmed=false){ensure();if(!available()||!engine.road(x,y))return{ok:false};if(!confirmed)return{ok:false,confirm:true,reason:'Retirer la cellule '+x+', '+y+' et son bonus sans remboursement ?'};
    const finished=engine.road(x,y).progress===1;engine.remove(x,y);if(finished)changed();g.save(false);tell('Piste retirée, sans remboursement. Le sol reste praticable.');return{ok:true};
  }
  function mark(id){ensure();const r=engine.state.ruins.find(r=>r.id===id);if(!r||!g.canIssueCommand())return false;marked=id;g.showCommand?.(false);tell('Empreinte marquée. Aucun déplacement automatique du commandant.');return true;}
  function findPath(start,goal,isBlocked,width=128,height=128,maxExpanded=8192,kind='friendly'){
    ensure();const maximum=Math.max(...Object.values(D.SURFACES).map(s=>kind==='truck'?s.truckSpeed:s.friendlySpeed));
    return D.findRoute(start,goal,isBlocked,(x,y)=>{const road=engine.road(x,y);if(road?.progress!==1)return 1;const b=g.world.atCell?.(x,y),s=D.surface(road),ratio=kind==='truck'?s.truckSpeed:s.friendlySpeed;return live(b)&&!b.def.gate?1:1/ratio;},width,height,maxExpanded,1/maximum);
  }
  function drawRoads(ctx,view){ensure();const v=view||{left:0,top:0,right:4096,bottom:4096};ctx.save();
    for(const p of engine.state.roads){const x=p.x*32,y=p.y*32;if(x+32<v.left||x>v.right||y+32<v.top||y>v.bottom)continue;
      const s=D.surface(p);ctx.fillStyle=p.progress===1?s.color:'rgba(200,178,112,.20)';ctx.globalAlpha=p.progress===1?.85:1;ctx.fillRect(x+1,y+1,30,30);
      if(p.progress===1){ctx.strokeStyle='rgba(218,213,190,.42)';ctx.lineWidth=1;
        if(s.pattern==='paving'){for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.strokeRect(x+3+col*9,y+3+row*9,8,8);}
        else if(s.pattern==='concrete'){ctx.strokeRect(x+3,y+3,26,26);ctx.beginPath();ctx.moveTo(x+16,y+3);ctx.lineTo(x+16,y+29);ctx.moveTo(x+3,y+16);ctx.lineTo(x+29,y+16);ctx.stroke();}
        else if(s.pattern==='logistics'){ctx.fillStyle='#d7c68c';ctx.fillRect(x+6,y+4,2,24);ctx.fillRect(x+24,y+4,2,24);ctx.fillRect(x+15,y+7,2,7);ctx.fillRect(x+15,y+19,2,7);}
        else for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+5+i*8,y+7+(p.x%3));ctx.lineTo(x+8+i*8,y+17);ctx.stroke();}
      }
      if(D.unfinished(p)){const progress=p.upgrade?.progress??p.progress;ctx.globalAlpha=1;ctx.strokeStyle=p.upgrade?'#e6a866':'#dbbb78';ctx.setLineDash([4,4]);ctx.strokeRect(x+3,y+3,26,26);ctx.setLineDash([]);ctx.fillStyle='#29342e';ctx.fillRect(x+5,y+25,22,3);ctx.fillStyle='#e2be6c';ctx.fillRect(x+5,y+25,22*progress,3);}
    }ctx.restore();
  }
  function drawGuide(ctx){if(preview){ctx.save();for(const p of preview){ctx.fillStyle=blocked(p.x,p.y)?'rgba(214,96,73,.45)':'rgba(145,202,143,.28)';ctx.fillRect(p.x*32+1,p.y*32+1,30,30);}ctx.restore();}
    if(anchor){ctx.save();ctx.strokeStyle='#d2c78c';ctx.lineWidth=2;ctx.strokeRect(anchor.x*32,anchor.y*32,32,32);ctx.restore();}
    const r=engine.state.ruins.find(r=>r.id===marked);if(!r)return;const d=C.BUILDINGS[r.type],w=(r.rotation%2?d.size[1]:d.size[0])*32,h=(r.rotation%2?d.size[0]:d.size[1])*32;
    ctx.save();ctx.strokeStyle='#e6b28a';ctx.setLineDash([7,5]);ctx.lineWidth=2;ctx.strokeRect(r.gx*32,r.gy*32,w,h);ctx.setLineDash([]);ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f0c398';ctx.fillText('À RECONSTRUIRE · '+d.name,r.gx*32+w/2,r.gy*32-12);ctx.restore();
  }
  function overview(){reconcile();return{phase:g.phase,notice,tool,selectedSurface,roadMode,surfaces:Object.values(D.SURFACES).map(s=>({...s,status:D.surfaceStatus(s.id,g.tier.id,type=>g.world.has(type))})),preview:preview?D.quote(engine.state,preview,g.resources,blocked,roadOptions()):null,rebuildPreview:rebuildPreview?{...rebuildPreview.quote,check:reconstructionStatus(rebuildPreview.id)}:null,
    roads:engine.state.roads.map(r=>({...r,...(r.upgrade?{upgrade:{...r.upgrade}}:{})})),complete:engine.state.roads.filter(p=>p.progress===1).length,jobs:engine.state.roads.filter(D.unfinished).length,slots:slots(),
    crew:engine.state.crew.map(c=>({...c,job:assignments.get(c.id)||'Prise de poste',blocked:g.units.find(u=>u.id===c.id)?.navigation?.cells===null})),
    ruins:engine.state.ruins.map(r=>({...r,name:C.BUILDINGS[r.type]?.name||r.type,status:reconstructionStatus(r.id)})),stats:{...engine.state.stats}};}
  wrap('serialize',(old,...args)=>{reconcile();return{...old(...args),infrastructure:engine.snapshot()};});
  wrap('restoreSave',(old,input)=>{const data=root.DeadwallSave.validate(input),before=g.world;pending=D.normalize(data.infrastructure);try{return old(data);}finally{if(g.world!==before){ensure();reconcile();}pending=null;}});
  wrap('startNew',(old,...args)=>{const before=g.world,result=old(...args);if(g.world!==before){ensure();g.save(false);}return result;});
  wrap('returnToMenu',(old,...args)=>{rebuildPreview=null;return old(...args);});
  wrap('update',(old,dt)=>{ensure();if(running()&&finiteStep(dt)){nextInspection-=dt;if(nextInspection<=0){reconcile();nextInspection=.5;}}
    const result=old(dt);if(tool==='work'&&(g.siege?.toolActive()||g.dayworks?.overview()?.tool!=='none'))tool='none';return result;});
  function finiteStep(dt){return typeof dt==='number'&&Number.isFinite(dt)&&dt>0;}
  wrap('updateDirector',(old,dt)=>{ensure();const before=g.phase,result=old(dt);if(before==='calm'&&g.phase!=='calm'){for(const c of engine.state.crew)c.returning=true;tool='none';anchor=null;preview=null;g.releaseInputs?.();tell('Crépuscule : voirie suspendue et équipes rappelées. Les pistes achevées restent actives.');}return result;});
  wrap('updateInteraction',(old,dt)=>{
    if(!activeTool()||!running()||!live(g.player)||g.selectedBuild||g.rallyPlacement)return old(dt);
    g.interactionText='Outils de voirie : maintenez ACTION près d’une piste financée.';
    if(!activeDay()||!finiteStep(dt)||!g.input.keys.has('KeyE'))return;
    const p=nearestJob(g.player);if(!p)return;const target=point(p);
    if(!g.workerCanWorkAt(g.player,target,R.workRange)||!secure(g.player)||!secure(target)){g.interactionText='Accès libre et abords sécurisés requis.';return;}
    const targetName=D.SURFACES[p.upgrade?.surface||p.surface||'gravel'].name;if(engine.work(p.x,p.y,Math.min(dt,R.maxStep)*R.playerWork))changed();g.interactionText=targetName+' : '+Math.floor((p.upgrade?.progress??p.progress)*100)+' %';
  });
  for(const name of ['shootPlayer','melee','startReload'])wrap(name,(old,...args)=>activeTool()||tool==='trace'||preview?false:old(...args));
  if(typeof g.cancelPlacement==='function')wrap('cancelPlacement',(old,...args)=>{anchor=null;preview=null;if(tool==='trace')tool='none';return old(...args);});
  if(typeof g.selectBuild==='function')wrap('selectBuild',(old,...args)=>{tool='none';anchor=null;preview=null;return old(...args);});
  if(typeof g.onEscape==='function')wrap('onEscape',(old,...args)=>{if(preview||anchor||tool!=='none'){tool='none';cancel();return;}return old(...args);});
  wrap('destroyBuilding',(old,b,...args)=>{
    ensure();const record=b&&!b.dead&&g.world.buildings.get(b.id)===b&&b.type!=='core'?{id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation||0}:null;
    const result=old(b,...args);if(record&&!g.gameOver&&!g.world.buildings.has(record.id))engine.remember(record,g.elapsed);return result;
  });
  wrap('updateUI',(old,...args)=>{const result=old(...args);g.infrastructureUI?.refresh();return result;});
  if(typeof g.drawGround==='function')wrap('drawGround',(old,ctx,...args)=>{const result=old(ctx,...args);drawGuide(ctx);return result;});
  if(g.art?.drawBuilding){const old=g.art.drawBuilding.bind(g.art);g.art.drawBuilding=(ctx,b,world)=>{
    if(b.type!=='roadDepot')return old(ctx,b,world);const w=96,h=96;ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.rotation||0)*Math.PI/2);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-w/2+7,-h/2+8,w,h);ctx.fillStyle='#81785e';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#c4b38c';ctx.lineWidth=3;ctx.strokeRect(-w/2,-h/2,w,h);
    ctx.fillStyle='#343c35';ctx.fillRect(-34,5,40,38);ctx.fillStyle='#b0a889';for(let y=-32;y<0;y+=8)ctx.fillRect(-35,y,70,4);ctx.fillStyle='#bcb492';ctx.fillRect(17,10,20,25);ctx.strokeStyle='#e9c97b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(11,-14);ctx.lineTo(35,32);ctx.moveTo(35,-14);ctx.lineTo(11,32);ctx.stroke();ctx.restore();return true;
  };}
  function canvasPoint(e){return{x:Math.floor(((e.clientX-g.width/2)/g.camera.zoom+g.camera.x)/32),y:Math.floor(((e.clientY-g.height/2)/g.camera.zoom+g.camera.y)/32)};}
  if(g.canvas?.addEventListener){let clickPointer=null;
    g.canvas.addEventListener('pointerdown',e=>{if(tool!=='trace'||!running()||e.button!==0||clickPointer!==null||e.isPrimary===false)return;e.preventDefault();e.stopImmediatePropagation();clickPointer=e.pointerId;try{g.canvas.setPointerCapture?.(e.pointerId);}catch{/* A detached or cancelled pointer no longer owns native capture. */}
      const p=canvasPoint(e);if(!anchor){if(D.line(p,p)){anchor=p;tell('Départ posé. Choisissez maintenant l’arrivée.');}}
      else{const result=plan(anchor,p);if(preview){g.showCommand?.(true,'field');g.infrastructureUI?.open();}else tell(result.reason);}g.input.mouseDown=false;
    },true);
    for(const type of ['pointerup','pointercancel','lostpointercapture'])g.canvas.addEventListener(type,e=>{if(clickPointer===e.pointerId){clickPointer=null;if(type!=='pointerup'&&tool==='trace'){anchor=null;}e.preventDefault();e.stopImmediatePropagation();}},true);
    g.canvas.addEventListener('mousedown',e=>{if(tool==='trace'||preview){e.preventDefault();e.stopImmediatePropagation();}},true);
    g.canvas.addEventListener('contextmenu',e=>{if(tool==='trace'||preview){e.preventDefault();e.stopImmediatePropagation();cancel();}},true);
  }
  g.infrastructure=Object.freeze({version:D.VERSION,snapshot:()=>{reconcile();return engine.snapshot();},overview,chooseSurface,beginTrace,plan,commit,cancel,equip,isAssigned,assign,recall,updateAssignedUnit,
    speed:(x,y,kind)=>{ensure();const boost=engine.multiplier(x,y,kind);if(boost===1)return 1;const gx=Math.floor(x/32),gy=Math.floor(y/32),b=g.world.atCell?.(gx,gy);return live(b)&&!b.def.gate?1:boost;},
    findPath,reconstructionStatus,rebuild,confirmRebuild,cancelRebuild,forget,mark,removeRoad,drawRoads,drawGuide,toolActive:activeTool,
    open:()=>{g.showCommand?.(true,'field');g.infrastructureUI?.open();}});
  ensure();
})(typeof globalThis!=='undefined'?globalThis:this);

(function mountInfrastructureUI(root){
 'use strict';const g=root.DEADWALL,D=root.DeadwallInfrastructure,C=root.DeadwallCore;if(!root.document||!g?.infrastructure)return;
 function mount(){
  const field=document.getElementById('commandPanel-field'),nav=field?.querySelector('.field-nav');if(!field||!nav)return;
  const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;return n;};
  const text=(n,t)=>{if(n.textContent!==String(t))n.textContent=String(t);};
  const button=(title,id,action)=>{const b=el('button',title);b.type='button';b.id=id;b.addEventListener('click',()=>{if(!b.disabled&&!b.closest('[inert]')){action();refresh(true);}});return b;};
  const css=el('style');css.textContent=`
  .infra16{--edge:#56695c;--muted:#c0cabc;color:#efeee0;padding:10px 0 24px;max-width:100%}.infra16 *{box-sizing:border-box}.infra16 p{font-size:13px;line-height:1.65;color:var(--muted)}.infra16 h2{font-size:32px;line-height:1.1;margin:10px 0}.infra16 h3{font-size:18px;margin:8px 0 12px}.infra16 small{font-size:11px;letter-spacing:.06em;color:#dbc79a}.infra16 button,.infra16 input{font:inherit;font-size:12px;min-height:42px;border:1px solid #81907a;border-radius:5px;background:#2c4035;color:#f7f0d5;padding:9px 12px;max-width:100%}.infra16 input{width:100%}.infra16 button{cursor:pointer}.infra16 button:disabled{opacity:.45;cursor:not-allowed}.infra16 button:focus-visible,.infra16 input:focus-visible{outline:3px solid #f7ca72;outline-offset:3px}.infra16 button[aria-selected=true]{background:#617056;border-color:#d3c18b}.infra16-hero{padding:24px;border:1px solid #a29b75;border-radius:10px;background:linear-gradient(125deg,#404c38,#1a2e29);display:grid;grid-template-columns:1.7fr 1fr;gap:22px}.infra16-metrics{display:grid;grid-template-columns:1fr 1fr;gap:12px}.infra16-metrics div{padding:12px;border:1px solid #819078;border-radius:6px}.infra16-metrics b{display:block;font-size:27px}.infra16-tabs,.infra16-actions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.infra16-status{border-left:3px solid #dec185;background:#243a2f;padding:11px 15px;min-height:46px}.infra16-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:17px}.infra16-card{border:1px solid var(--edge);border-radius:9px;padding:19px;background:#1a3028;min-width:0}.infra16-card label{display:block;font-size:12px;color:#dfdbba;margin:0 0 5px}.infra16-coords{display:grid;grid-template-columns:1fr 1fr;gap:10px}.infra16-map{width:100%;height:auto;aspect-ratio:1;border:1px solid #617663;border-radius:7px;background:#11251b}.infra16-preview{border:1px solid #c3a671;background:#303d29;border-radius:7px;padding:15px;margin:15px 0}.infra16-list{display:grid;grid-template-columns:1fr 1fr;gap:12px}.infra16-row{padding:12px 0;border-bottom:1px solid var(--edge);display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}.infra16-pager{display:flex;justify-content:space-between;align-items:center;gap:9px;margin-top:12px}.infra16-confirm{border:2px solid #d79c78;background:#3d3025;padding:14px;border-radius:7px}.infra16 .hidden{display:none!important}.city16-dock{margin-top:8px;background:#183023;border:1px solid #6e8369;border-radius:7px;padding:0 10px;color:#e9e7ce;pointer-events:auto}.city16-dock summary{min-height:46px;cursor:pointer;padding:12px 2px;font-size:12px;line-height:1.5}.city16-dock summary:focus-visible{outline:3px solid #f7cc80;outline-offset:3px}.city16-dock[data-danger=true]{border-color:#e4a377}.city16-dock>div{padding-bottom:10px}.city16-open{display:block;width:100%;min-height:44px;margin:6px 0;background:#314b3a;border:1px solid #7c9379;color:#eee8cd;border-radius:5px;text-align:left;padding:10px;cursor:pointer}.high-contrast .infra16-card{background:#08160c;color:white}.high-contrast .infra16 p{color:#eee}.infra16-note{font-size:12px;color:#d0b58b!important}
  .infra16 button[aria-pressed=true]{background:#617056;border-color:#d3c18b}.infra16 fieldset{border:1px solid var(--edge);border-radius:7px;min-width:0;margin:12px 0;padding:10px}.infra16 legend{font-size:13px;color:#dfdbba;padding:0 5px}
  @media(max-width:720px){.infra16-hero,.infra16-grid,.infra16-list{grid-template-columns:1fr}.infra16-hero{padding:18px}.infra16 h2{font-size:26px}.infra16 button,.infra16 input{min-height:46px}.infra16-tabs{display:grid;grid-template-columns:1fr 1fr}.infra16-row{align-items:flex-start;flex-wrap:wrap}.infra16-card{padding:15px}}
  `;document.head.appendChild(css);
  const panel=el('section',undefined,'infra16 hidden');panel.id='infrastructurePanel';field.appendChild(panel);
  const navButton=button('PISTES & RECONSTRUCTION','infrastructureTab',open);navButton.setAttribute('aria-pressed','false');nav.appendChild(navButton);
  const hero=el('header',undefined,'infra16-hero'),copy=el('div');copy.append(el('small','D-17 / LES ARTÈRES DE LA CITÉ'),el('h2','Relier. Tenir. Rebâtir.'),el('p','Des équipes qui marchent, des convois qui rentrent, des emplacements que la nuit ne fait pas oublier. Chaque raccourci vers la cité reste un accès à défendre.'));hero.appendChild(copy);
  const metrics=el('div',undefined,'infra16-metrics'),nums={};for(const [id,label]of [['roads','CELLULES ACHEVÉES'],['jobs','CELLULES À FINIR'],['crew','OUVRIERS DÉTACHÉS'],['ruins','EMPREINTES CONSERVÉES']]){const block=el('div'),n=el('b','0');block.append(el('small',label),n);metrics.appendChild(block);nums[id]=n;}hero.appendChild(metrics);panel.appendChild(hero);
  const status=el('p',undefined,'infra16-status');status.id='infrastructureStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.appendChild(status);
  const tabs=el('nav',undefined,'infra16-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Voirie et reconstruction');panel.appendChild(tabs);
  const sections={},tabButtons={};let tab='roads',page=0,lastRefresh=-Infinity,worldRef=null,pending=null,listKey='';
  function choose(id,focus=false){if(!sections[id])return;if(pending?.type==='rebuild'&&id!=='rebuild'){g.infrastructure.cancelRebuild();pending=null;review.classList.add('hidden');}tab=id;for(const key of Object.keys(sections)){sections[key].classList.toggle('hidden',key!==id);tabButtons[key].setAttribute('aria-selected',String(key===id));tabButtons[key].tabIndex=key===id?0:-1;}if(focus)tabButtons[id].focus();refresh(true);}
  for(const [id,label]of [['roads','LES LIAISONS'],['rebuild','APRÈS LE SIÈGE']]){const b=button(label,'infra-sub-'+id,()=>choose(id));b.setAttribute('role','tab');b.setAttribute('aria-controls','infra-view-'+id);tabs.appendChild(b);tabButtons[id]=b;const s=el('section');s.id='infra-view-'+id;s.setAttribute('role','tabpanel');s.setAttribute('aria-labelledby',b.id);sections[id]=s;panel.appendChild(s);b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.code)){e.preventDefault();choose(e.code==='Home'?'roads':e.code==='End'?'rebuild':tab==='roads'?'rebuild':'roads',true);}});}
  const roadGrid=el('div',undefined,'infra16-grid'),instructions=el('article',undefined,'infra16-card');instructions.append(el('h3','Financer et améliorer les voies'),el('p','Un tronçon comporte au plus 64 cellules, reliées par leurs côtés. Le financement engage les matériaux ; les travaux se font ensuite sur place.'));
  const surfaces=el('fieldset'),legend=el('legend','Revêtement à construire'),surfaceButtons={},surfaceRows={};surfaces.id='infraSurfaces';surfaces.appendChild(legend);
  for(const s of Object.values(D.SURFACES)){const row=el('div',undefined,'infra16-row'),label=el('span'),b=button(s.name,'infraSurface-'+s.id,()=>g.infrastructure.chooseSurface(s.id));b.setAttribute('aria-pressed','false');row.append(b,label);surfaces.appendChild(row);surfaceButtons[s.id]=b;surfaceRows[s.id]=label;}instructions.appendChild(surfaces);
  const modes=el('div',undefined,'infra16-actions'),newMode=button('NOUVELLE TRACE','infraMode-new',()=>g.infrastructure.chooseSurface(g.infrastructure.overview().selectedSurface,'new')),upgradeMode=button('AMÉLIORER LES VOIES','infraMode-upgrade',()=>g.infrastructure.chooseSurface(g.infrastructure.overview().selectedSurface,'upgrade'));modes.append(newMode,upgradeMode);instructions.appendChild(modes);
  const surfaceNote=el('p');surfaceNote.id='infraSurfaceDetails';instructions.appendChild(surfaceNote);
  const coords=el('div',undefined,'infra16-coords'),inputs={};for(const [id,label,n]of [['x1','Départ X',65],['y1','Départ Y',58],['x2','Arrivée X',74],['y2','Arrivée Y',58]]){const box=el('div'),l=el('label',label),input=el('input');input.type='number';input.min=1;input.max=126;input.step=1;input.value=n;input.id='infra-'+id;l.htmlFor=input.id;box.append(l,input);coords.appendChild(box);inputs[id]=input;input.addEventListener('input',()=>{if(g.infrastructure.overview().preview)g.infrastructure.cancel();if(pending?.type==='road'){pending=null;review.classList.add('hidden');}});}instructions.appendChild(coords);
  const actions=el('div',undefined,'infra16-actions'),preview=button('PRÉVISUALISER','infraPreview',()=>{for(const input of Object.values(inputs))if(!input.reportValidity())return;g.infrastructure.plan({x:Number(inputs.x1.value),y:Number(inputs.y1.value)},{x:Number(inputs.x2.value),y:Number(inputs.y2.value)});}),draw=button('TRACER AU SOL','infraTrace',()=>g.infrastructure.beginTrace()),equip=button('OUTILS DE VOIRIE','infraEquip',()=>g.infrastructure.equip());actions.append(preview,draw,equip);instructions.appendChild(actions);
  const quoteBox=el('div',undefined,'infra16-preview hidden'),quoteText=el('p'),confirm=button('FINANCER LES TRAVAUX','infraCommit',()=>g.infrastructure.commit()),cancel=button('ANNULER L’APERÇU','infraCancel',()=>g.infrastructure.cancel());quoteBox.append(quoteText,confirm,cancel);instructions.appendChild(quoteBox);
  instructions.append(el('p','Améliorer paie uniquement la différence de matériaux et de travail entre les deux revêtements. L’ancien bonus reste actif pendant la rénovation ; le nouveau arrive à l’achèvement.'),el('p','Les infectés profitent eux aussi des voies rapides. Le revêtement ne remplace pas les remparts. Les bâtiments qui le recouvrent neutralisent son bonus ; une porte peut le traverser. Aucune ressource naturelle ni surface régionale n’est changée.','infra16-note'));
  const mapBox=el('article',undefined,'infra16-card'),map=el('canvas');map.id='infraMap';map.width=512;map.height=512;map.className='infra16-map';map.setAttribute('role','img');map.setAttribute('aria-label','Carte schématique des structures, pistes financées, emplacements détruits et du commandant.');mapBox.append(el('h3','Le réseau et ses coupures'),map,el('p','Gris : voies achevées, selon leur revêtement. Ocre : nouvelle trace en travaux ; orange : rénovation. Rouge : emplacements perdus. Clair : structures. Bleu : commandant. Cette carte ne valide pas une enceinte fermée.'));
  roadGrid.append(instructions,mapBox);sections.roads.appendChild(roadGrid);
  const crews=el('article',undefined,'infra16-card'),crewRows=el('div'),crewNote=el('p'),assign=button('DÉTACHER UN OUVRIER','infraAssign',()=>g.infrastructure.assign());crews.append(el('h3','Une équipe de voirie, pas des ouvriers gratuits'),el('p','L’atelier alimenté accueille deux ouvriers existants, jusqu’à huit au total. Ils déposent leur sac, rejoignent les cellules financées et travaillent sur place. Les équipes de secours et des quartiers ne sont pas détournées.'),crewNote,assign,crewRows);sections.roads.appendChild(crews);
  const erase=el('details',undefined,'infra16-card');erase.append(el('summary','Retirer une cellule sans remboursement'));const remove=button('RETIRER LA CELLULE DE DÉPART','infraRemove',()=>{const x=Number(inputs.x1.value),y=Number(inputs.y1.value),r=g.infrastructure.removeRoad(x,y);if(r.confirm){pending={type:'road',x,y};showConfirm(r.reason);}});erase.append(el('p','Utilise les coordonnées Départ X / Y ci-dessus. Retire seulement le revêtement ; n’enlève ni bâtiment ni porte.'),remove);sections.roads.appendChild(erase);
  sections.rebuild.append(el('h3','Repartir des emplacements perdus'),el('p','Les 96 dernières empreintes de structures détruites par dégâts sont conservées depuis cette mise à niveau. Le démontage volontaire ne crée pas de plan de reconstruction. Rejoignez la ruine à pied par un accès libre, au calme ou pendant la sécurisation. Le devis confirme le coût complet, l’orientation et les travaux nécessaires. Les débris restent à trier puis à déposer, sans livraison automatique.'));
  const lostList=el('div',undefined,'infra16-list'),lostNote=el('p');sections.rebuild.append(lostNote,lostList);
  const pager=el('div',undefined,'infra16-pager'),prev=button('PRÉCÉDENTES','infraPrev',()=>{page--;listKey='';}),pageText=el('span'),next=button('SUIVANTES','infraNext',()=>{page++;listKey='';});pager.append(prev,pageText,next);sections.rebuild.appendChild(pager);
  const review=el('div',undefined,'infra16-confirm hidden'),reviewText=el('p'),yes=button('CONFIRMER','infraConfirmRemove',()=>{const rebuild=pending?.type==='rebuild';if(pending?.type==='road')g.infrastructure.removeRoad(pending.x,pending.y,true);else if(pending?.type==='ruin')g.infrastructure.forget(pending.id,true);else if(rebuild)g.infrastructure.confirmRebuild(pending.id);pending=null;review.classList.add('hidden');if(rebuild)tabButtons.rebuild.focus({preventScroll:true});}),no=button('CONSERVER','infraKeep',()=>{if(pending?.type==='rebuild')g.infrastructure.cancelRebuild();pending=null;review.classList.add('hidden');tabButtons[tab].focus({preventScroll:true});});review.id='infrastructureConfirmation';reviewText.id='infrastructureConfirmationText';review.setAttribute('role','group');review.setAttribute('aria-labelledby',reviewText.id);yes.setAttribute('aria-describedby',reviewText.id);no.setAttribute('aria-describedby',reviewText.id);review.append(reviewText,yes,no);panel.appendChild(review);
  function showConfirm(message){text(reviewText,message);text(yes,pending?.type==='rebuild'?'CONFIRMER LE CHANTIER':'CONFIRMER');text(no,pending?.type==='rebuild'?'ANNULER LE DEVIS':'CONSERVER');review.classList.remove('hidden');review.scrollIntoView?.({block:'nearest'});yes.focus({preventScroll:true});}
  // Preserve existing IDs and handlers, but stop piling seven full cards over the battlefield.
  const dock=el('details',undefined,'city16-dock'),summary=el('summary','OPÉRATIONS DE LA CITÉ'),content=el('div');dock.id='citySystemsDock';summary.id='citySystemsSummary';dock.append(summary,content);
  for(const node of [...(g.ui.rightPanel?.querySelectorAll('.ops-hud,.territory-hud,.siege-hud,#dayworksHud,#citadelHud')||[])])content.appendChild(node);
  const hud=button('PISTES & RECONSTRUCTION','infrastructureHud',()=>g.infrastructure.open());hud.className='city16-open';content.appendChild(hud);g.ui.rightPanel?.appendChild(dock);
  dock.addEventListener('toggle',()=>{if(!dock.open&&content.contains(document.activeElement))summary.focus({preventScroll:true});});
  function drawMap(v){const c=map.getContext('2d');c.fillStyle='#11251b';c.fillRect(0,0,512,512);c.strokeStyle='#2c4233';c.lineWidth=1;for(let i=0;i<512;i+=32){c.beginPath();c.moveTo(i,0);c.lineTo(i,512);c.moveTo(0,i);c.lineTo(512,i);c.stroke();}
    for(const b of g.world.buildings.values())if(!b.dead){c.fillStyle=b.def.gate?'#e1d893':'#a9baa3';c.fillRect(b.gx*4,b.gy*4,b.w*4,b.h*4);}
    for(const r of v.roads){c.fillStyle=r.progress===1?D.surface(r).color:'#80744f';c.fillRect(r.x*4+1,r.y*4+1,3,3);if(r.upgrade){c.fillStyle='#e6a866';c.fillRect(r.x*4+1,r.y*4+1,1,1);}}
    for(const r of v.ruins){c.strokeStyle='#e7a286';c.strokeRect(r.gx*4,r.gy*4,8,8);}
    c.fillStyle='#9cdef5';c.beginPath();c.arc(g.player.x/8,g.player.y/8,4,0,Math.PI*2);c.fill();
  }
  function open(){for(const s of field.children)if(s.tagName==='SECTION')s.classList.toggle('hidden',s!==panel);for(const b of nav.children)b.setAttribute('aria-pressed',String(b===navButton));refresh(true);}
  nav.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b!==navButton){if(pending?.type==='rebuild'){g.infrastructure.cancelRebuild();pending=null;review.classList.add('hidden');}panel.classList.add('hidden');navButton.setAttribute('aria-pressed','false');}});
  function refresh(force=false){const now=performance.now();if(!force&&now-lastRefresh<500)return;lastRefresh=now;
    if(worldRef!==g.world){worldRef=g.world;pending=null;review.classList.add('hidden');page=0;listKey='';}
    const v=g.infrastructure.overview(),can=g.canIssueCommand(),day=can&&g.phase==='calm'&&!g.player.dead,playing=g.state==='playing'&&!g.gameOver;
    const fires=g.siege?.snapshot().fires.length||0,escorts=g.citadel?.overview().active||0;
    text(summary,fires?'URGENCE INCENDIE · '+fires+' foyer(s)':'OPÉRATIONS · '+escorts+' escorte(s) · '+(g.salvage?.snapshot().crews.length||0)+' récupération(s) · '+v.jobs+' travaux');dock.dataset.danger=String(fires>0);dock.classList.toggle('hidden',!playing);hud.disabled=!playing;
    if(panel.classList.contains('hidden'))return;
    text(nums.roads,v.complete);text(nums.jobs,v.jobs);text(nums.crew,v.crew.length);text(nums.ruins,v.ruins.length);text(status,v.notice||'Les chantiers se préparent au calme. Une voie rapide vers la cité n’est jamais une défense.');
    for(const s of v.surfaces){const selected=s.id===v.selectedSurface,b=surfaceButtons[s.id];b.disabled=!can||!s.status.ok;b.setAttribute('aria-pressed',String(selected));text(surfaceRows[s.id],C.CITY_TIERS[s.unlockTier].name+' · '+(s.status.ok?'disponible':s.status.reason));}
    const selected=D.SURFACES[v.selectedSurface],percent=n=>Math.round((n-1)*100);text(surfaceNote,selected.name+' : '+C.resourceText(selected.cost)+' / cellule ; '+selected.workSeconds+' unités de travail. Achevé : alliés +'+percent(selected.friendlySpeed)+' %, fourgons +'+percent(selected.truckSpeed)+' %, infectés +'+percent(selected.hostileSpeed)+' %.');
    newMode.disabled=!can;upgradeMode.disabled=!can||selected.rank===0;newMode.setAttribute('aria-pressed',String(v.roadMode==='new'));upgradeMode.setAttribute('aria-pressed',String(v.roadMode==='upgrade'));
    const selectedStatus=v.surfaces.find(s=>s.id===v.selectedSurface).status;preview.disabled=draw.disabled=!day||!g.world.has('planningOffice')||!selectedStatus.ok;equip.disabled=remove.disabled=!day;equip.setAttribute('aria-pressed',String(v.tool==='work'));assign.disabled=!day||v.crew.length>=v.slots||g.workerOrder==='retreat';
    quoteBox.classList.toggle('hidden',!v.preview);if(v.preview){text(quoteText,(v.preview.cells?.length||0)+' cellules '+(v.roadMode==='upgrade'?'à améliorer':'nouvelles')+' · '+C.resourceText(v.preview.cost||{})+' — '+v.preview.reason);confirm.disabled=!day||!v.preview.ok;}
    text(crewNote,v.crew.length+' / '+v.slots+' places alimentées. Crépuscule, danger, perte du poste ou repli général : retour au centre.');
    const remembered=document.activeElement?.id;crewRows.replaceChildren();for(const u of v.crew){const row=el('div',undefined,'infra16-row'),b=button(u.returning?'RAPPEL EN COURS':'RAPPELER','infraRecall-'+u.id,()=>g.infrastructure.recall(u.id));b.disabled=!can||u.returning;row.append(el('span','#'+u.id+' · '+u.job+(u.blocked?' · accès bloqué':'')),b);crewRows.appendChild(row);}if(remembered?.startsWith('infraRecall-'))document.getElementById(remembered)?.focus({preventScroll:true});
    const pages=Math.max(1,Math.ceil(v.ruins.length/8));page=Math.min(Math.max(0,page),pages-1);const show=v.ruins.slice().reverse().slice(page*8,page*8+8),key=JSON.stringify(show);
    text(lostNote,v.ruins.length?'Chaque ligne est un emplacement perdu, pas une structure existante.':'Aucune empreinte conservée dans cette campagne.');
    if(key!==listKey){const focused=document.activeElement?.id,host=panel.closest('.command-body'),scroll=host?.scrollTop;listKey=key;lostList.replaceChildren();for(const r of show){const card=el('article',undefined,'infra16-card'),actions=el('div',undefined,'infra16-actions'),mark=button('REPÉRER','infraMark-'+r.id,()=>g.infrastructure.mark(r.id)),build=button('PRÉVISUALISER LE CHANTIER','infraRebuild-'+r.id,()=>{const result=g.infrastructure.rebuild(r.id);if(result.confirm){pending={type:'rebuild',id:r.id};showConfirm(result.reason);}}),forget=button('OUBLIER CE REPÈRE','infraForget-'+r.id,()=>{const result=g.infrastructure.forget(r.id);if(result.confirm){g.infrastructure.cancelRebuild();pending={type:'ruin',id:r.id};showConfirm(result.reason);}});build.disabled=!can||!r.status.ok;mark.disabled=forget.disabled=!can;actions.append(mark,build,forget);card.append(el('small','EMPLACEMENT '+r.gx+', '+r.gy+' · ROTATION '+r.rotation),el('h3',r.name),el('p',C.resourceText(r.status.cost||{})),el('p',r.status.reason),actions);lostList.appendChild(card);}if(focused?.startsWith('infraRebuild-')||focused?.startsWith('infraMark-')||focused?.startsWith('infraForget-')){const target=document.getElementById(focused);(target&&!target.disabled?target:tabButtons.rebuild).focus({preventScroll:true});}if(host&&scroll!==undefined)host.scrollTop=scroll;}
    prev.disabled=page===0;next.disabled=page>=pages-1;text(pageText,(page+1)+' / '+pages);yes.disabled=!can;
    if(pending?.type==='rebuild'){if(v.rebuildPreview?.id!==pending.id){pending=null;review.classList.add('hidden');}else{const q=v.rebuildPreview.check;text(reviewText,q.ok?v.rebuildPreview.reason:q.reason+' Aucun matériau débité. Prévisualisez à nouveau après correction.');yes.disabled=!can||!q.ok;}}
    drawMap(v);
  }
  g.infrastructureUI=Object.freeze({open,refresh,choose});choose('roads');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL INFRASTRUCTURE 1.6 — END */

(function installSalvageHost(root){const api=typeof module!=='undefined'&&module.exports?require('./salvage.js'):root.DeadwallSalvage;api.install(root.DEADWALL);})(globalThis);

(function(root){const load=n=>typeof module!=='undefined'&&module.exports?require('./'+n+'.js'):root[{urban:'DeadwallUrban','urban-art':'DeadwallUrbanArt',nightwatch:'DeadwallNightwatch'}[n]];for(const n of ['urban','urban-art','nightwatch'])load(n).install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./power-grid.js'):root.DeadwallPowerGrid;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./power-grid-art.js'):root.DeadwallPowerGridArt;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./expeditions.js'):root.DeadwallExpeditions;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./expedition-art.js'):root.DeadwallExpeditionArt;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./fieldcraft.js'):root.DeadwallFieldcraft;api.attach(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./frontier.js'):root.DeadwallFrontier;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./frontier-care.js'):root.DeadwallFrontierCare;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./return-routes.js'):root.DeadwallReturnRoutes;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./field-atlas.js'):root.DeadwallFieldAtlas;api.install(root.DEADWALL);})(globalThis);

(function(root){const api=typeof module!=='undefined'&&module.exports?require('./essential-ops.js'):root.DeadwallEssentialOps;api.install(root.DEADWALL);})(globalThis);

(function(root){const e=typeof module!=='undefined'&&module.exports?require('./world-evolution.js'):root.DeadwallWorldEvolution;e.install(root.DEADWALL);const c=typeof module!=='undefined'&&module.exports?require('./coop.js'):root.DeadwallCoop;c.install(root.DEADWALL);})(globalThis);

/* Browser installation follows the physical exploration and lighting extensions. */
(function installVisibility146Host(root){
 if(typeof module!=='undefined'&&module.exports)require('./visibility146.js').install(root.DEADWALL);
})(globalThis);
