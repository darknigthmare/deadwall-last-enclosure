# DEADWALL — Extérieurs et cheminements, passe 162

## Portée livrée

Cette passe prolonge les programmes, le mobilier ancré et les prescriptions détaillées de la PR #2. Les 3 000 programmes, leurs 33 familles sources et les 62 gabarits historiques reçoivent une correspondance explicite avec 18 profils de sol et de cour. Elle ne crée pas 3 000 architectures natives supplémentaires.

Les profils distinguent maison, collectif, commerce, alimentation/restauration, atelier, hébergement, soins, administration, école, loisirs, logistique, industrie, agriculture, forêt, réseaux, transport, secours et ruines. Six matériaux sont disponibles : terre, gravier, dallage, béton, enrobé et gravats tassés.

Les maisons et fermes G8 n'utilisent plus automatiquement la présentation d'une cour de service simplement parce que leur type technique commence par `codex3000-`. Le métier du programme détermine le caractère naturel ou minéral des abords. Le terrain environnant, les sprites et la géométrie restent ceux du jeu.

## Chemins liés aux vrais équipements

Le module `src/codex-sites162.js` lit l'emprise principale, les meubles extérieurs, massifs, potagers, terrasses, piscines et voitures réellement présents. Les voitures tournées sont converties en emprises locales conservatrices à partir de leurs quatre coins. Le tracé n'est jamais une ligne directe aveugle entre l'entrée et le jardin.

Une grille métrique de 0,6 m recherche les passages libres, avec une réserve de sécurité de 0,52 m et une largeur peinte de 0,72 m. Le graphe suit les quatre directions et n'utilise aucun raccourci diagonal dans un angle. Six destinations au maximum sont recherchées : entrée arrière, sortie du jardin et jusqu'à quatre équipements prioritaires existants. Les portions communes sont partagées plutôt que peintes plusieurs fois.

Une clôture fermée n'est pas ouverte par cet embellissement. Si aucun passage acceptable n'existe, la destination est classée non raccordée et aucun chemin n'est dessiné à travers le mur, le massif ou le véhicule. Les nouveaux socles restent exactement sous les annexes ou équipements qu'ils soutiennent.

Le tracé est une présentation permanente de la parcelle, pas un système d'évitement temps réel de la voiture du joueur, des infectés ou des équipements mobiles. La grille conservatrice peut refuser un passage étroit ; elle ne remplace pas toutes les règles de navigation du jeu.

## Compatibilité et performances

Le calcul intervient dans la présentation du sol, jamais dans les boucles de collision. Le cache est limité à 24 parcelles par monde et suit la révision effective du détail. Les données sont immuables ; les plans, stocks, IDs, meubles et parkings sources ne sont pas modifiés.

Aucun nouveau collider, butin, bonus de vitesse, réseau routier ou champ de sauvegarde. Les anciens choix `detailVersion` 0, 1, 2 et 3 restent distincts. Cet habillage visuel s'applique sur les cartes G7/G8 sans une nouvelle activation physique. Le module est incorporé au bundle compilé existant : aucune requête de script supplémentaire ; le test de build sans installation vérifie sa source. Le cache PWA est actualisé.

L'action d'extension G8 vérifie maintenant que `restoreSave` renvoie réellement `true`. Un retour `false` ne publie plus un message de réussite et ne déclenche pas la sauvegarde de succès.

## Atlas

Le détail d'une fiche affiche désormais « EXTÉRIEURS ET CHEMINEMENTS », le profil, le matériau et sa limite de portée. Les prescriptions auteur, dimensions, ancrages et conditions de butin déjà ajoutées restent intactes. L'ouverture est paresseuse, sans duplication ni mutation de campagne.

## Contrôles

`node --test tests/codex-sites162.test.cjs` : sept tests réussis. Le contrôle géométrique couvre 186 parcelles (62 types × 3 graines), 53 153 segments et 904 destinations raccordées dans ce corpus. Ces nombres sont des cas de test, pas des modèles graphiques ou de nouveaux bâtiments.

`node scripts/browser-sites162.mjs` : deux formats Chromium, 1440 × 900 et 390 × 844, réussis sans erreur JavaScript de page. Contrôles réels de l'Atlas, lecture sans mutation, puis trois scènes préparées rendues par le peintre du jeu : maison G8 DW-0001, maraîchage et entrepôt. Chacune possède six destinations raccordées sur la graine 17117. Ce n'est pas une preuve d'acquisition naturelle en campagne ni une certification Windows.

Le parcours est intégré à la CI. Les résultats terminaux de la vérification générale, du navigateur/PWA et des tâches Windows sont consignés dans le commentaire de livraison de la PR avec leur révision exacte ; aucun compteur partiel ne constitue une réussite générale.

Les ports, tunnels, échangeurs dénivelés et grandes architectures non implantées restent des chantiers distincts. Leurs profils de surface documentés ne les rendent pas artificiellement jouables.
