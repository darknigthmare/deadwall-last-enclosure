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
  const RESEARCH_INSIGHT_MAX = 1e12;
  const BATTLEFIELD_RULES = Object.freeze({ innerRadius: 320, fragileWallRatio: .3, refreshSeconds: .5, alarmCooldownSeconds: 15 });
  const RESOURCE_KEYS = ['wood', 'scrap', 'stone', 'food', 'fuel', 'ammo', 'medicine'];
  const SQUAD_RULES = Object.freeze({
    count:3, labels:Object.freeze(['ALPHA','BRAVO','CHARLIE']),
    keys:Object.freeze(['Digit4','Digit5','Digit6']), retreatRadius:36,
    rallyRadius:22, formationScale:.35, range:345, advanceRange:285,
    fireCooldown:.24, damage:31, researchedDamage:35, projectileRange:520,
    meleeRange:28, meleeCooldown:.7, meleeDamage:18, pursuitSpeed:.8
  });

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
    house: B('house', 'Dortoir renforcé', 'colony', '⌂', 'Ajoute huit places de logement. Le repli des équipes doit être ordonné séparément.', { wood: 70, scrap: 20 }, 700, 18, [3, 2], 0, 4,
      { symbol: 'H', color: '#665845', roof: '#85755c', housing: 8, light: 70 }),
    warehouse: B('warehouse', 'Entrepôt', 'colony', '▤', 'Augmente le stockage et sert de point de dépôt aux équipes de collecte.', { wood: 55, scrap: 45 }, 900, 22, [3, 3], 0, 5,
      { symbol: 'ST', storage: 600, light: 55 }),
    barracks: B('barracks', 'Caserne', 'colony', '★', 'Permet de recruter des fusiliers et ajoute quatre logements. Leur ralliement reste à vos ordres.', { wood: 75, scrap: 70, ammo: 25 }, 1050, 30, [4, 3], 1, 9,
      { symbol: 'CA', color: '#485144', roof: '#687263', powerUse: 1, housing: 4, light: 80 }),
    clinic: B('clinic', 'Clinique', 'colony', '+', 'Soins de proximité sous alimentation électrique ; permet de recruter des secouristes. Aucun remède à la contamination.', { wood: 60, scrap: 55, medicine: 8 }, 850, 28, [3, 3], 2, 7,
      { symbol: '+', color: '#586965', roof: '#7c928b', powerUse: 2, light: 90 }),

    farm: B('farm', 'Ferme protégée', 'industry', '≋', 'Produit régulièrement de la nourriture. Sa grande surface doit être défendue.', { wood: 55, stone: 25 }, 540, 20, [4, 3], 0, 5,
      { symbol: 'F', color: '#4d5c3f', roof: '#657952', production: { food: 0.42 } }),
    generator: B('generator', 'Générateur', 'industry', '⚡', 'Fournit de l’énergie aux ateliers, projecteurs et tourelles.', { scrap: 55, fuel: 20 }, 650, 18, [2, 2], 1, 5,
      { symbol: 'G', color: '#6c5e3f', roof: '#8c784b', powerGen: 24, generatorFuel: .018, light: 100, explosive: 70 }),
    lumber: B('lumber', 'Scierie', 'industry', '╫', 'Produit du bois sous alimentation électrique, indépendamment des gisements récoltés à la main.', { wood: 45, scrap: 35 }, 750, 22, [3, 3], 1, 6,
      { symbol: 'B', color: '#674f3b', roof: '#84664c', powerUse: 1, production: { wood: 0.48 } }),
    scrapyard: B('scrapyard', 'Centre de recyclage', 'industry', '⚙', 'Trie les carcasses et produit de la ferraille utilisable.', { wood: 35, scrap: 50 }, 780, 24, [3, 3], 1, 6,
      { symbol: 'R', color: '#505957', roof: '#6f7875', powerUse: 2, production: { scrap: 0.36 } }),
    quarry: B('quarry', 'Concasseur', 'industry', '▲', 'Produit pierre et agrégats pour les remparts lourds.', { wood: 45, scrap: 55, stone: 20 }, 850, 27, [3, 3], 2, 7,
      { symbol: 'Q', color: '#5d5b55', roof: '#7d7970', powerUse: 3, production: { stone: 0.34 } }),
    refinery: B('refinery', 'Micro-raffinerie', 'industry', '◉', 'Produit du carburant sous alimentation électrique. Explose lors de sa destruction.', { scrap: 90, stone: 40, fuel: 25 }, 700, 34, [3, 3], 2, 9,
      { symbol: 'RF', color: '#655c45', roof: '#887a56', powerUse: 4, production: { fuel: 0.18 }, explosive: 110 }),
    workshop: B('workshop', 'Atelier militaire', 'industry', '⚒', 'Permet de recruter des ingénieurs et de construire les tourelles du palier atteint.', { wood: 55, scrap: 100, stone: 25 }, 1000, 35, [4, 3], 2, 10,
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
      description: 'Infecté massif au manteau rouge-brun. Sa dépouille ajoute 3,4 unités de pression aux remparts proches. Aucune explosion.', weakness: 'Le plus lent du groupe : l’abattre loin des murs ou affecter des ouvriers au déblaiement.' },
    shielded: { id: 'shielded', name: 'Porte-bouclier', health: 90, speed: 29, damage: 15, attackRate: .7, radius: 12, color: '#49545a', unlockWave: 9, structureDamage: 1, corpseLoad: 1,
      description: 'Ancien agent tenant encore un bouclier antiémeute. Les balles dans son arc frontal de 110° infligent 35 % de leurs dégâts ; sa santé reste modeste.', weakness: 'Le contourner : tirs de côté ou dans le dos, coups au corps-à-corps et hérissons infligent leurs dégâts ordinaires.' },
    charger: { id: 'charger', name: 'Fonceur', health: 64, speed: 42, damage: 13, attackRate: .9, radius: 10, color: '#82614b', unlockWave: 11, structureDamage: 1, corpseLoad: 1,
      description: 'Infecté récent en tenue de sport. Se prépare 0,65 seconde, fonce droit pendant 0,7 seconde puis récupère 3 secondes. Aucun dégât supplémentaire au contact.', weakness: 'Esquiver sa ligne après la préparation, profiter de sa fatigue ; un obstacle ou une entrave interrompt la ruée.' }
  };

  const START_SCENARIO_STORY_BONUS = Object.freeze({ wood: 50, scrap: 35, food: 50, ammo: 50 });
  const START_SCENARIOS = Object.freeze(Object.fromEntries([
    {
      id: 'classic', name: 'Départ classique', description: 'Trois ouvriers et un dépôt intact : le point de départ historique de D-17.',
      advantage: 'Réserves équilibrées ; conseillé pour découvrir la cité.', tradeoff: 'Aucune défense préinstallée : récolter, construire et tenir la première ligne.',
      resources: { wood: 180, scrap: 120, stone: 70, food: 130, fuel: 45, ammo: 180, medicine: 12 },
      roster: ['worker', 'worker', 'worker'], coreHealthRatio: 1, calmSeconds: 82
    },
    {
      id: 'convoy', name: 'Convoi de civils', description: 'Deux récupérateurs supplémentaires ont rejoint le dépôt avec le dernier convoi.',
      advantage: 'Cinq ouvriers pour récolter et monter les premiers chantiers.', tradeoff: 'Tous les logements sont occupés ; nourriture, carburant et médicaments réduits.',
      resources: { wood: 180, scrap: 120, stone: 70, food: 80, fuel: 25, ammo: 180, medicine: 8 },
      roster: ['worker', 'worker', 'worker', 'worker', 'worker'], coreHealthRatio: 1, calmSeconds: 82
    },
    {
      id: 'reconstruction', name: 'Dépôt à reconstruire', description: 'Le dépôt a tenu le choc, mais son intégrité doit être restaurée avant que la ligne cède.',
      advantage: 'Davantage de matériaux et trente secondes de préparation supplémentaires avant les multiplicateurs de difficulté.',
      tradeoff: 'Centre à 60 % de son intégrité ; moins de carburant et de munitions. La réparation consomme la ferraille.',
      resources: { wood: 225, scrap: 150, stone: 90, food: 130, fuel: 30, ammo: 120, medicine: 12 },
      roster: ['worker', 'worker', 'worker'], coreHealthRatio: .6, calmSeconds: 112
    },
    {
      id: 'rearguard', name: 'Arrière-garde', description: 'Un fusilier couvre deux ouvriers ; les premiers contacts approchent déjà du dépôt.',
      advantage: 'Un soldat et davantage de munitions dès l’arrivée ; aucun recrutement avancé n’est débloqué.',
      tradeoff: 'Un ouvrier de moins, moins de bois, de ferraille et de nourriture ; préparation initiale raccourcie.',
      resources: { wood: 130, scrap: 110, stone: 70, food: 115, fuel: 45, ammo: 220, medicine: 12 },
      roster: ['worker', 'worker', 'soldier'], coreHealthRatio: 1, calmSeconds: 64
    }
  ].map(scenario => [scenario.id, Object.freeze({ ...scenario, resources: Object.freeze(scenario.resources), roster: Object.freeze(scenario.roster) })])));

  const ENEMY_RULES = Object.freeze({
    specialShare: 0.82, sanitizedCorpseLoad: 0.65, structureReach: 18, moveStep: 5,
    stalkRange: 210, stalkIsolation: 90, stalkThinkSeconds: 0.5, stalkQueriesPerUpdate: 8,
    shield: Object.freeze({ halfAngle: Math.PI * 55 / 180, damageMultiplier: .35 }),
    charge: Object.freeze({ windupSeconds: .65, rushSeconds: .7, recoverySeconds: 3, rushSpeed: 2.2, recoverySpeed: .55, probeDistance: 24, moveStep: 5 }),
    waveWeights: {
      runner: { base: 0.08, growth: 0.018, maximum: 0.42, origin: 0 },
      armored: { base: 0.035, growth: 0.012, maximum: 0.28, origin: 0 },
      crawler: { base: 0.025, growth: 0.009, maximum: 0.22, origin: 0 },
      howler: { base: 0.012, growth: 0.0045, maximum: 0.13, origin: 0 },
      breacher: { base: 0.04, growth: 0.003, maximum: 0.10, origin: 3 },
      stalker: { base: 0.035, growth: 0.004, maximum: 0.09, origin: 6 },
      bloated: { base: 0.03, growth: 0.003, maximum: 0.07, origin: 8 },
      shielded: { base: .02, growth: .001, maximum: .045, origin: 9 },
      charger: { base: .025, growth: .0015, maximum: .05, origin: 11 }
    }
  });

  const WEAPONS = {
    pistol: { id: 'pistol', name: 'PISTOLET', damage: 42, headshotChance: .13, headshotMultiplier: 1.75, fireRate: 3.2, magazine: 12, reload: 1.35, spread: 0.035, pellets: 1, ammoPerReload: 1, range: 650, tier: 0 },
    rifle: { id: 'rifle', name: 'FUSIL D’ASSAUT', damage: 34, headshotChance: .13, headshotMultiplier: 1.75, fireRate: 8.2, magazine: 30, reload: 1.8, spread: 0.055, pellets: 1, ammoPerReload: 1, range: 760, tier: 1 },
    shotgun: { id: 'shotgun', name: 'FUSIL À POMPE', damage: 18, headshotChance: .065, headshotMultiplier: 1.75, fireRate: 1.05, magazine: 8, reload: 2.25, spread: 0.21, pellets: 8, ammoPerReload: 2, range: 420, tier: 2 }
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
    { id: 'injury', title: 'Blessés aux portes', minWave: 3, severity: 1, text: 'Un survivant blessé et épuisé demande refuge. Son état impose un choix d’accueil ; les médicaments ne sont pas un remède à la contamination.', choiceA: 'Soigner ses blessures et l’accueillir.', choiceB: 'Différer son accueil, au prix du moral.' },
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
      B: { label: 'Différer l’accueil', cost: {}, description: 'Aucun recrutement ; préserve les réserves, moral −5.', effects: { morale: -5 } }
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
  const NARRATIVE_RULES = Object.freeze({surveySeconds:8,surveyRadius:90,debriefRadius:180,maxStep:.25});
  // Six optional, one-use decisions. No resource spawns or permanent combat modifiers.
  const NARRATIVE_OPERATIONS = Object.freeze({
    housing:{A:{cost:{wood:12,scrap:12},insight:1},B:{cost:{food:8},morale:4}},
    market:{A:{cost:{scrap:16,food:8},insight:1},B:{cost:{food:8},morale:4}},
    aid:{A:{cost:{scrap:12,medicine:2},insight:1},B:{cost:{food:8},morale:4}},
    industry:{A:{cost:{scrap:18,fuel:6},insight:1},B:{cost:{food:8},morale:4}},
    transit:{A:{cost:{scrap:16,fuel:6},insight:1},B:{cost:{food:8},morale:4}},
    checkpoint:{A:{cost:{wood:12,scrap:14},insight:1},B:{cost:{food:8},morale:4}}
  });
  const STRATEGY_RULES = { spawnBatch: 64, crisisDecisionSeconds: 45, pathMaxExpanded: 8192, pathQueriesPerUpdate: 6, pathRetrySeconds: 1.25 };
  const LINECARE_RULES = Object.freeze({ maxStep:.25, shovelPerSecond:1.2, workRange:48, dangerRadius:110, maxBatch:32, pageSize:10, refreshMs:500, rampMin:15, rampMax:32 });
  const WORKER_RULES = { carryCapacity:10, cleanupPerSecond: .9, cleanupRange: 48, retreatRadius: 90, passiveDecayPerSecond: .012 };
  const SURVIVORS = {
    worker: { id:'worker', name:'Ouvrier', description:'Récolte, transporte, construit et déblaye selon les ordres de la cité.', health:85, speed:60, radius:11, cost:{food:25}, tier:0, requires:null, specialist:false },
    soldier: { id:'soldier', name:'Fusilier', description:'Défend le point de ralliement et consomme des munitions à chaque tir.', health:125, speed:74, radius:12, cost:{food:15,ammo:20,scrap:10}, tier:1, requires:'barracks', specialist:false },
    medic: { id:'medic', name:'Secouriste', description:'Rejoint les blessés vivants et les soigne avec des médicaments ; aucune résurrection.', health:90, speed:66, radius:11, cost:{food:35,medicine:8}, tier:2, requires:'clinic', specialist:true },
    engineer: { id:'engineer', name:'Ingénieur', description:'Rejoint les structures endommagées et les répare en consommant les matériaux nécessaires.', health:105, speed:62, radius:11, cost:{food:35,scrap:35}, tier:2, requires:'workshop', specialist:true }
  };
  const NPC_RULES = { healPerSecond:6, healRange:64, medicinePerHealth:.025, repairPerSecond:14, repairRange:48, repairScrapPerHealth:1/45, repairWoodPerFullWall:12, repairStonePerFullWall:16, searchRadius:800, rethinkSeconds:.6, dangerRange:105, fleeSpeedMultiplier:1.25, rallyRadius:28 };

  const PERFORMANCE_LIMITS = { zombies: 720, corpses: 900, particles: 950, lights: 85 };
  const SIMULATION_RULES = Object.freeze({ maxStepSeconds: .04, maxFrameSeconds: .25, maxSteps: 7 });
  const MAINTENANCE_RULES = Object.freeze({ repairHealthPerScrap:45, repairWoodPerWall:12, repairStonePerWall:16, upgradeFactor:.72, salvageFactor:.4, emergencyHealthPerScrap:85, emergencyHealthPerWood:180, emergencyHealthPerStone:220 });

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
    // canAfford tolerates floating-point dust, never leave an unsavable negative residue.
    for (const key of RESOURCE_KEYS) stock[key] = Math.max(0, (stock[key] || 0) - (cost[key] || 0) * multiplier);
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

  const RECON_RULES = Object.freeze({maxStops:4,refreshMs:500,routeInterval:1,sampleStep:8,routeQueries:4,maxExpanded:8192});
  const Core = { RECON_RULES,
    TILE, WORLD_TILES, WORLD_SIZE, SAVE_KEY, LEGACY_SAVE_KEYS, SAVE_BACKUP_KEY, SETTINGS_KEY, SAVE_VERSION,
    RESOURCE_KEYS, RESOURCE_META, DIFFICULTIES, START_SCENARIOS, START_SCENARIO_STORY_BONUS, CITY_TIERS, BUILDINGS, ENEMIES, ENEMY_RULES, WEAPONS, OBJECTIVES,
    RESEARCH, RESEARCH_INSIGHT_MAX, CRISES, PERFORMANCE_LIMITS, SIMULATION_RULES, STRATEGY_RULES, WORKER_RULES, LINECARE_RULES, SURVIVORS, NPC_RULES, NARRATIVE_RULES, NARRATIVE_OPERATIONS,
    SCENERY_DEFS, SQUAD_RULES, BATTLEFIELD_RULES, MAINTENANCE_RULES,
    clamp, lerp, dist, distSq, grid, world, index, makeBag, bagTotal, canAfford, spend, add,
    scaledCost, resourceText, formatNumber, formatTime, seededHash, cityTier, buildingList,
    enemyHealthScale, wallLine, powerPriority, researchById, crisisForWave, normalizeResearch, migrateSaveData,
    normalizeCrisis, normalizeSpawnCounts, spawnCount, takeSpawnKind, productionFraction, findFriendlyPath,
    wavePlan, createStats, Random, MinHeap
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  global.DeadwallCore = Core;
})(typeof globalThis !== 'undefined' ? globalThis : this);


/* DEADWALL OPERATIONS 1.1 — BEGIN */
/* DEADWALL — Sorties de ravitaillement. Original extension, 2026-09-22.
 * Pure campaign logic. This module is appended to core.js by the installer.
 * It never advances the game, grants rewards on load, or uses the campaign RNG.
 */
