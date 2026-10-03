# Codex modulaire DEADWALL — 1.26

Le codex se lit à deux niveaux :

- **Guide intégré « ATLAS & GUIDE »** : 59 fiches de milieux, lieux et systèmes, recherche sans accents, filtres de famille et de couverture. Les projets futurs sont masqués par défaut.
- **Compagnon de conception 3 000 fiches** : les 1 000 fiches historiques restent intactes ; 2 000 compositions les prolongent par un contexte et un état explicitement reliés. Il s’agit de programmes de conception, pas de 3 000 lieux nouveaux jouables.

Les modules partagés couvrent petites et grandes forêts, montagnes, plages, ports, rivières, marais, neige, fermes, villages, villes, métropoles, quartiers, camps, activités, loisirs, mines, carrières, énergie et logistique. Chaque fiche comprend accès, ressources, risques, nuit, variantes, interactions et critères QA.

| Fichier | Contenu |
|---|---|
| [NATURE.md](NATURE.md) | 14 milieux et compositions naturelles |
| [HABITAT.md](HABITAT.md) | Habitat, agglomérations et camps |
| [ACTIVITES.md](ACTIVITES.md) | Services, activités, extraction et transport |
| [SYSTEMES.md](SYSTEMES.md) | Survie, mobilité, lumière, défense, états et sauvegarde |
| [CONTRATS.md](CONTRATS.md) | Assemblage, interfaces, ressources, nuit et validation |

Source de vérité des 59 fiches : `src/world-codex-{nature,habitat,activites,systemes}.js`. Le guide ne modifie ni génération ni sauvegarde. Les anciens dossiers et les 12 fiches D-17 restent disponibles. Le lecteur du compagnon est autonome et ne charge rien depuis Internet.

Statuts : `jouable` = fonction disponible ; `pilote` = présence partielle ; `plan` = proposition non annoncée comme jouable. Les 62 gabarits régionaux sont des plans simplifiés, pas l’intégralité de leurs programmes de conception.
