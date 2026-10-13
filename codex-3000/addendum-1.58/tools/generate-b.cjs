'use strict';
/* Authoring source for 250 independent civic, retail and leisure programmes.
 * Room names and missions below are authored per service; no state/locale expansion. */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../../..');
const DEST = path.resolve(__dirname, '..', 'PROGRAMMES_B.json');
const groups = [
  ['services', 'Services et petits ateliers', 'workshop', `
Atelier de réparation de casques audio|diagnostiquer puis remettre en état les écouteurs confiés au comptoir|Cabine d'écoute comparative;Établi des membranes;Table des câbles;Rayonnage des casques rendus
Accorderie de pianos|recevoir les mécanismes déposés et préparer les interventions d'accordage à domicile|Salle des claviers;Établi des marteaux;Table des feutres;Bureau des tournées d'accordage
Atelier d'entretien des cuivres musicaux|nettoyer les instruments à vent et réparer leurs coulisses avant restitution|Zone de dépose des pavillons;Bacs de nettoyage des cuivres;Établi des pistons;Salle d'essai des embouchures
Atelier de réglage des accordéons|isoler les fuites de soufflet et régler les jeux de lames d'accordéon|Table des soufflets;Établi des sommiers;Cabine d'écoute des anches;Rangement des basses démontées
Atelier de remise en crin des archets|remplacer les mèches et vérifier la tension sans mélanger les instruments des clients|Réception des archets;Table de tri des crins;Établi des hausses;Salle de séchage des mèches
Atelier d'entretien des orgues de salon|réparer les contacts et pédaliers des petits orgues domestiques|Salle des claviers électriques;Établi des pédaliers;Contrôle des contacts;Stock des jeux de touches
Service de restauration de magnétophones|réviser les entraînements de bande et restituer les appareils familiaux|Diagnostic des transports;Établi des galets;Cabine de lecture témoin;Stock de courroies audio
Laboratoire de tirages photographiques familiaux|développer les films apportés et classer les tirages par commande privée|Réception des rouleaux;Chambre noire des bains;Salle de séchage des tirages;Table des pochettes nominatives
Atelier de restauration de films familiaux|examiner les bobines fragiles avant leur copie sur support de consultation|Table d'inspection des perforations;Établi des collures;Cabine de transfert des bobines;Rayonnage des boîtes de films
Service de transfert de cassettes vidéo|lire les cassettes domestiques et identifier les copies commandées|Réception des cassettes;Banc de lecteurs vidéo;Cabine de contrôle des copies;Rangement des boîtiers restitués
Atelier de reliure de documents privés|assembler les dossiers familiaux et réparer leurs couvertures déchirées|Table des cahiers;Établi de couture des dos;Zone de pressage des couvertures;Casier des reliures terminées
Atelier de cachets professionnels|composer les empreintes et monter les tampons des petits bureaux|Bureau de composition des cachets;Table des empreintes;Établi de montage des tampons;Stock des poignées vierges
Service de nettoyage des enseignes|recevoir les lettres déposées puis préparer leur nettoyage et leur remise en place|Courrier des enseignes déposées;Table des caractères;Zone de lavage des panneaux;Établi des fixations de façade
Atelier de duplication de badges d'accès|enregistrer les demandes autorisées et vérifier les supports d'accès copiés|Guichet des autorisations;Bureau des listes de badges;Banc de lecture des supports;Casier des cartes invalidées
Bureau de déménagement adapté|organiser les caisses et les accès pour des clients à mobilité réduite|Salle de relevé du mobilier;Bureau des gabarits de passage;Table des étiquettes de caisses;Réserve des rampes amovibles
Conciergerie de clefs locatives|consigner les remises de clefs et organiser les interventions dans les logements loués|Guichet de dépôt des clefs;Armoire des trousseaux scellés;Bureau des états d'entrée;Salle des kits d'intervention
Centre de prêt d'outillage domestique|contrôler les petits outils prêtés et séparer les retours des appareils prêts|Comptoir des prêts;Banc d'essai des outils;Zone des retours endommagés;Rayonnage des mallettes complètes
Service de contrôle de sièges enfants|examiner les attaches et expliquer le montage des sièges rapportés|Espace des sangles;Banc de présentation des attaches;Zone des sièges refusés;Table des notices de montage
Atelier de réglage de poussettes|réparer les freins et articulations des équipements de promenade|Dépose des châssis pliants;Établi des roues;Zone des tissus déhoussés;Couloir d'essai des freins
Maison de location de matériel de réception|préparer les lots de vaisselle et textiles commandés pour les réceptions|Table des lots de couverts;Rayonnage des nappes;Zone des retours à laver;Bureau des bordereaux de location
Atelier de réparation de jeux de société|remplacer les pièces perdues et restaurer les plateaux des jeux apportés|Table des inventaires de pions;Établi des plateaux;Rangement des règles imprimées;Casier des boîtes complétées
Atelier de réparation de parapluies|remplacer les baleines et retendre les toiles des parapluies confiés|Dépose des parapluies ouverts;Établi des charnières;Table des toiles décousues;Rangement des poignées de rechange
Atelier d'entretien de bagages|restaurer les roues et fermetures des valises en conservant leurs étiquettes|Table des valises ouvertes;Établi des roulettes;Zone des doublures;Rayonnage des coques réparées
Atelier de retension de fauteuils|réparer les assises et remettre en tension les sangles du mobilier domestique|Zone des fauteuils déhoussés;Table des sangles;Établi des ressorts;Salle des tissus découpés
Atelier de réparation de volets manuels|réparer les lames et commandes mécaniques des volets déposés|Rangement des lames de volets;Établi des treuils;Table des attaches;Zone d'essai des manivelles
Atelier d'ajustage de stores intérieurs|couper et monter les stores sur mesure avant restitution aux particuliers|Table de mesure des tissus;Zone des rails de stores;Établi des cordons;Stock des embouts de fenêtres
Atelier d'entretien de machines à coudre|nettoyer les entraînements et contrôler les coutures des machines privées|Dépose des machines de couture;Établi des entraînements;Table de piqûre témoin;Rangement des canettes
Service d'affûtage de ciseaux de coiffure|reprendre les tranchants et vérifier la fermeture des ciseaux professionnels|Réception des ciseaux identifiés;Établi des pierres d'affûtage;Table de contrôle des lames;Casier des étuis de retour
Atelier de repolissage d'argenterie|nettoyer les pièces de service et réparer leurs attaches sans fondre les objets|Table d'inventaire des services;Bacs de nettoyage des couverts;Établi des anses;Zone des pièces emballées
Service de restauration de tapis|examiner les fibres et reprendre les franges de tapis confiés au dépôt|Salle d'étalement des tapis;Table des échantillons de fibres;Établi des franges;Zone de séchage des textiles
Atelier d'encadrement sur mesure|assembler les baguettes et protéger les œuvres privées dans des cadres|Table de découpe des passe-partout;Établi des baguettes;Zone de pose des vitrages;Stock des œuvres emballées
Atelier de réparation de vitraux domestiques|trier les fragments et refaire les assemblages de petites verrières apportées|Table de relevé des motifs;Établi des plombs;Zone de fragments triés;Salle des panneaux assemblés
Atelier de réveils mécaniques|diagnostiquer les mouvements et remonter les réveils domestiques|Table des mouvements démontés;Établi des ressorts;Zone de sonnerie témoin;Rangement des cadrans anciens
Service de bracelets de montres|ajuster les bracelets et préserver les boîtiers reçus au comptoir|Comptoir des tours de poignet;Établi des maillons;Table des bracelets cuir;Casier des boîtiers protégés
Atelier de médailles et distinctions|graver les plaques nominatives et assembler les rubans commandés|Bureau des inscriptions;Table des plaques vierges;Établi des attaches de rubans;Stock des écrins de cérémonie
Bureau de diagnostics d'humidité|comparer les relevés domestiques et documenter les infiltrations avant travaux|Réception des constats d'eau;Table des sondes d'humidité;Bureau des coupes de murs;Archives des relevés comparés
Bureau de plans d'accessibilité|relever les obstacles et préparer des plans de passage accessibles|Salle des relevés de seuils;Table des plans de cheminement;Bureau des largeurs de portes;Rangement des gabarits de rotation
Cabinet d'acoustique de l'habitat|préparer les mesures de bruit et comparer les transmissions entre logements|Stock des microphones;Table de calibration sonore;Bureau des courbes d'écoute;Salle des maquettes de cloisons
Centre de relevés thermographiques|préparer les caméras et classer les pertes thermiques observées sur bâtiment|Casier des caméras thermiques;Table des relevés de façade;Bureau des plans isolants;Archives des images de contrôle
Bureau de dossiers de repérage du bâti|classer les prélèvements documentés et préparer les rapports de diagnostic immobilier|Réception des dossiers de repérage;Table des plans de prélèvement;Zone des boîtes scellées;Bureau des rapports réglementaires
Studio d'applications accessibles|développer des interfaces lisibles et préparer leurs essais avec aides techniques|Salle des lecteurs d'écran;Bureau des parcours clavier;Table des prototypes tactiles;Archives des scénarios d'usage
Bureau de logiciels domestiques embarqués|préparer les programmes de contrôleurs domestiques et leurs essais sur banc|Banc des contrôleurs déposés;Table des connecteurs de test;Bureau des versions logicielles;Stock des cartes d'essai
Atelier d'essais d'interfaces mobiles|tester les gestes et parcours des applications sur plusieurs appareils portables|Table des téléphones d'essai;Bureau des maquettes d'écran;Cabine d'enregistrement des gestes;Rangement des appareils témoins
Studio de tableaux de bord hors ligne|concevoir des interfaces de consultation pouvant fonctionner sans réseau extérieur|Bureau des modèles de données;Table des écrans de supervision;Zone d'essai sans connexion;Archives des exports locaux
Atelier de logiciels cartographiques|assembler les relevés de terrain dans des cartes consultables localement|Table des relevés géographiques;Bureau des couches de carte;Salle des plans grand format;Stock des carnets de terrain
Centre de récupération de données personnelles|diagnostiquer les supports abîmés et préparer des copies identifiées pour leur propriétaire|Réception des supports scellés;Banc des lecteurs de récupération;Bureau de vérification des fichiers;Casier des copies privées
Bureau d'archives familiales|classer les documents confiés par famille et préparer leur restitution ordonnée|Table des lots familiaux;Bureau des arbres de classement;Salle des pochettes de conservation;Casier des documents à rendre
Service de numérisation de plans anciens|dérouler les grands plans fragiles avant leur copie et leur reconditionnement|Salle de déroulage des plans;Table de capture grand format;Zone des tubes de transport;Bureau des index de plans
Atelier d'assistance informatique aux seniors|préparer les appareils personnels et expliquer les opérations courantes au comptoir|Salle des écrans agrandis;Table des claviers adaptés;Bureau des notices illustrées;Zone des appareils en attente
Centre de tri de cartouches d'impression|séparer les cartouches rapportées et préparer leur reprise par filière de matériau|Comptoir des cartouches usées;Table de tri par boîtier;Zone des bacs scellés;Bureau des bordereaux de reprise
Atelier de maintenance d'imprimantes domestiques|nettoyer les transports de papier et vérifier les impressions des appareils déposés|Dépose des imprimantes;Établi des galets papier;Table des feuilles témoins;Stock des têtes de rechange
Bureau d'organisation d'inventaires|préparer les listes de biens et les équipes de comptage des petits établissements|Salle des plans d'étagères;Bureau des listes d'objets;Table des étiquettes de suivi;Stock des mallettes de comptage
Cabinet de médiation numérique|accompagner les démarches informatiques sans conserver les mots de passe des visiteurs|Salle des postes accompagnés;Bureau des formulaires guidés;Table des notices de sécurité;Casier des imprimés de démarche
Service de transcription et sous-titrage|retranscrire les enregistrements confiés et caler les textes sur les séquences|Cabine d'écoute des paroles;Bureau des transcriptions;Table de contrôle des sous-titres;Stock des supports de livraison
Atelier de livres tactiles|composer des supports de lecture par relief et assembler leurs éléments manipulables|Table des matières tactiles;Établi des pages épaisses;Zone d'essai des reliefs;Stock des livres assemblés
Studio de transcription braille|préparer les fichiers de lecture tactile et vérifier les pages embossées|Bureau des textes à transcrire;Table des caractères braille;Zone de lecture des épreuves;Rangement des liasses embossées
Bureau d'interprétation de proximité|préparer les entretiens bilingues et conserver uniquement les dossiers autorisés|Salle d'entretien bilingue;Bureau des glossaires;Table des documents traduits;Casier des dossiers confidentiels
Centre de transcription de comptes rendus|mettre au propre les réunions enregistrées et vérifier les noms des intervenants|Réception des enregistrements;Cabine de transcription des débats;Bureau des listes d'intervenants;Table de relecture des comptes rendus
Atelier de restauration de jouets mécaniques|réparer les petits mécanismes de jouets anciens confiés par les familles|Table des jouets ouverts;Établi des ressorts miniatures;Zone d'essai des roues;Rangement des pièces peintes
Service d'adaptation de poignées domestiques|ajuster les prises de main et préparer des fixations réversibles pour l'habitat|Table des poignées témoins;Établi des attaches réversibles;Salle d'essai de préhension;Stock des kits identifiés
`],
  ['retail', 'Commerces non alimentaires', 'retail', `
Comptoir de fournitures de couture|vendre les merceries et préparer les métrages de tissu demandés|Mur des bobines;Table des métrages;Rayonnage des patrons;Zone des boutons triés
Boutique de laines et tricot|présenter les fibres et constituer des lots cohérents de pelotes|Mur des écheveaux;Table des aiguilles;Zone des bains de couleur;Casier des ouvrages témoins
Magasin de textiles d'ameublement|mesurer les tissus de siège et préparer les commandes de garniture|Table des grandes laizes;Rayonnage des mousses;Zone des échantillons de siège;Bureau des devis de coupe
Boutique de linge de maison|présenter les dimensions de linge et séparer les séries de commande|Mur des draps;Table des nappes;Zone des housses;Stock des paquets de serviettes
Comptoir de vêtements de travail|ajuster les tenues professionnelles et préparer les lots par métier|Salle des vestes de chantier;Cabine des tailles;Mur des protections textiles;Zone des lots d'équipe
Boutique de chaussures adaptées|présenter les chaussants à ouverture large et vérifier les ajustements|Mur des paires larges;Banc d'essayage des fermetures;Table des semelles;Stock des boîtes par pointure
Magasin de tissus imperméables|vendre les membranes et accessoires de couture destinés aux équipements de pluie|Table des tissus enduits;Mur des rouleaux étanches;Zone des bandes de couture;Stock des fermetures couvertes
Boutique de chapeaux et coiffes|présenter les coiffes rigides et ajuster les bandeaux intérieurs|Mur des formes de chapeaux;Table des bandeaux;Cabine des miroirs;Stock des boîtes hautes
Comptoir de vêtements cérémoniels|préparer les tenues de cérémonie et séparer les accessoires loués des ventes|Salle des tenues longues;Cabine des essayages cérémoniels;Table des accessoires;Stock des housses nominatives
Magasin de fournitures de cordonnerie|vendre les semelles et composants aux réparateurs de chaussures|Mur des semelles brutes;Table des talons;Zone des colles fermées;Stock des outils de chaussage
Boutique d'éclairage domestique|présenter les luminaires et apparier leurs pièces de fixation|Salle des suspensions;Table des abat-jour;Mur des interrupteurs;Stock des montures électriques
Comptoir de poignées et ferrures|vendre les articulations et prises adaptées au mobilier et aux portes|Mur des charnières;Table des poignées;Zone des glissières;Stock des visseries de montage
Magasin de stores et voilages|présenter les mécanismes de fenêtre et préparer les dimensions commandées|Salle des rails témoins;Table des voilages;Mur des tringles;Stock des cordons et poids
Showroom de cuisines démontables|présenter les caissons de cuisine et préparer leurs ensembles de fixation|Zone des caissons ouverts;Table des façades;Mur des plans de travail;Bureau des assemblages de cuisine
Magasin de revêtements de sol souples|présenter les dalles et rouleaux avant préparation des lots de pose|Salle des rouleaux de sol;Table des dalles souples;Zone des sous-couches;Stock des profils de transition
Comptoir de panneaux acoustiques|présenter les absorbants domestiques et préparer les fixations correspondantes|Salle des panneaux absorbants;Table des tissus acoustiques;Mur des fixations murales;Stock des cadres de panneau
Magasin de papier peint|sélectionner les raccords et les rouleaux compatibles pour chaque pièce|Mur des lés témoins;Table des raccords;Zone des rouleaux scellés;Stock des brosses de pose
Boutique de miroirs et vitrages décoratifs|présenter les découpes réfléchissantes et protéger les commandes fragiles|Salle des miroirs hauts;Table des découpes;Mur des attaches de cadre;Zone des commandes capitonnées
Comptoir de filtres domestiques|identifier les appareils des clients et fournir les éléments filtrants adaptés|Mur des filtres d'air;Table des cartouches d'eau;Zone des références d'appareil;Stock des joints de filtre
Showroom de rangements modulaires|présenter les armatures de rangement et préparer leurs combinaisons de cases|Salle des montants ouverts;Table des connecteurs;Mur des bacs modulaires;Bureau des plans de rangement
Boutique de modélisme ferroviaire|présenter les modèles réduits et apparier les composants des petits réseaux|Table des voies miniatures;Mur des wagons;Zone des commandes de réseau;Stock des décors réduits
Comptoir de maquettes navales|vendre les pièces de coques miniatures et les outils d'assemblage associés|Table des couples de coque;Mur des accastillages miniatures;Zone des voiles réduites;Stock des boîtes de maquette
Boutique de jeux de rôle sur table|présenter les règles et accessoires de jeu pour les groupes de joueurs|Mur des livres de règles;Table des plans de jeu;Zone des dés et jetons;Stock des écrans de meneur
Magasin de puzzles et casse-têtes|présenter les mécanismes ludiques et les boîtes classées par difficulté|Table des puzzles ouverts;Mur des casse-têtes;Zone des tapis de tri;Stock des boîtes complètes
Boutique de matériaux de beaux-arts|vendre les pigments et supports en séparant les produits fragiles|Mur des châssis;Table des pinceaux;Zone des pigments fermés;Stock des papiers épais
Comptoir de céramique de loisir|préparer les terres et outils destinés à de petits travaux amateurs|Table des terres emballées;Mur des outils de modelage;Zone des moules;Stock des boîtes de faïence
Boutique de fournitures de calligraphie|apparier les encres et plumes aux papiers des clients|Table des plumes;Mur des papiers lisses;Zone des encres bouchées;Stock des règles de traçage
Magasin d'accessoires photographiques|présenter les supports et protections destinés aux appareils photographiques|Mur des trépieds;Table des sacs photo;Zone des filtres optiques;Stock des raccords d'appareil
Comptoir d'instruments à cordes|présenter les instruments et vérifier leurs accessoires avant vente|Salle des instruments suspendus;Table des cordes;Zone des étuis;Stock des supports de musique
Boutique de percussions|présenter les surfaces de frappe et composer les ensembles demandés|Salle des fûts;Table des baguettes;Mur des peaux de tambour;Stock des pièces de fixation
Magasin d'accessoires pour vélos|apparier les pièces d'équipement aux cadres et usages des clients|Mur des porte-bagages;Table des éclairages vélo;Zone des sièges;Stock des câbles et attaches
Comptoir de bagagerie de randonnée|présenter les sacs et répartir leurs accessoires de portage|Mur des sacs à dos;Table des sangles;Zone des housses de pluie;Stock des boucles de remplacement
Boutique de matériel d'orientation|présenter les cartes et instruments de terrain aux randonneurs|Table des cartes pliées;Mur des boussoles;Zone des porte-cartes;Stock des carnets étanches
Magasin d'équipement de camping léger|présenter les abris et ustensiles transportables sans créer de ravitaillement automatique|Salle des toiles de tente;Table des réchauds démontés;Zone des matelas roulés;Stock des haubans
Comptoir de cordages de plein air|vendre les cordes et préparer les longueurs associées aux amarrages|Mur des bobines de corde;Table des nœuds témoins;Zone des attaches;Stock des sacs de cordage
Boutique de protections de skating|ajuster les protections et présenter les accessoires de roulement|Banc des genouillères;Table des roues;Mur des casques;Stock des sangles de protection
Magasin de matériel de pêche à la mouche|préparer les ensembles de ligne et les fournitures de montage de mouches|Mur des cannes fines;Table des soies;Zone des plumes de montage;Stock des boîtes à mouches
Comptoir de protections de navigation|présenter les équipements personnels destinés à la sortie en bateau|Salle des gilets flottants;Table des attaches;Mur des sacs étanches;Stock des housses de pont
Boutique d'accessoires équestres|apparier les harnachements aux mesures consignées par les cavaliers|Salle des tapis de selle;Table des mors;Mur des longes;Stock des boucles équestres
Magasin de pièces de trottinettes|identifier les châssis et vendre les éléments de remplacement compatibles|Mur des roues de trottinette;Table des poignées;Zone des freins;Stock des platines de fixation
Boutique de graines potagères|conserver les lots de semences et guider leur choix selon les jardins|Mur des sachets de graines;Table des calendriers de semis;Zone des boîtes de conservation;Stock des enveloppes de lot
Comptoir d'irrigation domestique|composer des ensembles de tuyaux et raccords pour petits jardins|Mur des tuyaux souples;Table des goutteurs;Zone des programmateurs déposés;Stock des raccords d'eau
Magasin de composteurs domestiques|présenter les contenants et accessoires de tri pour jardins et balcons|Salle des composteurs démontés;Table des aérateurs;Mur des seaux de tri;Stock des panneaux de bac
Boutique d'outils de taille|présenter les outils de coupe horticole et leurs pièces d'entretien|Mur des sécateurs;Table des scies de branche;Zone des perches;Stock des fourreaux de lame
Comptoir d'accessoires apicoles|fournir les petits équipements de manipulation et de protection des ruches|Salle des voiles de protection;Table des lève-cadres;Mur des cadres de ruche;Stock des boîtes de transport
Magasin de nichoirs et mangeoires|présenter les abris pour oiseaux et préparer les lots de montage|Mur des nichoirs;Table des pièces de fixation;Zone des mangeoires;Stock des panneaux de toit
Boutique de plantes aquatiques domestiques|conserver les contenants de présentation et fournir les accessoires de petits bassins|Salle des bacs de présentation;Table des paniers de plante;Zone des pompes arrêtées;Stock des gaines de bassin
Comptoir de mobilier de jardin pliant|présenter les articulations et préparer les lots transportables de mobilier extérieur|Salle des tables pliantes;Table des charnières;Mur des coussins extérieurs;Stock des sacs de rangement
Magasin de clôtures de jardin|composer les panneaux et accessoires correspondant aux parcelles des clients|Mur des treillis;Table des attaches de poteau;Zone des portillons démontés;Stock des piquets de clôture
Boutique d'accessoires de serre|préparer les petits équipements de ventilation et d'attache horticole|Salle des ouvrants de serre;Table des clips de film;Zone des ombrières;Stock des attaches de culture
Comptoir de radios de terrain|présenter les récepteurs portables et leurs accessoires de transport|Table des postes radio;Mur des antennes démontées;Zone des casques d'écoute;Stock des boîtiers de piles
Boutique de composants électroniques amateurs|vendre les petites pièces identifiées pour assemblages non industriels|Mur des tiroirs de composants;Table des plaques d'essai;Zone des connecteurs;Stock des bobines de fil
Magasin d'accessoires de réseau domestique|apparier les câbles et boîtiers aux installations privées des clients|Table des prises de réseau;Mur des câbles classés;Zone des boîtiers ouverts;Stock des fixations de câble
Comptoir de claviers adaptés|présenter les interfaces de saisie et vérifier leur ergonomie au comptoir|Table des grands claviers;Salle des touches contrastées;Zone des appuis de poignet;Stock des cordons d'interface
Boutique de supports numériques archivables|présenter les contenants de stockage et les protections de supports privés|Mur des supports vierges;Table des pochettes antistatiques;Zone des boîtes d'archive;Stock des câbles de lecture
Magasin de consommables d'impression|identifier les appareils et constituer les lots de papier et d'encre|Mur des cartouches emballées;Table des ramettes;Zone des références d'imprimante;Stock des feuilles de spécialité
Comptoir de connectique audiovisuelle|apparier les connecteurs et rallonges aux appareils apportés|Table des adaptateurs audio;Mur des câbles vidéo;Zone des fiches démontées;Stock des rouleaux de gaine
Boutique de lampes de lecture|présenter les éclairages de tâche et leurs réglages mécaniques|Salle des lampes articulées;Table des pinces de fixation;Zone des abat-jour opaques;Stock des interrupteurs
Magasin de rangements de médias|présenter les contenants destinés aux disques et documents audiovisuels|Mur des casiers de disques;Table des pochettes;Zone des boîtes de bobines;Stock des étiquettes de média
Comptoir de mobilier informatique réglable|présenter les plans de travail et articulations pour postes domestiques|Salle des plateaux réglables;Table des bras d'écran;Mur des repose-pieds;Stock des pièces de réglage
Boutique de balances de cuisine|présenter les appareils de mesure domestique et accessoires de pesée|Table des balances;Mur des bols de pesée;Zone des masses témoins;Stock des boîtiers de protection
Comptoir de contenants alimentaires réutilisables|vendre les contenants vides et préparer leurs ensembles de fermeture|Mur des bocaux vides;Table des couvercles;Zone des boîtes empilées;Stock des joints alimentaires
Boutique d'ustensiles de pâtisserie|présenter les moules et outils manuels pour préparations domestiques|Mur des moules à gâteau;Table des douilles;Zone des plaques de cuisson;Stock des cercles de pâtisserie
Magasin d'articles de conservation domestique|présenter les accessoires de rangement et d'emballage de réserves privées|Table des bocaux hermétiques;Mur des sacs de conservation;Zone des boîtes graduées;Stock des pinces de fermeture
Comptoir de vaisselle de collectivité|préparer les séries de couverts et contenants pour cantines et associations|Salle des plateaux empilés;Table des couverts;Mur des pichets;Stock des casiers de vaisselle
Boutique d'ustensiles de cuisson extérieure|présenter les grilles et pièces de cuisson démontables pour jardins|Salle des grilles;Table des pinces longues;Zone des plaques de foyer;Stock des protections de transport
Magasin de brosses et entretien manuel|présenter les outils de nettoyage sans mélange de produits ouverts|Mur des brosses;Table des manches;Zone des chiffons;Stock des seaux de service
Comptoir de fournitures de réparation textile|vendre les pièces de reprise destinées à prolonger les vêtements|Table des pièces thermocollantes;Mur des fils de reprise;Zone des aiguilles;Stock des fermetures de vêtement
Boutique d'emballages de réemploi|trier les contenants retournés et préparer les lots réutilisables propres|Salle des caisses vides;Table des calages;Zone des sacs rapportés;Stock des sangles d'emballage
Magasin d'accessoires pour animaux âgés|présenter les équipements de repos et de transport adaptés aux animaux domestiques|Salle des coussins bas;Table des harnais souples;Zone des rampes amovibles;Stock des housses lavables
`],
  ['culture', 'Loisirs et culture', 'civic', `
Maison de mémoire orale|recueillir les témoignages enregistrés et préparer leur consultation locale|Cabine d'entretien sonore;Bureau des transcriptions orales;Salle des postes d'écoute;Stock des supports de témoignage
Centre de conservation de cartes postales|classer les images de correspondance et conserver leurs supports fragiles|Table des cartes reçues;Bureau des lieux représentés;Salle des pochettes de conservation;Stock des boîtes chronologiques
Archives de photographie de quartier|organiser les négatifs et documenter les rues représentées sur les tirages|Table des négatifs;Bureau des rues photographiées;Salle des tirages témoins;Stock des enveloppes d'archive
Atelier patrimonial de marionnettes|conserver les corps articulés et réparer les commandes de manipulation|Salle des marionnettes suspendues;Établi des articulations;Table des costumes miniatures;Stock des commandes de jeu
Réserve de costumes de spectacle|trier les ensembles scéniques et maintenir leurs éléments associés|Salle des portants de scène;Table des accessoires de costume;Zone des retouches scéniques;Stock des housses de production
Maison des décors miniatures|conserver les maquettes de scène et préparer leur exposition|Table des maquettes de plateau;Salle des vitrines de décor;Zone des pièces détachées;Stock des boîtes de transport
Centre de restauration de livres illustrés|réparer les pages imprimées fragiles en conservant l'ordre des images|Table des cahiers illustrés;Établi des déchirures;Zone des papiers de renfort;Stock des boîtes de livre
Atelier de gravure d'art|préparer les matrices et les tirages d'estampes dans un circuit sec|Table des plaques à graver;Établi des outils d'incision;Zone des épreuves imprimées;Stock des papiers d'estampe
Maison de l'estampe populaire|présenter les images imprimées et documenter leurs techniques de reproduction|Salle des gravures populaires;Table des matrices anciennes;Bureau des catalogues d'image;Stock des chemises d'estampe
Centre de conservation de sculptures|documenter les assemblages sculptés et stabiliser leurs supports d'exposition|Salle des socles;Établi des assemblages démontés;Table des fiches de sculpture;Stock des protections de volume
Atelier de mosaïque patrimoniale|trier les tesselles et reconstruire les panneaux documentés|Table des tesselles;Établi des panneaux;Zone des relevés de motif;Stock des fragments identifiés
Maison des métiers du papier|montrer les pliages et conserver les outils manuels du papier|Table des fibres sèches;Salle des pliages;Établi des outils de papier;Stock des feuilles façonnées
Conservatoire de partitions|classer les éditions musicales et préparer les documents pour consultation|Table des partitions reçues;Bureau des catalogues musicaux;Salle des pupitres de lecture;Stock des chemises de partition
Centre d'écoute de musique enregistrée|organiser la consultation de supports audio en comparant leurs modes de lecture|Salle des postes d'écoute;Table des disques;Zone des lecteurs démontés;Stock des pochettes sonores
Atelier de fabrication de décors sonores|préparer les accessoires de bruitage et enregistrer leurs sons en cabine|Salle des accessoires de bruitage;Cabine d'enregistrement des effets;Table des séquences sonores;Stock des objets de bruitage
Maison de la voix parlée|enregistrer les lectures et préparer les espaces de répétition de parole|Cabine de lecture;Salle des textes de diction;Bureau de montage des paroles;Stock des supports de lecture
Studio de doublage artisanal|associer les prises de voix aux images et préparer les versions linguistiques|Cabine des voix doublées;Bureau des textes synchronisés;Table des écrans témoins;Stock des dossiers de production
Centre de sous-titrage culturel|préparer les textes d'accompagnement d'œuvres audiovisuelles patrimoniales|Salle de visionnage de films;Bureau des minutages;Table des versions sous-titrées;Stock des copies de consultation
Atelier de stop-motion|animer des objets image par image sur des plateaux de petite taille|Salle des plateaux miniatures;Table des objets animables;Cabine de capture image;Stock des accessoires de séquence
Maison du documentaire local|monter les enregistrements de terrain et documenter leurs lieux de tournage|Bureau des carnets de tournage;Salle de montage documentaire;Table des prises de terrain;Stock des copies montées
Centre de cartographie culturelle|associer les pratiques et lieux culturels à des relevés documentés|Table des plans culturels;Bureau des enquêtes de pratique;Salle des panneaux de parcours;Stock des cartes annotées
Maison des correspondances d'écrivains|conserver les lettres et préparer leur lecture avec les documents associés|Table des lettres classées;Bureau des index d'auteur;Salle des postes de lecture;Stock des enveloppes protégées
Atelier de traduction littéraire|comparer les éditions et préparer les traductions de textes culturels|Salle des ouvrages comparés;Bureau des glossaires littéraires;Table des manuscrits traduits;Stock des éditions de travail
Centre de livres sonores|préparer la lecture enregistrée et les copies consultables de livres accessibles|Cabine des narrateurs;Table des textes annotés;Bureau du montage des chapitres;Stock des supports de livre sonore
Maison des jeux traditionnels|conserver les plateaux et documenter les règles des jeux populaires|Salle des plateaux anciens;Table des pièces de jeu;Bureau des règles recueillies;Stock des boîtes de jeu patrimonial
Atelier de restauration de jouets patrimoniaux|documenter les jouets anciens et conserver leurs éléments d'origine|Table des jouets inventoriés;Établi des assemblages historiques;Salle des vitrines de jouet;Stock des fragments identifiés
Centre d'histoire de l'affiche|classer les grands imprimés et présenter leurs techniques graphiques|Salle des affiches déroulées;Table des feuilles fragiles;Bureau des catalogues d'affiche;Stock des tubes d'image
Maison des enseignes anciennes|documenter les lettres de façade et conserver les panneaux déposés|Salle des panneaux d'enseigne;Table des caractères anciens;Bureau des relevés de façade;Stock des supports de lettre
Atelier de conservation de vitraux|documenter les verrières patrimoniales et conserver les panneaux déposés|Table des relevés de verrière;Établi des assemblages patrimoniaux;Salle des panneaux protégés;Stock des fragments de couleur
Centre de mémoire des migrations|conserver les récits et objets familiaux déposés par les habitants|Salle des valises documentées;Cabine des récits familiaux;Bureau des parcours migratoires;Stock des objets confiés
Maison des pratiques culinaires patrimoniales|documenter les recettes et ustensiles anciens sans fournir de cuisine fonctionnelle|Salle des ustensiles anciens;Table des carnets de recette;Bureau des témoignages culinaires;Stock des contenants de collection
Atelier de conservation de textiles|décrire les fibres anciennes et soutenir les pièces fragiles pour exposition|Table des tissus déroulés;Établi des supports textiles;Salle des mannequins de conservation;Stock des housses patrimoniales
Centre de mémoire du travail domestique|présenter les tâches et outils du foyer dans un parcours documenté|Salle des outils de lessive;Table des carnets domestiques;Bureau des routines recueillies;Stock des objets de ménage anciens
Maison des métiers de la rue|conserver les accessoires de métiers ambulants et leurs récits de travail|Salle des chariots de métier;Table des outils ambulants;Bureau des itinéraires anciens;Stock des enseignes portatives
Centre de lecture de bandes dessinées|organiser les collections graphiques et préparer leur consultation protégée|Salle des albums;Table des planches originales;Bureau des index de série;Stock des pochettes de dessin
Atelier de fanzines|composer les publications locales et assembler leurs petits tirages|Table des textes de fanzine;Bureau des mises en page;Zone d'assemblage des fascicules;Stock des exemplaires agrafés
Maison de l'art postal|classer les correspondances graphiques et documenter leurs réseaux d'échange|Table des enveloppes décorées;Salle des cartes reçues;Bureau des catalogues d'envoi;Stock des pochettes postales
Centre d'exposition de céramique|présenter les pièces de céramique et conserver leurs fragments de comparaison|Salle des vitrines de céramique;Table des tessons témoins;Bureau des provenances de pièce;Stock des protections de poterie
Atelier de restauration de mobilier patrimonial|documenter les assemblages de meuble et soutenir les pièces anciennes|Salle des meubles déposés;Établi des assemblages de bois;Table des relevés de meuble;Stock des éléments d'origine
Maison du dessin d'architecture|classer les esquisses et présenter les dessins de conception de bâtiments|Salle des plans d'architecte;Table des esquisses;Bureau des notices de projet;Stock des rouleaux de dessin
Centre de mémoire des transports quotidiens|conserver les documents et petits objets des trajets ordinaires|Salle des tickets anciens;Table des carnets de trajet;Bureau des lignes documentées;Stock des accessoires de voyage
Atelier de scénographie d'exposition|préparer les socles et parcours d'une exposition sans ouvrir un musée simulé|Table des plans de visite;Salle des socles démontés;Établi des supports d'objet;Stock des panneaux d'exposition
Maison des cartes et atlas historiques|comparer les représentations anciennes des territoires et protéger leurs reliures|Salle des atlas ouverts;Table des cartes pliées;Bureau des index géographiques;Stock des boîtes de carte
Centre de mémoire des jardins|documenter les plans et outils des jardins disparus ou transformés|Table des plans de jardin;Salle des outils horticoles anciens;Bureau des carnets de plantation;Stock des étiquettes patrimoniales
Atelier de conservation de photographies sur verre|inspecter les plaques fragiles et préparer leur rangement individuel|Table des plaques de verre;Salle des supports de contrôle;Bureau des index photographiques;Stock des étuis de plaque
`],
  ['sports', 'Loisirs et culture', 'service', `
Salle de pratique du tir à l'arc|organiser la préparation d'arcs et l'entraînement en espace fermé sans armes de jeu offertes|Zone des arcs rangés;Salle des cibles démontées;Table des flèches d'exercice;Vestiaire des archers
Salle d'escrime|préparer les pistes et l'équipement de protection des escrimeurs|Salle des pistes d'escrime;Table des protections;Zone des appareils de score;Vestiaire des tireurs
Salle de judo|préparer les tapis et le stockage des tenues pour entraînement de contact|Salle des tatamis;Zone des tapis démontés;Table des ceintures;Vestiaire des judokas
Salle de boxe éducative|organiser les zones d'exercice et le rangement du matériel de protection|Salle des sacs de frappe;Zone des cordes d'exercice;Table des gants;Vestiaire des boxeurs
Salle de gymnastique douce|séparer les exercices au sol du rangement des petits accessoires|Salle des tapis de mobilité;Table des ballons souples;Zone des appuis;Vestiaire des pratiquants
Centre d'entraînement de tennis de table|installer les tables et conserver les accessoires du club|Salle des tables pliantes;Table des raquettes;Zone des séparations de jeu;Vestiaire des pongistes
Salle de badminton|préparer les filets et ranger les volants dans un bâtiment sportif terrestre|Salle des filets démontés;Table des raquettes légères;Zone des volants;Vestiaire des joueurs de badminton
Salle de squash|accueillir les joueurs et entretenir leurs petits équipements sans terrain extérieur inventé|Salle des parois d'entraînement;Table des balles;Zone des raquettes de squash;Vestiaire des joueurs de squash
Salle de danse sportive|préparer les répétitions chorégraphiques et le rangement des accessoires de compétition|Salle de répétition des couples;Table des accessoires de danse;Zone des miroirs protégés;Vestiaire des danseurs sportifs
Salle de yoga associatif|préparer les tapis et les supports d'exercice d'une association|Salle des tapis roulés;Table des supports de posture;Zone des sangles d'exercice;Vestiaire des adhérents
Atelier de préparation de patins|ajuster les protections et entretenir les trains de roues avant les sorties du club|Établi des patins;Table des roulements;Zone des protections de poignet;Vestiaire des patineurs
Maison de club de course d'orientation|préparer les cartes et balises transportables pour des séances de terrain|Table des cartes de course;Zone des balises pliées;Bureau des parcours d'orientation;Vestiaire des orienteurs
Local de club de randonnée|préparer les sacs collectifs et classer les itinéraires terrestres|Salle des sacs de randonnée;Table des cartes de marche;Zone des bâtons;Vestiaire des randonneurs
Maison de club de marche nordique|ranger les bâtons et préparer les groupes de marche par itinéraire|Salle des bâtons nordiques;Table des sangles de main;Bureau des circuits de marche;Vestiaire des marcheurs
Salle de préparation au cyclotourisme|vérifier les bicyclettes et préparer les équipements des sorties touristiques|Établi des bicyclettes;Table des sacoches;Bureau des itinéraires cyclistes;Vestiaire des cyclotouristes
Local de préparation de vélo de montagne|contrôler les protections et réparer les petits équipements des sorties de terrain|Établi des roues de terrain;Table des casques;Zone des protections de cadre;Vestiaire des vététistes
Maison des officiels de compétition|préparer les documents de contrôle et les équipements des arbitres|Bureau des feuilles de match;Table des chronomètres;Zone des brassards;Vestiaire des officiels
Centre de préparation de chronométrage sportif|assembler les postes de mesure et organiser leur transport pour les compétitions|Banc des chronomètres;Table des câbles de ligne;Bureau des listes de départ;Stock des mallettes de mesure
Salle d'entraînement de force associative|préparer les exercices de résistance et conserver les accessoires du club|Salle des supports de charge;Table des sangles de levage;Zone des disques démontés;Vestiaire des athlètes de force
Salle de préparation physique de grimpe|préparer les supports d'exercice de mains et ranger le matériel d'escalade|Salle des prises d'exercice;Table des chaussons;Zone des cordes rangées;Vestiaire des grimpeurs
Atelier de réparation de filets sportifs|reprendre les mailles des filets et préparer leur restitution aux clubs|Table des filets déployés;Établi des cordelettes;Zone des poteaux démontés;Stock des filets réparés
Maison de club de pétanque|conserver les équipements et préparer les inscriptions des équipes locales|Table des boules;Bureau des équipes de pétanque;Zone des cercles de lancement;Vestiaire du club de pétanque
Local de club de palets|préparer les plateaux et classer les jeux utilisés lors des rencontres|Salle des planches de palets;Table des jeux métalliques;Bureau des rencontres;Stock des plateaux pliés
Salle de préparation d'aviron en intérieur|entretenir les ergomètres et ranger les accessoires d'entraînement sans créer de rivière|Salle des ergomètres démontés;Table des poignées;Zone des accessoires de rame;Vestiaire des rameurs
Local de club de kayak terrestre|stocker les pagaies et équipements du club sans inventer d'accès navigable|Salle des pagaies;Table des gilets;Zone des jupes de kayak;Vestiaire des kayakistes
Maison de club de voile terrestre|préparer les voiles et accessoires de navigation dans un local raccordé à la route|Salle des voiles pliées;Table des poulies;Zone des sacs étanches;Vestiaire des équipages
Salle d'entraînement d'équilibre|préparer les appuis et exercices de stabilité pour les groupes du club|Salle des planches d'équilibre;Table des supports bas;Zone des tapis de réception;Vestiaire des groupes d'équilibre
Centre de préparation de handisport|adapter les équipements de pratique aux besoins enregistrés des adhérents|Établi des supports adaptés;Salle des fauteuils d'exercice;Table des sangles;Vestiaire accessible des pratiquants
Salle de pratique de boccia|préparer les rampes et équipements de lancer adaptés en salle|Salle des rampes de boccia;Table des balles souples;Zone des supports de bras;Vestiaire des joueurs de boccia
Maison de bénévoles de course pédestre|préparer les postes temporaires et les dossiers des bénévoles de compétition|Bureau des affectations bénévoles;Table des dossards;Zone des barrières démontées;Stock des caisses de poste
Salle de répétition de sport chorégraphié|préparer les accessoires et les séquences de déplacement collectif|Salle des répétitions de groupe;Table des rubans;Zone des accessoires de figure;Vestiaire des équipes chorégraphiques
Atelier d'entretien de protections sportives|nettoyer et vérifier les équipements rapportés par les clubs|Table des protections reçues;Zone des tissus de protection;Établi des attaches;Stock des équipements contrôlés
Local de club de disc-golf|classer les disques et préparer les cibles transportables pour les rencontres|Table des disques;Salle des paniers démontés;Bureau des feuilles de parcours;Stock des sacs de disque
Maison de club de course à pied|préparer les sorties collectives et conserver les accessoires d'entraînement|Bureau des groupes de course;Table des balises de séance;Zone des gilets;Vestiaire des coureurs
Centre de prêt de matériel sportif adapté|contrôler les retours et préparer les équipements réservés par les associations|Comptoir des réservations adaptées;Établi des réglages de prêt;Zone des retours de matériel;Stock des kits accessibles
`],
  ['administration', 'Administration et communauté', 'civic', `
Office communal de médiation de voisinage|recevoir les parties séparément et préparer les accords de médiation écrits|Salle des entretiens séparés;Bureau des accords de voisinage;Table des plans de limite;Archives des dossiers clos
Guichet de domiciliation administrative|recevoir le courrier des personnes domiciliées et conserver leurs demandes|Guichet des identités;Salle des casiers de courrier;Bureau des attestations;Archives des dossiers de domiciliation
Maison des dossiers de logement|préparer les demandes de logement et suivre les pièces fournies par les habitants|Guichet des demandes locatives;Bureau des pièces de dossier;Salle des plans de logement;Archives des candidatures
Office d'attribution de jardins partagés|classer les demandes de parcelles et organiser les accès des jardiniers|Guichet des parcelles demandées;Table des plans de jardin;Bureau des clefs de parcelle;Archives des conventions horticoles
Centre de dossiers d'urbanisme|recevoir les plans de travaux et préparer leur examen administratif|Table des plans déposés;Bureau des autorisations de travaux;Salle des maquettes de parcelle;Archives des permis
Office des relevés cadastraux|conserver les plans de parcelles et documenter leurs modifications|Salle des plans cadastraux;Table des relevés de bornes;Bureau des références de parcelle;Archives des mutations
Maison des concessions funéraires|classer les droits d'emplacement et préparer les documents remis aux familles|Guichet des familles;Table des plans de concessions;Bureau des droits d'emplacement;Archives des actes funéraires
Centre des dossiers d'état civil|recevoir les demandes d'acte et protéger les registres de naissance et de mariage|Guichet des actes demandés;Bureau des vérifications d'identité;Salle des registres civils;Archives des copies certifiées
Office des associations sportives|classer les demandes de créneau et les conventions de mise à disposition|Guichet des clubs;Table des calendriers sportifs;Bureau des conventions de salle;Archives des dossiers de club
Centre des réservations de salles publiques|attribuer les créneaux de salles et préparer leurs états de remise|Guichet des demandes de salle;Table des plannings d'occupation;Bureau des états de remise;Archives des conventions de réservation
Office des marchés municipaux|préparer les consultations d'achat et conserver leurs pièces de comparaison|Salle des offres reçues;Table des bordereaux de prix;Bureau des dossiers d'achat;Archives des contrats municipaux
Maison des recours administratifs|recevoir les demandes de réexamen et organiser les documents des décisions contestées|Guichet des recours;Salle des dossiers contradictoires;Bureau des décisions réexaminées;Archives des pièces de recours
Centre de consultation des enquêtes publiques|présenter les dossiers de projet et classer les observations des habitants|Salle des projets consultables;Table des registres d'observation;Bureau des synthèses d'enquête;Archives des contributions
Office de suivi des bâtiments communaux|classer les défauts signalés et préparer les tournées de maintenance|Guichet des signalements de bâtiment;Table des plans de locaux;Bureau des ordres de maintenance;Archives des contrôles d'équipement
Maison des dossiers d'énergie des foyers|aider au classement des demandes d'amélioration énergétique et des devis|Guichet des factures domestiques;Table des plans isolants;Bureau des dossiers d'aide;Archives des devis de rénovation
Centre de coordination des collectes de quartier|organiser les calendriers de ramassage et traiter les demandes de contenants|Guichet des calendriers de collecte;Table des secteurs de ramassage;Bureau des demandes de bac;Archives des tournées
Office de demandes de mobilier urbain|préparer les dossiers de remplacement des petits équipements de rue|Guichet des équipements signalés;Table des plans de mobilier;Bureau des ordres de pose;Archives des fiches de rue
Maison des conseils de quartier|préparer les réunions et conserver les propositions formulées par les habitants|Salle des conseils;Table des cartes de quartier;Bureau des propositions citoyennes;Archives des comptes rendus
Centre des budgets participatifs|classer les projets proposés et préparer leur examen public|Guichet des propositions de projet;Table des coûts estimés;Salle des présentations publiques;Archives des votes de projet
Office des jumelages communaux|préparer les échanges de délégations et conserver leurs dossiers de programme|Salle des délégations reçues;Table des programmes d'échange;Bureau des correspondances communales;Archives des conventions de jumelage
Maison des dons de matériel associatif|enregistrer les biens donnés et organiser leurs affectations documentées|Guichet des dons déclarés;Table des inventaires de matériel;Bureau des bénéficiaires;Archives des actes de remise
Centre d'inscription des bénévoles|consigner les disponibilités et préparer les affectations demandées par les associations|Guichet des bénévoles inscrits;Table des disponibilités;Bureau des missions associatives;Archives des fiches d'inscription
Office des transports scolaires|préparer les dossiers d'inscription et les listes des arrêts utilisés|Guichet des familles scolaires;Table des circuits de ramassage;Bureau des listes d'arrêt;Archives des inscriptions de transport
Maison des démarches de mobilité réduite|recevoir les demandes d'accès et préparer les pièces de transport adapté|Guichet des demandes accessibles;Table des trajets adaptés;Bureau des pièces justificatives;Archives des dossiers de mobilité
Centre de dossiers de voirie|classer les demandes d'occupation de rue et les déviations temporaires|Table des emprises de voirie;Bureau des occupations temporaires;Salle des panneaux de déviation;Archives des autorisations de rue
Office des signalements d'éclairage public|classer les points lumineux défaillants et organiser leur suivi de maintenance|Guichet des lampes signalées;Table des cartes d'éclairage;Bureau des ordres de dépannage;Archives des fiches de luminaire
Maison des dossiers de bruit de voisinage|classer les plaintes et préparer les visites de constat documentées|Salle des récits de nuisances;Table des relevés sonores;Bureau des convocations;Archives des dossiers de bruit
Centre des demandes d'occupation commerciale|organiser les demandes de terrasse et d'étal sans simuler de commerce actif|Guichet des commerçants;Table des plans de terrasse;Bureau des autorisations d'étal;Archives des conventions commerciales
Office des licences d'événement local|préparer les plans et dossiers d'autorisation des petits événements publics|Guichet des organisateurs;Table des plans d'événement;Bureau des dossiers de sécurité;Archives des autorisations de fête
Maison des projets de patrimoine bâti|classer les demandes de restauration et comparer les plans des bâtiments anciens|Table des relevés patrimoniaux;Salle des matériaux témoins;Bureau des dossiers de restauration;Archives des projets protégés
Centre d'accueil des nouveaux habitants|préparer les dossiers d'installation et orienter les personnes vers les services existants|Guichet des arrivées;Table des plans d'accès aux services;Bureau des dossiers d'installation;Archives des demandes d'accueil
Office des déclarations d'animaux domestiques|recevoir les déclarations civiles et classer les documents des propriétaires|Guichet des propriétaires;Table des documents d'animal;Bureau des déclarations civiles;Archives des dossiers animaliers
Maison des démarches de succession communale|préparer les listes de biens confiés à la commune et leurs dossiers de remise|Guichet des ayants droit;Table des inventaires successoraux;Bureau des pièces de remise;Archives des dossiers de biens
Centre des objets trouvés documentés|identifier les objets rapportés et consigner leur restitution au propriétaire|Guichet des objets déposés;Table des descriptions d'objet;Bureau des demandes de restitution;Stock des objets étiquetés
Office des inscriptions électorales|préparer les demandes de liste et préserver les dossiers de justification|Guichet des inscriptions de vote;Table des justificatifs de domicile;Bureau des listes électorales;Archives des demandes de radiation
Maison des procurations civiles|recevoir les mandats et vérifier les pièces remises pour représentation administrative|Guichet des mandats;Salle des vérifications de signature;Bureau des actes de représentation;Archives des procurations
Centre de dossiers des cantines publiques|classer les inscriptions et préparer les listes de repas sans produire de nourriture|Guichet des inscriptions de cantine;Table des calendriers de repas;Bureau des listes de convives;Archives des dossiers alimentaires
Office des demandes d'eau des immeubles|recevoir les signalements et documents de compteur sans créer de réseau aquatique|Guichet des abonnements d'eau;Table des plans de compteur;Bureau des signalements de fuite;Archives des dossiers de branchement
Maison des démarches de restitution de logement|préparer les états de sortie et les pièces de remise des locaux communaux|Salle des états de sortie;Table des plans de logement rendu;Bureau des clefs restituées;Archives des dossiers de remise
Centre de documentation des décisions communales|classer les actes publiés et préparer leur consultation par les habitants|Salle des actes consultables;Table des index de décision;Bureau des copies demandées;Archives des recueils communaux
`]
];

