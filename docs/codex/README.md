# Codex modulaire DEADWALL — 1.33


Le codex se lit à deux niveaux :

- **Guide intégré « ATLAS & GUIDE »** : 215 fiches de milieux, lieux, routes et systèmes, recherche sans accents, filtres de famille et de couverture. Les projets futurs sont masqués par défaut.
- **Compagnon de conception 3 000 fiches** : les 1 000 fiches historiques restent intactes ; 2 000 compositions les prolongent par un contexte et un état explicitement reliés. Il s’agit de programmes de conception, pas de 3 000 lieux nouveaux jouables.

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

Source de vérité des fiches : `src/world-codex-{nature,habitat,activites,systemes}.js`, avec `src/road-profiles133.js` pour les 51 profils routiers raccordés au pack activités. Le guide ne modifie ni génération ni sauvegarde. Les anciens dossiers et les 12 fiches D-17 restent disponibles. Le lecteur du compagnon est autonome et ne charge rien depuis Internet.

Statuts : `jouable` = fonction disponible ; `pilote` = présence partielle ; `plan` = proposition non annoncée comme jouable. Les 62 gabarits régionaux sont des plans simplifiés, pas l’intégralité de leurs programmes de conception.

Les cinq modules d’opérations 1.27 sont décrits dans SYSTEMES.md et consultables dans le guide en jeu. Le catalogue compagnon de 3 000 fiches reste inchangé.

## Extension 1.31

Le guide ajoute 96 compositions contextuelles et quatre fiches de règles effectives. [Occupation et génération](GENERATEUR_1_31.md) distingue les probabilités par site, les exclusions et les systèmes réellement intégrés. [Compositions](COMPOSITIONS_1_31.md) détaille 24 milieux × quatre programmes : ce contenu de conception reste filtré par défaut. Les chiffres de probabilité sont exportés dans [SPAWNS_1_31.csv](SPAWNS_1_31.csv).

## Extension 1.33

Les [contrats routiers](ROUTES_1_33.md) séparent chaussées, emprises, sens, hauteurs, surfaces et transitions. Ils couvrent chemins, campagnes, départementales, autoroutes 2 × 2 / 2 × 3 / 2 × 4, carrefours, giratoires, échanges, ponts, tunnels et aires. Les probabilités routières de conception restent hors générateur ; la présence de ces fiches n’active aucun pont, tunnel ni faction humaine. Le [lecteur autonome de l’addendum](../../codex-3000/addendum-1.33/LIRE_ROUTES.html) conserve recherche, regroupement et filtre de disponibilité sans modifier le compagnon historique.
