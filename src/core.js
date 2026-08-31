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
    walker: { id: 'walker', name: 'Errant', health: 72, speed: 35, damage: 16, attackRate: 0.75, radius: 11, color: '#596052', unlockWave: 1, structureDamage: 1, corpseLoad: 1,
      description: 'Civil contaminé aux vêtements usés. Il suit la masse vers les accès faibles de la cité.', weakness: 'Lent et limité au corps-à-corps : garder une ligne de tir et une issue de repli.' },
    runner: { id: 'runner', name: 'Infecté récent', health: 54, speed: 72, damage: 12, attackRate: 1.2, radius: 10, color: '#6a5d4f', unlockWave: 2, structureDamage: 1, corpseLoad: 1,
      description: 'Contamination récente, mobilité conservée. Peut franchir un rempart sur un amas de corps suffisant.', weakness: 'Fragile : le traiter avant le contact et dégager les corps au pied des murs.' },
    armored: { id: 'armored', name: 'Infecté protégé', health: 175, speed: 27, damage: 25, attackRate: 0.6, radius: 13, color: '#3f4c4f', unlockWave: 4, structureDamage: 1, corpseLoad: 2.2,
      description: 'Ancien agent encore couvert de protections. Résiste davantage et alourdit les amas près des remparts.', weakness: 'Très lent : concentrer les tirs à distance, puis déblayer sa dépouille.' },
    crawler: { id: 'crawler', name: 'Rampant', health: 44, speed: 55, damage: 9, attackRate: 1.55, radius: 8, color: '#655c50', unlockWave: 5, structureDamage: 1, corpseLoad: 1,
      description: 'Infecté blessé progressant au ras du sol. Exploite les amas de corps pour passer les murs.', weakness: 'Peu résistant : surveiller les pieds des enceintes et nettoyer les rampes de corps.' },
    howler: { id: 'howler', name: 'Hurleur', health: 110, speed: 43, damage: 14, attackRate: 0.9, radius: 12, color: '#6a4b45', unlockWave: 7, structureDamage: 1, corpseLoad: 1,
      description: 'Ses cris agitent les infectés proches et accélèrent brièvement leur avancée, sans créer de renforts.', weakness: 'L’abattre à distance réduit les accélérations du groupe qui l’entoure.' },
    breacher: { id: 'breacher', name: 'Briseur', health: 140, speed: 30, damage: 18, attackRate: 0.65, radius: 13, color: '#92743e', unlockWave: 3, structureDamage: 1.8, corpseLoad: 1,
      description: 'Ancien ouvrier en veste ocre. Sa poussée répétée inflige 80 % de dégâts supplémentaires aux structures, pas aux survivants.', weakness: 'Lent et moins résistant qu’un infecté protégé : le viser avant qu’il atteigne une porte.' },
    stalker: { id: 'stalker', name: 'Traqueur', health: 62, speed: 61, damage: 11, attackRate: 1.1, radius: 10, color: '#465658', unlockWave: 6, structureDamage: 1, corpseLoad: 1,
      description: 'Silhouette fine en sweat à capuche. Dévie vers un survivant isolé, proche et visible ; revient vers la cité si le passage se ferme.', weakness: 'Rester groupés, fermer une porte ou rompre sa ligne de vue ; il ne voit pas à travers les murs.' },
    bloated: { id: 'bloated', name: 'Engorgé', health: 145, speed: 23, damage: 20, attackRate: 0.65, radius: 14, color: '#754f46', unlockWave: 8, structureDamage: 1, corpseLoad: 3.4,
      description: 'Infecté massif au manteau rouge-brun. Sa dépouille ajoute 3,4 unités de pression aux remparts proches. Aucune explosion.', weakness: 'Le plus lent du groupe : l’abattre loin des murs ou affecter des ouvriers au déblaiement.' }
  };

  const ENEMY_RULES = Object.freeze({
    specialShare: 0.82, sanitizedCorpseLoad: 0.65, structureReach: 18,
    stalkRange: 210, stalkIsolation: 90, stalkThinkSeconds: 0.5, stalkQueriesPerUpdate: 8,
    waveWeights: {
      runner: { base: 0.08, growth: 0.018, maximum: 0.42, origin: 0 },
      armored: { base: 0.035, growth: 0.012, maximum: 0.28, origin: 0 },
      crawler: { base: 0.025, growth: 0.009, maximum: 0.22, origin: 0 },
      howler: { base: 0.012, growth: 0.0045, maximum: 0.13, origin: 0 },
      breacher: { base: 0.04, growth: 0.003, maximum: 0.10, origin: 3 },
      stalker: { base: 0.035, growth: 0.004, maximum: 0.09, origin: 6 },
      bloated: { base: 0.03, growth: 0.003, maximum: 0.07, origin: 8 }
    }
  });

  const WEAPONS = {
    pistol: { id: 'pistol', name: 'PISTOLET', damage: 42, fireRate: 3.2, magazine: 12, reload: 1.35, spread: 0.035, pellets: 1, ammoPerReload: 1, range: 650, tier: 0 },
    rifle: { id: 'rifle', name: 'FUSIL D’ASSAUT', damage: 34, fireRate: 8.2, magazine: 30, reload: 1.8, spread: 0.055, pellets: 1, ammoPerReload: 1, range: 760, tier: 1 },
    shotgun: { id: 'shotgun', name: 'FUSIL À POMPE', damage: 18, fireRate: 1.05, magazine: 8, reload: 2.25, spread: 0.21, pellets: 8, ammoPerReload: 2, range: 420, tier: 2 }
  };

  const OBJECTIVES = [
    { id: 'gather', title: 'Sécuriser les matériaux', text: 'Récoltez puis déposez 30 unités dans un centre ou entrepôt.', target: 30, reward: { wood: 35, scrap: 20 } },
    { id: 'house', title: 'Loger les survivants', text: 'Construisez un dortoir renforcé.', target: 1, reward: { food: 35 } },
    { id: 'farm', title: 'Assurer l’approvisionnement', text: 'Mettez en service une ferme protégée.', target: 1, reward: { wood: 30, stone: 20 } },
    { id: 'walls', title: 'Préparer la première enceinte', text: 'Construisez douze segments de mur ou de porte, puis reliez-les autour de la cité en conservant un accès allié.', target: 12, reward: { scrap: 45, ammo: 30 } },
    { id: 'power', title: 'Électrifier la ligne', text: 'Construisez un générateur et gardez une réserve de carburant.', target: 1, reward: { scrap: 35, fuel: 20 } },
    { id: 'defense', title: 'Armer le périmètre', text: 'Construisez un mirador ou une tourelle.', target: 1, reward: { ammo: 70, fuel: 10 } },
    { id: 'research', title: 'Organiser la recherche', text: 'Lancez une doctrine de recherche depuis le panneau de commandement.', target: 1, reward: { medicine: 8, ammo: 35 } },
    { id: 'wave', title: 'Tenir la ligne', text: 'Survivez à trois vagues complètes.', target: 3, reward: { wood: 80, scrap: 80, stone: 60, food: 60 } }
  ];

  const RESEARCH = [
    { id: 'logistics', name: 'Doctrine logistique', description: 'Récolte des ouvriers +18 % ; travail sur chantier environ +16 %.', cost: { scrap: 45, food: 25 }, insight: 1, tier: 0 },
    { id: 'fortification', name: 'Chaînage des enceintes', description: 'Murs et portes subissent 12 % de dégâts en moins.', cost: { wood: 55, stone: 35 }, insight: 2, tier: 1 },
    { id: 'ballistics', name: 'Tables balistiques', description: 'Dégâts des défenses +12 % ; fusiliers : 35 au lieu de 31 par tir. Même coût en munitions.', cost: { scrap: 80, ammo: 50 }, insight: 3, tier: 2 },
    { id: 'sanitation', name: 'Brigades sanitaires', description: 'Chaque infecté tué près d’un mur ajoute 0,65 unité de pression au lieu de 1 (2,2 pour les blindés, 3,4 pour les Engorgés).', cost: { medicine: 8, food: 40 }, insight: 2, tier: 2 },
    { id: 'grid', name: 'Réseau prioritaire', description: 'Les circuits partiels restent efficaces et les générateurs consomment 25 % de moins.', cost: { scrap: 90, fuel: 25 }, insight: 3, tier: 3 },
    { id: 'recon', name: 'Reconnaissance des fronts', description: 'Les vagues sont annoncées cinq secondes plus tôt et les crises sont moins fréquentes.', cost: { scrap: 120, ammo: 65, medicine: 10 }, insight: 4, tier: 4 }
  ];

  const CRISES = [
    { id: 'blackout', title: 'Noir électrique', minWave: 2, severity: 1, text: 'Un court-circuit force un délestage brutal.', choiceA: 'Brûler du carburant pour stabiliser.', choiceB: 'Couper les ateliers et préserver la réserve.' },
    { id: 'injury', title: 'Blessés aux portes', minWave: 3, severity: 1, text: 'Des survivants arrivent mordus et épuisés.', choiceA: 'Consommer des médicaments pour les intégrer.', choiceB: 'Les isoler, au prix du moral.' },
    { id: 'ammo', title: 'Munitions humides', minWave: 4, severity: 2, text: 'Une réserve a pris l’eau pendant la nuit.', choiceA: 'Sécher et trier maintenant.', choiceB: 'Accepter les pertes et tenir le rythme.' },
    { id: 'breach', title: 'Fissure dans l’enceinte', minWave: 5, severity: 2, text: 'La pression des corps a ouvert un point faible.', choiceA: 'Réparer les défenses critiques.', choiceB: 'Former des équipes de nettoyage.' }
  ];

  const CRISIS_CHOICES = {
    blackout: {
      A: { label: 'Stabiliser le réseau', cost: { fuel: 12, scrap: 8 }, description: 'Maintient toute la production.', effects: {} },
      B: { label: 'Délester les ateliers', cost: {}, description: 'Production réduite de moitié pendant 60 secondes.', effects: { productionMultiplier: .5, duration: 60 } }
    },
    injury: {
      A: { label: 'Soigner et accueillir', cost: { medicine: 6, food: 12 }, description: 'Un ouvrier rejoint la cité ; moral +4. Une place de logement requise.', effects: { workers: 1, morale: 4 } },
      B: { label: 'Maintenir la quarantaine', cost: {}, description: 'Préserve les réserves ; moral −5.', effects: { morale: -5 } }
    },
    ammo: {
      A: { label: 'Sécher et trier', cost: { fuel: 8, scrap: 10 }, description: 'Sauve la réserve de munitions.', effects: {} },
      B: { label: 'Écarter les lots humides', cost: {}, description: 'Perte de 18 munitions, dans la limite du stock.', effects: { ammo: -18 } }
    },
    breach: {
      A: { label: 'Consolider la fissure', cost: { wood: 20, scrap: 15, stone: 10 }, description: 'Restaure 20 % de l’intégrité maximale du mur ciblé.', effects: { wallRepair: .2 } },
      B: { label: 'Déblayer sous pression', cost: {}, description: 'Retire 18 corps ; le mur perd 12 % de son intégrité maximale sans être détruit.', effects: { corpseCleanup: 18, wallDamage: .12 } }
    }
  };
  for (const crisis of CRISES) crisis.choices = CRISIS_CHOICES[crisis.id];
  const STRATEGY_RULES = { spawnBatch: 64, crisisDecisionSeconds: 45, pathMaxExpanded: 8192, pathQueriesPerUpdate: 6, pathRetrySeconds: 1.25 };
  const WORKER_RULES = { cleanupPerSecond: .9, cleanupRange: 48, retreatRadius: 90, passiveDecayPerSecond: .012 };
  const SURVIVORS = {
    worker: { id:'worker', name:'Ouvrier', description:'Récolte, transporte, construit et déblaye selon les ordres de la cité.', health:85, speed:60, radius:11, cost:{food:25}, tier:0, requires:null, specialist:false },
    soldier: { id:'soldier', name:'Fusilier', description:'Défend le point de ralliement et consomme des munitions à chaque tir.', health:125, speed:74, radius:12, cost:{food:15,ammo:20,scrap:10}, tier:1, requires:'barracks', specialist:false },
    medic: { id:'medic', name:'Secouriste', description:'Rejoint les blessés vivants et les soigne avec des médicaments ; aucune résurrection.', health:90, speed:66, radius:11, cost:{food:35,medicine:8}, tier:2, requires:'clinic', specialist:true },
    engineer: { id:'engineer', name:'Ingénieur', description:'Rejoint les structures endommagées et les répare en consommant les matériaux nécessaires.', health:105, speed:62, radius:11, cost:{food:35,scrap:35}, tier:2, requires:'workshop', specialist:true }
  };
  const NPC_RULES = { healPerSecond:6, healRange:64, medicinePerHealth:.025, repairPerSecond:14, repairRange:48, repairScrapPerHealth:1/45, repairWoodPerFullWall:12, repairStonePerFullWall:16, searchRadius:800, rethinkSeconds:.6, dangerRange:105, fleeSpeedMultiplier:1.25, rallyRadius:28 };

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
  function normalizeCrisis(value) {
    if (!value || !CRISES.some(crisis => crisis.id === value.id)) return null;
    // Old saves already applied an automatic penalty: do not ask/pay for it a second time.
    if (!['pending', 'resolved'].includes(value.status)) return null;
    if (value.status === 'resolved' && !['A', 'B'].includes(value.choice)) return null;
    return { id: value.id, wave: Math.max(1, Math.floor(Number(value.wave) || 1)), status: value.status,
      remaining: clamp(Number(value.remaining) || 0, 0, 120), targetId: Math.max(0, Math.floor(Number(value.targetId) || 0)),
      choice: ['A', 'B'].includes(value.choice) ? value.choice : null };
  }
  function normalizeSpawnCounts(value = {}, legacyQueue = []) {
    const counts = {};
    for (const kind of Object.keys(ENEMIES)) {
      const amount = Number(value?.[kind]);
      counts[kind] = Number.isFinite(amount) ? clamp(Math.floor(amount), 0, Number.MAX_SAFE_INTEGER / 8) : 0;
    }
    if (Array.isArray(legacyQueue)) for (const kind of legacyQueue) if (Object.hasOwn(counts, kind)) counts[kind]++;
    return counts;
  }
  function spawnCount(counts = {}) { return Object.keys(ENEMIES).reduce((total, kind) => total + (counts[kind] || 0), 0); }
  function takeSpawnKind(counts, roll) {
    const total = spawnCount(counts); if (!total) return null;
    let position = Math.min(total - 1, Math.floor(clamp(roll, 0, 1) * total));
    for (const kind of Object.keys(ENEMIES)) {
      if (position < counts[kind]) { counts[kind]--; return kind; }
      position -= counts[kind];
    }
    return null;
  }
  function productionFraction(stock, production, consumes, capacity, seconds) {
    if (!(seconds > 0)) return 0;
    let fraction = 1;
    for (const [key, rate] of Object.entries(production || {})) if (rate > 0) fraction = Math.min(fraction, Math.max(0, capacity - (stock[key] || 0)) / (rate * seconds));
    for (const [key, rate] of Object.entries(consumes || {})) if (rate > 0) fraction = Math.min(fraction, Math.max(0, stock[key] || 0) / (rate * seconds));
    return clamp(fraction, 0, 1);
  }
  function findFriendlyPath(start, goal, blocked, width = WORLD_TILES, height = WORLD_TILES, maxExpanded = STRATEGY_RULES.pathMaxExpanded) {
    const valid = point => point.x >= 0 && point.y >= 0 && point.x < width && point.y < height;
    if (!valid(start) || !valid(goal) || blocked(goal.x, goal.y)) return null;
    const key = point => point.y * width + point.x, origin = key(start), target = key(goal);
    if (origin === target) return [];
    const costs = new Int32Array(width * height); costs.fill(0x3fffffff); costs[origin] = 0;
    const previous = new Int32Array(width * height); previous.fill(-1);
    const open = new MinHeap(), distance = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);
    open.push(origin, distance(start.x, start.y));
    let expanded = 0;
    while (open.size && expanded < maxExpanded) {
      const current = open.pop(), x = current.index % width, y = Math.floor(current.index / width);
      if (current.priority !== costs[current.index] + distance(x, y)) continue;
      if (current.index === target) {
        const result = []; let cursor = target;
        while (cursor !== origin) { result.push({ x: cursor % width, y: Math.floor(cursor / width) }); cursor = previous[cursor]; }
        return result.reverse();
      }
      expanded++;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || blocked(nx, ny)) continue;
        const next = ny * width + nx, cost = costs[current.index] + 1;
        if (cost >= costs[next]) continue;
        costs[next] = cost; previous[next] = current.index; open.push(next, cost + distance(nx, ny));
      }
    }
    return null;
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
    const weights = Object.fromEntries(Object.entries(ENEMY_RULES.waveWeights).map(([kind, rule]) =>
      [kind, wave >= ENEMIES[kind].unlockWave ? Math.min(rule.maximum, rule.base + (wave - rule.origin) * rule.growth) : 0]));
    const composition = normalizeSpawnCounts();
    const specialTotal = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const specialScale = specialTotal > ENEMY_RULES.specialShare ? ENEMY_RULES.specialShare / specialTotal : 1;
    let assigned = 0;
    for (const kind of Object.keys(weights)) {
      const amount = Math.floor(total * weights[kind] * specialScale);
      composition[kind] = amount;
      assigned += amount;
    }
    composition.walker = total - assigned;
    return { wave, total, fronts: Math.min(4, 1 + Math.floor((wave - 1) / 3)), spawnInterval: clamp(0.52 - wave * 0.012, 0.07, 0.52), composition };
  }
  function createStats() { return { kills: 0, shots: 0, headshots: 0, gathered: 0, buildingsPlaced: 0, buildingsLost: 0, unitsLost: 0, wavesSurvived: 0, crisesResolved: 0, playSeconds: 0, peakPopulation: 0, peakBuildings: 0 }; }

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

  // Recoverable scenery, not structures or physical cover. Order matches districtProps (4 x 4).
  const SCENERY_DEFS = Object.freeze({
    ruinedHouse: Object.freeze({name:'Maison éventrée',resource:'stone',amount:45,radius:30,renderSize:116}),
    ruinedShop: Object.freeze({name:'Échoppe condamnée',resource:'scrap',amount:45,radius:28,renderSize:108}),
    warehouseShell: Object.freeze({name:'Hangar éventré',resource:'scrap',amount:55,radius:34,renderSize:128}),
    guardBooth: Object.freeze({name:'Poste de garde désert',resource:'wood',amount:35,radius:19,renderSize:72}),
    ambulance: Object.freeze({name:'Ambulance abandonnée',resource:'medicine',amount:4,radius:23,renderSize:98}),
    bus: Object.freeze({name:'Autobus immobilisé',resource:'scrap',amount:70,radius:32,renderSize:134}),
    utilityTruck: Object.freeze({name:'Camion de maintenance',resource:'scrap',amount:55,radius:27,renderSize:112}),
    tanker: Object.freeze({name:'Citerne abandonnée',resource:'fuel',amount:45,radius:30,renderSize:128}),
    tent: Object.freeze({name:'Tente de ravitaillement',resource:'food',amount:35,radius:23,renderSize:90}),
    container: Object.freeze({name:'Conteneur éventré',resource:'scrap',amount:55,radius:27,renderSize:110}),
    waterTank: Object.freeze({name:'Réservoir désaffecté',resource:'scrap',amount:40,radius:25,renderSize:94}),
    powerPylon: Object.freeze({name:'Pylône hors service',resource:'scrap',amount:45,radius:20,renderSize:104}),
    concreteBarricade: Object.freeze({name:'Bloc de barrage abandonné',resource:'stone',amount:45,radius:24,renderSize:98}),
    burntTree: Object.freeze({name:'Arbre calciné',resource:'wood',amount:35,radius:22,renderSize:96}),
    rubble: Object.freeze({name:'Tas de gravats',resource:'stone',amount:35,radius:27,renderSize:104}),
    streetLamp: Object.freeze({name:'Lampadaire hors service',resource:'scrap',amount:35,radius:16,renderSize:86})
  });

  const Core = {
    TILE, WORLD_TILES, WORLD_SIZE, SAVE_KEY, LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SETTINGS_KEY, SAVE_VERSION,
    RESOURCE_KEYS, RESOURCE_META, DIFFICULTIES, CITY_TIERS, BUILDINGS, ENEMIES, ENEMY_RULES, WEAPONS, OBJECTIVES,
    RESEARCH, CRISES, PERFORMANCE_LIMITS, STRATEGY_RULES, WORKER_RULES, SURVIVORS, NPC_RULES,
    SCENERY_DEFS,
    clamp, lerp, dist, distSq, grid, world, index, makeBag, bagTotal, canAfford, spend, add,
    scaledCost, resourceText, formatNumber, formatTime, seededHash, cityTier, buildingList,
    enemyHealthScale, wallLine, powerPriority, researchById, crisisForWave, normalizeResearch, migrateSaveData,
    normalizeCrisis, normalizeSpawnCounts, spawnCount, takeSpawnKind, productionFraction, findFriendlyPath,
    wavePlan, createStats, Random, MinHeap
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  global.DeadwallCore = Core;
})(typeof globalThis !== 'undefined' ? globalThis : this);