(function initFieldOperations(root) {
  'use strict';
  const KEYS = Object.freeze(['wood','scrap','stone','food','fuel','ammo','medicine']);
  const RULES = Object.freeze({ version:1, saveVersion:3, radius:80, safeRadius:150, baseRadius:180, maxStep:.25, maxHistory:12, maxFailures:100000, epsilon:1e-6 });
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const contract = (id, theme, name, briefing, tier, wave, seconds, timeLimit, cost, cargo, insight, morale, prerequisite=null, requires=null, unlock=null) =>
    ({id,theme,name,briefing,tier,wave,seconds,timeLimit,cost,cargo,insight,morale,prerequisite,requires,unlock});
  const CONTRACTS = freeze([
    contract('housing-cache','housing','La remise des maisons',
      'Des réserves sont encore fermées dans une remise. Rejoignez le quartier, écartez les infectés proches et préparez le chargement. Le registre des habitants reste une enquête séparée.',
      0,1,12,210,{food:8,ammo:4},{wood:20,food:8},1,2),
    contract('housing-register','housing','Les noms sur les boîtes',
      'Les effets personnels retrouvés donnent un sens aux numéros du dépôt. Récupérez les boîtes identifiées et rapportez-les avec leurs vivres. Rien ne permet d’affirmer que leurs propriétaires sont encore vivants.',
      1,3,22,255,{food:12,scrap:16},{food:18,medicine:6},2,6,'housing-cache'),
    contract('market-cache','market','Le rideau de fer',
      'Une arrière-boutique contient un lot de conserves. La manutention demande une zone calme. Les denrées n’entreront dans les réserves qu’après leur retour au commandement.',
      0,1,14,215,{food:8,ammo:4},{food:28},1,2),
    contract('market-kitchen','market','Le four communal',
      'Relevez le montage d’une cuisine collective et récupérez les pièces utilisables. Une ferme doit déjà nourrir la colonie : la cuisine développera cette chaîne, elle ne la remplacera pas.',
      1,3,24,280,{food:12,scrap:20,fuel:8},{food:12,scrap:12},1,3,'market-cache','farm','fieldKitchen'),
    contract('aid-cache','aid','Les armoires scellées',
      'Des trousses intactes subsistent au camp des veilleurs. Ne travaillez pas avec des infectés au contact. Le lot est encombrant et doit être ramené personnellement.',
      0,1,12,210,{food:8,ammo:6},{medicine:8,food:12},1,2),
    contract('aid-sterile','aid','Le protocole de stérilisation',
      'Récupérez le matériel et les fiches de préparation du camp. La clinique utilisera ce relevé pour ouvrir un atelier de pansements ; il ne produit aucun remède à l’infection.',
      2,4,26,300,{food:12,scrap:30,medicine:4},{medicine:8,food:8},2,4,'aid-cache','clinic','dressingWorkshop'),
    contract('industry-fuel','industry','Les fûts consignés',
      'Repérez les fûts encore étanches de la cour des citernes. Préparez uniquement ce que le sac peut emporter. La réserve de carburant de la cité ne bougera pas pendant le trajet aller.',
      1,2,16,240,{food:10,ammo:6},{fuel:24,scrap:6},1,1),
    contract('industry-bench','industry','Le banc de récupération',
      'Le plan du banc de tri permettrait de mieux récupérer les petites pièces. Un atelier militaire terminé est nécessaire pour adapter ses outils à la colonie.',
      2,5,28,320,{food:14,scrap:35,fuel:8},{scrap:24},2,3,'industry-fuel','workshop','recoveryBench'),
    contract('transit-manifest','transit','Le manifeste du terminus',
      'Le manifeste indique où les derniers manutentionnaires ont regroupé des pièces et des cartouches. Rejoignez le terminus et faites l’inventaire sur place.',
      1,2,18,245,{food:10,ammo:8},{scrap:16,ammo:12},1,2),
    contract('transit-reserve','transit','La réserve du dernier autobus',
      'Un compartiment d’entretien contient encore des rations et des trousses. Les récupérer n’ajoute aucun survivant à la colonie : ce sont les réserves d’un départ qui n’a pas eu lieu.',
      2,5,25,300,{food:12,scrap:20,ammo:10},{food:20,medicine:8},2,5,'transit-manifest'),
    contract('checkpoint-ammo','checkpoint','Les caisses de la relève',
      'Des caisses ont été abandonnées au barrage. Préparez un lot transportable et gardez une issue vers l’enceinte. Les armes de la colonie ne pourront l’utiliser qu’après livraison.',
      1,2,17,245,{food:10,ammo:8},{ammo:30},1,1),
    contract('checkpoint-optics','checkpoint','Les optiques du barrage',
      'Relevez les raccordements des projecteurs du barrage et récupérez leurs composants. Un générateur achevé est requis ; les futurs projecteurs consommeront réellement de l’électricité.',
      2,4,24,295,{food:12,scrap:25,fuel:6},{ammo:14,scrap:12},2,3,'checkpoint-ammo','generator','perimeterLight')
  ]);
  const BY_ID = Object.freeze(Object.fromEntries(CONTRACTS.map(item=>[item.id,item])));
  const building = (id,name,category,icon,description,cost,health,buildTime,size,unlockTier,score,extra) =>
    ({id,name,category,icon,description,cost,health,buildTime,size,unlockTier,score,color:'#53615a',roof:'#809086',...extra});
  const BUILDINGS = freeze({
    fieldKitchen: building('fieldKitchen','Cuisine collective','industry','♨',
      'Prépare les rations de la cité. Nécessite une ferme, de l’électricité et du carburant ; s’arrête si la nourriture est stockée au plafond.',
      {wood:65,scrap:70,stone:20},720,26,[3,2],1,6,
      {symbol:'CU',color:'#625544',roof:'#998369',powerUse:2,requires:'farm',production:{food:.58},consumes:{fuel:.025},light:65}),
    dressingWorkshop: building('dressingWorkshop','Atelier de pansements','industry','+',
      'Prépare des fournitures de soin. Nécessite une clinique, de la nourriture, de la ferraille et de l’électricité. Aucun remède à l’infection.',
      {wood:55,scrap:90,medicine:6},780,32,[3,3],2,8,
      {symbol:'SO',color:'#4c6763',roof:'#809d95',powerUse:3,requires:'clinic',production:{medicine:.045},consumes:{food:.08,scrap:.025},light:80}),
    recoveryBench: building('recoveryBench','Banc de récupération','industry','⚙',
      'Trie et remet en état les pièces de récupération. Nécessite un atelier militaire, du carburant et de l’électricité.',
      {wood:45,scrap:85,stone:30,fuel:10},850,30,[3,3],2,8,
      {symbol:'BR',color:'#555e5d',roof:'#879490',powerUse:3,requires:'workshop',production:{scrap:.56},consumes:{fuel:.04},light:65}),
    perimeterLight: building('perimeterLight','Projecteur de périmètre','defense','◌',
      'Éclaire un secteur de nuit quand il est alimenté. Consomme une unité d’énergie prioritaire ; ne tire pas et ne révèle pas une nouvelle carte.',
      {scrap:35,fuel:6},360,12,[1,1],2,2,
      {symbol:'PJ',color:'#5f6459',roof:'#b4ac88',powerUse:1,defense:true,requires:'generator',light:230})
  });
  const BLUEPRINTS = Object.freeze(Object.fromEntries(CONTRACTS.filter(item=>item.unlock).map(item=>[item.unlock,item.id])));
  const sum = bag => KEYS.reduce((total,key)=>total+(bag[key]||0),0);
  const clone = value => JSON.parse(JSON.stringify(value));
  const finite = (value,min=0,max=1e12) => typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
  const obj = value => value!==null&&typeof value==='object'&&!Array.isArray(value);
  const reject = label => { throw new Error('Opérations D-17 invalides : '+label+'.'); };
  const get = id => typeof id==='string'&&Object.hasOwn(BY_ID,id)?BY_ID[id]:null;
  function create() { return {version:RULES.version,completed:[],failures:{},active:null,last:null}; }
  function normalize(raw) {
    if (raw === undefined) return create();
    if(!obj(raw)||raw.version!==RULES.version||!Array.isArray(raw.completed)||raw.completed.length>CONTRACTS.length)reject('format');
    const completed=raw.completed.slice();
    if(completed.some(id=>!get(id))||new Set(completed).size!==completed.length)reject('contrats terminés');
    for(const id of completed)if(get(id).prerequisite&&!completed.includes(get(id).prerequisite))reject('enchaînement des contrats');
    const failures={};
    if(!obj(raw.failures)||Object.keys(raw.failures).length>CONTRACTS.length)reject('échecs');
    for(const [id,count]of Object.entries(raw.failures)){
      if(!get(id)||!Number.isInteger(count)||!finite(count,0,RULES.maxFailures))reject('compteur d’échecs');
      if(count)failures[id]=count;
    }
    let active=null;
    if(raw.active!==null){
      const item=get(raw.active?.id),a=raw.active;
      if(!item||!obj(a)||completed.includes(item.id)||!['outbound','working','returning'].includes(a.phase))reject('sortie active');
      if(item.prerequisite&&!completed.includes(item.prerequisite))reject('prérequis de sortie');
      if(!finite(a.work,0,item.seconds)||!finite(a.remaining,0,item.timeLimit)||a.remaining===0)reject('chronomètre');
      if((a.phase==='outbound'&&a.work!==0)||(a.phase==='working'&&a.work>=item.seconds)||(a.phase==='returning'&&a.work!==item.seconds))reject('progression incohérente');
      active={id:item.id,phase:a.phase,work:a.work,remaining:a.remaining};
    }
    let last=null;
    if(raw.last!==null){
      if(!obj(raw.last)||!get(raw.last.id)||!['delivered','abandoned','timeout','downed'].includes(raw.last.result))reject('dernier bilan');
      if(raw.last.result==='delivered'&&!completed.includes(raw.last.id))reject('livraison non consignée');
      if(raw.last.result!=='delivered'&&!(failures[raw.last.id]>0))reject('échec non consigné');
      last={id:raw.last.id,result:raw.last.result};
    }
    return {version:RULES.version,completed,failures,active,last};
  }
  function safeResources(ctx){return obj(ctx.resources)&&KEYS.every(key=>finite(ctx.resources[key],0,1e12));}
  const answer = (ok,reason='',extra={})=>({ok,reason,...extra});
  class Engine {
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    current(){return get(this.state.active?.id);}
    cargoMass(){const item=this.current();return item&&this.state.active.phase==='returning'?sum(item.cargo):0;}
    canBuild(id){return !Object.hasOwn(BLUEPRINTS,id)||this.state.completed.includes(BLUEPRINTS[id]);}
    availability(id,ctx){
      const item=get(id);
      if(!item)return answer(false,'Contrat inconnu.');
      if(this.state.completed.includes(id))return answer(false,'Livraison déjà terminée.');
      if(this.state.active)return answer(false,this.state.active.id===id?'Sortie en cours.':'Terminez ou abandonnez la sortie active.');
      if(!ctx.canCommand||ctx.dead)return answer(false,'Le commandant doit être disponible dans une campagne active.');
      if(!ctx.atBase)return answer(false,'Préparez la sortie près du centre, par un accès ouvert.');
      if(item.prerequisite&&!this.state.completed.includes(item.prerequisite))return answer(false,'Terminez « '+get(item.prerequisite).name+' ».');
      if(!finite(ctx.tier)||ctx.tier<item.tier)return answer(false,'Palier '+item.tier+' requis.');
      if(!finite(ctx.wave)||ctx.wave<item.wave)return answer(false,'Disponible à partir de la vague '+item.wave+'.');
      if(!ctx.siteAvailable)return answer(false,'Site introuvable sur cette carte.');
      if(item.requires&&!ctx.hasBuilding(item.requires))return answer(false,'Bâtiment terminé requis : '+item.requires+'.');
      if(!safeResources(ctx)||KEYS.some(key=>ctx.resources[key]+RULES.epsilon<(item.cost[key]||0)))return answer(false,'Réserves de préparation insuffisantes.');
      return answer(true,'Le matériel sera débité au départ. Aucun remboursement en cas d’échec.');
    }
    start(id,ctx){
      const status=this.availability(id,ctx);if(!status.ok)return status;
      const item=get(id);
      for(const key of KEYS)ctx.resources[key]=Math.max(0,ctx.resources[key]-(item.cost[key]||0));
      this.state.active={id,phase:'outbound',work:0,remaining:item.timeLimit};
      return answer(true,'Sortie engagée : '+item.name+'.',{event:'started',id});
    }
    fail(reason){
      const active=this.state.active;if(!active)return answer(false,'Aucune sortie active.');
      if(!['abandoned','timeout','downed'].includes(reason))return answer(false,'Motif inconnu.');
      const id=active.id;this.state.failures[id]=Math.min(RULES.maxFailures,(this.state.failures[id]||0)+1);
      this.state.active=null;this.state.last={id,result:reason};
      return answer(true,reason==='timeout'?'Fenêtre de retour dépassée. La sortie est perdue.':reason==='downed'?'Commandant à terre : le matériel de sortie est perdu.':'Sortie abandonnée. Le matériel engagé est perdu.',{event:'failed',id});
    }
    abort(id,ctx){
      if(!ctx.canCommand||id!==this.state.active?.id)return answer(false,'Cette sortie n’est plus active.');
      return this.fail('abandoned');
    }
    tick(dt,ctx){
      if(!this.state.active||!ctx.running||!finite(dt,Number.MIN_VALUE,.25))return null;
      if(ctx.dead)return this.fail('downed');
      this.state.active.remaining=Math.max(0,this.state.active.remaining-dt);
      if(this.state.active.remaining<=RULES.epsilon)return this.fail('timeout');
      return null;
    }
    workStatus(ctx){
      const item=this.current(),a=this.state.active;
      if(!item||a.phase==='returning')return answer(false,'Aucun lot à préparer ici.');
      if(!ctx.running||ctx.dead)return answer(false,'Reprenez le contrôle du commandant.');
      if(!ctx.atSite||!ctx.accessible)return answer(false,'Rejoignez le marqueur par un passage libre.');
      if(!ctx.secure)return answer(false,'Infectés proches : sécurisez un rayon de '+RULES.safeRadius+' unités.');
      if(!finite(ctx.capacity)||!finite(ctx.normalCarry)||ctx.normalCarry+sum(item.cargo)>ctx.capacity+RULES.epsilon)return answer(false,'Sac trop plein : '+sum(item.cargo)+' places libres sont nécessaires.');
      if(item.requires&&!ctx.hasBuilding(item.requires))return answer(false,'Le bâtiment de soutien requis a été perdu. Reconstruisez-le.');
      return answer(true,'Maintenez ACTION / E pour préparer le lot.');
    }
    work(dt,ctx){
      const status=this.workStatus(ctx);if(!status.ok)return status;
      if(!ctx.action||!finite(dt,Number.MIN_VALUE,.25))return answer(false,status.reason);
      const item=this.current(),active=this.state.active;
      active.phase='working';active.work=Math.min(item.seconds,active.work+dt);
      if(active.work+RULES.epsilon>=item.seconds){active.work=item.seconds;active.phase='returning';return answer(true,'Lot chargé. Retournez au centre de commandement.',{event:'loaded',id:item.id});}
      return answer(true,status.reason);
    }
    deliveryStatus(ctx){
      const item=this.current();
      if(!item||this.state.active.phase!=='returning')return answer(false,'Aucune cargaison de sortie à livrer.');
      if(!ctx.running||ctx.dead||!ctx.atBase)return answer(false,'Rapportez le lot près du centre, par un passage ouvert.');
      if(!safeResources(ctx)||!finite(ctx.storage,1,1e12))return answer(false,'Stocks indisponibles.');
      const missing=KEYS.filter(key=>(item.cargo[key]||0)>Math.max(0,ctx.storage-ctx.resources[key])+RULES.epsilon);
      if(missing.length)return answer(false,'Dépôt plein : libérez de la place avant la livraison.',{missing});
      if(!finite(ctx.insight,0,ctx.insightMax)||ctx.insight+item.insight>ctx.insightMax)return answer(false,'Dépensez des points d’analyse avant la livraison.');
      if(!finite(ctx.morale,0,100))return answer(false,'État de la colonie invalide.');
      return answer(true,'Maintenez ACTION / E pour remettre la cargaison et le relevé.');
    }
    deliver(ctx){
      const status=this.deliveryStatus(ctx);if(!status.ok)return status;
      const item=this.current();
      // Single synchronous commit: no partial payment, reward queue or duplicated return.
      for(const key of KEYS)ctx.resources[key]+=(item.cargo[key]||0);
      ctx.insight+=item.insight;ctx.morale=Math.min(100,ctx.morale+item.morale);
      this.state.completed.push(item.id);this.state.last={id:item.id,result:'delivered'};this.state.active=null;
      return answer(true,'Livraison consignée : '+item.name+'.',{event:'delivered',id:item.id,unlock:item.unlock,insight:ctx.insight,morale:ctx.morale});
    }
  }
  function logistics(ctx){
    const production=Object.fromEntries(KEYS.map(k=>[k,0])),consumption={...production};
    consumption.food=Math.max(0,ctx.population||0)*.0065*60;
    if(Number.isFinite(ctx.siegeFuelUse)&&ctx.siegeFuelUse>0)consumption.fuel+=ctx.siegeFuelUse;
    let unpowered=0,pausedIndustry=0,generatorUse=0;
    for(const b of ctx.buildings||[]){
      if(b.dead||!b.completed||!b.def)continue;
      if((b.territoryOffline||b.siegeOffline||b.dayOffline)&&b.def.production){pausedIndustry++;continue;}
      if(b.type==='generator'&&!b.siegeOffline&&ctx.resources.fuel>0){const use=(ctx.hasResearch('grid')?.0135:.018)*60;consumption.fuel+=use;generatorUse+=use;}
      if(b.def.powerUse&&!b.powered)unpowered++;
      if(!b.def.production)continue;
      const power=b.def.powerUse?(b.powered?1:(b.powerShare||0)*(ctx.hasResearch('grid')?.7:.35)):1;
      const crisis=b.def.powerUse&&ctx.activeCrisis?.id==='blackout'&&ctx.activeCrisis.status==='resolved'&&ctx.activeCrisis.choice==='B'?.5:1;
      let fraction=1;
      for(const [key,rate]of Object.entries(b.def.production))if(rate>0)fraction=Math.min(fraction,Math.max(0,ctx.storage-ctx.resources[key])/(rate*.25*Math.max(.0001,power)*crisis));
      for(const [key,rate]of Object.entries(b.def.consumes||{}))if(rate>0)fraction=Math.min(fraction,ctx.resources[key]/(rate*.25*Math.max(.0001,power)*crisis));
      if(power<=.05||fraction<=0){pausedIndustry++;continue;}
      const factor=Math.min(1,fraction)*power*crisis*60;
      for(const [key,rate]of Object.entries(b.def.production))production[key]+=rate*factor;
      for(const [key,rate]of Object.entries(b.def.consumes||{}))consumption[key]+=rate*factor;
    }
    return {rows:KEYS.map(key=>({key,stock:ctx.resources[key],capacity:ctx.storage,production:production[key],consumption:consumption[key],net:production[key]-consumption[key]})),unpowered,pausedIndustry,generatorUse};
  }
  function installCatalogue(C){
    if(!C||!C.BUILDINGS||C.FieldOperations)return;
    for(const [id,def]of Object.entries(BUILDINGS)){
      if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Identifiant de bâtiment déjà utilisé : '+id);
      C.BUILDINGS[id]=def;
    }
    const migrate=C.migrateSaveData;
    C.migrateSaveData=function(input){
      if(!obj(input))return null;
      if(input.version===RULES.saveVersion){
        if(input.fieldOps===undefined)reject('registre v3 absent');
        const fieldOps=normalize(input.fieldOps);
        // Reuse the original v2 research normalization, then preserve the new registry.
        const base=migrate({...input,version:2});
        return base?{...base,version:RULES.saveVersion,fieldOps}:null;
      }
      if(input.version!==1&&input.version!==2)return null;
      const prior=migrate(input);return prior?{...prior,version:RULES.saveVersion,fieldOps:create()}:null;
    };
    C.SAVE_VERSION=RULES.saveVersion;C.SAVE_KEY='deadwall-save-v3';C.SAVE_BACKUP_KEY='deadwall-save-backup-v3';
    C.LEGACY_SAVE_KEYS=['deadwall-save-v2','deadwall-save-backup-v2',...C.LEGACY_SAVE_KEYS];
    C.FieldOperations=API;
  }
  const API=Object.freeze({KEYS,RULES,CONTRACTS,BY_ID,BUILDINGS,BLUEPRINTS,get,create,normalize,Engine,logistics,installCatalogue,sum});
  if(typeof module!=='undefined'&&module.exports){
    if(module.exports.BUILDINGS)module.exports.FieldOperations=undefined;
    else module.exports=API;
  }
  root.DeadwallOperations=API;
  if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL OPERATIONS 1.1 — END */


/* DEADWALL TERRITORIES 1.2 — BEGIN */
/* DEADWALL 1.2 — local district economy, occupation and real cargo accounting. */
(function initTerritories(root){
  'use strict';
  const KEYS=Object.freeze(['wood','scrap','stone','food','fuel','ammo','medicine']);
  const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
  const RULES=freeze({version:1,saveVersion:4,radius:220,buildRadius:180,interactionRadius:100,
    hostileRadius:190,innerRadius:85,claimSeconds:14,reclaimSeconds:22,claimFood:6,supplyPack:12,
    supplyCapacity:36,supplyPerSecond:.025,stockCapacity:120,workerRadius:100,
    occupationSeconds:24,pressureRecovery:1.5,convoyCost:{food:12,fuel:6},truckCapacity:48,
    truckHealth:240,truckRadius:11,truckSpeed:108,truckDamagePerContactSecond:7,
    truckMaxContacts:6,truckContactRadius:36,truckMax:6,repathSeconds:1.25,routeBudget:2,
    maxPathExpanded:16384,autoInterval:45,maxStep:.25,eventLimit:20,maxCounter:1e9,
    takeFood:12,epsilon:1e-7,repairScrap:8,repairHealth:100,repairRadius:110});
  const SECTORS=freeze([
    {id:'housing',name:'Les Maisons sans voix',short:'MAISONS',resource:'wood',rate:.42,reserve:900,
      briefing:'Les charpentes sont encore récupérables. Installer un poste, détacher un ouvrier et tenir les rues permet de sortir le bois sans abandonner le dépôt.',story:'Sous la poussière, les poutres portent toujours les mesures d’une autre vie.'},
    {id:'market',name:'Les Arcades muettes',short:'ARCADES',resource:'scrap',rate:.36,reserve:840,
      briefing:'Les arrière-boutiques recèlent des pièces. Les trieurs ne travaillent que si le quartier est calme, alimenté et ravitaillé.',story:'On a retiré les rideaux de fer. Pour la première fois, personne ne les a refermés derrière nous.'},
    {id:'aid',name:'Le Camp des veilleurs',short:'VEILLEURS',resource:'medicine',rate:.032,reserve:64,
      briefing:'Récupérer les fournitures encore conditionnées. Les réserves sont finies ; il ne s’agit ni d’un remède ni d’une production infinie de médicaments.',story:'Les dates sur les cartons ont été vérifiées une par une. Le reste ne sortira pas d’ici.'},
    {id:'industry',name:'La Cour des citernes',short:'CITERNES',resource:'fuel',rate:.24,reserve:600,
      briefing:'Les restes de carburant doivent être triés puis transportés. Le plein d’un convoi est payé au départ ; protéger l’itinéraire reste votre responsabilité.',story:'Le premier moteur a repris. Tout le monde a regardé la rue avant de sourire.'},
    {id:'transit',name:'Le Terminus des cendres',short:'TERMINUS',resource:'stone',rate:.40,reserve:920,
      briefing:'Le ballast et les dalles peuvent renforcer les enceintes. Le fourgon suit les passages praticables, pas une ligne qui ignore les portes.',story:'Les rails ne portent plus de trains. Ils nous indiquent encore le chemin du retour.'},
    {id:'checkpoint',name:'Le Passage du dernier feu',short:'BARRAGE',resource:'ammo',rate:.28,reserve:680,
      briefing:'Des caisses scellées restent derrière le barrage. La capture ne crédite pas de munitions : un ouvrier doit les récupérer, puis le convoi les rapporter.',story:'Les dernières caisses ont été comptées deux fois. Le poste avait tenu plus longtemps que nous le pensions.'}
  ]);
  const BY_ID=Object.freeze(Object.fromEntries(SECTORS.map(s=>[s.id,s])));
  const building=(id,name,category,icon,description,cost,health,time,size,tier,score,extra)=>({id,name,category,icon,description,cost,health,buildTime:time,size,unlockTier:tier,score,color:'#576159',roof:'#8b9280',...extra});
  const BUILDINGS=freeze({
    sectorPost:building('sectorPost','Poste de secteur','colony','⚑','À construire près d’un site de récupération. La prise exige 6 rations dans le sac. Un ouvrier affecté, présent, alimenté et ravitaillé alimente un stock local ; les convois le rapportent.',{wood:65,scrap:45,stone:25},1100,24,[2,2],1,7,{symbol:'PS',powerUse:1,light:95}),
    logisticsGarage:building('logisticsGarage','Garage logistique','industry','▰','Lance des fourgons non armés vers les postes. Chaque trajet engage 12 rations et 6 carburants ; la cargaison reste physique et peut être perdue.',{wood:70,scrap:120,stone:35,fuel:20},1250,36,[4,3],2,10,{symbol:'GL',powerUse:3,requires:'workshop',light:115}),
    fallbackRedoubt:building('fallbackRedoubt','Redoute de repli','defense','▣','Position de repli pour les ouvriers détachés et les sections. Tire avec la réserve commune de munitions, ajoute quatre logements et doit être défendue.',{wood:85,scrap:100,stone:70,ammo:30},1650,38,[3,3],2,9,{symbol:'RD',defense:true,housing:4,range:280,fireRate:1.4,damage:38,ammoPerShot:1,light:130})
  });
  const clone=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const finite=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const integer=(v,min=0,max=RULES.maxCounter)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  const fail=label=>{throw new Error('Territoires D-17 invalides : '+label+'.');};
  const has=(id)=>typeof id==='string'&&Object.hasOwn(BY_ID,id);
  const result=(ok,reason,extra={})=>({ok,reason,...extra});
  const emptySector=def=>({status:'neutral',control:0,pressure:0,supplies:0,stock:0,remaining:def.reserve,
    workerId:null,postId:null,everHeld:false,captures:0,losses:0,exported:0,automatic:false,nextDispatch:0});
  function create(){return{version:1,sectors:Object.fromEntries(SECTORS.map(s=>[s.id,emptySector(s)])),trucks:[],nextTruckId:1,
    withdrawing:[],fallbackId:null,stats:{delivered:0,convoysReturned:0,convoysLost:0,reclaimed:0},events:[]};}
  function normalize(raw){
    if(raw===undefined)return create();
    if(!object(raw)||raw.version!==1||!object(raw.sectors)||Object.keys(raw.sectors).length!==SECTORS.length)fail('registre');
    const state=create(),workers=new Set(),posts=new Set();
    for(const def of SECTORS){
      const s=raw.sectors[def.id];if(!object(s)||!['neutral','held','contested','lost','evacuated'].includes(s.status))fail('état de secteur');
      for(const [key,max]of [['control',RULES.reclaimSeconds],['pressure',RULES.occupationSeconds],['supplies',RULES.supplyCapacity],['stock',RULES.stockCapacity],['remaining',def.reserve],['exported',def.reserve],['nextDispatch',RULES.autoInterval]])if(!finite(s[key],0,max))fail(key);
      if(typeof s.everHeld!=='boolean'||typeof s.automatic!=='boolean'||!integer(s.captures)||!integer(s.losses))fail('historique');
      if((s.captures>0)!==s.everHeld||(['held','contested','lost','evacuated'].includes(s.status)&&!s.everHeld))fail('occupation sans capture');
      if(['held','contested'].includes(s.status)&&s.control!==0)fail('progression après capture');
      if(s.remaining+s.stock+s.exported>def.reserve+RULES.epsilon)fail('ressources de secteur dupliquées');
      for(const [key,set]of [['workerId',workers],['postId',posts]])if(s[key]!==null){if(!integer(s[key],1,0x7ffffffe)||set.has(s[key]))fail('affectation dupliquée');set.add(s[key]);}
      if(s.workerId!==null&&!['held','contested'].includes(s.status))fail('ouvrier affecté à un secteur non tenu');
      if(['held','contested'].includes(s.status)&&s.postId===null)fail('poste absent');
      state.sectors[def.id]={...emptySector(def),...Object.fromEntries(Object.keys(emptySector(def)).map(key=>[key,s[key]]))};
    }
    if(!Array.isArray(raw.trucks)||raw.trucks.length>RULES.truckMax||!integer(raw.nextTruckId,1))fail('parc de véhicules');
    const truckIds=new Set(),destinations=new Set();
    state.trucks=raw.trucks.map(t=>{
      if(!object(t)||!integer(t.id,1)||t.id>=raw.nextTruckId||truckIds.has(t.id)||!has(t.theme)||destinations.has(t.theme))fail('identité de convoi');
      truckIds.add(t.id);destinations.add(t.theme);
      if(!['outbound','returning'].includes(t.phase)||!finite(t.x,0,4096)||!finite(t.y,0,4096)||!finite(t.health,Number.MIN_VALUE,RULES.truckHealth)||!finite(t.food,0,RULES.supplyPack)||!finite(t.cargo,0,RULES.truckCapacity)||!finite(t.angle,-Math.PI,Math.PI))fail('véhicule');
      if(t.phase==='outbound'&&t.cargo!==0)fail('cargaison aller');
      if(typeof t.recalled!=='boolean'||t.recalled&&t.phase!=='returning')fail('rappel');
      const s=state.sectors[t.theme];if(s.remaining+s.stock+s.exported+t.cargo>BY_ID[t.theme].reserve+RULES.epsilon)fail('lot en transit dupliqué');
      return{id:t.id,theme:t.theme,phase:t.phase,x:t.x,y:t.y,health:t.health,food:t.food,cargo:t.cargo,angle:t.angle,recalled:t.recalled};
    });
    if(!Array.isArray(raw.withdrawing)||raw.withdrawing.length>10000||new Set(raw.withdrawing).size!==raw.withdrawing.length||raw.withdrawing.some(id=>!integer(id,1,0x7ffffffe)||workers.has(id)))fail('repli');
    state.withdrawing=raw.withdrawing.slice();state.nextTruckId=raw.nextTruckId;
    if(raw.fallbackId!==null&&!integer(raw.fallbackId,1,0x7ffffffe))fail('redoute');state.fallbackId=raw.fallbackId;
    if(!object(raw.stats))fail('statistiques');for(const key of Object.keys(state.stats)){if(!finite(raw.stats[key],0,RULES.maxCounter))fail('statistiques');state.stats[key]=raw.stats[key];}
    if(!Array.isArray(raw.events)||raw.events.length>RULES.eventLimit)fail('journal');
    const types=['captured','reclaimed','lost','evacuated','dispatched','returned','truckLost','supplied','assigned','recalled'];
    state.events=raw.events.map(e=>{if(!object(e)||!types.includes(e.type)||!has(e.theme))fail('entrée de journal');return{type:e.type,theme:e.theme};});
    return state;
  }
  const safeBag=bag=>object(bag)&&KEYS.every(k=>finite(bag[k]??0));
  class Engine{
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    sector(id){return has(id)?this.state.sectors[id]:null;}
    log(type,theme){this.state.events.push({type,theme});if(this.state.events.length>RULES.eventLimit)this.state.events.shift();}
    post(id,postId){
      const s=this.sector(id);if(!s||postId!==null&&!integer(postId,1,0x7ffffffe))return false;
      if(postId!==null&&SECTORS.some(d=>d.id!==id&&this.state.sectors[d.id].postId===postId))return false;
      if(s.postId!==null&&s.postId!==postId&&['held','contested'].includes(s.status))this.lose(id,'lost');
      s.postId=postId;return true;
    }
    claimStatus(id,ctx){
      const s=this.sector(id);if(!s)return result(false,'Quartier inconnu.');
      if(['held','contested'].includes(s.status))return result(false,'Poste déjà établi.');
      if(!ctx.running||ctx.dead||!ctx.atPost||!ctx.accessible)return result(false,'Rejoignez le poste terminé par un accès libre.');
      if(!ctx.operational||s.postId===null)return result(false,'Construisez et terminez un poste dans ce quartier.');
      if(!ctx.secure)return result(false,'Sécurisez les abords : des infectés sont trop proches.');
      if(!safeBag(ctx.carry)||(ctx.carry.food||0)<RULES.claimFood)return result(false,'Il faut 6 rations dans le sac. Prenez-les au centre.');
      return result(true,(s.everHeld?'Reconquérir':'Établir')+' le poste — maintenir ACTION / E.');
    }
    claim(id,dt,ctx){
      const status=this.claimStatus(id,ctx);if(!status.ok)return status;
      if(!finite(dt,Number.MIN_VALUE,RULES.maxStep))return result(false,'Pas de simulation invalide.');
      const s=this.sector(id),target=s.everHeld?RULES.reclaimSeconds:RULES.claimSeconds;
      s.control=Math.min(target,s.control+dt);
      if(s.control+RULES.epsilon<target)return result(true,status.reason);
      const reclaimed=s.everHeld;ctx.carry.food-=RULES.claimFood;s.supplies=Math.min(RULES.supplyCapacity,s.supplies+RULES.claimFood);
      s.status='held';s.control=0;s.pressure=0;s.everHeld=true;s.captures=Math.min(RULES.maxCounter,s.captures+1);
      if(reclaimed)this.state.stats.reclaimed=Math.min(RULES.maxCounter,this.state.stats.reclaimed+1);
      const event=reclaimed?'reclaimed':'captured';this.log(event,id);
      return result(true,reclaimed?'Quartier reconquis. Rétablissez son équipe et sa desserte.':'Poste établi. Affectez un ouvrier et protégez le trajet.',{event,theme:id});
    }
    lose(id,status='lost'){
      const s=this.sector(id);if(!s||!['held','contested'].includes(s.status)||!['lost','evacuated'].includes(status))return result(false,'Aucun poste tenu à évacuer.');
      if(s.workerId!==null&&!this.state.withdrawing.includes(s.workerId))this.state.withdrawing.push(s.workerId);
      s.workerId=null;s.status=status;s.control=0;s.pressure=0;s.stock=0;s.supplies=0;s.automatic=false;s.losses=Math.min(RULES.maxCounter,s.losses+1);
      for(const t of this.state.trucks)if(t.theme===id&&t.phase==='outbound'){t.phase='returning';t.recalled=true;}
      this.log(status,id);return result(true,status==='lost'?'Quartier perdu : stock local abandonné, ouvrier en repli. Le centre reste à défendre.':'Poste évacué : stocks locaux abandonnés, ouvrier en repli.',{event:status,theme:id});
    }
    assign(id,workerId,ctx){
      const s=this.sector(id);if(!s||s.status!=='held'||!ctx.canCommand||!integer(workerId,1,0x7ffffffe)||!ctx.workerAvailable)return result(false,'Affectation indisponible.');
      if(s.workerId!==null||SECTORS.some(d=>this.state.sectors[d.id].workerId===workerId)||this.state.withdrawing.includes(workerId))return result(false,'Cet ouvrier ou ce poste a déjà une affectation.');
      s.workerId=workerId;this.log('assigned',id);return result(true,'Ouvrier détaché : il rejoint physiquement le poste.',{event:'assigned',theme:id});
    }
    unassign(id){const s=this.sector(id);if(!s||s.workerId===null)return false;this.state.withdrawing.push(s.workerId);s.workerId=null;return true;}
    supply(id,ctx){
      const s=this.sector(id);if(!s||!['held','contested'].includes(s.status)||!ctx.running||ctx.dead||!ctx.atPost||!ctx.accessible||!ctx.secure||!safeBag(ctx.carry))return result(false,'Ravitaillement impossible ici.');
      const amount=Math.min(RULES.supplyPack,ctx.carry.food||0,RULES.supplyCapacity-s.supplies);
      if(amount<=RULES.epsilon)return result(false,'Poste plein ou aucune ration transportée.');
      s.supplies+=amount;ctx.carry.food-=amount;this.log('supplied',id);return result(true,amount.toFixed(1)+' rations remises au poste.',{event:'supplied',theme:id});
    }
    tick(id,dt,ctx){
      const s=this.sector(id),def=BY_ID[id];if(!s||!ctx.running||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return null;
      s.nextDispatch=Math.max(0,s.nextDispatch-dt);
      if(!['held','contested'].includes(s.status)){if(!ctx.secure)s.control=Math.max(0,s.control-dt);return null;}
      if(!ctx.operational)return this.lose(id);
      const enemies=finite(ctx.enemies,0,1e6)?ctx.enemies:0,inner=finite(ctx.innerEnemies,0,1e6)?ctx.innerEnemies:0,defenders=finite(ctx.defenders,0,1e6)?ctx.defenders:0;
      s.status=enemies>0?'contested':'held';
      if(inner>defenders)s.pressure=Math.min(RULES.occupationSeconds,s.pressure+dt*Math.min(3,inner-defenders));
      else s.pressure=Math.max(0,s.pressure-dt*RULES.pressureRecovery);
      if(s.pressure+RULES.epsilon>=RULES.occupationSeconds)return this.lose(id);
      if(s.status!=='held'||!ctx.powered||!ctx.workerPresent||s.workerId===null||s.supplies<=0||s.remaining<=0||s.stock>=RULES.stockCapacity)return null;
      const fraction=Math.min(1,s.supplies/(RULES.supplyPerSecond*dt),s.remaining/(def.rate*dt),(RULES.stockCapacity-s.stock)/(def.rate*dt));
      const amount=def.rate*dt*fraction;s.stock=Math.min(RULES.stockCapacity,s.stock+amount);s.remaining=Math.max(0,s.remaining-amount);s.supplies=Math.max(0,s.supplies-RULES.supplyPerSecond*dt*fraction);
      return null;
    }
    dispatchStatus(id,ctx){
      const s=this.sector(id);if(!s||s.status!=='held')return result(false,'Un poste tenu et sécurisé est requis.');
      if(!ctx.canCommand||!ctx.garage)return result(false,'Garage logistique terminé et alimenté requis.');
      if(!ctx.operational||!ctx.reachable)return result(false,'Aucun itinéraire praticable : vérifiez les portes.');
      if(this.state.trucks.some(t=>t.theme===id)||this.state.trucks.length>=RULES.truckMax)return result(false,'Un convoi dessert déjà ce quartier.');
      if(this.state.nextTruckId>=RULES.maxCounter)return result(false,'Compteur de convois épuisé.');
      if(!safeBag(ctx.resources)||Object.entries(RULES.convoyCost).some(([k,v])=>(ctx.resources[k]||0)<v))return result(false,'12 rations et 6 carburants sont nécessaires.');
      if(!finite(ctx.origin?.x,0,4096)||!finite(ctx.origin?.y,0,4096))return result(false,'Dépôt inaccessible.');
      return result(true,'Engager 12 rations et 6 carburants. Le fourgon sera exposé pendant le trajet.');
    }
    dispatch(id,ctx){
      const status=this.dispatchStatus(id,ctx);if(!status.ok)return status;
      for(const [k,v]of Object.entries(RULES.convoyCost))ctx.resources[k]-=v;
      const t={id:this.state.nextTruckId++,theme:id,phase:'outbound',x:ctx.origin.x,y:ctx.origin.y,health:RULES.truckHealth,food:RULES.supplyPack,cargo:0,angle:0,recalled:false};
      this.state.trucks.push(t);this.sector(id).nextDispatch=RULES.autoInterval;this.log('dispatched',id);
      return result(true,'Convoi en route. Aucun stock local n’est encore crédité.',{event:'dispatched',theme:id,truck:t});
    }
    arrivePost(truck,ctx){
      if(!this.state.trucks.includes(truck)||truck.phase!=='outbound'||!ctx.arrived)return result(false,'Convoi hors du poste.');
      const s=this.sector(truck.theme);
      if(!ctx.operational||s.status!=='held'){truck.phase='returning';truck.recalled=true;return result(true,'Poste indisponible : retour avec le chargement restant.');}
      const food=Math.min(truck.food,RULES.supplyCapacity-s.supplies);s.supplies+=food;truck.food-=food;
      truck.cargo=Math.min(RULES.truckCapacity,s.stock);s.stock-=truck.cargo;truck.phase='returning';
      return result(true,'Rations remises, stock embarqué. Le retour reste à effectuer.',{event:'loaded',theme:truck.theme});
    }
    unload(truck,ctx){
      if(!this.state.trucks.includes(truck)||truck.phase!=='returning'||!ctx.arrived||!safeBag(ctx.resources)||!finite(ctx.storage))return result(false,'Retour au dépôt nécessaire.');
      const key=BY_ID[truck.theme].resource,s=this.sector(truck.theme),food=Math.min(truck.food,Math.max(0,ctx.storage-(ctx.resources.food||0)));
      ctx.resources.food=(ctx.resources.food||0)+food;truck.food-=food;
      const cargo=Math.min(truck.cargo,Math.max(0,ctx.storage-(ctx.resources[key]||0)));ctx.resources[key]=(ctx.resources[key]||0)+cargo;truck.cargo-=cargo;
      s.exported+=cargo;this.state.stats.delivered=Math.min(RULES.maxCounter,this.state.stats.delivered+cargo);
      if(truck.food>RULES.epsilon||truck.cargo>RULES.epsilon)return result(true,'Dépôt plein : le reste du lot est conservé dans le fourgon.',{waiting:true,transferred:cargo});
      this.state.trucks.splice(this.state.trucks.indexOf(truck),1);this.state.stats.convoysReturned=Math.min(RULES.maxCounter,this.state.stats.convoysReturned+1);this.log('returned',truck.theme);
      return result(true,'Convoi rentré : la livraison est dans les réserves.',{event:'returned',theme:truck.theme,transferred:cargo});
    }
    recall(id){const t=this.state.trucks.find(t=>t.id===id);if(!t||t.phase!=='outbound')return result(false,'Ce convoi rentre déjà.');t.phase='returning';t.recalled=true;this.log('recalled',t.theme);return result(true,'Convoi rappelé. Les rations restantes reviennent ; le carburant engagé reste consommé.',{event:'recalled',theme:t.theme});}
    damage(id,amount){
      const t=this.state.trucks.find(t=>t.id===id);if(!t||!finite(amount,Number.MIN_VALUE,1e8))return null;
      t.health=Math.max(0,t.health-amount);if(t.health>0)return null;
      this.state.trucks.splice(this.state.trucks.indexOf(t),1);this.state.stats.convoysLost=Math.min(RULES.maxCounter,this.state.stats.convoysLost+1);this.log('truckLost',t.theme);
      return result(true,'Fourgon détruit : cargaison et rations en transit perdues.',{event:'truckLost',theme:t.theme});
    }
    repair(id,ctx){const t=this.state.trucks.find(t=>t.id===id);if(!t||!ctx.canCommand||!ctx.atTruck||!ctx.secure||!safeBag(ctx.resources)||t.health>=RULES.truckHealth||(ctx.resources.scrap||0)<RULES.repairScrap)return result(false,'Approchez le fourgon hors combat avec 8 ferrailles en réserve.');ctx.resources.scrap-=RULES.repairScrap;t.health=Math.min(RULES.truckHealth,t.health+RULES.repairHealth);return result(true,'Fourgon réparé de 100 points au maximum.');}
    overview(){const ss=Object.values(this.state.sectors);return{held:ss.filter(s=>s.status==='held').length,contested:ss.filter(s=>s.status==='contested').length,lost:ss.filter(s=>s.status==='lost'||s.status==='evacuated').length,staffed:ss.filter(s=>s.workerId!==null).length,convoys:this.state.trucks.length,...this.state.stats};}
  }
  function installCatalogue(C){
    if(!C||C.Territories)return;
    for(const [id,def]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Bâtiment de territoire déjà déclaré : '+id);C.BUILDINGS[id]=def;}
    C.TERRITORY_RULES=RULES;C.TERRITORY_SECTORS=SECTORS;
    const migrate=C.migrateSaveData;
    C.migrateSaveData=function(input){
      if(!object(input))return null;
      if(input.version===4){if(input.territories===undefined)fail('registre v4 absent');const territories=normalize(input.territories);const base=migrate({...input,version:3});return base?{...base,version:4,territories}:null;}
      if(![1,2,3].includes(input.version))return null;const base=migrate(input);return base?{...base,version:4,territories:create()}:null;
    };
    C.SAVE_VERSION=4;C.SAVE_KEY='deadwall-save-v4';C.SAVE_BACKUP_KEY='deadwall-save-backup-v4';
    C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v3','deadwall-save-backup-v3',...C.LEGACY_SAVE_KEYS])];C.Territories=API;
  }
  const API=Object.freeze({KEYS,RULES,SECTORS,BY_ID,BUILDINGS,create,normalize,Engine,installCatalogue});
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;
  root.DeadwallTerritories=API;if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL TERRITORIES 1.2 — END */


/* DEADWALL SIEGE 1.3 — BEGIN */
/* DEADWALL 1.3 — deterministic siege variants and resource-conserving fire response. */
(function initDeadwallSiege(root) {
  'use strict';
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const RULES = freeze({ version: 1, saveVersion: 5, maxStep: .25, maxFires: 32, maxTanks: 128, maxCrew: 16,
    waterCapacity: 120, pumpRate: .55, rainRate: .12, fuelPerWater: .012, bucketCapacity: 8, crewCapacity: 12,
    fillRate: 4, dischargeRate: 2, coolingPerWater: 9, initialHeat: 28, heatGrowth: .28,
    damageBase: 1.4, damageHeat: .048, burnSeconds: 180, spreadSeconds: 4, spreadHeat: 48,
    spreadGap: 38, wetSeconds: 24, ignitionRatio: .45, workRange: 76, dangerRadius: 105,
    crewPerStation: 2, warningBonus: 7, historyLimit: 24, maxCounter: 1e12, maxId: 0x7ffffffe });
  const PROFILES = freeze([
    { id:'compact', name:'La Marée compacte', minWave:3, interval:.8, weights:{walker:2,runner:.65,crawler:.8},
      brief:'Une masse lente et resserrée approche. Le nombre de contacts ne change pas, mais les arrivées se concentrent.', advice:'Gardez de la profondeur derrière la première porte et surveillez les amas de corps.' },
    { id:'rush', name:'La Course des récents', minWave:4, interval:.85, weights:{runner:2.3,crawler:1.5,armored:.65},
      brief:'Davantage d’infectés récents, moins de silhouettes protégées. Les accès mal fermés seront atteints rapidement.', advice:'Couvrez les portes par des tirs croisés. Un mur encombré de corps peut être franchi.' },
    { id:'breakers', name:'Les Colonnes de rupture', minWave:5, interval:1.12, weights:{breacher:2.8,armored:1.3,runner:.7},
      brief:'Les silhouettes de chantier sont nombreuses. Leur poussée menace les structures, pas leur santé maximale.', advice:'Concentrez les tirs sur les briseurs et préparez les ingénieurs derrière la ligne.' },
    { id:'hunters', name:'Les Rues de traverse', minWave:6, interval:.95, weights:{stalker:2.6,runner:1.4,walker:.9},
      brief:'Des traqueurs se mêlent à la migration. Les équipes isolées risquent de devenir leurs cibles.', advice:'Rappelez les ouvriers exposés ; les porteurs d’eau ne doivent pas intervenir seuls au contact.' },
    { id:'burden', name:'Le Poids des dépouilles', minWave:8, interval:1.3, weights:{bloated:2.6,armored:1.8,runner:.6},
      brief:'Plus de silhouettes lourdes et protégées. Leur progression est lente, mais leurs corps chargent les remparts.', advice:'Abattez-les en avant des murs, puis sécurisez un trajet pour les équipes de déblaiement.' },
    { id:'attrition', name:'Le Siège étiré', minWave:9, interval:1.7, weights:{walker:1.3,howler:1.8,stalker:1.2},
      brief:'Les mêmes effectifs arrivent sur une durée plus longue. Les ateliers et l’approvisionnement devront tenir.', advice:'Évitez la surproduction à vide. Préservez carburant, eau et munitions pour la fin de l’assaut.' },
    { id:'pincer', name:'La Prise en tenaille', minWave:10, interval:1, weights:{}, frontPattern:'pincer',
      brief:'Le premier échelon arrive par deux fronts opposés, le deuxième par les deux côtés latéraux, puis le dernier par les quatre côtés. Les effectifs et silhouettes restent ordinaires.', advice:'Répartissez les sections entre les portes opposées, puis gardez une réserve pour les côtés latéraux. Les pauses ne retirent aucun infecté déjà présent.' },
    { id:'flank', name:'Le Débordement latéral', minWave:13, interval:1, weights:{}, frontPattern:'flank',
      brief:'Le premier échelon approche par un côté, le deuxième par ses deux côtés latéraux, et le dernier par le côté opposé. Les mêmes effectifs déplacent la pression autour de la cité.', advice:'Préparez les trajets entre les lignes : ne laissez pas toutes les sections sur le premier front quand les arrivées se déplacent.' }
  ]);
  const PROFILE_BY_ID = Object.freeze(Object.fromEntries(PROFILES.map(p => [p.id,p])));
  const build=(id,name,category,icon,description,cost,health,size,tier,score,extra={})=>freeze({id,name,category,icon,description,cost,health,size,unlockTier:tier,score,buildTime:24,color:'#54645d',roof:'#7e8d83',...extra});
  const BUILDINGS=freeze({
    fireCistern:build('fireCistern','Citerne anti-incendie','industry','◒','Pompe et conserve 120 unités d’eau de secours. Pompe électrique consommant du carburant ; collecte lente de la pluie.',{scrap:60,stone:40,fuel:8},820,[3,2],1,6,{symbol:'EAU',powerUse:2}),
    fireStation:build('fireStation','Poste de secours incendie','colony','✚','Équipe deux ouvriers existants. Ils prennent l’eau en citerne et rejoignent les foyers par les accès libres.',{wood:65,scrap:80,stone:25},1000,[3,3],2,8,{symbol:'SI',powerUse:2,requires:'workshop',light:85}),
    fireScreen:build('fireScreen','Cloison coupe-feu','defense','▥','Paroi incombustible qui interrompt la propagation directe des flammes et bloque le passage. Placez-la sans condamner vos accès.',{scrap:12,stone:10},680,[1,1],2,.6,{symbol:'CF',wall:true,defense:true,buildTime:7}),
    alarmTower:build('alarmTower','Vigie d’alerte','colony','⌁','À partir de la vague 3, ajoute sept secondes à une nouvelle alerte si elle est terminée et alimentée. Le bonus ne se cumule pas.',{wood:70,scrap:65,ammo:10},720,[2,2],1,6,{symbol:'AL',powerUse:1,light:120})
  });
  // Concrete/steel/fire screens are not combustible. Only damaged hot machinery ignites by itself.
  const MATERIALS=freeze({core:.6,house:1,barracks:.85,clinic:.65,farm:1.15,warehouse:.9,lumber:1.3,scrapyard:.55,
    quarry:.35,refinery:1.25,generator:1.15,workshop:.7,ammoFactory:1.2,woodWall:1.3,watchtower:1,
    fieldKitchen:1,dressingWorkshop:.8,recoveryBench:.7,sectorPost:.75,logisticsGarage:.65,fireStation:.6,alarmTower:.8,planningOffice:.8,restShelter:1,dayGreenhouse:.6,prefabYard:.55,receptionHall:1,radioRelay:.65,roadDepot:.5});
  const SOURCES=freeze(['generator','refinery','ammoFactory','fieldKitchen']);
  const REASONS=freeze(['machinery','blast','spread']);
  const EVENTS=freeze(['ignited','extinguished','burnedOut','destroyed','assigned','released','crewLost','wave']);
  const object=x=>Boolean(x&&typeof x==='object'&&!Array.isArray(x));
  const finite=(x,min=0,max=RULES.maxCounter)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  const int=(x,min=1,max=RULES.maxId)=>Number.isInteger(x)&&x>=min&&x<=max;
  const fail=m=>{throw new Error('Registre de siège invalide : '+m+'.');};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const live=b=>Boolean(b&&!b.dead&&b.health>0);
  const operational=b=>live(b)&&(b.completed===true||b.progress>=1);
  const susceptibility=b=>{
    const added=root.DeadwallCore?.CityContent150?.BUILDINGS?.[b?.type];
    return MATERIALS[b?.type]||(['expeditionOffice','expeditionGarage'].includes(b?.type)?.7:0)||(root.DeadwallCore?.PowerGrid?.BUILDINGS[b?.type]?.battery||added?.battery?.capacity ? .6 : 0)||((root.DeadwallCore?.Urban?.BUILDINGS[b?.type]||added)?({power:1.1,fuel:1.2,ammo:1.1,housing:.65,hospital:.45,storage:.8,food:.7,scrap:.6,stone:.35,solar:.15,lamp:0}[(root.DeadwallCore.Urban?.BUILDINGS[b?.type]||added).urbanKind]||0):0);
  };
  function create(){return {version:1,tanks:[],fires:[],wet:[],crew:[],playerWater:0,lastWave:null,history:[],
    stats:{ignitions:0,extinguished:0,burnedOut:0,destroyed:0,waterProduced:0,waterUsed:0,waterLost:0}};}
  function normalize(raw){
    if(raw===undefined)return create();if(!object(raw)||raw.version!==1)fail('version');
    const out=create();
    const list=(key,max)=>{if(!Array.isArray(raw[key])||raw[key].length>max)fail(key);return raw[key];};
    const seen=(list,id)=>{if(!int(id)||list.has(id))fail('identifiant absent ou dupliqué');list.add(id);return id;};
    let ids=new Set();out.tanks=list('tanks',RULES.maxTanks).map(r=>{if(!object(r)||!finite(r.water,0,RULES.waterCapacity))fail('citerne');return{id:seen(ids,r.id),water:r.water};});
    ids=new Set();out.fires=list('fires',RULES.maxFires).map(r=>{if(!object(r)||!finite(r.heat,Number.MIN_VALUE,100)||!finite(r.age,0,RULES.burnSeconds)||!finite(r.spread,0,RULES.spreadSeconds)||!REASONS.includes(r.origin))fail('foyer');return{id:seen(ids,r.id),heat:r.heat,age:r.age,spread:r.spread,origin:r.origin};});
    ids=new Set();out.wet=list('wet',RULES.maxFires*4).map(r=>{if(!object(r)||!finite(r.seconds,Number.MIN_VALUE,RULES.wetSeconds))fail('humidification');const id=seen(ids,r.id);if(out.fires.some(f=>f.id===id))fail('foyer actif et humidifié');return{id,seconds:r.seconds};});
    ids=new Set();out.crew=list('crew',RULES.maxCrew).map(r=>{if(!object(r)||!finite(r.water,0,RULES.crewCapacity)||typeof r.release!=='boolean')fail('équipe');return{id:seen(ids,r.id),water:r.water,release:r.release};});
    if(!finite(raw.playerWater,0,RULES.bucketCapacity))fail('seau');out.playerWater=raw.playerWater;
    if(raw.lastWave!==null){const w=raw.lastWave;if(!object(w)||!int(w.wave,1,1e7)||!Object.hasOwn(PROFILE_BY_ID,w.id)||PROFILE_BY_ID[w.id].minWave>w.wave||![0,RULES.warningBonus].includes(w.bonus))fail('migration');out.lastWave={wave:w.wave,id:w.id,bonus:w.bonus};}
    out.history=list('history',RULES.historyLimit).map(r=>{if(!object(r)||!EVENTS.includes(r.type)||!int(r.id,0)||!finite(r.at))fail('journal');return{type:r.type,id:r.id,at:r.at};});
    if(!object(raw.stats))fail('statistiques');for(const k of Object.keys(out.stats)){if(!finite(raw.stats[k]))fail(k);out.stats[k]=raw.stats[k];}
    return out;
  }
  function profileFor(wave,seed=0){
    if(!int(wave,1,1e7)||!int(seed,0,0xffffffff))return null;
    const pool=PROFILES.filter(p=>p.minWave<=wave);if(!pool.length)return null;
    // Map seed changes the rotation; consecutive late waves visit every eligible profile.
    return pool[(wave+((Math.imul(seed,2654435761)>>>0)%pool.length))%pool.length];
  }
  function adaptPlan(plan,enemies,seed=0){
    const profile=profileFor(plan?.wave,seed);if(!profile)return {plan,profile:null};
    if(!int(plan.total,1,1e12)||!object(plan.composition)||!finite(plan.spawnInterval,.01,5))throw new Error('Plan de migration invalide.');
    const kinds=Object.keys(enemies).filter(k=>plan.wave>=enemies[k].unlockWave),scores=kinds.map(k=>({kind:k,score:Math.max(0,plan.composition[k]||0)*(profile.weights[k]||1)}));
    if(!scores.length||scores.some(s=>!Number.isFinite(s.score)))throw new Error('Composition invalide.');
    const total=scores.reduce((n,s)=>n+s.score,0);if(total<=0)throw new Error('Composition vide.');
    const composition=Object.fromEntries(Object.keys(enemies).map(k=>[k,0]));let assigned=0;
    for(const s of scores){const exact=s.score/total*plan.total;s.count=Math.floor(exact);s.frac=exact-s.count;assigned+=s.count;composition[s.kind]=s.count;}
    scores.sort((a,b)=>b.frac-a.frac||a.kind.localeCompare(b.kind));
    for(let i=0;i<plan.total-assigned;i++)composition[scores[i%scores.length].kind]++;
    return {profile,plan:{...plan,composition,spawnInterval:Math.max(.04,Math.min(2,plan.spawnInterval*profile.interval))}};
  }
  function rect(b){const w=(b.w||b.def?.size?.[0]||1)*32,h=(b.h||b.def?.size?.[1]||1)*32;return{left:b.left??b.x-w/2,right:b.right??b.x+w/2,top:b.top??b.y-h/2,bottom:b.bottom??b.y+h/2};}
  function edgeDistance(a,b){const x=rect(a),y=rect(b);return Math.hypot(Math.max(0,x.left-y.right,y.left-x.right),Math.max(0,x.top-y.bottom,y.top-x.bottom));}
  function intersects(a,b,r){let lo=0,hi=1;for(const [o,d,min,max]of [[a.x,b.x-a.x,r.left,r.right],[a.y,b.y-a.y,r.top,r.bottom]]){if(Math.abs(d)<1e-9){if(o<min||o>max)return false;}else{lo=Math.max(lo,Math.min((min-o)/d,(max-o)/d));hi=Math.min(hi,Math.max((min-o)/d,(max-o)/d));if(lo>hi)return false;}}return true;}
  function heatClear(a,b,buildings){return !buildings.some(c=>c.id!==a.id&&c.id!==b.id&&operational(c)&&['fireScreen','steelWall','concreteWall'].includes(c.type)&&intersects(a,b,rect(c)));}
  function waterFlow(water,{powered,weather=0,fuel=0},dt=RULES.maxStep){
    if(!finite(water,0,RULES.waterCapacity)||!finite(fuel)||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return{rain:0,pumped:0,cost:0};
    weather=finite(weather,0,1)?weather:0;
    const space=Math.max(0,RULES.waterCapacity-water),rain=Math.min(space,RULES.rainRate*weather*dt);
    const pumped=powered?Math.min(space-rain,RULES.pumpRate*dt,fuel/RULES.fuelPerWater):0;
    return{rain,pumped,cost:pumped*RULES.fuelPerWater};
  }
  class Engine {
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    addStat(key,value){this.state.stats[key]=Math.min(RULES.maxCounter,this.state.stats[key]+value);}
    log(type,id=0,at=0){this.state.history.push({type,id,at:finite(at)?at:0});if(this.state.history.length>RULES.historyLimit)this.state.history.shift();}
    tank(id){return this.state.tanks.find(t=>t.id===id);}
    fire(id){return this.state.fires.find(f=>f.id===id);}
    member(id){return this.state.crew.find(c=>c.id===id);}
    reconcile(buildings,units=[]){
      const bs=new Map(buildings.filter(live).map(b=>[b.id,b]));
      for(const t of [...this.state.tanks])if(!bs.has(t.id)||bs.get(t.id).type!=='fireCistern'){this.addStat('waterLost',t.water);this.state.tanks.splice(this.state.tanks.indexOf(t),1);}
      for(const b of buildings)if(operational(b)&&b.type==='fireCistern'&&!this.tank(b.id)&&this.state.tanks.length<RULES.maxTanks)this.state.tanks.push({id:b.id,water:0});
      for(const f of [...this.state.fires])if(!bs.has(f.id)){this.state.fires.splice(this.state.fires.indexOf(f),1);this.addStat('destroyed',1);this.log('destroyed',f.id);}
      this.state.wet=this.state.wet.filter(w=>bs.has(w.id));
      for(const c of [...this.state.crew])if(!units.some(u=>live(u)&&u.id===c.id&&u.kind==='worker')){this.addStat('waterLost',c.water);this.state.crew.splice(this.state.crew.indexOf(c),1);this.log('crewLost',c.id);}
    }
    ignite(b,origin='machinery',at=0){
      if(!operational(b)||!int(b.id)||!susceptibility(b)||!REASONS.includes(origin)||this.fire(b.id)||this.state.wet.some(w=>w.id===b.id)||this.state.fires.length>=RULES.maxFires)return false;
      if(origin==='machinery'&&(!(SOURCES.includes(b.type)||b.def?.generatorFuel||['ammo','fuel'].includes(b.def?.urbanKind))||b.health/(b.maxHealth||b.def.health)>RULES.ignitionRatio))return false;
      this.state.fires.push({id:b.id,heat:RULES.initialHeat,age:0,spread:0,origin});this.addStat('ignitions',1);this.log('ignited',b.id,at);return true;
    }
    explosion(source,buildings,at=0){let count=0;for(const b of buildings.slice().sort((a,b)=>a.id-b.id))if(b.id!==source.id&&edgeDistance(source,b)<=Math.min(70,source.def?.explosive||0)&&heatClear(source,b,buildings))count+=Number(this.ignite(b,'blast',at));return count;}
    step(dt,{buildings,resources,weather=0,running=false,damage,units=[],at=0}){
      if(!running||!finite(dt,Number.MIN_VALUE,RULES.maxStep)||!Array.isArray(buildings)||!object(resources)||!finite(resources.fuel))return false;
      this.reconcile(buildings,units);weather=finite(weather,0,1)?weather:0;
      this.state.wet=this.state.wet.map(w=>({...w,seconds:w.seconds-dt})).filter(w=>w.seconds>0);
      for(const t of this.state.tanks){const b=buildings.find(b=>b.id===t.id);if(!operational(b))continue;
        const flow=waterFlow(t.water,{powered:b.powered&&!this.fire(b.id),weather,fuel:resources.fuel},dt);
        resources.fuel=Math.max(0,resources.fuel-flow.cost);t.water+=flow.rain+flow.pumped;this.addStat('waterProduced',flow.rain+flow.pumped);
      }
      const byId=new Map(buildings.map(b=>[b.id,b]));
      for(const f of [...this.state.fires]){const b=byId.get(f.id);if(!operational(b))continue;
        f.age=Math.min(RULES.burnSeconds,f.age+dt);f.heat=Math.min(100,f.heat+RULES.heatGrowth*(1-weather*.5)*dt);f.spread=Math.min(RULES.spreadSeconds,f.spread+dt);
      // Explicit false stops after fatal damage; legacy undefined callbacks continue.
      if(typeof damage==='function'&&damage(b,(RULES.damageBase+RULES.damageHeat*f.heat)*susceptibility(b)*dt)===false)return true;
        if(!live(b))continue;
        if(f.age>=RULES.burnSeconds){this.state.fires.splice(this.state.fires.indexOf(f),1);this.addStat('burnedOut',1);this.log('burnedOut',f.id,at);continue;}
        if(f.spread>=RULES.spreadSeconds){f.spread=0;if(f.heat>=RULES.spreadHeat){const target=buildings.filter(c=>operational(c)&&c.id!==b.id&&susceptibility(c)&&!this.fire(c.id)&&!this.state.wet.some(w=>w.id===c.id)&&edgeDistance(b,c)<=RULES.spreadGap&&heatClear(b,c,buildings)).sort((a,c)=>edgeDistance(b,a)-edgeDistance(b,c)||a.id-c.id)[0];if(target)this.ignite(target,'spread',at);}}
      }
      this.reconcile(buildings,units);return true;
    }
    fill(tankId,actor,dt,ctx){
      const t=this.tank(tankId),holder=actor===0?this.state:this.member(actor),key=actor===0?'playerWater':'water',capacity=actor===0?RULES.bucketCapacity:RULES.crewCapacity;
      if(!t||!holder||!ctx.running||!ctx.accessible||ctx.dead||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return 0;
      const n=Math.min(t.water,RULES.fillRate*dt,capacity-holder[key]);if(n<=0)return 0;t.water-=n;holder[key]+=n;return n;
    }
    suppress(fireId,actor,dt,ctx){
      const f=this.fire(fireId),holder=actor===0?this.state:this.member(actor),key=actor===0?'playerWater':'water';
      if(!f||!holder||!ctx.running||!ctx.accessible||!ctx.secure||ctx.dead||!finite(dt,Number.MIN_VALUE,RULES.maxStep))return 0;
      const n=Math.min(holder[key],RULES.dischargeRate*dt,f.heat/RULES.coolingPerWater);if(n<=0)return 0;
      holder[key]=Math.max(0,holder[key]-n);f.heat=Math.max(0,f.heat-n*RULES.coolingPerWater);this.addStat('waterUsed',n);
      if(f.heat<1e-8){this.state.fires.splice(this.state.fires.indexOf(f),1);if(this.state.wet.length>=RULES.maxFires*4)this.state.wet.shift();this.state.wet.push({id:f.id,seconds:RULES.wetSeconds});this.addStat('extinguished',1);this.log('extinguished',f.id,ctx.at||0);}
      return n;
    }
    assign(id,ctx){if(!ctx.canCommand||!ctx.available||!int(id)||this.member(id)||this.state.crew.length>=Math.min(RULES.maxCrew,ctx.slots||0))return false;this.state.crew.push({id,water:0,release:false});this.log('assigned',id);return true;}
    release(id){const c=this.member(id);if(!c)return false;c.release=true;return true;}
    arriveHome(id){const c=this.member(id);if(!c||!c.release)return false;this.addStat('waterLost',c.water);this.state.crew.splice(this.state.crew.indexOf(c),1);this.log('released',id);return true;}
    playerDown(){this.addStat('waterLost',this.state.playerWater);this.state.playerWater=0;}
  }
  function installCatalogue(C){
    if(!C||C.Siege)return;for(const [id,def]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Catalogue en conflit : '+id);C.BUILDINGS[id]=def;}
    const prior=C.migrateSaveData;
    C.migrateSaveData=input=>{if(!object(input))return null;if(input.version===5){if(input.siege===undefined)fail('registre v5 absent');const siege=normalize(input.siege),base=prior({...input,version:4});return base?{...base,version:5,siege}:null;}if(![1,2,3,4].includes(input.version))return null;const base=prior(input);return base?{...base,version:5,siege:create()}:null;};
    C.SAVE_VERSION=5;C.SAVE_KEY='deadwall-save-v5';C.SAVE_BACKUP_KEY='deadwall-save-backup-v5';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v4','deadwall-save-backup-v4',...C.LEGACY_SAVE_KEYS])];C.SIEGE_RULES=RULES;C.SIEGE_PROFILES=PROFILES;C.Siege=API;
  }
  const API=Object.freeze({RULES,PROFILES,PROFILE_BY_ID,BUILDINGS,MATERIALS,SOURCES,create,normalize,profileFor,adaptPlan,rect,edgeDistance,heatClear,susceptibility,waterFlow,Engine,installCatalogue});
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;root.DeadwallSiege=API;if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL SIEGE 1.3 — END */


/* DEADWALL DAYWORKS 1.4 — BEGIN */
/* DEADWALL 1.4 — daylight preparation and bounded night echelons. */
(function initDayworks(root){
 'use strict';
 const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
 const RULES=freeze({version:1,saveVersion:6,firstDay:210,day:240,minDay:180,dayDecay:1.25,maxStep:.25,
  discoveryRadius:210,surveyRange:54,surveySeconds:6,salvageRate:4,dangerRadius:120,siteClearance:28,
  maxSites:18,braceSeconds:8,braceHp:120,braceFraction:.2,braceCost:{wood:12,scrap:8},maxBraces:128,
  restRadius:90,restHeal:.6,restStamina:8,foodPerHealth:.05,prefabRadius:210,prefabBonus:.25,
  fuelPerWork:.04,scrapPerWork:.10,nightMinWave:4,echelonPause:6,maxPlanCells:64,maxId:0x7ffffffe});
 const CARDINAL_FRONTS=freeze(['north','east','south','west']);
 const FRONT_PATTERNS=freeze({pincer:[[0,2],[1,3],[0,1,2,3]],flank:[[0],[1,3],[2]]});
 const site=(id,theme,name,text,resource,amount,unlock=null)=>({id,theme,name,text,resource,amount,unlock});
 const SITES=freeze([
  site('housing-1','housing','Le jardin derrière les volets','Une cour oubliée abrite des semences et un cahier de culture. Le relever ouvre la serre de jour.','food',18,'dayGreenhouse'),
  site('housing-2','housing','La remise du menuisier','Des bastaings secs ont été rangés au-dessus du sol. Rapportez-les avant de financer une nouvelle ligne.','wood',32),
  site('housing-3','housing','Le toit effondré','Les pierres triées ne valent rien ici. Leur poids occupera le sac pendant le retour.','stone',24),
  site('market-1','market','Les tiroirs de la droguerie','Sous le comptoir, des pansements ont échappé à la pluie. Les places dans le sac restent limitées.','medicine',5),
  site('market-2','market','Le rideau métallique','Des rails et des pièces de fixation peuvent être récupérés sans démanteler tout le quartier.','scrap',28),
  site('market-3','market','La réserve des commerçants','Quelques conserves intactes attendent derrière les étagères renversées.','food',22),
  site('aid-1','aid','La halte des brancardiers','Le plan d’un petit camp ferme la boucle entre entrepôt, halte et rempart.','medicine',4,'camp'),
  site('aid-2','aid','Le réchaud du camp','Un fond de combustible suffit à quelques heures de service, pas à une industrie perpétuelle.','fuel',16),
  site('aid-3','aid','La tente aux couvertures','Les caisses de ravitaillement sont finies : leur quantité ne revient pas à chaque aube.','food',24),
  site('industry-1','industry','Les gabarits de l’atelier','Les fiches de découpe permettent de monter une aire de préfabrication. Il faudra encore bâtir et alimenter celle-ci.','scrap',20,'prefabYard'),
  site('industry-2','industry','Le lot de traverses','Un lot de bois industriel est resté à l’écart des flammes.','wood',30),
  site('industry-3','industry','Le bac de pièces','Roulements, boulons et chutes de métal : la base de réparations futures.','scrap',26),
  site('transit-1','transit','La consigne du terminus','Des rations attendent dans une consigne ouverte. Le trajet de retour reste à sécuriser.','food',20),
  site('transit-2','transit','Le véhicule d’entretien','Des bidons partiellement pleins sont coincés sous la banquette.','fuel',20),
  site('transit-3','transit','Le ballast trié','Les sacs de granulats pourront renforcer la prochaine enceinte.','stone',30),
  site('checkpoint-1','checkpoint','Le casier du garde','La caisse ne contient qu’un petit lot de cartouches. Il faudra une production stable pour durer.','ammo',24),
  site('checkpoint-2','checkpoint','Le croquis du sas','Deux portes en série ménagent une zone de contrôle. Ce dessin n’enferme aucune unité à votre place.','scrap',18,'airlock'),
  site('checkpoint-3','checkpoint','La barrière couchée','Les madriers encore sains peuvent servir à étayer une porte avant le soir.','wood',24)
 ]);
 const BY_ID=freeze(Object.fromEntries(SITES.map(s=>[s.id,s])));
 const building=(id,name,category,icon,description,cost,health,size,tier,score,extra={})=>freeze({id,name,category,icon,description,cost,health,size,unlockTier:tier,score,buildTime:24,color:'#667361',roof:'#a8ac8b',...extra});
 const BUILDINGS=freeze({
  planningOffice:building('planningOffice','Bureau de chantier','colony','▧','Permet de prévisualiser puis financer des ensembles de chantiers. Aucun bâtiment n’est terminé instantanément.',{wood:50,scrap:35},780,[3,2],1,5,{symbol:'PLAN',light:50}),
  restShelter:building('restShelter','Halte de récupération','colony','⌂','Le jour, restaure lentement santé et endurance du commandant présent et hors danger. Les soins consomment des rations.',{wood:50,scrap:20,food:10},640,[3,2],1,4,{symbol:'HALTE',housing:2}),
  dayGreenhouse:building('dayGreenhouse','Serre de jour','industry','♧','Plan du jardin requis. Produit au calme diurne, avec électricité et carburant ; s’arrête pendant l’alerte et la nuit.',{wood:70,scrap:60,stone:25},660,[4,3],2,8,{symbol:'SERRE',powerUse:2,requires:'farm',production:{food:.72},consumes:{fuel:.04}}),
  prefabYard:building('prefabYard','Aire de préfabrication','industry','▤','Gabarits d’atelier requis. Accélère de 25 % le travail réel sur les chantiers proches pendant le jour, contre ferraille et carburant.',{wood:65,scrap:85,stone:40},960,[4,3],2,9,{symbol:'PRÉFA',powerUse:3,requires:'workshop'})
 });
 const PLANS=freeze([
  {id:'courtyard',name:'Enceinte de chantier',w:11,h:9,unlock:null,description:'34 palissades et une porte. Le centre reste libre pour vos constructions.'},
  {id:'airlock',name:'Sas à deux portes',w:7,h:7,unlock:'airlock',description:'20 palissades et deux portes opposées. Les portes ne se verrouillent pas automatiquement.'},
  {id:'camp',name:'Camp de halte',w:13,h:11,unlock:'camp',description:'42 palissades, une porte, une halte et un entrepôt : tous à construire.'},
  {id:'returnRelay',name:'Relais de retour',w:8,h:7,unlock:null,description:'Un entrepôt, un dortoir et une halte séparés par des allées. À installer dans une enceinte existante ; aucun mur inclus.',layout:[['warehouse',0,0],['house',5,0],['restShelter',5,4]]},
  {id:'foodCourt',name:'Cour nourricière',w:10,h:8,unlock:null,description:'Deux fermes, un dortoir et un entrepôt. Les réserves et logements ne sont disponibles qu’après les chantiers.',layout:[['farm',0,0],['farm',6,0],['house',0,5],['warehouse',6,5]]},
  {id:'materialsCourt',name:'Cour des matériaux',w:10,h:10,unlock:null,description:'Scierie, recyclage, concasseur et générateur, avec des espaces de circulation. Alimentation et entretien restent nécessaires.',layout:[['lumber',0,0],['scrapyard',5,0],['quarry',0,5],['generator',7,7]]},
  {id:'entryBastion',name:'Entrée à tirs croisés',w:9,h:7,unlock:null,description:'19 palissades, une porte et deux miradors. Arrière ouvert pour les déplacements ; ne constitue pas une enceinte fermée.',layout:[...Array.from({length:9},(_,x)=>x===3||x===4?null:['woodWall',x,0]).filter(Boolean),...Array.from({length:6},(_,i)=>['woodWall',0,i+1]),...Array.from({length:6},(_,i)=>['woodWall',8,i+1]),['gate',3,0],['watchtower',1,2],['watchtower',6,2]]},
  {id:'observationRelay',name:'Relais de veille',w:11,h:8,unlock:null,description:'Deux miradors, un entrepôt et une halte avec un axe central libre. La veille dépend des postes achevés et des lignes de vue ; les tirs consomment vos munitions. Aucune enceinte incluse.',layout:[['watchtower',0,0],['watchtower',9,0],['warehouse',0,4],['restShelter',8,5]]},
  {id:'careCourt',name:'Cour de soins',w:12,h:9,unlock:null,description:'Une clinique, un générateur, un entrepôt et une halte séparés par des passages. Les soins demandent de l’énergie, des médicaments et du travail réel ; aucune fortification incluse.',layout:[['clinic',0,0],['generator',9,0],['warehouse',0,6],['restShelter',9,6]]},
  {id:'spikedApproach',name:'Avant-porte hérissée',w:12,h:8,unlock:null,description:'Quatre hérissons, une ligne de dix palissades avec porte et deux miradors en retrait. Les côtés restent ouverts : ce plan prépare un accès, sans fermer une enceinte. Aucun montage ni munition supplémentaire.',layout:[...[1,3,8,10].map(x=>['spikes',x,0]),...Array.from({length:12},(_,x)=>x===5||x===6?null:['woodWall',x,2]).filter(Boolean),['gate',5,2],['watchtower',1,4],['watchtower',9,4]]},
  {id:'maintenanceRedoubt',name:'Redoute de maintenance',w:12,h:12,unlock:null,description:'Deux lignes de dix murs d’acier avec portes décalées, deux miradors, un générateur, un atelier et un entrepôt. Côtés ouverts ; financement et construction de chaque fondation, puis énergie, munitions et entretien ordinaires.',layout:[...Array.from({length:12},(_,x)=>x===5||x===6?null:['steelWall',x,1]).filter(Boolean),['gate',5,1],...Array.from({length:12},(_,x)=>x===7||x===8?null:['steelWall',x,6]).filter(Boolean),['gate',7,6],['watchtower',1,3],['watchtower',9,3],['generator',0,9],['workshop',3,9],['warehouse',8,9]]}

 ]);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const finite=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const integer=(v,min=0,max=RULES.maxId)=>Number.isInteger(v)&&v>=min&&v<=max;
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const fail=m=>{throw new Error('Registre Aube & Bastions invalide : '+m+'.');};
 function create(){return {version:1,initialized:false,sites:[],day:{wave:0,duration:0},braces:[],night:null,stats:{surveyed:0,salvaged:0,plans:0,bonusWork:0,foodSpent:0,braced:0,absorbed:0}};}
 function normalize(raw){
  if(raw===undefined)return create();if(!object(raw)||raw.version!==1||typeof raw.initialized!=='boolean')fail('version');
  const out=create();out.initialized=raw.initialized;
  if(!Array.isArray(raw.sites)||raw.sites.length>18||(raw.initialized&&raw.sites.length!==18)||(!raw.initialized&&raw.sites.length))fail('découvertes');
  const ids=new Set();out.sites=raw.sites.map(s=>{const spec=BY_ID[s?.id];if(!spec||ids.has(s.id)||!finite(s.x,48,4048)||!finite(s.y,48,4048)||typeof s.seen!=='boolean'||!finite(s.survey,0,RULES.surveySeconds)||!finite(s.remaining,0,spec.amount))fail('point de terrain');
   if(!s.seen&&(s.survey!==0||s.remaining!==spec.amount)||s.survey<RULES.surveySeconds&&s.remaining!==spec.amount)fail('relevé et réserve incohérents');ids.add(s.id);return{id:s.id,x:s.x,y:s.y,seen:s.seen,survey:s.survey,remaining:s.remaining};});
  if(!object(raw.day)||!integer(raw.day.wave,0,1e7)||!finite(raw.day.duration,0,1e12))fail('durée du jour');out.day={wave:raw.day.wave,duration:raw.day.duration};
  if(!Array.isArray(raw.braces)||raw.braces.length>RULES.maxBraces)fail('étais');ids.clear();out.braces=raw.braces.map(b=>{if(!object(b)||!integer(b.id,1)||ids.has(b.id)||!integer(b.wave,1,1e7)||!finite(b.work,0,RULES.braceSeconds)||!finite(b.hp,0,RULES.braceHp)||(b.work<RULES.braceSeconds&&b.hp!==0))fail('étai');ids.add(b.id);return{id:b.id,wave:b.wave,work:b.work,hp:b.hp};});
  if(raw.night!==null){const n=raw.night;if(!object(n)||!integer(n.wave,4,1e7)||!integer(n.total,1,1e12)||!integer(n.emitted,0,n.total)||!integer(n.pauses,0,2)||!Array.isArray(n.fronts)||!n.fronts.length||n.fronts.length>4||new Set(n.fronts).size!==n.fronts.length||n.fronts.some(f=>!['north','east','south','west'].includes(f)))fail('échelons');
   const expected=Math.min(2,Math.floor(n.emitted*3/n.total));if(n.pauses!==expected)fail('pauses d’assaut');out.night={wave:n.wave,total:n.total,emitted:n.emitted,pauses:n.pauses,fronts:n.fronts.slice()};}
  if(!object(raw.stats))fail('statistiques');for(const k of Object.keys(out.stats)){if(!finite(raw.stats[k]))fail(k);out.stats[k]=raw.stats[k];}
  return out;
 }
 function generate(seed,sites,clear=()=>true){
  if(!integer(seed,0,0xffffffff)||!Array.isArray(sites))throw new Error('Carte de terrain invalide.');let state=(seed^0x14a0bed5)>>>0;
  const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},result=[];
  for(const spec of SITES){const parent=sites.find(s=>s.theme===spec.theme);if(!parent)throw new Error('Quartier absent : '+spec.theme);let chosen=null;
   for(let i=0;i<320;i++){const a=rand()*Math.PI*2,r=170+rand()*(i>150?580:240),x=Math.max(48,Math.min(4048,parent.x+Math.cos(a)*r)),y=Math.max(48,Math.min(4048,parent.y+Math.sin(a)*r));
    if(result.every(s=>Math.hypot(s.x-x,s.y-y)>80)&&clear(x,y)){chosen={id:spec.id,x:Math.round(x*100)/100,y:Math.round(y*100)/100,seen:false,survey:0,remaining:spec.amount};break;}}
   // A fully built legacy map must still load. The point waits for a real open approach; no building is erased.
   if(!chosen)chosen={id:spec.id,x:Math.max(48,Math.min(4048,parent.x)),y:Math.max(48,Math.min(4048,parent.y)),seen:false,survey:0,remaining:spec.amount};result.push(chosen);
  }return result;
 }
 function dayDuration(wave,factor=1,scenarioSeconds=82){if(!integer(wave,1,1e7)||!finite(factor,.1,3)||!finite(scenarioSeconds,0,300))throw new Error('Cycle invalide.');return (wave===1?RULES.firstDay+scenarioSeconds-82:Math.max(RULES.minDay,RULES.day-(wave-1)*RULES.dayDecay))*factor;}
 function clock(phase,remaining,duration,nightProgress=0){const clamp=v=>Math.max(0,Math.min(1,v));if(phase==='calm')return .27+.45*(1-clamp(remaining/Math.max(1,duration)));if(phase==='warning')return .74;if(phase==='assault')return .83+.12*clamp(nightProgress);if(phase==='aftermath')return .98;return .5;}
 function unlocked(state,key){return state.sites.some(s=>s.survey>=RULES.surveySeconds&&BY_ID[s.id].unlock===key);}
 function footprint(planId,gx,gy){const p=PLANS.find(p=>p.id===planId);if(!p||!integer(gx,-128,128)||!integer(gy,-128,128))throw new Error('Projet inconnu.');if(p.layout)return p.layout.map(([type,x,y,rotation=0])=>({type,gx:gx+x,gy:gy+y,rotation}));const list=[],doorX=Math.floor(p.w/2)-1;
  for(let y=0;y<p.h;y++)for(let x=0;x<p.w;x++)if(!x||!y||x===p.w-1||y===p.h-1){const door=(y===p.h-1||p.id==='airlock'&&y===0)&&(x===doorX||x===doorX+1);if(!door)list.push({type:'woodWall',gx:gx+x,gy:gy+y,rotation:0});else if(x===doorX)list.push({type:'gate',gx:gx+x,gy:gy+y,rotation:0});}
  if(p.id==='camp')list.push({type:'restShelter',gx:gx+2,gy:gy+3,rotation:0},{type:'warehouse',gx:gx+7,gy:gy+3,rotation:0});return list;
 }
 function quote(items,catalogue,placement,tier,has){const cost={},occupied=new Set();if(!Array.isArray(items)||!items.length||items.length>RULES.maxPlanCells)return{ok:false,reason:'Ensemble vide ou trop grand.',cost};
  for(const i of items){const d=catalogue[i.type];if(!d)return{ok:false,reason:'Technologie absente.',cost};for(const [k,n]of Object.entries(d.cost))cost[k]=(cost[k]||0)+n;}
  for(const i of items){const d=catalogue[i.type];if(d.unlockTier>tier||d.requires&&!has(d.requires))return{ok:false,reason:'Technologie ou bâtiment requis absent.',cost};
   const w=i.rotation%2?d.size[1]:d.size[0],h=i.rotation%2?d.size[0]:d.size[1];
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(i.gx+x)+':'+(i.gy+y);if(occupied.has(k))return{ok:false,reason:'Chantiers superposés.',cost};occupied.add(k);}
   const check=placement(d,i.gx,i.gy,i.rotation);if(!check.valid)return{ok:false,reason:check.reason,cost};
  }return {ok:true,cost,reason:''};
 }
 function beginNight(wave,total,fronts){if(wave<4)return null;return normalize({...create(),night:{wave,total,emitted:0,pauses:0,fronts}}).night;}
 function frontGroup(n,pattern){
  if(!n)return null;const stage=Math.min(2,Math.floor(n.emitted*3/n.total)),shape=typeof pattern==='string'&&Object.hasOwn(FRONT_PATTERNS,pattern)?FRONT_PATTERNS[pattern]:null;
  // The saved first front anchors the geometry; use no campaign RNG or new registry.
  // Missing patterns and historical front counts keep their exact original sequence.
  if(shape&&n.fronts.length===4&&new Set(n.fronts).size===4&&n.fronts.every(f=>CARDINAL_FRONTS.includes(f))){const primary=CARDINAL_FRONTS.indexOf(n.fronts[0]);return shape[stage].map(offset=>CARDINAL_FRONTS[(primary+offset)%4]);}
  return stage===2&&n.fronts.length>2?n.fronts.slice(2):[n.fronts[stage%n.fronts.length]];
 }
 function emitted(n){if(!n||n.emitted>=n.total)return false;n.emitted++;const p=Math.min(2,Math.floor(n.emitted*3/n.total));const pause=p>n.pauses&&n.emitted<n.total;n.pauses=p;return pause;}
 class Engine{
  constructor(raw){this.state=normalize(raw);}
  snapshot(){return clone(this.state);}
  initialize(seed,sites,clear){if(this.state.initialized)return false;const result=generate(seed,sites,clear);this.state.sites=result;this.state.initialized=true;return true;}
  unlocked(k){return unlocked(this.state,k);}
  discover(player,visible=()=>true){let count=0;for(const s of this.state.sites)if(!s.seen&&Math.hypot(player.x-s.x,player.y-s.y)<=RULES.discoveryRadius&&visible(s)){s.seen=true;count++;}return count;}
  explore(id,dt,ctx){const s=this.state.sites.find(s=>s.id===id);if(!s||!s.seen||!finite(dt,Number.MIN_VALUE,RULES.maxStep)||!ctx.running||!ctx.day||!ctx.accessible||!ctx.secure||ctx.dead)return {survey:0,taken:0};
   if(s.survey<RULES.surveySeconds){const before=s.survey;s.survey=s.survey+dt>=RULES.surveySeconds-1e-8?RULES.surveySeconds:s.survey+dt;if(s.survey===RULES.surveySeconds){this.state.stats.surveyed++;return{survey:s.survey-before,taken:0,completed:true,unlock:BY_ID[id].unlock};}return {survey:s.survey-before,taken:0};}
   const bag=ctx.bag,room=Math.max(0,ctx.capacity-Object.values(bag).reduce((n,a)=>n+a,0)),taken=Math.min(s.remaining,room,dt*RULES.salvageRate);if(!(taken>0))return{survey:0,taken:0};bag[BY_ID[id].resource]=(bag[BY_ID[id].resource]||0)+taken;s.remaining=Math.max(0,s.remaining-taken);this.state.stats.salvaged+=taken;return{survey:0,taken};
  }
  reinforce(id,wave,dt,ctx){if(!integer(id,1)||!integer(wave,1,1e7)||!finite(dt,Number.MIN_VALUE,RULES.maxStep)||!ctx.running||!ctx.day||!ctx.accessible||!ctx.secure||ctx.dead)return false;
   let b=this.state.braces.find(b=>b.id===id);if(b&&b.wave!==wave){this.state.braces.splice(this.state.braces.indexOf(b),1);b=null;}
   if(b?.work===RULES.braceSeconds||!Object.entries(RULES.braceCost).every(([k,v])=>ctx.resources[k]>=v))return false;
   if(!b){if(this.state.braces.length>=RULES.maxBraces)return false;b={id,wave,work:0,hp:0};this.state.braces.push(b);}
   b.work=b.work+dt>=RULES.braceSeconds-1e-8?RULES.braceSeconds:b.work+dt;if(b.work===RULES.braceSeconds){for(const [k,v]of Object.entries(RULES.braceCost))ctx.resources[k]-=v;b.hp=RULES.braceHp;this.state.stats.braced++;return true;}return false;
  }
  absorb(id,wave,damage){const b=this.state.braces.find(b=>b.id===id&&b.wave===wave&&b.work===RULES.braceSeconds);if(!b||!finite(damage,Number.MIN_VALUE))return damage;const used=Math.min(b.hp,damage*RULES.braceFraction);b.hp-=used;this.state.stats.absorbed+=used;return damage-used;}
 }
 function installCatalogue(C){if(!C||C.Dayworks)return;for(const [id,b]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw new Error('Construction en conflit : '+id);C.BUILDINGS[id]=b;}
  const old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!object(raw))return null;if(raw.version===6){if(raw.dayworks===undefined)fail('registre v6 absent');const d=normalize(raw.dayworks),base=old({...raw,version:5});return base?{...base,version:6,dayworks:d}:null;}if(![1,2,3,4,5].includes(raw.version))return null;const base=old(raw);return base?{...base,version:6,dayworks:create()}:null;};
  C.SAVE_VERSION=6;C.SAVE_KEY='deadwall-save-v6';C.SAVE_BACKUP_KEY='deadwall-save-backup-v6';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v5','deadwall-save-backup-v5',...C.LEGACY_SAVE_KEYS])];C.DAYWORKS_RULES=RULES;C.Dayworks=API;
 }
 const API=Object.freeze({RULES,SITES,BY_ID,BUILDINGS,PLANS,create,normalize,generate,dayDuration,clock,unlocked,footprint,quote,beginNight,frontGroup,emitted,Engine,installCatalogue});root.DeadwallDayworks=API;
 if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;if(root.DeadwallCore)installCatalogue(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL DAYWORKS 1.4 — END */


/* DEADWALL CITADEL 1.5 — BEGIN */
/* DEADWALL — Les Vivants de D-17. Pure rules, no browser or clock dependency. */
(function initCitadel(root) {
  'use strict';
  const VERSION = '1.5.0-candidate.1';
  const RULES = Object.freeze({ discoverRange: 280, radioRange: 720, contactRange: 105, dangerRange: 125,
    homeRange: 72, followDistance: 65, maxStep: .25, maxSuspended: 128, maxHistory: 10, maxEvents: 32,
    inspectionSeconds: .5, maxReserve: 200, maxUnits: 10000 });
  const CALLS = Object.freeze([
    {id:'housing',name:'Élise Morel',role:'Menuisière',kind:'worker',tier:0,requires:null,cost:{food:8,medicine:1},
      brief:'J’ai calé la porte de la remise. Mes outils sont dehors. Montrez-moi un passage jusqu’au refuge, je reconstruirai avec vous.',
      arrival:'Élise a déposé sa caisse. « Demain, on fera mieux que tenir derrière des planches. »'},
    {id:'market',name:'Rachid Bensaïd',role:'Récupérateur',kind:'worker',tier:0,requires:null,cost:{food:8,medicine:1},
      brief:'Les arcades sont vides, mais les rues ne le sont pas. Je peux marcher. Je ne pars pas sans quelqu’un devant.',
      arrival:'Rachid rejoint les récupérateurs. Il repère déjà les pièces réutilisables dans la cour.'},
    {id:'aid',name:'Léa Vasseur',role:'Secouriste',kind:'medic',tier:2,requires:'clinic',cost:{food:12,medicine:4},
      brief:'Il ne reste rien dans l’ambulance. Préparez une clinique et quelques pansements ; je pourrai reprendre les soins au retour.',
      arrival:'Léa rejoint les secours. Les médicaments restent nécessaires à chaque intervention.'},
    {id:'industry',name:'Pavel Costa',role:'Technicien de maintenance',kind:'engineer',tier:2,requires:'workshop',cost:{food:12,scrap:12},
      brief:'Le portail a cédé. J’ai les mains blessées, mais je sais réparer vos machines. Il me faut un atelier, pas un miracle.',
      arrival:'Pavel rejoint les ingénieurs. Il demande de la ferraille avant de promettre des réparations.'},
    {id:'transit',name:'Aïcha Laurent',role:'Conductrice devenue récupératrice',kind:'worker',tier:1,requires:null,cost:{food:10,fuel:2},
      brief:'Le car ne repartira pas. Je viens à pied. Gardez une place au refuge ; je prendrai ma part des transports et des chantiers.',
      arrival:'Aïcha rejoint les ouvriers. Le vieux car reste au terminus ; personne n’a reçu un véhicule gratuit.'},
    {id:'checkpoint',name:'Gabriel Klein',role:'Fusilier',kind:'soldier',tier:1,requires:'barracks',cost:{food:10,ammo:15},
      brief:'Je n’ai plus de chargeur fiable. Je garde mon arme baissée jusqu’au dépôt. Il vous faudra une caserne pour me remettre en ligne.',
      arrival:'Gabriel rejoint une section. Son tir utilisera la même réserve de munitions que les autres fusiliers.'}
  ].map(c=>Object.freeze({...c,cost:Object.freeze(c.cost)})));
  const BY_ID = Object.freeze(Object.fromEntries(CALLS.map(c=>[c.id,c])));
  const building=(id,name,size,cost,extra)=>Object.freeze({id,name,size:Object.freeze(size),cost:Object.freeze(cost),category:'colony',icon:'⌂',
    health:850,buildTime:30,unlockTier:1,score:6,color:'#606858',roof:'#899078',...extra});
  const BUILDINGS=Object.freeze({
    receptionHall:building('receptionHall','Maison d’accueil',[4,3],{wood:100,scrap:40,food:20},{housing:10,light:95,
      description:'Dix logements. Les personnes escortées occupent leur place dès la prise en charge et rejoignent leurs tâches au retour.'}),
    radioRelay:building('radioRelay','Relais radio de quartier',[2,2],{wood:35,scrap:80,fuel:5},{health:620,buildTime:24,score:5,powerUse:2,requires:'generator',light:60,
      description:'Repère les appels dans un rayon de 720 lorsqu’il est alimenté. Ne révèle pas les infectés, ne sécurise pas un trajet et ne recrute personne à distance.'})
  });
  const clone=o=>JSON.parse(JSON.stringify(o));
  const object=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
  const int=(v,lo=0,hi=1e7)=>Number.isSafeInteger(v)&&v>=lo&&v<=hi;
  const num=(v,lo=0,hi=1e15)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
  const fail=label=>{throw new Error('Registre de la cité invalide : '+label+'.');};
  const ACTIVE=Object.freeze(['follow','hold','return']);
  const METRICS=Object.freeze(['kills','unitsLost','buildingsLost','shots','rescued','escortLosses','ignitions','extinguished']);
  function counters(raw={}) { if(!object(raw))fail('compteurs');return Object.fromEntries(METRICS.map(k=>{const v=raw[k]??0;if(!num(v))fail('compteur '+k);return[k,v];})); }
  function create(){return {version:1,calls:CALLS.map(c=>({id:c.id,seen:false,status:'waiting',unitId:null,citizenId:null})),suspended:[],reserve:0,
    stances:['mobile','mobile','mobile'],recallAtDusk:false,baseline:null,history:[],events:[],stats:{rescued:0,escortLosses:0}};}
  function normalize(raw){
    if(raw===undefined)return create();if(!object(raw)||raw.version!==1)fail('version');
    if(!Array.isArray(raw.calls)||raw.calls.length!==CALLS.length)fail('appels');const seen=new Set(),units=new Set();
    const calls=raw.calls.map(s=>{if(!object(s)||!Object.hasOwn(BY_ID,s.id)||seen.has(s.id)||typeof s.seen!=='boolean'||!['waiting',...ACTIVE,'delivered','lost'].includes(s.status))fail('appel');seen.add(s.id);
      if(ACTIVE.includes(s.status)){if(!s.seen||!int(s.unitId,1,0x7ffffffe)||units.has(s.unitId))fail('escorte');units.add(s.unitId);}
      else if(s.unitId!==null)fail('référence inactive');
      if(s.status==='delivered'){if(!int(s.citizenId,1,0x7ffffffe)||units.has(s.citizenId))fail('identité du résident');units.add(s.citizenId);}else if(s.citizenId!==null)fail('résident non arrivé');
      if(s.status!=='waiting'&&!s.seen)fail('contact inconnu');return {id:s.id,seen:s.seen,status:s.status,unitId:s.unitId,citizenId:s.citizenId};});
    if(!Array.isArray(raw.suspended)||raw.suspended.length>RULES.maxSuspended||new Set(raw.suspended).size!==raw.suspended.length||raw.suspended.some(n=>!int(n,1,0x7ffffffe)))fail('chantiers');
    if(!int(raw.reserve,0,RULES.maxReserve)||!Array.isArray(raw.stances)||raw.stances.length!==3||raw.stances.some(s=>!['mobile','hold'].includes(s))||typeof raw.recallAtDusk!=='boolean')fail('consignes');
    let baseline=null;
    if(raw.baseline!==null){const b=raw.baseline;if(!object(b)||!int(b.wave,1)||!num(b.at,0,1e12))fail('début de nuit');if(typeof b.partial!=='boolean')fail('origine du bilan');baseline={wave:b.wave,at:b.at,partial:b.partial,metrics:counters(b.metrics)};}
    if(!Array.isArray(raw.history)||raw.history.length>RULES.maxHistory)fail('bilans');const waves=new Set();let last=0;
    const history=raw.history.map(h=>{if(!object(h)||!int(h.wave,1)||h.wave<=last||waves.has(h.wave)||!num(h.seconds,0,1e12)||!['secured','fallen'].includes(h.outcome))fail('bilan');waves.add(h.wave);last=h.wave;if(typeof h.partial!=='boolean')fail('bilan partiel');return{wave:h.wave,seconds:h.seconds,outcome:h.outcome,partial:h.partial,metrics:counters(h.metrics)};});
    if(baseline&&waves.has(baseline.wave))fail('nuit déjà consignée');
    if(!Array.isArray(raw.events)||raw.events.length>RULES.maxEvents)fail('journal');
    const events=raw.events.map(e=>{if(!object(e)||!num(e.at,0,1e12)||!['found','joined','arrived','lost','dusk','order','suspend','resume'].includes(e.type)||typeof e.subject!=='string'||e.subject.length>40||!/^[a-zA-Z0-9 :_-]*$/.test(e.subject))fail('événement');return {at:e.at,type:e.type,subject:e.subject};});
    if(!object(raw.stats)||!int(raw.stats.rescued,0,6)||!int(raw.stats.escortLosses,0,6)||raw.stats.rescued!==calls.filter(c=>c.status==='delivered').length||raw.stats.escortLosses!==calls.filter(c=>c.status==='lost').length)fail('effectifs consignés');
    return {version:1,calls,suspended:raw.suspended.slice(),reserve:raw.reserve,stances:raw.stances.slice(),recallAtDusk:raw.recallAtDusk,baseline,history,events,stats:{...raw.stats}};
  }
  function canFire(stock,cost,reserve=0){return num(stock)&&num(cost,Number.MIN_VALUE)&&int(reserve,0,RULES.maxReserve)&&stock-cost>=reserve-1e-9;}
  function enlistStatus(state,id,ctx){const s=state.calls.find(s=>s.id===id),d=BY_ID[id];
    if(!s||!d||!s.seen)return{ok:false,reason:'Appel non repéré.'};if(s.status!=='waiting')return{ok:false,reason:'Cet appel a déjà été pris en charge.'};
    if(!ctx.command||ctx.dead)return{ok:false,reason:'Le commandant doit être debout et disponible.'};
    if(!ctx.day)return{ok:false,reason:'La prise de contact se prépare pendant le calme.'};
    if(!ctx.accessible)return{ok:false,reason:'Rejoignez le signal par un accès libre.'};
    if(!ctx.secure)return{ok:false,reason:'Éloignez les infectés avant la prise en charge.'};
    if(ctx.tier<d.tier||d.requires&&!ctx.has(d.requires))return{ok:false,reason:'Palier et infrastructure du rôle requis avant le départ.'};
    if(ctx.population>=RULES.maxUnits+1)return{ok:false,reason:'Limite technique de survivants atteinte ; aucune prise en charge engagée.'};
    if(!int(ctx.population,0,10001)||!num(ctx.housing)||ctx.population>=ctx.housing)return{ok:false,reason:'Une place de logement est requise dès la prise en charge.'};
    if(!object(ctx.resources)||Object.entries(d.cost).some(([k,n])=>!num(ctx.resources[k])||ctx.resources[k]<n))return{ok:false,reason:'Réserves de prise en charge insuffisantes.'};
    return{ok:true,reason:'Coût unique ; escorte physique jusqu’au centre. Aucun renfort téléporté.'};
  }
  class Engine{
    constructor(raw){this.state=normalize(raw);}
    snapshot(){return clone(this.state);}
    call(id){return this.state.calls.find(s=>s.id===id)||null;}
    log(type,subject,at){this.state.events.push({type,subject:String(subject),at:Math.max(0,Math.min(1e12,at||0))});if(this.state.events.length>RULES.maxEvents)this.state.events.shift();}
    reveal(id,at=0){const s=this.call(id);if(!s||s.seen)return false;s.seen=true;this.log('found',id,at);return true;}
    enlist(id,unitId,ctx,at=0){const result=enlistStatus(this.state,id,ctx);if(!result.ok)return result;
      if(!int(unitId,1,0x7ffffffe)||this.state.calls.some(s=>s.unitId===unitId||s.citizenId===unitId))return{ok:false,reason:'Identifiant du survivant invalide.'};
      for(const [k,n]of Object.entries(BY_ID[id].cost))ctx.resources[k]-=n;
      Object.assign(this.call(id),{status:'follow',unitId});this.log('joined',id,at);return{ok:true};}
    order(id,order,at=0){const s=this.call(id);if(!s||!ACTIVE.includes(s.status)||!ACTIVE.includes(order))return false;s.status=order;this.log('order',id,at);return true;}
    finish(id,alive,at=0){const s=this.call(id);if(!s||!ACTIVE.includes(s.status))return false;s.status=alive?'delivered':'lost';s.citizenId=alive?s.unitId:null;s.unitId=null;this.state.stats[alive?'rescued':'escortLosses']++;this.log(alive?'arrived':'lost',id,at);return true;}
    suspend(id,value,at=0){if(!int(id,1,0x7ffffffe)||typeof value!=='boolean')return false;const i=this.state.suspended.indexOf(id);if(value&&i===-1){if(this.state.suspended.length>=RULES.maxSuspended)return false;this.state.suspended.push(id);this.log('suspend',id,at);}else if(!value&&i!==-1){this.state.suspended.splice(i,1);this.log('resume',id,at);}return true;}
    beginNight(wave,at,metrics,partial=false){if(!int(wave,1)||!num(at,0,1e12)||this.state.history.some(h=>h.wave===wave)||this.state.baseline?.wave===wave)return false;this.state.baseline={wave,at,partial:partial===true,metrics:counters(metrics)};return true;}
    endNight(wave,at,metrics,outcome='secured'){const b=this.state.baseline;if(!b||b.wave!==wave||!num(at,b.at,1e12)||!['secured','fallen'].includes(outcome))return false;
      const now=counters(metrics),delta=Object.fromEntries(METRICS.map(k=>[k,Math.max(0,now[k]-b.metrics[k])]));this.state.history.push({wave,seconds:at-b.at,outcome,partial:b.partial,metrics:delta});if(this.state.history.length>RULES.maxHistory)this.state.history.shift();this.state.baseline=null;return true;}
  }
  function install(C){if(!C||C.Citadel)return;for(const [id,b]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw Error('Construction en conflit : '+id);C.BUILDINGS[id]=b;}
    const old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!object(raw))return null;if(raw.version===7){if(raw.citadel===undefined)fail('registre v7 absent');const state=normalize(raw.citadel),base=old({...raw,version:6});return base?{...base,version:7,citadel:state}:null;}if(![1,2,3,4,5,6].includes(raw.version))return null;const base=old(raw);return base?{...base,version:7,citadel:create()}:null;};
    C.SAVE_VERSION=7;C.SAVE_KEY='deadwall-save-v7';C.SAVE_BACKUP_KEY='deadwall-save-backup-v7';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v6','deadwall-save-backup-v6',...C.LEGACY_SAVE_KEYS])];C.CITADEL_RULES=RULES;C.Citadel=API;
  }
  const API=Object.freeze({VERSION,RULES,CALLS,BY_ID,BUILDINGS,ACTIVE,METRICS,create,normalize,counters,canFire,enlistStatus,Engine,install});root.DeadwallCitadel=API;
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;if(root.DeadwallCore)install(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL CITADEL 1.5 — END */


/* DEADWALL INFRASTRUCTURE 1.6 — BEGIN */
/* DEADWALL — roads are a ground layer, never walls, stockpiles or free buildings. */
(function initInfrastructure(root) {
  'use strict';
  const VERSION='1.6.0-candidate.1';
  const RULES=Object.freeze({saveVersion:8,tile:32,worldTiles:128,maxRoads:2048,maxTrace:64,maxCrew:8,crewPerDepot:2,maxRuins:96,maxStep:.25,
    cost:Object.freeze({stone:2,scrap:1}),workSeconds:3,playerWork:1.4,workerWork:1,workRange:48,dangerRange:110,homeRange:60,
    friendlySpeed:1.18,truckSpeed:1.30,hostileSpeed:1.10,maxExpanded:8192});
  const SURFACES=Object.freeze({
    gravel:Object.freeze({id:'gravel',name:'Piste stabilisée',rank:0,unlockTier:1,requires:'planningOffice',cost:RULES.cost,workSeconds:RULES.workSeconds,friendlySpeed:RULES.friendlySpeed,truckSpeed:RULES.truckSpeed,hostileSpeed:RULES.hostileSpeed,color:'#888474',pattern:'gravel'}),
    paving:Object.freeze({id:'paving',name:'Voie pavée',rank:1,unlockTier:4,requires:'roadDepot',cost:Object.freeze({stone:5,scrap:2}),workSeconds:6,friendlySpeed:1.24,truckSpeed:1.40,hostileSpeed:1.15,color:'#9b9786',pattern:'paving'}),
    concrete:Object.freeze({id:'concrete',name:'Chaussée bétonnée',rank:2,unlockTier:7,requires:'roadDepot',workshop:true,cost:Object.freeze({stone:9,scrap:4}),workSeconds:10,friendlySpeed:1.30,truckSpeed:1.52,hostileSpeed:1.20,color:'#adafa2',pattern:'concrete'}),
    logistics:Object.freeze({id:'logistics',name:'Axe logistique',rank:3,unlockTier:10,requires:'roadDepot',workshop:true,cost:Object.freeze({stone:14,scrap:8,fuel:1}),workSeconds:16,friendlySpeed:1.36,truckSpeed:1.65,hostileSpeed:1.26,color:'#626963',pattern:'logistics'})
  });
  const BUILDINGS=Object.freeze({roadDepot:Object.freeze({id:'roadDepot',name:'Atelier de voirie',category:'industry',icon:'▱',symbol:'VOIRIE',
    description:'Deux ouvriers existants peuvent être détachés aux pistes financées. Travail diurne, accès physique et alimentation électrique requis.',
    cost:Object.freeze({wood:45,scrap:55,stone:35}),health:850,size:Object.freeze([3,3]),unlockTier:1,requires:'planningOffice',score:6,buildTime:26,powerUse:1,color:'#6b6757',roof:'#aba187',light:60})});
  const finite=(n,a=0,b=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  const integer=(n,a=0,b=0x7ffffffe)=>Number.isInteger(n)&&finite(n,a,b);
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const copy=x=>JSON.parse(JSON.stringify(x));
  const key=(x,y)=>y*RULES.worldTiles+x;
  const cell=p=>object(p)&&integer(p.x,1,126)&&integer(p.y,1,126);
  const fail=message=>{throw new Error('Réseau de cité invalide : '+message+'.');};
  const surface=p=>SURFACES[p?.surface||'gravel'];
  const unfinished=p=>p.progress<1||Boolean(p.upgrade);
  function surfaceStatus(id,tier,has=()=>false){
    const s=Object.hasOwn(SURFACES,id)&&SURFACES[id];if(!s)return{ok:false,reason:'Revêtement inconnu.'};
    if(!integer(tier,0,10)||tier<s.unlockTier)return{ok:false,reason:'Palier '+s.unlockTier+' requis pour '+s.name+'.'};
    if(typeof has!=='function'||!has(s.requires)||s.workshop&&!has('workshop'))return{ok:false,reason:'Bâtiment achevé requis : '+(s.workshop?'atelier de voirie et atelier':s.requires==='roadDepot'?'atelier de voirie':'bureau de chantier')+'.'};
    return{ok:true,reason:s.name+' disponible.'};
  }
  function create(){return{version:1,roads:[],crew:[],ruins:[],stats:{laid:0,reconstructed:0,forgotten:0}};}
  function normalize(raw){
    if(raw===undefined)return create();
    if(!object(raw)||raw.version!==1||!Array.isArray(raw.roads)||raw.roads.length>RULES.maxRoads||!Array.isArray(raw.crew)||raw.crew.length>RULES.maxCrew||!Array.isArray(raw.ruins)||raw.ruins.length>RULES.maxRuins)fail('format ou capacité');
    const ids=new Set(),workers=new Set(),ruins=new Set(),positions=new Set();
    const roads=raw.roads.map(p=>{
      if(!cell(p)||!finite(p.progress,0,1)||ids.has(key(p.x,p.y)))fail('piste dupliquée ou hors carte');ids.add(key(p.x,p.y));
      const road={x:p.x,y:p.y,progress:p.progress};
      if(Object.hasOwn(p,'surface')){if(typeof p.surface!=='string'||!Object.hasOwn(SURFACES,p.surface))fail('revêtement inconnu');road.surface=p.surface;}
      if(Object.hasOwn(p,'upgrade')){
        const u=p.upgrade;if(!object(u)||Object.keys(u).length!==2||!Object.hasOwn(u,'surface')||!Object.hasOwn(u,'progress')||typeof u.surface!=='string'||!Object.hasOwn(SURFACES,u.surface)||!finite(u.progress,0,1)||u.progress===1||p.progress!==1||SURFACES[u.surface].rank<=surface(road).rank)fail('mise à niveau du revêtement');
        road.upgrade={surface:u.surface,progress:u.progress};
      }
      return road;
    });
    const crew=raw.crew.map(u=>{if(!object(u)||!integer(u.id,1)||typeof u.returning!=='boolean'||workers.has(u.id))fail('équipe');workers.add(u.id);return{id:u.id,returning:u.returning};});
    const blueprints=raw.ruins.map(b=>{
      if(!object(b)||!integer(b.id,1)||typeof b.type!=='string'||!/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(b.type)||b.type==='core'||!integer(b.gx,1,126)||!integer(b.gy,1,126)||!integer(b.rotation,0,3)||!finite(b.at)||ruins.has(b.id)||positions.has(b.gx+':'+b.gy))fail('empreinte de reconstruction');
      ruins.add(b.id);positions.add(b.gx+':'+b.gy);return{id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation,at:b.at};
    });
    const stats={};for(const name of ['laid','reconstructed','forgotten']){const n=raw.stats?.[name]??0;if(!integer(n,0,1e12))fail('statistique');stats[name]=n;}
    return{version:1,roads,crew,ruins:blueprints,stats};
  }
  function line(a,b){
    if(!cell(a)||!cell(b))return null;
    // One cardinal leg followed by the other. No diagonal gaps; never an unbounded trace.
    if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+1>RULES.maxTrace)return null;
    const out=[{x:a.x,y:a.y}],p={...a};
    while(p.x!==b.x){p.x+=Math.sign(b.x-p.x);out.push({...p});}
    while(p.y!==b.y){p.y+=Math.sign(b.y-p.y);out.push({...p});}
    return out;
  }
  function quote(state,cells,stock,blocked=()=>false,options){
    if(!Array.isArray(cells)||!cells.length||cells.length>RULES.maxTrace||!object(stock))return{ok:false,reason:'Trace vide, trop longue ou réserves absentes.'};
    const id=options?.surface??'gravel',mode=options?.mode??'new',target=Object.hasOwn(SURFACES,id)&&SURFACES[id];
    if(!target||!['new','upgrade'].includes(mode))return{ok:false,reason:'Revêtement ou mode de travaux invalide.'};
    if(options){const status=surfaceStatus(id,options.tier,options.has);if(!status.ok)return status;}
    else if(id!=='gravel'||mode!=='new')return{ok:false,reason:'Conditions de déblocage absentes.'};
    const seen=new Set(),existing=new Map(state.roads.map(p=>[key(p.x,p.y),p])),fresh=[],cost={};
    for(const p of cells){
      if(!cell(p)||seen.has(key(p.x,p.y)))return{ok:false,reason:'Une cellule de la trace est invalide ou répétée.'};
      if(seen.size){const prev=cells[seen.size-1];if(Math.abs(prev.x-p.x)+Math.abs(prev.y-p.y)!==1)return{ok:false,reason:'La piste doit rester raccordée par ses côtés.'};}
      seen.add(key(p.x,p.y));const previous=existing.get(key(p.x,p.y));
      if(mode==='new'&&previous)continue;
      if(mode==='upgrade'){
        if(!previous)return{ok:false,reason:'La mise à niveau exige une route achevée sur chaque cellule.'};
        if(unfinished(previous))return{ok:false,reason:'Achevez les travaux déjà financés avant une nouvelle mise à niveau.'};
        if(surface(previous).rank>target.rank)return{ok:false,reason:'Une mise à niveau ne peut pas dégrader un revêtement.'};
        if(surface(previous).rank===target.rank)continue;
      }
      if(blocked(p.x,p.y))return{ok:false,reason:'Une structure ou une ressource empêche ce tronçon.'};fresh.push({x:p.x,y:p.y});
      for(const [resource,n]of Object.entries(target.cost)){const amount=n-(mode==='upgrade'?(surface(previous).cost[resource]||0):0);if(amount>0)cost[resource]=(cost[resource]||0)+amount;}
    }
    if(!fresh.length)return{ok:false,reason:mode==='upgrade'?'Ces cellules possèdent déjà ce revêtement.':'Cette trace est déjà financée.'};
    if(mode==='new'&&state.roads.length+fresh.length>RULES.maxRoads)return{ok:false,reason:'Limite de 2 048 cellules de piste atteinte.'};
    if(Object.entries(cost).some(([k,n])=>!finite(stock[k])||stock[k]<n))return{ok:false,reason:'Matériaux du revêtement insuffisants.',cost};
    return{ok:true,cells:fresh,cost,surface:id,mode,reason:mode==='upgrade'?'Différence de matériaux financée, puis travaux sur place. Le bonus du revêtement précédent reste actif jusqu’à achèvement.':'Financement complet, puis travaux sur place. Aucune piste terminée instantanément.'};
  }
  class Heap{
    constructor(){this.items=[];}
    push(v){let i=this.items.length;this.items.push(v);while(i){const p=(i-1)>>1;if(this.items[p].f<=v.f)break;this.items[i]=this.items[p];i=p;}this.items[i]=v;}
    pop(){const top=this.items[0],end=this.items.pop();if(this.items.length){let i=0;while(i*2+1<this.items.length){let c=i*2+1;if(c+1<this.items.length&&this.items[c+1].f<this.items[c].f)c++;if(this.items[c].f>=end.f)break;this.items[i]=this.items[c];i=c;}this.items[i]=end;}return top;}
  }
  function findRoute(start,goal,blocked,cost=()=>1,width=128,height=128,maxExpanded=RULES.maxExpanded,minCost=1/RULES.truckSpeed){
    const valid=p=>object(p)&&integer(p.x,0,width-1)&&integer(p.y,0,height-1);
    if(!integer(width,1,128)||!integer(height,1,128)||!integer(maxExpanded,1,16384)||!finite(minCost,.1,1)||!valid(start)||!valid(goal)||typeof blocked!=='function'||blocked(goal.x,goal.y))return null;
    const origin=start.y*width+start.x,target=goal.y*width+goal.x;if(origin===target)return[];
    const best=new Float64Array(width*height);best.fill(Infinity);best[origin]=0;
    const previous=new Int32Array(width*height);previous.fill(-1);const open=new Heap();
    const h=(x,y)=>(Math.abs(x-goal.x)+Math.abs(y-goal.y))*minCost;
    open.push({i:origin,g:0,f:h(start.x,start.y)});let expanded=0;
    while(open.items.length&&expanded<maxExpanded){
      const q=open.pop();if(q.g!==best[q.i])continue;
      if(q.i===target){const path=[];for(let k=target;k!==origin;k=previous[k]){if(k<0||path.length>width*height)return null;path.push({x:k%width,y:Math.floor(k/width)});}return path.reverse();}
      expanded++;const x=q.i%width,y=Math.floor(q.i/width);
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height||blocked(nx,ny))continue;
        const rate=cost(nx,ny);if(!finite(rate,minCost,100))return null;
        const i=ny*width+nx,g=q.g+rate;if(g>=best[i]-1e-12)continue;best[i]=g;previous[i]=q.i;open.push({i,g,f:g+h(nx,ny)});
      }
    }return null;
  }
  class Engine{
    constructor(raw){this.state=normalize(raw);this.index=new Map(this.state.roads.map(p=>[key(p.x,p.y),p]));}
    snapshot(){return copy(this.state);}
    road(x,y){return this.index.get(key(x,y))||null;}
    at(x,y){if(!finite(x,0,4096)||!finite(y,0,4096))return null;return this.road(Math.floor(x/32),Math.floor(y/32));}
    multiplier(x,y,kind='friendly'){const p=this.at(x,y),s=surface(p);return p?.progress===1?(kind==='truck'?s.truckSpeed:kind==='hostile'?s.hostileSpeed:s.friendlySpeed):1;}
    commit(cells,stock,blocked,options){const q=quote(this.state,cells,stock,blocked,options);if(!q.ok)return q;
      for(const [k,n]of Object.entries(q.cost))stock[k]-=n;
      for(const p of q.cells){if(q.mode==='upgrade'){this.road(p.x,p.y).upgrade={surface:q.surface,progress:0};continue;}
        const item={...p,progress:0};if(q.surface!=='gravel')item.surface=q.surface;this.state.roads.push(item);this.index.set(key(p.x,p.y),item);}return q;
    }
    work(x,y,seconds){const p=this.road(x,y);if(!p||!unfinished(p)||!finite(seconds,0,RULES.maxStep*RULES.playerWork)||seconds===0)return false;
      if(p.upgrade){const u=p.upgrade,required=SURFACES[u.surface].workSeconds-surface(p).workSeconds;u.progress=Math.min(1,u.progress+seconds/required);
        if(u.progress<1-1e-9)return false;p.surface=u.surface;delete p.upgrade;return true;}
      p.progress=Math.min(1,p.progress+seconds/surface(p).workSeconds);if(p.progress>1-1e-9)p.progress=1;
      if(p.progress===1){this.state.stats.laid=Math.min(1e12,this.state.stats.laid+1);return true;}return false;
    }
    remove(x,y){const p=this.road(x,y);if(!p)return false;this.state.roads=this.state.roads.filter(r=>r!==p);this.index.delete(key(x,y));return true;}
    assign(id){if(!integer(id,1)||this.state.crew.length>=RULES.maxCrew||this.state.crew.some(u=>u.id===id))return false;this.state.crew.push({id,returning:false});return true;}
    recall(id){const u=this.state.crew.find(u=>u.id===id);if(!u)return false;u.returning=true;return true;}
    remember(b,at){const record={id:b.id,type:b.type,gx:b.gx,gy:b.gy,rotation:b.rotation||0,at};
      if(b.type==='core')return false;normalize({...create(),ruins:[record]});
      this.state.ruins=this.state.ruins.filter(r=>r.id!==b.id&&(r.gx!==b.gx||r.gy!==b.gy));this.state.ruins.push(record);
      if(this.state.ruins.length>RULES.maxRuins){this.state.ruins.shift();this.state.stats.forgotten=Math.min(1e12,this.state.stats.forgotten+1);}return true;
    }
    forget(id,rebuilt=false){const i=this.state.ruins.findIndex(r=>r.id===id);if(i===-1)return false;this.state.ruins.splice(i,1);if(rebuilt)this.state.stats.reconstructed=Math.min(1e12,this.state.stats.reconstructed+1);return true;}
  }
  function install(C){
    if(!C||C.Infrastructure)return;
    for(const [id,b]of Object.entries(BUILDINGS)){if(Object.hasOwn(C.BUILDINGS,id))throw Error('Construction en conflit : '+id);C.BUILDINGS[id]=b;}
    const old=C.migrateSaveData;C.migrateSaveData=raw=>{
      if(!object(raw))return null;
      if(raw.version===8){if(raw.infrastructure===undefined)fail('registre v8 absent');const state=normalize(raw.infrastructure),base=old({...raw,version:7});return base?{...base,version:8,infrastructure:state}:null;}
      if(![1,2,3,4,5,6,7].includes(raw.version))return null;const base=old(raw);return base?{...base,version:8,infrastructure:create()}:null;
    };
    const previousPath=C.findFriendlyPath;
    if(typeof previousPath==='function')C.findFriendlyPath=function(...args){return root.DEADWALL?.infrastructure?root.DEADWALL.infrastructure.findPath(...args):previousPath(...args);};
    C.SAVE_VERSION=8;C.SAVE_KEY='deadwall-save-v8';C.SAVE_BACKUP_KEY='deadwall-save-backup-v8';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v7','deadwall-save-backup-v7',...(C.LEGACY_SAVE_KEYS||[])])];C.INFRASTRUCTURE_RULES=RULES;C.Infrastructure=API;
  }
  const API=Object.freeze({VERSION,RULES,SURFACES,BUILDINGS,surface,surfaceStatus,unfinished,create,normalize,line,quote,findRoute,Engine,install});root.DeadwallInfrastructure=API;
  if(typeof module!=='undefined'&&module.exports&&!module.exports.BUILDINGS)module.exports=API;if(root.DeadwallCore)install(root.DeadwallCore);
})(typeof globalThis!=='undefined'?globalThis:this);

/* DEADWALL INFRASTRUCTURE 1.6 — END */

/* 1.10: a dispatch owns an existing worker; all material remains in Dayworks and Unit.carry. */
(function installSalvageRules(root){
 'use strict';const C=root.DeadwallCore;if(!C||C.Salvage)return;
 const RULES=Object.freeze({saveVersion:9,maxCrews:4,perWarehouse:2,cost:Object.freeze({food:4}),range:48,homeRange:65,dangerRadius:115,rate:1.5,maxStep:.25,maxCounter:1e9});
 const empty=()=>({version:1,crews:[],stats:{dispatched:0,returned:0,lost:0}});
 function normalize(raw){
  if(raw===undefined)return empty();const fail=msg=>{throw Error('Récupération de terrain invalide : '+msg+'.')};
  if(!raw||raw.version!==1||!Array.isArray(raw.crews)||raw.crews.length>RULES.maxCrews||!raw.stats)fail('registre');
  const ids=new Set(),sites=new Set(),crews=raw.crews.map(c=>{
   if(!c||!Number.isInteger(c.id)||c.id<1||c.id>0x7ffffffe||ids.has(c.id)||!Object.hasOwn(C.Dayworks.BY_ID,c.site)||sites.has(c.site)||typeof c.returning!=='boolean'||typeof c.prepared!=='boolean')fail('affectation');
   ids.add(c.id);sites.add(c.site);return{id:c.id,site:c.site,returning:c.returning,prepared:c.prepared};
  });
  const stats={};for(const key of ['dispatched','returned','lost']){const v=raw.stats[key];if(!Number.isInteger(v)||v<0||v>RULES.maxCounter)fail('compteur');stats[key]=v;}
  if(stats.dispatched!==stats.returned+stats.lost+crews.length)fail('bilan des équipes');return{version:1,crews,stats};
 }
 const old=C.migrateSaveData;
 C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const newer=raw.version===9;if(newer&&raw.salvage===undefined)throw Error('Sauvegarde v9 sans équipes de récupération.');const state=normalize(newer?raw.salvage:undefined),base=old(newer?{...raw,version:8}:raw);return base?{...base,version:9,salvage:state}:null;};
 C.Salvage=Object.freeze({RULES,empty,normalize});C.SAVE_VERSION=9;C.SAVE_KEY='deadwall-save-v9';C.SAVE_BACKUP_KEY='deadwall-save-backup-v9';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v8','deadwall-save-backup-v8',...C.LEGACY_SAVE_KEYS])];
})(typeof globalThis!=='undefined'?globalThis:this);

/* 1.11 — long-term city growth and scheduled blackout nights. */
(function(root){
 'use strict';const C=root.DeadwallCore;if(C.Urban)return;
 const rules=Object.freeze({blackoutFirst:4,blackoutEvery:3,flashRange:190,flashHalfAngle:.42,lightStep:12,lightRays:56,detectThreshold:.72,maxLights:85,flashlightDefault:false});
 const labels=['REFUGE','CAMP FORTIFIÉ','AVANT-POSTE','FORTERESSE','VILLE','GRANDE VILLE','MÉTROPOLE'];
 C.CITY_TIERS.forEach((t,i)=>t.name=labels[i]);
 for(const [name,requiredScore]of [['GRANDE MÉTROPOLE',420],['MÉGAVILLE I',750],['MÉGAVILLE II',1200],['MÉGAVILLE III',1850]])C.CITY_TIERS.push({id:C.CITY_TIERS.length,name,requiredScore});
 const defs={};
 function add(id,name,tier,kind,size,cost,extra){const def={id,name,category:kind==='lamp'?'defense':kind==='housing'||kind==='hospital'||kind==='storage'?'colony':'industry',icon:kind==='lamp'?'☼':kind==='housing'?'▥':kind==='hospital'?'+':'▦',description:'',symbol:name.split(' ').map(s=>s[0]).join('').slice(0,3),size,cost,unlockTier:tier,score:Math.max(2,3+tier*5),buildTime:18+tier*5,health:650+tier*170,color:'#59685e',roof:'#7b8a78',urbanKind:kind,...extra};defs[id]=def;C.BUILDINGS[id]=def;return def;}
 add('beacon','Balise de secours',0,'lamp',[1,1],{wood:8,scrap:10},{score:.5,powerUse:1,light:115,description:'Petit éclairage fixe de proximité. Une alimentation complète est nécessaire ; aucun tir.'});
 add('streetlight','Lampadaire de cité',1,'lamp',[1,1],{wood:12,scrap:22},{score:1,powerUse:1,light:210,description:'Éclaire une rue dans les nuits noires. Consomme une unité électrique ; sans courant, le halo disparaît.'});
 add('searchlight','Projecteur directionnel',1,'lamp',[2,2],{wood:25,scrap:60,fuel:6},{score:4,powerUse:3,light:440,beamHalfAngle:.5,requires:'generator',description:'Faisceau orientable, arrêté par les murs. Trois unités électriques et un générateur construit ; aucun dégât.'});
 add('rowHomes','Maisons en bande',2,'housing',[4,3],{wood:120,scrap:60,stone:50},{housing:18,powerUse:1,light:90,floors:2,requires:'house',description:'Dix-huit logements dans une même emprise. Les habitants restent à recruter et à nourrir.'});
 add('solarCourt','Cour solaire',2,'solar',[4,3],{wood:80,scrap:150,stone:70},{powerGen:18,solar:true,requires:'workshop',description:'Produit 18 unités électriques uniquement pendant le calme diurne. Pas de batterie : aucune production pendant l’alerte et la nuit.'});
 add('apartment','Immeuble de quartier',3,'housing',[4,4],{wood:140,scrap:140,stone:180},{housing:32,powerUse:2,light:100,floors:4,requires:'house',description:'Trente-deux logements, deux unités électriques pour ses services et fenêtres. Aucune population gratuite.'});
 add('centralStore','Magasin central',3,'storage',[5,4],{wood:140,scrap:180,stone:140},{storage:1800,storageDepot:true,powerUse:1,requires:'warehouse',description:'Ajoute 1 800 places par ressource et un véritable point de dépôt. Ne produit et ne transporte rien.'});
 add('hospital','Hôpital de ville',4,'hospital',[5,4],{wood:120,scrap:220,stone:220,medicine:30},{powerUse:5,light:130,medicalRadius:175,healRate:1.4,medicinePerHealth:.03,requires:'clinic',description:'Soigne les personnes présentes et accessibles, contre médicaments et électricité. Ni résurrection ni remède à la contamination.'});
 add('marketHall','Halle alimentaire',4,'food',[5,4],{wood:120,scrap:150,stone:180},{powerUse:3,production:{food:1.15},consumes:{fuel:.025},requires:'farm',description:'Prépare de la nourriture avec du carburant et du courant. Arrête les intrants quand la réserve de sortie est pleine.'});
 add('logisticsCenter','Centre logistique',4,'storage',[5,4],{wood:140,scrap:210,stone:180},{storage:2200,storageDepot:true,powerUse:2,requires:'warehouse',description:'Ajoute 2 200 places par ressource et accepte les dépôts physiques. Pas de convoyeur ou de véhicule gratuit.'});
 add('powerPlant','Centrale de quartier',5,'power',[5,4],{scrap:350,stone:280,fuel:70},{powerGen:90,generatorFuel:.065,requires:'generator',explosive:90,description:'90 unités électriques contre 3,9 carburant par minute. Une pénurie ou un incendie coupe la production.'});
 add('recyclingPlant','Usine de valorisation',5,'scrap',[5,4],{wood:140,scrap:250,stone:220},{powerUse:6,production:{scrap:1.2},consumes:{fuel:.07},requires:'scrapyard',description:'Filière industrielle de ferraille, contre carburant et courant. Plus dense mais plus exigeante que le recyclage initial.'});
 add('rationPlant','Cuisine industrielle',5,'food',[5,4],{wood:140,scrap:280,stone:200},{powerUse:5,production:{food:2},consumes:{fuel:.09},requires:'marketHall',description:'Approvisionne une grande ville en rations. Sans carburant, courant ou espace de stockage, elle cesse sa production.'});
 add('residentialTower','Tour résidentielle',6,'housing',[4,4],{wood:180,scrap:350,stone:480},{housing:64,powerUse:5,light:145,floors:8,requires:'apartment',description:'Soixante-quatre logements en hauteur. Le bâtiment est visible en relief ; les étages ne sont pas visitables.'});
 add('cementWorks','Complexe de granulats',6,'stone',[5,4],{wood:120,scrap:320,stone:300},{powerUse:7,production:{stone:1.4},consumes:{scrap:.12,fuel:.06},requires:'quarry',description:'Produit les matériaux des grandes enceintes, contre ferraille, carburant et courant.'});
 add('cityArsenal','Arsenal métropolitain',6,'ammo',[5,4],{scrap:450,stone:350,fuel:65},{powerUse:8,production:{ammo:2.6},consumes:{scrap:.45,fuel:.06},requires:'ammoFactory',explosive:100,description:'Production de munitions à grande échelle. Les défenses les consomment toujours dans la réserve commune.'});
 add('logisticsHub','Plateforme métropolitaine',7,'storage',[7,5],{wood:280,scrap:600,stone:550},{storage:6000,storageDepot:true,powerUse:3,requires:'logisticsCenter',description:'Six mille places supplémentaires par ressource. Son large terrain et ses accès doivent être défendus.'});
 add('housingComplex','Ensemble résidentiel',7,'housing',[6,5],{wood:280,scrap:520,stone:700},{housing:128,powerUse:8,light:165,floors:12,requires:'residentialTower',description:'Cent vingt-huit places de logement. Les habitants ne sont ni créés ni téléportés ; alimentation et recrutement restent séparés.'});
 add('regionalHospital','Centre hospitalier',7,'hospital',[6,5],{wood:220,scrap:580,stone:550,medicine:65},{powerUse:7,light:170,medicalRadius:230,healRate:1.8,medicinePerHealth:.03,requires:'hospital',description:'Soins de proximité sur une zone plus large, payés en médicaments. Les murs fermés empêchent les soins au travers.'});
 add('megaHousing','Grand ensemble fortifié',8,'housing',[7,6],{wood:380,scrap:850,stone:1100},{housing:220,powerUse:14,light:190,floors:15,requires:'housingComplex',description:'Deux cent vingt logements dans plusieurs volumes élevés. Ce n’est pas un rempart : protégez le quartier par une enceinte.'});
 add('fuelWorks','Raffinerie urbaine',8,'fuel',[6,5],{wood:260,scrap:700,stone:750,fuel:140},{powerUse:10,production:{fuel:.9},consumes:{wood:.6,scrap:.12},requires:'refinery',explosive:130,description:'Valorise bois et ferraille en carburant avec du courant. Sa destruction reste explosive.'});
 add('districtSearchlight','Projecteur de grand périmètre',8,'lamp',[2,2],{scrap:380,stone:190,fuel:30},{score:12,powerUse:7,light:700,beamHalfAngle:.6,requires:'powerPlant',description:'Faisceau long pour les fronts d’une mégaville. Sept unités électriques ; les obstacles coupent sa lumière.'});
 add('megaTower','Tour de mégaville',9,'housing',[5,5],{wood:500,scrap:1100,stone:1600},{housing:360,powerUse:20,light:220,floors:20,requires:'megaHousing',description:'Trois cent soixante logements. Volume de vingt niveaux représentés, sans intérieurs visitables ni habitants gratuits.'});
 add('agroComplex','Complexe nourricier',9,'food',[7,6],{wood:450,scrap:900,stone:950},{powerUse:15,production:{food:5},consumes:{fuel:.22},requires:'rationPlant',description:'Alimentation d’une mégaville contre carburant et électricité. La production reste limitée par les intrants et le stockage.'});
 add('megaPower','Centrale de mégaville',10,'power',[6,6],{scrap:1500,stone:1400,fuel:260},{powerGen:210,generatorFuel:.16,requires:'powerPlant',explosive:140,description:'210 unités électriques contre 9,6 carburant par minute. Une panne de combustible plonge ses réseaux dans le noir.'});
 add('megaReserve','Réserve stratégique de mégaville',10,'storage',[8,6],{wood:650,scrap:1400,stone:1500},{storage:15000,storageDepot:true,powerUse:5,requires:'logisticsHub',description:'Quinze mille places par ressource, accessibles aux porteurs. Aucun stock livré avec le bâtiment.'});
 function score(buildings){return Array.from(buildings).reduce((n,b)=>n+(!b.dead&&(b.completed===true||b.progress===1)?C.BUILDINGS[b.type]?.score||0:0),0);}
 function empty(){return{version:1,peakScore:0,skipNightWave:0,flashlight:rules.flashlightDefault};}
 function normalize(raw){if(raw===undefined)return empty();if(!raw||raw.version!==1||!Number.isFinite(raw.peakScore)||raw.peakScore<0||raw.peakScore>1e12||!Number.isInteger(raw.skipNightWave)||raw.skipNightWave<0||raw.skipNightWave>1e7||typeof raw.flashlight!=='boolean')throw Error('Registre de ville et nuit invalide.');const out={version:1,peakScore:raw.peakScore,skipNightWave:raw.skipNightWave,flashlight:raw.flashlight};
  if(raw.progression151!==undefined){const p=raw.progression151;if(!p||p.version!==1||!Number.isInteger(p.age)||p.age<0||p.age>=C.CITY_TIERS.length||p.age>C.cityTier(raw.peakScore).id)throw Error('Progression urbaine invalide.');out.progression151={version:1,age:p.age};}return out;}
 const old=C.migrateSaveData;
 C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===10;if(modern&&raw.urban===undefined)throw Error('Sauvegarde v10 sans registre urbain.');const u=normalize(modern?raw.urban:undefined),base=old(modern?{...raw,version:9}:raw);if(!base)return null;if(!modern){u.peakScore=score(base.buildings||[]);u.skipNightWave=base.phase==='calm'?0:base.wave||0;}return{...base,version:10,urban:u};};
 C.Urban=Object.freeze({RULES:rules,BUILDINGS:Object.freeze(defs),empty,normalize,score});C.SAVE_VERSION=10;C.SAVE_KEY='deadwall-save-v10';C.SAVE_BACKUP_KEY='deadwall-save-backup-v10';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v9','deadwall-save-backup-v9',...C.LEGACY_SAVE_KEYS])];
})(globalThis);

/* 1.12 — energy reserves own real stored charge; circuit commands never create power. */
(function(root){
 'use strict';const C=root.DeadwallCore;if(C.PowerGrid)return;
 const RULES=Object.freeze({efficiency:.9,maxStep:.25,previewStep:.04,maxBatteries:128,maxCircuits:4096,epsilon:1e-7,refreshMs:500});
 const battery=(id,name,tier,size,cost,capacity,chargeRate,output,requires)=>({id,name,category:'industry',icon:'▣',symbol:'BAT',size,cost,unlockTier:tier,score:5+tier*3,buildTime:20+tier*4,health:700+tier*110,color:'#52675b',roof:'#90a48b',requires,
   description:`Réserve de ${capacity} unités-secondes, vide à la construction. Charge sur le surplus, rendement 90 %. Débit maximal ${output}. Aucun courant créé.`,battery:Object.freeze({capacity,chargeRate,output}),gridKind:'battery'});
 const BUILDINGS=Object.freeze({
  batteryCabinet:battery('batteryCabinet','Armoire de secours',2,[2,2],{wood:45,scrap:100,stone:50},900,6,8,'generator'),
  batteryStation:battery('batteryStation','Station d’accumulation',5,[4,3],{wood:120,scrap:350,stone:300},3600,18,24,'powerPlant'),
  batteryComplex:battery('batteryComplex','Réserve électrique métropolitaine',8,[5,4],{wood:250,scrap:900,stone:700},12000,48,60,'powerPlant')
 });
 for(const[id,b]of Object.entries(BUILDINGS)){if(C.BUILDINGS[id])throw Error('Batterie déjà déclarée.');C.BUILDINGS[id]=b;}
 const MODES=Object.freeze(['auto','night','isolated']),CIRCUITS=Object.freeze(['on','day','night','off']);
 const empty=()=>({version:1,batteries:[],circuits:[],priority:'standard'});
 function normalize(raw){
  if(raw===undefined)return empty();const fail=m=>{throw Error('Réseau de secours invalide : '+m+'.')};
  if(!raw||raw.version!==1||!Array.isArray(raw.batteries)||raw.batteries.length>RULES.maxBatteries||!Array.isArray(raw.circuits)||raw.circuits.length>RULES.maxCircuits||!['standard','lights'].includes(raw.priority))fail('format');
  const ids=new Set(),circuits=new Set();
  const batteries=raw.batteries.map(b=>{if(!b||!Number.isInteger(b.id)||b.id<1||b.id>0x7ffffffe||ids.has(b.id)||!Number.isFinite(b.charge)||b.charge<0||b.charge>12000||!MODES.includes(b.mode))fail('batterie');ids.add(b.id);return{id:b.id,charge:b.charge,mode:b.mode}});
  const control=raw.circuits.map(c=>{if(!c||!Number.isInteger(c.id)||c.id<1||c.id>0x7ffffffe||circuits.has(c.id)||!CIRCUITS.includes(c.mode)||c.mode==='on')fail('circuit');circuits.add(c.id);return{id:c.id,mode:c.mode}});
  return{version:1,batteries,circuits:control,priority:raw.priority};
 }
 function enabled(mode,phase){return mode==='on'||mode==='day'&&phase==='calm'||mode==='night'&&phase!=='calm';}
 /* Pure allocation: draw only delivered battery power, never the unaccepted offer. */
 function plan({generation,consumers,batteries,phase,priority='standard',dt=RULES.previewStep}){
  if(!Number.isFinite(generation)||generation<0||!Number.isFinite(dt)||dt<=0||dt>RULES.maxStep)throw Error('Pas électrique invalide.');
  const demand=consumers.reduce((n,b)=>n+b.need,0),offers=batteries.map(b=>({id:b.id,power:b.mode==='isolated'||b.mode==='night'&&phase==='calm'?0:Math.min(b.output,b.charge/dt)}));
  let remaining=generation+offers.reduce((n,b)=>n+b.power,0),delivered=0;
  const ranked=consumers.slice().sort((a,b)=>(priority==='lights'?(a.light?0:1)-(b.light?0:1):0)||a.rank-b.rank||b.priority-a.priority||a.id-b.id);
  const allocation=ranked.map(c=>{const full=remaining+RULES.epsilon>=c.need,share=full?1:c.partial?Math.min(1,remaining/Math.max(1,c.need)):0,power=c.need*share;remaining=Math.max(0,remaining-power);delivered+=power;return{id:c.id,power,share,powered:full}});
  let toDraw=Math.max(0,delivered-generation),spare=Math.max(0,generation-delivered),chargeInput=0;const changes=[];
  for(const b of batteries){const offer=offers.find(o=>o.id===b.id).power,draw=Math.min(toDraw,offer);toDraw=Math.max(0,toDraw-draw);let input=0;
   if(demand<=generation+RULES.epsilon&&delivered<=generation+RULES.epsilon&&b.mode!=='isolated'){input=Math.min(spare,b.chargeRate,(b.capacity-b.charge)/(dt*RULES.efficiency));spare=Math.max(0,spare-input);chargeInput+=input;}
   const stored=input*dt*RULES.efficiency,used=draw*dt;changes.push({id:b.id,stored,used,input,output:draw,charge:Math.max(0,Math.min(b.capacity,b.charge+stored-used))});
  }
  const batteryOutput=changes.reduce((n,c)=>n+c.output,0);
  return{generation,demand,delivered,batteryOutput,chargeInput,spare,shortfall:Math.max(0,demand-delivered),allocation,changes};
 }
 const old=C.migrateSaveData;
 C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===11;if(modern&&raw.powerGrid===undefined)throw Error('Sauvegarde v11 sans réserve électrique.');const s=normalize(modern?raw.powerGrid:undefined),base=old(modern?{...raw,version:10}:raw);return base?{...base,version:11,powerGrid:s}:null;};
 C.PowerGrid=Object.freeze({RULES,BUILDINGS,MODES,CIRCUITS,empty,normalize,enabled,plan});C.SAVE_VERSION=11;C.SAVE_KEY='deadwall-save-v11';C.SAVE_BACKUP_KEY='deadwall-save-backup-v11';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v10','deadwall-save-backup-v10',...C.LEGACY_SAVE_KEYS])];
})(globalThis);

/* 1.13: expedition rules for the DEADWALL video game. */
(function(root){'use strict';const C=root.DeadwallCore;if(C.Expeditions)return;
 const RULES=Object.freeze({tank:24,cargo:80,carHealth:320,carRadius:22,speed:285,acceleration:300,fuelPerUnit:.003,range:65,homeRange:150,researchSeconds:45,researchFood:2,maxIntel:40,clueIntel:2,lootRate:3,maxStep:.25,danger:125,tradePrice:4,tradeBatch:5,tradeStock:30,departureFood:3,buildCar:Object.freeze({wood:40,scrap:90}),repairCost:Object.freeze({scrap:15}),repairHealth:80,analystCost:Object.freeze({food:2}),dayMin:12});
 const make=(id,name,tier,size,cost,extra)=>({id,name,category:'colony',icon:'⌁',symbol:'EXP',description:'',size,cost,unlockTier:tier,score:8,health:850,buildTime:26,color:'#596d62',roof:'#a0a589',...extra});
 const BUILDINGS=Object.freeze({expeditionOffice:make('expeditionOffice','Bureau des expéditions',1,[3,2],{wood:50,scrap:65},{requires:'planningOffice',powerUse:1,description:'Un ouvrier attitré rejoint le bureau pour analyser les renseignements au calme. Chaque renseignement exige 45 secondes de travail alimenté et deux rations.'}),expeditionGarage:make('expeditionGarage','Garage des sorties',1,[3,3],{wood:65,scrap:80},{requires:'planningOffice',description:'Permet de remettre un break en service au centre, puis de le réparer. Véhicule payé séparément et réservoir vide ; aucune expédition automatique.'})});Object.assign(C.BUILDINGS,BUILDINGS);
 const stop=(id,name,x,y,intel,kind,resource,amount,fuel,text)=>Object.freeze({id,name,x,y,intel,kind,resource,amount,fuel,text,seconds:kind==='archives'?10:6});
 const SITES=Object.freeze([
 stop('station','La station des Trois Bornes',2176,864,0,'fuel','fuel',22,0,'Les cuves de la station ne sont pas vides. Descendez du véhicule et récupérez les réserves.'),
 stop('roseraie','Le garage de la Roseraie',3216,2176,0,'garage','scrap',48,8,'Des pièces restent dans les établis. Les bidons serviront au retour ; le matériel devra être chargé dans le break.'),
 stop('relais','Le relais du kilomètre 17',864,2176,0,'supply','food',48,8,'Les chauffeurs ont abandonné leur réserve de route. Les papiers du relais indiquent d’autres haltes.'),
 stop('archives','Les archives de la voirie',1248,1056,2,'archives','scrap',26,6,'Les plans routiers ont survécu dans une armoire métallique. Leur relevé demande plus de temps qu’une simple fouille.'),
 stop('clinique','Le dispensaire des Quatre Vents',2848,1056,4,'medical','medicine',18,6,'Un dispensaire évacué, des réserves médicales limitées. Aucun survivant n’est créé par cette fouille.'),
 stop('poste','Le poste routier abandonné',3296,1312,6,'ammo','ammo',55,7,'Les réserves du poste de contrôle complètent les stocks et les renseignements du bureau.'),
 stop('chantier','La base-vie du chantier',3296,2848,8,'supply','wood',65,10,'Les réserves de chantier sont éparpillées derrière les baraquements. Plusieurs chargements peuvent être nécessaires.'),
 stop('pompes','Les pompes du canal',2720,3296,10,'fuel','fuel',32,0,'Une seconde réserve de carburant, plus éloignée du centre. Le carburant reste à transporter.'),
 stop('tri','La plateforme de tri',2176,3440,12,'garage','scrap',75,10,'Le tri n’a jamais été achevé. Un coffre plein impose de choisir entre un détour et un retour au dépôt.'),
 stop('depot','Le dépôt de matériaux',1248,3296,14,'supply','stone',80,10,'Les palettes intactes pourraient financer une nouvelle enceinte. Le chargement consomme du temps de jour.'),
 stop('laboratoire','Le laboratoire vétérinaire',736,2848,16,'medical','medicine',24,8,'Des traitements et des fiches de transfert, pas un remède universel. Les stocks restent limités.'),
 stop('terminal','Le terminal des anciens convois',704,1312,18,'archives','ammo',85,12,'Dernière halte identifiée par la chaîne de renseignements. Ramenez les réserves avant la nuit.')]);
 const BY_ID=Object.freeze(Object.fromEntries(SITES.map(s=>[s.id,s])));
 const initial=()=>({version:1,intel:0,sites:SITES.map(d=>({id:d.id,known:d.intel===0,progress:0,reported:false,stock:C.makeBag({[d.resource]:d.amount,...(d.resource!=='fuel'?{fuel:d.fuel}:{})})})),analyst:null,vehicle:null,active:null,trade:{wave:1,remaining:RULES.tradeStock},stats:{built:0,departed:0,returned:0,lost:0,distance:0,fuelUsed:0,delivered:0,reports:0}});
 function normalize(raw){if(raw===undefined)return initial();const bad=m=>{throw Error('Expéditions invalides : '+m+'.')},num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max,id=x=>Number.isSafeInteger(x)&&x>0&&x<0x7ffffffe;
  if(!raw||raw.version!==1||!Number.isInteger(raw.intel)||!num(raw.intel,0,40)||!Array.isArray(raw.sites)||raw.sites.length!==SITES.length||!raw.stats||!raw.trade)bad('registre');
  const out=initial(),seen=new Set();out.intel=raw.intel;
  out.sites=raw.sites.map(s=>{const d=BY_ID[s?.id];if(!d||seen.has(s.id)||typeof s.known!=='boolean'||typeof s.reported!=='boolean'||!num(s.progress,0,d.seconds)||s.reported!==(s.progress===d.seconds)||!s.stock)bad('lieu');seen.add(s.id);const stock=C.makeBag();for(const k of C.RESOURCE_KEYS){const cap=k===d.resource?d.amount:k==='fuel'?d.fuel:0;if(!num(s.stock[k],0,cap))bad('réserve');stock[k]=s.stock[k];}if((s.reported||C.bagTotal(stock)<d.amount+d.fuel)&&!s.known)bad('lieu non repéré');return{id:s.id,known:s.known,progress:s.progress,reported:s.reported,stock};});
  if(raw.analyst!==null){const a=raw.analyst;if(!a||!id(a.id)||!id(a.post)||!num(a.progress,0,RULES.researchSeconds)||typeof a.returning!=='boolean')bad('analyste');out.analyst={id:a.id,post:a.post,progress:a.progress,returning:a.returning};}
  if(raw.vehicle!==null){const v=raw.vehicle;if(!v||!id(v.id)||!num(v.x,26,C.WORLD_SIZE-26)||!num(v.y,26,C.WORLD_SIZE-26)||!num(v.health,0,800)||!num(v.fuel,0,80)||!num(v.angle,-Math.PI,Math.PI)||typeof v.driving!=='boolean'||!v.cargo)bad('véhicule');const cargo=C.makeBag();for(const k of C.RESOURCE_KEYS){if(!num(v.cargo[k],0,300))bad('coffre');cargo[k]=v.cargo[k];}if(C.bagTotal(cargo)>300.000001||v.health===0&&(v.fuel>0||v.driving||C.bagTotal(cargo)>0))bad('épave');out.vehicle={id:v.id,x:v.x,y:v.y,health:v.health,fuel:v.fuel,angle:v.angle,driving:v.driving,cargo};}
  if(raw.active!==null){if(!raw.active||!BY_ID[raw.active.id]||!Number.isSafeInteger(raw.active.wave)||!num(raw.active.wave,1,1e7))bad('sortie');out.active={id:raw.active.id,wave:raw.active.wave};}
  if(!Number.isInteger(raw.trade.wave)||!num(raw.trade.wave,1,1e7)||!num(raw.trade.remaining,0,RULES.tradeStock))bad('troc');out.trade={wave:raw.trade.wave,remaining:raw.trade.remaining};
  for(const k of Object.keys(out.stats)){if(!num(raw.stats[k],0,1e12)||!['distance','fuelUsed','delivered'].includes(k)&&!Number.isInteger(raw.stats[k]))bad('compteur');out.stats[k]=raw.stats[k];}
  if(out.stats.returned>out.stats.departed||out.stats.lost>out.stats.built||out.stats.reports!==out.sites.filter(s=>s.reported).length||out.intel<Math.min(40,out.stats.reports*2))bad('bilan');return out;
 }
 const old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===12;if(modern&&raw.expeditions===undefined)throw Error('Sauvegarde v12 sans expéditions.');const s=normalize(modern?raw.expeditions:undefined),base=old(modern?{...raw,version:11}:raw);if(!base)return null;if(!modern)s.trade.wave=base.wave;return{...base,version:12,expeditions:s};};
 C.Expeditions=Object.freeze({RULES,BUILDINGS,SITES,BY_ID,initial,normalize});C.SAVE_VERSION=12;C.SAVE_KEY='deadwall-save-v12';C.SAVE_BACKUP_KEY='deadwall-save-backup-v12';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v11','deadwall-save-backup-v11',...C.LEGACY_SAVE_KEYS])];
})(globalThis);

/* 1.14 — shared field rules and versioned physical placements. */
(function(root){
 'use strict';const C=root.DeadwallCore;if(C.Fieldcraft)return;
 const RULES=Object.freeze({moveRate:.2,rotateRate:.05,range:78,transition:8,penalty:.8,reloadGoodStart:.44,reloadGoodEnd:.70,reloadPerfectStart:.53,reloadPerfectEnd:.60,maxNodes:4096});
 const empty=()=>({version:1,nodes:[],opacity:null,attempt:false,outcome:'',legacyLayout:true,weatherTarget:0});
 function normalize(raw){
  if(raw===undefined)return empty();
  if(!raw||raw.version!==1||!Array.isArray(raw.nodes)||raw.nodes.length>RULES.maxNodes||!(raw.opacity===null||Number.isFinite(raw.opacity)&&raw.opacity>=0&&raw.opacity<=1)||typeof raw.attempt!=='boolean'||!['','normal','good','perfect','failed'].includes(raw.outcome))throw Error('Registre de terrain invalide.');
  const ids=new Set();const nodes=raw.nodes.map(n=>{if(!Array.isArray(n)||n.length!==3||!Number.isInteger(n[0])||n[0]<1||ids.has(n[0])||!Number.isFinite(n[1])||!Number.isFinite(n[2])||n[1]<0||n[2]<0||n[1]>C.WORLD_SIZE||n[2]>C.WORLD_SIZE)throw Error('Emplacement de décor invalide.');ids.add(n[0]);return n.slice();});
  return{version:1,nodes,opacity:raw.opacity,attempt:raw.attempt,outcome:raw.outcome};
 }
 const previous=C.migrateSaveData;
 C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===13;if(modern&&!raw.fieldcraft)throw Error('Sauvegarde v13 sans registre de terrain.');const record=normalize(modern?raw.fieldcraft:undefined),base=previous(modern?{...raw,version:12}:raw);return base?{...base,version:13,fieldcraft:record}:null;};
 C.Fieldcraft=Object.freeze({RULES,empty,normalize});C.SAVE_VERSION=13;C.SAVE_KEY='deadwall-save-v13';C.SAVE_BACKUP_KEY='deadwall-save-backup-v13';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v12','deadwall-save-backup-v12',...C.LEGACY_SAVE_KEYS])];
})(globalThis);

/* 1.15 — regional exploration has a separate metre-based spatial domain. */
(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallFrontierState||(typeof require==='function'?require('./frontier-state.js'):null),W=root.DeadwallFrontierWorld||(typeof require==='function'?require('./frontier-world.js'):null);C.Frontier={...S,RULES:W.RULES};const previous=C.migrateSaveData;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===14;if(modern&&raw.frontier===undefined)throw Error('Sauvegarde v14 sans région.');const d=previous(modern?{...raw,version:13}:raw);return d?{...d,version:14,frontier:S.normalize(modern?raw.frontier:undefined)}:null;};C.SAVE_VERSION=14;C.SAVE_KEY='deadwall-save-v14';C.SAVE_BACKUP_KEY='deadwall-save-backup-v14';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v13','deadwall-save-backup-v13',...C.LEGACY_SAVE_KEYS])];})(globalThis);

(function(root){'use strict';const C=root.DeadwallCore,old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===15;if(modern&&raw.frontier?.version!==2)throw Error('Sauvegarde v15 sans carnet régional.');const d=old(modern?{...raw,version:14}:raw);return d?{...d,version:15}:null;};C.SAVE_VERSION=15;C.SAVE_KEY='deadwall-save-v15';C.SAVE_BACKUP_KEY='deadwall-save-backup-v15';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v14','deadwall-save-backup-v14',...C.LEGACY_SAVE_KEYS])];})(globalThis);

/* 1.17: live reconnaissance rules, separate from resource and world generation randomness. */
(function(root){'use strict';const C=root.DeadwallCore;C.FrontierTacticsRules=Object.freeze({quietSpeed:1.65,quietVision:10,vision:22,nearVision:2.4,visionHalfAngle:1.15,walkNoise:7,quietNoise:1.8,runNoise:18,carNoise:36,workNoise:11,shotNoise:{pistol:42,rifle:58,shotgun:62},muffled:.45,pulse:.8,memory:12,search:3,enemySpeed:1.1,enemyRadius:.30,pathCell:.75,pathNodes:950,pathMargin:8,pathCooldown:1.1,pathBudget:2});const previous=C.migrateSaveData;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===16;if(modern&&(raw.frontier?.version!==2||typeof raw.frontier.quiet!=='boolean'||!raw.frontier.tracks))throw Error('Sauvegarde v16 sans reconnaissance');const d=previous(modern?{...raw,version:15}:raw);return d?{...d,version:16}:null;};C.SAVE_VERSION=16;C.SAVE_KEY='deadwall-save-v16';C.SAVE_BACKUP_KEY='deadwall-save-backup-v16';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v15','deadwall-save-backup-v15',...C.LEGACY_SAVE_KEYS])];})(globalThis);

/* 1.18 — no new region generation. Supply ledger is an additional migratable record. */
(function(root){'use strict';const C=root.DeadwallCore,L=root.DeadwallFrontierLogistics||(typeof require==='function'?require('./frontier-logistics.js'):null),old=C.migrateSaveData;const RULES=Object.freeze({cacheCapacity:60,maxCaches:16,cacheKinds:['crate','shelf','wardrobe'],cacheCost:{wood:6,scrap:4},cacheTime:5,healCost:{medicine:2},healAmount:35,healTime:4,repairCost:{scrap:12},repairAmount:50,repairTime:6,safeRadius:8,defaultReserve:2,detourFactor:1.25});L.configure(RULES);C.FieldSupplies=L;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===17;if(modern&&!raw.fieldSupplies)throw Error('Sauvegarde v17 sans relais.');const d=old(modern?{...raw,version:16}:raw);return d?{...d,version:17,fieldSupplies:L.normalize(modern?raw.fieldSupplies:undefined)}:null;};C.SAVE_VERSION=17;C.SAVE_KEY='deadwall-save-v17';C.SAVE_BACKUP_KEY='deadwall-save-backup-v17';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v16','deadwall-save-backup-v16',...C.LEGACY_SAVE_KEYS])];})(globalThis);

/* 1.19 — projection is derived, not a new world generation or save format. */
(function(root){const C=root.DeadwallCore;C.AtlasRules=Object.freeze({unitsPerMetre:32,localUnits:4096,regionSize:8192,homeMin:4032,homeSize:128,homeMax:4160,center:4096,localRoadHalf:66,maxZoom:256,minZoom:1,citySpan:190,gateHalf:2.6,entryBand:5,entryInset:60});})(globalThis);

/* 1.20 — bounded, read-only supply approach checks. Existing movement rules remain authoritative. */
(function(root){root.DeadwallCore.ReturnRouteRules=Object.freeze({cell:32,gridOffsets:[16,0,8,24],sample:4,maxExpanded:16384,gateOffsets:[0,-28,28,-56,56],footRadius:13,deliveryReach:70,linkRadius:72,localUnitsPerMetre:32,maxSimplifyLookAhead:24});})(globalThis);

/* 1.21 — field reconnaissance and planned tours; no new world generation. */
(function(root){'use strict';const C=root.DeadwallCore,A=root.DeadwallFieldAtlasState||(typeof require==='function'?require('./field-atlas-state.js'):null),old=C.migrateSaveData;A.configure(Object.freeze({cell:128,columns:64,maxCells:36864,maxReports:1000,maxStops:6,researchSeconds:40,researchCost:{food:5},batch:3,hintOffset:28,hintRadius:65,visitRange:12,recordSeconds:.2}));C.FieldAtlas=A;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===18;if(modern&&!raw.fieldAtlas)throw Error('Sauvegarde v18 sans reconnaissance régionale.');const d=old(modern?{...raw,version:17}:raw);return d?{...d,version:18,fieldAtlas:A.normalize(modern?raw.fieldAtlas:undefined)}:null;};C.SAVE_VERSION=18;C.SAVE_KEY='deadwall-save-v18';C.SAVE_BACKUP_KEY='deadwall-save-backup-v18';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v17','deadwall-save-backup-v17',...C.LEGACY_SAVE_KEYS])];})(globalThis);

/* 1.22 field recoveries and paid emergency preparations. */
(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallEssentialState||(typeof require==='function'?require('./essential-state.js'):null);S.configure(Object.freeze({inspectSeconds:4,workSeconds:{light:8,aid:7,brace:10,decoy:9},workCost:{light:{scrap:3},aid:{medicine:1,scrap:2},brace:{wood:4,scrap:2},decoy:{scrap:4,fuel:1}},packSpeed:.78,stockMax:32,beltMax:8,maxEffects:6,danger:7,reward:2,craftSeconds:5,kits:{light:{name:'Lampe de secours',cost:{scrap:5,fuel:2},radius:10,duration:60},aid:{name:'Trousse de relève',cost:{medicine:6,food:2},heal:40,totalHeal:120,radius:150},brace:{name:'Étai de brèche',cost:{wood:12,scrap:6},repair:160,reach:70},decoy:{name:'Avertisseur déporté',cost:{scrap:8,fuel:1},radius:38,duration:18}}}));C.Essentials=S;const old=C.migrateSaveData;C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===19;if(modern&&!raw.essentials)throw Error('Sauvegarde v19 sans services.');const d=old(modern?{...raw,version:18}:raw);return d?{...d,version:19,essentials:S.normalize(modern?raw.essentials:undefined)}:null;};C.SAVE_VERSION=19;C.SAVE_KEY='deadwall-save-v19';C.SAVE_BACKUP_KEY='deadwall-save-backup-v19';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v18','deadwall-save-backup-v18',...C.LEGACY_SAVE_KEYS])];})(globalThis);

/* 1.23 — monde vivant, flotte et annexes de D-17. */
(function(root){'use strict';const C=root.DeadwallCore,S=root.DeadwallWorldEvolutionState||(typeof require==='function'?require('./world-evolution-state.js'):null);
const vehicles={skate:{name:'Skate renforcé',tier:0,speed:6.2,fuel:0,tank:0,cargo:4,w:1,h:.45,health:45,cost:{wood:4,scrap:2}},bike:{name:'Vélo de ville',tier:0,speed:8.8,fuel:0,tank:0,cargo:12,w:1.8,h:.65,health:70,cost:{wood:8,scrap:10}},motorcycle:{name:'Moto légère',tier:1,speed:17,fuel:.0017,tank:10,cargo:18,w:2.15,h:.75,health:120,cost:{scrap:45}},compact:{name:'Voiture compacte',tier:1,speed:16,fuel:.0032,tank:20,cargo:55,w:4.05,h:1.72,health:260,cost:{wood:15,scrap:70}},break:{name:'Break de reconnaissance',tier:1,speed:18,fuel:.004,tank:24,cargo:80,w:4.6,h:1.85,health:320,cost:{wood:40,scrap:90}},buggy:{name:'Buggy tout-terrain',tier:2,speed:20,fuel:.0038,tank:22,cargo:48,w:3.5,h:1.75,health:250,cost:{wood:25,scrap:110}},van:{name:'Fourgon logistique',tier:2,speed:15,fuel:.0052,tank:32,cargo:140,w:5.3,h:2.05,health:430,cost:{wood:45,scrap:135}},bus:{name:'Bus d’évacuation barricadé',tier:3,speed:12,fuel:.0085,tank:55,cargo:210,w:10.4,h:2.55,health:650,cost:{wood:80,scrap:220}},truck:{name:'Camion de chantier',tier:4,speed:11,fuel:.0095,tank:65,cargo:260,w:7.4,h:2.5,health:760,cost:{wood:95,scrap:260}}};
const districtBuildings={housing:{name:'Habitat annexe',cost:{wood:90,stone:70,scrap:35},housing:8},workshop:{name:'Atelier annexe',cost:{wood:60,stone:45,scrap:75},storage:80},clinic:{name:'Poste sanitaire',cost:{wood:55,stone:40,scrap:55,medicine:8}},depot:{name:'Dépôt annexe',cost:{wood:65,stone:55,scrap:45},storage:140},watch:{name:'Tour de veille',cost:{wood:80,stone:50,scrap:50}},power:{name:'Micro-réseau',cost:{wood:45,stone:25,scrap:100,fuel:10},power:4}};
S.configure(Object.freeze({postures:{stand:{name:'Debout',speed:1,noise:1,vision:1},crouch:{name:'Accroupi',speed:.58,noise:.35,vision:.62},prone:{name:'Allongé',speed:.24,noise:.15,vision:.42}},surfaces:{asphalt:{name:'Goudron',speed:1,noise:1},floor:{name:'Sol intérieur',speed:1,noise:.8},gravel:{name:'Gravier',speed:.88,noise:1.25},grass:{name:'Herbe',speed:.84,noise:.72},forest:{name:'Sous-bois',speed:.68,noise:.66},mud:{name:'Boue',speed:.55,noise:.86}},vehicles,districtBuildings,districtSlots:8,behaviours:{resting:{name:'Attroupement',speed:0},migrating:{name:'Migration',speed:.72},frenzied:{name:'Meute fébrile',speed:1.65}},maxGroup:360,groupLimit:18,enemyHealth:60,attack:7,homeExclusion:280,eventMin:90,eventMax:150,companionRules:Object.freeze({maxCompanions:2,minimumPopulation:4,assignmentFood:2,radius:.32,followDistance:2,speed:3,healRange:3,healPerSecond:2,medicinePerHealth:.05,repairRange:4,repairPerSecond:3,scrapPerHealth:.05,shotRange:12,shotDamage:12,shotInterval:1.5,shotAmmo:1,scoutRange:700}),companions:{lea:{name:'Léa',role:'éclaireuse'},samir:{name:'Samir',role:'secouriste'},ines:{name:'Inès',role:'mécanicienne'},malik:{name:'Malik',role:'tireur'}},campaign:[{id:'roads',name:'Relier les routes'},{id:'towns',name:'Reconnaître les agglomérations'},{id:'annex',name:'Ouvrir une annexe'},{id:'horde',name:'Survivre à une horde sauvage'},{id:'fleet',name:'Diversifier la flotte'},{id:'allies',name:'Former une équipe de sortie'},{id:'megacity',name:'Faire grandir D-17'}]}));
C.WorldEvolution=S;const previous=C.migrateSaveData;
C.migrateSaveData=raw=>{if(!raw||typeof raw!=='object')return null;const modern=raw.version===20;if(modern&&!raw.worldEvolution)throw Error('Sauvegarde v20 sans évolution.');const legacyV2=raw.version===2&&raw.pendingSpawns===undefined?{...raw,wavePlan:null}:raw;const d=previous(modern?{...raw,version:19}:legacyV2);return d?{...d,version:20,worldEvolution:S.normalize(modern?raw.worldEvolution:undefined)}:null;};
C.SAVE_VERSION=20;C.SAVE_KEY='deadwall-save-v20';C.SAVE_BACKUP_KEY='deadwall-save-backup-v20';C.LEGACY_SAVE_KEYS=[...new Set(['deadwall-save-v19','deadwall-save-backup-v19',...C.LEGACY_SAVE_KEYS])];})(globalThis);

/* 1.26 — autonomous night equipment; durations are simulation seconds, radii metres. */
(function(root){'use strict';root.DeadwallCore.NightGearRules=Object.freeze({maxDevices:64,maxPlaced:24,beltMax:8,reach:2.5,placeDistance:1.3,craftSeconds:3,fieldCraftSeconds:5,fireRainDrain:1.6,noisePulse:2,fixtureRadius:4.5,fixtureMax:16,types:{
 branch:{name:'Bois embrasé',cost:{wood:2,fuel:1},radius:4,duration:75,color:'#f5a052',flame:true,field:true,carry:true,disposable:true,note:'Improvisé avec le sac. Flamme fragile sous la pluie.'},
 torch:{name:'Torche de résine',cost:{wood:4,fuel:2},radius:7,duration:180,color:'#ffc879',flame:true,field:true,carry:true,disposable:true,note:'Portée ou plantée. La pluie accélère sa combustion.'},
 campfire:{name:'Feu de camp',cost:{wood:12,stone:4,fuel:1},refill:{wood:8},radius:11,duration:300,color:'#ffb764',flame:true,field:true,carry:false,noise:7,note:'À poser dehors, loin des véhicules. Se recharge au bois sur place.'},
 flare:{name:'Fusée éclairante',cost:{scrap:3,fuel:2},radius:16,duration:55,color:'#ff7462',carry:true,disposable:true,noise:18,locked:true,note:'Très visible, brève et bruyante. Déclenchement irréversible.'},
 chemlight:{name:'Bâton lumineux',cost:{scrap:2,fuel:1},radius:3.6,duration:360,color:'#8ee4a4',carry:true,disposable:true,sealed:true,locked:true,note:'Petit balisage silencieux, étanche ; activation irréversible.'},
 lantern:{name:'Lanterne à carburant',cost:{scrap:8,fuel:3},refill:{fuel:3},radius:8.5,duration:360,color:'#ffe0a2',carry:true,note:'Portative ou posable ; carburant au dépôt pour refaire le plein.'},
 worklight:{name:'Lampe de chantier',cost:{scrap:14,fuel:3},refill:{fuel:2,scrap:1},radius:14,duration:240,color:'#dbe9ec',carry:false,locked:true,note:'Éclairage large sur pied ; recharge et entretien au dépôt.'},
 beacon:{name:'Balise de route',cost:{scrap:8,fuel:2},refill:{fuel:1,scrap:1},radius:6,duration:480,color:'#d5e7ad',carry:false,locked:true,note:'Éclairage durable pour les retours et croisements. Recharge au dépôt.'}
}});})(globalThis);

/* 1.27 — expedition bivouacs: paid field actions, no passive resource production. */
(function(root){'use strict';root.DeadwallCore.SurvivalPackRules=Object.freeze({
 maxCamps:4,maxSerial:1000000,campLife:600,campReach:3.5,campRadius:1.1,placeDistance:1.7,safeRadius:10,moveTolerance:.08,maxStep:.1,
 camp:{name:'Installer un bivouac',seconds:7,cost:{wood:12,scrap:6}},
 rest:{name:'Prendre une courte relève',seconds:12,cost:{food:3},heal:16},
 ration:{name:'Prendre une ration de marche',seconds:2,cost:{food:2},stamina:30},
 restSheltered:{name:'Prendre une relève abritée',seconds:20,cost:{food:6,medicine:1},heal:30},
 meal:{name:'Préparer un repas chaud',seconds:8,cost:{food:4,wood:1},duration:120,rebate:.25,budget:60},
 dressing:{name:'Poser un pansement compressif',seconds:5,cost:{medicine:2},duration:30,heal:18},
 dressingLight:{name:'Poser un pansement léger',seconds:3,cost:{medicine:1},duration:15,heal:9},
 cover:{name:'Tendre une bâche pare-pluie',seconds:7,cost:{wood:4,scrap:3,fuel:1},duration:300,radius:3.2,protection:.9},
 service:{name:'Entretenir la lanterne',seconds:8,cost:{fuel:4,scrap:2},amount:240}
});})(globalThis);

/* 1.27 — ExplorePackRules: bounded local prospecting, finite caches and physical cargo. */
(function(root){'use strict';root.DeadwallCore.ExplorePackRules=Object.freeze({maxSurveys:128,maxCaches:8,maxMarkers:24,maxCargo:8,cacheCapacity:54,cacheCost:{wood:6,scrap:3},markerCost:{wood:2,scrap:1},surveyCost:{food:1},surveySeconds:3,cacheSeconds:4,markerSeconds:1.5,extractSeconds:6,recoverSeconds:2,deliverySeconds:2,cargoAmount:24,cargoSpeed:.72,compactExtract:Object.freeze({name:'Arrimer un ballot compact',seconds:3,cost:Object.freeze({wood:1,scrap:1}),amount:12,speed:.86}),stashSeconds:3,reach:72,danger:175,markerSpacing:96,placementSpacing:36,movementTolerance:2,maxStep:.1});})(globalThis);

/* 1.27 — field-team tactics and supplies: metres and active simulation seconds. */
(function(root){'use strict';root.DeadwallCore.CompanionPackRules=Object.freeze({homeReach:100,trainingDanger:145,shareRange:3,positionRange:180,defenseRange:4,reserve:Object.freeze({ammo:8,medicine:2,scrap:2}),training:Object.freeze({seconds:45,cost:Object.freeze({food:20,scrap:12}),bonus:Object.freeze({lea:1.2,samir:1.25,ines:1.25,malik:1.2})}),exercises:Object.freeze({escort:Object.freeze({name:'Exercice d’escorte',description:'Suivre + File : réduit de 30 % l’écart de formation, sans accélérer ni franchir les obstacles.',seconds:60,cost:Object.freeze({food:24,scrap:14}),requires:'specialty',gapFactor:.7}),support:Object.freeze({name:'Exercice d’appui',description:'Tenir + Défense : portée de Malik 8 m, soins et réparation ×1,15, repérage de Léa ×1,10 ; ressources usuelles consommées, aucun bonus en poursuite.',seconds:75,cost:Object.freeze({food:30,scrap:20,ammo:8}),requires:'escort',defenseRange:8,serviceFactor:1.15,scoutFactor:1.1}),triage:Object.freeze({name:'Triage de proximité',description:'Samir seulement. Tenir + Défense + Ligne : soins ×1,35 en plus de l’appui ; chaque point de vie conserve son coût en médicaments. Aucune résurrection ni soin hors portée.',seconds:90,cost:Object.freeze({food:36,scrap:18,medicine:4}),requires:'support',tier:4,allowedCompanions:Object.freeze(['samir']),order:'hold',formation:'line',discipline:'defensive',healFactor:1.35}),sapeur:Object.freeze({name:'Dépannage en position abritée',description:'Inès seulement. Tenir + Défense + Espacement : réparation du véhicule ×1,45 en plus de l’appui, avec la ferraille usuelle. Restez près du véhicule par un accès libre ; aucun blindage gratuit.',seconds:105,cost:Object.freeze({food:42,scrap:36,fuel:6}),requires:'support',tier:6,allowedCompanions:Object.freeze(['ines']),order:'hold',formation:'spread',discipline:'defensive',repairFactor:1.45}),veille:Object.freeze({name:'Veille de tir latérale',description:'Malik seulement. Tenir + Défense + Espacement : engagement jusqu’à 10 m, au lieu des 8 m d’appui. Mêmes dégâts, cadence et cartouches ; la ligne de tir reste physique et aucun contact de carte n’est révélé.',seconds:120,cost:Object.freeze({food:48,scrap:28,ammo:18}),requires:'support',tier:8,allowedCompanions:Object.freeze(['malik']),order:'hold',formation:'spread',discipline:'defensive',defenseRange:10}),coordination:Object.freeze({name:'Coordination du regroupement',description:'Léa seulement. Regrouper + Ligne : écart au point de ralliement réduit de 45 %. Ne déplace pas les autres équipiers ; obstacles, vitesse et portée de détection restent inchangés.',seconds:135,cost:Object.freeze({food:54,scrap:40,medicine:2}),requires:'escort',tier:10,allowedCompanions:Object.freeze(['lea']),order:'rally',formation:'line',gapFactor:.55})}),formations:Object.freeze({line:Object.freeze({name:'Ligne rapprochée',back:2,step:0,side:1.5}),file:Object.freeze({name:'File dans les passages',back:1.8,step:1.8,side:0}),spread:Object.freeze({name:'Espacement extérieur',back:3,step:0,side:3})}),disciplines:Object.freeze({free:Object.freeze({name:'Tir à volonté'}),defensive:Object.freeze({name:'Défense rapprochée'}),silent:Object.freeze({name:'Silence, aucun tir'})})});})(globalThis);

/* 1.27 — five finite, physical fortification and industry extensions. */
(function(root){'use strict';root.DeadwallCore.FortificationPackRules=Object.freeze({
 maxFittings:128,maxDebris:128,reach:72,dangerRange:145,maxStep:.25,
 ammoCost:Object.freeze({wood:4,scrap:3,ammo:24}),ammoCapacity:24,
 repairCost:Object.freeze({scrap:10,wood:4}),repairCapacity:200,repairRate:8,
 netCost:Object.freeze({wood:12,scrap:6}),netCapacity:12,
 variants:Object.freeze({
  ammoCompact:Object.freeze({name:'Caisson compact',target:'ammo',capacity:12,cost:Object.freeze({ammo:12,wood:2,scrap:2}),tier:1,description:'Douze cartouches réellement prélevées au dépôt ; un caisson moins coûteux pour une petite position.'}),
  netWide:Object.freeze({name:'Filet large',target:'net',capacity:24,cost:Object.freeze({wood:26,scrap:16}),tier:2,requires:'workshop',description:'Vingt-quatre points de capture finis ; demande un atelier opérationnel et davantage de matériaux.'})
 }),
 mechanismContactReach:22,
 mechanisms:Object.freeze({
  ankle:Object.freeze({name:'Entrave de cheville',seconds:8,cost:Object.freeze({wood:6,scrap:10}),charges:6,damage:12,holdSeconds:2.5,cooldown:1,tier:1,description:'Six déclenchements finis : 12 dégâts et 2,5 s de ralentissement et de délai d’attaque. Un infecté déjà entravé ne consomme pas une deuxième charge.'}),
  blades:Object.freeze({name:'Lames de contact',seconds:12,cost:Object.freeze({wood:6,scrap:18}),charges:6,damage:28,holdSeconds:0,cooldown:.7,tier:2,requires:'workshop',description:'Six impacts mécaniques de 28 dégâts, espacés d’au moins 0,7 s. Atelier terminé requis ; aucun gain de santé ni de cadence pour le Hérisson.'}),
  guideRail:Object.freeze({name:'Guides à câble',seconds:14,cost:Object.freeze({wood:10,scrap:16}),charges:8,damage:6,holdSeconds:3,cooldown:1.2,tier:3,requires:'workshop',strictTier:true,description:'Huit ralentissements de 3 s pour couvrir un repli ; seulement 6 dégâts par contact. Câbles finis, atelier achevé et accès libre requis.'}),
  ratchet:Object.freeze({name:'Cliquet à dents remplaçables',seconds:18,cost:Object.freeze({wood:4,scrap:30}),charges:12,damage:18,holdSeconds:0,cooldown:.35,tier:5,requires:'workshop',strictTier:true,description:'Douze impacts de 18 dégâts, espacés d’au moins 0,35 s. Davantage de contacts au prix de 30 ferrailles ; ne retient pas les infectés.'}),
  clamp:Object.freeze({name:'Mâchoire d’immobilisation',seconds:20,cost:Object.freeze({wood:8,scrap:24}),charges:3,damage:8,holdSeconds:6,cooldown:2,tier:7,requires:'workshop',strictTier:true,description:'Trois entraves longues de 6 s pour ménager une fenêtre de secours ; seulement 8 dégâts. Une cible déjà entravée ne gaspille pas une seconde charge.'}),
  counterweight:Object.freeze({name:'Percuteur à contrepoids',seconds:24,cost:Object.freeze({wood:6,scrap:20,stone:10}),charges:2,damage:52,holdSeconds:0,cooldown:2.5,tier:9,requires:'workshop',strictTier:true,description:'Deux impacts lourds de 52 dégâts au contact, sans explosion ni zone magique. Peu de déclenchements et 2,5 s de réarmement ; les flancs demeurent à défendre.'})
 }),
 regulatorCost:Object.freeze({scrap:6}),inputReserve:25,
 debrisFactor:.12,debrisRate:6,debrisResources:Object.freeze(['wood','scrap','stone'])
});})(globalThis);

/* 1.27 — CampaignPackRules: paid field contracts, finite opportunities, no passive income. */
(function(root){'use strict';root.DeadwallCore.CampaignPackRules=Object.freeze({
 maxUsed:1024,history:16,maxCount:1000000000,maxStep:.1,reach:3,danger:18,homeReach:100,movementTolerance:.12,localMovementTolerance:3.8,
 cargoSpeed:.82,rescueSpeed:.72,cargoDamage:1,rescueDamage:1.5,minimumCore:.65,workNoise:30,
 definitions:Object.freeze({
 patrol:Object.freeze({name:'Patrouille de liaison',brief:'Relever trois accès découverts puis rapporter le carnet au dépôt.',sites:3,seconds:6,fee:{food:4},fieldCost:{},reward:{insight:1},types:null}),
 aid:Object.freeze({name:'Ravitaillement civil',brief:'Transporter un colis scellé de vivres et médicaments vers un point civil, puis rendre compte.',sites:1,seconds:5,fee:{food:18,medicine:3},fieldCost:{},reward:{morale:6},types:['house','duplex','apartments','school','townhall','clinic','motel','hotel','cabin']}),
 salvage:Object.freeze({name:'Réserve de protection civile',brief:'Ouvrir une caisse scellée dans un site industriel et ramener son contenu à D-17.',sites:1,seconds:9,fee:{food:4},fieldCost:{scrap:3},reward:{scrap:24,fuel:6},types:['warehouse','selfstorage','garage','hardware','sawmill','mine','quarry','fuel']}),
 evacuation:Object.freeze({name:'Évacuation sanitaire',brief:'Stabiliser un blessé, le porter jusqu’au dépôt et lui réserver un logement.',sites:1,seconds:8,fee:{food:6,medicine:2},fieldCost:{medicine:2},reward:{worker:1},types:['clinic','hospital','house','apartments','motel','hotel','school','cabin']}),
 defense:Object.freeze({name:'Engagement de garnison',brief:'Financer un exercice réel : tenir la prochaine vague sans laisser le centre sous 65 % d’intégrité.',sites:0,seconds:0,fee:{food:16,ammo:24},fieldCost:{},reward:{ammo:12,insight:1},types:null}),
 medical:Object.freeze({name:'Relais sanitaire',brief:'Porter un colis fragile vers un accès médical découvert et rendre compte à D-17. Une tentative par campagne ; retour avant trois changements de vague.',sites:1,seconds:12,fee:{food:6,medicine:6},fieldCost:{scrap:2},reward:{insight:2,morale:3},types:['clinic','hospital','pharmacy'],cargo:'outbound',unique:true,waveLimit:3}),
 recovery:Object.freeze({name:'Retour de réserve',brief:'Ouvrir une réserve scellée puis ramener son colis fragile à D-17. Une tentative par campagne ; retour avant trois changements de vague.',sites:1,seconds:14,fee:{food:8},fieldCost:{scrap:5},reward:{medicine:8,ammo:18},types:['warehouse','selfstorage','hardware','garage'],cargo:'inbound',unique:true,waveLimit:3})
 })
});})(globalThis);

/* Regional contacts 1.29: finite existing populations, physical close combat. */
(function(root){'use strict';root.DeadwallCore.DepartureRules=Object.freeze({approachDistance:560,rearmDistance:720,displaySeconds:14,refreshSeconds:.5,criticalCoreRatio:.35});})(globalThis);

(function(root){'use strict';root.DeadwallCore.RegionContactRules=Object.freeze({streamRange:100,contactBudget:720,contactRadius:.4,attackReach:.9,formationSpacing:1.18,attackInterval:1,visibleMargin:1.4});})(globalThis);

/* 1.29 — container layouts are presentation metadata; these values describe packed supply portions. */
(function(root){'use strict';root.DeadwallCore.LoadoutRules=Object.freeze({
 maxLayouts:512,maxRows:64,columns:8,minRows:6,localReach:70,homeReach:100,companionReach:3,
 massPerCapacity:.35,emptyPackMass:1.2,emptyPouchMass:.25,
 resources:Object.freeze({
 wood:Object.freeze({shape:[2,1],stack:8,kg:.25,note:'Petites pièces de bois conditionnées'}),
 scrap:Object.freeze({shape:[1,1],stack:10,kg:.2,note:'Pièces métalliques triées'}),
 stone:Object.freeze({shape:[2,2],stack:6,kg:.35,note:'Fragments de maçonnerie transportables'}),
 food:Object.freeze({shape:[1,2],stack:8,kg:.15,note:'Portions de vivres'}),
 fuel:Object.freeze({shape:[2,2],stack:6,kg:.2,note:'Doses de carburant en bidon'}),
 ammo:Object.freeze({shape:[2,1],stack:18,kg:.02,note:'Munitions conditionnées'}),
 medicine:Object.freeze({shape:[1,1],stack:4,kg:.08,note:'Doses médicales emballées'})
 }),
 kitMass:Object.freeze({aid:.4,brace:.8,light:.35,decoy:.5}),
 lightMass:Object.freeze({branch:.5,torch:.7,campfire:3,flare:.25,chemlight:.08,lantern:1.3,worklight:2.8,beacon:1.4})
});})(globalThis);

/* 1.31 — personal preparation: paid supplies, bounded benefits, no free ammunition. */
(function(root){'use strict';root.DeadwallCore.Player131Rules=Object.freeze({
 homeReach:100,safeRadius:10,moveTolerance:.08,maxStep:.1,
 vest:Object.freeze({name:'Ajuster un gilet de fortune',seconds:10,cost:Object.freeze({scrap:18,food:3}),absorption:45,reduction:.3,sprintBurden:.15,kg:4}),
 service:Object.freeze({name:'Préparer les rechargements',seconds:8,cost:Object.freeze({scrap:4,fuel:1}),reloads:8,reloadFactor:.85}),
 ammo:Object.freeze({name:'Préparer la cartouchière',seconds:5,capacity:36,kgPerUnit:.02,pouchKg:.25}),
 tools:Object.freeze({name:'Préparer une boîte d’outils',seconds:9,cost:Object.freeze({scrap:10,wood:6}),budget:30,bonus:.5,kg:1.8})
});})(globalThis);

/* 1.31 — Spawn131Rules: one seeded occupancy draw per eligible site, metres. */
(function(root){'use strict';const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};root.DeadwallCore.Spawn131Rules=freeze({"version":1,"bands":[{"id":"near","max":2000},{"id":"middle","max":6000},{"id":"far","max":null}],"protectedRadius":250,"clearance":{"parcel":6,"road":3,"water":2,"slopeMax":0.18,"foot":1.2,"vehicle":5},"weights":{"bois-lisiere":{"near":[70,22,6,2],"middle":[63,28,6,3],"far":[55,34,7,4]},"foret-profonde":{"near":[74,18,6,2],"middle":[65,25,7,3],"far":[55,33,8,4]},"montagne":{"near":[80,12,7,1],"middle":[73,17,8,2],"far":[64,24,9,3]},"port":{"near":[53,37,6,4],"middle":[44,42,8,6],"far":[35,49,8,8]},"plage":{"near":[79,15,5,1],"middle":[73,20,5,2],"far":[65,27,5,3]},"ville":{"near":[52,38,7,3],"middle":[43,45,8,4],"far":[32,54,8,6]},"village":{"near":[64,27,7,2],"middle":[54,35,8,3],"far":[45,42,9,4]},"metropole":{"near":[43,45,8,4],"middle":[34,51,9,6],"far":[25,57,10,8]},"camp-fortune":{"near":[55,25,18,2],"middle":[47,31,19,3],"far":[38,37,21,4]},"camp-allie":{"near":[49,19,30,2],"middle":[41,25,31,3],"far":[33,31,32,4]},"camp-hostile":{"near":[60,30,3,7],"middle":[49,37,4,10],"far":[37,45,5,13]},"quartier-pavillonnaire":{"near":[60,31,7,2],"middle":[51,38,8,3],"far":[41,46,9,4]},"industrie":{"near":[54,39,4,3],"middle":[44,46,5,5],"far":[34,53,6,7]},"zone-commerciale":{"near":[48,43,6,3],"middle":[37,51,7,5],"far":[27,58,8,7]},"zone-loisirs":{"near":[64,28,6,2],"middle":[53,36,8,3],"far":[42,44,10,4]},"mine":{"near":[74,21,3,2],"middle":[63,30,4,3],"far":[52,39,5,4]},"carriere":{"near":[73,23,3,1],"middle":[63,31,4,2],"far":[52,40,5,3]},"prairie":{"near":[76,17,6,1],"middle":[66,25,7,2],"far":[56,33,8,3]},"ferme":{"near":[63,28,7,2],"middle":[53,36,8,3],"far":[43,44,9,4]},"marais":{"near":[81,15,3,1],"middle":[73,21,4,2],"far":[65,27,5,3]},"riviere":{"near":[74,19,6,1],"middle":[65,26,7,2],"far":[55,33,9,3]},"gare":{"near":[52,40,5,3],"middle":[42,47,6,5],"far":[31,55,7,7]},"hopital":{"near":[45,44,9,2],"middle":[35,50,11,4],"far":[25,57,12,6]},"aire-route":{"near":[62,28,8,2],"middle":[51,36,10,3],"far":[40,44,12,4]}}});})(globalThis);

/* 1.31 — bounded D-17 preparation stocks; no production or free repair. */
(function(root){'use strict';root.DeadwallCore.Defense131Rules=Object.freeze({
 maxPosts:128,reach:72,dangerRange:145,maxStep:.25,inspectionSeconds:.5,
 gateCost:Object.freeze({wood:6,scrap:10}),gateSeconds:2,
 maintenanceCost:Object.freeze({scrap:12,wood:6,stone:6}),maintenanceTarget:.9,
 workCost:Object.freeze({wood:6,scrap:8,fuel:3}),workCapacity:8,workBonus:.35,maxWorkInput:1,
 arcCost:Object.freeze({wood:2,scrap:4}),arcHalfAngle:Math.PI/4
});})(globalThis);

/* 1.31 — finite long-distance preparation, fuel recovery and mechanical salvage. */
(function(root){'use strict';root.DeadwallCore.Travel131Rules=Object.freeze({
 maxWrecks:512,homeReach:100,localCarReach:72,wreckReach:1.6,danger:12,moveTolerance:.06,maxStep:.1,
 packingSeconds:3,siphonSeconds:5,siphonBatch:6,serviceSeconds:9,serviceDistance:2000,fuelDiscount:.2,serviceCost:Object.freeze({scrap:8,fuel:1}),
 dismantleSeconds:7,dismantleBatch:6,dismantleCost:Object.freeze({scrap:1}),wreckMinimum:8,wreckVariance:9,workNoise:24,noisePulse:1,
 manifests:Object.freeze({
 foot:Object.freeze({name:'Reconnaissance à pied',stock:Object.freeze({medicine:2,food:8,ammo:18,scrap:4})}),
 motor:Object.freeze({name:'Voyage motorisé',stock:Object.freeze({fuel:10,scrap:12,medicine:2,food:4,ammo:8})}),
 rescue:Object.freeze({name:'Retour de secours',stock:Object.freeze({medicine:4,fuel:6,scrap:12,food:6,ammo:8})})
 })
});})(globalThis);

/* 1.31 — the distant region keeps old parcels, finite supplies and bounded detail caches. */
(function(root){'use strict';root.DeadwallCore.WorldStreamRules131=Object.freeze({size:24576,sector:1024,prefetchChunks:1});root.DeadwallCore.WorldOpsRules131=Object.freeze({maxRecords:2500,relayCapacity:120,reach:4,danger:15,moveTolerance:.12,workNoise:24,relay:{seconds:8,cost:{wood:8,scrap:4}},secure:{seconds:6,cost:{scrap:3,food:1}},reserve:{seconds:8,cost:{scrap:4}},survey:{seconds:5,cost:{food:1,scrap:1}},rest:{seconds:12,cost:{food:2,medicine:1},health:16},reserveAmounts:{medicine:18,fuel:36,ammo:72,scrap:48}});})(globalThis);

/* 1.31 — physical story records; seconds are active simulation time, regional distances in metres. */
(function(root){'use strict';root.DeadwallCore.Chronicles131Rules=Object.freeze({readSeconds:3,homeReach:100,reach:2.6,danger:12,localDanger:150,move:.1,localMove:3.2,maxStep:.1,markerRadius:.38,doorOffsets:Object.freeze([-3,-5,-8,-12,-16]),maxBaselineBuildings:16384,prologueGather:8,prologueDeposit:8,sceneSeconds:10});})(globalThis);

/* 1.33 — local generation: spacing and finite deposits only for new layout revision 3. */
(function(root){'use strict';root.DeadwallCore.TerrainRules133=Object.freeze({innerRadius:850,starterPerType:2,resourceSpacing:70,roadCanopyMargin:12,resourceRetention:.62,decorCount:70});})(globalThis);

/* 1.33 — succession: a life is lost, carried possessions are conserved on the ground. */
(function(root){'use strict';root.DeadwallCore.SuccessionRules=Object.freeze({
 maxRemains:1024,unarmedDamage:18,armedMeleeDamage:36,reanimationChance:.30,reanimationMin:75,reanimationMax:150,reach:1.8,danger:4,health:65,damage:8,attackInterval:1.15,maxStep:.1,protection:3,
 requisition:Object.freeze({pistol:8,rifle:20,shotgun:16}),
 profiles:Object.freeze({
 commander:Object.freeze({name:'Commandant',description:'Le premier responsable de D-17.',health:100,speed:1,capacity:36,construction:1}),
 scout:Object.freeze({name:'Éclaireuse',description:'Une volontaire habituée aux longues reconnaissances.',health:90,speed:1.08,capacity:32,construction:1,advantages:['Déplacement à pied +8 %'],tradeoffs:['90 points de vie','Sac de 32 portions']}),
 porter:Object.freeze({name:'Manutentionnaire',description:'Un réfugié rompu au transport des charges et aux allers-retours du dépôt.',health:100,speed:.94,capacity:44,construction:1,advantages:['Sac de 44 portions'],tradeoffs:['Déplacement à pied −6 %']}),
 builder:Object.freeze({name:'Bâtisseuse',description:'Une ouvrière du refuge capable de reprendre les chantiers interrompus.',health:100,speed:.98,capacity:38,construction:1.15,advantages:['Construction manuelle +15 %','Sac de 38 portions'],tradeoffs:['Déplacement à pied −2 %']})
 })
});})(globalThis);

/* 1.34 — abstract combat balance. Metres are converted only at the combat boundary. */
(function(root){'use strict';const C=root.DeadwallCore;
const list=[];
const gun=(id,name,base,tier,damage,rate,range,magazine,reload,spread,kg,cost,wear=.18,pellets=1,ammo=1)=>list.push({id,name,category:'firearm',base,tier,damage,fireRate:rate,range,magazine,reload,spread,kg,cost:{scrap:cost},wear,pellets,ammoPerReload:ammo,headshotChance:pellets>1?.065:.13,headshotMultiplier:1.75,stamina:0,arc:0,targets:1,description:'Arme remise en état au dépôt. Munitions transportées nécessaires ; entretien régulier.'});
gun('pistol','Pistolet de service','pistol',0,42,3.2,650/32,12,1.35,.035,1.1,8);
gun('rifle','Fusil d’assaut','rifle',1,34,8.2,760/32,30,1.8,.055,3.5,20);
gun('shotgun','Fusil à pompe','shotgun',2,18,1.05,420/32,8,2.25,.21,3.7,16,.35,8,2);
gun('pocket','Pistolet compact','pistol',0,34,3.5,15,8,1.2,.05,.65,10);
gun('revolver','Revolver de patrouille','pistol',0,63,1.5,22,6,2.4,.025,1.3,16,.22);
gun('target','Pistolet sportif','pistol',1,44,2.8,29,10,1.5,.012,1.15,23,.15);
gun('machinePistol','Pistolet automatique','pistol',1,25,9,13,12,1.5,.09,1.8,28,.24);
gun('carbine','Carabine civile','rifle',1,51,2.5,35,10,2,.023,2.9,25,.16);
gun('hunting','Fusil de chasse à verrou','rifle',1,104,.67,51,5,3.1,.009,3.8,30,.3);
gun('lever','Carabine à levier','rifle',1,69,1.35,32,7,2.8,.021,3.1,27,.24);
gun('smg','Pistolet mitrailleur','rifle',2,28,10,18,24,1.7,.075,2.8,35,.23);
gun('burst','Carabine de patrouille','rifle',2,40,5.2,32,20,1.9,.038,3.4,42,.2);
gun('marksman','Fusil de précision semi-auto','rifle',3,82,1.65,57,10,2.7,.01,4.6,58,.26);
gun('support','Mitrailleuse de soutien','rifle',3,40,7.4,38,30,3.6,.065,7.2,72,.3);
gun('doubleBarrel','Fusil à deux coups','shotgun',0,17,.9,11,2,2.1,.25,3.1,18,.4,8,2);
gun('shortShotgun','Fusil court','shotgun',1,15,1.4,9,4,2.4,.3,2.8,24,.4,9,2);
gun('slug','Fusil à projectile unique','shotgun',2,115,.8,31,5,2.9,.028,3.8,39,.4,1,3);
gun('semiShotgun','Fusil semi-automatique','shotgun',3,16,2,14,6,3,.19,4.1,58,.45,7,2);
gun('singleShot','Carabine monocoup récupérée','rifle',1,68,.6,28,1,1.9,.025,2.4,18,.35);
Object.assign(list.at(-1),{cost:{wood:6,scrap:18},description:'Carabine légère remise en état au dépôt. Un seul coup avant chaque recharge, portée et cadence limitées ; aucune cartouche fournie avec l’assemblage.'});
const hand=(id,name,category,tier,damage,rate,range,stamina,kg,cost,wear,arc=1.05,targets=1)=>list.push({id,name,category,base:'pistol',tier,damage,fireRate:rate,range,magazine:0,reload:0,spread:0,kg,cost,wear,pellets:1,ammoPerReload:0,headshotChance:0,headshotMultiplier:1,stamina,arc,targets,description:category==='tool'?'Outil polyvalent, également utilisable au contact. Consomme de l’endurance ; les travaux restent dans leurs systèmes dédiés.':'Arme de contact. Plus la portée et l’impact sont importants, plus le geste coûte de l’endurance.'});
hand('plank','Planche de fortune','improvised',0,28,1.2,1.6,9,1.8,{wood:4},1.2,1.1,2);
hand('pipe','Tube métallique','improvised',0,36,1.25,1.55,10,2.1,{scrap:5},.65);
hand('bottleClub','Matraque de récupération','improvised',0,24,1.9,1.1,7,.9,{wood:2,scrap:2},1.1);
hand('spear','Lance de récupération','improvised',0,39,.9,2.7,12,2.3,{wood:7,scrap:5},.7,.35);
hand('knife','Couteau utilitaire','melee',0,28,2.1,.95,6,.45,{scrap:5},.55,.7);
hand('bat','Batte renforcée','melee',0,45,1.15,1.7,12,1.6,{wood:6,scrap:6},.5,1.1,2);
hand('machete','Machette','melee',1,49,1.45,1.35,11,.95,{scrap:14},.5,.9,2);
hand('maul','Masse de chantier','melee',1,100,.52,1.75,24,5.2,{wood:5,scrap:20},.7,1.2,3);
hand('riotBaton','Bâton de maintien','melee',1,35,1.85,1.45,8,1.1,{scrap:12},.25,1.05,2);
hand('longSpear','Pique de garde','melee',2,61,.85,3.1,15,3.2,{wood:10,scrap:22},.55,.3,2);
hand('hatchet','Hachette de terrain','tool',0,52,1.1,1.25,12,1.4,{wood:3,scrap:9},.5);
hand('crowbar','Pied-de-biche','tool',0,42,1.15,1.4,10,2.4,{scrap:10},.3);
hand('hammer','Marteau de mécanicien','tool',0,38,1.65,1.1,8,.9,{wood:2,scrap:5},.35);
hand('shovel','Pelle pliante','tool',0,40,1,1.65,12,1.8,{wood:3,scrap:8},.5,1.15,2);
hand('pickaxe','Pioche','tool',1,85,.65,1.7,21,3.4,{wood:4,scrap:17},.7,.75);
hand('assemblyHammer','Marteau d’assemblage','tool',2,30,.95,1.15,11,2.1,{wood:4,scrap:12},.4);
Object.assign(list.at(-1),{requires:'workshop',workBonuses:{barricade:1.45},workWear:.18,description:'À fabriquer auprès d’un atelier achevé et alimenté. Tenu en main et en état, réduit le temps de montage et de réparation des barricades ; usure de travail accrue, mêlée lente et poids supérieur au marteau de mécanicien.'});
hand('wreckingBar','Arrache-clous de chantier','tool',2,36,.75,1.55,14,3.7,{wood:3,scrap:18},.45);
Object.assign(list.at(-1),{requires:'workshop',workBonuses:{dismantle:1.5},workWear:.22,description:'À fabriquer auprès d’un atelier achevé et alimenté. Tenu en main et en état, accélère le démontage des barricades sans accroître les matériaux récupérés ; lourd, fatigant et plus coûteux à entretenir.'});
const post=(id,name,tier,damage,rate,range,magazine,kg,cost,health,wear,ammo)=>list.push({id,name,category:'deployed',base:'rifle',tier,damage,fireRate:rate,range,magazine,reload:0,spread:0,kg,cost,wear,pellets:1,ammoPerReload:ammo,headshotChance:0,headshotMultiplier:1,health,stamina:0,arc:Math.PI,targets:1,description:ammo?'Poste autonome déployable à D-17. Chargeur local à ravitailler au contact ; ne prélève jamais à distance au dépôt.':'Obstacle offensif déployable à D-17. Déclenche au contact et s’use ; les infectés peuvent le détruire.'});
post('tripod','Affût automatique léger',2,34,3.2,19,60,8,{wood:12,scrap:65},160,.15,1);
post('heavyNest','Nid de tir lourd',3,66,1.8,28,48,12,{wood:20,scrap:95,stone:15},250,.22,2);
post('boltNest','Lance-traits de défense',1,65,.48,12,20,6,{wood:28,scrap:30},140,.35,1);
post('spikeFrame','Chevalet à pointes',0,50,.65,1.4,0,5,{wood:18,scrap:9},115,1.5,0);
C.Arsenal134Rules=Object.freeze({version:1,carryKg:22,maxItems:512,maxPosts:32,homeReach:105,danger:135,deployDistance:62,postRadius:17,maxStep:.1,repairFraction:.42,craftSeconds:4,repairSeconds:3,postReach:100,meleeStagger:.3,buttRange:1.72,buttArc:1.15,buttCooldown:.65,toolWear:.12,toolBonuses:{wood:{id:'hatchet',factor:1.25},stone:{id:'pickaxe',factor:1.25},scrap:{id:'crowbar',factor:1.2},barricade:{id:'hammer',factor:1.25},dismantle:{id:'crowbar',factor:1.2},lock:{id:'crowbar',factor:1.2},repair:{id:'hammer',factor:1.25}},legacy:['pistol','rifle','shotgun'],catalog:Object.freeze(Object.fromEntries(list.map(w=>[w.id,Object.freeze(w)])))});
})(globalThis);

/* 1.34 — field intervention and physical barricade balance. */
(function(root){'use strict';
root.DeadwallCore.InterventionRules134=Object.freeze({reach:1.7,localReach:100,danger:5.5,maxRecords:4096,lockChance:.34,moveTolerance:.15,noise:10,lock:{cost:{scrap:1},mistakes:3,pins:3,notches:7},generator:{cost:{scrap:5},mistakes:3,steps:4,repair:100,refuel:4,tank:12,burn:.01,wear:.004},panel:{cost:{scrap:3},mistakes:3,channels:4},localRepair:{health:200,cost:{scrap:6}},lightRadius:9,powerHarvestFactor:1.25});
root.DeadwallCore.BarricadeRules134=Object.freeze({maxRecords:512,reach:2.4,safeRadius:3,thickness:.24,maxStep:.25,repairHP:70,repairCost:{wood:2,scrap:1},repairSeconds:4,dismantleSeconds:3,refundFactor:.35,pressureReach:.85,regionDamage:8,regionAttackSeconds:1.15,types:{planks:{name:'Planches croisées',health:120,seconds:5,cost:{wood:6,scrap:1}},braced:{name:'Bois contreventé',health:240,seconds:9,cost:{wood:10,scrap:4}},sheet:{name:'Tôle rivetée',health:360,seconds:13,cost:{wood:2,scrap:12}}}});
})(globalThis);

/* 1.35 — G6 ecology. Finite resource nodes; old generation rules stay unchanged. */
(function(root){'use strict';
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
const trees={
 oak:{name:'Chêne',shape:'broadleaf',bark:'#5b4d38',crown:'#51653e',radius:[.25,.46],canopy:[3.1,5.1],wood:[13,24]},
 beech:{name:'Hêtre',shape:'broadleaf',bark:'#83847b',crown:'#6d7447',radius:[.23,.42],canopy:[2.9,4.8],wood:[12,22]},
 birch:{name:'Bouleau',shape:'broadleaf',bark:'#b9b9a2',crown:'#788752',radius:[.16,.29],canopy:[2,3.3],wood:[7,16]},
 pine:{name:'Pin',shape:'conifer',bark:'#706047',crown:'#485c44',radius:[.2,.38],canopy:[2.3,3.8],wood:[10,21]},
 fir:{name:'Sapin',shape:'conifer',bark:'#555a4a',crown:'#354f46',radius:[.22,.4],canopy:[2.3,4],wood:[11,22]},
 willow:{name:'Saule',shape:'drooping',bark:'#65705a',crown:'#6b8051',radius:[.22,.39],canopy:[3.1,5],wood:[9,18]},
 poplar:{name:'Peuplier',shape:'columnar',bark:'#7b8171',crown:'#849163',radius:[.2,.34],canopy:[2,3.3],wood:[9,20]},
 alder:{name:'Aulne',shape:'broadleaf',bark:'#586153',crown:'#567350',radius:[.18,.33],canopy:[2.4,3.9],wood:[8,18]},
 fruit:{name:'Arbre fruitier abandonné',shape:'fruit',bark:'#766040',crown:'#7b8050',radius:[.18,.3],canopy:[2.1,3.4],wood:[7,14]}
};
const rocks={
 limestone:{name:'Bloc calcaire',color:'#b3ac92',highlight:'#d0c9ac',radius:[.45,1.1],stone:[9,22]},
 granite:{name:'Bloc de granite',color:'#7d8581',highlight:'#a4a9a0',radius:[.65,1.35],stone:[14,27]},
 schist:{name:'Affleurement de schiste',color:'#6b7378',highlight:'#959ba0',radius:[.45,.95],stone:[10,21]},
 scree:{name:'Amas de pierres',color:'#949586',highlight:'#bbbaa5',radius:[.36,.68],stone:[6,14]}
};
const defs=[
 {id:'meadow',name:'Prairies ouvertes',climate:[.51,.36,.26],spread:[.3,.27,.23],spawnBiome:'rural',surface:'grass',treeChance:.045,rockChance:.14,decorChance:.78,
 palette:{base:'#72774c',secondary:'#858350',soil:'#8d7c53',accent:'#a89c65',rock:'#aaa38d',grass:'#909a64',water:'#63776d'},
 trees:{oak:5,birch:3,fruit:1},rocks:{limestone:4,scree:6},decor:{grass:9,flowers:4,dryGrass:3,pebbles:1},
 buildings:{farmhouse:8,marketgarden:6,bungalow:4,inn:2,chapel:2,cabin:2,clinic:1,fuel:1},enemies:{walker:74,runner:12,crawler:8,stalker:6},
 places:['Prairies de fauche abandonnées','Bosquets isolés','Corps de ferme et dépendances'],description:'Grandes trouées herbeuses, arbres espacés et petites exploitations. La vue porte loin, mais les réserves sont éloignées.',risk:'Peu de couvert ; le retour au véhicule demande de traverser un terrain ouvert.'},
 {id:'bocage',name:'Bocage et haies',climate:[.54,.62,.28],spread:[.27,.24,.24],spawnBiome:'rural',surface:'grass',treeChance:.18,rockChance:.17,decorChance:.9,
 palette:{base:'#606b45',secondary:'#74804e',soil:'#827453',accent:'#93a15c',rock:'#929786',grass:'#7e9657',water:'#5d7467'},
 trees:{oak:5,beech:3,fruit:2,birch:1},rocks:{limestone:4,scree:4,schist:2},decor:{grass:8,flowers:2,fallenBranch:2,leaves:3},
 buildings:{farmhouse:8,familyHouse:5,marketgarden:5,inn:3,chapel:2,smallWorkshop:3,joinery:2,grocer:2,veterinary:1},enemies:{walker:68,runner:13,crawler:8,stalker:8,breacher:3},
 places:['Haies discontinues et talus herbeux','Hameaux agricoles','Ateliers de village'],description:'Paysage agricole compartimenté par des bouquets d’arbres et des lisières irrégulières. Les dessertes relient fermes et ateliers.',risk:'Les petits bosquets cachent des approches ; les haies peintes au sol ne constituent pas des murs.'},
 {id:'deciduous',name:'Forêt de feuillus',climate:[.53,.71,.53],spread:[.27,.25,.25],spawnBiome:'forest',surface:'forest',treeChance:.56,rockChance:.22,decorChance:.95,
 palette:{base:'#4f5d3c',secondary:'#647042',soil:'#75664b',accent:'#a39159',rock:'#7e8776',grass:'#6c794a',water:'#506b5e'},
 trees:{oak:4,beech:5,birch:2},rocks:{limestone:2,schist:5,granite:3},decor:{leaves:8,fallenBranch:4,grass:3,flowers:1},
 buildings:{cabin:8,sawmill:5,joinery:3,ruin:3,motel:2,bunker:1},enemies:{walker:67,runner:8,crawler:10,stalker:13,breacher:2},
 places:['Futaies à chênes et hêtres','Clairières irrégulières','Scieries et chalets desservis'],description:'Couvert de chênes et de hêtres, litière brune et clairières. Le bois domine ; les objets manufacturés proviennent des bâtiments.',risk:'Troncs physiques, canopées passables ; attention aux angles morts à la lisière.'},
 {id:'mixed',name:'Forêt mixte',climate:[.38,.56,.56],spread:[.27,.26,.24],spawnBiome:'forest',surface:'forest',treeChance:.51,rockChance:.3,decorChance:.87,
 palette:{base:'#526044',secondary:'#627352',soil:'#70654d',accent:'#859366',rock:'#828a7d',grass:'#74865b',water:'#5e776b'},
 trees:{pine:4,beech:3,birch:3,oak:2,fir:1},rocks:{granite:4,schist:4,scree:2},decor:{leaves:5,fallenBranch:4,grass:5,pebbles:2},
 buildings:{cabin:9,sawmill:4,ruin:4,motel:3,joinery:2,fuel:1,bunker:1},enemies:{walker:65,runner:11,crawler:10,stalker:12,breacher:2},
 places:['Massifs mêlés de pins et de feuillus','Lisières et coupes','Relais forestiers abandonnés'],description:'Une transition boisée où se mêlent conifères et feuillus. Les espèces et les sols changent progressivement vers les milieux voisins.',risk:'La densité varie par taches ; un passage entre troncs ne devient pas automatiquement carrossable.'},
 {id:'conifer',name:'Massif de conifères',climate:[.23,.55,.76],spread:[.26,.29,.28],spawnBiome:'forest',surface:'forest',treeChance:.65,rockChance:.39,decorChance:.78,
 palette:{base:'#435449',secondary:'#59674f',soil:'#665e4b',accent:'#7d8861',rock:'#89918a',grass:'#64795c',water:'#526f6e'},
 trees:{fir:6,pine:5,birch:1},rocks:{granite:6,schist:3,scree:2},decor:{fallenBranch:6,leaves:3,pebbles:3,grass:3},
 buildings:{cabin:10,sawmill:4,mine:2,ruin:3,bunker:2,joinery:1},enemies:{walker:64,runner:8,crawler:9,stalker:16,breacher:3},
 places:['Peuplements de pins et sapins','Coupes et pistes d’accès','Abri forestier et mine'],description:'Massifs sombres sur les terres plus fraîches. Les conifères serrés alternent avec des blocs et des dégagements.',risk:'Longs détours et visibilité courte. L’altitude est un paramètre écologique, sans falaises ni dégâts de froid.'},
 {id:'riparian',name:'Bois des fonds humides',climate:[.55,.85,.26],spread:[.28,.25,.21],spawnBiome:'forest',surface:'mud',treeChance:.33,rockChance:.2,decorChance:.95,
 palette:{base:'#586b50',secondary:'#6c7c57',soil:'#6c6350',accent:'#8c9565',rock:'#85988b',grass:'#8b9f66',water:'#5c7f7a'},
 trees:{willow:5,alder:4,poplar:4,birch:1},rocks:{scree:6,schist:3,limestone:1},decor:{reeds:7,grass:5,fallenBranch:3,pebbles:2},
 buildings:{waterStation:7,cabin:4,marketgarden:3,ruin:4,generatorRoom:2,inn:1},enemies:{walker:65,crawler:20,runner:6,stalker:9},
 places:['Fonds frais à saules','Aulnaies et peupleraies','Stations de pompage et maraîchage'],description:'Fonds humides à saules, aulnes et peupliers, marqués de roseaux et de terre sombre. Les parcelles techniques ont une desserte.',risk:'Sol boueux lent. Les teintes humides n’ajoutent ni rivière navigable, ni crue, ni noyade.'},
 {id:'wetland',name:'Landes humides et roselières',climate:[.35,.9,.1],spread:[.3,.27,.23],spawnBiome:'rural',surface:'mud',treeChance:.12,rockChance:.12,decorChance:.98,
 palette:{base:'#616b49',secondary:'#747651',soil:'#595944',accent:'#99966a',rock:'#849083',grass:'#9b9c63',water:'#586e68'},
 trees:{alder:5,willow:4,birch:2},rocks:{scree:7,schist:3},decor:{reeds:10,grass:4,dryGrass:3,fallenBranch:1},
 buildings:{waterStation:6,cabin:4,ruin:6,generatorRoom:2,bunker:1},enemies:{walker:62,crawler:25,runner:5,stalker:8},
 places:['Roselières basses','Bosquets humides épars','Pompage et maisons abandonnées'],description:'Végétation basse et bouquets d’aulnes autour de plaques boueuses. Les réserves manufacturées sont rares hors des installations.',risk:'Progression lente et faible visibilité dans les roseaux. Tous les sols restent de plain-pied.'},
 {id:'heath',name:'Landes sèches',climate:[.39,.21,.48],spread:[.29,.28,.3],spawnBiome:'rural',surface:'grass',treeChance:.075,rockChance:.41,decorChance:.85,
 palette:{base:'#75734f',secondary:'#8b7e59',soil:'#978366',accent:'#a79570',rock:'#9b9d92',grass:'#a59e71',water:'#62776b'},
 trees:{pine:5,birch:3,oak:1},rocks:{schist:5,scree:5,granite:2},decor:{dryGrass:8,flowers:3,pebbles:5,grass:2},
 buildings:{cabin:5,ruin:6,quarry:3,farmhouse:3,fuel:2,bunker:2},enemies:{walker:72,runner:10,crawler:9,stalker:9},
 places:['Herbes sèches et broussailles basses','Affleurements épars','Ruines rurales isolées'],description:'Terres ouvertes de broussailles, herbe sèche et schiste. Quelques pins servent de repères entre les sites éloignés.',risk:'Exposition sur terrain dégagé ; prévoir le ravitaillement avant une longue collecte de pierre.'},
 {id:'limestone',name:'Collines calcaires',climate:[.79,.28,.62],spread:[.28,.29,.31],spawnBiome:'rural',surface:'gravel',treeChance:.15,rockChance:.72,decorChance:.83,
 palette:{base:'#868367',secondary:'#989276',soil:'#a89779',accent:'#b9ac83',rock:'#c4baa0',grass:'#9e9d6a',water:'#72847a'},
 trees:{pine:6,oak:3,fruit:1},rocks:{limestone:8,scree:3},decor:{pebbles:8,dryGrass:7,grass:2,fallenBranch:1},
 buildings:{quarry:8,mine:3,cabin:3,farmhouse:3,ruin:4,smallWorkshop:2},enemies:{walker:69,crawler:10,breacher:10,runner:7,stalker:4},
 places:['Affleurements calcaires','Pins espacés et herbes sèches','Carrières et petites exploitations'],description:'Sol pâle, pins espacés et nombreux blocs calcaires. La récupération de pierre justifie un détour vers les carrières.',risk:'Rochers physiques à contourner ; le relief visuel ne crée pas de falaise ou d’étage supplémentaire.'},
 {id:'rockyHighland',name:'Hauts plateaux rocheux',climate:[.18,.25,.91],spread:[.3,.3,.27],spawnBiome:'rural',surface:'gravel',treeChance:.055,rockChance:.88,decorChance:.67,
 palette:{base:'#727b71',secondary:'#899087',soil:'#817d70',accent:'#a8afa1',rock:'#a7afad',grass:'#879078',water:'#667f82'},
 trees:{pine:5,fir:3,birch:2},rocks:{granite:7,schist:4,scree:4},decor:{pebbles:10,dryGrass:5,grass:2},
 buildings:{mine:7,quarry:6,cabin:5,bunker:3,ruin:3,generatorRoom:1},enemies:{walker:74,crawler:9,breacher:8,stalker:6,armored:3},
 places:['Dalles et blocs granitiques','Végétation rase','Sites d’extraction et abris'],description:'Terres froides et minérales aux arbres très espacés. Granite et schiste dominent les réserves naturelles.',risk:'Bois rare, minéraux abondants. Pas de simulation de neige profonde, d’escalade ou d’hypothermie.'},
 {id:'orchard',name:'Vergers et cultures abandonnés',climate:[.79,.55,.22],spread:[.3,.28,.25],spawnBiome:'rural',surface:'grass',treeChance:.23,rockChance:.15,decorChance:.9,
 palette:{base:'#747a47',secondary:'#88884e',soil:'#947755',accent:'#b19b62',rock:'#aaa089',grass:'#97a45b',water:'#687a64'},
 trees:{fruit:8,oak:1,poplar:1},rocks:{limestone:5,scree:5},decor:{grass:6,flowers:5,dryGrass:4,leaves:3},
 buildings:{marketgarden:9,farmhouse:7,garden:5,centralKitchen:2,veterinary:2,inn:2,smallWorkshop:2,grocer:1},enemies:{walker:68,runner:16,crawler:8,stalker:6,breacher:2},
 places:['Vergers recolonisés','Exploitations maraîchères','Jardineries et réserves alimentaires'],description:'Arbres fruitiers et anciens terrains cultivés. Les denrées récupérables proviennent des réserves finies des exploitations.',risk:'L’apparence fruitière ne crée pas de nourriture renouvelable : les arbres fournissent du bois.'},
 {id:'brownfield',name:'Friches reconquises',climate:[.65,.38,.47],spread:[.2,.2,.2],spawnBiome:'industrial',surface:'gravel',treeChance:.1,rockChance:.35,decorChance:.85,
 palette:{base:'#707568',secondary:'#848776',soil:'#837b69',accent:'#aaa187',rock:'#939b97',grass:'#7f9064',water:'#687a74'},
 trees:{birch:5,poplar:3,pine:2,oak:1},rocks:{scree:6,schist:3,limestone:2},decor:{rubble:7,pebbles:5,grass:5,dryGrass:3},
 buildings:{warehouse:5,scrapyard:6,freight:4,logisticsHall:3,reuse:4,garage:4,generatorRoom:3,smallWorkshop:4,selfstorage:3,firestation:1,hardware:2},enemies:{walker:57,breacher:17,armored:11,runner:7,crawler:8},
 places:['Dalles envahies d’herbe','Bouquets de bouleaux pionniers','Dépôts, ateliers et casse'],description:'Sols gris, gravats et végétation pionnière autour des anciens sites d’activité. Le butin technique reste attaché aux contenants.',risk:'Approches masquées par les ateliers ; les gravats décoratifs ne sont pas des stocks supplémentaires.'}
];
// Town services remain eligible in inhabited landscape types; every existing plan stays represented.
Object.assign(defs.find(d=>d.id==='bocage').buildings,{house:4,duplex:3,school:2,townhall:2,bakery:2,library:1,postoffice:2,gym:1,basementHouse:2,cottageSmall:3,duplexWide:2,cornerShop:2,cafe:2,medicalCentre:1});
Object.assign(defs.find(d=>d.id==='orchard').buildings,{villa:2,market:2,pharmacy:1,dental:1,diner:1});
Object.assign(defs.find(d=>d.id==='brownfield').buildings,{apartments:4,mall:2,hotel:2,laundry:2,rowhouse:4,studioBlock:3,longBlock:3,residence:3,superstore:2,bank:1,officeBlock:3});
root.DeadwallCore.BiomeRules135=freeze({version:1,generation:6,chunk:256,climate:{warpScale:3500,warpAmplitude:1150,temperatureScale:4600,moistureScale:3900,elevationScale:3300,detailScale:1350,detailWeight:.22,contrast:1.85,blendSoftness:.38},scatter:{treeCandidates:1100,rockCandidates:96,decorCandidates:120,treeSpacing:3.4,rockSpacing:2.8,ecologicalClearance:22,patchScale:155,patchFineScale:43},trees,rocks,defs,enemies:{walker:{id:'walker',name:'Errant de campagne',health:65,speed:1.1,damage:8,interval:1.15},runner:{id:'runner',name:'Infecté récent',health:48,speed:1.65,damage:7,interval:1},armored:{id:'armored',name:'Agent protégé',health:65,speed:.85,damage:10,interval:1.5},crawler:{id:'crawler',name:'Rampant',health:42,speed:1.35,damage:6,interval:.95},breacher:{id:'breacher',name:'Ouvrier infecté',health:65,speed:.95,damage:9,interval:1.35},stalker:{id:'stalker',name:'Infecté mobile',health:54,speed:1.45,damage:7,interval:1.1}}});
root.DeadwallCore.GeographyRules135=freeze({size:24576,homeMinFraction:.36,homeMaxFraction:.64,settlements:34,roadStep:96,margin:120,settlementSpacing:1500,annexes:{east:{dx:174,dy:-2,a:Math.PI/2},west:{dx:-174,dy:2,a:-Math.PI/2},north:{dx:-2,dy:-174,a:0},south:{dx:2,dy:174,a:Math.PI},outer:{dx:139,dy:139,a:.75}},annexReserve:40,homeBypass:250});
/* G7 is opt-in by campaign generation; all historical rule objects above stay intact. */
root.DeadwallCore.GeographyRules141=freeze({generation:7,homeMinFraction:.23,homeMaxFraction:.77,streetPositionJitter:.10,streetBend:.27,streetAngleSpread:.95,streetLengthMin:.34,streetLengthRange:.45});
root.DeadwallCore.WorldTownRules141=freeze({version:1,frontageStep:64,setback:24,attemptLimit:1800,roadsideChance:.22,services:{housing:['cottageSmall','house','familyHouse','bungalow'],food:['grocer','bakery','market','inn'],work:['smallWorkshop','garage','joinery'],care:['clinic','pharmacy','veterinary'],civic:['townhall','chapel','postoffice'],school:['school','library']},required:{hameau:['housing','food','work'],village:['housing','food','work','care','civic'],bourg:['housing','food','work','care','civic','school'],ville:['housing','food','work','care','civic','school'],'grande-ville':['housing','food','work','care','civic','school']},zoning:{hameau:{habitat:65,centre:15,activite:20},village:{habitat:58,centre:24,activite:18},bourg:{habitat:52,centre:30,activite:18},ville:{habitat:50,centre:32,activite:18},'grande-ville':{habitat:48,centre:32,activite:20}},housing:{rural:{cottageSmall:4,house:3,bungalow:3,familyHouse:2},urban:{house:2,duplex:3,rowhouse:3,apartments:2,studioBlock:2}},centre:{grocer:3,bakery:2,cafe:2,postoffice:1,clinic:1,chapel:1,townhall:1,cornerShop:2},work:{smallWorkshop:4,garage:3,joinery:2,warehouse:2,reuse:1}});
root.DeadwallCore.EcologyRules141=freeze({"wetGroveFraction":0.28,"mineralGroveFraction":0.25,"orchardRowsFraction":0.87,"urbanStoneFraction":0.6,"generation":7,"patchScale":180,"fineScale":58,"openingScale":110,"mineralScale":125,"wetScale":90,"patchDetailWeight":0.24,"groveThreshold":[0.46,0.72],"openingThreshold":[0.57,0.77],"mineralThreshold":[0.26,0.73],"wetThreshold":[0.31,0.7],"speciesPatchScale":110,"speciesPatchJitter":0.72,"speciesAffinity":0.72,"orchardFieldScale":570,"orchardRowSpacing":9,"orchardRowWidth":1.8,"orchardRowFloor":0.14,"orchardRowPeak":2.2,"habitats":{"grassland":{"name":"Prairie et jachère","treeFactor":0.35,"rockFactor":0.65,"decorFactor":0.95,"decor":{"grass":8,"flowers":4,"dryGrass":2}},"grove":{"name":"Bosquet et lisière","treeFactor":2.25,"rockFactor":0.6,"decorFactor":1.05,"decor":{"grass":3,"leaves":6,"fallenBranch":3}},"forestFloor":{"name":"Futaie et sous-bois","treeFactor":1.08,"rockFactor":0.85,"decorFactor":1.05,"decor":{"leaves":9,"fallenBranch":6,"grass":1}},"clearing":{"name":"Clairière herbeuse","treeFactor":0.06,"rockFactor":0.6,"decorFactor":0.9,"decor":{"grass":9,"flowers":5,"fallenBranch":1}},"stonefield":{"name":"Affleurement et pierrier","treeFactor":0.15,"rockFactor":1.7,"decorFactor":0.8,"decor":{"pebbles":10,"dryGrass":5}},"reeds":{"name":"Roselière et fond humide","treeFactor":0.7,"rockFactor":0.6,"decorFactor":1.15,"decor":{"reeds":12,"grass":4,"fallenBranch":1}},"mudflat":{"name":"Plaque de terre humide","treeFactor":0.25,"rockFactor":0.6,"decorFactor":0.45,"decor":{"reeds":3,"pebbles":4,"grass":2}},"orchardRows":{"name":"Rangs de verger abandonné","treeFactor":1.35,"rockFactor":0.35,"decorFactor":1,"decor":{"grass":5,"flowers":3,"leaves":6}},"pioneer":{"name":"Reprise végétale de friche","treeFactor":2.6,"rockFactor":0.75,"decorFactor":1.1,"decor":{"rubble":8,"grass":6,"dryGrass":3,"fallenBranch":2}}}});
})(globalThis);

/* 1.46 — ranges in metres; lamps illuminate but never observe map contacts. */
(function(root){'use strict';root.DeadwallCore.VisibilityRules146=Object.freeze({
 unitsPerMetre:32,indexCell:16,player:20,nightFloor:.2,lineRadius:.015,beamDetectFraction:.94,
 units:Object.freeze({worker:10,soldier:16,medic:10,engineer:10}),
 companions:Object.freeze({lea:24,samir:12,ines:12,malik:18}),
 buildings:Object.freeze({core:12,barracks:12,clinic:10,workshop:10,watchtower:22,turret:14,heavyTurret:18}),
 districts:Object.freeze({watch:22,clinic:10,workshop:10,depot:10,housing:8}),
 districtGeometry:Object.freeze({left:-22,top:-22,columns:2,columnStep:28,rowStep:13,width:20,height:9}),
 regionalTorchRange:9,regionalTorchHalfAngle:.52,regionalCarRange:22,regionalCarHalfAngle:.46
});})(globalThis);

/* 1.47 — finite field supplies are prepared from the commander's carried bag. */
(function(root){'use strict';const C=root.DeadwallCore;
C.FortificationPackRules=Object.freeze({...C.FortificationPackRules,
 fieldSupplyMoveTolerance:2,
 fieldSupply:Object.freeze({
  ammo:Object.freeze({name:'Conditionner un appoint de cartouches',amount:6,seconds:6,cost:Object.freeze({ammo:6,wood:1,scrap:1})}),
  repair:Object.freeze({name:'Compléter la cassette de réparation',amount:80,seconds:8,cost:Object.freeze({scrap:4,wood:2})})
 })
});})(globalThis);

/* 1.50 — city choices use the existing physical construction and economy. */
(function(root){
 'use strict';const C=root.DeadwallCore;if(C.CityContent150)return;
 const freeze=value=>{for(const v of Object.values(value))if(v&&typeof v==='object')freeze(v);return Object.freeze(value);};
 const defs={};
 function add(id,name,tier,category,family150,size,cost,health,buildTime,score,description,extra){
  const def={id,name,unlockTier:tier,category,family150,size,cost,health,buildTime,score,description,
   icon:category==='defense'?'▣':category==='colony'?'⌂':'▦',symbol:name.split(' ').map(v=>v[0]).join('').slice(0,3),color:'#60675b',roof:'#8b8f79',...extra};
  if(C.BUILDINGS[id])throw Error('Construction de cité déjà déclarée : '+id);
  defs[id]=def;C.BUILDINGS[id]=def;return def;
 }
 add('casemate150','Casemate de tir',3,'defense','defense',[3,2],{wood:35,scrap:105,stone:75,ammo:30},1250,32,12,
  'Position autonome à cadence modérée. Une cartouche par tir, portée courte et emprise à protéger ; aucun soldat fourni.',
  {defense:true,range:270,fireRate:1,damage:46,ammoPerShot:1,observerRange150:9,requires:'barracks',sprite149:'manufacture'});
 add('aidStation150','Poste de secours de rempart',3,'colony','medical',[3,2],{wood:55,scrap:95,stone:55,medicine:12},780,28,10,
  'Soigne les personnes vivantes présentes et accessibles, contre médicaments et courant. Petite portée ; ne fabrique pas de fournitures.',
  {urbanKind:'hospital',medicalRadius:115,healRate:1.2,medicinePerHealth:.035,powerUse:2,light:65,requires:'clinic',sprite149:'hospital'});
 add('courtyardGarden150','Jardin vivrier de quartier',4,'industry','garden',[3,3],{wood:35,scrap:20,stone:55},320,24,4,
  'Petit jardin aménagé produisant lentement des vivres sans courant ni carburant. Fragile, moins productif qu’une ferme ; les allées dessinées restent décoratives.',
  {urbanKind:'food',production:{food:.22},requires:'farm',sprite149:'food'});
 add('gateStore150','Soute de porte',4,'colony','storage',[3,3],{wood:75,scrap:130,stone:85},1150,30,12,
  'Ajoute 450 places par ressource et accepte les dépôts réels sans courant. Réserve compacte pour un accès extérieur ; aucun stock livré.',
  {urbanKind:'storage',storage:450,storageDepot:true,requires:'warehouse',sprite149:'storage'});
 add('sterilizationLab150','Station de stérilisation',5,'industry','medicine',[4,3],{wood:95,scrap:220,stone:160,medicine:18},920,38,18,
  'Prépare des médicaments contre nourriture, ferraille et courant. Aucun soin direct ; arrête les intrants lorsque la sortie est pleine.',
  {urbanKind:'scrap',production:{medicine:.11},consumes:{food:.18,scrap:.045},powerUse:5,requires:'clinic',sprite149:'manufacture'});
 add('solarPark150','Parc solaire',5,'industry','solar',[5,4],{wood:120,scrap:360,stone:220},900,38,18,
  '45 unités électriques pendant le calme uniquement. Grande emprise sans combustible ; aucune production à l’alerte, à l’assaut ou pendant la sécurisation.',
  {urbanKind:'solar',powerGen:45,solar:true,requires:'workshop'});
 add('biofuelYard150','Unité de valorisation du bois',6,'industry','fuel',[5,4],{wood:110,scrap:280,stone:160,fuel:30},900,42,22,
  'Convertit bois et ferraille en carburant avec du courant. Alternative à la micro-raffinerie ; cesse de consommer si le stockage est plein, destruction explosive.',
  {urbanKind:'fuel',production:{fuel:.45},consumes:{wood:.65,scrap:.04},powerUse:6,explosive:60,requires:'refinery',sprite149:'power'});
 add('garrisonQuarters150','Cantonnement de garnison',6,'colony','housing',[4,3],{wood:130,scrap:260,stone:260},1200,40,22,
  '36 logements et 350 places par ressource dans un bloc de deux niveaux. Les recrutements restent payés et les habitants consomment des rations ; aucun soldat offert.',
  {urbanKind:'housing',floors:2,housing:36,storage:350,powerUse:2,light:100,requires:'barracks',sprite149:'housingLow'});
 add('electricCannery150','Conserverie électrique',7,'industry','food',[5,4],{wood:180,scrap:440,stone:360},1100,44,26,
  'Produit des vivres sans carburant, contre bois et huit unités électriques. La serre peut remplacer cet atelier : moins de débit, davantage de courant, sans consommation de bois.',
  {urbanKind:'food',production:{food:2.1},consumes:{wood:.15},powerUse:8,requires:'farm',sprite149:'food'});
 add('twinGun150','Position de mitrailleuses jumelées',7,'defense','defense',[2,3],{wood:70,scrap:280,stone:260,ammo:100},1200,42,24,
  'Position automatique sans courant. Deux cartouches par tir et cadence soutenue : choisissez une filière de munitions avant d’en multiplier les postes.',
  {defense:true,range:330,fireRate:4.5,damage:31,ammoPerShot:2,observerRange150:11,requires:'ammoFactory',sprite149:'manufacture'});
 add('triageStation150','Antenne sanitaire',7,'colony','medical',[3,2],{wood:100,scrap:310,stone:240,medicine:32},1150,42,24,
  'Soins rapides sur une petite zone, contre davantage de médicaments et de courant par personne soignée. Remplace le poste de secours sans agrandir son emprise.',
  {urbanKind:'hospital',medicalRadius:115,healRate:2.6,medicinePerHealth:.055,powerUse:4,light:85,requires:'clinic',sprite149:'hospital'});
 add('reinforcedCasemate150','Casemate renforcée',8,'defense','defense',[3,2],{wood:65,scrap:420,stone:510,ammo:140},2100,58,28,
  'Casemate plus résistante et toujours autonome. Deux cartouches par tir, portée contenue et cadence modérée ; même emprise que le premier modèle.',
  {defense:true,range:300,fireRate:1.4,damage:54,ammoPerShot:2,observerRange150:10,requires:'workshop',sprite149:'manufacture'});
 add('electricGreenhouse150','Serres éclairées',8,'industry','food',[5,4],{wood:220,scrap:520,stone:420},1000,48,28,
  'Culture de vivres sans bois ni carburant, contre quatorze unités électriques. Moins de débit que la conserverie ; même emprise, production limitée par courant et stockage.',
  {urbanKind:'food',production:{food:1.6},powerUse:14,requires:'farm',sprite149:'food'});
 add('wallStore150','Dépôt de rempart',8,'colony','storage',[3,3],{wood:130,scrap:320,stone:260},1800,42,24,
  'Ajoute 1 200 places par ressource avec un dépôt physique sans courant. Emprise compacte et résistance accrue ; aucun convoyeur, véhicule ou matériau fourni.',
  {urbanKind:'storage',storage:1200,storageDepot:true,requires:'warehouse',sprite149:'storage'});
 add('dualRecovery150','Centre de récupération mixte',9,'industry','recovery',[3,3],{wood:140,scrap:520,stone:370,fuel:50},1250,48,30,
  'Produit bois et ferraille ensemble contre combustible et courant. Si une sortie sature, tout le traitement s’arrête ; remplace le banc de récupération sans agrandir le terrain.',
  {urbanKind:'scrap',production:{wood:.45,scrap:.65},consumes:{fuel:.07},powerUse:6,requires:'workshop',sprite149:'manufacture'});
 add('concreteWatch150','Tour de veille béton',9,'defense','watch',[2,2],{wood:110,scrap:450,stone:620,ammo:100},1300,50,30,
  'Poste d’observation physique de 28 mètres. Tir automatique lent à longue portée, contre courant et munitions ; les obstacles et la nuit limitent la vision.',
  {defense:true,range:580,fireRate:.65,damage:68,ammoPerShot:1,powerUse:4,light:170,observerRange150:28,requires:'workshop',sprite149:'manufacture'});
 add('medicalComplex150','Pôle de triage',9,'colony','medical',[4,3],{wood:180,scrap:650,stone:550,medicine:45},1500,52,32,
  'Soigne les blessés proches et accessibles contre médicaments et courant. Remplace la station de stérilisation : sa production de médicaments disparaît, les soins exigent une autre filière.',
  {urbanKind:'hospital',medicalRadius:130,healRate:2.8,medicinePerHealth:.055,powerUse:8,light:120,requires:'clinic',sprite149:'hospital'});
 add('continuityArsenal150','Arsenal de continuité',10,'industry','ammo',[5,4],{wood:280,scrap:980,stone:850,ammo:160},1650,62,36,
  'Munitions contre ferraille, pierre et douze unités électriques, sans carburant. Une filière alternative pour les sièges ; aucune cartouche livrée au chantier.',
  {urbanKind:'ammo',production:{ammo:2.1},consumes:{scrap:.46,stone:.08},powerUse:12,explosive:75,requires:'ammoFactory',sprite149:'manufacture'});
 add('equippedShelter150','Abri de repli équipé',10,'colony','shelter',[4,3],{wood:220,scrap:700,stone:760,medicine:30},1900,56,34,
  '32 logements, 1 000 places par ressource et soins lents sur place. Dépôt physique, médicaments et courant restent nécessaires ; ni repli instantané ni occupants offerts.',
  {urbanKind:'housing',floors:2,housing:32,storage:1000,storageDepot:true,medicalRadius:100,healRate:.8,medicinePerHealth:.04,powerUse:3,light:95,requires:'hospital',sprite149:'housingLow'});
 add('frontBattery150','Accumulateur de front',10,'industry','battery',[3,3],{scrap:820,stone:600,fuel:55},1250,52,32,
  'Réserve électrique courte à forte puissance : 1 500 unités, sortie maximale de 100. Se charge avec le surplus réel du réseau ; toujours vide à sa mise en service.',
  {urbanKind:'scrap',battery:{capacity:1500,chargeRate:10,output:100},requires:'powerPlant',sprite149:'manufacture'});
 const upgrades={casemate150:'reinforcedCasemate150',aidStation150:'triageStation150',gateStore150:'wallStore150',sterilizationLab150:'medicalComplex150',electricCannery150:'electricGreenhouse150',recoveryBench:'dualRecovery150'};
 // The historical upgrade changes type immediately: equal footprints preserve occupation.
 for(const [from,to]of Object.entries(upgrades)){
  const source=C.BUILDINGS[from],target=C.BUILDINGS[to];
  if(source.upgradeTo||source.size.some((n,i)=>n!==target.size[i]))throw Error('Évolution de cité incompatible : '+from);
  if(defs[from])source.upgradeTo=to;else C.BUILDINGS[from]=freeze({...source,upgradeTo:to});
 }
 for(const def of Object.values(defs))freeze(def);
 const plans=freeze([
  {id:'forwardCare150',name:'Cour de soutien avancée',w:12,h:9,unlock:null,tier150:7,
   description:'Antenne sanitaire, soute de porte, cantonnement et lampadaire séparés par des passages. Quatre chantiers à financer puis construire ; aucune enceinte ni réserve fournie.',
   layout:[['triageStation150',0,0],['gateStore150',8,0],['garrisonQuarters150',0,6],['streetlight',10,6]]},
  {id:'electricFoodCourt150',name:'Cour alimentaire électrique',w:15,h:11,unlock:null,tier150:8,
   description:'Serres éclairées, parc solaire, dépôt de rempart et lampadaire. Le parc produit au calme seulement : préparez le courant nocturne séparément. Chaque fondation est payée au coût ordinaire.',
   layout:[['electricGreenhouse150',0,0],['solarPark150',9,0],['wallStore150',0,7],['streetlight',12,8]]},
  {id:'watchedBastion150',name:'Bastion sous veille',w:14,h:9,unlock:null,tier150:9,
   description:'Deux casemates renforcées, tour de veille et dépôt compact autour d’une liaison libre. Aucun mur inclus ; armes, courant, munitions et observation restent ceux des supports construits.',
   layout:[['reinforcedCasemate150',0,0],['reinforcedCasemate150',10,0],['concreteWatch150',0,5],['wallStore150',10,5]]},
  {id:'continuitySector150',name:'Secteur de continuité',w:15,h:10,unlock:null,tier150:10,
   description:'Arsenal, accumulateur, abri équipé et dépôt de rempart. Fonds et chantiers ordinaires ; batterie vide, habitants à recruter, médicaments et matériaux à transporter.',
   layout:[['continuityArsenal150',0,0],['frontBattery150',11,0],['equippedShelter150',0,6],['wallStore150',11,6]]}
 ]);
 const prior=C.Dayworks,byId=new Map(plans.map(p=>[p.id,p]));
 function footprint(id,gx,gy){
  if(!byId.has(id))return prior.footprint(id,gx,gy);
  if(!Number.isInteger(gx)||gx< -128||gx>128||!Number.isInteger(gy)||gy< -128||gy>128)throw Error('Projet inconnu.');
  return byId.get(id).layout.map(([type,x,y,rotation=0])=>({type,gx:gx+x,gy:gy+y,rotation}));
 }
 const dayworks=Object.freeze({...prior,PLANS:Object.freeze([...prior.PLANS,...plans]),footprint});
 C.Dayworks=dayworks;root.DeadwallDayworks=dayworks;
 C.CityContent150=Object.freeze({BUILDINGS:Object.freeze(defs),UPGRADES:freeze(upgrades),PLANS:plans});
})(globalThis);

/* 1.51 — city ages require a living settlement; raw score still attracts hordes. */
(function(root){
 'use strict';const C=root.DeadwallCore;
 const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
 const RULES=freeze({version:1,fullModels:3,partialModels:2,partialFactor:.25,fullWalls:160,partialWalls:80,poiHarvest:12,feedstockSeconds:30,populationFoodPerSecond:.0065});
 const columns=freeze({
  waves:[0,0,2,5,9,14,21,30,40,50,60],population:[1,1,8,14,22,34,50,72,100,140,190],
  surveys:[0,0,1,2,3,4,5,6,6,6,6],pois:[0,0,0,1,2,4,6,9,12,16,20],biomes:[0,0,0,0,0,2,2,3,3,4,4],
  variety:[0,1,6,10,14,18,22,26,30,34,38],housing:[1,8,14,22,36,54,76,110,150,200,240],
  storage:[100,500,1100,1700,2300,2900,3900,6100,8500,12000,18000],
  workers:[0,0,3,4,6,8,12,16,22,28,36],soldiers:[0,0,2,3,5,7,10,14,20,26,34],specialists:[0,0,0,1,2,3,4,6,8,10,12],
  power:[0,0,24,40,60,90,120,170,220,280,360],
  wood:[0,0,.3,.4,.5,.6,.9,1.2,1.5,2,2.5],scrap:[0,0,.3,.4,.5,.6,.9,1.2,1.5,2,2.5],
  stone:[0,0,0,.2,.3,.4,.6,.8,1.1,1.7,2.5],food:[0,0,.3,.4,.6,.8,1.1,1.4,1.8,2.3,3],
  fuel:[0,0,0,.1,.1,.15,.2,.25,.35,.45,.6],ammo:[0,0,0,0,.6,.9,1.2,1.8,2.6,3.6,5.2],medicine:[0,0,0,0,0,0,.05,.08,.11,.15,.2]
 });
 const LABELS=freeze({score:'Développement diversifié',waves:'Vagues réellement survécues',population:'Habitants vivants',surveys:'Relevés de terrain achevés',pois:'Lieux régionaux récoltés',biomes:'Biomes des lieux récoltés',variety:'Modèles achevés distincts',housing:'Places de logement',storage:'Stockage par ressource',workers:'Ouvriers vivants',soldiers:'Fusiliers vivants',specialists:'Secouristes et ingénieurs vivants',power:'Production électrique soutenable',wood:'Production de bois',scrap:'Production de ferraille',stone:'Production de pierre',food:'Production de vivres',fuel:'Production de carburant',ammo:'Production de munitions',medicine:'Production de médicaments'});
 const TIER_REQUIREMENTS=freeze(C.CITY_TIERS.map(t=>({age:t.id,score:t.requiredScore,...Object.fromEntries(Object.entries(columns).map(([key,values])=>[key,values[t.id]]))})));
 function done(b){return b&&!b.dead&&(b.health===undefined||b.health>0)&&(b.completed===true||b.completed===undefined&&b.progress===1);}
 function developmentScore(buildings){const counts=new Map();let score=0;for(const b of buildings){if(!done(b))continue;const d=C.BUILDINGS[b.type];if(!d)continue;const n=counts.get(b.type)||0;counts.set(b.type,n+1);const full=d.wall?RULES.fullWalls:RULES.fullModels,partial=d.wall?RULES.partialWalls:RULES.partialModels;score+=(d.score||0)*(n<full?1:n<full+partial?RULES.partialFactor:0);}return score;}
 function requirements(age,facts){const spec=TIER_REQUIREMENTS[age];if(!spec)throw Error('Âge urbain inconnu.');const criteria=Object.entries(spec).filter(([key,value])=>key!=='age'&&value>0).map(([id,required])=>{const bypass=id==='biomes'&&facts.generation<6,current=Number.isFinite(facts[id])?facts[id]:0;return{id,label:LABELS[id],current,required,met:bypass||current+1e-7>=required,unit:C.RESOURCE_KEYS.includes(id)?'u/s':id==='score'?'pts':id==='power'?'unités':'',...(bypass?{legacy:true}:{})};});return{age,criteria,missing:criteria.filter(c=>!c.met),met:criteria.every(c=>c.met)};}
 const initial=age=>({version:1,age:age??0});
 C.Balance151=freeze({RULES,TIER_REQUIREMENTS,LABELS,developmentScore,requirements,initial,done});
 C.Urban=Object.freeze({...C.Urban,knownTier:raw=>{const state=C.Urban.normalize(raw);return state.progression151?C.CITY_TIERS[state.progression151.age]:C.cityTier(state.peakScore);}});
})(globalThis);
