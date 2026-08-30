(function initDeadwallCore(global) {
  'use strict';

  const TILE = 32;
  const WORLD_TILES = 128;
  const WORLD_SIZE = TILE * WORLD_TILES;
  const SAVE_KEY = 'deadwall-save-v2';
  const LEGACY_SAVE_KEYS = ['deadwall-save-v1'];
  const SAVE_BACKUP_KEY = 'deadwall-save-backup-v2';
  const SETTINGS_KEY = 'deadwall-settings-v1';
  const SAVE_VERSION = 2;
  const RESOURCE_KEYS = ['wood', 'scrap', 'stone', 'food', 'fuel', 'ammo', 'medicine'];

  const RESOURCE_META = {
    wood: { label: 'BOIS', short: 'B', color: '#94704a' },
    scrap: { label: 'FERRAILLE', short: 'F', color: '#87918f' },
    stone: { label: 'PIERRE', short: 'P', color: '#8d887c' },
    food: { label: 'NOURRITURE', short: 'N', color: '#82945f' },
    fuel: { label: 'CARBURANT', short: 'C', color: '#b68d3f' },
    ammo: { label: 'MUNITIONS', short: 'M', color: '#ad714f' },
    medicine: { label: 'MÉDICAMENTS', short: '+', color: '#7fa59d' }
  };

  const DIFFICULTIES = {
    story: { id: 'story', label: 'Survivant', enemyCount: 0.72, enemyHealth: 0.85, enemyDamage: 0.75, resourceYield: 1.3, calmTime: 1.2 },
    standard: { id: 'standard', label: 'Standard', enemyCount: 1, enemyHealth: 1, enemyDamage: 1, resourceYield: 1, calmTime: 1 },
    brutal: { id: 'brutal', label: 'Brutal', enemyCount: 1.35, enemyHealth: 1.15, enemyDamage: 1.3, resourceYield: 0.85, calmTime: 0.82 }
  };

  const CITY_TIERS = [
    { id: 0, name: 'REFUGE', requiredScore: 0 },
    { id: 1, name: 'CAMP FORTIFIÉ', requiredScore: 10 },
    { id: 2, name: 'AVANT-POSTE', requiredScore: 24 },
    { id: 3, name: 'FORTERESSE', requiredScore: 48 },
    { id: 4, name: 'CITÉ', requiredScore: 85 },
    { id: 5, name: 'CITADELLE', requiredScore: 135 },
    { id: 6, name: 'MÉGACITÉ', requiredScore: 210 }
  ];

  const B = (id, name, category, icon, description, cost, health, buildTime, size, unlockTier, score, extra = {}) => ({
    id, name, category, icon, description, cost, health, buildTime, size, unlockTier, score,
    color: '#555d57', roof: '#747d75', ...extra
  });

  const BUILDINGS = {
    core: B('core', 'Centre de commandement', 'colony', '◆', 'Cœur vital de la colonie. Sa destruction met fin à la partie.', {}, 3200, 0, [4, 4], 0, 8,
      { symbol: 'CC', color: '#4a514c', roof: '#69716a', powerGen: 8, housing: 6, storage: 500, light: 250 }),
    house: B('house', 'Dortoir renforcé', 'colony', '⌂', 'Ajoute huit places et protège la population pendant les alertes.', { wood: 70, scrap: 20 }, 700, 18, [3, 2], 0, 4,
      { symbol: 'H', color: '#665845', roof: '#85755c', housing: 8, light: 70 }),
    warehouse: B('warehouse', 'Entrepôt', 'colony', '▤', 'Augmente le stockage et sert de point de dépôt aux équipes de collecte.', { wood: 55, scrap: 45 }, 900, 22, [3, 3], 0, 5,
      { symbol: 'ST', storage: 600, light: 55 }),
    barracks: B('barracks', 'Caserne', 'colony', '★', 'Permet de former des fusiliers et sert de poste de repli.', { wood: 75, scrap: 70, ammo: 25 }, 1050, 30, [4, 3], 1, 9,
      { symbol: 'CA', color: '#485144', roof: '#687263', powerUse: 1, housing: 4, light: 80 }),
    clinic: B('clinic', 'Clinique', 'colony', '+', 'Soigne les unités proches et stabilise les blessés.', { wood: 60, scrap: 55, medicine: 8 }, 850, 28, [3, 3], 2, 7,
      { symbol: '+', color: '#586965', roof: '#7c928b', powerUse: 2, light: 90 }),

    farm: B('farm', 'Ferme protégée', 'industry', '≋', 'Produit régulièrement de la nourriture. Sa grande surface doit être défendue.', { wood: 55, stone: 25 }, 540, 20, [4, 3], 0, 5,
      { symbol: 'F', color: '#4d5c3f', roof: '#657952', production: { food: 0.42 } }),
    generator: B('generator', 'Générateur', 'industry', '⚡', 'Fournit de l’énergie aux ateliers, projecteurs et tourelles.', { scrap: 55, fuel: 20 }, 650, 18, [2, 2], 1, 5,
      { symbol: 'G', color: '#6c5e3f', roof: '#8c784b', powerGen: 24, light: 100, explosive: 70 }),
    lumber: B('lumber', 'Scierie', 'industry', '╫', 'Transforme les zones boisées en approvisionnement régulier.', { wood: 45, scrap: 35 }, 750, 22, [3, 3], 1, 6,
      { symbol: 'B', color: '#674f3b', roof: '#84664c', powerUse: 1, production: { wood: 0.48 } }),
    scrapyard: B('scrapyard', 'Centre de recyclage', 'industry', '⚙', 'Trie les carcasses et produit de la ferraille utilisable.', { wood: 35, scrap: 50 }, 780, 24, [3, 3], 1, 6,
      { symbol: 'R', color: '#505957', roof: '#6f7875', powerUse: 2, production: { scrap: 0.36 } }),
    quarry: B('quarry', 'Concasseur', 'industry', '▲', 'Produit pierre et agrégats pour les remparts lourds.', { wood: 45, scrap: 55, stone: 20 }, 850, 27, [3, 3], 2, 7,
      { symbol: 'Q', color: '#5d5b55', roof: '#7d7970', powerUse: 3, production: { stone: 0.34 } }),
    refinery: B('refinery', 'Micro-raffinerie', 'industry', '◉', 'Récupère et stabilise du carburant. Risque d’explosion sous les tirs.', { scrap: 90, stone: 40, fuel: 25 }, 700, 34, [3, 3], 2, 9,
      { symbol: 'RF', color: '#655c45', roof: '#887a56', powerUse: 4, production: { fuel: 0.18 }, explosive: 110 }),
    workshop: B('workshop', 'Atelier militaire', 'industry', '⚒', 'Entretient les armes et déverrouille les défenses avancées.', { wood: 55, scrap: 100, stone: 25 }, 1000, 35, [4, 3], 2, 10,
      { symbol: 'AT', color: '#50544f', roof: '#72766f', powerUse: 4, light: 90 }),
    ammoFactory: B('ammoFactory', 'Manufacture de munitions', 'industry', '●', 'Transforme la ferraille en munitions.', { scrap: 120, stone: 55, fuel: 15 }, 950, 38, [4, 3], 3, 12,
      { symbol: 'MU', color: '#594d43', roof: '#806e5c', powerUse: 5, production: { ammo: 0.9 }, consumes: { scrap: 0.11 }, explosive: 90 }),

    woodWall: B('woodWall', 'Palissade', 'defense', '┃', 'Mur rapide. Cliquez puis tirez pour tracer une ligne.', { wood: 8 }, 360, 4, [1, 1], 0, 0.25,
      { wall: true, defense: true, color: '#70543a', roof: '#9a754e', upgradeTo: 'steelWall' }),
    steelWall: B('steelWall', 'Mur d’acier', 'defense', '║', 'Conteneurs soudés et plaques renforcées.', { scrap: 10, stone: 4 }, 780, 7, [1, 1], 2, 0.45,
      { wall: true, defense: true, color: '#525c5e', roof: '#7d898b', upgradeTo: 'concreteWall' }),
    concreteWall: B('concreteWall', 'Rempart en béton', 'defense', '█', 'Rempart monumental prévu pour plusieurs enceintes concentriques.', { stone: 16, scrap: 6 }, 1450, 11, [1, 1], 3, 0.7,
      { wall: true, defense: true, color: '#666863', roof: '#94958e' }),
    gate: B('gate', 'Porte fortifiée', 'defense', '▥', 'Laisse passer les alliés. Les hordes privilégient ce point faible.', { wood: 25, scrap: 25 }, 680, 10, [2, 1], 0, 1.3,
      { symbol: 'P', wall: true, gate: true, defense: true, color: '#565b58', roof: '#858b87', upgradeTo: 'armoredGate' }),
    armoredGate: B('armoredGate', 'Porte blindée', 'defense', '▦', 'Porte motorisée renforcée pour les enceintes intérieures.', { scrap: 70, stone: 35 }, 1350, 15, [2, 1], 3, 2.5,
      { symbol: 'P', wall: true, gate: true, defense: true, color: '#4b5354', roof: '#778184', powerUse: 1 }),
    spikes: B('spikes', 'Hérisson anti-horde', 'defense', '✕', 'Ralentit et blesse les infectés avant les murs.', { wood: 10, scrap: 6 }, 280, 5, [1, 1], 1, 0.35,
      { symbol: 'X', defense: true, trapDamage: 18, color: '#4f514d', roof: '#7b7d76' }),
    watchtower: B('watchtower', 'Mirador', 'defense', '♜', 'Position élevée autonome consommant les munitions de la réserve.', { wood: 55, scrap: 35, ammo: 20 }, 720, 20, [2, 2], 1, 5,
      { symbol: 'T', defense: true, range: 285, fireRate: 1.35, damage: 38, ammoPerShot: 1, color: '#5b4d3c', roof: '#866d4f', light: 120 }),
    turret: B('turret', 'Tourelle automatique', 'defense', '⊕', 'Arme automatique précise nécessitant énergie et munitions.', { scrap: 85, ammo: 35, fuel: 5 }, 680, 25, [2, 2], 2, 7,
      { symbol: 'TA', defense: true, range: 330, fireRate: 4.2, damage: 27, ammoPerShot: 1, powerUse: 3, requires: 'workshop', color: '#454d4e', roof: '#747f81', light: 150 }),
    heavyTurret: B('heavyTurret', 'Tourelle lourde', 'defense', '⊛', 'Mitrailleuse lourde adaptée aux axes saturés.', { scrap: 150, stone: 40, ammo: 80, fuel: 10 }, 1050, 38, [2, 2], 4, 11,
      { symbol: 'TL', defense: true, range: 390, fireRate: 7.5, damage: 36, ammoPerShot: 1, powerUse: 6, requires: 'workshop', color: '#41494a', roof: '#697477', light: 180 })
  };

  const ENEMIES = {
    walker: { id: 'walker', name: 'Errant', health: 72, speed: 35, damage: 16, attackRate: 0.75, radius: 11, color: '#596052', unlockWave: 1 },
    runner: { id: 'runner', name: 'Infecté récent', health: 54, speed: 72, damage: 12, attackRate: 1.2, radius: 10, color: '#6a5d4f', unlockWave: 2 },
    armored: { id: 'armored', name: 'Infecté protégé', health: 175, speed: 27, damage: 25, attackRate: 0.6, radius: 13, color: '#3f4c4f', unlockWave: 4 },
    crawler: { id: 'crawler', name: 'Rampant', health: 44, speed: 55, damage: 9, attackRate: 1.55, radius: 8, color: '#655c50', unlockWave: 5 },
    howler: { id: 'howler', name: 'Hurleur', health: 110, speed: 43, damage: 14, attackRate: 0.9, radius: 12, color: '#6a4b45', unlockWave: 7 }
  };

  const WEAPONS = {
    pistol: { id: 'pistol', name: 'PISTOLET', damage: 42, fireRate: 3.2, magazine: 12, reload: 1.35, spread: 0.035, pellets: 1, ammoPerReload: 1, range: 650, tier: 0 },
    rifle: { id: 'rifle', name: 'FUSIL D’ASSAUT', damage: 34, fireRate: 8.2, magazine: 30, reload: 1.8, spread: 0.055, pellets: 1, ammoPerReload: 1, range: 760, tier: 1 },
    shotgun: { id: 'shotgun', name: 'FUSIL À POMPE', damage: 18, fireRate: 1.05, magazine: 8, reload: 2.25, spread: 0.21, pellets: 8, ammoPerReload: 2, range: 420, tier: 2 }
  };

  const OBJECTIVES = [
    { id: 'gather', title: 'Sécuriser les matériaux', text: 'Récoltez puis déposez 30 unités dans un centre ou entrepôt.', target: 30, reward: { wood: 35, scrap: 20 } },
    { id: 'house', title: 'Loger les survivants', text: 'Construisez un dortoir renforcé.', target: 1, reward: { food: 35 } },
    { id: 'farm', title: 'Assurer l’approvisionnement', text: 'Mettez en service une ferme protégée.', target: 1, reward: { wood: 30, stone: 20 } },
    { id: 'walls', title: 'Fermer la première enceinte', text: 'Construisez douze segments de mur ou de porte.', target: 12, reward: { scrap: 45, ammo: 30 } },
    { id: 'power', title: 'Électrifier la ligne', text: 'Construisez un générateur et gardez une réserve de carburant.', target: 1, reward: { scrap: 35, fuel: 20 } },
    { id: 'defense', title: 'Armer le périmètre', text: 'Construisez un mirador ou une tourelle.', target: 1, reward: { ammo: 70, fuel: 10 } },
    { id: 'research', title: 'Organiser la recherche', text: 'Lancez une doctrine de recherche depuis le panneau de commandement.', target: 1, reward: { medicine: 8, ammo: 35 } },
    { id: 'wave', title: 'Tenir la ligne', text: 'Survivez à trois vagues complètes.', target: 3, reward: { wood: 80, scrap: 80, stone: 60, food: 60 } }
  ];

  const RESEARCH = [
    { id: 'logistics', name: 'Doctrine logistique', description: 'Ouvriers plus efficaces et dépôts moins saturés.', cost: { scrap: 45, food: 25 }, insight: 1, tier: 0 },
    { id: 'fortification', name: 'Chaînage des enceintes', description: 'Murs et portes subissent 12 % de dégâts en moins.', cost: { wood: 55, stone: 35 }, insight: 2, tier: 1 },
    { id: 'ballistics', name: 'Tables balistiques', description: 'Fusiliers et tourelles tirent mieux sans augmenter la consommation.', cost: { scrap: 80, ammo: 50 }, insight: 3, tier: 2 },
    { id: 'sanitation', name: 'Brigades sanitaires', description: 'Corps et blessures pèsent moins sur la ligne.', cost: { medicine: 8, food: 40 }, insight: 2, tier: 2 },
    { id: 'grid', name: 'Réseau prioritaire', description: 'Les circuits partiels restent efficaces et les générateurs consomment 25 % de moins.', cost: { scrap: 90, fuel: 25 }, insight: 3, tier: 3 },
    { id: 'recon', name: 'Reconnaissance des fronts', description: 'Les vagues sont annoncées cinq secondes plus tôt et les crises sont moins fréquentes.', cost: { scrap: 120, ammo: 65, medicine: 10 }, insight: 4, tier: 4 }
  ];

  const CRISES = [
    { id: 'blackout', title: 'Noir électrique', minWave: 2, severity: 1, text: 'Un court-circuit force un délestage brutal.', choiceA: 'Brûler du carburant pour stabiliser.', choiceB: 'Couper les ateliers et préserver la réserve.' },
    { id: 'injury', title: 'Blessés aux portes', minWave: 3, severity: 1, text: 'Des survivants arrivent mordus et épuisés.', choiceA: 'Consommer des médicaments pour les intégrer.', choiceB: 'Les isoler, au prix du moral.' },
    { id: 'ammo', title: 'Munitions humides', minWave: 4, severity: 2, text: 'Une réserve a pris l’eau pendant la nuit.', choiceA: 'Sécher et trier maintenant.', choiceB: 'Accepter les pertes et tenir le rythme.' },
    { id: 'breach', title: 'Fissure dans l’enceinte', minWave: 5, severity: 2, text: 'La pression des corps a ouvert un point faible.', choiceA: 'Réparer les défenses critiques.', choiceB: 'Former des équipes de nettoyage.' }
  ];

  const PERFORMANCE_LIMITS = { zombies: 720, corpses: 900, particles: 950, lights: 85 };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function distSq(a, b) { const x = a.x - b.x; const y = a.y - b.y; return x * x + y * y; }
  function grid(value) { return clamp(Math.floor(value / TILE), 0, WORLD_TILES - 1); }
  function world(cell) { return cell * TILE + TILE / 2; }
  function index(x, y) { return y * WORLD_TILES + x; }
  function makeBag(source = {}) { const bag = {}; for (const key of RESOURCE_KEYS) bag[key] = Number(source[key] || 0); return bag; }
  function bagTotal(bag) { return RESOURCE_KEYS.reduce((sum, key) => sum + Number(bag[key] || 0), 0); }
  function canAfford(stock, cost, multiplier = 1) { return RESOURCE_KEYS.every(key => (stock[key] || 0) + 1e-6 >= (cost[key] || 0) * multiplier); }
  function spend(stock, cost, multiplier = 1) {
    if (!canAfford(stock, cost, multiplier)) return false;
    for (const key of RESOURCE_KEYS) stock[key] -= (cost[key] || 0) * multiplier;
    return true;
  }
  function add(stock, gain, cap = Infinity) {
    let total = 0;
    for (const key of RESOURCE_KEYS) {
      const before = stock[key] || 0;
      stock[key] = clamp(before + (gain[key] || 0), 0, cap);
      total += stock[key] - before;
    }
    return total;
  }
  function scaledCost(cost, factor) { const out = {}; for (const key of RESOURCE_KEYS) if ((cost[key] || 0) > 0) out[key] = Math.ceil(cost[key] * factor); return out; }
  function resourceText(cost) { return RESOURCE_KEYS.filter(k => (cost[k] || 0) > 0).map(k => `${RESOURCE_META[k].short} ${Math.ceil(cost[k])}`).join(' · '); }
  function formatNumber(value) {
    const n = Math.floor(value || 0);
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e4) return `${(n / 1e3).toFixed(1)}k`;
    return n.toLocaleString('fr-FR');
  }
  function formatTime(seconds) { const n = Math.max(0, Math.ceil(seconds)); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
  function seededHash(x, y, seed = 0) {
    let v = Math.imul((x | 0) + Math.imul(seed | 0, 374761393), 668265263) ^ Math.imul((y | 0) + Math.imul(seed | 0, 1274126177), 2246822519);
    v = Math.imul(v ^ (v >>> 13), 1274126177);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967295;
  }
  function cityTier(score) { let result = CITY_TIERS[0]; for (const tier of CITY_TIERS) { if (score >= tier.requiredScore) result = tier; else break; } return result; }
  function buildingList(category) { return Object.values(BUILDINGS).filter(def => def.category === category && !['core', 'armoredGate'].includes(def.id)); }
  function enemyHealthScale(wave) { return 1 + clamp(Math.log2(Math.max(1, wave)) * 0.055, 0, 0.34); }
  function wallLine(a, b) {
    const cells = [{ x: a.x, y: a.y }];
    let x = a.x, y = a.y;
    const sx = Math.sign(b.x - a.x), sy = Math.sign(b.y - a.y);
    const dx = Math.abs(b.x - a.x), dy = Math.abs(b.y - a.y);
    let err = dx - dy;
    while (x !== b.x || y !== b.y) {
      const e2 = err * 2, ox = x, oy = y;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
      if (x !== ox && y !== oy) cells.push({ x, y: oy });
      cells.push({ x, y });
      if (cells.length > WORLD_TILES * 4) break;
    }
    const seen = new Set();
    return cells.filter(cell => {
      const key = cell.x + ':' + cell.y;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function powerPriority(def) {
    if (!def.powerUse) return 0;
    if (def.defense) return 1;
    if (def.id === 'clinic') return 2;
    if (def.production) return 3;
    return 4;
  }
  function researchById(id) { return RESEARCH.find(item => item.id === id) || null; }
  function crisisForWave(wave, seed = 0) {
    const pool = CRISES.filter(crisis => wave >= crisis.minWave);
    if (!pool.length) return null;
    return pool[Math.floor(seededHash(wave, seed, 91) * pool.length) % pool.length];
  }
  function normalizeResearch(value = {}) {
    return { completed: Array.isArray(value.completed) ? [...new Set(value.completed)] : [], insight: Math.max(0, Number(value.insight || 0)), active: value.active || null };
  }
  function migrateSaveData(data) {
    if (!data || typeof data !== 'object') return null;
    if (data.version === SAVE_VERSION) return { ...data, research: normalizeResearch(data.research) };
    if (data.version !== 1) return null;
    return {
      ...data,
      version: SAVE_VERSION,
      migratedFrom: 1,
      research: normalizeResearch(),
      depositedResources: Number(data.stats?.gathered || 0),
      wavePlan: null,
      spawnTimer: Number(data.spawnTimer || 0),
      randomState: Number(data.randomState || Date.now()) >>> 0
    };
  }
  function wavePlan(wave, difficulty = DIFFICULTIES.standard, signature = 0) {
    const base = 10 + wave * 5 + Math.pow(wave, 1.62) * 2.35;
    const attraction = 1 + clamp(signature / 360, 0, 0.8);
    const total = Math.max(8, Math.floor(base * difficulty.enemyCount * attraction));
    const weights = {
      runner: wave >= 2 ? Math.min(0.42, 0.08 + wave * 0.018) : 0,
      armored: wave >= 4 ? Math.min(0.28, 0.035 + wave * 0.012) : 0,
      crawler: wave >= 5 ? Math.min(0.22, 0.025 + wave * 0.009) : 0,
      howler: wave >= 7 ? Math.min(0.13, 0.012 + wave * 0.0045) : 0
    };
    const composition = { walker: total, runner: 0, armored: 0, crawler: 0, howler: 0 };
    const specialTotal = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const specialScale = specialTotal > 0.82 ? 0.82 / specialTotal : 1;
    let assigned = 0;
    for (const kind of ['runner', 'armored', 'crawler', 'howler']) {
      const amount = Math.floor(total * weights[kind] * specialScale);
      composition[kind] = amount;
      assigned += amount;
    }
    composition.walker = total - assigned;
    return { wave, total, fronts: Math.min(4, 1 + Math.floor((wave - 1) / 3)), spawnInterval: clamp(0.52 - wave * 0.012, 0.07, 0.52), composition };
  }
  function createStats() { return { kills: 0, shots: 0, headshots: 0, gathered: 0, buildingsPlaced: 0, buildingsLost: 0, unitsLost: 0, wavesSurvived: 0, playSeconds: 0 }; }

  class Random {
    constructor(seed = Date.now()) { this.state = seed >>> 0; }
    next() { this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0; return this.state / 4294967296; }
    range(min, max) { return min + (max - min) * this.next(); }
    int(min, max) { return Math.floor(this.range(min, max)); }
    chance(p) { return this.next() < p; }
    pick(items) { return items[Math.min(items.length - 1, this.int(0, items.length))]; }
    shuffle(items) { for (let i = items.length - 1; i > 0; i--) { const j = this.int(0, i + 1); [items[i], items[j]] = [items[j], items[i]]; } return items; }
  }

  class MinHeap {
    constructor() { this.nodes = []; }
    get size() { return this.nodes.length; }
    clear() { this.nodes.length = 0; }
    push(indexValue, priority) {
      const node = { index: indexValue, priority };
      this.nodes.push(node);
      let child = this.nodes.length - 1;
      while (child > 0) {
        const parent = (child - 1) >> 1;
        if (this.nodes[parent].priority <= priority) break;
        this.nodes[child] = this.nodes[parent]; child = parent;
      }
      this.nodes[child] = node;
    }
    pop() {
      if (!this.nodes.length) return undefined;
      const root = this.nodes[0];
      const tail = this.nodes.pop();
      if (!tail || !this.nodes.length) return root;
      let parent = 0;
      while (true) {
        const left = parent * 2 + 1, right = left + 1;
        if (left >= this.nodes.length) break;
        let child = right < this.nodes.length && this.nodes[right].priority < this.nodes[left].priority ? right : left;
        if (this.nodes[child].priority >= tail.priority) break;
        this.nodes[parent] = this.nodes[child]; parent = child;
      }
      this.nodes[parent] = tail;
      return root;
    }
  }

  const Core = {
    TILE, WORLD_TILES, WORLD_SIZE, SAVE_KEY, LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SETTINGS_KEY, SAVE_VERSION,
    RESOURCE_KEYS, RESOURCE_META, DIFFICULTIES, CITY_TIERS, BUILDINGS, ENEMIES, WEAPONS, OBJECTIVES,
    RESEARCH, CRISES, PERFORMANCE_LIMITS,
    clamp, lerp, dist, distSq, grid, world, index, makeBag, bagTotal, canAfford, spend, add,
    scaledCost, resourceText, formatNumber, formatTime, seededHash, cityTier, buildingList,
    enemyHealthScale, wallLine, powerPriority, researchById, crisisForWave, normalizeResearch, migrateSaveData,
    wavePlan, createStats, Random, MinHeap
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  global.DeadwallCore = Core;
})(typeof globalThis !== 'undefined' ? globalThis : this);
