# DEADWALL 1.71 — Codex mondial et parcours verticaux

Le Guide auteur passe de 39 types et 1 950 plans à **80 types et 4 000 plans métriques**, avec 50 variantes par type et **13 générateurs** dans un registre commun. Les **2 050 nouveaux plans** complètent les cinq familles suivantes :

| Famille | Nouveaux types | Nouveaux plans |
| --- | ---: | ---: |
| [Ports, offshore et îles](codex/suivi-monde2026/PORTS_ILES_2026.md) | 11 | 550 |
| [Ponts et échangeurs](codex/suivi-monde2026/PONTS_ECHANGEURS_2026.md) | 8 | 400 |
| [HLM et réseaux souterrains](codex/suivi-monde2026/HLM_ASSAINISSEMENT_2026.md) | 8 | 400 |
| [Parcs et sports](codex/suivi-monde2026/PARCS_SPORTS_2026.md) | 6 | 300 |
| [Aéroports et ferroviaire](codex/suivi-monde2026/AEROPORTS_RAIL_2026.md) | 8 | 400 |

Ces dimensions sont des compositions auteur originales exprimées en mètres, distinctes des cotes publiées dans les références. Les variantes changent la géométrie et la disposition ; le mobilier conserve ses dimensions de catalogue, et une prescription qui ne tient pas reste refusée.

## Sous-sols, étages et passages

Les plans terrestres peuvent déclarer leurs sous-sols, étages, altitudes et hauteurs libres. Chaque pièce, porte, meuble et obstacle appartient à son vrai niveau. Le piéton doit rejoindre un palier et emprunter l’escalier ou l’échelle déclaré pour changer de niveau. Les circulations et supports sont explicites : le vide autour d’une coursive ne devient pas un sol et deux portes superposées ne créent pas de raccourci.

Dans le Guide auteur (`?tools=1`), les flèches, ZQSD ou WASD déplacent le gabarit ; **E** ou **EMPRUNTER LE PASSAGE** utilise une transition à proximité. Le choix d’un étage change seulement la vue générale. La mémorisation de cette inspection reste distincte de la sauvegarde de campagne.

Les logements HLM possèdent leurs pièces privées, coursives, caves et noyaux d’escalier. Les réseaux d’assainissement distinguent les galeries sèches parcourables et les canaux fermés à leur profondeur déclarée. Leur diagramme hydraulique ne simule ni débit, ni potabilité, ni pompe en fonctionnement.

## Voies de transport à leur échelle

Les tabliers, rampes, pistes, taxiways et voies ferrées sont représentés avec leurs longueurs, largeurs et altitudes auteur. Une piste de plusieurs kilomètres conserve cette longueur dans le plan ; un bâtiment de service et ses meubles ne grandissent pas avec l’ouvrage. Un croisement de traits à des altitudes différentes ne crée aucune jonction.

Le graphe de transport est **fermé et non opérationnel**. Les accès piétons inspectables ont leur propre réseau ; les réservations interdites restent des obstacles. Les raccords extérieurs sont déclarés non connectés au monde. Cette livraison ne met en circulation ni train, ni avion, ni véhicule sur ces tracés, et ne qualifie pas leur exploitation réelle.

## Mobilier lisible dans l’inspection

Les **58 sortes de mobilier** disposent chacune de **trois variantes cosmétiques déterministes**, soit **174 pictogrammes procéduraux originaux**. Lits et couchettes, sièges, bureaux, rangements, cuisine, sanitaires, électricité, pompes et machines agricoles ou industrielles sont différenciés. Les détails apparaissent selon le zoom ; les marques restent dans l’emprise réelle, y compris après rotation.

Le rendu utilise les coordonnées et dimensions de chaque objet sans modifier sa collision. Il ne charge aucune image externe et ne consomme pas le hasard de campagne. Ces pictogrammes facilitent la lecture des plans : les sprites et animations définitifs de campagne restent à produire et à qualifier.

## Nouvelle partie sur une seed encombrée

La seed `628472550` pouvait bloquer la création de campagne : plusieurs placements de proximité occupaient des parcelles nécessaires aux derniers grands décors. Un secours compact se déclenche uniquement après l’échec des recherches existantes. Ses 48 positions restent privées jusqu’à validation de l’ensemble avec les mêmes marges, toitures, routes et obstacles. Les identifiants, dimensions et stocks finis sont conservés, et les positions sauvegardées restent prioritaires à la reprise. Les cartes qui réussissaient déjà gardent leur placement habituel.

## Portée et qualification

Les défauts reproduits et les contrôles de réception sont décrits dans [l’audit 1.71](AUDIT_1_71.md). Le cache hors ligne identifie la nouvelle version et inclut le module de pictogrammes ; une vérification impose la présence de tous les scripts et styles publics dans ce cache.

**Aucun nouveau lieu jouable en campagne n’est ajouté par ces 2 050 plans.** L’implantation dans les seeds, le raccord au terrain, les budgets de butin fini, les rencontres, les services opérationnels, les graphismes définitifs et la persistance de campagne restent des étapes ouvertes. Un appareil dessiné n’est ni alimenté, ni productif, ni porteur d’un stock gratuit. Les 4 000 plans d’inspection ne doivent pas être confondus avec 4 000 nouveaux sites disponibles dans une partie.

Le rapport exhaustif accepte les **4 000 plans**, avec **162 460 pièces meublées, 583 708 équipements et 4 670 prescriptions refusées**. Les **2 050 nouveaux plans ont zéro refus** ; les 1 950 enregistrements antérieurs restent identiques. Le suivi conserve ses 80 typologies, 4 000 objectifs et 800 tâches : **3 validées, 397 en cours, 400 à faire**. La production d’un plan ne valide pas toutes les étapes de sa fiche.

La validation ciblée du [module de pictogrammes](../src/codex-plan-art204.js) a réussi ses **10 tests natifs Canvas**, sans échec, annulation, test ignoré ou TODO. Elle vérifie le catalogue complet, les différences entre catégories et variantes, la reproductibilité, les rotations, l’absence de pixels hors emprise, les entrées invalides et la restitution de l’état du contexte. La planche de 174 pictogrammes a également été examinée visuellement. Ces résultats qualifient ce module, pas la totalité du jeu.

La correction du placement passe **24 tests natifs ciblés** (5 sur les parcelles et 19 sur l’accueil), un corpus supplémentaire de **six seeds**, et **17 contrôles Chromium** du démarrage réel, de la sauvegarde et de « Continuer » sur ordinateur/mobile simulé. Les 42 contrôles du cache complet ont été rejoués avec succès après reconstruction. Les 29 sources du rapport auteur exhaustif sont inchangées par cette correction.

Les parcours Chromium sur la distribution reconstruite passent **414 contrôles du Guide** sur ordinateur/mobile et **42 contrôles hors ligne**. Les quatre formats du parcours général du jeu ont passé 179 contrôles. Le contrôle littéral complet avec endurance est exigé sur le commit final de la PR ; son reçu de CI et la vérification du déploiement restent des preuves distinctes de ces résultats locaux. Les scènes automatisées et les audits assistés ne mesurent ni une campagne humaine complète de 6 à 10 heures, ni la fluidité sur un téléphone physique.
