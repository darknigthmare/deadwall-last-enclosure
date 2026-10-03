# DEADWALL 1.21 — Horizons reconnus
## Renseignement régional, secteurs parcourus et tournées

**Compagnon de conception 1.6.0 · Jeu 1.21.0-rc.1 · Sauvegarde v18**

Ce guide décrit les fonctionnalités effectivement développées dans la 1.21. Il complète le codex externe de 500 lieux sans ajouter de faux niveaux au catalogue. Les 42 plans pilotes et les 458 conceptions non intégrées restent distincts. Les anciens guides et le lecteur des 500 fiches sont conservés ; ce document ne remplace pas leurs sources.

## 1. Partir avec une raison de choisir une direction

La région existante contient six agglomérations et des installations entre elles. Jusqu’à présent, le bureau d’expédition renseignait surtout les anciennes destinations locales. La 1.21 permet de confier à son analyste un secteur de la grande région. Le résultat est une liste de lieux signalés, et non une révélation intégrale de la carte.

La chaîne devient : affecter un ouvrier au bureau, choisir une zone, financer le dossier, attendre son travail effectif, consulter les indices, préparer une tournée, rejoindre les lieux, confirmer leur présence, fouiller puis rentrer avec les ressources réellement transportées. Le renseignement sert à prendre une décision, pas à remplacer les déplacements.

Les six secteurs sont rattachés aux agglomérations déjà présentes : Les Verrières, Val-des-Ormes, Saint-Roch, La Briqueterie, Moulin-Neuf et Bois-Mort. Chaque parcelle est associée à l’agglomération la plus proche. Cela n’ajoute aucune route ni aucun bâtiment à la génération.

## 2. Le même analyste, au même bureau

La recherche réutilise l’ouvrier affecté par le système d’expéditions. Il n’y a pas un second employé abstrait. Les règles existantes de logement, d’affectation, de déplacement, de repli, de danger et d’alimentation du bureau continuent de s’appliquer.

| Paramètre | Valeur de la 1.21 |
|---|---:|
| Coût de préparation du dossier régional | 5 rations |
| Travail effectif nécessaire | 40 secondes |
| Signalements par dossier | Jusqu’à 3 |
| Dossiers régionaux simultanés | 1 |
| Coût d’affectation de l’analyste | Coût existant : 2 rations |

L’ouvrier doit atteindre son bureau, qui doit être achevé, alimenté et disponible. La progression n’avance ni pendant la pause ni dans le menu de commandement. Le travail attend pendant les déplacements, une panne ou une situation dangereuse. Le passage à la nuit peut provoquer le repli prévu par les expéditions ; le dossier reste suspendu jusqu’à ce qu’un analyste disponible travaille à nouveau au bureau.

Un dossier régional occupe le créneau de travail de l’analyste : il ne produit pas simultanément des points de renseignement générique. Après achèvement ou abandon, l’activité ordinaire peut reprendre.

Les cinq rations sont payées une seule fois au lancement. L’abandon ne les rembourse pas. Une nouvelle affectation éventuelle de l’ouvrier garde son coût existant, mais n’entraîne pas une nouvelle facturation du dossier conservé.

## 3. Un signalement n’est pas une découverte

Le bureau sélectionne des parcelles existantes, encore inconnues du joueur et absentes des signalements précédents. La sélection est déterministe : consulter le menu ou recharger la partie ne tire pas une nouvelle liste plus favorable. Les cibles d’un travail en cours sont conservées dans la sauvegarde.

Avant la visite, le signalement affiche un identifiant d’indice, une catégorie d’activité supposée et une zone approximative. Le nom exact, les dimensions du bâtiment et ses réserves ne sont pas donnés. La marque se trouve à 28 mètres du centre réel selon un angle déterministe, avec une zone affichée de 65 mètres de rayon. Elle décrit un secteur à inspecter, pas un point certifié praticable.

