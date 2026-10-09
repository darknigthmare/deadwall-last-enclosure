(function initDeadwallExploration125(root, factory) {
  'use strict';
  const api = factory(root && root.DeadwallCore ? root.DeadwallCore : typeof module === 'object' && module.exports ? require('./core.js') : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.DeadwallExploration125 = api;
    if (root.DEADWALL && root.document) api.install(root.DEADWALL, root.document);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDeadwallExploration125(C) {
  'use strict';

  const VERSION = '1.25.3';
  const VEHICLE_KINDS = new Set(['ambulance', 'bus', 'utilityTruck', 'tanker']);
  const INVENTORY_SHAPES = Object.freeze({
    wood: [2, 1], scrap: [1, 1], stone: [2, 2], food: [1, 2], fuel: [2, 2], ammo: [2, 1], medicine: [1, 1]
  });
  const RESOURCE_LABELS = Object.freeze({
    wood: 'Bois', scrap: 'Ferraille', stone: 'Pierre', food: 'Nourriture', fuel: 'Carburant', ammo: 'Munitions', medicine: 'Médicaments'
  });
  const INVENTORY_STACKS = Object.freeze({ wood: 8, scrap: 10, stone: 6, food: 8, fuel: 6, ammo: 18, medicine: 4 });
  const GENERATION_MARKER = ':g4';
  const ROAD_EVENT_KINDS = Object.freeze(['accident','checkpoint','abandon','maintenance','evacuation','roadworks']);

  const WORLD_CODEX = Object.freeze([
    Object.freeze({
      id: 'frontieres-d17', title: 'Frontières de D-17', tag: 'NAVIGATION',
      summary: 'Les quatre faces de la zone sont des coutures de secteur, pas des murs invisibles.',
      rules: [
        'Nord, sud, est et ouest sont franchissables sur toute leur longueur, indépendamment des routes.',
        'Un franchissement passe dans la région native ; le retour conserve la position latérale et recale la caméra.',
        'Aucun portail routier artificiel ne doit conditionner la sortie du joueur ; les routes servent à l’orientation, pas à verrouiller la carte.'
      ]
    }),
    Object.freeze({
      id: 'intersections', title: 'Routes et intersections', tag: 'LEVEL DESIGN',
      summary: 'Une hiérarchie routière lisible remplace la simple croix centrale.',
      rules: [
        'Les collectrices relient les quartiers aux axes principaux ; les nouvelles campagnes font varier leur écartement et contournent le dépôt.',
        'Les lignes d’arrêt, zébras, flèches et accotements signalent les changements de priorité sans ajouter de collision inutile.',
        'Les épaves restent en retrait du centre géométrique des carrefours afin de ne jamais condamner toutes les voies.'
      ]
    }),
    Object.freeze({
      id: 'stations-service', title: 'Stations-service visitables', tag: 'POI',
      summary: 'De vrais petits lieux d’exploration, ouverts par une entrée physique et lisible.',
      rules: [
        'Chaque station possède dalle, auvent, pompes, boutique, comptoir et murs segmentés.',
        'L’ouverture de boutique est une vraie lacune de collision : le joueur peut entrer et ressortir sans déclencheur factice.',
        'Les stations sont implantées près des collectrices mais jamais au milieu d’un carrefour.'
      ]
    }),
    Object.freeze({
      id: 'backyards', title: 'Maisons et backyards', tag: 'QUARTIERS',
      summary: 'Les zones résidentielles gagnent une lecture arrière/avant et des micro-chemins.',
      rules: [
        'Un backyard contient clôture ou palissade, une ouverture d’au moins 54 unités et deux familles de petits props.',
        'Les clôtures suivent les limites de parcelle et non des angles aléatoires qui traversent le chemin du joueur.',
        'Les ouvertures sont orientées vers une route ou un passage secondaire afin de créer une boucle, pas un cul-de-sac arbitraire.'
      ]
    }),
    Object.freeze({
      id: 'palisades-ouvertures', title: 'Palissades et ouvertures', tag: 'COLLISION',
      summary: 'Une palissade est composée de segments indépendants et doit toujours annoncer visuellement son passage.',
      rules: [
        'Les segments solides sont courts ; aucune clôture décorative ne doit devenir un rectangle de collision couvrant son ouverture.',
        'Les entrées utilisent un vide réel, renforcé par deux poteaux et un changement de sol.',
        'Les zombies et les alliés partagent le même masque solide pour éviter les traversées incohérentes.'
      ]
    }),
    Object.freeze({
      id: 'epaves-coffres', title: 'Épaves et coffres fouillés', tag: 'ÉTAT DU MONDE',
      summary: 'Fouiller un véhicule change son état visuel au lieu de le faire disparaître.',
      rules: [
        'Le corps du véhicule reste en place après épuisement de la ressource.',
        'Le coffre ou hayon est dessiné ouvert, l’habitacle arrière paraît vide et l’état fouillé reste lisible sans texte.',
        'Les épaves générées sur route conservent une largeur de contournement et ne bouchent jamais toutes les voies.'
      ]
    }),
    Object.freeze({
      id: 'props-routiers', title: 'Complémentarité des props routiers', tag: 'DÉCORS',
      summary: 'Les routes racontent un événement avec des familles de props compatibles plutôt qu’un semis aléatoire.',
      rules: [
        'Accident : épave + débris + cône ou panneau ; contrôle : barrière + cônes + marquage ; abandon : véhicule + bagages + gravats.',
        'Les props hauts restent hors du cône de visibilité des intersections ; les petits props peuvent occuper les accotements.',
        'Une même cellule visuelle ne cumule pas plus de trois familles fortes afin de préserver la lisibilité du combat.'
      ]
    }),
    Object.freeze({
      id: 'profondeur', title: 'Profondeur et ordre de dessin', tag: 'RENDU',
      summary: 'Le joueur, les survivants, les infectés, bâtiments et gros décors sont triés selon leur pied dans le monde.',
      rules: [
        'La profondeur utilise le bas visuel de l’objet, pas sa catégorie de code.',
        'Un acteur passant derrière un objet est réellement dessiné avant lui ; devant, il est dessiné après.',
        'Les projectiles, particules, repères et textes flottants restent des couches d’effets séparées.'
      ]
    }),
    Object.freeze({
      id: 'villages-habitations', title: 'Villages, maisons et bâtiments', tag: 'URBANISME',
      summary: 'Les poches urbaines sont organisées en petits ensembles lisibles plutôt qu’en bâtiments isolés jetés au hasard.',
      rules: [
        'Les maisons existent en plusieurs gabarits et les backyards sont physiquement rattachés à une habitation identifiable.',
        'Les hameaux regroupent logements, atelier, commerce ou clinique autour d’un axe routier sans empiéter sur les carrefours.',
        'Les zones habitées concentrent des traces de vie, du loot et des rencontres infectées sans remplir uniformément toute la carte.'
      ]
    }),
    Object.freeze({
      id: 'hordes-sauvages', title: 'Hordes sauvages progressives', tag: 'MENACE',
      summary: 'Le territoire reste dangereux entre les assauts principaux grâce à de petites bandes errantes liées au niveau de campagne.',
      rules: [
        'Les bandes sauvages apparaissent hors du cœur du dépôt et préfèrent les poches habitées ou les axes secondaires.',
        'Leur taille et leur diversité progressent avec la vague, tout en respectant la limite globale d’infectés.',
        'Elles n’effacent pas la lecture des grandes vagues : leur cadence ralentit pendant un assaut principal.'
      ]
    }),
    Object.freeze({
      id: 'postures-surfaces', title: 'Postures et surfaces', tag: 'MOBILITÉ',
      summary: 'La vitesse dépend à la fois de la posture du survivant et du sol réellement traversé.',
      rules: [
        'Debout reste la mobilité normale ; accroupi réduit la vitesse ; allongé la réduit fortement et interdit le sprint.',
        'Asphalte et béton sont les plus réguliers ; terre, herbe humide et zones encombrées ralentissent progressivement.',
        'Le HUD annonce posture et type de sol pour que la variation ne ressemble jamais à un ralentissement arbitraire.'
      ]
    }),
    Object.freeze({
      id: 'cartographie-inventaire', title: 'Carte et inventaire terrain', tag: 'UX',
      summary: 'Le HUD donne une lecture immédiate ; les vues détaillées s’ouvrent en pop-up sans transformer le jeu en tableau de bord.',
      rules: [
        'La minimap montre les axes, collectrices, POI, coutures de secteur, joueur et champ caméra.',
        'La carte M reprend le langage d’une carte routière dépliante avec plis, légende et coordonnées régionales.',
        'Le sac I utilise une grille spatiale façon inventaire Jigsaw : formes différentes par famille de ressource, sans prétendre gérer des objets que la simulation ne possède pas.'
      ]
    })
  ]);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rect = (x, y, w, h, kind, meta = {}) => Object.freeze({ x, y, w, h, kind, ...meta });

  function createRoadNetwork(worldSize) {
    const c = worldSize / 2;
    const offset = Math.min(820, worldSize * 0.2), margin = Math.max(220, worldSize * .07);
    const widthMain = 132, widthCollector = 86, widthDiagonal = 104;
    const roads = [
      { id: 'main-h', axis: 'h', x: 0, y: c, length: worldSize, width: widthMain, lanes: 4, className: 'arterial' },
      { id: 'main-v', axis: 'v', x: c, y: 0, length: worldSize, width: widthMain, lanes: 4, className: 'arterial' },
      { id: 'north-collector', axis: 'h', x: 0, y: c - offset, length: worldSize, width: widthCollector, lanes: 2, className: 'collector' },
      { id: 'south-collector', axis: 'h', x: 0, y: c + offset, length: worldSize, width: widthCollector, lanes: 2, className: 'collector' },
      { id: 'west-collector', axis: 'v', x: c - offset, y: 0, length: worldSize, width: widthCollector, lanes: 2, className: 'collector' },
      { id: 'east-collector', axis: 'v', x: c + offset, y: 0, length: worldSize, width: widthCollector, lanes: 2, className: 'collector' },
      { id: 'northwest-diagonal', axis: 'line', x1: margin, y1: 2 * (c - offset) - margin, x2: 2 * (c - offset) - margin, y2: margin, width: widthDiagonal, lanes: 3, className: 'diagonal' },
      { id: 'southeast-diagonal', axis: 'line', x1: 2 * (c + offset) - (worldSize - margin), y1: worldSize - margin, x2: worldSize - margin, y2: 2 * (c + offset) - (worldSize - margin), width: widthDiagonal, lanes: 3, className: 'diagonal' }
    ];
    const xs = [c - offset, c, c + offset], ys = [c - offset, c, c + offset];
    const intersections = [];
    let id = 1;
    for (const x of xs) for (const y of ys) intersections.push({ id: `junction-${id++}`, x, y, radius: 94, kind: (x === c - offset && y === c - offset) || (x === c + offset && y === c + offset) ? 'angled' : 'cross' });
    return { roads, intersections, offset };
  }

  function createStation(index, x, y, facing, random) {
    const horizontal = facing === 'north' || facing === 'south';
    const archetypes = [
      { id:'miniMarket', label:'Mini-market', w:300, h:230, door:68 },
      { id:'garage', label:'Garage-service', w:340, h:250, door:76 },
      { id:'rural', label:'Station rurale', w:270, h:205, door:62 },
      { id:'service', label:'Aire-service', w:360, h:265, door:82 }
    ];
    const archetype = archetypes[(index - 1) % archetypes.length], w = archetype.w, h = archetype.h;
    const left = x - w / 2, top = y - h / 2;
    const wall = 15, door = archetype.door;
    const solids = [];
    // Four wall bands, with a real door opening on the road-facing side.
    if (facing === 'north' || facing === 'south') {
      const doorX = x + (random() - .5) * 70;
      const sideY = facing === 'north' ? top : top + h - wall;
      const oppositeY = facing === 'north' ? top + h - wall : top;
      solids.push(rect(left, oppositeY, w, wall, 'station-wall', { station: index }));
      solids.push(rect(left, top, wall, h, 'station-wall', { station: index }));
      solids.push(rect(left + w - wall, top, wall, h, 'station-wall', { station: index }));
      solids.push(rect(left, sideY, Math.max(0, doorX - door / 2 - left), wall, 'station-wall', { station: index }));
      solids.push(rect(doorX + door / 2, sideY, Math.max(0, left + w - (doorX + door / 2)), wall, 'station-wall', { station: index }));
      return { id: `station-${index}`, x, y, w, h, facing, horizontal, archetype:archetype.id, archetypeLabel:archetype.label, door: { x: doorX, y: sideY + wall / 2, width: door }, solids };
    }
    const doorY = y + (random() - .5) * 60;
    const sideX = facing === 'west' ? left : left + w - wall;
    const oppositeX = facing === 'west' ? left + w - wall : left;
    solids.push(rect(oppositeX, top, wall, h, 'station-wall', { station: index }));
    solids.push(rect(left, top, w, wall, 'station-wall', { station: index }));
    solids.push(rect(left, top + h - wall, w, wall, 'station-wall', { station: index }));
    solids.push(rect(sideX, top, wall, Math.max(0, doorY - door / 2 - top), 'station-wall', { station: index }));
    solids.push(rect(sideX, doorY + door / 2, wall, Math.max(0, top + h - (doorY + door / 2)), 'station-wall', { station: index }));
    return { id: `station-${index}`, x, y, w, h, facing, horizontal, archetype:archetype.id, archetypeLabel:archetype.label, door: { x: sideX + wall / 2, y: doorY, width: door }, solids };
  }

  function createBackyard(index, x, y, random) {
    const w = 260 + Math.round(random() * 70), h = 210 + Math.round(random() * 80);
    const left = x - w / 2, top = y - h / 2, fence = 11;
    const opening = 58 + Math.round(random() * 22);
    const gateX = x + (random() - .5) * Math.min(90, w * .3);
    const houseTypes = ['bungalow','twoStorey','rowHouse','farmhouse'];
    const houseW = Math.min(w - 42, 132 + Math.round(random() * 66)), houseH = 78 + Math.round(random() * 30);
    const houseX = clamp(x + (random() - .5) * 52, left + houseW / 2 + 18, left + w - houseW / 2 - 18);
    // The house itself closes the front side of the yard. It overlaps the yard edge
    // slightly so there is no fake strip of "outside" between house and backyard.
    const houseY = top - houseH / 2 + 5;
    const house = { id: `yard-house-${index}`, kind: houseTypes[(index - 1) % houseTypes.length], x: houseX, y: houseY, w: houseW, h: houseH, rearDoorX: houseX + (random() - .5) * houseW * .35 };
    const houseLeft=houseX-houseW/2, houseRight=houseX+houseW/2;
    const solids = [
      rect(left, top, Math.max(0, houseLeft-left), fence, 'palisade', { backyard: index }),
      rect(houseRight, top, Math.max(0, left+w-houseRight), fence, 'palisade', { backyard: index }),
      rect(left, top, fence, h, 'palisade', { backyard: index }),
      rect(left + w - fence, top, fence, h, 'palisade', { backyard: index }),
      rect(left, top + h - fence, Math.max(0, gateX - opening / 2 - left), fence, 'palisade', { backyard: index }),
      rect(gateX + opening / 2, top + h - fence, Math.max(0, left + w - (gateX + opening / 2)), fence, 'palisade', { backyard: index }),
      rect(houseLeft, houseY - houseH / 2, houseW, houseH, 'house', { backyard: index, house: house.id })
    ].filter(box=>box.w>0&&box.h>0);
    const props = [
      { kind: 'shed', x: left + 54 + random() * 44, y: top + 55 + random() * 35, size: 45 },
      { kind: random() > .5 ? 'barrel' : 'woodpile', x: left + w - 54 - random() * 38, y: top + 62 + random() * 58, size: 25 },
      { kind: 'mailbox', x: gateX + opening / 2 + 16, y: top + h - 17, size: 18 }
    ];
    return { id: `backyard-${index}`, x, y, w, h, opening, gate: { x: gateX, y: top + h, width: opening }, house, solids, props };
  }

  function createSettlement(index, name, x, y, random) {
    const types = ['houseSmall','houseWide','shop','workshop','clinic','diner','houseSmall'];
    const offsets = [[-230,-135],[0,-145],[230,-125],[-235,125],[0,135],[235,120],index===1?[220,0]:[180,180]];
    const buildings = offsets.map((offset, slot) => {
      const type = types[(slot + index) % types.length], residential = type.startsWith('house');
      const w = residential ? 118 + random() * 55 : 145 + random() * 70;
      const h = residential ? 78 + random() * 45 : 92 + random() * 48;
      return { id:`settlement-${index}-building-${slot+1}`, type, x:x+offset[0]+(random()-.5)*24, y:y+offset[1]+(random()-.5)*20, w:Math.round(w), h:Math.round(h), residential };
    });
    return { id:`settlement-${index}`, name, x, y, radius:470, buildings, street:{x1:x-350,y1:y,x2:x+350,y2:y,width:62} };
  }

  function createFeaturePlan(seed, worldSize = 4096, layoutRevision = 1) {
    if (!Number.isFinite(worldSize) || worldSize < 1200) throw new RangeError('Taille de monde insuffisante.');
    if (layoutRevision === 3) return createSeededFeaturePlan(seed, worldSize);
    const random = mulberry32((Number(seed) || 0) ^ 0xD1725A11);
    const c = worldSize / 2, margin = Math.max(220, worldSize * .07), coreReserveRadius = Math.min(690, worldSize * .17);
    const roadNetwork = createRoadNetwork(worldSize);
    const o = roadNetwork.offset;
    const stationAnchors = [
      [c - o + 580, c - o - 210, 'south'],
      [c + o - 250, c - o + 210, 'north'],
      [c - o - 230, c + o - 210, 'east'],
      [c + o + 232, c + o + 210, 'west']
    ];
    const stations = stationAnchors.map((entry, i) => createStation(i + 1, clamp(entry[0], margin, worldSize - margin), clamp(entry[1], margin, worldSize - margin), entry[2], random));

    const backyards = [];
    const backyardCenters = [
      [650,720],[980,720],[3110,720],[3440,980],
      [650,3450],[1050,3450],[3040,3650],[3540,3450]
    ];
    backyardCenters.forEach((p, i) => backyards.push(createBackyard(i + 1, clamp(p[0], margin, worldSize - margin), clamp(p[1], margin, worldSize - margin), random)));

    const settlements = [
      createSettlement(1, 'Hameau des Pins Gris', 480, 2550, random),
      createSettlement(2, 'Lotissement des Trois Citernes', c + o / 2, Math.max(margin + 390, c - o - 470), random),
      createSettlement(3, 'Bourg de la Rocade Sud', 3400, 1650, random)
    ];
    // Every pocket of housing is tied back to the road hierarchy by a local connector.
    settlements[0].connector={x1:settlements[0].street.x2,y1:settlements[0].street.y2,x2:settlements[0].street.x2,y2:c,width:48};
    settlements[1].connector={x1:settlements[1].street.x2,y1:settlements[1].street.y2,x2:c+o,y2:settlements[1].street.y2,width:48};
    settlements[2].connector={x1:settlements[2].street.x1,y1:settlements[2].street.y1,x2:c+o,y2:settlements[2].street.y1,width:48};

    const wrecks = [];
    const roadPositions = [c - o, c, c + o];
    for (let attempt = 0; attempt < 120 && wrecks.length < 16; attempt++) {
      const horizontal = attempt % 2 === 0;
      const lane = roadPositions[attempt % roadPositions.length];
      const along = margin + random() * (worldSize - margin * 2);
      const lateral = (random() > .5 ? 1 : -1) * (22 + random() * 18);
      const x = horizontal ? along : lane + lateral;
      const y = horizontal ? lane + lateral : along;
      const nearJunction = roadNetwork.intersections.some(j => Math.hypot(x - j.x, y - j.y) < 150);
      const insideProtectedPoi = Math.hypot(x-c,y-c)<coreReserveRadius || stations.some(s => Math.abs(x - s.x) < s.w / 2 + 85 && Math.abs(y - s.y) < s.h / 2 + 85) || backyards.some(yard => Math.abs(x - yard.x) < yard.w / 2 + 45 && Math.abs(y - yard.y) < yard.h / 2 + 45) || settlements.some(settlement => Math.hypot(x-settlement.x,y-settlement.y)<settlement.radius*.55);
      const tooClose = wrecks.some(wreck => Math.hypot(x-wreck.x,y-wreck.y)<92);
      if (nearJunction || insideProtectedPoi || tooClose) continue;
      const kind = attempt % 5 === 0 ? 'van' : attempt % 7 === 0 ? 'pickup' : 'car';
      wrecks.push({ id: `road-wreck-${wrecks.length + 1}`, x, y, angle: horizontal ? (random() - .5) * .3 : Math.PI / 2 + (random() - .5) * .3, kind, looted: random() > .62, size: kind==='van' ? 72 : kind==='pickup' ? 64 : 58 });
    }

    const eventProps = {
      accident:['cone','debris','roadSign','tirePile'], checkpoint:['barrier','cone','bollard','roadSign'], abandon:['luggage','shoppingCart','tarp','debris'],
      maintenance:['toolbox','pallet','roadSign','crate'], evacuation:['crate','tarp','cone','luggage'], roadworks:['barrier','pallet','debris','bollard']
    };
    const roadEvents = [], roadProps = [];
    for (let i = 0; i < 14; i++) {
      const kind = ROAD_EVENT_KINDS[i % ROAD_EVENT_KINDS.length];let event=null;
      for(let attempt=0;attempt<8&&!event;attempt++){
        const horizontal = random() > .5, lane = roadPositions[Math.floor(random() * roadPositions.length)];
        const along = margin + random() * (worldSize - margin * 2), shoulder = (random() > .5 ? 1 : -1) * (62 + random() * 24);
        const x = horizontal ? along : lane + shoulder, y = horizontal ? lane + shoulder : along;
        if (Math.hypot(x-c,y-c)<coreReserveRadius || roadNetwork.intersections.some(j => Math.hypot(x-j.x,y-j.y)<145) || stations.some(st=>Math.hypot(x-st.x,y-st.y)<220) || wrecks.some(wreck=>Math.hypot(x-wreck.x,y-wreck.y)<135)) continue;
        event = { id:`road-event-${roadEvents.length+1}`, kind, x, y, horizontal };
      }
      if(!event)continue;roadEvents.push(event);
      const {x,y,horizontal}=event;
      for (let slot = 0; slot < eventProps[kind].length; slot++) {
        const spread = 18 + slot * 11, px = x + (horizontal ? spread*(slot%2?1:-1) : (random()-.5)*24), py = y + (horizontal ? (random()-.5)*24 : spread*(slot%2?1:-1));
        roadProps.push({ id:`road-prop-${roadProps.length+1}`, eventId:event.id, family:kind, kind:eventProps[kind][slot], x:px, y:py, angle:random()*Math.PI*2, size:15+random()*15 });
      }
    }

    const stationLoot = [];
    const lootTypes = ['fuel','food','medicine'];
    for (let i = 0; i < stations.length; i++) {
      const station = stations[i], offsets = [[-station.w*.18,station.h*.22],[station.w*.18,station.h*.22],[0,station.h*.32]];
      for (let slot = 0; slot < lootTypes.length; slot++) {
        const type = lootTypes[slot], amount = type === 'fuel' ? 12 + Math.round(random()*10) : type === 'food' ? 10 + Math.round(random()*9) : 2 + Math.round(random()*4);
        stationLoot.push({ id: 900000000 + (i+1)*10 + slot, stationId:station.id, type, x:station.x+offsets[slot][0], y:station.y+offsets[slot][1], amount, radius:type==='medicine'?13:17, kind:'station-loot' });
      }
    }

    return assembleFeaturePlan({ seed: Number(seed) || 0, worldSize, coreReserveRadius, roads: roadNetwork.roads, intersections: roadNetwork.intersections, stations, backyards, settlements, wrecks, roadEvents, roadProps, stationLoot, layoutRevision: layoutRevision === 2 ? 2 : 1 });
  }

  function addStationWindow134(station) {
    const side=station.x+station.w/2-15,center=station.y+station.h*.29,width=60;
    const wall=station.solids.find(box=>box.x===side&&box.h===station.h);
    if(!wall)return; // A station oriented east already has its door on this side.
    const top=center-width/2,bottom=center+width/2;
    station.solids=station.solids.flatMap(box=>box!==wall?[box]:[
      {...box,h:top-box.y},{...box,y:bottom,h:box.y+box.h-bottom}
    ].filter(box=>box.h>0));
    station.windows=[{id:'broken-east',x:side+7.5,y:center,width,horizontal:false,facing:'east',broken:true}];
  }

  function assembleFeaturePlan(plan) {
    const { stations, backyards, settlements, wrecks, roadProps } = plan;
    // A broken low window is a real breach, with the wall removed from every
    // collision consumer. Historic revisions retain their original wall layout.
    if (plan.layoutRevision === 3) for (const station of stations) addStationWindow134(station);
    const furnitureSolids = stations.flatMap(station => stationFurniture(station).map(item => rect(item.x-item.w/2,item.y-item.h/2,item.w,item.h,'station-furniture',{station:station.id,furniture:item.kind})));
    const settlementSolids = settlements.flatMap(settlement => settlement.buildings.map(building => rect(building.x-building.w/2,building.y-building.h/2,building.w,building.h,'settlement-building',{settlement:settlement.id,building:building.id})));
    const yardPropSolids = backyards.flatMap(yard => yard.props.filter(prop => prop.kind==='shed'||prop.kind==='barrel').map(prop => rect(prop.x-prop.size*.45,prop.y-prop.size*.35,prop.size*.9,prop.size*.7,'yard-prop',{backyard:yard.id,prop:prop.kind})));
    const blockingRoadKinds = new Set(['barrier','tirePile','shoppingCart','pallet']);
    const roadPropSolids = roadProps.filter(prop=>blockingRoadKinds.has(prop.kind)).map(prop=>rect(prop.x-prop.size*.55,prop.y-prop.size*.35,prop.size*1.1,prop.size*.7,'road-prop',{prop:prop.id}));
    const solids = [
      ...stations.flatMap(s => s.solids), ...furnitureSolids,
      ...backyards.flatMap(yard => yard.solids), ...yardPropSolids,
      ...settlementSolids,
      ...wrecks.map(w => rect(w.x - w.size * .45, w.y - w.size * .24, w.size * .9, w.size * .48, 'wreck', { wreck: w.id })),
      ...roadPropSolids
    ];
    const buildExclusions = [
      ...stations.map(st=>rect(st.x-st.w/2-20,st.y-st.h/2-20,st.w+40,st.h+40,'station-reserve',{station:st.id})),
      ...backyards.map(yard=>rect(yard.x-yard.w/2-18,yard.y-yard.h/2-130,yard.w+36,yard.h+148,'yard-reserve',{backyard:yard.id})),
      ...settlements.flatMap(settlement=>settlement.buildings.map(building=>rect(building.x-building.w/2-12,building.y-building.h/2-12,building.w+24,building.h+24,'settlement-reserve',{building:building.id})))
    ];
    Object.assign(plan, { solids, buildExclusions });
    return plan.layoutRevision === 2 ? rotateFeaturePlan(plan) : plan;
  }

  // Revision 3 places complete parcels within a seeded road hierarchy. The depot
  // and its four regional seams stay anchored; the surrounding district does not.
  function createSeededFeaturePlan(seed, worldSize) {
    const random=mulberry32((Number(seed)||0)^0x133D1703), c=worldSize/2, scale=worldSize/4096;
    const pick=(a,b)=>Math.round((a+random()*(b-a))*scale), coreReserveRadius=690*scale;
    const xs=[0,c-pick(750,960),c,c+pick(750,960),worldSize], ys=[0,c-pick(750,960),c,c+pick(750,960),worldSize];
    const roads=[], intersections=[], stations=[], backyards=[], settlements=[], wrecks=[], roadEvents=[], roadProps=[], stationLoot=[];
    for(let i=1;i<4;i++){
      if(i!==2){
        roads.push({id:`collector-h${i}`,axis:'h',x:0,y:ys[i],length:worldSize,width:112,lanes:1,className:'collector'});
        roads.push({id:`collector-v${i}`,axis:'v',x:xs[i],y:0,length:worldSize,width:112,lanes:1,className:'collector'});
      }
      for(let j=1;j<4;j++)if(i!==2||j!==2)intersections.push({id:`junction-${i}-${j}`,x:xs[i],y:ys[j],radius:80,kind:'cross'});
    }
    const apron=310;
    for(const [id,x1,y1,x2,y2]of [['west',0,c,c-apron,c],['east',c+apron,c,worldSize,c],['north',c,0,c,c-apron],['south',c,c+apron,c,worldSize]])roads.push({id:`main-${id}`,axis:'line',x1,y1,x2,y2,width:176,lanes:2,className:'arterial'});
    for(const [id,x1,y1,x2,y2]of [['north',c-apron,c-apron,c+apron,c-apron],['south',c-apron,c+apron,c+apron,c+apron],['west',c-apron,c-apron,c-apron,c+apron],['east',c+apron,c-apron,c+apron,c+apron]])roads.push({id:`depot-ring-${id}`,axis:'line',x1,y1,x2,y2,width:96,lanes:1,className:'service'});
    const cells=[];
    for(let row=0;row<4;row++)for(let col=0;col<4;col++)cells.push({row,col,l:xs[col]+92,r:xs[col+1]-92,t:ys[row]+92,b:ys[row+1]-92,roll:random()});
    const corners=cells.filter(q=>[0,3].includes(q.row)&&[0,3].includes(q.col)).sort((a,b)=>a.roll-b.roll);
    const occupied=new Set(), reserve=[];
    const keep=(cell,box)=>{occupied.add(cell);reserve.push(box);};
    const line=(id,a,b,width=28,surface='gravel')=>({id,axis:'line',x1:a.x,y1:a.y,x2:b.x,y2:b.y,width,lanes:1,className:'access',surface});
    for(let i=0;i<3;i++){
      const cell=corners[i], x=(cell.l+cell.r)/2+(random()-.5)*100, y=(cell.t+cell.b)/2+(random()-.5)*160;
      const settlement=createSettlement(i+1,['Hameau des Pins Gris','Lotissement des Trois Citernes','Bourg de la Rocade Sud'][i],x,y,random);
      // Two facing rows: the former seventh house occupied the street itself.
      settlement.buildings=settlement.buildings.slice(0,6);
      const towardsEast=cell.col===0, edge=towardsEast?settlement.street.x2:settlement.street.x1, roadX=xs[towardsEast?1:3];
      settlement.connector={x1:edge,y1:y,x2:roadX,y2:y,width:42,surface:'gravel'};
      settlements.push(settlement);keep(cell,rect(x-395,y-225,790,450,'parcel'));
    }
    const available=cells.filter(q=>!occupied.has(q)).sort((a,b)=>a.roll-b.roll);
    // Service stations face a real horizontal collector, with pumps in the
    // forecourt and a clear approach between the pavement and the door.
    const serviceCells=available.filter(q=>q.row===0||q.row===3||q.col===0||q.col===3).slice(0,4);
    for(let i=0;i<serviceCells.length;i++){
      const cell=serviceCells[i], facing=cell.row===3?'north':cell.row===0?'south':random()<.5?'north':'south';
      const roadY=ys[facing==='north'?cell.row:cell.row+1], x=(cell.l+cell.r)/2+(random()-.5)*140;
      const proto=createStation(i+1,x,0,facing,random), y=roadY+(facing==='north'?1:-1)*(proto.h/2+168);
      const station=createStation(i+1,x,y,facing,random);stations.push(station);
      keep(cell,rect(x-station.w/2-30,y-station.h/2-135,station.w+60,station.h+270,'parcel'));
      roads.push(line(`station-access-${i+1}`,station.door,{x:station.door.x,y:roadY},station.w-50,'concrete'));
      for(const [slot,type]of ['fuel','food','medicine'].entries()){
        const offsets=[[-station.w*.18,station.h*.22],[station.w*.18,station.h*.22],[0,station.h*.32]], amount=type==='fuel'?12+Math.round(random()*10):type==='food'?10+Math.round(random()*9):2+Math.round(random()*4);
        stationLoot.push({id:900000000+(i+1)*10+slot,stationId:station.id,type,x:x+offsets[slot][0],y:y+offsets[slot][1],amount,radius:type==='medicine'?13:17,kind:'station-loot'});
      }
    }
    for(const cell of available.filter(q=>!occupied.has(q)).slice(0,8)){
      let candidate=null;
      for(let attempt=0;attempt<240&&!candidate;attempt++){
        const x=cell.l+180+random()*Math.max(1,cell.r-cell.l-360), y=cell.t+220+random()*Math.max(1,cell.b-cell.t-380);
        if(Math.hypot(x-c,y-c)<coreReserveRadius+130)continue;
        const yard=createBackyard(backyards.length+1,x,y,random);
        const roadOverlap=yard.solids.some(box=>roads.some(r=>{const a=r.axis==='h'?{x:box.x+box.w/2,y:r.y}:r.axis==='v'?{x:r.x,y:box.y+box.h/2}:null;if(a)return circleIntersectsRect(a.x,a.y,r.width/2+8,box);const samples=Math.max(1,Math.ceil(Math.hypot(r.x2-r.x1,r.y2-r.y1)/32));for(let k=0;k<=samples;k++)if(circleIntersectsRect(r.x1+(r.x2-r.x1)*k/samples,r.y1+(r.y2-r.y1)*k/samples,r.width/2+24,box))return true;return false;}));
        if(!roadOverlap)candidate=yard;
      }
      if(!candidate)continue;
      backyards.push(candidate);keep(cell,rect(candidate.x-candidate.w/2-20,candidate.y-candidate.h/2-135,candidate.w+40,candidate.h+155,'parcel'));
      const gate=candidate.gate;
      if(cell.row<3)roads.push(line(`yard-access-${backyards.length}`,gate,{x:gate.x,y:ys[cell.row+1]},24,'dirt'));
      else {const target=xs[cell.col===0?1:cell.col===3?3:cell.col];roads.push(line(`yard-access-${backyards.length}`,gate,{x:target,y:gate.y},24,'dirt'));}
    }
    const publicRoads=roads.filter(r=>r.axis!=='line');
    for(let attempt=0;attempt<300&&wrecks.length<12;attempt++){
      const r=publicRoads[attempt%publicRoads.length], along=130+random()*(worldSize-260), horizontal=r.axis==='h', lateral=(random()<.5?-1:1)*(r.width/2-13);
      const x=horizontal?along:r.x+lateral,y=horizontal?r.y+lateral:along;
      if(Math.hypot(x-c,y-c)<coreReserveRadius||intersections.some(j=>Math.hypot(x-j.x,y-j.y)<145)||wrecks.some(w=>Math.hypot(x-w.x,y-w.y)<160))continue;
      if(roads.filter(q=>q.axis==='line').some(q=>roadContains(q,x,y,85)))continue;
      wrecks.push({id:`road-wreck-${wrecks.length+1}`,x,y,angle:horizontal?0:Math.PI/2,kind:attempt%5===0?'van':'car',looted:random()>.55,size:attempt%5===0?72:58});
    }
    // Small, grouped remnants decorate shoulders without becoming extra resource
    // deposits. They remain outside carriageways, sight triangles and parcel access.
    const families=[['maintenance','toolbox','pallet','roadSign'],['abandon','luggage','tarp','debris'],['checkpoint','cone','bollard','roadSign']];
    for(let attempt=0;attempt<300&&roadEvents.length<18;attempt++){
      const road=publicRoads[attempt%publicRoads.length], horizontal=road.axis==='h', along=150+random()*(worldSize-300), side=random()<.5?-1:1;
      const x=horizontal?along:road.x+side*(road.width/2+42),y=horizontal?road.y+side*(road.width/2+42):along;
      if(Math.hypot(x-c,y-c)<coreReserveRadius||intersections.some(j=>Math.hypot(x-j.x,y-j.y)<140)||reserve.some(b=>circleIntersectsRect(x,y,60,b))||roads.filter(r=>r!==road).some(r=>roadContains(r,x,y,65))||roadEvents.some(e=>Math.hypot(e.x-x,e.y-y)<190))continue;
      const family=families[roadEvents.length%families.length], event={id:`road-event-${roadEvents.length+1}`,kind:family[0],x,y,horizontal};roadEvents.push(event);
      for(let slot=0;slot<3;slot++)roadProps.push({id:`road-prop-${roadProps.length+1}`,eventId:event.id,family:event.kind,kind:family[slot+1],x:x+(horizontal?(slot-1)*27:0),y:y+(horizontal?0:(slot-1)*27),angle:horizontal?0:Math.PI/2,size:18+slot*3});
    }
    const plan=assembleFeaturePlan({seed:Number(seed)||0,worldSize,coreReserveRadius,roads,intersections,stations,backyards,settlements,wrecks,roadEvents,roadProps,stationLoot,layoutRevision:3,layoutTurns:0,parcelBounds:cells.map(({l,r,t,b})=>({l,r,t,b}))});
    plan.decor=makeTerrainDecor133(plan,random);
    for(const prop of plan.decor.filter(p=>p.kind==='bench')){prop.angle=0;const box=rect(prop.x-22,prop.y-7,44,20,'terrain-prop',{prop:prop.id});plan.solids.push(box);plan.buildExclusions.push(box);}
    return plan;
  }

  function makeTerrainDecor133(plan,random) {
    const kinds=['drain','manhole','crack','litter','grass','stump','marker','bench'], out=[], count=C?.TerrainRules133?.decorCount??70;
    for(let attempt=0;attempt<1200&&out.length<count;attempt++){
      const kind=kinds[out.length%kinds.length], x=80+random()*(plan.worldSize-160),y=80+random()*(plan.worldSize-160),r=kind==='bench'?22:14;
      const onRoad=[...plan.roads,...plan.settlements.flatMap(s=>[s.street,s.connector].filter(Boolean))].some(road=>roadContains(road,x,y,r));
      if(['manhole','crack','drain'].includes(kind)?!onRoad:onRoad)continue;
      if(Math.hypot(x-plan.worldSize/2,y-plan.worldSize/2)<270||plan.solids.some(box=>circleIntersectsRect(x,y,r+16,box))||out.some(p=>Math.hypot(x-p.x,y-p.y)<70))continue;
      out.push({id:`decor133-${out.length+1}`,kind,x,y,size:r,angle:random()*Math.PI*2});
    }
    return out;
  }

  // Layout 2 is opt-in for new campaigns. Every collision, access and paint footprint
  // is rotated together; historical saves keep the exact unrotated plan.
  function rotateFeaturePlan(plan) {
    const turns = Math.floor(mulberry32(plan.seed ^ 0x129D1702)() * 4), angle = turns * Math.PI / 2, size = plan.worldSize;
    plan.layoutTurns = turns;
    if (!turns) return plan;
    const point = p => turns === 1 ? { x: size-p.y, y: p.x } : turns === 2 ? { x: size-p.x, y: size-p.y } : { x: p.y, y: size-p.x };
    const center = p => ({ ...p, ...point(p), ...(p.w !== undefined ? { w: turns%2 ? p.h : p.w, h: turns%2 ? p.w : p.h } : {}) });
    const box = p => { const a=point(p), b=point({x:p.x+p.w,y:p.y+p.h}); return {...p,x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}; };
    const line = p => { const a=point({x:p.x1,y:p.y1}),b=point({x:p.x2,y:p.y2});return {...p,x1:a.x,y1:a.y,x2:b.x,y2:b.y}; };
    const visual = p => ({ ...center(p), visualRotation: { angle, source:p } });
    plan.roads = plan.roads.map(p => {
      if(p.axis==='line')return line(p);
      const a=point(p.axis==='h'?{x:0,y:p.y}:{x:p.x,y:0}),b=point(p.axis==='h'?{x:size,y:p.y}:{x:p.x,y:size});
      return {...p,axis:a.y===b.y?'h':'v',x:Math.min(a.x,b.x),y:Math.min(a.y,b.y)};
    });
    plan.intersections = plan.intersections.map(p=>({...p,...point(p),rotation:angle}));
    const directions=['north','east','south','west'];
    plan.stations=plan.stations.map(p=>({...visual(p),facing:directions[(directions.indexOf(p.facing)+turns)%4],horizontal:turns%2?!p.horizontal:p.horizontal,door:{...p.door,...point(p.door)},solids:p.solids.map(box),furniture:stationFurniture(p).map(visual)}));
    plan.backyards=plan.backyards.map(p=>({...center(p),gate:{...p.gate,...point(p.gate),vertical:!!(turns%2)},house:visual(p.house),props:p.props.map(visual),solids:p.solids.map(box)}));
    plan.settlements=plan.settlements.map(p=>({...p,...point(p),buildings:p.buildings.map(visual),street:line(p.street),connector:line(p.connector)}));
    plan.wrecks=plan.wrecks.map(p=>({...p,...point(p),angle:p.angle+angle}));
    plan.roadEvents=plan.roadEvents.map(p=>({...p,...point(p),horizontal:turns%2?!p.horizontal:p.horizontal}));
    plan.roadProps=plan.roadProps.map(p=>({...p,...point(p),angle:p.angle+angle}));
    plan.stationLoot=plan.stationLoot.map(p=>({...p,...point(p)}));
    plan.solids=plan.solids.map(box);plan.buildExclusions=plan.buildExclusions.map(box);
    return plan;
  }

  function drawRotatedFeature(ctx, feature, draw) {
    const visual=feature.visualRotation;if(!visual)return false;
    ctx.save();ctx.translate(feature.x,feature.y);ctx.rotate(visual.angle);ctx.translate(-visual.source.x,-visual.source.y);draw(ctx,visual.source);ctx.restore();return true;
  }

  function orientedSolid134(x,y,w,h,angle,source={}) {
    const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle)),bw=w*c+h*s,bh=w*s+h*c;
    return {...source,x:x-bw/2,y:y-bh/2,w:bw,h:bh,oriented:{x,y,w,h,angle}};
  }

  function physicalSolids134(plan) {
    const wrecks=new Map((plan.wrecks||[]).map(w=>[w.id,w])),props=new Map((plan.roadProps||[]).map(p=>[p.id,p]));
    const dimensions={barrier:[36,8],tirePile:[26,22],shoppingCart:[26,22],pallet:[26,18]};
    return (plan.solids||[]).map(box=>{
      const wreck=box.kind==='wreck'&&wrecks.get(box.wreck);
      if(wreck)return orientedSolid134(wreck.x,wreck.y,wreck.size*.92,wreck.size*.48*.84,wreck.angle||0,box);
      const prop=box.kind==='road-prop'&&props.get(box.prop),size=prop&&dimensions[prop.kind];
      return size?orientedSolid134(prop.x,prop.y,size[0],size[1],prop.angle||0,box):box;
    });
  }

  function circleIntersectsRect(x, y, radius, box) {
    if(box.oriented){const o=box.oriented,c=Math.cos(o.angle),s=Math.sin(o.angle),dx=x-o.x,dy=y-o.y;return circleIntersectsRect(dx*c+dy*s,-dx*s+dy*c,radius,{x:-o.w/2,y:-o.h/2,w:o.w,h:o.h});}
    const px = clamp(x, box.x, box.x + box.w), py = clamp(y, box.y, box.y + box.h);
    return (x - px) ** 2 + (y - py) ** 2 < radius ** 2;
  }

  function rectsOverlap(a, b) {
    if(!(a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y))return false;
    if(!a.oriented&&!b.oriented)return true;
    const shape=box=>box.oriented||{x:box.x+box.w/2,y:box.y+box.h/2,w:box.w,h:box.h,angle:0};
    const aa=shape(a),bb=shape(b),axes=o=>[{x:Math.cos(o.angle),y:Math.sin(o.angle)},{x:-Math.sin(o.angle),y:Math.cos(o.angle)}],ax=axes(aa),bx=axes(bb);
    for(const n of [...ax,...bx]){const radius=(o,axes)=>Math.abs(n.x*axes[0].x+n.y*axes[0].y)*o.w/2+Math.abs(n.x*axes[1].x+n.y*axes[1].y)*o.h/2;if(Math.abs((bb.x-aa.x)*n.x+(bb.y-aa.y)*n.y)>=radius(aa,ax)+radius(bb,bx)-1e-9)return false;}
    return true;
  }

  function buildingFootprint(def, gx, gy, rotation = 0, tile = 32) {
    const raw = Array.isArray(def?.size) ? def.size : [def?.w, def?.h];
    const width = Number(raw?.[0]), height = Number(raw?.[1]);
    if (!(width > 0) || !(height > 0) || !(tile > 0)) throw new RangeError('Gabarit de construction invalide.');
    const rotated = rotation % 2 ? [height, width] : [width, height];
    return { x: gx * tile, y: gy * tile, w: rotated[0] * tile, h: rotated[1] * tile };
  }

  function createSpatialIndex(boxes, cellSize = 256) {
    if (!(cellSize > 0)) throw new RangeError('Cellule spatiale invalide.');
    const cells = new Map(), source = Array.isArray(boxes) ? boxes : [];
    const key = (x, y) => `${x}:${y}`;
    for (const box of source) {
      const minX = Math.floor(box.x / cellSize), maxX = Math.floor((box.x + box.w) / cellSize);
      const minY = Math.floor(box.y / cellSize), maxY = Math.floor((box.y + box.h) / cellSize);
      for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) {
        const id = key(cx, cy); if (!cells.has(id)) cells.set(id, []); cells.get(id).push(box);
      }
    }
    return { cellSize, cells };
  }

  function querySpatialIndexRect(index, area) {
    if (!index?.cells || !area) return [];
    const out = [], seen = new Set(), size = index.cellSize, key = (x, y) => `${x}:${y}`;
    const minX = Math.floor(area.x / size), maxX = Math.floor((area.x + area.w) / size);
    const minY = Math.floor(area.y / size), maxY = Math.floor((area.y + area.h) / size);
    for (let cy = minY; cy <= maxY; cy++) for (let cx = minX; cx <= maxX; cx++) for (const box of index.cells.get(key(cx, cy)) || []) {
      if (seen.has(box)) continue; seen.add(box); if (rectsOverlap(area, box)) out.push(box);
    }
    return out;
  }

  function querySpatialIndexCircle(index, x, y, radius) {
    const area = { x: x - radius, y: y - radius, w: radius * 2, h: radius * 2 };
    return querySpatialIndexRect(index, area).filter(box => circleIntersectsRect(x, y, radius, box));
  }

  const SPATIAL_CACHE = new WeakMap();
  function planSpatial(plan) {
    let cached = SPATIAL_CACHE.get(plan);
    if (!cached || cached.solids !== plan.solids || cached.exclusions !== plan.buildExclusions) {
      const solids=physicalSolids134(plan),blockers = [...(plan.buildExclusions || []), ...solids];
      cached = {
        solids: plan.solids,
        exclusions: plan.buildExclusions,
        solidIndex: createSpatialIndex(solids),
        blockerIndex: createSpatialIndex(blockers)
      };
      SPATIAL_CACHE.set(plan, cached);
    }
    return cached;
  }

  function firstObstruction134(plan,from,to,pad=0,barriersOnly=false) {
    const dx=to.x-from.x,dy=to.y-from.y,epsilon=.0001;
    const bounds={x:Math.min(from.x,to.x)-pad-epsilon,y:Math.min(from.y,to.y)-pad-epsilon,w:Math.abs(dx)+pad*2+epsilon*2,h:Math.abs(dy)+pad*2+epsilon*2};
    let best=null;
    for(const box of querySpatialIndexRect(planSpatial(plan).solidIndex,bounds)){
      if(barriersOnly&&!['house','settlement-building','station-wall','palisade'].includes(box.kind))continue;
      let a=from,b=to,shape=box;
      if(box.oriented){const o=box.oriented,c=Math.cos(o.angle),s=Math.sin(o.angle),local=p=>({x:(p.x-o.x)*c+(p.y-o.y)*s,y:-(p.x-o.x)*s+(p.y-o.y)*c});a=local(from);b=local(to);shape={x:-o.w/2,y:-o.h/2,w:o.w,h:o.h};}
      let near=0,far=1,hit=true;
      for(const [origin,delta,lo,hi]of[[a.x,b.x-a.x,shape.x-pad,shape.x+shape.w+pad],[a.y,b.y-a.y,shape.y-pad,shape.y+shape.h+pad]]){
        if(Math.abs(delta)<1e-12){if(origin<lo||origin>hi){hit=false;break;}}
        else{const u=(lo-origin)/delta,v=(hi-origin)/delta;near=Math.max(near,Math.min(u,v));far=Math.min(far,Math.max(u,v));if(near>far){hit=false;break;}}
      }
      if(hit&&(!best||near<best.fraction))best={fraction:near,x:from.x+dx*near,y:from.y+dy*near,box};
    }
    return best;
  }

  function edgeTransition(position, dx, dy, worldSize, radius = 12) {
    const margin = radius + 8;
    const rawX = position.x + dx, rawY = position.y + dy;
    const crossed = [];
    if (rawX < margin) crossed.push({ edge: 'west', over: margin - rawX });
    if (rawX > worldSize - margin) crossed.push({ edge: 'east', over: rawX - (worldSize - margin) });
    if (rawY < margin) crossed.push({ edge: 'north', over: margin - rawY });
    if (rawY > worldSize - margin) crossed.push({ edge: 'south', over: rawY - (worldSize - margin) });
    if (!crossed.length) return null;
    crossed.sort((a, b) => b.over - a.over);
    const edge = crossed[0].edge;
    const next = { x: clamp(rawX, margin, worldSize - margin), y: clamp(rawY, margin, worldSize - margin), edge, offsetX: 0, offsetY: 0 };
    if (edge === 'west') { next.x = worldSize - margin - 2; next.offsetX = -1; }
    else if (edge === 'east') { next.x = margin + 2; next.offsetX = 1; }
    else if (edge === 'north') { next.y = worldSize - margin - 2; next.offsetY = -1; }
    else { next.y = margin + 2; next.offsetY = 1; }
    return next;
  }

  function packInventory(carry, cols = 8, rows = 5) {
    const occupied = Array.from({ length: rows }, () => Array(cols).fill(false));
    const items = [], overflow = [];
    const tryPlace = (key, quantity, baseW, baseH, stackIndex) => {
      const variants = baseW === baseH ? [[baseW,baseH]] : [[baseW,baseH],[baseH,baseW]];
      for (const [w,h] of variants) for (let y = 0; y <= rows-h; y++) for (let x = 0; x <= cols-w; x++) {
        let fits = true;
        for (let yy=y; yy<y+h && fits; yy++) for (let xx=x; xx<x+w; xx++) if (occupied[yy][xx]) { fits=false; break; }
        if (!fits) continue;
        for (let yy=y; yy<y+h; yy++) for (let xx=x; xx<x+w; xx++) occupied[yy][xx]=true;
        items.push({ key, label: RESOURCE_LABELS[key] || key, quantity, stackIndex, x, y, w, h });
        return true;
      }
      return false;
    };
    for (const key of Object.keys(INVENTORY_SHAPES)) {
      let quantity = Math.max(0, Number(carry && carry[key]) || 0), stackIndex = 0;
      const [baseW,baseH] = INVENTORY_SHAPES[key], limit = INVENTORY_STACKS[key] || quantity || 1;
      while (quantity > .001) {
        const stack = Math.min(limit, quantity); stackIndex++;
        if (!tryPlace(key, stack, baseW, baseH, stackIndex)) { overflow.push({key,label:RESOURCE_LABELS[key]||key,quantity}); break; }
        quantity -= stack;
      }
    }
    return { cols, rows, items, overflow };
  }

  function pointSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx=x2-x1, dy=y2-y1, length=dx*dx+dy*dy;
    if (!length) return Math.hypot(px-x1,py-y1);
    const t=clamp(((px-x1)*dx+(py-y1)*dy)/length,0,1), x=x1+t*dx, y=y1+t*dy;
    return Math.hypot(px-x,py-y);
  }

  function roadContains(road, x, y, extra = 0) {
    const half=road.width/2+extra;
    if (road.axis==='h') return Math.abs(y-road.y)<=half;
    if (road.axis==='v') return Math.abs(x-road.x)<=half;
    return pointSegmentDistance(x,y,road.x1,road.y1,road.x2,road.y2)<=half;
  }

  function drawRoadBase(ctx, road, fill, center, alpha=1) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.lineCap='butt';
    if (road.axis==='h') { ctx.fillStyle=fill; ctx.fillRect(0,road.y-road.width/2,road.length,road.width); }
    else if (road.axis==='v') { ctx.fillStyle=fill; ctx.fillRect(road.x-road.width/2,0,road.width,road.length); }
    else { ctx.strokeStyle=fill; ctx.lineWidth=road.width; ctx.beginPath(); ctx.moveTo(road.x1,road.y1); ctx.lineTo(road.x2,road.y2); ctx.stroke(); }
    if(road.lanes===1){ctx.restore();return;}
    ctx.strokeStyle=center; ctx.lineWidth=road.lanes===4?2.5:2; ctx.setLineDash(road.lanes===4?[34,24]:road.lanes===3?[28,20]:[22,22]); ctx.beginPath();
    if (road.axis==='h') { ctx.moveTo(0,road.y); ctx.lineTo(road.length,road.y); }
    else if (road.axis==='v') { ctx.moveTo(road.x,0); ctx.lineTo(road.x,road.length); }
    else { ctx.moveTo(road.x1,road.y1); ctx.lineTo(road.x2,road.y2); }
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  const paintedRoads136 = new WeakMap();
  function roadPaint136(plan, kit) {
    const previous=paintedRoads136.get(plan);
    if(previous&&previous.roads===plan.roads&&previous.settlements===plan.settlements&&previous.kit===kit)return previous;
    const materials={dirt:{surfaceColor:'#655b43',shoulderColor:'#6f684f'},gravel:{surfaceColor:'#777365',shoulderColor:'#939080'},concrete:{surfaceColor:'#7c8175',shoulderColor:'#969c8e'}};
    const sources=[...plan.roads,...(plan.settlements||[]).flatMap(s=>[s.street,s.connector].filter(Boolean))];
    const segments=sources.map((r,index)=>{
      const a=r.axis==='h'?{x:0,y:r.y}:r.axis==='v'?{x:r.x,y:0}:{x:r.x1,y:r.y1};
      const b=r.axis==='h'?{x:r.length,y:r.y}:r.axis==='v'?{x:r.x,y:r.length}:{x:r.x2,y:r.y2};
      return{id:r.id||'local-access-'+index,a:{x:a.x/32,y:a.y/32},b:{x:b.x/32,y:b.y/32},width:r.width/32,markings:r.lanes>1,lineCap:r.className==='service'?'round':'butt',...materials[r.surface]};
    });
    // Only the immutable paint adapters and junction spans are cached. Campaign
    // plan arrays are replaced by syncPlan on seed/restore; no world data changes.
    const spans=new Map(segments.map(r=>[r,r.markings?kit.markingSpans(r,segments):[]]));
    const result={roads:plan.roads,settlements:plan.settlements,kit,segments,spans};paintedRoads136.set(plan,result);return result;
  }

  function drawRoadNetwork(ctx, plan, view) {
    const kit=globalThis.DeadwallRoadKit;
    if(plan.layoutRevision===3&&kit?.drawNetwork&&kit?.markingSpans){
      const paint=roadPaint136(plan,kit);
      ctx.save();ctx.scale(32,32);
      kit.drawNetwork(ctx,paint.segments,{view:{l:view.left/32,r:view.right/32,t:view.top/32,b:view.bottom/32},shoulderWidth:.35,spans:paint.spans});
      ctx.restore();return;
    }

    ctx.save();
    for (const road of plan.roads) {
      if (road.axis === 'h' && (road.y + road.width < view.top || road.y - road.width > view.bottom)) continue;
      if (road.axis === 'v' && (road.x + road.width < view.left || road.x - road.width > view.right)) continue;
      if (road.axis === 'line') {
        const minX=Math.min(road.x1,road.x2)-road.width, maxX=Math.max(road.x1,road.x2)+road.width, minY=Math.min(road.y1,road.y2)-road.width, maxY=Math.max(road.y1,road.y2)+road.width;
        if (maxX<view.left||minX>view.right||maxY<view.top||minY>view.bottom) continue;
      }
      const fill = road.surface === 'dirt' ? '#4b4737' : road.surface === 'gravel' ? '#55564a' : road.surface === 'concrete' ? '#464c45' : road.className === 'arterial' ? '#292f2d' : road.className === 'diagonal' ? '#2b302e' : '#272d2b';
      drawRoadBase(ctx, road, fill, road.className==='arterial'?'rgba(214,197,135,.20)':'rgba(214,197,135,.14)');
      if (road.lanes===4) {
        ctx.strokeStyle='rgba(224,218,188,.09)';ctx.lineWidth=1;ctx.setLineDash([12,18]);
        for (const side of [-1,1]) { ctx.beginPath(); if (road.axis==='h'){ctx.moveTo(0,road.y+side*road.width*.25);ctx.lineTo(plan.worldSize,road.y+side*road.width*.25);} else if(road.axis==='v'){ctx.moveTo(road.x+side*road.width*.25,0);ctx.lineTo(road.x+side*road.width*.25,plan.worldSize);} ctx.stroke(); }
        ctx.setLineDash([]);
      }
    }
    for (const j of plan.intersections) {
      if (j.x + 120 < view.left || j.x - 120 > view.right || j.y + 120 < view.top || j.y - 120 > view.bottom) continue;
      if(plan.layoutRevision===3){
        ctx.strokeStyle='rgba(225,221,193,.30)';ctx.lineWidth=3;
        if(Math.abs(j.x-plan.worldSize/2)<1){for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(j.x+side*108,j.y-34);ctx.lineTo(j.x+side*108,j.y+34);ctx.stroke();}}
        else {for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(j.x-34,j.y+side*82);ctx.lineTo(j.x+34,j.y+side*82);ctx.stroke();}}
        continue;
      }
      ctx.strokeStyle = j.kind==='angled'?'rgba(234,205,124,.34)':'rgba(229,221,188,.20)'; ctx.lineWidth = 3;
      if(j.kind==='angled'){ctx.beginPath();ctx.arc(j.x,j.y,72,0,Math.PI*2);ctx.stroke();ctx.beginPath();const diagonal=Math.round((j.rotation||0)/(Math.PI/2))%2?-1:1;ctx.moveTo(j.x-54,j.y+54*diagonal);ctx.lineTo(j.x+54,j.y-54*diagonal);ctx.stroke();}
      else ctx.strokeRect(j.x - 66, j.y - 66, 132, 132);
      ctx.fillStyle = 'rgba(226,217,180,.13)';
      for (let i = -2; i <= 2; i++) { ctx.fillRect(j.x - 62 + i * 22, j.y - 79, 13, 5); ctx.fillRect(j.x - 62 + i * 22, j.y + 74, 13, 5); }
    }
    for(const settlement of plan.settlements||[]){for(const local of [settlement.street,settlement.connector].filter(Boolean)){ctx.strokeStyle='rgba(190,178,136,.11)';ctx.lineWidth=local.width;ctx.beginPath();ctx.moveTo(local.x1,local.y1);ctx.lineTo(local.x2,local.y2);ctx.stroke();ctx.strokeStyle='rgba(226,218,179,.15)';ctx.lineWidth=1;ctx.setLineDash([18,18]);ctx.stroke();ctx.setLineDash([]);}}
    ctx.restore();
  }

  function drawPalisade(ctx, box) {
    ctx.save();
    ctx.fillStyle = '#4d3c2c'; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(190,156,103,.34)'; ctx.lineWidth = 1;
    const vertical = box.h > box.w;
    const length = vertical ? box.h : box.w;
    for (let p = 5; p < length; p += 13) {
      ctx.beginPath();
      if (vertical) { ctx.moveTo(box.x + 2, box.y + p); ctx.lineTo(box.x + box.w - 2, box.y + p); }
      else { ctx.moveTo(box.x + p, box.y + 2); ctx.lineTo(box.x + p, box.y + box.h - 2); }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStationFloor(ctx, station) {
    if(drawRotatedFeature(ctx,station,drawStationFloor))return;
    const l = station.x - station.w / 2, t = station.y - station.h / 2;
    ctx.save();
    ctx.fillStyle = '#686a5d'; ctx.fillRect(l, t, station.w, station.h);
    ctx.strokeStyle='rgba(32,38,32,.18)';ctx.lineWidth=1;for(let x=l+24;x<l+station.w;x+=24){ctx.beginPath();ctx.moveTo(x,t+8);ctx.lineTo(x,t+station.h-8);ctx.stroke();}for(let y=t+24;y<t+station.h;y+=24){ctx.beginPath();ctx.moveTo(l+8,y);ctx.lineTo(l+station.w-8,y);ctx.stroke();}
    ctx.fillStyle = 'rgba(145,126,80,.20)'; ctx.fillRect(l + 24, t + 24, station.w - 48, station.h - 48);
    const stripe={miniMarket:'#9d7846',garage:'#81705a',rural:'#6f795d',service:'#92744f'}[station.archetype]||'#8a744c';ctx.fillStyle=stripe;ctx.globalAlpha=.34;ctx.fillRect(l+18,t+18,station.w-36,7);ctx.globalAlpha=1;
    ctx.strokeStyle = 'rgba(214,185,105,.28)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(station.door.x, station.door.y, 12, 0, Math.PI * 2); ctx.stroke();
    for(const win of station.windows||[]){ctx.fillStyle='#393d33';ctx.fillRect(win.x-10,win.y-win.width/2,20,win.width);ctx.fillStyle='#b5ac8f';ctx.fillRect(win.x-8,win.y-win.width/2,16,4);ctx.fillRect(win.x-8,win.y+win.width/2-4,16,4);ctx.fillStyle='#879d91';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(win.x-4+i*3,win.y-21+i*12);ctx.lineTo(win.x+6,win.y-17+i*12);ctx.lineTo(win.x-6,win.y-15+i*12);ctx.closePath();ctx.fill();}}
    ctx.restore();
  }

  function drawStationWall(ctx, wall) {
    ctx.save(); ctx.lineWidth=1.5;ctx.fillStyle = '#6d6758'; ctx.fillRect(wall.x, wall.y, wall.w, wall.h); ctx.strokeStyle = '#252b27'; ctx.strokeRect(wall.x, wall.y, wall.w, wall.h); ctx.restore();
  }

  function stationFurniture(station) {
    if(station.furniture)return station.furniture;
    const items = [], w=station.w, h=station.h;
    if(station.archetype==='garage'){
      items.push({kind:'counter',x:station.x-w*.18,y:station.y-h*.26,w:92,h:22});
      items.push({kind:'workbench',x:station.x+w*.28,y:station.y-h*.29,w:86,h:24});
      items.push({kind:'shelf',x:station.x+w*.36,y:station.y+h*.06,w:24,h:76});
    }else if(station.archetype==='rural'){
      items.push({kind:'counter',x:station.x,y:station.y-h*.27,w:82,h:20});
      items.push({kind:'shelf',x:station.x-w*.34,y:station.y+h*.03,w:20,h:62});
    }else if(station.archetype==='service'){
      items.push({kind:'counter',x:station.x,y:station.y-h*.29,w:122,h:24});
      items.push({kind:'shelf',x:station.x-w*.34,y:station.y,w:22,h:82});
      items.push({kind:'shelf',x:station.x+w*.34,y:station.y,w:22,h:82});
      items.push({kind:'vending',x:station.x+w*.24,y:station.y-h*.27,w:28,h:34});
    }else{
      items.push({kind:'counter',x:station.x,y:station.y-h*.25,w:104,h:22});
      items.push({kind:'shelf',x:station.x-w*.34,y:station.y+h*.06,w:22,h:68});
    }
    const pumpY = station.y + (station.facing === 'north' ? -h * .72 : station.facing === 'south' ? h * .72 : 0);
    const pumpX = station.x + (station.facing === 'west' ? -w * .68 : station.facing === 'east' ? w * .68 : 0);
    const pumpCount=station.archetype==='rural'?2:station.archetype==='service'?4:3;
    for (let i = 0; i < pumpCount; i++) {
      const centered=i-(pumpCount-1)/2,spacing=station.archetype==='service'?44:48;
      items.push({ kind: 'pump', x: station.facing === 'north' || station.facing === 'south' ? pumpX + centered * spacing : pumpX, y: station.facing === 'west' || station.facing === 'east' ? pumpY + centered * spacing : pumpY, w: 16, h: 26 });
    }
    return items;
  }

  function drawStationFurniture(ctx, item) {
    if(drawRotatedFeature(ctx,item,drawStationFurniture))return;
    const owner=globalThis.DEADWALL;
    ctx.save();
    if (item.kind === 'counter') { ctx.fillStyle = '#463e33'; ctx.fillRect(item.x - item.w / 2, item.y - item.h / 2, item.w, item.h); ctx.fillStyle = '#a89255'; ctx.fillRect(item.x - item.w / 2 + 7, item.y - item.h / 2 + 4, item.w - 14, 4); }
    else if(item.kind==='shelf'){ctx.fillStyle='#3e443f';ctx.fillRect(item.x-item.w/2,item.y-item.h/2,item.w,item.h);ctx.fillStyle='#77705a';for(let y=item.y-item.h/2+9;y<item.y+item.h/2;y+=17)ctx.fillRect(item.x-item.w/2+3,y,item.w-6,3);}
    else if(item.kind==='workbench'){ctx.fillStyle='#504333';ctx.fillRect(item.x-item.w/2,item.y-item.h/2,item.w,item.h);ctx.fillStyle='#8d7550';ctx.fillRect(item.x-item.w/2+5,item.y-item.h/2+4,item.w-10,4);}
    else if(item.kind==='vending'){ctx.fillStyle='#4f5a55';ctx.fillRect(item.x-item.w/2,item.y-item.h/2,item.w,item.h);ctx.fillStyle='#9b7448';ctx.fillRect(item.x-item.w*.32,item.y-item.h*.32,item.w*.64,item.h*.22);}
    else { ctx.fillStyle = '#615b4c'; ctx.fillRect(item.x - 8, item.y - 13, 16, 26); ctx.fillStyle = '#b99b56'; ctx.fillRect(item.x - 5, item.y - 9, 10, 5); }
    // The physical support stays legible along long counters and shelves;
    // proportional sprites add detail without shrinking their occupied surface.
    globalThis.DeadwallInteriorArt153?.drawFurniture(ctx,owner?.art,{...item,x:item.x-item.w/2,y:item.y-item.h/2},{seed:owner?.world?.seed||0,alignLongAxis:true});
    ctx.restore();
  }

  function drawBackyardFloor(ctx, yard) {
    const l = yard.x - yard.w / 2, t = yard.y - yard.h / 2;
    ctx.save(); ctx.fillStyle = 'rgba(77,86,61,.22)'; ctx.fillRect(l, t, yard.w, yard.h); ctx.fillStyle = '#8a7851'; if(yard.gate.vertical)ctx.fillRect(yard.gate.x-3,yard.gate.y-yard.gate.width/2,6,yard.gate.width);else ctx.fillRect(yard.gate.x - yard.gate.width / 2, yard.gate.y - 3, yard.gate.width, 6); ctx.restore();
  }

  function drawYardProp(ctx, p) {
    if(drawRotatedFeature(ctx,p,drawYardProp))return;
    if(globalThis.DeadwallWorldPropsArt153?.drawYardProp(ctx,globalThis.DEADWALL?.art,p,{seed:globalThis.DEADWALL?.world?.seed||0}))return;
    ctx.save();
    if (p.kind === 'shed') {ctx.fillStyle='#51483a';ctx.fillRect(p.x-p.size*.45,p.y-p.size*.35,p.size*.9,p.size*.7);ctx.fillStyle='#746b55';ctx.fillRect(p.x-p.size*.48,p.y-p.size*.35-8,p.size*.96,p.size*.7);ctx.strokeStyle='#403e31';ctx.lineWidth=1;for(let x=p.x-p.size*.4;x<p.x+p.size*.45;x+=7){ctx.beginPath();ctx.moveTo(x,p.y-p.size*.35-8);ctx.lineTo(x,p.y+p.size*.35-8);ctx.stroke();}ctx.fillStyle='#292f27';ctx.fillRect(p.x-4,p.y+p.size*.35-7,8,7);}
    else if (p.kind === 'barrel') { ctx.fillStyle = '#545a55'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * .36, 0, Math.PI * 2); ctx.fill(); }
    else if(p.kind==='mailbox'){ctx.strokeStyle='#595f59';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+16);ctx.stroke();ctx.fillStyle='#6f6956';ctx.fillRect(p.x-7,p.y-7,14,9);}
    else { ctx.fillStyle = '#624a32'; for (let i = 0; i < 4; i++) ctx.fillRect(p.x - 13 + i * 8, p.y - 10 + (i % 2) * 4, 6, 23); }
    ctx.restore();
  }

  // Buildings use the same ground plane as actors. Only the wall height is
  // projected north on screen; rotating a parcel must never rotate gravity.
  function buildingProjection134(building) {
    const l=building.x-building.w/2,t=building.y-building.h/2;
    const height=building.kind==='twoStorey'?28:building.type==='workshop'?17:21;
    return {l,t,r:l+building.w,b:t+building.h,height,roofTop:t-height,roofBottom:t+building.h-height};
  }

  const BUILDING_WEATHER134=new WeakMap();
  function roofWeather134(building) {
    let marks=BUILDING_WEATHER134.get(building);if(marks)return marks;
    marks=[];let grain=((Math.round(building.x)*73856093)^(Math.round(building.y)*19349663))>>>0;
    for(let i=0;i<44;i++){grain=(Math.imul(grain,1664525)+1013904223)>>>0;const x=(grain%1000)/1000;grain=(Math.imul(grain,1664525)+1013904223)>>>0;marks.push({x,y:(grain%1000)/1000,w:2+(grain%6),h:1+((grain>>>4)%3),light:i%3===0});}
    BUILDING_WEATHER134.set(building,marks);return marks;
  }

  function drawBuildingShell134(ctx, building, residential) {
    const q=buildingProjection134(building),{l,t,r,b,height,roofTop,roofBottom}=q,w=building.w,h=building.h;
    const type=building.kind||building.type;
    const walls={bungalow:'#807966',twoStorey:'#817565',rowHouse:'#707972',farmhouse:'#82735c',houseSmall:'#797568',houseWide:'#807a69',shop:'#758078',workshop:'#73685b',clinic:'#7e8c80',diner:'#897664'};
    const roofs={bungalow:'#5a5145',twoStorey:'#535955',rowHouse:'#62605a',farmhouse:'#71604c',houseSmall:'#63594c',houseWide:'#515c59',shop:'#555c58',workshop:'#646960',clinic:'#666e63',diner:'#675a4c'};
    ctx.save();
    // Contact shadow belongs to the real footprint, not a vertical facade.
    ctx.fillStyle='rgba(0,0,0,.27)';ctx.fillRect(l+5,t+3,w+5,h+5);
    ctx.fillStyle=walls[type]||'#7d7867';ctx.fillRect(l,roofTop,w,h+height);
    ctx.fillStyle='rgba(31,33,28,.32)';ctx.fillRect(l,roofBottom,w,height);
    const doorX=Number.isFinite(building.rearDoorX)&&!building.visualRotation?clamp(building.rearDoorX,l+18,r-18):building.x;
    ctx.fillStyle='#343831';ctx.fillRect(doorX-8,b-height+3,16,height-3);
    ctx.fillStyle='#b4a071';ctx.fillRect(doorX+3,b-9,2,2);
    for(let x=l+13;x<r-21;x+=36){if(Math.abs(x+7-doorX)<20)continue;ctx.fillStyle='#2d3a37';ctx.fillRect(x,b-height+5,16,8);ctx.fillStyle='#87978b';ctx.fillRect(x,b-height+5,16,1);ctx.fillRect(x+7,b-height+5,1,8);}
    // The roof covers the actual x/y footprint; compact facades do not pretend
    // that a top-down footprint is an upright front-view wall.
    ctx.fillStyle=roofs[type]||'#5d6055';ctx.fillRect(l-3,roofTop-2,w+6,h+4);
    const roofPainted153=globalThis.DeadwallInteriorArt153?.drawLocalRoof(ctx,globalThis.DEADWALL?.art,building,{x:l-3,y:roofTop-2,w:w+6,h:h+4},{seed:globalThis.DEADWALL?.world?.seed||0});
    const material=globalThis.DeadwallAssets136?.surfaceFor138(type,'roof',{domain:'local'});
    if(!roofPainted153&&material&&!residential)globalThis.DeadwallAssets136.drawSurface138(ctx,globalThis.DEADWALL?.art,material,l-3,roofTop-2,w+6,h+4,{tile:256,alpha:.72});
    if(!roofPainted153&&residential){
      const vertical=w<h,ridge=vertical?building.x:roofTop+h*.48;
      ctx.fillStyle='rgba(188,173,137,.14)';if(vertical)ctx.fillRect(l-2,roofTop-1,w/2+2,h+2);else ctx.fillRect(l-2,roofTop-1,w+4,h*.48+1);
      ctx.strokeStyle='rgba(23,29,26,.38)';ctx.lineWidth=1;
      for(let y=roofTop+7;y<roofBottom;y+=9){ctx.beginPath();ctx.moveTo(l-1,y);ctx.lineTo(r+1,y);ctx.stroke();}
      for(let x=l+11;x<r;x+=18){ctx.beginPath();ctx.moveTo(x,roofTop);ctx.lineTo(x,roofBottom);ctx.stroke();}
      ctx.strokeStyle='#a08c69';ctx.lineWidth=3;ctx.beginPath();if(vertical){ctx.moveTo(ridge,roofTop-2);ctx.lineTo(ridge,roofBottom+2);}else{ctx.moveTo(l-3,ridge);ctx.lineTo(r+3,ridge);}ctx.stroke();
      ctx.fillStyle='#373b34';ctx.fillRect(r-30,roofTop+10,12,17);ctx.fillStyle='#8d8270';ctx.fillRect(r-31,roofTop+8,12,6);
    }else if(!roofPainted153){
      ctx.strokeStyle='rgba(172,171,146,.22)';ctx.lineWidth=1;for(let x=l+9;x<r;x+=14){ctx.beginPath();ctx.moveTo(x,roofTop+3);ctx.lineTo(x,roofBottom-3);ctx.stroke();}
      ctx.strokeStyle='#929384';ctx.lineWidth=3;ctx.strokeRect(l+2,roofTop+3,w-4,h-6);
      ctx.fillStyle='#35413e';ctx.fillRect(l+15,roofTop+15,Math.min(44,w*.28),18);ctx.strokeStyle='#87938b';ctx.lineWidth=2;ctx.strokeRect(l+15,roofTop+15,Math.min(44,w*.28),18);
      ctx.fillStyle='#474c44';ctx.fillRect(r-39,roofTop+15,24,21);ctx.fillStyle='#777c6d';ctx.fillRect(r-41,roofTop+12,24,18);ctx.strokeStyle='#464c45';for(let y=roofTop+15;y<roofTop+29;y+=4){ctx.beginPath();ctx.moveTo(r-37,y);ctx.lineTo(r-21,y);ctx.stroke();}
      if(type==='clinic'){ctx.fillStyle='#b8bbaa';ctx.fillRect(building.x-3,roofTop+h*.56-11,6,22);ctx.fillRect(building.x-11,roofTop+h*.56-3,22,6);}
    }
    // Sparse weathering is prepared once per building; no frame/world RNG.
    for(const mark of roofWeather134(building)){ctx.fillStyle=mark.light?'rgba(197,188,150,.15)':'rgba(22,29,23,.12)';ctx.fillRect(l+4+mark.x*(w-8),roofTop+5+mark.y*(h-10),mark.w,mark.h);}
    ctx.fillStyle='rgba(24,31,24,.17)';ctx.fillRect(l,roofTop,w,3);ctx.fillRect(l,roofTop,3,h);ctx.fillRect(r-5,roofTop+3,5,h-3);
    ctx.fillStyle='rgba(123,130,84,.19)';ctx.fillRect(l+7,roofBottom-6,w*.27,4);ctx.fillRect(r-25,roofTop+6,15,h*.23);
    ctx.strokeStyle='#303a31';ctx.lineWidth=2;ctx.strokeRect(l-3,roofTop-2,w+6,h+4);
    ctx.fillStyle='#28322b';ctx.fillRect(l-3,roofBottom+1,w+6,3);
    ctx.restore();
  }

  // Cache only a stable projected shell. Moving cameras keep the native path
  // until its physical pixel phase repeats; a hit is copied without resampling.
  // Grouped compositing changes RGB rounding by at most three levels in the
  // native raster audit. Only the unclipped opaque local painter opts in:
  // clipped regional projections and transparent contexts stay native.
  function createBuildingShellCache155({canvas=()=>globalThis.document?.createElement?.('canvas'),bytes=8*1024*1024,entries=96}={}) {
    const items=new Map();let pending=new WeakMap(),used=0;
    const equal=(a,b)=>a&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
    const remove=building=>{const old=items.get(building);if(old){used-=old.bytes;items.delete(building);}pending.delete(building);};
    const states=['globalAlpha','filter','imageSmoothingEnabled','imageSmoothingQuality','lineCap','lineJoin','lineWidth','miterLimit','lineDashOffset','shadowColor'];
    function paint(ctx,building,draw,revision=[],unclipped=false){
      const m=ctx.getTransform?.();
      if(!unclipped||ctx.getContextAttributes?.()?.alpha!==false||ctx.globalAlpha!==1||(ctx.filter&&ctx.filter!=='none')||!m||![m.a,m.b,m.c,m.d,m.e,m.f,building.x,building.y,building.w,building.h].every(Number.isFinite)||building.w<=0||building.h<=0||m.a<=0||m.d<=0||m.b!==0||m.c!==0||ctx.globalCompositeOperation!=='source-over'||ctx.shadowBlur||ctx.shadowOffsetX||ctx.shadowOffsetY){draw();return false;}
      const q=buildingProjection134(building),left=Math.floor((q.l-7)*m.a+m.e),top=Math.floor((q.roofTop-6)*m.d+m.f),right=Math.ceil((q.r+10)*m.a+m.e),bottom=Math.ceil((q.b+10)*m.d+m.f);
      const width=right-left,height=bottom-top,size=width*height*4;
      if(width<1||height<1||width>2048||height>2048||size>Math.min(bytes,1024*1024)||entries<1){draw();return false;}
      const dash=ctx.getLineDash?.()||[],key=[building.id,building.variant,building.x,building.y,building.w,building.h,building.kind,building.type,building.rearDoorX,building.visualRotation,m.a,m.d,m.e-left,m.f-top,width,height,...states.map(name=>ctx[name]),dash.join(','),...revision];
      let saved=items.get(building);
      if(saved&&!equal(saved.key,key)){remove(building);saved=null;}
      if(!saved){
        if(!equal(pending.get(building),key)){pending.set(building,key);draw();return false;}
        let image,c;
        try{image=canvas();c=image?.getContext?.('2d');}catch{draw();return false;}
        if(!c||typeof c.setTransform!=='function'){draw();return false;}
        image.width=width;image.height=height;c.setTransform(m.a,0,0,m.d,m.e-left,m.f-top);
        for(const name of states)if(ctx[name]!==undefined)c[name]=ctx[name];
        c.setLineDash?.(dash);c.shadowColor=ctx.shadowColor;
        draw(c);
        while(items.size>=entries||used+size>bytes)remove(items.keys().next().value);
        saved={key,image,bytes:size};items.set(building,saved);used+=size;
      }else{items.delete(building);items.set(building,saved);}
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if('filter' in ctx)ctx.filter='none';ctx.shadowColor='rgba(0,0,0,0)';ctx.drawImage(saved.image,left,top);ctx.restore();
      return true;
    }
    return Object.freeze({paint,clear(){items.clear();pending=new WeakMap();used=0;},stats:()=>({bytes:used,entries:items.size,maxBytes:bytes,maxEntries:entries})});
  }
  const BUILDING_SHELL_CACHE155=createBuildingShellCache155();
  let BUILDING_SHELL_WORLD155;
  function drawCachedBuildingShell155(ctx,building,residential){
    const owner=globalThis.DEADWALL,art=owner?.art,interior=globalThis.DeadwallInteriorArt153,assets=globalThis.DeadwallAssets136;
    if(BUILDING_SHELL_WORLD155!==owner?.world){BUILDING_SHELL_CACHE155.clear();BUILDING_SHELL_WORLD155=owner?.world;}
    const images=Object.keys(interior?.ASSETS||{}).map(key=>art?.images?.[key]);
    BUILDING_SHELL_CACHE155.paint(ctx,building,c=>drawBuildingShell134(c||ctx,building,residential),[residential,owner?.world,owner?.world?.seed,art,interior,assets,art?.diagnostics?.ready?.length,...images,art?.images?.art138RoofMetal],ctx===owner?.ctx&&!owner.frontier?.active?.());
  }
  function drawHouse(ctx, house) { drawCachedBuildingShell155(ctx,house,true); }
  function drawSettlementBuilding(ctx, building) { drawCachedBuildingShell155(ctx,building,!!building.residential); }

  function drawStationLoot(ctx,node){ctx.save();ctx.translate(node.x,node.y);const ratio=node.maxAmount?clamp(node.amount/node.maxAmount,.2,1):1;ctx.globalAlpha=ratio;ctx.fillStyle=node.type==='fuel'?'#8c743f':node.type==='medicine'?'#6f9189':'#727e50';ctx.fillRect(-9,-7,18,14);ctx.strokeStyle='rgba(230,220,181,.35)';ctx.strokeRect(-9,-7,18,14);if(node.type==='medicine'){ctx.fillStyle='#c9d3ca';ctx.fillRect(-2,-5,4,10);ctx.fillRect(-5,-2,10,4);}ctx.restore();}

  function drawWreck(ctx, wreck, looted = wreck.looted) {
    ctx.save(); ctx.translate(wreck.x, wreck.y); ctx.rotate(wreck.angle || 0);
    const w = wreck.size || 58, h = w * .48;
    ctx.fillStyle = 'rgba(0,0,0,.30)'; ctx.beginPath(); ctx.ellipse(4, h * .45, w * .5, h * .42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = wreck.kind === 'van' ? '#555b58' : '#5d5b52'; ctx.fillRect(-w * .46, -h * .42, w * .92, h * .84);
    ctx.fillStyle = '#262d2d'; ctx.fillRect(-w * .2, -h * .34, w * .42, h * .68);
    ctx.fillStyle = '#181d1c'; ctx.fillRect(-w * .5, -h * .34, w * .1, h * .22); ctx.fillRect(-w * .5, h * .12, w * .1, h * .22); ctx.fillRect(w * .4, -h * .34, w * .1, h * .22); ctx.fillRect(w * .4, h * .12, w * .1, h * .22);
    if (looted) {
      ctx.fillStyle = '#171d1a'; ctx.fillRect(-w * .43, -h * .28, w * .19, h * .56);
      ctx.strokeStyle = '#8b8269'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-w * .43, -h * .32); ctx.lineTo(-w * .62, -h * .62); ctx.lineTo(-w * .31, -h * .56); ctx.stroke();
      ctx.fillStyle = 'rgba(203,180,111,.18)'; ctx.fillRect(-w * .41, -h * .24, w * .14, h * .48);
    }
    ctx.restore();
  }

  function drawRoadProp(ctx, prop) {
    const owner=globalThis.DEADWALL, seed=owner?.world?.seed||0;
    if(globalThis.DeadwallWorldPropsArt153?.drawRoadProp(ctx,owner?.art,prop,{seed}))return;
    if(prop.kind==='debris'&&globalThis.DeadwallNatureArt153?.drawSprite(ctx,owner?.art,'rubble',prop.id??(prop.x+':'+prop.y),prop.x,prop.y,28,20,{seed,angle:prop.angle||0}))return;
    ctx.save(); ctx.translate(prop.x, prop.y); ctx.rotate(prop.angle || 0);
    if (prop.kind === 'cone') { ctx.fillStyle = '#c46f3e'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-7, 8); ctx.lineTo(7, 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d8c89a'; ctx.fillRect(-5, 1, 10, 3); }
    else if (prop.kind === 'roadSign') { ctx.strokeStyle = '#6f746e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, 20); ctx.stroke(); ctx.fillStyle = '#666d68'; ctx.fillRect(-10, -8, 20, 14); }
    else if (prop.kind === 'barrier') { ctx.fillStyle = '#7e765d'; ctx.fillRect(-18, -4, 36, 8); ctx.fillStyle = '#b67d47'; for (let x = -15; x < 15; x += 12) ctx.fillRect(x, -4, 6, 8); }
    else if (prop.kind === 'bollard') { ctx.fillStyle='#8b623d';ctx.fillRect(-3,-9,6,18);ctx.fillStyle='#d0c294';ctx.fillRect(-3,-2,6,3); }
    else if (prop.kind === 'tirePile') { ctx.strokeStyle = '#222827'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-5, 0, 7, 0, Math.PI * 2); ctx.arc(6, 3, 7, 0, Math.PI * 2); ctx.stroke(); }
    else if (prop.kind === 'luggage') { ctx.fillStyle = '#5f4b38'; ctx.fillRect(-9, -6, 18, 12); ctx.strokeStyle = '#8a7552'; ctx.strokeRect(-9, -6, 18, 12); }
    else if(prop.kind==='shoppingCart'){ctx.strokeStyle='#737b76';ctx.lineWidth=2;ctx.strokeRect(-12,-7,22,13);ctx.beginPath();ctx.arc(-7,9,3,0,Math.PI*2);ctx.arc(7,9,3,0,Math.PI*2);ctx.stroke();}
    else if(prop.kind==='pallet'){ctx.fillStyle='#68523a';for(let y=-7;y<=7;y+=7)ctx.fillRect(-13,y,26,4);}
    else if(prop.kind==='toolbox'){ctx.fillStyle='#71463b';ctx.fillRect(-10,-6,20,12);ctx.strokeStyle='#a98466';ctx.strokeRect(-10,-6,20,12);}
    else if(prop.kind==='crate'){ctx.fillStyle='#67523a';ctx.fillRect(-10,-9,20,18);ctx.strokeStyle='#927650';ctx.strokeRect(-10,-9,20,18);}
    else if(prop.kind==='tarp'){ctx.fillStyle='rgba(67,86,72,.75)';ctx.beginPath();ctx.moveTo(-13,-7);ctx.lineTo(12,-5);ctx.lineTo(9,9);ctx.lineTo(-10,7);ctx.closePath();ctx.fill();}
    else { ctx.fillStyle = '#565a55'; ctx.fillRect(-12, -5, 11, 8); ctx.fillRect(3, 0, 9, 6); }
    ctx.restore();
  }

  function sceneryDepth(node) { return node.y + Math.max(8, (node.renderSize || node.radius * 2) * .22); }
  function isVehicleNode(node) { return Boolean(node && node.sceneryKind && VEHICLE_KINDS.has(node.sceneryKind)); }


  function isGeneration4(game) {
    if (!game || game.state !== 'playing') return false;
    return game.exploration125?.generation === 4 || typeof game.runId === 'string' && game.runId.includes(GENERATION_MARKER);
  }

  function runtimeLootNode(spec, amount = spec.amount) {
    const node={id:spec.id,type:spec.type,x:spec.x,y:spec.y,amount:Math.max(0,amount),maxAmount:spec.amount,radius:spec.radius,variant:spec.id%4,depleted:amount<=.01,flash:0,__exploration125Loot:true,stationId:spec.stationId};
    node.harvest=function harvest(value){if(this.depleted)return 0;const taken=Math.min(this.amount,value);this.amount-=taken;this.flash=.14;if(this.amount<=.01){this.amount=0;this.depleted=true;}return taken;};
    return node;
  }

  function removeRuntimeLoot(game){if(game?.world?.nodes)game.world.nodes=game.world.nodes.filter(node=>!node.__exploration125Loot);}

  function clearNaturalRoadResources(game, plan, protectedBoxes) {
    const roads=[...(plan.roads||[]),...(plan.settlements||[]).flatMap(s=>[s.street,s.connector].filter(Boolean))];
    const field=game.fieldcraft,fixtures=[...[...game.world.buildings.values()].filter(b=>!b.dead),...(C?.Expeditions?.SITES||[]).map(p=>({...p,renderSize:90})),...(game.dayworks?.snapshot().sites||[]).map(p=>({...p,renderSize:50})),...(game.world.sites||[]).map(p=>({...p,renderSize:96}))];
    const forecourts=plan.stations.map(s=>{
      const depth=128,margin=24;
      if(s.facing==='north')return rect(s.x-s.w/2-margin,s.door.y-depth,s.w+margin*2,depth,'forecourt');
      if(s.facing==='south')return rect(s.x-s.w/2-margin,s.door.y,s.w+margin*2,depth,'forecourt');
      if(s.facing==='west')return rect(s.door.x-depth,s.y-s.h/2-margin,depth,s.h+margin*2,'forecourt');
      return rect(s.door.x,s.y-s.h/2-margin,depth,s.h+margin*2,'forecourt');
    });
    const onAccess=(x,y,r)=>roads.some(road=>roadContains(road,x,y,r))||forecourts.some(box=>circleIntersectsRect(x,y,r,box));
    for(const node of game.world.nodes){
      if(node.sceneryKind!=='burntTree'&&(node.sceneryKind||!['wood','stone'].includes(node.type)))continue;
      const radius=Math.max(node.radius*1.86,(node.renderSize||0)*.56);
      if(!onAccess(node.x,node.y,radius))continue;
      const origin={x:node.x,y:node.y};let target=null;
      // Include exhausted nodes: harvesting must never reshuffle the remaining deposits on reload.
      for(let ring=1;ring<=24&&!target;ring++)for(let direction=0;direction<24;direction++){
        const a=(direction+(node.id%24)/24)*Math.PI/12,x=Math.round((origin.x+Math.cos(a)*ring*32)*100)/100,y=Math.round((origin.y+Math.sin(a)*ring*32)*100)/100;
        if(x<38+radius||y<38+radius||x>plan.worldSize-38-radius||y>plan.worldSize-38-radius||Math.hypot(x-plan.worldSize/2,y-plan.worldSize/2)<270||onAccess(x,y,radius))continue;
        if(protectedBoxes.some(box=>circleIntersectsRect(x,y,radius,box)))continue;
        const box=(field?.reserveRect||field?.rect)?.({...node,x,y});
        if(box?[...game.world.nodes,...fixtures].some(other=>other!==node&&field.overlap(box,(field.reserveRect||field.rect)(other),3)):game.world.nodes.some(other=>other!==node&&Math.hypot(x-other.x,y-other.y)<(node.radius+other.radius)*2))continue;
        target={x,y};break;
      }
      if(target){node.x=target.x;node.y=target.y;node.__exploration125RoadRelocated=!node.depleted;}
    }
  }

  function spaceTerrainResources133(game,plan,protectedBoxes,savedAmounts) {
    if(plan.layoutRevision!==3||game.world.__terrain133Prepared)return;
    // Saved fieldcraft coordinates are authoritative. Repacking against buildings
    // erected since departure would move exhausted IDs and then their neighbours.
    if(savedAmounts instanceof Map){game.world.__terrain133Prepared=true;return;}
    const rules=C?.TerrainRules133||{}, inner=rules.innerRadius??850, spacing=rules.resourceSpacing??70, retained=rules.resourceRetention??.62;
    const center=plan.worldSize/2, natural=game.world.nodes.filter(n=>!n.sceneryKind&&!n.__exploration125Loot), starters=new Set();
    for(const type of ['wood','scrap','stone','food','fuel']){
      const closest=natural.filter(n=>n.type===type).sort((a,b)=>Math.hypot(a.x-center,a.y-center)-Math.hypot(b.x-center,b.y-center)||a.id-b.id);
      for(const n of closest.slice(0,rules.starterPerType??2))starters.add(n.id);
    }
    // Only brand-new campaigns have fewer deposits. Restored quantities always
    // remain authoritative; exhausted IDs remain in the save and never regenerate.
    if(!(savedAmounts instanceof Map))for(const node of natural){
      if(starters.has(node.id))continue;
      if(mulberry32((plan.seed^Math.imul(node.id,0x45d9f3b)^0x1335EAED)>>>0)()>retained){node.amount=0;node.depleted=true;node.__terrain133Thinned=true;delete node.__exploration125RoadRelocated;}
    }
    const field=game.fieldcraft, roads=[...plan.roads,...plan.settlements.flatMap(s=>[s.street,s.connector].filter(Boolean))],placed=[];
    const fixtures=[...[...game.world.buildings.values()].filter(b=>!b.dead),...(C?.Expeditions?.SITES||[]).map(p=>({...p,renderSize:90})),...(game.dayworks?.snapshot().sites||[]).map(p=>({...p,renderSize:50})),...(game.world.sites||[]).map(p=>({...p,renderSize:96})),...game.world.nodes.filter(n=>n.sceneryKind||n.__exploration125Loot)];
    const fits=(n,x,y)=>{
      const r=n.radius*1.86+(rules.roadCanopyMargin??12), starter=starters.has(n.id), distance=Math.hypot(x-center,y-center);
      if(x<r+40||y<r+40||x>plan.worldSize-r-40||y>plan.worldSize-r-40||distance<270||(!starter&&distance<inner)||roads.some(road=>roadContains(road,x,y,r)))return false;
      if(protectedBoxes.some(box=>circleIntersectsRect(x,y,r,box))||plan.buildExclusions.some(box=>circleIntersectsRect(x,y,r,box)))return false;
      if(placed.some(other=>Math.hypot(x-other.x,y-other.y)<Math.max(spacing,n.radius+other.radius+24)))return false;
      const box=(field?.reserveRect||field?.rect)?.({...n,x,y});if(box&&placed.some(other=>field.overlap(box,(field.reserveRect||field.rect)(other),12)))return false;return !fixtures.some(other=>box?field.overlap(box,(field.reserveRect||field.rect)(other),12):Math.hypot(x-other.x,y-other.y)<r+(other.radius||40));
    };
    // Treat every ID, including exhausted deposits, in the same order. A reload
    // cannot move neighbouring deposits because one of them has been harvested.
    for(const node of [...natural].sort((a,b)=>Number(starters.has(b.id))-Number(starters.has(a.id))||a.id-b.id)){
      if(!fits(node,node.x,node.y)){
        const origin={x:node.x,y:node.y};let found=false;
        for(let ring=1;ring<=90&&!found;ring++)for(let direction=0;direction<32;direction++){
          const a=(direction+(node.id%17)/17)*Math.PI/16,x=Math.round((origin.x+Math.cos(a)*ring*32)*100)/100,y=Math.round((origin.y+Math.sin(a)*ring*32)*100)/100;
          if(!fits(node,x,y))continue;if(!node.depleted&&roads.some(road=>roadContains(road,node.x,node.y,node.radius*1.86)))node.__exploration125RoadRelocated=true;node.x=x;node.y=y;found=true;break;
        }
      }
      placed.push(node);
    }
    game.world.__terrain133Prepared=true;
  }

  function drawTerrainDecor133(ctx,prop) {
    const owner=globalThis.DEADWALL,seed=owner?.world?.seed||0;
    if(globalThis.DeadwallWorldPropsArt153?.drawTerrainDecor(ctx,owner?.art,prop,{seed}))return;
    const family=prop.kind==='grass'?'grass':prop.kind==='stump'?'stump':null;
    if(family&&globalThis.DeadwallNatureArt153?.drawSprite(ctx,owner?.art,family,prop.id??(prop.x+':'+prop.y),prop.x,prop.y,prop.kind==='stump'?18:24,prop.kind==='stump'?14:20,{seed,angle:prop.angle||0}))return;
    if(prop.kind==='bench'){
      ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate(prop.angle||0);
      const painted=globalThis.DeadwallInteriorArt153?.drawFurniture(ctx,owner?.art,{...prop,id:prop.id??(prop.x+':'+prop.y),x:-21,y:-7,w:42,h:20},{seed,alignLongAxis:true});
      ctx.restore();if(painted)return;
    }
    ctx.save();ctx.translate(prop.x,prop.y);ctx.rotate(prop.angle);ctx.lineWidth=2;
    if(prop.kind==='manhole'){ctx.fillStyle='#353b37';ctx.strokeStyle='#77776a';ctx.beginPath();ctx.ellipse(0,0,10,8,0,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=-5;i<8;i+=5){ctx.beginPath();ctx.moveTo(i,-5);ctx.lineTo(i,5);ctx.stroke();}}
    else if(prop.kind==='drain'){ctx.fillStyle='#242b27';ctx.fillRect(-11,-5,22,10);ctx.strokeStyle='#646a60';for(let x=-8;x<=8;x+=4){ctx.beginPath();ctx.moveTo(x,-5);ctx.lineTo(x,5);ctx.stroke();}}
    else if(prop.kind==='crack'){ctx.strokeStyle='rgba(8,14,10,.6)';ctx.beginPath();ctx.moveTo(-16,-6);ctx.lineTo(-5,-3);ctx.lineTo(0,4);ctx.lineTo(7,1);ctx.lineTo(15,7);ctx.stroke();}
    else if(prop.kind==='grass'){ctx.strokeStyle='#4f5a3d';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*4,4);ctx.lineTo(i*5-2,-4-Math.abs(i)*3);ctx.stroke();}}
    else if(prop.kind==='stump'){ctx.fillStyle='#5b4730';ctx.beginPath();ctx.ellipse(0,0,9,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8c7750';ctx.beginPath();ctx.ellipse(0,-2,6,4,0,0,Math.PI*2);ctx.stroke();}
    else if(prop.kind==='marker'){ctx.fillStyle='#797969';ctx.fillRect(-3,-7,6,14);ctx.fillStyle='#bc9a60';ctx.fillRect(-3,-7,6,4);}
    else if(prop.kind==='bench'){ctx.fillStyle='#43473d';ctx.fillRect(-17,-7,3,20);ctx.fillRect(14,-7,3,20);ctx.fillStyle='#6d5940';ctx.fillRect(-21,-5,42,5);ctx.fillRect(-21,2,42,5);}
    else {ctx.fillStyle='#a49c80';ctx.fillRect(-9,-3,7,5);ctx.fillStyle='#605e51';ctx.fillRect(3,1,8,3);}
    ctx.restore();
  }

  function ensureRuntimeLoot(game, plan, savedAmounts = null) {
    if (!game?.world?.nodes) return;
    removeRuntimeLoot(game);
    if (!isGeneration4(game)) return;
    const amounts=savedAmounts instanceof Map?savedAmounts:new Map();
    for(const spec of plan.stationLoot||[]){const amount=amounts.has(spec.id)?amounts.get(spec.id):spec.amount;game.world.nodes.push(runtimeLootNode(spec,amount));}
    const protectedBoxes=[...(plan.solids||[])].filter(box=>['settlement-building','house','station-wall','station-furniture','terrain-prop'].includes(box.kind));
    for(const station of plan.stations)protectedBoxes.push(rect(station.x-station.w/2-12,station.y-station.h/2-12,station.w+24,station.h+24,'station-floor'));
    spaceTerrainResources133(game,plan,protectedBoxes,savedAmounts);
    clearNaturalRoadResources(game,plan,protectedBoxes);
    for(const node of game.world.nodes){if(node.__exploration125Loot||node.depleted)continue;if(protectedBoxes.some(box=>circleIntersectsRect(node.x,node.y,Math.max(5,node.radius*.5),box))){node.amount=0;node.depleted=true;node.__exploration125Covered=true;}}
  }

  function surfaceAt(plan,x,y,weather=0){
    if((plan.stations||[]).some(st=>Math.abs(x-st.x)<=st.w/2&&Math.abs(y-st.y)<=st.h/2))return {id:'concrete',label:'béton',multiplier:1};
    for(const road of plan.roads||[])if(roadContains(road,x,y,-4)){if(road.surface==='dirt')return{id:'dirt',label:'chemin de terre',multiplier:weather>.62?.78:.94};if(road.surface==='gravel')return{id:'gravel',label:'chemin empierré',multiplier:.98};if(road.surface==='concrete')return{id:'concrete',label:'accès béton',multiplier:1};return {id:'asphalt',label:road.lanes===1?'desserte locale':`asphalte ${road.lanes||2} voies`,multiplier:1.05};}
    if((plan.settlements||[]).some(st=>[st.street,st.connector].filter(Boolean).some(local=>pointSegmentDistance(x,y,local.x1,local.y1,local.x2,local.y2)<=local.width/2)))return {id:'street',label:'voie locale',multiplier:.98};
    if((plan.backyards||[]).some(yard=>Math.abs(x-yard.x)<=yard.w/2&&Math.abs(y-yard.y)<=yard.h/2))return {id:'yard',label:'terre de cour',multiplier:.9};
    if(weather>.62)return {id:'mud',label:'terre détrempée',multiplier:.78};
    return {id:'ground',label:'terrain irrégulier',multiplier:.92};
  }

  function postureMultiplier(posture){return posture==='prone'?.38:posture==='crouch'?.68:1;}

  function drawLootedNode(game, ctx, node) {
    const angle = (node.id % 7 - 3) * .045, size = node.renderSize || 96;
    ctx.save(); ctx.translate(node.x, node.y); ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(5, size * .18, size * .46, size * .18, 0, 0, Math.PI * 2); ctx.fill();
    if (node.sceneryKind === 'tanker') {
      ctx.fillStyle = '#535b57'; ctx.fillRect(-size * .44, -size * .17, size * .28, size * .34);
      ctx.fillStyle = '#62655f'; ctx.beginPath(); ctx.ellipse(size * .10, 0, size * .34, size * .20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a38c58'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(size * .40, -size * .15); ctx.lineTo(size * .57, -size * .35); ctx.lineTo(size * .48, -size * .02); ctx.stroke();
      ctx.fillStyle = '#171c19'; ctx.fillRect(size * .36, -size * .12, size * .10, size * .24);
    } else if (node.sceneryKind === 'bus') {
      ctx.fillStyle = '#555d59'; ctx.fillRect(-size * .48, -size * .19, size * .96, size * .38);
      ctx.fillStyle = '#242b2a'; for (let i = -3; i <= 2; i++) ctx.fillRect(i * size * .12, -size * .13, size * .085, size * .10);
      ctx.fillStyle = '#161b19'; ctx.fillRect(-size * .47, -size * .13, size * .13, size * .26);
      ctx.strokeStyle = '#978b6a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-size * .47, -size * .15); ctx.lineTo(-size * .62, -size * .36); ctx.moveTo(-size * .47, size * .15); ctx.lineTo(-size * .62, size * .36); ctx.stroke();
    } else if (node.sceneryKind === 'ambulance') {
      ctx.fillStyle = '#69716d'; ctx.fillRect(-size * .42, -size * .22, size * .84, size * .44);
      ctx.fillStyle = '#9a4f47'; ctx.fillRect(-size * .03, -size * .19, size * .06, size * .38); ctx.fillRect(-size * .13, -size * .05, size * .26, size * .10);
      ctx.fillStyle = '#171c1a'; ctx.fillRect(-size * .41, -size * .16, size * .18, size * .32);
      ctx.strokeStyle = '#a8a28d'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-size * .41, -size * .17); ctx.lineTo(-size * .60, -size * .38); ctx.moveTo(-size * .41, size * .17); ctx.lineTo(-size * .60, size * .38); ctx.stroke();
    } else {
      ctx.fillStyle = '#555c58'; ctx.fillRect(-size * .38, -size * .21, size * .76, size * .42);
      ctx.fillStyle = '#272e2c'; ctx.fillRect(size * .02, -size * .17, size * .26, size * .34);
      ctx.fillStyle = '#171c1a'; ctx.fillRect(-size * .37, -size * .16, size * .20, size * .32);
      ctx.strokeStyle = '#91856a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-size * .37, -size * .18); ctx.lineTo(-size * .57, -size * .39); ctx.lineTo(-size * .25, -size * .34); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(214,190,118,.16)'; ctx.fillRect(-size * .34, -size * .10, size * .12, size * .20);
    ctx.restore();
  }

  function patchWorldPlacement(game, plan) {
    const world = game.world;
    if (!world || world.__exploration125PlacementInstalled) return;
    world.__exploration125PlacementInstalled = true;
    const basePlacement = world.placement.bind(world), baseSolid=world.solidForFriendly?.bind(world), baseCost=world.movementCost?.bind(world), tile = C?.TILE || 32;
    world.placement = function placement125(def, gx, gy, rotation = 0, ignoreId = 0) {
      const result = basePlacement(def, gx, gy, rotation, ignoreId);
      if (!result.valid || !isGeneration4(game)) return result;
      const footprint = buildingFootprint(def, gx, gy, rotation, tile);
      const overlaps = querySpatialIndexRect(planSpatial(plan).blockerIndex, footprint).length > 0;
      return overlaps ? { valid: false, reason: 'Décor, habitation ou accès à préserver' } : result;
    };
    if(baseSolid)world.solidForFriendly=function solidForFriendly125(x,y){
      const existing=baseSolid(x,y);if(existing||!isGeneration4(game))return existing;
      const boxes=querySpatialIndexCircle(planSpatial(plan).solidIndex,x,y,1.5);
      return boxes.length?{id:-125,type:'world125',dead:false,completed:true,def:{wall:true}}:null;
    };
    if(baseCost)world.movementCost=function movementCost125(gx,gy){
      const cost=baseCost(gx,gy);if(!isGeneration4(game))return cost;
      const cell={x:gx*tile,y:gy*tile,w:tile,h:tile};
      if(querySpatialIndexRect(planSpatial(plan).solidIndex,cell).length)return Math.max(cost,1200);
      return cost;
    };
  }

  function installPlanSync(game, plan) {
    const sync = (savedAmounts=null) => {
      const seed = Number(game.world?.seed) || 0;
      const revision=[2,3].includes(game.exploration125?.layoutRevision)?game.exploration125.layoutRevision:1;
      if (plan.seed !== seed || plan.layoutRevision !== revision) {
        const fresh = createFeaturePlan(seed, plan.worldSize, revision);
        for(const key of Object.keys(plan))if(!(key in fresh))delete plan[key];
        Object.assign(plan, fresh);
      }
      patchWorldPlacement(game, plan);
      ensureRuntimeLoot(game,plan,savedAmounts);
      game.exploration125?.refreshCodex?.();
      if(game.world&&isGeneration4(game)){game.world.flowDirty=true;game.world.navigationVersion=(game.world.navigationVersion||0)+1;if(Number.isFinite(game.flowTimer))game.flowTimer=0;}
      return plan;
    };
    if(game.state!=='playing')sync();
    if (!game.__exploration125PlanSyncInstalled) {
      game.__exploration125PlanSyncInstalled = true;
      if(typeof game.startNew==='function'){
        const baseStart=game.startNew.bind(game);
        game.startNew=function startNew125(...args){const result=baseStart(...args);if(result===false)return result;if(this.state==='playing'){
          this.exploration125.layoutRevision=3;
          if(!this.worldEvolution?.enableWorld4?.())throw Error('La génération 4 régionale n’a pas pu être activée.');
          if(typeof this.runId==='string'&&!this.runId.includes(GENERATION_MARKER))this.runId+=GENERATION_MARKER;
          this.exploration125.generation=4;this.exploration125.layoutRevision=3;this.d17RegionOffset={x:0,y:0};if(this.player)this.player.posture='stand';this.exploration125.wildNext=0;this.exploration125.wildHordes=0;delete this.world.__terrain133Prepared;sync();this.save?.(false);
        }return result;};
      }
      if(typeof game.restoreSave==='function'){
        const baseRestore=game.restoreSave.bind(game);
        game.restoreSave=function restoreSave125(input,...rest){const savedAmounts=new Map(Array.isArray(input?.nodes)?input.nodes:[]),result=baseRestore(input,...rest);applyExplorationState(this,input?.exploration125);sync(savedAmounts);return result;};
      }
    }
    return sync;
  }

  function installCollision(game, plan) {
    if (game.__exploration125CollisionInstalled) return;
    game.__exploration125CollisionInstalled = true;
    const baseFriendly = game.friendlyPositionClear.bind(game);
    const baseHostile = game.hostilePositionClear.bind(game);
    const extensionClear = (entity, x, y) => {
      if(!isGeneration4(game))return true;
      const radius = Math.max(5, (entity.radius || 10) * .78);
      return querySpatialIndexCircle(planSpatial(plan).solidIndex,x,y,radius).length===0;
    };
    game.friendlyPositionClear = function patchedFriendly(entity, x, y) { return baseFriendly(entity, x, y) && extensionClear(entity, x, y); };
    game.hostilePositionClear = function patchedHostile(entity, x, y) { return baseHostile(entity, x, y) && extensionClear(entity, x, y); };
    const baseLine=game.hostileLineClear?.bind(game),baseSight=game.hasLineOfSight?.bind(game);
    if(baseLine)game.hostileLineClear=function(from,to,barriersOnly=true,...rest){return baseLine(from,to,barriersOnly,...rest)&&(!isGeneration4(this)||!firstObstruction134(plan,from,to,0,barriersOnly));};
    if(baseSight)game.hasLineOfSight=function(from,to,...rest){return baseSight(from,to,...rest)&&(!isGeneration4(this)||!firstObstruction134(plan,from,to,0,true));};

  }

  function installDepthRender(game, plan) {
    if (game.__exploration125RenderInstalled) return;
    game.__exploration125RenderInstalled = true;
    const baseGround = game.drawGround.bind(game);
    const baseEntries = game.depthEntries.bind(game);
    const baseBuilding = game.drawBuilding.bind(game);
    const baseNode = game.drawNode.bind(game);
    const inHome = view => isGeneration4(game) && (!game.frontier?.active() || view?.homeProjection===true);
    game.drawGround = function drawGround125(ctx, view) {
      baseGround(ctx, view);
      if (!inHome(view)) return;
      drawRoadNetwork(ctx, plan, view);
      for(const prop of plan.decor||[])if(!['bench','marker','stump'].includes(prop.kind)&&this.visible(prop.x,prop.y,28,view))drawTerrainDecor133(ctx,prop);
      for (const station of plan.stations) if (this.visible(station.x, station.y, Math.max(station.w, station.h), view)) drawStationFloor(ctx, station);
      for (const yard of plan.backyards) if (this.visible(yard.x, yard.y, Math.max(yard.w, yard.h), view)) drawBackyardFloor(ctx, yard);
    };
    game.drawNode = function drawNode125(ctx, node) {
      return node.__exploration125Loot ? drawStationLoot(ctx, node) : baseNode(ctx, node);
    };
    game.drawBuilding = function drawBuilding125(ctx, building) {
      return building.__exploration125Draw ? building.__exploration125Draw(ctx) : baseBuilding(ctx, building);
    };
    game.depthEntries = function depthEntries125(view) {
      const entries = baseEntries(view);
      if (!inHome(view)) return entries;
      let order = entries.length;
      const add = (x, y, radius, depth, draw) => {
        if (!this.visible(x, y, radius, view)) return;
        entries.push({kind:1,entity:{x,y,id:-125,dead:false,__exploration125Draw:draw},depth,id:-125,order:order++});
      };
      for (const station of plan.stations) {
        for (const wall of station.solids) add(wall.x+wall.w/2,wall.y+wall.h/2,Math.max(wall.w,wall.h),wall.y+wall.h,ctx=>drawStationWall(ctx,wall));
        for (const item of stationFurniture(station)) add(item.x,item.y,Math.max(item.w,item.h),item.y+item.h/2,ctx=>drawStationFurniture(ctx,item));
      }
      for (const yard of plan.backyards) {
        for (const wall of yard.solids.filter(box=>box.kind==='palisade')) add(wall.x+wall.w/2,wall.y+wall.h/2,Math.max(wall.w,wall.h),wall.y+wall.h,ctx=>drawPalisade(ctx,wall));
        add(yard.house.x,yard.house.y,Math.max(yard.house.w,yard.house.h),yard.house.y+yard.house.h/2,ctx=>drawHouse(ctx,yard.house));
        for (const prop of yard.props) add(prop.x,prop.y,prop.size,prop.y+prop.size*.35,ctx=>drawYardProp(ctx,prop));
      }
      for (const settlement of plan.settlements||[]) for (const building of settlement.buildings)
        add(building.x,building.y,Math.max(building.w,building.h),building.y+building.h/2,ctx=>drawSettlementBuilding(ctx,building));
      for (const wreck of plan.wrecks) {const box=orientedSolid134(wreck.x,wreck.y,wreck.size*.92,wreck.size*.48*.84,wreck.angle||0);add(wreck.x,wreck.y,wreck.size,box.y+box.h,ctx=>drawWreck(ctx,wreck));}
      for (const prop of plan.roadProps) add(prop.x,prop.y,36,prop.y+10,ctx=>drawRoadProp(ctx,prop));
      for (const prop of plan.decor||[])if(['bench','marker','stump'].includes(prop.kind))add(prop.x,prop.y,30,prop.y+(prop.kind==='bench'?13:8),ctx=>drawTerrainDecor133(ctx,prop));
      for (const node of this.world.nodes) if (node.depleted && isVehicleNode(node))
        add(node.x,node.y,Math.max(node.radius+20,(node.renderSize||0)/2+10),sceneryDepth(node),ctx=>drawLootedNode(this,ctx,node));
      entries.sort((a,b)=>a.depth-b.depth||a.kind-b.kind||a.id-b.id||a.order-b.order);
      return entries;
    };
  }

  function drawMiniRoads(ctx, plan, sx, sy, options={}) {
    const paper=!!options.paper;
    ctx.save();ctx.fillStyle=paper?'#8b8c7a':'#465149';
    for (const road of plan.roads) {
      if (road.axis === 'h') ctx.fillRect(0, (road.y-road.width/2)*sy, plan.worldSize*sx, road.width*sy);
      else if (road.axis === 'v') ctx.fillRect((road.x-road.width/2)*sx, 0, road.width*sx, plan.worldSize*sy);
      else {ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=road.width*(sx+sy)/2;ctx.beginPath();ctx.moveTo(road.x1*sx,road.y1*sy);ctx.lineTo(road.x2*sx,road.y2*sy);ctx.stroke();}
    }
    ctx.strokeStyle=paper?'#969784':'#465149';
    for(const settlement of plan.settlements||[])for(const local of [settlement.street,settlement.connector].filter(Boolean)){
      ctx.lineWidth=local.width*(sx+sy)/2;ctx.beginPath();ctx.moveTo(local.x1*sx,local.y1*sy);ctx.lineTo(local.x2*sx,local.y2*sy);ctx.stroke();
    }
    ctx.fillStyle=paper?'#b0aa83':'#655e46';
    for(const station of plan.stations)ctx.fillRect((station.x-station.w/2)*sx,(station.y-station.h/2)*sy,station.w*sx,station.h*sy);
    ctx.fillStyle=paper?'#b3b397':'#35432d';
    for(const yard of plan.backyards)ctx.fillRect((yard.x-yard.w/2)*sx,(yard.y-yard.h/2)*sy,yard.w*sx,yard.h*sy);
    ctx.fillStyle=paper?'#736c59':'#97836a';
    for(const yard of plan.backyards){const h=yard.house;ctx.fillRect((h.x-h.w/2)*sx,(h.y-h.h/2)*sy,h.w*sx,h.h*sy);}
    for(const settlement of plan.settlements||[])for(const b of settlement.buildings)ctx.fillRect((b.x-b.w/2)*sx,(b.y-b.h/2)*sy,b.w*sx,b.h*sy);
    ctx.fillStyle=paper?'#625f4d':'#8c8f75';
    for(const station of plan.stations)for(const wall of station.solids)ctx.fillRect(wall.x*sx,wall.y*sy,Math.max(.35,wall.w*sx),Math.max(.35,wall.h*sy));
    ctx.fillStyle=paper?'#776b55':'#7f7863';
    for(const yard of plan.backyards)for(const wall of yard.solids)if(wall.kind==='palisade')ctx.fillRect(wall.x*sx,wall.y*sy,Math.max(.35,wall.w*sx),Math.max(.35,wall.h*sy));
    for(const wreck of plan.wrecks){ctx.save();ctx.translate(wreck.x*sx,wreck.y*sy);ctx.rotate(wreck.angle);ctx.fillRect(-wreck.size*sx*.45,-wreck.size*sy*.24,wreck.size*sx*.9,wreck.size*sy*.48);ctx.restore();}
    ctx.restore();
  }

  function drawMapResources(ctx, game, sx, sy, paper=false) {
    ctx.save();ctx.globalAlpha=paper?.36:.6;
    for(const node of game.world?.nodes||[]){
      if(node.depleted)continue;
      ctx.fillStyle=node.type==='wood'?(paper?'#607558':'#4d6746'):node.type==='stone'?'#a2a18e':node.type==='scrap'?'#8c8774':node.type==='fuel'?'#a58c54':'#849464';
      const size=Math.max(.6,node.radius*(sx+sy)/2);ctx.fillRect(node.x*sx-size/2,node.y*sy-size/2,size,size);
    }
    ctx.restore();
  }

  function drawMapBuildings(ctx, game, sx, sy, paper=false) {
    for(const b of game.world?.buildings.values()||[]){if(b.dead||b.health<=0)continue;ctx.fillStyle=b.type==='core'?'#d2a84a':b.completed?(paper?'#667262':b.def.defense?'#abb6a4':'#8c9b81'):'#bd9768';ctx.fillRect(b.left*sx,b.top*sy,Math.max(.65,b.w*C.TILE*sx),Math.max(.65,b.h*C.TILE*sy));}
  }

  function installMinimap(game, plan, document) {
    const baseMinimap=game.renderMinimap.bind(game);
    game.renderMinimap = function renderMinimap125() {
      if (!isGeneration4(this) || this.frontier?.active()) return baseMinimap();
      if (this.state !== 'playing') return;
      const ctx = this.mctx, w = this.minimap.width, h = this.minimap.height, sx = w / plan.worldSize, sy = h / plan.worldSize;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#121814'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) { const x = i / 8 * w, y = i / 8 * h; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      drawMapResources(ctx,this,sx,sy);
      drawMiniRoads(ctx, plan, sx, sy);
      ctx.save();ctx.scale(sx,sy);this.infrastructure?.drawRoads(ctx,{left:0,top:0,right:plan.worldSize,bottom:plan.worldSize});ctx.restore();
      drawMapBuildings(ctx,this,sx,sy);
      this.contentUI?.drawMinimap(ctx, sx, sy);
      ctx.fillStyle = '#b64f45'; const vision = this.visibility?.frame?.(), step = this.zombies.length > 400 ? 2 : 1; for (let i = 0; i < this.zombies.length; i += step) { const z = this.zombies[i]; if (vision?.canSeeLocal(z)) ctx.fillRect(z.x * sx, z.y * sy, 1.5, 1.5); }
      ctx.fillStyle = '#85a975'; for (const u of this.units) if (!u.dead) ctx.fillRect(u.x * sx - 1, u.y * sy - 1, 2, 2);
      ctx.fillStyle = '#f2d16d'; ctx.beginPath(); ctx.arc(this.player.x * sx, this.player.y * sy, 3, 0, Math.PI * 2); ctx.fill();
      const hw = this.width / this.camera.zoom / 2, hh = this.height / this.camera.zoom / 2; ctx.strokeStyle = 'rgba(255,255,255,.58)'; ctx.strokeRect((this.camera.x - hw) * sx, (this.camera.y - hh) * sy, hw * 2 * sx, hh * 2 * sy);
      const label = document.getElementById('minimapWrap')?.querySelector('.minimap-label'); if (label) label.textContent = 'D-17 · '+this.world.seed+' · M';
      ctx.save();ctx.fillStyle='#cfcab1';ctx.font='9px sans-serif';ctx.textAlign='left';ctx.fillText('CARTE '+this.world.seed,5,h-5);ctx.restore();
    };
    const wrap = document.getElementById('minimapWrap');
    if (wrap) { wrap.tabIndex = 0; wrap.setAttribute('role', 'button'); wrap.setAttribute('aria-label', 'Ouvrir la carte du secteur actuel'); }
  }

  function createOverlay(document, id, title, className) {
    const overlay = document.createElement('div'); overlay.id = id; overlay.className = `overlay deadwall125-overlay hidden ${className}`; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', `${id}-title`);
    const card = document.createElement('main'); card.className = 'deadwall125-card';
    const head = document.createElement('header'); head.className = 'deadwall125-head';
    const label = document.createElement('div'); label.innerHTML = `<small>CARNET DE TERRAIN // D-17</small><h2 id="${id}-title">${title}</h2>`;
    const close = document.createElement('button'); close.type = 'button'; close.className = 'deadwall125-close'; close.setAttribute('aria-label', 'Fermer'); close.textContent = '×';
    head.append(label, close); card.appendChild(head); overlay.appendChild(card); document.body.appendChild(overlay);
    return { overlay, card, close };
  }

  function drawRoadMap(game, plan, canvas) {
    const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, sx = w / plan.worldSize, sy = h / plan.worldSize, active=game.state!=='playing'||isGeneration4(game);
    ctx.fillStyle = '#d7cfb0'; ctx.fillRect(0, 0, w, h);
    const live=game.state==='playing'&&plan===game.exploration125?.plan;
    if(live)drawMapResources(ctx,game,sx,sy,true);
    ctx.strokeStyle = 'rgba(65,70,58,.10)'; ctx.lineWidth = 1; for (let i = 0; i <= 12; i++) { const x = i / 12 * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let i = 0; i <= 8; i++) { const y = i / 8 * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const roads=active?plan.roads:[{axis:'h',y:plan.worldSize/2,width:132,length:plan.worldSize,lanes:4},{axis:'v',x:plan.worldSize/2,width:132,length:plan.worldSize,lanes:4}];
    ctx.fillStyle = '#72776e'; for (const road of roads) { if (road.axis === 'h') ctx.fillRect(0, (road.y - road.width / 2) * sy, w, Math.max(4, road.width * sy)); else if(road.axis==='v') ctx.fillRect((road.x - road.width / 2) * sx, 0, Math.max(4, road.width * sx), h); else {ctx.strokeStyle='#72776e';ctx.lineWidth=Math.max(4,road.width*(sx+sy)/2);ctx.beginPath();ctx.moveTo(road.x1*sx,road.y1*sy);ctx.lineTo(road.x2*sx,road.y2*sy);ctx.stroke();} }
    ctx.strokeStyle = '#efe1a2'; ctx.lineWidth = 1.5; ctx.setLineDash([10, 7]); for (const road of roads) { ctx.beginPath(); if (road.axis === 'h') { ctx.moveTo(0, road.y * sy); ctx.lineTo(w, road.y * sy); } else if(road.axis==='v') { ctx.moveTo(road.x * sx, 0); ctx.lineTo(road.x * sx, h); } else {ctx.moveTo(road.x1*sx,road.y1*sy);ctx.lineTo(road.x2*sx,road.y2*sy);} ctx.stroke(); } ctx.setLineDash([]);
    if(active)drawMiniRoads(ctx,plan,sx,sy,{paper:true});
    if(live){drawMapBuildings(ctx,game,sx,sy,true);ctx.save();ctx.scale(sx,sy);game.infrastructure?.drawRoads(ctx,{left:0,top:0,right:plan.worldSize,bottom:plan.worldSize});ctx.restore();}
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    if(active){
      for (const [i, j] of plan.intersections.entries()) { ctx.fillStyle = j.kind==='angled'?'#8b7048':'#575c55'; ctx.beginPath(); ctx.arc(j.x * sx, j.y * sy, j.kind==='angled'?7:5, 0, Math.PI * 2); ctx.fill(); if (i === 4 && plan.layoutRevision!==3) { ctx.fillStyle = '#373b35'; ctx.fillText('D-17', j.x * sx, j.y * sy - 10); } }
      if(plan.layoutRevision===3){ctx.fillStyle='#373b35';ctx.fillText('D-17',w/2,h/2-10);}
      ctx.strokeStyle='rgba(77,84,73,.55)';ctx.lineWidth=3;for(const settlement of plan.settlements||[])for(const local of [settlement.street,settlement.connector].filter(Boolean)){ctx.beginPath();ctx.moveTo(local.x1*sx,local.y1*sy);ctx.lineTo(local.x2*sx,local.y2*sy);ctx.stroke();}
      for (const station of plan.stations) { const x = station.x * sx, y = station.y * sy; ctx.fillStyle = '#9a6d43'; ctx.fillRect(x - 6, y - 6, 12, 12); ctx.fillStyle = '#4b4438'; ctx.fillText('ESSENCE', x, y - 11); }
      ctx.fillStyle='#4f654f';for(const settlement of plan.settlements||[]){ctx.beginPath();ctx.arc(settlement.x*sx,settlement.y*sy,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3f473e';ctx.fillText(settlement.name.toUpperCase(),settlement.x*sx,settlement.y*sy-13);ctx.fillStyle='#4f654f';}
      ctx.fillStyle = '#526451'; for (const site of live?game.world?.sites||[]:[]) { ctx.beginPath(); ctx.arc(site.x * sx, site.y * sy, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#5f5242'; for (const wreck of plan.wrecks) ctx.fillRect(wreck.x * sx - 2, wreck.y * sy - 2, 4, 4);
    }
    if(game.state==='playing'&&!game.frontier?.active()){ctx.fillStyle = '#b5443d'; ctx.beginPath(); ctx.arc(game.player.x * sx, game.player.y * sy, 5, 0, Math.PI * 2); ctx.fill();}
    ctx.strokeStyle='#806f50';ctx.lineWidth=2;ctx.setLineDash([9,7]);ctx.strokeRect(5,5,w-10,h-10);ctx.setLineDash([]);
    ctx.strokeStyle='rgba(83,67,45,.22)';ctx.lineWidth=2;for(const x of [w/3,w*2/3]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(const y of [h/2]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.fillStyle='#544b3d';ctx.font='11px sans-serif';ctx.fillText((active?'SORTIES CONTINUES SUR LES 4 FACES':'CAMPAGNE ANCIENNE · CARTE HISTORIQUE')+' · CARTE '+plan.seed,w/2,h-12);
  }

  function installOverlays(game, plan, document) {
    if (document.body.querySelectorAll('#deadwall125-map').length) return;
    const map = createOverlay(document, 'deadwall125-map', 'CARTE ROUTIÈRE D-17', 'deadwall125-map-overlay');
    const mapMeta = document.createElement('div'); mapMeta.className = 'deadwall125-map-meta';
    const mapCanvas = document.createElement('canvas'); mapCanvas.width = 960; mapCanvas.height = 620; mapCanvas.className = 'deadwall125-roadmap'; mapCanvas.setAttribute('aria-label', 'Carte routière du secteur D-17');
    const legend = document.createElement('div'); legend.className = 'deadwall125-legend'; legend.innerHTML = '<span><b class="legend-road"></b>routes et dessertes</span><span><b class="legend-station"></b>station-service</span><span><b class="legend-site"></b>village/secteur</span><span><b class="legend-wreck"></b>épave</span><span><kbd>M</kbd> fermer</span>';
    map.card.append(mapMeta, mapCanvas, legend);

    const inventory = createOverlay(document, 'deadwall125-inventory', 'ÉQUIPEMENT & SAC', 'deadwall125-inventory-overlay');
    const inventoryBody = document.createElement('div'); inventoryBody.className = 'deadwall125-inventory-body'; inventory.card.appendChild(inventoryBody);

    let active = null, wasPaused = null, mapPlanOverride=null, returnFocus=null;
    const nativeOverlays = () => [game.ui.settingsModal, game.ui.helpModal, game.ui.gameOver, game.ui.commandModal, game.ui.pauseMenu, game.ui.mainMenu].filter(Boolean);
    const syncNativeFocus = game.syncOverlayFocus.bind(game);
    game.syncOverlayFocus = function () {
      for (const item of [map, inventory]) item.overlay.inert = item !== active;
      if (!active) return syncNativeFocus();
      for (const overlay of nativeOverlays()) overlay.inert = true;
      game.ui.hud.inert = true;
      game.activeOverlay = active.overlay;
      game.cancelDemolition?.();
      game.releaseInputs?.();
      if (!active.overlay.contains(document.activeElement)) active.close.focus({ preventScroll: true });
    };
    const closeActive = () => {
      if (!active) return;
      active.overlay.classList.add('hidden'); active = null;
      if (wasPaused !== null && game.state === 'playing' && !game.gameOver) game.paused = wasPaused;
      wasPaused = null;mapPlanOverride=null;game.syncOverlayFocus();
      if (returnFocus && !returnFocus.closest?.('[inert], .hidden')) returnFocus.focus?.({preventScroll:true});
      returnFocus=null;
    };
    function open(which, options={}) {
      if(which===inventory&&game.loadoutUI){closeActive();game.loadoutUI.open();return;}
      if ((game.gameOver && game.state === 'playing') || (which === inventory && game.state !== 'playing')) return;
      if (active === which) { closeActive(); return; }
      if (!active) returnFocus=document.activeElement;
      if (active) active.overlay.classList.add('hidden');
      if (wasPaused === null) wasPaused = game.state === 'playing' ? game.paused : null;
      if (game.state === 'playing' && !game.gameOver) {game.paused = true;game.releaseInputs?.();}
      active = which; which.overlay.classList.remove('hidden'); game.syncOverlayFocus();
      if (which === map) {
        const displayPlan=options.plan||mapPlanOverride||plan, old=game.state==='playing'&&!isGeneration4(game), outside=game.frontier?.active();
        mapMeta.innerHTML = old?'<strong>ANCIEN PLAN DE D-17</strong><span>Le tracé de cette campagne est conservé.</span>':outside?'<strong>PLAN DE D-17</strong><span>Cette feuille décrit la cité et ses quatre sorties. La carte régionale situe votre position actuelle.</span>':'<strong>PLAN DE D-17</strong><span>Sorties sur les quatre côtés · routes · hameaux · stations-service.</span>';
        drawRoadMap(game, displayPlan, mapCanvas);
      } else renderInventory();
    }
    map.close.addEventListener('click', closeActive); inventory.close.addEventListener('click', closeActive);
    map.overlay.addEventListener('pointerdown', e => { if (e.target === map.overlay) closeActive(); });
    inventory.overlay.addEventListener('pointerdown', e => { if (e.target === inventory.overlay) closeActive(); });

    function renderInventory() {
      const p = game.player || { carry: {}, carryCapacity: 0, health: 0, maxHealth: 0, weapon: '—', magazine: {} };
      const regional = game.frontier?.active() ? game.worldEvolution?.overview() : null;
      const packed = packInventory(p.carry || {}), surface=regional?.surface ? {label:regional.surface.name} : surfaceAt(plan,p.x||0,p.y||0,game.weather||0), posture=regional?.posture?.key||p.posture||'stand';
      inventoryBody.replaceChildren();
      const equip = document.createElement('section'); equip.className = 'deadwall125-equip';
      const weaponRows=Object.entries(C?.WEAPONS||{}).map(([id,def])=>{const locked=(game.tier?.id||0)<def.tier;return `<div class="equip-slot ${id===p.weapon?'active':''}"><small>${locked?'À DÉBLOQUER':id===p.weapon?'ARME ACTIVE':'ARME DISPONIBLE'}</small><strong>${String(def.name||id).toUpperCase()}</strong><span>${locked?'Requiert '+(C.CITY_TIERS?.[def.tier]?.name||'le palier '+def.tier):`${Math.round(p.magazine?.[id]||0)} / ${def.magazine||0} dans le chargeur`}</span></div>`;}).join('');
      equip.innerHTML = `<h3>ÉQUIPEMENT</h3>${weaponRows}<div class="equip-slot"><small>ÉTAT PHYSIQUE</small><strong>SANTÉ</strong><span>${Math.ceil(p.health || 0)} / ${Math.ceil(p.maxHealth || 100)} PV</span></div><div class="equip-slot"><small>MOBILITÉ</small><strong>${posture==='prone'?'ALLONGÉ':posture==='crouch'?'ACCROUPI':'DEBOUT'}</strong><span>${surface.label}</span></div><div class="equip-slot"><small>SAC</small><strong>${Math.round(Object.values(p.carry || {}).reduce((a, b) => a + (Number(b) || 0), 0))} / ${p.carryCapacity || 0}</strong><span>ressources portées</span></div>`;
      const gridSection = document.createElement('section'); gridSection.className = 'deadwall125-bag'; gridSection.innerHTML = '<h3>RESSOURCES TRANSPORTÉES</h3>';
      const grid = document.createElement('div'); grid.className = 'deadwall125-grid'; grid.style.setProperty('--cols', packed.cols); grid.style.setProperty('--rows', packed.rows);
      for (let i = 0; i < packed.cols * packed.rows; i++) { const cell = document.createElement('i'); cell.style.gridColumn=String(i%packed.cols+1);cell.style.gridRow=String(Math.floor(i/packed.cols)+1);cell.setAttribute('aria-hidden', 'true'); grid.appendChild(cell); }
      for (const item of packed.items) { const slot = document.createElement('div'); slot.className = `deadwall125-item resource-${item.key}`; slot.style.gridColumn = `${item.x + 1} / span ${item.w}`; slot.style.gridRow = `${item.y + 1} / span ${item.h}`; slot.innerHTML = `<small>${item.label} · P${item.stackIndex}</small><strong>${Math.round(item.quantity * 10) / 10}</strong>`; grid.appendChild(slot); }
      gridSection.appendChild(grid);
      if(packed.overflow.length){const overflow=document.createElement('p');overflow.className='deadwall125-overflow';overflow.textContent='Hors grille : '+packed.overflow.map(item=>`${item.label} ${Math.round(item.quantity*10)/10}`).join(' · ');gridSection.appendChild(overflow);}
      const note = document.createElement('section'); note.className = 'deadwall125-inventory-note'; note.innerHTML = '<h3>RETOUR AU DÉPÔT</h3><p>Rapportez vos ressources au centre de D-17 ou à un entrepôt. Maintenez <kbd>E</kbd> à portée pour les déposer, puis repartez avec de la place libre.</p><p>Le rangement se fait automatiquement. Les quantités hors grille restent dans le sac.</p><p><kbd>C</kbd> posture prudente · <kbd>X</kbd> allongé · <kbd>I</kbd> fermer le sac.</p>';
      inventoryBody.append(equip, gridSection, note);
    }

    const openContextMap = () => { if(game.frontier?.active()&&game.frontierUI?.open){closeActive();game.frontierUI.open();}else open(map); };
    document.getElementById('minimapWrap')?.addEventListener('click', e => { if(!e.target?.closest?.('button'))openContextMap(); });
    document.getElementById('minimapWrap')?.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ')&&e.target===e.currentTarget) { e.preventDefault(); openContextMap(); } });
    const carry = document.getElementById('carryIndicator'); if (carry) { carry.tabIndex = 0; carry.setAttribute('role', 'button'); carry.setAttribute('aria-label', 'Ouvrir équipement et sac'); carry.addEventListener('click', () => open(inventory)); carry.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(inventory); } }); }
    const hint = document.querySelector('.controls-hint'); if (hint && !hint.querySelector('[data-exploration125-hint]')) { const span = document.createElement('span'); span.dataset.exploration125Hint = 'true'; span.innerHTML = '<kbd>M</kbd> carte · <kbd>I</kbd> sac · <kbd>C</kbd> accroupi · <kbd>X</kbd> allongé'; hint.appendChild(span); }
    const pauseMenu = document.querySelector('#pauseMenu .modal-card');
    if (pauseMenu && !document.getElementById('deadwall125-pause-map')) {
      const mapButton = document.createElement('button'); mapButton.id = 'deadwall125-pause-map'; mapButton.type = 'button'; mapButton.textContent = 'CARTE ROUTIÈRE'; mapButton.addEventListener('click', openContextMap);
      const bagButton = document.createElement('button'); bagButton.id = 'deadwall125-pause-bag'; bagButton.type = 'button'; bagButton.textContent = 'ÉQUIPEMENT & SAC'; bagButton.addEventListener('click', () => open(inventory));
      const anchor = document.getElementById('pauseSettingsButton'); pauseMenu.insertBefore(mapButton, anchor || null); pauseMenu.insertBefore(bagButton, anchor || null);
    }
    const menuSeedRow=document.querySelector('#mainMenu .seed-controls');
    if(menuSeedRow&&!document.getElementById('deadwall125-menu-map')){const button=document.createElement('button');button.id='deadwall125-menu-map';button.type='button';button.textContent='CARTE D-17';button.addEventListener('click',()=>{let seed=game.world?.seed??17117;try{const input=document.getElementById('mapSeed'),raw=input?.value||'';const normalized=globalThis.DeadwallProfile?.normalizeSeed?.(raw);if(normalized!==null&&normalized!==undefined)seed=normalized;else{seed=game.previewMapSeed135??game.freshMapSeed?.()??((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);game.previewMapSeed135=seed;game.scenarioUI?.refreshSeed?.();}input?.setCustomValidity?.('');}catch(error){const input=document.getElementById('mapSeed');input?.setCustomValidity?.(error.message);input?.reportValidity?.();return;}mapPlanOverride=createFeaturePlan(seed,plan.worldSize,3);open(map,{plan:mapPlanOverride});});menuSeedRow.appendChild(button);}
    document.addEventListener('keydown', e => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.key === 'Escape'||e.code==='Escape') && active) { e.preventDefault(); e.stopPropagation(); closeActive(); return; }
      if (e.target?.closest?.('input,select,textarea,[contenteditable="true"]')) return;
      if (!active&&game.activeOverlay&&![game.ui.commandModal,game.ui.pauseMenu].includes(game.activeOverlay)) return;
      if (e.code === 'KeyM' && game.state === 'playing' && (!game.frontier?.active()||active)) { e.preventDefault();e.stopPropagation();openContextMap(); }
      if (e.code === 'KeyI' && game.state === 'playing') { e.preventDefault();e.stopPropagation();open(inventory); }
    }, true);
    for(const name of ['startNew','returnToMenu','restoreSave']){const prior=game[name].bind(game);game[name]=function(...args){closeActive();return prior(...args);};}
    const suspendForFocusLoss=game.suspendForFocusLoss.bind(game);
    game.suspendForFocusLoss=function(...args){
      if(active&&wasPaused===false&&game.state==='playing'&&!game.gameOver){wasPaused=true;game.ui.pauseMenu.classList.remove('hidden');}
      const result=suspendForFocusLoss(...args);if(active)game.syncOverlayFocus();return result;
    };
    game.exploration125 = Object.assign(game.exploration125 || {}, { openMap: openContextMap, openInventory: () => open(inventory), closeOverlay: closeActive, overlayOpen:()=>Boolean(active) });
  }

  function normalizeExplorationSave(raw){
    const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const finite=(value,fallback,min,max)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max?value:fallback;
    if(source.layoutRevision!==undefined&&![1,2,3].includes(source.layoutRevision))throw new RangeError('Révision du plan D-17 invalide.');
    const generation=source.generation===4?4:3,region=source.regionOffset&&typeof source.regionOffset==='object'?source.regionOffset:{};
    return {generation,...([2,3].includes(source.layoutRevision)?{layoutRevision:source.layoutRevision}:{}),regionOffset:{x:Math.trunc(finite(region.x,0,-1000000,1000000)),y:Math.trunc(finite(region.y,0,-1000000,1000000))},posture:['stand','crouch','prone'].includes(source.posture)?source.posture:'stand',wildNext:finite(source.wildNext,0,0,1e12),wildHordes:Math.trunc(finite(source.wildHordes,0,0,1e9))};
  }

  function applyExplorationState(game, raw) {
    const extra=normalizeExplorationSave(raw);if(!game)return extra;
    game.exploration125=game.exploration125||{};
    const marked=typeof game.runId==='string'&&game.runId.includes(GENERATION_MARKER);
    game.exploration125.generation=extra.generation===4||marked||game.frontier?.snapshot?.().generation>=4?4:3;
    game.exploration125.layoutRevision=[2,3].includes(extra.layoutRevision)?extra.layoutRevision:1;
    game.d17RegionOffset={...extra.regionOffset};
    if(game.player)game.player.posture=extra.posture;
    game.exploration125.wildNext=extra.wildNext;
    game.exploration125.wildHordes=extra.wildHordes;
    return extra;
  }

  function installSaveExtension(game){
    if(game.__exploration125SaveInstalled)return;game.__exploration125SaveInstalled=true;
    const Save=globalThis.DeadwallSave;
    if(Save&&!Save.__exploration125Installed){
      Save.__exploration125Installed=true;const baseValidate=Save.validate.bind(Save);
      Save.validate=function validate125(input){const data=baseValidate(input);data.exploration125=normalizeExplorationSave(input?.exploration125);return data;};
    }
    const baseSerialize=game.serialize.bind(game);
    game.serialize=function serialize125(){const data=baseSerialize();data.exploration125={generation:isGeneration4(this)?4:3,...([2,3].includes(this.exploration125?.layoutRevision)?{layoutRevision:this.exploration125.layoutRevision}:{}),regionOffset:{x:this.d17RegionOffset?.x||0,y:this.d17RegionOffset?.y||0},posture:this.player?.posture||'stand',wildNext:this.exploration125?.wildNext||0,wildHordes:this.exploration125?.wildHordes||0};return data;};
  }

  function installMobility(game, plan, document){
    if(game.__exploration125MobilityInstalled)return;game.__exploration125MobilityInstalled=true;
    const hud=document.getElementById('bottomHud');let indicator=document.getElementById('deadwall125-mobility');
    if(hud&&!indicator){indicator=document.createElement('div');indicator.id='deadwall125-mobility';indicator.className='deadwall125-mobility';indicator.textContent='DEBOUT · TERRAIN';hud.appendChild(indicator);}
    const baseUpdate=game.updatePlayer.bind(game),baseDraw=game.drawPlayer.bind(game),baseMove=game.moveFriendly.bind(game);
    game.moveFriendly=function moveWithPosture125(entity,dx,dy){
      if(entity===this.player&&isGeneration4(this)&&!this.frontier?.active()&&!this.expeditions?.driving()){
        const factor=surfaceAt(plan,entity.x,entity.y,this.weather||0).multiplier*postureMultiplier(entity.posture||'stand');
        dx*=factor;dy*=factor;
      }
      return baseMove(entity,dx,dy);
    };
    game.updatePlayer=function updatePlayer125(dt){
      if(!this.player)return baseUpdate(dt);this.player.posture=this.player.posture||'stand';
      const active=isGeneration4(this)&&!this.frontier?.active()&&!this.expeditions?.driving(),posture=this.player.posture;let restoreShift=false;
      if(active&&posture!=='stand'&&this.input.keys.has('ShiftLeft')){this.input.keys.delete('ShiftLeft');restoreShift=true;}
      const result=baseUpdate(dt);if(restoreShift)this.input.keys.add('ShiftLeft');
      if(active){const surface=surfaceAt(plan,this.player.x,this.player.y,this.weather||0);this.exploration125.currentSurface=surface;const mobility=surface.multiplier*postureMultiplier(posture);this.player.vx*=mobility;this.player.vy*=mobility;if(indicator){const text=`${posture==='prone'?'ALLONGÉ':posture==='crouch'?'ACCROUPI':'DEBOUT'} · ${surface.label.toUpperCase()} · ${Math.round(mobility*100)}%`;if(indicator.textContent!==text)indicator.textContent=text;}}
      return result;
    };
    game.drawPlayer=function drawPlayer125(ctx){
      if(!isGeneration4(this)||!this.player||!['crouch','prone'].includes(this.player.posture))return baseDraw(ctx);
      const p=this.player,heroAtlas=this.art?.images?.commander||(p.weapon==='pistol'&&this.art?.images?.commanderPistol);
      if(heroAtlas)baseDraw(ctx);
      else{const scaleY=p.posture==='prone'?.54:.78,scaleX=p.posture==='prone'?1.14:1.04;ctx.save();ctx.translate(p.x,p.y);ctx.scale(scaleX,scaleY);ctx.translate(-p.x,-p.y);baseDraw(ctx);ctx.restore();}
      ctx.save();ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(230,218,172,.78)';ctx.fillText(p.posture==='prone'?'ALLONGÉ':'ACCROUPI',p.x,p.y-42);ctx.restore();
    };
    document.addEventListener('keydown',event=>{
      if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||game.state!=='playing'||game.paused||game.gameOver||!isGeneration4(game))return;
      if(event.target?.closest?.('input,select,textarea,[contenteditable="true"],#nightGearQuick'))return;
      if(game.frontier?.active()){
        if(event.code==='KeyX'){event.preventDefault();const current=game.worldEvolution?.posture()?.key;game.worldEvolution?.setPosture(current==='prone'?'stand':'prone');game.save?.(false);}
        return;
      }
      if(event.code==='KeyC'){event.preventDefault();game.player.posture=game.player.posture==='crouch'?'stand':'crouch';game.notify?.(game.player.posture==='crouch'?'Posture accroupie.':'Posture debout.','good');}
      else if(event.code==='KeyX'){event.preventDefault();game.player.posture=game.player.posture==='prone'?'stand':'prone';game.notify?.(game.player.posture==='prone'?'Posture allongée.':'Posture debout.','good');}
    },true);
  }

  function wildHordeDelay(wave, jitter = 11) {const pressure=Math.min(26,Math.max(1,Number(wave)||1)*1.15);return Math.max(28,58-pressure+clamp(Number(jitter)||0,0,22));}

  function installWildHordes(game,plan){
    if(game.__exploration125WildInstalled)return;game.__exploration125WildInstalled=true;
    const baseUpdate=game.update.bind(game);
    function schedule(self){const jitter=self.random?.range?.(0,22)??11;self.exploration125.wildNext=(self.elapsed||0)+wildHordeDelay(self.wave||1,jitter);}
    function spawnPack(self){
      if(!isGeneration4(self)||self.paused||self.frontier?.active()||self.phase==='assault'||self.gameOver)return false;
      const limit=C?.PERFORMANCE_LIMITS?.zombies||700;if(self.zombies.length>limit-16)return false;
      const candidates=(plan.settlements||[]).filter(st=>Math.hypot(st.x-self.player.x,st.y-self.player.y)>650);if(!candidates.length)return false;
      const settlement=self.random?.pick?.(candidates)||candidates[Math.floor(Math.random()*candidates.length)],kinds=Object.entries(C?.ENEMIES||{}).filter(([,def])=>(def.unlockWave||1)<=(self.wave||1)).map(([kind])=>kind);if(!kinds.length)return false;
      const count=clamp(2+Math.floor((self.wave||1)/3),2,10),spawned=[];
      for(let i=0;i<count;i++){
        const kind=self.random?.pick?.(kinds)||kinds[i%kinds.length],radius=C.ENEMIES[kind]?.radius||12;let position=null;
        for(let attempt=0;attempt<16&&!position;attempt++){const angle=(self.random?.range?.(0,Math.PI*2)??Math.random()*Math.PI*2),distance=(self.random?.range?.(260,420)??320),x=clamp(settlement.x+Math.cos(angle)*distance,radius+30,plan.worldSize-radius-30),y=clamp(settlement.y+Math.sin(angle)*distance,radius+30,plan.worldSize-radius-30);if(Math.hypot(x-self.player.x,y-self.player.y)>520&&self.hostilePositionClear({radius},x,y))position={x,y};}
        if(!position||!self.spawnZombie(kind))continue;const zombie=self.zombies[self.zombies.length-1];zombie.x=position.x;zombie.y=position.y;zombie.bias+=(self.random?.range?.(-60,60)??0);spawned.push(zombie);
      }
      if(spawned.length){
        self.exploration125.wildHordes=(self.exploration125.wildHordes||0)+1;
        // Birth is a director event; only actual allied observation can disclose it.
        const vision=self.visibility?.frame?.(),observed=spawned.filter(z=>vision?.canSeeLocal(z)).length;
        if(observed)self.notify?.(`Bande errante observée près de ${settlement.name} · ${observed} contact${observed>1?'s':''} observé${observed>1?'s':''}.`,'danger');
        return true;
      }return false;
    }
    game.update=function update125(dt){const result=baseUpdate(dt);if(!this.gameOver&&isGeneration4(this)&&!this.paused&&!this.frontier?.active()){if(!Number.isFinite(this.exploration125.wildNext)||this.exploration125.wildNext<=0)schedule(this);else if((this.elapsed||0)>=this.exploration125.wildNext){spawnPack(this);schedule(this);}}return result;};
    game.exploration125.spawnWildHorde=()=>spawnPack(game);game.exploration125.scheduleWildHorde=()=>schedule(game);
  }

  function installCodex(game, plan, document) {
    const panel = document.getElementById('commandPanel-field'), nav = panel?.querySelector('.field-nav');
    if (!panel || !nav || document.getElementById('field-world125')) return;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'D-17'; button.dataset.fieldView = 'world125'; button.setAttribute('aria-controls', 'field-world125'); button.setAttribute('aria-pressed', 'false');
    const section = document.createElement('section'); section.id = 'field-world125'; section.className = 'hidden deadwall125-codex';
    const summary = document.createElement('p'); summary.className = 'command-note';const refreshSummary=()=>{summary.textContent = `${plan.stations.length} stations visitables · ${plan.backyards.length} maisons avec cour · ${(plan.settlements||[]).length} hameaux · ${plan.wrecks.length} épaves · routes, chemins et dessertes · plan ${plan.seed}.`;};refreshSummary();game.exploration125.refreshCodex=refreshSummary;
    const grid = document.createElement('div'); grid.className = 'deadwall125-codex-grid';
    for (const entry of WORLD_CODEX) {
      const card = document.createElement('article'); card.innerHTML = `<small>${entry.tag}</small><h3>${entry.title}</h3><p>${entry.summary}</p><ul>${entry.rules.map(rule => `<li>${rule}</li>`).join('')}</ul>`; grid.appendChild(card);
    }
    const actions = document.createElement('div'); actions.className = 'deadwall125-codex-actions';
    const openMap = document.createElement('button'); openMap.type = 'button'; openMap.textContent = 'OUVRIR LA CARTE ROUTIÈRE'; openMap.addEventListener('click', () => game.exploration125?.openMap?.());
    const openBag = document.createElement('button'); openBag.type = 'button'; openBag.textContent = 'OUVRIR ÉQUIPEMENT & SAC'; openBag.addEventListener('click', () => game.exploration125?.openInventory?.()); actions.append(openMap, openBag);
    section.append(summary, actions, grid); nav.appendChild(button); panel.appendChild(section);
    const legacySections = [...panel.querySelectorAll(':scope > section')].filter(node => node !== section);
    const legacyButtons = [...nav.querySelectorAll('button')].filter(node => node !== button);
    for (const legacy of legacyButtons) legacy.addEventListener('click', () => { section.classList.add('hidden'); button.setAttribute('aria-pressed', 'false'); });
    button.addEventListener('click', () => { for (const node of legacySections) node.classList.add('hidden'); for (const legacy of legacyButtons) legacy.setAttribute('aria-pressed', 'false'); section.classList.remove('hidden'); button.setAttribute('aria-pressed', 'true'); });
  }

  function updateHelp(document) {
    const grid = document.querySelector('#helpModal .help-grid'); if (!grid || grid.querySelector('.deadwall125-help')) return;
    const section = document.createElement('section'); section.className = 'deadwall125-help'; section.innerHTML = '<h3>Exploration</h3><p><kbd>M</kbd> : carte du secteur actuel<br><kbd>I</kbd> : équipement et ressources portées<br><kbd>C</kbd> : posture prudente · <kbd>X</kbd> : allongé<br>La vitesse dépend du sol. Dans les nouvelles campagnes, quittez D-17 par une route ou une lisière pour explorer la région.</p>'; grid.appendChild(section);
  }

  function install(game, document) {
    if (!game || !document || game.__exploration125Installed) return false;
    game.__exploration125Installed = true;
    const worldSize = C?.WORLD_SIZE || 4096;
    const plan = createFeaturePlan(game.world?.seed ?? 17117, worldSize);
    game.exploration125 = { version: VERSION, plan, codex: WORLD_CODEX, generation: 3, layoutRevision:1 };
    installSaveExtension(game);
    const syncPlan = installPlanSync(game, plan);
    game.exploration125.syncPlan = syncPlan;
    game.exploration125.firstObstruction=(from,to,pad=0,barriersOnly=false)=>isGeneration4(game)?firstObstruction134(plan,from,to,pad,barriersOnly):null;
    game.exploration125.drawMap=(ctx,sx,sy,options={})=>{if(!isGeneration4(game))return false;if(options.resources!==false)drawMapResources(ctx,game,sx,sy,options.paper);drawMiniRoads(ctx,plan,sx,sy,options);return true;};
    game.exploration125.renderMap=(ctx,width,height)=>drawRoadMap(game,plan,{width,height,getContext:()=>ctx});
    installCollision(game, plan);
    installMobility(game, plan, document);
    installWildHordes(game, plan);
    installDepthRender(game, plan);
    installMinimap(game, plan, document);
    installOverlays(game, plan, document);
    installCodex(game, plan, document);
    updateHelp(document);
    game.notify?.('Carnet de terrain prêt · M carte · I équipement et sac.', 'good');
    return true;
  }

  return Object.freeze({ createBuildingShellCache155, drawCachedBuildingShell155, drawBuildingShell134, drawRoadNetwork, firstObstruction134, physicalSolids134, orientedSolid134, buildingProjection134, VERSION, WORLD_CODEX, INVENTORY_SHAPES, INVENTORY_STACKS, VEHICLE_KINDS, createRoadNetwork, createFeaturePlan, circleIntersectsRect, rectsOverlap, buildingFootprint, createSpatialIndex, querySpatialIndexRect, querySpatialIndexCircle, edgeTransition, packInventory, isVehicleNode, roadContains, surfaceAt, postureMultiplier, stationFurniture, normalizeExplorationSave, applyExplorationState, wildHordeDelay, patchWorldPlacement, installCollision, install });
});
