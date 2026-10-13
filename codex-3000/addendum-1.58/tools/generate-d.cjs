'use strict';
/* Each authored row is an independent civilian programme with three specific
 * process spaces. Shared circulation and support rooms complete its envelope. */
const fs=require('node:fs');
const path=require('node:path');
const groups=[];
function group(domain,sector,family,roof,rows){
  const data=rows.trim().split('\n').map(line=>line.split('|').map(s=>s.trim()));
  for(const r of data)if(r.length!==5)throw Error('Malformed authored programme: '+r.join('|'));
  groups.push({domain,sector,family,roof,rows:data});
}
group('logistique','conditionnement et récupération','Entrepôts et réserves','industrial',`
Maison des caisses réemployables|Inspection des caisses consignées|Reprise des charnières de caisse|Rangement des caisses dépliées|remettre en circulation des emballages de transport dont les pièces cassées étaient séparées des caisses propres
Centre des palettes réparables|Classement des palettes fendues|Remplacement des dés de palette|Empilage des palettes contrôlées|réparer des supports de manutention sans mélanger le bois réutilisable et les déchets de clouage
Halle des bacs navettes|Réception des bacs retournés|Nettoyage des bacs empilables|Préparation des navettes vides|faire revenir les contenants de petite livraison en séparant les retours sales des départs préparés
Dépôt des rolls de livraison|Parc des rolls déformés|Réglage des roulettes de roll|Alignement des cages mobiles|entretenir les cages de distribution et garder leurs circulations larges dégagées
Centre de calage des colis fragiles|Mesure des objets arrivants|Découpe des séparateurs de calage|Essai des coffrets fermés|adapter des emballages à des instruments délicats avant leur expédition plutôt que stocker simplement des cartons
Réserve des couvertures de déménagement|Tri des couvertures revenues|Séchage des protections textiles|Pliage des lots de portage|reconditionner des protections réutilisables dont le circuit humide restait séparé du textile prêt à repartir
Atelier des caisses de voyage technique|Inventaire des appareils confiés|Montage des compartiments rigides|Vérification des sangles de maintien|préparer des coffrets compartimentés pour des équipes de chantier et leurs appareils de mesure
Centre des archives à déplacer|Repérage des boîtes confiées|Conditionnement des dossiers scellés|Chargement des séries ordonnées|assurer un déménagement documentaire avec des séries traçables sans ouvrir un service public d'archives
Halle de préparation des œuvres en transit|Constat des objets emballés|Pose des protections de transport|Attente des caisses numérotées|protéger temporairement des œuvres confiées avec zones d'examen et de fermeture séparées
Maison du regroupement des dons matériels|Réception des dons encombrants|Vérification des lots utilisables|Composition des lots de départ|réunir des biens de première nécessité en distinguant les apports non vérifiés des lots déjà affectés
Centre des retours de location d'outils|Enregistrement des outils revenus|Contrôle des accessoires manquants|Préparation des mallettes complètes|traiter les retours d'un parc de location dont chaque mallette demandait un contrôle individuel
Halle des emballages de grande longueur|Réception des tubes et profilés|Préparation des berceaux longs|Protection des extrémités de charge|conditionner des fournitures longues avec un axe de manutention distinct du rangement des petites pièces
Réserve des colis à contrôler|Isolement des colis endommagés|Photographie des emballages ouverts|Reconditionnement des envois acceptés|examiner les avaries de transport avant de décider une remise en circulation matérielle
Maison du recyclage des mousses de calage|Tri des mousses propres|Séparation des inserts collés|Stockage des panneaux récupérés|récupérer des protections d'emballage par matière sans les confondre avec une production industrielle de mousse
Halle des caissons démontables|Dépose des panneaux de caisson|Contrôle des verrous de fermeture|Rangement des ensembles appariés|conserver ensemble les pièces d'emballages démontables pour éviter les coffrets incomplets au départ
`);
group('logistique','distribution spécialisée','Entrepôts et réserves','industrial',`
Centre des repas en portage|Réception des portions fermées|Répartition des tournées alimentaires|Chargement des paniers isothermes|préparer des livraisons de repas déjà cuisinés avec une séparation entre réception et départ des tournées
Halle des produits à chaîne froide|Contrôle des arrivages froids|Chambre des lots en attente|Préparation des caisses isolantes|maintenir des denrées en transit avant départ sans transformer le bâtiment abandonné en source de froid fonctionnelle
Réserve des ingrédients allergènes|Réception des sacs identifiés|Zone séparée des contenants ouverts|Préparation des lots fermés|éviter les mélanges de matières alimentaires durant le stockage et la préparation de commandes spécialisées
Dépôt des rations de randonnée|Assemblage des repas secs|Pesée des sacs de parcours|Rayonnage des lots de sortie|composer des réserves alimentaires transportables selon le poids de portage des équipes de terrain
Centre des consommables de laboratoire|Contrôle des boîtes de verrerie|Rangement des pièces protégées|Composition des kits de paillasse|distribuer des consommables scientifiques fragiles dont l'accès propre restait distinct des retours de caisse
Réserve des pansements de campagne|Tri des paquets intacts|Composition des trousses textiles|Préparation des cartons sanitaires|rassembler des fournitures de soin emballées sans fournir de soins ni de fabrication médicale automatiques
Halle des fournitures d'évacuation|Réception des lits pliants|Préparation des lots d'accueil|Stockage des modules sanitaires|répartir le mobilier et les consommables nécessaires à des lieux d'accueil temporaires
Dépôt des pièces de pompage|Contrôle des joints reçus|Appariement des corps de pompe|Rangement des caisses de dépannage|tenir des pièces de maintenance hydraulique par ensembles compatibles sans simuler un réseau d'eau actif
Réserve des filtres de ventilation|Inspection des cadres de filtre|Classement des formats de cassette|Composition des lots de remplacement|distribuer des éléments de ventilation en maintenant les filtres usagés à l'écart des pièces emballées
Centre des pièces de voirie|Réception des plaques et cadres|Appariement des regards|Préparation des petits lots routiers|tenir des composants lourds destinés à la maintenance des rues avec un départ de chantier matérialisé
Halle des fournitures de signalisation|Classement des panneaux démontés|Préparation des pieds et fixations|Chargement des ensembles routiers|assembler des lots temporaires de signalisation à partir de panneaux et supports déjà fabriqués
Réserve des câbles de remplacement|Mesure des bobines entrantes|Coupe des longueurs demandées|Étiquetage des couronnes préparées|distribuer des câbles par longueur et circuit prévu en séparant bobines intactes et chutes
Dépôt des pièces d'irrigation|Réception des raccords démontés|Appariement des dérivations|Préparation des kits de parcelle|fournir des pièces d'entretien agricole sans promettre un nouveau système d'irrigation jouable
Halle des équipements de balisage|Vérification des lampes déposées|Composition des jeux de jalons|Rangement des sacs d'intervention|préparer des équipements physiques de balisage dont les batteries et appareils sont hors service à l'abandon
Réserve des fournitures de relogement|Réception du mobilier démonté|Vérification des kits domestiques|Constitution des palettes de foyer|regrouper des biens utiles par foyer plutôt que disperser des réserves sans destination lisible
`);
group('logistique','contrôle des flux','Entrepôts et réserves','civic',`
Maison des scellés de fret|Délivrance des jeux de scellés|Examen des fermetures rompues|Conservation des témoins de contrôle|suivre matériellement les fermetures des chargements et isoler les scellés revenus avec avaries
Centre de mesure des colis|Mesure des volumes arrivants|Pesée des charges préparées|Classement des anomalies de gabarit|contrôler le volume et la masse des envois avant une répartition sur des moyens de transport
Bureau de groupage des tournées|Dépôt des ordres de livraison|Rapprochement des destinations|Préparation des documents de départ|former des tournées à partir de commandes et contraintes de chargement dans un bâtiment de dispatch au sol
Maison de contrôle des marchandises confiées|Vérification des marques de caisse|Constat des lots incomplets|Mise en attente des objets litigieux|garder les chargements contestés séparés du flux normal jusqu'à leur résolution documentaire
Centre de réception des achats collectifs|Vérification des commandes communes|Répartition par destinataire|Préparation des lots d'enlèvement|consolider les achats de plusieurs ateliers sans créer une boutique ou un entrepôt indifférencié
Halle de contrôle des expéditions humanitaires|Vérification des listes de colis|Inspection des lots sanitaires|Fermeture des palettes par mission|préparer des départs de matériel d'aide avec preuves de contenu et contraintes de transport distinctes
Maison des plannings de quai|Accueil des chauffeurs annoncés|Affectation des portes de chargement|Suivi des fins de manutention|ordonner les créneaux d'une plateforme routière depuis un bâtiment d'exploitation sans inventer de quai maritime
Centre de conservation des pièces de douane|Réception des dossiers de transit|Examen des pièces manquantes|Classement des autorisations rendues|traiter les documents d'envois internationaux en séparant public et conservation des dossiers
Maison du suivi des contenants consignés|Lecture des retours de contenant|Rapprochement des stocks physiques|Préparation des bons de remise|suivre les allers et retours de caisses consignées par un inventaire matériel lisible
Centre de préparation des inventaires|Vérification des plans de rayonnage|Préparation des relevés de comptage|Classement des écarts constatés|équiper des équipes d'inventaire avant leur départ et comparer ensuite leurs relevés de stocks
Maison des réservations de manutention|Réception des demandes de levage|Etude des gabarits à déplacer|Composition des fiches d'équipe|organiser des déplacements d'objets lourds depuis des dossiers de charge sans simuler un service de grue
Centre du suivi des colis perdus|Réception des objets sans adresse|Recherche des marques d'envoi|Conservation des colis retrouvables|examiner des colis incomplets et préserver leur identité jusqu'à un retrait identifié
Maison des retours de matériel prêté|Contrôle des fiches de prêt|Examen des équipements revenus|Classement des ensembles restitués|suivre les équipements communaux prêtés à des associations avec un parcours de retour spécialisé
Centre de préparation des convoiements|Réception des commandes de transfert|Répartition des charges indivisibles|Préparation des feuilles de convoi|réunir les dossiers de transferts difficiles sans créer une escorte ou des véhicules supplémentaires
Maison de contrôle des stocks de secours|Lecture des inventaires de réserve|Vérification des dates de lot|Planification des remplacements|contrôler les reliquats de secours par lot et rendre visibles les retraits déjà accomplis
`);
group('logistique','matériels de manutention','Services et petits ateliers','workshop',`
Atelier des transpalettes manuels|Réception des fourches usées|Révision des petits vérins|Remontage des poignées de traction|entretenir les transpalettes à bras et isoler les appareils incomplets avant essais
Centre des chariots de magasin|Tri des châssis retournés|Réglage des trains de roulettes|Assemblage des chariots prêts|maintenir le matériel de déplacement interne avec pièces de roulement et structures classées séparément
Atelier des tables élévatrices|Inspection des plateaux mobiles|Contrôle des ciseaux de levage|Montage des commandes mécaniques|entretenir des tables de manutention sans leur conférer de fonctionnalité automatique après abandon
Maison des sangles de charge|Examen des tissages revenus|Contrôle des tendeurs à cliquet|Préparation des jeux appariés|contrôler les moyens de maintien des charges avant de les affecter aux prochains départs
Atelier des chaînes de levage|Nettoyage des chaînes reçues|Examen des maillons et crochets|Rangement des élingues contrôlées|trier du matériel métallique de levage selon les dommages constatés et les pièces récupérables
Centre des ventouses de manutention|Examen des plateaux de prise|Réparation des petits circuits d'air|Montage des poignées de transport|préparer des outils de transport de panneaux fragiles avec vérification distincte des joints et prises
Atelier des rouleaux de convoyage|Réception des rouleaux déposés|Changement des paliers de rouleau|Montage des sections réparées|remettre en état des sections de convoyeur déposées plutôt que créer une chaîne logistique active
Centre des rampes de chargement portables|Examen des tabliers retournés|Réparation des charnières de rampe|Rangement des plaques appariées|entretenir les rampes mobiles utilisées pour joindre un seuil de bâtiment et un véhicule
Atelier des balances de plateforme|Contrôle des plateaux de pesée|Montage des capteurs récupérables|Vérification des boîtiers de lecture|entretenir les appareils de pesée de chargement avec séparation du métal lourd et des pièces délicates
Maison des protections d'angle de fret|Tri des coins écrasés|Découpe des protections de chant|Composition des jeux de charge|préparer des protections de maintien adaptées aux angles d'objets transportés
Atelier des diables de portage|Redressage des châssis de diable|Réglage des axes de roue|Montage des platines de charge|réparer du matériel de portage manuel avec structures, roues et plateaux répartis selon leur état
Centre des supports de bobine|Examen des berceaux retournés|Réglage des rouleaux de déroulage|Assemblage des supports stables|entretenir les supports de câble et de tube pour permettre un déroulage contrôlé avant transport
Atelier des verrous de caisse mobile|Tri des fermetures démontées|Ajustage des gâches métalliques|Essai des charnières appariées|maintenir les systèmes de fermeture des cages et caissons sans produire des serrures de bâtiment
Maison des filets de maintien de charge|Inspection des mailles revenues|Remplacement des crochets d'attache|Pliage des filets contrôlés|préparer des moyens de retenue textile dont les accrocs restent visibles sur les pièces rejetées
Centre des barres de blocage de fret|Examen des tubes télescopiques|Révision des têtes de serrage|Appariement des barres utilisables|maintenir les barres qui immobilisaient les charges dans les véhicules et conserver les pièces détachées
`);
group('logistique','réserves spécialisées','Entrepôts et réserves','industrial',`
Halle des chapiteaux démontés|Rangement des toiles sèches|Classement des mâts démontés|Préparation des sacs de montage|conserver des structures temporaires complètes en séparant pièces lourdes et textiles fragiles
Réserve des barrières de foule|Réception des modules revenus|Contrôle des pieds de barrière|Composition des lots d'événement|préparer des séparateurs physiques pour des rassemblements sans leur attribuer un rôle de défense simulé
Dépôt des gradins démontables|Tri des marches démontées|Examen des assemblages porteurs|Rangement des jeux de fixation|tenir les pièces d'assises temporaires ensemble pour permettre leur récupération par lots cohérents
Halle des échafaudages roulants|Rangement des cadres tubulaires|Contrôle des plateformes mobiles|Préparation des sachets de liaison|conserver des équipements de chantier modulaires sans autoriser l'escalade ou la construction verticale nouvelle
Réserve des cloisons de chantier|Réception des panneaux déposés|Nettoyage des rails réutilisables|Appariement des portes provisoires|stocker des séparations temporaires et distinguer les ensembles complets des panneaux isolés
Dépôt des protections de sol d'événement|Tri des dalles revenues|Nettoyage des plaques de passage|Empilage des surfaces prêtes|conserver des modules de protection de sol après démontage d'installations temporaires
Halle des tapis de passage lourd|Inspection des bandes retournées|Séchage des nappes de sol|Enroulement des passages réutilisables|préparer des surfaces de manutention souples destinées aux déplacements d'équipements
Réserve des passerelles de chantier démontées|Classement des tabliers courts|Contrôle des garde-corps séparés|Rangement des boulons de liaison|conserver des pièces d'ouvrage déposées dans une halle terrestre sans générer de pont franchissable
Dépôt des réservoirs souples vides|Séchage des enveloppes ouvertes|Inspection des raccords démontés|Pliage des cuves dégonflées|entretenir des réservoirs transportables vides et leurs pièces sans simuler de réserve d'eau renouvelable
Halle des abris de chantier pliants|Examen des ossatures revenues|Nettoyage des panneaux souples|Préparation des jeux de montage|ranger des équipements de protection météorologique temporaires après usage
Réserve des équipements de portage collectif|Tri des cadres de transport|Réparation des harnais déposés|Composition des sacs d'équipe|préparer du matériel de déplacement de charge humaine ou matérielle avec ensembles complets identifiables
Dépôt des caisses de sonorisation|Réception des boîtiers de tournée|Rangement des supports démontés|Préparation des faisceaux transportés|tenir les coffrets et accessoires d'un parc événementiel sans promettre un réseau sonore en partie
Halle des assises d'urgence|Contrôle des bancs repliables|Nettoyage des sièges revenus|Composition des palettes d'accueil|conserver des sièges temporaires destinés aux accueils collectifs de courte durée
Réserve des plaques de couverture provisoire|Classement des tôles déposées|Examen des fixations de couverture|Préparation des lots de réparation|fournir des éléments finis de fermeture de toiture à partir d'une réserve matérielle abandonnée
Dépôt des caissons de ravitaillement itinérant|Nettoyage des caissons revenus|Examen des compartiments internes|Composition des modules de tournée|préparer des coffrets de distribution ambulante avec circuits de retour et de départ distincts
`);
group('transport','exploitation routière','Automobile et carburant','service',`
Maison de régulation des navettes|Accueil des conducteurs de navette|Répartition des départs courts|Suivi des retours de véhicules|organiser les trajets répétitifs d'une desserte locale depuis un bâtiment d'exploitation au sol
Centre des transports scolaires|Enregistrement des circuits scolaires|Vérification des points de prise|Préparation des feuilles de conducteur|préparer des circuits de transport d'élèves avec un local de dispatch distinct du garage
Maison du transport accompagné|Réception des demandes d'accompagnement|Composition des tournées adaptées|Préparation des fiches de prise en charge|coordonner des déplacements de personnes à mobilité réduite sans créer de service ou de PNJ en partie
Centre des minibus associatifs|Remise des dossiers de véhicule|Préparation des départs groupés|Contrôle des retours de prêt|tenir les prêts et tournées d'une petite flotte partagée avec équipement de contrôle matériel
Maison des autocars de remplacement|Réception des ordres de substitution|Préparation des arrêts temporaires|Distribution des dossiers de parcours|préparer des remplacements de desserte pendant des interruptions ferroviaires sans simuler des trains
Centre des tournées de messagerie urbaine|Dépôt des sacs d'envoi|Répartition des trajets de quartier|Préparation des chargements légers|répartir des livraisons de petits colis selon les contraintes de trajet en zone urbaine
Maison des coursiers à vélo cargo|Réception des colis de proximité|Assemblage des lots de portage|Retour des caisses de livraison|organiser des livraisons locales à charge limitée avec un bâtiment de dispatch et de retour spécialisé
Centre des transports funéraires|Préparation des dossiers de transfert|Rangement du matériel de portage|Nettoyage des accessoires revenus|traiter la logistique de transferts funéraires avec circuits public et matériel séparés sans dépouille interactive ajoutée
Maison des convoyeurs automobiles|Remise des clés et dossiers|Vérification des trajets de remise|Contrôle des documents de retour|organiser les déplacements de véhicules confiés sans introduire un nouveau véhicule pilotable
Centre des liaisons de chantier|Réception des demandes d'équipe|Répartition des trajets utilitaires|Préparation des sacs de conducteur|coordonner les déplacements de personnel et de petits outils entre sites de travaux
Maison des transports à horaires décalés|Accueil des demandes nocturnes|Préparation des tournées de relève|Vérification des retours de poste|préparer des navettes de travailleurs avec horaires et retours identifiés plutôt que créer une gare générique
Centre des transferts interétablissements|Réception des commandes internes|Groupage des caisses par établissement|Remise des feuilles de transfert|organiser la circulation de matériels entre ateliers et services d'un même organisme
Maison des véhicules partagés communaux|Remise des pochettes de prêt|Contrôle du petit équipement embarqué|Enregistrement des retours de clé|gérer les prêts d'une flotte utilitaire par dossiers et accessoires conservés dans un local au sol
`);
group('transport','entretien des équipements de véhicule','Services et petits ateliers','workshop',`
Atelier des hayons de livraison|Inspection des plateformes déposées|Révision des vérins de hayon|Remontage des boîtiers de commande|réparer les mécanismes de chargement déposés des utilitaires avec une séparation des plateaux et circuits
Centre des compartiments isothermes|Examen des panneaux isolés|Pose des joints de porte|Contrôle des coffrets frigorifiques|entretenir des éléments de caisse froide déposés sans produire de froid dans le bâtiment abandonné
Atelier des galeries utilitaires|Réception des cadres de toit|Ajustage des supports de galerie|Montage des brides de maintien|entretenir les dispositifs externes de portage sans modifier les statistiques des véhicules existants
Centre des sièges de transport collectif|Dépose des garnitures usées|Réglage des glissières de siège|Assemblage des assises contrôlées|réparer des sièges démontés dont les textiles et fixations suivent deux circuits matériels
Atelier des rampes d'accès embarquées|Examen des tabliers de rampe|Révision des articulations courtes|Essai des verrous de rangement|maintenir des équipements d'accès déposés de minibus et séparer les pièces utilisables des tabliers déformés
Centre des portes coulissantes utilitaires|Réception des portes démontées|Réglage des rails et galets|Appariement des serrures de porte|réparer des ensembles d'ouverture embarqués sans ajouter une simulation de portière nouvelle
Atelier des faisceaux de remorque|Tri des câbles endommagés|Montage des prises de liaison|Contrôle des boîtiers lumineux|entretenir les liaisons électriques de remorques dans un atelier spécialisé plutôt que réparer des moteurs
Centre des attelages démontés|Examen des têtes d'attelage|Révision des freins de timon|Appariement des fixations de caisse|maintenir les dispositifs mécaniques de traction déposés avant remise à disposition matérielle
Atelier des coffres de toit|Examen des coques fendues|Révision des fermetures de coffre|Montage des brides de galerie|entretenir des coffres de portage détachés avec pièces métalliques et coques séparées
Centre des chronotachygraphes déposés|Réception des appareils scellés|Examen des mécanismes de lecture|Conservation des pièces de relevé|maintenir des dispositifs civils de suivi de conduite sans suivre ni surveiller le joueur en partie
Atelier des rétroviseurs de poids lourd|Examen des bras déformés|Assemblage des miroirs protégés|Contrôle des platines de réglage|préparer des dispositifs de vision démontés avec stockage protégé du verre et des supports
Centre des coupe-batteries de flotte|Réception des boîtiers déposés|Examen des contacts de coupure|Appariement des protections de câble|réparer des organes électriques isolés dans un bâtiment technique sans charger gratuitement les véhicules
Atelier des capots de machine mobile|Réception des capots cabossés|Ajustage des charnières de service|Montage des panneaux de fermeture|entretenir des enveloppes de protection déposées de matériels mobiles et conserver leurs ferrures
`);
group('transport','maintenance des matériels ferroviaires déposés','Services et petits ateliers','industrial',`
Atelier des pupitres ferroviaires déposés|Réception des panneaux de commande|Examen des boutons et câblages|Assemblage des pupitres de réserve|entretenir des consoles ferroviaires démontées dans une halle terrestre sans voie ni circulation de train
Centre des lampes de signal ferroviaire|Examen des lanternes déposées|Révision des supports optiques|Montage des coffrets de réserve|réparer des lampes de signalisation isolées dont l'état ne commande aucun trajet ferroviaire en partie
Atelier des sièges de rame déposés|Tri des assises démontées|Réparation des cadres d'assise|Confection des ensembles de dossier|entretenir du mobilier retiré des rames avec textiles, armatures et pièces de montage classés séparément
Centre des portes de rame démontées|Réception des panneaux coulissants|Réglage des guides de porte|Examen des mécanismes d'ouverture|maintenir des équipements déposés dans une halle fixe sans ajouter de rame visitable ou pilotable
Atelier des boîtiers d'aiguillage déposés|Inspection des boîtiers démontés|Révision des contacts de position|Rangement des pièces de transmission|conserver et réparer du matériel ferroviaire hors voie sans simuler un changement d'aiguillage
Centre des freins de wagon déposés|Tri des organes de frein|Révision des tuyaux démontés|Assemblage des ensembles de réserve|entretenir des pièces de freinage isolées avec circuits de réception et de montage distincts
Atelier des marchepieds de rame|Examen des plaques démontées|Réparation des bras de marchepied|Contrôle des verrous de fermeture|maintenir des équipements d'accès déposés de matériel ferroviaire dans un volume au sol
Centre des soufflets de liaison déposés|Inspection des plis textiles|Réparation des cadres de soufflet|Rangement des ensembles protégés|conserver des liaisons souples retirées de rames sans créer de passage mobile entre wagons
Atelier des vitrages de rame stockés|Réception des vitrages emballés|Préparation des cadres d'insertion|Contrôle des joints de montage|préparer des fenêtres de matériel collectif en séparant surfaces fragiles et cadres métalliques
Centre des panneaux d'information déposés|Examen des panneaux lumineux|Révision des plaques de fixation|Rangement des boîtiers de réserve|entretenir des afficheurs démontés sans annoncer de réseau d'information voyageurs fonctionnel
Atelier des serrures de compartiment|Tri des serrures démontées|Révision des mécanismes de verrou|Appariement des clés de réserve|entretenir des fermetures retirées de matériel ferroviaire dans un atelier spécialisé
Centre des boîtes de roulement déposées|Réception des boîtiers graisseux|Examen des paliers démontés|Rangement des pièces métalliques|conserver des ensembles mécaniques hors véhicule avec traces d'huile narratives et stockage par état
Maison des pièces de caténaire déposées|Tri des isolateurs démontés|Examen des pinces de ligne|Préparation des lots de maintenance|tenir du matériel de réseau aérien déposé sans dessiner de ligne électrique ferroviaire active
`);
group('transport','maintenance de voirie','Services et petits ateliers','service',`
Atelier des têtes de feu de circulation|Examen des optiques déposées|Réparation des enveloppes de feu|Montage des jeux de fixation|entretenir des signaux routiers démontés dont aucune fonction de circulation ne découle en partie
Centre des armoires de carrefour|Réception des coffrets routiers|Révision des relais de commande|Rangement des platines démontées|maintenir des armoires de contrôle déposées sans ajouter un système actif de circulation routière
Atelier des bornes de stationnement|Examen des coques de borne|Révision des mécanismes de ticket|Assemblage des boîtiers fermés|réparer des appareils de stationnement hors service sans paiement ni collecte de monnaie en jeu
Centre des panneaux à message variable|Réception des modules d'affichage|Examen des alimentations déposées|Rangement des plaques lumineuses|entretenir des panneaux routiers démontés dont l'abandon laisse uniquement des pièces récupérables
Atelier des barrières d'accès levantes|Inspection des lisses déposées|Révision des pivots de barrière|Contrôle des boîtiers de fin de course|maintenir des équipements de fermeture démontés sans ajouter une défense automatique à D17
Centre des capteurs de chaussée|Tri des boîtiers de détection|Examen des câbles de liaison|Préparation des kits de remplacement|conserver des équipements civils de mesure routière déposés sans détecter gratuitement les ennemis
Atelier des balayeuses de voirie déposées|Réception des ensembles de brosse|Examen des conduits d'aspiration|Rangement des têtes de rechange|entretenir des organes démontés de nettoyage urbain sans créer de véhicule ou de déblaiement supplémentaire
Centre des têtes de marquage routier|Tri des buses de peinture|Révision des châssis de projection|Préparation des boîtiers d'application|maintenir des équipements déposés de marquage sans construire de routes gratuitement
Atelier des saleuses de chaussée|Inspection des trémies démontées|Révision des plateaux d'épandage|Rangement des pièces de dosage|entretenir des équipements de voirie déposés dont le sel reste une trace matérielle sans ressource nouvelle
Centre des buses de curage routier|Réception des outils revenus|Examen des flexibles de curage|Appariement des têtes de travail|tenir du matériel de nettoyage des regards sans créer de réseau souterrain accessible
Atelier des plaques de ralentisseur|Tri des modules de chaussée|Examen des attaches au sol|Préparation des ensembles démontés|conserver des séparateurs routiers finis sans modifier automatiquement la vitesse des unités
Centre des abris de signalisation temporaire|Rangement des coffrets de poste|Examen des pieds télescopiques|Préparation des boîtiers transportables|maintenir les supports de signalisation de chantier sans introduire de structure routière active
Maison des équipements de comptage routier|Réception des dispositifs déposés|Contrôle des tubes et connecteurs|Conservation des appareils de relevé|préparer des moyens de mesure de trafic civil sans effectuer de suivi de joueur ni ajouter de compteur ennemi
`);
group('transport','sécurité et contrôle des trajets','Administration et communauté','civic',`
Maison des plans de détour de chantier|Réception des plans de fermeture|Etude des voies de remplacement|Préparation des dossiers de balisage|établir des détours matériels pour des travaux depuis un bureau au sol sans créer de nouvelle route par consultation
Centre des constats d'accident de flotte|Accueil des dossiers de collision|Examen des pièces de véhicule reçues|Conservation des plans de constat|analyser des dommages civils avec pièces déposées et dossiers séparés de l'accueil
Maison des formations de chargement|Présentation des charges factices|Essai des moyens d'arrimage|Préparation des supports pédagogiques|former aux gestes de chargement dans un bâtiment d'exercice sans attribuer une compétence au joueur
Centre de préparation des parcours accessibles|Réception des relevés de seuil|Etude des ruptures de trajet|Classement des propositions d'accès|concevoir des itinéraires adaptés aux contraintes physiques d'accès sans modifier la géométrie par un document
Maison des autorisations de convoi exceptionnel|Réception des demandes de gabarit|Examen des plans de passage|Classement des dossiers autorisés|traiter la planification civile de charges volumineuses sans escortes ou ouvrages supplémentaires
Centre des contrôles de documents de flotte|Réception des pochettes véhicule|Vérification des pièces manquantes|Classement des dossiers complets|conserver les documents de conduite et de maintenance d'un parc partagé dans des pièces accessibles
Maison des simulations de conduite sur table|Préparation des maquettes de parcours|Exercice des situations de carrefour|Rangement des supports de formation|enseigner des choix de trajet avec matériels de table sans simulateur actif ni conduite nouvelle
Centre des appels de dépannage routier|Réception des signalements de panne|Affectation des dossiers de mission|Préparation des fiches de récupération|coordonner les demandes de dépannage depuis un bureau sans service d'assistance disponible en partie
Maison des garanties de transport de biens|Réception des déclarations d'avarie|Examen des photographies de charge|Classement des dossiers de recours|traiter des incidents de transport matériel en séparant pièces de preuve et accueil public
Centre des objets trouvés en transport|Réception des objets sans propriétaire|Recherche des indices de destination|Rangement des restitutions préparées|conserver des objets revenus de véhicules collectifs par identité et avec un circuit de retrait contrôlé
Maison des cartes de parcours papier|Réception des relevés d'itinéraire|Montage des dossiers de trajet|Rangement des atlas de conducteur|préparer des documents physiques de navigation de flotte sans découverte gratuite de la carte du jeu
Centre des équipements de contrôle de gabarit|Examen des instruments déposés|Préparation des cadres de mesure|Rangement des kits de vérification|tenir des moyens matériels de contrôle des dimensions de chargement avant leur départ sur terrain
Maison des exercices d'évacuation routière|Préparation des scénarios de table|Répartition des points de rassemblement|Conservation des dossiers d'exercice|préparer des sorties civiles organisées sans ajouter de foule de PNJ ni de nouvelle capacité de campagne
`);
group('protection','entretien des équipements de secours','Secours et protection civile','service',`
Atelier des tuyaux de lutte contre le feu|Réception des tuyaux revenus|Examen des raccords de lance|Séchage des longueurs dépliées|entretenir du matériel de secours après intervention avec séparation des retours humides et des pièces propres
Centre des appareils respiratoires de secours|Dépose des harnais revenus|Examen des masques et joints|Rangement des ensembles contrôlés|maintenir les protections respiratoires d'intervention sans leur attribuer une immunité en partie
Atelier des civières de portage|Examen des châssis de civière|Réparation des poignées de transport|Montage des sangles appariées|conserver les équipements de déplacement de blessés sans créer de déplacement automatique ou de nouveaux soins
Centre des échelles de secours démontées|Réception des éléments d'échelle|Examen des articulations de longueur|Rangement des travées contrôlées|entretenir des moyens d'accès stockés au sol sans rendre les façades escaladables
Atelier des treuils de récupération|Examen des tambours déposés|Révision des guidages de câble|Contrôle des commandes mécaniques|entretenir des matériels déposés de récupération de charge sans simuler un nouveau moyen de traction
Centre des coussins de levage|Réception des enveloppes revenues|Contrôle des raccords de pression|Pliage des ensembles de secours|conserver des dispositifs civils de dégagement avec accessoires identifiés et sans capacité active ajoutée
Atelier des pinces de désincarcération|Examen des têtes de pince|Révision des flexibles hydrauliques|Appariement des unités de commande|maintenir des outils de secours dont les corps métalliques et circuits suivent des postes différents
Centre des tronçonneuses de secours déposées|Tri des blocs d'outil revenus|Examen des guides démontés|Préparation des lots de chaîne|tenir le matériel de dégagement de voie comme appareils hors service et pièces récupérables
Atelier des projecteurs d'intervention|Examen des boîtiers de lumière|Révision des trépieds de poste|Appariement des câbles déposés|réparer des appareils d'éclairage de secours sans transformer les projecteurs décoratifs en sources gratuites
Centre des pompes d'épuisement déposées|Réception des corps de pompe|Examen des flexibles de vidange|Appariement des raccords de sortie|entretenir du matériel d'épuisement hors réseau sans introduire de crue ou de pompage actif
Atelier des détecteurs portables de secours|Réception des appareils scellés|Contrôle des coffrets de mesure|Rangement des accessoires appariés|entretenir des moyens civils de mesure sans révéler les contacts ennemis hors de la vision réelle
Centre des tenues de protection d'intervention|Tri des vêtements revenus|Nettoyage des éléments détachés|Rangement des lots secs|conserver les protections textiles d'équipes de secours avec parcours sale et propre clairement séparés
Atelier des casques de secours|Examen des coques fissurées|Réglage des garnitures internes|Appariement des visières de casque|maintenir des protections de tête sans ajouter un équipement balistique ou une statistique nouvelle
Centre des bouées de sauvetage stockées|Séchage des enveloppes revenues|Contrôle des cordes de rappel|Rangement des équipements terrestres|conserver du matériel nautique dans un bâtiment terrestre sans eau navigable ni action de nage
Atelier des brancards pliants|Examen des articulations de cadre|Réparation des toiles de portage|Pliage des ensembles contrôlés|entretenir des brancards légers démontables avec stockage séparé des structures et textiles
`);
group('protection','préparation des interventions civiles','Secours et protection civile','civic',`
Maison des exercices de recherche terrestre|Préparation des cartes d'exercice|Composition des sacs de recherche|Rangement des supports de débrief|préparer la recherche civile de personnes sur terrain sec sans nouvelle faction ni cible de quête
Centre de préparation des équipes de déblaiement|Présentation des charges de gravats|Composition des jeux d'outils|Préparation des plans d'approche|organiser des moyens physiques de dégagement sans modifier les règles de cadavres ou de reconstruction
Maison des exercices de feu domestique|Préparation des maquettes d'habitation|Etude des accès de sortie|Rangement des supports de prévention|enseigner la reconnaissance des issues avec maquettes au sol sans mécanisme d'incendie actif
Centre de préparation des secours en hauteur|Présentation des points d'ancrage factices|Composition des sacs de corde|Conservation des fiches de contrôle|préparer des exercices sur matériel démonté sans ajouter d'escalade ou de niveau accessible
Maison des exercices de panne collective|Etude des circuits hors tension|Préparation des trousses de relais|Rangement des plans de coupure|préparer des interventions civiles en cas de panne avec installations d'exercice inertes
Centre de préparation des recherches en forêt|Réception des relevés de sentier|Composition des sacs de repérage|Préparation des dossiers de retour|préparer des équipes de recherche avec matériel terrestre sans localisation gratuite des lieux de la seed
Maison des exercices de secours mécanique|Présentation des châssis factices|Rangement des outils de dégagement|Préparation des fiches d'équipe|former à l'accès à des charges coincées sans ajouter de blessé ou de véhicule fonctionnel
Centre de préparation des secours routiers|Examen des plans d'approche|Composition des lots de balisage|Rangement des moyens de portage|préparer les moyens matériels d'une intervention routière et séparer balisage et accès aux équipements
Maison des exercices de rupture de canalisation|Présentation des vannes déposées|Composition des lots de colmatage|Préparation des plans de secteur|enseigner des gestes de maintenance sur éléments isolés sans réseau d'eau simulé
Centre de préparation des interventions de tempête|Etude des accès encombrés|Composition des sacs de fixation|Rangement des moyens de couverture|préparer du matériel de remise en sécurité civile après dommages météorologiques narratifs
Maison des exercices de confinement civil|Présentation des plans de pièce|Préparation des joints temporaires|Classement des supports d'information|enseigner des choix d'abri depuis des plans physiques sans protection magique ni gaz simulé
Centre de préparation des évacuations d'école|Etude des circulations scolaires|Composition des sacs de responsable|Rangement des supports de rassemblement|préparer les parcours de sortie d'un établissement depuis un bâtiment indépendant sans élèves en partie
Maison des exercices de secours rural|Etude des accès de ferme|Composition des jeux de calage|Rangement des dossiers de mission|préparer du dégagement matériel sur sites agricoles avec contraintes de sol et de charge identifiées
Centre de préparation des exercices de quartier|Répartition des zones d'exercice|Composition des sacs de coordinateur|Conservation des dossiers de retour|préparer des entraînements civils de terrain sans attribuer de doctrine ou de bonus permanent
Maison des démonstrations de gestes de sécurité|Présentation des objets d'exercice|Préparation des kits pédagogiques|Rangement des supports de séance|expliquer des gestes matériels simples dans un bâtiment de démonstration sans enseigner une capacité de personnage
`);
group('protection','coordination et garde des lieux','Secours et protection civile','service',`
Centre des relevés de stabilité après sinistre|Réception des constats de façade|Examen des pièces tombées|Classement des plans de contrôle|documenter les dommages de bâtiments avec fragments physiques sans calcul structurel ou destruction nouvelle
Maison de coordination des accueils d'urgence|Réception des plans de capacité|Répartition des équipements d'accueil|Conservation des fiches de site|organiser des moyens d'accueil civils par dossiers et lots matériels sans créer de survivants présents
Centre de préparation des tours de veille|Réception des plans de poste|Composition des sacoches de garde|Conservation des registres de passage|préparer des rondes civiles et leur matériel sans ajouter d'observateur à la visibilité du jeu
Maison de restitution des clés de site|Réception des trousseaux confiés|Appariement des clés aux plans|Conservation des pochettes de remise|gérer les accès matériels de sites abandonnés sans déverrouillage automatique par consultation
Centre de préparation des fermetures provisoires|Examen des ouvertures signalées|Composition des lots de panneau|Préparation des kits de fixation|préparer des moyens physiques de fermeture civile sans construire de défense gratuitement
Maison des enquêtes de départ de feu|Réception des fragments de mobilier|Examen des traces de départ|Classement des plans d'incident|conserver les preuves civiles d'incidents anciens sans allumer un incendie simulé
Centre des archives de passage de gardiennage|Réception des carnets de ronde|Rapprochement des horaires de poste|Conservation des relevés de fermeture|documenter les activités de surveillance par traces matérielles sans mémoriser des ennemis hors vision
Maison de préparation des postes de contrôle civils|Examen des plans d'approche|Composition des équipements de signal|Préparation des pochettes de poste|préparer le matériel de filtrage de passage civil sans créer de gardes ou de faction hostile
Centre des constats de brèche d'enceinte|Réception des relevés de clôture|Examen des ferrures arrachées|Classement des propositions de reprise|étudier les dommages d'une clôture par pièces et plans sans réparer une défense à distance
Maison de coordination du relogement temporaire|Réception des dossiers de foyer|Répartition des lots de mobilier|Conservation des fiches d'affectation|coordonner les biens d'un relogement avec parcours public et matériel distincts sans accueillir de PNJ
Centre des appels de secours archivés|Réception des fiches d'appel|Rapprochement des rapports d'équipe|Conservation des relevés de mission|rendre lisibles les interventions passées à travers des dossiers sans service de secours actif
Maison des inspections de matériel de garde|Réception des accessoires revenus|Examen des lampes de ronde|Rangement des pochettes de poste|contrôler le petit équipement de surveillance civile sans ajouter de portée visuelle ou de munition
Centre des déclarations de secteur évacué|Réception des plans de secteur|Vérification des listes de fermeture|Conservation des dossiers de départ|documenter une évacuation ancienne sans dévoiler la carte actuelle ni conclure au sort des occupants
Maison des réserves de serrurerie de protection|Tri des verrous démontés|Appariement des gâches renforcées|Préparation des lots de fermeture|tenir des pièces de fermeture robuste récupérables sans offrir de porte blindée ou d'accès libre
Centre des registres de matériel sensible|Réception des inventaires confiés|Vérification des coffrets scellés|Conservation des fiches de restitution|documenter la garde de matériel de sécurité par objets et dossiers sans arsenal illimité
`);
group('protection','réserves de crise et continuité','Secours et protection civile','industrial',`
Réserve des lits de centre d'accueil|Réception des cadres pliants|Classement des matelas emballés|Composition des jeux de couchage|tenir les ensembles de couchage destinés à l'accueil temporaire avec textiles et cadres séparés
Centre des modules de lavage d'urgence|Examen des bacs démontés|Appariement des pompes déposées|Préparation des coffrets sanitaires|conserver des équipements de lavage mobiles hors réseau sans créer de soin ou d'approvisionnement en eau
Dépôt des générateurs de secours déposés|Réception des machines arrêtées|Examen des coffrets de liaison|Rangement des pièces de maintenance|tenir du matériel électrique civil hors service sans alimenter la région ou fournir du carburant gratuitement
Réserve des lampes de balisage de crise|Tri des lampes revenues|Examen des supports de balise|Composition des caisses de secteur|préparer des équipements d'orientation temporaire dont la lumière exige toujours un appareil réel payé
Centre des cuisines d'accueil démontées|Examen des modules de cuisson|Rangement des surfaces de service|Composition des caisses de repas|tenir des équipements civils de restauration mobiles sans production alimentaire ou cuisine fonctionnelle
Dépôt des couvertures de réserve civile|Inspection des ballots intacts|Classement des protections sèches|Préparation des paquets de distribution|conserver des textiles pour des accueils exceptionnels avec reliquats finis et traces de distributions passées
Réserve des sanitaires démontables|Réception des panneaux de cabine|Examen des raccords déposés|Composition des kits de montage|stocker des modules sanitaires séparés sans inventer de réseau d'évacuation ou d'hygiène simulé
Centre des dispositifs de fermeture d'abri|Examen des panneaux de porte|Révision des mécanismes de verrou|Préparation des jeux de joint|maintenir des éléments d'abri démontés sans créer un bunker ou une protection active du joueur
Dépôt des caissons de continuité documentaire|Tri des coffrets protégés|Préparation des enveloppes de sauvegarde|Rangement des dossiers critiques|conserver des documents physiques destinés à la continuité d'un service sans données de joueur ou serveur réseau
Réserve des moyens de distribution d'eau|Examen des cuves vidées|Appariement des robinets démontés|Rangement des contenants propres|tenir des matériels civils de distribution vides sans ressource d'eau ni capacité de remplissage nouvelle
Centre des postes d'accueil mobiles démontés|Réception des panneaux d'accueil|Rangement des comptoirs séparés|Préparation des coffrets administratifs|stocker les pièces d'un accueil temporaire avec circuits public et matériel séparés
Dépôt des équipements d'identification d'équipe|Tri des chasubles revenues|Rangement des panneaux d'équipe|Préparation des pochettes de mission|préparer des moyens visuels de repérage humain sans ajouter de faction ou d'unité
Réserve des séparations d'accueil collectif|Examen des rideaux déposés|Révision des montants de séparation|Composition des jeux de fixation|tenir les équipements de séparation d'un accueil d'urgence sans fabriquer des logements automatiquement
Centre des matériels de fermeture de vitrage|Réception des panneaux de protection|Découpe des bandes de fixation|Préparation des ensembles de fenêtre|préparer des fermetures temporaires civiles dont la récupération alimente les matériaux existants
Dépôt des mallettes de maintien de service|Vérification des dossiers de relève|Composition des coffrets d'outillage|Rangement des accessoires appariés|tenir de petits ensembles de maintenance pour des services essentiels sans activer ces services en partie
`);
group('recherche','télécommunications terrestres','Énergie et communication','service',`
Maison des réparations de répartiteur téléphonique|Réception des borniers déposés|Examen des faisceaux de raccordement|Rangement des platines de ligne|entretenir des composants de réseau fixe déposés sans rétablir une télécommunication en partie
Centre des armoires de fibre optique|Réception des coffrets de fibre|Préparation des plateaux de raccord|Examen des protecteurs de soudure|maintenir des équipements civils de raccordement optique hors réseau avec pièces fragiles classées séparément
Atelier des antennes terrestres déposées|Examen des éléments rayonnants|Réparation des pieds d'antenne|Rangement des câbles de descente|conserver des équipements radio au sol sans antenne active ou détection d'ennemis
Maison des relais radio de maintenance|Réception des boîtiers de relais|Examen des alimentations isolées|Appariement des accessoires d'essai|entretenir des relais civils démontés sans communication gratuite ni pouvoir de contrôle
Centre des postes téléphoniques de service|Tri des combinés revenus|Révision des claviers démontés|Appariement des socles de poste|tenir des appareils téléphoniques déposés comme matériel récupérable et non comme service fonctionnel
Atelier des boîtiers de raccord cuivre|Réception des coffrets endommagés|Examen des connexions de paire|Montage des couvercles de protection|entretenir les protections matérielles de câbles fixes hors réseau
Maison des radios de chantier confiées|Réception des appareils de terrain|Examen des boîtiers portables|Rangement des accessoires de charge|conserver des moyens de communication d'équipe hors service sans donner d'émetteur au joueur
Centre des baies de brassage déposées|Tri des panneaux de connexion|Examen des cordons de liaison|Rangement des cadres de baie|maintenir des composants civils de réseau interne sans serveur actif ou découverte de la carte
Atelier des boîtiers d'interphone démontés|Réception des postes de seuil|Examen des platines de parole|Appariement des modules de porte|réparer des composants d'accès sonore hors bâtiment sans déverrouillage automatique
Maison des coffrets de liaison de secours|Vérification des appareils confiés|Composition des jeux de câble|Rangement des dossiers de fréquence|préparer des ensembles radio civils dont aucune liaison ne s'active par lecture de la fiche
`);
group('recherche','électronique et essais électriques','Industrie et production','workshop',`
Laboratoire des contacts électriques|Réception des pièces de contact|Examen des surfaces de commutation|Conservation des témoins d'usure|étudier l'usure matérielle de contacts dans un laboratoire civil sans génération d'énergie active
Laboratoire des isolants de câble|Préparation des tronçons de câble|Examen des enveloppes isolantes|Classement des éprouvettes conservées|comparer les protections de conducteurs déposés à travers des échantillons physiques
Centre des essais de connecteur|Réception des jeux de fiche|Examen des cycles d'emboîtement|Conservation des pièces de comparaison|contrôler des connecteurs civils avec bancs de mesure arrêtés et stocks finis de pièces
Laboratoire des assemblages de circuit|Préparation des plaques de test|Examen des soudures de liaison|Rangement des cartes témoins|étudier des assemblages électroniques ordinaires sans robotique ou pouvoir informatique nouveau
Centre des essais de capteur de pression|Réception des membranes déposées|Examen des boîtiers de mesure|Conservation des prises de référence|contrôler des instruments matériels de pression isolés sans réseau ni appareil de détection ennemi
Laboratoire des petits moteurs électriques|Préparation des rotors déposés|Examen des enroulements de moteur|Classement des paliers témoins|étudier des composants de moteur civil dont les bancs et alimentations ne fonctionnent plus
Centre des essais de protection électrique|Réception des boîtiers de coupure|Examen des contacts de protection|Conservation des modules comparés|évaluer des dispositifs de protection domestique hors tension sans modifier le réseau de D17
Laboratoire des dissipateurs thermiques|Préparation des plaques métalliques|Examen des interfaces de contact|Classement des témoins de chauffe|comparer des composants de refroidissement d'appareil par traces et matériel arrêtés
Centre des essais de transformateur déposé|Réception des noyaux isolés|Examen des bobinages démontés|Conservation des fiches de mesure|contrôler du matériel de conversion électrique déposé sans centrale ou production simulée
Laboratoire des contacts de batterie|Préparation des bornes déposées|Examen des liaisons corrodées|Rangement des supports témoins|étudier les liaisons physiques de batteries hors service sans charge offerte au joueur
`);
group('recherche','optique et instrumentation matérielle','Éducation et connaissance','school',`
Laboratoire des lentilles de mesure|Réception des pièces optiques|Examen des surfaces de lentille|Classement des montures témoins|comparer des composants optiques dans un bâtiment civil sans vision augmentée du joueur
Centre des essais de miroir technique|Préparation des plaques réfléchissantes|Examen des supports de miroir|Conservation des témoins de surface|étudier des éléments de réflexion pour appareils de mesure sans appareil fonctionnel ajouté
Laboratoire des fibres lumineuses|Préparation des brins optiques|Examen des faces de fibre|Rangement des couronnes témoins|examiner des transmissions optiques matérielles avec circuits d'essai arrêtés et pièces protégées
Centre des essais de boîtier photographique|Réception des boîtiers confiés|Examen des fermetures de chambre|Conservation des montures comparées|évaluer des appareils civils démontés par pièces et témoins sans photographie interactive nouvelle
Laboratoire des diaphragmes optiques|Tri des lamelles de diaphragme|Montage des bagues d'essai|Conservation des ensembles témoins|examiner des mécanismes de réglage optique et leur montage mécanique dans des postes distincts
Centre des essais de filtre optique|Préparation des plaques de filtre|Examen des cadres de maintien|Rangement des verres de référence|comparer des surfaces filtrantes sans donner de vision nocturne ou autre pouvoir aux appareils décoratifs
Laboratoire des viseurs d'inspection civile|Réception des boîtiers de viseur|Examen des lentilles internes|Appariement des supports de mesure|étudier des instruments de contrôle industriels civils sans accessoire d'arme ou détection supplémentaire
Centre des essais de fenêtre d'instrument|Préparation des vitres techniques|Examen des joints de fenêtre|Conservation des cadres témoins|contrôler les ouvertures protégées de petits appareils par pièces démontées et relevés papier
Laboratoire des supports de microscope|Examen des bases mécaniques|Réglage des platines déposées|Classement des montures de comparaison|étudier des supports d'instrumentation ordinaire sans recherche médicale active ni découverte automatique
Centre des essais d'éclairage d'inspection|Préparation des diffuseurs de lampe|Examen des boîtiers de lumière|Conservation des réflecteurs témoins|comparer les composants d'éclairage de tâche sans allumer de source hors des appareils réellement équipés
`);
group('recherche','caractérisation des matériaux','Industrie et production','industrial',`
Laboratoire des joints de dilatation|Préparation des bandes de joint|Examen des surfaces de liaison|Classement des éprouvettes de mouvement|comparer les joints de construction par échantillons et appareils arrêtés sans évolution de défense offerte
Centre des essais de colle d'assemblage|Préparation des plaques collées|Examen des ruptures de collage|Conservation des témoins de prise|étudier des assemblages civils avec résidus chimiques narratifs sans poison ni fabrication active
Laboratoire des revêtements anticorrosion|Préparation des coupons métalliques|Examen des traces d'oxydation|Classement des panneaux comparés|comparer des protections de métal depuis des témoins arrêtés sans rendre les structures indestructibles
Centre des essais de textile technique|Préparation des bandes de tissu|Examen des coutures de liaison|Conservation des coupons d'usure|évaluer des textiles de portage et de protection dans un laboratoire sans armure nouvelle
Laboratoire des garnitures de friction|Préparation des blocs de garniture|Examen des surfaces frottées|Classement des plaquettes témoins|étudier l'usure de composants mécaniques civils dans des bancs arrêtés
Centre des essais de mousse isolante|Préparation des blocs de mousse|Examen des cellules coupées|Conservation des plaques de comparaison|comparer des matières de calage et d'isolation sans fabriquer de ressource supplémentaire
Laboratoire des assemblages boulonnés|Préparation des jeux de fixation|Examen des plans de serrage|Classement des ruptures témoins|étudier les liaisons mécaniques de structures civiles par boulons et éléments démontés
Centre des essais de membrane souple|Préparation des feuilles de membrane|Examen des raccords soudés|Conservation des lés de référence|comparer des enveloppes de protection sur éprouvettes sans construction d'abri automatique
Laboratoire des fibres de renfort civil|Préparation des faisceaux de fibre|Examen des résines durcies|Classement des panneaux témoins|étudier des renforts de construction courants avec traces de résine uniquement narratives
Centre des essais de surface de roulement|Préparation des plaques de passage|Examen des traces de frottement|Conservation des témoins de relief|comparer des revêtements de sol civils sans modifier les vitesses ou surfaces de carte par consultation
`);
group('recherche','mesures thermiques et environnementales','Éducation et connaissance','civic',`
Laboratoire des échanges thermiques civils|Préparation des plaques de transfert|Examen des circuits déposés|Classement des relevés de température|étudier des composants d'échange de chaleur sur bancs arrêtés sans chauffage ni énergie gratuite
Centre des essais d'étanchéité de boîtier|Préparation des enveloppes fermées|Examen des joints déposés|Conservation des boîtiers témoins|évaluer les protections d'appareils par pièces démontées sans eau physique ni simulation d'infiltration
Laboratoire des clapets de ventilation|Préparation des volets déposés|Examen des axes de clapet|Classement des ensembles de comparaison|étudier les mouvements de ventilation sur organes isolés sans réseau d'air fonctionnel
Centre des essais de filtre à poussière|Préparation des cassettes filtrantes|Examen des supports de maille|Conservation des filtres témoins|comparer des éléments de filtration avec poussières narratives sans maladie ou poison ajouté
Laboratoire des boîtiers météorologiques|Réception des abris de capteur|Examen des prises de mesure|Classement des coffrets de référence|étudier les protections d'instruments météorologiques civils sans prévision magique ou changement de météo
Centre des essais de sonde de sol|Préparation des tubes de prélèvement|Examen des têtes de sonde|Conservation des boîtiers de relevé|contrôler du matériel de mesure terrestre sans générer de gisement ou modifier la seed
Laboratoire des garnitures de pompe civile|Préparation des bagues d'étanchéité|Examen des surfaces de garniture|Classement des joints témoins|étudier des organes de pompe déposés par échantillons sans pompage actif ni eau nouvelle
Centre des essais d'emballage thermique|Préparation des parois de caisse|Examen des joints de couvercle|Conservation des blocs de comparaison|comparer les isolations de transport à partir de pièces et relevés sans chaîne froide active
Laboratoire des supports de mesure vibratoire|Préparation des pieds de capteur|Examen des attaches de mesure|Classement des supports témoins|étudier le montage d'instruments civils sur des pièces inertes sans perception de horde à distance
Centre des essais de protection solaire de façade|Préparation des lames déposées|Examen des supports d'écran|Conservation des panneaux témoins|comparer des composants de protection de bâtiment sur matériels arrêtés sans climat artificiel ou énergie produite
`);