Les catégories proviennent de la fonction ancienne du lieu : habitat, ravitaillement, soins, mobilité, matériaux ou services. Elles ne sont pas calculées en inspectant le butin restant. Une pharmacie déjà vide ne doit pas être présentée comme une réserve certaine de médicaments.

La découverte physique conserve les règles de proximité de la région. Dès que le jeu confirme le lieu, sa fiche peut présenter son nom et sa position habituels. Le signalement ne double pas le butin et n’offre aucune ressource. Un lieu découvert pendant que le dossier est encore étudié ne reçoit pas un indice inutile au moment de la conclusion.

## 4. Cartographier ce qui a réellement été parcouru

Un calque facultatif distingue les secteurs dans lesquels le commandant est effectivement passé. La grille est de 64 × 64 secteurs de 128 mètres, couvrant les 8 192 mètres de côté de la région.

Le suivi enregistre seulement la cellule occupée pendant la simulation active, à pied ou en véhicule, au niveau extérieur. Regarder une zone sur l’atlas ne la marque pas comme parcourue. Un étage ou un sous-sol n’étend pas artificiellement le suivi de surface. La pause et le chargement ne produisent pas de nouvelles cellules.

**Une cellule parcourue n’est pas une cellule intégralement fouillée.** Le calque ne signifie ni « terrain sûr » ni « tous les objets récupérés ». Il complète les notes du carnet, sans les remplacer. Les passages antérieurs à la migration ne sont pas reconstruits de façon fictive : le nouveau registre commence vide, tandis que les découvertes déjà enregistrées restent conservées.

## 5. Préparer une tournée de plusieurs étapes

La feuille de route accepte jusqu’à six étapes distinctes. Un lieu confirmé ou un indice du bureau peut y entrer ; un identifiant de parcelle totalement inconnu est refusé.

Avant le départ, le joueur peut réordonner les étapes. Pendant une tournée active, il peut passer explicitement à la suivante, mettre la tournée en pause ou retirer une étape. La reprise d’une tournée suspendue garde le prochain arrêt. Relancer une tournée terminée repart de sa première étape.

Le passage à l’étape suivante ne déclare jamais le lieu « fouillé » ou « sécurisé ». Il s’agit d’une décision d’itinéraire, pas d’un résultat de gameplay. Aucun contrat rémunéré, aucune récompense de fin et aucun crédit de ressources ne sont attachés au simple changement d’étape.

La tournée active remplace temporairement le guide régional vers le repère unique. Les notes et le repère existants sont conservés ; ils ne sont pas supprimés. Une fois la tournée arrêtée, le système de repère habituel reste disponible.

## 6. Le tracé et le budget ne commandent pas le véhicule

Le joueur choisit le mode piéton ou break et une jonction de départ/retour. À D-17, le tracé régional commence à cette jonction. Dans la région, il part du commandant ou du véhicule réellement présent, selon le mode choisi.

Les segments utilisent le réseau extérieur déjà employé par les chemins du retour : ils ne doivent pas couper à travers la copie régionale non simulée de D-17. Les raccordements à un indice peuvent rester approximatifs. Un chemin dessiné n’est pas un test complet de collision de toute la route.

Pour le break, le budget additionne les déplacements entre les étapes restantes et le retour à la jonction choisie, au débit régional existant de 0,004 unité par mètre. Il applique ensuite la marge de détour de 25 % et la réserve fixe du panneau Sac & relais.

**Le budget de tournée couvre seulement la boucle régionale.** Il n’additionne pas les déplacements locaux jusqu’à la sortie de D-17 ni la livraison intérieure finale. Utiliser le contrôle « Jusqu’au dépôt » pour cette dernière portion, qui possède ses propres collisions et son débit local historique. L’interface signale cette distinction au lieu de mélanger deux estimations incompatibles.

Consulter le calcul ne consomme pas d’essence. Le véhicule reste conduit avec les commandes habituelles. La tournée ne collecte pas, ne ravitaille pas, ne traverse pas les murs et ne ramène pas automatiquement la cargaison.

