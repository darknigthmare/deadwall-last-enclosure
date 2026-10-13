'use strict';
/* Reproducible authoring for this lot only; all 250 uses below have distinct process spaces. */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SOURCE = `industrie|Atelier de redressage de châssis agricoles|Contrôle sur marbre~steelTable|Redressage des longerons~machine|Mesure des diagonales~workbench
industrie|Forge de ferrures de clôture|Débit des plats métalliques~workbench|Formage des gonds~machine|Rangement des ferrures~shelf
industrie|Manufacture de ressorts mécaniques|Bobinage des spires~machine|Calibrage des efforts~workbench|Classement des ressorts~shelf
industrie|Atelier de roulements reconditionnés|Démontage des cages~workbench|Lavage des bagues~washer|Contrôle de rotation~steelTable
industrie|Halle de galvanisation à froid|Décapage des pièces~sink|Application des protections~steelTable|Séchage sur chevalets~clampRack
industrie|Atelier de tuyauterie cintrée|Coupe des tubes~sawBench|Cintrage des conduites~machine|Vérification des raccords~workbench
industrie|Manufacture de vannes manuelles|Usinage des sièges~machine|Assemblage des volants~workbench|Banc des joints~steelTable
industrie|Atelier de chaînes de transmission|Tri des maillons~steelTable|Rivetage des axes~machine|Contrôle des pas~workbench
industrie|Atelier de lames de scie|Affûtage des dents~machine|Avoyage des lames~workbench|Contrôle des couronnes~clampRack
industrie|Atelier de poinçons d'emboutissage|Gravure des matrices~machine|Appairage des poinçons~steelTable|Archivage des gabarits~shelf
industrie|Atelier de grilles de ventilation|Découpe des tôles~machine|Pliage des persiennes~workbench|Assemblage des cadres~clampRack
industrie|Fabrique de rivets et entretoises|Débit des barres~sawBench|Frappe des têtes~machine|Tri dimensionnel~steelTable
industrie|Atelier de balances mécaniques|Montage des fléaux~workbench|Réglage des contrepoids~steelTable|Étalonnage des plateaux~table
industrie|Atelier de serrures à clés|Taille des ébauches~machine|Montage des cylindres~workbench|Classement des clés témoins~shelf
industrie|Halle de contrôle des cordons soudés|Préparation des éprouvettes~steelTable|Lecture des soudures~workbench|Stockage des coupons~shelf
industrie|Atelier de pompes à piston|Réfection des chemises~machine|Montage des clapets~workbench|Contrôle des tiges~steelTable
industrie|Atelier de compresseurs à courroie|Dépose des poulies~workbench|Révision des culasses~machine|Réglage des courroies~clampRack
industrie|Manufacture de poignées métalliques|Moulage des poignées~machine|Ébavurage des prises~workbench|Appairage des platines~steelTable
industrie|Atelier de cages de sécurité|Préparation des arceaux~sawBench|Soudage des montants~workbench|Contrôle des assemblages~steelTable
industrie|Atelier de réparations de treuils|Inspection des tambours~machine|Remplacement des câbles~hoseRack|Réglage des cliquets~workbench
industrie|Manufacture de joints découpés|Traçage des feuilles~steelTable|Découpe des profils~machine|Classement des joints~shelf
industrie|Atelier de gaines textiles techniques|Ourdissage des gaines~machine|Couture des renforts~workbench|Contrôle des manchons~steelTable
industrie|Atelier de filtres de ventilation|Montage des cadres filtrants~workbench|Pose des médias~steelTable|Conditionnement des cartouches~crate
industrie|Fabrique de courroies cousues|Découpe des bandes~steelTable|Assemblage des jonctions~machine|Contrôle des tensions~workbench
industrie|Atelier de bâches de camion|Prise des patrons~table|Soudure des lés~workbench|Pose des œillets~machine
industrie|Manufacture de filets de manutention|Nouage des mailles~workbench|Pose des sangles~steelTable|Épreuve des attaches~clampRack
industrie|Atelier de sellerie utilitaire|Découpe des rembourrages~table|Couture des housses~machine|Montage des sièges~workbench
industrie|Atelier de vêtements de soudage|Préparation des cuirs~table|Assemblage des protections~machine|Finition des attaches~workbench
industrie|Fabrique de matelas de dortoir|Découpe des garnitures~steelTable|Couture des enveloppes~machine|Compression des matelas~palletStack
industrie|Atelier de réparation de tentes|Diagnostic des toiles~table|Reprise des coutures~machine|Tri des arceaux~clampRack
industrie|Atelier de cordages tressés|Dévidage des fibres~shelf|Tressage des cordes~machine|Bobinage des écheveaux~workbench
industrie|Manufacture de sacs de récolte|Découpe des panneaux~table|Couture des anses~machine|Contrôle des coutures~workbench
industrie|Atelier de feutres isolants|Cardage des fibres~machine|Pressage des nappes~steelTable|Découpe des bandes~workbench
industrie|Atelier de rideaux occultants|Préparation des doublures~table|Assemblage des lés~machine|Pose des rails témoins~workbench
industrie|Fabrique de manchons de canalisation|Découpe des enveloppes~steelTable|Assemblage des coques~workbench|Tri des diamètres~shelf
industrie|Atelier de rempaillage de sièges|Démontage des assises~workbench|Tressage des pailles~table|Réglage des piétements~clampRack
industrie|Manufacture de fenêtres à guillotine|Profilage des montants~sawBench|Pose des contrepoids~workbench|Montage des vitrages~steelTable
industrie|Atelier de charpentes à chevilles|Traçage des tenons~timberRack|Mortaisage des poutres~machine|Assemblage à blanc~clampRack
industrie|Atelier de bardeaux de bois|Refente des billes~logs|Calibrage des bardeaux~sawBench|Séchage des bottes~timberRack
industrie|Atelier de caisses de transport|Débit des panneaux~sawBench|Clouage des caisses~workbench|Pose des calages~palletStack
industrie|Atelier de manches d'outils|Ébauche des carrelets~timberRack|Tournage des manches~machine|Ajustage des emmanchements~workbench
industrie|Fabrique de volets pliants|Préparation des lames~sawBench|Assemblage des vantaux~workbench|Réglage des charnières~clampRack
industrie|Atelier de réparation de tonneaux|Démontage des cerclages~workbench|Réfection des douelles~sawBench|Remontage des fûts~clampRack
industrie|Atelier d'escaliers modulaires en bois|Débit des limons~timberRack|Taille des marches~sawBench|Assemblage des volées~workbench
industrie|Manufacture de coffrages réemployables|Découpe des peaux~sawBench|Pose des raidisseurs~workbench|Contrôle des panneaux~steelTable
industrie|Atelier de plinthes profilées|Préparation des planches~timberRack|Moulurage des chants~machine|Tri des longueurs~clampRack
industrie|Atelier de meubles de laboratoire|Préparation des caissons~workbench|Pose des paillasses~steelTable|Montage des tiroirs~clampRack
industrie|Manufacture de rayonnages en bois|Débit des montants~sawBench|Assemblage des travées~workbench|Contrôle des tablettes~shelf
industrie|Atelier de roues de charrette|Cintrage des jantes~workbench|Pose des rayons~clampRack|Ajustage des moyeux~machine
industrie|Atelier de cadres d'affichage|Découpe des baguettes~sawBench|Assemblage des angles~workbench|Pose des fonds~steelTable
industrie|Atelier de reliure à dos cousu|Préparation des cahiers~table|Couture des signatures~workbench|Pressage des volumes~machine
industrie|Atelier de clichés typographiques|Composition des caractères~desk|Gravure des plaques~workbench|Épreuves sur presse~machine
industrie|Fabrique de boîtes pliantes|Rainurage des cartons~machine|Pliage des ébauches~steelTable|Collage des languettes~workbench
industrie|Atelier de sacs en papier kraft|Dévidage des bobines~machine|Formation des soufflets~steelTable|Collage des fonds~workbench
industrie|Atelier de tampons encreurs|Gravure des gommes~workbench|Montage des supports~steelTable|Essai des empreintes~desk
industrie|Atelier d'étiquettes de traçabilité|Préparation des matrices~desk|Impression des bandes~machine|Massicotage des lots~steelTable
industrie|Atelier de réparation de presses manuelles|Démontage des vis~workbench|Réfection des plateaux~machine|Réglage des leviers~steelTable
industrie|Manufacture de chemises d'archives|Découpe des cartons neutres~steelTable|Montage des rabats~workbench|Tri des formats~shelf
industrie|Atelier de signalétique peinte|Préparation des plaques~steelTable|Traçage des lettres~workbench|Séchage des panneaux~clampRack
industrie|Atelier de gravure de plaques de machine|Composition des références~desk|Gravure des indications~machine|Contrôle des poinçonnages~steelTable
industrie|Atelier de bobinage de moteurs|Dépose des enroulements~workbench|Bobinage des stators~machine|Contrôle des isolants~electricalRack
industrie|Atelier de transformateurs de commande|Montage des noyaux~steelTable|Enroulement des bobines~machine|Vérification des bornes~electricalRack
industrie|Atelier de faisceaux de câblage|Coupe des conducteurs~workbench|Sertissage des cosses~machine|Contrôle de continuité~electricalRack
industrie|Atelier de lampes de chantier|Réfection des carters~workbench|Montage des réflecteurs~steelTable|Contrôle des connexions~electricalRack
industrie|Atelier de postes radio analogiques|Dépoussiérage des châssis~workbench|Réglage des circuits~electricalRack|Classement des composants~shelf
industrie|Atelier d'instruments à aiguille|Réparation des mécanismes~steelTable|Montage des cadrans~workbench|Étalonnage des affichages~desk
industrie|Atelier de batteries à boîtiers démontables|Ouverture des bacs~steelTable|Tri des plaques hors tension~workbench|Rangement des connexions~electricalRack
industrie|Atelier de connecteurs industriels|Assemblage des broches~workbench|Moulage des capots~machine|Contrôle des verrouillages~steelTable
industrie|Atelier de ventilateurs de toiture|Équilibrage des hélices~machine|Montage des paliers~workbench|Révision des grilles~steelTable
industrie|Atelier de minuteries mécaniques|Montage des engrenages~workbench|Réglage des ressorts~steelTable|Contrôle des déclencheurs~desk
industrie|Atelier de carreaux de ciment|Préparation des moules~workbench|Pressage des carreaux~machine|Cure des pièces~palletStack
industrie|Atelier de briques réfractaires|Mélange des terres~machine|Formage des briques~steelTable|Refroidissement des fournées~palletStack
industrie|Atelier de vitraux de protection|Découpe des verres~steelTable|Assemblage des plombs~workbench|Pose des cadres~clampRack
industrie|Atelier de doubles vitrages démontables|Lavage des feuilles~sink|Pose des entretoises~steelTable|Scellement périphérique~workbench
industrie|Atelier de tubes de verre gradués|Façonnage des tubes~workbench|Marquage des graduations~desk|Contrôle des bouchons~shelf
industrie|Manufacture de pièces isolantes en céramique|Préparation des pâtes~steelTable|Pressage des supports~machine|Tri après cuisson~shelf
industrie|Atelier de mortiers de réparation|Pesée des granulats~steelTable|Mélange des charges sèches~machine|Ensachage des mélanges~crate
industrie|Atelier de dalles de terrasse moulées|Nettoyage des moules~sink|Coulage des dalles~steelTable|Cure sous abri~palletStack
industrie|Atelier de mosaïques utilitaires|Découpe des tesselles~workbench|Pose sur trames~steelTable|Classement des motifs~shelf
industrie|Atelier de conduits de cheminée en terre|Préparation des formes~workbench|Extrusion des conduits~machine|Tri des raccords~palletStack
industrie|Atelier de coffres à outils roulants|Pliage des caissons~machine|Montage des tiroirs~workbench|Pose des roues~steelTable
industrie|Atelier de transpalettes manuels|Réfection des vérins~workbench|Ajustage des fourches~machine|Contrôle des galets~steelTable
industrie|Atelier de charnières de porte blindée|Usinage des axes~machine|Ajustage des paumelles~workbench|Épreuve des pivots~steelTable
industrie|Atelier de poêles à combustion lente|Assemblage des foyers~workbench|Montage des clapets~steelTable|Contrôle des conduits~clampRack
industrie|Atelier de coffrets de secours portatifs|Découpe des compartiments~steelTable|Montage des poignées~workbench|Contrôle des fermetures~shelf
agriculture|Station de nettoyage des semences|Réception des graines brutes~crate|Séparation des impuretés~machine|Ensachage des semences nettes~steelTable
agriculture|Maison de conservation des graines paysannes|Identification des lots~desk|Séchage des graines~plantTray|Rangement des enveloppes~shelf
agriculture|Laboratoire de germination rurale|Préparation des échantillons~steelTable|Mise en plateaux témoins~plantTray|Lecture des levées~desk
agriculture|Halle de greffage arboricole|Préparation des porte-greffes~plantTray|Assemblage des greffons~workbench|Cicatrisation sous abri~shelf
agriculture|Atelier de bouturage de haies|Débit des rameaux~steelTable|Mise en godets~plantTray|Classement des plants repris~shelf
agriculture|Pépinière de restauration bocagère|Réception des jeunes plants~plantTray|Préparation des racines~steelTable|Départ des fagots plantables~timberRack
agriculture|Serre de multiplication des porte-greffes|Préparation des substrats~workbench|Tables de jeunes pousses~plantTray|Tri des pieds sains~steelTable
agriculture|Maison des stolons de fraisiers|Réception des pieds mères~plantTray|Séparation des stolons~steelTable|Rangement des barquettes~shelf
agriculture|Serre d'hivernage des plants sensibles|Sas des plants rentrés~plantTray|Tables d'hivernage~shelf|Poste de surveillance des pots~desk
agriculture|Serre de reprise des plants repiqués|Préparation des mottes~steelTable|Tables de repiquage~plantTray|Dégagement de sortie des plants~bench
agriculture|Atelier de composts horticoles tamisés|Réception des matières sèches~crate|Tamisage des mélanges~machine|Rangement des sacs de terreau~palletStack
agriculture|Station de dosage des substrats|Pesée des composants~steelTable|Mélange des terreaux~machine|Étiquetage des recettes~desk
agriculture|Atelier de motteuses maraîchères|Remplissage des trémies~crate|Pressage des mottes~machine|Préparation des plateaux~plantTray
agriculture|Station de lavage des caisses de récolte|Dépose des caisses sales~crate|Lavage des caisses~washer|Égouttage des caisses propres~dishRack
agriculture|Halle de pesée des récoltes partagées|Réception des récoltes~crate|Pesée des apports~steelTable|Répartition des parts~counter
agriculture|Bureau de diagnostic des sols|Accueil des prélèvements~desk|Préparation des terres~steelTable|Rangement des échantillons~shelf
agriculture|Atelier d'entretien des outils de greffe|Désassemblage des outils~workbench|Affûtage des lames~machine|Rangement des outils préparés~shelf
agriculture|Dépôt de supports pour cultures grimpantes|Tri des tuteurs~timberRack|Réparation des cadres~workbench|Préparation des attaches~clampRack
agriculture|Halle de séchage des gerbes|Réception des gerbes~palletStack|Ventilation des bottes~shelf|Tri des gerbes sèches~steelTable
agriculture|Grange de battage des petites récoltes|Mise en bottes~bench|Battage des épis~machine|Séparation des grains~steelTable
agriculture|Station de décorticage des semences|Réception des graines vêtues~crate|Dépose des enveloppes~machine|Tri des graines intactes~steelTable
agriculture|Atelier de nettoyage des fibres de chanvre|Réception des tiges sèches~timberRack|Séparation des fibres~machine|Rangement des filasses~shelf
agriculture|Halle de fanage sous couverture|Dépose des fourrages~palletStack|Étagement des claies~shelf|Préparation des ballots~workbench
agriculture|Grange de stockage des pailles de litière|Réception des bottes~palletStack|Tri des pailles propres~steelTable|Préparation des litières~crate
agriculture|Atelier de bouchons de fourrage|Préparation des fibres~steelTable|Compactage des bouchons~machine|Conditionnement des rations~crate
agriculture|Station de rationnement des élevages|Réception des ingrédients~crate|Pesée des compléments~steelTable|Préparation des rations~counter
agriculture|Maison des analyses de fourrages|Accueil des sachets~desk|Préparation des fibres témoins~steelTable|Classement des résultats~shelf
agriculture|Halle de conditionnement des œufs fermiers|Dépose des plateaux~crate|Lecture des coquilles~steelTable|Emballage des œufs conservés~counter
agriculture|Bâtiment de soins des poules blessées|Accueil des caisses d'oiseaux~kennel|Poste de soins avicoles~medical|Reprise en boxes calmes~bench
agriculture|Poussinière de démarrage avicole|Sas des caisses de poussins~crate|Tables de démarrage~plantTray|Rangement des nourrisseurs~shelf
agriculture|Maison de couvaison fermière|Préparation des plateaux d'œufs~steelTable|Compartiment des couveuses arrêtées~machine|Tri des casiers d'éclosion~shelf
agriculture|Atelier de réparation des ruches|Démontage des corps de ruche~workbench|Réfection des cadres~clampRack|Rangement des hausses~shelf
agriculture|Maison de préparation des cadres apicoles|Préparation des baguettes~sawBench|Pose des fils tendus~workbench|Montage des feuilles de cire~steelTable
agriculture|Centre de mise en quarantaine du matériel apicole|Dépose des hausses suspectes~palletStack|Nettoyage des outils~washer|Classement du matériel isolé~shelf
agriculture|Bâtiment de tonte des ovins|Attente en cases de tonte~kennel|Postes de tonte démontés~workbench|Tri des toisons~steelTable
agriculture|Halle de classement des laines brutes|Réception des toisons~crate|Séparation des qualités de laine~steelTable|Compression des ballots~palletStack
agriculture|Bergerie de mise bas compartimentée|Accueil des brebis isolées~kennel|Cases de naissance vides~bench|Réserve de matériel de soin~medical
agriculture|Chevrerie de soins aux jeunes animaux|Accueil des chevreaux isolés~kennel|Préparation des biberons~sink|Boxes de repos vidés~bench
agriculture|Bâtiment de parage des sabots|Sas de contention vide~kennel|Poste de parage~workbench|Rangement des outils sanitaires~medical
agriculture|Maison de consultation vétérinaire d'élevage|Accueil des éleveurs~desk|Salle d'examen rural~steelTable|Réserve de pansements~medical
agriculture|Dépôt de pharmacie vétérinaire rurale|Vérification des ordonnances~desk|Rangement des traitements restants~medical|Conditionnement des lots conservés~shelf
agriculture|Bâtiment de collecte du lait en petits lots|Réception des bidons~steelTable|Compartiment des refroidisseurs arrêtés~fridge|Nettoyage des bidons~sink
agriculture|Salle de traite pédagogique démontée|Entrée de contention vide~kennel|Alignement des postes arrêtés~pump|Lavage des accessoires~sink
agriculture|Nurserie bovine à cases séparées|Sas des jeunes animaux évacués~kennel|Cases de repos vidées~bench|Préparation des matériels d'allaitement~sink
agriculture|Bâtiment de surveillance des vêlages|Accueil de la maternité vide~kennel|Postes d'observation~desk|Réserve de cordes et soins~medical
agriculture|Maison de rééducation des chevaux de travail|Accueil de sellerie~wardrobe|Atelier des harnais~workbench|Salle des soins de reprise~medical
agriculture|Atelier de réparation des jougs|Tri des pièces de joug~timberRack|Assemblage des liens~workbench|Réglage des appuis~clampRack
agriculture|Écurie de pansage des animaux de trait|Dépose des harnachements~wardrobe|Places de pansage vides~bench|Rangement des brosses et soins~medical
agriculture|Bâtiment de pesée des animaux d'élevage|Attente en couloir séparé~kennel|Plateau de pesée arrêté~machine|Bureau des passages~desk
agriculture|Maison d'identification des troupeaux|Accueil des registres~desk|Préparation des boucles~steelTable|Rangement des pinces~workbench
agriculture|Atelier de lavage des équipements de traite|Réception des gobelets~crate|Lavage des conduites courtes~sink|Égouttage des accessoires~dishRack
agriculture|Station de collecte des prélèvements vétérinaires|Dépose des tubes fermés~steelTable|Rangement des emballages~shelf|Contrôle des fiches d'expédition~desk
agriculture|Bâtiment de quarantaine des outils d'élevage|Dépose du matériel isolé~crate|Nettoyage des surfaces~washer|Rangement séparé des outils~workbench
agriculture|Maison des bergers itinérants|Accueil des parcours~desk|Entretien des sacs de marche~workbench|Salle de repos des tournées~bed
agriculture|Dépôt de clôtures mobiles pastorales|Réception des filets~shelf|Réparation des attaches~workbench|Préparation des bobines~hoseRack
agriculture|Atelier de nourrisseurs gravitaires|Découpe des trémies~steelTable|Assemblage des goulottes~workbench|Réglage des trappes~machine
agriculture|Centre de calibrage des semoirs|Préparation des bacs témoins~crate|Réglage des doseurs~machine|Pesée des débits arrêtés~steelTable
agriculture|Atelier de réparation des sécateurs agricoles|Démontage des poignées~workbench|Affûtage des contre-lames~machine|Montage des ressorts~steelTable
agriculture|Halle de réglage des pulvérisateurs démontés|Réception des buses~crate|Nettoyage des filtres~sink|Contrôle des manomètres déposés~workbench
agriculture|Atelier de conduites d'irrigation démontables|Tri des tronçons~hoseRack|Réparation des raccords~workbench|Préparation des joints~steelTable
agriculture|Dépôt de caisses-palettes agricoles|Réception des caisses fendues~palletStack|Réparation des planches~workbench|Tri des caisses préparées~crate
agriculture|Atelier de roues de brouettes|Réparation des moyeux~machine|Montage des bandages~workbench|Appairage des axes~steelTable
agriculture|Maison de prêt des outils maraîchers|Accueil des emprunts~desk|Contrôle des outils rendus~workbench|Rangement des outils prêtables~shelf
agriculture|Halle de nettoyage des bulbes conservés|Dépose des paniers de bulbes~crate|Brossage des enveloppes~steelTable|Tri des bulbes intacts~plantTray
agriculture|Station de cure des tubercules|Réception des caisses ajourées~crate|Claies de repos des tubercules~shelf|Classement des lots conservés~steelTable
agriculture|Maison de séchage des plantes médicinales|Réception des bouquets~plantTray|Étagement des claies sèches~shelf|Tri des herbes conservées~steelTable
agriculture|Atelier de tri des fruits à pépins|Réception des récoltes~crate|Classement des calibres~steelTable|Rangement des cageots préparés~palletStack
agriculture|Halle de stockage des racines en bacs|Réception des bacs de racines~crate|Tri des légumes conservables~steelTable|Étagement des bacs de garde~shelf
agriculture|Station de lavage des légumes terreux|Dépose des racines brutes~crate|Lavage en bacs arrêtés~sink|Égouttage des légumes~dishRack
agriculture|Atelier de préparation des bouquets maraîchers|Réception des bottes~plantTray|Tri des tiges~steelTable|Nouage des bouquets~workbench
agriculture|Maison des récoltes communautaires|Accueil des apports notés~desk|Répartition sur tables~steelTable|Préparation des parts de retour~crate
agriculture|Atelier de sacs de semis contrôlés|Réception des lots retenus~crate|Pesée des graines de semis~steelTable|Fermeture des sacs identifiés~workbench
agriculture|Station de surveillance des ravageurs|Accueil des relevés~desk|Tri des pièges témoins arrêtés~steelTable|Classement des échantillons~shelf
agriculture|Maison de suivi des pollinisateurs|Consultation des carnets de terrain~desk|Préparation des abris témoins~workbench|Rangement des relevés photographiques~shelf
agriculture|Atelier de nichoirs pour auxiliaires agricoles|Débit des panneaux de nichoir~sawBench|Assemblage des chambres~workbench|Contrôle des ouvertures~steelTable
agriculture|Maison de repérage des haies bocagères|Lecture des plans de haies~desk|Préparation des piquets de repérage~workbench|Rangement des carnets de coupe~shelf
agriculture|Station de contrôle des fruits destinés au stockage|Réception des échantillons de verger~crate|Inspection des chairs~steelTable|Tri des cageots témoins~shelf
agriculture|Atelier de réparation des filets de verger|Déroulage des nappes déchirées~steelTable|Reprise des mailles~workbench|Pose des attaches de bord~clampRack
agriculture|Halle de tri des copeaux de litière|Réception des copeaux secs~crate|Séparation des gros fragments~machine|Préparation des sacs de litière~palletStack
agriculture|Maison des comptes de récolte solidaire|Accueil des carnets d'apport~desk|Préparation des étiquettes de parts~table|Archivage des pesées~shelf
reseaux|Atelier de pompes de captage déposées|Réception des pompes retirées~palletStack|Réfection des roues~workbench|Contrôle des garnitures~steelTable
reseaux|Maison d'échantillonnage de l'eau brute|Dépose des flacons fermés~steelTable|Préparation des prélèvements~sink|Rangement des fiches d'analyse~desk
reseaux|Station terrestre de filtres à cartouche|Réception des boîtiers~crate|Dépose des cartouches arrêtées~workbench|Tri des pièces remplaçables~shelf
reseaux|Bâtiment de commande de surpression|Salle des tableaux hors tension~electricalRack|Alignement des pompes arrêtées~pump|Poste des relevés de pression~desk
reseaux|Atelier de compteurs d'eau démontés|Nettoyage des corps~sink|Réfection des engrenages~workbench|Contrôle des index déposés~steelTable
reseaux|Station de stockage de raccords hydrauliques|Réception des raccords~crate|Tri des filetages~steelTable|Rangement des accessoires~shelf
reseaux|Maison des essais de joints hydrauliques|Préparation des éprouvettes~steelTable|Montage des joints témoins~workbench|Classement des mesures passées~desk
reseaux|Bâtiment de membranes filtrantes déposées|Accueil des modules isolés~palletStack|Inspection des supports~steelTable|Rangement des membranes sèches~shelf
reseaux|Atelier de réparation des fontaines manuelles|Dépose des mécanismes~workbench|Réfection des clapets~steelTable|Montage des leviers~clampRack
reseaux|Station des matériels de désinfection arrêtés|Accueil des emballages fermés~crate|Salle des doseurs déposés~machine|Rangement des accessoires de contrôle~shelf
reseaux|Bâtiment de lavage des petits filtres|Dépose des paniers filtrants~crate|Nettoyage des cadres~washer|Égouttage des pièces~dishRack
reseaux|Maison de suivi des pertes de conduites|Accueil des relevés de fuite~desk|Entretien des capteurs déposés~workbench|Archivage des tronçons repérés~shelf
reseaux|Atelier de tubes de distribution sertis|Coupe des tubes courts~sawBench|Pose des manchons~workbench|Contrôle des assemblages~steelTable
reseaux|Station de conditionnement des flacons de terrain|Lavage des flacons~sink|Rangement des contenants secs~dishRack|Préparation des mallettes~steelTable
reseaux|Bâtiment de commande de drainage fermé|Salle des armoires arrêtées~electricalRack|Atelier des flotteurs déposés~workbench|Bureau des niveaux enregistrés~desk
reseaux|Maison des archives de prélèvement hydraulique|Accueil des bordereaux~desk|Tri des carnets de terrain~table|Réserve des plans de conduites~shelf
reseaux|Atelier de réparation des flexibles alimentaires|Dépose des tuyaux courts~hoseRack|Coupe des extrémités~workbench|Pose des raccords démontables~steelTable
reseaux|Station de réemploi des cuves portatives|Inspection des petits réservoirs~steelTable|Nettoyage des bouchons~sink|Rangement des cuves préparées~palletStack
reseaux|Bâtiment de distribution de bidons scellés|Dépose des stocks conservés~crate|Vérification des fermetures~steelTable|Préparation des lots de secours~counter
reseaux|Maison des relevés de réseau sanitaire|Accueil des plans de secteur~desk|Entretien des boîtiers témoins~workbench|Classement des carnets d'intervention~shelf
reseaux|Atelier de parafoudres de réseau déposés|Réception des modules isolés~crate|Inspection des isolateurs~steelTable|Montage des connexions~electricalRack
reseaux|Maison de contrôle des onduleurs arrêtés|Accueil des appareils débranchés~palletStack|Révision des cartes~workbench|Contrôle des borniers~electricalRack
reseaux|Atelier de coffrets de coupure électrique|Réfection des caissons~workbench|Montage des sectionneurs~steelTable|Contrôle des verrouillages~electricalRack
reseaux|Bâtiment de stockage des câbles de secours|Réception des couronnes~hoseRack|Tri des longueurs~steelTable|Préparation des prises~workbench
reseaux|Maison de maintenance des panneaux solaires déposés|Inspection des cadres~steelTable|Réparation des fixations~workbench|Rangement des connectiques~electricalRack
reseaux|Atelier de pales d'éoliennes démontées|Réception des tronçons courts~palletStack|Réparation des attaches~workbench|Contrôle des gabarits~steelTable
reseaux|Bâtiment de synchronisation électrique hors service|Salle des anciens pupitres~electricalRack|Atelier des relais déposés~workbench|Archives des courbes de charge~desk
reseaux|Atelier de refroidisseurs de transformateurs|Inspection des ailettes~steelTable|Réfection des joints~workbench|Tri des ventilateurs déposés~machine
reseaux|Maison des étalons de tension|Accueil des instruments débranchés~desk|Rangement des boîtes étalons~shelf|Poste des comparaisons archivées~electricalRack
reseaux|Station de réparation des prises de recharge|Dépose des embases~workbench|Montage des contacts~steelTable|Contrôle des capots~electricalRack
reseaux|Atelier de groupes électrogènes portatifs|Réception des groupes arrêtés~generator|Révision des démarreurs~workbench|Rangement des filtres~shelf
reseaux|Dépôt de carburants pour groupes de secours|Accueil des bidons scellés~fuel|Contrôle des bouchons~steelTable|Préparation des lots de ravitaillement~crate
reseaux|Maison des automatismes de commutation|Tri des relais hors tension~electricalRack|Montage des commandes~workbench|Archivage des schémas~desk
reseaux|Atelier de projecteurs autonomes déposés|Réfection des pieds~clampRack|Pose des réflecteurs~workbench|Contrôle des câbles débranchés~electricalRack
reseaux|Bâtiment de maintenance des coffres de batteries|Inspection des coffres vides~steelTable|Réfection des supports~workbench|Tri des liaisons démontées~electricalRack
reseaux|Atelier de capteurs météorologiques arrêtés|Réception des sondes déposées~crate|Révision des boîtiers~workbench|Archivage des relevés passés~desk
reseaux|Maison des équipements de télécommande de réseau|Accueil des terminaux débranchés~desk|Réparation des boîtiers~workbench|Rangement des modules radio~electricalRack
reseaux|Atelier de tresses de mise à la terre|Débit des tresses~steelTable|Sertissage des pattes~workbench|Contrôle des liaisons démontées~electricalRack
reseaux|Station de préparation des kits de panne|Tri des matériels de coupure~steelTable|Rangement des câbles de reprise~hoseRack|Conditionnement des coffrets~crate
reseaux|Maison des plans de répartition énergétique|Lecture des plans de départs~desk|Rangement des anciens compteurs~shelf|Classement des carnets de consignation~table
reseaux|Atelier de tri des métaux de récupération|Dépose des apports séparés~crate|Classement des pièces métalliques~steelTable|Préparation des lots récupérables~palletStack
reseaux|Maison de démontage des appareils électroménagers|Réception des appareils arrêtés~washer|Dépose des moteurs~workbench|Tri des pièces nettoyées~shelf
reseaux|Halle de réemploi des matériaux de construction|Réception des lots déposés~palletStack|Contrôle des pièces réutilisables~steelTable|Rangement des éléments retenus~timberRack
reseaux|Atelier de reconditionnement des bidons industriels|Dépose des bidons vides~crate|Réparation des fermetures~workbench|Tri des contenants réutilisables~steelTable
reseaux|Station terrestre de matériel de compostage|Réception des petits broyeurs arrêtés~machine|Réparation des grilles~workbench|Rangement des bacs vides~crate
reseaux|Bâtiment de tri des textiles de récupération|Réception des sacs fermés~crate|Séparation des tissus conservables~steelTable|Préparation des ballots secs~palletStack
reseaux|Atelier de démontage des fenêtres récupérées|Dépose des cadres~clampRack|Retrait des quincailleries~workbench|Tri des vitrages entiers~steelTable
reseaux|Maison de classement des outils récupérés|Accueil des caisses d'outils~crate|Diagnostic des mécanismes~workbench|Rangement des ensembles retenus~shelf
reseaux|Halle de tri des emballages rigides|Réception des emballages~palletStack|Classement des formes~steelTable|Empilage des caisses récupérables~crate
reseaux|Atelier de remise en état des meubles collectés|Démontage des assemblages~workbench|Réparation des panneaux~sawBench|Montage des meubles préparés~clampRack
reseaux|Maison de collecte des lampes hors service|Dépose des boîtes fermées~crate|Tri des supports démontés~steelTable|Rangement des pièces électriques~electricalRack
reseaux|Bâtiment d'isolement des déchets dangereux scellés|Accueil des emballages identifiés~crate|Vérification extérieure des fermetures~steelTable|Bureau des bordereaux d'enlèvement~desk
reseaux|Atelier de reconditionnement des bobines de câble|Tri des bobines récupérées~hoseRack|Contrôle des sections déposées~workbench|Classement des longueurs utiles~shelf
reseaux|Maison de récupération des pièces de chauffage|Dépose des radiateurs froids~palletStack|Réfection des robinets~workbench|Tri des raccords conservés~steelTable
reseaux|Station de réparation des bacs de collecte|Réception des bacs endommagés~crate|Montage des roues et capots~workbench|Contrôle des poignées~steelTable
alimentaire|Atelier de pâtes sèches laminées|Préparation des pâtons~steelTable|Laminage des rubans~machine|Séchage sur claies~dishRack
alimentaire|Biscuiterie de rationnement|Pesée des farines~steelTable|Façonnage des biscuits~workbench|Poste des fours arrêtés~oven
alimentaire|Atelier de galettes de conservation|Préparation des mélanges~steelTable|Pressage des galettes~machine|Rangement des lots emballés~crate
alimentaire|Halle de déshydratation des légumes|Découpe des morceaux~steelTable|Chargement des claies sèches~dishRack|Conditionnement des sachets~counter
alimentaire|Atelier de fruits séchés en tranches|Tri des fruits conservés~crate|Découpe des lamelles~steelTable|Mise en claies~dishRack
alimentaire|Maison de pressage des oléagineux|Nettoyage des graines~steelTable|Salle des presses arrêtées~machine|Rangement des bouteilles scellées~shelf
alimentaire|Atelier de pâte de graines alimentaires|Préparation des graines~steelTable|Broyage des mélanges arrêté~machine|Remplissage des pots conservés~counter
alimentaire|Atelier de farines de légumineuses|Tri des grains secs~steelTable|Salle des moulins arrêtés~machine|Ensachage des lots conservés~crate
alimentaire|Halle de semoules calibrées|Réception des farines brutes~crate|Séparation des calibres~machine|Conditionnement des semoules~steelTable
alimentaire|Atelier de torréfaction des céréales|Préparation des grains~steelTable|Salle des tambours froids~machine|Refroidissement sur plateaux~dishRack
alimentaire|Maison de conserves lactofermentées|Lavage des légumes~sink|Préparation des bocaux~steelTable|Rangement des pots fermés~shelf
alimentaire|Atelier de saumures alimentaires|Pesée des ingrédients~steelTable|Mélange des préparations arrêté~machine|Rangement des bidons scellés~crate
alimentaire|Atelier de condiments en pots|Préparation des légumes et herbes~steelTable|Broyage des mélanges arrêté~machine|Remplissage des pots restants~counter
alimentaire|Maison de confitures de garde|Préparation des fruits~steelTable|Salle des cuiseurs froids~oven|Rangement des bocaux fermés~shelf
alimentaire|Atelier de gelées de fruits filtrées|Dépose des pulpes~steelTable|Filtration des jus arrêtée~machine|Conditionnement des pots conservés~counter
alimentaire|Atelier de fruits au sirop|Tri des quartiers~steelTable|Salle des cuves froides~machine|Rangement des bocaux scellés~shelf
alimentaire|Maison de miel conditionné|Dépose des cadres vides~clampRack|Salle des extracteurs arrêtés~machine|Rangement des pots de miel~shelf
alimentaire|Atelier de blocs de sucre de ration|Préparation des mélanges secs~steelTable|Pressage des pains arrêté~machine|Emballage des blocs conservés~counter
alimentaire|Atelier de lait en poudre conditionné|Dépose des sacs scellés~crate|Pesée des portions~steelTable|Rangement des boîtes fermées~shelf
alimentaire|Fromagerie de pressage des tommes|Préparation des moules~steelTable|Salle des presses arrêtées~machine|Claies d'affinage vides~dishRack
alimentaire|Atelier de beurre en pains|Préparation des matériels~sink|Salle des barattes arrêtées~machine|Poste de moulage des pains~steelTable
alimentaire|Maison de séchage des fromages|Réception des claies~dishRack|Tri des anciennes meules~steelTable|Rangement des emballages~shelf
alimentaire|Atelier de viandes séchées emballées|Dépose des lots conservés~crate|Poste de tranchage arrêté~steelTable|Rangement des sachets scellés~shelf
alimentaire|Atelier de poissons en bocaux|Réception des emballages fermés~crate|Préparation des bocaux~steelTable|Rangement des lots conservés~shelf
alimentaire|Halle de repas de secours en barquettes|Préparation des plateaux~steelTable|Portionnement des stocks finis~counter|Classement des barquettes scellées~shelf
alimentaire|Atelier de bouillons concentrés|Pesée des ingrédients conservés~steelTable|Salle des cuves de cuisson froides~oven|Conditionnement des pains de bouillon~counter
alimentaire|Atelier d'herbes culinaires conditionnées|Dépose des bouquets secs~plantTray|Tri des feuilles~steelTable|Rangement des sachets fermés~shelf
alimentaire|Maison de mélanges d'épices|Accueil des sacs identifiés~crate|Pesée des assemblages~steelTable|Conditionnement des pots conservés~counter
alimentaire|Atelier de rations de marche compressées|Tri des composants secs~steelTable|Poste de compactage arrêté~machine|Préparation des lots de marche~crate
alimentaire|Bâtiment de contrôle des conserves de secours|Réception des cartons datés~crate|Vérification extérieure des fermetures~steelTable|Classement des réserves retenues~shelf`;