const materials={
 logistique:'Maçonnerie de quai terrestre, charpente en acier patiné et panneaux de toiture remplacés sur le volume de manutention.',
 transport:'Briques de service, huisseries métalliques usées et couverture à reprises de zinc au-dessus des postes techniques.',
 protection:'Béton civil réparé, ferrures de service et couverture à deux pans dont les raccords restent visibles après abandon.',
 recherche:'Maçonnerie enduite tachée, portes de laboratoire ordinaires et toiture technique en zinc mat sans équipement futuriste.'
};
function furniture(name,domain){
 const n=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/masque|pansement|trousse.*soin|sanitaire/.test(n))return {kind:'medical',resource:'medicine'};
 // Match whole supplies words: préparation is not ration and an electrical
 // alimentation is not food. Process equipment remains scrap, not a pantry.
 if(/\b(repas|rations?|portions?|denrees?)\b|tourn[ée]es alimentaires|panier[s]? isotherme/.test(n))return {kind:'fridge',resource:'food'};
 if(/generateur|machine.*arretee/.test(n))return {kind:'generator',resource:'fuel'};
 if(/corps de pompe|pompe.*depose|robinet|vannes|sonde/.test(n))return {kind:'pump',resource:'scrap'};
 if(/rotor|moteur|verin|treuil|ciseau|tambour|plateau.*epandage/.test(n))return {kind:'machine',resource:'scrap'};
 if(/charniere|verrou|crochet|gache|bride|fixation|boulon|chaine|pinces|tendeur/.test(n))return {kind:'clampRack',resource:'scrap'};
 if(/tuyau|flexible|corde|sangle|filet|faisceau/.test(n))return {kind:'hoseRack',resource:'scrap'};
 if(/cable|coffret|boitier|platine|contact|relais|electr|brassage|circuit|panneau lumineux|affichage|lamp|projecteur|capteur/.test(n))return {kind:'electricalRack',resource:'scrap'};
 if(/dossier|document|fiche|plan|liste|releve|ordre|registre|carnet|atlas|declar|autorisation|demande|horaire|appel|photograph|constat/.test(n))return {kind:'desk',resource:'wood'};
 if(/matelas|couchage|textile|vetement|toile|couverture|tissu|chasuble|rideau|bandes/.test(n))return {kind:'wardrobe',resource:'wood'};
 if(/pallet|palette|ballot|carton|empilage|empil|charge|lot|cadre|caisson|caisses|tablier|dalle|plaque|module|gradin/.test(n))return {kind:'palletStack',resource:'wood'};
 if(/nettoy|sechage|lavage|bac|pompe|robinet|cuve/.test(n))return {kind:'sink',resource:'scrap'};
 if(/classement|rangement|conservation|reserve|temoin/.test(n))return {kind:'shelf',resource:domain==='recherche'?'scrap':'wood'};
 if(/lentille|verre|vitrage|miroir|optique|epreuvette|coupon|fibre|resine|colle|surface/.test(n))return {kind:'steelTable',resource:'scrap'};
 return {kind:domain==='recherche'?'steelTable':'workbench',resource:'scrap'};
}
function makeRecord(g,r,n){
 const [name,first,second,third,functionText]=r;
 // Heavy receiving functions stay at grade; only records and team support
 // occupy the upper floor. No drawing implies a crane, track or usable roof.
 const upper=g.roof==='civic'||g.domain==='recherche'||g.domain==='protection';
 const levels=upper?[0,1]:[0];
 const layout=['axial','offset','cross','gallery'][n%4];
 const width=g.domain==='logistique'?46+(n%3)*4:g.domain==='transport'?38+(n%3)*4:g.domain==='protection'?36+(n%3)*4:34+(n%3)*4;
 const height=g.domain==='logistique'?42+(n%3)*4:g.domain==='transport'?38+(n%3)*4:g.domain==='protection'?36+(n%3)*4:34+(n%3)*4;
 const floorOfSupport=upper?1:0;
 const titleList=[
  ['reception','Réception et contrôle des apports',0,'Recevoir les objets confiés pour '+functionText+' ; garder le contrôle initial avant les postes spécialisés.',{kind:'desk',resource:'wood'}],
  ['preparation',first,0,'Premier poste du programme : '+first.toLowerCase()+'. Trier les apports avant '+second.toLowerCase()+' sans obstruer la porte.',furniture(first,g.domain)],
  ['traitement',second,0,'Poste central : '+second.toLowerCase()+'. Distinguer les éléments encore à examiner de ceux destinés à '+third.toLowerCase()+'.',furniture(second,g.domain)],
  ['controle',third,0,'Dernier poste spécialisé : '+third.toLowerCase()+'. Garder les éléments contrôlés et les témoins à l’écart du premier arrivage.',furniture(third,g.domain)],
  ['sortie','Préparation du départ et des restitutions',0,'Réunir les éléments sortants de '+name.toLowerCase()+' dans des contenants fermés ; le départ matériel rejoint la sortie arrière.',{kind:'crate',resource:'scrap'}],
  ['entretien','Local des outils d’entretien du lieu',0,'Conserver les pièces et outils utilisés par les postes « '+first+' » et « '+second+' » ; les appareils décoratifs demeurent arrêtés.',{kind:'workbench',resource:'scrap'}],
  ['archives','Archives des lots et constats de retour',floorOfSupport,'Conserver les listes propres à '+name.toLowerCase()+' et leurs constats de retour sans déplacer les charges lourdes à l’étage.',{kind:'shelf',resource:'wood'}],
  ['equipe',g.domain==='protection'?'Préparation personnelle des équipes civiles':'Vestiaire et pause de l’équipe',floorOfSupport,'Préparer les sacs, ranger les effets personnels et conserver le petit reliquat de pause avant le retour au poste « '+third+' ». ',g.domain==='protection'?{kind:'medical',resource:'medicine'}:{kind:'fridge',resource:'food'}]
 ];
 const spaces=titleList.map(([id,label,z,usage,prop])=>({id,name:label,z,usage,resource:prop.resource,props:[prop]}));
 const hasTools=spaces.some(s=>s.props.some(p=>p.kind==='workbench'||p.kind==='steelTable'));
 const passage=layout==='axial'?'le couloir médian':layout==='offset'?'le couloir décentré':layout==='cross'?'l’axe longitudinal et son dégagement transversal':'la galerie centrale élargie';
 const special=first+' → '+second+' → '+third;
 const urban=g.domain==='transport'||g.domain==='recherche'||g.sector==='contrôle des flux';
 return {
  id:'DW-'+(3751+n),name,family:g.family,
  purpose:'Ce bâtiment était consacré à '+functionText+'. Le parcours matériel relie '+special+' ; les fonctions sont civiles et leurs appareils restent hors service après abandon.',
  architecture:{width,height,levels,layout,roofFamily:g.roof,material:materials[g.domain]},
  spaces,
  access:{
   public:'L’entrée avant de '+name+' rejoint '+passage+' puis la réception ; chaque poste spécialisé possède une ouverture vers cet axe.',
   service:'Les retours et lots sortants de '+name+' rejoignent la sortie arrière par '+passage+' ; aucun passage par les meubles ou les charges stockées n’est requis.',
   return:'Revenir de « '+third+' » par '+passage+' vers une ouverture extérieure puis la desserte terrestre.'+(upper?' Le palier relie les archives et le vestiaire au même escalier physique.':''),
   width_m:g.domain==='logistique'?2.8:2.2
  },
  placement:{mode:urban?'town':'any',biomes:urban?['brownfield','meadow','bocage']:['brownfield','meadow','bocage','mixed'],townKinds:urban?['bourg','ville','grande-ville']:['village','bourg','ville','grande-ville']},
  supplies:'Les postes « '+first+' » et « '+third+' » conservent des contenants finis, matériel métallique, bois de rangement et petits effets de l’équipe. Chaque pièce et meuble appartient au budget physique du lieu ; les retours ne remplissent aucune caisse. Les médicaments ou rations explicitement affectés au soutien sont également des reliquats finis.',
  risks:[
   'Les passages de « '+second+' » sont à reconnaître avant de charger le sac ; le matériel posé n’est pas un chemin traversable.',
   'La sortie derrière « '+third+' » rejoint la même desserte terrestre et peut laisser un retour exposé aux contacts réellement présents.',
   hasTools?'Des traces d’outillage et d’usure au poste « '+first+' » racontent une intervention interrompue ; aucun feu, poison ou accident de machine supplémentaire n’est simulé.':'Les traces laissées au poste « '+first+' » documentent l’arrêt du service sans incident automatiquement déclenché.'
  ],
  night:'Les appareils et éclairages fixes de '+name+' sont hors service. Reconnaître « '+first+' », '+passage+' et la sortie avec la lumière réellement portée ou posée ; le palier et ses murs gardent leur occultation physique. Aucun appareil de recherche, de garde ou de réseau ne révèle un ennemi hors vision.',
  variants:[
   'Le volume de « '+first+' » peut conserver des panneaux de toiture à joint debout tandis que les espaces de soutien gardent leur couverture d’origine ; l’accès et le budget demeurent uniques.',
   'Les lots reçus de « '+second+' » peuvent montrer un contrôle interrompu ou des compartiments vidés : les reliquats sont redistribués dans le budget existant sans deuxième réserve.'
  ],
  interactions:[
   'Explorer le parcours '+special+' et fouiller les contenants en utilisant les mêmes portes, murs et étages que le déplacement.',
   'Comparer les reliquats récupérables et le poids porté pour ramener des matériaux de '+name.toLowerCase()+' au dépôt puis financer les réparations ordinaires de D17.',
   'Préparer le retour et une lumière réelle avant de charger les pièces ; l’activité d’origine ne devient pas un service utilisable par la seule consultation.'
  ],
  qa:[
   'Parcourir entrée → « '+first+' » → « '+second+' » → « '+third+' » → sortie avec le rayon réel du joueur et sans traverser un meuble.',
   upper?'Atteindre séparément les archives et le soutien par le palier puis revenir au rez-de-chaussée avec les mêmes collisions.':'Atteindre les archives et le soutien depuis le couloir ; vérifier que les huit pièces restent présentes sans niveau implicite.',
   'Fouiller les contenants de « '+third+' », sauvegarder et reprendre sans remplir leurs reliquats ni déplacer leur identité.',
   'Vérifier sur la parcelle retenue la desserte terrestre, les portes, les bords de toit et l’absence de recouvrement avec route ou lieu voisin.'
  ],
  story:'Une fiche laissée entre « '+first+' » et « '+second+' » cite des éléments encore en attente ; des emplacements libres à « '+third+' » indiquent des lots déjà repartis. Le registre de '+name.toLowerCase()+' s’arrête sans conclusion sur le sort de l’équipe.'
 };
}
async function main(){
 const expected={logistique:75,transport:65,protection:60,recherche:50},totals={};
 const fiches=[];for(const g of groups){totals[g.domain]=(totals[g.domain]||0)+g.rows.length;for(const r of g.rows)fiches.push(makeRecord(g,r,fiches.length));}
 for(const [k,v]of Object.entries(expected))if(totals[k]!==v)throw Error(k+': '+totals[k]+' instead of '+v);
 const lot={schemaVersion:1,version:'1.58.0',count:250,fiches};
 const {validateLot}=await import('../validation.mjs');validateLot(lot,'D');
 const root=path.resolve(__dirname,'..');
 const previous=[...JSON.parse(fs.readFileSync(path.join(root,'../originaux/DEADWALL_CODEX_1.22/CATALOGUE_500.json'),'utf8')).fiches,
 ...JSON.parse(fs.readFileSync(path.join(root,'../originaux/DEADWALL_CODEX_SUPPLEMENT_1.23/CATALOGUE_501_1000.json'),'utf8')).fiches];
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();
 const oldNames=new Set(previous.map(p=>normalize(p.nom||p.name)));
 for(const p of fiches)if(oldNames.has(normalize(p.name)))throw Error('Existing programme name '+p.id+': '+p.name);
 const out=path.join(root,'PROGRAMMES_D.json');fs.writeFileSync(out,JSON.stringify(lot,null,2)+'\n');
 console.log(JSON.stringify({output:out,count:fiches.length,first:fiches[0].id,last:fiches.at(-1).id,partitions:totals,spaces:fiches.reduce((a,p)=>a+p.spaces.length,0)}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