## 7. Interface : un carnet dans le dossier existant

Le panneau **Renseignement & tournées** est placé dans Carte & exploration. Il rassemble l’état du bureau, le choix du secteur, la progression du dossier, la liste des indices, les lieux confirmés et la feuille de route.

La recherche textuelle ignore les accents. Les cartes sont paginées par douze. Les filtres distinguent les signalements non confirmés, les lieux effectivement connus et leur réunion. Une action « Voir la zone » cadre l’atlas sans déplacer le commandant.

Les trois nouveaux calques sont les indices du bureau, la tournée et les secteurs parcourus. La cité conserve sa projection de 128 × 128 mètres et ses règles d’inspection. Le HUD régional affiche seulement l’étape courante et deux accès contextuels ; aucun dossier permanent supplémentaire n’est ajouté au commandement.

## 8. Sauvegarde v18 et correction de compatibilité

Le nouveau registre `fieldAtlas` contient les cellules parcourues, les signalements, le dossier en cours et la tournée. Les anciennes sauvegardes v1 à v17 reçoivent un registre vide, sans nourriture, carburant, découverte ou indice offert. Les générations de monde 1, 2 et 3 ne sont pas remplacées.

Le validateur vérifie les identifiants, leur secteur réel, l’unicité des indices, les bornes de progression, les six étapes au maximum et l’existence de chaque arrêt dans les lieux confirmés ou signalés. Un dossier falsifié doit être rejeté avant le remplacement de la campagne.

Les tests ont révélé un défaut de compatibilité du chargement des relais : ce module acceptait explicitement la seule v17 et ne retenait plus son stock avec une entrée v18. Le contrôle reconnaît maintenant les formats supportés à partir de v17. Les anciens tests de stocks et de reprises sont conservés et rejoués ; cette correction ne supprime pas leurs vérifications.

Conserver un export avant transfert. La 1.20 ne peut pas relire la sauvegarde v18 de cette version.

## 9. Contrat pour les prochaines générations

Les valeurs d’équilibrage sont centralisées dans `core.js`. Le registre et son validateur se trouvent dans `field-atlas-state.js`, les transitions et le travail dans `field-atlas.js`, les marques dans `field-atlas-art.js` et l’interface dans `field-atlas-ui.js`.

Ne pas faire progresser le dossier depuis le rendu. Ne pas lire les stocks cachés pour produire une promesse de butin. Ne pas créer une autre identité d’ouvrier. Ne pas marquer des cellules pendant un déplacement de caméra. Ne pas déclarer une étape fouillée parce qu’elle est passée dans l’ordre de route.

Une extension doit conserver les reprises partielles, les rations déjà payées, le relais initialement vidé et la distinction entre budget régional et dernier trajet local. Les fonctionnalités futures comme les faux renseignements, les patrouilles autonomes ou les équipes envoyées dans la région ne sont pas livrées par ce simple carnet.

## 10. Vérification et portée de la livraison

Les tests de cette passe vérifient le travail réellement effectué au bureau, la pause, la panne, le repli, le coût, l’absence de double production, les indices uniques, leur confirmation physique, les secteurs occupés, la limite de six étapes, la reprise et les imports invalides. Quatre parcours Chromium manipulent aussi les commandes de bureau, de carte et de tournée, dont un parcours tactile.

Les scènes avancées préparent explicitement le bureau, les provisions, le véhicule ou le point d’approche nécessaires. Le temps de simulation est piloté. Cela ne constitue pas quatre joueurs humains ni une garantie de performance sur tout appareil.

Cette version ne construit pas la cité sur toute la région, ne modifie pas la surface de D-17 et n’ajoute pas de nouveaux plans architecturaux. Les 500 fiches du codex restent une base de conception, dont 42 seulement sont reliées aux plans pilotes du moteur.
