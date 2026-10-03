/* Road design catalogue. It describes proposals; it does not alter the world,
   movement, resource budgets or the random generator of a campaign. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeadwallRoadProfiles133 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const sources = freeze([
    { id: 'arp', title: 'Cerema — Aménagement des routes principales, présentation du guide (2022)', url: 'https://www.cerema.fr/fr/actualites/amenagement-routes-principales-guide-reference', scope: 'Hiérarchie, contexte, profils, visibilité, transitions et entretien. Les dimensions ci-dessous sont des propositions de jeu, pas des valeurs normatives extraites du guide.' },
    { id: 'exchange', title: 'Cerema — Motorway Interchanges, édition corrigée 2015 / mise à jour 2021, publication 2023', url: 'https://doc.cerema.fr/Default/doc/SYRACUSE/594140', scope: 'Conception des échanges et accès aux aires annexes. Notice consultée ; aucun schéma du guide reproduit.' },
    { id: 'urban', title: 'Département de Haute-Savoie — Guide des traversées d’agglomération, édition 2016, hébergé par Cerema', url: 'https://www.cerema.fr/system/files/documents/2021/12/rrd74-gata_gt_a-edition2016.pdf', scope: 'Distinction entre chaussée, carrefour, giratoire traditionnel, compact et mini-giratoire. Référence locale, pas une norme universelle.' },
    { id: 'tunnel', title: 'CETU — Géométrie des tunnels routiers', url: 'https://www.cetu.developpement-durable.gouv.fr/geometrie-a573.html', scope: 'Séparation du profil en long et du dimensionnement du tunnel. Page de références consultée ; les gabarits de jeu ne certifient aucun ouvrage réel.' }
  ]);
  const groups = freeze({ current: 'Réseau présent', path: 'Chemins et pistes', road: 'Routes et rues', motorway: 'Autoroutes et bretelles', junction: 'Carrefours et échanges', structure: 'Ponts et tunnels', service: 'Aires et abords' });
  const surfaces = freeze({ natural: 'sol naturel', earth: 'terre compactée', gravel: 'grave et gravier', stone: 'pierre ou pavés', asphalt: 'revêtement bitumineux', concrete: 'béton', timber: 'platelage bois', steel: 'tablier métallique' });
  // Widths are usable carriageway ranges, in regional metres. Junction dimensions
  // describe their whole envelope instead; these two quantities are never added.
  // id, name, group, surface, dimension kind, range, lanes forward/backward,
  // separated carriageways, level contract, allowed users, access, risk, four forms.
  const rows = [
    ['runtime-axis','Axes régionaux actuels','current','asphalt','carriageway',[7,9],1,1,false,'ground','foot,car,truck','Segments reliés du réseau G4/G5 ; largeur ne prouvant ni nombre de voies ni régime de circulation.','Les croisements actuels sont à niveau ; aucune voie rapide dénivelée ne doit être déduite de leur largeur.','Axe historique de 7 m|Axe G5 de 7 m|Axe G5 de 9 m|Raccord entre noyau et région'],
    ['runtime-street','Rues régionales actuelles','current','asphalt','carriageway',[5.8,5.8],1,1,false,'ground','foot,car,truck','Rues de bourgs et bouts de réseau ; même ligne centrale pour carte, peinture et recherche routière.','La largeur ne garantit pas une manœuvre de camion : les véhicules doivent encore passer les collisions réelles.','Rue traversante|Rue périphérique|Rue oblique|Extrémité régionale'],
    ['runtime-drive','Accès actuels aux bâtiments','current','asphalt','carriageway',[4,4],1,0,false,'ground','foot,car','Relier la façade au vrai segment public, sans peindre de bordure en travers du raccord.','Un accès de 4 m est un corridor partagé, pas une rue à deux voies ni un lieu de demi-tour garanti.','Accès de maison|Accès de commerce|Accès de service|Accès oblique'],
    ['trail','Sentier forestier','path','natural','carriageway',[1.2,2.2],0,0,false,'ground','foot','Parcours piéton entre lisière, clairière et repère ; raccord piéton seulement.','Ne jamais autoriser une voiture parce que les deux extrémités touchent des routes.','Lisière feuillue|Sous-bois résineux|Ancien passage de bûcheron|Sentier de crête'],
    ['dirt','Chemin de terre agricole','path','earth','carriageway',[3,4.5],1,0,false,'ground','foot,car','Voie partagée vers une parcelle, avec poche de croisement hors cultures.','Ornières visuelles distinctes de la traction future ; éviter une impasse sans retour.','Deux ornières herbeuses|Terre battue sèche|Chemin creux drainé|Desserte de grange'],
    ['gravel','Chemin empierré','path','gravel','carriageway',[3.5,5.5],1,0,false,'ground','foot,car,truck','Accès rural stabilisé avec accotement et rayon de giration selon le véhicule retenu.','Des cailloux décoratifs ne deviennent pas des gisements infinis.','Grave calcaire|Gravier sombre|Empierrement réparé|Rive de carrière'],
    ['bocage','Chemin de bocage','path','earth','carriageway',[3,4.5],1,0,false,'ground','foot,car','Talus et haies placés après le corridor praticable ; ouvertures alignées avec les parcelles.','Branches, clôtures et murets ne masquent pas totalement la prochaine sortie.','Haies basses|Talus et fossés|Murets ajourés|Passage entre vergers'],
    ['forest-track','Piste forestière','path','gravel','carriageway',[3.5,5.5],1,0,false,'ground','foot,car,truck','Piste d’exploitation vers aire de retournement ; barrière placée sur une entrée élargie.','Réserver le balayage du grumier avant troncs, tas de bois et fossés.','Pare-feu|Desserte de coupe|Piste à lacets|Accès de poste forestier'],
    ['logging-spur','Antenne de débardage','path','earth','carriageway',[3,5],1,0,false,'ground','foot,car','Branche courte de piste, avec extrémité lisible et aire latérale de chargement.','Ne pas la traiter comme un raccourci permanent du réseau principal.','Coupe récente|Coupe ancienne|Place de dépôt|Passage humide stabilisé'],
    ['country','Petite route de campagne','road','asphalt','carriageway',[4.5,6],1,1,false,'ground','foot,car','Deux sens sur chaussée étroite ; accotements irréguliers et accès agricoles espacés.','Absence de ligne centrale possible ; aucun marquage autoroutier.','Bocage|Plaine cultivée|Vignoble|Route de ferme dispersée'],
    ['departmental','Route départementale','road','asphalt','carriageway',[6,7.5],1,1,false,'ground','foot,car,truck','Axe interurbain raccordant les bourgs ; carrefours lisibles et voies d’accès latérales.','Le statut départemental ne fixe pas à lui seul la largeur ni la vitesse.','Plaine à fossés|Traversée de bois|Entrée de village|Secteur de relief'],
    ['village-street','Traversée de village','road','asphalt','carriageway',[5,6.5],1,1,false,'ground','foot,car,truck','Transition visible entre campagne et bâti ; trottoirs et seuils de commerces cohérents.','Réserver une continuité piétonne sans rétrécir le véhicule jusqu’à traverser les murs.','Rue de mairie|Rue de marché|Faubourg artisanal|Rue ancienne contrainte'],
    ['bypass','Rocade urbaine','road','asphalt','carriageway',[12,18],2,2,true,'ground','car,truck','Chaussées séparées ; connexions regroupées et traversées piétonnes explicitement aménagées.','Une artère divisée n’est pas automatiquement une autoroute ; son régime reste déclaré.','Boulevard périphérique|Contournement industriel|Section en tranchée|Liaison entre faubourgs'],
    ['mountain-road','Route de montagne','road','asphalt','carriageway',[4.5,7],1,1,false,'ground','foot,car','Le tracé suit le relief avec lacets séparés en altitude et soutènements du bon côté.','Pas de nœud routier à l’intersection projetée de deux lacets de hauteurs différentes.','Versant boisé|Lacet rocheux|Balcon exposé|Route de col'],
    ['coastal-road','Route littorale','road','asphalt','carriageway',[5.5,7],1,1,false,'ground','foot,car,truck','Conserver côte, talus et accès de plage ; parking sur parcelle dédiée.','Nécessite une vraie limite d’eau et un traitement des franchissements avant activation.','Dune reculée|Falaise|Front de petite ville|Digue accessible'],
    ['stone-lane','Rue pavée ou chemin en pierre','road','stone','carriageway',[3,6],1,0,false,'ground','foot,car','Desserte ancienne à faible gabarit ; distinguer pavage construit et éboulis naturel.','Le pavé ne justifie pas des rochers bloquants sur l’axe.','Pavés de bourg|Dalles de cour|Voie antique réparée|Ruelle minérale'],
    ['motorway-2x2','Autoroute 2 × 2 voies','motorway','asphalt','carriageway',[14,14],2,2,true,'ground','car,truck','Deux voies par sens, séparateur central, bords et bandes de sécurité réservés en plus de la chaussée.','Aucun accès de maison, carrefour à niveau, arrêt de bus ou giratoire sur la section courante.','Plaine|Tranchée boisée|Remblai rural|Périphérie lointaine'],
    ['motorway-2x3','Autoroute 2 × 3 voies','motorway','asphalt','carriageway',[21,21],3,3,true,'ground','car,truck','Trois voies par sens ; élargissement progressif annoncé depuis une section 2 × 2.','Interdire la disparition abrupte d’une voie et réserver les insertions avant les obstacles.','Approche métropolitaine|Corridor logistique|Section entre échanges|Élargissement ancien'],
    ['motorway-2x4','Autoroute 2 × 4 voies','motorway','asphalt','carriageway',[28,28],4,4,true,'ground','car,truck','Quatre voies par sens sur corridor majeur, avec emprise nettement supérieure aux axes ruraux.','Forme rare et territorialisée ; pas une largeur tirée au hasard au milieu d’un village.','Couronne métropolitaine|Nœud interrégional|Approche de grand échange|Tronc commun de deux axes'],
    ['ramp','Bretelle autoroutière','motorway','asphalt','carriageway',[3.5,7],1,0,false,'ground','car,truck','Une ou deux voies à sens unique déclarées ; séparation, courbe puis insertion progressive.','Pas de virage à angle droit directement sur la chaussée rapide ni de demi-tour implicite.','Bretelle de sortie|Bretelle d’entrée|Boucle lente|Bretelle à deux voies'],
    ['work-zone','Section en travaux','road','asphalt','carriageway',[3.2,7],1,0,false,'ground','foot,car,truck','Déviation et rétrécissement raccordés ; balisage progressif en amont et sortie visible.','Les cônes n’annulent pas les collisions ni les sens de circulation ; gabarit déclaré par variante.','Alternat abandonné|Chaussée réparée|Déviation provisoire|Voie neutralisée'],
    ['tee','Carrefour en T','junction','asphalt','envelope',[18,40],0,0,false,'ground','foot,car,truck','Trois branches réellement raccordées ; la branche secondaire rejoint une zone de visibilité libre.','Interrompre les lignes au bon endroit ; pas de quatrième sortie dessinée sans sol praticable.','T rural|T de village|T canalisé|T de desserte industrielle'],
    ['offset','Carrefours décalés','junction','asphalt','envelope',[40,100],0,0,false,'ground','foot,car,truck','Deux T séparés par une section assez longue pour le véhicule de référence.','Ne pas fusionner les deux carrefours en une tache d’asphalte avec croisements ambigus.','Décalage droit|Décalage gauche|Entrées de hameau|Accès de ferme opposés'],
    ['cross','Carrefour à quatre branches','junction','asphalt','envelope',[22,50],0,0,false,'ground','foot,car,truck','Quatre branches à niveau ; bords continus et aire commune libre d’objets.','Éviter l’excès de branches et distinguer lampadaire, feu décoratif et feu réellement fonctionnel.','Croix rurale|Croix urbaine|Carrefour à îlots|Intersection de zone artisanale'],
    ['fork','Bifurcation en Y','junction','asphalt','envelope',[20,55],0,0,false,'ground','foot,car','Trois branches ; îlot possible hors des trajectoires et panneaux sur les approches.','Pas d’angle aigu imposant de traverser le terre-plein pour suivre le GPS.','Fourche forestière|Bifurcation de vallée|Séparation de faubourg|Choix de contournement'],
    ['roundabout-compact','Giratoire compact','junction','asphalt','outer-diameter',[24,34],1,0,false,'ground','foot,car','Anneau à sens unique, îlot central et couronne franchissable si prévue pour le grand gabarit.','Les entrées infléchissent les trajectoires ; aucune route ne coupe visuellement l’îlot.','Village|Entrée de bourg|Petit parc d’activité|Carrefour de faubourg'],
    ['roundabout-rural','Giratoire interurbain','junction','asphalt','outer-diameter',[36,56],1,0,false,'ground','foot,car,truck','Anneau et branches séparés ; îlots d’approche et visibilité latérale dégagée.','Panneaux hors du balayage des véhicules ; pas d’arbre sur l’anneau.','Quatre branches|Trois branches|Accès de zone industrielle|Transition de contournement'],
    ['roundabout-urban','Grand giratoire urbain','junction','asphalt','outer-diameter',[45,70],2,0,false,'ground','foot,car,truck','Deux voies circulaires proposées, choix de sortie et rabattement cohérents.','Deux voies ne doublent pas mécaniquement la capacité ; piétons et cyclistes ont des parcours séparés.','Place périphérique|Porte de ville|Carrefour commercial|Double desserte de boulevard'],
    ['diamond','Échangeur en losange','junction','asphalt','envelope',[240,480],0,0,true,'grade-separated','car,truck','Quatre bretelles raccordent une route transversale au-dessus ou au-dessous de l’axe rapide.','Croisements éventuels seulement aux terminaisons sur la route secondaire, jamais sur l’autoroute.','Route au-dessus|Route au-dessous|Terminaisons en T|Terminaisons giratoires'],
    ['trumpet','Échangeur en trompette','junction','asphalt','envelope',[300,650],0,0,true,'grade-separated','car,truck','Raccord à trois branches, avec boucle et bretelles lisibles en altitude.','Ne pas imposer une croisée à niveau au tronc principal ni une sortie en sens interdit.','Terminaison rurale|Liaison de vallée|Accès de péage|Jonction de contournement'],
    ['cloverleaf','Échangeur à boucles','junction','asphalt','envelope',[400,800],0,0,true,'grade-separated','car,truck','Boucles et voies collectrices réservées avant les parcelles voisines.','Les entrecroisements demandent une vraie longueur de transition ; ne pas miniaturiser le trèfle.','Demi-trèfle|Trèfle historique|Boucles avec collectrices|Boucle et bretelle directe'],
    ['directional','Échangeur directionnel','junction','asphalt','envelope',[500,1100],0,0,true,'grade-separated','car,truck','Bretelles directes en couches distinctes, rares et réservées aux grands axes.','Niveaux, piles et rampes doivent former une structure physiquement continue.','Trois branches|Quatre branches|Superposition urbaine|Nœud de fret'],
    ['small-bridge','Petit pont rural','structure','asphalt','carriageway',[3.5,6],1,0,false,'grade-separated','foot,car','Tablier reliant deux berges avec culées et parapets ; croisement alterné si étroit.','Aucune connexion GPS entre le lit inférieur et le tablier au milieu de l’ouvrage.','Pont de pierre|Pont de béton|Petit ouvrage métallique|Pont de ferme'],
    ['river-bridge','Pont routier de rivière','structure','asphalt','carriageway',[6,9],1,1,false,'grade-separated','foot,car,truck','Tablier à deux sens, approches progressives et continuité de protection des bords.','Rivière et piles sont de vrais volumes ; un pilier ne se place pas sur le chemin sous ouvrage.','Poutres de béton|Arches|Pont ancien élargi|Tablier réparé'],
    ['viaduct','Viaduc routier','structure','asphalt','carriageway',[14,28],2,2,true,'grade-separated','car,truck','Travées, piles et chaussées continues au-dessus d’une vallée ou d’infrastructures.','Le nombre de voies de la variante fixe la largeur ; aucune collision globale à toute altitude.','Deux voies par sens|Trois voies par sens|Tabliers séparés|Courbe de vallée'],
    ['steel-bridge','Pont à charpente métallique','structure','steel','carriageway',[3.5,7],1,0,false,'grade-separated','foot,car','Poutres, contreventements et gabarit intérieur ; réserver une approche avant le portail.','La silhouette de la charpente ne doit pas bloquer un véhicule annoncé compatible.','Treillis riveté|Tablier mixte|Pont industriel|Remplacement provisoire'],
    ['footbridge','Passerelle piétonne','structure','timber','carriageway',[1.5,3],0,0,false,'grade-separated','foot','Relier deux chemins par escaliers ou rampes piétonnes explicitement présents.','Ne jamais connecter la voie automobile à la passerelle dans le graphe de véhicule.','Bois de campagne|Acier urbain|Passerelle de canal|Passage de ravin'],
    ['underpass','Passage inférieur','structure','concrete','carriageway',[4,8],1,1,false,'below-ground','foot,car','Le passage inférieur conserve sa propre altitude et ses accès de drainage.','Piles et culées ne se confondent pas avec une barrière couvrant tout le rectangle.','Route sous voie rapide|Chemin sous remblai|Passage de service|Accès agricole busé'],
    ['short-tunnel','Tunnel routier bidirectionnel','structure','asphalt','carriageway',[6,8],1,1,false,'below-ground','car,truck','Un tube à deux sens ; portails, parois et cheminement d’évacuation réservés avant le décor.','Nécessite visibilité et éclairage cohérents ; pas de forêt générée dans le volume creusé.','Traversée rocheuse|Tunnel de col|Tunnel court périurbain|Ouvrage ancien élargi'],
    ['twin-tunnel','Tunnel à deux tubes','structure','asphalt','carriageway',[14,21],2,2,true,'below-ground','car,truck','Un tube par sens ; voies maintenues depuis les portails et liaisons de secours identifiées.','Les galeries de secours ne sont pas des raccourcis pour les véhicules.','Deux voies par tube|Trois voies par tube|Tubes décalés|Tunnel autoroutier long'],
    ['cut-cover','Tranchée couverte','structure','concrete','carriageway',[6,14],1,1,false,'below-ground','car,truck','Route sous couverture avec ouvrages latéraux et surface supérieure distincte.','La parcelle au-dessus n’interagit pas à travers la dalle avec les objets du dessous.','Couverture urbaine|Passage de périphérie|Écran de quartier|Court tunnel d’accès'],
    ['rock-gallery','Galerie de protection','structure','concrete','carriageway',[5,7],1,1,false,'ground','foot,car','Couverture accolée au versant, ouvertures vers l’aval et débouchés dégagés.','Protection visuelle sans effondrement simulé tant que cette mécanique n’existe pas.','Pare-blocs|Galerie de falaise|Secteur avalancheux|Galerie semi-ouverte'],
    ['ford','Gué aménagé','structure','stone','carriageway',[3,5],1,0,false,'ground','foot,car','Route traversant réellement un lit peu profond avec seuils et retour sur les berges.','Projet conditionné à une hydrologie jouable ; crue et profondeur ne sont pas de simples textures.','Dalles basses|Radier de béton|Pierres maçonnées|Déviation de pont'],
    ['rest-area','Aire de repos','service','asphalt','envelope',[70,160],0,0,false,'ground','foot,car,truck','Entrée puis boucle de stationnement puis sortie ; sentiers séparés des manœuvres.','Les réserves appartiennent aux coffres ou au local ; les tables ne produisent pas de nourriture.','Aire boisée|Belvédère|Aire de plaine|Aire de poids lourds'],
    ['service-area','Aire de services','service','asphalt','envelope',[120,260],0,0,false,'ground','foot,car,truck','Pompes, stationnement, boutique et livraisons reliés sans traverser le sens rapide.','Aucune pompe infinie ; alimentation et carburant viennent d’un état de lieu fini.','Petite station|Grande aire|Station fermée|Aire avec motel'],
    ['toll','Ancienne barrière de péage','service','asphalt','envelope',[80,220],0,0,false,'ground','car,truck','Élargissement progressif vers les cabines puis convergence vers l’axe.','Ne pas laisser tous les passages physiquement fermés sans retour annoncé avant l’approche.','Péage pleine voie|Sortie à tickets|Voie de service|Barrière partiellement évacuée'],
    ['maintenance','Centre d’entretien routier','service','asphalt','envelope',[60,150],0,0,false,'ground','foot,car,truck','Cour, atelier, matériaux, garage et portail de service ; accès depuis le réseau secondaire.','Engins décoratifs non pilotables tant que leur conduite n’est pas disponible.','Petit dépôt|District autoroutier|Station hivernale|Atelier départemental'],
    ['bus-bay','Arrêt en retrait','service','asphalt','envelope',[25,60],0,0,false,'ground','foot,car','Baie en retrait sur route compatible et chemin piéton vers les habitations.','Pas d’arrêt public posé sur une section courante autoroutière.','Abri de village|Arrêt rural|Arrêt scolaire|Ancienne halte de quartier'],
    ['layby','Refuge et aire de retournement','service','gravel','envelope',[15,45],0,0,false,'ground','foot,car,truck','Élargissement latéral hors du flux, dimensionné selon le véhicule admis.','Ne pas masquer une absence de demi-tour par une téléportation du véhicule.','Refuge de piste|Demi-tour forestier|Renfoncement rocheux|Accès de secours'],
    ['industrial-road','Desserte industrielle','service','concrete','carriageway',[7,10],1,1,false,'ground','foot,car,truck','Portails en retrait, giration, quais et bandes piétonnes raccordés aux parcelles.','Les remorques ne traversent ni clôtures ni rangées de conteneurs lors de leur virage.','Boucle d’entrepôts|Cour d’usine|Accès de carrière|Desserte de silo'],
    ['quay-road','Voirie portuaire','service','concrete','carriageway',[7,12],1,1,false,'ground','foot,car,truck','Séparer quai, voie lourde, stockage et circulation des équipes ; clôture traversée par un vrai portail.','Projet lié au port et à l’eau ; pas de ponton décoratif traité comme route terrestre.','Quai cargo|Terminal de fret|Port de pêche|Desserte d’atelier naval']
  ];
  const groupRules = freeze({
    current: { decor: 'Accotements, marquages interrompus aux raccords et abords existants.', night: 'Éclairage existant des lieux et matériel nocturne ; le réseau routier ne reçoit pas automatiquement des lampadaires.', supplies: 'Ressources dans les vrais contenants des lieux voisins ; aucun budget supplémentaire sur le bitume.', check: 'Comparer les centres, largeurs et raccords aux segments réels G4/G5 et aux accès p.drive.', sources: ['arp'] },
    path: { decor: 'Fossé, barrière, borne, tas de branchages et souche hors du corridor. Les troncs et houppiers sont réservés après le tracé.', night: 'Chemin normalement sombre ; balise ou lampe portative avec origine et durée explicites.', supplies: 'Bois seulement sur des objets récoltables finis hors de la circulation ; aucune richesse attribuée à la texture du chemin.', check: 'Parcourir entrée, croisement éventuel, destination et retour avec chaque gabarit autorisé.', sources: ['arp'] },
    road: { decor: 'Bornes, signalisation, fossés, murs, clôtures et abribus selon le territoire, hors des trajectoires et triangles de visibilité.', night: 'Campagne majoritairement sombre ; points éclairés près des usages actifs, jamais une guirlande gratuite sur chaque route.', supplies: 'Stocks limités aux coffres, dépôts et commerces. Le nombre de panneaux et de fissures ne multiplie pas les ressources.', check: 'Contrôler transition de largeur, branches, obstacles, façade et visibilité à l’approche.', sources: ['arp','urban'] },
    motorway: { decor: 'Séparateur, glissières, clôture, panneaux et ouvrages de drainage suivent le profil et ses transitions.', night: 'Échanges ou aires éclairés seulement si leur installation est alimentée ; longues sections sombres cohérentes.', supplies: 'Récupération dans les véhicules ou installations accessibles ; pas de caisses disséminées sur chaque voie.', check: 'Suivre séparément chaque sens et chaque bretelle ; aucune liaison à niveau, demi-tour par terre-plein ou accès de parcelle.', sources: ['exchange'] },
    junction: { decor: 'Îlots, bordures et panneaux découlent des branches. Laisser le centre des trajectoires vide ; pas de buisson planté dans un raccord.', night: 'Éclairer une entrée ou un conflit précis si le lieu est alimenté. Les marquages réfléchissants ne sont pas des sources lumineuses.', supplies: 'Un carrefour n’est pas un gisement ; une épave éventuelle conserve un budget unique et une voie de retour.', check: 'Tester toutes les paires origine–sortie permises ; interdire les autres dans le graphe et les collisions.', sources: ['arp','exchange','urban'] },
    structure: { decor: 'Culées, piles, parapets, caniveaux et locaux techniques suivent le volume réel ; aucune plante dans un tablier ou un tube.', night: 'Portails, niches et cheminements identifiés ; éclairage intérieur dépendant d’une alimentation et du bon niveau.', supplies: 'Outillage et réserve dans un local ou un coffre accessible ; aucune nourriture dans le béton structurel.', check: 'Vérifier au-dessus, au-dessous et dans le volume ; conserver les hauteurs dans collision, GPS, caméra, lumière et sauvegarde.', sources: ['tunnel','arp'] },
    service: { decor: 'Places, bordures, mobilier, poubelles, enseignes et matériel de travail suivent les zones d’usage ; garder les issues libres.', night: 'Éclairages de tâche et de façade avec circuit ou générateur déclaré ; réserves de carburant finies.', supplies: 'Budget de site fixé avant répartition entre contenants ; un nouveau décor n’ajoute pas une deuxième réserve.', check: 'Prouver le parcours routier et piéton entrée–usage–chargement–sortie, y compris avec un véhicule long.', sources: ['exchange','arp'] }
  });
  const profiles = freeze(rows.map(row => {
    const [id,title,group,surface,dimension,metres,forward,backward,separated,level,users,access,risk,forms] = row;
    const current = group === 'current', rules = groupRules[group];
    return {
      id: 'road133-' + id, title, group, status: current ? 'pilote' : 'plan', generated: current,
      geometry: { surface, dimension, metres, lanes: current ? null : { forward, backward, separated, traffic: users==='foot'?'pedestrian':forward===0&&backward===0?'junction':backward>0?'bidirectional':id==='ramp'||id.startsWith('roundabout-')?'one-way':'shared' }, level, units: 'regional-metres', indicative: !current },
      users: users.split(','), access, risk, ...rules,
      variants: forms.split('|').map((name,i) => ({ id: 'road133-'+id+'-v'+(i+1), name, status: current ? 'pilote' : 'plan', ...(id==='ramp'&&i===3?{lanesOverride:{forward:2,backward:0},carriagewayMetres:7}:['viaduct','twin-tunnel'].includes(id)&&i===1?{lanesOverride:{forward:3,backward:3},carriagewayMetres:21}:{}) })),
      runtime: current ? { files: ['src/frontier-world.js','src/world-stream131.js','src/region-roadkit.js'], locator: id === 'runtime-drive' ? 'poi.drive: {a,b,width:4}' : id === 'runtime-street' ? 'world.roads: width===5.8' : 'world.roads: width===7 || width===9', caveat: 'Profil descriptif seulement. Le moteur ne modélise pas les voies séparément et ne simule pas le code de la route.' } : null
    };
  }));
  const byId = new Map(profiles.map(p => [p.id,p]));
  // Design proposals only, per valid roadside site. These never feed the live
  // generator. Disallowed proposals become empty sites, not more enemy spawns.
  const spawnProposals = freeze({
    isolated: { empty:70, infected:24, allied:5, hostile:1 },
    village: { empty:54, infected:34, allied:10, hostile:2 },
    service: { empty:48, infected:40, allied:9, hostile:3 },
    industrial: { empty:51, infected:40, allied:5, hostile:4 },
    interchange: { empty:68, infected:26, allied:4, hostile:2 },
    tunnel: { empty:76, infected:22, allied:1, hostile:1 }
  });
  function conditionalSpawns(context, capabilities = {}) {
    const proposal = spawnProposals[context];
    if (!proposal) throw new Error('Contexte routier inconnu.');
    const effective = { empty:proposal.empty, infected:0, allied:0, hostile:0 };
    for (const kind of ['infected','allied','hostile']) {
      const allowed = capabilities.validSite === true && capabilities.returnPath === true && capabilities[kind] === true && (context !== 'tunnel' || capabilities.levelGeometry === true);
      if (allowed) effective[kind] = proposal[kind]; else effective.empty += proposal[kind];
    }
    return freeze({ status:'design-only', denominator:'un site d’abord validé, jamais une portion de route ou un tick', proposal:{...proposal}, effective });
  }
  // A projected crossing is not a navigable junction if the decks differ.
  // This is a design validator, not a replacement for the current road graph.
  function connectionCheck(a,b) {
    const reasons=[];
    if (!a || !b || !Number.isFinite(a.level) || !Number.isFinite(b.level)) return { ok:false, reasons:['Niveau de raccord absent.'] };
    if (a.level !== b.level) reasons.push('Croisement dénivelé : aucun nœud commun sans rampe explicite.');
    if (!Number.isFinite(a.width) || !Number.isFinite(b.width) || a.width<=0 || b.width<=0) reasons.push('Largeur utile invalide.');
    if (!Array.isArray(a.users) || !Array.isArray(b.users) || !a.users.some(x => b.users.includes(x))) reasons.push('Aucun gabarit d’usager commun.');
    if ((a.controlledAccess || b.controlledAccess) && a.ramp !== true && b.ramp !== true) reasons.push('Accès contrôlé : une bretelle est nécessaire.');
    if (a.width!==b.width && a.transition!==true && b.transition!==true) reasons.push('Changement de largeur sans transition.');
    return { ok:reasons.length===0,reasons };
  }
  function clearanceEnvelope(road, object) {
    if (!road?.a || !road?.b || !object || ![road.a.x,road.a.y,road.b.x,road.b.y,road.width,object.x,object.y,object.radius,object.margin??0].every(Number.isFinite) || road.width<=0 || object.radius<0 || (object.margin??0)<0) return { valid:false, clear:false, reason:'Géométrie invalide.' };
    const dx=road.b.x-road.a.x,dy=road.b.y-road.a.y,l2=dx*dx+dy*dy;
    if (!l2) return { valid:false,clear:false,reason:'Segment nul.' };
    const t=Math.max(0,Math.min(1,((object.x-road.a.x)*dx+(object.y-road.a.y)*dy)/l2));
    const distance=Math.hypot(object.x-road.a.x-t*dx,object.y-road.a.y-t*dy), required=road.width/2+object.radius+(object.margin??0);
    return { valid:true,clear:distance>=required,distance,required };
  }
  function validate(list=profiles) {
    const errors=[],ids=new Set(),variants=new Set();
    if (!Array.isArray(list)) return ['Catalogue non tabulaire.'];
    for (const p of list) {
      if (!p || typeof p.id!=='string' || !p.id.startsWith('road133-') || ids.has(p.id)) { errors.push('Identifiant absent ou dupliqué.'); continue; }
      ids.add(p.id);
      if (!Object.hasOwn(groups,p.group) || !['plan','pilote'].includes(p.status)) errors.push(p.id+': groupe/statut invalide.');
      if (p.generated !== (p.group==='current') || (p.generated ? !p.runtime || p.status!=='pilote' : p.runtime!==null || p.status!=='plan')) errors.push(p.id+': disponibilité trompeuse.');
      const g=p.geometry;
      if (!g || !Object.hasOwn(surfaces,g.surface) || !['carriageway','envelope','outer-diameter'].includes(g.dimension) || !Array.isArray(g.metres) || g.metres.length!==2 || !g.metres.every(n=>Number.isFinite(n)&&n>0) || g.metres[1]<g.metres[0] || !['ground','grade-separated','below-ground'].includes(g.level)) errors.push(p.id+': géométrie invalide.');
      if (!Array.isArray(p.users) || !p.users.length || p.users.some(v=>!['foot','car','truck'].includes(v))) errors.push(p.id+': usagers invalides.');
      if (g?.lanes && (!Number.isInteger(g.lanes.forward) || !Number.isInteger(g.lanes.backward) || g.lanes.forward<0 || g.lanes.backward<0 || g.lanes.forward>4 || g.lanes.backward>4 || typeof g.lanes.separated!=='boolean')) errors.push(p.id+': voies invalides.');
      if (p.generated && g?.lanes!==null) errors.push(p.id+': voies runtime non modélisées.');
      if (!Array.isArray(p.sources) || !p.sources.length || p.sources.some(id=>!sources.some(s=>s.id===id))) errors.push(p.id+': source inconnue.');
      if (!Array.isArray(p.variants) || p.variants.length!==4) errors.push(p.id+': quatre formes attendues.');
      for (const v of Array.isArray(p.variants)?p.variants:[]) { if (!v || typeof v.id!=='string' || variants.has(v.id) || !v.id.startsWith(p.id+'-v') || v.status!==p.status || typeof v.name!=='string' || !v.name.trim()) errors.push(p.id+': variante invalide.'); if(v)variants.add(v.id); }
      for (const field of ['title','access','risk','decor','night','supplies','check']) if(typeof p[field]!=='string'||!p[field].trim()) errors.push(p.id+': '+field+' absent.');
    }
    return errors;
  }
  const entries = freeze(profiles.map(p => ({
    id:p.id,title:'Routes · '+p.title,family:'activites',status:p.status,
    summary:groups[p.group]+' — '+p.access,
    layout:(p.geometry.dimension==='carriageway'?'Chaussée utile cumulée':p.geometry.dimension==='outer-diameter'?'Diamètre extérieur':'Emprise de composition')+' : '+p.geometry.metres.join(' à ')+' m. '+(p.generated?'Dimensions décrivant le réseau actuel, sans voies simulées.':'Plage indicative de conception, non normative ; réserver accotements, fossés et transitions en plus si nécessaire.'),
    access:p.access+' Usagers de conception : '+p.users.map(v=>({foot:'piéton',car:'véhicule léger',truck:'poids lourd'}[v])).join(', ')+'.',
    supplies:p.supplies,risks:p.risk,night:p.night,
    variants:p.variants.map(v=>v.name).join(' ; ')+'.',
    interactions:p.decor+' GPS, collisions, lumière et sauvegarde doivent utiliser le même domaine et niveau.',
    qa:p.check,
    source:p.generated?p.runtime.files.join(' ; ')+'. '+p.runtime.locator+'. '+p.runtime.caveat:'Conception 1.33 uniquement. Références : '+p.sources.map(id=>sources.find(s=>s.id===id).title).join(' ; ')+'. Voir docs/codex/ROUTES_1_33.md.'
  })));
  return freeze({ version:1,groups,surfaces,sources,profiles,entries,spawnProposals,profile:id=>byId.get(id)||null,conditionalSpawns,connectionCheck,clearanceEnvelope,validate });
});