const CATEGORIES = {
  industrie: {
    family: 'Industrie et production', mode: 'any',
    biomes: ['brownfield', 'heath', 'limestone', 'meadow'],
    townKinds: ['bourg', 'ville', 'grande-ville'],
    intake: 'Réception des pièces à traiter', output: 'Réserve des assemblages terminés',
    maintenance: 'Entretien des gabarits et outils', office: 'Bureau des bons de fabrication',
    clothing: 'Vestiaire des anciens opérateurs', stock: 'scrap',
    material: [
      'Ossature métallique rivetée, soubassement en brique sombre et plaques de toiture reprises.',
      'Murs de blocs enduits, charpente apparente et couverture de tôle nervurée mate.',
      'Briques d’atelier réparées, linteaux de béton et tôles de service aux joints visibles.',
      'Structure d’acier patinée, remplissage de maçonnerie et toiture légère consolidée.'
    ],
    trace: 'Les bons incomplets, les gabarits marqués et les pièces séparées par opération racontent un arrêt avant livraison.'
  },
  agriculture: {
    family: 'Agriculture', mode: 'rural',
    biomes: ['meadow', 'bocage', 'orchard', 'deciduous', 'mixed'], townKinds: [],
    intake: 'Accueil des apports de terrain', output: 'Réserve des lots préparés au départ',
    maintenance: 'Local des outils de campagne', office: 'Bureau des carnets de saison',
    clothing: 'Vestiaire des équipes de terrain', stock: 'food',
    material: [
      'Maçonnerie rurale irrégulière, poutres de bois réparées et couverture de tuiles ternies.',
      'Soubassement en pierre, bardage de bois usé et plaques de couverture remplacées.',
      'Blocs enduits, poteaux de bois et toiture de tôle mate reprise au droit des raccords.',
      'Briques rurales et charpente de bois, couverture ancienne avec bandes de réparation.'
    ],
    trace: 'Les étiquettes de saison, les paniers laissés en ordre et les registres de passage témoignent d’une activité rurale interrompue.'
  },
  reseaux: {
    family: 'Énergie et communication', mode: 'any',
    biomes: ['brownfield', 'meadow', 'bocage', 'heath', 'limestone'],
    townKinds: ['hameau', 'village', 'bourg', 'ville', 'grande-ville'],
    intake: 'Réception des éléments retirés du service', output: 'Réserve des éléments contrôlés',
    maintenance: 'Atelier des outils de maintenance', office: 'Bureau des anciens bordereaux',
    clothing: 'Vestiaire des équipes de tournée', stock: 'scrap',
    material: [
      'Béton de service fissuré, portes de tôle ternie et toiture technique sans éclairage actif.',
      'Blocs de béton maçonnés, fermes métalliques et couverture à reprises de zinc.',
      'Briques techniques et bardage métallique oxydé, joints de toiture réparés à la main.',
      'Maçonnerie utilitaire, charpente d’acier et couverture nervurée aux fixations visibles.'
    ],
    trace: 'Les consignations, les pièces débranchées et les bordereaux non repris décrivent un service arrêté sans réseau encore exploité.'
  },
  alimentaire: {
    family: 'Alimentation et restauration', mode: 'any',
    biomes: ['meadow', 'bocage', 'orchard', 'brownfield'],
    townKinds: ['village', 'bourg', 'ville', 'grande-ville'],
    intake: 'Réception des ingrédients identifiés', output: 'Réserve des emballages scellés',
    maintenance: 'Lavage des ustensiles et maintenance', office: 'Bureau des anciens lots alimentaires',
    clothing: 'Vestiaire de la préparation alimentaire', stock: 'food',
    material: [
      'Maçonnerie enduite, carrelage d’usage usé et couverture métallique mate réparée.',
      'Briques claires salies, charpente de service et toiture de tôle à reprises de zinc.',
      'Blocs maçonnés et parements lavables ternis, couverture à pente basse consolidée.',
      'Murs de béton utilitaire, ossature métallique et couverture ancienne aux joints apparents.'
    ],
    trace: 'Les listes de lots, les emballages datés et les postes nettoyés à moitié indiquent une préparation interrompue avant expédition.'
  }
};

