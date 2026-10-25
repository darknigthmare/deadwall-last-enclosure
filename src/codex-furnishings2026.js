/* Authored-world inspection furniture. Metres, finite placement work and no
 * campaign stock, RNG or save mutation. Existing footprint catalogues remain
 * authoritative; heights and new fixtures are labelled author design. */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  root.DeadwallCodexFurnishings2026 = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const RULES = Object.freeze({version: 1, actorRadiusM: .32, pathWidthM: .8,
    wallMarginM: .08, gapM: .08, serviceDepthM: .8, maxPerRoom: 12,
    maxCandidates: 160, wallSamples: 9, epsilon: .00001});
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  const norm = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/œ/g, 'oe').trim();
  const positive = value => Number.isFinite(value) && value > 0;
  const rectangle = value => value && [value.x, value.y, value.w, value.h].every(Number.isFinite) && value.w > 0 && value.h > 0;
  const hit = (a, b, gap = 0) => a.x < b.x + b.w + gap - 1e-8 && a.x + a.w > b.x - gap + 1e-8 &&
    a.y < b.y + b.h + gap - 1e-8 && a.y + a.h > b.y - gap + 1e-8;
  const within = (a, b, margin = 0) => a.x >= b.x + margin - 1e-8 && a.y >= b.y + margin - 1e-8 &&
    a.x + a.w <= b.x + b.w - margin + 1e-8 && a.y + a.h <= b.y + b.h - margin + 1e-8;
  const inflated = (a, margin) => ({x: a.x - margin, y: a.y - margin, w: a.w + 2 * margin, h: a.h + 2 * margin});
  const center = a => ({x: a.x + a.w / 2, y: a.y + a.h / 2});
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  // w/h come from the live game's existing footprint catalogue. heightM is an
  // explicitly authored inspection envelope, never a manufacturer's assertion.
  const CATALOGUE = freeze({
    bed: {name: 'Lit double', heightM: .65, lootEligible: false},
    wardrobe: {name: 'Armoire individuelle', heightM: 1.9, lootEligible: true},
    desk: {name: 'Bureau', heightM: .76, lootEligible: true},
    table: {name: 'Table', heightM: .75, lootEligible: false},
    chair: {name: 'Chaise', heightM: .9, lootEligible: false},
    bench: {name: 'Banc', heightM: .85, lootEligible: false},
    sofa: {name: 'Canapé', heightM: .9, lootEligible: false},
    shelf: {name: 'Rayonnage', heightM: 1.9, lootEligible: true},
    smallCabinet: {name: 'Meuble bas', heightM: .85, lootEligible: true},
    counter: {name: 'Comptoir', heightM: 1.05, lootEligible: true},
    oven: {name: 'Four professionnel', heightM: 1, lootEligible: false},
    fridge: {name: 'Réfrigérateur', heightM: 1.8, lootEligible: true},
    sink: {name: 'Évier', heightM: .9, lootEligible: false},
    washer: {name: 'Lave-linge', heightM: .9, lootEligible: false},
    laundryBasket: {name: 'Panier à linge', heightM: .7, lootEligible: true},
    medical: {name: 'Armoire de soins', heightM: 1.8, lootEligible: true},
    dentalChair: {name: 'Fauteuil de consultation', heightM: 1.2, lootEligible: false},
    sterilizer: {name: 'Stérilisateur', heightM: 1.2, lootEligible: false},
    workbench: {name: 'Établi', heightM: .9, lootEligible: true},
    toolbox: {name: 'Coffre à outils', heightM: .55, lootEligible: true},
    machine: {name: 'Machine technique', heightM: 1.8, lootEligible: false},
    pump: {name: 'Pompe de service', heightM: 1.1, lootEligible: false},
    electricalRack: {name: 'Baie électrique', heightM: 1.95, lootEligible: false},
    generator: {name: 'Groupe auxiliaire', heightM: 1.7, lootEligible: false},
    crate: {name: 'Caisse fermée', heightM: .85, lootEligible: true},
    crateStack: {name: 'Caisses empilées', heightM: 1.7, lootEligible: true},
    steelTable: {name: 'Table inox', heightM: .9, lootEligible: false},
    dishRack: {name: 'Égouttoir de cuisine', heightM: 1.7, lootEligible: false},
    toilet: {name: 'WC', heightM: .8, lootEligible: false},
    singleBunk: {name: 'Couchette individuelle', w: 2, h: .75, heightM: 1.7,
      sourceDimensions: 'author-design:single-bunk', lootEligible: false},
    shower: {name: 'Cabine de douche', w: .9, h: .9, heightM: 2,
      sourceDimensions: 'author-design:shower', lootEligible: false},
    feedTrough: {name: 'Mangeoire', w: 2, h: .5, heightM: .65,
      sourceDimensions: 'author-design:feed-trough', lootEligible: false},
    waterTrough: {name: 'Abreuvoir', w: 1.2, h: .5, heightM: .6,
      sourceDimensions: 'author-design:water-trough', lootEligible: false},
    fodderRack: {name: 'Râtelier à fourrage', w: 1.6, h: .6, heightM: 1.3,
      sourceDimensions: 'author-design:fodder-rack', lootEligible: false},
    milkingUnit: {name: 'Poste de traite', w: 1.1, h: .8, heightM: 1.6,
      sourceDimensions: 'author-design:milking-unit', lootEligible: false},
    milkVat: {name: 'Cuve à lait', w: 1.5, h: 1.3, heightM: 1.8,
      sourceDimensions: 'author-design:milk-vat', lootEligible: false},
    nestBox: {name: 'Pondoir', w: 1.2, h: .5, heightM: .8,
      sourceDimensions: 'author-design:nest-box', lootEligible: false},
    wineVat: {name: 'Cuve vinicole', w: 1.6, h: 1.6, heightM: 2.2,
      sourceDimensions: 'author-design:wine-vat', lootEligible: false},
    wineBarrel: {name: 'Fût de chai', w: .8, h: .8, heightM: .95,
      sourceDimensions: 'author-design:wine-barrel', lootEligible: false},
    grapePress: {name: 'Pressoir', w: 1.4, h: 1.2, heightM: 1.8,
      sourceDimensions: 'author-design:grape-press', lootEligible: false},
    veterinaryTable: {name: 'Table de soins vétérinaires', w: 1.3, h: .7, heightM: .85,
      sourceDimensions: 'author-design:veterinary-table', lootEligible: false},
    growingBench: {name: 'Table de semis', w: 1.6, h: .7, heightM: .85,
      sourceDimensions: 'author-design:growing-bench', lootEligible: false},
    growingBed: {name: 'Bac de culture', w: 1.8, h: .7, heightM: .65,
      sourceDimensions: 'author-design:growing-bed', lootEligible: false},
    conveyor: {name: 'Convoyeur', w: 3.2, h: 1, heightM: 1.1,
      sourceDimensions: 'author-design:industrial-conveyor', lootEligible: false},
    dosingUnit: {name: 'Poste de dosage', w: 1.5, h: 1.2, heightM: 2.1,
      sourceDimensions: 'author-design:industrial-dosingUnit', lootEligible: false},
    foodMixer: {name: 'Mélangeur alimentaire', w: 1.8, h: 1.6, heightM: 2,
      sourceDimensions: 'author-design:industrial-foodMixer', lootEligible: false},
    heatChamber: {name: 'Enceinte thermique', w: 2.2, h: 1.6, heightM: 2.2,
      sourceDimensions: 'author-design:industrial-heatChamber', lootEligible: false},
    metalSaw: {name: 'Scie de débit', w: 2.2, h: 1.2, heightM: 1.6,
      sourceDimensions: 'author-design:industrial-metalSaw', lootEligible: false},
    lathe: {name: 'Tour mécanique', w: 2.4, h: 1.2, heightM: 1.6,
      sourceDimensions: 'author-design:industrial-lathe', lootEligible: false},
    millingMachine: {name: 'Fraiseuse', w: 2.2, h: 1.6, heightM: 2.1,
      sourceDimensions: 'author-design:industrial-millingMachine', lootEligible: false},
    assemblyStation: {name: 'Poste assemblage', w: 2.4, h: 1.1, heightM: 1.1,
      sourceDimensions: 'author-design:industrial-assemblyStation', lootEligible: false},
    inspectionBench: {name: 'Banc de contrôle', w: 1.8, h: 0.9, heightM: 1.2,
      sourceDimensions: 'author-design:industrial-inspectionBench', lootEligible: false},
    loom: {name: 'Métier à tisser', w: 2.8, h: 1.8, heightM: 1.9,
      sourceDimensions: 'author-design:industrial-loom', lootEligible: false},
    sewingStation: {name: 'Poste de confection', w: 1.4, h: 0.7, heightM: 1.2,
      sourceDimensions: 'author-design:industrial-sewingStation', lootEligible: false},
    cuttingTable: {name: 'Table de coupe', w: 2.4, h: 1.4, heightM: 0.9,
      sourceDimensions: 'author-design:industrial-cuttingTable', lootEligible: false},
    materialMixer: {name: 'Malaxeur de matériaux', w: 2.2, h: 1.8, heightM: 2.2,
      sourceDimensions: 'author-design:industrial-materialMixer', lootEligible: false},
    formingPress: {name: 'Presse de formage', w: 2.2, h: 1.8, heightM: 2.6,
      sourceDimensions: 'author-design:industrial-formingPress', lootEligible: false},
    curingRack: {name: 'Rayonnage de maturation', w: 2.4, h: 1.1, heightM: 2.2,
      sourceDimensions: 'author-design:industrial-curingRack', lootEligible: false}
  });

  const PROFILES = freeze({
    sleeping: ['singleBunk', 'wardrobe', 'smallCabinet'],
    bedroom: ['bed', 'wardrobe', 'smallCabinet'],
    living: ['sofa', 'table', 'smallCabinet', 'chair'],
    dining: ['table', 'chair', 'chair', 'smallCabinet'],
    kitchen: ['sink', 'steelTable', 'oven', 'fridge', 'dishRack'],
    pantry: ['shelf', 'crate', 'smallCabinet'],
    sanitary: ['toilet', 'sink', 'smallCabinet'],
    showers: ['shower', 'bench', 'sink'],
    changing: ['wardrobe', 'bench', 'wardrobe'],
    medical: ['medical', 'dentalChair', 'sink', 'smallCabinet'],
    laundry: ['washer', 'sink', 'laundryBasket', 'smallCabinet'],
    cleaning: ['sink', 'smallCabinet', 'shelf'],
    workshop: ['workbench', 'toolbox', 'shelf', 'smallCabinet'],
    stores: ['shelf', 'crateStack', 'crate', 'smallCabinet'],
    office: ['desk', 'chair', 'smallCabinet', 'shelf'],
    reception: ['counter', 'chair', 'smallCabinet', 'bench'],
    meeting: ['table', 'chair', 'chair', 'smallCabinet'],
    archives: ['shelf', 'smallCabinet', 'desk'],
    electrical: ['electricalRack', 'electricalRack', 'toolbox'],
    generator: ['generator', 'electricalRack', 'toolbox'],
    machinery: ['machine', 'workbench', 'toolbox'],
    pumps: ['pump', 'pump', 'electricalRack', 'toolbox'],
    controls: ['desk', 'electricalRack', 'chair', 'smallCabinet'],
    guard: ['desk', 'wardrobe', 'chair', 'smallCabinet'],
    sports: ['shelf', 'bench', 'crate'],
    livestock: ['feedTrough', 'waterTrough', 'fodderRack'],
    poultry: ['nestBox', 'nestBox', 'feedTrough', 'waterTrough'],
    milking: ['milkingUnit', 'milkingUnit', 'sink'],
    dairy: ['milkVat', 'steelTable', 'sink'],
    produce: ['steelTable', 'crate', 'shelf', 'sink'],
    winery: ['wineBarrel', 'wineBarrel', 'shelf'],
    fermentation: ['wineVat', 'wineVat', 'pump'],
    pressing: ['grapePress', 'steelTable', 'crate'],
    veterinary: ['medical', 'veterinaryTable', 'sink', 'smallCabinet'],
    greenhouse: ['growingBench', 'growingBed', 'pump', 'crate'],
    coldStores: ['fridge', 'steelTable', 'crate'],
    industrialReceiving: ['conveyor', 'crateStack', 'shelf', 'desk'],
    foodPreparation: ['steelTable', 'sink', 'crate', 'shelf'],
    industrialDosing: ['dosingUnit', 'steelTable', 'shelf'],
    foodMixing: ['foodMixer', 'steelTable', 'sink'],
    industrialHeating: ['heatChamber', 'steelTable', 'toolbox'],
    industrialInspection: ['inspectionBench', 'desk', 'smallCabinet', 'chair'],
    industrialPacking: ['conveyor', 'steelTable', 'crate', 'shelf'],
    metalCutting: ['metalSaw', 'workbench', 'toolbox', 'crate'],
    industrialTurning: ['lathe', 'workbench', 'toolbox'],
    industrialMilling: ['millingMachine', 'workbench', 'toolbox'],
    industrialAssembly: ['assemblyStation', 'workbench', 'toolbox', 'crate'],
    textileCutting: ['cuttingTable', 'shelf', 'crate'],
    industrialWeaving: ['loom', 'workbench', 'toolbox'],
    industrialSewing: ['sewingStation', 'table', 'chair', 'shelf'],
    materialMixing: ['materialMixer', 'workbench', 'toolbox'],
    materialForming: ['formingPress', 'workbench', 'toolbox'],
    materialCuring: ['curingRack', 'shelf', 'crate']
  });

  function classify(name) {
    const n = norm(name);
    if (!n || /circulation|couloir|coursive/.test(n)) return null;
    if (/^reception (matieres|fibres)/.test(n)) return 'industrialReceiving';
    if (/preparation alimentaire industrielle/.test(n)) return 'foodPreparation';
    if (/dosage (alimentaire|materiaux) industriel/.test(n)) return 'industrialDosing';
    if (/melange alimentaire industriel/.test(n)) return 'foodMixing';
    if (/traitement thermique alimentaire/.test(n)) return 'industrialHeating';
    if (/controle (qualite alimentaire|mecanique final|textile industriel|materiaux industriel)|metrologie industrielle/.test(n)) return 'industrialInspection';
    if (/emballage industriel/.test(n)) return 'industrialPacking';
    if (/decoupe mecanique industrielle/.test(n)) return 'metalCutting';
    if (/tournage industriel/.test(n)) return 'industrialTurning';
    if (/fraisage industriel/.test(n)) return 'industrialMilling';
    if (/assemblage mecanique industriel/.test(n)) return 'industrialAssembly';
    if (/(preparation|coupe) textile industrielle/.test(n)) return 'textileCutting';
    if (/tissage industriel/.test(n)) return 'industrialWeaving';
    if (/confection textile industrielle/.test(n)) return 'industrialSewing';
    if (/melange materiaux industriel/.test(n)) return 'materialMixing';
    if (/formage materiaux industriel/.test(n)) return 'materialForming';
    if (/maturation materiaux industrielle/.test(n)) return 'materialCuring';
    if (/infirmerie veterinaire|soins veterinaires/.test(n)) return 'veterinary';
    if (/stabulation|velage|bergerie|agnelage|boxes? (?:equestres?|de repos)/.test(n)) return 'livestock';
    if (/poulailler|poussiniere/.test(n)) return 'poultry';
    if (/salle de traite/.test(n)) return 'milking';
    if (/local du lait|laiterie/.test(n)) return 'dairy';
    if (/local oeufs|conditionnement|tri et calibrage/.test(n)) return 'produce';
    if (/serre semis|serre culture/.test(n)) return 'greenhouse';
    if (/stockage refrigere/.test(n)) return 'coldStores';
    if (/cuverie/.test(n)) return 'fermentation';
    if (/pressoir/.test(n)) return 'pressing';
    if (/\bchais?\b/.test(n)) return 'winery';
    if (/local semences|local grains|reserve fourrage|sellerie|local alimentation/.test(n)) return 'stores';
    if (/chambre parentale|chambre double/.test(n)) return 'bedroom';
    if (/chambre/.test(n)) return 'sleeping';
    if (/douches?/.test(n)) return 'showers';
    if (/sanitaires?|\bwc\b/.test(n)) return 'sanitary';
    if (/reserve (seche|alimentaire)/.test(n)) return 'pantry';
    if (/reserve (medicale)|salle de soins|infirmerie|accueil soins/.test(n)) return 'medical';
    if (/reserve hygiene|local nettoyage|entretien/.test(n)) return 'cleaning';
    if (/cuisine|plonge/.test(n)) return 'kitchen';
    if (/\bmess\b|refectoire|^service$/.test(n)) return 'dining';
    if (/buanderie|lingerie/.test(n)) return 'laundry';
    if (/vestiaire|rangement individuel/.test(n)) return 'changing';
    if (/cabine|dortoir|repos/.test(n)) return 'sleeping';
    if (/salon|sejour|club-house|vie a bord/.test(n)) return 'living';
    if (/reception|^accueil$|consignes/.test(n)) return 'reception';
    if (/reunion/.test(n)) return 'meeting';
    if (/archives|cartes/.test(n)) return 'archives';
    if (/poste de garde|poste de controle|equipement/.test(n)) return 'guard';
    if (/bureau/.test(n)) return 'office';
    if (/pompes?/.test(n)) return 'pumps';
    if (/groupe (auxiliaire|de secours)/.test(n)) return 'generator';
    if (/distribution electrique|tableau de distribution|batteries/.test(n)) return 'electrical';
    if (/navigation|communications|electronique|informatique|controle|observation/.test(n)) return 'controls';
    if (/diesel|moteurs|ventilation/.test(n)) return 'machinery';
    if (/atelier|maintenance|local outillage/.test(n)) return 'workshop';
    if (/rangement sportif/.test(n)) return 'sports';
    if (/reserve|stockage|magasin|pieces detachees/.test(n)) return 'stores';
    return null;
  }

  function sources() {
    const geometry = root.DeadwallFrontierGeometry || (typeof require === 'function' ? require('./frontier-geometry.js') : null);
    const detail = root.DeadwallSeedDetail157 || (typeof require === 'function' ? require('./seed-detail157.js') : null);
    const core = root.DeadwallCore || (typeof require === 'function' ? require('./core.js') : null);
    return {geometry, detail, core};
  }

  function shape(kind, dependencies = sources()) {
    if (!own(CATALOGUE, kind)) throw Error('Objet de composition inconnu : ' + kind);
    const definition = CATALOGUE[kind];
    let size, sourceDimensions;
    if (definition.w) {
      size = [definition.w, definition.h];
      sourceDimensions = definition.sourceDimensions;
    } else if (dependencies.geometry?.SHAPES?.[kind]) {
      size = dependencies.geometry.SHAPES[kind];
      sourceDimensions = 'src/frontier-geometry.js#SHAPES.' + kind;
    } else if (dependencies.detail?.objects?.[kind]) {
      size = dependencies.detail.objects[kind];
      sourceDimensions = 'src/seed-detail157.js#objects.' + kind;
    } else if (dependencies.core?.CodexFixtures164Rules?.shapes?.[kind]) {
      size = dependencies.core.CodexFixtures164Rules.shapes[kind];
      sourceDimensions = 'src/core.js#CodexFixtures164Rules.shapes.' + kind;
    }
    if (!size || !positive(size[0]) || !positive(size[1])) throw Error('Gabarit existant absent : ' + kind);
    return {...definition, w: size[0], h: size[1], sourceDimensions,
      heightOrigin: 'author-design-not-manufacturer-dimension'};
  }

  function roomsFor(plan) {
    if (!plan || plan.units !== 'm' || typeof plan.id !== 'string') throw Error('Plan métrique requis.');
    const rooms = [], identities = new Set();
    function add(source, offset, level, elevationM, portals) {
      if (!rectangle(source) || !source.id || identities.has(source.id) || !Number.isInteger(level) || !Number.isFinite(elevationM) || !positive(source.clearHeightM)) throw Error('Pièce auteur invalide.');
      identities.add(source.id);
      if (source.kind === 'circulation' || norm(source.name) === 'circulation') return;
      const r = {id: source.id, name: source.name, x: source.x + offset.x, y: source.y + offset.y,
        w: source.w, h: source.h, level, sourceLevel: source.level,
        elevationM, clearHeightM: source.clearHeightM, usage: classify(source.name)};
      const doors = portals.filter(d => d.to === source.id).map(d => ({id: d.id,
        x: d.x + offset.x, y: d.y + offset.y, widthM: d.widthM, axis: d.axis}));
      if (!doors.length || doors.some(d => !Number.isFinite(d.x + d.y) || !positive(d.widthM) || !['x', 'y'].includes(d.axis))) throw Error('Accès auteur absent ou invalide : ' + source.id);
      r.doors = doors;
      r.center = center(r);
      r.protectedPaths = doors.map(d => {
        const x = Math.max(r.x, Math.min(r.x + r.w, d.x));
        const y = Math.max(r.y, Math.min(r.y + r.h, d.y));
        const c = r.center, half = RULES.pathWidthM / 2;
        return {x: Math.min(x, c.x) - half, y: Math.min(y, c.y) - half,
          w: Math.abs(x - c.x) + 2 * half, h: Math.abs(y - c.y) + 2 * half};
      });
      rooms.push(r);
    }
    if (Array.isArray(plan.buildings)) {
      const levels = plan.levels === undefined ? [{id: 'ground', index: 0, elevationM: 0}] : plan.levels;
      if (!Array.isArray(levels) || !levels.length || levels.some((l,i) => l?.index !== i || !Number.isFinite(l.elevationM)) || new Set(levels.map(l => l.elevationM)).size !== levels.length) throw Error('Niveaux de site invalides.');
      for (const b of plan.buildings) {
        if (!rectangle(b) || !Array.isArray(b.rooms) || !Array.isArray(b.portals)) throw Error('Annexe auteur invalide.');
        for (const r of b.rooms) {
          const level = levels[r.level];
          if (!level || !b.levels?.includes(r.level)) throw Error('Pièce sans niveau de site.');
          add(r, b, level.index, level.elevationM, b.portals);
        }
      }
    } else if (Array.isArray(plan.rooms) && Array.isArray(plan.levels) && Array.isArray(plan.portals)) {
      const levels = new Map(plan.levels.map((l, index) => [l.id, {index, elevationM: l.elevationM}]));
      if (levels.size !== plan.levels.length) throw Error('Niveau auteur répété.');
      for (const r of plan.rooms) {
        const l = levels.get(r.level);
        if (!l) throw Error('Niveau auteur absent.');
        add(r, {x: 0, y: 0}, l.index, l.elevationM, plan.portals);
      }
    } else throw Error('Format de plan auteur inconnu.');
    return rooms;
  }

  function pose(room, definition, side, fraction) {
    const margin = RULES.wallMarginM, vertical = side === 'west' || side === 'east';
    const w = vertical ? definition.h : definition.w, h = vertical ? definition.w : definition.h;
    const available = (vertical ? room.h - h : room.w - w) - 2 * margin;
    if (available < 0) return null;
    const x = vertical ? (side === 'west' ? room.x + margin : room.x + room.w - margin - w) : room.x + margin + available * fraction;
    const y = vertical ? room.y + margin + available * fraction : (side === 'north' ? room.y + margin : room.y + room.h - margin - h);
    const clearance = RULES.serviceDepthM;
    const access = side === 'north' ? {x, y: y + h, w, h: clearance} :
      side === 'south' ? {x, y: y - clearance, w, h: clearance} :
      side === 'west' ? {x: x + w, y, w: clearance, h} : {x: x - clearance, y, w: clearance, h};
    return {x, y, w, h, access, clearance,
      rotationRad: {north: 0, east: Math.PI / 2, south: Math.PI, west: 3 * Math.PI / 2}[side], side};
  }

  function segmentHit(a, b, box) {
    let lo = 0, hi = 1;
    for (const [p, q] of [[-(b.x-a.x), a.x-box.x], [b.x-a.x, box.x+box.w-a.x],
      [-(b.y-a.y), a.y-box.y], [b.y-a.y, box.y+box.h-a.y]]) {
      if (Math.abs(p) < 1e-12) { if (q < 0) return false; }
      else { const t = q / p; if (p < 0) lo = Math.max(lo,t); else hi = Math.min(hi,t); if (lo > hi) return false; }
    }
    return true;
  }

  // Coordinate-grid visibility is conservative for a circular actor: obstacles
  // are expanded by the radius and each edge is checked continuously. It does
  // not jump between coarse raster cells or miss a thin blocked passage.
  function accessibility(room, items, radius = RULES.actorRadiusM) {
    if (!positive(radius) || !rectangle(room)) return {ok: false, reason: 'schema'};
    const e = RULES.epsilon, inner = {x: room.x + radius, y: room.y + radius,
      w: room.w - 2 * radius, h: room.h - 2 * radius};
    if (!rectangle(inner)) return {ok: false, reason: 'room-too-small'};
    const obstacles = items.filter(o => o.solid !== false).map(o => inflated(o, radius));
    const targets = [room.center, ...room.doors.map(d => ({
      x: Math.max(inner.x + e, Math.min(inner.x + inner.w - e, d.x)),
      y: Math.max(inner.y + e, Math.min(inner.y + inner.h - e, d.y))
    })), ...items.map(o => center(o.access))];
    const xs = [inner.x + e, inner.x + inner.w - e, ...targets.map(p => p.x),
      ...obstacles.flatMap(o => [o.x - e, o.x + o.w + e])];
    const ys = [inner.y + e, inner.y + inner.h - e, ...targets.map(p => p.y),
      ...obstacles.flatMap(o => [o.y - e, o.y + o.h + e])];
    const values = (a, min, max) => [...new Set(a.filter(v => v >= min && v <= max))].sort((a,b) => a-b);
    const X = values(xs, inner.x, inner.x + inner.w), Y = values(ys, inner.y, inner.y + inner.h);
    const index = (x,y) => Y.indexOf(y) * X.length + X.indexOf(x);
    if (targets.some(p => !within({x:p.x,y:p.y,w:0,h:0}, inner) || obstacles.some(o => within({x:p.x,y:p.y,w:0,h:0}, o)))) return {ok:false,reason:'target-blocked'};
    const start = index(targets[0].x, targets[0].y), seen = new Set([start]), queue = [start];
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i], xi = cell % X.length, yi = Math.floor(cell / X.length);
      for (const [nx,ny] of [[xi-1,yi],[xi+1,yi],[xi,yi-1],[xi,yi+1]]) {
        if (nx<0 || ny<0 || nx>=X.length || ny>=Y.length) continue;
        const key = ny * X.length + nx;
        if (seen.has(key)) continue;
        const a = {x:X[xi], y:Y[yi]}, b = {x:X[nx], y:Y[ny]};
        if (obstacles.some(o => segmentHit(a,b,o))) continue;
        seen.add(key); queue.push(key);
      }
    }
    return {ok: targets.every(p => seen.has(index(p.x,p.y))), checkedTargets: targets.length,
      reason: targets.every(p => seen.has(index(p.x,p.y))) ? null : 'unreachable-service'};
  }

    // Only revised maritime compositions opt in. Complete room layouts are staged
  // before replacement; an exhausted search retains the original honest refusals.
  const REPACK205 = Object.freeze({version:1,maxStates:4096,maxCandidatesPerRequest:512});
  function maritimeRepack205(plan) {
    return plan.scope==='author-maritime-layout-not-live-world' && plan.furnishingLayout205===1 && ['EXT-MONDE-T005','EXT-MONDE-T008','EXT-MONDE-T011'].includes(plan.typologyId);
  }
  // Wall samples preserve the usual visual preference. Contact offsets and a
  // small interior grid let the search place freestanding rows without changing
  // any footprint, service depth, protected doorway path or actor radius.
  function packRoom205(room,kinds,dependencies) {
    const ordinals=new Map();
    const requests=kinds.map(kind=>{const ordinal=ordinals.get(kind)||0;ordinals.set(kind,ordinal+1);return {kind,ordinal,id:room.id+':furnish2026:'+kind+':'+ordinal,definition:shape(kind,dependencies)};});
    const fractions=[0,1,.5,.25,.75,.125,.375,.625,.875];
    const items=requests.map((request,index)=>{
      const d=request.definition,out=[];
      if(d.heightM>room.clearHeightM)return out;
      const order=['north','south','west','east'];
      const poses=[];
      for(let n=0;n<order.length;n++){
        const side=order[(n+index)%4];
        const offsets=[0,...requests.flatMap(q=>[q.definition.w+RULES.gapM,q.definition.h+RULES.gapM,q.definition.w+RULES.serviceDepthM+RULES.gapM,q.definition.h+RULES.serviceDepthM+RULES.gapM])];
        for(const fraction of fractions){
          const anchored=pose(room,d,side,fraction);if(!anchored)continue;
          for(const offset of offsets){
            const dx=side==='west'?offset:side==='east'?-offset:0,dy=side==='north'?offset:side==='south'?-offset:0;
            poses.push({...anchored,x:anchored.x+dx,y:anchored.y+dy,access:{...anchored.access,x:anchored.access.x+dx,y:anchored.access.y+dy}});
          }
        }
        const wall=pose(room,d,side,0);
        if(wall)for(const xf of [0,.25,.5,.75,1])for(const yf of [0,.25,.5,.75,1]){
          const x=room.x+RULES.wallMarginM+(room.w-wall.w-RULES.wallMarginM*2)*xf;
          const y=room.y+RULES.wallMarginM+(room.h-wall.h-RULES.wallMarginM*2)*yf;
          poses.push({...wall,x,y,access:{...wall.access,x:wall.access.x+x-wall.x,y:wall.access.y+y-wall.y}});
        }
      }
      const seen=new Set();
      for(const candidate of poses){
        if(!candidate||!within(candidate,room,RULES.wallMarginM)||!within(candidate.access,room)||room.protectedPaths.some(path=>hit(candidate,path,RULES.gapM)))continue;
        const key=JSON.stringify([candidate.x,candidate.y,candidate.side]);if(seen.has(key))continue;seen.add(key);
        if(out.length>=REPACK205.maxCandidatesPerRequest)break;
        out.push({...candidate,id:request.id,roomId:room.id,room:room.name,usage:room.usage,kind:request.kind,
          name:d.name,heightM:d.heightM,heightOrigin:d.heightOrigin,sourceDimensions:d.sourceDimensions,footprintM:{w:d.w,h:d.h},
          level:room.level,sourceLevel:room.sourceLevel,elevationM:room.elevationM,solid:true,lootEligible:d.lootEligible,lootAssigned:false,utilityConnected:false});
      }
      return out;
    });
    const compatible=(a,b)=>!hit(a,b,RULES.gapM)&&!hit(a,b.access,RULES.gapM)&&!hit(a.access,b,RULES.gapM);
    let states=0,exhausted=false,solution=null;
    function visit(selected,remaining){
      if(!remaining.length){if(accessibility(room,selected.filter(Boolean)).ok){solution=selected.slice();return true;}return false;}
      if(states>=REPACK205.maxStates){exhausted=true;return false;}
      let chosen=null;
      for(const index of remaining){
        const options=items[index].filter(p=>selected.every(q=>!q||compatible(p,q)));
        if(!options.length)return false;
        if(!chosen||options.length<chosen.options.length)chosen={index,options};
      }
      const next=remaining.filter(index=>index!==chosen.index);
      for(const p of chosen.options){
        if(states>=REPACK205.maxStates){exhausted=true;return false;}
        states++;
        selected[chosen.index]=p;
        if(accessibility(room,selected.filter(Boolean)).ok&&visit(selected,next))return true;
        selected[chosen.index]=null;
      }
      return false;
    }
    visit(Array(requests.length).fill(null),requests.map((_,index)=>index));
    return {roomId:room.id,accepted:!!solution,states,candidates:items.reduce((n,a)=>n+a.length,0),exhausted,items:solution};
  }