const expected = {services:60, retail:70, culture:45, sports:35, administration:40};
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const resourceFor = kind => ({table:'wood',desk:'scrap',shelf:'wood',wardrobe:'wood',bench:'wood',sofa:'wood',workbench:'scrap',sink:'scrap',electricalRack:'scrap',machine:'scrap',steelTable:'scrap',crate:'scrap',plantTray:'wood',fridge:'food',washer:'scrap',dishRack:'wood',palletStack:'wood'})[kind] || 'scrap';
function furniture(label, group) {
  const s = fold(label);
  if (/lavage|bacs de nettoyage|nettoyage des couverts|chambre noire des bains/.test(s)) return 'sink';
  if (/vestiaire|housses|tissus|tenues|nappes|draps|linges|coussins|tapis de selle|portants/.test(s)) return 'wardrobe';
  if (/electrique|controleurs|connecteurs|appareils de score|prises de reseau|boitiers ouverts/.test(s)) return 'electricalRack';
  if (/etabli|banc des|banc de|zone des outils/.test(s)) return 'workbench';
  if (/bureau|guichet|cabine|lecture|chronometres/.test(s)) return 'desk';
  if (/table|plans|maquettes|releves|lettres|cartes|rouleaux|plaques|partitions/.test(s)) return 'table';
  if (/banc d'essayage|banc des genouilleres|appuis/.test(s)) return 'bench';
  if (/stock|zone des retours|caisses|objets etiquetes|boites|pieces detachees/.test(s)) return 'crate';
  if (group==='sports' && /salle/.test(s)) return 'bench';
  return 'shelf';
}
function describeRoom(room,mission,group) {
  const s=fold(room),subject=room.toLocaleLowerCase('fr');
  if (/vestiaire/.test(s)) return `Ranger les vêtements et sacs des participants dans ${subject}, à l'écart des portes de séance ; le mobilier abandonné ne procure aucun entraînement.`;
  if (/archives|rangement|rayonnage|stock|casier/.test(s)) return `Classer les éléments de ${subject} après leur identification, pour ${mission} ; les contenants gardent leurs identités et leurs prélèvements au retour.`;
  if (/etabli|banc de|banc des/.test(s)) return `Poser et examiner les pièces de ${subject} pour ${mission}, avec un dégagement d'approche devant le meuble ; les appareils sont hors service.`;
  if (/bureau|guichet/.test(s)) return `Examiner les demandes et documents de ${subject} pour ${mission}, sans déplacer les dossiers dans le couloir ; aucun droit ni service n'est accordé par la visite.`;
  if (/cabine|ecoute|visionnage/.test(s)) return `Isoler le contrôle de ${subject} du passage de livraison pour ${mission} ; les appareils de consultation arrêtés restent du mobilier récupérable.`;
  if (/chambre noire|lavage|nettoyage/.test(s)) return `Séparer les opérations humides de ${subject} des documents et emballages, pour ${mission} ; eau et produits laissés sont des traces, sans traitement simulé.`;
  if (group==='sports'&&/^salle/.test(s))return `Réserver la zone de pratique de ${subject} et ranger les accessoires sur ses bords, pour ${mission} ; la pièce explorable ne simule pas la discipline sportive.`;
  return `Disposer les éléments de ${subject} sur un support identifiable pour ${mission}, en conservant l'accès depuis le couloir ; aucune production ni prestation autonome ne fonctionne.`;
}
const descriptions = {
  services: {entry:'Sas de remise des objets confiés',reserve:'Réserve des emballages de restitution',material:'Maçonnerie réparée, menuiseries anciennes, couverture de tuiles et bandes de zinc sur le volume de service.',flow:'Les objets reçus passent du comptoir au diagnostic, puis à la préparation et au classement des retours ; les visiteurs ne traversent pas le stock.',risk:'Les caisses de clients restées près de la livraison imposent de vérifier le retour avant de charger le sac.',reuse:'La récupération de petites pièces et d’emballages sert à préparer l’entretien des installations de D-17 ; ce lieu ne répare aucun objet à distance.'},
  retail: {entry:'Comptoir des commandes et retours',reserve:'Réserve des commandes emballées',material:'Brique et parements enduits, grande façade de vitrine, couverture commerciale réparée à lés de zinc.',flow:'Le visiteur rejoint la présentation et les échantillons ; les lots emballés rejoignent l’accès arrière sans être posés dans le passage public.',risk:'Le stock emballé peut remplir le sac avant la dernière salle ; le retour vers la route doit rester praticable.',reuse:'Les présentoirs et pièces récupérées peuvent alimenter les travaux de D-17 après un transport réel ; aucune vente ni revenu ne fonctionne dans le lieu abandonné.'},
  culture: {entry:'Accueil des dépôts et consultations',reserve:'Réserve des emballages de conservation',material:'Maçonnerie civile ancienne, fenêtres hautes et couverture de tuiles interrompue par un atelier en zinc.',flow:'Les pièces confiées sont identifiées à l’accueil avant leur examen, leur consultation ou leur rangement ; le transport des caisses conserve un axe dégagé.',risk:'Les objets fragiles et dossiers sont des traces narratives ; leurs vitrines ne protègent pas le joueur contre un contact visible.',reuse:'Le bois des supports et les petites pièces des rangements peuvent financer une reconstruction après retour au dépôt ; la collection ne crée aucun bonus culturel.'},
  sports: {entry:'Accueil du club et préparation des séances',reserve:'Réserve des accessoires de séance',material:'Maçonnerie de salle associative, charpente sobre et couverture de service réparée avec panneaux mats.',flow:'Les pratiquants préparaient leur équipement avant la séance et rejoignaient les vestiaires ; les accessoires du club étaient rapportés au stock par l’arrière.',risk:'Les grandes salles rendent les objets lisibles mais ne garantissent pas une fuite si les contacts occupent le raccord d’entrée.',reuse:'Le mobilier et les pièces d’entretien récupérées retournent physiquement à D-17 ; aucun entraînement, score ou aptitude sportive ne s’applique au joueur.'},
  administration: {entry:'Accueil des demandes et orientation',reserve:'Réserve des fournitures de dossier',material:'Brique enduite, baies civiques régulières, couverture de tuiles et reprises de zinc au droit des archives.',flow:'Les demandeurs déposaient leurs pièces au guichet avant examen ; les dossiers clos rejoignaient les archives, et les cartons de fourniture passaient par l’accès arrière.',risk:'Le contenu des dossiers reste une trace du fonctionnement antérieur ; il ne révèle pas les ennemis hors de la vision réelle.',reuse:'Les fournitures et éléments de bureau peuvent soutenir les chantiers après transport ; aucun droit, allocation ou service administratif ne s’active par la visite.'}
};
const records=[];
for (const [group,family,roofFamily,text] of groups) {
  const rows=text.trim().split('\n').map(line=>line.trim()).filter(Boolean);
  if(rows.length!==expected[group])throw Error(group+': '+rows.length+' programmes au lieu de '+expected[group]);
  for(const line of rows){
    const [name,mission,roomsText,...extra]=line.split('|');
    if(!name||!mission||!roomsText||extra.length)throw Error('Ligne auteur incorrecte '+line);
    const special=roomsText.split(';');
    if(special.length!==4||new Set(special).size!==4)throw Error('Quatre salles distinctes requises '+name);
    const index=records.length, id='DW-'+(3251+index),d=descriptions[group];
    // Public and work rooms remain at ground level; small document/stock floors
    // are used only where they suit the former service's circulation.
    const twoLevels=group!=='sports' && (group==='administration'||group==='culture'||index%3===0);
    const levels=twoLevels?[0,1]:[0];
    const layout= group==='retail'?'gallery':group==='sports'?'cross':['axial','offset','cross','gallery'][index%4];
    const roomNames=[d.entry,...special,d.reserve];
    const spaces=roomNames.map((room,i)=>{
      const kind=i===0?'desk':i===5?'crate':furniture(room,group),resource=resourceFor(kind);
      return {id:i===0?'accueil':i===5?'reserve':'usage-'+i,name:room,
        z:twoLevels&&i>=4?1:0,
        usage:i===0?`Recevoir les objets ou documents pour ${mission} et préserver le passage entre entrée et pièces d'usage.`:
          i===5?`Conserver les fournitures et emballages de ${name.toLocaleLowerCase('fr')} à l'écart de la circulation ; le stock récupérable reste fini.`:
          describeRoom(room,mission,group),
        resource,props:[{kind,resource}]};
    });
    const isTown=group!=='sports'||index%4!==0;
    records.push({id,name,family,
      purpose:`Avant l'abandon, ce bâtiment servait à ${mission}. ${d.flow} La spécialisation est portée par ${special.slice(0,3).join(', ').toLocaleLowerCase('fr')}, avec ${special[3].toLocaleLowerCase('fr')} en complément.`,
      architecture:{width:group==='sports'?48+(index%3)*4:30+(index%4)*4,
        height:twoLevels?28+(index%3)*3:36+(index%4)*3,levels,layout,roofFamily,material:d.material},
      spaces,
      access:{public:`Entrée avant dans ${d.entry.toLocaleLowerCase('fr')}, donnant sur l'axe ${layout} puis sur ${special[0].toLocaleLowerCase('fr')}. Les seuils sont des ouvertures physiques.`,
        service:`Accès arrière réservé aux caisses de ${name.toLocaleLowerCase('fr')}, raccordé au même couloir sans traverser les pièces de consultation.`,
        return:`Retour de ${special[2].toLocaleLowerCase('fr')} par le couloir${twoLevels?' et le palier commun':''}, puis l'entrée ou l'ouverture arrière jusqu'à la route réservée.`,width_m:group==='sports'?2.8:group==='retail'?2.6:2.0},
      placement:{mode:isTown?'town':'any',biomes:['meadow','bocage','brownfield'],townKinds:isTown?['bourg','ville','grande-ville']:[]},
      supplies:`Bois des supports, ferraille des pièces et fournitures abandonnées appartiennent aux contenants de ${name.toLocaleLowerCase('fr')}. Chaque contenant reçoit un reliquat fini entre 3 et 12 unités, conservé après fouille et sauvegarde. Multiplier les décors ne crée pas de réserve supplémentaire ; aucun ravitaillement ne se produit au retour.`,
      risks:[d.risk,`Le détour par ${special[1].toLocaleLowerCase('fr')} doit être reconnu avant de reprendre la route avec une charge élevée.${twoLevels?' Le palier se contrôle séparément avant la descente.':''}`],
      night:`Les éclairages de ${special[0].toLocaleLowerCase('fr')} sont hors service et décoratifs. Une lampe réellement portée ou posée doit éclairer les portes,${twoLevels?' le palier et':''} l'axe de retour ; les appareils abandonnés ne fournissent ni charge ni halo gratuit.`,
      variants:[`Couverture de ${name.toLocaleLowerCase('fr')} avec reprise de zinc visible au-dessus de ${special[1].toLocaleLowerCase('fr')}, sans changer les réserves du lieu.`,
        `Façade avec ouverture de service différente et stocks groupés près de ${d.reserve.toLocaleLowerCase('fr')}, en préservant les dégagements, l'identité et le budget des contenants.`],
      interactions:[`Explorer ${special[0].toLocaleLowerCase('fr')} puis fouiller ${special[2].toLocaleLowerCase('fr')} en arbitrant la capacité de charge et la longueur du retour.`,d.reuse],
      qa:[`Parcourir l'entrée, ${special[0].toLocaleLowerCase('fr')} et ${special[3].toLocaleLowerCase('fr')} avec le rayon réel du joueur, sans déplacer les objets à travers un mur.`,
        `Vérifier ${twoLevels?'la montée, le palier, la descente et':'chaque porte de salle ainsi que'} le trajet de retour vers l'accès arrière avec les meubles en place.`,
        `Fouiller les contenants de ${special[2].toLocaleLowerCase('fr')}, sortir, sauvegarder et reprendre sans régénérer leurs quantités ni changer leurs identifiants.`,
        `Distinguer la lisibilité des équipements de ${name.toLocaleLowerCase('fr')} des services antérieurs : aucune production, pratique sportive ou prestation n'est annoncée comme active.`],
      story:`Une liste interrompue près de ${special[0].toLocaleLowerCase('fr')}, des étiquettes restées sur ${special[2].toLocaleLowerCase('fr')} et un carton incomplet dans ${special[3].toLocaleLowerCase('fr')} racontent l'arrêt de cette activité. Les anciens usagers ne sont pas des personnages présents.`});
  }
}
if(records.length!==250)throw Error('Lot B incomplet');
const existing=new Set(JSON.parse(fs.readFileSync(path.join(ROOT,'codex-3000/INDEX_3000.json'),'utf8')).entries.map(x=>fold(x.name)));
for(const r of records)if(existing.has(fold(r.name)))throw Error('Nom historique réutilisé '+r.name);
const lot={schemaVersion:1,version:'1.58.0',count:250,fiches:records};
(async()=>{
  const {validateLot}=await import('../validation.mjs');validateLot(lot,'B');
  fs.writeFileSync(DEST,JSON.stringify(lot,null,2)+'\n');
  console.log('Lot B : 250 programmes indépendants DW-3251–3500, '+records.reduce((n,p)=>n+p.spaces.length,0)+' espaces, '+fs.statSync(DEST).size+' octets.');
})().catch(error=>{console.error(error);process.exitCode=1;});