const KIND_RESOURCES = {
  timberRack: 'wood', sawBench: 'scrap', clampRack: 'scrap', palletStack: 'wood',
  generator: 'scrap', electricalRack: 'scrap', counter: 'scrap', oven: 'scrap',
  washer: 'scrap', kennel: 'scrap', plantTray: 'wood', tirePile: 'scrap',
  hoseRack: 'scrap', bench: 'wood', bed: 'wood', sofa: 'wood', table: 'wood',
  desk: 'scrap', wardrobe: 'wood', shelf: 'scrap', crate: 'scrap', fridge: 'food',
  medical: 'medicine', fuel: 'fuel', workbench: 'scrap', logs: 'wood', rubble: 'stone',
  machine: 'scrap', sink: 'scrap', pump: 'scrap', steelTable: 'scrap', dishRack: 'scrap'
};
const KIND_LABELS = {
  steelTable: 'une table métallique de préparation', machine: 'un poste mécanique arrêté',
  workbench: 'un établi d’opération', shelf: 'un rayonnage de classement', washer: 'un appareil de lavage hors service',
  sink: 'un bac de lavage', clampRack: 'un support d’assemblage', sawBench: 'un banc de coupe arrêté',
  table: 'une table de travail', crate: 'une caisse de lot', palletStack: 'une pile de supports de manutention',
  hoseRack: 'un support de flexibles ou couronnes', timberRack: 'un râtelier de pièces longues', logs: 'un lot de bois brut',
  desk: 'un bureau de contrôle', electricalRack: 'une armoire électrique débranchée', plantTray: 'un plateau de culture conservé',
  kennel: 'une case d’attente désormais vide', bench: 'un banc de travail ou de repos', medical: 'un meuble de soins conservé',
  fridge: 'un meuble de froid arrêté', pump: 'un petit équipement hydraulique arrêté', wardrobe: 'une armoire de rangement',
  bed: 'un lit de repos abandonné', oven: 'un appareil de cuisson froid', counter: 'un comptoir de conditionnement',
  dishRack: 'un support de claies ou d’égouttage', generator: 'un groupe électrogène arrêté', fuel: 'un bidon fermé'
};
const DISTRIBUTIONS = {
  axial: 'couloir médian qui sépare les deux bandes de pièces',
  offset: 'couloir décentré qui distingue les pièces de travail larges des locaux de service',
  cross: 'passage longitudinal et son dégagement transversal de retour',
  gallery: 'passage en galerie centrale élargie entre les pièces avant et les pièces arrière'
};

