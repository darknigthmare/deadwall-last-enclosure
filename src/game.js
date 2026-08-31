(function initDeadwall() {
  'use strict';
  const C = globalThis.DeadwallCore;
  if (!C) throw new Error('DeadwallCore introuvable.');
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
      if (this.dead || this.completed) return false;
      const before = this.progress;
      this.progress = clamp(this.progress + amount / Math.max(1, this.def.buildTime), 0, 1);
      this.health = Math.max(this.health, this.maxHealth * (0.12 + this.progress * 0.88));
      return before < 1 && this.completed;
    }
  }

  class ResourceNode {
    constructor(id, type, x, y, amount, radius, variant) {
      this.id = id; this.type = type; this.x = x; this.y = y; this.amount = amount; this.maxAmount = amount;
      this.radius = radius; this.variant = variant; this.depleted = false; this.flash = 0;
    }
    harvest(amount) {
      if (this.depleted) return 0;
      const value = Math.min(this.amount, amount);
      this.amount -= value; this.flash = 0.14;
      if (this.amount <= 0.01) { this.amount = 0; this.depleted = true; }
      return value;
    }
  }

  class Unit {
    constructor(id, kind, x, y) {
      this.id = id; this.kind = kind; this.x = x; this.y = y; this.dead = false;
      this.maxHealth = kind === 'soldier' ? 125 : 85; this.health = this.maxHealth;
      this.radius = kind === 'soldier' ? 12 : 11; this.speed = kind === 'soldier' ? 74 : 60;
      this.state = 'idle'; this.targetNode = -1; this.targetBuilding = -1; this.think = 0;
      this.fireCooldown = 0; this.facing = 0; this.carryType = null; this.carry = 0; this.maxCarry = 10;
      const a = Math.random() * Math.PI * 2, r = 35 + Math.random() * 70;
      this.offset = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    }
  }

  class Zombie {
    constructor(id, kind, x, y, difficulty, waveNumber) {
      const def = ENEMIES[kind];
      this.id = id; this.kind = kind; this.x = x; this.y = y; this.dead = false;
      this.radius = def.radius; this.maxHealth = def.health * difficulty.enemyHealth * enemyHealthScale(waveNumber);
      this.health = this.maxHealth; this.attackCooldown = 0; this.facing = 0; this.stagger = 0;
      this.howl = 2 + Math.random() * 7; this.bias = Math.random() * 1000; this.anim = Math.random() * 10;
      this.rage = 0; this.stuck = 0; this.lastX = x; this.lastY = y;
    }
  }

  class Projectile {
    constructor(id, x, y, vx, vy, damage, range, owner, color = '#ffe09a', radius = 2) {
      this.id = id; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.damage = damage;
      this.range = range; this.owner = owner; this.color = color; this.radius = radius; this.travelled = 0; this.dead = false;
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
      for (const b of this.buildings.values()) if (!b.dead && b.completed && (b.type === 'core' || b.type === 'warehouse')) { const d = (b.x - x) ** 2 + (b.y - y) ** 2; if (d < best) { best = d; result = b; } }
      return result;
    }
    has(type) { for (const b of this.buildings.values()) if (!b.dead && b.completed && b.type === type) return true; return false; }
    incomplete() { return [...this.buildings.values()].filter(b => !b.dead && !b.completed); }
    solidForFriendly(x, y) { const b = this.at(x, y); return b && b.completed && b.def.wall && !b.def.gate ? b : null; }
    movementCost(gx, gy) {
      const b = this.atCell(gx, gy); if (!b || b.dead) return 10; if (!b.completed) return 24; if (b.type === 'core') return 8;
      if (b.def.gate) return b.type === 'armoredGate' ? 72 : 48;
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
      this.audio.setVolume(this.settings.volume);
      this.rally = { x: WORLD_SIZE / 2 + 110, y: WORLD_SIZE / 2 }; this.rallyPlacement = false;
      this.selectedBuild = null; this.buildRotation = 0; this.wallStart = null; this.wallPreview = []; this.selectedBuilding = null;
      this.interactionText = ''; this.stats = createStats(); this.objectiveIndex = 0; this.objectiveProgress = 0;
      this.economyTimer = 0; this.metricsTimer = 0; this.uiTimer = 0; this.minimapTimer = 0; this.saveTimer = 0; this.flowTimer = 0;
      this.ui = {}; this.currentCategory = 'colony'; this.lastBuildTier = -1; this.lastBuildSelection = ''; this.buildCollapsed = false;
      this.compactMediaQuery = globalThis.matchMedia?.('(pointer: coarse), (max-width: 720px)') || null; this.compactViewport = null;
      this.activeOverlay = null; this.overlayFocusTargets = new Map(); this.gameplayFocusTarget = null; this.helpWasPaused = null;
      document.body.classList.toggle('high-contrast', this.settings.highContrast);
      this.cacheUI(); this.createResourceUI(); this.createCategoryUI(); this.bindEvents(); this.resize(); this.refreshContinue(); this.syncOverlayFocus();
      const params = new URLSearchParams(location.search);
      if (params.get('autostart') === '1') setTimeout(() => this.startNew(params.get('difficulty') || 'standard'), 50);
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
      const ids = ['hud','rightPanel','mainMenu','pauseMenu','helpModal','gameOver','continueButton','resources','buildCategories','buildList','leftPanel','cityTier','populationValue','powerValue','moraleValue','phaseLabel','waveNumber','waveTimer','threatFill','waveIntel','objectiveTitle','objectiveText','objectiveFill','objectiveCounter','interactionHint','weaponName','weaponAmmo','reloadBar','notifications','damageVignette','carryValue','selectionCard','selectionName','selectionDescription','selectionHealthFill','selectionStats','gameOverStats','recruitWorker','recruitSoldier','repairSelected','upgradeSelected','prioritySelected','researchButton','researchName','researchInsight','settingsToggle','soundToggle','soundStatus','touchControls','touchAction','touchFire','toggleBuild'];
      for (const id of ids) this.ui[id] = document.getElementById(id);
      this.ui.settingsModal = document.getElementById('settingsModal');
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
      addEventListener('resize', () => this.resize());
      this.compactMediaQuery?.addEventListener?.('change', () => this.resize());
      addEventListener('blur', () => this.releaseInputs());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.releaseInputs(); });
      addEventListener('keydown', event => {
        if (event.code === 'Escape') { event.preventDefault(); this.onEscape(); return; }
        if (event.code === 'Tab' && this.activeOverlay) { this.trapOverlayFocus(event); return; }
        if (this.state !== 'playing' || this.paused || this.gameOver || this.activeOverlay) return;
        if (event.target?.closest?.('#resources')) return;
        if (event.target?.closest?.('input, select, textarea, [contenteditable="true"]')) return;
        if (event.target?.closest?.('button, summary, a[href], [role="button"]') && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(event.code)) return;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code)) event.preventDefault();
        if (!event.repeat) this.input.pressed.add(event.code); this.input.keys.add(event.code);
      });
      addEventListener('keyup', event => this.input.keys.delete(event.code));
      this.canvas.addEventListener('mousemove', event => { this.input.mouseX = event.clientX; this.input.mouseY = event.clientY; this.updateMouseWorld(); });
      this.canvas.addEventListener('mousedown', event => {
        this.audio.unlock(); this.updateMouseWorld();
        if (this.state !== 'playing' || this.paused || this.gameOver) return;
        if (event.button === 0) {
          if (this.rallyPlacement) { this.rally = { x: this.input.mouseWorldX, y: this.input.mouseWorldY }; this.rallyPlacement = false; this.notify('Point de ralliement déplacé.', 'good'); this.audio.ui(); return; }
          if (this.selectedBuild) {
            const def = BUILDINGS[this.selectedBuild];
            if (this.isLineWall(def)) { this.wallStart = { x: grid(this.input.mouseWorldX), y: grid(this.input.mouseWorldY) }; this.wallPreview = [this.wallStart]; }
            else this.placeOne(this.selectedBuild, grid(this.input.mouseWorldX), grid(this.input.mouseWorldY), this.buildRotation);
            return;
          }
          this.input.mouseDown = true;
        } else if (event.button === 2) {
          event.preventDefault();
          if (this.selectedBuild || this.rallyPlacement) this.cancelPlacement();
          else this.selectBuilding(this.world.at(this.input.mouseWorldX, this.input.mouseWorldY));
        }
      });
      this.canvas.addEventListener('mouseup', event => {
        if (event.button !== 0) return; this.input.mouseDown = false;
        if (this.state === 'playing' && !this.paused && this.wallStart && this.selectedBuild) {
          this.updateWallPreview(); this.placeWallLine(this.selectedBuild, this.wallPreview); this.wallStart = null; this.wallPreview = [];
        }
      });
      this.canvas.addEventListener('mouseleave', () => { this.input.mouseDown = false; });
      this.canvas.addEventListener('contextmenu', event => event.preventDefault());
      this.canvas.addEventListener('wheel', event => { event.preventDefault(); this.camera.zoom = clamp(this.camera.zoom * (event.deltaY > 0 ? .9 : 1.1), .52, 1.65); }, { passive: false });
      this.canvas.style.touchAction='none';
      const touchPoint=event=>{this.input.mouseX=event.clientX;this.input.mouseY=event.clientY;this.updateMouseWorld();};
      this.canvas.addEventListener('pointerdown',event=>{
        if(!event.pointerType||event.pointerType==='mouse'||this.state!=='playing'||this.paused||this.gameOver)return;
        event.preventDefault();this.audio.unlock();this.canvasPointerId=event.pointerId;this.canvas.setPointerCapture?.(event.pointerId);touchPoint(event);
        if(this.rallyPlacement){this.rally={x:this.input.mouseWorldX,y:this.input.mouseWorldY};this.rallyPlacement=false;this.notify('Point de ralliement déplacé.','good');}
        else if(this.selectedBuild){if(this.isLineWall(BUILDINGS[this.selectedBuild])){this.wallStart={x:grid(this.input.mouseWorldX),y:grid(this.input.mouseWorldY)};this.updateWallPreview();}else this.placeOne(this.selectedBuild,grid(this.input.mouseWorldX),grid(this.input.mouseWorldY),this.buildRotation);}
        else this.selectBuilding(this.world.at(this.input.mouseWorldX,this.input.mouseWorldY));
      });
      this.canvas.addEventListener('pointermove',event=>{if(event.pointerId!==this.canvasPointerId)return;event.preventDefault();touchPoint(event);});
      this.canvas.addEventListener('pointerup',event=>{
        if(event.pointerId!==this.canvasPointerId)return;event.preventDefault();touchPoint(event);
        if(this.state==='playing'&&!this.paused&&this.wallStart&&this.selectedBuild)this.placeWallLine(this.selectedBuild,this.wallPreview);
        this.canvasPointerId=null;this.wallStart=null;this.wallPreview=[];
      });
      this.canvas.addEventListener('pointercancel',event=>{if(event.pointerId===this.canvasPointerId){this.canvasPointerId=null;this.wallStart=null;this.wallPreview=[];}});
      const touchMap = { up:'KeyW', left:'KeyA', right:'KeyD', down:'KeyS' };
      for (const button of document.querySelectorAll('#touchControls button[data-dir]')) {
        const code = touchMap[button.dataset.dir]; if (!code) continue;
        button.addEventListener('pointerdown', event => { event.preventDefault(); this.input.keys.add(code); button.setPointerCapture?.(event.pointerId); });
        const release = event => { event.preventDefault(); this.input.keys.delete(code); };
        button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('pointerleave', release);
      }
      if (this.ui.touchAction) {
        this.ui.touchAction.addEventListener('pointerdown', event => { event.preventDefault(); this.input.keys.add('KeyE'); this.ui.touchAction.setPointerCapture?.(event.pointerId); });
        const releaseAction = event => { event.preventDefault(); this.input.keys.delete('KeyE'); };
        this.ui.touchAction.addEventListener('pointerup', releaseAction); this.ui.touchAction.addEventListener('pointercancel', releaseAction); this.ui.touchAction.addEventListener('pointerleave', releaseAction);
      }
      if (this.ui.touchFire) {
        this.ui.touchFire.addEventListener('pointerdown', event => { event.preventDefault(); this.audio.unlock(); this.input.touchFire = true; this.input.mouseDown = true; this.ui.touchFire.setPointerCapture?.(event.pointerId); });
        this.ui.touchFire.addEventListener('pointerup', event => { event.preventDefault(); this.input.touchFire = false; this.input.mouseDown = false; });
        this.ui.touchFire.addEventListener('pointercancel', event => { event.preventDefault(); this.input.touchFire = false; this.input.mouseDown = false; });
      }

      const click = (id, fn) => { const button = document.getElementById(id); button.addEventListener('click', event => { if (!button.disabled && !button.closest('[inert]')) fn(event); }); };
      click('newGameButton', () => this.startNew(this.selectedDifficulty()));
      click('continueButton', () => this.load());
      click('howToButton', () => this.showHelp(true)); click('helpPauseButton', () => this.showHelp(true)); click('closeHelp', () => this.showHelp(false));
      click('pauseButton', () => this.togglePause()); click('resumeButton', () => this.togglePause(false)); click('saveButton', () => this.save(true));
      click('quitButton', () => this.returnToMenu()); click('restartButton', () => this.startNew(this.difficulty.id)); click('gameOverMenuButton', () => this.returnToMenu());
      click('toggleBuild', () => this.setBuildCollapsed(!this.buildCollapsed));
      click('closeSelection', () => this.selectBuilding(null)); click('repairSelected', () => this.repairSelected()); click('upgradeSelected', () => this.upgradeSelected()); click('demolishSelected', () => this.demolishSelected());
      click('recruitWorker', () => this.recruit('worker')); click('recruitSoldier', () => this.recruit('soldier')); click('setRally', () => { this.cancelPlacement(); this.rallyPlacement = true; this.notify('Cliquez au sol pour placer le ralliement.'); });
      click('repairAll', () => this.repairAll());
      if (this.ui.prioritySelected) click('prioritySelected', () => this.cyclePriority());
      if (this.ui.researchButton) click('researchButton', () => this.launchResearch());
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
      this.input.keys.clear(); this.input.pressed.clear(); this.input.mouseDown = false; this.input.touchFire = false;
      this.canvasPointerId=null;
      this.wallStart = null; this.wallPreview = [];
    }

    overlayFocusable(overlay) {
      const candidates = [...overlay.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
        .filter(node => !node.disabled && node.getAttribute('tabindex') !== '-1' && !node.closest('[inert], .hidden') && node.getClientRects().length > 0);
      // A radio group is one Tab stop; arrow keys keep their native selection behavior.
      return candidates.filter(node => {
        if (node.type !== 'radio' || !node.name) return true;
        const group = candidates.filter(candidate => candidate.type === 'radio' && candidate.name === node.name);
        return node === (group.find(candidate => candidate.checked) || group[0]);
      });
    }

    syncOverlayFocus() {
      const overlays = [this.ui.settingsModal, this.ui.helpModal, this.ui.gameOver, this.ui.pauseMenu, this.ui.mainMenu].filter(Boolean);
      const next = overlays.find(node => !node.classList.contains('hidden')) || null;
      const previous = this.activeOverlay, focused = document.activeElement;
      if (previous && previous.contains(focused)) this.overlayFocusTargets.set(previous, focused);
      if (!previous && next) this.gameplayFocusTarget = focused;
      this.ui.hud.inert = Boolean(next);
      for (const overlay of overlays) overlay.inert = overlay !== next;
      this.activeOverlay = next;
      if (next === previous) return;
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

    startNew(id = 'standard') {
      this.audio.unlock(); this.difficulty = DIFFICULTIES[id] || DIFFICULTIES.standard; this.random = new Random(Date.now()); this.nextId = 1;
      this.world = new WorldMap(this.random.int(1000, 9999999)); this.flow = new FlowField(); this.units = []; this.zombies = []; this.projectiles = []; this.particles = []; this.corpses = []; this.floaters = []; this.buckets.clear();
      this.resources = makeBag({ wood: 180, scrap: 120, stone: 70, food: 130, fuel: 45, ammo: 180, medicine: 12 });
      if (id === 'story') add(this.resources, { wood: 50, scrap: 35, food: 50, ammo: 50 });
      this.player = this.makePlayer(); const center = WORLD_TILES / 2; const core = new Building(this.nextId++, 'core', center - 2, center - 2, 0, 1); core.health = core.maxHealth; this.world.add(core);
      this.player.x = core.x + 135; this.player.y = core.y + 20;
      for (let i = 0; i < 3; i++) this.units.push(new Unit(this.nextId++, 'worker', core.x + this.random.range(-50, 50), core.y + this.random.range(-50, 50)));
      this.wave = 1; this.phase = 'calm'; this.phaseTime = 82 * this.difficulty.calmTime; this.spawnQueue = []; this.pendingSpawns = normalizeSpawnCounts(); this.spawnTimer = 0; this.fronts = []; this.wavePlan = null;
      this.elapsed = 0; this.dayClock = .24; this.weather = 0; this.weatherTarget = 0; this.morale = 100; this.damageFlash = 0; this.stats = createStats();
      this.research = normalizeResearch(); this.activeCrisis = null; this.depositedResources = 0;
      this.objectiveIndex = 0; this.objectiveProgress = 0; this.rally = { x: core.x + 120, y: core.y }; this.gameOver = false; this.paused = false;
      this.cancelPlacement(); this.selectBuilding(null); this.refreshMetrics(true); this.flow.rebuild(this.world, core); this.camera.x = this.player.x; this.camera.y = this.player.y; this.camera.zoom = 1;
      this.state = 'playing'; this.helpWasPaused = null; this.ui.mainMenu.classList.add('hidden'); this.ui.pauseMenu.classList.add('hidden'); this.ui.helpModal.classList.add('hidden'); this.ui.gameOver.classList.add('hidden'); this.ui.hud.classList.remove('hidden'); this.syncOverlayFocus();
      this.notify(`Protocole lancé — difficulté ${this.difficulty.label}.`, 'good'); this.notify('Récoltez puis rapportez les matériaux au centre.'); this.refreshBuildMenu(true); this.updateUI(); this.save(false);
    }

    serialize() {
      return {
        version: SAVE_VERSION, timestamp: Date.now(), difficulty: this.difficulty.id, worldSeed: this.world.seed,
        resources: this.resources, player: { x: this.player.x, y: this.player.y, health: this.player.health, weapon: this.player.weapon, magazine: this.player.magazine, carry: this.player.carry,
          dead: this.player.dead, downTimer: this.player.downTimer, stamina: this.player.stamina, invulnerable: this.player.invulnerable,
          reload: this.player.reload, reloadTotal: this.player.reloadTotal, shootCooldown: this.player.shootCooldown, meleeCooldown: this.player.meleeCooldown },
        buildings: [...this.world.buildings.values()].map(b => ({ id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation,progress:b.progress,health:b.health,corpseLoad:b.corpseLoad,priority:b.priority,gateMode:b.gateMode })),
        units: this.units.filter(u => !u.dead).map(u => ({ id:u.id,kind:u.kind,x:u.x,y:u.y,health:u.health,carry:u.carry,carryType:u.carryType,state:u.state,targetNode:u.targetNode,targetBuilding:u.targetBuilding })),
        zombies: this.zombies.filter(z => !z.dead).map(z => ({ id:z.id,kind:z.kind,x:z.x,y:z.y,health:z.health,attackCooldown:z.attackCooldown })),
        nodes: this.world.nodes.map(n => [n.id, n.amount]), wave:this.wave, phase:this.phase, phaseTime:this.phaseTime, spawnQueue:this.spawnQueue, pendingSpawns:this.pendingSpawns, fronts:this.fronts, wavePlan:this.wavePlan, spawnTimer:this.spawnTimer,
        elapsed:this.elapsed, dayClock:this.dayClock, weather:this.weather, morale:this.morale, rally:this.rally, stats:this.stats, objectiveIndex:this.objectiveIndex, objectiveProgress:this.objectiveProgress, nextId:this.nextId,
        randomState:this.random.state, research:this.research, activeCrisis:this.activeCrisis, depositedResources:this.depositedResources
      };
    }

    save(manual = false) {
      if (this.state !== 'playing' || this.gameOver) return false;
      try {
        const payload = JSON.stringify(this.serialize()); globalThis.DeadwallSave.parse(payload);
        let previous = null;
        try { const raw=localStorage.getItem(SAVE_KEY); if(raw){globalThis.DeadwallSave.parse(raw);previous=raw;} } catch {}
        // Never replace a valid backup with corrupt bytes, and never discard it on a failed primary write.
        localStorage.setItem(SAVE_KEY, payload);
        if(previous)try{localStorage.setItem(SAVE_BACKUP_KEY,previous);}catch{}
        this.lastSaveStatus={ok:true,time:Date.now(),message:'Sauvegarde locale à jour.'};
        this.refreshContinue(); if (manual) this.notify('Partie sauvegardée.', 'good'); return true;
      } catch (error) {
        this.lastSaveStatus={ok:false,time:Date.now(),message:'Stockage indisponible. Exportez une copie depuis les paramètres.'};
        console.error(error); if(manual)this.notify(this.lastSaveStatus.message,'danger'); return false;
      }
    }

    restoreSave(input) {
      const data=globalThis.DeadwallSave.validate(input), difficulty=DIFFICULTIES[data.difficulty], nextWorld=new WorldMap(data.worldSeed), nextFlow=new FlowField();
      const amounts=new Map(data.nodes);for(const node of nextWorld.nodes)if(amounts.has(node.id)){node.amount=amounts.get(node.id);node.depleted=node.amount<=.01;}
      for(const raw of data.buildings){const b=new Building(raw.id,raw.type,raw.gx,raw.gy,raw.rotation,raw.progress);Object.assign(b,{health:raw.health,corpseLoad:raw.corpseLoad,priority:raw.priority,gateMode:raw.gateMode});nextWorld.add(b);}
      const nextCore=[...nextWorld.buildings.values()].find(b=>b.type==='core');if(!nextCore)throw new Error('Centre absent');
      const nextUnits=data.units.map(raw=>{const unit=new Unit(raw.id,raw.kind,raw.x,raw.y);Object.assign(unit,raw);if(unit.state==='gather'){const node=nextWorld.nodes.find(item=>item.id===unit.targetNode);if(!node||node.depleted||(unit.carry>0&&unit.carryType!==node.type)){unit.state=unit.carry>0?'return':'idle';unit.targetNode=-1;}else unit.think=.3;}return unit;});
      const nextZombies=data.zombies.map(raw=>{const zombie=new Zombie(raw.id,raw.kind,raw.x,raw.y,difficulty,data.wave);zombie.health=Math.min(zombie.maxHealth,raw.health);zombie.attackCooldown=raw.attackCooldown;return zombie;});
      const nextPlayer={...this.makePlayer(data.nextId),...data.player};nextFlow.rebuild(nextWorld,nextCore);
      const pending=C.normalizeSpawnCounts?C.normalizeSpawnCounts(data.pendingSpawns,data.spawnQueue):null;
      const rebuiltPlan=data.wavePlan||wavePlan(data.wave,difficulty,0);
      // Commit only after the complete candidate world, entities and navigation have been constructed.
      Object.assign(this,{difficulty,nextId:data.nextId+1,random:new Random(data.randomState),world:nextWorld,flow:nextFlow,resources:data.resources,player:nextPlayer,units:nextUnits,zombies:nextZombies,projectiles:[],particles:[],corpses:[],floaters:[],wave:data.wave,phase:data.phase,phaseTime:data.phaseTime,spawnQueue:pending?[]:data.spawnQueue,pendingSpawns:pending||{},fronts:data.fronts,wavePlan:rebuiltPlan,spawnTimer:data.spawnTimer,elapsed:data.elapsed,dayClock:data.dayClock,weather:data.weather,weatherTarget:data.weather,morale:data.morale,rally:data.rally,stats:data.stats,objectiveIndex:data.objectiveIndex,objectiveProgress:data.objectiveProgress,research:data.research,activeCrisis:data.activeCrisis,depositedResources:data.depositedResources,gameOver:false,paused:false,saveTimer:0,helpWasPaused:null});
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
      this.state = 'menu'; this.paused = false; this.helpWasPaused = null; this.ui.hud.classList.add('hidden'); this.ui.pauseMenu.classList.add('hidden'); this.ui.helpModal.classList.add('hidden'); this.ui.gameOver.classList.add('hidden'); this.ui.mainMenu.classList.remove('hidden');
      document.body.dataset.phase = 'menu'; this.ui.hud.dataset.phase = 'menu'; document.body.classList.remove('morale-critical','power-critical','player-critical','crisis-active','carry-full','is-reloading');
      this.refreshContinue(); this.syncOverlayFocus();
    }

    refreshContinue() { try{this.ui.continueButton.disabled = !(localStorage.getItem(SAVE_KEY) || LEGACY_SAVE_KEYS.some(key => localStorage.getItem(key)) || localStorage.getItem(SAVE_BACKUP_KEY));}catch{this.ui.continueButton.disabled=true;} }
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
    selectBuilding(building) { if (this.selectedBuilding) this.selectedBuilding.selected = false; this.selectedBuilding = building && !building.dead ? building : null; if (this.selectedBuilding) this.selectedBuilding.selected = true; }

    placeOne(type, gx, gy, rotation = 0) {
      const def = BUILDINGS[type], check = this.world.placement(def, gx, gy, rotation);
      if (!check.valid) { this.notify(check.reason, 'danger'); return false; }
      if (!canAfford(this.resources, def.cost)) { this.notify('Ressources insuffisantes.', 'danger'); return false; }
      if (def.unlockTier > this.tier.id || (def.requires && !this.world.has(def.requires))) { this.notify('Technologie non disponible.', 'danger'); return false; }
      spend(this.resources, def.cost); const b = new Building(this.nextId++, type, gx, gy, rotation, 0); this.world.add(b); this.stats.buildingsPlaced++; this.audio.build(); this.floaters.push({ x:b.x,y:b.y-20,text:'CHANTIER',color:'#d2a84a',life:1,maxLife:1 }); this.refreshMetrics(true); return true;
    }

    placeWallLine(type, cells) {
      const candidate = BUILDINGS[type];
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

    repairSelected() {
      const b = this.selectedBuilding; if (!b || b.dead || !b.completed || b.health >= b.maxHealth) return;
      const ratio = 1 - b.health / b.maxHealth, cost = { scrap: Math.ceil(ratio * b.maxHealth / 45), wood: b.type === 'woodWall' ? Math.ceil(ratio * 12) : 0, stone: b.type === 'concreteWall' ? Math.ceil(ratio * 16) : 0 };
      if (!spend(this.resources, cost)) { this.notify('Matériaux de réparation insuffisants.', 'danger'); return; }
      b.health = b.maxHealth; b.underAttack = 0; this.audio.build(); this.notify(`${b.def.name} réparé.`, 'good');
    }

    upgradeSelected() {
      const b = this.selectedBuilding; if (!b || b.dead || !b.completed || !b.def.upgradeTo) return; const next = BUILDINGS[b.def.upgradeTo];
      if (next.unlockTier > this.tier.id) { this.notify(`Nécessite le palier ${CITY_TIERS[next.unlockTier].name}.`, 'danger'); return; }
      const cost = scaledCost(next.cost, .72); if (!spend(this.resources, cost)) { this.notify('Ressources insuffisantes pour l’amélioration.', 'danger'); return; }
      const oldCells = this.world.cells(b), ratio = b.health / b.maxHealth; b.type = next.id; b.health = Math.max(1, next.health * ratio); this.world.rewrite(b, oldCells); this.audio.build(); this.notify(`${next.name} opérationnel.`, 'good'); this.refreshMetrics(true);
    }

    demolishSelected() {
      const b = this.selectedBuilding; if (!b || b.type === 'core') return; add(this.resources, scaledCost(b.def.cost, .4), this.storage); this.world.remove(b); b.dead = true; this.selectBuilding(null); this.notify('Structure démontée : 40 % des matériaux récupérés.'); this.refreshMetrics(true);
    }

    repairAll() {
      const defenses = [...this.world.buildings.values()].filter(b => b.completed && b.def.defense && b.health < b.maxHealth);
      const missing = defenses.reduce((sum,b) => sum + b.maxHealth - b.health, 0), cost = { scrap: Math.ceil(missing / 85), wood: Math.ceil(missing / 180), stone: Math.ceil(missing / 220) };
      if (!defenses.length) { this.notify('Les défenses sont déjà intactes.'); return; }
      if (!spend(this.resources, cost)) { this.notify(`Réparation : ${resourceText(cost)} requis.`, 'danger'); return; }
      for (const b of defenses) b.health = b.maxHealth; this.audio.build(); this.notify(`${defenses.length} défenses remises en état.`, 'good');
    }

    canRecruit(kind) {
      if (this.population >= this.housing) return false;
      if (kind === 'worker') return canAfford(this.resources, { food:25 });
      return this.world.has('barracks') && canAfford(this.resources, { food:15, ammo:20, scrap:10 });
    }
    recruit(kind) {
      if (!this.canRecruit(kind)) { this.notify(kind === 'soldier' && !this.world.has('barracks') ? 'Construisez une caserne.' : 'Logements ou ressources insuffisants.', 'danger'); return; }
      spend(this.resources, kind === 'worker' ? { food:25 } : { food:15, ammo:20, scrap:10 }); const core = this.core(); const unit = new Unit(this.nextId++, kind, core.x + this.random.range(-35,35), core.y + this.random.range(-35,35)); this.units.push(unit); this.refreshMetrics(true); this.notify(kind === 'worker' ? 'Nouvel ouvrier affecté.' : 'Fusilier prêt au combat.', 'good');
    }

    core() { for (const b of this.world.buildings.values()) if (b.type === 'core' && !b.dead) return b; return null; }

    refreshBuildMenu(force = false) {
      if (!force && this.lastBuildTier === this.tier.id && this.lastBuildSelection === this.selectedBuild) return;
      this.lastBuildTier = this.tier.id; this.lastBuildSelection = this.selectedBuild; this.ui.buildList.replaceChildren();
      for (const def of buildingList(this.currentCategory)) {
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
      this.elapsed += dt; this.stats.playSeconds += dt; this.dayClock = (this.dayClock + dt / 260) % 1;
      this.updateCrisis(dt);
      this.weather = lerp(this.weather, this.weatherTarget, clamp(dt * .04, 0, 1)); this.damageFlash = Math.max(0, this.damageFlash - dt * 2.8); this.camera.shake = Math.max(0, this.camera.shake - dt * 22);
      if (Math.floor(this.elapsed) > 0 && Math.floor(this.elapsed) % 95 === 0 && Math.floor(this.elapsed - dt) % 95 !== 0) this.weatherTarget = this.random.chance(.42) ? this.random.range(.35, 1) : 0;
      this.handlePressed(); this.updateMouseWorld(); this.updateDirector(dt);
      if (this.world.flowDirty) { this.flowTimer -= dt; if (this.flowTimer <= 0) { const core = this.core(); if (core) this.flow.rebuild(this.world, core); this.flowTimer = .22; } }
      this.rebuildBuckets(); this.updatePlayer(dt); this.updateBuildings(dt); this.updateUnits(dt); this.updateZombies(dt); this.rebuildBuckets(); this.updateProjectiles(dt); this.updateEffects(dt);
      this.economyTimer += dt; if (this.economyTimer >= .25) { this.economyTick(this.economyTimer); this.economyTimer = 0; }
      this.metricsTimer -= dt; if (this.metricsTimer <= 0) { this.refreshMetrics(); this.updateObjective(); this.metricsTimer = .45; }
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
      if (this.input.pressed.has('KeyR')) { if (this.selectedBuild && !this.isLineWall(BUILDINGS[this.selectedBuild])) this.buildRotation = (this.buildRotation + 1) % 4; else this.startReload(); }
      if (this.input.pressed.has('Space')) this.melee();
      if (this.input.pressed.has('KeyB')) this.setBuildCollapsed(!this.buildCollapsed);
    }

    switchWeapon(id) {
      if (WEAPONS[id].tier > this.tier.id) { this.notify(`Arme disponible au palier ${CITY_TIERS[WEAPONS[id].tier].name}.`, 'danger'); return; }
      if (this.player.reload > 0) return; this.player.weapon = id; this.audio.ui();
    }

    startReload() {
      const p = this.player, w = WEAPONS[p.weapon]; if (p.dead || p.reload > 0 || p.magazine[p.weapon] >= w.magazine || this.resources.ammo < w.ammoPerReload) return;
      p.reload = w.reload; p.reloadTotal = w.reload;
    }

    finishReload() {
      const p = this.player, w = WEAPONS[p.weapon], missing = w.magazine - p.magazine[p.weapon], possible = Math.min(missing, Math.floor(this.resources.ammo / w.ammoPerReload));
      if (possible > 0) { this.resources.ammo -= possible * w.ammoPerReload; p.magazine[p.weapon] += possible; }
    }

    updatePlayer(dt) {
      const p = this.player; p.shootCooldown = Math.max(0, p.shootCooldown - dt); p.meleeCooldown = Math.max(0, p.meleeCooldown - dt); p.invulnerable = Math.max(0, p.invulnerable - dt);
      if (p.dead) {
        p.downTimer -= dt; this.interactionText = `Réanimation dans ${Math.ceil(Math.max(0,p.downTimer))} s`;
        if (p.downTimer <= 0) { const core = this.core(); if (core) { p.dead = false; p.health = p.maxHealth; p.x = core.x + 80; p.y = core.y; p.invulnerable = 3; for (const key of RESOURCE_KEYS) p.carry[key] *= .5; this.notify('Vous êtes de nouveau opérationnel.', 'good'); } }
        return;
      }
      if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { p.reload = 0; this.finishReload(); } }
      const up = this.input.keys.has('KeyW') || this.input.keys.has('KeyZ') || this.input.keys.has('ArrowUp');
      const down = this.input.keys.has('KeyS') || this.input.keys.has('ArrowDown'); const left = this.input.keys.has('KeyA') || this.input.keys.has('KeyQ') || this.input.keys.has('ArrowLeft'); const right = this.input.keys.has('KeyD') || this.input.keys.has('ArrowRight');
      let dx = (right ? 1 : 0) - (left ? 1 : 0), dy = (down ? 1 : 0) - (up ? 1 : 0), len = Math.hypot(dx, dy); if (len) { dx /= len; dy /= len; }
      const sprint = this.input.keys.has('ShiftLeft') && p.stamina > 2 && len > 0; const speed = sprint ? 205 : 136;
      if (sprint) p.stamina = Math.max(0, p.stamina - dt * 25); else p.stamina = Math.min(p.maxStamina, p.stamina + dt * 17);
      p.vx = dx * speed; p.vy = dy * speed; this.moveFriendly(p, p.vx * dt, p.vy * dt);
      if(this.input.touchFire){const target=this.nearestZombie(p.x,p.y,720);if(target)p.facing=Math.atan2(target.y-p.y,target.x-p.x);}else p.facing = Math.atan2(this.input.mouseWorldY - p.y, this.input.mouseWorldX - p.x);
      if (this.input.mouseDown && !this.selectedBuild && !this.rallyPlacement) this.shootPlayer();
      this.updateInteraction(dt);
    }

    friendlyPositionClear(entity, x, y) {
      const r = entity.radius * .78;
      return !this.world.solidForFriendly(x-r,y) && !this.world.solidForFriendly(x+r,y) && !this.world.solidForFriendly(x,y-r) && !this.world.solidForFriendly(x,y+r);
    }

    moveFriendly(entity, dx, dy) {
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
        const cells = direct ? [] : findFriendlyPath({ x: grid(unit.x), y: grid(unit.y) }, { x: goalX, y: goalY }, (x, y) => Boolean(this.world.solidForFriendly(world(x), world(y))));
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
      const p = this.player, carried = bagTotal(p.carry), storage = this.world.nearestStorage(p.x,p.y);
      let incomplete = null, incompleteD = 78 * 78; for (const b of this.world.buildings.values()) if (!b.dead && !b.completed) { const d = (b.x-p.x)**2+(b.y-p.y)**2; if (d < incompleteD) { incompleteD=d; incomplete=b; } }
      const node = this.world.nearestNode(p.x,p.y,62); let action = null;
      if (storage && carried > .01 && dist(storage,p) < 100) { this.interactionText = `Déposer ${Math.floor(carried)} unités`; action = 'deposit'; }
      else if (incomplete) { this.interactionText = `Construire ${incomplete.def.name} — ${Math.floor(incomplete.progress*100)} %`; action = 'build'; }
      else if (node && bagTotal(p.carry) < p.carryCapacity) { this.interactionText = `Récolter ${RESOURCE_META[node.type].label.toLowerCase()}`; action = 'harvest'; }
      else this.interactionText = '';
      if (!action || !this.input.keys.has('KeyE')) return;
      if (action === 'deposit') {
        let deposited=0;for (const key of RESOURCE_KEYS) { const room = Math.max(0, this.storage - this.resources[key]), moved = Math.min(room, p.carry[key]); this.resources[key] += moved; p.carry[key] -= moved; deposited+=moved; }this.depositedResources+=deposited;
      } else if (action === 'build') {
        if (incomplete.work(dt * 3.7)) this.completeBuilding(incomplete);
        if (this.random.chance(dt * 8)) this.particles.push(new Particle(incomplete.x+this.random.range(-20,20),incomplete.y+this.random.range(-15,15),this.random.range(-8,8),-18,.6,3,'#c9a05a','spark'));
      } else {
        const room = p.carryCapacity - bagTotal(p.carry), amount = node.harvest(Math.min(room, dt * 10 * this.difficulty.resourceYield)); p.carry[node.type] += amount; this.stats.gathered += amount;
        if (this.objectiveIndex === 0) this.objectiveProgress += amount;
        if (this.random.chance(dt * 8)) this.particles.push(new Particle(node.x+this.random.range(-8,8),node.y+this.random.range(-8,8),this.random.range(-10,10),this.random.range(-20,-5),.5,3,RESOURCE_META[node.type].color,'debris'));
      }
    }

    shootPlayer() {
      const p = this.player, w = WEAPONS[p.weapon]; if (p.dead || p.reload > 0 || p.shootCooldown > 0) return;
      if (p.magazine[p.weapon] <= 0) { this.startReload(); return; }
      p.magazine[p.weapon]--; p.shootCooldown = 1 / w.fireRate; this.stats.shots++; this.audio.shot(p.weapon); this.camera.shake = Math.max(this.camera.shake, p.weapon === 'shotgun' ? 8 : p.weapon === 'rifle' ? 3 : 4);
      for (let i = 0; i < w.pellets; i++) {
        const angle = p.facing + this.random.range(-w.spread, w.spread), speed = 970;
        this.projectiles.push(new Projectile(this.nextId++, p.x + Math.cos(angle)*22, p.y + Math.sin(angle)*22, Math.cos(angle)*speed, Math.sin(angle)*speed, w.damage, w.range, 'player', '#ffe2a0', p.weapon === 'shotgun' ? 1.4 : 2));
      }
      for (let i=0;i<3;i++) this.particles.push(new Particle(p.x+Math.cos(p.facing)*25,p.y+Math.sin(p.facing)*25,Math.cos(p.facing)*this.random.range(50,110)+this.random.range(-20,20),Math.sin(p.facing)*this.random.range(50,110)+this.random.range(-20,20),.1,this.random.range(2,4),'#ffd070','muzzle'));
      if (p.magazine[p.weapon] <= 0) this.startReload();
    }

    melee() {
      const p = this.player; if (p.dead || p.meleeCooldown > 0) return; p.meleeCooldown = .65; let hit = false;
      for (const z of this.nearbyZombies(p.x,p.y,55)) { const a = Math.atan2(z.y-p.y,z.x-p.x), delta = Math.atan2(Math.sin(a-p.facing),Math.cos(a-p.facing)); if (Math.abs(delta)<1.15) { z.health -= 36; z.stagger=.35; z.x += Math.cos(a)*20; z.y += Math.sin(a)*20; hit=true; if(z.health<=0)this.killZombie(z,false); } }
      this.audio.tone(hit?90:160,.08,'square',.05,-40); this.camera.shake=Math.max(this.camera.shake,3);
    }

    damagePlayer(amount) {
      const p=this.player;if(p.dead||p.invulnerable>0)return;p.health-=amount;this.damageFlash=.32;this.camera.shake=Math.max(this.camera.shake,5);
      if(p.health<=0){p.health=0;p.dead=true;p.downTimer=8;this.input.mouseDown=false;this.notify('Commandant à terre — évacuation médicale en cours.','danger');}
    }

    updateBuildings(dt) {
      const workerCount = this.units.filter(u => !u.dead && u.kind === 'worker').length;
      for (const b of [...this.world.buildings.values()]) {
        if (b.dead) continue; b.fireCooldown=Math.max(0,b.fireCooldown-dt);b.flash=Math.max(0,b.flash-dt);b.underAttack=Math.max(0,b.underAttack-dt);b.corpseLoad=Math.max(0,b.corpseLoad-dt*(.012+workerCount*.0009));
        if(!b.completed){if(b.work(dt*.075))this.completeBuilding(b);continue;}
        if(b.def.range&&b.powered&&this.resources.ammo>=(b.def.ammoPerShot||1)&&b.fireCooldown<=0){const target=this.nearestZombie(b.x,b.y,b.def.range);if(target){b.turretAngle=Math.atan2(target.y-b.y,target.x-b.x);b.fireCooldown=1/b.def.fireRate;this.resources.ammo-=b.def.ammoPerShot||1;b.flash=.06;this.fireFriendly(b.x,b.y-3,b.turretAngle,b.def.damage*(this.hasResearch('ballistics')?1.12:1),b.def.range,b.type==='heavyTurret'?'#ffc56e':'#ffe4a1');}}
        if(b.type==='clinic'&&b.powered){for(const u of this.units)if(!u.dead&&distSq(u,b)<130*130)u.health=Math.min(u.maxHealth,u.health+dt*2.2);if(!this.player.dead&&distSq(this.player,b)<130*130)this.player.health=Math.min(this.player.maxHealth,this.player.health+dt*1.6);}
      }
    }

    completeBuilding(b) { b.progress=1;b.health=b.maxHealth;this.world.flowDirty=true;this.world.navigationVersion++;this.audio.build();this.notify(`${b.def.name} mis en service.`,'good');this.floaters.push({x:b.x,y:b.y-22,text:'OPÉRATIONNEL',color:'#8fb47e',life:1.2,maxLife:1.2});this.refreshMetrics(true); }

    fireFriendly(x,y,angle,damage,range,color) { const speed=900;this.projectiles.push(new Projectile(this.nextId++,x+Math.cos(angle)*18,y+Math.sin(angle)*18,Math.cos(angle)*speed,Math.sin(angle)*speed,damage,range,'friendly',color,2));this.audio.noise(.035,.025,1600); }

    updateUnits(dt) {
      const core=this.core();if(!core)return;
      this.navigationBudget=STRATEGY_RULES.pathQueriesPerUpdate;
      for(const u of this.units){if(u.dead)continue;u.fireCooldown=Math.max(0,u.fireCooldown-dt);u.think-=dt;
        const danger=this.nearestZombie(u.x,u.y,105);
        if(u.kind==='worker'){
          if(danger){u.state='flee';this.moveUnitToward(u,core,dt,u.speed*1.25);continue;}
          if(u.carry>0&&u.carryType&&(u.state!=='gather'||u.carry>=u.maxCarry-.01))u.state='return';
          if(u.think<=0&&u.state!=='return'){
            u.think=.7+this.random.range(0,.5);
            const currentNode=this.world.nodes.find(n=>n.id===u.targetNode),currentBuilding=this.world.buildings.get(u.targetBuilding);
            const continuing=(u.state==='gather'&&currentNode&&!currentNode.depleted&&this.resources[currentNode.type]<this.storage-.01)||(u.state==='build'&&currentBuilding&&!currentBuilding.completed&&!currentBuilding.dead);
            if(!continuing){
              if(u.carry>.01){u.state='return';}
              else{
                const jobs=this.world.incomplete().sort((a,b)=>(b.priority||2)-(a.priority||2)||distSq(u,a)-distSq(u,b));
                if(jobs.length){u.targetBuilding=jobs[0].id;u.state='build';}
                else{const node=this.workerResourceTarget(u);if(node){u.targetNode=node.id;u.state='gather';}else u.state='idle';}
              }
            }
          }
          if(u.state==='build'){const b=this.world.buildings.get(u.targetBuilding);if(!b||b.completed||b.dead){u.state='idle';u.think=0;}else if(dist(u,b)>62)this.moveUnitToward(u,b,dt);else if(b.work(dt*(this.hasResearch('logistics')?1.22:1.05)))this.completeBuilding(b);}
          else if(u.state==='gather'){const node=this.world.nodes.find(n=>n.id===u.targetNode);if(!node||node.depleted){u.state='idle';u.think=0;}else if(dist(u,node)>node.radius+12)this.moveUnitToward(u,node,dt);else{const room=Math.max(0,u.maxCarry-u.carry),amount=node.harvest(Math.min(room,dt*3.4*this.difficulty.resourceYield*(this.hasResearch('logistics')?1.18:1)));u.carry+=amount;u.carryType=node.type;if(u.carry>=u.maxCarry-.1||node.depleted)u.state='return';}}
          else if(u.state==='return'){const storage=this.world.nearestStorage(u.x,u.y)||core;if(dist(u,storage)>65)this.moveUnitToward(u,storage,dt);else{
            if(u.carryType){const room=Math.max(0,this.storage-(this.resources[u.carryType]||0)),moved=Math.min(room,u.carry);this.resources[u.carryType]+=moved;u.carry-=moved;this.depositedResources+=moved;}
            if(u.carry<.01){u.carry=0;u.carryType=null;u.state='idle';u.think=0;}
          }}
          else{const target={x:core.x+u.offset.x,y:core.y+u.offset.y};if(dist(u,target)>35)this.moveUnitToward(u,target,dt,u.speed*.6);}
        } else {
          const target=this.nearestZombie(u.x,u.y,345);if(target){const d=dist(u,target);u.facing=Math.atan2(target.y-u.y,target.x-u.x);if(d>285)this.moveUnitToward(u,target,dt,u.speed*.8);else if(u.fireCooldown<=0&&this.resources.ammo>=1){u.fireCooldown=.24;this.resources.ammo-=1;this.fireFriendly(u.x,u.y,u.facing,this.hasResearch('ballistics')?35:31,520,'#ffe0a0');}else if(d<28&&u.fireCooldown<=0){u.fireCooldown=.7;target.health-=18;if(target.health<=0)this.killZombie(target,false);}}
          else{const targetPoint={x:this.rally.x+u.offset.x*.35,y:this.rally.y+u.offset.y*.35};if(dist(u,targetPoint)>22)this.moveUnitToward(u,targetPoint,dt);}
        }
      }
      this.units=this.units.filter(u=>!u.dead);
    }

    workerResourceTarget(unit) {
      const types=['wood','scrap','stone','food','fuel'],preferred=types[unit.id%types.length];
      let nearest=null,best=Infinity;
      for(const node of this.world.nodes){
        if(node.depleted||this.resources[node.type]>=this.storage-.01)continue;
        const distance=distSq(unit,node);if(distance>1150*1150)continue;
        const score=distance*(node.type===preferred?.8:1)*(1+(this.resources[node.type]||0)/Math.max(1,this.storage));
        if(score<best){best=score;nearest=node;}
      }
      return nearest;
    }

    updateDirector(dt) {
      this.phaseTime-=dt;
      if(this.phase==='calm'&&this.phaseTime<=0){this.phase='warning';this.phaseTime=10+(this.hasResearch('recon')?5:0);this.prepareWave();this.triggerCrisis();this.notify(`Migration détectée — ${this.wavePlan.total} contacts estimés.`,'danger');this.audio.siren();}
      else if(this.phase==='warning'&&this.phaseTime<=0){this.phase='assault';this.phaseTime=0;this.startAssault();this.notify('ASSAUT : toutes les unités aux remparts !','danger');}
      else if(this.phase==='assault'){
        this.spawnTimer-=dt;while((this.spawnQueue.length||spawnCount(this.pendingSpawns))&&this.spawnTimer<=0&&this.zombies.length<PERFORMANCE_LIMITS.zombies){this.refillSpawnQueue();this.spawnZombie(this.spawnQueue.pop());this.spawnTimer+=this.wavePlan?.spawnInterval||.3;}
        if(!this.spawnQueue.length&&!spawnCount(this.pendingSpawns)&&!this.zombies.some(z=>!z.dead)){this.phase='aftermath';this.phaseTime=8;this.stats.wavesSurvived++;this.research.insight+=1+(this.wave%5===0?1:0);this.notify(`Vague ${this.wave} repoussée. Sécurisation du périmètre.`,'good');this.save(false);}
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
      const definition=this.crisisDefinition(),option=definition?.choices?.[choice];
      if(!option||this.activeCrisis.status!=='pending'||!canAfford(this.resources,option.cost))return false;
      if(option.effects.workers&&this.population+option.effects.workers>this.housing)return false;
      if(option.effects.wallRepair&&!this.world.buildings.has(this.activeCrisis.targetId))return false;
      return true;
    }
    resolveCrisis(choice,automatic=false){
      if(this.state!=='playing'||this.gameOver||(!automatic&&this.paused)||!this.canResolveCrisis(choice))return false;
      const crisis=this.activeCrisis,definition=this.crisisDefinition(),option=definition.choices[choice];
      if(!spend(this.resources,option.cost))return false;
      const effect=option.effects;
      if(effect.morale)this.morale=clamp(this.morale+effect.morale,0,100);
      if(effect.ammo)this.resources.ammo=clamp(this.resources.ammo+effect.ammo,0,this.storage);
      if(effect.workers){const core=this.core();for(let i=0;i<effect.workers;i++)this.units.push(new Unit(this.nextId++,'worker',core.x+70,core.y+this.random.range(-25,25)));}
      const wall=this.world.buildings.get(crisis.targetId);
      if(wall&&!wall.dead){if(effect.wallRepair)wall.health=Math.min(wall.maxHealth,wall.health+wall.maxHealth*effect.wallRepair);if(effect.wallDamage)wall.health=Math.max(1,wall.health-wall.maxHealth*effect.wallDamage);if(effect.corpseCleanup)wall.corpseLoad=Math.max(0,wall.corpseLoad-effect.corpseCleanup);}
      crisis.status='resolved';crisis.choice=choice;crisis.remaining=effect.duration||0;
      this.stats.crisesResolved=(this.stats.crisesResolved||0)+1;
      this.notify(`${definition.title} : ${option.label}${automatic?' (délai écoulé)':''}. ${option.description}`,choice==='A'?'good':'normal');
      if(!crisis.remaining)this.activeCrisis=null;
      this.refreshMetrics(true);this.updateCrisisUI();this.save(false);return true;
    }
    updateCrisis(dt){
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
      const front=this.random.pick(this.fronts.length?this.fronts:['north']),margin=18;let x,y;
      if(front==='north'){x=this.random.range(80,WORLD_SIZE-80);y=margin;}else if(front==='south'){x=this.random.range(80,WORLD_SIZE-80);y=WORLD_SIZE-margin;}else if(front==='east'){x=WORLD_SIZE-margin;y=this.random.range(80,WORLD_SIZE-80);}else{x=margin;y=this.random.range(80,WORLD_SIZE-80);}
      x+=this.random.range(-22,22);y+=this.random.range(-22,22);this.zombies.push(new Zombie(this.nextId++,kind,x,y,this.difficulty,this.wave));
    }

    get remainingAssault(){return this.spawnQueue.length+spawnCount(this.pendingSpawns)+this.zombies.filter(z=>!z.dead).length;}

    updateZombies(dt) {
      const core=this.core();if(!core)return;const night=1+(1-this.daylight())*.1;
      for(const z of this.zombies){if(z.dead)continue;const def=ENEMIES[z.kind];z.attackCooldown=Math.max(0,z.attackCooldown-dt);z.stagger=Math.max(0,z.stagger-dt);z.rage=Math.max(0,z.rage-dt);z.howl-=dt;
        if(z.kind==='howler'&&z.howl<=0){z.howl=9+this.random.range(-1,2);for(const other of this.nearbyZombies(z.x,z.y,190))other.rage=Math.max(other.rage,3);for(let i=0;i<10;i++){const a=this.random.range(0,Math.PI*2);this.particles.push(new Particle(z.x,z.y,Math.cos(a)*this.random.range(20,90),Math.sin(a)*this.random.range(20,90),.7,2,'#9d554d','dust'));}}
        const dir=this.flow.direction(z.x,z.y,z.bias,this.elapsed),speed=def.speed*night*(z.rage>0?1.18:1)*(z.stagger>0?.35:1)*(1-this.weather*.05),look=z.radius+13;
        let victim=null,best=34*34;if(!this.player.dead){const d=distSq(z,this.player);if(d<best&&this.hasLineOfSight(z,this.player)){best=d;victim=this.player;}}for(const u of this.units){if(u.dead)continue;const d=distSq(z,u);if(d<best&&this.hasLineOfSight(z,u)){best=d;victim=u;}}
        if(victim){if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;if(victim===this.player)this.damagePlayer(def.damage*this.difficulty.enemyDamage);else this.damageUnit(victim,def.damage*this.difficulty.enemyDamage);}continue;}
        const blocker=this.world.at(z.x+dir.x*look,z.y+dir.y*look);
        if(blocker&&!blocker.dead&&blocker.type!=='core'){
          if(blocker.type==='spikes'){z.health-=blocker.def.trapDamage*dt;this.damageBuilding(blocker,def.damage*dt*.13);if(z.health<=0){this.killZombie(z,false);continue;}}
          const ramp=blocker.def.wall&&blocker.corpseLoad>15+(z.id%18)&&(z.kind==='runner'||z.kind==='crawler');
          if(!ramp){if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;this.damageBuilding(blocker,def.damage*this.difficulty.enemyDamage);}continue;}
        }else if(blocker&&blocker.type==='core'){if(z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;this.damageBuilding(blocker,def.damage*this.difficulty.enemyDamage);}continue;}
        z.facing=Math.atan2(dir.y,dir.x);z.x=clamp(z.x+dir.x*speed*dt,3,WORLD_SIZE-3);z.y=clamp(z.y+dir.y*speed*dt,3,WORLD_SIZE-3);
        if(this.random.chance(dt*.45)){const nearby=this.nearbyZombies(z.x,z.y,22);for(const o of nearby){if(o===z)continue;const dx=z.x-o.x,dy=z.y-o.y,l=Math.hypot(dx,dy)||1;z.x+=dx/l*.15;z.y+=dy/l*.15;break;}}
        const moved=Math.hypot(z.x-z.lastX,z.y-z.lastY);if(moved<.2)z.stuck+=dt;else z.stuck=Math.max(0,z.stuck-dt);z.lastX=z.x;z.lastY=z.y;
        if(z.stuck>2.5){const near=this.world.at(z.x+dir.x*30,z.y+dir.y*30)||this.nearestBuilding(z.x,z.y,48);if(near&&z.attackCooldown<=0){z.attackCooldown=1/def.attackRate;this.damageBuilding(near,def.damage*this.difficulty.enemyDamage);}}
      }
      this.zombies=this.zombies.filter(z=>!z.dead);
    }

    nearestBuilding(x,y,range){let result=null,best=range*range;for(const b of this.world.buildings.values()){if(b.dead)continue;const d=(b.x-x)**2+(b.y-y)**2;if(d<best){best=d;result=b;}}return result;}
    hasLineOfSight(a,b){const steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/18);for(let i=1;i<steps;i++){const t=i/steps,hit=this.world.at(lerp(a.x,b.x,t),lerp(a.y,b.y,t));if(hit&&!hit.dead&&hit.completed&&hit.def.wall)return false;}return true;}
    damageUnit(unit,amount){unit.health-=amount;if(unit.health<=0){unit.dead=true;this.stats.unitsLost++;this.notify(`${unit.kind==='soldier'?'Un fusilier':'Un ouvrier'} a été perdu.`,'danger');for(let i=0;i<8;i++)this.particles.push(new Particle(unit.x,unit.y,this.random.range(-30,30),this.random.range(-35,15),.7,3,'#6f302e','blood'));}}
    damageBuilding(b,amount){if(b.dead)return;if(b.def.wall&&this.hasResearch('fortification'))amount*=.88;b.health-=amount;b.underAttack=.5;if(b.health<=0)this.destroyBuilding(b);}
    destroyBuilding(b){if(b.dead)return;b.dead=true;const def=b.def;this.world.remove(b);this.stats.buildingsLost++;this.camera.shake=Math.max(this.camera.shake,def.explosive?18:10);for(let i=0;i<(def.explosive?45:20);i++)this.particles.push(new Particle(b.x+this.random.range(-b.w*TILE/2,b.w*TILE/2),b.y+this.random.range(-b.h*TILE/2,b.h*TILE/2),this.random.range(-90,90),this.random.range(-100,60),this.random.range(.6,1.4),this.random.range(2,7),i%3?'#5c5a51':'#b87948',i%3?'debris':'spark'));
      if(def.explosive){for(const z of this.nearbyZombies(b.x,b.y,def.explosive)){z.health-=120*(1-dist(z,b)/def.explosive);if(z.health<=0)this.killZombie(z,false);}for(const other of [...this.world.buildings.values()])if(other!==b&&dist(other,b)<def.explosive)this.damageBuilding(other,45*(1-dist(other,b)/def.explosive));}
      if(b===this.selectedBuilding)this.selectBuilding(null);if(def.id==='core'){this.triggerGameOver();return;}this.notify(`${def.name} détruit — le secteur est ouvert !`,'danger');this.refreshMetrics(true);}

    triggerGameOver(){this.gameOver=true;this.releaseInputs();for(const key of [SAVE_KEY,SAVE_BACKUP_KEY,...LEGACY_SAVE_KEYS])try{localStorage.removeItem(key);}catch{}this.refreshContinue();this.ui.gameOverStats.textContent=`Vague ${this.wave} · ${formatNumber(this.stats.kills)} infectés éliminés · ${formatTime(this.stats.playSeconds)} de résistance · ${this.stats.buildingsPlaced} structures construites.`;this.ui.gameOver.classList.remove('hidden');this.syncOverlayFocus();}

    rebuildBuckets(){this.buckets.clear();for(const z of this.zombies){if(z.dead)continue;const bx=Math.floor(z.x/this.bucketSize),by=Math.floor(z.y/this.bucketSize),key=bx+by*1000;if(!this.buckets.has(key))this.buckets.set(key,[]);this.buckets.get(key).push(z);}}
    nearbyZombies(x,y,range){const out=[],minX=Math.floor((x-range)/this.bucketSize),maxX=Math.floor((x+range)/this.bucketSize),minY=Math.floor((y-range)/this.bucketSize),maxY=Math.floor((y+range)/this.bucketSize),r2=range*range;for(let by=minY;by<=maxY;by++)for(let bx=minX;bx<=maxX;bx++){const bucket=this.buckets.get(bx+by*1000);if(bucket)for(const z of bucket)if(!z.dead&&(z.x-x)**2+(z.y-y)**2<=r2)out.push(z);}return out;}
    nearestZombie(x,y,range){let result=null,best=range*range;for(const z of this.nearbyZombies(x,y,range)){const d=(z.x-x)**2+(z.y-y)**2;if(d<best){best=d;result=z;}}return result;}

    updateProjectiles(dt){for(const p of this.projectiles){if(p.dead)continue;const dx=p.vx*dt,dy=p.vy*dt;p.x+=dx;p.y+=dy;p.travelled+=Math.hypot(dx,dy);if(p.travelled>p.range||p.x<0||p.y<0||p.x>WORLD_SIZE||p.y>WORLD_SIZE){p.dead=true;continue;}const targets=this.nearbyZombies(p.x,p.y,18);for(const z of targets){if(z.dead)continue;const hit=distSq(p,z)<(z.radius+p.radius+3)**2;if(!hit)continue;let damage=p.damage,head=false;if(p.owner==='player'&&this.random.chance(this.player.weapon==='shotgun'?.065:.13)){damage*=1.75;head=true;this.stats.headshots++;}z.health-=damage;z.stagger=Math.max(z.stagger,.08);p.dead=true;this.audio.hit();for(let i=0;i<4;i++)this.particles.push(new Particle(z.x,z.y,this.random.range(-45,45),this.random.range(-45,45),.45,2.5,'#6d2928','blood'));if(head)this.floaters.push({x:z.x,y:z.y-16,text:'TÊTE',color:'#d9b56a',life:.75,maxLife:.75});if(z.health<=0)this.killZombie(z,head);break;}}
      this.projectiles=this.projectiles.filter(p=>!p.dead);}

    killZombie(z,headshot){if(z.dead)return;z.dead=true;this.stats.kills++;this.corpses.push({x:z.x,y:z.y,kind:z.kind,age:0,rotation:this.random.range(0,Math.PI*2),scale:this.random.range(.8,1.2)});if(this.corpses.length>PERFORMANCE_LIMITS.corpses)this.corpses.shift();const wall=this.nearestWall(z.x,z.y,52);if(wall)wall.corpseLoad+=this.hasResearch('sanitation')?.65:(z.kind==='armored'?2.2:1);const drop=this.random.next();if(drop<.06)this.resources.ammo=Math.min(this.storage,this.resources.ammo+1);else if(drop<.075)this.resources.medicine=Math.min(this.storage,this.resources.medicine+.5);if(z.kind==='armored')this.resources.scrap=Math.min(this.storage,this.resources.scrap+.7);if(z.kind==='howler')this.resources.medicine=Math.min(this.storage,this.resources.medicine+.35);if(headshot&&this.random.chance(.35))this.resources.ammo=Math.min(this.storage,this.resources.ammo+1);}
    nearestWall(x,y,range){let result=null,best=range*range;for(const b of this.world.buildings.values())if(!b.dead&&b.completed&&b.def.wall){const d=(b.x-x)**2+(b.y-y)**2;if(d<best){best=d;result=b;}}return result;}

    updateEffects(dt){for(const node of this.world.nodes)node.flash=Math.max(0,node.flash-dt);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy+=p.kind==='debris'||p.kind==='blood'?65*dt:-4*dt;p.rotation+=dt*4;}this.particles=this.particles.filter(p=>p.life>0);if(this.particles.length>PERFORMANCE_LIMITS.particles)this.particles.splice(0,this.particles.length-PERFORMANCE_LIMITS.particles);for(const c of this.corpses)c.age+=dt;this.corpses=this.corpses.filter(c=>c.age<100);for(const f of this.floaters){f.life-=dt;f.y-=dt*18;}this.floaters=this.floaters.filter(f=>f.life>0);}

    economyTick(dt){let foodUse=this.population*.0065*dt;this.resources.food=Math.max(0,this.resources.food-foodUse);if(this.resources.food<=.01)this.morale=Math.max(0,this.morale-dt*.7);else this.morale=Math.min(100,this.morale+dt*.08);
      for(const b of this.world.buildings.values())if(!b.dead&&b.completed&&b.type==='generator'&&this.resources.fuel>0)this.resources.fuel=Math.max(0,this.resources.fuel-dt*(this.hasResearch('grid')?.0135:.018));
      for(const b of this.world.buildings.values()){
        if(b.dead||!b.completed||!b.def.production)continue;
        const crisisFactor=b.def.powerUse&&this.activeCrisis?.id==='blackout'&&this.activeCrisis.status==='resolved'&&this.activeCrisis.choice==='B'?.5:1;
        const powerFactor=b.def.powerUse?(b.powered?1:b.powerShare*(this.hasResearch('grid')?.7:.35)):1;
        if(powerFactor<=.05)continue;
        const seconds=dt*powerFactor*crisisFactor,fraction=productionFraction(this.resources,b.def.production,b.def.consumes,this.storage,seconds);
        if(fraction<=0)continue;
        for(const [key,rate]of Object.entries(b.def.consumes||{}))this.resources[key]-=rate*seconds*fraction;
        for(const [key,rate]of Object.entries(b.def.production))this.resources[key]=Math.min(this.storage,this.resources[key]+rate*seconds*fraction);
      }
      if(this.morale<20)for(const u of this.units)u.speed=(u.kind==='soldier'?74:60)*.82;else for(const u of this.units)u.speed=u.kind==='soldier'?74:60;
      for(const key of RESOURCE_KEYS)this.resources[key]=clamp(this.resources[key],0,this.storage);
    }

    refreshMetrics(force=false){let score=0,housing=0,storage=0,powerGen=0,powerUse=0;for(const b of this.world.buildings.values()){if(b.dead||!b.completed)continue;score+=b.def.score||0;housing+=b.def.housing||0;storage+=b.def.storage||0;if(b.def.powerGen)powerGen+=b.type==='generator'&&this.resources.fuel<=0?0:b.def.powerGen;powerUse+=b.def.powerUse||0;}this.cityScore=score;const oldTier=this.tier;this.tier=cityTier(score);this.housing=Math.max(1,housing);this.population=1+this.units.filter(u=>!u.dead).length;this.storage=Math.max(100,storage);this.powerGenerated=powerGen;this.powerUsed=powerUse;this.powerRatio=powerUse>0?clamp(powerGen/powerUse,0,1):1;this.signature=score+this.population*2+powerUse*2+this.world.buildings.size*.35;
      this.allocatePower(powerGen);
      if(oldTier&&this.tier.id>oldTier.id){this.notify(`La colonie devient : ${this.tier.name}.`,'good');this.audio.siren();this.refreshBuildMenu(true);}else if(force)this.refreshBuildMenu(true);
    }

    updateObjective(){const obj=OBJECTIVES[this.objectiveIndex];if(!obj)return;if(obj.id==='gather')this.objectiveProgress=this.depositedResources;else if(obj.id==='house')this.objectiveProgress=[...this.world.buildings.values()].filter(b=>b.completed&&b.type==='house').length;else if(obj.id==='farm')this.objectiveProgress=[...this.world.buildings.values()].filter(b=>b.completed&&b.type==='farm').length;else if(obj.id==='walls')this.objectiveProgress=[...this.world.buildings.values()].filter(b=>b.completed&&b.def.wall).length;else if(obj.id==='power')this.objectiveProgress=this.resources.fuel>0?[...this.world.buildings.values()].filter(b=>b.completed&&b.type==='generator').length:0;else if(obj.id==='defense')this.objectiveProgress=[...this.world.buildings.values()].filter(b=>b.completed&&['watchtower','turret','heavyTurret'].includes(b.type)).length;else if(obj.id==='research')this.objectiveProgress=this.research.completed.length;else if(obj.id==='wave')this.objectiveProgress=this.stats.wavesSurvived;
      if(this.objectiveProgress>=obj.target){add(this.resources,obj.reward,this.storage);this.notify(`Objectif accompli : ${obj.title}.`,'good');this.objectiveIndex++;this.objectiveProgress=0;this.audio.build();}}

    hasResearch(id){return this.research.completed.includes(id);}
    currentResearch(){return RESEARCH.find(item=>!this.hasResearch(item.id)&&item.tier<=this.tier.id)||null;}
    launchResearch(){const item=this.currentResearch();if(!item){this.notify('Toutes les doctrines disponibles sont terminées.','good');return;}if(this.research.insight<item.insight){this.notify(`Insight insuffisant : ${item.insight} requis.`,'danger');return;}if(!spend(this.resources,item.cost)){this.notify(`Recherche : ${resourceText(item.cost)} requis.`,'danger');return;}this.research.insight-=item.insight;this.research.completed.push(item.id);this.notify(`${item.name} validée.`,'good');this.refreshMetrics(true);}
    cyclePriority(){const b=this.selectedBuilding;if(!b||b.dead)return;b.priority=b.priority>=3?1:b.priority+1;this.notify(`${b.def.name} : priorité ${['','basse','normale','haute'][b.priority]}.`,'good');this.updateSelectionUI();}
    allocatePower(available){const powered=[...this.world.buildings.values()].filter(b=>!b.dead&&b.completed&&b.def.powerUse).sort((a,b)=>powerPriority(a.def)-powerPriority(b.def)||(b.priority||2)-(a.priority||2));let remaining=available;for(const b of powered){const need=b.def.powerUse||0;if(remaining>=need){b.powered=true;b.powerShare=1;remaining-=need;}else{b.powered=false;b.powerShare=b.def.production?clamp(remaining/Math.max(1,need),0,1):0;if(b.powerShare>0)remaining=0;}}}
    loadSettings(){const reducedMotion=Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches),defaults={reducedMotion,highContrast:false,muted:false,volume:.7,quality:'auto'};try{const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');if(!raw||typeof raw!=='object')return defaults;return{reducedMotion:typeof raw.reducedMotion==='boolean'?raw.reducedMotion:reducedMotion,highContrast:raw.highContrast===true,muted:raw.muted===true,volume:typeof raw.volume==='number'&&Number.isFinite(raw.volume)?clamp(raw.volume,0,1):.7,quality:raw.quality==='low'?'low':'auto'}}catch{return defaults}}
    saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(this.settings));}catch{}}
    toggleAccessibility(){this.settings.highContrast=!this.settings.highContrast;document.body.classList.toggle('high-contrast',this.settings.highContrast);this.saveSettings();this.notify(this.settings.highContrast?'Contraste élevé activé.':'Contraste élevé désactivé.');}
    toggleSound(){this.settings.muted=!this.settings.muted;this.audio.setMuted(this.settings.muted);this.saveSettings();this.notify(this.settings.muted?'Son coupé.':'Son activé.');this.updateUI();}
    daylight(){const angle=this.dayClock*Math.PI*2;return clamp(.5+Math.sin(angle-Math.PI/2)*.62,.08,1);}

    updateUI(){
      this.updateCrisisUI();
      for(const key of RESOURCE_KEYS){
        this.resourceEls[key].textContent=formatNumber(this.resources[key]);
        const lowThreshold=key==='medicine'?4:(key==='fuel'?8:12);this.resourceItems[key]?.classList.toggle('is-low',this.resources[key]<lowThreshold);
      }
      document.body.dataset.phase=this.phase;this.ui.hud.dataset.phase=this.phase;
      document.body.classList.toggle('morale-critical',this.morale<35);
      document.body.classList.toggle('power-critical',this.powerUsed>0&&this.powerGenerated+.01<this.powerUsed);
      document.body.classList.toggle('player-critical',this.player.health<35);
      document.body.classList.toggle('crisis-active',Boolean(this.activeCrisis));
      document.body.classList.toggle('carry-full',bagTotal(this.player.carry)>=this.player.carryCapacity*.9);
      this.refreshBuildAffordability();this.ui.cityTier.textContent=this.tier.name;this.ui.populationValue.textContent=`${this.population}/${this.housing}`;this.ui.powerValue.textContent=`${Math.floor(this.powerGenerated)}/${Math.ceil(this.powerUsed)}`;this.ui.moraleValue.textContent=`${Math.floor(this.morale)}%`;this.ui.moraleValue.style.color=this.morale<35?'#d7867f':'';this.ui.waveNumber.textContent=this.wave;
      const labels={calm:'CALME RELATIF',warning:'MIGRATION DÉTECTÉE',assault:'ASSAUT EN COURS',aftermath:'SÉCURISATION'};this.ui.phaseLabel.textContent=labels[this.phase];this.ui.waveTimer.textContent=this.phase==='assault'?formatNumber(this.remainingAssault):formatTime(this.phaseTime);
      let threat=0;if(this.phase==='warning')threat=clamp(1-this.phaseTime/(this.hasResearch('recon')?15:10),0,1);else if(this.phase==='assault')threat=clamp(.4+this.remainingAssault/Math.max(1,this.wavePlan?.total||this.remainingAssault)*.6,0,1);else if(this.phase==='aftermath')threat=.15;this.ui.threatFill.style.width=`${Math.round(threat*100)}%`;
      if(this.phase==='warning')this.ui.waveIntel.textContent=`Approche par ${this.fronts.map(f=>({north:'le nord',south:'le sud',east:'l’est',west:'l’ouest'})[f]).join(' et ')}. Préparez les portes.`;else if(this.phase==='assault')this.ui.waveIntel.textContent=`${formatNumber(this.remainingAssault)} contacts actifs ou en approche. Les corps augmentent la pression contre les murs.`;else if(this.phase==='aftermath')this.ui.waveIntel.textContent='Nettoyage, réparations et récupération avant la prochaine migration.';else this.ui.waveIntel.textContent=this.crisisDefinition()?`${this.crisisDefinition().title} : ${this.crisisDefinition().text}`:`Signature de cité : ${Math.floor(this.signature)}. Plus la colonie grossit, plus les hordes sont attirées.`;
      const obj=OBJECTIVES[this.objectiveIndex];if(obj){this.ui.objectiveTitle.textContent=obj.title;this.ui.objectiveText.textContent=obj.text;this.ui.objectiveFill.style.width=`${Math.min(100,this.objectiveProgress/obj.target*100)}%`;this.ui.objectiveCounter.textContent=`${Math.floor(Math.min(obj.target,this.objectiveProgress))} / ${obj.target}`;}else{this.ui.objectiveTitle.textContent='Développer la citadelle';this.ui.objectiveText.textContent='La campagne d’introduction est terminée. Construisez librement et survivez sans limite.';this.ui.objectiveFill.style.width='100%';this.ui.objectiveCounter.textContent='MODE INFINI';}
      this.ui.interactionHint.classList.toggle('hidden',!this.interactionText);if(this.interactionText)this.ui.interactionHint.querySelector('span').textContent=this.interactionText;const w=WEAPONS[this.player.weapon];this.ui.weaponName.textContent=w.name;this.ui.weaponAmmo.textContent=`${this.player.magazine[this.player.weapon]} / ${Math.floor(this.resources.ammo)}`;this.ui.reloadBar.querySelector('span').style.width=this.player.reload>0?`${100-this.player.reload/Math.max(.01,this.player.reloadTotal)*100}%`:'0%';this.ui.carryValue.textContent=`${Math.floor(bagTotal(this.player.carry))}/${this.player.carryCapacity}`;this.ui.damageVignette.style.opacity=this.settings.reducedMotion?0:clamp((1-this.player.health/this.player.maxHealth)*.72+this.damageFlash,0,.8);document.body.classList.toggle('is-reloading',this.player.reload>0);
      const research=this.currentResearch(),lockedResearch=research?null:RESEARCH.find(item=>!this.hasResearch(item.id));if(this.ui.researchName)this.ui.researchName.textContent=research?research.name:lockedResearch?`Palier requis : ${CITY_TIERS[lockedResearch.tier].name}`:'Doctrines complètes';if(this.ui.researchInsight)this.ui.researchInsight.textContent=research?`${this.research.insight}/${research.insight} insight · ${resourceText(research.cost)}`:`${this.research.insight} insight · ${this.research.completed.length}/${RESEARCH.length} doctrines`;if(this.ui.researchButton){this.ui.researchButton.disabled=!research||this.research.insight<research.insight||!canAfford(this.resources,research.cost);this.ui.researchButton.title=research?`${research.description} — ${resourceText(research.cost)}`:lockedResearch?`${lockedResearch.name} nécessite le palier ${CITY_TIERS[lockedResearch.tier].name}.`:'Toutes les doctrines sont terminées.';}
      if(this.ui.soundStatus)this.ui.soundStatus.textContent=this.settings.muted?'coupé':'activé';if(this.ui.soundToggle)this.ui.soundToggle.setAttribute('aria-pressed',String(!this.settings.muted));if(this.ui.settingsToggle){this.ui.settingsToggle.setAttribute('aria-haspopup','dialog');this.ui.settingsToggle.setAttribute('aria-controls','settingsModal');}this.ui.recruitWorker.disabled=!this.canRecruit('worker');this.ui.recruitSoldier.disabled=!this.canRecruit('soldier');this.updateSelectionUI();}

    updateSelectionUI(){const b=this.selectedBuilding;if(!b||b.dead){this.ui.selectionCard.classList.add('hidden');return;}this.ui.selectionCard.classList.remove('hidden');this.ui.selectionCard.dataset.state=!b.completed?'construction':b.health/b.maxHealth<.35?'critical':b.def.powerUse&&!b.powered?'unpowered':'operational';this.ui.selectionCard.dataset.priority=String(b.priority||2);this.ui.selectionName.textContent=b.def.name;this.ui.selectionDescription.textContent=b.completed?b.def.description:`Chantier à ${Math.floor(b.progress*100)} %. Maintenez E à proximité ou assignez des ouvriers.`;this.ui.selectionHealthFill.style.width=`${b.health/b.maxHealth*100}%`;this.ui.selectionHealthFill.style.background=b.health/b.maxHealth<.35?'#b94d43':'#7da46e';this.ui.selectionStats.innerHTML=`<span>Intégrité <strong>${Math.ceil(b.health)} / ${b.maxHealth}</strong></span><span>Énergie <strong>${b.def.powerUse?(b.powered?'Oui':'Non'):'—'}</strong></span><span>Construction <strong>${Math.floor(b.progress*100)}%</strong></span><span>Pression corps <strong>${b.def.wall?Math.floor(b.corpseLoad):0}</strong></span>`;this.ui.repairSelected.disabled=b.health>=b.maxHealth||!b.completed;this.ui.upgradeSelected.disabled=!b.completed||!b.def.upgradeTo||BUILDINGS[b.def.upgradeTo].unlockTier>this.tier.id;if(this.ui.prioritySelected)this.ui.prioritySelected.textContent=`PRIORITÉ ${['','BASSE','NORMALE','HAUTE'][b.priority||2]}`;}

    render(){const ctx=this.ctx;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#171c18';ctx.fillRect(0,0,this.width,this.height);const shakeX=(this.camera.shake&&!this.settings.reducedMotion)?(Math.random()-.5)*this.camera.shake:0,shakeY=(this.camera.shake&&!this.settings.reducedMotion)?(Math.random()-.5)*this.camera.shake:0;ctx.save();ctx.translate(this.width/2+shakeX,this.height/2+shakeY);ctx.scale(this.camera.zoom,this.camera.zoom);ctx.translate(-this.camera.x,-this.camera.y);const view=this.viewBounds();this.crowdDetail=this.width>720&&this.camera.zoom>.72&&this.zombies.length<320;this.drawGround(ctx,view);for(const node of this.world.nodes)if(!node.depleted&&this.visible(node.x,node.y,node.radius+20,view))this.drawNode(ctx,node);for(const corpse of this.corpses)if(this.visible(corpse.x,corpse.y,25,view))this.drawCorpse(ctx,corpse);const buildings=[...this.world.buildings.values()].filter(b=>!b.dead&&this.visible(b.x,b.y,Math.max(b.w,b.h)*TILE+40,view)).sort((a,b)=>a.y-b.y);for(const b of buildings)this.drawBuilding(ctx,b);for(const p of this.particles)if(this.visible(p.x,p.y,20,view))this.drawParticle(ctx,p);for(const u of this.units)if(!u.dead&&this.visible(u.x,u.y,28,view))this.drawUnit(ctx,u);for(const z of this.zombies)if(!z.dead&&this.visible(z.x,z.y,28,view))this.drawZombie(ctx,z);for(const p of this.projectiles)if(!p.dead&&this.visible(p.x,p.y,20,view))this.drawProjectile(ctx,p);if(!this.player.dead)this.drawPlayer(ctx);for(const f of this.floaters)if(this.visible(f.x,f.y,80,view))this.drawFloater(ctx,f);this.drawRally(ctx);this.drawPlacement(ctx);ctx.restore();this.drawNight(ctx);this.drawRain(ctx);this.drawThreatArrows(ctx);this.drawCrosshair(ctx);}

    viewBounds(){const hw=this.width/this.camera.zoom/2+120,hh=this.height/this.camera.zoom/2+120;return{left:this.camera.x-hw,right:this.camera.x+hw,top:this.camera.y-hh,bottom:this.camera.y+hh};}
    visible(x,y,r,v){return x+r>=v.left&&x-r<=v.right&&y+r>=v.top&&y-r<=v.bottom;}

    drawGround(ctx,v){
      const tile=96,minX=Math.max(0,Math.floor(v.left/tile)),maxX=Math.min(Math.ceil(WORLD_SIZE/tile),Math.ceil(v.right/tile)),minY=Math.max(0,Math.floor(v.top/tile)),maxY=Math.min(Math.ceil(WORLD_SIZE/tile),Math.ceil(v.bottom/tile));
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const n=seededHash(x,y,this.world.seed),r=Math.floor(25+n*7),g=Math.floor(31+n*8),b=Math.floor(27+n*5);ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillRect(x*tile,y*tile,tile+1,tile+1);
        if(n>.74){ctx.fillStyle='rgba(150,135,95,.045)';ctx.beginPath();ctx.arc(x*tile+n*tile,y*tile+seededHash(y,x,3)*tile,6+n*8,0,Math.PI*2);ctx.fill();}
      }
      const c=WORLD_SIZE/2;
      this.art?.drawGround(ctx,v,WORLD_SIZE);
      ctx.fillStyle='#242a28';ctx.fillRect(0,c-66,WORLD_SIZE,132);ctx.fillRect(c-66,0,132,WORLD_SIZE);
      ctx.fillStyle='rgba(7,10,9,.28)';ctx.fillRect(0,c-70,WORLD_SIZE,4);ctx.fillRect(0,c+66,WORLD_SIZE,4);ctx.fillRect(c-70,0,4,WORLD_SIZE);ctx.fillRect(c+66,0,4,WORLD_SIZE);
      if(v.right>c-620&&v.left<c+620&&v.bottom>c-520&&v.top<c+520){
        const yard=ctx.createRadialGradient(c,c,70,c,c,560);yard.addColorStop(0,'rgba(55,62,58,.95)');yard.addColorStop(.52,'rgba(45,52,49,.72)');yard.addColorStop(.82,'rgba(38,44,41,.25)');yard.addColorStop(1,'rgba(35,41,38,0)');ctx.fillStyle=yard;ctx.fillRect(c-580,c-500,1160,1000);
        for(let i=0;i<18;i++){const a=seededHash(i,this.world.seed,71)*Math.PI*2,rad=90+seededHash(i,12,this.world.seed)*410,x=c+Math.cos(a)*rad,y=c+Math.sin(a)*rad*.72,w=34+seededHash(i,22,9)*82,h=15+seededHash(i,41,3)*34;ctx.save();ctx.translate(x,y);ctx.rotate((seededHash(i,7,13)-.5)*.55);ctx.fillStyle=`rgba(112,117,108,${.018+seededHash(i,44,2)*.035})`;ctx.fillRect(-w/2,-h/2,w,h);ctx.restore();}
        ctx.strokeStyle='rgba(216,190,112,.055)';ctx.lineWidth=2;for(const radius of [225,355,490]){ctx.beginPath();ctx.ellipse(c,c,radius,radius*.72,0,0,Math.PI*2);ctx.stroke();}
      }
      ctx.strokeStyle='rgba(208,196,142,.13)';ctx.lineWidth=3;ctx.setLineDash([38,32]);ctx.beginPath();ctx.moveTo(0,c);ctx.lineTo(WORLD_SIZE,c);ctx.moveTo(c,0);ctx.lineTo(c,WORLD_SIZE);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(220,225,215,.09)';ctx.lineWidth=5;ctx.strokeRect(3,3,WORLD_SIZE-6,WORLD_SIZE-6);
      if(this.selectedBuild||this.rallyPlacement){const minGX=Math.max(0,Math.floor(v.left/TILE)),maxGX=Math.min(WORLD_TILES,Math.ceil(v.right/TILE)),minGY=Math.max(0,Math.floor(v.top/TILE)),maxGY=Math.min(WORLD_TILES,Math.ceil(v.bottom/TILE));ctx.strokeStyle='rgba(210,220,210,.055)';ctx.lineWidth=1/this.camera.zoom;ctx.beginPath();for(let x=minGX;x<=maxGX;x++){ctx.moveTo(x*TILE,minGY*TILE);ctx.lineTo(x*TILE,maxGY*TILE);}for(let y=minGY;y<=maxGY;y++){ctx.moveTo(minGX*TILE,y*TILE);ctx.lineTo(maxGX*TILE,y*TILE);}ctx.stroke();}
    }



    drawNode(ctx,node){if(this.art?.drawNode(ctx,node))return;ctx.save();ctx.translate(node.x,node.y);ctx.scale(node.flash>0?1.08:1,node.flash>0?1.08:1);ctx.globalAlpha=clamp(node.amount/node.maxAmount,.35,1);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(5,8,node.radius*1.05,node.radius*.48,0,0,Math.PI*2);ctx.fill();if(node.type==='wood'){ctx.fillStyle='#4c3927';ctx.fillRect(-4,-3,8,node.radius+8);const colors=['#344631','#3d5036','#46593c'];for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ctx.fillStyle=colors[(i+node.variant)%3];ctx.beginPath();ctx.arc(Math.cos(a)*node.radius*.45,Math.sin(a)*node.radius*.28-node.radius*.52,node.radius*.52,0,Math.PI*2);ctx.fill();}}else if(node.type==='scrap'){const colors=['#626967','#77766c','#4f5859','#805f48'];for(let i=0;i<7;i++){ctx.save();ctx.rotate((i*1.7+node.variant)*.45);ctx.fillStyle=colors[(i+node.variant)%4];ctx.fillRect(-node.radius*.65+i*2,-8+(i%3)*5,node.radius*.8,7);ctx.restore();}ctx.strokeStyle='#383d3c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(5,1,node.radius*.38,0,Math.PI*2);ctx.stroke();}else if(node.type==='stone'){const colors=['#67665f','#7a786e','#565750'];for(let i=0;i<5;i++){const a=i/5*Math.PI*2,r=node.radius*(i? .45:.15);ctx.fillStyle=colors[(i+node.variant)%3];ctx.beginPath();ctx.moveTo(Math.cos(a)*r-8,Math.sin(a)*r+5);ctx.lineTo(Math.cos(a)*r+9,Math.sin(a)*r+3);ctx.lineTo(Math.cos(a)*r+4,Math.sin(a)*r-13);ctx.lineTo(Math.cos(a)*r-9,Math.sin(a)*r-7);ctx.closePath();ctx.fill();}}else if(node.type==='food'){ctx.fillStyle='#3f5035';ctx.fillRect(-node.radius,-node.radius*.55,node.radius*2,node.radius*1.1);ctx.strokeStyle='#718153';ctx.lineWidth=2;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*5,9);ctx.lineTo(i*6+Math.sin(i+this.elapsed)*2,-12);ctx.stroke();}ctx.fillStyle='#7f6b43';ctx.fillRect(-8,-2,16,12);}else{for(let i=-1;i<=1;i++){ctx.fillStyle='#444c49';ctx.fillRect(i*12-5,-8+Math.abs(i)*3,10,18);ctx.fillStyle='#9a723c';ctx.fillRect(i*12-5,-8+Math.abs(i)*3,10,4);}}ctx.restore();}

    drawBuilding(ctx,b){const d=b.def,l=b.left,t=b.top,w=b.w*TILE,h=b.h*TILE;ctx.save();if(!b.completed){ctx.fillStyle='rgba(210,168,74,.07)';ctx.strokeStyle='rgba(232,203,126,.8)';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.fillRect(l+2,t+2,w-4,h-4);ctx.strokeRect(l+2,t+2,w-4,h-4);ctx.setLineDash([]);ctx.strokeStyle='rgba(232,203,126,.3)';ctx.beginPath();ctx.moveTo(l,t);ctx.lineTo(l+w,t+h);ctx.moveTo(l+w,t);ctx.lineTo(l,t+h);ctx.stroke();ctx.fillStyle='#7a6040';for(let i=0;i<Math.floor(b.progress*6);i++)ctx.fillRect(l+7+(i%3)*14,t+h-12-Math.floor(i/3)*10,11,8);ctx.fillStyle='#d2a84a';ctx.fillRect(l,t+h+4,w*b.progress,3);ctx.restore();return;}
      if(this.art?.drawBuilding(ctx,b,this.world)){
        if(b.def.production&&b.powered&&!this.settings.reducedMotion)this.art.drawEffect(ctx,'smoke',b.x+w*.25,t-6,28,((this.elapsed*.55+b.id)%1),.35);
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
        if(z.health/z.maxHealth<.55||z.kind==='armored'||z.kind==='howler')this.drawActorBars(ctx,z,true);
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
      ctx.rotate(-z.facing);const ratio=z.health/z.maxHealth;if(ratio<.55||z.kind==='armored'||z.kind==='howler'){ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(-11,-24,22,3);ctx.fillStyle='#a84d43';ctx.fillRect(-11,-24,22*ratio,3);}ctx.restore();
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

    drawRally(ctx){ctx.save();ctx.translate(this.rally.x,this.rally.y);ctx.strokeStyle='rgba(125,169,113,.7)';ctx.fillStyle='rgba(125,169,113,.08)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,34+Math.sin(this.elapsed*2)*3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();ctx.restore();}

    drawPlacement(ctx){if(this.rallyPlacement){ctx.save();ctx.translate(this.input.mouseWorldX,this.input.mouseWorldY);ctx.strokeStyle='#8db57f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.stroke();ctx.restore();return;}if(!this.selectedBuild)return;const d=BUILDINGS[this.selectedBuild],cells=this.isLineWall(d)?(this.wallPreview.length?this.wallPreview:[{x:grid(this.input.mouseWorldX),y:grid(this.input.mouseWorldY)}]):[{x:grid(this.input.mouseWorldX),y:grid(this.input.mouseWorldY)}];ctx.save();ctx.globalAlpha=.58;for(const cell of cells){const valid=this.world.placement(d,cell.x,cell.y,this.buildRotation).valid&&canAfford(this.resources,d.cost),size=rotateSize(d,this.buildRotation);ctx.fillStyle=valid?'rgba(111,164,102,.55)':'rgba(183,71,62,.55)';ctx.fillRect(cell.x*TILE+2,cell.y*TILE+2,size[0]*TILE-4,size[1]*TILE-4);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.strokeRect(cell.x*TILE+2,cell.y*TILE+2,size[0]*TILE-4,size[1]*TILE-4);}ctx.restore();}

    drawNight(ctx){const darkness=clamp(1-this.daylight(),0,1)*.72;if(darkness<=.02)return;ctx.save();ctx.fillStyle=`rgba(4,8,12,${darkness})`;ctx.fillRect(0,0,this.width,this.height);ctx.globalCompositeOperation='screen';const lights=[{x:this.player.x,y:this.player.y,r:145,s:.2}];for(const b of this.world.buildings.values()){if(!b.completed||b.dead||!b.powered||!b.def.light||lights.length>=PERFORMANCE_LIMITS.lights)continue;lights.push({x:b.x,y:b.y,r:b.def.light,s:.18});}for(const l of lights){const sx=(l.x-this.camera.x)*this.camera.zoom+this.width/2,sy=(l.y-this.camera.y)*this.camera.zoom+this.height/2,r=l.r*this.camera.zoom;if(sx+r<0||sx-r>this.width||sy+r<0||sy-r>this.height)continue;const g=ctx.createRadialGradient(sx,sy,0,sx,sy,r);g.addColorStop(0,`rgba(255,218,143,${l.s})`);g.addColorStop(.5,`rgba(186,164,112,${l.s*.5})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,Math.PI*2);ctx.fill();}ctx.restore();}

    drawRain(ctx){if(this.weather<.02)return;ctx.save();ctx.strokeStyle=`rgba(180,195,196,${.08+this.weather*.12})`;ctx.lineWidth=1;const count=Math.floor(45+this.weather*90);for(let i=0;i<count;i++){const x=(seededHash(i,Math.floor(this.elapsed*3),22)*(this.width+200)-100+this.elapsed*110)%(this.width+200)-100,y=(seededHash(i,5,31)*this.height+this.elapsed*(260+i%70))%this.height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+17);ctx.stroke();}ctx.restore();}

    drawThreatArrows(ctx){
      if(!this.zombies.length)return;const sectors=[0,0,0,0],step=Math.max(1,Math.floor(this.zombies.length/300));for(let i=0;i<this.zombies.length;i+=step){const z=this.zombies[i],dx=z.x-this.camera.x,dy=z.y-this.camera.y;if(Math.abs(dx)<this.width/this.camera.zoom/2&&Math.abs(dy)<this.height/this.camera.zoom/2)continue;if(Math.abs(dx)>Math.abs(dy))sectors[dx>0?1:3]++;else sectors[dy>0?2:0]++;}
      const compact=this.isCompactViewport(),markerRadius=14,clearance=10,centerX=this.width/2;
      const topbarBottom=document.getElementById('topbar').getBoundingClientRect().bottom || (compact?88:72);
      let top=topbarBottom+markerRadius+clearance;
      // Keep the north marker outside the actual HUD, including safe areas and expanded touch panels.
      for(const panel of [this.ui.leftPanel,this.ui.rightPanel]){
        if(panel.classList.contains('hidden'))continue;const rect=panel.getBoundingClientRect();
        if(rect.left<centerX+markerRadius&&rect.right>centerX-markerRadius&&rect.top<top+markerRadius)top=Math.max(top,rect.bottom+markerRadius+clearance);
      }
      top=Math.min(top,this.height-markerRadius-clearance);
      const left=compact?24:Math.min(312,this.width*.22),right=compact?this.width-24:this.width-Math.min(325,this.width*.23),bottom=compact?this.height-176:this.height-78,pos=[{x:centerX,y:top,r:-Math.PI/2},{x:right,y:this.height/2,r:0},{x:centerX,y:bottom,r:Math.PI/2},{x:left,y:this.height/2,r:Math.PI}];ctx.save();for(let i=0;i<4;i++){if(!sectors[i])continue;ctx.save();ctx.translate(pos[i].x,pos[i].y);ctx.rotate(pos[i].r);ctx.fillStyle='rgba(197,83,73,.9)';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-5,0);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();
    }

    drawCrosshair(ctx){
      if(this.state!=='playing'||this.selectedBuild||this.rallyPlacement||globalThis.matchMedia?.('(pointer: coarse)')?.matches)return;const x=this.input.mouseX,y=this.input.mouseY,gap=this.player.weapon==='shotgun'?8:5;ctx.save();ctx.strokeStyle=this.player.reload>0?'rgba(216,173,77,.78)':'rgba(235,240,235,.88)';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(x-gap-8,y);ctx.lineTo(x-gap,y);ctx.moveTo(x+gap,y);ctx.lineTo(x+gap+8,y);ctx.moveTo(x,y-gap-8);ctx.lineTo(x,y-gap);ctx.moveTo(x,y+gap);ctx.lineTo(x,y+gap+8);ctx.stroke();ctx.fillStyle=this.player.reload>0?'#d8ad4d':'#edf1ec';ctx.fillRect(x-1,y-1,2,2);ctx.restore();
    }

    renderMinimap(){if(this.state!=='playing')return;const ctx=this.mctx,w=this.minimap.width,h=this.minimap.height,sx=w/WORLD_SIZE,sy=h/WORLD_SIZE;ctx.clearRect(0,0,w,h);ctx.fillStyle='#151b17';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.035)';for(let i=0;i<=8;i++){const x=i/8*w,y=i/8*h;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}ctx.fillStyle='rgba(125,130,120,.08)';ctx.fillRect((WORLD_SIZE/2-430)*sx,(WORLD_SIZE/2-320)*sy,860*sx,640*sy);for(const b of this.world.buildings.values()){if(b.dead)continue;ctx.fillStyle=b.type==='core'?'#d2a84a':b.def.defense?'#89958f':'#687a68';ctx.fillRect(b.left*sx,b.top*sy,Math.max(1,b.w*TILE*sx),Math.max(1,b.h*TILE*sy));}ctx.fillStyle='#b64f45';const step=this.zombies.length>400?2:1;for(let i=0;i<this.zombies.length;i+=step){const z=this.zombies[i];if(!z.dead)ctx.fillRect(z.x*sx,z.y*sy,1.5,1.5);}ctx.fillStyle='#85a975';for(const u of this.units)if(!u.dead)ctx.fillRect(u.x*sx-1,u.y*sy-1,2,2);ctx.fillStyle='#f2d16d';ctx.beginPath();ctx.arc(this.player.x*sx,this.player.y*sy,3,0,Math.PI*2);ctx.fill();const hw=this.width/this.camera.zoom/2,hh=this.height/this.camera.zoom/2;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.strokeRect((this.camera.x-hw)*sx,(this.camera.y-hh)*sy,hw*2*sx,hh*2*sy);}
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
