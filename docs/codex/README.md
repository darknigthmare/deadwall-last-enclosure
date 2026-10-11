# Codex modulaire DEADWALL — 1.33


Le codex se lit à trois niveaux :

- **Guide intégré « ATLAS & GUIDE »** : fiches de milieux, lieux, routes et systèmes, recherche sans accents, filtres de famille et de couverture ; les 215 fiches de la base 1.33 sont complétées par les 62 profils G7 enrichis.
- **Codex 3 000 dans le runtime** : les 3 000 programmes sont compilés et consultables dans le guide. G8 utilise leurs plans métriques pour implanter les programmes compatibles avec la graine et le terrain. Le nombre de lieux construits varie ; chaque programme consultable n'est pas forcément implanté dans une région.
- **Compagnon auteur 3 000 fiches** : les 1 000 fiches historiques restent intactes ; 2 000 compositions les prolongent par un contexte et un état explicitement reliés. Les sources et leurs références d'emprise et de niveaux sont conservées ; les plans jouables indiquent leurs adaptations.

Les modules partagés couvrent petites et grandes forêts, montagnes, plages, ports, rivières, marais, neige, fermes, villages, villes, métropoles, quartiers, camps, activités, loisirs, mines, carrières, énergie et logistique. Chaque fiche comprend accès, ressources, risques, nuit, variantes, interactions et critères QA.

| Fichier | Contenu |
|---|---|
| [NATURE.md](NATURE.md) | 14 milieux et compositions naturelles |
| [HABITAT.md](HABITAT.md) | Habitat, agglomérations et camps |
| [ACTIVITES.md](ACTIVITES.md) | Services, activités, extraction et transport |
| [SYSTEMES.md](SYSTEMES.md) | Survie, mobilité, lumière, défense, états et sauvegarde |
| [CONTRATS.md](CONTRATS.md) | Assemblage, interfaces, ressources, nuit et validation |
| [ROUTES_1_33.md](ROUTES_1_33.md) | Réseau, chemins, routes, ouvrages, raccords, végétation et probabilités proposées |
| [ROUTES_PROFILS_1_33.md](ROUTES_PROFILS_1_33.md) | 51 profils routiers et 204 formes ; 48 programmes de conception, trois descriptions partielles du présent |

Source des fiches de systèmes et milieux : `src/world-codex-{nature,habitat,activites,systemes}.js`, avec `src/road-profiles133.js` pour les 51 profils routiers raccordés au pack activités et `src/world-codex-seed157.js` pour les profils G7. `scripts/compile-codex3000.mjs` compile les sources auteur dans `src/codex3000-live-data.js`, utilisé par le runtime et les fiches de programmes. La consultation du guide ne modifie ni génération ni sauvegarde ; l'extension physique G8 est une action distincte au dépôt. Les anciens dossiers et les 12 fiches D-17 restent disponibles. Le lecteur du compagnon est autonome et ne charge rien depuis Internet.

Statuts : `jouable` = fonction disponible ; `pilote` = présence partielle ; `plan` = proposition non annoncée comme jouable ; `programme` = fiche du catalogue compilé, sans déclaration de présence sur le terrain. Les 62 gabarits régionaux G7 sont enrichis sans remplacer leurs plans historiques. Les plans natifs G8 adaptent les emprises et conservent au plus trois niveaux jouables pour les programmes actuels ; les niveaux auteur supplémentaires restent explicitement dans la provenance.

Les cinq modules d’opérations 1.27 sont décrits dans SYSTEMES.md et consultables dans le guide en jeu. Le catalogue compagnon de 3 000 fiches reste inchangé.

## Extension 1.31

Le guide ajoute 96 compositions contextuelles et quatre fiches de règles effectives. [Occupation et génération](GENERATEUR_1_31.md) distingue les probabilités par site, les exclusions et les systèmes réellement intégrés. [Compositions](COMPOSITIONS_1_31.md) détaille 24 milieux × quatre programmes : ce contenu de conception reste filtré par défaut. Les chiffres de probabilité sont exportés dans [SPAWNS_1_31.csv](SPAWNS_1_31.csv).

## Extension 1.33

Les [contrats routiers](ROUTES_1_33.md) séparent chaussées, emprises, sens, hauteurs, surfaces et transitions. Ils couvrent chemins, campagnes, départementales, autoroutes 2 × 2 / 2 × 3 / 2 × 4, carrefours, giratoires, échanges, ponts, tunnels et aires. Les probabilités routières de conception restent hors générateur ; la présence de ces fiches n’active aucun pont, tunnel ni faction humaine. Le [lecteur autonome de l’addendum](../../codex-3000/addendum-1.33/LIRE_ROUTES.html) conserve recherche, regroupement et filtre de disponibilité sans modifier le compagnon historique.

## Addendum 1.57 — variantes de seed jouables

[Voir la matrice de génération détaillée](SEED_DETAIL_1_57.md). L'Atlas ajoute **62 fiches** propres aux **62 gabarits régionaux G7**. Les 17 familles et 86 variantes combinent jardins, clôtures avec ouverture, piscine unique selon la parcelle, meubles et cours cohérents par activité, ainsi que des reprises de chaussée. Les **3 000 programmes compilés** sont également consultables ; G8 implante ceux qui trouvent un terrain, une route, un accès et une emprise compatibles. Ce filtrage ne garantit pas 3 000 nouveaux bâtiments et ne crée pas les autoroutes dénivelées, ponts, tunnels ou autres supports encore absents.

L'activation volontaire exige G7, le commandant disponible au dépôt de D-17, aucun travail en cours et un rechargement terminé. Elle refuse de recouvrir un bivouac, un éclairage posé ou la voiture, sans coût ni suppression. Les lieux historiques, stocks et prélèvements sont conservés ; les relevés sectoriels déjà payés couvrent leurs nouveaux sites sans donner leurs ressources.

Le champ régional optionnel `frontier.detailVersion` conserve les collisions anciennes à **0** lorsqu'il est absent d'une sauvegarde ; une nouvelle campagne utilise **1** pour les détails physiques. Les nouveaux sites G8 ont leurs détails solides dès leur création. Les reprises historiques ne sont donc pas enfermées par les nouveaux props d'un ancien lieu.