function isTechnicalAgriculture(name) {
  return /outil|réparation|réparer|clôture|filets|nichoir|jougs|roues|semoirs|réglage|pharmacie|vétérinaire|comptes|suivi|repérage|diagnostic|prélèvement|identification|nourrisseurs|litière|dépôt|conduites|caisses-palettes|motteuses/i.test(name);
}

function resourceFor(kind, name, category) {
  if (category === 'alimentaire' && /crate|shelf/.test(kind) && /lot|conserv|scell|farin|ingréd|poudr|boîte|pot|biscuit|bouillon|emball/.test(name.toLowerCase())) return 'food';
  if (category === 'agriculture' && kind === 'crate' && /récolt|graines|fourrag|rations|fruits|racines|légume|bulbe|tubercule|œufs/.test(name.toLowerCase())) return 'food';
  return KIND_RESOURCES[kind] || 'scrap';
}

function makeRecord(line, index) {
  const [category, name, ...stages] = line.split('|');
  const settings = CATEGORIES[category];
  const id = 'DW-' + (3501 + index);
  const technicalAgriculture = category === 'agriculture' && isTechnicalAgriculture(name);
  const stock = technicalAgriculture ? 'scrap' : settings.stock;
  const process = stages.map((s, i) => {
    const [title, kind] = s.split('~');
    const resource = resourceFor(kind, title, category);
    return {
      id: ['preparation', 'operation', 'verification'][i], name: title, z: 0,
      usage: `Ancienne étape « ${title} » du programme ${name.toLowerCase()}. Le poste conservé est représenté par ${KIND_LABELS[kind] || 'un meuble de travail'} ; l’arrêt de l’activité permet sa fouille, sans remise en production.`,
      resource, props: [{kind, resource}]
    };
  });
  const twoFloors = !/serre|poussinière|bergerie|chevrerie|nurserie|écurie|hivernage|tonte|vêlages/i.test(name) && index % 5 === 2;
  const levels = twoFloors ? [0, 1] : [0];
  const layout = ['axial', 'offset', 'cross', 'gallery'][index % 4];
  const greenhouse = category === 'agriculture' && /^Serre /.test(name);
  const roofFamily = greenhouse ? 'greenhouse' : category === 'agriculture' ? 'farm'
    : category === 'industrie' ? /Manufacture|Fabrique|Halle/.test(name) ? 'industrial' : 'workshop'
    : category === 'alimentaire' ? 'industrial' : /Maison|Station/.test(name) ? 'service' : 'industrial';
  const family = category === 'reseaux' && /récupér|réemploi|déchets|collecte|collectés|tri des emballages|tri des textiles|réemploi|reconditionnement|réparation des bacs/i.test(name)
    ? 'Industrie et production' : settings.family;
  const width = (category === 'industrie' ? 40 : category === 'agriculture' ? 34 : 38) + (index % 5) * 5;
  const height = (twoFloors ? 30 : 36) + Math.floor(index / 5) % 4 * 4;
  const stockLabel = stock === 'food' ? 'apports secs ou emballages fermés encore conservables' : stock === 'wood' ? 'pièces de bois et supports démontables' : 'pièces métalliques, fixations et petits outillages';
  const receiving = {
    id: 'reception', name: settings.intake, z: 0,
    usage: `Point d’arrivée des ${stockLabel} avant ${process[0].name.toLowerCase()}. Les caisses sont séparées du passage vers les autres postes.`,
    resource: stock, props: [{kind: 'crate', resource: stock}]
  };
  const outbound = {
    id: 'depart', name: settings.output, z: 0,
    usage: `Les anciens lots issus de ${process[2].name.toLowerCase()} attendaient ici leur enlèvement ; les reliquats restent des contenants finis près du retour arrière.`,
    resource: stock, props: [{kind: 'shelf', resource: stock}]
  };
  const maintenance = {
    id: 'maintenance', name: settings.maintenance, z: 0,
    usage: `Dépanner le matériel de ${process[1].name.toLowerCase()} était une tâche séparée du flux des lots. Les outils démontables occupent un établi accessible.`,
    resource: 'scrap', props: [{kind: category === 'alimentaire' ? 'sink' : 'workbench', resource: 'scrap'}]
  };
  const clothing = {
    id: 'vestiaire', name: settings.clothing, z: twoFloors ? 1 : 0,
    usage: `Déposer vêtements et effets personnels avant d’accéder à ${process[0].name.toLowerCase()}. Les armoires ont conservé du mobilier récupérable distinct des lots du lieu.`,
    resource: 'wood', props: [{kind: 'wardrobe', resource: 'wood'}]
  };
  const office = {
    id: 'archives', name: settings.office, z: twoFloors ? 1 : 0,
    usage: `Comparer les quantités passées par ${process[0].name.toLowerCase()} et ${process[2].name.toLowerCase()}. Les documents situent les contenants sans indiquer de contacts hors vision.`,
    resource: 'scrap', props: [{kind: 'desk', resource: 'scrap'}]
  };
  const spaces = [receiving, process[0], process[1], process[2], outbound, maintenance, clothing, office];
  const specialRisk = category === 'alimentaire'
    ? `Les anciens lots de ${name.toLowerCase()} doivent se lire par leurs emballages fermés ; aucune machine arrêtée ne transforme le butin en nouvelles rations.`
    : category === 'agriculture'
    ? /animal|bovin|chevr|bergi|avic|poules|poussin|vêlag|chevaux|écurie|troupeau|ovin|vétérinaire/.test(name.toLowerCase())
      ? `Les cases et postes de ${process[1].name.toLowerCase()} sont vides ; les traces d’évacuation n’annoncent ni bétail présent ni contagion animale simulée.`
      : `Les restes de ${process[0].name.toLowerCase()} distinguent outils, supports et stocks conservés ; les bacs et graines de décor n’offrent aucune récolte renouvelable.`
    : category === 'reseaux'
    ? `Les postes de ${process[1].name.toLowerCase()} sont consignés ou déposés ; aucune armoire, pompe ou conduite n’alimente un réseau fonctionnel.`
    : `Les outils de ${process[1].name.toLowerCase()} imposent une pièce plus large que le local de registre ; des marques de travail subsistent sans appareil en mouvement.`;
  const roofVariant = greenhouse
    ? 'Vitrages ternis et panneaux de réparation opaques conservent la silhouette d’une serre ; ils ne simulent ni chauffage ni culture.'
    : roofFamily === 'farm'
    ? 'Couverture rurale avec pan repris en métal et fermes conservées, sans changer le volume ni les identités de réserves.'
    : roofFamily === 'workshop'
    ? 'Toiture d’atelier à reprises de zinc et faîtage lisible, choisie comme variation visuelle sans fonction supplémentaire.'
    : 'Couverture technique dont les joints et panneaux réparés varient visuellement sans ajouter de pièces ou de stocks.';
  return {
    id, name, family,
    purpose: `${name} organisait ${process[0].name.toLowerCase()}, puis ${process[1].name.toLowerCase()} et ${process[2].name.toLowerCase()}. La réception, le poste central et les lots de départ demeurent séparés ; ce bâtiment abandonné est un programme d’exploration et de récupération, sans activité industrielle ou agricole automatique.`,
    architecture: {
      width, height, levels, layout, roofFamily,
      material: greenhouse ? 'Soubassement maçonné, châssis métalliques et couverture vitrée ternie avec des plaques opaques de réparation.' : settings.material[index % settings.material.length]
    },
    spaces,
    access: {
      public: `L’entrée avant rejoint le ${DISTRIBUTIONS[layout]} et donne accès à ${process[0].name.toLowerCase()} sans traverser la réserve de départ.`,
      service: `Le retour arrière dessert ${outbound.name.toLowerCase()} ; pièces, sacs et apports de ${name.toLowerCase()} empruntent le même axe réservé, sans transport à travers un mur.`,
      return: `Depuis ${process[2].name.toLowerCase()}, rejoindre le passage commun puis l’ouverture arrière ou l’entrée avant, et suivre le raccord jusqu’à la route.${twoFloors ? ' Le palier dessert le bureau et le vestiaire ; les lots lourds restent au rez-de-chaussée.' : ''}`,
      width_m: [2.4, 1.8, 2.8, 3.2][index % 4]
    },
    placement: {mode: settings.mode, biomes: [...settings.biomes], townKinds: [...settings.townKinds]},
    supplies: `Le reliquat de ${name.toLowerCase()} est réparti entre ${receiving.name.toLowerCase()}, ${outbound.name.toLowerCase()} et les postes nommés. ${stock === 'food' ? 'Seuls des apports secs ou des emballages conservés fournissent des rations ; les appareils donnent du matériel récupérable.' : 'Les pièces, outils et supports fournissent du matériel récupérable ; les effets du vestiaire restent distincts.'} Chaque prélèvement appartient à un contenant fini identifié par lieu et niveau ; quitter la région ou reprendre la sauvegarde ne recrée rien.`,
    risks: [
      `Le passage entre ${process[0].name.toLowerCase()} et ${process[1].name.toLowerCase()} doit être reconnu avant de remplir le sac : les contacts régionaux suivent les accès physiques existants.`,
      specialRisk,
      twoFloors ? 'Le bureau et le vestiaire d’étage exigent le palier réel ; l’escalier ne sert jamais à charger les lots lourds automatiquement.'
        : `Une tournée remplie dès ${receiving.name.toLowerCase()} impose un retour anticipé ; conserver une charge utile pour le matériel trouvé plus loin.`
    ],
    night: `Les prises, tableaux et anciens éclairages de ${name.toLowerCase()} sont des traces d’équipement. Seule une source lumineuse réellement portée ou posée éclaire le trajet entre ${process[0].name.toLowerCase()} et la sortie ; aucun luminaire peint ne révèle un contact derrière les murs ou à un autre niveau.`,
    variants: [
      roofVariant,
      `Traces propres à ${process[0].name.toLowerCase()} sous forme de marques d’usage et de lots interrompus ; elles ne remplacent pas l’appareil, n’ouvrent pas de nouvelle salle et ne doublent pas les réserves.`,
      `Réparation des parois autour de ${process[2].name.toLowerCase()} avec matière contrastée ; le plan, les ouvertures et les identités de contenants restent ceux du lieu sauvegardé.`
    ],
    interactions: [
      `Reconnaître ${process[0].name.toLowerCase()}, fouiller les contenants accessibles puis choisir le trajet de sortie selon la charge réellement portée.`,
      `Ramener les ${stock === 'food' ? 'rations conservées et pièces d’entretien' : 'pièces et supports récupérés'} à D-17 pour ravitailler, construire ou réparer avec les coûts du jeu.`,
      `Comparer ${process[2].name.toLowerCase()} au registre des lots pour préparer une tournée ciblée ; cette lecture n’accorde ni ressource ni connaissance de contacts hors vision.`
    ],
    qa: [
      `Parcourir depuis l’entrée ${process.map(s => s.name.toLowerCase()).join(', ')} puis revenir par l’ouverture réelle avec le rayon du joueur.`,
      `Vérifier le dégagement des meubles de ${maintenance.name.toLowerCase()} et de la réserve, sans réduction du ${DISTRIBUTIONS[layout]}.`,
      twoFloors ? 'Monter et descendre par le même escalier, atteindre les deux locaux d’étage et vérifier les collisions et la visibilité sur le bon niveau.'
        : 'Vérifier toutes les salles au rez-de-chaussée, sans ouverture dessinée absente du graphe de collision.',
      `Épuiser un contenant de ${outbound.name.toLowerCase()}, sauvegarder puis reprendre : même identité, mêmes ressources restantes et aucun redémarrage de machine.`
    ],
    story: `${settings.trace} La mention « ${process[0].name} » précède « ${process[1].name} » sur une fiche tachée ; le dernier lot vers « ${process[2].name} » n’a pas reçu son visa. Ces traces décrivent l’ancien usage de ${name.toLowerCase()}, sans présumer la présence de travailleurs, animaux ou survivants.`
  };
}

async function main() {
  const {validateLot} = await import(pathToFileURL(path.resolve(__dirname, '../validation.mjs')).href);
  const lines = SOURCE.trim().split('\n');
  const expected = {industrie: 85, agriculture: 80, reseaux: 55, alimentaire: 30};
  for (const [category, count] of Object.entries(expected)) {
    if (lines.filter(line => line.startsWith(category + '|')).length !== count) throw Error('Répartition incorrecte : ' + category);
  }
  const lot = {schemaVersion: 1, version: '1.58.0', count: 250, fiches: lines.map(makeRecord)};
  validateLot(lot, 'C');
  const destination = path.resolve(__dirname, '../PROGRAMMES_C.json');
  const serialized = JSON.stringify(lot, null, 2) + '\n';
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== serialized) fs.writeFileSync(destination, serialized);
  console.log('Lot C : 250 programmes indépendants validés, DW-3501 à DW-3750.');
}

if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
module.exports = {makeRecord};
