# Codex 3000 — programmes détaillés et aménagements optionnels

Base : DEADWALL 1.57.0, commit 68e91f294b71eef32b27497dca05d2028db3f902.

## Catalogue complet, sans confondre fiches et lieux jouables

Les 3 000 identifiants existants disposent d’un programme détaillé résolu depuis leurs sources originales : 1 000 parents et deux compositions par parent. Les sources comprennent 4 560 espaces, dont 637 espaces extérieurs identifiés, et 6 039 références de mobilier auteur. Leur réutilisation dans les trois versions donne 13 680 références d’espaces et 18 117 références de mobilier : ce ne sont pas autant de nouvelles architectures ou de nouveaux sprites indépendants.

Le compilateur conserve les noms, quantités, dimensions, ancrages, rotations, dégagements, surfaces et répétitions, les graphes d’accès, les budgets de ressources, les états et prescriptions causales. Aucun des fichiers originaux n’est réécrit. Pour le supplément dont la classification intérieur/extérieur était absente, la déduction par le nom est explicitement signalée.

## Kits d’usage et variantes de jardins

27 kits couvrent salle d’eau, buanderie, cuisine, cellier, chambre, séjour, restauration, garage, atelier, soins, pharmacie, chenil, classe, bibliothèque, bureaux, commerce, accueil, stockage, vestiaires, technique, sport, secours, jardin, livraison, voirie, extérieur et service générique. Chaque kit donne mobilier principal et secondaire, inventaire d’usage et dégagement proposé.

12 jardins : fleuri, potager, terrasse, familial avec jeux, verger, piscine, serre, cour de bricolage, étendoir, friche, jardin partagé et cour de repos. Les pools de cour sont spécifiques aux 17 familles fonctionnelles du moteur. Une petite parcelle ne reçoit pas une piscine hors gabarit ; une piscine, serre, remise ou aire de jeux n’est pas dupliquée pour remplir artificiellement le terrain.

Les chiffres métriques sont des paramètres de conception de jeu, pas des normes de construction réelle.

## Activation dans le jeu

Au dépôt D-17, dans Monde & relais, utiliser **ACTIVER LES AMÉNAGEMENTS DÉTAILLÉS**. Les cartes G7 et G8 sont admises. Le commandant doit être disponible et avoir terminé son rechargement. Cette action explicite enregistre `frontier.detailVersion = 2` ; les sauvegardes sans drapeau et la version 1 ne sont pas densifiées silencieusement.

L’action compare la géométrie avant/après pour les véhicules et les possessions régionales examinées. Une incompatibilité refuse l’activation au lieu de téléporter ou supprimer le bien. L’enrichissement ne coûte ni ne donne de ressource : c’est une option de contenu, pas une construction gratuite. Les plans, bâtiments, routes, escaliers et contenants historiques ne sont pas remplacés.

## Placement et accès

La couche peut tenter quatre emplacements par pièce et dix emplacements de cour, avec un plafond de 32 objets supplémentaires par plan. Chaque tirage dépend de la graine, du site, de l’étage et du slot ; aucune consommation du générateur de combat.

Les objets refusent les chevauchements avec les murs, escaliers, anciens meubles, voitures, accès et sorties. Les espaces identifiés comme extérieurs ne reçoivent pas les nouveaux équipements intérieurs. Les nouveaux objets n’ont ni `amount` ni `resource` et ne deviennent pas de nouveaux contenants de loot.

Un contrôle conservateur à maille 0,4 m et rayon 0,34 m conserve les points d’accès déjà joignables : centres de pièces, paliers, entrée/sortie et côtés de contenants. Les meubles solides qui coupent ces trajets sont retirés dans un ordre déterministe. Ce contrôle raster ne constitue pas une preuve exhaustive de navigation continue, de conduite, ou de toutes les configurations de possession. La collision effective reste celle du moteur.

## Atlas et distribution

Dans ATLAS & GUIDE, sélectionner **Les 3 000 programmes**, chercher un identifiant et ouvrir ses détails. Les pièces, leurs meubles sources, les cours, jardins et états sont affichés à l’ouverture seulement. La pagination reste bornée et une réouverture n’ajoute pas une deuxième copie du programme.

Les paragraphes identiques sont mutualisés sans perte. Le module généré `src/codex3000-live-data.js` est désormais ignoré dans Git et reconstruit par les commandes existantes `npm start`, `npm test` et `npm run build`. Après un clone propre, ne pas ouvrir directement index.html sans compilation. Le build web et autonome embarque le module complet ; aucun chargement Internet supplémentaire des sources n’est requis.

## Validation et limites

Les tests ajoutés vérifient les 3 000 programmes contre les données auteur, les kits et jardins, trois graines sur les 62 gabarits et leurs étages, la conservation de la géométrie et des stocks, le cache, et l’activation atomique au dépôt. Le test historique des drapeaux invalides est adapté : 2 devient une version autorisée, 3 reste refusé.

La vérification générale doit être verte avant fusion. Une suite ciblée ne remplace pas l’ensemble de `npm run check`, ni la QA Windows et navigateur. Les résultats effectifs et limitations de cette session sont consignés dans la description de la PR.

Les géométries G8 restent des plans simplifiés. Ce travail ne reconstruit pas tous les centres commerciaux, ports, tunnels, ponts et quartiers en architectures natives exhaustives. Les équipements sans système physique restent des prescriptions identifiées. Les sprites existants de la version 1.57 sont réutilisés ; aucun nouveau lot PNG n’est revendiqué.