function build(plan) {
    const rooms = roomsFor(plan), dependencies = sources(), props = [], unplaced = [], requests = [];
    const packing205=maritimeRepack205(plan)?[]:null;
    for (const room of rooms) {
      const kinds = room.usage ? PROFILES[room.usage] : null;
      if (!kinds) { unplaced.push({roomId:room.id, kind:null, reason:'room-usage-unresolved'}); continue; }
      const startProps=props.length,startRequests=requests.length,startUnplaced=unplaced.length;
      const local = [], ordinals = new Map();
      for (const kind of kinds.slice(0,RULES.maxPerRoom)) {
        const ordinal = ordinals.get(kind) || 0; ordinals.set(kind,ordinal+1);
        const id = room.id + ':furnish2026:' + kind + ':' + ordinal;
        const definition = shape(kind, dependencies);
        let chosen = null, attempts = 0;
        if (definition.heightM <= room.clearHeightM) {
          const order = ['north','south','west','east'];
          // Alternate ends and walls without changing the physical size.
          const fractions = [0,1,.5,.25,.75,...Array.from({length:RULES.wallSamples},(_,i)=>i/(RULES.wallSamples-1))];
          const shift = (props.length + ordinal) % order.length;
          for (let n=0;n<order.length && !chosen;n++) {
            const side = order[(n+shift)%order.length];
            for (const fraction of [...new Set(fractions)]) {
              if (++attempts > RULES.maxCandidates) break;
              const candidate = pose(room,definition,side,fraction);
              // The complete service rectangle must fit the room. Its centre
              // is checked with the actor radius by accessibility below;
              // insetting the whole rectangle again double-counts that space.
              if (!candidate || !within(candidate,room,RULES.wallMarginM) || !within(candidate.access,room)) continue;
              if (room.protectedPaths.some(path=>hit(candidate,path,RULES.gapM))) continue;
              if (local.some(o=>hit(candidate,o,RULES.gapM)||hit(candidate,o.access,RULES.gapM)||hit(candidate.access,o,RULES.gapM))) continue;
              const item = {...candidate,id,roomId:room.id,room:room.name,usage:room.usage,kind,
                name:definition.name,heightM:definition.heightM,heightOrigin:definition.heightOrigin,
                sourceDimensions:definition.sourceDimensions,footprintM:{w:definition.w,h:definition.h},
                level:room.level,sourceLevel:room.sourceLevel,elevationM:room.elevationM,
                solid:true,lootEligible:definition.lootEligible,lootAssigned:false,utilityConnected:false};
              if (!accessibility(room,[...local,item]).ok) continue;
              chosen=item;break;
            }
          }
        }
        requests.push({id,roomId:room.id,kind,placed:!!chosen,attempts});
        if (chosen) { local.push(chosen); props.push(chosen); }
        else unplaced.push({id,roomId:room.id,kind,reason:definition.heightM>room.clearHeightM?'insufficient-headroom':'space-or-access',
          requiredFootprintM:{w:definition.w,h:definition.h},requiredHeightM:definition.heightM});
      }
      if(packing205&&unplaced.length>startUnplaced){
        const staged=packRoom205(room,kinds.slice(0,RULES.maxPerRoom),dependencies);
        const {items,...receipt}=staged;packing205.push(receipt);
        if(staged.accepted){
          props.splice(startProps,props.length-startProps,...items);
          unplaced.splice(startUnplaced,unplaced.length-startUnplaced);
          // Direct-pass attempts keep their historical meaning; the independent
          // bounded room-search work is reported in packing205.
          for(let i=startRequests;i<requests.length;i++)requests[i].placed=true;
        }
      }
    }
    const result = {schemaVersion:1,planId:plan.id,units:'m',scope:'author-furnishings-not-campaign',
      playable:false,props,unplaced,requests,rooms,...(packing205?{packing205}:{}),summary:{rooms:rooms.length,
        furnishedRooms:new Set(props.map(p=>p.roomId)).size,objects:props.length,
        requested:requests.length,unplaced:unplaced.length,unknownUses:unplaced.filter(p=>p.kind===null).length,
        lootContainersCreated:0,connectedServices:0}};
    const checked = audit(plan,result);
    if (!checked.ok) throw Error('Aménagement invalide : ' + checked.errors.join(', '));
    return freeze(result);
  }

  function audit(plan, result) {
    const errors=[], fail=code=>errors.push(code);
    try {
      const rooms=roomsFor(plan), byRoom=new Map(rooms.map(r=>[r.id,r])), ids=new Set(), dependencies=sources();
      if (!result || !Array.isArray(result.props) || !Array.isArray(result.unplaced) || !Array.isArray(result.requests)) return {ok:false,errors:['schema']};
      if (result.schemaVersion!==RULES.version || result.planId!==plan.id || result.units!=='m' || result.scope!=='author-furnishings-not-campaign' || result.playable!==false) fail('scope');
      for (const p of result.props) {
        const room=byRoom.get(p.roomId);
        if (!p.id || ids.has(p.id)) fail('duplicate-id');
        ids.add(p.id);
        if (!rectangle(p) || !rectangle(p.access) || !positive(p.heightM) || !positive(p.clearance)) {fail('shape');continue;}
        if (!room) {fail('orphan-prop');continue;}
        if (p.level!==room.level || p.sourceLevel!==room.sourceLevel || p.elevationM!==room.elevationM) fail('level');
        if (!within(p,room,RULES.wallMarginM) || !within(p.access,room) || p.heightM>room.clearHeightM) fail('room-envelope');
        if (room.protectedPaths.some(path=>hit(p,path,RULES.gapM))) fail('blocked-entry-path');
        if (!own(CATALOGUE,p.kind)) {fail('unknown-kind');continue;}
        const definition=shape(p.kind,dependencies), quarter=p.rotationRad/(Math.PI/2);
        if (p.room!==room.name || p.usage!==room.usage || p.name!==definition.name) fail('prop-metadata');
        if (!Number.isInteger(quarter) || quarter<0 || quarter>3) fail('rotation');
        const vertical=quarter%2===1, width=vertical?definition.h:definition.w, depth=vertical?definition.w:definition.h;
        if (Math.abs(p.w-width)>1e-8 || Math.abs(p.h-depth)>1e-8 || p.heightM!==definition.heightM || p.sourceDimensions!==definition.sourceDimensions || p.heightOrigin!==definition.heightOrigin) fail('scaled-or-unproven-dimensions');
        if (p.footprintM?.w!==definition.w || p.footprintM?.h!==definition.h) fail('footprint-metadata');
        const side=['north','east','south','west'][quarter], depthM=RULES.serviceDepthM;
        const access=side==='north'?{x:p.x,y:p.y+p.h,w:p.w,h:depthM}:
          side==='south'?{x:p.x,y:p.y-depthM,w:p.w,h:depthM}:
          side==='west'?{x:p.x+p.w,y:p.y,w:depthM,h:p.h}:{x:p.x-depthM,y:p.y,w:depthM,h:p.h};
        if (p.side!==side || p.clearance!==depthM || ['x','y','w','h'].some(k=>Math.abs(p.access[k]-access[k])>1e-8)) fail('false-service-footprint');
        if (p.lootAssigned!==false || p.utilityConnected!==false || p.solid!==true || own(p,'amount') || own(p,'resource')) fail('false-service-or-stock');
        if (p.lootEligible!==definition.lootEligible) fail('loot-eligibility');
      }
      for (const room of rooms) {
        const items=result.props.filter(p=>p.roomId===room.id);
        for (let i=0;i<items.length;i++) for (let j=i+1;j<items.length;j++) {
          const a=items[i],b=items[j];
          if (hit(a,b,RULES.gapM)) fail('prop-overlap');
          if (hit(a,b.access,RULES.gapM) || hit(a.access,b,RULES.gapM)) fail('blocked-service');
        }
        if (items.length && !accessibility(room,items).ok) fail('unreachable-service');
      }
      const expected=new Map();
      for (const room of rooms) {
        const ordinal=new Map();
        for (const kind of (PROFILES[room.usage]||[]).slice(0,RULES.maxPerRoom)) {
          const n=ordinal.get(kind)||0;ordinal.set(kind,n+1);
          expected.set(room.id+':furnish2026:'+kind+':'+n,{roomId:room.id,kind});
        }
      }
      for (const prop of result.props) {
        const wanted=expected.get(prop.id);
        if (!wanted || prop.roomId!==wanted.roomId || prop.kind!==wanted.kind) fail('prop-request-mismatch');
      }
      const requestIds=new Set(), missingIds=new Set(), unknownIds=new Set();
      for (const entry of result.unplaced) {
        if (entry.kind===null) {
          if (!byRoom.has(entry.roomId) || byRoom.get(entry.roomId).usage!==null || entry.reason!=='room-usage-unresolved' || unknownIds.has(entry.roomId)) fail('false-missing-use');
          unknownIds.add(entry.roomId);
          continue;
        }
        const wanted=expected.get(entry.id);
        if (!wanted || missingIds.has(entry.id) || ids.has(entry.id) || entry.kind!==wanted.kind || entry.roomId!==wanted.roomId ||
          !['space-or-access','insufficient-headroom'].includes(entry.reason)) fail('false-unplaced');
        if (wanted) {
          const definition=shape(wanted.kind,dependencies),room=byRoom.get(wanted.roomId);
          if (entry.requiredFootprintM?.w!==definition.w || entry.requiredFootprintM?.h!==definition.h || entry.requiredHeightM!==definition.heightM ||
            (entry.reason==='insufficient-headroom')!==(definition.heightM>room.clearHeightM)) fail('false-unplaced-dimensions');
        }
        missingIds.add(entry.id);
      }
      if (rooms.some(room=>room.usage===null&&!unknownIds.has(room.id))) fail('missing-unresolved-use');
      for (const request of result.requests) {
        const wanted=expected.get(request.id);
        if (!wanted || requestIds.has(request.id) || request.roomId!==wanted.roomId || request.kind!==wanted.kind ||
          request.placed!==ids.has(request.id) || !Number.isInteger(request.attempts) || request.attempts<0 || request.attempts>RULES.maxCandidates) fail('request');
        if (!ids.has(request.id) && !missingIds.has(request.id)) fail('missing-result');
        requestIds.add(request.id);
      }
      if (requestIds.size!==expected.size || [...ids].some(id=>!expected.has(id))) fail('incomplete-requests');
      if(maritimeRepack205(plan)) {
        if(!Array.isArray(result.packing205))fail('missing-packing-receipt');
        else {
          const packedRooms=new Set();
          for(const record of result.packing205){
            const room=byRoom.get(record?.roomId),limit=(PROFILES[room?.usage]||[]).length*REPACK205.maxCandidatesPerRequest;
            if(!room||packedRooms.has(record.roomId)||Object.keys(record).sort().join(',')!=='accepted,candidates,exhausted,roomId,states'||
              typeof record.accepted!=='boolean'||typeof record.exhausted!=='boolean'||!Number.isInteger(record.states)||record.states<0||record.states>REPACK205.maxStates||
              !Number.isInteger(record.candidates)||record.candidates<0||record.candidates>limit||record.accepted&&record.exhausted)fail('invalid-packing-receipt');
            packedRooms.add(record?.roomId);
            if(record?.accepted===result.unplaced.some(p=>p.roomId===record.roomId))fail('false-packing-result');
          }
        }
      } else if(own(result,'packing205'))fail('unexpected-packing-receipt');
      if (JSON.stringify(result.rooms)!==JSON.stringify(rooms)) fail('false-room-metadata');
      if (result.summary?.objects!==result.props.length || result.summary?.rooms!==rooms.length ||
        result.summary?.furnishedRooms!==new Set(result.props.map(p=>p.roomId)).size || result.summary?.lootContainersCreated!==0 || result.summary?.connectedServices!==0) fail('summary');
      if (result.summary?.requested!==result.requests.length || result.summary?.unplaced!==result.unplaced.length ||
        result.summary?.unknownUses!==result.unplaced.filter(p=>p.kind===null).length) fail('summary');
    } catch { fail('schema'); }
    return {ok:errors.length===0,errors:[...new Set(errors)],objects:result?.props?.length||0};
  }

  return Object.freeze({RULES,CATALOGUE,PROFILES,classify,shape,roomsFor,build,audit,accessibility});
});
