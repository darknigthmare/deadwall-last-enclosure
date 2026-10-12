# Passe 170 — Postes de travail et stockage au sol

Cette passe prolonge la révision 7 de `884eb2b6bf0e038f53a1d2c0581ff6353a6981ed`. La synchronisation doit conserver main 1.57.2, `c7174caa3a7fe3eea0a3f28acd9b49a8ebab410c`, notamment l'arrivée D-17 et l'identité des campagnes.

## Placement physique

La révision optionnelle 8 ajoute les minima auteur des machines, palettes et caisses. Les quantités existantes sont attribuées une seule fois. Dimensions et dégagements proviennent de la source. Les limites centrales `CodexInfill169Rules` sont conservées : 24 ajouts par plan, six par espace, trois par prescription, 28 poses candidates.

Une machine exige un sol intérieur approprié au rez-de-chaussée et quatre faces de maintenance accessibles. Aucune charge porteuse n'est supposée pour un étage. Les palettes et caisses restent au sol avec une face de manutention. À l'extérieur, seules les zones de service déjà attribuées par la révision 7 sont utilisées ; aucun quai ou jardin nouveau n'est inventé.

Les plans, stocks, anciennes couches, accès de service, escaliers et voitures garées tournées sont préservés. Les nouveaux volumes sont reliés aux collisions, lignes de visée et gabarits automobiles. Les images utilisent les atlas existants, tournés et découpés dans leur propre emprise.

**Aucun nouveau butin, courant, production industrielle, son ou interaction automatique.** Les machines sont des équipements statiques non alimentés, pas des usines fonctionnelles. Ports, tunnels, échangeurs et espaces natifs manquants restent distincts de cette couche.

## Activation et inspection

Au dépôt : **Monde & relais → COMPLÉTER ATELIERS ET STOCKAGES**. Le contrôleur préserve les protections de camps, véhicules et possessions. Restauration refusée, mains occupées et nouvelle activation identique ne produisent pas de faux succès. Les révisions 0 à 7 restent inchangées.

Dans l'inspecteur : case **Compléter ateliers et stockages — révision 8**. Elle active les couches nécessaires sans réinitialiser les choix précédents ; la décocher rend la comparaison antérieure. Le bilan distingue les objets posés, les minima résolus et les refus. La rotation à 90° n'est plus confondue avec un changement de dimensions au sol dans ce bilan.

## Mesure locale sur la base 884eb2b, avant synchronisation main

Graine 17117, révisions 7 et 8 : 3 000 programmes classés, 2 374 recettes et 2 951 étages comparés. **342 objets ajoutés : 190 palettes, 141 machines, 11 caisses ; 340 en intérieur, deux en zones de service extérieures.** Les minima non satisfaits passent de **3 056 à 2 716**, soit 340 unités résolues, sans nouveau butin. 132 unités demandées à cette couche restent refusées faute de place ou d'accès.

Ces nombres incluent les recettes héritées, pas autant d'architectures ou d'assets indépendants. Les résultats après fusion et les contrôles navigateur sont à confirmer dans le rapport du commit réellement publié.

## Commandes de contrôle

```sh
npm ci
npm run build
node --test --test-concurrency=1 tests/codex-stations170.test.cjs tests/codex-infill*.test.cjs tests/codex-fill168*.test.cjs tests/codex-coverage*.test.cjs tests/distribution.test.cjs
node scripts/audit-stations170.mjs
node scripts/browser-stations170.mjs
npm run test:arrival
npm run check
```

Une réussite ciblée n'est pas une validation de toute la suite. Les scènes préparées de tests ne remplacent pas une campagne explorée humainement ; les mobiles de Chromium sont émulés.
